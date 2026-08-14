import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { Confession } from '../types';
import { ArrowLeft, Image as ImageIcon, Send, Crown, MessageCircle, X, Loader2, SlidersHorizontal, SmilePlus, BarChart2, Ghost, School, Globe, Heart, Flame, Laugh, Sparkles, Eye, Check, MoreVertical, Share2, Copy, Video as VideoIcon } from 'lucide-react';
import { useRouter as useNavigate } from 'next/navigation';
import { supabase } from '../lib/supabase';
import { analytics } from '../utils/analytics';
import { VideoPlayer } from '../components/VideoPlayer';

import { getRandomQuote } from '../data/loadingQuotes';
import { LoadingState } from '../components/LoadingState';
import { AuthPromptModal } from '../components/AuthPromptModal';
import { CHHATTISGARH_COLLEGES, BRANCH_CATEGORIES } from '../constants';

type SortOption = 'newest' | 'oldest' | 'popular' | 'discussed';

const REACTIONS = ['❤️', '😂', '🔥', '😮', '😢', '👀'];
const POSTS_PER_PAGE = 10;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const readCache = (mode: 'campus' | 'global'): Confession[] => {
    try {
        const cacheKey = `otherhalf_confessions_${mode}_cupid`;
        const expiryKey = `otherhalf_confessions_expiry_${mode}_cupid`;
        const expiry = localStorage.getItem(expiryKey);
        if (expiry && Date.now() > parseInt(expiry, 10)) {
            localStorage.removeItem(cacheKey);
            localStorage.removeItem(expiryKey);
            return [];
        }
        const cached = localStorage.getItem(cacheKey);
        return cached ? JSON.parse(cached) : [];
    } catch { return []; }
};

const writeCache = (mode: 'campus' | 'global', data: Confession[]) => {
    try {
        const cacheKey = `otherhalf_confessions_${mode}_cupid`;
        const expiryKey = `otherhalf_confessions_expiry_${mode}_cupid`;
        localStorage.setItem(cacheKey, JSON.stringify(data));
        localStorage.setItem(expiryKey, String(Date.now() + CACHE_DURATION));
    } catch { /* quota exceeded */ }
};

// --- SKELETON COMPONENT ---
const ConfessionSkeleton = () => (
    <div className="bg-gray-900/30 border border-gray-800/50 rounded-xl p-4 animate-pulse">
        {/* ... (existing inner) ... */}
        <div className="flex gap-3 mb-3">
            <div className="w-10 h-10 bg-gray-800 rounded-xl" />
            <div className="flex-1 space-y-2 py-1">
                <div className="h-3 w-24 bg-gray-800 rounded" />
                <div className="flex justify-between">
                    <div className="h-2 w-16 bg-gray-800/50 rounded" />
                    <div className="h-2 w-12 bg-gray-800/50 rounded" />
                </div>
            </div>
        </div>
        <div className="space-y-2 mb-4">
            <div className="h-2 w-full bg-gray-800/60 rounded" />
            <div className="h-2 w-11/12 bg-gray-800/60 rounded" />
            <div className="h-2 w-4/6 bg-gray-800/60 rounded" />
        </div>
        <div className="flex justify-between pt-2 border-t border-gray-800/50">
            <div className="h-6 w-16 bg-gray-800 rounded-md" />
            <div className="h-6 w-12 bg-gray-800 rounded-md" />
        </div>
    </div>
);

const LoadingOverlay = () => (
    <div className="relative">
        <LoadingState />
        {[1, 2, 3].map(i => <ConfessionSkeleton key={i} />)}
    </div>
);

const parseUniversity = (univStr: string) => {
    if (!univStr) return { college: '', department: '' };
    const parts = univStr.split('|');
    return {
        college: parts[0]?.trim() || '',
        department: parts[1]?.trim() || ''
    };
};

