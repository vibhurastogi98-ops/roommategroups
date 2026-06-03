/**
 * src/mobile/pages/MobileMarketplaceCity.js
 *
 * Mobile marketplace landing page managed from the shared city record.
 */

import { db, initDB } from '../../../web/src/services/db.js';
import { api } from '../../../web/src/services/api.js';
import { setSEO } from '../../../web/src/seo.js';
import { getAssetUrl } from '../../../web/src/services/assets.js';
import { renderMobileCard, attachMobileCardEvents } from '../components/MobileCard.js';

async function getMobile() {
  return await import('../mobile-main.js');
}

const FALLBACK_HERO = 'https://images.unsplash.com/photo-1556761175-b413da4baf72?w=1200&h=700&fit=crop';
const FALLBACK_CITY_IMG = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop';

export async function init(container, params = {}) {
  container.innerHTML = _skeletonHTML();
  await initDB().catch(() => {});

  const citySlug = (params.slug || '').toLowerCase();
  const city = db.cities.findOne(c => (c.slug || '').toLowerCase() === citySlug);

  if (!city || !_isMarketplaceEnabled(city)) {
    setSEO({
      title: 'Marketplace City Not Found | RoommateGroups',
      description: 'This marketplace city page is not available.',
      canonical: citySlug ? `https://roommategroups.com/marketplace/${citySlug}` : 'https://roommategroups.com/marketplace',
      robots: 'noindex, follow',
    });
    _renderNotFound(container);
    return;
  }

  const { updateHeader, navigate } = await getMobile();
  updateHeader({ title: `${city.name} Marketplace`, showBack: true });

  const items = _citySaleItems(city);
  const avgPrice = items.length
    ? Math.round(items.reduce((sum, l) => sum + Number(l.price || l.rent || 0), 0) / items.length)
    : 0;
  const reviews = _marketplaceReviews(city);
  const faqs = _marketplaceFaqs(city);
  const latestPosts = db.posts.findAll().sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 3);
  const heroImage = city.marketplace_hero_image ? getAssetUrl(city.marketplace_hero_image) : (city.hero_image ? getAssetUrl(city.hero_image) : FALLBACK_HERO);
  const description = city.marketplace_description || `Buy and sell furniture, electronics, vehicles, and everyday essentials with local members in ${city.name}.`;

  setSEO({
    title: (city.marketplace_meta_title || `Buy & Sell in ${city.name} | RoommateGroups Marketplace`).substring(0, 60),
    description: (city.marketplace_meta_description || `Shop local furniture, electronics, vehicles, and essentials in ${city.name} on RoommateGroups Marketplace.`).substring(0, 160),
    canonical: `https://roommategroups.com/marketplace/${city.slug}`,
    ogImage: heroImage,
  });

  container.innerHTML = `
    <style>
      .mpm-page { background:#fff; color:#0f172a; }
      .mpm-hero { position:relative; min-height:340px; background:#0f172a; overflow:hidden; }
      .mpm-hero img { width:100%; height:100%; min-height:340px; object-fit:cover; opacity:.86; display:block; }
      .mpm-hero-overlay { position:absolute; inset:0; background:linear-gradient(to bottom, rgba(15,23,42,.12), rgba(15,23,42,.92)); display:flex; flex-direction:column; justify-content:flex-end; padding:34px 18px; color:#fff; }
      .mpm-eyebrow { font-size:.74rem; font-weight:900; letter-spacing:.06em; text-transform:uppercase; color:#ccfbf1; margin-bottom:8px; }
      .mpm-title { font-size:2.45rem; font-weight:950; line-height:.98; letter-spacing:0; margin:0 0 12px; }
      .mpm-sub { font-size:.9rem; color:rgba(255,255,255,.86); line-height:1.5; margin:0 0 18px; }
      .mpm-stats { display:flex; gap:8px; flex-wrap:wrap; }
      .mpm-pill { display:flex; align-items:center; gap:7px; padding:8px 10px; border-radius:10px; background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.24); font-size:.74rem; font-weight:850; }
      .mpm-section { padding:24px 16px; }
      .mpm-section-alt { background:#f8fafc; }
      .mpm-section-head { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; margin-bottom:14px; }
      .mpm-section-title { font-size:1.18rem; font-weight:950; margin:0 0 3px; }
      .mpm-section-sub { font-size:.78rem; color:#64748b; margin:0; line-height:1.45; }
      .mpm-link { border:0; background:transparent; color:#0f766e; font-size:.76rem; font-weight:900; padding:0; }
      .mpm-scroll { display:flex; gap:14px; overflow-x:auto; padding:2px 0 14px; scrollbar-width:none; }
      .mpm-scroll::-webkit-scrollbar { display:none; }
      .mpm-scroll .mobile-card { width:238px; flex:0 0 238px; }
      .mpm-empty { padding:22px; border:1px dashed #cbd5e1; border-radius:16px; background:#fff; text-align:center; }
      .mpm-empty-icon { width:46px; height:46px; border-radius:14px; margin:0 auto 10px; display:flex; align-items:center; justify-content:center; color:#0f766e; background:#ecfdf5; }
      .mpm-empty-title { font-weight:900; margin-bottom:5px; }
      .mpm-empty-text { color:#64748b; font-size:.8rem; line-height:1.45; margin-bottom:14px; }
      .mpm-category-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
      .mpm-category { min-height:104px; border:1px solid #e2e8f0; background:#fff; border-radius:14px; padding:12px; text-align:left; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 8px 20px rgba(15,23,42,.04); }
      .mpm-category-icon { width:34px; height:34px; border-radius:10px; background:#f0fdfa; color:#0f766e; display:flex; align-items:center; justify-content:center; }
      .mpm-category-name { font-size:.78rem; font-weight:950; color:#0f172a; line-height:1.15; }
      .mpm-category-meta { font-size:.66rem; color:#64748b; font-weight:750; margin-top:3px; }
      .mpm-trust { display:grid; gap:10px; }
      .mpm-trust-card { background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:15px; display:flex; gap:12px; }
      .mpm-trust-icon { width:36px; height:36px; flex-shrink:0; border-radius:11px; background:#111827; color:#fff; display:flex; align-items:center; justify-content:center; }
      .mpm-trust-title { font-size:.86rem; font-weight:950; margin-bottom:3px; }
      .mpm-trust-text { color:#64748b; font-size:.76rem; line-height:1.45; }
      .mpm-review { width:230px; flex:0 0 230px; background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:15px; }
      .mpm-stars { color:#f59e0b; font-size:.74rem; margin-bottom:8px; }
      .mpm-review-text { color:#475569; font-size:.78rem; line-height:1.5; margin-bottom:12px; font-style:italic; }
      .mpm-review-name { font-size:.75rem; font-weight:900; }
      .mpm-faq { background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:15px; margin-bottom:10px; }
      .mpm-faq-q { font-size:.86rem; font-weight:950; margin-bottom:6px; }
      .mpm-faq-a { color:#64748b; font-size:.78rem; line-height:1.5; }
      .mpm-blog { width:230px; flex:0 0 230px; border:1px solid #e2e8f0; background:#fff; border-radius:16px; overflow:hidden; color:inherit; text-decoration:none; }
      .mpm-blog img { width:100%; height:120px; object-fit:cover; display:block; }
      .mpm-blog-body { padding:12px; }
      .mpm-blog-title { font-size:.84rem; font-weight:950; line-height:1.3; margin-bottom:5px; }
      .mpm-blog-meta { color:#64748b; font-size:.68rem; font-weight:750; }
      .mpm-nearby { display:flex; align-items:center; gap:12px; background:#fff; border:1px solid #e2e8f0; border-radius:14px; padding:10px; margin-bottom:10px; }
      .mpm-nearby img { width:58px; height:58px; border-radius:10px; object-fit:cover; }
      .mpm-nearby-name { font-size:.86rem; font-weight:950; }
      .mpm-nearby-meta { color:#64748b; font-size:.7rem; margin-top:2px; }
    </style>

    <div class="mpm-page">
      <section class="mpm-hero">
        <img src="${heroImage}" alt="${_esc(city.name)} marketplace">
        <div class="mpm-hero-overlay">
          <div class="mpm-eyebrow">Marketplace</div>
          <h1 class="mpm-title">Buy & Sell in ${_esc(city.name)}</h1>
          <p class="mpm-sub">${_esc(_stripHtml(description))}</p>
          <div class="mpm-stats">
            <div class="mpm-pill"><i class="fa-solid fa-box-open"></i> ${items.length} items</div>
            <div class="mpm-pill"><i class="fa-solid fa-tag"></i> ${avgPrice ? '$' + avgPrice.toLocaleString() : 'Price varies'}</div>
            <div class="mpm-pill"><i class="fa-solid fa-shield-halved"></i> Local safety</div>
          </div>
        </div>
      </section>

      <section class="mpm-section">
        <div class="mpm-section-head">
          <div>
            <h2 class="mpm-section-title">Items for Sale</h2>
            <p class="mpm-section-sub">Fresh listings near ${_esc(city.name)}.</p>
          </div>
          <button class="mpm-link" id="mpm-view-all">View all</button>
        </div>
        ${items.length
          ? `<div class="mpm-scroll" id="mpm-items">${items.slice(0, 8).map(renderMobileCard).join('')}</div>`
          : `<div class="mpm-empty">
              <div class="mpm-empty-icon"><i class="fa-solid fa-box-open"></i></div>
              <div class="mpm-empty-title">No items yet</div>
              <div class="mpm-empty-text">Be the first local member to sell something in ${_esc(city.name)}.</div>
              <button class="mobile-btn mobile-btn-accent" id="mpm-post">Post a Listing</button>
            </div>`
        }
      </section>

      <section class="mpm-section mpm-section-alt">
        <div class="mpm-section-head">
          <div>
            <h2 class="mpm-section-title">Shop by Category</h2>
            <p class="mpm-section-sub">Services are hidden from this buy/sell flow.</p>
          </div>
        </div>
        <div class="mpm-category-grid" id="mpm-categories">${_categorySkeleton()}</div>
      </section>

      <section class="mpm-section">
        <div class="mpm-section-head">
          <div>
            <h2 class="mpm-section-title">Safe Local Selling</h2>
            <p class="mpm-section-sub">Small habits that make handoffs easier.</p>
          </div>
        </div>
        <div class="mpm-trust">
          <div class="mpm-trust-card">
            <div class="mpm-trust-icon"><i class="fa-solid fa-location-dot"></i></div>
            <div><div class="mpm-trust-title">Meet Publicly</div><div class="mpm-trust-text">Choose visible places for pickup and payment.</div></div>
          </div>
          <div class="mpm-trust-card">
            <div class="mpm-trust-icon"><i class="fa-solid fa-magnifying-glass"></i></div>
            <div><div class="mpm-trust-title">Inspect First</div><div class="mpm-trust-text">Check condition before you pay.</div></div>
          </div>
          <div class="mpm-trust-card">
            <div class="mpm-trust-icon"><i class="fa-solid fa-comments"></i></div>
            <div><div class="mpm-trust-title">Keep Chat Here</div><div class="mpm-trust-text">Keep offers and details inside RoommateGroups.</div></div>
          </div>
        </div>
      </section>

      <section class="mpm-section mpm-section-alt">
        <h2 class="mpm-section-title">Community Reviews</h2>
        <div class="mpm-scroll" style="margin-top:14px;">
          ${reviews.map(_renderReview).join('')}
        </div>
      </section>

      <section class="mpm-section">
        <div class="mpm-section-head">
          <div>
            <h2 class="mpm-section-title">Latest from the Blog</h2>
            <p class="mpm-section-sub">Moving tips and local advice.</p>
          </div>
        </div>
        <div class="mpm-scroll">
          ${latestPosts.map(_renderBlog).join('')}
        </div>
      </section>

      <section class="mpm-section mpm-section-alt">
        <h2 class="mpm-section-title">FAQ</h2>
        <div style="margin-top:14px;">
          ${faqs.map(_renderFaq).join('')}
        </div>
      </section>

      <section class="mpm-section">
        <h2 class="mpm-section-title">Explore Nearby Cities</h2>
        <div style="margin-top:14px;">
          ${_nearbyCities(city).map(_renderNearby).join('') || '<div class="mpm-empty"><div class="mpm-empty-title">Nearby marketplace pages coming soon</div></div>'}
        </div>
      </section>
    </div>
  `;

  attachMobileCardEvents(container.querySelector('#mpm-items'), id => navigate('listing', { id }));
  container.querySelector('#mpm-view-all')?.addEventListener('click', () => navigate('search', { kind: 'sale', city: city.slug, sort: 'newest' }));
  container.querySelector('#mpm-post')?.addEventListener('click', () => navigate('post', { kind: 'sale' }));
  container.querySelectorAll('.mpm-nearby').forEach(el => {
    el.addEventListener('click', () => navigate('marketplaceCity', { slug: el.dataset.slug }));
  });
  await _loadCategories(container, city, navigate);
}

