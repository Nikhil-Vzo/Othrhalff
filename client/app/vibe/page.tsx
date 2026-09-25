import { Metadata } from 'next';
import { ViralArchetypeQuiz } from '../../src/components/ViralArchetypeQuiz';
import Link from 'next/link';
import { ArrowLeft, Sparkles, Flame } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Campus Archetype & Synergy Radar | Othrhalff',
  description: 'Discover your campus personality archetype, collaboration traits, and highest-synergy peers. 60-second campus radar.',
  alternates: {
    canonical: 'https://www.othrhalff.in/vibe',
  },
  openGraph: {
    title: 'Discover Your Campus Archetype | Othrhalff',
    description: 'Find out your campus personality compatibility matrix and connect with like-minded peers on campus.',
    url: 'https://www.othrhalff.in/vibe',
    type: 'website',
  },
};

export default function VibePage() {
  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-[#07030d] px-4 py-12 sm:px-8 sm:py-20 text-white flex flex-col items-center justify-center">
      {/* ── Aesthetic vibe-bg Backdrop Asset ── */}
      <div className="pointer-events-none absolute inset-0 z-0">
        <img
          src="/assets/vibe/vibe-bg.png"
          alt="Othrhalff Vibe Background"
          className="h-full w-full object-cover object-center opacity-40 mix-blend-screen filter saturate-150"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#07030d]/80 via-transparent to-[#07030d]/95" />
      </div>

      <div className="relative z-10 w-full max-w-3xl mx-auto space-y-6">
        {/* ── Header Intro with Geraldine Script Font ── */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/40 px-3.5 py-1.5 font-mono text-[10px] font-bold uppercase tracking-widest text-white/70 backdrop-blur-md transition-all hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-3 w-3" /> Back
            </Link>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#F45D9B]/30 bg-[#F45D9B]/10 px-3 py-1 font-mono text-[10px] font-bold text-[#F45D9B]">
              <Sparkles className="h-3 w-3" /> 60s Radar
            </div>
          </div>

          <h1 className="text-4xl sm:text-6xl font-normal text-white leading-none tracking-wide">
            Discover Your <span className="font-geraldine text-5xl sm:text-7xl text-[#F45D9B] tracking-normal inline-block ml-1">Campus Archetype</span>
          </h1>

          <p className="text-xs sm:text-sm text-white/70 max-w-sm mx-auto font-medium leading-relaxed">
            Take the 60-second radar test to unlock your campus personality blueprint and find your study & project peers.
          </p>
        </div>

        {/* ── The Clean Skeuomorphic Quiz Component ── */}
        <ViralArchetypeQuiz />
      </div>
    </main>
  );
}
