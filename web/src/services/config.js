import { Capacitor } from '@capacitor/core';

/**
 * ── Centralized API Config ───────────────────────────────────
 * Production API URL for Cloudflare Worker.
 * For native (Capacitor) builds we always use production because
 * the mobile app cannot reach localhost/10.0.2.2 unless a local
 * dev server is explicitly started.
 *
 * To use a local Wrangler Worker, set VITE_API_URL in your .env file:
 *   VITE_API_URL=http://localhost:8787
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

    // Browser localhost still uses production by default. Otherwise Vite dev
    // prints net::ERR_CONNECTION_REFUSED for every background sync request
    // when Wrangler is not running on localhost:8787.
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') return PRODUCTION_API;

    // Browser: any other domain → same origin (production worker handles all routes)
    return window.location.origin;
}

const API_URL = getApiUrl();

export { API_URL };
