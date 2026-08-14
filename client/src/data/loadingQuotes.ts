export const loadingQuotes = [
    "Patience is the key to the heart (personal experience!).",
    "Good things come to those who wait.",
    "Searching for your other half across the crowd...",
    "A real connection is always worth the wait.",
    "Connecting paths, one conversation at a time.",
    "Your story is just getting started.",
    "Destiny is never late, just taking the scenic route.",
    "Trust the timing, your person is out there.",
    "Sometimes what you're looking for comes when you least expect it.",
    "Two halves finding their perfect match.",
    "Magic happens when you least expect it.",
    "Finding someone who matches your energy...",
    "Finding someone who matches your chaos...",
    "The best bonds start with a simple vibe check.",
    "Every great connection starts with a simple hello."
];

let lastIndex = -1;

export const getRandomQuote = (): string => {
    if (loadingQuotes.length <= 1) {
        return loadingQuotes[0] || "";
    }
    let newIndex = lastIndex;
    while (newIndex === lastIndex) {
        newIndex = Math.floor(Math.random() * loadingQuotes.length);
    }
    lastIndex = newIndex;
    return loadingQuotes[newIndex];
};

