import { db } from '../services/db.js';
import { navigate } from '../router.js';
import { getVerificationBadge, getCurrentUser } from '../services/auth.js';
import { renderNavbar, initNavbar } from '../components/navbar.js';

const FALLBACK_HERO = 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&h=700&fit=crop';
const FALLBACK_CITY_IMG = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop';

export function renderCityPage(app, params) {
    try {
    const citySlug = (params.slug || '').toLowerCase();
    const city = db.cities.findOne(c => (c.slug || '').toLowerCase() === citySlug);

    if (!city) {
        app.innerHTML = `
            <div class="container py-xl text-center">
                <h2>City not found</h2>
                <p>Sorry, we couldn't find the city you're looking for.</p>
                <a href="/" class="btn btn-primary mt-lg">Back to Home</a>
            </div>
        `;
        return;
    }

    const heroImage = city.hero_image || FALLBACK_HERO;
    const cityListings = db.listings.find(l => l.city === city.city_id && l.status === 'active');
    const cityNeighborhoods = (db.neighborhoods ? db.neighborhoods.find(n => n.city === city.city_id) : []).slice(0, 8);
    const roommateProfiles = db.listings.find(l => l.city === city.city_id && (l.category === 'roommate_wanted' || l.category === 'room_wanted'));
    const cityMemberCount = db.users.find(u => u.city === city.city_id && u.role !== 'admin').length;
    const avgRent = cityListings.length > 0
        ? Math.round(cityListings.reduce((sum, l) => sum + (l.price || 0), 0) / cityListings.length)
        : 0;

    const latestPosts = db.posts.findAll().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 3);

    app.innerHTML = `
        ${renderNavbar()}
        <style>
            .city-page { background: #fff; }
            
            /* ── Feature Sections (Ported from Group Detail) ── */
            .gd-feature-section { padding: 80px 0; background: #fff; border-bottom: 1px solid #e8edf4; }
            .gd-feature-row { display: flex; align-items: center; gap: 64px; }
            .gd-feature-row.reverse { flex-direction: row-reverse; }
            .gd-feature-img-wrapper { flex: 1; border-radius: 24px; overflow: hidden; box-shadow: 0 20px 50px rgba(0,0,0,0.08); }
            .gd-feature-img { width: 100%; height: 100%; object-fit: cover; display: block; transition: transform 0.6s ease; }
            .gd-feature-img-wrapper:hover .gd-feature-img { transform: scale(1.05); }
            .gd-feature-content { flex: 1; }
            .gd-feature-badge { display: inline-block; padding: 6px 14px; background: #ede9fe; color: #7c3aed; font-size: 0.75rem; font-weight: 800; border-radius: 100px; text-transform: uppercase; margin-bottom: 16px; }
            .gd-feature-title { font-size: 2.2rem; font-weight: 800; color: #1a2740; margin-bottom: 20px; line-height: 1.2; letter-spacing: -0.02em; }
            .gd-feature-desc { font-size: 1.1rem; line-height: 1.7; color: #475569; margin-bottom: 24px; }
            .gd-feature-list { list-style: none; padding: 0; margin: 0 0 32px; display: flex; flex-direction: column; gap: 12px; }
            .gd-feature-list li { display: flex; align-items: center; gap: 12px; font-weight: 600; color: #1a2740; font-size: 1rem; }
            .gd-feature-list li i { color: #10b981; font-size: 1.2rem; }

            /* ── Blog Section ── */
            .gd-blog-section { padding: 80px 0; background: #F8FAFC; }
            .gd-blog-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 24px; }
            .gd-blog-card { background: #fff; border-radius: 20px; overflow: hidden; border: 1px solid #e8edf4; text-decoration: none; color: inherit; display: flex; flex-direction: column; transition: all 0.3s ease; }
            .gd-blog-card:hover { transform: translateY(-8px); box-shadow: 0 20px 40px rgba(0,0,0,0.05); }
            .gd-blog-img { position: relative; height: 180px; overflow: hidden; }
            .gd-blog-img img { width: 100%; height: 100%; object-fit: cover; }
            .gd-blog-cat { position: absolute; top: 12px; left: 12px; background: #7c3aed; color: #fff; font-size: 0.65rem; font-weight: 800; padding: 4px 10px; border-radius: 100px; text-transform: uppercase; }
            .gd-blog-body { padding: 24px; flex: 1; display: flex; flex-direction: column; gap: 10px; }
            .gd-blog-title { font-size: 1.15rem; font-weight: 800; color: #1a2740; line-height: 1.4; }
            .gd-blog-excerpt { font-size: 0.9rem; color: #64748b; line-height: 1.6; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
            .gd-blog-footer { margin-top: auto; padding-top: 16px; display: flex; justify-content: space-between; align-items: center; font-size: 0.8rem; color: #8a94a6; font-weight: 600; border-top: 1px solid #f1f5f9; }
            .gd-blog-more { color: #7c3aed; font-weight: 800; display: flex; align-items: center; gap: 6px; }

            @media (max-width: 1024px) {
                .gd-blog-grid { grid-template-columns: 1fr 1fr; }
            }
            @media (max-width: 768px) {
                .gd-feature-row { flex-direction: column; gap: 32px; text-align: center; }
                .gd-feature-row.reverse { flex-direction: column; }
                .gd-feature-list li { justify-content: center; }
                .gd-blog-grid { grid-template-columns: 1fr; }
                .gd-feature-title { font-size: 1.8rem; }
            }
        </style>
        <div class="city-page">

            <!-- ── HERO ── -->
            <section class="city-hero" style="background-image: url('${heroImage}')">
                <div class="city-hero-overlay">
                    <div class="container city-hero-content">
                        <nav class="city-breadcrumb">
                            <a href="/">Home</a>
                            <i class="fa-solid fa-chevron-right"></i>
                            <a href="/cities">Cities</a>
                            <i class="fa-solid fa-chevron-right"></i>
                            <span>${city.name}</span>
                        </nav>
                        <h1 class="city-hero-title">Rooms &amp; Roommates<br>in ${city.name}</h1>
                        <p class="city-hero-sub">Find your perfect room or roommate in ${city.name}'s most vibrant neighborhoods</p>
                        <div class="city-hero-stats">
                            <div class="hero-stat-pill">
                                <div class="hero-stat-icon"><i class="fa-solid fa-house"></i></div>
                                <div class="hero-stat-text">
                                    <strong>${cityListings.length}</strong>
                                    <span>Listings</span>
                                </div>
                            </div>
                            <div class="hero-stat-pill">
                                <div class="hero-stat-icon"><i class="fa-solid fa-tag"></i></div>
                                <div class="hero-stat-text">
                                    <strong>${avgRent > 0 ? '$' + avgRent + '/mo' : '—'}</strong>
                                    <span>Avg. Rent</span>
                                </div>
                            </div>
                            <div class="hero-stat-pill">
                                <div class="hero-stat-icon"><i class="fa-solid fa-users"></i></div>
                                <div class="hero-stat-text">
                                    <strong>${cityMemberCount.toLocaleString()}</strong>
                                    <span>Members</span>
                                </div>
                            </div>
                        </div>
                        <div class="city-search-bar">
                            <div class="search-field">
                                <i class="fa-solid fa-location-dot"></i>
                                <input type="text" value="${city.name}" disabled>
                            </div>
                            <div class="search-bar-divider"></div>
                            <div class="search-field">
                                <i class="fa-solid fa-filter"></i>
                                <select id="listing-type">
                                    <option value="">All Types</option>
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
                            <button class="btn btn-primary search-bar-btn">
                                <i class="fa-solid fa-magnifying-glass"></i> Search
                            </button>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ── AVAILABLE ROOMS ── -->
            <section class="city-section">
                <div class="container">
                    <div class="city-section-header">
                        <div>
                            <h2>Available Rooms in ${city.name}</h2>
                            <p>Browse the latest verified listings in the ${city.name} area.</p>
                        </div>
                        <a href="/search/rooms?city=${city.slug}" class="btn btn-outline btn-sm">
                            View All ${cityListings.length} <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                    ${cityListings.length > 0
                        ? `<div class="listings-grid">${cityListings.slice(0, 6).map(l => renderListingCard(l)).join('')}</div>`
                        : `<div class="city-empty-state">
                            <div class="empty-icon"><i class="fa-solid fa-house"></i></div>
                            <h4>No rooms available yet</h4>
                            <p>Be the first to list a room in ${city.name}!</p>
                            <a href="/post-listing" class="btn btn-primary mt-md">Post a Listing</a>
                           </div>`
                    }
                </div>
            </section>

            <!-- ── NEIGHBORHOODS ── -->
            <section class="city-section city-section-alt">
                <div class="container">
                    <div class="city-section-header">
                        <div>
                            <h2>Popular Neighborhoods in ${city.name}</h2>
                            <p>Find the area that fits your lifestyle and budget.</p>
                        </div>
                    </div>
                    ${cityNeighborhoods.length > 0
                        ? `<div class="neighborhoods-grid">${cityNeighborhoods.map((n, i) => renderNeighborhoodCard(n, i)).join('')}</div>`
                        : `<div class="city-empty-state">
                            <div class="empty-icon"><i class="fa-solid fa-map-location-dot"></i></div>
                            <h4>Neighborhood guides coming soon</h4>
                            <p>We're building detailed guides for ${city.name}.</p>
                           </div>`
                    }
                </div>
            </section>

            <!-- ── ROOMMATES LOOKING ── -->
            <section class="city-section city-section-alt">
                <div class="container">
                    <div class="city-section-header">
                        <div>
                            <h2>Roommates Looking in ${city.name}</h2>
                            <p>Connect with people actively searching for a home right now.</p>
                        </div>
                        <a href="/search/roommates?city=${city.slug}" class="btn btn-outline btn-sm">
                            See All Profiles <i class="fa-solid fa-arrow-right"></i>
                        </a>
                    </div>
                    ${roommateProfiles.length > 0
                        ? `<div class="roommates-grid">${roommateProfiles.slice(0, 6).map(r => renderRoommateCard(r)).join('')}</div>`
                        : `<div class="city-empty-state">
                            <div class="empty-icon"><i class="fa-solid fa-user-group"></i></div>
                            <h4>No roommate profiles yet</h4>
                            <p>Create a profile to find your perfect match in ${city.name}.</p>
                            <a href="/post-listing" class="btn btn-primary mt-md">Create Profile</a>
                           </div>`
                    }
                </div>
            </section>

            <!-- ── FEATURE 1: VERIFIED COMMUNITY ── -->
            <section class="gd-feature-section">
                <div class="container">
                    <div class="gd-feature-row reverse">
                        <div class="gd-feature-content">
                            <div class="gd-feature-badge">Verified Community</div>
                            <h2 class="gd-feature-title">Real People, Real Connections in ${city.name}</h2>
                            <p class="gd-feature-desc">Every member of the <strong>${city.name}</strong> community is verified. We use a combination of social proof and manual moderation to ensure you're connecting with genuine roommates.</p>
                            <ul class="gd-feature-list">
                                <li><i class="fas fa-check-circle"></i> ID Verified Profiles</li>
                                <li><i class="fas fa-check-circle"></i> Scam-Free Guarantee</li>
                                <li><i class="fas fa-check-circle"></i> Secure Messaging</li>
                            </ul>
                        </div>
                        <div class="gd-feature-img-wrapper">
                            <img src="https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=600&fit=crop" class="gd-feature-img" alt="Verified Community">
                        </div>
                    </div>
                </div>
            </section>

            <!-- ── FEATURE 2: LOCAL EXPERTISE ── -->
            <section class="gd-feature-section" style="background: #f8fafc;">
                <div class="container">
                    <div class="gd-feature-row">
                        <div class="gd-feature-img-wrapper">
                            <img src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=800&h=600&fit=crop" class="gd-feature-img" alt="Local Expertise">
                        </div>
                        <div class="gd-feature-content">
                            <div class="gd-feature-badge">Local Expertise</div>
                            <h2 class="gd-feature-title">Expert Advice for ${city.name}</h2>
                            <p class="gd-feature-desc">Our local ambassadors provide up-to-date advice on neighborhoods, rent trends, and moving tips specific to the <strong>${city.name}</strong> area.</p>
                            <ul class="gd-feature-list">
                                <li><i class="fas fa-check-circle"></i> Neighborhood Guides</li>
                                <li><i class="fas fa-check-circle"></i> Rent Trend Data</li>
                                <li><i class="fas fa-check-circle"></i> Legal Assistance</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </section>

            <!-- ── BLOG SECTION ── -->
            <section class="gd-blog-section">
                <div class="container">
                    <div class="city-section-header centered">
                        <h2>Latest from the Blog</h2>
                        <p>Moving tips, neighborhood guides, and roommate advice.</p>
                    </div>
                    <div class="gd-blog-grid">
                        ${latestPosts.map(post => `
                            <a href="/blog/${post.slug}" class="gd-blog-card">
                                <div class="gd-blog-img">
                                    <img src="${post.featured_image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=400&h=250&fit=crop'}" alt="${post.title}">
                                    <span class="gd-blog-cat">${post.category || 'Lifestyle'}</span>
                                </div>
                                <div class="gd-blog-body">
                                    <h3 class="gd-blog-title">${post.title}</h3>
                                    <p class="gd-blog-excerpt">${post.excerpt || post.content.substring(0, 100).replace(/<[^>]*>/g, '')}...</p>
                                    <div class="gd-blog-footer">
                                        <span>${new Date(post.created_at).toLocaleDateString()}</span>
                                        <span class="gd-blog-more">Read More <i class="fas fa-arrow-right"></i></span>
                                    </div>
                                </div>
                            </a>
                        `).join('')}
                    </div>
                </div>
            </section>

            <!-- ── FAQ ── -->
            ${city.faq_items && city.faq_items.length > 0 ? `
            <section class="city-section city-section-alt faq-section">
                <div class="container faq-container">
                    <div class="city-section-header centered">
                        <h2>Frequently Asked Questions</h2>
                        <p>Common questions about renting and finding roommates in ${city.name}.</p>
                    </div>
                    <div class="faq-list">
                        ${city.faq_items.map((faq, i) => `
                            <div class="faq-item">
                                <div class="faq-icon-box">
                                    <i class="fa-solid fa-question"></i>
                                </div>
                                <div class="faq-content">
                                    <div class="faq-q">${faq.question}</div>
                                    <div class="faq-a">${faq.answer}</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <script type="application/ld+json">
                {
                  "@context": "https://schema.org",
                  "@type": "FAQPage",
                  "mainEntity": [
                    ${city.faq_items.map(faq => `{
                      "@type": "Question",
                      "name": "${faq.question.replace(/"/g, '\\"')}",
                      "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "${faq.answer.replace(/"/g, '\\"')}"
                      }
                    }`).join(',')}
                  ]
                }
                </script>
            </section>
            ` : ''}

            <!-- ── NEARBY CITIES ── -->
            <section class="city-section nearby-section">
                <div class="container">
                    <div class="city-section-header">
                        <div>
                            <h2>Explore Nearby Cities</h2>
                            <p>Considering other areas? Discover more options close to ${city.name}.</p>
                        </div>
                    </div>
                    <div class="nearby-cities-grid">
                        ${renderNearbyCities(city)}
                    </div>
                </div>
            </section>

        </div><!-- /.city-page -->
    `;

    updateBreadcrumbs(city);
    updateMetaTags(city);

    setTimeout(() => {
        const pageContainer = app.querySelector('.city-page');
        if (pageContainer) {
            pageContainer.addEventListener('click', (e) => {
                const saveBtn = e.target.closest('.save-btn');
                if (saveBtn) {
                    e.preventDefault();
                    e.stopPropagation();
                    const listingId = saveBtn.dataset.id;
                    const user = getCurrentUser();
                    if (!user) { navigate('/auth/login'); return; }
                    const dbUser = db.users.findById(user.id);
                    if (!dbUser) return;
                    if (!dbUser.saved_listings) dbUser.saved_listings = [];
                    const idx = dbUser.saved_listings.indexOf(listingId);
                    if (idx > -1) {
                        dbUser.saved_listings.splice(idx, 1);
                        saveBtn.innerHTML = '<i class="fa-regular fa-heart"></i>';
                        saveBtn.classList.remove('active');
                    } else {
                        dbUser.saved_listings.push(listingId);
                        saveBtn.innerHTML = '<i class="fa-solid fa-heart"></i>';
                        saveBtn.classList.add('active');
                    }
                    db.users.update(user.id, { saved_listings: dbUser.saved_listings });
                }
            });
        }
        // Search bar
        const searchBtn = app.querySelector('.search-bar-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => {
                const typeVal = app.querySelector('#listing-type').value;
                let url = `/search/rooms?city=${city.slug}`;
                if (typeVal) url += `&type=${typeVal}`;
                navigate(url);
            });
        }
        initNavbar();
    }, 0);

    } catch(e) {
        console.error('[City] Rendering failed:', e);
        app.innerHTML = `
            <div class="container py-xl text-center">
                <h2>Something went wrong</h2>
                <p>We hit an error loading this city page. Please try again.</p>
                <pre style="text-align:left;font-size:0.8rem;background:#f5f5f5;padding:12px;border-radius:8px;overflow:auto">${e.message}</pre>
                <a href="/" class="btn btn-outline mt-md">Back to Home</a>
            </div>
        `;
    }
}

/* ─── Helper: Listing Card ─── */
function renderListingCard(l) {
    const currentUser = getCurrentUser();
    let isSaved = false;
    if (currentUser) {
        const dbUser = db.users.findById(currentUser.id);
        if (dbUser && dbUser.saved_listings && dbUser.saved_listings.includes(l.listing_id)) isSaved = true;
    }
    const photo = l.photos && l.photos[0] ? l.photos[0] : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop';
    const roomType = (l.room_type || l.category || 'room').replace(/_/g,' ').toUpperCase();

    return `
        <div class="listing-card">
            <a href="/listing/${l.listing_id}" class="listing-card-link">
                <div class="listing-img" style="background-image:url('${photo}')">
                    <span class="listing-type-badge">${roomType}</span>
                    <button class="save-btn ${isSaved ? 'active' : ''}" data-id="${l.listing_id}" aria-label="Save listing">
                        <i class="${isSaved ? 'fa-solid' : 'fa-regular'} fa-heart"></i>
                    </button>
                    <span class="listing-price-badge">$${l.price}<em>/mo</em></span>
                </div>
                <div class="listing-card-body">
                    <h3>${l.title}</h3>
                </div>
            </a>
        </div>
    `;
}

/* ─── Helper: Neighborhood Card ─── */
const NH_PALETTES = [
    { bg: 'linear-gradient(135deg,#1a1a1a,#333333)', text: '#fff' },
    { bg: 'linear-gradient(135deg,#1a1a1a,#444444)', text: '#fff' },
    { bg: 'linear-gradient(135deg,#1a1a1a,#444444)', text: '#fff' },
    { bg: 'linear-gradient(135deg,#1a1a1a,#444444)', text: '#fff' },
    { bg: 'linear-gradient(135deg,#1a1a1a,#444444)', text: '#fff' },
    { bg: 'linear-gradient(135deg,#1a1a1a,#444444)', text: '#fff' },
    { bg: 'linear-gradient(135deg,#1a1a1a,#444444)', text: '#fff' },
    { bg: 'linear-gradient(135deg,#1a1a1a,#444444)', text: '#fff' },
];

function renderNeighborhoodCard(n, index) {
    const palette = NH_PALETTES[index % NH_PALETTES.length];
    return `
        <div class="neighborhood-card">
            <div class="neighborhood-card-header" style="background:${palette.bg}">
                <h3>${n.name}</h3>
                <span class="nh-listing-badge">${n.listing_count} Listings</span>
            </div>
            <div class="neighborhood-card-body">
                <div class="nh-rent">
                    <span class="nh-rent-label">Avg. Rent</span>
                    <span class="nh-rent-value">$${n.avg_rent}<em>/mo</em></span>
                </div>
                <p class="nh-description">${n.description}</p>
                <a href="/cities/${n.slug}" class="nh-link">
                    Explore Guide <i class="fa-solid fa-arrow-right"></i>
                </a>
            </div>
        </div>
    `;
}

/* ─── Helper: Roommate Card ─── */
function renderRoommateCard(r) {
    const user = r.user_details || { display_name: 'Roommate', profile_photo: 'https://i.pravatar.cc/150?u=unknown' };
    return `
        <div class="roommate-card">
            <div class="roommate-card-img" style="background-image:url('${user.profile_photo}')">
                <span class="roommate-budget">$${r.price}/mo</span>
            </div>
            <div class="roommate-card-body">
                <h3 class="roommate-name">${user.display_name} ${getVerificationBadge(user)}</h3>
                <p class="roommate-title">${r.title}</p>
                <div class="roommate-tags">
                    ${(r.lifestyle_tags || []).slice(0, 3).map(t => `<span class="roommate-tag">${t.replace('tag_','')}</span>`).join('')}
                </div>
                <div class="roommate-move-in">
                    <i class="fa-regular fa-calendar"></i> Moving: ${r.move_in_date}
                </div>
            </div>
        </div>
    `;
}

/* ─── Helper: Nearby Cities ─── */
function renderNearbyCities(currentCity) {
    const allCities = db.getCollection('cities');
    const nearby = allCities
        .filter(c => c.city_id !== currentCity.city_id)
        .map(c => ({ ...c, distance: calculateDistance(currentCity.latitude, currentCity.longitude, c.latitude, c.longitude) }))
        .sort((a, b) => a.distance - b.distance)
        .slice(0, 5);

    const allListings = db.getCollection('listings');
    return nearby.map(c => {
        const img = c.hero_image || FALLBACK_CITY_IMG;
        const liveCount = allListings.filter(l => l.city === c.city_id && l.status === 'active').length;
        return `
            <a href="/cities/${c.slug}" class="nearby-city-card">
                <div class="nearby-city-img" style="background-image:url('${img}')">
                    <div class="nearby-city-overlay">
                        <h4>${c.name}</h4>
                        <span class="nearby-distance"><i class="fa-solid fa-location-dot"></i> ${Math.round(c.distance)} mi</span>
                    </div>
                </div>
                <div class="nearby-city-meta">
                    <span><i class="fa-solid fa-house"></i> ${liveCount} listings</span>
                    <span><i class="fa-solid fa-tag"></i> $${c.avg_rent}/mo</span>
                </div>
            </a>
        `;
    }).join('');
}

/* ─── Utilities ─── */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 3958.8;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function updateBreadcrumbs(city) {
    const schema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "itemListElement": [
            { "@type": "ListItem", "position": 1, "name": "Home", "item": window.location.origin + '/' },
            { "@type": "ListItem", "position": 2, "name": "Cities", "item": window.location.origin + '/cities' },
            { "@type": "ListItem", "position": 3, "name": city.name, "item": window.location.origin + `/cities/${city.slug}` }
        ]
    };
    let script = document.getElementById('breadcrumb-schema');
    if (!script) { script = document.createElement('script'); script.id = 'breadcrumb-schema'; script.type = 'application/ld+json'; document.head.appendChild(script); }
    script.textContent = JSON.stringify(schema);
}

function updateMetaTags(city) {
    document.title = city.meta_title || `${city.name} Rooms for Rent | RoommateGroups`;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute('content', city.meta_description || `Find the best rooms and roommates in ${city.name}.`);
    updateMetaProperty('og:title', document.title);
    updateMetaProperty('og:description', city.meta_description || '');
    updateMetaProperty('og:image', city.hero_image || FALLBACK_HERO);
    updateMetaProperty('og:url', window.location.href);
}

function updateMetaProperty(property, content) {
    let el = document.querySelector(`meta[property="${property}"]`);
    if (!el) { el = document.createElement('meta'); el.setAttribute('property', property); document.head.appendChild(el); }
    el.setAttribute('content', content);
}
