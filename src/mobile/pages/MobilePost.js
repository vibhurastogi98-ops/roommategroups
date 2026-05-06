/**
 * src/mobile/pages/MobilePost.js
 * 7-step post-a-listing wizard for mobile — full parity with web post-listing.js
 */

import { getCurrentUser } from '../../services/auth.js';
import { db, initDB } from '../../services/db.js';
import { uploadImage } from '../../services/upload.js';
import { navigate, goBack, updateHeader } from '../mobile-main.js';
import { API_URL } from '../../services/config.js';

// ── Draft persistence ──────────────────────────────────────────
const DRAFT_KEY = 'rg_mobile_draft_listing';
const defaultWizard = {
  step: 1,
  category: '',
  country: 'country_us',
  city: '',
  neighborhood: '',
  address: '',
  title: '',
  price: '',
  currency: 'USD',
  availableFrom: '',
  leaseDuration: '',
  roomType: '',
  furnished: '',
  bedrooms: '',
  bathrooms: '',
  sizeSqft: '',
  budgetMin: '',
  budgetMax: '',
  preferredArea: '',
  moveInTimeline: '',
  amenities: [],
  photos: [],
  description: '',
  prefGender: 'Any',
  prefAgeMin: 18,
  prefAgeMax: 99,
  lifestyleTags: [],
};
let wizard = { ...defaultWizard };

function loadDraft() {
  try {
    const s = localStorage.getItem(DRAFT_KEY);
    if (s) wizard = { ...defaultWizard, ...JSON.parse(s) };
  } catch (e) { /* ignore */ }
}
function saveDraft() { localStorage.setItem(DRAFT_KEY, JSON.stringify(wizard)); }
function clearDraft() { localStorage.removeItem(DRAFT_KEY); wizard = { ...defaultWizard }; }

// ── Image processing (parity with web) ────────────────────────
function resizeToBlob(img, maxW, maxH, quality) {
  return new Promise(resolve => {
    let w = img.width, h = img.height;
    const ratio = Math.min(maxW / w, maxH / h, 1);
    w = Math.round(w * ratio); h = Math.round(h * ratio);
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    canvas.getContext('2d').drawImage(img, 0, 0, w, h);
    canvas.toBlob(blob => resolve(blob), 'image/webp', quality);
  });
}

async function processImageUpload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = e => {
      const img = new Image();
      img.onload = async () => {
        try {
          const [thumbBlob, medBlob, fullBlob] = await Promise.all([
            resizeToBlob(img, 400, 300, 0.72),
            resizeToBlob(img, 960, 720, 0.80),
            resizeToBlob(img, 1600, 1200, 0.85),
          ]);
          try {
            const [thumbUrl, medUrl, fullUrl] = await Promise.all([
              uploadImage(thumbBlob, 'thumb.webp'),
              uploadImage(medBlob, 'medium.webp'),
              uploadImage(fullBlob, 'full.webp'),
            ]);
            resolve({ thumb: thumbUrl, medium: medUrl, full: fullUrl });
          } catch {
            const toBase64 = b => new Promise(r => { const fr = new FileReader(); fr.onload = ev => r(ev.target.result); fr.readAsDataURL(b); });
            const [t, m, f] = await Promise.all([toBase64(thumbBlob), toBase64(medBlob), toBase64(fullBlob)]);
            resolve({ thumb: t, medium: m, full: f, isLocal: true });
          }
        } catch (err) { reject(err); }
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('File read failed'));
    reader.readAsDataURL(file);
  });
}

function getPhotoSrc(photo) {
  if (!photo) return '';
  if (typeof photo === 'string') return photo;
  return photo.thumb || photo.medium || photo.full || '';
}

// ── Constants ─────────────────────────────────────────────────
const TOTAL_STEPS = 7;
const CAT_CONFIG = {
  room: { icon: 'fa-bed', label: 'Room for Rent', desc: 'I have a room available in a shared property.' },
  apartment: { icon: 'fa-building', label: 'Apartment for Rent', desc: 'I am renting out an entire property.' },
  sublet: { icon: 'fa-calendar-alt', label: 'Sublet', desc: 'I need someone to take over my lease.' },
  roommate_wanted: { icon: 'fa-users', label: 'Roommate Wanted', desc: 'Looking for a roommate to find a place with.' },
  coliving: { icon: 'fa-house-chimney-user', label: 'Co-living Space', desc: 'I offer a furnished room with shared amenities.' },
  house: { icon: 'fa-house', label: 'House for Rent', desc: 'I am renting out an entire house.' },
  student_housing: { icon: 'fa-graduation-cap', label: 'Student Housing', desc: 'Listing near a college for students.' },
  room_wanted: { icon: 'fa-magnifying-glass', label: 'Room Wanted', desc: 'I am looking for a room to rent.' },
};

// ── Entry ──────────────────────────────────────────────────────
export async function init(container) {
  const user = getCurrentUser();
  if (!user) { navigate('auth'); return; }
  await initDB().catch(() => {});
  loadDraft();

  updateHeader({
    title: 'Post Listing',
    showBack: true,
    onBack: () => {
      if (wizard.step > 1) { wizard.step--; saveDraft(); _render(container); }
      else { clearDraft(); goBack(); }
    }
  });

  _render(container);
}

export const renderMobilePost = init;

