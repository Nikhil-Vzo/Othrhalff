# Sparx Glimpses & Vibe Rooms Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Sparx Hub, incorporating a TikTok-style campus story feed (Glimpses) that auto-expires after 24 hours, and porting the PeerJS cinema/music watch parties into a Discord-style direct match-invitation room system.

**Architecture:** Use Supabase Storage for storing glimpses images, Supabase Database for metadata and reaction tracking, and client-side Next.js route mapping under `/sparx`. Integrate "Swipe-to-Like" into the existing matchmaking swipes system.

**Tech Stack:** React, TypeScript, Tailwind CSS, Lucide React, Supabase Client, PeerJS.

---

### Task 1: Database Schema & Storage Setup

**Files:**
- Create: `c:\Users\nikhi\Downloads\othrhalff prod\supabase_migration.sql`

- [ ] **Step 1: Write the migration SQL script**
  Write the SQL commands to create `glimpses` and `glimpse_reactions` tables, enable Row Level Security (RLS) on them, add SELECT/INSERT/DELETE RLS policies, and define public read/write policies for the `glimpses` storage bucket.
  
  ```sql
  -- Create Glimpses Table
  CREATE TABLE IF NOT EXISTS public.glimpses (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    image_path text NOT NULL,
    caption text,
    university text NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
  );

  ALTER TABLE public.glimpses ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Glimpses are viewable by authenticated users" 
    ON public.glimpses FOR SELECT USING (auth.role() = 'authenticated');

  CREATE POLICY "Users can insert their own glimpses" 
    ON public.glimpses FOR INSERT WITH CHECK (auth.uid() = user_id);

  CREATE POLICY "Users can delete their own glimpses" 
    ON public.glimpses FOR DELETE USING (auth.uid() = user_id);

  -- Create Glimpse Reactions Table
  CREATE TABLE IF NOT EXISTS public.glimpse_reactions (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    glimpse_id uuid REFERENCES public.glimpses(id) ON DELETE CASCADE NOT NULL,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    reaction_type text CHECK (reaction_type IN ('heart', 'fire', 'like')) NOT NULL,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(glimpse_id, user_id, reaction_type)
  );

  ALTER TABLE public.glimpse_reactions ENABLE ROW LEVEL SECURITY;

  CREATE POLICY "Reactions are viewable by authenticated users" 
    ON public.glimpse_reactions FOR SELECT USING (auth.role() = 'authenticated');

  CREATE POLICY "Users can insert reactions" 
    ON public.glimpse_reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
  ```

- [ ] **Step 2: Apply the migration to the database**
  Use the Supabase SQL editor (or custom tool) to run the `supabase_migration.sql` query. Ensure no errors occur.
  
- [ ] **Step 3: Commit migration file**
  ```bash
  git add supabase_migration.sql
  git commit -m "db: add migration script for glimpses and reactions"
  ```

---

### Task 2: Route Rebranding & Navigation Update

**Files:**
- Create: `c:\Users\nikhi\Downloads\othrhalff prod\client\app\sparx\page.tsx`
- Modify: `c:\Users\nikhi\Downloads\othrhalff prod\client\src\layouts\AppLayout.tsx`
- Delete: `c:\Users\nikhi\Downloads\othrhalff prod\client\app\virtual-date\page.tsx`

- [ ] **Step 1: Update AppLayout navigation configuration**
  Rename the navigation item from "Virtual Date" (with route `/virtual-date`) to "Sparx" (with route `/sparx` using the `Zap` icon) in `client/src/layouts/AppLayout.tsx`.
  
  ```typescript
  // In client/src/layouts/AppLayout.tsx
  import { Zap, ... } from 'lucide-react';
  
  // navItems array update:
  { path: '/sparx', icon: Zap, label: 'Sparx' }
  ```

- [ ] **Step 2: Create Next.js sparx route page wrapper**
  Create the `/sparx` route file that renders the main `Sparx` view.
  
  ```typescript
  // client/app/sparx/page.tsx
  "use client";
  
  import { Sparx } from '../../src/views/Sparx';
  
  export default function Page() {
    return <Sparx />;
  }
  ```

- [ ] **Step 3: Delete old virtual-date route file**
  Remove the `client/app/virtual-date/page.tsx` file.

- [ ] **Step 4: Commit navigation routing changes**
  ```bash
  git add client/src/layouts/AppLayout.tsx client/app/sparx/page.tsx
  git rm client/app/virtual-date/page.tsx
  git commit -m "feat: rebrand route virtual-date to sparx"
  ```

---

### Task 3: Main Sparx View Controller (`client/src/views/Sparx.tsx`)

**Files:**
- Create: `c:\Users\nikhi\Downloads\othrhalff prod\client\src\views\Sparx.tsx`

