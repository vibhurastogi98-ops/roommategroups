import { db } from '../services/db.js';
import { navigate } from '../router.js';
import { getCurrentUser, getVerificationBadge } from '../services/auth.js';
import { renderNavbar, initNavbar } from '../components/navbar.js';
import { trackSearch } from '../services/analytics.js';

function escHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

// Accepts both legacy string photos and new { thumb, medium, full } objects.
function getPhotoSrc(photo, size) {
    if (!photo) return '';
    if (typeof photo === 'string') return photo;
    return photo[size] || photo.thumb || photo.medium || '';
}

function relTime(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const h = Math.floor(diff / 3600000);
    if (h < 1) return 'Just now';
    if (h < 24) return h + ' hours ago';
    return Math.floor(h / 24) + ' days ago';
}

function renderSearchCard(listing) {
    const isRoommate = listing.category === 'roommate_wanted' || listing.category === 'room_wanted';
    const rawPhoto = listing.photos && listing.photos[0];
    const photo = (rawPhoto ? getPhotoSrc(rawPhoto, 'thumb') : null) || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop';

    // Poster info
    let user = listing.user_details;
    if (!user && listing.user_id) user = db.users.findById(listing.user_id);
    const posterName = user ? user.display_name : 'Unknown';
    const avatar = (user && user.profile_photo) ? user.profile_photo : ('https://ui-avatars.com/api/?name=' + encodeURIComponent(posterName) + '&background=1a1a1a&color=fff');
    const verifiedIcon = user ? getVerificationBadge(user) : '';

    // Badges overlay
    let badges = '';
    if (listing.room_type) badges += '<span class="s-card-tag">' + listing.room_type + '</span>';
    if (listing.furnished === 'yes') badges += '<span class="s-card-tag">Furnished</span>';

    // Check if saved by current user
    const currentUser = getCurrentUser();
    let isSaved = false;
    if (currentUser) {
        const dbUser = db.users.findById(currentUser.id);
        if (dbUser && dbUser.saved_listings && dbUser.saved_listings.includes(listing.listing_id)) {
            isSaved = true;
        }
    }

    return `
        <div class="s-card" data-id="${listing.listing_id}" data-lat="${listing.latitude}" data-lng="${listing.longitude}">
            <a href="/listing/${listing.listing_id}" class="s-card-img-wrap" style="display:block;">
                <img src="${isRoommate ? avatar : photo}" alt="${escHtml(listing.title)}" class="s-card-img" loading="lazy">
                <button class="s-card-fav ${isSaved ? 'active' : ''}">
                    <i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-heart" ${isSaved ? 'style="color:#1a1a1a;"' : ''}></i>
                </button>
                <div class="s-card-tags">
                    ${badges}
                </div>
            </a>
            <div class="s-card-body">
                <div class="s-card-price">$${listing.price}<span>/mo</span></div>
                <a href="/listing/${listing.listing_id}" style="text-decoration:none; color:inherit;"><h3 class="s-card-title">${escHtml(listing.title)}</h3></a>
                <div class="s-card-meta">
                    <i class="fa-solid fa-location-dot"></i> ${escHtml(db.cities.findOne(c => c.city_id === listing.city)?.name || (listing.city ? listing.city.replace('city_', '').replace(/_/g, ' ') : 'Unknown City'))}
                </div>
                <div class="s-card-footer">
                    <div class="s-card-poster">
                        <img src="${avatar}" alt="">
                        <span>${escHtml(posterName)} ${verifiedIcon}</span>
                    </div>
                    <div class="s-card-time">${relTime(listing.created_at)}</div>
                </div>
            </div>
        </div>
    `;
}

