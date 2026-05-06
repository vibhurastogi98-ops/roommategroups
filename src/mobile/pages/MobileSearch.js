/**
 * src/mobile/pages/MobileSearch.js
 *
 * Mobile search page — mirrors the website's search.js filter set:
 *   Country, City, Type chips, Price range, Sort, Duration,
 *   Furnished, Amenities, Verified-only (via a bottom-sheet).
 * No map on mobile; results scroll in a native feed.
 * Exports: async init(container, params)
 */

import { db } from '../../services/db.js';
import { getCurrentUser, getVerificationBadge } from '../../services/auth.js';
import { getAssetUrl, getAvatarUrl } from '../../services/assets.js';

// Helper to get mobile-main late to avoid circular dependency
async function getMobile() {
  return await import('../mobile-main.js');
}

// ── Shared helpers (mirrors search.js) ───────────────────────

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Removed getPhotoSrc in favor of getAssetUrl from services/assets.js

function relTime(iso) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  if (h < 1) return 'Just now';
  if (h < 24) return h + 'h ago';
  return Math.floor(h / 24) + 'd ago';
}

function cityName(listing, cities) {
  const found = cities.find(c => c.city_id === listing.city);
  if (found) return found.name;
  if (listing.city) return listing.city.replace('city_', '').replace(/_/g, ' ');
  return 'Unknown';
}

// ── Render a single search result card (mobile version) ──────

function renderCard(listing, cities) {
  const isRoommate = listing.category === 'roommate_wanted' || listing.category === 'room_wanted';

  let _imgs = listing.images || listing.photos || [];
  if (typeof _imgs === 'string') { try { _imgs = JSON.parse(_imgs); } catch (e) { _imgs = []; } }
  const rawPhoto = _imgs[0];
  const photo = getAssetUrl(rawPhoto);

  // Poster info
  let user = listing.user_details;
  if (!user && listing.user_id) user = db.users.findById(listing.user_id);
  const posterName = user ? (user.display_name || user.fullName || 'Unknown') : 'Unknown';
  const avatar = getAvatarUrl(user?.profile_photo, posterName);
  const verifiedIcon = user ? (getVerificationBadge ? getVerificationBadge(user) : '') : '';

  const heroImg = isRoommate ? avatar : photo;

  // Badges
  let badgesHtml = '';
  if (listing.is_featured) {
    badgesHtml += `<span class="ms-badge ms-badge-featured"><i class="fa-solid fa-star"></i> Featured</span>`;
  }
  if (listing.room_type) {
    badgesHtml += `<span class="ms-badge">${escHtml(listing.room_type)}</span>`;
  }
  if (listing.furnished === 'yes') {
    badgesHtml += `<span class="ms-badge">Furnished</span>`;
  }

  // Saved state
  const currentUser = getCurrentUser();
  let isSaved = false;
  if (currentUser) {
    const dbUser = db.users.findById(currentUser.id || currentUser.user_id);
    if (dbUser) {
      const savedList = Array.isArray(dbUser.saved_listings)
        ? dbUser.saved_listings
        : (typeof dbUser.saved_listings === 'string'
          ? JSON.parse(dbUser.saved_listings || '[]')
          : []);
      isSaved = savedList.includes(listing.listing_id);
    }
  }

  const price = listing.rent ?? listing.price ?? '?';
  const loc = cityName(listing, cities);

  return `
    <div class="ms-card" data-id="${listing.listing_id}" role="button" tabindex="0"
         aria-label="View listing: ${escHtml(listing.title)}">
      <!-- Image -->
      <div class="ms-card-img-wrap">
        <img class="ms-card-img" src="${escHtml(heroImg)}"
             alt="${escHtml(listing.title)}" loading="lazy">
        <!-- Badges overlay -->
        ${badgesHtml ? `<div class="ms-card-badges">${badgesHtml}</div>` : ''}
        <!-- Save / Heart -->
        <button class="ms-card-heart ${isSaved ? 'active' : ''}"
                data-id="${listing.listing_id}"
                aria-label="${isSaved ? 'Remove from saved' : 'Save listing'}">
          <i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
        </button>
      </div>
      <!-- Body -->
      <div class="ms-card-body">
        <div class="ms-card-price">$${escHtml(String(price))}<span>/mo</span></div>
        <div class="ms-card-title">${escHtml(listing.title)}</div>
        <div class="ms-card-meta">
          <i class="fa-solid fa-location-dot"></i> ${escHtml(loc)}
        </div>
        <div class="ms-card-footer">
          <div class="ms-card-poster">
            <img src="${escHtml(avatar)}" alt="${escHtml(posterName)}" loading="lazy">
            <span>${escHtml(posterName)}${verifiedIcon ? ' ' + verifiedIcon : ''}</span>
          </div>
          <div class="ms-card-time">${relTime(listing.created_at)}</div>
        </div>
      </div>
    </div>
  `;
}

