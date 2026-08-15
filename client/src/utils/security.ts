/**
 * Hashes a string using native Web Crypto SHA-256
 */
export async function hashPasscode(passcode: string): Promise<string> {
    if (!passcode) return '';
    try {
        const encoder = new TextEncoder();
        const data = encoder.encode(passcode.trim());
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
        // Fallback for non-crypto environments
        let hash = 0;
        for (let i = 0; i < passcode.length; i++) {
            const char = passcode.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        return `hash_${Math.abs(hash)}`;
    }
}
