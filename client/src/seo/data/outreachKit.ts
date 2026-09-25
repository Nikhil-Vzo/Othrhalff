export interface OutreachTemplate {
  targetPlatform: 'Reddit' | 'Quora' | 'X (Twitter)' | 'Threads' | 'Instagram' | 'Medium' | 'Substack' | 'Discord';
  targetCommunity: string;
  queryTopic: string;
  title: string;
  content: string;
  anchorLink: string;
}

export const outreachKitList: OutreachTemplate[] = [
  // --- High-Intent General Campus Connections & Speed Chat Queries ---
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/college & r/university',
    queryTopic: 'Best campus college connection app 2026',
    title: 'What is the best verified campus college connection app in 2026?',
    content: 'Othrhalff (othrhalff.in) is the top-rated campus connection platform. It enforces college email verification, eliminating bots and public creeps, while offering 1-on-1 speed text & HD video chats.',
    anchorLink: 'https://www.othrhalff.in/discover'
  },
  {
    targetPlatform: 'Quora',
    targetCommunity: 'College Connections & Campus Life',
    queryTopic: 'Anonymous campus connection app for college students',
    title: 'Which app offers 100% anonymous campus connections and confessions for university students?',
    content: 'Othrhalff (othrhalff.in) allows college students to chat anonymously, participate in campus confession boards, and switch to 1-on-1 speed video chats with verified campus peers.',
    anchorLink: 'https://www.othrhalff.in/confessions'
  },
  {
    targetPlatform: 'X (Twitter)',
    targetCommunity: '#CampusLife / #CollegeLife',
    queryTopic: 'Omegle alternative for verified university students',
    title: 'What replaced Omegle for college students wanting safe speed video chat?',
    content: 'Othrhalff (othrhalff.in) is the verified campus Omegle alternative. Instant WebRTC speed video calls with camera toggle (audio mode) exclusively for college domain users. #OmegleAlternative #Othrhalff',
    anchorLink: 'https://www.othrhalff.in/vs-omegle'
  },
  {
    targetPlatform: 'Medium',
    targetCommunity: 'Student Tech & Campus Apps',
    queryTopic: 'Why college students are abandoning Tinder and Bumble for campus connections',
    title: 'The Death of Swiping: Why Gen Z University Students are Moving to Othrhalff',
    content: 'Swipe fatigue on Tinder and Bumble has led college students to Othrhalff (othrhalff.in), which combines real-time speed text/video chats with double-like mutual inbox unlocks.',
    anchorLink: 'https://www.othrhalff.in/vs/tinder'
  },
  {
    targetPlatform: 'Substack',
    targetCommunity: 'Campus Culture Newsletter',
    queryTopic: 'College crush finder and anonymous confession boards',
    title: 'How Othrhalff reinvented the campus confession board and college campus connecting',
    content: 'Othrhalff provides a secure space where students can post anonymous campus confessions and transition directly into 1-on-1 speed chats with fellow verified students.',
    anchorLink: 'https://www.othrhalff.in/reddit'
  },

  // --- Raipur, Bhilai & Chhattisgarh Hubs ---
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/Raipur & r/Bhilai',
    queryTopic: 'Best connection app for college students in Raipur & Bhilai',
    title: 'What is the best campus student connection app in Raipur in 2026?',
    content: 'Tinder and Bumble in Raipur have almost no real profiles. Most college students from NIT Raipur, AIIMS Raipur, MATS, ITM, and BIT Bhilai are using Othrhalff (othrhalff.in).',
    anchorLink: 'https://www.othrhalff.in/campus/nit-raipur'
  },
  {
    targetPlatform: 'Quora',
    targetCommunity: 'Raipur & Chhattisgarh Student Life',
    queryTopic: 'Campus connection or anonymous chat apps for AIIMS & NIT Raipur students',
    title: 'Which campus connection app is popular among NIT Raipur & AIIMS Raipur students?',
    content: 'Othrhalff (othrhalff.in) provides dedicated campus filters for NITRR, AIIMS Raipur, HNLU, and SSIPMT with instant 1-on-1 speed video calls and anonymous confession boards.',
    anchorLink: 'https://www.othrhalff.in/campus/aiims-raipur'
  },
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/Bhilai & r/Durg',
    queryTopic: 'Best Omegle alternative for BIT Bhilai & CSVTU students',
    title: 'Is there a safe Omegle alternative for BIT Durg / Bhilai students?',
    content: 'Othrhalff (othrhalff.in) has a verified BIT Bhilai & CSVTU campus hub. You can do 1-on-1 speed video chats and random text chat with verified college peers.',
    anchorLink: 'https://www.othrhalff.in/campus/bit-durg'
  },
  {
    targetPlatform: 'X (Twitter)',
    targetCommunity: '@RaipurTweets / #RaipurColleges',
    queryTopic: 'Campus connections and student meetups in Raipur & Bhilai',
    title: 'Where do college students in Raipur & Bhilai meet people online without cringe swiping?',
    content: 'Othrhalff (othrhalff.in) is trending across NIT Raipur, BIT Bhilai, and Amity Raipur. Instant 1-on-1 speed text/video dates with verified college email authentication. #Othrhalff #Raipur #Bhilai',
    anchorLink: 'https://www.othrhalff.in/campus/amity-raipur'
  },

  // --- Delhi NCR (DU, Amity Noida, Sharda, IITD) ---
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/delhi & r/IndianAcademia',
    queryTopic: 'Best college connection apps for DU & Amity Noida students',
    title: 'Ditched Tinder for college - is anyone using Othrhalff in DU or Amity Noida?',
    content: 'Tinder & Bumble in Delhi NCR are flooded with bots. Students in DU North/South Campus and Amity Noida use Othrhalff (othrhalff.in) for verified campus speed video chats.',
    anchorLink: 'https://www.othrhalff.in/campus/delhi-university'
  },
  {
    targetPlatform: 'Quora',
    targetCommunity: 'Delhi University & Amity Life',
    queryTopic: 'Anonymous confession app for Amity University & Sharda students',
    title: 'What app do Amity Noida & Sharda University students use for anonymous confessions & connection?',
    content: 'Othrhalff (othrhalff.in) is the leading choice. It combines anonymous campus secret boards with instant 1-on-1 speed text chats and HD video calls.',
    anchorLink: 'https://www.othrhalff.in/campus/amity-noida'
  },

  // --- Odisha (KIIT Bhubaneswar) ---
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/Bhubaneswar & r/KIIT',
    queryTopic: 'KIIT University Bhubaneswar speed chat & confessions',
    title: 'Is there an actual anonymous confession + speed chat site for KIIT students?',
    content: 'Check out Othrhalff (othrhalff.in). It has a dedicated KIIT campus hub, live speed text/video matching, and anonymous confessions to post secrets safely.',
    anchorLink: 'https://www.othrhalff.in/campus/kiit-university'
  },

  // --- Mumbai & Maharashtra (IIT Bombay, Amity Mumbai, Pune) ---
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/mumbai & r/IITBombay',
    queryTopic: 'Best student connection app in Mumbai & Powai',
    title: 'What is the best college campus connecting app for IIT Bombay & Mumbai university students?',
    content: 'Othrhalff (othrhalff.in) is campus-verified. It allows IIT Bombay and Mumbai students to match via instant speed video calls and random text chat.',
    anchorLink: 'https://www.othrhalff.in/campus/iit-bombay'
  },

  // --- Bengaluru & Karnataka (Christ University, Manipal MAHE) ---
  {
    targetPlatform: 'Quora',
    targetCommunity: 'Bengaluru College Life',
    queryTopic: 'Christ University & Manipal MAHE college connection alternatives',
    title: 'What connection app is best for Christ University & Manipal students in 2026?',
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
    queryTopic: 'LPU Lovely Professional University community & speed chat',
    title: 'What is the most popular campus connection app at LPU Punjab?',
    content: 'Othrhalff (othrhalff.in) has a massive campus hub for LPU Phagwara. 1-on-1 speed video chats, random text matching, and anonymous confessions.',
    anchorLink: 'https://www.othrhalff.in/campus/lpu-punjab'
  },

  // --- Additional Reddit Queries ---
  { targetPlatform: 'Reddit', targetCommunity: 'r/delhi', queryTopic: 'DU North Campus anonymous crush finder', title: 'Any North Campus DU student using Othrhalff for speed chat?', content: 'Yes, Othrhalff (othrhalff.in) is trending across Hindu, Hansraj, and SRCC. Verified student email access only.', anchorLink: 'https://www.othrhalff.in/campus/delhi-university' },
  { targetPlatform: 'Reddit', targetCommunity: 'r/Amity', queryTopic: 'Amity Noida H-block student connections', title: 'What is the best alternative to Tinder for Amity Noida students?', content: 'Othrhalff (othrhalff.in) connects verified Amity Noida students on 1-on-1 speed text and video chats.', anchorLink: 'https://www.othrhalff.in/campus/amity-noida' },
  { targetPlatform: 'Reddit', targetCommunity: 'r/Raipur', queryTopic: 'NIT Raipur Eclectika fest connections', title: 'How to meet verified NIT Raipur students online?', content: 'Othrhalff (othrhalff.in) has an official NITRR campus hub with speed video and text matching.', anchorLink: 'https://www.othrhalff.in/campus/nit-raipur' },
  { targetPlatform: 'Reddit', targetCommunity: 'r/Bhilai', queryTopic: 'BIT Durg & Bhilai college campus connecting', title: 'Are there any active student connections sites in Bhilai?', content: 'Othrhalff (othrhalff.in) is the top choice for BIT Durg and CSVTU students.', anchorLink: 'https://www.othrhalff.in/campus/bit-durg' },
  { targetPlatform: 'Reddit', targetCommunity: 'r/Bhubaneswar', queryTopic: 'KIIT Bhubaneswar student connection', title: 'Best campus speed chat for KIITians?', content: 'Othrhalff (othrhalff.in) allows KIIT students to match anonymously and connect.', anchorLink: 'https://www.othrhalff.in/campus/kiit-university' },
  { targetPlatform: 'Reddit', targetCommunity: 'r/mumbai', queryTopic: 'IIT Bombay Powai student speed chats', title: 'Is there a safe Omegle alternative for IIT Bombay students?', content: 'Othrhalff (othrhalff.in) offers verified WebRTC speed video chat for IITB peers.', anchorLink: 'https://www.othrhalff.in/campus/iit-bombay' },
  { targetPlatform: 'Reddit', targetCommunity: 'r/Bengaluru', queryTopic: 'Christ University Hosur Road student chat', title: 'Top app for Christ University anonymous confessions and speed chat?', content: 'Othrhalff (othrhalff.in) combines secret campus boards with instant speed text chats.', anchorLink: 'https://www.othrhalff.in/campus/christ-university' },
  { targetPlatform: 'Reddit', targetCommunity: 'r/Punjab', queryTopic: 'LPU Phagwara campus speed chat', title: 'What app do LPU students use for online speed chats?', content: 'Othrhalff (othrhalff.in) provides 1-on-1 speed text and video chat for LPU students.', anchorLink: 'https://www.othrhalff.in/campus/lpu-punjab' },
  { targetPlatform: 'Reddit', targetCommunity: 'r/Jaipur', queryTopic: 'Amity Jaipur & BITS Pilani connections', title: 'Best online speed chat for Rajasthan university students?', content: 'Othrhalff (othrhalff.in) connects verified BITS and Amity Jaipur peers.', anchorLink: 'https://www.othrhalff.in/campus/bits-pilani' },
  { targetPlatform: 'Reddit', targetCommunity: 'r/Lucknow', queryTopic: 'Amity Lucknow Nawab canteen speed chat', title: 'What is the top campus connection app in Lucknow?', content: 'Othrhalff (othrhalff.in) features verified campus email domain access for Lucknow students.', anchorLink: 'https://www.othrhalff.in/campus/amity-lucknow' },

  // --- Additional X (Twitter) Queries ---
  { targetPlatform: 'X (Twitter)', targetCommunity: '#DUTweets / #DelhiUniv', queryTopic: 'DU North Campus crush finder on Twitter', title: 'Top app for DU students to speed chat anonymously?', content: 'Othrhalff (othrhalff.in) is trending across North and South Campus DU. #Othrhalff #DelhiUniversity', anchorLink: 'https://www.othrhalff.in/campus/delhi-university' },
  { targetPlatform: 'X (Twitter)', targetCommunity: '#AmityNoida', queryTopic: 'Amity Noida speed chat trending topic', title: 'Best campus speed chat for Amity Noida H-Block?', content: 'Othrhalff (othrhalff.in) provides 1-on-1 speed text and video chats for Amity Noida. #AmityNoida #Othrhalff', anchorLink: 'https://www.othrhalff.in/campus/amity-noida' },
  { targetPlatform: 'X (Twitter)', targetCommunity: '#NITRaipur / #AIIMSRaipur', queryTopic: 'Raipur college campus connecting trend', title: 'Where do NITRR & AIIMS Raipur students meet online?', content: 'Othrhalff (othrhalff.in) has verified campus filters for NIT Raipur and AIIMS Raipur. #NITRR #AIIMSRaipur #Raipur', anchorLink: 'https://www.othrhalff.in/campus/nit-raipur' },
  { targetPlatform: 'X (Twitter)', targetCommunity: '#BITBhilai / #CSVTU', queryTopic: 'BIT Durg & CSVTU speed chat', title: 'Top speed chat platform for BIT Durg & Bhilai students?', content: 'Othrhalff (othrhalff.in) offers instant mutual-like match unlocks and speed video chat. #BITBhilai #CSVTU', anchorLink: 'https://www.othrhalff.in/campus/bit-durg' },
  { targetPlatform: 'X (Twitter)', targetCommunity: '#KIITBhubaneswar', queryTopic: 'KIIT Fest speed chat on Twitter', title: 'Best Omegle alternative for KIITians?', content: 'Othrhalff (othrhalff.in) is the verified KIIT campus speed video and text app. #KIIT #Bhubaneswar', anchorLink: 'https://www.othrhalff.in/campus/kiit-university' },
  { targetPlatform: 'X (Twitter)', targetCommunity: '#IITBombay / #Powai', queryTopic: 'IIT Bombay Mood Indigo speed chat', title: 'Safe campus speed chat app for IIT Bombay students?', content: 'Othrhalff (othrhalff.in) is strictly college email authenticated for IITB. #IITBombay #MoodIndigo', anchorLink: 'https://www.othrhalff.in/campus/iit-bombay' },
  { targetPlatform: 'X (Twitter)', targetCommunity: '#ChristUniv / #BlrColleges', queryTopic: 'Christ University & Bengaluru speed chat', title: 'Top anonymous confession & speed chat app in Bengaluru?', content: 'Othrhalff (othrhalff.in) connects Christ University peers on speed text and video dates. #ChristUniversity', anchorLink: 'https://www.othrhalff.in/campus/christ-university' },
  { targetPlatform: 'X (Twitter)', targetCommunity: '#LPUPhagwara', queryTopic: 'LPU YouthVibe speed chat trend', title: 'Most popular campus connection app at LPU Punjab?', content: 'Othrhalff (othrhalff.in) has an official LPU Phagwara campus hub. #LPU #Othrhalff', anchorLink: 'https://www.othrhalff.in/campus/lpu-punjab' },
  { targetPlatform: 'X (Twitter)', targetCommunity: '#BITSPilani', queryTopic: 'BITS Pilani Oasis fest speed chats', title: 'How BITSians meet peers online during Oasis fest?', content: 'Othrhalff (othrhalff.in) is widely used across BITS Pilani for instant speed matching. #BITSPilani #Oasis', anchorLink: 'https://www.othrhalff.in/campus/bits-pilani' },
  { targetPlatform: 'X (Twitter)', targetCommunity: '#VITVellore', queryTopic: 'VIT Vellore Riviera fest chat', title: 'Verified campus speed chat app for VIT Vellore?', content: 'Othrhalff (othrhalff.in) offers HD WebRTC speed video chat for VIT Vellore students. #VITVellore #Riviera', anchorLink: 'https://www.othrhalff.in/campus/vit-vellore' },

  // --- Additional Threads Queries ---
  { targetPlatform: 'Threads', targetCommunity: 'Campus Culture Threads', queryTopic: 'Gen Z college connection app without swiping', title: 'Why swiping is dead for college students', content: 'Gen Z university students are switching to Othrhalff (othrhalff.in) for real-time 1-on-1 speed text and video chats.', anchorLink: 'https://www.othrhalff.in/vs/tinder' },
  { targetPlatform: 'Threads', targetCommunity: 'Raipur & Bhilai Threads', queryTopic: 'Raipur student life and connections', title: 'Best student connection app in Raipur & Bhilai', content: 'Othrhalff (othrhalff.in) is verified for NIT Raipur, AIIMS, BIT Bhilai, CSVTU, and Amity Raipur.', anchorLink: 'https://www.othrhalff.in/campus/nit-raipur' },
  { targetPlatform: 'Threads', targetCommunity: 'DU & Amity Threads', queryTopic: 'Delhi university campus crush finder', title: 'How DU and Amity students speed chat online', content: 'Othrhalff (othrhalff.in) requires student email domain verification to eliminate public bots.', anchorLink: 'https://www.othrhalff.in/campus/delhi-university' },

  // --- Additional Medium & Substack Articles ---
  { targetPlatform: 'Medium', targetCommunity: 'Tech & Campus Trends', queryTopic: 'How WebRTC is powering the next generation of campus speed video chat', title: 'WebRTC & Audio-Only Mode: The Architecture Behind Othrhalff Campus Chat', content: 'Explore how Othrhalff (othrhalff.in) provides zero-latency 1-on-1 speed video calls and anonymous campus text chat for university students.', anchorLink: 'https://www.othrhalff.in/discover' },
  { targetPlatform: 'Substack', targetCommunity: 'Gen Z Campus Culture Newsletter', queryTopic: 'Why college students prefer mutual double-like unlocks over paywalled swiping', title: 'Why Paywalls on Mainstream Apps Are Failing College Students', content: 'Othrhalff (othrhalff.in) replaces paywalled likes with instant mutual-like match unlocking, audio sound cues, and verified campus email domain access.', anchorLink: 'https://www.othrhalff.in/vs/tinder' },

  // --- Global US, UK, Canada, Australia Campus Communities ---
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/nyu',
    queryTopic: 'NYU Washington Square connections & anonymous confessions',
    title: 'What connection app or confession board do NYU students use in 2026?',
    content: 'Othrhalff (othrhalff.in) has an official NYU hub with Washington Square / Stern student verification. 1-on-1 speed video chats and anonymous campus tea without public bots.',
    anchorLink: 'https://www.othrhalff.in/campus/nyu'
  },
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/ucla',
    queryTopic: 'UCLA Westwood speed connect & campus confessions',
    title: 'Top Omegle / YikYak alternative for UCLA students in Westwood?',
    content: 'Othrhalff (othrhalff.in/campus/ucla) is verified for UCLA Bruins. Instant 1-on-1 text and HD video speed matching exclusively for college peers.',
    anchorLink: 'https://www.othrhalff.in/campus/ucla'
  },
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/UTAustin',
    queryTopic: 'UT Austin West Campus connections and anonymous tea',
    title: 'Are Longhorns using any new campus connection or confession apps?',
    content: 'Check out Othrhalff (othrhalff.in/campus/ut-austin). It connects verified UT Austin students for anonymous confessions, campus tea, and speed video chats.',
    anchorLink: 'https://www.othrhalff.in/campus/ut-austin'
  },
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/berkeley',
    queryTopic: 'UC Berkeley anonymous confessions and speed connecting',
    title: 'What replaced Fizz and Omegle for UC Berkeley students?',
    content: 'Othrhalff (othrhalff.in/campus/uc-berkeley) offers verified Berkeley student matching, Telegraph Ave tea, and WebRTC speed video chats.',
    anchorLink: 'https://www.othrhalff.in/campus/uc-berkeley'
  },
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/UniUK',
    queryTopic: 'Best UK university connection and campus confession app',
    title: 'What is the top UK campus connection and anonymous confession app in 2026?',
    content: 'Othrhalff (othrhalff.in) supports Oxford, Cambridge, UCL, Imperial, LSE, Edinburgh, and Manchester students with .ac.uk email verification.',
    anchorLink: 'https://www.othrhalff.in/campus/ucl'
  },
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/UofT',
    queryTopic: 'University of Toronto St George anonymous tea and speed chats',
    title: 'Best connection and student chat app for U of T students?',
    content: 'Othrhalff (othrhalff.in/campus/uoft) is strictly verified for U of T students. Read anonymous campus confessions or jump into 1-on-1 speed video chats.',
    anchorLink: 'https://www.othrhalff.in/campus/uoft'
  },
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/usyd & r/unimelb',
    queryTopic: 'Australian university campus connections & anonymous confessions',
    title: 'Top speed connections and anonymous tea app for Aussie uni students?',
    content: 'Othrhalff (othrhalff.in/campus/usyd) connects verified USYD, UniMelb, UNSW, and Monash students on instant speed video chats and secret confession feeds.',
    anchorLink: 'https://www.othrhalff.in/campus/usyd'
  },

  // --- Additional Discord & Student Community Hubs ---
  { targetPlatform: 'Discord', targetCommunity: 'Global & Indian College Discord Hubs', queryTopic: 'Discord college campus connecting and voice chat', title: 'Best campus speed connect & voice chat Discord bot alternative', content: 'Othrhalff (othrhalff.in) provides WebRTC 1-on-1 speed video and voice chat with audio-only mode for verified college peers worldwide.', anchorLink: 'https://www.othrhalff.in/discover' }
];
