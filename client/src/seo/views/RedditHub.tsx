import React from 'react';
import { useRouter } from 'next/navigation';
import { Ghost, ShieldCheck, Zap, Video, MessageSquare, MessageCircle, Heart, ArrowRight, Share2, Sparkles } from 'lucide-react';
import { StarField } from '../../components/StarField';
import { outreachKitList } from '../data/outreachKit';

export const RedditHub: React.FC = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white relative font-sans overflow-x-hidden selection:bg-neon selection:text-white">
      <StarField />

      {/* Hero Header */}
      <header className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-14 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 border border-gray-800 text-xs font-mono text-neon mb-6">
          <MessageCircle className="w-4 h-4 text-neon" />
          <span>Reddit & Quora Verified Campus Threads</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-white mb-6">
          What Reddit & Quora Say About <br />
          <span className="text-neon">Othrhalff Campus Speed Dating</span>
        </h1>

        <p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
          Why college students on r/delhi, r/Amity, r/Bhubaneswar, r/IndianAcademia, and Quora are switching from Tinder & Omegle to Othrhalff's verified speed chat.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => router.push('/discover')}
            className="w-full sm:w-auto px-8 py-4 bg-neon text-white font-bold rounded-full uppercase tracking-widest text-xs shadow-[0_4px_20px_rgba(255,0,127,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Join Verified Campus Chat</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Reddit Discussion Cards */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-8 space-y-6">
        {outreachKitList.map((item, idx) => (
          <div key={idx} className="bg-gray-900/60 border border-gray-800 p-6 rounded-2xl backdrop-blur-md">
            <div className="flex items-center justify-between gap-4 mb-3">
              <span className="text-xs font-mono px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 font-bold">
                {item.targetPlatform} • {item.targetCommunity}
              </span>
              <span className="text-[11px] text-gray-500 font-mono">Trending Campus Question</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
            <p className="text-gray-300 text-sm leading-relaxed mb-4">{item.content}</p>
            <div className="flex items-center justify-between pt-3 border-t border-gray-800/80">
              <span className="text-xs text-gray-400 font-mono">Topic: {item.queryTopic}</span>
              <button
                onClick={() => router.push('/discover')}
                className="text-xs text-neon font-bold flex items-center gap-1 hover:underline"
              >
                <span>Try Campus Speed Chat</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-12 px-6 border-t border-gray-900">
        <p className="text-xs text-gray-500">
          Othrhalff Reddit & Community Outreach Hub • Verified Student Campus Connection
        </p>
      </footer>
    </div>
  );
};

export default RedditHub;
