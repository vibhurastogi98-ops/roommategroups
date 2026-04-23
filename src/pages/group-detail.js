import { db } from '../services/db.js';
import { renderNavbar, initNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';

function formatMembers(n) {
    if (!n) return '0';
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M';
    if (n >= 1000) return (n / 1000).toFixed(1).replace('.0', '') + 'K';
    return String(n);
}

function citySlugFrom(name) {
    return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

const CITY_DESCRIPTIONS = {
    'austin': 'Austin is one of the fastest-growing cities in the US, with a booming tech scene and vibrant culture. The rental market is competitive — roommate-sharing is a great way to afford central neighborhoods like East Austin and South Congress.',
    'new-york-city': 'New York City has one of the most competitive rental markets in the world. Whether you\'re looking for a room in Brooklyn, Manhattan, or Queens, our community helps you find verified roommates and avoid scams.',
    'los-angeles': 'Los Angeles is a sprawling city with diverse neighborhoods. From Silver Lake to Santa Monica, roommate-sharing helps you access areas close to work, beaches, and entertainment hubs.',
    'london': 'London\'s rental market is among the most expensive in Europe. Our flatmate community connects you with verified house-sharers across all boroughs — from Zone 1 to the outer zones.',
    'berlin': 'Berlin has a thriving WG (Wohngemeinschaft) culture. Whether you\'re a student, artist, or professional, our community helps you find your ideal shared flat in Mitte, Prenzlauer Berg, or Kreuzberg.',
    'paris': 'Paris colocation is increasingly popular among students and young professionals. Our community connects you with co-tenants across all arrondissements.',
    'sydney': 'Sydney\'s share-house market is active year-round. Find flatmates in Inner West, Eastern Suburbs, or the Northern Beaches through our verified community.',
    'munich': 'Munich is Germany\'s most expensive city. Finding a WG through our group is your best bet for affordable housing in Schwabing, Maxvorstadt, or Haidhausen.',
    'toronto': 'Toronto\'s rental market has tightened significantly. Our roommate community helps you find verified co-tenants in Downtown, Midtown, and the inner suburbs.',
    'default': 'This is one of our most active roommate communities. Join thousands of members who have found their perfect living situation through our curated Facebook group.',
};

function getDescription(slug) {
    return CITY_DESCRIPTIONS[slug] || CITY_DESCRIPTIONS['default'];
}

function renderListingCard(listing) {
    const fallback = 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=600&h=400&fit=crop';
    const photo = listing.photos?.[0] || fallback;
    return `
        <a href="/listing/${listing.listing_id}" class="gd-listing-card">
            <div class="gd-listing-img">
                <img src="${photo}" alt="${listing.title}" loading="lazy" onerror="this.onerror=null;this.src='${fallback}';">
                <div class="gd-listing-badge">${listing.room_type || 'Private Room'}</div>
            </div>
            <div class="gd-listing-body">
                <div class="gd-listing-price">$${listing.price}<span>/mo</span></div>
                <div class="gd-listing-title">${listing.title}</div>
                <div class="gd-listing-view">View Listing →</div>
            </div>
        </a>
    `;
}

function renderRelatedCard(city, currentSlug) {
    const slug = citySlugFrom(city.city_name);
    if (slug === currentSlug) return '';
    const fallback = 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=600&h=400&fit=crop';
    return `
        <a href="/fb-groups/${slug}" class="gd-related-card">
            <div class="gd-related-img">
                <img src="${city.city_image || fallback}" alt="${city.city_name}" loading="lazy" onerror="this.onerror=null;this.src='${fallback}';">
            </div>
            <div class="gd-related-body">
                <div class="gd-related-name">${city.fb_group_name}</div>
                <div class="gd-related-meta"><i class="fas fa-users"></i> ${formatMembers(city.total_members)}+ Members</div>
            </div>
        </a>
    `;
}

export function renderGroupDetailPage(app, params) {
    const slug = params.slug || '';
    const allGroups = db.fb_cities.findAll().sort((a, b) => (a.priority || 99) - (b.priority || 99));

    // Find matching group by slug
    const group = allGroups.find(g => citySlugFrom(g.city_name) === slug);

    if (!group) {
        app.innerHTML = `
            ${renderNavbar()}
            <div style="text-align:center;padding:100px 20px;">
                <i class="fas fa-city" style="font-size:3rem;color:#cbd5e1;margin-bottom:20px;display:block;"></i>
                <h2 style="font-size:1.5rem;font-weight:700;margin-bottom:12px;">Group Not Found</h2>
                <p style="color:#64748b;margin-bottom:24px;">We couldn't find a group for this city.</p>
                <a href="/fb-groups" style="background:#1a2740;color:white;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:700;">Back to All Groups</a>
            </div>
            ${renderFooter()}
        `;
        initNavbar();
        return;
    }

    // Get city listings
    const matchingCity = db.cities.findAll().find(c => c.name.toLowerCase() === group.city_name.toLowerCase());
    const listings = matchingCity
        ? db.listings.find(l => l.city === matchingCity.city_id && l.status === 'active').slice(0, 6)
        : [];

    // Related groups (exclude current)
    const related = allGroups.filter(g => citySlugFrom(g.city_name) !== slug).slice(0, 6);

    const fallback = 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=1600&h=600&fit=crop';
    const description = getDescription(slug);
    const foundedYear = 2018 + (group.priority || 0) % 4;

    app.innerHTML = `
        ${renderNavbar()}

        <style>
            /* ── Hero ── */
            .gd-hero {
                position: relative;
                height: 460px;
                overflow: hidden;
                display: flex;
                align-items: flex-end;
            }
            .gd-hero-img {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }
            .gd-hero-overlay {
                position: absolute;
                inset: 0;
                background: linear-gradient(to top, rgba(10,14,26,0.92) 0%, rgba(10,14,26,0.55) 50%, rgba(10,14,26,0.15) 100%);
            }
            .gd-hero-content {
                position: relative;
                z-index: 2;
                width: 100%;
                padding: 0 0 48px;
            }
            .gd-hero-content .container { display: flex; flex-direction: column; gap: 16px; }
            .gd-hero-location {
                display: flex;
                align-items: center;
                gap: 8px;
                color: rgba(255,255,255,0.75);
                font-size: 0.9rem;
                font-weight: 500;
            }
            .gd-hero-location i { color: #7c3aed; }
            .gd-hero-title {
                font-size: clamp(1.8rem, 4vw, 2.8rem);
                font-weight: 800;
                color: #fff;
                letter-spacing: -0.03em;
                line-height: 1.15;
                margin: 0;
            }
            .gd-hero-meta {
                display: flex;
                align-items: center;
                gap: 16px;
                flex-wrap: wrap;
            }
            .gd-member-badge {
                display: inline-flex;
                align-items: center;
                gap: 6px;
                background: rgba(255,255,255,0.12);
                border: 1px solid rgba(255,255,255,0.2);
                backdrop-filter: blur(8px);
                color: #fff;
                font-size: 0.85rem;
                font-weight: 700;
                padding: 6px 16px;
                border-radius: 100px;
            }
            .gd-member-badge i { color: #a78bfa; }
            .gd-hero-actions {
                display: flex;
                align-items: center;
                gap: 16px;
                flex-wrap: wrap;
                margin-top: 4px;
            }
            .gd-join-btn {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                background: #1a1a2e;
                color: #fff;
                padding: 14px 28px;
                border-radius: 100px;
                font-size: 1rem;
                font-weight: 700;
                text-decoration: none;
                border: 2px solid rgba(255,255,255,0.15);
                transition: all 0.25s ease;
            }
            .gd-join-btn:hover {
                background: #1877f2;
                border-color: #1877f2;
                transform: translateY(-2px);
                box-shadow: 0 8px 24px rgba(24,119,242,0.4);
            }
            .gd-join-btn .fab { font-size: 1.1rem; }
            .gd-view-link {
                color: rgba(255,255,255,0.7);
                font-size: 0.9rem;
                font-weight: 600;
                text-decoration: none;
                display: inline-flex;
                align-items: center;
                gap: 6px;
                transition: color 0.2s;
            }
            .gd-view-link:hover { color: #fff; }

            /* ── Page Body ── */
            .gd-page { background: #F4F6F9; }
            .gd-page .container { max-width: 1180px; margin: 0 auto; padding: 0 24px; }

            /* ── About Section ── */
            .gd-about {
                background: #fff;
                padding: 52px 0;
                border-bottom: 1px solid #e8edf4;
            }
            .gd-about-inner { display: grid; grid-template-columns: 1.5fr 1fr; gap: 56px; align-items: center; }
            .gd-about-label {
                font-size: 0.75rem;
                font-weight: 800;
                letter-spacing: 0.1em;
                text-transform: uppercase;
                color: #7c3aed;
                margin-bottom: 12px;
            }
            .gd-about-title {
                font-size: 1.5rem;
                font-weight: 800;
                color: #1a2740;
                margin-bottom: 16px;
                letter-spacing: -0.02em;
            }
            .gd-about-desc {
                color: #475569;
                font-size: 1rem;
                line-height: 1.8;
            }
            .gd-stats-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 16px;
            }
            .gd-stat-box {
                background: #F8FAFC;
                border: 1px solid #e8edf4;
                border-radius: 16px;
                padding: 20px;
                text-align: center;
            }
            .gd-stat-box strong {
                display: block;
                font-size: 1.5rem;
                font-weight: 800;
                color: #1a2740;
                margin-bottom: 4px;
            }
            .gd-stat-box span {
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.06em;
                color: #8a94a6;
            }

            /* ── Listings Section ── */
            .gd-listings-section { padding: 56px 0; }
            .gd-section-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 32px; flex-wrap: wrap; gap: 12px; }
            .gd-section-header h2 { font-size: 1.4rem; font-weight: 800; color: #1a2740; letter-spacing: -0.02em; }
            .gd-section-link { font-size: 0.9rem; font-weight: 700; color: #7c3aed; text-decoration: none; display: inline-flex; align-items: center; gap: 6px; }
            .gd-section-link:hover { color: #5b21b6; }
            .gd-listings-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
            .gd-listing-card { background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid rgba(0,0,0,0.07); text-decoration: none; color: inherit; display: flex; flex-direction: column; transition: transform 0.3s ease, box-shadow 0.3s ease; box-shadow: 0 2px 10px rgba(0,0,0,0.05); }
            .gd-listing-card:hover { transform: translateY(-4px); box-shadow: 0 16px 40px rgba(0,0,0,0.1); }
            .gd-listing-img { position: relative; height: 180px; overflow: hidden; background: #e2e8f0; }
            .gd-listing-img img { width: 100%; height: 100%; object-fit: cover; transition: transform 0.5s ease; display: block; }
            .gd-listing-card:hover .gd-listing-img img { transform: scale(1.07); }
            .gd-listing-badge { position: absolute; top: 10px; left: 10px; background: #7c3aed; color: #fff; font-size: 0.7rem; font-weight: 700; padding: 4px 10px; border-radius: 100px; }
            .gd-listing-body { padding: 16px 18px 18px; flex: 1; display: flex; flex-direction: column; gap: 4px; }
            .gd-listing-price { font-size: 1.25rem; font-weight: 800; color: #7c3aed; }
            .gd-listing-price span { font-size: 0.8rem; font-weight: 400; color: #8a94a6; }
            .gd-listing-title { font-size: 0.9rem; color: #1a2740; font-weight: 600; line-height: 1.3; display: -webkit-box; -webkit-line-clamp: 1; -webkit-box-orient: vertical; overflow: hidden; }
            .gd-listing-view { font-size: 0.8rem; font-weight: 700; color: #7c3aed; margin-top: 8px; }
            .gd-no-listings { background: #fff; border-radius: 16px; padding: 48px; text-align: center; color: #8a94a6; border: 1px solid #e8edf4; }
            .gd-no-listings i { font-size: 2.5rem; margin-bottom: 16px; display: block; opacity: 0.3; }
            .gd-no-listings a { display: inline-block; margin-top: 16px; background: #7c3aed; color: #fff; padding: 10px 24px; border-radius: 10px; text-decoration: none; font-weight: 700; font-size: 0.9rem; }

            /* ── Related Groups ── */
            .gd-related-section { padding: 0 0 72px; }
            .gd-related-scroll { display: flex; gap: 20px; overflow-x: auto; padding-bottom: 12px; scroll-snap-type: x mandatory; -ms-overflow-style: none; scrollbar-width: none; }
            .gd-related-scroll::-webkit-scrollbar { display: none; }
            .gd-related-card { min-width: 220px; background: #fff; border-radius: 14px; overflow: hidden; border: 1px solid rgba(0,0,0,0.07); text-decoration: none; color: inherit; flex-shrink: 0; scroll-snap-align: start; transition: transform 0.3s ease, box-shadow 0.3s ease; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
            .gd-related-card:hover { transform: translateY(-4px); box-shadow: 0 12px 32px rgba(0,0,0,0.1); }
            .gd-related-img { height: 130px; overflow: hidden; background: #e2e8f0; }
            .gd-related-img img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.5s ease; }
            .gd-related-card:hover .gd-related-img img { transform: scale(1.07); }
            .gd-related-body { padding: 14px 16px 16px; }
            .gd-related-name { font-size: 0.85rem; font-weight: 700; color: #1a2740; line-height: 1.3; margin-bottom: 6px; }
            .gd-related-meta { font-size: 0.75rem; color: #8a94a6; display: flex; align-items: center; gap: 5px; }
            .gd-related-meta i { color: #7c3aed; font-size: 0.7rem; }

            /* ── Sticky Mobile Bar ── */
            .gd-sticky-bar {
                display: none;
                position: fixed;
                bottom: 0; left: 0; right: 0;
                background: #1a1a2e;
                border-top: 1px solid rgba(255,255,255,0.1);
                padding: 12px 20px;
                z-index: 999;
                align-items: center;
                justify-content: center;
                gap: 12px;
            }
            .gd-sticky-bar a {
                display: inline-flex;
                align-items: center;
                gap: 10px;
                background: #1877f2;
                color: #fff;
                padding: 13px 32px;
                border-radius: 100px;
                font-size: 1rem;
                font-weight: 700;
                text-decoration: none;
                width: 100%;
                justify-content: center;
            }
            @media (max-width: 768px) {
                .gd-sticky-bar { display: flex; }
                .gd-about-inner { grid-template-columns: 1fr; gap: 32px; }
                .gd-listings-grid { grid-template-columns: 1fr 1fr; }
                body { padding-bottom: 72px; }
            }
            @media (max-width: 480px) {
                .gd-listings-grid { grid-template-columns: 1fr; }
                .gd-hero { height: 380px; }
            }
        </style>

        <div class="gd-page">
            <!-- Hero -->
            <div class="gd-hero">
                <img class="gd-hero-img" src="${group.city_image || fallback}" alt="${group.city_name}" onerror="this.onerror=null;this.src='${fallback}';">
                <div class="gd-hero-overlay"></div>
                <div class="gd-hero-content">
                    <div class="container">
                        <div class="gd-hero-location">
                            <i class="fas fa-location-dot"></i> ${group.city_name}
                        </div>
                        <h1 class="gd-hero-title">${group.fb_group_name}</h1>
                        <div class="gd-hero-meta">
                            <div class="gd-member-badge">
                                <i class="fas fa-users"></i>
                                ${formatMembers(group.total_members)}+ Members
                            </div>
                        </div>
                        <div class="gd-hero-actions">
                            <a href="${group.fb_group_link}" target="_blank" rel="noopener noreferrer" class="gd-join-btn">
                                <i class="fab fa-facebook-f"></i> Join Group
                            </a>
                            <a href="${group.fb_group_link}" target="_blank" rel="noopener noreferrer" class="gd-view-link">
                                Already a member? View Group on Facebook →
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            <!-- About -->
            <section class="gd-about">
                <div class="container">
                    <div class="gd-about-inner">
                        <div>
                            <div class="gd-about-label">About This Group</div>
                            <div class="gd-about-title">The ${group.city_name} Roommate Community</div>
                            <p class="gd-about-desc">${description}</p>
                        </div>
                        <div class="gd-stats-grid">
                            <div class="gd-stat-box">
                                <strong>${formatMembers(group.total_members)}+</strong>
                                <span>Total Members</span>
                            </div>
                            <div class="gd-stat-box">
                                <strong>${listings.length || '0'}</strong>
                                <span>Active Listings</span>
                            </div>
                            <div class="gd-stat-box">
                                <strong>1</strong>
                                <span>Cities Covered</span>
                            </div>
                            <div class="gd-stat-box">
                                <strong>${foundedYear}</strong>
                                <span>Founded</span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <!-- Listings -->
            <section class="gd-listings-section">
                <div class="container">
                    <div class="gd-section-header">
                        <h2>Recent Listings in ${group.city_name}</h2>
                        ${matchingCity ? `<a href="/search/rooms?city=${matchingCity.slug}" class="gd-section-link">View all listings <i class="fas fa-arrow-right"></i></a>` : ''}
                    </div>
                    ${listings.length > 0
                        ? `<div class="gd-listings-grid">${listings.map(renderListingCard).join('')}</div>`
                        : `<div class="gd-no-listings">
                                <i class="fas fa-home"></i>
                                <p>No active listings yet in ${group.city_name}.</p>
                                <a href="/post-listing${matchingCity ? '?city=' + matchingCity.slug : ''}">Be the first to post →</a>
                           </div>`
                    }
                </div>
            </section>

            <!-- Related Groups -->
            <section class="gd-related-section">
                <div class="container">
                    <div class="gd-section-header">
                        <h2>Other City Groups</h2>
                        <a href="/fb-groups" class="gd-section-link">View all <i class="fas fa-arrow-right"></i></a>
                    </div>
                    <div class="gd-related-scroll">
                        ${related.map(g => renderRelatedCard(g, slug)).join('')}
                    </div>
                </div>
            </section>

            ${renderFooter()}
        </div>

        <!-- Mobile Sticky Bar -->
        <div class="gd-sticky-bar">
            <a href="${group.fb_group_link}" target="_blank" rel="noopener noreferrer">
                <i class="fab fa-facebook-f"></i> Join Group on Facebook
            </a>
        </div>
    `;

    initNavbar();
}
