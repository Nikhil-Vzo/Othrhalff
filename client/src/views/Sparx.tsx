import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { GlimpseCard } from '../components/GlimpseCard';
import { GlimpseUploadModal } from '../components/GlimpseUploadModal';
import { Plus, Tv, Music, X, ChevronUp, Loader2, AlertCircle, Camera, Ghost } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { AuthPromptModal } from '../components/AuthPromptModal';
import { LoadingState } from '../components/LoadingState';

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
  profiles: GlimpseProfile | null;
  glimpse_reactions: GlimpseReaction[];
}

export const Sparx: React.FC = () => {
  const { currentUser } = useAuth();
  const router = useRouter();

  // Feeds and states
  const [feedMode, setFeedMode] = useState<'campus' | 'global'>('campus');
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
  const [showTutorial, setShowTutorial] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

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
        if (oldReaction && oldReaction.glimpse_id) {
          setGlimpses(prev => prev.map(g => {
            if (g.id === oldReaction.glimpse_id) {
              return {
                ...g,
                glimpse_reactions: (g.glimpse_reactions || []).filter((r: any) => {
                  if (oldReaction.id) return r.id !== oldReaction.id;
                  return !(r.user_id === oldReaction.user_id && r.reaction_type === oldReaction.reaction_type);
                })
              };
            }
            return g;
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

  return (
    <div className="relative w-full h-[100dvh] bg-black text-white overflow-hidden select-none">
      {/* Swipe up tutorial animation styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes swipe-up {
          0% {
            transform: translateY(30px);
            opacity: 0;
          }
          50% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-30px);
            opacity: 0;
          }
        }
        .animate-swipe-up {
          animation: swipe-up 1.8s infinite ease-in-out;
        }
      ` }} />

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
        </div>
      </header>

      {/* Floating New Glimpses Alert Pill */}
      {newGlimpsesAlert && (
        <button
          onClick={() => {
            fetchGlimpses(true);
            setNewGlimpsesAlert(false);
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
            onClick={() => fetchGlimpses()}
            className="px-6 py-2.5 bg-gray-900 border border-gray-800 rounded-2xl text-xs font-bold tracking-wider uppercase hover:border-neon transition-all"
          >
            Try Again
          </button>
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
        /* Vertical Snap scrolling container */
        <div 
          onScroll={handleScroll}
          className="w-full h-full overflow-y-scroll snap-y snap-mandatory scroll-smooth scrollbar-none"
        >
          {glimpses.map((glimpse) => (
            <div key={glimpse.id} className="w-full h-full snap-start snap-always relative">
              <GlimpseCard
                glimpse={glimpse}
                currentUser={currentUser}
                initialReactions={glimpse.glimpse_reactions || []}
                onOpenLobby={() => setIsLobbyOpen(true)}
              />
            </div>
          ))}
          {isLoadingMore && (
            <div className="w-full h-full snap-start snap-always relative flex flex-col items-center justify-center bg-black gap-3 text-gray-500">
              <Loader2 className="w-8 h-8 text-neon animate-spin" />
              <span className="text-[10px] font-bold uppercase tracking-widest font-mono">Loading more moments...</span>
            </div>
          )}
        </div>
      )}

      {/* Floating Action Button (FAB) `+` */}
      <button
        onClick={handleOpenUpload}
        className="absolute bottom-24 right-4 md:bottom-8 md:right-8 z-30 p-4 bg-neon hover:bg-neon/95 text-white rounded-full shadow-[0_0_20px_rgba(255,0,127,0.5)] hover:shadow-[0_0_30px_rgba(255,0,127,0.8)] transition-all duration-300 active:scale-90"
        aria-label="Upload new glimpse"
      >
        <Plus className="w-6 h-6 stroke-[3px]" />
      </button>

      {/* Swipe Up Tutorial Overlay */}
      {showTutorial && glimpses.length > 0 && (
        <div 
          onClick={dismissTutorial}
          className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto cursor-pointer"
        >
          <div className="flex flex-col items-center gap-6 text-center px-6 animate-in fade-in duration-300">
            <div className="flex flex-col items-center text-neon">
              <ChevronUp className="w-12 h-12 stroke-[3px] animate-swipe-up filter drop-shadow-[0_0_8px_#ff007f]" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                Swipe Up
              </h3>
              <p className="text-sm text-gray-400 max-w-[260px] leading-relaxed">
                Swipe up vertically to scroll through active campus moments.
              </p>
            </div>
            <span className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] animate-pulse mt-8">
              Tap anywhere to dismiss
            </span>
          </div>
        </div>
      )}

      {/* Vibe Rooms / Duo Dates Lobby Overlay */}
      {isLobbyOpen && (
        <div 
          onClick={() => setIsLobbyOpen(false)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all duration-300"
        >
          <div 
            className="relative w-full max-w-md bg-black border border-gray-900 rounded-3xl p-6 shadow-[0_0_50px_rgba(6,182,212,0.15)] animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <button 
              onClick={() => setIsLobbyOpen(false)}
              className="absolute top-4 right-4 p-2 text-gray-500 hover:text-white rounded-full hover:bg-gray-900 transition-colors"
              aria-label="Close lobby"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-extrabold text-white mb-1 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_#06b6d4]" />
              Duo Dates Lobby
            </h3>
            <p className="text-[10px] text-gray-500 mb-6 uppercase tracking-wider font-bold">
              Co-experience spaces for matches
            </p>

            <div className="flex flex-col gap-4">
              {/* Cinema Room Card */}
              <button
                onClick={() => {
                  setIsLobbyOpen(false);
                  router.push('/sparx/cinema');
                }}
                className="group relative flex items-start gap-4 p-4 bg-gray-950/40 border border-gray-900 hover:border-cyan-500/30 rounded-2xl text-left transition-all duration-300 hover:shadow-[0_0_15px_rgba(6,182,212,0.08)] active:scale-[0.98]"
              >
                <div className="p-3 bg-cyan-500/10 text-cyan-400 rounded-xl group-hover:bg-cyan-500 group-hover:text-white transition-all duration-300">
                  <Tv className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white group-hover:text-cyan-400 transition-colors mb-1">
                    Cinema Watch Party
                  </h4>
                  <p className="text-xs text-gray-500 group-hover:text-gray-400 leading-relaxed transition-colors">
                    Stream YouTube, movies, and shows synchronously in real-time with video call integration.
                  </p>
                </div>
              </button>

              {/* Music Session Card */}
              <button
                onClick={() => {
                  setIsLobbyOpen(false);
                  router.push('/sparx/music');
                }}
                className="group relative flex items-start gap-4 p-4 bg-gray-950/40 border border-gray-900 hover:border-purple-500/30 rounded-2xl text-left transition-all duration-300 hover:shadow-[0_0_15px_rgba(168,85,247,0.08)] active:scale-[0.98]"
              >
                <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-all duration-300">
                  <Music className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-sm font-bold text-white group-hover:text-purple-400 transition-colors mb-1">
                    Music Lounge
                  </h4>
                  <p className="text-xs text-gray-500 group-hover:text-gray-400 leading-relaxed transition-colors">
                    Listen to synchronized beats and vibe together in a shared listening room.
                  </p>
                </div>
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
