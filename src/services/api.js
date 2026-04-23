/**
 * ── API Service (Connects to Hono Backend) ───────────────────
 * Handles communication with the Cloudflare Worker / D1 API.
 * All write operations (create/update/delete) sync to D1 so
 * changes made in the Admin panel are visible on every device.
 */

const API_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:8787'
    : window.location.origin;

async function req(method, path, data, silent = false) {
    try {
        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (data !== undefined) opts.body = JSON.stringify(data);
        
        // Add cache-busting to GET requests to ensure we always get fresh data from D1
        const url = method === 'GET' 
            ? `${API_URL}${path}${path.includes('?') ? '&' : '?'}_t=${Date.now()}`
            : `${API_URL}${path}`;
            
        const res = await fetch(url, opts);
        if (!res.ok) throw new Error(`${method} ${path} → ${res.status} ${res.statusText}`);
        return await res.json();
    } catch (err) {
        if (!silent) console.error(`[API ${method}] ${path}:`, err);
        throw err;
    }
}

export const api = {
    // ── Generic helpers ──────────────────────────────────────
    get:    (path, silent = false) => req('GET',    path, undefined, silent),
    post:   (path, data)           => req('POST',   path, data),
    put:    (path, data)           => req('PUT',    path, data),
    delete: (path)                 => req('DELETE', path),

    // ── Users ────────────────────────────────────────────────
    getUsers:     ()         => req('GET',  '/users'),
    createUser:   (data)     => req('POST', '/users', data),

    // ── Listings ─────────────────────────────────────────────
    getListings:    ()       => req('GET',    '/listings'),
    saveListing:    (item)   => req('POST',   '/listings', item),
    updateListing:  (id, d)  => req('PUT',    `/listings/${id}`, d),
    deleteListing:  (id)     => req('DELETE', `/listings/${id}`),

    // ── Cities ───────────────────────────────────────────────
    getCities:   ()          => req('GET',    '/cities'),
    saveCity:    (item)      => req('POST',   '/cities', item),
    updateCity:  (id, d)     => req('PUT',    `/cities/${id}`, d),
    deleteCity:  (id)        => req('DELETE', `/cities/${id}`),

    // ── Posts ────────────────────────────────────────────────
    getPosts:    ()          => req('GET',    '/posts'),
    savePost:    (item)      => req('POST',   '/posts', item),
    updatePost:  (id, d)     => req('PUT',    `/posts/${id}`, d),
    deletePost:  (id)        => req('DELETE', `/posts/${id}`),

    // ── FB Cities ────────────────────────────────────────────
    getFbCities:   ()        => req('GET',    '/fb-cities'),
    saveFbCity:    (item)    => req('POST',   '/fb-cities', item),
    updateFbCity:  (id, d)   => req('PUT',    `/fb-cities/${id}`, d),
    deleteFbCity:  (id)      => req('DELETE', `/fb-cities/${id}`),
};
