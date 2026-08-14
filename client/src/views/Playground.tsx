"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { PlaygroundCanvas, Player } from '../components/PlaygroundCanvas';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { MapPin, MapPinOff, Users, Smile, Send, Mic, MicOff } from 'lucide-react';
import { db } from '../lib/db';
import { useTracks, useLocalParticipant } from '@livekit/components-react';
import { Track } from 'livekit-client';
import { useSpatialAudio } from '../hooks/useSpatialAudio';

export const Playground: React.FC = () => {
  const { currentUser } = useAuth();
  const [remotePlayers, setRemotePlayers] = useState<Map<string, Player>>(new Map());
  const [onlineCount, setOnlineCount] = useState(0);

  // Default coordinates (approx center of canvas)
  const [myPos, setMyPos] = useState({ x: 1600, y: 720 });
  const [mounted, setMounted] = useState(false);

  // Interaction States
  const [speechBubbles, setSpeechBubbles] = useState<Map<string, {text: string, timestamp: number}>>(new Map());
  const [chatInput, setChatInput] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [sitState, setSitState] = useState<'IDLE' | 'SITTING'>('IDLE');
  const [activeBench, setActiveBench] = useState<string | null>(null);
  
  const EMOJI_LIST = ['👍', '👋', '❤️', '🔥', '✨', '👀', '🎉', '😂', '💀'];

  // Store the active channel so broadcast Position uses the exact subscribed instance
  const [activeChannel, setActiveChannel] = useState<any>(null);

  // Create a unique session ID for this specific browser tab so we can test with the same account
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15));

  // Debug states
  const [connectionStatus, setConnectionStatus] = useState<string>('CONNECTING');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // GPS Geolocation States
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [gpsStatus, setGpsStatus] = useState<'DISABLED' | 'ACQUIRING' | 'LOCKED' | 'ERROR'>('DISABLED');
  const gpsAnchorRef = useRef<{ lat: number; lng: number; x: number; y: number } | null>(null);
  const collisionCheckerRef = useRef<((x: number, y: number) => { x: number; y: number; isBlocked: boolean }) | null>(null);
  const dexieSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 🎙️ LiveKit Spatial Proximity Audio & Local Mic
  let tracks: any[] = [];
  let isMicrophoneEnabled = false;
  let localParticipant: any = null;

  try {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    tracks = useTracks([Track.Source.Microphone]);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const localPartHook = useLocalParticipant();
    isMicrophoneEnabled = localPartHook.isMicrophoneEnabled;
    localParticipant = localPartHook.localParticipant;
  } catch {
    // Graceful fallback if rendered standalone without LiveKitRoom
  }

  const [showVoicePrompt, setShowVoicePrompt] = useState(true);

  // Auto-dismiss voice prompt after 6 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowVoicePrompt(false), 6000);
    return () => clearTimeout(timer);
  }, []);

  const toggleMic = async () => {
    if (localParticipant) {
      try {
        await localParticipant.setMicrophoneEnabled(!isMicrophoneEnabled);
        setShowVoicePrompt(false);
      } catch (e: any) {
        console.warn('Microphone toggle failed:', e);
        setErrorMsg('Microphone access denied or not available');
        setTimeout(() => setErrorMsg(null), 3000);
      }
    }
  };

  // Ref map of remote player coordinates for spatial audio calculation
  const remotePosMap = useRef(new Map<string, { x: number; y: number }>());

  useEffect(() => {
    remotePlayers.forEach((player, id) => {
      remotePosMap.current.set(id, { x: player.x, y: player.y });
    });
  }, [remotePlayers]);

  // Hook dynamically attenuates volume based on distance in the 2D world
  useSpatialAudio(myPos, remotePosMap.current, tracks, 500);

  const handleCollisionCheckerReady = useCallback((checker: (x: number, y: number) => { x: number; y: number; isBlocked: boolean }) => {
    collisionCheckerRef.current = checker;
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Periodic cleanup for speech bubbles (sweeps expired bubbles every second, avoids memory leaks)
  useEffect(() => {
    const interval = setInterval(() => {
      setSpeechBubbles(prev => {
        if (prev.size === 0) return prev;
        const now = Date.now();
        let changed = false;
        const newMap = new Map(prev);
        newMap.forEach((bubble, id) => {
          if (now - bubble.timestamp > 7000) {
            newMap.delete(id);
            changed = true;
          }
        });
        return changed ? newMap : prev;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Clean up Dexie debounce timeout on unmount
  useEffect(() => {
    return () => {
      if (dexieSaveTimeoutRef.current) {
        clearTimeout(dexieSaveTimeoutRef.current);
      }
    };
  }, []);

  // Load saved position and GPS preferences from Dexie IndexedDB
  useEffect(() => {
    if (!currentUser?.id) return;
    let isMounted = true;
    (async () => {
      try {
        const savedSettings = await db.playground_settings.get(currentUser.id);
        if (savedSettings && isMounted) {
          if (typeof savedSettings.last_x === 'number' && typeof savedSettings.last_y === 'number') {
            setMyPos({ x: savedSettings.last_x, y: savedSettings.last_y });
          }
          if (typeof savedSettings.gps_enabled === 'boolean') {
            setGpsEnabled(savedSettings.gps_enabled);
          }
        }
      } catch (err) {
        console.warn('[Dexie Playground] Error loading settings:', err);
      }
    })();
    return () => { isMounted = false; };
  }, [currentUser?.id]);

  // 1. Supabase Broadcast Setup for Real-time Multiplayer
  useEffect(() => {
    if (!currentUser?.id) return;

    let isSubscribed = true;
    setConnectionStatus('CONNECTING');

    // Use a clean, global channel name without complex config overrides
    const channel = supabase.channel('playground-global');

    channel.on('broadcast', { event: 'move' }, ({ payload }) => {
      setRemotePlayers(prev => {
        const newMap = new Map(prev);
        newMap.set(payload.id, {
          id: payload.id,
          x: payload.x,
          y: payload.y,
          direction: payload.direction || 'down',
          isMoving: payload.isMoving || false,
          color: payload.color || '#3b82f6',
          sittingOn: payload.sittingOn || null
        });
        return newMap;
      });
    });

    channel.on('presence', { event: 'sync' }, () => {
      if (!isSubscribed) return;
      const state = channel.presenceState();
      setOnlineCount(Object.keys(state).length);
    });

    // Handle Speech Bubbles (automatic sweeping interval manages expiration)
    channel.on('broadcast', { event: 'speech_bubble' }, ({ payload }) => {
      setSpeechBubbles(prev => {
        const newMap = new Map(prev);
        newMap.set(payload.id, { text: payload.text, timestamp: Date.now() });
        return newMap;
      });
    });

    channel.on('presence', { event: 'leave' }, ({ key }) => {
      if (!isSubscribed) return;
      setRemotePlayers(prev => {
        const newMap = new Map(prev);
        newMap.delete(key);
        return newMap;
      });
    });

    // Subscribe
    channel.subscribe(async (status, err) => {
      if (!isSubscribed) return;
      setConnectionStatus(status);

      if (err) {
        setErrorMsg(err.message || 'Subscription error');
      }

      if (status === 'SUBSCRIBED') {
        setActiveChannel(channel);
        try {
          // Track presence with sessionId to separate tabs
          await channel.track({ id: sessionId, online_at: new Date().toISOString(), user_id: currentUser.id });
        } catch (e: any) {
          setErrorMsg(e.message || 'Presence track failed');
        }
      }
    });

    return () => {
      isSubscribed = false;
      setActiveChannel(null);
      supabase.removeChannel(channel);
    };
  }, [currentUser?.id, sessionId]);

  // Broadcast our position and animation state to the channel
  const broadcastPosition = useCallback(
    (x: number, y: number, dir: string, moving: boolean, sittingOn: string | null = null) => {
      if (!currentUser || !activeChannel || activeChannel.state !== 'joined') return;

      activeChannel.send({
        type: 'broadcast',
        event: 'move',
        payload: {
          id: sessionId,
          x,
          y,
          direction: dir,
          isMoving: moving,
          color: '#3b82f6',
          sittingOn
        }
      }).catch(() => {});
    },
    [currentUser, sessionId, activeChannel]
  );

  // Callback from the Canvas when the local player moves using WASD
  const handlePositionChange = useCallback((x: number, y: number, dir: string, moving: boolean, sittingOn: string | null = null) => {
    setMyPos({ x, y });
    if (moving && sitState === 'SITTING') {
      // If they try to move while sitting, stand them up
      setSitState('IDLE');
      setActiveBench(null);
      sittingOn = null;
    }
    broadcastPosition(x, y, dir, moving, sittingOn);

    // Debounce Save to Dexie IndexedDB (saves 2s after movement stops, avoiding 20 writes/sec battery drain)
    if (currentUser?.id) {
      if (dexieSaveTimeoutRef.current) clearTimeout(dexieSaveTimeoutRef.current);
      dexieSaveTimeoutRef.current = setTimeout(() => {
        db.playground_settings.put({
          id: currentUser.id,
          last_x: Math.round(x),
          last_y: Math.round(y),
          gps_enabled: gpsEnabled,
          updated_at: Date.now()
        }).catch(() => {});
      }, 2000);
    }
  }, [broadcastPosition, sitState, currentUser?.id, gpsEnabled]);

  const handleSendSpeechBubble = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChannel) return;
    
    const text = chatInput.trim();
    
    // Broadcast to others
    activeChannel.send({
      type: 'broadcast',
      event: 'speech_bubble',
      payload: { id: sessionId, text }
    });

    // Show locally immediately (sweeping interval will clean up)
    setSpeechBubbles(prev => {
      const newMap = new Map(prev);
      newMap.set(sessionId, { text, timestamp: Date.now() });
      return newMap;
    });

    setChatInput('');
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emoji: string) => {
    setChatInput(prev => prev + emoji);
  };

  const handleSitRequest = (benchId: string, benchX: number, benchY: number) => {
    const occupants = Array.from(remotePlayers.values()).filter(p => p.sittingOn === benchId);
    if (occupants.length >= 2) {
      setErrorMsg("Bench is full!");
      setTimeout(() => setErrorMsg(null), 3000);
      return;
    }

    let seatX = benchX - 25; // Default left
    if (occupants.length === 1 && occupants[0].x < benchX) {
      seatX = benchX + 25; // Left is taken
    } else if (occupants.length === 1 && occupants[0].x >= benchX) {
      seatX = benchX - 25; // Right is taken
    }

    // Move the avatar further down so they sit on the grey seat area instead of floating on the backrest
    const seatY = benchY + 15;
    
    setSitState('SITTING');
    setActiveBench(benchId);
    
    // Teleport local player to seat and broadcast sitting state
    handlePositionChange(seatX, seatY, 'down', false, benchId);
  };

  // 2. Geolocation Sync Engine
  const myPosRef = useRef(myPos);
  const handlePositionChangeRef = useRef(handlePositionChange);

  useEffect(() => { myPosRef.current = myPos; }, [myPos]);
  useEffect(() => { handlePositionChangeRef.current = handlePositionChange; }, [handlePositionChange]);

  const toggleGpsMode = useCallback(() => {
    setGpsEnabled(prev => {
      const nextState = !prev;
      gpsAnchorRef.current = null;
      if (currentUser?.id) {
        db.playground_settings.put({
          id: currentUser.id,
          last_x: Math.round(myPosRef.current.x),
          last_y: Math.round(myPosRef.current.y),
          gps_enabled: nextState,
          updated_at: Date.now()
        }).catch(() => {});
      }
      return nextState;
    });
  }, [currentUser?.id]);

  useEffect(() => {
    if (!gpsEnabled) {
      setGpsStatus('DISABLED');
      setGpsAccuracy(null);
      gpsAnchorRef.current = null;
      return;
    }

    if (!('geolocation' in navigator)) {
      setGpsStatus('ERROR');
      setErrorMsg('Geolocation is not supported by your browser.');
      setGpsEnabled(false);
      return;
    }

    setGpsStatus('ACQUIRING');

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        setGpsAccuracy(Math.round(accuracy));
        setGpsStatus('LOCKED');

        if (!gpsAnchorRef.current) {
          gpsAnchorRef.current = { lat: latitude, lng: longitude, x: myPosRef.current.x, y: myPosRef.current.y };
          return;
        }

        const anchor = gpsAnchorRef.current;
        // Metres displacement using Equirectangular approximation
        const dLatMeters = (latitude - anchor.lat) * 111139;
        const dLngMeters = (longitude - anchor.lng) * 111139 * Math.cos(anchor.lat * (Math.PI / 180));

        // Scale factor: 8 pixels per real-world meter
        const PIXELS_PER_METER = 8;
        const rawTargetX = Math.max(50, Math.min(2510, anchor.x + dLngMeters * PIXELS_PER_METER));
        const rawTargetY = Math.max(50, Math.min(1390, anchor.y - dLatMeters * PIXELS_PER_METER));

        // Enforce Wall Avoidance & Walkable Path Sanitization
        let finalX = rawTargetX;
        let finalY = rawTargetY;
        if (collisionCheckerRef.current) {
          const validated = collisionCheckerRef.current(rawTargetX, rawTargetY);
          finalX = validated.x;
          finalY = validated.y;
        }

        const dx = finalX - myPosRef.current.x;
        const dy = finalY - myPosRef.current.y;

        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          let dir: 'up' | 'down' | 'left' | 'right' = 'down';
          if (Math.abs(dy) > Math.abs(dx)) {
            dir = dy < 0 ? 'up' : 'down';
          } else {
            dir = dx < 0 ? 'left' : 'right';
          }

          handlePositionChangeRef.current(finalX, finalY, dir, true);
        }
      },
      (err) => {
        console.warn('[GPS Error]', err);
        setGpsStatus('ERROR');
        setErrorMsg(`GPS Error: ${err.message}`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 2000,
        timeout: 15000
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [gpsEnabled]);

  if (!mounted || !currentUser) {
    return <div className="flex h-full items-center justify-center text-white">Loading Playground...</div>;
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-black overflow-hidden">
      {/* Instructions Overlay — elevated safely above the chat bar and mobile nav */}
      <div className="absolute bottom-[156px] md:bottom-20 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center px-4 w-full max-w-sm">
        <p className="text-white/60 text-[10px] font-bold tracking-widest uppercase bg-black/50 px-3.5 py-1.5 rounded-full backdrop-blur-md border border-white/10 shadow-lg inline-block">
          {gpsEnabled ? '📍 GPS Active • Walk outside to move' : 'Tap screen to walk • Or use WASD / Arrows'}
        </p>
      </div>

      {/* Top HUD overlay — single row responsive glassmorphism command bar */}
      <div className="absolute top-3 left-3 right-3 z-30 flex items-center justify-between pointer-events-none gap-2">
        
        {/* Left: User Profile & Online Count with subtle live pulse dot */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div 
            className="w-9 h-9 rounded-full overflow-hidden border border-white/20 bg-gray-900 cursor-pointer shadow-lg hover:border-neon transition-colors shrink-0" 
            onClick={() => window.location.href = '/profile'}
            title="My Profile"
          >
            {currentUser.avatar ? (
              <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-800">
                <span className="text-white text-xs font-bold">{currentUser.anonymousId ? currentUser.anonymousId.slice(-2) : '??'}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-md rounded-full border border-white/15 shadow-md">
            <span className={`w-2 h-2 rounded-full ${connectionStatus === 'SUBSCRIBED' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            <Users size={14} className="text-gray-300" />
            <span className="text-white text-xs font-semibold">{onlineCount}</span>
          </div>
        </div>

        {/* Right: GPS & Spatial Mic Toggles */}
        <div className="flex items-center gap-1.5 pointer-events-auto">
          {/* GPS Toggle */}
          <button
            onClick={toggleGpsMode}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all shadow-md active:scale-95 cursor-pointer ${
              gpsEnabled
                ? 'bg-cyan-950/80 border-cyan-400/80 text-cyan-300 shadow-[0_0_10px_rgba(34,211,238,0.25)]'
                : 'bg-black/60 backdrop-blur-md border-white/15 text-gray-400 hover:text-white'
            }`}
            title="Toggle Real-world GPS Position Sync"
          >
            {gpsEnabled ? (
              <MapPin size={14} className="text-cyan-400 animate-bounce" />
            ) : (
              <MapPinOff size={14} className="text-gray-400" />
            )}
            <span className="text-[11px] font-bold">
              {gpsEnabled ? (gpsStatus === 'LOCKED' ? `GPS ±${gpsAccuracy ?? '?'}m` : 'GPS...') : 'GPS'}
            </span>
          </button>

          {/* Spatial Voice Mic Toggle */}
          <button
            onClick={toggleMic}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full border transition-all shadow-md active:scale-95 cursor-pointer ${
              isMicrophoneEnabled
                ? 'bg-emerald-950/80 border-emerald-400/80 text-emerald-300 shadow-[0_0_10px_rgba(52,211,153,0.25)]'
                : 'bg-black/60 backdrop-blur-md border-white/15 text-gray-400 hover:text-white'
            }`}
            title="Toggle Proximity Spatial Microphone"
          >
            {isMicrophoneEnabled ? (
              <Mic size={14} className="text-emerald-400 animate-pulse" />
            ) : (
              <MicOff size={14} className="text-gray-400" />
            )}
            <span className="text-[11px] font-bold">
              {isMicrophoneEnabled ? 'Mic ON' : 'Mic OFF'}
            </span>
          </button>
        </div>
      </div>

      {/* Minimalist Voice Onboarding Gesture Pill */}
      {showVoicePrompt && !isMicrophoneEnabled && (
        <div 
          onClick={() => setShowVoicePrompt(false)} 
          className="absolute top-16 left-0 right-0 z-30 flex justify-center px-4 pointer-events-auto cursor-pointer"
        >
          <div 
            onClick={(e) => {
              e.stopPropagation();
              toggleMic();
              setShowVoicePrompt(false);
            }}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-black/85 hover:bg-black/95 backdrop-blur-2xl border border-neon/50 hover:border-neon rounded-full shadow-[0_6px_25px_rgba(255,0,127,0.3)] text-white transition-all duration-200 active:scale-95 animate-in fade-in slide-in-from-top-2"
          >
            <div className="w-5 h-5 rounded-full bg-neon/20 flex items-center justify-center text-neon">
              <Mic size={12} className="animate-pulse" />
            </div>
            <span className="text-[11px] font-medium text-gray-200">
              Tap to turn on Mic & talk with others
            </span>
            <span className="text-[9px] uppercase font-extrabold tracking-wider px-2 py-0.5 rounded-full bg-neon text-white shadow-sm ml-0.5">
              Turn On
            </span>
          </div>
        </div>
      )}

      {/* Floating Error Alert */}
      {errorMsg && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-30 px-3 py-1.5 bg-red-950/90 border border-red-500/80 rounded-full backdrop-blur-md shadow-xl pointer-events-auto animate-in fade-in">
          <span className="text-red-200 text-xs font-bold">{errorMsg}</span>
        </div>
      )}

      {/* The 2D World */}
      <div className="flex-1 relative">
        <PlaygroundCanvas
          localPlayerId={currentUser.id}
          localSessionId={sessionId}
          onPositionChange={handlePositionChange}
          remotePlayers={Array.from(remotePlayers.values())}
          localPosition={myPos}
          speechBubbles={speechBubbles}
          sitState={sitState}
          activeBench={activeBench}
          onSitRequest={handleSitRequest}
          gpsEnabled={gpsEnabled}
          onCollisionCheckerReady={handleCollisionCheckerReady}
        />
      </div>

      {/* Floating Chat Input Bar — elevated above mobile navbar with safe-area spacing */}
      <div className="absolute bottom-[98px] md:bottom-4 left-3 right-3 z-30 flex justify-center pointer-events-none">
        <form onSubmit={handleSendSpeechBubble} className="pointer-events-auto w-full max-w-xl bg-black/80 backdrop-blur-xl border border-white/15 p-1.5 rounded-full shadow-2xl flex items-center gap-1.5 relative">
          
          {/* Quick Reaction Tray */}
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2 bg-[#0b0314]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-2.5 shadow-[0_10px_30px_rgba(0,0,0,0.8)] flex flex-wrap gap-1.5 w-64 z-50 animate-in fade-in slide-in-from-bottom-2">
              {EMOJI_LIST.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-lg hover:bg-white/10 p-2 rounded-xl transition-all active:scale-95"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            aria-label="Reactions"
            className="w-8 h-8 flex items-center justify-center bg-white/5 hover:bg-white/10 text-gray-300 rounded-full transition-colors shrink-0 active:scale-95"
          >
            <Smile className="w-4 h-4 text-gray-300" />
          </button>

          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Say something nearby..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 px-2 py-1 text-xs md:text-sm focus:outline-none"
            maxLength={100}
          />

          <button 
            type="submit"
            disabled={!chatInput.trim()}
            className="px-4 py-2 bg-neon hover:bg-pink-600 disabled:opacity-30 text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md shadow-neon/20 transition-all flex items-center gap-1 shrink-0 active:scale-95"
          >
            <span>Say</span>
            <Send className="w-3 h-3" />
          </button>
        </form>
      </div>
    </div>
  );
};



