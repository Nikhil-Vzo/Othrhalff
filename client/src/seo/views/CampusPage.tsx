"use client";

import React from 'react';
import { campusList, CampusData } from '../data/campuses';
import Link from 'next/link';
import { BadgeCheck, MapPin, Users, Zap, MessageCircle, Video, Lock } from 'lucide-react';

export { campusList };
export type { CampusData };

export const CampusPage: React.FC<{ campusSlug?: string }> = ({ campusSlug }) => {
  const slug = campusSlug || 'delhi-university';
  const campus = campusList.find(c => c.slug === slug) || campusList[0];

  return (
    <main className="min-h-screen bg-[#07030d] text-white">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden px-5 pt-28 pb-20 sm:px-10 lg:px-16">
        {/* glow */}
        <div className="pointer-events-none absolute left-[10%] top-[15%] h-[28rem] w-[28rem] rounded-full bg-[#F45D9B]/20 blur-[130px]" />
        <div className="pointer-events-none absolute bottom-0 right-[8%] h-[22rem] w-[22rem] rounded-full bg-violet-600/15 blur-[120px]" />

        <div className="relative mx-auto max-w-4xl">
          {/* breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-2 font-mono text-[10px] tracking-[0.16em] text-white/40">
            <Link href="/" className="hover:text-white/70 transition-colors">OTHRHALFF</Link>
            <span>/</span>
            <span className="text-[#F45D9B]">CAMPUS</span>
            <span>/</span>
            <span className="text-white/70">{campus.shortName.toUpperCase()}</span>
          </nav>

          {/* badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#F45D9B]/30 bg-[#F45D9B]/10 px-4 py-1.5 font-mono text-[10px] font-bold tracking-[0.14em] text-[#F45D9B]">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#F45D9B] opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-[#F45D9B]" />
            </span>
            LIVE ON CAMPUS
          </div>

          <h1 className="font-geist text-4xl font-black leading-[0.9] tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl">
            Othrhalff for<br />
            <span className="text-[#F45D9B]">{campus.name}</span>
          </h1>

          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/65">
            The exclusive campus speed dating and anonymous confession platform for verified{' '}
            <strong className="text-white">{campus.shortName}</strong> students in{' '}
            <strong className="text-white">{campus.location}</strong>. Connect 1-on-1 via instant text &amp; video with real peers from your campus—no creeps, no unverified accounts.
          </p>

          {/* stats row */}
          <div className="mt-8 flex flex-wrap gap-4">
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/75">
              <Users className="h-4 w-4 text-[#F45D9B]" />
              {campus.studentsCount} students
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/75">
              <MapPin className="h-4 w-4 text-[#F45D9B]" />
              {campus.location}
            </div>
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white/75">
              <BadgeCheck className="h-4 w-4 text-[#F45D9B]" />
              {campus.type} University
            </div>
          </div>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-[#F45D9B] px-7 py-3.5 text-sm font-bold text-white shadow-[0_12px_32px_rgba(244,93,155,0.4)] transition-all hover:scale-[1.04] hover:shadow-[0_16px_42px_rgba(244,93,155,0.5)]"
            >
              <Zap className="h-4 w-4" />
              Join {campus.shortName} Community
            </Link>
            <Link
              href="/discover"
              className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-7 py-3.5 text-sm font-bold text-white transition-all hover:bg-white/10"
            >
              Start Discovering
            </Link>
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section className="border-t border-white/8 px-5 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-geist text-3xl font-black tracking-[-0.05em] text-white sm:text-4xl">
            Built for <span className="text-[#F45D9B]">{campus.shortName}</span> students
          </h2>
          <p className="mt-3 text-white/55">Everything your campus WhatsApp group is too scared to say.</p>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { icon: Video, title: 'Speed Video Dates', desc: `1-on-1 HD video matching with verified ${campus.shortName} peers. No bots.` },
              { icon: MessageCircle, title: 'Anonymous Confessions', desc: `Post your ${campus.shortName} tea anonymously. Campus drama, crushes, real talk.` },
              { icon: Lock, title: 'Campus-Only Network', desc: `Strict college email verification. Only real ${campus.shortName} students get in.` },
            ].map(({ icon: Icon, title, desc }) => (
              <article key={title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-6">
                <Icon className="h-5 w-5 text-[#F45D9B]" />
                <h3 className="mt-4 text-sm font-bold text-white">{title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-white/55">{desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Trending topics ── */}
      <section className="border-t border-white/8 px-5 py-20 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="font-geist text-2xl font-black tracking-[-0.04em] text-white">
            Trending at <span className="text-[#F45D9B]">{campus.shortName}</span>
          </h2>
          <p className="mt-3 text-white/55">
            What {campus.shortName} students are talking about right now on Othrhalff.
          </p>
          <div className="mt-6 flex flex-wrap gap-2.5">
            {campus.popularTopics.map((topic) => (
              <span
                key={topic}
                className="rounded-full border border-white/15 bg-white/[0.05] px-4 py-2 font-mono text-[10px] font-bold tracking-[0.12em] text-white/70"
              >
                #{topic.replace(/\s+/g, '')}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-14 rounded-2xl border border-[#F45D9B]/20 bg-[#F45D9B]/8 p-8">
            <p className="font-geist text-xl font-black text-white">
              Be the first from {campus.shortName} to join the fastest-growing campus app in India.
            </p>
            <p className="mt-2 text-sm text-white/55">
              Verified campus connections. Anonymous confessions. Speed dates. All in one place.
            </p>
            <Link
              href="/login"
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#F45D9B] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(244,93,155,0.35)] transition-all hover:scale-[1.03]"
            >
              Get Started Free
            </Link>
          </div>
        </div>
      </section>

      {/* ── All campuses footer nav ── */}
      <section className="border-t border-white/8 px-5 py-16 sm:px-10 lg:px-16">
        <div className="mx-auto max-w-4xl">
          <h2 className="mb-6 font-mono text-[10px] font-bold tracking-[0.18em] text-white/40">
            OTHER CAMPUS COMMUNITIES
          </h2>
          <div className="flex flex-wrap gap-2">
            {campusList
              .filter(c => c.slug !== slug)
              .slice(0, 12)
              .map(c => (
                <Link
                  key={c.slug}
                  href={`/campus/${c.slug}`}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-white/50 transition-colors hover:border-white/25 hover:text-white/80"
                >
                  {c.shortName}
                </Link>
              ))}
          </div>
        </div>
      </section>
    </main>
  );
};

export default CampusPage;
