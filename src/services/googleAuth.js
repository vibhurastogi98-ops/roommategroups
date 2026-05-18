import { db } from './db.js';

// Reads from .env → VITE_GOOGLE_CLIENT_ID
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

const SESSION_KEY = 'rg_session';

/**
 * Loads Google GSI library and triggers the sign-in prompt using OAuth2 Token Client in Popup mode.
 */
export function initGoogleSignIn(onSuccess, onError) {
    if (window.google?.accounts?.oauth2) {
        startOAuthFlow(onSuccess, onError);
        return;
    }

    // Check if script is already present but not loaded yet
    if (document.querySelector('script[src*="accounts.google.com/gsi"]')) {
        // Wait for it
        const checkInterval = setInterval(() => {
            if (window.google?.accounts?.oauth2) {
                clearInterval(checkInterval);
                startOAuthFlow(onSuccess, onError);
            }
        }, 100);
        return;
    }

    // Load GSI Library on demand
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
        startOAuthFlow(onSuccess, onError);
    };
    script.onerror = () => {
        onError?.('Google Sign-In unavailable. Please try again or use email.');
    };
    document.head.appendChild(script);
}

function startOAuthFlow(onSuccess, onError) {
    if (!window.google?.accounts?.oauth2) {
        onError?.('Google Sign-In failed to initialize library.');
        return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid email profile',
        ux_mode: 'popup',
        callback: async (response) => {
            if (response.error) {
                console.error('Google OAuth Error:', response.error);
                onError?.(`Google Authentication failed: ${response.error_description || response.error}`);
                return;
            }

            try {
                // Fetch user info from Google's UserInfo API
                const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                    headers: { Authorization: `Bearer ${response.access_token}` }
                });

                if (!userInfoResponse.ok) {
                    throw new Error('Failed to fetch user info from Google');
                }

                const userData = await userInfoResponse.json();
                handleGoogleUser(userData, onSuccess, onError);
            } catch (err) {
                console.error('User Info Error:', err);
                onError?.('Failed to get your Google profile information.');
            }
        },
    });

    // Request the token (triggers the popup)
    client.requestAccessToken();
}

async function handleGoogleUser(payload, onSuccess, onError) {
    if (!payload?.email) {
        onError?.('Google account must have an email address.');
        return;
    }

    const { email, name, sub: googleId, picture } = payload;
    let user = db.users.findOne(u => u.email.toLowerCase() === email.toLowerCase());
    const isNew = !user;

    const userData = {
        display_name: name || email.split('@')[0],
        email: email.toLowerCase(),
        google_id: googleId,
        profile_photo: picture || '',
        last_active: new Date().toISOString(),
        is_active: true,
        emailVerified: true,
    };

    if (!user) {
        user = await db.users.create({
            ...userData,
            passwordHash: null,
            bio: '', 
            age_range: '', 
            occupation: '',
            city: '', 
            country: '', 
            moveInTimeline: '',
            role: 'user',
            lifestyle_tags: [], 
            budgetMin: 500, 
            budgetMax: 2500,
            verification_level: 'basic', 
            subscription_tier: 'free',
            stripe_customer_id: 'cus_' + Math.random().toString(36).slice(2, 16),
            profileComplete: false,
        });
    } else {
        user = await db.users.update(user.user_id, userData);
    }

    // Now user is the awaited result
    localStorage.setItem(SESSION_KEY, JSON.stringify({ userId: user.user_id, email: user.email }));
    onSuccess?.({ user: { ...user, id: user.user_id, fullName: user.display_name }, isNew });
}

/**
 * Triggers Google One Tap for automatic user recognition.
 */
export function displayOneTap(onSuccess, onError) {
    if (localStorage.getItem(SESSION_KEY)) return;

    const startOneTap = () => {
        window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
                // Verify the ID token server-side via Google's tokeninfo endpoint.
                // This validates the signature and expiry — never trust atob() alone.
                try {
                    const verifyRes = await fetch(
                        `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(response.credential)}`
                    );
                    if (!verifyRes.ok) throw new Error('Token verification failed');
                    const payload = await verifyRes.json();
                    if (payload.aud !== GOOGLE_CLIENT_ID) throw new Error('Token audience mismatch');
                    handleGoogleUser(payload, onSuccess, onError);
                } catch (err) {
                    onError?.('Google Sign-In verification failed. Please try again.');
                }
            },
            cancel_on_tap_outside: false
        });
        window.google.accounts.id.prompt();
    };

    if (window.google?.accounts?.id) {
        startOneTap();
    } else {
        const script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true; script.defer = true;
        script.onload = startOneTap;
        document.head.appendChild(script);
    }
}

/**
 * Decodes Google ID Token.
 */
export function decodeGoogleJwt(token) {
    try {
        const payload = token.split('.')[1];
        return JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
    } catch { return null; }
}
