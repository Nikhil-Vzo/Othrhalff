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
    optionA: "Take a 9:00 AM class on Saturday",
    optionB: "Study in the library basement for 24 hours straight"
  },
  {
    question: "Would you rather...",
    optionA: "Always text in all-caps",
    optionB: "Only reply using reaction emojis"
  },
  {
    question: "Would you rather...",
    optionA: "Get a free unlimited coffee pass at the campus cafe",
    optionB: "Get a guaranteed front-row parking spot forever"
  },
  {
    question: "Would you rather...",
    optionA: "Skip all lectures and only cram the night before",
    optionB: "Attend every lecture but never take any notes"
  },
  {
    question: "Would you rather...",
    optionA: "Accidentally text a complaint about a professor to that professor",
    optionB: "Accidentally 'Reply-All' to a university-wide email list"
  },
  {
    question: "Would you rather...",
    optionA: "Have exams that are open-book but extremely hard",
    optionB: "Have exams that are closed-book but straightforward"
  },
  {
    question: "Would you rather...",
    optionA: "Always eat campus dining hall food",
    optionB: "Cook all your meals in a tiny dorm room microwave"
  },
  {
    question: "Would you rather...",
    optionA: "Be 15 minutes late to every single lecture",
    optionB: "Be 45 minutes early to every single lecture"
  },
  {
    question: "Would you rather...",
    optionA: "Have your phone battery permanently capped at 15%",
    optionB: "Only be able to use campus Wi-Fi that drops every 10 minutes"
  },
  {
    question: "Would you rather...",
    optionA: "Do a group project where you do all the work alone",
    optionB: "Do a group project where no one communicates and you present live"
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
