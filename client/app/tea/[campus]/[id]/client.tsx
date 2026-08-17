"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '../../../../src/lib/supabase';
import { useAuth } from '../../../../src/context/AuthContext';
import { campusList } from '../../../../src/seo/data/campuses';
import { VideoPlayer } from '../../../../src/components/VideoPlayer';
import { Confession } from '../../../../src/types';
import { AuthPromptModal } from '../../../../src/components/AuthPromptModal';
import { 
  Heart, MessageCircle, Share2, ArrowLeft, Send, 
  Sparkles, Check, MoreVertical, Copy, Loader2, School, Ghost, SmilePlus, Crown
} from 'lucide-react';

interface Props {
  campusSlug: string;
  confessionId: string;
}

const REACTIONS = ['❤️', '😂', '🔥', '😮', '😢', '👀'];

function parseUniversity(univString?: string) {
  if (!univString) return { college: '', department: '' };
  const parts = univString.split('|');
  return {
    college: parts[0] || '',
    department: parts[1] || ''
  };
}

export default function TeaPageClient({ campusSlug, confessionId }: Props) {
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
  const [activeReactionMenu, setActiveReactionMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [customAuthMessage, setCustomAuthMessage] = useState<string | undefined>(undefined);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

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
    if (!currentUser) {
      setCustomAuthMessage("Signup to react to confessions");
      setShowAuthModal(true);
      return;
    }
    if (!confession) return;
    setActiveReactionMenu(false);

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
    if (!currentUser) {
      setCustomAuthMessage("Signup to vote in campus polls");
      setShowAuthModal(true);
      return;
    }
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
    if (!currentUser) {
      setCustomAuthMessage("Signup to comment on confessions");
      setShowAuthModal(true);
      return;
    }
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
      showToast('Comment posted! 💬');
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
          title: `Othrhalff Campus Tea`,
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

  const { college, department } = parseUniversity(confession?.university);

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-neon selection:text-white flex flex-col justify-between overflow-x-hidden relative">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#1f0038,transparent_50%)] pointer-events-none" />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#0d0714]/95 backdrop-blur-2xl border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-3 duration-200 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-neon" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="relative z-10 max-w-xl mx-auto w-full px-4 pt-12 pb-24">
        {/* Back Link */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/confessions"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-neon" />
            <span>ALL CONFESSIONS</span>
          </Link>
          <span className="text-[10px] font-mono text-gray-600 uppercase tracking-widest">
            {campus.shortName} CAMPUS TEA
          </span>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="bg-gray-900/30 backdrop-blur-md border border-gray-800/50 rounded-xl p-8 text-center my-6">
            <Loader2 className="w-6 h-6 text-neon animate-spin mx-auto mb-3" />
            <p className="text-xs text-gray-400">Loading confession from {campus.name}...</p>
          </div>
        )}

        {/* Error / Not Found */}
        {error && !loading && (
          <div className="bg-gray-900/30 backdrop-blur-md border border-gray-800/50 rounded-xl p-8 text-center my-6">
            <Ghost className="w-10 h-10 text-gray-600 mx-auto mb-3" />
            <h1 className="text-sm font-bold text-white mb-1">Confession Not Found</h1>
            <p className="text-xs text-gray-500 mb-5">
              This confession might have been deleted or expired.
            </p>
            <Link
              href="/confessions"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-black font-bold text-xs hover:bg-gray-200 transition-all"
            >
              Explore Campus Feed →
            </Link>
          </div>
        )}

        {/* Real Live Confession Card - Exact Match to Confessions.tsx */}
        {!loading && !error && confession && (
          <div className="bg-gray-900/30 backdrop-blur-md border border-gray-800/50 rounded-xl p-4 sm:p-5 shadow-2xl">
            {/* Header */}
            <div className="flex gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 bg-gray-900 border border-gray-800">
                <span className="text-sm font-bold text-gray-500">?</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-gray-300">
                    {confession.userId}
                  </span>
                  {college && (
                    <span className="bg-[#ff007f]/10 text-neon text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-[#ff007f]/20">
                      {college.split(',')[0]}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <p className="text-[10px] text-gray-600 uppercase font-bold">
                    {department || 'General'}
                  </p>
                  <span className="text-[10px] text-gray-600 font-mono">
                    {new Date(confession.timestamp).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* 3-Dot Action Menu */}
              <div className="relative shrink-0">
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  aria-label="Post actions"
                  className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {showMenu && (
                  <>
                    <div className="fixed inset-0 z-30 bg-transparent" onClick={() => setShowMenu(false)} />
                    <div className="absolute right-0 top-8 w-40 bg-[#0d0714]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.85)] z-40 animate-in fade-in zoom-in-95 duration-100">
                      <button
                        onClick={handleShare}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-gray-200 hover:text-white hover:bg-white/10 rounded-xl transition-all"
                      >
                        <Share2 className="w-4 h-4 text-neon shrink-0" />
                        <span>Share Link</span>
                      </button>
                      <button
                        onClick={handleCopyText}
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

            {/* Confession Text */}
            <p className="text-gray-300 text-sm leading-relaxed mb-4 whitespace-pre-wrap font-normal">
              {confession.text}
            </p>

            {/* Image Media */}
            {confession.imageUrl && !confession.imageUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i) && confession.type !== 'video' && (
              <div className="mb-4 rounded-lg overflow-hidden border border-gray-900 bg-black aspect-video">
                <img src={confession.imageUrl} alt="Confession image" className="w-full h-full object-cover" />
              </div>
            )}

            {/* Video Media */}
            {(confession.type === 'video' || confession.videoUrl || confession.imageUrl?.match(/\.(mp4|webm|mov)(\?.*)?$/i)) && (
              <div className="mb-4">
                <VideoPlayer
                  src={confession.videoUrl || confession.imageUrl!}
                  onDoubleTap={() => handleReaction('❤️')}
                />
              </div>
            )}

            {/* Poll Component */}
            {confession.type === 'poll' && confession.pollOptions && (
              <div className="mb-4 space-y-2.5 bg-black/40 p-3.5 rounded-2xl border border-white/10">
                {confession.pollOptions.map(option => {
                  const total = confession.pollOptions?.reduce((a, b) => a + b.votes, 0) || 0;
                  const pct = total > 0 ? Math.round((option.votes / total) * 100) : 0;
                  const isVoted = confession.userVote === option.id;

                  return (
                    <button
                      key={option.id}
                      onClick={() => handlePollVote(option.id)}
                      disabled={!!confession.userVote}
                      className={`w-full relative h-10 rounded-xl border overflow-hidden transition-all text-left active:scale-[0.99] ${
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

            {/* Action Row & Reaction Badges */}
            <div className="flex flex-col gap-2 border-t border-gray-900 pt-3 relative">
              {/* Emoji Reaction Badges */}
              {confession.reactions && Object.values(confession.reactions).some(v => v > 0) && (
                <div className="flex flex-wrap gap-1.5 mb-1">
                  {Object.entries(confession.reactions).map(([e, c]) => {
                    if (c <= 0) return null;
                    return (
                      <button
                        key={e}
                        onClick={() => handleReaction(e)}
                        className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border transition-all active:scale-95 ${
                          confession.userReaction === e
                            ? 'bg-neon/20 border-neon text-white shadow-[0_0_8px_rgba(255,0,127,0.3)]'
                            : 'bg-gray-900 text-gray-400 border-gray-800 hover:border-gray-700'
                        }`}
                      >
                        <span>{e}</span>
                        <b className="font-mono">{c}</b>
                      </button>
                    );
                  })}
                </div>
              )}

              <div className="flex items-center gap-3">
                <div className="relative">
                  <button
                    onClick={() => setActiveReactionMenu(!activeReactionMenu)}
                    className="flex items-center gap-2 text-gray-500 hover:text-white text-xs px-2 py-1 rounded-md hover:bg-gray-900 transition-colors"
                  >
                    <SmilePlus className="w-4 h-4" />
                    <span>{confession.userReaction || 'React'}</span>
                  </button>

                  {/* Reaction Picker */}
                  {activeReactionMenu && (
                    <>
                      <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setActiveReactionMenu(false)} />
                      <div className="absolute bottom-9 left-0 z-50 bg-[#0b0314]/95 backdrop-blur-2xl border border-white/15 rounded-2xl p-1.5 shadow-[0_10px_35px_rgba(0,0,0,0.85)] flex items-center gap-1 animate-in fade-in zoom-in-90 duration-150">
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

                <div className="flex items-center gap-2 text-gray-500 text-xs px-2 py-1">
                  <MessageCircle className="w-4 h-4" />
                  <span>{confession.comments?.length || 0}</span>
                </div>

                <button
                  onClick={handleShare}
                  className="ml-auto flex items-center gap-1.5 text-xs text-gray-500 hover:text-white transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* Comments Thread */}
            <div className="mt-3 pt-3 border-t border-gray-900 space-y-2">
              <div className="space-y-2 mb-3 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {confession.comments && confession.comments.length > 0 ? (
                  confession.comments.map(c => (
                    <div key={c.id} className="bg-gray-900/40 p-2.5 rounded-lg border border-gray-800/40">
                      <div className="flex justify-between mb-1">
                        <span className="text-[10px] font-bold text-gray-500">{c.userId}</span>
                        <span className="text-[9px] text-gray-600 font-mono">
                          {c.timestamp ? new Date(c.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed">{c.text}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-gray-600 italic py-2 text-center">No comments yet. Drop the tea!</p>
                )}
              </div>

              {/* Comment Input */}
              <form onSubmit={handleCommentSubmit} className="flex gap-2">
                <input
                  value={newComment}
                  onChange={e => setNewComment(e.target.value)}
                  onFocus={(e) => {
                    if (!currentUser) {
                      setCustomAuthMessage("Signup to comment on confessions");
                      setShowAuthModal(true);
                      e.currentTarget.blur();
                    }
                  }}
                  placeholder="Comment anonymously..."
                  className="flex-1 bg-black border border-gray-800 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-600 outline-none focus:border-gray-700"
                />
                <button
                  type="submit"
                  disabled={!newComment.trim() || submittingComment}
                  className="p-2 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white rounded-lg transition-colors"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Explore More Card */}
        <div className="mt-6 bg-gray-900/20 border border-gray-800/40 rounded-xl p-5 text-center">
          <p className="text-xs text-gray-400 mb-3">
            Want to see more confessions or post anonymously?
          </p>
          <Link
            href="/confessions"
            className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-white text-black font-bold text-xs hover:bg-gray-200 transition-all shadow-md"
          >
            <span>Go to Confessions</span>
            <span>→</span>
          </Link>
        </div>

        <AuthPromptModal
          isOpen={showAuthModal}
          onClose={() => {
            setShowAuthModal(false);
            setCustomAuthMessage(undefined);
          }}
          message={customAuthMessage}
        />
      </div>
    </main>
  );
}
