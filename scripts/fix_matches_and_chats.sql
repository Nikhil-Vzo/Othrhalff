-- ==============================================================================
-- FIX MATCHES & CHATS (OTHRHALFF)
-- Paste and run this script in Supabase SQL Editor.
-- Fixes:
-- 1. `get_matches_with_preview` RPC: removes non-existent `m.status` column & uses LEFT JOIN
-- 2. `public.matches` RLS: ensures participants can view, insert, and update their matches
-- 3. `public.messages` RLS: ensures participants can view messages & update read receipts
-- 4. `public.profiles` RLS: ensures matched partners can always read each other's profile
-- ==============================================================================

-- ==============================================================================
-- 1. FIX GET_MATCHES_WITH_PREVIEW (CRITICAL FIX FOR CHATS / MATCHES LIST)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.get_matches_with_preview(current_user_id uuid DEFAULT auth.uid())
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
  -- Default to auth.uid() if current_user_id is null
  IF current_user_id IS NULL THEN
    current_user_id := auth.uid();
  END IF;

  -- BOLA / IDOR PROTECTION: When authenticated, users may only load their own matches
  IF auth.uid() IS NOT NULL AND auth.uid() != current_user_id THEN
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
      'id', COALESCE(p.id, CASE WHEN m.user_a = current_user_id THEN m.user_b ELSE m.user_a END),
      'anonymous_id', COALESCE(p.anonymous_id, 'ghost'),
      'real_name', COALESCE(p.real_name, 'Campus Peer'),
      'avatar', p.avatar,
      'university', p.university,
      'branch', p.branch,
      'year', p.year,
      'bio', p.bio,
      'gender', p.gender,
      'interests', COALESCE(p.interests, '{}'::text[]),
      'is_verified', COALESCE(p.is_verified, false),
      'is_premium', COALESCE(p.is_premium, false)
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
  LEFT JOIN public.profiles p ON p.id = (
    CASE 
      WHEN m.user_a = current_user_id THEN m.user_b 
      ELSE m.user_a 
    END
  )
  WHERE (m.user_a = current_user_id OR m.user_b = current_user_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.get_matches_with_preview(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_matches_with_preview(uuid) TO authenticated, anon;


-- ==============================================================================
-- 2. PUBLIC.MATCHES RLS POLICIES
-- ==============================================================================
ALTER TABLE IF EXISTS public.matches ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.matches FROM anon;

DROP POLICY IF EXISTS "Users can view their matches" ON public.matches;
DROP POLICY IF EXISTS "matches_select_participant" ON public.matches;
CREATE POLICY "matches_select_participant"
ON public.matches FOR SELECT
TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "Users can update their matches" ON public.matches;
DROP POLICY IF EXISTS "matches_update_participant" ON public.matches;
CREATE POLICY "matches_update_participant"
ON public.matches FOR UPDATE
TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b)
WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

DROP POLICY IF EXISTS "Users can insert matches" ON public.matches;
DROP POLICY IF EXISTS "Users can trigger match creation" ON public.matches;
DROP POLICY IF EXISTS "matches_insert_participant" ON public.matches;
CREATE POLICY "matches_insert_participant"
ON public.matches FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);


-- ==============================================================================
-- 3. PUBLIC.MESSAGES RLS POLICIES (SELECT & UPDATE READ RECEIPTS)
-- ==============================================================================
ALTER TABLE IF EXISTS public.messages ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.messages FROM anon;

DROP POLICY IF EXISTS "Users can view messages of their matches" ON public.messages;
DROP POLICY IF EXISTS "messages_select_participant" ON public.messages;
CREATE POLICY "messages_select_participant"
ON public.messages FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = messages.match_id
      AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
  )
);

DROP POLICY IF EXISTS "Users can insert messages to their matches" ON public.messages;
DROP POLICY IF EXISTS "messages_insert_participant" ON public.messages;
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

-- Allow message author to edit their message OR match participant to mark as read
DROP POLICY IF EXISTS "Users can update their received messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update (mark as read) their received messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "messages_update_sender" ON public.messages;
DROP POLICY IF EXISTS "messages_update_participant" ON public.messages;
CREATE POLICY "messages_update_participant"
ON public.messages FOR UPDATE
TO authenticated
USING (
  sender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = messages.match_id
      AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
  )
)
WITH CHECK (
  sender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = messages.match_id
      AND (m.user_a = auth.uid() OR m.user_b = auth.uid())
  )
);


-- ==============================================================================
-- 4. PUBLIC.PROFILES RLS (ENSURE MATCHED PARTNERS CAN VIEW EACH OTHER)
-- ==============================================================================
DROP POLICY IF EXISTS "profiles_select_authenticated" ON public.profiles;
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
    OR EXISTS (
      SELECT 1 FROM public.matches m
      WHERE (m.user_a = auth.uid() AND m.user_b = profiles.id)
         OR (m.user_b = auth.uid() AND m.user_a = profiles.id)
    )
  )
);
