import { useState, useEffect, useRef, useCallback } from 'react';
import { PcoTrack, getPcoLiveSchedule } from '../services/pcoAdmin';

export interface UsePcoRadioSyncOptions {
  onTrackChange?: (track: PcoTrack) => void;
  onTrackEnded?: () => void;
}

export interface UsePcoRadioSyncReturn {
  currentTrack: PcoTrack | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  queue: PcoTrack[];
  audioRef: React.RefObject<HTMLAudioElement>;
  playTrackImmediately: (track: PcoTrack) => void;
  playTrackNext: (track: PcoTrack) => void;
  addTrackToQueue: (track: PcoTrack) => void;
  removeFromQueue: (trackId: string) => void;
  setQueue: React.Dispatch<React.SetStateAction<PcoTrack[]>>;
  skipCurrentTrack: () => void;
  togglePlayPause: () => void;
  seek: (timeInSec: number) => void;
  handleTimeUpdate: () => void;
  handleSongEnded: () => void;
  handleAudioError: (e: any) => void;
  setCurrentTrack: (track: PcoTrack) => void;
  setIsPlaying: (playing: boolean) => void;
  setCurrentTime: (time: number) => void;
}

/**
 * High-performance, glitch-free audio synchronization hook for Campus PCO Radio (Sparx FM).
 * Replaces jarring hard seeks with imperceptible slew-rate (playbackRate) drift correction.
 */
export function usePcoRadioSync(options: UsePcoRadioSyncOptions = {}): UsePcoRadioSyncReturn {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [currentTrack, setCurrentTrackState] = useState<PcoTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [queue, setQueue] = useState<PcoTrack[]>([]);

  const currentTrackRef = useRef<PcoTrack | null>(null);
  const queueRef = useRef<PcoTrack[]>([]);
  const isPlayingRef = useRef<boolean>(true);
  const driftIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef<boolean>(false);

  // Keep refs in sync with state for zero-stale closures
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const setCurrentTrack = useCallback((track: PcoTrack) => {
    setCurrentTrackState(track);
    currentTrackRef.current = track;
    options.onTrackChange?.(track);
  }, [options]);

  // 1. Initial schedule calculation on mount
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const sched = getPcoLiveSchedule();
    setCurrentTrack(sched.currentTrack);
    setCurrentTime(sched.offsetSec);
    setIsPlaying(true);

    if (audioRef.current) {
      audioRef.current.currentTime = sched.offsetSec;
      audioRef.current.play().catch(() => {
        // Autoplay policy fallback: user interaction will resume
        setIsPlaying(false);
      });
    }
  }, [setCurrentTrack]);

  // 2. High-Frequency Micro-Drift Correction using Slew Rate
  // Checks every 5 seconds instead of 30 seconds to prevent drift build-up.
  useEffect(() => {
    driftIntervalRef.current = setInterval(() => {
      const audio = audioRef.current;
      if (!audio || audio.paused || queueRef.current.length > 0) return;

      const sched = getPcoLiveSchedule();
      const activeTrack = currentTrackRef.current;

      // Track rollover check
      if (!activeTrack || activeTrack.id !== sched.currentTrack.id) {
        setCurrentTrack(sched.currentTrack);
        audio.currentTime = sched.offsetSec;
        setCurrentTime(sched.offsetSec);
        audio.playbackRate = 1.0;
        return;
      }

      // Calculate drift: difference between actual playback position and deterministic server time
      const actualTime = audio.currentTime;
      const expectedTime = sched.offsetSec;
      const drift = expectedTime - actualTime; // Positive: we are lagging behind. Negative: we are ahead.

      if (Math.abs(drift) < 0.35) {
        // Within imperceptible tolerance (<350ms): standard 1.0x playback speed
        if (audio.playbackRate !== 1.0) {
          audio.playbackRate = 1.0;
        }
      } else if (drift > 0.35 && drift <= 2.5) {
        // Lagging slightly behind: speed up imperceptibly to catch up (pitch-corrected by browser)
        audio.playbackRate = 1.03;
      } else if (drift < -0.35 && drift >= -2.5) {
        // Running slightly ahead: slow down imperceptibly to let time catch up
        audio.playbackRate = 0.97;
      } else if (Math.abs(drift) > 2.5) {
        // Extreme drift (>2.5s) e.g., device sleep, tab backgrounding: smooth hard seek
        audio.currentTime = Math.min(expectedTime, audio.duration || expectedTime);
        audio.playbackRate = 1.0;
        setCurrentTime(audio.currentTime);
      }
    }, 5000);

    return () => {
      if (driftIntervalRef.current) {
        clearInterval(driftIntervalRef.current);
        driftIntervalRef.current = null;
      }
    };
  }, [setCurrentTrack]);

  // 3. Audio Event Handlers
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleSongEnded = useCallback(() => {
    // If there is an item in the queue, play it next
    if (queueRef.current.length > 0) {
      const [nextTrack, ...remainingQueue] = queueRef.current;
      setQueue(remainingQueue);
      setCurrentTrack(nextTrack);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch(() => {});
      }
    } else {
      // Deterministically load the next synchronized track from the schedule
      const sched = getPcoLiveSchedule();
      setCurrentTrack(sched.currentTrack);
      if (audioRef.current) {
        audioRef.current.currentTime = sched.offsetSec;
        audioRef.current.play().catch(() => {});
      }
    }
    options.onTrackEnded?.();
  }, [setCurrentTrack, options]);

  const handleAudioError = useCallback((e: any) => {
    console.warn('[PCO Radio] Audio playback error:', e);
    // On playback error (e.g., dead CDN URL), advance to next scheduled track
    const sched = getPcoLiveSchedule();
    setCurrentTrack(sched.currentTrack);
  }, [setCurrentTrack]);

  // 4. Actions
  const playTrackImmediately = useCallback((track: PcoTrack) => {
    setCurrentTrack(track);
    setIsPlaying(true);
    if (audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.playbackRate = 1.0;
      audioRef.current.play().catch(() => {});
    }
  }, [setCurrentTrack]);

  const playTrackNext = useCallback((track: PcoTrack) => {
    setQueue(prev => [track, ...prev.filter(t => t.id !== track.id)]);
  }, []);

  const addTrackToQueue = useCallback((track: PcoTrack) => {
    setQueue(prev => [...prev.filter(t => t.id !== track.id), track]);
  }, []);

  const removeFromQueue = useCallback((trackId: string) => {
    setQueue(prev => prev.filter(t => t.id !== trackId));
  }, []);

  const skipCurrentTrack = useCallback(() => {
    handleSongEnded();
  }, [handleSongEnded]);

  const togglePlayPause = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      audio.play().then(() => {
        setIsPlaying(true);
      }).catch(err => {
        console.warn('[PCO Radio] Play error:', err);
      });
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const seek = useCallback((timeInSec: number) => {
    if (audioRef.current) {
      audioRef.current.currentTime = timeInSec;
      setCurrentTime(timeInSec);
    }
  }, []);

  // Duration helper
  const duration = currentTrack ? (parseInt(currentTrack.duration, 10) || 240) : 240;

  return {
    currentTrack,
    currentTime,
    duration,
    isPlaying,
    queue,
    audioRef,
    playTrackImmediately,
    playTrackNext,
    addTrackToQueue,
    removeFromQueue,
    setQueue,
    skipCurrentTrack,
    togglePlayPause,
    seek,
    handleTimeUpdate,
    handleSongEnded,
    handleAudioError,
    setCurrentTrack,
    setIsPlaying,
    setCurrentTime
  };
}
