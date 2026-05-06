import { Capacitor } from '@capacitor/core';

/**
 * ── Centralized API Config ───────────────────────────────────
 * Production API URL for Cloudflare Worker.
 * For native (Capacitor) builds we always use production because
 * the mobile app cannot reach localhost/10.0.2.2 unless a local
 * dev server is explicitly started.
 *
 * To override for local dev, set VITE_API_URL in your .env file:
 *   VITE_API_URL=http://10.0.2.2:8787
 */

const PRODUCTION_API = 'https://roommategroups.vibhurastogi98.workers.dev';

function getApiUrl() {
    // Explicit override via .env takes highest priority (for local dev)
    const envUrl = import.meta.env.VITE_API_URL;
    if (envUrl) return envUrl;

    // Native platform (Android / iOS) → always use production
    if (Capacitor.isNativePlatform()) {
        return PRODUCTION_API;
    }

    // Browser: localhost → local Wrangler dev server
    if (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
    ) {
        return 'http://localhost:8787';
    }

    // Browser: any other domain → same origin (production worker handles all routes)
    return window.location.origin;
}

const API_URL = getApiUrl();
console.log(
    `[CONFIG] API_URL: ${API_URL}`,
    `| Platform: ${Capacitor.getPlatform()}`,
    `| Native: ${Capacitor.isNativePlatform()}`
);

export { API_URL };
