# OthrHalff Landing Page Design Spec

- **Date:** 2026-07-19
- **Aesthetic:** Cyber-Nostalgia / Retro Terminal
- **Target Demographic:** University Students

## Design System & Tokens

### Color Palette
- `--bg-dark`: `#07030d` (Deep cosmic background)
- `--neon-pink`: `#ff007f` (Primary neon highlight)
- `--purple-glow`: `#a855f7` (Secondary purple glow)
- `--cyber-cyan`: `#00f0ff` (Electric accent blue)

### Typography
- **Headers (Titles):** `Space Grotesk` or `Outfit` (Bold, condensed display)
- **Tagline (Hindi):** `Teko` or `Poppins` (Devanagari script support)
- **Body Text:** `Inter` (Sleek sans-serif)
- **Branding & Console:** `Space Mono` or `Fira Code` (Monospace terminal text)

## Page Layout & Agenda

### 01 / Hero Section
- **Visuals:** Centered layout. Title, tagline, description, and "Enter the space" CTA button are all centered. The background displays `landing_hero-bg.png` with a radial gradient overlay to maintain text readability.

### 02 / The Campus Pulse & Tagline
- **Copy:** "Find the right that fits right." / "जो फिट बैठे, वही सही।"
- **Stats Card:** A central glassmorphic container displaying "300+ Active Campus Peers" with an active student indicator and a glowing radar shimmer effect. Includes a placeholder slot for a custom stats mascot.

### 03 / Ghost Mode (Feature 1)
- **Interactive Mockup:** Tilted 3D smartphone frame 1 (rotated Y by 12 deg) playing a swipe/match screen recording.
- **Copy:** Chemistry First, Visuals Second. Explain anonymous matching. Includes placeholder for the ghost mascot.

### 04 / Virtual Dates (Feature 2)
- **Interactive Mockup:** Tilted 3D smartphone frame 2 (rotated Y by -12 deg) displaying movie watch party synchronization.
- **Copy:** Synchronized Playback Rooms. Watch movies/playlists together. Includes placeholder for the cinema mascot.

### 05 / Brand Heritage (ASCII Mascot)
- **Branding:** Displays the text-based ghost mascot ASCII art from `ascii-art.txt` in a terminal pre-tag screen container with neon text shadows.

### 06 / Final CTA
- **Mascot Video:** Custom winking ghost video `/ghost_wink.mp4` playing above the ripped admission ticket webm.

## Verification & Build
- Checked via `npm run build` to ensure 100% compilation and type check safety.
