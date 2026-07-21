# Landing Page Pinterest Masonry Section Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement an Awwwards-inspired Pinterest Asymmetric Masonry Section ("Beyond Dating") in `Landing.tsx` highlighting traditional dating app pain points vs. Othrhalff's micro-local campus features.

**Architecture:** A responsive 2-column staggered layout in `Landing.tsx` featuring muted red-tinted glassmorphic cards for traditional dating app fatigue on the left, and vibrant Rose Pink (`#F45D9B`) glowing glassmorphic cards for Othrhalff features on the right, integrated with staggered scroll-reveal animations.

**Tech Stack:** React, Next.js, Tailwind CSS, Lucide React icons (`Ghost`, `Sparkles`, `Clock`, `MessageSquare`, `Video`, `ShieldCheck`, `MapPin`, `Flame`).

---

### Task 1: Add Pinterest Masonry Section Component to Landing.tsx

**Files:**
- Modify: `client/src/views/Landing.tsx:340-420`

- [ ] **Step 1: Inspect Landing.tsx insertion point**

Check `client/src/views/Landing.tsx` between the hero CTA block and the marquee section to locate the exact mounting point for the new Pinterest Masonry Section.

- [ ] **Step 2: Add Pinterest Masonry Section JSX Markup**

In `client/src/views/Landing.tsx`, right before the marquee section container inside `<main>`, insert the Pinterest Asymmetric Masonry Section:

