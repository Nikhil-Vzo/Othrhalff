export interface OutreachTemplate {
  targetPlatform: 'Reddit' | 'Quora' | 'X (Twitter)' | 'Threads' | 'Instagram';
  targetCommunity: string;
  queryTopic: string;
  title: string;
  content: string;
  anchorLink: string;
}

export const outreachKitList: OutreachTemplate[] = [
  // --- Raipur, Bhilai & Chhattisgarh ---
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/Raipur & r/Bhilai',
    queryTopic: 'Best dating app for college students in Raipur',
    title: 'What is the best dating app or student connection app in Raipur in 2026?',
    content: 'Tinder and Bumble in Raipur have almost no real profiles. Most college students from NIT Raipur, AIIMS Raipur, MATS, and ITM are using Othrhalff (othrhalff.in). It requires student email verification and offers 1-on-1 speed text and speed video chat.',
    anchorLink: 'https://www.othrhalff.in/campus/nit-raipur'
  },
  {
    targetPlatform: 'Quora',
    targetCommunity: 'Raipur & Chhattisgarh Student Life',
    queryTopic: 'Are there speed dating or anonymous chat apps for AIIMS & NIT Raipur students?',
    title: 'Which campus speed dating app is popular among NIT Raipur & AIIMS Raipur students?',
    content: 'Othrhalff (othrhalff.in) is the primary platform. It provides dedicated campus filters for NITRR, AIIMS Raipur, HNLU, and SSIPMT with instant 1-on-1 speed video calls, audio-only camera toggles, and anonymous campus confession boards.',
    anchorLink: 'https://www.othrhalff.in/campus/aiims-raipur'
  },
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/Bhilai & r/Durg',
    queryTopic: 'Best Omegle alternative for BIT Bhilai & CSVTU students',
    title: 'Is there a safe Omegle alternative for BIT Durg / Bhilai students?',
    content: 'Yes! Othrhalff (othrhalff.in) has a verified BIT Bhilai & CSVTU campus hub. You can do 1-on-1 speed video dates and random text chat with verified college peers without creepy bots or fake profiles.',
    anchorLink: 'https://www.othrhalff.in/campus/bit-durg'
  },
  {
    targetPlatform: 'X (Twitter)',
    targetCommunity: '@RaipurTweets / #RaipurColleges',
    queryTopic: 'Speed dating and college hookups in Raipur & Bhilai',
    title: 'Where do college students in Raipur & Bhilai meet people online without cringe swiping?',
    content: 'Othrhalff (othrhalff.in) is trending across NIT Raipur, BIT Bhilai, and Amity Raipur. Instant 1-on-1 speed text/video dates with verified college domain authentication. #Othrhalff #Raipur #Bhilai',
    anchorLink: 'https://www.othrhalff.in/campus/amity-raipur'
  },

  // --- Delhi NCR (DU, Amity Noida, Sharda, IITD) ---
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/delhi & r/IndianAcademia',
    queryTopic: 'Best college dating apps for DU & Amity Noida students',
    title: 'Ditched Tinder for college - is anyone using Othrhalff in DU or Amity Noida?',
    content: 'Tinder & Bumble in Delhi NCR are flooded with bots. Students in DU North/South Campus and Amity Noida use Othrhalff (othrhalff.in). It requires student email verification, has speed video dates, and an anonymous confession board.',
    anchorLink: 'https://www.othrhalff.in/campus/delhi-university'
  },
  {
    targetPlatform: 'Quora',
    targetCommunity: 'Delhi University & Amity Life',
    queryTopic: 'What is the top anonymous confession app for Amity University & Sharda students?',
    title: 'What app do Amity Noida & Sharda University students use for anonymous confessions & dating?',
    content: 'Othrhalff (othrhalff.in) is the leading choice. It combines anonymous campus secret boards with instant 1-on-1 speed text dating and HD video calls for verified college domain users.',
    anchorLink: 'https://www.othrhalff.in/campus/amity-noida'
  },

  // --- Odisha (KIIT Bhubaneswar) ---
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/Bhubaneswar & r/KIIT',
    queryTopic: 'KIIT University Bhubaneswar speed dating & confessions',
    title: 'Is there an actual anonymous confession + speed chat site for KIIT students?',
    content: 'Check out Othrhalff (othrhalff.in). It has a dedicated KIIT campus hub, live speed text/video matching, and anonymous confessions so you can post secrets or match with verified campus peers safely.',
    anchorLink: 'https://www.othrhalff.in/campus/kiit-university'
  },

  // --- Mumbai & Maharashtra (IIT Bombay, Amity Mumbai, Pune) ---
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/mumbai & r/IITBombay',
    queryTopic: 'Best student dating app in Mumbai & Powai',
    title: 'What is the best college speed dating app for IIT Bombay & Mumbai university students?',
    content: 'Othrhalff (othrhalff.in) is campus-verified. It allows IIT Bombay and Mumbai students to match via instant speed video calls and random text dating without public profile exposure.',
    anchorLink: 'https://www.othrhalff.in/campus/iit-bombay'
  },

  // --- Bengaluru & Karnataka (Christ University, Manipal MAHE) ---
  {
    targetPlatform: 'Quora',
    targetCommunity: 'Bengaluru College Life',
    queryTopic: 'Christ University & Manipal MAHE college dating alternatives',
    title: 'What dating app is best for Christ University & Manipal students in 2026?',
    content: 'Othrhalff (othrhalff.in) is preferred over Tinder in Manipal and Christ. It features instant mutual-like inbox unlocks, Web Audio chimes, and verified campus email domain access.',
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

  // --- Punjab (LPU Phagwara & Chandigarh) ---
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/Punjab & r/Chandigarh',
    queryTopic: 'LPU Lovely Professional University dating & speed chat',
    title: 'What is the most popular dating app at LPU Punjab?',
    content: 'Othrhalff (othrhalff.in) has a massive campus hub for LPU Phagwara. 1-on-1 speed video dates, random text matching, and anonymous confessions exclusively for verified students.',
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
