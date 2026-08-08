"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { PlaygroundCanvas, Player } from '../components/PlaygroundCanvas';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { MapPin, MapPinOff, Users } from 'lucide-react';
import { db } from '../lib/db';

export const Playground: React.FC = () => {
  const { currentUser } = useAuth();
  const [remotePlayers, setRemotePlayers] = useState<Map<string, Player>>(new Map());
  const [gpsEnabled, setGpsEnabled] = useState(false);
  const [onlineCount, setOnlineCount] = useState(0);

  // Default coordinates (approx center of canvas)
  const [myPos, setMyPos] = useState({ x: 400, y: 300 });
  const [mounted, setMounted] = useState(false);

  // Store the active channel so broadcast Position uses the exact subscribed instance
  const [activeChannel, setActiveChannel] = useState<any>(null);

  // Create a unique session ID for this specific browser tab so we can test with the same account
  const [sessionId] = useState(() => Math.random().toString(36).substring(2, 15));

  // Debug states
  const [connectionStatus, setConnectionStatus] = useState<string>('CONNECTING');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Load saved position and GPS preferences from Dexie IndexedDB
  useEffect(() => {
    if (!currentUser) return;
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
  }, [currentUser]);

  // 1. Supabase Broadcast Setup for Real-time Multiplayer
  useEffect(() => {
    if (!currentUser) return;

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
        });
        return newMap;
      });
    });

    channel.on('presence', { event: 'sync' }, () => {
      if (!isSubscribed) return;
      const state = channel.presenceState();
      setOnlineCount(Object.keys(state).length);
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
  }, [currentUser, sessionId]);

  // Broadcast our position and animation state to the channel
  const broadcastPosition = useCallback(
    (x: number, y: number, dir: string, moving: boolean) => {
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
          color: currentUser.gender === 'female' ? '#ff007f' : '#3b82f6',
        },
      }).catch(() => {});
    },
    [currentUser, sessionId, activeChannel]
  );

  // Callback from the Canvas when the local player moves using WASD
  const handlePositionChange = useCallback((x: number, y: number, dir: string, moving: boolean) => {
    setMyPos({ x, y });
    broadcastPosition(x, y, dir, moving);

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
  }, [broadcastPosition, currentUser?.id, gpsEnabled]);

  // 2. Geolocation Integration
  useEffect(() => {
    let watchId: number;

    if (gpsEnabled && navigator.geolocation) {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          // --- CAMPUS CALIBRATION ---
          // In a real app, you would define the exact bounds of your campus:
          // const CAMPUS_TOP_LEFT = { lat: 37.7749, lng: -122.4194 };
          // const CAMPUS_BOTTOM_RIGHT = { lat: 37.7739, lng: -122.4184 };
          // Then you mathematically map `position.coords` to `(x, y)` on the canvas.

          // For this prototype, we'll just simulate a mapping by using modulo math
          // so the player moves when their GPS moves.
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;

          const mappedX = (Math.abs(lng) * 100000) % 800; // Fake mapping
          const mappedY = (Math.abs(lat) * 100000) % 600; // Fake mapping

          handlePositionChange(mappedX, mappedY, 'down', true);
        },
        (error) => {
          console.error('Error watching position:', error);
          setGpsEnabled(false);
          alert("Could not access location. Reverting to manual movement.");
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 5000 }
      );
    }

    return () => {
      if (watchId) navigator.geolocation.clearWatch(watchId);
    };
  }, [gpsEnabled, broadcastPosition]);

  if (!mounted || !currentUser) {
    return <div className="flex h-full items-center justify-center text-white">Loading Playground...</div>;
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-black overflow-hidden">
      {/* Top HUD overlay */}
      <div className="absolute top-4 left-4 z-20 flex gap-4 pointer-events-none items-center">
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

        {/* Online Count */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-black/50 border border-gray-800 rounded-full backdrop-blur-md">
          <Users className="w-4 h-4 text-neon" />
          <span className="text-white text-xs font-bold">{onlineCount} Online</span>
        </div>

        {/* Connection Status Debug */}
        <div className={`flex items-center gap-2 px-3 py-1.5 bg-black/50 border rounded-full backdrop-blur-md ${connectionStatus === 'SUBSCRIBED' ? 'border-green-500/50' : 'border-red-500/50'}`}>
          <span className={`w-2 h-2 rounded-full ${connectionStatus === 'SUBSCRIBED' ? 'bg-green-500' : connectionStatus === 'CONNECTING' ? 'bg-yellow-500' : 'bg-red-500'}`}></span>
          <span className="text-white text-xs font-bold">{connectionStatus}</span>
        </div>

        {/* Error Message Debug */}
        {errorMsg && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-900/50 border border-red-500 rounded-full backdrop-blur-md max-w-md">
            <span className="text-white text-xs font-bold text-red-200">Error: {errorMsg}</span>
          </div>
        )}

        {/* GPS Toggle */}
        <button
          onClick={() => setGpsEnabled(!gpsEnabled)}
          className={`pointer-events-auto flex items-center gap-2 px-3 py-1.5 border rounded-full backdrop-blur-md transition-colors ${gpsEnabled
            ? 'bg-neon/20 border-neon text-white shadow-[0_0_10px_rgba(255,0,127,0.3)]'
            : 'bg-black/50 border-gray-800 text-gray-400 hover:text-white'
            }`}
        >
          {gpsEnabled ? <MapPin className="w-4 h-4" /> : <MapPinOff className="w-4 h-4" />}
          <span className="text-xs font-bold">{gpsEnabled ? 'GPS Tracking ON' : 'Use Manual (WASD)'}</span>
        </button>
      </div>

      {/* The 2D World */}
      <div className="flex-1 relative">
        <PlaygroundCanvas
          localPlayerId={currentUser.id}
          onPositionChange={handlePositionChange}
          remotePlayers={Array.from(remotePlayers.values())}
          gpsEnabled={gpsEnabled}
          localPosition={myPos}
        />
      </div>

      {/* Instructions Overlay */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center">
        {!gpsEnabled && (
          <p className="text-white/50 text-[10px] font-bold tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
            Use W A S D or Arrow Keys to Move
          </p>
        )}
      </div>
    </div>
  );
};