async function _loadCategories(container, city, navigate) {
  const grid = container.querySelector('#mpm-categories');
  if (!grid) return;
  try {
    const tree = await api.getCategoryTree(true);
    const categories = (Array.isArray(tree) ? tree : [])
      .filter(cat => !cat.parent_id && cat.kind !== 'service')
      .slice(0, 10);
    grid.innerHTML = categories.length ? categories.map(_renderCategory).join('') : _categoryFallback();
    grid.querySelectorAll('.mpm-category').forEach(el => {
      el.addEventListener('click', () => navigate('search', { kind: 'sale', city: city.slug, category: el.dataset.category }));
    });
  } catch (err) {
    grid.innerHTML = _categoryFallback();
  }
}

function _renderCategory(cat) {
  const categoryValue = cat.category_id || cat.slug || '';
  const childCount = (cat.children || []).length;
  return `
    <button class="mpm-category" data-category="${_esc(categoryValue)}">
      <span class="mpm-category-icon"><i class="${_iconClass(cat.icon)}"></i></span>
      <span>
        <span class="mpm-category-name">${_esc(cat.name)}</span>
        <span class="mpm-category-meta">${childCount ? `${childCount} subcategories` : 'Local items'}</span>
      </span>
    </button>
  `;
}

function _categorySkeleton() {
  return Array(6).fill(0).map(() => `
    <div class="mpm-category">
      <span class="mpm-category-icon" style="background:#f8fafc;color:#cbd5e1;"><i class="fa-solid fa-spinner fa-spin"></i></span>
      <span><span class="mpm-category-name">Loading</span><span class="mpm-category-meta">Category</span></span>
    </div>
  `).join('');
}

