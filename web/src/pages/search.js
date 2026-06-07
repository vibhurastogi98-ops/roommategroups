import { db } from '../services/db.js';
import { navigate } from '../router.js';
import { getCurrentUser } from '../services/auth.js';
import { renderNavbar, initNavbar } from '../components/navbar.js';
import { trackSearch } from '../services/analytics.js';
import { setSEO } from '../seo.js';
import { getAssetUrl } from '../services/assets.js';
import { api } from '../services/api.js';
import { renderMobileCard } from '../../../mobile/src/components/MobileCard.js';

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
    if (typeof value === 'string') { try { return JSON.parse(value || '[]'); } catch (e) { return []; } }
    return [];
}

function getPhotoSrc(photo, size) {
    if (!photo) return '';
    if (typeof photo === 'string') return getAssetUrl(photo);
    return getAssetUrl(photo[size] || photo.thumb || photo.medium || photo.full || '');
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

function cityName(cityId) {
    const city = db.cities.findById(cityId) || db.cities.findOne(c => c.slug === cityId);
    return city?.name || String(cityId || '').replace('city_', '').replace(/_/g, ' ');
}

function normalizeCityKey(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/^city_/, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

function normalizeFilterKey(value) {
    return String(value || '')
        .trim()
        .toLowerCase()
        .replace(/^(cat|category)_/, '')
        .replace(/[^a-z0-9]+/g, '_')
        .replace(/^_+|_+$/g, '');
}

function isPresent(value) {
    return value !== undefined && value !== null && value !== '';
}

function hasRoommateProfileFields(listing) {
    const roomType = normalizeFilterKey(listing?.room_type);
    const hasProfileFields = [
        listing?.budgetMax,
        listing?.budget_max,
        listing?.preferredArea,
        listing?.preferred_area,
        listing?.moveInTimeline,
        listing?.move_in_timeline,
    ].some(isPresent);

    return hasProfileFields && !['private_room', 'shared_room'].includes(roomType);
}

function isLiveListing(listing) {
    return listing?.status === 'active';
}

function isRentalListing(listing) {
    return String(listing?.kind || 'rental').toLowerCase() === 'rental';
}

function mergeListings(...groups) {
    const byId = new Map();
    groups.flat().forEach(listing => {
        const id = listing?.listing_id || listing?.id;
        if (!id || byId.has(id)) return;
        byId.set(id, listing);
    });
    return Array.from(byId.values());
}

function listingMatchesCity(listing, city) {
    const cityValues = new Set([
        city?.city_id,
        city?.id,
        city?.slug,
        city?.name,
    ].map(normalizeCityKey).filter(Boolean));
    return [
        listing.city,
        listing.city_id,
        listing.city_name,
        listing.location_city,
        listing.city_slug,
        listing.location,
    ].some(value => {
        const listingCity = normalizeCityKey(value);
        return cityValues.has(listingCity) ||
            Array.from(cityValues).some(cityValue => listingCity.startsWith(`${cityValue}-`));
    });
}

function isRentalLocalFilterActive(state) {
    return state.kind === 'rental' && (
        state.country !== 'all' ||
        state.city !== 'all' ||
        state.type !== 'all' ||
        state.dur !== 'all' ||
        state.furn !== 'all' ||
        state.amenities.length > 0
    );
}

function applyRentalClientFilters(rows, state, cities) {
    if (state.kind !== 'rental') return rows;
    let results = rows;

    if (state.city !== 'all') {
        const stateCityKey = normalizeCityKey(state.city);
        const cityObj = db.cities.findOne(c => [
            c.slug,
            c.city_id,
            c.id,
            c.name,
        ].map(normalizeCityKey).includes(stateCityKey));
        results = cityObj ? results.filter(l => listingMatchesCity(l, cityObj)) : [];
    } else if (state.country !== 'all') {
        const countryCities = cities.filter(c => c.country === state.country);
        results = results.filter(l => countryCities.some(city => listingMatchesCity(l, city)));
    }

    if (state.type !== 'all') {
        results = results.filter(l => normalizeFilterKey(l.category) === state.type);
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

function buildApiParams(state) {
    const params = {
        page: state.page,
        limit: state.limit,
        sort: state.sort,
    };
    if (['rental', 'sale'].includes(state.kind)) params.kind = state.kind;
    if (state.country !== 'all') params.country = state.country;
    if (state.city !== 'all') params.city = state.city;
    if (state.kind !== 'rental' && state.category !== 'all') params.category = state.category;
    if (state.q) params.q = state.q;
    if (state.min) params.min = state.min;
    if (state.max) params.max = state.max;
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

function syncUrl(state) {
    const params = new URLSearchParams();
    Object.entries(state).forEach(([key, value]) => {
        if (['limit'].includes(key)) return;
        if (Array.isArray(value)) {
            if (value.length) params.set(key, value.join(','));
        } else if (value !== '' && value !== false && value !== null && value !== undefined && value !== 'all' && !(key === 'page' && Number(value) === 1)) {
            params.set(key, String(value));
        }
    });
    const url = `/search/rooms${params.toString() ? `?${params}` : ''}`;
    if (window.location.pathname + window.location.search !== url) window.history.replaceState(null, '', url);
}

function getKindLabel(kind) {
    return {
        all: 'All Listings',
        rental: 'Room Listings',
        sale: 'Items for Sale',
    }[kind] || 'Search Results';
}

function renderEmptyState(state) {
    const marketplace = state.kind !== 'rental';
    const title = marketplace
        ? {
            sale: 'No items for sale yet',
        }[state.kind] || 'No marketplace listings yet'
        : 'No rooms match these filters';
    const body = marketplace
        ? 'Marketplace is active, but there are no listings in this view yet. Post the first one or switch sections.'
        : 'Try changing your filters or search a wider area.';

    return `
        <div class="s-empty" style="display:flex;flex-direction:column;align-items:center;gap:14px;padding:42px 24px;">
            <div style="width:52px;height:52px;border-radius:16px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;color:#0f172a;font-size:1.3rem;">
                <i class="fa-solid ${marketplace ? 'fa-store' : 'fa-magnifying-glass'}"></i>
            </div>
            <div style="font-size:1.15rem;font-weight:900;color:#0f172a;">${escHtml(title)}</div>
            <div style="max-width:460px;color:#64748b;line-height:1.55;">${escHtml(body)}</div>
            ${marketplace ? `
                <div style="display:flex;flex-wrap:wrap;gap:10px;justify-content:center;margin-top:4px;">
                    <a class="btn btn-primary" href="/post-listing"><i class="fa-solid fa-plus"></i> Post Listing</a>
                    <a class="btn btn-outline" href="/search/rooms?kind=sale">Items for sale</a>
                    <a class="btn btn-outline" href="/search/rooms?kind=rental">Rooms</a>
                </div>
            ` : ''}
        </div>
    `;
}

function wireAutocomplete(input, host, onSelect) {
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
            <button type="button" class="sf-suggest-option" role="option" data-title="${escHtml(title)}">
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
        const btn = e.target.closest('.sf-suggest-option');
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

function wireCardEvents(grid) {
    grid.querySelectorAll('.mobile-card').forEach(card => {
        card.addEventListener('click', async e => {
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

    grid.querySelectorAll('.mobile-card-heart').forEach(btn => {
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

export function renderSearchPage(app) {
    setSEO({
        title: 'Search Rooms & Marketplace Listings | RoommateGroups',
        description: 'Search verified rooms, items for sale, and roommates with category-aware filters.',
        canonical: 'https://roommategroups.com/search/rooms',
    });

    const params = new URLSearchParams(window.location.search);
    const requestedKind = params.get('kind') || 'rental';
    const state = {
        kind: ['rental', 'sale'].includes(requestedKind) ? requestedKind : 'rental',
        q: params.get('q') || '',
        country: params.get('country') || 'all',
        city: params.get('city') || 'all',
        type: params.get('type') || 'all',
        category: params.get('category') || 'all',
        min: params.get('min') || params.get('minPrice') || '',
        max: params.get('max') || params.get('maxPrice') || '',
        condition: params.get('condition') || 'all',
        negotiable: params.get('negotiable') === 'true',
        verified: params.get('verified') === 'true',
        radius: params.get('radius') || '',
        lat: params.get('lat') || '',
        lng: params.get('lng') || '',
        sort: params.get('sort') || (params.get('q') ? 'relevance' : 'newest'),
        dur: params.get('dur') || 'all',
        furn: params.get('furn') || 'all',
        amenities: params.get('amenities') ? params.get('amenities').split(',') : [],
        page: Math.max(parseInt(params.get('page') || '1', 10), 1),
        limit: 24,
    };

    const cities = db.cities.findAll().filter(c => c.is_active);
    const allCountries = db.countries.findAll().filter(c => c.is_active);
    let categoryTree = [];
    let requestSeq = 0;
    let currentResults = [];

    app.innerHTML = `
        ${renderNavbar()}
        <style>
            .sf-autocomplete {
                position: absolute;
                top: calc(100% + 6px);
                left: 0;
                right: 0;
                z-index: 50;
                display: none;
                overflow: hidden;
                border: 1px solid #e2e8f0;
                border-radius: 10px;
                background: #fff;
                box-shadow: 0 18px 34px rgba(15,23,42,.12);
            }
            .sf-autocomplete.open { display: block; }
            .sf-suggest-option {
                width: 100%;
                display: flex;
                align-items: center;
                gap: 10px;
                padding: 11px 13px;
                border: 0;
                border-bottom: 1px solid #f1f5f9;
                background: #fff;
                color: #0f172a;
                text-align: left;
                font: inherit;
                font-size: .88rem;
                font-weight: 750;
                cursor: pointer;
            }
            .sf-suggest-option:last-child { border-bottom: 0; }
            .sf-suggest-option:hover { background: #f8fafc; }
            .sf-suggest-option i { color: #94a3b8; font-size: .78rem; }
        </style>
        <div class="search-layout">
            <div class="search-sidebar">
                <div class="search-filters" id="search-filters-bar">
                    <div class="sf-row sf-row-selects">
                        <div class="s-filter-group">
                            <i class="fa-solid fa-magnifying-glass sf-icon"></i>
                            <input type="search" id="sf-q" class="sf-input" placeholder="Search..." value="${escHtml(state.q)}">
                            <div class="sf-autocomplete" id="sf-suggest" role="listbox"></div>
                        </div>
                        <div class="s-filter-group">
                            <i class="fa-solid fa-layer-group sf-icon"></i>
                            <select id="sf-kind" class="sf-input">
                                <option value="rental" ${state.kind === 'rental' ? 'selected' : ''}>List a room</option>
                                <option value="sale" ${state.kind === 'sale' ? 'selected' : ''}>Sell an item</option>
                            </select>
                        </div>
                        <div class="s-filter-group">
                            <i class="fa-solid fa-globe sf-icon"></i>
                            <select id="sf-country" class="sf-input">
                                <option value="all">All Countries</option>
                                ${allCountries.map(c => `<option value="${c.country_id}" ${state.country === c.country_id ? 'selected' : ''}>${c.flag_emoji} ${c.name}</option>`).join('')}
                            </select>
                        </div>
                        <div class="s-filter-group">
                            <i class="fa-solid fa-location-dot sf-icon"></i>
                            <select id="sf-city" class="sf-input">
                                <option value="all">Anywhere</option>
                                ${(state.country !== 'all' ? cities.filter(c => c.country === state.country) : cities).map(c => `<option value="${c.slug}" ${state.city === c.slug ? 'selected' : ''}>${c.name}</option>`).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="sf-row sf-row-selects">
                        <div class="s-filter-group sf-price-group">
                            <i class="fa-solid fa-dollar-sign sf-icon"></i>
                            <input type="number" id="sf-min-price" class="sf-input sf-price" placeholder="Min" value="${state.min}" step="50">
                            <span class="sf-dash">-</span>
                            <input type="number" id="sf-max-price" class="sf-input sf-price" placeholder="Max" value="${state.max}" step="50">
                        </div>
                        <div class="s-filter-group marketplace-only">
                            <i class="fa-solid fa-tags sf-icon"></i>
                            <select id="sf-category" class="sf-input">
                                <option value="all">All categories</option>
                            </select>
                        </div>
                        <div class="s-filter-group marketplace-only">
                            <i class="fa-solid fa-circle-info sf-icon"></i>
                            <select id="sf-condition" class="sf-input">
                                <option value="all">Any condition</option>
                                <option value="new" ${state.condition === 'new' ? 'selected' : ''}>New</option>
                                <option value="like_new" ${state.condition === 'like_new' ? 'selected' : ''}>Like new</option>
                                <option value="good" ${state.condition === 'good' ? 'selected' : ''}>Good</option>
                                <option value="fair" ${state.condition === 'fair' ? 'selected' : ''}>Fair</option>
                                <option value="used" ${state.condition === 'used' ? 'selected' : ''}>Used</option>
                            </select>
                        </div>
                        <button class="sf-more-btn-inline" id="sf-location-btn">
                            <i class="fa-solid fa-location-crosshairs"></i> Use Location
                        </button>
                        <button class="sf-more-btn-inline" id="sf-more-btn">
                            <i class="fa-solid fa-sliders"></i> Filters
                        </button>
                    </div>
                    <div class="sf-row sf-row-chips rental-only">
                        <div class="sf-chips" id="sf-type-chips">
                            ${[
                                ['all', 'All'], ['room', 'Room'], ['apartment', 'Apartment'], ['sublet', 'Sublet'],
                                ['roommate_wanted', 'Roommate Wanted'], ['coliving', 'Co-living'], ['house', 'House'],
                                ['student_housing', 'Student'], ['room_wanted', 'Room Wanted']
                            ].map(([value, label]) => `<button class="sf-chip ${state.type === value ? 'active' : ''}" data-type="${value}">${label}</button>`).join('')}
                        </div>
                    </div>
                </div>

                <div class="sf-more-panel" id="sf-more-panel" style="display:none;">
                    <div class="sf-more-grid">
                        <div class="sf-more-col rental-only">
                            <h4>Duration</h4>
                            ${[
                                ['all', 'Any Duration'], ['short', 'Short (<3mo)'], ['medium', 'Medium (3-6mo)'], ['long', 'Long (6mo+)'], ['flexible', 'Flexible']
                            ].map(([value, label]) => `<label><input type="radio" name="sf-dur" value="${value}" ${state.dur === value ? 'checked' : ''}> ${label}</label>`).join('')}
                        </div>
                        <div class="sf-more-col rental-only">
                            <h4>Furnished</h4>
                            ${[
                                ['all', 'Any'], ['yes', 'Yes'], ['no', 'No'], ['partial', 'Partial']
                            ].map(([value, label]) => `<label><input type="radio" name="sf-furn" value="${value}" ${state.furn === value ? 'checked' : ''}> ${label}</label>`).join('')}
                        </div>
                        <div class="sf-more-col rental-only">
                            <h4>Amenities</h4>
                            ${[
                                ['amen_wifi', 'WiFi'], ['amen_laundry', 'In-unit Laundry'], ['amen_gym', 'Gym'], ['amen_ac', 'AC'], ['amen_parking', 'Parking']
                            ].map(([value, label]) => `<label><input type="checkbox" class="sf-amenity" value="${value}" ${state.amenities.includes(value) ? 'checked' : ''}> ${label}</label>`).join('')}
                        </div>
                        <div class="sf-more-col">
                            <h4>Marketplace</h4>
                            <label class="toggle-switch-label"><input type="checkbox" id="sf-negotiable" ${state.negotiable ? 'checked' : ''}> Negotiable only</label>
                            <label class="toggle-switch-label"><input type="checkbox" id="sf-verified" ${state.verified ? 'checked' : ''}> Verified sellers only</label>
                            <label>Distance
                                <select id="sf-radius" class="sf-input" style="margin-top:8px;">
                                    <option value="" ${!state.radius ? 'selected' : ''}>Any distance</option>
                                    <option value="5" ${state.radius === '5' ? 'selected' : ''}>5 miles</option>
                                    <option value="10" ${state.radius === '10' ? 'selected' : ''}>10 miles</option>
                                    <option value="25" ${state.radius === '25' ? 'selected' : ''}>25 miles</option>
                                    <option value="50" ${state.radius === '50' ? 'selected' : ''}>50 miles</option>
                                </select>
                            </label>
                        </div>
                    </div>
                </div>

                <div class="search-results-list" id="search-list-container">
                    <div class="s-results-header">
                        <div class="s-results-header-inner">
                            <div>
                                <h1 id="s-city-title" style="font-size:1.25rem;font-weight:700;margin:0;color:var(--text-primary);">Search Listings</h1>
                                <span class="s-results-count" id="s-results-count">Loading results...</span>
                            </div>
                            <select id="sf-sort" class="sf-sort-dropdown">
                                <option value="newest" ${state.sort === 'newest' ? 'selected' : ''}>Newest</option>
                                <option value="price_asc" ${state.sort === 'price_asc' ? 'selected' : ''}>Price: Low to High</option>
                                <option value="price_desc" ${state.sort === 'price_desc' ? 'selected' : ''}>Price: High to Low</option>
                                <option value="distance" ${state.sort === 'distance' ? 'selected' : ''}>Distance</option>
                                <option value="relevance" ${state.sort === 'relevance' ? 'selected' : ''}>Relevance</option>
                            </select>
                        </div>
                    </div>
                    <div class="s-grid" id="search-grid">
                        <div class="search-loading">Loading listings...</div>
                    </div>
                    <div id="search-pagination" style="display:flex;align-items:center;justify-content:center;gap:12px;padding:20px;"></div>
                </div>
            </div>
            <div class="search-map-panel">
                <div id="search-map" class="search-map"></div>
            </div>
            <button class="btn btn-primary map-toggle-btn mobile-only shadow-lg" id="map-toggle-btn">
                <i class="fa-solid fa-map"></i> Map
            </button>
        </div>
    `;

    const grid = app.querySelector('#search-grid');
    const layout = app.querySelector('.search-layout');
    const toggleBtn = app.querySelector('#map-toggle-btn');
    let showingMap = false;
    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            showingMap = !showingMap;
            layout.classList.toggle('show-map', showingMap);
            toggleBtn.innerHTML = showingMap ? '<i class="fa-solid fa-list"></i> List' : '<i class="fa-solid fa-map"></i> Map';
        });
    }

    let map;
    let markersLayer;
    let markersMap = {};
    const searchInput = app.querySelector('#sf-q');
    const suggestBox = app.querySelector('#sf-suggest');

    function updateVisibility() {
        const rental = state.kind === 'rental';
        app.querySelectorAll('.rental-only').forEach(el => { el.style.display = rental ? '' : 'none'; });
        app.querySelectorAll('.marketplace-only').forEach(el => { el.style.display = rental ? 'none' : ''; });
    }

    function updateTitle(total, visibleCount) {
        const titleH2 = app.querySelector('#s-city-title');
        const countSpan = app.querySelector('#s-results-count');
        const kindLabel = getKindLabel(state.kind);

        if (state.city !== 'all') {
            const cityObj = db.cities.findOne(c => c.slug === state.city);
            titleH2.textContent = cityObj ? `${kindLabel} in ${cityObj.name}` : kindLabel;
        } else if (state.country !== 'all') {
            const countryObj = db.countries.findById(state.country);
            titleH2.textContent = countryObj ? `${kindLabel} in ${countryObj.name}` : kindLabel;
        } else {
            titleH2.textContent = kindLabel;
        }

        countSpan.textContent = isRentalLocalFilterActive(state)
            ? `Showing ${visibleCount} result${visibleCount === 1 ? '' : 's'}${total !== visibleCount ? ` (${total} server matches)` : ''}`
            : `Showing ${total} result${total === 1 ? '' : 's'}`;
    }

    function updatePagination(total, page, limit) {
        const host = app.querySelector('#search-pagination');
        const pages = Math.max(1, Math.ceil(total / limit));
        host.innerHTML = `
            <button class="btn btn-outline" id="s-page-prev" ${page <= 1 ? 'disabled' : ''}>Previous</button>
            <span style="font-weight:700;color:var(--text-secondary);">Page ${page} of ${pages}</span>
            <button class="btn btn-outline" id="s-page-next" ${page >= pages ? 'disabled' : ''}>Next</button>
        `;
        host.querySelector('#s-page-prev')?.addEventListener('click', () => { state.page = Math.max(1, state.page - 1); applyFilters(); });
        host.querySelector('#s-page-next')?.addEventListener('click', () => { state.page = Math.min(pages, state.page + 1); applyFilters(); });
    }

    function updateMap(listings) {
        if (!map || !window.L) return;
        if (markersLayer) markersLayer.clearLayers();
        else markersLayer = L.layerGroup().addTo(map);
        markersMap = {};
        const bounds = L.latLngBounds();
        listings.forEach(l => {
            if (!l.latitude || !l.longitude) return;
            const markerPrice = l.rent ?? l.price;
            const icon = L.divIcon({
                className: 'custom-map-marker',
                html: `<div class="map-price-marker">${markerPrice !== undefined && markerPrice !== null && markerPrice !== '' ? '$' + markerPrice : 'TBC'}</div>`,
                iconSize: [50, 24],
                iconAnchor: [25, 24],
            });
            const marker = L.marker([l.latitude, l.longitude], { icon }).addTo(markersLayer);
            bounds.extend([l.latitude, l.longitude]);
            markersMap[l.listing_id] = marker;
            const imgs = parseJsonArray(l.images || l.photos || []);
            const popImg = getPhotoSrc(imgs[0], 'thumb') || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300';
            marker.bindPopup(`
                <div class="map-popup-card">
                    <img src="${popImg}" alt="">
                    <div class="map-popup-body">
                        <strong>${markerPrice !== undefined && markerPrice !== null && markerPrice !== '' ? '$' + markerPrice : 'Price TBC'}</strong>
                        <div>${escHtml(String(l.title || '').substring(0, 30))}</div>
                    </div>
                </div>
            `, { minWidth: 200 });
        });
        if (Object.keys(markersMap).length > 0) map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }

    function centerMapOnSelection() {
        if (!map || !window.L) return;
        if (state.lat && state.lng) {
            map.setView([Number(state.lat), Number(state.lng)], 11);
            return;
        }
        if (state.city !== 'all') {
            const cityObj = db.cities.findOne(c => c.slug === state.city);
            if (cityObj?.latitude && cityObj?.longitude) {
                map.setView([cityObj.latitude, cityObj.longitude], 12);
                return;
            }
        }
        map.setView([20, 0], 2);
    }

    async function applyFilters() {
        const seq = ++requestSeq;
        syncUrl(state);
        updateVisibility();
        grid.innerHTML = '<div class="search-loading">Loading listings...</div>';

        try {
            const response = await api.searchListings(buildApiParams(state), true);
            if (seq !== requestSeq) return;
            const total = Number(response?.total || 0);
            const page = Number(response?.page || state.page || 1);
            const limit = Number(response?.limit || state.limit || 24);
            if (total === 0) console.debug('[Search] API returned 0 results for params:', buildApiParams(state));
            const serverResults = applyRentalClientFilters(Array.isArray(response?.results) ? response.results : [], state, cities);
            const localResults = state.kind === 'rental' && isRentalLocalFilterActive(state)
                ? applyRentalClientFilters(db.listings.findAll().filter(l => isRentalListing(l) && isLiveListing(l)), state, cities)
                : [];
            const results = mergeListings(serverResults, localResults);
            currentResults = results;

            grid.innerHTML = results.length
                ? results.map(renderMobileCard).join('')
                : renderEmptyState(state);
            wireCardEvents(grid);
            updateTitle(total, results.length);
            updatePagination(total, page, limit);
            centerMapOnSelection();
            updateMap(results);

            const queryParts = [state.kind, state.q, state.city !== 'all' ? state.city : '', state.category !== 'all' ? state.category : ''].filter(Boolean);
            trackSearch(queryParts.join(' ') || 'all listings', total);
        } catch (err) {
            if (seq !== requestSeq) return;
            console.error('[Search] Failed:', err);
            grid.innerHTML = '<div class="s-empty">Search is unavailable right now.</div>';
            app.querySelector('#s-results-count').textContent = 'Unable to load results';
        }
    }

    function refreshCategorySelect() {
        const select = app.querySelector('#sf-category');
        if (!select) return;
        const selected = state.category;
        const allowedKinds = new Set(['sale', 'product', 'vehicle']);
        const filterNode = cat => {
            const children = (cat.children || []).map(filterNode).filter(Boolean);
            if (allowedKinds.has(cat.kind) || children.length) return { ...cat, children };
            return null;
        };
        const filtered = categoryTree.map(filterNode).filter(Boolean);
        select.innerHTML = `<option value="all">All categories</option>${categoryOptions(filtered, selected)}`;
    }

    api.getCategoryTree(true).then(tree => {
        categoryTree = Array.isArray(tree) ? tree : [];
        refreshCategorySelect();
    }).catch(() => { categoryTree = []; refreshCategorySelect(); });

    app.querySelector('#sf-kind').addEventListener('change', e => {
        state.kind = e.target.value;
        state.page = 1;
        if (state.kind === 'rental') state.category = 'all';
        refreshCategorySelect();
        applyFilters();
    });
    wireAutocomplete(searchInput, suggestBox, value => {
        state.q = value;
        state.sort = 'relevance';
        app.querySelector('#sf-sort').value = 'relevance';
        state.page = 1;
        applyFilters();
    });

    searchInput.addEventListener('input', e => {
        state.q = e.target.value.trim();
        if (state.q) {
            state.sort = 'relevance';
            app.querySelector('#sf-sort').value = 'relevance';
        }
        state.page = 1;
        clearTimeout(app._searchTimer);
        app._searchTimer = setTimeout(applyFilters, 350);
    });
    app.querySelector('#sf-country').addEventListener('change', () => {
        state.country = app.querySelector('#sf-country').value;
        state.city = 'all';
        const filtered = state.country !== 'all' ? cities.filter(c => c.country === state.country) : cities;
        app.querySelector('#sf-city').innerHTML = '<option value="all">Anywhere</option>' + filtered.map(c => `<option value="${c.slug}">${c.name}</option>`).join('');
        state.page = 1;
        applyFilters();
    });
    app.querySelector('#sf-city').addEventListener('change', e => { state.city = e.target.value; state.page = 1; applyFilters(); });
    app.querySelector('#sf-sort').addEventListener('change', e => { state.sort = e.target.value; state.page = 1; applyFilters(); });
    app.querySelector('#sf-category').addEventListener('change', e => { state.category = e.target.value; state.page = 1; applyFilters(); });
    app.querySelector('#sf-condition').addEventListener('change', e => { state.condition = e.target.value; state.page = 1; applyFilters(); });
    app.querySelector('#sf-negotiable').addEventListener('change', e => { state.negotiable = e.target.checked; state.page = 1; applyFilters(); });
    app.querySelector('#sf-verified').addEventListener('change', e => { state.verified = e.target.checked; state.page = 1; applyFilters(); });
    app.querySelector('#sf-radius').addEventListener('change', e => { state.radius = e.target.value; state.page = 1; applyFilters(); });

    let priceTimeout;
    const handlePrice = () => {
        state.min = app.querySelector('#sf-min-price').value;
        state.max = app.querySelector('#sf-max-price').value;
        state.page = 1;
        clearTimeout(priceTimeout);
        priceTimeout = setTimeout(applyFilters, 400);
    };
    app.querySelector('#sf-min-price').addEventListener('input', handlePrice);
    app.querySelector('#sf-max-price').addEventListener('input', handlePrice);

    app.querySelector('#sf-type-chips').addEventListener('click', e => {
        const chip = e.target.closest('.sf-chip');
        if (!chip) return;
        app.querySelectorAll('.sf-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        state.type = chip.dataset.type;
        state.page = 1;
        applyFilters();
    });

    app.querySelector('#sf-location-btn').addEventListener('click', () => {
        if (!navigator.geolocation) return;
        navigator.geolocation.getCurrentPosition(pos => {
            state.lat = String(pos.coords.latitude);
            state.lng = String(pos.coords.longitude);
            if (!state.radius) {
                state.radius = '25';
                app.querySelector('#sf-radius').value = '25';
            }
            state.page = 1;
            applyFilters();
        });
    });

    const moreBtn = app.querySelector('#sf-more-btn');
    const morePanel = app.querySelector('#sf-more-panel');
    moreBtn.addEventListener('click', () => {
        const hidden = morePanel.style.display === 'none';
        morePanel.style.display = hidden ? 'block' : 'none';
        moreBtn.classList.toggle('active', hidden);
    });
    app.querySelectorAll('input[name="sf-dur"]').forEach(r => r.addEventListener('change', e => { state.dur = e.target.value; state.page = 1; applyFilters(); }));
    app.querySelectorAll('input[name="sf-furn"]').forEach(r => r.addEventListener('change', e => { state.furn = e.target.value; state.page = 1; applyFilters(); }));
    app.querySelectorAll('.sf-amenity').forEach(c => c.addEventListener('change', () => {
        state.amenities = Array.from(app.querySelectorAll('.sf-amenity:checked')).map(cb => cb.value);
        state.page = 1;
        applyFilters();
    }));

    setTimeout(() => {
        const mapContainer = document.getElementById('search-map');
        if (mapContainer && window.L) {
            map = L.map('search-map').setView([20, 0], 2);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);
            centerMapOnSelection();
            updateMap(currentResults);
        }
    }, 100);

    updateVisibility();
    refreshCategorySelect();
    applyFilters();
    initNavbar();
}

export function renderMarketplacePage() {
    navigate('/search/rooms?kind=sale&sort=newest');
}
