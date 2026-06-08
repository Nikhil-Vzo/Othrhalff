# Othrhalff - Maintenance & Feature Sprint Changelog
*Publish Date: June 2026*

This changelog summarizes the major security enhancements, real-time features, UX upgrades, and framework stability improvements completed during our recent maintenance sprint to take **Othrhalff** out of maintenance.

---

## 🛡️ 1. Security & Data Privacy (Vulnerability Remediation)
* **Supabase JWT Middleware Authentication**: Integrated a secure custom JWT verification middleware on Express server endpoints (`/api/accept-match`, `/api/post-guest-confession`, `/api/initiate-call`, `/api/agora-token`). This blocks unauthenticated API spam and prevents malicious clients from bypassing authentication using backend service keys.
* **Strict Supabase Row Level Security (RLS)**:
  * **Matches Protection**: Rewrote the `matches` table insertion policy to prevent direct injection. Matches can now only be created if a mutual "like" swipe is verified.
  * **Messages Protection**: Restricted message creation strictly to matched participants.
* **SQL RPC Hardening**: Replaced the spoofable `get_matches_with_preview` database function. Removed the client-provided `current_user_id` parameter, configuring the RPC to verify identities server-side using Supabase `auth.uid()`.
* **Local Storage Cache Invalidation**: Fixed logout leakage by ensuring all dynamic cache/expiry keys (such as matches cache `v6` and discover filters `v3`) are completely wiped from `localStorage` and `sessionStorage` upon user logout or session expiry.

## 💬 2. Chat & Real-Time Engagement (Upgrades)
* **Real-time Typing Indicators**: Implemented Supabase Realtime Broadcast to track typing states dynamically. Shows a sleek bouncing typing indicator bubble (`[User] is typing...`) right above the input bar when your match is drafting a message.
* **Live Read Receipts (Neon Glow)**: Configured the realtime channel to listen to wildcard (`*`) events on the `messages` table. Sent messages show a pulsing clock during transit, a single checkmark for delivered, and glowing neon cyan double-checkmarks once read, matching our cyberpunk aesthetics.
* **Instant Sent Confirmation**: Optimized `handleSend` to retrieve the database-inserted row immediately on insert success via `.select().single()`. This turns the clock into a checkmark instantly without waiting for WebSocket latency.
* **Quick Emoji Drawer**: Added a glassmorphic floating emoji panel (Smile icon toggle) to quickly append popular reaction emojis (`❤️`, `🔥`, `😂`, `✨`, `👀`, `🥺`, `🙌`, `💯`) to the message input.
* **Video/Audio Calling busy checks**: Reconfigured calls via Agora to check if the partner is busy (`checkUserBusy`) before ringing.

## 📣 3. Confessions Feed ("The Pulse")
* **Guest Posting Support**: Added a proxy route to allow guest users (posting under the default guest identity "Ram") to post confessions anonymously without requiring a full account setup.
* **Campus vs. Global Feeds**: Added split feed tabs so users can switch between their specific university's feed ("Campus") and a unified feed of all university confessions ("Global").
* **Race Condition Fixes**: Synchronized state loading on mount in `AuthContext` to prevent the flash of unauthenticated states from resetting global feeds. Optimized `IntersectionObserver` in `Confessions.tsx` to stop scroll duplicate-fetching.

## 🎨 4. Accessibility & UI/UX Polish
* **Keyboard Navigation**: Added interactive roles (`role="button"`), tab indexes (`tabIndex={0}`), and keyboard event handlers (`onKeyDown` for Enter/Space) to non-button interactive elements like notification rows, match list items, the brand logo, and the user profile card.
* **Aria Labels & Accessibility**: Added comprehensive `aria-label` tags to all icon-only buttons (like/dislike/pass actions, filter sliders, navigation icons, emoji toggles).
* **Next.js Loading Screen Alignment**: Replaced the default page load spinner in Next.js with the custom unified `<LoadingState />` component so that page transitions look completely smooth.

## ⚙️ 5. Next.js Migration & Platform Stability
* **Edge Maintenance Middleware**: Implemented Next.js Edge Middleware to redirect unauthenticated/maintenance-period users to a custom "Renovating Othrhalff" landing page with animated mock early-access inputs and a romantic ASCII logo.
* **Vite-to-Next.js Port**: Completed the full migration of the frontend web application from Vite to Next.js (App Router layout, dynamic page routes, server-side environment variable exposure, and vercel.json configurations).
