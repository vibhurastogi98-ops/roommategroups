import { db } from '../services/db.js';
import { navigate } from '../router.js';
import { getCurrentUser } from '../services/auth.js';
import { getAssetUrl } from '../services/assets.js';
import { renderNavbar, initNavbar } from '../components/navbar.js';
import { setSEO } from '../seo.js';
import { api } from '../services/api.js';
import { renderMobileCard } from '../../../mobile/src/components/MobileCard.js';

const FALLBACK_HERO = 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1600&h=700&fit=crop';
const FALLBACK_CITY_IMG = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop';

export function renderMarketplaceCityPage(app, params = {}) {
    const citySlug = (params.slug || '').toLowerCase();
    const city = db.cities.findOne(c => (c.slug || '').toLowerCase() === citySlug);
    const marketplaceEnabled = isMarketplaceEnabled(city);

    if (!city || !marketplaceEnabled) {
        setSEO({
            title: 'Marketplace City Not Found | RoommateGroups',
            description: 'This marketplace city page is not available.',
            canonical: citySlug ? `https://roommategroups.com/marketplace/${citySlug}` : 'https://roommategroups.com/marketplace',
            robots: 'noindex, follow',
        });
        app.innerHTML = `
            <div class="container py-xl text-center">
                <h2>City not found</h2>
                <p>Sorry, we couldn't find the city you're looking for.</p>
                <a href="/" class="btn btn-primary mt-lg">Back to Home</a>
            </div>
        `;
        return;
    }

    const heroImage = city.marketplace_hero_image ? getAssetUrl(city.marketplace_hero_image) : (city.hero_image ? getAssetUrl(city.hero_image) : FALLBACK_HERO);
    const saleItems = getCitySaleItems(city);
    const latestPosts = db.posts.findAll().sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 3);
    const avgPrice = saleItems.length
        ? Math.round(saleItems.reduce((sum, l) => sum + Number(l.price || l.rent || 0), 0) / saleItems.length)
        : 0;
    const reviews = getMarketplaceReviews(city);
    const faqs = getMarketplaceFaqs(city);
    const nearbyCities = getNearbyMarketplaceCities(city);
    const description = city.marketplace_description || `Buy and sell furniture, electronics, vehicles, and everyday essentials with local members in ${city.name}.`;

    app.innerHTML = `
        ${renderNavbar()}
        <style>
            .mp-city-page { background:#fff; color:#0f172a; }
            .mp-city-hero { position:relative; min-height:560px; background-image:url('${heroImage}'); background-size:cover; background-position:center; display:flex; align-items:flex-end; }
            .mp-city-hero::before { content:''; position:absolute; inset:0; background:linear-gradient(180deg, rgba(15,23,42,.18), rgba(15,23,42,.84)); }
            .mp-city-hero-content { position:relative; z-index:1; color:#fff; padding:110px 0 70px; }
            .mp-city-breadcrumb { display:flex; align-items:center; gap:10px; margin-bottom:18px; font-size:.85rem; font-weight:750; color:rgba(255,255,255,.82); }
            .mp-city-breadcrumb a { color:inherit; text-decoration:none; }
            .mp-city-title { max-width:1100px; font-size:clamp(2.8rem,4.6vw,4.8rem); line-height:.98; letter-spacing:0; font-weight:950; margin:0 0 18px; white-space:nowrap; }
            .mp-city-sub { max-width:720px; font-size:1.08rem; line-height:1.65; color:rgba(255,255,255,.9); margin:0 0 28px; }
            .mp-city-actions { display:flex; flex-wrap:wrap; gap:12px; align-items:center; }
            .mp-stat-row { display:flex; flex-wrap:wrap; gap:12px; margin-top:28px; }
            .mp-stat-pill { display:flex; align-items:center; gap:10px; padding:11px 15px; border:1px solid rgba(255,255,255,.28); background:rgba(255,255,255,.16); border-radius:8px; backdrop-filter:blur(14px); }
            .mp-stat-pill strong { display:block; font-size:1rem; color:#fff; }
            .mp-stat-pill span { display:block; font-size:.72rem; color:rgba(255,255,255,.75); font-weight:750; text-transform:uppercase; }
            .mp-section { padding:78px 0; }
            .mp-section-alt { background:#f8fafc; border-top:1px solid #e8edf4; border-bottom:1px solid #e8edf4; }
            .mp-section-header { display:flex; justify-content:space-between; align-items:flex-end; gap:24px; margin-bottom:36px; }
            .mp-section-header h2 { font-size:1.9rem; font-weight:900; margin:0; color:#172033; }
            .mp-section-header p { color:#64748b; margin:8px 0 0; line-height:1.55; }
            .mp-section-link { color:#0f766e; font-weight:850; text-decoration:none; display:flex; align-items:center; gap:8px; }
            .mp-items-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:20px; align-items:start; }
            .mp-items-grid .mobile-card { width:100%; max-width:340px; margin:0; align-self:start; }
            .mp-items-grid .mobile-card > div:first-child { aspect-ratio:4/3 !important; }
            .mp-empty { text-align:center; padding:46px 24px; border:1px dashed #cbd5e1; border-radius:8px; background:#fff; }
            .mp-empty-icon { width:56px; height:56px; margin:0 auto 16px; border-radius:8px; background:#ecfdf5; color:#0f766e; display:flex; align-items:center; justify-content:center; font-size:1.35rem; }
            .mp-empty h4 { margin:0 0 8px; font-size:1.15rem; font-weight:900; }
            .mp-empty p { color:#64748b; margin:0 0 18px; }
            .mp-category-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:16px; }
            .mp-category-tile { display:flex; min-height:126px; flex-direction:column; justify-content:space-between; padding:18px; border:1px solid #e2e8f0; border-radius:8px; background:#fff; color:#0f172a; text-decoration:none; box-shadow:0 8px 20px rgba(15,23,42,.04); transition:transform .18s ease, border-color .18s ease, box-shadow .18s ease; }
            .mp-category-tile:hover { transform:translateY(-3px); border-color:#94a3b8; box-shadow:0 14px 28px rgba(15,23,42,.08); }
            .mp-category-icon { width:44px; height:44px; border-radius:8px; background:#f0fdfa; color:#0f766e; display:flex; align-items:center; justify-content:center; font-size:1.1rem; }
            .mp-category-name { font-weight:900; line-height:1.25; }
            .mp-category-meta { color:#64748b; font-size:.78rem; font-weight:750; }
            .mp-trust-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:20px; }
            .mp-trust-card { padding:24px; border:1px solid #e2e8f0; border-radius:8px; background:#fff; }
            .mp-trust-icon { width:42px; height:42px; border-radius:8px; background:#111827; color:#fff; display:flex; align-items:center; justify-content:center; margin-bottom:16px; }
            .mp-trust-card h3 { margin:0 0 8px; font-size:1rem; font-weight:900; }
            .mp-trust-card p { margin:0; color:#64748b; line-height:1.55; }
            .gd-reviews-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
            .gd-review-card { background:#F8FAFC; padding:32px; border-radius:8px; border:1px solid #e8edf4; }
            .gd-review-stars { color:#f59e0b; margin-bottom:16px; font-size:.9rem; }
            .gd-review-text { font-size:1.02rem; line-height:1.6; color:#475569; margin-bottom:24px; font-style:italic; }
            .gd-review-user { display:flex; align-items:center; gap:12px; }
            .gd-review-avatar { width:48px; height:48px; border-radius:50%; object-fit:cover; border:2px solid #fff; box-shadow:0 4px 10px rgba(0,0,0,.1); }
            .gd-review-name { font-size:.95rem; font-weight:750; color:#1a2740; display:block; }
            .gd-review-date { font-size:.8rem; color:#8a94a6; }
            .gd-blog-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:24px; }
            .gd-blog-card { background:#fff; border-radius:8px; overflow:hidden; border:1px solid #e8edf4; text-decoration:none; color:inherit; display:flex; flex-direction:column; transition:all .2s ease; }
            .gd-blog-card:hover { transform:translateY(-4px); box-shadow:0 18px 34px rgba(15,23,42,.08); }
            .gd-blog-img { position:relative; height:180px; overflow:hidden; background:#e2e8f0; }
            .gd-blog-img img { width:100%; height:100%; object-fit:cover; }
            .gd-blog-cat { position:absolute; top:12px; left:12px; background:#0f766e; color:#fff; font-size:.65rem; font-weight:850; padding:4px 10px; border-radius:6px; text-transform:uppercase; }
            .gd-blog-body { padding:22px; display:flex; flex-direction:column; gap:10px; flex:1; }
            .gd-blog-title { font-size:1.08rem; font-weight:900; color:#172033; line-height:1.4; }
            .gd-blog-excerpt { font-size:.9rem; color:#64748b; line-height:1.6; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; }
            .gd-blog-footer { margin-top:auto; padding-top:14px; display:flex; justify-content:space-between; color:#8a94a6; font-size:.8rem; font-weight:700; border-top:1px solid #f1f5f9; }
            .gd-faq-container { max-width:900px; margin:0 auto; }
            .home-faq-item { display:flex; gap:20px; padding:26px 0; border-bottom:1px solid #eef2f6; }
            .home-faq-icon { width:44px; height:44px; border-radius:8px; background:#f1f5f9; color:#64748b; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
            .home-faq-q { font-size:1.05rem; font-weight:900; color:#172033; margin-bottom:8px; }
            .home-faq-a { color:#64748b; line-height:1.6; }
            .gd-related-scroll { display:flex; gap:20px; overflow-x:auto; padding-bottom:20px; scrollbar-width:none; }
            .gd-related-scroll::-webkit-scrollbar { display:none; }
            .gd-related-card { min-width:280px; background:#fff; border-radius:8px; overflow:hidden; border:1px solid #e8edf4; text-decoration:none; color:inherit; flex-shrink:0; transition:all .2s ease; }
            .gd-related-card:hover { transform:translateY(-4px); box-shadow:0 12px 26px rgba(15,23,42,.08); }
            .gd-related-img { height:160px; overflow:hidden; background:#e2e8f0; }
            .gd-related-img img { width:100%; height:100%; object-fit:cover; }
            .gd-related-body { padding:18px; }
            .gd-related-name { margin:0 0 8px; font-size:1.08rem; font-weight:900; }
            .gd-related-meta { color:#64748b; font-size:.84rem; display:flex; align-items:center; gap:12px; }
            @media (max-width:900px) {
                .mp-trust-grid, .gd-reviews-grid, .gd-blog-grid { grid-template-columns:1fr; }
                .mp-section-header { align-items:flex-start; flex-direction:column; }
                .mp-city-hero { min-height:520px; }
                .mp-city-title { white-space:normal; font-size:clamp(2.4rem,12vw,4rem); }
            }
        </style>
        <div class="mp-city-page">
            <section class="mp-city-hero">
                <div class="container mp-city-hero-content">
                    <nav class="mp-city-breadcrumb">
                        <a href="/">Home</a>
                        <i class="fa-solid fa-chevron-right"></i>
                        <a href="/marketplace">Marketplace</a>
                        <i class="fa-solid fa-chevron-right"></i>
                        <span>${escHtml(city.name)}</span>
                    </nav>
                    <h1 class="mp-city-title">Buy & Sell in ${escHtml(city.name)}</h1>
                    <p class="mp-city-sub">${escHtml(stripHtml(description))}</p>
                    <div class="mp-city-actions">
                        <a href="/search/rooms?kind=sale&city=${encodeURIComponent(city.slug)}&sort=newest" class="btn btn-primary">
                            <i class="fa-solid fa-store"></i> Browse Items
                        </a>
                        <a href="/post-listing?kind=sale" class="btn btn-outline" style="background:#fff;color:#111827;border-color:#fff;">
                            <i class="fa-solid fa-plus"></i> Sell Something
                        </a>
                    </div>
                    <div class="mp-stat-row">
                        <div class="mp-stat-pill"><i class="fa-solid fa-box-open"></i><div><strong>${saleItems.length}</strong><span>Active Items</span></div></div>
                        <div class="mp-stat-pill"><i class="fa-solid fa-tag"></i><div><strong>${avgPrice ? '$' + avgPrice.toLocaleString() : 'Varies'}</strong><span>Avg. Price</span></div></div>
                        <div class="mp-stat-pill"><i class="fa-solid fa-shield-halved"></i><div><strong>Local</strong><span>Safer Selling</span></div></div>
                    </div>
                </div>
            </section>

            <section class="mp-section">
                <div class="container">
                    <div class="mp-section-header">
                        <div>
                            <h2>Items for Sale in ${escHtml(city.name)}</h2>
                            <p>Fresh marketplace listings from nearby members.</p>
                        </div>
                        <a href="/search/rooms?kind=sale&city=${encodeURIComponent(city.slug)}&sort=newest" class="mp-section-link">
                            View all <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                    ${saleItems.length
                        ? `<div class="mp-items-grid" id="mp-city-items">${saleItems.slice(0, 8).map(renderMobileCard).join('')}</div>`
                        : `<div class="mp-empty">
                            <div class="mp-empty-icon"><i class="fa-solid fa-box-open"></i></div>
                            <h4>No items for sale yet</h4>
                            <p>Be the first local member to list furniture, electronics, or home essentials in ${escHtml(city.name)}.</p>
                            <a href="/post-listing?kind=sale" class="btn btn-primary">Post a Listing</a>
                        </div>`
                    }
                </div>
            </section>

            <section class="mp-section mp-section-alt">
                <div class="container">
                    <div class="mp-section-header">
                        <div>
                            <h2>Shop by Category</h2>
                            <p>Browse local items by the categories people search most.</p>
                        </div>
                    </div>
                    <div class="mp-category-grid" id="mp-city-categories">
                        ${renderCategorySkeleton()}
                    </div>
                </div>
            </section>

            <section class="mp-section">
                <div class="container">
                    <div class="mp-section-header">
                        <div>
                            <h2>Safe Local Selling</h2>
                            <p>Marketplace habits that make handoffs smoother for buyers and sellers.</p>
                        </div>
                    </div>
                    <div class="mp-trust-grid">
                        <div class="mp-trust-card">
                            <div class="mp-trust-icon"><i class="fa-solid fa-location-dot"></i></div>
                            <h3>Meet Publicly</h3>
                            <p>Choose a visible public place and bring a friend for higher-value purchases.</p>
                        </div>
                        <div class="mp-trust-card">
                            <div class="mp-trust-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
                            <h3>Inspect First</h3>
                            <p>Check condition, accessories, and serial numbers before money changes hands.</p>
                        </div>
                        <div class="mp-trust-card">
                            <div class="mp-trust-icon"><i class="fa-solid fa-comments"></i></div>
                            <h3>Keep Chat Here</h3>
                            <p>Use RoommateGroups messages so offers, details, and safety signals stay together.</p>
                        </div>
                    </div>
                </div>
            </section>

            <section class="mp-section mp-section-alt">
                <div class="container">
                    <div class="mp-section-header">
                        <div>
                            <h2>Community Reviews</h2>
                            <p>What local buyers and sellers are saying about the ${escHtml(city.name)} marketplace.</p>
                        </div>
                    </div>
                    <div class="gd-reviews-grid">
                        ${reviews.map(renderReviewCard).join('')}
                    </div>
                </div>
            </section>

            <section class="mp-section">
                <div class="container">
                    <div class="mp-section-header">
                        <div>
                            <h2>Latest from the Blog</h2>
                            <p>Moving tips, neighborhood guides, and useful local advice.</p>
                        </div>
                        <a href="/blog" class="mp-section-link">Read all posts <i class="fa-solid fa-arrow-right"></i></a>
                    </div>
                    <div class="gd-blog-grid">
                        ${latestPosts.map(renderBlogCard).join('')}
                    </div>
                </div>
            </section>

            <section class="mp-section mp-section-alt">
                <div class="container gd-faq-container">
                    <div class="mp-section-header" style="justify-content:center;text-align:center;">
                        <div>
                            <h2>Frequently Asked Questions</h2>
                            <p>How buying and selling works in ${escHtml(city.name)}.</p>
                        </div>
                    </div>
                    <div class="home-faq-list">
                        ${faqs.map(renderFaq).join('')}
                    </div>
                </div>
            </section>

            <section class="mp-section">
                <div class="container">
                    <div class="mp-section-header">
                        <div>
                            <h2>Explore Nearby Cities</h2>
                            <p>Find more local marketplace pages close to ${escHtml(city.name)}.</p>
                        </div>
                        <a href="/marketplace" class="mp-section-link">Marketplace home <i class="fa-solid fa-arrow-right"></i></a>
                    </div>
                    <div class="gd-related-scroll">
                        ${nearbyCities.length ? nearbyCities.map(renderNearbyCity).join('') : '<p style="color:#64748b;">Nearby marketplace pages are coming soon.</p>'}
                    </div>
                </div>
            </section>
        </div>
    `;

    setSEO({
        title: (city.marketplace_meta_title || `Buy & Sell in ${city.name} | RoommateGroups Marketplace`).substring(0, 60),
        description: (city.marketplace_meta_description || `Shop local furniture, electronics, vehicles, and essentials in ${city.name} on RoommateGroups Marketplace.`).substring(0, 160),
        canonical: `https://roommategroups.com/marketplace/${city.slug}`,
        ogImage: heroImage,
        schema: buildMarketplaceSchema(city, saleItems, faqs),
    });

    setTimeout(() => {
        wireCardEvents(app.querySelector('#mp-city-items'));
        loadCategoryTiles(app, city);
        initNavbar();
    }, 0);
}

