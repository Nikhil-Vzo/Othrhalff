<!-- 
DEVELOPER/AGENT INSTRUCTION: 
DO NOT read or load this file automatically during startup. 
Only read this file when the user explicitly mentions "changelog" or asks you to view the changelog.
-->

# Othrhalff is Back Online! 🚀 (Official Release Notes)

We are officially out of maintenance! Over the last 48 hours, the Othrhalff team has been cooking up some major upgrades to make your connections smoother, safer, and a lot more fun. 

Here is what's new in Othrhalff:

---

### 💬 1. Supercharged Real-Time Chatting
* **Local Offline Storage & Delta Sync (Dexie DB)**: Integrated client-side IndexedDB using Dexie.js. Your chat history now loads instantly from local storage, allowing you to view and navigate chats even without an active network connection. We implemented **Delta Sync** (only fetching messages created after your latest local message) and a **5-minute Profile Cache TTL** in the background, slashing initial load times and API requests to near-zero.
* **Optimistic UI & Message Status Indicators**: Messages appear instantly in the chat window with a "sending" (pulsing clock) indicator. Once saved on the server, they update to "delivered" / "read", and show a "failed" alert if the transmission fails.
* **Double-Tap Message Reactions**: Double-tapping any message bubble instantly toggles a floating heart (`❤️`) reaction with a sleek spring scale-up animation.
* **Custom Chat Themes & Wallpapers**: Switch the chat's background theme directly from the header's triple-dot menu. Choose between *Midnight Glow* (default deep gradient), *Cyberpunk Grid* (neon wireframe), *Nebula* (space violet dust), or *Minimalist Slate* (clean dark gray)—all rendered via pure CSS gradients with zero assets to download.
* **Scroll-to-Bottom Floating Button**: Scrolling up in longer chats automatically renders a sleek, glassmorphic scroll-down indicator that bounces and smoothly snaps you back to the latest message when clicked.
* **Typing Indicators**: No more waiting in suspense! You can now see exactly when your match is drafting a message with our new animated typing bubble.
* **Live Read Receipts (Neon Glow)**: Instantly track your message delivery status. Messages show a pulsing clock during transit, a single checkmark when delivered, and glowing neon cyan double-checkmarks the second they are read.


### 📣 2. Feed Upgrades ("The Pulse")
* **Campus vs. Global Feeds**: Switch easily between confessions from your specific university ("Campus") and a unified feed of anonymous posts from campuses nationwide ("Global").
* **Seamless Guest Posting**: Want to share a quick secret without registering? You can now post anonymously as a guest instantly.

### 🛡️ 3. Ironclad Security & Privacy
* **Mutual-Swipe Protection**: We've secured the database logic so matches can *only* be created when both users have mutually swiped "like" on each other. No one can force or inject a match.
* **Encrypted Chat Isolation**: Message delivery is locked down to verify you are a participant of the match. Your chats remain private, screenshots are blocked, and messages automatically self-destruct after 3 days.
* **Safe Logout**: Logging out now completely wipes all local history and matches cache from the browser, keeping your account safe on shared devices.

### 🎨 4. Design & Smooth Navigation
* **Seamless Loading Screen**: We've updated the initial loading page to feature bouncing ghosts and random college dating quotes to match the app's aesthetic.
* **Full Accessibility**: The app now fully supports keyboard navigation and screen readers across notifications, match cards, swipe decks, and menus.
