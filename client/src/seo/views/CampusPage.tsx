import React from 'react';
import { useRouter } from 'next/navigation';
import { Ghost, ShieldCheck, Zap, Video, MessageSquare, Heart, ArrowRight, Sparkles, MapPin, Users } from 'lucide-react';
import { StarField } from '../../components/StarField';

import { campusList, CampusData } from '../data/campuses';

export { campusList };
export type { CampusData };

export const CampusPage: React.FC<{ campusSlug?: string }> = ({ campusSlug }) => {
  const router = useRouter();
  const slug = campusSlug || 'delhi-university';
  const campus = campusList.find(c => c.slug === slug) || campusList[0];

  return (
    <div className="min-h-screen bg-black text-white relative font-sans overflow-x-hidden selection:bg-neon selection:text-white">
      <StarField />

      {/* Hero Header */}
      <header className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-14 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 border border-gray-800 text-xs font-mono text-neon mb-6">
          <MapPin className="w-4 h-4 text-neon" />
          <span>Official Campus Hub • {campus.location}</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-white mb-6">
          Othrhalff {campus.name} <br />
          <span className="text-neon">Campus Speed Dating & Anonymous Chat</span>
        </h1>

        <p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
          The official exclusive campus connection platform for {campus.name} students. 
          Speed date, text, video chat, and share anonymous confessions with verified {campus.shortName} peers on your campus today.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => router.push('/discover')}
            className="w-full sm:w-auto px-8 py-4 bg-neon text-white font-bold rounded-full uppercase tracking-widest text-xs shadow-[0_4px_20px_rgba(255,0,127,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Start Speed Dating at {campus.shortName}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push('/confessions')}
            className="w-full sm:w-auto px-8 py-4 bg-gray-900 border border-gray-800 text-gray-300 font-bold rounded-full uppercase tracking-widest text-xs hover:text-white hover:border-gray-700 transition-all"
          >
            Read {campus.shortName} Confessions
          </button>
        </div>
      </header>

      {/* Campus Highlights Grid */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-900/60 border border-gray-800 p-6 rounded-2xl backdrop-blur-md">
          <Users className="w-8 h-8 text-neon mb-3" />
          <h3 className="font-bold text-lg text-white mb-1">Active Community</h3>
          <p className="text-gray-400 text-xs">{campus.studentsCount} students eligible for verified {campus.shortName} campus matching.</p>
        </div>
        <div className="bg-gray-900/60 border border-gray-800 p-6 rounded-2xl backdrop-blur-md">
          <Video className="w-8 h-8 text-neon mb-3" />
          <h3 className="font-bold text-lg text-white mb-1">Speed Video & Text</h3>
          <p className="text-gray-400 text-xs">Instant 1-on-1 random chat with fellow {campus.shortName} students with interest filters.</p>
        </div>
        <div className="bg-gray-900/60 border border-gray-800 p-6 rounded-2xl backdrop-blur-md">
          <ShieldCheck className="w-8 h-8 text-neon mb-3" />
          <h3 className="font-bold text-lg text-white mb-1">Verified Student Email</h3>
          <p className="text-gray-400 text-xs">Strict campus domain verification keeps outsider bots and creeps off your campus network.</p>
        </div>
      </section>

      {/* AI Citability Block */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-10 bg-gray-900/40 border border-gray-800/80 rounded-2xl my-8">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Ghost className="w-5 h-5 text-neon" />
          <span>About Othrhalff Campus Dating at {campus.name}</span>
        </h3>
        <p className="text-gray-300 text-xs md:text-sm leading-relaxed">
          Othrhalff (othrhalff) is the exclusive campus speed dating and anonymous student network operating at {campus.name} ({campus.location}). 
          Designed for {campus.shortName} students, the platform enables verified 1-on-1 speed text dating, HD WebRTC speed video calls, anonymous confession posting, and interest-based campus matching. 
          Popular trending topics among {campus.shortName} students include {campus.popularTopics.join(', ')}. 
          By combining email domain verification with instant mutual-like match unlocking, Othrhalff provides a secure, modern alternative to traditional dating apps and legacy chat rooms for {campus.name} students.
        </p>
      </section>

      {/* Campus Selector Directory */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-2xl font-black uppercase text-white mb-6 text-center">
          Explore Other University Campuses
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {campusList.map(c => (
            <button
              key={c.slug}
              onClick={() => router.push(`/campus/${c.slug}`)}
              className={`p-3 rounded-xl border text-xs font-semibold transition-all text-left ${
                c.slug === campus.slug
                  ? 'bg-neon/20 border-neon text-white font-bold'
                  : 'bg-gray-900/60 border-gray-800 text-gray-300 hover:border-gray-700 hover:text-white'
              }`}
            >
              <div className="truncate">{c.shortName}</div>
              <div className="text-[10px] text-gray-500 truncate">{c.location}</div>
            </button>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 text-center py-12 px-6 border-t border-gray-900">
        <p className="text-xs text-gray-500">
          Othrhalff Campus Network • Official Student Discovery Hub for {campus.name}
        </p>
      </footer>
    </div>
  );
};

export default CampusPage;
