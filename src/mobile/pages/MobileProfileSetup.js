/**
 * src/mobile/pages/MobileProfileSetup.js
 * Onboarding page for new users to complete their profile.
 */

import { getCurrentUser, updateProfile } from '../../services/auth.js';
import { db } from '../../services/db.js';
import { uploadImage } from '../../services/upload.js';
import { Camera, CameraResultType } from '@capacitor/camera';
import { getAvatarUrl, getImageUrl } from '../../services/assets.js';

const lifestyleTags = [
    { id: 'clean', label: 'Clean', icon: 'fa-broom' },
    { id: 'social', label: 'Social', icon: 'fa-users' },
    { id: 'quiet', label: 'Quiet', icon: 'fa-volume-xmark' },
    { id: 'early-bird', label: 'Early Bird', icon: 'fa-sun' },
    { id: 'night-owl', label: 'Night Owl', icon: 'fa-moon' },
    { id: 'pet-friendly', label: 'Pet-Friendly', icon: 'fa-paw' },
    { id: 'non-smoker', label: 'Non-Smoker', icon: 'fa-ban-smoking' },
    { id: 'fitness', label: 'Fitness Enthusiast', icon: 'fa-dumbbell' },
    { id: 'remote-worker', label: 'Remote Worker', icon: 'fa-laptop-house' },
    { id: 'student', label: 'Student', icon: 'fa-graduation-cap' },
];

