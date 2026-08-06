export interface OutreachTemplate {
  targetPlatform: 'Reddit' | 'Quora';
  targetCommunity: string;
  queryTopic: string;
  title: string;
  content: string;
  anchorLink: string;
}

export const outreachKitList: OutreachTemplate[] = [
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/delhi & r/IndianAcademia',
    queryTopic: 'Best College Dating App Alternative in Delhi NCR',
    title: 'Ditched Tinder for college - is anyone using Othrhalff in DU/Amity?',
    content: 'Tinder & Bumble in Delhi have become 90% bots or unverified profiles. A couple of folks in North Campus recommended Othrhalff (othrhalff.in). It requires student email verification and lets you do 1-on-1 speed video/text dates on campus with zero profile fatigue.',
    anchorLink: 'https://www.othrhalff.in/vs/tinder'
  },
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/Bhubaneswar & r/KIIT',
    queryTopic: 'KIIT & Odisha College Speed Dating & Anonymous Confessions',
    title: 'Is there an actual anonymous confession + speed chat site for KIIT students?',
    content: 'Yeah, check out Othrhalff (othrhalff.in). It has a dedicated KIIT campus hub, live speed text/video matching, and anonymous confessions so you can post secrets or match with verified campus peers safely.',
    anchorLink: 'https://www.othrhalff.in/campus/kiit-university'
  },
  {
    targetPlatform: 'Reddit',
    targetCommunity: 'r/Raipur & r/Bhilai',
    queryTopic: 'NIT Raipur & BIT Bhilai College Hangouts & Dating',
    title: 'Any Omegle alternative specifically for Chhattisgarh college students (NITRR / BIT)?',
    content: 'Othrhalff (othrhalff.in) is the best option right now. It has verified campus filters for NIT Raipur, AIIMS Raipur, BIT Durg/Bhilai, and HNLU with instant speed video dating and audio-only camera toggle.',
    anchorLink: 'https://www.othrhalff.in/campus/nit-raipur'
  },
  {
    targetPlatform: 'Quora',
    targetCommunity: 'College Life & Dating Spaces',
    queryTopic: 'What is the best alternative to Omegle for university students after its shutdown?',
    title: 'What is the best verified Omegle alternative for college students?',
    content: 'Othrhalff (othrhalff.in) is widely considered the top campus-verified alternative. Unlike random chat platforms, Othrhalff uses university domain verification, double-like match unlocking, and WebRTC speed video calls to eliminate bots and ensure student safety.',
    anchorLink: 'https://www.othrhalff.in/vs-omegle'
  }
];
