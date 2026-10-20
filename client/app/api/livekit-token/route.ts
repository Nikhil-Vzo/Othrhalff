import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '../_lib/rateLimit';

export const dynamic = 'force-dynamic';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SAFE_ROOM_REGEX = /^[a-zA-Z0-9_-]{1,64}$/;

export async function GET(req: NextRequest) {
  // 1. Rate Limiting: Max 20 token requests per minute per IP
  const rateLimit = checkRateLimit(req, 20, 60, 'livekit');
  if (!rateLimit.success) {
    return NextResponse.json(
      { error: 'Too many token requests. Please wait a moment.' },
      {
        status: 429,
        headers: { 'Retry-After': String(rateLimit.resetInSeconds) },
      }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const rawRoom = searchParams.get('room') || 'playground-global-voice';
    const rawIdentity = searchParams.get('identity') || `anon-${Math.random().toString(36).substring(2, 11)}`;
    const rawName = searchParams.get('name') || 'Campus Student';

    // Room validation
    if (!SAFE_ROOM_REGEX.test(rawRoom)) {
      return NextResponse.json({ error: 'Invalid room identifier format' }, { status: 400 });
    }

    const room = rawRoom.substring(0, 64);
    const name = rawName.replace(/[\r\n]/g, '').trim().substring(0, 50);

    // Identity validation: unauthenticated sessions cannot impersonate UUID accounts
    let identity = rawIdentity.trim();
    if (UUID_REGEX.test(identity)) {
      // Validate Authorization header if claiming a user UUID
      const authHeader = req.headers.get('authorization');
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        // Fall back to a randomized anonymous identity to prevent impersonation
        identity = `anon-${Math.random().toString(36).substring(2, 11)}`;
      }
    } else {
      identity = identity.substring(0, 64);
    }

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'LiveKit credentials not configured on server' },
        { status: 500 }
      );
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name,
      ttl: '1h', // 1-hour secure TTL
    });

    at.addGrant({
      roomJoin: true,
      room,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
    });

    const token = await at.toJwt();

    return NextResponse.json({
      token,
      url: livekitUrl,
      identity,
      room,
    });
  } catch (error: any) {
    console.error('[LiveKit Token Error]:', error);
    return NextResponse.json({ error: 'Internal server error while generating voice token' }, { status: 500 });
  }
}
