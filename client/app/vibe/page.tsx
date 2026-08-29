import { Metadata } from 'next';
import { ViralArchetypeQuiz } from '../../src/components/ViralArchetypeQuiz';
import Link from 'next/link';
import { ArrowLeft, Sparkles } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Romantic Archetype & Chemistry Test | Othrhalff',
  description: 'Take the 60-second psychological archetype quiz to discover your dating style, green flags, and highest-synergy personality matches on campus.',
  alternates: {
    canonical: 'https://www.othrhalff.in/vibe',
  },
  openGraph: {
    title: 'Discover Your Romantic Archetype | Othrhalff',
    description: 'Find out your psychological compatibility matrix and connect with your counterpart.',
    url: 'https://www.othrhalff.in/vibe',
    type: 'website',
  },
};

export default function VibePage() {
  return (
    <main className="relative min-h-[100dvh] w-full overflow-hidden bg-[#07030d] px-4 py-16 sm:px-8 sm:py-24 text-white flex flex-col items-center justify-center">
      <div className="pointer-events-none absolute left-[10%] top-[15%] h-[35rem] w-[35rem] rounded-full bg-[#F45D9B]/15 blur-[160px]" />
      <div className="pointer-events-none absolute right-[10%] bottom-[15%] h-[30rem] w-[30rem] rounded-full bg-violet-600/15 blur-[140px]" />

      <div className="relative z-10 w-full max-w-4xl mx-auto space-y-8">
        <div className="text-center space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-white/50 hover:text-white transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Home
          </Link>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white">
            Discover Your <span className="text-[#F45D9B]">Romantic Archetype</span>
          </h1>
          <p className="text-base sm:text-lg text-white/70 max-w-lg mx-auto">
            Take the 60-second psychological compatibility test. Uncover your relationship green flags and find your counterpart.
          </p>
        </div>

        <ViralArchetypeQuiz />
      </div>
    </main>
  );
}
