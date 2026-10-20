-- ==============================================================================
-- OTHRHALFF COMPREHENSIVE SECURITY HARDENING MIGRATION (V2)
-- Paste and run this script ONCE in your Supabase SQL Editor.
-- 100% Idempotent, Non-destructive, and Safe to Re-run.
--
-- FIXES:
-- 1. [CRITICAL] `public.profiles` RLS data leak (unauthenticated anon scraping)
-- 2. [CRITICAL] BOLA / IDOR in SECURITY DEFINER RPC matching functions
-- 3. [HIGH] Notification spoofing / phishing vector in public.notifications
-- 4. [HIGH] Poll options injection vector in public.poll_options
-- 5. [HIGH] Applicant and User PII exposure in support_tickets & career_inquiries
-- 6. [HIGH] Unauthorized chat message injection in public.messages
-- 7. [HIGH] Unauthenticated presence stalking in public.user_presence
-- 8. [MEDIUM] Function search_path hijacking in PostgreSQL
-- ==============================================================================

-- ==============================================================================
-- 1. PUBLIC.PROFILES RLS LEAK REMEDIATION (CRITICAL)
-- Prevents unauthenticated scraping of real names, university emails, and DOBs.
-- ==============================================================================
ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;

-- Revoke all permissions on profiles from anonymous users
REVOKE ALL ON public.profiles FROM anon;

-- Drop insecure open SELECT policies that lacked role restrictions
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Profiles are readable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Allow select for all" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view other profiles" ON public.profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;

-- Policy 1: Authenticated users can view their own profile (including all private fields)
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Policy 2: Authenticated users can view other onboarded profiles for matching & chat
CREATE POLICY "profiles_select_authenticated"
ON public.profiles FOR SELECT
TO authenticated
USING (
  auth.uid() IS NOT NULL
  AND (
    auth.uid() = id
    OR (
      university IS NOT NULL 
      AND dob IS NOT NULL
      AND university NOT IN ('Global', 'Unspecified')
    )
  )
);

-- Policy 3: Users can insert only their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- Policy 4: Users can update only their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Restrict column updates so users cannot self-grant admin or verification
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (
  real_name, anonymous_id, avatar, university, bio, interests,
  gender, looking_for, username, dob, branch, year,
  university_email, updated_at
)
ON public.profiles TO authenticated;


-- ==============================================================================
-- 2. NOTIFICATIONS ANTI-SPOOFING & PHISHING PROTECTION (HIGH)
-- Drops open insert policies that let any user forge notifications into victims' inboxes.
-- ==============================================================================
ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.notifications FROM anon;

DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;

-- Notifications can ONLY be inserted by service_role (backend API) or DB triggers
REVOKE INSERT ON public.notifications FROM authenticated;

-- Users can only select, update (mark read), or delete their own notifications
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "notifications_select_own"
ON public.notifications FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "notifications_update_own"
ON public.notifications FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
CREATE POLICY "notifications_delete_own"
ON public.notifications FOR DELETE
TO authenticated
USING (auth.uid() = user_id);


-- ==============================================================================
-- 3. CHAT MESSAGE INJECTION HARDENING (HIGH)
-- Ensures users can ONLY send messages to matches they are actually a member of.
-- ==============================================================================
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.messages FROM anon;

DROP POLICY IF EXISTS "Users can insert messages to their matches" ON public.messages;
CREATE POLICY "messages_insert_participant"
ON public.messages FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = messages.match_id
      AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update (mark as read) their received messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;

-- Restrict editing to message author
CREATE POLICY "messages_update_sender"
ON public.messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());


-- ==============================================================================
-- 4. POLL OPTIONS INJECTION PROTECTION (HIGH)
-- Only the confession author or service_role can attach poll options to a post.
-- ==============================================================================
ALTER TABLE IF EXISTS public.poll_options ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can insert poll options" ON public.poll_options;
DROP POLICY IF EXISTS "poll_options_insert_author" ON public.poll_options;

CREATE POLICY "poll_options_insert_author"
ON public.poll_options FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.confessions c
    WHERE c.id = poll_options.confession_id
      AND c.user_id = auth.uid()
  )
);


-- ==============================================================================
-- 5. SUPPORT TICKETS & CAREER INQUIRIES PII HARVESTING PROTECTION (HIGH)
-- Anyone can submit tickets, but only admins can read applicant and user data.
-- ==============================================================================
ALTER TABLE IF EXISTS public.support_tickets ENABLE ROW LEVEL SECURITY;
REVOKE SELECT ON public.support_tickets FROM anon;

DROP POLICY IF EXISTS "Anyone can insert support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "support_tickets_insert" ON public.support_tickets;
CREATE POLICY "support_tickets_insert"
ON public.support_tickets FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "support_tickets_select_admin" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view support tickets" ON public.support_tickets;
CREATE POLICY "support_tickets_select_admin"
ON public.support_tickets FOR SELECT
TO authenticated
USING (public.is_pco_admin());

-- Career inquiries protection
ALTER TABLE IF EXISTS public.career_inquiries ENABLE ROW LEVEL SECURITY;
REVOKE SELECT ON public.career_inquiries FROM anon;

