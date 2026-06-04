/**
 * src/mobile/pages/MobileMarketplaceLanding.js
 *
 * Mobile front door for buying and selling on RoommateGroups.
 */

import { db, initDB } from '../../../web/src/services/db.js';
import { api } from '../../../web/src/services/api.js';
import { setSEO } from '../../../web/src/seo.js';
import { getAssetUrl } from '../../../web/src/services/assets.js';
import { renderMobileCard, attachMobileCardEvents } from '../components/MobileCard.js';

async function getMobile() {
  return await import('../mobile-main.js');
}

const HERO_IMAGE = 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=900&h=900&fit=crop&auto=format&q=80';
const MARKETPLACE_SAFE_IMAGE = 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=900&h=680&fit=crop&auto=format&q=80';
const MARKETPLACE_HOME_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=900&h=680&fit=crop&auto=format&q=80';
const MARKETPLACE_FAQS = [
  {
    q: 'Is it free to buy and sell on RoommateGroups?',
    a: 'Yes, listing and browsing are completely free; you only ever pay the seller directly for the item.',
  },
  {
    q: 'How do I stay safe when meeting a buyer or seller?',
    a: 'Chat in-app, meet in a busy public place, inspect items before paying, and never send money in advance.',
  },
  {
    q: 'What can I sell?',
    a: 'Furniture, electronics, mobiles, appliances, home goods, fashion and more - anything legal and allowed by our listing rules.',
  },
  {
    q: 'How do offers work?',
    a: 'Tap "Make an offer" on any listing; the seller can accept or decline right inside your chat thread.',
  },
  {
    q: 'Can I sell and also find a room here?',
    a: 'Absolutely - RoommateGroups is both a roommate platform and a local marketplace, all in one account.',
  },
];

