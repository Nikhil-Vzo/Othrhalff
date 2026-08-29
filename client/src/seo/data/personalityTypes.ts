export interface PersonalityType {
  code: string;
  name: string;
  archetype: string;
  tagline: string;
  traits: string[];
  datingStyle: string;
  greenFlags: string[];
  bestMatches: string[];
  challengingMatches: string[];
  communicationPrompt: string;
}

export const personalityTypes: PersonalityType[] = [
  {
    code: 'INFP',
    name: 'The Idealist Dreamer',
    archetype: 'The Romantic Visionary',
    tagline: 'Craves poetic emotional depth, quiet loyalty, and genuine authenticity.',
    traits: ['Deeply Empathetic', 'Creative', 'Values-Driven', 'Private & Loyal'],
    datingStyle: 'Slow-burn, intense 1-on-1 conversations over crowded parties. Needs emotional safety before opening up completely.',
    greenFlags: ['Active listening without judgment', 'Respecting creative solitude', 'Spontaneous deep discussions at 2 AM'],
    bestMatches: ['ENFJ', 'ENTJ', 'INTJ', 'INFJ'],
    challengingMatches: ['ESTJ', 'ESTP'],
    communicationPrompt: 'What is an unspoken belief you hold about love that most people disagree with?'
  },
  {
    code: 'INTJ',
    name: 'The Mastermind Strategist',
    archetype: 'The Intellectual Anchor',
    tagline: 'Values intellectual banter, direct communication, and ambitious mutual growth.',
    traits: ['Hyper-Analytical', 'Strategic', 'Independent', 'Fiercely Loyal'],
    datingStyle: 'Direct and intentional. Hates games and small talk; looking for an intellectual equal who can challenge ideas.',
    greenFlags: ['High competence & ambition', 'Direct honesty with zero passive-aggression', 'Respecting boundaries & space'],
    bestMatches: ['ENFP', 'ENTP', 'INFJ', 'INFP'],
    challengingMatches: ['ESFP', 'ISFP'],
    communicationPrompt: 'What is a problem in the world you obsess over finding an elegant solution to?'
  },
  {
    code: 'ENFP',
    name: 'The Spark Visionary',
    archetype: 'The Free-Spirited Explorer',
    tagline: 'Brings infectious curiosity, magnetic warmth, and endless creative exploration.',
    traits: ['Charismatic', 'Curious', 'Warm', 'Spontaneous'],
    datingStyle: 'Exciting, spontaneous adventures paired with midnight philosophical dives. Thrives when allowed to be unapologetically themselves.',
    greenFlags: ['Matching playful energy', 'Being emotionally grounded', 'Celebrating unconventional ideas'],
    bestMatches: ['INTJ', 'INFJ', 'INTP', 'ENTJ'],
    challengingMatches: ['ISTJ', 'ISFJ'],
    communicationPrompt: 'If we took off right now with no itinerary, where is the first place we explore?'
  },
  {
    code: 'INFJ',
    name: 'The Soul Guardian',
    archetype: 'The Mystical Empath',
    tagline: 'Perceptive, deeply loyal, seeking rare emotional and spiritual synchronicity.',
    traits: ['Intuitive', 'Compassionate', 'Insightful', 'Selectively Social'],
    datingStyle: 'Looking for a once-in-a-lifetime connection. Can read rooms instantly and craves someone who sees beyond their quiet exterior.',
    greenFlags: ['Emotional intelligence', 'Consistent actions over sweet words', 'Appreciating quiet companionship'],
    bestMatches: ['ENTP', 'ENFP', 'INTJ', 'ENFJ'],
    challengingMatches: ['ESTP', 'ESFP'],
    communicationPrompt: 'What is something you understand about human nature that most people overlook?'
  },
  {
    code: 'INTP',
    name: 'The Logic Alchemist',
    archetype: 'The Abstract Thinker',
    tagline: 'Fascinated by theories, obscure knowledge, and calm, unpretentious companionship.',
    traits: ['Analytical', 'Objective', 'Original', 'Easygoing'],
    datingStyle: 'Low-pressure, nerdy banter with zero social posturing. Loves discussing how things work and learning together.',
    greenFlags: ['Intellectual curiosity', 'Low emotional drama', 'Enjoying comfortable silence'],
    bestMatches: ['ENTJ', 'ENFJ', 'INFJ', 'ENFP'],
    challengingMatches: ['ESFJ', 'ISFJ'],
    communicationPrompt: 'What is a rabbit hole of research you fell down recently that blew your mind?'
  },
  {
    code: 'ENTP',
    name: 'The Playful Provocateur',
    archetype: 'The Idea Catalyst',
    tagline: 'Witty, quick-tongued, and energized by spirited debates and innovative chaos.',
    traits: ['Witty', 'Adaptable', 'Unconventional', 'Charismatic'],
    datingStyle: 'Flirty, dynamic, and verbally electric. The best first date is one where you argue playfully about everything from movies to philosophy.',
    greenFlags: ['Quick wit & sarcasm', 'Ability to disagree without taking it personally', 'Spontaneous energy'],
    bestMatches: ['INFJ', 'INTJ', 'INFP', 'ENFP'],
    challengingMatches: ['ISFJ', 'ISTJ'],
    communicationPrompt: 'Tell me a controversial opinion you have that you can defend for 20 minutes.'
  },
  {
    code: 'ENFJ',
    name: 'The Magnetic Mentor',
    archetype: 'The Heart Leader',
    tagline: 'Radiates warmth, empathy, and inspires those around them to reach their highest self.',
    traits: ['Warm', 'Supportive', 'Inspiring', 'Organized'],
    datingStyle: 'Attentive and deeply committed. Remembers every detail about your dreams and loves making you feel seen and celebrated.',
    greenFlags: ['Kindness to strangers', 'Vulnerability', 'Shared desire to make an impact'],
    bestMatches: ['INFP', 'ISFP', 'INTP', 'INFJ'],
    challengingMatches: ['ISTP', 'ESTP'],
    communicationPrompt: 'What is a dream you’re working on that you don’t talk about often?'
  },
  {
    code: 'ENTJ',
    name: 'The Power Architect',
    archetype: 'The Visionary Builder',
    tagline: 'Driven, decisive, and seeking a dynamic partner to conquer life’s biggest goals with.',
    traits: ['Decisive', 'Ambitious', 'Strategic', 'Direct'],
    datingStyle: 'High-standard, power-couple dynamic. Values competence, growth mindset, and straightforward honesty.',
    greenFlags: ['Confidence without arrogance', 'Clear life vision', 'Holding your ground in debates'],
    bestMatches: ['INFP', 'INTP', 'INTJ', 'ENFP'],
    challengingMatches: ['ISFP', 'ISFJ'],
    communicationPrompt: 'What does your ideal lifestyle look like 3 years from today?'
  },
  {
    code: 'ISFP',
    name: 'The Aesthetic Soul',
    archetype: 'The Gentle Artist',
    tagline: 'Living in the sensory moment, deeply authentic, with an effortless aesthetic eye.',
    traits: ['Artistic', 'Present', 'Sensitive', 'Authentic'],
    datingStyle: 'Sensory-rich experiences (music, food, nature, art). Values actions and unspoken presence far more than grand speeches.',
    greenFlags: ['Artistic appreciation', 'Giving space to breathe', 'Gentle, calm demeanor'],
    bestMatches: ['ESFJ', 'ENFJ', 'ESTJ', 'ESFP'],
    challengingMatches: ['INTJ', 'ENTJ'],
    communicationPrompt: 'What song or album feels like a soundtrack to your current chapter of life?'
  },
  {
    code: 'ISTP',
    name: 'The Quiet Artisan',
    archetype: 'The Calm Realist',
    tagline: 'Cool-headed, hands-on, and loves practical adventures without unnecessary drama.',
    traits: ['Practical', 'Calm', 'Independent', 'Problem-Solver'],
    datingStyle: 'Actions over words. Prefers doing things together (road trips, cooking, sports) rather than texting all day.',
    greenFlags: ['Independence', 'Straightforwardness', 'Being comfortable doing activities side-by-side'],
    bestMatches: ['ESTJ', 'ESFJ', 'ENTJ', 'ISTJ'],
    challengingMatches: ['ENFJ', 'INFJ'],
    communicationPrompt: 'What is a hands-on skill or weird trick you’re surprisingly good at?'
  },
  {
    code: 'ESFP',
    name: 'The Radiance Star',
    archetype: 'The Joy Catalyst',
    tagline: 'Life of the party, bringing spontaneous laughter and vibrant energy to every room.',
    traits: ['Vibrant', 'Playful', 'Generous', 'Living in the Now'],
    datingStyle: 'Fun, spontaneous, and high-energy dates. Loves surprises, social events, and making memories right now.',
    greenFlags: ['Fun-loving attitude', 'Being open to trying new things', 'Positive social vibes'],
    bestMatches: ['ISFJ', 'ISTJ', 'ISFP', 'ESFJ'],
    challengingMatches: ['INTJ', 'INFJ'],
    communicationPrompt: 'What is the most ridiculous, fun story that happened to you in college so far?'
  },
  {
    code: 'ESTP',
    name: 'The Dynamic Thrill-Seeker',
    archetype: 'The Bold Adventurer',
    tagline: 'Action-oriented, charismatic, and thrives in high-adrenaline moments.',
    traits: ['Bold', 'Charismatic', 'Direct', 'Perceptive'],
    datingStyle: 'Direct pursuit, fast-paced dating, and exciting activities. Keeps you on your toes with unexpected spontaneous dates.',
    greenFlags: ['Boldness', 'Sense of humor', 'Ability to keep up with fast pace'],
    bestMatches: ['ISFJ', 'ISTJ', 'ESFP', 'ESTJ'],
    challengingMatches: ['INFP', 'INFJ'],
    communicationPrompt: 'What is the most spontaneous thing you’ve done on impulse that turned out amazing?'
  },
  {
    code: 'ISFJ',
    name: 'The Quiet Protector',
    archetype: 'The Devoted Anchor',
    tagline: 'Reliable, attentive, and remembers every small detail that makes you smile.',
    traits: ['Loyal', 'Considerate', 'Patient', 'Practical'],
    datingStyle: 'Thoughtful gestures, consistent communication, and creating a comfortable, safe sanctuary for two.',
    greenFlags: ['Consistency & reliability', 'Manners and thoughtfulness', 'Appreciating small efforts'],
    bestMatches: ['ESFP', 'ESTP', 'ISFP', 'ESFJ'],
    challengingMatches: ['ENTP', 'INTP'],
    communicationPrompt: 'What is your favorite comfort tradition or routine that instantly resets your mood?'
  },
  {
    code: 'ISTJ',
    name: 'The Rock-Solid Pillar',
    archetype: 'The Loyal Guardian',
    tagline: 'Dependable, steady, and stands firmly by their promises through thick and thin.',
    traits: ['Dependable', 'Honest', 'Organized', 'Committed'],
    datingStyle: 'Punctual, steady, and drama-free. Shows love through tangible support, acts of service, and unwavering loyalty.',
    greenFlags: ['Punctuality', 'Clear intentions', 'Respecting commitments'],
    bestMatches: ['ESFP', 'ESTP', 'ISFJ', 'ESTJ'],
    challengingMatches: ['ENFP', 'ENTP'],
    communicationPrompt: 'What is a personal rule or standard you never compromise on?'
  },
  {
    code: 'ESFJ',
    name: 'The Social Luminary',
    archetype: 'The Community Heart',
    tagline: 'Brings people together, creates harmony, and showers partners with heartfelt care.',
    traits: ['Caring', 'Harmonious', 'Social', 'Loyal'],
    datingStyle: 'Warm, hospitable, and inclusive. Loves planning cute dates, group hangouts, and celebrating relationship milestones.',
    greenFlags: ['Being respectful to family & friends', 'Emotional generosity', 'Active appreciation'],
    bestMatches: ['ISFP', 'ISTP', 'ISFJ', 'ESFP'],
    challengingMatches: ['INTP', 'INTJ'],
    communicationPrompt: 'What makes you feel most genuinely appreciated in a relationship?'
  },
  {
    code: 'ESTJ',
    name: 'The Steadfast Captain',
    archetype: 'The Reliable Leader',
    tagline: 'Clear, capable, and builds stable, thriving partnerships with direct communication.',
    traits: ['Organized', 'Dedicated', 'Direct', 'Protective'],
    datingStyle: 'Goal-oriented and transparent. No mind games—knows what they want and supports their partner’s life ambitions fully.',
    greenFlags: ['Clarity & reliability', 'Hard work ethic', 'Straightforward communication'],
    bestMatches: ['ISTP', 'ISFP', 'ISTJ', 'ESTP'],
    challengingMatches: ['INFP', 'INFJ'],
    communicationPrompt: 'What is a major goal you achieved through pure discipline that you’re proud of?'
  }
];