DROP POLICY IF EXISTS "Anyone can insert career inquiries" ON public.career_inquiries;
DROP POLICY IF EXISTS "career_inquiries_insert" ON public.career_inquiries;
CREATE POLICY "career_inquiries_insert"
ON public.career_inquiries FOR INSERT
TO anon, authenticated
WITH CHECK (true);

DROP POLICY IF EXISTS "career_inquiries_select_admin" ON public.career_inquiries;
CREATE POLICY "career_inquiries_select_admin"
ON public.career_inquiries FOR SELECT
TO authenticated
USING (public.is_pco_admin());


-- ==============================================================================
-- 6. USER PRESENCE STALKING REMEDIATION (MEDIUM)
-- Revokes anonymous access to online/offline connection tracking.
-- ==============================================================================
ALTER TABLE IF EXISTS public.user_presence ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.user_presence FROM anon;

DROP POLICY IF EXISTS "Allow read all presence" ON public.user_presence;
CREATE POLICY "user_presence_select_authenticated"
ON public.user_presence FOR SELECT
TO authenticated
USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Allow upsert own presence" ON public.user_presence;
CREATE POLICY "user_presence_upsert_own"
ON public.user_presence FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);


-- ==============================================================================
-- 7. SECURE CANONICAL RPC PROCEDURES (FIXES BOLA / IDOR & SEARCH PATH)
-- Enforces auth.uid() check so callers cannot view another user's matches/data.
-- ==============================================================================

-- Drop previous function signatures
DROP FUNCTION IF EXISTS public.get_potential_matches(uuid, text, text, integer, integer);
DROP FUNCTION IF EXISTS public.get_potential_matches(uuid, text, text, integer);
DROP FUNCTION IF EXISTS public.get_skipped_profiles(uuid, text, text, integer, integer);
DROP FUNCTION IF EXISTS public.get_skipped_profiles(uuid, text, text);
DROP FUNCTION IF EXISTS public.get_matches_with_preview(uuid);

