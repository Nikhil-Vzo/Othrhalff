"use client";

import React from 'react';
import Link from 'next/link';
import { ArrowRight, Sparkles, Heart, ShieldCheck, MessageCircle, Zap, Compass, CheckCircle2 } from 'lucide-react';
import { CompatibilityPair, personalityTypes } from '../data/personalityTypes';

export const CompatibilityView: React.FC<{ pair: CompatibilityPair }> = ({ pair }) => {
  const { typeA, typeB, score, chemistryTier, summary, strengths, communicationTips } = pair;

  return (
    <main className="min-h-screen bg-[#07030d] text-white">
      {/* ── Hero Header ── */}
      <section className="relative overflow-hidden px-5 pt-28 pb-20 sm:px-10 lg:px-16">
        <div className="pointer-events-none absolute left-[5%] top-[10%] h-[32rem] w-[32rem] rounded-full bg-[#F45D9B]/18 blur-[140px]" />
        <div className="pointer-events-none absolute right-[8%] top-[25%] h-[24rem] w-[24rem] rounded-full bg-violet-600/15 blur-[120px]" />

        <div className="relative mx-auto max-w-4xl">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-white/40">
            <Link href="/" className="hover:text-white/70 transition-colors">OTHRHALFF</Link>
            <span>/</span>
            <Link href="/vibe" className="hover:text-white/70 transition-colors">COMPATIBILITY</Link>
            <span>/</span>
            <span className="text-[#F45D9B]">{typeA.code} + {typeB.code}</span>
          </nav>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#F45D9B]/30 bg-[#F45D9B]/10 px-4 py-1.5 font-mono text-[11px] font-bold tracking-[0.14em] text-[#F45D9B]">
            <Sparkles className="h-3.5 w-3.5" /> {chemistryTier.toUpperCase()}
          </div>

          <h1 className="font-geist text-4xl font-black leading-[0.92] tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
            {typeA.code} and {typeB.code} Compatibility
          </h1>

          <p className="mt-4 text-xl font-bold text-white/80">
            {typeA.name} & {typeB.name}
          </p>

          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/65">
            {summary}
          </p>

          {/* ── Synergy Meter Card ── */}
          <div className="mt-8 grid grid-cols-1 sm:grid-cols-[200px_1fr] gap-6 rounded-3xl border border-white/15 bg-white/5 p-6 sm:p-8 backdrop-blur-xl">
            <div className="flex flex-col items-center justify-center rounded-2xl bg-gradient-to-br from-[#F45D9B]/20 to-violet-600/20 border border-[#F45D9B]/30 p-6 text-center">
              <span className="text-5xl sm:text-6xl font-black text-[#F45D9B]">{score}%</span>
              <span className="mt-1 text-xs font-bold uppercase tracking-wider text-white/70">Synergy Score</span>
            </div>

            <div className="flex flex-col justify-center space-y-4">
              <div className="space-y-1">
                <div className="flex justify-between text-xs font-bold uppercase tracking-wider text-white/60">
                  <span>Connection Potential</span>
                  <span className="text-[#F45D9B]">{chemistryTier}</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full bg-gradient-to-r from-[#F45D9B] to-violet-500"
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Link
                  href={`/login?archetype=${typeA.code}&match=${typeB.code}`}
                  className="inline-flex items-center gap-2 rounded-full bg-[#F45D9B] px-6 py-3 text-sm font-bold text-white shadow-[0_12px_32px_rgba(244,93,155,0.4)] transition-all hover:scale-[1.04]"
                >
                  <Zap className="h-4 w-4 fill-current" />
                  Find Your {typeB.code} Match Free
                </Link>
                <Link
                  href="/vibe"
                  className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-6 py-3 text-sm font-bold text-white transition-all hover:bg-white/10"
                >
                  Take Archetype Test <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Deep Breakdown Section ── */}
      <section className="relative px-5 py-12 sm:px-10 lg:px-16 border-t border-white/10 bg-[#050209]">
        <div className="mx-auto max-w-4xl space-y-12">
          {/* Side by side profiles */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-3">
              <span className="font-mono text-xs font-bold text-[#F45D9B]">{typeA.code} Profile</span>
              <h2 className="text-2xl font-bold text-white">{typeA.name}</h2>
              <p className="text-xs text-white/70 italic">"{typeA.tagline}"</p>
              <div className="pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">Dating Style:</span>
                <p className="mt-1 text-xs text-white/80 leading-relaxed">{typeA.datingStyle}</p>
              </div>
            </div>

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 space-y-3">
              <span className="font-mono text-xs font-bold text-violet-400">{typeB.code} Profile</span>
              <h2 className="text-2xl font-bold text-white">{typeB.name}</h2>
              <p className="text-xs text-white/70 italic">"{typeB.tagline}"</p>
              <div className="pt-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/50">Dating Style:</span>
                <p className="mt-1 text-xs text-white/80 leading-relaxed">{typeB.datingStyle}</p>
              </div>
            </div>
          </div>

          {/* Relationship Strengths */}
          <div className="rounded-3xl border border-white/15 bg-white/5 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-[#F45D9B]">
              <ShieldCheck className="h-5 w-5" />
              <h2 className="text-lg font-bold text-white">Why {typeA.code} and {typeB.code} Work So Well</h2>
            </div>
            <ul className="space-y-3 text-sm text-white/80">
              {strengths.map((str, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0 text-[#F45D9B]" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Communication & Banter Prompts */}
          <div className="rounded-3xl border border-white/15 bg-white/5 p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2 text-violet-400">
              <MessageCircle className="h-5 w-5" />
              <h2 className="text-lg font-bold text-white">Effortless First Date Conversation Starters</h2>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">For {typeA.code} to Ask {typeB.code}:</span>
                <p className="text-xs font-medium text-white/90 italic">"{typeB.communicationPrompt}"</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-black/40 p-4 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/40">For {typeB.code} to Ask {typeA.code}:</span>
                <p className="text-xs font-medium text-white/90 italic">"{typeA.communicationPrompt}"</p>
              </div>
            </div>
          </div>

          {/* Related Compatibility Internal Links */}
          <div className="space-y-4 pt-6">
            <h3 className="text-sm font-bold uppercase tracking-widest text-white/50">Explore Other {typeA.code} Matches</h3>
            <div className="flex flex-wrap gap-2">
              {personalityTypes.filter(t => t.code !== typeB.code).slice(0, 6).map(t => (
                <Link
                  key={t.code}
                  href={`/compatibility/${typeA.code.toLowerCase()}-and-${t.code.toLowerCase()}`}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-medium text-white/70 hover:border-[#F45D9B] hover:text-white transition-colors"
                >
                  {typeA.code} + {t.code} ({t.name.split(' ')[1] || t.code})
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  );
};
