"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Maximize, Minimize, Search, X, Plus,
  Bookmark, Share2, Send, MessageSquare, Music, Loader,
  Check, ChevronRight, Disc, Flame, ChevronDown, MoreVertical,
  Users, Clock, RefreshCw
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PcoSongRequest, fetchPcoRequests, updatePcoSongRequestStatus } from '../services/pcoAdmin';

export interface YtTrack {
  id: string;
  song: string;
  singers: string;
  image: string;
  media_url?: string;
  duration: string;
  youtubeId?: string;
}

export interface ChatMessage {
  user: string;
  text: string;
  createdAt: number;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  x: number; // percentage horizontal position (15% to 85%)
}

export type TabType = 'UP NEXT' | 'LYRICS' | 'LIVE CHAT' | 'REQUESTED SONGS' | 'REQUEST A SONG';

interface YouTubeMusicLayoutProps {
  currentTrack: YtTrack | null;
  currentTime: number;
  duration: number;
  isPlaying: boolean;
  isAdmin: boolean;
  roomName?: string;
  roomCode?: string;
  activePlaylistTitle?: string;
  queue: YtTrack[];
  lyrics?: { time: number; text: string }[] | string | null;
  messages: ChatMessage[];
  listenerCount?: number;
  incomingReaction?: { emoji: string; id: string } | null;
  onPlayPause?: () => void;
  onSkip?: () => void;
  onPrevious?: () => void;
  onSeek?: (time: number) => void;
  onSelectTrack: (track: YtTrack, playNow: boolean) => void;
  onSendMessage: (text: string) => void;
  onRequestSong: (track: YtTrack) => void;
  onSendReaction: (emoji: string) => void;
  onLeave?: () => void;
  onShareRoom?: () => void;
  partnerCamsOverlay?: React.ReactNode;
  onAdminPlayNow?: (track: YtTrack, requestId?: string) => void;
  onAdminPlayNext?: (track: YtTrack, requestId?: string) => void;
  onAdminAddToQueue?: (track: YtTrack, requestId?: string) => void;
  onAdminRejectRequest?: (requestId: string) => void;
}

const REACTION_EMOJIS = ['❤️', '🔥', '✨', '💃', '🎶', '🥺', '👏', '😍'];

const formatTime = (seconds: number) => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};

const formatTimeAgo = (isoDate: string) => {
  try {
    const diffSec = Math.floor((Date.now() - new Date(isoDate).getTime()) / 1000);
    if (diffSec < 60) return 'just now';
    if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
    return `${Math.floor(diffSec / 3600)}h ago`;
  } catch (_) {
    return 'recently';
  }
};

