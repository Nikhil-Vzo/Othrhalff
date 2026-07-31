export const DEFAULT_AVATAR = 'https://api.dicebear.com/9.x/thumbs/svg?seed=Felix';

export const getOptimizedUrl = (url: string | undefined | null, width: number = 100): string => {
    if (!url || typeof url !== 'string' || !url.trim()) {
        return DEFAULT_AVATAR;
    }

    const trimmed = url.trim();
    if (trimmed.startsWith('data:')) return trimmed; // Return base64 data URLs as-is

    // Handle Supabase Storage URLs safely
    if (trimmed.includes('supabase') && trimmed.includes('/storage/v1/')) {
        if (trimmed.includes('/storage/v1/render/image/')) {
            const separator = trimmed.includes('?') ? '&' : '?';
            return `${trimmed}${separator}width=${width}&quality=100&resize=cover`;
        }
        return trimmed; // Return clean object URL without appending breaking query params
    }

    return trimmed;
};

export const handleImageError = (
    e: React.SyntheticEvent<HTMLImageElement, Event>,
    fallbackUrl: string = DEFAULT_AVATAR
) => {
    const target = e.currentTarget;
    if (target.src !== fallbackUrl) {
        target.src = fallbackUrl;
    }
};