// ── Render shell ───────────────────────────────────────────────
function _render(container) {
  const stepLabels = ['Category', 'Location', 'Details', 'Amenities', 'Photos', 'Description', 'Publish'];
  const stepLabel = stepLabels[wizard.step - 1];
  const showActions = (wizard.step === 1 && wizard.category) || wizard.step > 1;

  container.innerHTML = `
    <div style="height:100%; display:flex; flex-direction:column; background:#fff; position:relative;">
      <!-- Progress Bar -->
      <div style="padding:16px 20px 12px; border-bottom:1px solid #f1f5f9; flex-shrink:0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="font-size:0.75rem; font-weight:600; color:#94a3b8;">Step ${wizard.step} of ${TOTAL_STEPS}</div>
          <div style="font-size:0.75rem; font-weight:800; color:var(--mobile-accent);">${stepLabel}</div>
        </div>
        <div style="height:6px; background:#f1f5f9; border-radius:10px; overflow:hidden;">
          <div style="height:100%; background:linear-gradient(90deg,#1a1a1a,#000); width:${(wizard.step / TOTAL_STEPS) * 100}%; transition:width 0.4s ease;"></div>
        </div>
      </div>

      <!-- Content -->
      <div style="flex:1; overflow-y:auto; -webkit-overflow-scrolling:touch; padding:24px 20px 120px;">
        ${_getStepHTML(wizard.step)}
      </div>

      <!-- Bottom Actions -->
      <div id="wp-actions" style="position:fixed; bottom:0; left:0; width:100%; padding:16px 20px calc(16px + var(--mobile-safe-bottom,0px)); background:rgba(255,255,255,0.98); backdrop-filter:blur(12px); border-top:1px solid #f1f5f9; z-index:1000; display:${showActions ? 'flex' : 'none'}; gap:12px;">
        ${wizard.step > 1 ? `<button id="wp-back" class="mobile-btn mobile-btn-outline" style="flex:0.4;">Back</button>` : ''}
        <button id="wp-next" class="mobile-btn mobile-btn-accent" style="flex:1;">
          ${wizard.step < TOTAL_STEPS ? 'Next Step →' : 'Publish Listing'}
        </button>
      </div>
    </div>
  `;

  _wireStep(container);
}

function _getStepHTML(step) {
  switch (step) {
    case 1: return _step1();
    case 2: return _step2();
    case 3: return _step3();
    case 4: return _step4();
    case 5: return _step5();
    case 6: return _step6();
    case 7: return _step7();
    default: return '';
  }
}

// ── Step 1: Category ──────────────────────────────────────────
function _step1() {
  return `
    <h2 style="font-size:1.4rem; font-weight:900; color:#1e293b; margin-bottom:8px;">What kind of listing?</h2>
    <p style="font-size:0.9rem; color:#64748b; margin-bottom:24px;">Select a category to continue.</p>
    <div style="display:flex; flex-direction:column; gap:12px;">
      ${Object.entries(CAT_CONFIG).map(([key, cfg]) => `
        <div class="wp-cat-card ${wizard.category === key ? 'selected' : ''}" data-cat="${key}"
          style="display:flex; align-items:center; gap:16px; padding:16px; border-radius:16px;
            border:2px solid ${wizard.category === key ? 'var(--mobile-accent)' : '#f1f5f9'};
            background:#fff; cursor:pointer; transition:all 0.2s; touch-action:manipulation;">
          <div style="width:48px; height:48px; border-radius:12px; background:#f8fafc; display:flex; align-items:center; justify-content:center; font-size:1.2rem; color:#1e293b; flex-shrink:0;">
            <i class="fa-solid ${cfg.icon}"></i>
          </div>
          <div style="flex:1; min-width:0;">
            <div style="font-size:0.95rem; font-weight:800; color:#1e293b; margin-bottom:2px;">${cfg.label}</div>
            <div style="font-size:0.75rem; color:#64748b; line-height:1.3;">${cfg.desc}</div>
          </div>
          ${wizard.category === key ? '<div style="color:var(--mobile-accent); font-size:1.2rem; flex-shrink:0;">✓</div>' : ''}
        </div>
      `).join('')}
    </div>
  `;
}

// ── Step 2: Location ──────────────────────────────────────────
function _step2() {
  const allCountries = db.countries.findAll().filter(c => c.is_active);
  const cities = wizard.country
    ? db.cities.findAll().filter(c => (c.country === wizard.country || c.country_id === wizard.country) && c.is_active)
    : db.cities.findAll().filter(c => c.is_active);

  let nhOptions = '<option value="">Select Neighborhood</option>';
  if (wizard.city) {
    const nhs = db.neighborhoods.find(n => n.city === wizard.city);
    nhOptions += nhs.map(n => `<option value="${n.neighborhood_id}" ${wizard.neighborhood === n.neighborhood_id ? 'selected' : ''}>${n.name}</option>`).join('');
  }

  return `
    <h2 style="font-size:1.4rem; font-weight:900; color:#1e293b; margin-bottom:20px;">Location Details</h2>
    <div class="mobile-form-group">
      <label class="mobile-form-label">Country *</label>
      <select class="mobile-input" id="wp-country">
        ${allCountries.map(c => `<option value="${c.country_id}" ${wizard.country === c.country_id ? 'selected' : ''}>${c.flag_emoji} ${c.name}</option>`).join('')}
      </select>
    </div>
    <div class="mobile-form-group">
      <label class="mobile-form-label">City *</label>
      <select class="mobile-input" id="wp-city">
        <option value="">Select city...</option>
        ${cities.map(c => `<option value="${c.city_id}" ${wizard.city === c.city_id ? 'selected' : ''}>${c.name}</option>`).join('')}
      </select>
    </div>
    <div class="mobile-form-group">
      <label class="mobile-form-label">Neighborhood <span style="color:#94a3b8;">(Optional)</span></label>
      <select class="mobile-input" id="wp-neighborhood" ${!wizard.city ? 'disabled' : ''}>
        ${nhOptions}
      </select>
    </div>
    <div class="mobile-form-group">
      <label class="mobile-form-label">Street Address <span style="color:#94a3b8;">(Optional)</span></label>
      <div style="display:flex; gap:8px;">
        <input class="mobile-input" id="wp-address" type="text" placeholder="e.g. 123 Main St" value="${_esc(wizard.address)}" style="flex:1;">
        <button id="wp-use-location" class="mobile-btn mobile-btn-outline" style="flex-shrink:0; padding:0 14px; font-size:0.8rem;">
          <i class="fa-solid fa-location-crosshairs"></i>
        </button>
      </div>
      <div style="font-size:0.72rem; color:#94a3b8; margin-top:4px;">Exact address only shared with verified users.</div>
    </div>
  `;
}

