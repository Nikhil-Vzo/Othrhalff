# Design Specification: The Continuous Campus Landing Experience

**Date:** 2026-07-21  
**Target:** Othrhalff Landing Page (`client/src/views/Landing.tsx`)  
**Design Level:** Awwwards / Apple / Linear / Lusion Inspired — Zero Mediocrity  
**Status:** Approved for Spec Review  

---

## 1. Vision & Architectural Philosophy

We are not building generic web sections separated by hard dividers. We are building **one continuous, flowing experience**.

Every scroll movement feels like an organic discovery of the product. The site prioritizes:
* **Generous Whitespace:** One primary focal point per viewport.
* **Fluid Scrollytelling:** Sticky viewport pinning, smooth opacity/blur reveals, and natural transitions.
* **Speed & Performance:** 60fps hardware-accelerated CSS transforms (`translate3d`, `scale`, `opacity`, `filter: blur()`). Avoid heavy WebGL/Three.js bundles that degrade mobile performance.
* **Dual Native Design:** Mobile and desktop layouts are designed simultaneously so mobile feels like a luxury native editorial feed, not a squeezed desktop site.

---

## 2. Color Palette & Typography Guidelines

* **Primary Background:** Deep dark void (`#07030d`) with subtle radial gradients and a 5% noise overlay texture.
* **Accent Color:** Soft Rose Pink (`#F45D9B`) used as a refined 10% accent (never overwhelming or neon).
* **Text Hierarchy:**
  * **Display Headline:** Sentence-case or editorial title-case, tight tracking, font-display (`text-4xl sm:text-6xl md:text-7xl lg:text-8xl`).
  * **Body Copy:** White with high contrast opacity (`text-white/95` or `text-white/80`), `font-normal`, generous line height.

---

## 3. Viewport-by-Viewport Sequence

### **Viewport 1: The Hero**
* **Background:** High-res Shinkai campus landscape (`/landing_hero-bg.png?v=2`) with ambient drifting cherry blossom petals and top navigation scrim.
* **Content:**
  * Navbar: Resizable animated floating capsule header (`OtherHalff`).
  * Title: *"Find your people."*
  * Subtext: *"Meet students you'll naturally cross paths with every day."*
  * Button: White capsule CTA *"Join Your Campus"*.

### **Viewport 2: Seamless Transition & Phone Emergence**
* As the user scrolls down, the landscape softly fades into atmospheric mist (`opacity: 0.2`, `filter: blur(4px)`).
* A floating phone mockup emerges into view naturally from the lower fold without sudden pop-ins.

### **Viewport 3: Interactive Product Reveal (Sticky Phone Scrollytelling)**
* The phone container becomes `sticky` at the center of the viewport.
* As the user continues scrolling, the screen inside the phone smoothly cross-fades through a student’s daily journey:
  1. `Nearby` (Campus radar & proximity tags)
  2. `Discover` (98% Vibe Match cards)
  3. `Profile` (Interests, cinema & music tags)
  4. `Chat` (Fluid text conversations)
  5. `Ghost Mode` (Identity locked, verified chemistry)

### **Viewport 4: Editorial Typography Break**
* A full-viewport statement with maximum negative space:
  > **"You were**  
  > **never**  
  > **far away."**
* One sentence. One viewport. Complete focus.

### **Viewport 5: Editorial Filmstrip Gallery**
Instead of repetitive feature grids, the section alternates in a natural visual rhythm:
1. **Full-Bleed Campus Photography:** Atmospheric university morning photo.
2. **Huge Quote Tile:** *"The best connections already share your campus."*
3. **App UI Close-Up Card:** High-detail glassmorphic UI mockup of the campus event watch party.
4. **Looping Ambient Video:** Muted, autoplay video clip of students walking across the quad.
5. **Glass Statistic Tile:** `300+ Active Campus Peers`.

### **Viewport 6: Conversion & Footer**
* Smooth fade into the final CTA section with a clean *"Join Your Campus"* button and minimalist footer navigation.

---

## 4. Motion Language & Performance Standards

* **Allowed Motion:** `opacity`, `translate3d`, `scale(0.98 -> 1)`, `filter: blur()`, `clip-path`.
* **Prohibited Motion:** Bounce, flip, 3D spin, or jarring spring animations.
* **Asset Optimization:**
  * Video elements are muted, loop, autoplay, and pause when off-screen.
  * Images use hardware-accelerated rendering (`image-rendering: -webkit-optimize-contrast`).
  * CSS transforms perform at 60fps on mid-range mobile devices.

---

## 5. Mobile-First Execution Strategy

* **Single Column Editorial Feed:** On mobile screens (<768px), the layout turns into a continuous, luxury magazine feed.
* **Touch Interactions:** Hover states are replaced by clean active touch states (`active:scale-[0.98]`).
* **Optimized Phone Mockups:** Phone renders scale up to fill 85% of mobile width with enlarged typography for maximum legibility.
