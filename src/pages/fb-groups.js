import { db } from '../services/db.js';
import { renderNavbar, initNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';

// ── Helpers ──────────────────────────────────────────

function formatMembers(n) {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return String(n);
}

function renderFBCityCard(city) {
    const fallback = 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=600&h=400&fit=crop';
    return `
        <div class="fb-city-card animate-on-scroll visible">
            <div class="fb-city-image-wrap">
                <img
                    src="${city.city_image || fallback}"
                    alt="${city.city_name}"
                    loading="lazy"
                    class="city-image"
                    onerror="this.onerror=null;this.src='${fallback}';"
                >
                <div class="city-card-overlay">
                    <div class="city-card-name">${city.city_name}</div>
                </div>
            </div>
            <div class="fb-city-card-body">
                <div class="fb-group-name">
                    <i class="fab fa-facebook" style="color:#1877f2;margin-right:6px;"></i>
                    ${city.fb_group_name}
                </div>
                <div class="fb-member-count">
                    <i class="fas fa-users" style="color:var(--primary);margin-right:5px;"></i>
                    <strong>${formatMembers(city.total_members)}</strong> members
                </div>
                <a
                    href="${city.fb_group_link}"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="btn btn-primary fb-join-btn"
                >
                    <i class="fab fa-facebook"></i>
                    Join Group
                </a>
            </div>
        </div>
    `;
}

// ── Results Renderer ──────────────────────────────────

function renderResults(allCountries, allCities, filterCountry, filterCity) {
    // Filter cities
    let filtered = allCities;
    if (filterCountry) filtered = filtered.filter(c => c.country_id === filterCountry);
    if (filterCity)    filtered = filtered.filter(c => c.fb_city_id === filterCity);

    if (filtered.length === 0) {
        return `
            <div class="fb-empty-state">
                <div class="fb-empty-icon"><i class="fab fa-facebook"></i></div>
                <h3>No groups found</h3>
                <p>Try selecting a different country or city.</p>
                <button class="btn btn-outline" id="btn-clear-filters">Clear Filters</button>
            </div>
        `;
    }

    // If a specific city is selected → single featured card
    if (filterCity) {
        return `<div class="fb-single-result">${renderFBCityCard(filtered[0])}</div>`;
    }

    // Group by country for display
    const countriesToShow = filterCountry
        ? allCountries.filter(c => c.fb_country_id === filterCountry)
        : allCountries;

    return countriesToShow.map(country => {
        const citiesInCountry = filtered.filter(c => c.country_id === country.fb_country_id);
        if (citiesInCountry.length === 0) return '';
        return `
            <div class="fb-country-section">
                <h2 class="fb-country-heading">
                    <i class="fas fa-globe" style="color:var(--primary);margin-right:10px;"></i>
                    ${country.country_name}
                    <span class="fb-country-count">${citiesInCountry.length} ${citiesInCountry.length === 1 ? 'group' : 'groups'}</span>
                </h2>
                <div class="cities-grid">
                    ${citiesInCountry.map(renderFBCityCard).join('')}
                </div>
            </div>
        `;
    }).join('');
}

// ── Page Render ────────────────────────────────────────

export function renderFBGroupsPage(app) {
    const allCountries = db.fb_countries.findAll();
    const allCities    = db.fb_cities.findAll();

    const totalGroups = allCities.length;
    const totalMembers = allCities.reduce((sum, c) => sum + (c.total_members || 0), 0);

    app.innerHTML = `
        ${renderNavbar()}

        <!-- ── HERO ── -->
        <section class="fbg-hero">
            <div class="fbg-hero-bg"></div>
            <div class="container fbg-hero-content">
                <div class="fbg-hero-badge">
                    <i class="fab fa-facebook"></i>
                    Facebook Community Groups
                </div>
                <h1 class="fbg-hero-title">Find Your City's<br>Facebook Roommate Group</h1>
                <p class="fbg-hero-sub">
                    Join thousands of locals finding roommates &amp; rooms through our curated
                    Facebook groups — organized by country and city.
                </p>
                <div class="fbg-hero-stats">
                    <div class="fbg-stat"><strong>${totalGroups}</strong><span>Groups</span></div>
                    <div class="fbg-stat-divider"></div>
                    <div class="fbg-stat"><strong>${formatMembers(totalMembers)}</strong><span>Total Members</span></div>
                    <div class="fbg-stat-divider"></div>
                    <div class="fbg-stat"><strong>${allCountries.length}</strong><span>Countries</span></div>
                </div>
            </div>
        </section>

        <!-- ── FILTER BAR ── -->
        <div class="fbg-filter-wrap">
            <div class="container">
                <div class="fbg-filter-bar">
                    <div class="fbg-filter-label">
                        <i class="fa-solid fa-filter"></i>
                        Filter Groups
                    </div>
                    <div class="fbg-filter-fields">
                        <div class="fbg-filter-field">
                            <label for="fbg-country-select">
                                <i class="fa-solid fa-globe"></i> Country
                            </label>
                            <select id="fbg-country-select" class="fbg-select">
                                <option value="">All Countries</option>
                                ${allCountries.map(c => `
                                    <option value="${c.fb_country_id}">${c.country_name}</option>
                                `).join('')}
                            </select>
                        </div>
                        <div class="fbg-filter-arrow">
                            <i class="fa-solid fa-chevron-right"></i>
                        </div>
                        <div class="fbg-filter-field">
                            <label for="fbg-city-select">
                                <i class="fa-solid fa-city"></i> City
                            </label>
                            <select id="fbg-city-select" class="fbg-select" disabled>
                                <option value="">Select a country first</option>
                            </select>
                        </div>
                        <button class="fbg-clear-btn" id="fbg-clear-btn" title="Clear filters">
                            <i class="fa-solid fa-xmark"></i> Clear
                        </button>
                    </div>
                    <div class="fbg-results-count" id="fbg-results-count">
                        Showing <strong>${totalGroups}</strong> groups
                    </div>
                </div>
            </div>
        </div>

        <!-- ── RESULTS ── -->
        <section class="section" id="fb-groups">
            <div class="container">
                <div id="fbg-results">
                    ${renderResults(allCountries, allCities, '', '')}
                </div>
            </div>
        </section>

        ${renderFooter()}
    `;

    initNavbar();

    // ── Filter Logic ──
    const countrySelect = app.querySelector('#fbg-country-select');
    const citySelect    = app.querySelector('#fbg-city-select');
    const clearBtn      = app.querySelector('#fbg-clear-btn');
    const resultsDiv    = app.querySelector('#fbg-results');
    const countLabel    = app.querySelector('#fbg-results-count');

    function updateCityDropdown(countryId) {
        if (!countryId) {
            citySelect.innerHTML = '<option value="">Select a country first</option>';
            citySelect.disabled = true;
            return;
        }
        const cities = allCities.filter(c => c.country_id === countryId);
        citySelect.innerHTML = `
            <option value="">All cities in country</option>
            ${cities.map(c => `<option value="${c.fb_city_id}">${c.city_name}</option>`).join('')}
        `;
        citySelect.disabled = false;
    }

    function applyFilters() {
        const country = countrySelect.value;
        const city    = citySelect.value;
        resultsDiv.innerHTML = renderResults(allCountries, allCities, country, city);

        // Update count label
        let count = allCities;
        if (country) count = count.filter(c => c.country_id === country);
        if (city)    count = count.filter(c => c.fb_city_id === city);
        countLabel.innerHTML = `Showing <strong>${count.length}</strong> group${count.length !== 1 ? 's' : ''}`;

        // Wire up the clear button inside empty state if rendered
        const inlineClear = resultsDiv.querySelector('#btn-clear-filters');
        if (inlineClear) inlineClear.addEventListener('click', clearFilters);
    }

    function clearFilters() {
        countrySelect.value = '';
        citySelect.innerHTML = '<option value="">Select a country first</option>';
        citySelect.disabled = true;
        applyFilters();
    }

    countrySelect.addEventListener('change', () => {
        updateCityDropdown(countrySelect.value);
        citySelect.value = '';
        applyFilters();
    });

    citySelect.addEventListener('change', applyFilters);
    clearBtn.addEventListener('click', clearFilters);
}
