-- ==============================================================================
-- OTHRHALFF SECURITY HARDENING MIGRATION
-- Run ONCE in the Supabase SQL Editor. Idempotent — safe to re-run.
-- Fixes: match forgery, message tampering, self-granted admin, anonymous
-- song-request spam, admin roster exposure, missing cleanup for 24h content.
-- ==============================================================================

-- 1. MATCH FORGERY (CRITICAL)
-- The "Users can insert matches" policy let a user create a match row with
-- themselves as EITHER participant, bypassing the mutual-like requirement and
-- opening chats with people who never liked them. Drop it — match creation
-- must go through the server (service role) or the reciprocal-swipe policy.
DROP POLICY IF EXISTS "Users can insert matches" ON public.matches;

-- 2. MESSAGE TAMPERING (CRITICAL)
-- The update policy allowed ANY match participant to edit ANY message in the
-- chat. Restrict updates to the message's own sender.
DROP POLICY IF EXISTS "Users can update their own received messages" ON public.messages;
CREATE POLICY "Users can update their own messages"
ON public.messages FOR UPDATE
TO authenticated
USING (sender_id = (select auth.uid()))
WITH CHECK (sender_id = (select auth.uid()));

-- 3. SELF-GRANTED ADMIN (HIGH)
-- "Users can update their own profile" allowed UPDATE of every column,
-- including is_admin/admin_email. Revoke column-level update on the
-- privileged columns for authenticated users (service role unaffected).
REVOKE UPDATE ON public.profiles FROM authenticated;
GRANT UPDATE (real_name, anonymous_id, avatar, university, bio, interests,
               gender, looking_for, username, dob, branch, year,
               university_email, updated_at)
ON public.profiles TO authenticated;
-- NOTE: is_admin / admin_email / is_premium / is_verified are intentionally
-- NOT granted — they are server/admin-only now. If client code upserts those
-- fields on login (auth.ts), the upsert still succeeds for INSERT; only the
-- UPDATE path skips them. Adjust if you add new user-editable columns.

-- 4. ANONYMOUS SONG-REQUEST SPAM (HIGH)
-- pco_requests_insert allowed requester_id IS NULL, and the daily-limit
-- trigger skips NULL requester rows → unbounded anonymous inserts shown on
-- air. Require a real authenticated requester for non-admins.
DROP POLICY IF EXISTS pco_requests_insert ON public.pco_song_requests;
CREATE POLICY pco_requests_insert
ON public.pco_song_requests FOR INSERT
TO authenticated, anon
WITH CHECK (
  public.is_pco_admin()
  OR requester_id = auth.uid()
);

-- 5. ADMIN ROSTER EXPOSURE (MEDIUM)
-- admin_users SELECT was open to all authenticated users and the table was in
-- the realtime publication. Restrict reads to admins only and stop streaming
-- its changes.
DROP POLICY IF EXISTS admin_users_select ON public.admin_users;
CREATE POLICY admin_users_select
ON public.admin_users FOR SELECT
TO authenticated
USING (public.is_pco_admin());

ALTER PUBLICATION supabase_realtime DROP TABLE public.admin_users;

-- 6. NOTIFICATION SPOOFING (MEDIUM)
-- "Users can insert their own notifications" let any user write fake
-- notifications (any from_user_id) into victims' feeds. Notifications must be
-- created by server/triggers only. (If your app relies on client-side inserts
-- for legit flows, gate this behind a security-definer function instead.)
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;

-- 7. UNBOUNDED GROWTH — 24H EXPIRY CLEANUP (SCALING)
-- Glimpses are 24h stories but nothing deletes them; rows accumulate forever
-- and stay queryable via the API. Schedule deletion with pg_cron (available on
-- Supabase). If pg_cron is not enabled, enable it in the dashboard:
--   Database > Extensions > pg_cron
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  -- Delete glimpses older than 24 hours, every hour
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup_old_glimpses') THEN
    PERFORM cron.schedule(
      'cleanup_old_glimpses',
      '0 * * * *',
      $$DELETE FROM public.glimpses WHERE created_at < NOW() - INTERVAL '24 hours'$$
    );
  END IF;

  -- Delete played/declined song requests older than 7 days, daily
  IF NOT EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cleanup_old_pco_requests') THEN
    PERFORM cron.schedule(
      'cleanup_old_pco_requests',
      '30 3 * * *',
      $$DELETE FROM public.pco_song_requests
        WHERE status IN ('played','declined')
          AND requested_at < NOW() - INTERVAL '7 days'$$
    );
  END IF;
END $$;

-- 8. HOT-PATH INDEXES (SCALING)
-- Supports the matches existence check in /accept-match and message queries.
CREATE INDEX IF NOT EXISTS idx_matches_user_a ON public.matches(user_a);
CREATE INDEX IF NOT EXISTS idx_matches_user_b ON public.matches(user_b);
CREATE INDEX IF NOT EXISTS idx_messages_match_created ON public.messages(match_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pco_requests_requester ON public.pco_song_requests(requester_id, requested_at DESC);

-- 9. IST-CONSISTENT SERVER TIME (SCALING)
-- Helper for quota logic so 'today' means the IST calendar day, not UTC.
CREATE OR REPLACE FUNCTION public.ist_today()
RETURNS DATE
LANGUAGE SQL STABLE
AS $$
  SELECT (NOW() AT TIME ZONE 'Asia/Kolkata')::DATE;
$$;

GRANT EXECUTE ON FUNCTION public.ist_today() TO anon, authenticated;

-- ==============================================================================
-- DONE. Verify with:
--   SELECT * FROM pg_policies WHERE tablename IN ('matches','messages','profiles','pco_song_requests','admin_users','notifications');
--   SELECT jobname, schedule FROM cron.job;
-- ==============================================================================
