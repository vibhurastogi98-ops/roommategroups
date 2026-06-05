/**
 * src/mobile/pages/MobileListing.js
 * Full listing detail view: image gallery, info, amenities, map, sticky CTA.
 * Exports: async init(container, params)
 */

import { db } from '../../../web/src/services/db.js';
import { getCurrentUser, getVerificationBadge, getTierBadge, renderSocialLinks } from '../../../web/src/services/auth.js';
import { getAssetUrl, getAvatarUrl } from '../../../web/src/services/assets.js';
import { api } from '../../../web/src/services/api.js';
import { showBottomSheet, hideBottomSheet } from '../components/BottomSheet.js';

async function getMobile() { return await import('../mobile-main.js'); }

function _getUserId(user) {
  return user?.user_id || user?.id || null;
}

function _parseJsonObject(value) {
  if (value && typeof value === 'object' && !Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value || '{}');
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
    } catch (_) {
      return {};
    }
  }
  return {};
}

function _resolveListingKind(listing) {
  const explicitKind = String(listing?.kind || '').toLowerCase();
  if (explicitKind === 'sale') return 'sale';
  if (explicitKind === 'rental') {
    const hasMarketplaceShape = listing?.category_id
      || listing?.condition
      || listing?.brand
      || Object.keys(_parseJsonObject(listing?.attributes)).length
      || ((listing?.price !== undefined && listing?.price !== null && listing?.price !== '') && (listing?.rent === undefined || listing?.rent === null || listing?.rent === ''));
    return hasMarketplaceShape ? 'sale' : 'rental';
  }
  const hasMarketplaceShape = listing?.category_id
    || listing?.condition
    || listing?.brand
    || Object.keys(_parseJsonObject(listing?.attributes)).length
    || ((listing?.price !== undefined && listing?.price !== null && listing?.price !== '') && (listing?.rent === undefined || listing?.rent === null || listing?.rent === ''));
  return hasMarketplaceShape ? 'sale' : 'rental';
}

function _parseJsonArray(value) {
  if (Array.isArray(value)) return value;
  if (typeof value === 'string') {
    try { return JSON.parse(value || '[]'); } catch (_) { return []; }
  }
  return [];
}

