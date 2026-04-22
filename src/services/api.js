/**
 * ── API Service (Connects to Hono Backend) ───────────────────
 * This service handles communication with the Cloudflare Worker API.
 */

const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:8787' 
    : window.location.origin;

export const api = {
    async get(path, silent = false) {
        try {
            const response = await fetch(`${API_URL}${path}`);
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            return await response.json();
        } catch (err) {
            if (!silent) console.error(`[API GET ERROR] ${path}:`, err);
            throw err;
        }
    },

    async post(path, data) {
        try {
            const response = await fetch(`${API_URL}${path}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error(`API Error: ${response.statusText}`);
            return await response.json();
        } catch (err) {
            console.error(`[API POST ERROR] ${path}:`, err);
            throw err;
        }
    },

    // Specific endpoints
    async getUsers() {
        return this.get('/users');
    },

    async createUser(userData) {
        return this.post('/users', userData);
    },
    
    async getListings() {
        return this.get('/listings');
    },
    
    async getCities() {
        return this.get('/cities');
    }
};
