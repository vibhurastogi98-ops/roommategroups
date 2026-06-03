import { renderNavbar, initNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { api } from '../services/api.js';
import { db } from '../services/db.js';
import { getAssetUrl } from '../services/assets.js';
import { setSEO } from '../seo.js';

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
}

function flattenCategories(items = []) {
    return items.flatMap(cat => [cat, ...flattenCategories(cat.children || [])]);
}

function iconClass(icon) {
    const raw = String(icon || 'fa-tag').trim();
    if (raw.includes('fa-solid') || raw.includes('fa-regular') || raw.includes('fa-brands') || raw.includes('fab ')) {
        return raw.replace(/\bfas\b/g, 'fa-solid').replace(/\bfab\b/g, 'fa-brands');
    }
    return raw.startsWith('fa-') ? `fa-solid ${raw}` : `fa-solid fa-${raw}`;
}

function collectCategoryIds(category) {
    const ids = [];
    const visit = cat => {
        if (!cat) return;
        if (cat.category_id) ids.push(String(cat.category_id));
        if (cat.slug) ids.push(String(cat.slug));
        (cat.children || []).forEach(visit);
    };
    visit(category);
    return ids;
}

function getCategoryNav(category, allCategories) {
    const topCategories = allCategories.filter(cat => !cat.parent_id);
    const parent = category?.parent_id
        ? allCategories.find(cat => String(cat.category_id) === String(category.parent_id))
        : null;
    const root = parent || (category?.children?.length ? category : null);
    const items = root
        ? [
            { category: root, label: `All ${root.name}` },
            ...(root.children || []).map(child => ({ category: child, label: child.name })),
        ]
        : topCategories.map(cat => ({ category: cat, label: cat.name }));
    return { root, items };
}

function listingId(listing) {
    return listing?.listing_id || listing?.id || '';
}

function isActiveSaleListing(listing) {
    return listing?.status === 'active' && listing?.is_active !== false && String(listing?.kind || '').toLowerCase() === 'sale';
}

function localCategoryListings(category) {
    const ids = new Set(collectCategoryIds(category));
    return db.listings.find(l => isActiveSaleListing(l) && ids.has(String(l.category_id || l.category || '')));
}

function mergeListings(primary = [], fallback = []) {
    const seen = new Set();
    return [...primary, ...fallback].filter(listing => {
        const id = listingId(listing);
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
    });
}

function photoUrl(listing) {
    let photos = listing.images || listing.photos || [];
    if (typeof photos === 'string') { try { photos = JSON.parse(photos || '[]'); } catch (_) { photos = []; } }
    const first = Array.isArray(photos) ? photos[0] : photos;
    const src = typeof first === 'object' && first ? (first.medium || first.thumb || first.full) : first;
    return getAssetUrl(src || 'https://images.unsplash.com/photo-1517705008128-361805f42e86?w=800&h=600&fit=crop');
}

function listingCard(listing) {
    const price = listing.price ?? listing.rent;
    const cityValue = listing.city || listing.city_id;
    const city = db.cities.findById(cityValue)?.name || String(cityValue || '').replace(/^city_/, '').replace(/[_-]+/g, ' ');
    return `
        <a class="cat-listing-card" href="/listing/${escHtml(listing.listing_id)}">
            <img src="${photoUrl(listing)}" alt="${escHtml(listing.title)}" loading="lazy">
            <div class="cat-card-body">
                <div class="cat-card-price">${price !== undefined && price !== null ? '$' + Number(price).toLocaleString() : 'Price TBC'}</div>
                <h3>${escHtml(listing.title || 'Untitled listing')}</h3>
                <p>${escHtml([listing.neighborhood, listing.area, city].filter(Boolean).join(', ') || 'Location TBC')}</p>
            </div>
        </a>
    `;
}

