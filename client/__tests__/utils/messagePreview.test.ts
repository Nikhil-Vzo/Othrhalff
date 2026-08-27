import { formatMessageSnippet } from '../../src/utils/messagePreview';

describe('formatMessageSnippet', () => {
  it('formats cinema invite JSON payload into clean preview', () => {
    const raw = '[INVITE:v1] {"action":"join_room","type":"cinema","room":"cinema_NIKHIL_EEQ-374","url":"/sparx/cinema?room=cinema_NIKHIL_EEQ-374&private=true","message":"Cinema Date"}';
    expect(formatMessageSnippet(raw)).toBe('🎬 Cinema Date Invite');
  });

  it('formats system invite payload into clean preview', () => {
    const raw = '[SYSTEM] [INVITE:v1] {"action":"join_room","type":"music","room":"music_123","url":"/sparx/music"}';
    expect(formatMessageSnippet(raw)).toBe('🎵 Music Date Invite');
  });

  it('formats game payloads into clean previews', () => {
    const game2tl = '[GAME:2TL:v1] {"state":"pending"}';
    expect(formatMessageSnippet(game2tl)).toBe('🎲 Two Truths & A Lie Game');

    const gameWyr = '[GAME:WYR:v1] {"question":"A or B?"}';
    expect(formatMessageSnippet(gameWyr)).toBe('🤔 Would You Rather Game');
  });

  it('formats voice notes and images', () => {
    expect(formatMessageSnippet('[VOICE_NOTE] blob:http://...')).toBe('🎤 Voice Message');
    expect(formatMessageSnippet('[IMAGE] https://supabase...')).toBe('📷 Photo');
  });

  it('handles null, empty, and new match strings', () => {
    expect(formatMessageSnippet(null)).toBe('Say hi! 👋');
    expect(formatMessageSnippet('')).toBe('Say hi! 👋');
    expect(formatMessageSnippet('New Match!')).toBe('Say hi! 👋');
  });

  it('preserves normal human chat text', () => {
    expect(formatMessageSnippet('Hey, are you free this evening?')).toBe('Hey, are you free this evening?');
  });
});
