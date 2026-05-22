/**
 * src/mobile/pages/MobileProfile.js
 * User profile screen with hero, listings, saved, and settings.
 * Exports: async init(container)
 */

import { getCurrentUser, logout } from '../../../web/src/services/auth.js';
import { db } from '../../../web/src/services/db.js';
import { uploadImage } from '../../../web/src/services/upload.js';
import { renderMobileCard, attachMobileCardEvents } from '../components/MobileCard.js';
import { getAssetUrl, getAvatarUrl } from '../../../web/src/services/assets.js';
import { showBottomSheet, hideBottomSheet } from '../components/BottomSheet.js';

async function getMobile() { return await import('../mobile-main.js'); }

export async function init(container, params = {}) {
  const currentUser = getCurrentUser();
  const targetId = params.userId || params.id;
  
  // If targetId is provided, we are viewing another user. Otherwise, view self.
  const user = targetId ? db.users.findById(targetId) : currentUser;

  if (!user) {
    if (!currentUser) (await getMobile()).navigate('auth');
    else {
      container.innerHTML = `<div style="padding:40px;text-align:center;color:#94a3b8;">User not found</div>`;
    }
    return;
  }

  const isSelf = currentUser && (user.user_id === currentUser.user_id || user.id === currentUser.id);
  console.log('[MOBILE] Profile init, viewing:', user.display_name, 'isSelf:', isSelf);

  const { updateHeader, navigate } = await getMobile();
  updateHeader({
    title: isSelf ? 'My Profile' : (user.display_name || 'Profile'),
    showBack: true,
    rightAction: isSelf ? {
      icon: '⚙️',
      label: 'Settings',
      onClick: async () => (await getMobile()).navigate('settings'),
    } : null
  });

  // ── Main render ──
  async function _render() {
    const myListings   = (db.listings?.findAll?.() || []).filter(l =>
      (l.user_id === user.user_id || l.user_id === user.id) && l.status === 'active' && l.is_active !== false
    );
    let savedIds = user.saved_listings || [];
    if (typeof savedIds === 'string') { try { savedIds = JSON.parse(savedIds); } catch(e) { savedIds = []; } }
    const savedListings = savedIds.map(id => db.listings?.findById?.(id)).filter(Boolean);
    const allMessages  = (db.messages?.findAll?.() || []).filter(m =>
      m.sender_id === user.user_id || m.receiver_id === user.user_id
    );
    const uniqThreads  = new Set([
      ...allMessages.map(m => m.sender_id === user.user_id ? m.receiver_id : m.sender_id),
      ...(db.threads?.findAll?.() || []).filter(t =>
        Array.isArray(t.participants) && t.participants.includes(user.user_id)
      ).map(t => t.thread_id),
    ]);

    const isVerified = user.verification_level && user.verification_level !== 'none' && user.verification_level !== 'basic';
    const initials = (user.display_name || user.fullName || 'U').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
    const avatar = getAvatarUrl(user.profile_photo || user.avatar, user.display_name || user.fullName);

    container.innerHTML = `
      <div style="padding-bottom:24px;background:#f8fafc;">
        <!-- HERO -->
        <div style="background:#fff;padding:32px 20px 24px;text-align:center;border-bottom:1px solid #f1f5f9;">
          <div style="position:relative;width:80px;height:80px;margin:0 auto 14px;">
            <div id="profile-avatar" style="width:80px;height:80px;border-radius:50%;background:linear-gradient(135deg,#000000,#1a1a1a);display:flex;align-items:center;justify-content:center;font-size:1.6rem;font-weight:900;color:#fff;overflow:hidden;cursor:pointer;">
              ${avatar ? `<img src="${avatar}" id="avatar-img" style="width:100%;height:100%;object-fit:cover;" alt="">` : initials}
            </div>
            ${isSelf ? `
            <label for="avatar-upload" style="position:absolute;bottom:0;right:0;width:26px;height:26px;border-radius:50%;background:var(--mobile-accent);color:#fff;display:flex;align-items:center;justify-content:center;font-size:0.75rem;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,0.25);">📷
              <input type="file" id="avatar-upload" accept="image/*" style="display:none;">
            </label>` : ''}
          </div>
          <div style="font-size:1.2rem;font-weight:900;color:var(--text-primary);letter-spacing:-0.02em;">${user.display_name || user.fullName || 'User'}</div>
          ${(() => {
            const tier = (user.subscription_tier || 'free').toLowerCase();
            if (tier === 'free' && !isSelf) return '';
            const labels = { free: 'FREE', basic: 'BASIC', premium: 'PREMIUM', pro: 'PRO', admin: 'ADMIN' };
            const colors = { free: '#64748b', basic: '#0ea5e9', premium: '#6366f1', pro: '#1a1a1a', admin: '#000000' };
            const bg = colors[tier] || '#64748b';
            const isDark = tier === 'pro' || tier === 'admin';
            return `<div style="display:inline-flex;align-items:center;gap:4px;margin-top:6px;padding:4px 10px;border-radius:6px;background:${bg};color:#fff;font-size:0.65rem;font-weight:900;letter-spacing:0.05em;text-transform:uppercase;box-shadow:0 2px 4px rgba(0,0,0,0.1);">
              ${tier !== 'free' ? '<svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg>' : ''}
              ${labels[tier]} PLAN
            </div>`;
          })()}
          <div style="font-size:0.82rem;color:#94a3b8;margin-top:4px;">${isSelf ? (user.email || '') : ''}</div>
          ${user.bio ? `<div style="font-size:0.83rem;color:var(--text-secondary);margin-top:8px;line-height:1.5;max-width:280px;margin-inline:auto;">${user.bio}</div>` : ''}
          <div style="margin-top:10px;">
            <div id="prof-verify-btn" style="background:none;border:none;cursor:pointer;padding:4px 0;">
              ${isVerified ? `<span style="padding:4px 12px;border-radius:20px;background:rgba(16,185,129,.12);color:#059669;font-size:0.72rem;font-weight:700;">✓ ${user.verification_level} verified</span>` : (isSelf ? `<span style="padding:4px 12px;border-radius:20px;background:rgba(124,58,237,.1);color:var(--mobile-accent);font-size:0.72rem;font-weight:700;">Get Verified →</span>` : '')}
            </div>
          </div>
          <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:0;margin-top:18px;border-top:1px solid #f1f5f9;padding-top:16px;">
            ${_stat(myListings.length, 'Listings')}
            ${_stat(savedIds.length, 'Saved')}
            ${_stat(uniqThreads.size, 'Messages')}
          </div>
        </div>

        <!-- MY LISTINGS -->
        <div style="background:#fff;margin-top:8px;padding:16px 0;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:0 16px;margin-bottom:12px;">
            <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">${isSelf ? 'My Listings' : 'Listings'}</div>
            ${isSelf ? `<button style="background:none;border:none;color:var(--mobile-accent);font-size:0.8rem;font-weight:700;cursor:pointer;" id="prof-see-all">See All</button>` : ''}
          </div>
          ${myListings.length === 0 ? `
            <div style="padding:24px 16px;text-align:center;">
              <div style="font-size:2rem;margin-bottom:8px;">🏠</div>
              <div style="font-size:0.85rem;color:#94a3b8;margin-bottom:12px;">You haven't posted a listing yet.</div>
              <button id="prof-post-btn" class="mobile-btn mobile-btn-accent" style="width:auto;padding:10px 24px;height:auto;">Post Now</button>
            </div>` : `
            <div class="mobile-scroll-x" id="my-listings-scroll" style="padding:0 16px;">
              <div style="display:flex;gap:12px;width:max-content;">
                ${myListings.map(l => `<div data-listing-id="${l.id}" style="width:200px;flex-shrink:0;cursor:pointer;">${renderMobileCard(l)}</div>`).join('')}
              </div>
            </div>`}
        </div>

        <!-- SAVED LISTINGS -->
        <div id="saved-section" style="background:#fff;margin-top:8px;padding:16px 0;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:0 16px;margin-bottom:12px;">
            <div style="font-size:1rem;font-weight:800;color:var(--text-primary);">Saved</div>
            <button id="prof-saved-see-all" style="background:none;border:none;color:var(--mobile-accent);font-size:0.8rem;font-weight:700;cursor:pointer;">See All</button>
          </div>
          ${savedListings.length === 0 ? `
            <div style="padding:24px 16px;text-align:center;">
              <div style="font-size:2rem;margin-bottom:8px;">🤍</div>
              <div style="font-size:0.85rem;color:#94a3b8;">Tap ❤️ on any listing to save it here.</div>
            </div>` : `
            <div class="mobile-scroll-x" style="padding:0 16px;">
              <div id="saved-scroll" style="display:flex;gap:12px;width:max-content;">
                ${savedListings.map(l => `<div data-listing-id="${l.id}" style="width:200px;flex-shrink:0;cursor:pointer;">${renderMobileCard(l)}</div>`).join('')}
              </div>
            </div>`}
        </div>

        <!-- SETTINGS LIST -->
        ${isSelf ? `
        <div style="background:#fff;margin-top:8px;padding:8px 16px;">
          <div style="font-size:0.72rem;font-weight:700;color:#94a3b8;letter-spacing:0.06em;padding:8px 0 4px;">ACCOUNT</div>
          ${_settingsRow('✏️', 'Edit Profile', 'edit-profile')}
          ${_settingsRow('🔔', 'Notifications', 'notifications')}
          ${_settingsRow('🔒', 'Privacy Settings', 'privacy')}
          <div style="font-size:0.72rem;font-weight:700;color:#94a3b8;letter-spacing:0.06em;padding:16px 0 4px;">SUPPORT & INFO</div>
          ${_settingsRow('ℹ️', 'About Us', 'about')}
          ${_settingsRow('💳', 'Subscription', 'subscription')}
          ${_settingsRow('📝', 'Blog', 'blog')}
          ${_settingsRow('❓', 'FAQ', 'faq')}
          ${_settingsRow('✉️', 'Contact Us', 'contact')}
        </div>

        <!-- LOGOUT -->
        <div style="padding:16px;">
          <button id="prof-logout" class="mobile-btn" style="background:rgba(239,68,68,.08);color:#ef4444;border:1.5px solid rgba(239,68,68,.2);height:48px;">
            🚪 Sign Out
          </button>
        </div>` : ''}
      </div>
    `;

    // ── Events ──
    container.querySelector('#avatar-upload')?.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const url = await uploadImage(file);
        if (url) {
          const cacheBustedUrl = `${url}?ts=${Date.now()}`;
          const fullUrl = getAssetUrl(cacheBustedUrl);
          const img = container.querySelector('#avatar-img');
          const avatarEl = container.querySelector('#profile-avatar');
          if (img) img.src = fullUrl;
          else avatarEl.innerHTML = `<img id="avatar-img" src="${fullUrl}" style="width:100%;height:100%;object-fit:cover;">`;
          await db.users?.update?.(user.user_id, { profile_photo: cacheBustedUrl });
        }
      } catch (err) { console.log('[MOBILE] Avatar upload error:', err); }
    });

    const myScroll = container.querySelector('#my-listings-scroll');
    if (myScroll) attachMobileCardEvents(myScroll, (id) => navigate('listing', { id }));
    const savedScroll = container.querySelector('#saved-scroll');
    if (savedScroll) attachMobileCardEvents(savedScroll, (id) => navigate('listing', { id }));

    container.querySelector('#prof-post-btn')?.addEventListener('click', () => navigate('post'));
    container.querySelector('#prof-see-all')?.addEventListener('click', () => navigate('my-listings'));
    container.querySelector('#prof-saved-see-all')?.addEventListener('click', () => navigate('saved'));

    container.querySelector('#settings-edit-profile')?.addEventListener('click', () => _showEditProfileSheet(container, user, _render));
    container.querySelector('#settings-notifications')?.addEventListener('click', () => _showNotifSheet(user));
    container.querySelector('#settings-privacy')?.addEventListener('click', () => _showPrivacySheet());
    container.querySelector('#settings-about')?.addEventListener('click', () => navigate('about'));
    container.querySelector('#settings-subscription')?.addEventListener('click', () => navigate('subscription'));
    container.querySelector('#settings-blog')?.addEventListener('click', () => navigate('blog'));
    container.querySelector('#settings-faq')?.addEventListener('click', () => navigate('faq'));
    container.querySelector('#settings-contact')?.addEventListener('click', () => navigate('contact'));

    container.querySelector('#prof-logout')?.addEventListener('click', async () => {
      await logout();
      navigate('auth');
    });

    container.querySelector('#prof-verify-btn')?.addEventListener('click', () => _showVerificationSheet(user));
    
    // Stats click logic
    container.querySelectorAll('.prof-stat').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.stat;
        if (type === 'Saved') container.querySelector('#saved-section')?.scrollIntoView({ behavior:'smooth' });
        if (type === 'Messages') navigate('chat');
      });
    });
  }

  await _render();
}