export async function init(container) {
  await initDB().catch(() => {});
  const { updateHeader, navigate } = await getMobile();
  updateHeader({ title: 'Marketplace', showBack: true });

  const cities = db.cities.find(c => c.is_active !== false)
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
    .slice(0, 60);
  const countries = db.countries.find(c => c.is_active !== false)
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  const marketplaceCities = db.cities.find(c => c.is_active !== false && _isMarketplaceEnabled(c))
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
    .slice(0, 12);
  const featured = db.listings.find(l => l.status === 'active' && l.kind === 'sale')
    .sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0))
    .slice(0, 8);

  setSEO({
    title: 'Buy & Sell Locally | RoommateGroups Marketplace',
    description: 'Shop furniture, electronics, vehicles, appliances, and home essentials with verified local members on RoommateGroups Marketplace.',
    canonical: 'https://roommategroups.com/marketplace',
    schema: _buildSchema(featured, MARKETPLACE_FAQS),
  });

  container.innerHTML = `
    <style>
      .mml-page { background:#fff; color:#0f172a; min-height:100%; }
      .mml-hero { position:relative; min-height:430px; padding:34px 18px 28px; display:flex; flex-direction:column; justify-content:flex-end; color:#fff; overflow:hidden; background:#111827; }
      .mml-hero::before { content:''; position:absolute; inset:0; background:url('${HERO_IMAGE}') center/cover; opacity:.62; }
      .mml-hero::after { content:''; position:absolute; inset:0; background:linear-gradient(to bottom, rgba(17,24,39,.25), rgba(17,24,39,.94)); }
      .mml-hero-inner { position:relative; z-index:1; }
      .mml-badge { display:inline-flex; align-items:center; gap:7px; padding:7px 10px; border-radius:10px; background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.2); color:#ccfbf1; font-size:.68rem; font-weight:900; text-transform:uppercase; margin-bottom:12px; }
      .mml-title { font-size:2.5rem; line-height:.98; letter-spacing:0; font-weight:950; margin:0 0 12px; }
      .mml-sub { margin:0 0 18px; color:rgba(255,255,255,.86); font-size:.9rem; line-height:1.52; }
      .mml-actions { display:flex; gap:10px; flex-wrap:wrap; margin-bottom:14px; }
      .mml-btn { height:42px; border:0; border-radius:12px; padding:0 14px; font-size:.78rem; font-weight:950; display:inline-flex; align-items:center; justify-content:center; gap:7px; }
      .mml-btn-primary { background:#fff; color:#111827; }
      .mml-btn-secondary { background:rgba(255,255,255,.14); color:#fff; border:1px solid rgba(255,255,255,.24); }
      .mml-search { display:grid; gap:9px; padding:12px; border-radius:16px; background:rgba(255,255,255,.96); box-shadow:0 16px 34px rgba(0,0,0,.18); }
      .mml-search input, .mml-search select { height:42px; border:1px solid #e2e8f0; border-radius:11px; padding:0 12px; font-size:.82rem; color:#0f172a; background:#fff; }
      .mml-section { padding:24px 16px; }
      .mml-section-alt { background:#f8fafc; }
      .mml-section-head { display:flex; align-items:flex-end; justify-content:space-between; gap:12px; margin-bottom:14px; }
      .mml-section-title { font-size:1.18rem; font-weight:950; margin:0 0 4px; letter-spacing:0; }
      .mml-section-sub { margin:0; color:#64748b; font-size:.78rem; line-height:1.45; }
      .mml-link { border:0; background:transparent; color:#0f766e; font-size:.76rem; font-weight:950; padding:0; }
      .mml-city-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
      .mml-city { min-height:148px; position:relative; overflow:hidden; border:0; border-radius:14px; padding:0; color:#fff; background:#111827; text-align:left; box-shadow:0 10px 22px rgba(15,23,42,.08); }
      .mml-city::before { content:''; position:absolute; inset:0; background:var(--city-img) center/cover; opacity:.88; }
      .mml-city::after { content:''; position:absolute; inset:0; background:linear-gradient(to top, rgba(15,23,42,.9), rgba(15,23,42,.12)); }
      .mml-city-body { position:absolute; z-index:1; left:12px; right:12px; bottom:12px; }
      .mml-city-name { font-size:.9rem; font-weight:950; line-height:1.15; margin-bottom:5px; }
      .mml-city-meta { display:flex; flex-direction:column; gap:3px; color:rgba(255,255,255,.82); font-size:.66rem; font-weight:850; }
      .mml-empty { padding:18px; border:1px dashed #cbd5e1; border-radius:14px; background:#fff; color:#64748b; font-size:.8rem; line-height:1.45; }
      .mml-category-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
      .mml-category { min-height:104px; border:1px solid #e2e8f0; background:#fff; border-radius:14px; padding:12px; text-align:left; display:flex; flex-direction:column; justify-content:space-between; box-shadow:0 8px 20px rgba(15,23,42,.04); }
      .mml-category-icon { width:34px; height:34px; border-radius:10px; background:#f0fdfa; color:#0f766e; display:flex; align-items:center; justify-content:center; }
      .mml-category-name { font-size:.78rem; font-weight:950; color:#0f172a; line-height:1.15; display:block; }
      .mml-category-meta { font-size:.66rem; color:#64748b; font-weight:750; margin-top:3px; display:block; }
      .mml-feature { padding:32px 18px; background:#fff; border-top:1px solid #f1f5f9; }
      .mml-feature-alt { background:#f8fafc; }
      .mml-feature-tag { display:inline-flex; align-items:center; gap:7px; background:#dcfce7; color:#15803d; font-size:.62rem; font-weight:900; padding:6px 12px; border-radius:999px; text-transform:uppercase; letter-spacing:.08em; margin-bottom:14px; }
      .mml-feature h2 { font-size:1.55rem; line-height:1.16; letter-spacing:0; font-weight:950; margin:0 0 12px; color:#0f172a; }
      .mml-feature p { font-size:.86rem; color:#64748b; line-height:1.62; margin:0 0 20px; }
      .mml-checks { display:grid; gap:11px; margin-bottom:22px; }
      .mml-checks-2 { grid-template-columns:1fr; }
      .mml-check { display:flex; align-items:center; gap:10px; color:#1e293b; font-size:.84rem; font-weight:750; }
      .mml-check i { width:24px; height:24px; border-radius:50%; display:flex; align-items:center; justify-content:center; background:#10b981; color:#fff; font-size:.68rem; flex-shrink:0; }
      .mml-feature-cta { border:0; background:transparent; color:#0f766e; padding:0; font-size:.9rem; font-weight:950; display:inline-flex; align-items:center; gap:7px; margin-bottom:22px; }
      .mml-feature-img { border-radius:18px; overflow:hidden; box-shadow:0 16px 34px rgba(15,23,42,.13); background:#f1f5f9; }
      .mml-feature-img img { width:100%; display:block; object-fit:cover; }
      .mml-steps { display:grid; gap:10px; }
      .mml-step { display:flex; gap:12px; padding:15px; border:1px solid #e2e8f0; border-radius:16px; background:#fff; }
      .mml-step-icon { width:42px; height:42px; border-radius:13px; flex-shrink:0; display:flex; align-items:center; justify-content:center; font-weight:950; }
      .mml-step-icon { background:#111827; color:#fff; position:relative; }
      .mml-step-icon .mml-step-num { position:absolute; top:-7px; right:-7px; width:20px; height:20px; border-radius:50%; background:#10b981; color:#fff; display:flex; align-items:center; justify-content:center; font-size:.62rem; border:2px solid #fff; }
      .mml-card-title { font-size:.86rem; font-weight:950; margin-bottom:3px; }
      .mml-card-text { color:#64748b; font-size:.76rem; line-height:1.45; }
      .mml-trust-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-top:14px; }
      .mml-trust-card { padding:15px; background:#fff; border:1px solid #e2e8f0; border-radius:16px; box-shadow:0 8px 20px rgba(15,23,42,.04); }
      .mml-trust-icon { width:38px; height:38px; border-radius:13px; display:flex; align-items:center; justify-content:center; background:#ecfdf5; color:#0f766e; margin-bottom:10px; }
      .mml-faq-list { display:grid; gap:10px; }
      .mml-faq-item { display:flex; gap:12px; padding:16px; background:#fff; border:1px solid #e2e8f0; border-radius:16px; }
      .mml-faq-icon { width:38px; height:38px; border-radius:50%; background:#f1f5f9; color:#64748b; flex-shrink:0; display:flex; align-items:center; justify-content:center; }
      .mml-faq-q { font-size:.86rem; font-weight:950; color:#1e293b; margin:0 0 5px; line-height:1.35; }
      .mml-faq-a { font-size:.78rem; color:#64748b; line-height:1.5; margin:0; }
      .mml-scroll { display:flex; gap:14px; overflow-x:auto; padding:2px 0 14px; scrollbar-width:none; }
      .mml-scroll::-webkit-scrollbar { display:none; }
      .mml-scroll .mobile-card { width:238px; flex:0 0 238px; }
      .mml-cta { background:#111827; color:#fff; border-radius:18px; padding:20px; }
      .mml-cta-title { font-size:1.18rem; font-weight:950; margin-bottom:6px; }
      .mml-cta-text { color:rgba(255,255,255,.78); font-size:.82rem; line-height:1.5; margin-bottom:14px; }
    </style>

    <div class="mml-page">
      <section class="mml-hero">
        <div class="mml-hero-inner">
          <div class="mml-badge"><i class="fa-solid fa-store"></i> RoommateGroups Marketplace</div>
          <h1 class="mml-title">Buy & Sell Locally, Safely</h1>
          <p class="mml-sub">Furnish your new place, declutter your old one, and trade with verified members in your city. No bots. No spam. Just real local deals.</p>
          <div class="mml-actions">
            <button class="mml-btn mml-btn-primary" id="mml-browse"><i class="fa-solid fa-magnifying-glass"></i> Browse Marketplace</button>
            <button class="mml-btn mml-btn-secondary" id="mml-sell">Sell an item &rarr;</button>
          </div>
          <form class="mml-search" id="mml-search-form">
            <input id="mml-keyword" type="search" placeholder="Search furniture, phones, bikes...">
            <select id="mml-country" aria-label="Choose a country">
              <option value="">All countries</option>
              ${countries.map(country => `<option value="${_esc(country.country_id)}">${_esc((country.flag_emoji ? country.flag_emoji + ' ' : '') + country.name)}</option>`).join('')}
            </select>
            <select id="mml-city" aria-label="Choose a city">
              <option value="">All cities</option>
              ${cities.map(city => `<option value="${_esc(city.slug)}" data-country="${_esc(city.country || '')}">${_esc(city.name)}</option>`).join('')}
            </select>
            <button class="mml-btn mml-btn-primary" type="submit">Search marketplace</button>
          </form>
        </div>
      </section>

      <section class="mml-section mml-section-alt">
        <div class="mml-section-head">
          <div>
            <h2 class="mml-section-title">Marketplace Cities</h2>
            <p class="mml-section-sub">Explore local buying and selling by city.</p>
          </div>
          <button class="mml-link" id="mml-all-cities">All</button>
        </div>
        ${marketplaceCities.length
          ? `<div class="mml-city-grid">${marketplaceCities.map(_city).join('')}</div>`
          : `<div class="mml-empty">Marketplace city pages are coming soon.</div>`
        }
      </section>

      <section class="mml-section">
        <div class="mml-section-head">
          <div>
            <h2 class="mml-section-title">Shop by Category</h2>
            <p class="mml-section-sub">Furniture, electronics, vehicles, and home essentials.</p>
          </div>
          <button class="mml-link" id="mml-all-categories">All</button>
        </div>
        <div class="mml-category-grid" id="mml-categories">${_categorySkeleton()}</div>
      </section>

      <section class="mml-feature">
        <div class="mml-feature-tag"><i class="fa-solid fa-shield-halved"></i> Safe Local Trading</div>
        <h2>Buy and sell with people you can trust.</h2>
        <p>Every member is verified and every chat is handled in-app to keep local deals safer from scams and spam.</p>
        <div class="mml-checks">
          ${_checks(['Verified members only', 'Secure in-app messaging', 'Safe-meetup guidance', 'Free to list, no hidden fees'])}
        </div>
        <button class="mml-feature-cta" id="mml-feature-browse">Browse the Marketplace <i class="fa-solid fa-arrow-right"></i></button>
        <div class="mml-feature-img"><img src="${MARKETPLACE_SAFE_IMAGE}" alt="Local buyer and seller completing a marketplace handoff"></div>
      </section>

      <section class="mml-feature mml-feature-alt">
        <div class="mml-feature-tag"><i class="fa-solid fa-box-open"></i> Everything For Your Place</div>
        <h2>Furnish your home or declutter in minutes.</h2>
        <p>Find furniture, electronics and appliances nearby, or list your own fast with AI-assisted descriptions.</p>
        <div class="mml-checks mml-checks-2">
          ${_checks(['Furniture & home goods', 'Electronics & mobiles', 'Appliances & more', 'Post in under a minute', 'Make & accept offers in chat', 'Buy & sell across your city'])}
        </div>
        <button class="mml-feature-cta" id="mml-feature-sell">Start selling <i class="fa-solid fa-arrow-right"></i></button>
        <div class="mml-feature-img"><img src="${MARKETPLACE_HOME_IMAGE}" alt="Furniture and home goods available in the marketplace"></div>
      </section>

      <section class="mml-section mml-section-alt" id="mp-how-it-works">
        <h2 class="mml-section-title">How It Works</h2>
        <p class="mml-section-sub">Buying and selling locally is as easy as 1-2-3</p>
        <div class="mml-steps" style="margin-top:14px;">
          ${_step(1, 'fa-camera', 'List or Browse', 'Snap a few photos to post an item in minutes, or browse thousands of local listings by category.')}
          ${_step(2, 'fa-comments', 'Chat & Offer', 'Message the seller securely in-app and make an offer. Contact stays in chat so personal numbers stay private.')}
          ${_step(3, 'fa-handshake', 'Meet & Deal', 'Meet in a safe public spot, inspect the item, and complete your deal with confidence.')}
        </div>
      </section>

      <section class="mml-section">
        <h2 class="mml-section-title">Why RoommateGroups Marketplace</h2>
        <p class="mml-section-sub">A local marketplace connected to real roommate communities.</p>
        <div class="mml-trust-grid">
          ${_trust('fa-user-check', 'Verified members', 'Trade with people connected to the RoommateGroups community.')}
          ${_trust('fa-comments', 'Secure chat', 'Keep buyer-seller conversations inside the app until you choose otherwise.')}
          ${_trust('fa-shield-halved', 'Safe meetup guidance', 'Use built-in reminders for public meetups and item inspection.')}
          ${_trust('fa-tags', 'Free to list', 'Basic item listings stay free for everyday local selling.')}
        </div>
      </section>

      ${featured.length ? `
        <section class="mml-section mml-section-alt">
          <div class="mml-section-head">
            <div>
              <h2 class="mml-section-title">Featured Near You</h2>
              <p class="mml-section-sub">Recent active marketplace listings.</p>
            </div>
            <button class="mml-link" id="mml-featured-all">Browse</button>
          </div>
          <div class="mml-scroll" id="mml-featured">${featured.map(renderMobileCard).join('')}</div>
        </section>
      ` : ''}

      <section class="mml-section">
        <div class="mml-cta">
          <div class="mml-cta-title">Ready to find a deal?</div>
          <div class="mml-cta-text">Search local items, message sellers, and get your new place set up inside RoommateGroups.</div>
          <button class="mml-btn mml-btn-primary" id="mml-bottom-browse">Browse the Marketplace</button>
        </div>
      </section>

      <section class="mml-section mml-section-alt" id="mp-faq">
        <h2 class="mml-section-title">Frequently Asked Questions</h2>
        <p class="mml-section-sub">Everything you need to know about the RoommateGroups Marketplace</p>
        <div class="mml-faq-list" style="margin-top:14px;">
          ${MARKETPLACE_FAQS.map(_faq).join('')}
        </div>
      </section>
    </div>
  `;

  _wireBase(container, navigate);
  await _loadCategories(container, navigate);
  attachMobileCardEvents(container.querySelector('#mml-featured'), id => navigate('listing', { id }));
}