```tsx
{/* 2. BEYOND DATING: PINTEREST ASYMMETRIC MASONRY SECTION */}
<ScrollReveal className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-32 relative z-10">
  {/* Section Header */}
  <div className="text-center max-w-3xl mx-auto mb-16 sm:mb-24">
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-[#F45D9B]/30 mb-6 backdrop-blur-md shadow-[0_0_20px_rgba(244,93,155,0.15)]">
      <span className="w-2 h-2 rounded-full bg-[#F45D9B] animate-pulse" />
      <span className="text-xs font-semibold text-white/90 uppercase tracking-widest">
        Beyond Dating • Campus Synergy
      </span>
    </div>
    
    <h2 className="text-4xl sm:text-6xl md:text-7xl font-semibold tracking-tight text-white mb-6 leading-[1.1] font-display">
      Beyond Dating.<br />
      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F45D9B] via-pink-400 to-purple-400">
        Built For Campus Life.
      </span>
    </h2>
    
    <p className="text-base sm:text-xl text-white/70 font-normal leading-relaxed">
      Traditional apps put you on a 20-mile wild goose chase. Othrhalff connects you with the people in your actual lecture halls, gym sessions, and campus spots.
    </p>
  </div>

  {/* Pinterest Asymmetric Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8 items-start">
    {/* COLUMN 1: Traditional Dating Apps (The Problem) */}
    <div className="flex flex-col gap-6 sm:gap-8">
      {/* Card 1: Swipe Fatigue */}
      <div className="bg-red-950/10 border border-red-500/20 p-6 sm:p-8 rounded-3xl backdrop-blur-xl hover:border-red-500/40 transition-all duration-500 group">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono uppercase tracking-wider text-red-400/80 font-bold">Traditional Apps</span>
          <Clock className="w-4 h-4 text-red-400/60" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Swipe Fatigue & Distance</h3>
        <p className="text-xs sm:text-sm text-white/60 mb-6 leading-relaxed">
          Trapped in endless swiping loops with profiles located 20 miles away. Zero campus relevance.
        </p>
        <div className="bg-black/40 border border-red-500/20 p-4 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3 opacity-50 blur-[0.5px]">
            <div className="w-10 h-10 rounded-full bg-red-950/40 border border-red-500/20" />
            <div>
              <div className="text-xs font-semibold text-white">Stranger #482</div>
              <div className="text-[10px] text-red-400">22 Miles Away</div>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/30 text-red-300">
            No Vibes
          </span>
        </div>
      </div>

      {/* Card 2: Awkward Small Talk */}
      <div className="bg-red-950/10 border border-red-500/20 p-6 sm:p-8 rounded-3xl backdrop-blur-xl hover:border-red-500/40 transition-all duration-500">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono uppercase tracking-wider text-red-400/80 font-bold">The Friction</span>
          <MessageSquare className="w-4 h-4 text-red-400/60" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Dry Small Talk</h3>
        <p className="text-xs sm:text-sm text-white/60 mb-4 leading-relaxed">
          Shallow greetings that lead nowhere. No common college context.
        </p>
        <div className="space-y-2">
          <div className="bg-red-950/30 border border-red-500/15 p-2.5 rounded-xl text-xs text-red-200/70 max-w-[70%]">
            "hey"
          </div>
          <div className="bg-red-950/30 border border-red-500/15 p-2.5 rounded-xl text-xs text-red-200/70 max-w-[70%] ml-auto text-right">
            "wyd"
          </div>
        </div>
      </div>
    </div>

    {/* COLUMN 2: The Othrhalff Way (The Solution) */}
    <div className="flex flex-col gap-6 sm:gap-8 md:mt-12">
      {/* Card 1: Row 2 Lecture Partner */}
      <div className="bg-white/[0.03] border border-[#F45D9B]/30 p-6 sm:p-8 rounded-3xl backdrop-blur-xl hover:border-[#F45D9B]/60 hover:scale-[1.01] transition-all duration-500 shadow-[0_0_40px_rgba(244,93,155,0.1)] group">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono uppercase tracking-wider text-[#F45D9B] font-bold">The Othrhalff Way</span>
          <span className="px-2.5 py-0.5 rounded-full bg-[#F45D9B]/10 border border-[#F45D9B]/30 text-[10px] font-bold text-[#F45D9B]">
            98% Vibe Match
          </span>
        </div>
        <h3 className="text-2xl sm:text-3xl font-bold text-white mb-2">Row 2 Lecture Partner</h3>
        <p className="text-xs sm:text-sm text-white/70 mb-6 leading-relaxed">
          "Looking for someone to argue about Christopher Nolan movies with after class."
        </p>
        <div className="flex flex-wrap gap-2 mb-4">
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80">Cinema</span>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80">Indie Rock</span>
          <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs text-white/80">Late Night</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/50">
          <MapPin className="w-3.5 h-3.5 text-[#F45D9B]" />
          <span>Delhi University Campus • Active Now</span>
        </div>
      </div>

      {/* Card 2: Ghost Mode Privacy */}
      <div className="bg-white/[0.03] border border-purple-500/30 p-6 sm:p-8 rounded-3xl backdrop-blur-xl hover:border-purple-500/60 hover:scale-[1.01] transition-all duration-500 shadow-[0_0_40px_rgba(168,85,247,0.1)]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono uppercase tracking-wider text-purple-400 font-bold">Privacy First</span>
          <ShieldCheck className="w-4 h-4 text-purple-400" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Ghost Mode Protection</h3>
        <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
          Chemistry first, identity second. Reveal visuals only when the vibe is verified.
        </p>
      </div>

      {/* Card 3: Synchronized Hangouts */}
      <div className="bg-white/[0.03] border border-cyan-500/30 p-6 sm:p-8 rounded-3xl backdrop-blur-xl hover:border-cyan-500/60 hover:scale-[1.01] transition-all duration-500 shadow-[0_0_40px_rgba(6,182,212,0.1)]">
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-bold">Virtual Auditorium</span>
          <Video className="w-4 h-4 text-cyan-400" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white mb-2">Synchronized Dates</h3>
        <p className="text-xs sm:text-sm text-white/70 leading-relaxed">
          Watch movies side-by-side or stream music tracks with dynamic live overlay chat.
        </p>
      </div>
    </div>
  </div>
</ScrollReveal>
```

- [ ] **Step 3: Verify build and imports**

Ensure `MapPin`, `Clock`, `MessageSquare`, `ShieldCheck`, `Video` are imported from `'lucide-react'` in `Landing.tsx`.

- [ ] **Step 4: Commit changes**

```bash
git add client/src/views/Landing.tsx
git commit -m "feat(landing): add Awwwards-inspired Pinterest Asymmetric Masonry section"
```

---

### Task 2: Verify Responsive Layout & Clean Code Sync

**Files:**
- Modify: `client/src/views/Landing.tsx`

- [ ] **Step 1: Check code syntax & formatting**
Inspect `client/src/views/Landing.tsx` to verify clean JSX closing tags, correct Tailwind classes, and high text contrast.

- [ ] **Step 2: Push changes to main branch**

```bash
git push origin main
```
