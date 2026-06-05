import { db } from '../services/db.js';
import { getCurrentUser } from '../services/auth.js';
import { api } from '../services/api.js';
import { showToast } from '../services/ui.js';

const CONDITION_OPTIONS = ['new', 'like_new', 'good', 'fair', 'used'];
const MIN_STAY_OPTIONS = ['flexible', '1_month', '3_months', '6_months', '12_months'];
const CURRENCY_OPTIONS = ['USD', 'EUR', 'GBP'];
const ROOM_TYPES = ['Private Room', 'Shared Room', 'Entire Place', 'Studio'];
const FURNISHED_OPTIONS = ['', 'Yes', 'No', 'Partially'];
const PROPERTY_TYPES = ['Apartment', 'House', 'Condo', 'Townhouse', 'Studio', 'Other'];

let marketplaceCategories = [];
let marketplaceCategoriesLoaded = false;
let marketplaceCategoriesLoading = false;

function escHtml(value) {
    return String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function escAttr(value) {
    return escHtml(value);
}

function parseJsonArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch {
            return [];
        }
    }
    return [];
}

function parseJsonObject(value) {
    if (value && typeof value === 'object' && !Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value || '{}');
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {};
        } catch {
            return {};
        }
    }
    return {};
}

function isPresent(value) {
    return value !== undefined && value !== null && value !== '';
}

function resolveListingKind(listing = {}) {
    const explicit = String(listing.kind || '').toLowerCase();
    if (explicit === 'sale') return 'sale';
    if (explicit === 'rental') {
        const saleShape = isPresent(listing.category_id)
            || isPresent(listing.condition)
            || isPresent(listing.brand)
            || Object.keys(parseJsonObject(listing.attributes)).length > 0
            || (isPresent(listing.price) && !isPresent(listing.rent));
        return saleShape ? 'sale' : 'rental';
    }
    return isPresent(listing.category_id) || isPresent(listing.price) ? 'sale' : 'rental';
}

function getUserId(user) {
    return user?.user_id || user?.id || null;
}

