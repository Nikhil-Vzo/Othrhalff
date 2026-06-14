-- Create Glimpses Table
CREATE TABLE IF NOT EXISTS public.glimpses (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  image_path text NOT NULL, -- Path to the image in the Supabase Storage bucket
  caption text,
  university text NOT NULL, -- Cached from profiles to optimize feed filtering
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.glimpses ENABLE ROW LEVEL SECURITY;

-- Select: Any authenticated user can view glimpses
DROP POLICY IF EXISTS "Glimpses are viewable by authenticated users" ON public.glimpses;
CREATE POLICY "Glimpses are viewable by authenticated users" 
  ON public.glimpses FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Insert: Users can only upload glimpses under their own ID
DROP POLICY IF EXISTS "Users can insert their own glimpses" ON public.glimpses;
CREATE POLICY "Users can insert their own glimpses" 
  ON public.glimpses FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Delete: Users can delete their own glimpses
DROP POLICY IF EXISTS "Users can delete their own glimpses" ON public.glimpses;
CREATE POLICY "Users can delete their own glimpses" 
  ON public.glimpses FOR DELETE 
  USING (auth.uid() = user_id);


-- Create Glimpse Reactions Table (Hearts, Flames, and Likes)
CREATE TABLE IF NOT EXISTS public.glimpse_reactions (
  id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
  glimpse_id uuid REFERENCES public.glimpses(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  reaction_type text CHECK (reaction_type IN ('heart', 'fire', 'like')) NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(glimpse_id, user_id, reaction_type)
);

-- Enable RLS
ALTER TABLE public.glimpse_reactions ENABLE ROW LEVEL SECURITY;

-- Select: Authenticated users can read reactions
DROP POLICY IF EXISTS "Reactions are viewable by authenticated users" ON public.glimpse_reactions;
CREATE POLICY "Reactions are viewable by authenticated users" 
  ON public.glimpse_reactions FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Insert: Users can only react as themselves
DROP POLICY IF EXISTS "Users can insert reactions" ON public.glimpse_reactions;
CREATE POLICY "Users can insert reactions" 
  ON public.glimpse_reactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Delete: Users can only delete reactions they created
DROP POLICY IF EXISTS "Users can delete reactions" ON public.glimpse_reactions;
CREATE POLICY "Users can delete reactions" 
  ON public.glimpse_reactions FOR DELETE 
  USING (auth.uid() = user_id);


-- ==========================================
-- PERFORMANCE INDEXES
-- ==========================================

-- Indexes for feed filtering, sorting, and joins
CREATE INDEX IF NOT EXISTS glimpses_created_at_idx ON public.glimpses (created_at DESC);
CREATE INDEX IF NOT EXISTS glimpses_university_idx ON public.glimpses (university);
CREATE INDEX IF NOT EXISTS glimpses_user_id_idx ON public.glimpses (user_id);

CREATE INDEX IF NOT EXISTS glimpse_reactions_glimpse_id_idx ON public.glimpse_reactions (glimpse_id);
CREATE INDEX IF NOT EXISTS glimpse_reactions_user_id_idx ON public.glimpse_reactions (user_id);


-- ==========================================
-- STORAGE BUCKET CREATION & POLICIES
-- ==========================================

-- Create storage bucket for glimpses if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('glimpses', 'glimpses', true)
ON CONFLICT (id) DO NOTHING;

-- RLS Policies for glimpses bucket inside storage.objects table
DROP POLICY IF EXISTS "Allow public read access to glimpses bucket" ON storage.objects;
CREATE POLICY "Allow public read access to glimpses bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'glimpses');

DROP POLICY IF EXISTS "Allow authenticated upload access to glimpses bucket" ON storage.objects;
CREATE POLICY "Allow authenticated upload access to glimpses bucket"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'glimpses' AND auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow user deletion from glimpses bucket" ON storage.objects;
CREATE POLICY "Allow user deletion from glimpses bucket"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'glimpses' AND auth.role() = 'authenticated' AND split_part(name, '/', 1) = auth.uid()::text);


-- ==========================================
-- ANONYMITY UPGRADES
-- ==========================================

-- Add is_anonymous column to glimpses table to support anonymous snaps/stories
ALTER TABLE public.glimpses ADD COLUMN IF NOT EXISTS is_anonymous boolean DEFAULT false NOT NULL;