function _wireBase(container, navigate) {
  const goSearch = params => navigate('search', { kind: 'sale', sort: 'newest', ...params });
  const countrySelect = container.querySelector('#mml-country');
  const citySelect = container.querySelector('#mml-city');
  const syncCities = () => {
    const country = countrySelect?.value || '';
    if (!citySelect) return;
    Array.from(citySelect.options).forEach(option => {
      if (!option.value) {
        option.hidden = false;
        return;
      }
      option.hidden = !!country && option.dataset.country !== country;
    });
    const selected = citySelect.selectedOptions[0];
    if (selected?.hidden) citySelect.value = '';
  };
  countrySelect?.addEventListener('change', syncCities);
  syncCities();

  container.querySelector('#mml-browse')?.addEventListener('click', () => goSearch({}));
  container.querySelector('#mml-all-categories')?.addEventListener('click', () => goSearch({}));
  container.querySelector('#mml-all-cities')?.addEventListener('click', () => goSearch({}));
  container.querySelector('#mml-featured-all')?.addEventListener('click', () => goSearch({}));
  container.querySelector('#mml-bottom-browse')?.addEventListener('click', () => goSearch({}));
  container.querySelector('#mml-feature-browse')?.addEventListener('click', () => goSearch({}));
  container.querySelector('#mml-sell')?.addEventListener('click', () => navigate('post', { kind: 'sale' }));
  container.querySelector('#mml-feature-sell')?.addEventListener('click', () => navigate('post', { kind: 'sale' }));
  container.querySelectorAll('.mml-city').forEach(btn => {
    btn.addEventListener('click', () => navigate('marketplaceCity', { slug: btn.dataset.slug }));
  });
  container.querySelector('#mml-search-form')?.addEventListener('submit', e => {
    e.preventDefault();
    const keyword = container.querySelector('#mml-keyword')?.value.trim() || '';
    const country = countrySelect?.value || '';
    const city = citySelect?.value || '';
    const params = {};
    if (keyword) {
      params.keyword = keyword;
      params.sort = 'relevance';
    }
    if (country) params.country = country;
    if (city) params.city = city;
    goSearch(params);
  });
}

