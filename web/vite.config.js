import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import sitemap from "vite-plugin-sitemap"; // SEO Update

// SEO Update: All static routes for sitemap generation
const staticRoutes = [
    '/',
    '/search/rooms',
    '/search/roommates',
    '/marketplace',
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

const marketplaceCategoryFallbacks = [
    { slug: 'furniture', kind: 'product', is_active: true },
    { slug: 'electronics', kind: 'product', is_active: true },
    { slug: 'mobiles', kind: 'product', is_active: true },
    { slug: 'vehicles', kind: 'vehicle', is_active: true },
    { slug: 'home-garden', kind: 'product', is_active: true },
    { slug: 'appliances', kind: 'product', is_active: true },
    { slug: 'fashion', kind: 'product', is_active: true },
    { slug: 'free-stuff', kind: 'product', is_active: true },
];

async function fetchJson(url) {
    const res = await fetch(url).catch(() => null);
    if (!res || !res.ok || !res.headers.get('content-type')?.includes('application/json')) return null;
    return res.json();
}

function normalizeListResponse(data) {
    if (Array.isArray(data)) return data;
    if (Array.isArray(data?.results)) return data.results;
    return [];
}

function isActiveCity(city) {
    return city?.is_active !== false && city?.is_active !== 0 && city?.is_active !== '0';
}

function isMarketplaceEnabled(city) {
    if (!city || city.marketplace_enabled === false || city.marketplace_enabled === 0 || city.marketplace_enabled === '0') return false;
    return city.marketplace_enabled === true || city.marketplace_enabled === 1 || city.marketplace_enabled === '1' || city.marketplace_enabled === undefined || city.marketplace_enabled === null;
}

function isActiveCategory(category) {
    return category?.is_active !== false && category?.is_active !== 0 && category?.is_active !== '0';
}

function flattenCategoryTree(categories = []) {
    const out = [];
    const visit = (category) => {
        if (!category) return;
        out.push(category);
        (category.children || []).forEach(visit);
    };
    categories.forEach(visit);
    return out;
}

async function fetchAllListings(apiBase) {
    const firstPage = await fetchJson(`${apiBase}/listings?limit=100&page=1`);
    const firstItems = normalizeListResponse(firstPage);
    const total = Number(firstPage?.total || firstItems.length);
    const limit = Number(firstPage?.limit || 100);
    const pages = Math.min(Math.ceil(total / limit), 20);
    const extraPages = [];

    for (let page = 2; page <= pages; page += 1) {
        extraPages.push(fetchJson(`${apiBase}/listings?limit=100&page=${page}`));
    }

    const rest = await Promise.all(extraPages);
    return [
        ...firstItems,
        ...rest.flatMap(normalizeListResponse),
    ];
}

export default defineConfig(async () => {
    let allRoutes = [...staticRoutes];
    
    // SEO Update: Fetch dynamic slugs for sitemap expansion during build
    // We use the direct worker URL to ensure we get JSON data instead of HTML fallbacks
    const API_BASE = 'https://roommategroups.vibhurastogi98.workers.dev';

    try {
        const [cities, categoryTree, listings] = await Promise.all([
            fetchJson(`${API_BASE}/cities`),
            fetchJson(`${API_BASE}/categories/tree`),
            fetchAllListings(API_BASE),
        ]);
        
        if (Array.isArray(cities)) {
            cities.forEach(c => {
                if (c.slug && isActiveCity(c)) {
                    allRoutes.push(`/cities/${c.slug}`);
                    allRoutes.push(`/fb-groups/${c.slug}`);
                }
            });

            const marketplaceCities = cities.filter(c => c.slug && isActiveCity(c) && isMarketplaceEnabled(c));
            marketplaceCities.forEach(c => {
                allRoutes.push(`/marketplace/${c.slug}`);
            });

            const categorySource = Array.isArray(categoryTree) && categoryTree.length ? categoryTree : marketplaceCategoryFallbacks;
            const marketplaceCategories = flattenCategoryTree(categorySource)
                .filter(cat => cat.slug && isActiveCategory(cat) && cat.kind !== 'service');

            marketplaceCities.forEach(city => {
                marketplaceCategories.forEach(category => {
                    allRoutes.push(`/marketplace/${category.slug}/${city.slug}`);
                });
            });
        }

        normalizeListResponse(listings).forEach(l => {
            if (l.listing_id && l.status === 'active') {
                allRoutes.push(`/listing/${l.listing_id}`);
            }
        });
    } catch (err) {
        console.warn('⚠️ Could not fetch dynamic routes for sitemap generation:', err.message);
    }

    allRoutes = [...new Set(allRoutes)];

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
            fs: {
                allow: ['..'],
            },
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
