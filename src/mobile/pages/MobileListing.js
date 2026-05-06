/**
 * src/mobile/pages/MobileListing.js
 * Full listing detail view: image gallery, info, amenities, map, sticky CTA.
 * Exports: async init(container, params)
 */

import { db } from '../../services/db.js';
import { getCurrentUser } from '../../services/auth.js';
import { navigate, goBack, updateHeader } from '../mobile-main.js';
import { getAssetUrl, getAvatarUrl } from '../../services/assets.js';

export async function init(container, params = {}) {
  const id = params?.id || location.pathname.split('/').pop();
  console.log('[MOBILE] Listing detail loaded:', id);

  const listing = db.listings.findById(id);

  if (!listing) {
    container.innerHTML = `
      <div class="mobile-empty" style="padding:64px 24px;">
        <div class="mobile-empty-icon">🏚️</div>
        <div class="mobile-empty-title">Listing not found</div>
        <div class="mobile-empty-text">It may have been removed or the link is invalid.</div>
        <button class="mobile-btn mobile-btn-accent" id="lst-back" style="width:auto;margin-top:20px;">← Go Back</button>
      </div>`;
    container.querySelector('#lst-back')?.addEventListener('click', goBack);
    return;
  }

  // Update header for this specific listing
  updateHeader({
    title: listing.title || 'Listing',
    showBack: true,
    onBack: goBack,
    rightAction: {
      icon: '<i class="fa-solid fa-share-nodes"></i>',
      label: 'Share',
      onClick: () => {
        if (window.openShareModal) window.openShareModal(id);
      }
    }
  });

  const user    = getCurrentUser();
  const poster  = listing.user_id ? db.users.findById(listing.user_id) : null;
  
  // Handle photos normalization
  let photoList = listing.images || listing.photos || [];
  if (typeof photoList === 'string') {
    try { photoList = JSON.parse(photoList); } catch(e) { photoList = []; }
  }
  const photos  = (Array.isArray(photoList) ? photoList : [photoList]).filter(Boolean).map(p => getAssetUrl(p));
  const price   = listing.rent ? `₹${Number(listing.rent).toLocaleString('en-IN')}` : 'Price TBC';
  const loc     = [listing.area, listing.city, listing.postcode].filter(Boolean).join(', ') || 'Location TBC';
  const saved   = (user?.saved_listings || []).includes(id);
  const ago     = _timeAgo(listing.created_at);

  // Amenities — normalize
  const amenList = Array.isArray(listing.amenities) ? listing.amenities : [];
  const AMEN_ICONS = { WiFi: '📶', AC: '❄️', Parking: '🚗', Gym: '🏋️', Laundry: '🧺', Balcony: '🌿', 'Pet-Friendly': '🐾', Furnished: '🛋️' };

  // Details chips
  const chips = [
    listing.roommates_wanted && `👥 ${listing.roommates_wanted} wanted`,
    listing.gender_preference && `${listing.gender_preference === 'Female' ? '♀' : listing.gender_preference === 'Male' ? '♂' : '⚥'} ${listing.gender_preference}`,
    listing.furnished !== undefined && (listing.furnished ? '🛋️ Furnished' : '📦 Unfurnished'),
    listing.available_from && `📅 From ${new Date(listing.available_from).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`,
    listing.bills_included && '💡 Bills included',
  ].filter(Boolean);

  container.innerHTML = `
    <div style="padding-bottom:96px;">

      <!-- IMAGE GALLERY -->
      <div id="gallery-wrap" style="position:relative;background:#0f172a;overflow:hidden;touch-action:pan-y;">
        <div id="gallery-track" style="display:flex;transition:transform .3s cubic-bezier(.4,0,.2,1);will-change:transform;">
          ${photos.length
            ? photos.map((p, i) => `
                <img data-idx="${i}" src="${p}" alt="Photo ${i+1}"
                  style="min-width:100%;width:100%;aspect-ratio:4/3;object-fit:cover;display:block;flex-shrink:0;">`)
              .join('')
            : `<div style="min-width:100%;width:100%;aspect-ratio:4/3;background:linear-gradient(135deg,#1e293b,#334155);display:flex;align-items:center;justify-content:center;font-size:5rem;">🏠</div>`
          }
        </div>

        ${photos.length > 1 ? `
          <!-- Dot indicators -->
          <div id="gallery-dots" style="position:absolute;bottom:12px;left:50%;transform:translateX(-50%);display:flex;gap:6px;">
            ${photos.map((_, i) => `<div class="gallery-dot" data-i="${i}" style="width:${i===0?'20px':'6px'};height:6px;border-radius:3px;background:${i===0?'#fff':'rgba(255,255,255,.5)'};transition:all .25s;"></div>`).join('')}
          </div>
          <!-- Photo count badge -->
          <div style="position:absolute;top:12px;right:12px;background:rgba(0,0,0,.55);color:#fff;border-radius:20px;padding:4px 12px;font-size:0.75rem;font-weight:700;">
            1 / ${photos.length}
          </div>` : ''}
      </div>

      <!-- PRICE + BADGE -->
      <div style="background:#fff;padding:16px 16px 12px;border-bottom:1px solid #f1f5f9;">
        <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
          <div style="font-size:1.8rem;font-weight:900;color:var(--mobile-accent);letter-spacing:-0.03em;">${price}<span style="font-size:1rem;font-weight:600;color:#94a3b8;">/month</span></div>
          ${listing.type ? `<span style="padding:5px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;background:var(--mobile-accent-soft);color:var(--mobile-accent);">${listing.type}</span>` : ''}
          ${listing.bills_included ? `<span style="padding:5px 14px;border-radius:20px;font-size:0.78rem;font-weight:700;background:rgba(16,185,129,.12);color:#059669;">Bills incl.</span>` : ''}
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
          <div style="display:flex;align-items:center;gap:8px;margin-top:12px;padding-top:12px;border-top:1px solid #f1f5f9;">
            <img src="${getAvatarUrl(poster.profile_photo, poster.display_name)}" style="width:32px;height:32px;border-radius:50%;object-fit:cover;" alt="${poster.display_name}">
            <div>
              <div style="font-size:0.82rem;font-weight:700;color:var(--text-primary);">${poster.display_name || 'Anonymous'}</div>
              ${ago ? `<div style="font-size:0.72rem;color:#94a3b8;">${ago}</div>` : ''}
            </div>
          </div>` : ''}
      </div>

      <!-- DETAILS CHIPS -->
      ${chips.length ? `
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

      <!-- AMENITIES -->
      ${amenList.length ? `
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
              src="https://www.openstreetmap.org/export/embed.html?bbox=${listing.longitude-.01},${listing.latitude-.01},${listing.longitude+.01},${listing.latitude+.01}&layer=mapnik&marker=${listing.latitude},${listing.longitude}"
              style="width:100%;height:100%;border:none;" loading="lazy" title="Map">
            </iframe>
          </div>
        </div>` : ''}

    </div>

    <!-- STICKY CONTACT BAR -->
    <div style="position:fixed;bottom:calc(var(--mobile-bottom-nav-height) + var(--mobile-safe-bottom));left:0;right:0;padding:10px 16px;background:rgba(255,255,255,.95);backdrop-filter:blur(16px);border-top:1px solid #e2e8f0;display:flex;gap:10px;z-index:800;">
      <button id="lst-save" aria-label="${saved?'Remove from saved':'Save listing'}"
        style="width:48px;height:48px;border-radius:12px;border:1.5px solid #e2e8f0;background:#fff;font-size:1.3rem;cursor:pointer;flex-shrink:0;transition:transform .2s cubic-bezier(.34,1.56,.64,1);">
        ${saved ? '❤️' : '🤍'}
      </button>
      ${listing.phone ? `
        <a href="tel:${listing.phone}" class="mobile-btn mobile-btn-outline" style="flex:1;height:48px;text-decoration:none;">📞 Call</a>` : ''}
      <button id="lst-message" class="mobile-btn mobile-btn-accent" style="flex:2;height:48px;">💬 Message</button>
    </div>
  `;

  // ── Gallery swipe ──────────────────────────────────────────
  if (photos.length > 1) _initGallery(container, photos);

  // ── Read more toggle ──────────────────────────────────────
  const descEl   = container.querySelector('#lst-desc');
  const readMore = container.querySelector('#lst-readmore');
  let expanded   = false;
  readMore?.addEventListener('click', () => {
    expanded = !expanded;
    descEl.style.maxHeight      = expanded ? 'none' : '4.9em';
    readMore.textContent        = expanded ? 'Read less ▲' : 'Read more ▼';
  });

  // ── Save toggle ────────────────────────────────────────────
  const saveBtn = container.querySelector('#lst-save');
  let isSaved   = saved;
  saveBtn?.addEventListener('click', async () => {
    const u = getCurrentUser();
    if (!u) { navigate('auth'); return; }
    isSaved = !isSaved;
    saveBtn.textContent   = isSaved ? '❤️' : '🤍';
    saveBtn.style.transform = 'scale(1.3)';
    setTimeout(() => { saveBtn.style.transform = ''; }, 250);
    const savedList = [...(u.saved_listings || [])];
    if (isSaved && !savedList.includes(id)) savedList.push(id);
    else if (!isSaved) savedList.splice(savedList.indexOf(id), 1);
    await db.users.update(u.user_id, { saved_listings: savedList }).catch(() => {});
  });

  // ── Message button ─────────────────────────────────────────
  container.querySelector('#lst-message')?.addEventListener('click', () => {
    if (!user) { navigate('auth'); return; }
    navigate('chat', { userId: listing.user_id });
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

export const renderMobileListing = init;

// ── Gallery swipe logic ────────────────────────────────────────
function _initGallery(container, photos) {
  const track    = container.querySelector('#gallery-track');
  const dotsWrap = container.querySelector('#gallery-dots');
  const badge    = container.querySelector('#gallery-wrap [style*="1 /"]');
  let current    = 0;
  let startX     = 0;

  function goTo(idx) {
    current = Math.max(0, Math.min(idx, photos.length - 1));
    track.style.transform = `translateX(-${current * 100}%)`;
    if (badge) badge.textContent = `${current + 1} / ${photos.length}`;
    dotsWrap?.querySelectorAll('.gallery-dot').forEach((d, i) => {
      d.style.width      = i === current ? '20px' : '6px';
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