function _humanize(value, fallback = '') {
  if (value === undefined || value === null || value === '') return fallback;
  return String(value)
    .replace(/^(cat|mp|nh|city)_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

const RENTAL_CATEGORY_LABELS = {
  room: 'Room for Rent',
  apartment: 'Apartment for Rent',
  sublet: 'Sublet',
  roommate_wanted: 'Roommate Wanted',
  coliving: 'Co-living Space',
  house: 'House for Rent',
  student_housing: 'Student Housing',
  room_wanted: 'Room Wanted',
};

function _normalizeRentalCategoryKey(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/^(cat|category)_/, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

function _hasRoommateProfileFields(listing) {
  const roomType = _normalizeRentalCategoryKey(listing?.room_type);
  return [
    listing?.budgetMax,
    listing?.budget_max,
    listing?.preferredArea,
    listing?.preferred_area,
    listing?.moveInTimeline,
    listing?.move_in_timeline,
  ].some(value => value !== undefined && value !== null && value !== '') &&
    !['private_room', 'shared_room'].includes(roomType);
}

function _rentalCategoryLabel(listing) {
  const category = [
    listing?.category,
    listing?.category_name,
    listing?.listing_type,
    listing?.type,
    listing?.room_type,
  ].map(_normalizeRentalCategoryKey).find(key => RENTAL_CATEGORY_LABELS[key]);
  if (category) return RENTAL_CATEGORY_LABELS[category];
  if (listing?.category_name) return listing.category_name;
  if (_hasRoommateProfileFields(listing)) return RENTAL_CATEGORY_LABELS.roommate_wanted;
  return _humanize(listing?.room_type || listing?.property_type || listing?.type || listing?.category, 'Room');
}

function _isAffirmative(value) {
  return value === true || value === 1 || value === '1' || value === 'true' || value === 'yes';
}

function _formatAttrValue(value) {
  if (Array.isArray(value)) return value.join(', ');
  if (value && typeof value === 'object') return JSON.stringify(value);
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  return String(value);
}

function _renderStars(rating) {
  const score = Math.max(0, Math.min(5, Number(rating) || 0));
  const rounded = Math.round(score);
  return [1, 2, 3, 4, 5].map(i => `<i class="fa-${i <= rounded ? 'solid' : 'regular'} fa-star"></i>`).join('');
}

function _formatResponseTime(minutes) {
  const mins = Number(minutes);
  if (!Number.isFinite(mins) || mins <= 0) return 'Usually responds soon';
  if (mins < 60) return `${Math.round(mins)} min response`;
  if (mins < 1440) return `${Math.round(mins / 60)} hr response`;
  return `${Math.round(mins / 1440)} day response`;
}

function _renderSellerCardContent(seller, fallbackName, ago, isOwner) {
  const name = seller?.display_name || fallbackName || 'Seller';
  const ratingAvg = Number(seller?.seller_rating_avg || 0);
  const ratingCount = Number(seller?.seller_rating_count || 0);
  const ratingText = ratingCount ? `${ratingAvg.toFixed(1)} (${ratingCount})` : 'No reviews yet';
  return `
    <img src="${getAvatarUrl(seller?.profile_photo, name)}" style="width:42px;height:42px;border-radius:50%;object-fit:cover;flex-shrink:0;" alt="${_esc(name)}">
    <div style="flex:1;min-width:0;">
      <div style="display:flex;align-items:center;gap:5px;min-width:0;">
        <span style="font-size:0.9rem;font-weight:800;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${_esc(name)}</span>
        ${seller ? getVerificationBadge(seller) : ''} ${seller ? getTierBadge(seller) : ''}
      </div>
      <div style="display:flex;align-items:center;gap:6px;color:#f59e0b;font-size:0.72rem;margin-top:3px;">
        <span>${_renderStars(ratingAvg)}</span>
        <span style="color:#64748b;font-weight:700;">${_esc(ratingText)}</span>
      </div>
      <div style="font-size:0.72rem;color:#94a3b8;margin-top:3px;">${_esc(_formatResponseTime(seller?.response_time_mins))}${ago ? ' • Listed ' + _esc(ago) : ''}</div>
      ${seller ? renderSocialLinks(seller) : ''}
    </div>
    <div style="font-size:0.72rem;font-weight:800;color:var(--mobile-accent);white-space:nowrap;">${isOwner ? 'Yours' : 'View'}</div>
  `;
}

const SAFE_MEETUP_SPOTS = [
  { icon: 'fa-building-shield', title: 'Police Station Lobby', text: 'Best for high-value handoffs.', query: 'police station' },
  { icon: 'fa-book-open-reader', title: 'Public Library', text: 'Bright, staffed, and easy to leave from.', query: 'public library' },
  { icon: 'fa-mug-saucer', title: 'Busy Coffee Shop', text: 'Good for small items.', query: 'coffee shop' },
  { icon: 'fa-store', title: 'Retail Entrance', text: 'Use a visible, staffed area.', query: 'shopping center' },
];

function _safeSpotUrl(spot, listing, loc) {
  const lat = Number(listing.latitude);
  const lng = Number(listing.longitude);
  const near = Number.isFinite(lat) && Number.isFinite(lng) ? `${lat},${lng}` : (loc || 'near me');
  return `https://www.openstreetmap.org/search?query=${encodeURIComponent(`${spot.query} near ${near}`)}`;
}

function _renderSafeMeetupSection(listing, loc) {
  return `
    <div style="background:#fff;padding:16px;margin-top:8px;">
      <div style="display:flex;align-items:center;gap:8px;font-size:1rem;font-weight:900;color:var(--text-primary);margin-bottom:8px;">
        <i class="fa-solid fa-location-dot"></i> Safe meetup spots
      </div>
      <div style="font-size:0.84rem;color:#64748b;line-height:1.55;margin-bottom:14px;">
        Keep contact inside RoommateGroups chat, meet somewhere public, inspect the item, then pay.
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
        ${SAFE_MEETUP_SPOTS.map(spot => `
          <a href="${_safeSpotUrl(spot, listing, loc)}" target="_blank" rel="noopener"
            style="text-decoration:none;color:inherit;background:#f8fafc;border:1px solid #e2e8f0;border-radius:14px;padding:12px;display:grid;gap:6px;">
            <span style="width:32px;height:32px;border-radius:10px;background:#111827;color:#fff;display:flex;align-items:center;justify-content:center;">
              <i class="fa-solid ${spot.icon}"></i>
            </span>
            <strong style="font-size:0.78rem;color:#0f172a;line-height:1.25;">${_esc(spot.title)}</strong>
            <small style="font-size:0.7rem;color:#64748b;line-height:1.35;">${_esc(spot.text)}</small>
          </a>
        `).join('')}
      </div>
      <button id="lst-safe-guide" style="margin-top:14px;background:none;border:none;padding:0;color:var(--mobile-accent);font-size:0.82rem;font-weight:900;">
        Read safe-meetup guide →
      </button>
    </div>
  `;
}

export async function init(container, params = {}) {
  const id = params?.id || location.pathname.split('/').pop();
  console.log('[MOBILE] Listing detail loaded:', id);

  let listing = db.listings.findById(id);

  if (!listing) {
    container.innerHTML = `
      <div class="mobile-empty" style="padding:64px 24px;">
        <div class="mobile-empty-icon"><i class="fa-solid fa-spinner fa-spin"></i></div>
        <div class="mobile-empty-title">Loading listing</div>
        <div class="mobile-empty-text">Checking the latest listing data...</div>
      </div>`;
    const fresh = await api.getListing(id, true).catch(() => null);
    if (fresh?.listing_id) {
      db.listings.upsertLocal(fresh);
      listing = db.listings.findById(id);
    }
  }

  if (!listing) {
    container.innerHTML = `
      <div class="mobile-empty" style="padding:64px 24px;">
        <div class="mobile-empty-icon">🏚️</div>
        <div class="mobile-empty-title">Listing not found</div>
        <div class="mobile-empty-text">It may have been removed or the link is invalid.</div>
        <button class="mobile-btn mobile-btn-accent" id="lst-back" style="width:auto;margin-top:20px;">← Go Back</button>
      </div>`;
    container.querySelector('#lst-back')?.addEventListener('click', async () => (await getMobile()).goBack());
    return;
  }

  // Update header for this specific listing
  const { updateHeader, goBack } = await getMobile();
  const user = getCurrentUser();
  const userId = _getUserId(user);
  const isOwner = !!(userId && listing.user_id && userId === listing.user_id);
  const poster = listing.user_id ? db.users.findById(listing.user_id) : null;
  const listingKind = _resolveListingKind(listing);
  const isMarketplace = listingKind === 'sale';
  const marketplaceAttributes = _parseJsonObject(listing.attributes);
  const conditionLabel = _humanize(listing.condition);
  const categoryLabel = _humanize(listing.category_name || listing.category || listing.category_id || listingKind, 'Marketplace');
  const isNegotiable = _isAffirmative(listing.negotiable);

  // Handle photos normalization
  let photoList = listing.images || listing.photos || [];
  if (typeof photoList === 'string') {
    try { photoList = JSON.parse(photoList); } catch (e) { photoList = []; }
  }
  const photos = (Array.isArray(photoList) ? photoList : [photoList]).filter(Boolean).map(p => getAssetUrl(p));
  const symbol = listing.currency === 'EUR' ? '€' : listing.currency === 'GBP' ? '£' : listing.currency === 'INR' ? '₹' : '$';
  const listingPriceValue = isMarketplace ? (listing.price ?? listing.rent) : (listing.rent ?? listing.price);
  const price = listingPriceValue !== undefined && listingPriceValue !== null && listingPriceValue !== ''
    ? `${symbol}${Number(listingPriceValue).toLocaleString(listing.currency === 'INR' ? 'en-IN' : 'en-US')}`
    : 'Price TBC';

  updateHeader({
    title: listing.title || 'Listing',
    showBack: true,
    onBack: goBack,
    rightAction: {
      icon: '<i class="fa-solid fa-share-nodes"></i>',
      label: 'Share',
      onClick: () => _openShareSheet(listing, price)
    }
  });

  // Normalize City Name
  let cityName = '';
  const cityId = listing.city || listing.city_id;
  if (cityId) {
    const found = db.cities.findById(cityId);
    if (found) cityName = found.name;
    else cityName = cityId.replace('city_', '').replace(/_/g, ' ').split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  }

  const loc = [listing.area, cityName, listing.postcode].filter(Boolean).join(', ') || 'Location TBC';
  const saved = _parseJsonArray(user?.saved_listings).includes(id);
  const ago = _timeAgo(listing.created_at);

  // Normalize Property Type
  const displayType = isMarketplace ? categoryLabel : _rentalCategoryLabel(listing);
  const marketplaceFacts = [
    ['Price', price],
    ['Condition', conditionLabel || 'Not specified'],
    ['Brand', listing.brand || 'Not specified'],
    ['Negotiable', isNegotiable ? 'Yes' : 'No'],
  ];
  const attributeRows = Object.entries(marketplaceAttributes)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => [key, _formatAttrValue(value)]);

  // Amenities — normalize
  const amenList = Array.isArray(listing.amenities) ? listing.amenities : [];
  const AMEN_ICONS = { WiFi: '📶', AC: '❄️', Parking: '🚗', Gym: '🏋️', Laundry: '🧺', Balcony: '🌿', 'Pet-Friendly': '🐾', Furnished: '🛋️' };

  // Details chips
  const chips = [
    listing.roommates_wanted && `👥 ${listing.roommates_wanted} wanted`,
    listing.gender_preference && `${listing.gender_preference === 'Female' ? '♀' : listing.gender_preference === 'Male' ? '♂' : '⚥'} ${listing.gender_preference}`,
    listing.furnished !== undefined && (listing.furnished ? '🛋️ Furnished' : '📦 Unfurnished'),
    listing.available_from && `📅 From ${new Date(listing.available_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
    (listing.utilities_included || listing.bills_included) && '💡 Bills included',
    listing.deposit && `💰 Deposit: ${symbol}${Number(listing.deposit).toLocaleString()}`,
    listing.min_stay && `⏳ Min. Stay: ${listing.min_stay.replace('_', ' ')}`,
  ].filter(Boolean);

  container.innerHTML = `
    <div style="padding-bottom:96px;">

      <!-- IMAGE GALLERY -->
      <div id="gallery-wrap" style="position:relative;background:#0f172a;overflow:hidden;touch-action:pan-y;">
        <div id="gallery-track" style="display:flex;transition:transform .3s cubic-bezier(.4,0,.2,1);will-change:transform;">
          ${photos.length
      ? photos.map((p, i) => `
                <img data-idx="${i}" src="${p}" alt="Photo ${i + 1}"
                  style="min-width:100%;width:100%;aspect-ratio:4/3;object-fit:cover;display:block;flex-shrink:0;">`)
        .join('')
      : `<div style="min-width:100%;width:100%;aspect-ratio:4/3;background:linear-gradient(135deg,#1e293b,#334155);display:flex;align-items:center;justify-content:center;font-size:5rem;">🏠</div>`
    }
        </div>

        ${photos.length > 1 ? `
          <!-- Dot indicators -->
          <div id="gallery-dots" style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:6px;">
            ${photos.map((_, i) => `<div class="gallery-dot" data-i="${i}" style="width:${i === 0 ? '20px' : '6px'};height:6px;border-radius:3px;background:${i === 0 ? '#fff' : 'rgba(255,255,255,.5)'};transition:all .25s;"></div>`).join('')}
          </div>
          <!-- Photo count badge -->
          <div style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,.55);color:#fff;border-radius:20px;padding:4px 12px;font-size:0.75rem;font-weight:700;">
            1 / ${photos.length}
          </div>` : ''}
      </div>

      <!-- PRICE + BADGE -->
      <div style="background:#fff;padding:16px 16px 12px;border-bottom:1px solid #f1f5f9;">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <div style="font-size:1.8rem;font-weight:900;color:var(--mobile-accent);letter-spacing:-0.03em;">${price}${isMarketplace ? '' : '<span style="font-size:1rem;font-weight:600;color:#94a3b8;">/month</span>'}</div>
          ${displayType ? `<span style="padding:5px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;background:var(--mobile-accent-soft);color:var(--mobile-accent);">${_esc(displayType)}</span>` : ''}
          ${isMarketplace ? `
            ${conditionLabel ? `<span style="padding:5px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;background:#f1f5f9;color:#475569;">${_esc(conditionLabel)}</span>` : ''}
            <span style="padding:5px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;background:rgba(16,185,129,.12);color:#059669;">${isNegotiable ? 'Negotiable' : 'Fixed price'}</span>
            ${listing.brand ? `<span style="padding:5px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;background:#fff7ed;color:#9a3412;">${_esc(listing.brand)}</span>` : ''}
          ` : `
            ${(listing.utilities_included || listing.bills_included) ? `<span style="padding:5px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;background:rgba(16,185,129,.12);color:#059669;">Bills incl.</span>` : ''}
          `}
        </div>
      </div>

      <!-- TITLE + LOCATION -->
      <div style="background:#fff;padding:16px;margin-top:8px;">
        <h1 style="font-size:1.2rem;font-weight:900;color:var(--text-primary);letter-spacing:-0.02em;margin:0 0 10px;">${listing.title || 'Untitled Listing'}</h1>
        <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <div style="font-size:0.85rem;color:var(--text-secondary);display:flex;align-items:center;gap:5px;flex:1;">
            <span>📍</span><span>${loc}</span>
          </div>
          ${listing.latitude && listing.longitude ? `
            <a href="https://www.openstreetmap.org/?mlat=${listing.latitude}&mlon=${listing.longitude}#map=16/${listing.latitude}/${listing.longitude}" target="_blank" rel="noopener"
              style="font-size:0.78rem;font-weight:700;color:var(--mobile-accent);text-decoration:none;white-space:nowrap;flex-shrink:0;">View Map →</a>` : ''}
        </div>
        <!-- Posted by -->
        ${poster ? `
          <div id="${isMarketplace ? 'seller-info' : 'poster-info'}" style="display:flex;align-items:center;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid #f1f5f9;cursor:pointer;">
            ${isMarketplace ? _renderSellerCardContent(poster, poster.display_name, ago, isOwner) : `
            <img src="${getAvatarUrl(poster.profile_photo, poster.display_name)}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" alt="${poster.display_name}">
            <div>
              <div style="font-size:0.82rem;font-weight:700;color:var(--text-primary);">${poster.display_name || 'Anonymous'}</div>
              ${ago ? `<div style="font-size:0.72rem;color:#94a3b8;">${ago}</div>` : ''}
            </div>
            `}
          </div>` : ''}
      </div>

      <!-- DETAILS CHIPS -->
      ${!isMarketplace && chips.length ? `
        <div style="background:#fff;padding:12px 16px;margin-top:8px;display:flex;flex-wrap:wrap;gap:8px;">
          ${chips.map(c => `<span style="padding:6px 12px;border-radius:20px;background:#f1f5f9;color:#475569;font-size:0.78rem;font-weight:600;">${c}</span>`).join('')}
        </div>` : ''}

      <!-- DESCRIPTION -->
      ${listing.description ? `
        <div style="background:#fff;padding:16px;margin-top:8px;">
          <div style="font-size:1rem;font-weight:800;color:var(--text-primary);margin-bottom:10px;">About</div>
          <div id="lst-desc" style="font-size:0.88rem;color:var(--text-secondary);line-height:1.65;overflow:hidden;max-height:4.9em;position:relative;">${listing.description}</div>
          <button id="lst-readmore" style="background:none;border:none;color:var(--mobile-accent);font-weight:700;font-size:0.83rem;cursor:pointer;padding:6px 0 0;">Read more ▼</button>
        </div>` : ''}

      ${isMarketplace ? `
        <div style="background:#fff;padding:16px;margin-top:8px;">
          <div style="font-size:1rem;font-weight:800;color:var(--text-primary);margin-bottom:12px;">Item details</div>
          <div style="border:1px solid #e2e8f0;border-radius:14px;overflow:hidden;">
            ${marketplaceFacts.map(([label, value]) => `
              <div style="display:grid;grid-template-columns:116px 1fr;gap:12px;padding:12px 14px;border-bottom:1px solid #f1f5f9;">
                <span style="font-size:0.78rem;font-weight:800;color:#64748b;">${_esc(label)}</span>
                <strong style="font-size:0.84rem;color:#1e293b;word-break:break-word;">${_esc(value)}</strong>
              </div>`).join('')}
            ${attributeRows.map(([label, value]) => `
              <div style="display:grid;grid-template-columns:116px 1fr;gap:12px;padding:12px 14px;border-bottom:1px solid #f1f5f9;">
                <span style="font-size:0.78rem;font-weight:800;color:#64748b;">${_esc(_humanize(label))}</span>
                <strong style="font-size:0.84rem;color:#1e293b;word-break:break-word;">${_esc(value)}</strong>
              </div>`).join('')}
          </div>
        </div>
        <div style="display:flex;align-items:flex-start;gap:10px;background:#fff7ed;color:#9a3412;border:1px solid #fed7aa;padding:14px 16px;margin-top:8px;font-size:0.84rem;font-weight:800;line-height:1.45;">
          <i class="fa-solid fa-shield-halved" style="margin-top:2px;"></i>
          <span>Meet in a public place, keep contact in chat, and inspect before you pay.</span>
        </div>
        ${_renderSafeMeetupSection(listing, loc)}` : ''}

      <!-- AMENITIES -->
      ${!isMarketplace && amenList.length ? `
        <div style="background:#fff;padding:16px;margin-top:8px;">
          <div style="font-size:1rem;font-weight:800;color:var(--text-primary);margin-bottom:12px;">Amenities</div>
          <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;">
            ${amenList.map(a => `
              <div style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px;background:#f8fafc;border-radius:12px;text-align:center;">
                <span style="font-size:1.3rem;">${AMEN_ICONS[a] || '✔️'}</span>
                <span style="font-size:0.7rem;font-weight:600;color:#475569;line-height:1.2;">${a}</span>
              </div>`).join('')}
          </div>
        </div>` : ''}

      <!-- MAP PREVIEW (OpenStreetMap embed) -->
      ${listing.latitude && listing.longitude ? `
        <div style="background:#fff;padding:16px;margin-top:8px;">
          <div style="font-size:1rem;font-weight:800;color:var(--text-primary);margin-bottom:12px;">Location</div>
          <div style="border-radius:14px;overflow:hidden;height:200px;">
            <iframe
              src="https://www.openstreetmap.org/export/embed.html?bbox=${listing.longitude - .01},${listing.latitude - .01},${listing.longitude + .01},${listing.latitude + .01}&layer=mapnik&marker=${listing.latitude},${listing.longitude}"
              style="width:100%;height:100%;border:none;" loading="lazy" title="Map">
            </iframe>
          </div>
        </div>` : ''}

    </div>

    <!-- STICKY CONTACT BAR -->
    <div style="position:fixed;bottom:calc(var(--mobile-bottom-nav-height) + var(--mobile-safe-bottom));left:0;right:0;padding:10px 16px;background:rgba(255,255,255,.95);backdrop-filter:blur(16px);border-top:1px solid #e2e8f0;display:flex;gap:10px;z-index:800;">
      <button id="lst-save" aria-label="${saved ? 'Remove from saved' : 'Save listing'}"
        style="width:48px;height:48px;border-radius:12px;border:1.5px solid #e2e8f0;background:#fff;font-size:1.3rem;cursor:pointer;flex-shrink:0;transition:transform .2s cubic-bezier(.34,1.56,.64,1);">
        ${saved ? '❤️' : '🤍'}
      </button>
      ${isOwner ? `
        <button id="lst-edit" class="mobile-btn mobile-btn-accent" style="flex:1;height:48px;">✏️ Edit Listing</button>
      ` : isMarketplace ? `
        <button id="lst-message" class="mobile-btn mobile-btn-outline" style="flex:1;height:48px;">Chat</button>
        <button id="lst-offer" class="mobile-btn mobile-btn-accent" style="flex:1.4;height:48px;">Make Offer</button>
      ` : `
        <button id="lst-report" aria-label="Report listing"
          style="width:48px;height:48px;border-radius:12px;border:1.5px solid #e2e8f0;background:#fff;font-size:1.2rem;cursor:pointer;flex-shrink:0;">
          🚩
        </button>
        <button id="lst-message" class="mobile-btn mobile-btn-accent" style="flex:2;height:48px;">💬 Message</button>
      `}
    </div>
  `;

  // ── Navigation events ──────────────────────────────────────
  container.querySelector('#poster-info')?.addEventListener('click', async () => {
    (await getMobile()).navigate('profile', { userId: listing.user_id });
  });

  container.querySelector('#seller-info')?.addEventListener('click', async () => {
    (await getMobile()).navigate('seller', { id: listing.user_id });
  });

  container.querySelector('#lst-safe-guide')?.addEventListener('click', async () => {
    (await getMobile()).navigate('safety', { section: 'safe-meetup' });
  });

  if (isMarketplace && listing.user_id) {
    api.getSeller(listing.user_id, true).then(seller => {
      const card = container.querySelector('#seller-info');
      if (seller && card) {
        card.innerHTML = _renderSellerCardContent(seller, poster?.display_name, ago, isOwner);
      }
    }).catch(() => {});
  }

  container.querySelector('#lst-edit')?.addEventListener('click', async () => {
    (await getMobile()).navigate('post', { listingId: listing.listing_id || listing.id });
  });

  // ── Gallery swipe ──────────────────────────────────────────
  if (photos.length > 1) _initGallery(container, photos);

  // ── Read more toggle ──────────────────────────────────────
  const descEl = container.querySelector('#lst-desc');
  const readMore = container.querySelector('#lst-readmore');
  let expanded = false;
  readMore?.addEventListener('click', () => {
    expanded = !expanded;
    descEl.style.maxHeight = expanded ? 'none' : '4.9em';
    readMore.textContent = expanded ? 'Read less ▲' : 'Read more ▼';
  });

  // ── Save toggle ────────────────────────────────────────────
  const saveBtn = container.querySelector('#lst-save');
  let isSaved = saved;
  saveBtn?.addEventListener('click', async () => {
    const u = getCurrentUser();
    if (!u) { (await getMobile()).navigate('auth'); return; }
    isSaved = !isSaved;
    saveBtn.textContent = isSaved ? '❤️' : '🤍';
    saveBtn.style.transform = 'scale(1.3)';
    setTimeout(() => { saveBtn.style.transform = ''; }, 250);
    const savedList = [..._parseJsonArray(u.saved_listings)];
    const savedIdx = savedList.indexOf(id);
    if (isSaved && savedIdx === -1) savedList.push(id);
    else if (!isSaved && savedIdx > -1) savedList.splice(savedIdx, 1);
    await db.users.update(_getUserId(u), { saved_listings: savedList }).catch(() => { });
  });

  // ── Message button ─────────────────────────────────────────
  container.querySelector('#lst-message')?.addEventListener('click', async () => {
    if (!user) { (await getMobile()).navigate('auth'); return; }
    (await getMobile()).navigate('chat-detail', { userId: listing.user_id, listingId: listing.listing_id });
  });

  container.querySelector('#lst-offer')?.addEventListener('click', async () => {
    if (!getCurrentUser()) { (await getMobile()).navigate('auth'); return; }
    _openOfferSheet(listing, rentValue, symbol);
  });

  // ── Report button ──────────────────────────────────────────
  container.querySelector('#lst-report')?.addEventListener('click', () => {
    if (!user) { getMobile().then(m => m.navigate('auth')); return; }
    _openReportSheet(listing, user);
  });

  // ── Fullscreen photo tap ───────────────────────────────────
  container.querySelector('#gallery-track')?.addEventListener('click', (e) => {
    const img = e.target.closest('img');
    if (!img) return;
    const src = img.src;
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:#000;z-index:2000;display:flex;align-items:center;justify-content:center;';
    overlay.innerHTML = `<img src="${src}" style="max-width:100%;max-height:100%;object-fit:contain;">
      <button style="position:absolute;top:calc(20px + var(--mobile-safe-top));right:20px;background:rgba(255,255,255,0.2);color:#fff;border:none;width:40px;height:40px;border-radius:50%;font-size:1.5rem;cursor:pointer;">✕</button>`;
    document.body.appendChild(overlay);
    overlay.querySelector('button').onclick = () => overlay.remove();
    overlay.onclick = (ev) => { if (ev.target === overlay) overlay.remove(); };
  });
}

function _showEditPopup(id, container) {
  const l = db.listings.findById(id);
  if (!l) return;
  const isSale = _resolveListingKind(l) === 'sale';
  const priceValue = isSale ? (l.price ?? l.rent ?? 0) : (l.rent ?? l.price ?? 0);

  const content = `
    <div style="padding: 0 4px;">
      <div class="mobile-form-group">
        <label class="mobile-form-label">Title *</label>
        <input class="mobile-input" id="ep-title" type="text" value="${_esc(l.title)}">
      </div>

      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="mobile-form-group">
          <label class="mobile-form-label">${isSale ? 'Price ($) *' : 'Price ($/mo) *'}</label>
          <input class="mobile-input" id="ep-price" type="number" value="${priceValue}">
        </div>
        ${isSale ? `
        <div class="mobile-form-group">
          <label class="mobile-form-label">Condition</label>
          <select class="mobile-input" id="ep-condition">
            ${['new', 'like_new', 'good', 'fair', 'used'].map(c => `<option value="${c}" ${String(l.condition || 'good') === c ? 'selected' : ''}>${c.replace('_', ' ')}</option>`).join('')}
          </select>
        </div>
        ` : `
        <div class="mobile-form-group">
          <label class="mobile-form-label">Deposit ($)</label>
          <input class="mobile-input" id="ep-deposit" type="number" value="${l.deposit || 0}">
        </div>
        `}
      </div>

      ${isSale ? `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="mobile-form-group">
          <label class="mobile-form-label">Brand</label>
          <input class="mobile-input" id="ep-brand" type="text" value="${_esc(l.brand || '')}">
        </div>
        <div class="mobile-form-group" style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:12px 16px; border-radius:12px; margin-bottom:20px;">
          <span style="font-weight:700; font-size:0.9rem; color:#475569;">Negotiable</span>
          <input type="checkbox" id="ep-negotiable" ${l.negotiable !== false ? 'checked' : ''} style="width:20px;height:20px;">
        </div>
      </div>
      ` : `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="mobile-form-group">
          <label class="mobile-form-label">Room Type</label>
          <select class="mobile-input" id="ep-roomtype">
            ${['Private Room', 'Shared Room', 'Entire Place', 'Studio'].map(rt => `<option value="${rt}" ${l.room_type === rt ? 'selected' : ''}>${rt}</option>`).join('')}
          </select>
        </div>
        <div class="mobile-form-group">
          <label class="mobile-form-label">Date Available</label>
          <input class="mobile-input" id="ep-date" type="date" value="${(l.available_from || '').slice(0, 10)}">
        </div>
      </div>

      <div class="mobile-form-group">
        <label class="mobile-form-label">Min. Stay</label>
        <select class="mobile-input" id="ep-minstay">
          ${['flexible', '1_month', '3_months', '6_months', '12_months'].map(ms => `<option value="${ms}" ${l.min_stay === ms ? 'selected' : ''}>${ms.replace('_', ' ')}</option>`).join('')}
        </select>
      </div>

      <div class="mobile-form-group" style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:12px 16px; border-radius:12px; margin-bottom:20px;">
        <span style="font-weight:700; font-size:0.9rem; color:#475569;">Utilities Included</span>
        <label style="position:relative; display:inline-block; width:44px; height:24px;">
          <input type="checkbox" id="ep-utilities" ${l.utilities_included ? 'checked' : ''} style="opacity:0; width:0; height:0;">
          <span style="position:absolute; cursor:pointer; inset:0; background-color:${l.utilities_included ? '#1a1a1a' : '#cbd5e1'}; transition:.4s; border-radius:24px;">
            <span style="position:absolute; height:18px; width:18px; left:3px; bottom:3px; background-color:white; transition:.4s; border-radius:50%; transform:${l.utilities_included ? 'translateX(20px)' : 'none'};"></span>
          </span>
        </label>
      </div>
      `}

      <div class="mobile-form-group">
        <label class="mobile-form-label">Description</label>
        <textarea class="mobile-input" id="ep-desc" style="height:120px; padding:12px; line-height:1.5;">${_esc(l.description)}</textarea>
      </div>
    </div>
  `;

  showBottomSheet({
    title: 'Edit Listing',
    content,
    actions: [
      { label: 'Save Changes', variant: 'accent', onClick: () => _handlePopupSave(id, container) },
      { label: 'Cancel', variant: 'outline', onClick: () => { } }
    ]
  });

  // Wire internal events
  const sheet = document.querySelector('.mobile-sheet');
  sheet.querySelector('#ep-utilities')?.addEventListener('change', (e) => {
    const toggle = e.target.nextElementSibling;
    const knob = toggle.querySelector('span');
    toggle.style.backgroundColor = e.target.checked ? '#1a1a1a' : '#cbd5e1';
    knob.style.transform = e.target.checked ? 'translateX(20px)' : 'none';
  });
}

async function _handlePopupSave(id, container) {
  const sheet = document.querySelector('.mobile-sheet');
  const existing = db.listings.findById(id);
  const isSale = _resolveListingKind(existing) === 'sale';
  const price = parseInt(sheet.querySelector('#ep-price').value) || 0;
  const base = {
    title: sheet.querySelector('#ep-title').value.trim(),
    description: sheet.querySelector('#ep-desc').value.trim()
  };
  const updates = isSale ? {
    ...base,
    price,
    condition: sheet.querySelector('#ep-condition')?.value || existing?.condition || 'good',
    brand: sheet.querySelector('#ep-brand')?.value.trim() || '',
    negotiable: !!sheet.querySelector('#ep-negotiable')?.checked,
  } : {
    ...base,
    rent: price,
    deposit: parseInt(sheet.querySelector('#ep-deposit').value) || 0,
    room_type: sheet.querySelector('#ep-roomtype').value,
    available_from: sheet.querySelector('#ep-date').value,
    min_stay: sheet.querySelector('#ep-minstay').value,
    utilities_included: sheet.querySelector('#ep-utilities').checked,
  };

  if (!updates.title) { alert('Title is required'); return false; }

  await db.listings.update(id, updates);
  // Re-init the page to show updates
  init(container, { id });
  return true;
}

function _openOfferSheet(listing, suggestedAmount, symbol) {
  const initial = suggestedAmount !== undefined && suggestedAmount !== null && suggestedAmount !== '' ? Number(suggestedAmount) : '';
  showBottomSheet({
    title: 'Make offer',
    content: `
      <div style="padding:4px 0 2px;">
        <label style="display:block;font-size:0.78rem;font-weight:800;color:#64748b;margin-bottom:8px;">Offer amount</label>
        <div style="display:flex;align-items:center;gap:8px;border:1.5px solid #e2e8f0;border-radius:14px;padding:0 12px;background:#fff;">
          <span style="font-size:1rem;font-weight:900;color:#475569;">${_esc(symbol || '$')}</span>
          <input id="offer-amount" type="number" inputmode="decimal" min="1" step="1" value="${initial || ''}" placeholder="Enter amount"
            style="flex:1;border:none;outline:none;height:48px;font-size:1rem;font-weight:800;color:#1e293b;background:transparent;">
        </div>
        <div id="offer-error" style="min-height:18px;margin-top:8px;font-size:0.76rem;color:#ef4444;font-weight:700;"></div>
      </div>`,
    actions: [
      {
        label: 'Send offer',
        variant: 'accent',
        closeOnClick: false,
        onClick: async () => {
          const sheet = document.querySelector('.mobile-sheet');
          const input = sheet?.querySelector('#offer-amount');
          const error = sheet?.querySelector('#offer-error');
          const action = sheet?.querySelector('#bs-action-0');
          const amount = Number(String(input?.value || '').replace(/[^\d.]/g, ''));
          if (!Number.isFinite(amount) || amount <= 0) {
            if (error) error.textContent = 'Enter a valid offer amount.';
            return;
          }

          if (action) {
            action.disabled = true;
            action.textContent = 'Sending...';
          }
          if (error) error.textContent = '';

          try {
            const result = await api.makeOffer({ listing_id: listing.listing_id || listing.id, amount });
            if (!result) return;
            const threadId = result.thread_id || result.offer?.thread_id;
            hideBottomSheet();
            const mobile = await getMobile();
            if (threadId) mobile.navigate('chat-detail', { threadId });
            else mobile.navigate('chat');
          } catch (err) {
            if (error) error.textContent = err.message || 'Could not send offer.';
            if (action) {
              action.disabled = false;
              action.textContent = 'Send offer';
            }
          }
        },
      },
      { label: 'Cancel', variant: 'outline' },
    ],
  });
}

function _esc(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
}

export const renderMobileListing = init;

// ── Gallery swipe logic ────────────────────────────────────────
function _initGallery(container, photos) {
  const track = container.querySelector('#gallery-track');
  const dotsWrap = container.querySelector('#gallery-dots');
  const badge = container.querySelector('#gallery-wrap [style*="1 /"]');
  let current = 0;
  let startX = 0;

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, photos.length - 1));
    track.style.transform = `translateX(-${current * 100}%)`;
    if (badge) badge.textContent = `${current + 1} / ${photos.length}`;
    dotsWrap?.querySelectorAll('.gallery-dot').forEach((d, i) => {
      d.style.width = i === current ? '20px' : '6px';
      d.style.background = i === current ? '#fff' : 'rgba(255,255,255,.5)';
    });
  }

  track.addEventListener('touchstart', e => { startX = e.touches[0].clientX; }, { passive: true });
  track.addEventListener('touchend', e => {
    const dx = e.changedTouches[0].clientX - startX;
    if (Math.abs(dx) > 40) goTo(dx < 0 ? current + 1 : current - 1);
  }, { passive: true });
}

function _timeAgo(dateStr) {
  if (!dateStr) return '';
  const d = Math.floor((Date.now() - new Date(dateStr)) / 86400000);
  if (d === 0) return 'Today'; if (d === 1) return '1 day ago';
  if (d < 30) return `${d} days ago`;
  const m = Math.floor(d / 30); return `${m} month${m > 1 ? 's' : ''} ago`;
}

function _openShareSheet(listing, price) {
  const url = window.location.origin + '/listing/' + (listing.listing_id || listing.id);
  const encodedUrl = encodeURIComponent(url);
  const text = encodeURIComponent(`Check out this listing on RoommateGroups: ${listing.title} for ${price}`);

  const fbUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
  const waUrl = `https://api.whatsapp.com/send?text=${text}%20${encodedUrl}`;
  const twUrl = `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${text}`;

  showBottomSheet({
    title: 'Share listing',
    content: `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; padding:8px 0;">
        <a href="${fbUrl}" target="_blank" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:14px; border-radius:12px; background:#e0f2fe; color:#0284c7; text-decoration:none; font-weight:700; font-size:0.85rem;"><i class="fa-brands fa-facebook"></i> Facebook</a>
        <a href="${waUrl}" target="_blank" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:14px; border-radius:12px; background:#dcfce7; color:#16a34a; text-decoration:none; font-weight:700; font-size:0.85rem;"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>
        <a href="${twUrl}" target="_blank" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:14px; border-radius:12px; background:#f1f5f9; color:#0f1419; text-decoration:none; font-weight:700; font-size:0.85rem;"><i class="fa-brands fa-x-twitter"></i> Twitter</a>
        <button id="share-insta" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:14px; border-radius:12px; background:#fce7f3; color:#db2777; border:none; font-weight:700; cursor:pointer; font-size:0.85rem;"><i class="fa-brands fa-instagram"></i> Instagram</button>
        <button id="share-copy" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:14px; border-radius:12px; background:#f3e8ff; color:#7c3aed; border:none; font-weight:700; cursor:pointer; font-size:0.85rem; grid-column: span 2;"><i class="fa-solid fa-link"></i> Copy Link</button>
      </div>`,
  });

  setTimeout(() => {
    document.querySelector('#share-insta')?.addEventListener('click', () => {
      navigator.clipboard.writeText(url);
      alert('Link copied! You can now paste it into Instagram.');
      hideBottomSheet();
    });
    document.querySelector('#share-copy')?.addEventListener('click', () => {
      navigator.clipboard.writeText(url);
      alert('Link copied to clipboard!');
      hideBottomSheet();
    });
  }, 100);
}

const REPORT_REASONS = [
  'Misleading information',
  'Fraudulent listing',
  'Inappropriate content',
  'Already rented / unavailable',
  'Spam or duplicate',
  'Other',
];

function _openReportSheet(listing, user) {
  showBottomSheet({
    title: 'Report this listing',
    content: `
      <div style="padding:8px 0;">
        <p style="font-size:0.85rem;color:#64748b;margin:0 0 16px;">Select a reason for reporting:</p>
        ${REPORT_REASONS.map(r => `
          <button class="report-reason-btn" data-reason="${r}"
            style="width:100%;text-align:left;padding:14px 16px;border:1.5px solid #e2e8f0;border-radius:12px;background:#fff;font-size:0.9rem;font-weight:600;color:#1e293b;margin-bottom:8px;cursor:pointer;">
            ${r}
          </button>`).join('')}
      </div>`,
  });

  setTimeout(() => {
    document.querySelectorAll('.report-reason-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const reason = btn.dataset.reason;
        btn.disabled = true;
        btn.textContent = 'Submitting…';
        try {
          const { api: a } = await import('../../../web/src/services/api.js');
          await a.saveReport({
            report_id: `rpt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
            listing_id: listing.listing_id || listing.id,
            reporter_id: user.user_id,
            reason,
            status: 'pending',
            created_at: new Date().toISOString(),
          });
        } catch (_) { }
        hideBottomSheet();
        alert('Thank you — your report has been submitted.');
      });
    });
  }, 100);
}