async function _loadCategories(container, navigate) {
  const grid = container.querySelector('#mml-categories');
  if (!grid) return;
  try {
    const tree = await api.getCategoryTree(true);
    const categories = (Array.isArray(tree) ? tree : [])
      .filter(cat => !cat.parent_id && cat.kind !== 'service')
      .slice(0, 10);
    grid.innerHTML = categories.length ? categories.map(_category).join('') : _categoryFallback();
    grid.querySelectorAll('.mml-category').forEach(btn => {
      btn.addEventListener('click', () => navigate('search', { kind: 'sale', sort: 'newest', category: btn.dataset.category }));
    });
  } catch (err) {
    grid.innerHTML = _categoryFallback();
  }
}

function _categorySkeleton() {
  return Array(6).fill(0).map(() => `
    <div class="mml-category">
      <span class="mml-category-icon" style="background:#f8fafc;color:#cbd5e1;"><i class="fa-solid fa-spinner fa-spin"></i></span>
      <span><span class="mml-category-name">Loading</span><span class="mml-category-meta">Category</span></span>
    </div>
  `).join('');
}

function _categoryFallback() {
  return `
    <button class="mml-category" data-category="furniture">
      <span class="mml-category-icon"><i class="fa-solid fa-couch"></i></span>
      <span><span class="mml-category-name">Furniture</span><span class="mml-category-meta">Browse items</span></span>
    </button>
  `;
}

