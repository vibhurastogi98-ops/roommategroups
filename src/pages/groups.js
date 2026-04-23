import { db } from '../services/db.js';
import { renderNavbar, initNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';

function formatMembers(n) {
    if (!n) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
    return String(n);
}

function citySlug(city) {
    return city.city_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function renderGroupCard(city) {
    const fallback = 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=600&h=400&fit=crop';
    const slug = citySlug(city);
    return `
        <a href="/groups/${slug}" class="city-group-card" data-city-id="${city.fb_city_id}">
            <div class="city-group-card-img-wrap">
                <img
                    src="${city.city_image || fallback}"
                    alt="${city.city_name}"
                    loading="lazy"
                    onerror="this.onerror=null;this.src='${fallback}';"
                >
            </div>
            <div class="city-group-card-body">
                <div class="city-group-card-name">${city.fb_group_name}</div>
                <div class="city-group-card-location">
                    <i class="fas fa-location-dot"></i> ${city.city_name}
                </div>
                <div class="city-group-member-badge">
                    <i class="fas fa-users"></i>
                    ${formatMembers(city.total_members)}+ Members
                </div>
            </div>
        </a>
    `;
}

export function renderGroupsPage(app) {
    const allCities = db.fb_cities.findAll().sort((a, b) => (a.priority || 99) - (b.priority || 99));
    const totalMembers = allCities.reduce((sum, c) => sum + (c.total_members || 0), 0);

    app.innerHTML = `
        ${renderNavbar()}

        <style>
            .groups-page { background: #F4F6F9; min-height: 100vh; }

            /* Hero */
            .groups-hero {
                background: linear-gradient(135deg, #0f1621 0%, #1a2740 60%, #2a3a58 100%);
                padding: 80px 0 60px;
                text-align: center;
                position: relative;
                overflow: hidden;
            }
            .groups-hero::before {
                content: '';
                position: absolute;
                inset: 0;
                background: radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.18) 0%, transparent 70%);
                pointer-events: none;
            }
            .groups-hero-badge {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                background: rgba(255,255,255,0.1);
                border: 1px solid rgba(255,255,255,0.15);
                color: rgba(255,255,255,0.85);
                padding: 6px 16px;
                border-radius: 100px;
                font-size: 0.8rem;
                font-weight: 600;
                letter-spacing: 0.05em;
                margin-bottom: 24px;
            }
            .groups-hero-badge i { color: #1877f2; }
            .groups-hero h1 {
                font-size: clamp(2rem, 4vw, 3rem);
                font-weight: 800;
                color: #fff;
                margin-bottom: 16px;
                letter-spacing: -0.03em;
                line-height: 1.15;
            }
            .groups-hero p {
                color: rgba(255,255,255,0.65);
                font-size: 1.05rem;
                max-width: 540px;
                margin: 0 auto 36px;
                line-height: 1.7;
            }
            .groups-hero-stats {
                display: flex;
                justify-content: center;
                gap: 48px;
                flex-wrap: wrap;
            }
            .groups-hero-stat strong {
                display: block;
                font-size: 1.8rem;
                font-weight: 800;
                color: #fff;
                line-height: 1;
                margin-bottom: 4px;
            }
            .groups-hero-stat span {
                font-size: 0.8rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.08em;
                color: rgba(255,255,255,0.5);
            }

            /* Grid */
            .groups-grid-section {
                padding: 56px 0 80px;
            }
            .groups-grid-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 36px;
                flex-wrap: wrap;
                gap: 12px;
            }
            .groups-grid-header h2 {
                font-size: 1.5rem;
                font-weight: 800;
                color: #1a2740;
                letter-spacing: -0.02em;
            }
            .groups-count-pill {
                background: #e8eaf6;
                color: #3949ab;
                font-size: 0.8rem;
                font-weight: 700;
                padding: 5px 14px;
                border-radius: 100px;
            }
            .city-groups-grid {
                display: grid;
                grid-template-columns: repeat(4, 1fr);
                gap: 24px;
            }

            /* Card */
            .city-group-card {
                background: #fff;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 2px 12px rgba(0,0,0,0.06);
                border: 1px solid rgba(0,0,0,0.06);
                text-decoration: none;
                color: inherit;
                display: flex;
                flex-direction: column;
                cursor: pointer;
                transition: transform 0.3s cubic-bezier(0.34,1.56,0.64,1), box-shadow 0.3s ease;
            }
            .city-group-card:hover {
                transform: translateY(-6px) scale(1.02);
                box-shadow: 0 20px 48px rgba(0,0,0,0.13);
            }
            .city-group-card-img-wrap {
                height: 200px;
                overflow: hidden;
                position: relative;
                background: #e2e8f0;
            }
            .city-group-card-img-wrap img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
                transition: transform 0.55s cubic-bezier(0.4,0,0.2,1);
            }
            .city-group-card:hover .city-group-card-img-wrap img {
                transform: scale(1.08);
            }
            .city-group-card-body {
                padding: 18px 20px 20px;
                display: flex;
                flex-direction: column;
                gap: 6px;
                flex: 1;
            }
            .city-group-card-name {
                font-size: 0.95rem;
                font-weight: 700;
                color: #1a2740;
                line-height: 1.3;
            }
            .city-group-card-location {
                font-size: 0.8rem;
                color: #8a94a6;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            .city-group-card-location i { color: #94a3b8; font-size: 0.75rem; }
            .city-group-member-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: #F1F5F9;
                color: #475569;
                font-size: 0.78rem;
                font-weight: 700;
                padding: 4px 12px;
                border-radius: 100px;
                margin-top: 6px;
                width: fit-content;
            }
            .city-group-member-badge i { color: #7c3aed; font-size: 0.7rem; }

            @media (max-width: 1024px) { .city-groups-grid { grid-template-columns: repeat(3, 1fr); } }
            @media (max-width: 768px)  { .city-groups-grid { grid-template-columns: repeat(2, 1fr); } }
            @media (max-width: 480px)  { .city-groups-grid { grid-template-columns: 1fr; } }
        </style>

        <div class="groups-page">
            <!-- Hero -->
            <section class="groups-hero">
                <div class="container">
                    <div class="groups-hero-badge">
                        <i class="fab fa-facebook"></i>
                        Facebook Roommate Groups
                    </div>
                    <h1>Find Your City's<br>Roommate Community</h1>
                    <p>Browse active Facebook roommate groups across the world. Click a city to explore listings, join the community, and find your next home.</p>
                    <div class="groups-hero-stats">
                        <div class="groups-hero-stat">
                            <strong>${allCities.length}</strong>
                            <span>Active Groups</span>
                        </div>
                        <div class="groups-hero-stat">
                            <strong>${formatMembers(totalMembers)}+</strong>
                            <span>Total Members</span>
                        </div>
                        <div class="groups-hero-stat">
                            <strong>${db.fb_countries.findAll().length}</strong>
                            <span>Countries</span>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Grid -->
            <section class="groups-grid-section">
                <div class="container">
                    <div class="groups-grid-header">
                        <h2>All City Groups</h2>
                        <div class="groups-count-pill">${allCities.length} Groups</div>
                    </div>
                    <div class="city-groups-grid">
                        ${allCities.map(renderGroupCard).join('')}
                    </div>
                </div>
            </section>

            ${renderFooter()}
        </div>
    `;

    initNavbar();
}
