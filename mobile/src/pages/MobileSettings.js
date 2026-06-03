/**
 * src/mobile/pages/MobileSettings.js
 * Fully functional settings page — staged profile editing, notification toggles,
 * photo upload, logout, subscription nav. Main settings persist on Save Changes.
 */

import { getCurrentUser, logout, updateProfile, changePassword, canUseSocialLinks, normalizeSocialLinks, parseSocialLinks, SOCIAL_LINK_FIELDS } from '../../../web/src/services/auth.js';
import { db } from '../../../web/src/services/db.js';
import { api } from '../../../web/src/services/api.js';
import { uploadImage } from '../../../web/src/services/upload.js';
import { showBottomSheet, hideBottomSheet } from '../components/BottomSheet.js';
import { getAvatarUrl } from '../../../web/src/services/assets.js';

async function getMobile() { return await import('../mobile-main.js'); }

export async function init(container) {
  const user = getCurrentUser();
  if (!user) { (await getMobile()).navigate('auth'); return; }

  const { updateHeader, goBack, navigate } = await getMobile();
  updateHeader({ title: 'Settings', showBack: true, onBack: goBack });

  // Always read fresh from DB so edits reflect immediately
  function getDbUser() {
    return db.users.findById(user.user_id || user.id);
  }

  if (!getDbUser()) {
    container.innerHTML = `<div style="padding:40px;text-align:center;color:#94a3b8;">Could not load profile. Please try again.</div>`;
    return;
  }

  const defaultNotifPrefs = {
    messages: true,
    matches: true,
    price_drops: true,
    digest: false,
    offers: true,
    offer_updates: true,
    reviews: true,
    saved_search: true,
  };
  let draft = {
    ...getDbUser(),
    notification_prefs: { ...defaultNotifPrefs, ...(getDbUser().notification_prefs || {}) },
  };
  let notifPrefs = draft.notification_prefs;
  let photoUploading = false;

  function getWorkingUser() {
    return { ...(getDbUser() || {}), ...draft, notification_prefs: notifPrefs };
  }

  // ── Edit overlay helpers ──────────────────────────────────────
  function showEditOverlay({ title, value, multiline = false, onSave }) {
    const overlay = document.createElement('div');
    overlay.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;display:flex;align-items:flex-end;';
    overlay.innerHTML = `
      <div style="background:#fff;border-radius:24px 24px 0 0;padding:24px 20px calc(24px + env(safe-area-inset-bottom,0px));width:100%;box-sizing:border-box;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px;">
          <div style="font-size:1rem;font-weight:800;color:#1e293b;">${title}</div>
          <button id="eo-cancel" style="background:none;border:none;font-size:1.5rem;color:#94a3b8;cursor:pointer;">×</button>
        </div>
        ${multiline
          ? `<textarea id="eo-input" style="width:100%;box-sizing:border-box;border:1.5px solid #e2e8f0;border-radius:12px;padding:12px;font-size:0.95rem;font-family:inherit;min-height:100px;resize:none;outline:none;">${_esc(value)}</textarea>`
          : `<input id="eo-input" type="text" style="width:100%;box-sizing:border-box;border:1.5px solid #e2e8f0;border-radius:12px;padding:12px;font-size:0.95rem;font-family:inherit;outline:none;" value="${_esc(value)}">`
        }
        <button id="eo-save" style="margin-top:16px;width:100%;background:#1a1a1a;color:#fff;border:none;border-radius:14px;padding:14px;font-size:0.95rem;font-weight:800;cursor:pointer;touch-action:manipulation;">Save</button>
      </div>
    `;
    document.body.appendChild(overlay);

    const input = overlay.querySelector('#eo-input');
    input.focus();

    overlay.querySelector('#eo-cancel').onclick = () => overlay.remove();
    overlay.querySelector('#eo-save').onclick = async () => {
      const newVal = input.value.trim();
      overlay.remove();
      await onSave(newVal);
    };
    overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };
  }

  // ── Save helpers ──────────────────────────────────────────────
  async function saveField(field, value) {
    if (String(field).startsWith('social_links.')) {
      const key = field.split('.')[1];
      draft.social_links = normalizeSocialLinks({ ...parseSocialLinks(draft.social_links), [key]: value });
      _render();
      _toast('Staged. Tap Save Changes.');
      return;
    }
    draft[field] = field === 'budgetMin' || field === 'budgetMax' ? Number(value) || 0 : value;
    _render();
    _toast('Staged. Tap Save Changes.');
  }

  async function saveAllSettings() {
    const dbUser = getDbUser();
    if (!dbUser) return;
    const displayName = String(draft.display_name || '').trim();
    if (!displayName) { _toast('Display name cannot be empty', 'error'); return; }

    const updates = {
      display_name: displayName,
      bio: draft.bio || '',
      occupation: draft.occupation || '',
      profile_photo: draft.profile_photo || '',
      notification_prefs: { ...notifPrefs },
      budgetMin: Number(draft.budgetMin || 0),
      budgetMax: Number(draft.budgetMax || 5000),
      moveInTimeline: draft.moveInTimeline || '',
      seller_default_country: draft.seller_default_country || '',
      seller_default_city: draft.seller_default_city || '',
      seller_payment_note: draft.seller_payment_note || '',
      show_phone: !!draft.show_phone,
      phone: draft.phone || '',
      profileComplete: Boolean(displayName),
    };
    if (canUseSocialLinks(draft)) {
      updates.social_links = normalizeSocialLinks(draft.social_links);
    }

    await updateProfile(dbUser.user_id, updates);
    draft = { ...getDbUser(), ...updates, notification_prefs: updates.notification_prefs };
    notifPrefs = draft.notification_prefs;
    _render();
    _toast('Settings saved!');
  }

  // ── Main render ───────────────────────────────────────────────
  function _render() {
    const dbUser = getWorkingUser();
    if (!dbUser) return;
    const socialEligible = canUseSocialLinks(dbUser);
    const socialValues = normalizeSocialLinks(dbUser.social_links);

    container.innerHTML = `
      <div style="padding:20px;background:#f8fafc;min-height:100%;padding-bottom:60px;">

        <!-- Profile Header -->
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:28px;background:#fff;padding:20px;border-radius:24px;border:1px solid #f1f5f9;">
          <div style="position:relative;flex-shrink:0;">
            <img id="profile-photo-img" src="${getAvatarUrl(dbUser.profile_photo, dbUser.display_name)}"
              style="width:72px;height:72px;border-radius:50%;object-fit:cover;border:2px solid #f1f5f9;">
            ${photoUploading ? '<div style="position:absolute;inset:0;border-radius:50%;background:rgba(255,255,255,0.72);display:flex;align-items:center;justify-content:center;font-size:0.72rem;font-weight:900;color:#1a1a1a;">...</div>' : ''}
            <label for="photo-file-input" style="position:absolute;bottom:0;right:0;background:#1a1a1a;color:white;width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:0.75rem;border:2px solid #fff;cursor:pointer;touch-action:manipulation;">
              📷
              <input type="file" id="photo-file-input" accept="image/*" style="display:none;">
            </label>
          </div>
          <div>
            <div style="font-size:1.1rem;font-weight:800;color:#1e293b;">${_esc(dbUser.display_name || 'No name')}</div>
            <div style="font-size:0.8rem;color:#64748b;margin-top:2px;">${_esc(dbUser.email || '')}</div>
            <div style="font-size:0.7rem;color:#1a1a1a;font-weight:700;text-transform:uppercase;margin-top:4px;letter-spacing:0.05em;">${_esc(dbUser.subscription_tier || 'Free')} Plan</div>
          </div>
        </div>

        <button id="save-settings-btn" style="width:100%;background:#1a1a1a;color:#fff;border:none;border-radius:16px;padding:15px;font-size:0.95rem;font-weight:800;margin-bottom:12px;cursor:pointer;touch-action:manipulation;">
          Save Changes
        </button>

        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:24px;">
          <button data-action="go-verification" style="background:#fff;border:1px solid #f1f5f9;border-radius:16px;padding:12px;font-weight:800;color:#334155;">Verification</button>
          <button data-action="go-subscription" style="background:#fff;border:1px solid #f1f5f9;border-radius:16px;padding:12px;font-weight:800;color:#334155;">Subscription</button>
        </div>

        <div style="display:flex;flex-direction:column;gap:24px;">

          <!-- Public Profile -->
          <div>
            <h3 style="${SECTION_TITLE}">Public Profile</h3>
            <div style="${CARD}">
              ${_row('👤', 'Display Name', dbUser.display_name || 'Not set', 'edit-display-name')}
              ${_row('📝', 'Bio', dbUser.bio || 'Not set', 'edit-bio')}
              ${_row('💼', 'Occupation', dbUser.occupation || 'Not set', 'edit-occupation')}
            </div>
          </div>

          <div>
            <h3 style="${SECTION_TITLE}">Social Links</h3>
            <div style="${CARD}">
              ${socialEligible
                ? SOCIAL_LINK_FIELDS.map(field => _row('🔗', field.label, socialValues[field.key] || 'Not set', `edit-social-${field.key}`)).join('')
                : `<div style="padding:6px 0;">
                    <div style="font-size:0.92rem;font-weight:800;color:#1e293b;margin-bottom:6px;">Add social links</div>
                    <div style="font-size:0.8rem;color:#64748b;line-height:1.45;margin-bottom:12px;">Upgrade to Pro to add Instagram, Facebook, LinkedIn, and Twitter/X links to your profile.</div>
                    <button data-action="go-subscription" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;font-weight:800;color:#334155;">Upgrade to Pro</button>
                  </div>`}
            </div>
          </div>

          <!-- Roommate Preferences -->
          <div>
            <h3 style="${SECTION_TITLE}">Roommate Preferences</h3>
            <div style="${CARD}">
              ${_row('💰', 'Budget Min', `$${dbUser.budgetMin || 0}`, 'edit-budget-min')}
              ${_row('💰', 'Budget Max', `$${dbUser.budgetMax || 5000}`, 'edit-budget-max')}
              ${_row('📅', 'Move-in Timeline', dbUser.moveInTimeline || 'Flexible', 'edit-timeline')}
            </div>
          </div>

          <!-- Seller & Marketplace -->
          <div>
            <h3 style="${SECTION_TITLE}">Seller & Marketplace</h3>
            <div style="${CARD}">
              ${_row('🌎', 'Default Item Country', _countryName(dbUser.seller_default_country), 'edit-seller-country')}
              ${_row('📍', 'Default Item City', _cityName(dbUser.seller_default_city), 'edit-seller-city')}
              ${_row('💳', 'Payment Note', dbUser.seller_payment_note || 'Not set', 'edit-payment-note')}
              ${_toggle('☎️', 'Show phone on listings', !!dbUser.show_phone, 'show_phone')}
              ${dbUser.show_phone ? _row('📱', 'Phone', dbUser.phone || 'Not set', 'edit-phone') : ''}
              ${_row('🛍️', 'Public Storefront', 'View profile', 'go-storefront')}
            </div>
          </div>

          <!-- Notifications -->
          <div>
            <h3 style="${SECTION_TITLE}">Notifications</h3>
            <div style="${CARD}">
              ${_toggle('🔔', 'Messages', notifPrefs.messages !== false, 'messages')}
              ${_toggle('✨', 'Listing Matches', notifPrefs.matches !== false, 'matches')}
              ${_toggle('📉', 'Price Drops', notifPrefs.price_drops !== false, 'price_drops')}
              ${_toggle('💸', 'New Offers', notifPrefs.offers !== false, 'offers')}
              ${_toggle('✅', 'Offer Updates', notifPrefs.offer_updates !== false, 'offer_updates')}
              ${_toggle('⭐', 'New Reviews', notifPrefs.reviews !== false, 'reviews')}
              ${_toggle('🔎', 'Saved Search Matches', notifPrefs.saved_search !== false, 'saved_search')}
            </div>
          </div>

          <!-- Account -->
          <div>
            <h3 style="${SECTION_TITLE}">Account</h3>
            <div style="${CARD}">
              ${_row('💳', 'Subscription', 'Manage Plan', 'go-subscription')}
              ${_row('🔔', 'Notifications', '', 'go-notifications')}
              ${_row('🛡️', 'Verification', '', 'go-verification')}
              ${_row('🔑', 'Change Password', '', 'change-password')}
              ${_row('🚫', 'Blocked Users', `${(dbUser.blocked_users || []).length} blocked`, 'go-block-list')}
              ${_row('📁', 'Archived Chats', 'View conversations', 'go-archived-chats')}
              ${_row('🚪', 'Log Out', '', 'do-logout', true)}
            </div>
          </div>

          <!-- Danger Zone -->
          <button id="delete-account-btn" style="width:100%;background:#fff;border:1.5px solid #fee2e2;color:#ef4444;padding:16px;border-radius:16px;font-weight:700;font-size:0.9rem;cursor:pointer;touch-action:manipulation;">
            Delete My Account
          </button>
        </div>
      </div>
    `;

    _wire(dbUser);
  }

  // ── Wire all interactions ─────────────────────────────────────
  async function _wire(dbUser) {
    const { navigate } = await getMobile();
    const socialValues = normalizeSocialLinks(dbUser.social_links);

    // Profile photo upload
    container.querySelector('#photo-file-input')?.addEventListener('change', async e => {
      const file = e.target.files[0];
      if (!file) return;
      photoUploading = true;
      _render();
      _toast('Uploading photo…');
      try {
        const url = await uploadImage(file, 'profile.webp');
        draft.profile_photo = url;
        _render();
        _toast('Photo ready. Tap Save Changes.');
      } catch { _toast('Upload failed', 'error'); }
      finally { photoUploading = false; _render(); }
    });

    container.querySelector('#save-settings-btn')?.addEventListener('click', saveAllSettings);

    // Editable rows
    const edits = {
      'edit-display-name': { label: 'Display Name', field: 'display_name', value: dbUser.display_name || '' },
      'edit-bio':           { label: 'Bio', field: 'bio', value: dbUser.bio || '', multiline: true },
      'edit-occupation':    { label: 'Occupation', field: 'occupation', value: dbUser.occupation || '' },
      'edit-budget-min':    { label: 'Budget Min ($)', field: 'budgetMin', value: String(dbUser.budgetMin || 0) },
      'edit-budget-max':    { label: 'Budget Max ($)', field: 'budgetMax', value: String(dbUser.budgetMax || 5000) },
      'edit-timeline':      { label: 'Move-in Timeline', field: 'moveInTimeline', value: dbUser.moveInTimeline || '' },
      'edit-payment-note':   { label: 'Payment Note', field: 'seller_payment_note', value: dbUser.seller_payment_note || '' },
      'edit-phone':          { label: 'Phone', field: 'phone', value: dbUser.phone || '' },
      ...Object.fromEntries(SOCIAL_LINK_FIELDS.map(field => [
        `edit-social-${field.key}`,
        { label: field.label, field: `social_links.${field.key}`, value: socialValues[field.key] || '' },
      ])),
    };

    Object.entries(edits).forEach(([id, cfg]) => {
      container.querySelector(`[data-action="${id}"]`)?.addEventListener('click', () => {
        showEditOverlay({
          title: `Edit ${cfg.label}`,
          value: cfg.value,
          multiline: cfg.multiline || false,
          onSave: val => saveField(cfg.field, val),
        });
      });
    });

    container.querySelector('[data-action="edit-seller-country"]')?.addEventListener('click', () => _showChoiceSheet({
      title: 'Default Item Country',
      items: db.countries.findAll().filter(c => c.is_active).sort((a, b) => a.name.localeCompare(b.name)),
      getLabel: c => `${c.flag_emoji ? `${c.flag_emoji} ` : ''}${c.name}`,
      onSelect: c => {
        draft.seller_default_country = c.country_id;
        draft.seller_default_city = '';
        _render();
        _toast('Staged. Tap Save Changes.');
      },
    }));

    container.querySelector('[data-action="edit-seller-city"]')?.addEventListener('click', () => {
      const countryId = draft.seller_default_country || dbUser.seller_default_country || dbUser.country;
      const cities = db.cities.find(c => c.country === countryId && c.is_active !== false).sort((a, b) => a.name.localeCompare(b.name));
      if (!countryId || !cities.length) { _toast('Choose a country first', 'error'); return; }
      _showChoiceSheet({
        title: 'Default Item City',
        items: cities,
        getLabel: c => c.name,
        onSelect: c => {
          draft.seller_default_city = c.city_id;
          _render();
          _toast('Staged. Tap Save Changes.');
        },
      });
    });

    // Notification toggles
    container.querySelectorAll('[data-notif]').forEach(el => {
      el.addEventListener('click', () => {
        const key = el.dataset.notif;
        if (key === 'show_phone') {
          draft[key] = !draft[key];
        } else {
          notifPrefs[key] = !notifPrefs[key];
          draft.notification_prefs = { ...notifPrefs };
        }
        _render();
        _toast('Staged. Tap Save Changes.');
      });
    });

    // Navigation rows
    container.querySelector('[data-action="go-subscription"]')?.addEventListener('click', () => navigate('subscription'));
    container.querySelector('[data-action="go-notifications"]')?.addEventListener('click', () => navigate('notifications'));
    container.querySelector('[data-action="go-verification"]')?.addEventListener('click', () => navigate('verification'));
    container.querySelector('[data-action="go-block-list"]')?.addEventListener('click', () => navigate('block-list'));
    container.querySelector('[data-action="go-archived-chats"]')?.addEventListener('click', () => navigate('archived-chats'));
    container.querySelector('[data-action="go-storefront"]')?.addEventListener('click', () => { window.location.href = `/seller/${encodeURIComponent(dbUser.user_id)}`; });
    container.querySelector('[data-action="change-password"]')?.addEventListener('click', () => _showPasswordSheet(dbUser));

    // Log out
    container.querySelector('[data-action="do-logout"]')?.addEventListener('click', () => {
      showBottomSheet({
        title: 'Log Out',
        content: `
          <div style="padding: 10px 0; text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 16px;">🚪</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: #1e293b; margin-bottom: 8px;">Log out of your account?</div>
            <div style="font-size: 0.9rem; color: #64748b; line-height: 1.5;">You will need to sign back in to access your listings and messages.</div>
          </div>
        `,
        actions: [
          { label: 'Yes, Log Out', variant: 'danger', onClick: () => { logout(); navigate('auth'); } },
          { label: 'Cancel', variant: 'outline', onClick: () => {} }
        ]
      });
    });

    // Delete account
    container.querySelector('#delete-account-btn')?.addEventListener('click', () => {
      showBottomSheet({
        title: 'Delete Account',
        content: `
          <div style="padding: 10px 0; text-align: center;">
            <div style="font-size: 3rem; margin-bottom: 16px;">⚠️</div>
            <div style="font-size: 1.1rem; font-weight: 800; color: #1e293b; margin-bottom: 8px;">Permanently delete account?</div>
            <div style="font-size: 0.9rem; color: #64748b; line-height: 1.5;">This action is irreversible. All your listings, messages, and profile data will be permanently erased.</div>
          </div>
        `,
        actions: [
          { label: 'Permanently Delete', variant: 'danger', onClick: async () => { await api.deleteUser(dbUser.user_id); logout(); navigate('home'); } },
          { label: 'Cancel', variant: 'outline', onClick: () => {} }
        ]
      });
    });
  }

  _render();
}

