"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { GlimpseCard } from '../components/GlimpseCard';
import { GlimpseUploadModal } from '../components/GlimpseUploadModal';
import { Plus, Tv, Music, X, Loader2, AlertCircle, Camera, Ghost, BadgeCheck, Lock, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AuthPromptModal } from '../components/AuthPromptModal';
import { LoadingState } from '../components/LoadingState';
import { getOptimizedUrl } from '../utils/image';

interface GlimpseProfile {
  id: string;
  real_name: string | null;
  anonymous_id: string;
  avatar: string | null;
  is_verified: boolean;
  university: string;
}

interface GlimpseReaction {
  reaction_type: 'heart' | 'fire' | 'like';
  user_id: string;
}

interface Glimpse {
  id: string;
  user_id: string;
  image_path: string;
  caption: string | null;
  university: string;
  created_at: string;
  is_anonymous: boolean;
  profiles: GlimpseProfile | null;
  glimpse_reactions: GlimpseReaction[];
}

export const Sparx: React.FC = () => {
  const { currentUser } = useAuth();
  const router = useRouter();
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Feeds and states
  const [feedMode, setFeedMode] = useState<'campus' | 'global' | 'leaderboard'>('campus');
  const [glimpses, setGlimpses] = useState<Glimpse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination and real-time alerts
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [newGlimpsesAlert, setNewGlimpsesAlert] = useState(false);

  // Page size limit
  const PAGE_LIMIT = 5;

  // Modals and overlays
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isLobbyOpen, setIsLobbyOpen] = useState(false);
  const [activeRooms, setActiveRooms] = useState<any[]>([]);
  const [creatingType, setCreatingType] = useState<'cinema' | 'music' | null>(null);
  const [newRoomName, setNewRoomName] = useState('');
  const [lobbyError, setLobbyError] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showPasscodePrompt, setShowPasscodePrompt] = useState(false);
  const [pendingJoinRoom, setPendingJoinRoom] = useState<any>(null);
  const [enteredPasscode, setEnteredPasscode] = useState('');
  const [passcodeError, setPasscodeError] = useState<string | null>(null);

  const fetchActiveRooms = async () => {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('active_rooms')
          .select('*');
        if (!error && data) {
          setActiveRooms(data);
        }
      } catch (err) {
        console.error('Error fetching active rooms:', err);
      }
    }
  };

  useEffect(() => {
    if (isLobbyOpen) {
      fetchActiveRooms();
      const interval = setInterval(fetchActiveRooms, 5000);
      return () => clearInterval(interval);
    }
  }, [isLobbyOpen]);

  const parseRoomDetails = (roomId: string) => {
    const parts = roomId.split('_');
    if (parts.length >= 3) {
      return {
        type: parts[0],
        name: parts[1],
        uniqueId: parts[2]
      };
    }
    return {
      type: roomId.startsWith('cinema') ? 'cinema' : 'music',
      name: roomId.replace(/-/g, ' ').toUpperCase(),
      uniqueId: ''
    };
  };

  const handleCreateRoomSubmit = () => {
    if (!newRoomName.trim()) {
      setLobbyError("Room name cannot be empty");
      return;
    }
    const currentActiveOfType = activeRooms.filter(r => parseRoomDetails(r.room_id).type === creatingType);
    if (currentActiveOfType.length >= 4) {
      setLobbyError(`Maximum of 4 ${creatingType === 'cinema' ? 'Cinema' : 'Music'} rooms are already active.`);
      return;
    }

    const nameSlug = newRoomName.trim().substring(0, 30);
    const uniqueId = Math.random().toString(36).substring(2, 7);
    const roomId = `${creatingType}_${nameSlug}_${uniqueId}`;

    let redirectUrl = `/sparx/${creatingType}?room=${encodeURIComponent(roomId)}`;
    
    if (isPrivate) {
      const generatedPasscode = Math.floor(1000 + Math.random() * 9000).toString();
      redirectUrl += `&private=true&passcode=${generatedPasscode}`;
    }

    setIsLobbyOpen(false);
    setCreatingType(null);
    setNewRoomName('');
    setIsPrivate(false);
    setLobbyError(null);

    router.push(redirectUrl);
  };

  const [showTutorial, setShowTutorial] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  // Active index of the currently viewed Glimpse card in the full-screen story viewer
  const [activeStoryIndex, setActiveStoryIndex] = useState<number | null>(null);
  const [storyProgress, setStoryProgress] = useState(0);

  // Viewed glimpses tracker
  const [viewedIds, setViewedIds] = useState<string[]>([]);

  // Leaderboard states
  const [leaderboardScope, setLeaderboardScope] = useState<'campus' | 'global'>('campus');
  const [leaderboardUsers, setLeaderboardUsers] = useState<{ profile: GlimpseProfile; count: number }[]>([]);

  // Load viewed glimpse IDs from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('viewed_glimpse_ids');
      if (saved) {
        setViewedIds(JSON.parse(saved));
      }
    } catch (e) {
      console.error('Error loading viewed glimpse IDs:', e);
    }
  }, []);

  const markAsViewed = (id: string) => {
    setViewedIds(prev => {
      if (prev.includes(id)) return prev;
      const updated = [...prev, id];
      localStorage.setItem('viewed_glimpse_ids', JSON.stringify(updated));
      return updated;
    });
  };

  // Mark glimpses as viewed when opened in the story viewer
  useEffect(() => {
    if (activeStoryIndex !== null && glimpses.length > 0 && glimpses[activeStoryIndex]) {
      markAsViewed(glimpses[activeStoryIndex].id);
    }
  }, [activeStoryIndex, glimpses]);

  // Auto-advance logic for story overlay
  useEffect(() => {
    if (activeStoryIndex === null) {
      setStoryProgress(0);
      return;
    }

    setStoryProgress(0);

    const interval = setInterval(() => {
      setStoryProgress(prev => {
        if (prev >= 100) {
          // Trigger next story
          if (activeStoryIndex < glimpses.length - 1) {
            setActiveStoryIndex(activeStoryIndex + 1);
          } else {
            setActiveStoryIndex(null);
          }
          return 0;
        }
        return prev + (100 / 60); // 60 ticks of 100ms = 6000ms (6 seconds)
      });
    }, 100);

    return () => clearInterval(interval);
  }, [activeStoryIndex, glimpses.length]);

  const fetchLeaderboard = async () => {
    if (!supabase) return;
    setIsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('glimpses')
        .select(`
          user_id,
          university,
          profiles:user_id (
            id,
            real_name,
            anonymous_id,
            avatar,
            is_verified,
            university
          )
        `);
        
      const targetUniv = currentUser?.university?.trim();
      if (leaderboardScope === 'campus' && targetUniv) {
        query = query.ilike('university', `${targetUniv}%`);
      }
      
      const { data, error: queryError } = await query;
      if (queryError) throw queryError;
      
      const countsMap: { [uid: string]: { count: number; profile: GlimpseProfile } } = {};
      
      data?.forEach((row: any) => {
        if (!row.profiles) return;
        const uid = row.user_id;
        if (!countsMap[uid]) {
          countsMap[uid] = { count: 0, profile: row.profiles };
        }
        countsMap[uid].count += 1;
      });
      
      const sorted = Object.values(countsMap)
        .map(item => ({ profile: item.profile, count: item.count }))
        .sort((a, b) => b.count - a.count);
        
      setLeaderboardUsers(sorted);
    } catch (err: any) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  // Load leaderboard when toggled or scope changes
  useEffect(() => {
    if (feedMode === 'leaderboard') {
      fetchLeaderboard();
    }
  }, [feedMode, leaderboardScope, currentUser]);



  // Sync feed mode default based on auth
  useEffect(() => {
    if (currentUser) {
      setFeedMode('campus');
    } else {
      setFeedMode('global');
    }
  }, [currentUser]);

  // Check tutorial status on mount
  useEffect(() => {
    const tutorialSeen = localStorage.getItem('glimpse_tutorial_seen');
    if (!tutorialSeen) {
      setShowTutorial(true);
    }
  }, []);

  const dismissTutorial = () => {
    localStorage.setItem('glimpse_tutorial_seen', 'true');
    setShowTutorial(false);
  };

  // Main fetch function (first load or hard refresh)
  const fetchGlimpses = async (showLoading = true) => {
    if (!supabase) return;
    if (showLoading) setIsLoading(true);
    setError(null);
    setHasMore(true);
    setNewGlimpsesAlert(false);

    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

      let query = supabase
        .from('glimpses')
        .select(`
          id,
          user_id,
          image_path,
          caption,
          university,
          created_at,
          is_anonymous,
          profiles:user_id (
            id,
            real_name,
            anonymous_id,
            avatar,
            is_verified,
            university
          ),
          glimpse_reactions (
            id,
            reaction_type,
            user_id
          )
        `)
        .gt('created_at', last24Hours);

      const targetUniv = currentUser?.university?.trim();
      if (feedMode === 'campus' && targetUniv) {
        query = query.ilike('university', `${targetUniv}%`);
      } else if (feedMode === 'global' && targetUniv) {
        query = query.not('university', 'ilike', `${targetUniv}%`);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(0, PAGE_LIMIT - 1);

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      const fetchedData = (data as any) || [];
      setGlimpses(fetchedData);
      setHasMore(fetchedData.length === PAGE_LIMIT);
    } catch (err: any) {
      console.error('Error fetching glimpses:', err);
      setError(err.message || 'Failed to load glimpses');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch next page of glimpses
  const fetchNextPage = async () => {
    if (!supabase || isLoading || isLoadingMore || !hasMore) return;
    setIsLoadingMore(true);

    try {
      const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
      const currentOffset = glimpses.length;

      let query = supabase
        .from('glimpses')
        .select(`
          id,
          user_id,
          image_path,
          caption,
          university,
          created_at,
          is_anonymous,
          profiles:user_id (
            id,
            real_name,
            anonymous_id,
            avatar,
            is_verified,
            university
          ),
          glimpse_reactions (
            id,
            reaction_type,
            user_id
          )
        `)
        .gt('created_at', last24Hours);

      const targetUniv = currentUser?.university?.trim();
      if (feedMode === 'campus' && targetUniv) {
        query = query.ilike('university', `${targetUniv}%`);
      } else if (feedMode === 'global' && targetUniv) {
        query = query.not('university', 'ilike', `${targetUniv}%`);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(currentOffset, currentOffset + PAGE_LIMIT - 1);

      const { data, error: queryError } = await query;

      if (queryError) {
        throw queryError;
      }

      const fetchedData = (data as any) || [];
      if (fetchedData.length > 0) {
        setGlimpses(prev => {
          const prevIds = new Set(prev.map(g => g.id));
          const filtered = fetchedData.filter((g: any) => !prevIds.has(g.id));
          return [...prev, ...filtered];
        });
      }
      
      setHasMore(fetchedData.length === PAGE_LIMIT);
    } catch (err: any) {
      console.error('Error fetching next page of glimpses:', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  // Handle container scroll to trigger pagination
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    // Load next page when user is close to the bottom of current feed cards (within 1.5 screen heights)
    if (scrollHeight - scrollTop - clientHeight < clientHeight * 1.5) {
      fetchNextPage();
    }
  };

  // Re-fetch on feedMode / user change
  useEffect(() => {
    fetchGlimpses();
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [feedMode, currentUser]);

  // Real-time listener for glimpses and reactions
  useEffect(() => {
    if (!supabase) return;

    const glimpseChannel = supabase.channel('glimpses-realtime-feed')
      // Listen for new glimpses
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'glimpses' }, (payload) => {
        const newGlimpse = payload.new;
        
        // If it's the current user's own upload, ignore
        if (newGlimpse.user_id === currentUser?.id) return;
        
        // Check if the new glimpse matches the university filter criteria
        const targetUniv = currentUser?.university?.trim();
        const glimpseUniv = newGlimpse.university?.trim();
        const matchesCampus = targetUniv && glimpseUniv && glimpseUniv.toLowerCase().startsWith(targetUniv.toLowerCase());
        
        if (feedMode === 'campus') {
          if (matchesCampus) setNewGlimpsesAlert(true);
        } else {
          if (!matchesCampus) setNewGlimpsesAlert(true);
        }
      })
      // Listen for updates on reactions in memory to avoid full-feed network fetches
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'glimpse_reactions' }, (payload) => {
        const newReaction = payload.new;
        setGlimpses(prev => prev.map(g => {
          if (g.id === newReaction.glimpse_id) {
            const exists = g.glimpse_reactions?.some((r: any) => r.user_id === newReaction.user_id && r.reaction_type === newReaction.reaction_type);
            if (!exists) {
              return {
                ...g,
                glimpse_reactions: [...(g.glimpse_reactions || []), { id: newReaction.id, reaction_type: newReaction.reaction_type, user_id: newReaction.user_id }]
              };
            }
          }
          return g;
        }));
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'glimpse_reactions' }, (payload) => {
        const oldReaction = payload.old;
        if (oldReaction?.id) {
          setGlimpses(prev => prev.map(g => {
            return {
              ...g,
              glimpse_reactions: (g.glimpse_reactions || []).filter((r: any) => r.id !== oldReaction.id)
            };
          }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(glimpseChannel);
    };
  }, [feedMode, currentUser]);

  const handleOpenUpload = () => {
    if (!currentUser) {
      setShowAuthModal(true);
    } else {
      setIsUploadOpen(true);
    }
  };

  // Removed snap-inbox row click action. Glimpses are revealed directly on scroll.

  return (
    <div className="relative w-full h-[100dvh] bg-black text-white overflow-hidden select-none">
      {/* Floating Header Campus Switcher */}
      <header className="absolute top-4 left-0 right-0 z-30 flex justify-center px-4 pointer-events-none">
        <div className="flex items-center gap-1 p-1 bg-black/40 border border-white/10 backdrop-blur-md rounded-full shadow-2xl pointer-events-auto">
          {currentUser && (
            <button
              onClick={() => setFeedMode('campus')}
              className={`px-5 py-2 text-xs font-bold tracking-wider uppercase rounded-full transition-all duration-300
                ${feedMode === 'campus'
                  ? 'bg-white text-black shadow-lg'
                  : 'text-gray-400 hover:text-white'
                }`}
            >
              My Campus
            </button>
          )}
          <button
            onClick={() => setFeedMode('global')}
            className={`px-5 py-2 text-xs font-bold tracking-wider uppercase rounded-full transition-all duration-300
              ${feedMode === 'global' || !currentUser
                ? 'bg-white text-black shadow-lg'
                : 'text-gray-400 hover:text-white'
              }`}
          >
            Global
          </button>
          <button
            onClick={() => setFeedMode('leaderboard')}
            className={`px-5 py-2 text-xs font-bold tracking-wider uppercase rounded-full transition-all duration-300
              ${feedMode === 'leaderboard'
                ? 'bg-white text-black shadow-lg'
                : 'text-gray-400 hover:text-white'
              }`}
          >
            Leaderboard
          </button>
        </div>
      </header>

      {/* Floating New Glimpses Alert Pill */}
      {newGlimpsesAlert && feedMode !== 'leaderboard' && (
        <button
          onClick={() => {
            fetchGlimpses(true);
            setNewGlimpsesAlert(false);
            if (scrollContainerRef.current) {
              scrollContainerRef.current.scrollTop = 0;
            }
          }}
          className="absolute top-24 left-1/2 -translate-x-1/2 z-30 px-5 py-2.5 bg-neon hover:bg-neon/90 text-white text-xs font-bold rounded-full shadow-[0_0_25px_rgba(255,0,127,0.5)] border border-white/20 animate-bounce flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
        >
          <Camera className="w-4 h-4" />
          <span>New Glimpses available! Tap to refresh</span>
        </button>
      )}

      {/* Main Content Feed Area */}
      {isLoading ? (
        <div className="w-full h-full bg-black relative">
          <LoadingState message="Scanning campus moments..." />
        </div>
      ) : error ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black p-6 gap-4 text-center">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <h3 className="text-lg font-bold text-white">Something went wrong</h3>
          <p className="text-sm text-gray-500 max-w-sm">{error}</p>
          <button
            onClick={() => {
              if (feedMode === 'leaderboard') {
                fetchLeaderboard();
              } else {
                fetchGlimpses();
              }
            }}
            className="px-6 py-2.5 bg-gray-900 border border-gray-800 rounded-2xl text-xs font-bold tracking-wider uppercase hover:border-neon transition-all"
          >
            Try Again
          </button>
        </div>
      ) : feedMode === 'leaderboard' ? (
        /* Leaderboard View */
        <div className="w-full h-full overflow-y-auto pt-24 px-4 pb-32 scrollbar-none">
          <div className="max-w-md mx-auto">
            {/* Header / Intro */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-black text-white uppercase tracking-tight mb-1 flex items-center justify-center gap-2">
                Top Glimpsers
              </h2>
              <p className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                Most glimpses shared in the last 24 hours
              </p>
            </div>

            {/* Scope Switcher (Campus vs Global) */}
            {currentUser && (
              <div className="flex justify-center gap-2 mb-6">
                <button
                  onClick={() => setLeaderboardScope('campus')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    leaderboardScope === 'campus'
                      ? 'bg-rose-500 border-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                      : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-700 hover:text-gray-300'
                  }`}
                >
                  My Campus
                </button>
                <button
                  onClick={() => setLeaderboardScope('global')}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all border ${
                    leaderboardScope === 'global'
                      ? 'bg-rose-500 border-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]'
                      : 'bg-transparent text-gray-500 border-gray-800 hover:border-gray-700 hover:text-gray-300'
                  }`}
                >
                  Global
                </button>
              </div>
            )}

            {/* Leaderboard List */}
            {leaderboardUsers.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-gray-900 to-gray-800 rounded-full flex items-center justify-center mb-4 border border-gray-700 shadow-2xl">
                  <Ghost className="w-8 h-8 text-gray-600" />
                </div>
                <h3 className="text-base font-bold text-white uppercase mb-1">No Active Glimpsers</h3>
                <p className="text-xs text-gray-500 max-w-[240px] leading-relaxed mb-6">
                  {leaderboardScope === 'campus'
                    ? 'No one at your university has shared any glimpses in the last 24 hours.'
                    : 'No global glimpses have been shared in the last 24 hours.'}
                </p>
                <button
                  onClick={handleOpenUpload}
                  className="px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-bold text-xs hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(244,63,94,0.2)]"
                >
                  Post to claim Rank #1
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {leaderboardUsers.map((user, idx) => {
                  const rank = idx + 1;
                  const isCurrentUser = currentUser && currentUser.id === user.profile.id;
                  
                  return (
                    <div 
                      key={user.profile.id}
                      className={`flex items-center justify-between p-4 border rounded-2xl transition-all duration-300 relative overflow-hidden ${
                        isCurrentUser
                          ? 'bg-neon/5 border-neon/40 shadow-[0_0_20px_rgba(255,0,127,0.1)]'
                          : 'bg-gray-950/40 border-gray-900 hover:border-gray-800'
                      }`}
                    >
                      {/* Subtle gradient highlight for current user */}
                      {isCurrentUser && (
                        <div className="absolute inset-0 bg-gradient-to-r from-neon/10 to-transparent pointer-events-none" />
                      )}
                      
                      <div className="flex items-center gap-4 min-w-0 relative z-10">
                        {/* Rank Badge */}
                        <div className="w-6 flex-shrink-0 flex items-center justify-center font-bold font-mono text-sm">
                          {rank === 1 ? (
                            <span className="text-pink-500" title="Rank 1">1</span>
                          ) : rank === 2 ? (
                            <span className="text-slate-400">2</span>
                          ) : rank === 3 ? (
                            <span className="text-amber-600">3</span>
                          ) : (
                            <span className="text-gray-600">{rank}</span>
                          )}
                        </div>

                        {/* Avatar */}
                        <div className="flex-shrink-0">
                          <div className={`w-11 h-11 rounded-full overflow-hidden bg-gray-950 flex items-center justify-center
                            ${rank === 1 
                              ? 'border-2 border-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.3)]' 
                              : rank === 2 
                                ? 'border-2 border-slate-400 shadow-[0_0_8px_rgba(148,163,184,0.3)]' 
                                : rank === 3 
                                  ? 'border-2 border-amber-600 shadow-[0_0_8px_rgba(180,83,9,0.3)]' 
                                  : 'border border-gray-800'
                            }`}
                          >
                            {user.profile.avatar ? (
                              <img 
                                src={getOptimizedUrl(user.profile.avatar, 64)} 
                                alt="Avatar" 
                                className="w-full h-full object-cover" 
                              />
                            ) : (
                              <div className="w-full h-full bg-neon/15 text-neon text-xs font-bold font-mono flex items-center justify-center">
                                {user.profile.anonymous_id?.slice(-2).toUpperCase() || '??'}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Details */}
                        <div className="min-w-0">
                          <h4 className={`text-sm font-bold truncate flex items-center gap-1.5 ${isCurrentUser ? 'text-neon' : 'text-gray-100'}`}>
                            {user.profile.real_name || 'Anonymous'}
                            {isCurrentUser && (
                              <span className="text-[9px] text-neon font-black uppercase tracking-wider bg-neon/10 px-1.5 py-0.5 rounded-md border border-neon/20 shadow-[0_0_8px_rgba(255,0,127,0.2)]">You</span>
                            )}
                            {user.profile.is_verified && (
                              <BadgeCheck className="w-4 h-4 text-[#60a5fa] drop-shadow-[0_0_4px_rgba(96,165,250,0.6)]" fill="currentColor" stroke="black" strokeWidth={1.5} />
                            )}
                          </h4>
                          <span className="text-[10px] text-gray-500 block truncate mt-0.5 font-medium">
                            @{user.profile.anonymous_id || 'anonymous'} • {user.profile.university}
                          </span>
                        </div>
                      </div>

                      {/* Glimpse Count */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-black text-rose-500 font-mono">
                          {user.count}
                        </span>
                        <span className="text-xs text-gray-400 font-bold uppercase tracking-wider font-mono">
                          {user.count === 1 ? 'glimpse' : 'glimpses'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      ) : glimpses.length === 0 ? (
        <div className="w-full h-full flex flex-col items-center justify-center bg-black p-8 text-center relative z-10 animate-fade-in">
          {/* Mascot Circle */}
          <div className="w-20 h-20 bg-gradient-to-br from-gray-900 to-gray-800 rounded-full flex items-center justify-center mb-6 border border-gray-700 mx-auto shadow-2xl">
            <Ghost className="w-10 h-10 text-gray-600" />
          </div>

          <h2 className="text-xl font-black text-white mb-3 uppercase tracking-tight">
            No Glimpses Yet
          </h2>
          
          <p className="text-gray-500 text-sm max-w-xs mb-8 mx-auto leading-relaxed">
            {feedMode === 'campus'
              ? 'Be the first to share a highlight of your day on campus!'
              : 'Nobody has shared global glimpses in the last 24 hours.'}
          </p>

          <button
            onClick={handleOpenUpload}
            className="px-6 py-3 bg-gradient-to-r from-neon to-purple-600 text-white rounded-full font-bold text-sm transition-all hover:shadow-[0_0_30px_rgba(255,0,127,0.4)] hover:scale-105 active:scale-95 flex items-center justify-center gap-2 mx-auto"
          >
            <Camera className="w-4 h-4" />
            <span>Share a Glimpse</span>
          </button>
        </div>
      ) : (
        /* Glimpse Thread List View */
        <div 
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="w-full h-full overflow-y-auto pt-20 pb-32 scrollbar-none divide-y divide-gray-900/50"
        >
          <div className="max-w-xl mx-auto bg-black">
            {glimpses.map((glimpse, index) => {
              const isViewed = viewedIds.includes(glimpse.id);
              const displayName = glimpse.is_anonymous ? 'Anonymous' : (glimpse.profiles?.real_name || 'Anonymous');
              const timeText = (() => {
                const diff = Date.now() - new Date(glimpse.created_at).getTime();
                const hrs = Math.floor(diff / (1000 * 60 * 60));
                if (hrs < 1) {
                  const mins = Math.floor(diff / (1000 * 60));
                  return `${Math.max(1, mins)}m`;
                }
                return `${hrs}h`;
              })();
              const reactionCount = glimpse.glimpse_reactions?.length || 0;
              
              return (
                <div key={glimpse.id} className="flex flex-col p-4 bg-black select-none border-b border-gray-900/50">
                  {/* Main row: Avatar + Glimpse Status */}
                  <div 
                    onClick={() => {
                      markAsViewed(glimpse.id);
                      setActiveStoryIndex(index);
                    }}
                    className="flex items-center justify-between hover:bg-gray-950/40 p-2 rounded-2xl transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4 min-w-0 flex-1">
                      {/* User Avatar */}
                      <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full border border-gray-800 overflow-hidden bg-gray-950 flex items-center justify-center">
                          {glimpse.profiles?.avatar && !glimpse.is_anonymous ? (
                            <img 
                              src={getOptimizedUrl(glimpse.profiles.avatar, 64)} 
                              alt="Avatar" 
                              className="w-full h-full object-cover" 
                            />
                          ) : (
                            <div className="w-full h-full bg-neon/15 text-neon text-xs font-bold font-mono flex items-center justify-center">
                              {glimpse.profiles?.anonymous_id?.slice(-2).toUpperCase() || '??'}
                            </div>
                          )}
                        </div>
                        {!isViewed && (
                          <div className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-rose-500 rounded-full border-2 border-black animate-pulse shadow-[0_0_8px_#f43f5e]" />
                        )}
                      </div>

                      {/* Metadata & tap to load status */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-gray-100 truncate">
                            {displayName}
                          </h3>
                          {glimpse.profiles?.is_verified && !glimpse.is_anonymous && (
                            <BadgeCheck className="w-4 h-4 text-[#60a5fa] drop-shadow-[0_0_4px_rgba(96,165,250,0.6)]" fill="currentColor" stroke="black" strokeWidth={1.5} />
                          )}
                          <span className="text-xs text-gray-500 font-mono">
                            · {timeText}
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-2 text-xs mt-1 font-medium">
                          {!isViewed ? (
                            <>
                              <div className="w-2.5 h-2.5 bg-rose-500 rounded-sm animate-pulse" />
                              <span className="text-rose-500 font-semibold">Tap to load</span>
                            </>
                          ) : (
                            <>
                              <div className="w-2.5 h-2.5 border border-rose-500/60 rounded-sm bg-transparent" />
                              <span className="text-gray-500">Opened</span>
                            </>
                          )}
                           {reactionCount > 0 && (
                            <>
                              <span className="text-gray-700">•</span>
                              <span className="flex items-center gap-0.5 text-orange-500 font-bold">
                                {reactionCount} reactions
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Thread line and Caption sub-box */}
                  {glimpse.caption && (
                    <div 
                      onClick={() => {
                        markAsViewed(glimpse.id);
                        setActiveStoryIndex(index);
                      }}
                      className="flex items-start pr-4 cursor-pointer select-none group mt-1"
                    >
                      {/* Thread line container */}
                      <div className="w-16 flex-shrink-0 self-stretch relative min-h-[40px]">
                        {/* Vertical line: starts at the top of the container, aligns with avatar center (around 48px from left edge) */}
                        <div className="absolute top-0 bottom-1/2 left-[32px] w-0.5 bg-gray-800/80 group-hover:bg-neon/30 transition-colors" />
                        {/* Horizontal line: turns right to connect to the caption card */}
                        <div className="absolute top-1/2 left-[32px] right-0 h-0.5 bg-gray-800/80 group-hover:bg-neon/30 transition-colors" />
                      </div>

                      {/* Caption sub-box */}
                      <div className="flex-1 p-3 ml-2 rounded-2xl bg-gray-950/40 border border-neon/30 group-hover:border-neon group-hover:bg-gray-950/60 group-hover:shadow-[0_0_15px_rgba(255,0,127,0.15)] transition-all duration-300 shadow-sm">
                        <p className="text-xs text-gray-300 leading-relaxed font-medium italic">
                          "{glimpse.caption}"
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          {isLoadingMore && (
            <div className="w-full py-8 flex flex-col items-center justify-center gap-2 text-gray-500">
              <Loader2 className="w-6 h-6 text-neon animate-spin" />
              <span className="text-[9px] font-bold uppercase tracking-wider font-mono">Loading more glimpses...</span>
            </div>
          )}
        </div>
      )}

      {/* Full-screen Story Viewer Overlay */}
      {activeStoryIndex !== null && glimpses[activeStoryIndex] && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center select-none animate-in fade-in duration-200">
          <GlimpseCard
            glimpse={glimpses[activeStoryIndex]}
            currentUser={currentUser}
            initialReactions={glimpses[activeStoryIndex].glimpse_reactions || []}
            onOpenLobby={() => setIsLobbyOpen(true)}
            onNext={() => {
              if (activeStoryIndex < glimpses.length - 1) {
                setActiveStoryIndex(activeStoryIndex + 1);
              } else {
                setActiveStoryIndex(null);
              }
            }}
            onPrev={() => {
              if (activeStoryIndex > 0) {
                setActiveStoryIndex(activeStoryIndex - 1);
              }
            }}
          />

          {/* Glimpse Progress Indicators at the Top */}
          <div className="absolute top-4 left-4 md:left-[104px] right-12 z-50 flex gap-1">
            {glimpses.map((_, idx) => (
              <div key={idx} className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                <div 
                  className={`h-full bg-white ${
                    (idx === activeStoryIndex && storyProgress > 0) 
                      ? 'transition-all duration-100 ease-linear' 
                      : ''
                  }`}
                  style={{
                    width: idx < activeStoryIndex 
                      ? '100%' 
                      : idx === activeStoryIndex 
                        ? `${storyProgress}%` 
                        : '0%'
                  }}
                />
              </div>
            ))}
          </div>

          {/* Close overlay button */}
          <button
            onClick={() => setActiveStoryIndex(null)}
            className="absolute top-2.5 right-3 z-50 p-2 bg-black/40 hover:bg-black/60 border border-white/10 rounded-full transition-all duration-200 text-white active:scale-95"
            aria-label="Close stories"
          >
            <X className="w-5 h-5 stroke-[2.5px]" />
          </button>
        </div>
      )}

      {/* Floating Action Buttons (FAB) */}
      {feedMode !== 'leaderboard' && activeStoryIndex === null && (
        <div className="absolute bottom-24 right-4 md:bottom-8 md:right-8 z-30 flex flex-col gap-4 items-center">
          {/* Duo Dates Lobby FAB */}
          <button
            onClick={() => setIsLobbyOpen(true)}
            className="p-4 bg-cyan-500/90 hover:bg-cyan-500 text-white rounded-full shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.8)] border border-white/10 transition-all duration-300 active:scale-90"
            aria-label="Open lobby"
          >
            <Tv className="w-6 h-6 text-white" />
          </button>

          {/* Upload FAB */}
          <button
            onClick={handleOpenUpload}
            className="p-4 bg-neon hover:bg-neon/95 text-white rounded-full shadow-[0_0_20px_rgba(255,0,127,0.5)] hover:shadow-[0_0_30px_rgba(255,0,127,0.8)] border border-white/10 transition-all duration-300 active:scale-90"
            aria-label="Upload new glimpse"
          >
            <Plus className="w-6 h-6 stroke-[3px]" />
          </button>
        </div>
      )}

      {/* Vibe Rooms / Duo Dates Lobby Overlay */}
      {isLobbyOpen && (
        <div
          onClick={() => {
            setIsLobbyOpen(false);
            setCreatingType(null);
            setNewRoomName('');
            setLobbyError(null);
          }}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
        >
          <div
            className="relative w-full max-w-sm max-h-[85dvh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-zinc-900">
              <div>
                <h3 className="text-base font-bold text-white leading-tight">
                  {creatingType === null ? 'Watch Together' : creatingType === 'cinema' ? 'Create Cinema Room' : 'Create Music Lounge'}
                </h3>
                <p className="text-xs text-zinc-500 mt-0.5 font-normal">
                  {creatingType === null ? 'Join an active room or start your own' : 'Give your room a name. Anyone with a profile can join.'}
                </p>
              </div>
              <button
                onClick={() => {
                  setIsLobbyOpen(false);
                  setCreatingType(null);
                  setNewRoomName('');
                  setLobbyError(null);
                }}
                className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors ml-3 shrink-0"
                aria-label="Close lobby"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {creatingType === null ? (
              <div className="px-5 py-4 flex-1 flex flex-col gap-4 overflow-y-auto scrollbar-none">
                {lobbyError && (
                  <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 py-2.5 px-4 rounded-xl">
                    {lobbyError}
                  </div>
                )}

                {/* Cinema Rooms */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Tv className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Cinema  ({activeRooms.filter(r => parseRoomDetails(r.room_id).type === 'cinema').length}/4)
                    </span>
                  </div>
                  {activeRooms.filter(r => parseRoomDetails(r.room_id).type === 'cinema').length === 0 ? (
                    <div className="py-4 px-4 rounded-xl border border-zinc-900 bg-zinc-900/20">
                      <p className="text-sm text-zinc-500">No active watch parties.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {activeRooms.filter(r => parseRoomDetails(r.room_id).type === 'cinema').map((room) => {
                        const details = parseRoomDetails(room.room_id);
                        return (
                          <button
                            key={room.room_id}
                            onClick={() => {
                              if (room.is_private) {
                                setPendingJoinRoom(room);
                                setShowPasscodePrompt(true);
                              } else {
                                setIsLobbyOpen(false);
                                router.push(`/sparx/cinema?room=${encodeURIComponent(room.room_id)}`);
                              }
                            }}
                            className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 text-left transition-colors group w-full"
                          >
                            <div className="min-w-0 flex flex-col">
                              <span className="text-sm font-semibold text-zinc-200 group-hover:text-white truncate flex items-center gap-1.5">
                                {details.name}
                                {room.is_private && <Lock className="w-3.5 h-3.5 text-zinc-500" />}
                              </span>
                              <span className="text-xs text-zinc-600 mt-0.5 flex items-center gap-1.5">
                                Cinema Room
                                <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                                <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {room.participant_count || 1}</span>
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-zinc-400 group-hover:text-white border border-zinc-700 px-3 py-1 rounded-lg bg-zinc-900 shrink-0 ml-3">Join</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Music Lounges */}
                <div>
                  <div className="flex items-center gap-1.5 mb-2">
                    <Music className="w-3.5 h-3.5 text-zinc-500" />
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                      Music  ({activeRooms.filter(r => parseRoomDetails(r.room_id).type === 'music').length}/4)
                    </span>
                  </div>
                  {activeRooms.filter(r => parseRoomDetails(r.room_id).type === 'music').length === 0 ? (
                    <div className="py-4 px-4 rounded-xl border border-zinc-900 bg-zinc-900/20">
                      <p className="text-sm text-zinc-500">No active music lounges.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1.5">
                      {activeRooms.filter(r => parseRoomDetails(r.room_id).type === 'music').map((room) => {
                        const details = parseRoomDetails(room.room_id);
                        return (
                          <button
                            key={room.room_id}
                            onClick={() => {
                              if (room.is_private) {
                                setPendingJoinRoom(room);
                                setShowPasscodePrompt(true);
                              } else {
                                setIsLobbyOpen(false);
                                router.push(`/sparx/music?room=${encodeURIComponent(room.room_id)}`);
                              }
                            }}
                            className="flex items-center justify-between p-3 rounded-xl bg-zinc-900/40 border border-zinc-800 hover:bg-zinc-900 hover:border-zinc-700 text-left transition-colors group w-full"
                          >
                            <div className="min-w-0 flex flex-col">
                              <span className="text-sm font-semibold text-zinc-200 group-hover:text-white truncate flex items-center gap-1.5">
                                {details.name}
                                {room.is_private && <Lock className="w-3.5 h-3.5 text-zinc-500" />}
                              </span>
                              <span className="text-xs text-zinc-600 mt-0.5 flex items-center gap-1.5">
                                Music Lounge
                                <span className="w-1 h-1 rounded-full bg-zinc-700"></span>
                                <span className="flex items-center gap-1"><Users className="w-3 h-3"/> {room.participant_count || 1}</span>
                              </span>
                            </div>
                            <span className="text-xs font-semibold text-zinc-400 group-hover:text-white border border-zinc-700 px-3 py-1 rounded-lg bg-zinc-900 shrink-0 ml-3">Join</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Create Room Form */
              <div className="px-5 py-4">
                {lobbyError && (
                  <div className="mb-4 text-red-400 text-sm bg-red-500/10 border border-red-500/20 py-2.5 px-4 rounded-xl">
                    {lobbyError}
                  </div>
                )}
                <label className="text-xs text-zinc-500 uppercase font-semibold tracking-wider block mb-2">Room Name</label>
                <input
                  type="text"
                  value={newRoomName}
                  onChange={(e) => {
                    setNewRoomName(e.target.value);
                    setLobbyError(null);
                  }}
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateRoomSubmit()}
                  placeholder={creatingType === 'cinema' ? 'e.g. Movie Night' : 'e.g. Lofi Beats'}
                  maxLength={30}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder-zinc-600 focus:border-zinc-600 focus:outline-none transition-colors text-sm mb-4"
                  autoFocus
                />
                
                {/* Private Toggle */}
                <div className="flex items-center gap-3 mb-6 p-1">
                  <input
                    type="checkbox"
                    id="private-room-toggle"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                    className="w-4.5 h-4.5 rounded border-zinc-800 bg-zinc-900 text-purple-500 focus:ring-0 focus:ring-offset-0 cursor-pointer accent-purple-500"
                  />
                  <label 
                    htmlFor="private-room-toggle" 
                    className="text-sm font-semibold text-zinc-300 hover:text-white cursor-pointer select-none flex items-center gap-1.5"
                  >
                    <Lock className="w-4 h-4 text-zinc-400" />
                    Private Room (Requires Passcode)
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setCreatingType(null);
                      setNewRoomName('');
                      setIsPrivate(false);
                      setLobbyError(null);
                    }}
                    className="flex-1 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-300 font-semibold text-sm transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleCreateRoomSubmit}
                    disabled={!newRoomName.trim()}
                    className="flex-1 py-2.5 rounded-xl bg-white hover:bg-zinc-100 text-black font-bold text-sm transition-colors disabled:opacity-35 disabled:cursor-not-allowed"
                  >
                    Create
                  </button>
                </div>
              </div>
            )}

            {/* Bottom Create Buttons (shown only on lobby listing view) */}
            {creatingType === null && (
              <div className="px-5 pb-5 pt-3 border-t border-zinc-900 flex flex-col gap-2">
                {activeRooms.filter(r => parseRoomDetails(r.room_id).type === 'cinema').length < 4 ? (
                  <button
                    onClick={() => {
                      setIsLobbyOpen(false);
                      router.push('/sparx/cinema');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-white font-semibold text-sm transition-colors"
                  >
                    <Tv className="w-4 h-4 text-zinc-400" />
                    Create/Join Cinema Room
                  </button>
                ) : (
                  <div className="w-full py-2.5 rounded-xl bg-zinc-900/40 border border-zinc-900 text-zinc-600 font-semibold text-sm text-center">
                    Cinema Rooms Full (4/4)
                  </div>
                )}
                {activeRooms.filter(r => parseRoomDetails(r.room_id).type === 'music').length < 4 ? (
                  <button
                    onClick={() => {
                      setIsLobbyOpen(false);
                      router.push('/sparx/music');
                    }}
                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:border-zinc-700 text-white font-semibold text-sm transition-colors"
                  >
                    <Music className="w-4 h-4 text-zinc-400" />
                    Create/Join Music Room
                  </button>
                ) : (
                  <div className="w-full py-2.5 rounded-xl bg-zinc-900/40 border border-zinc-900 text-zinc-600 font-semibold text-sm text-center">
                    Music Lounges Full (4/4)
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Passcode Prompt Overlay */}
      {showPasscodePrompt && pendingJoinRoom && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Lock className="w-5 h-5 text-purple-500" />
              Private Room
            </h3>
            <p className="text-sm text-zinc-400 mb-4">
              This room is locked. Please enter the 4-digit passcode to join.
            </p>
            
            {passcodeError && (
              <div className="mb-3 text-red-400 text-xs bg-red-500/10 border border-red-500/20 py-2 px-3 rounded-lg">
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
              className="w-full bg-black border border-zinc-800 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-widest font-mono placeholder-zinc-700 focus:border-purple-500 focus:outline-none transition-colors mb-4"
              autoFocus
            />
            
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setShowPasscodePrompt(false);
                  setPendingJoinRoom(null);
                  setEnteredPasscode('');
                  setPasscodeError(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (enteredPasscode !== pendingJoinRoom.passcode) {
                    setPasscodeError('Incorrect passcode');
                    return;
                  }
                  setShowPasscodePrompt(false);
                  setIsLobbyOpen(false);
                  const type = parseRoomDetails(pendingJoinRoom.room_id).type;
                  router.push(`/sparx/${type}?room=${encodeURIComponent(pendingJoinRoom.room_id)}`);
                }}
                disabled={enteredPasscode.length < 4}
                className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Join
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      <GlimpseUploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onUploadSuccess={() => fetchGlimpses(true)}
      />

      <AuthPromptModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </div>
  );
};
