/**
 * src/mobile/pages/MobileAdminDashboard.js
 * Compact admin dashboard for mobile moderation and user review.
 */

import { getCurrentUser, isAdmin } from '../../services/auth.js';
import { db, initDB } from '../../services/db.js';

async function getMobile() { return await import('../mobile-main.js'); }

const PAGE_SIZE = 8;

export async function init(container) {
  const user = getCurrentUser();
  const { updateHeader, goBack, navigate } = await getMobile();

  if (!user) { navigate('auth'); return; }
  if (!isAdmin()) {
    updateHeader({ title: 'Admin', showBack: true, onBack: goBack, rightAction: null });
    container.innerHTML = `
      <div class="mobile-empty" style="padding:100px 24px;">
        <div class="mobile-empty-icon">🔒</div>
        <div class="mobile-empty-title">Admin access required</div>
        <div class="mobile-empty-text">Only administrator accounts can open this page.</div>
      </div>
    `;
    return;
  }

  updateHeader({ title: 'Admin Dashboard', showBack: true, onBack: goBack, rightAction: null });
  await initDB().catch(() => {});

  let tab = 'overview';
  let userPage = 0;

  function _render() {
    const users = db.users.findAll().filter(u => u.role !== 'admin');
    const listings = db.listings.findAll();
    const pending = listings.filter(l => (l.moderation_status || (l.status === 'pending' ? 'pending' : 'approved')) === 'pending');
    const active = listings.filter(l => l.status === 'active' && l.is_active !== false);
    const reports = db.reports.findAll().filter(r => (r.status || 'pending') === 'pending');
    const notifs = db.notifications.findAll();

    container.innerHTML = `
      <div style="background:#f8fafc;min-height:100%;padding:16px;padding-bottom:40px;overflow-y:scroll;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y;overscroll-behavior-y:contain;will-change:auto;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:16px;">
          ${_stat('Users', users.length)}
          ${_stat('Active', active.length)}
          ${_stat('Pending', pending.length)}
          ${_stat('Reports', reports.length)}
        </div>
        <div style="display:flex;gap:8px;background:#fff;border:1px solid #f1f5f9;border-radius:14px;padding:4px;margin-bottom:16px;">
          ${_tab('overview', 'Overview')}
          ${_tab('users', 'Users')}
          ${_tab('listings', 'Listings')}
        </div>
        ${tab === 'users' ? _users(users) : tab === 'listings' ? _listings(listings) : _overview({ pending, reports, notifs })}
      </div>
    `;

    _wire({ users, listings });
  }

  function _stat(label, value) {
    return `
      <div style="background:#fff;border:1px solid #f1f5f9;border-radius:16px;padding:14px;">
        <div style="font-size:1.35rem;font-weight:900;color:#1e293b;">${value}</div>
        <div style="font-size:0.72rem;color:#94a3b8;font-weight:800;text-transform:uppercase;">${label}</div>
      </div>
    `;
  }

  function _tab(id, label) {
    const active = tab === id;
    return `<button class="admin-tab" data-tab="${id}" style="flex:1;border:none;border-radius:10px;padding:10px 4px;background:${active ? '#1a1a1a' : 'transparent'};color:${active ? '#fff' : '#64748b'};font-size:0.8rem;font-weight:800;cursor:pointer;">${label}</button>`;
  }

  function _overview({ pending, reports, notifs }) {
    return `
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${_panel('Pending moderation', pending.length ? pending.slice(0, 5).map(l => _listingMini(l)).join('') : _emptyLine('No pending listings'))}
        ${_panel('Open reports', reports.length ? reports.slice(0, 5).map(r => `<div style="font-size:0.86rem;color:#475569;padding:10px 0;border-bottom:1px solid #f8fafc;">${_esc(r.reason || 'Report')} · ${_esc(r.status || 'pending')}</div>`).join('') : _emptyLine('No open reports'))}
        ${_panel('Recent notifications', notifs.slice(0, 5).map(n => `<div style="font-size:0.86rem;color:#475569;padding:10px 0;border-bottom:1px solid #f8fafc;">${_esc(n.title || 'Notification')}</div>`).join('') || _emptyLine('No notifications'))}
      </div>
    `;
  }

  function _users(users) {
    const pages = Math.max(1, Math.ceil(users.length / PAGE_SIZE));
    userPage = Math.min(userPage, pages - 1);
    const pageUsers = users.slice(userPage * PAGE_SIZE, userPage * PAGE_SIZE + PAGE_SIZE);
    return `
      <div style="background:#fff;border:1px solid #f1f5f9;border-radius:18px;overflow:hidden;">
        ${pageUsers.length ? pageUsers.map(u => `
          <div style="display:flex;align-items:center;gap:12px;padding:14px;border-bottom:1px solid #f8fafc;">
            <div style="width:42px;height:42px;border-radius:14px;background:#f1f5f9;display:flex;align-items:center;justify-content:center;font-weight:900;color:#64748b;">${_esc((u.display_name || u.email || 'U').charAt(0).toUpperCase())}</div>
            <div style="flex:1;min-width:0;">
              <div style="font-size:0.9rem;font-weight:800;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_esc(u.display_name || 'Unnamed')}</div>
              <div style="font-size:0.75rem;color:#94a3b8;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_esc(u.email || '')}</div>
            </div>
            <span style="font-size:0.68rem;font-weight:900;border-radius:999px;padding:4px 8px;background:${u.is_blocked ? '#fee2e2' : '#f1f5f9'};color:${u.is_blocked ? '#ef4444' : '#64748b'};">${u.is_blocked ? 'BLOCKED' : (u.role || 'USER').toUpperCase()}</span>
          </div>
        `).join('') : _emptyLine('No users found')}
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;margin-top:12px;">
        <button id="admin-prev-users" class="mobile-btn mobile-btn-outline" style="width:auto;min-height:40px;padding:8px 16px;" ${userPage <= 0 ? 'disabled' : ''}>Prev</button>
        <div style="font-size:0.78rem;color:#64748b;font-weight:800;">Page ${userPage + 1} of ${pages}</div>
        <button id="admin-next-users" class="mobile-btn mobile-btn-outline" style="width:auto;min-height:40px;padding:8px 16px;" ${userPage >= pages - 1 ? 'disabled' : ''}>Next</button>
      </div>
    `;
  }

  function _listings(listings) {
    const sorted = [...listings].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 25);
    return `
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${sorted.length ? sorted.map(l => `
          <div style="background:#fff;border:1px solid #f1f5f9;border-radius:16px;padding:14px;">
            ${_listingMini(l)}
            <div style="display:flex;gap:8px;margin-top:12px;">
              <button class="admin-approve" data-id="${l.listing_id || l.id}" style="flex:1;border:none;border-radius:10px;background:#dcfce7;color:#166534;padding:10px;font-size:0.78rem;font-weight:900;cursor:pointer;">Approve</button>
              <button class="admin-reject" data-id="${l.listing_id || l.id}" style="flex:1;border:none;border-radius:10px;background:#fee2e2;color:#991b1b;padding:10px;font-size:0.78rem;font-weight:900;cursor:pointer;">Reject</button>
            </div>
          </div>
        `).join('') : _emptyLine('No listings found')}
      </div>
    `;
  }

  function _listingMini(l) {
    const id = l.listing_id || l.id;
    const status = l.moderation_status || l.status || 'pending';
    return `
      <div class="admin-listing-mini" data-id="${id}" style="cursor:pointer;">
        <div style="display:flex;justify-content:space-between;gap:10px;">
          <div style="font-size:0.9rem;font-weight:800;color:#1e293b;line-height:1.35;">${_esc(l.title || 'Untitled listing')}</div>
          <span style="height:fit-content;font-size:0.65rem;font-weight:900;border-radius:999px;padding:4px 8px;background:#f1f5f9;color:#64748b;text-transform:uppercase;">${_esc(status)}</span>
        </div>
        <div style="font-size:0.78rem;color:#94a3b8;margin-top:4px;">${_esc(l.city || l.city_id || 'No city')} · $${Number(l.rent ?? l.price ?? 0).toLocaleString('en-US')}/mo</div>
      </div>
    `;
  }

  function _panel(title, body) {
    return `<div style="background:#fff;border:1px solid #f1f5f9;border-radius:18px;padding:16px;"><div style="font-size:0.95rem;font-weight:900;color:#1e293b;margin-bottom:8px;">${title}</div>${body}</div>`;
  }

  function _emptyLine(text) {
    return `<div style="padding:18px;text-align:center;color:#94a3b8;font-size:0.85rem;">${text}</div>`;
  }

  function _wire() {
    container.querySelectorAll('.admin-tab').forEach(btn => {
      btn.addEventListener('click', () => { tab = btn.dataset.tab; _render(); });
    });
    container.querySelector('#admin-prev-users')?.addEventListener('click', () => { userPage--; _render(); });
    container.querySelector('#admin-next-users')?.addEventListener('click', () => { userPage++; _render(); });
    container.querySelectorAll('.admin-listing-mini').forEach(el => {
      el.addEventListener('click', () => navigate('listing', { id: el.dataset.id }));
    });
    container.querySelectorAll('.admin-approve').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        btn.disabled = true;
        await db.listings.update(btn.dataset.id, { status: 'active', is_active: true, moderation_status: 'approved' }).catch(() => alert('Could not approve listing.'));
        _render();
      });
    });
    container.querySelectorAll('.admin-reject').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        btn.disabled = true;
        await db.listings.update(btn.dataset.id, { status: 'rejected', is_active: false, moderation_status: 'rejected' }).catch(() => alert('Could not reject listing.'));
        _render();
      });
    });
  }

  _render();
}

function _esc(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c]));
}

export default init;