export const renderMobileProfile = init;

function _stat(value, label) {
  return `<button class="prof-stat" style="background:none;border:none;cursor:pointer;padding:8px 4px;text-align:center;" data-stat="${label}">
    <div style="font-size:1.3rem;font-weight:900;color:var(--text-primary);">${value}</div>
    <div style="font-size:0.72rem;color:#94a3b8;font-weight:600;letter-spacing:0.04em;">${label.toUpperCase()}</div>
  </button>`;
}

function _settingsRow(icon, label, id) {
  return `<div id="settings-${id}" style="display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid #f1f5f9;cursor:pointer;">
    <span style="font-size:1.1rem;flex-shrink:0;">${icon}</span>
    <span style="flex:1;font-size:0.9rem;font-weight:600;color:var(--text-primary);">${label}</span>
    <span style="color:#94a3b8;font-size:1rem;">›</span>
  </div>`;
}

function _showVerificationSheet(user) {
  showBottomSheet({
    title: 'Identity Verification',
    content: `
      <div style="display:flex;flex-direction:column;gap:16px;padding:4px;">
        <div style="text-align:center;padding:10px 0;">
          <div style="font-size:2rem;margin-bottom:8px;">🛡️</div>
          <div style="font-size:1.1rem;font-weight:800;color:var(--text-primary);">Boost your trust</div>
          <div style="font-size:0.85rem;color:#94a3b8;margin-top:4px;">Verified profiles get 3x more responses.</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${_verifyStep('📧', 'Email Verified', true)}
          ${_verifyStep('📱', 'Phone Verification', user.phone_verified)}
          ${_verifyStep('🪪', 'Identity Document', user.id_verified)}
        </div>
      </div>`,
    actions: [{ label: 'Continue Verification', variant: 'accent' }]
  });
}

