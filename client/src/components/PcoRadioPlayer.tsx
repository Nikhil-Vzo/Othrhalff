"use client";

import React, { useRef } from 'react';
import { ArrowLeft, LogOut, Play, Pause, SkipForward, MessageSquare, ChevronUp, FileText, Radio, Shield } from 'lucide-react';

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
  onToggleLyrics: () => void;
  onPlayPause: () => void;
  onSkip: () => void;
  onSeek?: (t: number) => void;
  onOpenRequests: () => void;
  onOpenChat: () => void;
  onOpenConsole?: () => void;
  onBack: () => void;
  onLeave: () => void;
}

const DEFAULT_WALL = '/sparxfm-wall.jpg';

const fmt = (s: number) => {
  const m = Math.floor(Math.max(0, s) / 60);
  const sec = String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0');
  return `${m}:${sec}`;
};

const Eq: React.FC<{ playing: boolean }> = ({ playing }) => (
  <span className="flex items-end gap-[2px] h-3">
    {[0, 1, 2, 3].map(i => (
      <span
        key={i}
        className="w-[3px] rounded-full bg-pink-400"
        style={{
          height: playing ? undefined : '25%',
          animation: playing ? `eq 0.9s ease-in-out ${i * 0.15}s infinite` : 'none'
        }}
      />
    ))}
  </span>
);

