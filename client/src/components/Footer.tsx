"use client";
import React from 'react';
import Link from 'next/link';
import { Ghost, Instagram } from 'lucide-react';
import { TextHoverEffect, FooterBackgroundGradient } from './ui/hover-footer';

export const Footer: React.FC = () => (
  <footer className="relative overflow-hidden border-t border-white/10 bg-gradient-to-b from-[#0B0514] via-zinc-950 to-black pb-8 pt-16 text-white sm:pt-20">
    <FooterBackgroundGradient />

    {/* Ambient neon radial glow */}
    <div className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-48 w-full max-w-4xl bg-[radial-gradient(ellipse_at_top,rgba(244,93,155,0.22)_0%,transparent_70%)]" />

    <div className="relative z-20 mx-auto max-w-7xl px-6 sm:px-10">
      <div className="grid grid-cols-1 gap-10 pb-14 sm:grid-cols-2 md:grid-cols-12 md:gap-12 md:pb-16">
        {/* Left Column: Brand & Socials */}
        <div className="sm:col-span-2 md:col-span-6">
          <div className="flex items-center gap-2.5">
            <Ghost className="h-6 w-6 text-[#F45D9B] drop-shadow-[0_0_14px_rgba(244,93,155,0.7)]" />
            <span className="text-2xl font-black tracking-tight text-white">
              Othr<span className="text-[#F45D9B]">Halff</span>
            </span>
          </div>
          <p className="mt-4 max-w-md text-sm font-normal leading-relaxed text-zinc-400">
            The campus is already full of your people. We are beyond dating — built for genuine student connections, friendships &amp; belonging.
          </p>
          <div className="mt-6 flex items-center gap-3.5">
            <a
              href="https://www.instagram.com/othrhalff/"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Othrhalff on Instagram"
              className="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 shadow-[0_2px_10px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-[#F45D9B]/50 hover:bg-[#F45D9B]/20 hover:text-white hover:shadow-[0_0_20px_rgba(244,93,155,0.4)]"
            >
              <Instagram className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            </a>
            <Link
              href="/about"
              aria-label="About Othrhalff"
              className="group flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 shadow-[0_2px_10px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all duration-300 hover:scale-110 hover:border-[#F45D9B]/50 hover:bg-[#F45D9B]/20 hover:text-white hover:shadow-[0_0_20px_rgba(244,93,155,0.4)]"
            >
              <Ghost className="h-5 w-5 transition-transform duration-300 group-hover:scale-110" />
            </Link>
          </div>
        </div>

        {/* Middle Column: Company */}
        <div className="md:col-span-3">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#F45D9B] shadow-[0_0_8px_#F45D9B]" />
            <h3 className="font-mono text-xs font-bold tracking-[.18em] text-white whitespace-nowrap">COMPANY</h3>
          </div>
          <ul className="mt-5 space-y-3.5 text-sm font-medium text-zinc-400">
            <li>
              <Link href="/blog" className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-[#F45D9B]">
                Blog &amp; Stories
              </Link>
            </li>
            <li>
              <Link href="/about" className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-[#F45D9B]">
                About Us
              </Link>
            </li>
            <li>
              <Link href="/careers" className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-[#F45D9B]">
                Careers
              </Link>
            </li>
            <li>
              <Link href="/contact" className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-[#F45D9B]">
                Contact
              </Link>
            </li>
          </ul>
        </div>

        {/* Right Column: The Boring Stuff */}
        <div className="md:col-span-3">
          <div className="flex items-center gap-2.5">
            <span className="h-1.5 w-1.5 flex-shrink-0 rounded-full bg-[#F45D9B] shadow-[0_0_8px_#F45D9B]" />
            <h3 className="font-mono text-xs font-bold tracking-[.18em] text-white whitespace-nowrap">THE BORING STUFF</h3>
          </div>
          <ul className="mt-5 space-y-3.5 text-sm font-medium text-zinc-400">
            <li>
              <Link href="/privacy" className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-[#F45D9B]">
                Privacy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-[#F45D9B]">
                Terms
              </Link>
            </li>
            <li>
              <Link href="/safety" className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-[#F45D9B]">
                Safety
              </Link>
            </li>
            <li>
              <Link href="/guidelines" className="inline-block transition-all duration-200 hover:translate-x-1 hover:text-[#F45D9B]">
                Guidelines
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 pt-8 text-xs text-zinc-400">
        <span className="font-medium">© {new Date().getFullYear()} Othrhalff Inc. All rights reserved.</span>
      </div>
    </div>

    {/* Grand Interactive Cyber Neon Text Hover Effect */}
    <div className="relative z-10 mx-auto mt-6 -mb-6 flex h-32 w-full max-w-7xl items-center justify-center overflow-visible px-4 sm:-mb-10 sm:h-44 md:-mb-12 md:h-60 lg:-mb-14 lg:h-72">
      <TextHoverEffect text="OTHRHALFF" className="w-full select-none" />
    </div>
  </footer>
);
