/**
 * src/mobile/pages/MobileSearch.js
 *
 * Server-backed category-aware mobile search.
 */

import { db } from '../../../web/src/services/db.js';
import { api } from '../../../web/src/services/api.js';
import { setSEO } from '../../../web/src/seo.js';
import { trackSearch } from '../../../web/src/services/analytics.js';
import { renderMobileCard, attachMobileCardEvents } from '../components/MobileCard.js';

async function getMobile() {
  return await import('../mobile-main.js');
}

function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') { try { return JSON.parse(value || '[]'); } catch (_) { return []; } }
  return [];
}

function chip(val, label, activeVal) {
  return `<button class="ms-chip${val === activeVal ? ' active' : ''}" data-val="${escHtml(val)}">${escHtml(label)}</button>`;
}

function flattenCategories(categories = []) {
  return categories.flatMap(cat => [cat, ...flattenCategories(cat.children || [])]);
}

function categoryOptions(categories = [], selected = '', depth = 0) {
  return categories.map(cat => `
    <option value="${escHtml(cat.category_id)}" ${selected === cat.category_id ? 'selected' : ''}>
      ${'-- '.repeat(depth)}${escHtml(cat.name)}
    </option>
    ${categoryOptions(cat.children || [], selected, depth + 1)}
  `).join('');
}

function filteredCategoryTree(tree, kind) {
  if (kind === 'rental') return [];
  const allowedKinds = new Set(['sale', 'product', 'vehicle']);
  const filterNode = cat => {
    const children = (cat.children || []).map(filterNode).filter(Boolean);
    if (allowedKinds.has(cat.kind) || children.length) return { ...cat, children };
    return null;
  };
  return tree.map(filterNode).filter(Boolean);
}

const KIND_OPTIONS = [
  { val: 'rental', label: 'List a room' },
  { val: 'sale', label: 'Sell an item' },
];

const TYPE_OPTIONS = [
  { val: 'all', label: 'All' },
  { val: 'room', label: 'Room' },
  { val: 'apartment', label: 'Apartment' },
  { val: 'sublet', label: 'Sublet' },
  { val: 'roommate_wanted', label: 'Roommate Wanted' },
  { val: 'coliving', label: 'Co-living' },
  { val: 'house', label: 'House' },
  { val: 'student_housing', label: 'Student' },
  { val: 'room_wanted', label: 'Room Wanted' },
];

function buildApiParams(state) {
  const params = {
    page: state.page,
    limit: state.limit,
    sort: state.sort,
  };
  if (['rental', 'sale'].includes(state.kind)) params.kind = state.kind;
  if (state.country !== 'all') params.country = state.country;
  if (state.city !== 'all') params.city = state.city;
  if (state.keyword) params.q = state.keyword;
  if (state.minPrice) params.min = state.minPrice;
  if (state.maxPrice) params.max = state.maxPrice;
  if (state.kind !== 'rental' && state.category !== 'all') params.category = state.category;
  if (state.kind !== 'rental' && state.condition !== 'all') params.condition = state.condition;
  if (state.negotiable) params.negotiable = true;
  if (state.verified) params.verified = true;
  if (state.lat && state.lng) {
    params.lat = state.lat;
    params.lng = state.lng;
    if (state.radius) params.radius = state.radius;
  }
  return params;
}

