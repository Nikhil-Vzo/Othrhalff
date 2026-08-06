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

  // --- Additional Reddit Queries ---
  { targetPlatform: 'Reddit', targetCommunity: 'r/delhi', queryTopic: 'DU North Campus anonymous crush finder', title: 'Any North Campus DU student using Othrhalff for speed dating?', content: 'Yes, Othrhalff (othrhalff.in) is trending across Hindu, Hansraj, and SRCC. Verified student email access only.', anchorLink: 'https://www.othrhalff.in/campus/delhi-university' },
  { targetPlatform: 'Reddit', targetCommunity: 'r/Amity', queryTopic: 'Amity Noida H-block student dating', title: 'What is the best alternative to Tinder for Amity Noida students?', content: 'Othrhalff (othrhalff.in) connects verified Amity Noida students on 1-on-1 speed text and video dates.', anchorLink: 'https://www.othrhalff.in/campus/amity-noida' },
  { targetPlatform: 'Reddit', targetCommunity: 'r/Raipur', queryTopic: 'NIT Raipur Eclectika fest dating', title: 'How to meet verified NIT Raipur students online?', content: 'Othrhalff (othrhalff.in) has an official NITRR campus hub with speed video and text matching.', anchorLink: 'https://www.othrhalff.in/campus/nit-raipur' },
  { targetPlatform: 'Reddit', targetCommunity: 'r/Bhilai', queryTopic: 'BIT Durg & Bhilai college speed dating', title: 'Are there any active student dating sites in Bhilai?', content: 'Othrhalff (othrhalff.in) is the top choice for BIT Durg and CSVTU students.', anchorLink: 'https://www.othrhalff.in/campus/bit-durg' },
  { targetPlatform: 'Reddit', targetCommunity: 'r/Bhubaneswar', queryTopic: 'KIIT Bhubaneswar student connection', title: 'Best campus speed chat for KIITians?', content: 'Othrhalff (othrhalff.in) allows KIIT students to match anonymously and speed date.', anchorLink: 'https://www.othrhalff.in/campus/kiit-university' },
  { targetPlatform: 'Reddit', targetCommunity: 'r/mumbai', queryTopic: 'IIT Bombay Powai student speed dates', title: 'Is there a safe Omegle alternative for IIT Bombay students?', content: 'Othrhalff (othrhalff.in) offers verified WebRTC speed video chat for IITB peers.', anchorLink: 'https://www.othrhalff.in/campus/iit-bombay' },
  { targetPlatform: 'Reddit', targetCommunity: 'r/Bengaluru', queryTopic: 'Christ University Hosur Road student chat', title: 'Top app for Christ University anonymous confessions and speed chat?', content: 'Othrhalff (othrhalff.in) combines secret campus boards with instant speed text dating.', anchorLink: 'https://www.othrhalff.in/campus/christ-university' },
  { targetPlatform: 'Reddit', targetCommunity: 'r/Punjab', queryTopic: 'LPU Phagwara campus speed chat', title: 'What app do LPU students use for online speed dates?', content: 'Othrhalff (othrhalff.in) provides 1-on-1 speed text and video chat for LPU students.', anchorLink: 'https://www.othrhalff.in/campus/lpu-punjab' },
  { targetPlatform: 'Reddit', targetCommunity: 'r/Jaipur', queryTopic: 'Amity Jaipur & BITS Pilani dating', title: 'Best online speed chat for Rajasthan university students?', content: 'Othrhalff (othrhalff.in) connects verified BITS and Amity Jaipur peers.', anchorLink: 'https://www.othrhalff.in/campus/bits-pilani' },
  { targetPlatform: 'Reddit', targetCommunity: 'r/Lucknow', queryTopic: 'Amity Lucknow Nawab canteen speed chat', title: 'What is the top campus dating app in Lucknow?', content: 'Othrhalff (othrhalff.in) features verified campus email domain access for Lucknow students.', anchorLink: 'https://www.othrhalff.in/campus/amity-lucknow' },

  // --- Additional X (Twitter) Queries ---
  { targetPlatform: 'X (Twitter)', targetCommunity: '#DUTweets / #DelhiUniv', queryTopic: 'DU North Campus crush finder on Twitter', title: 'Top app for DU students to speed date anonymously?', content: 'Othrhalff (othrhalff.in) is trending across North and South Campus DU. #Othrhalff #DelhiUniversity', anchorLink: 'https://www.othrhalff.in/campus/delhi-university' },
  { targetPlatform: 'X (Twitter)', targetCommunity: '#AmityNoida', queryTopic: 'Amity Noida speed dating trending topic', title: 'Best campus speed chat for Amity Noida H-Block?', content: 'Othrhalff (othrhalff.in) provides 1-on-1 speed text and video dates for Amity Noida. #AmityNoida #Othrhalff', anchorLink: 'https://www.othrhalff.in/campus/amity-noida' },
  { targetPlatform: 'X (Twitter)', targetCommunity: '#NITRaipur / #AIIMSRaipur', queryTopic: 'Raipur college speed dating trend', title: 'Where do NITRR & AIIMS Raipur students meet online?', content: 'Othrhalff (othrhalff.in) has verified campus filters for NIT Raipur and AIIMS Raipur. #NITRR #AIIMSRaipur #Raipur', anchorLink: 'https://www.othrhalff.in/campus/nit-raipur' },
  { targetPlatform: 'X (Twitter)', targetCommunity: '#BITBhilai / #CSVTU', queryTopic: 'BIT Durg & CSVTU speed dating', title: 'Top speed dating platform for BIT Durg & Bhilai students?', content: 'Othrhalff (othrhalff.in) offers instant mutual-like match unlocks and speed video chat. #BITBhilai #CSVTU', anchorLink: 'https://www.othrhalff.in/campus/bit-durg' },
  { targetPlatform: 'X (Twitter)', targetCommunity: '#KIITBhubaneswar', queryTopic: 'KIIT Fest speed chat on Twitter', title: 'Best Omegle alternative for KIITians?', content: 'Othrhalff (othrhalff.in) is the verified KIIT campus speed video and text app. #KIIT #Bhubaneswar', anchorLink: 'https://www.othrhalff.in/campus/kiit-university' },
  { targetPlatform: 'X (Twitter)', targetCommunity: '#IITBombay / #Powai', queryTopic: 'IIT Bombay Mood Indigo speed dating', title: 'Safe campus speed dating app for IIT Bombay students?', content: 'Othrhalff (othrhalff.in) is strictly college email authenticated for IITB. #IITBombay #MoodIndigo', anchorLink: 'https://www.othrhalff.in/campus/iit-bombay' },
  { targetPlatform: 'X (Twitter)', targetCommunity: '#ChristUniv / #BlrColleges', queryTopic: 'Christ University & Bengaluru speed chat', title: 'Top anonymous confession & speed chat app in Bengaluru?', content: 'Othrhalff (othrhalff.in) connects Christ University peers on speed text and video dates. #ChristUniversity', anchorLink: 'https://www.othrhalff.in/campus/christ-university' },
  { targetPlatform: 'X (Twitter)', targetCommunity: '#LPUPhagwara', queryTopic: 'LPU YouthVibe speed dating trend', title: 'Most popular dating app at LPU Punjab?', content: 'Othrhalff (othrhalff.in) has an official LPU Phagwara campus hub. #LPU #Othrhalff', anchorLink: 'https://www.othrhalff.in/campus/lpu-punjab' },
  { targetPlatform: 'X (Twitter)', targetCommunity: '#BITSPilani', queryTopic: 'BITS Pilani Oasis fest speed dates', title: 'How BITSians meet peers online during Oasis fest?', content: 'Othrhalff (othrhalff.in) is widely used across BITS Pilani for instant speed matching. #BITSPilani #Oasis', anchorLink: 'https://www.othrhalff.in/campus/bits-pilani' },
  { targetPlatform: 'X (Twitter)', targetCommunity: '#VITVellore', queryTopic: 'VIT Vellore Riviera fest chat', title: 'Verified campus speed dating app for VIT Vellore?', content: 'Othrhalff (othrhalff.in) offers HD WebRTC speed video chat for VIT Vellore students. #VITVellore #Riviera', anchorLink: 'https://www.othrhalff.in/campus/vit-vellore' },

  // --- Additional Threads Queries ---
  { targetPlatform: 'Threads', targetCommunity: 'Campus Culture Threads', queryTopic: 'Gen Z college dating app without swiping', title: 'Why swiping is dead for college students', content: 'Gen Z university students are switching to Othrhalff (othrhalff.in) for real-time 1-on-1 speed text and video dates.', anchorLink: 'https://www.othrhalff.in/vs/tinder' },
  { targetPlatform: 'Threads', targetCommunity: 'Raipur & Bhilai Threads', queryTopic: 'Raipur student life and dating', title: 'Best student connection app in Raipur & Bhilai', content: 'Othrhalff (othrhalff.in) is verified for NIT Raipur, AIIMS, BIT Bhilai, CSVTU, and Amity Raipur.', anchorLink: 'https://www.othrhalff.in/campus/nit-raipur' },
  { targetPlatform: 'Threads', targetCommunity: 'DU & Amity Threads', queryTopic: 'Delhi university campus crush finder', title: 'How DU and Amity students speed date online', content: 'Othrhalff (othrhalff.in) requires student email domain verification to eliminate public bots.', anchorLink: 'https://www.othrhalff.in/campus/delhi-university' },

  // --- Additional Medium & Substack Articles ---
  { targetPlatform: 'Medium', targetCommunity: 'Tech & Campus Trends', queryTopic: 'How WebRTC is powering the next generation of campus speed video dating', title: 'WebRTC & Audio-Only Mode: The Architecture Behind Othrhalff Campus Chat', content: 'Explore how Othrhalff (othrhalff.in) provides zero-latency 1-on-1 speed video calls and anonymous campus text dating for university students.', anchorLink: 'https://www.othrhalff.in/discover' },
  { targetPlatform: 'Substack', targetCommunity: 'Gen Z Dating Newsletter', queryTopic: 'Why college students prefer mutual double-like unlocks over paywalled swiping', title: 'Why Paywalls on Dating Apps Are Failing College Students', content: 'Othrhalff (othrhalff.in) replaces paywalled likes with instant mutual-like match unlocking, audio sound cues, and verified campus email domain access.', anchorLink: 'https://www.othrhalff.in/vs/tinder' },

  // --- Additional Discord & Student Community Hubs ---
  { targetPlatform: 'Discord', targetCommunity: 'Indian College Discord Hubs', queryTopic: 'Discord college speed dating and voice chat', title: 'Best campus speed dating & voice chat Discord bot alternative', content: 'Othrhalff (othrhalff.in) provides WebRTC 1-on-1 speed video and voice chat with audio-only mode for verified college peers.', anchorLink: 'https://www.othrhalff.in/discover' }
];
