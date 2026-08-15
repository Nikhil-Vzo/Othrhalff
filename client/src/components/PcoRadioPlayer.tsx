"use client";

import React, { useState, useEffect } from 'react';
import { 
  ArrowLeft, Play, Pause, SkipForward, MessageSquare, 
  FileText, ListMusic, PlusCircle
} from 'lucide-react';

export interface PcoTrackLike {
  id: string;
  song: string;
  singers: string;
  image: string;
  media_url: string;
  duration: string;
}

interface PcoRadioPlayerProps {
  currentTrack: PcoTrackLike | null;
  currentTime: number;
  isPlaying: boolean;
  listenerCount: number;
  isAdmin: boolean;
  requestsLeft: number;
  pinnedBanner?: { text: string; expiresAt: number } | null;
  onToggleLyrics: () => void;
  onPlayPause: () => void;
  onSkip: () => void;
  onSeek?: (t: number) => void;
  onOpenRequests: () => void;
  onOpenChat: () => void;
  onBack: () => void;
}

const DEFAULT_BG = '/fm.png';

const formatTime = (s: number) => {
  const m = Math.floor(Math.max(0, s) / 60);
  const sec = String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0');
  return `${m}:${sec}`;
};

export const PcoRadioPlayer: React.FC<PcoRadioPlayerProps> = ({
  currentTrack,
  currentTime,
  isPlaying,
  listenerCount,
  isAdmin,
  requestsLeft,
  pinnedBanner,
  onToggleLyrics,
  onPlayPause,
  onSkip,
  onSeek,
  onOpenRequests,
  onOpenChat,
  onBack
}) => {
  const t = currentTrack;
  const art = t?.image || '/sparxfm-wall.jpg';
  const dur = Number(t?.duration) || 240;

  return (
    <div className="relative w-full h-full overflow-hidden select-none flex flex-col justify-between bg-black text-white font-sans">
      {/* 🌟 Background: FM.png Aesthetic Campus Wallpaper */}
      <div className="absolute inset-0 z-0">
        <img
          src={DEFAULT_BG}
          alt="Sparx FM Ambient"
          className="w-full h-full object-cover object-center filter brightness-[0.95] contrast-[1.05]"
          onError={(e) => {
            // Graceful fallback to album art with heavy blur
            e.currentTarget.src = art;
            e.currentTarget.className = "w-full h-full object-cover filter blur-3xl opacity-50";
          }}
        />
        {/* Soft atmospheric gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />
      </div>

      {/* 👑 Top Bar: Back Button (Left), Live Listener Pill (Center) */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-8 pt-4 sm:pt-6 shrink-0">
        {/* Left: Back / Leave Button */}
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-xl border border-white/15 text-white/80 hover:text-white hover:bg-black/60 flex items-center justify-center transition-all active:scale-95 shadow-lg"
          title="Back to Sparx Hub"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Center: Live Listener Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/40 backdrop-blur-xl border border-white/15 text-xs font-semibold text-white/90 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono font-bold text-emerald-300">{listenerCount || 581}</span>
          <span className="text-white/70">on the airwaves</span>
        </div>

        {/* Right: Invisible Balancer to keep center pill perfectly centered */}
        <div className="w-9 h-9 opacity-0 pointer-events-none" aria-hidden="true" />
      </header>

      {/* 📢 DJ Announcement Toast */}
      {pinnedBanner && (
        <div className="relative z-20 mx-auto mt-2 max-w-md w-[90%] bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-2xl shadow-[0_0_30px_rgba(236,72,153,0.5)] border border-pink-400/40 flex items-center justify-between animate-pulse">
          <span className="truncate mr-2 font-black">{pinnedBanner.text}</span>
          <span className="text-[9px] font-mono opacity-80 bg-black/40 px-2 py-0.5 rounded-full shrink-0">LIVE</span>
        </div>
      )}

      {/* 🎨 Clean Center Area to showcase the Campus Wallpaper */}
      <main className="relative z-10 flex-1" />

      {/* 🎵 Bottom Floating Island Player (The exact aesthetic glass capsule) */}
      <footer className="relative z-30 pb-6 sm:pb-8 px-4 flex justify-center items-center">
        <div className="max-w-xl w-full bg-[#180e14]/85 backdrop-blur-3xl border border-white/20 rounded-full px-3.5 sm:px-5 py-2.5 sm:py-3 shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex items-center justify-between gap-3 sm:gap-4 transition-all">
          
          {/* Left: Spinning Album Thumbnail + Track Title & Scrub */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Spinning Vinyl Album Art */}
            <div 
              onClick={onToggleLyrics}
              className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 border border-white/30 shadow-md cursor-pointer group"
              title="Tap for synced lyrics"
            >
              <img
                src={art}
                alt={t?.song || 'Campus PCO'}
                className={`w-full h-full object-cover ${isPlaying ? 'animate-spin' : ''}`}
                style={{ animationDuration: '8s' }}
              />
              <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors" />
              <div className="absolute inset-0 m-auto w-3 h-3 rounded-full bg-[#180e14] border border-white/40" />
            </div>

            {/* Song Name, Artist, and Seek Timeline */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs sm:text-sm font-bold text-white truncate max-w-[130px] sm:max-w-[180px]">
                  {t?.song || 'Connecting radio...'}
                </h3>
              </div>
              <p className="text-[10px] sm:text-xs text-white/60 truncate leading-tight">
                {t?.singers || '24/7 Campus Radio'}
              </p>

              {/* Sleek Progress Line */}
              <div className="mt-1 flex items-center gap-2">
                {isAdmin && onSeek ? (
                  <input
                    type="range"
                    min={0}
                    max={dur}
                    value={Math.min(currentTime, dur)}
                    onChange={e => onSeek(Number(e.target.value))}
                    className="w-full h-1 bg-white/20 accent-pink-500 cursor-pointer rounded-full"
                  />
                ) : (
                  <div className="w-full h-1 rounded-full bg-white/20 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full transition-all duration-300"
                      style={{ width: `${Math.min(100, (currentTime / dur) * 100)}%` }}
                    />
                  </div>
                )}
                <span className="text-[9px] font-mono text-white/50 shrink-0">
                  {formatTime(currentTime)} / {formatTime(dur)}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Controls (Lyrics, Request/Queue, Play/Pause, Skip, Chat) */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* 📝 Extra Lyric Button */}
            <button
              onClick={onToggleLyrics}
              className="p-2 sm:p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
              title="Toggle Live Synced Lyrics"
              aria-label="Lyrics"
            >
              <FileText className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-pink-300" />
            </button>

            {/* 🎵 Song Request / Add Button */}
            <button
              onClick={onOpenRequests}
              className="p-2 sm:p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 active:scale-90 transition-all relative"
              title={`Request Song (${requestsLeft} left today)`}
              aria-label="Request Song"
            >
              <PlusCircle className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-purple-300" />
              {requestsLeft > 0 && (
                <span className="absolute 0 top-1 right-1 w-2 h-2 rounded-full bg-pink-500 animate-ping" />
              )}
            </button>

            {/* 💬 Live Chat Button */}
            <button
              onClick={onOpenChat}
              className="p-2 sm:p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
              title="Live Chat"
              aria-label="Chat"
            >
              <MessageSquare className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-indigo-300" />
            </button>

            {/* ⏸️ / ▶️ Main White Circular Play / Pause Button */}
            <button
              onClick={onPlayPause}
              disabled={!isAdmin}
              className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all ${
                isAdmin ? 'hover:scale-105 active:scale-90 cursor-pointer' : 'cursor-default opacity-95'
              }`}
              title={isAdmin ? (isPlaying ? 'Pause Station' : 'Resume Station') : 'Campus Live Radio'}
              aria-label="Play / Pause"
            >
              {isPlaying ? (
                <Pause className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-black text-black" />
              ) : (
                <Play className="w-4 h-4 sm:w-4.5 sm:h-4.5 fill-black text-black ml-0.5" />
              )}
            </button>

            {/* ⏭️ Skip Button (For Admin DJ) */}
            {isAdmin && (
              <button
                onClick={onSkip}
                className="p-2 sm:p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
                title="Skip Track (Admin DJ)"
                aria-label="Skip"
              >
                <SkipForward className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
              </button>
            )}

            {/* ☰ Queue / Playlist Panel Trigger */}
            <button
              onClick={onOpenRequests}
              className="p-2 sm:p-2.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 active:scale-90 transition-all"
              title="View Queue & Scheduled Songs"
              aria-label="Queue"
            >
              <ListMusic className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PcoRadioPlayer;
