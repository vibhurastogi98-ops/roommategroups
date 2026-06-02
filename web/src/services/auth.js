import { db } from './db.js';
import { API_URL } from './config.js';

const SESSION_KEY = 'rg_session';

// ── Helpers ──

// Legacy hash used only to detect old-format hashes during migration
function _isLegacyHash(h) { return typeof h === 'string' && h.startsWith('h_') && h.length < 20; }
function _legacyHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) { hash = ((hash << 5) - hash) + str.charCodeAt(i); hash |= 0; }
    return 'h_' + Math.abs(hash).toString(36);
}

// PBKDF2 via Web Crypto — safe in browser, Capacitor, and Cloudflare Worker
async function hashPassword(password) {
    const enc = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 200_000 },
        key, 256
    );
    const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
    const hashHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
    return `pbkdf2:${saltHex}:${hashHex}`;
}

async function verifyPassword(password, stored) {
    if (!stored) return false;
    // Handle legacy hashes during transition period
    if (_isLegacyHash(stored)) return _legacyHash(password) === stored;
    if (!stored.startsWith('pbkdf2:')) return false;
    const [, saltHex, expectedHex] = stored.split(':');
    const salt = new Uint8Array(saltHex.match(/.{2}/g).map(b => parseInt(b, 16)));
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveBits']);
    const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', hash: 'SHA-256', salt, iterations: 200_000 },
        key, 256
    );
    const actualHex = Array.from(new Uint8Array(bits)).map(b => b.toString(16).padStart(2, '0')).join('');
    // Constant-time comparison
    if (actualHex.length !== expectedHex.length) return false;
    let diff = 0;
    for (let i = 0; i < actualHex.length; i++) diff |= actualHex.charCodeAt(i) ^ expectedHex.charCodeAt(i);
    return diff === 0;
}

function generateStripeCustomerId() {
    return 'cus_' + Math.random().toString(36).substr(2, 14);
}

function decodeBase64UrlJson(segment) {
    const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
    let input = String(segment || '').replace(/-/g, '+').replace(/_/g, '/');
    const padding = input.length % 4;
    if (padding) input += '='.repeat(4 - padding);

    let value = 0;
    let bits = 0;
    const bytes = [];

    for (const char of input) {
        if (char === '=') break;
        const index = alphabet.indexOf(char);
        if (index === -1) return null;
        value = (value << 6) | index;
        bits += 6;
        if (bits >= 8) {
            bits -= 8;
            bytes.push((value >> bits) & 0xff);
        }
    }

    try {
        return JSON.parse(new TextDecoder().decode(new Uint8Array(bytes)));
    } catch {
        return null;
    }
}

// ── localStorage helpers (bypass D1 sync entirely) ──

function _getDB() { return JSON.parse(localStorage.getItem('rg_database') || '{}'); }
function _saveDB(raw) { localStorage.setItem('rg_database', JSON.stringify(raw)); }
function _genId() { return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6); }
function _setSession(user) {
    const token = user.token || user.jwt || user.user_id;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.user_id, email: user.email, token }));
    localStorage.setItem('token', token);
}

function _localCreateUser(data) {
    const raw = _getDB();
    if (!raw.users) raw.users = [];
    const user = { user_id: _genId(), created_at: new Date().toISOString(), ...data };
    raw.users.push(user);
    _saveDB(raw);
    return user;
}

function _localUpdateUser(userId, data) {
    const raw = _getDB();
    const idx = (raw.users || []).findIndex(u => u.user_id === userId || u.id === userId);
    if (idx === -1) return null;
    raw.users[idx] = { ...raw.users[idx], ...data, updated_at: new Date().toISOString() };
    _saveDB(raw);
    return raw.users[idx];
}

function _upsertLocalUser(user) {
    if (!user?.user_id) return null;
    const raw = _getDB();
    if (!raw.users) raw.users = [];
    const idx = raw.users.findIndex(u => u.user_id === user.user_id || u.id === user.user_id || u.email === user.email);
    if (idx === -1) {
        raw.users.push(user);
    } else {
        raw.users[idx] = { ...raw.users[idx], ...user, updated_at: new Date().toISOString() };
    }
    _saveDB(raw);
    return idx === -1 ? user : raw.users[idx];
}

function _isNetworkAuthError(err) {
    return err?.name === 'TypeError' || /failed to fetch|load failed|network/i.test(err?.message || '');
}

