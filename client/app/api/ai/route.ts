import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';
import { checkRateLimit } from '../_lib/rateLimit';

export const dynamic = 'force-dynamic';

function getAiClient() {
  const apiKey =
    process.env.GEMINI_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    process.env.VITE_GEMINI_API_KEY ||
    '';

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null;
  }
  return new GoogleGenAI({ apiKey });
}

function sanitizeText(input: unknown, maxLen = 100): string {
  if (typeof input !== 'string') return '';
  return input.replace(/[^\w\s.,!?-]/gi, '').trim().substring(0, maxLen);
}

function sanitizeInterests(arr: unknown): string[] {
  if (!Array.isArray(arr)) return [];
  return arr
    .map(i => sanitizeText(i, 40))
    .filter(Boolean)
    .slice(0, 10);
}

export async function POST(req: NextRequest) {
  // 1. Rate Limiting: 15 AI requests per minute per IP
  const rateLimit = checkRateLimit(req, 15, 60, 'ai');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many AI requests. Please slow down.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.resetInSeconds) },
      }
    );
  }

  try {
    const body = await req.json();
    const { type, myInterests, theirProfile } = body;

    const sanitizedMyInterests = sanitizeInterests(myInterests);
    const sanitizedTheirBranch = sanitizeText(theirProfile?.branch || 'General', 50);
    const sanitizedTheirInterests = sanitizeInterests(theirProfile?.interests);
    const sanitizedTheirAnonId = sanitizeText(theirProfile?.anonymousId || 'User', 30);

    const ai = getAiClient();
    if (!ai) {
      if (type === 'compatibility') {
        return NextResponse.json({ text: 'Compatibility analysis is temporarily offline.' });
      }
      return NextResponse.json({ text: 'Hey! Looks like we have some common interests.' });
    }

    if (type === 'icebreaker') {
      const prompt = `
        I am an anonymous student (Interests: ${sanitizedMyInterests.join(', ')}).
        I just matched with another student (ID: ${sanitizedTheirAnonId}, Branch: ${sanitizedTheirBranch}, Interests: ${sanitizedTheirInterests.join(', ')}).
        
        Generate a short, fun, and safe ice breaker message I could send to start the conversation.
        Keep it under 30 words. No hashtags.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text?.trim() || "Hey! What's your favorite thing about your campus?";
      return NextResponse.json({ text });
    }

    if (type === 'compatibility') {
      const prompt = `
        Analyze the compatibility between two students based on interests.
        Student A: ${sanitizedMyInterests.join(', ')}
        Student B (${sanitizedTheirBranch}): ${sanitizedTheirInterests.join(', ')}
        
        Give a 1-sentence fun summary of why they might get along.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      const text = response.text?.trim() || 'You both seem to have unique tastes and vibrant hobbies!';
      return NextResponse.json({ text });
    }

    return NextResponse.json({ error: 'Invalid AI request type' }, { status: 400 });
  } catch (error: any) {
    console.error('[AI Route Error]:', error);
    return NextResponse.json(
      { text: "Hey! What's your favorite spot on campus?", error: error.message },
      { status: 200 }
    );
  }
}
