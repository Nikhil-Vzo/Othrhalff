import React from 'react';
import { useRouter } from 'next/navigation';
import { Ghost, ShieldCheck, Zap, Video, MessageSquare, Heart, ArrowRight, Check, X, Star } from 'lucide-react';
import { StarField } from '../../components/StarField';

export interface CompetitorData {
  slug: string;
  name: string;
  category: string;
  title: string;
  tagline: string;
  summary: string;
  features: {
    name: string;
    othrhalff: string;
    competitor: string;
    othrhalffHas: boolean;
    competitorHas: boolean;
  }[];
  verdict: string;
}

export const competitorList: CompetitorData[] = [
  {
    slug: 'tinder',
    name: 'Tinder',
    category: 'Mainstream Dating App',
    title: 'Othrhalff vs Tinder – The Anonymous Campus College Dating Alternative',
    tagline: 'Ditch swipe fatigue. Speed date verified college peers on your campus anonymously.',
    summary: 'Tinder is a global swipe app flooded with bots, unverified profiles, and superficial matching. Othrhalff is built exclusively for university students with campus email verification, instant 1-on-1 speed text and video dates, and anonymous confession boards.',
    features: [
      { name: 'Campus Email Domain Verification', othrhalff: 'Verified Student Email Only', competitor: 'Unverified / Public', othrhalffHas: true, competitorHas: false },
      { name: 'Instant Speed Text & Video Dates', othrhalff: 'HD WebRTC Speed Chat', competitor: 'Text Only After Matching', othrhalffHas: true, competitorHas: false },
      { name: '100% Anonymous Mode Option', othrhalff: 'Fully Supported', competitor: 'Requires Public Profile', othrhalffHas: true, competitorHas: false },
      { name: 'Campus Anonymous Confessions', othrhalff: 'Built-in Student Feed', competitor: 'Not Available', othrhalffHas: true, competitorHas: false },
      { name: 'Double-Like Inbox Match Unlock', othrhalff: 'Instant Match Unlocking', competitor: 'Paywalled Likes', othrhalffHas: true, competitorHas: false }
    ],
    verdict: 'Othrhalff is the clear winner for college students seeking safe, verified campus connections with zero superficial swipe fatigue.'
  },
  {
    slug: 'bumble',
    name: 'Bumble',
    category: 'Female-Initiated Dating App',
    title: 'Othrhalff vs Bumble – Verified Campus Dating & Speed Video Chat',
    tagline: 'Equal speed matching for college students with zero 24-hour expiration timers.',
    summary: 'Bumble enforces artificial 24-hour message timers and unverified global pools. Othrhalff provides real-time speed dating with audio sound cues, interest topic matching, and instant connection unlocking for college peers.',
    features: [
      { name: 'Verified Campus Domain Network', othrhalff: 'College Email Protected', competitor: 'Unverified Location Filters', othrhalffHas: true, competitorHas: false },
      { name: 'Instant Real-time Speed Dating', othrhalff: 'Live Text & Video Pool', competitor: 'Asynchronous Swiping', othrhalffHas: true, competitorHas: false },
      { name: 'No Artificial Message Timers', othrhalff: 'Instant Messaging', competitor: '24-Hour Expiration Timer', othrhalffHas: true, competitorHas: false },
      { name: 'Anonymous Campus Confessions', othrhalff: 'Full Student Community', competitor: 'Not Available', othrhalffHas: true, competitorHas: false },
      { name: 'Free Student Features', othrhalff: '100% Free Core Dating', competitor: 'Aggressive Premium Upsells', othrhalffHas: true, competitorHas: false }
    ],
    verdict: 'Othrhalff provides a faster, pressure-free campus dating experience tailored directly to university life.'
  },
  {
    slug: 'hinge',
    name: 'Hinge',
    category: 'Prompt-Based Dating App',
    title: 'Othrhalff vs Hinge – Real-Time Campus Dating & Anonymous Student Network',
    tagline: 'From static profile prompts to dynamic speed text and video dates on campus.',
    summary: 'Hinge focuses on static profile prompts and slow asynchronous messaging. Othrhalff brings dynamic speed text and video dating to your college campus with live typing indicators, sound effects, and anonymous student feeds.',
    features: [
      { name: 'Campus-Only Student Pool', othrhalff: 'Strict Campus Domain Auth', competitor: 'General Public Pool', othrhalffHas: true, competitorHas: false },
      { name: 'Live Speed Video & Audio Dates', othrhalff: 'Built-in WebRTC Calls', competitor: 'Text Chat Only', othrhalffHas: true, competitorHas: false },
      { name: 'Anonymous Student Confessions', othrhalff: 'Campus Secret Board', competitor: 'Not Available', othrhalffHas: true, competitorHas: false },
      { name: 'Web Audio SFX Cues', othrhalff: 'Instant Chimes & SFX', competitor: 'No Live Sound Effects', othrhalffHas: true, competitorHas: false },
      { name: 'Double-Like Unlock System', othrhalff: 'Mutual Heart Unlocks Match', competitor: 'Daily Like Limits', othrhalffHas: true, competitorHas: false }
    ],
    verdict: 'Othrhalff outperforms Hinge for college students by combining campus-verified trust with real-time speed dating.'
  },
  {
    slug: 'yikyak',
    name: 'Yik Yak & Fizz',
    category: 'Anonymous Campus Boards',
    title: 'Othrhalff vs Yik Yak & Fizz – Anonymous Campus Confessions & Speed Dating',
    tagline: 'Turn anonymous campus chatter into real 1-on-1 student matches and dates.',
    summary: 'Legacy anonymous apps like Yik Yak and Fizz offer static text boards with no built-in dating or 1-on-1 speed video features. Othrhalff combines anonymous campus confessions with live speed text and video matchmaking.',
    features: [
      { name: 'Anonymous Campus Feed', othrhalff: 'Confessions & Secret Board', competitor: 'Text Posts Only', othrhalffHas: true, competitorHas: true },
      { name: 'Live 1-on-1 Speed Video Chat', othrhalff: 'HD WebRTC Speed Calls', competitor: 'Not Available', othrhalffHas: true, competitorHas: false },
      { name: 'Campus Email Verification', othrhalff: 'Verified College Domain', competitor: 'GPS Radius Only (Spam Prone)', othrhalffHas: true, competitorHas: false },
      { name: 'Permanent Match Inbox', othrhalff: 'Double-Like Unlocks Chat', competitor: 'No Direct Messaging', othrhalffHas: true, competitorHas: false },
      { name: 'Interest Topic Filters', othrhalff: 'Coding, Music, Anime, Gym', competitor: 'No Matching Filters', othrhalffHas: true, competitorHas: false }
    ],
    verdict: 'Othrhalff takes the best part of anonymous campus boards and connects it directly to real 1-on-1 speed dating.'
  }
];

