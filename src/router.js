// ── Simple Path-Based Router ──────────────────────────
import { trackPageView } from './services/analytics.js';

const routes = {};
const middleware = [];
let appElement = null;

export function initRouter(app) {
    appElement = app;
    window.addEventListener('popstate', resolve);
    window.navigate = navigate; // Make it globally accessible for inline onclick handlers
    window.resolveRouter = resolve;
    
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
    const hash = window.location.hash;
    const cleanPath = path.split('?')[0]; // Note: path from pathname doesn't include hash

    console.log('[Router] Resolving:', cleanPath, 'Hash:', hash);
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

                if (pathParts.length === targetParts.length) {
                    const match = pathParts.every((part, i) => part.startsWith(':') || part === targetParts[i]);
                    if (match) {
                        route = routes[routePath];
                        pathParts.forEach((part, i) => {
                            if (part.startsWith(':')) {
                                params[part.slice(1)] = targetParts[i];
                            }
                        });
                        break;
                    }
                }
            }
        }
    }

    // Track every page view
    trackPageView(cleanPath);

    if (route) {
        console.log('[Router] Handler found, running middleware...');
        
        // Run global middleware first
        for (const middlewareFn of middleware) {
            const result = await middlewareFn(cleanPath, params);
            if (result === false) return; 
        }
        
        // Run route-specific middleware
        for (const middlewareFn of route.middleware) {
            const result = await middlewareFn(cleanPath, params);
            if (result === false) return;
        }
        
        // Execute the handler
        route.handler(appElement, params);

        // Ensure body/html are not locked (fixes mobile navigation sticking)
        document.body.style.overflow = '';
        document.documentElement.style.overflow = '';

        // Handle scrolling with a small delay for mobile compatibility
        requestAnimationFrame(() => {
            if (hash) {
                const id = hash.substring(1);
                setTimeout(() => {
                    const el = document.getElementById(id);
                    if (el) {
                        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } else {
                        window.scrollTo({ top: 0, behavior: 'instant' });
                    }
                }, 100);
            } else if (cleanPath === '/fb-groups') {
                // FB Groups page handles its own auto-scroll to results
                // No need to scroll to top here to avoid jumpiness
            } else {
                // For all other pages, ensure we scroll to top after render
                // Multiple attempts to ensure it works on all mobile browsers
                window.scrollTo(0, 0);
                setTimeout(() => window.scrollTo(0, 0), 50);
                setTimeout(() => window.scrollTo(0, 0), 150);
            }
        });
    } else {
        console.log('[Router] No handler found! Falling back to home.');
        // Fallback to home
        window.scrollTo(0, 0);
        const homeRoute = routes['/'];
        if (homeRoute) {
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