export interface CompatibilityPair {
  typeA: PersonalityType;
  typeB: PersonalityType;
  score: number;
  chemistryTier: 'Soulmate Synergy' | 'Dynamic Chemistry' | 'Complementary Balance' | 'Growth Catalyst';
  summary: string;
  strengths: string[];
  communicationTips: string[];
}

export function calculateCompatibility(codeA: string, codeB: string): CompatibilityPair {
  const normA = (codeA || '').toUpperCase().trim();
  const normB = (codeB || '').toUpperCase().trim();
  const typeA = personalityTypes.find(t => t.code === normA) || personalityTypes[0];
  const typeB = personalityTypes.find(t => t.code === normB) || personalityTypes[1];

  let score = 75;
  if (typeA.bestMatches.includes(normB)) score = 94;
  else if (typeA.challengingMatches.includes(normB)) score = 68;
  else score = 82;

  let chemistryTier: CompatibilityPair['chemistryTier'] = 'Dynamic Chemistry';
  if (score >= 90) chemistryTier = 'Soulmate Synergy';
  else if (score >= 80) chemistryTier = 'Dynamic Chemistry';
  else if (score >= 70) chemistryTier = 'Complementary Balance';
  else chemistryTier = 'Growth Catalyst';

  return {
    typeA,
    typeB,
    score,
    chemistryTier,
    summary: `${typeA.name} (${typeA.code}) and ${typeB.name} (${typeB.code}) share a ${chemistryTier.toLowerCase()} bond. While ${typeA.code} brings ${typeA.traits[0].toLowerCase()} energy, ${typeB.code} balances with ${typeB.traits[0].toLowerCase()} perspective.`,
    strengths: [
      `Mutual appreciation for authentic 1-on-1 connection`,
      `Natural balance between ${typeA.archetype} and ${typeB.archetype}`,
      `High conversational curiosity without superficial small talk`
    ],
    communicationTips: [
      `Allow ${typeA.code} time to articulate complex feelings without rushing`,
      `Create explicit moments for ${typeB.code} to share spontaneous ideas`,
      `Use Othrhalff's daily 8PM speed chats to spark low-pressure real-time banter`
    ]
  };
}