function applyRentalClientFilters(rows, state, cities) {
  if (state.kind !== 'rental') return rows;
  let results = rows;

  if (state.city !== 'all') {
    const cityObj = db.cities.findOne(c => c.slug === state.city);
    results = cityObj ? results.filter(l => l.city === cityObj.city_id) : [];
  } else if (state.country !== 'all') {
    const ids = cities.filter(c => c.country === state.country).map(c => c.city_id);
    results = results.filter(l => ids.includes(l.city));
  }

  if (state.type !== 'all') {
    const normCat = v => String(v || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');
    results = results.filter(l => normCat(l.category) === state.type);
  }

  if (state.dur !== 'all') results = results.filter(l => l.duration === state.dur || l.lease_term === state.dur);
  if (state.furn !== 'all') results = results.filter(l => String(l.furnished || '').toLowerCase() === state.furn);

  if (state.amenities.length > 0) {
    results = results.filter(l => {
      const listingAmenities = parseJsonArray(l.amenities);
      return state.amenities.every(a => listingAmenities.includes(a));
    });
  }

  return results;
}

function wireMobileAutocomplete(input, host, onSelect) {
  if (!input || !host) return;
  let timer = null;
  let requestId = 0;

  const close = () => {
    host.classList.remove('open');
    host.innerHTML = '';
  };

  const render = suggestions => {
    if (!suggestions.length) {
      close();
      return;
    }
    host.innerHTML = suggestions.map(title => `
      <button type="button" class="ms-suggest-option" role="option" data-title="${escHtml(title)}">
        <i class="fa-solid fa-magnifying-glass"></i>
        <span>${escHtml(title)}</span>
      </button>
    `).join('');
    host.classList.add('open');
  };

  input.addEventListener('input', () => {
    const q = input.value.trim();
    clearTimeout(timer);
    if (q.length < 2) {
      close();
      return;
    }
    const seq = ++requestId;
    timer = setTimeout(async () => {
      try {
        const payload = await api.suggestSearch(q, true);
        if (seq !== requestId) return;
        render(Array.isArray(payload?.suggestions) ? payload.suggestions : []);
      } catch {
        if (seq === requestId) close();
      }
    }, 180);
  });

  host.addEventListener('click', e => {
    const btn = e.target.closest('.ms-suggest-option');
    if (!btn) return;
    const title = btn.dataset.title || '';
    input.value = title;
    close();
    onSelect(title);
  });

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') close();
  });

  document.addEventListener('click', e => {
    if (!host.contains(e.target) && e.target !== input) close();
  });
}