export const PcoRadioPlayer: React.FC<PcoRadioPlayerProps> = ({
  currentTrack,
  currentTime,
  isPlaying,
  listenerCount,
  isAdmin,
  requestsLeft,
  onToggleLyrics,
  onPlayPause,
  onSkip,
  onSeek,
  onOpenRequests,
  onOpenChat,
  onOpenConsole,
  onBack,
  onLeave
}) => {
  const t = currentTrack;
  const art = t?.image || DEFAULT_WALL;
  const dur = Number(t?.duration) || 240;
  const touchY = useRef<number | null>(null);

  const handleArtError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (e.currentTarget.src !== DEFAULT_WALL) {
      e.currentTarget.src = DEFAULT_WALL;
    }
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden select-none flex flex-col justify-between"
      onTouchStart={e => {
        touchY.current = e.touches[0].clientY;
      }}
      onTouchEnd={e => {
        if (touchY.current !== null && touchY.current - e.changedTouches[0].clientY > 60) {
          onOpenRequests();
        }
        touchY.current = null;
      }}
    >
      {/* Ambient background wallpaper */}
      <img
        src={art}
        alt=""
        onError={handleArtError}
        className="absolute inset-0 w-full h-full object-cover scale-125 blur-3xl opacity-40 transition-all duration-1000"
      />
      <div className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/35 to-black/95" />
      <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-pink-600/20 blur-[120px] pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-96 h-96 rounded-full bg-purple-600/20 blur-[120px] pointer-events-none" />

      {/* Slim Top Chrome Bar */}
      <div className="relative z-20 flex items-center justify-between px-3 sm:px-4 pt-3 sm:pt-4 shrink-0 gap-1.5">
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={onBack}
            className="p-2 bg-white/10 border border-white/10 rounded-full backdrop-blur-md hover:bg-white/20 active:scale-95 transition-all shrink-0"
            title="Back to Sparx Hub"
          >
            <ArrowLeft className="w-4 h-4 text-white/90" />
          </button>
          <span className="font-mono text-[10px] sm:text-[11px] font-black tracking-[0.2em] sm:tracking-[0.3em] text-white/90 flex items-center gap-1">
            SPARX<span className="text-pink-400">FM</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          </span>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 border border-white/10 text-[10px] font-bold text-white/90 backdrop-blur-md shrink-0">
            <Radio className="w-3 h-3 text-pink-400" />
            <span>{listenerCount}</span>
            <span className="hidden sm:inline">listening</span>
          </span>

          {isAdmin && onOpenConsole && (
            <button
              onClick={onOpenConsole}
              className="flex items-center gap-1 px-2.5 sm:px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 text-white text-[10px] font-black hover:opacity-90 active:scale-95 transition-all shadow-md shadow-pink-500/20 shrink-0"
              title="Open DJ Mission Control Console"
            >
              <Shield className="w-3 h-3" />
              <span>DJ</span>
              <span className="hidden sm:inline">CONSOLE</span>
            </button>
          )}

          <button
            onClick={onLeave}
            className="p-2 rounded-full text-red-400 bg-white/5 border border-white/10 hover:bg-red-500/20 active:scale-95 transition-all shrink-0"
            title="Leave Radio"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Lock-Screen Style Stack */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 py-2 gap-3 md:gap-5 min-h-0 overflow-y-auto">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-pink-500/90 text-white text-[9px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(236,72,153,0.5)]">
            <Eq playing={isPlaying} /> Live on air
          </span>
        </div>

        {/* Artwork (Tap for lyrics, neon breathing ring) */}
        <button
          onClick={onToggleLyrics}
          title="Tap artwork for animated lyrics"
          className={`relative w-48 h-48 sm:w-56 sm:h-56 md:w-72 md:h-72 rounded-[2rem] overflow-hidden border border-white/20 transition-all duration-700 active:scale-95 shrink-0 ${
            isPlaying
              ? 'scale-100 shadow-[0_0_70px_rgba(236,72,153,0.35)]'
              : 'scale-95 shadow-[0_25px_80px_rgba(0,0,0,0.8)]'
          }`}
        >
          <img
            src={art}
            alt={t?.song || 'Campus PCO'}
            onError={handleArtError}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </button>

        {/* Track Title & Artist */}
        <div className="text-center min-w-0 max-w-md w-full shrink-0">
          <h1 className="text-xl sm:text-2xl md:text-4xl font-black text-white truncate drop-shadow-lg tracking-tight">
            {t?.song || 'Tuning the airwaves…'}
          </h1>
          <p className="text-xs sm:text-sm md:text-base text-white/70 font-medium truncate mt-1">
            {t?.singers || '24/7 Campus Radio'}
          </p>
        </div>

        {/* Progress Bar (Ambient glow for listeners, seekable slider for DJ) */}
        <div className="w-full max-w-md shrink-0">
          {isAdmin && onSeek ? (
            <input
              type="range"
              min={0}
              max={dur}
              value={Math.min(currentTime, dur)}
              onChange={e => onSeek(Number(e.target.value))}
              className="w-full h-1.5 bg-white/20 accent-pink-500 cursor-pointer rounded-full"
            />
          ) : (
            <div className="w-full h-1.5 rounded-full bg-white/15 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full shadow-[0_0_12px_rgba(236,72,153,0.8)] transition-all duration-500"
                style={{ width: `${Math.min(100, (currentTime / dur) * 100)}%` }}
              />
            </div>
          )}
          <div className="flex justify-between text-[10px] font-mono text-white/50 mt-1.5">
            <span>{fmt(currentTime)}</span>
            <span>{fmt(dur)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3 sm:gap-4 md:gap-6 shrink-0 mt-1">
          <button
            onClick={onToggleLyrics}
            className="p-3 rounded-full bg-white/10 border border-white/10 text-white/80 hover:bg-white/20 hover:text-white backdrop-blur-md active:scale-95 transition-all"
            title="Lyrics view"
          >
            <FileText className="w-5 h-5" />
          </button>

          {isAdmin ? (
            <>
              <button
                onClick={onPlayPause}
                className="w-14 h-14 md:w-18 md:h-18 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.35)] hover:scale-105 active:scale-95 transition-all"
                title={isPlaying ? 'Pause Station' : 'Resume Station'}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 md:w-7 md:h-7 fill-current" />
                ) : (
                  <Play className="w-6 h-6 md:w-7 md:h-7 fill-current ml-1" />
                )}
              </button>
              <button
                onClick={onSkip}
                className="p-3 rounded-full bg-white/10 border border-white/10 text-white/80 hover:bg-white/20 hover:text-white backdrop-blur-md active:scale-95 transition-all"
                title="Skip Track"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </>
          ) : (
            <button
              onClick={onOpenRequests}
              className="px-5 sm:px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-xs font-black shadow-[0_0_30px_rgba(236,72,153,0.4)] active:scale-95 transition-all tracking-wider"
            >
              REQUEST SONG ({requestsLeft})
            </button>
          )}

          <button
            onClick={onOpenChat}
            className="p-3 rounded-full bg-white/10 border border-white/10 text-white/80 hover:bg-white/20 hover:text-white backdrop-blur-md active:scale-95 transition-all"
            title="Live Chat"
          >
            <MessageSquare className="w-5 h-5" />
          </button>
        </div>

        {/* Swipe-up / Click hint to open Requests/Chat */}
        <button
          onClick={onOpenRequests}
          className="flex flex-col items-center text-white/50 hover:text-white/90 transition-colors mt-2 pb-1 group"
        >
          <ChevronUp className="w-4 h-4 animate-bounce text-pink-400 mb-0.5 group-hover:scale-110 transition-transform" />
          <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/70 group-hover:text-white">
            Swipe up to req & chat
          </span>
        </button>
      </div>
    </div>
  );
};

export default PcoRadioPlayer;
