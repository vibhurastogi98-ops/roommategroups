/**
 * ── API Service (Connects to Hono Backend) ───────────────────
 * Handles communication with the Cloudflare Worker / D1 API.
 * All write operations (create/update/delete) sync to D1 so
 * changes made in the Admin panel are visible on every device.
 */

import { API_URL } from './config.js';
import { showToast } from './ui.js';


async function req(method, path, data, silent = false) {
    try {
        const session = JSON.parse(localStorage.getItem('rg_session') || 'null');
        const token = localStorage.getItem('token') || session?.token || session?.userId || '';

        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (token) opts.headers.Authorization = `Bearer ${token}`;
        if (data !== undefined) opts.body = JSON.stringify(data);
        
        const url = `${API_URL}${path}`;

        const res = await fetch(url, opts);
        if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('rg_session');
            sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
            if (!silent) showToast('Your session expired. Please sign in again.', 'warning');
            window.location.href = '/auth/login';
            return null;
        }
        if (!res.ok) {
            const err = await res.clone().json().catch(async () => {
                const body = await res.text().catch(() => '');
                return { error: body || 'Server error' };
            });
            throw new Error(err.error || err.message || `HTTP ${res.status}`);
        }

        if (res.status === 204) return null;

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
        if (!silent) console.debug(`[API ${method}] ${path}:`, err);
        if (!silent) showToast(err.message || 'Server error', 'error');
        throw err;
    }
}

export const api = {
    // ── Generic helpers ──────────────────────────────────────
    get:    (path, silent = false) => req('GET',    path, undefined, silent),
    post:   (path, data, silent = false) => req('POST',   path, data, silent),
    put:    (path, data, silent = false) => req('PUT',    path, data, silent),
    delete: (path, silent = false)       => req('DELETE', path, undefined, silent),

    // ── Users ────────────────────────────────────────────────
    getUsers:     (silent = false) => req('GET',  '/users', undefined, silent),
    createUser:   (data, silent = false) => req('POST', '/users', data, silent),
    updateUser:   (id, d, silent = false) => req('PUT',    `/users/${id}`, d, silent),
    deleteUser:   (id, silent = false) => req('DELETE', `/users/${id}`, undefined, silent),
    blockUser:    (id, silent = false) => req('POST',   `/users/${id}/block`, undefined, silent),

    // ── Listings ─────────────────────────────────────────────
    getListings:    (silent = false) => req('GET',    '/listings', undefined, silent),
    saveListing:    (item, silent = false) => req('POST',   '/listings', item, silent),
    updateListing:  (id, d, silent = false) => req('PUT',    `/listings/${id}`, d, silent),
    deleteListing:  (id, silent = false) => req('DELETE', `/listings/${id}`, undefined, silent),

    // ── Cities ───────────────────────────────────────────────
    getCities:   (silent = false) => req('GET',    '/cities', undefined, silent),
    saveCity:    (item, silent = false) => req('POST',   '/cities', item, silent),
    updateCity:  (id, d, silent = false) => req('PUT',    `/cities/${id}`, d, silent),
    deleteCity:  (id, silent = false) => req('DELETE', `/cities/${id}`, undefined, silent),

    // ── Posts ────────────────────────────────────────────────
    getPosts:    (silent = false) => req('GET',    '/posts', undefined, silent),
    savePost:    (item, silent = false) => req('POST',   '/posts', item, silent),
    updatePost:  (id, d, silent = false) => req('PUT',    `/posts/${id}`, d, silent),
    deletePost:  (id, silent = false) => req('DELETE', `/posts/${id}`, undefined, silent),

    // ── FB Cities ────────────────────────────────────────────
    getFbCities:   (silent = false) => req('GET',    '/fb-cities', undefined, silent),
    saveFbCity:    (item, silent = false) => req('POST',   '/fb-cities', item, silent),
    updateFbCity:  (id, d, silent = false) => req('PUT',    `/fb-cities/${id}`, d, silent),
    deleteFbCity:  (id, silent = false) => req('DELETE', `/fb-cities/${id}`, undefined, silent),

    // ── FB Countries ─────────────────────────────────────────
    getFbCountries:   (silent = false) => req('GET',    '/fb-countries', undefined, silent),
    saveFbCountry:    (item, silent = false) => req('POST',   '/fb-countries', item, silent),
    updateFbCountry:  (id, d, silent = false) => req('PUT',    `/fb-countries/${id}`, d, silent),
    deleteFbCountry:  (id, silent = false) => req('DELETE', `/fb-countries/${id}`, undefined, silent),

    // ── Threads ──────────────────────────────────────────────
    getThreads:       (silent = false) => req('GET',    '/threads', undefined, silent),
    saveThread:       (item, silent = false) => req('POST',   '/threads', item, silent),
    updateThread:     (id, d, silent = false) => req('PUT',    `/threads/${id}`, d, silent),
    deleteThread:     (id, silent = false) => req('DELETE', `/threads/${id}`, undefined, silent),
    archiveThread:    (id, silent = false) => req('PUT',    `/threads/${id}/archive`, undefined, silent),

    // ── Messages ─────────────────────────────────────────────
    getMessages:      (tid, silent = false) => req('GET',    tid ? `/messages?thread_id=${tid}` : '/messages', undefined, silent),
    saveMessage:      (item, silent = false) => req('POST',   '/messages', item, silent),
    updateMessage:    (id, d, silent = false) => req('PUT',    `/messages/${id}`, d, silent),
    deleteMessage:    (id, silent = false) => req('DELETE', `/messages/${id}`, undefined, silent),

    // ── Reports ──────────────────────────────────────────────
    saveReport:       (item, silent = false) => req('POST',   '/reports', item, silent),
    updateReport:     (id, d, silent = false) => req('PUT',    `/reports/${id}`, d, silent),
    deleteReport:     (id, silent = false) => req('DELETE', `/reports/${id}`, undefined, silent),

    // ── Notifications ────────────────────────────────────────
    saveNotification: (item, silent = false) => req('POST',   '/notifications', item, silent),
    updateNotification:(id, d, silent = false) => req('PUT',    `/notifications/${id}`, d, silent),
    deleteNotification:(id, silent = false) => req('DELETE', `/notifications/${id}`, undefined, silent),
};