function _verifyStep(icon, label, done) {
  return `<div style="display:flex;align-items:center;gap:12px;padding:12px;background:#f8fafc;border-radius:12px;border:1px solid #f1f5f9;">
    <span style="font-size:1.2rem;">${icon}</span>
    <span style="flex:1;font-size:0.9rem;font-weight:700;color:var(--text-primary);">${label}</span>
    ${done ? '<span style="color:#10b981;font-weight:900;">✓</span>' : '<span style="color:var(--mobile-accent);font-size:0.75rem;font-weight:700;">Verify</span>'}
  </div>`;
}

function _showEditProfileSheet(container, user, rerender) {
  showBottomSheet({
    title: 'Edit Profile',
    content: `
      <div style="padding:0 4px;display:flex;flex-direction:column;gap:14px;">
        <div>
          <label style="font-size:0.75rem;font-weight:700;color:#94a3b8;letter-spacing:0.06em;">DISPLAY NAME</label>
          <input id="edit-name" class="mobile-input" type="text" value="${user.display_name || user.fullName || ''}" style="margin-top:6px;">
        </div>
        <div>
          <label style="font-size:0.75rem;font-weight:700;color:#94a3b8;letter-spacing:0.06em;">BIO</label>
          <textarea id="edit-bio" class="mobile-textarea" placeholder="Tell people about yourself…" style="margin-top:6px;min-height:80px;">${user.bio || ''}</textarea>
        </div>
        <div>
          <label style="font-size:0.75rem;font-weight:700;color:#94a3b8;letter-spacing:0.06em;">PHONE</label>
          <input id="edit-phone" class="mobile-input" type="tel" value="${user.phone || ''}" placeholder="+91 XXXXX XXXXX" style="margin-top:6px;">
        </div>
        <div id="edit-profile-err" style="display:none;color:#ef4444;font-size:0.8rem;font-weight:600;"></div>
      </div>`,
    actions: [
      {
        label: 'Save Changes',
        variant: 'accent',
        closeOnClick: false,
        onClick: async () => {
          const name  = document.querySelector('#edit-name')?.value.trim();
          const bio   = document.querySelector('#edit-bio')?.value.trim();
          const phone = document.querySelector('#edit-phone')?.value.trim();
          const errEl = document.querySelector('#edit-profile-err');
          if (!name) { if (errEl) { errEl.textContent = 'Name is required.'; errEl.style.display = ''; } return; }
          try {
            await db.users?.update?.(user.user_id, { display_name: name, bio, phone });
            user.display_name = name;
            user.bio = bio;
            user.phone = phone;
            hideBottomSheet();
            rerender();
          } catch (e) {
            if (errEl) { errEl.textContent = 'Failed to save. Try again.'; errEl.style.display = ''; }
          }
        }
      },
    ],
  });
}

