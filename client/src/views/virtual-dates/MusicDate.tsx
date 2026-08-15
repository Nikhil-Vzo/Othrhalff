import React, { useState, useRef, useEffect } from 'react';
import { ArrowLeft, AlertCircle, Play, Pause, Search, Music, X, Hash, Users, Copy, PlusCircle, LogIn, LogOut, MessageSquare, Send, Mic, MicOff, Video, VideoOff, Loader, Volume2, Maximize, Minimize, FileText, Image as ImageIcon, SkipForward, ListMusic, Lock, Share2, Eye, EyeOff, ChevronUp, ChevronDown, Shield } from 'lucide-react';
import { useRouter as useNavigate } from 'next/navigation';
import Peer, { DataConnection } from 'peerjs';
import { ShareRoomModal } from '../../components/ShareRoomModal';
import { useAuth } from '../../context/AuthContext';
import { analytics } from '../../utils/analytics';
import { supabase } from '../../lib/supabase';
import { getIceServers } from '../../utils/webrtc';
import { hashPasscode } from '../../utils/security';
import { curatedRomanticTracks, trendingRomanticQueries } from '../../data/pcoRomanticTracks';
import { PcoAdminQuickPanel } from '../../components/PcoAdminQuickPanel';
import { PcoRadioPlayer } from '../../components/PcoRadioPlayer';
import { BottomSheet } from '../../components/BottomSheet';
import { checkIsPcoAdmin, submitPcoSongRequest, updatePcoSongRequestStatus } from '../../services/pcoAdmin';

type DateMode = 'landing' | 'create_room' | 'join_room' | 'room';
type LyricLine = { time: number; text: string };

interface Track {
    id: string;
    song: string;
    singers: string;
    image: string;
    media_url: string;
    media_preview_url?: string;
    duration: string;
    is_drm?: boolean;
}

interface PeerStream {
    peerId: string;
    stream: MediaStream;
}

const StreamVideo = ({ stream, muted = false, mirrored, volume = 1 }: { stream: MediaStream, muted?: boolean, mirrored: boolean, volume?: number }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream;
        }
    }, [stream]);

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume;
        }
    }, [volume]);
    return (
        <video
            ref={videoRef}
            autoPlay
            playsInline
            muted={muted}
            className="w-full h-full object-cover"
            style={{ transform: mirrored ? 'rotateY(180deg)' : 'none' }}
        />
    );
};

