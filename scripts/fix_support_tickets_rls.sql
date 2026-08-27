-- Fix Row Level Security on support_tickets table to allow anyone (guest, student, anonymous, authenticated) to submit contact/support requests
ALTER TABLE IF EXISTS public.support_tickets ENABLE ROW LEVEL SECURITY;

-- Drop existing restrictive insert policies if any
DROP POLICY IF EXISTS "Anyone can insert support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can insert support tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Enable insert for all users" ON public.support_tickets;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.support_tickets;

-- Create open insert policy for public/anon/authenticated
CREATE POLICY "Anyone can insert support tickets"
ON public.support_tickets
FOR INSERT
TO public, anon, authenticated
WITH CHECK (true);

-- Ensure service role has full access
CREATE POLICY "Service role full access on support tickets"
ON public.support_tickets
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
