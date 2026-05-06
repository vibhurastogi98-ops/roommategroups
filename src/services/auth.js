import { db } from './db.js';

const SESSION_KEY = 'rg_session';

// ── Helpers ──

function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash |= 0;
    }
    return 'h_' + Math.abs(hash).toString(36);
}

function generateStripeCustomerId() {
    return 'cus_' + Math.random().toString(36).substr(2, 14);
}

// ── localStorage helpers (bypass D1 sync entirely) ──

function _getDB() { return JSON.parse(localStorage.getItem('rg_database') || '{}'); }
function _saveDB(raw) { localStorage.setItem('rg_database', JSON.stringify(raw)); }
function _genId() { return 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6); }

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

function _bgSync(fn) {
    // Fire-and-forget — network errors never block auth
    Promise.resolve().then(fn).catch(e => console.debug('[AUTH] D1 sync skipped (offline):', e.message));
}

// ── Auth Functions ──

export async function register({ fullName, email, password }) {
    const existing = db.users.findOne(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) return { success: false, error: 'An account with this email already exists.' };

    // Write to localStorage immediately — no network call
    const user = _localCreateUser({
        display_name: fullName, email: email.toLowerCase(),
        passwordHash: password ? simpleHash(password) : null, city: '', country: '',
        profile_photo: '', bio: '', age_range: '', occupation: '',
        lifestyle_tags: [], budgetMin: 500, budgetMax: 2500, moveInTimeline: '',
        verification_level: 'basic', subscription_tier: 'free',
        stripe_customer_id: generateStripeCustomerId(),
        role: 'user', saved_listings: [], saved_searches: [], blocked_users: [],
        emailVerified: true, profileComplete: false, last_active: new Date().toISOString(), is_active: true
    });

    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.user_id, email: user.email }));

    // Background D1 sync — never blocks
    _bgSync(async () => {
        const { api } = await import('./api.js');
        await api.createUser(user);
    });

    return { success: true, user: { ...user, id: user.user_id, fullName: user.display_name } };
}

export async function login(email, password) {
    const normalizedEmail = email.toLowerCase();

    // ── Master Admin Bootstrap (local only) ──
    if (normalizedEmail === 'hello@roommategroups.com' && password === 'Vibhu$12345') {
        let adminUser = db.users.findOne(u => u.email.toLowerCase() === normalizedEmail);
        const pwHash = simpleHash(password);
        if (!adminUser) {
            adminUser = _localCreateUser({
                display_name: 'roommategroups', email: normalizedEmail,
                passwordHash: pwHash, role: 'admin', profileComplete: true,
                is_active: true, verification_level: 'community', subscription_tier: 'admin'
            });
            _bgSync(async () => { const { api } = await import('./api.js'); await api.createUser(adminUser); });
        } else if (adminUser.role !== 'admin' || adminUser.passwordHash !== pwHash || adminUser.display_name !== 'roommategroups') {
            const updates = { role: 'admin', passwordHash: pwHash, display_name: 'roommategroups', profileComplete: true };
            _localUpdateUser(adminUser.user_id, updates);
            _bgSync(async () => { const { api } = await import('./api.js'); await api.updateUser(adminUser.user_id, updates); });
        }
    }

    let user = db.users.findOne(u => u.email.toLowerCase() === normalizedEmail);
    if (!user) return { success: false, error: 'No account found with this email.' };

    const storedHash = user.passwordHash || user.password_hash;

    if (!storedHash) {
        // Legacy / social account — set password on first use
        const newHash = simpleHash(password || 'password123');
        _localUpdateUser(user.user_id, { passwordHash: newHash });
        _bgSync(async () => { const { api } = await import('./api.js'); await api.updateUser(user.user_id, { password_hash: newHash }); });
    } else if (password && storedHash !== simpleHash(password)) {
        return { success: false, error: 'Invalid email or password.' };
    } else if (!password && storedHash) {
        return { success: false, error: 'Password is required for this account.' };
    }

    // Update last_active locally — no network needed
    const now = new Date().toISOString();
    user = _localUpdateUser(user.user_id, { last_active: now }) || user;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.user_id, email: user.email }));

    // Background D1 sync — never blocks login
    _bgSync(async () => { const { api } = await import('./api.js'); await api.updateUser(user.user_id, { last_active: now }); });

    return { success: true, user: { ...user, id: user.user_id, fullName: user.display_name } };
}


export async function logout() {
    localStorage.removeItem(SESSION_KEY);
}

// ── Session Management ──

export function getCurrentUser() {
    const session = JSON.parse(localStorage.getItem(SESSION_KEY) || 'null');
    if (!session) return null;

    const user = db.users.findById(session.userId);
    if (!user) return null;

    return { ...user, id: user.user_id, fullName: user.display_name };
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

export function isLoggedIn() {
    return getCurrentUser() !== null;
}

export function isAdmin() {
    const user = getCurrentUser();
    // Simplified check: only email is required for master admin, others must have 'admin' role
    return user !== null && (user.role === 'admin' || user.email === 'hello@roommategroups.com');
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
