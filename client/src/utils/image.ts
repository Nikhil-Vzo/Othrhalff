export const getOptimizedUrl = (url: string | undefined | null, width: number = 100) => {
    if (!url || !url.includes('supabase')) return url || ''; // Return original if not supabase or empty

    const isAvatar = url.includes('/images/') || url.toLowerCase().includes('avatar');
    const quality = isAvatar ? 100 : 70;

    // Supabase Storage Transformation URL
    // If it already has query params, append using &
    const separator = url.includes('?') ? '&' : '?';
    return `${url}${separator}width=${width}&quality=${quality}&resize=cover`;
};
