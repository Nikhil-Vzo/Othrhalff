"use client";

import React, { useRef, useState, useEffect } from 'react';
import {
  ArrowLeft, Play, Pause, SkipForward, FileText, Menu, X, Shield, Maximize, Minimize
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
  floatingChatMessages?: { id: string; user: string; text: string }[];
  isSidebarOpen?: boolean;
  onToggleLyrics: () => void;
  onPlayPause: () => void;
  onSkip: () => void;
  onSeek?: (t: number) => void;
  onToggleSidebar: () => void;
  onToggleAdminPanel?: () => void;
  onBack: () => void;
}

const DEFAULT_BG = '/fm_pc_2.png';

const formatTime = (s: number) => {
  const m = Math.floor(Math.max(0, s) / 60);
  const sec = String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0');
  return `${m}:${sec}`;
};

export const PcoRadioPlayer: React.FC<PcoRadioPlayerProps> = React.memo(({
  currentTrack,
  currentTime,
  isPlaying,
  listenerCount,
  isAdmin,
  requestsLeft,
  pinnedBanner,
  floatingChatMessages,
  isSidebarOpen = false,
  onToggleLyrics,
  onPlayPause,
  onSkip,
  onSeek,
  onToggleSidebar,
  onToggleAdminPanel,
  onBack
}) => {
  const t = currentTrack;
  const art = t?.image || '/sparxfm-wall.jpg';
  const dur = Number(t?.duration) || 240;
  
  // Production-grade gesture tracking
  const gestureRef = useRef({
    active: false,
    startX: 0,
    startY: 0,
    startTime: 0
  });
  const gestureLockRef = useRef(false);

  const isSwipeBlockedTarget = (target: EventTarget | null) => {
    const el = target as HTMLElement | null;
    if (!el) return true;
    if (el.closest('[data-swipe-handle]')) return false;
    return !!el.closest(
      'button, input, textarea, select, a, [data-no-swipe], input[type="range"]'
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (isSidebarOpen) return;
    if (gestureLockRef.current) return;
    if (e.touches.length !== 1) return;
    if (isSwipeBlockedTarget(e.target)) return;

    const touch = e.touches[0];
    gestureRef.current = {
      active: true,
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now()
    };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!gestureRef.current.active) return;
    gestureRef.current.active = false;

    if (isSidebarOpen) return;
    if (gestureLockRef.current) return;

    const touch = e.changedTouches[0];
    const dx = touch.clientX - gestureRef.current.startX;
    const dy = touch.clientY - gestureRef.current.startY;
    const elapsed = Date.now() - gestureRef.current.startTime;

    const isVerticalIntent = Math.abs(dy) > Math.abs(dx) * 1.5;
    const isSwipeUp = dy < -80;
    const isFastEnough = elapsed < 650;

    if (isSwipeUp && isVerticalIntent && isFastEnough) {
      if (e.cancelable) {
        e.preventDefault(); // Prevents mobile browser synthesized click double-toggle
      }
      gestureLockRef.current = true;
      onToggleSidebar();
      setTimeout(() => {
        gestureLockRef.current = false;
      }, 250);
    }
  };

  const handleTouchCancel = () => {
    gestureRef.current.active = false;
  };

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
    };
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen?.().catch((err) => {
        console.warn('Fullscreen error:', err);
      });
    } else {
      document.exitFullscreen?.().catch((err) => {
        console.warn('Exit fullscreen error:', err);
      });
    }
  };

  return (
    <div className="relative w-full h-[100svh] overflow-hidden select-none flex flex-col justify-between bg-black text-white font-sans">
      {/* 🌟 Background: Responsive Looping Video */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          poster={DEFAULT_BG}
          className="w-full h-full object-cover object-center filter brightness-[0.95] contrast-[1.05]"
        >
          <source src="/loop.mp4" type="video/mp4" />
        </video>
        {/* Soft atmospheric gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />
      </div>

      {/* 👑 Top Bar: Back Button (Left), Live Listener Pill (Center), Fullscreen & Menu/Admin (Right) */}
      <header className="relative z-20 flex items-center justify-between px-4 sm:px-8 pt-4 sm:pt-6 shrink-0">
        {/* Left: Back / Leave Button */}
        <button
          onClick={onBack}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/15 text-white/80 hover:text-white hover:bg-black/70 flex items-center justify-center transition-all active:scale-90 shadow-lg cursor-pointer"
          title="Back to Sparx Hub"
          aria-label="Back"
        >
          <ArrowLeft className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>

        {/* Center: Live Listener Pill */}
        <div className="flex items-center gap-2 px-3.5 sm:px-4 py-1 sm:py-1.5 rounded-full bg-black/50 backdrop-blur-xl border border-white/15 text-xs font-semibold text-white/90 shadow-lg">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-mono font-bold text-emerald-300">{listenerCount || 581}</span>
          <span className="text-white/70">on the airwaves</span>
        </div>

        {/* Right Corner: Fullscreen Button + Admin Badge (if admin) + Glowing 3-Bars Menu Toggle Button */}
        <div className="flex items-center gap-2">
          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-black/50 backdrop-blur-xl border border-white/15 text-white/80 hover:text-white hover:bg-black/70 flex items-center justify-center transition-all active:scale-90 shadow-lg cursor-pointer"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            aria-label={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? (
              <Minimize className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            ) : (
              <Maximize className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            )}
          </button>

          {/* Admin DJ Shield Badge (Only for Admins) */}
          {isAdmin && onToggleAdminPanel && (
            <button
              onClick={onToggleAdminPanel}
              className="relative p-2 sm:p-2.5 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 rounded-full shadow-[0_0_20px_rgba(217,70,239,0.5)] hover:shadow-[0_0_30px_rgba(217,70,239,0.8)] active:scale-90 transition-all text-white border border-white/20 flex items-center justify-center cursor-pointer"
              title="Admin DJ Quick Panel"
              aria-label="Admin DJ Quick Panel"
            >
              <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          )}

          {/* 3-Bars Menu Button (Visible on Phones & PC with Constant Neon Glow) */}
          <button
            onClick={onToggleSidebar}
            className={`flex relative w-9 h-9 sm:w-10 sm:h-10 rounded-full backdrop-blur-xl border transition-all active:scale-90 shadow-lg items-center justify-center group cursor-pointer ${isSidebarOpen
              ? 'bg-pink-600/40 border-pink-500 text-white shadow-[0_0_25px_rgba(236,72,153,0.8)]'
              : 'bg-black/60 border-pink-500/70 text-white shadow-[0_0_18px_rgba(236,72,153,0.65)] ring-2 ring-pink-500/25 hover:shadow-[0_0_30px_rgba(236,72,153,0.9)] animate-pulse'
              }`}
            title={isSidebarOpen ? "Close Panel" : "Open Requests & Live Chat Panel"}
            aria-label={isSidebarOpen ? "Close Panel" : "Open Panel"}
          >
            {isSidebarOpen ? (
              <X className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-white" />
            ) : (
              <Menu className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-pink-200 group-hover:scale-110 transition-transform" />
            )}
          </button>
        </div>
      </header>

      {/* 📢 DJ Announcement - Ultra Sleek Floating Banner */}
      {pinnedBanner && (
        <div className="relative z-30 flex justify-center px-4 mt-3 pointer-events-none">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-black/85 backdrop-blur-2xl border border-pink-500/40 shadow-[0_8px_32px_rgba(236,72,153,0.35)] text-xs font-semibold text-white animate-in fade-in slide-in-from-top-3 duration-300">
            <span className="w-2 h-2 rounded-full bg-pink-400 animate-ping shrink-0" />
            <span className="truncate max-w-[280px] sm:max-w-lg text-white font-medium">{pinnedBanner.text}</span>
          </div>
        </div>
      )}

      {/* 💬 Live On-Screen Chat Stream (Centered, Vibrant & Aesthetic) */}
      {floatingChatMessages && floatingChatMessages.length > 0 && (
        <div className="absolute inset-x-4 top-[45%] -translate-y-1/2 z-30 pointer-events-none flex flex-col items-center justify-center gap-2 max-w-md mx-auto">
          {floatingChatMessages.map((msg) => (
            <div
              key={msg.id}
              className="bg-black/85 backdrop-blur-2xl border border-purple-500/40 px-4 py-2.5 rounded-2xl shadow-[0_12px_40px_rgba(0,0,0,0.9)] text-xs text-white flex items-center gap-2.5 max-w-full animate-in fade-in zoom-in-95 duration-300 pointer-events-none"
            >
              <span className="font-bold text-pink-400 shrink-0">{msg.user}:</span>
              <span className="text-white/95 truncate font-medium">{msg.text}</span>
            </div>
          ))}
        </div>
      )}

      {/* 🎨 Center Area: Clean Wallpaper + Mobile-Only Swipe-Up Affordance */}
      <main 
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        className="relative z-10 flex-1 flex flex-col justify-end items-center pb-2.5"
      >
        {/* Subtle top drag pill handle for visual affordance */}
        <div 
          data-swipe-handle
          onClick={onToggleSidebar}
          className="flex md:hidden flex-col items-center gap-1 mb-1 cursor-pointer group"
          title="Open Song Requests & Chat"
        >
          <div className="w-10 h-1 rounded-full bg-white/30 group-hover:bg-pink-400/80 transition-colors" />
        </div>

        {/* Strictly Mobile Only (Hidden on PC) with sleek aesthetic design */}
        <button
          data-swipe-handle
          onClick={onToggleSidebar}
          className="flex md:hidden items-center gap-2 px-3.5 py-1.5 rounded-full bg-black/45 hover:bg-black/70 backdrop-blur-xl border border-white/15 text-white/80 active:scale-95 shadow-[0_4px_20px_rgba(0,0,0,0.5)] transition-all cursor-pointer group"
          title="Swipe up for Chat & Requests"
          aria-label="Swipe up for Chat and Requests"
        >
          <div className="w-4 h-4 rounded-full bg-pink-500/20 flex items-center justify-center text-pink-300 group-hover:scale-110 transition-transform">
            <svg
              className="w-2.5 h-2.5 text-pink-300 animate-bounce"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M18 11V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v0" />
              <path d="M14 10V4a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v2" />
              <path d="M10 10.5V6a2 2 0 0 0-2-2v0a2 2 0 0 0-2 2v8" />
              <path d="M18 8a2 2 0 1 1 4 0v6a8 8 0 0 1-8 8h-2c-2.8 0-4.5-.86-5.99-2.34l-3.6-3.6a2 2 0 0 1 2.83-2.82L7 15" />
            </svg>
          </div>
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-white/90 group-hover:text-pink-200 transition-colors">
            Swipe up to chat & req
          </span>
        </button>
      </main>

      {/* 🎵 Bottom Floating Island Player (Streamlined Aesthetic Capsule with Glowing Accents) */}
      <footer
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchCancel}
        className="relative z-30 pb-6 sm:pb-8 px-4 flex justify-center items-center"
      >
        <div className="max-w-xl w-full bg-[#180e14]/85 backdrop-blur-3xl border border-white/20 hover:border-pink-500/30 rounded-full px-3.5 sm:px-5 py-2.5 sm:py-3 shadow-[0_20px_60px_rgba(0,0,0,0.9)] flex items-center justify-between gap-3 sm:gap-4 transition-all">

          {/* Left: Spinning Album Thumbnail + Track Title & Scrub */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Spinning Vinyl Album Art with Glow */}
            <div
              data-no-swipe
              onClick={onToggleLyrics}
              className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden shrink-0 border border-pink-400/40 shadow-[0_0_15px_rgba(236,72,153,0.3)] hover:shadow-[0_0_25px_rgba(236,72,153,0.6)] cursor-pointer group transition-all active:scale-90"
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
                      className="h-full bg-gradient-to-r from-pink-400 to-purple-400 rounded-full transition-[width] duration-250 ease-linear"
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

          {/* Right: Clean Minimal Controls (Lyrics, Play/Pause, Skip) */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">

            {/* 📝 Lyrics Button with glowing touch state */}
            <button
              onClick={onToggleLyrics}
              className="p-2 sm:p-2.5 rounded-full text-pink-300 hover:text-pink-100 hover:bg-pink-500/20 active:scale-90 hover:shadow-[0_0_15px_rgba(236,72,153,0.4)] transition-all"
              title="Toggle Live Synced Lyrics"
              aria-label="Lyrics"
            >
              <FileText className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            {/* ⏸️ / ▶️ Main White Circular Play / Pause Button with Ambient Halo */}
            <button
              onClick={onPlayPause}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-white text-black flex items-center justify-center shadow-[0_0_25px_rgba(255,255,255,0.45)] hover:shadow-[0_0_35px_rgba(255,255,255,0.7)] hover:scale-105 active:scale-90 cursor-pointer transition-all"
              title={isAdmin ? (isPlaying ? 'Pause Station (Admin)' : 'Resume Station (Admin)') : (isPlaying ? 'Pause Local Audio' : 'Tune In / Unmute Live Radio')}
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
          </div>
        </div>
      </footer>
    </div>
  );
});

PcoRadioPlayer.displayName = 'PcoRadioPlayer';

export default PcoRadioPlayer;
