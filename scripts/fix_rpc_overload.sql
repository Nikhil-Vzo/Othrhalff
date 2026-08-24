-- ==============================================================================
-- OTHRHALFF: FIX get_potential_matches OVERLOAD AMBIGUITY (PGRST203)
-- Run ONCE in Supabase SQL Editor.
--
-- Problem: two overloads of get_potential_matches exist (one with only
-- limit_count/offset_count defaults, one full). PostgREST cannot resolve
-- which to call -> every swipe-deck load throws PGRST203 and falls back to
-- a slower direct client-side query.
--
-- Fix: keep ONE canonical signature (the one Home.tsx actually calls:
-- user_id, match_mode, user_university) and DROP the rest.
-- Idempotent-safe: uses DO block so re-running never errors.
-- ==============================================================================

DO $$
DECLARE
  r record;
BEGIN
  -- Drop every overload EXCEPT the exact arg pattern the client calls:
  -- (user_id uuid, match_mode text, user_university text)
  FOR r IN
    SELECT p.oid::regprocedure AS funcsig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_potential_matches'
      AND pg_get_function_arguments(p.oid) NOT ILIKE 'user_id uuid, match_mode text, user_university text'
  LOOP
    EXECUTE format('DROP FUNCTION %s', r.funcsig);
    RAISE NOTICE 'Dropped overload: %', r.funcsig;
  END LOOP;
END $$;

-- Recreate the canonical version (newest-first, campus/global split,
-- excludes swiped + blocked both ways). Safe even if the surviving
-- definition was stale.
CREATE OR REPLACE FUNCTION public.get_potential_matches(
  user_id uuid,
  match_mode text,
  user_university text
)
RETURNS SETOF profiles
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
  FROM profiles p
  WHERE p.id != user_id
    AND p.university IS NOT NULL
    AND p.dob IS NOT NULL
    AND p.branch IS NOT NULL
    AND p.university NOT IN ('Global', 'Unspecified')
    AND p.branch NOT IN ('General')
    AND NOT EXISTS (
      SELECT 1 FROM swipes s
      WHERE s.liker_id = get_potential_matches.user_id
        AND s.target_id = p.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM blocked_users b
      WHERE b.blocker_id = get_potential_matches.user_id AND b.blocked_id = p.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM blocked_users b
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

-- Same treatment for get_skipped_profiles if it also got overloaded:
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN
    SELECT p.oid::regprocedure AS funcsig
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public'
      AND p.proname = 'get_skipped_profiles'
      AND pg_get_function_arguments(p.oid) NOT ILIKE 'current_user_id uuid, match_mode text, user_university text'
  LOOP
    EXECUTE format('DROP FUNCTION %s', r.funcsig);
    RAISE NOTICE 'Dropped skipped-profiles overload: %', r.funcsig;
  END LOOP;
END $$;

CREATE OR REPLACE FUNCTION public.get_skipped_profiles(
  current_user_id uuid,
  match_mode text,
  user_university text
)
RETURNS SETOF public.profiles
LANGUAGE plpgsql
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
