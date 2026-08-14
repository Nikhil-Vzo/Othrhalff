import React, { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  Heart, Search, SkipForward, MessageSquare, Video, Send, 
  ArrowLeft, User
} from 'lucide-react';
import { useRouter } from 'next/navigation';

const VideoCall = dynamic<any>(
  () => import('../components/VideoCall').then(mod => mod.VideoCall),
  { ssr: false }
);

type DiscoverState = 'IDLE' | 'SEARCHING' | 'CONNECTING' | 'CONNECTED' | 'MATCHED';
type DiscoverMode = 'TEXT' | 'VIDEO';

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: number;
}

export const Discover: React.FC = () => {
  const { currentUser } = useAuth();
  const router = useRouter();

  // State
  const [mode, setMode] = useState<DiscoverMode>('TEXT');
  const [state, setState] = useState<DiscoverState>('IDLE');
  const [channel, setChannel] = useState<any>(null);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  const [searchTime, setSearchTime] = useState(0);

  const [callInfo, setCallInfo] = useState<{
    appId: string;
    channelName: string;
    token: string;
    partnerId: string;
    partnerName: string;
    partnerAvatar: string;
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

  // Refs to avoid stale closure
  const stateRef = useRef(state);
  const modeRef = useRef(mode);
  const callInfoRef = useRef(callInfo);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { modeRef.current = mode; }, [mode]);
  useEffect(() => { callInfoRef.current = callInfo; }, [callInfo]);

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

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isPartnerTyping]);

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

  const handleSkip = useCallback(() => {
    if (channel && callInfoRef.current) {
      channel.send({
        type: 'broadcast',
        event: 'SKIP',
        payload: { targetId: callInfoRef.current.partnerId }
      });
    }
    cleanupAndResetState('SEARCHING');
  }, [channel, cleanupAndResetState]);

  const handleLike = useCallback(async () => {
    if (hasLiked || !channel || !callInfoRef.current || !currentUser) return;
    setHasLiked(true);
    
    channel.send({
      type: 'broadcast',
      event: 'LIKE',
      payload: { targetId: callInfoRef.current.partnerId }
    });

    if (partnerLiked) {
      setState('MATCHED');
      await supabase.from('swipes').upsert({
        liker_id: currentUser.id,
        target_id: callInfoRef.current.partnerId,
        action: 'like',
        created_at: new Date().toISOString()
      }, { onConflict: 'liker_id, target_id' });
    }
  }, [hasLiked, partnerLiked, channel, currentUser]);

  useEffect(() => {
    if (hasLiked && partnerLiked && state === 'CONNECTED' && currentUser && callInfoRef.current) {
      setState('MATCHED');
      supabase.from('swipes').upsert({
        liker_id: currentUser.id,
        target_id: callInfoRef.current.partnerId,
        action: 'like',
        created_at: new Date().toISOString()
      }, { onConflict: 'liker_id, target_id' });
    }
  }, [hasLiked, partnerLiked, state, currentUser]);

  const handleSendMessage = useCallback((textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : chatInput;
    if (!text.trim() || !channel || !callInfoRef.current || !currentUser) return;

    const newMessage: ChatMessage = {
      id: `${Date.now()}-${Math.random()}`,
      senderId: currentUser.id,
      text: text.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, newMessage]);
    if (textToSend === undefined) setChatInput('');

    channel.send({
      type: 'broadcast',
      event: 'CHAT_MESSAGE',
      payload: {
        targetId: callInfoRef.current.partnerId,
        message: newMessage
      }
    });

    channel.send({
      type: 'broadcast',
      event: 'TYPING_STOP',
      payload: { targetId: callInfoRef.current.partnerId }
    });
  }, [chatInput, channel, currentUser]);

  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setChatInput(e.target.value);
    if (!channel || !callInfoRef.current) return;

    channel.send({
      type: 'broadcast',
      event: 'TYPING_START',
      payload: { targetId: callInfoRef.current.partnerId }
    });
  };

  useEffect(() => {
    if (!currentUser) return;

    const existingChannel = supabase.getChannels().find(c => c.topic === 'realtime:discover-pool');
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    const newChannel = supabase.channel('discover-pool', {
      config: { presence: { key: currentUser.id } }
    });

    newChannel.on('presence', { event: 'sync' }, async () => {
      const stateTree = newChannel.presenceState();
      setActiveUsersCount(Object.keys(stateTree).length);

      if (stateRef.current !== 'SEARCHING') return;

      const availableUsers = Object.keys(stateTree)
        .map(key => stateTree[key][0] as any)
        .filter(u => u.status === 'SEARCHING' && u.mode === modeRef.current && u.id !== currentUser.id);

      if (availableUsers.length > 0) {
        const allSearching = [currentUser.id, ...availableUsers.map(u => u.id)].sort();
        
        if (allSearching[0] === currentUser.id) {
          const partner = availableUsers[0];
          setState('CONNECTING');

          try {
            if (modeRef.current === 'VIDEO') {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) throw new Error("No session");

              const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
              const res = await fetch(`${apiUrl}/api/agora-token`, {
                method: 'POST',
                headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${session.access_token}`
                }
              });
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Failed to fetch Agora token");

              setCallInfo({
                appId: data.appId,
                channelName: data.channelName,
                token: data.token,
                partnerId: partner.id,
                partnerName: partner.name || 'Anonymous Student',
                partnerAvatar: partner.avatar || ''
              });

              newChannel.send({
                type: 'broadcast',
                event: 'PROPOSE_MATCH',
                payload: {
                  mode: 'VIDEO',
                  targetId: partner.id,
                  channelName: data.channelName,
                  initiatorId: currentUser.id,
                  initiatorName: currentUser.realName || currentUser.anonymousId || 'Anonymous Student',
                  initiatorAvatar: currentUser.avatar
                }
              });
            } else {
              const textRoomId = `text_room_${Date.now()}_${currentUser.id.substring(0, 5)}`;
              setCallInfo({
                appId: '',
                channelName: textRoomId,
                token: '',
                partnerId: partner.id,
                partnerName: partner.name || 'Anonymous Student',
                partnerAvatar: partner.avatar || ''
              });

              newChannel.send({
                type: 'broadcast',
                event: 'PROPOSE_MATCH',
                payload: {
                  mode: 'TEXT',
                  targetId: partner.id,
                  channelName: textRoomId,
                  initiatorId: currentUser.id,
                  initiatorName: currentUser.realName || currentUser.anonymousId || 'Anonymous Student',
                  initiatorAvatar: currentUser.avatar
                }
              });
            }
          } catch (err) {
            console.error("Matching error:", err);
            setState('SEARCHING');
          }
        }
      }
    });

    newChannel.on('broadcast', { event: 'PROPOSE_MATCH' }, async ({ payload }) => {
      if (payload.targetId !== currentUser.id || stateRef.current !== 'SEARCHING') return;
      
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
            partnerAvatar: payload.initiatorAvatar || ''
          });
        } else {
          setCallInfo({
            appId: '',
            channelName: payload.channelName,
            token: '',
            partnerId: payload.initiatorId,
            partnerName: payload.initiatorName || 'Anonymous Student',
            partnerAvatar: payload.initiatorAvatar || ''
          });
        }

        newChannel.send({
          type: 'broadcast',
          event: 'ACCEPT_MATCH',
          payload: { targetId: payload.initiatorId }
        });

        setState('CONNECTED');
        setIsPartnerDisconnected(false);
      } catch (err) {
        console.error("Match accept error:", err);
        setState('SEARCHING');
      }
    });

    newChannel.on('broadcast', { event: 'ACCEPT_MATCH' }, ({ payload }) => {
      if (payload.targetId === currentUser.id && stateRef.current === 'CONNECTING') {
        setState('CONNECTED');
        setIsPartnerDisconnected(false);
      }
    });

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

    newChannel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await newChannel.track({
          id: currentUser.id,
          name: currentUser.realName || currentUser.anonymousId || 'Anonymous Student',
          avatar: currentUser.avatar,
          status: stateRef.current,
          mode: modeRef.current
        });
      }
    });

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
      setChannel(null);
    };
  }, [currentUser]);

  useEffect(() => {
    if (channel && currentUser) {
      channel.track({
        id: currentUser.id,
        name: currentUser.realName || currentUser.anonymousId || 'Anonymous Student',
        avatar: currentUser.avatar,
        status: state,
        mode: mode
      });
    }
  }, [state, mode, channel, currentUser]);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (state === 'CONNECTING') {
      timeoutId = setTimeout(() => {
        setState('SEARCHING');
      }, 10000);
    }
    return () => { if (timeoutId) clearTimeout(timeoutId); };
  }, [state]);

  if (!currentUser) return null;

  // ==========================================
  // RENDER: IDLE STATE
  // ==========================================
  if (state === 'IDLE') {
    return (
      <div className="w-full min-h-[100dvh] flex flex-col items-center justify-between bg-black text-white p-4 md:p-6 pb-12 md:pb-6 overflow-y-auto relative">
        {/* Top Header */}
        <div className="w-full max-w-md flex items-center justify-between z-10">
          <button
            onClick={() => router.push('/home')}
            className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            aria-label="Back to Home"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 bg-gray-900/80 border border-gray-800 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-bold text-gray-300 font-mono">
              {activeUsersCount} Online
            </span>
          </div>
        </div>

        {/* Hero Content */}
        <div className="w-full max-w-md flex flex-col items-center text-center my-auto py-6">
          <div className="w-20 h-20 rounded-full bg-neon/20 border border-neon/30 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,0,127,0.3)]">
            <Search className="w-9 h-9 text-neon" />
          </div>

          <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">
            Discover
          </h1>
          <p className="text-gray-400 text-xs text-center max-w-xs mb-4">
            Match randomly with anyone in your campus right now.
          </p>

          {/* Single User Online Banner */}
          {activeUsersCount <= 1 && (
            <div className="mb-6 px-3.5 py-1.5 rounded-full bg-gray-900 border border-gray-800 text-[11px] text-gray-400 font-mono flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-neon" />
              <span>You are currently the only person online right now.</span>
            </div>
          )}

          {/* Mode Switcher */}
          <div className="flex bg-gray-900 p-1 rounded-full border border-gray-800 mb-8 w-full max-w-xs">
            <button
              onClick={() => setMode('TEXT')}
              className={`flex-1 py-2.5 rounded-full text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                mode === 'TEXT'
                  ? 'bg-neon text-white shadow-md shadow-neon/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Text</span>
            </button>
            <button
              onClick={() => setMode('VIDEO')}
              className={`flex-1 py-2.5 rounded-full text-xs font-bold uppercase transition-all flex items-center justify-center gap-2 ${
                mode === 'VIDEO'
                  ? 'bg-neon text-white shadow-md shadow-neon/20'
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              <Video className="w-4 h-4" />
              <span>Video</span>
            </button>
          </div>

          {/* Start Button */}
          <button
            onClick={() => setState('SEARCHING')}
            className="w-full max-w-xs py-4 bg-neon text-white font-bold rounded-full uppercase tracking-widest text-xs shadow-[0_4px_14px_rgba(255,0,127,0.4)] active:scale-95 transition-transform"
          >
            Start Discovering
          </button>
        </div>

        {/* Footer info */}
        <div className="w-full max-w-md text-center py-2">
          <p className="text-[11px] text-gray-500">
            Mutual likes during chat unlock a permanent match.
          </p>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: SEARCHING & CONNECTING STATE
  // ==========================================
  if (state === 'SEARCHING' || state === 'CONNECTING') {
    return (
      <div className="w-full min-h-[100dvh] flex flex-col items-center justify-between bg-black text-white p-4 md:p-6 pb-12 md:pb-6 overflow-y-auto relative">
        <div className="w-full max-w-md flex items-center justify-between z-10">
          <button
            onClick={() => setState('IDLE')}
            className="w-10 h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 bg-gray-900/80 border border-gray-800 px-3 py-1.5 rounded-full">
            <span className="w-2 h-2 rounded-full bg-neon animate-ping" />
            <span className="text-xs font-bold text-gray-300 font-mono">
              {state === 'SEARCHING' ? `Searching... ${searchTime}s` : 'Connecting...'}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center my-auto text-center py-6">
          <div className="relative w-28 h-28 mb-6 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-neon rounded-full opacity-30 animate-ping" />
            <img 
              src={currentUser.avatar || 'https://via.placeholder.com/150'} 
              alt="Me" 
              className="w-16 h-16 rounded-full border-2 border-neon object-cover" 
            />
          </div>

          <h2 className="text-xl font-bold text-white mb-2 animate-pulse">
            {state === 'SEARCHING' ? 'Looking for someone...' : 'Connecting...'}
          </h2>
          <p className="text-gray-500 text-xs mb-3">
            {mode === 'TEXT' ? 'Random Text Mode' : 'Speed Video Mode'}
          </p>

          {/* Timeout / Single User Telemetry Notification */}
          {state === 'SEARCHING' && activeUsersCount <= 1 && (
            <p className="text-xs font-mono text-neon/90 max-w-xs mt-2 px-4 py-1.5 rounded-full bg-gray-900 border border-gray-800">
              You are currently the only one online right now. Waiting for someone to join...
            </p>
          )}

          {state === 'SEARCHING' && activeUsersCount > 1 && searchTime >= 15 && (
            <p className="text-xs font-mono text-gray-400 max-w-xs mt-2 px-4 py-1.5 rounded-full bg-gray-900 border border-gray-800">
              Searching for available persons in {mode} mode...
            </p>
          )}
        </div>

        <div className="w-full max-w-md flex justify-center pb-2">
          <button
            onClick={() => setState('IDLE')}
            className="px-6 py-2.5 text-xs text-gray-400 font-bold uppercase border border-gray-800 rounded-full bg-gray-900 hover:text-white transition-colors active:scale-95"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: MATCHED CELEBRATION STATE
  // ==========================================
  if (state === 'MATCHED') {
    return (
      <div className="w-full min-h-[100dvh] flex flex-col items-center justify-center bg-black text-white p-4 md:p-6 pb-12 md:pb-6 overflow-y-auto z-50">
        <div className="flex items-center gap-4 mb-8">
          <img src={currentUser.avatar || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-full border-2 border-neon object-cover" />
          <Heart className="w-8 h-8 text-neon animate-bounce fill-current" />
          <img src={callInfo?.partnerAvatar || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-full border-2 border-neon object-cover" />
        </div>

        <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">It's a Match!</h1>
        <p className="text-gray-400 text-xs mb-10 text-center max-w-xs">You and {callInfo?.partnerName} liked each other.</p>

        <div className="w-full max-w-xs space-y-3">
          <button
            onClick={() => router.push('/matches')}
            className="w-full py-4 bg-neon text-white font-bold rounded-full uppercase tracking-widest text-xs shadow-[0_4px_14px_rgba(255,0,127,0.4)] active:scale-95 transition-transform"
          >
            Go to Messages
          </button>
          <button
            onClick={() => cleanupAndResetState('SEARCHING')}
            className="w-full py-4 bg-gray-900 border border-gray-800 text-gray-300 font-bold rounded-full uppercase tracking-widest text-xs active:scale-95 transition-transform"
          >
            Keep Discovering
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER: CONNECTED — TEXT MODE
  // ==========================================
  if (state === 'CONNECTED' && mode === 'TEXT') {
    return (
      <div className="w-full h-[100dvh] flex flex-col bg-black text-white relative overflow-hidden">
        {/* Header */}
        <div className="w-full bg-gray-900/60 border-b border-gray-800 p-3 md:p-4 flex items-center justify-between z-10 backdrop-blur-md shrink-0">
          <div className="flex items-center gap-2.5 md:gap-3 overflow-hidden">
            <button
              onClick={() => {
                handleSkip();
                setState('IDLE');
              }}
              className="w-9 h-9 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <img 
              src={callInfo?.partnerAvatar || 'https://via.placeholder.com/150'} 
              className="w-9 h-9 rounded-full object-cover border border-gray-800 shrink-0" 
            />
            <div className="truncate">
              <h3 className="font-bold text-sm text-gray-100 truncate">
                {callInfo?.partnerName || 'Student'}
              </h3>
              <p className="text-[10px] text-green-500 font-mono flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> Connected
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleLike}
              className={`w-9 h-9 md:w-10 md:h-10 rounded-full border flex items-center justify-center transition-all ${
                hasLiked
                  ? 'bg-neon border-neon text-white shadow-lg shadow-neon/30'
                  : 'bg-gray-900 border-gray-800 text-gray-400 hover:text-white'
              }`}
              title="Like"
              aria-label="Like"
            >
              <Heart className={`w-4 h-4 md:w-5 md:h-5 ${hasLiked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleSkip}
              className="w-9 h-9 md:w-10 md:h-10 rounded-full bg-gray-900 border border-gray-800 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
              title="Next"
              aria-label="Next"
            >
              <SkipForward className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          </div>
        </div>

        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {messages.length === 0 && !isPartnerDisconnected && (
            <div className="text-center py-12">
              <p className="text-xs text-gray-500">You are connected. Say hi!</p>
            </div>
          )}

          {messages.map((msg) => {
            const isMe = msg.senderId === currentUser.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] md:max-w-[75%] px-4 py-2.5 rounded-2xl text-xs leading-relaxed ${
                  isMe 
                    ? 'bg-neon text-white rounded-br-none shadow-sm' 
                    : 'bg-gray-900 text-gray-200 border border-gray-800 rounded-bl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            );
          })}

          {isPartnerTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-900 border border-gray-800 px-3 py-1.5 rounded-full text-[11px] text-gray-500 font-mono animate-pulse">
                Typing...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        {isPartnerDisconnected ? (
          <div className="p-4 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gray-900 border-t border-gray-800 text-center shrink-0">
            <p className="text-xs text-gray-400 mb-3">Partner has left.</p>
            <button
              onClick={() => cleanupAndResetState('SEARCHING')}
              className="w-full py-3 bg-neon text-white font-bold rounded-full uppercase tracking-wider text-xs shadow-lg shadow-neon/20"
            >
              Find Next Person
            </button>
          </div>
        ) : (
          <div className="p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-gray-900/90 border-t border-gray-800 backdrop-blur-md flex items-center gap-2 shrink-0">
            <input
              type="text"
              value={chatInput}
              onChange={handleTyping}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 bg-gray-900 border border-gray-800 focus:border-gray-700 text-white placeholder-gray-500 rounded-full px-4 py-2.5 text-xs outline-none"
            />
            <button
              onClick={() => handleSendMessage()}
              disabled={!chatInput.trim()}
              className="w-9 h-9 bg-neon disabled:opacity-40 text-white rounded-full flex items-center justify-center transition-all shadow-md shadow-neon/20 shrink-0"
              aria-label="Send message"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    );
  }

  // ==========================================
  // RENDER: CONNECTED — VIDEO MODE
  // ==========================================
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
            className="w-10 h-10 rounded-full bg-black/60 hover:bg-black/80 border border-gray-800 flex items-center justify-center text-white transition-colors"
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
                className="w-12 h-12 md:w-14 md:h-14 bg-gray-800 hover:bg-gray-700 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform shrink-0"
                title="Next"
                aria-label="Next Person"
              >
                <SkipForward className="w-5 h-5 md:w-6 md:h-6" />
              </button>
              <button 
                onClick={handleLike}
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all shrink-0 ${
                  hasLiked 
                    ? 'bg-neon shadow-[0_0_20px_rgba(255,0,127,0.8)] scale-105' 
                    : 'bg-gray-800 hover:bg-neon/30'
                }`}
                title="Like"
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
