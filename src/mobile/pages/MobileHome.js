/**
 * src/mobile/pages/MobileHome.js
 *
 * Home feed — mirrors website's functional sections (Cities, FB Groups, How It Works, Testimonials, FAQ).
 */

import { db, initDB, getLiveListingCount } from '../../services/db.js';
import { getCurrentUser } from '../../services/auth.js';
import { renderMobileCard, attachMobileCardEvents } from '../components/MobileCard.js';
import { getAssetUrl } from '../../services/assets.js';

async function getMobile() { return await import('../mobile-main.js'); }

const PAGE_SIZE = 10;

export async function init(container) {
  container.innerHTML = _skeletonHTML();

  await initDB().catch(() => { });

  let allListings = db.listings?.findAll?.().filter(l => l.is_active !== false) || [];
  const cities = db.cities.findAll().filter(c => c.is_active !== false);

  const popularCities = (db.cities?.findAll?.() || [])
    .filter(c => c.is_active && c.show_in_popular !== false)
    .slice(0, 6);

  const fbGroups = (db.fb_cities?.findAll?.() || [])
    .filter(g => g.is_popular !== false)
    .sort((a, b) => (a.priority || 0) - (b.priority || 0))
    .slice(0, 6);

  let selectedCity = 'all';
  let selectedType = 'all';
  let pageIndex = 0;
  let filteredList = [...allListings];

  const render = () => {
    container.innerHTML = `
      <style>
        @keyframes spin { 
          from { transform: rotate(0deg); } 
          to { transform: rotate(360deg); } 
        }
        .refreshing i { 
          animation: spin 0.8s linear infinite; 
        }
      </style>
      <div class="mobile-page-content">
        <div style="padding-bottom:1px;">

        <!-- Sticky search bar -->
        <div style="position:sticky;top:0;z-index:50;background:rgba(248,250,252,0.95);backdrop-filter:blur(12px);padding:12px 16px 8px;border-bottom:1px solid #e2e8f0;">
          <button id="home-search-btn" style="width:100%;height:48px;display:flex;align-items:center;gap:12px;background:#fff;border:1.5px solid #e2e8f0;border-radius:14px;padding:0 16px;cursor:pointer;text-align:left;box-shadow:0 1px 4px rgba(0,0,0,0.06);">
            <i class="fa-solid fa-magnifying-glass" style="color:#94a3b8;font-size:0.9rem;"></i>
            <span style="color:#94a3b8;font-size:0.9rem;font-weight:500;flex:1;">Search by city, area…</span>
          </button>
          <div class="mobile-scroll-x" style="margin-top:12px; padding-bottom:8px; padding-right:20px;">
            <div style="display:flex; gap:8px; width:max-content; padding-left:16px;">
              ${['all', 'room', 'apartment', 'sublet', 'roommate_wanted', 'studio'].map(type => `
                <div class="ms-chip ${selectedType === type ? 'active' : ''} type-chip" data-type="${type}" style="font-size:0.8rem; height:38px;">
                  ${type === 'all' ? 'All' : type.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- LISTINGS FEED -->
        <div style="padding:24px 0 12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;padding:0 16px;">
            <div style="font-size:1.2rem;font-weight:900;color:var(--text-primary);letter-spacing:-0.01em;">Newest Listings</div>
            <div style="display:flex;align-items:center;gap:12px;">
              <button id="see-all-listings" style="background:none;border:none;color:var(--mobile-accent);font-size:0.8rem;font-weight:700;cursor:pointer;">See all</button>
              <button id="home-refresh" style="width:36px;height:36px;border-radius:10px;background:#f1f5f9;border:none;display:flex;align-items:center;justify-content:center;color:var(--mobile-accent);cursor:pointer;transition:transform 0.2s;">
                <i class="fa-solid fa-arrows-rotate" style="font-size:0.9rem;"></i>
              </button>
            </div>
          </div>
          <style>
            .listings-slider {
              display: flex;
              gap: 16px;
              overflow-x: auto;
              -webkit-overflow-scrolling: touch;
              touch-action: pan-x pan-y;
              overscroll-behavior-x: contain;
              scroll-snap-type: x mandatory;
              scrollbar-width: none; /* Firefox */
              padding: 0 16px 20px 16px; /* Space for box-shadow */
            }
            .listings-slider::-webkit-scrollbar {
              display: none; /* Chrome/Safari */
            }
            .listings-slider .mobile-card {
              width: 85vw; /* Show partial next card */
              max-width: 320px;
              scroll-snap-align: center;
              margin-bottom: 0 !important; /* Override default vertical margin */
            }
            .empty-state {
              padding: 32px 16px;
              text-align: center;
              color: #64748b;
              font-size: 0.9rem;
              background: #f8fafc;
              border-radius: 16px;
              margin: 0 16px;
              width: calc(100% - 32px);
            }
          </style>
          <div id="home-feed-container" style="position: relative;">
            <div id="home-feed" class="listings-slider">
              ${_renderCards(filteredList)}
            </div>
          </div>
        </div>

        <!-- POST CTA CARD -->
        <div style="padding:20px 16px 0;">
          <div id="home-post-cta" style="background:linear-gradient(135deg, #1e293b 0%, #334155 100%); border-radius:16px; padding:20px; color:#fff; position:relative; overflow:hidden; cursor:pointer;">
            <div style="position:relative; z-index:2;">
              <div style="font-size:1.1rem; font-weight:900; margin-bottom:4px;">Have a spare room?</div>
              <p style="font-size:0.8rem; opacity:0.8; margin-bottom:12px; max-width:180px; line-height:1.4;">List it for free and find your perfect roommate in minutes.</p>
              <div style="display:inline-flex; align-items:center; gap:6px; background:#fff; color:#1e293b; padding:6px 14px; border-radius:10px; font-size:0.75rem; font-weight:800;">Post Listing <span>→</span></div>
            </div>
            <div style="position:absolute; right:-10px; bottom:-10px; opacity:0.1; transform:rotate(-15deg); color:#fff;">
              <svg width="100" height="100" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
            </div>
          </div>
        </div>

        <!-- POPULAR CITIES -->
        <div style="padding:24px 16px 10px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;">
            <div style="font-size:1.1rem;font-weight:900;color:var(--text-primary);">Popular Cities</div>
            <button id="see-all-cities" style="background:none;border:none;color:var(--mobile-accent);font-size:0.8rem;font-weight:700;cursor:pointer;">See all</button>
          </div>
          <div class="mobile-scroll-x" style="padding-bottom:8px;">
            <div style="display:flex;gap:12px;width:max-content;">
              ${popularCities.map(c => `
                <div class="city-chip-card" data-slug="${c.slug}" style="width:140px;flex-shrink:0;cursor:pointer;">
                  <div style="height:100px;border-radius:14px;background:url('${getAssetUrl(c.hero_image) || 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80&w=400'}') center/cover;position:relative;overflow:hidden;">
                    <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.6) 0%, transparent 60%);"></div>
                    <div style="position:absolute;bottom:8px;left:10px;right:10px;color:#fff;font-weight:800;font-size:0.85rem;line-height:1.2;">${c.name}</div>
                  </div>
                  <div style="margin-top:6px;font-size:0.7rem;color:#94a3b8;font-weight:600;">${getLiveListingCount(c.city_id)} listings</div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- POPULAR FB GROUPS -->
        <div style="padding:16px 16px 24px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
            <div style="font-size:1.2rem;font-weight:900;color:var(--text-primary);letter-spacing:-0.01em;">Popular FB Groups</div>
            <button id="see-all-fb" style="background:none;border:none;color:var(--mobile-accent);font-size:0.8rem;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:4px;">
              Explore all groups <i class="fa-solid fa-arrow-right" style="font-size:0.7rem;"></i>
            </button>
          </div>
          <p style="font-size:0.8rem;color:#64748b;margin-bottom:16px;">Helping tenants & landlords connect for hassle-free renting</p>
          
          <div class="mobile-scroll-x" style="padding-bottom:12px; margin: 0 -16px; padding-left: 16px;">
            <div style="display:flex;gap:12px;width:max-content;padding-right:16px;">
              ${fbGroups.map(g => {
                const memberLabel = g.total_members >= 1000000
                  ? (g.total_members / 1000000).toFixed(1) + 'M'
                  : g.total_members >= 1000
                    ? Math.round(g.total_members / 1000) + 'K'
                    : (g.total_members || 0).toString();

                return `
                <div class="fb-group-card" data-fb-id="${g.fb_city_id}" style="width:220px;flex-shrink:0;cursor:pointer;background:#fff;border:1px solid #f1f5f9;border-radius:18px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.04);">
                  <div style="height:120px;background:url('${getAssetUrl(g.city_image) || 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=400'}') center/cover;position:relative;">
                    <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 60%);"></div>
                    <div style="position:absolute;top:10px;right:10px;width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;color:#000;font-size:0.8rem;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                      <i class="fab fa-facebook-f"></i>
                    </div>
                  </div>
                  <div style="padding:12px;">
                    <div style="font-size:0.85rem;font-weight:800;color:var(--text-primary);margin-bottom:4px;display:-webkit-box;-webkit-line-clamp:1;-webkit-box-orient:vertical;overflow:hidden;">${g.fb_group_name || 'Facebook Group'}</div>
                    <div style="display:flex;align-items:center;gap:4px;font-size:0.7rem;color:#64748b;font-weight:600;margin-bottom:8px;">
                      <i class="fa-solid fa-location-dot" style="font-size:0.6rem;"></i>
                      ${g.city_name || 'Unknown City'}
                    </div>
                    <div style="display:inline-flex;align-items:center;gap:6px;background:#F1F5F9;color:#475569;font-size:0.65rem;font-weight:700;padding:4px 10px;border-radius:100px;width:fit-content;">
                      <i class="fa-solid fa-users" style="color:var(--mobile-accent);font-size:0.6rem;"></i>
                      ${memberLabel}+ Members
                    </div>
                  </div>
                </div>
              `}).join('')}
            </div>
          </div>
        </div>

        <!-- HOW IT WORKS -->
        <div style="padding:32px 16px; background:#f8fafc; border-top:1px solid #f1f5f9; border-bottom:1px solid #f1f5f9;">
          <h2 style="font-size:1.1rem; font-weight:900; text-align:center; margin-bottom:24px;">How It Works</h2>
          <div style="display:flex; flex-direction:column; gap:16px;">
            ${[
              { step: 1, t: 'Search Listings', d: 'Browse verified rooms and roommates in your city.', i: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>' },
              { step: 2, t: 'Connect & Chat', d: 'Message potential roommates securely in the app.', i: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>' },
              { step: 3, t: 'Move In!', d: 'Find your perfect group and settle into your new home.', i: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>' }
            ].map(s => `
              <div style="display:flex; gap:16px; align-items:center; background:#fff; padding:16px; border-radius:14px; border:1px solid #f1f5f9;">
                <div style="width:36px; height:36px; border-radius:50%; background:var(--mobile-accent-soft); color:var(--mobile-accent); display:flex; align-items:center; justify-content:center; font-size:0.9rem; font-weight:900; flex-shrink:0;">${s.step}</div>
                <div>
                  <div style="font-size:0.85rem; font-weight:800; color:#1e293b;">${s.t}</div>
                  <div style="font-size:0.7rem; color:#64748b;">${s.d}</div>
                </div>
                <div style="font-size:1.1rem; margin-left:auto;">${s.i}</div>
              </div>
            `).join('')}
          </div>
        </div>


        <!-- TESTIMONIALS -->
        <div style="padding:32px 16px; background:linear-gradient(to bottom, #fff, #f8fafc);">
          <h2 style="font-size:1.1rem; font-weight:900; text-align:center; margin-bottom:24px;">What Users Say</h2>
          <div class="mobile-scroll-x" style="padding-bottom:10px;">
            <div style="display:flex; gap:16px; width:max-content;">
              ${[
                { n: 'Sarah K.', c: 'Austin, TX', q: 'Found my perfect roommate within a week!', r: 5 },
                { n: 'Marcus T.', c: 'Berlin', q: 'Moving to a new city was scary, but this made it easy.', r: 5 },
                { n: 'Emily R.', c: 'San Francisco', q: 'No scams, no fake posts. Just real people.', r: 5 }
              ].map(t => `
                <div style="width:240px; padding:20px; border-radius:16px; background:#fff; border:1px solid #f1f5f9; box-shadow:0 4px 12px rgba(0,0,0,0.03);">
                  <div style="color:#fbbf24; font-size:0.8rem; margin-bottom:12px;">${'★'.repeat(t.r)}</div>
                  <p style="font-size:0.8rem; color:#475569; line-height:1.5; font-style:italic; margin-bottom:12px;">"${t.q}"</p>
                  <div style="display:flex; align-items:center; gap:8px;">
                    <img src="${t.a || `https://images.unsplash.com/photo-${t.n === 'Sarah K.' ? '1494790108377-be9c29b29330' : t.n === 'Marcus T.' ? '1507003211169-0a1dd7228f2d' : '1534528741775-53994a69daeb'}?auto=format&fit=crop&q=80&w=100`}" style="width:28px;height:28px;border-radius:50%;object-fit:cover;">
                    <div style="font-size:0.75rem; font-weight:800;">${t.n}</div>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- FAQ SECTION -->
        <div style="padding:32px 16px;">
          <h2 style="font-size:1.1rem; font-weight:900; margin-bottom:16px;">Got Questions?</h2>
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${[
              'Is RoommateGroups free to use?',
              'How does ID verification work?',
              'Can I list my room or entire apartment?'
            ].map(q => `
              <div class="home-faq-trigger" style="background:#fff; padding:16px; border-radius:12px; border:1px solid #f1f5f9; font-size:0.85rem; font-weight:700; color:#1e293b; display:flex; justify-content:space-between; align-items:center; cursor:pointer;">
                ${q} <span style="color:#94a3b8; font-size:1.1rem;">›</span>
              </div>
            `).join('')}
          </div>
          <button id="home-view-all-faq" class="mobile-btn mobile-btn-outline" style="margin-top:16px; font-weight:800; border-radius:12px; height:52px;">View All FAQs</button>
        </div>

      </div>
    </div>
    `;

    _wireEvents(container, {
      cities, allListings,
      setSelectedType: (v) => {
        selectedType = v;
        const feed = container.querySelector('#home-feed');
        if (feed) {
          feed.innerHTML = Array(3).fill(0).map(() => `
            <div style="width:85vw; max-width:320px; height:300px; background:#f8fafc; border-radius:28px; border:1px solid #e2e8f0; flex-shrink:0; animation: skeleton-pulse 1.5s infinite ease-in-out;"></div>
          `).join('');
        }
        setTimeout(() => {
          filteredList = _filterListings(allListings, selectedCity, selectedType);
          render();
        }, 300);
      },
      getFiltered: () => filteredList,
      rerender: render,
      updateListings: () => {
        allListings = db.listings?.findAll?.().filter(l => l.is_active !== false) || [];
        filteredList = _filterListings(allListings, selectedCity, selectedType);
      }
    });
  };

  const { updateHeader, navigate } = await getMobile();
  updateHeader({
    title: 'LOGO',
    showBack: false,
    leftAction: {
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>',
      label: 'Profile',
      onClick: () => { navigate('settings'); },
    },
    rightAction: {
      icon: '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>',
      label: 'Notifications',
      onClick: () => { navigate('notifications'); },
    }
  });

  filteredList = _filterListings(allListings, selectedCity, selectedType);
  render();
}

export const renderMobileHome = init;

function _filterListings(all, cityId, type) {
  let filtered = [...all];
  if (cityId && cityId !== 'all') filtered = filtered.filter(l => l.city === cityId || l.city_id === cityId);

  if (type && type !== 'all') {
    const q = type.toLowerCase();
    filtered = filtered.filter(l => {
      const val = (l.room_type || l.category || l.property_type || l.type || '').toLowerCase();
      // Special case for 'Roommate Wanted' vs 'Roommate'
      if (q === 'roommate wanted') return val.includes('roommate_wanted') || val.includes('room_wanted');
      if (q === 'room') return val.includes('room') && !val.includes('roommate');
      return val.includes(q);
    });
  }

  // Order by created_at DESC (newest first) and limit to 10
  return filtered
    .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
    .slice(0, 10);
}

function _renderCards(list) {
  if (!list || list.length === 0) {
    return `<div class="empty-state">
      <div style="font-size:2rem; margin-bottom:8px;">😕</div>
      <div style="font-weight:700; color:#1e293b; margin-bottom:4px;">No listings found</div>
      <p>Try adjusting your search or check back later.</p>
    </div>`;
  }
  return list.map(l => renderMobileCard(l)).join('');
}

async function _wireEvents(container, ctx) {
  const { rerender, setSelectedType, getFiltered } = ctx;
  const { navigate } = await getMobile();

  container.querySelector('#home-search-btn')?.addEventListener('click', () => { navigate('search'); });
  container.querySelector('#home-post-cta')?.addEventListener('click', () => { navigate('post'); });
  container.querySelectorAll('.type-chip').forEach(c => c.addEventListener('click', () => setSelectedType(c.dataset.type)));
  container.querySelector('#home-refresh')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    btn.classList.add('refreshing');

    const feed = container.querySelector('#home-feed');
    if (feed) {
      feed.innerHTML = Array(3).fill(0).map(() => `
        <div style="width:85vw; max-width:320px; height:300px; background:#f8fafc; border-radius:28px; border:1px solid #e2e8f0; flex-shrink:0; animation: skeleton-pulse 1.5s infinite ease-in-out;"></div>
      `).join('');
    }

    await initDB().catch(() => { });
    ctx.updateListings();
    setTimeout(() => {
      rerender();
    }, 600);
  });
  container.querySelectorAll('.city-chip-card').forEach(el => el.addEventListener('click', () => { navigate('search', { city: el.dataset.slug }); }));
  container.querySelector('#see-all-cities')?.addEventListener('click', () => { navigate('search'); });
  container.querySelector('#see-all-listings')?.addEventListener('click', () => { navigate('search'); });
  container.querySelector('#see-all-fb')?.addEventListener('click', () => { navigate('fbGroups'); });
  container.querySelectorAll('.fb-group-card').forEach(el => el.addEventListener('click', () => { navigate('fbGroupDetail', { id: el.dataset.fbId }); }));
  container.querySelectorAll('.home-faq-trigger, #home-view-all-faq').forEach(el => el.addEventListener('click', () => { navigate('faq'); }));

  const feed = container.querySelector('#home-feed');
  if (feed) attachMobileCardEvents(feed, (id) => { navigate('listing', { id }); });
}

function _skeletonHTML() {
  return `
    <div style="height:80vh; display:flex; flex-direction:column; align-items:center; justify-content:center; color:#94a3b8; font-family:'Inter', sans-serif;">
      <div style="width:80px; height:80px; margin-bottom:16px; opacity:0.5; animation: skeleton-pulse 1.5s infinite ease-in-out;">
        <img src="/logo.svg" style="width:100%; height:100%; filter: grayscale(100%);" />
      </div>
      <div style="font-size:0.9rem; font-weight:600; opacity:0.6;">Loading your feed...</div>
      <style>
        @keyframes skeleton-pulse {
          0%, 100% { transform: scale(1); opacity: 0.4; }
          50% { transform: scale(0.95); opacity: 0.2; }
        }
      </style>
    </div>
  `;
}
