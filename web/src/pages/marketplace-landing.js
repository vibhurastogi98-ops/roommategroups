import { db } from '../services/db.js';
import { navigate } from '../router.js';
import { renderNavbar, initNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { setSEO } from '../seo.js';
import { api } from '../services/api.js';
import { getCurrentUser } from '../services/auth.js';
import { getAssetUrl } from '../services/assets.js';
import { renderMobileCard } from '../../../mobile/src/components/MobileCard.js';

const MARKETPLACE_SEARCH_PATH = '/search/rooms';
const HERO_IMAGE = 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?w=1800&h=1000&fit=crop&auto=format&q=80';
const MARKETPLACE_SAFE_IMAGE = 'https://images.unsplash.com/photo-1556740738-b6a63e27c4df?w=1200&h=900&fit=crop&auto=format&q=80';
const MARKETPLACE_HOME_IMAGE = 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&h=900&fit=crop&auto=format&q=80';
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

export function renderMarketplaceLandingPage(app) {
  const featuredListings = db.listings.find(l => l.status === 'active' && l.kind === 'sale')
    .sort((a, b) => new Date(b.created_at || b.updated_at || 0) - new Date(a.created_at || a.updated_at || 0))
    .slice(0, 8);
  const cityOptions = db.cities.find(c => c.is_active !== false)
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
    .slice(0, 60);
  const countryOptions = db.countries.find(c => c.is_active !== false)
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')));
  const marketplaceCities = db.cities.find(c => c.is_active !== false && isMarketplaceEnabled(c))
    .sort((a, b) => String(a.name || '').localeCompare(String(b.name || '')))
    .slice(0, 12);

  setSEO({
    title: 'Buy & Sell Locally | RoommateGroups Marketplace',
    description: 'Shop furniture, electronics, vehicles, appliances, and home essentials with verified local members on RoommateGroups Marketplace.',
    canonical: 'https://roommategroups.com/marketplace',
    ogImage: HERO_IMAGE,
    schema: buildMarketplaceSchema(featuredListings, MARKETPLACE_FAQS),
  });

  app.innerHTML = `
    ${renderNavbar()}
    <style>
      .marketplace-landing { background:#fff; color:#0f172a; }
      .marketplace-hero { min-height:720px; background-image:url('${HERO_IMAGE}'); background-size:cover; background-position:center; display:flex; align-items:center; position:relative; }
      .marketplace-hero::before { content:''; position:absolute; inset:0; background:linear-gradient(90deg, rgba(15,23,42,.9), rgba(15,23,42,.62), rgba(15,23,42,.2)); }
      .marketplace-hero .hero-content { position:relative; z-index:1; text-align:left; padding-top:120px; }
      .marketplace-hero .hero-title { max-width:760px; color:#fff; letter-spacing:0; }
      .marketplace-hero .hero-subtitle { max-width:690px; color:rgba(255,255,255,.9); margin-left:0; }
      .marketplace-hero-actions { display:flex; flex-wrap:wrap; gap:12px; margin:26px 0 26px; }
      .marketplace-search-box { width:min(980px,100%); display:grid; grid-template-columns:1.3fr .85fr .95fr auto; gap:10px; padding:12px; background:rgba(255,255,255,.96); border:1px solid rgba(255,255,255,.5); border-radius:8px; box-shadow:0 18px 42px rgba(15,23,42,.22); }
      .marketplace-search-box input, .marketplace-search-box select { width:100%; height:50px; border:1px solid #e2e8f0; border-radius:8px; padding:0 14px; font:inherit; color:#0f172a; background:#fff; }
      .marketplace-search-box button { height:50px; white-space:nowrap; }
      .marketplace-hero-trust { display:flex; flex-wrap:wrap; gap:12px; color:rgba(255,255,255,.88); font-weight:800; font-size:.9rem; }
      .marketplace-hero-trust span { display:inline-flex; align-items:center; gap:8px; padding:9px 12px; border:1px solid rgba(255,255,255,.22); border-radius:8px; background:rgba(255,255,255,.11); }
      .marketplace-category-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(170px,1fr)); gap:16px; }
      .marketplace-category-tile { min-height:132px; display:flex; flex-direction:column; justify-content:space-between; gap:12px; padding:18px; border:1px solid #e2e8f0; border-radius:8px; background:#fff; color:#0f172a; text-decoration:none; box-shadow:0 8px 22px rgba(15,23,42,.04); transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
      .marketplace-category-tile:hover { transform:translateY(-3px); border-color:#94a3b8; box-shadow:0 14px 28px rgba(15,23,42,.08); }
      .marketplace-category-icon { width:44px; height:44px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#f0fdfa; color:#0f766e; font-size:1.15rem; }
      .marketplace-category-name { font-weight:900; font-size:1rem; line-height:1.25; }
      .marketplace-category-meta { color:#64748b; font-size:.78rem; font-weight:700; }
      .marketplace-city-empty { padding:22px; border:1px dashed #cbd5e1; border-radius:8px; background:#f8fafc; color:#475569; line-height:1.55; }
      .marketplace-card-skeleton { min-height:132px; border:1px solid #e2e8f0; border-radius:8px; background:#f8fafc; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-weight:800; }
      .marketplace-featured-grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(240px,1fr)); gap:20px; align-items:start; }
      .marketplace-featured-grid .mobile-card { width:100%; max-width:340px; margin:0; align-self:start; }
      .marketplace-featured-grid .mobile-card > div:first-child { aspect-ratio:4/3 !important; }
      .marketplace-cta-band { background:#111827; color:#fff; border-radius:8px; padding:48px; display:flex; align-items:center; justify-content:space-between; gap:24px; }
      .marketplace-cta-band h2 { margin:0 0 8px; font-size:2rem; font-weight:950; letter-spacing:0; }
      .marketplace-cta-band p { margin:0; color:rgba(255,255,255,.78); line-height:1.55; }
      @media (max-width:900px) {
        .marketplace-hero { min-height:680px; }
        .marketplace-search-box { grid-template-columns:1fr; }
        .marketplace-cta-band { align-items:flex-start; flex-direction:column; padding:30px; }
      }
    </style>
    <main class="marketplace-landing">
      <section class="hero marketplace-hero">
        <div class="hero-content container">
          <div class="hero-badge animate-fade-in-up">
            <i class="fa-solid fa-store"></i>
            RoommateGroups Marketplace
          </div>
          <h1 class="hero-title animate-fade-in-up delay-1">Buy & Sell Locally, Safely</h1>
          <p class="hero-subtitle animate-fade-in-up delay-2">Furnish your new place, declutter your old one, and trade with verified members in your city. No bots. No spam. Just real local deals.</p>
          <div class="marketplace-hero-actions animate-fade-in-up delay-3">
            <a class="btn btn-primary btn-lg" href="${marketplaceSearchUrl()}"><i class="fa-solid fa-magnifying-glass"></i> Browse the Marketplace</a>
            <a class="btn btn-outline btn-lg" href="/post-listing?kind=sale" style="background:#fff;border-color:#fff;color:#111827;">Sell an item &rarr;</a>
          </div>
          <form class="marketplace-search-box animate-fade-in-up delay-3" id="marketplace-landing-search">
            <input id="mp-search-keyword" type="search" placeholder="Search furniture, phones, bikes...">
            <select id="mp-search-country" aria-label="Choose a country">
              <option value="">All countries</option>
              ${countryOptions.map(country => `<option value="${escHtml(country.country_id)}">${escHtml((country.flag_emoji ? country.flag_emoji + ' ' : '') + country.name)}</option>`).join('')}
            </select>
            <select id="mp-search-city" aria-label="Choose a city">
              <option value="">All cities</option>
              ${cityOptions.map(city => `<option value="${escHtml(city.slug)}" data-country="${escHtml(city.country || '')}">${escHtml(city.name)}</option>`).join('')}
            </select>
            <button class="btn btn-primary" type="submit">Search</button>
          </form>
          <div class="marketplace-hero-trust animate-fade-in-up delay-4">
            <span><i class="fa-solid fa-user-check"></i> Verified members</span>
            <span><i class="fa-solid fa-comments"></i> In-app chat</span>
            <span><i class="fa-solid fa-shield-halved"></i> Safer handoffs</span>
          </div>
        </div>
      </section>

      <section class="section section-light">
        <div class="container">
          <div class="section-header animate-on-scroll" style="text-align: center; margin-bottom: 24px;">
            <h2>Popular Cities</h2>
            <p>Buy and sell locally in these marketplace locations</p>
          </div>
          ${marketplaceCities.length
            ? `<div class="home-cities-grid">${marketplaceCities.map(renderCityCard).join('')}</div>`
            : `<div class="marketplace-city-empty">Marketplace city pages are coming soon.</div>`
          }
        </div>
      </section>

      <section class="section home-marketplace-section">
        <div class="container">
          <div class="section-header-row animate-on-scroll">
            <div class="section-header-text">
              <h2>Shop by Category</h2>
              <p>Browse local items from members furnishing, moving, upgrading, or simplifying.</p>
            </div>
            <a href="${marketplaceSearchUrl()}" class="section-explore-link">Explore all <i class="fas fa-arrow-right"></i></a>
          </div>
          <div class="marketplace-category-grid" id="marketplace-category-grid">
            ${renderCategorySkeleton()}
          </div>
        </div>
      </section>

      <section class="feature-highlight-section">
        <div class="feature-block">
          <div class="container">
            <div class="feature-row">
              <div class="feature-content animate-on-scroll">
                <span class="feature-tagline">
                  <i class="fas fa-shield-halved"></i> SAFE LOCAL TRADING
                </span>
                <h2 class="feature-heading">Buy and sell with people you can trust.</h2>
                <p class="feature-subtext">Every member is verified and every chat is handled in-app, giving local deals a safer path away from scams, spam, and awkward off-platform threads.</p>
                <ul class="feature-checklist">
                  <li><i class="fas fa-check-circle"></i> Verified members only</li>
                  <li><i class="fas fa-check-circle"></i> Secure in-app messaging</li>
                  <li><i class="fas fa-check-circle"></i> Safe-meetup guidance</li>
                  <li><i class="fas fa-check-circle"></i> Free to list, no hidden fees</li>
                </ul>
                <a href="${marketplaceSearchUrl()}" class="feature-cta">Browse the Marketplace &rarr;</a>
              </div>
              <div class="feature-image animate-on-scroll">
                <div class="image-wrapper">
                  <img src="${MARKETPLACE_SAFE_IMAGE}" alt="Local buyer and seller completing a marketplace handoff">
                  <div class="image-accent-glow"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="feature-block section-light">
          <div class="container">
            <div class="feature-row reverse">
              <div class="feature-content animate-on-scroll">
                <span class="feature-tagline">
                  <i class="fas fa-box-open"></i> EVERYTHING FOR YOUR PLACE
                </span>
                <h2 class="feature-heading">Furnish your home or declutter in minutes.</h2>
                <p class="feature-subtext">Find furniture, electronics and appliances nearby - or list your own fast with photos, pricing, and AI-assisted descriptions.</p>
                <ul class="feature-checklist grid-2-col">
                  <li><i class="fas fa-check-circle"></i> Furniture &amp; home goods</li>
                  <li><i class="fas fa-check-circle"></i> Electronics &amp; mobiles</li>
                  <li><i class="fas fa-check-circle"></i> Appliances &amp; more</li>
                  <li><i class="fas fa-check-circle"></i> Post in under a minute</li>
                  <li><i class="fas fa-check-circle"></i> Make &amp; accept offers in chat</li>
                  <li><i class="fas fa-check-circle"></i> Buy &amp; sell across your city</li>
                </ul>
                <a href="/post-listing?kind=sale" class="feature-cta">Start selling &rarr;</a>
              </div>
              <div class="feature-image animate-on-scroll">
                <div class="image-wrapper">
                  <img src="${MARKETPLACE_HOME_IMAGE}" alt="Furniture and home goods available in the marketplace">
                  <div class="image-accent-glow-secondary"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section section-light" id="mp-how-it-works">
        <div class="container">
          <div class="section-header animate-on-scroll">
            <h2>How It Works</h2>
            <p>Buying and selling locally is as easy as 1-2-3</p>
          </div>
          <div class="steps-grid">
            <div class="step-card animate-on-scroll">
              <div class="step-icon">
                <i class="fas fa-camera"></i>
                <div class="step-number">1</div>
              </div>
              <h3>List or Browse</h3>
              <p>Snap a few photos to post an item in minutes, or browse thousands of local listings by category.</p>
            </div>
            <div class="step-card animate-on-scroll">
              <div class="step-icon">
                <i class="fas fa-comments"></i>
                <div class="step-number">2</div>
              </div>
              <h3>Chat &amp; Offer</h3>
              <p>Message the seller securely in-app and make an offer. Contact stays in chat so personal numbers stay private.</p>
            </div>
            <div class="step-card animate-on-scroll">
              <div class="step-icon">
                <i class="fas fa-handshake"></i>
                <div class="step-number">3</div>
              </div>
              <h3>Meet &amp; Deal</h3>
              <p>Meet in a safe public spot, inspect the item, and complete your deal with confidence.</p>
            </div>
          </div>
        </div>
      </section>

      ${featuredListings.length ? `
        <section class="section section-light">
          <div class="container">
            <div class="section-header-row animate-on-scroll">
              <div class="section-header-text">
                <h2>Featured Near You</h2>
                <p>Recent active marketplace listings from local members.</p>
              </div>
              <a href="${marketplaceSearchUrl()}" class="section-explore-link">Browse all <i class="fas fa-arrow-right"></i></a>
            </div>
            <div class="marketplace-featured-grid" id="marketplace-featured-grid">
              ${featuredListings.map(renderMobileCard).join('')}
            </div>
          </div>
        </section>
      ` : ''}

      <section class="section">
        <div class="container">
          <div class="marketplace-cta-band">
            <div>
              <h2>Ready to find a deal?</h2>
              <p>Search local items, message sellers, and get your new place set up without leaving RoommateGroups.</p>
            </div>
            <a class="btn btn-primary btn-lg" href="${marketplaceSearchUrl()}">Browse the Marketplace</a>
          </div>
        </div>
      </section>

      <section class="section home-faq-section" id="mp-faq">
        <div class="container">
          <div class="section-header animate-on-scroll">
            <h2>Frequently Asked Questions</h2>
            <p>Everything you need to know about the RoommateGroups Marketplace</p>
          </div>
          <div class="home-faq-list">
            ${MARKETPLACE_FAQS.map(item => `
              <div class="home-faq-item animate-on-scroll" itemscope itemtype="https://schema.org/Question">
                <div class="home-faq-icon"><i class="fas fa-question-circle"></i></div>
                <div class="home-faq-content">
                  <h3 class="home-faq-q" itemprop="name" style="margin:0;font-size:inherit;">${escHtml(item.q)}</h3>
                  <div class="home-faq-a" itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer">
                    <p itemprop="text" style="margin:0;">${escHtml(item.a)}</p>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>
    </main>
    ${renderFooter()}
  `;

  setTimeout(() => {
    initNavbar();
    loadCategories(app);
    wireSearch(app);
    wireCards(app.querySelector('#marketplace-featured-grid'));
    initScrollAnimations();
  }, 0);
}

function marketplaceSearchUrl(params = {}) {
  const query = new URLSearchParams({ kind: 'sale', sort: 'newest', ...params });
  return `${MARKETPLACE_SEARCH_PATH}?${query.toString()}`;
}

async function loadCategories(app) {
  const grid = app.querySelector('#marketplace-category-grid');
  if (!grid) return;
  try {
    const tree = await api.getCategoryTree(true);
    const categories = (Array.isArray(tree) ? tree : [])
      .filter(cat => !cat.parent_id && cat.kind !== 'service')
      .slice(0, 12);
    grid.innerHTML = categories.length ? categories.map(renderCategoryTile).join('') : renderCategoryFallback();
  } catch (err) {
    grid.innerHTML = renderCategoryFallback();
  }
}

function wireSearch(app) {
  const countrySelect = app.querySelector('#mp-search-country');
  const citySelect = app.querySelector('#mp-search-city');
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

  app.querySelector('#marketplace-landing-search')?.addEventListener('submit', e => {
    e.preventDefault();
    const q = app.querySelector('#mp-search-keyword')?.value.trim() || '';
    const country = countrySelect?.value || '';
    const city = citySelect?.value || '';
    const params = {};
    if (q) params.q = q;
    if (country) params.country = country;
    if (city) params.city = city;
    if (q) params.sort = 'relevance';
    navigate(marketplaceSearchUrl(params));
  });
}

function renderCityCard(city) {
  const country = db.countries.findById(city.country);
  const img = city.marketplace_hero_image || city.hero_image || '';
  const liveCount = db.listings.find(l => (l.city === city.city_id || l.city === city.slug) && l.status === 'active' && l.kind === 'sale').length;
  const bg = img ? getAssetUrl(img) : HERO_IMAGE;
  return `
    <a href="/marketplace/${escHtml(city.slug)}" class="hc-card animate-on-scroll">
      <div class="hc-img-wrap" style="${bg ? `background-image: url('${escHtml(bg)}');` : ''}">
        ${!bg ? `<div class="hc-placeholder"><i class="fas fa-city"></i></div>` : ''}
        <div class="hc-overlay"></div>
      </div>
      <div class="hc-body">
        <div class="hc-name">${escHtml(city.name)}</div>
        <div class="hc-meta">
          <span class="hc-country">${escHtml(city.state_province ? `${city.state_province}, ` : '')}${escHtml(country?.name || 'Local')}</span>
        </div>
        <div class="hc-stats">
          <span><i class="fas fa-store"></i> ${liveCount.toLocaleString()} items</span>
          <span><i class="fas fa-tag"></i> Marketplace</span>
        </div>
      </div>
    </a>
  `;
}

function isMarketplaceEnabled(city) {
  return city?.marketplace_enabled === true || city?.marketplace_enabled === 1 || city?.marketplace_enabled === '1';
}

function renderCategorySkeleton() {
  return Array(8).fill(0).map(() => `
    <div class="marketplace-card-skeleton">
      <i class="fa-solid fa-spinner fa-spin"></i>
    </div>
  `).join('');
}

function renderCategoryFallback() {
  return `
    <a href="${marketplaceSearchUrl({ category: 'furniture' })}" class="marketplace-category-tile">
      <span class="marketplace-category-icon"><i class="fa-solid fa-couch"></i></span>
      <span class="marketplace-category-name">Furniture</span>
      <span class="marketplace-category-meta">Browse items</span>
    </a>
  `;
}

function renderCategoryTile(cat) {
  const category = cat.category_id || cat.slug || '';
  const childCount = Array.isArray(cat.children) ? cat.children.length : 0;
  return `
    <a href="${marketplaceSearchUrl({ category })}" class="marketplace-category-tile">
      <span class="marketplace-category-icon"><i class="${iconClass(cat.icon)}"></i></span>
      <span class="marketplace-category-name">${escHtml(cat.name)}</span>
      <span class="marketplace-category-meta">${childCount ? `${childCount} subcategories` : 'Local items'}</span>
    </a>
  `;
}

function wireCards(container) {
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

function initScrollAnimations() {
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px 200px 0px',
    threshold: 0.01,
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, observerOptions);

  document.querySelectorAll('.animate-on-scroll').forEach(el => observer.observe(el));
}

function buildMarketplaceSchema(listings, faqs) {
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
            description: stripHtml(listing.description || listing.title || ''),
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

function iconClass(icon) {
  const raw = String(icon || 'fa-tag').trim();
  if (raw.includes('fa-solid') || raw.includes('fa-regular') || raw.includes('fa-brands') || raw.includes('fab ')) {
    return raw.replace(/\bfas\b/g, 'fa-solid').replace(/\bfab\b/g, 'fa-brands');
  }
  return raw.startsWith('fa-') ? `fa-solid ${raw}` : `fa-solid fa-${raw}`;
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value || '[]'); } catch(e) { return []; }
  }
  return [];
}

function stripHtml(value) {
  return String(value || '').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function escHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
