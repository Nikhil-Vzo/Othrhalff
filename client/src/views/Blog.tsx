"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Ghost,
  ArrowLeft,
  ArrowRight,
  Clock,
  Calendar,
  Sparkles,
  BookOpen,
  TrendingUp,
  Instagram,
  Linkedin,
  Github,
  Tag
} from 'lucide-react';
import { trackPageView } from '../utils/analytics';
import { blogPosts, BlogPost } from '../data/blogPosts';
import { Footer } from '../components/Footer';

export const Blog: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Track page view in Google Analytics
  useEffect(() => {
    trackPageView('/blog', 'OTHRHALFF Blog & Campus Guides');
  }, []);

  const categories = ['All', 'Campus Culture', 'Guides', 'Product'];

  const filteredPosts =
    selectedCategory === 'All'
      ? blogPosts
      : blogPosts.filter((post) => post.category === selectedCategory);

  const featuredPost = blogPosts[0];
  const regularPosts = filteredPosts;

  return (
    <div className="min-h-screen bg-[#07030d] text-white selection:bg-[#F45D9B] selection:text-white font-sans overflow-x-hidden">
      {/* Background Dots & Ambient Glows */}
      <div
        className="pointer-events-none fixed inset-0 z-0 opacity-20"
        style={{
          backgroundImage:
            'radial-gradient(rgba(244,93,155,0.2) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="pointer-events-none fixed -top-40 left-1/2 -translate-x-1/2 h-[35rem] w-[55rem] rounded-full bg-[#F45D9B]/10 blur-[140px] z-0" />
      <div className="pointer-events-none fixed bottom-20 -left-20 h-96 w-96 rounded-full bg-purple-900/15 blur-[120px] z-0" />

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-white/10 bg-[#07030d]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 text-xs font-bold uppercase tracking-wider text-zinc-400 transition-colors hover:text-white"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 transition-transform duration-200 group-hover:-translate-x-1 group-hover:border-[#F45D9B]/50 group-hover:bg-[#F45D9B]/10">
              <ArrowLeft className="h-4 w-4 text-zinc-300 group-hover:text-[#F45D9B]" />
            </div>
            <span>Back to Home</span>
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <Ghost className="h-5 w-5 text-[#F45D9B] drop-shadow-[0_0_12px_rgba(244,93,155,0.8)]" />
            <span className="font-bold tracking-tight text-white text-sm">
              Othr<span className="text-[#F45D9B]">Halff</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-12 sm:px-10 sm:py-16">
        {/* 1. HERO HEADER */}
        <section className="text-center max-w-3xl mx-auto pb-12 sm:pb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#F45D9B]/30 bg-[#F45D9B]/10 px-4 py-1.5 text-xs font-mono font-bold tracking-widest text-[#F45D9B] uppercase mb-6 shadow-[0_0_20px_rgba(244,93,155,0.15)]">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Campus Knowledge Base</span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.05]">
            Stories, Culture &amp; <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F45D9B] via-pink-400 to-purple-400">
              Campus Guides.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg leading-relaxed text-zinc-400 font-normal">
            Everything you need to navigate college life, find study buddies, break swipe fatigue, and discover genuine belonging across universities.
          </p>

          {/* Category Filter Chips */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'bg-[#F45D9B] text-white shadow-[0_0_20px_rgba(244,93,155,0.4)]'
                    : 'border border-white/10 bg-white/5 text-zinc-400 hover:border-white/20 hover:text-white'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* 2. FEATURED SPOTLIGHT CARD (Always highlights the latest top guide) */}
        {selectedCategory === 'All' && featuredPost && (
          <section className="mb-16">
            <Link
              href={`/blog/${featuredPost.slug}`}
              className="group relative block overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-zinc-900/80 via-zinc-950 to-black p-8 sm:p-12 shadow-2xl transition-all duration-500 hover:border-[#F45D9B]/50 hover:shadow-[0_20px_60px_rgba(244,93,155,0.15)]"
            >
              <div className="absolute top-0 right-0 w-96 h-96 bg-[#F45D9B]/10 rounded-full blur-3xl pointer-events-none group-hover:bg-[#F45D9B]/20 transition-colors duration-500" />

              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-400 mb-4">
                    <span className="rounded-full bg-[#F45D9B] px-3 py-1 font-bold text-white text-[11px] uppercase tracking-wider">
                      Featured Guide
                    </span>
                    <span className="rounded-full bg-white/10 px-3 py-1 text-zinc-300 text-[11px]">
                      {featuredPost.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-[#F45D9B]" />
                      {featuredPost.readTime}
                    </span>
                  </div>

                  <h2 className="text-2xl font-black text-white sm:text-4xl group-hover:text-[#F45D9B] transition-colors leading-tight max-w-3xl">
                    {featuredPost.title}
                  </h2>

                  <p className="mt-4 text-sm sm:text-base leading-relaxed text-zinc-400 max-w-2xl font-normal">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-6">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="font-semibold text-white">{featuredPost.author.name}</span>
                    <span>•</span>
                    <time dateTime={featuredPost.publishedDate}>{featuredPost.publishedDate}</time>
                  </div>

                  <span className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#F45D9B] group-hover:translate-x-1 transition-transform">
                    <span>Read Full Guide</span>
                    <ArrowRight className="h-4 w-4" />
                  </span>
                </div>
              </div>
            </Link>
          </section>
        )}

        {/* 3. FULL ARTICLE DIRECTORY GRID */}
        <section className="mb-24">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-xl font-bold tracking-tight text-white sm:text-2xl flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-[#F45D9B]" />
              <span>All Campus Articles ({regularPosts.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {regularPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-white/10 bg-zinc-900/40 p-6 backdrop-blur-xl shadow-lg transition-all duration-300 hover:-translate-y-1.5 hover:border-[#F45D9B]/50 hover:bg-zinc-900/70 hover:shadow-[0_12px_36px_rgba(244,93,155,0.15)]"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-3.5">
                    <span className="rounded-full bg-[#F45D9B]/15 px-2.5 py-0.5 font-bold text-[#F45D9B]">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-zinc-400" />
                      {post.readTime}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-[#F45D9B] transition-colors leading-snug line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="mt-2.5 text-xs leading-relaxed text-zinc-400 line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/5 pt-4 text-xs font-mono text-zinc-400 group-hover:text-white transition-colors">
                  <span>{post.publishedDate}</span>
                  <div className="flex items-center gap-1 text-[#F45D9B] font-bold">
                    <span>Read</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. THE CORE TEAM */}
        <section className="mb-24 rounded-3xl border border-white/10 bg-zinc-900/30 p-8 sm:p-12 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mb-3">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F45D9B] to-purple-400">Core Team</span>
            </h2>
            <p className="text-zinc-400 text-xs font-mono uppercase tracking-widest mb-10">
              The builders behind the campus pulse
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left mb-8">
              {[
                {
                  name: 'Nikhil Yadav',
                  title: 'Developer',
                  ig: 'https://www.instagram.com/nikhil_on_clouds?igsh=MTVscTYwd3VtbzlhZw==',
                  linkedin: 'https://www.linkedin.com/in/nikhil1yadav/',
                  github: 'https://github.com/Nikhil-Vzo',
                  border: 'border-[#F45D9B]/30 hover:border-[#F45D9B]/60',
                  color: 'text-[#F45D9B]',
                },
                {
                  name: 'Avneesh Kumar Jha',
                  title: 'Developer',
                  ig: 'https://www.instagram.com/its_avneesh_15?igsh=bjJuOWFoM2hidzZ0',
                  linkedin:
                    'https://www.linkedin.com/in/avneesh-kumar-jha-443034319?utm_source=share_via&utm_content=profile&utm_medium=member_android',
                  github: 'https://github.com/techninja15',
                  border: 'border-blue-500/30 hover:border-blue-500/60',
                  color: 'text-blue-400',
                },
              ].map((dev, i) => (
                <div
                  key={i}
                  className={`bg-zinc-950/60 border ${dev.border} rounded-2xl p-6 transition-all hover:scale-[1.02]`}
                >
                  <h3 className="text-xl font-bold text-white mb-1">{dev.name}</h3>
                  <p className={`text-xs uppercase tracking-wider font-bold mb-4 ${dev.color}`}>{dev.title}</p>
                  <div className="flex gap-3">
                    {dev.ig && (
                      <a
                        href={dev.ig}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all hover:scale-110"
                      >
                        <Instagram className="w-4 h-4 text-zinc-300 hover:text-white" />
                      </a>
                    )}
                    {dev.linkedin && (
                      <a
                        href={dev.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all hover:scale-110"
                      >
                        <Linkedin className="w-4 h-4 text-zinc-300 hover:text-white" />
                      </a>
                    )}
                    {dev.github && (
                      <a
                        href={dev.github}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all hover:scale-110"
                      >
                        <Github className="w-4 h-4 text-zinc-300 hover:text-white" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
              {[
                {
                  name: 'Ashutosh Sahu',
                  title: 'Growth & Strategy',
                  ig: 'https://www.instagram.com/_ashutosh.__.sahu_?igsh=dXIxdHhhcGo5N2N4',
                  linkedin: 'https://www.linkedin.com/in/ashutoshsahu-/',
                  border: 'border-yellow-500/30 hover:border-yellow-500/60',
                  color: 'text-yellow-500',
                },
                {
                  name: 'Tushar Shendey',
                  title: 'Operations & Community',
                  ig: 'https://www.instagram.com/tusharr.30_?igsh=YWVqMHo2NWt2bTBh',
                  linkedin: 'https://www.linkedin.com/in/tushar-shendey-099a7334a/',
                  border: 'border-green-500/30 hover:border-green-500/60',
                  color: 'text-green-400',
                },
                {
                  name: 'Shreyy Sharma',
                  title: 'Growth & Marketing',
                  ig: 'https://www.instagram.com/hazelxcappuccino?igsh=MTg4M3JrbGM1N3U3Nw==',
                  linkedin: '',
                  border: 'border-pink-500/30 hover:border-pink-500/60',
                  color: 'text-pink-400',
                },
              ].map((member, i) => (
                <div
                  key={i}
                  className={`bg-zinc-950/60 border ${member.border} rounded-2xl p-6 transition-all hover:scale-[1.02]`}
                >
                  <h3 className="text-lg font-bold text-white mb-1">{member.name}</h3>
                  <p className={`text-xs uppercase tracking-wider font-bold mb-4 ${member.color}`}>
                    {member.title}
                  </p>
                  <div className="flex gap-3">
                    {member.ig && (
                      <a
                        href={member.ig}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all hover:scale-110"
                      >
                        <Instagram className="w-4 h-4 text-zinc-300 hover:text-white" />
                      </a>
                    )}
                    {member.linkedin && (
                      <a
                        href={member.linkedin}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-all hover:scale-110"
                      >
                        <Linkedin className="w-4 h-4 text-zinc-300 hover:text-white" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* 5. SHARED CYBER FOOTER */}
      <Footer />
    </div>
  );
};