function _categoryFallback() {
  return `
    <button class="mpm-category" data-category="furniture">
      <span class="mpm-category-icon"><i class="fa-solid fa-couch"></i></span>
      <span><span class="mpm-category-name">Furniture & Home</span><span class="mpm-category-meta">Browse items</span></span>
    </button>
  `;
}

function _marketplaceReviews(city) {
  const reviews = Array.isArray(city.marketplace_reviews) ? city.marketplace_reviews : [];
  if (reviews.length) return reviews;
  return [
    { name: 'Maya Patel', date: '2 days ago', rating: 5, text: `Sold a desk in ${city.name} in one afternoon.` },
    { name: 'Alex Romero', date: '1 week ago', rating: 5, text: 'Picked up a sofa from someone nearby and avoided shipping fees.' },
    { name: 'Nina Brooks', date: '3 weeks ago', rating: 4, text: 'Useful for furnishing a new place after finding a room.' },
  ];
}

function _marketplaceFaqs(city) {
  const faqs = Array.isArray(city.marketplace_faq_items) ? city.marketplace_faq_items : [];
  if (faqs.length) return faqs.map(f => ({ q: f.question || f.q, a: f.answer || f.a }));
  return [
    { q: `How do I buy safely in ${city.name}?`, a: 'Meet in a public place, inspect before paying, and keep conversations in RoommateGroups chat.' },
    { q: 'Can I make an offer?', a: 'Yes. Item listings support offers and continue inside chat.' },
    { q: 'What can I sell?', a: 'Furniture, electronics, vehicles, home goods, appliances, fashion, and everyday items.' },
  ];
}