export function renderCategoryPage(app, params) {
    const slug = decodeURIComponent(params.slug || '').toLowerCase();
    setSEO({
        title: 'Browse Category | RoommateGroups',
        description: 'Browse RoommateGroups marketplace listings by category.',
        canonical: `https://roommategroups.com/category/${slug}`,
    });

    app.innerHTML = `
        ${renderNavbar()}
        <div class="cat-page">
            <div class="cat-shell">
                <div class="cat-loading">Loading category...</div>
            </div>
        </div>
        ${renderFooter()}
    `;
    initNavbar();

    api.getCategoryTree(true).then(async tree => {
        const categories = Array.isArray(tree) ? tree : [];
        const allCategories = flattenCategories(categories).filter(cat => cat.is_active !== false && String(cat.kind || '').toLowerCase() !== 'service');
        const category = allCategories.find(cat =>
            String(cat.slug || '').toLowerCase() === slug ||
            String(cat.category_id || '').toLowerCase() === slug
        );

        if (!category) {
            app.innerHTML = `
                <style>
                    .cat-page { background:#f8fafc; min-height:100vh; padding:96px 24px 72px; }
                    .cat-shell { max-width:1180px; margin:0 auto; }
                    .cat-empty { background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:42px; color:#64748b; text-align:center; }
                    .cat-empty h2 { margin:0 0 8px; color:#0f172a; }
                </style>
                ${renderNavbar()}
                <div class="cat-page"><div class="cat-shell"><div class="cat-empty">
                    <h2>Category not found</h2>
                    <p>This marketplace category is not available yet.</p>
                    <a href="/marketplace" class="btn btn-primary mt-md">Browse Marketplace</a>
                </div></div></div>
                ${renderFooter()}
            `;
            initNavbar();
            return;
        }

        const categoryKey = category.category_id || category.slug || slug;
        const listingPayload = await api.searchListings({ kind: 'sale', category: categoryKey, page: 1, limit: 48, sort: 'newest' }, true).catch(() => ({ results: [] }));
        const apiListings = Array.isArray(listingPayload) ? listingPayload : listingPayload?.results || [];
        const listings = mergeListings(apiListings.filter(isActiveSaleListing), localCategoryListings(category));
        const categoryNav = getCategoryNav(category, allCategories);
        const childCards = categoryNav.items.map(item => {
            const navCat = item.category;
            const isSelected = String(navCat.category_id || '') === String(category.category_id || '')
                || String(navCat.slug || '').toLowerCase() === String(category.slug || '').toLowerCase();
            return `
            <a class="cat-child-card ${isSelected ? 'active' : ''}" href="/category/${escHtml(navCat.slug || navCat.category_id)}" aria-current="${isSelected ? 'page' : 'false'}">
                <i class="${iconClass(navCat.icon)}"></i>
                <span>${escHtml(item.label)}</span>
            </a>
        `;
        }).join('');
        const categoryName = category?.name || 'Category';
        const lowerName = categoryName.toLowerCase();
        const breadcrumbTrail = categoryNav.root && categoryNav.root.category_id !== category.category_id
            ? `<a href="/category/${escHtml(categoryNav.root.slug || categoryNav.root.category_id)}">${escHtml(categoryNav.root.name)}</a> / ${escHtml(categoryName)}`
            : escHtml(categoryName);

        app.innerHTML = `
            <style>
                .cat-page { background:#f8fafc; min-height:100vh; padding:96px 24px 72px; }
                .cat-shell { max-width:1180px; margin:0 auto; }
                .cat-hero { margin-bottom:28px; display:grid; grid-template-columns:minmax(0,1fr) auto; gap:24px; align-items:end; }
                .cat-breadcrumb { color:#64748b; font-size:.86rem; font-weight:800; margin-bottom:12px; }
                .cat-breadcrumb a { color:#64748b; text-decoration:none; }
                .cat-hero h1 { margin:0 0 8px; font-size:2.2rem; color:#0f172a; font-weight:900; }
                .cat-hero p { margin:0; color:#64748b; font-size:1rem; line-height:1.55; max-width:680px; }
                .cat-hero-actions { display:flex; gap:12px; flex-wrap:wrap; justify-content:flex-end; }
                .cat-children { display:flex; flex-wrap:wrap; gap:12px; margin:24px 0 32px; }
                .cat-child-card { display:flex; align-items:center; gap:10px; padding:12px 16px; border-radius:12px; background:#fff; border:1px solid #e2e8f0; color:#1e293b; text-decoration:none; font-weight:800; }
                .cat-child-card:hover { border-color:#0f172a; }
                .cat-child-card.active { background:#0f172a; border-color:#0f172a; color:#fff; box-shadow:0 10px 22px rgba(15,23,42,.12); }
                .cat-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:20px; }
                .cat-listing-card { background:#fff; border:1px solid #e2e8f0; border-radius:16px; overflow:hidden; color:inherit; text-decoration:none; transition:transform .18s, box-shadow .18s; }
                .cat-listing-card:hover { transform:translateY(-3px); box-shadow:0 16px 30px rgba(15,23,42,.08); }
                .cat-listing-card img { width:100%; aspect-ratio:4/3; object-fit:cover; display:block; background:#e2e8f0; }
                .cat-card-body { padding:15px; }
                .cat-card-price { font-weight:900; color:#0f172a; margin-bottom:5px; }
                .cat-card-body h3 { margin:0 0 6px; font-size:1rem; color:#1e293b; }
                .cat-card-body p { margin:0; color:#64748b; font-size:.86rem; }
                .cat-empty, .cat-loading { background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:42px; color:#64748b; text-align:center; }
                .cat-empty-icon { width:58px; height:58px; border-radius:16px; background:#f1f5f9; color:#0f172a; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; font-size:1.35rem; }
                .cat-empty h3 { margin:0 0 8px; color:#0f172a; font-size:1.25rem; }
                .cat-empty p { margin:0 auto 22px; max-width:520px; line-height:1.55; }
                .cat-empty-actions { display:flex; gap:12px; flex-wrap:wrap; justify-content:center; }
                .cat-tip-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:16px; margin-top:32px; }
                .cat-tip { background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:20px; }
                .cat-tip i { color:#0f172a; margin-bottom:12px; }
                .cat-tip strong { display:block; color:#0f172a; margin-bottom:6px; }
                .cat-tip span { display:block; color:#64748b; font-size:.88rem; line-height:1.45; }
                @media (max-width:760px) {
                    .cat-page { padding:84px 16px 56px; }
                    .cat-hero { grid-template-columns:1fr; }
                    .cat-hero-actions { justify-content:flex-start; }
                    .cat-tip-grid { grid-template-columns:1fr; }
                }
            </style>
            ${renderNavbar()}
            <div class="cat-page">
                <div class="cat-shell">
                    <div class="cat-hero">
                        <div>
                            <div class="cat-breadcrumb"><a href="/marketplace">Marketplace</a> / ${breadcrumbTrail}</div>
                            <h1>${escHtml(categoryName)}</h1>
                            <p>${listings.length} active ${listings.length === 1 ? 'listing' : 'listings'} for sale. Browse ${escHtml(lowerName)} from verified RoommateGroups members, or list your own item in minutes.</p>
                        </div>
                        <div class="cat-hero-actions">
                            <a href="/search/rooms?kind=sale&category=${encodeURIComponent(categoryKey)}" class="btn btn-outline">Search ${escHtml(categoryName)}</a>
                            <a href="/post-listing?kind=sale&category=${encodeURIComponent(categoryKey)}" class="btn btn-primary">Post ${escHtml(categoryName)}</a>
                        </div>
                    </div>
                    ${childCards ? `<div class="cat-children">${childCards}</div>` : ''}
                    ${listings.length ? `<div class="cat-grid">${listings.map(listingCard).join('')}</div>` : `
                        <div class="cat-empty">
                            <div class="cat-empty-icon"><i class="${iconClass(category.icon)}"></i></div>
                            <h3>No ${escHtml(lowerName)} listings yet</h3>
                            <p>Fresh ${escHtml(lowerName)} items will appear here as members post them. You can be the first to list in this category or browse every marketplace item.</p>
                            <div class="cat-empty-actions">
                                <a href="/post-listing?kind=sale&category=${encodeURIComponent(categoryKey)}" class="btn btn-primary">Post ${escHtml(categoryName)}</a>
                                <a href="/marketplace" class="btn btn-outline">Browse Marketplace</a>
                            </div>
                        </div>
                    `}
                    <div class="cat-tip-grid">
                        <div class="cat-tip"><i class="fa-solid fa-shield-halved"></i><strong>Verified members</strong><span>Trade with RoommateGroups users and keep contact in-app.</span></div>
                        <div class="cat-tip"><i class="fa-solid fa-tags"></i><strong>Local prices</strong><span>Compare nearby listings and make an offer when available.</span></div>
                        <div class="cat-tip"><i class="fa-solid fa-handshake"></i><strong>Safe handoff</strong><span>Meet in public and inspect the item before payment.</span></div>
                    </div>
                </div>
            </div>
            ${renderFooter()}
        `;
        initNavbar();
    }).catch(err => {
        app.querySelector('.cat-shell').innerHTML = `<div class="cat-empty">${escHtml(err.message || 'Could not load category.')}</div>`;
    });
}