function fieldLabel(value) {
    return String(value || '')
        .replace(/^(cat|mp|nh|city)_/, '')
        .replace(/_/g, ' ')
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

function flattenCategories(categories = [], depth = 0) {
    return categories.flatMap(category => [
        { ...category, depth },
        ...flattenCategories(category.children || [], depth + 1),
    ]);
}

function getMarketplaceFlatCategories() {
    return flattenCategories(marketplaceCategories).filter(category => {
        const kind = String(category.kind || '').toLowerCase();
        return !kind || kind === 'sale' || kind === 'product' || kind === 'vehicle';
    });
}

function getSelectedMarketplaceCategory(state) {
    return getMarketplaceFlatCategories().find(cat => cat.category_id === state.marketplaceCategoryId) || null;
}

function getSchemaFields(category) {
    const schema = category?.attributes_schema;
    if (!schema) return [];
    if (Array.isArray(schema.fields)) return schema.fields;
    if (Array.isArray(schema)) return schema;
    if (typeof schema === 'object') return Object.keys(schema);
    return [];
}

function fieldInputType(name) {
    return ['year', 'mileage', 'storage'].includes(String(name).toLowerCase()) ? 'number' : 'text';
}

async function ensureMarketplaceCategories() {
    if (marketplaceCategoriesLoaded || marketplaceCategoriesLoading) return marketplaceCategories;
    marketplaceCategoriesLoading = true;
    try {
        const tree = await api.getCategoryTree(true);
        marketplaceCategories = Array.isArray(tree) ? tree : [];
        marketplaceCategoriesLoaded = true;
    } catch (err) {
        console.debug('[Listing edit] Category tree unavailable:', err);
        marketplaceCategories = [];
        marketplaceCategoriesLoaded = true;
    } finally {
        marketplaceCategoriesLoading = false;
    }
    return marketplaceCategories;
}

function ensureEditStyles() {
    if (document.getElementById('listing-edit-modal-styles')) return;
    const style = document.createElement('style');
    style.id = 'listing-edit-modal-styles';
    style.textContent = `
        .lem-overlay { position: fixed; inset: 0; z-index: 10000; background: rgba(15, 23, 42, 0.62); overflow-y: auto; padding: 28px 16px; }
        .lem-modal { width: min(960px, 100%); max-height: calc(100vh - 56px); margin: 0 auto; background: #fff; border-radius: 18px; box-shadow: 0 28px 90px rgba(15, 23, 42, 0.28); display: flex; flex-direction: column; overflow: hidden; }
        .lem-header { display: flex; align-items: center; justify-content: space-between; gap: 16px; padding: 20px 24px; border-bottom: 1px solid #e2e8f0; }
        .lem-title { margin: 0; color: #1e293b; font-size: 1.25rem; font-weight: 800; }
        .lem-close { width: 38px; height: 38px; border: 0; border-radius: 10px; background: #f8fafc; color: #475569; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; font-size: 1rem; }
        .lem-close:hover { background: #f1f5f9; color: #0f172a; }
        .lem-content { overflow-y: auto; padding: 24px; }
        .lem-form { display: grid; gap: 22px; }
        .lem-section { border: 1px solid #e2e8f0; border-radius: 14px; padding: 18px; background: #fff; }
        .lem-section-title { margin: 0 0 16px; display: flex; align-items: center; gap: 9px; color: #0f172a; font-size: 1rem; font-weight: 800; }
        .lem-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
        .lem-grid-3 { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px; }
        .lem-field { min-width: 0; }
        .lem-label { display: block; margin-bottom: 6px; color: #475569; font-size: 0.84rem; font-weight: 700; }
        .lem-control { width: 100%; border: 1.5px solid #dbe3ef; border-radius: 10px; background: #fff; color: #0f172a; min-height: 44px; padding: 10px 12px; font: inherit; font-size: 0.94rem; outline: none; }
        .lem-control:focus { border-color: #1a1a1a; box-shadow: 0 0 0 3px rgba(0, 0, 0, 0.08); }
        textarea.lem-control { min-height: 132px; resize: vertical; line-height: 1.55; }
        .lem-help { margin-top: 6px; color: #94a3b8; font-size: 0.78rem; }
        .lem-toggle-row { display: flex; align-items: center; justify-content: space-between; gap: 14px; min-height: 44px; padding: 10px 12px; border: 1px solid #e2e8f0; border-radius: 10px; background: #f8fafc; }
        .lem-toggle-row span { color: #475569; font-size: 0.9rem; font-weight: 700; }
        .lem-toggle-row input { width: 19px; height: 19px; accent-color: #1a1a1a; }
        .lem-check-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(160px, 1fr)); gap: 10px; }
        .lem-check-card { min-height: 42px; display: flex; align-items: center; gap: 9px; padding: 10px 12px; border: 1.5px solid #e2e8f0; border-radius: 10px; cursor: pointer; color: #475569; font-weight: 700; font-size: 0.86rem; background: #fff; }
        .lem-check-card.active { border-color: #1a1a1a; background: #f5f5f5; color: #0f172a; }
        .lem-check-card input { display: none; }
        .lem-footer { display: flex; justify-content: flex-end; gap: 12px; padding: 16px 24px; border-top: 1px solid #e2e8f0; background: #fff; }
        .lem-btn { border: 1.5px solid #dbe3ef; border-radius: 10px; min-height: 44px; padding: 0 18px; display: inline-flex; align-items: center; justify-content: center; gap: 8px; cursor: pointer; font-weight: 800; font-size: 0.94rem; background: #fff; color: #1e293b; }
        .lem-btn:hover { background: #f8fafc; }
        .lem-btn-primary { background: #1a1a1a; border-color: #1a1a1a; color: #fff; }
        .lem-btn-primary:hover { background: #000; }
        .lem-btn:disabled { opacity: .65; cursor: not-allowed; }
        .lem-empty-note { color: #64748b; font-size: 0.9rem; margin: 0; }
        @media (max-width: 720px) {
            .lem-overlay { padding: 0; }
            .lem-modal { min-height: 100vh; max-height: none; border-radius: 0; }
            .lem-content { padding: 18px; }
            .lem-grid, .lem-grid-3 { grid-template-columns: 1fr; }
            .lem-footer { position: sticky; bottom: 0; }
        }
    `;
    document.head.appendChild(style);
}

function createState(listing) {
    const kind = resolveListingKind(listing);
    const prefs = parseJsonObject(listing.roommate_prefs);
    return {
        kind,
        category: listing.category || (kind === 'rental' ? 'room' : ''),
        marketplaceCategoryId: listing.category_id || '',
        title: listing.title || '',
        price: kind === 'sale' ? (listing.price ?? listing.rent ?? '') : (listing.rent ?? listing.price ?? ''),
        currency: listing.currency || listing.price_currency || 'USD',
        description: listing.description || '',
        availableFrom: (listing.available_from || listing.available_date || listing.move_in_date || '').slice(0, 10),
        leaseDuration: listing.lease_duration || listing.lease_term || '',
        minStay: listing.min_stay || listing.min_stay_months || 'flexible',
        roomType: listing.room_type || '',
        furnished: listing.furnished || '',
        bedrooms: listing.bedrooms ?? '',
        bathrooms: listing.bathrooms ?? '',
        sizeSqft: listing.size_sqft ?? '',
        propertyType: listing.property_type || 'Apartment',
        petsAllowed: listing.pets_allowed || 'no',
        privateBathroom: !!listing.private_bathroom,
        deposit: listing.deposit ?? '',
        utilitiesIncluded: !!listing.utilities_included,
        budgetMin: listing.budgetMin ?? '',
        budgetMax: listing.budgetMax ?? '',
        preferredArea: listing.preferredArea || '',
        moveInTimeline: listing.moveInTimeline || '',
        amenities: parseJsonArray(listing.amenities),
        prefGender: prefs.gender || 'Any',
        prefAgeMin: prefs.ageMin || 18,
        prefAgeMax: prefs.ageMax || 99,
        lifestyleTags: parseJsonArray(prefs.tags),
        condition: listing.condition || '',
        negotiable: listing.negotiable !== undefined ? !!listing.negotiable : true,
        brand: listing.brand || '',
        attributes: parseJsonObject(listing.attributes),
        saving: false,
    };
}

function renderOptions(options, selectedValue, labeler = value => value) {
    return options.map(option => {
        const value = typeof option === 'object' ? option.value ?? option.id : option;
        const label = typeof option === 'object' ? option.label ?? option.name ?? value : labeler(option);
        return `<option value="${escAttr(value)}" ${String(selectedValue) === String(value) ? 'selected' : ''}>${escHtml(label)}</option>`;
    }).join('');
}

function renderAttributeFields(state) {
    const selectedCategory = getSelectedMarketplaceCategory(state);
    const fields = getSchemaFields(selectedCategory).filter(name => !['brand', 'condition'].includes(String(name).toLowerCase()));
    if (!fields.length) return '';
    return `
        <div class="lem-grid">
            ${fields.map(name => `
                <div class="lem-field">
                    <label class="lem-label">${escHtml(fieldLabel(name))}</label>
                    <input class="lem-control lem-attr-field" type="${fieldInputType(name)}" data-attr="${escAttr(name)}" value="${escAttr(state.attributes?.[name] || '')}">
                </div>
            `).join('')}
        </div>
    `;
}

function renderAmenities(state) {
    const amenities = db.amenities.findAll();
    if (!amenities.length) return '<p class="lem-empty-note">No amenities are available yet.</p>';
    return `
        <div class="lem-check-grid">
            ${amenities.map(amenity => {
                const checked = state.amenities.includes(amenity.amenity_id);
                return `
                    <label class="lem-check-card ${checked ? 'active' : ''}">
                        <input type="checkbox" class="lem-amenity" value="${escAttr(amenity.amenity_id)}" ${checked ? 'checked' : ''}>
                        <i class="fa-solid ${escAttr(amenity.icon || 'fa-check')}"></i>
                        <span>${escHtml(amenity.name || amenity.amenity_id)}</span>
                    </label>
                `;
            }).join('')}
        </div>
    `;
}

function renderLifestyleTags(state) {
    const tags = db.tags.findAll();
    if (!tags.length) return '';
    return `
        <div class="lem-check-grid">
            ${tags.map(tag => {
                const checked = state.lifestyleTags.includes(tag.tag_id);
                return `
                    <label class="lem-check-card ${checked ? 'active' : ''}">
                        <input type="checkbox" class="lem-tag" value="${escAttr(tag.tag_id)}" ${checked ? 'checked' : ''}>
                        <i class="fa-solid ${escAttr(tag.icon || 'fa-tag')}"></i>
                        <span>${escHtml(tag.name || tag.tag_id)}</span>
                    </label>
                `;
            }).join('')}
        </div>
    `;
}

function renderRentalDetails(state) {
    const isRoommate = state.category === 'roommate_wanted' || state.category === 'room_wanted';
    return `
        <section class="lem-section">
            <h4 class="lem-section-title"><i class="fa-solid fa-house"></i> Rental Details</h4>
            ${isRoommate ? `
                <div class="lem-grid">
                    <div class="lem-field">
                        <label class="lem-label">Budget Min</label>
                        <input class="lem-control" id="lem-budget-min" type="number" min="0" value="${escAttr(state.budgetMin)}">
                    </div>
                    <div class="lem-field">
                        <label class="lem-label">Budget Max</label>
                        <input class="lem-control" id="lem-budget-max" type="number" min="0" value="${escAttr(state.budgetMax || state.price)}">
                    </div>
                    <div class="lem-field">
                        <label class="lem-label">Preferred Area</label>
                        <input class="lem-control" id="lem-preferred-area" value="${escAttr(state.preferredArea)}">
                    </div>
                    <div class="lem-field">
                        <label class="lem-label">Move-in Timeline</label>
                        <select class="lem-control" id="lem-move-timeline">
                            ${renderOptions(['', 'ASAP', 'Within 30 days', '1-3 Months', 'Flexible'], state.moveInTimeline, value => value || 'Select timeline')}
                        </select>
                    </div>
                </div>
            ` : `
                <div class="lem-grid">
                    <div class="lem-field">
                        <label class="lem-label">Available From</label>
                        <input class="lem-control" id="lem-available-from" type="date" value="${escAttr(state.availableFrom)}">
                    </div>
                    <div class="lem-field">
                        <label class="lem-label">Lease Duration</label>
                        <select class="lem-control" id="lem-lease-duration">
                            ${renderOptions(['', '<3 months', '3-6 months', '6-12 months', '12+ months', 'Flexible'], state.leaseDuration, value => value || 'Select duration')}
                        </select>
                    </div>
                    <div class="lem-field">
                        <label class="lem-label">Room Type</label>
                        <select class="lem-control" id="lem-room-type">
                            ${renderOptions(['', ...ROOM_TYPES], state.roomType, value => value || 'Select room type')}
                        </select>
                    </div>
                    <div class="lem-field">
                        <label class="lem-label">Furnished</label>
                        <select class="lem-control" id="lem-furnished">
                            ${renderOptions(FURNISHED_OPTIONS, state.furnished, value => value || 'Select furnished')}
                        </select>
                    </div>
                    <div class="lem-field">
                        <label class="lem-label">Property Type</label>
                        <select class="lem-control" id="lem-property-type">
                            ${renderOptions(PROPERTY_TYPES, state.propertyType)}
                        </select>
                    </div>
                    <div class="lem-field">
                        <label class="lem-label">Min. Stay</label>
                        <select class="lem-control" id="lem-min-stay">
                            ${renderOptions(MIN_STAY_OPTIONS, state.minStay, fieldLabel)}
                        </select>
                    </div>
                </div>
                <div class="lem-grid-3" style="margin-top:14px;">
                    <div class="lem-field">
                        <label class="lem-label">Bedrooms</label>
                        <input class="lem-control" id="lem-bedrooms" type="number" min="0" value="${escAttr(state.bedrooms)}">
                    </div>
                    <div class="lem-field">
                        <label class="lem-label">Bathrooms</label>
                        <input class="lem-control" id="lem-bathrooms" type="number" min="0" step="0.5" value="${escAttr(state.bathrooms)}">
                    </div>
                    <div class="lem-field">
                        <label class="lem-label">Size Sqft</label>
                        <input class="lem-control" id="lem-size-sqft" type="number" min="0" value="${escAttr(state.sizeSqft)}">
                    </div>
                </div>
                <div class="lem-grid" style="margin-top:14px;">
                    <div class="lem-field">
                        <label class="lem-label">Deposit</label>
                        <input class="lem-control" id="lem-deposit" type="number" min="0" value="${escAttr(state.deposit)}">
                    </div>
                    <div class="lem-field">
                        <label class="lem-label">Pets Allowed</label>
                        <select class="lem-control" id="lem-pets-allowed">
                            ${renderOptions(['yes', 'no'], state.petsAllowed, fieldLabel)}
                        </select>
                    </div>
                    <label class="lem-toggle-row">
                        <span>Utilities Included</span>
                        <input type="checkbox" id="lem-utilities" ${state.utilitiesIncluded ? 'checked' : ''}>
                    </label>
                    <label class="lem-toggle-row">
                        <span>Private Bathroom</span>
                        <input type="checkbox" id="lem-private-bathroom" ${state.privateBathroom ? 'checked' : ''}>
                    </label>
                </div>
            `}
        </section>
        ${isRoommate ? '' : `
            <section class="lem-section">
                <h4 class="lem-section-title"><i class="fa-solid fa-wand-magic-sparkles"></i> Amenities</h4>
                ${renderAmenities(state)}
            </section>
        `}
        <section class="lem-section">
            <h4 class="lem-section-title"><i class="fa-solid fa-user-group"></i> Roommate Preferences</h4>
            <div class="lem-grid-3">
                <div class="lem-field">
                    <label class="lem-label">Preferred Gender</label>
                    <select class="lem-control" id="lem-pref-gender">
                        ${renderOptions(['Any', 'Male', 'Female', 'Non-binary'], state.prefGender)}
                    </select>
                </div>
                <div class="lem-field">
                    <label class="lem-label">Age Min</label>
                    <input class="lem-control" id="lem-pref-age-min" type="number" min="18" max="99" value="${escAttr(state.prefAgeMin)}">
                </div>
                <div class="lem-field">
                    <label class="lem-label">Age Max</label>
                    <input class="lem-control" id="lem-pref-age-max" type="number" min="18" max="99" value="${escAttr(state.prefAgeMax)}">
                </div>
            </div>
            <div style="margin-top:14px;">${renderLifestyleTags(state)}</div>
        </section>
    `;
}

function renderMarketplaceDetails(state) {
    const attributeFields = renderAttributeFields(state);
    return `
        <section class="lem-section">
            <h4 class="lem-section-title"><i class="fa-solid fa-tag"></i> Marketplace Details</h4>
            <div class="lem-grid">
                <div class="lem-field">
                    <label class="lem-label">Condition</label>
                    <select class="lem-control" id="lem-condition">
                        ${renderOptions(['', ...CONDITION_OPTIONS], state.condition, value => value ? fieldLabel(value) : 'Select condition')}
                    </select>
                </div>
                <div class="lem-field">
                    <label class="lem-label">Brand</label>
                    <input class="lem-control" id="lem-brand" value="${escAttr(state.brand)}" placeholder="e.g. Apple, IKEA, Toyota">
                </div>
                <label class="lem-toggle-row">
                    <span>Accept offers</span>
                    <input type="checkbox" id="lem-negotiable" ${state.negotiable ? 'checked' : ''}>
                </label>
            </div>
            ${attributeFields ? `<div style="margin-top:14px;">${attributeFields}</div>` : ''}
        </section>
    `;
}

function renderModal(state) {
    const isSale = state.kind === 'sale';
    return `
        <div class="lem-modal" role="dialog" aria-modal="true" aria-labelledby="lem-title">
            <div class="lem-header">
                <h3 class="lem-title" id="lem-title">Edit Listing</h3>
                <button type="button" class="lem-close" data-lem-close aria-label="Close edit listing"><i class="fa-solid fa-xmark"></i></button>
            </div>
            <div class="lem-content">
                <form class="lem-form" id="lem-form">
                    <section class="lem-section">
                        <h4 class="lem-section-title"><i class="fa-solid fa-pen-to-square"></i> Basics</h4>
                        <div class="lem-grid">
                            <div class="lem-field">
                                <label class="lem-label">Title *</label>
                                <input class="lem-control" id="lem-listing-title" value="${escAttr(state.title)}" maxlength="120" required>
                            </div>
                            <div class="lem-field">
                                <label class="lem-label">${isSale ? 'Price *' : 'Rent or Budget *'}</label>
                                <div style="display:grid;grid-template-columns:84px 1fr;gap:8px;">
                                    <select class="lem-control" id="lem-currency">${renderOptions(CURRENCY_OPTIONS, state.currency)}</select>
                                    <input class="lem-control" id="lem-price" type="number" min="0" step="0.01" value="${escAttr(state.price)}" required>
                                </div>
                            </div>
                        </div>
                        <div class="lem-field" style="margin-top:14px;">
                            <label class="lem-label">Description</label>
                            <textarea class="lem-control" id="lem-description" maxlength="2000">${escHtml(state.description)}</textarea>
                            <div class="lem-help">Keep it clear and specific so people know what changed.</div>
                        </div>
                    </section>

                    ${isSale ? renderMarketplaceDetails(state) : renderRentalDetails(state)}
                </form>
            </div>
            <div class="lem-footer">
                <button type="button" class="lem-btn" data-lem-close>Cancel</button>
                <button type="button" class="lem-btn lem-btn-primary" id="lem-save" ${state.saving ? 'disabled' : ''}>
                    <i class="fa-solid ${state.saving ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}"></i>
                    ${state.saving ? 'Saving...' : 'Save Changes'}
                </button>
            </div>
        </div>
    `;
}

function readFormState(root, state) {
    const value = selector => root.querySelector(selector)?.value ?? '';
    const checked = selector => !!root.querySelector(selector)?.checked;

    state.title = value('#lem-listing-title').trim();
    state.price = value('#lem-price');
    state.currency = value('#lem-currency') || 'USD';
    state.description = value('#lem-description').trim();

    if (state.kind === 'sale') {
        state.condition = value('#lem-condition');
        state.brand = value('#lem-brand').trim();
        state.negotiable = checked('#lem-negotiable');
        const attrs = { ...(state.attributes || {}) };
        root.querySelectorAll('.lem-attr-field').forEach(input => {
            attrs[input.dataset.attr] = input.value.trim();
        });
        state.attributes = attrs;
        return;
    }

    state.availableFrom = value('#lem-available-from');
    state.leaseDuration = value('#lem-lease-duration');
    state.minStay = value('#lem-min-stay') || state.minStay;
    state.roomType = value('#lem-room-type');
    state.furnished = value('#lem-furnished');
    state.propertyType = value('#lem-property-type') || state.propertyType;
    state.petsAllowed = value('#lem-pets-allowed') || state.petsAllowed;
    state.privateBathroom = checked('#lem-private-bathroom');
    state.utilitiesIncluded = checked('#lem-utilities');
    state.bedrooms = value('#lem-bedrooms');
    state.bathrooms = value('#lem-bathrooms');
    state.sizeSqft = value('#lem-size-sqft');
    state.deposit = value('#lem-deposit');
    state.budgetMin = value('#lem-budget-min');
    state.budgetMax = value('#lem-budget-max') || state.price;
    state.preferredArea = value('#lem-preferred-area').trim();
    state.moveInTimeline = value('#lem-move-timeline');
    state.prefGender = value('#lem-pref-gender') || 'Any';
    state.prefAgeMin = Number(value('#lem-pref-age-min')) || 18;
    state.prefAgeMax = Number(value('#lem-pref-age-max')) || 99;
}

function cleanObject(obj) {
    return Object.fromEntries(Object.entries(obj || {}).filter(([, value]) => value !== undefined && value !== null && value !== ''));
}

function toNumber(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
}

function toNullableNumber(value) {
    if (value === undefined || value === null || value === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function buildUpdates(state) {
    const base = {
        title: state.title,
        description: state.description,
        currency: state.currency,
    };

    if (state.kind === 'sale') {
        return {
            ...base,
            price: toNumber(state.price),
            condition: state.condition || null,
            negotiable: !!state.negotiable,
            brand: state.brand || null,
            attributes: cleanObject(state.attributes),
        };
    }

    const rent = toNumber(state.price);
    return {
        ...base,
        rent,
        room_type: state.roomType,
        available_from: state.availableFrom,
        available_date: state.availableFrom,
        lease_duration: state.leaseDuration,
        lease_term: state.leaseDuration,
        furnished: state.furnished,
        amenities: state.amenities,
        roommate_prefs: {
            gender: state.prefGender,
            ageMin: state.prefAgeMin,
            ageMax: state.prefAgeMax,
            tags: state.lifestyleTags,
        },
        deposit: toNumber(state.deposit),
        min_stay: state.minStay,
        min_stay_months: state.minStay,
        utilities_included: !!state.utilitiesIncluded,
        bedrooms: toNullableNumber(state.bedrooms),
        bathrooms: toNullableNumber(state.bathrooms),
        size_sqft: toNullableNumber(state.sizeSqft),
        property_type: state.propertyType,
        pets_allowed: state.petsAllowed,
        private_bathroom: !!state.privateBathroom,
        budgetMin: toNullableNumber(state.budgetMin),
        budgetMax: toNullableNumber(state.budgetMax) || rent,
        preferredArea: state.preferredArea || null,
        moveInTimeline: state.moveInTimeline || null,
    };
}

function validateState(state) {
    if (!state.title || state.title.length < 3) return 'Title must be at least 3 characters.';
    if (!Number.isFinite(Number(state.price)) || Number(state.price) <= 0) return 'Enter a valid price.';
    return '';
}

export async function openListingEditModal(listingId, options = {}) {
    const listing = db.listings.findById(listingId);
    if (!listing) {
        showToast('Listing not found.', 'error');
        return;
    }

    const user = getCurrentUser();
    const userId = getUserId(user);
    if (!userId || listing.user_id !== userId) {
        showToast('You do not have permission to edit this listing.', 'error');
        return;
    }

    ensureEditStyles();
    const existing = document.getElementById('rg-listing-edit-overlay');
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = 'rg-listing-edit-overlay';
    overlay.className = 'lem-overlay';
    document.body.appendChild(overlay);

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const state = createState(listing);

    const close = () => {
        document.body.style.overflow = previousOverflow;
        overlay.remove();
    };

    const rerender = () => {
        overlay.innerHTML = renderModal(state);
        bind();
    };

    const maybeLoadMarketplaceCategories = async () => {
        if (state.kind !== 'sale' || marketplaceCategoriesLoaded || marketplaceCategoriesLoading) return;
        await ensureMarketplaceCategories();
        if (overlay.isConnected) rerender();
    };

    const save = async () => {
        const modal = overlay.querySelector('.lem-modal');
        readFormState(modal, state);
        const error = validateState(state);
        if (error) {
            showToast(error, 'error');
            return;
        }

        state.saving = true;
        rerender();
        try {
            const updates = buildUpdates(state);
            const updated = await db.listings.update(listingId, updates);
            if (!updated) throw new Error('Listing could not be updated.');
            showToast('Listing updated successfully.', 'success');
            close();
            options.onSaved?.(updated);
        } catch (err) {
            console.error('[Listing edit] Save failed:', err);
            showToast(err.message || 'Could not update listing.', 'error');
            state.saving = false;
            rerender();
        }
    };

    function bind() {
        overlay.onclick = event => {
            if (event.target === overlay) close();
        };

        overlay.querySelectorAll('[data-lem-close]').forEach(button => {
            button.addEventListener('click', close);
        });

        overlay.querySelector('#lem-save')?.addEventListener('click', save);
        overlay.querySelector('#lem-form')?.addEventListener('submit', event => {
            event.preventDefault();
            save();
        });

        overlay.querySelectorAll('.lem-amenity').forEach(input => {
            input.addEventListener('change', event => {
                const value = event.target.value;
                event.target.closest('.lem-check-card')?.classList.toggle('active', event.target.checked);
                state.amenities = event.target.checked
                    ? Array.from(new Set([...state.amenities, value]))
                    : state.amenities.filter(item => item !== value);
            });
        });

        overlay.querySelectorAll('.lem-tag').forEach(input => {
            input.addEventListener('change', event => {
                const value = event.target.value;
                event.target.closest('.lem-check-card')?.classList.toggle('active', event.target.checked);
                state.lifestyleTags = event.target.checked
                    ? Array.from(new Set([...state.lifestyleTags, value]))
                    : state.lifestyleTags.filter(item => item !== value);
            });
        });

    }

    rerender();
    maybeLoadMarketplaceCategories();
}
