import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter as useNavigate } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { usePresence } from '../context/PresenceContext';
import { MatchProfile, Message } from '../types';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Send, Phone, Video, MoreVertical, Ghost, Shield, Clock, User, AlertTriangle, Ban, Loader2, BadgeCheck, Gamepad2, Check, CheckCheck, ArrowDown, Sparkles, Plus, Trophy, Tv, Music, Lightbulb, HelpCircle, Dices, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { PermissionModal } from '../components/PermissionModal';
import { blockUser, unblockUser, checkBlockStatus } from '../services/blockService';
import { ConfirmationModal } from '../components/ConfirmationModal';
import { initiateCall, checkUserBusy } from '../services/callSignaling';
import { analytics } from '../utils/analytics';
import { getOptimizedUrl } from '../utils/image';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, LocalMessage } from '../lib/db';
import Dexie from 'dexie';

import { getRandomQuote } from '../data/loadingQuotes';
import { 
  WYR_TEMPLATES, 
  hashString, 
  shuffleArray, 
  TwoTruthsLieState, 
  WouldYouRatherState 
} from '../data/games';

const MESSAGES_PER_PAGE = 50;

const ChatSkeleton = () => {
  const [quote] = useState(getRandomQuote());
  return (
    <div className="h-full w-full bg-black flex flex-col relative">
      {/* Quote Overlay */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
        <p className="text-white/70 font-serif italic text-sm animate-pulse text-center bg-black/60 px-6 py-3 rounded-full backdrop-blur-md shadow-2xl border border-white/10">“{quote}”</p>
      </div>

      <div className="flex-none px-4 py-3 border-b border-gray-800 animate-pulse">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-800" />
          <div className="space-y-1">
            <div className="h-3 w-28 bg-gray-800 rounded" />
            <div className="h-2 w-16 bg-gray-700 rounded" />
          </div>
        </div>
      </div>
      <div className="flex-1 p-4 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
            <div className="h-10 w-48 bg-gray-800/60 rounded-2xl animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
};

const mapSupabaseMessageToLocal = (msg: any, matchId: string): LocalMessage => {
  const rawText = msg.text || msg.content;
  const textStr = rawText ? (typeof rawText === 'object' ? (rawText.text || rawText.content || '') : rawText) : '';
  return {
    id: msg.id,
    match_id: matchId,
    sender_id: msg.sender_id,
    text: textStr.replace('[SYSTEM]', '').trim(),
    created_at: new Date(msg.created_at).getTime(),
    is_system: textStr.startsWith('[SYSTEM]') || textStr.startsWith('📞'),
    is_read: msg.is_read,
    status: 'sent',
    reaction: msg.reaction || undefined
  };
};

export const Chat: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;
  const matchId = id!; // Guaranteed by route
  const cacheKey = `otherhalf_chat_${matchId}_v3`;

  const [partner, setPartner] = useState<MatchProfile | null>(null);

  const liveMessages = useLiveQuery(
    () => db.messages.where('[match_id+created_at]').between([matchId, Dexie.minKey], [matchId, Dexie.maxKey]).toArray(),
    [matchId]
  );

  const [deletedIds, setDeletedIds] = useState<Set<string>>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`deleted_messages_${matchId}`);
      return new Set(stored ? JSON.parse(stored) : []);
    }
    return new Set();
  });

  const [clearedAt, setClearedAt] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(`cleared_chat_${matchId}`);
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });

  const messages: Message[] = React.useMemo(() => {
    if (!liveMessages) return [];
    return liveMessages
      .filter(m => {
        const msgTime = new Date(m.created_at).getTime();
        return msgTime > clearedAt && !deletedIds.has(m.id);
      })
      .map(m => ({
      id: m.id,
      senderId: m.sender_id,
      text: m.text,
      timestamp: m.created_at,
      isSystem: m.is_system,
      isRead: m.is_read,
      status: m.status,
      reaction: m.reaction
    }));
  }, [liveMessages]);

  const activeGame = React.useMemo(() => {
    if (!messages || messages.length === 0) return null;
    for (let i = messages.length - 1; i >= 0; i--) {
      const msg = messages[i];
      if (msg.text.startsWith('[GAME:2TL:v1]')) {
        try {
          const state: TwoTruthsLieState = JSON.parse(msg.text.replace('[GAME:2TL:v1] ', ''));
          if (state.status === 'active') {
            return { type: '2TL' as const, messageId: msg.id, state };
          }
        } catch (e) {
          console.error("Error parsing 2TL active state:", e);
        }
      } else if (msg.text.startsWith('[GAME:WYR:v1]')) {
        try {
          const state: WouldYouRatherState = JSON.parse(msg.text.replace('[GAME:WYR:v1] ', ''));
          const totalVotes = Object.keys(state.votes).length;
          if (totalVotes < 2) {
            return { type: 'WYR' as const, messageId: msg.id, state };
          }
        } catch (e) {
          console.error("Error parsing WYR active state:", e);
        }
      }
    }
    return null;
  }, [messages]);

  // Loading is only true if we don't have a partner yet. Messages load instantly from Dexie.
  const [loading, setLoading] = useState(true);

  const partnerRef = useRef(partner);
  useEffect(() => { partnerRef.current = partner; }, [partner]);

  useEffect(() => {
    return () => {
      if (matchId) {
        sessionStorage.setItem('last_viewed_match_id', matchId);
      }
    };
  }, [matchId]);

  const { currentUser } = useAuth();
  const { startCall, setOutgoingCall, setOutgoingCallSessionId, isCallActive } = useCall();
  const { subscribeToUser, unsubscribeFromUser, isUserOnline, getLastSeen } = usePresence();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [newMessage, setNewMessage] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [wallpaper, setWallpaper] = useState<'midnight' | 'cyberpunk' | 'nebula' | 'slate'>(() => {
    try {
      const saved = localStorage.getItem('othrhalff_chat_wallpaper');
      return (saved as any) || 'midnight';
    } catch {
      return 'midnight';
    }
  });
  const [showScrollBottom, setShowScrollBottom] = useState(false);

  const changeWallpaper = (w: 'midnight' | 'cyberpunk' | 'nebula' | 'slate') => {
    setWallpaper(w);
    try {
      localStorage.setItem('othrhalff_chat_wallpaper', w);
    } catch (e) {
      console.error(e);
    }
  };

  const handleMessageDoubleClick = async (msgId: string, currentReaction?: string) => {
    const newReaction = currentReaction === '❤️' ? undefined : '❤️';
    try {
      await db.messages.update(msgId, { reaction: newReaction });
    } catch (err) {
      console.error('Failed to update message reaction in local DB:', err);
    }
  };
  const [isStartingCall, setIsStartingCall] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [isBlockedByThem, setIsBlockedByThem] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [oldestLoaded, setOldestLoaded] = useState<number | null>(null);

  const [confirmModal, setConfirmModal] = useState({ isOpen: false, title: '', message: '', confirmLabel: 'Confirm', isDestructive: false, onConfirm: () => { } });
  const [permissionModal, setPermissionModal] = useState({ isOpen: false, type: 'video' as 'audio' | 'video', onGranted: () => { } });

  const [partnerIsTyping, setPartnerIsTyping] = useState(false);
  const [showGamesDrawer, setShowGamesDrawer] = useState(false);
  const [selectedGame, setSelectedGame] = useState<'none' | '2tl' | 'wyr'>('none');
  const [twoTruths1, setTwoTruths1] = useState('');
  const [twoTruths2, setTwoTruths2] = useState('');
  const [oneLie, setOneLie] = useState('');
  const [customWyrQuestion, setCustomWyrQuestion] = useState('');
  const [customWyrA, setCustomWyrA] = useState('');
  const [customWyrB, setCustomWyrB] = useState('');
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const channelRef = useRef<any>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const closeConfirmModal = () => setConfirmModal(prev => ({ ...prev, isOpen: false }));
  const showConfirm = (title: string, message: string, onConfirm: () => void, isDestructive = false, confirmLabel = 'Confirm') => {
    setConfirmModal({ isOpen: true, title, message, confirmLabel, isDestructive, onConfirm: () => { onConfirm(); closeConfirmModal(); } });
  };

  useEffect(() => {
    const preventScreenshot = (e: Event) => { e.preventDefault(); return false; };
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'PrintScreen' || (e.metaKey && e.shiftKey && (e.key === '4' || e.key === '5')) || (e.key === 's' && e.shiftKey && e.metaKey)) { e.preventDefault(); showToast('Screenshots are disabled', 'warning'); } };
    const container = chatContainerRef.current;
    if (container) { container.addEventListener('contextmenu', preventScreenshot); document.addEventListener('keydown', handleKeyDown); return () => { container.removeEventListener('contextmenu', preventScreenshot); document.removeEventListener('keydown', handleKeyDown); }; }
  }, []);

  // Initial Load
  useEffect(() => {
    if (!currentUser || !matchId || !supabase) return;

    let initialPartner: MatchProfile | null = null;
    let cacheTime = 0;
    // 1. Check Chat Cache in sessionStorage (Only for Partner Data now, Dexie handles messages)
    try {
      const c = sessionStorage.getItem(cacheKey);
      if (c) {
        const parsed = JSON.parse(c);
        initialPartner = parsed.partner || null;
        cacheTime = parsed.timestamp || 0;
      }
    } catch (e) {
      console.error(e);
    }

    // 2. Fallback: Check matches cache in localStorage
    if (!initialPartner) {
      try {
        const cachedMatchesStr = localStorage.getItem('otherhalf_matches_cache_v6');
        if (cachedMatchesStr) {
          const cachedMatches = JSON.parse(cachedMatchesStr);
          const foundMatch = cachedMatches.find((m: any) => m.id === matchId);
          if (foundMatch && foundMatch.partner) {
            initialPartner = foundMatch.partner;
          }
        }
      } catch (e) {
        console.error(e);
      }
    }

    if (initialPartner) {
      setPartner(initialPartner);
      subscribeToUser(initialPartner.id);
      setLoading(false);
    }
    // Auto-scroll to bottom if Dexie loaded messages instantly
    setTimeout(() => messagesEndRef.current?.scrollIntoView(), 50);

    const loadInitialData = async () => {
      try {
        // Fetch match data to perform authorization guard and find partner ID if missing
        const { data: matchData, error: matchError } = await supabase.from('matches').select('user_a, user_b').eq('id', matchId).single();
        if (matchError || !matchData) { navigate.push('/matches'); return; }
        
        // Client-side authorization guard: check if user is actually in this match
        if (matchData.user_a !== currentUser.id && matchData.user_b !== currentUser.id) {
          navigate.push('/matches');
          return;
        }

        let partnerId = initialPartner?.id;

        // Fetch partner ID if totally missing (direct link load)
        if (!partnerId) {
          partnerId = matchData.user_a === currentUser.id ? matchData.user_b : matchData.user_a;

          // If we had to fetch ID, we must fetch profile to show anything
          const { data: profile } = await supabase.from('profiles').select('id, real_name, anonymous_id, avatar, is_verified').eq('id', partnerId).single();
          if (profile) {
            const newPartner = {
              id: profile.id, anonymousId: profile.anonymous_id, realName: profile.real_name,
              gender: '', university: '', branch: '',
              year: '', interests: [], bio: '',
              dob: '', isVerified: profile.is_verified, avatar: profile.avatar,
              matchPercentage: 0, distance: 'Connected'
            };
            setPartner(newPartner);
            subscribeToUser(partnerId!);
            partnerId = newPartner.id;
          }
        } else {
          // We have a partner (from State/Cache). 
          // Refresh profile in BACKGROUND (Fire & Forget) to keep clear of stale data if cache is > 5 mins old
          const shouldRefreshProfile = !cacheTime || (Date.now() - cacheTime > 5 * 60 * 1000);
          
          if (shouldRefreshProfile) {
            supabase.from('profiles').select('id, real_name, anonymous_id, avatar, is_verified').eq('id', partnerId).single().then(({ data: profile }) => {
              if (profile) {
                setPartner(prev => {
                  if (!prev) return prev;
                  const updated = {
                    ...prev,
                    realName: profile.real_name,
                    anonymousId: profile.anonymous_id,
                    avatar: profile.avatar,
                    isVerified: profile.is_verified
                  };
                  // Only update if changed (simple check)
                  if (JSON.stringify(prev) !== JSON.stringify(updated)) {
                    try { sessionStorage.setItem(cacheKey, JSON.stringify({ partner: updated, timestamp: Date.now() })); } catch (e) { }
                    return updated;
                  }
                  return prev;
                });
              }
            });
          }
        }

        // Parallel Fetch: Messages + Block Status
        if (partnerId) {
          // 1. Retrieve the latest local message timestamp to perform delta sync
          const localMessages = await db.messages.where('[match_id+created_at]').between([matchId, Dexie.minKey], [matchId, Dexie.maxKey]).toArray();
          const latestLocalMsg = localMessages.length > 0 ? localMessages[localMessages.length - 1] : null;
          
          let messagesQuery;
          if (latestLocalMsg) {
            messagesQuery = supabase.from('messages')
              .select('id, sender_id, text, created_at, is_read')
              .eq('match_id', matchId)
              .gt('created_at', new Date(latestLocalMsg.created_at).toISOString())
              .order('created_at', { ascending: false });
          } else {
            messagesQuery = supabase.from('messages')
              .select('id, sender_id, text, created_at, is_read')
              .eq('match_id', matchId)
              .order('created_at', { ascending: false })
              .limit(MESSAGES_PER_PAGE);
          }

          const [blockStatus, messagesRes] = await Promise.all([
            checkBlockStatus(partnerId, currentUser.id),
            messagesQuery
          ]);

          setIsBlocked(blockStatus.isBlocked); setIsBlockedByThem(blockStatus.isBlockedBy);

          if (messagesRes.data && messagesRes.data.length > 0) {
            const localMsgs: LocalMessage[] = messagesRes.data.map((m: any) =>
              mapSupabaseMessageToLocal(m, matchId)
            );
            
            // Sync to Dexie in background
            try {
              await db.messages.bulkPut(localMsgs);
            } catch (dbErr) {
              console.error('Failed to sync initial messages to local DB:', dbErr);
            }
          }

          // 2. Compute final scroll positioning and paging index using combined database state
          const updatedLocalMessages = await db.messages.where('[match_id+created_at]').between([matchId, Dexie.minKey], [matchId, Dexie.maxKey]).toArray();
          if (updatedLocalMessages.length > 0) {
            setOldestLoaded(updatedLocalMessages[0].created_at);
            // If delta query returned full page limit, we might have more remote messages, otherwise we are up to date
            setHasMoreMessages(latestLocalMsg ? true : updatedLocalMessages.length >= MESSAGES_PER_PAGE);
            setTimeout(() => messagesEndRef.current?.scrollIntoView(), 100);
          } else {
            setHasMoreMessages(false);
          }

          // Update cache with latest partner (possibly updated)
          const currentPartner = partnerRef.current || initialPartner;
          if (currentPartner) {
            try { sessionStorage.setItem(cacheKey, JSON.stringify({ partner: currentPartner, timestamp: Date.now() })); } catch (e) { }
          }
        }

      } catch (err) { console.error('Error loading chat:', err); } finally { setLoading(false); }
    };

    loadInitialData();
    return () => { if (partnerRef.current) unsubscribeFromUser(partnerRef.current.id); };
  }, [matchId, currentUser]);

  // === FIX BUG 3: Use Ref for markMessagesRead ===
  // This prevents stale closure in the realtime listener
  const markMessagesRead = async () => {
    if (!matchId || !currentUser) return;
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('match_id', matchId)
      .neq('sender_id', currentUser.id)
      .eq('is_read', false);
  };

  const markMessagesReadRef = useRef(markMessagesRead);
  useEffect(() => { markMessagesReadRef.current = markMessagesRead; });

  // Mark on mount
  useEffect(() => {
    if (!matchId || !currentUser) return;
    markMessagesReadRef.current();
  }, [matchId, currentUser?.id]);

  const loadMoreMessages = async () => {
    if (!hasMoreMessages || isLoadingMore || !matchId || oldestLoaded === null) return;
    setIsLoadingMore(true);
    try {
      const { data: msgData } = await supabase.from('messages')
        .select('id, sender_id, text, created_at, is_read')
        .eq('match_id', matchId)
        .lt('created_at', new Date(oldestLoaded).toISOString())
        .order('created_at', { ascending: false })
        .limit(MESSAGES_PER_PAGE);

      if (msgData && msgData.length > 0) {
        const localMsgs: LocalMessage[] = msgData.map((m: any) =>
          mapSupabaseMessageToLocal(m, matchId)
        );
        try {
          await db.messages.bulkPut(localMsgs);
        } catch (dbErr) {
          console.error('Failed to sync paginated messages to local DB:', dbErr);
        }
        setOldestLoaded(new Date(msgData[msgData.length - 1].created_at).getTime());
        setHasMoreMessages(msgData.length === MESSAGES_PER_PAGE);
      } else setHasMoreMessages(false);
    } catch (err) { console.error(err); } finally { setIsLoadingMore(false); }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const container = e.currentTarget;
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 300;
    setShowScrollBottom(!isNearBottom);

    if (container.scrollTop === 0 && hasMoreMessages && !isLoadingMore) {
      const oldScrollHeight = container.scrollHeight;
      loadMoreMessages().then(() => { requestAnimationFrame(() => { container.scrollTop = container.scrollHeight - oldScrollHeight; }); });
    }
  };

  // Realtime
  useEffect(() => {
    // Use a unique channel name for every mount to avoid React Strict Mode race conditions during cleanup
    const uniqueChannelName = `chat_turbo_${matchId}_${Math.random().toString(36).substring(7)}`;
    const channel = supabase.channel(uniqueChannelName)
      .on('postgres_changes', {
        event: '*', // Listen to INSERT and UPDATE
        schema: 'public',
        table: 'messages',
        filter: `match_id=eq.${matchId}`
      }, (payload) => {
        if (!payload.new) return;

        if (payload.eventType === 'UPDATE') {
          const updatedMsg = payload.new;
          db.messages.update(updatedMsg.id, { 
            is_read: updatedMsg.is_read,
            text: updatedMsg.text ? updatedMsg.text.replace('[SYSTEM]', '').trim() : undefined,
            reaction: updatedMsg.reaction || undefined
          }).catch(dbErr => {
            console.error('Failed to update message in local DB on UPDATE:', dbErr);
          });
          return;
        }

        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new;
          const localMsg = mapSupabaseMessageToLocal(newMsg, matchId);

          // Block enforcement: ignore messages from blocked users
          if (newMsg.sender_id !== currentUser?.id) {
            if (isBlocked || isBlockedByThem) return; // Don't show messages if blocked
            markMessagesReadRef.current();
          }

          db.messages.put(localMsg).then(() => {
             // Auto-scroll logic if they are near bottom
             const container = chatContainerRef.current;
             if (container && container.scrollHeight - container.scrollTop - container.clientHeight < 100) {
               setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
             }
          }).catch(dbErr => {
            console.error('Failed to insert new message into local DB:', dbErr);
          });
        }
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.userId === partnerRef.current?.id) {
          setPartnerIsTyping(payload.payload.isTyping);
        }
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [matchId]);

  const handleInputChange = (val: string) => {
    setNewMessage(val);
    if (!channelRef.current || !currentUser || channelRef.current.state !== 'joined') return;

    // Send typing: true
    channelRef.current.send({
      type: 'broadcast',
      event: 'typing',
      payload: { userId: currentUser.id, isTyping: true }
    });

    // Reset timeout to broadcast typing = false after 1.5s
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (channelRef.current && currentUser && channelRef.current.state === 'joined') {
        channelRef.current.send({
          type: 'broadcast',
          event: 'typing',
          payload: { userId: currentUser.id, isTyping: false }
        });
      }
    }, 1500);
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      // 1. Hide locally for this device regardless of who sent it
      const newDeleted = new Set(deletedIds);
      newDeleted.add(msgId);
      setDeletedIds(newDeleted);
      localStorage.setItem(`deleted_messages_${matchId}`, JSON.stringify(Array.from(newDeleted)));

      // 2. Also try to delete from Supabase if we sent it (optional, to permanently remove it from server)
      const msg = liveMessages?.find(m => m.id === msgId);
      if (msg && msg.sender_id === currentUser?.id) {
        await supabase.from('messages').delete().eq('id', msgId);
      }
      
      // 3. Remove from local Dexie database
      await db.messages.delete(msgId);
    } catch (e) {
      console.error('Error deleting message:', e);
    }
  };

  const handleClearChat = async () => {
    showConfirm(
      'Clear Chat',
      'Are you sure you want to clear this chat? This will remove all messages from your view only.',
      async () => {
        try {
          // 1. Hide locally for this device by setting a timestamp
          const now = Date.now();
          setClearedAt(now);
          localStorage.setItem(`cleared_chat_${matchId}`, now.toString());

          // 2. Clear our own messages from Supabase (if they ran the SQL policy)
          const myMessages = await db.messages.where('match_id').equals(matchId)
            .filter(m => m.sender_id === currentUser?.id)
            .toArray();
          const myMsgIds = myMessages.map(m => m.id);

          if (myMsgIds.length > 0) {
            await supabase.from('messages').delete().in('id', myMsgIds);
          }

          // 3. Bulk delete everything from local Dexie DB to save space
          const allMsgs = await db.messages.where('match_id').equals(matchId).toArray();
          await db.messages.bulkDelete(allMsgs.map(m => m.id));

        } catch (e) {
          console.error('Error clearing chat:', e);
        }
      },
      true,
      'Clear Chat'
    );
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault(); if (!newMessage.trim() || !currentUser || !matchId || isBlocked || isBlockedByThem) return;
    
    // Clear typing indicator immediately
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    if (channelRef.current && channelRef.current.state === 'joined') {
      channelRef.current.send({
        type: 'broadcast',
        event: 'typing',
        payload: { userId: currentUser.id, isTyping: false }
      });
    }

    const textToSend = newMessage.trim(); setNewMessage('');
    
    // 1. Instantly create a temporary message object & save to local Dexie
    const optimisticId = `temp-${Date.now()}`;
    const optimisticLocal: LocalMessage = {
      id: optimisticId,
      match_id: matchId,
      sender_id: currentUser.id,
      text: textToSend,
      created_at: Date.now(),
      is_system: false,
      is_read: false,
      status: 'sending'
    };
    
    let localSaved = false;
    try {
      await db.messages.put(optimisticLocal);
      localSaved = true;
    } catch (dbErr) {
      console.error('Failed to write optimistic message to local DB:', dbErr);
    }
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    // 2. Run asynchronous background push
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({ match_id: matchId, sender_id: currentUser.id, text: textToSend })
        .select()
        .single();
        
      if (error) throw error;
      if (data) {
        // 3. Delete the temp message and insert the real one from Supabase into Dexie
        if (localSaved) {
          try {
            await db.transaction('rw', db.messages, async () => {
              await db.messages.delete(optimisticId);
              const existing = await db.messages.get(data.id);
              await db.messages.put({
                ...mapSupabaseMessageToLocal(data, matchId),
                is_read: existing ? existing.is_read : data.is_read
              });
            });
          } catch (dbErr) {
            console.error('Failed to sync message to local DB:', dbErr);
          }
        } else {
          try {
            await db.messages.put(mapSupabaseMessageToLocal(data, matchId));
          } catch (dbErr) {
            console.error('Failed to write final message to local DB:', dbErr);
          }
        }
      }
      analytics.messageSent();
    } catch (sendErr) { 
      console.error('Failed to send message:', sendErr);
      if (localSaved) {
        try {
          await db.messages.update(optimisticId, { status: 'failed' });
        } catch (dbErr) {
          console.error('Failed to mark message as failed in local DB:', dbErr);
        }
      } 
      showToast('Failed to send', 'error'); 
    }
  };

  const sendGameMessage = async (textToSend: string) => {
    if (!currentUser || !matchId || isBlocked || isBlockedByThem) return;
    
    const optimisticId = `temp-${Date.now()}`;
    const optimisticLocal: LocalMessage = {
      id: optimisticId,
      match_id: matchId,
      sender_id: currentUser.id,
      text: textToSend,
      created_at: Date.now(),
      is_system: false,
      is_read: false,
      status: 'sending'
    };
    
    let localSaved = false;
    try {
      await db.messages.put(optimisticLocal);
      localSaved = true;
    } catch (dbErr) {
      console.error('Failed to write optimistic game message to local DB:', dbErr);
    }
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50);

    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({ match_id: matchId, sender_id: currentUser.id, text: textToSend })
        .select()
        .single();
        
      if (error) throw error;
      if (data) {
        if (localSaved) {
          try {
            await db.transaction('rw', db.messages, async () => {
              await db.messages.delete(optimisticId);
              const existing = await db.messages.get(data.id);
              await db.messages.put({
                ...mapSupabaseMessageToLocal(data, matchId),
                is_read: existing ? existing.is_read : data.is_read
              });
            });
          } catch (dbErr) {
            console.error('Failed to sync game message to local DB:', dbErr);
          }
        } else {
          try {
            await db.messages.put(mapSupabaseMessageToLocal(data, matchId));
          } catch (dbErr) {
            console.error('Failed to write final game message to local DB:', dbErr);
          }
        }
      }
    } catch (sendErr) { 
      console.error('Failed to send game message:', sendErr);
      if (localSaved) {
        try {
          await db.messages.update(optimisticId, { status: 'failed' });
        } catch (dbErr) {
          console.error('Failed to mark game message as failed in local DB:', dbErr);
        }
      } 
      showToast('Failed to send game', 'error'); 
    }
  };

  const sendGame2TL = async () => {
    if (!twoTruths1.trim() || !twoTruths2.trim() || !oneLie.trim()) return;
    
    const options = shuffleArray([twoTruths1.trim(), twoTruths2.trim(), oneLie.trim()]);
    const lieHash = hashString(oneLie.trim());
    
    const payload: TwoTruthsLieState = {
      creatorId: currentUser!.id,
      options,
      lieHash,
      status: 'active'
    };
    
    const text = `[GAME:2TL:v1] ${JSON.stringify(payload)}`;
    await sendGameMessage(text);
    
    setTwoTruths1('');
    setTwoTruths2('');
    setOneLie('');
    setSelectedGame('none');
    setShowGamesDrawer(false);
  };

  const sendGameWYR = async (templateQuestion?: string, templateA?: string, templateB?: string) => {
    let question = '';
    let optionA = '';
    let optionB = '';
    
    if (templateQuestion && templateA && templateB) {
      question = templateQuestion;
      optionA = templateA;
      optionB = templateB;
    } else {
      if (!customWyrQuestion.trim() || !customWyrA.trim() || !customWyrB.trim()) return;
      question = customWyrQuestion.trim();
      optionA = customWyrA.trim();
      optionB = customWyrB.trim();
    }
    
    const payload: WouldYouRatherState = {
      question,
      optionA,
      optionB,
      votes: {}
    };
    
    const text = `[GAME:WYR:v1] ${JSON.stringify(payload)}`;
    await sendGameMessage(text);
    
    setCustomWyrQuestion('');
    setCustomWyrA('');
    setCustomWyrB('');
    setSelectedGame('none');
    setShowGamesDrawer(false);
  };

  const handleGuess2TL = async (msgId: string, currentState: TwoTruthsLieState, guessedOpt: string) => {
    const isCorrect = hashString(guessedOpt) === currentState.lieHash;
    const updatedState: TwoTruthsLieState = {
      ...currentState,
      guess: guessedOpt,
      guessedCorrectly: isCorrect,
      status: 'completed'
    };
    
    const serialized = `[GAME:2TL:v1] ${JSON.stringify(updatedState)}`;
    
    try {
      await db.messages.update(msgId, { text: serialized });
      
      const { error } = await supabase
        .from('messages')
        .update({ text: serialized })
        .eq('id', msgId);
        
      if (error) throw error;
    } catch (err) {
      console.error("Failed to submit 2TL guess:", err);
      showToast("Failed to guess", "error");
    }
  };

  const handleVoteWYR = async (msgId: string, currentState: WouldYouRatherState, option: 'A' | 'B') => {
    if (!currentUser) return;
    const updatedVotes = {
      ...currentState.votes,
      [currentUser.id]: option
    };
    const updatedState: WouldYouRatherState = {
      ...currentState,
      votes: updatedVotes
    };
    
    const serialized = `[GAME:WYR:v1] ${JSON.stringify(updatedState)}`;
    
    try {
      await db.messages.update(msgId, { text: serialized });
      
      const { error } = await supabase
        .from('messages')
        .update({ text: serialized })
        .eq('id', msgId);
        
      if (error) throw error;
    } catch (err) {
      console.error("Failed to submit WYR vote:", err);
      showToast("Failed to vote", "error");
    }
  };

  const startVideoCall = async (type: 'audio' | 'video' = 'video') => { if (!partner || isStartingCall || !matchId || isCallActive || isBlocked || isBlockedByThem) return; isUserOnline(partner.id) ? proceedWithCallCheck(type) : showConfirm('User Offline', `Call anyway?`, () => proceedWithCallCheck(type), false, 'Call'); };
  const proceedWithCallCheck = (type: 'audio' | 'video') => setPermissionModal({ isOpen: true, type, onGranted: () => { setPermissionModal(prev => ({ ...prev, isOpen: false })); proceedWithCall(type); } });
  const proceedWithCall = async (type: 'audio' | 'video') => {
    if (!partner || !matchId || !currentUser) return; setIsStartingCall(true);
    try { if (await checkUserBusy(partner.id, currentUser.id)) { showToast(`${partner.realName} busy`, 'info'); setIsStartingCall(false); return; } } catch { }
    setOutgoingCall({ receiverName: partner.realName, receiverAvatar: partner.avatar || '', callType: type });
    try {
      const s = await initiateCall(partner.id, matchId, { id: currentUser.id, name: currentUser.realName, avatar: currentUser.avatar || '', callType: type });
      if (!s) throw new Error('Fail');
      setOutgoingCallSessionId(s.id);
      const t = setTimeout(async () => { setOutgoingCall(null); setOutgoingCallSessionId(''); setIsStartingCall(false); showToast('No answer', 'info'); await insertSystemMessage('📞 Missed Call'); }, 30000);
      const ch = supabase.channel(`call:${s.id}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'call_sessions', filter: `id=eq.${s.id}` }, async (payload: any) => {
        if (payload.new.status === 'active') { clearTimeout(t); supabase.removeChannel(ch); startCall(partner.realName, partner.avatar || '', s.app_id, s.channel_name, s.token, type, s.id); setIsStartingCall(false); }
        else if (payload.new.status === 'rejected') { clearTimeout(t); supabase.removeChannel(ch); setOutgoingCall(null); setIsStartingCall(false); showToast('Declined', 'info'); await insertSystemMessage('📞 Call Declined'); }
      }).subscribe();
    } catch { showToast('Call failed', 'error'); setOutgoingCall(null); setOutgoingCallSessionId(''); setIsStartingCall(false); }
  };
  const insertSystemMessage = async (text: string) => { if (!currentUser || !matchId) return; try { await supabase.from('messages').insert({ match_id: matchId, sender_id: currentUser.id, text: text.startsWith('📞') ? text : `[SYSTEM] ${text}` }); } catch { } };
  const handleBlockUser = () => { if (!partner) return; showConfirm(isBlocked ? 'Unblock User' : 'Block User', isBlocked ? `Are you sure you want to unblock ${partner.realName || partner.anonymousId}? They will be able to message and call you again.` : `Are you sure you want to block ${partner.realName || partner.anonymousId}? They won't be able to send you messages or call you. You can unblock them anytime.`, async () => { if (isBlocked ? await unblockUser(partner.id) : await blockUser(partner.id)) { setIsBlocked(!isBlocked); setShowMenu(false); showToast(isBlocked ? 'User unblocked' : 'User blocked', 'success'); } }, !isBlocked, isBlocked ? 'Unblock' : 'Block'); };

  if (loading) return <ChatSkeleton />;
  if (!partner) return null;

  return (
    <div className={`h-full w-full flex flex-col relative overflow-hidden transition-all duration-500 ${
      wallpaper === 'midnight' ? 'bg-[#06020a]' :
      wallpaper === 'cyberpunk' ? 'bg-[#030008]' :
      wallpaper === 'nebula' ? 'bg-[#010508]' :
      'bg-[#0a0a0f]'
    }`}>
      {/* Background Animated Gradient Blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {wallpaper === 'midnight' && (
          <>
            <div className="absolute top-[10%] left-[15%] w-96 h-96 rounded-full bg-gradient-to-br from-[#8a2be2] to-[#4b0082] opacity-[0.22] blur-[100px] animate-float-1" />
            <div className="absolute bottom-[20%] right-[10%] w-[450px] h-[450px] rounded-full bg-gradient-to-br from-[#ff007f] to-[#800080] opacity-[0.16] blur-[120px] animate-float-2" />
          </>
        )}
        {wallpaper === 'cyberpunk' && (
          <>
            <div className="absolute top-[20%] right-[15%] w-80 h-80 rounded-full bg-[#ff007f] opacity-[0.14] blur-[90px] animate-float-1" />
            <div className="absolute bottom-[15%] left-[20%] w-[400px] h-[400px] rounded-full bg-[#00ffff] opacity-[0.14] blur-[110px] animate-float-2" />
          </>
        )}
        {wallpaper === 'nebula' && (
          <>
            <div className="absolute top-[5%] right-[25%] w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-[#008080] to-[#0000ff] opacity-[0.18] blur-[120px] animate-float-1" />
            <div className="absolute bottom-[25%] left-[10%] w-96 h-96 rounded-full bg-gradient-to-br from-[#00ffff] to-[#7fffd4] opacity-[0.14] blur-[100px] animate-float-2" />
          </>
        )}
        {wallpaper === 'slate' && (
          <>
            <div className="absolute top-[15%] left-[25%] w-96 h-96 rounded-full bg-[#da70d6] opacity-[0.1] blur-[110px] animate-float-1" />
            <div className="absolute bottom-[30%] right-[20%] w-[380px] h-[380px] rounded-full bg-[#afeeee] opacity-[0.1] blur-[100px] animate-float-2" />
          </>
        )}
      </div>

      <ConfirmationModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} confirmLabel={confirmModal.confirmLabel} isDestructive={confirmModal.isDestructive} onConfirm={confirmModal.onConfirm} onCancel={closeConfirmModal} />
      <PermissionModal isOpen={permissionModal.isOpen} onPermissionsGranted={permissionModal.onGranted} onCancel={() => setPermissionModal(prev => ({ ...prev, isOpen: false }))} requiredPermissions={permissionModal.type === 'video' ? ['camera', 'microphone'] : ['microphone']} />

      {/* Main Split Layout Container */}
      <div className="flex-1 flex flex-row overflow-hidden w-full relative z-10">
        {/* Left Column: Chat Workspace */}
        <div className="flex-1 flex flex-col min-w-0 h-full relative z-10">
          <div className="flex-none px-4 py-3 bg-black/40 backdrop-blur-md border-b border-gray-850/80 flex items-center justify-between z-20">
        <div className="flex items-center gap-3"><button onClick={() => {
          // Pass back the latest message to update the list instantly
          const lastMsg = messages.length > 0 ? messages[messages.length - 1] : null;
          navigate.push('/matches');
        }} aria-label="Back to matches" className="p-2 -ml-2 text-gray-400 hover:text-white rounded-full hover:bg-gray-800"><ArrowLeft className="w-5 h-5" aria-hidden="true" /></button><div className="relative"><img src={getOptimizedUrl(partner.avatar, 64)} className="w-10 h-10 rounded-full border border-gray-700 object-cover" alt={`${partner.realName || partner.anonymousId}'s avatar`} /><div className={`absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-black ${isUserOnline(partner.id) ? 'bg-green-500' : 'bg-gray-500'}`}></div></div><div><div className="flex items-center gap-1"><h3 className="text-sm font-bold text-white">{partner.realName || partner.anonymousId}</h3>{partner.isVerified && (<BadgeCheck className="w-3.5 h-3.5 flex-shrink-0 drop-shadow-[0_0_4px_rgba(96,165,250,0.8)]" style={{ color: '#60a5fa' }} aria-hidden="true" />)}</div><span className="text-[10px] text-gray-500">{isUserOnline(partner.id) ? <span className="text-green-400">Active</span> : (getLastSeen(partner.id) ? (new Date().getTime() - getLastSeen(partner.id)!.getTime() < 60000 ? 'just now' : getLastSeen(partner.id)?.toLocaleDateString()) : 'Offline')}</span></div></div>
        <div className="flex items-center gap-1"><button onClick={() => startVideoCall('video')} disabled={isStartingCall || isBlocked || isBlockedByThem} aria-label="Start video call" className={`p-2.5 hover:bg-gray-800 rounded-full ${isBlocked || isBlockedByThem ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-neon'}`}><Video className="w-5 h-5" aria-hidden="true" /></button><button onClick={() => startVideoCall('audio')} disabled={isStartingCall || isBlocked || isBlockedByThem} aria-label="Start voice call" className={`p-2.5 hover:bg-gray-800 rounded-full ${isBlocked || isBlockedByThem ? 'text-gray-700 cursor-not-allowed' : 'text-gray-400 hover:text-green-400'}`}><Phone className="w-5 h-5" aria-hidden="true" /></button>
          <div className="relative">
            <button onClick={() => setShowMenu(!showMenu)} aria-label="More options" aria-expanded={showMenu} className="p-2.5 text-gray-400 hover:text-white hover:bg-gray-800 rounded-full"><MoreVertical className="w-5 h-5" aria-hidden="true" /></button>
            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 top-12 z-50 w-48 bg-gray-900 border border-gray-700 rounded-xl shadow-xl overflow-hidden">
                  <button onClick={() => { navigate.push(`/profile/${partner.id}`); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800"><User className="w-4 h-4" /> View Profile</button>
                  <button onClick={() => { setShowMenu(false); handleClearChat(); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-400 hover:bg-gray-800 border-b border-gray-800/50"><Trash2 className="w-4 h-4" /> Clear Chat</button>
                  <button onClick={() => { setShowMenu(false); handleBlockUser(); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-gray-300 hover:bg-gray-800"><Ban className="w-4 h-4" /> {isBlocked ? 'Unblock' : 'Block'}</button>
                  <button onClick={() => { navigate.push(`/contact?reportUserId=${partner.id}&reportUserName=${partner.realName || partner.anonymousId}`); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-400 hover:bg-gray-800"><AlertTriangle className="w-4 h-4" /> Report</button>
                  <div className="border-t border-gray-800 px-4 py-2.5">
                    <span className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Chat Theme</span>
                    <div className="flex gap-2 mt-2">
                      {(['midnight', 'cyberpunk', 'nebula', 'slate'] as const).map(w => (
                        <button
                          key={w}
                          onClick={() => changeWallpaper(w)}
                          title={w.charAt(0).toUpperCase() + w.slice(1)}
                          className={`w-6 h-6 rounded-full border transition-all ${
                            wallpaper === w ? 'border-neon scale-110 shadow-[0_0_8px_rgba(255,0,127,0.5)]' : 'border-gray-700 hover:border-gray-500'
                          }`}
                          style={{
                            background: 
                              w === 'midnight' ? 'linear-gradient(135deg, #8a2be2, #4b0082)' :
                              w === 'cyberpunk' ? 'linear-gradient(135deg, #ff007f, #00ffff)' :
                              w === 'nebula' ? 'linear-gradient(135deg, #008080, #0000ff)' :
                              'linear-gradient(135deg, #da70d6, #afeeee)'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
      <div ref={chatContainerRef} className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4" onScroll={handleScroll}>
        {isLoadingMore && <div className="flex justify-center"><Loader2 className="w-5 h-5 text-gray-500 animate-spin" /></div>}
        <div className="mb-4 bg-gradient-to-r from-blue-900/10 to-purple-900/10 border border-blue-800/20 rounded-2xl p-3 backdrop-blur-sm flex gap-3"><div className="p-2 bg-blue-600/10 rounded-full h-fit"><Shield className="w-4 h-4 text-blue-400" /></div><div><h4 className="text-xs font-bold text-blue-400 flex items-center gap-2"><Clock className="w-3 h-3" /> Privacy Active</h4><p className="text-[11px] text-gray-400">Messages deleted after 3 days. Screenshots disabled.</p></div></div>
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[50vh] opacity-75 text-center px-4">
            <Ghost className="w-10 h-10 text-gray-600 mb-3" />
            <p className="text-sm text-gray-300 font-medium">No messages yet.</p>
            <div className="mt-3 p-3 bg-purple-950/10 border border-purple-500/10 rounded-2xl max-w-xs text-[11px] text-gray-400 leading-relaxed backdrop-blur-sm">
              <span className="text-purple-400 font-bold flex items-center gap-1 inline-flex">
                <Lightbulb className="w-3.5 h-3.5 text-purple-400" />
                <span>Icebreaker Hint:</span>
              </span> Tap the <Gamepad2 className="w-3.5 h-3.5 inline mx-0.5 text-neon" /> icon below to play <span className="text-white font-semibold">2 Truths & a Lie</span> to kickstart your chat!
            </div>
          </div>
        )}
        {messages.map((msg, i) => {
          const isMe = msg.senderId === currentUser?.id;
          if (msg.isSystem && msg.text.startsWith('[INVITE:v1]')) {
            try {
              const inviteData = JSON.parse(msg.text.replace('[INVITE:v1] ', ''));
              
              // Validate that invite type is whitelisted and URL pattern is safe
              const isValidType = inviteData.type === 'cinema' || inviteData.type === 'music';
              const isValidUrl = typeof inviteData.url === 'string' && (
                inviteData.url.startsWith('/sparx/cinema') || 
                inviteData.url.startsWith('/sparx/music')
              );
              
              if (!isValidType || !isValidUrl) {
                throw new Error('Invalid invite message type or URL');
              }

              const isCinema = inviteData.type === 'cinema';
              const Icon = isCinema ? Tv : Music;
              const buttonText = isCinema ? 'Join Watch Party' : 'Join Music Session';
              const inviteTitle = isCinema ? 'Cinema Date Watch Party' : 'Music Jam Session';
              
              const shadowClass = isCinema 
                ? 'shadow-[0_0_15px_rgba(244,63,94,0.15)] hover:shadow-[0_0_20px_rgba(244,63,94,0.3)] border-rose-500/30 hover:border-rose-400/60'
                : 'shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] border-cyan-500/30 hover:border-cyan-400/60';
              const glowBg = isCinema ? 'bg-rose-500/10' : 'bg-cyan-500/10';
              const textClass = isCinema ? 'text-rose-400 font-mono' : 'text-cyan-400 font-mono';
              const iconBgClass = isCinema ? 'bg-rose-500/15 border border-rose-500/20' : 'bg-cyan-500/15 border border-cyan-500/20';
              const iconColorClass = isCinema ? 'text-rose-400' : 'text-cyan-400';
              const btnClass = isCinema
                ? 'bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 shadow-[0_0_10px_rgba(244,63,94,0.3)] hover:shadow-[0_0_15px_rgba(244,63,94,0.5)]'
                : 'bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 shadow-[0_0_10px_rgba(6,182,212,0.3)] hover:shadow-[0_0_15px_rgba(6,182,212,0.5)]';

              return (
                <div key={msg.id} className="flex justify-center w-full my-4">
                  <div className={`w-full max-w-sm bg-gradient-to-br from-[#0e0717]/85 to-[#030107]/95 border rounded-2xl p-4 backdrop-blur-md relative overflow-hidden transition-all duration-300 ${shadowClass}`}>
                    <div className={`absolute -right-8 -top-8 w-20 h-20 rounded-full blur-xl pointer-events-none ${glowBg}`} />
                    
                    <h4 className={`text-[10px] font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5 ${textClass}`}>
                      <Sparkles className="w-3 h-3 text-current" />
                      <span>{inviteTitle}</span>
                    </h4>
                    
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`p-2.5 rounded-xl ${iconBgClass}`}>
                        <Icon className={`w-5 h-5 ${iconColorClass}`} />
                      </div>
                      <div>
                        <p className="text-xs text-gray-300">
                          {isMe ? `You invited your partner to join a ${isCinema ? 'watch party' : 'music session'}!` : `Your partner invited you to join their ${isCinema ? 'watch party' : 'music session'}!`}
                        </p>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => navigate.push(inviteData.url)}
                      className={`w-full py-2.5 px-4 text-xs font-bold rounded-xl text-white transition-all active:scale-[0.98] duration-200 flex items-center justify-center gap-2 ${btnClass}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      <span>{buttonText}</span>
                    </button>
                  </div>
                </div>
              );
            } catch (e) {
              console.error('Failed to render invitation card:', e);
            }
          }
          if (msg.isSystem) return <div key={msg.id} className="flex justify-center w-full my-4"><span className="text-[10px] uppercase text-gray-500 bg-gray-900/50 px-4 py-1.5 rounded-full border border-gray-800/50 flex items-center gap-2">{msg.text.replace('📞', '').trim()}</span></div>;
          
          if (msg.text.startsWith('[GAME:2TL:v1]')) {
            try {
              const gameState: TwoTruthsLieState = JSON.parse(msg.text.replace('[GAME:2TL:v1] ', ''));
              const isMeCreator = gameState.creatorId === currentUser?.id;
              
              return (
                <div key={msg.id} className="flex justify-center w-full my-4">
                  <div className="w-full max-w-sm bg-gradient-to-br from-[#1c0d2b]/60 to-[#08020f]/95 border border-purple-500/35 rounded-2xl p-4 backdrop-blur-md shadow-2xl relative overflow-hidden transition-transform hover:scale-[1.01] duration-300">
                    <div className="absolute -right-8 -top-8 w-20 h-20 bg-purple-500/10 rounded-full blur-xl pointer-events-none" />
                    
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-purple-400 mb-3 flex items-center gap-1.5 font-mono">
                      <Gamepad2 className="w-3.5 h-3.5 text-purple-400" />
                      <span>2 Truths & a Lie</span>
                    </h4>
                    
                    {gameState.status === 'active' && !isMeCreator && !gameState.guess && (
                      <div className="space-y-2.5">
                        <p className="text-xs text-gray-300 mb-1">Guess which one is the <span className="text-red-400 font-semibold">LIE</span>:</p>
                        {gameState.options.map((opt, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleGuess2TL(msg.id, gameState, opt)}
                            className="w-full text-left px-3.5 py-2.5 text-xs bg-purple-900/20 hover:bg-purple-800/30 border border-purple-500/20 hover:border-purple-400/40 rounded-xl text-gray-200 transition-all active:scale-[0.98] duration-200"
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    )}
                    
                    {gameState.status === 'active' && isMeCreator && !gameState.guess && (
                      <div className="space-y-2">
                        <p className="text-[11px] text-gray-400 mb-2">
                          You set up these options. Waiting for partner to guess {isUserOnline(partner.id) ? (
                            <span className="text-green-400 font-semibold inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" /> Online</span>
                          ) : (
                            <span className="text-gray-500 font-medium inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-500" /> Offline</span>
                          )}:
                        </p>
                        {gameState.options.map((opt, idx) => {
                          const isLie = hashString(opt) === gameState.lieHash;
                          return (
                            <div
                              key={idx}
                              className={`px-3 py-2 text-xs border rounded-xl flex items-center justify-between ${
                                isLie ? 'bg-red-500/10 border-red-500/20 text-red-300' : 'bg-gray-950/40 border-gray-900 text-gray-400'
                              }`}
                            >
                              <span>{opt}</span>
                              {isLie && <span className="text-[9px] font-bold text-red-500 uppercase tracking-wide">Lie</span>}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    
                    {gameState.guess && (
                      <div className="space-y-3">
                        <div className="text-[11px] text-gray-400 mb-1">
                          {isMeCreator ? (
                            <span>Partner guessed:</span>
                          ) : (
                            <span>You guessed:</span>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          {gameState.options.map((opt, idx) => {
                            const isLie = hashString(opt) === gameState.lieHash;
                            const wasGuessed = opt === gameState.guess;
                            let bgBorderClass = 'bg-gray-950/40 border-gray-900 text-gray-500';
                            
                            if (isLie) {
                              bgBorderClass = 'bg-green-500/15 border-green-500/35 text-green-300';
                            } else if (wasGuessed && !isLie) {
                              bgBorderClass = 'bg-red-500/15 border-red-500/35 text-red-300';
                            }
                            
                            return (
                              <div
                                key={idx}
                                className={`px-3 py-2.5 text-xs border rounded-xl flex items-center justify-between ${bgBorderClass}`}
                              >
                                <span className={!isLie && !wasGuessed ? 'opacity-50' : ''}>{opt}</span>
                                <div className="flex gap-1.5 items-center">
                                  {isLie && <span className="text-[9px] font-bold text-green-400 uppercase tracking-wider">Lie</span>}
                                  {wasGuessed && (
                                    <span className="text-[9px] bg-purple-500/20 text-purple-300 px-1.5 py-0.5 rounded border border-purple-500/30 font-medium font-mono uppercase">
                                      Guess
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className={`text-xs font-bold text-center mt-3 pt-2 border-t border-purple-500/10 ${gameState.guessedCorrectly ? 'text-green-400' : 'text-red-400'}`}>
                          {gameState.guessedCorrectly ? (
                            <span className="flex items-center justify-center gap-1.5 text-green-400"><Trophy className="w-4 h-4 text-yellow-400" /> Correct! The lie was spotted!</span>
                          ) : (
                            <span className="flex items-center justify-center gap-1.5 text-red-400"><AlertTriangle className="w-4 h-4 text-red-400" /> Wrong! The lie was successfully hidden.</span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            } catch (e) {
              console.error("Error rendering 2TL message card:", e);
            }
          }
          
          if (msg.text.startsWith('[GAME:WYR:v1]')) {
            try {
              const gameState: WouldYouRatherState = JSON.parse(msg.text.replace('[GAME:WYR:v1] ', ''));
              const myVote = gameState.votes[currentUser?.id || ''];
              const partnerId = partner?.id;
              const partnerVote = gameState.votes[partnerId || ''];
              
              const totalVotes = Object.keys(gameState.votes).length;
              const bothVoted = totalVotes >= 2;
              
              let countA = 0;
              let countB = 0;
              Object.values(gameState.votes).forEach(v => {
                if (v === 'A') countA++;
                if (v === 'B') countB++;
              });
              
              const pctA = totalVotes > 0 ? Math.round((countA / totalVotes) * 100) : 0;
              const pctB = totalVotes > 0 ? Math.round((countB / totalVotes) * 100) : 0;
              
              return (
                <div key={msg.id} className="flex justify-center w-full my-4">
                  <div className="w-full max-w-sm bg-gradient-to-br from-[#0c1a24]/60 to-[#02070d]/95 border border-cyan-500/35 rounded-2xl p-4 backdrop-blur-md shadow-2xl relative overflow-hidden transition-transform hover:scale-[1.01] duration-300">
                    <div className="absolute -right-8 -top-8 w-20 h-20 bg-cyan-500/10 rounded-full blur-xl pointer-events-none" />
                    
                    <h4 className="text-[10px] font-bold uppercase tracking-wider text-cyan-400 mb-3 flex items-center gap-1.5 font-mono">
                      <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Would You Rather</span>
                    </h4>
                    
                    <p className="text-xs text-gray-200 font-medium mb-3.5 line-clamp-3 leading-relaxed">{gameState.question}</p>
                    
                    {!bothVoted && !myVote && (
                      <div className="space-y-2">
                        <button
                          onClick={() => handleVoteWYR(msg.id, gameState, 'A')}
                          className="w-full text-center px-4 py-3 text-xs bg-cyan-900/20 hover:bg-cyan-800/30 border border-cyan-500/20 hover:border-cyan-400/40 rounded-xl text-gray-200 transition-all active:scale-[0.98] duration-200"
                        >
                          {gameState.optionA}
                        </button>
                        <div className="text-center text-[9px] text-gray-600 font-mono tracking-widest uppercase my-1">— OR —</div>
                        <button
                          onClick={() => handleVoteWYR(msg.id, gameState, 'B')}
                          className="w-full text-center px-4 py-3 text-xs bg-cyan-900/20 hover:bg-cyan-800/30 border border-cyan-500/20 hover:border-cyan-400/40 rounded-xl text-gray-200 transition-all active:scale-[0.98] duration-200"
                        >
                          {gameState.optionB}
                        </button>
                      </div>
                    )}
                    
                    {!bothVoted && myVote && (
                      <div className="space-y-3">
                        <p className="text-[11px] text-gray-400">
                          You voted. Waiting for partner to vote {isUserOnline(partner.id) ? (
                            <span className="text-cyan-400 font-semibold inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" /> Online</span>
                          ) : (
                            <span className="text-gray-500 font-medium inline-flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-gray-500" /> Offline</span>
                          )}...
                        </p>
                        <div className="px-4 py-3 text-xs bg-cyan-950/40 border border-cyan-900/30 rounded-xl text-gray-300 font-medium text-center font-mono">
                          Selected: {myVote === 'A' ? gameState.optionA : gameState.optionB}
                        </div>
                      </div>
                    )}
                    
                    {bothVoted && (
                      <div className="space-y-3.5">
                        {/* Option A Results */}
                        <div className="space-y-1.5 relative">
                          <div className="flex justify-between text-xs font-semibold px-1 text-gray-200">
                            <span className="truncate max-w-[80%]">{gameState.optionA}</span>
                            <span>{pctA}%</span>
                          </div>
                          <div className="h-7 w-full bg-gray-950/80 rounded-lg overflow-hidden border border-gray-900 relative flex items-center">
                            <div 
                              className="h-full bg-cyan-500/20 border-r border-cyan-500/40 transition-all duration-700" 
                              style={{ width: `${pctA}%` }} 
                            />
                            <div className="absolute right-2 flex gap-1 items-center">
                              {myVote === 'A' && (
                                <span className="text-[8px] bg-cyan-400/20 text-cyan-300 border border-cyan-400/30 rounded px-1 font-mono uppercase font-bold">
                                  You
                                </span>
                              )}
                              {partnerVote === 'A' && (
                                <span className="text-[8px] bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded px-1 font-mono uppercase font-bold">
                                  Partner
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        {/* Option B Results */}
                        <div className="space-y-1.5 relative">
                          <div className="flex justify-between text-xs font-semibold px-1 text-gray-200">
                            <span className="truncate max-w-[80%]">{gameState.optionB}</span>
                            <span>{pctB}%</span>
                          </div>
                          <div className="h-7 w-full bg-gray-950/80 rounded-lg overflow-hidden border border-gray-900 relative flex items-center">
                            <div 
                              className="h-full bg-pink-500/20 border-r border-pink-500/40 transition-all duration-700" 
                              style={{ width: `${pctB}%` }} 
                            />
                            <div className="absolute right-2 flex gap-1 items-center">
                              {myVote === 'B' && (
                                <span className="text-[8px] bg-pink-400/20 text-pink-300 border border-pink-400/30 rounded px-1 font-mono uppercase font-bold">
                                  You
                                </span>
                              )}
                              {partnerVote === 'B' && (
                                <span className="text-[8px] bg-purple-500/20 text-purple-300 border border-purple-500/30 rounded px-1 font-mono uppercase font-bold">
                                  Partner
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            } catch (e) {
              console.error("Error rendering WYR message card:", e);
            }
          }

          return (
            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] md:max-w-[60%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isMe && <div className="w-8 h-8 flex-shrink-0">{(!messages[i - 1] || messages[i - 1].senderId !== msg.senderId) && <img src={getOptimizedUrl(partner.avatar, 64)} className="w-8 h-8 rounded-full border border-gray-800 object-cover" />}</div>}
                <div 
                  onDoubleClick={() => handleMessageDoubleClick(msg.id, msg.reaction)}
                  className={`relative px-4 py-2.5 rounded-2xl text-sm break-words break-all min-w-0 select-none cursor-pointer transition-all active:scale-[0.98] duration-300 group ${
                    isMe 
                      ? 'bg-gradient-to-r from-neon to-[#d6006b] border border-white/10 text-white rounded-br-none shadow-[0_4px_12px_rgba(255,0,127,0.3)]' 
                      : 'bg-white/5 backdrop-blur-md border border-white/10 text-gray-100 rounded-bl-none shadow-[0_4px_30px_rgba(0,0,0,0.15)] hover:bg-white/10 hover:border-white/20'
                  }`}
                >
                  {msg.text}
                  {msg.reaction && (
                    <div className="absolute -bottom-2.5 right-3 bg-gray-950 border border-gray-700/80 rounded-full px-1.5 py-0.5 text-[9px] flex items-center justify-center shadow-lg shadow-black/80 animate-[scaleIn_0.2s_ease-out]">
                      {msg.reaction}
                    </div>
                  )}
                  <div className="flex items-center justify-end gap-1 mt-1">
                    <span className={`text-[9px] opacity-60 ${isMe ? 'text-white' : 'text-gray-400'}`}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {isMe && (
                      msg.status === 'sending' ? (
                        <Clock className="w-2.5 h-2.5 text-white/55 animate-pulse" />
                      ) : msg.status === 'failed' ? (
                        <AlertTriangle className="w-3 h-3 text-red-500" />
                      ) : msg.isRead ? (
                        <CheckCheck className="w-3 h-3 text-cyan-400 drop-shadow-[0_0_3px_rgba(0,255,255,0.8)]" />
                      ) : (
                        <CheckCheck className="w-3 h-3 text-white/60" />
                      )
                    )}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                    className={`opacity-0 group-hover:opacity-100 transition-opacity absolute top-1/2 -translate-y-1/2 ${isMe ? '-left-8' : '-right-8'} p-1.5 bg-gray-900/80 hover:bg-red-500/20 hover:text-red-400 rounded-full border border-gray-700 backdrop-blur-md text-gray-400 z-10`}
                    title="Delete Message"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {partnerIsTyping && (
          <div className="flex items-center gap-2 text-gray-500 text-xs pl-10">
            <div className="flex items-center gap-1 bg-gray-900/60 border border-gray-800/80 px-3 py-1.5 rounded-full backdrop-blur-sm">
              <span className="text-[10px] font-mono tracking-wider font-semibold text-neon">{partner?.realName || partner?.anonymousId}</span>
              <span className="text-[10px] text-gray-400">is typing</span>
              <div className="flex gap-0.5 ml-1">
                <div className="w-1 h-1 rounded-full bg-neon animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1 h-1 rounded-full bg-neon animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1 h-1 rounded-full bg-neon animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      {showScrollBottom && (
        <button
          onClick={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
          className="absolute bottom-24 right-6 z-30 p-2.5 rounded-full bg-gray-900/90 hover:bg-gray-800 border border-gray-700 text-neon shadow-lg shadow-black/60 transition-all active:scale-90 flex items-center justify-center hover:scale-105"
          aria-label="Scroll to bottom"
        >
          <ArrowDown className="w-4 h-4 animate-[bounce_1.5s_infinite]" />
        </button>
      )}
      <div className="p-3 bg-black/40 backdrop-blur-md border-t border-gray-800/80 z-20 relative">
        {(isBlocked || isBlockedByThem) && (
          <div className="absolute inset-0 bg-gray-900/95 flex items-center justify-center z-30">
            <div className="text-center">
              <Ban className="w-8 h-8 text-gray-600 mx-auto mb-2" aria-hidden="true" />
              <p className="text-sm text-gray-400 font-medium">{isBlocked ? 'You blocked this user' : 'User unavailable'}</p>
              {isBlocked && <button onClick={handleBlockUser} className="mt-3 px-4 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-full">Unblock</button>}
            </div>
          </div>
        )}
        <form onSubmit={handleSend} className="max-w-4xl mx-auto flex items-end gap-2 px-2 pb-2 relative">
          <div className="flex-1 bg-gray-900 border border-gray-800 rounded-2xl flex items-center gap-2 px-3 py-1 shadow-inner focus-within:border-gray-600 transition-colors relative">
            <button
              type="button"
              onClick={() => {
                setShowGamesDrawer(!showGamesDrawer);
                setSelectedGame('none');
              }}
              aria-label="Launch Icebreakers & Games"
              aria-expanded={showGamesDrawer}
              className={`p-2 text-gray-500 hover:text-neon transition-colors rounded-full relative group ${showGamesDrawer ? 'bg-gray-800 text-neon' : ''}`}
            >
              <Gamepad2 className="w-5 h-5" />
              {!activeGame && (
                <span className="absolute top-1.5 right-1.5 flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                </span>
              )}
              
              {/* Tooltip hint to play */}
              <div className="absolute bottom-12 left-1/2 -translate-x-1/2 hidden group-hover:block bg-gray-950 border border-purple-500/20 px-2.5 py-1.5 rounded-xl text-[10px] text-purple-300 font-bold whitespace-nowrap shadow-2xl backdrop-blur-md z-45 transition-all">
                Play Icebreakers & Games!
              </div>
            </button>
            <input
              value={newMessage}
              onChange={e => handleInputChange(e.target.value)}
              placeholder={activeGame ? "Type a message..." : "Type a message, or start an icebreaker..."}
              aria-label="Message input"
              className="flex-1 bg-transparent py-3 text-sm text-white placeholder-gray-500 outline-none min-h-[44px] max-h-32"
            />
            {showGamesDrawer && (
              <>
                <div className="fixed inset-0 z-35" onClick={() => setShowGamesDrawer(false)} />
                <div className="absolute bottom-16 left-0 right-0 mx-auto max-w-sm z-40 bg-gray-950/95 border border-purple-500/20 rounded-2xl p-4 backdrop-blur-xl shadow-2xl transition-all duration-300 animate-[scaleIn_0.25s_ease-out]">
                  {selectedGame === 'none' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-900">
                        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wide flex items-center gap-1.5">
                          <Gamepad2 className="w-4 h-4 text-purple-400" />
                          <span>Chat Icebreakers</span>
                        </h4>
                        <button onClick={() => setShowGamesDrawer(false)} className="text-[10px] text-gray-500 hover:text-gray-300 font-mono">Close</button>
                      </div>
                      <div className="grid grid-cols-1 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setSelectedGame('2tl')}
                          className="flex items-center gap-3 p-3 rounded-xl bg-purple-950/20 hover:bg-purple-900/30 border border-purple-500/10 hover:border-purple-500/30 text-left transition-all group"
                        >
                          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-400 group-hover:bg-purple-500/20 transition-all">
                            <Gamepad2 className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-purple-300 group-hover:text-purple-200">2 Truths & a Lie</div>
                            <div className="text-[10px] text-gray-400">Post items and see if they can find the lie!</div>
                          </div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedGame('wyr')}
                          className="flex items-center gap-3 p-3 rounded-xl bg-cyan-950/20 hover:bg-cyan-900/30 border border-cyan-500/10 hover:border-cyan-500/30 text-left transition-all group"
                        >
                          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:bg-cyan-500/20 transition-all">
                            <HelpCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-cyan-300 group-hover:text-cyan-200">Would You Rather</div>
                            <div className="text-[10px] text-gray-400">Vote on college & lifestyle questions together.</div>
                          </div>
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedGame === '2tl' && (
                    <div className="space-y-3">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-900">
                        <button onClick={() => setSelectedGame('none')} className="text-[10px] text-purple-400 hover:underline">← Back</button>
                        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wide">2 Truths & a Lie</h4>
                        <span className="w-8" />
                      </div>
                      <div className="space-y-3">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 px-1.5">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-green-400">Truth #1</span>
                          </div>
                          <input
                            type="text"
                            value={twoTruths1}
                            onChange={e => setTwoTruths1(e.target.value)}
                            placeholder="e.g. I can play the drums"
                            className="w-full bg-gray-950 border border-green-500/10 focus:border-green-500/40 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 px-1.5">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-green-400">Truth #2</span>
                          </div>
                          <input
                            type="text"
                            value={twoTruths2}
                            onChange={e => setTwoTruths2(e.target.value)}
                            placeholder="e.g. I have a twin brother"
                            className="w-full bg-gray-950 border border-green-500/10 focus:border-green-500/40 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5 px-1.5">
                            <span className="text-[9px] uppercase tracking-wider font-bold text-red-400">The Lie</span>
                          </div>
                          <input
                            type="text"
                            value={oneLie}
                            onChange={e => setOneLie(e.target.value)}
                            placeholder="e.g. I speak fluent Russian"
                            className="w-full bg-gray-950 border border-red-500/10 focus:border-red-500/40 rounded-xl px-3 py-2 text-xs text-white outline-none transition-all"
                          />
                        </div>

                        {/* Suggestion Generator Button */}
                        <button
                          type="button"
                          onClick={() => {
                            const TWO_TRUTHS_IDEAS = [
                              { t1: "I've met a celebrity", t2: "I've never broken a bone", l: "I can speak 3 languages" },
                              { t1: "I hate chocolate", t2: "I'm a licensed scuba diver", l: "I've never been out of the country" },
                              { t1: "I played competitive sports", t2: "I can touch my nose with my tongue", l: "I've eaten frog legs" },
                              { t1: "I've sleepwalked before", t2: "I am a skilled painter", l: "I've met the President" },
                              { t1: "I can play the piano", t2: "I have bungee jumped", l: "I hate pizza" },
                              { t1: "I have a pet reptile", t2: "I've ran a half-marathon", l: "I've never seen Star Wars" }
                            ];
                            const idea = TWO_TRUTHS_IDEAS[Math.floor(Math.random() * TWO_TRUTHS_IDEAS.length)];
                            setTwoTruths1(idea.t1);
                            setTwoTruths2(idea.t2);
                            setOneLie(idea.l);
                          }}
                          className="w-full text-center py-1.5 bg-purple-500/10 border border-purple-500/20 hover:border-purple-400/40 rounded-lg text-[10px] text-purple-400 font-bold flex items-center justify-center gap-1.5 transition-all hover:bg-purple-900/10"
                        >
                          <span className="flex items-center gap-1.5">
                            <Dices className="w-3.5 h-3.5" />
                            <span>Generate Random Idea</span>
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={sendGame2TL}
                          disabled={!twoTruths1.trim() || !twoTruths2.trim() || !oneLie.trim()}
                          className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-purple-900/40 disabled:text-gray-500 font-bold text-white text-xs rounded-xl shadow-lg transition-all active:scale-[0.98] mt-1"
                        >
                          Send to Chat
                        </button>
                      </div>
                    </div>
                  )}

                  {selectedGame === 'wyr' && (
                    <div className="space-y-3 max-h-[350px] overflow-y-auto custom-scrollbar">
                      <div className="flex justify-between items-center pb-2 border-b border-gray-900 sticky top-0 bg-gray-950 z-10">
                        <button onClick={() => setSelectedGame('none')} className="text-[10px] text-cyan-400 hover:underline">← Back</button>
                        <h4 className="text-xs font-bold text-gray-300 uppercase tracking-wide">Would You Rather</h4>
                        <span className="w-8" />
                      </div>
                      
                      <div className="space-y-2.5">
                        <span className="text-[9px] uppercase font-bold text-gray-500 tracking-wider">Choose a template:</span>
                        <div className="grid grid-cols-1 gap-1.5 max-h-[140px] overflow-y-auto custom-scrollbar">
                          {WYR_TEMPLATES.map((tmpl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => sendGameWYR(tmpl.question, tmpl.optionA, tmpl.optionB)}
                              className="text-left px-2.5 py-2 bg-gray-900 hover:bg-gray-800 border border-gray-800 rounded-lg text-[10px] text-gray-300 transition-colors truncate hover:text-cyan-300"
                            >
                              <span className="flex items-center gap-1.5 truncate">
                                <Lightbulb className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                                <span className="truncate">{tmpl.optionA} OR {tmpl.optionB}</span>
                              </span>
                            </button>
                          ))}
                        </div>
                        
                        <div className="text-center text-[9px] text-gray-600 font-mono tracking-wide">OR WRITE CUSTOM</div>
                        
                        <div className="space-y-2">
                          <input
                            type="text"
                            value={customWyrQuestion}
                            onChange={e => setCustomWyrQuestion(e.target.value)}
                            placeholder="Custom Question (e.g. Would you rather...)"
                            className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/40 transition-colors"
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <input
                              type="text"
                              value={customWyrA}
                              onChange={e => setCustomWyrA(e.target.value)}
                              placeholder="Option A"
                              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/40 transition-colors"
                            />
                            <input
                              type="text"
                              value={customWyrB}
                              onChange={e => setCustomWyrB(e.target.value)}
                              placeholder="Option B"
                              className="w-full bg-gray-900 border border-gray-800 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-cyan-500/40 transition-colors"
                            />
                          </div>
                          <button
                            type="button"
                            onClick={() => sendGameWYR()}
                            disabled={!customWyrQuestion.trim() || !customWyrA.trim() || !customWyrB.trim()}
                            className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-cyan-900/40 disabled:text-gray-500 font-bold text-white text-xs rounded-xl shadow-lg transition-all active:scale-[0.98] mt-1"
                          >
                            Send Custom WYR
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          <button type="submit" disabled={!newMessage.trim()} aria-label="Send message" className="p-3 rounded-full bg-neon text-white shadow-lg hover:bg-[#d6006b] transition-all disabled:opacity-50">
            <Send className="w-5 h-5 fill-current" aria-hidden="true" />
          </button>
        </form>
      </div>
    </div>
  </div>
</div>
  );
};