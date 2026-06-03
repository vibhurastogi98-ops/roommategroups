import { db } from '../services/db.js';
import { api } from '../services/api.js';
import { navigate } from '../router.js';
import { getCurrentUser } from '../services/auth.js';
import { getAssetUrl } from '../services/assets.js';
import { renderNavbar, initNavbar } from '../components/navbar.js';
import { buildProductOfferSchema, setSEO } from '../seo.js';
import { renderMobileCard } from '../../../mobile/src/components/MobileCard.js';
import { renderMarketplaceCityPage } from './marketplace-city.js';

const FALLBACK_HERO = 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1600&h=700&fit=crop';
const FALLBACK_CATEGORY_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=600&h=400&fit=crop';

const FALLBACK_CATEGORIES = [
    { category_id: 'mp_furniture', slug: 'furniture', name: 'Furniture', icon: 'fa-couch', kind: 'product', children: [] },
    { category_id: 'mp_electronics', slug: 'electronics', name: 'Electronics', icon: 'fa-tv', kind: 'product', children: [] },
    { category_id: 'mp_mobiles', slug: 'mobiles', name: 'Mobiles', icon: 'fa-mobile-screen-button', kind: 'product', children: [] },
    { category_id: 'mp_vehicles', slug: 'vehicles', name: 'Vehicles', icon: 'fa-car', kind: 'vehicle', children: [] },
    { category_id: 'mp_home_garden', slug: 'home-garden', name: 'Home & Garden', icon: 'fa-seedling', kind: 'product', children: [] },
    { category_id: 'mp_appliances', slug: 'appliances', name: 'Appliances', icon: 'fa-blender', kind: 'product', children: [] },
    { category_id: 'mp_fashion', slug: 'fashion', name: 'Fashion', icon: 'fa-shirt', kind: 'product', children: [] },
    { category_id: 'mp_free_stuff', slug: 'free-stuff', name: 'Free Stuff', icon: 'fa-gift', kind: 'product', children: [] },
];

