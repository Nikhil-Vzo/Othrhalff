import React, { useEffect, useState, useRef, useCallback } from 'react';
import AgoraRTC, {
  IAgoraRTCRemoteUser,
  ICameraVideoTrack,
  IMicrophoneAudioTrack
} from 'agora-rtc-sdk-ng';
import { X, Mic, MicOff, Video as VideoIcon, VideoOff, PhoneOff, ShieldCheck, Wifi, WifiOff } from 'lucide-react';
import { useToast } from '../context/ToastContext';
import { endCall as endCallAPI } from '../services/callSignaling';
import { supabase } from '../lib/supabase';

interface VideoCallProps {
  appId: string;
  channelName: string;
  token: string;
  onLeave: () => void;
  partnerName: string;
  partnerAvatar: string;
  callType: 'audio' | 'video';
  callSessionId: string;
  customControls?: React.ReactNode;
}

export const VideoCall: React.FC<VideoCallProps> = ({ appId, channelName, token, onLeave, partnerName, partnerAvatar, callType, callSessionId, customControls }) => {
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<IAgoraRTCRemoteUser[]>([]);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(callType === 'audio');
  const [isJoined, setIsJoined] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);
  const { showToast } = useToast();
  
  // Track client in a ref so we can use it in cleanup
  const clientRef = useRef<any>(null);

  // === FIX 1: Use refs to avoid stale closures in cleanup ===
  const localVideoTrackRef = useRef<ICameraVideoTrack | null>(null);
  const localAudioTrackRef = useRef<IMicrophoneAudioTrack | null>(null);
  useEffect(() => { localVideoTrackRef.current = localVideoTrack; }, [localVideoTrack]);
  useEffect(() => { localAudioTrackRef.current = localAudioTrack; }, [localAudioTrack]);

  // === FIX 2: Call duration timer ===
  const [callDuration, setCallDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isJoined) {
      timerRef.current = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isJoined]);

  const formatDuration = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // === FIX 3: Network quality indicator ===
  const [networkQuality, setNetworkQuality] = useState<number>(0); // 0=unknown, 1=excellent, 2=good, 3=poor, 4=bad, 5=very bad, 6=disconnected

  // === FIX 4: Reconnection state ===
  const [isReconnecting, setIsReconnecting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    // Create a fresh client for this mount
    const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'h264' });
    clientRef.current = client;
    
    const init = async () => {
      try {
        // Set up event listeners
        client.on('user-published', async (user, mediaType) => {
          if (!isMounted) return;
          await client.subscribe(user, mediaType);
          console.log('Subscribed to user:', user.uid);

          // Update user in state (replace or add) to trigger effects and re-renders
          setRemoteUsers((prev) => {
            const index = prev.findIndex(u => u.uid === user.uid);
            if (index !== -1) {
              // Create new array with updated user object to trigger re-render
              const newUsers = [...prev];
              newUsers[index] = user;
              return newUsers;
            }
            return [...prev, user];
          });

          if (mediaType === 'audio') {
            try {
              await user.audioTrack?.play();
            } catch (err: any) {
              console.error('Remote audio autoplay blocked:', err);
              if (err.code === 4016 || err.name === 'NotAllowedError' || String(err).includes('autoplay')) {
                setAutoplayBlocked(true);
              }
            }
          }
        });

        client.on('user-unpublished', (user, mediaType) => {
          console.log('User unpublished:', user.uid, mediaType);
          if (mediaType === 'video') {
            // For video calls, if they turn off video, we might want to keep them in the list 
            // but just show avatar.
          }
        });

        client.on('user-left', (user) => {
          console.log('User left:', user.uid);
          setRemoteUsers((prev) => prev.filter(u => u.uid !== user.uid));
        });

        // Network quality monitoring
        client.on('network-quality', (stats) => {
          setNetworkQuality(stats.downlinkNetworkQuality);
        });

        // Auto-reconnection handling
        client.on('connection-state-change', (curState, prevState) => {
          console.log(`[Call] Connection: ${prevState} → ${curState}`);
          if (curState === 'RECONNECTING') {
            setIsReconnecting(true);
          } else if (curState === 'CONNECTED') {
            setIsReconnecting(false);
          } else if (curState === 'DISCONNECTED' && isMounted) {
            setIsReconnecting(false);
            showToast('Call disconnected', 'error');
          }
        });

        // Token renewal logic
        let isRenewing = false;
        const renewToken = async () => {
          if (isRenewing) {
            console.log('[Agora] Token renewal already in progress, skipping duplicate request.');
            return;
          }
          isRenewing = true;
          try {
            console.log('[Agora] Attempting token renewal for channel:', channelName);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
              console.error('[Agora] No active Supabase session found for token renewal.');
              return;
            }

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || '';
            const res = await fetch(`${apiUrl}/api/agora-token`, {
              method: 'POST',
              headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({ channelName })
            });

            if (!res.ok) {
              const errData = await res.json();
              throw new Error(errData.error || 'Failed to fetch renewal token');
            }

            const data = await res.json();
            if (!isMounted) return;
            console.log('[Agora] Successfully fetched new token, renewing client...');
            await client.renewToken(data.token);
            showToast('Call security credentials renewed successfully.', 'success');
          } catch (err: any) {
            console.error('[Agora] Failed to renew Agora token:', err);
            if (isMounted) {
              showToast('Warning: Call connection may drop due to token expiry.', 'error');
            }
          } finally {
            isRenewing = false;
          }
        };

        client.on('token-privilege-will-expire', renewToken);
        client.on('token-privilege-did-expire', async () => {
          console.warn('[Agora] Token expired. Attempting emergency renewal...');
          await renewToken();
        });

        // Join channel
        await client.join(appId, channelName, token, null);
        console.log('Joined channel successfully');

        // Create and publish local tracks based on call type
        let audioTrack: IMicrophoneAudioTrack;
        let videoTrack: ICameraVideoTrack | null = null;

        try {
          if (callType === 'audio') {
            // Audio-only: Only request microphone
            audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
            if (!isMounted) {
              audioTrack.close();
              return;
            }
          } else {
            // Video call: Request both
            [audioTrack, videoTrack] = await AgoraRTC.createMicrophoneAndCameraTracks();
            if (!isMounted) {
              audioTrack.close();
              videoTrack?.close();
              return;
            }
          }
        } catch (mediaError: any) {
          console.error('Media permission error:', mediaError);
          if (!isMounted) return;
          if (mediaError.code === 'PERMISSION_DENIED' || mediaError.name === 'NotAllowedError') {
            showToast('Microphone/Camera permission denied. Please enable them in browser settings.', 'error');
          } else {
            showToast('Failed to access media devices: ' + mediaError.message, 'error');
          }
          // Don't leave immediately, user might fix permissions? No, we need fresh tracks.
          // Better to leave and let them try again.
          onLeave();
          return;
        }

        setLocalAudioTrack(audioTrack);
        if (videoTrack) {
          setLocalVideoTrack(videoTrack);
          if (isMounted) {
            await client.publish([audioTrack, videoTrack]);
            videoTrack.play('local-video');
          }
        } else {
          if (isMounted) {
            await client.publish([audioTrack]);
          }
        }

        if (isMounted) {
          console.log('Published local tracks');
          setIsJoined(true);
        }

      } catch (error: any) {
        // If aborted due to Strict Mode unmount, ignore it
        if (!isMounted || error?.message?.includes('cancel') || error?.message?.includes('ABORT')) {
           console.log("Join aborted (likely due to Strict Mode unmount). Ignoring.");
           return;
        }
        console.error('Failed to join channel:', error);
        showToast('Failed to join call: ' + (error as Error).message, 'error');
        onLeave();
      }
    };

    init();

    return () => {
      isMounted = false;
      // Cleanup using refs (avoids stale closure bug)
      localAudioTrackRef.current?.close();
      localVideoTrackRef.current?.close();
      if (clientRef.current) {
         clientRef.current.leave();
      }
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [appId, channelName, token, callType, onLeave, showToast]);

  // Listen for call ended by partner
  useEffect(() => {
    if (!callSessionId) return;

    const channel = supabase
      .channel(`call_status:${callSessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'call_sessions',
          filter: `id=eq.${callSessionId}`
        },
        (payload) => {
          const updatedSession = payload.new as any;
          if (updatedSession.status === 'ended') {
            console.log('Call ended by partner');
            onLeave(); // Exit locally
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [callSessionId, onLeave]);

  // Play remote video when users join or update
  useEffect(() => {
    remoteUsers.forEach((user) => {
      if (user.videoTrack) {
        try {
          // Verify container exists
          const containerId = `remote-video-${user.uid}`;
          const container = document.getElementById(containerId);
          if (container) {
            if (!user.videoTrack.isPlaying) {
              user.videoTrack.play(containerId);
              console.log(`Playing video for user ${user.uid}`);
            }
          } else {
            console.warn(`Video container ${containerId} not found, retrying...`);
            // Determine why container is missing. It should be rendered if user is in remoteUsers.
          }
        } catch (error) {
          console.error('Error playing remote video:', error);
        }
      }
    });
  }, [remoteUsers]);

  const toggleMute = async () => {
    if (localAudioTrackRef.current) {
      await localAudioTrackRef.current.setMuted(!isMuted);
      setIsMuted(!isMuted);
    } else if (localAudioTrack) {
      await localAudioTrack.setMuted(!isMuted);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (callType === 'audio') {
      showToast('Video not available in audio call', 'error');
      return;
    }

    const trackToUse = localVideoTrackRef.current || localVideoTrack;
    if (trackToUse) {
      const shouldMute = !isVideoOff;
      await trackToUse.setMuted(shouldMute);
      setIsVideoOff(shouldMute);
    }
  };

  const handleEndCall = async () => {
    try {
      if (clientRef.current) {
         await clientRef.current.leave();
      }
    } catch (e) {
      console.error('Error leaving channel:', e);
    }

    // Use refs to ensure we close the actual current tracks
    localAudioTrackRef.current?.close();
    localVideoTrackRef.current?.close();
    if (timerRef.current) clearInterval(timerRef.current);

    // Update DB status to 'ended'
    if (callSessionId) {
      await endCallAPI(callSessionId);
    }

    onLeave();
  };

  // Network quality helper
  const getNetworkIcon = () => {
    if (networkQuality <= 2) return <Wifi className="w-4 h-4 text-green-400" />;
    if (networkQuality <= 4) return <Wifi className="w-4 h-4 text-yellow-400" />;
    return <WifiOff className="w-4 h-4 text-red-400" />;
  };

  const getNetworkLabel = () => {
    if (networkQuality === 0) return '';
    if (networkQuality <= 2) return 'Strong';
    if (networkQuality <= 4) return 'Weak';
    return 'Poor';
  };

  const handleResumeAudio = async () => {
    console.log('[Autoplay] Attempting to resume remote audio tracks...');
    let success = true;
    for (const user of remoteUsers) {
      if (user.audioTrack) {
        try {
          await user.audioTrack.play();
        } catch (err) {
          console.error(`[Autoplay] Failed to play audio track for user ${user.uid}:`, err);
          success = false;
        }
      }
    }
    if (success) {
      setAutoplayBlocked(false);
      showToast('Audio enabled successfully.', 'success');
    } else {
      showToast('Failed to enable some audio tracks. Please try again.', 'error');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#03000a] flex flex-col font-sans select-none">
      {/* Sleek Floating Header HUD */}
      <div className="absolute top-4 left-4 right-4 p-3.5 bg-[#0b0314]/80 backdrop-blur-2xl border border-white/15 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-neon/10 border border-neon/30 flex items-center justify-center text-neon shadow-[0_0_15px_rgba(255,0,127,0.3)]">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-white font-bold text-sm tracking-wide">{partnerName}</h3>
            <p className="text-[11px] text-gray-400 flex items-center gap-2 font-mono">
              {isJoined ? (
                <>
                  <span className="text-gray-300 font-semibold">{callType === 'audio' ? 'Audio Date' : 'HD Video'} • {formatDuration(callDuration)}</span>
                  {networkQuality > 0 && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px]">
                      {getNetworkIcon()} {getNetworkLabel()}
                    </span>
                  )}
                </>
              ) : (
                <span className="text-neon animate-pulse font-sans">Connecting encrypted stream...</span>
              )}
            </p>
          </div>
        </div>
        <button
          onClick={handleEndCall}
          className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 text-gray-300 hover:text-white rounded-full transition-colors active:scale-95"
          aria-label="Close call"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative bg-gradient-to-b from-[#08020f] to-black flex items-center justify-center overflow-hidden">
        {/* Render ALL remote users hidden or visible */}
        {remoteUsers.map((user) => (
          <div
            key={user.uid}
            className={`absolute inset-0 ${user.videoTrack ? 'z-10' : '-z-10'}`}
            style={{ display: user.videoTrack ? 'block' : 'none' }}
          >
            <div
              id={`remote-video-${user.uid}`}
              className="w-full h-full"
              style={{ objectFit: 'cover' }}
            />
          </div>
        ))}

        {/* Reconnecting overlay */}
        {isReconnecting && (
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/80 backdrop-blur-xl animate-in fade-in">
            <div className="text-center p-6 bg-[#0b0314]/90 border border-yellow-500/30 rounded-3xl shadow-[0_0_40px_rgba(234,179,8,0.2)] max-w-xs mx-4">
              <div className="w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mx-auto mb-3 text-yellow-400">
                <WifiOff className="w-7 h-7 animate-pulse" />
              </div>
              <p className="text-yellow-400 font-bold text-base">Reconnecting Stream...</p>
              <p className="text-gray-400 text-xs mt-1">Stabilizing real-time audio and video packets</p>
            </div>
          </div>
        )}

        {/* Waiting/Audio-only UI with Multi-Layer Voice Aura */}
        {(!remoteUsers.length || !remoteUsers.some(u => u.videoTrack)) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center z-0 p-4">
            <div className="relative flex items-center justify-center mb-8">
              {/* Outer Pulsating Sonic Radar Wave */}
              <div className="absolute w-52 h-52 rounded-full border border-neon/20 animate-ping opacity-30 pointer-events-none" />
              <div className="absolute w-44 h-44 rounded-full border border-pink-500/30 animate-pulse pointer-events-none" />
              <div className="absolute w-36 h-36 rounded-full bg-gradient-to-tr from-neon/30 to-purple-600/30 blur-2xl -z-10" />

              {/* Main Avatar Bubble */}
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-neon shadow-[0_0_35px_rgba(255,0,127,0.6)] relative z-10">
                <img
                  src={partnerAvatar || 'https://via.placeholder.com/150'}
                  alt={partnerName}
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <h2 className="text-2xl font-bold text-white mb-1.5 tracking-tight">{partnerName}</h2>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-gray-300 backdrop-blur-md">
              <span className="w-2 h-2 rounded-full bg-neon animate-pulse" />
              <span>{remoteUsers.length > 0 ? 'Connected • Live Audio' : 'Establishing connection...'}</span>
            </div>
          </div>
        )}

        {/* Local Video (picture-in-picture) */}
        <div className={`absolute top-24 right-4 w-32 h-44 md:w-40 md:h-56 bg-black/80 backdrop-blur-md rounded-2xl overflow-hidden border-2 border-white/20 shadow-[0_15px_35px_rgba(0,0,0,0.8)] transition-all duration-300 z-30 ${(!localVideoTrack || isVideoOff) ? 'opacity-0 pointer-events-none scale-95' : 'opacity-100 scale-100'}`}>
          <div
            id="local-video"
            className="w-full h-full"
            style={{ objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm border border-white/10 text-[9px] font-bold uppercase tracking-wider text-white">
            You
          </div>
        </div>
      </div>

      {/* Call Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-3 md:p-6 pb-[max(1rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-black/95 via-black/70 to-transparent backdrop-blur-sm flex flex-wrap items-center justify-center gap-2.5 md:gap-6 z-40">
        <button
          onClick={toggleMute}
          className={`p-3 md:p-4 rounded-full transition-all shrink-0 ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
          aria-label={isMuted ? "Unmute microphone" : "Mute microphone"}
        >
          {isMuted ? <MicOff className="w-5 h-5 md:w-6 md:h-6 text-white" /> : <Mic className="w-5 h-5 md:w-6 md:h-6 text-white" />}
        </button>

        <button
          onClick={handleEndCall}
          className="p-3.5 md:p-5 rounded-full bg-red-600 hover:bg-red-700 transition-all shadow-lg hover:scale-110 shrink-0"
          aria-label="End call"
        >
          <PhoneOff className="w-6 h-6 md:w-8 md:h-8 text-white" />
        </button>

        {callType === 'video' && (
          <button
            onClick={toggleVideo}
            className={`p-3 md:p-4 rounded-full transition-all shrink-0 ${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            aria-label={isVideoOff ? "Turn on camera" : "Turn off camera"}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5 md:w-6 md:h-6 text-white" /> : <VideoIcon className="w-5 h-5 md:w-6 md:h-6 text-white" />}
          </button>
        )}
        {customControls}
      </div>

      {autoplayBlocked && (
        <div className="absolute inset-0 flex items-center justify-center z-50 bg-black/80 backdrop-blur-md">
          <div className="text-center p-6 bg-gray-900 border border-gray-800 rounded-2xl max-w-sm mx-4 shadow-2xl">
            <MicOff className="w-12 h-12 text-red-500 mx-auto mb-4 animate-bounce" />
            <h3 className="text-lg font-bold text-white mb-2">Audio is Blocked</h3>
            <p className="text-gray-400 text-sm mb-6">
              Your browser blocked remote audio autoplay. Click the button below to enable audio.
            </p>
            <button
              onClick={handleResumeAudio}
              className="w-full py-3 px-6 rounded-xl bg-neon hover:bg-neon/90 text-black font-bold transition-all shadow-lg hover:scale-105"
            >
              Enable Audio
            </button>
          </div>
        </div>
      )}
    </div>
  );
};