"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { PcoTrack, checkIsPcoAdmin, submitPcoSongRequest, updatePcoSongRequestStatus, getServerTimeMs } from '../services/pcoAdmin';
import { useMusicPlayer } from '../context/MusicPlayerContext';
import { YouTubeMusicLayout } from '../components/YouTubeMusicLayout';
import { PcoRadioPlayer } from '../components/PcoRadioPlayer';
import { PcoLyricsScroller } from '../components/PcoLyricsScroller';
import { PcoAdminQuickPanel } from '../components/PcoAdminQuickPanel';
import { BottomSheet } from '../components/BottomSheet';
import { Search, Send, PlusCircle, Sparkles, AlertCircle, MessageSquare, Music, X } from 'lucide-react';
import { curatedRomanticTracks, trendingRomanticQueries } from '../data/pcoRomanticTracks';

interface ChatMessage {
  user: string;
  text: string;
  createdAt: number;
}

/**
 * Dedicated Campus PCO Radio (Sparx FM 24/7) View.
 * Fully decoupled from WebRTC PeerJS logic to deliver buttery 60fps playback without memory leaks.
 */
export const CampusPcoRadio: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();

  // 1. Admin & Presence State
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [listenerCount, setListenerCount] = useState<number>(1);
  const [dailyRequestsUsed, setDailyRequestsUsed] = useState<number>(0);
  const [pinnedBanner, setPinnedBanner] = useState<{ text: string; expiresAt: number } | null>(null);
  const [incomingReaction, setIncomingReaction] = useState<{ emoji: string; id: string } | null>(null);

  // 2. Global Persistent Audio Player Context (keeps playing smoothly across all main nav route transitions)
  const {
    currentTrack,
    currentTime,
    duration,
    isPlaying,
    mode,
    queue,
    playTrackImmediately,
    playTrackNext,
    addTrackToQueue,
    removeFromQueue,
    returnToAuto,
    skipCurrentTrack,
    togglePlayPause,
    seek,
    setCurrentTrack,
    setIsPlaying,
    setCurrentTime,
    setIsAdmin: setContextIsAdmin,
    startMusic
  } = useMusicPlayer();

  useEffect(() => {
    startMusic();
  }, [startMusic]);

  // 3. UI Panels & Drawers
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [mobilePcoTab, setMobilePcoTab] = useState<'request' | 'chat'>('request');

  // 4. Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [floatingChatMessages, setFloatingChatMessages] = useState<{ id: string; user: string; text: string }[]>([]);
  const lastChatSentTimeRef = useRef<number>(0);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const chatMountedRef = useRef<boolean>(false);

  // 5. Song Request & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PcoTrack[]>([]);
  const [isRequestSubmitting, setIsRequestSubmitting] = useState(false);
  const [requestStatusMsg, setRequestStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const displayName = currentUser?.realName || currentUser?.anonymousId || 'Campus Listener';

  // Stable ref so the realtime channel is NOT rebuilt when displayName changes
  // (rebuilding causes presence flicker + missed messages mid-reconnect)
  const displayNameRef = useRef(displayName);
  useEffect(() => {
    displayNameRef.current = displayName;
  }, [displayName]);

  // Verify Admin Permissions
  useEffect(() => {
    let isMounted = true;
    const verifyAdmin = async () => {
      let authEmail: string | null = null;
      if (supabase) {
        try {
          const { data } = await supabase.auth.getUser();
          authEmail = data?.user?.email || null;
        } catch (_) {}
      }
      const hasAdmin = await checkIsPcoAdmin(currentUser, authEmail);
      if (isMounted) {
        setIsAdmin(hasAdmin);
        setContextIsAdmin(hasAdmin);
      }
    };
    verifyAdmin();
    return () => { isMounted = false; };
  }, [currentUser]);

  // Load Daily Request Quota from LocalStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const todayStr = new Date().toISOString().split('T')[0];
      const key = `pco_req_${todayStr}`;
      setDailyRequestsUsed(parseInt(localStorage.getItem(key) || '0', 10));
    }
  }, []);

  const incrementDailyRequests = useCallback(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const key = `pco_req_${todayStr}`;
    setDailyRequestsUsed(prev => {
      const next = prev + 1;
      localStorage.setItem(key, next.toString());
      return next;
    });
  }, []);

  // Floating notifications dismiss timer
  const notificationTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const addFloatingNotification = useCallback((user: string, text: string) => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setFloatingChatMessages(prev => [...prev.slice(-2), { id, user, text }]);
    const timer = setTimeout(() => {
      notificationTimersRef.current.delete(id);
      setFloatingChatMessages(prev => prev.filter(item => item.id !== id));
    }, 4500);
    notificationTimersRef.current.set(id, timer);
  }, []);

  // Clean up any pending notification timers on unmount
  useEffect(() => {
    const timers = notificationTimersRef.current;
    return () => {
      timers.forEach(t => clearTimeout(t));
      timers.clear();
    };
  }, []);

  // Trigger Pinned Banner
  const triggerPinnedBanner = useCallback((text: string) => {
    setPinnedBanner({ text, expiresAt: Date.now() + 12000 });
  }, []);

  // Banner Expiry Interval
  useEffect(() => {
    if (!pinnedBanner) return;
    const interval = setInterval(() => {
      if (Date.now() >= pinnedBanner.expiresAt) {
        setPinnedBanner(null);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [pinnedBanner]);

  // Stable refs for Realtime broadcast handlers to eliminate reconnection storms
  const liveChannelRef = useRef<any>(null);
  const anonymousIdRef = useRef(`anon_${Math.random().toString(36).substring(2, 9)}`);
  const presenceKey = currentUser?.id || anonymousIdRef.current;

  const handlersRef = useRef({
    playTrackImmediately,
    playTrackNext,
    addTrackToQueue,
    setIsPlaying,
    seek,
    skipCurrentTrack,
    triggerPinnedBanner,
    addFloatingNotification
  });

  useEffect(() => {
    handlersRef.current = {
      playTrackImmediately,
      playTrackNext,
      addTrackToQueue,
      setIsPlaying,
      seek,
      skipCurrentTrack,
      triggerPinnedBanner,
      addFloatingNotification
    };
  });

  // 6. Supabase Realtime Channel & Broadcast Handlers (Created ONCE per user/session)
  useEffect(() => {
    if (!supabase) return;

    // Clean up any stale or existing channel with the same topic before subscribing
    const existing = supabase.getChannels().find((c: any) => c.topic === 'realtime:campus_pco_live_chat' || c.topic === 'campus_pco_live_chat');
    if (existing) {
      supabase.removeChannel(existing);
    }

    const channel = supabase.channel('campus_pco_live_chat', {
      config: { presence: { key: presenceKey } }
    });
    liveChannelRef.current = channel;

    const updatePresenceState = () => {
      const state = channel.presenceState();
      // Count unique presence keys so single user/tabs don't cause 1->2 flickering
      const uniqueUsers = Object.keys(state).length;
      setListenerCount(Math.max(1, uniqueUsers));
    };

    channel
      .on('presence', { event: 'sync' }, updatePresenceState)
      .on('presence', { event: 'join' }, updatePresenceState)
      .on('presence', { event: 'leave' }, updatePresenceState)
      .on('broadcast', { event: 'LIVE_REACTION' }, ({ payload }) => {
        if (payload?.emoji) {
          setIncomingReaction({ emoji: payload.emoji, id: `${Date.now()}-${Math.random()}` });
        }
      })
      .on('broadcast', { event: 'LIVE_CHAT_MSG' }, ({ payload }) => {
        if (payload?.text) {
          setMessages(prev => [...prev.slice(-99), {
            user: payload.user,
            text: payload.text,
            createdAt: payload.createdAt || Date.now()
          }]);
          handlersRef.current.addFloatingNotification(payload.user, payload.text);
        }
      })
      .on('broadcast', { event: 'PCO_PLAY_IMMEDIATELY' }, ({ payload }) => {
        if (payload?.track) {
          // Pass the DJ's authoritative start time so the listener starts AT
          // the DJ's position (minus a tiny lead), not at their receive time.
          handlersRef.current.playTrackImmediately(payload.track, payload.startedAtMs);
          handlersRef.current.triggerPinnedBanner(`🔥 Now Playing: "${payload.track.song}"`);
        }
      })
      .on('broadcast', { event: 'PCO_PLAY_NEXT' }, ({ payload }) => {
        if (payload?.track) {
          handlersRef.current.playTrackNext(payload.track);
          handlersRef.current.triggerPinnedBanner(`⏭️ Queued Next: "${payload.track.song}"`);
        }
      })
      .on('broadcast', { event: 'PCO_ADD_QUEUE' }, ({ payload }) => {
        if (payload?.track) {
          handlersRef.current.addTrackToQueue(payload.track);
          handlersRef.current.triggerPinnedBanner(`➕ Added to Queue: "${payload.track.song}"`);
        }
      })
      .on('broadcast', { event: 'PCO_PLAY_STATE' }, ({ payload }) => {
        if (typeof payload?.playing === 'boolean') {
          handlersRef.current.setIsPlaying(payload.playing);
        }
      })
      .on('broadcast', { event: 'PCO_SEEK' }, ({ payload }) => {
        if (typeof payload?.time === 'number') {
          handlersRef.current.seek(payload.time);
        }
      })
      .on('broadcast', { event: 'PCO_ADMIN_SKIP' }, () => {
        handlersRef.current.triggerPinnedBanner(`⏭️ Song skipped by Admin DJ`);
        handlersRef.current.skipCurrentTrack();
      })
      .on('broadcast', { event: 'PCO_REQUEST_NOTIFICATION' }, () => {
        // Requests appear directly inside the Admin DJ Panel tab without flashing on screen
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          try {
            await channel.track({
              user: displayNameRef.current,
              online_at: new Date().toISOString()
            });
          } catch (_) {}
        }
      });

    return () => {
      supabase.removeChannel(channel);
      liveChannelRef.current = null;
    };
  }, [presenceKey]);

  // 7. Chat Send with Anti-Spam Rate Limit
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !supabase) return;

    const now = Date.now();
    if (now - lastChatSentTimeRef.current < 1200) {
      return; // Prevent fast spam bursts
    }
    lastChatSentTimeRef.current = now;

    const newMsg = {
      user: displayName,
      text: chatInput.trim(),
      createdAt: now
    };

    setMessages(prev => [...prev.slice(-99), newMsg]);
    setChatInput('');
    addFloatingNotification(newMsg.user, newMsg.text);

    if (liveChannelRef.current) {
      liveChannelRef.current.send({
        type: 'broadcast',
        event: 'LIVE_CHAT_MSG',
        payload: newMsg
      });
    } else {
      supabase.channel('campus_pco_live_chat').send({
        type: 'broadcast',
        event: 'LIVE_CHAT_MSG',
        payload: newMsg
      });
    }

    // Auto-scroll chat for sender
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 50);
  };

  const handleSendReaction = (emoji: string) => {
    if (!liveChannelRef.current) return;
    liveChannelRef.current.send({
      type: 'broadcast',
      event: 'LIVE_REACTION',
      payload: { emoji, user: displayName }
    });
  };

  // Auto-scroll chat on incoming messages or tab switch without yanking if user scrolled up
  useEffect(() => {
    if (mobilePcoTab === 'chat') {
      if (!chatMountedRef.current) {
        // First time opening or switching to chat tab: Force scroll to bottom
        if (chatScrollRef.current) {
          chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
        }
        chatMountedRef.current = true;
      } else {
        // Already open: Only auto-scroll if user is resting near the bottom
        if (chatScrollRef.current) {
          const { scrollHeight, scrollTop, clientHeight } = chatScrollRef.current;
          if (scrollHeight - scrollTop - clientHeight < 60) {
            chatScrollRef.current.scrollTop = scrollHeight;
          }
        }
      }
    } else {
      // User switched away from chat tab, reset so next mount scrolls to bottom
      chatMountedRef.current = false;
    }
  }, [messages, mobilePcoTab]);

  // 8. Search & Song Request Submission (Local curated fast-match + live API fallback)
  const searchAbortRef = useRef<AbortController | null>(null);
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(curatedRomanticTracks.slice(0, 10));
      return;
    }
    const q = searchQuery.toLowerCase();
    const localFiltered = curatedRomanticTracks.filter(
      t => t.song.toLowerCase().includes(q) || t.singers.toLowerCase().includes(q)
    );

    if (localFiltered.length > 0) {
      setSearchResults(localFiltered);
    }

    // Debounced online search with abort + stale-guard so a slow earlier
    // request can never overwrite results from a newer query
    const controller = new AbortController();
    searchAbortRef.current = controller;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://saavnapi-nine.vercel.app/result/?query=${encodeURIComponent(searchQuery)}`, {
          signal: controller.signal
        });
        const data = await res.json();
        if (controller.signal.aborted) return;
        if (Array.isArray(data) && data.length > 0) {
          const apiTracks: PcoTrack[] = data
            .slice(0, 10)
            .map((x: any) => ({
              id: String(x.id || `api_${Math.random()}`),
              song: (x.song || x.title || 'Untitled').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&'),
              singers: (x.singers || x.primary_artists || x.artist || 'Unknown').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&'),
              image: x.image || 'https://c.saavncdn.com/221/Soulful-Hits-Hindi-2026-20260529163806-500x500.jpg',
              media_url: x.media_url || '',
              duration: String(x.duration || 240)
            }))
            .filter((x: PcoTrack) => x.media_url);

          if (apiTracks.length > 0 && !controller.signal.aborted) {
            setSearchResults(apiTracks);
          }
        }
      } catch (err: any) {
        if (err?.name !== 'AbortError') {
          console.warn('[PCO Request] Search API fallback error:', err);
        }
      }
    }, 400);

    return () => {
      clearTimeout(timer);
      controller.abort();
      searchAbortRef.current = null;
    };
  }, [searchQuery]);

  const handleRequestSong = async (track: PcoTrack) => {
    if (!isAdmin && dailyRequestsUsed >= 3) {
      setRequestStatusMsg({
        type: 'error',
        text: 'Daily request quota reached (3/3). Come back tomorrow!'
      });
      setTimeout(() => setRequestStatusMsg(null), 4000);
      return;
    }

    setIsRequestSubmitting(true);
    const res = await submitPcoSongRequest(track, currentUser, displayName);
    setIsRequestSubmitting(false);

    if (res.success) {
      incrementDailyRequests();
      setRequestStatusMsg({
        type: 'success',
        text: `Requested "${track.song}"! Sent to Admin DJ console.`
      });
      // Broadcast song request notice
      // SCALING FIX: route admin notifications to the dedicated admin channel.
      // Broadcasting 'PCO_REQUEST_NOTIFICATION' to all N listeners wasted an
      // O(N) fan-out per request when only the DJ console consumes it.
      if (supabase && liveChannelRef.current) {
        liveChannelRef.current.send({
          type: 'broadcast',
          event: 'PCO_REQUEST_NOTIFICATION',
          payload: {
            requester: displayName,
            track,
            requestId: res.data?.id
          }
        });
      }
    } else {
      setRequestStatusMsg({
        type: 'error',
        text: res.error || 'Failed to submit song request.'
      });
    }

    setTimeout(() => setRequestStatusMsg(null), 4000);
  };

  return (
    <div className="relative w-full h-[100svh] bg-black text-white overflow-hidden select-none font-sans">
      {/* 📺 Full YouTube Music Experience (Video / Synced Lyrics / Live Chat / Song Request) */}
      <YouTubeMusicLayout
        currentTrack={currentTrack}
        currentTime={currentTime}
        duration={duration}
        isPlaying={isPlaying}
        isAdmin={isAdmin}
        roomName="Sparx FM 24/7"
        activePlaylistTitle="10s Bollywood Romance Hits"
        queue={queue && queue.length > 0 ? queue : curatedRomanticTracks.slice(0, 25)}
        messages={messages}
        listenerCount={listenerCount}
        incomingReaction={incomingReaction}
        onPlayPause={togglePlayPause}
        onSkip={skipCurrentTrack}
        onPrevious={() => seek(0)}
        onSeek={isAdmin ? seek : undefined}
        onSelectTrack={(track, playNow) => {
          const pcoTrack: PcoTrack = {
            id: track.id,
            song: track.song,
            singers: track.singers,
            image: track.image,
            media_url: track.media_url || '',
            duration: track.duration
          };
          if (isAdmin && playNow) {
            playTrackImmediately(pcoTrack);
          } else {
            handleRequestSong(pcoTrack);
          }
        }}
        onSendMessage={(text) => {
          if (!text.trim() || !supabase) return;
          const newMsg = { user: displayName, text: text.trim(), createdAt: Date.now() };
          setMessages(prev => [...prev.slice(-99), newMsg]);
          liveChannelRef.current?.send({
            type: 'broadcast',
            event: 'LIVE_CHAT_MSG',
            payload: newMsg
          });
        }}
        onRequestSong={(track) => {
          handleRequestSong({
            id: track.id,
            song: track.song,
            singers: track.singers,
            image: track.image,
            media_url: track.media_url || '',
            duration: track.duration
          });
        }}
        onSendReaction={handleSendReaction}
        onLeave={() => router.push('/sparx')}
        onAdminPlayNow={async (t, id) => {
          const pcoTrack: PcoTrack = {
            id: t.id,
            song: t.song,
            singers: t.singers,
            image: t.image,
            media_url: t.media_url || '',
            duration: t.duration
          };
          const startAtMs = await getServerTimeMs();
          playTrackImmediately(pcoTrack, startAtMs);
          triggerPinnedBanner(`🔥 Now Playing: "${t.song}"`);
          if (id) updatePcoSongRequestStatus(id, 'approved', currentUser?.id);
          liveChannelRef.current?.send({
            type: 'broadcast',
            event: 'PCO_PLAY_IMMEDIATELY',
            payload: { track: pcoTrack, startedAtMs: startAtMs, senderId: currentUser?.id }
          });
        }}
        onAdminPlayNext={(t, id) => {
          const pcoTrack: PcoTrack = {
            id: t.id,
            song: t.song,
            singers: t.singers,
            image: t.image,
            media_url: t.media_url || '',
            duration: t.duration
          };
          playTrackNext(pcoTrack);
          triggerPinnedBanner(`⏭️ Queued Next: "${t.song}"`);
          if (id) updatePcoSongRequestStatus(id, 'approved', currentUser?.id);
          liveChannelRef.current?.send({
            type: 'broadcast',
            event: 'PCO_PLAY_NEXT',
            payload: { track: pcoTrack, senderId: currentUser?.id }
          });
        }}
        onAdminAddToQueue={(t, id) => {
          const pcoTrack: PcoTrack = {
            id: t.id,
            song: t.song,
            singers: t.singers,
            image: t.image,
            media_url: t.media_url || '',
            duration: t.duration
          };
          addTrackToQueue(pcoTrack);
          triggerPinnedBanner(`➕ Added to Queue: "${t.song}"`);
          if (id) updatePcoSongRequestStatus(id, 'approved', currentUser?.id);
          liveChannelRef.current?.send({
            type: 'broadcast',
            event: 'PCO_ADD_QUEUE',
            payload: { track: pcoTrack, senderId: currentUser?.id }
          });
        }}
        onAdminRejectRequest={(id) => {
          updatePcoSongRequestStatus(id, 'declined', currentUser?.id);
          triggerPinnedBanner(`Declined request`);
        }}
      />

      {/* 🛡️ Admin DJ Floating Quick Panel */}
      {isAdmin && (
        <PcoAdminQuickPanel
          queue={queue}
          onPlayNow={async (t, id) => {
            const startAtMs = await getServerTimeMs();
            playTrackImmediately(t, startAtMs);
            triggerPinnedBanner(`🔥 Now Playing: "${t.song}"`);
            if (id) updatePcoSongRequestStatus(id, 'approved', currentUser?.id);
            liveChannelRef.current?.send({
              type: 'broadcast',
              event: 'PCO_PLAY_IMMEDIATELY',
              payload: { track: t, startedAtMs: startAtMs, senderId: currentUser?.id }
            });
          }}
          onPlayNext={(t, id) => {
            playTrackNext(t);
            triggerPinnedBanner(`⏭️ Queued Next: "${t.song}"`);
            if (id) updatePcoSongRequestStatus(id, 'approved', currentUser?.id);
            liveChannelRef.current?.send({
              type: 'broadcast',
              event: 'PCO_PLAY_NEXT',
              payload: { track: t, senderId: currentUser?.id }
            });
          }}
          onAddToQueue={(t, id) => {
            addTrackToQueue(t);
            triggerPinnedBanner(`➕ Added to Queue: "${t.song}"`);
            if (id) updatePcoSongRequestStatus(id, 'approved', currentUser?.id);
            liveChannelRef.current?.send({
              type: 'broadcast',
              event: 'PCO_ADD_QUEUE',
              payload: { track: t, senderId: currentUser?.id }
            });
          }}
          onRemoveFromQueue={removeFromQueue}
          onSkipCurrent={() => {
            skipCurrentTrack();
            triggerPinnedBanner(`⏭️ Song skipped by Admin DJ`);
            liveChannelRef.current?.send({
              type: 'broadcast',
              event: 'PCO_ADMIN_SKIP',
              payload: {}
            });
          }}
          onBroadcastBanner={(text) => triggerPinnedBanner(text)}
          onReturnToAuto={returnToAuto}
          mode={mode}
          currentTrack={currentTrack}
          adminUserId={currentUser?.id}
          isOpen={isAdminPanelOpen}
          onToggle={() => setIsAdminPanelOpen(prev => !prev)}
        />
      )}
    </div>
  );
};

export default CampusPcoRadio;
