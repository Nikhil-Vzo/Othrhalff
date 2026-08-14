import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '../context/AuthContext';
import { usePresence } from '../context/PresenceContext';
import { supabase } from '../lib/supabase';
import { 
  Heart, SkipForward, MessageSquare, Video, Send, 
  ArrowLeft, Globe, School, Sparkles, RefreshCw, Zap
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const VideoCall = dynamic<any>(
  () => import('../components/VideoCall').then(mod => mod.VideoCall),
  { ssr: false }
);

type DiscoverState = 'IDLE' | 'SEARCHING' | 'CONNECTING' | 'CONNECTED' | 'MATCHED';
type DiscoverMode = 'TEXT' | 'VIDEO';
type DiscoverScope = 'CAMPUS' | 'GLOBAL';

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export const Discover: React.FC = () => {
  const { currentUser } = useAuth();
  const { totalOnlineCount } = usePresence();
  const router = useRouter();

  // Mode and Scope
  const [mode, setMode] = useState<DiscoverMode>('TEXT');
  const [scope, setScope] = useState<DiscoverScope>(() => currentUser?.university ? 'CAMPUS' : 'GLOBAL');
  const [state, setState] = useState<DiscoverState>('IDLE');
  
  // Realtime channel and metrics — initialize with 1 minimum
  const [channel, setChannel] = useState<any>(null);
  const [activeUsersCount, setActiveUsersCount] = useState<number>(1);
  const [searchTime, setSearchTime] = useState(0);

  // Active call/session details
  const [callInfo, setCallInfo] = useState<{
    appId: string;
    channelName: string;
    token: string;
    partnerId: string;
    partnerName: string;
    partnerAvatar: string;
    partnerUniversity?: string;
  } | null>(null);

  // Text Chat State
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const partnerTypingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isPartnerDisconnected, setIsPartnerDisconnected] = useState(false);

  // Like State
  const [hasLiked, setHasLiked] = useState(false);
  const [partnerLiked, setPartnerLiked] = useState(false);

  // Recent skipped partners to avoid immediate re-matching
  const recentSkippedPartnersRef = useRef<Map<string, number>>(new Map());

  // Refs for current values in callbacks/effects
  const stateRef = useRef(state);
  const modeRef = useRef(mode);
  const scopeRef = useRef(scope);
  const callInfoRef = useRef(callInfo);
  const channelRef = useRef<any>(null);
  const isSubscribedRef = useRef(false);
  
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { scopeRef.current = scope; }, [scope]);
  useEffect(() => { callInfoRef.current = callInfo; }, [callInfo]);
  useEffect(() => { channelRef.current = channel; }, [channel]);

  // Clean recent skipped cache periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      recentSkippedPartnersRef.current.forEach((expireTime, id) => {
        if (now > expireTime) {
          recentSkippedPartnersRef.current.delete(id);
        }
      });
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  // Search Timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (state === 'SEARCHING') {
      timer = setInterval(() => {
        setSearchTime(prev => prev + 1);
      }, 1000);
    } else {
      setSearchTime(0);
    }
    return () => clearInterval(timer);
  }, [state]);

  const chatInputRef = useRef<HTMLInputElement>(null);

  // Auto scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  // Auto focus input on text chat connection
  useEffect(() => {
    if (state === 'CONNECTED' && mode === 'TEXT' && !isPartnerDisconnected) {
      chatInputRef.current?.focus();
    }
  }, [state, mode, isPartnerDisconnected]);

  // Safe Broadcast Helper
  const safeBroadcast = useCallback((event: string, payload: any) => {
    if (!channelRef.current || !isSubscribedRef.current) return;
    try {
      channelRef.current.send({
        type: 'broadcast',
        event,
        payload
      }).catch((err: any) => {
        console.warn(`[Discover] broadcast warn for ${event}:`, err);
      });
    } catch (err) {
      console.warn(`[Discover] broadcast err for ${event}:`, err);
    }
  }, []);

  // Cleanup helper (Idempotent)
  const cleanupAndResetState = useCallback((nextState: DiscoverState = 'SEARCHING') => {
    setHasLiked(false);
    setPartnerLiked(false);
    setCallInfo(null);
    setMessages([]);
    setChatInput('');
    setIsPartnerTyping(false);
    setIsPartnerDisconnected(false);
    setState(nextState);
  }, []);

  // Skip partner
  const handleSkip = useCallback(() => {
    if (callInfoRef.current) {
      const partnerId = callInfoRef.current.partnerId;
      recentSkippedPartnersRef.current.set(partnerId, Date.now() + 25000); // Avoid for 25s
      safeBroadcast('SKIP', { targetId: partnerId });
    }
    cleanupAndResetState('SEARCHING');
  }, [cleanupAndResetState, safeBroadcast]);

  // Like partner
  const handleLike = useCallback(async () => {
    if (hasLiked || !callInfoRef.current || !currentUser) return;
    setHasLiked(true);
    
    safeBroadcast('LIKE', { targetId: callInfoRef.current.partnerId });

    if (partnerLiked) {
      setState('MATCHED');
      try {
        await supabase.from('swipes').upsert({
          liker_id: currentUser.id,
          target_id: callInfoRef.current.partnerId,
          action: 'like',
          created_at: new Date().toISOString()
        }, { onConflict: 'liker_id, target_id' });
      } catch (err) {
        console.warn('Error saving mutual match:', err);
      }
    }
  }, [hasLiked, partnerLiked, currentUser, safeBroadcast]);

  // Mutual match reaction
  useEffect(() => {
    if (hasLiked && partnerLiked && state === 'CONNECTED' && currentUser && callInfoRef.current) {
      setState('MATCHED');
      const partnerId = callInfoRef.current.partnerId;
      (async () => {
        try {
          await supabase.from('swipes').upsert({
            liker_id: currentUser.id,
            target_id: partnerId,
            action: 'like',
            created_at: new Date().toISOString()
          }, { onConflict: 'liker_id, target_id' });
        } catch (err) {
          console.warn('Error saving mutual swipe:', err);
        }
      })();
    }
  }, [hasLiked, partnerLiked, state, currentUser]);

  // Send text message
  const myTypingTimerRef = useRef<NodeJS.Timeout | null>(null);

  const handleSendMessage = useCallback((textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : chatInput;
    if (!text.trim() || !callInfoRef.current || !currentUser || isPartnerDisconnected) return;

    if (myTypingTimerRef.current) clearTimeout(myTypingTimerRef.current);

    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderId: currentUser.id,
      text: text.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    if (textToSend === undefined) setChatInput('');

    safeBroadcast('CHAT_MESSAGE', {
      targetId: callInfoRef.current.partnerId,
      message: newMessage
    });

    safeBroadcast('TYPING_STOP', { targetId: callInfoRef.current.partnerId });
  }, [chatInput, currentUser, isPartnerDisconnected, safeBroadcast]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    if (!callInfoRef.current) return;
    
    safeBroadcast('TYPING_START', { targetId: callInfoRef.current.partnerId });

    if (myTypingTimerRef.current) clearTimeout(myTypingTimerRef.current);
    myTypingTimerRef.current = setTimeout(() => {
      if (callInfoRef.current) {
        safeBroadcast('TYPING_STOP', { targetId: callInfoRef.current.partnerId });
      }
    }, 1500);
  };

  // Keyboard shortcut listener for Omegle-style navigation (ESC to skip)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (stateRef.current === 'CONNECTED') {
        if (e.key === 'Escape') {
          e.preventDefault();
          handleSkip();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSkip]);

  // =========================================================================
  // DEDICATED POOL PRESENCE SYNC (Exact Real Pool Count)
  // =========================================================================
  const syncPoolPresence = useCallback((activeChannel: any) => {
    if (!activeChannel) return [];
    try {
      const stateTree = activeChannel.presenceState();
      const allUsers = Object.keys(stateTree).map(key => stateTree[key]?.[0] as any).filter(Boolean);
      
      const realPoolCount = Math.max(allUsers.length, 1);
      setActiveUsersCount(realPoolCount);
      return allUsers;
    } catch (e) {
      return [];
    }
  }, []);

  // =========================================================================
  // SERVER-AUTHORITATIVE ATOMIC MATCHMAKING QUEUE (Instant <100ms Pairing with Exponential Backoff)
  // =========================================================================
  useEffect(() => {
    if (state !== 'SEARCHING' || !currentUser) return;

    let isPolling = true;
    let pollTimeout: NodeJS.Timeout;
    let delay = 400; // Start fast at 400ms
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';

    const pollQueue = async () => {
      if (!isPolling || stateRef.current !== 'SEARCHING') return;
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await fetch(`${apiUrl}/api/matchmaking/queue`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(session?.access_token ? { 'Authorization': `Bearer ${session.access_token}` } : {})
          },
          body: JSON.stringify({
            userId: currentUser.id,
            name: currentUser.realName || currentUser.anonymousId || 'Anonymous Student',
            avatar: currentUser.avatar || '',
            university: currentUser.university || '',
            mode: modeRef.current,
            scope: scopeRef.current,
            recentPartners: Array.from(recentSkippedPartnersRef.current.keys())
          })
        });

        if (res.ok) {
          const data = await res.json();
          if (data.status === 'MATCHED' && stateRef.current === 'SEARCHING') {
            console.log('[Matchmaking] Server matched partner:', data.partnerName);
            setCallInfo({
              appId: data.appId || '',
              channelName: data.channelName,
              token: data.token || '',
              partnerId: data.partnerId,
              partnerName: data.partnerName,
              partnerAvatar: data.partnerAvatar,
              partnerUniversity: data.partnerUniversity
            });
            setIsPartnerDisconnected(false);
            setMessages([]);
            setHasLiked(false);
            setPartnerLiked(false);
            setState('CONNECTED');
            return;
          }
        }
      } catch (err) {
        console.warn('[Matchmaking] Queue poll warn:', err);
      }

      if (isPolling && stateRef.current === 'SEARCHING') {
        delay = Math.min(delay * 1.3, 2000); // Exponential backoff up to 2s
        pollTimeout = setTimeout(pollQueue, delay);
      }
    };

    pollQueue();

    return () => {
      isPolling = false;
      clearTimeout(pollTimeout);
      supabase.auth.getSession().then(({ data }) => {
        if (data?.session?.access_token) {
          fetch(`${apiUrl}/api/matchmaking/leave`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${data.session.access_token}`
            },
            body: JSON.stringify({ userId: currentUser.id })
          }).catch(() => {});
        }
      });
    };
  }, [state, currentUser, mode, scope]);

  // Main Discover Realtime Channel Setup (Used exclusively for Chat/Typing/Likes/Skips & Live Presence Count)
  useEffect(() => {
    if (!currentUser) return;

    const existingChannel = supabase.getChannels().find(c => c.topic === 'realtime:discover-pool');
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    const newChannel = supabase.channel('discover-pool', {
      config: { 
        presence: { key: currentUser.id },
        broadcast: { self: false, ack: false }
      }
    });

    // Presence Sync Handlers
    newChannel.on('presence', { event: 'sync' }, () => {
      syncPoolPresence(newChannel);
    });

    newChannel.on('presence', { event: 'join' }, () => {
      syncPoolPresence(newChannel);
    });

    newChannel.on('presence', { event: 'leave' }, () => {
      syncPoolPresence(newChannel);
    });

    // Chat & In-Call Interaction Broadcasts
    newChannel.on('broadcast', { event: 'CHAT_MESSAGE' }, ({ payload }) => {
      if (payload.targetId === currentUser.id && stateRef.current === 'CONNECTED') {
        setMessages(prev => [...prev, payload.message]);
        setIsPartnerTyping(false);
      }
    });

    newChannel.on('broadcast', { event: 'TYPING_START' }, ({ payload }) => {
      if (payload.targetId === currentUser.id && stateRef.current === 'CONNECTED') {
        setIsPartnerTyping(true);
        if (partnerTypingTimerRef.current) clearTimeout(partnerTypingTimerRef.current);
        partnerTypingTimerRef.current = setTimeout(() => setIsPartnerTyping(false), 2500);
      }
    });

    newChannel.on('broadcast', { event: 'TYPING_STOP' }, ({ payload }) => {
      if (payload.targetId === currentUser.id && stateRef.current === 'CONNECTED') {
        setIsPartnerTyping(false);
      }
    });

    newChannel.on('broadcast', { event: 'SKIP' }, ({ payload }) => {
      if (payload.targetId === currentUser.id && stateRef.current === 'CONNECTED') {
        setIsPartnerDisconnected(true);
        if (callInfoRef.current?.partnerId) {
          recentSkippedPartnersRef.current.set(callInfoRef.current.partnerId, Date.now() + 25000);
        }
        setTimeout(() => {
          if (stateRef.current === 'CONNECTED') {
            cleanupAndResetState('SEARCHING');
          }
        }, 1200);
      }
    });

    newChannel.on('broadcast', { event: 'LIKE' }, ({ payload }) => {
      if (payload.targetId === currentUser.id && stateRef.current === 'CONNECTED') {
        setPartnerLiked(true);
      }
    });

    // Subscribe and track presence
    newChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        isSubscribedRef.current = true;
        await newChannel.track({
          id: currentUser.id,
          name: currentUser.realName || currentUser.anonymousId || 'Anonymous Student',
          avatar: currentUser.avatar,
          university: currentUser.university,
          status: stateRef.current,
          mode: modeRef.current,
          scope: scopeRef.current
        });
        syncPoolPresence(newChannel);
      }
    });

    channelRef.current = newChannel;
    setChannel(newChannel);

    return () => {
      isSubscribedRef.current = false;
      supabase.removeChannel(newChannel);
      setChannel(null);
    };
  }, [currentUser?.id, syncPoolPresence, safeBroadcast, cleanupAndResetState]);

  // Sync state & mode changes to the realtime pool presence
  useEffect(() => {
    if (channel && currentUser && isSubscribedRef.current) {
      channel.track({
        id: currentUser.id,
        name: currentUser.realName || currentUser.anonymousId || 'Anonymous Student',
        avatar: currentUser.avatar,
        university: currentUser.university,
        status: state,
        mode: mode,
        scope: scope
      });
    }
  }, [state, mode, scope, channel, currentUser?.id]);

  // Periodic active presence count refresh
  useEffect(() => {
    if (!channel) return;
    const interval = setInterval(() => {
      syncPoolPresence(channel);
    }, 3000);
    return () => clearInterval(interval);
  }, [channel, syncPoolPresence]);

  // Handlers for Matchmaking Controls
  const handleStartSearching = () => {
    cleanupAndResetState('SEARCHING');
  };

  const handleCancelSearching = () => {
    cleanupAndResetState('IDLE');
  };

  // =========================================================================
  // RENDER: IDLE STATE
  // =========================================================================
  if (state === 'IDLE') {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-between p-4 md:p-8 max-w-4xl mx-auto select-none">
        {/* Top Floating Header with Active Count (Left) & Scope Toggle (Right) */}
        <div className="w-full flex items-center justify-between gap-3 pt-2">
          {/* Active Online Counter Pill (Left) */}
          <div className="inline-flex items-center gap-2 px-3.5 h-10 rounded-full bg-zinc-900/90 border border-white/10 text-xs font-medium text-gray-300 backdrop-blur-xl shadow-lg font-mono whitespace-nowrap shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="leading-none">{activeUsersCount} online</span>
          </div>

          {/* Scope Toggle (Top Right Corner) */}
          <div className="inline-flex items-center bg-zinc-900/90 border border-white/10 p-1 rounded-full backdrop-blur-xl shadow-lg h-10">
            <button
              onClick={() => {
                if (!currentUser?.university) {
                  router.push('/profile');
                  return;
                }
                setScope('CAMPUS');
              }}
              className={`h-full flex items-center gap-1.5 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                scope === 'CAMPUS'
                  ? 'bg-gradient-to-r from-neon to-pink-600 text-white shadow-md shadow-neon/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <School className="w-3.5 h-3.5 shrink-0" />
              <span>Campus</span>
            </button>
            <button
              onClick={() => setScope('GLOBAL')}
              className={`h-full flex items-center gap-1.5 px-3.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                scope === 'GLOBAL'
                  ? 'bg-gradient-to-r from-neon to-pink-600 text-white shadow-md shadow-neon/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5 shrink-0" />
              <span>Global</span>
            </button>
          </div>
        </div>

        {/* Center Hero Section */}
        <div className="w-full flex-1 flex flex-col items-center justify-center my-8 text-center max-w-lg">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-tr from-neon/30 to-purple-600/30 rounded-full blur-3xl -z-10 animate-pulse" />
            <div className="w-24 h-24 rounded-3xl bg-zinc-900/90 border border-white/15 flex items-center justify-center text-white shadow-[0_0_40px_rgba(255,0,127,0.25)] backdrop-blur-2xl">
              {mode === 'VIDEO' ? (
                <Video className="w-12 h-12 text-neon" />
              ) : (
                <MessageSquare className="w-12 h-12 text-neon" />
              )}
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight mb-2">
            Speed <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon to-pink-500">Discover</span>
          </h1>
          <p className="text-gray-400 text-sm md:text-base leading-relaxed mb-8">
            Connect instantly with verified college students. Match anonymously, chat or video call, and tap ❤️ if you vibe.
          </p>

          {/* Controls Container (Matching Width) */}
          <div className="w-full max-w-sm flex flex-col gap-4 mb-8">
            {/* Mode Selector Tabs (Text vs Video) */}
            <div className="grid grid-cols-2 gap-1.5 w-full p-1.5 bg-zinc-900/90 border border-white/10 rounded-full backdrop-blur-xl">
              <button
                onClick={() => setMode('TEXT')}
                className={`h-12 flex items-center justify-center gap-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all ${
                  mode === 'TEXT'
                    ? 'bg-gradient-to-r from-neon to-pink-600 text-white shadow-lg shadow-neon/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <MessageSquare className="w-4 h-4 shrink-0" />
                <span>Text Chat</span>
              </button>
              <button
                onClick={() => setMode('VIDEO')}
                className={`h-12 flex items-center justify-center gap-2 rounded-full font-bold text-xs uppercase tracking-wider transition-all ${
                  mode === 'VIDEO'
                    ? 'bg-gradient-to-r from-neon to-pink-600 text-white shadow-lg shadow-neon/25'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <Video className="w-4 h-4 shrink-0" />
                <span>Video Call</span>
              </button>
            </div>

            {/* Start Discovering CTA Button */}
            <button
              onClick={handleStartSearching}
              className="w-full h-14 bg-gradient-to-r from-neon via-pink-600 to-purple-600 hover:from-neon hover:to-pink-500 text-white font-extrabold rounded-full uppercase tracking-widest text-sm shadow-[0_0_30px_rgba(255,0,127,0.4)] hover:shadow-[0_0_45px_rgba(255,0,127,0.6)] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5 fill-current" />
              <span>Start Discovering</span>
            </button>
          </div>
        </div>

        {/* Bottom Safety & Privacy Note */}
        <div className="text-center text-[11px] text-gray-500 pb-2 flex items-center justify-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-neon" />
          <span>Encrypted 1-on-1 connections. Skip anytime by pressing ESC.</span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: SEARCHING STATE
  // =========================================================================
  if (state === 'SEARCHING') {
    return (
      <div className="w-full min-h-[calc(100vh-4rem)] flex flex-col items-center justify-between p-4 md:p-8 max-w-lg mx-auto select-none">
        {/* Top Status Pill */}
        <div className="w-full flex items-center justify-between gap-3 pt-2">
          <button
            onClick={handleCancelSearching}
            className="inline-flex items-center gap-1.5 px-3.5 h-10 rounded-full bg-zinc-900/90 border border-white/10 text-xs font-semibold text-gray-400 hover:text-white transition-colors backdrop-blur-xl shadow-lg"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </button>
          <div className="inline-flex items-center gap-2 px-3.5 h-10 rounded-full bg-zinc-900/90 border border-white/10 text-xs font-mono text-gray-300 backdrop-blur-xl shadow-lg whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-neon animate-ping" />
            <span className="leading-none">{activeUsersCount} online</span>
          </div>
        </div>

        {/* Center Pulsating Match Radar */}
        <div className="flex-1 flex flex-col items-center justify-center text-center my-8">
          <div className="relative flex items-center justify-center mb-8">
            <div className="absolute w-64 h-64 rounded-full border border-neon/20 animate-ping opacity-30 pointer-events-none" />
            <div className="absolute w-52 h-52 rounded-full border border-pink-500/30 animate-pulse pointer-events-none" />
            <div className="absolute w-40 h-40 rounded-full bg-gradient-to-tr from-neon/30 to-purple-600/30 blur-2xl -z-10" />

            <div className="w-28 h-28 rounded-full bg-zinc-900 border-2 border-neon shadow-[0_0_35px_rgba(255,0,127,0.5)] flex items-center justify-center text-white relative z-10">
              {mode === 'VIDEO' ? (
                <Video className="w-12 h-12 text-neon animate-pulse" />
              ) : (
                <MessageSquare className="w-12 h-12 text-neon animate-pulse" />
              )}
            </div>
          </div>

          <h2 className="text-2xl font-extrabold text-white tracking-tight mb-2">
            Searching for a Match...
          </h2>
          <p className="text-gray-400 text-xs md:text-sm font-mono mb-4">
            {scope === 'CAMPUS' && currentUser?.university 
              ? `Looking within ${currentUser.university}...`
              : 'Looking for verified students globally...'}
          </p>

          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-white/10 text-xs text-gray-300 font-mono shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Time searching: {searchTime}s</span>
          </div>
        </div>

        {/* Cancel Button */}
        <div className="w-full pb-4">
          <button
            onClick={handleCancelSearching}
            className="w-full py-3.5 bg-zinc-900 hover:bg-zinc-800 border border-white/10 text-gray-300 hover:text-white font-bold rounded-full uppercase tracking-wider text-xs transition-colors"
          >
            Cancel Search
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: MATCHED CELEBRATION MODAL
  // =========================================================================
  if (state === 'MATCHED' && callInfo) {
    return (
      <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-6 text-center select-none animate-in fade-in zoom-in-95 duration-300">
        <div className="relative mb-6">
          <div className="absolute inset-0 bg-gradient-to-tr from-neon to-pink-500 rounded-full blur-3xl opacity-50 animate-pulse" />
          <div className="w-28 h-28 rounded-full bg-gradient-to-tr from-neon to-pink-600 p-1 shadow-[0_0_50px_rgba(255,0,127,0.7)] relative z-10 flex items-center justify-center">
            <Heart className="w-16 h-16 text-white fill-current animate-bounce" />
          </div>
        </div>

        <h1 className="text-4xl font-extrabold text-white tracking-tight mb-2">
          It's a <span className="bg-clip-text text-transparent bg-gradient-to-r from-neon to-pink-400">Match!</span>
        </h1>
        <p className="text-gray-300 text-sm max-w-sm mb-8">
          You and <span className="text-white font-bold">{callInfo.partnerName}</span> liked each other! You can now chat permanently in your matches.
        </p>

        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={() => router.push('/matches')}
            className="w-full py-4 bg-gradient-to-r from-neon to-pink-600 text-white font-extrabold rounded-full uppercase tracking-wider text-xs shadow-lg shadow-neon/30 hover:scale-105 active:scale-95 transition-all"
          >
            Go to Messages
          </button>
          <button
            onClick={() => cleanupAndResetState('SEARCHING')}
            className="w-full py-3.5 bg-white/10 hover:bg-white/20 border border-white/15 text-white font-bold rounded-full uppercase tracking-wider text-xs transition-colors"
          >
            Keep Discovering
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: CONNECTED — TEXT CHAT MODE
  // =========================================================================
  if (state === 'CONNECTED' && mode === 'TEXT' && callInfo) {
    return (
      <div className="w-full h-[100dvh] flex flex-col bg-black overflow-hidden font-sans select-none">
        {/* Top Connected Header */}
        <div className="p-3.5 bg-zinc-950/90 border-b border-white/10 backdrop-blur-xl flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => {
                handleSkip();
                setState('IDLE');
              }}
              className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0"
              aria-label="Back to home"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="w-9 h-9 rounded-full overflow-hidden border border-neon/50 shrink-0">
              <img
                src={callInfo?.partnerAvatar || 'https://via.placeholder.com/150'}
                alt={callInfo?.partnerName || 'Partner'}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm text-gray-100 truncate">
                {callInfo?.partnerName || 'Student'}
              </h3>
              <p className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> 
                Connected {callInfo?.partnerUniversity ? `• ${callInfo.partnerUniversity}` : ''}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleLike}
              className={`w-9 h-9 md:w-10 md:h-10 rounded-full border flex items-center justify-center transition-all ${
                hasLiked
                  ? 'bg-neon border-neon text-white shadow-lg shadow-neon/40'
                  : 'bg-black/60 border-white/10 text-gray-400 hover:text-white'
              }`}
              title="Like Partner"
              aria-label="Like"
            >
              <Heart className={`w-4 h-4 md:w-5 md:h-5 ${hasLiked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleSkip}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors active:scale-95"
              title="Next Person (or press ESC)"
              aria-label="Next"
            >
              <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Mutual Like Floating Banner */}
        {partnerLiked && !hasLiked && (
          <div className="w-full bg-neon/15 border-b border-neon/30 py-1.5 px-4 text-center text-xs text-neon font-bold flex items-center justify-center gap-1.5 animate-pulse">
            <Heart className="w-3.5 h-3.5 fill-current" /> Partner liked you! Tap ❤️ to match permanently.
          </div>
        )}

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {messages.length === 0 && !isPartnerDisconnected && (
            <div className="text-center py-12">
              <p className="text-xs text-gray-400 font-medium">You are connected to a random student. Say hi!</p>
              <p className="text-[10px] text-gray-500 mt-1">Press ESC anytime to skip to the next person.</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] md:max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  isMe 
                    ? 'bg-gradient-to-r from-neon to-pink-600 text-white rounded-br-none shadow-sm' 
                    : 'bg-zinc-900 text-gray-200 border border-white/10 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })}

          {isPartnerTyping && (
            <div className="flex justify-start">
              <div className="bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-full text-[11px] text-gray-400 font-mono animate-pulse">
                Typing...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input or Partner Disconnected Bar */}
        {isPartnerDisconnected ? (
          <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-zinc-900 border-t border-white/10 text-center shrink-0">
            <p className="text-xs text-gray-400 mb-3">Partner has disconnected.</p>
            <button
              onClick={() => cleanupAndResetState('SEARCHING')}
              className="w-full py-3.5 bg-gradient-to-r from-neon to-pink-600 text-white font-bold rounded-full uppercase tracking-wider text-xs shadow-lg shadow-neon/25 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Find Next Person</span>
            </button>
          </div>
        ) : (
          <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-black/80 border-t border-white/10 backdrop-blur-xl flex items-center gap-2 shrink-0">
            <input
              ref={chatInputRef}
              type="text"
              value={chatInput}
              onChange={handleTyping}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSendMessage();
                }
              }}
              placeholder="Type a message... (ESC to skip)"
              className="flex-1 bg-zinc-900 border border-white/10 focus:border-neon/40 text-white placeholder-gray-500 rounded-full px-4 py-2.5 text-xs outline-none transition-colors"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!chatInput.trim()}
              className="w-9 h-9 bg-gradient-to-r from-neon to-pink-600 disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-all shadow-md shadow-neon/20 shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // RENDER: CONNECTED — VIDEO MODE
  // =========================================================================
  if (state === 'CONNECTED' && mode === 'VIDEO' && callInfo) {
    return (
      <div className="w-full h-[100dvh] relative bg-black overflow-hidden">
        {/* Back Button Overlay */}
        <div className="absolute top-4 left-4 z-[140]">
          <button
            onClick={() => {
              handleSkip();
              setState('IDLE');
            }}
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 border border-white/10 flex items-center justify-center text-white transition-colors"
            aria-label="Exit video chat"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Video Call Component */}
        <VideoCall
          appId={callInfo.appId}
          channelName={callInfo.channelName}
          token={callInfo.token}
          onLeave={() => setState('IDLE')}
          onPartnerDisconnect={() => {
            setIsPartnerDisconnected(true);
            if (callInfoRef.current?.partnerId) {
              recentSkippedPartnersRef.current.set(callInfoRef.current.partnerId, Date.now() + 25000);
            }
            setTimeout(() => {
              cleanupAndResetState('SEARCHING');
            }, 1000);
          }}
          partnerName={callInfo.partnerName}
          partnerAvatar={callInfo.partnerAvatar}
          callType="video"
          callSessionId="discover_session"
          customControls={
            <div className="flex items-center gap-2 md:gap-3">
              <button 
                onClick={handleSkip}
                className="w-12 h-12 md:w-14 md:h-14 bg-black/60 border border-white/10 hover:bg-white/10 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform shrink-0"
                title="Next Person (or press ESC)"
                aria-label="Next Person"
              >
                <SkipForward className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <button 
                onClick={handleLike}
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all shrink-0 ${
                  hasLiked 
                    ? 'bg-neon shadow-[0_0_25px_rgba(255,0,127,0.8)] scale-105' 
                    : 'bg-black/60 border border-white/10 hover:bg-neon/30'
                }`}
                title="Like Person"
                aria-label="Like Person"
              >
                <Heart className={`w-5 h-5 md:w-6 md:h-6 ${hasLiked ? 'fill-current animate-pulse' : ''}`} />
              </button>
            </div>
          }
        />

        {isPartnerDisconnected && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/80 backdrop-blur-xl px-6 py-2.5 rounded-full border border-neon/40 z-[130] animate-bounce shadow-2xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-neon animate-ping" />
            <span className="text-white font-bold text-xs">Partner skipped • Finding next match...</span>
          </div>
        )}

        {partnerLiked && !hasLiked && !isPartnerDisconnected && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-neon/30 z-[120]">
            <span className="text-neon font-bold text-xs flex items-center gap-2">
              <Heart className="w-4 h-4 fill-current" /> They liked you! Tap heart to match.
            </span>
          </div>
        )}
      </div>
    );
  }

  return null;
};
