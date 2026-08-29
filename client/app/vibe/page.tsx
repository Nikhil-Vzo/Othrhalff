import { Metadata } from 'next';
import { ViralArchetypeQuiz } from '../../src/components/ViralArchetypeQuiz';
import Link from 'next/link';
import { ArrowLeft, Sparkles, ShieldCheck, Users, Flame, Zap } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Romantic Archetype & Chemistry Radar (60s Test) | Othrhalff',
  description: 'Discover your relationship archetype, psychological green flags, and highest-synergy campus matches. 100% free, 60-second chemistry radar.',
  alternates: {
    canonical: 'https://www.othrhalff.in/vibe',
  },
  openGraph: {
    title: 'Discover Your Romantic Archetype | Othrhalff',
    description: 'Find out your psychological compatibility matrix and connect with your counterpart on campus.',
    url: 'https://www.othrhalff.in/vibe',
    type: 'website',
  },
};

export default function VibePage() {
  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-[#06010a] px-4 py-16 sm:px-8 sm:py-24 text-white flex flex-col items-center justify-center">
      {/* ── Atmospheric Backdrop Asset & Mesh ── */}
      <div className="pointer-events-none absolute inset-0 opacity-20">
        <img
          src="/assets/vibe/midnight-connection.png"
          alt="Midnight Connection Atmospheric Background"
          className="h-full w-full object-cover object-center filter blur-[60px] scale-110"
        />
      </div>
      <div className="pointer-events-none absolute left-[5%] top-[12%] h-[38rem] w-[38rem] rounded-full bg-[#F45D9B]/15 blur-[160px]" />
      <div className="pointer-events-none absolute right-[5%] bottom-[12%] h-[32rem] w-[32rem] rounded-full bg-violet-600/18 blur-[150px]" />
      <div className="pointer-events-none absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative z-10 w-full max-w-4xl mx-auto space-y-8">
        {/* ── Header Intro ── */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest text-white/60 transition-all hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
            </Link>

            <div className="inline-flex items-center gap-1.5 rounded-full border border-[#F45D9B]/30 bg-[#F45D9B]/10 px-3.5 py-1.5 font-mono text-[11px] font-bold text-[#F45D9B]">
              <Flame className="h-3.5 w-3.5 fill-current" /> 1,420+ Tests Taken Today
            </div>
          </div>

          <h1 className="font-geist text-4xl sm:text-6xl font-black tracking-tight text-white leading-none">
            Discover Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F45D9B] via-[#FF007F] to-violet-400">Romantic Archetype</span>
          </h1>

          <p className="text-sm sm:text-base text-white/70 max-w-md mx-auto leading-relaxed">
            Stop guessing. Take the 60-second psychological radar test to unlock your dating blueprint and find your highest-synergy campus match.
          </p>
        </div>

        {/* ── The Quiz Component ── */}
        <ViralArchetypeQuiz />

        {/* ── Social Proof & Trust Badges ── */}
        <div className="mx-auto flex flex-wrap items-center justify-center gap-6 pt-4 text-center font-mono text-[11px] text-white/50">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            <span>100% Anonymous & Private</span>
          </div>
          <span className="hidden sm:inline text-white/20">•</span>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#F45D9B]" />
            <span>Verified Campus Matching</span>
          </div>
          <span className="hidden sm:inline text-white/20">•</span>
          <div className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-violet-400 fill-current" />
            <span>Daily 8:00 PM Synchronous Spark</span>
          </div>
        </div>
      </div>
    </main>
  );
}
