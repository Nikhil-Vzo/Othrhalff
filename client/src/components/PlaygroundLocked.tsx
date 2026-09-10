"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Radio } from 'lucide-react';
import { StarField } from './StarField';
import { PLAYGROUND_CONFIG } from '../constants';

export const PlaygroundLocked: React.FC = () => {
  const router = useRouter();

  return (
    <div className="relative w-full h-[100dvh] flex flex-col items-center justify-center bg-black text-white font-sans overflow-hidden select-none px-4">
      {/* 1. Live Starfield Canvas Background */}
      <StarField />

      {/* 2. Soft Ambient Neon Radial Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-neon/15 blur-[160px] pointer-events-none" />

      <style jsx>{`
        @keyframes floatHop {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-14px) scale(1.03);
          }
        }
        .animate-float-hop {
          animation: floatHop 3.5s ease-in-out infinite;
        }
      `}</style>

      {/* 3. Foreground Content */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-lg mx-auto">
        
        {/* Creative Asset Centerpiece: The Playground Hop Avatar floating peacefully */}
        <div className="relative mb-6">
          {/* Subtle Pink Aura behind Hop */}
          <div className="absolute inset-0 rounded-full bg-neon/25 blur-2xl pointer-events-none scale-125" />
          
          <img
            src="/assets/hop.webp"
            alt="Campus Playground Hop"
            className="w-28 h-28 sm:w-36 sm:h-36 object-contain drop-shadow-[0_10px_35px_rgba(255,0,127,0.6)] animate-float-hop relative z-10"
          />
        </div>

        {/* Minimal Monospace Status Tag */}
        <p className="text-[11px] sm:text-xs font-mono tracking-[0.3em] uppercase text-pink-400 mb-2">
          CAMPUS PLAYGROUND
        </p>

        {/* Simple Bold Coloured Typography */}
        <h1 className="text-3xl sm:text-5xl font-black tracking-tighter uppercase text-white mb-2">
          PLAYGROUND <span className="text-neon drop-shadow-[0_0_20px_#ff007f]">LOCKED</span>
        </h1>

        <p className="text-sm sm:text-base font-black tracking-widest uppercase text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-fuchsia-300 to-purple-300 mb-3">
          {PLAYGROUND_CONFIG.headline}
        </p>

        {/* Clean Message */}
        <p className="text-xs sm:text-sm text-gray-400 max-w-sm mx-auto leading-relaxed mb-8">
          We are currently redesigning the 2D campus map with new hangout zones and secrets. The playground will be back soon!
        </p>

        {/* Action Buttons: "SEE GLIMPSE" primary CTA */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => router.push('/sparx')}
            className="w-full sm:w-auto px-8 py-3.5 bg-neon hover:bg-pink-600 text-white font-black text-xs uppercase tracking-widest rounded-full shadow-[0_0_25px_rgba(255,0,127,0.55)] hover:shadow-[0_0_35px_rgba(255,0,127,0.8)] transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <span>See Glimpse</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => router.push('/sparx/music?room=Campus_PCO_247')}
            className="w-full sm:w-auto px-6 py-3.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-black text-xs uppercase tracking-widest rounded-full border border-white/15 hover:border-pink-500/40 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Radio className="w-4 h-4 text-pink-400" />
            <span>Sparx FM</span>
          </button>
        </div>
      </div>
    </div>
  );
};
