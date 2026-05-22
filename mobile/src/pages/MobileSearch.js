/**
 * src/mobile/pages/MobileSearch.js
 *
 * Mobile search page — mirrors the website's search.js filter set:
 *   Country, City, Type chips, Price range, Sort, Duration,
 *   Furnished, Amenities, Verified-only (via a bottom-sheet).
 * No map on mobile; results scroll in a native feed.
 * Exports: async init(container, params)
 */

import { db } from '../../../web/src/services/db.js';
import { getCurrentUser, getVerificationBadge } from '../../../web/src/services/auth.js';
import { getAssetUrl, getAvatarUrl } from '../../../web/src/services/assets.js';
import { setSEO } from '../../../web/src/seo.js';
import { trackSearch } from '../../../web/src/services/analytics.js';
import { renderMobileCard, attachMobileCardEvents } from '../components/MobileCard.js';

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

export default async function init(container, params = {}) {
  // SEO Update
  setSEO({
    title: 'Search Rooms & Find a Roommate | RoommateGroups',
    description: 'Search thousands of verified rooms, apartments, sublets, and co-living spaces on mobile.',
  });

  const { updateHeader, navigate } = await getMobile();
  updateHeader({ title: 'Search', showBack: true });

  const cities      = db.cities.findAll().filter(c => c.is_active !== false);
  const allCountries = db.countries ? db.countries.findAll().filter(c => c.is_active !== false) : [];

  // Filter state (mirrors website URL params)
  const state = {
    country:    params.country || 'all',
    city:       params.city    || 'all',
    type:       params.type    || 'all',
    minPrice:   params.minPrice || '',
    maxPrice:   params.maxPrice || '',
    sort:       params.sort     || 'newest',
    dur:        params.dur      || 'all',
    furn:       params.furn     || 'all',
    verified:   params.verified === 'true',
    amenities:  params.amenities ? params.amenities.split(',') : [],
    keyword:    params.keyword  || '',
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
                 value="${escHtml(state.keyword)}"
                 autocomplete="off" autocorrect="off">
          <button id="ms-clear" class="ms-search-clear" aria-label="Clear" style="${state.keyword ? '' : 'display:none;'}">
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
              `<option value="${c.country_id}" ${state.country === c.country_id ? 'selected' : ''}>${escHtml(c.flag_emoji || '')} ${escHtml(c.name)}</option>`
            ).join('')}
          </select>
        </div>
        <div class="ms-select-wrap">
          <i class="fa-solid fa-location-dot ms-select-icon"></i>
          <select id="ms-city" class="ms-select">
            <option value="all">Anywhere</option>
            ${cities.filter(c => state.country === 'all' || c.country === state.country).map(c =>
              `<option value="${c.slug}" ${state.city === c.slug ? 'selected' : ''}>${escHtml(c.name)}</option>`
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
    <div class="mobile-page-content ms-results-area mobile-feed" id="ms-scroll">
      <!-- Results header -->
      <div class="ms-results-header">
        <div>
          <div class="ms-results-title" id="ms-title">All Locations</div>
          <div class="ms-results-count" id="ms-count">Loading…</div>
        </div>
        <select id="ms-sort" class="ms-sort-select">
          <option value="newest" ${state.sort === 'newest' ? 'selected' : ''}>Newest</option>
          <option value="price_asc" ${state.sort === 'price_asc' ? 'selected' : ''}>Price ↑</option>
          <option value="price_desc" ${state.sort === 'price_desc' ? 'selected' : ''}>Price ↓</option>
        </select>
      </div>
      <!-- Cards -->
      <div id="ms-grid" class="ms-grid">
        <div class="mobile-loader">
          <div class="mobile-skeleton-stack">
            ${Array(3).fill(0).map(() => _skeletonCard()).join('')}
          </div>
        </div>
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
                   type="number" placeholder="Min $" step="50" value="${state.minPrice}">
            <span class="ms-price-dash">–</span>
            <input id="ms-max" class="ms-price-input mobile-input"
                   type="number" placeholder="Max $" step="50" value="${state.maxPrice}">
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
                <input type="radio" name="ms-dur" value="${o.val}" ${state.dur === o.val ? 'checked' : ''}>
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
                <input type="radio" name="ms-furn" value="${o.val}" ${state.furn === o.val ? 'checked' : ''}>
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
                <input type="checkbox" class="ms-amenity" value="${a.val}" ${state.amenities.includes(a.val) ? 'checked' : ''}>
                <span>${escHtml(a.label)}</span>
              </label>`).join('')}
          </div>
        </div>

        <!-- Verified -->
        <div class="ms-filter-section">
          <div class="ms-filter-label">Trust & Safety</div>
          <label class="ms-toggle-label">
            <input type="checkbox" id="ms-verified" ${state.verified ? 'checked' : ''}>
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
  const topbar    = container.querySelector('.ms-topbar');
  const scrollArea = container.querySelector('#ms-scroll');

  // ── Scroll to hide topbar ───────────────────────────────────
  let lastScrollY = 0;
  scrollArea.addEventListener('scroll', () => {
    const currentScrollY = scrollArea.scrollTop;
    
    // Always show at the very top
    if (currentScrollY <= 10) {
      topbar.classList.remove('hidden');
    } 
    // Scrolling down - hide
    else if (currentScrollY > lastScrollY && currentScrollY > 60) {
      topbar.classList.add('hidden');
    }
    // Scrolling up - show
    else if (currentScrollY < lastScrollY) {
      topbar.classList.remove('hidden');
    }
    
    lastScrollY = currentScrollY;
  }, { passive: true });

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
  // Use shared component event wiring
  attachMobileCardEvents(grid, (id) => {
    navigate('listing', { id });
  });

  // Keep existing keyboard a11y on grid (though attachMobileCardEvents also handles it)
  grid.addEventListener('keydown', async e => {
    if (e.key === 'Enter' || e.key === ' ') {
      const card = e.target.closest('.mobile-card');
      if (card && !e.target.closest('.mobile-card-heart')) {
        e.preventDefault();
        navigate('listing', { id: card.dataset.listingId });
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
    // Reset scroll and show topbar when filters change
    if (scrollArea) {
      scrollArea.scrollTop = 0;
    }
    if (topbar) {
      topbar.classList.remove('hidden');
    }

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
      const q = state.type.toLowerCase();
      results = results.filter(l => {
        const val = (l.room_type || l.category || l.property_type || l.type || '').toLowerCase();
        if (q === 'room') {
          return (val.includes('room') || val.includes('private')) && !val.includes('roommate');
        }
        if (q === 'roommate') {
          return val.includes('roommate') || val.includes('room_wanted');
        }
        return val.includes(q);
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

    // Track search
    const queryParts = [];
    if (state.city !== 'all') queryParts.push(state.city);
    else if (state.country !== 'all') queryParts.push(state.country);
    if (state.type !== 'all') queryParts.push(state.type);
    if (state.keyword) queryParts.push(state.keyword);
    trackSearch(queryParts.join(' ') || 'all rooms', results.length);

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
      grid.innerHTML = results.map(l => renderMobileCard(l)).join('');
      // Wire events again after render
      attachMobileCardEvents(grid, (id) => {
        navigate('listing', { id });
      });
    }
  }

  // ── Initial render ────────────────────────────────────────────
  applyFilters();
}

export const renderMobileSearch = init;

function _skeletonCard() {
  return `
    <div class="mobile-skeleton-card">
      <div class="mobile-skeleton-media"></div>
      <div class="mobile-skeleton-body">
        <div class="mobile-skeleton-line title"></div>
        <div class="mobile-skeleton-line medium"></div>
        <div class="mobile-skeleton-line short"></div>
        <div style="display:flex;align-items:center;justify-content:space-between;margin-top:18px;">
          <div class="mobile-skeleton-pill"></div>
          <div class="mobile-skeleton-line short" style="width:64px;margin:0;"></div>
        </div>
      </div>
    </div>
  `;
}
