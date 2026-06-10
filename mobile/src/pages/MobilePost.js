/**
 * src/mobile/pages/MobilePost.js
 * Branched post-a-listing wizard for mobile — full parity with web post-listing.js
 */

import { getCurrentUser } from '../../../web/src/services/auth.js';
import { db, initDB } from '../../../web/src/services/db.js';
import { uploadImage } from '../../../web/src/services/upload.js';
import { api } from '../../../web/src/services/api.js';
import { getAssetUrl } from '../../../web/src/services/assets.js';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { showBottomSheet, hideBottomSheet } from '../components/BottomSheet.js';

async function getMobile() { return await import('../mobile-main.js'); }

// ── Draft persistence ──────────────────────────────────────────
const DRAFT_KEY = 'rg_mobile_draft_listing';
const defaultWizard = {
  step: 1,
  kind: '',
  category: '',
  marketplaceCategoryId: '',
  country: 'country_us',
  city: '',
  neighborhood: '',
  address: '',
  title: '',
  price: '',
  currency: 'USD',
  deposit: '',
  availableFrom: '',
  leaseDuration: '',
  minStay: 'flexible',
  utilitiesIncluded: false,
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
  condition: '',
  negotiable: true,
  brand: '',
  attributes: {},
};
let wizard = { ...defaultWizard };
let isEdit = false;
let editListingId = null;
let marketplaceCategories = [];
let marketplaceCategoriesLoaded = false;

function loadDraft() {
  try {
    const s = localStorage.getItem(DRAFT_KEY);
    if (s) wizard = { ...defaultWizard, ...JSON.parse(s) };
  } catch (e) { /* ignore */ }
}
function saveDraft() {
  if (!isEdit) localStorage.setItem(DRAFT_KEY, JSON.stringify(wizard));
}
function clearDraft() { localStorage.removeItem(DRAFT_KEY); wizard = { ...defaultWizard }; }

