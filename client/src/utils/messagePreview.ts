/**
 * Cleans up and formats raw message payloads into human-readable snippet previews
 * for chat lists, notifications, and conversation previews.
 */
export function formatMessageSnippet(rawText: string | null | undefined): string {
  if (!rawText) return 'Say hi! 👋';
  const text = String(rawText).trim();
  if (!text || text === 'New Match!') return 'Say hi! 👋';

  // 1. Virtual Date & Activity Invites: [INVITE:v1]
  if (text.includes('[INVITE:v1]')) {
    try {
      const jsonStart = text.indexOf('{');
      if (jsonStart !== -1) {
        const payload = JSON.parse(text.slice(jsonStart));
        if (payload.type === 'cinema') {
          return '🎬 Cinema Date Invite';
        }
        if (payload.type === 'music') {
          return '🎵 Music Date Invite';
        }
        if (payload.type === 'sparx') {
          return '⚡ Sparx Activity Invite';
        }
        if (payload.message) {
          return `🎟️ ${payload.message}`;
        }
      }
    } catch {
      // JSON parse fallback
    }
    return '🎟️ Invited you to a Date';
  }

  // 2. Interactive Games
  if (text.startsWith('[GAME:2TL:v1]')) {
    return '🎲 Two Truths & A Lie Game';
  }
  if (text.startsWith('[GAME:WYR:v1]')) {
    return '🤔 Would You Rather Game';
  }

  // 3. System messages
  if (text.startsWith('[SYSTEM]')) {
    const cleaned = text.replace('[SYSTEM]', '').trim();
    return cleaned || 'System message';
  }

  // 4. Voice Notes / Audio
  if (text.startsWith('[VOICE_NOTE]') || text.startsWith('🎤') || text.includes('audio/ogg') || text.includes('audio/webm')) {
    return '🎤 Voice Message';
  }

  // 5. Photos & Images
  if (text.startsWith('[IMAGE]') || text.startsWith('📷')) {
    return '📷 Photo';
  }

  // 6. Audio / Phone Calls
  if (text.startsWith('📞') || text.includes('Call ended') || text.includes('Missed call')) {
    return text;
  }

  return text;
}
