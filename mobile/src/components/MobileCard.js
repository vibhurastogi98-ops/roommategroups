/**
 * src/mobile/components/MobileCard.js
 *
 * Standardised listing card for mobile feed.
 * renderMobileCard(listing) → HTML string (template literal)
 * attachMobileCardEvents(container, onCardClick) → wires all events
 */

import { db } from '../../../web/src/services/db.js';
import { getCurrentUser, getVerificationBadge } from '../../../web/src/services/auth.js';
import { getAssetUrl, getAvatarUrl } from '../../../web/src/services/assets.js';

// ── Helpers ───────────────────────────────────────────────────

function _timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return '1 day ago';
  if (days < 30) return `${days} days ago`;
  const months = Math.floor(days / 30);
  return months === 1 ? '1 month ago' : `${months} months ago`;
}

function _getCityName(cityId) {
  if (!cityId) return '';
  const city = db.cities.findById(cityId);
  if (city) return city.name;
  // Fallback for raw city strings
  return cityId.replace('city_', '').replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function _getPropertyType(listing) {
  const type = listing.room_type || listing.category || listing.property_type || listing.type;
  if (!type) return 'Room'; // Default fallback

  // Clean up and format
  return type.replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function _genderColor(pref) {
  if (!pref || pref === 'Any') return 'background:#f1f5f9;color:#475569;';
  if (pref === 'Female') return 'background:#fafafa;color:#000;border:1px solid #e2e8f0;';
  if (pref === 'Male') return 'background:#1a1a1a;color:#fff;';
  return 'background:#000;color:#fff;';
}

function _typeColor(type) {
  const t = (type || '').toLowerCase();
  if (t.includes('pg')) return 'background:#000;color:#fff;';
  if (t.includes('flat') || t.includes('apartment')) return 'background:#334155;color:#fff;';
  if (t.includes('room')) return 'background:#64748b;color:#fff;';
  if (t.includes('studio')) return 'background:#94a3b8;color:#000;';
  return 'background:#f1f5f9;color:#000;';
}

function _isSaved(listingId) {
  const user = getCurrentUser();
  if (!user) return false;
  const saved = user.saved_listings || [];
  return saved.includes(listingId);
}

// ── renderMobileCard ──────────────────────────────────────────
/**
 * @param {object} listing  - listing record from db
 * @returns {string}        - HTML string to inject
 */
export function renderMobileCard(listing) {
  const id = listing.listing_id || listing.id;
  const title = listing.title || 'Untitled';
  const area = listing.area || '';
  const city = _getCityName(listing.city || listing.city_id);
  const rent = listing.rent || listing.price;
  const type = _getPropertyType(listing);
  const is_featured = listing.is_featured === true || listing.is_featured === 1;
  const category = (listing.category || '').toLowerCase();
  const isRoommate = category.includes('roommate_wanted') || category.includes('room_wanted');

  const price = rent !== undefined && rent !== null && rent !== '' ? `$${Number(rent).toLocaleString('en-US')}/mo` : null;
  const location = [area, city].filter(Boolean).join(', ') || 'Location TBC';

  // Poster info
  const user_id = listing.user_id;
  const poster = user_id ? db.users.findById(user_id) : (listing.user_details || null);
  const posterName = poster?.display_name || poster?.fullName || 'Anonymous';
  const posterAvatar = getAvatarUrl(poster?.profile_photo, posterName);
  const verifiedHtml = poster ? getVerificationBadge(poster) : '';

  // Handle photos / hero image
  let photoList = listing.photos || listing.images || [];
  if (typeof photoList === 'string') {
    try { photoList = JSON.parse(photoList); } catch (e) { photoList = []; }
  }
  const rawPhoto = Array.isArray(photoList) ? photoList[0] : photoList;
  const photoUrl = getAssetUrl(rawPhoto);

  // Roommate listings show avatar as hero image
  const heroImg = isRoommate ? posterAvatar : photoUrl;

  const saved = _isSaved(id);
  const ago = _timeAgo(listing.created_at);

  const avatarHtml = posterAvatar
    ? `<img src="${posterAvatar}" alt="${posterName}" style="width:26px;height:26px;border-radius:10px;object-fit:cover;flex-shrink:0;">`
    : `<div style="width:26px;height:26px;border-radius:10px;background:#1a1a1a;display:flex;align-items:center;justify-content:center;color:#fff;font-size:0.56rem;font-weight:700;flex-shrink:0;">${posterName.charAt(0).toUpperCase()}</div>`;

  return `
    <div class="mobile-card" data-listing-id="${id}" role="button" tabindex="0" aria-label="View listing: ${title}" style="background:#fff;border-radius:22px;overflow:hidden;box-shadow:0 8px 24px rgba(0,0,0,0.04);border:1px solid #f1f5f9;margin-bottom:16px;position:relative;flex-shrink:0;">
      <!-- Image + overlays -->
      <div style="position:relative;overflow:hidden;background:#f8fafc;aspect-ratio:1.5;">
        ${heroImg
      ? `<img src="${heroImg}" alt="${title}" loading="lazy" style="width:100%;height:100%;object-fit:cover;">`
      : `<div style="width:100%;height:100%;display:flex;align-items:center;justify-content:center;color:#e2e8f0;background:#f8fafc;">
               <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
             </div>`
    }

        <!-- Heart save button (top-right) -->
        <div class="mobile-card-heart"
             data-listing-id="${id}"
             data-saved="${saved}"
             style="position:absolute;top:13px;right:13px;width:32px;height:32px;border-radius:11px;background:rgba(255,255,255,0.9);backdrop-filter:blur(10px);display:flex;align-items:center;justify-content:center;box-shadow:0 3px 10px rgba(0,0,0,0.08);cursor:pointer;z-index:2;transition:all 0.2s ease;color:${saved ? '#000' : '#cbd5e1'};">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="${saved ? 'currentColor' : 'none'}" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
        </div>

        <!-- Badges (bottom-left) -->
        <div style="position:absolute;bottom:13px;left:13px;display:flex;gap:5px;flex-wrap:wrap;">
          ${is_featured ? `
            <div style="padding:5px 11px;border-radius:8px;font-size:0.56rem;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;background:#fbbf24;color:#000;backdrop-filter:blur(8px);">
              <i class="fa-solid fa-star"></i> Featured
            </div>` : ''
    }
          <div style="padding:5px 11px;border-radius:8px;font-size:0.56rem;font-weight:800;text-transform:uppercase;letter-spacing:0.05em;${_typeColor(type)} backdrop-filter:blur(8px);">
            ${type}
          </div>
        </div>
      </div>

      <!-- Card body -->
      <div style="padding:13px 14px 14px;">
        <div style="margin-bottom:5px;">
           <div style="font-size:0.84rem;font-weight:800;color:#000;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;letter-spacing:-0.01em;margin-bottom:2px;">${title}</div>
           ${price ? `<div style="font-size:0.8rem;font-weight:900;color:#000;">${price}</div>` : ''}
        </div>
        
        <div style="display:flex;align-items:center;gap:5px;color:#64748b;font-size:0.66rem;margin-bottom:11px;font-weight:500;">
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${location}</span>
        </div>

        <!-- Footer -->
        <div style="padding-top:13px;border-top:1px solid #f1f5f9;display:flex;align-items:center;justify-content:space-between;">
          <div class="mobile-card-poster" data-user-id="${user_id}" style="display:flex;align-items:center;gap:8px;cursor:pointer;">
            ${avatarHtml}
            <div>
              <div style="font-size:0.68rem;font-weight:800;color:#000;display:flex;align-items:center;">
                ${posterName} ${verifiedHtml}
              </div>
              <div style="font-size:0.56rem;color:#94a3b8;font-weight:600;">${ago || 'Recently'}</div>
            </div>
          </div>
          <div style="display:flex;gap:3px;">
             <div style="width:5px;height:5px;border-radius:50%;background:#e2e8f0;"></div>
             <div style="width:5px;height:5px;border-radius:50%;background:#e2e8f0;"></div>
             <div style="width:5px;height:5px;border-radius:50%;background:#e2e8f0;"></div>
          </div>
        </div>
      </div>
    </div>
  `;
}

// ── attachMobileCardEvents ────────────────────────────────────
/**
 * Wires tap-to-open and heart-toggle events on all cards in a container.
 * @param {HTMLElement} container  — element containing .mobile-card nodes
 * @param {Function}    onCardClick — called with listing id string
 */
export function attachMobileCardEvents(container, onCardClick, onProfileClick) {
  // Card tap (but not on heart button)
  container.querySelectorAll('.mobile-card').forEach(card => {
    card.addEventListener('click', async (e) => {
      if (e.target.closest('.mobile-card-heart')) return;

      // Poster click → Go to profile
      const poster = e.target.closest('.mobile-card-poster');
      if (poster) {
        e.stopPropagation();
        const uid = poster.dataset.userId;
        if (uid) {
          if (typeof onProfileClick === 'function') onProfileClick(uid);
          else {
            const { navigate } = await import('../mobile-main.js');
            navigate('profile', { userId: uid });
          }
        }
        return;
      }

      const lid = card.dataset.listingId;
      if (lid && typeof onCardClick === 'function') onCardClick(lid);
    });
    // Keyboard accessibility
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        const lid = card.dataset.listingId;
        if (lid && typeof onCardClick === 'function') onCardClick(lid);
      }
    });
  });

  // Heart toggle
  container.querySelectorAll('.mobile-card-heart').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.stopPropagation();
      const lid = btn.dataset.listingId;
      const user = getCurrentUser();
      if (!user) return;

      const isSaved = btn.dataset.saved === 'true';
      const saved = [...(user.saved_listings || [])];

      if (isSaved) {
        const idx = saved.indexOf(lid);
        if (idx > -1) saved.splice(idx, 1);
      } else {
        if (!saved.includes(lid)) saved.push(lid);
      }

      // Optimistic UI update
      const isNowSaved = !isSaved;
      btn.dataset.saved = String(isNowSaved);
      btn.style.color = isNowSaved ? '#000' : '#cbd5e1';
      const svg = btn.querySelector('svg');
      if (svg) svg.setAttribute('fill', isNowSaved ? 'currentColor' : 'none');

      btn.style.transform = 'scale(1.3)';
      setTimeout(() => { btn.style.transform = ''; }, 250);

      try {
        await db.users.update(user.user_id, { saved_listings: saved });
      } catch (err) {
        // Rollback on error
        btn.dataset.saved = String(isSaved);
        btn.textContent = isSaved ? '❤️' : '🤍';
        console.log('[MOBILE] Save toggle failed:', err);
      }
    });
  });
}
