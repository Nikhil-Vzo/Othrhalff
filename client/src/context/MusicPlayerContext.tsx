"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { PcoTrack, PcoRadioMode } from '../services/pcoAdmin';
import { usePcoRadioSync } from '../hooks/usePcoRadioSync';

export interface MusicPlayerContextType {
  currentTrack: PcoTrack | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  mode: PcoRadioMode;
  queue: PcoTrack[];
  isAdmin: boolean;
  setIsAdmin: (val: boolean) => void;
  isMusicActive: boolean;
  isDismissed: boolean;
  activeRoomUrl: string;
  setActiveRoomUrl: (url: string) => void;
  startMusic: () => void;
  dismissMiniPlayer: () => void;
  restoreMusicPlayer: () => void;
  togglePlayPause: () => void;
  seek: (time: number) => void;
  skipCurrentTrack: () => Promise<void>;
  playTrackImmediately: (track: PcoTrack, startedAt?: number) => Promise<void>;
  playTrackNext: (track: PcoTrack) => Promise<void>;
  addTrackToQueue: (track: PcoTrack) => Promise<void>;
  removeFromQueue: (trackId: string) => Promise<void>;
  returnToAuto: () => Promise<void>;
  setQueue: React.Dispatch<React.SetStateAction<PcoTrack[]>>;
  setCurrentTrack: (track: PcoTrack) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
}

const MusicPlayerContext = createContext<MusicPlayerContextType | null>(null);

export const MusicPlayerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const pathname = usePathname() || '';
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [isMusicActive, setIsMusicActive] = useState<boolean>(false);
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [activeRoomUrl, setActiveRoomUrl] = useState<string>('/sparx/music?room=Campus_PCO_247');

  const isEnabled = isMusicActive || pathname.startsWith('/sparx/music');

  // Persistent authoritative audio synchronization hook
  const {
    currentTrack,
    currentTime,
    duration,
    isPlaying,
    mode,
    queue,
    audioRef,
    playTrackImmediately,
    playTrackNext,
    addTrackToQueue,
    removeFromQueue,
    returnToAuto,
    skipCurrentTrack,
    togglePlayPause: baseTogglePlayPause,
    seek,
    handleTimeUpdate,
    handleSongEnded,
    handleAudioError,
    setCurrentTrack,
    setIsPlaying,
    setCurrentTime,
    setQueue
  } = usePcoRadioSync({ roomId: 'Campus_PCO_247', isAdmin, enabled: isEnabled });

  // Automatically activate music session when user navigates to /sparx/music
  useEffect(() => {
    if (pathname.startsWith('/sparx/music')) {
      setIsMusicActive(true);
      setIsDismissed(false);
      if (pathname.includes('room=')) {
        setActiveRoomUrl(pathname);
      }
    }
  }, [pathname]);

  const startMusic = useCallback(() => {
    setIsMusicActive(true);
    setIsDismissed(false);
    if (!isPlaying) {
      baseTogglePlayPause();
    }
  }, [isPlaying, baseTogglePlayPause]);

  const togglePlayPause = useCallback(() => {
    if (!isMusicActive) {
      setIsMusicActive(true);
      setIsDismissed(false);
    }
    baseTogglePlayPause();
  }, [isMusicActive, baseTogglePlayPause]);

  // When user clicks the cross (X) button on the floating mini-player popup
  const dismissMiniPlayer = useCallback(() => {
    setIsDismissed(true);
    setIsMusicActive(false);
    if (audioRef.current) {
      try {
        audioRef.current.pause();
      } catch (_) {}
    }
    setIsPlaying(false);
  }, [audioRef, setIsPlaying]);

  const restoreMusicPlayer = useCallback(() => {
    setIsDismissed(false);
    setIsMusicActive(true);
  }, []);

  return (
    <MusicPlayerContext.Provider
      value={{
        currentTrack,
        currentTime,
        duration,
        isPlaying,
        mode,
        queue,
        isAdmin,
        setIsAdmin,
        isMusicActive,
        isDismissed,
        activeRoomUrl,
        setActiveRoomUrl,
        startMusic,
        dismissMiniPlayer,
        restoreMusicPlayer,
        togglePlayPause,
        seek,
        skipCurrentTrack,
        playTrackImmediately,
        playTrackNext,
        addTrackToQueue,
        removeFromQueue,
        returnToAuto,
        setQueue,
        setCurrentTrack,
        setIsPlaying,
        setCurrentTime
      }}
    >
      {/* 🎵 Global Persistent Native Audio Element (stays alive across all route transitions) */}
      <audio
        ref={audioRef}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleSongEnded}
        onError={handleAudioError}
      />
      {children}
    </MusicPlayerContext.Provider>
  );
};

export const useMusicPlayer = () => {
  const context = useContext(MusicPlayerContext);
  if (!context) {
    throw new Error('useMusicPlayer must be used within a MusicPlayerProvider');
  }
  return context;
};
