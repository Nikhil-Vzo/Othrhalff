"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../src/lib/supabase';
import { useAuth } from '../../../../src/context/AuthContext';
import { campusList } from '../../../../src/seo/data/campuses';
import { VideoPlayer } from '../../../../src/components/VideoPlayer';
import { Confession } from '../../../../src/types';
import { 
  Heart, MessageCircle, Share2, ArrowLeft, Send, 
  Sparkles, Check, MoreVertical, Copy, Loader2, School, Ghost 
} from 'lucide-react';

interface Props {
  campusSlug: string;
  confessionId: string;
}

const REACTIONS = ['❤️', '😂', '🔥', '😮', '😢', '👀'];

export default function TeaPageClient({ campusSlug, confessionId }: Props) {
  const router = useRouter();
  const { currentUser } = useAuth();
  const campus = campusList.find(c => c.slug === campusSlug) || {
    name: campusSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    shortName: campusSlug.toUpperCase(),
    slug: campusSlug,
    location: 'India',
    popularTopics: ['CampusLife', 'Confessions', 'Crushes', 'Exams']
  };

  const [confession, setConfession] = useState<Confession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const [showReactionMenu, setShowReactionMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  // Fetch the specific confession by ID
  useEffect(() => {
    async function loadConfession() {
      if (!confessionId) {
        setLoading(false);
        setError(true);
        return;
      }

      try {
        setLoading(true);
        const { data, error: fetchErr } = await supabase
          .from('confessions')
          .select(`
            *,
            poll_options (*),
            confession_reactions (emoji, user_id),
            confession_comments (
              id, text, created_at, user_id,
              profiles:user_id (anonymous_id)
            )
          `)
          .eq('id', confessionId)
          .single();

        if (fetchErr || !data) {
          setError(true);
          return;
        }

        const reactionCounts: Record<string, number> = {};
        data.confession_reactions?.forEach((r: any) => {
          reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
        });

        const isVideo = data.type === 'video' || (data.image_url && /\.(mp4|webm|mov)(\?.*)?$/i.test(data.image_url));

        let userVote: string | undefined;
        if (currentUser) {
          const { data: voteData } = await supabase
            .from('poll_votes')
            .select('option_id')
            .eq('confession_id', confessionId)
            .eq('user_id', currentUser.id)
            .single();
          if (voteData) userVote = voteData.option_id;
        }

        const formatted: Confession = {
          id: data.id,
          userId: 'Anonymous',
          text: data.text || '',
          imageUrl: isVideo ? undefined : data.image_url,
          videoUrl: isVideo ? data.image_url : undefined,
          timestamp: new Date(data.created_at).getTime(),
          likes: data.confession_reactions?.length || 0,
          reactions: reactionCounts,
          comments: data.confession_comments?.map((c: any) => ({
            id: c.id,
            userId: c.profiles?.anonymous_id || 'Anonymous',
            text: c.text,
            timestamp: new Date(c.created_at).getTime()
          })) || [],
          university: data.university,
          type: (isVideo ? 'video' : data.type) as 'text' | 'poll' | 'video',
          pollOptions: data.poll_options?.map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            votes: opt.vote_count || 0
          })),
          userVote,
          userReaction: currentUser ? data.confession_reactions?.find((r: any) => r.user_id === currentUser.id)?.emoji : undefined
        };

        setConfession(formatted);
      } catch (e) {
        console.error('Failed to load confession:', e);
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    loadConfession();
  }, [confessionId, currentUser?.id]);

  const handleReaction = async (emoji: string) => {
    if (!confession) return;
    setShowReactionMenu(false);

    const previousReaction = confession.userReaction;
    const newReactions = { ...confession.reactions };

    if (previousReaction) {
      newReactions[previousReaction] = Math.max(0, (newReactions[previousReaction] || 1) - 1);
    }

    let newUserReaction: string | undefined = emoji;
    if (previousReaction === emoji) {
      newUserReaction = undefined;
    } else {
      newReactions[emoji] = (newReactions[emoji] || 0) + 1;
    }

    setConfession({
      ...confession,
      userReaction: newUserReaction,
      reactions: newReactions,
      likes: Object.values(newReactions).reduce((a, b) => a + b, 0)
    });

    if (currentUser) {
      try {
        if (previousReaction === emoji) {
          await supabase.from('confession_reactions').delete().eq('confession_id', confession.id).eq('user_id', currentUser.id);
        } else {
          await supabase.from('confession_reactions').upsert(
            { confession_id: confession.id, user_id: currentUser.id, emoji },
            { onConflict: 'confession_id,user_id' }
          );
        }
      } catch (err) {
        console.error('Reaction error:', err);
      }
    }
  };

  const handlePollVote = async (optionId: string) => {
    if (!confession || !confession.pollOptions || confession.userVote) return;

    setConfession({
      ...confession,
      userVote: optionId,
      pollOptions: confession.pollOptions.map(opt =>
        opt.id === optionId ? { ...opt, votes: opt.votes + 1 } : opt
      )
    });

    if (currentUser) {
      try {
        await supabase.from('poll_votes').insert({
          confession_id: confession.id,
          option_id: optionId,
          user_id: currentUser.id
        });
      } catch (err) {
        console.error('Poll vote error:', err);
      }
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !confession || submittingComment) return;

    setSubmittingComment(true);
    const optimisticComment = {
      id: 'opt-' + Date.now(),
      userId: currentUser?.anonymousId || 'Anonymous',
      text: newComment.trim(),
      timestamp: Date.now()
    };

    setConfession(prev => prev ? {
      ...prev,
      comments: [...(prev.comments || []), optimisticComment]
    } : null);

    const commentText = newComment.trim();
    setNewComment('');

    try {
      if (currentUser) {
        await supabase.from('confession_comments').insert({
          confession_id: confession.id,
          user_id: currentUser.id,
          text: commentText
        });
      }
      showToast('Comment posted anonymously! 💬');
    } catch (err) {
      console.error('Comment submit error:', err);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleShare = async () => {
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Confession from ${campus.name}`,
          text: confession?.text || 'Check out this campus confession on Othrhalff',
          url: shareUrl
        });
      } catch (err) {}
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard! 🔗');
    }
    setShowMenu(false);
  };

  const handleCopyText = async () => {
    if (confession?.text && typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(confession.text);
      showToast('Confession text copied! 📋');
    }
    setShowMenu(false);
  };

  const universityParts = confession?.university?.split('|') || [campus.name];
  const collegeName = universityParts[0] || campus.name;
  const branchName = universityParts[1] || 'General';

  return (
    <main className="min-h-screen bg-[#07030d] text-white selection:bg-neon selection:text-white">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#120722]/95 backdrop-blur-2xl border border-white/20 text-white text-xs font-semibold px-4 py-2.5 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-4 duration-200 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-neon" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Atmospheric Glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-0 -translate-x-1/2 h-[30rem] w-[30rem] rounded-full bg-[#ff007f]/10 blur-[150px]" />
      </div>

      <div className="relative mx-auto max-w-2xl px-4 pt-16 pb-24 sm:px-6">
        {/* Back Link */}
        <Link
          href="/confessions"
          className="mb-6 inline-flex items-center gap-2 font-mono text-[11px] font-bold tracking-wider text-white/50 transition-colors hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 text-neon" />
          <span>ALL CONFESSIONS</span>
        </Link>

        {/* Loading State */}
        {loading && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 text-center my-8">
            <Loader2 className="w-8 h-8 text-neon animate-spin mx-auto mb-4" />
            <p className="text-sm font-medium text-gray-400">Loading confession from {campus.name}...</p>
          </div>
        )}

        {/* Error / Not Found State */}
        {error && !loading && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] backdrop-blur-xl p-8 text-center my-8">
            <Ghost className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <h1 className="text-lg font-bold text-white mb-2">Confession Not Found</h1>
            <p className="text-xs text-gray-400 max-w-md mx-auto mb-6">
              This confession may have expired or was removed. Check out other real confessions from verified students!
            </p>
            <Link
              href="/confessions"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-neon to-purple-600 text-white font-bold text-xs shadow-lg hover:scale-105 transition-transform"
            >
              Explore Campus Tea →
            </Link>
          </div>
        )}

        {/* Real Live Confession Card */}
        {!loading && !error && confession && (
          <article className="rounded-3xl border border-white/15 bg-[#0e071a]/85 backdrop-blur-2xl p-6 sm:p-7 shadow-2xl relative">
            {/* Author Header */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-600/30 to-pink-500/30 border border-white/20 flex items-center justify-center font-bold text-sm text-neon">
                  🎭
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm text-white">Anonymous Peer</span>
                    <span className="text-[10px] bg-white/10 text-gray-300 px-2 py-0.5 rounded-full font-mono">
                      {branchName}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                    <School className="w-3 h-3 text-neon" />
                    <span>{collegeName}</span>
                  </p>
                </div>
              </div>

              {/* 3-Dot Action Menu */}
              <div className="relative">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  aria-label="Options"
                  className="p-2 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-30" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-10 z-40 w-40 bg-[#120722]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-1.5 shadow-2xl">
                      <button
                        onClick={handleShare}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/10 rounded-xl"
                      >
                        <Share2 className="w-3.5 h-3.5 text-neon" />
                        <span>Share Link</span>
                      </button>
                      <button
                        onClick={handleCopyText}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/10 rounded-xl"
                      >
                        <Copy className="w-3.5 h-3.5 text-gray-400" />
                        <span>Copy Text</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Confession Text */}
            <p className="text-gray-100 text-sm sm:text-base leading-relaxed mb-5 whitespace-pre-wrap font-medium">
              {confession.text}
            </p>

            {/* Image Media */}
            {confession.imageUrl && (
              <div className="mb-5 rounded-2xl overflow-hidden border border-white/10 bg-black/50 aspect-video">
                <img src={confession.imageUrl} alt="Confession media" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Video Media */}
            {(confession.type === 'video' || confession.videoUrl) && (
              <div className="mb-5">
                <VideoPlayer
                  src={confession.videoUrl || confession.imageUrl!}
                  onDoubleTap={() => handleReaction('❤️')}
                />
              </div>
            )}

            {/* Poll Component */}
            {confession.type === 'poll' && confession.pollOptions && (
              <div className="mb-5 space-y-2.5 bg-black/40 p-4 rounded-2xl border border-white/10">
                {confession.pollOptions.map(option => {
                  const totalVotes = confession.pollOptions?.reduce((acc, opt) => acc + opt.votes, 0) || 0;
                  const percentage = totalVotes > 0 ? Math.round((option.votes / totalVotes) * 100) : 0;
                  const isVoted = confession.userVote === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => handlePollVote(option.id)}
                      disabled={!!confession.userVote}
                      className={`w-full relative h-11 rounded-xl border overflow-hidden transition-all text-left active:scale-[0.99] ${
                        isVoted
                          ? 'border-neon/60 bg-neon/10 shadow-[0_0_15px_rgba(255,0,127,0.2)]'
                          : 'border-white/10 bg-gray-900/50 hover:border-white/20'
                      }`}
                    >
                      <div
                        className={`absolute top-0 left-0 h-full transition-all duration-700 ease-out ${
                          isVoted
                            ? 'bg-gradient-to-r from-neon/40 to-purple-600/40 border-r-2 border-neon'
                            : 'bg-white/10'
                        }`}
                        style={{ width: `${percentage}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-between px-4 z-10">
                        <span className={`text-xs font-semibold flex items-center gap-1.5 ${isVoted ? 'text-neon font-bold' : 'text-gray-200'}`}>
                          {option.text}
                          {isVoted && <Check className="w-3.5 h-3.5 text-neon stroke-[3]" />}
                        </span>
                        <span className="text-[11px] font-mono text-gray-400 font-bold">{percentage}%</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Actions & Engagement Bar */}
            <div className="flex items-center gap-3 pt-3 border-t border-white/10 relative">
              {/* Reaction Button */}
              <div className="relative">
                <button
                  onClick={() => setShowReactionMenu(!showReactionMenu)}
                  className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium border transition-all ${
                    confession.userReaction
                      ? 'bg-[#ff007f]/15 border-[#ff007f]/40 text-neon shadow-[0_0_15px_rgba(255,0,127,0.2)]'
                      : 'border-white/10 bg-white/5 hover:border-white/20 text-gray-300'
                  }`}
                >
                  <span className="text-sm">{confession.userReaction || '❤️'}</span>
                  <span className="font-bold">{confession.likes > 0 ? confession.likes : 'Vibe'}</span>
                </button>

                {/* Reaction Picker Popup */}
                {showReactionMenu && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowReactionMenu(false)} />
                    <div className="absolute bottom-11 left-0 z-50 bg-[#120722]/95 backdrop-blur-2xl border border-white/20 rounded-2xl p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.85)] flex items-center gap-1">
                      {REACTIONS.map(emoji => (
                        <button
                          key={emoji}
                          onClick={() => handleReaction(emoji)}
                          className="text-2xl hover:scale-125 transition-transform p-1.5 active:scale-95"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Comments Count */}
              <div className="flex items-center gap-1.5 text-xs text-gray-400 px-2">
                <MessageCircle className="w-4 h-4" />
                <span>{confession.comments?.length || 0} Comments</span>
              </div>

              {/* Share */}
              <button
                onClick={handleShare}
                className="ml-auto flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
              >
                <Share2 className="w-4 h-4" />
                <span>Share</span>
              </button>
            </div>

            {/* Live Comments Thread */}
            <div className="mt-6 pt-5 border-t border-white/10 space-y-3">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Anonymous Comments ({confession.comments?.length || 0})
              </h2>

              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {confession.comments && confession.comments.length > 0 ? (
                  confession.comments.map(com => (
                    <div key={com.id} className="text-xs bg-black/40 border border-white/5 rounded-xl p-2.5 flex justify-between gap-3">
                      <div>
                        <span className="font-bold text-gray-400 block text-[10px]">{com.userId}</span>
                        <p className="text-gray-200 mt-0.5 leading-relaxed">{com.text}</p>
                      </div>
                      <span className="text-[9px] text-gray-600 font-mono shrink-0">
                        {com.timestamp ? new Date(com.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-500 italic py-2">No comments yet. Be the first to drop tea!</p>
                )}
              </div>

              {/* Comment Input Form */}
              <form onSubmit={handleCommentSubmit} className="flex gap-2 pt-2">
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  placeholder="Drop an anonymous comment..."
                  className="flex-1 bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-gray-500 outline-none focus:border-neon/60"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || submittingComment}
                  className="p-2.5 bg-neon rounded-xl text-white hover:bg-neon/80 disabled:opacity-40 transition-opacity"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </article>
        )}

        {/* CTA Card to Discover & Post More */}
        <div className="mt-8 rounded-3xl border border-white/10 bg-gradient-to-b from-white/[0.04] to-transparent p-6 text-center shadow-xl">
          <Sparkles className="w-6 h-6 text-neon mx-auto mb-2" />
          <h2 className="font-geist text-base font-bold text-white">
            Discover more anonymous tea from {campus.name}
          </h2>
          <p className="mt-1.5 text-xs text-gray-400 max-w-sm mx-auto">
            Read real stories, share your secrets anonymously, or find a date from your campus.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/confessions"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-neon to-purple-600 px-6 py-2.5 text-xs font-bold text-white shadow-lg hover:scale-105 transition-transform"
            >
              Open Confessions Feed →
            </Link>
            <Link
              href={`/campus/${campusSlug}`}
              className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-5 py-2.5 text-xs font-bold text-gray-300 hover:text-white hover:bg-white/10 transition-all"
            >
              About {campus.shortName}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