export async function renderMarketplaceCategoryCityPage(app, params = {}) {
    const categorySlug = decodeURIComponent(params.category || '').toLowerCase();
    const citySlug = decodeURIComponent(params.slug || '').toLowerCase();
    const city = findCity(citySlug);

    app.innerHTML = `
        ${renderNavbar()}
        <div class="container py-xl text-center">
            <div style="width:42px;height:42px;border:4px solid #e2e8f0;border-top-color:#111827;border-radius:50%;animation:rg-spin .8s linear infinite;margin:80px auto 18px;"></div>
            <p style="color:#64748b;font-weight:700;">Loading marketplace category...</p>
        </div>
        <style>@keyframes rg-spin{to{transform:rotate(360deg)}}</style>
    `;
    initNavbar();

    const categoryTree = await loadCategoryTree();
    const categories = flattenCategories(categoryTree).filter(cat => isActiveCategory(cat) && cat.kind !== 'service');
    const category = categories.find(cat =>
        String(cat.slug || '').toLowerCase() === categorySlug ||
        String(cat.category_id || '').toLowerCase() === categorySlug
    );

    if (!category) {
        renderMarketplaceCityPage(app, { country: categorySlug, slug: citySlug });
        return;
    }

    if (!city || !isMarketplaceEnabled(city)) {
        renderNotFound(app, categorySlug, citySlug);
        return;
    }

    const searchResponse = await api.searchListings({
        kind: 'sale',
        category: category.category_id || category.slug,
        city: city.slug || city.city_id,
        sort: 'newest',
        page: 1,
        limit: 24,
    }, true).catch(() => null);
    const searchItems = normalizeSearchResults(searchResponse);
    const items = searchResponse ? searchItems : getLocalCategoryCityListings(city, category);
    const heroImage = city.marketplace_hero_image ? getAssetUrl(city.marketplace_hero_image) : (city.hero_image ? getAssetUrl(city.hero_image) : FALLBACK_HERO);
    const canonical = `https://roommategroups.com/marketplace/${category.slug}/${city.slug}`;
    const pageTitle = `${category.name} for Sale in ${city.name} | RoommateGroups Marketplace`;
    const metaDescription = `Shop ${category.name.toLowerCase()} for sale in ${city.name}. Browse local listings, chat in-app, make offers, and meet safely with RoommateGroups members.`;
    const intro = `Browse ${category.name.toLowerCase()} posted by verified local RoommateGroups members in ${city.name}. Compare prices, message sellers in-app, make an offer, and arrange a safe local handoff.`;

    setSEO({
        title: pageTitle.substring(0, 60),
        description: metaDescription.substring(0, 160),
        canonical,
        ogImage: heroImage,
        schema: buildCategoryCitySchema(city, category, items, canonical, metaDescription),
    });

    app.innerHTML = `
        ${renderNavbar()}
        <style>
            .mp-category-city-page { background:#fff; color:#0f172a; }
            .mp-city-hero { position:relative; min-height:500px; background-image:url('${heroImage}'); background-size:cover; background-position:center; display:flex; align-items:flex-end; }
            .mp-city-hero::before { content:''; position:absolute; inset:0; background:linear-gradient(180deg, rgba(15,23,42,.18), rgba(15,23,42,.86)); }
            .mp-city-hero-content { position:relative; z-index:1; color:#fff; padding:110px 0 64px; }
            .mp-city-breadcrumb { display:flex; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:18px; font-size:.85rem; font-weight:750; color:rgba(255,255,255,.82); }
            .mp-city-breadcrumb a { color:inherit; text-decoration:none; }
            .mp-city-title { max-width:980px; font-size:clamp(2.4rem,4.8vw,4.6rem); line-height:1; letter-spacing:0; font-weight:950; margin:0 0 18px; white-space:normal; }
            .mp-city-sub { max-width:760px; font-size:1.08rem; line-height:1.65; color:rgba(255,255,255,.9); margin:0 0 28px; }
            .mp-city-actions { display:flex; flex-wrap:wrap; gap:12px; align-items:center; }
            .mp-section { padding:72px 0; }
            .mp-section-alt { background:#f8fafc; border-top:1px solid #e8edf4; border-bottom:1px solid #e8edf4; }
            .mp-section-header { display:flex; justify-content:space-between; align-items:flex-end; gap:24px; margin-bottom:32px; }
            .mp-section-header h2 { font-size:1.9rem; font-weight:900; margin:0; color:#172033; }
            .mp-section-header p { color:#64748b; margin:8px 0 0; line-height:1.55; }
            .mp-section-link { color:#0f766e; font-weight:850; text-decoration:none; display:flex; align-items:center; gap:8px; }
            .mp-items-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(230px,1fr)); gap:20px; align-items:start; }
            .mp-empty { text-align:center; padding:46px 24px; border:1px dashed #cbd5e1; border-radius:8px; background:#fff; }
            .mp-empty-icon { width:56px; height:56px; margin:0 auto 16px; border-radius:8px; background:#ecfdf5; color:#0f766e; display:flex; align-items:center; justify-content:center; font-size:1.35rem; }
            .mp-empty h4 { margin:0 0 8px; font-size:1.15rem; font-weight:900; }
            .mp-empty p { color:#64748b; margin:0 0 18px; }
            .mp-context-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:18px; }
            .mp-context-card { background:#fff; border:1px solid #e2e8f0; border-radius:8px; padding:22px; }
            .mp-context-card i { width:42px; height:42px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#111827; color:#fff; margin-bottom:14px; }
            .mp-context-card h3 { margin:0 0 8px; font-size:1rem; font-weight:900; }
            .mp-context-card p { margin:0; color:#64748b; line-height:1.55; }
            @media (max-width:900px) {
                .mp-section-header { align-items:flex-start; flex-direction:column; }
                .mp-context-grid { grid-template-columns:1fr; }
                .mp-city-hero { min-height:460px; }
            }
        </style>
        <main class="mp-category-city-page">
            <section class="mp-city-hero">
                <div class="container mp-city-hero-content">
                    <nav class="mp-city-breadcrumb">
                        <a href="/">Home</a>
                        <i class="fa-solid fa-chevron-right"></i>
                        <a href="/marketplace">Marketplace</a>
                        <i class="fa-solid fa-chevron-right"></i>
                        <a href="/marketplace/${city.slug}">${escHtml(city.name)}</a>
                        <i class="fa-solid fa-chevron-right"></i>
                        <span>${escHtml(category.name)}</span>
                    </nav>
                    <h1 class="mp-city-title">${escHtml(category.name)} for Sale in ${escHtml(city.name)}</h1>
                    <p class="mp-city-sub">${escHtml(intro)}</p>
                    <div class="mp-city-actions">
                        <a href="/search/rooms?kind=sale&city=${encodeURIComponent(city.slug)}&category=${encodeURIComponent(category.category_id || category.slug)}&sort=newest" class="btn btn-primary">
                            <i class="fa-solid fa-magnifying-glass"></i> Browse All ${escHtml(category.name)}
                        </a>
                        <a href="/post-listing?kind=sale" class="btn btn-outline" style="background:#fff;color:#111827;border-color:#fff;">
                            <i class="fa-solid fa-plus"></i> Sell an Item
                        </a>
                    </div>
                </div>
            </section>

            <section class="mp-section">
                <div class="container">
                    <div class="mp-section-header">
                        <div>
                            <h2>Latest ${escHtml(category.name)} Listings</h2>
                            <p>${escHtml(items.length ? `${items.length} active local listings found in ${city.name}.` : `Fresh ${category.name.toLowerCase()} listings will appear here as local members post them.`)}</p>
                        </div>
                        <a href="/search/rooms?kind=sale&city=${encodeURIComponent(city.slug)}&category=${encodeURIComponent(category.category_id || category.slug)}&sort=newest" class="mp-section-link">
                            Search with filters <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                    ${items.length
                        ? `<div class="mp-items-grid" id="mp-category-city-items">${items.map(renderMobileCard).join('')}</div>`
                        : `<div class="mp-empty">
                            <div class="mp-empty-icon"><i class="${iconClass(category.icon)}"></i></div>
                            <h4>No ${escHtml(category.name.toLowerCase())} listings yet</h4>
                            <p>Be the first local member to list ${escHtml(category.name.toLowerCase())} in ${escHtml(city.name)}.</p>
                            <a href="/post-listing?kind=sale" class="btn btn-primary">Post a Listing</a>
                        </div>`
                    }
                </div>
            </section>

            <section class="mp-section mp-section-alt">
                <div class="container">
                    <div class="mp-section-header">
                        <div>
                            <h2>Buy and Sell ${escHtml(category.name)} Safely</h2>
                            <p>RoommateGroups keeps local marketplace deals tied to verified members and in-app chat.</p>
                        </div>
                    </div>
                    <div class="mp-context-grid">
                        <div class="mp-context-card">
                            <i class="fa-solid fa-comments"></i>
                            <h3>Chat in-app</h3>
                            <p>Ask questions, share details, and make offers without exposing your phone number.</p>
                        </div>
                        <div class="mp-context-card">
                            <i class="fa-solid fa-shield-halved"></i>
                            <h3>Meet safely</h3>
                            <p>Choose a public place, inspect the item first, and avoid advance payments.</p>
                        </div>
                        <div class="mp-context-card">
                            <i class="${iconClass(category.icon)}"></i>
                            <h3>Shop locally</h3>
                            <p>Find ${escHtml(category.name.toLowerCase())} from RoommateGroups members in ${escHtml(city.name)}.</p>
                        </div>
                    </div>
                </div>
            </section>
        </main>
    `;

    setTimeout(() => {
        wireCardEvents(app.querySelector('#mp-category-city-items'));
        initNavbar();
    }, 0);
}