function _showPasswordSheet(user) {
  showBottomSheet({
    title: 'Change Password',
    content: `
      <div style="display:flex;flex-direction:column;gap:14px;padding:0 4px;">
        <div>
          <label style="font-size:0.75rem;font-weight:700;color:#94a3b8;letter-spacing:0.06em;">CURRENT PASSWORD</label>
          <input id="pwd-current" class="mobile-input" type="password" autocomplete="current-password" style="margin-top:6px;">
        </div>
        <div>
          <label style="font-size:0.75rem;font-weight:700;color:#94a3b8;letter-spacing:0.06em;">NEW PASSWORD</label>
          <input id="pwd-new" class="mobile-input" type="password" autocomplete="new-password" style="margin-top:6px;">
        </div>
        <div id="pwd-error" style="display:none;color:#ef4444;font-size:0.8rem;font-weight:700;"></div>
      </div>
    `,
    actions: [
      {
        label: 'Save Password',
        variant: 'accent',
        closeOnClick: false,
        onClick: async () => {
          const current = document.querySelector('#pwd-current')?.value || '';
          const next = document.querySelector('#pwd-new')?.value || '';
          const errEl = document.querySelector('#pwd-error');
          const res = await changePassword(user.user_id || user.id, current, next);
          if (!res.success) {
            if (errEl) { errEl.textContent = res.error || 'Could not update password.'; errEl.style.display = ''; }
            return;
          }
          hideBottomSheet();
          _toast('Password updated!');
        }
      },
      { label: 'Cancel', variant: 'outline', onClick: () => {} }
    ]
  });
}

