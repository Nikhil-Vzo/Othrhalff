"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { campusList } from '../../../src/seo/data/campuses';
import { supabase } from '../../../src/lib/supabase';
import { Confession } from '../../../src/types';
import { VideoPlayer } from '../../../src/components/VideoPlayer';
import { AuthPromptModal } from '../../../src/components/AuthPromptModal';
import { useAuth } from '../../../src/context/AuthContext';
import { 
  Flame, MessageSquarePlus, Sparkles, ArrowLeft, 
  Share2, MessageCircle, SmilePlus, Ghost, Users
} from 'lucide-react';

interface Props {
  campusSlug: string;
}

export default function CampusTeaClient({ campusSlug }: Props) {
  const { currentUser } = useAuth();
  const campus = campusList.find(c => c.slug === campusSlug) || {
    name: campusSlug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
    shortName: campusSlug.toUpperCase(),
    slug: campusSlug,
    location: 'India',
    popularTopics: ['CampusLife', 'Confessions', 'Crushes', 'Exams'],
    studentsCount: '10,000+',
    type: 'University'
  };

  const [confessions, setConfessions] = useState<Confession[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [customAuthMessage, setCustomAuthMessage] = useState<string | undefined>(undefined);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2200);
  };

  useEffect(() => {
    async function loadCampusConfessions() {
      if (!supabase) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        // Query confessions matching campus name or short name
        const { data, error } = await supabase
          .from('confessions')
          .select(`
            id, user_id, text, image_url, university, type, created_at,
            poll_options (id, text, vote_count),
            confession_reactions (emoji, user_id),
            confession_comments (id)
          `)
          .ilike('university', `%${campus.shortName}%`)
          .order('created_at', { ascending: false })
          .limit(15);

        if (error || !data || data.length === 0) {
          // Fallback query: load recent trending confessions if campus has few posts
          const { data: fallbackData } = await supabase
            .from('confessions')
            .select(`
              id, user_id, text, image_url, university, type, created_at,
              poll_options (id, text, vote_count),
              confession_reactions (emoji, user_id),
              confession_comments (id)
            `)
            .order('created_at', { ascending: false })
            .limit(10);

          if (fallbackData) {
            formatAndSetConfessions(fallbackData);
          }
        } else {
          formatAndSetConfessions(data);
        }
      } catch (err) {
        console.error('Failed to load campus confessions:', err);
      } finally {
        setLoading(false);
      }
    }

    function formatAndSetConfessions(data: any[]) {
      const formatted: Confession[] = data.map((p: any) => {
        const reactionCounts: Record<string, number> = {};
        p.confession_reactions?.forEach((r: any) => {
          reactionCounts[r.emoji] = (reactionCounts[r.emoji] || 0) + 1;
        });

        const isVideo = p.type === 'video' || (p.image_url && /\.(mp4|webm|mov)(\?.*)?$/i.test(p.image_url));

        return {
          id: p.id,
          userId: 'Anonymous',
          text: p.text || '',
          imageUrl: isVideo ? undefined : p.image_url,
          videoUrl: isVideo ? p.image_url : undefined,
          timestamp: new Date(p.created_at).getTime(),
          likes: p.confession_reactions?.length || 0,
          reactions: reactionCounts,
          comments: [],
          commentCount: p.confession_comments?.length || 0,
          university: p.university,
          type: (isVideo ? 'video' : p.type) as 'text' | 'poll' | 'video',
          pollOptions: p.poll_options?.map((opt: any) => ({
            id: opt.id,
            text: opt.text,
            votes: opt.vote_count || 0
          }))
        };
      });

      setConfessions(formatted);
    }

    loadCampusConfessions();
  }, [campus.shortName]);

  const handleShare = async (confId: string, confText: string) => {
    const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/tea/${campus.slug}/${confId}`;
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `${campus.shortName} Campus Tea`,
          text: confText.substring(0, 100) + '...',
          url: shareUrl
        });
      } catch (e) {}
    } else if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard! 🔗');
    }
  };

  const handleActionIntercept = (action: string) => {
    if (!currentUser) {
      setCustomAuthMessage(`Signup to ${action} on ${campus.shortName} confessions`);
      setShowAuthModal(true);
    }
  };

  return (
    <main className="min-h-screen bg-black text-white font-sans selection:bg-neon selection:text-white relative overflow-x-hidden">
      {/* Ambient background glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#2a0845,transparent_55%)] pointer-events-none" />

      {/* Floating Toast */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 bg-[#0d0714]/95 backdrop-blur-2xl border border-white/20 text-white text-xs font-semibold px-4 py-2 rounded-full shadow-[0_10px_35px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-3 duration-200 flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-neon" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="relative z-10 max-w-2xl mx-auto w-full px-4 pt-10 pb-28">
        {/* Navigation Breadcrumb */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/confessions"
            className="inline-flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-neon" />
            <span>GLOBAL CONFESSIONS</span>
          </Link>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-mono text-gray-400 uppercase tracking-widest">
              LIVE CAMPUS TEA
            </span>
          </div>
        </div>

        {/* Hero Header */}
        <div className="bg-gradient-to-b from-neutral-900/90 to-neutral-950/90 border border-white/10 rounded-3xl p-6 sm:p-8 backdrop-blur-2xl mb-8 shadow-[0_10px_40px_rgba(255,0,127,0.1)]">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neon/10 border border-neon/30 text-neon text-[10px] font-bold uppercase tracking-wider mb-4">
            <Flame className="w-3.5 h-3.5" />
            <span>{campus.shortName} Confidential</span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white uppercase leading-tight mb-3">
            {campus.name}<br />
            <span className="text-neon">Anonymous Confessions</span>
          </h1>

          <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed mb-6">
            Real, uncensored campus tea, relationship gossip, and anonymous drama from verified{' '}
            <strong className="text-white">{campus.shortName}</strong> students in{' '}
            <strong className="text-white">{campus.location}</strong>.
          </p>

          {/* Popular Topics Badges */}
          {campus.popularTopics && campus.popularTopics.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {campus.popularTopics.map((topic) => (
                <span
                  key={topic}
                  className="bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-[11px] font-semibold px-3 py-1 rounded-full transition-colors"
                >
                  #{topic}
                </span>
              ))}
            </div>
          )}

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-3 pt-2 border-t border-white/10">
            <Link
              href="/confessions"
              className="flex-1 min-w-[160px] inline-flex items-center justify-center gap-2 py-3 px-5 bg-neon text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-[0_0_20px_rgba(255,0,127,0.4)] hover:shadow-[0_0_30px_rgba(255,0,127,0.6)] transition-all hover:scale-[1.02]"
            >
              <MessageSquarePlus className="w-4 h-4" />
              <span>Post Anonymous Tea</span>
            </Link>
            <Link
              href={`/campus/${campus.slug}`}
              className="inline-flex items-center justify-center gap-2 py-3 px-5 bg-white/10 hover:bg-white/15 border border-white/15 text-white font-bold text-xs uppercase tracking-wider rounded-full transition-all"
            >
              <Users className="w-4 h-4 text-neon" />
              <span>{campus.shortName} Dating Hub</span>
            </Link>
          </div>
        </div>

        {/* Confession Feed Stream */}
        <div className="space-y-4">
          <div className="flex items-center justify-between px-1 mb-2">
            <h2 className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-neon" />
              Latest {campus.shortName} Drops
            </h2>
            <span className="text-[10px] font-mono text-gray-600">
              {confessions.length} confessions
            </span>
          </div>

          {loading && (
            <div className="bg-gray-900/30 border border-gray-800/50 rounded-2xl p-8 text-center animate-pulse">
              <Ghost className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <p className="text-xs text-gray-400">Brewing fresh campus tea...</p>
            </div>
          )}

          {!loading && confessions.length === 0 && (
            <div className="bg-gray-900/30 border border-gray-800/50 rounded-2xl p-8 text-center">
              <Ghost className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <h3 className="text-sm font-bold text-white mb-1">No Tea Yet for {campus.shortName}</h3>
              <p className="text-xs text-gray-400 mb-4">Be the first to drop anonymous campus tea!</p>
              <Link
                href="/confessions"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-neon text-white font-bold text-xs rounded-full uppercase tracking-wider shadow-lg"
              >
                <MessageSquarePlus className="w-4 h-4" />
                Drop First Confession
              </Link>
            </div>
          )}

          {!loading && confessions.map((conf) => (
            <div 
              key={conf.id} 
              className="bg-neutral-950/70 border border-white/10 rounded-2xl p-4 sm:p-5 backdrop-blur-xl shadow-xl hover:border-white/20 transition-all"
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-gray-900 border border-gray-800 flex items-center justify-center text-xs font-bold text-gray-400">
                    ?
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-200">Anonymous</span>
                      <span className="bg-[#ff007f]/10 text-neon text-[9px] font-extrabold px-2 py-0.5 rounded-full border border-[#ff007f]/20">
                        {campus.shortName}
                      </span>
                    </div>
                    <span className="text-[9px] text-gray-500 font-mono">
                      {new Date(conf.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/tea/${campus.slug}/${conf.id}`}
                  className="text-[10px] font-bold text-neon hover:underline"
                >
                  View Thread →
                </Link>
              </div>

              {/* Text */}
              <p className="text-xs sm:text-sm text-gray-200 leading-relaxed mb-4 whitespace-pre-wrap">
                {conf.text}
              </p>

              {/* Image Media */}
              {conf.imageUrl && !conf.imageUrl.match(/\.(mp4|webm|mov)(\?.*)?$/i) && conf.type !== 'video' && (
                <div className="mb-4 rounded-xl overflow-hidden border border-gray-900 bg-black aspect-video">
                  <img src={conf.imageUrl} className="w-full h-full object-cover" alt="Campus confession media" />
                </div>
              )}

              {/* Video Media */}
              {(conf.type === 'video' || conf.videoUrl || conf.imageUrl?.match(/\.(mp4|webm|mov)(\?.*)?$/i)) && (
                <div className="mb-4">
                  <VideoPlayer src={conf.videoUrl || conf.imageUrl!} />
                </div>
              )}

              {/* Actions Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleActionIntercept('react with emojis')}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white px-2 py-1 rounded-md hover:bg-white/5 transition-colors"
                  >
                    <SmilePlus className="w-3.5 h-3.5" />
                    <span>React ({conf.likes})</span>
                  </button>

                  <Link
                    href={`/tea/${campus.slug}/${conf.id}`}
                    className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-blue-400 px-2 py-1 rounded-md hover:bg-white/5 transition-colors"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    <span>{conf.commentCount || 0} comments</span>
                  </Link>
                </div>

                <button
                  onClick={() => handleShare(conf.id, conf.text)}
                  className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Card */}
        <div className="mt-10 bg-neutral-950 border border-white/10 rounded-2xl p-6 text-center">
          <h3 className="text-sm font-bold text-white uppercase mb-2">
            Have secrets to spill about {campus.name}?
          </h3>
          <p className="text-xs text-gray-400 mb-4 max-w-md mx-auto">
            Share what everyone is whispering about. 100% anonymous, untraceable, and protected by end-to-end encryption.
          </p>
          <Link
            href="/confessions"
            className="inline-flex items-center gap-2 px-6 py-3 bg-neon text-white font-bold text-xs uppercase tracking-wider rounded-full shadow-[0_0_20px_rgba(255,0,127,0.4)] hover:scale-105 transition-transform"
          >
            <MessageSquarePlus className="w-4 h-4" />
            <span>Open Confessions Feed</span>
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
