import { Capacitor } from '@capacitor/core';

/**
 * ── Centralized API Config ───────────────────────────────────
 * Production API URL for Cloudflare Worker.
 * For native (Capacitor) builds we always use production because
 * the mobile app cannot reach localhost/10.0.2.2 unless a local
 * dev server is explicitly started.
 *
 * Local Vite dev uses /api so vite.config.js can proxy requests to
 * the local Wrangler Worker on 127.0.0.1:8787.
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

    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        if (window.location.port === '8787') return window.location.origin;
        return '/api';
    }

    // Browser: any other domain → same origin (production worker handles all routes)
    return window.location.origin;
}

const API_URL = getApiUrl();

export { API_URL };
