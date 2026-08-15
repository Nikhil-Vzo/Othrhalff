/**
 * Returns ICE servers for WebRTC peer connections.
 * Uses high-availability global STUN servers (Google, Twilio, Cloudflare)
 * and automatically injects TURN relay servers if configured via env variables.
 */
export function getIceServers(): RTCIceServer[] {
    const iceServers: RTCIceServer[] = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:global.stun.twilio.com:3478' },
        { urls: 'stun:stun.cloudflare.com:3478' },
    ];

    const turnUrl = process.env.NEXT_PUBLIC_TURN_URL;
    const turnUsername = process.env.NEXT_PUBLIC_TURN_USERNAME;
    const turnCredential = process.env.NEXT_PUBLIC_TURN_CREDENTIAL;

    if (turnUrl && turnUsername && turnCredential) {
        iceServers.push({
            urls: turnUrl,
            username: turnUsername,
            credential: turnCredential,
        });
    }

    return iceServers;
}
