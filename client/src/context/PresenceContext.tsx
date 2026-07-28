import React, { createContext, useContext, useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { supabase } from '../lib/supabase';

interface PresenceContextType {
    onlineUsers: Map<string, boolean>;
    lastSeenMap: Map<string, Date>;
    subscribeToUser: (userId: string) => void;
    subscribeToUsers: (userIds: string[]) => void;
    unsubscribeFromUser: (userId: string) => void;
    isUserOnline: (userId: string) => boolean;
    getLastSeen: (userId: string) => Date | null;
}

const PresenceContext = createContext<PresenceContextType | undefined>(undefined);

export const PresenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { currentUser } = useAuth();
    const [onlineUsers, setOnlineUsers] = useState<Map<string, boolean>>(new Map());
    const [lastSeenMap, setLastSeenMap] = useState<Map<string, Date>>(new Map());
    const trackedUsersRef = useRef<Map<string, number>>(new Map());
    const globalChannelRef = useRef<any>(null);
    const heartbeatIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const activityTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const tokenRef = useRef<string | null>(null);

    const lastWriteTimeRef = useRef<number>(0);
    const lastOnlineStateRef = useRef<boolean | null>(null);

    // Keep active session token updated in a ref for synchronous unload authorization
    useEffect(() => {
        if (!supabase) return;
        
        supabase.auth.getSession().then(({ data: { session } }) => {
            tokenRef.current = session?.access_token || null;
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            tokenRef.current = session?.access_token || null;
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Update user's own presence with throttling to prevent API spam
    const updatePresence = useCallback(async (isOnline: boolean, forceDbWrite = false) => {
        if (!currentUser || !supabase) return;

        const now = Date.now();

        // 1. Broadcast online state in realtime memory via Supabase Realtime Presence
        if (globalChannelRef.current) {
            globalChannelRef.current.track({
                user_id: currentUser.id,
                is_online: isOnline,
                last_seen: new Date().toISOString()
            }).catch((err: any) => console.error('Realtime presence track failed:', err));
        }

        // 2. Persist to database ONLY on connect, disconnect, or forced writes
        if (forceDbWrite) {
            try {
                const { error } = await supabase
                    .from('user_presence')
                    .upsert({
                        user_id: currentUser.id,
                        is_online: isOnline,
                        last_seen: new Date().toISOString(),
                        updated_at: new Date().toISOString()
                    });

                if (error) console.error('Error updating presence DB:', error);
            } catch (err) {
                console.error('Failed to update presence DB:', err);
            }
        }
    }, [currentUser]);

    // Heartbeat and Activity Detection - Throttled to save database bandwidth
    useEffect(() => {
        if (!currentUser) return;

        // Set online immediately in DB and Realtime (forced)
        updatePresence(true, true);

        // Start heartbeat - 30 seconds is industry standard (up from 10)
        // Heartbeat is purely realtime memory updates, no DB writes!
        heartbeatIntervalRef.current = setInterval(() => {
            updatePresence(true);
        }, 30000);

        // Activity detection - reset heartbeat on user activity
        const resetActivity = () => {
            if (activityTimeoutRef.current) {
                clearTimeout(activityTimeoutRef.current);
            }
            
            // Mark online in Realtime (no DB write unless status changes)
            updatePresence(true);

            // Set idle/offline timeout (e.g., mark offline after 3 minutes of inactivity)
            activityTimeoutRef.current = setTimeout(() => {
                updatePresence(false, true); // Forced offline write to DB and Realtime
            }, 180000);
        };

        window.addEventListener('mousemove', resetActivity);
        window.addEventListener('keydown', resetActivity);
        window.addEventListener('focus', resetActivity);

        // Page Visibility API - detect tab changes (minimize/maximize)
        const handleVisibilityChange = () => {
            if (document.hidden) {
                // User switched tab/minimized - mark offline immediately (forced DB write)
                updatePresence(false, true);
            } else {
                // User returned - mark online immediately (forced DB write)
                updatePresence(true, true);
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Use fetch with keepalive for reliable authenticated cleanup on page close
        const handleBeforeUnload = () => {
            if (!currentUser || !supabase) return;

            // Try regular update first (forced DB write)
            updatePresence(false, true);

            // Keepalive fetch as backup - browser queues this during page unload
            try {
                const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
                const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

                if (!supabaseUrl || !supabaseKey) return;

                const url = `${supabaseUrl}/rest/v1/user_presence?user_id=eq.${currentUser.id}`;
                const data = JSON.stringify({
                    user_id: currentUser.id,
                    is_online: false,
                    last_seen: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });

                const storageKey = 'sb-cthyiegohnvqtepzoqjf-auth-token';
                const token = tokenRef.current || (typeof window !== 'undefined' ? JSON.parse(localStorage.getItem(storageKey) || '{}')?.access_token : null);

                const headers: Record<string, string> = {
                    'apikey': supabaseKey,
                    'Content-Type': 'application/json',
                    'Prefer': 'resolution=merge-duplicates'
                };

                if (token) {
                    headers['Authorization'] = `Bearer ${token}`;
                }

                fetch(url, {
                    method: 'POST',
                    headers,
                    body: data,
                    keepalive: true
                }).catch(err => console.error('keepalive update failed:', err));
            } catch (err) {
                console.error('keepalive backup failed:', err);
            }
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Cleanup on unmount
        return () => {
            if (heartbeatIntervalRef.current) {
                clearInterval(heartbeatIntervalRef.current);
            }
            if (activityTimeoutRef.current) {
                clearTimeout(activityTimeoutRef.current);
            }
            window.removeEventListener('mousemove', resetActivity);
            window.removeEventListener('keydown', resetActivity);
            window.removeEventListener('focus', resetActivity);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('beforeunload', handleBeforeUnload);

            // Set offline when component unmounts (forced DB write)
            updatePresence(false, true);
        };
    }, [currentUser, updatePresence]);

    // Single global Realtime subscription for all presence updates
    useEffect(() => {
        if (!currentUser || !supabase) return;

        const channel = supabase.channel('global-presence-updates', {
            config: {
                presence: {
                    key: currentUser.id,
                },
            },
        });

        channel
            .on('presence', { event: 'sync' }, () => {
                const presenceState = channel.presenceState();
                
                setOnlineUsers(prev => {
                    let changed = false;
                    const nextOnline = new Map(prev);
                    
                    // Clear previous states for currently tracked users
                    trackedUsersRef.current.forEach((count, userId) => {
                        const isOnline = !!presenceState[userId];
                        if (nextOnline.get(userId) !== isOnline) {
                            nextOnline.set(userId, isOnline);
                            changed = true;
                        }
                    });
                    
                    // Mark anyone in the presenceState as online if they are tracked
                    Object.keys(presenceState).forEach(userId => {
                        if (trackedUsersRef.current.has(userId)) {
                            const userPresences = presenceState[userId];
                            const isUserOnline = !!userPresences?.some((p: any) => p.is_online !== false);
                            if (nextOnline.get(userId) !== isUserOnline) {
                                nextOnline.set(userId, isUserOnline);
                                changed = true;
                            }
                        }
                    });
                    
                    return changed ? nextOnline : prev;
                });

                setLastSeenMap(prev => {
                    let changed = false;
                    const nextLastSeen = new Map(prev);
                    Object.keys(presenceState).forEach(userId => {
                        if (trackedUsersRef.current.has(userId)) {
                            const userPresences = presenceState[userId];
                            if (userPresences && userPresences.length > 0) {
                                const lastSeenStr = (userPresences[0] as any).last_seen;
                                if (lastSeenStr) {
                                    const newDate = new Date(lastSeenStr);
                                    const oldDate = nextLastSeen.get(userId);
                                    if (!oldDate || oldDate.getTime() !== newDate.getTime()) {
                                        nextLastSeen.set(userId, newDate);
                                        changed = true;
                                    }
                                }
                            }
                        }
                    });
                    return changed ? nextLastSeen : prev;
                });
            })
            .on('presence', { event: 'join' }, ({ key, newPresences }) => {
                if (!trackedUsersRef.current.has(key)) return;
                const isUserOnline = !!newPresences?.some((p: any) => p.is_online !== false);
                setOnlineUsers(prev => {
                    if (prev.get(key) === isUserOnline) return prev;
                    const m = new Map(prev);
                    m.set(key, isUserOnline);
                    return m;
                });
                if (newPresences && newPresences.length > 0) {
                    const lastSeenStr = (newPresences[0] as any).last_seen;
                    if (lastSeenStr) {
                        const newDate = new Date(lastSeenStr);
                        setLastSeenMap(prev => {
                            const oldDate = prev.get(key);
                            if (oldDate && oldDate.getTime() === newDate.getTime()) return prev;
                            const m = new Map(prev);
                            m.set(key, newDate);
                            return m;
                        });
                    }
                }
            })
            .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
                if (!trackedUsersRef.current.has(key)) return;
                setOnlineUsers(prev => {
                    if (prev.get(key) === false) return prev;
                    const m = new Map(prev);
                    m.set(key, false);
                    return m;
                });
                const leaveDate = new Date();
                setLastSeenMap(prev => {
                    const oldDate = prev.get(key);
                    if (oldDate && Math.abs(oldDate.getTime() - leaveDate.getTime()) < 1000) return prev;
                    const m = new Map(prev);
                    m.set(key, leaveDate);
                    return m;
                });
            });

        channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                // Publish our initial presence state in realtime memory
                await channel.track({
                    user_id: currentUser.id,
                    is_online: true,
                    last_seen: new Date().toISOString(),
                });
            }
        });

        globalChannelRef.current = channel;

        return () => {
            if (globalChannelRef.current) {
                supabase.removeChannel(globalChannelRef.current);
            }
        };
    }, [currentUser]);

    // CLIENT-SIDE STALE PRESENCE DETECTION
    // Mark users offline if their last_seen is > 60 seconds old (heartbeat is 30s)
    useEffect(() => {
        const checkStalePresence = () => {
            const now = Date.now();
            setOnlineUsers(prev => {
                const updated = new Map(prev);
                let hasChanges = false;

                lastSeenMap.forEach((lastSeen, userId) => {
                    const timeSinceLastSeen = now - lastSeen.getTime();
                    // If last seen > 60 seconds ago and currently marked online, mark offline
                    if (timeSinceLastSeen > 60000 && updated.get(userId)) {
                        updated.set(userId, false);
                        hasChanges = true;
                    }
                });

                return hasChanges ? updated : prev;
            });
        };

        // Check every 10 seconds for stale presence
        const interval = setInterval(checkStalePresence, 10000);
        return () => clearInterval(interval);
    }, [lastSeenMap]);

    // Track a single user and fetch initial presence
    const subscribeToUser = useCallback((userId: string) => {
        if (!supabase) return;
        
        const count = trackedUsersRef.current.get(userId) || 0;
        trackedUsersRef.current.set(userId, count + 1);

        if (count > 0) return;

        supabase
            .from('user_presence')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle()
            .then(({ data, error }) => {
                if (data && !error) {
                    setOnlineUsers(prev => {
                        const m = new Map(prev);
                        m.set(userId, data.is_online);
                        return m;
                    });
                    setLastSeenMap(prev => {
                        const m = new Map(prev);
                        m.set(userId, new Date(data.last_seen));
                        return m;
                    });
                }
            });
    }, []);

    // Batch track users and batch fetch initial presence
    const subscribeToUsers = useCallback((userIds: string[]) => {
        if (!supabase || userIds.length === 0) return;

        const newIds: string[] = [];
        userIds.forEach(id => {
            const count = trackedUsersRef.current.get(id) || 0;
            trackedUsersRef.current.set(id, count + 1);
            if (count === 0) {
                newIds.push(id);
            }
        });

        if (newIds.length === 0) return;

        supabase
            .from('user_presence')
            .select('*')
            .in('user_id', newIds)
            .then(({ data, error }) => {
                if (data && !error) {
                    setOnlineUsers(prev => {
                        const m = new Map(prev);
                        data.forEach((row: any) => {
                            m.set(row.user_id, row.is_online);
                        });
                        return m;
                    });
                    setLastSeenMap(prev => {
                        const m = new Map(prev);
                        data.forEach((row: any) => {
                            m.set(row.user_id, new Date(row.last_seen));
                        });
                        return m;
                    });
                }
            });
    }, []);

    const unsubscribeFromUser = useCallback((userId: string) => {
        const count = trackedUsersRef.current.get(userId) || 0;
        if (count <= 1) {
            trackedUsersRef.current.delete(userId);
        } else {
            trackedUsersRef.current.set(userId, count - 1);
        }
    }, []);

    const isUserOnline = useCallback((userId: string): boolean => {
        return onlineUsers.get(userId) || false;
    }, [onlineUsers]);

    const getLastSeen = useCallback((userId: string): Date | null => {
        return lastSeenMap.get(userId) || null;
    }, [lastSeenMap]);

    const providerValue = useMemo(() => ({
        onlineUsers,
        lastSeenMap,
        subscribeToUser,
        subscribeToUsers,
        unsubscribeFromUser,
        isUserOnline,
        getLastSeen
    }), [
        onlineUsers,
        lastSeenMap,
        subscribeToUser,
        subscribeToUsers,
        unsubscribeFromUser,
        isUserOnline,
        getLastSeen
    ]);

    return (
        <PresenceContext.Provider value={providerValue}>
            {children}
        </PresenceContext.Provider>
    );
};

export const usePresence = () => {
    const context = useContext(PresenceContext);
    if (context === undefined) {
        throw new Error('usePresence must be used within a PresenceProvider');
    }
    return context;
};
