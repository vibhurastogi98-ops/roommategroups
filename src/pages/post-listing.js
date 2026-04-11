import { db } from '../services/db.js';
import { navigate } from '../router.js';
import { getCurrentUser } from '../services/auth.js';
import { renderNavbar, initNavbar } from '../components/navbar.js';
import { uploadImage } from '../services/upload.js';

// ── State Management ──
const DRAFT_KEY = 'rg_draft_listing';
const defaultDraft = {
    step: 1,
    category: '',
    city: '', neighborhood: '', address: '',
    title: '', price: '', currency: 'USD', availableFrom: '', leaseDuration: '',
    roomType: '', furnished: '', bedrooms: '', bathrooms: '', sizeSqft: '',
    budgetMin: '', budgetMax: '', preferredArea: '', moveInTimeline: '',
    amenities: [], photos: [], description: '',
    prefGender: 'Any', prefAgeMin: 18, prefAgeMax: 99, lifestyleTags: [],
};
let draft = { ...defaultDraft };

function loadDraft() {
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) { try { draft = { ...defaultDraft, ...JSON.parse(saved) }; } catch (e) { console.error('Error loading draft', e); } }
}
function saveDraft() { localStorage.setItem(DRAFT_KEY, JSON.stringify(draft)); }
function clearDraft() { localStorage.removeItem(DRAFT_KEY); draft = { ...defaultDraft }; }

// ── Image Processing ──
// Resize to fit within maxW×maxH. Returns a Promise which resolves to a Blob.
function resizeToBlob(img, maxW, maxH, quality) {
    return new Promise((resolve) => {
        let w = img.width, h = img.height;
        const ratio = Math.min(maxW / w, maxH / h, 1);
        w = Math.round(w * ratio);
        h = Math.round(h * ratio);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);

        // Try webp first, then fallback to jpeg
        canvas.toBlob((blob) => {
            resolve(blob);
        }, 'image/webp', quality);
    });
}

// Generates three compressed sizes per image for performance and uploads them.
// { thumb: URL, medium: URL, full: URL }
async function processImageUpload(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
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

                        resolve({
                            thumb: thumbUrl,
                            medium: medUrl,
                            full: fullUrl,
                        });
                    } catch (uploadErr) {
                        console.warn('[LISTING] Server upload failed, falling back to Base64:', uploadErr);
                        // Convert blobs to DataURLs for local storage
                        const toBase64 = (blob) => new Promise(res => {
                            const r = new FileReader();
                            r.onload = (ev) => res(ev.target.result);
                            r.readAsDataURL(blob);
                        });

                        const [tBase64, mBase64, fBase64] = await Promise.all([
                            toBase64(thumbBlob),
                            toBase64(medBlob),
                            toBase64(fullBlob)
                        ]);

                        resolve({
                            thumb: tBase64,
                            medium: mBase64,
                            full: fBase64,
                            isLocal: true
                        });
                    }
                } catch (err) {
                    reject(err);
                }
            };
            img.onerror = () => reject(new Error('Image failed to load'));
            img.src = e.target.result;
        };
        reader.onerror = () => reject(new Error('File reader failed'));
        reader.readAsDataURL(file);
    });
}

// Accepts both legacy string photos and new { thumb, medium, full } objects.
function getPhotoSrc(photo, size) {
    if (!photo) return '';
    if (typeof photo === 'string') return photo;
    return photo[size] || photo.medium || photo.full || photo.thumb || '';
}

// ── Progress Bar ──
function renderProgressBar() {
    const steps = ["Category", "Location", "Details", "Amenities", "Photos", "Description", "Publish"];
    const pct = ((draft.step - 1) / (steps.length - 1)) * 100;
    return `
        <nav class="pl-progress" aria-label="Listing steps">
            <div class="pl-steps-track">
                <div class="pl-track-bg"></div>
                <div class="pl-track-fill" style="width:${pct}%"></div>
                <ol class="pl-steps-list">
                    ${steps.map((label, i) => {
        const n = i + 1;
        const s = n < draft.step ? 'completed' : n === draft.step ? 'active' : 'upcoming';
        return `
                        <li class="pl-step ${s}">
                            <div class="pl-step-circle">
                                ${n < draft.step ? '<i class="fa-solid fa-check"></i>' : `<span>${n}</span>`}
                            </div>
                            <span class="pl-step-label">${label}</span>
                        </li>`;
    }).join('')}
                </ol>
            </div>
        </nav>
    `;
}