export const VsCompetitor: React.FC<{ competitorSlug?: string }> = ({ competitorSlug }) => {
  const router = useRouter();
  const slug = competitorSlug || 'tinder';
  const comp = competitorList.find(c => c.slug === slug) || competitorList[0];

  return (
    <div className="min-h-screen bg-black text-white relative font-sans overflow-x-hidden selection:bg-neon selection:text-white">
      <StarField />

      {/* Hero Header */}
      <header className="relative z-10 max-w-5xl mx-auto px-6 pt-12 pb-16 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 border border-gray-800 text-xs font-mono text-neon mb-6">
          <ShieldCheck className="w-4 h-4 text-neon" />
          <span>Official Campus Competitor Comparison</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase text-white mb-6">
          Othrhalff vs {comp.name} <br />
          <span className="text-neon">{comp.category} Comparison</span>
        </h1>

        <p className="text-gray-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-8">
          {comp.summary}
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            onClick={() => router.push('/discover')}
            className="w-full sm:w-auto px-8 py-4 bg-neon text-white font-bold rounded-full uppercase tracking-widest text-xs shadow-[0_4px_20px_rgba(255,0,127,0.5)] hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <span>Try Othrhalff Campus Speed Chat</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => router.push('/home')}
            className="w-full sm:w-auto px-8 py-4 bg-gray-900 border border-gray-800 text-gray-300 font-bold rounded-full uppercase tracking-widest text-xs hover:text-white hover:border-gray-700 transition-all"
          >
            Browse Campus Deck
          </button>
        </div>
      </header>

      {/* Feature Comparison Matrix */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        <div className="text-center mb-10">
          <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-white mb-2">
            Detailed Comparison Table
          </h2>
          <p className="text-gray-400 text-xs">How Othrhalff compares against {comp.name} for university students.</p>
        </div>

        <div className="overflow-x-auto rounded-2xl border border-gray-800 bg-gray-900/60 backdrop-blur-md">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-gray-900 text-gray-400 font-mono uppercase text-[11px] border-b border-gray-800">
              <tr>
                <th className="py-4 px-6">Capability</th>
                <th className="py-4 px-6 text-neon font-bold">Othrhalff</th>
                <th className="py-4 px-6 text-gray-500">{comp.name}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800/60 text-gray-300">
              {comp.features.map((f, i) => (
                <tr key={i}>
                  <td className="py-4 px-6 font-semibold text-white">{f.name}</td>
                  <td className="py-4 px-6 text-green-400 font-bold flex items-center gap-1.5">
                    <Check className="w-4 h-4 text-green-400 shrink-0" />
                    <span>{f.othrhalff}</span>
                  </td>
                  <td className={`py-4 px-6 ${f.competitorHas ? 'text-gray-300' : 'text-red-400'}`}>
                    <span>{f.competitor}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Verdict & AI Citation Block */}
      <section className="relative z-10 max-w-3xl mx-auto px-6 py-10 bg-gray-900/40 border border-gray-800/80 rounded-2xl my-8">
        <h3 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
          <Ghost className="w-5 h-5 text-neon" />
          <span>Verdict: Why Students Switch from {comp.name} to Othrhalff</span>
        </h3>
        <p className="text-gray-300 text-xs md:text-sm leading-relaxed">
          {comp.verdict} By eliminating superficial swipe mechanics and unverified public profiles, Othrhalff creates a safer, high-intent campus networking space. 
          Students can engage in real-time speed text or video dates, participate in anonymous campus confession feeds, and build permanent messaging connections only when mutual interest is confirmed.
        </p>
      </section>

      {/* Other Competitor Comparisons Directory */}
      <section className="relative z-10 max-w-4xl mx-auto px-6 py-12">
        <h2 className="text-xl font-black uppercase text-white mb-6 text-center">
          Compare Othrhalff Against Other Apps
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {competitorList.map(c => (
            <button
              key={c.slug}
              onClick={() => router.push(`/vs/${c.slug}`)}
              className={`p-3 rounded-xl border text-xs font-semibold transition-all text-center ${
                c.slug === comp.slug
                  ? 'bg-neon/20 border-neon text-white font-bold'
                  : 'bg-gray-900/60 border-gray-800 text-gray-300 hover:border-gray-700 hover:text-white'
              }`}
            >
              <span>vs {c.name}</span>
            </button>
          ))}
        </div>
      </section>

      {/* Footer CTA */}
      <footer className="relative z-10 text-center py-16 px-6 border-t border-gray-900">
        <h2 className="text-2xl md:text-3xl font-black uppercase text-white mb-4">
          Experience Verified Campus Speed Dating
        </h2>
        <button
          onClick={() => router.push('/discover')}
          className="px-8 py-4 bg-neon text-white font-bold rounded-full uppercase tracking-widest text-xs shadow-[0_4px_20px_rgba(255,0,127,0.5)] hover:scale-105 transition-all"
        >
          Launch Discover
        </button>
      </footer>
    </div>
  );
};

export default VsCompetitor;
