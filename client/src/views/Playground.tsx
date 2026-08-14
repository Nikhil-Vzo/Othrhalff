"use client";

import React, { useEffect, useState, useCallback, useRef } from 'react';
import { PlaygroundCanvas, Player } from '../components/PlaygroundCanvas';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { MapPin, MapPinOff, Users, Smile, Send } from 'lucide-react';
import { db } from '../lib/db';

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

  const handleCollisionCheckerReady = useCallback((checker: (x: number, y: number) => { x: number; y: number; isBlocked: boolean }) => {
    collisionCheckerRef.current = checker;
  }, []);

  useEffect(() => {
    setMounted(true);
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

    // Handle Speech Bubbles
    channel.on('broadcast', { event: 'speech_bubble' }, ({ payload }) => {
      setSpeechBubbles(prev => {
        const newMap = new Map(prev);
        newMap.set(payload.id, { text: payload.text, timestamp: Date.now() });
        return newMap;
      });
      
      // Auto-clear bubble after 7 seconds
      setTimeout(() => {
        setSpeechBubbles(prev => {
          const m = new Map(prev);
          const current = m.get(payload.id);
          m.delete(payload.id);
          return m;
        });
      }, 7000);
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

    // Save to Dexie IndexedDB
    if (currentUser?.id) {
      db.playground_settings.put({
        id: currentUser.id,
        last_x: Math.round(x),
        last_y: Math.round(y),
        gps_enabled: gpsEnabled,
        updated_at: Date.now()
      }).catch(() => {});
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

    // Show locally immediately
    setSpeechBubbles(prev => {
      const newMap = new Map(prev);
      newMap.set(sessionId, { text, timestamp: Date.now() });
      return newMap;
    });

    // Auto-clear local
    setTimeout(() => {
      setSpeechBubbles(prev => {
        const m = new Map(prev);
        m.delete(sessionId);
        return m;
      });
    }, 7000);

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
  const toggleGpsMode = useCallback(() => {
    setGpsEnabled(prev => {
      const nextState = !prev;
      gpsAnchorRef.current = null;
      if (currentUser?.id) {
        db.playground_settings.put({
          id: currentUser.id,
          last_x: Math.round(myPos.x),
          last_y: Math.round(myPos.y),
          gps_enabled: nextState,
          updated_at: Date.now()
        }).catch(() => {});
      }
      return nextState;
    });
  }, [currentUser?.id, myPos.x, myPos.y]);

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
          gpsAnchorRef.current = { lat: latitude, lng: longitude, x: myPos.x, y: myPos.y };
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

        const dx = finalX - myPos.x;
        const dy = finalY - myPos.y;

        if (Math.abs(dx) > 1 || Math.abs(dy) > 1) {
          let dir: 'up' | 'down' | 'left' | 'right' = 'down';
          if (Math.abs(dy) > Math.abs(dx)) {
            dir = dy < 0 ? 'up' : 'down';
          } else {
            dir = dx < 0 ? 'left' : 'right';
          }

          handlePositionChange(finalX, finalY, dir, true);
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
  }, [gpsEnabled, handlePositionChange, myPos.x, myPos.y]);

  if (!mounted || !currentUser) {
    return <div className="flex h-full items-center justify-center text-white">Loading Playground...</div>;
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-black overflow-hidden">
      {/* Instructions Overlay */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center">
        <p className="text-white/50 text-[10px] font-bold tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
          {gpsEnabled ? 'GPS Tracking Active • Walk outside to move' : 'Use W A S D or Arrow Keys to Move'}
        </p>
      </div>

      {/* Top HUD overlay */}
      <div className="absolute top-4 left-4 z-20 flex gap-4 pointer-events-none items-center flex-wrap">
        {/* User Profile Pic */}
        <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-gray-700 bg-gray-900 pointer-events-auto cursor-pointer shadow-lg hover:border-neon transition-colors" onClick={() => window.location.href = '/profile'}>
          {currentUser.avatar ? (
            <img src={currentUser.avatar} alt="Profile" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white text-xs font-bold">{currentUser.anonymousId ? currentUser.anonymousId.slice(-2) : '??'}</span>
            </div>
          )}
        </div>

        {/* Online Count & Connection */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-full border border-gray-700">
            <Users size={16} className="text-gray-400" />
            <span className="text-white text-sm font-medium">{onlineCount} Online</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 rounded-full border border-gray-700">
            <div className={`w-2 h-2 rounded-full ${connectionStatus === 'SUBSCRIBED' ? 'bg-neon animate-pulse' : 'bg-red-500'}`}></div>
            <span className="text-gray-300 text-xs font-bold">{connectionStatus}</span>
          </div>
        </div>

        {/* GPS Mode Toggle Button */}
        <button
          onClick={toggleGpsMode}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border pointer-events-auto transition-all shadow-md cursor-pointer ${
            gpsEnabled
              ? 'bg-cyan-950/80 border-cyan-400 text-cyan-300 shadow-[0_0_12px_rgba(34,211,238,0.3)]'
              : 'bg-gray-800 border-gray-700 text-gray-400 hover:text-white'
          }`}
          title="Toggle Real-world GPS Position Sync"
        >
          {gpsEnabled ? (
            <MapPin size={16} className="text-cyan-400 animate-bounce" />
          ) : (
            <MapPinOff size={16} className="text-gray-400" />
          )}
          <span className="text-xs font-bold">
            {gpsEnabled
              ? gpsStatus === 'LOCKED'
                ? `GPS Sync (±${gpsAccuracy ?? '?'}m)`
                : `GPS (${gpsStatus})`
              : 'GPS Off'}
          </span>
        </button>

        {/* Error Message Debug */}
        {errorMsg && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-900/50 border border-red-500 rounded-full backdrop-blur-md max-w-md pointer-events-auto">
            <span className="text-white text-xs font-bold text-red-200">Error: {errorMsg}</span>
          </div>
        )}
      </div>

      {/* The 2D World */}
      <div className="flex-1 relative pb-16"> {/* Add padding for the chat bar */}
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

      {/* Global Chat Input Bar — elevated above mobile navbar with safe-area spacing */}
      <div className="absolute bottom-16 md:bottom-0 left-0 right-0 bg-black/90 backdrop-blur-xl border-t border-white/10 p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] z-30 flex justify-center">
        <form onSubmit={handleSendSpeechBubble} className="w-full max-w-2xl flex items-center gap-2 relative">
          
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
            className="w-10 h-10 flex items-center justify-center bg-gray-900/80 hover:bg-gray-800 text-gray-300 rounded-full border border-white/10 transition-colors shrink-0 active:scale-95"
          >
            <Smile className="w-5 h-5 text-gray-300" />
          </button>

          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Say something nearby..."
            className="flex-1 bg-gray-900/90 text-white placeholder-gray-500 px-4 py-2.5 rounded-full border border-white/10 focus:outline-none focus:border-neon text-xs md:text-sm transition-colors"
            maxLength={100}
          />
          <button 
            type="submit"
            disabled={!chatInput.trim()}
            className="px-5 py-2.5 bg-neon hover:bg-pink-600 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-md shadow-neon/20 transition-all flex items-center gap-1.5 shrink-0 active:scale-95"
          >
            <span>Say</span>
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};