// ── Step 3: Details ───────────────────────────────────────────
function _step3() {
  const isRoommate = wizard.category === 'roommate_wanted' || wizard.category === 'room_wanted';

  if (!isRoommate) {
    return `
      <h2 style="font-size:1.4rem; font-weight:900; color:#1e293b; margin-bottom:20px;">The Details</h2>
      <div class="mobile-form-group">
        <label class="mobile-form-label">Listing Title *</label>
        <input class="mobile-input" id="wp-title" type="text" placeholder="e.g. Sunny Room Near Downtown" value="${_esc(wizard.title)}">
        <div style="font-size:0.72rem; color:#94a3b8; margin-top:4px;">Minimum 3 characters required.</div>
      </div>
      <div class="mobile-form-group">
        <label class="mobile-form-label">Monthly Rent *</label>
        <div style="display:flex; gap:8px;">
          <select class="mobile-input" id="wp-currency" style="flex:0 0 80px;">
            <option value="USD" ${wizard.currency === 'USD' ? 'selected' : ''}>$ USD</option>
            <option value="EUR" ${wizard.currency === 'EUR' ? 'selected' : ''}>€ EUR</option>
            <option value="GBP" ${wizard.currency === 'GBP' ? 'selected' : ''}>£ GBP</option>
          </select>
          <input class="mobile-input" id="wp-price" type="number" placeholder="1,200" value="${wizard.price}" style="flex:1;">
        </div>
      </div>
      <div class="mobile-form-group">
        <label class="mobile-form-label">Available From</label>
        <input class="mobile-input" id="wp-date" type="date" value="${wizard.availableFrom}">
      </div>
      <div class="mobile-form-group">
        <label class="mobile-form-label">Lease Duration</label>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          ${['<3 months','3-6 months','6-12 months','12+ months','Flexible'].map(d => `
            <label style="display:flex; align-items:center; gap:6px; padding:8px 14px; border-radius:20px; border:1.5px solid ${wizard.leaseDuration === d ? 'var(--mobile-accent)' : '#e2e8f0'}; background:${wizard.leaseDuration === d ? 'var(--mobile-accent-soft,#f0f0f0)' : '#fff'}; cursor:pointer; font-size:0.82rem; font-weight:700; touch-action:manipulation;">
              <input type="radio" name="wp-lease" value="${d}" ${wizard.leaseDuration === d ? 'checked' : ''} style="display:none;">
              ${d}
            </label>
          `).join('')}
        </div>
      </div>
      <div class="mobile-form-group">
        <label class="mobile-form-label">Room Type</label>
        <select class="mobile-input" id="wp-roomtype">
          <option value="">Select type</option>
          ${['Private Room','Shared Room','Entire Place','Studio'].map(rt => `<option value="${rt}" ${wizard.roomType === rt ? 'selected' : ''}>${rt}</option>`).join('')}
        </select>
      </div>
      <div class="mobile-form-group">
        <label class="mobile-form-label">Furnished?</label>
        <div style="display:flex; gap:8px;">
          ${['Yes','No','Partially'].map(f => `
            <label style="display:flex; align-items:center; gap:6px; padding:8px 16px; border-radius:20px; border:1.5px solid ${wizard.furnished === f ? 'var(--mobile-accent)' : '#e2e8f0'}; background:${wizard.furnished === f ? 'var(--mobile-accent-soft,#f0f0f0)' : '#fff'}; cursor:pointer; font-size:0.82rem; font-weight:700; touch-action:manipulation;">
              <input type="radio" name="wp-furnished" value="${f}" ${wizard.furnished === f ? 'checked' : ''} style="display:none;">
              ${f}
            </label>
          `).join('')}
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr 1fr; gap:10px;">
        <div class="mobile-form-group" style="margin:0;">
          <label class="mobile-form-label">Beds</label>
          <input class="mobile-input" id="wp-beds" type="number" min="0" value="${wizard.bedrooms}" placeholder="0">
        </div>
        <div class="mobile-form-group" style="margin:0;">
          <label class="mobile-form-label">Baths</label>
          <input class="mobile-input" id="wp-baths" type="number" min="0" value="${wizard.bathrooms}" placeholder="0">
        </div>
        <div class="mobile-form-group" style="margin:0;">
          <label class="mobile-form-label">Sqft</label>
          <input class="mobile-input" id="wp-sqft" type="number" value="${wizard.sizeSqft}" placeholder="–">
        </div>
      </div>
    `;
  }

  // Roommate branch
  return `
    <h2 style="font-size:1.4rem; font-weight:900; color:#1e293b; margin-bottom:20px;">The Details</h2>
    <div class="mobile-form-group">
      <label class="mobile-form-label">Listing Title *</label>
      <input class="mobile-input" id="wp-title" type="text" placeholder="e.g. Looking for roommate in Austin" value="${_esc(wizard.title)}">
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      <div class="mobile-form-group" style="margin:0;">
        <label class="mobile-form-label">Budget Min</label>
        <input class="mobile-input" id="wp-bmin" type="number" placeholder="500" value="${wizard.budgetMin}">
      </div>
      <div class="mobile-form-group" style="margin:0;">
        <label class="mobile-form-label">Budget Max</label>
        <input class="mobile-input" id="wp-bmax" type="number" placeholder="1,500" value="${wizard.budgetMax}">
      </div>
    </div>
    <div class="mobile-form-group">
      <label class="mobile-form-label">Preferred Areas / Neighborhoods</label>
      <input class="mobile-input" id="wp-pref-area" type="text" placeholder="e.g. Downtown or Southside" value="${_esc(wizard.preferredArea)}">
    </div>
    <div class="mobile-form-group">
      <label class="mobile-form-label">Move-in Timeline</label>
      <select class="mobile-input" id="wp-timeline">
        <option value="">Select timeline</option>
        ${['ASAP','Within 30 days','1-3 Months','Flexible'].map(t => `<option value="${t}" ${wizard.moveInTimeline === t ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
    </div>
  `;
}

// ── Step 4: Amenities ─────────────────────────────────────────
function _step4() {
  const amenities = db.amenities.findAll();
  return `
    <h2 style="font-size:1.4rem; font-weight:900; color:#1e293b; margin-bottom:20px;">Amenities</h2>
    <p style="font-size:0.88rem; color:#64748b; margin-bottom:16px;">Select all that apply.</p>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      ${amenities.map(a => `
        <div class="wp-amenity-item ${wizard.amenities.includes(a.amenity_id) ? 'active' : ''}" data-id="${a.amenity_id}"
          style="padding:16px 12px; border-radius:14px; border:1.5px solid ${wizard.amenities.includes(a.amenity_id) ? 'var(--mobile-accent)' : '#f1f5f9'};
            background:#fff; text-align:center; cursor:pointer; touch-action:manipulation;">
          <div style="font-size:1.2rem; margin-bottom:6px; color:${wizard.amenities.includes(a.amenity_id) ? 'var(--mobile-accent)' : '#94a3b8'};"><i class="fa-solid ${a.icon}"></i></div>
          <div style="font-size:0.75rem; font-weight:700; color:#1e293b;">${a.name}</div>
        </div>
      `).join('')}
    </div>
  `;
}

// ── Step 5: Photos ────────────────────────────────────────────
function _step5() {
  return `
    <h2 style="font-size:1.4rem; font-weight:900; color:#1e293b; margin-bottom:8px;">Photos</h2>
    <p style="font-size:0.88rem; color:#64748b; margin-bottom:20px;">Up to 10 photos. First photo is the cover image.</p>
    <div style="display:grid; grid-template-columns:repeat(3, 1fr); gap:10px;">
      ${wizard.photos.map((photo, i) => `
        <div style="aspect-ratio:1; border-radius:12px; overflow:hidden; position:relative;">
          <img src="${getPhotoSrc(photo)}" style="width:100%; height:100%; object-fit:cover;">
          ${i === 0 ? '<div style="position:absolute; top:4px; left:4px; background:rgba(0,0,0,0.7); color:#fff; font-size:0.55rem; font-weight:800; padding:2px 6px; border-radius:4px; letter-spacing:0.05em;">COVER</div>' : ''}
          <div class="wp-photo-del" data-idx="${i}" style="position:absolute; top:4px; right:4px; width:22px; height:22px; border-radius:50%; background:rgba(0,0,0,0.55); color:#fff; display:flex; align-items:center; justify-content:center; font-size:0.65rem; cursor:pointer; touch-action:manipulation;">✕</div>
        </div>
      `).join('')}
      ${wizard.photos.length < 10 ? `
        <label for="wp-upload" style="aspect-ratio:1; border-radius:12px; border:2px dashed #cbd5e1; background:#f8fafc; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; touch-action:manipulation;">
          <span style="font-size:1.6rem;">📷</span>
          <span style="font-size:0.7rem; color:#94a3b8; margin-top:4px;">Add photo</span>
          <input type="file" id="wp-upload" multiple accept="image/jpeg,image/png,image/webp" style="display:none;">
        </label>
      ` : ''}
    </div>
    <div id="wp-upload-status" style="margin-top:12px; text-align:center; font-size:0.82rem; color:#64748b;"></div>
  `;
}

// ── Step 6: Description & Preferences ────────────────────────
function _step6() {
  const tags = db.tags.findAll();
  return `
    <h2 style="font-size:1.4rem; font-weight:900; color:#1e293b; margin-bottom:20px;">Description &amp; Preferences</h2>
    <div class="mobile-form-group">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <label class="mobile-form-label" style="margin:0;">Description *</label>
        <button id="wp-ai-btn" style="background:var(--mobile-accent-soft,#f0f0f0); border:none; color:var(--mobile-accent,#1a1a1a); padding:4px 12px; border-radius:20px; font-size:0.75rem; font-weight:800; touch-action:manipulation;">✨ AI Assist</button>
      </div>
      <textarea id="wp-desc" class="mobile-textarea" style="min-height:120px;" maxlength="2000">${_esc(wizard.description)}</textarea>
      <div style="display:flex; justify-content:space-between; margin-top:4px;">
        <span style="font-size:0.72rem; color:#94a3b8;">At least 50 characters required</span>
        <span id="wp-desc-count" style="font-size:0.72rem; color:#94a3b8;">${wizard.description.length} / 2000</span>
      </div>
    </div>

    <div style="margin-top:24px;">
      <div style="font-size:1rem; font-weight:800; color:#1e293b; margin-bottom:16px;">Roommate Preferences</div>

      <div class="mobile-form-group">
        <label class="mobile-form-label">Preferred Gender</label>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          ${['Any','Male','Female','Non-binary'].map(g => `
            <label style="display:flex; align-items:center; padding:8px 16px; border-radius:20px; border:1.5px solid ${wizard.prefGender === g ? 'var(--mobile-accent)' : '#e2e8f0'}; background:${wizard.prefGender === g ? 'var(--mobile-accent-soft,#f0f0f0)' : '#fff'}; cursor:pointer; font-size:0.82rem; font-weight:700; touch-action:manipulation;">
              <input type="radio" name="wp-pref-gender" value="${g}" ${wizard.prefGender === g ? 'checked' : ''} style="display:none;">
              ${g}
            </label>
          `).join('')}
        </div>
      </div>

      <div class="mobile-form-group">
        <label class="mobile-form-label">Age Range: <span id="wp-age-val" style="font-weight:900;">${wizard.prefAgeMin} – ${wizard.prefAgeMax}</span></label>
        <div style="display:flex; flex-direction:column; gap:10px; padding:4px 0;">
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:0.75rem; color:#94a3b8; min-width:24px;">18</span>
            <input type="range" id="wp-age-min" min="18" max="99" value="${wizard.prefAgeMin}" style="flex:1; accent-color:var(--mobile-accent,#1a1a1a);">
            <span style="font-size:0.75rem; color:#94a3b8; min-width:24px; text-align:right;">99</span>
          </div>
          <div style="display:flex; align-items:center; gap:10px;">
            <span style="font-size:0.75rem; color:#94a3b8; min-width:24px;">18</span>
            <input type="range" id="wp-age-max" min="18" max="99" value="${wizard.prefAgeMax}" style="flex:1; accent-color:var(--mobile-accent,#1a1a1a);">
            <span style="font-size:0.75rem; color:#94a3b8; min-width:24px; text-align:right;">99</span>
          </div>
        </div>
      </div>

      <div class="mobile-form-group">
        <label class="mobile-form-label">Lifestyle Preferences</label>
        <div style="display:flex; flex-wrap:wrap; gap:8px;">
          ${tags.map(t => `
            <div class="wp-tag ${wizard.lifestyleTags.includes(t.tag_id) ? 'active' : ''}" data-id="${t.tag_id}"
              style="padding:6px 12px; border-radius:20px; border:1px solid ${wizard.lifestyleTags.includes(t.tag_id) ? 'var(--mobile-accent)' : '#f1f5f9'};
                background:${wizard.lifestyleTags.includes(t.tag_id) ? 'var(--mobile-accent-soft,#f0f0f0)' : '#fff'};
                color:${wizard.lifestyleTags.includes(t.tag_id) ? 'var(--mobile-accent)' : '#64748b'};
                font-size:0.75rem; font-weight:700; cursor:pointer; touch-action:manipulation;">
              <i class="fa-solid ${t.icon}"></i> ${t.name}
            </div>
          `).join('')}
        </div>
      </div>
    </div>
  `;
}

// ── Step 7: Publish ───────────────────────────────────────────
function _step7() {
  const isRoommate = wizard.category === 'roommate_wanted' || wizard.category === 'room_wanted';
  const priceDisplay = isRoommate
    ? (wizard.budgetMin || wizard.budgetMax ? `$${wizard.budgetMin || '0'} – $${wizard.budgetMax || '∞'}/mo budget` : 'Budget TBD')
    : `$${wizard.price || '0'}/mo`;

  const coverPhoto = wizard.photos[0] ? getPhotoSrc(wizard.photos[0]) : null;

  return `
    <h2 style="font-size:1.4rem; font-weight:900; color:#1e293b; margin-bottom:8px;">Ready to Publish!</h2>
    <p style="font-size:0.88rem; color:#64748b; margin-bottom:20px;">Review your listing before it goes live.</p>

    <!-- Preview Card -->
    <div style="border-radius:16px; border:1px solid #f1f5f9; overflow:hidden; margin-bottom:24px;">
      ${coverPhoto
        ? `<img src="${coverPhoto}" style="width:100%; height:160px; object-fit:cover;" alt="Cover photo">`
        : `<div style="width:100%; height:120px; background:#f8fafc; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:2rem;"><i class="fa-solid fa-image"></i></div>`
      }
      <div style="padding:16px;">
        <div style="font-size:1.05rem; font-weight:900; color:#1e293b;">${_esc(wizard.title) || 'Untitled Listing'}</div>
        <div style="font-size:0.82rem; color:#64748b; margin-top:4px;">📍 ${_esc(wizard.address) || (wizard.city ? 'Location set' : 'No location')}</div>
        <div style="font-size:1.1rem; font-weight:900; color:var(--mobile-accent,#1a1a1a); margin-top:10px;">${priceDisplay}</div>
        ${wizard.amenities.length > 0 ? `<div style="font-size:0.78rem; color:#94a3b8; margin-top:6px;">⭐ ${wizard.amenities.length} amenities selected</div>` : ''}
        ${wizard.description ? `<p style="font-size:0.82rem; color:#475569; margin-top:10px; line-height:1.5;">${_esc(wizard.description.slice(0, 160))}${wizard.description.length > 160 ? '…' : ''}</p>` : ''}
      </div>
    </div>

    <!-- Publish Options -->
    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom:24px;">
      <label class="wp-publish-opt ${wizard._publishType !== 'premium' && wizard._publishType !== 'featured' ? 'selected' : ''}" data-type="free"
        style="display:flex; align-items:center; gap:12px; padding:14px 16px; border-radius:14px;
          border:2px solid ${!wizard._publishType || wizard._publishType === 'free' ? 'var(--mobile-accent,#1a1a1a)' : '#f1f5f9'};
          background:#fff; cursor:pointer; touch-action:manipulation;">
        <input type="radio" name="wp-publish-type" value="free" ${!wizard._publishType || wizard._publishType === 'free' ? 'checked' : ''} style="display:none;">
        <div style="width:40px; height:40px; border-radius:10px; background:#f8fafc; display:flex; align-items:center; justify-content:center; color:#1e293b; flex-shrink:0;"><i class="fa-solid fa-house"></i></div>
        <div style="flex:1;">
          <div style="font-size:0.9rem; font-weight:800; color:#1e293b;">Standard Listing</div>
          <div style="font-size:0.75rem; color:#64748b;">Visible to all, standard search placement</div>
        </div>
        <div style="font-size:0.9rem; font-weight:900; color:#1e293b;">Free</div>
      </label>

      <label class="wp-publish-opt ${wizard._publishType === 'premium' ? 'selected' : ''}" data-type="premium"
        style="display:flex; align-items:center; gap:12px; padding:14px 16px; border-radius:14px;
          border:2px solid ${wizard._publishType === 'premium' ? '#6366f1' : '#f1f5f9'};
          background:#fff; cursor:pointer; touch-action:manipulation;">
        <input type="radio" name="wp-publish-type" value="premium" ${wizard._publishType === 'premium' ? 'checked' : ''} style="display:none;">
        <div style="width:40px; height:40px; border-radius:10px; background:#eef2ff; display:flex; align-items:center; justify-content:center; color:#6366f1; flex-shrink:0;"><i class="fa-solid fa-star"></i></div>
        <div style="flex:1;">
          <div style="font-size:0.9rem; font-weight:800; color:#1e293b;">Premium Listing</div>
          <div style="font-size:0.75rem; color:#64748b;">2x boosted visibility in search results</div>
        </div>
        <div style="font-size:0.9rem; font-weight:900; color:#6366f1;">$4.99/mo</div>
      </label>

      <label class="wp-publish-opt ${wizard._publishType === 'featured' ? 'selected' : ''}" data-type="featured"
        style="display:flex; align-items:center; gap:12px; padding:14px 16px; border-radius:14px;
          border:2px solid ${wizard._publishType === 'featured' ? '#1a1a1a' : '#f1f5f9'};
          background:${wizard._publishType === 'featured' ? '#1a1a1a' : '#fff'};
          cursor:pointer; touch-action:manipulation; position:relative;">
        <input type="radio" name="wp-publish-type" value="featured" ${wizard._publishType === 'featured' ? 'checked' : ''} style="display:none;">
        <div style="width:40px; height:40px; border-radius:10px; background:rgba(255,255,255,0.15); display:flex; align-items:center; justify-content:center; color:${wizard._publishType === 'featured' ? '#fff' : '#1a1a1a'}; flex-shrink:0;"><i class="fa-solid fa-bolt"></i></div>
        <div style="flex:1;">
          <div style="font-size:0.9rem; font-weight:800; color:${wizard._publishType === 'featured' ? '#fff' : '#1e293b'};">Pro Listing</div>
          <div style="font-size:0.75rem; color:${wizard._publishType === 'featured' ? 'rgba(255,255,255,0.7)' : '#64748b'};">Top placement + highlighted badge</div>
        </div>
        <div style="font-size:0.9rem; font-weight:900; color:${wizard._publishType === 'featured' ? '#fff' : '#1a1a1a'};">$8.99/mo</div>
        <div style="position:absolute; top:-8px; right:12px; background:#6366f1; color:#fff; font-size:0.6rem; font-weight:800; padding:2px 8px; border-radius:10px;">Popular</div>
      </label>
    </div>

    <!-- Terms -->
    <label style="display:flex; align-items:flex-start; gap:12px; cursor:pointer; touch-action:manipulation;">
      <input type="checkbox" id="wp-terms" style="margin-top:2px; width:18px; height:18px; accent-color:var(--mobile-accent,#1a1a1a); flex-shrink:0;">
      <span style="font-size:0.82rem; color:#475569; line-height:1.5;">I agree to the Terms of Service and confirm this listing complies with local housing laws.</span>
    </label>
  `;
}

// ── Wire all step interactions ─────────────────────────────────
function _wireStep(container) {
  // Step 1: category select
  container.querySelectorAll('.wp-cat-card').forEach(card => {
    card.addEventListener('click', () => { wizard.category = card.dataset.cat; saveDraft(); _render(container); });
  });

  // Step 2: location
  container.querySelector('#wp-country')?.addEventListener('change', e => {
    wizard.country = e.target.value; wizard.city = ''; wizard.neighborhood = '';
    saveDraft(); _render(container);
  });
  container.querySelector('#wp-city')?.addEventListener('change', e => {
    wizard.city = e.target.value; wizard.neighborhood = '';
    saveDraft(); _render(container);
  });
  container.querySelector('#wp-neighborhood')?.addEventListener('change', e => { wizard.neighborhood = e.target.value; saveDraft(); });
  container.querySelector('#wp-address')?.addEventListener('input', e => { wizard.address = e.target.value; saveDraft(); });
  container.querySelector('#wp-use-location')?.addEventListener('click', async () => {
    const btn = container.querySelector('#wp-use-location');
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
    btn.disabled = true;
    if (!navigator.geolocation) { _toast('Geolocation not supported', 'error'); btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>'; btn.disabled = false; return; }
    navigator.geolocation.getCurrentPosition(async pos => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`);
        const data = await res.json();
        if (data?.address?.road) {
          const addr = data.address.house_number ? `${data.address.house_number} ${data.address.road}` : data.address.road;
          wizard.address = addr;
          const input = container.querySelector('#wp-address');
          if (input) input.value = addr;
          saveDraft();
          _toast('Location updated!');
        }
      } catch { _toast('Could not get address', 'error'); }
      btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>'; btn.disabled = false;
    }, () => { _toast('Location access denied', 'error'); btn.innerHTML = '<i class="fa-solid fa-location-crosshairs"></i>'; btn.disabled = false; });
  });

  // Step 3: details
  container.querySelector('#wp-title')?.addEventListener('input', e => { wizard.title = e.target.value; saveDraft(); });
  container.querySelector('#wp-currency')?.addEventListener('change', e => { wizard.currency = e.target.value; saveDraft(); });
  container.querySelector('#wp-price')?.addEventListener('input', e => { wizard.price = e.target.value; saveDraft(); });
  container.querySelector('#wp-date')?.addEventListener('change', e => { wizard.availableFrom = e.target.value; saveDraft(); });
  container.querySelector('#wp-roomtype')?.addEventListener('change', e => { wizard.roomType = e.target.value; saveDraft(); });
  container.querySelector('#wp-beds')?.addEventListener('input', e => { wizard.bedrooms = e.target.value; saveDraft(); });
  container.querySelector('#wp-baths')?.addEventListener('input', e => { wizard.bathrooms = e.target.value; saveDraft(); });
  container.querySelector('#wp-sqft')?.addEventListener('input', e => { wizard.sizeSqft = e.target.value; saveDraft(); });
  container.querySelector('#wp-bmin')?.addEventListener('input', e => { wizard.budgetMin = e.target.value; saveDraft(); });
  container.querySelector('#wp-bmax')?.addEventListener('input', e => { wizard.budgetMax = e.target.value; saveDraft(); });
  container.querySelector('#wp-pref-area')?.addEventListener('input', e => { wizard.preferredArea = e.target.value; saveDraft(); });
  container.querySelector('#wp-timeline')?.addEventListener('change', e => { wizard.moveInTimeline = e.target.value; saveDraft(); });
  container.querySelectorAll('input[name="wp-lease"]').forEach(r => {
    r.addEventListener('change', e => { wizard.leaseDuration = e.target.value; saveDraft(); _render(container); });
  });
  container.querySelectorAll('input[name="wp-furnished"]').forEach(r => {
    r.addEventListener('change', e => { wizard.furnished = e.target.value; saveDraft(); _render(container); });
  });

  // Step 4: amenities
  container.querySelectorAll('.wp-amenity-item').forEach(item => {
    item.addEventListener('click', () => {
      const id = item.dataset.id;
      wizard.amenities = wizard.amenities.includes(id) ? wizard.amenities.filter(a => a !== id) : [...wizard.amenities, id];
      saveDraft(); _render(container);
    });
  });

  // Step 5: photos
  container.querySelector('#wp-upload')?.addEventListener('change', async e => {
    const files = Array.from(e.target.files).slice(0, 10 - wizard.photos.length);
    const status = container.querySelector('#wp-upload-status');
    if (status) status.textContent = 'Uploading photos…';
    for (const file of files) {
      if (!['image/jpeg','image/png','image/webp'].includes(file.type)) { _toast(`${file.name}: unsupported format`, 'error'); continue; }
      if (file.size > 5 * 1024 * 1024) { _toast(`${file.name}: exceeds 5MB`, 'error'); continue; }
      try { wizard.photos.push(await processImageUpload(file)); } catch (err) { _toast('Upload failed', 'error'); }
    }
    saveDraft(); _render(container);
  });
  container.querySelectorAll('.wp-photo-del').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); wizard.photos.splice(parseInt(btn.dataset.idx), 1); saveDraft(); _render(container); });
  });

  // Step 6: description & prefs
  const desc = container.querySelector('#wp-desc');
  const descCount = container.querySelector('#wp-desc-count');
  desc?.addEventListener('input', e => {
    wizard.description = e.target.value;
    if (descCount) descCount.textContent = `${e.target.value.length} / 2000`;
    saveDraft();
  });
  container.querySelector('#wp-ai-btn')?.addEventListener('click', async () => {
    const btn = container.querySelector('#wp-ai-btn');
    btn.textContent = 'Thinking…'; btn.disabled = true;
    try {
      const amenitiesNames = wizard.amenities.map(id => { const a = db.amenities.findById(id); return a ? a.name : id; });
      const tagNames = wizard.lifestyleTags.map(id => { const t = db.tags.findById(id); return t ? t.name : id; });
      const res = await fetch(`${API_URL}/api/ai-assist`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: wizard.category, title: wizard.title, amenities: amenitiesNames, lifestyleTags: tagNames, draft: { ...wizard, photos: [] } })
      });
      if (!res.ok) {
        const errText = await res.text();
        let errMsg;
        try { errMsg = JSON.parse(errText)?.error; } catch { errMsg = null; }
        throw new Error(errMsg || `Server error ${res.status}`);
      }
      const contentType = res.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        const text = await res.text();
        console.error('[AI Assist] Expected JSON, got:', text.slice(0, 200));
        throw new Error(`Unexpected response format: ${contentType || 'unknown'}`);
      }
      const data = await res.json();
      if (data.success) {
        wizard.description = data.text;
        saveDraft();
        _render(container);
      } else {
        throw new Error(data.error || 'AI generation failed');
      }
    } catch (err) {
      console.error('[AI Assist]', err);
      _toast(err.message || 'AI Assist unavailable', 'error');
      btn.textContent = '✨ AI Assist'; btn.disabled = false;
    }
  });
  const minAge = container.querySelector('#wp-age-min');
  const maxAge = container.querySelector('#wp-age-max');
  const ageVal = container.querySelector('#wp-age-val');
  const updateAge = () => {
    let min = parseInt(minAge.value), max = parseInt(maxAge.value);
    if (min > max) { min = max; minAge.value = min; }
    wizard.prefAgeMin = min; wizard.prefAgeMax = max;
    if (ageVal) ageVal.textContent = `${min} – ${max}`;
    saveDraft();
  };
  minAge?.addEventListener('input', updateAge);
  maxAge?.addEventListener('input', updateAge);
  container.querySelectorAll('input[name="wp-pref-gender"]').forEach(r => {
    r.addEventListener('change', e => { wizard.prefGender = e.target.value; saveDraft(); _render(container); });
  });
  container.querySelectorAll('.wp-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const id = tag.dataset.id;
      wizard.lifestyleTags = wizard.lifestyleTags.includes(id) ? wizard.lifestyleTags.filter(t => t !== id) : [...wizard.lifestyleTags, id];
      saveDraft(); _render(container);
    });
  });

  // Step 7: publish options & terms
  container.querySelectorAll('.wp-publish-opt').forEach(opt => {
    opt.addEventListener('click', () => {
      wizard._publishType = opt.dataset.type;
      container.querySelectorAll('.wp-publish-opt').forEach(o => o.querySelector('input').checked = false);
      opt.querySelector('input').checked = true;
      saveDraft(); _render(container);
    });
  });
  container.querySelector('#wp-terms')?.addEventListener('change', e => {
    wizard._termsAccepted = e.target.checked;
    const nextBtn = container.querySelector('#wp-next');
    if (nextBtn) nextBtn.disabled = !e.target.checked;
  });
  if (wizard.step === 7) {
    const nextBtn = container.querySelector('#wp-next');
    if (nextBtn) nextBtn.disabled = !wizard._termsAccepted;
  }

  // Navigation
  container.querySelector('#wp-back')?.addEventListener('click', () => { wizard.step--; saveDraft(); _render(container); });
  container.querySelector('#wp-next')?.addEventListener('click', () => {
    if (wizard.step < TOTAL_STEPS) {
      if (!_validateStep(wizard.step)) return;
      wizard.step++; saveDraft(); _render(container);
    } else {
      _handleSubmit(container);
    }
  });
}