function _category(cat) {
  const category = cat.category_id || cat.slug || '';
  const childCount = Array.isArray(cat.children) ? cat.children.length : 0;
  return `
    <button class="mml-category" data-category="${_esc(category)}">
      <span class="mml-category-icon"><i class="${_iconClass(cat.icon)}"></i></span>
      <span>
        <span class="mml-category-name">${_esc(cat.name)}</span>
        <span class="mml-category-meta">${childCount ? `${childCount} subcategories` : 'Local items'}</span>
      </span>
    </button>
  `;
}

function _city(city) {
  const country = db.countries.findById(city.country);
  const img = city.marketplace_hero_image || city.hero_image || '';
  const bg = img ? getAssetUrl(img) : HERO_IMAGE;
  const liveCount = db.listings.find(l => (l.city === city.city_id || l.city === city.slug) && l.status === 'active' && l.kind === 'sale').length;
  return `
    <button class="mml-city" data-slug="${_esc(city.slug)}" style="--city-img:url('${_esc(bg)}');">
      <span class="mml-city-body">
        <span class="mml-city-name">${_esc(city.name)}</span>
        <span class="mml-city-meta">
          <span><i class="fa-solid fa-location-dot"></i> ${_esc(country?.name || city.state_province || 'Local')}</span>
          <span><i class="fa-solid fa-box-open"></i> ${liveCount} items</span>
        </span>
      </span>
    </button>
  `;
}

