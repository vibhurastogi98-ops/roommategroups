import { API_URL } from './config.js';
import { Capacitor } from '@capacitor/core';

/**
 * ── Asset Utility ─────────────────────────────────────────────
 * Normalizes image URLs for cross-platform compatibility.
 * Specifically handles Cloudflare R2 relative paths and placeholders.
 */

export function getAssetUrl(path) {
    if (!path) {
        return 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=400';
    }

    // If it's an object with a url/src property (some DB records store images as objects)
    if (typeof path === 'object') {
        const inner = path.url || path.src || path.path || null;
        return getAssetUrl(inner);
    }

    // Coerce to string for safety
    const str = String(path);

    // 1. If it's already a full URL (http/https), return as is
    if (str.startsWith('http://') || str.startsWith('https://') || str.startsWith('data:')) {
        return str;
    }

    // 2. If it's a relative R2 path (starts with /r2/ or r2/)
    if (str.startsWith('/r2/') || str.startsWith('r2/')) {
        const cleanPath = str.startsWith('/') ? str : `/${str}`;
        return `${API_URL}${cleanPath}`;
    }

    // 3. If it's a standard relative asset (like /logo.svg or assets/...)
    if (str.startsWith('/')) {
        if (Capacitor.isNativePlatform()) {
            return `${API_URL}${str}`;
        }
        return str;
    }

    // Default: try to prepend API_URL if it looks like a path
    return `${API_URL}/${str}`;
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