export const Confessions: React.FC = () => {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [feedMode, setFeedMode] = useState<'campus' | 'global'>(() => currentUser?.university ? 'campus' : 'global');
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [customAuthMessage, setCustomAuthMessage] = useState<string | undefined>(undefined);

    // 1. ZERO-FLICKER INIT: Read cache synchronously
    const [confessions, setConfessions] = useState<Confession[]>([]);

    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const cached = readCache(feedMode);
        if (cached && cached.length > 0) {
            setConfessions(cached);
            setIsLoading(false);
        } else {
            setConfessions([]);
            setIsLoading(true);
        }
    }, [feedMode]);

    const [newText, setNewText] = useState('');
    const [newImage, setNewImage] = useState<string | null>(null);
    const [uploadedVideoUrl, setUploadedVideoUrl] = useState<string | null>(null);
    const [videoUploading, setVideoUploading] = useState(false);
    const [isPosting, setIsPosting] = useState(false);
    const [viewImage, setViewImage] = useState<string | null>(null);

    // Poll State
    const [isPollMode, setIsPollMode] = useState(false);
    const [pollOptions, setPollOptions] = useState<string[]>(['', '']);

    // Sorting State
    const [sortType, setSortType] = useState<SortOption>('newest');
    const [showSortMenu, setShowSortMenu] = useState(false);
    // Comments & Reaction State
    const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
    const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
    const [activeReactionMenu, setActiveReactionMenu] = useState<string | null>(null);
    const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

    // Pagination State
    const [page, setPage] = useState(0);
    const [hasMore, setHasMore] = useState(true);

    // 3-Dot Card Menu & Toast State
    const [activeCardMenu, setActiveCardMenu] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2200);
    };

    const handleShareConfession = async (conf: Confession) => {
        const { college } = parseUniversity(conf.university);
        const cleanCollege = college
            ? college.split(',')[0].trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')
            : 'global';
        const shareUrl = `${window.location.origin}/tea/${encodeURIComponent(cleanCollege)}/${conf.id}`;
        const shareText = conf.text.length > 120 ? conf.text.substring(0, 120) + '...' : conf.text;

        if (typeof navigator !== 'undefined' && navigator.share) {
            try {
                await navigator.share({
                    title: 'Othrhalff Campus Tea',
                    text: shareText,
                    url: shareUrl,
                });
            } catch (err) {
                // User dismissed native share sheet
            }
        } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(shareUrl);
                showToast('Link copied to clipboard! 🔗');
            } catch (err) {
                console.error('Failed to copy share link:', err);
            }
        }
        setActiveCardMenu(null);
    };

    const handleCopyText = async (conf: Confession) => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            try {
                await navigator.clipboard.writeText(conf.text);
                showToast('Confession text copied! 📋');
            } catch (err) {
                console.error('Failed to copy text:', err);
            }
        }
        setActiveCardMenu(null);
    };
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const observerTarget = useRef<HTMLDivElement>(null);

    // Ref for realtime
    const expandedCommentsRef = useRef(expandedComments);
    useEffect(() => { expandedCommentsRef.current = expandedComments; }, [expandedComments]);

    // 2. NETWORK SYNC: Fetch fresh data
    useEffect(() => {
        if (!supabase) return;

        const targetUniv = currentUser ? currentUser.university : null;

        const init = async () => {
            setIsRefreshing(true);
            setPage(0);
            setHasMore(true);
            await fetchConfessions(0, true);
            setIsRefreshing(false);
        };

        init();

        // --- Supabase Realtime ---
        const channel = supabase.channel('confessions-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'confessions' }, (payload) => {
                const p = payload.new as any;
                if (currentUser && p.user_id === currentUser.id) return; // Ignore own posts

                // Realtime filtering based on feedMode
                if (targetUniv) {
                    const postUniv = p.university || '';
                    const isMatch = postUniv.toLowerCase().startsWith(targetUniv.toLowerCase());
                    if (feedMode === 'campus' && !isMatch) return;
                    if (feedMode === 'global' && isMatch) return;
                }

                const newConfession: Confession = {
                    id: p.id, userId: 'Anonymous', text: p.text || '', imageUrl: p.image_url,
                    timestamp: new Date(p.created_at).getTime(), likes: 0, reactions: {}, comments: [],
                    university: p.university, type: p.type as 'text' | 'poll', pollOptions: [],
                    userVote: undefined, userReaction: undefined
                };
                setConfessions(prev => {
                    const updated = [newConfession, ...prev];
                    writeCache(feedMode, updated);
                    return updated;
                });
            })
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'confession_comments' }, async (payload) => {
                const record = payload.new as any;
                const confessionId = record.confession_id;

                // Skip own comments — already added optimistically in handleCommentSubmit
                if (currentUser && record.user_id === currentUser.id) return;

                setConfessions(prev => {
                    const exists = prev.some(c => c.id === confessionId);
                    if (!exists) return prev;
                    const updated = prev.map(c => {
                        if (c.id !== confessionId) return c;
                        if (expandedCommentsRef.current[confessionId]) {
                            // Dedup by ID before adding
                            if (c.comments?.some(com => com.id === record.id)) return c;
                            const newComment = { id: record.id, userId: 'Anonymous', text: record.text, timestamp: new Date(record.created_at).getTime() };
                            return { ...c, comments: [...(c.comments || []), newComment] };
                        }
                        // Not expanded — just bump the count with a placeholder
                        return { ...c, comments: [...(c.comments || []), { id: record.id, userId: '', text: '', timestamp: 0 }] };
                    });
                    return updated;
                });
            })
            .subscribe();

        return () => { supabase.removeChannel(channel); };
    }, [currentUser?.id, currentUser?.university, sortType, feedMode]);


    // 3. Fetch Logic
    const fetchConfessions = useCallback(async (pageIndex: number, reset = false) => {
        if (!supabase) return;
        if (pageIndex > 0) setIsLoadingMore(true);

        const from = pageIndex * POSTS_PER_PAGE;
        const to = from + POSTS_PER_PAGE - 1;

        const targetUniv = currentUser ? currentUser.university : null;
        const targetUnivClean = targetUniv?.trim();

        let query = supabase.from('confessions')
            .select(`
                *, 
                poll_options (*), 
                confession_reactions (emoji, user_id), 
                confession_comments (
                    id, text, created_at, user_id, 
                    profiles (anonymous_id, avatar)
                ),
                comment_count:confession_comments(count)
            `)
            .order('created_at', { foreignTable: 'confession_comments', ascending: false })
            .limit(3, { foreignTable: 'confession_comments' })
            .range(from, to);

        if (feedMode === 'campus' && targetUnivClean) {
            query = query.ilike('university', `${targetUnivClean}%`);
        } else if (feedMode === 'global' && targetUnivClean) {
            query = query.not('university', 'ilike', `${targetUnivClean}%`);
        }

        if (sortType === 'newest') {
            query = query.order('created_at', { ascending: false });
        } else if (sortType === 'oldest') {
            query = query.order('created_at', { ascending: true });
        } else {
            query = query.order('created_at', { ascending: false });
        }

        const { data: posts, error } = await query;

        if (error || !posts) {
            console.error('Error:', error);
            setIsLoading(false);
            setIsLoadingMore(false);
            return;
        }

        if (posts.length < POSTS_PER_PAGE) setHasMore(false);

        // Fetch votes in parallel (fire immediately, await result below)
        const postIds = posts.map(p => p.id);
        let myVotes: any[] = [];
        if (currentUser) {
            const votesPromise = supabase.from('poll_votes').select('confession_id, option_id').in('confession_id', postIds).eq('user_id', currentUser.id);
            const { data } = await votesPromise;
            myVotes = data || [];
        }
        const myVoteMap = new Map();
        myVotes?.forEach(v => myVoteMap.set(v.confession_id, v.option_id));

        const formatted: Confession[] = posts.map((p: any) => {
            const reactionCounts: Record<string, number> = {};
            p.confession_reactions.forEach((r: any) => { reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1; });

            return {
                id: p.id, userId: 'Anonymous', text: p.text || '', imageUrl: p.image_url,
                timestamp: new Date(p.created_at).getTime(),
                likes: p.confession_reactions.length, reactions: reactionCounts,
                comments: p.confession_comments?.map((c: any) => ({
                    id: c.id,
                    userId: c.profiles?.anonymous_id || 'Anonymous',
                    text: c.text,
                    timestamp: new Date(c.created_at).getTime()
                })) || [],
                commentCount: (p as any).comment_count?.[0]?.count || p.confession_comments?.length || 0,
                university: p.university, type: p.type as 'text' | 'poll',
                pollOptions: p.poll_options?.map((opt: any) => ({ id: opt.id, text: opt.text, votes: opt.vote_count })),
                userVote: myVoteMap.get(p.id),
                userReaction: currentUser ? p.confession_reactions.find((r: any) => r.user_id === currentUser.id)?.emoji : undefined
            };
        });

        if (reset) {
            setConfessions(formatted);
            setIsLoading(false);
            // Update Cache (Safely)
            writeCache(feedMode, formatted);
        } else {
            setConfessions(prev => {
                const existing = new Set(prev.map(c => c.id));
                const updated = [...prev, ...formatted.filter(c => !existing.has(c.id))];
                return updated;
            });
        }
        setIsLoadingMore(false);
    }, [currentUser?.id, currentUser?.university, sortType, feedMode]);

    // 4. Infinite Scroll
    useEffect(() => {
        const observer = new IntersectionObserver(entries => {
            if (entries[0].isIntersecting && hasMore && !isLoadingMore && !isLoading && !isRefreshing) {
                const nextPage = page + 1;
                setPage(nextPage);
                fetchConfessions(nextPage, false);
            }
        }, { threshold: 1.0 });
        if (observerTarget.current) observer.observe(observerTarget.current);
        return () => observer.disconnect();
    }, [hasMore, isLoadingMore, isLoading, isRefreshing, page, fetchConfessions]);


    // --- Handlers (Preserved) ---

    const handleReactionClick = (e: React.MouseEvent, id: string) => {
        if (!currentUser) {
            setShowAuthModal(true);
            return;
        }
        if (activeReactionMenu === id) { setActiveReactionMenu(null); setMenuPosition(null); }
        else {
            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
            let left = rect.left; if (left + 300 > window.innerWidth) left = window.innerWidth - 310; if (left < 10) left = 10;
            setMenuPosition({ top: rect.bottom + 5, left }); setActiveReactionMenu(id);
        }
    };

    const submitPost = async (college: string, branch: string) => {
        if (!supabase) return;

        setIsPosting(true);

        // OPTIMISTIC UPDATE: Add to UI immediately
        const optimisticId = 'opt-' + Date.now();
        const optimisticPost: Confession = {
            id: optimisticId,
            userId: 'You',
            text: newText,
            imageUrl: uploadedVideoUrl ? undefined : (newImage || undefined),
            videoUrl: uploadedVideoUrl || undefined,
            timestamp: Date.now(),
            likes: 0,
            reactions: {},
            comments: [],
            university: `${college}|${branch}`,
            type: uploadedVideoUrl ? 'video' : (isPollMode ? 'poll' : 'text'),
            pollOptions: isPollMode ? pollOptions.filter(o => o.trim()).map((t, i) => ({ id: 'opt-opt-' + i, text: t, votes: 0 })) : undefined
        };

        setConfessions(prev => {
            const updated = [optimisticPost, ...prev];
            writeCache(feedMode, updated);
            return updated;
        });

        // Reset inputs immediately
        setNewText(''); setNewImage(null); setUploadedVideoUrl(null); setIsPollMode(false); setPollOptions(['', '']);

        try {
            const userId = currentUser ? currentUser.id : 'a3e96230-6a78-4215-bcd0-882e1af61127';

            // Check daily limits...
            const startOfDay = new Date(); startOfDay.setHours(0, 0, 0, 0);
            const { data: dailyPosts, error: limitError } = await supabase
                .from('confessions').select('type, image_url').eq('user_id', userId).gte('created_at', startOfDay.toISOString());

            if (limitError) throw limitError;
            const totalPosts = dailyPosts?.length || 0;

            if (currentUser) {
                if (totalPosts >= 3) {
                    alert("Daily limit reached (3 posts)!");
                    setConfessions(prev => prev.filter(p => p.id !== optimisticId));
                    setIsPosting(false);
                    return;
                }
            } else {
                // Guests are limited to 1 post per day.
                const lastPostStr = localStorage.getItem('otherhalf_guest_last_post_time');
                if (lastPostStr) {
                    const lastPostTime = parseInt(lastPostStr, 10);
                    const timeDiff = Date.now() - lastPostTime;
                    if (timeDiff < 24 * 60 * 60 * 1000) {
                        const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - timeDiff) / (1000 * 60 * 60));
                        alert(`Guests can only post once a day. You can post again in ${hoursLeft} hours!`);
                        setConfessions(prev => prev.filter(p => p.id !== optimisticId));
                        setIsPosting(false);
                        return;
                    }
                }
            }

            let post: any;
            if (currentUser) {
                // Logged-in user: insert directly via Supabase client (auth token included)
                const { data, error } = await supabase
                    .from('confessions')
                    .insert({
                        user_id: userId,
                        university: `${college}|${branch}`,
                        text: optimisticPost.text,
                        image_url: optimisticPost.videoUrl || optimisticPost.imageUrl,
                        type: optimisticPost.type
                    })
                    .select().single();

                if (error) throw error;
                post = data;

                if (isPollMode && post) {
                    const optionsToInsert = pollOptions.filter(o => o.trim()).map(text => ({ confession_id: post.id, text }));
                    await supabase.from('poll_options').insert(optionsToInsert);
                }
            } else {
                // Guest user: call the backend proxy endpoint to bypass RLS
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || process.env.VITE_API_URL || '';

                // Get auth token (may be null for truly unauthenticated guests)
                const { data: { session: guestSession } } = await supabase.auth.getSession();
                const guestToken = guestSession?.access_token ?? '';

                const response = await fetch(`${apiUrl}/api/post-guest-confession`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        ...(guestToken ? { 'Authorization': `Bearer ${guestToken}` } : {})
                    },
                    body: JSON.stringify({
                        college,
                        branch,
                        text: optimisticPost.text,
                        imageUrl: optimisticPost.imageUrl,
                        videoUrl: optimisticPost.videoUrl,
                        type: optimisticPost.type,
                        pollOptions: isPollMode ? pollOptions : undefined
                    })
                });

                if (!response.ok) {
                    const errRes = await response.json();
                    throw new Error(errRes.error || 'Failed to post guest confession');
                }

                const resData = await response.json();
                post = resData.post;
            }

            analytics.confessionPost(isPollMode ? 'poll' : uploadedVideoUrl ? 'video' : newImage ? 'image' : 'text');

            if (!currentUser) {
                localStorage.setItem('otherhalf_guest_last_post_time', String(Date.now()));
            }

            // Replace optimistic with real
            setConfessions(prev => {
                const updated = prev.map(p => p.id === optimisticId ? { ...p, id: post!.id } : p);
                writeCache(feedMode, updated);
                return updated;
            });

        } catch (err) {
            console.error('Post error:', err);
            alert('Failed to post.');
            // Revert state and cache
            setConfessions(prev => {
                const reverted = prev.filter(p => p.id !== optimisticId);
                writeCache(feedMode, reverted);
                return reverted;
            });
        } finally { setIsPosting(false); }
    };

    const handlePost = async () => {
        if (!isPollMode && !newText.trim() && !newImage && !uploadedVideoUrl) return;
        if (isPollMode && (pollOptions.filter(o => o.trim()).length < 2 || !newText.trim())) return;

        if (!currentUser) {
            // Enforce rate limit (1 post per 24 hours)
            const lastPostStr = localStorage.getItem('otherhalf_guest_last_post_time');
            if (lastPostStr) {
                const lastPostTime = parseInt(lastPostStr, 10);
                const timeDiff = Date.now() - lastPostTime;
                if (timeDiff < 24 * 60 * 60 * 1000) {
                    const hoursLeft = Math.ceil((24 * 60 * 60 * 1000 - timeDiff) / (1000 * 60 * 60));
                    alert(`Guests can only post once a day. You can post again in ${hoursLeft} hours!`);
                    setShowAuthModal(true);
                    return;
                }
            }
            await submitPost('Guest', 'General');
        } else {
            await submitPost(currentUser.university, currentUser.branch || 'General');
        }
    };

    const handlePollVote = async (confessionId: string, optionId: string) => {
        if (!currentUser) {
            setShowAuthModal(true);
            return;
        }
        if (!supabase) return;
        setConfessions(prev => {
            const updated = prev.map(c => {
                if (c.id !== confessionId || !c.pollOptions) return c;
                if (c.userVote) return c;
                return {
                    ...c, userVote: optionId,
                    pollOptions: c.pollOptions!.map(opt => opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt)
                };
            });
            writeCache(feedMode, updated);
            return updated;
        });
        try { await supabase.from('poll_votes').insert({ confession_id: confessionId, option_id: optionId, user_id: currentUser.id }); } catch (err) { console.error(err); fetchConfessions(0, true); }
    };

    const handleReaction = async (id: string, emoji: string) => {
        if (!currentUser) {
            setShowAuthModal(true);
            return;
        }
        setActiveReactionMenu(null); setMenuPosition(null);
        const confession = confessions.find(c => c.id === id);
        const previousReaction = confession?.userReaction;

        setConfessions(prev => {
            const updated = prev.map(c => {
                if (c.id !== id) return c;
                const newReactions = { ...c.reactions };
                if (previousReaction) newReactions[previousReaction] = Math.max(0, (newReactions[previousReaction] || 1) - 1);
                let newUserReaction: string | undefined = emoji;
                if (previousReaction === emoji) newUserReaction = undefined;
                else newReactions[emoji] = (newReactions[emoji] || 0) + 1;
                return { ...c, userReaction: newUserReaction, reactions: newReactions, likes: Object.values(newReactions).reduce((a, b) => a + b, 0) };
            });
            writeCache(feedMode, updated);
            return updated;
        });

        try {
            if (previousReaction === emoji) { await supabase.from('confession_reactions').delete().eq('confession_id', id).eq('user_id', currentUser.id); }
            else { analytics.confessionReact(emoji); await supabase.from('confession_reactions').upsert({ confession_id: id, user_id: currentUser.id, emoji }, { onConflict: 'confession_id,user_id' }); }
        } catch (err) { console.error(err); }
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) { 
            const reader = new FileReader(); 
            reader.onloadend = () => {
                setNewImage(reader.result as string);
                setUploadedVideoUrl(null);
            }; 
            reader.readAsDataURL(file); 
        }
    };

    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 20 * 1024 * 1024) {
            alert("Video exceeds 20MB limit. Please choose a shorter clip.");
            return;
        }

        setVideoUploading(true);
        try {
            const fileExt = file.name.split('.').pop() || 'mp4';
            const fileName = `videos/${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${fileExt}`;

            const { error: vErr } = await supabase.storage.from('confession-media').upload(fileName, file, {
                cacheControl: '3600',
                upsert: false
            });
            if (vErr) throw vErr;

            const { data: { publicUrl } } = supabase.storage.from('confession-media').getPublicUrl(fileName);
            setUploadedVideoUrl(publicUrl);
            setNewImage(null);
            setIsPollMode(false);
            showToast('Video attached! 🎬');
        } catch (err: any) {
            console.error('Video upload error:', err);
            alert(err.message || "Failed to upload video.");
        } finally {
            setVideoUploading(false);
        }
    };

    const toggleComments = async (id: string) => {
        const isExpanding = !expandedComments[id];
        setExpandedComments(prev => ({ ...prev, [id]: isExpanding }));
        // No need to fetch if we already have them from initial load (mostly)
        // But if truncated, we might need to. For now, assume initial load is enough for preview.
        // If we want full thread, we can still fetch.
        if (isExpanding) {
            const { data } = await supabase!
                .from('confession_comments').select(`id, text, created_at, user_id, profiles(anonymous_id)`).eq('confession_id', id).order('created_at', { ascending: true });
            if (data) {
                setConfessions(prev => {
                    const updated = prev.map(c => {
                        if (c.id !== id) return c;
                        return {
                            ...c, comments: data.map((com: any) => ({
                                id: com.id, userId: com.profiles?.anonymous_id || 'Anonymous', text: com.text, timestamp: new Date(com.created_at).getTime()
                            }))
                        };
                    });
                    writeCache(feedMode, updated);
                    return updated;
                });
            }
        }
    };

    const handleCommentSubmit = async (confessionId: string) => {
        const text = commentInputs[confessionId];
        if (!text?.trim()) return;
        if (!currentUser) {
            setShowAuthModal(true);
            return;
        }

        const optimisticComment = {
            id: 'opt-' + Date.now(),
            userId: 'You',
            text: text.trim(),
            timestamp: Date.now()
        };

        setConfessions(prev => {
            const updated = prev.map(c => {
                if (c.id !== confessionId) return c;
                return { ...c, comments: [...(c.comments || []), optimisticComment] };
            });
            writeCache(feedMode, updated);
            return updated;
        });

        setCommentInputs(prev => ({ ...prev, [confessionId]: '' }));
        // Ensure expanded to see it
        setExpandedComments(prev => ({ ...prev, [confessionId]: true }));

        try {
            const { data: inserted } = await supabase!.from('confession_comments').insert({ confession_id: confessionId, user_id: currentUser.id, text: text.trim() }).select('id').single();
            // Replace the optimistic temp ID with the real DB ID to prevent future dedup issues
            if (inserted?.id) {
                setConfessions(prev => prev.map(c => {
                    if (c.id !== confessionId) return c;
                    return { ...c, comments: c.comments.map(com => com.id === optimisticComment.id ? { ...com, id: inserted.id } : com) };
                }));
            }
        } catch (err) { console.error(err); }
    };
    // isAmityStudent restriction removed to support other colleges in campus and global feeds

    return (
        <div className="h-full w-full bg-transparent text-white flex flex-col relative overflow-hidden font-sans">
            {/* Header */}
            <div className="flex-none p-4 border-b border-gray-800/50 bg-black/20 backdrop-blur-md z-40 sticky top-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto">
                    <div className="flex items-center gap-3">
                        <button onClick={() => navigate.push('/home')} aria-label="Go back to Discover" className="p-2 hover:bg-gray-800 rounded-full hidden md:block"><ArrowLeft className="w-6 h-6 text-gray-400" aria-hidden="true" /></button>
                        <div>
                            <h1 className="text-xl font-bold uppercase tracking-tight">Confessions</h1>
                            <p className="text-[10px] text-gray-500 font-mono">
                                {currentUser 
                                    ? (feedMode === 'campus' ? currentUser.university : 'Global Feed') 
                                    : 'Global Feed'}
                            </p>
                        </div>
                    </div>

                    {/* Sort button on mobile */}
                    <div className="sm:hidden relative">
                        <button onClick={() => setShowSortMenu(!showSortMenu)} aria-label="Sort options" aria-expanded={showSortMenu} className={`p-2 rounded-full transition-colors ${showSortMenu ? 'bg-white text-black' : 'bg-gray-900 text-gray-400'}`}><SlidersHorizontal className="w-5 h-5" aria-hidden="true" /></button>
                        {showSortMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)}></div>
                                <div className="absolute right-0 top-12 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-20">
                                    {['newest', 'oldest'].map((type) => (
                                        <button key={type} onClick={() => { setSortType(type as SortOption); setShowSortMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 capitalize">{type}</button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {/* Tabs & Sort (Desktop/Tablet) */}
                <div className="flex items-center justify-center sm:justify-end gap-2 sm:gap-4 w-full sm:w-auto">
                    {currentUser && (
                        <div className="flex bg-black/60 backdrop-blur-2xl rounded-full p-1 border border-white/10 shadow-2xl w-full sm:w-auto justify-center sm:justify-start">
                            <button
                                onClick={() => setFeedMode('campus')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase transition-all duration-300 ${feedMode === 'campus'
                                    ? 'bg-gradient-to-r from-neon to-pink-600 text-white shadow-[0_0_20px_rgba(255,0,127,0.4)]'
                                    : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                <School className="w-3.5 h-3.5" />
                                Campus
                            </button>
                            <button
                                onClick={() => setFeedMode('global')}
                                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-full text-[11px] font-bold uppercase transition-all duration-300 ${feedMode === 'global'
                                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-[0_0_20px_rgba(59,130,246,0.4)]'
                                    : 'text-gray-500 hover:text-gray-300'
                                    }`}
                            >
                                <Globe className="w-3.5 h-3.5" />
                                Global
                            </button>
                        </div>
                    )}

                    {/* Sort Menu (Desktop/Tablet) */}
                    <div className="hidden sm:block relative">
                        <button onClick={() => setShowSortMenu(!showSortMenu)} aria-label="Sort options" aria-expanded={showSortMenu} className={`p-2 rounded-full transition-colors ${showSortMenu ? 'bg-white text-black' : 'bg-gray-900 text-gray-400'}`}><SlidersHorizontal className="w-5 h-5" aria-hidden="true" /></button>
                        {showSortMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowSortMenu(false)}></div>
                                <div className="absolute right-0 top-12 w-48 bg-gray-900 border border-gray-800 rounded-lg shadow-xl z-20">
                                    {['newest', 'oldest'].map((type) => (
                                        <button key={type} onClick={() => { setSortType(type as SortOption); setShowSortMenu(false); }} className="w-full text-left px-4 py-2 text-sm text-gray-400 hover:bg-gray-800 capitalize">{type}</button>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Feed */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4 pb-48 relative z-10">
                {isLoading && <LoadingOverlay />}

                {!isLoading && (
                    <div className="space-y-4">
                        {confessions.map(conf => {
                            const { college, department } = parseUniversity(conf.university);
                            return (
                                <div key={conf.id} className={`bg-gray-900/30 backdrop-blur-md border rounded-xl p-4 ${conf.id === '46c46dcc-ad75-487d-b5a4-70b03081c222' ? 'border-neon/50' : 'border-gray-800/50'}`}>
                                    {/* Card Content Matches User's + Existing */}
                                    <div className="flex gap-3 mb-3">
                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${conf.id === '46c46dcc-ad75-487d-b5a4-70b03081c222' ? 'bg-neon text-white' : 'bg-gray-900 border border-gray-800'}`}>
                                            {conf.id === '46c46dcc-ad75-487d-b5a4-70b03081c222' ? <Crown className="w-5 h-5" /> : <span className="text-sm font-bold text-gray-500">?</span>}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`text-sm font-bold ${conf.id === '46c46dcc-ad75-487d-b5a4-70b03081c222' ? 'text-neon' : 'text-gray-300'}`}>{conf.id === '46c46dcc-ad75-487d-b5a4-70b03081c222' ? 'Team Other Half' : conf.userId}</span>
                                                {feedMode === 'global' && college && (
                                                    <span className="bg-[#ff007f]/10 text-neon text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-[#ff007f]/20">
                                                        {college.split(',')[0]}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex justify-between items-center mt-0.5">
                                                <p className="text-[10px] text-gray-600 uppercase font-bold">
                                                    {department || 'General'}
                                                </p>
                                                <span className="text-[10px] text-gray-600 font-mono">{new Date(conf.timestamp).toLocaleDateString()}</span>
                                            </div>
                                        </div>

                                        {/* 3-Dot Action Menu (Share & Copy) */}
                                        <div className="relative shrink-0">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveCardMenu(activeCardMenu === conf.id ? null : conf.id);
                                                }}
                                                aria-label="Post actions"
                                                className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>

                                            {activeCardMenu === conf.id && (
                                                <>
                                                    <div className="fixed inset-0 z-30 bg-transparent" onClick={() => setActiveCardMenu(null)} />
                                                    <div className="absolute right-0 top-8 w-40 bg-[#0d0714]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.85)] z-40 animate-in fade-in zoom-in-95 duration-100">
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleShareConfession(conf);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                                        >
                                                            <Share2 className="w-4 h-4 text-neon shrink-0" />
                                                            <span>Share Link</span>
                                                        </button>
                                                        <button 
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleCopyText(conf);
                                                            }}
                                                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                                                        >
                                                            <Copy className="w-4 h-4 text-gray-400 shrink-0" />
                                                            <span>Copy Text</span>
                                                        </button>
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap">{conf.text}</p>
                                    
                                    {/* Image Media */}
                                    {conf.imageUrl && !conf.imageUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i) && conf.type !== 'video' && (
                                        <div className="mb-4 rounded-lg overflow-hidden border border-gray-900 bg-black aspect-video cursor-pointer" onClick={() => setViewImage(conf.imageUrl || null)}>
                                            <img src={conf.imageUrl} className="w-full h-full object-cover" alt="Confession image" />
                                        </div>
                                    )}

                                    {/* Video Media */}
                                    {(conf.type === 'video' || conf.videoUrl || conf.imageUrl?.match(/\.(mp4|webm|mov)(\?.*)?$/i)) && (
                                        <div className="mb-4">
                                            <VideoPlayer 
                                                src={conf.videoUrl || conf.imageUrl!} 
                                                onDoubleTap={() => handleReaction(conf.id, '❤️')} 
                                            />
                                        </div>
                                    )}

                                    {conf.type === 'poll' && conf.pollOptions && (
                                        <div className="mb-4 space-y-2.5 bg-black/40 p-3.5 rounded-2xl border border-white/10">
                                            {conf.pollOptions.map(option => {
                                                const total = conf.pollOptions?.reduce((a, b) => a + b.votes, 0) || 0;
                                                const pct = total > 0 ? Math.round((option.votes / total) * 100) : 0;
                                                const isVoted = conf.userVote === option.id;
                                                return (
                                                    <button 
                                                        key={option.id} 
                                                        onClick={() => handlePollVote(conf.id, option.id)} 
                                                        disabled={!!conf.userVote} 
                                                        className={`w-full relative h-10 rounded-xl border overflow-hidden transition-all text-left active:scale-[0.99] ${
                                                            isVoted 
                                                                ? 'border-neon/60 bg-neon/10 shadow-[0_0_15px_rgba(255,0,127,0.2)]' 
                                                                : 'border-white/10 bg-gray-900/50 hover:border-white/20'
                                                        }`}
                                                    >
                                                        {/* Animated Gradient Fill Bar */}
                                                        <div 
                                                            className={`absolute top-0 left-0 h-full transition-all duration-700 ease-out ${
                                                                isVoted 
                                                                    ? 'bg-gradient-to-r from-neon/40 to-purple-600/40 border-r-2 border-neon' 
                                                                    : 'bg-white/10'
                                                            }`} 
                                                            style={{ width: `${pct}%` }} 
                                                        />
                                                        <div className="absolute inset-0 flex items-center justify-between px-3.5 z-10">
                                                            <span className={`text-xs font-semibold flex items-center gap-1.5 ${isVoted ? 'text-neon font-bold' : 'text-gray-200'}`}>
                                                                {option.text}
                                                                {isVoted && <Check className="w-3.5 h-3.5 text-neon stroke-[3]" />}
                                                            </span>
                                                            <span className="text-[11px] font-mono text-gray-400 font-bold">{pct}%</span>
                                                        </div>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}

                                    {/* Action Row */}
                                    <div className="flex items-center gap-3 pt-1 text-gray-400 border-t border-gray-800/40">
                                        <button 
                                            onClick={(e) => handleReactionClick(e, conf.id)}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                                conf.userReaction 
                                                    ? 'bg-[#ff007f]/10 border-[#ff007f]/40 text-neon shadow-[0_0_15px_rgba(255,0,127,0.15)]' 
                                                    : 'border-white/5 bg-white/5 hover:border-white/15 text-gray-300'
                                            }`}
                                        >
                                            <span className="text-sm">{conf.userReaction || '❤️'}</span>
                                            <span className="font-bold">{conf.likes > 0 ? conf.likes : 'Vibe'}</span>
                                        </button>

                                        <button 
                                            onClick={() => toggleComments(conf.id)} 
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                                                expandedComments[conf.id]
                                                    ? 'bg-white/10 border-white/20 text-white'
                                                    : 'border-white/5 bg-white/5 hover:border-white/15 text-gray-400 hover:text-gray-200'
                                            }`}
                                        >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            <span>{conf.comments?.length || conf.commentCount || 0}</span>
                                        </button>
                                    </div>

                                    {/* Expanded Comments */}
                                    {expandedComments[conf.id] && (
                                        <div className="mt-3 pt-3 border-t border-gray-800/50 space-y-2">
                                            <div className="space-y-1.5 max-h-48 overflow-y-auto custom-scrollbar">
                                                {conf.comments?.map(com => (
                                                    <div key={com.id} className="text-xs bg-gray-900/40 border border-gray-800/40 rounded-lg p-2 flex justify-between gap-2">
                                                        <div>
                                                            <span className="font-bold text-gray-400 block text-[10px]">{com.userId}</span>
                                                            <p className="text-gray-300 mt-0.5">{com.text}</p>
                                                        </div>
                                                        <span className="text-[9px] text-gray-600 font-mono shrink-0">{com.timestamp ? new Date(com.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
                                                    </div>
                                                ))}
                                            </div>
                                            <div className="flex gap-2 mt-2">
                                                <input 
                                                    value={commentInputs[conf.id] || ''} 
                                                    onChange={e => setCommentInputs({ ...commentInputs, [conf.id]: e.target.value })} 
                                                    onKeyDown={e => e.key === 'Enter' && handleCommentSubmit(conf.id)} 
                                                    placeholder="Add anonymous comment..." 
                                                    className="flex-1 bg-gray-900/60 border border-gray-800 rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-gray-600 outline-none focus:border-gray-700" 
                                                />
                                                <button onClick={() => handleCommentSubmit(conf.id)} className="p-1.5 bg-neon rounded-lg text-white hover:bg-neon/80"><Send className="w-3.5 h-3.5" /></button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Loading More Spinner */}
                {hasMore && <div ref={observerTarget} className="flex justify-center p-4"><Loader2 className="w-6 h-6 text-neon animate-spin" /></div>}
            </div>

            {/* Input Area */}
            <div className="fixed bottom-20 md:bottom-0 left-0 right-0 z-30 px-3 pb-6 pt-10 pointer-events-none flex justify-center w-full bg-gradient-to-t from-black via-black/80 to-transparent">
                <div className="max-w-lg w-full pointer-events-auto">
                    <div className="bg-[#0b0b10]/95 backdrop-blur-2xl border border-white/15 rounded-full p-1.5 pl-2.5 shadow-[0_10px_35px_rgba(0,0,0,0.8)] flex items-center gap-1 sm:gap-1.5">
                        {/* Media previews */}
                        {newImage && !isPollMode && (
                            <div className="relative w-7 h-7 shrink-0">
                                <img src={newImage} className="w-full h-full object-cover rounded-lg" alt="Preview" />
                                <button onClick={() => setNewImage(null)} className="absolute -top-1 -right-1 bg-black/80 border border-white/20 rounded-full p-0.5"><X className="w-2 h-2 text-white" /></button>
                            </div>
                        )}
                        {uploadedVideoUrl && !isPollMode && (
                            <div className="relative flex items-center gap-1 bg-neon/15 border border-neon/30 rounded-lg px-2 py-0.5 shrink-0">
                                <VideoIcon className="w-3.5 h-3.5 text-neon" />
                                <span className="text-[9px] font-bold text-neon uppercase">Video</span>
                                <button onClick={() => setUploadedVideoUrl(null)} className="bg-black/80 rounded-full p-0.5 ml-0.5 text-gray-300 hover:text-white">
                                    <X className="w-2.5 h-2.5" />
                                </button>
                            </div>
                        )}

                        {/* Action buttons tightly clustered */}
                        <div className="flex items-center gap-0.5 shrink-0">
                            <button 
                                onClick={() => { 
                                    setIsPollMode(!isPollMode); 
                                    setNewImage(null); 
                                    setUploadedVideoUrl(null);
                                }} 
                                aria-label={isPollMode ? 'Cancel poll mode' : 'Create a poll'}
                                aria-pressed={isPollMode}
                                className={`p-1.5 rounded-full transition-colors ${isPollMode ? 'text-white bg-white/20' : 'text-gray-400 hover:text-white'}`}
                            >
                                <BarChart2 className="w-4 h-4" aria-hidden="true" />
                            </button>
                            
                            {/* Image picker */}
                            <input id="confession-image-input" type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
                            <button 
                                onClick={() => document.getElementById('confession-image-input')?.click()} 
                                disabled={isPollMode || !!uploadedVideoUrl} 
                                aria-label="Upload image"
                                className="p-1.5 text-gray-400 hover:text-white disabled:opacity-20 transition-colors"
                            >
                                <ImageIcon className="w-4 h-4" aria-hidden="true" />
                            </button>

                            {/* Video picker */}
                            <input id="confession-video-input" type="file" accept="video/mp4,video/webm,video/quicktime" className="hidden" onChange={handleVideoUpload} />
                            <button 
                                onClick={() => document.getElementById('confession-video-input')?.click()} 
                                disabled={isPollMode || !!newImage || videoUploading} 
                                aria-label="Upload video"
                                className={`p-1.5 transition-colors ${uploadedVideoUrl ? 'text-neon' : 'text-gray-400 hover:text-white'} disabled:opacity-20`}
                            >
                                {videoUploading ? <Loader2 className="w-4 h-4 animate-spin text-neon" /> : <VideoIcon className="w-4 h-4" />}
                            </button>
                        </div>

                        <div className="h-4 w-px bg-white/15 shrink-0"></div>

                        {/* Text Input with min-w-0 for proper flexbox shrinking */}
                        <input 
                            value={newText} 
                            onChange={e => setNewText(e.target.value)} 
                            placeholder={isPollMode ? "Poll question..." : (uploadedVideoUrl ? "Add caption..." : "Confess anonymously...")} 
                            aria-label={isPollMode ? 'Poll question' : 'Anonymous confession text'}
                            className="flex-1 min-w-0 bg-transparent text-white px-2 outline-none text-xs font-medium placeholder-gray-500" 
                        />

                        {/* Send Button */}
                        <button 
                            onClick={handlePost} 
                            aria-label="Post confession" 
                            disabled={isPosting || videoUploading || (!newText.trim() && !newImage && !uploadedVideoUrl)} 
                            className="p-2 bg-white rounded-full text-black hover:bg-gray-200 disabled:opacity-30 shrink-0 transition-transform active:scale-95 shadow-md"
                        >
                            {isPosting ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : <Send className="w-3.5 h-3.5 ml-0.5" aria-hidden="true" />}
                        </button>
                    </div>

                    {isPollMode && (
                        <div className="mt-2 bg-[#0b0b10]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl">
                            {pollOptions.map((opt, i) => (
                                <input 
                                    key={i} 
                                    className="w-full bg-white/5 border border-white/10 text-white text-xs px-3 py-2 rounded-xl mb-2 placeholder-gray-500 outline-none focus:border-neon/50" 
                                    placeholder={`Option ${i + 1}`} 
                                    value={opt} 
                                    onChange={e => { const n = [...pollOptions]; n[i] = e.target.value; setPollOptions(n); }} 
                                />
                            ))}
                            {pollOptions.length < 4 && (
                                <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-[10px] text-neon hover:underline font-bold w-full text-center py-1">
                                    + Add Option
                                </button>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Emoji Reaction Popup Menu */}
            {activeReactionMenu && (
                <>
                    <div className="fixed inset-0 z-40 bg-transparent" onClick={() => { setActiveReactionMenu(null); setMenuPosition(null); }} />
                    <div 
                        className="fixed z-50 bg-[#0b0314]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.85)] animate-in fade-in zoom-in-90 duration-150" 
                        style={menuPosition ? { top: menuPosition.top, left: menuPosition.left } : {}}
                    >
                        <div className="flex items-center gap-1">
                            {REACTIONS.map(emoji => (
                                <button 
                                    key={emoji} 
                                    onClick={() => handleReaction(activeReactionMenu, emoji)} 
                                    className="text-2xl hover:scale-125 transition-transform p-1.5 active:scale-95"
                                >
                                    {emoji}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
            {viewImage && <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-4" onClick={() => setViewImage(null)}><img src={viewImage} className="max-w-full max-h-[90vh] object-contain rounded-lg" onClick={e => e.stopPropagation()} /></div>}
            
            {/* Action Feedback Toast */}
            {toastMessage && (
                <div className="fixed bottom-24 md:bottom-12 left-1/2 -translate-x-1/2 z-50 bg-[#160b24]/95 border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-[0_10px_30px_rgba(255,0,127,0.3)] backdrop-blur-2xl flex items-center gap-2 animate-in fade-in slide-in-from-bottom-2 duration-150">
                    <Check className="w-4 h-4 text-neon" />
                    <span>{toastMessage}</span>
                </div>
            )}

            <AuthPromptModal
                isOpen={showAuthModal}
                onClose={() => {
                    setShowAuthModal(false);
                    setCustomAuthMessage(undefined);
                }}
                message={customAuthMessage}
            />


        </div>
    );
};
