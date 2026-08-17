-- ==============================================================================
-- CAMPUS PCO / SPARX MUSIC RADIO DATABASE SCHEMA
-- Execute this script in your Supabase SQL Editor to enable:
-- 1. Admin users permissions table (admin_users)
-- 2. Real-time song requests & live broadcast queue (pco_song_requests)
-- 3. Daily quota tracking table (pco_daily_requests)
-- 4. Admin flag extensions on profiles table
-- 5. Row Level Security (RLS) policies & is_pco_admin() helper
-- 6. Daily limit trigger (enforcing 3 song requests/day for students)
-- 7. Supabase Realtime publication subscriptions
-- ==============================================================================

-- 1. Create admin_users table
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin', 'dj', 'moderator')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add is_admin and admin_email to profiles table if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'admin_email'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN admin_email TEXT;
  END IF;
END $$;

-- 3. Create pco_song_requests table
CREATE TABLE IF NOT EXISTS public.pco_song_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requester_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_name TEXT NOT NULL,
  track_id TEXT NOT NULL,
  track_name TEXT NOT NULL,
  track_artist TEXT,
  track_image TEXT,
  track_url TEXT,
  track_duration TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'played')),
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  played_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 4. Daily request tracking table
CREATE TABLE IF NOT EXISTS public.pco_daily_requests (
  user_id UUID NOT NULL,
  day DATE NOT NULL,
  used_count INT NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, day)
);

-- 5. Indexes for fast real-time queries
CREATE INDEX IF NOT EXISTS idx_pco_requests_status ON public.pco_song_requests(status);
CREATE INDEX IF NOT EXISTS idx_pco_requests_time ON public.pco_song_requests(requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_pco_requests_track ON public.pco_song_requests(track_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

-- 6. Enable Row Level Security (RLS)
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pco_song_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pco_daily_requests ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- ADMIN CHECK FUNCTION (INCLUDES FALLBACK EMAILS)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.is_pco_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE lower(au.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
  OR lower(coalesce(auth.jwt() ->> 'email', '')) IN (
    'nikhilyadav200530@gmail.com',
    'avneeshjha1506@gmail.com',
    'dpursuit14@gmail.com',
    'lachavzo11@gmail.com'
  );
$$;

-- ==============================================================================
-- ADMIN USERS RLS POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "Allow public read on admin_users" ON public.admin_users;
DROP POLICY IF EXISTS admin_users_select ON public.admin_users;
DROP POLICY IF EXISTS admin_users_insert ON public.admin_users;
DROP POLICY IF EXISTS admin_users_update ON public.admin_users;
DROP POLICY IF EXISTS admin_users_delete ON public.admin_users;

-- Authenticated users can read admin list to determine permissions
CREATE POLICY admin_users_select
ON public.admin_users FOR SELECT
TO authenticated
USING (true);

-- Only admins can add new admins
CREATE POLICY admin_users_insert
ON public.admin_users FOR INSERT
TO authenticated
WITH CHECK (public.is_pco_admin());

-- Only admins can modify admins
CREATE POLICY admin_users_update
ON public.admin_users FOR UPDATE
TO authenticated
USING (public.is_pco_admin())
WITH CHECK (public.is_pco_admin());

-- Only admins can delete admins
CREATE POLICY admin_users_delete
ON public.admin_users FOR DELETE
TO authenticated
USING (public.is_pco_admin());

-- ==============================================================================
-- SONG REQUEST RLS POLICIES
-- ==============================================================================
DROP POLICY IF EXISTS "Allow public read on pco_song_requests" ON public.pco_song_requests;
DROP POLICY IF EXISTS "Allow insert on pco_song_requests" ON public.pco_song_requests;
DROP POLICY IF EXISTS "Allow update on pco_song_requests" ON public.pco_song_requests;

DROP POLICY IF EXISTS pco_requests_select ON public.pco_song_requests;
DROP POLICY IF EXISTS pco_requests_insert ON public.pco_song_requests;
DROP POLICY IF EXISTS pco_requests_update ON public.pco_song_requests;
DROP POLICY IF EXISTS pco_requests_delete ON public.pco_song_requests;

-- Anyone can see song requests (authenticated users and guests)
CREATE POLICY pco_requests_select
ON public.pco_song_requests FOR SELECT
TO authenticated, anon
USING (true);

-- Any authenticated or guest user can submit a song request
CREATE POLICY pco_requests_insert
ON public.pco_song_requests FOR INSERT
TO authenticated, anon
WITH CHECK (requester_id = auth.uid() OR requester_id IS NULL OR public.is_pco_admin());

-- ONLY admins can approve/decline/update request status
CREATE POLICY pco_requests_update
ON public.pco_song_requests FOR UPDATE
TO authenticated
USING (public.is_pco_admin())
WITH CHECK (public.is_pco_admin());

-- ONLY admins can delete requests
CREATE POLICY pco_requests_delete
ON public.pco_song_requests FOR DELETE
TO authenticated
USING (public.is_pco_admin());

-- ==============================================================================
-- DAILY REQUEST LIMIT TRIGGER (3 PER DAY FOR NON-ADMINS)
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.enforce_pco_daily_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_day DATE := current_date;
  used INT := 0;
BEGIN
  -- Service role bypass
  IF coalesce(current_setting('request.jwt.claim.role', true), '') = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Admins have unlimited requests
  IF public.is_pco_admin() THEN
    RETURN NEW;
  END IF;

  -- If user is logged in, enforce daily 3-request limit
  IF NEW.requester_id IS NOT NULL THEN
    INSERT INTO public.pco_daily_requests (user_id, day, used_count)
    VALUES (NEW.requester_id, current_day, 0)
    ON CONFLICT (user_id, day) DO NOTHING;

    SELECT used_count
    INTO used
    FROM public.pco_daily_requests
    WHERE user_id = NEW.requester_id
      AND day = current_day
    FOR UPDATE;

    IF used >= 3 THEN
      RAISE EXCEPTION 'Daily request limit reached. You can request up to 3 songs per day.';
    END IF;

    UPDATE public.pco_daily_requests
    SET used_count = used_count + 1
    WHERE user_id = NEW.requester_id
      AND day = current_day;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS pco_song_requests_limit ON public.pco_song_requests;

CREATE TRIGGER pco_song_requests_limit
BEFORE INSERT ON public.pco_song_requests
FOR EACH ROW
EXECUTE FUNCTION public.enforce_pco_daily_limit();

-- ==============================================================================
-- SEED PRIMARY ADMIN USERS
-- ==============================================================================
INSERT INTO public.admin_users (email, role)
VALUES 
  ('nikhilyadav200530@gmail.com', 'super_admin'),
  ('avneeshjha1506@gmail.com', 'super_admin'),
  ('dpursuit14@gmail.com', 'super_admin'),
  ('lachavzo11@gmail.com', 'super_admin')
ON CONFLICT (email) DO UPDATE SET role = EXCLUDED.role;

UPDATE public.profiles 
SET is_admin = TRUE 
WHERE university_email IN ('nikhilyadav200530@gmail.com', 'avneeshjha1506@gmail.com', 'dpursuit14@gmail.com', 'lachavzo11@gmail.com')
   OR admin_email IN ('nikhilyadav200530@gmail.com', 'avneeshjha1506@gmail.com', 'dpursuit14@gmail.com', 'lachavzo11@gmail.com');

-- ==============================================================================
-- REALTIME PUBLICATION
-- ==============================================================================
DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.pco_song_requests;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_users;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;
