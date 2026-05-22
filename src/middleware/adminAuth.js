import { getCurrentUser, isAdmin } from '../services/auth.js';
import { navigate } from '../router.js';
import { showToast } from '../services/ui.js';

function getToken() {
    return localStorage.getItem('token');
}

// Admin access control middleware
export function requireAdmin() {
    return async (path, params) => {
        const user = getCurrentUser();
        
        // console.log('[ADMIN MIDDLEWARE] Checking admin access for path:', path);
        // console.log('[ADMIN MIDDLEWARE] User:', user?.email, 'role:', user?.role);
        
        // Check if user is logged in
        if (!getToken() || !user) {
            // console.log('[ADMIN MIDDLEWARE] No user found, redirecting to admin login');
            sessionStorage.setItem('redirectAfterLogin', path);
            navigate('/admin-login');
            return false; // Block the route
        }
        
        // Check if user has admin role
        if (!isAdmin()) {
            // console.log('[ADMIN MIDDLEWARE] User is not admin, redirecting to dashboard');
            showToast('Admin access is required for that page.', 'error');
            navigate('/dashboard');
            return false; // Block the route
        }
        
        // console.log('[ADMIN MIDDLEWARE] Admin access granted for:', user.email);
        return true; // Allow the route
    };
}

// General authentication middleware (for protected routes)
export function requireAuth() {
    return async (path, params) => {
        const user = getCurrentUser();
        
        if (!getToken() || !user) {
            // console.log('[Auth] No user found, redirecting to login');
            sessionStorage.setItem('redirectAfterLogin', path);
            navigate('/auth/login');
            return false; // Block the route
        }
        
        // console.log('[Auth] User authenticated:', user.email);
        return true; // Allow the route
    };
}
