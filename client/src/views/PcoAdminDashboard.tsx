"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Shield, 
  Play, 
  SkipForward, 
  PlusCircle, 
  X, 
  Check, 
  Clock, 
  Music, 
  Radio, 
  Users, 
  TrendingUp, 
  RefreshCw, 
  ArrowLeft, 
  Search, 
  Volume2, 
  AlertCircle, 
  Sparkles,
  ExternalLink,
  Trash2,
  Calendar,
  UserCheck,
  ChevronUp,
  ChevronDown,
  Flame,
  ListMusic,
  Send,
  Sliders,
  Copy,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { 
  PcoSongRequest, 
  PcoTrack, 
  PcoLiveSchedule,
  checkIsPcoAdmin, 
  fetchPcoRequests, 
  updatePcoSongRequestStatus, 
  getPcoAnalytics,
  fetchAdminUsers,
  addAdminUser,
  removeAdminUser,
  AdminUserRecord,
  getPcoLiveSchedule,
  broadcastPcoAction
} from '../services/pcoAdmin';

export const PcoAdminDashboard: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();
  
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [activeTab, setActiveTab] = useState<'live' | 'requests' | 'schedule' | 'history' | 'analytics' | 'admins'>('live');
  
  // Data state
  const [requests, setRequests] = useState<PcoSongRequest[]>([]);
  const [adminUsersList, setAdminUsersList] = useState<AdminUserRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [listenerCount, setListenerCount] = useState<number>(1);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'declined' | 'played'>('all');
  
  // Live Schedule & Track State
  const [scheduleState, setScheduleState] = useState<PcoLiveSchedule | null>(null);
  const [customQueue, setCustomQueue] = useState<PcoTrack[]>([]);
  const [overriddenCurrentTrack, setOverriddenCurrentTrack] = useState<PcoTrack | null>(null);

  // Global song search in admin
  const [globalSearchQuery, setGlobalSearchQuery] = useState('');
  const [globalSearchResults, setGlobalSearchResults] = useState<PcoTrack[]>([]);
  const [isSearchingSongs, setIsSearchingSongs] = useState(false);

  // Admin Team form
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'pco_admin' | 'super_admin'>('pco_admin');
  const [adminActionMsg, setAdminActionMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [isSubmittingAdmin, setIsSubmittingAdmin] = useState(false);

  // DJ Broadcast
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastFeedback, setBroadcastFeedback] = useState<string | null>(null);
  const [showSqlTip, setShowSqlTip] = useState(false);
  const [sqlCopied, setSqlCopied] = useState(false);

  const [analyticsData, setAnalyticsData] = useState<{
    totalRequests: number;
    pendingRequests: number;
    todayRequests: number;
    topTracks: { name: string; artist: string; count: number; image?: string }[];
  }>({
    totalRequests: 0,
    pendingRequests: 0,
    todayRequests: 0,
    topTracks: []
  });

  // 1. Verify Admin Status
  useEffect(() => {
    let isMounted = true;
    const verify = async () => {
      let authEmail: string | null = null;
      if (supabase) {
        try {
          const { data } = await supabase.auth.getUser();
          authEmail = data?.user?.email || null;
        } catch (_) {}
      }

      const hasAdmin = await checkIsPcoAdmin(currentUser, authEmail);
      if (isMounted) {
        setIsAdmin(hasAdmin);
      }
    };

    verify();
    return () => { isMounted = false; };
  }, [currentUser]);

  // 2. Refresh live scheduled song timer
  useEffect(() => {
    const updateSchedule = () => {
      const sched = getPcoLiveSchedule();
      setScheduleState(sched);
    };
    updateSchedule();
    const interval = setInterval(updateSchedule, 1000);
    return () => clearInterval(interval);
  }, []);

  // 3. Fetch Requests, Analytics & Admin Team
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [allReqs, analytics, admins] = await Promise.all([
        fetchPcoRequests('all', 100),
        getPcoAnalytics(),
        fetchAdminUsers()
      ]);
      setRequests(allReqs);
      setAnalyticsData(analytics);
      setAdminUsersList(admins);
    } catch (err) {
      console.warn('[PCO Admin] Data loading notice:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isAdmin) {
      loadDashboardData();
    }
  }, [isAdmin]);

  // 4. Supabase Realtime Subscriptions
  useEffect(() => {
    if (!isAdmin || !supabase) return;

    const presenceChannel = supabase.channel('campus_pco_live_chat');
    
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        let count = 0;
        Object.values(state).forEach((p: any) => {
          count += p.length;
        });
        setListenerCount(count || 1);
      })
      .on('broadcast', { event: 'PCO_SONG_REQUEST' }, () => {
        loadDashboardData();
      })
      .on('broadcast', { event: 'PCO_PLAY_IMMEDIATELY' }, ({ payload }) => {
        if (payload?.track) {
          setOverriddenCurrentTrack(payload.track);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [isAdmin]);

  // 5. Search Songs Across Saavn
  const handleSearchSongs = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!globalSearchQuery.trim()) return;

    setIsSearchingSongs(true);
    try {
      const res = await fetch(`https://saavnapi-nine.vercel.app/result/?query=${encodeURIComponent(globalSearchQuery.trim())}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setGlobalSearchResults(data.map((t: any) => ({
            id: t.id || `search_${Math.random()}`,
            song: t.song || t.title || 'Untitled Track',
            singers: t.singers || t.artist || 'Unknown Artist',
            image: t.image || 'https://c.saavncdn.com/815/Bhediya-Hindi-2023-20230613054804-500x500.jpg',
            media_url: t.media_url || '',
            duration: t.duration || '240'
          })));
        }
      }
    } catch (err) {
      console.warn('[PCO Admin] Search error:', err);
    } finally {
      setIsSearchingSongs(false);
    }
  };

  // Skip Track Action (Works in real time for all listeners)
  const handleSkipLiveTrack = () => {
    let nextTrack: PcoTrack | null = null;
    if (customQueue.length > 0) {
      nextTrack = customQueue[0];
      setCustomQueue(prev => prev.slice(1));
    } else if (scheduleState && scheduleState.upcomingTracks.length > 0) {
      nextTrack = scheduleState.upcomingTracks[0];
    }

    if (nextTrack) {
      setOverriddenCurrentTrack(nextTrack);
      broadcastPcoAction('PCO_PLAY_IMMEDIATELY', { track: nextTrack });
    } else {
      broadcastPcoAction('PCO_ADMIN_SKIP', { user: currentUser?.realName || 'Admin DJ' });
    }

    setBroadcastFeedback('⏭️ Track skipped! Broadcasted to all active radio listeners.');
    setTimeout(() => setBroadcastFeedback(null), 4000);
  };

  // Play Track Immediately (Force Play)
  const handleForcePlayTrack = (track: PcoTrack) => {
    setOverriddenCurrentTrack(track);
    broadcastPcoAction('PCO_PLAY_IMMEDIATELY', { track, requester: 'Admin DJ' });
    setBroadcastFeedback(`🔥 Now playing "${track.song}" live on Campus PCO Radio!`);
    setTimeout(() => setBroadcastFeedback(null), 4000);
  };

  // Play Next (Add to Top of Queue)
  const handlePlayNextTrack = (track: PcoTrack) => {
    setCustomQueue(prev => [track, ...prev.filter(t => t.id !== track.id)]);
    broadcastPcoAction('PCO_PLAY_NEXT', { track, requester: 'Admin DJ' });
    setBroadcastFeedback(`⏭️ Queued "${track.song}" to play next.`);
    setTimeout(() => setBroadcastFeedback(null), 4000);
  };

  // Add to Queue
  const handleAddToQueue = (track: PcoTrack) => {
    setCustomQueue(prev => [...prev, track]);
    broadcastPcoAction('PCO_ADD_QUEUE', { track, requester: 'Admin DJ' });
    setBroadcastFeedback(`➕ Added "${track.song}" to upcoming queue.`);
    setTimeout(() => setBroadcastFeedback(null), 4000);
  };

  // Move in Queue
  const handleMoveQueueItem = (index: number, direction: 'up' | 'down') => {
    setCustomQueue(prev => {
      const copy = [...prev];
      const targetIndex = direction === 'up' ? index - 1 : index + 1;
      if (targetIndex < 0 || targetIndex >= copy.length) return prev;
      const temp = copy[index];
      copy[index] = copy[targetIndex];
      copy[targetIndex] = temp;
      return copy;
    });
  };

  // Remove from Queue
  const handleRemoveFromQueue = (index: number) => {
    setCustomQueue(prev => prev.filter((_, i) => i !== index));
  };

  // Send Broadcast Banner
  const handleSendBroadcast = (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    broadcastPcoAction('LIVE_CHAT_MSG', {
      user: '👑 Admin DJ Announcement',
      text: broadcastText.trim()
    });

    setBroadcastFeedback('📢 Announcement broadcasted to all listeners!');
    setBroadcastText('');
    setTimeout(() => setBroadcastFeedback(null), 4000);
  };

  // Add Admin
  const handleAddAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdminEmail.trim() || !newAdminEmail.includes('@')) {
      setAdminActionMsg({ text: 'Please provide a valid email address.', type: 'error' });
      return;
    }

    setIsSubmittingAdmin(true);
    setAdminActionMsg(null);

    const res = await addAdminUser(newAdminEmail.trim(), newAdminRole, currentUser?.id);
    setIsSubmittingAdmin(false);

    if (res.success) {
      setAdminActionMsg({ text: `Granted ${newAdminRole} to ${newAdminEmail}!`, type: 'success' });
      setNewAdminEmail('');
      const updatedAdmins = await fetchAdminUsers();
      setAdminUsersList(updatedAdmins);
      setTimeout(() => setAdminActionMsg(null), 5000);
    } else {
      setAdminActionMsg({ text: res.error || 'Failed to add admin', type: 'error' });
    }
  };

  // Remove Admin
  const handleRemoveAdminClick = async (email: string) => {
    if (!window.confirm(`Revoke admin privileges from ${email}?`)) return;

    const res = await removeAdminUser(email);
    if (res.success) {
      setAdminActionMsg({ text: `Revoked admin permissions from ${email}.`, type: 'success' });
      const updatedAdmins = await fetchAdminUsers();
      setAdminUsersList(updatedAdmins);
      setTimeout(() => setAdminActionMsg(null), 5000);
    } else {
      setAdminActionMsg({ text: res.error || 'Failed to remove admin', type: 'error' });
    }
  };

  // Request Actions
  const handleApprovePlayNow = async (req: PcoSongRequest) => {
    await updatePcoSongRequestStatus(req.id, 'approved', currentUser?.id);
    const track: PcoTrack = {
      id: req.track_id,
      song: req.track_name,
      singers: req.track_artist || 'Campus Request',
      image: req.track_image || 'https://c.saavncdn.com/815/Bhediya-Hindi-2023-20230613054804-500x500.jpg',
      media_url: req.track_url || '',
      duration: req.track_duration || '240'
    };
    handleForcePlayTrack(track);
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved', played_at: new Date().toISOString() } : r));
  };

  const handleApprovePlayNext = async (req: PcoSongRequest) => {
    await updatePcoSongRequestStatus(req.id, 'approved', currentUser?.id);
    const track: PcoTrack = {
      id: req.track_id,
      song: req.track_name,
      singers: req.track_artist || 'Campus Request',
      image: req.track_image || 'https://c.saavncdn.com/815/Bhediya-Hindi-2023-20230613054804-500x500.jpg',
      media_url: req.track_url || '',
      duration: req.track_duration || '240'
    };
    handlePlayNextTrack(track);
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'approved' } : r));
  };

  const handleDeclineRequest = async (req: PcoSongRequest) => {
    await updatePcoSongRequestStatus(req.id, 'declined', currentUser?.id);
    setRequests(prev => prev.map(r => r.id === req.id ? { ...r, status: 'declined' } : r));
  };

  const activePlayingTrack = overriddenCurrentTrack || scheduleState?.currentTrack;
  const pendingList = requests.filter(r => r.status === 'pending');
  const filteredRequests = requests.filter(r => {
    const matchesSearch = 
      r.track_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (r.track_artist && r.track_artist.toLowerCase().includes(searchFilter.toLowerCase())) ||
      r.requester_name.toLowerCase().includes(searchFilter.toLowerCase());
    const matchesStatus = statusFilter === 'all' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Access Denied Screen
  if (isAdmin === false) {
    return (
      <div className="min-h-screen bg-[#07050d] text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-2xl shadow-2xl space-y-6">
          <div className="w-16 h-16 bg-red-500/20 border border-red-500/40 rounded-3xl flex items-center justify-center mx-auto text-red-400">
            <Shield className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white mb-2">Access Restricted</h2>
            <p className="text-gray-400 text-xs leading-relaxed">
              You are not registered as an authorized Campus PCO DJ Admin. Please contact an owner or super administrator to request DJ privileges.
            </p>
          </div>
          <button
            onClick={() => router.push('/sparx')}
            className="w-full py-3.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-2xl text-xs transition-all shadow-lg"
          >
            Return to Sparx Hub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="w-full h-full min-h-screen bg-[#07050d] text-white flex flex-col overflow-y-auto custom-scrollbar selection:bg-pink-500 selection:text-white"
      style={{ WebkitOverflowScrolling: 'touch', overscrollBehaviorY: 'contain' }}
    >
      
      {/* Top Glassmorphic Navigation Bar */}
      <header className="sticky top-0 z-50 bg-[#07050d]/80 backdrop-blur-2xl border-b border-white/10 px-4 md:px-8 py-3.5 flex flex-wrap items-center justify-between gap-3 shadow-2xl">
        <div className="flex items-center gap-3">
          {/* Back button options */}
          <button
            onClick={() => router.push('/sparx/music?room=Campus_PCO_247')}
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-purple-900/60 to-pink-900/60 hover:from-purple-800 hover:to-pink-800 border border-pink-500/30 rounded-xl text-xs font-bold text-white transition-all shadow-sm active:scale-95"
            title="Return to live radio stream"
          >
            <ArrowLeft className="w-4 h-4 text-pink-400" />
            <span className="hidden sm:inline">Back to Radio Room</span>
            <span className="sm:hidden">Radio</span>
          </button>

          <button
            onClick={() => router.push('/sparx')}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-xs font-semibold text-gray-300 hover:text-white transition-all"
            title="Go to Sparx Hub"
          >
            Sparx Hub
          </button>

          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <h1 className="text-base sm:text-lg font-black text-white flex items-center gap-1.5">
              Campus PCO <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-400 to-purple-400">DJ Center</span>
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Active Listeners Live Badge */}
          <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-black shadow-[0_0_15px_rgba(16,185,129,0.15)]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>{listenerCount} Listening</span>
          </div>

          <button
            onClick={loadDashboardData}
            className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-gray-300 hover:text-white transition-colors border border-white/10"
            title="Refresh Data"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-pink-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* Main Scrollable Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-8 py-6 space-y-6 pb-28">

        {/* Live On-Air Player Deck Banner */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-950/70 via-black/80 to-pink-950/60 border border-pink-500/30 p-5 md:p-6 backdrop-blur-2xl shadow-[0_0_50px_rgba(236,72,153,0.15)]">
          <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-pink-500/10 to-purple-600/10 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
            {/* Track Info */}
            <div className="flex items-center gap-4 sm:gap-5">
              <div className="relative group shrink-0">
                <img
                  src={activePlayingTrack?.image || 'https://c.saavncdn.com/815/Bhediya-Hindi-2023-20230613054804-500x500.jpg'}
                  alt={activePlayingTrack?.song || 'Live Song'}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-pink-500/40 shadow-xl"
                />
                <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <Music className="w-6 h-6 text-pink-400 animate-bounce" />
                </div>
              </div>

              <div className="space-y-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full bg-pink-500 text-white text-[9px] font-black uppercase tracking-wider flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" /> Live On Air
                  </span>
                  {overriddenCurrentTrack && (
                    <span className="px-2 py-0.5 rounded-full bg-purple-500/30 border border-purple-500/40 text-purple-300 text-[9px] font-bold">
                      Admin Force Played
                    </span>
                  )}
                </div>
                <h2 className="text-base sm:text-xl font-black text-white truncate max-w-xs sm:max-w-md md:max-w-lg">
                  {activePlayingTrack?.song || 'Awaiting Playlist Sync...'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-300 font-medium truncate max-w-xs sm:max-w-md">
                  {activePlayingTrack?.singers || '24/7 Bollywood Romantic Hits'}
                </p>

                {/* Animated Equalizer Waveform */}
                <div className="flex items-center gap-1 pt-1">
                  <span className="w-1 h-3 bg-pink-400 rounded-full animate-pulse" />
                  <span className="w-1 h-5 bg-purple-400 rounded-full animate-bounce" />
                  <span className="w-1 h-2 bg-pink-400 rounded-full animate-pulse" />
                  <span className="w-1 h-4 bg-purple-400 rounded-full animate-bounce" />
                  <span className="text-[10px] font-mono text-pink-300 ml-2">
                    {scheduleState ? `${Math.floor(scheduleState.offsetSec / 60)}:${(scheduleState.offsetSec % 60).toString().padStart(2, '0')} / ${Math.floor(scheduleState.durationSec / 60)}:${(scheduleState.durationSec % 60).toString().padStart(2, '0')}` : 'Broadcasting Live'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick DJ Live Actions */}
            <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
              <button
                onClick={handleSkipLiveTrack}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold text-xs transition-all shadow-lg active:scale-95"
              >
                <SkipForward className="w-4 h-4 fill-white" />
                <span>Skip Track (All Listeners)</span>
              </button>

              <button
                onClick={() => setActiveTab('schedule')}
                className="flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/15 text-white font-semibold text-xs transition-all"
              >
                <ListMusic className="w-4 h-4 text-pink-400" />
                <span>Manage Playlist Queue</span>
              </button>
            </div>
          </div>

          {/* Sticky DJ Announcement Bar */}
          <form onSubmit={handleSendBroadcast} className="mt-5 pt-4 border-t border-white/10 flex flex-col sm:flex-row items-center gap-3">
            <div className="flex items-center gap-2 shrink-0 self-start sm:self-center">
              <Sparkles className="w-4 h-4 text-pink-400" />
              <span className="text-xs font-black uppercase text-pink-300">Live DJ Sticky Banner:</span>
            </div>
            <input
              type="text"
              value={broadcastText}
              onChange={e => setBroadcastText(e.target.value)}
              placeholder="Send sticky text banner to all radio listeners (e.g. 'Dedicate next track to CSE Batch!')..."
              className="flex-1 w-full bg-black/50 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-gray-500 focus:outline-none focus:border-pink-500"
            />
            <button
              type="submit"
              disabled={!broadcastText.trim()}
              className="w-full sm:w-auto px-5 py-2.5 bg-pink-600 hover:bg-pink-500 disabled:opacity-40 text-white font-bold rounded-xl text-xs transition-all shadow-md shrink-0 flex items-center justify-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Broadcast</span>
            </button>
          </form>

          {broadcastFeedback && (
            <p className="text-xs text-emerald-400 font-bold mt-2.5 flex items-center gap-1.5 animate-fade-in">
              <Check className="w-3.5 h-3.5" /> {broadcastFeedback}
            </p>
          )}
        </section>

        {/* 4 Metric Stats Cards */}
        <section className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-1">
              <span>Active Listeners</span>
              <Users className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-white flex items-center gap-2">
              {listenerCount}
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Real-time room presence</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-1">
              <span>Pending Requests</span>
              <Clock className="w-4 h-4 text-pink-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-pink-400">
              {pendingList.length}
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Awaiting DJ approval</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-1">
              <span>Today's Requests</span>
              <Calendar className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-purple-300">
              {analyticsData.todayRequests || requests.length}
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Submitted in last 24h</p>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-xl">
            <div className="flex items-center justify-between text-gray-400 text-xs font-medium mb-1">
              <span>Admin Team</span>
              <UserCheck className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl md:text-3xl font-black text-blue-300">
              {adminUsersList.length || 4}
            </div>
            <p className="text-[10px] text-gray-500 mt-1">Authorized moderators</p>
          </div>
        </section>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto custom-scrollbar pb-2 border-b border-white/10">
          <button
            onClick={() => setActiveTab('live')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'live'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-pink-300" />
            <span>Live DJ Tools & Search</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 ${
              activeTab === 'requests'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Pending Requests</span>
            {pendingList.length > 0 && (
              <span className="px-1.5 py-0.2 bg-pink-500 text-white text-[10px] font-black rounded-full">
                {pendingList.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'schedule'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <ListMusic className="w-3.5 h-3.5" />
            <span>Playlist Queue & Schedule ({scheduleState?.upcomingTracks.length || 20})</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'history'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>History & Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('admins')}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
              activeTab === 'admins'
                ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow-lg'
                : 'bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Admin Team</span>
          </button>
        </div>

        {/* TAB 1: Live DJ Search & Quick Force Play */}
        {activeTab === 'live' && (
          <div className="space-y-6">
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <Search className="w-5 h-5 text-pink-400" />
                    Instant Song Search & Override
                  </h3>
                  <p className="text-xs text-gray-400">Search millions of Hindi/Bollywood songs and force-play or queue instantly</p>
                </div>
              </div>

              <form onSubmit={handleSearchSongs} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={globalSearchQuery}
                    onChange={e => setGlobalSearchQuery(e.target.value)}
                    placeholder="Search song title, movie, singer (e.g. 'Tum Mile', 'Arijit Singh')..."
                    className="w-full bg-gray-900/90 border border-white/10 rounded-2xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                </div>
                <button
                  type="submit"
                  disabled={isSearchingSongs || !globalSearchQuery.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-2xl text-xs transition-all shadow-md disabled:opacity-40 shrink-0"
                >
                  {isSearchingSongs ? 'Searching...' : 'Search'}
                </button>
              </form>

              {/* Search Results */}
              {globalSearchResults.length > 0 && (
                <div className="pt-2 divide-y divide-white/5 max-h-96 overflow-y-auto custom-scrollbar">
                  {globalSearchResults.map((track) => (
                    <div key={track.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={track.image}
                          alt={track.song}
                          className="w-11 h-11 rounded-xl object-cover shrink-0 border border-white/10"
                        />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{track.song}</h4>
                          <p className="text-[11px] text-gray-400 truncate">{track.singers}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleForcePlayTrack(track)}
                          className="px-3 py-1.5 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl text-[11px] transition-all flex items-center gap-1 shadow-sm"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Play Now</span>
                        </button>
                        <button
                          onClick={() => handlePlayNextTrack(track)}
                          className="px-3 py-1.5 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl text-[11px] transition-all"
                        >
                          Play Next
                        </button>
                        <button
                          onClick={() => handleAddToQueue(track)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold rounded-xl text-[11px] transition-all"
                        >
                          Add Queue
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: Pending Requests Queue */}
        {activeTab === 'requests' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-black text-white">Pending Song Requests Queue</h3>
                <p className="text-xs text-gray-400">Listener requests waiting for DJ action</p>
              </div>
              <div className="text-xs text-pink-300 font-bold bg-pink-500/10 border border-pink-500/20 px-3 py-1.5 rounded-full self-start">
                {pendingList.length} Pending
              </div>
            </div>

            {pendingList.length === 0 ? (
              <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center space-y-3">
                <div className="w-14 h-14 bg-pink-500/10 border border-pink-500/20 rounded-2xl flex items-center justify-center mx-auto text-pink-400">
                  <Music className="w-7 h-7" />
                </div>
                <h4 className="text-sm font-bold text-white">No Pending Song Requests</h4>
                <p className="text-xs text-gray-400 max-w-sm mx-auto">
                  When listeners request songs in the Campus PCO room, they will appear here in real-time for one-click approval.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingList.map((req) => (
                  <div
                    key={req.id}
                    className="bg-white/5 border border-white/10 rounded-3xl p-4 sm:p-5 flex flex-col justify-between gap-4 backdrop-blur-xl hover:border-pink-500/40 transition-all shadow-lg"
                  >
                    <div className="flex items-start gap-3.5">
                      <img
                        src={req.track_image || 'https://c.saavncdn.com/815/Bhediya-Hindi-2023-20230613054804-500x500.jpg'}
                        alt={req.track_name}
                        className="w-16 h-16 rounded-2xl object-cover border border-white/10 shrink-0"
                      />
                      <div className="min-w-0 space-y-1">
                        <span className="text-[10px] font-bold text-pink-400 bg-pink-500/10 border border-pink-500/20 px-2 py-0.5 rounded-full">
                          Requested by {req.requester_name}
                        </span>
                        <h4 className="text-sm font-bold text-white truncate">{req.track_name}</h4>
                        <p className="text-xs text-gray-400 truncate">{req.track_artist || 'Bollywood Hit'}</p>
                        <p className="text-[10px] text-gray-500">
                          {new Date(req.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-white/5">
                      <button
                        onClick={() => handleApprovePlayNow(req)}
                        className="py-2 px-3 bg-gradient-to-r from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500 text-white font-bold rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-1"
                      >
                        <Play className="w-3 h-3 fill-white" />
                        <span>Play Now</span>
                      </button>
                      <button
                        onClick={() => handleApprovePlayNext(req)}
                        className="py-2 px-3 bg-white/10 hover:bg-white/15 text-white font-bold rounded-xl text-xs transition-all flex items-center justify-center gap-1"
                      >
                        <SkipForward className="w-3 h-3" />
                        <span>Play Next</span>
                      </button>
                      <button
                        onClick={() => handleDeclineRequest(req)}
                        className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 font-bold rounded-xl text-xs transition-all border border-red-500/20 flex items-center justify-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        <span>Decline</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Upcoming 24/7 Schedule & Custom Queue */}
        {activeTab === 'schedule' && (
          <div className="space-y-6">
            {/* Custom Admin In-Memory Queue */}
            {customQueue.length > 0 && (
              <div className="bg-purple-950/30 border border-purple-500/30 rounded-3xl p-5 backdrop-blur-xl space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-black text-purple-300 flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-purple-400" />
                    Admin Priority Queue ({customQueue.length} Tracks)
                  </h3>
                  <button
                    onClick={() => setCustomQueue([])}
                    className="text-[10px] text-gray-400 hover:text-red-400 transition-colors"
                  >
                    Clear Custom Queue
                  </button>
                </div>

                <div className="divide-y divide-white/5">
                  {customQueue.map((track, idx) => (
                    <div key={`${track.id}_${idx}`} className="py-2.5 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs font-bold text-purple-400 w-4">{idx + 1}</span>
                        <img src={track.image} alt={track.song} className="w-9 h-9 rounded-lg object-cover" />
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{track.song}</h4>
                          <p className="text-[10px] text-gray-400 truncate">{track.singers}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => handleForcePlayTrack(track)}
                          className="px-2.5 py-1 bg-pink-600 hover:bg-pink-500 text-white rounded-lg text-[10px] font-bold"
                        >
                          Play Now
                        </button>
                        <button
                          onClick={() => handleMoveQueueItem(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg"
                        >
                          <ChevronUp className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleMoveQueueItem(idx, 'down')}
                          disabled={idx === customQueue.length - 1}
                          className="p-1 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-lg"
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleRemoveFromQueue(idx)}
                          className="p-1 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upcoming Deterministic 24/7 Schedule */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <ListMusic className="w-5 h-5 text-pink-400" />
                    Upcoming 24/7 Radio Schedule
                  </h3>
                  <p className="text-xs text-gray-400">Next scheduled tracks calculated deterministically</p>
                </div>
                <span className="text-xs font-bold text-gray-400">Next 20 Songs</span>
              </div>

              <div className="divide-y divide-white/5">
                {scheduleState?.upcomingTracks.map((track, idx) => (
                  <div key={`${track.id}_sched_${idx}`} className="py-3 flex items-center justify-between gap-3 group">
                    <div className="flex items-center gap-3.5 min-w-0">
                      <span className="font-mono text-xs font-bold text-pink-400/70 w-5 text-center">
                        +{idx + 1}
                      </span>
                      <img
                        src={track.image}
                        alt={track.song}
                        className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate group-hover:text-pink-300 transition-colors">
                          {track.song}
                        </h4>
                        <p className="text-[11px] text-gray-400 truncate">{track.singers}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleForcePlayTrack(track)}
                        className="px-3 py-1.5 bg-white/10 hover:bg-pink-600 text-white font-bold rounded-xl text-[11px] transition-all shadow-sm"
                      >
                        Play Now
                      </button>
                      <button
                        onClick={() => handlePlayNextTrack(track)}
                        className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white font-semibold rounded-xl text-[11px] transition-all"
                      >
                        Queue Next
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: Request History & Top Tracks */}
        {activeTab === 'history' && (
          <div className="space-y-6">
            {/* Top 10 Most Requested Tracks */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl space-y-4">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-pink-400" />
                Top Most Requested Campus Tracks
              </h3>

              {analyticsData.topTracks.length === 0 ? (
                <p className="text-xs text-gray-500 py-6 text-center">No track statistics accumulated yet.</p>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {analyticsData.topTracks.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between bg-white/5 p-3 rounded-2xl border border-white/5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="font-mono text-xs font-bold text-pink-400 w-5">#{idx + 1}</span>
                        {item.image && (
                          <img src={item.image} alt={item.name} className="w-9 h-9 rounded-xl object-cover" />
                        )}
                        <div className="min-w-0">
                          <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                          <p className="text-[10px] text-gray-400 truncate">{item.artist}</p>
                        </div>
                      </div>
                      <span className="text-xs font-bold text-purple-300 bg-purple-500/20 px-2 py-0.5 rounded-full shrink-0">
                        {item.count} reqs
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Filterable Request History Table */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="text-base font-bold text-white">Full Request History</h3>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={e => setSearchFilter(e.target.value)}
                    placeholder="Filter history..."
                    className="bg-gray-900/90 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
                  />
                  <select
                    value={statusFilter}
                    onChange={e => setStatusFilter(e.target.value as any)}
                    className="bg-gray-900/90 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-pink-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
              </div>

              <div className="divide-y divide-white/5 max-h-96 overflow-y-auto custom-scrollbar">
                {filteredRequests.map((req) => (
                  <div key={req.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={req.track_image || 'https://c.saavncdn.com/815/Bhediya-Hindi-2023-20230613054804-500x500.jpg'}
                        alt={req.track_name}
                        className="w-10 h-10 rounded-xl object-cover"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-white truncate">{req.track_name}</h4>
                        <p className="text-[10px] text-gray-400 truncate">{req.track_artist} • By {req.requester_name}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full ${
                        req.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : req.status === 'declined'
                          ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                          : 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30'
                      }`}>
                        {req.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: Admin Team Management */}
        {activeTab === 'admins' && (
          <div className="space-y-6">
            {/* Add New Admin Form */}
            <div className="bg-gradient-to-br from-purple-950/40 via-black/80 to-pink-950/40 border border-purple-500/30 rounded-3xl p-5 md:p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-purple-500/20 rounded-2xl border border-purple-500/30 text-purple-300">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Add New Campus PCO DJ Admin</h3>
                  <p className="text-xs text-gray-400">Grant full radio moderation and DJ song override permissions</p>
                </div>
              </div>

              <form onSubmit={handleAddAdminSubmit} className="flex flex-col sm:flex-row items-center gap-3">
                <input
                  type="email"
                  value={newAdminEmail}
                  onChange={e => setNewAdminEmail(e.target.value)}
                  placeholder="Enter email (e.g. dj_mod@university.edu)..."
                  className="flex-1 w-full bg-gray-900/90 border border-white/10 rounded-2xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                  required
                />

                <select
                  value={newAdminRole}
                  onChange={e => setNewAdminRole(e.target.value as any)}
                  className="w-full sm:w-44 bg-gray-900/90 border border-white/10 rounded-2xl px-3 py-2.5 text-xs text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="pco_admin">PCO DJ Admin</option>
                  <option value="super_admin">Super Admin</option>
                </select>

                <button
                  type="submit"
                  disabled={isSubmittingAdmin || !newAdminEmail.trim()}
                  className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 disabled:opacity-40 text-white font-bold rounded-2xl text-xs transition-all shadow-md flex items-center justify-center gap-1.5 shrink-0"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>{isSubmittingAdmin ? 'Adding...' : 'Add Admin'}</span>
                </button>
              </form>

              {adminActionMsg && (
                <div className={`text-xs font-semibold px-4 py-2 rounded-xl flex items-center gap-2 ${
                  adminActionMsg.type === 'success'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-red-500/20 text-red-300 border border-red-500/30'
                }`}>
                  {adminActionMsg.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                  <span>{adminActionMsg.text}</span>
                </div>
              )}
            </div>

            {/* List of Active Admins */}
            <div className="bg-white/5 border border-white/10 rounded-3xl p-5 md:p-6 backdrop-blur-xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-purple-400" />
                  Registered Admin Team Members
                </h3>
                <span className="text-xs text-gray-400">{adminUsersList.length} Admins</span>
              </div>

              <div className="divide-y divide-white/5">
                {adminUsersList.map((admin) => (
                  <div key={admin.id} className="py-3 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <Shield className="w-4 h-4 text-pink-400" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white flex items-center gap-2 truncate">
                          <span className="truncate">{admin.email}</span>
                          {['nikhilyadav200530@gmail.com', 'avneeshjha1506@gmail.com', 'dpursuit14@gmail.com', 'lachavzo11@gmail.com'].includes(admin.email.toLowerCase()) && (
                            <span className="text-[9px] bg-pink-500/20 text-pink-300 border border-pink-500/30 px-1.5 py-0.2 rounded font-bold shrink-0">
                              Primary Owner
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-gray-500">
                          Role: {admin.role.replace('_', ' ').toUpperCase()}
                        </div>
                      </div>
                    </div>

                    <div>
                      {!['nikhilyadav200530@gmail.com', 'avneeshjha1506@gmail.com', 'dpursuit14@gmail.com', 'lachavzo11@gmail.com'].includes(admin.email.toLowerCase()) && (
                        <button
                          onClick={() => handleRemoveAdminClick(admin.email)}
                          className="p-2 bg-gray-800 hover:bg-red-500/20 text-gray-400 hover:text-red-400 rounded-xl text-xs transition-colors"
                          title="Revoke Admin Access"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default PcoAdminDashboard;
