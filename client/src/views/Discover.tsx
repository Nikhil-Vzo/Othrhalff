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
  
  // Realtime channel and metrics — initialize with totalOnlineCount or minimum 1
  const [channel, setChannel] = useState<any>(null);
  const [activeUsersCount, setActiveUsersCount] = useState<number>(() => Math.max(1, totalOnlineCount || 1));
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
  
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { scopeRef.current = scope; }, [scope]);
  useEffect(() => { callInfoRef.current = callInfo; }, [callInfo]);
  useEffect(() => { channelRef.current = channel; }, [channel]);

  // Sync with global totalOnlineCount if pool hasn't fully synced yet
  useEffect(() => {
    if (totalOnlineCount && totalOnlineCount > 0) {
      setActiveUsersCount(prev => Math.max(prev, totalOnlineCount));
    }
  }, [totalOnlineCount]);

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

  // Auto scroll chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

  // Cleanup helper
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
    if (channelRef.current && callInfoRef.current) {
      const partnerId = callInfoRef.current.partnerId;
      recentSkippedPartnersRef.current.set(partnerId, Date.now() + 30000); // Avoid for 30s
      
      try {
        channelRef.current.send({
          type: 'broadcast',
          event: 'SKIP',
          payload: { targetId: partnerId }
        });
      } catch (err) {
        console.warn('Failed to send skip event:', err);
      }
    }
    cleanupAndResetState('SEARCHING');
  }, [cleanupAndResetState]);

  // Like partner
  const handleLike = useCallback(async () => {
    if (hasLiked || !channelRef.current || !callInfoRef.current || !currentUser) return;
    setHasLiked(true);
    
    channelRef.current.send({
      type: 'broadcast',
      event: 'LIKE',
      payload: { targetId: callInfoRef.current.partnerId }
    });

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
  }, [hasLiked, partnerLiked, currentUser]);

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
  const handleSendMessage = useCallback((textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : chatInput;
    if (!text.trim() || !channelRef.current || !callInfoRef.current || !currentUser) return;

    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      senderId: currentUser.id,
      text: text.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    if (textToSend === undefined) setChatInput('');

    channelRef.current.send({
      type: 'broadcast',
      event: 'CHAT_MESSAGE',
      payload: {
        targetId: callInfoRef.current.partnerId,
        message: newMessage
      }
    });

    channelRef.current.send({
      type: 'broadcast',
      event: 'TYPING_STOP',
      payload: { targetId: callInfoRef.current.partnerId }
    });
  }, [chatInput, currentUser]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    if (!channelRef.current || !callInfoRef.current) return;

    channelRef.current.send({
      type: 'broadcast',
      event: 'TYPING_START',
      payload: { targetId: callInfoRef.current.partnerId }
    });
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
  // DEDICATED POOL PRESENCE SYNC (Always active regardless of state)
  // =========================================================================
  const syncPoolPresence = useCallback((activeChannel: any) => {
    if (!activeChannel) return [];
    try {
      const stateTree = activeChannel.presenceState();
      const allUsers = Object.keys(stateTree).map(key => stateTree[key]?.[0] as any).filter(Boolean);
      
      // Total count is always at least 1 (the current user) or total pool size
      const count = Math.max(allUsers.length, totalOnlineCount || 1, 1);
      setActiveUsersCount(count);
      return allUsers;
    } catch (e) {
      return [];
    }
  }, [totalOnlineCount]);

  // =========================================================================
  // MATCHMAKING CORE ENGINE (Deterministic & High-Speed Random Pairing)
  // =========================================================================
  const evaluateMatchmaking = useCallback(async (activeChannel: any, presencesList?: any[]) => {
    if (!activeChannel || !currentUser || stateRef.current !== 'SEARCHING') return;

    let allUsers = presencesList;
    if (!allUsers || allUsers.length === 0) {
      const stateTree = activeChannel.presenceState();
      allUsers = Object.keys(stateTree).map(key => stateTree[key]?.[0] as any).filter(Boolean);
    }

    // Filter available candidates searching in the same mode
    const candidates = (allUsers || []).filter(u => 
      u.status === 'SEARCHING' && 
      u.mode === modeRef.current && 
      u.id !== currentUser.id
    );

    if (candidates.length === 0) return;

    // Filter out recently skipped partners unless nobody else is searching
    const now = Date.now();
    const freshCandidates = candidates.filter(u => {
      const avoidUntil = recentSkippedPartnersRef.current.get(u.id);
      return !avoidUntil || now > avoidUntil;
    });

    const candidatePool = freshCandidates.length > 0 ? freshCandidates : candidates;

    // Accurate Scope Evaluation:
    // CAMPUS scope: Pair only with users having the same university
    // GLOBAL scope: Pair with anyone in candidate pool
    let partner: any = null;
    if (scopeRef.current === 'CAMPUS' && currentUser.university) {
      partner = candidatePool.find(u => u.university === currentUser.university);
    } else {
      partner = candidatePool[0];
    }

    if (!partner) return;

    // Deterministic tie-breaker: User with lexicographically smaller ID acts as Initiator
    const isInitiator = currentUser.id < partner.id;

    if (isInitiator) {
      setState('CONNECTING');

      try {
        if (modeRef.current === 'VIDEO') {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error("No active session");

          const channelName = `discover_vid_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const res = await fetch(`${apiUrl}/api/agora-token`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ channelName })
          });
          
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to fetch Agora token");

          setCallInfo({
            appId: data.appId,
            channelName: data.channelName,
            token: data.token,
            partnerId: partner.id,
            partnerName: partner.name || 'Anonymous Student',
            partnerAvatar: partner.avatar || '',
            partnerUniversity: partner.university
          });

          activeChannel.send({
            type: 'broadcast',
            event: 'PROPOSE_MATCH',
            payload: {
              mode: 'VIDEO',
              targetId: partner.id,
              channelName: data.channelName,
              initiatorId: currentUser.id,
              initiatorName: currentUser.realName || currentUser.anonymousId || 'Anonymous Student',
              initiatorAvatar: currentUser.avatar || '',
              initiatorUniversity: currentUser.university || ''
            }
          });
        } else {
          // Instant Text Mode Handshake
          const textRoomId = `discover_txt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          setCallInfo({
            appId: '',
            channelName: textRoomId,
            token: '',
            partnerId: partner.id,
            partnerName: partner.name || 'Anonymous Student',
            partnerAvatar: partner.avatar || '',
            partnerUniversity: partner.university
          });

          activeChannel.send({
            type: 'broadcast',
            event: 'PROPOSE_MATCH',
            payload: {
              mode: 'TEXT',
              targetId: partner.id,
              channelName: textRoomId,
              initiatorId: currentUser.id,
              initiatorName: currentUser.realName || currentUser.anonymousId || 'Anonymous Student',
              initiatorAvatar: currentUser.avatar || '',
              initiatorUniversity: currentUser.university || ''
            }
          });
        }
      } catch (err) {
        console.error("Match proposal error:", err);
        setState('SEARCHING');
      }
    }
  }, [currentUser]);

  // Main Discover Realtime Channel Setup
  useEffect(() => {
    if (!currentUser) return;

    const existingChannel = supabase.getChannels().find(c => c.topic === 'realtime:discover-pool');
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    const newChannel = supabase.channel('discover-pool', {
      config: { presence: { key: currentUser.id } }
    });

    // 1. Presence Sync Handler
    newChannel.on('presence', { event: 'sync' }, () => {
      const allUsers = syncPoolPresence(newChannel);
      if (stateRef.current === 'SEARCHING') {
        evaluateMatchmaking(newChannel, allUsers);
      }
    });

    newChannel.on('presence', { event: 'join' }, () => {
      const allUsers = syncPoolPresence(newChannel);
      if (stateRef.current === 'SEARCHING') {
        evaluateMatchmaking(newChannel, allUsers);
      }
    });

    newChannel.on('presence', { event: 'leave' }, () => {
      const allUsers = syncPoolPresence(newChannel);
      if (stateRef.current === 'SEARCHING') {
        evaluateMatchmaking(newChannel, allUsers);
      }
    });

    // 2. Incoming Match Proposal Handler (Receiver)
    newChannel.on('broadcast', { event: 'PROPOSE_MATCH' }, async ({ payload }) => {
      if (payload.targetId !== currentUser.id) return;
      if (stateRef.current !== 'SEARCHING') {
        newChannel.send({
          type: 'broadcast',
          event: 'BUSY_MATCH',
          payload: { targetId: payload.initiatorId }
        });
        return;
      }
      
      setState('CONNECTING');

      try {
        if (payload.mode === 'VIDEO') {
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) throw new Error("No session");

          const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
          const res = await fetch(`${apiUrl}/api/agora-token`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`
            },
            body: JSON.stringify({ channelName: payload.channelName })
          });
          
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || "Failed to fetch Agora token");

          setCallInfo({
            appId: data.appId,
            channelName: payload.channelName,
            token: data.token,
            partnerId: payload.initiatorId,
            partnerName: payload.initiatorName || 'Anonymous Student',
            partnerAvatar: payload.initiatorAvatar || '',
            partnerUniversity: payload.initiatorUniversity
          });
        } else {
          setCallInfo({
            appId: '',
            channelName: payload.channelName,
            token: '',
            partnerId: payload.initiatorId,
            partnerName: payload.initiatorName || 'Anonymous Student',
            partnerAvatar: payload.initiatorAvatar || '',
            partnerUniversity: payload.initiatorUniversity
          });
        }

        newChannel.send({
          type: 'broadcast',
          event: 'ACCEPT_MATCH',
          payload: { 
            targetId: payload.initiatorId,
            receiverName: currentUser.realName || currentUser.anonymousId || 'Anonymous Student',
            receiverAvatar: currentUser.avatar || '',
            receiverUniversity: currentUser.university || ''
          }
        });

        setState('CONNECTED');
        setIsPartnerDisconnected(false);
      } catch (err) {
        console.error("Match accept error:", err);
        setState('SEARCHING');
      }
    });

    // 3. Match Accepted Handler (Initiator)
    newChannel.on('broadcast', { event: 'ACCEPT_MATCH' }, ({ payload }) => {
      if (payload.targetId === currentUser.id && (stateRef.current === 'CONNECTING' || stateRef.current === 'SEARCHING')) {
        setState('CONNECTED');
        setIsPartnerDisconnected(false);
      }
    });

    // 4. Partner Busy / Reject Handler
    newChannel.on('broadcast', { event: 'BUSY_MATCH' }, ({ payload }) => {
      if (payload.targetId === currentUser.id && stateRef.current === 'CONNECTING') {
        setState('SEARCHING');
      }
    });

    // 5. Chat & Presence Broadcasts
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

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
      setChannel(null);
    };
  }, [currentUser?.id, evaluateMatchmaking, syncPoolPresence]);

  // Sync state & mode changes to the realtime pool presence
  useEffect(() => {
    if (channel && currentUser) {
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

  // Active Matchmaking & Presence Loop (Ticks every 1.5s)
  useEffect(() => {
    if (!channel) return;

    syncPoolPresence(channel);
    const matchmakingInterval = setInterval(() => {
      const allUsers = syncPoolPresence(channel);
      if (stateRef.current === 'SEARCHING') {
        evaluateMatchmaking(channel, allUsers);
      }
    }, 1500);

    return () => clearInterval(matchmakingInterval);
  }, [channel, syncPoolPresence, evaluateMatchmaking]);

  // Fail-Safe: Reset from CONNECTING to SEARCHING if handshake stalls past 5s
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (state === 'CONNECTING') {
      timeoutId = setTimeout(() => {
        if (stateRef.current === 'CONNECTING') {
          console.warn('[Discover] Connection handshake timed out after 5s, resuming search...');
          setState('SEARCHING');
        }
      }, 5000);
    }
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [state]);

  // Helper to render user avatar cleanly without raw box placeholders
  const renderAvatar = (avatarUrl?: string, name?: string, sizeClass = "w-20 h-20", textClass = "text-2xl") => {
    const displayName = name || 'Student';
    const initial = displayName.charAt(0).toUpperCase();

    if (avatarUrl && avatarUrl.startsWith('http')) {
      return (
        <img 
          src={avatarUrl} 
          alt={displayName} 
          className={`${sizeClass} rounded-full object-cover border-2 border-neon shadow-[0_0_30px_rgba(255,0,127,0.4)]`} 
        />
      );
    }

    return (
      <div className={`${sizeClass} rounded-full bg-gradient-to-br from-neon via-pink-600 to-purple-600 border-2 border-white/20 flex items-center justify-center text-white font-black ${textClass} shadow-[0_0_30px_rgba(255,0,127,0.4)] select-none`}>
        {initial}
      </div>
    );
  };

  if (!currentUser) return null;

  // =========================================================================
  // RENDER: IDLE STATE
  // =========================================================================
  if (state === 'IDLE') {
    return (
      <div className="w-full min-h-[100dvh] flex flex-col items-center justify-between bg-black text-white p-4 md:p-6 pb-12 md:pb-6 overflow-y-auto relative">
        {/* Top Header — Matching App Standards (Back button + Campus/Global Toggle + Online Count) */}
        <div className="w-full max-w-lg flex items-center justify-between z-30 pt-1">
          {/* Back Button */}
          <button
            onClick={() => router.push('/home')}
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0 shadow-lg"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          {/* Campus / Global Toggle at Header */}
          <div className="flex bg-black/60 backdrop-blur-2xl rounded-full p-1 border border-white/10 shadow-2xl">
            <button
              onClick={() => setScope('CAMPUS')}
              title={`Campus Mode: Only pair with students from ${currentUser.university || 'your university'}`}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase transition-all duration-300 ${
                scope === 'CAMPUS'
                  ? 'bg-gradient-to-r from-neon to-pink-600 text-white shadow-[0_0_20px_rgba(255,0,127,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <School className="w-3.5 h-3.5" />
              <span>Campus</span>
            </button>
            <button
              onClick={() => setScope('GLOBAL')}
              title="Global Mode: Pair with students from any university"
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[11px] font-bold uppercase transition-all duration-300 ${
                scope === 'GLOBAL'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Global</span>
            </button>
          </div>

          {/* Live Online Badge */}
          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-full shadow-lg shrink-0">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[11px] font-bold text-gray-200 font-mono">
              {activeUsersCount} Online
            </span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="w-full max-w-md flex flex-col items-center text-center my-auto py-8">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full bg-neon/15 border border-neon/30 flex items-center justify-center shadow-[0_0_40px_rgba(255,0,127,0.3)]">
              <Zap className="w-9 h-9 text-neon animate-pulse" />
            </div>
            <div className="absolute -top-1 -right-1 px-2.5 py-0.5 bg-neon text-[10px] font-black uppercase tracking-wider text-white rounded-full shadow-md shadow-neon/40">
              Live
            </div>
          </div>

          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-2">
            Discover Live
          </h1>
          <p className="text-gray-400 text-xs md:text-sm text-center max-w-xs mb-8">
            Instant 1-on-1 random chat & video. Pair with any active student live right now.
          </p>

          {/* Mode Switcher: Text vs Video (Clean & Sleek) */}
          <div className="flex bg-black/60 backdrop-blur-xl p-1 rounded-full border border-white/10 mb-8 w-full max-w-xs shadow-xl">
            <button
              onClick={() => setMode('TEXT')}
              className={`flex-1 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                mode === 'TEXT'
                  ? 'bg-gradient-to-r from-neon to-pink-600 text-white shadow-[0_0_20px_rgba(255,0,127,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Text Chat</span>
            </button>
            <button
              onClick={() => setMode('VIDEO')}
              className={`flex-1 py-3 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 ${
                mode === 'VIDEO'
                  ? 'bg-gradient-to-r from-neon to-pink-600 text-white shadow-[0_0_20px_rgba(255,0,127,0.4)]'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Video Call</span>
            </button>
          </div>

          {/* Start Button */}
          <button
            onClick={() => setState('SEARCHING')}
            className="w-full max-w-xs py-4 bg-gradient-to-r from-neon to-pink-600 text-white font-black rounded-full uppercase tracking-widest text-xs shadow-[0_4px_25px_rgba(255,0,127,0.45)] active:scale-95 hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-white" />
            <span>Start Discovering</span>
          </button>
        </div>

        {/* Footer info */}
        <div className="w-full max-w-md text-center py-2">
          <p className="text-[11px] text-gray-500 font-medium">
            Independent random chat. Tap ❤️ anytime to unlock a permanent match.
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: SEARCHING & CONNECTING STATE
  // =========================================================================
  if (state === 'SEARCHING' || state === 'CONNECTING') {
    return (
      <div className="w-full min-h-[100dvh] flex flex-col items-center justify-between bg-black text-white p-4 md:p-6 pb-12 md:pb-6 overflow-y-auto relative">
        {/* Header */}
        <div className="w-full max-w-lg flex items-center justify-between z-30 pt-1">
          <button
            onClick={() => setState('IDLE')}
            className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 bg-black/60 backdrop-blur-xl border border-white/10 px-3.5 py-1.5 rounded-full shadow-lg">
            <span className="w-2 h-2 rounded-full bg-neon animate-ping" />
            <span className="text-[11px] font-bold text-gray-200 font-mono">
              {state === 'SEARCHING' ? `Searching (${searchTime}s)` : 'Connecting...'}
            </span>
          </div>

          <div className="flex items-center gap-1.5 bg-black/60 backdrop-blur-xl border border-white/10 px-3 py-1.5 rounded-full shadow-lg">
            {scope === 'CAMPUS' ? <School className="w-3.5 h-3.5 text-neon" /> : <Globe className="w-3.5 h-3.5 text-blue-400" />}
            <span className="text-[11px] font-bold text-gray-300">
              {scope === 'CAMPUS' ? 'Campus' : 'Global'}
            </span>
          </div>
        </div>

        {/* Pulsing Radar Wave UI */}
        <div className="flex flex-col items-center justify-center my-auto text-center py-6">
          <div className="relative w-36 h-36 mb-8 flex items-center justify-center">
            {/* Outer concentric pulsing rings */}
            <div className="absolute inset-0 rounded-full border border-neon/20 animate-ping opacity-30" />
            <div className="absolute -inset-4 rounded-full border border-neon/15 animate-pulse opacity-40" />
            <div className="absolute -inset-8 rounded-full border border-neon/10 animate-pulse opacity-20" />
            
            {/* Center User Avatar */}
            {renderAvatar(
              currentUser.avatar, 
              currentUser.realName || currentUser.anonymousId, 
              "w-20 h-20", 
              "text-2xl"
            )}
          </div>

          <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
            {state === 'SEARCHING' ? 'Looking for someone online...' : 'Handshaking partner...'}
          </h2>
          <p className="text-gray-400 text-xs mb-4 font-medium">
            {mode === 'TEXT' ? 'Random 1-on-1 Text Chat' : 'Speed Video Call'} • {scope === 'CAMPUS' ? `Campus Scope (${currentUser.university || 'My College'})` : 'Global Scope'}
          </p>

          {/* Quick status pill */}
          <div className="px-4 py-2 rounded-full bg-black/60 border border-white/10 text-xs font-mono text-gray-300 flex items-center gap-2 shadow-lg">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>
              {activeUsersCount > 1 
                ? `${activeUsersCount} online • pairing live candidates...` 
                : 'Waiting for someone to join the pool...'}
            </span>
          </div>
        </div>

        {/* Bottom Cancel Button */}
        <div className="w-full max-w-xs flex justify-center pb-2">
          <button
            onClick={() => setState('IDLE')}
            className="w-full py-3.5 text-xs text-gray-300 hover:text-white font-bold uppercase tracking-wider border border-white/10 rounded-full bg-black/60 backdrop-blur-xl hover:bg-white/10 transition-colors active:scale-95"
          >
            Cancel Search
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: MATCHED CELEBRATION STATE
  // =========================================================================
  if (state === 'MATCHED') {
    return (
      <div className="w-full min-h-[100dvh] flex flex-col items-center justify-center bg-black text-white p-4 md:p-6 pb-12 md:pb-6 overflow-y-auto z-50">
        <div className="flex items-center gap-4 mb-8">
          {renderAvatar(currentUser.avatar, currentUser.realName || currentUser.anonymousId, "w-20 h-20", "text-2xl")}
          <Heart className="w-8 h-8 text-neon animate-bounce fill-current" />
          {renderAvatar(callInfo?.partnerAvatar, callInfo?.partnerName, "w-20 h-20", "text-2xl")}
        </div>

        <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">It's a Match!</h1>
        <p className="text-gray-400 text-xs mb-10 text-center max-w-xs">
          You and {callInfo?.partnerName} liked each other. You can now message them permanently!
        </p>

        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={() => router.push('/matches')}
            className="w-full py-4 bg-gradient-to-r from-neon to-pink-600 text-white font-bold rounded-full uppercase tracking-widest text-xs shadow-[0_4px_20px_rgba(255,0,127,0.4)] active:scale-95 transition-transform"
          >
            Go to Messages
          </button>
          <button
            onClick={() => cleanupAndResetState('SEARCHING')}
            className="w-full py-4 bg-black/60 border border-white/10 text-gray-300 font-bold rounded-full uppercase tracking-widest text-xs active:scale-95 transition-transform hover:bg-white/10"
          >
            Keep Discovering
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // RENDER: CONNECTED — TEXT MODE
  // =========================================================================
  if (state === 'CONNECTED' && mode === 'TEXT') {
    return (
      <div className="w-full h-[100dvh] flex flex-col bg-black text-white relative overflow-hidden">
        {/* Top Header */}
        <div className="w-full bg-black/70 border-b border-white/10 p-3 md:p-4 flex items-center justify-between z-10 backdrop-blur-xl shrink-0">
          <div className="flex items-center gap-2.5 md:gap-3 overflow-hidden">
            <button
              onClick={() => {
                handleSkip();
                setState('IDLE');
              }}
              className="w-9 h-9 rounded-full bg-black/60 border border-white/10 flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            {renderAvatar(callInfo?.partnerAvatar, callInfo?.partnerName, "w-9 h-9", "text-sm")}
            <div className="truncate">
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
            const isMe = msg.senderId === currentUser.id;
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
              type="text"
              value={chatInput}
              onChange={handleTyping}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
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

        {partnerLiked && !hasLiked && (
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
