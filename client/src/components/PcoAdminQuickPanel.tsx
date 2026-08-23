import React, { useState, useEffect } from 'react';
import { Play, SkipForward, X, Trash2, RefreshCw, Sparkles, Search, Radio, Music } from 'lucide-react';
import { PcoSongRequest, PcoTrack, fetchPcoRequests, updatePcoSongRequestStatus } from '../services/pcoAdmin';
import { curatedRomanticTracks } from '../data/pcoRomanticTracks';
import { supabase } from '../lib/supabase';

interface PcoAdminQuickPanelProps {
  queue: PcoTrack[];
  onPlayNow: (track: PcoTrack, requestId?: string) => void;
  onPlayNext: (track: PcoTrack, requestId?: string) => void;
  onAddToQueue: (track: PcoTrack, requestId?: string) => void;
  onRemoveFromQueue: (trackId: string) => void;
  onSkipCurrent: () => void;
  onBroadcastBanner?: (text: string) => void;
  onReturnToAuto?: () => void;
  mode?: 'auto' | 'manual';
  currentTrack: PcoTrack | null;
  adminUserId?: string;
  isOpen?: boolean;
  onToggle?: () => void;
}

export const PcoAdminQuickPanel: React.FC<PcoAdminQuickPanelProps> = ({
  queue,
  onPlayNow,
  onPlayNext,
  onAddToQueue,
  onRemoveFromQueue,
  onSkipCurrent,
  onReturnToAuto,
  mode = 'auto',
  currentTrack,
  adminUserId,
  isOpen: propsIsOpen,
  onToggle
}) => {
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = propsIsOpen !== undefined ? propsIsOpen : internalIsOpen;
  const closePanel = () => {
    if (onToggle) {
      onToggle();
    } else {
      setInternalIsOpen(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'requests' | 'queue' | 'search'>('requests');
  const [pendingRequests, setPendingRequests] = useState<PcoSongRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const showFeedback = (msg: string) => {
    setActionFeedback(msg);
    setTimeout(() => setActionFeedback(null), 2000);
  };

  const loadRequests = async () => {
    setIsLoading(true);
    const data = await fetchPcoRequests('pending', 30);
    setPendingRequests(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadRequests();

    if (!supabase) return;

    // Listen for postgres changes and broadcast notifications on dedicated admin channel
    const dbChannel = supabase
      .channel('pco_quick_panel_requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pco_song_requests' },
        () => {
          loadRequests();
        }
      )
      .on('broadcast', { event: 'PCO_REQUEST_NOTIFICATION' }, (payload: any) => {
        loadRequests();
        if (payload?.payload?.track) {
          showFeedback(`📨 Request: "${payload.payload.track.song}"`);
        }
      })
      .on('broadcast', { event: 'PCO_SONG_REQUEST' }, () => {
        loadRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dbChannel);
    };
  }, []);

  const [searchResults, setSearchResults] = useState<PcoTrack[]>(curatedRomanticTracks.slice(0, 15));
  const [isSearching, setIsSearching] = useState(false);

  // Live online search + local curated search
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(curatedRomanticTracks.slice(0, 15));
      setIsSearching(false);
      return;
    }

    const q = searchQuery.toLowerCase().trim();
    const localFiltered = curatedRomanticTracks.filter(
      t => t.song.toLowerCase().includes(q) || t.singers.toLowerCase().includes(q)
    );

    if (localFiltered.length > 0) {
      setSearchResults(localFiltered);
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://saavnapi-nine.vercel.app/result/?query=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          const apiTracks: PcoTrack[] = data
            .slice(0, 15)
            .map((x: any) => ({
              id: String(x.id || `api_${Math.random()}`),
              song: (x.song || x.title || 'Untitled').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&'),
              singers: (x.singers || x.primary_artists || x.artist || 'Unknown').replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&'),
              image: x.image || 'https://c.saavncdn.com/221/Soulful-Hits-Hindi-2026-20260529163806-500x500.jpg',
              media_url: x.media_url || x.media_preview_url || '',
              duration: String(x.duration || 240)
            }))
            .filter((x: PcoTrack) => x.media_url);

          if (apiTracks.length > 0) {
            setSearchResults(apiTracks);
          }
        }
      } catch (err) {
        console.warn('[PCO Quick Panel] Search API fallback error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleApprovePlayNow = (req: PcoSongRequest) => {
    updatePcoSongRequestStatus(req.id, 'approved', adminUserId);
    onPlayNow({
      id: req.track_id,
      song: req.track_name,
      singers: req.track_artist || 'Campus Request',
      image: req.track_image || 'https://c.saavncdn.com/815/Bhediya-Hindi-2023-20230613054804-500x500.jpg',
      media_url: req.track_url || '',
      duration: req.track_duration || '240'
    }, req.id);
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
    showFeedback(`🔥 Playing "${req.track_name}"`);
  };

  const handleApprovePlayNext = (req: PcoSongRequest) => {
    updatePcoSongRequestStatus(req.id, 'approved', adminUserId);
    onPlayNext({
      id: req.track_id,
      song: req.track_name,
      singers: req.track_artist || 'Campus Request',
      image: req.track_image || 'https://c.saavncdn.com/815/Bhediya-Hindi-2023-20230613054804-500x500.jpg',
      media_url: req.track_url || '',
      duration: req.track_duration || '240'
    }, req.id);
    setPendingRequests(prev => prev.filter(r => r.id !== req.id));
    showFeedback(`⏭️ Queued Next: "${req.track_name}"`);
  };

  const handleDecline = (reqId: string) => {
    updatePcoSongRequestStatus(reqId, 'declined', adminUserId);
    setPendingRequests(prev => prev.filter(r => r.id !== reqId));
    showFeedback(`Declined`);
  };

  if (!isOpen) return null;

  return (
    <div
      onClick={e => e.stopPropagation()}
      className="fixed top-16 right-2 sm:right-6 z-50 w-88 max-w-[calc(100vw-1rem)] bg-[#120b1e]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-down max-h-[80vh]"
    >
      {/* 1. Ultra-clean Minimalist Top Tab Bar */}
      <div className="flex items-center justify-between border-b border-white/10 px-2 bg-black/40">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveTab('requests')}
            className={`py-2.5 px-3 text-xs font-semibold transition-all relative flex items-center gap-1.5 ${
              activeTab === 'requests'
                ? 'text-pink-400 border-b-2 border-pink-500'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>Requests</span>
            {pendingRequests.length > 0 && (
              <span className="px-1.5 py-0.2 bg-pink-500 text-white rounded-full text-[9px] font-bold">
                {pendingRequests.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('queue')}
            className={`py-2.5 px-3 text-xs font-semibold transition-all relative flex items-center gap-1.5 ${
              activeTab === 'queue'
                ? 'text-purple-400 border-b-2 border-purple-500'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>Queue</span>
            {queue.length > 0 && (
              <span className="px-1.5 py-0.2 bg-purple-500 text-white rounded-full text-[9px] font-bold">
                {queue.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`py-2.5 px-3 text-xs font-semibold transition-all relative ${
              activeTab === 'search'
                ? 'text-white border-b-2 border-white'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <span>Search</span>
          </button>
        </div>

        <button
          onClick={closePanel}
          className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Custom Override Status Pill (Only shows if a custom song is actively overriding radio) */}
      {mode === 'manual' && (
        <div className="px-3 py-1.5 bg-pink-950/40 border-b border-pink-500/20 flex items-center justify-between text-[10px]">
          <span className="text-pink-300 font-medium truncate flex items-center gap-1">
            🎧 Custom song on air
          </span>
          {onReturnToAuto && (
            <button
              onClick={() => {
                onReturnToAuto();
                showFeedback('Resumed 24/7 Radio');
              }}
              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-md font-bold uppercase transition-all flex items-center gap-1 active:scale-95"
            >
              <Radio className="w-2.5 h-2.5" />
              <span>Resume Radio</span>
            </button>
          )}
        </div>
      )}

      {/* 3. Feedback Toast */}
      {actionFeedback && (
        <div className="bg-pink-600 text-white text-[10px] font-bold py-1 px-3 text-center animate-in fade-in duration-150">
          {actionFeedback}
        </div>
      )}

      {/* 4. Content Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar max-h-[360px]">
        {/* TAB 1: REQUESTS */}
        {activeTab === 'requests' && (
          <>
            <div className="flex items-center justify-between pb-1">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Pending Requests ({pendingRequests.length})
              </span>
              <button
                onClick={loadRequests}
                className="text-[10px] text-gray-400 hover:text-white flex items-center gap-1"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
              </button>
            </div>

            {pendingRequests.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs">
                <Sparkles className="w-5 h-5 mx-auto mb-1.5 text-purple-400/50" />
                No song requests pending
              </div>
            ) : (
              pendingRequests.map(req => (
                <div
                  key={req.id}
                  className="bg-white/5 hover:bg-white/10 p-2 rounded-xl border border-white/5 transition-all flex flex-col gap-1.5"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={req.track_image || 'https://c.saavncdn.com/815/Bhediya-Hindi-2023-20230613054804-500x500.jpg'}
                      alt={req.track_name}
                      className="w-8 h-8 rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-white truncate">{req.track_name}</h4>
                      <p className="text-[10px] text-gray-400 truncate">{req.track_artist || req.requester_name}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 justify-end">
                    <button
                      onClick={() => handleApprovePlayNow(req)}
                      className="px-2 py-0.5 bg-pink-600 hover:bg-pink-500 text-white rounded-md text-[9px] font-bold uppercase flex items-center gap-1"
                    >
                      <Play className="w-2.5 h-2.5 fill-current" /> Play
                    </button>
                    <button
                      onClick={() => handleApprovePlayNext(req)}
                      className="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-[9px] font-bold uppercase flex items-center gap-1"
                    >
                      <SkipForward className="w-2.5 h-2.5 fill-current" /> Next
                    </button>
                    <button
                      onClick={() => handleDecline(req.id)}
                      className="p-1 text-gray-400 hover:text-red-400 rounded-md"
                      title="Decline"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* TAB 2: QUEUE */}
        {activeTab === 'queue' && (
          <>
            <div className="flex items-center justify-between pb-1">
              <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">
                Upcoming Queue ({queue.length})
              </span>
              {queue.length > 0 && (
                <button
                  onClick={() => {
                    onSkipCurrent();
                    showFeedback('Skipped');
                  }}
                  className="text-[10px] text-pink-400 hover:text-pink-300 font-medium flex items-center gap-1"
                >
                  <SkipForward className="w-3 h-3" /> Skip
                </button>
              )}
            </div>

            {queue.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-xs flex flex-col items-center gap-1">
                <Music className="w-5 h-5 text-purple-400/40" />
                <p>Queue is empty</p>
                <p className="text-[10px] text-gray-500">24/7 radio plays continuously.</p>
              </div>
            ) : (
              queue.map((track, idx) => (
                <div
                  key={`${track.id}-${idx}`}
                  className="bg-white/5 p-2 rounded-xl flex items-center gap-2 justify-between"
                >
                  <span className="text-[10px] font-mono text-purple-400 font-bold w-3 text-center">
                    {idx + 1}
                  </span>
                  <img
                    src={track.image}
                    alt={track.song}
                    className="w-7 h-7 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-white truncate">{track.song}</h4>
                    <p className="text-[10px] text-gray-400 truncate">{track.singers}</p>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        onPlayNow(track);
                        showFeedback(`Playing: "${track.song}"`);
                      }}
                      className="p-1 text-purple-300 hover:text-white"
                      title="Play Now"
                    >
                      <Play className="w-3 h-3 fill-current" />
                    </button>
                    <button
                      onClick={() => {
                        onRemoveFromQueue(track.id);
                        showFeedback(`Removed`);
                      }}
                      className="p-1 text-gray-400 hover:text-red-400"
                      title="Remove"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* TAB 3: SEARCH */}
        {activeTab === 'search' && (
          <div className="space-y-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search song or artist..."
                className="w-full bg-black/60 border border-white/10 rounded-xl py-1.5 pl-8 pr-7 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
              />
              {isSearching && (
                <div className="absolute right-2.5 top-1/2 -translate-y-1/2">
                  <RefreshCw className="w-3 h-3 text-purple-400 animate-spin" />
                </div>
              )}
            </div>

            <div className="space-y-1 max-h-[250px] overflow-y-auto custom-scrollbar">
              {searchResults.map(track => (
                <div
                  key={track.id}
                  className="bg-white/5 hover:bg-white/10 p-1.5 rounded-xl flex items-center justify-between gap-2"
                >
                  <img
                    src={track.image}
                    alt={track.song}
                    className="w-7 h-7 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-medium text-white truncate">{track.song}</h4>
                    <p className="text-[10px] text-gray-400 truncate">{track.singers}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        onPlayNow(track);
                        showFeedback(`Playing: "${track.song}"`);
                      }}
                      className="px-2 py-0.5 bg-pink-600 hover:bg-pink-500 text-white rounded-md text-[9px] font-bold uppercase active:scale-95"
                    >
                      Play
                    </button>
                    <button
                      onClick={() => {
                        onPlayNext(track);
                        showFeedback(`Next: "${track.song}"`);
                      }}
                      className="px-2 py-0.5 bg-purple-600 hover:bg-purple-500 text-white rounded-md text-[9px] font-bold uppercase active:scale-95"
                    >
                      Next
                    </button>
                    <button
                      onClick={() => {
                        onAddToQueue(track);
                        showFeedback(`Added to Queue`);
                      }}
                      className="px-1.5 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded-md text-[9px] font-medium active:scale-95"
                    >
                      +Q
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
