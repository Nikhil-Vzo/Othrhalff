import { MatchProfile } from "../types";

/**
 * Gemini AI Service (Secured)
 * All generative AI calls are proxied through the server-side /api/ai route.
 * The Gemini API key remains strictly server-side and is never exposed in browser bundles.
 */

export const generateIceBreaker = async (
  myInterests: string[],
  theirProfile: MatchProfile
): Promise<string> => {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'icebreaker',
        myInterests,
        theirProfile: {
          anonymousId: theirProfile.anonymousId,
          branch: theirProfile.branch,
          interests: theirProfile.interests,
        },
      }),
    });

    if (!res.ok) {
      return "Hey! Looks like we have some common interests.";
    }

    const data = await res.json();
    return data.text || "Hey! What's your favorite thing about your major?";
  } catch (error) {
    console.error("Gemini Service Error:", error);
    return "Hey! What's your favorite thing about your major?";
  }
};

export const checkCompatibility = async (
  myInterests: string[],
  theirProfile: MatchProfile
): Promise<string> => {
  try {
    const res = await fetch('/api/ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'compatibility',
        myInterests,
        theirProfile: {
          branch: theirProfile.branch,
          interests: theirProfile.interests,
        },
      }),
    });

    if (!res.ok) {
      return "Compatibility analysis unavailable.";
    }

    const data = await res.json();
    return data.text || "You both seem to have unique tastes!";
  } catch (error) {
    console.error("Gemini Compatibility Error:", error);
    return "You both seem to have unique tastes!";
  }
};