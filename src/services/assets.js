import { API_URL } from './config.js';
import { Capacitor } from '@capacitor/core';

/**
 * ── Asset Utility ─────────────────────────────────────────────
 * Normalizes image URLs for cross-platform compatibility.
 * Specifically handles Cloudflare R2 relative paths and placeholders.
 */

export function getAssetUrl(path) {
    if (!path) {
        // Return a stable placeholder if no path is provided
        return 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=400';
    }

    // 1. If it's already a full URL (http/https), return as is
    if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
        return path;
    }

    // 2. If it's a relative R2 path (starts with /r2/ or r2/)
    if (path.startsWith('/r2/') || path.startsWith('r2/')) {
        const cleanPath = path.startsWith('/') ? path : `/${path}`;
        return `${API_URL}${cleanPath}`;
    }

    // 3. If it's a standard relative asset (like /logo.svg or assets/...)
    // On Capacitor, these are served from the local bundle.
    // On Web, they are relative to the origin.
    if (path.startsWith('/')) {
        if (Capacitor.isNativePlatform()) {
            // For native, we might need to point to the production server for some assets 
            // if they aren't bundled, but usually /logo.svg is bundled.
            // However, to be safe for user-uploaded content that might not have /r2/ prefix:
            return `${API_URL}${path}`;
        }
        return path;
    }

    // Default: try to prepend API_URL if it looks like a path
    return `${API_URL}/${path}`;
}

/**
 * ── getAvatarUrl ──
 * Helper for user profile photos with a fallback.
 */
export function getAvatarUrl(path, name = 'User') {
    if (!path) {
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e293b&color=fff&bold=true`;
    }
    return getAssetUrl(path);
}