export const MusicDate = () => {
    const navigate = useNavigate();
    const [mode, setMode] = useState<DateMode>('landing');
    const [roomName, setRoomName] = useState('');
    const [roomCode, setRoomCode] = useState('');
    const [joinCode, setJoinCode] = useState('');
    const [isShareModalOpen, setIsShareModalOpen] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Music State
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResults, setSearchResults] = useState<Track[]>([]);
    const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [queue, setQueue] = useState<Track[]>([]);

    // Privacy & Passcode state
    const [isPrivateRoom, setIsPrivateRoom] = useState(false);
    const [roomPasscode, setRoomPasscode] = useState<string | null>(null);
    const [needsPasscode, setNeedsPasscode] = useState(false);
    const [enteredPasscode, setEnteredPasscode] = useState('');
    const [passcodeError, setPasscodeError] = useState<string | null>(null);

    const isPrivateRoomRef = useRef(isPrivateRoom);
    const roomPasscodeRef = useRef(roomPasscode);
    const lastSyncTimeRef = useRef<number>(0);
    const staleHostProcessingRef = useRef<boolean>(false);
    const dummyStreamRef = useRef<MediaStream | null>(null);
    const dummyAudioCtxRef = useRef<AudioContext | null>(null);
    const lyricsAbortControllerRef = useRef<AbortController | null>(null);
    const currentObjectUrlRef = useRef<string | null>(null);

    useEffect(() => {
        isPrivateRoomRef.current = isPrivateRoom;
        roomPasscodeRef.current = roomPasscode;
    }, [isPrivateRoom, roomPasscode]);

    // Volume & Fullscreen State
    const [showVolumeControls, setShowVolumeControls] = useState(false);
    const [musicVolume, setMusicVolume] = useState(1);
    const [partnerVolume, setPartnerVolume] = useState(1);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showMobileSearch, setShowMobileSearch] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const handleResize = () => {
            if (typeof window !== 'undefined') {
                setIsMobile(window.innerWidth < 768);
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);
    const containerRef = useRef<HTMLDivElement>(null);


    // Lyrics State
    const [showLyrics, setShowLyrics] = useState(false);
    const [lyricsData, setLyricsData] = useState<LyricLine[] | null>(null);
    const [plainLyrics, setPlainLyrics] = useState<string | null>(null);
    const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
    const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);
    const lyricsContainerRef = useRef<HTMLDivElement>(null);

    const audioRef = useRef<HTMLAudioElement>(null);
    const [audioReady, setAudioReady] = useState(false);

    // Center panel search state unified with sidebar search

    // Draggable Cams State
    const [camPositions, setCamPositions] = useState<{ [key: string]: { x: number, y: number } }>({});
    const camPositionsRef = useRef(camPositions);
    useEffect(() => { camPositionsRef.current = camPositions; }, [camPositions]);
    const dragInfo = useRef<{ id: string | null, startX: number, startY: number, initialX: number, initialY: number }>({
        id: null, startX: 0, startY: 0, initialX: 0, initialY: 0
    });

    // Peer & WebRTC State
    const [myPeerId, setMyPeerId] = useState<string>('');
    const [peers, setPeers] = useState<PeerStream[]>([]);
    const [peerNames, setPeerNames] = useState<Record<string, string>>({});
    const [isHost, setIsHost] = useState(false);
    const [myStream, setMyStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);

    const [roomHostId, setRoomHostId] = useState<string | null>(null);
    const roomHostIdRef = useRef<string | null>(null);
    const roomCodeRef = useRef<string>('');
    const myPeerIdRef = useRef<string>('');
    const peersRef = useRef<PeerStream[]>([]);
    const hostRef = useRef(isHost);
    const myStreamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        roomHostIdRef.current = roomHostId;
        roomCodeRef.current = roomCode;
        myPeerIdRef.current = myPeerId;
        peersRef.current = peers;
        hostRef.current = isHost;
        myStreamRef.current = myStream;
    }, [roomHostId, roomCode, myPeerId, peers, isHost, myStream]);

    // Helper: Create Dummy Stream (Cached, AudioContext & iOS Safari Safe)
    const createDummyStream = () => {
        if (dummyStreamRef.current && dummyStreamRef.current.active) {
            return dummyStreamRef.current;
        }

        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 480;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = '#000000';
            ctx.fillRect(0, 0, 640, 480);
            ctx.font = '30px Arial';
            ctx.fillStyle = '#ffffff';
            ctx.fillText('Spectator', 250, 240);
        }
        const videoTrack = canvas.captureStream(30).getVideoTracks()[0];

        let audioTrack: MediaStreamTrack | null = null;
        try {
            if (!dummyAudioCtxRef.current || dummyAudioCtxRef.current.state === 'closed') {
                dummyAudioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            if (dummyAudioCtxRef.current) {
                if (dummyAudioCtxRef.current.state === 'suspended') {
                    const resumeCtx = () => {
                        dummyAudioCtxRef.current?.resume().catch(() => {});
                        window.removeEventListener('click', resumeCtx);
                        window.removeEventListener('touchstart', resumeCtx);
                    };
                    window.addEventListener('click', resumeCtx, { once: true });
                    window.addEventListener('touchstart', resumeCtx, { once: true });
                }
                const dst = dummyAudioCtxRef.current.createMediaStreamDestination();
                audioTrack = dst.stream.getAudioTracks()[0] || null;
                if (audioTrack) {
                    audioTrack.enabled = false;
                }
            }
        } catch (audioErr) {
            console.warn("AudioContext setup deferred for user gesture:", audioErr);
        }

        const stream = new MediaStream([videoTrack, audioTrack].filter(Boolean) as MediaStreamTrack[]);
        dummyStreamRef.current = stream;
        return stream;
    };

    const handleHostDisconnect = async () => {
        setMessages(prev => [...prev.slice(-149), { user: 'System', text: 'Host disconnected. Electing a new room host...' }]);
        
        // 1. Query active open connections as source of truth for peer election
        const connectedPeerIds = Object.keys(connections.current).filter(
            id => connections.current[id]?.open
        );
        const remainingPeerIds = [myPeerIdRef.current, ...connectedPeerIds].sort();
        
        if (remainingPeerIds.length === 0) return;
        
        // 2. Smallest alphabetical ID becomes the new host
        const newHostId = remainingPeerIds[0];
        
        if (newHostId === myPeerIdRef.current) {
            console.log("We have been elected as the new host!");
            setIsHost(true);
            setRoomHostId(myPeerIdRef.current);
            
            if (supabase) {
                try {
                    await supabase
                        .from('active_rooms')
                        .upsert({
                            room_id: roomCodeRef.current,
                            host_peer_id: myPeerIdRef.current,
                            updated_at: new Date().toISOString(),
                            is_private: isPrivateRoomRef.current,
                            passcode: roomPasscodeRef.current,
                            participant_count: connectedPeerIds.length + 1
                        });
                    setMessages(prev => [...prev.slice(-149), { user: 'System', text: 'You are now the host of this room.' }]);
                } catch (err) {
                    console.error("Error registering elected host in Supabase:", err);
                }
            }
        } else {
            console.log(`Peer ${newHostId} has been elected as the new host.`);
            setRoomHostId(newHostId);
        }
    };

    const handleStaleHost = async () => {
        const currentRoom = roomCodeRef.current;
        if (!currentRoom) return;

        if (staleHostProcessingRef.current) return;
        staleHostProcessingRef.current = true;

        try {
            if (supabase && roomHostIdRef.current) {
                const { data: roomData } = await supabase
                    .from('active_rooms')
                    .select('host_peer_id, updated_at')
                    .eq('room_id', currentRoom)
                    .single();

                if (roomData) {
                    const lastActive = new Date(roomData.updated_at).getTime();
                    const now = Date.now();
                    const isStale = (now - lastActive) > 15000;

                    if (roomData.host_peer_id === roomHostIdRef.current && isStale) {
                        await supabase
                            .from('active_rooms')
                            .delete()
                            .eq('room_id', currentRoom)
                            .eq('host_peer_id', roomHostIdRef.current);
                    } else {
                        return;
                    }
                }
            }

            if (peerInstance.current) {
                peerInstance.current.destroy();
                peerInstance.current = null;
            }
            setPeers([]);
            setRoomHostId(null);
            setIsHost(false);
            setRoomCode('');
            await new Promise(r => setTimeout(r, 400));
            setRoomCode(currentRoom);
        } catch (err) {
            console.error("Error cleaning up stale host:", err);
        } finally {
            staleHostProcessingRef.current = false;
        }
    };

    const handleLeaveRoom = () => {
        if (typeof window !== 'undefined') {
            window.history.replaceState(null, '', window.location.pathname);
        }

        // Broadcast LEAVE message
        try {
            broadcastData({ type: 'LEAVE' });
        } catch (_) {}

        // Synchronously stop all local media tracks
        if (myStreamRef.current) {
            myStreamRef.current.getTracks().forEach(track => {
                track.stop();
                track.enabled = false;
            });
        }
        setMyStream(null);

        // Cancel in-flight lyrics requests
        if (lyricsAbortControllerRef.current) {
            lyricsAbortControllerRef.current.abort();
            lyricsAbortControllerRef.current = null;
        }

        // Revoke active audio object URL safely
        if (currentObjectUrlRef.current) {
            URL.revokeObjectURL(currentObjectUrlRef.current);
            currentObjectUrlRef.current = null;
        }
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.removeAttribute('src');
            audioRef.current.load();
        }

        // Close all peer connections
        Object.values(connections.current).forEach(conn => {
            try { conn.close(); } catch (_) {}
        });
        connections.current = {};

        if (isHost && supabase && peerInstance.current) {
            supabase
                .from('active_rooms')
                .delete()
                .eq('room_id', roomCode)
                .eq('host_peer_id', peerInstance.current.id)
                .then(({ error: delErr }) => {
                    if (delErr) console.error("Error deleting room host on leave:", delErr);
                });
        }

        if (peerInstance.current) {
            peerInstance.current.destroy();
            peerInstance.current = null;
        }

        setPeers([]);
        setMode('landing');
        setRoomCode('');
        setRoomName('');
        setRoomHostId(null);
        setQueue([]);
        setCurrentTrack(null);
        window.location.hash = '';
    };

    const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text).then(() => {
            setCopyFeedback('Copied!');
            setTimeout(() => setCopyFeedback(null), 2000);
        }).catch(() => {
            setCopyFeedback('Failed to copy');
            setTimeout(() => setCopyFeedback(null), 2000);
        });
    };
    const { currentUser } = useAuth();
    const displayName = currentUser?.realName || currentUser?.anonymousId || 'Anonymous';

    const [matches, setMatches] = useState<{ id: string; partnerName: string }[]>([]);
    const [showInviteMenu, setShowInviteMenu] = useState(false);

    useEffect(() => {
        const fetchMatches = async () => {
            if (!currentUser || !supabase) return;
            try {
                const { data: matchesData, error: matchesError } = await supabase
                    .from('matches')
                    .select('id, user_a, user_b')
                    .or(`user_a.eq.${currentUser.id},user_b.eq.${currentUser.id}`);
                
                if (matchesError) throw matchesError;
                if (!matchesData || matchesData.length === 0) return;

                const partnerIds = matchesData.map(m => m.user_a === currentUser.id ? m.user_b : m.user_a);

                const { data: profiles, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, anonymous_id, real_name')
                    .in('id', partnerIds);

                if (profilesError) throw profilesError;

                const mappedMatches = matchesData.map(m => {
                    const partnerId = m.user_a === currentUser.id ? m.user_b : m.user_a;
                    const profile = profiles?.find(p => p.id === partnerId);
                    return {
                        id: m.id,
                        partnerName: profile?.real_name || profile?.anonymous_id || 'Anonymous Match'
                    };
                });
                setMatches(mappedMatches);
            } catch (err) {
                console.error('Error fetching matches for invite:', err);
            }
        };

        fetchMatches();
    }, [currentUser?.id]);

    const handleInviteMatch = async (match: { id: string; partnerName: string }) => {
        setIsConnecting(true);
        setError(null);
        try {
            const unifiedCode = generateRoomCode();
            const roomUuid = `music_jam_${unifiedCode}`;
            
            const inviteText = `[INVITE:v1] ${JSON.stringify({
                action: 'join_room',
                type: 'music',
                room: roomUuid,
                url: `/sparx/music?room=${roomUuid}`,
                message: 'Music Jam Session'
            })}`;

            const { error: insertError } = await supabase
                .from('messages')
                .insert({
                    match_id: match.id,
                    sender_id: currentUser?.id,
                    text: inviteText
                });

            if (insertError) throw insertError;

            setRoomCode(roomUuid);
            setRoomName(`${match.partnerName}'s Jam`);
            setIsHost(true);
            setMode('room');
            setShowInviteMenu(false);
        } catch (err: any) {
            console.error('Error inviting match:', err);
            setError(`Failed to send invite: ${err.message || err}`);
            setTimeout(() => setError(null), 5000);
        } finally {
            setIsConnecting(false);
        }
    };

    // Chat Timestamp Formatter (< 1m: just now, < 60m: X min ago, > 60m: X hr(s) ago, > 24h: X day(s) ago)
    const formatChatTimestamp = (timestamp?: number) => {
        const time = Number(timestamp) || Date.now();
        const diffSec = Math.max(0, Math.floor((Date.now() - time) / 1000));
        if (diffSec < 60) return 'just now';
        const diffMin = Math.floor(diffSec / 60);
        if (diffMin < 60) return `${diffMin} min ago`;
        const diffHrs = Math.floor(diffMin / 60);
        if (diffHrs === 1) return '1 hr ago';
        if (diffHrs < 24) return `${diffHrs} hrs ago`;
        const diffDays = Math.floor(diffHrs / 24);
        return diffDays === 1 ? '1 day ago' : `${diffDays} days ago`;
    };

    // Chat State
    const [showChat, setShowChat] = useState(false);
    const [showUsersList, setShowUsersList] = useState(false);
    const [messages, setMessages] = useState<{ user: string, text: string, createdAt?: number }[]>([
        { user: 'System', text: 'Welcome to the Music Jam!', createdAt: Date.now() }
    ]);
    const [newMessage, setNewMessage] = useState('');

    const peerInstance = useRef<Peer | null>(null);
    const connections = useRef<{ [key: string]: DataConnection }>({});
    const peerNamesRef = useRef<Record<string, string>>(peerNames);
    useEffect(() => { peerNamesRef.current = peerNames; }, [peerNames]);

    // Navigation blocker — prevent accidental session loss with clean history stack
    const [showLeaveModal, setShowLeaveModal] = useState(false);
    const pendingNavRef = useRef<string | null>(null);

    useEffect(() => {
        if (mode !== 'room') return;
        let isBlocked = true;

        const handlePopState = () => {
            if (!isBlocked) return;
            window.history.pushState(null, '', window.location.href);
            setShowLeaveModal(true);
        };

        window.history.pushState(null, '', window.location.href);
        window.addEventListener('popstate', handlePopState);

        return () => {
            isBlocked = false;
            window.removeEventListener('popstate', handlePopState);
        };
    }, [mode]);

    // Admin & PCO State (Checks Supabase admin_users, profiles.is_admin, and fallback emails)
    const [isAdminUser, setIsAdminUser] = useState<boolean>(() => {
        const email = (currentUser?.universityEmail || '').toLowerCase().trim();
        return ['nikhilyadav200530@gmail.com', 'avneeshjha1506@gmail.com', 'dpursuit14@gmail.com', 'lachavzo11@gmail.com'].includes(email);
    });
    const isAdminUserRef = useRef(isAdminUser);
    useEffect(() => {
        isAdminUserRef.current = isAdminUser;
    }, [isAdminUser]);

    const pendingOffsetRef = useRef<number | null>(null);

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
                setIsAdminUser(hasAdmin);
            }
        };
        verifyAdmin();
        return () => { isMounted = false; };
    }, [currentUser]);
    const [dailyRequestsUsed, setDailyRequestsUsed] = useState(0);
    const [isSidebarHidden, setIsSidebarHidden] = useState(false);
    const [isMobilePcoPanel, setIsMobilePcoPanel] = useState(false);
    const [isAdminQuickPanelOpen, setIsAdminQuickPanelOpen] = useState(false);
    const [floatingNotifications, setFloatingNotifications] = useState<{ id: string; user: string; text: string }[]>([]);

    // Playlist Link Import State (For standard Soul Sync rooms)
    const [isImportingPlaylist, setIsImportingPlaylist] = useState(false);
    const [importStatus, setImportStatus] = useState<string | null>(null);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);
    const [playlistUrlInput, setPlaylistUrlInput] = useState('');

    const addFloatingNotification = (user: string, text: string) => {
        const id = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        setFloatingNotifications(prev => [...prev.slice(-3), { id, user, text }]);
        setTimeout(() => {
            setFloatingNotifications(prev => prev.filter(item => item.id !== id));
        }, 4500);
    };

    const [adminRequestModal, setAdminRequestModal] = useState<{ requester: string; track: Track; requestId?: string } | null>(null);
    const [pinnedBanner, setPinnedBanner] = useState<{ text: string; expiresAt: number } | null>(null);
    const [listenerCount, setListenerCount] = useState(1);
    const [presenceUsers, setPresenceUsers] = useState<string[]>([]);

    const [pcoPlaylist, setPcoPlaylist] = useState<Track[]>([]);

    // Seeded deterministic PRNG shuffle so 300+ romantic songs are randomized yet 100% synchronized across all listeners
    const seededShuffle = <T,>(array: T[], seed: number = 789456): T[] => {
        const arr = [...array];
        let m = arr.length;
        let t: T;
        let i: number;
        let s = seed;

        const random = () => {
            s |= 0;
            s = (s + 0x6D2B79F5) | 0;
            let t = Math.imul(s ^ (s >>> 15), 1 | s);
            t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
            return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
        };

        while (m) {
            i = Math.floor(random() * m--);
            t = arr[m];
            arr[m] = arr[i];
            arr[i] = t;
        }
        return arr;
    };

    const fetchPcoRealSongs = async (): Promise<Track[]> => {
        return seededShuffle(curatedRomanticTracks as Track[], 789456);
    };

    const getPcoSyncedTrack = (tracks: Track[]) => {
        const totalDuration = tracks.reduce((acc, t) => acc + (parseInt(t.duration, 10) || 240), 0);
        const nowSec = Math.floor(Date.now() / 1000);
        let cycleTime = nowSec % totalDuration;

        for (const track of tracks) {
            const dur = parseInt(track.duration, 10) || 240;
            if (cycleTime < dur) {
                return { track, offsetSec: cycleTime };
            }
            cycleTime -= dur;
        }
        return { track: tracks[0], offsetSec: 0 };
    };

    const triggerPinnedBanner = (text: string) => {
        setPinnedBanner({ text, expiresAt: Date.now() + 15000 });
    };

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (pinnedBanner) {
            interval = setInterval(() => {
                if (Date.now() >= pinnedBanner.expiresAt) {
                    setPinnedBanner(null);
                }
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [pinnedBanner]);

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const todayStr = new Date().toISOString().split('T')[0];
            const key = `pco_req_${todayStr}`;
            setDailyRequestsUsed(parseInt(localStorage.getItem(key) || '0', 10));
        }
    }, []);

    const incrementDailyRequests = () => {
        const todayStr = new Date().toISOString().split('T')[0];
        const key = `pco_req_${todayStr}`;
        const newCount = dailyRequestsUsed + 1;
        setDailyRequestsUsed(newCount);
        localStorage.setItem(key, newCount.toString());
    };

    useEffect(() => {
        if (!roomCode.includes('Campus_PCO') || !supabase) return;

        setRoomName('Campus PCO (24/7 Radio)');
        setShowChat(true);

        // 1. Initial time-synced deterministic romantic playlist
        const baseList = seededShuffle(curatedRomanticTracks as Track[], 789456);
        setPcoPlaylist(baseList);
        const { track, offsetSec } = getPcoSyncedTrack(baseList);
        setCurrentTrack(track);
        setIsPlaying(true);
        pendingOffsetRef.current = offsetSec;
        if (audioRef.current) {
            audioRef.current.currentTime = offsetSec;
        }

        // 2. Realtime Channel with Presence & Audio Broadcasts
        const pcoChannel = supabase.channel('campus_pco_live_chat', {
            config: { presence: { key: currentUser?.id || Math.random().toString() } }
        });

        const updatePresenceState = () => {
            const state = pcoChannel.presenceState();
            const usersList: string[] = [];
            Object.values(state).forEach((presences: any) => {
                presences.forEach((p: any) => {
                    if (p.user) usersList.push(p.user);
                });
            });
            setListenerCount(usersList.length || 1);
            setPresenceUsers(usersList);
        };

        pcoChannel
            .on('presence', { event: 'sync' }, updatePresenceState)
            .on('presence', { event: 'join' }, updatePresenceState)
            .on('presence', { event: 'leave' }, updatePresenceState)
            .on('broadcast', { event: 'LIVE_CHAT_MSG' }, ({ payload }) => {
                if (payload && payload.text) {
                    setMessages(prev => [...prev.slice(-149), { user: payload.user, text: payload.text, createdAt: payload.createdAt || Date.now() }]);
                    addFloatingNotification(payload.user, payload.text);
                }
            })
            .on('broadcast', { event: 'PCO_REQUEST_NOTIFICATION' }, ({ payload }) => {
                if (payload && payload.track) {
                    triggerPinnedBanner(`📨 Song Request: "${payload.track.song}" (by ${payload.requester})`);
                    addFloatingNotification('System', `${payload.requester} requested: "${payload.track.song}"`);
                    setMessages(prev => [...prev.slice(-149), { user: 'System', text: `🎵 ${payload.requester} requested: "${payload.track.song}"` }]);
                    
                    if (isAdminUserRef.current) {
                        setAdminRequestModal({ requester: payload.requester, track: payload.track, requestId: payload.requestId });
                    }
                }
            })
            .on('broadcast', { event: 'PCO_PLAY_IMMEDIATELY' }, ({ payload }) => {
                if (payload && payload.track) {
                    setCurrentTrack(payload.track);
                    setIsPlaying(true);
                    triggerPinnedBanner(`🔥 Now Playing: "${payload.track.song}"`);
                    addFloatingNotification('System', `Now Playing: "${payload.track.song}"`);
                    setMessages(prev => [...prev.slice(-149), { user: 'System', text: `Now Playing: "${payload.track.song}"` }]);
                }
            })
            .on('broadcast', { event: 'PCO_PLAY_NEXT' }, ({ payload }) => {
                if (payload && payload.track) {
                    setQueue(prev => [payload.track, ...prev.filter(t => t.id !== payload.track.id)]);
                    triggerPinnedBanner(`⏭️ Playing Next: "${payload.track.song}"`);
                    addFloatingNotification('System', `Admin Queued Next: "${payload.track.song}"`);
                    setMessages(prev => [...prev.slice(-149), { user: 'System', text: `Admin Queued Next: "${payload.track.song}"` }]);
                }
            })
            .on('broadcast', { event: 'PCO_ADD_QUEUE' }, ({ payload }) => {
                if (payload && payload.track) {
                    setQueue(prev => [...prev, payload.track]);
                    triggerPinnedBanner(`➕ Added to Queue: "${payload.track.song}"`);
                    addFloatingNotification('System', `Added to Queue: "${payload.track.song}"`);
                    setMessages(prev => [...prev.slice(-149), { user: 'System', text: `Added to Queue: "${payload.track.song}"` }]);
                }
            })
            .on('broadcast', { event: 'PCO_QUEUE_SYNC' }, ({ payload }) => {
                if (payload && Array.isArray(payload.queue)) {
                    setQueue(payload.queue);
                }
            })
            .on('broadcast', { event: 'PCO_PLAY_STATE' }, ({ payload }) => {
                if (payload && typeof payload.playing === 'boolean') {
                    setIsPlaying(payload.playing);
                }
            })
            .on('broadcast', { event: 'PCO_SEEK' }, ({ payload }) => {
                if (audioRef.current && payload && typeof payload.time === 'number') {
                    audioRef.current.currentTime = payload.time;
                    setCurrentTime(payload.time);
                }
            })
            .on('broadcast', { event: 'PCO_QUEUE_QUERY' }, () => {
                pcoChannel.send({ type: 'broadcast', event: 'PCO_QUEUE_SYNC', payload: { queue: queueRef.current } });
            })
            .on('broadcast', { event: 'PCO_ADMIN_SKIP' }, () => {
                triggerPinnedBanner(`⏭️ Song skipped by Admin DJ`);
                addFloatingNotification('System', `Admin skipped the song`);
                handleSongEnded();
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await pcoChannel.track({
                        user: displayName,
                        online_at: new Date().toISOString()
                    });
                }
            });

        // 3. Periodic 30-Second Drift Correction for PCO Radio
        const driftInterval = setInterval(() => {
            if (!audioRef.current || audioRef.current.paused || queueRef.current.length > 0) return;
            const totalDuration = baseList.reduce((acc, t) => acc + (parseInt(t.duration, 10) || 240), 0);
            if (totalDuration === 0) return;
            const nowSec = Math.floor(Date.now() / 1000);
            let cycleTime = nowSec % totalDuration;

            for (const t of baseList) {
                const dur = parseInt(t.duration, 10) || 240;
                if (cycleTime < dur) {
                    if (currentTrackRef.current?.id === t.id && audioRef.current) {
                        const drift = Math.abs(audioRef.current.currentTime - cycleTime);
                        if (drift > 1.5) {
                            console.log(`[PCO Radio] Correcting clock drift: ${drift.toFixed(2)}s`);
                            audioRef.current.currentTime = cycleTime;
                            setCurrentTime(cycleTime);
                        }
                    }
                    break;
                }
                cycleTime -= dur;
            }
        }, 30000);

        return () => {
            clearInterval(driftInterval);
            supabase.removeChannel(pcoChannel);
        };
    }, [roomCode]);

    // Unblock browser autoplay on first user click or touch
    useEffect(() => {
        const handleFirstInteraction = () => {
            if (audioRef.current && audioRef.current.paused) {
                audioRef.current.play().catch(err => console.warn("Autoplay unblocked on interaction:", err));
            }
            window.removeEventListener('click', handleFirstInteraction);
            window.removeEventListener('keydown', handleFirstInteraction);
            window.removeEventListener('touchstart', handleFirstInteraction);
        };

        window.addEventListener('click', handleFirstInteraction);
        window.addEventListener('keydown', handleFirstInteraction);
        window.addEventListener('touchstart', handleFirstInteraction);

        return () => {
            window.removeEventListener('click', handleFirstInteraction);
            window.removeEventListener('keydown', handleFirstInteraction);
            window.removeEventListener('touchstart', handleFirstInteraction);
        };
    }, []);



    // Warn on tab close / refresh while in a room & handle visibility change on mobile
    useEffect(() => {
        if (mode !== 'room') return;

        const handleBeforeUnload = (e: BeforeUnloadEvent) => {
            e.preventDefault();
            e.returnValue = '';
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden' && peerInstance.current) {
                try { broadcastData({ type: 'LEAVE' }); } catch (_) {}
            }
        };

        const handleUnload = () => {
            if (peerInstance.current) {
                try { broadcastData({ type: 'LEAVE' }); } catch (_) {}
                peerInstance.current.destroy();
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        window.addEventListener('unload', handleUnload);
        document.addEventListener('visibilitychange', handleVisibilityChange);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('unload', handleUnload);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            dummyAudioCtxRef.current?.close().catch(() => {});
        };
    }, [mode]);

    const parseRoomName = (roomId: string) => {
        const parts = roomId.split('_');
        if (parts.length >= 3) {
            return parts[1];
        }
        return roomId.replace(/-/g, ' ').toUpperCase();
    };

    // URL Query Sync for Sharing and Join-on-Load
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const searchParams = new URLSearchParams(window.location.search);
            const queryRoom = searchParams.get('room');
            const queryPrivate = searchParams.get('private');
            const queryPasscode = searchParams.get('passcode');
            
            const queryCreateName = searchParams.get('createName');
            
            if (queryRoom && mode === 'landing') {
                setRoomCode(queryRoom);
                if (queryPrivate === 'true') setIsPrivateRoom(true);
                if (queryPasscode) {
                    setRoomPasscode(queryPasscode);
                    roomPasscodeRef.current = queryPasscode;
                } else if (queryPrivate === 'true') {
                    // REG-01: Read passcode set by Sparx into sessionStorage
                    const storedPass = sessionStorage.getItem(`room_passcode_${queryRoom}`);
                    if (storedPass) {
                        setRoomPasscode(storedPass);
                        roomPasscodeRef.current = storedPass;
                    }
                }

                if (queryCreateName) {
                    setRoomName(queryCreateName);
                    setIsHost(true);
                    setMode('create_room');
                    sessionStorage.setItem('host_room_code', queryRoom);
                } else {
                    const isSessionHost = sessionStorage.getItem('host_room_code') === queryRoom;
                    setRoomName(parseRoomName(queryRoom));
                    setIsHost(isSessionHost);
                    // If they are recovering their host session, go back to create_room so they can "Start Jam"
                    setMode(isSessionHost ? 'create_room' : 'room');
                }
                
                window.history.replaceState(null, '', window.location.pathname + `?room=${queryRoom}`);
                setError(null);
                return;
            }
        }
    }, [mode]);

    // References for callbacks
    const currentTrackRef = useRef(currentTrack);
    const isPlayingRef = useRef(isPlaying);
    const queueRef = useRef(queue);
    const lastPlayRef = useRef<number>(0);
    useEffect(() => {
        currentTrackRef.current = currentTrack;
        isPlayingRef.current = isPlaying;
        queueRef.current = queue;
    }, [currentTrack, isPlaying, queue]);

    // Initialize Peer
    useEffect(() => {
        if (roomCode && !needsPasscode) {
            if (peerInstance.current && (peerInstance.current.id === roomHostId || peerInstance.current.id === myPeerId)) {
                return;
            }

            if (peerInstance.current) {
                console.log("Destroying old peer instance");
                peerInstance.current.destroy();
                peerInstance.current = null;
            }

            setPeers([]);

            const initPeer = async () => {
                // Campus PCO is 24/7 radio mode: Pure Supabase presence & broadcast, NO WebRTC/PeerJS needed!
                if (roomCode.includes('Campus_PCO')) {
                    setIsHost(false);
                    setMode('room');
                    setIsConnecting(false);
                    setMyStream(null);
                    return;
                }

                setIsConnecting(true);
                try {
                    // 1. Query Supabase to see if a host exists
                    let activeHostId: string | null = null;
                    let dbIsPrivate = false;
                    let dbPasscode: string | null = null;
                    if (supabase) {
                        try {
                            const { data, error: queryError } = await supabase
                                .from('active_rooms')
                                .select('host_peer_id, is_private, passcode')
                                .eq('room_id', roomCode)
                                .maybeSingle();
                            
                            if (!queryError && data) {
                                activeHostId = data.host_peer_id;
                                dbIsPrivate = data.is_private;
                                dbPasscode = data.passcode;
                            }
                        } catch (supabaseErr) {
                            console.error("Error querying active host:", supabaseErr);
                        }
                    }

                    // Check Passcode if joining existing private room
                    if (activeHostId && dbIsPrivate) {
                        const effectivePasscode = roomPasscodeRef.current || roomPasscode;
                        const effectiveHash = effectivePasscode ? await hashPasscode(effectivePasscode) : null;
                        if (effectivePasscode !== dbPasscode && effectiveHash !== dbPasscode) {
                            setNeedsPasscode(true);
                            setIsConnecting(false);
                            return; // Halt initialization until passcode is provided
                        }
                    }

                    // 2. Request Media Permissions
                    let stream: MediaStream;
                    try {
                        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
                    } catch (err) {
                        console.warn("Media Access Failed", err);
                        stream = createDummyStream();
                        setError("Camera unavailable. Joining as Spectator.");
                        setTimeout(() => setError(null), 5000);
                    }
                    setMyStream(stream);

                    // 3. Decide role and configure peer ID
                    let peerId: string | undefined = undefined;
                    let currentIsHost = false;
                    const expectedHostId = 'host-' + roomCode;

                    if (roomCode.includes('Campus_PCO')) {
                        currentIsHost = true;
                        setIsHost(true);
                        setMode('room');
                    } else if (activeHostId || !isHost) {
                        currentIsHost = false;
                        setIsHost(false);
                        const targetHost = activeHostId || expectedHostId;
                        setRoomHostId(targetHost);
                        setMode('room');
                    } else {
                        currentIsHost = true;
                        setIsHost(true);
                        peerId = expectedHostId;
                        setRoomHostId(peerId);
                        setMode('room');
                    }

                    const peerConfig: any = {
                        debug: 2,
                        config: {
                            iceServers: getIceServers()
                        }
                    };

                    const peer = peerId ? new Peer(peerId, peerConfig) : new Peer(peerConfig);

                    peer.on('open', async (id) => {
                        setMyPeerId(id);
                        console.log('My Peer ID:', id);

                        if (currentIsHost) {
                            if (supabase) {
                                try {
                                    const rawPass = roomPasscodeRef.current || roomPasscode;
                                    const storedPasscode = rawPass ? await hashPasscode(rawPass) : null;
                                    await supabase
                                        .from('active_rooms')
                                        .upsert({
                                            room_id: roomCode,
                                            host_peer_id: id,
                                            updated_at: new Date().toISOString(),
                                            is_private: isPrivateRoomRef.current,
                                            passcode: storedPasscode,
                                            participant_count: 1
                                        });
                                } catch (err) {
                                    console.error("Error upserting active room:", err);
                                }
                            }
                            analytics.virtualDateStart('Music Jam');
                        } else {
                            analytics.virtualDateJoin();
                            const targetHost = activeHostId || expectedHostId;
                            connectToPeer(targetHost, stream, peer);
                        }
                        setIsConnecting(false);
                    });

                    peer.on('error', (err) => {
                        console.error('Peer error (Full):', err);
                        let msg = `Connection Error: ${err.type || 'Unknown'}`;

                        if (err.type === 'peer-unavailable') {
                            if (roomCode.includes('Campus_PCO')) {
                                // Campus PCO radio mode — ignore peer unavailable warning
                                return;
                            }
                            if (!activeHostId) {
                                msg = "Waiting for host to start the room...";
                                setError(msg);
                                setTimeout(() => {
                                    setRoomCode('');
                                    setTimeout(() => setRoomCode(roomCode), 300);
                                }, 5000);
                                return;
                            } else {
                                msg = "Stale host detected. Initializing room...";
                                handleStaleHost();
                            }
                        } else if (err.type === 'unavailable-id') {
                            msg = "Room Name/Code is already taken. Please try another.";
                        } else if (err.type === 'network') {
                            msg = "Network connection lost. Reconnecting...";
                        } else if (err.type === 'server-error') {
                            msg = "Signaling server error. Please retry.";
                        }

                        setError(msg);
                if (['unavailable-id', 'invalid-id', 'invalid-key'].includes(err.type)) {
                            setTimeout(() => setMode('landing'), 3000);
                        } else {
                            setTimeout(() => setError(null), 5000);
                        }
                    });

                    const attachIceMonitoring = (c: any) => {
                        const pc = c?.peerConnection;
                        if (pc) {
                            let restartCount = 0;
                            pc.addEventListener('iceconnectionstatechange', () => {
                                if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
                                    if (restartCount < 2) {
                                        restartCount++;
                                        console.warn(`ICE state ${pc.iceConnectionState} with peer ${c.peer}. Attempting ICE restart (${restartCount}/2)...`);
                                        try {
                                            if (typeof pc.restartIce === 'function') {
                                                pc.restartIce();
                                            }
                                        } catch (e) {
                                            console.error("ICE restart error:", e);
                                        }
                                    } else {
                                        console.warn(`ICE restart limit reached for peer ${c.peer}`);
                                    }
                                }
                            });
                        }
                    };

                    peer.on('call', (call) => {
                        console.log('Receiving call from:', call.peer);
                        attachIceMonitoring(call);
                        call.answer(stream);
                        call.on('stream', (remoteStream) => {
                            console.log('Received remote stream from host:', remoteStream.getTracks());
                            setPeers(prev => {
                                if (prev.find(p => p.peerId === call.peer)) return prev;
                                
                                setCamPositions(prevPos => {
                                    if (!prevPos[call.peer]) {
                                        const peerCount = prev.length;
                                        return { ...prevPos, [call.peer]: { 
                                            x: typeof window !== 'undefined' ? (window.innerWidth / 2) - 48 : 400, 
                                            y: typeof window !== 'undefined' ? (window.innerHeight / 2) - 32 + ((peerCount) * 80) : 300 
                                        }};
                                    }
                                    return prevPos;
                                });
                                return [...prev, { peerId: call.peer, stream: remoteStream }];
                            });
                        });
                        call.on('close', () => {
                            console.log("Call closed for peer:", call.peer);
                            setPeers(prev => prev.filter(p => p.peerId !== call.peer));
                        });
                        call.on('error', (err) => {
                            console.error("Call error:", err);
                        });
                    });

                    peer.on('connection', async (conn) => {
                        console.log('Data connection from:', conn.peer);
                        const peerPasscode = conn.metadata?.passcode;
                        if (isPrivateRoomRef.current && roomPasscodeRef.current) {
                            // P1: Compare both raw and hashed passcode to handle host (raw) vs guest (hash) scenarios
                            const peerHash = peerPasscode ? await hashPasscode(peerPasscode) : null;
                            const isValid = peerPasscode === roomPasscodeRef.current ||
                                            peerHash === roomPasscodeRef.current;
                            if (!isValid) {
                                console.warn("Rejected unauthorized peer connection:", conn.peer);
                                conn.close();
                                return;
                            }
                        }
                        setupDataConnection(conn);
                    });

                    peerInstance.current = peer;

                } catch (err: any) {
                    console.error("Critical Peer Init Error:", err);
                    setError(`System Error: ${err.message || 'Unknown'}`);
                    setIsConnecting(false);
                }
            };
            initPeer();

            return () => {
                // CLEANUP: Destroy peer when component unmounts or room changes
                if (peerInstance.current) {
                    console.log("Cleaning up Peer instance in MusicDate...");
                    if (isHost && supabase) {
                        supabase
                            .from('active_rooms')
                            .delete()
                            .eq('room_id', roomCode)
                            .eq('host_peer_id', peerInstance.current.id)
                            .then(({ error: delErr }) => {
                                if (delErr) console.error("Error deleting room host on unmount:", delErr);
                            });
                    }

                    peerInstance.current.destroy();
                    peerInstance.current = null;
                }
                setPeers([]);
                if (myStreamRef.current) {
                    myStreamRef.current.getTracks().forEach(track => track.stop());
                }
            };
        }
    }, [roomCode, needsPasscode, roomPasscode]);

    const connectToPeer = (targetId: string, stream: MediaStream, peer: Peer) => {
        console.log(`Attempting to connect to Host: ${targetId}`);
        const call = peer.call(targetId, stream);
        const conn = peer.connect(targetId, { 
            reliable: true, 
            metadata: { passcode: roomPasscodeRef.current || roomPasscode } 
        });

        const connectionTimeout = setTimeout(() => {
            if (!conn.open) {
                console.warn("Connection timeout - Host unreachable. Cleaning up stale host...");
                conn.close();
                handleStaleHost();
            }
        }, 8000);

        setupDataConnection(conn);

        conn.on('open', () => {
            clearTimeout(connectionTimeout);
            console.log("Connected to Host Data Channel!");
        });

        conn.on('error', (err) => {
            clearTimeout(connectionTimeout);
            console.error("Data Connection Error:", err);
            setError("Lost connection to Host.");
        });

        conn.on('close', () => {
            clearTimeout(connectionTimeout);
            console.log("Disconnected from Host");
            setError("Host disconnected.");
            if (targetId === roomHostIdRef.current) {
                handleHostDisconnect();
            }
        });

        const pc = (call as any)?.peerConnection;
        if (pc) {
            pc.addEventListener('iceconnectionstatechange', () => {
                if (pc.iceConnectionState === 'failed' || pc.iceConnectionState === 'disconnected') {
                    console.warn(`ICE state ${pc.iceConnectionState} with peer ${targetId}. Attempting ICE restart...`);
                    try {
                        if (typeof pc.restartIce === 'function') {
                            pc.restartIce();
                        }
                    } catch (e) {
                        console.error("ICE restart error:", e);
                    }
                }
            });
        }

        call.on('stream', (remoteStream) => {
            setPeers(prev => {
                if (prev.find(p => p.peerId === targetId)) return prev;
                
                setCamPositions(prevPos => {
                    if (!prevPos[targetId]) {
                        const peerCount = prev.length;
                        return { ...prevPos, [targetId]: { 
                            x: typeof window !== 'undefined' ? (window.innerWidth / 2) - 48 : 400, 
                            y: typeof window !== 'undefined' ? (window.innerHeight / 2) - 32 + ((peerCount) * 80) : 300 
                        }};
                    }
                    return prevPos;
                });
                return [...prev, { peerId: targetId, stream: remoteStream }];
            });
        });
        call.on('close', () => setPeers(prev => prev.filter(p => p.peerId !== targetId)));
        call.on('error', (err) => {
            console.error("Call error:", err);
        });
    };

    const setupDataConnection = (conn: DataConnection) => {
        conn.on('open', () => {
            connections.current[conn.peer] = conn;
            conn.send({ type: 'IDENTITY', payload: { name: displayName } });

            if (hostRef.current) {
                // 1. Sync queue & track
                conn.send({ type: 'SYNC_PLAYER', action: 'queue_sync', payload: queueRef.current });
                if (currentTrackRef.current) {
                    conn.send({ type: 'SYNC_PLAYER', action: 'track', payload: currentTrackRef.current });
                    if (isPlayingRef.current) {
                        conn.send({ type: 'SYNC_PLAYER', action: 'play' });
                        if (audioRef.current) {
                            conn.send({ type: 'SYNC_PLAYER', action: 'seek', time: audioRef.current.currentTime });
                        }
                    }
                }

                // 2. Send Peer List (Mesh)
                const currentPeers = peersRef.current.map(p => p.peerId);
                if (currentPeers.length > 0) {
                    conn.send({ type: 'PEER_LIST', peers: currentPeers });
                }
            }
        });

        conn.on('data', (data: any) => handleDataMessage(data, conn.peer));
        conn.on('close', () => {
            const leaveName = peerNamesRef.current[conn.peer] || conn.peer.substring(0, 5);
            setMessages(prev => [...prev.slice(-149), { user: 'System', text: `${leaveName} left the jam` }]);
            setPeers(prev => prev.filter(p => p.peerId !== conn.peer));
            delete connections.current[conn.peer];
        });
    };

    const handleDataMessage = (data: any, senderId: string) => {
        if (data.type === 'IDENTITY') {
            setPeerNames(prev => ({ ...prev, [senderId]: data.payload.name }));
            setMessages(prev => [...prev.slice(-149), { user: 'System', text: `${data.payload.name} joined the jam` }]);
        } else if (data.type === 'CHAT') {
            const senderName = peerNames[senderId] || senderId.substring(0, 5);
            setMessages(prev => [...prev.slice(-149), { user: senderName, text: data.text }]);
        } else if (data.type === 'SYNC_PLAYER') {
            if (data.action === 'track') {
                setCurrentTrack(data.payload);
            } else if (data.action === 'play') {
                setIsPlaying(true);
            } else if (data.action === 'pause') {
                setIsPlaying(false);
            } else if (data.action === 'seek' && audioRef.current) {
                audioRef.current.currentTime = data.time;
            } else if (data.action === 'time_update' && audioRef.current) {
                const diff = Math.abs(audioRef.current.currentTime - data.time);
                if (diff > 0.6) audioRef.current.currentTime = data.time;
            } else if (data.action === 'queue_add') {
                setQueue(prev => [...prev, data.payload]);
            } else if (data.action === 'queue_add_multiple') {
                setQueue(prev => [...prev, ...data.payload]);
            } else if (data.action === 'queue_sync') {
                setQueue(data.payload);
            }
        } else if (data.type === 'PEER_LIST') {
            if (peerInstance.current && myStream) {
                data.peers.forEach((pid: string) => {
                    if (pid !== myPeerId && !connections.current[pid]) {
                        connectToPeer(pid, myStream!, peerInstance.current!);
                    }
                });
            }
        }
    };

    const broadcastData = (data: any) => {
        Object.values(connections.current).forEach(conn => {
            if (conn.open) conn.send(data);
        });
    };

    // Sync participant count to Supabase
    useEffect(() => {
        if (isHost && roomCode && supabase) {
            const count = peers.length + 1; // +1 for the host
            supabase
                .from('active_rooms')
                .update({ participant_count: count })
                .eq('room_id', roomCode)
                .then(({ error }) => {
                    if (error) console.error("Error updating participant count:", error);
                });
        }
    }, [peers.length, isHost, roomCode]);

    // Initialize local camera position
    useEffect(() => {
        setCamPositions(prev => ({
            ...prev,
            'me': { 
                x: typeof window !== 'undefined' ? (window.innerWidth / 2) - 48 : 400, 
                y: typeof window !== 'undefined' ? (window.innerHeight / 2) - 32 : 300 
            }
        }));
    }, []);

    const broadcastSync = (action: string, payload: any = {}) => {
        if (!isHost && action !== 'queue_add') return;
        broadcastData({ type: 'SYNC_PLAYER', action, ...payload });
    };

    // Fullscreen and Volume Effects
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.volume = musicVolume;
        }
    }, [musicVolume]);

    useEffect(() => {
        const handleFullscreenChange = () => {
            const isFs = !!document.fullscreenElement;
            setIsFullscreen(isFs);
            // Fix 4: Re-trigger audio play after fullscreen transition
            if (audioRef.current && isPlayingRef.current) {
                audioRef.current.volume = musicVolume;
                audioRef.current.play().catch(e => console.warn('Fullscreen play resume:', e));
            }
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, [musicVolume]);

    const toggleFullscreen = async () => {
        if (!document.fullscreenElement) {
            if (containerRef.current?.requestFullscreen) {
                await containerRef.current.requestFullscreen();
            }
        } else {
            if (document.exitFullscreen) {
                await document.exitFullscreen();
            }
        }
    };

    // Direct audio loading & instant play — native browser streaming with zero CORS restrictions
    useEffect(() => {
        if (!currentTrack || !audioRef.current) return;
        
        const audio = audioRef.current;
        if (currentTrack.media_url) {
            audio.src = currentTrack.media_url;
            audio.volume = musicVolume;
            audio.load();
            setAudioReady(true);

            if (isPlaying) {
                const playPromise = audio.play();
                if (playPromise !== undefined) {
                    playPromise.catch(e => {
                        if (e.name !== 'AbortError') {
                            console.warn("[PCO Audio] Play prevented:", e);
                        }
                    });
                }
            }
        }
    }, [currentTrack]);

    // Audio Sync Effects — controls play/pause state
    useEffect(() => {
        if (!audioRef.current || !audioReady) return;
        if (isPlaying) {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    if (e.name !== 'AbortError') console.warn("[PCO Audio] Play error:", e);
                });
            }
        } else {
            audioRef.current.pause();
        }
    }, [isPlaying, audioReady]);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isHost && isPlaying) {
            interval = setInterval(() => {
                if (audioRef.current) {
                    broadcastSync('time_update', { time: audioRef.current.currentTime });
                }
            }, 2000);
        }
        return () => clearInterval(interval);
    }, [isHost, isPlaying]);

    // Reset lyrics when track changes
    useEffect(() => {
        setShowLyrics(false);
        setLyricsData(null);
        setPlainLyrics(null);
        setActiveLyricIndex(-1);
    }, [currentTrack]);

    // Search JioSaavn API — live debounced search
    const searchAbortRef = useRef<AbortController | null>(null);

    const performSearch = async (query: string) => {
        if (!query.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }
        // Cancel any in-flight request
        if (searchAbortRef.current) searchAbortRef.current.abort();
        const controller = new AbortController();
        searchAbortRef.current = controller;

        setIsSearching(true);
        setError(null);
        try {
            const timeout = setTimeout(() => controller.abort(), 10000);
            const res = await fetch(`https://saavnapi-nine.vercel.app/result/?query=${encodeURIComponent(query)}`, { signal: controller.signal });
            clearTimeout(timeout);
            if (!res.ok) throw new Error(`API error: ${res.status}`);
            const data = await res.json();
            if (Array.isArray(data) && data.length > 0) {
                // Always use original media_url (aac.saavncdn.com) — preview CDN is rate-limited
                const mappedTracks: Track[] = data.map((t: any) => {
                    const isDrm = t.is_drm === 1 || t.is_drm === true;
                    return {
                        id: t.id,
                        song: t.song,
                        singers: t.singers || t.primary_artists || '',
                        image: t.image,
                        media_url: t.media_url,
                        media_preview_url: t.media_preview_url,
                        duration: t.duration,
                        is_drm: isDrm,
                    };
                });
                setSearchResults(mappedTracks);
            } else {
                setSearchResults([]);
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return; // Silently ignore aborted requests
            setError('Failed to search. Try again.');
            setTimeout(() => setError(null), 4000);
        } finally {
            setIsSearching(false);
        }
    };

    // Auto-search as user types (400ms debounce)
    useEffect(() => {
        if (!searchQuery.trim()) {
            setSearchResults([]);
            return;
        }
        const timer = setTimeout(() => performSearch(searchQuery), 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    const parseLyrics = (lrcString: string): LyricLine[] => {
        const offsetMatch = lrcString.match(/\[offset:([+-]?\d+)\]/i);
        const globalOffset = offsetMatch ? parseInt(offsetMatch[1], 10) / 1000 : 0;

        const lines = lrcString.split('\n');
        const lyricsList: LyricLine[] = [];
        const timeRegex = /\[(\d{1,2}):(\d{2})(?:[.:](\d{2,3}))?\]/g;

        for (const line of lines) {
            const matches: RegExpExecArray[] = [];
            let match: RegExpExecArray | null;
            timeRegex.lastIndex = 0;
            while ((match = timeRegex.exec(line)) !== null) {
                matches.push(match);
            }

            if (matches.length > 0) {
                const text = line.replace(timeRegex, '').trim();
                if (text) {
                    for (const m of matches) {
                        const minutes = parseInt(m[1], 10);
                        const seconds = parseInt(m[2], 10);
                        const ms = m[3] ? parseInt(m[3].padEnd(3, '0').slice(0, 3), 10) : 0;
                        const time = Math.max(0, minutes * 60 + seconds + ms / 1000 + globalOffset);
                        lyricsList.push({ time, text });
                    }
                }
            }
        }
        return lyricsList.sort((a, b) => a.time - b.time);
    };

    const fetchLyricsForTrack = async (track: Track) => {
        if (lyricsAbortControllerRef.current) {
            lyricsAbortControllerRef.current.abort();
        }
        lyricsAbortControllerRef.current = new AbortController();

        setIsLoadingLyrics(true);
        setLyricsData(null);
        setPlainLyrics(null);
        setActiveLyricIndex(-1);
        activeLyricIndexRef.current = -1;

        try {
            const cleanSong = (track.song || '')
                .replace(/\(.*?\)/g, '')
                .replace(/\[.*?\]/g, '')
                .replace(/ - .*/g, '')
                .replace(/\|.*/g, '')
                .replace(/["']/g, '')
                .trim();
            const cleanSingers = (track.singers || '')
                .replace(/\(.*?\)/g, '')
                .split(',')[0]
                .trim();

            const durationSec = parseInt(track.duration, 10) || 0;

            let data: any = null;

            // Tier 1: Exact match with duration
            try {
                let url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanSong)}&artist_name=${encodeURIComponent(cleanSingers)}`;
                if (durationSec > 0) url += `&duration=${durationSec}`;
                const res = await fetch(url, { signal: lyricsAbortControllerRef.current.signal });
                if (res.ok) {
                    const hit = await res.json();
                    if (hit && hit.syncedLyrics) data = hit;
                }
            } catch (_) {}

            // Tier 2: Exact match without duration
            if (!data || !data.syncedLyrics) {
                try {
                    const url = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanSong)}&artist_name=${encodeURIComponent(cleanSingers)}`;
                    const res = await fetch(url, { signal: lyricsAbortControllerRef.current.signal });
                    if (res.ok) {
                        const hit = await res.json();
                        if (hit && hit.syncedLyrics) data = hit;
                    }
                } catch (_) {}
            }

            // Tier 3: Search with song + singer
            if (!data || !data.syncedLyrics) {
                try {
                    const searchQ = `${cleanSong} ${cleanSingers}`.trim();
                    const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(searchQ)}`, {
                        signal: lyricsAbortControllerRef.current.signal
                    });
                    if (res.ok) {
                        const list = await res.json();
                        if (Array.isArray(list) && list.length > 0) {
                            data = list.find((item: any) => item.syncedLyrics) || list[0];
                        }
                    }
                } catch (_) {}
            }

            // Tier 4: Search with song title only
            if (!data || !data.syncedLyrics) {
                try {
                    const res = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(cleanSong)}`, {
                        signal: lyricsAbortControllerRef.current.signal
                    });
                    if (res.ok) {
                        const list = await res.json();
                        if (Array.isArray(list) && list.length > 0) {
                            data = list.find((item: any) => item.syncedLyrics) || list[0];
                        }
                    }
                } catch (_) {}
            }

            if (data?.syncedLyrics) {
                const parsed = parseLyrics(data.syncedLyrics);
                if (parsed.length > 0) {
                    setLyricsData(parsed);
                } else if (data.plainLyrics) {
                    setPlainLyrics(data.plainLyrics);
                } else {
                    setPlainLyrics("No synced lyrics found for this song.");
                }
            } else if (data?.plainLyrics) {
                setPlainLyrics(data.plainLyrics);
            } else {
                setPlainLyrics("No lyrics available for this song.");
            }
        } catch (err: any) {
            if (err.name !== 'AbortError') {
                console.warn("[Lyrics] Failed to fetch lyrics:", err);
                setPlainLyrics("Unable to load lyrics at this time.");
            }
        } finally {
            setIsLoadingLyrics(false);
        }
    };

    const toggleLyrics = () => {
        if (!currentTrack) return;
        if (!showLyrics) {
            setShowLyrics(true);
            if (!lyricsData && !plainLyrics && !isLoadingLyrics) {
                fetchLyricsForTrack(currentTrack);
            }
        } else {
            setShowLyrics(false);
        }
    };

    useEffect(() => {
        if (currentTrack) {
            setLyricsData(null);
            setPlainLyrics(null);
            setActiveLyricIndex(-1);
            activeLyricIndexRef.current = -1;
            if (showLyrics) {
                fetchLyricsForTrack(currentTrack);
            }
        }
    }, [currentTrack?.id, currentTrack?.song]);

    const playSelectedTrack = async (track: Track) => {
        setIsPlaying(false);
        setCurrentTrack(track);
        setIsPlaying(true);
        broadcastSync('track', { payload: track });
        broadcastSync('play');
    };

    const handleImportPlaylistLink = async (url: string) => {
        if (!url.trim()) return;
        setIsImportingPlaylist(true);
        setImportStatus('Connecting to playlist...');
        setError(null);

        try {
            const res = await fetch('/api/playlist-import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: url.trim() })
            });

            const data = await res.json();
            if (!res.ok || !data.tracks || data.tracks.length === 0) {
                throw new Error(data.error || 'Failed to extract tracks from playlist link.');
            }

            setImportStatus(`Found ${data.tracks.length} songs! Resolving audio streams...`);

            // Resolve each track via JioSaavn search in parallel batches of 4
            const resolvedTracks: Track[] = [];
            const batchSize = 4;

            for (let i = 0; i < data.tracks.length; i += batchSize) {
                const batch = data.tracks.slice(i, i + batchSize);
                setImportStatus(`Resolving songs ${i + 1}-${Math.min(i + batchSize, data.tracks.length)} of ${data.tracks.length}...`);

                const batchPromises = batch.map(async (t: any) => {
                    try {
                        const searchRes = await fetch(`https://saavnapi-nine.vercel.app/result/?query=${encodeURIComponent(t.query)}`);
                        if (!searchRes.ok) return null;
                        const searchData = await searchRes.json();
                        if (Array.isArray(searchData) && searchData.length > 0) {
                            const top = searchData[0];
                            return {
                                id: top.id,
                                song: top.song || t.title,
                                singers: top.singers || top.primary_artists || t.artist || '',
                                image: top.image,
                                media_url: top.media_url,
                                media_preview_url: top.media_preview_url,
                                duration: top.duration,
                                is_drm: top.is_drm === 1 || top.is_drm === true
                            } as Track;
                        }
                    } catch (e) {
                        return null;
                    }
                    return null;
                });

                const batchResults = await Promise.all(batchPromises);
                batchResults.forEach(track => {
                    if (track && track.media_url) {
                        resolvedTracks.push(track);
                    }
                });
            }

            if (resolvedTracks.length === 0) {
                throw new Error('Could not find streamable tracks for the songs in this playlist.');
            }

            // Append to queue
            setQueue(prev => [...prev, ...resolvedTracks]);
            broadcastSync('queue_add_multiple', { payload: resolvedTracks });

            // If no track is playing and isHost, start playing first song immediately
            if (!currentTrack && isHost) {
                playSelectedTrack(resolvedTracks[0]);
                const remaining = resolvedTracks.slice(1);
                setQueue(remaining);
                broadcastSync('queue_sync', { payload: remaining });
            }

            setMessages(prev => [...prev.slice(-149), { 
                user: 'System', 
                text: `🎵 Imported ${resolvedTracks.length} songs from playlist into queue!` 
            }]);
            setSearchQuery('');
            setPlaylistUrlInput('');
            setIsImportModalOpen(false);
            setImportStatus(null);
        } catch (err: any) {
            console.error('Playlist import failed:', err);
            setError(err.message || 'Failed to import playlist.');
            setTimeout(() => setError(null), 5000);
        } finally {
            setIsImportingPlaylist(false);
            setImportStatus(null);
        }
    };

    const handleTrackSelect = (track: Track, forcePlay: boolean = false) => {
        if (isHost && (forcePlay || !currentTrack)) {
            playSelectedTrack(track);
        } else {
            // Add to queue for everyone
            broadcastSync('queue_add', { payload: track });
            setQueue(prev => [...prev, track]);
        }
    };

    const handlePcoAdminDirectPlay = (track: Track) => {
        setCurrentTrack(track);
        setIsPlaying(true);
        triggerPinnedBanner(`🔥 Admin Played: "${track.song}"`);
        addFloatingNotification('System', `Admin Played: "${track.song}"`);
        if (supabase && roomCode.includes('Campus_PCO')) {
            supabase.channel('campus_pco_live_chat').send({
                type: 'broadcast',
                event: 'PCO_PLAY_IMMEDIATELY',
                payload: { track }
            });
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    const handlePcoAdminPlayNext = (track: Track) => {
        setQueue(prev => [track, ...prev]);
        triggerPinnedBanner(`⏭️ Admin Queued Next: "${track.song}"`);
        addFloatingNotification('System', `Admin Queued Next: "${track.song}"`);
        if (supabase && roomCode.includes('Campus_PCO')) {
            supabase.channel('campus_pco_live_chat').send({
                type: 'broadcast',
                event: 'PCO_PLAY_NEXT',
                payload: { track, requester: displayName }
            });
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    const handlePcoAdminAddToQueue = (track: Track) => {
        setQueue(prev => [...prev, track]);
        triggerPinnedBanner(`➕ Admin Added to Queue: "${track.song}"`);
        addFloatingNotification('System', `Admin Added to Queue: "${track.song}"`);
        if (supabase && roomCode.includes('Campus_PCO')) {
            supabase.channel('campus_pco_live_chat').send({
                type: 'broadcast',
                event: 'PCO_ADD_QUEUE',
                payload: { track, requester: displayName }
            });
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    const handlePcoSongRequest = async (track: Track) => {
        if (!currentUser) {
            setError("Please log in to submit a song request!");
            setTimeout(() => setError(null), 4000);
            return;
        }

        if (!isAdminUser && dailyRequestsUsed >= 3) {
            setError("You have reached your limit of 3 song requests per day!");
            setTimeout(() => setError(null), 4000);
            return;
        }

        const result = await submitPcoSongRequest(track, currentUser, displayName);
        if (!result.success) {
            setError(result.error || "Song request failed. Please try again.");
            setTimeout(() => setError(null), 4000);
            return;
        }

        if (!isAdminUser) {
            incrementDailyRequests();
        }

        triggerPinnedBanner(`📨 Request sent: "${track.song}" (by ${displayName})`);
        addFloatingNotification('System', `Request sent to Admin DJ: "${track.song}"`);

        if (supabase && roomCode.includes('Campus_PCO')) {
            supabase.channel('campus_pco_live_chat').send({
                type: 'broadcast',
                event: 'PCO_REQUEST_NOTIFICATION',
                payload: { track, requester: displayName, requestId: result.data?.id }
            });
        }
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleAdminAcceptRequest = () => {
        if (!adminRequestModal) return;
        const track = adminRequestModal.track;
        const requester = adminRequestModal.requester;
        const requestId = adminRequestModal.requestId;
        if (requestId) {
            updatePcoSongRequestStatus(requestId, 'approved', currentUser?.id);
        }
        setCurrentTrack(track);
        setIsPlaying(true);
        triggerPinnedBanner(`🔥 Admin Approved: "${track.song}" (by ${requester})`);
        addFloatingNotification('System', `Now Playing: "${track.song}"`);
        if (supabase) {
            supabase.channel('campus_pco_live_chat').send({
                type: 'broadcast',
                event: 'PCO_PLAY_IMMEDIATELY',
                payload: { track }
            });
        }
        setAdminRequestModal(null);
    };

    const handleAdminPlayNextRequest = () => {
        if (!adminRequestModal) return;
        const track = adminRequestModal.track;
        const requester = adminRequestModal.requester;
        const requestId = adminRequestModal.requestId;
        if (requestId) {
            updatePcoSongRequestStatus(requestId, 'approved', currentUser?.id);
        }
        setQueue(prev => [track, ...prev]);
        triggerPinnedBanner(`⏭️ Admin Queued Next: "${track.song}" (by ${requester})`);
        addFloatingNotification('System', `Admin Queued Next: "${track.song}"`);
        if (supabase) {
            supabase.channel('campus_pco_live_chat').send({
                type: 'broadcast',
                event: 'PCO_PLAY_NEXT',
                payload: { track, requester }
            });
        }
        setAdminRequestModal(null);
    };

    const handleAdminDeclineRequest = () => {
        if (adminRequestModal?.requestId) {
            updatePcoSongRequestStatus(adminRequestModal.requestId, 'declined', currentUser?.id);
        }
        setAdminRequestModal(null);
    };

    const handleSongEnded = () => {
        if (queueRef.current.length > 0) {
            const nextTrack = queueRef.current[0];
            const newQueue = queueRef.current.slice(1);
            setQueue(newQueue);
            broadcastSync('queue_sync', { payload: newQueue });
            playSelectedTrack(nextTrack);
        } else if (roomCode.includes('Campus_PCO') && pcoPlaylist.length > 0) {
            // Automatically play the exact NEXT real song in the Campus PCO playlist!
            const currentIndex = pcoPlaylist.findIndex(t => t.id === currentTrackRef.current?.id);
            const nextIndex = currentIndex >= 0 ? (currentIndex + 1) % pcoPlaylist.length : 0;
            const nextTrack = pcoPlaylist[nextIndex];
            setCurrentTrack(nextTrack);
            setIsPlaying(true);
            triggerPinnedBanner(`🎵 Playing Next: "${nextTrack.song}"`);
            // Only admin broadcasts to prevent N duplicate broadcasts (Bug B16)
            if (isAdminUserRef.current && supabase) {
                supabase.channel('campus_pco_live_chat').send({
                    type: 'broadcast',
                    event: 'PCO_PLAY_IMMEDIATELY',
                    payload: { track: nextTrack }
                });
            }
        } else if (isHost) {
            setIsPlaying(false);
            broadcastSync('pause');
        }
    };

    const handleAudioLoadedData = () => {
        setAudioReady(true);
        if (pendingOffsetRef.current !== null && audioRef.current) {
            audioRef.current.currentTime = pendingOffsetRef.current;
            setCurrentTime(pendingOffsetRef.current);
            pendingOffsetRef.current = null;
        }
    };

    const handleSkip = () => {
        if (roomCode.includes('Campus_PCO') && supabase) {
            supabase.channel('campus_pco_live_chat').send({
                type: 'broadcast',
                event: 'PCO_ADMIN_SKIP',
                payload: { user: displayName }
            });
        }
        handleSongEnded();
    };

    const isResolvingFallbackRef = useRef(false);

    const handleAudioError = async () => {
        if (!currentTrack || isResolvingFallbackRef.current) {
            handleSongEnded();
            return;
        }

        isResolvingFallbackRef.current = true;
        console.warn(`[PCO Audio] Stream error for "${currentTrack.song}". Resolving live stream fallback...`);

        try {
            const query = `${currentTrack.song} ${currentTrack.singers || ''}`.trim();
            const res = await fetch(`https://saavnapi-nine.vercel.app/result/?query=${encodeURIComponent(query)}`);
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data) && data.length > 0 && data[0].media_url && data[0].media_url !== currentTrack.media_url) {
                    const fallbackTrack: Track = {
                        ...currentTrack,
                        media_url: data[0].media_url,
                        image: data[0].image || currentTrack.image
                    };
                    console.log(`[PCO Audio] Recovered with live stream URL for "${currentTrack.song}"`);
                    setCurrentTrack(fallbackTrack);
                    if (audioRef.current) {
                        audioRef.current.src = data[0].media_url;
                        audioRef.current.load();
                        audioRef.current.play().catch(() => {});
                    }
                    isResolvingFallbackRef.current = false;
                    return;
                }
            }
        } catch (err) {
            console.warn("[PCO Audio] Fallback lookup failed:", err);
        }

        isResolvingFallbackRef.current = false;
        // If recovery fails, smoothly advance to the next song in the playlist/queue
        handleSongEnded();
    };

    const pcoSeekTimer = useRef<any>(null);

    const handlePlayPause = () => {
        if (!currentTrack) return;
        const isPco = roomCode.includes('Campus_PCO');
        if (isPco && !isAdminUser) return;
        if (!isPco && !isHost) return;

        const next = !isPlaying;
        setIsPlaying(next);
        if (isPco && supabase) {
            supabase.channel('campus_pco_live_chat').send({
                type: 'broadcast',
                event: 'PCO_PLAY_STATE',
                payload: { playing: next }
            });
        } else {
            broadcastSync(next ? 'play' : 'pause');
        }
    };

    const currentTimeRef = useRef(0);
    const showLyricsRef = useRef(showLyrics);
    const lyricsDataRef = useRef<LyricLine[] | null>(lyricsData);
    const activeLyricIndexRef = useRef(-1);

    useEffect(() => {
        showLyricsRef.current = showLyrics;
        if (showLyrics && lyricsDataRef.current && audioRef.current) {
            const time = audioRef.current.currentTime;
            let activeIdx = 0;
            for (let i = 0; i < lyricsDataRef.current.length; i++) {
                if (time >= lyricsDataRef.current[i].time) {
                    activeIdx = i;
                } else {
                    break;
                }
            }
            activeLyricIndexRef.current = activeIdx;
            setActiveLyricIndex(activeIdx);
            setTimeout(() => {
                const activeEl = document.getElementById(`lyric-${activeIdx}`);
                if (activeEl) {
                    activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }, [showLyrics]);

    useEffect(() => {
        lyricsDataRef.current = lyricsData;
        if (lyricsData && audioRef.current && showLyricsRef.current) {
            const time = audioRef.current.currentTime;
            let activeIdx = 0;
            for (let i = 0; i < lyricsData.length; i++) {
                if (time >= lyricsData[i].time) {
                    activeIdx = i;
                } else {
                    break;
                }
            }
            activeLyricIndexRef.current = activeIdx;
            setActiveLyricIndex(activeIdx);
            setTimeout(() => {
                const activeEl = document.getElementById(`lyric-${activeIdx}`);
                if (activeEl) {
                    activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }, 100);
        }
    }, [lyricsData]);

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const time = audioRef.current.currentTime;
            currentTimeRef.current = time;

            // Throttle full-component React state re-renders to ~1x/sec
            if (Math.floor(time) !== Math.floor(currentTime)) {
                setCurrentTime(time);
            }

            const curLyrics = lyricsDataRef.current;
            if (showLyricsRef.current && curLyrics && curLyrics.length > 0) {
                let activeIdx = -1;
                for (let i = 0; i < curLyrics.length; i++) {
                    if (time >= curLyrics[i].time) {
                        activeIdx = i;
                    } else {
                        break;
                    }
                }

                if (activeIdx !== activeLyricIndexRef.current && activeIdx >= 0) {
                    activeLyricIndexRef.current = activeIdx;
                    setActiveLyricIndex(activeIdx);
                    const activeEl = document.getElementById(`lyric-${activeIdx}`);
                    if (activeEl) {
                        activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    }
                }
            }
        }
    };

    const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return;
        const isPco = roomCode.includes('Campus_PCO');
        if (isPco ? !isAdminUser : !isHost) return;

        const t = Number(e.target.value);
        audioRef.current.currentTime = t;
        setCurrentTime(t);

        if (isPco && supabase) {
            clearTimeout(pcoSeekTimer.current);
            pcoSeekTimer.current = setTimeout(() => {
                supabase.channel('campus_pco_live_chat').send({
                    type: 'broadcast',
                    event: 'PCO_SEEK',
                    payload: { time: t }
                });
            }, 250);
        } else {
            broadcastSync('seek', { time: t });
        }
    };

    const generateRoomCode = () => {
        const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
        const numbers = '0123456789';
        let code = '';
        for (let i = 0; i < 3; i++) code += letters.charAt(Math.floor(Math.random() * letters.length));
        code += '-';
        for (let i = 0; i < 3; i++) code += numbers.charAt(Math.floor(Math.random() * numbers.length));
        return code;
    };

    const handleCreateRoom = () => {
        if (!roomName.trim()) {
            setError('Please enter a room name');
            return;
        }
        setIsConnecting(true);
        const nameSlug = roomName.trim().substring(0, 30).replace(/[^a-zA-Z0-9]/g, '');
        const unifiedCode = generateRoomCode();
        const code = `music_${nameSlug}_${unifiedCode}`;
        
        // REG-02: Generate a 4-digit passcode for private rooms created directly (not via Sparx)
        if (isPrivateRoom) {
            const storedPass = sessionStorage.getItem(`room_passcode_${code}`);
            const generatedPasscode = storedPass || Math.floor(1000 + Math.random() * 9000).toString();
            if (!storedPass) sessionStorage.setItem(`room_passcode_${code}`, generatedPasscode);
            setRoomPasscode(generatedPasscode);
            roomPasscodeRef.current = generatedPasscode;
        } else {
            setRoomPasscode(null);
            roomPasscodeRef.current = null;
        }

        setRoomCode(code);
        setIsHost(true);
        setMode('room');
        setTimeout(() => setIsConnecting(false), 1000);
    };

    const handleJoinRoom = async () => {
        const entered = joinCode.toUpperCase().replace(/[^A-Z0-9-]/g, '');
        if (entered.length !== 7) {
            setError('Please enter a valid 7-character room code (e.g., ABC-123)');
            return;
        }
        
        setIsConnecting(true);
        
        if (supabase) {
            try {
                const { data, error } = await supabase
                    .from('active_rooms')
                    .select('room_id, is_private')
                    .like('room_id', `%_${entered}`)
                    .maybeSingle();
                    
                if (error) throw error;
                
                if (data) {
                    setRoomCode(data.room_id);
                    setRoomName('Joined Room');
                    setIsHost(false);
                    setMode('room');
                    setIsPrivateRoom(data.is_private || false);
                    setError(null);
                } else {
                    setError('Invalid room code or room expired');
                    setTimeout(() => setError(null), 3000);
                }
            } catch (err: any) {
                console.error("Error joining room:", err);
                setError('Failed to connect to room');
                setTimeout(() => setError(null), 3000);
            } finally {
                setIsConnecting(false);
            }
        }
    };

    const toggleMute = () => {
        if (myStream) {
            myStream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (myStream) {
            myStream.getVideoTracks().forEach(t => t.enabled = !t.enabled);
            setIsVideoOff(!isVideoOff);
        }
    };

    // Draggable Cam logic — persistent window listener with ref tracking
    const handleCamMouseDown = (e: React.MouseEvent, id: string) => {
        if ((e.target as HTMLElement).closest('.resize-handle')) return;
        const pos = camPositionsRef.current[id] || { x: 0, y: 0 };
        dragInfo.current = { id, startX: e.clientX, startY: e.clientY, initialX: pos.x, initialY: pos.y };
    };

    const handleCamTouchStart = (e: React.TouchEvent, id: string) => {
        if ((e.target as HTMLElement).closest('.resize-handle')) return;
        if (e.touches.length !== 1) return;
        const touch = e.touches[0];
        const pos = camPositionsRef.current[id] || { x: 0, y: 0 };
        dragInfo.current = { id, startX: touch.clientX, startY: touch.clientY, initialX: pos.x, initialY: pos.y };
    };

    useEffect(() => {
        const updateDrag = (clientX: number, clientY: number) => {
            if (!dragInfo.current.id) return;
            const dx = clientX - dragInfo.current.startX;
            const dy = clientY - dragInfo.current.startY;
            const newX = dragInfo.current.initialX + dx;
            const newY = dragInfo.current.initialY + dy;
            setCamPositions(prev => ({
                ...prev,
                [dragInfo.current.id as string]: { x: newX, y: newY }
            }));
        };

        const handleMouseMove = (e: MouseEvent) => {
            updateDrag(e.clientX, e.clientY);
        };

        const handleTouchMove = (e: TouchEvent) => {
            if (e.touches.length !== 1) return;
            if (dragInfo.current.id) {
                e.preventDefault();
            }
            const touch = e.touches[0];
            updateDrag(touch.clientX, touch.clientY);
        };

        const handleEnd = () => {
            dragInfo.current.id = null;
        };

        window.addEventListener('mousemove', handleMouseMove);
        window.addEventListener('mouseup', handleEnd);
        window.addEventListener('touchmove', handleTouchMove, { passive: false });
        window.addEventListener('touchend', handleEnd);

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleEnd);
            window.removeEventListener('touchmove', handleTouchMove);
            window.removeEventListener('touchend', handleEnd);
        };
    }, []);

    // Host heartbeat to keep active_rooms fresh in Supabase (30s interval)
    useEffect(() => {
        if (!isHost || !roomCode || !supabase) return;
        const heartbeat = setInterval(async () => {
            try {
                if (supabase && roomCodeRef.current && myPeerIdRef.current) {
                    await supabase
                        .from('active_rooms')
                        .update({ updated_at: new Date().toISOString() })
                        .eq('room_id', roomCodeRef.current)
                        .eq('host_peer_id', myPeerIdRef.current);
                }
            } catch (err) {
                console.warn("Heartbeat update error:", err);
            }
        }, 30000);

        return () => clearInterval(heartbeat);
    }, [isHost, roomCode]);

    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim()) return;
        const msg = { user: displayName, text: newMessage, createdAt: Date.now() };
        setMessages(prev => [...prev.slice(-149), msg]);
        addFloatingNotification(displayName, newMessage);

        if (roomCode.includes('Campus_PCO') && supabase) {
            supabase.channel('campus_pco_live_chat').send({
                type: 'broadcast',
                event: 'LIVE_CHAT_MSG',
                payload: msg
            });
        } else {
            broadcastData({ type: 'CHAT', text: newMessage, createdAt: Date.now() });
        }
        setNewMessage('');
    };

    const formatTime = (seconds: number) => {
        const min = Math.floor(seconds / 60);
        const sec = Math.floor(seconds % 60);
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };



    if (mode === 'landing') {
        return (
            <div className="flex flex-col items-center justify-start md:justify-center min-h-[100dvh] w-full bg-[#03000a] relative overflow-y-auto overflow-x-hidden pt-20 pb-16 md:py-8">
                {/* Background Ambience - Optimized */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] md:w-[800px] h-[600px] md:h-[800px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(124,58,237,0.15)_0%,_transparent_70%)] pointer-events-none -z-0 will-change-transform animate-blob" />
                <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-[radial-gradient(circle_at_center,_rgba(79,70,229,0.15)_0%,_transparent_70%)] pointer-events-none -z-0 will-change-transform animate-blob animation-delay-2000" />

                <button onClick={() => navigate.push('/sparx')} className="absolute top-4 md:top-6 left-4 md:left-6 p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors z-20 border border-white/10 backdrop-blur-md">
                    <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-white/70 hover:text-white" />
                </button>

                <div className="text-center mb-10 md:mb-16 relative z-10 px-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-white/70 text-sm font-medium mb-6 backdrop-blur-md">
                        <Music className="w-4 h-4 text-violet-400" />
                        <span className="tracking-wide uppercase text-xs">Soul Sync</span>
                    </div>
                    <h2 className="text-4xl md:text-7xl font-black mb-4 text-transparent bg-clip-text bg-gradient-to-br from-white via-gray-200 to-gray-500 tracking-tighter">
                        SOUL <span className="bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-indigo-600">SYNC</span>
                    </h2>
                    <p className="text-gray-400 max-w-md mx-auto text-sm md:text-base font-light">Create a private room and sing like karaoke with live synced lyrics.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 w-full px-4 max-w-2xl relative z-10">
                    <button onClick={() => setMode('create_room')} className="group relative flex flex-col items-center p-8 md:p-10 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-violet-500/50 rounded-[2rem] transition-all duration-300 overflow-hidden">
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl -z-10 bg-violet-500/20" />
                        <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-violet-400 mb-4 md:mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(139,92,246,0.2)] border border-violet-500/20">
                            <PlusCircle className="w-10 h-10 md:w-12 md:h-12" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-tight">Create Jam</h3>
                        <p className="text-white/50 text-sm font-light">Host a new music session</p>
                    </button>

                    <button onClick={() => setMode('join_room')} className="group relative flex flex-col items-center p-8 md:p-10 bg-white/5 backdrop-blur-xl border border-white/10 hover:border-indigo-500/50 rounded-[2rem] transition-all duration-300 overflow-hidden">
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl -z-10 bg-indigo-500/20" />
                        <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-blue-500/20 text-indigo-400 mb-4 md:mb-6 group-hover:scale-110 transition-transform shadow-[0_0_30px_rgba(99,102,241,0.2)] border border-indigo-500/20">
                            <LogIn className="w-10 h-10 md:w-12 md:h-12" />
                        </div>
                        <h3 className="text-xl md:text-2xl font-bold text-white mb-2 tracking-tight">Join Jam</h3>
                        <p className="text-white/50 text-sm font-light">Enter a room code</p>
                    </button>
                </div>

                {/* Invite Match Section */}
                <div className="mt-8 w-full max-w-md px-4 relative z-20">
                    <div className="relative">
                        <button
                            onClick={() => setShowInviteMenu(!showInviteMenu)}
                            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-white/5 border border-white/10 hover:border-violet-500/50 hover:bg-white/10 rounded-2xl text-white font-medium transition-all duration-300 backdrop-blur-md shadow-lg"
                        >
                            <Users className="w-5 h-5 text-violet-400" />
                            <span>Invite Active Match</span>
                        </button>
                        
                        {showInviteMenu && (
                            <div className="absolute top-[110%] left-0 right-0 mt-2 bg-[#0d071a]/95 border border-white/10 rounded-2xl shadow-2xl p-2 z-50 max-h-60 overflow-y-auto custom-scrollbar backdrop-blur-xl animate-fade-in">
                                {matches.length === 0 ? (
                                    <div className="text-center py-4 text-xs text-white/40">
                                        No active matches found.
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {matches.map(match => (
                                            <button
                                                key={match.id}
                                                onClick={() => handleInviteMatch(match)}
                                                className="w-full text-left px-4 py-3 rounded-xl hover:bg-white/5 text-gray-200 hover:text-white text-sm font-medium transition-colors flex items-center justify-between group border border-transparent hover:border-violet-500/20"
                                            >
                                                <span>{match.partnerName}</span>
                                                <span className="text-[10px] uppercase text-violet-400 group-hover:text-violet-300 font-mono bg-violet-500/10 px-2.5 py-1 rounded-md border border-violet-500/20 flex items-center gap-1">
                                                    <span>Invite & Start</span>
                                                    <Music className="w-3 h-3" />
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (needsPasscode) {
        return (
            <div className="flex flex-col h-[100dvh] w-full bg-[#050510] text-white overflow-hidden font-sans relative">
                <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md">
                    <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-6 shadow-2xl">
                        <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                            <Lock className="w-6 h-6 text-violet-500" />
                            Private Room
                        </h3>
                        <p className="text-sm text-zinc-400 mb-6">
                            This room is locked. Please enter the passcode to join.
                        </p>
                        
                        {passcodeError && (
                            <div className="mb-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 py-3 px-4 rounded-xl">
                                {passcodeError}
                            </div>
                        )}
                        
                        <input
                            type="text"
                            placeholder="0000"
                            maxLength={4}
                            value={enteredPasscode}
                            onChange={(e) => {
                                setEnteredPasscode(e.target.value.replace(/\D/g, ''));
                                setPasscodeError(null);
                            }}
                            className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-4 text-white text-center text-3xl tracking-widest font-mono placeholder-zinc-700 focus:border-violet-500 focus:outline-none transition-colors mb-6"
                            autoFocus
                        />
                        
                        <div className="flex gap-3">
                            <button
                                onClick={() => navigate.push('/sparx')}
                                className="flex-1 py-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold transition-colors"
                            >
                                Back
                            </button>
                            <button
                                onClick={async () => {
                                    if (!supabase) return;
                                    try {
                                        const enteredHash = await hashPasscode(enteredPasscode);
                                        const { data, error } = await supabase
                                            .from('active_rooms')
                                            .select('room_id, passcode')
                                            .eq('room_id', roomCode)
                                            .maybeSingle();
                                        if (error || !data) {
                                            setPasscodeError('Incorrect passcode');
                                        } else if (data.passcode === enteredHash || data.passcode === enteredPasscode) {
                                            setRoomPasscode(enteredHash);
                                            roomPasscodeRef.current = enteredHash;
                                            setNeedsPasscode(false);
                                        } else {
                                            setPasscodeError('Incorrect passcode');
                                        }
                                    } catch (err) {
                                        setPasscodeError('Failed to verify passcode');
                                    }
                                }}
                                disabled={enteredPasscode.length < 4}
                                className="flex-1 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Enter Room
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (mode === 'create_room' || mode === 'join_room') {
        const isCreate = mode === 'create_room';
        return (
            <div className="flex flex-col items-center justify-center min-h-[100dvh] w-full bg-[#03000a] relative px-4 pt-24 pb-32 md:py-8 overflow-hidden">
                <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full blur-[140px] pointer-events-none animate-blob ${isCreate ? 'bg-violet-600/20' : 'bg-indigo-600/20'}`} />
                <button onClick={() => setMode('landing')} className="absolute top-4 md:top-6 left-4 md:left-6 p-2 md:p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors z-20 group border border-white/10 backdrop-blur-md">
                    <ArrowLeft className="w-5 h-5 md:w-6 md:h-6 text-white/70 group-hover:text-white" />
                </button>

                <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 md:p-10 w-full max-w-md shadow-2xl relative z-10 transition-all duration-500">
                    <div className="text-center mb-8">
                        <div className={`inline-flex items-center justify-center w-20 h-20 rounded-2xl mb-6 shadow-[0_0_30px_rgba(139,92,246,0.2)] border ${isCreate ? 'bg-gradient-to-br from-violet-500/20 to-purple-500/20 text-violet-400 border-violet-500/20' : 'bg-gradient-to-br from-indigo-500/20 to-blue-500/20 text-indigo-400 border-indigo-500/20'}`}>
                            {isCreate ? <PlusCircle className="w-10 h-10" /> : <LogIn className="w-10 h-10" />}
                        </div>
                        <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">{isCreate ? 'Create Your Jam' : 'Join a Jam'}</h2>
                        <p className="text-sm text-white/50 font-light">{isCreate ? 'Give your room a fun name' : "Enter the 7-character room code (e.g. ABC-123)"}</p>
                    </div>
                    {error && <div className="mb-6 text-red-400 text-sm text-center bg-red-500/10 border border-red-500/20 py-3 rounded-xl backdrop-blur-md">{error}</div>}
                    <div className="space-y-6">
                        {isCreate ? (
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Room Name</label>
                                <input type="text" value={roomName} onChange={e => setRoomName(e.target.value)} onKeyPress={e => e.key === 'Enter' && handleCreateRoom()} placeholder="e.g., Midnight Vibes" maxLength={30} disabled={isConnecting} className="w-full bg-[#0a001a]/50 border border-white/10 rounded-xl px-5 py-4 text-white placeholder-white/30 focus:border-violet-500/50 focus:outline-none transition-all disabled:opacity-50 text-base shadow-inner backdrop-blur-md" autoFocus />
                                <div className="text-xs text-white/30 mt-2 text-right">{roomName.length}/30</div>
                                {/* Private Toggle */}
                                <div className="flex items-center gap-3 py-1 mt-4">
                                    <input
                                        type="checkbox"
                                        id="private-room-toggle"
                                        checked={isPrivateRoom}
                                        onChange={(e) => setIsPrivateRoom(e.target.checked)}
                                        className="w-4.5 h-4.5 rounded border-white/10 bg-[#0a001a]/50 text-violet-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-violet-500"
                                    />
                                    <label 
                                        htmlFor="private-room-toggle" 
                                        className="text-sm font-semibold text-white/70 hover:text-white cursor-pointer select-none flex items-center gap-1.5"
                                    >
                                        <Lock className="w-4 h-4 text-white/40" />
                                        Private Room (Requires Passcode)
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <div>
                                <label className="block text-sm font-medium text-white/60 mb-2">Room Code</label>
                                <input type="text" maxLength={7} value={joinCode} onChange={e => {
                                    setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''));
                                }} onKeyPress={e => e.key === 'Enter' && handleJoinRoom()} placeholder="ABC-123" disabled={isConnecting} className="w-full bg-[#0a001a]/50 border border-white/10 rounded-xl px-5 py-4 text-center text-xl md:text-2xl tracking-widest text-white placeholder-white/20 focus:border-indigo-500/50 focus:outline-none transition-all font-mono disabled:opacity-50 shadow-inner backdrop-blur-md" autoFocus />
                                <div className="text-xs text-white/30 mt-3 text-center tracking-widest">FORMAT: ABC-123</div>
                            </div>
                        )}
                        <button onClick={isCreate ? handleCreateRoom : handleJoinRoom} disabled={isConnecting || (isCreate ? !roomName.trim() : joinCode.length !== 7)} className={`w-full bg-gradient-to-r text-white font-bold py-4 rounded-xl shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 ${isCreate ? 'from-violet-500 to-purple-500 shadow-[0_0_20px_rgba(139,92,246,0.3)]' : 'from-indigo-500 to-blue-500 shadow-[0_0_20px_rgba(99,102,241,0.3)]'}`}>
                            {isConnecting ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    {isCreate ? 'Creating...' : 'Joining...'}
                                </>
                            ) : (isCreate ? 'Start Jam' : 'Join Jam')}
                        </button>
                        <button
                            onClick={() => setMode('landing')}
                            disabled={isConnecting}
                            className="w-full text-white/40 hover:text-white py-2 text-sm transition-colors disabled:opacity-50 font-medium"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const renderPlayerTracerBar = () => {
        if (!currentTrack) return null;
        const totalDur = Number(currentTrack.duration) || 1;
        const isHalfWay = (currentTime / totalDur) >= 0.5;
        const nextTrack = pcoPlaylist.length > 0
            ? pcoPlaylist[(pcoPlaylist.findIndex(t => t.id === currentTrack.id) + 1) % pcoPlaylist.length]
            : null;
        const canControl = roomCode.includes('Campus_PCO') ? isAdminUser : isHost;

        return (
            <div className={`bg-[#0c0915]/95 backdrop-blur-2xl border border-white/15 rounded-2xl px-5 ${isHalfWay ? 'py-3.5' : 'py-3'} shadow-[0_10px_40px_rgba(0,0,0,0.8)] hidden md:flex flex-col gap-2 max-w-sm sm:max-w-md w-full transition-all duration-500 pointer-events-auto`}>
                <div className="flex items-center gap-4">
                    {/* Album Art */}
                    <img src={currentTrack.image} alt={currentTrack.song} className="w-10 h-10 rounded-xl object-cover shadow-md shrink-0 border border-white/10" />

                    {/* Song info & tracer bar */}
                    <div className="flex-1 min-w-[160px] sm:min-w-[200px]">
                        <div className="flex justify-between items-center gap-3">
                            <h4 className="text-white text-xs font-black truncate max-w-[140px] sm:max-w-[180px]">{currentTrack.song}</h4>
                            <span className="text-[10px] font-mono text-gray-400 shrink-0">{formatTime(currentTime)} / {formatTime(totalDur)}</span>
                        </div>
                        {/* Tracer line */}
                        <div className="w-full bg-gray-800/80 h-1.5 rounded-full overflow-hidden mt-1.5 border border-white/5">
                            <div 
                                className="bg-gradient-to-r from-pink-500 via-purple-400 to-indigo-400 h-full rounded-full transition-all duration-300 shadow-[0_0_10px_rgba(236,72,153,0.8)]" 
                                style={{ width: `${(currentTime / totalDur) * 100}%` }}
                            />
                        </div>
                    </div>

                    {/* Play/Pause & Actions */}
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            onClick={handlePlayPause}
                            disabled={!canControl}
                            className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 disabled:opacity-40 transition-all shadow-md"
                            title={isPlaying ? 'Pause' : 'Play'}
                        >
                            {isPlaying ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current ml-0.5" />}
                        </button>
                        <button
                            onClick={toggleLyrics}
                            className="px-3 py-1.5 rounded-xl bg-pink-500/20 hover:bg-pink-500/30 text-pink-300 transition-colors text-xs font-bold flex items-center gap-1.5 border border-pink-500/30"
                            title="Close Lyrics View"
                        >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">Close</span>
                        </button>
                    </div>
                </div>

                {/* Smooth Up Next Transition Badge (Revealed at 50% song completion) */}
                {isHalfWay && nextTrack && (
                    <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500">
                        <span className="text-[10px] font-black text-pink-400 uppercase tracking-wider flex items-center gap-1 shrink-0">
                            <Music className="w-3 h-3 text-purple-400 animate-bounce" /> Up Next:
                        </span>
                        <div className="flex items-center gap-2 min-w-0 flex-1 justify-end">
                            <img src={nextTrack.image} alt={nextTrack.song} className="w-5 h-5 rounded-md object-cover border border-white/10 shrink-0" />
                            <span className="text-[11px] font-bold text-gray-200 truncate max-w-[160px]">{nextTrack.song}</span>
                        </div>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div ref={containerRef} className="flex flex-col h-[100dvh] w-full bg-[#050510] text-white overflow-hidden font-sans relative">
            {/* Admin Song Request Approval Popup Modal */}
            {adminRequestModal && (
                <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-gradient-to-b from-purple-900/90 to-zinc-950 border-2 border-purple-500/50 rounded-3xl p-6 max-w-sm w-full text-center shadow-[0_0_50px_rgba(168,85,247,0.4)]">
                        <div className="w-14 h-14 rounded-2xl bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mx-auto mb-4 text-purple-300 animate-bounce">
                            <Music className="w-7 h-7" />
                        </div>
                        <span className="text-[10px] font-black tracking-widest text-purple-400 uppercase bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20">
                            Admin Notification
                        </span>
                        <h3 className="text-xl font-extrabold text-white mt-3 mb-1">
                            Song Request Received!
                        </h3>
                        <p className="text-xs text-purple-200 mb-4">
                            <strong className="text-pink-400">{adminRequestModal.requester}</strong> wants to play:
                        </p>
                        
                        <div className="flex items-center gap-3 bg-black/60 p-3 rounded-2xl border border-white/10 mb-6 text-left">
                            <img src={adminRequestModal.track.image} alt={adminRequestModal.track.song} className="w-12 h-12 rounded-xl object-cover" />
                            <div className="min-w-0 flex-1">
                                <h4 className="text-sm font-bold text-white truncate">{adminRequestModal.track.song}</h4>
                                <p className="text-xs text-gray-400 truncate">{adminRequestModal.track.singers}</p>
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={handleAdminDeclineRequest}
                                className="flex-1 py-3 bg-zinc-800 hover:bg-zinc-700 text-gray-300 font-bold rounded-xl text-xs transition-colors"
                            >
                                Decline
                            </button>
                            <button
                                onClick={handleAdminPlayNextRequest}
                                className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-1"
                            >
                                <SkipForward className="w-3.5 h-3.5 fill-current" />
                                Play Next
                            </button>
                            <button
                                onClick={handleAdminAcceptRequest}
                                className="flex-1 py-3 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white font-bold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-1"
                            >
                                <Play className="w-3.5 h-3.5 fill-current" />
                                Play Now
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <ShareRoomModal 
                isOpen={isShareModalOpen} 
                onClose={() => setIsShareModalOpen(false)} 
                roomUrl={window.location.href} 
            />
            <audio ref={audioRef} onTimeUpdate={handleTimeUpdate} onEnded={handleSongEnded} onError={handleAudioError} onLoadedData={handleAudioLoadedData} />

            {/* Header / Nav Bar - Hidden in Campus PCO (Sparx FM) because PcoRadioPlayer has its own integrated header */}
            {!isFullscreen && !roomCode.includes('Campus_PCO') && (
                <div className="h-14 md:h-16 border-b border-white/5 flex items-center justify-between px-2.5 sm:px-4 md:px-6 bg-black/40 backdrop-blur-md relative z-30 gap-1.5">
                    <div className="flex items-center gap-1.5 sm:gap-2 md:gap-3 min-w-0">
                        <button
                            onClick={() => { handleLeaveRoom(); navigate.push('/sparx'); }}
                            className="p-1.5 md:p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors border border-white/10 text-white/70 hover:text-white shrink-0"
                            title="Leave Room & Back to Sparx"
                            aria-label="Back to Sparx"
                        >
                            <ArrowLeft className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <div className="flex items-center gap-1.5 md:gap-3 border border-violet-500/30 bg-violet-500/10 px-2.5 md:px-4 py-1 md:py-1.5 rounded-full min-w-0 shrink">
                            <span className="font-bold text-gray-200 text-xs sm:text-sm md:text-base truncate max-w-[85px] sm:max-w-[140px] md:max-w-[240px]">{roomName}</span>
                            {!roomCode.includes('Campus_PCO') && (
                                <>
                                    <div className="hidden sm:block w-px h-3.5 bg-white/20 shrink-0" />
                                    <span onClick={() => copyToClipboard(window.location.origin + '/sparx/music?room=' + roomCode)} className="hidden sm:flex font-mono text-neon font-bold items-center gap-1 cursor-pointer text-xs md:text-sm shrink-0 hover:text-neon/80 transition-colors">
                                        <Hash className="w-3 h-3" />
                                        {roomCode.split('_').length >= 3 ? `#${roomCode.split('_')[2]}` : roomCode}
                                        <Copy className="w-3 h-3 text-neon/75 ml-0.5 shrink-0" />
                                    </span>
                                </>
                            )}
                            {isHost && (
                                <div className="hidden md:flex items-center gap-1 px-2 py-0.5 bg-violet-500/10 text-violet-400 rounded-full border border-violet-500/20 text-[10px] font-semibold shrink-0">
                                    <Users className="w-3 h-3" />
                                    HOST
                                </div>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5 md:gap-2.5 shrink-0">
                        {roomCode.includes('Campus_PCO') ? (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 bg-pink-500/10 border border-pink-500/20 text-pink-300 text-xs font-bold rounded-full shrink-0 shadow-sm">
                                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                                <span>{listenerCount} listening</span>
                            </div>
                        ) : (
                            <div className="relative">
                                <button onClick={() => setShowUsersList(!showUsersList)} className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors flex items-center gap-1 md:gap-1.5 ${showUsersList ? 'bg-violet-500/20 text-violet-400' : 'hover:bg-gray-800 text-gray-400'}`}>
                                    <Users className="w-4 h-4 md:w-5 md:h-5 text-pink-400 shrink-0" />
                                    <span className="text-[10px] md:text-xs font-bold bg-pink-500/20 border border-pink-500/30 text-pink-300 px-1.5 py-0.5 rounded-full">
                                        {peers.length + 1}
                                    </span>
                                </button>
                                {showUsersList && (
                                    <div className="absolute top-12 right-0 w-60 bg-gray-900 border border-white/10 rounded-2xl p-4 shadow-2xl z-50">
                                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center justify-between">
                                            <span>Active Listeners</span>
                                            <span className="text-[10px] text-emerald-400 font-mono">● {peers.length + 1} Online</span>
                                        </div>
                                        <div className="max-h-48 overflow-y-auto space-y-2 custom-scrollbar">
                                            <div className="text-sm text-gray-300 font-medium">You {isHost && '(Host)'}</div>
                                            {peers.map(p => (
                                                <div key={p.peerId} className="text-sm text-gray-400 truncate">
                                                    {peerNames[p.peerId] || p.peerId.substring(0, 5)} {p.peerId === roomHostId && '(Host)'}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <button onClick={() => setIsShareModalOpen(true)} className="p-1.5 md:p-2 rounded-lg md:rounded-xl hover:bg-gray-800 text-gray-400 transition-colors hidden md:block" title="Share Room">
                            <Share2 className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        {/* Mobile search toggle */}
                        <button onClick={() => setShowMobileSearch(!showMobileSearch)} className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors md:hidden ${showMobileSearch ? 'bg-violet-500/20 text-violet-400' : 'hover:bg-gray-800 text-gray-400'}`}>
                            <ListMusic className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <div className="relative">
                            <button onClick={() => setShowVolumeControls(!showVolumeControls)} className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors ${showVolumeControls ? 'bg-violet-500/20 text-violet-400' : 'hover:bg-gray-800 text-gray-400'}`}>
                                <Volume2 className="w-4 h-4 md:w-5 md:h-5" />
                            </button>
                            {showVolumeControls && (
                                <div className="absolute top-12 right-0 w-64 bg-gray-900 border border-white/10 rounded-2xl p-5 shadow-2xl z-50 flex flex-col gap-6">
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-400 mb-2">
                                            <span>Music Volume</span>
                                            <span>{Math.round(musicVolume * 100)}%</span>
                                        </div>
                                        <input type="range" min="0" max="1" step="0.01" value={musicVolume} onChange={e => setMusicVolume(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500" />
                                    </div>
                                    <div>
                                        <div className="flex justify-between text-xs text-gray-400 mb-2">
                                            <span>Partner Volume</span>
                                            <span>{Math.round(partnerVolume * 100)}%</span>
                                        </div>
                                        <input type="range" min="0" max="1" step="0.01" value={partnerVolume} onChange={e => setPartnerVolume(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500" />
                                    </div>
                                </div>
                            )}
                        </div>
                        <button onClick={() => setShowChat(!showChat)} className={`p-1.5 md:p-2 rounded-lg md:rounded-xl transition-colors ${showChat ? 'bg-violet-500/20 text-violet-400' : 'hover:bg-gray-800 text-gray-400'}`}>
                            <MessageSquare className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button onClick={toggleFullscreen} className="p-1.5 md:p-2 rounded-lg md:rounded-xl hover:bg-gray-800 text-gray-400 transition-colors hidden md:block">
                            <Maximize className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                        <button onClick={() => { handleLeaveRoom(); navigate.push('/sparx'); }} className="p-1.5 md:p-2 rounded-lg md:rounded-xl hover:bg-red-500/10 text-red-500 transition-colors">
                            <LogOut className="w-4 h-4 md:w-5 md:h-5" />
                        </button>
                    </div>
                </div>
            )}

            {/* Float Controls in Fullscreen */}
            {isFullscreen && (
                <div className="absolute top-4 right-6 flex items-center gap-3 z-50">
                    <div className="relative">
                        <button onClick={() => setShowVolumeControls(!showVolumeControls)} className={`p-2 rounded-xl backdrop-blur-md transition-colors shadow-lg ${showVolumeControls ? 'bg-violet-500/80 text-white shadow-violet-500/20' : 'bg-black/60 hover:bg-black/80 text-gray-300'}`}>
                            <Volume2 className="w-5 h-5" />
                        </button>
                        {showVolumeControls && (
                            <div className="absolute top-12 right-0 w-64 bg-gray-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl z-50 flex flex-col gap-6">
                                <div>
                                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                                        <span>Music Volume</span>
                                        <span>{Math.round(musicVolume * 100)}%</span>
                                    </div>
                                    <input type="range" min="0" max="1" step="0.01" value={musicVolume} onChange={e => setMusicVolume(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500" />
                                </div>
                                <div>
                                    <div className="flex justify-between text-xs text-gray-400 mb-2">
                                        <span>Partner Volume</span>
                                        <span>{Math.round(partnerVolume * 100)}%</span>
                                    </div>
                                    <input type="range" min="0" max="1" step="0.01" value={partnerVolume} onChange={e => setPartnerVolume(parseFloat(e.target.value))} className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-violet-500" />
                                </div>
                            </div>
                        )}
                    </div>
                    <button onClick={() => setShowChat(!showChat)} className={`p-2 rounded-xl backdrop-blur-md transition-colors shadow-lg ${showChat ? 'bg-violet-500/80 text-white shadow-violet-500/20' : 'bg-black/60 hover:bg-black/80 text-gray-300'}`}>
                        <MessageSquare className="w-5 h-5" />
                    </button>
                    <button onClick={toggleFullscreen} className="p-2 rounded-xl backdrop-blur-md bg-black/60 hover:bg-black/80 text-gray-300 transition-colors shadow-lg">
                        <Minimize className="w-5 h-5" />
                    </button>
                </div>
            )}

            <div className="flex-1 flex overflow-hidden relative min-h-0">

                {/* Visualizer Background */}
                <div className="absolute inset-0 flex items-center justify-center opacity-30 pointer-events-none overflow-hidden">
                    <div className={`w-[800px] h-[800px] rounded-full bg-gradient-to-tr from-violet-600 to-fuchsia-600 blur-[150px] transition-transform duration-[10s] ${isPlaying ? 'scale-110 animate-pulse' : 'scale-90 opacity-10'}`} />
                </div>

                {/* Left Side: Now Playing / Radio Player */}
                <div className={`flex-1 z-10 flex flex-col items-center justify-center relative min-h-0 ${
                    roomCode.includes('Campus_PCO') ? 'overflow-hidden p-0 pb-2 md:pb-0' : 'overflow-y-auto p-3 md:p-8'
                }`}>
                    {showLyrics ? (
                        <>
                            {/* Fixed Close Lyrics Button - Pinned outside the scrollable container so it never scrolls */}
                            <button
                                onClick={() => setShowLyrics(false)}
                                className="fixed sm:absolute top-4 sm:top-6 right-4 sm:right-6 p-2.5 sm:p-3 bg-white/15 hover:bg-white/25 border border-white/20 rounded-full text-white z-50 backdrop-blur-xl active:scale-95 transition-all shadow-2xl cursor-pointer"
                                title="Close Lyrics"
                            >
                                <X className="w-5 h-5" />
                            </button>

                            <div ref={lyricsContainerRef} className="absolute inset-0 w-full h-full bg-[#050510]/95 backdrop-blur-3xl p-4 sm:p-8 md:p-10 overflow-y-auto custom-scrollbar flex flex-col items-start justify-start scroll-smooth z-40 [perspective:1400px]">
                                {isLoadingLyrics ? (
                                    <div className="flex-1 flex flex-col items-center justify-center h-full w-full gap-3">
                                        <Loader className="w-10 h-10 text-pink-500 animate-spin" />
                                        <span className="text-xs text-white/50 font-medium">Syncing lyrics with singer...</span>
                                    </div>
                                ) : lyricsData ? (
                                    <div 
                                        style={{ transform: 'rotateY(18deg) rotateX(4deg)', transformStyle: 'preserve-3d', transformOrigin: '0% center' }} 
                                        className="w-full max-w-2xl lg:max-w-3xl mr-auto ml-0 text-left py-32 space-y-9 transition-all duration-700 select-none pl-4 sm:pl-8 md:pl-10 pr-4 overflow-visible"
                                    >
                                        {lyricsData.map((line, idx) => {
                                            const distance = Math.abs(idx - activeLyricIndex);
                                            const isActive = idx === activeLyricIndex;
                                            return (
                                                <div
                                                    key={idx}
                                                    id={`lyric-${idx}`}
                                                    onClick={() => {
                                                        const canSeek = roomCode.includes('Campus_PCO') ? isAdminUser : isHost;
                                                        if (canSeek && audioRef.current) {
                                                            audioRef.current.currentTime = line.time;
                                                            setCurrentTime(line.time);
                                                        }
                                                    }}
                                                    style={{
                                                        transform: isActive 
                                                            ? 'translateZ(45px) scale(1.04)' 
                                                            : `translateZ(-${Math.min(distance * 10, 80)}px)`,
                                                        transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1)'
                                                    }}
                                                    className={`relative group ${isActive ? 'z-30' : 'z-10'} overflow-visible py-2 px-6 cursor-pointer`}
                                                >
                                                    {isActive && (
                                                        <div className="absolute -inset-x-6 -inset-y-3 bg-gradient-to-r from-pink-500/20 via-purple-500/15 to-transparent rounded-2xl blur-xl animate-pulse pointer-events-none" />
                                                    )}
                                                    <p className={`relative transition-all duration-500 leading-relaxed tracking-normal px-2 overflow-visible whitespace-normal break-words ${
                                                        isActive
                                                            ? 'text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black bg-gradient-to-r from-pink-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent drop-shadow-[0_0_35px_rgba(236,72,153,0.7)]'
                                                            : 'text-gray-500 text-xl sm:text-2xl md:text-3xl font-bold opacity-35 blur-[0.4px] hover:opacity-90 hover:text-gray-200 hover:blur-0'
                                                    }`}>
                                                        {line.text}
                                                    </p>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div
                                        style={{ transform: 'rotateY(20deg) rotateX(5deg)', transformStyle: 'preserve-3d', transformOrigin: 'center left' }}
                                        className="text-lg md:text-2xl text-purple-200 text-left leading-relaxed pb-12 mt-4 font-sans w-full px-8 max-w-4xl mx-auto py-36 font-semibold overflow-visible whitespace-pre-wrap"
                                    >
                                        {plainLyrics || 'No lyrics available for this song.'}
                                    </div>
                                )}
                            </div>

                            {/* Floating Player Tracer Bar (Right side when sidebar is open and not fullscreen) */}
                            {currentTrack && !isSidebarHidden && !isFullscreen && (
                                <div className="absolute bottom-6 right-6 z-40 hidden md:flex">
                                    {renderPlayerTracerBar()}
                                </div>
                            )}
                        </>
                    ) : roomCode.includes('Campus_PCO') ? (
                        <PcoRadioPlayer
                            currentTrack={currentTrack}
                            currentTime={currentTime}
                            isPlaying={isPlaying}
                            listenerCount={listenerCount}
                            isAdmin={isAdminUser}
                            requestsLeft={Math.max(0, 3 - dailyRequestsUsed)}
                            pinnedBanner={pinnedBanner}
                            floatingChatMessages={floatingNotifications}
                            isSidebarOpen={!isSidebarHidden}
                            onToggleLyrics={toggleLyrics}
                            onPlayPause={handlePlayPause}
                            onSkip={handleSkip}
                            onSeek={(t: number) => {
                                if (audioRef.current) {
                                    audioRef.current.currentTime = t;
                                    setCurrentTime(t);
                                    if (supabase) {
                                        clearTimeout(pcoSeekTimer.current);
                                        pcoSeekTimer.current = setTimeout(() => {
                                            supabase.channel('campus_pco_live_chat').send({
                                                type: 'broadcast',
                                                event: 'PCO_SEEK',
                                                payload: { time: t }
                                            });
                                        }, 250);
                                    }
                                }
                            }}
                            onToggleSidebar={() => {
                                if (isMobile) {
                                    setIsMobilePcoPanel(prev => !prev);
                                } else {
                                    setIsSidebarHidden(prev => !prev);
                                }
                            }}
                            onToggleAdminPanel={() => setIsAdminQuickPanelOpen(prev => !prev)}
                            onBack={() => { handleLeaveRoom(); navigate.push('/sparx'); }}
                        />
                    ) : !currentTrack ? (
                        /* Fix 2: Prominent search prompt when no track is playing */
                        <div className="w-full max-w-xl mx-auto flex flex-col items-center text-center transition-all my-auto z-10 px-4">
                            <div className="relative w-40 h-40 sm:w-52 sm:h-52 md:w-64 md:h-64 shrink-0 rounded-[2rem] overflow-hidden mb-8 border border-white/5">
                                <div className="w-full h-full bg-gradient-to-br from-violet-900/40 to-indigo-900/40 backdrop-blur flex items-center justify-center">
                                    <Music className="w-16 h-16 sm:w-20 sm:h-20 text-violet-400/60" />
                                </div>
                            </div>
                            <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-white mb-3 tracking-tight">What do you want to listen to?</h1>
                            <p className="text-gray-400 text-sm md:text-base mb-8">Search for a song to start the jam</p>

                            {/* Center Search Bar */}
                            <div className="w-full max-w-md relative mb-6">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                {isSearching && <Loader className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-violet-400 animate-spin" />}
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="Search songs, artists..."
                                    className="w-full bg-gray-900/60 border-2 border-white/10 focus:border-violet-500 rounded-2xl py-3.5 md:py-4 pl-12 pr-12 text-sm md:text-base text-white focus:outline-none transition-all placeholder-gray-500 shadow-lg"
                                />
                            </div>

                            {/* Center Search Results */}
                            {searchResults.length > 0 && (
                                <div className="w-full max-w-md max-h-72 overflow-y-auto custom-scrollbar bg-gray-900/80 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl">
                                    {searchResults.map((track) => (
                                        <div key={track.id} onClick={() => { handleTrackSelect(track, true); setSearchQuery(''); setSearchResults([]); }} className="flex items-center gap-3 hover:bg-white/5 p-3 cursor-pointer transition-colors group border-b border-white/5 last:border-b-0">
                                            <img src={track.image} alt={track.song} className="w-12 h-12 rounded-lg object-cover shadow-md" />
                                            <div className="flex-1 min-w-0 text-left">
                                                <h4 className="text-white text-sm font-bold truncate group-hover:text-violet-300 transition-colors">{track.song}</h4>
                                                <p className="text-gray-400 text-xs truncate">{track.singers}</p>
                                            </div>
                                            <Play className="w-5 h-5 text-violet-400 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Hint to use sidebar on desktop */}
                            <p className="hidden md:block text-xs text-gray-600 mt-6">You can also use the sidebar search on the right →</p>
                        </div>
                    ) : (
                                 <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-between h-full py-2 z-10 overflow-hidden">
                            {/* Compact Responsive Album Art */}
                            <div className="relative w-36 h-36 sm:w-48 sm:h-48 md:w-56 md:h-56 lg:w-64 lg:h-64 max-h-[30vh] shrink-0 shadow-[0_0_40px_rgba(139,92,246,0.2)] rounded-2xl md:rounded-3xl overflow-hidden mb-3 border border-white/10 group">
                                <img src={currentTrack.image.replace('150x150', '500x500')} alt={currentTrack.song} className="w-full h-full object-cover transform transition-transform duration-700 group-hover:scale-105" />

                                {isPlaying && (
                                    <div className="absolute inset-0 bg-black/30 backdrop-blur-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                        <div className="flex gap-2.5 h-12 items-end">
                                            {[...Array(5)].map((_, i) => (
                                                <div key={i} className="w-2.5 bg-neon rounded-full animate-pulse shadow-[0_0_15px_#fff]" style={{ height: `${Math.random() * 100}%`, animationDelay: `${i * 0.1}s` }} />
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <button
                                    onClick={toggleLyrics}
                                    className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 backdrop-blur-md p-2.5 rounded-xl text-white shadow-xl transition-all hover:scale-110 active:scale-95 border border-white/20 z-20 group/btn"
                                    title="Show Lyrics"
                                >
                                    <FileText className="w-5 h-5 group-hover/btn:text-violet-400 transition-colors" />
                                </button>
                            </div>

                            {/* Track Titles */}
                            <div className="w-full flex flex-col items-center px-2 shrink-0 mb-2">
                                <h1 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-1 line-clamp-1 tracking-tight drop-shadow-xl">{currentTrack.song}</h1>
                                <p className="text-sm sm:text-base md:text-lg text-violet-300 font-medium tracking-wide opacity-90 line-clamp-1">{currentTrack.singers}</p>
                            </div>

                            {/* Playback Controls & Progress */}
                            <div className="w-full max-w-md shrink-0 relative z-20">
                                {(() => {
                                    const canControlPlayback = roomCode.includes('Campus_PCO') ? isAdminUser : isHost;
                                    return (
                                        <>
                                            <input
                                                type="range"
                                                min="0"
                                                max={Number(currentTrack.duration) || 100}
                                                value={currentTime}
                                                onChange={handleProgressChange}
                                                disabled={!canControlPlayback}
                                                className="w-full h-1.5 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-violet-500 hover:accent-violet-400 transition-all mb-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                            />
                                            <div className="flex justify-between text-xs text-gray-400 font-mono font-medium">
                                                <span>{formatTime(currentTime)}</span>
                                                <span>{formatTime(Number(currentTrack.duration))}</span>
                                            </div>

                                            <div className="flex items-center justify-center gap-5 mt-3">
                                                <button
                                                    onClick={handlePlayPause}
                                                    disabled={!canControlPlayback}
                                                    className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center bg-white text-black rounded-full hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed shadow-[0_0_25px_rgba(255,255,255,0.2)] hover:shadow-[0_0_35px_rgba(255,255,255,0.4)]"
                                                >
                                                    {isPlaying ? <Pause className="w-7 h-7 md:w-8 md:h-8 fill-current" /> : <Play className="w-7 h-7 md:w-8 md:h-8 fill-current ml-1" />}
                                                </button>
                                                <button
                                                    onClick={handleSkip}
                                                    disabled={!canControlPlayback}
                                                    className="w-11 h-11 flex items-center justify-center bg-white/10 text-white rounded-full hover:bg-white/20 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 backdrop-blur-sm"
                                                    title="Skip to next in queue"
                                                >
                                                    <SkipForward className="w-5 h-5 fill-current" />
                                                </button>
                                            </div>
                                            {roomCode.includes('Campus_PCO') ? (
                                                !isAdminUser && <p className="mt-2 text-[10px] text-pink-400/90 font-medium text-center">📻 Live 24/7 Radio • Controls managed by Admin DJ</p>
                                            ) : (
                                                !isHost && <p className="mt-2 text-[10px] text-gray-500 text-center">Only host can skip tracks or control progress.</p>
                                            )}
                                        </>
                                    );
                                })()}
                            </div>
                        </div>
                    )}
                </div>

                {/* Campus PCO Split Right Panel Layout (Top: Song Requests, Bottom: YouTube Live Chat) */}
                {roomCode.includes('Campus_PCO') ? (
                    <>
                        {/* Right Sidebar (Hidden when isSidebarHidden is true) */}
                        {!isSidebarHidden && (
                            <div className="hidden md:flex w-80 lg:w-96 border-l border-white/10 bg-black/95 flex-col flex-shrink-0 h-full z-20 overflow-hidden transition-all duration-300 animate-fade-in">
                                {/* TOP HALF: Song Requests & Queue */}
                                <div className="h-1/2 flex flex-col border-b border-white/10 p-3 bg-[#07050d] overflow-hidden transition-all duration-300">
                                    <div className="flex items-center justify-between shrink-0">
                                        <span className="text-xs font-black text-purple-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <Music className="w-3.5 h-3.5 text-pink-400" /> Song Requests
                                        </span>
                                        <div className="flex items-center gap-2">
                                            <span className="text-[9px] font-bold text-purple-300 bg-purple-500/20 border border-purple-500/30 px-2 py-0.5 rounded-full">
                                                {isAdminUser ? 'Admin Unlimited' : `${3 - dailyRequestsUsed}/3 Requests Today`}
                                            </span>
                                            {/* Hide Entire Sidebar */}
                                            <button
                                                onClick={() => setIsSidebarHidden(true)}
                                                className="p-1.5 px-2.5 rounded-lg bg-purple-500/20 hover:bg-purple-500/40 text-purple-300 hover:text-white transition-all border border-purple-500/30 flex items-center gap-1.5 text-[10px] font-bold shadow-sm"
                                                title="Hide Sidebar (Floating Chat Mode)"
                                            >
                                                <EyeOff className="w-3.5 h-3.5" />
                                                <span>Hide</span>
                                            </button>
                                        </div>
                                    </div>

                                    {/* Search Input */}
                                    <div className="relative my-2 shrink-0">
                                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                                        {isSearching && <Loader className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-purple-400 animate-spin" />}
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Search song to request..."
                                            className="w-full bg-gray-900 border border-white/10 rounded-xl py-1.5 pl-8 pr-3 text-xs text-white focus:outline-none focus:border-purple-500"
                                        />
                                    </div>

                                    {/* Search Results / Queue List */}
                                    <div className="flex-1 overflow-y-auto custom-scrollbar space-y-1 pr-1">
                                        {searchResults.length > 0 ? (
                                            searchResults.map(t => (
                                                <div key={t.id} className="flex flex-col gap-1.5 bg-white/5 hover:bg-purple-600/20 p-2 rounded-xl transition-colors group border border-transparent hover:border-purple-500/30">
                                                    <div className="flex items-center gap-2">
                                                        <img src={t.image} alt={t.song} className="w-8 h-8 rounded-lg object-cover shrink-0" />
                                                        <div className="flex-1 min-w-0">
                                                            <h5 className="text-xs font-bold text-white truncate">{t.song}</h5>
                                                            <p className="text-[10px] text-gray-400 truncate">{t.singers}</p>
                                                        </div>
                                                    </div>
                                                    {isAdminUser ? (
                                                        <div className="flex items-center gap-1 mt-0.5 justify-end">
                                                            <button
                                                                onClick={() => handlePcoAdminDirectPlay(t)}
                                                                className="text-[9px] font-black bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white px-2 py-1 rounded-md shadow uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95"
                                                                title="Play song right now"
                                                            >
                                                                <Play className="w-2.5 h-2.5 fill-current" /> Play Now
                                                            </button>
                                                            <button
                                                                onClick={() => handlePcoAdminPlayNext(t)}
                                                                className="text-[9px] font-black bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded-md shadow uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95"
                                                                title="Play immediately after current song"
                                                            >
                                                                <SkipForward className="w-2.5 h-2.5 fill-current" /> Play Next
                                                            </button>
                                                            <button
                                                                onClick={() => handlePcoAdminAddToQueue(t)}
                                                                className="text-[9px] font-black bg-zinc-800 hover:bg-zinc-700 text-purple-300 hover:text-white border border-purple-500/30 px-2 py-1 rounded-md shadow uppercase tracking-wider flex items-center gap-1 transition-all active:scale-95"
                                                                title="Append to queue"
                                                            >
                                                                <PlusCircle className="w-2.5 h-2.5" /> Add to Queue
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <button
                                                            onClick={() => handlePcoSongRequest(t)}
                                                            className="text-[10px] font-bold bg-pink-500 text-white px-2.5 py-1 rounded-lg hover:bg-pink-600 self-end shadow-md"
                                                        >
                                                            Request ({3 - dailyRequestsUsed} left)
                                                        </button>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-6 text-gray-500 text-xs">
                                                <p className="font-semibold text-gray-400">Search above to request songs!</p>
                                                <p className="text-[10px] mt-1 text-purple-400/80">Requests play automatically</p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* BOTTOM HALF: YouTube-Style Live Chat */}
                                <div className="h-1/2 flex flex-col p-3 bg-black overflow-hidden transition-all duration-300">
                                    <div className="flex items-center justify-between mb-2 shrink-0">
                                        <span className="text-xs font-black text-pink-400 uppercase tracking-wider flex items-center gap-1.5">
                                            <MessageSquare className="w-3.5 h-3.5 text-purple-400" /> Live Chat
                                        </span>
                                        <span className="text-[9px] text-emerald-400 font-mono flex items-center gap-1 font-bold">
                                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                            YouTube Live
                                        </span>
                                    </div>

                                    {/* 15-Second Sticky Pinned Announcement Banner */}
                                    {pinnedBanner && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl mb-2 bg-black/60 backdrop-blur-2xl border border-white/10 text-xs text-white/90 shadow-md animate-in fade-in duration-300 shrink-0">
                                            <span className="w-1.5 h-1.5 rounded-full bg-pink-400 animate-pulse shrink-0" />
                                            <span className="truncate font-medium text-white/90 text-[11.5px]">{pinnedBanner.text}</span>
                                        </div>
                                    )}

                                    <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar pr-1 mb-2">
                                        {messages.map((msg, i) => (
                                            <div key={i} className="text-xs leading-relaxed break-words">
                                                <span className={`font-black mr-1.5 ${msg.user === displayName ? 'text-pink-400' : 'text-purple-300'}`}>
                                                    {msg.user}:
                                                </span>
                                                <span className="text-gray-200 font-medium">{msg.text}</span>
                                            </div>
                                        ))}
                                    </div>

                                    <form onSubmit={handleSendMessage} className="relative shrink-0">
                                        <input
                                            type="text"
                                            value={newMessage}
                                            onChange={e => setNewMessage(e.target.value)}
                                            placeholder="Chat live in Campus PCO..."
                                            className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2 pl-3 pr-8 text-xs text-white focus:outline-none focus:border-pink-500"
                                        />
                                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 text-pink-400 hover:text-pink-300 p-1">
                                            <Send className="w-3.5 h-3.5" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        )}

                        {/* Floating Notifications, Floating Text Bar, & Player Tracer Stack (When sidebar is hidden OR in Fullscreen) */}
                        {(isSidebarHidden || isFullscreen) && (
                            <div className="hidden md:flex fixed bottom-6 right-6 z-50 flex-col items-end gap-2.5 max-w-sm sm:max-w-md w-auto pointer-events-none">
                                {/* Top: 2-Second Floating Notification Cards */}
                                {floatingNotifications.length > 0 && (
                                    <div className="flex flex-col items-end gap-2 w-full pointer-events-auto">
                                        {floatingNotifications.map(notif => (
                                            <div
                                                key={notif.id}
                                                className="animate-fade-in-down bg-black/90 backdrop-blur-2xl border border-pink-500/40 text-white text-xs px-4 py-2.5 rounded-2xl shadow-[0_10px_35px_rgba(0,0,0,0.9)] flex items-center gap-2.5 max-w-sm transition-all duration-300"
                                            >
                                                <div className="w-2 h-2 rounded-full bg-pink-500 animate-pulse shrink-0" />
                                                <div className="truncate min-w-0">
                                                    <span className="font-black text-pink-400 mr-1.5">{notif.user}:</span>
                                                    <span className="text-gray-200 font-medium">{notif.text}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Bottom: Song Player Tracer Bar in Fullscreen / Hidden Sidebar mode */}
                                {showLyrics && currentTrack && renderPlayerTracerBar()}
                            </div>
                        )}
                    </>
                ) : (
                    <>
                        {/* Standard Music Date Right Panel */}
                        {!isFullscreen && (showMobileSearch || !isMobile) && (
                            <div className={`${showMobileSearch ? 'fixed inset-x-0 bottom-20 top-auto h-[55vh] z-50 rounded-t-3xl border-t-2 border-violet-500/30' : 'hidden md:flex w-80 lg:w-96 border-l'} border-white/5 bg-black/95 md:bg-black/40 backdrop-blur-md md:backdrop-blur-md z-20 flex flex-col flex-shrink-0`}>
                                <div className="p-3 md:p-4 border-b border-white/5 bg-gray-950/50 flex flex-col gap-2">
                                    <div className="flex items-center gap-2">
                                        {showMobileSearch && (
                                            <button onClick={() => setShowMobileSearch(false)} className="p-2 rounded-xl hover:bg-gray-800 text-gray-400 shrink-0 md:hidden">
                                                <X className="w-5 h-5" />
                                            </button>
                                        )}
                                        <div className="relative flex-1">
                                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                            {isSearching && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 animate-spin" />}
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={e => setSearchQuery(e.target.value)}
                                                placeholder="Search song or paste Spotify/YT link..."
                                                className="w-full bg-gray-900/60 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                                                autoFocus
                                            />
                                        </div>
                                    </div>

                                    {/* Playlist URL Detection Banner */}
                                    {(searchQuery.includes('spotify.com') || searchQuery.includes('youtube.com') || searchQuery.includes('youtu.be')) && (
                                        <div className="p-2.5 bg-gradient-to-r from-violet-600/30 to-pink-600/30 border border-violet-500/40 rounded-xl flex items-center justify-between gap-2 shadow-lg animate-fade-in">
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-white flex items-center gap-1">
                                                    <Music className="w-3.5 h-3.5 text-pink-400 shrink-0" />
                                                    <span>Playlist Link Detected</span>
                                                </p>
                                                <p className="text-[10px] text-gray-300 truncate">Import all songs into queue</p>
                                            </div>
                                            <button
                                                onClick={() => handleImportPlaylistLink(searchQuery)}
                                                disabled={isImportingPlaylist}
                                                className="px-3 py-1.5 bg-gradient-to-r from-pink-500 to-violet-600 hover:from-pink-600 hover:to-violet-700 text-white rounded-lg text-xs font-black shrink-0 flex items-center gap-1 shadow-md disabled:opacity-50"
                                            >
                                                {isImportingPlaylist ? <Loader className="w-3 h-3 animate-spin" /> : <PlusCircle className="w-3 h-3" />}
                                                <span>Import</span>
                                            </button>
                                        </div>
                                    )}

                                    {/* Playlist Import Progress Banner */}
                                    {isImportingPlaylist && (
                                        <div className="p-2.5 bg-purple-950/80 border border-purple-500/50 rounded-xl flex items-center gap-2.5 animate-pulse">
                                            <Loader className="w-4 h-4 text-pink-400 animate-spin shrink-0" />
                                            <div className="min-w-0 flex-1">
                                                <p className="text-xs font-bold text-white truncate">{importStatus || 'Importing playlist...'}</p>
                                                <p className="text-[10px] text-purple-300">Resolving synced audio streams</p>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                                    {searchResults.length > 0 && (
                                        <div className="mb-6">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Search Results</h3>
                                            <div className="space-y-1">
                                                {searchResults.map((track) => (
                                                    <div key={track.id} onClick={() => handleTrackSelect(track, true)} className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl cursor-pointer transition-colors group">
                                                        <img src={track.image} alt={track.song} className="w-10 h-10 rounded-md object-cover" />
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-white text-sm font-bold truncate group-hover:text-violet-300">{track.song}</h4>
                                                            <p className="text-gray-400 text-xs truncate">{track.singers}</p>
                                                        </div>
                                                        <button onClick={(e) => { e.stopPropagation(); handleTrackSelect(track, false); }} className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-400 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                            <PlusCircle className="w-3 h-3" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-2 mb-2">Up Next Queue ({queue.length})</h3>
                                        {queue.length === 0 ? (
                                            <p className="text-sm text-gray-600 px-2 italic">Queue is empty</p>
                                        ) : (
                                            <div className="space-y-1">
                                                {queue.map((track, idx) => (
                                                    <div key={`${track.id}-${idx}`} className="flex items-center gap-3 bg-white/5 p-2 rounded-xl border border-white/5">
                                                        <span className="text-xs text-gray-500 w-4 font-mono text-center">{idx + 1}</span>
                                                        <img src={track.image} alt={track.song} className="w-8 h-8 rounded-md object-cover" />
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-white text-sm font-medium truncate">{track.song}</h4>
                                                            <p className="text-gray-400 text-[10px] truncate">{track.singers}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Standard Chat Panel */}
                        {showChat && (
                            <div className="fixed inset-x-0 bottom-20 h-[60vh] md:absolute md:inset-x-auto md:right-96 md:top-0 md:bottom-0 md:h-auto md:w-80 border-t-2 border-violet-500/30 md:border-t-0 md:border-l border-white/5 bg-gray-950/95 backdrop-blur-2xl flex flex-col z-[100] shadow-2xl transition-all rounded-t-3xl md:rounded-none">
                                <div className="h-14 border-b border-white/5 flex items-center justify-between px-4">
                                    <span className="font-bold text-gray-300 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-violet-400" /> Chat</span>
                                    <button onClick={() => setShowChat(false)} className="text-gray-500 hover:text-white"><X className="w-4 h-4" /></button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
                                    {messages.map((msg, i) => (
                                        <div key={i} className={`flex flex-col ${msg.user === displayName ? 'items-end' : 'items-start'}`}>
                                            <div className="flex items-center gap-1.5 px-1.5 mb-1 text-[11px]">
                                                <span className="font-bold text-gray-200">{msg.user}</span>
                                                <span className="text-pink-400 font-bold">•</span>
                                                <span className="text-pink-300/90 font-mono text-[10px] font-semibold">{formatChatTimestamp(msg.createdAt)}</span>
                                            </div>
                                            <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${msg.user === displayName ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 rounded-tl-none'}`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-4 border-t border-white/5 bg-black">
                                    <form onSubmit={handleSendMessage} className="relative">
                                        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:border-violet-500" />
                                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-violet-400 hover:bg-violet-500/20 rounded-lg transition-colors"><Send className="w-4 h-4" /></button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ===== MOBILE-ONLY: Campus PCO Bottom Bar & Slide-Up Panel ===== */}
            {roomCode.includes('Campus_PCO') && (
                <>
                    {/* Mobile Slide-Up BottomSheet (Chat + Song Request) */}
                    <BottomSheet open={isMobilePcoPanel} onClose={() => setIsMobilePcoPanel(false)}>
                        {/* Panel Header Tabs */}
                        <div className="flex items-center border-b border-white/10 px-4 pt-1 pb-2 shrink-0">
                            <button
                                onClick={() => setShowChat(false)}
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider text-center transition-colors border-b-2 ${!showChat ? 'border-violet-500 text-violet-400' : 'border-transparent text-gray-500'}`}
                            >
                                <Music className="w-3.5 h-3.5 inline mr-1.5" />Song Requests
                            </button>
                            <button
                                onClick={() => setShowChat(true)}
                                className={`flex-1 py-2 text-xs font-bold uppercase tracking-wider text-center transition-colors border-b-2 ${showChat ? 'border-violet-500 text-violet-400' : 'border-transparent text-gray-500'}`}
                            >
                                <MessageSquare className="w-3.5 h-3.5 inline mr-1.5" />Live Chat
                            </button>
                            <button onClick={() => setIsMobilePcoPanel(false)} className="p-2 text-gray-500 hover:text-white ml-2 shrink-0">
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Tab Content */}
                        {!showChat ? (
                            /* Song Request Tab */
                            <div className="flex-1 flex flex-col overflow-hidden">
                                {/* Search */}
                                <div className="p-3 border-b border-white/5 shrink-0">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                                        {isSearching && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-400 animate-spin" />}
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Search songs to request..."
                                            className="w-full bg-gray-900/60 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-sm text-white focus:outline-none focus:border-violet-500 transition-colors"
                                        />
                                    </div>
                                    <p className="text-[10px] text-gray-500 mt-1.5 px-1">
                                        {3 - dailyRequestsUsed > 0 ? `${3 - dailyRequestsUsed} requests left today` : 'Daily request limit reached'}
                                    </p>
                                </div>

                                {/* Search Results / Queue */}
                                <div data-sheet-scroll className="flex-1 overflow-y-auto custom-scrollbar p-3">
                                    {searchResults.length > 0 && (
                                        <div className="mb-4">
                                            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">Results</h3>
                                            <div className="space-y-2">
                                                {searchResults.map((t) => (
                                                    <div key={t.id} className="flex flex-col gap-1.5 bg-white/5 p-2.5 rounded-xl border border-white/5">
                                                        <div className="flex items-center gap-3">
                                                            <img src={t.image} alt={t.song} className="w-10 h-10 rounded-lg object-cover shrink-0" />
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="text-white text-sm font-bold truncate">{t.song}</h4>
                                                                <p className="text-gray-400 text-xs truncate">{t.singers}</p>
                                                            </div>
                                                        </div>
                                                        {isAdminUser ? (
                                                            <div className="flex items-center gap-1 justify-end pt-1 border-t border-white/5">
                                                                <button
                                                                    onClick={() => { handlePcoAdminDirectPlay(t); setIsMobilePcoPanel(false); }}
                                                                    className="text-[10px] font-black bg-gradient-to-r from-purple-600 to-pink-600 text-white px-2.5 py-1 rounded-md shadow uppercase flex items-center gap-1"
                                                                >
                                                                    <Play className="w-2.5 h-2.5 fill-current" /> Play Now
                                                                </button>
                                                                <button
                                                                    onClick={() => { handlePcoAdminPlayNext(t); setIsMobilePcoPanel(false); }}
                                                                    className="text-[10px] font-black bg-indigo-600 text-white px-2.5 py-1 rounded-md shadow uppercase flex items-center gap-1"
                                                                >
                                                                    <SkipForward className="w-2.5 h-2.5 fill-current" /> Play Next
                                                                </button>
                                                                <button
                                                                    onClick={() => { handlePcoAdminAddToQueue(t); setIsMobilePcoPanel(false); }}
                                                                    className="text-[10px] font-black bg-zinc-800 text-purple-300 border border-purple-500/30 px-2.5 py-1 rounded-md shadow uppercase flex items-center gap-1"
                                                                >
                                                                    <PlusCircle className="w-2.5 h-2.5" /> Add Queue
                                                                </button>
                                                            </div>
                                                        ) : (
                                                            <button
                                                                onClick={() => { handlePcoSongRequest(t); setIsMobilePcoPanel(false); }}
                                                                className="w-full py-1.5 mt-1 bg-pink-500 hover:bg-pink-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow"
                                                            >
                                                                <PlusCircle className="w-3.5 h-3.5" /> Request Song
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    <div>
                                        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1 mb-2">Queue ({queue.length})</h3>
                                        {queue.length === 0 ? (
                                            <p className="text-sm text-gray-600 px-1 italic">Queue is empty</p>
                                        ) : (
                                            <div className="space-y-1">
                                                {queue.map((t, idx) => (
                                                    <div key={`m-${t.id}-${idx}`} className="flex items-center gap-3 bg-white/5 p-2.5 rounded-xl border border-white/5">
                                                        <span className="text-xs text-gray-500 w-4 font-mono text-center">{idx + 1}</span>
                                                        <img src={t.image} alt={t.song} className="w-8 h-8 rounded-md object-cover" />
                                                        <div className="flex-1 min-w-0">
                                                            <h4 className="text-white text-sm font-medium truncate">{t.song}</h4>
                                                            <p className="text-gray-400 text-[10px] truncate">{t.singers}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            /* Live Chat Tab */
                            <div className="flex-1 flex flex-col overflow-hidden">
                                <div data-sheet-scroll className="flex-1 overflow-y-auto p-4 space-y-3.5">
                                    {messages.length === 0 && (
                                        <p className="text-gray-600 text-sm text-center mt-8 italic">No messages yet. Say something!</p>
                                    )}
                                    {messages.map((msg, i) => (
                                        <div key={i} className={`flex flex-col ${msg.user === displayName ? 'items-end' : 'items-start'}`}>
                                            <div className="flex items-center gap-1.5 px-1.5 mb-1 text-[11px]">
                                                <span className="font-bold text-gray-200">{msg.user}</span>
                                                <span className="text-pink-400 font-bold">•</span>
                                                <span className="text-pink-300/90 font-mono text-[10px] font-semibold">{formatChatTimestamp(msg.createdAt)}</span>
                                            </div>
                                            <div className={`px-4 py-2 rounded-2xl max-w-[85%] text-sm ${msg.user === displayName ? 'bg-violet-600 text-white rounded-tr-none' : 'bg-gray-800 text-gray-200 rounded-tl-none'}`}>
                                                {msg.text}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 border-t border-white/5 bg-black/50 shrink-0">
                                    <form onSubmit={handleSendMessage} className="relative">
                                        <input type="text" value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Type a message..." className="w-full bg-gray-900 border border-gray-800 rounded-xl py-2.5 pl-4 pr-10 text-sm focus:outline-none focus:border-violet-500" />
                                        <button type="submit" className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-violet-400 hover:bg-violet-500/20 rounded-lg transition-colors"><Send className="w-4 h-4" /></button>
                                    </form>
                                </div>
                            </div>
                        )}
                    </BottomSheet>
                </>
            )}

            {/* Fix 3: Video Grids Overlay - disabled in Campus PCO mode for clean radio experience */}
            {!roomCode.includes('Campus_PCO') && (
                <div className="fixed top-20 left-0 right-0 bottom-0 pointer-events-none z-50 overflow-visible">
                    {myStream && (
                        <div
                            onMouseDown={(e) => handleCamMouseDown(e, 'me')}
                            onTouchStart={(e) => handleCamTouchStart(e, 'me')}
                            style={{
                                transform: `translate(${camPositions['me']?.x || 0}px, ${camPositions['me']?.y || 0}px)`,
                                position: 'absolute', top: 0, left: 0
                            }}
                            className="w-28 h-20 md:w-40 md:h-28 bg-gray-900 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl pointer-events-auto cursor-move shadow-black/50 group"
                        >
                            <StreamVideo stream={myStream} muted={true} mirrored={true} />
                            <div className="absolute bottom-1.5 left-1.5 right-1.5 flex justify-between items-center bg-black/40 backdrop-blur-md rounded-md px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <span className="text-[10px] font-bold text-white">You</span>
                                <div className="flex gap-1">
                                    <button onMouseDown={e => e.stopPropagation()} onClick={toggleMute} className={`p-0.5 rounded-md ${isMuted ? 'text-red-400' : 'text-gray-300 hover:text-white'}`}>{isMuted ? <MicOff className="w-3 h-3" /> : <Mic className="w-3 h-3" />}</button>
                                    <button onMouseDown={e => e.stopPropagation()} onClick={toggleVideo} className={`p-0.5 rounded-md ${isVideoOff ? 'text-red-400' : 'text-gray-300 hover:text-white'}`}>{isVideoOff ? <VideoOff className="w-3 h-3" /> : <Video className="w-3 h-3" />}</button>
                                </div>
                            </div>
                        </div>
                    )}
                    {peers.map((peer, i) => (
                        <div
                            key={peer.peerId}
                            onMouseDown={(e) => handleCamMouseDown(e, peer.peerId)}
                            onTouchStart={(e) => handleCamTouchStart(e, peer.peerId)}
                            style={{
                                transform: `translate(${camPositions[peer.peerId]?.x || 0}px, ${camPositions[peer.peerId]?.y || 0}px)`,
                                position: 'absolute', top: 0, left: 0
                            }}
                            className="w-28 h-20 md:w-40 md:h-28 bg-gray-900 rounded-2xl overflow-hidden border-2 border-white/10 shadow-2xl pointer-events-auto cursor-move shadow-black/50 group"
                        >
                            <StreamVideo stream={peer.stream} mirrored={true} volume={partnerVolume} />
                            <span className="absolute bottom-1.5 left-1.5 text-[10px] font-bold text-white bg-black/50 px-2 py-0.5 rounded-md backdrop-blur-md opacity-0 group-hover:opacity-100 transition-opacity">{peerNames[peer.peerId] || 'Peer'}</span>
                        </div>
                    ))}
                </div>
            )}

            {/* Navigation Blocker Modal */}
            {showLeaveModal && (
                <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[100]">
                    <div className="bg-gray-900/95 border border-white/10 rounded-3xl p-8 max-w-sm mx-4 shadow-2xl text-center">
                        <div className="w-16 h-16 rounded-full bg-violet-500/10 flex items-center justify-center mx-auto mb-5">
                            <Music className="w-8 h-8 text-violet-400" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Leave Music Jam?</h3>
                        <p className="text-gray-400 text-sm mb-6">Your current session will end and you'll be disconnected from the room.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLeaveModal(false)}
                                className="flex-1 py-3 px-4 rounded-xl bg-gray-800 hover:bg-gray-700 text-white font-semibold transition-colors border border-white/10"
                            >
                                Stay
                            </button>
                            <button
                                onClick={() => {
                                    setShowLeaveModal(false);
                                    handleLeaveRoom();
                                    navigate.push('/sparx');
                                }}
                                className="flex-1 py-3 px-4 rounded-xl bg-red-500/90 hover:bg-red-500 text-white font-semibold transition-colors"
                            >
                                Leave
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Copy Feedback Toast */}
            {copyFeedback && (
                <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[100] animate-fade-in-down">
                    <div className="bg-neon/90 backdrop-blur-xl text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-2 font-semibold">
                        <Copy className="w-4 h-4" />
                        {copyFeedback}
                    </div>
                </div>
            )}

            {/* Global Error Toast */}
            {error && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full bg-red-500/90 backdrop-blur-md text-white font-medium flex items-center gap-2 shadow-2xl z-50 animate-fade-in-down pointer-events-auto">
                    <AlertCircle className="w-5 h-5" /> {error}
                    <button onClick={() => setError(null)} className="ml-2 hover:bg-black/20 p-1 rounded-full"><X className="w-4 h-4" /></button>
                </div>
            )}

            {/* In-Room Admin Quick Panel for Campus PCO Radio */}
            {roomCode.includes('Campus_PCO') && isAdminUser && (
                <PcoAdminQuickPanel
                    isOpen={isAdminQuickPanelOpen}
                    onToggle={() => setIsAdminQuickPanelOpen(prev => !prev)}
                    queue={queue}
                    onPlayNow={handlePcoAdminDirectPlay}
                    onPlayNext={handlePcoAdminPlayNext}
                    onAddToQueue={handlePcoAdminAddToQueue}
                    onRemoveFromQueue={(trackId) => {
                        setQueue(prev => {
                            const nextQueue = prev.filter(t => t.id !== trackId);
                            if (supabase) {
                                supabase.channel('campus_pco_live_chat').send({
                                    type: 'broadcast',
                                    event: 'PCO_QUEUE_SYNC',
                                    payload: { queue: nextQueue }
                                });
                            }
                            return nextQueue;
                        });
                    }}
                    onSkipCurrent={handleSkip}
                    onBroadcastBanner={(text) => {
                        triggerPinnedBanner(text);
                        if (supabase) {
                            supabase.channel('campus_pco_live_chat').send({
                                type: 'broadcast',
                                event: 'LIVE_CHAT_MSG',
                                payload: { user: 'Admin DJ 👑', text }
                            });
                        }
                    }}
                    currentTrack={currentTrack}
                    adminUserId={currentUser?.id}
                />
            )}
        </div>
    );
};

export default MusicDate;
