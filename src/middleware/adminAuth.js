import { getCurrentUser, isAdmin } from '../services/auth.js';
import { navigate } from '../router.js';

// Admin access control middleware
export function requireAdmin() {
    return async (path, params) => {
        const user = getCurrentUser();
        
        // console.log('[ADMIN MIDDLEWARE] Checking admin access for path:', path);
        // console.log('[ADMIN MIDDLEWARE] User:', user?.email, 'role:', user?.role);
        
        // Check if user is logged in
        if (!user) {
            // console.log('[ADMIN MIDDLEWARE] No user found, redirecting to admin login');
            navigate('/admin-login');
            return false; // Block the route
        }
        
        // Check if user has admin role
        if (!isAdmin()) {
            // console.log('[ADMIN MIDDLEWARE] User is not admin, redirecting to dashboard');
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
        
        if (!user) {
            // console.log('[Auth] No user found, redirecting to login');
            navigate('/auth/login');
            return false; // Block the route
        }
        
        // console.log('[Auth] User authenticated:', user.email);
        return true; // Allow the route
    };
}
