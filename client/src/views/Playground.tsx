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
  
  const EMOJI_LIST = ['😂', '❤️', '🔥', '👍', '😢', '🎉', '👋', '👀', '✨', '💀'];

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
          // Only delete if it's the exact same bubble (timestamp matches)
          // to prevent deleting a newer bubble that was sent before the old one timed out
          // but just a simple delete works fine for now if we don't care about overlap edge cases
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
  }, [currentUser, sessionId]);

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
        gps_enabled: false,
        updated_at: Date.now()
      }).catch(() => {});
    }
  }, [broadcastPosition, sitState, currentUser?.id]);

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

  // 2. Geolocation Integration Removed per user request

  if (!mounted || !currentUser) {
    return <div className="flex h-full items-center justify-center text-white">Loading Playground...</div>;
  }

  return (
    <div className="relative w-full h-full flex flex-col bg-black overflow-hidden">
      {/* Instructions Overlay */}
      <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 pointer-events-none text-center">
        <p className="text-white/50 text-[10px] font-bold tracking-widest uppercase bg-black/40 px-3 py-1 rounded-full backdrop-blur-sm">
          Use W A S D or Arrow Keys to Move
        </p>
      </div>

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

        {/* Error Message Debug */}
        {errorMsg && (
          <div className="flex items-center gap-2 px-3 py-1.5 bg-red-900/50 border border-red-500 rounded-full backdrop-blur-md max-w-md">
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
        />
      </div>

      {/* Global Chat Input Bar */}
      <div className="absolute bottom-0 w-full bg-gray-900 border-t border-gray-800 p-3 z-30 flex justify-center">
        <form onSubmit={handleSendSpeechBubble} className="w-full max-w-2xl flex gap-2 relative">
          
          {/* Quick Emoji Picker */}
          {showEmojiPicker && (
            <div className="absolute bottom-full left-0 mb-2 bg-gray-800 border border-gray-700 rounded-lg p-2 shadow-2xl flex flex-wrap gap-1 w-64 z-50">
              {EMOJI_LIST.map(emoji => (
                <button
                  key={emoji}
                  type="button"
                  onClick={() => handleEmojiClick(emoji)}
                  className="text-xl hover:bg-gray-700 p-2 rounded transition-colors"
                >
                  {emoji}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className="px-4 py-2 bg-gray-800 text-xl rounded-full border border-gray-700 hover:bg-gray-700 transition-colors"
          >
            😀
          </button>

          <input
            type="text"
            value={chatInput}
            onChange={(e) => setChatInput(e.target.value)}
            placeholder="Say something to people nearby..."
            className="flex-1 bg-gray-800 text-white px-4 py-2 rounded-full border border-gray-700 focus:outline-none focus:border-neon focus:ring-1 focus:ring-neon transition-colors"
            maxLength={100}
          />
          <button 
            type="submit"
            disabled={!chatInput.trim()}
            className="px-6 py-2 bg-neon text-white font-bold rounded-full hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Say
          </button>
        </form>
      </div>
    </div>
  );
};