function findCity(slug) {
    return db.cities.findOne(c => String(c.slug || '').toLowerCase() === slug);
}

function isMarketplaceEnabled(city) {
    if (!city) return false;
    return city.marketplace_enabled === true || city.marketplace_enabled === 1 || city.marketplace_enabled === '1';
}

async function loadCategoryTree() {
    const tree = await api.getCategoryTree(true).catch(() => null);
    return Array.isArray(tree) && tree.length ? tree : FALLBACK_CATEGORIES;
}

function flattenCategories(categories = []) {
    const out = [];
    const visit = (cat, parent = null) => {
        if (!cat) return;
        const normalized = { ...cat, parent };
        out.push(normalized);
        (cat.children || []).forEach(child => visit(child, normalized));
    };
    categories.forEach(cat => visit(cat));
    return out;
}

function isActiveCategory(cat) {
    return cat && cat.is_active !== false && cat.is_active !== 0 && cat.is_active !== '0';
}

function normalizeSearchResults(response) {
    if (Array.isArray(response)) return response;
    if (Array.isArray(response?.results)) return response.results;
    return [];
}

function getLocalCategoryCityListings(city, category) {
    const ids = new Set(collectCategoryIds(category));
    return db.listings.find(l => {
        const listingCity = l.city === city.city_id || l.city === city.slug;
        return listingCity && l.status === 'active' && l.kind === 'sale' && ids.has(l.category_id);
    }).slice(0, 24);
}