- [ ] **Step 1: Implement Sparx controller component**
  Write the main container layout that filters Glimpses by Campus vs Global, handles fetching active stories from Supabase (created in the last 24 hours), manages scrolling, and handles the creation trigger.
  
  Include a Swipe-Up gestural tutorial overlay for first-time visitors using `localStorage` to check onboarding status.

- [ ] **Step 2: Commit Sparx main view**
  ```bash
  git add client/src/views/Sparx.tsx
  git commit -m "feat: implement Sparx view controller with feed toggles and pagination"
  ```

---

### Task 4: Glimpse Card Component with Double-Tap Reaction

**Files:**
- Create: `c:\Users\nikhi\Downloads\othrhalff prod\client\src\components\GlimpseCard.tsx`

- [ ] **Step 1: Create GlimpseCard presentation component**
  Build the vertical full-height story card. It must display the cover-cropped image, overlay details (user bio, verification status), and interactions on the right side using Lucide React (`Heart`, `Flame`, `Sparkles`, `Tv` icons) styled with glowing neon filters.
  
  Implement a double-tap gesture listener on the card to trigger a floating heart animation and record a `heart` reaction in the database.

- [ ] **Step 2: Commit card component**
  ```bash
  git add client/src/components/GlimpseCard.tsx
  git commit -m "feat: implement GlimpseCard with gestures and neon interaction buttons"
  ```

---

### Task 5: Glimpse Upload Modal & Client Resizer

**Files:**
- Create: `c:\Users\nikhi\Downloads\othrhalff prod\client\src\components\GlimpseUploadModal.tsx`

- [ ] **Step 1: Implement upload modal**
  Create the dialog allowing users to drag and drop or select a file. Write a canvas helper to compress/resize the image before uploading to Supabase Storage bucket `glimpses`. Allow entering a max 150-char caption.
  
- [ ] **Step 2: Commit upload modal**
  ```bash
  git add client/src/components/GlimpseUploadModal.tsx
  git commit -m "feat: add GlimpseUploadModal with client-side canvas compression"
  ```

---

### Task 6: Vibe Rooms Rebranding & Subroutes Porting

**Files:**
- Create: `c:\Users\nikhi\Downloads\othrhalff prod\client\app\sparx\cinema\page.tsx`
- Create: `c:\Users\nikhi\Downloads\othrhalff prod\client\app\sparx\music\page.tsx`
- Delete: `c:\Users\nikhi\Downloads\othrhalff prod\client\app\virtual-date\cinema\page.tsx`
- Delete: `c:\Users\nikhi\Downloads\othrhalff prod\client\app\virtual-date\music\page.tsx`

- [ ] **Step 1: Create subroute page wrappers**
  Map `/sparx/cinema` and `/sparx/music` to load `CinemaDate` and `MusicDate` views respectively.
  
- [ ] **Step 2: Remove old virtual-date subroutes**
  Delete old directories and clean up.

- [ ] **Step 3: Commit subroute relocations**
  ```bash
  git add client/app/sparx/cinema/page.tsx client/app/sparx/music/page.tsx
  git rm -r client/app/virtual-date/cinema client/app/virtual-date/music
  git commit -m "feat: move watch party subroutes under sparx"
  ```

---

### Task 7: Direct Room Invitation & click-to-join Flow

**Files:**
- Modify: `c:\Users\nikhi\Downloads\othrhalff prod\client\src\views\virtual-dates\CinemaDate.tsx`
- Modify: `c:\Users\nikhi\Downloads\othrhalff prod\client\src\views\virtual-dates\MusicDate.tsx`
- Modify: `c:\Users\nikhi\Downloads\othrhalff prod\client\src\views\Chat.tsx`

- [ ] **Step 1: Integrate Invite Match menu in Vibe Rooms**
  In the lobby views of `CinemaDate.tsx` and `MusicDate.tsx`, query active matches from Supabase. Render an invite menu of these matches. When clicked, create a room and write a message of type `system` to that match's chat room containing:
  `content: "Cinema Date Watch Party"`, `type: "system"`, `metadata: { action: "join_room", url: "/sparx/cinema?room=room-uuid" }`

- [ ] **Step 2: Render Invite Card in Chat view**
  In `Chat.tsx`, intercept system messages with `metadata.action === 'join_room'` and render them as custom neon-lit invitation widgets showing a Lucide `Tv` or `Music` icon and a clickable **`[Join Room 🎬]`** button.

- [ ] **Step 3: Commit invitation flow**
  ```bash
  git add client/src/views/virtual-dates/CinemaDate.tsx client/src/views/virtual-dates/MusicDate.tsx client/src/views/Chat.tsx
  git commit -m "feat: implement direct match-inviting watch parties in chat view"
  ```