function _showChoiceSheet({ title, items, getLabel, onSelect }) {
  showBottomSheet({
    title,
    content: `
      <div style="display:flex;flex-direction:column;gap:8px;max-height:55vh;overflow-y:auto;">
        ${items.map((item, idx) => `
          <button data-choice="${idx}" style="width:100%;text-align:left;background:#fff;border:1px solid #f1f5f9;border-radius:14px;padding:13px 14px;font-weight:800;color:#334155;">
            ${_esc(getLabel(item))}
          </button>
        `).join('')}
      </div>
    `,
    actions: [{ label: 'Cancel', variant: 'outline', onClick: () => {} }]
  });
  setTimeout(() => {
    document.querySelectorAll('[data-choice]').forEach(btn => {
      btn.addEventListener('click', () => {
        const item = items[Number(btn.dataset.choice)];
        hideBottomSheet();
        onSelect(item);
      });
    });
  }, 0);
}

function _countryName(id) {
  if (!id) return 'Not set';
  return db.countries.findById(id)?.name || id;
}

function _cityName(id) {
  if (!id) return 'Not set';
  return db.cities.findById(id)?.name || id;
}

// ── Row builders ──────────────────────────────────────────────
const SECTION_TITLE = `font-size:0.72rem;font-weight:800;color:#94a3b8;letter-spacing:0.05em;text-transform:uppercase;margin-bottom:12px;padding-left:4px;`;
const CARD = `background:#fff;border-radius:24px;border:1px solid #f1f5f9;overflow:hidden;box-shadow:0 4px 15px rgba(0,0,0,0.03);`;

