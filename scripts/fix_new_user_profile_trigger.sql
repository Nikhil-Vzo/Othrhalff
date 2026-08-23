-- ==============================================================================
-- OTHRHALFF: AUTOMATIC NEW USER PROFILE TRIGGER & BACKFILL
-- Run this ONCE in the Supabase SQL Editor.
-- Fixes: "insert or update on table 'glimpses' violates foreign key constraint 'glimpses_user_id_fkey'"
-- Guarantees that every new auth.users signup automatically receives a default
-- row in public.profiles immediately at the database level.
-- ==============================================================================

-- 1. Create the trigger function
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
  extracted_name := COALESCE(
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'name',
    'Campus Student'
  );
  extracted_avatar := COALESCE(
    NEW.raw_user_meta_data->>'avatar_url',
    NEW.raw_user_meta_data->>'picture',
    'https://api.dicebear.com/9.x/thumbs/svg?seed=' || SUBSTRING(NEW.id::text, 1, 8)
  );

  -- Insert profile row with safe defaults (idempotent ON CONFLICT DO NOTHING)
  INSERT INTO public.profiles (
    id,
    anonymous_id,
    real_name,
    gender,
    university,
    university_email,
    branch,
    year,
    interests,
    bio,
    dob,
    avatar,
    is_verified,
    is_premium,
    updated_at
  ) VALUES (
    NEW.id,
    'User#' || UPPER(SUBSTRING(REPLACE(NEW.id::text, '-', ''), 1, 8)),
    extracted_name,
    'Other',
    'Global',
    COALESCE(NEW.email, ''),
    'General',
    '1st Year',
    '{}',
    '',
    '2002-01-01',
    extracted_avatar,
    false,
    false,
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

-- 2. Bind the trigger to auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- 3. Backfill any existing auth users missing in public.profiles
INSERT INTO public.profiles (
  id,
  anonymous_id,
  real_name,
  gender,
  university,
  university_email,
  branch,
  year,
  interests,
  bio,
  dob,
  avatar,
  is_verified,
  is_premium,
  updated_at
)
SELECT 
  u.id,
  'User#' || UPPER(SUBSTRING(REPLACE(u.id::text, '-', ''), 1, 8)),
  COALESCE(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', 'Campus Student'),
  'Other',
  'Global',
  COALESCE(u.email, ''),
  'General',
  '1st Year',
  '{}',
  '',
  '2002-01-01',
  COALESCE(u.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/9.x/thumbs/svg?seed=' || SUBSTRING(u.id::text, 1, 8)),
  false,
  false,
  NOW()
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.id = u.id
)
ON CONFLICT (id) DO NOTHING;