// ── Step 1: Category ──
const CAT_CONFIG = {
    room: { icon: 'fa-bed', label: 'Room for Rent', desc: 'I have a room available in a shared property.', bg: '#f5f5f5', color: '#1a1a1a' },
    apartment: { icon: 'fa-building', label: 'Apartment for Rent', desc: 'I am renting out an entire property.', bg: '#f5f5f5', color: '#1a1a1a' },
    sublet: { icon: 'fa-calendar-alt', label: 'Sublet', desc: 'I need someone to take over my lease.', bg: '#f5f5f5', color: '#1a1a1a' },
    roommate_wanted: { icon: 'fa-users', label: 'Roommate Wanted', desc: 'Looking for a roommate to find a place with.', bg: '#f5f5f5', color: '#1a1a1a' },
};

function renderStep1() {
    return `
        <div class="post-listing-step" id="step-1">
            <div class="pl-step-header">
                <h2>What kind of listing are you creating?</h2>
                <p class="step-subtitle">Select the category that best matches what you're posting.</p>
            </div>
            <div class="category-cards">
                ${Object.entries(CAT_CONFIG).map(([key, cfg]) => `
                    <div class="category-card ${draft.category === key ? 'selected' : ''}" data-cat="${key}">
                        <div class="cat-icon-wrap" style="background:${cfg.bg}">
                            <i class="fa-solid ${cfg.icon}" style="color:${cfg.color}"></i>
                        </div>
                        <div class="cat-card-body">
                            <h3>${cfg.label}</h3>
                            <p>${cfg.desc}</p>
                        </div>
                        <div class="cat-check"><i class="fa-solid fa-circle-check"></i></div>
                    </div>
                `).join('')}
            </div>
            <div class="step-actions">
                <span></span>
                <button class="btn btn-primary pl-btn-next" id="btn-next" ${draft.category ? '' : 'disabled'}>
                    Next Step <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;
}

// ── Step 2: Location ──
function renderStep2() {
    const cities = db.cities.findAll();
    let nHOptions = '<option value="">Select Neighborhood</option>';
    if (draft.city) {
        const nhs = db.neighborhoods.find(n => n.city === draft.city);
        nHOptions += nhs.map(n => `<option value="${n.neighborhood_id}" ${draft.neighborhood === n.neighborhood_id ? 'selected' : ''}>${n.name}</option>`).join('');
    }
    return `
        <div class="post-listing-step" id="step-2">
            <div class="pl-step-header">
                <h2>Where is it located?</h2>
                <p class="step-subtitle">An accurate location helps the right people find your listing.</p>
            </div>
            <div class="pl-form-card">
                <div class="form-group">
                    <label class="pl-label">City <span class="required-asterisk">*</span></label>
                    <select id="pl-city" class="form-control">
                        <option value="">Select a city</option>
                        ${cities.map(c => `<option value="${c.city_id}" ${draft.city === c.city_id ? 'selected' : ''}>${c.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label class="pl-label">Neighborhood <span class="pl-optional">Optional</span></label>
                    <select id="pl-neighborhood" class="form-control" ${!draft.city ? 'disabled' : ''}>
                        ${nHOptions}
                    </select>
                </div>
                <div class="form-group">
                    <label class="pl-label">Street Address <span class="pl-optional">Optional</span></label>
                    <div class="pl-input-group">
                        <input type="text" id="pl-address" class="form-control" placeholder="e.g. 123 Main St" value="${draft.address || ''}">
                        <button class="btn btn-outline pl-location-btn" id="btn-use-location">
                            <i class="fa-solid fa-location-crosshairs"></i> Use Current
                        </button>
                    </div>
                    <small class="form-help">Exact address is only shared with verified users you connect with.</small>
                </div>
            </div>
            <div class="mock-map-container">
                <div class="mock-map">
                    ${draft.city
            ? `<iframe width="100%" height="100%" frameborder="0" scrolling="no" src="https://www.openstreetmap.org/export/embed.html?bbox=-97.9,30.1,-97.5,30.4&amp;layer=mapnik"></iframe>`
            : `<div class="map-placeholder"><i class="fa-solid fa-map-location-dot"></i><p>Select a city to preview the map</p></div>`
        }
                </div>
            </div>
            <div class="step-actions">
                <button class="btn btn-outline pl-btn-back" id="btn-prev"><i class="fa-solid fa-arrow-left"></i> Back</button>
                <button class="btn btn-primary pl-btn-next" id="btn-next" ${draft.city ? '' : 'disabled'}>
                    Next Step <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;
}

// ── Step 3: Details ──
function renderStep3() {
    const isRoommate = draft.category === 'roommate_wanted';
    let html = `
        <div class="post-listing-step" id="step-3">
            <div class="pl-step-header">
                <h2>The Details</h2>
                <p class="step-subtitle">Let's get into the specifics of what you're offering.</p>
            </div>
            <div class="pl-form-card">
                <div class="form-group">
                    <label class="pl-label">Listing Title <span class="required-asterisk">*</span></label>
                    <input type="text" id="pl-title" class="form-control" placeholder="e.g. Sunny Room Near Downtown" value="${draft.title || ''}">
                </div>
    `;

    if (!isRoommate) {
        html += `
                <div class="form-row">
                    <div class="form-group">
                        <label class="pl-label">Monthly Rent</label>
                        <div class="pl-input-group">
                            <select id="pl-currency" class="form-control pl-currency-select">
                                <option value="USD">$</option>
                                <option value="EUR" ${draft.currency === 'EUR' ? 'selected' : ''}>€</option>
                                <option value="GBP" ${draft.currency === 'GBP' ? 'selected' : ''}>£</option>
                            </select>
                            <input type="number" id="pl-price" class="form-control" placeholder="1,200" value="${draft.price || ''}">
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="pl-label">Available From</label>
                        <input type="date" id="pl-date" class="form-control" value="${draft.availableFrom || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="pl-label">Lease Duration</label>
                    <div class="radio-pill-group">
                        ${['<3 months', '3-6 months', '6-12 months', '12+ months', 'Flexible'].map(dur => `
                            <label class="radio-pill">
                                <input type="radio" name="pl-lease" value="${dur}" ${draft.leaseDuration === dur ? 'checked' : ''}>
                                <span>${dur}</span>
                            </label>
                        `).join('')}
                    </div>
                </div>
                <div class="form-row">
                    <div class="form-group">
                        <label class="pl-label">Room Type</label>
                        <select id="pl-roomtype" class="form-control">
                            <option value="">Select type</option>
                            ${['Private Room', 'Shared Room', 'Entire Place', 'Studio'].map(rt => `
                                <option value="${rt}" ${draft.roomType === rt ? 'selected' : ''}>${rt}</option>
                            `).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label class="pl-label">Furnished?</label>
                        <div class="radio-pill-group">
                            ${['Yes', 'No', 'Partially'].map(f => `
                                <label class="radio-pill">
                                    <input type="radio" name="pl-furnished" value="${f}" ${draft.furnished === f ? 'checked' : ''}>
                                    <span>${f}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>
                <div class="form-row form-row-3">
                    <div class="form-group">
                        <label class="pl-label">Bedrooms</label>
                        <input type="number" id="pl-beds" class="form-control" min="0" value="${draft.bedrooms || ''}">
                    </div>
                    <div class="form-group">
                        <label class="pl-label">Bathrooms</label>
                        <input type="number" id="pl-baths" class="form-control" min="0" value="${draft.bathrooms || ''}">
                    </div>
                    <div class="form-group">
                        <label class="pl-label">Sqft <span class="pl-optional">Optional</span></label>
                        <input type="number" id="pl-sqft" class="form-control" value="${draft.sizeSqft || ''}">
                    </div>
                </div>
        `;
    } else {
        html += `
                <div class="form-row">
                    <div class="form-group">
                        <label class="pl-label">Budget Min</label>
                        <input type="number" id="pl-budget-min" class="form-control" placeholder="500" value="${draft.budgetMin || ''}">
                    </div>
                    <div class="form-group">
                        <label class="pl-label">Budget Max</label>
                        <input type="number" id="pl-budget-max" class="form-control" placeholder="1,500" value="${draft.budgetMax || ''}">
                    </div>
                </div>
                <div class="form-group">
                    <label class="pl-label">Preferred Areas/Neighborhoods</label>
                    <input type="text" id="pl-pref-area" class="form-control" placeholder="e.g. Downtown or Southside" value="${draft.preferredArea || ''}">
                </div>
                <div class="form-group">
                    <label class="pl-label">Move-in Timeline</label>
                    <select id="pl-timeline" class="form-control">
                        <option value="">Select timeline</option>
                        ${['ASAP', 'Within 30 days', '1-3 Months', 'Flexible'].map(t => `
                            <option value="${t}" ${draft.moveInTimeline === t ? 'selected' : ''}>${t}</option>
                        `).join('')}
                    </select>
                </div>
        `;
    }

    html += `
            </div>
            <div class="step-actions">
                <button class="btn btn-outline pl-btn-back" id="btn-prev"><i class="fa-solid fa-arrow-left"></i> Back</button>
                <button class="btn btn-primary pl-btn-next" id="btn-next" ${draft.title && draft.title.length >= 5 ? '' : 'disabled'}>
                    Next Step <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;
    return html;
}

// ── Step 4: Amenities ──
function renderStep4() {
    const amenities = db.amenities.findAll();
    return `
        <div class="post-listing-step" id="step-4">
            <div class="pl-step-header">
                <h2>Amenities</h2>
                <p class="step-subtitle">What does the property offer? Select all that apply.</p>
            </div>
            <div class="amenities-grid">
                ${amenities.map(a => `
                    <label class="custom-checkbox-card ${draft.amenities.includes(a.amenity_id) ? 'checked' : ''}">
                        <input type="checkbox" value="${a.amenity_id}" ${draft.amenities.includes(a.amenity_id) ? 'checked' : ''} class="amenity-cb">
                        <i class="fa-solid ${a.icon}"></i>
                        <span>${a.name}</span>
                        <div class="amenity-check"><i class="fa-solid fa-check"></i></div>
                    </label>
                `).join('')}
            </div>
            <div class="step-actions">
                <button class="btn btn-outline pl-btn-back" id="btn-prev"><i class="fa-solid fa-arrow-left"></i> Back</button>
                <button class="btn btn-primary pl-btn-next" id="btn-next">
                    Next Step <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;
}

// ── Step 5: Photos ──
function renderStep5() {
    return `
        <div class="post-listing-step" id="step-5">
            <div class="pl-step-header">
                <h2>Photos</h2>
                <p class="step-subtitle">Upload up to 10 photos. The first photo will be used as the cover image.</p>
            </div>
            <div class="photo-upload-zone ${draft.photos.length > 0 ? 'has-photos' : ''}" id="pl-dropzone">
                <div class="upload-content">
                    <div class="upload-icon-circle">
                        <i class="fa-solid fa-cloud-arrow-up"></i>
                    </div>
                    <h4>Drag &amp; drop photos here</h4>
                    <p>or <span class="upload-browse-link">click to browse</span> (JPG, PNG, WebP · Max 5MB each)</p>
                    <input type="file" id="pl-file-input" multiple accept="image/jpeg,image/png,image/webp" style="display:none">
                </div>
            </div>
            ${draft.photos.length > 0 ? `
            <div class="photo-preview-grid" id="pl-photo-grid">
                ${draft.photos.map((src, idx) => `
                    <div class="photo-thumbnail">
                        <img src="${getPhotoSrc(src, 'thumb')}" alt="Upload preview ${idx + 1}">
                        ${idx === 0 ? '<div class="cover-badge">COVER</div>' : ''}
                        <button class="btn-remove-photo" data-idx="${idx}" aria-label="Remove photo"><i class="fa-solid fa-xmark"></i></button>
                    </div>
                `).join('')}
            </div>` : ''}
            <div class="step-actions">
                <button class="btn btn-outline pl-btn-back" id="btn-prev"><i class="fa-solid fa-arrow-left"></i> Back</button>
                <button class="btn btn-primary pl-btn-next" id="btn-next">
                    Next Step <i class="fa-solid fa-arrow-right"></i>
                </button>
            </div>
        </div>
    `;
}

// ── Step 6: Description ──
function renderStep6() {
    const tags = db.tags.findAll();
    return `
        <div class="post-listing-step" id="step-6">
            <div class="pl-step-header">
                <h2>Description &amp; Preferences</h2>
                <p class="step-subtitle">Tell potential roommates about the place and who you're looking for.</p>
            </div>
            <div class="pl-form-card">
                <div class="form-group">
                    <div class="pl-label-row">
                        <label class="pl-label" style="margin:0">Description <span class="required-asterisk">*</span></label>
                        <button class="btn btn-sm btn-outline ai-assist-btn" id="btn-ai-assist">
                            <i class="fa-solid fa-wand-magic-sparkles"></i> AI Assist
                        </button>
                    </div>
                    <textarea id="pl-desc" class="form-control" rows="6" maxlength="2000" placeholder="Describe the space, atmosphere, neighborhood perks, house rules...">${draft.description || ''}</textarea>
                    <div class="pl-desc-footer">
                        <span class="form-help">At least 50 characters required</span>
                        <span class="char-count" id="pl-desc-count">${draft.description ? draft.description.length : 0} / 2000</span>
                    </div>
                </div>
            </div>

            <div class="pl-prefs-section">
                <h3 class="pl-prefs-title">Roommate Preferences</h3>
                <div class="pl-form-card">
                    <div class="form-group">
                        <label class="pl-label">Preferred Gender</label>
                        <div class="radio-pill-group">
                            ${['Any', 'Male', 'Female', 'Non-binary'].map(g => `
                                <label class="radio-pill">
                                    <input type="radio" name="pl-pref-gender" value="${g}" ${draft.prefGender === g ? 'checked' : ''}>
                                    <span>${g}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="pl-label">Age Range: <span id="pl-age-val" class="pl-age-display">${draft.prefAgeMin} – ${draft.prefAgeMax}</span></label>
                        <div class="pl-range-row">
                            <span class="range-hint">18</span>
                            <input type="range" id="pl-age-min" min="18" max="99" value="${draft.prefAgeMin}">
                            <input type="range" id="pl-age-max" min="18" max="99" value="${draft.prefAgeMax}">
                            <span class="range-hint">99</span>
                        </div>
                    </div>
                    <div class="form-group">
                        <label class="pl-label">Lifestyle Preferences</label>
                        <div class="lifestyle-tags">
                            ${tags.map(tag => `
                                <label class="lifestyle-tag ${draft.lifestyleTags.includes(tag.tag_id) ? 'active' : ''}">
                                    <input type="checkbox" value="${tag.tag_id}" class="pref-tag-cb" ${draft.lifestyleTags.includes(tag.tag_id) ? 'checked' : ''}>
                                    <i class="fa-solid ${tag.icon}"></i> ${tag.name}
                                </label>
                            `).join('')}
                        </div>
                    </div>
                </div>
            </div>

            <div class="step-actions">
                <button class="btn btn-outline pl-btn-back" id="btn-prev"><i class="fa-solid fa-arrow-left"></i> Back</button>
                <button class="btn btn-primary pl-btn-next" id="btn-next" ${draft.description.length >= 50 ? '' : 'disabled'}>
                    Preview Listing <i class="fa-solid fa-eye"></i>
                </button>
            </div>
        </div>
    `;
}

// ── Step 7: Publish ──
function renderStep7() {
    return `
        <div class="post-listing-step" id="step-7">
            <div class="pl-step-header">
                <div class="pl-publish-icon"><i class="fa-solid fa-rocket"></i></div>
                <h2>Ready to Publish!</h2>
                <p class="step-subtitle">Review your listing one last time before it goes live.</p>
            </div>

            <div class="preview-card">
                ${draft.photos.length > 0
            ? `<img src="${getPhotoSrc(draft.photos[0], 'medium')}" class="preview-hero" alt="Cover photo">`
            : `<div class="preview-hero placeholder"><i class="fa-solid fa-image"></i><span>No cover photo</span></div>`
        }
                <div class="preview-content">
                    <div class="preview-header">
                        <h3>${draft.title || 'Untitled Listing'}</h3>
                        <div class="preview-price">
                            ${draft.category === 'roommate_wanted'
                                ? (draft.budgetMin || draft.budgetMax
                                    ? `$${draft.budgetMin || '0'} – $${draft.budgetMax || '∞'}<span>/mo budget</span>`
                                    : '<span style="font-size:0.9rem;font-weight:500;">Budget TBD</span>')
                                : `$${draft.price || '0'}<span>/mo</span>`
                            }
                        </div>
                    </div>
                    <div class="preview-meta">
                        <span><i class="fa-solid fa-location-dot"></i> ${draft.address || 'Location set'}</span>
                        <span><i class="fa-solid fa-calendar"></i> ${draft.availableFrom || 'ASAP'}</span>
                        ${draft.amenities.length > 0 ? `<span><i class="fa-solid fa-star"></i> ${draft.amenities.length} amenities</span>` : ''}
                    </div>
                    ${draft.description ? `<p class="preview-desc">${draft.description.slice(0, 180)}${draft.description.length > 180 ? '…' : ''}</p>` : ''}
                </div>
            </div>

            <div class="publish-options">
                <label class="publish-option-card selected">
                    <input type="radio" name="publish_type" value="free" checked>
                    <div class="po-icon po-free"><i class="fa-solid fa-house"></i></div>
                    <div class="po-content">
                        <h4>Standard Listing</h4>
                        <p>Visible to all users, standard search placement</p>
                    </div>
                    <div class="po-price">Free</div>
                </label>
                <label class="publish-option-card">
                    <input type="radio" name="publish_type" value="featured">
                    <div class="po-icon po-featured"><i class="fa-solid fa-bolt"></i></div>
                    <div class="po-content">
                        <h4>Featured Listing</h4>
                        <p>Top placement in search + highlighted badge</p>
                    </div>
                    <div class="po-price">$10/wk</div>
                    <div class="po-badge">Popular</div>
                </label>
            </div>

            <div class="pl-terms-row">
                <input type="checkbox" id="pl-terms" class="pl-checkbox">
                <label for="pl-terms">
                    I agree to the Terms of Service and confirm this listing complies with local housing laws.
                </label>
            </div>

            <div class="step-actions">
                <button class="btn btn-outline pl-btn-back" id="btn-prev"><i class="fa-solid fa-arrow-left"></i> Edit Draft</button>
                <button class="btn btn-success pl-btn-publish" id="btn-publish" disabled>
                    <i class="fa-solid fa-rocket"></i> Publish Listing
                </button>
            </div>
        </div>
    `;
}

// ── Event Handlers ──
function attachEventListeners(container) {
    const btnNext = container.querySelector('#btn-next');
    const btnPrev = container.querySelector('#btn-prev');
    const btnPublish = container.querySelector('#btn-publish');

    if (btnNext) {
        btnNext.addEventListener('click', () => {
            saveStepState(); draft.step++; saveDraft(); renderFullPage(container);
        });
    }
    if (btnPrev) {
        btnPrev.addEventListener('click', () => {
            saveStepState(); if (draft.step > 1) draft.step--; saveDraft(); renderFullPage(container);
        });
    }
    if (btnPublish) btnPublish.addEventListener('click', handlePublish);

    // Step 1
    if (draft.step === 1) {
        container.querySelectorAll('.category-card').forEach(card => {
            card.addEventListener('click', (e) => {
                container.querySelectorAll('.category-card').forEach(c => c.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
                draft.category = e.currentTarget.dataset.cat;
                if (btnNext) btnNext.disabled = false;
            });
        });
    }

    // Step 2
    if (draft.step === 2) {
        const citySelect = container.querySelector('#pl-city');
        const address = container.querySelector('#pl-address');
        citySelect.addEventListener('change', (e) => {
            draft.city = e.target.value; draft.neighborhood = '';
            saveDraft();
            if (btnNext) btnNext.disabled = !draft.city;
            renderFullPage(container);
        });
        container.querySelector('#btn-use-location').addEventListener('click', () => {
            address.value = "Austonian Dr"; draft.address = address.value;
        });
    }

    // Step 3
    if (draft.step === 3) {
        const title = container.querySelector('#pl-title');
        title.addEventListener('input', (e) => {
            draft.title = e.target.value;
            if (btnNext) btnNext.disabled = draft.title.length < 5;
        });
    }

    // Step 4
    if (draft.step === 4) {
        container.querySelectorAll('.custom-checkbox-card input').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const card = e.target.closest('.custom-checkbox-card');
                if (e.target.checked) {
                    card.classList.add('checked');
                    if (!draft.amenities.includes(e.target.value)) draft.amenities.push(e.target.value);
                } else {
                    card.classList.remove('checked');
                    draft.amenities = draft.amenities.filter(id => id !== e.target.value);
                }
            });
        });
    }

    // Step 5
    if (draft.step === 5) {
        const dropzone = container.querySelector('#pl-dropzone');
        const fileInput = container.querySelector('#pl-file-input');
        dropzone.addEventListener('click', () => fileInput.click());
        dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.classList.add('dragover'); });
        dropzone.addEventListener('dragleave', () => dropzone.classList.remove('dragover'));
        dropzone.addEventListener('drop', async (e) => {
            e.preventDefault(); dropzone.classList.remove('dragover');
            if (e.dataTransfer.files.length > 0) handleFiles(e.dataTransfer.files, container);
        });
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) handleFiles(e.target.files, container);
        });
        container.querySelectorAll('.btn-remove-photo').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const idx = parseInt(e.currentTarget.dataset.idx);
                draft.photos.splice(idx, 1); renderFullPage(container);
            });
        });
    }

    // Step 6
    if (draft.step === 6) {
        const desc = container.querySelector('#pl-desc');
        const count = container.querySelector('#pl-desc-count');
        const aiBtn = container.querySelector('#btn-ai-assist');

        desc.addEventListener('input', (e) => {
            const len = e.target.value.length;
            count.textContent = `${len} / 2000`;
            draft.description = e.target.value;
            if (btnNext) btnNext.disabled = len < 50;
        });

        aiBtn.addEventListener('click', () => {
            const aiText = `Stunning ${draft.category ? draft.category.replace('_', ' ') : 'place'} located in a prime area. Features include ${draft.amenities.length} amenities, ready for move-in. Perfect for those looking for a comfortable living situation. Reach out to schedule a viewing!`;
            desc.value = aiText; draft.description = aiText;
            count.textContent = `${aiText.length} / 2000`;
            if (btnNext) btnNext.disabled = false;
        });

        const minAge = container.querySelector('#pl-age-min');
        const maxAge = container.querySelector('#pl-age-max');
        const ageVal = container.querySelector('#pl-age-val');
        const updateAge = () => {
            let min = parseInt(minAge.value), max = parseInt(maxAge.value);
            if (min > max) { min = max; minAge.value = min; }
            ageVal.textContent = `${min} – ${max}`;
            draft.prefAgeMin = min; draft.prefAgeMax = max;
        };
        minAge.addEventListener('input', updateAge);
        maxAge.addEventListener('input', updateAge);

        container.querySelectorAll('.pref-tag-cb').forEach(cb => {
            cb.addEventListener('change', (e) => {
                const label = e.target.closest('.lifestyle-tag');
                if (e.target.checked) {
                    label.classList.add('active');
                    if (!draft.lifestyleTags.includes(e.target.value)) draft.lifestyleTags.push(e.target.value);
                } else {
                    label.classList.remove('active');
                    draft.lifestyleTags = draft.lifestyleTags.filter(id => id !== e.target.value);
                }
            });
        });

        container.querySelectorAll('input[name="pl-pref-gender"]').forEach(radio => {
            radio.addEventListener('change', (e) => { draft.prefGender = e.target.value; });
        });
    }

    // Step 7
    if (draft.step === 7) {
        const terms = container.querySelector('#pl-terms');
        terms.addEventListener('change', (e) => { if (btnPublish) btnPublish.disabled = !e.target.checked; });
        container.querySelectorAll('.publish-option-card').forEach(card => {
            card.addEventListener('click', (e) => {
                container.querySelectorAll('.publish-option-card').forEach(c => c.classList.remove('selected'));
                e.currentTarget.classList.add('selected');
                e.currentTarget.querySelector('input').checked = true;
            });
        });
    }
}

async function handleFiles(files, container) {
    const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
    const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

    const toProcess = Array.from(files)
        .slice(0, 10 - draft.photos.length)
        .filter(file => {
            if (!ALLOWED_TYPES.includes(file.type)) {
                alert(`"${file.name}" is not a supported format. Use JPG, PNG, or WebP.`);
                return false;
            }
            if (file.size > MAX_SIZE_BYTES) {
                alert(`"${file.name}" exceeds the 5 MB limit.`);
                return false;
            }
            return true;
        });

    if (toProcess.length === 0) return;

    const dz = container.querySelector('#pl-dropzone');
    dz.innerHTML = `<div class="upload-content"><div class="upload-processing"><i class="fa-solid fa-spinner fa-spin"></i><p>Uploading and processing photos…</p></div></div>`;

    let uploadError = null;
    for (const file of toProcess) {
        try {
            const urls = await processImageUpload(file);
            draft.photos.push(urls);
        } catch (err) {
            console.error('[Upload] Failed for file:', file.name, err);
            uploadError = err;
            break;
        }
    }

    if (uploadError) {
        alert('One or more uploads failed. Is the server running?');
    }

    // Always re-render so successfully uploaded photos are shown
    renderFullPage(container);
}

function saveStepState() {
    const container = document.querySelector('#post-listing-root');
    if (!container) return;

    if (draft.step === 2) {
        const nh = container.querySelector('#pl-neighborhood');
        if (nh) draft.neighborhood = nh.value;
        const addr = container.querySelector('#pl-address');
        if (addr) draft.address = addr.value;
    }

    if (draft.step === 3) {
        if (draft.category !== 'roommate_wanted') {
            const price = container.querySelector('#pl-price');
            if (price) draft.price = parseInt(price.value) || 0;
            const currency = container.querySelector('#pl-currency');
            if (currency) draft.currency = currency.value;
            const date = container.querySelector('#pl-date');
            if (date) draft.availableFrom = date.value;
            const rt = container.querySelector('#pl-roomtype');
            if (rt) draft.roomType = rt.value;
            const lds = container.querySelector('input[name="pl-lease"]:checked');
            if (lds) draft.leaseDuration = lds.value;
            const fur = container.querySelector('input[name="pl-furnished"]:checked');
            if (fur) draft.furnished = fur.value;
            const beds = container.querySelector('#pl-beds');
            if (beds) draft.bedrooms = beds.value !== '' ? parseInt(beds.value) : '';
            const baths = container.querySelector('#pl-baths');
            if (baths) draft.bathrooms = baths.value !== '' ? parseInt(baths.value) : '';
            const sqft = container.querySelector('#pl-sqft');
            if (sqft) draft.sizeSqft = sqft.value !== '' ? parseInt(sqft.value) : '';
        } else {
            const bmin = container.querySelector('#pl-budget-min');
            if (bmin) draft.budgetMin = parseInt(bmin.value) || 0;
            const bmax = container.querySelector('#pl-budget-max');
            if (bmax) draft.budgetMax = parseInt(bmax.value) || 0;
            const prefArea = container.querySelector('#pl-pref-area');
            if (prefArea) draft.preferredArea = prefArea.value;
            const tl = container.querySelector('#pl-timeline');
            if (tl) draft.moveInTimeline = tl.value;
        }
    }
}

async function handlePublish() {
    const user = getCurrentUser();
    if (!user) { alert("You must be signed in to publish a listing."); navigate('/auth/login'); return; }

    const publishBtn = document.querySelector('#btn-publish');
    if (publishBtn) { publishBtn.disabled = true; publishBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Publishing…'; }

    const container = document.querySelector('#post-listing-root');
    const isFeatured = container
        ? container.querySelector('input[name="publish_type"]:checked')?.value === 'featured'
        : false;

    const listingData = {
        user_id: user.id, category: draft.category, title: draft.title, description: draft.description,
        price: draft.price, currency: draft.currency, city: draft.city, neighborhood: draft.neighborhood,
        address: draft.address, room_type: draft.roomType, available_from: draft.availableFrom,
        lease_duration: draft.leaseDuration, furnished: draft.furnished, amenities: draft.amenities,
        photos: draft.photos, roommate_prefs: { gender: draft.prefGender, ageMin: draft.prefAgeMin, ageMax: draft.prefAgeMax, tags: draft.lifestyleTags },
        status: 'active', moderation_status: 'pending', is_featured: isFeatured, views_count: 0,
        bedrooms: parseInt(draft.bedrooms) || null, bathrooms: parseInt(draft.bathrooms) || null,
        size_sqft: parseInt(draft.sizeSqft) || null,
    };

    try {
        db.listings.create(listingData);
        clearDraft();

        const toast = document.createElement('div');
        toast.className = 'toast toast-success';
        toast.textContent = 'Listing published successfully!';
        document.body.appendChild(toast);
        // Trigger CSS transition
        requestAnimationFrame(() => { requestAnimationFrame(() => { toast.classList.add('visible'); }); });
        setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 300); }, 3000);

        navigate('/dashboard');
    } catch (err) {
        console.error('[Publish] Failed to create listing:', err);
        alert('Failed to publish listing. Please try again.');
        if (publishBtn) { publishBtn.disabled = false; publishBtn.innerHTML = '<i class="fa-solid fa-rocket"></i> Publish Listing'; }
    }
}

function renderFullPage(container) {
    window.scrollTo(0, 0);
    const steps = { 1: renderStep1, 2: renderStep2, 3: renderStep3, 4: renderStep4, 5: renderStep5, 6: renderStep6, 7: renderStep7 };
    const stepContent = (steps[draft.step] || renderStep1)();

    container.innerHTML = `
        ${renderNavbar()}
        <div class="post-listing-page">
            <div class="post-listing-container">
                ${renderProgressBar()}
                <div class="step-content-wrapper fade-in">
                    ${stepContent}
                </div>
            </div>
        </div>
    `;

    attachEventListeners(container);
    setTimeout(() => initNavbar(), 0);
}

export function renderPostListingPage(container) {
    const user = getCurrentUser();
    if (!user) {
        container.innerHTML = `
            <div class="auth-page">
                <div class="auth-card" style="text-align:center;">
                    <h2>Sign In Required</h2>
                    <p>You need an account to post a listing.</p>
                    <a href="/auth/login" class="btn btn-primary mt-md" style="display:inline-block;width:auto;">Sign In</a>
                </div>
            </div>
        `;
        return;
    }
    loadDraft();
    container.innerHTML = '<div id="post-listing-root"></div>';
    renderFullPage(container.querySelector('#post-listing-root'));
}
