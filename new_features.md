# Othrhalff - Proposed Chat Features (Gen Z & Privacy Focused)

This file contains premium feature concepts for Othrhalff's chat interface. You can instruct future AI coding agents to read this file (`new_features.md`) when you are ready to begin implementing any of these features.

---

## 1. Icebreakers & Mini-Games (Conversation Starters)
* **Goal**: Break the ice in "Ghost Chemistry First" matches before user identities/photos are revealed.
* **Concepts**:
  * **2 Truths and a Lie**: A small interactive widget where both users submit 2 truths and 1 lie, and the partner has to guess which one is the lie.
  * **Campus Trivia**: Localized university questions (e.g. comparing dining halls or library study spots) to find common ground.
  * **Would You Rather?**: Rapid-fire lighthearted questions (e.g. *"Would you rather take a 9:00 AM class on Saturday or study in the library basement for 24 hours straight?"*).

---

## 2. Blur & Reveal (Self-Destructing Media)
* **Goal**: Share photos securely and playfully while keeping the mystery alive.
* **Concepts**:
  * **Encrypted/Pixelated Send**: Images sent through chat are rendered as fully pixelated/blurred CSS blocks.
  * **Timed Reveal**: The recipient taps the blurred image to reveal it clearly for a 5-second countdown.
  * **Self-Destruction**: Once the 5-second timer expires, the image is automatically deleted from Supabase storage and the database, and the message block becomes unviewable (complementing the screenshot block).

---

## 3. Voice Notes with Visual Waveforms
* **Goal**: Share voice messages dynamically, a highly popular medium for Gen Z.
* **Concepts**:
  * **Mic Recording Button**: Press-and-hold to record audio using the browser's MediaRecorder API.
  * **Audio Upload**: Uploads the `.webm`/`.mp3` snippet to a private Supabase Storage bucket.
  * **Animated Waveform**: Renders inline inside the chat bubble with a visual play/pause waveform that animates while playing.

---

## 4. Virtual Date Co-Activities (Cinema & Music Date)
* **Goal**: Initiate shared activities directly from the chat screen.
* **Concepts**:
  * **Cinema Date Invite**: Launches a synchronized YouTube player inside a split-pane chat interface, allowing both matches to watch campus vlogs, shows, or videos in sync.
  * **Music Share Date**: Integration of a shared Spotify/audio playlist sync, letting matches stream music together in real-time.
  * **Trivia / Canvas Paint**: A lightweight multiplayer painting canvas or trivia board.

---

## 5. Premium Chat Themes (Crown Tier)
* **Goal**: Custom chat bubbles and backgrounds to drive premium subscriptions.
* **Concepts**:
  * **Themed Backgrounds**: Glassmorphic gradients (e.g. *Synthwave Night (Neon Pink/Dark Blue)*, *Aurora Emerald*, *Retro Sunset*, *Cyberpunk Grid*).
  * **Custom Bubbles**: Glowing neon outlines for bubbles, custom bubble colors, and custom emoji reactions.
  * **Monetization**: Only users with the premium "Crown" status (`is_premium: true`) can change or unlock custom chat backgrounds.

---

## 6. Pulse-to-Ghost Bridge (Confession Matching)
* **Goal**: Turn anonymous feed posts into active matches.
* **How it works**: When a user reads a confession on the feed (excluding their own), they can click a glassmorphic **"Connect Anonymously"** button. The poster receives a notification to accept or ignore. If accepted, a new anonymous Ghost chat is spawned.
* **Codebase Locations & Implementation Details**:
  * **Database Schema (`public.matches` & `public.messages` tables)**:
    * Introduce a nullable `origin_confession_id` column to the `matches` table to track matches created directly from anonymous confessions.
  * **Express Backend (`server/index.js`)**:
    * **New Endpoint**: Create a `/api/initiate-confession-match` POST route (protected by JWT middleware) to allow users to request a connection on a specific confession.
    * **New Endpoint**: Create `/api/accept-confession-match` to let the confession author accept and spawn the chat.
  * **Confessions Page (`client/src/views/Confessions.tsx`)**:
    * Add a glassmorphic **"Connect Anonymously"** hover/action button on confessions cards (excluding the user's own posts).
    * Tapping this triggers the backend API call to request a connection.
  * **Notifications View (`client/src/views/Notifications.tsx`)**:
    * Support rendering a new notification type (`confession_connect`) with options to **"Accept"** or **"Ignore"** the anonymous connection request.
  * **Matches & Chat Layout (`client/src/views/Matches.tsx` & `client/src/views/Chat.tsx`)**:
    * Modify the listing to display a themed neon icon (e.g. a small glowing speech bubble with a quote from the confession) to remind matches of the specific confession topic that connected them.

---

## 7. Sparx (Campus Activity & Interaction Hub)
* **Goal**: A dedicated hub replacing the "Virtual Date" navigation tab, showing real-time campus activity.
* **Core Components**:
  * **Sparx Navigation**:
    * The navigation bar option is renamed to **Sparx** (labeled "SPARX" on mobile, using a lightning bolt or glowing spark icon ⚡).
  * **Campus Glimpses (TikTok-style Stories Feed)**:
    * Tapping the Sparx tab opens the **Glimpses Feed** directly as the default screen.
    * **Feed Layout**: An immersive vertical scrolling view of full-height photos (TikTok style) shared by students on campus.
    * **Interactive Tutorial**: A gestural animation (e.g. an animated finger sliding up) overlays on the first launch to teach users how to swipe through stories.
    * **Interaction**: Users can double-tap or tap glowing reaction overlays (❤️ / 🔥) to send instant lightweight notifications to the creator.
    * **Expiration**: Stories auto-expire and disappear from the feed after exactly 24 hours.
  * **Glimpse Creation (In-App Camera)**:
    * Tap a post button on the Sparx feed to open a custom, glassmorphic in-app viewfinder.
    * Uses browser media devices to capture photos directly with front/back camera toggles.
    * Features a fallback upload button for selecting photos from the device gallery.
    * Allows overlaying a typed short text caption before posting.
  * **Campus Heat Map (Interactive Radar)**:
    * *Access Point*: `[TBD]`
    * *Concept*: A stylized campus map background (static image or custom loop video) showing real-time active spots on campus.
    * *Functionality*: Utilizes the browser Geolocation API (`navigator.geolocation`) to anonymously detect which campus zone (e.g. library, quads, dorms) the user is in and ping the server, lighting up pulsing neon SVG heat maps.
  * **Duo Dates (Private Cinema & Music Studio)**:
    * *Access Point*: `[TBD]`
    * *Functionality*: Retains the PeerJS-based private synchronized YouTube watch parties and music studio.
