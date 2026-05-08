/**
 * src/mobile/pages/MobileCity.js
 *
 * Mobile-optimized city landing page.
 * Features: Hero with stats, Available Rooms, Popular Neighborhoods,
 * Roommates Looking, Features, Reviews, Blog, FAQ, and Nearby Cities.
 */

import { db, initDB } from '../../services/db.js';
import { getCurrentUser, getVerificationBadge } from '../../services/auth.js';
import { renderMobileCard, attachMobileCardEvents } from '../components/MobileCard.js';
import { getAssetUrl } from '../../services/assets.js';

async function getMobile() { return await import('../mobile-main.js'); }

const FALLBACK_HERO = 'https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1600&h=700&fit=crop';
const FALLBACK_CITY_IMG = 'https://images.unsplash.com/photo-1477959858617-67f85cf4f1df?w=600&h=400&fit=crop';

export async function init(container, params) {
  container.innerHTML = _skeletonHTML();
  await initDB().catch(() => { });

  const citySlug = (params.slug || '').toLowerCase();
  const city = db.cities.findOne(c => (c.slug || '').toLowerCase() === citySlug);

  if (!city) {
    _renderNotFound(container);
    return;
  }

  // Update Header
  const { updateHeader, navigate } = await getMobile();
  updateHeader({
    title: city.name,
    showBack: true
  });

  // Data Fetching
  const cityListings = db.listings.find(l => l.city === city.city_id && l.status === 'active');
  const cityNeighborhoods = (db.neighborhoods ? db.neighborhoods.find(n => n.city === city.city_id) : []).slice(0, 8);
  const roommateProfiles = db.listings.find(l => 
    l.city === city.city_id && 
    (l.category === 'roommate_wanted' || l.category === 'room_wanted') &&
    l.status === 'active'
  ).map(r => ({
    ...r,
    user_details: db.users.findById(r.user_id)
  }));
  const cityMemberCount = db.users.find(u => u.city === city.city_id && u.role !== 'admin').length;
  const avgRent = cityListings.length > 0
    ? Math.round(cityListings.reduce((sum, l) => sum + (l.rent ?? l.price ?? 0), 0) / cityListings.length)
    : 0;

  const latestPosts = db.posts.findAll()
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    .slice(0, 3);

  const reviews = (city.reviews && Array.isArray(city.reviews) && city.reviews.length > 0)
    ? city.reviews
    : [
        { name: 'Sarah Miller', date: '2 days ago', rating: 5, text: `Found an amazing flatmate in ${city.name} through this community in less than a week.` },
        { name: 'David Chen', date: '1 week ago', rating: 5, text: `The ${city.name} community is super active. Lots of verified listings.` },
        { name: 'Emma Watson', date: '3 days ago', rating: 4, text: `Great resource for finding affordable rooms in ${city.name}.` }
      ];

  const faqs = (city.faq_items && Array.isArray(city.faq_items) && city.faq_items.length > 0)
    ? city.faq_items.map(f => ({ q: f.question, a: f.answer }))
    : [
        { q: `How do I join the ${city.name} community?`, a: `Simply browse the available listings or connect with roommates looking in ${city.name}.` },
        { q: `Is it free to find a roommate in ${city.name}?`, a: 'Yes! Our community is free to join and use.' },
        { q: 'How can I avoid scams during my search?', a: 'Never send money before seeing a room in person. We recommend meeting potential roommates in public first.' }
      ];

  const heroImage = city.hero_image || FALLBACK_HERO;

  container.innerHTML = `
    <style>
      .city-mobile { background: #fff; }
      .city-section { padding: 24px 16px; }
      .city-section-alt { background: #F8FAFC; }
      .section-title { font-size: 1.25rem; font-weight: 900; color: #0f172a; margin-bottom: 4px; letter-spacing: -0.02em; }
      .section-subtitle { font-size: 0.85rem; color: #64748b; margin-bottom: 20px; line-height: 1.4; }
      
      /* Hero Mobile */
      .city-hero-m { position: relative; height: 320px; overflow: hidden; background: #0f172a; }
      .city-hero-img { width: 100%; height: 100%; object-fit: cover; opacity: 0.85; }
      .city-hero-overlay { position: absolute; inset: 0; background: linear-gradient(to bottom, rgba(0,0,0,0.1), rgba(0,0,0,0.9) 95%); display: flex; flex-direction: column; justify-content: flex-end; padding: 32px 20px; color: #fff; }
      .city-hero-subtitle { font-size: 0.95rem; font-weight: 700; opacity: 0.9; margin-bottom: 6px; color: #cbd5e1; text-transform: uppercase; letter-spacing: 0.05em; }
      .city-hero-title { font-size: 2.6rem; font-weight: 900; margin-bottom: 16px; line-height: 1; letter-spacing: -0.03em; }
      .city-hero-stats { display: flex; gap: 10px; flex-wrap: wrap; }
      .hero-stat-pill { background: rgba(255,255,255,0.18); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); padding: 10px 18px; border-radius: 100px; font-size: 0.85rem; font-weight: 800; display: flex; align-items: center; gap: 8px; border: 1px solid rgba(255,255,255,0.25); }
      .hero-stat-pill i { font-size: 0.9rem; opacity: 0.9; }

      /* Horizontal Scroll */
      .city-scroll-x { display: flex; gap: 16px; overflow-x: auto; padding: 4px 0 20px; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
      .city-scroll-x::-webkit-scrollbar { display: none; }
      
      /* Listing Card Small */
      .m-listing-item { width: 220px; flex-shrink: 0; }
      
      /* Neighborhood Card */
      .nh-card-m { width: 220px; flex-shrink: 0; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
      .nh-card-header { padding: 12px; background: #1a1a1a; color: #fff; }
      .nh-card-header h3 { font-size: 0.9rem; font-weight: 800; margin: 0; }
      .nh-card-body { padding: 12px; }
      .nh-card-rent { font-size: 0.75rem; color: #64748b; margin-bottom: 8px; font-weight: 600; }
      .nh-card-rent strong { color: #1e293b; font-size: 0.9rem; }
      
      /* Roommate Card */
      .rm-card-m { width: 220px; flex-shrink: 0; background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #e2e8f0; }
      .rm-card-img { height: 180px; background-size: cover; background-position: center; position: relative; }
      .rm-card-price { position: absolute; bottom: 8px; right: 8px; background: #fff; padding: 4px 8px; border-radius: 8px; font-weight: 800; font-size: 0.75rem; box-shadow: 0 2px 6px rgba(0,0,0,0.1); }
      .rm-card-body { padding: 12px; }
      .rm-card-name { font-size: 0.85rem; font-weight: 800; color: #1e293b; margin-bottom: 4px; display: flex; align-items: center; gap: 4px; }
      .rm-card-title { font-size: 0.7rem; color: #64748b; line-height: 1.3; height: 1.8em; overflow: hidden; }

      /* Feature Section */
      .feature-box-m { background: #fff; border-radius: 20px; padding: 20px; margin-bottom: 16px; border: 1px solid #f1f5f9; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
      .feature-icon-m { width: 40px; height: 40px; border-radius: 10px; background: #ede9fe; color: #7c3aed; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; font-size: 1.1rem; }
      .feature-title-m { font-size: 1rem; font-weight: 800; margin-bottom: 8px; }
      .feature-desc-m { font-size: 0.8rem; color: #64748b; line-height: 1.5; }

      /* Reviews */
      .review-card-m { background: #fff; padding: 16px; border-radius: 16px; border: 1px solid #e2e8f0; width: 220px; flex-shrink: 0; }
      .review-stars-m { color: #f59e0b; font-size: 0.7rem; margin-bottom: 8px; }
      .review-text-m { font-size: 0.78rem; font-style: italic; color: #475569; line-height: 1.5; margin-bottom: 12px; }
      .review-user-m { display: flex; align-items: center; gap: 8px; }
      .review-avatar-m { width: 28px; height: 28px; border-radius: 50%; }
      .review-name-m { font-size: 0.75rem; font-weight: 700; }

      /* FAQ */
      .faq-item-m { border-bottom: 1px solid #f1f5f9; padding: 16px 0; }
      .faq-q-m { font-size: 0.88rem; font-weight: 700; color: #1e293b; margin-bottom: 6px; }
      .faq-a-m { font-size: 0.82rem; color: #64748b; line-height: 1.5; }

      /* Nearby Cities */
      .nearby-city-card { display: flex; align-items: center; gap: 12px; background: #fff; padding: 12px; border-radius: 14px; border: 1px solid #f1f5f9; margin-bottom: 10px; }
      .nearby-img-m { width: 60px; height: 60px; border-radius: 10px; object-fit: cover; }
      .nearby-name-m { font-size: 0.9rem; font-weight: 800; color: #1e293b; }
      .nearby-meta-m { font-size: 0.72rem; color: #64748b; margin-top: 2px; }
    </style>

    <div class="city-mobile">
      
      <!-- HERO -->
      <section class="city-hero-m">
        <img src="${getAssetUrl(city.hero_image) || FALLBACK_HERO}" class="city-hero-img" alt="${city.name}">
        <div class="city-hero-overlay">
          <div class="city-hero-subtitle">${city.state_province || ''}${city.state_province ? ', ' : ''}${db.countries.findById(city.country)?.name || ''}</div>
          <h1 class="city-hero-title">${city.name}</h1>
          <div class="city-hero-stats">
            <div class="hero-stat-pill">
              <i class="fa-solid fa-house"></i>
              <span>${cityListings.length} listings</span>
            </div>
            <div class="hero-stat-pill">
              <i class="fa-solid fa-tag"></i>
              <span>${avgRent > 0 ? '~$' + avgRent.toLocaleString() + '/mo' : 'Price varies'}</span>
            </div>
          </div>
        </div>
      </section>

      <!-- SEARCH BAR CTA -->
      <div style="padding: 16px; margin-top: -32px; position: relative; z-index: 5;">
        <div id="city-search-trigger" style="background: #fff; border-radius: 16px; padding: 14px 20px; display: flex; align-items: center; gap: 12px; box-shadow: 0 10px 25px rgba(0,0,0,0.12); border: 1px solid #e2e8f0; cursor: pointer;">
          <i class="fa-solid fa-magnifying-glass" style="color: #7c3aed; font-size: 1.1rem;"></i>
          <span style="color: #94a3b8; font-size: 0.95rem; font-weight: 600; flex: 1;">Search ${city.name} area…</span>
          <div style="width: 36px; height: 36px; border-radius: 10px; background: #f8fafc; display: flex; align-items: center; justify-content: center; color: #1e293b; border: 1px solid #f1f5f9;">
            <i class="fa-solid fa-sliders" style="font-size: 0.9rem;"></i>
          </div>
        </div>
      </div>

      <!-- AVAILABLE ROOMS -->
      <section class="city-section">
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:12px;">
          <div>
            <h2 class="section-title">Available Rooms</h2>
            <p style="font-size:0.75rem; color:#64748b;">Latest verified rooms in ${city.name}</p>
          </div>
          <a href="#" class="view-all-link" style="color:#7c3aed; font-size:0.78rem; font-weight:800; text-decoration:none;" id="view-all-rooms">View all</a>
        </div>
        ${cityListings.length > 0
          ? `<div class="city-scroll-x" id="city-rooms-scroll">${cityListings.slice(0, 6).map(l => renderMobileCard(l)).join('')}</div>`
          : `<div style="padding:20px; text-align:center; background:#f8fafc; border-radius:16px; border:1px dashed #cbd5e1;">
               <div style="font-size:1.5rem; margin-bottom:8px;">🏠</div>
               <div style="font-size:0.8rem; font-weight:700; color:#475569;">No rooms yet</div>
             </div>`
        }
      </section>

      <!-- NEIGHBORHOODS -->
      <section class="city-section city-section-alt">
        <h2 class="section-title">Popular Neighborhoods</h2>
        <p class="section-subtitle">Find the area that fits your lifestyle.</p>
        ${cityNeighborhoods.length > 0
          ? `<div class="city-scroll-x">${cityNeighborhoods.map(n => `
              <div class="nh-card-m" data-id="${n.neighborhood_id}">
                <div class="nh-card-header">
                  <h3>${n.name}</h3>
                </div>
                <div class="nh-card-body">
                  <div class="nh-card-rent">Avg. Rent <strong>$${n.avg_rent}/mo</strong></div>
                  <div style="display:inline-flex; align-items:center; gap:4px; background:#f1f5f9; padding:4px 8px; border-radius:6px; font-size:0.65rem; font-weight:800; color:#64748b;">
                    ${n.listing_count} Listings
                  </div>
                </div>
              </div>
            `).join('')}</div>`
          : `<p style="font-size:0.8rem; color:#94a3b8; font-style:italic;">Neighborhood guides coming soon.</p>`
        }
      </section>

      <!-- ROOMMATES LOOKING -->
      <section class="city-section">
        <div style="display:flex; justify-content:space-between; align-items:flex-end; margin-bottom:12px;">
          <div>
            <h2 class="section-title">Roommates Looking</h2>
            <p style="font-size:0.75rem; color:#64748b;">Connect with people searching now.</p>
          </div>
          <a href="#" style="color:#7c3aed; font-size:0.78rem; font-weight:800; text-decoration:none;" id="view-all-roommates">See all</a>
        </div>
        ${roommateProfiles.length > 0
          ? `<div class="city-scroll-x">${roommateProfiles.slice(0, 6).map(r => {
              const u = r.user_details || { display_name: 'User', profile_photo: 'https://i.pravatar.cc/150' };
              return `
                <div class="rm-card-m" data-id="${r.listing_id}">
                  <div class="rm-card-img" style="background-image:url('${u.profile_photo}')">
                    <div class="rm-card-price">$${r.rent || r.budgetMax}/mo</div>
                  </div>
                  <div class="rm-card-body">
                    <div class="rm-card-name">${u.display_name} ${getVerificationBadge(u)}</div>
                    <div class="rm-card-title">${r.title}</div>
                  </div>
                </div>
              `;
            }).join('')}</div>`
          : `<p style="font-size:0.8rem; color:#94a3b8; font-style:italic;">No active roommate profiles.</p>`
        }
      </section>

      <!-- FEATURES -->
      <section class="city-section city-section-alt">
        <h2 class="section-title">Why ${city.name}?</h2>
        <div style="margin-top:20px;">
          <div class="feature-box-m">
            <div class="feature-icon-m"><i class="fa-solid fa-shield-check"></i></div>
            <div class="feature-title-m">Verified Members</div>
            <div class="feature-desc-m">Every profile in ${city.name} is manually reviewed for your safety.</div>
          </div>
          <div class="feature-box-m">
            <div class="feature-icon-m"><i class="fa-solid fa-map-location-dot"></i></div>
            <div class="feature-title-m">Local Expertise</div>
            <div class="feature-desc-m">Guides and insights powered by the local community.</div>
          </div>
        </div>
      </section>

      <!-- REVIEWS -->
      <section class="city-section">
        <h2 class="section-title">Community Voice</h2>
        <div class="city-scroll-x" style="margin-top:16px;">
          ${reviews.map(rev => `
            <div class="review-card-m">
              <div class="review-stars-m">${'★'.repeat(rev.rating)}</div>
              <p class="review-text-m">"${rev.text}"</p>
              <div class="review-user-m">
                <img src="https://i.pravatar.cc/100?u=${rev.name}" class="review-avatar-m">
                <div class="review-name-m">${rev.name}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- FAQ -->
      <section class="city-section city-section-alt">
        <h2 class="section-title">Common Questions</h2>
        <div style="margin-top:16px;">
          ${faqs.map(f => `
            <div style="display:flex; gap:16px; padding:20px; background:#fff; border-radius:16px; border:1px solid #f1f5f9; margin-bottom:12px;">
              <div style="width:40px; height:40px; border-radius:50%; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:#64748b; flex-shrink:0;">
                <i class="fa-solid fa-question" style="font-size:0.9rem;"></i>
              </div>
              <div>
                <div style="font-size:0.9rem; font-weight:800; color:#1e293b; margin-bottom:4px;">${f.q}</div>
                <div style="font-size:0.8rem; color:#64748b; line-height:1.5;">${f.a}</div>
              </div>
            </div>
          `).join('')}
        </div>
      </section>

      <!-- NEARBY CITIES -->
      <section class="city-section">
        <h2 class="section-title">Explore Nearby</h2>
        <div style="margin-top:16px;">
          ${_renderNearbyCities(city)}
        </div>
      </section>

    </div>
  `;

  // Wire Events
  _wireEvents(container, { city, navigate });
}

function _renderNearbyCities(currentCity) {
  const allCities = db.cities.findAll();
  const nearby = allCities
    .filter(c => c.city_id !== currentCity.city_id)
    .map(c => ({ ...c, distance: calculateDistance(currentCity.latitude, currentCity.longitude, c.latitude, c.longitude) }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, 4);

  return nearby.map(c => `
    <div class="nearby-city-card" data-slug="${c.slug}">
      <img src="${getAssetUrl(c.hero_image) || FALLBACK_CITY_IMG}" class="nearby-img-m">
      <div style="flex:1;">
        <div class="nearby-name-m">${c.name}</div>
        <div class="nearby-meta-m">$${c.avg_rent}/mo • ${db.listings.find(l => l.city === c.city_id && l.status === 'active').length} listings</div>
      </div>
      <i class="fa-solid fa-chevron-right" style="color:#cbd5e1; font-size:0.8rem;"></i>
    </div>
  `).join('');
}

function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 3958.8;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function _wireEvents(container, { city, navigate }) {
  // Search
  container.querySelector('#city-search-trigger')?.addEventListener('click', () => {
    navigate('search', { city: city.slug });
  });

  // View All
  container.querySelector('#view-all-rooms')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('search', { city: city.slug, type: 'room' });
  });

  container.querySelector('#view-all-roommates')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('search', { city: city.slug, type: 'roommate_wanted' });
  });

  // Cards
  const roomsScroll = container.querySelector('#city-rooms-scroll');
  if (roomsScroll) attachMobileCardEvents(roomsScroll, (id) => { navigate('listing', { id }); });

  container.querySelectorAll('.nh-card-m').forEach(el => {
    el.addEventListener('click', () => {
      navigate('search', { city: city.slug, neighborhood: el.dataset.id });
    });
  });

  container.querySelectorAll('.rm-card-m').forEach(el => {
    el.addEventListener('click', () => {
      navigate('listing', { id: el.dataset.id });
    });
  });

  container.querySelectorAll('.nearby-city-card').forEach(el => {
    el.addEventListener('click', () => {
      navigate('city', { slug: el.dataset.slug });
    });
  });
}

function _skeletonHTML() {
  return `
    <div style="padding: 20px; animation: skeleton-pulse 1.5s infinite ease-in-out;">
      <div style="height: 200px; background: #f1f5f9; border-radius: 20px; margin-bottom: 20px;"></div>
      <div style="height: 30px; width: 60%; background: #f1f5f9; border-radius: 8px; margin-bottom: 12px;"></div>
      <div style="height: 15px; width: 40%; background: #f1f5f9; border-radius: 8px; margin-bottom: 24px;"></div>
      <div style="display: flex; gap: 12px; overflow: hidden;">
        <div style="height: 150px; width: 120px; background: #f1f5f9; border-radius: 12px; flex-shrink: 0;"></div>
        <div style="height: 150px; width: 120px; background: #f1f5f9; border-radius: 12px; flex-shrink: 0;"></div>
        <div style="height: 150px; width: 120px; background: #f1f5f9; border-radius: 12px; flex-shrink: 0;"></div>
      </div>
    </div>
    <style>
      @keyframes skeleton-pulse { 0%, 100% { opacity: 0.6; } 50% { opacity: 0.3; } }
    </style>
  `;
}

function _renderNotFound(container) {
  container.innerHTML = `
    <div style="padding: 40px 20px; text-align: center;">
      <div style="font-size: 3rem; margin-bottom: 20px;">🏙️</div>
      <h2 style="font-size: 1.5rem; font-weight: 900; color: #1e293b; margin-bottom: 8px;">City not found</h2>
      <p style="color: #64748b; font-size: 0.9rem; margin-bottom: 24px;">The city you're looking for doesn't exist in our database yet.</p>
      <button class="mobile-btn mobile-btn-accent" id="city-back-btn">Go Back</button>
    </div>
  `;
  container.querySelector('#city-back-btn')?.addEventListener('click', async () => {
    const { goBack } = await getMobile();
    goBack();
  });
}

export default { init };