export async function init(container) {
    const user = getCurrentUser();
    if (!user) {
        const { navigate } = await import('../mobile-main.js');
        navigate('auth');
        return;
    }

    container.innerHTML = `
    <div style="min-height:100%; background:#fff; overflow-y:auto; padding:24px 20px 100px;">
        <div style="text-align:center; margin-bottom:32px;">
            <div class="mobile-logo-pill" style="margin: 0 auto 16px; border:1px solid #eee; width:fit-content;">
                <div class="mobile-logo-left" style="color:#000;">Roommate</div>
                <div class="mobile-logo-right" style="color:#000; opacity:0.6;">Groups</div>
            </div>
            <h1 style="font-size:1.5rem; font-weight:800; color:#1a1a1a; margin-bottom:8px;">Complete Your Profile</h1>
            <p style="font-size:0.9rem; color:#64748b;">Help potential roommates get to know you better</p>
        </div>

        <form id="mobile-profile-form" style="display:flex; flex-direction:column; gap:20px;">
            
            <!-- Photo Upload -->
            <div style="display:flex; justify-content:center; margin-bottom:10px;">
                <div id="photo-upload-trigger" style="position:relative; width:110px; height:110px; border-radius:50%; background:#f1f5f9; display:flex; flex-direction:column; align-items:center; justify-content:center; cursor:pointer; overflow:hidden; border:2px dashed #cbd5e1;">
                    <div id="photo-preview-box" style="width:100%; height:100%; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                        <i class="fas fa-camera" style="font-size:1.5rem; color:#94a3b8; margin-bottom:4px;"></i>
                        <span style="font-size:0.7rem; color:#94a3b8; font-weight:600;">Upload</span>
                    </div>
                    <input type="file" id="mobile-photo-input" accept="image/*" hidden />
                </div>
            </div>

            <!-- About Me -->
            <div class="mobile-form-group">
                <label class="mobile-form-label">About Me</label>
                <div style="position:relative;">
                    <textarea id="profile-bio" class="mobile-input" style="height:100px; padding:12px; resize:none;" placeholder="Tell potential roommates about yourself...">${user.bio || ''}</textarea>
                    <div style="position:absolute; bottom:8px; right:12px; font-size:0.7rem; color:#94a3b8;">
                        <span id="bio-count">${(user.bio || '').length}</span>/500
                    </div>
                </div>
            </div>

            <!-- Age & Occupation -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div class="mobile-form-group">
                    <label class="mobile-form-label">Age Range</label>
                    <select id="profile-age" class="mobile-input">
                        <option value="">Select</option>
                        <option value="18-24" ${user.age_range === '18-24' ? 'selected' : ''}>18-24</option>
                        <option value="25-30" ${user.age_range === '25-30' ? 'selected' : ''}>25-30</option>
                        <option value="31-35" ${user.age_range === '31-35' ? 'selected' : ''}>31-35</option>
                        <option value="36-40" ${user.age_range === '36-40' ? 'selected' : ''}>36-40</option>
                        <option value="41+" ${user.age_range === '41+' ? 'selected' : ''}>41+</option>
                    </select>
                </div>
                <div class="mobile-form-group">
                    <label class="mobile-form-label">Occupation</label>
                    <input type="text" id="profile-occupation" class="mobile-input" placeholder="e.g. Engineer" value="${user.occupation || ''}">
                </div>
            </div>

            <!-- Country & City -->
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:12px;">
                <div class="mobile-form-group">
                    <label class="mobile-form-label">Country *</label>
                    <select id="profile-country" class="mobile-input" required>
                        <option value="">Select</option>
                        ${db.countries.findAll().filter(c => c.is_active).sort((a, b) => a.name.localeCompare(b.name)).map(c => `
                            <option value="${c.country_id}" ${user.country === c.country_id ? 'selected' : ''}>
                                ${c.flag_emoji ? c.flag_emoji + ' ' : ''}${c.name}
                            </option>
                        `).join('')}
                    </select>
                </div>
                <div class="mobile-form-group">
                    <label class="mobile-form-label">City *</label>
                    <select id="profile-city" class="mobile-input" required disabled>
                        <option value="">Select country first</option>
                    </select>
                </div>
            </div>

            <!-- Lifestyle Tags -->
            <div class="mobile-form-group">
                <label class="mobile-form-label">Lifestyle & Preferences</label>
                <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:4px;" id="lifestyle-tags-container">
                    ${lifestyleTags.map(tag => `
                        <div class="ms-chip ${ (user.lifestyle_tags || []).includes(tag.id) ? 'active' : '' }" data-id="${tag.id}">
                            <i class="fas ${tag.icon}" style="margin-right:6px;"></i>
                            ${tag.label}
                        </div>
                    `).join('')}
                </div>
            </div>

            <!-- Budget -->
            <div class="mobile-form-group">
                <label class="mobile-form-label">Monthly Budget: <span id="budget-range-text" style="color:#000; font-weight:800;">$${(user.budgetMin || 500).toLocaleString()} - $${(user.budgetMax || 2500).toLocaleString()}</span></label>
                <div style="position:relative; height:40px; margin-top:10px; display:flex; align-items:center;">
                    <div style="position:absolute; width:100%; height:4px; background:#f1f5f9; border-radius:2px;"></div>
                    <div id="budget-track-fill" style="position:absolute; height:4px; background:#000; border-radius:2px; z-index:1;"></div>
                    <input type="range" id="budget-min" min="0" max="5000" step="100" value="${user.budgetMin || 500}" 
                        style="position:absolute; width:100%; pointer-events:none; -webkit-appearance:none; background:transparent; z-index:3;">
                    <input type="range" id="budget-max" min="0" max="5000" step="100" value="${user.budgetMax || 2500}" 
                        style="position:absolute; width:100%; pointer-events:none; -webkit-appearance:none; background:transparent; z-index:3;">
                </div>
                <div style="display:flex; justify-content:space-between; font-size:0.7rem; color:#94a3b8; margin-top:4px; font-weight:600;">
                    <span>$0</span>
                    <span>$5,000+</span>
                </div>
            </div>

            <!-- Timeline -->
            <div class="mobile-form-group">
                <label class="mobile-form-label">Move-in Timeline</label>
                <select id="profile-timeline" class="mobile-input">
                    <option value="">When are you looking to move?</option>
                    <option value="asap" ${user.moveInTimeline === 'asap' ? 'selected' : ''}>As soon as possible</option>
                    <option value="1-month" ${user.moveInTimeline === '1-month' ? 'selected' : ''}>Within 1 month</option>
                    <option value="1-3-months" ${user.moveInTimeline === '1-3-months' ? 'selected' : ''}>1-3 months</option>
                    <option value="3-6-months" ${user.moveInTimeline === '3-6-months' ? 'selected' : ''}>3-6 months</option>
                    <option value="flexible" ${user.moveInTimeline === 'flexible' ? 'selected' : ''}>Flexible</option>
                </select>
            </div>

            <button type="submit" id="save-profile-btn" class="mobile-btn mobile-btn-accent" style="height:54px; font-size:1.05rem; margin-top:10px; border-radius:16px; font-weight:800; background:#000; color:#fff; box-shadow: 0 8px 24px rgba(0,0,0,0.12);">
                Complete Profile & Continue
            </button>
        </form>
    </div>

    <style>
        input[type=range]::-webkit-slider-thumb {
            pointer-events: auto;
            -webkit-appearance: none;
            width: 24px;
            height: 24px;
            border-radius: 50%;
            background: #fff;
            border: 2px solid #000;
            cursor: pointer;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        .ms-chip.active {
            background: #000 !important;
            color: #fff !important;
            border-color: #000 !important;
        }
    </style>
    `;

    // ── Logic ──
    const photoTrigger = container.querySelector('#photo-upload-trigger');
    const photoInput = container.querySelector('#mobile-photo-input');
    const photoPreview = container.querySelector('#photo-preview-box');
    const saveBtn = container.querySelector('#save-profile-btn');

    // Pre-load photo
    if (user.profile_photo) {
        photoPreview.innerHTML = `<img src="${getAvatarUrl(user.profile_photo, user.display_name || user.fullName)}" style="width:100%; height:100%; object-fit:cover;">`;
        photoPreview.dataset.photo = user.profile_photo;
    }

    photoTrigger.onclick = async () => {
        try {
            const image = await Camera.getPhoto({ quality: 90, resultType: CameraResultType.Uri });
            if (image && image.webPath) {
                photoPreview.innerHTML = '<i class="fas fa-spinner fa-spin" style="color:var(--mobile-accent);"></i>';
                const res = await fetch(image.webPath);
                const blob = await res.blob();
                const file = new File([blob], 'profile.jpg', { type: 'image/jpeg' });
                try {
                    const url = await uploadImage(file, 'profile.jpg');
                    const cacheBustedUrl = `${url}?ts=${Date.now()}`;
                    photoPreview.innerHTML = `<img src="${getAvatarUrl(cacheBustedUrl)}" style="width:100%; height:100%; object-fit:cover;">`;
                    photoPreview.dataset.photo = cacheBustedUrl;
                } catch (err) {
                    console.warn('[PROFILE] Upload failed, using webPath', err);
                    photoPreview.innerHTML = `<img src="${image.webPath}" style="width:100%; height:100%; object-fit:cover;">`;
                    photoPreview.dataset.photo = image.webPath;
                }
            }
        } catch (e) {
            photoInput.click();
        }
    };

    photoInput.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        photoPreview.innerHTML = '<i class="fas fa-spinner fa-spin" style="color:var(--mobile-accent);"></i>';
        try {
            const url = await uploadImage(file, 'profile.jpg');
            const cacheBustedUrl = `${url}?ts=${Date.now()}`;
            photoPreview.innerHTML = `<img src="${getAvatarUrl(cacheBustedUrl)}" style="width:100%; height:100%; object-fit:cover;">`;
            photoPreview.dataset.photo = cacheBustedUrl;
        } catch (err) {
            const reader = new FileReader();
            reader.onload = (rv) => {
                photoPreview.innerHTML = `<img src="${rv.target.result}" style="width:100%; height:100%; object-fit:cover;">`;
                photoPreview.dataset.photo = rv.target.result;
            };
            reader.readAsDataURL(file);
        }
    };

    // Country/City
    const countrySel = container.querySelector('#profile-country');
    const citySel = container.querySelector('#profile-city');

    const updateCities = (countryId, selectedId = '') => {
        citySel.innerHTML = '<option value="">Loading...</option>';
        const cities = db.cities.find(c => c.country === countryId && c.is_active !== false).sort((a,b) => a.name.localeCompare(b.name));
        if (cities.length === 0) {
            citySel.innerHTML = '<option value="">No cities available</option>';
            citySel.disabled = true;
        } else {
            citySel.innerHTML = '<option value="">Select City</option>' + cities.map(c => `<option value="${c.city_id}" ${c.city_id === selectedId ? 'selected' : ''}>${c.name}</option>`).join('');
            citySel.disabled = false;
        }
    };

    if (user.country) updateCities(user.country, user.city || '');
    countrySel.onchange = () => updateCities(countrySel.value);

    // Bio count
    const bioIn = container.querySelector('#profile-bio');
    const bioCnt = container.querySelector('#bio-count');
    bioIn.oninput = () => bioCnt.textContent = bioIn.value.length;

    // Lifestyle tags
    container.querySelectorAll('.tag-chip').forEach(chip => {
        chip.onclick = () => chip.classList.toggle('active');
    });

    // Budget sliders
    const bMin = container.querySelector('#budget-min');
    const bMax = container.querySelector('#budget-max');
    const bText = container.querySelector('#budget-range-text');
    const bFill = container.querySelector('#budget-track-fill');

    const updateBudget = () => {
        let min = parseInt(bMin.value);
        let max = parseInt(bMax.value);
        if (min > max) { [bMin.value, bMax.value] = [max, min]; min = parseInt(bMin.value); max = parseInt(bMax.value); }
        bText.textContent = `$${min.toLocaleString()} - $${max.toLocaleString()}`;
        const minP = (min / 5000) * 100;
        const maxP = (max / 5000) * 100;
        bFill.style.left = minP + '%';
        bFill.style.width = (maxP - minP) + '%';
    };
    bMin.oninput = updateBudget;
    bMax.oninput = updateBudget;
    updateBudget();

    // Submit
    container.querySelector('#mobile-profile-form').onsubmit = async (e) => {
        e.preventDefault();
        const country = countrySel.value;
        const city = citySel.value;
        if (!country || !city) {
            alert('Please select your country and city.');
            return;
        }

        const tags = Array.from(container.querySelectorAll('.tag-chip.active')).map(c => c.dataset.id);
        const data = {
            profilePhoto: photoPreview.dataset.photo || user.profile_photo || '',
            bio: bioIn.value.trim(),
            ageRange: container.querySelector('#profile-age').value,
            occupation: container.querySelector('#profile-occupation').value.trim(),
            lifestyleTags: tags,
            budgetMin: parseInt(bMin.value),
            budgetMax: parseInt(bMax.value),
            moveInTimeline: container.querySelector('#profile-timeline').value,
            country,
            city,
        };

        saveBtn.disabled = true;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving Profile...';

        try {
            const res = await updateProfile(user.id, data);
            if (res.success) {
                const { navigate } = await import('../mobile-main.js');
                navigate('home');
            } else {
                alert('Failed to save profile: ' + res.error);
                saveBtn.disabled = false;
                saveBtn.textContent = 'Save & Continue';
            }
        } catch (err) {
            alert('Error: ' + err.message);
            saveBtn.disabled = false;
            saveBtn.textContent = 'Save & Continue';
        }
    };
}
