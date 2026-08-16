"use client";

import React, { useState } from 'react';
import { Printer, Download, Sparkles, Music, Radio, MessageSquare, Headphones, QrCode } from 'lucide-react';

export const SparxPosterGenerator: React.FC = () => {
  const [headline, setHeadline] = useState("SPARX FM");
  const [subheading, setSubheading] = useState("YOUR CAMPUS 24/7 RADIO");
  const [tagline, setTagline] = useState("Listen together • Request songs • Vibe");
  const [bullet1, setBullet1] = useState("Request any song for campus to hear next");
  const [bullet2, setBullet2] = useState("24/7 synchronized beats, bollywood & lo-fi");
  const [bullet3, setBullet3] = useState("Live reactions, real-time lyrics & campus chat");
  const [url, setUrl] = useState("othrhalff.com/sparx/music");
  const [campusName, setCampusName] = useState("OTHRHALFF PRESENTS");

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=https://${encodeURIComponent(url)}&color=ffffff&bgcolor=00000000`;

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-[#07030e] text-white p-4 md:p-8 flex flex-col items-center justify-center font-sans">
      {/* Control Panel (Hidden on Print) */}
      <div className="print:hidden w-full max-w-2xl bg-[#120822] border border-pink-500/30 rounded-3xl p-6 mb-8 shadow-2xl backdrop-blur-xl">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-pink-400" />
            <h2 className="text-lg font-bold text-white">Sparx FM Print Poster Studio</h2>
          </div>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-extrabold rounded-2xl shadow-[0_0_20px_rgba(236,72,153,0.6)] transition-transform active:scale-95 cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Poster (PDF / Paper)</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div>
            <label className="text-gray-400 font-semibold block mb-1">Top Tagline</label>
            <input
              value={campusName}
              onChange={(e) => setCampusName(e.target.value)}
              className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
            />
          </div>
          <div>
            <label className="text-gray-400 font-semibold block mb-1">Main Headline</label>
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500 font-bold"
            />
          </div>
          <div>
            <label className="text-gray-400 font-semibold block mb-1">Subheading</label>
            <input
              value={subheading}
              onChange={(e) => setSubheading(e.target.value)}
              className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
            />
          </div>
          <div>
            <label className="text-gray-400 font-semibold block mb-1">Scan Target URL</label>
            <input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full bg-black/50 border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-pink-500"
            />
          </div>
        </div>
      </div>

      {/* 🖨️ THE PRINTABLE POSTER CONTAINER (A4 / Standard Poster Aspect 2:3) */}
      <div 
        id="printable-poster"
        className="w-full max-w-[480px] aspect-[2/3] bg-gradient-to-b from-[#1b002c] via-[#0d011c] to-[#04000a] border border-pink-500/40 rounded-[32px] p-8 md:p-10 shadow-[0_20px_80px_rgba(236,72,153,0.3)] flex flex-col justify-between relative overflow-hidden print:w-full print:max-w-none print:aspect-auto print:border-none print:shadow-none print:rounded-none print:p-12 print:h-screen"
      >
        {/* Atmospheric Glow Backdrops */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-80 h-80 bg-pink-500/30 rounded-full blur-[90px] pointer-events-none" />
        <div className="absolute top-1/3 -right-20 w-60 h-60 bg-purple-600/25 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-10 -left-20 w-60 h-60 bg-amber-500/20 rounded-full blur-[80px] pointer-events-none" />

        {/* 1. Header & Title */}
        <div className="relative z-10 text-center">
          <p className="text-[11px] md:text-xs font-black tracking-[0.3em] text-pink-400 uppercase mb-2">
            {campusName}
          </p>
          <h1 className="text-5xl md:text-6xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-amber-300 drop-shadow-[0_0_35px_rgba(236,72,153,0.8)]">
            {headline}
          </h1>
          <p className="text-xs md:text-sm font-extrabold tracking-widest text-gray-300 uppercase mt-2">
            {subheading}
          </p>
        </div>

        {/* 2. Visual Centerpiece (Neon Radio & Headphones Iconography) */}
        <div className="relative z-10 my-4 flex flex-col items-center justify-center">
          <div className="relative flex items-center justify-center">
            {/* Glowing Soundwave Ring */}
            <div className="absolute w-36 h-36 rounded-full border border-pink-500/30 animate-pulse pointer-events-none" />
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-pink-500/20 to-purple-600/30 border-2 border-pink-400/60 flex items-center justify-center shadow-[0_0_40px_rgba(236,72,153,0.5)]">
              <Headphones className="w-12 h-12 text-pink-300 drop-shadow-[0_0_15px_rgba(255,255,255,0.8)]" />
            </div>
          </div>
          <p className="text-xs text-pink-200/90 font-medium italic mt-3 text-center">
            "{tagline}"
          </p>
        </div>

        {/* 3. Key Feature Bullets (Clean & Balanced) */}
        <div className="relative z-10 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-pink-500/20 border border-pink-500/40 flex items-center justify-center shrink-0">
              <Music className="w-3.5 h-3.5 text-pink-400" />
            </div>
            <span className="text-xs md:text-[13px] font-bold text-gray-100">{bullet1}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center shrink-0">
              <Radio className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <span className="text-xs md:text-[13px] font-bold text-gray-100">{bullet2}</span>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
              <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <span className="text-xs md:text-[13px] font-bold text-gray-100">{bullet3}</span>
          </div>
        </div>

        {/* 4. Bottom QR Code Scan Card */}
        <div className="relative z-10 mt-4 bg-gradient-to-r from-pink-500/20 via-purple-600/20 to-black/60 border-2 border-pink-500/50 rounded-2xl p-3.5 flex items-center gap-4 shadow-[0_0_30px_rgba(236,72,153,0.3)]">
          <div className="bg-black/80 p-1.5 rounded-xl border border-white/20 shrink-0">
            <img
              src={qrImageUrl}
              alt="Scan QR"
              className="w-16 h-16 rounded-lg object-contain filter invert"
            />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] font-black tracking-widest text-pink-400 uppercase block">SCAN TO TUNE IN</span>
            <h4 className="text-sm md:text-base font-black text-white truncate">{url}</h4>
            <span className="text-[10px] text-gray-400 font-semibold block mt-0.5">Works on any phone • No app install required</span>
          </div>
        </div>

      </div>
    </div>
  );
};
