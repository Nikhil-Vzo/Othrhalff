export interface TwoTruthsLieState {
  creatorId: string;
  options: string[]; // 3 options in shuffled order
  lieHash: string; // Hash of the lie text to prevent devtools cheating
  guess?: string; // The option the partner guessed
  guessedCorrectly?: boolean; // Whether the partner guessed correctly
  status: 'setup' | 'active' | 'completed';
}

export interface WouldYouRatherState {
  question: string;
  optionA: string;
  optionB: string;
  votes: { [userId: string]: 'A' | 'B' };
}

export interface WYRTemplate {
  question: string;
  optionA: string;
  optionB: string;
}

export const WYR_TEMPLATES: WYRTemplate[] = [
  {
    question: "Would you rather...",
    optionA: "Admit to your crush that you stalked their profile from 2018",
    optionB: "Send a screenshot of the chat TO the person you're gossiping about"
  },
  {
    question: "Would you rather...",
    optionA: "Date someone who claps their hands when they laugh",
    optionB: "Date someone who types 'u' instead of 'you' every single time"
  },
  {
    question: "Would you rather...",
    optionA: "Accidentally like your ex's photo from 3 years ago at 3 AM",
    optionB: "Send a risky text meant for your best friend to your mom"
  },
  {
    question: "Would you rather...",
    optionA: "Have a partner who is a 10 but still sleeps with a nightlight",
    optionB: "Have a partner who is a 6 but makes you laugh until you cry"
  },
  {
    question: "Would you rather...",
    optionA: "Get left on 'Read' by your crush for 3 days",
    optionB: "Get left on 'Delivered' for 3 weeks"
  },
  {
    question: "Would you rather...",
    optionA: "Show your partner your entire internet search history",
    optionB: "Show your partner all your saved memes"
  },
  {
    question: "Would you rather...",
    optionA: "Have a first date where they forget their wallet",
    optionB: "Have a first date where they bring their mom along"
  },
  {
    question: "Would you rather...",
    optionA: "Only date people who use light mode on their phone",
    optionB: "Only date people who listen to podcasts at 2x speed"
  },
  {
    question: "Would you rather...",
    optionA: "Get ghosted after an amazing first date",
    optionB: "Get slow-faded over 3 months of dry texts"
  },
  {
    question: "Would you rather...",
    optionA: "Wear your pajamas to a formal final-year presentation",
    optionB: "Accidentally sit in the front row of the wrong lecture for the whole class"
  }
];

// Helper function to simple-hash a string
export const hashString = (str: string): string => {
  let hash = 0;
  const cleanStr = str.trim().toLowerCase();
  for (let i = 0; i < cleanStr.length; i++) {
    hash = (hash << 5) - hash + cleanStr.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
};

// Helper function to shuffle an array
export const shuffleArray = <T>(array: T[]): T[] => {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};
