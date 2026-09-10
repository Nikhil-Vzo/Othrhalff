"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Compass, Layers, Sparkles, ArrowLeft, Zap, Home, Ghost } from 'lucide-react';
import { PLAYGROUND_CONFIG } from '../constants';

interface PlaygroundLockedProps {
  title?: string;
  headline?: string;
  message?: string;
}

export const PlaygroundLocked: React.FC<PlaygroundLockedProps> = ({
  title = PLAYGROUND_CONFIG.title,
  headline = PLAYGROUND_CONFIG.headline,
  message = PLAYGROUND_CONFIG.message,
}) => {
  const router = useRouter();

  return (
    <div className="relative w-full h-full min-h-[calc(100dvh-4rem)] flex items-center justify-center p-4 sm:p-6 bg-black text-white font-sans overflow-hidden select-none">
      {/* Background Ambience & Cyberpunk Grid Pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none opacity-80" />
      
      {/* Soft Radiant Light Blooms */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-amber-500/10 blur-[120px] pointer-events-none animate-pulse-slow" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-neon/15 blur-[130px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-purple-600/10 blur-[150px] pointer-events-none" />

      {/* Main Glassmorphic Locked Card */}
      <div className="relative z-10 w-full max-w-md bg-[#0c0914]/90 backdrop-blur-2xl border border-amber-500/25 rounded-3xl p-6 sm:p-8 text-center shadow-[0_0_50px_rgba(245,158,11,0.15),0_0_25px_rgba(255,0,127,0.1)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Card Top Glowing Border Sheen */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-80" />

        {/* Mascot Branding Header */}
        <div className="inline-flex items-center gap-2 justify-center mb-6">
          <div className="relative">
            <Ghost className="w-5 h-5 text-neon drop-shadow-[0_0_8px_rgba(255,0,127,0.5)] rotate-6" />
            <Sparkles className="w-2 h-2 text-white absolute -top-1 -right-1 animate-pulse" />
          </div>
          <span className="text-base font-black text-white tracking-tighter uppercase">
            Othr<span className="text-neon">Halff</span>
          </span>
        </div>

        {/* Floating Glowing Lock Graphic */}
        <div className="relative mx-auto w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-tr from-amber-500/20 via-orange-500/15 to-pink-500/20 border border-amber-500/40 flex items-center justify-center shadow-[0_0_35px_rgba(245,158,11,0.35)] mb-5 group">
          {/* Pulsing ring aura */}
          <div className="absolute inset-0 rounded-2xl border border-amber-400/40 animate-ping opacity-30 pointer-events-none" />
          
          <Lock className="w-10 h-10 sm:w-12 sm:h-12 text-amber-300 drop-shadow-[0_0_15px_rgba(245,158,11,0.7)] transition-transform duration-300 group-hover:scale-110" />
          
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-amber-500 items-center justify-center">
              <Sparkles className="w-2.5 h-2.5 text-black" />
            </span>
          </span>
        </div>

        {/* Locked Pill Tag */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 border border-amber-500/35 text-amber-300 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-3 shadow-[0_0_12px_rgba(245,158,11,0.25)]">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>LOCKED</span>
        </div>

        {/* Main Title & Key Message */}
        <div className="space-y-1.5 mb-5">
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
            {title}
          </h1>
          <p className="text-sm sm:text-base font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-amber-300 via-orange-300 to-pink-400 tracking-wide uppercase">
            {headline}
          </p>
          <p className="text-xs sm:text-sm text-neutral-400 font-medium leading-relaxed max-w-xs mx-auto pt-1">
            {message}
          </p>
        </div>

        {/* Bento Status Grid */}
        <div className="grid grid-cols-2 gap-2 p-3 bg-black/60 rounded-2xl border border-white/10 mb-6 text-left">
          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center shrink-0">
              <Compass className="w-3.5 h-3.5 text-amber-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 font-medium truncate">Campus Map</p>
              <p className="text-[11px] font-bold text-amber-200 truncate">Redesigning</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="w-7 h-7 rounded-lg bg-pink-500/15 border border-pink-500/30 flex items-center justify-center shrink-0">
              <Layers className="w-3.5 h-3.5 text-pink-300" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 font-medium truncate">2D World</p>
              <p className="text-[11px] font-bold text-pink-200 truncate">Upgrading</p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
          <button
            onClick={() => router.push('/home')}
            className="flex-1 py-3 px-4 bg-neon hover:bg-pink-600 text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-[0_0_20px_rgba(255,0,127,0.35)] hover:shadow-[0_0_30px_rgba(255,0,127,0.55)] transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Go to Home</span>
          </button>

          <button
            onClick={() => router.push('/sparx')}
            className="flex-1 py-3 px-4 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-bold text-xs uppercase tracking-wider rounded-full border border-white/15 hover:border-white/30 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>Sparx FM</span>
          </button>
        </div>
      </div>
    </div>
  );
};