function _showNotifSheet(user) {
  const enabled = user.notifications_enabled !== false;
  showBottomSheet({
    title: 'Notifications',
    content: `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:4px 4px 12px;">
        <div>
          <div style="font-size:0.92rem;font-weight:700;color:var(--text-primary);">Push Notifications</div>
          <div style="font-size:0.78rem;color:#94a3b8;margin-top:2px;">New messages and listing alerts</div>
        </div>
        <button id="notif-toggle" role="switch" aria-checked="${enabled}"
          style="width:50px;height:28px;border-radius:14px;border:none;background:${enabled?'var(--mobile-accent)':'#e2e8f0'};position:relative;cursor:pointer;transition:background .2s;">
          <div style="position:absolute;top:3px;left:${enabled?'22px':'3px'};width:22px;height:22px;border-radius:50%;background:#fff;box-shadow:0 1px 4px rgba(0,0,0,.2);transition:left .2s;"></div>
        </button>
      </div>`,
    actions: [],
  });

  setTimeout(() => {
    let on = enabled;
    document.querySelector('#notif-toggle')?.addEventListener('click', async (e) => {
      on = !on;
      e.currentTarget.style.background = on ? 'var(--mobile-accent)' : '#e2e8f0';
      e.currentTarget.querySelector('div').style.left = on ? '22px' : '3px';
      e.currentTarget.setAttribute('aria-checked', String(on));
      await db.users?.update?.(user.user_id, { notifications_enabled: on }).catch(() => {});
    });
  }, 50);
}

function _showPrivacySheet() {
  showBottomSheet({
    title: 'Privacy Settings',
    content: `
      <div style="display:flex;flex-direction:column;gap:14px;padding:4px;">
        ${_privacyRow('Show my phone number to landlords')}
        ${_privacyRow('Allow listing posters to message me')}
        ${_privacyRow('Show my profile to other users')}
      </div>`,
    actions: [{ label: 'Done', variant: 'accent' }],
  });
}

function _privacyRow(label) {
  return `<div style="display:flex;align-items:center;justify-content:space-between;padding:6px 0;">
    <span style="font-size:0.87rem;color:var(--text-primary);font-weight:500;">${label}</span>
    <button style="width:44px;height:24px;border-radius:12px;border:none;background:#e2e8f0;position:relative;cursor:pointer;"></button>
  </div>`;
}
