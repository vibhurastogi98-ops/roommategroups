import { getCurrentUser, updateProfile } from '../services/auth.js';
import { navigate } from '../router.js';
import { db } from '../services/db.js';
import { uploadImage } from '../services/upload.js';

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

export function renderProfileSetupPage(app) {
    const user = getCurrentUser();
    if (!user) {
        navigate('/auth/login');
        return;
    }

    app.innerHTML = `
    <div class="auth-page profile-setup-page">
      <div class="auth-card auth-card-wide">
        <div class="auth-header">
          <div class="auth-logo no-link">
            <span class="logo-badge"><span class="logo-badge-left">Roommate</span><span class="logo-badge-right">Groups</span></span>
          </div>
          <h1>Complete Your Profile</h1>
          <p>Help potential roommates get to know you better</p>
        </div>

        <form class="auth-form profile-form" id="profile-form" novalidate>
          <!-- Photo Upload -->
          <div class="form-group form-group-centered">
            <div class="photo-upload" id="photo-upload">
              <div class="photo-preview" id="photo-preview">
                <i class="fas fa-camera"></i>
                <span>Upload Photo</span>
              </div>
              <input type="file" id="photo-input" accept="image/*" hidden />
            </div>
          </div>

          <!-- Bio -->
          <div class="form-group">
            <label for="profile-bio">About Me</label>
            <textarea id="profile-bio" class="form-input form-textarea" placeholder="Tell potential roommates about yourself..." maxlength="500" rows="4">${user.bio || ''}</textarea>
            <div class="char-counter">
              <span id="bio-count">${(user.bio || '').length}</span>/500
            </div>
          </div>

          <!-- Two-column row -->
          <div class="form-row-2col">
            <div class="form-group">
              <label for="profile-age">Age Range</label>
              <div class="input-wrapper">
                <i class="fas fa-cake-candles"></i>
                <select id="profile-age" class="form-input form-select">
                  <option value="">Select age range</option>
                  <option value="18-24" ${user.age_range === '18-24' ? 'selected' : ''}>18-24</option>
                  <option value="25-30" ${user.age_range === '25-30' ? 'selected' : ''}>25-30</option>
                  <option value="31-35" ${user.age_range === '31-35' ? 'selected' : ''}>31-35</option>
                  <option value="36-40" ${user.age_range === '36-40' ? 'selected' : ''}>36-40</option>
                  <option value="41+" ${user.age_range === '41+' ? 'selected' : ''}>41+</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label for="profile-occupation">Occupation</label>
              <div class="input-wrapper">
                <i class="fas fa-briefcase"></i>
                <input type="text" id="profile-occupation" class="form-input" placeholder="e.g. Software Engineer" value="${user.occupation || ''}" />
              </div>
            </div>
          </div>

          <!-- Country & City -->
          <div class="form-row-2col">
            <div class="form-group">
              <label for="profile-country">Country <span style="color:#e53e3e">*</span></label>
              <div class="input-wrapper">
                <i class="fas fa-globe"></i>
                <select id="profile-country" class="form-input form-select" required>
                  <option value="">Select your country</option>
                  ${db.countries.findAll().filter(c => c.is_active).sort((a, b) => a.name.localeCompare(b.name)).map(c => `<option value="${c.country_id}" ${user.country === c.country_id ? 'selected' : ''}>${c.flag_emoji ? c.flag_emoji + ' ' : ''}${c.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-error" id="profile-country-error"></div>
            </div>

            <div class="form-group">
              <label for="profile-city">City <span style="color:#e53e3e">*</span></label>
              <div class="input-wrapper">
                <i class="fas fa-location-dot"></i>
                <select id="profile-city" class="form-input form-select" required disabled>
                  <option value="">Select a country first</option>
                </select>
              </div>
              <div class="form-error" id="profile-city-error"></div>
            </div>
          </div>

          <!-- Lifestyle Tags -->
          <div class="form-group">
            <label>Lifestyle &amp; Preferences</label>
            <p class="form-hint">Select all that apply</p>
            <div class="lifestyle-tags" id="lifestyle-tags">
              ${lifestyleTags.map(tag => `
                <label class="tag-pill ${(user.lifestyle_tags || []).includes(tag.id) ? 'active' : ''}">
                  <input type="checkbox" value="${tag.id}" ${(user.lifestyle_tags || []).includes(tag.id) ? 'checked' : ''} />
                  <i class="fas ${tag.icon}"></i>
                  ${tag.label}
                </label>
              `).join('')}
            </div>
          </div>

          <!-- Budget Range -->
          <div class="form-group">
            <label>Monthly Budget</label>
            <div class="budget-display">
              <span id="budget-min-display">$${user.budgetMin || 500}</span>
              <span class="budget-separator">—</span>
              <span id="budget-max-display">$${user.budgetMax || 2500}</span>
            </div>
            <div class="range-slider-container">
              <input type="range" id="budget-min" class="range-slider" min="0" max="5000" step="100" value="${user.budgetMin || 500}" />
              <input type="range" id="budget-max" class="range-slider" min="0" max="5000" step="100" value="${user.budgetMax || 2500}" />
              <div class="range-track">
                <div class="range-fill" id="range-fill"></div>
              </div>
            </div>
            <div class="range-labels">
              <span>$0</span>
              <span>$5,000</span>
            </div>
          </div>

          <!-- Move-in Timeline -->
          <div class="form-group">
            <label for="profile-timeline">Move-in Timeline</label>
            <div class="input-wrapper">
              <i class="fas fa-calendar-days"></i>
              <select id="profile-timeline" class="form-input form-select">
                <option value="">When are you looking to move?</option>
                <option value="asap" ${user.moveInTimeline === 'asap' ? 'selected' : ''}>As soon as possible</option>
                <option value="1-month" ${user.moveInTimeline === '1-month' ? 'selected' : ''}>Within 1 month</option>
                <option value="1-3-months" ${user.moveInTimeline === '1-3-months' ? 'selected' : ''}>1-3 months</option>
                <option value="3-6-months" ${user.moveInTimeline === '3-6-months' ? 'selected' : ''}>3-6 months</option>
                <option value="flexible" ${user.moveInTimeline === 'flexible' ? 'selected' : ''}>Flexible</option>
              </select>
            </div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg auth-submit" id="save-profile-btn">
            Save &amp; Continue
          </button>

        </form>
      </div>
    </div>

    <div class="toast" id="toast"></div>
  `;

    // ── Photo Upload ──
    const photoUpload = document.getElementById('photo-upload');
    const photoInput = document.getElementById('photo-input');
    const photoPreview = document.getElementById('photo-preview');

    // Pre-load existing profile photo (e.g. from Google sign-in)
    if (user.profile_photo) {
        photoPreview.innerHTML = `<img src="${user.profile_photo}" alt="Profile photo" />`;
        photoPreview.dataset.photo = user.profile_photo;
    }

    photoUpload.addEventListener('click', () => photoInput.click());

    photoInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            showToast('Image must be smaller than 5MB', 'error');
            return;
        }

        // Show loading state
        photoPreview.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        
        try {
            const imageUrl = await uploadImage(file, 'profile.jpg');
            photoPreview.innerHTML = `<img src="${imageUrl}" alt="Profile photo" />`;
            photoPreview.dataset.photo = imageUrl;
            showToast('Photo uploaded successfully', 'success');
        } catch (err) {
            showToast('Upload failed: ' + err.message, 'error');
            photoPreview.innerHTML = '<i class="fas fa-camera"></i><span>Upload Photo</span>';
        }
    });

    // ── Country / City cascade ──
    const profileCountrySelect = document.getElementById('profile-country');
    const profileCitySelect = document.getElementById('profile-city');
    const saveBtn = document.getElementById('save-profile-btn');

    function populateCities(countryId, selectedCityId = '') {
        profileCitySelect.innerHTML = '<option value="">Loading cities...</option>';
        profileCitySelect.disabled = true;

        const cities = db.cities.find(c => c.country === countryId && c.is_active !== false)
            .sort((a, b) => a.name.localeCompare(b.name));

        if (cities.length === 0) {
            profileCitySelect.innerHTML = '<option value="">No cities available</option>';
        } else {
            profileCitySelect.innerHTML = '<option value="">Select your city</option>';
            cities.forEach(city => {
                const opt = document.createElement('option');
                opt.value = city.city_id;
                opt.textContent = city.name;
                if (city.city_id === selectedCityId) opt.selected = true;
                profileCitySelect.appendChild(opt);
            });
            profileCitySelect.disabled = false;
        }
    }



    function setProfileFieldError(errorId, input, msg) {
        const el = document.getElementById(errorId);
        if (el) { el.textContent = msg || ''; el.classList.toggle('visible', !!msg); }
        if (input) input.classList.toggle('input-error', !!msg);
    }

    // Pre-populate cities if user already has a country selected
    if (user.country) {
        populateCities(user.country, user.city || '');
    }

    profileCountrySelect.addEventListener('change', () => {
        const countryId = profileCountrySelect.value;
        setProfileFieldError('profile-country-error', profileCountrySelect, '');
        setProfileFieldError('profile-city-error', profileCitySelect, '');
        if (countryId) {
            populateCities(countryId);
        } else {
            profileCitySelect.innerHTML = '<option value="">Select a country first</option>';
            profileCitySelect.disabled = true;
        }
    });

    profileCitySelect.addEventListener('change', () => {
        setProfileFieldError('profile-city-error', profileCitySelect, '');
    });

    // ── Bio Counter ──
    const bioInput = document.getElementById('profile-bio');
    const bioCount = document.getElementById('bio-count');

    bioInput.addEventListener('input', () => {
        bioCount.textContent = bioInput.value.length;
        bioCount.style.color = bioInput.value.length > 480 ? '#1a1a1a' : '';
    });

    // ── Lifestyle Tags ──
    document.querySelectorAll('.tag-pill').forEach(pill => {
        pill.addEventListener('click', () => {
            // Don't prevent default — let the checkbox toggle
        });

        const checkbox = pill.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', () => {
            pill.classList.toggle('active', checkbox.checked);
        });
    });

    // ── Budget Sliders ──
    const budgetMin = document.getElementById('budget-min');
    const budgetMax = document.getElementById('budget-max');
    const budgetMinDisplay = document.getElementById('budget-min-display');
    const budgetMaxDisplay = document.getElementById('budget-max-display');
    const rangeFill = document.getElementById('range-fill');

    function updateBudgetSlider() {
        let min = parseInt(budgetMin.value);
        let max = parseInt(budgetMax.value);

        if (min > max) {
            [budgetMin.value, budgetMax.value] = [max, min];
            [min, max] = [max, min];
        }

        budgetMinDisplay.textContent = `$${min.toLocaleString()}`;
        budgetMaxDisplay.textContent = `$${max.toLocaleString()}`;

        const minPercent = (min / 5000) * 100;
        const maxPercent = (max / 5000) * 100;
        rangeFill.style.left = minPercent + '%';
        rangeFill.style.width = (maxPercent - minPercent) + '%';
    }

    budgetMin.addEventListener('input', updateBudgetSlider);
    budgetMax.addEventListener('input', updateBudgetSlider);
    updateBudgetSlider();

    // ── Form Submit ──
    document.getElementById('profile-form').addEventListener('submit', (e) => {
        e.preventDefault();

        const country = profileCountrySelect.value;
        const city = profileCitySelect.value;
        let valid = true;

        if (!country) {
            setProfileFieldError('profile-country-error', profileCountrySelect, 'Please select your country.');
            valid = false;
        }
        if (!city) {
            setProfileFieldError('profile-city-error', profileCitySelect, 'Please select your city.');
            valid = false;
        }
        if (!valid) {
            showToast('Please fill in all required fields.', 'error');
            return;
        }

        const selectedTags = [];
        document.querySelectorAll('.tag-pill input:checked').forEach(cb => {
            selectedTags.push(cb.value);
        });

        const profileData = {
            profilePhoto: photoPreview.dataset.photo || user.profile_photo || '',
            bio: bioInput.value.trim(),
            ageRange: document.getElementById('profile-age').value,
            occupation: document.getElementById('profile-occupation').value.trim(),
            lifestyleTags: selectedTags,
            budgetMin: parseInt(budgetMin.value),
            budgetMax: parseInt(budgetMax.value),
            moveInTimeline: document.getElementById('profile-timeline').value,
            country,
            city,
        };

        const btn = document.getElementById('save-profile-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Saving...';

        setTimeout(() => {
            const result = updateProfile(user.id, profileData);

            if (result.success) {
                showToast('Profile saved successfully!', 'success');
                setTimeout(() => navigate('/dashboard'), 1200);
            } else {
                showToast('Failed to save profile.', 'error');
                btn.disabled = false;
                btn.textContent = 'Save & Continue';
            }
        }, 600);
    });
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type} visible`;
    setTimeout(() => toast.classList.remove('visible'), 4000);
}
