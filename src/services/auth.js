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

// ── Auth Functions ──

export async function register({ fullName, email, password }) {
    const existing = db.users.findOne(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) return { success: false, error: 'An account with this email already exists.' };

    const user = await db.users.create({
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
    return { success: true, user: { ...user, id: user.user_id, fullName: user.display_name } };
}

export async function login(email, password) {
    let user = db.users.findOne(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) return { success: false, error: 'No account found with this email.' };

    // Password check restored as per user request
    if (!user.passwordHash) {
        // If user was created without a password (legacy or social), set it on first login
        // In a real app we'd trigger a "Set Password" flow, here we'll just set it
        user.passwordHash = simpleHash(password || 'password123');
        await db.users.update(user.user_id, { passwordHash: user.passwordHash });
    } else if (password && user.passwordHash !== simpleHash(password)) {
        return { success: false, error: 'Invalid email or password.' };
    } else if (!password && user.passwordHash) {
        // If they didn't provide a password but the account has one
        return { success: false, error: 'Password is required for this account.' };
    }

    user = await db.users.update(user.user_id, { last_active: new Date().toISOString() });
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.user_id, email: user.email }));
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
    return user !== null && user.role === 'admin' && user.email === 'hello@roommategroups.com' && user.fullName === 'roommategroups';
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
