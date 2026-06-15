import { getOptimizedUrl } from '../../src/utils/image';

describe('getOptimizedUrl', () => {
  it('returns an empty string if url is null or undefined', () => {
    expect(getOptimizedUrl(null)).toBe('');
    expect(getOptimizedUrl(undefined)).toBe('');
  });

  it('returns the original url if it does not contain the word "supabase"', () => {
    const externalUrl = 'https://images.unsplash.com/photo-12345';
    expect(getOptimizedUrl(externalUrl)).toBe(externalUrl);

    const emptyUrl = '';
    expect(getOptimizedUrl(emptyUrl)).toBe('');
  });

  it('appends optimization parameters to a Supabase URL using "?" if no query parameters exist', () => {
    const supabaseUrl = 'https://xyz.supabase.co/storage/v1/object/public/avatars/user1.png';
    const expected = `${supabaseUrl}?width=100&quality=60&resize=cover`;
    
    expect(getOptimizedUrl(supabaseUrl)).toBe(expected);
  });

  it('appends optimization parameters to a Supabase URL using "&" if query parameters already exist', () => {
    const supabaseUrl = 'https://xyz.supabase.co/storage/v1/object/public/avatars/user1.png?token=123';
    const expected = `${supabaseUrl}&width=100&quality=60&resize=cover`;

    expect(getOptimizedUrl(supabaseUrl)).toBe(expected);
  });

  it('respects the custom width parameter when provided', () => {
    const supabaseUrl = 'https://xyz.supabase.co/storage/v1/object/public/avatars/user1.png';
    const expected = `${supabaseUrl}?width=350&quality=60&resize=cover`;

    expect(getOptimizedUrl(supabaseUrl, 350)).toBe(expected);
  });
});