function _row(icon, label, value, action, isDanger = false) {
  return `
    <div data-action="${action}" style="display:flex;align-items:center;gap:16px;padding:16px;cursor:pointer;border-bottom:1px solid #f8fafc;touch-action:manipulation;">
      <div style="width:32px;height:32px;border-radius:10px;background:#f8fafc;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;">${icon}</div>
      <div style="flex:1;min-width:0;">
        <div style="font-size:0.9rem;font-weight:700;color:${isDanger ? '#ef4444' : '#334155'};">${label}</div>
        ${value ? `<div style="font-size:0.75rem;color:#94a3b8;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_esc(value)}</div>` : ''}
      </div>
      <span style="color:#cbd5e1;font-size:1rem;flex-shrink:0;">›</span>
    </div>
  `;
}

function _toggle(icon, label, checked, notifKey) {
  return `
    <div data-notif="${notifKey}" style="display:flex;align-items:center;gap:16px;padding:16px;border-bottom:1px solid #f8fafc;cursor:pointer;touch-action:manipulation;">
      <div style="width:32px;height:32px;border-radius:10px;background:#f8fafc;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;">${icon}</div>
      <div style="flex:1;font-size:0.9rem;font-weight:700;color:#334155;">${label}</div>
      <div style="width:46px;height:26px;border-radius:13px;background:${checked ? '#1a1a1a' : '#e2e8f0'};position:relative;flex-shrink:0;transition:background 0.2s;">
        <div style="width:20px;height:20px;border-radius:50%;background:#fff;position:absolute;top:3px;${checked ? 'right:3px' : 'left:3px'};transition:all 0.2s;box-shadow:0 1px 3px rgba(0,0,0,0.2);"></div>
      </div>
    </div>
  `;
}

function _esc(str) {
  if (!str) return '';
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function _toast(msg, type = 'success') {
  const t = document.createElement('div');
  Object.assign(t.style, {
    position:'fixed', bottom:'80px', left:'50%', transform:'translateX(-50%) translateY(20px)',
    background: type === 'success' ? '#10b981' : '#ef4444', color:'#fff',
    padding:'10px 20px', borderRadius:'20px', fontSize:'0.82rem', fontWeight:'700',
    zIndex:'99999', opacity:'0', transition:'all 0.25s ease', whiteSpace:'nowrap',
    boxShadow:'0 4px 12px rgba(0,0,0,0.15)',
  });
  t.textContent = msg;
  document.body.appendChild(t);
  requestAnimationFrame(() => requestAnimationFrame(() => { t.style.opacity='1'; t.style.transform='translateX(-50%) translateY(0)'; }));
  setTimeout(() => { t.style.opacity='0'; setTimeout(() => t.remove(), 250); }, 2500);
}

export const renderMobileSettings = init;
