/**
 * ── API Service (Connects to Hono Backend) ───────────────────
 * Handles communication with the Cloudflare Worker / D1 API.
 * All write operations (create/update/delete) sync to D1 so
 * changes made in the Admin panel are visible on every device.
 */

import { API_URL } from './config.js';


async function req(method, path, data, silent = false) {
    try {
        const session = JSON.parse(localStorage.getItem('rg_session') || 'null');
        const token = localStorage.getItem('token') || session?.token || session?.userId || '';

        const opts = { 
            method, 
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            } 
        };
        if (data !== undefined) opts.body = JSON.stringify(data);
        
        const url = `${API_URL}${path}`;

        const res = await fetch(url, opts);
        if (!res.ok) {
            const errText = await res.text().catch(() => '');
            throw new Error(`${method} ${path} → ${res.status}${errText ? ': ' + errText.slice(0, 200) : ''}`);
        }

        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
            const body = await res.text().catch(() => '');
            throw new Error(`${method} ${path} → expected JSON but got "${ct || 'no content-type'}"${body ? ': ' + body.slice(0, 100) : ''}`);
        }

        const text = await res.text();
        try {
            return text ? JSON.parse(text) : null;
        } catch (e) {
            throw new Error(`${method} ${path} → invalid JSON: ${e.message}`);
        }
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
    updateUser:   (id, d)    => req('PUT',    `/users/${id}`, d),
    deleteUser:   (id)       => req('DELETE', `/users/${id}`),
    blockUser:    (id)       => req('POST',   `/users/${id}/block`),

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

    // ── FB Countries ─────────────────────────────────────────
    getFbCountries:   ()     => req('GET',    '/fb-countries'),
    saveFbCountry:    (item) => req('POST',   '/fb-countries', item),
    updateFbCountry:  (id, d)=> req('PUT',    `/fb-countries/${id}`, d),
    deleteFbCountry:  (id)   => req('DELETE', `/fb-countries/${id}`),

    // ── Threads ──────────────────────────────────────────────
    getThreads:       ()     => req('GET',    '/threads'),
    saveThread:       (item) => req('POST',   '/threads', item),
    updateThread:     (id, d)=> req('PUT',    `/threads/${id}`, d),
    deleteThread:     (id)   => req('DELETE', `/threads/${id}`),
    archiveThread:    (id)   => req('PUT',    `/threads/${id}/archive`),

    // ── Messages ─────────────────────────────────────────────
    getMessages:      (tid)  => req('GET',    tid ? `/messages?thread_id=${tid}` : '/messages'),
    saveMessage:      (item) => req('POST',   '/messages', item),
    updateMessage:    (id, d)  => req('PUT',    `/messages/${id}`, d),
    deleteMessage:    (id)   => req('DELETE', `/messages/${id}`),

    // ── Reports ──────────────────────────────────────────────
    saveReport:       (item) => req('POST',   '/reports', item),
    updateReport:     (id, d)=> req('PUT',    `/reports/${id}`, d),
    deleteReport:     (id)   => req('DELETE', `/reports/${id}`),

    // ── Notifications ────────────────────────────────────────
    saveNotification: (item) => req('POST',   '/notifications', item),
    updateNotification:(id, d)=> req('PUT',    `/notifications/${id}`, d),
    deleteNotification:(id)   => req('DELETE', `/notifications/${id}`),
};