export function renderSearchPage(app) {
    // 1. Build initial state from URL
    const qs = window.location.search.slice(1);
    const params = new URLSearchParams(qs);
    const state = {
        country: params.get('country') || 'all',
        city: params.get('city') || 'all',
        type: params.get('type') || 'all',
        minPrice: params.get('minPrice') || '',
        maxPrice: params.get('maxPrice') || '',
        sort: params.get('sort') || 'newest',
        dur: params.get('dur') || 'all',
        furn: params.get('furn') || 'all',
        verified: params.get('verified') === 'true',
        amenities: params.get('amenities') ? params.get('amenities').split(',') : []
    };

    const cities = db.cities.findAll().filter(c => c.is_active);
    const allCountries = db.countries.findAll().filter(c => c.is_active);

    // 2. Render Shell
    app.innerHTML = `
        ${renderNavbar()}
        <div class="search-layout">
            <div class="search-sidebar">
                <div class="search-filters" id="search-filters-bar">
                    <!-- Row 1: Selects + Price + More -->
                    <div class="sf-row sf-row-selects">
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
                        <div class="s-filter-group sf-price-group">
                            <i class="fa-solid fa-dollar-sign sf-icon"></i>
                            <input type="number" id="sf-min-price" class="sf-input sf-price" placeholder="Min $" value="${state.minPrice}" step="50">
                            <span class="sf-dash">–</span>
                            <input type="number" id="sf-max-price" class="sf-input sf-price" placeholder="Max $" value="${state.maxPrice}" step="50">
                        </div>
                        <button class="sf-more-btn-inline" id="sf-more-btn">
                            <i class="fa-solid fa-sliders"></i> Filters
                        </button>
                    </div>
                    <!-- Row 2: Type Chips -->
                    <div class="sf-row sf-row-chips">
                        <div class="sf-chips" id="sf-type-chips">
                            <button class="sf-chip ${state.type === 'all' ? 'active' : ''}" data-type="all">All</button>
                            <button class="sf-chip ${state.type === 'room' ? 'active' : ''}" data-type="room">Room</button>
                            <button class="sf-chip ${state.type === 'apartment' ? 'active' : ''}" data-type="apartment">Apartment</button>
                            <button class="sf-chip ${state.type === 'sublet' ? 'active' : ''}" data-type="sublet">Sublet</button>
                            <button class="sf-chip ${state.type === 'roommate_wanted' ? 'active' : ''}" data-type="roommate_wanted">Roommate Wanted</button>
                            <button class="sf-chip ${state.type === 'coliving' ? 'active' : ''}" data-type="coliving">Co-living</button>
                            <button class="sf-chip ${state.type === 'house' ? 'active' : ''}" data-type="house">House</button>
                            <button class="sf-chip ${state.type === 'student_housing' ? 'active' : ''}" data-type="student_housing">Student</button>
                            <button class="sf-chip ${state.type === 'room_wanted' ? 'active' : ''}" data-type="room_wanted">Room Wanted</button>
                        </div>
                    </div>
                </div>
                
                <!-- Expanded More Filters Panel -->
                <div class="sf-more-panel" id="sf-more-panel" style="display:none;">
                    <div class="sf-more-grid">
                        <div class="sf-more-col">
                            <h4>Duration</h4>
                            <label><input type="radio" name="sf-dur" value="all" ${state.dur === 'all' ? 'checked' : ''}> Any Duration</label>
                            <label><input type="radio" name="sf-dur" value="short" ${state.dur === 'short' ? 'checked' : ''}> Short (<3mo)</label>
                            <label><input type="radio" name="sf-dur" value="medium" ${state.dur === 'medium' ? 'checked' : ''}> Medium (3-6mo)</label>
                            <label><input type="radio" name="sf-dur" value="long" ${state.dur === 'long' ? 'checked' : ''}> Long (6mo+)</label>
                            <label><input type="radio" name="sf-dur" value="flexible" ${state.dur === 'flexible' ? 'checked' : ''}> Flexible</label>
                        </div>
                        <div class="sf-more-col">
                            <h4>Furnished</h4>
                            <label><input type="radio" name="sf-furn" value="all" ${state.furn === 'all' ? 'checked' : ''}> Any</label>
                            <label><input type="radio" name="sf-furn" value="yes" ${state.furn === 'yes' ? 'checked' : ''}> Yes</label>
                            <label><input type="radio" name="sf-furn" value="no" ${state.furn === 'no' ? 'checked' : ''}> No</label>
                            <label><input type="radio" name="sf-furn" value="partial" ${state.furn === 'partial' ? 'checked' : ''}> Partial</label>
                        </div>
                        <div class="sf-more-col">
                            <h4>Amenities</h4>
                            <label><input type="checkbox" class="sf-amenity" value="amen_wifi" ${state.amenities.includes('amen_wifi') ? 'checked' : ''}> WiFi</label>
                            <label><input type="checkbox" class="sf-amenity" value="amen_laundry" ${state.amenities.includes('amen_laundry') ? 'checked' : ''}> In-unit Laundry</label>
                            <label><input type="checkbox" class="sf-amenity" value="amen_gym" ${state.amenities.includes('amen_gym') ? 'checked' : ''}> Gym</label>
                            <label><input type="checkbox" class="sf-amenity" value="amen_ac" ${state.amenities.includes('amen_ac') ? 'checked' : ''}> AC</label>
                            <label><input type="checkbox" class="sf-amenity" value="amen_parking" ${state.amenities.includes('amen_parking') ? 'checked' : ''}> Parking</label>
                        </div>
                        <div class="sf-more-col">
                            <h4>Trust & Safety</h4>
                            <label class="toggle-switch-label">
                                <input type="checkbox" id="sf-verified" ${state.verified ? 'checked' : ''}>
                                Verified Users Only
                            </label>
                        </div>
                    </div>
                </div>

                <div class="search-results-list" id="search-list-container">
                    <div class="s-results-header">
                        <div class="s-results-header-inner">
                            <div>
                                <h2 id="s-city-title">Search Results</h2>
                                <span class="s-results-count" id="s-results-count">Loading results...</span>
                            </div>
                            <select id="sf-sort" class="sf-sort-dropdown">
                                <option value="newest" ${state.sort === 'newest' ? 'selected' : ''}>Newest</option>
                                <option value="price_asc" ${state.sort === 'price_asc' ? 'selected' : ''}>Price: Low → High</option>
                                <option value="price_desc" ${state.sort === 'price_desc' ? 'selected' : ''}>Price: High → Low</option>
                            </select>
                        </div>
                    </div>
                    <div class="s-grid" id="search-grid">
                        <div class="search-loading">Loading listings...</div>
                    </div>
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

    // Basic layout hookups
    let showingMap = false;
    const toggleBtn = app.querySelector('#map-toggle-btn');
    const layout = app.querySelector('.search-layout');
    const grid = app.querySelector('#search-grid');

    // Handle Save / Favorite Clicks
    grid.addEventListener('click', (e) => {
        const favBtn = e.target.closest('.s-card-fav');
        if (favBtn) {
            e.preventDefault();
            e.stopPropagation();
            
            const listingId = favBtn.closest('.s-card').dataset.id;
            const user = getCurrentUser();
            
            if (!user) {
                navigate('/auth/login');
                return;
            }
            
            const dbUser = db.users.findById(user.id);
            if (!dbUser) return;
            
            if (!dbUser.saved_listings) dbUser.saved_listings = [];
            
            const idx = dbUser.saved_listings.indexOf(listingId);
            if (idx > -1) {
                // Remove
                dbUser.saved_listings.splice(idx, 1);
                favBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
                favBtn.classList.remove('active');
            } else {
                // Add
                dbUser.saved_listings.push(listingId);
                favBtn.innerHTML = '<i class="fa-solid fa-heart" style="color:#1a1a1a;"></i>';
                favBtn.classList.add('active');
            }
            
            // Persist back to DB
            db.users.update(user.id, { saved_listings: dbUser.saved_listings });
        }
    });

    // Fetch listings (initially un-filtered except active)
    const listings = db.listings.find(l => l.status === 'active');

    if (listings.length === 0) {
        grid.innerHTML = '<div class="s-empty">No results found for these filters.</div>';
    } else {
        grid.innerHTML = listings.map(renderSearchCard).join('');
    }

    const isMobile = window.innerWidth <= 768;

    if (toggleBtn) {
        toggleBtn.addEventListener('click', () => {
            showingMap = !showingMap;
            layout.classList.toggle('show-map', showingMap);
            toggleBtn.innerHTML = showingMap
                ? '<i class="fa-solid fa-list"></i> List'
                : '<i class="fa-solid fa-map"></i> Map';
        });
    }

    // Initialize map logic
    let map;
    let markersLayer;
    let markersMap = {}; // listing_id -> leaflet marker

    function updateMap(listings) {
        if (!map || !window.L) return;

        // Clear old
        if (markersLayer) {
            markersLayer.clearLayers();
        } else {
            markersLayer = L.layerGroup().addTo(map);
        }
        markersMap = {};

        if (listings.length === 0) return;

        const bounds = L.latLngBounds();

        listings.forEach(l => {
            if (!l.latitude || !l.longitude) return;

            // Custom HTML price marker
            const icon = L.divIcon({
                className: 'custom-map-marker',
                html: `<div class="map-price-marker">$${l.price}</div>`,
                iconSize: [50, 24],
                iconAnchor: [25, 24]
            });

            const marker = L.marker([l.latitude, l.longitude], { icon }).addTo(markersLayer);
            bounds.extend([l.latitude, l.longitude]);
            markersMap[l.listing_id] = marker;

            // Popup
            marker.bindPopup(`
                <div class="map-popup-card">
                    <img src="${(l.photos && l.photos[0]) || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=300'}" alt="">
                    <div class="map-popup-body">
                        <strong>$${l.price}/mo</strong>
                        <div>${l.title.substring(0, 30)}...</div>
                    </div>
                </div>
            `, { minWidth: 200 });
        });

        // Fit bounds if we have marker points
        if (Object.keys(markersMap).length > 0) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        }
    }

    // Center map based on current filter selection
    function centerMapOnSelection(citySlug, countryId) {
        if (!map || !window.L) return;
        if (citySlug && citySlug !== 'all') {
            const cityObj = db.cities.findOne(c => c.slug === citySlug);
            if (cityObj && cityObj.latitude && cityObj.longitude) {
                map.setView([cityObj.latitude, cityObj.longitude], 12);
                return;
            }
        }
        if (countryId && countryId !== 'all') {
            const countryCities = cities.filter(c => c.country === countryId && c.latitude && c.longitude);
            if (countryCities.length > 0) {
                const avgLat = countryCities.reduce((s, c) => s + c.latitude, 0) / countryCities.length;
                const avgLng = countryCities.reduce((s, c) => s + c.longitude, 0) / countryCities.length;
                map.setView([avgLat, avgLng], 5);
                return;
            }
        }
        map.setView([20, 0], 2);
    }

    setTimeout(() => {
        const mapContainer = document.getElementById('search-map');
        if (mapContainer && window.L) {
            // Start at selected city if available, else world view
            const initialCity = state.city !== 'all' ? db.cities.findOne(c => c.slug === state.city) : null;
            const startLat = initialCity?.latitude || 20;
            const startLng = initialCity?.longitude || 0;
            const startZoom = initialCity ? 12 : 2;

            map = L.map('search-map').setView([startLat, startLng], startZoom);
            L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            applyFilters();
        }
    }, 100);

    // Filter Logic
    function applyFilters() {
        // Base inputs
        const country = app.querySelector('#sf-country').value;
        const city = app.querySelector('#sf-city').value;
        const type = app.querySelector('.sf-chip.active')?.dataset.type || 'all';
        const minPrice = app.querySelector('#sf-min-price').value;
        const maxPrice = app.querySelector('#sf-max-price').value;
        const sort = app.querySelector('#sf-sort').value;

        // Adv inputs
        const duration = app.querySelector('input[name="sf-dur"]:checked')?.value || 'all';
        const furnished = app.querySelector('input[name="sf-furn"]:checked')?.value || 'all';
        const isVerifiedOnly = app.querySelector('#sf-verified').checked;
        const amenities = Array.from(app.querySelectorAll('.sf-amenity:checked')).map(cb => cb.value);

        // Push to URL quietly
        const params = new URLSearchParams();
        if (country !== 'all') params.set('country', country);
        if (city !== 'all') params.set('city', city);
        if (type !== 'all') params.set('type', type);
        if (minPrice) params.set('minPrice', minPrice);
        if (maxPrice) params.set('maxPrice', maxPrice);
        if (sort !== 'newest') params.set('sort', sort);
        if (duration !== 'all') params.set('dur', duration);
        if (furnished !== 'all') params.set('furn', furnished);
        if (isVerifiedOnly) params.set('verified', 'true');
        if (amenities.length > 0) params.set('amenities', amenities.join(','));

        const newPath = '/search/rooms?' + params.toString();
        // Only push if changed to avoid history spam
        if (window.location.pathname + window.location.search !== newPath) {
            navigate(newPath);
        }

        // Filter db
        let results = db.listings.find(l => l.status === 'active');

        if (city !== 'all') {
            const cityObj = db.cities.findOne(c => c.slug === city);
            if (cityObj) {
                results = results.filter(l => l.city === cityObj.city_id);
            } else {
                results = []; // Invalid city slug
            }
        } else if (country !== 'all') {
            const countryCityIds = cities.filter(c => c.country === country).map(c => c.city_id);
            results = results.filter(l => countryCityIds.includes(l.city));
        }

        if (type !== 'all') {
            results = results.filter(l => {
                if (type === 'room') return l.category === 'room' || l.category === 'room_rental' || l.room_type === 'private';
                return l.category === type || l.room_type === type;
            });
        }

        if (minPrice) {
            results = results.filter(l => l.price >= parseInt(minPrice, 10));
        }

        if (maxPrice) {
            results = results.filter(l => l.price <= parseInt(maxPrice, 10));
        }

        if (duration !== 'all') {
            results = results.filter(l => l.duration === duration);
        }

        if (furnished !== 'all') {
            results = results.filter(l => l.furnished === furnished);
        }

        if (amenities.length > 0) {
            results = results.filter(l => {
                if (!l.amenities) return false;
                // Listing must have ALL selected amenities
                return amenities.every(a => l.amenities.includes(a));
            });
        }

        if (isVerifiedOnly) {
            results = results.filter(l => {
                let u = l.user_details || db.users.findById(l.user_id);
                return u && u.verification_level !== 'none';
            });
        }

        // Sort
        if (sort === 'price_asc') {
            results.sort((a, b) => a.price - b.price);
        } else if (sort === 'price_desc') {
            results.sort((a, b) => b.price - a.price);
        } else {
            // Newest
            results.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }

        // Render
        const grid = app.querySelector('#search-grid');
        if (results.length === 0) {
            grid.innerHTML = '<div class="s-empty">No results found for these filters.</div>';
        } else {
            grid.innerHTML = results.map(renderSearchCard).join('');
        }

        // Update Title Text
        const countSpan = app.querySelector('#s-results-count');
        const titleH2 = app.querySelector('#s-city-title');

        if (city !== 'all') {
            const cityObj = db.cities.findOne(c => c.slug === city);
            if (cityObj) {
                const countryObj = db.countries.findById(cityObj.country);
                titleH2.textContent = countryObj ? cityObj.name + ', ' + countryObj.name : cityObj.name;
            } else {
                titleH2.textContent = 'Search Results';
            }
        } else if (country !== 'all') {
            const countryObj = db.countries.findById(country);
            titleH2.textContent = countryObj ? countryObj.flag_emoji + ' ' + countryObj.name : 'Search Results';
        } else {
            titleH2.textContent = 'All Locations';
        }

        countSpan.textContent = `Showing ${results.length} results`;

        // Track search query for analytics
        const queryParts = [];
        if (city !== 'all') queryParts.push(city);
        else if (country !== 'all') queryParts.push(country);
        if (type !== 'all') queryParts.push(type);
        const searchQuery = queryParts.join(' ') || 'all rooms';
        trackSearch(searchQuery, results.length);

        // Always center map on selection first, then add markers on top
        centerMapOnSelection(city, country);
        updateMap(results);

        // Bind hover events to cards to bounce map markers
        app.querySelectorAll('.s-card').forEach(card => {
            card.addEventListener('mouseenter', () => {
                const id = card.dataset.id;
                const marker = markersMap[id];
                if (marker) {
                    const el = marker.getElement();
                    if (el) el.classList.add('marker-hover');
                    marker.setZIndexOffset(1000);
                }
            });
            card.addEventListener('mouseleave', () => {
                const id = card.dataset.id;
                const marker = markersMap[id];
                if (marker) {
                    const el = marker.getElement();
                    if (el) el.classList.remove('marker-hover');
                    marker.setZIndexOffset(0);
                }
            });
        });
    }

    // Attach Listeners
    app.querySelector('#sf-country').addEventListener('change', () => {
        const selectedCountry = app.querySelector('#sf-country').value;
        const filtered = selectedCountry !== 'all' ? cities.filter(c => c.country === selectedCountry) : cities;
        const citySelect = app.querySelector('#sf-city');
        const currentCity = citySelect.value;
        citySelect.innerHTML =
            '<option value="all">Anywhere</option>' +
            filtered.map(c => `<option value="${c.slug}" ${currentCity === c.slug ? 'selected' : ''}>${c.name}</option>`).join('');
        applyFilters();
    });
    app.querySelector('#sf-city').addEventListener('change', applyFilters);
    app.querySelector('#sf-sort').addEventListener('change', applyFilters);

    // De-bounce price inputs
    let priceTimeout;
    const handlePrice = () => {
        clearTimeout(priceTimeout);
        priceTimeout = setTimeout(applyFilters, 400);
    };
    app.querySelector('#sf-min-price').addEventListener('input', handlePrice);
    app.querySelector('#sf-max-price').addEventListener('input', handlePrice);

    // Chips
    const chips = app.querySelectorAll('.sf-chip');
    chips.forEach(chip => {
        chip.addEventListener('click', (e) => {
            chips.forEach(c => c.classList.remove('active'));
            e.target.classList.add('active');
            applyFilters();
        });
    });

    // Initial Render
    applyFilters();

    // More Filters Toggle
    const moreBtn = app.querySelector('#sf-more-btn');
    const morePanel = app.querySelector('#sf-more-panel');
    moreBtn.addEventListener('click', () => {
        const isHidden = morePanel.style.display === 'none';
        morePanel.style.display = isHidden ? 'block' : 'none';
        moreBtn.classList.toggle('active', isHidden);
    });

    initNavbar();

    // Attach listeners for more filters
    app.querySelectorAll('input[name="sf-dur"]').forEach(r => r.addEventListener('change', applyFilters));
    app.querySelectorAll('input[name="sf-furn"]').forEach(r => r.addEventListener('change', applyFilters));
    app.querySelectorAll('.sf-amenity').forEach(c => c.addEventListener('change', applyFilters));
    app.querySelector('#sf-verified').addEventListener('change', applyFilters);
}
