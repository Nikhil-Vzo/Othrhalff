"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Lock, Ghost, Sparkles, Camera, Radio, Compass, ArrowRight } from 'lucide-react';
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
    <div className="relative w-full h-full min-h-[calc(100dvh-4rem)] flex items-center justify-center p-4 sm:p-8 bg-black text-white font-sans overflow-hidden select-none">
      
      {/* Background Ambience: Deep Cyber Grid + Atmospheric Neon Blooms */}
      <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:28px_28px] pointer-events-none opacity-70" />
      
      {/* Atmospheric Neon Pink & Violet Blooms */}
      <div className="absolute -top-40 -left-40 w-[460px] h-[460px] rounded-full bg-neon/20 blur-[140px] pointer-events-none animate-pulse-slow" />
      <div className="absolute -bottom-40 -right-40 w-[500px] h-[500px] rounded-full bg-purple-600/25 blur-[150px] pointer-events-none animate-pulse-slow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-fuchsia-900/10 blur-[180px] pointer-events-none" />

      {/* Cyberpunk Map Blueprint Decorative Watermarks */}
      <div className="absolute top-6 left-6 hidden md:flex flex-col text-[10px] font-mono text-white/20 tracking-widest pointer-events-none space-y-1">
        <span>MAP_PROTOCOL // BUILD_2.0</span>
        <span>SECTOR: CENTRAL_PLAZA</span>
        <span>GRID: 2560 x 1440</span>
      </div>
      <div className="absolute bottom-6 right-6 hidden md:flex flex-col text-right text-[10px] font-mono text-white/20 tracking-widest pointer-events-none space-y-1">
        <span>STATUS // ACCESS_RESTRICTED</span>
        <span>SPATIAL_VOICE: STANDBY</span>
      </div>

      {/* Main Authentic Othrhalff Card */}
      <div className="relative z-10 w-full max-w-lg bg-[#0b0614]/90 backdrop-blur-3xl border border-pink-500/35 rounded-3xl p-6 sm:p-10 text-center shadow-[0_0_60px_rgba(255,0,127,0.22),inset_0_1px_0_0_rgba(255,255,255,0.18)] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Edge Neon Sheen */}
        <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-neon to-transparent opacity-90 shadow-[0_0_15px_#ff007f]" />
        
        {/* Radiant Corner Bloom */}
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_50%_0%,_rgba(255,0,127,0.25)_0%,_rgba(147,51,234,0.12)_50%,_transparent_75%)]" />

        {/* Brand Header */}
        <div className="relative z-10 inline-flex items-center gap-2 justify-center mb-6">
          <div className="relative">
            <Ghost className="w-5 h-5 text-neon drop-shadow-[0_0_10px_rgba(255,0,127,0.7)] rotate-6" />
            <Sparkles className="w-2.5 h-2.5 text-white absolute -top-1 -right-1 animate-pulse" />
          </div>
          <span className="text-base font-black tracking-tighter uppercase text-white">
            Othr<span className="text-neon drop-shadow-[0_0_8px_rgba(255,0,127,0.6)]">Halff</span>
          </span>
          <span className="text-[10px] font-mono tracking-widest text-pink-400/70 ml-1">
            // CAMPUS
          </span>
        </div>

        {/* Centerpiece: Holographic Locked Terminal Graphic */}
        <div className="relative z-10 mx-auto w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-b from-[#1d072b] via-[#12041d] to-[#09020e] border border-pink-500/40 flex items-center justify-center shadow-[0_0_35px_rgba(255,0,127,0.35)] mb-5 group">
          
          {/* Subtle Cyber Grid in Icon Box */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:10px_10px] rounded-2xl pointer-events-none" />

          {/* Pulsing neon aura ring */}
          <div className="absolute -inset-1 rounded-2xl border border-neon/30 animate-pulse opacity-60 pointer-events-none" />

          {/* Layered Lock & Map Compass Icon */}
          <div className="relative flex items-center justify-center">
            <Compass className="w-14 h-14 sm:w-16 sm:h-16 text-pink-500/20 absolute animate-spin-slow pointer-events-none" />
            <Lock className="w-9 h-9 sm:w-11 sm:h-11 text-white drop-shadow-[0_0_16px_rgba(255,0,127,0.9)] transition-transform duration-300 group-hover:scale-105" />
          </div>

          {/* Mini Status Beacon */}
          <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-neon opacity-75" />
            <span className="relative inline-flex rounded-full h-4 w-4 bg-neon items-center justify-center shadow-[0_0_10px_#ff007f]">
              <Sparkles className="w-2.5 h-2.5 text-white" />
            </span>
          </span>
        </div>

        {/* Locked Status Badge */}
        <div className="relative z-10 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-pink-500/15 border border-pink-500/40 text-pink-200 text-[10px] sm:text-xs font-black uppercase tracking-widest mb-4 shadow-[0_0_15px_rgba(255,0,127,0.3)]">
          <span className="w-1.5 h-1.5 rounded-full bg-neon animate-ping" />
          <span>LOCKED</span>
        </div>

        {/* Main Title & Changing Map Design Headline */}
        <div className="relative z-10 space-y-2 mb-6">
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white uppercase">
            {title}
          </h1>
          <p className="text-base sm:text-lg font-black uppercase tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-fuchsia-300 to-purple-300 drop-shadow-[0_0_20px_rgba(255,0,127,0.5)]">
            {headline}
          </p>
          <p className="text-xs sm:text-sm text-gray-300/85 font-medium leading-relaxed max-w-sm mx-auto pt-1">
            {message}
          </p>
        </div>

        {/* Cyber Status Details Box */}
        <div className="relative z-10 grid grid-cols-2 gap-2.5 p-3.5 bg-black/70 rounded-2xl border border-white/10 mb-7 text-left">
          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-pink-500/20 border border-pink-500/30 flex items-center justify-center shrink-0">
              <Compass className="w-4 h-4 text-pink-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider truncate">Campus Map</p>
              <p className="text-xs font-black text-white uppercase tracking-tight truncate">Redesigning</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/5">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-gray-400 font-mono uppercase tracking-wider truncate">New Layout</p>
              <p className="text-xs font-black text-pink-300 uppercase tracking-tight truncate">Coming Soon</p>
            </div>
          </div>
        </div>

        {/* Action Buttons: "SEE GLIMPSE" primary CTA */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={() => router.push('/sparx')}
            className="flex-1 py-3.5 px-6 bg-gradient-to-r from-[#ff007f] via-[#c026d3] to-[#8b5cf6] hover:brightness-110 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-[0_0_25px_rgba(255,0,127,0.5)] hover:shadow-[0_0_35px_rgba(255,0,127,0.7)] border border-pink-400/40 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>See Glimpse</span>
            <ArrowRight className="w-3.5 h-3.5 text-white/80" />
          </button>

          <button
            onClick={() => router.push('/sparx/music?room=Campus_PCO_247')}
            className="py-3.5 px-5 bg-[#170e24]/90 hover:bg-[#231538] text-pink-200 hover:text-white font-black text-xs uppercase tracking-widest rounded-2xl border border-pink-500/30 hover:border-pink-400/60 transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer shadow-lg"
          >
            <Radio className="w-4 h-4 text-pink-400" />
            <span>Sparx FM</span>
          </button>
        </div>
      </div>
    </div>
  );
};
