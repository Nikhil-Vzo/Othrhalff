"use client";

import React, { useState, useEffect } from 'react';
import { StarField } from '../../src/components/StarField';
import { ArrowUpRight } from 'lucide-react';

const TARGET_EMAIL = "lachavzo11@gmail.com";
const MAILTO_URL = `mailto:${TARGET_EMAIL}?subject=${encodeURIComponent("Domain Acquisition Inquiry - othrhalff.com")}`;

export default function MaintenancePage() {
  const [time, setTime] = useState<Date | null>(null);

  useEffect(() => {
    setTime(new Date());
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const now = time || new Date(0);
  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours();

  // Analog clock hand degrees
  const secondDeg = seconds * 6;
  const minuteDeg = (minutes + seconds / 60) * 6;
  const hourDeg = ((hours % 12) + minutes / 60) * 30;

  return (
    <div className="relative min-h-screen w-full bg-black text-white flex flex-col items-center justify-center p-4 overflow-hidden selection:bg-neon selection:text-white">
      {/* Background StarField */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <StarField />
      </div>

      {/* Minimal Center Presentation: Analog Clock + Alien Font Text + Redirect Icon */}
      <main className="relative z-10 flex flex-col items-center justify-center gap-10">
        
        {/* Simple Minimalist Analog Clock */}
        <div 
          role="region"
          aria-label="Analog Clock"
          className="relative flex items-center justify-center"
        >
          <svg
            viewBox="0 0 200 200"
            className="w-56 h-56 sm:w-64 sm:h-64 select-none drop-shadow-[0_0_35px_rgba(255,0,127,0.25)]"
          >
            {/* Outer Dial Circle */}
            <circle
              cx="100"
              cy="100"
              r="94"
              fill="rgba(0, 0, 0, 0.65)"
              stroke="rgba(255, 255, 255, 0.15)"
              strokeWidth="1.5"
            />
            {/* Subtle Inner Sci-Fi Orbit */}
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke="rgba(255, 0, 127, 0.12)"
              strokeWidth="1"
              strokeDasharray="2 6"
            />

            {/* 12 Hour Dial Markers */}
            {[...Array(12)].map((_, i) => {
              const isCardinal = i % 3 === 0;
              return (
                <line
                  key={i}
                  x1="100"
                  y1={isCardinal ? '12' : '15'}
                  x2="100"
                  y2={isCardinal ? '24' : '20'}
                  stroke={isCardinal ? '#ff007f' : 'rgba(255, 255, 255, 0.35)'}
                  strokeWidth={isCardinal ? '2.5' : '1.5'}
                  strokeLinecap="round"
                  transform={`rotate(${i * 30} 100 100)`}
                />
              );
            })}

            {/* Hour Hand */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="54"
              stroke="#ffffff"
              strokeWidth="3.5"
              strokeLinecap="round"
              transform={`rotate(${hourDeg} 100 100)`}
            />

            {/* Minute Hand */}
            <line
              x1="100"
              y1="100"
              x2="100"
              y2="34"
              stroke="#e4e4e7"
              strokeWidth="2.2"
              strokeLinecap="round"
              transform={`rotate(${minuteDeg} 100 100)`}
            />

            {/* Second Hand (Neon Pink with Counterweight) */}
            <line
              x1="100"
              y1="118"
              x2="100"
              y2="24"
              stroke="#ff007f"
              strokeWidth="1.5"
              strokeLinecap="round"
              transform={`rotate(${secondDeg} 100 100)`}
              style={{ filter: 'drop-shadow(0 0 5px #ff007f)' }}
            />

            {/* Center Pivot Point */}
            <circle
              cx="100"
              cy="100"
              r="4"
              fill="#ff007f"
              style={{ filter: 'drop-shadow(0 0 6px #ff007f)' }}
            />
          </svg>
        </div>

        {/* Alien Font Notice & Redirect Icon */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 px-4 text-center">
          <span className="font-mono text-xs sm:text-sm tracking-[0.35em] sm:tracking-[0.45em] uppercase text-neutral-300 font-semibold select-none drop-shadow-[0_0_10px_rgba(255,255,255,0.15)]">
            Domain Are Available for Purchase
          </span>
          
          {/* Redirect Icon linking to Mailbox */}
          <a
            href={MAILTO_URL}
            id="mail-redirect-icon"
            aria-label="Send Inquiry via Mail"
            title="Inquire via Email: lachavzo11@gmail.com"
            className="p-2 sm:p-2.5 rounded-full border border-white/20 bg-white/5 hover:bg-[#ff007f]/20 hover:border-[#ff007f] text-neutral-300 hover:text-white transition-all duration-300 hover:scale-110 shadow-[0_0_15px_rgba(255,0,127,0.2)] group"
          >
            <ArrowUpRight className="w-4 h-4 text-[#ff007f] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>

      </main>
    </div>
  );
}
