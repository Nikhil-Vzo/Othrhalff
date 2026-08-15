"use client";

import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Play, Pause, SkipForward, SkipBack, MessageSquare, 
  FileText, ListMusic, PlusCircle, Volume2, Sparkles, Radio, Mic2
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

  // Live Clock (e.g. "9:04 pm")
  const [timeString, setTimeString] = useState('');
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeString(now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase());
    };
    updateTime();
    const timer = setInterval(updateTime, 10000);
    return () => clearInterval(timer);
  }, []);

  // Retro Indian Truck Horn SFX generator (Web Audio API)
  const [honking, setHonking] = useState(false);
  const playHornSound = () => {
    setHonking(true);
    setTimeout(() => setHonking(false), 900);
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sawtooth';
      osc2.type = 'sawtooth';
      osc1.frequency.setValueAtTime(340, ctx.currentTime);
      osc2.frequency.setValueAtTime(425, ctx.currentTime);

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.6);
      osc2.stop(ctx.currentTime + 0.6);
    } catch (_) {}
  };

  return (
    <div className="relative w-full h-full overflow-hidden select-none flex flex-col justify-between bg-black text-white font-sans">
      {/* 🌟 Background: FM.png Aesthetic Wallpaper with Cinematic Vignette */}
      <div className="absolute inset-0 z-0">
        <img
          src={DEFAULT_BG}
          alt="Sparx FM Ambient"
          className="w-full h-full object-cover object-center filter brightness-[0.92] contrast-[1.05]"
          onError={(e) => {
            // Graceful fallback to album art with heavy blur
            e.currentTarget.src = art;
            e.currentTarget.className = "w-full h-full object-cover filter blur-3xl opacity-50";
          }}
        />
        {/* Soft film grain and atmospheric gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/80 pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.6)_100%)] pointer-events-none" />
      </div>

      {/* 👑 Top Bar: Time, Live Listener Pill, Back Button */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-8 pt-4 sm:pt-6 shrink-0">
        {/* Left: Clock */}
        <div className="font-mono text-xs sm:text-sm font-semibold tracking-wider text-white/80 drop-shadow">
          {timeString || '9:00 pm'}
        </div>

        {/* Center: Live Listener Pill */}
        <div className="flex items-center gap-2 px-3.5 py-1 rounded-full bg-black/40 backdrop-blur-xl border border-white/15 text-xs font-semibold text-white/90 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono font-bold text-emerald-300">{listenerCount || 581}</span>
          <span className="text-white/70">on the airwaves</span>
        </div>

        {/* Right: Leave / Back Button */}
        <button
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-xl border border-white/15 text-white/80 hover:text-white hover:bg-black/60 flex items-center justify-center transition-all active:scale-95 shadow-lg"
          title="Back to Sparx Hub"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
      </header>

      {/* 📢 DJ Announcement Toast */}
      {pinnedBanner && (
        <div className="relative z-20 mx-auto mt-2 max-w-md w-[90%] bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 text-white font-bold text-xs px-4 py-2 rounded-2xl shadow-[0_0_30px_rgba(236,72,153,0.5)] border border-pink-400/40 flex items-center justify-between animate-pulse">
          <span className="truncate mr-2 font-black">{pinnedBanner.text}</span>
          <span className="text-[9px] font-mono opacity-80 bg-black/40 px-2 py-0.5 rounded-full shrink-0">LIVE</span>
        </div>
      )}

      {/* 🎨 Center Hero Stage: Aesthetic Indian Truck Typography & Horn Button */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-4 py-6 pointer-events-none">
        {/* Left Interactive Easter Egg: "हॉर्न ओके प्लीज / Horn OK Please" */}
        <div className="absolute left-4 sm:left-10 top-1/2 -translate-y-1/2 pointer-events-auto">
          <button
            onClick={playHornSound}
            className={`group flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-black/40 hover:bg-black/70 backdrop-blur-xl border border-white/15 text-left transition-all active:scale-95 shadow-2xl ${
              honking ? 'scale-110 border-pink-500 shadow-[0_0_25px_rgba(236,72,153,0.6)] bg-pink-950/60' : ''
            }`}
            title="Press for nostalgic truck horn sound!"
          >
            <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center text-pink-300 group-hover:scale-110 transition-transform">
              <Volume2 className="w-3.5 h-3.5" />
            </div>
            <div>
              <p className="text-[11px] font-black text-white leading-tight font-sans">
                हॉर्न ओके प्लीज
              </p>
              <p className="text-[9px] text-white/50 font-mono leading-none">
                Horn pleaseeee
              </p>
            </div>
          </button>
        </div>

        {/* Center Aesthetic Hero Title */}
        <div className="space-y-2 pointer-events-auto">
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-black text-white tracking-normal drop-shadow-[0_12px_40px_rgba(0,0,0,0.85)] font-sans">
            ट्रक वाला
          </h1>
          <p className="text-xs sm:text-sm md:text-base font-semibold text-white/80 tracking-widest drop-shadow italic">
            दिल्ली अभी दूर है ☕
          </p>
        </div>
      </main>

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
