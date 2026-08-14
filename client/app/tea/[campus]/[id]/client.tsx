"use client";

import React from 'react';
import Link from 'next/link';
import { campusList } from '../../../../src/seo/data/campuses';
import { Heart, MessageCircle, Share2, ArrowLeft, Lock, Zap } from 'lucide-react';

interface Props {
  campusSlug: string;
  confessionId: string;
}

export default function TeaPageClient({ campusSlug, confessionId }: Props) {
  const campus = campusList.find(c => c.slug === campusSlug) || campusList[0];
  const [liked, setLiked] = React.useState(false);

  return (
    <main className="min-h-screen bg-[#07030d] text-white">
      <div className="relative overflow-hidden">
        <div className="pointer-events-none absolute left-[5%] top-[10%] h-[24rem] w-[24rem] rounded-full bg-[#F45D9B]/15 blur-[130px]" />

        <div className="relative mx-auto max-w-2xl px-5 pt-24 pb-20 sm:px-10">
          {/* back link */}
          <Link
            href={`/campus/${campusSlug}`}
            className="mb-8 inline-flex items-center gap-2 font-mono text-[10px] font-bold tracking-[0.16em] text-white/40 transition-colors hover:text-white/70"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {campus.shortName.toUpperCase()} CAMPUS
          </Link>

          {/* confession card */}
          <article className="rounded-2xl border border-white/10 bg-white/[0.04] p-8">
            {/* header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#F45D9B]/20 font-mono text-sm font-bold text-[#F45D9B]">
                  ??
                </div>
                <div>
                  <p className="font-mono text-[10px] font-bold tracking-[0.14em] text-white/40">
                    ANONYMOUS
                  </p>
                  <p className="text-xs text-white/30">{campus.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 font-mono text-[9px] font-bold tracking-[0.14em] text-white/35">
                <Lock className="h-3 w-3" />
                #{confessionId}
              </div>
            </div>

            {/* CTA to read actual confession - auth wall */}
            <div className="mt-8 rounded-xl border border-white/8 bg-black/30 p-6 text-center">
              <Lock className="mx-auto h-8 w-8 text-[#F45D9B]/60" />
              <p className="mt-4 font-geist text-xl font-bold text-white">
                This confession is for verified {campus.shortName} students.
              </p>
              <p className="mt-2 text-sm text-white/55">
                Join with your college email to read, react, and post anonymous confessions from your campus.
              </p>
              <Link
                href="/login"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#F45D9B] px-6 py-3 text-sm font-bold text-white shadow-[0_8px_24px_rgba(244,93,155,0.35)] transition-all hover:scale-[1.03]"
              >
                <Zap className="h-4 w-4" />
                Join {campus.shortName} Community
              </Link>
            </div>

            {/* engagement preview */}
            <div className="mt-6 flex items-center gap-4 border-t border-white/8 pt-5">
              <button
                onClick={() => setLiked(v => !v)}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-all ${liked ? 'bg-[#F45D9B] text-white' : 'border border-white/15 text-white/50 hover:border-[#F45D9B]/50 hover:text-[#F45D9B]'}`}
              >
                <Heart className={`h-3.5 w-3.5 ${liked ? 'fill-current' : ''}`} />
                {liked ? '201' : '200'} vibes
              </button>
              <span className="inline-flex items-center gap-1.5 text-xs text-white/35">
                <MessageCircle className="h-3.5 w-3.5" />
                47 replies
              </span>
              <button className="ml-auto inline-flex items-center gap-1.5 text-xs text-white/35 hover:text-white/60">
                <Share2 className="h-3.5 w-3.5" />
                Share
              </button>
            </div>
          </article>

          {/* campus context */}
          <div className="mt-8 rounded-2xl border border-white/8 bg-white/[0.025] p-6">
            <h2 className="font-geist text-lg font-bold text-white">
              About {campus.name} on Othrhalff
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/55">
              Othrhalff is the anonymous campus confession and speed dating app for verified{' '}
              <strong className="text-white">{campus.name}</strong> students in{' '}
              <strong className="text-white">{campus.location}</strong>. Read campus tea, share
              anonymous confessions, and match 1-on-1 with real peers from your campus.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {campus.popularTopics.map(topic => (
                <span
                  key={topic}
                  className="rounded-full border border-white/10 px-3 py-1 font-mono text-[9px] font-bold tracking-[0.12em] text-white/40"
                >
                  #{topic.replace(/\s+/g, '')}
                </span>
              ))}
            </div>
          </div>

          {/* other campus links */}
          <div className="mt-8">
            <p className="mb-4 font-mono text-[10px] font-bold tracking-[0.18em] text-white/30">
              MORE FROM {campus.shortName.toUpperCase()}
            </p>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map(n => {
                const otherId = Math.floor(Math.random() * 9000 + 1000);
                return (
                  <Link
                    key={n}
                    href={`/tea/${campusSlug}/${otherId}`}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-3.5 py-1.5 text-xs text-white/40 transition-colors hover:border-white/25 hover:text-white/70"
                  >
                    Confession #{otherId}
                  </Link>
                );
              })}
              <Link
                href="/confessions"
                className="rounded-full border border-[#F45D9B]/20 bg-[#F45D9B]/8 px-3.5 py-1.5 text-xs font-bold text-[#F45D9B] transition-colors hover:bg-[#F45D9B]/15"
              >
                All Campus Confessions →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
