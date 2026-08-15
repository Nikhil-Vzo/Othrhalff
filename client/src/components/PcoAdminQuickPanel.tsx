import React, { useState, useEffect } from 'react';
import { Shield, Play, SkipForward, PlusCircle, X, Check, Trash2, ExternalLink, RefreshCw, Volume2, AlertCircle, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { PcoSongRequest, PcoTrack, fetchPcoRequests, updatePcoSongRequestStatus } from '../services/pcoAdmin';
import { supabase } from '../lib/supabase';

interface PcoAdminQuickPanelProps {
  queue: PcoTrack[];
  onPlayNow: (track: PcoTrack, requestId?: string) => void;
  onPlayNext: (track: PcoTrack, requestId?: string) => void;
  onAddToQueue: (track: PcoTrack, requestId?: string) => void;
  onRemoveFromQueue: (trackId: string) => void;
  onSkipCurrent: () => void;
  onBroadcastBanner: (text: string) => void;
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
  onBroadcastBanner,
  currentTrack,
  adminUserId,
  isOpen: propsIsOpen,
  onToggle
}) => {
  const router = useRouter();
  const [internalIsOpen, setInternalIsOpen] = useState(false);
  const isOpen = propsIsOpen !== undefined ? propsIsOpen : internalIsOpen;
  const toggleOpen = onToggle || (() => setInternalIsOpen(prev => !prev));
  const closePanel = () => {
    if (onToggle && isOpen) {
      onToggle();
    } else {
      setInternalIsOpen(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'requests' | 'queue' | 'tools'>('requests');
  const [pendingRequests, setPendingRequests] = useState<PcoSongRequest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [announcementText, setAnnouncementText] = useState('');

  const loadRequests = async () => {
    setIsLoading(true);
    const data = await fetchPcoRequests('pending', 30);
    setPendingRequests(data);
    setIsLoading(false);
  };

  useEffect(() => {
    loadRequests();

    if (!supabase) return;

    // Listen for postgres changes on pco_song_requests table
    const dbChannel = supabase
      .channel('pco_quick_panel_requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pco_song_requests' },
        () => {
          loadRequests();
        }
      )
      .subscribe();

    // Listen for broadcast requests in real-time
    const liveChannel = supabase.channel('pco_quick_panel_broadcasts')
      .on('broadcast', { event: 'PCO_SONG_REQUEST' }, () => {
        loadRequests();
      })
      .on('broadcast', { event: 'PCO_REQUEST_NOTIFICATION' }, () => {
        loadRequests();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(dbChannel);
      supabase.removeChannel(liveChannel);
    };
  }, []);

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
  };

  const handleDecline = (reqId: string) => {
    updatePcoSongRequestStatus(reqId, 'declined', adminUserId);
    setPendingRequests(prev => prev.filter(r => r.id !== reqId));
  };

  const handleSendAnnouncement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!announcementText.trim()) return;
    onBroadcastBanner(`📢 ${announcementText.trim()}`);
    setAnnouncementText('');
  };

  return (
    <>
      {/* Floating Launcher Trigger (Desktop only - on mobile it's mounted in the header) */}
      <div className="hidden md:block fixed top-20 right-8 z-40">
        <button
          onClick={toggleOpen}
          className="relative p-3 bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600 rounded-full shadow-[0_0_20px_rgba(217,70,239,0.5)] hover:shadow-[0_0_30px_rgba(217,70,239,0.8)] hover:scale-105 active:scale-95 transition-all text-white border border-white/20 flex items-center justify-center group cursor-pointer"
          title="Admin DJ Quick Panel"
        >
          <Shield className="w-5 h-5 group-hover:rotate-12 transition-transform" />
          {pendingRequests.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-pink-500 border-2 border-black text-[10px] font-black rounded-full flex items-center justify-center animate-pulse">
              {pendingRequests.length}
            </span>
          )}
        </button>
      </div>

      {/* Floating Modal Panel */}
      {isOpen && (
        <div className="fixed top-24 right-3 sm:right-8 z-50 w-96 max-w-[calc(100vw-1.5rem)] bg-[#0c0915]/95 backdrop-blur-2xl border border-purple-500/30 rounded-3xl shadow-[0_15px_50px_rgba(0,0,0,0.8)] overflow-hidden flex flex-col animate-fade-in-down max-h-[75vh]">
          {/* Header */}
          <div className="p-4 bg-gradient-to-r from-purple-950/80 to-pink-950/80 border-b border-purple-500/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 bg-purple-500/20 rounded-lg border border-purple-500/30">
                <Shield className="w-4 h-4 text-purple-300" />
              </div>
              <div>
                <h3 className="text-white text-sm font-black flex items-center gap-1.5">
                  Admin DJ Control
                  <span className="text-[9px] bg-purple-500/30 text-purple-300 px-1.5 py-0.5 rounded font-mono font-bold">LIVE</span>
                </h3>
                <p className="text-[10px] text-purple-300/80">Campus PCO Radio Host</p>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => router.push('/sparx/music/admin')}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-purple-300 hover:text-white transition-colors"
                title="Open Full Dashboard"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
              <button
                onClick={closePanel}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex border-b border-white/10 bg-black/40 text-xs font-bold">
            <button
              onClick={() => setActiveTab('requests')}
              className={`flex-1 py-2.5 px-3 text-center transition-colors relative flex items-center justify-center gap-1.5 ${
                activeTab === 'requests'
                  ? 'text-pink-400 bg-purple-500/10 border-b-2 border-pink-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>Requests</span>
              {pendingRequests.length > 0 && (
                <span className="px-1.5 py-0.2 bg-pink-500 text-white rounded-full text-[9px] font-black">
                  {pendingRequests.length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('queue')}
              className={`flex-1 py-2.5 px-3 text-center transition-colors relative flex items-center justify-center gap-1.5 ${
                activeTab === 'queue'
                  ? 'text-purple-400 bg-purple-500/10 border-b-2 border-purple-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>Queue ({queue.length})</span>
            </button>
            <button
              onClick={() => setActiveTab('tools')}
              className={`flex-1 py-2.5 px-3 text-center transition-colors relative ${
                activeTab === 'tools'
                  ? 'text-indigo-400 bg-purple-500/10 border-b-2 border-indigo-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <span>DJ Tools</span>
            </button>
          </div>

          {/* Content Body */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar min-h-[220px] max-h-[380px]">
            {activeTab === 'requests' && (
              <>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Pending Song Requests
                  </span>
                  <button
                    onClick={loadRequests}
                    className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} /> Refresh
                  </button>
                </div>

                {pendingRequests.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-xs">
                    <Sparkles className="w-6 h-6 mx-auto mb-2 text-purple-400/50" />
                    No pending song requests. All caught up!
                  </div>
                ) : (
                  pendingRequests.map(req => (
                    <div
                      key={req.id}
                      className="bg-white/5 hover:bg-purple-950/30 p-2.5 rounded-2xl border border-white/5 hover:border-purple-500/30 transition-all flex flex-col gap-2"
                    >
                      <div className="flex items-center gap-2.5">
                        <img
                          src={req.track_image || 'https://c.saavncdn.com/815/Bhediya-Hindi-2023-20230613054804-500x500.jpg'}
                          alt={req.track_name}
                          className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{req.track_name}</h4>
                          <p className="text-[10px] text-gray-400 truncate">{req.track_artist || 'Artist'}</p>
                          <p className="text-[9px] text-pink-400 font-medium">By: {req.requester_name}</p>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-1.5 justify-end pt-1 border-t border-white/5">
                        <button
                          onClick={() => handleApprovePlayNow(req)}
                          className="px-2 py-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm active:scale-95"
                          title="Play Immediately"
                        >
                          <Play className="w-2.5 h-2.5 fill-current" /> Play Now
                        </button>
                        <button
                          onClick={() => handleApprovePlayNext(req)}
                          className="px-2 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-[9px] font-black uppercase tracking-wider flex items-center gap-1 shadow-sm active:scale-95"
                          title="Play After Current Song"
                        >
                          <SkipForward className="w-2.5 h-2.5 fill-current" /> Play Next
                        </button>
                        <button
                          onClick={() => handleDecline(req.id)}
                          className="p-1 bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-lg text-[10px] transition-colors"
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

            {activeTab === 'queue' && (
              <>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">
                    Upcoming Tracks in Queue
                  </span>
                  {queue.length > 0 && (
                    <button
                      onClick={onSkipCurrent}
                      className="text-[10px] text-pink-400 hover:text-pink-300 font-bold flex items-center gap-1"
                    >
                      <SkipForward className="w-3 h-3" /> Skip to Next
                    </button>
                  )}
                </div>

                {queue.length === 0 ? (
                  <div className="py-8 text-center text-gray-500 text-xs">
                    Queue is empty. Automatic Campus PCO playlist will play.
                  </div>
                ) : (
                  queue.map((track, idx) => (
                    <div
                      key={`${track.id}-${idx}`}
                      className="bg-white/5 p-2 rounded-xl border border-white/5 flex items-center gap-2.5 justify-between group"
                    >
                      <span className="text-xs font-mono text-purple-400 font-bold w-4 text-center">
                        {idx + 1}
                      </span>
                      <img
                        src={track.image}
                        alt={track.song}
                        className="w-8 h-8 rounded-lg object-cover shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-semibold text-white truncate">{track.song}</h4>
                        <p className="text-[10px] text-gray-400 truncate">{track.singers}</p>
                      </div>
                      <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100">
                        <button
                          onClick={() => onPlayNow(track)}
                          className="p-1 text-purple-300 hover:text-white hover:bg-purple-500/20 rounded"
                          title="Play Immediately"
                        >
                          <Play className="w-3 h-3 fill-current" />
                        </button>
                        <button
                          onClick={() => onRemoveFromQueue(track.id)}
                          className="p-1 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded"
                          title="Remove from Queue"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </>
            )}

            {activeTab === 'tools' && (
              <div className="space-y-4 py-1">
                {/* Now Playing Banner */}
                {currentTrack && (
                  <div className="p-3 bg-purple-950/40 border border-purple-500/30 rounded-2xl">
                    <span className="text-[9px] uppercase font-mono text-purple-400 font-bold tracking-wider">
                      Currently On Air
                    </span>
                    <div className="flex items-center gap-2.5 mt-1.5">
                      <img
                        src={currentTrack.image}
                        alt={currentTrack.song}
                        className="w-10 h-10 rounded-xl object-cover border border-white/10"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{currentTrack.song}</h4>
                        <p className="text-[10px] text-gray-400 truncate">{currentTrack.singers}</p>
                      </div>
                      <button
                        onClick={onSkipCurrent}
                        className="px-2.5 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-[10px] font-bold flex items-center gap-1 transition-all"
                      >
                        <SkipForward className="w-3 h-3" /> Skip
                      </button>
                    </div>
                  </div>
                )}

                {/* Broadcast Sticky Announcement */}
                <form onSubmit={handleSendAnnouncement} className="space-y-2">
                  <label className="text-[11px] font-semibold text-gray-300 block">
                    Broadcast Sticky Banner (15s)
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={announcementText}
                      onChange={e => setAnnouncementText(e.target.value)}
                      placeholder="e.g. Next up: Fresh 2024 Bollywood hits..."
                      className="flex-1 bg-gray-900 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-purple-500"
                    />
                    <button
                      type="submit"
                      disabled={!announcementText.trim()}
                      className="px-3 py-1.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white rounded-xl text-xs font-bold transition-all shadow-md"
                    >
                      Post
                    </button>
                  </div>
                </form>

                {/* Quick Dashboard Link */}
                <div className="pt-2 border-t border-white/10">
                  <button
                    onClick={() => router.push('/sparx/music/admin')}
                    className="w-full py-2 bg-gradient-to-r from-purple-900/60 to-pink-900/60 hover:from-purple-800/80 hover:to-pink-800/80 text-purple-200 border border-purple-500/30 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    Open Full Admin Analytics & Dashboard
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
