import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '../_lib/rateLimit';

export const dynamic = 'force-dynamic';

// In-memory cache for fast video ID lookups with maximum bounds
const ytCache = new Map<string, { videoId: string; timestamp: number }>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours
const MAX_CACHE_ENTRIES = 1000; // Prevent memory exhaustion / DoS

function setSafeCache(key: string, videoId: string) {
    if (ytCache.size >= MAX_CACHE_ENTRIES) {
        // Evict oldest entry (FIFO)
        const oldestKey = ytCache.keys().next().value;
        if (oldestKey) ytCache.delete(oldestKey);
    }
    ytCache.set(key, { videoId, timestamp: Date.now() });
}

function parseDurationToSec(text: string): number {
    if (!text) return 0;
    const parts = text.split(':').map(Number);
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2) return parts[0] * 60 + parts[1];
    return 0;
}

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const rawQuery = searchParams.get('q');
    const rawDur = parseFloat(searchParams.get('dur') || '0');

    if (!rawQuery || rawQuery.trim().length === 0) {
        return NextResponse.json({ error: 'Missing search query' }, { status: 400 });
    }

    // Input sanitization: remove potential CRLF or injection characters and clamp length
    const cleanQuery = rawQuery.replace(/[^\w\s\-\.,'’]/gi, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
    const targetDur = Math.min(7200, Math.max(0, isNaN(rawDur) ? 0 : rawDur));
    const cacheKey = `${cleanQuery.toLowerCase()}_${targetDur ? Math.round(targetDur) : ''}`;

    // 1. Check in-memory cache
    const cached = ytCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL_MS)) {
        return NextResponse.json({ videoId: cached.videoId, source: 'cache' });
    }

    // 2. Rate limit (60 searches per minute per IP)
    const rateLimit = checkRateLimit(req, 60, 60, 'yt_search');
    if (!rateLimit.success) {
        return NextResponse.json(
            { error: 'Rate limit exceeded. Please wait a moment.' },
            { status: 429 }
        );
    }

    // 3. Fetch with strict timeout controller (6s) to prevent connection hanging
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000);

    try {
        const searchSuffix = targetDur > 180 ? ' full song video' : ' official music video';
        const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanQuery + searchSuffix)}`;
        const res = await fetch(searchUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
                'Accept-Language': 'en-US,en;q=0.9',
            },
            signal: controller.signal,
            next: { revalidate: 3600 }
        });
        clearTimeout(timeoutId);

        if (!res.ok) {
            return NextResponse.json({ error: 'Failed to search YouTube' }, { status: 502 });
        }

        const html = await res.text();

        // Parse video items with lengthText to match closest audio duration
        const regex = /"videoRenderer":\{"videoId":"([a-zA-Z0-9_-]{11})".*?"title":\{"runs":\[\{"text":"(.*?)"\}.*?"lengthText":\{.*?"simpleText":"(.*?)"\}/g;
        let match;
        const candidates: { videoId: string; title: string; durSec: number; diff: number }[] = [];

        while ((match = regex.exec(html)) !== null) {
            const videoId = match[1];
            const title = match[2] || '';
            const durStr = match[3] || '';
            const durSec = parseDurationToSec(durStr);
            // Ignore shorts/teasers under 70s if target audio is longer than 90s
            if (targetDur > 90 && durSec > 0 && durSec < 70) continue;
            // Ignore 1+ hour full movie uploads if target is under 15 minutes
            if (targetDur < 900 && durSec > 1800) continue;
            const diff = targetDur > 0 && durSec > 0 ? Math.abs(durSec - targetDur) : 0;
            candidates.push({ videoId, title, durSec, diff });
        }

        if (candidates.length > 0) {
            if (targetDur > 0) {
                candidates.sort((a, b) => a.diff - b.diff);
            }
            const best = candidates[0];
            setSafeCache(cacheKey, best.videoId);
            return NextResponse.json({ videoId: best.videoId, source: 'live', diff: best.diff });
        }

        // Fallback: first watch?v= match
        const simpleMatch = html.match(/\/watch\?v=([a-zA-Z0-9_-]{11})/);
        if (simpleMatch && simpleMatch[1]) {
            const videoId = simpleMatch[1];
            setSafeCache(cacheKey, videoId);
            return NextResponse.json({ videoId, source: 'fallback_simple' });
        }

        return NextResponse.json({ videoId: null, message: 'No video found' }, { status: 404 });
    } catch (err: any) {
        console.error('YouTube search route error:', err);
        return NextResponse.json({ error: 'Internal error resolving YouTube video' }, { status: 500 });
    }
}
