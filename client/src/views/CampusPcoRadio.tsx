"use client";

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { PcoTrack, checkIsPcoAdmin, submitPcoSongRequest, updatePcoSongRequestStatus } from '../services/pcoAdmin';
import { usePcoRadioSync } from '../hooks/usePcoRadioSync';
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

  // 2. Audio Sync Hook (with admin mutation privileges passed down)
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
    togglePlayPause,
    seek,
    handleTimeUpdate,
    handleSongEnded,
    handleAudioError,
    setCurrentTrack,
    setIsPlaying,
    setCurrentTime
  } = usePcoRadioSync({ roomId: 'Campus_PCO_247', isAdmin });

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
  const addFloatingNotification = useCallback((user: string, text: string) => {
    const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    setFloatingChatMessages(prev => [...prev.slice(-2), { id, user, text }]);
    setTimeout(() => {
      setFloatingChatMessages(prev => prev.filter(item => item.id !== id));
    }, 4500);
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

  // 6. Supabase Realtime Channel & Broadcast Handlers
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase.channel('campus_pco_live_chat', {
      config: { presence: { key: currentUser?.id || `anon_${Math.random().toString(36).substring(2, 7)}` } }
    });

    const updatePresenceState = () => {
      const state = channel.presenceState();
      let total = 0;
      Object.values(state).forEach((p: any) => {
        total += (p?.length || 0);
      });
      setListenerCount(Math.max(1, total));
    };

    channel
      .on('presence', { event: 'sync' }, updatePresenceState)
      .on('presence', { event: 'join' }, updatePresenceState)
      .on('presence', { event: 'leave' }, updatePresenceState)
      .on('broadcast', { event: 'LIVE_CHAT_MSG' }, ({ payload }) => {
        if (payload?.text) {
          setMessages(prev => [...prev.slice(-99), {
            user: payload.user,
            text: payload.text,
            createdAt: payload.createdAt || Date.now()
          }]);
          addFloatingNotification(payload.user, payload.text);
        }
      })
      .on('broadcast', { event: 'PCO_PLAY_IMMEDIATELY' }, ({ payload }) => {
        if (payload?.track) {
          playTrackImmediately(payload.track);
          triggerPinnedBanner(`🔥 Now Playing: "${payload.track.song}"`);
        }
      })
      .on('broadcast', { event: 'PCO_PLAY_NEXT' }, ({ payload }) => {
        if (payload?.track) {
          playTrackNext(payload.track);
          triggerPinnedBanner(`⏭️ Queued Next: "${payload.track.song}"`);
        }
      })
      .on('broadcast', { event: 'PCO_ADD_QUEUE' }, ({ payload }) => {
        if (payload?.track) {
          addTrackToQueue(payload.track);
          triggerPinnedBanner(`➕ Added to Queue: "${payload.track.song}"`);
        }
      })
      .on('broadcast', { event: 'PCO_PLAY_STATE' }, ({ payload }) => {
        if (typeof payload?.playing === 'boolean') {
          setIsPlaying(payload.playing);
        }
      })
      .on('broadcast', { event: 'PCO_SEEK' }, ({ payload }) => {
        if (typeof payload?.time === 'number') {
          seek(payload.time);
        }
      })
      .on('broadcast', { event: 'PCO_ADMIN_SKIP' }, () => {
        triggerPinnedBanner(`⏭️ Song skipped by Admin DJ`);
        skipCurrentTrack();
      })
      .on('broadcast', { event: 'PCO_REQUEST_NOTIFICATION' }, ({ payload }) => {
        if (payload?.track) {
          triggerPinnedBanner(`📨 Song Request: "${payload.track.song}" (by ${payload.requester})`);
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            user: displayName,
            online_at: new Date().toISOString()
          });
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [
    currentUser?.id,
    displayName,
    addFloatingNotification,
    triggerPinnedBanner,
    playTrackImmediately,
    playTrackNext,
    addTrackToQueue,
    setIsPlaying,
    seek,
    skipCurrentTrack
  ]);

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

    supabase.channel('campus_pco_live_chat').send({
      type: 'broadcast',
      event: 'LIVE_CHAT_MSG',
      payload: newMsg
    });

    // Auto-scroll chat for sender
    setTimeout(() => {
      if (chatScrollRef.current) {
        chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
      }
    }, 50);
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

  // 8. Search & Song Request Submission
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(curatedRomanticTracks.slice(0, 10));
      return;
    }
    const q = searchQuery.toLowerCase();
    const filtered = curatedRomanticTracks.filter(
      t => t.song.toLowerCase().includes(q) || t.singers.toLowerCase().includes(q)
    );
    setSearchResults(filtered);
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
      if (supabase) {
        supabase.channel('campus_pco_live_chat').send({
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
      {/* 🎵 Hidden Native Audio Element */}
      <audio
        ref={audioRef}
        src={currentTrack?.media_url}
        preload="auto"
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleSongEnded}
        onError={handleAudioError}
      />

      {/* 📻 Main PCO Radio Player Viewport (Memoized, Smooth 60fps) */}
      <PcoRadioPlayer
        currentTrack={currentTrack}
        currentTime={currentTime}
        isPlaying={isPlaying}
        listenerCount={listenerCount}
        isAdmin={isAdmin}
        requestsLeft={Math.max(0, 3 - dailyRequestsUsed)}
        pinnedBanner={pinnedBanner}
        floatingChatMessages={floatingChatMessages}
        isSidebarOpen={isSidebarOpen}
        onToggleLyrics={() => setIsLyricsOpen(prev => !prev)}
        onPlayPause={togglePlayPause}
        onSkip={skipCurrentTrack}
        onSeek={isAdmin ? seek : undefined}
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)}
        onToggleAdminPanel={() => setIsAdminPanelOpen(prev => !prev)}
        onBack={() => router.push('/sparx')}
      />

      {/* 📝 3D Synced Lyrics Viewport (GPU Hardware-Accelerated) */}
      <PcoLyricsScroller
        currentTrack={currentTrack}
        currentTime={currentTime}
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
        onSeek={seek}
        canSeek={isAdmin}
      />

      {/* 🛡️ Admin DJ Floating Quick Panel */}
      {isAdmin && (
        <PcoAdminQuickPanel
          queue={queue}
          onPlayNow={(t, id) => {
            playTrackImmediately(t);
            if (id) updatePcoSongRequestStatus(id, 'approved', currentUser?.id);
            if (supabase) {
              supabase.channel('campus_pco_live_chat').send({
                type: 'broadcast',
                event: 'PCO_PLAY_IMMEDIATELY',
                payload: { track: t, senderId: currentUser?.id }
              });
            }
          }}
          onPlayNext={(t, id) => {
            playTrackNext(t);
            if (id) updatePcoSongRequestStatus(id, 'approved', currentUser?.id);
            if (supabase) {
              supabase.channel('campus_pco_live_chat').send({
                type: 'broadcast',
                event: 'PCO_PLAY_NEXT',
                payload: { track: t, senderId: currentUser?.id }
              });
            }
          }}
          onAddToQueue={(t, id) => {
            addTrackToQueue(t);
            if (id) updatePcoSongRequestStatus(id, 'approved', currentUser?.id);
            if (supabase) {
              supabase.channel('campus_pco_live_chat').send({
                type: 'broadcast',
                event: 'PCO_ADD_QUEUE',
                payload: { track: t, senderId: currentUser?.id }
              });
            }
          }}
          onRemoveFromQueue={removeFromQueue}
          onSkipCurrent={() => {
            skipCurrentTrack();
            if (supabase) {
              supabase.channel('campus_pco_live_chat').send({
                type: 'broadcast',
                event: 'PCO_ADMIN_SKIP',
                payload: {}
              });
            }
          }}
          onBroadcastBanner={(text) => {
            triggerPinnedBanner(text);
          }}
          onReturnToAuto={returnToAuto}
          mode={mode}
          currentTrack={currentTrack}
          adminUserId={currentUser?.id}
          isOpen={isAdminPanelOpen}
          onToggle={() => setIsAdminPanelOpen(prev => !prev)}
        />
      )}

      {/* 💬 Mobile / Desktop Side Panel Drawer for Requests & Chat */}
      <BottomSheet
        open={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        height="80dvh"
      >
        <div 
          onTouchStart={e => e.stopPropagation()}
          className="flex flex-col h-full max-h-[80dvh] bg-[#0d0716] text-white overflow-hidden"
        >
          {/* Top Bar: Swipe Down Affordance Pill + Quota Status */}
          <div className="pt-2 pb-1.5 px-4 bg-purple-950/30 border-b border-white/10 flex flex-col gap-2 shrink-0">
            <div className="flex justify-center">
              <div className="w-12 h-1 rounded-full bg-white/25" />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-pink-300 font-bold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                <span>Campus Airwaves</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full border border-pink-500/30">
                  {isAdmin ? 'DJ Admin (Unlimited)' : `${Math.max(0, 3 - dailyRequestsUsed)} reqs left today`}
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-1 text-white/50 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Segmented Tab Switcher */}
          <div className="flex items-center border-b border-white/10 px-3 bg-black/40 shrink-0">
            <button
              onClick={() => setMobilePcoTab('request')}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-center transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                mobilePcoTab === 'request'
                  ? 'border-pink-500 text-pink-400 bg-pink-500/5'
                  : 'border-transparent text-white/50 hover:text-white/80'
              }`}
            >
              <Music className="w-3.5 h-3.5" />
              <span>Song Requests</span>
            </button>

            <button
              onClick={() => setMobilePcoTab('chat')}
              className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-center transition-all border-b-2 flex items-center justify-center gap-1.5 ${
                mobilePcoTab === 'chat'
                  ? 'border-pink-500 text-pink-400 bg-pink-500/5'
                  : 'border-transparent text-white/50 hover:text-white/80'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Live Campus Chat</span>
              {messages.length > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse" />
              )}
            </button>
          </div>

          {/* Request Status Feedback Alert */}
          {requestStatusMsg && (
            <div className={`px-4 py-2 text-xs flex items-center gap-2 font-bold shrink-0 ${
              requestStatusMsg.type === 'success' ? 'bg-emerald-500/20 text-emerald-300 border-b border-emerald-500/30' : 'bg-rose-500/20 text-rose-300 border-b border-rose-500/30'
            }`}>
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{requestStatusMsg.text}</span>
            </div>
          )}

          {/* TAB 1: SONG REQUESTS */}
          {mobilePcoTab === 'request' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {/* Search Bar for Song Requests */}
              <div className="p-3 border-b border-white/10 bg-black/30 shrink-0">
                <div className="relative">
                  <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search romantic songs to request..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
                  />
                </div>

                {/* Quick Filter Tags */}
                <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none mt-2">
                  {trendingRomanticQueries.slice(0, 5).map((tag, i) => (
                    <button
                      key={i}
                      onClick={() => setSearchQuery(tag)}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white rounded-lg text-[9px] whitespace-nowrap shrink-0 transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Scrollable Song Catalog */}
              <div 
                data-sheet-scroll
                className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-2 custom-scrollbar"
                style={{ touchAction: 'pan-y' }}
              >
                <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {searchQuery ? 'Search Results' : 'Recommended Songs'}
                </h4>
                <div className="space-y-1.5">
                  {searchResults.map(track => (
                    <div
                      key={track.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-purple-950/30 transition-colors border border-white/5"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <img
                          src={track.image}
                          alt={track.song}
                          className="w-9 h-9 rounded-lg object-cover shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white truncate">{track.song}</p>
                          <p className="text-[10px] text-gray-400 truncate">{track.singers}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {isAdmin ? (
                          <>
                            <button
                              onClick={() => playTrackImmediately(track)}
                              className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold rounded-lg active:scale-95 transition-transform"
                              title="Play Immediately"
                            >
                              Play Now
                            </button>
                            <button
                              onClick={() => addTrackToQueue(track)}
                              className="px-2 py-1 bg-white/10 hover:bg-white/20 text-white text-[10px] font-bold rounded-lg active:scale-95 transition-transform"
                              title="Add to Queue"
                            >
                              + Queue
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleRequestSong(track)}
                            disabled={isRequestSubmitting || (!isAdmin && dailyRequestsUsed >= 3)}
                            className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 text-white text-[10px] font-bold rounded-lg flex items-center gap-1 active:scale-95 transition-transform shadow-sm"
                          >
                            <PlusCircle className="w-3 h-3" />
                            <span>Request</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: LIVE CHAT */}
          {mobilePcoTab === 'chat' && (
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              <div 
                ref={chatScrollRef} 
                data-sheet-scroll
                className="flex-1 overflow-y-auto overscroll-contain p-3 space-y-2.5 custom-scrollbar"
                style={{ touchAction: 'pan-y' }}
              >
                {messages.length === 0 ? (
                  <div className="text-center py-16 text-xs text-gray-500 flex flex-col items-center gap-2">
                    <MessageSquare className="w-6 h-6 text-gray-600" />
                    <span>No messages yet. Say hello to the campus airwaves!</span>
                  </div>
                ) : (
                  messages.map((m, idx) => (
                    <div key={idx} className="bg-white/5 p-2.5 rounded-xl text-xs flex flex-col gap-0.5 border border-white/5">
                      <div className="flex items-center justify-between text-[10px] text-pink-400 font-bold">
                        <span>{m.user}</span>
                        <span className="text-gray-500 font-mono text-[9px]">
                          {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-gray-200 text-xs break-words leading-relaxed">{m.text}</p>
                    </div>
                  ))
                )}
              </div>

              {/* Chat Input Form (pinned bottom with safe-area spacing) */}
              <form 
                onSubmit={handleSendMessage} 
                className="flex items-center gap-2 p-3 border-t border-white/10 bg-black/60 shrink-0 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]"
              >
                <input
                  type="text"
                  placeholder="Chat with listeners..."
                  value={chatInput}
                  onChange={e => setChatInput(e.target.value)}
                  maxLength={160}
                  className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500 transition-colors"
                />
                <button
                  type="submit"
                  disabled={!chatInput.trim()}
                  className="p-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 disabled:opacity-40 text-white rounded-xl active:scale-95 transition-transform shadow-md"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          )}
        </div>
      </BottomSheet>
    </div>
  );
};

export default CampusPcoRadio;