function _renderReview(review) {
  const rating = Math.max(0, Math.min(5, Number(review.rating || 5)));
  return `
    <div class="mpm-review">
      <div class="mpm-stars">${'&#9733;'.repeat(rating)}${'&#9734;'.repeat(5 - rating)}</div>
      <div class="mpm-review-text">"${_esc(review.text || review.comment || '')}"</div>
      <div class="mpm-review-name">${_esc(review.name || 'Local member')}</div>
      <div style="font-size:.68rem;color:#94a3b8;">${_esc(review.date || '')}</div>
    </div>
  `;
}

function _renderBlog(post) {
  const image = post.featured_image ? getAssetUrl(post.featured_image) : 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=250&fit=crop';
  return `
    <a href="/blog/${post.slug}" class="mpm-blog">
      <img src="${image}" alt="${_esc(post.title)}">
      <div class="mpm-blog-body">
        <div class="mpm-blog-title">${_esc(post.title)}</div>
        <div class="mpm-blog-meta">${_esc(post.category || 'Lifestyle')}</div>
      </div>
    </a>
  `;
}

function _renderFaq(faq) {
  return `
    <div class="mpm-faq">
      <div class="mpm-faq-q">${_esc(faq.q || faq.question || '')}</div>
      <div class="mpm-faq-a">${_esc(faq.a || faq.answer || '')}</div>
    </div>
  `;
}

