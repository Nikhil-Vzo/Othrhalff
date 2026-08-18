"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import {
  PcoSongRequest,
  PcoTrack,
  checkIsPcoAdmin,
  fetchPcoRequests,
  updatePcoSongRequestStatus,
  getPcoAnalytics,
  fetchAdminUsers,
  addAdminUser,
  removeAdminUser,
  AdminUserRecord,
  getPcoLiveSchedule,
  broadcastPcoAction,
  PcoRadioMode,
  fetchPcoRadioState,
  setManualRadioOverride,
  returnToAutoRadioSchedule,
  updateRadioQueue
} from '../services/pcoAdmin';

const FALLBACK_ART = 'https://c.saavncdn.com/815/Bhediya-Hindi-2023-20230613054804-500x500.jpg';
const PRIMARY_OWNERS = [
  'nikhilyadav200530@gmail.com',
  'avneeshkumarjha1506@gmail.com',
  'avneeshjha1506@gmail.com',
  'dpursuit14@gmail.com',
  'lachavzo11@gmail.com'
];

type Tab = 'dj' | 'requests' | 'queue' | 'history' | 'admins' | 'console';
interface LogEntry { t: string; src: string; msg: string }

const fmt = (s: number) => {
  const m = Math.floor(Math.max(0, s) / 60);
  const sec = String(Math.floor(Math.max(0, s) % 60)).padStart(2, '0');
  return `${m}:${sec}`;
};

