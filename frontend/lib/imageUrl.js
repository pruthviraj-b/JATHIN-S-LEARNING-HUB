export function getProxiedImageUrl(url) {
    if (!url) return null;

    // If it's an absolute URL
    if (url.startsWith('http') || url.startsWith('https')) {
        // If it points to our local backend (localhost:4000), strip the origin to make it relative.
        // This allows the frontend proxy (next.config.js) to handle it relative to the correct origin (localhost:3000 or network IP).
        if (url.includes('localhost:4000')) {
            return url.replace('http://localhost:4000', '');
        }

        // Also handle https if it was somehow saved that way
        if (url.includes('https://localhost:4000')) {
            return url.replace('https://localhost:4000', '');
        }

        // If it points to frontend localhost:3000 explicitly, make it relative too
        if (url.includes('localhost:3000')) {
            return url.replace('http://localhost:3000', '').replace('https://localhost:3000', '');
        }

        // Return external URLs (Cloudinary, etc.) as is
        return url;
    }

    // If it's already relative (starts with /), return as is
    return url;
}