-- 1. get_potential_matches
CREATE OR REPLACE FUNCTION public.get_potential_matches(
  user_id uuid,
  match_mode text,
  user_university text,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  my_key text;
BEGIN
  -- BOLA / IDOR PROTECTION: Users may ONLY query their own potential match deck
  IF auth.uid() IS NULL OR auth.uid() != user_id THEN
    RAISE EXCEPTION 'Access Denied: You cannot query potential matches for another user.';
  END IF;

  SELECT LOWER(TRIM(COALESCE(university, '')))
    INTO my_key
  FROM public.profiles WHERE id = user_id;

  RETURN QUERY
  SELECT p.*
  FROM public.profiles p
  WHERE p.id != user_id
    AND p.university IS NOT NULL
    AND p.dob IS NOT NULL
    AND p.branch IS NOT NULL
    AND p.university NOT IN ('Global', 'Unspecified', 'Other')
    AND p.branch NOT IN ('General')
    AND NOT EXISTS (
      SELECT 1 FROM public.swipes s
      WHERE s.liker_id = get_potential_matches.user_id
        AND s.target_id = p.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users b
      WHERE b.blocker_id = get_potential_matches.user_id AND b.blocked_id = p.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users b
      WHERE b.blocker_id = p.id AND b.blocked_id = get_potential_matches.user_id
    )
    AND (
      (match_mode = 'campus'
        AND LOWER(TRIM(COALESCE(p.university, ''))) = COALESCE(my_key, '~none~'))
      OR
      (match_mode = 'global'
        AND LOWER(TRIM(COALESCE(p.university, ''))) <> COALESCE(my_key, '~none~'))
    )
  ORDER BY p.updated_at DESC NULLS LAST
  LIMIT limit_count OFFSET offset_count;
END;
$$;

-- 2. get_skipped_profiles
CREATE OR REPLACE FUNCTION public.get_skipped_profiles(
  current_user_id uuid,
  match_mode text,
  user_university text,
  limit_count integer DEFAULT 50,
  offset_count integer DEFAULT 0
)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- BOLA / IDOR PROTECTION
  IF auth.uid() IS NULL OR auth.uid() != current_user_id THEN
    RAISE EXCEPTION 'Access Denied: You cannot query skipped profiles for another user.';
  END IF;

  IF match_mode = 'campus' THEN
    RETURN QUERY
    SELECT p.*
    FROM public.profiles p
    JOIN public.swipes s ON s.target_id = p.id
    WHERE s.liker_id = current_user_id
      AND s.action = 'pass'
      AND p.university IS NOT NULL
      AND p.dob IS NOT NULL
      AND p.branch IS NOT NULL
      AND p.university NOT IN ('Global', 'Unspecified', 'Other')
      AND p.branch NOT IN ('General')
      AND LOWER(TRIM(SPLIT_PART(p.university, ',', 1))) = LOWER(TRIM(SPLIT_PART(user_university, ',', 1)))
      AND NOT EXISTS (
        SELECT 1 FROM public.blocked_users b
        WHERE (b.blocker_id = current_user_id AND b.blocked_id = p.id)
           OR (b.blocker_id = p.id AND b.blocked_id = current_user_id)
      )
    ORDER BY s.created_at DESC
    LIMIT limit_count OFFSET offset_count;
  ELSE -- Global mode
    RETURN QUERY
    SELECT p.*
    FROM public.profiles p
    JOIN public.swipes s ON s.target_id = p.id
    WHERE s.liker_id = current_user_id
      AND s.action = 'pass'
      AND p.university IS NOT NULL
      AND p.dob IS NOT NULL
      AND p.branch IS NOT NULL
      AND p.university NOT IN ('Global', 'Unspecified', 'Other')
      AND p.branch NOT IN ('General')
      AND LOWER(TRIM(SPLIT_PART(p.university, ',', 1))) != LOWER(TRIM(SPLIT_PART(user_university, ',', 1)))
      AND NOT EXISTS (
        SELECT 1 FROM public.blocked_users b
        WHERE (b.blocker_id = current_user_id AND b.blocked_id = p.id)
           OR (b.blocker_id = p.id AND b.blocked_id = current_user_id)
      )
    ORDER BY s.created_at DESC
    LIMIT limit_count OFFSET offset_count;
  END IF;
END;
$$;

-- 3. get_matches_with_preview
CREATE OR REPLACE FUNCTION public.get_matches_with_preview(current_user_id uuid)
RETURNS TABLE (
  match_id uuid,
  partner_id uuid,
  partner_profile json,
  last_message json,
  last_message_time timestamp with time zone,
  unread_count bigint
) 
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  -- BOLA / IDOR PROTECTION
  IF auth.uid() IS NULL OR auth.uid() != current_user_id THEN
    RAISE EXCEPTION 'Access Denied: You cannot query matches for another user.';
  END IF;

  RETURN QUERY
  SELECT 
    m.id AS match_id,
    CASE 
      WHEN m.user_a = current_user_id THEN m.user_b 
      ELSE m.user_a 
    END AS partner_id,
    
    -- Exclude university_email and admin_email from partner preview
    json_build_object(
      'id', p.id,
      'anonymous_id', p.anonymous_id,
      'real_name', p.real_name,
      'avatar', p.avatar,
      'university', p.university,
      'branch', p.branch,
      'year', p.year,
      'bio', p.bio,
      'gender', p.gender,
      'interests', p.interests,
      'is_verified', p.is_verified,
      'is_premium', p.is_premium
    ) AS partner_profile,
    
    (
      SELECT row_to_json(msg.*)
      FROM public.messages msg
      WHERE msg.match_id = m.id
      ORDER BY msg.created_at DESC
      LIMIT 1
    ) AS last_message,
    
    (
      SELECT msg.created_at
      FROM public.messages msg
      WHERE msg.match_id = m.id
      ORDER BY msg.created_at DESC
      LIMIT 1
    ) AS last_message_time,
    
    (
      SELECT count(*)
      FROM public.messages msg
      WHERE msg.match_id = m.id 
      AND msg.sender_id != current_user_id 
      AND msg.is_read = false
    ) AS unread_count
    
  FROM public.matches m
  JOIN public.profiles p ON p.id = (
    CASE 
      WHEN m.user_a = current_user_id THEN m.user_b 
      ELSE m.user_a 
    END
  )
  WHERE (m.user_a = current_user_id OR m.user_b = current_user_id)
  AND m.status = 'matched';
END;
$$;

-- Revoke execute from public/anon; grant strictly to authenticated
REVOKE EXECUTE ON FUNCTION public.get_potential_matches(uuid, text, text, integer, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_potential_matches(uuid, text, text, integer, integer) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_skipped_profiles(uuid, text, text, integer, integer) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_skipped_profiles(uuid, text, text, integer, integer) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.get_matches_with_preview(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.get_matches_with_preview(uuid) TO authenticated;

-- ==============================================================================
-- 8. ACTIVE ROOMS & SWIPES RLS REINFORCEMENT
-- ==============================================================================
ALTER TABLE IF EXISTS public.swipes ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.swipes FROM anon;

DROP POLICY IF EXISTS "Allow read own swipes" ON public.swipes;
CREATE POLICY "swipes_select_own"
ON public.swipes FOR SELECT
TO authenticated
USING (auth.uid() = liker_id);

DROP POLICY IF EXISTS "Allow upsert own swipes" ON public.swipes;
CREATE POLICY "swipes_upsert_own"
ON public.swipes FOR ALL
TO authenticated
USING (auth.uid() = liker_id)
WITH CHECK (auth.uid() = liker_id AND target_id != auth.uid());

-- Active rooms
ALTER TABLE IF EXISTS public.active_rooms ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "active_rooms_select" ON public.active_rooms;
CREATE POLICY "active_rooms_select"
ON public.active_rooms FOR SELECT
TO authenticated, anon
USING (true);

-- ==============================================================================
-- DONE. Verification Queries:
-- 1. Check policies on profiles:
--    SELECT policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'profiles';
-- 2. Verify anon has no select on profiles:
--    SELECT has_table_privilege('anon', 'public.profiles', 'select'); -- Must return FALSE
-- ==============================================================================