// ── Validation ────────────────────────────────────────────────
function _validateStep(step) {
  if (step === 1 && !wizard.category) { _toast('Please select a category', 'error'); return false; }
  if (step === 2 && !wizard.city) { _toast('Please select a city', 'error'); return false; }
  if (step === 3 && wizard.title.length < 3) { _toast('Title must be at least 3 characters', 'error'); return false; }
  if (step === 6 && wizard.description.length < 50) { _toast('Description must be at least 50 characters', 'error'); return false; }
  return true;
}

// ── Submit ────────────────────────────────────────────────────
async function _handleSubmit(container) {
  if (!wizard._termsAccepted) { _toast('Please accept the terms to publish', 'error'); return; }
  const btn = container.querySelector('#wp-next');
  if (btn) { btn.textContent = 'Publishing…'; btn.disabled = true; }

  try {
    const user = getCurrentUser();
    const isFree = user.subscription_tier === 'free';
    const selType = wizard._publishType || 'free';
    const isFeatured = selType === 'featured' || selType === 'premium';

    const listingData = {
      user_id: user.id,
      category: wizard.category,
      title: wizard.title,
      description: wizard.description,
      rent: (wizard.category === 'roommate_wanted' || wizard.category === 'room_wanted') ? (parseInt(wizard.budgetMax) || 0) : (parseInt(wizard.price) || 0),
      currency: wizard.currency,
      country: wizard.country,
      city: wizard.city,
      neighborhood: wizard.neighborhood,
      address: wizard.address,
      room_type: wizard.roomType,
      available_from: wizard.availableFrom,
      lease_duration: wizard.leaseDuration,
      furnished: wizard.furnished,
      amenities: wizard.amenities,
      images: JSON.stringify(wizard.photos),
      roommate_prefs: { gender: wizard.prefGender, ageMin: wizard.prefAgeMin, ageMax: wizard.prefAgeMax, tags: wizard.lifestyleTags },
      status: isFree ? 'pending' : 'active',
      moderation_status: isFree ? 'pending' : 'approved',
      is_featured: isFeatured,
      view_count: 0,
      bedrooms: parseInt(wizard.bedrooms) || null,
      bathrooms: parseInt(wizard.bathrooms) || null,
      size_sqft: parseInt(wizard.sizeSqft) || null,
      budgetMin: wizard.budgetMin || null,
      budgetMax: wizard.budgetMax || null,
      preferredArea: wizard.preferredArea || null,
      moveInTimeline: wizard.moveInTimeline || null,
    };

    const item = await db.listings.create(listingData);
    await db.notifications.create({
      user_id: user.id,
      type: isFree ? 'moderation_pending' : 'listing_approved',
      title: isFree ? 'Listing Pending Review' : 'Listing Published!',
      description: isFree ? 'Your listing is pending admin approval and will go live once approved.' : 'Your listing is now live and visible to all users.',
      website_url: `/listing/${item.listing_id}`,
    });

    clearDraft();
    _toast('Listing published successfully!');
    navigate('dashboard');
  } catch (err) {
    console.error('[Publish]', err);
    _toast('Failed to publish. Please try again.', 'error');
    if (btn) { btn.textContent = 'Publish Listing'; btn.disabled = false; }
  }
}

// ── Helpers ───────────────────────────────────────────────────
function _esc(str) {
  if (!str) return '';
  return str.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _toast(msg, type = 'success') {
  const t = document.createElement('div');
  Object.assign(t.style, {
    position: 'fixed', bottom: '80px', left: '50%', transform: 'translateX(-50%) translateY(20px)',
    background: type === 'success' ? '#10b981' : '#ef4444', color: '#fff',
    padding: '10px 20px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: '700',
    zIndex: '99999', opacity: '0', transition: 'all 0.25s ease', whiteSpace: 'nowrap',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  });
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translateX(-50%) translateY(0)'; }));
  setTimeout(() => { t.style.opacity = '0'; setTimeout(() => t.remove(), 250); }, 2800);
}
