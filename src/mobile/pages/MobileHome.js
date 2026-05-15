/**
 * src/mobile/pages/MobileHome.js
 *
 * Home feed — mirrors website's functional sections (Cities, FB Groups, How It Works, Testimonials, FAQ).
 */

import { db, initDB, getLiveListingCount } from '../../services/db.js';
import { getCurrentUser } from '../../services/auth.js';
import { renderMobileCard, attachMobileCardEvents } from '../components/MobileCard.js';
import { getAssetUrl, getAvatarUrl } from '../../services/assets.js';

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
        .refreshing i, .ptr-spin { 
          animation: spin 0.8s linear infinite !important; 
        }
      </style>
      <div class="mobile-page-content" style="position:relative;">
        <div id="ptr-indicator" style="height: 0; overflow: hidden; display: flex; align-items: center; justify-content: center; transition: height 0.2s ease, opacity 0.2s ease; opacity: 0;">
          <div style="width: 36px; height: 36px; border-radius: 50%; background: #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); display: flex; align-items: center; justify-content: center; color: #1a1a1a;">
            <i class="fa-solid fa-arrows-rotate ptr-icon" style="transition: transform 0.1s ease; font-size: 0.9rem;"></i>
          </div>
        </div>
        <div style="padding-bottom:1px;">

        <!-- Sticky search bar -->
        <div id="home-sticky-search" style="position:sticky;top:0;z-index:50;background:rgba(248,250,252,0.96);backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);padding:12px 16px 10px;border-bottom:1px solid rgba(226,232,240,0.8);transition:transform 0.3s ease, opacity 0.3s ease, visibility 0.3s ease;">
          <button id="home-search-btn" style="width:100%;height:46px;display:flex;align-items:center;gap:10px;background:#fff;border:1.5px solid #e2e8f0;border-radius:12px;padding:0 14px;cursor:pointer;text-align:left;box-shadow:0 2px 8px rgba(0,0,0,0.05);">
            <i class="fa-solid fa-magnifying-glass" style="color:#94a3b8;font-size:0.85rem;"></i>
            <span style="color:#94a3b8;font-size:0.88rem;font-weight:500;flex:1;">Search by city, area…</span>
            <div style="background:#f1f5f9;border-radius:8px;padding:4px 10px;font-size:0.7rem;font-weight:700;color:#64748b;">Filter</div>
          </button>
          <div style="display:flex;gap:8px;margin-top:10px;overflow-x:auto;-webkit-overflow-scrolling:touch;scrollbar-width:none;padding-bottom:2px;">
            ${['all', 'room', 'apartment', 'sublet', 'roommate_wanted', 'studio'].map(type => `
              <button class="type-chip" data-type="${type}" style="
                flex-shrink:0;
                height:34px;
                padding:0 14px;
                border-radius:100px;
                font-size:0.78rem;
                font-weight:700;
                cursor:pointer;
                border:1.5px solid ${selectedType === type ? '#1a1a1a' : '#e2e8f0'};
                background:${selectedType === type ? '#1a1a1a' : '#fff'};
                color:${selectedType === type ? '#fff' : '#475569'};
                transition:all 0.2s ease;
                white-space:nowrap;
              ">${type === 'all' ? 'All' : type.replace('_', ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}</button>
            `).join('')}
          </div>
        </div>

        <!-- LISTINGS FEED -->
        <div style="padding:20px 0 12px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;padding:0 16px;">
            <div>
              <div style="font-size:1.2rem;font-weight:900;color:#0f172a;letter-spacing:-0.02em;">Newest Listings</div>
              <div style="font-size:0.72rem;color:#94a3b8;font-weight:600;margin-top:2px;">${filteredList.length} listing${filteredList.length !== 1 ? 's' : ''} available</div>
            </div>
            <div style="display:flex;align-items:center;gap:8px;">
              <button id="see-all-listings" style="background:#f1f5f9;border:none;color:#1a1a1a;font-size:0.78rem;font-weight:800;cursor:pointer;padding:6px 12px;border-radius:8px;">See all</button>
              <button id="home-refresh" style="width:34px;height:34px;border-radius:9px;background:#f1f5f9;border:none;display:flex;align-items:center;justify-content:center;color:#1a1a1a;cursor:pointer;">
                <i class="fa-solid fa-arrows-rotate" style="font-size:0.85rem;"></i>
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
              width: 220px;
              scroll-snap-align: start;
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
        <div style="padding:4px 16px 20px;">
          <div id="home-post-cta" style="background:linear-gradient(135deg, #0f172a 0%, #1e3a5f 100%); border-radius:20px; padding:22px; color:#fff; position:relative; overflow:hidden; cursor:pointer; box-shadow:0 8px 24px rgba(15,23,42,0.2);">
            <div style="position:relative; z-index:2;">
              <div style="font-size:0.65rem; font-weight:800; letter-spacing:0.1em; text-transform:uppercase; color:rgba(255,255,255,0.5); margin-bottom:6px;">For Landlords & Hosts</div>
              <div style="font-size:1.15rem; font-weight:900; margin-bottom:6px; letter-spacing:-0.01em;">Have a spare room? 🏠</div>
              <p style="font-size:0.8rem; opacity:0.7; margin-bottom:14px; max-width:200px; line-height:1.5;">List it for free and find your perfect roommate in minutes.</p>
              <div style="display:inline-flex; align-items:center; gap:6px; background:#fff; color:#0f172a; padding:8px 16px; border-radius:10px; font-size:0.78rem; font-weight:800;">Post a Listing <i class="fa-solid fa-arrow-right" style="font-size:0.7rem;"></i></div>
            </div>
            <div style="position:absolute; right:-20px; bottom:-20px; opacity:0.07;">
              <svg width="130" height="130" viewBox="0 0 24 24" fill="white" stroke="none"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
            </div>
          </div>
        </div>

        <!-- POPULAR CITIES (HORIZONTAL) -->
        <div style="padding:24px 16px 20px;">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;">
            <div style="font-size:1.25rem;font-weight:900;color:#0f172a;letter-spacing:-0.02em;">Popular Cities</div>
            <button id="see-all-cities" style="background:none;border:none;color:#7c3aed;font-size:0.85rem;font-weight:800;cursor:pointer;">See all</button>
          </div>
          
          <div class="mobile-scroll-x" style="margin: 0 -16px; padding: 0 16px 12px;">
            <div style="display:flex; gap:16px; width:max-content;">
              ${popularCities.map(c => {
                const country = db.countries ? db.countries.findById(c.country) : null;
                const subtitle = `${c.state_province ? c.state_province + ', ' : ''}${country ? country.name : ''}`;
                return `
                <div class="city-chip-card" data-slug="${c.slug}" style="width:220px; flex-shrink:0; background:#fff; border-radius:18px; overflow:hidden; box-shadow:0 10px 25px rgba(0,0,0,0.05); border:1px solid #f1f5f9; cursor:pointer;">
                  <div style="height:120px; background:url('${getAssetUrl(c.hero_image) || 'https://images.unsplash.com/photo-1480714378408-67cf0d13bc1b?auto=format&fit=crop&q=80&w=400'}') center/cover;"></div>
                  <div style="padding:12px 14px 14px;">
                    <div style="font-size:0.95rem; font-weight:900; color:#1e293b; margin-bottom:4px; letter-spacing:-0.01em; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${c.name}</div>
                    <div style="font-size:0.75rem; color:#94a3b8; font-weight:600; margin-bottom:12px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${subtitle}</div>
                    <div style="display:flex; flex-direction:column; gap:6px;">
                      <div style="background:#f1f5f9; color:#475569; padding:4px 10px; border-radius:100px; font-size:0.65rem; font-weight:800; display:flex; align-items:center; gap:6px; width:fit-content;">
                        <i class="fa-solid fa-house" style="font-size:0.6rem; color:#94a3b8;"></i>
                        ${getLiveListingCount(c.city_id)} listings
                      </div>
                      <div style="background:#f1f5f9; color:#475569; padding:4px 10px; border-radius:100px; font-size:0.65rem; font-weight:800; display:flex; align-items:center; gap:6px; width:fit-content;">
                        <i class="fa-solid fa-tag" style="font-size:0.6rem; color:#94a3b8;"></i>
                        ~$${(c.avg_rent || 1000).toLocaleString()}/mo
                      </div>
                    </div>
                  </div>
                </div>
              `}).join('')}
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
        
        <!-- FEATURE HIGHLIGHTS -->
        <div style="background: #fff;">

          <!-- Safe & Trusted Community -->
          <div style="padding: 36px 20px 40px;">
            <div style="display: inline-flex; align-items: center; gap: 7px; background: #ede9fe; color: #7c3aed; font-size: 0.62rem; font-weight: 800; padding: 6px 14px; border-radius: 100px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.08em;">
              <i class="fa-solid fa-shield-halved" style="font-size: 0.72rem;"></i>
              Safe &amp; Trusted Community
            </div>
            <h2 style="font-size: 1.65rem; font-weight: 900; color: #0f172a; line-height: 1.18; margin: 0 0 14px; letter-spacing: -0.03em;">Find your perfect roommate with complete peace of mind.</h2>
            <p style="font-size: 0.88rem; color: #64748b; line-height: 1.65; margin: 0 0 24px;">We know finding a roommate can feel overwhelming. That's why every listing and profile on RoommateGroups is carefully moderated to keep you safe from scams and fraud.</p>

            <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 28px;">
              ${
                [
                'All listings manually moderated',
                'Scam-free verified environment',
                'Secure chat via Facebook Messenger',
                'Active in 31+ cities worldwide'
              ].map(item => `
                <div style="display: flex; align-items: center; gap: 12px; font-size: 0.92rem; font-weight: 600; color: #1e293b;">
                  <span style="width:26px;height:26px;border-radius:50%;background:#10b981;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fa-solid fa-check" style="color:#fff;font-size:0.7rem;"></i>
                  </span>
                  ${item}
                </div>
              `).join('')}
            </div>

            <button id="cta-safety" style="background: none; border: none; padding: 0; color: #7c3aed; font-size: 0.95rem; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; margin-bottom: 32px;">
              Learn more about our community <i class="fa-solid fa-arrow-right" style="font-size: 0.78rem;"></i>
            </button>

            <div style="border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.12);">
              <img src="/assets/img/community.png" style="width: 100%; height: auto; display: block; object-fit: cover;" alt="Happy roommates in a shared home">
            </div>
          </div>

          <!-- Listings & Connections -->
          <div style="padding: 36px 20px 40px; border-top: 1px solid #f1f5f9;">
            <div style="display: inline-flex; align-items: center; gap: 7px; background: #ede9fe; color: #7c3aed; font-size: 0.62rem; font-weight: 800; padding: 6px 14px; border-radius: 100px; margin-bottom: 16px; text-transform: uppercase; letter-spacing: 0.08em;">
              <i class="fa-solid fa-list-check" style="font-size: 0.72rem;"></i>
              Listings &amp; Connections
            </div>
            <h2 style="font-size: 1.65rem; font-weight: 900; color: #0f172a; line-height: 1.18; margin: 0 0 14px; letter-spacing: -0.03em;">Connect with 1,500,000+ community members looking for the same thing.</h2>
            <p style="font-size: 0.88rem; color: #64748b; line-height: 1.65; margin: 0 0 24px;">Whether you're a student, a working professional, or a landlord — our platform connects you with genuine, relevant matches fast. No endless scrolling, no wasted time.</p>

            <div style="display: flex; flex-direction: column; gap: 14px; margin-bottom: 28px;">
              ${
                [
                '10,000+ verified members',
                'Students &amp; professionals',
                'Furnished room options',
                'Budget-friendly matches',
                'Landlord-friendly tools',
                'Global city coverage'
              ].map(item => `
                <div style="display: flex; align-items: center; gap: 12px; font-size: 0.92rem; font-weight: 600; color: #1e293b;">
                  <span style="width:26px;height:26px;border-radius:50%;background:#10b981;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                    <i class="fa-solid fa-check" style="color:#fff;font-size:0.7rem;"></i>
                  </span>
                  ${item}
                </div>
              `).join('')}
            </div>

            <button id="cta-listings" style="background: none; border: none; padding: 0; color: #7c3aed; font-size: 0.95rem; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 8px; margin-bottom: 32px;">
              Explore listings <i class="fa-solid fa-arrow-right" style="font-size: 0.78rem;"></i>
            </button>

            <div style="border-radius: 20px; overflow: hidden; box-shadow: 0 16px 40px rgba(0,0,0,0.12);">
              <img src="/assets/img/mockup.png" style="width: 100%; height: auto; display: block; object-fit: cover;" alt="RoommateGroups platform mockup">
            </div>
          </div>
        </div>


        <!-- WHY IT WORKS — Alternating feature cards (matches screenshot design) -->
        <div style="padding: 32px 20px 40px; background: #fff;">
          <h2 style="font-size: 1.55rem; font-weight: 900; color: #0f172a; letter-spacing: -0.02em; margin: 0 0 28px;">Why RoommateGroups works</h2>

          <style>
            .rg-feature-card {
              position: relative;
              border-radius: 22px;
              border: 2px solid #7c3aed;
              overflow: visible;
              margin-bottom: 28px;
            }
            .rg-feature-card-inner {
              border-radius: 20px;
              padding: 24px 20px 24px;
              overflow: hidden;
            }
            .rg-feature-img {
              position: absolute;
              width: 130px;
              height: 130px;
              border-radius: 50%;
              object-fit: cover;
              top: 50%;
              transform: translateY(-50%);
              background: #ede9fe;
              border: 3px solid #fff;
              box-shadow: 0 4px 20px rgba(124,58,237,0.15);
              z-index: 2;
            }
            .rg-feature-img-left {
              left: -30px;
            }
            .rg-feature-img-right {
              right: -30px;
            }
            .rg-feature-text-right {
              margin-left: 116px;
              min-height: 100px;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
            .rg-feature-text-left {
              margin-right: 116px;
              min-height: 100px;
              display: flex;
              flex-direction: column;
              justify-content: center;
            }
          </style>

          <!-- Card 1: Image LEFT, text RIGHT, white bg -->
          <div class="rg-feature-card">
            <img class="rg-feature-img rg-feature-img-left" src="/assets/img/feature_browse.png" alt="Browse Listings">
            <div class="rg-feature-card-inner" style="background: #fff;">
              <div class="rg-feature-text-right">
                <div style="font-size: 1.05rem; font-weight: 900; color: #0f172a; margin-bottom: 8px; line-height: 1.25;">Verified listings only</div>
                <div style="font-size: 0.83rem; color: #64748b; line-height: 1.6;">Every room and roommate listing is manually reviewed before going live on our platform.</div>
              </div>
            </div>
          </div>

          <!-- Card 2: Image RIGHT, text LEFT, lavender bg -->
          <div class="rg-feature-card">
            <img class="rg-feature-img rg-feature-img-right" src="/assets/img/feature_chat.png" alt="Secure Chat">
            <div class="rg-feature-card-inner" style="background: #ede9fe;">
              <div class="rg-feature-text-left">
                <div style="font-size: 1.05rem; font-weight: 900; color: #0f172a; margin-bottom: 8px; line-height: 1.25;">Secure & private chat</div>
                <div style="font-size: 0.83rem; color: #4c1d95; line-height: 1.6;">Message verified roommates safely through our encrypted in-app messaging.</div>
              </div>
            </div>
          </div>

          <!-- Card 3: Image LEFT, text RIGHT, white bg -->
          <div class="rg-feature-card" style="margin-bottom: 0;">
            <img class="rg-feature-img rg-feature-img-left" src="/assets/img/feature_movein.png" alt="Move In">
            <div class="rg-feature-card-inner" style="background: #fff;">
              <div class="rg-feature-text-right">
                <div style="font-size: 1.05rem; font-weight: 900; color: #0f172a; margin-bottom: 8px; line-height: 1.25;">Move in with confidence</div>
                <div style="font-size: 0.83rem; color: #64748b; line-height: 1.6;">Find the right match faster and settle into your new home with complete peace of mind.</div>
              </div>
            </div>
          </div>
        </div>


        <!-- TESTIMONIALS -->
        <div style="padding:32px 16px; background:linear-gradient(to bottom, #fff, #f8fafc);">
          <h2 style="font-size:1.1rem; font-weight:900; text-align:center; margin-bottom:24px;">What Users Say</h2>
          <div class="marquee-container">
            <div class="marquee-track">
              ${(() => {
          const items = [
            { n: 'Sarah K.', c: 'Austin, TX', q: 'Found my perfect roommate within a week!', r: 5 },
            { n: 'Marcus T.', c: 'Berlin', q: 'Moving to a new city was scary, but this made it easy.', r: 5 },
            { n: 'Emily R.', c: 'San Francisco', q: 'No scams, no fake posts. Just real people.', r: 5 }
          ];
          // Duplicate items for seamless loop
          return [...items, ...items].map(t => `
                <div style="width:240px; padding:24px; border-radius:20px; background:#fff; border:1px solid #f1f5f9; box-shadow:0 10px 20px rgba(0,0,0,0.04); flex-shrink:0;">
                  <div style="color:#fbbf24; font-size:0.9rem; margin-bottom:14px;">${'★'.repeat(t.r)}</div>
                  <p style="font-size:0.85rem; color:#475569; line-height:1.6; font-style:italic; margin-bottom:16px; min-height:60px;">"${t.q}"</p>
                  <div style="display:flex; align-items:center; gap:10px;">
                    <img src="${t.a || `https://images.unsplash.com/photo-${t.n === 'Sarah K.' ? '1494790108377-be9c29b29330' : t.n === 'Marcus T.' ? '1507003211169-0a1dd7228f2d' : '1534528741775-53994a69daeb'}?auto=format&fit=crop&q=80&w=100`}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;border:2px solid #fff;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
                    <div>
                      <div style="font-size:0.8rem; font-weight:800; color:#0f172a;">${t.n}</div>
                      <div style="font-size:0.65rem; color:#94a3b8; font-weight:600;">Verified User</div>
                    </div>
                  </div>
                </div>
              `).join('');
        })()}
            </div>
          </div>
        </div>

        <!-- FAQ SECTION -->
        <div style="padding:32px 16px;">
          <h2 style="font-size:1.1rem; font-weight:900; margin-bottom:16px;">Got Questions?</h2>
          <div style="display:flex; flex-direction:column; gap:10px;">
            ${[
        { q: 'Is RoommateGroups free to use?', a: 'Our basic plan is completely free — you can browse listings, create a profile, and contact other members.' },
        { q: 'How does ID verification work?', a: 'Our 4-level verification system starts with email, then phone, then Government ID and Community Verification.' },
        { q: 'Can I list my room or entire apartment?', a: 'Yes! You can list a private room in a shared home, an entire apartment, or a room in a coliving space.' }
      ].map(item => `
              <div style="display:flex; gap:16px; padding:20px; background:#fff; border-radius:16px; border:1px solid #f1f5f9; margin-bottom:12px;">
                <div style="width:40px; height:40px; border-radius:50%; background:#f1f5f9; display:flex; align-items:center; justify-content:center; color:#64748b; flex-shrink:0;">
                  <i class="fa-solid fa-question" style="font-size:0.9rem;"></i>
                </div>
                <div>
                  <div style="font-size:0.9rem; font-weight:800; color:#1e293b; margin-bottom:4px;">${item.q}</div>
                  <div style="font-size:0.8rem; color:#64748b; line-height:1.5;">${item.a}</div>
                </div>
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
  const currentUser = getCurrentUser();
  const avatarSrc = getAvatarUrl(
    currentUser?.profile_photo || currentUser?.avatar || null,
    currentUser?.display_name || currentUser?.first_name || 'U'
  );
  updateHeader({
    title: '',
    showBack: false,
    leftAction: null,
    homeRightActions: {
      bell: {
        onClick: () => { navigate('notifications'); },
      },
      avatar: {
        src: avatarSrc,
        name: currentUser?.display_name || currentUser?.first_name || 'U',
        onClick: () => { navigate('settings'); },
      },
    },
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
  container.querySelectorAll('.city-chip-card').forEach(el => el.addEventListener('click', () => { navigate('city', { slug: el.dataset.slug }); }));
  container.querySelector('#see-all-cities')?.addEventListener('click', () => { navigate('search'); });
  container.querySelector('#see-all-listings')?.addEventListener('click', () => { navigate('search'); });
  container.querySelector('#see-all-fb')?.addEventListener('click', () => { navigate('fbGroups'); });
  container.querySelector('#cta-safety')?.addEventListener('click', () => { navigate('safety'); });
  container.querySelector('#cta-listings')?.addEventListener('click', () => { navigate('search'); });
  container.querySelectorAll('.fb-group-card').forEach(el => el.addEventListener('click', () => { navigate('fbGroupDetail', { id: el.dataset.fbId }); }));
  container.querySelectorAll('.home-faq-trigger, #home-view-all-faq').forEach(el => el.addEventListener('click', () => { navigate('faq'); }));

  const feed = container.querySelector('#home-feed');
  if (feed) attachMobileCardEvents(feed, (id) => { navigate('listing', { id }); });

  // Scroll logic to hide/show search section (once per container)
  if (!container._scrollHandlerAttached) {
    container.addEventListener('scroll', () => {
      const searchBar = container.querySelector('#home-sticky-search');
      if (!searchBar) return;
      
      // Threshold to hide: when scrolled down past the search section (~100-120px)
      // This slides it up under the main header.
      if (container.scrollTop > 100) {
        searchBar.style.transform = 'translateY(-110%)';
        searchBar.style.opacity = '0';
        searchBar.style.visibility = 'hidden';
      } else {
        searchBar.style.transform = 'translateY(0)';
        searchBar.style.opacity = '1';
        searchBar.style.visibility = 'visible';
      }
    }, { passive: true });
    container._scrollHandlerAttached = true;
  }

  // Pull-to-refresh logic
  if (!container._ptrHandlerAttached) {
    let startY = 0;
    let isPulling = false;
    let isRefreshing = false;
    const PTR_THRESHOLD = 60;

    container.addEventListener('touchstart', (e) => {
      if (container.scrollTop <= 0 && !isRefreshing) {
        startY = e.touches[0].clientY;
        isPulling = true;
        const ptr = container.querySelector('#ptr-indicator');
        if (ptr) {
          ptr.style.transition = 'none';
        }
      }
    }, { passive: true });

    container.addEventListener('touchmove', (e) => {
      if (!isPulling || isRefreshing) return;
      const y = e.touches[0].clientY;
      const dy = y - startY;
      
      if (dy > 0 && container.scrollTop <= 0) {
        const ptr = container.querySelector('#ptr-indicator');
        const icon = container.querySelector('.ptr-icon');
        if (ptr) {
          const height = Math.min(dy * 0.5, 90);
          ptr.style.height = height + 'px';
          ptr.style.opacity = Math.min(height / 40, 1).toString();
          if (icon) {
            icon.style.transform = `rotate(${height * 4}deg)`;
          }
        }
      } else {
        isPulling = false;
      }
    }, { passive: true });

    container.addEventListener('touchend', async () => {
      if (!isPulling || isRefreshing) return;
      isPulling = false;
      
      const ptr = container.querySelector('#ptr-indicator');
      const icon = container.querySelector('.ptr-icon');
      
      if (ptr && parseInt(ptr.style.height || '0') >= PTR_THRESHOLD) {
        isRefreshing = true;
        ptr.style.transition = 'height 0.3s ease, opacity 0.3s ease';
        ptr.style.height = '50px';
        ptr.style.opacity = '1';
        
        if (icon) {
          icon.style.transition = 'none';
          icon.classList.add('ptr-spin');
        }
        
        const feed = container.querySelector('#home-feed');
        if (feed) {
          feed.innerHTML = Array(3).fill(0).map(() => `
            <div style="width:85vw; max-width:320px; height:300px; background:#f8fafc; border-radius:28px; border:1px solid #e2e8f0; flex-shrink:0; animation: skeleton-pulse 1.5s infinite ease-in-out;"></div>
          `).join('');
        }

        await initDB().catch(() => { });
        ctx.updateListings();
        
        setTimeout(() => {
          ctx.rerender(); 
          isRefreshing = false;
        }, 600);
      } else if (ptr) {
        ptr.style.transition = 'height 0.3s ease, opacity 0.3s ease';
        ptr.style.height = '0px';
        ptr.style.opacity = '0';
      }
    });

    container._ptrHandlerAttached = true;
  }
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