function _checks(items) {
  return items.map(item => `
    <div class="mml-check">
      <i class="fa-solid fa-check"></i>
      <span>${_esc(item)}</span>
    </div>
  `).join('');
}

function _step(num, icon, title, body) {
  return `
    <div class="mml-step">
      <div class="mml-step-icon">
        <i class="fa-solid ${icon}"></i>
        <span class="mml-step-num">${num}</span>
      </div>
      <div><div class="mml-card-title">${_esc(title)}</div><div class="mml-card-text">${_esc(body)}</div></div>
    </div>
  `;
}

function _trust(icon, title, body) {
  return `
    <div class="mml-trust-card">
      <div class="mml-trust-icon"><i class="fa-solid ${icon}"></i></div>
      <div class="mml-card-title">${_esc(title)}</div>
      <div class="mml-card-text">${_esc(body)}</div>
    </div>
  `;
}

function _faq(item) {
  return `
    <div class="mml-faq-item" itemscope itemtype="https://schema.org/Question">
      <div class="mml-faq-icon"><i class="fa-solid fa-question"></i></div>
      <div>
        <h3 class="mml-faq-q" itemprop="name">${_esc(item.q)}</h3>
        <div itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer">
          <p class="mml-faq-a" itemprop="text">${_esc(item.a)}</p>
        </div>
      </div>
    </div>
  `;
}

function _iconClass(icon) {
  const raw = String(icon || 'fa-tag').trim();
  if (raw.includes('fa-solid') || raw.includes('fa-regular') || raw.includes('fa-brands') || raw.includes('fab ')) {
    return raw.replace(/\bfas\b/g, 'fa-solid').replace(/\bfab\b/g, 'fa-brands');
  }
  return raw.startsWith('fa-') ? `fa-solid ${raw}` : `fa-solid fa-${raw}`;
}

function _isMarketplaceEnabled(city) {
  return city?.marketplace_enabled === true || city?.marketplace_enabled === 1 || city?.marketplace_enabled === '1';
}

function _buildSchema(listings, faqs) {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'CollectionPage',
        name: 'RoommateGroups Marketplace',
        url: 'https://roommategroups.com/marketplace',
        description: 'Buy and sell local items with verified RoommateGroups members.',
      },
      {
        '@type': 'ItemList',
        name: 'RoommateGroups Marketplace listings',
        itemListElement: listings.map((listing, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          url: `https://roommategroups.com/listing/${listing.listing_id || listing.id}`,
          item: {
            '@type': 'Product',
            name: listing.title || 'Marketplace listing',
            description: String(listing.description || listing.title || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
          },
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: faqs.map(item => ({
          '@type': 'Question',
          name: item.q,
          acceptedAnswer: {
            '@type': 'Answer',
            text: item.a,
          },
        })),
      },
    ],
  };
}

function _esc(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default { init };