function isMarketplaceEnabled(city) {
    if (!city) return false;
    return city.marketplace_enabled === true || city.marketplace_enabled === 1 || city.marketplace_enabled === '1';
}

function listingMatchesCity(listing, city) {
    const listingCity = String(listing?.city || '').toLowerCase();
    return listingCity === String(city.city_id || '').toLowerCase()
        || listingCity === String(city.slug || '').toLowerCase()
        || listingCity === String(city.name || '').toLowerCase();
}

function getCitySaleItems(city) {
    return db.listings.find(l =>
        listingMatchesCity(l, city)
        && l.status === 'active'
        && String(l.kind || 'rental').toLowerCase() === 'sale'
    ).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

function getMarketplaceReviews(city) {
    const reviews = Array.isArray(city.marketplace_reviews) ? city.marketplace_reviews : [];
    if (reviews.length) return reviews;
    return [
        { name: 'Maya Patel', date: '2 days ago', rating: 5, text: `Sold a desk in ${city.name} in one afternoon. The chat made pickup easy to coordinate.` },
        { name: 'Alex Romero', date: '1 week ago', rating: 5, text: `Picked up a sofa from someone nearby and avoided shipping fees. Smooth local handoff.` },
        { name: 'Nina Brooks', date: '3 weeks ago', rating: 4, text: `Useful for furnishing a new place after finding a room. I like that profiles are connected to the community.` },
    ];
}

function getMarketplaceFaqs(city) {
    const faqs = Array.isArray(city.marketplace_faq_items) ? city.marketplace_faq_items : [];
    if (faqs.length) return faqs.map(f => ({ q: f.question || f.q, a: f.answer || f.a }));
    return [
        { q: `How do I buy safely in ${city.name}?`, a: 'Meet in a public place, inspect the item before paying, and keep conversations in RoommateGroups chat.' },
        { q: 'Can I make an offer before messaging?', a: 'Yes. Item listings support offers, and accepted offers can continue inside the existing chat thread.' },
        { q: 'What can I sell?', a: 'Furniture, electronics, vehicles, home goods, appliances, fashion, and other everyday local items are welcome.' },
        { q: 'Can I list a room from this marketplace page?', a: 'Rooms still use the rental flow. Use the room search and post flow when you want to list housing.' },
    ];
}

async function loadCategoryTiles(app, city) {
    const grid = app.querySelector('#mp-city-categories');
    if (!grid) return;
    try {
        const categories = await api.getCategoryTree(true);
        const topLevel = (Array.isArray(categories) ? categories : [])
            .filter(cat => !cat.parent_id && cat.kind !== 'service')
            .slice(0, 12);
        grid.innerHTML = topLevel.length ? topLevel.map(cat => renderCategoryTile(cat, city)).join('') : renderCategoryEmpty(city);
    } catch (err) {
        grid.innerHTML = renderCategoryEmpty(city);
    }
}

function renderCategorySkeleton() {
    return Array(6).fill(0).map(() => `
        <div class="mp-category-tile" aria-hidden="true">
            <div class="mp-category-icon" style="background:#f8fafc;color:#cbd5e1;"><i class="fa-solid fa-spinner fa-spin"></i></div>
            <div>
                <div class="mp-category-name">Loading</div>
                <div class="mp-category-meta">Category</div>
            </div>
        </div>
    `).join('');
}

function renderCategoryEmpty(city) {
    return `
        <a href="/search/rooms?kind=sale&city=${encodeURIComponent(city.slug)}&category=furniture" class="mp-category-tile">
            <div class="mp-category-icon"><i class="fa-solid fa-couch"></i></div>
            <div>
                <div class="mp-category-name">Furniture & Home</div>
                <div class="mp-category-meta">Browse items</div>
            </div>
        </a>
    `;
}

function renderCategoryTile(cat, city) {
    const categoryValue = cat.category_id || cat.slug || '';
    const childCount = (cat.children || []).length;
    return `
        <a href="/search/rooms?kind=sale&city=${encodeURIComponent(city.slug)}&category=${encodeURIComponent(categoryValue)}" class="mp-category-tile">
            <div class="mp-category-icon"><i class="${iconClass(cat.icon)}"></i></div>
            <div>
                <div class="mp-category-name">${escHtml(cat.name)}</div>
                <div class="mp-category-meta">${childCount ? `${childCount} subcategories` : 'Local items'}</div>
            </div>
        </a>
    `;
}

function renderReviewCard(review) {
    const rating = Math.max(0, Math.min(5, Number(review.rating || 5)));
    const stars = '&#9733;'.repeat(rating) + '&#9734;'.repeat(5 - rating);
    return `
        <div class="gd-review-card">
            <div class="gd-review-stars">${stars}</div>
            <p class="gd-review-text">"${escHtml(review.text || review.comment || '')}"</p>
            <div class="gd-review-user">
                <img src="https://i.pravatar.cc/100?u=${encodeURIComponent(review.name || 'reviewer')}" alt="${escHtml(review.name || 'Reviewer')} Review Avatar" class="gd-review-avatar" loading="lazy">
                <div>
                    <span class="gd-review-name">${escHtml(review.name || 'Local member')}</span>
                    <span class="gd-review-date">${escHtml(review.date || '')}</span>
                </div>
            </div>
        </div>
    `;
}

function renderBlogCard(post) {
    const image = post.featured_image ? getAssetUrl(post.featured_image) : 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=250&fit=crop';
    const excerpt = post.excerpt || stripHtml(post.content || '').slice(0, 120);
    return `
        <a href="/blog/${post.slug}" class="gd-blog-card">
            <div class="gd-blog-img">
                <img src="${image}" alt="${escHtml(post.title)}" loading="lazy">
                <span class="gd-blog-cat">${escHtml(post.category || 'Lifestyle')}</span>
            </div>
            <div class="gd-blog-body">
                <h3 class="gd-blog-title">${escHtml(post.title)}</h3>
                <p class="gd-blog-excerpt">${escHtml(excerpt)}...</p>
                <div class="gd-blog-footer">
                    <span>${new Date(post.created_at || Date.now()).toLocaleDateString()}</span>
                    <span>Read More <i class="fas fa-arrow-right"></i></span>
                </div>
            </div>
        </a>
    `;
}

function renderFaq(faq) {
    return `
        <div class="home-faq-item">
            <div class="home-faq-icon"><i class="fa-solid fa-question-circle"></i></div>
            <div>
                <div class="home-faq-q">${escHtml(faq.q || faq.question || '')}</div>
                <div class="home-faq-a">${escHtml(faq.a || faq.answer || '')}</div>
            </div>
        </div>
    `;
}

function getNearbyMarketplaceCities(currentCity) {
    return db.cities.findAll()
        .filter(c => c.city_id !== currentCity.city_id && isMarketplaceEnabled(c))
        .map(c => ({ ...c, distance: calculateDistance(currentCity.latitude, currentCity.longitude, c.latitude, c.longitude) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);
}

function renderNearbyCity(city) {
    const img = city.marketplace_hero_image ? getAssetUrl(city.marketplace_hero_image) : (city.hero_image ? getAssetUrl(city.hero_image) : FALLBACK_CITY_IMG);
    const saleCount = getCitySaleItems(city).length;
    return `
        <a href="/marketplace/${city.slug}" class="gd-related-card">
            <div class="gd-related-img"><img src="${img}" alt="${escHtml(city.name)}"></div>
            <div class="gd-related-body">
                <h4 class="gd-related-name">${escHtml(city.name)}</h4>
                <div class="gd-related-meta">
                    <span><i class="fa-solid fa-box-open"></i> ${saleCount} items</span>
                    <span><i class="fa-solid fa-route"></i> ${Math.round(city.distance || 0)} mi</span>
                </div>
            </div>
        </a>
    `;
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
        try { return JSON.parse(value || '[]'); } catch(e) { return []; }
    }
    return [];
}

function buildMarketplaceSchema(city, items, faqs) {
    const itemList = {
        '@type': 'ItemList',
        name: `Items for sale in ${city.name}`,
        itemListElement: items.slice(0, 10).map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            url: `${window.location.origin}/listing/${item.listing_id}`,
            item: {
                '@type': 'Product',
                name: item.title || 'Marketplace listing',
                image: firstImage(item),
                description: stripHtml(item.description || item.title || ''),
                offers: {
                    '@type': 'Offer',
                    price: Number(item.price || item.rent || 0),
                    priceCurrency: 'USD',
                    availability: 'https://schema.org/InStock',
                },
            },
        })),
    };
    const faqSchema = {
        '@type': 'FAQPage',
        mainEntity: faqs.map(f => ({
            '@type': 'Question',
            name: f.q || f.question,
            acceptedAnswer: { '@type': 'Answer', text: f.a || f.answer },
        })),
    };
    return { '@context': 'https://schema.org', '@graph': [itemList, faqSchema] };
}

function firstImage(item) {
    let images = item.images || item.photos || [];
    if (typeof images === 'string') {
        try { images = JSON.parse(images); } catch(e) { images = []; }
    }
    const raw = Array.isArray(images) ? images[0] : images;
    if (raw && typeof raw === 'object') return getAssetUrl(raw.medium || raw.thumb || raw.full || '');
    return raw ? getAssetUrl(raw) : FALLBACK_CITY_IMG;
}

function iconClass(icon) {
    if (!icon) return 'fa-solid fa-box-open';
    if (icon.includes(' ')) return icon;
    return `fa-solid ${icon}`;
}

function calculateDistance(lat1, lon1, lat2, lon2) {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function stripHtml(value) {
    return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function escHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