async function _authRequest(path, data, options = {}) {
    const headers = { 'Content-Type': 'application/json' };
    if (options.auth) {
        const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
        const token = localStorage.getItem('token') || session?.token || '';
        if (token) headers.Authorization = `Bearer ${token}`;
    }

    const res = await fetch(`${API_URL}${path}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });

    const payload = await res.clone().json().catch(async () => {
        const body = await res.text().catch(() => '');
        return { error: body || 'Server error' };
    });

    if (!res.ok) {
        const err = new Error(payload.error || payload.message || `HTTP ${res.status}`);
        err.status = res.status;
        throw err;
    }

    return payload;
}

function _finishServerSession(result) {
    const token = result?.token || result?.user?.token || result?.user?.jwt;
    const user = result?.user ? { ...result.user, token } : null;
    if (!user?.user_id || !token) throw new Error('Invalid authentication response.');
    const cached = _upsertLocalUser(user) || user;
    _setSession({ ...cached, token });
    return { ...cached, token, id: cached.user_id, fullName: cached.display_name };
}

async function _registerOffline({ fullName, email, password }) {
    const existing = db.users.findOne(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) return { success: false, error: 'An account with this email already exists.' };

    const pwHash = password ? await hashPassword(password) : null;
    const user = _localCreateUser({
        display_name: fullName, email: email.toLowerCase(),
        passwordHash: pwHash, city: '', country: '',
        profile_photo: '', bio: '', age_range: '', occupation: '',
        lifestyle_tags: [], budgetMin: 500, budgetMax: 2500, moveInTimeline: '',
        verification_level: 'basic', subscription_tier: 'free',
        stripe_customer_id: generateStripeCustomerId(),
        role: 'user', saved_listings: [], saved_searches: [], blocked_users: [],
        emailVerified: true, profileComplete: false, last_active: new Date().toISOString(), is_active: true
    });

    _setSession(user);
    return { success: true, user: { ...user, id: user.user_id, fullName: user.display_name } };
}

async function _loginOffline(email, password) {
    const normalizedEmail = email.toLowerCase();

    // Local-only bootstrap for offline development. Production auth is server-side.
    const ADMIN_EMAIL = 'hello@roommategroups.com';
    if (normalizedEmail === ADMIN_EMAIL) {
        let adminUser = db.users.findOne(u => u.email.toLowerCase() === normalizedEmail);
        if (!adminUser) {
            const pwHash = await hashPassword(password);
            adminUser = _localCreateUser({
                display_name: 'roommategroups', email: normalizedEmail,
                passwordHash: pwHash, role: 'admin', profileComplete: true,
                is_active: true, verification_level: 'community', subscription_tier: 'admin'
            });
        } else if (adminUser.role !== 'admin') {
            _localUpdateUser(adminUser.user_id, { role: 'admin', display_name: 'roommategroups', profileComplete: true });
        }
    }

    let user = db.users.findOne(u => u.email.toLowerCase() === normalizedEmail);
    if (!user) return { success: false, error: 'No account found with this email.' };

    const storedHash = user.passwordHash || user.password_hash;
    if (!storedHash) {
        const newHash = await hashPassword(password || crypto.randomUUID());
        _localUpdateUser(user.user_id, { passwordHash: newHash });
    } else if (password) {
        const ok = await verifyPassword(password, storedHash);
        if (!ok) return { success: false, error: 'Invalid email or password.' };
    } else {
        return { success: false, error: 'Password is required for this account.' };
    }

    const now = new Date().toISOString();
    user = _localUpdateUser(user.user_id, { last_active: now }) || user;
    _setSession(user);
    return { success: true, user: { ...user, id: user.user_id, fullName: user.display_name } };
}

// ── Auth Functions ──

export async function register({ fullName, email, password }) {
    try {
        const result = await _authRequest('/auth/register', {
            email,
            password,
            display_name: fullName
        });
        return { success: true, user: _finishServerSession(result) };
    } catch (err) {
        if (_isNetworkAuthError(err)) return _registerOffline({ fullName, email, password });
        return { success: false, error: err.message || 'Registration failed.' };
    }
}

export async function login(email, password) {
    try {
        const result = await _authRequest('/auth/login', { email, password });
        return { success: true, user: _finishServerSession(result) };
    } catch (err) {
        if (_isNetworkAuthError(err)) return _loginOffline(email, password);
        return { success: false, error: err.message || 'Invalid email or password.' };
    }
}


export async function logout() {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem('token');
}

// ── Session Management ──

export function getCurrentUser() {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (!session) return null;

    if (isTokenExpired(localStorage.getItem('token') || session.token || '')) {
        localStorage.removeItem(SESSION_KEY);
        localStorage.removeItem('token');
        return null;
    }

    const user = db.users.findById(session.userId);
    if (!user) return null;

    return { ...user, id: user.user_id, fullName: user.display_name };
}

function isTokenExpired(token) {
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    const payload = decodeBase64UrlJson(parts[1]);
    return Boolean(payload?.exp && Date.now() >= payload.exp * 1000);
}

export async function updateProfile(userId, profileData) {
    const existing = db.users.findById(userId);
    if (!existing) return { success: false, error: 'User not found.' };

    // Update city member_count when city changes
    if (profileData.city !== undefined && profileData.city !== existing.city) {
        if (existing.city) {
            const oldCity = db.cities.findById(existing.city);
            if (oldCity) await db.cities.update(oldCity.city_id, { member_count: Math.max(0, (oldCity.member_count || 0) - 1) });
        }
        if (profileData.city) {
            const newCity = db.cities.findById(profileData.city);
            if (newCity) await db.cities.update(newCity.city_id, { member_count: (newCity.member_count || 0) + 1 });
        }
    }

    // Map UI keys to DB keys
    const dbData = {
        ...profileData,
        profileComplete: true
    };

    if (profileData.profilePhoto !== undefined) dbData.profile_photo = profileData.profilePhoto;
    if (profileData.ageRange !== undefined) dbData.age_range = profileData.ageRange;
    if (profileData.lifestyleTags !== undefined) dbData.lifestyle_tags = profileData.lifestyleTags;

    const user = await db.users.update(userId, dbData);
    if (!user) return { success: false, error: 'User not found.' };

    return { success: true, user: { ...user, id: user.user_id, fullName: user.display_name } };
}

export async function changePassword(userId, currentPassword, newPassword) {
    if (!newPassword || newPassword.length < 8) return { success: false, error: 'New password must be at least 8 characters.' };

    try {
        await _authRequest('/auth/change-password', { currentPassword, newPassword }, { auth: true });
        const passwordHash = await hashPassword(newPassword);
        _localUpdateUser(userId, { passwordHash, password_hash: passwordHash });
        return { success: true };
    } catch (err) {
        if (!_isNetworkAuthError(err)) return { success: false, error: err.message || 'Could not update password.' };
    }

    const existing = db.users.findById(userId);
    if (!existing) return { success: false, error: 'User not found.' };

    const storedHash = existing.passwordHash || existing.password_hash;
    if (storedHash) {
        const ok = await verifyPassword(currentPassword || '', storedHash);
        if (!ok) return { success: false, error: 'Current password is incorrect.' };
    }
    const passwordHash = await hashPassword(newPassword);
    const user = _localUpdateUser(userId, { passwordHash, password_hash: passwordHash });
    if (!user) return { success: false, error: 'Could not update password.' };
    return { success: true };
}

export function isLoggedIn() {
    return getCurrentUser() !== null;
}

export function isAdmin() {
    const user = getCurrentUser();
    const jwtRole = getTokenRole();
    if (jwtRole) return user !== null && jwtRole === 'admin';
    return user !== null && user.role === 'admin';
}

function getTokenRole() {
    const token = localStorage.getItem('token') || '';
    const parts = token.split('.');
    if (parts.length !== 3) return '';
    const payload = decodeBase64UrlJson(parts[1]);
    return payload?.role || '';
}

// ── Password Strength ──

export function getPasswordStrength(password) {
    if (!password) return { level: 'none', label: '', color: '#E2E8F0', percent: 0 };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++;

    if (score <= 1) return { level: 'weak', label: 'Weak', color: '#1a1a1a', percent: 20 };
    if (score <= 2) return { level: 'fair', label: 'Fair', color: '#555555', percent: 40 };
    if (score <= 3) return { level: 'good', label: 'Good', color: '#777777', percent: 60 };
    if (score <= 4) return { level: 'strong', label: 'Strong', color: '#27AE60', percent: 80 };
    return { level: 'excellent', label: 'Excellent', color: '#333333', percent: 100 };
}

// ── Badges ──

export function getVerificationBadge(userOrLevel) {
    if (!userOrLevel) return '';
    let email = false, phone = false, id = false, community = false;
    
    if (typeof userOrLevel === 'string' && userOrLevel !== 'none') {
        email = true;
        if (userOrLevel === 'phone' || userOrLevel === 'id' || userOrLevel === 'community') phone = true;
        if (userOrLevel === 'id' || userOrLevel === 'community') id = true;
        if (userOrLevel === 'community') community = true;
    } else if (typeof userOrLevel === 'object') {
        const lvl = userOrLevel.verification_level || 'none';
        email = true; // Email is assumed verified if registered
        phone = userOrLevel.phone_verified || lvl === 'phone' || lvl === 'id' || lvl === 'community';
        id = userOrLevel.id_verified || lvl === 'id' || lvl === 'community';
        community = userOrLevel.community_verified || lvl === 'community';
    }

    let html = '';
    if (email) html += '<span class="verify-badge verify-email" title="Email Verified"><i class="fa-solid fa-envelope-circle-check" style="color:#333333;"></i></span>';
    if (phone) html += '<span class="verify-badge verify-phone" title="Phone Verified"><i class="fa-solid fa-phone" style="color:#1a1a1a;"></i></span>';
    if (id) html += '<span class="verify-badge verify-id" title="ID Verified"><i class="fa-solid fa-shield-check" style="color:#1a1a1a;"></i></span>';
    if (community) html += '<span class="verify-badge verify-community" title="Community Verified"><i class="fa-solid fa-star" style="color:#555555;"></i></span>';
    
    return html ? '<span class="verification-badges tooltip-badges" style="display:inline-flex;gap:4px;margin-left:6px;">' + html + '</span>' : '';
}
