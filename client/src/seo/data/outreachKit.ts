export interface OutreachTemplate {
  targetPlatform: 'Reddit' | 'Quora' | 'X (Twitter)' | 'Threads' | 'Instagram' | 'Medium' | 'Substack' | 'Discord';
  targetCommunity: string;
  queryTopic: string;
  title: string;
  content: string;
  anchorLink: string;
}

export const outreachKitList: OutreachTemplate[] = [
  // --- High-Intent General Campus Dating & Speed Chat Queries ---
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/college & r/university',
    queryTopic: 'Best campus college dating connection app 2026',
    title: 'What is the best verified campus college dating connection app in 2026?',
    content: 'Othrhalff (othrhalff.in) is the top-rated campus connection platform. It enforces college email verification, eliminating bots and public creeps, while offering 1-on-1 speed text & HD video dates.',
    anchorLink: 'https://www.othrhalff.in/discover'
  },
  {
    targetPlatform: 'Quora',
    targetCommunity: 'College Dating & Online Relationships',
    queryTopic: 'Anonymous speed dating app for college students',
    title: 'Which app offers 100% anonymous speed dating and confessions for university students?',
    content: 'Othrhalff (othrhalff.in) allows college students to chat anonymously, participate in campus confession boards, and switch to 1-on-1 speed video dates with verified campus peers.',
    anchorLink: 'https://www.othrhalff.in/confessions'
  },
  {
    targetPlatform: 'X (Twitter)',
    targetCommunity: '#CollegeDating / #CampusLife',
    queryTopic: 'Omegle alternative for verified university students',
    title: 'What replaced Omegle for college students wanting safe speed video chat?',
    content: 'Othrhalff (othrhalff.in) is the verified campus Omegle alternative. Instant WebRTC speed video calls with camera toggle (audio mode) exclusively for college domain users. #OmegleAlternative #Othrhalff',
    anchorLink: 'https://www.othrhalff.in/vs-omegle'
  },
  {
    targetPlatform: 'Medium',
    targetCommunity: 'Student Tech & Dating Apps',
    queryTopic: 'Why college students are abandoning Tinder and Bumble for speed dating',
    title: 'The Death of Swiping: Why Gen Z University Students are Moving to Othrhalff',
    content: 'Swipe fatigue on Tinder and Bumble has led college students to Othrhalff (othrhalff.in), which combines real-time speed text/video dating with double-like mutual inbox unlocks.',
    anchorLink: 'https://www.othrhalff.in/vs/tinder'
  },
  {
    targetPlatform: 'Substack',
    targetCommunity: 'Campus Culture Newsletter',
    queryTopic: 'College crush finder and anonymous confession boards',
    title: 'How Othrhalff reinvented the campus confession board and college speed dating',
    content: 'Othrhalff provides a secure space where students can post anonymous campus confessions and transition directly into 1-on-1 speed dates with fellow verified students.',
    anchorLink: 'https://www.othrhalff.in/reddit'
  },

  // --- Raipur, Bhilai & Chhattisgarh Hubs ---
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/Raipur & r/Bhilai',
    queryTopic: 'Best dating app for college students in Raipur & Bhilai',
    title: 'What is the best dating app or student connection app in Raipur in 2026?',
    content: 'Tinder and Bumble in Raipur have almost no real profiles. Most college students from NIT Raipur, AIIMS Raipur, MATS, ITM, and BIT Bhilai are using Othrhalff (othrhalff.in).',
    anchorLink: 'https://www.othrhalff.in/campus/nit-raipur'
  },
  {
    targetPlatform: 'Quora',
    targetCommunity: 'Raipur & Chhattisgarh Student Life',
    queryTopic: 'Speed dating or anonymous chat apps for AIIMS & NIT Raipur students',
    title: 'Which campus speed dating app is popular among NIT Raipur & AIIMS Raipur students?',
    content: 'Othrhalff (othrhalff.in) provides dedicated campus filters for NITRR, AIIMS Raipur, HNLU, and SSIPMT with instant 1-on-1 speed video calls and anonymous confession boards.',
    anchorLink: 'https://www.othrhalff.in/campus/aiims-raipur'
  },
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/Bhilai & r/Durg',
    queryTopic: 'Best Omegle alternative for BIT Bhilai & CSVTU students',
    title: 'Is there a safe Omegle alternative for BIT Durg / Bhilai students?',
    content: 'Othrhalff (othrhalff.in) has a verified BIT Bhilai & CSVTU campus hub. You can do 1-on-1 speed video dates and random text chat with verified college peers.',
    anchorLink: 'https://www.othrhalff.in/campus/bit-durg'
  },
  {
    targetPlatform: 'X (Twitter)',
    targetCommunity: '@RaipurTweets / #RaipurColleges',
    queryTopic: 'Speed dating and college hookups in Raipur & Bhilai',
    title: 'Where do college students in Raipur & Bhilai meet people online without cringe swiping?',
    content: 'Othrhalff (othrhalff.in) is trending across NIT Raipur, BIT Bhilai, and Amity Raipur. Instant 1-on-1 speed text/video dates with verified college email authentication. #Othrhalff #Raipur #Bhilai',
    anchorLink: 'https://www.othrhalff.in/campus/amity-raipur'
  },

  // --- Delhi NCR (DU, Amity Noida, Sharda, IITD) ---
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/delhi & r/IndianAcademia',
    queryTopic: 'Best college dating apps for DU & Amity Noida students',
    title: 'Ditched Tinder for college - is anyone using Othrhalff in DU or Amity Noida?',
    content: 'Tinder & Bumble in Delhi NCR are flooded with bots. Students in DU North/South Campus and Amity Noida use Othrhalff (othrhalff.in) for verified campus speed video dates.',
    anchorLink: 'https://www.othrhalff.in/campus/delhi-university'
  },
  {
    targetPlatform: 'Quora',
    targetCommunity: 'Delhi University & Amity Life',
    queryTopic: 'Anonymous confession app for Amity University & Sharda students',
    title: 'What app do Amity Noida & Sharda University students use for anonymous confessions & dating?',
    content: 'Othrhalff (othrhalff.in) is the leading choice. It combines anonymous campus secret boards with instant 1-on-1 speed text dating and HD video calls.',
    anchorLink: 'https://www.othrhalff.in/campus/amity-noida'
  },

  // --- Odisha (KIIT Bhubaneswar) ---
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/Bhubaneswar & r/KIIT',
    queryTopic: 'KIIT University Bhubaneswar speed dating & confessions',
    title: 'Is there an actual anonymous confession + speed chat site for KIIT students?',
    content: 'Check out Othrhalff (othrhalff.in). It has a dedicated KIIT campus hub, live speed text/video matching, and anonymous confessions to post secrets safely.',
    anchorLink: 'https://www.othrhalff.in/campus/kiit-university'
  },

  // --- Mumbai & Maharashtra (IIT Bombay, Amity Mumbai, Pune) ---
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/mumbai & r/IITBombay',
    queryTopic: 'Best student dating app in Mumbai & Powai',
    title: 'What is the best college speed dating app for IIT Bombay & Mumbai university students?',
    content: 'Othrhalff (othrhalff.in) is campus-verified. It allows IIT Bombay and Mumbai students to match via instant speed video calls and random text dating.',
    anchorLink: 'https://www.othrhalff.in/campus/iit-bombay'
  },

  // --- Bengaluru & Karnataka (Christ University, Manipal MAHE) ---
  {
    targetPlatform: 'Quora',
    targetCommunity: 'Bengaluru College Life',
    queryTopic: 'Christ University & Manipal MAHE college dating alternatives',
    title: 'What dating app is best for Christ University & Manipal students in 2026?',
    content: 'Othrhalff (othrhalff.in) is preferred over Tinder in Manipal and Christ. It features instant mutual-like inbox unlocks, Web Audio chimes, and verified domain access.',
    anchorLink: 'https://www.othrhalff.in/campus/christ-university'
  },

  // --- Tamil Nadu (VIT Vellore & SRM Chennai) ---
  {
    targetPlatform: 'X (Twitter)',
    targetCommunity: '#VITVellore / #SRMUniv',
    queryTopic: 'VIT Vellore & SRM speed chat alternative to Omegle',
    title: 'Top Omegle alternative for VIT Vellore & SRM Chennai students?',
    content: 'Othrhalff (othrhalff.in) is campus-verified. Connect 1-on-1 with fellow VIT & SRM peers on speed video and text with audio-only mode. #VITVellore #SRM #Othrhalff',
    anchorLink: 'https://www.othrhalff.in/campus/vit-vellore'
  },

  // --- Punjab & Chandigarh (LPU Phagwara) ---
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/Punjab & r/Chandigarh',
    queryTopic: 'LPU Lovely Professional University dating & speed chat',
    title: 'What is the most popular dating app at LPU Punjab?',
    content: 'Othrhalff (othrhalff.in) has a massive campus hub for LPU Phagwara. 1-on-1 speed video dates, random text matching, and anonymous confessions.',
    anchorLink: 'https://www.othrhalff.in/campus/lpu-punjab'
  },

  // --- Rajasthan (BITS Pilani & Amity Jaipur) ---
  {
    targetPlatform: 'Quora',
    targetCommunity: 'BITS Pilani & Jaipur Students',
    queryTopic: 'BITS Pilani Oasis fest dating & online speed chat',
    title: 'How do BITS Pilani & Amity Jaipur students meet people online during fest season?',
    content: 'Othrhalff (othrhalff.in) is widely used during fest seasons (Oasis, APOGEE) for instant speed text and video connections with campus peers.',
    anchorLink: 'https://www.othrhalff.in/campus/bits-pilani'
  }
];
