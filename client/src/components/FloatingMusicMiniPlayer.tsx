"use client";

import React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { Play, Pause, X, Music, Radio, Maximize2 } from 'lucide-react';

export const FloatingMusicMiniPlayer: React.FC = () => {
  const pathname = usePathname() || '';
  const router = useRouter();
  const {
    currentTrack,
    isPlaying,
    isMusicActive,
    isDismissed,
    activeRoomUrl,
    togglePlayPause,
    dismissMiniPlayer
  } = useMusicPlayer();

  // Hide popup if:
  // 1. User is already on the full music page (/sparx/music)
  // 2. Music hasn't been started or is deactivated
  // 3. User clicked the cross (X) button to dismiss the popup
  // 4. No track is loaded
  if (
    pathname.startsWith('/sparx/music') ||
    !isMusicActive ||
    isDismissed ||
    !currentTrack
  ) {
    return null;
  }

  const handleCardClick = () => {
    router.push(activeRoomUrl || '/sparx/music?room=Campus_PCO_247');
  };

  const handleCrossClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    dismissMiniPlayer();
  };

  const handlePlayPauseClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    togglePlayPause();
  };

  return (
    <aside
      aria-label="Background music player"
      onClick={handleCardClick}
      className="fixed bottom-20 right-3 left-3 sm:left-auto sm:right-6 sm:bottom-6 sm:w-84 z-50 group cursor-pointer animate-in fade-in slide-in-from-bottom-5 duration-300"
    >
      <div className="relative bg-[#0c0c10]/95 backdrop-blur-xl border border-white/10 hover:border-pink-500/40 rounded-2xl p-2.5 flex items-center justify-between gap-3 shadow-[0_12px_36px_rgba(0,0,0,0.8)] transition-all duration-200 hover:shadow-[0_12px_36px_rgba(255,0,127,0.2)]">
        
        {/* Glow ambient background */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/20 to-purple-600/20 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300 pointer-events-none" />

        {/* LEFT: Thumbnail + Bouncing Equalizer Bars */}
        <div className="relative shrink-0 flex items-center justify-center">
          {currentTrack.image ? (
            <img
              src={currentTrack.image}
              alt={currentTrack.song}
              className={`w-12 h-12 rounded-xl object-cover shadow-md border border-white/10 ${isPlaying ? 'brightness-105' : 'brightness-75'}`}
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-900 to-pink-900 flex items-center justify-center border border-white/10 shadow-md">
              <Music className="w-5 h-5 text-pink-400" />
            </div>
          )}

          {/* Equalizer animation badge */}
          {isPlaying && (
            <div className="absolute -bottom-1 -right-1 bg-black/80 backdrop-blur-sm px-1 py-0.5 rounded-md border border-white/10 flex items-end gap-[2px] h-3.5">
              <span className="w-0.5 bg-pink-500 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-2" />
              <span className="w-0.5 bg-purple-400 rounded-full animate-[pulse_0.9s_ease-in-out_infinite] h-3" />
              <span className="w-0.5 bg-pink-400 rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-1.5" />
            </div>
          )}
        </div>

        {/* CENTER: Track Information */}
        <div className="flex-1 min-w-0 pr-1">
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="flex h-1.5 w-1.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-pink-500"></span>
            </span>
            <span className="text-[10px] font-bold tracking-wider uppercase text-pink-400 flex items-center gap-1">
              <Radio className="w-2.5 h-2.5 inline" /> Sparx FM
            </span>
          </div>
          <h4 className="text-xs font-bold text-white truncate leading-tight group-hover:text-pink-200 transition-colors">
            {currentTrack.song}
          </h4>
          <p className="text-[11px] text-gray-400 truncate leading-tight mt-0.5">
            {currentTrack.singers}
          </p>
        </div>

        {/* RIGHT: Controls (Play/Pause, Expand, and Dismiss Cross Button) */}
        <div className="flex items-center gap-1 shrink-0">
          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPauseClick}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-md"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Expand to Full View Icon */}
          <button
            onClick={handleCardClick}
            aria-label="Expand to full screen"
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors hidden sm:flex"
            title="Open Full Player"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Dismiss Cross (X) Button */}
          <button
            onClick={handleCrossClick}
            aria-label="Close music player"
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 active:scale-90 rounded-full transition-colors ml-0.5"
            title="Stop & Close Player"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
};
export default FloatingMusicMiniPlayer;
