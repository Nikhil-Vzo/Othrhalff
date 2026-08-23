-- ==============================================================================
-- OTHRHALFF: STOP WRITING PLACEHOLDER PROFILE DATA ON SIGNUP
-- Run ONCE in the Supabase SQL Editor. Idempotent.
--
-- Why: the old handle_new_user() wrote fake identity data into public.profiles
-- ('Campus Student', 'Global', 'General', '2002-01-01'). Client code treats
-- those exact strings as "onboarding incomplete" (isProfileComplete), so any
-- drift between what we write and what we detect caused the signup ->
-- onboarding loop. Writing NULLs instead keeps detection deterministic:
-- missing data simply means not onboarded yet. It also stops poisoning
-- campus matching with 'Global' university rows.
--
-- Also backfills: existing users still carrying fake DOBs get them nulled
-- so they are correctly sent through onboarding once more (only affects
-- accounts whose dob is exactly the two known placeholder dates).
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  extracted_name text;
  extracted_avatar text;
BEGIN
  -- Extract name and avatar from Google OAuth or user metadata if available
  extracted_name := NULLIF(TRIM(COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    ''
  )), '');
  extracted_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    'https://api.dicebear.com/9.x/thumbs/svg?seed=' || SUBSTRING(NEW.id::text, 1, 8)
  );

  INSERT INTO public.profiles (
    id, anonymous_id, real_name, gender, university, university_email,
    branch, year, interests, bio, dob, avatar, is_verified, is_premium,
    updated_at
  ) VALUES (
    NEW.id,
    'User#' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 8)),
    extracted_name,          -- NULL when Google gives no name (was 'Campus Student')
    'Other',
    NULL,                    -- was 'Global'  -> poisoned campus matching
    COALESCE(NEW.email, ''),
    NULL,                    -- was 'General'
    '1st Year',
    '{}',
    '',
    NULL,                    -- was '2002-01-01'
    extracted_avatar,
    false,
    false,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Backfill: null out remaining fake DOBs so isProfileComplete() reads true
-- state for those users (they will be asked to finish onboarding once).
UPDATE public.profiles
SET dob = NULL
WHERE dob IN ('2000-01-01', '2002-01-01');

-- Backfill: null out fake universities/branches/names on bootstrap-only rows
UPDATE public.profiles
SET university = NULL
WHERE university = 'Global';

UPDATE public.profiles
SET branch = NULL
WHERE branch = 'General' AND university IS NULL;

UPDATE public.profiles
SET real_name = NULL
WHERE real_name IN ('Campus Student', 'Campus User');

-- ==============================================================================
-- FIX READ RECEIPTS: Allow match participants to mark received messages as read
-- ==============================================================================
DROP POLICY IF EXISTS "Users can update their own messages" ON public.messages;
DROP POLICY IF EXISTS "Users can update their own received messages" ON public.messages;
DROP POLICY IF EXISTS "Participants can update messages" ON public.messages;

CREATE POLICY "Participants can update messages"
ON public.messages FOR UPDATE
TO authenticated
USING (
  sender_id = (select auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id
    AND (m.user1_id = (select auth.uid()) OR m.user2_id = (select auth.uid()))
  )
)
WITH CHECK (
  sender_id = (select auth.uid()) OR
  EXISTS (
    SELECT 1 FROM public.matches m
    WHERE m.id = match_id
    AND (m.user1_id = (select auth.uid()) OR m.user2_id = (select auth.uid()))
  )
);