const MARKETPLACE_KINDS = new Set(['sale']);
function _isMarketplace() { return MARKETPLACE_KINDS.has(wizard.kind); }
function _flowSteps() {
  return _isMarketplace()
    ? ['Kind', 'Location', 'Details', 'Photos', 'Description', 'Publish']
    : ['Kind', 'Location', 'Details', 'Amenities', 'Photos', 'Description', 'Publish'];
}
async function _loadMarketplaceCategories() {
  if (marketplaceCategoriesLoaded) return;
  try {
    const tree = await api.getCategoryTree(true);
    marketplaceCategories = Array.isArray(tree) ? tree : [];
  } catch (err) {
    console.debug('[MobilePost] Category tree unavailable:', err);
    marketplaceCategories = [];
  } finally {
    marketplaceCategoriesLoaded = true;
  }
}
function _flattenCategories(categories = []) {
  return categories.flatMap(cat => [cat, ..._flattenCategories(cat.children || [])]);
}
function _selectedMpCategory() {
  return _flattenCategories(marketplaceCategories).find(cat => cat.category_id === wizard.marketplaceCategoryId) || null;
}
function _mpCategoryTree() {
  const allowedKinds = new Set(['sale', 'product', 'vehicle']);
  const filterNode = (cat) => {
    const children = (cat.children || []).map(filterNode).filter(Boolean);
    if (allowedKinds.has(cat.kind) || children.length) return { ...cat, children };
    return null;
  };
  return marketplaceCategories.map(filterNode).filter(Boolean);
}
function _schemaFields(category = _selectedMpCategory()) {
  const schema = category?.attributes_schema;
  if (!schema) return [];
  if (Array.isArray(schema.fields)) return schema.fields;
  if (Array.isArray(schema)) return schema;
  if (typeof schema === 'object') return Object.keys(schema);
  return [];
}
function _label(name) {
  return String(name || '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}
function _fieldType(name) {
  return ['year', 'mileage', 'storage'].includes(name) ? 'number' : 'text';
}

function loadListingIntoWizard(listing) {
  let photos = [];
  try {
    const raw = typeof listing.images === 'string' ? JSON.parse(listing.images || '[]') : (listing.images || []);
    photos = Array.isArray(raw) ? raw : [];
  } catch (_) { }

  let roommatePrefs = {};
  try {
    roommatePrefs = typeof listing.roommate_prefs === 'string'
      ? JSON.parse(listing.roommate_prefs || '{}')
      : (listing.roommate_prefs || {});
  } catch (_) { }
  let attributes = {};
  try {
    attributes = typeof listing.attributes === 'string'
      ? JSON.parse(listing.attributes || '{}')
      : (listing.attributes || {});
  } catch (_) { }

  const furnishedStr = listing.furnished === true || listing.furnished === 1 ? 'Yes'
    : listing.furnished === false || listing.furnished === 0 ? 'No'
      : String(listing.furnished || '');

  wizard = {
    ...defaultWizard,
    step: 1,
    kind: listing.kind && listing.kind !== 'rental' ? 'sale' : 'rental',
    category: listing.category || '',
    marketplaceCategoryId: listing.category_id || '',
    country: listing.country || 'country_us',
    city: listing.city || '',
    neighborhood: listing.neighborhood || '',
    address: listing.address || '',
    title: listing.title || '',
    price: String(listing.kind && listing.kind !== 'rental' ? (listing.price ?? listing.rent ?? '') : (listing.rent ?? listing.price ?? '')),
    currency: listing.currency || 'USD',
    deposit: String(listing.deposit || ''),
    availableFrom: listing.available_from ? listing.available_from.slice(0, 10) : '',
    leaseDuration: listing.lease_duration || '',
    minStay: listing.min_stay || 'flexible',
    utilitiesIncluded: !!listing.utilities_included || !!listing.bills_included,
    roomType: listing.room_type || '',
    furnished: furnishedStr,
    bedrooms: String(listing.bedrooms || ''),
    bathrooms: String(listing.bathrooms || ''),
    sizeSqft: String(listing.size_sqft || ''),
    budgetMin: String(listing.budgetMin || listing.budget_min || ''),
    budgetMax: String(listing.budgetMax || listing.budget_max || ''),
    preferredArea: listing.preferredArea || listing.preferred_area || '',
    moveInTimeline: listing.moveInTimeline || listing.move_in_timeline || '',
    amenities: Array.isArray(listing.amenities) ? listing.amenities : [],
    photos,
    description: listing.description || '',
    prefGender: roommatePrefs.gender || 'Any',
    prefAgeMin: roommatePrefs.ageMin || 18,
    prefAgeMax: roommatePrefs.ageMax || 99,
    lifestyleTags: roommatePrefs.tags || [],
    condition: listing.condition || '',
    negotiable: listing.negotiable !== undefined ? !!listing.negotiable : true,
    brand: listing.brand || '',
    attributes,
    _termsAccepted: true,
  };
}

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
            const ts = Date.now();
            resolve({ thumb: thumbUrl + '?ts=' + ts, medium: medUrl + '?ts=' + ts, full: fullUrl + '?ts=' + ts });
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
  if (typeof photo === 'string') return getAssetUrl(photo);
  const path = photo.thumb || photo.medium || photo.full || '';
  return getAssetUrl(path);
}

// ── Constants ─────────────────────────────────────────────────
const KIND_CONFIG = {
  sale: { icon: 'fa-tag', label: 'Sell an item', desc: 'Furniture, electronics, vehicles, and other goods.' },
  rental: { icon: 'fa-bed', label: 'List a room', desc: 'Use the room rental flow.' },
};
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

function _categoryBadgeHTML() {
  if (_isMarketplace()) {
    const cat = _selectedMpCategory();
    if (!cat) return '';
    const parent = cat.parent_id ? marketplaceCategories.find(c => c.category_id === cat.parent_id) : null;
    const label = parent ? `${parent.name} · ${cat.name}` : cat.name;
    return `
      <button type="button" id="wp-cat-badge" style="display:inline-flex; align-items:center; gap:6px; background:#f5f5f5; color:#1a1a1a; font-size:0.75rem; font-weight:800; padding:4px 12px; border-radius:100px; border:none; margin-bottom:12px; touch-action:manipulation;">
        <i class="fa-solid ${cat.icon || parent?.icon || 'fa-tag'}" style="font-size:0.7rem;"></i> ${label}
      </button>
    `;
  }
  const cfg = CAT_CONFIG[wizard.category];
  if (!cfg) return '';
  return `
    <button type="button" id="wp-cat-badge" style="display:inline-flex; align-items:center; gap:6px; background:#f5f5f5; color:#1a1a1a; font-size:0.75rem; font-weight:800; padding:4px 12px; border-radius:100px; border:none; margin-bottom:12px; touch-action:manipulation;">
      <i class="fa-solid ${cfg.icon}" style="font-size:0.7rem;"></i> ${cfg.label}
    </button>
  `;
}

// ── Entry ──────────────────────────────────────────────────────
export async function init(container, params = {}) {
  const user = getCurrentUser();
  if (!user) { (await getMobile()).navigate('auth'); return; }
  await initDB().catch(() => { });
  await _loadMarketplaceCategories();

  const { updateHeader, goBack } = await getMobile();

  if (params.listingId) {
    // ── Edit mode ──────────────────────────────────────────────
    const existing = db.listings.findById(params.listingId);
    if (!existing || existing.user_id !== user.user_id) {
      goBack(); return;
    }
    isEdit = true;
    editListingId = params.listingId;
    loadListingIntoWizard(existing);
  } else {
    // ── Create mode ────────────────────────────────────────────
    isEdit = false;
    editListingId = null;
    loadDraft();
    const kindParam = String(params.kind || new URLSearchParams(window.location.search).get('kind') || '').toLowerCase();
    if (['sale', 'rental'].includes(kindParam) && wizard.kind !== kindParam) {
      wizard = {
        ...wizard,
        kind: kindParam,
        category: kindParam === 'rental' ? wizard.category : '',
        marketplaceCategoryId: kindParam === 'sale' ? wizard.marketplaceCategoryId : '',
        attributes: kindParam === 'sale' ? (wizard.attributes || {}) : {},
        step: 1,
      };
      saveDraft();
    }
  }

  updateHeader({
    title: isEdit ? 'Edit Listing' : 'Post Listing',
    showBack: true,
    onBack: () => {
      if (wizard.step > 1) { wizard.step--; saveDraft(); _render(container); }
      else { if (!isEdit) clearDraft(); goBack(); }
    }
  });

  _render(container);
}

export const renderMobilePost = init;

// ── Render shell ───────────────────────────────────────────────
function _render(container) {
  const stepLabels = _flowSteps();
  if (wizard.step > stepLabels.length) wizard.step = stepLabels.length;
  const stepLabel = stepLabels[wizard.step - 1];
  const stepOneReady = wizard.kind && (_isMarketplace() ? wizard.marketplaceCategoryId : wizard.category);
  const showActions = (wizard.step === 1 && stepOneReady) || wizard.step > 1;

  container.innerHTML = `
    <div style="height:100%; display:flex; flex-direction:column; background:#fff; position:relative;">
      <!-- Progress Bar -->
      <div style="padding:16px 20px 12px; border-bottom:1px solid #f1f5f9; flex-shrink:0;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:10px;">
          <div style="font-size:0.75rem; font-weight:600; color:#94a3b8;">Step ${wizard.step} of ${stepLabels.length}</div>
          <div style="font-size:0.75rem; font-weight:800; color:var(--mobile-accent);">${stepLabel}</div>
        </div>
        <div style="height:6px; background:#f1f5f9; border-radius:10px; overflow:hidden;">
          <div style="height:100%; background:linear-gradient(90deg,#1a1a1a,#000); width:${(wizard.step / stepLabels.length) * 100}%; transition:width 0.4s ease;"></div>
        </div>
      </div>

      <!-- Content -->
      <div style="flex:1; min-height:0; overflow-y:scroll; -webkit-overflow-scrolling:touch; touch-action:pan-x pan-y; overscroll-behavior-y:contain; will-change:auto; padding:24px 20px 120px;">
        ${_getStepHTML(wizard.step)}
      </div>

      <!-- Bottom Actions -->
      <div id="wp-actions" style="position:fixed; bottom:0; left:0; width:100%; padding:16px 20px calc(16px + var(--mobile-safe-bottom,0px)); background:rgba(255,255,255,0.98); backdrop-filter:blur(12px); border-top:1px solid #f1f5f9; z-index:1000; display:${showActions ? 'flex' : 'none'}; gap:12px;">
        ${wizard.step > 1 ? `<button id="wp-back" class="mobile-btn mobile-btn-outline" style="flex:0.4;">Back</button>` : ''}
        <button id="wp-next" class="mobile-btn mobile-btn-accent" style="flex:1;">
          ${wizard.step < stepLabels.length ? 'Next Step →' : (isEdit ? 'Save Changes' : 'Publish Listing')}
        </button>
      </div>
    </div>
  `;

  _wireStep(container);
}

function _getStepHTML(step) {
  if (_isMarketplace()) {
    switch (step) {
      case 1: return _step1();
      case 2: return _step2();
      case 3: return _mpDetails();
      case 4: return _step5();
      case 5: return _mpDescription();
      case 6: return _step7();
      default: return '';
    }
  }
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
    <p style="font-size:0.9rem; color:#64748b; margin-bottom:24px;">Choose the branch that matches what you are posting.</p>
    <div style="display:flex; flex-direction:column; gap:12px;">
      ${Object.entries(KIND_CONFIG).map(([key, cfg]) => `
        <div class="wp-kind-card ${wizard.kind === key ? 'selected' : ''}" data-kind="${key}"
          style="display:flex; align-items:center; gap:16px; padding:16px; border-radius:16px;
            border:2px solid ${wizard.kind === key ? 'var(--mobile-accent)' : '#f1f5f9'};
            background:#fff; cursor:pointer; transition:all 0.2s; touch-action:manipulation;">
          <div style="width:48px; height:48px; border-radius:12px; background:#f8fafc; display:flex; align-items:center; justify-content:center; font-size:1.2rem; color:#1e293b; flex-shrink:0;">
            <i class="fa-solid ${cfg.icon}"></i>
          </div>
          <div style="flex:1; min-width:0;">
            <div style="font-size:0.95rem; font-weight:800; color:#1e293b; margin-bottom:2px;">${cfg.label}</div>
            <div style="font-size:0.75rem; color:#64748b; line-height:1.3;">${cfg.desc}</div>
          </div>
          ${wizard.kind === key ? '<div style="color:var(--mobile-accent); font-size:1.2rem; flex-shrink:0;">✓</div>' : ''}
        </div>
      `).join('')}
    </div>
    ${wizard.kind === 'rental' ? `
      <div style="font-size:1rem; font-weight:900; color:#1e293b; margin:26px 0 12px;">Rental category</div>
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
    ` : _mpCategoryPicker()}
  `;
}

function _mpCategoryPicker() {
  if (!wizard.kind || wizard.kind === 'rental') return '';
  const tree = _mpCategoryTree();
  if (!marketplaceCategoriesLoaded) {
    return `<div style="margin-top:24px; padding:18px; border-radius:16px; background:#f8fafc; color:#64748b; font-size:0.9rem; text-align:center;">Loading categories...</div>`;
  }
  if (!tree.length) {
    return `<div style="margin-top:24px; padding:18px; border-radius:16px; background:#f8fafc; color:#64748b; font-size:0.9rem;">No categories available yet.</div>`;
  }
  return `
    <div style="font-size:1rem; font-weight:900; color:#1e293b; margin:26px 0 12px;">Marketplace category</div>
    <div style="display:flex; flex-direction:column; gap:12px;">
      ${tree.map(parent => `
        <div>
          <div class="wp-mp-cat-card ${wizard.marketplaceCategoryId === parent.category_id ? 'selected' : ''}" data-mp-cat="${parent.category_id}"
            style="display:flex; align-items:center; gap:14px; padding:14px; border-radius:14px; border:2px solid ${wizard.marketplaceCategoryId === parent.category_id ? 'var(--mobile-accent)' : '#f1f5f9'}; background:#fff; cursor:pointer; touch-action:manipulation;">
            <div style="width:42px; height:42px; border-radius:12px; background:#f8fafc; display:flex; align-items:center; justify-content:center; color:#1e293b; flex-shrink:0;"><i class="fa-solid ${parent.icon || 'fa-tag'}"></i></div>
            <div style="flex:1; min-width:0;">
              <div style="font-size:0.9rem; font-weight:850; color:#1e293b;">${parent.name}</div>
              <div style="font-size:0.72rem; color:#64748b;">${parent.children?.length ? `${parent.children.length} subcategories` : _label(parent.kind)}</div>
            </div>
            ${wizard.marketplaceCategoryId === parent.category_id ? '<div style="color:var(--mobile-accent); font-size:1.1rem;">✓</div>' : ''}
          </div>
          ${parent.children?.length ? `
            <div style="display:grid; grid-template-columns:1fr 1fr; gap:8px; margin-top:8px;">
              ${parent.children.map(child => `
                <div class="wp-mp-cat-card ${wizard.marketplaceCategoryId === child.category_id ? 'selected' : ''}" data-mp-cat="${child.category_id}"
                  style="padding:12px; border-radius:12px; border:1.5px solid ${wizard.marketplaceCategoryId === child.category_id ? 'var(--mobile-accent)' : '#f1f5f9'}; background:#fff; cursor:pointer; touch-action:manipulation;">
                  <div style="font-size:1rem; color:#1e293b; margin-bottom:6px;"><i class="fa-solid ${child.icon || parent.icon || 'fa-tag'}"></i></div>
                  <div style="font-size:0.78rem; font-weight:800; color:#1e293b; line-height:1.25;">${child.name}</div>
                </div>
              `).join('')}
            </div>
          ` : ''}
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
    ${_categoryBadgeHTML()}
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
      ${_categoryBadgeHTML()}
      <h2 style="font-size:1.4rem; font-weight:900; color:#1e293b; margin-bottom:20px;">The Details</h2>
      <div class="mobile-form-group">
        <label class="mobile-form-label">Listing Title *</label>
        <input class="mobile-input" id="wp-title" type="text" minlength="3" required placeholder="e.g. Sunny Room Near Downtown" value="${_esc(wizard.title)}">
        <div style="font-size:0.72rem; color:#94a3b8; margin-top:4px;">Minimum 3 characters required.</div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="mobile-form-group">
          <label class="mobile-form-label">Monthly Rent *</label>
          <div style="display:flex; gap:8px;">
            <select class="mobile-input" id="wp-currency" style="flex:0 0 70px; padding:0 8px; font-size:0.8rem;">
              <option value="USD" ${wizard.currency === 'USD' ? 'selected' : ''}>$</option>
              <option value="EUR" ${wizard.currency === 'EUR' ? 'selected' : ''}>€</option>
              <option value="GBP" ${wizard.currency === 'GBP' ? 'selected' : ''}>£</option>
            </select>
            <input class="mobile-input" id="wp-price" type="number" min="1" required placeholder="1200" value="${wizard.price}" style="flex:1;">
          </div>
        </div>
        <div class="mobile-form-group">
          <label class="mobile-form-label">Deposit ($)</label>
          <input class="mobile-input" id="wp-deposit" type="number" placeholder="e.g. 500" value="${wizard.deposit}">
        </div>
      </div>
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
        <div class="mobile-form-group">
          <label class="mobile-form-label">Room Type</label>
          <select class="mobile-input" id="wp-roomtype">
            <option value="">Select type</option>
            ${['Private Room', 'Shared Room', 'Entire Place', 'Studio'].map(rt => `<option value="${rt}" ${wizard.roomType === rt ? 'selected' : ''}>${rt}</option>`).join('')}
          </select>
        </div>
        <div class="mobile-form-group">
          <label class="mobile-form-label">Date Available</label>
          <input class="mobile-input" id="wp-date" type="date" value="${wizard.availableFrom}">
        </div>
      </div>
      <div class="mobile-form-group">
        <label class="mobile-form-label">Min. Stay</label>
        <select class="mobile-input" id="wp-minstay">
          <option value="flexible" ${wizard.minStay === 'flexible' ? 'selected' : ''}>Flexible</option>
          <option value="1_month" ${wizard.minStay === '1_month' ? 'selected' : ''}>1 Month</option>
          <option value="3_months" ${wizard.minStay === '3_months' ? 'selected' : ''}>3 Months</option>
          <option value="6_months" ${wizard.minStay === '6_months' ? 'selected' : ''}>6 Months</option>
          <option value="12_months" ${wizard.minStay === '12_months' ? 'selected' : ''}>12 Months</option>
        </select>
      </div>
      <div class="mobile-form-group" style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:12px 16px; border-radius:12px; margin-bottom:20px;">
        <span style="font-weight:700; font-size:0.9rem; color:#475569;">Utilities Included</span>
        <label style="position:relative; display:inline-block; width:44px; height:24px;">
          <input type="checkbox" id="wp-utilities" ${wizard.utilitiesIncluded ? 'checked' : ''} style="opacity:0; width:0; height:0;">
          <span style="position:absolute; cursor:pointer; inset:0; background-color:${wizard.utilitiesIncluded ? 'var(--mobile-accent)' : '#cbd5e1'}; transition:.4s; border-radius:24px;">
            <span style="position:absolute; height:18px; width:18px; left:3px; bottom:3px; background-color:white; transition:.4s; border-radius:50%; transform:${wizard.utilitiesIncluded ? 'translateX(20px)' : 'none'};"></span>
          </span>
        </label>
      </div>
      <div class="mobile-form-group">
        <label class="mobile-form-label">Furnished?</label>
        <div style="display:flex; gap:8px;">
          ${['Yes', 'No', 'Partially'].map(f => `
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
    ${_categoryBadgeHTML()}
    <h2 style="font-size:1.4rem; font-weight:900; color:#1e293b; margin-bottom:20px;">The Details</h2>
    <div class="mobile-form-group">
      <label class="mobile-form-label">Listing Title *</label>
      <input class="mobile-input" id="wp-title" type="text" minlength="3" required placeholder="e.g. Looking for roommate in Austin" value="${_esc(wizard.title)}">
      <div style="font-size:0.72rem; color:#94a3b8; margin-top:4px;">Minimum 3 characters required.</div>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
      <div class="mobile-form-group" style="margin:0;">
        <label class="mobile-form-label">Budget Min</label>
        <input class="mobile-input" id="wp-bmin" type="number" placeholder="500" value="${wizard.budgetMin}">
      </div>
      <div class="mobile-form-group" style="margin:0;">
        <label class="mobile-form-label">Budget Max *</label>
        <input class="mobile-input" id="wp-bmax" type="number" min="1" required placeholder="1,500" value="${wizard.budgetMax}">
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
        ${['ASAP', 'Within 30 days', '1-3 Months', 'Flexible'].map(t => `<option value="${t}" ${wizard.moveInTimeline === t ? 'selected' : ''}>${t}</option>`).join('')}
      </select>
    </div>
  `;
}

function _mpDetails() {
  const category = _selectedMpCategory();
  const schemaFields = _schemaFields().filter(name => !['brand', 'condition'].includes(String(name).toLowerCase()));
  return `
    ${_categoryBadgeHTML()}
    <h2 style="font-size:1.4rem; font-weight:900; color:#1e293b; margin-bottom:8px;">Item Details</h2>
    <p style="font-size:0.88rem; color:#64748b; margin-bottom:20px;">${category ? `Posting in ${category.name}.` : 'Add the details buyers need.'}</p>
    <div class="mobile-form-group">
      <label class="mobile-form-label">Title *</label>
      <input class="mobile-input" id="wp-title" type="text" minlength="3" required placeholder="e.g. IKEA desk in great condition" value="${_esc(wizard.title)}">
      <div style="font-size:0.72rem; color:#94a3b8; margin-top:4px;">Minimum 3 characters required.</div>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
      <div class="mobile-form-group">
        <label class="mobile-form-label">Price *</label>
        <div style="display:flex; gap:8px;">
          <select class="mobile-input" id="wp-currency" style="flex:0 0 66px; padding:0 8px;">
            <option value="USD" ${wizard.currency === 'USD' ? 'selected' : ''}>$</option>
            <option value="EUR" ${wizard.currency === 'EUR' ? 'selected' : ''}>€</option>
            <option value="GBP" ${wizard.currency === 'GBP' ? 'selected' : ''}>£</option>
          </select>
          <input class="mobile-input" id="wp-price" type="number" min="1" step="0.01" required placeholder="75" value="${wizard.price}" style="flex:1;">
        </div>
      </div>
      <div class="mobile-form-group">
        <label class="mobile-form-label">Condition</label>
        <select class="mobile-input" id="wp-condition">
          <option value="">Select</option>
          ${['new', 'like_new', 'good', 'fair', 'used'].map(v => `<option value="${v}" ${wizard.condition === v ? 'selected' : ''}>${_label(v)}</option>`).join('')}
        </select>
      </div>
    </div>
    <div class="mobile-form-group">
      <label class="mobile-form-label">Brand <span style="color:#94a3b8;">(Optional)</span></label>
      <input class="mobile-input" id="wp-brand" type="text" placeholder="e.g. Apple, IKEA, Toyota" value="${_esc(wizard.brand)}">
    </div>
    <div class="mobile-form-group" style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:12px 16px; border-radius:12px;">
      <span style="font-weight:800; font-size:0.9rem; color:#475569;">Negotiable</span>
      <label style="position:relative; display:inline-block; width:44px; height:24px;">
        <input type="checkbox" id="wp-negotiable" ${wizard.negotiable ? 'checked' : ''} style="opacity:0; width:0; height:0;">
        <span style="position:absolute; cursor:pointer; inset:0; background-color:${wizard.negotiable ? 'var(--mobile-accent)' : '#cbd5e1'}; transition:.4s; border-radius:24px;">
          <span style="position:absolute; height:18px; width:18px; left:3px; bottom:3px; background-color:white; transition:.4s; border-radius:50%; transform:${wizard.negotiable ? 'translateX(20px)' : 'none'};"></span>
        </span>
      </label>
    </div>
    ${schemaFields.length ? `
      <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:14px;">
        ${schemaFields.map(name => `
          <div class="mobile-form-group" style="margin:0;">
            <label class="mobile-form-label">${_label(name)}</label>
            <input class="mobile-input wp-attr-field" data-attr="${_esc(name)}" type="${_fieldType(name)}" value="${_esc(wizard.attributes?.[name] || '')}">
          </div>
        `).join('')}
      </div>
    ` : ''}
  `;
}

// ── Step 4: Amenities ─────────────────────────────────────────
function _step4() {
  const amenities = db.amenities.findAll();
  return `
    ${_categoryBadgeHTML()}
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
    ${_categoryBadgeHTML()}
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
        <button type="button" id="wp-photo-add" style="aspect-ratio:1; border-radius:12px; border:2px dashed #cbd5e1; background:#f8fafc; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; touch-action:manipulation;">
          <span style="font-size:1.35rem;color:#1e293b;"><i class="fa-solid fa-camera"></i></span>
          <span style="font-size:0.7rem; color:#94a3b8; margin-top:4px;">Add photo</span>
        </button>
        <input type="file" id="wp-upload" multiple accept="image/jpeg,image/png,image/webp" style="display:none;">
      ` : ''}
    </div>
    <div id="wp-upload-status" style="margin-top:12px; text-align:center; font-size:0.82rem; color:#64748b;"></div>
  `;
}

// ── Step 6: Description & Preferences ────────────────────────
function _step6() {
  const tags = db.tags.findAll();
  return `
    ${_categoryBadgeHTML()}
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
          ${['Any', 'Male', 'Female', 'Non-binary'].map(g => `
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

function _mpDescription() {
  return `
    ${_categoryBadgeHTML()}
    <h2 style="font-size:1.4rem; font-weight:900; color:#1e293b; margin-bottom:20px;">Description</h2>
    <div class="mobile-form-group">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
        <label class="mobile-form-label" style="margin:0;">Description *</label>
        <button id="wp-ai-btn" style="background:var(--mobile-accent-soft,#f0f0f0); border:none; color:var(--mobile-accent,#1a1a1a); padding:4px 12px; border-radius:20px; font-size:0.75rem; font-weight:800; touch-action:manipulation;">AI Assist</button>
      </div>
      <textarea id="wp-desc" class="mobile-textarea" style="min-height:140px;" maxlength="2000" placeholder="Describe condition, pickup details, what's included, and anything buyers should know.">${_esc(wizard.description)}</textarea>
      <div style="display:flex; justify-content:space-between; margin-top:4px;">
        <span style="font-size:0.72rem; color:#94a3b8;">At least 50 characters required</span>
        <span id="wp-desc-count" style="font-size:0.72rem; color:#94a3b8;">${wizard.description.length} / 2000</span>
      </div>
    </div>
  `;
}

// ── Step 7: Publish / Review ──────────────────────────────────
function _step7() {
  if (_isMarketplace()) {
    const category = _selectedMpCategory();
    const coverPhoto = wizard.photos[0] ? getPhotoSrc(wizard.photos[0]) : null;
    return `
      ${_categoryBadgeHTML()}
      <h2 style="font-size:1.4rem; font-weight:900; color:#1e293b; margin-bottom:8px;">Ready to Publish!</h2>
      <p style="font-size:0.88rem; color:#64748b; margin-bottom:20px;">Review your marketplace listing before it goes live.</p>
      <div style="border-radius:16px; border:1px solid #f1f5f9; overflow:hidden; margin-bottom:24px;">
        ${coverPhoto
        ? `<img src="${coverPhoto}" style="width:100%; height:160px; object-fit:cover;" alt="Cover photo">`
        : `<div style="width:100%; height:120px; background:#f8fafc; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:2rem;"><i class="fa-solid fa-image"></i></div>`
      }
        <div style="padding:16px;">
          <div style="font-size:1.05rem; font-weight:900; color:#1e293b;">${_esc(wizard.title) || 'Untitled Listing'}</div>
          <div style="font-size:0.82rem; color:#64748b; margin-top:4px;"><i class="fa-solid ${category?.icon || 'fa-tag'}"></i> ${category?.name || 'Marketplace'} · ${_esc(wizard.address) || (wizard.city ? 'Location set' : 'No location')}</div>
          <div style="font-size:1.1rem; font-weight:900; color:var(--mobile-accent,#1a1a1a); margin-top:10px;">$${wizard.price || '0'}</div>
          ${wizard.condition ? `<div style="font-size:0.78rem; color:#94a3b8; margin-top:6px;">${_label(wizard.condition)}${wizard.negotiable ? ' · Negotiable' : ''}</div>` : ''}
          ${wizard.description ? `<p style="font-size:0.82rem; color:#475569; margin-top:10px; line-height:1.5;">${_esc(wizard.description.slice(0, 160))}${wizard.description.length > 160 ? '…' : ''}</p>` : ''}
        </div>
      </div>
      <label style="display:flex; align-items:flex-start; gap:12px; cursor:pointer; touch-action:manipulation;">
        <input type="checkbox" id="wp-terms" ${wizard._termsAccepted ? 'checked' : ''} style="margin-top:2px; width:18px; height:18px; accent-color:var(--mobile-accent,#1a1a1a); flex-shrink:0;">
        <span style="font-size:0.82rem; color:#475569; line-height:1.5;">I agree to the Terms of Service and confirm this listing is accurate.</span>
      </label>
    `;
  }

  const isRoommate = wizard.category === 'roommate_wanted' || wizard.category === 'room_wanted';
  const priceDisplay = isRoommate
    ? (wizard.budgetMin || wizard.budgetMax ? `$${wizard.budgetMin || '0'} – $${wizard.budgetMax || '∞'}/mo budget` : 'Budget TBD')
    : `$${wizard.price || '0'}/mo`;

  const coverPhoto = wizard.photos[0] ? getPhotoSrc(wizard.photos[0]) : null;

  const previewCard = `
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
    </div>`;

  if (isEdit) {
    return `
      ${_categoryBadgeHTML()}
      <h2 style="font-size:1.4rem; font-weight:900; color:#1e293b; margin-bottom:8px;">Review Changes</h2>
      <p style="font-size:0.88rem; color:#64748b; margin-bottom:20px;">Your changes will be saved and visible immediately.</p>
      ${previewCard}
      <label style="display:flex; align-items:flex-start; gap:12px; cursor:pointer; touch-action:manipulation;">
        <input type="checkbox" id="wp-terms" ${wizard._termsAccepted ? 'checked' : ''} style="margin-top:2px; width:18px; height:18px; accent-color:var(--mobile-accent,#1a1a1a); flex-shrink:0;">
        <span style="font-size:0.82rem; color:#475569; line-height:1.5;">I confirm this listing is accurate and complies with local housing laws.</span>
      </label>`;
  }

  return `
    ${_categoryBadgeHTML()}
    <h2 style="font-size:1.4rem; font-weight:900; color:#1e293b; margin-bottom:8px;">Ready to Publish!</h2>
    <p style="font-size:0.88rem; color:#64748b; margin-bottom:20px;">Review your listing before it goes live.</p>
    ${previewCard}

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
async function _wireStep(container) {
  await getMobile();

  // Category badge: jump back to step 1 to change category
  container.querySelector('#wp-cat-badge')?.addEventListener('click', () => {
    wizard.step = 1;
    saveDraft();
    _render(container);
  });

  // Step 1: category select
  container.querySelectorAll('.wp-kind-card').forEach(card => {
    card.addEventListener('click', () => {
      const nextKind = card.dataset.kind;
      if (wizard.kind !== nextKind) {
        wizard.kind = nextKind;
        wizard.category = '';
        wizard.marketplaceCategoryId = '';
        wizard.attributes = {};
      }
      saveDraft(); _render(container);
    });
  });
  container.querySelectorAll('.wp-cat-card').forEach(card => {
    card.addEventListener('click', () => {
      wizard.category = card.dataset.cat;
      wizard.step = Math.min(wizard.step + 1, _flowSteps().length);
      saveDraft();
      _render(container);
    });
  });
  container.querySelectorAll('.wp-mp-cat-card').forEach(card => {
    card.addEventListener('click', () => {
      wizard.marketplaceCategoryId = card.dataset.mpCat;
      wizard.attributes = {};
      wizard.step = Math.min(wizard.step + 1, _flowSteps().length);
      saveDraft(); _render(container);
    });
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
        if (!res.ok) throw new Error('Network response was not ok');
        const contentType = res.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) throw new Error('Not JSON');
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
  container.querySelector('#wp-deposit')?.addEventListener('input', e => { wizard.deposit = e.target.value; saveDraft(); });
  container.querySelector('#wp-date')?.addEventListener('change', e => { wizard.availableFrom = e.target.value; saveDraft(); });
  container.querySelector('#wp-roomtype')?.addEventListener('change', e => { wizard.roomType = e.target.value; saveDraft(); });
  container.querySelector('#wp-minstay')?.addEventListener('change', e => { wizard.minStay = e.target.value; saveDraft(); });
  container.querySelector('#wp-utilities')?.addEventListener('change', e => { wizard.utilitiesIncluded = e.target.checked; saveDraft(); _render(container); });
  container.querySelector('#wp-beds')?.addEventListener('input', e => { wizard.bedrooms = e.target.value; saveDraft(); });
  container.querySelector('#wp-baths')?.addEventListener('input', e => { wizard.bathrooms = e.target.value; saveDraft(); });
  container.querySelector('#wp-sqft')?.addEventListener('input', e => { wizard.sizeSqft = e.target.value; saveDraft(); });
  container.querySelector('#wp-bmin')?.addEventListener('input', e => { wizard.budgetMin = e.target.value; saveDraft(); });
  container.querySelector('#wp-bmax')?.addEventListener('input', e => { wizard.budgetMax = e.target.value; saveDraft(); });
  container.querySelector('#wp-pref-area')?.addEventListener('input', e => { wizard.preferredArea = e.target.value; saveDraft(); });
  container.querySelector('#wp-timeline')?.addEventListener('change', e => { wizard.moveInTimeline = e.target.value; saveDraft(); });
  container.querySelector('#wp-condition')?.addEventListener('change', e => { wizard.condition = e.target.value; saveDraft(); });
  container.querySelector('#wp-brand')?.addEventListener('input', e => { wizard.brand = e.target.value; saveDraft(); });
  container.querySelector('#wp-negotiable')?.addEventListener('change', e => { wizard.negotiable = e.target.checked; saveDraft(); _render(container); });
  container.querySelectorAll('.wp-attr-field').forEach(input => {
    input.addEventListener('input', e => {
      wizard.attributes = { ...(wizard.attributes || {}), [e.target.dataset.attr]: e.target.value };
      saveDraft();
    });
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
  container.querySelector('#wp-photo-add')?.addEventListener('click', () => _showPhotoSheet(container));
  container.querySelector('#wp-upload')?.addEventListener('change', async e => {
    await _handlePhotoFiles(e.target.files, container);
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
      const data = await api.post('/api/ai-assist', {
        category: wizard.category,
        kind: wizard.kind,
        category_id: wizard.marketplaceCategoryId,
        title: wizard.title,
        amenities: amenitiesNames,
        lifestyleTags: tagNames,
        draft: { ...wizard, photos: [] },
      });
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
      btn.textContent = 'AI Assist'; btn.disabled = false;
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
  if (wizard.step === _flowSteps().length) {
    const nextBtn = container.querySelector('#wp-next');
    if (nextBtn) nextBtn.disabled = !wizard._termsAccepted;
  }

  // Navigation
  container.querySelector('#wp-back')?.addEventListener('click', () => { wizard.step--; saveDraft(); _render(container); });
  container.querySelector('#wp-next')?.addEventListener('click', () => {
    _syncCurrentStep(container);
    if (wizard.step < _flowSteps().length) {
      if (!_validateStep(wizard.step)) return;
      wizard.step++; saveDraft(); _render(container);
    } else {
      _handleSubmit(container);
    }
  });
}

function _syncCurrentStep(container) {
  const value = (selector) => container.querySelector(selector)?.value ?? '';
  const checked = (selector) => !!container.querySelector(selector)?.checked;

  if (wizard.step === 2) {
    if (container.querySelector('#wp-country')) wizard.country = value('#wp-country');
    if (container.querySelector('#wp-city')) wizard.city = value('#wp-city');
    wizard.neighborhood = value('#wp-neighborhood');
    wizard.address = value('#wp-address');
  }

  if (wizard.step === 3) {
    wizard.title = value('#wp-title').trim();
    wizard.currency = value('#wp-currency') || wizard.currency;
    wizard.price = value('#wp-price');
    wizard.deposit = value('#wp-deposit');
    wizard.availableFrom = value('#wp-date');
    wizard.roomType = value('#wp-roomtype');
    wizard.minStay = value('#wp-minstay') || wizard.minStay;
    wizard.utilitiesIncluded = checked('#wp-utilities');
    wizard.bedrooms = value('#wp-beds');
    wizard.bathrooms = value('#wp-baths');
    wizard.sizeSqft = value('#wp-sqft');
    wizard.budgetMin = value('#wp-bmin');
    wizard.budgetMax = value('#wp-bmax');
    wizard.preferredArea = value('#wp-pref-area').trim();
    wizard.moveInTimeline = value('#wp-timeline');
    wizard.condition = value('#wp-condition');
    wizard.brand = value('#wp-brand').trim();
    wizard.negotiable = container.querySelector('#wp-negotiable') ? checked('#wp-negotiable') : wizard.negotiable;
    const furnished = container.querySelector('input[name="wp-furnished"]:checked');
    if (furnished) wizard.furnished = furnished.value;
    container.querySelectorAll('.wp-attr-field').forEach(input => {
      wizard.attributes = { ...(wizard.attributes || {}), [input.dataset.attr]: input.value };
    });
  }

  if ((!_isMarketplace() && wizard.step === 6) || (_isMarketplace() && wizard.step === 5)) {
    wizard.description = value('#wp-desc').trim();
  }

  saveDraft();
}

function _showPhotoSheet(container) {
  showBottomSheet({
    title: 'Add Photos',
    content: `
      <div style="display:flex; flex-direction:column; gap:10px; padding:4px;">
        <div style="font-size:0.85rem; color:#64748b; line-height:1.45;">Photos are compressed and uploaded to your media bucket before publishing.</div>
      </div>`,
    actions: [
      {
        label: 'Take Photo',
        variant: 'accent',
        closeOnClick: false,
        onClick: async () => { await _addCameraPhoto(container, CameraSource.Camera); hideBottomSheet(); },
      },
      {
        label: 'Choose From Gallery',
        closeOnClick: false,
        onClick: async () => { await _addCameraPhoto(container, CameraSource.Photos); hideBottomSheet(); },
      },
      {
        label: 'Browse Files',
        onClick: () => container.querySelector('#wp-upload')?.click(),
      },
    ],
  });
}

async function _addCameraPhoto(container, source) {
  if (wizard.photos.length >= 10) return;
  try {
    const image = await Camera.getPhoto({ quality: 88, resultType: CameraResultType.Uri, source });
    if (!image?.webPath) return;
    const res = await fetch(image.webPath);
    const blob = await res.blob();
    const file = new File([blob], 'listing-photo.jpg', { type: blob.type || 'image/jpeg' });
    await _handlePhotoFiles([file], container);
  } catch (err) {
    console.debug('[MobilePost] Camera selection unavailable:', err);
    container.querySelector('#wp-upload')?.click();
  }
}

async function _handlePhotoFiles(files, container) {
  const toUpload = Array.from(files || []).slice(0, 10 - wizard.photos.length);
  if (!toUpload.length) return;
  const status = container.querySelector('#wp-upload-status');
  if (status) status.textContent = 'Uploading photos...';

  for (const file of toUpload) {
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) { _toast(`${file.name}: unsupported format`, 'error'); continue; }
    if (file.size > 5 * 1024 * 1024) { _toast(`${file.name}: exceeds 5MB`, 'error'); continue; }
    try {
      wizard.photos.push(await processImageUpload(file));
    } catch (err) {
      console.error('[MobilePost] Upload failed:', err);
      _toast('Upload failed', 'error');
    }
  }
  saveDraft(); _render(container);
}

// ── Validation ────────────────────────────────────────────────
function _validateStep(step) {
  if (step === 1 && !wizard.kind) { _toast('Please choose a listing kind', 'error'); return false; }
  if (step === 1 && !_isMarketplace() && !wizard.category) { _toast('Please select a rental category', 'error'); return false; }
  if (step === 1 && _isMarketplace() && !wizard.marketplaceCategoryId) { _toast('Please select a marketplace category', 'error'); return false; }
  if (step === 2 && !wizard.country) { _toast('Please select a country', 'error'); return false; }
  if (step === 2 && !wizard.city) { _toast('Please select a city', 'error'); return false; }
  if (step === 3 && !wizard.title.trim()) { _toast('Title is required', 'error'); return false; }
  if (step === 3 && wizard.title.trim().length < 3) { _toast('Title must be at least 3 characters', 'error'); return false; }
  if (step === 3) {
    if (_isMarketplace()) {
      if (!wizard.price || Number(wizard.price) <= 0) { _toast('Price is required', 'error'); return false; }
      return true;
    }
    const isRoommate = wizard.category === 'roommate_wanted' || wizard.category === 'room_wanted';
    if (!isRoommate && (!wizard.price || Number(wizard.price) <= 0)) { _toast('Monthly rent is required', 'error'); return false; }
    if (isRoommate && (!wizard.budgetMax || Number(wizard.budgetMax) <= 0)) { _toast('Budget max is required', 'error'); return false; }
  }
  if (((!_isMarketplace() && step === 6) || (_isMarketplace() && step === 5)) && !wizard.description.trim()) { _toast('Description is required', 'error'); return false; }
  if (((!_isMarketplace() && step === 6) || (_isMarketplace() && step === 5)) && wizard.description.trim().length < 50) { _toast('Description must be at least 50 characters', 'error'); return false; }
  return true;
}

// ── Submit ────────────────────────────────────────────────────
async function _handleSubmit(container) {
  if (!wizard._termsAccepted) {
    _toast(isEdit ? 'Please confirm to save changes' : 'Please accept the terms to publish', 'error');
    return;
  }
  const btn = container.querySelector('#wp-next');
  if (btn) { btn.textContent = isEdit ? 'Saving…' : 'Publishing…'; btn.disabled = true; }

  try {
    const user = getCurrentUser();
    const isRoommate = wizard.category === 'roommate_wanted' || wizard.category === 'room_wanted';

    if (_isMarketplace()) {
      const selType = wizard._publishType || 'free';
      const isFeatured = selType === 'featured' || selType === 'premium';
      const isFree = user.subscription_tier === 'free';
      const listingData = {
        user_id: user.user_id || user.id,
        kind: wizard.kind,
        category_id: wizard.marketplaceCategoryId,
        title: wizard.title,
        description: wizard.description,
        price: Number(wizard.price) || 0,
        currency: wizard.currency,
        country: wizard.country,
        city: wizard.city,
        neighborhood: wizard.neighborhood,
        address: wizard.address,
        condition: wizard.condition || null,
        negotiable: wizard.negotiable ? 1 : 0,
        brand: wizard.brand || null,
        attributes: wizard.attributes || {},
        images: wizard.photos,
        status: isFree ? 'pending' : 'active',
        moderation_status: isFree ? 'pending' : 'approved',
        is_featured: isFeatured,
        view_count: 0,
      };

      const item = isEdit
        ? await db.listings.update(editListingId, { ...listingData, updated_at: new Date().toISOString() })
        : await db.listings.create(listingData);
      if (!item) throw new Error('Listing could not be saved locally.');

      if (!isEdit) {
        await db.notifications.create({
          user_id: user.user_id || user.id,
          type: isFree ? 'moderation_pending' : 'listing_approved',
          title: isFree ? 'Listing Pending Review' : 'Listing Published!',
          description: isFree ? 'Your item is pending admin approval and will go live once approved.' : 'Your item is now live and visible to local buyers.',
          website_url: `/listing/${item.listing_id}`,
        });
      }

      clearDraft();
      _toast(isEdit ? 'Listing updated successfully!' : 'Listing published successfully!');
      setTimeout(async () => {
        const mob = await getMobile();
        mob.navigate(isEdit ? 'listing' : 'dashboard', isEdit ? { id: item.listing_id } : {});
      }, 1200);
      return;
    }

    const listingData = {
      user_id: user.user_id || user.id,
      kind: 'rental',
      category: wizard.category,
      title: wizard.title,
      description: wizard.description,
      rent: isRoommate ? (parseInt(wizard.budgetMax) || 0) : (parseInt(wizard.price) || 0),
      currency: wizard.currency,
      deposit: parseInt(wizard.deposit) || 0,
      country: wizard.country,
      city: wizard.city,
      neighborhood: wizard.neighborhood,
      address: wizard.address,
      room_type: isRoommate ? null : (wizard.roomType || null),
      available_from: wizard.availableFrom,
      min_stay: wizard.minStay,
      utilities_included: wizard.utilitiesIncluded,
      lease_duration: wizard.leaseDuration,
      furnished: wizard.furnished,
      amenities: wizard.amenities,
      images: JSON.stringify(wizard.photos),
      roommate_prefs: JSON.stringify({ gender: wizard.prefGender, ageMin: wizard.prefAgeMin, ageMax: wizard.prefAgeMax, tags: wizard.lifestyleTags }),
      bedrooms: parseInt(wizard.bedrooms) || null,
      bathrooms: parseInt(wizard.bathrooms) || null,
      size_sqft: parseInt(wizard.sizeSqft) || null,
      budgetMin: wizard.budgetMin || null,
      budgetMax: wizard.budgetMax || null,
      preferredArea: wizard.preferredArea || null,
      moveInTimeline: wizard.moveInTimeline || null,
    };

    if (isEdit) {
      await db.listings.update(editListingId, listingData);
      _toast('Listing updated successfully!');
      setTimeout(async () => {
        const mob = await getMobile();
        mob.navigate('listing', { id: editListingId });
      }, 1200);
    } else {
      const isFree = user.subscription_tier === 'free';
      const selType = wizard._publishType || 'free';
      const isFeatured = selType === 'featured' || selType === 'premium';
      listingData.status = isFree ? 'pending' : 'active';
      listingData.moderation_status = isFree ? 'pending' : 'approved';
      listingData.is_featured = isFeatured;
      listingData.view_count = 0;

      const item = await db.listings.create(listingData);
      await db.notifications.create({
        user_id: user.user_id || user.id,
        type: isFree ? 'moderation_pending' : 'listing_approved',
        title: isFree ? 'Listing Pending Review' : 'Listing Published!',
        description: isFree ? 'Your listing is pending admin approval and will go live once approved.' : 'Your listing is now live and visible to all users.',
        website_url: `/listing/${item.listing_id}`,
      });

      clearDraft();
      _toast(isFree ? 'Listing submitted for review!' : 'Listing published successfully!');
      setTimeout(async () => { (await getMobile()).navigate('dashboard'); }, 1500);
    }
  } catch (err) {
    console.error('[Post] Submit error:', err);
    _toast(isEdit ? 'Failed to save changes. Please try again.' : 'Failed to publish. Please try again.', 'error');
    if (btn) { btn.textContent = isEdit ? 'Save Changes' : 'Publish Listing'; btn.disabled = false; }
  }
}

function _toast(msg, type = 'success') {
  const t = document.createElement('div');
  t.style = `position:fixed; bottom:100px; left:50%; transform:translateX(-50%); background:${type === 'success' ? '#10b981' : '#ef4444'}; color:#fff; padding:10px 20px; border-radius:12px; font-size:0.85rem; font-weight:700; z-index:10000; box-shadow:0 4px 12px rgba(0,0,0,0.1);`;
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

function _esc(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
}
