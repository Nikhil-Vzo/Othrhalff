"use client";

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, ArrowRight, Zap } from 'lucide-react';
import { competitorList, type CompetitorData } from '../data/competitors';

export type { CompetitorData };
export { competitorList };

export const VsCompetitor: React.FC<{ competitorSlug?: string }> = ({ competitorSlug }) => {
  const slug = competitorSlug || 'tinder';
  const comp = competitorList.find(c => c.slug === slug) || competitorList[0];

  return (
    <main className="min-h-screen bg-[#07030d] text-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-5 pt-28 pb-20 sm:px-10 lg:px-16">
        <div className="pointer-events-none absolute left-[5%] top-[10%] h-[30rem] w-[30rem] rounded-full bg-[#F45D9B]/18 blur-[140px]" />
        <div className="pointer-events-none absolute right-[8%] top-[30%] h-[22rem] w-[22rem] rounded-full bg-violet-600/15 blur-[120px]" />

        <div className="relative mx-auto max-w-4xl">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-white/40">
            <Link href="/" className="hover:text-white/70 transition-colors">OTHRHALFF</Link>
            <span>/</span>
            <span className="text-[#F45D9B]">VS</span>
            <span>/</span>
            <span className="text-white/70">{comp.name.toUpperCase()}</span>
          </nav>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-1.5 font-mono text-[10px] font-bold tracking-[0.14em] text-white/55">
            {comp.category}
          </div>

          <h1 className="font-geist text-4xl font-black leading-[0.9] tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
            Othrhalff vs <span className="text-[#F45D9B]">{comp.name}</span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg font-medium italic text-[#F45D9B]">
            "{comp.tagline}"
          </p>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/65">
            {comp.summary}
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-[#F45D9B] px-7 py-3.5 text-sm font-bold text-white shadow-[0_12px_32px_rgba(244,93,155,0.4)] transition-all hover:scale-[1.04]"
            >
              <Zap className="h-4 w-4" />
              Try Othrhalff Free
            </Link>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-bold text-white transition-all hover:bg-white/10"
            >
              Start Discovering <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Comparison Table ── */}
      <section className="border-t border-white/8 px-5 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-geist text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
            Feature-by-Feature Comparison
          </h2>
          <p className="mt-3 text-white/55">
            Why college students are choosing Othrhalff over {comp.name} in 2026.
          </p>

          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
            {/* header */}
            <div className="grid grid-cols-3 border-b border-white/10 bg-white/[0.04] px-6 py-4">
              <div className="font-mono text-[9px] font-bold tracking-[0.16em] text-white/40">FEATURE</div>
              <div className="text-center font-mono text-[9px] font-bold tracking-[0.16em] text-[#F45D9B]">OTHRHALFF</div>
              <div className="text-center font-mono text-[9px] font-bold tracking-[0.16em] text-white/40">{comp.name.toUpperCase()}</div>
            </div>

            {comp.features.map((feature, i) => (
              <div
                key={feature.name}
                className={`grid grid-cols-3 items-center px-6 py-4 ${i < comp.features.length - 1 ? 'border-b border-white/8' : ''}`}
              >
                <div className="text-sm font-medium text-white/80 pr-4">{feature.name}</div>
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span className="text-center text-[10px] text-white/55">{feature.othrhalff}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  {feature.competitorHas
                    ? <CheckCircle2 className="h-5 w-5 text-white/35" />
                    : <XCircle className="h-5 w-5 text-red-400/70" />}
                  <span className="text-center text-[10px] text-white/55">{feature.competitor}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Verdict ── */}
      <section className="border-t border-white/8 px-5 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <div className="rounded-2xl border border-[#F45D9B]/20 bg-[#F45D9B]/8 p-8">
            <div className="mb-4 font-mono text-[10px] font-bold tracking-[0.18em] text-[#F45D9B]">
              THE VERDICT
            </div>
            <p className="text-xl font-bold leading-relaxed text-white">
              {comp.verdict}
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#F45D9B] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(244,93,155,0.35)] transition-all hover:scale-[1.03]"
            >
              Join Othrhalff for Free <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Other comparisons ── */}
      <section className="border-t border-white/8 px-5 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 font-mono text-[10px] font-bold tracking-[0.18em] text-white/40">
            MORE COMPARISONS
          </h2>
          <div className="flex flex-wrap gap-2">
            {competitorList
              .filter(c => c.slug !== slug)
              .map(c => (
                <Link
                  key={c.slug}
                  href={`/vs/${c.slug}`}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/50 transition-colors hover:border-white/25 hover:text-white/80"
                >
                  Othrhalff vs {c.name}
                </Link>
              ))}
            <Link
              href="/vs-omegle"
              className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/50 transition-colors hover:border-white/25 hover:text-white/80"
            >
              Othrhalff vs Omegle
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
};

export default VsCompetitor;
