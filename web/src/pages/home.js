import { db, getLiveListingCount } from '../services/db.js';
import { renderNavbar, initNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { navigate } from '../router.js';
import { setSEO } from '../seo.js'; // SEO Update
import { getAssetUrl } from '../services/assets.js';
import { api } from '../services/api.js';
import { getCurrentUser } from '../services/auth.js';

// ── Data ───────────────────────────────────────────


// ── Removed static listings data array ──

const testimonials = [
  { name: 'Sarah K.', city: 'Austin, TX', quote: 'Found my perfect roommate within a week! The verified profiles gave me peace of mind during the whole process.', rating: 5, initials: 'SK', color: '#1a1a1a' },
  { name: 'Marcus T.', city: 'Berlin, Germany', quote: 'Moving to a new city was scary, but RoommateGroups made finding a room so easy. I was settled within days.', rating: 5, initials: 'MT', color: '#333333' },
  { name: 'Emily R.', city: 'San Francisco, CA', quote: "I've used other platforms before, but this one actually had real, verified listings. No scams, no fake posts.", rating: 5, initials: 'ER', color: '#555555' },
];

const RENTAL_VIEW_KEY = 'rg_recent_rental_view';



// ── Helper functions ────────────────────────────────

function escHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function getListingId(listing) {
  return listing?.listing_id || listing?.id || '';
}

function getListingKind(listing) {
  return (listing?.kind || 'rental').toLowerCase();
}

function isRentalListing(listing) {
  return !listing || getListingKind(listing) === 'rental';
}

function isActiveListing(listing) {
  return listing?.status === 'active' && listing?.is_active !== false;
}

function findListingById(id, extras = []) {
  if (!id) return null;
  return db.listings.findById(id) || extras.find(l => getListingId(l) === id) || null;
}

function rememberRentalView(id, extras = []) {
  const listing = findListingById(id, extras);
  if (listing && isRentalListing(listing)) {
    localStorage.setItem(RENTAL_VIEW_KEY, JSON.stringify({ id, ts: Date.now() }));
  }
}

function shouldShowRentalCrossSell() {
  if (localStorage.getItem(RENTAL_VIEW_KEY)) return true;
  const user = getCurrentUser();
  const savedIds = parseJsonArray(user?.saved_listings);
  return savedIds.some(id => {
    const listing = db.listings.findById(id);
    return listing && isRentalListing(listing);
  });
}

function iconClass(icon) {
  const raw = String(icon || 'fa-tag').trim();
  if (raw.includes('fa-solid') || raw.includes('fa-regular') || raw.includes('fa-brands') || raw.includes('fab ')) {
    return raw.replace(/\bfas\b/g, 'fa-solid').replace(/\bfab\b/g, 'fa-brands');
  }
  return raw.startsWith('fa-') ? `fa-solid ${raw}` : `fa-solid fa-${raw}`;
}

function humanize(value, fallback = '') {
  if (!value) return fallback;
  return String(value).replace(/[_-]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function marketplaceCategoryLabel(listing) {
  const categoryId = listing?.category_id || listing?.category;
  if (listing?.category_name) return listing.category_name;
  if (!categoryId) return listing?.condition || 'Item';
  const category = db.mp_categories?.findById?.(categoryId)
    || db.mp_categories?.findOne?.(c => c.slug === categoryId || c.name === categoryId);
  return category?.name || String(categoryId).replace(/^cat_/, '').replace(/[_-]+/g, ' ');
}

function renderCategoryGrid(categories = []) {
  const topLevel = categories.filter(c => !c.parent_id && String(c.kind || '').toLowerCase() !== 'service').slice(0, 8);
  if (!topLevel.length) {
    return `
      <div class="home-market-empty">
        <i class="fa-solid fa-store"></i>
        <div>
          <strong>Marketplace categories are loading.</strong>
          <span>Try Furniture, Electronics, Vehicles, and more.</span>
        </div>
      </div>
    `;
  }

  return topLevel.map(cat => {
    const slug = encodeURIComponent(cat.slug || cat.category_id || '');
    const children = Array.isArray(cat.children) ? cat.children.length : 0;
    return `
      <a href="/search/rooms?kind=sale&category=${slug}" class="home-market-card">
        <span class="home-market-icon"><i class="${iconClass(cat.icon)}"></i></span>
        <span class="home-market-name">${escHtml(cat.name)}</span>
        <span class="home-market-meta">${children ? `${children} options` : humanize(cat.kind, 'Browse')}</span>
      </a>
    `;
  }).join('');
}

function getListingPhoto(listing) {
  let photos = listing?.images || listing?.photos || [];
  if (typeof photos === 'string') {
    try { photos = JSON.parse(photos); } catch { photos = []; }
  }
  let photo = Array.isArray(photos) ? photos[0] : photos;
  if (typeof photo === 'object' && photo !== null) photo = photo.medium || photo.thumb || photo.full || '';
  return photo ? getAssetUrl(photo) : '';
}

function formatListingPrice(listing) {
  const symbol = listing?.currency === 'INR' ? '₹' : listing?.currency === 'EUR' ? '€' : listing?.currency === 'GBP' ? '£' : '$';
  const value = listing?.price ?? listing?.rent;
  if (value === undefined || value === null || value === '') return getListingKind(listing) === 'rental' ? 'Price TBC' : 'Ask seller';
  const formatted = `${symbol}${Number(value).toLocaleString(listing?.currency === 'INR' ? 'en-IN' : 'en-US')}`;
  return getListingKind(listing) === 'rental' ? `${formatted}/mo` : formatted;
}

function listingLocation(listing) {
  const cityId = listing?.city || listing?.city_id;
  const city = cityId ? db.cities.findById(cityId)?.name || String(cityId).replace('city_', '').replace(/_/g, ' ') : '';
  return [listing?.area, city].filter(Boolean).join(', ') || 'Location TBC';
}

function renderNearListingCard(listing, index) {
  const id = getListingId(listing);
  const photo = getListingPhoto(listing);
  const kind = getListingKind(listing);
  const badge = kind === 'rental'
    ? (listing.room_type || listing.category || 'Rental')
    : marketplaceCategoryLabel(listing);
  const fallback = ['#0f172a', '#115e59', '#4338ca', '#7f1d1d'][index % 4];

  return `
    <a href="/listing/${encodeURIComponent(id)}" class="home-near-card" data-listing-id="${escHtml(id)}">
      <div class="home-near-image" style="${photo ? `background-image:url('${photo}')` : `background:${fallback}`}">
        ${!photo ? `<i class="fa-solid ${kind === 'rental' ? 'fa-house' : 'fa-store'}"></i>` : ''}
        <span>${escHtml(humanize(badge, 'Listing'))}</span>
      </div>
      <div class="home-near-body">
        <div class="home-near-price">${escHtml(formatListingPrice(listing))}</div>
        <div class="home-near-title">${escHtml(listing.title || 'Untitled listing')}</div>
        <div class="home-near-location"><i class="fa-solid fa-location-dot"></i>${escHtml(listingLocation(listing))}</div>
      </div>
    </a>
  `;
}

function renderNearNotice(title, body, icon = 'fa-location-crosshairs') {
  return `
    <div class="home-near-notice">
      <i class="fa-solid ${icon}"></i>
      <div>
        <strong>${escHtml(title)}</strong>
        <span>${escHtml(body)}</span>
      </div>
      <a href="/search/rooms?sort=newest" class="btn btn-outline">Browse newest</a>
    </div>
  `;
}

function renderRentalCrossSell() {
  return `
    <section class="section home-cross-sell-section">
      <div class="container">
        <a href="/category/furniture" class="home-cross-sell-card animate-on-scroll">
          <div class="home-cross-sell-icon"><i class="fa-solid fa-couch"></i></div>
          <div class="home-cross-sell-copy">
            <div class="home-cross-sell-title">Just found a place? Furnish it -> Furniture &amp; Home</div>
            <p>Browse couches, tables, decor, and home essentials from nearby members.</p>
          </div>
          <span class="home-cross-sell-action">Shop now <i class="fa-solid fa-arrow-right"></i></span>
        </a>
      </div>
    </section>
  `;
}

async function hydrateHomeCategories(app) {
  const grid = app.querySelector('#home-category-grid');
  if (!grid) return;
  try {
    const categories = await api.getCategoryTree(true);
    grid.innerHTML = renderCategoryGrid(Array.isArray(categories) ? categories : []);
  } catch {
    grid.innerHTML = renderCategoryGrid([]);
  }
}

function hydrateNearYou(app) {
  const strip = app.querySelector('#home-near-strip');
  if (!strip) return;

  const loadListings = async (lat, lng) => {
    strip.innerHTML = renderNearNotice('Finding listings near you', 'Sorting rooms and items by distance.', 'fa-spinner fa-spin');
    try {
      const payload = await api.searchListings({ lat, lng, radius: 50, sort: 'distance', page: 1, limit: 8 }, true);
      const listings = Array.isArray(payload) ? payload : payload?.results || [];
      strip.innerHTML = listings.length
        ? listings.map((listing, index) => renderNearListingCard(listing, index)).join('')
        : renderNearNotice('No nearby listings yet', 'Browse newest listings while your local marketplace fills up.', 'fa-map-pin');
      wireRentalViewTracking(app, listings);
    } catch {
      strip.innerHTML = renderNearNotice('Could not load nearby listings', 'The newest listings are still available.', 'fa-triangle-exclamation');
    }
  };

  if (!navigator.geolocation) {
    strip.innerHTML = renderNearNotice('Location is not available', 'Browse newest listings or search by city.', 'fa-location-dot');
    return;
  }

  navigator.geolocation.getCurrentPosition(
    pos => loadListings(pos.coords.latitude, pos.coords.longitude),
    () => {
      strip.innerHTML = renderNearNotice('Use location to see what is nearby', 'Rooms, furniture, vehicles, and more will sort by distance.', 'fa-location-crosshairs');
    },
    { timeout: 7000, maximumAge: 300000 }
  );
}

function wireRentalViewTracking(app, extras = []) {
  app.querySelectorAll('a[href^="/listing/"]').forEach(link => {
    if (link.dataset.rentalViewTracking === 'true') return;
    link.dataset.rentalViewTracking = 'true';
    link.addEventListener('click', () => {
      const id = decodeURIComponent((link.getAttribute('href') || '').split('/listing/')[1] || '').split('?')[0];
      rememberRentalView(id, extras);
    });
  });
}


function renderListingCard(listing, index) {
  const gradient = ['linear-gradient(135deg, #1a1a1a 0%, #444444 100%)', 'linear-gradient(135deg, #1a1a1a 0%, #444444 100%)', 'linear-gradient(135deg, #1a1a1a 0%, #444444 100%)', 'linear-gradient(135deg, #1a1a1a 0%, #444444 100%)'][index % 4];
  // images can be a JSON string (from D1) or an array (from localStorage)
  let _imgs = listing.images || listing.photos || [];
  if (typeof _imgs === 'string') { try { _imgs = JSON.parse(_imgs); } catch(e) { _imgs = []; } }
  let photo = _imgs[0] || '';
  if (typeof photo === 'object' && photo !== null) photo = photo.medium || photo.thumb || photo.full || '';
  if (photo) photo = getAssetUrl(photo);
  const isRoommate = listing.category === 'roommate_wanted' || listing.category === 'room_wanted';

  return `
    <div class="listing-card">
      <div class="listing-card-image" style="background: ${photo ? `url('${photo}') center/cover` : gradient}">
        ${!photo ? `<div class="listing-card-image-icon"><i class="fas fa-home"></i></div>` : ''}
        <div class="listing-type-badge">${isRoommate ? 'Looking for Room' : listing.room_type || 'Private Room'}</div>
      </div>
      <div class="listing-card-body">
        <div class="listing-price">$${listing.rent ?? listing.price ?? '?'}<span>/mo</span></div>
        <div class="listing-title">${listing.title}</div>
        <div class="listing-location">
          <i class="fas fa-location-dot"></i>
          ${db.cities.findById(listing.city)?.name || (listing.city ? listing.city.replace('city_', '').replace(/_/g, ' ') : 'Unknown City')}${(() => { const cId = listing.country || db.cities.findById(listing.city)?.country; return cId ? ', ' + (db.countries.findById(cId)?.name || cId) : ''; })()}
        </div>
        <a href="/listing/${listing.listing_id}" class="btn btn-outline">View Listing</a>
      </div>
    </div>
  `;
}

// ── Helper functions deleted (moved to component) ──

// ── Render ──────────────────────────────────────────

export function renderHomePage(app) {
  // SEO Update — unique title, description, canonical, schemas
  setSEO({
    title: 'Find Rooms, Roommates & Local Deals | RoommateGroups',
    description: 'Find compatible roommates and rooms, join housing communities, and buy & sell furniture, electronics and more locally — free on RoommateGroups.',
    canonical: 'https://roommategroups.com/',
    schema: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'RoommateGroups',
        url: 'https://roommategroups.com',
        logo: 'https://roommategroups.com/logo.png',
        contactPoint: { '@type': 'ContactPoint', email: 'hello@roommategroups.com', contactType: 'Customer Support' },
        sameAs: ['https://www.facebook.com/Roommategroups', 'https://www.instagram.com/roommategroups', 'https://www.youtube.com/@Roommategroups'],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'RoommateGroups',
        url: 'https://roommategroups.com',
        potentialAction: { '@type': 'SearchAction', target: 'https://roommategroups.com/search?q={search_term_string}', 'query-input': 'required name=search_term_string' },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: [
          { '@type': 'Question', name: 'What is RoommateGroups?', acceptedAnswer: { '@type': 'Answer', text: 'RoommateGroups is a free US-based platform that helps people find compatible roommates, join local housing communities, and list rooms for rent across 65+ cities.' } },
          { '@type': 'Question', name: 'How do I find a roommate in my city?', acceptedAnswer: { '@type': 'Answer', text: 'Visit roommategroups.com, select your city from the directory, and browse verified roommate listings. You can filter by budget, lifestyle, and move-in date.' } },
          { '@type': 'Question', name: 'Is RoommateGroups free?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Browsing listings, creating a profile, and contacting roommates is completely free on RoommateGroups.' } },
          { '@type': 'Question', name: 'What cities does RoommateGroups cover?', acceptedAnswer: { '@type': 'Answer', text: 'RoommateGroups covers 65+ US cities including New York, Los Angeles, Chicago, Austin, Miami, Seattle, Boston, Denver, and more.' } },
          { '@type': 'Question', name: 'How is RoommateGroups different from Craigslist or Facebook?', acceptedAnswer: { '@type': 'Answer', text: 'RoommateGroups is purpose-built for roommate matching. It offers lifestyle compatibility filters, verified profiles, AI-assisted listing descriptions, and city-based roommate communities — features not available on general classifieds sites.' } },
          { '@type': 'Question', name: 'Can I buy and sell items on RoommateGroups?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Alongside rooms and roommates, you can buy, sell and find local items like furniture, electronics and appliances from verified members in your city — free to list.' } },
        ],
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: 'Find Roommate Groups Near You | RoommateGroups',
        url: 'https://roommategroups.com/',
        speakable: {
          '@type': 'SpeakableSpecification',
          cssSelector: ['h1', '.hero-subtitle', '.home-faq-section']
        }
      },
    ],
  });

  const dbCities = db.cities.findAll().filter(c => c.is_active);
  const mapCity = c => ({
    name: c.name,
    slug: c.slug,
    count: getLiveListingCount(c.city_id),
    country: db.countries.findById(c.country)?.name || c.country,
    state: c.state_province || '',
    image: c.hero_image ? getAssetUrl(c.hero_image) : '',
    avg_rent: c.avg_rent || 0,
    members: c.member_count || 0,
  });
  const homeCities = db.cities.findAll()
    .filter(c => c.is_active && c.show_in_popular !== false)
    .map(mapCity);
  const popularCities = db.cities.findAll()
    .filter(c => c.is_active && (c.show_in_popular_section === true || (c.show_in_popular_section === undefined && c.show_in_popular === true)))
    .map(mapCity);
  const fbGroups = db.fb_cities.findAll()
    .filter(g => g.is_popular !== false)
    .sort((a, b) => (a.priority || 0) - (b.priority || 0));
  const countries = db.countries.findAll().filter(c => c.is_active);
  const recentSaleListings = db.listings.find(l => l.status === 'active' && String(l.kind || '').toLowerCase() === 'sale')
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 4);
  const activeRentalListings = db.listings.find(l => isActiveListing(l) && isRentalListing(l));

  app.innerHTML = `
    <!-- Navigation -->
    ${renderNavbar()}

    <!-- Hero Section -->
    <section class="hero" id="hero">
      <div class="hero-content">
        <div class="hero-badge animate-fade-in-up">
          ✅ Verified Members · 🏠 Rooms & Roommates · 🛒 Buy & Sell Locally · 🛡️ 1,500,000+ Trusted
        </div>
        <h1 class="hero-title animate-fade-in-up delay-1">
          Find Rooms, Roommates & <span class="gradient-text">Local Deals</span><br>
          — All in One Place
        </h1>
        <p class="hero-subtitle animate-fade-in-up delay-2">
          Search verified rooms, apartments, sublets, co-living spaces and more. 
          Whether you need a roommate or a place to stay — we've got you covered. 
          No bots. No spam. Just real listings. Plus, buy and sell furniture, electronics and more with verified neighbors in your city.
        </p>
        <div class="hero-search animate-fade-in-up delay-3" id="hero-search">
          <div class="search-field">
            <select id="search-country" aria-label="Select country">
              <option value="">🌍 Search Country</option>
              ${countries.map(c => `<option value="${c.country_id}">${c.flag_emoji} ${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="search-field">
            <select id="search-city" aria-label="Select city">
              <option value="">🏙️ Find a City...</option>
              ${dbCities.map(c => `<option value="${c.slug}">${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="search-field">
            <select id="search-type" aria-label="Search types">
              <option value="">🏠 Rooms & More</option>
              <option value="__sale">🛒 Buy & Sell Items</option>
              <option value="room">Room for Rent</option>
              <option value="apartment">Apartment for Rent</option>
              <option value="sublet">Sublet</option>
              <option value="roommate_wanted">Roommate Wanted</option>
              <option value="coliving">Co-living Space</option>
              <option value="house">House for Rent</option>
              <option value="student_housing">Student Housing</option>
              <option value="room_wanted">Room Wanted</option>
            </select>
          </div>
          <button class="search-btn" id="search-btn">
            <i class="fas fa-bolt"></i>
            Find Matches
          </button>
        </div>

        <div class="hero-trust-icons animate-fade-in-up delay-4">
          <div class="trust-item">
            <i class="fas fa-home"></i>
            <span>All Property Types</span>
          </div>
          <div class="trust-divider">|</div>
          <div class="trust-item">
            <i class="fas fa-shield-halved"></i>
            <span>Verified Listings</span>
          </div>
          <div class="trust-divider">|</div>
          <div class="trust-item">
            <i class="fas fa-bolt"></i>
            <span>Instant Matches</span>
          </div>
        </div>
      </div>
    </section>

    <section class="section home-cities-section" id="cities">
      <div class="container">
        <div class="section-header animate-on-scroll" style="text-align: center; margin-bottom: 24px;">
          <h2>Popular Cities</h2>
          <p>Find your next home in these top locations</p>
        </div>
        ${homeCities.length === 0
      ? `<div class="home-cities-empty"><i class="fas fa-city"></i><p>No cities available yet. Check back soon!</p></div>`
      : `<div class="home-cities-grid">
              ${homeCities.map(c => `
                <a href="/cities/${c.slug}" class="hc-card animate-on-scroll">
                  <div class="hc-img-wrap" style="${c.image ? `background-image: url('${c.image}');` : ''}">
                    ${!c.image ? `<div class="hc-placeholder"><i class="fas fa-city"></i></div>` : ''}
                    <div class="hc-overlay"></div>
                  </div>
                  <div class="hc-body">
                    <div class="hc-name">${c.name}</div>
                    <div class="hc-meta">
                      <span class="hc-country">${c.state ? `${c.state}, ` : ''}${c.country}</span>
                    </div>
                    <div class="hc-stats">
                      <span><i class="fas fa-home"></i> ${c.count.toLocaleString()} listings</span>
                      ${c.avg_rent ? `<span><i class="fas fa-tag"></i> ~$${c.avg_rent.toLocaleString()}/mo</span>` : ''}
                    </div>
                  </div>
                </a>
              `).join('')}
            </div>`
    }
      </div>
    </section>


    <section class="section home-marketplace-section" id="marketplace-home">
      <style>
        .home-marketplace-section { background:#fff; }
        .home-market-grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(150px,1fr)); gap:14px; }
        .home-market-card { min-height:132px; display:flex; flex-direction:column; justify-content:space-between; gap:12px; padding:18px; border:1px solid #e2e8f0; border-radius:8px; background:#fff; color:#0f172a; text-decoration:none; box-shadow:0 8px 22px rgba(15,23,42,0.04); transition:transform .18s ease, box-shadow .18s ease, border-color .18s ease; }
        .home-market-card:hover { transform:translateY(-3px); border-color:#94a3b8; box-shadow:0 14px 28px rgba(15,23,42,0.08); }
        .home-market-icon { width:44px; height:44px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#f0fdfa; color:#0f766e; font-size:1.15rem; }
        .home-market-name { font-weight:900; font-size:1rem; line-height:1.25; }
        .home-market-meta { color:#64748b; font-size:.78rem; font-weight:700; }
        .home-market-actions { display:flex; align-items:center; gap:16px; flex-wrap:wrap; margin-top:24px; }
        .home-market-empty, .home-near-notice { display:flex; align-items:center; gap:14px; padding:18px; border:1px dashed #cbd5e1; border-radius:8px; background:#f8fafc; color:#475569; }
        .home-market-empty i, .home-near-notice > i { width:42px; height:42px; border-radius:8px; display:flex; align-items:center; justify-content:center; background:#fff; color:#0f766e; flex-shrink:0; }
        .home-market-empty strong, .home-near-notice strong { display:block; color:#0f172a; font-size:.95rem; margin-bottom:3px; }
        .home-market-empty span, .home-near-notice span { display:block; font-size:.82rem; line-height:1.45; }
        .home-near-track { display:flex; gap:16px; overflow-x:auto; padding:2px 2px 18px; scroll-snap-type:x mandatory; scrollbar-width:none; }
        .home-near-track::-webkit-scrollbar { display:none; }
        .home-near-card { width:250px; flex:0 0 250px; scroll-snap-align:start; background:#fff; border:1px solid #e2e8f0; border-radius:8px; overflow:hidden; color:#0f172a; text-decoration:none; box-shadow:0 10px 24px rgba(15,23,42,.05); }
        .home-near-image { height:150px; background-size:cover; background-position:center; position:relative; display:flex; align-items:center; justify-content:center; color:#fff; }
        .home-near-image::after { content:''; position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,.5), rgba(0,0,0,.08)); }
        .home-near-image > i { position:relative; z-index:1; font-size:1.7rem; opacity:.9; }
        .home-near-image span { position:absolute; left:12px; bottom:12px; z-index:2; background:rgba(255,255,255,.92); color:#0f172a; border-radius:6px; padding:5px 9px; font-size:.66rem; font-weight:900; text-transform:uppercase; letter-spacing:.04em; }
        .home-near-body { padding:14px; }
        .home-near-price { font-size:1.08rem; font-weight:900; color:#0f172a; margin-bottom:5px; }
        .home-near-title { font-size:.92rem; font-weight:800; line-height:1.35; margin-bottom:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .home-near-location { display:flex; align-items:center; gap:6px; color:#64748b; font-size:.76rem; font-weight:650; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
        .home-cross-sell-card { display:flex; align-items:center; gap:18px; padding:22px; border:1px solid #d1fae5; border-radius:8px; background:linear-gradient(135deg,#ecfdf5,#f8fafc); color:#0f172a; text-decoration:none; box-shadow:0 12px 28px rgba(15,118,110,.08); }
        .home-cross-sell-icon { width:54px; height:54px; border-radius:8px; background:#0f766e; color:#fff; display:flex; align-items:center; justify-content:center; font-size:1.35rem; flex-shrink:0; }
        .home-cross-sell-copy { flex:1; min-width:0; }
        .home-cross-sell-title { font-size:1.15rem; font-weight:900; line-height:1.25; }
        .home-cross-sell-copy p { margin:5px 0 0; color:#475569; line-height:1.5; }
        .home-cross-sell-action { display:inline-flex; align-items:center; gap:7px; font-weight:900; color:#0f766e; white-space:nowrap; }
        @media (max-width:700px) {
          .home-market-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
          .home-cross-sell-card { align-items:flex-start; flex-direction:column; }
        }
      </style>
      <div class="container">
        <div class="section-header-row animate-on-scroll">
          <div class="section-header-text">
            <h2>Buy &amp; Sell Locally</h2>
            <p>Furnish your new place or declutter your old one — trade safely with verified members near you.</p>
          </div>
          <a href="/marketplace" class="section-explore-link">Browse the Marketplace <i class="fas fa-arrow-right"></i></a>
        </div>
        <div class="home-market-grid" id="home-category-grid">
          ${renderCategoryGrid([])}
        </div>
        <div class="home-market-actions animate-on-scroll">
          <a href="/marketplace" class="btn btn-primary">Browse the Marketplace</a>
          <a href="/post-listing?kind=sale" class="section-explore-link">Sell an item -&gt;</a>
        </div>
        ${recentSaleListings.length ? `
          <div class="section-header-row animate-on-scroll" style="margin-top:34px;margin-bottom:16px;">
            <div class="section-header-text">
              <h3 style="margin:0;font-size:1.2rem;font-weight:900;">Near you</h3>
              <p>Recently listed marketplace items from local members</p>
            </div>
          </div>
          <div class="home-near-track">
            ${recentSaleListings.map((listing, index) => renderNearListingCard(listing, index)).join('')}
          </div>
        ` : ''}
      </div>
    </section>



    <section class="stats-section" id="stats">
      <div class="container">
        <div class="stats-container">
          <div class="stat-card" data-target="31" data-suffix="+">
            <div class="stat-icon-box">
              <i class="fas fa-globe"></i>
            </div>
            <div class="stat-text">
              <div class="stat-number-wrapper">
                <span class="stat-number">0</span><span class="stat-suffix">+</span>
              </div>
              <div class="stat-label">CITIES</div>
            </div>
          </div>

          <div class="stat-card" data-target="1500000" data-suffix="+">
            <div class="stat-icon-box">
              <i class="fas fa-users"></i>
            </div>
            <div class="stat-text">
              <div class="stat-number-wrapper">
                <span class="stat-number">0</span><span class="stat-suffix">+</span>
              </div>
              <div class="stat-label">COMMUNITY MEMBERS</div>
            </div>
          </div>

          <div class="stat-card" data-target="10000" data-suffix="+">
            <div class="stat-icon-box">
              <i class="fas fa-shield-halved"></i>
            </div>
            <div class="stat-text">
              <div class="stat-number-wrapper">
                <span class="stat-number">0</span><span class="stat-suffix">+</span>
              </div>
              <div class="stat-label">VERIFIED MEMBERS</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Popular Facebook Groups -->

    <section class="section popular-fb-groups-section" id="popular-groups">
      <div class="container">
        <div class="section-header-row animate-on-scroll">
          <div class="section-header-text">
            <h2>Popular FB Groups</h2>
            <p>Helping tenants & landlords connect for hassle-free renting</p>
          </div>
          <a href="/fb-groups" class="section-explore-link">Explore all groups <i class="fas fa-arrow-right"></i></a>
        </div>
        ${fbGroups.length === 0
      ? `<div class="home-cities-empty"><i class="fab fa-facebook"></i><p>No featured groups available. Check back soon!</p></div>`
      : `<div class="home-cities-grid">
              ${fbGroups.map(g => {
                const slug = (g.city_name || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
                const memberLabel = g.total_members >= 1000000
                  ? (g.total_members / 1000000).toFixed(1) + 'M'
                  : g.total_members >= 1000
                    ? Math.round(g.total_members / 1000) + 'K'
                    : (g.total_members || 0).toString();
                return `
                <a href="/fb-groups/${slug}" class="hc-card animate-on-scroll" style="text-decoration:none;color:inherit;">
                  <div class="hc-img-wrap" style="display:block;">
                    ${g.city_image
                      ? `<img src="${getAssetUrl(g.city_image)}" alt="${g.fb_group_name || 'FB Group'}" loading="lazy" onerror="this.onerror=null;this.parentElement.classList.add('hc-no-img');this.remove();">`
                      : `<div class="hc-placeholder"><i class="fab fa-facebook"></i></div>`}
                    <div class="hc-overlay"></div>
                  </div>
                  <div class="hc-body">
                    <div class="hc-name">${g.fb_group_name || 'Facebook Group'}</div>
                    <div class="hc-meta">
                      <span class="hc-country"><i class="fas fa-location-dot"></i> ${g.city_name || 'Unknown City'}</span>
                    </div>
                    <div style="display:inline-flex;align-items:center;gap:6px;background:#F1F5F9;color:#475569;font-size:0.78rem;font-weight:700;padding:5px 12px;border-radius:100px;margin-top:10px;width:fit-content;">
                      <i class="fas fa-users" style="color:#7c3aed;font-size:0.7rem;"></i>
                      ${memberLabel}+ Members
                    </div>
                  </div>
                </a>
              `}).join('')}
            </div>
            <div class="view-more-container animate-on-scroll" style="text-align: center; margin-top: 48px;">
              <a href="/fb-groups" class="btn btn-primary btn-lg">View All FB Groups <i class="fas fa-arrow-right" style="margin-left: 8px;"></i></a>
            </div>`

    }
      </div>
    </section>


    <!-- Feature Highlights -->
    <section class="feature-highlight-section">
      <!-- Section 1: Community -->
      <div class="feature-block">
        <div class="container">
          <div class="feature-row">
            <div class="feature-content animate-on-scroll">
              <span class="feature-tagline">
                <i class="fas fa-shield-halved"></i> SAFE & TRUSTED COMMUNITY
              </span>
              <h2 class="feature-heading">Find your perfect roommate with complete peace of mind.</h2>
              <p class="feature-subtext">We know finding a roommate can feel overwhelming. That's why every listing and profile on RoommateGroups is carefully moderated to keep you safe from scams and fraud.</p>
              
              <ul class="feature-checklist">
                <li><i class="fas fa-check-circle"></i> All listings manually moderated</li>
                <li><i class="fas fa-check-circle"></i> Scam-free verified environment</li>
                <li><i class="fas fa-check-circle"></i> Secure chat via Facebook Messenger</li>
                <li><i class="fas fa-check-circle"></i> Active in 31+ cities worldwide</li>
              </ul>
              
              <a href="/safety" class="feature-cta">Learn more about our community →</a>
            </div>
            <div class="feature-image animate-on-scroll">
              <div class="image-wrapper">
                <img src="/assets/img/community.png" alt="Happy roommates in a shared living space">
                <div class="image-accent-glow"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Section 2: Listings -->
      <div class="feature-block section-light">
        <div class="container">
          <div class="feature-row reverse">
            <div class="feature-content animate-on-scroll">
              <span class="feature-tagline">
                <i class="fas fa-list-check"></i> LISTINGS & CONNECTIONS
              </span>
              <h2 class="feature-heading">Connect with 1,500,000+ community members looking for the same thing.</h2>
              <p class="feature-subtext">Whether you're a student, a working professional, or a landlord — our platform connects you with genuine, relevant matches fast. No endless scrolling, no wasted time.</p>
              
              <ul class="feature-checklist grid-2-col">
                <li><i class="fas fa-check-circle"></i> 10,000+ verified members</li>
                <li><i class="fas fa-check-circle"></i> Students & professionals</li>
                <li><i class="fas fa-check-circle"></i> Furnished room options</li>
                <li><i class="fas fa-check-circle"></i> Budget-friendly matches</li>
                <li><i class="fas fa-check-circle"></i> Landlord-friendly tools</li>
                <li><i class="fas fa-check-circle"></i> Global city coverage</li>
              </ul>
              
              <a href="/search/rooms" class="feature-cta">Explore listings →</a>
            </div>
            <div class="feature-image animate-on-scroll">
              <div class="image-wrapper">
                <img src="/assets/img/mockup.png" alt="RoommateGroups Dashboard and Map Mockup">
                <div class="image-accent-glow-secondary"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <section class="section section-light home-nearby-section" id="near-you">
      <div class="container">
        <div class="section-header-row animate-on-scroll">
          <div class="section-header-text">
            <h2>Near you</h2>
            <p>Rooms, furniture, vehicles, and more sorted by distance</p>
          </div>
          <a href="/search/rooms?sort=distance" class="section-explore-link">Open search <i class="fas fa-arrow-right"></i></a>
        </div>
        <div class="home-near-track" id="home-near-strip">
          ${renderNearNotice('Finding listings near you', 'Allow location access to sort the marketplace by distance.', 'fa-location-crosshairs')}
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section class="section section-light" id="how-it-works">
      <div class="container">
        <div class="section-header animate-on-scroll">
          <h2>How It Works</h2>
          <p>Finding your next room or roommate is as easy as 1-2-3</p>
        </div>
        <div class="steps-grid">
          <div class="step-card animate-on-scroll">
            <div class="step-icon">
              <i class="fas fa-magnifying-glass"></i>
              <div class="step-number">1</div>
            </div>
            <h3>Search</h3>
            <p>Browse rooms and roommate profiles in your desired city. Filter by price, location, and preferences.</p>
          </div>
          <div class="step-card animate-on-scroll">
            <div class="step-icon">
              <i class="fas fa-comments"></i>
              <div class="step-number">2</div>
            </div>
            <h3>Connect</h3>
            <p>Message verified members directly through our secure platform. Get to know potential roommates.</p>
          </div>
          <div class="step-card animate-on-scroll">
            <div class="step-icon">
              <i class="fas fa-house-circle-check"></i>
              <div class="step-number">3</div>
            </div>
            <h3>Move In</h3>
            <p>Find your perfect match and move in with confidence. Join thousands of happy renters worldwide.</p>
          </div>
        </div>
      </div>
    </section>

    <!-- Featured Listings -->
    <section class="section" id="listings">
      <div class="container">
        <div class="section-header animate-on-scroll">
          <h2>Listings</h2>
          <p>Hand-picked rooms and apartments from our verified hosts</p>
        </div>
        ${activeRentalListings.length > 0 ? `
        <div class="listings-wrapper">
          <div class="listings-track" id="listings-track">
            ${activeRentalListings.slice(0, 6).map((l, i) => renderListingCard(l, i)).join('')}
          </div>
        </div>
        <div class="carousel-controls">
          <button class="carousel-btn" id="carousel-prev" aria-label="Previous listings">
            <i class="fas fa-chevron-left"></i>
          </button>
          <button class="carousel-btn" id="carousel-next" aria-label="Next listings">
            <i class="fas fa-chevron-right"></i>
          </button>
        </div>
        ` : `
        <div style="text-align:center;padding:60px 20px;color:#64748b;">
          <i class="fas fa-home" style="font-size:2.5rem;margin-bottom:16px;display:block;opacity:0.4;"></i>
          <p style="font-size:1.1rem;margin-bottom:16px;">No listings available yet. Be the first to list!</p>
          <a href="/post-listing" class="btn btn-primary">Post a Listing</a>
        </div>
        `}
      </div>
    </section>

    ${shouldShowRentalCrossSell() ? renderRentalCrossSell() : ''}

    <!-- Testimonials -->
    <section class="section section-light" id="testimonials">
      <div class="container">
        <div class="section-header animate-on-scroll">
          <h2>What Our Members Say</h2>
          <p>Hear from real people who found their perfect living situation</p>
        </div>
        <div class="testimonials-carousel-container">
          <div class="testimonials-marquee marquee-ltr">
            ${[...testimonials, ...testimonials, ...testimonials, ...testimonials].map(t => `
              <div class="testimonial-card glass-card">
                <div class="glass-orb"></div>
                <i class="fas fa-quote-right quote-icon"></i>
                <div class="testimonial-stars">
                  ${Array(t.rating).fill('<i class="fas fa-star"></i>').join('')}
                </div>
                <p class="testimonial-quote">"${t.quote}"</p>
                <div class="testimonial-author">
                  <div class="testimonial-avatar" style="background: linear-gradient(45deg, ${t.color}, ${t.color}dd)">
                    ${t.initials}
                  </div>
                  <div class="author-info">
                    <div class="testimonial-name">${t.name}</div>
                    <div class="testimonial-city">${t.city}</div>
                  </div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="cta-section" id="cta">
      <div class="container">
        <div class="cta-content animate-on-scroll">
          <h2>List Your Room for Free</h2>
          <p>Reach thousands of verified renters looking for their next home. No fees, no hassle.</p>
          <a href="/post-listing" class="btn btn-white btn-lg">
            <i class="fas fa-plus"></i>
            Post a Listing
          </a>
        </div>
      </div>
    </section>

    <!-- FAQ Section -->
    <section class="section home-faq-section" id="faq">
      <div class="container">
        <div class="section-header animate-on-scroll">
          <h2>Frequently Asked Questions</h2>
          <p>Everything you need to know about RoommateGroups</p>
        </div>
        <div class="home-faq-list">
          ${[
      { q: 'What is RoommateGroups?', a: 'RoommateGroups is a free US-based platform that helps people find compatible roommates, join local housing communities, and list rooms for rent across 65+ cities.' },
      { q: 'How do I find a roommate in my city?', a: 'Visit roommategroups.com, select your city from the directory, and browse verified roommate listings. You can filter by budget, lifestyle, and move-in date.' },
      { q: 'Is RoommateGroups free?', a: 'Yes. Browsing listings, creating a profile, and contacting roommates is completely free on RoommateGroups.' },
      { q: 'What cities does RoommateGroups cover?', a: 'RoommateGroups covers 65+ US cities including New York, Los Angeles, Chicago, Austin, Miami, Seattle, Boston, Denver, and more.' },
      { q: 'How is RoommateGroups different from Craigslist or Facebook?', a: 'RoommateGroups is purpose-built for roommate matching. It offers lifestyle compatibility filters, verified profiles, AI-assisted listing descriptions, and city-based roommate communities — features not available on general classifieds sites.' },
      { q: 'Can I buy and sell items on RoommateGroups?', a: 'Yes. Alongside rooms and roommates, you can buy, sell and find local items like furniture, electronics and appliances from verified members in your city — free to list.' },
    ].map(item => `
            <div class="home-faq-item animate-on-scroll" itemscope itemtype="https://schema.org/Question">
              <div class="home-faq-icon"><i class="fas fa-question-circle"></i></div>
              <div class="home-faq-content">
                <h3 class="home-faq-q" itemprop="name" style="margin:0;font-size:inherit;">${item.q}</h3>
                <div class="home-faq-a" itemprop="acceptedAnswer" itemscope itemtype="https://schema.org/Answer">
                  <p itemprop="text" style="margin:0;">${item.a}</p>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    </section>

    ${renderFooter()}
  `;

  // ── Interactivity ───────────────────────────────────
  initNavbar();
  hydrateHomeCategories(app);
  hydrateNearYou(app);
  wireRentalViewTracking(app);

  // Carousel controls
  const track = document.getElementById('listings-track');
  const prevBtn = document.getElementById('carousel-prev');
  const nextBtn = document.getElementById('carousel-next');
  const scrollAmount = 320;

  if (prevBtn && track) prevBtn.addEventListener('click', () => {
    track.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
  });

  if (nextBtn && track) nextBtn.addEventListener('click', () => {
    track.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  });

  // Scroll-triggered animations (Intersection Observer)
  const observerOptions = {
    root: null,
    rootMargin: '0px 0px 200px 0px', // Trigger animations 200px before elements enter viewport
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

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    // Skip hash-route links (e.g., #/auth/login)
    const href = anchor.getAttribute('href');
    if (href.startsWith('#/')) return;

    anchor.addEventListener('click', (e) => {
      e.preventDefault();
      const target = document.querySelector(href);
      if (target) {
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Country → City filter
  const countrySelect = document.getElementById('search-country');
  const citySelect = document.getElementById('search-city');

  countrySelect.addEventListener('change', () => {
    const selectedCountry = countrySelect.value;
    const filtered = selectedCountry
      ? dbCities.filter(c => c.country === selectedCountry)
      : dbCities;
    citySelect.innerHTML =
      '<option value="">Select City</option>' +
      filtered.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
  });

  // Home Page Search
  const searchBtn = document.getElementById('search-btn');
  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      const countryQuery = countrySelect.value;
      const cityQuery = citySelect.value;
      const typeQuery = document.getElementById('search-type').value;
      const isMarketplaceSearch = typeQuery === '__sale';

      if (cityQuery || countryQuery || isMarketplaceSearch) {
        const params = new URLSearchParams();
        params.set('kind', isMarketplaceSearch ? 'sale' : 'rental');
        if (countryQuery) params.set('country', countryQuery);
        if (cityQuery) params.set('city', cityQuery);
        if (typeQuery && !isMarketplaceSearch) params.set('type', typeQuery);
        navigate('/search/rooms?' + params.toString());
      } else {
        citySelect.focus();
        citySelect.classList.add('error-shake');
        setTimeout(() => citySelect.classList.remove('error-shake'), 500);
      }
    });
  }

  // ── Stats Counting Animation ──────────────────────
  const animateValue = (el, start, end, duration, prefix = '', suffix = '') => {
    let startTimestamp = null;
    const step = (timestamp) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);

      // easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4);

      const current = (ease * (end - start) + start);

      el.textContent = Math.floor(current).toLocaleString();

      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };
    window.requestAnimationFrame(step);
  };

  const statObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const cards = entry.target.querySelectorAll('.stat-card');
        cards.forEach(card => {
          const numEl = card.querySelector('.stat-number');
          const target = parseFloat(card.dataset.target);
          const prefix = card.dataset.prefix || '';
          const suffix = card.dataset.suffix || '';
          const startVal = prefix === '1.' ? 0 : 0;

          animateValue(numEl, startVal, target, 1800, prefix, suffix);

          // Animate progress bar
          const bar = card.querySelector('.stat-progress-bar');
          if (bar) {
            bar.style.width = bar.style.getPropertyValue('--width');
          }
        });
        statObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.3 });

  const statsSection = document.getElementById('stats');
  if (statsSection) statObserver.observe(statsSection);

}
