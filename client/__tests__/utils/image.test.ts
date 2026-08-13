import { getOptimizedUrl, DEFAULT_AVATAR, handleImageError } from '../../src/utils/image';

describe('getOptimizedUrl', () => {
  it('returns DEFAULT_AVATAR if url is null or undefined or empty', () => {
    expect(getOptimizedUrl(null)).toBe(DEFAULT_AVATAR);
    expect(getOptimizedUrl(undefined)).toBe(DEFAULT_AVATAR);
    expect(getOptimizedUrl('')).toBe(DEFAULT_AVATAR);
    expect(getOptimizedUrl('   ')).toBe(DEFAULT_AVATAR);
  });

  it('returns the original url if it does not contain supabase storage URL', () => {
    const externalUrl = 'https://images.unsplash.com/photo-12345';
    expect(getOptimizedUrl(externalUrl)).toBe(externalUrl);
  });

  it('returns base64 data URLs as-is', () => {
    const base64Url = 'data:image/jpeg;base64,12345';
    expect(getOptimizedUrl(base64Url)).toBe(base64Url);
  });

  it('preserves clean public object URLs for standard Supabase storage', () => {
    const supabaseUrl = 'https://xyz.supabase.co/storage/v1/object/public/avatars/user1.png';
    expect(getOptimizedUrl(supabaseUrl)).toBe(supabaseUrl);
  });

  it('appends optimization parameters to Supabase render/image URL using "?" if no query parameters exist', () => {
    const renderUrl = 'https://xyz.supabase.co/storage/v1/render/image/public/avatars/user1.png';
    const expected = `${renderUrl}?width=100&quality=100&resize=cover`;
    expect(getOptimizedUrl(renderUrl)).toBe(expected);
  });

  it('appends optimization parameters to Supabase render/image URL using "&" if query parameters exist', () => {
    const renderUrl = 'https://xyz.supabase.co/storage/v1/render/image/public/avatars/user1.png?token=123';
    const expected = `${renderUrl}&width=100&quality=100&resize=cover`;
    expect(getOptimizedUrl(renderUrl)).toBe(expected);
  });
});

describe('handleImageError', () => {
  it('sets image target src to fallbackUrl when an error occurs', () => {
    const mockImage = { src: 'https://broken-link.com/image.png' };
    const mockEvent = { currentTarget: mockImage } as any;

    handleImageError(mockEvent);
    expect(mockImage.src).toBe(DEFAULT_AVATAR);
  });

  it('does not re-set src if target src is already fallbackUrl', () => {
    const mockImage = { src: DEFAULT_AVATAR };
    const mockEvent = { currentTarget: mockImage } as any;

    handleImageError(mockEvent);
    expect(mockImage.src).toBe(DEFAULT_AVATAR);
  });
});