function _nearbyCities(currentCity) {
  return db.cities.findAll()
    .filter(c => c.city_id !== currentCity.city_id && _isMarketplaceEnabled(c))
    .map(c => ({ ...c, distance: _distance(currentCity.latitude, currentCity.longitude, c.latitude, c.longitude) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 4);
}

function _renderNearby(city) {
  const img = city.marketplace_hero_image ? getAssetUrl(city.marketplace_hero_image) : (city.hero_image ? getAssetUrl(city.hero_image) : FALLBACK_CITY_IMG);
  const saleCount = _citySaleItems(city).length;
  return `
    <div class="mpm-nearby" data-slug="${_esc(city.slug)}">
      <img src="${img}" alt="${_esc(city.name)}">
      <div style="flex:1;">
        <div class="mpm-nearby-name">${_esc(city.name)}</div>
        <div class="mpm-nearby-meta">${saleCount} items &middot; ${Math.round(city.distance || 0)} mi</div>
      </div>
      <i class="fa-solid fa-chevron-right" style="color:#cbd5e1;font-size:.76rem;"></i>
    </div>
  `;
}

function _isMarketplaceEnabled(city) {
  if (!city) return false;
  return city.marketplace_enabled === true || city.marketplace_enabled === 1 || city.marketplace_enabled === '1';
}

function _matchesCity(listing, city) {
  const value = String(listing?.city || '').toLowerCase();
  return value === String(city.city_id || '').toLowerCase()
    || value === String(city.slug || '').toLowerCase()
    || value === String(city.name || '').toLowerCase();
}

function _citySaleItems(city) {
  return db.listings.find(l =>
    _matchesCity(l, city)
    && l.status === 'active'
    && String(l.kind || 'rental').toLowerCase() === 'sale'
  ).sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0));
}

function _iconClass(icon) {
  if (!icon) return 'fa-solid fa-box-open';
  if (icon.includes(' ')) return icon;
  return `fa-solid ${icon}`;
}

function _distance(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 9999;
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function _stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function _esc(str) {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function _skeletonHTML() {
  return `
    <div class="mobile-page-content" style="padding:20px;">
      <div class="mobile-skeleton-stack">
        <div class="mobile-skeleton-card city">
          <div class="mobile-skeleton-media" style="height:220px;"></div>
          <div class="mobile-skeleton-body">
            <div class="mobile-skeleton-line title"></div>
            <div class="mobile-skeleton-line medium"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function _renderNotFound(container) {
  container.innerHTML = `
    <div style="padding:40px 20px;text-align:center;">
      <div style="font-size:2.8rem;margin-bottom:18px;"><i class="fa-solid fa-store-slash"></i></div>
      <h2 style="font-size:1.4rem;font-weight:950;color:#1e293b;margin-bottom:8px;">City not found</h2>
      <p style="color:#64748b;font-size:.9rem;margin-bottom:24px;">This marketplace city page is not available yet.</p>
      <button class="mobile-btn mobile-btn-accent" id="mpm-back-btn">Go Back</button>
    </div>
  `;
  container.querySelector('#mpm-back-btn')?.addEventListener('click', async () => {
    const { goBack } = await getMobile();
    goBack();
  });
}

export default { init };
