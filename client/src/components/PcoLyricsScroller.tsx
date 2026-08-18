"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { X, Loader } from 'lucide-react';
import { PcoTrack } from '../services/pcoAdmin';

export interface LyricLine {
  time: number;
  text: string;
}

interface PcoLyricsScrollerProps {
  currentTrack: PcoTrack | null;
  currentTime: number;
  isOpen: boolean;
  onClose: () => void;
  onSeek?: (time: number) => void;
  canSeek?: boolean;
}

/**
 * High-Performance Hardware-Accelerated 60fps Lyrics Viewport.
 * Optimized for mobile GPUs by eliminating backdrop-blur overhead and using 2D/3D hardware transforms.
 */
export const PcoLyricsScroller: React.FC<PcoLyricsScrollerProps> = React.memo(({
  currentTrack,
  currentTime,
  isOpen,
  onClose,
  onSeek,
  canSeek = false
}) => {
  const [lyricsData, setLyricsData] = useState<LyricLine[] | null>(null);
  const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const lastActiveIndexRef = useRef<number>(-1);

  // 1. Fetch Lyrics on track change
  useEffect(() => {
    if (!currentTrack) {
      setLyricsData(null);
      setPlainLyrics(null);
      return;
    }

    let isMounted = true;
    const abortController = new AbortController();

    const fetchLyrics = async () => {
      setIsLoading(true);
      try {
        const cleanTrackId = currentTrack.id.replace('pco-rom-', '');
        const res = await fetch(`https://saavn.dev/api/lyrics?id=${cleanTrackId}`, {
          signal: abortController.signal
        });
        const json = await res.json();

        if (!isMounted) return;

        if (json?.data?.lyrics) {
          const raw = json.data.lyrics;
          // Check if synced timestamp format [00:12.34]
          if (raw.includes('[') && raw.includes(']')) {
            const lines: LyricLine[] = [];
            const regex = /\[(\d+):(\d+(?:\.\d+)?)\](.*)/g;
            let match;
            while ((match = regex.exec(raw)) !== null) {
              const min = parseInt(match[1], 10);
              const sec = parseFloat(match[2]);
              const text = match[3].trim();
              if (text) {
                lines.push({ time: min * 60 + sec, text });
              }
            }
            if (lines.length > 0) {
              setLyricsData(lines);
              setPlainLyrics(null);
              setIsLoading(false);
              return;
            }
          }
          setPlainLyrics(raw);
          setLyricsData(null);
        } else {
          setPlainLyrics('Enjoy the music! Lyrics not available for this track.');
          setLyricsData(null);
        }
      } catch (err: any) {
        if (err.name !== 'AbortError' && isMounted) {
          setPlainLyrics('Lyrics unavailable.');
          setLyricsData(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchLyrics();

    return () => {
      isMounted = false;
      abortController.abort();
    };
  }, [currentTrack?.id]);

  // 2. Active Lyric Line Index Calculation
  const activeIndex = useMemo(() => {
    if (!lyricsData || lyricsData.length === 0) return -1;
    let index = -1;
    for (let i = 0; i < lyricsData.length; i++) {
      if (currentTime >= lyricsData[i].time) {
        index = i;
      } else {
        break;
      }
    }
    return index;
  }, [lyricsData, currentTime]);

  // 3. Smooth Auto-Scroll on Line Change
  useEffect(() => {
    if (activeIndex === -1 || activeIndex === lastActiveIndexRef.current || !isOpen) return;
    lastActiveIndexRef.current = activeIndex;

    const el = document.getElementById(`pco-lyric-${activeIndex}`);
    if (el && scrollContainerRef.current) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeIndex, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 bg-[#06030c] flex flex-col items-center justify-start overflow-hidden select-none animate-in fade-in duration-200">
      {/* Pinned Close Button */}
      <button
        onClick={onClose}
        className="fixed top-4 right-4 sm:top-6 sm:right-6 p-3 bg-white/10 hover:bg-white/20 border border-white/15 rounded-full text-white z-50 transition-all active:scale-95 shadow-2xl cursor-pointer"
        title="Close Lyrics"
        aria-label="Close Lyrics"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Atmospheric Ambient Glow Backdrop (GPU accelerated without backdrop-blur) */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-pink-600/15 rounded-full blur-3xl pointer-events-none transform-gpu" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-purple-600/15 rounded-full blur-3xl pointer-events-none transform-gpu" />

      {/* Header Info */}
      <div className="w-full max-w-2xl px-6 pt-6 pb-2 text-left z-10">
        <span className="text-[10px] font-black uppercase tracking-widest text-pink-400 font-mono">
          Campus PCO • Live Lyrics
        </span>
        <h2 className="text-xl font-bold text-white truncate">{currentTrack?.song || 'Unknown Song'}</h2>
        <p className="text-xs text-gray-400 truncate">{currentTrack?.singers || 'Artist'}</p>
      </div>

      {/* Main Scrolling Container */}
      <div
        ref={scrollContainerRef}
        className="w-full flex-1 overflow-y-auto px-6 sm:px-12 py-24 custom-scrollbar scroll-smooth relative z-10 flex flex-col items-start"
      >
        {isLoading ? (
          <div className="flex-1 flex flex-col items-center justify-center h-full w-full gap-3 py-24">
            <Loader className="w-8 h-8 text-pink-500 animate-spin" />
            <span className="text-xs text-white/60 font-medium">Syncing live lyrics...</span>
          </div>
        ) : lyricsData && lyricsData.length > 0 ? (
          <div className="w-full max-w-2xl mx-auto space-y-6 py-12">
            {lyricsData.map((line, idx) => {
              const isActive = idx === activeIndex;
              const isPast = idx < activeIndex;

              return (
                <div
                  key={idx}
                  id={`pco-lyric-${idx}`}
                  onClick={() => {
                    if (canSeek && onSeek) {
                      onSeek(line.time);
                    }
                  }}
                  className={`relative py-1 transition-all duration-300 transform-gpu ${
                    canSeek ? 'cursor-pointer' : ''
                  }`}
                  style={{ willChange: 'transform, opacity' }}
                >
                  <p
                    className={`leading-relaxed transition-all duration-300 font-bold ${
                      isActive
                        ? 'text-2xl sm:text-4xl lg:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-400 via-rose-300 to-amber-200 drop-shadow-[0_0_25px_rgba(236,72,153,0.6)] scale-[1.03] origin-left'
                        : isPast
                        ? 'text-lg sm:text-2xl text-gray-600 opacity-40 hover:opacity-75 hover:text-gray-300'
                        : 'text-lg sm:text-2xl text-gray-400 opacity-60 hover:opacity-90 hover:text-white'
                    }`}
                  >
                    {line.text}
                  </p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="w-full max-w-xl mx-auto py-24 text-center">
            <p className="text-base sm:text-lg text-purple-200 font-medium whitespace-pre-wrap leading-relaxed">
              {plainLyrics || 'Enjoy the music! Lyrics not available for this track.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
});

PcoLyricsScroller.displayName = 'PcoLyricsScroller';