function collectCategoryIds(category) {
    const ids = [];
    const visit = cat => {
        if (!cat) return;
        if (cat.category_id) ids.push(cat.category_id);
        if (cat.slug) ids.push(cat.slug);
        (cat.children || []).forEach(visit);
    };
    visit(category);
    return ids;
}

function renderNotFound(app, categorySlug, citySlug) {
    setSEO({
        title: 'Marketplace Category Not Found | RoommateGroups',
        description: 'This marketplace category page is not available.',
        canonical: `https://roommategroups.com/marketplace/${categorySlug}/${citySlug}`,
        robots: 'noindex, follow',
    });
    app.innerHTML = `
        ${renderNavbar()}
        <div class="container py-xl text-center">
            <h2>Marketplace page not found</h2>
            <p>Sorry, this category or city marketplace page is not available.</p>
            <a href="/marketplace" class="btn btn-primary mt-lg">Back to Marketplace</a>
        </div>
    `;
    initNavbar();
}

function buildCategoryCitySchema(city, category, items, canonical, description) {
    const itemList = {
        '@type': 'ItemList',
        name: `${category.name} for sale in ${city.name}`,
        itemListElement: items.slice(0, 12).map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `https://roommategroups.com/listing/${item.listing_id}`,
            item: buildProductOfferSchema({
                name: item.title,
                description: item.description,
                image: firstImage(item),
                url: `https://roommategroups.com/listing/${item.listing_id}`,
                price: item.price ?? item.rent,
                priceCurrency: item.price_currency || item.currency || 'USD',
                availability: item.status === 'sold' ? 'https://schema.org/SoldOut' : 'https://schema.org/InStock',
                seller: item.user_details || { display_name: item.seller_name || 'RoommateGroups member' },
            }),
        })),
    };

    return {
        '@context': 'https://schema.org',
        '@graph': [
            {
                '@type': 'CollectionPage',
                name: `${category.name} for Sale in ${city.name}`,
                description,
                url: canonical,
                isPartOf: {
                    '@type': 'WebSite',
                    name: 'RoommateGroups',
                    url: 'https://roommategroups.com',
                },
            },
            itemList,
        ],
    };
}

function firstImage(item) {
    let images = item.images || item.photos || [];
    if (typeof images === 'string') {
        try { images = JSON.parse(images); } catch (e) { images = []; }
    }
    const raw = Array.isArray(images) ? images[0] : images;
    if (raw && typeof raw === 'object') return getAssetUrl(raw.medium || raw.thumb || raw.full || raw.url || '');
    return raw ? getAssetUrl(raw) : FALLBACK_CATEGORY_IMAGE;
}

function wireCardEvents(container) {
    if (!container) return;
    container.querySelectorAll('.mobile-card').forEach(card => {
        card.addEventListener('click', e => {
            if (e.target.closest('.mobile-card-heart')) return;
            const poster = e.target.closest('.mobile-card-poster');
            if (poster) {
                e.stopPropagation();
                const uid = poster.dataset.userId;
                if (uid) navigate(`/profile/${uid}`);
                return;
            }
            const id = card.dataset.listingId;
            if (id) navigate(`/listing/${id}`);
        });
    });

    container.querySelectorAll('.mobile-card-heart').forEach(btn => {
        btn.addEventListener('click', async e => {
            e.stopPropagation();
            const user = getCurrentUser();
            if (!user) {
                sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
                navigate('/auth/login');
                return;
            }
            const dbUser = db.users.findById(user.user_id || user.id);
            if (!dbUser) return;
            const saved = parseJsonArray(dbUser.saved_listings);
            const listingId = btn.dataset.listingId;
            const nextSaved = !saved.includes(listingId);
            const updated = nextSaved ? [...saved, listingId] : saved.filter(id => id !== listingId);
            btn.dataset.saved = String(nextSaved);
            btn.style.color = nextSaved ? '#000' : '#cbd5e1';
            btn.querySelector('svg')?.setAttribute('fill', nextSaved ? 'currentColor' : 'none');
            await db.users.update(dbUser.user_id || dbUser.id, { saved_listings: updated });
        });
    });
}

function parseJsonArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try { return JSON.parse(value || '[]'); } catch (e) { return []; }
    }
    return [];
}

function iconClass(icon) {
    if (!icon) return 'fa-solid fa-box-open';
    if (icon.includes(' ')) return icon;
    return `fa-solid ${icon}`;
}

function escHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
