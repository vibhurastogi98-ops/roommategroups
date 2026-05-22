import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import sitemap from "vite-plugin-sitemap"; // SEO Update

// SEO Update: All static routes for sitemap generation
const staticRoutes = [
    '/',
    '/search/rooms',
    '/search/roommates',
    '/fb-groups',
    '/pricing',
    '/blog',
    '/about',
    '/faq',
    '/safety',
    '/contact',
    '/terms',
    '/privacy',
];

export default defineConfig(async () => {
    let allRoutes = [...staticRoutes];
    
    // SEO Update: Fetch dynamic slugs for sitemap expansion during build
    // We use the direct worker URL to ensure we get JSON data instead of HTML fallbacks
    const API_BASE = 'https://roommategroups.vibhurastogi98.workers.dev';

    try {
        const [citiesRes, listingsRes] = await Promise.all([
            fetch(`${API_BASE}/cities`).catch(() => null),
            fetch(`${API_BASE}/listings`).catch(() => null)
        ]);
        
        if (citiesRes && citiesRes.ok && citiesRes.headers.get('content-type')?.includes('application/json')) {
            const cities = await citiesRes.json();
            cities.forEach(c => {
                if (c.slug) {
                    allRoutes.push(`/cities/${c.slug}`);
                    allRoutes.push(`/fb-groups/${c.slug}`);
                }
            });
        }
        
        if (listingsRes && listingsRes.ok && listingsRes.headers.get('content-type')?.includes('application/json')) {
            const listings = await listingsRes.json();
            listings.forEach(l => {
                if (l.listing_id && l.status === 'active') {
                    allRoutes.push(`/listing/${l.listing_id}`);
                }
            });
        }
    } catch (err) {
        console.warn('⚠️ Could not fetch dynamic routes for sitemap generation:', err.message);
    }

    return {
        plugins: [
            react(),
            // SEO Update: Auto-generate sitemap.xml at build time
            sitemap({
                hostname: 'https://roommategroups.com',
                dynamicRoutes: allRoutes,
                changefreq: 'weekly',
                priority: 0.8,
                outDir: 'dist',
            }),
        ],
        server: {
            port: 3001,
            strictPort: true,
            open: true,
            proxy: {
                '/api': {
                    target: 'http://127.0.0.1:8787',
                    changeOrigin: true,
                    rewrite: (path) => path.replace(/^\/api/, '')
                },
                '/r2': {
                    target: 'http://127.0.0.1:8787',
                    changeOrigin: true
                }
            }
        }
    };
});