export const YouTubeMusicLayout: React.FC<YouTubeMusicLayoutProps> = ({
  currentTrack,
  currentTime,
  duration,
  isPlaying,
  isAdmin,
  roomName = 'Sparx Music',
  roomCode,
  activePlaylistTitle = '10s Bollywood Romance Hits',
  queue = [],
  lyrics: externalLyrics = null,
  messages = [],
  listenerCount = 1,
  incomingReaction = null,
  onPlayPause,
  onSkip,
  onPrevious,
  onSeek,
  onSelectTrack,
  onSendMessage,
  onRequestSong,
  onSendReaction,
  onLeave,
  onShareRoom,
  partnerCamsOverlay,
  onAdminPlayNow,
  onAdminPlayNext,
  onAdminAddToQueue,
  onAdminRejectRequest
}) => {
  // Navigation & Active Tabs
  const [activeTab, setActiveTab] = useState<TabType>('UP NEXT');
  // Mobile tab state: null = Now Playing video view, TabType = expanded sheet
  const [mobileTab, setMobileTab] = useState<TabType | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<YtTrack[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [requestedSongIds, setRequestedSongIds] = useState<Set<string>>(new Set());
  const [chatInput, setChatInput] = useState('');
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Floating live reaction emojis
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);

  // YouTube Video ID Resolution
  const [youtubeVideoId, setYoutubeVideoId] = useState<string | null>(null);
  const [isLoadingYtVideo, setIsLoadingYtVideo] = useState(false);

  // Internal Synced Lyrics State (if not provided externally)
  const [internalLyrics, setInternalLyrics] = useState<{ time: number; text: string }[] | string | null>(null);

  // Admin Pending Song Requests
  const [pendingRequests, setPendingRequests] = useState<PcoSongRequest[]>([]);
  const [isLoadingRequests, setIsLoadingRequests] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  const panelLyricsRef = useRef<HTMLDivElement>(null);

  // Responsive device view tracking: mount ONLY ONE iframe (Mobile OR Desktop) in DOM
  const [isMobileView, setIsMobileView] = useState(false);
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);
    const updateLayout = () => {
      setIsMobileView(window.innerWidth < 768);
    };
    updateLayout();
    window.addEventListener('resize', updateLayout);
    return () => window.removeEventListener('resize', updateLayout);
  }, []);

  // YouTube IFrame Player Refs & Audio-Video Synchronization
  const desktopIframeRef = useRef<HTMLIFrameElement>(null);
  const mobileIframeRef = useRef<HTMLIFrameElement>(null);
  const currentTimeRef = useRef<number>(currentTime || 0);
  currentTimeRef.current = currentTime || 0;
  const isPlayingRef = useRef<boolean>(isPlaying);
  isPlayingRef.current = isPlaying;
  const lastSyncedTimeRef = useRef<number>(currentTime || 0);

  // STABLE VIDEO START TIME: Set once when track/video changes.
  // NEVER mutate iframe src on every currentTime tick — this completely eliminates video flickering!
  const [videoStartTime, setVideoStartTime] = useState<number>(0);
  const videoIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (youtubeVideoId && youtubeVideoId !== videoIdRef.current) {
      videoIdRef.current = youtubeVideoId;
      setVideoStartTime(Math.max(0, Math.floor(currentTimeRef.current || 0)));
    } else if (!youtubeVideoId) {
      videoIdRef.current = null;
    }
  }, [youtubeVideoId]);

  // Origin for YouTube iframe API postMessage security
  const originParam = useMemo(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      return `&origin=${encodeURIComponent(window.location.origin)}`;
    }
    return '';
  }, []);

  // Stable iframe URL that does NOT change as currentTime advances
  const iframeSrc = useMemo(() => {
    if (!youtubeVideoId) return '';
    return `https://www.youtube.com/embed/${youtubeVideoId}?enablejsapi=1&autoplay=1&mute=1&controls=0&playsinline=1&rel=0&modestbranding=1&start=${videoStartTime}${originParam}`;
  }, [youtubeVideoId, videoStartTime, originParam]);

  const sendYtCommand = (func: string, args: any[] = []) => {
    const iframes = [desktopIframeRef.current, mobileIframeRef.current];
    iframes.forEach(iframe => {
      if (iframe && iframe.contentWindow) {
        try {
          iframe.contentWindow.postMessage(
            JSON.stringify({
              event: 'command',
              func,
              args
            }),
            '*'
          );
        } catch (_) {}
      }
    });
  };

  // Sync play/pause with YouTube Video via postMessage API
  useEffect(() => {
    if (isPlaying) {
      sendYtCommand('playVideo');
    } else {
      sendYtCommand('pauseVideo');
    }
  }, [isPlaying]);

  // Sync seeking / rewinding / fast-forwarding when currentTime jumps (>1.5s difference)
  useEffect(() => {
    const diff = Math.abs(currentTime - lastSyncedTimeRef.current);
    if (diff > 1.5) {
      const safeTime = Math.max(0, isNaN(currentTime) ? 0 : currentTime);
      sendYtCommand('seekTo', [safeTime, true]);
    }
    lastSyncedTimeRef.current = currentTime;
  }, [currentTime]);

  // Iframe load handler: establish listening handshake and sync to current playback position
  const handleIframeLoad = (e: React.SyntheticEvent<HTMLIFrameElement>) => {
    const iframe = e.currentTarget;
    if (iframe && iframe.contentWindow) {
      try {
        iframe.contentWindow.postMessage(JSON.stringify({ event: 'listening' }), '*');
      } catch (_) {}
    }

    const syncPlayer = () => {
      const safeTime = Math.max(0, isNaN(currentTimeRef.current) ? 0 : currentTimeRef.current);
      sendYtCommand('seekTo', [safeTime, true]);
      if (isPlayingRef.current) {
        sendYtCommand('playVideo');
      } else {
        sendYtCommand('pauseVideo');
      }
    };

    syncPlayer();
    setTimeout(syncPlayer, 300);
    setTimeout(syncPlayer, 800);
  };

  // Listen for YouTube IFrame Player 'onReady' event for bulletproof immediate sync
  useEffect(() => {
    const handleWindowMessage = (event: MessageEvent) => {
      try {
        if (typeof event.data === 'string') {
          const data = JSON.parse(event.data);
          if (data.event === 'onReady') {
            const safeTime = Math.max(0, isNaN(currentTimeRef.current) ? 0 : currentTimeRef.current);
            sendYtCommand('seekTo', [safeTime, true]);
            if (isPlayingRef.current) {
              sendYtCommand('playVideo');
            } else {
              sendYtCommand('pauseVideo');
            }
          }
        }
      } catch (_) {}
    };

    window.addEventListener('message', handleWindowMessage);
    return () => window.removeEventListener('message', handleWindowMessage);
  }, []);

  const handleUserSeek = (time: number) => {
    const safeTime = Math.max(0, isNaN(time) ? 0 : time);
    sendYtCommand('seekTo', [safeTime, true]);
    lastSyncedTimeRef.current = safeTime;
    if (isAdmin && onSeek) {
      onSeek(safeTime);
    }
  };

  // 1. Load Admin Song Requests
  const loadRequests = async () => {
    if (!isAdmin) return;
    setIsLoadingRequests(true);
    try {
      const data = await fetchPcoRequests('pending', 50);
      setPendingRequests(data);
    } catch (e) {
      console.warn('Failed to load pending requests:', e);
    } finally {
      setIsLoadingRequests(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadRequests();

    if (!supabase) return;

    const channel = supabase
      .channel('yt_layout_song_requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pco_song_requests' },
        () => {
          loadRequests();
        }
      )
      .on('broadcast', { event: 'PCO_REQUEST_NOTIFICATION' }, () => {
        loadRequests();
      })
      .on('broadcast', { event: 'PCO_SONG_REQUEST' }, () => {
        loadRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAdmin]);

  // Admin Request Action Handlers
  const handleAdminPlayNow = (req: PcoSongRequest) => {
    const track: YtTrack = {
      id: req.track_id || req.id,
      song: req.track_name,
      singers: req.track_artist || 'Unknown Artist',
      image: req.track_image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
      media_url: req.track_url || '',
      duration: req.track_duration || '240'
    };
    if (onAdminPlayNow) {
      onAdminPlayNow(track, req.id);
    } else {
      onSelectTrack(track, true);
    }
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
    updatePcoSongRequestStatus(req.id, 'approved');
  };

  const handleAdminPlayNext = (req: PcoSongRequest) => {
    const track: YtTrack = {
      id: req.track_id || req.id,
      song: req.track_name,
      singers: req.track_artist || 'Unknown Artist',
      image: req.track_image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
      media_url: req.track_url || '',
      duration: req.track_duration || '240'
    };
    if (onAdminPlayNext) {
      onAdminPlayNext(track, req.id);
    }
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
    updatePcoSongRequestStatus(req.id, 'approved');
  };

  const handleAdminAddToQueue = (req: PcoSongRequest) => {
    const track: YtTrack = {
      id: req.track_id || req.id,
      song: req.track_name,
      singers: req.track_artist || 'Unknown Artist',
      image: req.track_image || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=500',
      media_url: req.track_url || '',
      duration: req.track_duration || '240'
    };
    if (onAdminAddToQueue) {
      onAdminAddToQueue(track, req.id);
    } else {
      onSelectTrack(track, false);
    }
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
    updatePcoSongRequestStatus(req.id, 'approved');
  };

  const handleAdminReject = (requestId: string) => {
    if (onAdminRejectRequest) {
      onAdminRejectRequest(requestId);
    }
    setPendingRequests(prev => prev.filter(r => r.id !== requestId));
    updatePcoSongRequestStatus(requestId, 'declined');
  };

  // 2. YouTube Video ID Resolution
  useEffect(() => {
    if (!currentTrack) {
      setYoutubeVideoId(null);
      return;
    }

    if (currentTrack.youtubeId) {
      setYoutubeVideoId(currentTrack.youtubeId);
      return;
    }

    let isMounted = true;
    setIsLoadingYtVideo(true);

    const fetchVideoId = async () => {
      try {
        const query = `${currentTrack.song} ${currentTrack.singers}`;
        const targetDur = Math.round(duration || Number(currentTrack.duration) || 0);
        const res = await fetch(`/api/youtube-search?q=${encodeURIComponent(query)}&dur=${targetDur}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data.videoId) {
            setYoutubeVideoId(data.videoId);
          }
        }
      } catch (err) {
        console.warn('YouTube search error:', err);
      } finally {
        if (isMounted) setIsLoadingYtVideo(false);
      }
    };

    fetchVideoId();
    return () => { isMounted = false; };
  }, [currentTrack?.song, currentTrack?.singers, currentTrack?.youtubeId]);

  // 3. Lyrics Resolution
  useEffect(() => {
    if (externalLyrics) {
      setInternalLyrics(externalLyrics);
      return;
    }

    if (!currentTrack?.song) {
      setInternalLyrics(null);
      return;
    }

    let isMounted = true;
    const fetchLyrics = async () => {
      try {
        const cleanSong = currentTrack.song
          .replace(/\(.*\)/g, '')
          .replace(/\[.*\]/g, '')
          .replace(/-.*$/g, '')
          .trim();
        const primaryArtist = currentTrack.singers.split(',')[0].trim();

        const res = await fetch(`https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanSong)}&artist_name=${encodeURIComponent(primaryArtist)}`);
        if (res.ok) {
          const data = await res.json();
          if (data.syncedLyrics && isMounted) {
            const lines: { time: number; text: string }[] = [];
            const regex = /\[(\d+):(\d+(?:\.\d+)?)\](.*)/g;
            let match;
            while ((match = regex.exec(data.syncedLyrics)) !== null) {
              const minutes = parseInt(match[1], 10);
              const seconds = parseFloat(match[2]);
              const text = match[3].trim();
              if (text) {
                lines.push({ time: minutes * 60 + seconds, text });
              }
            }
            if (lines.length > 0) {
              setInternalLyrics(lines);
              return;
            }
          }
          if (data.plainLyrics && isMounted) {
            setInternalLyrics(data.plainLyrics);
            return;
          }
        }

        const searchRes = await fetch(`https://lrclib.net/api/search?q=${encodeURIComponent(cleanSong + ' ' + primaryArtist)}`);
        if (searchRes.ok && isMounted) {
          const searchData = await searchRes.json();
          if (Array.isArray(searchData) && searchData.length > 0) {
            const item = searchData.find((d: any) => d.syncedLyrics) || searchData[0];
            if (item.syncedLyrics) {
              const lines: { time: number; text: string }[] = [];
              const regex = /\[(\d+):(\d+(?:\.\d+)?)\](.*)/g;
              let match;
              while ((match = regex.exec(item.syncedLyrics)) !== null) {
                const minutes = parseInt(match[1], 10);
                const seconds = parseFloat(match[2]);
                const text = match[3].trim();
                if (text) lines.push({ time: minutes * 60 + seconds, text });
              }
              if (lines.length > 0) {
                setInternalLyrics(lines);
                return;
              }
            }
            if (item.plainLyrics) {
              setInternalLyrics(item.plainLyrics);
              return;
            }
          }
        }
      } catch (e) {
        // graceful ignore
      }
    };

    fetchLyrics();
    return () => { isMounted = false; };
  }, [currentTrack?.song, currentTrack?.singers, externalLyrics]);

  // Active Lyrics Line Index Calculation
  const activeLyricIndex = useMemo(() => {
    if (!Array.isArray(internalLyrics) || internalLyrics.length === 0) return -1;
    let idx = 0;
    for (let i = 0; i < internalLyrics.length; i++) {
      if (currentTime >= internalLyrics[i].time) {
        idx = i;
      } else {
        break;
      }
    }
    return idx;
  }, [internalLyrics, currentTime]);

  // Auto-scroll lyrics in panel
  useEffect(() => {
    if (activeLyricIndex >= 0) {
      const activePanelEl = document.getElementById(`panel-lyric-line-${activeLyricIndex}`);
      if (activePanelEl) {
        activePanelEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [activeLyricIndex]);

  // 4. Search Songs via Saavn API
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`https://saavnapi-nine.vercel.app/result/?query=${encodeURIComponent(searchQuery)}`);
        if (res.ok) {
          const data = await res.json();
          const list = Array.isArray(data) ? data : (data.results || []);
          setSearchResults(list.slice(0, 15).map((item: any) => ({
            id: item.id || `yt-${Math.random().toString(36).substr(2, 9)}`,
            song: (item.song || item.title || 'Unknown').replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
            singers: (item.singers || item.primary_artists || item.artist || 'Unknown').replace(/&quot;/g, '"').replace(/&amp;/g, '&'),
            image: (item.image || '').replace('150x150', '500x500'),
            media_url: item.media_url || item.downloadUrl?.[4]?.link || item.downloadUrl?.[0]?.link || '',
            duration: String(item.duration || 240)
          })));
        }
      } catch (e) {
        console.warn('Saavn search failed:', e);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // 5. Incoming Floating Reaction Handler
  useEffect(() => {
    if (!incomingReaction) return;
    const newReaction: FloatingReaction = {
      id: `${Date.now()}-${Math.random()}`,
      emoji: incomingReaction.emoji,
      x: Math.floor(Math.random() * 65) + 15
    };
    setFloatingReactions(prev => [...prev.slice(-15), newReaction]);

    const timer = setTimeout(() => {
      setFloatingReactions(prev => prev.filter(r => r.id !== newReaction.id));
    }, 3500);

    return () => clearTimeout(timer);
  }, [incomingReaction]);

  // Auto-scroll Chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    onSendMessage(chatInput.trim());
    setChatInput('');
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentTabs: TabType[] = [
    'UP NEXT',
    'LYRICS',
    'LIVE CHAT',
    isAdmin ? 'REQUESTED SONGS' : 'REQUEST A SONG'
  ];

  // ---------------------------------------------------------------------------
  // TAB CONTENT RENDERER (Shared between Desktop Right Panel & Mobile Expanded Sheet)
  // ---------------------------------------------------------------------------
  const renderTabContent = (tab: TabType) => {
    switch (tab) {
      case 'UP NEXT':
        return (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden bg-[#050505]">
            <div className="p-3 sm:p-4 border-b border-[#212121] flex items-center justify-between bg-[#0a0a0a] shrink-0">
              <div className="min-w-0">
                <p className="text-[10px] uppercase font-mono text-gray-400">Playing from</p>
                <h4 className="text-sm font-bold text-white truncate">{activePlaylistTitle}</h4>
              </div>
              <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-pink-500/10 text-pink-400 border border-pink-500/20">
                24/7 Live
              </span>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-2.5 space-y-3">
              {/* 🎵 1. NOW PLAYING CARD (Tracks the currently active song) */}
              {currentTrack && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-1.5 px-1 text-[10px] font-bold tracking-wider uppercase text-pink-400">
                    <span className="flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-pink-500"></span>
                    </span>
                    <span>Now Playing</span>
                  </div>

                  <div className="flex items-center gap-3 p-3 rounded-2xl bg-gradient-to-r from-pink-950/40 via-purple-950/20 to-[#161616] border border-pink-500/30 shadow-lg">
                    {/* Equalizer overlay */}
                    <div className="relative shrink-0">
                      <img
                        src={currentTrack.image}
                        alt={currentTrack.song}
                        className="w-12 h-12 rounded-xl object-cover shadow-md border border-white/10"
                      />
                      {isPlaying && (
                        <div className="absolute inset-0 bg-black/50 rounded-xl flex items-center justify-center gap-0.5">
                          <span className="w-1 bg-pink-400 rounded-full animate-[pulse_0.6s_ease-in-out_infinite] h-4" />
                          <span className="w-1 bg-purple-300 rounded-full animate-[pulse_0.9s_ease-in-out_infinite] h-6" />
                          <span className="w-1 bg-pink-300 rounded-full animate-[pulse_0.7s_ease-in-out_infinite] h-3" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate leading-tight">
                        {currentTrack.song}
                      </h4>
                      <p className="text-xs text-gray-300 truncate mt-0.5">
                        {currentTrack.singers}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[10px] font-mono text-gray-400">
                        <span>{formatTime(currentTime)}</span>
                        <span>/</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ⏭️ 2. UP NEXT (Shows songs scheduled to play next in order) */}
              <div className="space-y-1">
                <div className="flex items-center justify-between px-1 pt-2 pb-1">
                  <span className="text-[10px] font-bold tracking-wider uppercase text-gray-400">
                    Up Next ({queue.length})
                  </span>
                  <span className="text-[10px] text-gray-500 font-mono">
                    Scheduled
                  </span>
                </div>

                {queue.length === 0 ? (
                  <div className="text-center py-10 text-gray-500 text-xs">
                    Loading upcoming songs...
                  </div>
                ) : (
                  queue.map((track, idx) => (
                    <div
                      key={`${track.id}-${idx}`}
                      onClick={() => isAdmin && onSelectTrack(track, true)}
                      className="flex items-center gap-3 p-2 rounded-xl hover:bg-[#181818] transition-colors group cursor-pointer"
                    >
                      <div className="w-5 text-center shrink-0">
                        <span className="text-xs text-gray-500 font-mono group-hover:hidden">{idx + 1}</span>
                        {isAdmin ? (
                          <Play className="w-3.5 h-3.5 fill-current text-white hidden group-hover:block mx-auto" />
                        ) : (
                          <span className="text-[10px] text-gray-400 hidden group-hover:inline">#{idx + 1}</span>
                        )}
                      </div>

                      <img src={track.image} alt={track.song} className="w-10 h-10 rounded-lg object-cover shrink-0 shadow-sm border border-white/5" />

                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold truncate text-gray-200 group-hover:text-white">
                          {track.song}
                        </p>
                        <p className="text-[11px] text-gray-400 truncate">{track.singers}</p>
                      </div>

                      <span className="text-[11px] text-gray-500 font-mono shrink-0 ml-2">
                        {formatTime(Number(track.duration) || 240)}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        );

      case 'LYRICS':
        return (
          <div ref={panelLyricsRef} className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
            {Array.isArray(internalLyrics) && internalLyrics.length > 0 ? (
              internalLyrics.map((line, idx) => {
                const isActive = idx === activeLyricIndex;
                return (
                  <p
                    key={idx}
                    id={`panel-lyric-line-${idx}`}
                    onClick={() => isAdmin && onSeek?.(line.time)}
                    className={`text-sm sm:text-base leading-relaxed cursor-pointer transition-colors ${
                      isActive ? 'text-white font-bold drop-shadow-md' : 'text-gray-400 font-medium hover:text-gray-200'
                    }`}
                  >
                    {line.text}
                  </p>
                );
              })
            ) : typeof internalLyrics === 'string' && internalLyrics.trim() ? (
              <div className="text-sm sm:text-base text-gray-300 whitespace-pre-wrap leading-relaxed font-sans">
                {internalLyrics}
              </div>
            ) : (
              <div className="text-center py-20 text-gray-500 text-xs">
                No lyrics found for this track.
              </div>
            )}
          </div>
        );

      case 'LIVE CHAT':
        return (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
            <div ref={chatScrollRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-3">
              {messages.length === 0 ? (
                <div className="text-center py-20 text-gray-500 text-xs flex flex-col items-center gap-2">
                  <MessageSquare className="w-6 h-6 text-gray-600" />
                  <span>Live room chat. Say hi to other listeners!</span>
                </div>
              ) : (
                messages.map((m, idx) => (
                  <div key={idx} className="bg-[#181818] p-3 rounded-2xl text-xs flex flex-col gap-1 border border-[#2a2a2a]">
                    <div className="flex items-center justify-between text-[11px] font-bold text-red-400">
                      <span>{m.user}</span>
                      <span className="text-gray-500 font-mono text-[9px]">
                        {new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-gray-200 text-xs leading-relaxed break-words">{m.text}</p>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleChatSubmit} className="p-3 border-t border-[#212121] bg-[#0c0c0c] flex items-center gap-2 shrink-0">
              <input
                type="text"
                placeholder="Chat with listeners..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className="flex-1 bg-[#1a1a1a] border border-[#2e2e2e] focus:border-white/30 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!chatInput.trim()}
                className="p-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-30 rounded-xl text-white transition-colors shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        );

      case 'REQUESTED SONGS':
        return (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-3 space-y-3">
            {/* Header with count and refresh */}
            <div className="flex items-center justify-between px-1 shrink-0">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-white uppercase tracking-wider">Pending Requests</span>
                <span className="px-2 py-0.5 rounded-full bg-red-600/30 text-red-400 border border-red-500/40 text-[10px] font-mono font-bold">
                  {pendingRequests.length}
                </span>
              </div>
              <button
                onClick={loadRequests}
                disabled={isLoadingRequests}
                className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Refresh song requests"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingRequests ? 'animate-spin text-red-400' : ''}`} />
              </button>
            </div>

            {/* Quick search to immediately play or queue any song as admin */}
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search song to play/queue as Admin..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
              />
            </div>

            {/* If searching, show search results first */}
            {searchQuery.trim() && searchResults.length > 0 ? (
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 px-1">Search Results</p>
                {searchResults.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-[#141414] border border-[#242424] hover:bg-[#1f1f1f]">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img src={item.image} alt={item.song} className="w-9 h-9 rounded-lg object-cover shrink-0 shadow-sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">{item.song}</p>
                        <p className="text-[10px] text-gray-400 truncate">{item.singers}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        onClick={() => onSelectTrack(item, true)}
                        className="px-2 py-1 bg-white hover:bg-gray-200 text-black rounded-lg text-[10px] font-bold shadow-sm"
                      >
                        Play Now
                      </button>
                      <button
                        onClick={() => onSelectTrack(item, false)}
                        className="px-2 py-1 bg-[#282828] hover:bg-[#383838] text-white rounded-lg text-[10px] font-bold"
                      >
                        + Queue
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Pending Requests List */
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                {pendingRequests.length === 0 ? (
                  <div className="text-center py-20 text-gray-500 text-xs flex flex-col items-center gap-2 px-4">
                    <Music className="w-8 h-8 text-gray-600 mb-1" />
                    <span className="font-semibold text-gray-400">No pending requests</span>
                    <span className="text-[11px] text-gray-600">When listeners request songs on Sparx FM, they will appear here for you to Play, Queue, or Decline.</span>
                  </div>
                ) : (
                  pendingRequests.map(req => (
                    <div key={req.id} className="p-3 rounded-2xl bg-[#141414] border border-[#242424] flex flex-col gap-2.5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        {req.track_image ? (
                          <img src={req.track_image} alt={req.track_name} className="w-11 h-11 rounded-xl object-cover shrink-0 shadow-md" />
                        ) : (
                          <div className="w-11 h-11 rounded-xl bg-gray-800 flex items-center justify-center shrink-0">
                            <Music className="w-5 h-5 text-gray-400" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs sm:text-sm font-bold text-white truncate">{req.track_name}</p>
                          <p className="text-[11px] text-gray-400 truncate">{req.track_artist || 'Unknown'}</p>
                          <div className="flex items-center gap-1.5 text-[10px] text-pink-400 font-medium mt-0.5">
                            <Users className="w-3 h-3 shrink-0" />
                            <span className="truncate">From {req.requester_name || 'Listener'}</span>
                            <span className="text-gray-500">•</span>
                            <span className="text-gray-500 font-mono">{formatTimeAgo(req.requested_at)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Admin Quick Action Buttons */}
                      <div className="flex items-center justify-between gap-1.5 pt-1 border-t border-white/5">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAdminPlayNow(req)}
                            className="px-2.5 py-1 bg-white hover:bg-gray-200 text-black rounded-lg text-[10px] font-bold flex items-center gap-1 shadow-sm transition-transform active:scale-95"
                          >
                            <Play className="w-3 h-3 fill-current" />
                            <span>Play Now</span>
                          </button>
                          <button
                            onClick={() => handleAdminPlayNext(req)}
                            className="px-2.5 py-1 bg-purple-600/30 hover:bg-purple-600 text-purple-200 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 border border-purple-500/30 transition-all active:scale-95"
                          >
                            <SkipForward className="w-3 h-3 fill-current" />
                            <span>Next</span>
                          </button>
                          <button
                            onClick={() => handleAdminAddToQueue(req)}
                            className="px-2.5 py-1 bg-[#282828] hover:bg-[#383838] text-gray-300 hover:text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Queue</span>
                          </button>
                        </div>
                        <button
                          onClick={() => handleAdminReject(req.id)}
                          className="p-1.5 text-gray-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Decline request"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        );

      case 'REQUEST A SONG':
        return (
          <div className="flex-1 flex flex-col min-h-0 overflow-hidden p-3 space-y-3">
            <div className="relative shrink-0">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search song to request..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#1c1c1c] border border-[#2e2e2e] rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-white/30"
              />
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
              {searchResults.length === 0 ? (
                <div className="text-center py-20 text-gray-500 text-xs flex flex-col items-center gap-2">
                  <Search className="w-6 h-6 text-gray-600" />
                  <span>Type a song or singer name to request</span>
                </div>
              ) : (
                searchResults.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 rounded-xl bg-[#141414] border border-[#242424] hover:bg-[#1f1f1f]">
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <img src={item.image} alt={item.song} className="w-9 h-9 rounded-lg object-cover shrink-0 shadow-sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-white truncate">{item.song}</p>
                        <p className="text-[10px] text-gray-400 truncate">{item.singers}</p>
                      </div>
                    </div>
                    {requestedSongIds.has(item.id) ? (
                      <span className="px-2.5 py-1 bg-green-500/20 text-green-400 border border-green-500/30 rounded-lg text-[10px] font-bold flex items-center gap-1 ml-2 shrink-0">
                        ✓ Sent
                      </span>
                    ) : (
                      <button
                        onClick={() => {
                          setRequestedSongIds(prev => new Set(prev).add(item.id));
                          onRequestSong(item);
                        }}
                        className="px-2.5 py-1 bg-red-600/30 hover:bg-red-600 text-red-300 hover:text-white rounded-lg text-[10px] font-bold transition-all ml-2 shrink-0 active:scale-95 cursor-pointer"
                      >
                        Request
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        );
    }
  };

  const getTabLabel = (tab: TabType, isMobile: boolean) => {
    if (tab === 'UP NEXT') return isMobile ? 'Up next' : 'UP NEXT';
    if (tab === 'LYRICS') return isMobile ? 'Lyrics' : 'LYRICS';
    if (tab === 'LIVE CHAT') return isMobile ? 'Live chat' : 'LIVE CHAT';
    if (tab === 'REQUESTED SONGS') {
      const count = pendingRequests.length;
      return isMobile ? `Requested (${count})` : `REQUESTED SONGS${count > 0 ? ` (${count})` : ''}`;
    }
    return isMobile ? 'Request a song' : 'REQUEST A SONG';
  };

  return (
    <div
      ref={containerRef}
      className="flex flex-col h-[100dvh] w-full bg-[#030303] text-white font-sans overflow-hidden select-none relative"
    >
      {/* 🚀 Partner Webcam Overlays for Video Dates */}
      {partnerCamsOverlay}

      {/* 🌟 Floating Live Reaction Emojis Container */}
      <div className="absolute inset-0 pointer-events-none z-50 overflow-hidden">
        {floatingReactions.map(r => (
          <div
            key={r.id}
            style={{ left: `${r.x}%` }}
            className="absolute bottom-24 text-3xl sm:text-4xl animate-[floatUp_3.5s_cubic-bezier(0.2,0.8,0.2,1)_forwards] drop-shadow-[0_0_12px_rgba(255,255,255,0.7)]"
          >
            {r.emoji}
          </div>
        ))}
      </div>

      {/* ==============================================================================
          A. MOBILE INTERFACE (Screens < 768px - Matches Screenshots 1 & 2)
          ============================================================================== */}
      <div className="flex md:hidden flex-col h-full w-full bg-black relative overflow-hidden">
        {mobileTab === null ? (
          /* ==============================================================
             MOBILE VIEW 1: FULL VIDEO & NOW PLAYING (Screenshot 1)
             ============================================================== */
          <div className="flex flex-col h-full w-full justify-between overflow-hidden">
            {/* Top Bar with Down Chevron and 3 Dots */}
            <div className="h-12 px-4 flex items-center justify-between bg-black shrink-0 z-20">
              <button
                onClick={onLeave}
                className="p-1.5 -ml-1 text-gray-300 hover:text-white active:scale-95"
                title="Back"
              >
                <ChevronDown className="w-6 h-6" />
              </button>
              <span className="text-xs font-bold text-gray-300 truncate max-w-[200px] tracking-wide">
                {roomName}
              </span>
              <button
                onClick={onShareRoom}
                className="p-1.5 -mr-1 text-gray-300 hover:text-white active:scale-95"
                title="Options"
              >
                <MoreVertical className="w-5 h-5" />
              </button>
            </div>

            {/* 16:9 Video Player (Centered & spaced down from top header) */}
            <div className="flex-1 flex items-center justify-center px-4 py-2 min-h-0">
              <div className="w-full max-w-md aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 shadow-2xl flex items-center justify-center relative">
                {youtubeVideoId && isMobileView ? (
                  <iframe
                    ref={mobileIframeRef}
                    key={youtubeVideoId}
                    id="yt-mobile-video"
                    src={iframeSrc}
                    title={currentTrack?.song || 'YouTube Video'}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full object-cover pointer-events-none"
                    onLoad={handleIframeLoad}
                  />
                ) : (
                  <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#120815] to-[#050510] p-4 text-center">
                    {currentTrack?.image && (
                      <img
                        src={currentTrack.image.replace('150x150', '500x500')}
                        alt={currentTrack.song}
                        className="w-28 h-28 rounded-xl object-cover shadow-2xl mb-2 border border-white/10"
                      />
                    )}
                    <h3 className="text-base font-bold text-white line-clamp-1">{currentTrack?.song || 'Select a song'}</h3>
                    <p className="text-xs text-gray-400 line-clamp-1">{currentTrack?.singers || 'Sparx FM'}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Player Section: Title, Scrubber, Playback Controls (Shifted down near bottom tabs) */}
            <div className="shrink-0 px-6 pt-2 pb-5 min-h-0">
              {/* Song Title and Artist */}
              <div className="mb-4 text-left">
                <h1 className="text-2xl font-black text-white tracking-tight line-clamp-1">
                  {currentTrack?.song || 'Humsafar'}
                </h1>
                <p className="text-sm font-medium text-gray-400 mt-1 line-clamp-1">
                  {currentTrack?.singers || 'Akhil Sachdeva'}
                </p>
              </div>

              {/* Scrubber Progress Slider */}
              <div className="w-full mb-4">
                <div className="relative flex items-center">
                  <input
                    type="range"
                    min="0"
                    max={duration || 100}
                    value={currentTime}
                    onChange={e => handleUserSeek(parseFloat(e.target.value))}
                    disabled={!isAdmin}
                    className="w-full h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 font-mono mt-1.5">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>

              {/* Controls Row: Admin Playback or Normal Live Reactions */}
              {isAdmin ? (
                /* Admin Playback Controls */
                <div className="flex items-center justify-center gap-8 px-2 py-1">
                  <button
                    onClick={() => {
                      sendYtCommand('seekTo', [0, true]);
                      onPrevious?.();
                    }}
                    className="p-2 text-white active:scale-95 transition-transform"
                    title="Previous"
                  >
                    <SkipBack className="w-7 h-7 fill-current" />
                  </button>

                  {/* Large Circular Play/Pause Button */}
                  <button
                    onClick={onPlayPause}
                    className="w-16 h-16 rounded-full bg-white text-black flex items-center justify-center shadow-2xl active:scale-95 transition-transform hover:scale-105"
                    title={isPlaying ? 'Pause' : 'Play'}
                  >
                    {isPlaying ? (
                      <Pause className="w-8 h-8 fill-current" />
                    ) : (
                      <Play className="w-8 h-8 fill-current ml-1" />
                    )}
                  </button>

                  <button
                    onClick={onSkip}
                    className="p-2 text-white active:scale-95 transition-transform"
                    title="Next"
                  >
                    <SkipForward className="w-7 h-7 fill-current" />
                  </button>
                </div>
              ) : (
                /* Normal User Live Reaction Emojis (No Play/Pause/Skip buttons) */
                <div className="flex flex-col items-center justify-center py-1">
                  <span className="text-[11px] font-semibold text-gray-400 mb-2 tracking-wide uppercase">
                    Tap to react with beat
                  </span>
                  <div className="flex items-center justify-center gap-2 overflow-x-auto w-full py-1">
                    {REACTION_EMOJIS.map(emoji => (
                      <button
                        key={emoji}
                        onClick={() => onSendReaction(emoji)}
                        className="text-2xl p-2 rounded-full hover:bg-white/10 active:scale-125 transition-transform"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Bottom 4 Tabs Bar (Up next | Lyrics | Comments | Related/Requested) */}
            <div className="h-14 border-t border-[#212121] bg-[#030303] flex items-center justify-around px-2 shrink-0 z-20">
              {currentTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setMobileTab(tab)}
                  className="py-2 px-2 text-xs font-semibold text-gray-400 hover:text-white transition-colors text-center truncate"
                >
                  {getTabLabel(tab, true)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* ==============================================================
             MOBILE VIEW 2: EXPANDED TAB SHEET (Screenshot 2)
             ============================================================== */
          <div className="flex flex-col h-full w-full bg-[#0a0a0a] overflow-hidden">
            {/* Top Mini Player Header */}
            <div className="h-14 px-4 bg-[#121212] border-b border-[#212121] flex items-center justify-between shrink-0 z-20">
              <div
                className="flex items-center gap-2.5 min-w-0 flex-1 cursor-pointer"
                onClick={() => setMobileTab(null)}
              >
                <ChevronDown className="w-5 h-5 text-gray-400 shrink-0" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-white truncate">{currentTrack?.song || 'Now Playing'}</p>
                  <p className="text-xs text-gray-400 truncate">{currentTrack?.singers || 'Sparx FM'}</p>
                </div>
              </div>

              {isAdmin && (
                <div className="flex items-center gap-3 shrink-0 ml-2">
                  <button onClick={onPlayPause} className="p-1.5 text-white active:scale-95">
                    {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
                  </button>
                  <button onClick={onSkip} className="p-1.5 text-white active:scale-95">
                    <SkipForward className="w-5 h-5 fill-current" />
                  </button>
                </div>
              )}
            </div>

            {/* Tab Selector Bar */}
            <div className="flex border-b border-[#212121] bg-[#0a0a0a] px-2 shrink-0">
              {currentTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setMobileTab(tab)}
                  className={`flex-1 py-3 text-xs font-bold tracking-wider transition-all text-center whitespace-nowrap truncate px-1 ${
                    mobileTab === tab
                      ? 'border-b-2 border-white text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {getTabLabel(tab, true)}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
              {renderTabContent(mobileTab)}
            </div>
          </div>
        )}
      </div>

      {/* ==============================================================================
          B. DESKTOP INTERFACE (Screens >= 768px - Matches Screenshot 3)
          ============================================================================== */}
      <div className="hidden md:flex flex-col h-full w-full overflow-hidden">
        {/* 1. TOP NAVIGATION BAR */}
        <header className="h-14 sm:h-16 px-6 bg-[#030303] border-b border-[#212121] flex items-center justify-between gap-4 z-40 shrink-0">
          {/* Left: Blank area (Logo removed per user request) */}
          <div className="w-16 sm:w-24 shrink-0" />

          {/* Center: Search Bar */}
          <div className="flex-1 max-w-xl sm:max-w-2xl relative">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-gray-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                placeholder="Search songs, albums, artists, podcasts"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full bg-[#212121] hover:bg-[#2a2a2a] focus:bg-[#121212] border border-transparent focus:border-white/30 rounded-full py-2 sm:py-2.5 pl-11 pr-10 text-xs sm:text-sm text-white placeholder-gray-400 transition-all focus:outline-none shadow-inner"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 p-1 text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Autocomplete Dropdown */}
            {searchQuery && searchResults.length > 0 && (
              <div className="absolute top-12 left-0 right-0 bg-[#212121] border border-[#333] rounded-2xl shadow-2xl overflow-hidden z-50 max-h-80 overflow-y-auto custom-scrollbar">
                {searchResults.map(t => (
                  <div
                    key={t.id}
                    onClick={() => {
                      onSelectTrack(t, isAdmin);
                      setSearchQuery('');
                      setSearchResults([]);
                    }}
                    className="flex items-center gap-3 p-2.5 hover:bg-[#303030] cursor-pointer transition-colors border-b border-white/5 last:border-0"
                  >
                    <img src={t.image} alt={t.song} className="w-10 h-10 rounded-lg object-cover" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-white truncate">{t.song}</p>
                      <p className="text-xs text-gray-400 truncate">{t.singers}</p>
                    </div>
                    <span className="text-xs text-red-400 font-bold px-2 py-1 rounded-md bg-white/5">
                      {isAdmin ? 'Play Now' : 'Request'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right: Room & Role Status */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#212121] border border-white/5 text-xs text-gray-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>{listenerCount} Online</span>
            </div>

            {isAdmin ? (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30">
                Admin
              </span>
            ) : (
              <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-purple-600/20 text-purple-300 border border-purple-500/30">
                Listener
              </span>
            )}
          </div>
        </header>

        {/* 2. MAIN CONTENT AREA (Center 16:9 Video & Right Panel Tabs) */}
        <div className="flex-1 flex overflow-hidden min-h-0 relative">
          {/* Center Stage Video Player */}
          <main className="flex-1 flex flex-col items-center justify-center relative p-4 sm:p-6 md:p-8 min-w-0 bg-[#000000]">
            <div className="w-full max-w-4xl aspect-video relative rounded-2xl overflow-hidden bg-[#0a0a0a] border border-[#212121] shadow-2xl flex items-center justify-center">
              {youtubeVideoId && !isMobileView ? (
                <iframe
                  ref={desktopIframeRef}
                  key={youtubeVideoId}
                  id="yt-video-player"
                  src={iframeSrc}
                  title={currentTrack?.song || 'YouTube Video'}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="w-full h-full object-cover pointer-events-none"
                  onLoad={handleIframeLoad}
                />
              ) : (
                <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#120815] to-[#050510] p-6 text-center">
                  {currentTrack?.image && (
                    <img
                      src={currentTrack.image.replace('150x150', '500x500')}
                      alt={currentTrack.song}
                      className="w-44 h-44 sm:w-56 sm:h-56 rounded-2xl object-cover shadow-2xl mb-4 border border-white/10"
                    />
                  )}
                  <h3 className="text-xl md:text-2xl font-bold text-white mb-1 line-clamp-1">{currentTrack?.song || 'Select a song'}</h3>
                  <p className="text-sm md:text-base text-gray-400 line-clamp-1">{currentTrack?.singers || 'Sparx Music Jam'}</p>
                </div>
              )}
            </div>
          </main>

          {/* Right Panel Tabs */}
          <aside className="w-80 lg:w-96 bg-[#030303] border-l border-[#212121] flex flex-col shrink-0 z-30">
            {/* Header Tabs */}
            <div className="flex items-center border-b border-[#212121] px-2 bg-[#0a0a0a] shrink-0">
              {currentTabs.map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-3.5 text-[11px] font-bold tracking-wider uppercase transition-all border-b-2 text-center whitespace-nowrap truncate px-1 ${
                    activeTab === tab
                      ? 'border-white text-white'
                      : 'border-transparent text-gray-400 hover:text-gray-200'
                  }`}
                >
                  {getTabLabel(tab, false)}
                </button>
              ))}
            </div>

            {/* Tab Body */}
            {renderTabContent(activeTab)}
          </aside>
        </div>

        {/* 3. BOTTOM PERSISTENT PLAYER BAR */}
        <footer className="h-18 sm:h-20 bg-[#121212] border-t border-[#272727] px-6 flex items-center justify-between z-40 relative shrink-0">
          {/* Full-width Scrubber Progress Bar */}
          <div className="absolute top-0 left-0 right-0 h-1 group cursor-pointer bg-white/10 hover:h-2 transition-all">
            <input
              type="range"
              min="0"
              max={duration || 100}
              value={currentTime}
              onChange={e => handleUserSeek(parseFloat(e.target.value))}
              disabled={!isAdmin}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-default"
            />
            <div
              className="h-full bg-red-600 rounded-full transition-all"
              style={{ width: `${Math.min(100, (currentTime / (duration || 1)) * 100)}%` }}
            />
          </div>

          {/* LEFT: Admin Playback or Listener Reactions */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 min-w-[200px] sm:min-w-[240px]">
            {isAdmin ? (
              <>
                <button
                  onClick={() => {
                    sendYtCommand('seekTo', [0, true]);
                    onPrevious?.();
                  }}
                  className="p-2 text-gray-300 hover:text-white transition-colors"
                  title="Previous track"
                >
                  <SkipBack className="w-5 h-5 fill-current" />
                </button>

                <button
                  onClick={onPlayPause}
                  className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-transform shadow-lg"
                  title={isPlaying ? 'Pause' : 'Play'}
                >
                  {isPlaying ? (
                    <Pause className="w-5 h-5 fill-current" />
                  ) : (
                    <Play className="w-5 h-5 fill-current ml-0.5" />
                  )}
                </button>

                <button
                  onClick={onSkip}
                  className="p-2 text-gray-300 hover:text-white transition-colors"
                  title="Next track"
                >
                  <SkipForward className="w-5 h-5 fill-current" />
                </button>
              </>
            ) : (
              <div className="flex items-center gap-1">
                {REACTION_EMOJIS.slice(0, 5).map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => onSendReaction(emoji)}
                    className="p-1.5 text-xl hover:scale-125 transition-transform"
                    title={`React with ${emoji}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {/* Time Stamp */}
            <div className="text-xs font-mono text-gray-400 select-none">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1">/</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* CENTER: Track Information */}
          <div className="flex items-center gap-3 max-w-sm sm:max-w-md min-w-0">
            {currentTrack?.image && (
              <img
                src={currentTrack.image}
                alt={currentTrack.song}
                className="w-11 h-11 rounded-lg object-cover shadow-md shrink-0"
              />
            )}
            <div className="min-w-0">
              <p className="text-sm font-semibold text-white truncate">{currentTrack?.song || 'No Song Playing'}</p>
              <p className="text-xs text-gray-400 truncate">{currentTrack?.singers || 'Sparx FM'}</p>
            </div>
          </div>

          {/* RIGHT: Volume & Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => setIsMuted(prev => !prev)}
                className="p-1.5 text-gray-400 hover:text-white"
              >
                {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={e => {
                  setVolume(parseFloat(e.target.value));
                  if (isMuted) setIsMuted(false);
                }}
                className="w-16 sm:w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white"
              />
            </div>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-full text-gray-400 hover:text-white transition-colors"
              title="Fullscreen"
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
};