const clockAt = (epochSec: number) =>
  new Date(epochSec * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

const ago = (iso?: string) => {
  if (!iso) return 'now';
  const m = Math.floor(Math.max(0, Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ago`;
};

const artFix = (e: React.SyntheticEvent<HTMLImageElement>) => {
  if (e.currentTarget.src !== FALLBACK_ART) {
    e.currentTarget.src = FALLBACK_ART;
  }
};

export const PcoAdminDashboard: React.FC = () => {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>('dj');
  const [now, setNow] = useState(Date.now());

  const [channelStatus, setChannelStatus] = useState('CONNECTING');
  const [listeners, setListeners] = useState(1);
  const channelRef = useRef<any>(null);

  const [liveTrack, setLiveTrack] = useState<PcoTrack | null>(null);
  const [radioMode, setRadioMode] = useState<PcoRadioMode>('auto');
  const [startedAt, setStartedAt] = useState(Date.now());
  const [startOffset, setStartOffset] = useState(0);
  const [radioPlaying, setRadioPlaying] = useState(true);
  const [lastAction, setLastAction] = useState<string | null>(null);

  const [queue, setQueue] = useState<PcoTrack[]>([]);
  const [requests, setRequests] = useState<PcoSongRequest[]>([]);
  const [admins, setAdmins] = useState<AdminUserRecord[]>([]);
  const [analytics, setAnalytics] = useState<{
    totalRequests: number; pendingRequests: number; todayRequests: number;
    topTracks: { name: string; artist: string; count: number; image?: string }[];
  }>({ totalRequests: 0, pendingRequests: 0, todayRequests: 0, topTracks: [] });

  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [banner, setBanner] = useState('');
  const [searchQ, setSearchQ] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<PcoTrack[]>([]);
  const [histFilter, setHistFilter] = useState<'all' | 'pending' | 'approved' | 'declined' | 'played'>('all');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminRole, setNewAdminRole] = useState<'pco_admin' | 'super_admin'>('pco_admin');
  const [note, setNote] = useState<string | null>(null);
  const seekTimer = useRef<any>(null);

  const log = (src: string, msg: string) =>
    setLogs(prev => [...prev.slice(-199), { t: new Date().toLocaleTimeString(), src, msg }]);

  const flash = (m: string) => {
    setNote(m);
    setTimeout(() => setNote(null), 3000);
  };

  /* 1. Auth Gate */
  useEffect(() => {
    let isMounted = true;
    (async () => {
      let email: string | null = null;
      if (supabase) {
        try {
          const { data } = await supabase.auth.getUser();
          email = data?.user?.email || null;
        } catch (_) {}
      }
      const ok = await checkIsPcoAdmin(currentUser, email);
      if (isMounted) setIsAdmin(ok);
    })();
    return () => { isMounted = false; };
  }, [currentUser]);

  /* 2. Clock Tick */
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const reload = async () => {
    try {
      const [r, a, ad, radioState] = await Promise.all([
        fetchPcoRequests('all', 200),
        getPcoAnalytics(),
        fetchAdminUsers(),
        fetchPcoRadioState()
      ]);
      setRequests(r);
      setAnalytics(a);
      setAdmins(ad);

      if (radioState) {
        setRadioMode(radioState.mode);
        if (radioState.mode === 'manual' && radioState.current_track) {
          const dur = parseInt(radioState.current_track.duration, 10) || 240;
          const elapsedSec = Math.max(0, (Date.now() - radioState.started_at_ms) / 1000);
          if (elapsedSec < dur) {
            setLiveTrack(radioState.current_track);
            setStartOffset(elapsedSec);
            setStartedAt(Date.now());
            setRadioPlaying(!radioState.paused);
            setQueue(radioState.queue || []);
          }
        }
      }
    } catch (err) {
      console.warn('[PCO Console] Reload error:', err);
    }
  };

  /* 3. Realtime Channel & Broadcast Subscription */
  useEffect(() => {
    if (!isAdmin || !supabase) return;

    const sched = getPcoLiveSchedule();
    setLiveTrack(sched.currentTrack);
    setStartOffset(sched.offsetSec);
    setStartedAt(Date.now());
    reload();

    const ch = supabase.channel('campus_pco_live_chat', {
      config: { presence: { key: currentUser?.id || `console_${Math.random().toString(36).substring(2, 7)}` } }
    });
    channelRef.current = ch;

    const countPresence = () => {
      const st = ch.presenceState();
      let n = 0;
      Object.values(st).forEach((p: any) => { n += (p?.length || 0); });
      setListeners(Math.max(1, n));
    };

    ch.on('presence', { event: 'sync' }, countPresence)
      .on('presence', { event: 'join' }, countPresence)
      .on('presence', { event: 'leave' }, countPresence)
      .on('broadcast', { event: 'PCO_PLAY_IMMEDIATELY' }, ({ payload }) => {
        if (payload?.track) {
          setLiveTrack(payload.track);
          setStartOffset(0);
          setStartedAt(Date.now());
          setRadioPlaying(true);
          setRadioMode('manual');
          log('RADIO', `On Air → "${payload.track.song}"`);
        }
      })
      .on('broadcast', { event: 'PCO_PLAY_NEXT' }, ({ payload }) => {
        if (payload?.track) {
          setQueue(q => [payload.track, ...q.filter(t => t.id !== payload.track.id)]);
          log('QUEUE', `Play Next → "${payload.track.song}"`);
        }
      })
      .on('broadcast', { event: 'PCO_ADD_QUEUE' }, ({ payload }) => {
        if (payload?.track) {
          setQueue(q => [...q, payload.track]);
          log('QUEUE', `Added to Queue → "${payload.track.song}"`);
        }
      })
      .on('broadcast', { event: 'PCO_QUEUE_SYNC' }, ({ payload }) => {
        if (Array.isArray(payload?.queue)) {
          setQueue(payload.queue);
          log('QUEUE', `Mirror Sync (${payload.queue.length} tracks)`);
        }
      })
      .on('broadcast', { event: 'PCO_STATE_UPDATED' }, ({ payload }) => {
        if (payload?.mode === 'auto') {
          setRadioMode('auto');
          const nextSched = getPcoLiveSchedule();
          setLiveTrack(nextSched.currentTrack);
          setStartOffset(nextSched.offsetSec);
          setStartedAt(Date.now());
          log('RADIO', 'Switched to 24/7 Auto Schedule');
        } else if (payload?.mode === 'manual' && payload?.current_track) {
          setRadioMode('manual');
          setLiveTrack(payload.current_track);
          setStartOffset(0);
          setStartedAt(Date.now());
          log('RADIO', `Manual Override → "${payload.current_track.song}"`);
        }
      })
      .on('broadcast', { event: 'PCO_ADMIN_SKIP' }, () => {
        log('RADIO', 'Skip Broadcast Received');
      })
      .on('broadcast', { event: 'PCO_PLAY_STATE' }, ({ payload }) => {
        if (typeof payload?.playing === 'boolean') {
          setRadioPlaying(payload.playing);
          log('RADIO', payload.playing ? 'Station Resumed' : 'Station Paused');
        }
      })
      .on('broadcast', { event: 'PCO_REQUEST_NOTIFICATION' }, ({ payload }) => {
        log('REQUEST', `${payload?.requester || 'User'} requested "${payload?.track?.song || 'track'}"`);
        reload();
      })
      .on('broadcast', { event: 'LIVE_CHAT_MSG' }, ({ payload }) => {
        log('CHAT', `${payload?.user}: ${payload?.text}`);
      })
      .subscribe((status: string) => {
        setChannelStatus(status);
        if (status === 'SUBSCRIBED') {
          ch.track({
            user: `Admin DJ 🎧 (${currentUser?.realName || currentUser?.anonymousId || 'Console'})`,
            online_at: new Date().toISOString()
          });
          ch.send({ type: 'broadcast', event: 'PCO_QUEUE_QUERY', payload: {} });
          log('SYSTEM', 'Subscribed to campus_pco_live_chat');
        }
      });

    const db = supabase.channel('pco_dash_db_sync')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pco_song_requests' }, () => reload())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'admin_users' }, () => reload())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'pco_radio_state' }, () => reload())
      .subscribe();

    return () => {
      supabase.removeChannel(ch);
      supabase.removeChannel(db);
      channelRef.current = null;
    };
  }, [isAdmin]);

  /* 4. Transport Actions with Authoritative DB Persistence */
  const send = (event: string, payload: any) => {
    if (channelRef.current) {
      channelRef.current.send({ type: 'broadcast', event, payload });
    }
  };

  const dur = parseInt(liveTrack?.duration || '240', 10) || 240;
  const elapsed = liveTrack
    ? Math.min(radioPlaying ? startOffset + (now - startedAt) / 1000 : startOffset, dur)
    : 0;

  const actPlayNow = async (track: PcoTrack, requestId?: string) => {
    if (requestId) updatePcoSongRequestStatus(requestId, 'approved', currentUser?.id);
    send('PCO_PLAY_IMMEDIATELY', { track, requester: 'Admin DJ' });
    setLiveTrack(track);
    setStartOffset(0);
    setStartedAt(Date.now());
    setRadioPlaying(true);
    setRadioMode('manual');
    setLastAction('force');
    await setManualRadioOverride(track, queue);
    log('DJ', `Play Now → "${track.song}" (Saved to DB)`);
    flash(`🔥 Playing "${track.song}"`);
  };

  const actPlayNext = async (track: PcoTrack, requestId?: string) => {
    if (requestId) updatePcoSongRequestStatus(requestId, 'approved', currentUser?.id);
    send('PCO_PLAY_NEXT', { track, requester: 'Admin DJ' });
    const nextQueue = [track, ...queue.filter(t => t.id !== track.id)];
    setQueue(nextQueue);
    await updateRadioQueue(nextQueue);
    log('DJ', `Queue Next → "${track.song}"`);
    flash(`⏭️ Queued Next: "${track.song}"`);
  };

  const actQueueEnd = async (track: PcoTrack, requestId?: string) => {
    if (requestId) updatePcoSongRequestStatus(requestId, 'approved', currentUser?.id);
    send('PCO_ADD_QUEUE', { track, requester: 'Admin DJ' });
    const nextQueue = [...queue.filter(t => t.id !== track.id), track];
    setQueue(nextQueue);
    await updateRadioQueue(nextQueue);
    log('DJ', `Added to Queue → "${track.song}"`);
    flash(`➕ Queued: "${track.song}"`);
  };

  const actReturnToAuto = async () => {
    const sched = getPcoLiveSchedule();
    setRadioMode('auto');
    setLiveTrack(sched.currentTrack);
    setStartOffset(sched.offsetSec);
    setStartedAt(Date.now());
    await returnToAutoRadioSchedule();
    send('PCO_STATE_UPDATED', { mode: 'auto' });
    log('DJ', 'Returned to 24/7 Auto Schedule');
    flash('📻 Switched to 24/7 Auto Schedule');
  };

  const actDecline = (id: string) => {
    updatePcoSongRequestStatus(id, 'declined', currentUser?.id);
    reload();
    log('DJ', `Declined request ${id}`);
    flash('✕ Request declined');
  };

  const actSkip = async () => {
    if (queue.length > 0) {
      const [nextTrack, ...remQueue] = queue;
      setLiveTrack(nextTrack);
      setStartOffset(0);
      setStartedAt(Date.now());
      setQueue(remQueue);
      await setManualRadioOverride(nextTrack, remQueue);
      send('PCO_PLAY_IMMEDIATELY', { track: nextTrack, requester: 'Admin DJ' });
    } else {
      await actReturnToAuto();
    }
    broadcastPcoAction('PCO_ADMIN_SKIP', { user: 'Admin DJ' });
    setLastAction('skip');
    log('DJ', 'Skipped track broadcast');
    flash('⏭️ Skipped current track');
  };

  const actPauseToggle = () => {
    const nextState = !radioPlaying;
    send('PCO_PLAY_STATE', { playing: nextState });
    setRadioPlaying(nextState);
    log('DJ', nextState ? 'Station Resumed' : 'Station Paused');
    flash(nextState ? '▶ Station Resumed' : '⏸ Station Paused');
  };

  const onSeekInput = (v: number) => {
    setStartOffset(v);
    setStartedAt(Date.now());
    clearTimeout(seekTimer.current);
    seekTimer.current = setTimeout(() => {
      send('PCO_SEEK', { time: v });
      log('DJ', `Seeked to ${fmt(v)}`);
    }, 250);
  };

  /* 5. Authoritative Queue Operations */
  const syncQueue = async (next: PcoTrack[]) => {
    setQueue(next);
    send('PCO_QUEUE_SYNC', { queue: next });
    await updateRadioQueue(next);
  };

  const qMove = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= queue.length) return;
    const next = [...queue];
    [next[i], next[j]] = [next[j], next[i]];
    syncQueue(next);
  };

  const qRemove = (trackId: string) => {
    syncQueue(queue.filter(t => t.id !== trackId));
    flash('Track removed from queue');
  };

  const qPlay = (track: PcoTrack) => {
    syncQueue(queue.filter(t => t.id !== track.id));
    actPlayNow(track);
  };

  /* 6. Real-time Search */
  useEffect(() => {
    if (!searchQ.trim()) {
      setResults([]);
      setIsSearching(false);
      return;
    }
    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`https://saavnapi-nine.vercel.app/result/?query=${encodeURIComponent(searchQ)}`);
        const data = await res.json();
        if (Array.isArray(data)) {
          setResults(
            data
              .slice(0, 10)
              .map((x: any) => ({
                id: String(x.id || `search_${Math.random()}`),
                song: x.song || x.title || 'Untitled',
                singers: x.singers || x.primary_artists || x.artist || 'Unknown',
                image: x.image || FALLBACK_ART,
                media_url: x.media_url || '',
                duration: x.duration || '240'
              }))
              .filter((x: PcoTrack) => x.media_url)
          );
        }
      } catch (err) {
        console.warn('[PCO Console] Search failed:', err);
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQ]);

  /* 7. Banner Broadcast & Admins */
  const sendBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!banner.trim()) return;
    send('LIVE_CHAT_MSG', { user: 'Admin DJ 🎧', text: `📢 ${banner.trim()}` });
    log('DJ', `Banner Broadcast → "${banner.trim()}"`);
    setBanner('');
    flash('📢 Banner broadcasted to all listeners');
  };

  const submitAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await addAdminUser(newAdminEmail, newAdminRole, currentUser?.id);
    if (r.success) {
      setNewAdminEmail('');
      reload();
      flash('✅ Admin added successfully');
      log('ADMIN', `Added admin ${newAdminEmail} (${newAdminRole})`);
    } else {
      flash(r.error || 'Failed to add admin');
    }
  };

  const delAdmin = async (email: string) => {
    if (!window.confirm(`Revoke admin privileges for ${email}?`)) return;
    const r = await removeAdminUser(email);
    flash(r.success ? 'Revoked' : r.error || 'Failed');
    if (r.success) log('ADMIN', `Revoked ${email}`);
    reload();
  };

  const copyDiag = () => {
    const diagData = {
      timestamp: new Date().toISOString(),
      channel: channelStatus,
      listeners,
      currentTrack: liveTrack?.song,
      elapsed: Math.floor(elapsed),
      duration: dur,
      isPlaying: radioPlaying,
      queueLength: queue.length,
      pendingRequests: analytics.pendingRequests,
      todayRequests: analytics.todayRequests,
      totalAdmins: admins.length
    };
    navigator.clipboard.writeText(JSON.stringify(diagData, null, 2)).then(() => {
      flash('📋 Diagnostics copied to clipboard');
    });
  };

  const actSkipRef = useRef(actSkip);
  actSkipRef.current = actSkip;

  const actPauseToggleRef = useRef(actPauseToggle);
  actPauseToggleRef.current = actPauseToggle;

  /* 8. Keyboard Shortcuts (1-6 for Tabs, S for Skip, P for Pause) */
  useEffect(() => {
    if (!isAdmin) return;
    const handleKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

      const tabOrder: Tab[] = ['dj', 'requests', 'queue', 'history', 'admins', 'console'];
      if (e.key >= '1' && e.key <= '6') {
        setTab(tabOrder[Number(e.key) - 1]);
      } else if (e.key.toLowerCase() === 's') {
        actSkipRef.current();
      } else if (e.key.toLowerCase() === 'p') {
        actPauseToggleRef.current();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isAdmin]);

  /* 9. Render Auth Gates */
  if (isAdmin === null) {
    return (
      <div className="min-h-screen bg-black text-zinc-500 font-mono text-xs flex items-center justify-center">
        AUTHENTICATING ADMIN PRIVILEGES…
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-black text-zinc-300 font-mono text-xs flex flex-col items-center justify-center gap-4 p-6 text-center">
        <div className="text-red-400 font-bold text-sm tracking-wider">403 — CAMPUS PCO ADMIN ACCESS REQUIRED</div>
        <p className="text-zinc-500 max-w-sm">You are not authorized on the DJ admin whitelist. Please contact a platform owner.</p>
        <button
          onClick={() => router.push('/sparx')}
          className="border border-zinc-700 bg-zinc-900 text-white px-4 py-2 hover:bg-zinc-800 transition-all font-mono"
        >
          ← RETURN TO SPARX HUB
        </button>
      </div>
    );
  }

  /* 10. Calculations & Tables */
  const B = 'border border-zinc-700 bg-zinc-900/90 text-zinc-200 px-2.5 py-1 text-xs font-mono hover:bg-zinc-800 hover:text-white active:scale-95 transition-all disabled:opacity-40 disabled:pointer-events-none';
  const pending = requests.filter(r => r.status === 'pending');
  const todayStr = new Date().toISOString().split('T')[0];
  const usage = (name: string) =>
    requests.filter(r => r.requester_name === name && (r.requested_at || '').startsWith(todayStr)).length;
  const history = requests.filter(r => histFilter === 'all' || r.status === histFilter);

  const sched = getPcoLiveSchedule();
  let schedT = Math.floor(now / 1000) + sched.remainingSec;
  const scheduleRows = sched.upcomingTracks.slice(0, 20).map(tr => {
    const start = schedT;
    schedT += parseInt(tr.duration, 10) || 240;
    return { tr, start };
  });

  const tabs: { id: Tab; label: string }[] = [
    { id: 'dj', label: '1·DJ TOOLS' },
    { id: 'requests', label: `2·REQUESTS${pending.length ? ` (${pending.length})` : ''}` },
    { id: 'queue', label: `3·QUEUE (${queue.length})` },
    { id: 'history', label: '4·HISTORY' },
    { id: 'admins', label: `5·ADMINS (${admins.length})` },
    { id: 'console', label: `6·CONSOLE (${logs.length})` }
  ];

  return (
    <div 
      className="w-full h-full min-h-screen bg-black text-gray-200 font-mono text-xs flex flex-col overflow-y-auto custom-scrollbar selection:bg-pink-500 selection:text-white pb-24"
      style={{ WebkitOverflowScrolling: 'touch' }}
    >
      {/* 1. STATUS BAR */}
      <header className="flex items-center gap-2 px-4 h-10 border-b border-zinc-800 bg-zinc-950/90 backdrop-blur-md sticky top-0 z-40 overflow-x-auto whitespace-nowrap">
        <button onClick={() => router.push('/sparx/music?room=Campus_PCO_247')} className={B}>← RADIO</button>
        <button onClick={() => router.push('/sparx')} className={B}>HUB</button>
        <span className="font-bold text-white px-1 tracking-wider">PCO://DJ-CENTER</span>
        <span className={channelStatus === 'SUBSCRIBED' ? 'text-emerald-400 font-bold' : 'text-red-400 font-bold'}>
          ● {channelStatus}
        </span>
        <span className="text-zinc-400">LISTENERS: <b className="text-white">{listeners}</b></span>
        {note && <span className="text-yellow-300 font-bold animate-pulse px-2 bg-yellow-950/40 border border-yellow-800/60 rounded">{note}</span>}
        <span className="ml-auto text-zinc-500">{new Date(now).toLocaleTimeString()}</span>
        <button onClick={reload} className={B} title="Refresh All Data">↻ RELOAD</button>
      </header>

      {/* 2. TABS NAVIGATION (Sticky & Always Visible at Top) */}
      <nav className="sticky top-10 z-30 flex border-b border-zinc-800 bg-zinc-950/95 backdrop-blur-md overflow-x-auto whitespace-nowrap shadow-md px-2">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2.5 text-xs font-bold transition-all border-b-2 ${
              tab === t.id
                ? 'bg-zinc-900/90 text-pink-400 border-pink-500 shadow-inner'
                : 'text-zinc-400 border-transparent hover:bg-zinc-900/50 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {/* 3. ON-AIR TRANSPORT DECK */}
      <div className="border-b border-zinc-800 p-4 bg-zinc-950/60 space-y-3">
        <div className="flex items-center gap-3">
          <img
            src={liveTrack?.image || FALLBACK_ART}
            alt=""
            onError={artFix}
            className="w-12 h-12 border border-zinc-700 object-cover shrink-0 rounded"
          />
          <div className="flex-1 min-w-0">
            <div className="text-white font-bold text-sm truncate flex items-center gap-2">
              <span>{liveTrack?.song || 'Station Offline'}</span>
              {radioMode === 'manual' ? (
                <span className="text-[10px] bg-pink-950/80 border border-pink-500 text-pink-300 px-1.5 py-0.5 rounded font-bold">
                  LIVE DJ OVERRIDE
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-950/80 border border-emerald-500 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                  24/7 AUTO SCHEDULE
                </span>
              )}
            </div>
            <div className="text-zinc-400 text-xs truncate">{liveTrack?.singers || '—'}</div>
          </div>
          <span className="text-zinc-300 font-bold text-xs shrink-0 bg-zinc-900 border border-zinc-800 px-2 py-1 rounded">
            {fmt(elapsed)} / {fmt(dur)}
          </span>
        </div>

        {/* Seekable Range Slider */}
        <input
          type="range"
          min={0}
          max={dur}
          value={Math.floor(elapsed)}
          onChange={e => onSeekInput(Number(e.target.value))}
          className="w-full h-1.5 bg-zinc-800 accent-pink-500 cursor-pointer rounded"
        />

        {/* Transport Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {radioMode === 'manual' && (
            <button onClick={actReturnToAuto} className="border border-emerald-600 bg-emerald-950/90 text-emerald-300 px-2.5 py-1 text-xs font-mono hover:bg-emerald-900 hover:text-white active:scale-95 transition-all font-bold">
              📻 RETURN TO AUTO
            </button>
          )}
          <button onClick={actPauseToggle} className={B}>
            {radioPlaying ? '⏸ PAUSE ALL [P]' : '▶ RESUME ALL [P]'}
          </button>
          <button onClick={() => onSeekInput(0)} className={B}>
            ⟲ RESTART
          </button>
          <button onClick={actSkip} className={B}>
            ⏭ SKIP ALL [S]
          </button>
          <button onClick={() => { send('PCO_QUEUE_QUERY', {}); flash('Queue mirror query dispatched'); }} className={B}>
            ⇄ SYNC QUEUE
          </button>
          <button onClick={copyDiag} className={B}>
            ⧉ DIAGNOSTICS
          </button>
        </div>

        {/* Sticky Broadcast Banner Form */}
        <form onSubmit={sendBanner} className="flex gap-2 pt-1">
          <input
            value={banner}
            onChange={e => setBanner(e.target.value)}
            placeholder="Broadcast sticky banner to all radio listeners (e.g. 'Shoutout to CS batch! 🎉')"
            className="flex-1 bg-black border border-zinc-700 px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-pink-500 rounded"
          />
          <button className={B} disabled={!banner.trim()}>
            BROADCAST
          </button>
        </form>
      </div>

      {/* 4. MAIN CONTENT TABS */}
      <main className="flex-1 p-4 space-y-4">
        {/* TAB 1: DJ TOOLS */}
        {tab === 'dj' && (
          <div className="space-y-4">
            {/* Realtime Telemetry Strip */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
              <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded">
                <span className="text-zinc-500 block text-[10px]">LISTENERS</span>
                <span className="text-emerald-400 text-base font-bold">{listeners}</span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded">
                <span className="text-zinc-500 block text-[10px]">PENDING</span>
                <span className="text-pink-400 text-base font-bold">{analytics.pendingRequests}</span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded">
                <span className="text-zinc-500 block text-[10px]">TODAY'S REQS</span>
                <span className="text-purple-300 text-base font-bold">{analytics.todayRequests}</span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded">
                <span className="text-zinc-500 block text-[10px]">TOTAL REQS</span>
                <span className="text-white text-base font-bold">{analytics.totalRequests}</span>
              </div>
              <div className="bg-zinc-950 border border-zinc-800 p-2.5 rounded col-span-2 md:col-span-1">
                <span className="text-zinc-500 block text-[10px]">ACTIVE ADMINS</span>
                <span className="text-blue-300 text-base font-bold">{admins.length}</span>
              </div>
            </div>

            {/* Instant Force-Play Track Search */}
            <div className="space-y-2">
              <div className="text-zinc-400 font-bold text-xs uppercase tracking-wider">Instant Song Override & Force Play</div>
              <div className="relative">
                <input
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search Bollywood/Hindi song to play now or queue..."
                  className="w-full bg-black border border-zinc-700 px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-pink-500 rounded"
                />
                {isSearching && (
                  <span className="absolute right-3 top-2.5 text-[10px] text-zinc-500 animate-pulse">SEARCHING…</span>
                )}
              </div>

              {results.map(t => (
                <div key={t.id} className="flex items-center gap-3 border border-zinc-800 bg-zinc-950/80 p-2 rounded hover:border-zinc-700 transition-colors">
                  <img src={t.image} alt="" onError={artFix} className="w-9 h-9 object-cover border border-zinc-800 rounded shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-xs truncate">{t.song}</div>
                    <div className="text-zinc-500 text-[11px] truncate">{t.singers}</div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => actPlayNow(t)} className={B}>▶ PLAY NOW</button>
                    <button onClick={() => actPlayNext(t)} className={B}>⏭ NEXT</button>
                    <button onClick={() => actQueueEnd(t)} className={B}>+ END</button>
                  </div>
                </div>
              ))}
            </div>

            {/* Top Requested Analytics */}
            {analytics.topTracks.length > 0 && (
              <div className="pt-4 border-t border-zinc-900 space-y-2">
                <div className="text-zinc-400 font-bold text-xs uppercase tracking-wider">Top 5 Most Requested Tracks</div>
                <div className="space-y-1.5">
                  {analytics.topTracks.slice(0, 5).map((t, i) => (
                    <div key={i} className="flex justify-between items-center gap-2 p-2 bg-zinc-950/50 border border-zinc-900 rounded">
                      <span className="truncate text-zinc-300">
                        <b className="text-pink-400 mr-2">#{i + 1}</b> {t.name} — <span className="text-zinc-500">{t.artist}</span>
                      </span>
                      <span className="text-pink-400 font-bold shrink-0">{t.count} requests</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: REQUESTS QUEUE */}
        {tab === 'requests' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-bold uppercase tracking-wider">Pending Student Requests ({pending.length})</span>
              <button onClick={reload} className={B}>↻ REFRESH</button>
            </div>

            {pending.length === 0 && (
              <div className="text-zinc-600 p-8 border border-zinc-900 rounded text-center">
                No pending song requests. All caught up!
              </div>
            )}

            {pending.map(r => (
              <div key={r.id} className="flex items-center gap-3 border border-zinc-800 bg-zinc-950/80 p-2.5 rounded hover:border-zinc-700 transition-colors">
                <img src={r.track_image || FALLBACK_ART} alt="" onError={artFix} className="w-10 h-10 object-cover border border-zinc-800 rounded shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-white font-bold text-xs truncate">{r.track_name}</div>
                  <div className="text-zinc-400 text-[11px] truncate flex items-center gap-2 mt-0.5">
                    <span>{r.requester_name}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-zinc-500">{ago(r.requested_at)}</span>
                    <span className="text-zinc-600">·</span>
                    <span className="text-yellow-300 font-semibold">{usage(r.requester_name)}/3 today</span>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => actPlayNow({
                      id: r.track_id,
                      song: r.track_name,
                      singers: r.track_artist || 'Campus Request',
                      image: r.track_image || FALLBACK_ART,
                      media_url: r.track_url || '',
                      duration: r.track_duration || '240'
                    }, r.id)}
                    className={B}
                    title="Play Immediately"
                  >
                    ▶ PLAY NOW
                  </button>
                  <button
                    onClick={() => actPlayNext({
                      id: r.track_id,
                      song: r.track_name,
                      singers: r.track_artist || 'Campus Request',
                      image: r.track_image || FALLBACK_ART,
                      media_url: r.track_url || '',
                      duration: r.track_duration || '240'
                    }, r.id)}
                    className={B}
                    title="Queue Next"
                  >
                    ⏭ NEXT
                  </button>
                  <button
                    onClick={() => actDecline(r.id)}
                    className="border border-red-500/60 bg-red-950/40 text-red-300 px-2.5 py-1 text-xs hover:bg-red-900/60 transition-colors rounded"
                    title="Decline Request"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 3: QUEUE + SCHEDULE */}
        {tab === 'queue' && (
          <div className="space-y-4">
            {/* Search & Add Directly to Queue */}
            <div className="space-y-2 pb-2 border-b border-zinc-900">
              <div className="text-zinc-400 font-bold text-xs uppercase tracking-wider">Search & Add Songs to Queue</div>
              <div className="relative">
                <input
                  value={searchQ}
                  onChange={e => setSearchQ(e.target.value)}
                  placeholder="Search track to add to queue or play next..."
                  className="w-full bg-black border border-zinc-700 px-3 py-2 text-xs text-white placeholder-zinc-500 outline-none focus:border-pink-500 rounded"
                />
                {isSearching && (
                  <span className="absolute right-3 top-2.5 text-[10px] text-zinc-500 animate-pulse">SEARCHING…</span>
                )}
              </div>

              {results.map(t => (
                <div key={t.id} className="flex items-center gap-3 border border-zinc-800 bg-zinc-950/80 p-2 rounded hover:border-zinc-700 transition-colors">
                  <img src={t.image} alt="" onError={artFix} className="w-8 h-8 object-cover border border-zinc-800 rounded shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-white font-bold text-xs truncate">{t.song}</div>
                    <div className="text-zinc-500 text-[11px] truncate">{t.singers}</div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button onClick={() => actPlayNow(t)} className={B}>▶ PLAY NOW</button>
                    <button onClick={() => actPlayNext(t)} className={B}>⏭ NEXT</button>
                    <button onClick={() => actQueueEnd(t)} className={B}>+ QUEUE</button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-bold uppercase tracking-wider">
                Live Custom Queue ({queue.length})
              </span>
              {queue.length > 0 && (
                <button
                  onClick={() => { if (confirm('Clear entire active queue?')) syncQueue([]); }}
                  className="border border-red-500/60 bg-red-950/40 text-red-300 px-2.5 py-1 text-xs hover:bg-red-900/60 transition-colors rounded"
                >
                  CLEAR QUEUE
                </button>
              )}
            </div>

            {queue.length === 0 && (
              <div className="text-zinc-600 p-4 border border-zinc-900 rounded">
                Custom queue is empty. Radio is streaming deterministically from the 24/7 romantic schedule.
              </div>
            )}

            {queue.map((t, i) => (
              <div key={`${t.id}-${i}`} className="flex items-center gap-3 border border-zinc-800 bg-zinc-950/80 p-2 rounded">
                <span className="text-zinc-500 font-bold w-6 text-center text-xs">#{i + 1}</span>
                <img src={t.image} alt="" onError={artFix} className="w-8 h-8 object-cover border border-zinc-800 rounded shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-white text-xs font-bold truncate">{t.song}</div>
                  <div className="text-zinc-500 text-[10px] truncate">{t.singers}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button onClick={() => qMove(i, -1)} className={B} disabled={i === 0} title="Move Up">↑</button>
                  <button onClick={() => qMove(i, 1)} className={B} disabled={i === queue.length - 1} title="Move Down">↓</button>
                  <button onClick={() => qPlay(t)} className={B} title="Play Now">▶</button>
                  <button onClick={() => qRemove(t.id)} className="border border-red-500/60 bg-red-950/40 text-red-300 px-2 py-1 text-xs rounded hover:bg-red-900/60" title="Remove">✕</button>
                </div>
              </div>
            ))}

            {/* Upcoming 24/7 Schedule */}
            <div className="pt-4 border-t border-zinc-900 space-y-2">
              <div className="text-zinc-400 font-bold text-xs uppercase tracking-wider">
                Predicted 24/7 Schedule (Next 20 Tracks)
              </div>
              <div className="space-y-1">
                {scheduleRows.map(({ tr, start }, i) => (
                  <div key={`${tr.id}-${i}`} className="flex justify-between items-center gap-2 py-1.5 px-2 bg-zinc-950/40 border border-zinc-900/80 rounded text-zinc-400 text-xs">
                    <span className="truncate">
                      <b className="text-zinc-500 mr-2">{clockAt(start)}</b>
                      <span className="text-white font-medium">{tr.song}</span> — <span className="text-zinc-500">{tr.singers}</span>
                    </span>
                    <span className="text-zinc-600 shrink-0">{fmt(parseInt(tr.duration, 10) || 240)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: HISTORY */}
        {tab === 'history' && (
          <div className="space-y-3">
            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-1.5">
              {(['all', 'pending', 'approved', 'declined', 'played'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setHistFilter(s)}
                  className={`px-3 py-1 text-xs border rounded transition-all ${
                    histFilter === s
                      ? 'bg-zinc-200 text-black font-bold border-zinc-200'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:bg-zinc-900 hover:text-white'
                  }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>

            {/* History Table */}
            <div className="border border-zinc-800 rounded overflow-x-auto bg-zinc-950/60">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-zinc-500 border-b border-zinc-800 bg-zinc-950">
                    <th className="p-2.5">TRACK</th>
                    <th className="p-2.5">REQUESTER</th>
                    <th className="p-2.5">STATUS</th>
                    <th className="p-2.5">TIME</th>
                    <th className="p-2.5 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {history.slice(0, 60).map(r => (
                    <tr key={r.id} className="border-b border-zinc-900/80 hover:bg-zinc-900/40 transition-colors">
                      <td className="p-2.5 text-white max-w-[200px] truncate font-medium">{r.track_name}</td>
                      <td className="p-2.5 text-zinc-400 max-w-[120px] truncate">{r.requester_name}</td>
                      <td className="p-2.5">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          r.status === 'pending'
                            ? 'bg-pink-950 text-pink-400 border border-pink-800/60'
                            : r.status === 'declined'
                            ? 'bg-red-950 text-red-400 border border-red-800/60'
                            : 'bg-emerald-950 text-emerald-400 border border-emerald-800/60'
                        }`}>
                          {r.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-2.5 text-zinc-500">
                        {r.requested_at ? new Date(r.requested_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                      </td>
                      <td className="p-2.5 text-right">
                        {r.status === 'pending' ? (
                          <button onClick={() => actDecline(r.id)} className={B}>✕ DECLINE</button>
                        ) : (
                          <button
                            onClick={() => actPlayNow({
                              id: r.track_id,
                              song: r.track_name,
                              singers: r.track_artist || 'Campus Request',
                              image: r.track_image || FALLBACK_ART,
                              media_url: r.track_url || '',
                              duration: r.track_duration || '240'
                            })}
                            className={B}
                            title="Replay Track"
                          >
                            ⟲ REPLAY
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 5: ADMIN TEAM */}
        {tab === 'admins' && (
          <div className="space-y-4">
            {/* Add New Admin Form */}
            <form onSubmit={submitAdmin} className="flex flex-wrap gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded">
              <input
                type="email"
                required
                value={newAdminEmail}
                onChange={e => setNewAdminEmail(e.target.value)}
                placeholder="teammate@university.edu"
                className="flex-1 min-w-[200px] bg-black border border-zinc-700 px-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-pink-500 rounded"
              />
              <select
                value={newAdminRole}
                onChange={e => setNewAdminRole(e.target.value as any)}
                className="bg-black border border-zinc-700 px-3 py-1.5 text-xs text-white outline-none rounded"
              >
                <option value="pco_admin">PCO DJ Admin</option>
                <option value="super_admin">Super Admin</option>
              </select>
              <button className={B}>+ ADD ADMIN</button>
            </form>

            {/* Active Admin List */}
            <div className="space-y-2">
              <div className="text-zinc-400 font-bold text-xs uppercase tracking-wider">
                Active Campus PCO Admins ({admins.length})
              </div>
              {admins.map(a => {
                const isPrimary = PRIMARY_OWNERS.includes(a.email.toLowerCase());
                return (
                  <div key={a.id} className="flex items-center justify-between gap-3 border border-zinc-800 bg-zinc-950/80 p-2.5 rounded">
                    <div className="flex-1 min-w-0 flex items-center gap-2">
                      <span className="text-white font-medium truncate">{a.email}</span>
                      {isPrimary && (
                        <span className="text-[10px] bg-pink-950 text-pink-300 border border-pink-800 px-1.5 py-0.5 rounded font-bold">
                          OWNER
                        </span>
                      )}
                    </div>
                    <span className="text-zinc-500 text-xs shrink-0">{a.role}</span>
                    <span className="text-zinc-600 text-xs shrink-0">{new Date(a.created_at).toLocaleDateString()}</span>
                    {!isPrimary && (
                      <button
                        onClick={() => delAdmin(a.email)}
                        className="border border-red-500/60 bg-red-950/40 text-red-300 px-2 py-1 text-xs rounded hover:bg-red-900/60"
                      >
                        REVOKE
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 6: CONSOLE EVENT LOG */}
        {tab === 'console' && (
          <div className="space-y-4">
            {/* Quick Diagnostic Actions Bar */}
            <div className="flex flex-wrap items-center gap-2 p-3 bg-zinc-950 border border-zinc-800 rounded">
              <span className="text-zinc-400 font-bold text-xs mr-2">DIAGNOSTIC CONTROLS:</span>
              <button
                onClick={() => {
                  send('PCO_PING', { senderId: currentUser?.id, timestamp: Date.now() });
                  flash('Broadcast ping dispatched to listeners');
                }}
                className={B}
              >
                📡 PING LISTENERS
              </button>
              <button
                onClick={() => {
                  send('PCO_QUEUE_QUERY', {});
                  flash('Queue sync query broadcasted');
                }}
                className={B}
              >
                ⇄ SYNC QUEUE STATE
              </button>
              <button
                onClick={copyDiag}
                className={B}
              >
                ⧉ COPY DIAGNOSTIC REPORT
              </button>
              <button
                onClick={() => setLogs([])}
                className="border border-red-500/60 bg-red-950/40 text-red-300 px-2.5 py-1 text-xs hover:bg-red-900/60 transition-colors rounded ml-auto"
              >
                ✕ CLEAR LOGS
              </button>
            </div>

            {/* Event Stream Header */}
            <div className="flex items-center justify-between">
              <span className="text-zinc-400 font-bold uppercase tracking-wider">
                Live Broadcast Telemetry Stream ({logs.length} events)
              </span>
              <span className="text-[10px] text-emerald-400 font-bold">
                ● STATUS: {channelStatus} | LISTENERS: {listeners}
              </span>
            </div>

            {/* Terminal Window */}
            <div className="bg-black border border-zinc-800 rounded p-3.5 h-[420px] overflow-y-auto font-mono text-xs space-y-1.5 custom-scrollbar shadow-inner">
              {logs.length === 0 && (
                <div className="text-zinc-600 py-10 text-center">
                  No broadcast events logged yet. Listening to live Supabase channel telemetry…
                </div>
              )}
              {[...logs].reverse().map((l, i) => (
                <div key={i} className="flex items-start gap-2.5 py-1 border-b border-zinc-900/80 hover:bg-zinc-950/80 transition-colors">
                  <span className="text-zinc-600 shrink-0 text-[10px]">{l.t}</span>
                  <span className="text-pink-400 font-bold shrink-0 w-16 text-[10px]">[{l.src}]</span>
                  <span className="text-zinc-300 flex-1 break-all">{l.msg}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default PcoAdminDashboard;