export default async function init(container, params = {}) {
  setSEO({
    title: 'Search Rooms & Marketplace Listings | RoommateGroups',
    description: 'Search verified rooms, marketplace items for sale, and roommates on mobile.',
  });

  const { updateHeader, navigate } = await getMobile();
  updateHeader({ title: 'Search', showBack: true });

  const cities = db.cities.findAll().filter(c => c.is_active !== false);
  const allCountries = db.countries ? db.countries.findAll().filter(c => c.is_active !== false) : [];
  let categoryTree = [];
  let requestSeq = 0;

  const requestedKind = params.kind || 'rental';
  const state = {
    kind: ['rental', 'sale'].includes(requestedKind) ? requestedKind : 'rental',
    country: params.country || 'all',
    city: params.city || 'all',
    type: params.type || 'all',
    category: params.category || 'all',
    minPrice: params.min || params.minPrice || '',
    maxPrice: params.max || params.maxPrice || '',
    condition: params.condition || 'all',
    radius: params.radius || '',
    lat: params.lat || '',
    lng: params.lng || '',
    negotiable: params.negotiable === 'true',
    verified: params.verified === 'true',
    sort: params.sort || (params.q || params.keyword ? 'relevance' : 'newest'),
    dur: params.dur || 'all',
    furn: params.furn || 'all',
    amenities: params.amenities ? params.amenities.split(',') : [],
    keyword: params.q || params.keyword || '',
    page: Math.max(parseInt(params.page || '1', 10), 1),
    limit: 24,
  };

  container.classList.add('mobile-page-flex');
  container.innerHTML = `
    <style>
      .ms-suggest {
        position:absolute;
        top:calc(100% + 6px);
        left:0;
        right:0;
        z-index:80;
        display:none;
        overflow:hidden;
        border:1px solid #e2e8f0;
        border-radius:14px;
        background:#fff;
        box-shadow:0 16px 34px rgba(15,23,42,.14);
      }
      .ms-suggest.open { display:block; }
      .ms-suggest-option {
        width:100%;
        display:flex;
        align-items:center;
        gap:10px;
        padding:12px 13px;
        border:0;
        border-bottom:1px solid #f1f5f9;
        background:#fff;
        color:#0f172a;
        text-align:left;
        font:inherit;
        font-size:.82rem;
        font-weight:850;
      }
      .ms-suggest-option:last-child { border-bottom:0; }
      .ms-suggest-option i { color:#94a3b8; font-size:.74rem; }
    </style>
    <div class="ms-topbar">
      <div class="ms-search-row">
        <div class="ms-search-wrap">
          <i class="fa-solid fa-magnifying-glass ms-search-icon"></i>
          <input id="ms-keyword" class="ms-search-input" type="search" placeholder="Search listings..." value="${escHtml(state.keyword)}" autocomplete="off">
          <button id="ms-clear" class="ms-search-clear" aria-label="Clear" style="${state.keyword ? '' : 'display:none;'}"><i class="fa-solid fa-xmark"></i></button>
          <div class="ms-suggest" id="ms-suggest" role="listbox"></div>
        </div>
        <button id="ms-filter-btn" class="ms-filter-pill">
          <i class="fa-solid fa-sliders"></i>
          <span>Filters</span>
          <span class="ms-filter-badge" id="ms-filter-badge" style="display:none;"></span>
        </button>
      </div>

      <div class="ms-location-row">
        <div class="ms-select-wrap">
          <i class="fa-solid fa-globe ms-select-icon"></i>
          <select id="ms-country" class="ms-select">
            <option value="all">All Countries</option>
            ${allCountries.map(c => `<option value="${c.country_id}" ${state.country === c.country_id ? 'selected' : ''}>${escHtml(c.flag_emoji || '')} ${escHtml(c.name)}</option>`).join('')}
          </select>
        </div>
        <div class="ms-select-wrap">
          <i class="fa-solid fa-location-dot ms-select-icon"></i>
          <select id="ms-city" class="ms-select">
            <option value="all">Anywhere</option>
            ${cities.filter(c => state.country === 'all' || c.country === state.country).map(c => `<option value="${c.slug}" ${state.city === c.slug ? 'selected' : ''}>${escHtml(c.name)}</option>`).join('')}
          </select>
        </div>
      </div>

      <div class="mobile-scroll-x ms-type-strip" id="ms-kind-chips" style="padding-left:16px;padding-right:16px;">
        ${KIND_OPTIONS.map(t => chip(t.val, t.label, state.kind)).join('')}
      </div>
      <div class="mobile-scroll-x ms-type-strip rental-only" id="ms-type-chips" style="padding-left:16px;padding-right:16px;">
        ${TYPE_OPTIONS.map(t => chip(t.val, t.label, state.type)).join('')}
      </div>
    </div>

    <div class="mobile-page-content ms-results-area mobile-feed" id="ms-scroll">
      <div class="ms-results-header">
        <div>
          <div class="ms-results-title" id="ms-title">Search Listings</div>
          <div class="ms-results-count" id="ms-count">Loading...</div>
        </div>
        <select id="ms-sort" class="ms-sort-select">
          <option value="newest" ${state.sort === 'newest' ? 'selected' : ''}>Newest</option>
          <option value="price_asc" ${state.sort === 'price_asc' ? 'selected' : ''}>Price up</option>
          <option value="price_desc" ${state.sort === 'price_desc' ? 'selected' : ''}>Price down</option>
          <option value="distance" ${state.sort === 'distance' ? 'selected' : ''}>Distance</option>
          <option value="relevance" ${state.sort === 'relevance' ? 'selected' : ''}>Relevance</option>
        </select>
      </div>
      <div id="ms-grid" class="ms-grid">
        <div class="mobile-loader"><div class="mobile-skeleton-stack">${Array(3).fill(0).map(() => _skeletonCard()).join('')}</div></div>
      </div>
      <div id="ms-pagination" style="display:flex;align-items:center;justify-content:center;gap:10px;padding:8px 0 24px;"></div>
    </div>

    <div class="mobile-sheet-backdrop" id="ms-backdrop"></div>
    <div class="mobile-sheet" id="ms-sheet">
      <div class="mobile-sheet-handle"></div>
      <div class="mobile-sheet-title">Filters</div>
      <div class="mobile-sheet-content">
        <div class="ms-filter-section">
          <div class="ms-filter-label">Price Range</div>
          <div class="ms-price-row">
            <input id="ms-min" class="ms-price-input mobile-input" type="number" placeholder="Min" step="50" value="${state.minPrice}">
            <span class="ms-price-dash">-</span>
            <input id="ms-max" class="ms-price-input mobile-input" type="number" placeholder="Max" step="50" value="${state.maxPrice}">
          </div>
        </div>

        <div class="ms-filter-section marketplace-only">
          <div class="ms-filter-label">Category</div>
          <select id="ms-category" class="mobile-input">
            <option value="all">All categories</option>
          </select>
        </div>

        <div class="ms-filter-section marketplace-only">
          <div class="ms-filter-label">Condition</div>
          <select id="ms-condition" class="mobile-input">
            <option value="all">Any condition</option>
            <option value="new" ${state.condition === 'new' ? 'selected' : ''}>New</option>
            <option value="like_new" ${state.condition === 'like_new' ? 'selected' : ''}>Like new</option>
            <option value="good" ${state.condition === 'good' ? 'selected' : ''}>Good</option>
            <option value="fair" ${state.condition === 'fair' ? 'selected' : ''}>Fair</option>
            <option value="used" ${state.condition === 'used' ? 'selected' : ''}>Used</option>
          </select>
        </div>

        <div class="ms-filter-section">
          <div class="ms-filter-label">Distance</div>
          <div style="display:grid;grid-template-columns:1fr auto;gap:10px;">
            <select id="ms-radius" class="mobile-input">
              <option value="" ${!state.radius ? 'selected' : ''}>Any distance</option>
              <option value="5" ${state.radius === '5' ? 'selected' : ''}>5 miles</option>
              <option value="10" ${state.radius === '10' ? 'selected' : ''}>10 miles</option>
              <option value="25" ${state.radius === '25' ? 'selected' : ''}>25 miles</option>
              <option value="50" ${state.radius === '50' ? 'selected' : ''}>50 miles</option>
            </select>
            <button id="ms-location" class="mobile-btn mobile-btn-outline" style="padding:0 14px;"><i class="fa-solid fa-location-crosshairs"></i></button>
          </div>
        </div>

        <div class="ms-filter-section rental-only">
          <div class="ms-filter-label">Duration</div>
          <div class="ms-radio-group">
            ${[
              ['all', 'Any Duration'], ['short', 'Short (<3 mo)'], ['medium', 'Medium (3-6 mo)'], ['long', 'Long (6 mo+)'], ['flexible', 'Flexible']
            ].map(([val, label]) => `<label class="ms-radio-label"><input type="radio" name="ms-dur" value="${val}" ${state.dur === val ? 'checked' : ''}><span>${escHtml(label)}</span></label>`).join('')}
          </div>
        </div>

        <div class="ms-filter-section rental-only">
          <div class="ms-filter-label">Furnished</div>
          <div class="ms-radio-group">
            ${[
              ['all', 'Any'], ['yes', 'Yes'], ['no', 'No'], ['partial', 'Partial']
            ].map(([val, label]) => `<label class="ms-radio-label"><input type="radio" name="ms-furn" value="${val}" ${state.furn === val ? 'checked' : ''}><span>${escHtml(label)}</span></label>`).join('')}
          </div>
        </div>

        <div class="ms-filter-section rental-only">
          <div class="ms-filter-label">Amenities</div>
          <div class="ms-check-group">
            ${[
              ['amen_wifi', 'WiFi'], ['amen_laundry', 'In-unit Laundry'], ['amen_gym', 'Gym'], ['amen_ac', 'AC'], ['amen_parking', 'Parking']
            ].map(([val, label]) => `<label class="ms-check-label"><input type="checkbox" class="ms-amenity" value="${val}" ${state.amenities.includes(val) ? 'checked' : ''}><span>${escHtml(label)}</span></label>`).join('')}
          </div>
        </div>

        <div class="ms-filter-section">
          <div class="ms-filter-label">Trust & Offers</div>
          <label class="ms-toggle-label"><input type="checkbox" id="ms-negotiable" ${state.negotiable ? 'checked' : ''}><span class="ms-toggle-track"><span class="ms-toggle-thumb"></span></span><span>Negotiable only</span></label>
          <label class="ms-toggle-label"><input type="checkbox" id="ms-verified" ${state.verified ? 'checked' : ''}><span class="ms-toggle-track"><span class="ms-toggle-thumb"></span></span><span>Verified sellers only</span></label>
        </div>

        <div class="ms-sheet-actions">
          <button id="ms-reset" class="mobile-btn mobile-btn-outline"><i class="fa-solid fa-rotate-left"></i> Reset</button>
          <button id="ms-apply" class="mobile-btn mobile-btn-accent" style="flex:1;"><i class="fa-solid fa-check"></i> Apply</button>
        </div>
      </div>
    </div>
  `;

  const refs = {
    kw: container.querySelector('#ms-keyword'),
    clear: container.querySelector('#ms-clear'),
    filterBtn: container.querySelector('#ms-filter-btn'),
    backdrop: container.querySelector('#ms-backdrop'),
    sheet: container.querySelector('#ms-sheet'),
    country: container.querySelector('#ms-country'),
    city: container.querySelector('#ms-city'),
    sort: container.querySelector('#ms-sort'),
    min: container.querySelector('#ms-min'),
    max: container.querySelector('#ms-max'),
    category: container.querySelector('#ms-category'),
    condition: container.querySelector('#ms-condition'),
    radius: container.querySelector('#ms-radius'),
    negotiable: container.querySelector('#ms-negotiable'),
    verified: container.querySelector('#ms-verified'),
    grid: container.querySelector('#ms-grid'),
    count: container.querySelector('#ms-count'),
    title: container.querySelector('#ms-title'),
    badge: container.querySelector('#ms-filter-badge'),
    scroll: container.querySelector('#ms-scroll'),
    topbar: container.querySelector('.ms-topbar'),
    pagination: container.querySelector('#ms-pagination'),
    suggest: container.querySelector('#ms-suggest'),
  };

  let lastScrollY = 0;
  refs.scroll.addEventListener('scroll', () => {
    const y = refs.scroll.scrollTop;
    if (y <= 10 || y < lastScrollY) refs.topbar.classList.remove('hidden');
    else if (y > 60) refs.topbar.classList.add('hidden');
    lastScrollY = y;
  }, { passive: true });

  function openSheet() { refs.backdrop.classList.add('visible'); refs.sheet.classList.add('open'); }
  function closeSheet() { refs.backdrop.classList.remove('visible'); refs.sheet.classList.remove('open'); }
  refs.filterBtn.addEventListener('click', openSheet);
  refs.backdrop.addEventListener('click', closeSheet);

  function updateVisibility() {
    const rental = state.kind === 'rental';
    container.querySelectorAll('.rental-only').forEach(el => { el.style.display = rental ? '' : 'none'; });
    container.querySelectorAll('.marketplace-only').forEach(el => { el.style.display = rental ? 'none' : ''; });
  }

  function updateCategorySelect() {
    const options = categoryOptions(filteredCategoryTree(categoryTree, state.kind), state.category);
    refs.category.innerHTML = `<option value="all">All categories</option>${options}`;
  }

  function updateBadge() {
    let count = 0;
    if (state.minPrice || state.maxPrice) count++;
    if (state.kind !== 'rental' && state.category !== 'all') count++;
    if (state.kind !== 'rental' && state.condition !== 'all') count++;
    if (state.radius) count++;
    if (state.negotiable) count++;
    if (state.verified) count++;
    if (state.kind === 'rental') {
      if (state.dur !== 'all') count++;
      if (state.furn !== 'all') count++;
      count += state.amenities.length;
    }
    refs.badge.textContent = String(count);
    refs.badge.style.display = count ? '' : 'none';
  }

  function updateTitle(total, visibleCount) {
    const kindLabel = {
      rental: 'Rooms',
      sale: 'Items for sale',
    }[state.kind] || 'Listings';
    if (state.city !== 'all') {
      const cityObj = db.cities.findOne(c => c.slug === state.city);
      refs.title.textContent = cityObj ? `${kindLabel} in ${cityObj.name}` : kindLabel;
    } else {
      refs.title.textContent = kindLabel;
    }
    refs.count.textContent = state.kind === 'rental' && visibleCount !== total
      ? `${visibleCount} shown of ${total}`
      : `${total} listing${total === 1 ? '' : 's'}`;
  }

  function updatePagination(total, page, limit) {
    const pages = Math.max(1, Math.ceil(total / limit));
    refs.pagination.innerHTML = `
      <button id="ms-prev" class="mobile-btn mobile-btn-outline" style="flex:0 0 96px;" ${page <= 1 ? 'disabled' : ''}>Previous</button>
      <span style="font-size:0.8rem;font-weight:800;color:#64748b;">${page} / ${pages}</span>
      <button id="ms-next" class="mobile-btn mobile-btn-outline" style="flex:0 0 96px;" ${page >= pages ? 'disabled' : ''}>Next</button>
    `;
    refs.pagination.querySelector('#ms-prev')?.addEventListener('click', () => { state.page = Math.max(1, state.page - 1); applyFilters(); });
    refs.pagination.querySelector('#ms-next')?.addEventListener('click', () => { state.page = Math.min(pages, state.page + 1); applyFilters(); });
  }

  async function applyFilters() {
    refs.scroll.scrollTop = 0;
    refs.topbar.classList.remove('hidden');
    updateVisibility();
    updateBadge();
    const seq = ++requestSeq;
    refs.grid.innerHTML = `<div class="mobile-loader"><div class="mobile-skeleton-stack">${Array(3).fill(0).map(() => _skeletonCard()).join('')}</div></div>`;

    try {
      const response = await api.searchListings(buildApiParams(state), true);
      if (seq !== requestSeq) return;
      const total = Number(response?.total || 0);
      const page = Number(response?.page || state.page || 1);
      const limit = Number(response?.limit || state.limit || 24);
      let results = Array.isArray(response?.results) ? response.results : [];
      results = applyRentalClientFilters(results, state, cities);

      updateTitle(total, results.length);
      updatePagination(total, page, limit);

      if (results.length === 0) {
        refs.grid.innerHTML = `
          <div class="mobile-empty">
            <div class="mobile-empty-title">No listings found</div>
            <div class="mobile-empty-text">Try adjusting your filters or search keywords.</div>
          </div>`;
      } else {
        refs.grid.innerHTML = results.map(l => renderMobileCard(l)).join('');
        attachMobileCardEvents(refs.grid, id => navigate('listing', { id }));
      }

      const queryParts = [state.kind, state.keyword, state.city !== 'all' ? state.city : '', state.category !== 'all' ? state.category : ''].filter(Boolean);
      trackSearch(queryParts.join(' ') || 'all listings', total);
    } catch (err) {
      console.error('[MobileSearch] Search failed:', err);
      refs.count.textContent = 'Unable to load results';
      refs.grid.innerHTML = `
        <div class="mobile-empty">
          <div class="mobile-empty-title">Search unavailable</div>
          <div class="mobile-empty-text">Please try again in a moment.</div>
        </div>`;
    }
  }

  wireMobileAutocomplete(refs.kw, refs.suggest, value => {
    state.keyword = value;
    state.sort = 'relevance';
    refs.sort.value = 'relevance';
    refs.clear.style.display = '';
    state.page = 1;
    applyFilters();
  });

  refs.kw.addEventListener('input', () => {
    state.keyword = refs.kw.value.trim();
    refs.clear.style.display = state.keyword ? '' : 'none';
    if (state.keyword) {
      state.sort = 'relevance';
      refs.sort.value = 'relevance';
    }
    state.page = 1;
    clearTimeout(container._searchTimer);
    container._searchTimer = setTimeout(applyFilters, 350);
  });
  refs.clear.addEventListener('click', () => {
    refs.kw.value = '';
    state.keyword = '';
    refs.clear.style.display = 'none';
    state.page = 1;
    applyFilters();
  });
  refs.country.addEventListener('change', () => {
    state.country = refs.country.value;
    state.city = 'all';
    const filtered = state.country !== 'all' ? cities.filter(c => c.country === state.country) : cities;
    refs.city.innerHTML = '<option value="all">Anywhere</option>' + filtered.map(c => `<option value="${escHtml(c.slug)}">${escHtml(c.name)}</option>`).join('');
    state.page = 1;
    applyFilters();
  });
  refs.city.addEventListener('change', () => { state.city = refs.city.value; state.page = 1; applyFilters(); });
  refs.sort.addEventListener('change', () => { state.sort = refs.sort.value; state.page = 1; applyFilters(); });

  container.querySelector('#ms-kind-chips').addEventListener('click', e => {
    const btn = e.target.closest('.ms-chip');
    if (!btn) return;
    container.querySelectorAll('#ms-kind-chips .ms-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    state.kind = btn.dataset.val;
    state.category = 'all';
    state.page = 1;
    updateCategorySelect();
    applyFilters();
  });
  container.querySelector('#ms-type-chips').addEventListener('click', e => {
    const btn = e.target.closest('.ms-chip');
    if (!btn) return;
    container.querySelectorAll('#ms-type-chips .ms-chip').forEach(c => c.classList.remove('active'));
    btn.classList.add('active');
    state.type = btn.dataset.val;
    state.page = 1;
    applyFilters();
  });

  refs.category.addEventListener('change', () => { state.category = refs.category.value; state.page = 1; updateBadge(); });
  refs.condition.addEventListener('change', () => { state.condition = refs.condition.value; state.page = 1; updateBadge(); });
  refs.radius.addEventListener('change', () => { state.radius = refs.radius.value; state.page = 1; updateBadge(); });
  refs.negotiable.addEventListener('change', () => { state.negotiable = refs.negotiable.checked; state.page = 1; updateBadge(); });
  refs.verified.addEventListener('change', () => { state.verified = refs.verified.checked; state.page = 1; updateBadge(); });
  container.querySelectorAll('input[name="ms-dur"]').forEach(r => r.addEventListener('change', () => { state.dur = r.value; state.page = 1; updateBadge(); }));
  container.querySelectorAll('input[name="ms-furn"]').forEach(r => r.addEventListener('change', () => { state.furn = r.value; state.page = 1; updateBadge(); }));
  container.querySelectorAll('.ms-amenity').forEach(cb => cb.addEventListener('change', () => {
    state.amenities = Array.from(container.querySelectorAll('.ms-amenity:checked')).map(c => c.value);
    state.page = 1;
    updateBadge();
  }));
  container.querySelector('#ms-location').addEventListener('click', () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(pos => {
      state.lat = String(pos.coords.latitude);
      state.lng = String(pos.coords.longitude);
      if (!state.radius) {
        state.radius = '25';
        refs.radius.value = '25';
      }
      state.page = 1;
      updateBadge();
      applyFilters();
    });
  });
  container.querySelector('#ms-apply').addEventListener('click', () => {
    state.minPrice = refs.min.value;
    state.maxPrice = refs.max.value;
    closeSheet();
    applyFilters();
  });
  container.querySelector('#ms-reset').addEventListener('click', () => {
    Object.assign(state, {
      category: 'all',
      minPrice: '',
      maxPrice: '',
      condition: 'all',
      radius: '',
      lat: '',
      lng: '',
      negotiable: false,
      verified: false,
      dur: 'all',
      furn: 'all',
      amenities: [],
      page: 1,
    });
    refs.min.value = '';
    refs.max.value = '';
    refs.category.value = 'all';
    refs.condition.value = 'all';
    refs.radius.value = '';
    refs.negotiable.checked = false;
    refs.verified.checked = false;
    container.querySelectorAll('input[name="ms-dur"]').forEach(r => { r.checked = r.value === 'all'; });
    container.querySelectorAll('input[name="ms-furn"]').forEach(r => { r.checked = r.value === 'all'; });
    container.querySelectorAll('.ms-amenity').forEach(cb => { cb.checked = false; });
    closeSheet();
    applyFilters();
  });

  try {
    const tree = await api.getCategoryTree(true);
    categoryTree = Array.isArray(tree) ? tree : [];
  } catch (_) {
    categoryTree = [];
  }
  updateCategorySelect();
  updateVisibility();
  updateBadge();
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
