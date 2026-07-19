import React, { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './AuthContext';
import { getCachedProfilesBulk } from '../services/profileCache';
import { buildRealtimeIdFilter, chunkIds, uniqueValidUuids } from '../utils/realtime';

interface NotificationItem {
    id: string;
    title: string;
    message: string;
    timestamp: number;
    read: boolean;
    type: 'match' | 'message' | 'system' | 'like';
    fromUserId?: string;
    actionUrl?: string;
    fromUser?: {
        id: string;
        anonymousId: string;
        avatar: string;
        university: string;
    };
}

interface NotificationContextType {
    notifications: NotificationItem[];
    unreadCount: number;
    loading: boolean;
    fetchNotifications: (bg?: boolean) => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
    deleteNotification: (id: string) => Promise<void>;
    unreadMessageCount: number;
    setUnreadMessageCount: React.Dispatch<React.SetStateAction<number>>;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [unreadMessageCount, setUnreadMessageCount] = useState(0);
    const [loading, setLoading] = useState(false);

    // Debounce Ref to prevent "Thundering Herd" of fetches
    const fetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    const fetchNotifications = useCallback(async (isBackground = false) => {
        if (!currentUser || !supabase) return;
        if (!isBackground) setLoading(true);

        try {
            // Fetch notifications without foreign key join to avoid 500 errors if FK is missing
            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', currentUser.id)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Extract all unique fromUserIds
            const rawUserIds = (data || []).map(n => n.from_user_id || n.data?.from_user_id).filter(Boolean);
            const userIds = rawUserIds.filter((val, idx, self) => self.indexOf(val) === idx);
            
            // Fetch profiles using the caching layer
            const profilesMap = await getCachedProfilesBulk(userIds);

            const mapped: NotificationItem[] = (data || []).map((n: any) => {
                const fromUserId = n.from_user_id || n.data?.from_user_id;
                const fromUser = profilesMap.get(fromUserId);
                
                return {
                    id: n.id,
                    title: n.title,
                    message: n.message,
                    timestamp: new Date(n.created_at).getTime(),
                    read: n.is_read || n.read,
                    type: n.type,
                    fromUserId: fromUserId,
                    actionUrl: n.action_url || n.data?.action_url || undefined,
                    fromUser: fromUser ? {
                        id: fromUser.id,
                        anonymousId: fromUser.anonymous_id,
                        avatar: fromUser.avatar || '',
                        university: fromUser.university || ''
                    } : undefined
                };
            });

            // Deduplicate Logic
            const uniqueNotifications: NotificationItem[] = [];
            
            // 1. Separate match notifications from others
            const matchNotifications = mapped.filter(n => n.type === 'match');
            const otherNotifications = mapped.filter(n => n.type !== 'match');

            // 2. Deduplicate match notifications that are near-simultaneous (within 10s)
            const uniqueMatches: NotificationItem[] = [];
            for (const matchNotif of matchNotifications) {
                const isDuplicate = uniqueMatches.some(m => 
                    Math.abs(m.timestamp - matchNotif.timestamp) < 10000
                );

                if (!isDuplicate) {
                    uniqueMatches.push(matchNotif);
                } else {
                    const existingIndex = uniqueMatches.findIndex(m => 
                        Math.abs(m.timestamp - matchNotif.timestamp) < 10000
                    );
                    if (existingIndex !== -1 && !uniqueMatches[existingIndex].fromUserId && matchNotif.fromUserId) {
                        uniqueMatches[existingIndex] = matchNotif; // Prefer the one with partner profile details
                    }
                }
            }

            // 3. Re-combine and sort by descending timestamp
            const combined = [...uniqueMatches, ...otherNotifications];
            combined.sort((a, b) => b.timestamp - a.timestamp);

            // 4. Run through secondary grouping to map keys
            const seenMap = new Set<string>();
            for (const notif of combined) {
                let uniqueKey = notif.id;
                if ((notif.type === 'like' || notif.type === 'match') && notif.fromUserId) {
                    uniqueKey = `${notif.type}-${notif.fromUserId}`;
                }
                if (!seenMap.has(uniqueKey)) {
                    seenMap.add(uniqueKey);
                    uniqueNotifications.push(notif);
                }
            }

            setNotifications(uniqueNotifications);
            // Count unread items based on the DEDUPLICATED list
            setUnreadCount(uniqueNotifications.filter(n => !n.read).length);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            if (!isBackground) setLoading(false);
        }
    }, [currentUser]);

    // Debounced Fetcher for Realtime
    const debouncedFetch = useCallback(() => {
        if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        fetchTimeoutRef.current = setTimeout(() => {
            console.log("⚡ Refreshing Notifications (Debounced)");
            fetchNotifications(true);
        }, 1000); // Wait 1 second for all updates to settle
    }, [fetchNotifications]);

    // Realtime Subscription
    useEffect(() => {
        if (!currentUser) return;

        fetchNotifications();

        const channel = supabase.channel('public:notifications')
            .on('postgres_changes',
                { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${currentUser.id}` },
                (payload) => {
                    // When DB changes, wait a moment then fetch
                    debouncedFetch();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
            if (fetchTimeoutRef.current) clearTimeout(fetchTimeoutRef.current);
        };
    }, [currentUser, debouncedFetch]);

    // Fetch real-time unread messages count for the chat badge without subscribing to the global messages table.
    useEffect(() => {
        if (!currentUser || !supabase) {
            setUnreadMessageCount(0);
            return;
        }

        let debounceTimeout: NodeJS.Timeout | null = null;
        let isActive = true;
        let messageChannels: ReturnType<typeof supabase.channel>[] = [];
        let matchChannels: ReturnType<typeof supabase.channel>[] = [];
        const channelNonce = Math.random().toString(36).slice(2);
        const matchIdsRef = { current: [] as string[] };

        const removeMessageChannels = () => {
            messageChannels.forEach(channel => supabase.removeChannel(channel));
            messageChannels = [];
        };

        const fetchMatchIds = async () => {
            const { data, error } = await supabase
                .from('matches')
                .select('id')
                .or(`user_a.eq.${currentUser.id},user_b.eq.${currentUser.id}`);

            if (error) {
                console.error('Error fetching match ids for unread count:', error);
                return matchIdsRef.current;
            }

            return uniqueValidUuids((data || []).map(match => match.id));
        };

        const fetchUnreadCount = async (matchIds = matchIdsRef.current) => {
            try {
                if (matchIds.length === 0) {
                    if (isActive) setUnreadMessageCount(0);
                    return;
                }

                const countResults = await Promise.all(
                    chunkIds(matchIds).map(ids =>
                        supabase
                            .from('messages')
                            .select('id', { count: 'exact', head: true })
                            .in('match_id', ids)
                            .neq('sender_id', currentUser.id)
                            .eq('is_read', false)
                    )
                );

                const firstError = countResults.find(result => result.error)?.error;
                if (firstError) {
                    console.error('Error fetching unread messages count:', firstError);
                    return;
                }

                const count = countResults.reduce((total, result) => total + (result.count || 0), 0);

                if (isActive) {
                    setUnreadMessageCount(count);
                }
            } catch (err) {
                console.error('Error fetching unread messages count:', err);
            }
        };

        const debouncedFetch = () => {
            if (debounceTimeout) clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => {
                fetchUnreadCount();
            }, 300);
        };

        const refreshMessageSubscriptions = async () => {
            const matchIds = await fetchMatchIds();
            if (!isActive) return;

            matchIdsRef.current = matchIds;
            await fetchUnreadCount(matchIds);
            removeMessageChannels();

            messageChannels = chunkIds(matchIds).map((ids, index) =>
                supabase
                    .channel(`unread-messages-count-context-${currentUser.id}-${channelNonce}-${index}`)
                    .on(
                        'postgres_changes',
                        { event: '*', schema: 'public', table: 'messages', filter: buildRealtimeIdFilter('match_id', ids) },
                        debouncedFetch
                    )
                    .subscribe()
            );
        };

        refreshMessageSubscriptions();

        matchChannels = [
            supabase
                .channel(`context-matches-user-a-${currentUser.id}-${channelNonce}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches', filter: `user_a=eq.${currentUser.id}` }, refreshMessageSubscriptions)
                .subscribe(),
            supabase
                .channel(`context-matches-user-b-${currentUser.id}-${channelNonce}`)
                .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'matches', filter: `user_b=eq.${currentUser.id}` }, refreshMessageSubscriptions)
                .subscribe()
        ];

        return () => {
            isActive = false;
            if (debounceTimeout) clearTimeout(debounceTimeout);
            removeMessageChannels();
            matchChannels.forEach(channel => supabase.removeChannel(channel));
        };
    }, [currentUser]);

    const markAsRead = async (id: string) => {
        // 1. Optimistic Update
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));

        if (!currentUser || !supabase) return;

        // 2. Database Update
        const { error } = await supabase.from('notifications').update({ read: true }).eq('id', id);
        if (error) {
            console.error("Failed to mark read. Check RLS policies!", error);
            // Revert on error
            debouncedFetch();
        }
    };

    const markAllAsRead = async () => {
        if (!currentUser || !supabase) return;

        // 1. Optimistic Update
        const updated = notifications.map(n => ({ ...n, read: true }));
        setNotifications(updated);
        setUnreadCount(0);

        // 2. Database Update
        const { error } = await supabase
            .from('notifications')
            .update({ read: true })
            .eq('user_id', currentUser.id);

        if (error) {
            console.error('Error marking all read:', error);
            debouncedFetch(); // Revert
        }
    };

    const deleteNotification = async (id: string) => {
        const notif = notifications.find(n => n.id === id);

        // 1. Optimistic Update
        setNotifications(prev => prev.filter(n => n.id !== id));
        if (notif && !notif.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }

        if (!currentUser || !supabase) return;

        // 2. Database Update
        // If this is a grouped notification, we want to delete ALL from that user
        let query = supabase.from('notifications').delete();

        if (notif?.fromUserId && (notif.type === 'like' || notif.type === 'match')) {
            // Delete ALL notifications from this specific user of this type
            // This prevents the "Stack" effect where deleting one reveals another
            query = query.eq('from_user_id', notif.fromUserId).eq('type', notif.type);
        } else {
            query = query.eq('id', id);
        }

        const { error } = await query;

        if (error) {
            console.error('Error deleting:', error);
            debouncedFetch();
        }
    };

    const providerValue = React.useMemo(() => ({
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        unreadMessageCount,
        setUnreadMessageCount
    }), [
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
        unreadMessageCount
    ]);

    return (
        <NotificationContext.Provider value={providerValue}>
            {children}
        </NotificationContext.Provider>
    );
};

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};
