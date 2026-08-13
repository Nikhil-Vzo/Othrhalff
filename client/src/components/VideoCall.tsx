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

            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/agora-token`, {
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
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/80 to-transparent backdrop-blur z-10 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-neon" />
          <div>
            <h3 className="text-white font-bold">{partnerName}</h3>
            <p className="text-xs text-gray-400 flex items-center gap-2">
              {isJoined ? (
                <>
                  <span>{callType === 'audio' ? 'Audio' : 'Video'} • {formatDuration(callDuration)}</span>
                  {networkQuality > 0 && <span className="flex items-center gap-1">{getNetworkIcon()} {getNetworkLabel()}</span>}
                </>
              ) : 'Connecting...'}
            </p>
          </div>
        </div>
        <button
          onClick={handleEndCall}
          className="p-2 hover:bg-gray-800 rounded-full transition-colors"
        >
          <X className="w-6 h-6 text-white" />
        </button>
      </div>

      {/* Video Container */}
      {/* Video Container */}
      <div className="flex-1 relative bg-gray-900">
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
          <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/70 backdrop-blur-sm">
            <div className="text-center">
              <WifiOff className="w-12 h-12 text-yellow-400 mx-auto mb-3 animate-pulse" />
              <p className="text-yellow-400 font-bold text-lg">Reconnecting...</p>
              <p className="text-gray-400 text-sm mt-1">Check your internet connection</p>
            </div>
          </div>
        )}

        {/* Waiting/Audio-only UI - Show if no remote video tracks are visible */}
        {(!remoteUsers.length || !remoteUsers.some(u => u.videoTrack)) && (
          <div className="absolute inset-0 flex items-center justify-center z-0">
            <div className="text-center">
              <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-neon shadow-lg shadow-neon/50 mx-auto mb-6 animate-pulse">
                <img
                  src={partnerAvatar || 'https://via.placeholder.com/150'}
                  alt={partnerName}
                  className="w-full h-full object-cover"
                />
              </div>
              <h2 className="text-2xl font-bold text-white mb-2">{partnerName}</h2>
              <p className="text-gray-400 animate-pulse">
                {remoteUsers.length > 0 ? 'Connected • Audio Only' : 'Waiting for connection...'}
              </p>
            </div>
          </div>
        )}

        {/* Local Video (picture-in-picture) */}
        {/* Only show if we have a video track */}
        <div className={`absolute top-20 right-4 w-32 h-44 md:w-40 md:h-56 bg-gray-800 rounded-2xl overflow-hidden border-2 border-gray-700 shadow-2xl transition-all duration-300 z-50 ${(!localVideoTrack || isVideoOff) ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div
            id="local-video"
            className="w-full h-full"
            style={{ objectFit: 'cover', transform: 'scaleX(-1)' }}
          />
        </div>

        {/* If video is valid but off, show icon? No, just hide self view for cleaner look or show icon? */}
        {/* Existing code showed "VideoOff" icon overlay. */}
      </div>

      {/* Call Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/80 to-transparent backdrop-blur flex items-center justify-center gap-6 z-10">
        <button
          onClick={toggleMute}
          className={`p-4 rounded-full transition-all ${isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
            }`}
        >
          {isMuted ? <MicOff className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
        </button>

        <button
          onClick={handleEndCall}
          className="p-5 rounded-full bg-red-600 hover:bg-red-700 transition-all shadow-lg hover:scale-110"
        >
          <PhoneOff className="w-8 h-8 text-white" />
        </button>



        {callType === 'video' && (
          <button
            onClick={toggleVideo}
            className={`p-4 rounded-full transition-all ${isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-700 hover:bg-gray-600'
              }`}
          >
            {isVideoOff ? <VideoOff className="w-6 h-6 text-white" /> : <VideoIcon className="w-6 h-6 text-white" />}
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