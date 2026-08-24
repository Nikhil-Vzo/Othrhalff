-- ==============================================================================
-- OTHRHALFF: CLEAN & RECREATE CANONICAL MATCHING RPC FUNCTIONS
-- Run ONCE in the Supabase SQL Editor. 100% Idempotent & Safe.
--
-- Why: Drops all existing versions and overloads first to avoid PostgreSQL 
-- ERROR 42P13 ("cannot change return type of existing function").
-- ==============================================================================

-- 1. DROP ALL existing variants/overloads of get_potential_matches & get_skipped_profiles
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS funcsig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname IN ('get_potential_matches', 'get_skipped_profiles')
  LOOP
    EXECUTE format('DROP FUNCTION IF EXISTS %s CASCADE', r.funcsig);
    RAISE NOTICE 'Dropped function: %', r.funcsig;
  END LOOP;
END $$;

-- 2. Create canonical get_potential_matches (filters out un-onboarded / placeholder accounts)
CREATE OR REPLACE FUNCTION public.get_potential_matches(
  user_id uuid,
  match_mode text,
  user_university text
)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
DECLARE
  my_key text;
BEGIN
  SELECT LOWER(TRIM(SPLIT_PART(COALESCE(university, ''), ',', 1)))
    INTO my_key
  FROM public.profiles WHERE id = user_id;

  RETURN QUERY
  SELECT p.*
  FROM public.profiles p
  WHERE p.id != user_id
    AND p.university IS NOT NULL
    AND p.dob IS NOT NULL
    AND p.branch IS NOT NULL
    AND p.university NOT IN ('Global', 'Unspecified')
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
        AND LOWER(TRIM(SPLIT_PART(COALESCE(p.university, ''), ',', 1))) = COALESCE(my_key, '~none~'))
      OR
      (match_mode = 'global'
        AND LOWER(TRIM(SPLIT_PART(COALESCE(p.university, ''), ',', 1))) <> COALESCE(my_key, '~none~'))
    )
  ORDER BY p.updated_at DESC NULLS LAST
  LIMIT 50;
END;
$$;

-- 3. Create canonical get_skipped_profiles (filters out un-onboarded / placeholder accounts)
CREATE OR REPLACE FUNCTION public.get_skipped_profiles(
  current_user_id uuid,
  match_mode text,
  user_university text
)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
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
      AND p.university NOT IN ('Global', 'Unspecified')
      AND p.branch NOT IN ('General')
      AND LOWER(TRIM(SPLIT_PART(p.university, ',', 1))) = LOWER(TRIM(SPLIT_PART(user_university, ',', 1)))
    ORDER BY s.created_at DESC;
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
      AND p.university NOT IN ('Global', 'Unspecified')
      AND p.branch NOT IN ('General')
      AND LOWER(TRIM(SPLIT_PART(p.university, ',', 1))) != LOWER(TRIM(SPLIT_PART(user_university, ',', 1)))
    ORDER BY s.created_at DESC;
  END IF;
END;
$$;

-- 4. Grant Permissions to authenticated and service roles
GRANT EXECUTE ON FUNCTION public.get_potential_matches(uuid, text, text) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION public.get_skipped_profiles(uuid, text, text) TO authenticated, anon, service_role;
