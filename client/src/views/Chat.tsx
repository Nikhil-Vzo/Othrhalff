import React, { useState, useEffect, useRef } from 'react';
import { useParams, useRouter as useNavigate } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import { useCall } from '../context/CallContext';
import { usePresence } from '../context/PresenceContext';
import { MatchProfile, Message } from '../types';
import { useToast } from '../context/ToastContext';
import { ArrowLeft, Send, Phone, Video, MoreVertical, Ghost, Shield, Clock, User, AlertTriangle, Ban, Loader2, BadgeCheck, Smile, Check, CheckCheck, ArrowDown } from 'lucide-react';
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

  const messages: Message[] = React.useMemo(() => {
    if (!liveMessages) return [];
    return liveMessages.map(m => ({
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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
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
        let partnerId = initialPartner?.id;

        // Fetch partner ID if totally missing (direct link load)
        if (!partnerId) {
          const { data: matchData, error: matchError } = await supabase.from('matches').select('user_a, user_b').eq('id', matchId).single();
          if (matchError || !matchData) { navigate.push('/matches'); return; }
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
          db.messages.update(updatedMsg.id, { is_read: updatedMsg.is_read }).catch(dbErr => {
            console.error('Failed to update message read status in local DB:', dbErr);
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
    <div className={`h-full w-full flex flex-col relative transition-all duration-500 ${
      wallpaper === 'midnight' ? 'bg-gradient-to-b from-[#0a050f] via-[#05020a] to-[#000000]' :
      wallpaper === 'cyberpunk' ? 'bg-[#030008] bg-[linear-gradient(rgba(255,0,127,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,0,127,0.02)_1px,transparent_1px)] bg-[size:32px_32px]' :
      wallpaper === 'nebula' ? 'bg-gradient-to-tr from-[#0b001a] via-[#02000a] to-[#120024]' :
      'bg-[#0f1115]'
    }`}>
      <ConfirmationModal isOpen={confirmModal.isOpen} title={confirmModal.title} message={confirmModal.message} confirmLabel={confirmModal.confirmLabel} isDestructive={confirmModal.isDestructive} onConfirm={confirmModal.onConfirm} onCancel={closeConfirmModal} />
      <PermissionModal isOpen={permissionModal.isOpen} onPermissionsGranted={permissionModal.onGranted} onCancel={() => setPermissionModal(prev => ({ ...prev, isOpen: false }))} requiredPermissions={permissionModal.type === 'video' ? ['camera', 'microphone'] : ['microphone']} />
      <div className="flex-none px-4 py-3 bg-black/95 backdrop-blur-md border-b border-gray-800 flex items-center justify-between z-20">
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
                              w === 'midnight' ? 'linear-gradient(135deg, #0a050f, #000)' :
                              w === 'cyberpunk' ? '#030008' :
                              w === 'nebula' ? 'linear-gradient(135deg, #0b001a, #120024)' :
                              '#0f1115'
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
        {messages.length === 0 && <div className="flex flex-col items-center justify-center h-[50vh] opacity-50"><Ghost className="w-10 h-10 text-gray-700 mb-2" /><p className="text-sm text-gray-500">No messages yet.</p></div>}
        {messages.map((msg, i) => {
          const isMe = msg.senderId === currentUser?.id;
          if (msg.isSystem) return <div key={msg.id} className="flex justify-center w-full my-4"><span className="text-[10px] uppercase text-gray-500 bg-gray-900/50 px-4 py-1.5 rounded-full border border-gray-800/50 flex items-center gap-2">{msg.text.replace('📞', '').trim()}</span></div>;
          return (
            <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
              <div className={`flex max-w-[80%] md:max-w-[60%] gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                {!isMe && <div className="w-8 h-8 flex-shrink-0">{(!messages[i - 1] || messages[i - 1].senderId !== msg.senderId) && <img src={getOptimizedUrl(partner.avatar, 64)} className="w-8 h-8 rounded-full border border-gray-800 object-cover" />}</div>}
                <div 
                  onDoubleClick={() => handleMessageDoubleClick(msg.id, msg.reaction)}
                  className={`relative px-4 py-2.5 rounded-2xl text-sm break-words select-none cursor-pointer transition-transform active:scale-[0.98] ${isMe ? 'bg-neon text-white rounded-br-none' : 'bg-gray-800 text-gray-100 rounded-bl-none border border-gray-700'}`}
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
      <div className="p-3 bg-black/95 backdrop-blur-md border-t border-gray-800 z-20 relative">
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
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              aria-label="Toggle emoji picker"
              aria-expanded={showEmojiPicker}
              className={`p-2 text-gray-500 hover:text-white transition-colors rounded-full ${showEmojiPicker ? 'bg-gray-800 text-white' : ''}`}
            >
              <Smile className="w-5 h-5" />
            </button>
            <input
              value={newMessage}
              onChange={e => handleInputChange(e.target.value)}
              placeholder="Type a message..."
              aria-label="Message input"
              className="flex-1 bg-transparent py-3 text-sm text-white placeholder-gray-500 outline-none min-h-[44px] max-h-32"
            />
            {showEmojiPicker && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setShowEmojiPicker(false)} />
                <div className="absolute bottom-14 left-2 z-40 bg-gray-900/95 border border-gray-700/80 rounded-2xl p-2 backdrop-blur-xl flex items-center gap-1.5 shadow-2xl transition-all duration-200">
                  {['❤️', '🔥', '😂', '✨', '👀', '🥺', '🙌', '💯'].map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => {
                        setNewMessage(prev => prev + emoji);
                        setShowEmojiPicker(false);
                      }}
                      className="text-lg hover:scale-125 transition-transform p-1.5 rounded-lg hover:bg-gray-800/80 active:scale-95"
                    >
                      {emoji}
                    </button>
                  ))}
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
  );
};