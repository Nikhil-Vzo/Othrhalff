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
  playTrackImmediately: (track: PcoTrack, authoritativeStartedAtMs?: number) => Promise<void>;
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
  // Clock-skew correction: started_at_ms comes from the DJ's clock; without
  // correcting for the difference between THIS device's clock and the server's,
  // every listener computes a different expected position (out-of-sync) and the
  // drift corrector hard-snaps constantly (audible glitch every interval).
  const clockSkewMsRef = useRef<number>(0);
  // Hard-snap cooldown: prevents rapid repeated currentTime jumps that render
  // as audio glitches. At most one corrective snap per SNAP_COOLDOWN_MS.
  const lastSnapAtRef = useRef<number>(0);
  const SNAP_COOLDOWN_MS = 12000;
  // Last applied radio-state version: dedupes the double delivery
  // (postgres_changes + realtime broadcast) of the SAME admin update, which
  // otherwise re-seeks the audio twice per action.
  const lastAppliedVersionRef = useRef<number>(0);

  // Measure skew once at mount (and refresh every 10 min)
  useEffect(() => {
    let cancelled = false;
    const measure = async () => {
      try {
        const serverNow = await getServerTimeMs();
        if (!cancelled && typeof serverNow === 'number' && serverNow > 0) {
          // Round-trip compensation: assume symmetric network delay
          clockSkewMsRef.current = Date.now() - serverNow;
        }
      } catch (_) {}
    };
    measure();
    const iv = setInterval(measure, 10 * 60 * 1000);
    return () => { cancelled = true; clearInterval(iv); };
  }, []);

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
            const audio = audioRef.current;
            ensurePreservesPitch(audio);
            const startAtMs = dbState.started_at_ms;

            if (audio.src !== dbState.current_track.media_url && !audio.src.endsWith(dbState.current_track.media_url)) {
              audio.src = dbState.current_track.media_url;
              audio.load();
            }

            const onReady = () => {
              // Recompute at play-time so late-joiners land exactly where
              // everyone else is, even after slow buffering.
              const liveOffset = Math.max(0, (Date.now() - startAtMs) / 1000);
              try { audio.currentTime = Math.max(0, liveOffset - 0.25); } catch (_) {}
              setCurrentTime(Math.max(0, liveOffset - 0.25));
              audio.playbackRate = 1.0;
              if (!dbState.paused) {
                audio.play().catch(() => setIsPlaying(false));
              }
              audio.removeEventListener('canplay', onReady);
            };

            if (audio.readyState >= 3) {
              onReady();
            } else {
              audio.addEventListener('canplay', onReady);
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

          // FIX: this branch previously never assigned audio.src — joiners
          // heard the previous/auto track (or silence) while the UI showed
          // nextTrack. Load it and seek on canplay like the other branches.
          if (audioRef.current) {
            const audio = audioRef.current;
            ensurePreservesPitch(audio);

            if (audio.src !== nextTrack.media_url && !audio.src.endsWith(nextTrack.media_url)) {
              audio.src = nextTrack.media_url;
              audio.load();
            }

            const onReady = () => {
              try { audio.currentTime = 0; } catch (_) {}
              audio.playbackRate = 1.0;
              audio.play().catch(() => setIsPlaying(false));
              audio.removeEventListener('canplay', onReady);
            };

            if (audio.readyState >= 3) {
              onReady();
            } else {
              audio.addEventListener('canplay', onReady);
            }
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

    // DEDUPE: the same admin action arrives TWICE (postgres_changes event +
    // realtime broadcast). Re-applying re-seeks the audio twice per action —
    // an audible glitch. Skip if this exact state version was already applied.
    const v = Number(nextState.version || 0);
    if (v > 0 && v === lastAppliedVersionRef.current) return;
    if (v > 0) lastAppliedVersionRef.current = v;

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
          // FIX: seeking before metadata loads (readyState 0) silently fails,
          // leaving joiners at 0 until the drift corrector hard-snaps (audible
          // jump). Seek on canplay instead.
          const seekToManual = () => {
            const liveOffset = Math.max(0, (Date.now() - Number(nextState.started_at_ms)) / 1000);
            try { audio.currentTime = Math.max(0, liveOffset - 0.25); } catch (_) {}
            if (!nextState.paused) {
              audio.play().catch(() => {});
            } else {
              audio.pause();
            }
            audio.removeEventListener('canplay', seekToManual);
          };
          if (audio.readyState >= 1) {
            seekToManual();
          } else {
            audio.addEventListener('canplay', seekToManual);
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

    // Use a dedicated room-state sync channel so it never collides with
    // or mutates the presence/chat channel ('campus_pco_live_chat').
    const channelTopic = `pco_radio_state_sync_${roomId}`;
    const channel = supabase.channel(channelTopic)
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
  useEffect(() => {
    driftIntervalRef.current = setInterval(() => {
      const audio = audioRef.current;
      if (!audio || audio.paused) return;

      // Expected position uses SKEW-CORRECTED local time so every listener,
      // regardless of device clock error, computes the same timeline.
      const nowSyncedMs = Date.now() - clockSkewMsRef.current;

      if (modeRef.current === 'manual' && currentTrackRef.current) {
        // --- MANUAL OVERRIDE DRIFT CORRECTION & MOBILE BACKGROUND WATCHDOG ---
        const dur = parseInt(currentTrackRef.current.duration, 10) || 240;
        const expectedTime = Math.max(0, (nowSyncedMs - startedAtMsRef.current) / 1000);

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

        // Dead zone widened to 0.6s: within it, playback is perceptually in
        // sync; chasing sub-600ms deltas is what caused the audible warble.
        if (Math.abs(drift) < 0.6) {
          if (audio.playbackRate !== 1.0) audio.playbackRate = 1.0;
        } else if (Math.abs(drift) <= 2.5) {
          // Gentle slew with a NARROWER band so we don't overshoot and
          // oscillate between 1.05 and 0.95 on consecutive ticks.
          ensurePreservesPitch(audio);
          audio.playbackRate = drift > 0 ? 1.03 : 0.97;
        } else if (Date.now() - lastSnapAtRef.current >= SNAP_COOLDOWN_MS) {
          // >2.5s off: hard snap, but at most once per cooldown window.
          // Repeated rapid currentTime jumps are the "glitch/breaks" symptom.
          lastSnapAtRef.current = Date.now();
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

        if (Math.abs(drift) < 0.6) {
          if (audio.playbackRate !== 1.0) audio.playbackRate = 1.0;
        } else if (Math.abs(drift) <= 2.5) {
          ensurePreservesPitch(audio);
          audio.playbackRate = drift > 0 ? 1.03 : 0.97;
        } else if (Date.now() - lastSnapAtRef.current >= SNAP_COOLDOWN_MS) {
          lastSnapAtRef.current = Date.now();
          audio.currentTime = expectedTime;
          audio.playbackRate = 1.0;
          setCurrentTime(audio.currentTime);
        }
      }
    }, 3000);

    return () => {
      if (driftIntervalRef.current) {
        clearInterval(driftIntervalRef.current);
        driftIntervalRef.current = null;
      }
    };
  }, [handleTrackEnd, setCurrentTrack, ensurePreservesPitch]);

  // 4. Audio Event Handlers
  // SCALING FIX: throttle currentTime state updates to ~1 Hz. onTimeUpdate
  // fires at ~4 Hz and each call re-rendered the entire player tree (video
  // bg, header, footer, progress bar) 4x/sec on every listener tab. The
  // progress bar animates via CSS transition, so 1 Hz UI updates are
  // visually identical while cutting mobile CPU ~4x.
  const lastUiTimeRef = useRef(0);
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const now = Date.now();
      if (now - lastUiTimeRef.current >= 900) {
        lastUiTimeRef.current = now;
        setCurrentTime(audioRef.current.currentTime);
      }
    }
  }, []);

  // FIX: a dead CDN URL previously triggered error → handleTrackEnd → reload
  // of the SAME failing src → error again, forever (network hammering every
  // ~3s). Track consecutive failures and back off exponentially; after 3
  // failures, fall back to the deterministic auto schedule.
  // (Ref declared before the callbacks that use it.)
  const audioErrorCountRef = useRef<number>(0);

  const handleSongEnded = useCallback(() => {
    audioErrorCountRef.current = 0; // clean end resets the failure streak
    handleTrackEnd();
  }, [handleTrackEnd]);

  const handleAudioError = useCallback((e: any) => {
    console.warn('[PCO Radio] Audio playback error:', e);
    audioErrorCountRef.current += 1;
    const failures = audioErrorCountRef.current;

    if (failures >= 3) {
      console.warn('[PCO Radio] 3 consecutive audio failures — returning to auto schedule.');
      audioErrorCountRef.current = 0;
      loadAutoScheduleTrack();
      return;
    }

    const backoffMs = Math.min(8000, 1000 * Math.pow(2, failures));
    setTimeout(() => {
      handleTrackEnd();
    }, backoffMs);
  }, [handleTrackEnd, loadAutoScheduleTrack]);

  // 5. User & Admin Actions with Authoritative DB Persistence
  // SECURITY: only admins mutate pco_radio_state. Non-admin callers get a
  // local-only effect so a stray client can never hijack the station.
  //
  // ZERO-DELAY SYNC: callers may pass an authoritative startedAtMs (from the
  // DJ / DB). Listeners then begin playback AT THE CORRECT TIMESTAMP instead
  // of anchoring to their own receive time (which caused the 3-4s lag).
  const playTrackImmediately = useCallback(async (track: PcoTrack, authoritativeStartedAtMs?: number) => {
    setMode('manual');
    modeRef.current = 'manual';

    const startMs = typeof authoritativeStartedAtMs === 'number' && authoritativeStartedAtMs > 0
      ? authoritativeStartedAtMs
      : Date.now();
    const startOffsetSec = Math.max(0, (Date.now() - startMs) / 1000);

    startedAtMsRef.current = startMs;
    setCurrentTrack(track);
    setIsPlaying(true);
    setCurrentTime(startOffsetSec);

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

      const onReady = () => {
        // Jump straight to where the DJ is RIGHT NOW, minus a small negative
        // lead so the listener is never BEHIND the DJ (buffering headroom).
        const liveOffset = Math.max(0, (Date.now() - startMs) / 1000);
        const target = Math.max(0, liveOffset - 0.25);
        try { audio.currentTime = target; } catch (_) {}
        audio.playbackRate = 1.0;
        setCurrentTime(target);
        audio.play().catch(() => setIsPlaying(false));
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

    if (isAdminRef.current) {
      // Persist the SAME authoritative start timestamp to the DB so late
      // joiners hydrate at the exact position everyone else is at.
      await setManualRadioOverride(track, queueRef.current, roomId, startMs);
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
