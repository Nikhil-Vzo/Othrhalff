"use client";

import React from 'react';
import Link from 'next/link';
import { CheckCircle2, XCircle, ArrowRight, Zap, ShieldCheck, Video, Lock, MessageCircle } from 'lucide-react';

const features = [
  { name: 'Identity Verification', othrhalff: 'College Email Auth Required', omegle: 'Completely Anonymous / None', othrhalffHas: true, omegleHas: false },
  { name: 'Campus-Specific Matching', othrhalff: 'Match with Your Exact Campus Peers', omegle: 'Random Global Strangers', othrhalffHas: true, omegleHas: false },
  { name: 'HD Speed Video Chat', othrhalff: 'Agora-Powered 1080p Calls', omegle: 'Low-Quality, Often Broken', othrhalffHas: true, omegleHas: true },
  { name: 'Anonymous Confession Board', othrhalff: 'Campus-Specific Confession Feed', omegle: 'Not Available', othrhalffHas: true, omegleHas: false },
  { name: 'Moderation & Safety', othrhalff: 'Strict Content Policy & Campus Auth', omegle: 'Shut Down Due to Safety Issues', othrhalffHas: true, omegleHas: false },
  { name: 'Persistent Matches & Chat', othrhalff: 'Keep Connections After the Call', omegle: 'One-Time Anonymous Only', othrhalffHas: true, omegleHas: false },
  { name: 'Available in India', othrhalff: 'Optimized for Indian Campuses', omegle: 'Banned / Unavailable', othrhalffHas: true, omegleHas: false },
];

export const VsOmegle: React.FC = () => {
  return (
    <main className="min-h-screen bg-[#07030d] text-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-5 pt-28 pb-20 sm:px-10 lg:px-16">
        <div className="pointer-events-none absolute left-[5%] top-[15%] h-[30rem] w-[30rem] rounded-full bg-[#F45D9B]/18 blur-[140px]" />
        <div className="pointer-events-none absolute right-[8%] top-[30%] h-[22rem] w-[22rem] rounded-full bg-violet-600/15 blur-[120px]" />

        <div className="relative mx-auto max-w-4xl">
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-white/40">
            <Link href="/" className="hover:text-white/70 transition-colors">OTHRHALFF</Link>
            <span>/</span>
            <span className="text-[#F45D9B]">VS OMEGLE</span>
          </nav>

          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-1.5 font-mono text-[10px] font-bold tracking-[0.14em] text-emerald-400">
            <ShieldCheck className="h-3.5 w-3.5" />
            SAFE OMEGLE ALTERNATIVE FOR COLLEGE STUDENTS
          </div>

          <h1 className="font-geist text-4xl font-black leading-[0.9] tracking-[-0.06em] text-white sm:text-5xl lg:text-6xl">
            Othrhalff vs <span className="text-[#F45D9B]">Omegle</span>
          </h1>

          <p className="mt-5 max-w-2xl text-lg font-medium italic text-[#F45D9B]">
            "The verified, campus-safe Omegle alternative for university students in India."
          </p>

          <p className="mt-5 max-w-2xl text-base leading-relaxed text-white/65">
            Omegle was shut down in 2023 after years of moderation failures and safety scandals. Othrhalff is the modern, campus-verified replacement—built exclusively for university students who want the thrill of 1-on-1 random video chat without the danger of anonymous strangers. Every match is a verified college peer from your campus.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-[#F45D9B] px-7 py-3.5 text-sm font-bold text-white shadow-[0_12px_32px_rgba(244,93,155,0.4)] transition-all hover:scale-[1.04]"
            >
              <Zap className="h-4 w-4" />
              Try the Safe Alternative Free
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

      {/* ── Why Omegle failed ── */}
      <section className="border-t border-white/8 px-5 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-geist text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
            Why students are looking for an <span className="text-[#F45D9B]">Omegle alternative</span>
          </h2>
          <p className="mt-4 text-base leading-relaxed text-white/65">
            Omegle was permanently shut down in November 2023 after a lawsuit exposed widespread safety failures. For years, it was the go-to platform for random video chat—but its complete lack of identity verification made it a dangerous environment, especially for younger users. Indian colleges and universities had already blocked it on campus networks.
          </p>
          <p className="mt-4 text-base leading-relaxed text-white/65">
            Students searching for an <strong className="text-white">Omegle alternative</strong> or a safe <strong className="text-white">random video chat for college students</strong> now need a platform that preserves the spontaneous, exciting nature of 1-on-1 connections—while adding the trust layer that Omegle never had.
          </p>
          <p className="mt-4 text-base leading-relaxed text-white/65">
            That platform is <strong className="text-white">Othrhalff</strong>.
          </p>
        </div>
      </section>

      {/* ── Feature table ── */}
      <section className="border-t border-white/8 px-5 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-geist text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
            Othrhalff vs Omegle: Full Comparison
          </h2>

          <div className="mt-8 overflow-hidden rounded-2xl border border-white/10">
            <div className="grid grid-cols-3 border-b border-white/10 bg-white/[0.04] px-6 py-4">
              <div className="font-mono text-[9px] font-bold tracking-[0.16em] text-white/40">FEATURE</div>
              <div className="text-center font-mono text-[9px] font-bold tracking-[0.16em] text-[#F45D9B]">OTHRHALFF</div>
              <div className="text-center font-mono text-[9px] font-bold tracking-[0.16em] text-white/40">OMEGLE</div>
            </div>

            {features.map((f, i) => (
              <div
                key={f.name}
                className={`grid grid-cols-3 items-center px-6 py-4 ${i < features.length - 1 ? 'border-b border-white/8' : ''}`}
              >
                <div className="text-sm font-medium text-white/80 pr-4">{f.name}</div>
                <div className="flex flex-col items-center gap-1">
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  <span className="text-center text-[10px] text-white/55">{f.othrhalff}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  {f.omegleHas
                    ? <CheckCircle2 className="h-5 w-5 text-white/35" />
                    : <XCircle className="h-5 w-5 text-red-400/70" />}
                  <span className="text-center text-[10px] text-white/55">{f.omegle}</span>
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
              Othrhalff is the definitive Omegle alternative for college students. It delivers everything Omegle promised—spontaneous, exciting 1-on-1 video connections—while adding campus email verification, persistent matches, and a fully moderated environment that universities trust.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#F45D9B] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(244,93,155,0.35)] transition-all hover:scale-[1.03]"
            >
              Join the Safe Alternative <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ── More comparisons ── */}
      <section className="border-t border-white/8 px-5 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 font-mono text-[10px] font-bold tracking-[0.18em] text-white/40">
            MORE COMPARISONS
          </h2>
          <div className="flex flex-wrap gap-2">
            {[
              { href: '/vs/tinder', label: 'Othrhalff vs Tinder' },
              { href: '/vs/bumble', label: 'Othrhalff vs Bumble' },
              { href: '/vs/hinge', label: 'Othrhalff vs Hinge' },
              { href: '/vs/yikyak', label: 'Othrhalff vs Yik Yak' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-white/50 transition-colors hover:border-white/25 hover:text-white/80"
              >
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default VsOmegle;
