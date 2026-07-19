# Specification: Sparx - Glimpses & Vibe Rooms (Duo Dates)

## 1. Goal & Product Overview
The **Sparx Hub** is a dedicated real-time interaction center for university students. It contains two core features:
1.  **Glimpses:** A TikTok-style vertical stories feed of photos shared by students on campus that auto-expires after 24 hours.
2.  **Vibe Rooms (Duo Dates):** Rebranded, Discord-style synchronized cinema and music spaces. Matches can create private streaming rooms and invite their partner with a single tap, sending a clickable "Join Room" button directly into their chat.

This specification details the feed-first layout (Option A), the uploading system, the integration of existing PeerJS watch parties, and the simplified match-invite flow.

---

## 2. Technical Architecture & Database Schema

### Database Schema (Supabase)
To support glimpses, we define two new tables: `glimpses` and `glimpse_reactions`.

```sql
-- 1. Glimpses Metadata Table
CREATE TABLE public.glimpses (
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
CREATE POLICY "Glimpses are viewable by authenticated users" 
  ON public.glimpses FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Insert: Users can only upload glimpses under their own ID
CREATE POLICY "Users can insert their own glimpses" 
  ON public.glimpses FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- Delete: Users can delete their own glimpses
CREATE POLICY "Users can delete their own glimpses" 
  ON public.glimpses FOR DELETE 
  USING (auth.uid() = user_id);


-- 2. Glimpse Reactions Table (Hearts, Flames, and Likes)
CREATE TABLE public.glimpse_reactions (
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
CREATE POLICY "Reactions are viewable by authenticated users" 
  ON public.glimpse_reactions FOR SELECT 
  USING (auth.role() = 'authenticated');

-- Insert: Users can only react as themselves
CREATE POLICY "Users can insert reactions" 
  ON public.glimpse_reactions FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

### Storage Bucket (`glimpses`)
*   **Bucket Name:** `glimpses` (Publicly accessible bucket for optimized content distribution).
*   **Insert Policy:** Restricted to authenticated users who can write files only into their own subfolders (`auth.role() = 'authenticated'`).
*   **Select Policy:** Open read access (`true`) for anyone requesting public URLs.

---

## 3. UI/UX & Aesthetics (Respecting `frontend-skills.md`)

To avoid "cheap" standard templates or raw text emojis, the UI leverages professional vector iconography (Lucide React) styled with glowing neon filters, soft glassmorphism, and smooth active scaling.

### Main View Layout
The route `/sparx` is a full-height container with:
1.  **Campus Switcher (Top):** A floating glassmorphic pill segmented control displaying **My Campus** and **Global**, allowing students to switch between local and cross-campus views.
2.  **Stories Container:** A scroll container matching the mobile viewport height (`h-[100dvh]`) configured with CSS scroll snapping:
    ```css
    .stories-container {
      scroll-snap-type: y mandatory;
      overflow-y: scroll;
    }
    .story-card {
      scroll-snap-align: start;
      height: 100dvh;
    }
    ```
3.  **Interaction Overlay (Right Side):**
    *   **Heart button (`Heart` Lucide Icon):** Sends a ❤️ reaction. Animates with a pop-scale and glows pink.
    *   **Flame button (`Flame` Lucide Icon):** Sends a 🔥 reaction. Glows orange.
    *   **Connect/Like button (`Sparkles` Lucide Icon):** Initiates a mutual swipe/like. Glows purple.
    *   **Duo Dates button (`Tv` Lucide Icon):** Opens the Vibe Rooms / Duo Dates lobby panel.
4.  **Floating Action Button (FAB):** A clean neon pink circular button in the bottom right corner with a simple `Plus` icon to trigger the upload modal.

---

## 4. Vibe Rooms (Duo Dates) Integration

We will port the existing 1,700-line PeerJS watch party and music session logic into the `/sparx` directory:
*   `/virtual-date/cinema` -> `/sparx/cinema`
*   `/virtual-date/music` -> `/sparx/music`

### Simplification of the Room Connection Flow
Instead of forcing users to copy-paste room codes manually:
1.  **Direct Invitation Menu:**
    *   In the Room Lobby (e.g. `/sparx/cinema` landing), the user sees a list of their current active matches.
    *   Clicking **"Invite to Stream"** automatically creates a room with a unique UUID (`cinema-room-id`).
    *   It sends a system message directly to the target match's chat channel:
        ```json
        {
          "content": "Cinema Date Watch Party",
          "type": "system",
          "metadata": {
            "action": "join_room",
            "url": "/sparx/cinema?room=cinema-room-id"
          }
        }
        ```
2.  **Inline Join Button:**
    *   In the Chat View (`Chat.tsx`), when a message of type `system` with `action: 'join_room'` is received, it renders as a custom neon card containing a **`[Join Watch Party 🎬]`** button.
    *   Tapping the button immediately routes the partner to `/sparx/cinema?room=cinema-room-id` and opens the media connection.

---

## 5. Frontend Component Breakdown

We will create/modify the following files:

### 1. `client/src/views/Sparx.tsx`
The primary controller view that:
*   Queries active glimpses from Supabase.
*   Handles pagination and swipe gestures.
*   Provides a toggle overlay to load the Vibe Rooms (Duo Dates) Lobby.
*   Shows a gestural hand overlay guide (`SwipeUp` animation) on the first launch of the tab using local storage checking.

### 2. `client/src/components/GlimpseCard.tsx`
Renders an individual story card:
*   Displays the photo inside a cover container.
*   Has a bottom dark-fade gradient container with user credentials (name/avatar) and caption.
*   Provides double-tap detectors on the screen: double-tapping anywhere on the image triggers a floating neon heart animation and registers a Heart reaction.

### 3. `client/src/components/GlimpseUploadModal.tsx`
*   Features a drag-and-drop file picker.
*   Allows users to enter a text caption (max 150 characters).
*   Includes client-side image compression (using standard canvas resizing) before uploading to Supabase to save storage space and optimize bandwidth.

---

## 6. Verification Plan

### Automated Verification
*   Compile client-side code: `npx tsc --noEmit`.
*   Run tests to verify route transitions: `npm run test`.

### Manual Testing Scenarios
1.  **Upload Glimpse:** Select an image, write a caption, and verify it uploads successfully to the Supabase storage bucket.
2.  **Stories Swiping:** Verify card snapping works correctly on mobile viewport views.
3.  **Feed Expiration:** Verify stories older than 24 hours do not appear in queries.
4.  **Reactions:** Verify clicking Heart/Flame triggers database inserts and updates count values live.
5.  **Duo Date Invitation:** Launch a Cinema Room, select a match to invite, verify the custom "Join Watch Party" card appears in their chat, and check if clicking it joins the room successfully.
