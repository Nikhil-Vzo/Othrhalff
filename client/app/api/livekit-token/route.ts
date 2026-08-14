import { AccessToken } from 'livekit-server-sdk';
import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const room = searchParams.get('room') || 'playground-global-voice';
    const identity = searchParams.get('identity') || `user-${Math.random().toString(36).substring(2, 11)}`;
    const name = searchParams.get('name') || 'Campus Student';

    const apiKey = process.env.LIVEKIT_API_KEY;
    const apiSecret = process.env.LIVEKIT_API_SECRET;
    const livekitUrl = process.env.LIVEKIT_URL || process.env.NEXT_PUBLIC_LIVEKIT_URL;

    if (!apiKey || !apiSecret) {
      return NextResponse.json(
        { error: 'LiveKit API Key or Secret not configured in environment variables' },
        { status: 500 }
      );
    }

    const at = new AccessToken(apiKey, apiSecret, {
      identity,
      name,
      ttl: '4h',
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
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
