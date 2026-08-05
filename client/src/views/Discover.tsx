import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { VideoCall } from '../components/VideoCall';
import { Heart, Search, SkipForward, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

type DiscoverState = 'IDLE' | 'SEARCHING' | 'CONNECTING' | 'CONNECTED' | 'MATCHED';

export const Discover: React.FC = () => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const [state, setState] = useState<DiscoverState>('IDLE');
  const [channel, setChannel] = useState<any>(null);
  const [activeUsersCount, setActiveUsersCount] = useState(0);
  
  // Call Info
  const [callInfo, setCallInfo] = useState<{
    appId: string;
    channelName: string;
    token: string;
    partnerId: string;
    partnerName: string;
    partnerAvatar: string;
  } | null>(null);

  // Like states
  const [hasLiked, setHasLiked] = useState(false);
  const [partnerLiked, setPartnerLiked] = useState(false);

  // Refs to avoid stale closures in event listeners
  const stateRef = useRef(state);
  const callInfoRef = useRef(callInfo);
  useEffect(() => { stateRef.current = state; }, [state]);
  useEffect(() => { callInfoRef.current = callInfo; }, [callInfo]);

  // Clean up
  const cleanupAndSearch = useCallback(() => {
    setHasLiked(false);
    setPartnerLiked(false);
    setCallInfo(null);
    setState('SEARCHING');
  }, []);

  const handleSkip = useCallback(() => {
    if (channel && callInfoRef.current) {
      channel.send({
        type: 'broadcast',
        event: 'SKIP',
        payload: { targetId: callInfoRef.current.partnerId }
      });
    }
    cleanupAndSearch();
  }, [channel, cleanupAndSearch]);

  const handleLike = useCallback(async () => {
    if (hasLiked || !channel || !callInfoRef.current || !currentUser) return;
    setHasLiked(true);
    
    // Broadcast LIKE
    channel.send({
      type: 'broadcast',
      event: 'LIKE',
      payload: { targetId: callInfoRef.current.partnerId }
    });

    // If partner already liked, we trigger match!
    if (partnerLiked) {
      setState('MATCHED');
      // Create match in DB
      await supabase.from('swipes').upsert({
        liker_id: currentUser.id,
        target_id: callInfoRef.current.partnerId,
        action: 'like',
        created_at: new Date().toISOString()
      }, { onConflict: 'liker_id, target_id' });
    }
  }, [hasLiked, partnerLiked, channel, currentUser]);

  useEffect(() => {
    // If we just received a like and we already liked them, trigger match!
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

  // Main real-time logic - Channel Setup
  useEffect(() => {
    if (!currentUser) return;

    // Clean up any existing channel with this name to prevent hot-reload bugs
    const existingChannel = supabase.getChannels().find(c => c.topic === 'realtime:discover-pool');
    if (existingChannel) {
      supabase.removeChannel(existingChannel);
    }

    const newChannel = supabase.channel('discover-pool', {
      config: { presence: { key: currentUser.id } }
    });

    newChannel.on('presence', { event: 'sync' }, async () => {
      const stateTree = newChannel.presenceState();
      
      // Update active user count
      setActiveUsersCount(Object.keys(stateTree).length);
      console.log("[Discover] Presence Sync! Active users:", Object.keys(stateTree).length, stateTree);

      if (stateRef.current !== 'SEARCHING') return;

      const availableUsers = Object.keys(stateTree)
        .map(key => stateTree[key][0] as any)
        .filter(u => u.status === 'SEARCHING' && u.id !== currentUser.id);

      console.log("[Discover] Available SEARCHING users:", availableUsers);

      if (availableUsers.length > 0) {
        // Sort by ID to deterministically elect an initiator to avoid race conditions
        const allSearching = [currentUser.id, ...availableUsers.map(u => u.id)].sort();
        
        if (allSearching[0] === currentUser.id) {
          // WE are the initiator
          const partner = availableUsers[0];
          setState('CONNECTING');
          
          try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) throw new Error("No session");

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/agora-token`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              }
            });
            const data = await res.json();
            
            if (!res.ok) {
              throw new Error(data.error || "Failed to fetch Agora token");
            }

            setCallInfo({
              appId: data.appId,
              channelName: data.channelName,
              token: data.token,
              partnerId: partner.id,
              partnerName: partner.name,
              partnerAvatar: partner.avatar
            });

            console.log("[Discover] Got token, sending PROPOSE_MATCH to", partner.id);
            // Propose match
            const sendRes = await newChannel.send({
              type: 'broadcast',
              event: 'PROPOSE_MATCH',
              payload: {
                targetId: partner.id,
                channelName: data.channelName,
                initiatorId: currentUser.id,
                initiatorName: currentUser.realName || currentUser.anonymousId,
                initiatorAvatar: currentUser.avatar
              }
            });
            console.log("[Discover] PROPOSE_MATCH send result:", sendRes);
          } catch (err) {
            console.error("Initiator matching error:", err);
            setState('SEARCHING');
          }
        } else {
           console.log("[Discover] I am not the initiator, waiting for PROPOSE_MATCH...");
        }
      }
    });

    newChannel.on('broadcast', { event: 'PROPOSE_MATCH' }, async ({ payload }) => {
      console.log("[Discover] Received PROPOSE_MATCH:", payload);
      if (payload.targetId !== currentUser.id) {
         console.log("[Discover] Not for me (target is", payload.targetId, "I am", currentUser.id, ")");
         return;
      }
      if (stateRef.current !== 'SEARCHING') {
         console.log("[Discover] I am not SEARCHING, I am", stateRef.current);
         return;
      }
      console.log("[Discover] PROPOSE_MATCH accepted! Fetching token...");
      setState('CONNECTING');
      
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) throw new Error("No session");

        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/agora-token`, {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ channelName: payload.channelName })
        });
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch Agora token");
        }

        setCallInfo({
          appId: data.appId,
          channelName: payload.channelName,
          token: data.token,
          partnerId: payload.initiatorId,
          partnerName: payload.initiatorName,
          partnerAvatar: payload.initiatorAvatar
        });

        console.log("[Discover] Sending ACCEPT_MATCH to", payload.initiatorId);
        newChannel.send({
          type: 'broadcast',
          event: 'ACCEPT_MATCH',
          payload: { targetId: payload.initiatorId }
        });

        setState('CONNECTED');
      } catch (err) {
        console.error("Target matching error:", err);
        setState('SEARCHING');
      }
    });

    newChannel.on('broadcast', { event: 'ACCEPT_MATCH' }, ({ payload }) => {
      console.log("[Discover] Received ACCEPT_MATCH:", payload);
      if (payload.targetId === currentUser.id && stateRef.current === 'CONNECTING') {
        console.log("[Discover] ACCEPT_MATCH processed, we are CONNECTED!");
        setState('CONNECTED');
      }
    });

    newChannel.on('broadcast', { event: 'SKIP' }, ({ payload }) => {
      if (payload.targetId === currentUser.id && stateRef.current === 'CONNECTED') {
        // use local function to safely clear
        setHasLiked(false);
        setPartnerLiked(false);
        setCallInfo(null);
        setState('SEARCHING');
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
          name: currentUser.realName || currentUser.anonymousId,
          avatar: currentUser.avatar,
          status: stateRef.current
        });
      }
    });

    setChannel(newChannel);

    return () => {
      supabase.removeChannel(newChannel);
      setChannel(null);
    };
  }, [currentUser]); // Run once per user

  // Track status updates
  useEffect(() => {
    if (channel && currentUser) {
      channel.track({
        id: currentUser.id,
        name: currentUser.realName || currentUser.anonymousId,
        avatar: currentUser.avatar,
        status: state
      });
    }
  }, [state, channel, currentUser]);

  // Timeout failsafe for CONNECTING state
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (state === 'CONNECTING') {
      timeoutId = setTimeout(() => {
        console.log("[Discover] CONNECTING timed out. Resetting to SEARCHING.");
        setState('SEARCHING');
      }, 10000); // 10 seconds
    }
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [state]);

  // UI Renders
  if (!currentUser) return null;

  if (state === 'IDLE') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black p-6 relative">
        <div className="absolute top-6 right-6 flex items-center gap-2 bg-gray-900/80 px-3 py-1.5 rounded-full border border-gray-800">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-bold text-gray-300">{activeUsersCount} Online</span>
        </div>
        
        <div className="w-24 h-24 rounded-full bg-neon/20 flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(255,0,127,0.4)]">
          <Search className="w-10 h-10 text-neon" />
        </div>
        <h1 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Discover</h1>
        <p className="text-gray-400 text-sm text-center max-w-sm mb-10">
          Match randomly with people on campus right now. If you both vibe and like each other, you'll instantly connect!
        </p>
        <button
          onClick={() => setState('SEARCHING')}
          className="w-full max-w-xs py-4 bg-neon text-white font-bold rounded-full uppercase tracking-widest shadow-[0_4px_14px_rgba(255,0,127,0.5)] active:scale-95 transition-transform"
        >
          Start Discovering
        </button>
      </div>
    );
  }

  if (state === 'SEARCHING' || state === 'CONNECTING') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black p-6 relative">
        <div className="absolute top-6 right-6 flex items-center gap-2 bg-gray-900/80 px-3 py-1.5 rounded-full border border-gray-800 z-50">
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-xs font-bold text-gray-300">{activeUsersCount} Online</span>
        </div>

        <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
          <div className="absolute inset-0 border-2 border-neon rounded-full opacity-20 animate-ping" style={{ animationDuration: '1.5s' }} />
          <div className="absolute inset-4 border-2 border-neon rounded-full opacity-40 animate-ping" style={{ animationDuration: '1.5s', animationDelay: '0.3s' }} />
          <img src={currentUser.avatar || 'https://via.placeholder.com/150'} alt="Me" className="w-16 h-16 rounded-full border-2 border-neon object-cover z-10" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2 animate-pulse">
          {state === 'SEARCHING' ? 'Looking for someone...' : 'Connecting...'}
        </h2>
        <button
          onClick={() => setState('IDLE')}
          className="px-6 py-2 mt-8 text-gray-500 font-bold uppercase tracking-wider text-xs border border-gray-700 rounded-full"
        >
          Stop
        </button>
      </div>
    );
  }

  if (state === 'MATCHED') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-black p-6 z-50">
        <div className="flex items-center gap-4 mb-8">
          <img src={currentUser.avatar || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-full border-2 border-neon object-cover" />
          <Heart className="w-8 h-8 text-neon animate-bounce fill-current" />
          <img src={callInfo?.partnerAvatar || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-full border-2 border-neon object-cover" />
        </div>
        <h1 className="text-4xl font-black text-white uppercase tracking-tighter mb-4 shadow-neon drop-shadow-lg">It's a Match!</h1>
        <p className="text-gray-400 mb-10 text-center max-w-sm">You and {callInfo?.partnerName} liked each other. You can now chat anytime!</p>
        
        <button
          onClick={() => router.push('/matches')}
          className="w-full max-w-xs py-4 bg-neon text-white font-bold rounded-full uppercase tracking-widest shadow-[0_4px_14px_rgba(255,0,127,0.5)] mb-4 active:scale-95 transition-transform"
        >
          Go to Messages
        </button>
        <button
          onClick={() => cleanupAndSearch()}
          className="w-full max-w-xs py-4 bg-gray-800 text-white font-bold rounded-full uppercase tracking-widest active:scale-95 transition-transform"
        >
          Keep Discovering
        </button>
      </div>
    );
  }

  if (state === 'CONNECTED' && callInfo) {
    return (
      <div className="w-full h-full relative">
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
            <div className="flex gap-4">
              <button 
                onClick={handleSkip}
                className="w-14 h-14 bg-gray-800 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
              >
                <SkipForward className="w-6 h-6" />
              </button>
              <button 
                onClick={handleLike}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg active:scale-90 transition-all ${
                  hasLiked 
                    ? 'bg-neon shadow-[0_0_20px_rgba(255,0,127,0.8)] scale-110' 
                    : 'bg-gray-800 hover:bg-neon/30'
                }`}
              >
                <Heart className={`w-6 h-6 ${hasLiked ? 'fill-current animate-pulse' : ''}`} />
              </button>
            </div>
          }
        />
        
        {/* Floating notifications for likes */}
        {partnerLiked && !hasLiked && (
          <div className="absolute top-20 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-md px-6 py-2 rounded-full border border-neon/30 z-[120] animate-fade-in-down">
            <span className="text-neon font-bold text-sm tracking-wide flex items-center gap-2">
              <Heart className="w-4 h-4 fill-current" /> They like you!
            </span>
          </div>
        )}
      </div>
    );
  }

  return null;
};
