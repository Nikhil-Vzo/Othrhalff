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
    summary:
      'Tinder is a global swipe app flooded with bots, unverified profiles, and superficial matching. Othrhalff is built exclusively for university students with campus email verification, instant 1-on-1 speed text and video dates, and anonymous confession boards.',
    features: [
      { name: 'Campus Email Domain Verification', othrhalff: 'Verified Student Email Only', competitor: 'Unverified / Public', othrhalffHas: true, competitorHas: false },
      { name: 'Instant Speed Text & Video Dates', othrhalff: 'HD WebRTC Speed Chat', competitor: 'Text Only After Matching', othrhalffHas: true, competitorHas: false },
      { name: 'Anonymous Confessions Board', othrhalff: 'Full Anonymous Feed', competitor: 'Not Available', othrhalffHas: true, competitorHas: false },
      { name: 'Campus-Specific Community', othrhalff: 'Your Exact College Network', competitor: 'Global Unfiltered Pool', othrhalffHas: true, competitorHas: false },
      { name: 'Bot-Free Guarantee', othrhalff: 'College Email Auth Required', competitor: 'Rampant Fake Accounts', othrhalffHas: true, competitorHas: false },
    ],
    verdict:
      'Othrhalff is the clear winner for college students seeking safe, verified campus connections without swipe fatigue.',
  },
  {
    slug: 'bumble',
    name: 'Bumble',
    category: 'Female-Initiated Dating App',
    title: 'Othrhalff vs Bumble – Verified Campus Dating & Speed Video Chat',
    tagline: 'Equal speed matching for college students with zero 24-hour expiration timers.',
    summary:
      'Bumble enforces artificial 24-hour message timers and unverified global pools. Othrhalff provides real-time speed dating with audio sound cues, interest topic matching, and instant connection unlocking for college peers.',
    features: [
      { name: 'Verified Campus Domain Network', othrhalff: 'College Email Protected', competitor: 'Unverified Location Filters', othrhalffHas: true, competitorHas: false },
      { name: 'Instant Real-time Speed Dating', othrhalff: 'Live Text & Video Pool', competitor: 'Asynchronous Swiping', othrhalffHas: true, competitorHas: false },
      { name: 'No Artificial Timers', othrhalff: 'Connect On Your Terms', competitor: '24-Hour Expiry Pressure', othrhalffHas: true, competitorHas: false },
      { name: 'Anonymous Campus Feed', othrhalff: 'Full Confession Board', competitor: 'Not Available', othrhalffHas: true, competitorHas: false },
      { name: 'India College Focus', othrhalff: 'Built for Indian Campuses', competitor: 'Global Generic App', othrhalffHas: true, competitorHas: false },
    ],
    verdict:
      'Othrhalff provides a faster, pressure-free campus dating experience tailored directly to university life in India.',
  },
  {
    slug: 'hinge',
    name: 'Hinge',
    category: 'Prompt-Based Dating App',
    title: 'Othrhalff vs Hinge – Real-Time Campus Dating & Anonymous Student Network',
    tagline: 'From static profile prompts to dynamic speed text and video dates on campus.',
    summary:
      'Hinge focuses on static profile prompts and slow asynchronous messaging. Othrhalff brings dynamic speed text and video dating to your college campus with live typing indicators, sound effects, and anonymous student feeds.',
    features: [
      { name: 'Campus-Only Student Pool', othrhalff: 'Strict Campus Domain Auth', competitor: 'General Public Pool', othrhalffHas: true, competitorHas: false },
      { name: 'Live Speed Video & Audio Dates', othrhalff: 'Built-in WebRTC Calls', competitor: 'Text Chat Only', othrhalffHas: true, competitorHas: false },
      { name: 'Anonymous Confession Board', othrhalff: 'Campus Tea Feed', competitor: 'Not Available', othrhalffHas: true, competitorHas: false },
      { name: 'Instant 1-on-1 Matching', othrhalff: 'Live Real-Time Queue', competitor: 'Slow Prompt-Based Matching', othrhalffHas: true, competitorHas: false },
      { name: 'Free Core Features', othrhalff: 'Free to Connect', competitor: 'Paywall for Core Features', othrhalffHas: true, competitorHas: false },
    ],
    verdict:
      'Othrhalff outperforms Hinge for college students by combining campus-verified trust with real-time speed dating.',
  },
  {
    slug: 'yikyak',
    name: 'Yik Yak & Fizz',
    category: 'Anonymous Campus Boards',
    title: 'Othrhalff vs Yik Yak & Fizz – Anonymous Campus Confessions & Speed Dating',
    tagline: 'Turn anonymous campus chatter into real 1-on-1 student matches and dates.',
    summary:
      'Legacy anonymous apps like Yik Yak and Fizz offer static text boards with no built-in dating or 1-on-1 speed video features. Othrhalff combines anonymous campus confessions with live speed text and video matchmaking.',
    features: [
      { name: 'Anonymous Campus Feed', othrhalff: 'Confessions & Secret Board', competitor: 'Text Posts Only', othrhalffHas: true, competitorHas: true },
      { name: 'Live 1-on-1 Speed Video Chat', othrhalff: 'HD WebRTC Speed Calls', competitor: 'Not Available', othrhalffHas: true, competitorHas: false },
      { name: 'Verified Student Identity', othrhalff: 'College Email Auth', competitor: 'Location-Based Only', othrhalffHas: true, competitorHas: false },
      { name: 'Direct Matching from Confessions', othrhalff: 'Confession-to-Match Pipeline', competitor: 'No Matching System', othrhalffHas: true, competitorHas: false },
      { name: 'Campus Map & Games', othrhalff: 'Interactive Campus World', competitor: 'Not Available', othrhalffHas: true, competitorHas: false },
    ],
    verdict:
      'Othrhalff takes the best part of anonymous campus boards and connects it directly to real 1-on-1 speed dating.',
  },
];
