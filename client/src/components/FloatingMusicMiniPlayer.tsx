"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { Play, Pause, X, Music, Radio, Maximize2, GripVertical } from 'lucide-react';

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

  const cardRef = useRef<HTMLElement>(null);
  const [pos, setPos] = useState<{ x: number; y: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Drag tracking refs
  const dragStartRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const hasMovedRef = useRef<boolean>(false);
  const justDraggedRef = useRef<boolean>(false);

  // Keep within viewport bounds on window resize
  useEffect(() => {
    const handleResize = () => {
      setPos(prev => {
        if (!prev || !cardRef.current) return prev;
        const width = cardRef.current.offsetWidth || 320;
        const height = cardRef.current.offsetHeight || 68;
        const maxX = Math.max(12, window.innerWidth - width - 12);
        const maxY = Math.max(12, window.innerHeight - height - 12);
        return {
          x: Math.max(12, Math.min(prev.x, maxX)),
          y: Math.max(12, Math.min(prev.y, maxY)),
        };
      });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handlePointerDown = (e: React.PointerEvent<HTMLElement>) => {
    // Only primary mouse button or touch
    if (e.button !== 0 && e.pointerType === 'mouse') return;

    const card = cardRef.current;
    if (!card) return;

    const rect = card.getBoundingClientRect();
    const currentX = pos ? pos.x : rect.left;
    const currentY = pos ? pos.y : rect.top;

    dragStartRef.current = {
      pointerId: e.pointerId,
      startX: e.clientX,
      startY: e.clientY,
      originX: currentX,
      originY: currentY,
    };
    hasMovedRef.current = false;

    try {
      card.setPointerCapture(e.pointerId);
    } catch (_) {}
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragStartRef.current || dragStartRef.current.pointerId !== e.pointerId) return;

    const dx = e.clientX - dragStartRef.current.startX;
    const dy = e.clientY - dragStartRef.current.startY;

    // Threshold to distinguish click vs drag
    if (!hasMovedRef.current && Math.hypot(dx, dy) > 4) {
      hasMovedRef.current = true;
      setIsDragging(true);
    }

    if (hasMovedRef.current) {
      const card = cardRef.current;
      const width = card?.offsetWidth || 320;
      const height = card?.offsetHeight || 68;

      const newX = dragStartRef.current.originX + dx;
      const newY = dragStartRef.current.originY + dy;

      const maxX = Math.max(12, window.innerWidth - width - 12);
      const maxY = Math.max(12, window.innerHeight - height - 12);

      const clampedX = Math.max(12, Math.min(newX, maxX));
      const clampedY = Math.max(12, Math.min(newY, maxY));

      setPos({ x: clampedX, y: clampedY });
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLElement>) => {
    if (!dragStartRef.current || dragStartRef.current.pointerId !== e.pointerId) return;

    const card = cardRef.current;
    if (card) {
      try {
        card.releasePointerCapture(e.pointerId);
      } catch (_) {}
    }

    if (hasMovedRef.current) {
      justDraggedRef.current = true;
      setTimeout(() => {
        justDraggedRef.current = false;
      }, 120);
    }

    dragStartRef.current = null;
    hasMovedRef.current = false;
    setIsDragging(false);
  };

  const handlePointerCancel = (e: React.PointerEvent<HTMLElement>) => {
    dragStartRef.current = null;
    hasMovedRef.current = false;
    setIsDragging(false);
  };

  const handleCardClick = () => {
    // If user was dragging, don't trigger navigation
    if (justDraggedRef.current) return;
    router.push(activeRoomUrl || '/sparx/music?room=Campus_PCO_247');
  };

  const handleCrossClick = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    dismissMiniPlayer();
  };

  const handlePlayPauseClick = (e: React.MouseEvent | React.PointerEvent) => {
    e.stopPropagation();
    togglePlayPause();
  };

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

  const customStyle: React.CSSProperties = pos
    ? {
        position: 'fixed',
        left: `${pos.x}px`,
        top: `${pos.y}px`,
        right: 'auto',
        bottom: 'auto',
        touchAction: 'none',
      }
    : {
        touchAction: 'none',
      };

  return (
    <aside
      ref={cardRef}
      aria-label="Background music player"
      onClick={handleCardClick}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
      style={customStyle}
      className={`fixed z-50 group select-none ${
        !pos ? 'bottom-20 right-3 left-3 sm:left-auto sm:right-6 sm:bottom-6 sm:w-84' : 'w-[calc(100vw-24px)] sm:w-84'
      } ${isDragging ? 'cursor-grabbing scale-102 shadow-2xl' : 'cursor-grab'} animate-in fade-in slide-in-from-bottom-5 duration-200`}
    >
      <div className="relative bg-[#0c0c10]/95 backdrop-blur-xl border border-white/10 hover:border-pink-500/40 rounded-2xl p-2.5 flex items-center justify-between gap-2.5 shadow-[0_12px_36px_rgba(0,0,0,0.85)] transition-shadow duration-200 hover:shadow-[0_12px_36px_rgba(255,0,127,0.25)]">
        
        {/* Glow ambient background */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500/20 to-purple-600/20 rounded-2xl blur opacity-30 group-hover:opacity-60 transition duration-300 pointer-events-none" />

        {/* Drag Grip Handle */}
        <div
          title="Drag to reposition"
          className="text-gray-500 group-hover:text-gray-300 transition-colors shrink-0 -mr-1 py-1"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>

        {/* LEFT: Thumbnail + Bouncing Equalizer Bars */}
        <div className="relative shrink-0 flex items-center justify-center">
          {currentTrack.image ? (
            <img
              src={currentTrack.image}
              alt={currentTrack.song}
              draggable={false}
              className={`w-12 h-12 rounded-xl object-cover shadow-md border border-white/10 pointer-events-none ${isPlaying ? 'brightness-105' : 'brightness-75'}`}
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-purple-900 to-pink-900 flex items-center justify-center border border-white/10 shadow-md">
              <Music className="w-5 h-5 text-pink-400" />
            </div>
          )}

          {/* Equalizer animation badge */}
          {isPlaying && (
            <div className="absolute -bottom-1 -right-1 bg-black/80 backdrop-blur-sm px-1 py-0.5 rounded-md border border-white/10 flex items-end gap-[2px] h-3.5 pointer-events-none">
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
        <div
          className="flex items-center gap-1 shrink-0"
          onPointerDown={e => e.stopPropagation()}
        >
          {/* Play/Pause Button */}
          <button
            onClick={handlePlayPauseClick}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-md cursor-pointer"
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
            className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors hidden sm:flex cursor-pointer"
            title="Open Full Player"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Dismiss Cross (X) Button */}
          <button
            onClick={handleCrossClick}
            aria-label="Close music player"
            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-red-500/10 active:scale-90 rounded-full transition-colors ml-0.5 cursor-pointer"
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
