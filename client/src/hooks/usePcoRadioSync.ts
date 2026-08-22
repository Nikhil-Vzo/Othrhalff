import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import {
  PcoTrack,
  PcoRadioMode,
  PcoRadioState,
  getPcoLiveSchedule,
  fetchPcoRadioState,
  setManualRadioOverride,
  returnToAutoRadioSchedule,
  updateRadioQueue,
  getServerTimeMs
} from '../services/pcoAdmin';
import { curatedRomanticTracks } from '../data/pcoRomanticTracks';

export interface UsePcoRadioSyncOptions {
  onTrackChange?: (track: PcoTrack) => void;
  onTrackEnded?: () => void;
  roomId?: string;
  isAdmin?: boolean;
}

export interface UsePcoRadioSyncReturn {
  currentTrack: PcoTrack | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  mode: PcoRadioMode;
  queue: PcoTrack[];
  audioRef: React.RefObject<HTMLAudioElement>;
  playTrackImmediately: (track: PcoTrack) => Promise<void>;
  playTrackNext: (track: PcoTrack) => Promise<void>;
  addTrackToQueue: (track: PcoTrack) => Promise<void>;
  removeFromQueue: (trackId: string) => Promise<void>;
  returnToAuto: () => Promise<void>;
  setQueue: React.Dispatch<React.SetStateAction<PcoTrack[]>>;
  skipCurrentTrack: () => Promise<void>;
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
 * High-performance, authoritative audio synchronization hook for Campus PCO Radio (Sparx FM).
 * Features:
 * 1. Authoritative DB State: Late joiners and reconnected users sync to the official live track.
 * 2. Admin-Only Mutator: Prevents 500-listener DB stampede when a song ends.
 * 3. iOS Safari / Mobile Background Watchdog: Recovers playback even if mobile power management suspends onended.
 * 4. Micro-Drift Slew Rate: 5-second interval imperceptible speed adjustment (1.03x / 0.97x) with pitch correction.
 */
export function usePcoRadioSync(options: UsePcoRadioSyncOptions = {}) {
  const roomId = options.roomId || 'Campus_PCO_247';
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // STABLE OPTIONS REF: keeps callbacks/effects from churning every render
  const optionsRef = useRef(options);
  useEffect(() => {
    optionsRef.current = options;
  });

  const [currentTrack, setCurrentTrackState] = useState<PcoTrack | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [mode, setMode] = useState<PcoRadioMode>('auto');
  const [queue, setQueue] = useState<PcoTrack[]>([]);

  const currentTrackRef = useRef<PcoTrack | null>(null);
  const modeRef = useRef<PcoRadioMode>('auto');
  const startedAtMsRef = useRef<number>(0);
  const queueRef = useRef<PcoTrack[]>([]);
  const isPlayingRef = useRef<boolean>(true);
  const isAdminRef = useRef<boolean>(!!options.isAdmin);
  const isAdvancingRef = useRef<boolean>(false);
  const driftIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasInitializedRef = useRef<boolean>(false);
  const audioReadyListenerRef = useRef<(() => void) | null>(null);

  // Synchronize refs with state
  useEffect(() => {
    isAdminRef.current = !!options.isAdmin;
  }, [options.isAdmin]);

  // Synchronize refs with state
  useEffect(() => {
    currentTrackRef.current = currentTrack;
  }, [currentTrack]);

  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  useEffect(() => {
    queueRef.current = queue;
  }, [queue]);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const setCurrentTrack = useCallback((track: PcoTrack) => {
    setCurrentTrackState(track);
    currentTrackRef.current = track;
    optionsRef.current.onTrackChange?.(track);
  }, []);

  const ensurePreservesPitch = useCallback((audio: HTMLAudioElement | null) => {
    if (!audio) return;
    if ('preservesPitch' in audio) {
      (audio as any).preservesPitch = true;
    } else if ('mozPreservesPitch' in audio) {
      (audio as any).mozPreservesPitch = true;
    } else if ('webkitPreservesPitch' in audio) {
      (audio as any).webkitPreservesPitch = true;
    }
  }, []);

  // Load deterministic auto track helper with buffer readiness check
  const loadAutoScheduleTrack = useCallback((seekOffset?: number) => {
    const sched = getPcoLiveSchedule();
    setMode('auto');
    modeRef.current = 'auto';
    setCurrentTrack(sched.currentTrack);
    const targetOffset = seekOffset !== undefined ? seekOffset : sched.offsetSec;
    setCurrentTime(targetOffset);

    if (audioRef.current) {
      const audio = audioRef.current;
      ensurePreservesPitch(audio);

      // Clean up ghost listeners from previous rapid track changes
      if (audioReadyListenerRef.current) {
        audio.removeEventListener('canplay', audioReadyListenerRef.current);
        audioReadyListenerRef.current = null;
      }

      if (audio.src !== sched.currentTrack.media_url && !audio.src.endsWith(sched.currentTrack.media_url)) {
        audio.src = sched.currentTrack.media_url;
        audio.load();
      }

      const onReady = () => {
        audio.currentTime = targetOffset;
        audio.playbackRate = 1.0;
        audio.play().catch(() => {
          setIsPlaying(false);
        });
        audio.removeEventListener('canplay', onReady);
        audioReadyListenerRef.current = null;
      };

      if (audio.readyState >= 3) {
        onReady();
      } else {
        audioReadyListenerRef.current = onReady;
        audio.addEventListener('canplay', onReady);
      }
    }
  }, [setCurrentTrack, ensurePreservesPitch]);

  // 1. Initial State Hydration on Mount (Fetch authoritative DB state or fallback to deterministic auto)
  useEffect(() => {
    if (hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const hydrateRadioState = async () => {
      const dbState = await fetchPcoRadioState(roomId);

      if (dbState && dbState.mode === 'manual' && dbState.current_track) {
        const dur = parseInt(dbState.current_track.duration, 10) || 240;
        const elapsedSec = Math.max(0, (Date.now() - dbState.started_at_ms) / 1000);

        if (elapsedSec < dur) {
          // Manual track is actively playing
          setMode('manual');
          modeRef.current = 'manual';
          startedAtMsRef.current = dbState.started_at_ms;
          setCurrentTrack(dbState.current_track);
          setCurrentTime(elapsedSec);
          setQueue(dbState.queue || []);
          setIsPlaying(!dbState.paused);

          if (audioRef.current) {
            audioRef.current.currentTime = elapsedSec;
            if (!dbState.paused) {
              audioRef.current.play().catch(() => setIsPlaying(false));
            }
          }
          return;
        } else if (dbState.queue && dbState.queue.length > 0) {
          // Manual track finished, but queue has items
          const [nextTrack, ...remainingQueue] = dbState.queue;
          setMode('manual');
          modeRef.current = 'manual';
          startedAtMsRef.current = Date.now();
          setCurrentTrack(nextTrack);
          setCurrentTime(0);
          setQueue(remainingQueue);
          setIsPlaying(true);

          if (audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(() => setIsPlaying(false));
          }
          return;
        }
      }

      // Default: Fallback to 24/7 deterministic auto schedule
      loadAutoScheduleTrack();
    };

    hydrateRadioState();
  }, [roomId, setCurrentTrack, loadAutoScheduleTrack]);

  // 2. Realtime Subscriptions (Postgres Changes & Broadcast Events)
  // Single shared applier so postgres_changes + broadcast stay in lockstep (DRY)
  const applyRadioState = useCallback((nextState: PcoRadioState | null) => {
    if (!nextState) return;

    if (nextState.mode === 'manual' && nextState.current_track) {
      const dur = parseInt(nextState.current_track.duration, 10) || 240;
      const elapsedSec = Math.max(0, (Date.now() - Number(nextState.started_at_ms)) / 1000);

      if (elapsedSec < dur) {
        setMode('manual');
        modeRef.current = 'manual';
        startedAtMsRef.current = Number(nextState.started_at_ms);
        setCurrentTrack(nextState.current_track);
        setCurrentTime(elapsedSec);
        setQueue(Array.isArray(nextState.queue) ? nextState.queue : []);
        setIsPlaying(!nextState.paused);

        if (audioRef.current) {
          const audio = audioRef.current;
          ensurePreservesPitch(audio);
          if (audioReadyListenerRef.current) {
            audio.removeEventListener('canplay', audioReadyListenerRef.current);
            audioReadyListenerRef.current = null;
          }
          if (audio.src !== nextState.current_track.media_url && !audio.src.endsWith(nextState.current_track.media_url)) {
            audio.src = nextState.current_track.media_url;
            audio.load();
          }
          audio.currentTime = elapsedSec;
          if (!nextState.paused) {
            audio.play().catch(() => {});
          } else {
            audio.pause();
          }
        }
      }
    } else if (nextState.mode === 'auto') {
      setMode('auto');
      modeRef.current = 'auto';
      setQueue(Array.isArray(nextState.queue) ? nextState.queue : []);
      loadAutoScheduleTrack();
    }
  }, [setCurrentTrack, loadAutoScheduleTrack, ensurePreservesPitch]);

  useEffect(() => {
    if (!supabase) return;

    const channel = supabase.channel(`pco_state_${roomId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'pco_radio_state',
        filter: `room_id=eq.${roomId}`
      }, (payload: any) => {
        applyRadioState(payload.new as PcoRadioState);
      })
      .on('broadcast', { event: 'PCO_STATE_UPDATED' }, ({ payload }) => {
        applyRadioState(payload as PcoRadioState);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [roomId, applyRadioState]);

  // Centralized Track Advancement (Admin mutates DB, Student passively syncs)
  const handleTrackEnd = useCallback(async () => {
    if (isAdvancingRef.current) return;
    isAdvancingRef.current = true;

    try {
      if (modeRef.current === 'manual') {
        if (isAdminRef.current) {
          // CRITICAL: Only authorized Admin DJs mutate the authoritative database queue!
          // This completely prevents the 500-listener DB stampede.
          if (queueRef.current.length > 0) {
            const [nextTrack, ...remainingQueue] = queueRef.current;
            await setManualRadioOverride(nextTrack, remainingQueue, roomId);
          } else {
            await returnToAutoRadioSchedule(roomId);
          }
        } else {
          // Student listener: NEVER mutate the DB.
          // Fetch current state to sync or smoothly fallback to 24/7 deterministic auto schedule
          const dbState = await fetchPcoRadioState(roomId);
          if (dbState && dbState.mode === 'manual' && dbState.current_track) {
            const dur = parseInt(dbState.current_track.duration, 10) || 240;
            const elapsed = Math.max(0, (Date.now() - dbState.started_at_ms) / 1000);
            if (elapsed < dur) {
              setCurrentTrack(dbState.current_track);
              setCurrentTime(elapsed);
              if (audioRef.current) {
                audioRef.current.currentTime = elapsed;
                audioRef.current.play().catch(() => {});
              }
              return;
            }
          }
          // Default: resume 24/7 deterministic schedule
          loadAutoScheduleTrack();
        }
      } else {
        // Auto mode rollover
        loadAutoScheduleTrack();
      }
    } finally {
      optionsRef.current.onTrackEnded?.();
      setTimeout(() => {
        isAdvancingRef.current = false;
      }, 2500);
    }
  }, [roomId, setCurrentTrack, loadAutoScheduleTrack]);

  // 3. High-Frequency Micro-Drift Correction & Mobile Background Tab Watchdog
  // Checks every 5 seconds for smooth, click-free pitch-corrected sync
  useEffect(() => {
    driftIntervalRef.current = setInterval(() => {
      const audio = audioRef.current;
      if (!audio || audio.paused) return;

      if (modeRef.current === 'manual' && currentTrackRef.current) {
        // --- MANUAL OVERRIDE DRIFT CORRECTION & MOBILE BACKGROUND WATCHDOG ---
        const dur = parseInt(currentTrackRef.current.duration, 10) || 240;
        const expectedTime = Math.max(0, (Date.now() - startedAtMsRef.current) / 1000);

        if (expectedTime >= dur) {
          // Track time expired in real world!
          handleTrackEnd();
          return;
        }

        const actualTime = audio.currentTime;

        // Mobile / iOS Safari Watchdog: if audio reached the end while phone was locked
        if (dur > 0 && actualTime >= dur - 0.5) {
          handleTrackEnd();
          return;
        }

        const drift = expectedTime - actualTime;
        if (Math.abs(drift) < 0.35) {
          if (audio.playbackRate !== 1.0) audio.playbackRate = 1.0;
        } else if (drift > 0.35 && drift <= 2.5) {
          ensurePreservesPitch(audio);
          audio.playbackRate = 1.03;
        } else if (drift < -0.35 && drift >= -2.5) {
          ensurePreservesPitch(audio);
          audio.playbackRate = 0.97;
        } else if (Math.abs(drift) > 2.5) {
          audio.currentTime = expectedTime;
          audio.playbackRate = 1.0;
          setCurrentTime(audio.currentTime);
        }
      } else {
        // --- DETERMINISTIC 24/7 AUTO SCHEDULE DRIFT CORRECTION ---
        const sched = getPcoLiveSchedule();
        const activeTrack = currentTrackRef.current;

        // Auto schedule rollover check or background tab watchdog
        if (!activeTrack || activeTrack.id !== sched.currentTrack.id) {
          setCurrentTrack(sched.currentTrack);
          audio.currentTime = sched.offsetSec;
          setCurrentTime(sched.offsetSec);
          audio.playbackRate = 1.0;
          return;
        }

        const actualTime = audio.currentTime;
        const expectedTime = sched.offsetSec;
        const drift = expectedTime - actualTime;

        if (Math.abs(drift) < 0.35) {
          if (audio.playbackRate !== 1.0) audio.playbackRate = 1.0;
        } else if (drift > 0.35 && drift <= 2.5) {
          ensurePreservesPitch(audio);
          audio.playbackRate = 1.03;
        } else if (drift < -0.35 && drift >= -2.5) {
          ensurePreservesPitch(audio);
          audio.playbackRate = 0.97;
        } else if (Math.abs(drift) > 2.5) {
          audio.currentTime = expectedTime;
          audio.playbackRate = 1.0;
          setCurrentTime(audio.currentTime);
        }
      }
    }, 5000);

    return () => {
      if (driftIntervalRef.current) {
        clearInterval(driftIntervalRef.current);
        driftIntervalRef.current = null;
      }
    };
  }, [handleTrackEnd, setCurrentTrack, ensurePreservesPitch]);

  // 4. Audio Event Handlers
  // Native 4Hz onTimeUpdate with GPU CSS linear interpolation handles 60fps with 0 CPU overhead
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  }, []);

  const handleSongEnded = useCallback(() => {
    handleTrackEnd();
  }, [handleTrackEnd]);

  const handleAudioError = useCallback((e: any) => {
    console.warn('[PCO Radio] Audio playback error:', e);
    handleTrackEnd();
  }, [handleTrackEnd]);

  // 5. User & Admin Actions with Authoritative DB Persistence
  // SECURITY: only admins mutate pco_radio_state. Non-admin callers get a
  // local-only effect so a stray client can never hijack the station.
  const playTrackImmediately = useCallback(async (track: PcoTrack) => {
    setMode('manual');
    modeRef.current = 'manual';
    // Temporary local placeholder to prevent Ghost Drift race conditions during network latency
    startedAtMsRef.current = Date.now();
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(0);

    if (audioRef.current) {
      const audio = audioRef.current;
      ensurePreservesPitch(audio);

      // Clean up ghost listeners from previous auto-schedule or rapid loads
      if (audioReadyListenerRef.current) {
        audio.removeEventListener('canplay', audioReadyListenerRef.current);
        audioReadyListenerRef.current = null;
      }

      const srcChanged = audio.src !== track.media_url && !audio.src.endsWith(track.media_url);
      if (srcChanged) {
        audio.src = track.media_url;
        audio.load();
      }
      audio.currentTime = 0;
      audio.playbackRate = 1.0;
      audio.play().catch(() => {});
    }

    if (isAdminRef.current) {
      await setManualRadioOverride(track, queueRef.current, roomId);
    }
  }, [roomId, setCurrentTrack, ensurePreservesPitch]);

  const playTrackNext = useCallback(async (track: PcoTrack) => {
    const updatedQueue = [track, ...queueRef.current.filter(t => t.id !== track.id)];
    setQueue(updatedQueue);
    if (isAdminRef.current) {
      await updateRadioQueue(updatedQueue, roomId);
    }
  }, [roomId]);

  const addTrackToQueue = useCallback(async (track: PcoTrack) => {
    const updatedQueue = [...queueRef.current.filter(t => t.id !== track.id), track];
    setQueue(updatedQueue);
    if (isAdminRef.current) {
      await updateRadioQueue(updatedQueue, roomId);
    }
  }, [roomId]);

  const removeFromQueue = useCallback(async (trackId: string) => {
    const updatedQueue = queueRef.current.filter(t => t.id !== trackId);
    setQueue(updatedQueue);
    if (isAdminRef.current) {
      await updateRadioQueue(updatedQueue, roomId);
    }
  }, [roomId]);

  const returnToAuto = useCallback(async () => {
    setMode('auto');
    modeRef.current = 'auto';
    loadAutoScheduleTrack();
    if (isAdminRef.current) {
      await returnToAutoRadioSchedule(roomId);
    }
  }, [roomId, loadAutoScheduleTrack]);

  const skipCurrentTrack = useCallback(async () => {
    // Non-admins: local skip only. The authoritative DB stays untouched; the
    // realtime channel + drift corrector re-sync them to the official track.
    if (!isAdminRef.current) {
      if (queueRef.current.length > 0) {
        const [nextTrack, ...remainingQueue] = queueRef.current;
        setQueue(remainingQueue);
        startedAtMsRef.current = Date.now();
        setCurrentTrack(nextTrack);
        setCurrentTime(0);
        if (audioRef.current) {
          const audio = audioRef.current;
          ensurePreservesPitch(audio);
          if (audio.src !== nextTrack.media_url && !audio.src.endsWith(nextTrack.media_url)) {
            audio.src = nextTrack.media_url;
            audio.load();
          }
          audio.playbackRate = 1.0;
          audio.play().catch(() => {});
        }
      } else {
        await returnToAuto();
      }
      return;
    }

    if (queueRef.current.length > 0) {
      const [nextTrack, ...remainingQueue] = queueRef.current;
      setQueue(remainingQueue);
      await playTrackImmediately(nextTrack);
    } else {
      // Empty queue: cleanly return to / continue 24/7 Radio stream
      await returnToAuto();
    }
  }, [returnToAuto, playTrackImmediately, setCurrentTrack, ensurePreservesPitch]);

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

  const seek = useCallback(async (timeInSec: number) => {
    if (!audioRef.current || !currentTrackRef.current) return;

    audioRef.current.currentTime = timeInSec;
    setCurrentTime(timeInSec);

    // CRITICAL: If in Manual mode, update the authoritative start time 
    // so the 5-second drift corrector doesn't snap the audio back!
    if (modeRef.current === 'manual' && isAdminRef.current) {
      const serverNow = (await getServerTimeMs()) || Date.now();
      const newStartedAtMs = serverNow - (timeInSec * 1000);
      startedAtMsRef.current = newStartedAtMs;

      await setManualRadioOverride(
        currentTrackRef.current,
        queueRef.current,
        roomId,
        newStartedAtMs
      );
    }
  }, [roomId]);

  const duration = currentTrack ? (parseInt(currentTrack.duration, 10) || 240) : 240;

  return {
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
