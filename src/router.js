// ── Simple Path-Based Router ──────────────────────────
import { trackPageView } from './services/analytics.js';

const routes = {};
const middleware = [];
let appElement = null;

export function initRouter(app) {
    appElement = app;
    window.addEventListener('popstate', resolve);
    window.navigate = navigate; // Make it globally accessible for inline onclick handlers
    
    // Intercept link clicks to prevent full page reload
    document.addEventListener('click', (e) => {
        const link = e.target.closest('a');
        if (link && link.href.startsWith(window.location.origin) && !link.hasAttribute('data-external')) {
            e.preventDefault();
            const path = link.getAttribute('href');
            navigate(path);
        }
    });

    resolve();
}

export function addRoute(path, handler, routeMiddleware = []) {
    routes[path] = { handler, middleware: routeMiddleware };
}

export function addGlobalMiddleware(fn) {
    middleware.push(fn);
}

export function navigate(path) {
    window.history.pushState({}, '', path);
    resolve();
}

export function getCurrentPath() {
    return window.location.pathname || '/';
}

async function resolve() {
    const path = window.location.pathname || '/';
    const cleanPath = path.split('?')[0];

    console.log('[Router] Resolving:', cleanPath);
    console.log('[Router] Available routes:', Object.keys(routes));

    // Exact match
    let route = routes[cleanPath];
    let params = {};

    // Pattern match if no exact match
    if (!route) {
        for (const routePath in routes) {
            if (routePath.includes(':')) {
                const pathParts = routePath.split('/').filter(p => p !== '');
                const targetParts = cleanPath.split('/').filter(p => p !== '');

                console.log('[Router] Trying pattern:', routePath, 'parts:', pathParts.length, 'vs hash parts:', targetParts.length);

                if (pathParts.length === targetParts.length) {
                    const match = pathParts.every((part, i) => part.startsWith(':') || part === targetParts[i]);
                    console.log('[Router] Length match for', routePath, '- content match:', match);
                    if (match) {
                        route = routes[routePath];
                        pathParts.forEach((part, i) => {
                            if (part.startsWith(':')) {
                                params[part.slice(1)] = targetParts[i];
                            }
                        });
                        console.log('[Router] Matched route:', routePath, 'params:', params);
                        break;
                    }
                }
            }
        }
    }

    // Scroll to top on route change
    window.scrollTo(0, 0);

    // Track every page view (admin routes are filtered inside trackPageView)
    trackPageView(cleanPath);

    if (route) {
        console.log('[Router] Handler found, running middleware...');
        
        // Run global middleware first
        for (const middlewareFn of middleware) {
            const result = await middlewareFn(cleanPath, params);
            if (result === false) return; // Middleware blocked the route
        }
        
        // Run route-specific middleware
        for (const middlewareFn of route.middleware) {
            const result = await middlewareFn(cleanPath, params);
            if (result === false) return; // Middleware blocked the route
        }
        
        // Execute the handler
        route.handler(appElement, params);
    } else {
        console.log('[Router] No handler found! Falling back to home.');
        // Fallback to home
        const homeRoute = routes['/'];
        if (homeRoute) {
            // Run middleware for home route too
            for (const middlewareFn of middleware) {
                const result = await middlewareFn('/', {});
                if (result === false) return;
            }
            for (const middlewareFn of homeRoute.middleware) {
                const result = await middlewareFn('/', {});
                if (result === false) return;
            }
            homeRoute.handler(appElement, {});
        }
    }
}