// ── Chip helper ───────────────────────────────────────────────

function chip(val, label, activeVal) {
  const isActive = val === activeVal;
  return `<button class="ms-chip${isActive ? ' active' : ''}" data-val="${val}">${escHtml(label)}</button>`;
}

// ── Type options (matches website) ────────────────────────────

const TYPE_OPTIONS = [
  { val: 'all',             label: 'All' },
  { val: 'room',            label: 'Room' },
  { val: 'apartment',       label: 'Apartment' },
  { val: 'sublet',          label: 'Sublet' },
  { val: 'roommate_wanted', label: 'Roommate Wanted' },
  { val: 'coliving',        label: 'Co-living' },
  { val: 'house',           label: 'House' },
  { val: 'student_housing', label: 'Student' },
  { val: 'room_wanted',     label: 'Room Wanted' },
];

// ── Main export ───────────────────────────────────────────────

export async function init(container, params = {}) {
  const { updateHeader } = await getMobile();
  updateHeader({ title: 'Search', showBack: false });

  const cities      = db.cities.findAll().filter(c => c.is_active !== false);
  const allCountries = db.countries ? db.countries.findAll().filter(c => c.is_active !== false) : [];

  // Filter state (mirrors website URL params)
  const state = {
    country:    'all',
    city:       'all',
    type:       'all',
    minPrice:   '',
    maxPrice:   '',
    sort:       'newest',
    dur:        'all',
    furn:       'all',
    verified:   false,
    amenities:  [],
    keyword:    '',
  };

  // ── Render shell ─────────────────────────────────────────────
  container.classList.add('mobile-page-flex');
  container.innerHTML = `
    <!-- ① Fixed top bar: keyword + filter pill -->
    <div class="ms-topbar">
      <div class="ms-search-row">
        <div class="ms-search-wrap">
          <i class="fa-solid fa-magnifying-glass ms-search-icon"></i>
          <input id="ms-keyword" class="ms-search-input"
                 type="search" placeholder="Search listings…"
                 autocomplete="off" autocorrect="off">
          <button id="ms-clear" class="ms-search-clear" aria-label="Clear" style="display:none;">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
        <button id="ms-filter-btn" class="ms-filter-pill">
          <i class="fa-solid fa-sliders"></i>
          <span>Filters</span>
          <span class="ms-filter-badge" id="ms-filter-badge" style="display:none;"></span>
        </button>
      </div>

      <!-- ② Country + City row -->
      <div class="ms-location-row">
        <div class="ms-select-wrap">
          <i class="fa-solid fa-globe ms-select-icon"></i>
          <select id="ms-country" class="ms-select">
            <option value="all">All Countries</option>
            ${allCountries.map(c =>
              `<option value="${c.country_id}">${escHtml(c.flag_emoji || '')} ${escHtml(c.name)}</option>`
            ).join('')}
          </select>
        </div>
        <div class="ms-select-wrap">
          <i class="fa-solid fa-location-dot ms-select-icon"></i>
          <select id="ms-city" class="ms-select">
            <option value="all">Anywhere</option>
            ${cities.map(c =>
              `<option value="${c.slug}">${escHtml(c.name)}</option>`
            ).join('')}
          </select>
        </div>
      </div>

      <!-- ③ Type chips (horizontal scroll) -->
      <div class="mobile-scroll-x ms-type-strip" id="ms-type-chips" style="padding-left:16px; padding-right:16px;">
        ${TYPE_OPTIONS.map(t => chip(t.val, t.label, state.type)).join('')}
      </div>
    </div>

    <!-- ④ Results area -->
    <div class="mobile-page-content ms-results-area" id="ms-scroll">
      <!-- Results header -->
      <div class="ms-results-header">
        <div>
          <div class="ms-results-title" id="ms-title">All Locations</div>
          <div class="ms-results-count" id="ms-count">Loading…</div>
        </div>
        <select id="ms-sort" class="ms-sort-select">
          <option value="newest">Newest</option>
          <option value="price_asc">Price ↑</option>
          <option value="price_desc">Price ↓</option>
        </select>
      </div>
      <!-- Cards -->
      <div id="ms-grid" class="ms-grid">
        <div class="mobile-loader"><div class="mobile-spinner"></div></div>
      </div>
    </div>

    <!-- ⑤ More Filters Bottom Sheet -->
    <div class="mobile-sheet-backdrop" id="ms-backdrop"></div>
    <div class="mobile-sheet" id="ms-sheet">
      <div class="mobile-sheet-handle"></div>
      <div class="mobile-sheet-title">More Filters</div>
      <div class="mobile-sheet-content">

        <!-- Price -->
        <div class="ms-filter-section">
          <div class="ms-filter-label">Price Range ($/mo)</div>
          <div class="ms-price-row">
            <input id="ms-min" class="ms-price-input mobile-input"
                   type="number" placeholder="Min $" step="50">
            <span class="ms-price-dash">–</span>
            <input id="ms-max" class="ms-price-input mobile-input"
                   type="number" placeholder="Max $" step="50">
          </div>
        </div>

        <!-- Duration -->
        <div class="ms-filter-section">
          <div class="ms-filter-label">Duration</div>
          <div class="ms-radio-group" id="ms-dur-group">
            ${[
              { val: 'all',      label: 'Any Duration' },
              { val: 'short',    label: 'Short (<3 mo)' },
              { val: 'medium',   label: 'Medium (3–6 mo)' },
              { val: 'long',     label: 'Long (6 mo+)' },
              { val: 'flexible', label: 'Flexible' },
            ].map(o => `
              <label class="ms-radio-label">
                <input type="radio" name="ms-dur" value="${o.val}" ${o.val === 'all' ? 'checked' : ''}>
                <span>${escHtml(o.label)}</span>
              </label>`).join('')}
          </div>
        </div>

        <!-- Furnished -->
        <div class="ms-filter-section">
          <div class="ms-filter-label">Furnished</div>
          <div class="ms-radio-group" id="ms-furn-group">
            ${[
              { val: 'all',     label: 'Any' },
              { val: 'yes',     label: 'Yes' },
              { val: 'no',      label: 'No' },
              { val: 'partial', label: 'Partial' },
            ].map(o => `
              <label class="ms-radio-label">
                <input type="radio" name="ms-furn" value="${o.val}" ${o.val === 'all' ? 'checked' : ''}>
                <span>${escHtml(o.label)}</span>
              </label>`).join('')}
          </div>
        </div>

        <!-- Amenities -->
        <div class="ms-filter-section">
          <div class="ms-filter-label">Amenities</div>
          <div class="ms-check-group">
            ${[
              { val: 'amen_wifi',    label: 'WiFi' },
              { val: 'amen_laundry', label: 'In-unit Laundry' },
              { val: 'amen_gym',     label: 'Gym' },
              { val: 'amen_ac',      label: 'AC' },
              { val: 'amen_parking', label: 'Parking' },
            ].map(a => `
              <label class="ms-check-label">
                <input type="checkbox" class="ms-amenity" value="${a.val}">
                <span>${escHtml(a.label)}</span>
              </label>`).join('')}
          </div>
        </div>

        <!-- Verified -->
        <div class="ms-filter-section">
          <div class="ms-filter-label">Trust & Safety</div>
          <label class="ms-toggle-label">
            <input type="checkbox" id="ms-verified">
            <span class="ms-toggle-track"><span class="ms-toggle-thumb"></span></span>
            <span>Verified Users Only</span>
          </label>
        </div>

        <!-- Apply / Reset -->
        <div class="ms-sheet-actions">
          <button id="ms-reset" class="mobile-btn mobile-btn-outline">
            <i class="fa-solid fa-rotate-left"></i> Reset
          </button>
          <button id="ms-apply" class="mobile-btn mobile-btn-accent" style="flex:1;">
            <i class="fa-solid fa-check"></i> Apply Filters
          </button>
        </div>
      </div>
    </div>
  `;

  // ── Refs ────────────────────────────────────────────────────
  const kwInput   = container.querySelector('#ms-keyword');
  const clearBtn  = container.querySelector('#ms-clear');
  const filterBtn = container.querySelector('#ms-filter-btn');
  const backdrop  = container.querySelector('#ms-backdrop');
  const sheet     = container.querySelector('#ms-sheet');
  const countryEl = container.querySelector('#ms-country');
  const cityEl    = container.querySelector('#ms-city');
  const sortEl    = container.querySelector('#ms-sort');
  const minEl     = container.querySelector('#ms-min');
  const maxEl     = container.querySelector('#ms-max');
  const verEl     = container.querySelector('#ms-verified');
  const grid      = container.querySelector('#ms-grid');
  const countEl   = container.querySelector('#ms-count');
  const titleEl   = container.querySelector('#ms-title');
  const badge     = container.querySelector('#ms-filter-badge');

  // ── Sheet open / close ───────────────────────────────────────
  function openSheet() {
    backdrop.classList.add('visible');
    sheet.classList.add('open');
  }
  function closeSheet() {
    backdrop.classList.remove('visible');
    sheet.classList.remove('open');
  }

  filterBtn.addEventListener('click', openSheet);
  backdrop.addEventListener('click', closeSheet);

  // ── Keyword ──────────────────────────────────────────────────
  kwInput.addEventListener('input', () => {
    state.keyword = kwInput.value.trim();
    clearBtn.style.display = state.keyword ? '' : 'none';
    applyFilters();
  });
  clearBtn.addEventListener('click', () => {
    kwInput.value = '';
    state.keyword = '';
    clearBtn.style.display = 'none';
    applyFilters();
    kwInput.focus();
  });

  // ── Country → city cascade ───────────────────────────────────
  countryEl.addEventListener('change', () => {
    state.country = countryEl.value;
    const filtered = state.country !== 'all'
      ? cities.filter(c => c.country === state.country)
      : cities;
    cityEl.innerHTML =
      '<option value="all">Anywhere</option>' +
      filtered.map(c => `<option value="${escHtml(c.slug)}">${escHtml(c.name)}</option>`).join('');
    state.city = 'all';
    applyFilters();
  });

  cityEl.addEventListener('change', () => {
    state.city = cityEl.value;
    applyFilters();
  });

  // ── Sort ─────────────────────────────────────────────────────
  sortEl.addEventListener('change', () => {
    state.sort = sortEl.value;
    applyFilters();
  });

  // ── Type chips ───────────────────────────────────────────────
  container.querySelector('#ms-type-chips').addEventListener('click', e => {
    const btn = e.target.closest('.ms-chip');
    if (!btn) return;
    container.querySelectorAll('#ms-type-chips .ms-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    state.type = btn.dataset.val;
    applyFilters();
  });

  // ── Sheet inputs (live — no debounce needed, apply on "Apply") ─
  // But also support instant apply on radio / checkbox change
  container.querySelectorAll('input[name="ms-dur"]').forEach(r =>
    r.addEventListener('change', () => { state.dur = r.value; _updateBadge(); })
  );
  container.querySelectorAll('input[name="ms-furn"]').forEach(r =>
    r.addEventListener('change', () => { state.furn = r.value; _updateBadge(); })
  );
  container.querySelectorAll('.ms-amenity').forEach(cb =>
    cb.addEventListener('change', () => {
      state.amenities = Array.from(container.querySelectorAll('.ms-amenity:checked')).map(c => c.value);
      _updateBadge();
    })
  );
  verEl.addEventListener('change', () => { state.verified = verEl.checked; _updateBadge(); });

  // Apply button in sheet
  container.querySelector('#ms-apply').addEventListener('click', () => {
    state.minPrice = minEl.value;
    state.maxPrice = maxEl.value;
    closeSheet();
    applyFilters();
    _updateBadge();
  });

  // Reset button in sheet
  container.querySelector('#ms-reset').addEventListener('click', () => {
    state.dur = 'all';
    state.furn = 'all';
    state.amenities = [];
    state.verified = false;
    state.minPrice = '';
    state.maxPrice = '';

    // Reset UI
    minEl.value = '';
    maxEl.value = '';
    verEl.checked = false;
    container.querySelectorAll('input[name="ms-dur"]').forEach(r => { r.checked = r.value === 'all'; });
    container.querySelectorAll('input[name="ms-furn"]').forEach(r => { r.checked = r.value === 'all'; });
    container.querySelectorAll('.ms-amenity').forEach(cb => { cb.checked = false; });

    _updateBadge();
    closeSheet();
    applyFilters();
  });

  // ── Save / Heart events (delegated) ─────────────────────────
  grid.addEventListener('click', async e => {
    const heart = e.target.closest('.ms-card-heart');
    if (heart) {
      e.preventDefault();
      e.stopPropagation();
      const lid = heart.dataset.id;
      const currentUser = getCurrentUser();
      if (!currentUser) { (await getMobile()).navigate('auth'); return; }

      const dbUser = db.users.findById(currentUser.id || currentUser.user_id);
      if (!dbUser) return;

      if (!Array.isArray(dbUser.saved_listings)) {
        dbUser.saved_listings = typeof dbUser.saved_listings === 'string'
          ? JSON.parse(dbUser.saved_listings || '[]')
          : [];
      }

      const idx = dbUser.saved_listings.indexOf(lid);
      const isSaved = idx > -1;
      if (isSaved) {
        dbUser.saved_listings.splice(idx, 1);
      } else {
        dbUser.saved_listings.push(lid);
      }

      // Optimistic UI
      const icon = heart.querySelector('i');
      if (icon) {
        icon.className = isSaved ? 'fa-regular fa-heart' : 'fa-solid fa-heart';
      }
      heart.classList.toggle('active', !isSaved);
      heart.style.transform = 'scale(1.3)';
      setTimeout(() => { heart.style.transform = ''; }, 220);

      try {
        await db.users.update(currentUser.id || currentUser.user_id, {
          saved_listings: dbUser.saved_listings,
        });
      } catch (err) {
        console.warn('[MOBILE] Save toggle failed:', err);
        // Rollback
        if (icon) icon.className = isSaved ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        heart.classList.toggle('active', isSaved);
      }
      return;
    }

    // Card tap → navigate to listing
    const card = e.target.closest('.ms-card');
    if (card) {
      (await getMobile()).navigate('listing', { id: card.dataset.id });
    }
  });

  // Keyboard a11y on cards
  grid.addEventListener('keydown', async e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.ms-card');
      if (card && !e.target.closest('.ms-card-heart')) {
        e.preventDefault();
        (await getMobile()).navigate('listing', { id: card.dataset.id });
      }
    }
  });

  // ── Filter badge counter ──────────────────────────────────────
  function _updateBadge() {
    let count = 0;
    if (state.dur !== 'all') count++;
    if (state.furn !== 'all') count++;
    if (state.verified) count++;
    count += state.amenities.length;
    if (state.minPrice || state.maxPrice) count++;

    if (count > 0) {
      badge.textContent = String(count);
      badge.style.display = '';
    } else {
      badge.style.display = 'none';
    }
  }

  // ── Core filter + render ──────────────────────────────────────
  function applyFilters() {
    let results = db.listings.find(l => l.status === 'active');

    // Keyword search
    if (state.keyword) {
      const q = state.keyword.toLowerCase();
      results = results.filter(l => {
        const fields = [l.title, l.city, l.area, l.description, l.category, l.room_type];
        return fields.some(s => s?.toLowerCase().includes(q));
      });
    }

    // Country filter
    if (state.city !== 'all') {
      const cityObj = db.cities.findOne(c => c.slug === state.city);
      if (cityObj) {
        results = results.filter(l => l.city === cityObj.city_id);
      } else {
        results = [];
      }
    } else if (state.country !== 'all') {
      const ids = cities.filter(c => c.country === state.country).map(c => c.city_id);
      results = results.filter(l => ids.includes(l.city));
    }

    // Type filter (mirrors website logic)
    if (state.type !== 'all') {
      results = results.filter(l => {
        if (state.type === 'room') {
          return l.category === 'room' || l.category === 'room_rental' || l.room_type === 'private';
        }
        return l.category === state.type || l.room_type === state.type;
      });
    }

    // Price
    if (state.minPrice) {
      results = results.filter(l => (l.rent ?? l.price ?? 0) >= parseInt(state.minPrice, 10));
    }
    if (state.maxPrice) {
      results = results.filter(l => (l.rent ?? l.price ?? 0) <= parseInt(state.maxPrice, 10));
    }

    // Duration
    if (state.dur !== 'all') {
      results = results.filter(l => l.duration === state.dur);
    }

    // Furnished
    if (state.furn !== 'all') {
      results = results.filter(l => l.furnished === state.furn);
    }

    // Amenities
    if (state.amenities.length > 0) {
      results = results.filter(l => {
        if (!l.amenities) return false;
        return state.amenities.every(a => l.amenities.includes(a));
      });
    }

    // Verified only
    if (state.verified) {
      results = results.filter(l => {
        const u = l.user_details || db.users.findById(l.user_id);
        return u && u.verification_level !== 'none';
      });
    }

    // Sort
    if (state.sort === 'price_asc') {
      results.sort((a, b) => (a.rent ?? a.price ?? 0) - (b.rent ?? b.price ?? 0));
    } else if (state.sort === 'price_desc') {
      results.sort((a, b) => (b.rent ?? b.price ?? 0) - (a.rent ?? a.price ?? 0));
    } else {
      // Newest, featured first
      results.sort((a, b) => {
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });
    }

    // Update title
    if (state.city !== 'all') {
      const cityObj = db.cities.findOne(c => c.slug === state.city);
      if (cityObj) {
        const countryObj = db.countries ? db.countries.findById(cityObj.country) : null;
        titleEl.textContent = countryObj ? `${cityObj.name}, ${countryObj.name}` : cityObj.name;
      } else {
        titleEl.textContent = 'Search Results';
      }
    } else if (state.country !== 'all') {
      const countryObj = db.countries ? db.countries.findById(state.country) : null;
      titleEl.textContent = countryObj
        ? `${countryObj.flag_emoji || ''} ${countryObj.name}`.trim()
        : 'Search Results';
    } else {
      titleEl.textContent = 'All Locations';
    }

    countEl.textContent = `${results.length} listing${results.length !== 1 ? 's' : ''}`;

    // Render
    if (results.length === 0) {
      grid.innerHTML = `
        <div class="mobile-empty">
          <div class="mobile-empty-icon" style="margin-bottom:16px; opacity:0.3;">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
          </div>
          <div class="mobile-empty-title">No listings found</div>
          <div class="mobile-empty-text">Try adjusting your filters or search keywords.</div>
        </div>`;
    } else {
      grid.innerHTML = results.map(l => renderCard(l, cities)).join('');
    }
  }

  // ── Initial render ────────────────────────────────────────────
  applyFilters();
}

export const renderMobileSearch = init;
