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
  Instagram,
  Linkedin,
  Github,
} from 'lucide-react';
import { trackPageView } from '../utils/analytics';
import { blogPosts, BlogPost } from '../data/blogPosts';
import { Footer } from '../components/Footer';
import { StarField } from '../components/StarField';

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
    <div className="relative min-h-screen bg-[#05020c] text-white selection:bg-[#F45D9B] selection:text-white font-sans overflow-x-hidden">
      {/* Dynamic StarField Galaxy Background */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <StarField />
      </div>

      {/* Subtle radial ambient atmosphere */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,50,150,0.12),rgba(5,2,12,0.8))]" />

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-white/[0.08] bg-[#05020c]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 sm:px-10">
          <Link
            href="/"
            className="group inline-flex items-center gap-2.5 text-xs font-semibold uppercase tracking-wider text-zinc-400 transition-colors hover:text-white"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] transition-all duration-200 group-hover:-translate-x-1 group-hover:border-white/25 group-hover:bg-white/10">
              <ArrowLeft className="h-4 w-4 text-zinc-300 group-hover:text-white" />
            </div>
            <span>Back to Home</span>
          </Link>

          <Link href="/" className="flex items-center gap-2">
            <Ghost className="h-5 w-5 text-[#F45D9B] drop-shadow-[0_0_8px_rgba(244,93,155,0.6)]" />
            <span className="font-bold tracking-tight text-white text-sm">
              Othr<span className="text-[#F45D9B]">Halff</span>
            </span>
          </Link>
        </div>
      </header>

      <main className="relative z-10 mx-auto max-w-7xl px-6 py-12 sm:px-10 sm:py-16">
        {/* 1. HERO HEADER */}
        <section className="text-center max-w-3xl mx-auto pb-12 sm:pb-16">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-mono font-medium tracking-widest text-zinc-300 uppercase mb-6 backdrop-blur-md">
            <Sparkles className="h-3.5 w-3.5 text-pink-400" />
            <span>Campus Knowledge Base</span>
          </div>

          <h1 className="text-4xl font-black tracking-tight text-white sm:text-6xl lg:text-7xl leading-[1.05]">
            Stories, Culture &amp; <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 via-pink-200 to-zinc-400">
              Campus Guides.
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg leading-relaxed text-zinc-400 font-normal max-w-2xl mx-auto">
            Everything you need to navigate college life, find study buddies, break swipe fatigue, and discover genuine belonging across universities.
          </p>

          {/* Category Filter Chips */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2.5">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`rounded-full px-5 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-300 ${
                  selectedCategory === cat
                    ? 'bg-white/15 text-white border border-white/30 shadow-[0_0_15px_rgba(255,255,255,0.1)]'
                    : 'border border-white/[0.08] bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:text-zinc-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </section>

        {/* 2. FEATURED SPOTLIGHT CARD */}
        {selectedCategory === 'All' && featuredPost && (
          <section className="mb-16">
            <Link
              href={`/blog/${featuredPost.slug}`}
              className="group relative block overflow-hidden rounded-3xl border border-white/[0.08] bg-zinc-950/60 p-8 sm:p-12 shadow-2xl backdrop-blur-xl transition-all duration-300 hover:border-white/20 hover:bg-zinc-950/80"
            >
              <div className="relative z-10 flex flex-col justify-between h-full">
                <div>
                  <div className="flex flex-wrap items-center gap-3 text-xs font-mono text-zinc-400 mb-4">
                    <span className="rounded-full bg-pink-500/20 text-pink-300 border border-pink-500/30 px-3 py-1 font-semibold text-[11px] uppercase tracking-wider">
                      Featured Guide
                    </span>
                    <span className="rounded-full bg-white/[0.06] px-3 py-1 text-zinc-300 text-[11px] border border-white/5">
                      {featuredPost.category}
                    </span>
                    <span className="flex items-center gap-1 text-zinc-400">
                      <Clock className="h-3 w-3 text-zinc-400" />
                      {featuredPost.readTime}
                    </span>
                  </div>

                  <h2 className="text-2xl font-bold text-white sm:text-4xl group-hover:text-pink-200 transition-colors leading-tight max-w-3xl">
                    {featuredPost.title}
                  </h2>

                  <p className="mt-4 text-sm sm:text-base leading-relaxed text-zinc-400 max-w-2xl font-normal">
                    {featuredPost.excerpt}
                  </p>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/[0.08] pt-6">
                  <div className="flex items-center gap-2 text-xs text-zinc-400">
                    <span className="font-semibold text-zinc-200">{featuredPost.author.name}</span>
                    <span>•</span>
                    <time dateTime={featuredPost.publishedDate}>{featuredPost.publishedDate}</time>
                  </div>

                  <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-pink-300 group-hover:translate-x-1 transition-transform">
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
              <BookOpen className="h-5 w-5 text-pink-400" />
              <span>All Campus Articles ({regularPosts.length})</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {regularPosts.map((post) => (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-zinc-950/50 p-6 backdrop-blur-xl shadow-lg transition-all duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-zinc-900/40"
              >
                <div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 mb-3.5">
                    <span className="rounded-full bg-white/[0.06] border border-white/5 px-2.5 py-0.5 font-medium text-zinc-300">
                      {post.category}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3 w-3 text-zinc-500" />
                      {post.readTime}
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-white group-hover:text-pink-200 transition-colors leading-snug line-clamp-2">
                    {post.title}
                  </h3>

                  <p className="mt-2.5 text-xs leading-relaxed text-zinc-400 line-clamp-3">
                    {post.excerpt}
                  </p>
                </div>

                <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4 text-xs font-mono text-zinc-400 group-hover:text-zinc-200 transition-colors">
                  <span>{post.publishedDate}</span>
                  <div className="flex items-center gap-1 text-pink-300 font-medium">
                    <span>Read</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* 4. THE CORE TEAM */}
        <section className="mb-24 rounded-3xl border border-white/[0.08] bg-zinc-950/40 p-8 sm:p-12 backdrop-blur-xl">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-4xl font-black text-white uppercase tracking-tight mb-3">
              The <span className="text-transparent bg-clip-text bg-gradient-to-r from-zinc-100 to-zinc-400">Core Team</span>
            </h2>
            <p className="text-zinc-500 text-xs font-mono uppercase tracking-widest mb-10">
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
                  color: 'text-pink-300',
                },
                {
                  name: 'Avneesh Kumar Jha',
                  title: 'Developer',
                  ig: 'https://www.instagram.com/its_avneesh_15?igsh=bjJuOWFoM2hidzZ0',
                  linkedin:
                    'https://www.linkedin.com/in/avneesh-kumar-jha-443034319?utm_source=share_via&utm_content=profile&utm_medium=member_android',
                  github: 'https://github.com/techninja15',
                  color: 'text-blue-300',
                },
              ].map((dev, i) => (
                <div
                  key={i}
                  className="bg-zinc-900/40 border border-white/[0.08] hover:border-white/20 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.01]"
                >
                  <h3 className="text-xl font-bold text-white mb-1">{dev.name}</h3>
                  <p className={`text-xs uppercase tracking-wider font-semibold mb-4 ${dev.color}`}>{dev.title}</p>
                  <div className="flex gap-3">
                    {dev.ig && (
                      <a
                        href={dev.ig}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${dev.name} on Instagram`}
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
                        aria-label={`${dev.name} on LinkedIn`}
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
                        aria-label={`${dev.name} on GitHub`}
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
                  color: 'text-amber-300',
                },
                {
                  name: 'Tushar Shendey',
                  title: 'Operations & Community',
                  ig: 'https://www.instagram.com/tusharr.30_?igsh=YWVqMHo2NWt2bTBh',
                  linkedin: 'https://www.linkedin.com/in/tushar-shendey-099a7334a/',
                  color: 'text-emerald-300',
                },
                {
                  name: 'Shreyy Sharma',
                  title: 'Growth & Marketing',
                  ig: 'https://www.instagram.com/hazelxcappuccino?igsh=MTg4M3JrbGM1N3U3Nw==',
                  linkedin: '',
                  color: 'text-rose-300',
                },
              ].map((member, i) => (
                <div
                  key={i}
                  className="bg-zinc-900/40 border border-white/[0.08] hover:border-white/20 rounded-2xl p-6 transition-all duration-300 hover:scale-[1.01]"
                >
                  <h3 className="text-lg font-bold text-white mb-1">{member.name}</h3>
                  <p className={`text-xs uppercase tracking-wider font-semibold mb-4 ${member.color}`}>
                    {member.title}
                  </p>
                  <div className="flex gap-3">
                    {member.ig && (
                      <a
                        href={member.ig}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={`${member.name} on Instagram`}
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
                        aria-label={`${member.name} on LinkedIn`}
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
