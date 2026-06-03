/**
 * src/mobile/pages/MobileAdminDashboard.js
 * Compact admin dashboard for mobile moderation and user review.
 */

import { getCurrentUser, isAdmin } from '../../../web/src/services/auth.js';
import { db, initDB } from '../../../web/src/services/db.js';
import { api } from '../../../web/src/services/api.js';

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
  let listingFilter = 'all';
  let mpCategories = [];
  let mpCategoriesLoading = true;
  let showCategoryForm = false;
  let editingCategoryId = null;

  const isMarketplaceListing = l => (l.kind || 'rental') !== 'rental';
  const categoryById = id => mpCategories.find(c => c.category_id === id) || null;
  const slugify = value => String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

  async function loadMarketplaceCategories() {
    mpCategoriesLoading = true;
    try {
      mpCategories = await api.getMarketplaceCategories(true) || [];
    } catch (err) {
      console.debug('[MobileAdmin] Marketplace categories unavailable:', err);
      mpCategories = [];
    } finally {
      mpCategoriesLoading = false;
      _render();
    }
  }

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
          ${_tab('marketplace', 'Market')}
        </div>
        ${tab === 'users' ? _users(users) : tab === 'listings' ? _listings(listings) : tab === 'marketplace' ? _marketplace(listings) : _overview({ pending, reports, notifs })}
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
    const filtered = listings.filter(l => {
      if (listingFilter === 'marketplace') return isMarketplaceListing(l);
      if (listingFilter === 'rental') return !isMarketplaceListing(l);
      return true;
    });
    const sorted = [...filtered].sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0)).slice(0, 25);
    return `
      <div style="display:flex;flex-direction:column;gap:12px;">
        <select id="mobile-admin-listing-filter" style="width:100%;border:1px solid #e2e8f0;border-radius:12px;background:#fff;padding:12px;font-size:0.86rem;font-weight:800;color:#1e293b;">
          <option value="all" ${listingFilter === 'all' ? 'selected' : ''}>All listing types</option>
          <option value="rental" ${listingFilter === 'rental' ? 'selected' : ''}>Rentals only</option>
          <option value="marketplace" ${listingFilter === 'marketplace' ? 'selected' : ''}>Marketplace only</option>
        </select>
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
    const marketplace = isMarketplaceListing(l);
    const priceText = marketplace
      ? `$${Number(l.price ?? l.rent ?? 0).toLocaleString('en-US')}`
      : `$${Number(l.rent ?? l.price ?? 0).toLocaleString('en-US')}/mo`;
    return `
      <div class="admin-listing-mini" data-id="${id}" style="cursor:pointer;">
        <div style="display:flex;justify-content:space-between;gap:10px;">
          <div style="font-size:0.9rem;font-weight:800;color:#1e293b;line-height:1.35;">${_esc(l.title || 'Untitled listing')}</div>
          <span style="height:fit-content;font-size:0.65rem;font-weight:900;border-radius:999px;padding:4px 8px;background:#f1f5f9;color:#64748b;text-transform:uppercase;">${_esc(status)}</span>
        </div>
        <div style="font-size:0.78rem;color:#94a3b8;margin-top:4px;">${marketplace ? 'Marketplace' : 'Rental'} · ${_esc(l.city || l.city_id || 'No city')} · ${priceText}</div>
        ${l.rejection_reason ? `<div style="font-size:0.72rem;color:#b45309;margin-top:5px;">${_esc(l.rejection_reason)}</div>` : ''}
      </div>
    `;
  }

  function _marketplace(listings) {
    const queue = listings
      .filter(l => isMarketplaceListing(l) && ['pending', 'flagged'].includes(l.moderation_status || ''))
      .sort((a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0))
      .slice(0, 12);

    return `
      <div style="display:flex;flex-direction:column;gap:12px;">
        ${_panel('Marketplace queue', queue.length ? queue.map(l => `
          <div style="padding:12px 0;border-bottom:1px solid #f8fafc;">
            ${_listingMini(l)}
            <div style="display:flex;gap:8px;margin-top:10px;">
              <button class="admin-approve" data-id="${l.listing_id || l.id}" style="flex:1;border:none;border-radius:10px;background:#dcfce7;color:#166534;padding:10px;font-size:0.78rem;font-weight:900;cursor:pointer;">Approve</button>
              <button class="admin-reject" data-id="${l.listing_id || l.id}" style="flex:1;border:none;border-radius:10px;background:#fee2e2;color:#991b1b;padding:10px;font-size:0.78rem;font-weight:900;cursor:pointer;">Reject</button>
            </div>
          </div>
        `).join('') : _emptyLine('No marketplace listings need review'))}
        <div style="background:#fff;border:1px solid #f1f5f9;border-radius:18px;padding:16px;">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:10px;">
            <div style="font-size:0.95rem;font-weight:900;color:#1e293b;">Categories</div>
            <button id="mobile-mp-add" style="border:none;border-radius:10px;background:#1a1a1a;color:#fff;padding:9px 12px;font-size:0.76rem;font-weight:900;">Add</button>
          </div>
          ${_categoryForm()}
          ${_categoryList()}
        </div>
      </div>
    `;
  }

  function _categoryForm() {
    if (!showCategoryForm && !editingCategoryId) return '';
    const cat = editingCategoryId ? categoryById(editingCategoryId) || {} : {};
    const schemaValue = cat.attributes_schema ? JSON.stringify(cat.attributes_schema, null, 2) : '';
    const parentOptions = mpCategories
      .filter(c => c.category_id !== cat.category_id)
      .map(c => `<option value="${_esc(c.category_id)}" ${cat.parent_id === c.category_id ? 'selected' : ''}>${c.parent_id ? '— ' : ''}${_esc(c.name)}</option>`)
      .join('');

    return `
      <div style="border:1px solid #e2e8f0;border-radius:14px;padding:12px;margin-bottom:12px;background:#f8fafc;">
        <input id="mobile-mp-name" value="${_esc(cat.name || '')}" placeholder="Category name" style="${_inputStyle()}">
        <input id="mobile-mp-slug" value="${_esc(cat.slug || '')}" placeholder="slug" style="${_inputStyle()}">
        <select id="mobile-mp-parent" style="${_inputStyle()}"><option value="">Top level</option>${parentOptions}</select>
        <input id="mobile-mp-icon" value="${_esc(cat.icon || 'fa-tag')}" placeholder="fa-couch" style="${_inputStyle()}">
        <select id="mobile-mp-kind" style="${_inputStyle()}">
          ${['product', 'vehicle'].map(k => `<option value="${k}" ${(cat.kind || 'product') === k ? 'selected' : ''}>${k}</option>`).join('')}
        </select>
        <input id="mobile-mp-sort" type="number" value="${_esc(cat.sort_order || 0)}" placeholder="Sort order" style="${_inputStyle()}">
        <textarea id="mobile-mp-schema" placeholder='{"brand":"text"}' style="${_inputStyle()}height:92px;font-family:monospace;">${_esc(schemaValue)}</textarea>
        <label style="display:flex;align-items:center;gap:8px;font-size:0.82rem;font-weight:800;color:#334155;margin:8px 0 12px;"><input id="mobile-mp-active" type="checkbox" ${cat.is_active !== false ? 'checked' : ''}> Active</label>
        <div style="display:flex;gap:8px;">
          <button id="mobile-mp-save" style="flex:1;border:none;border-radius:10px;background:#1a1a1a;color:#fff;padding:11px;font-size:0.82rem;font-weight:900;">Save</button>
          <button id="mobile-mp-cancel" style="flex:1;border:1px solid #e2e8f0;border-radius:10px;background:#fff;color:#64748b;padding:11px;font-size:0.82rem;font-weight:900;">Cancel</button>
        </div>
      </div>
    `;
  }

  function _categoryList() {
    if (mpCategoriesLoading) return _emptyLine('Loading categories');
    if (!mpCategories.length) return _emptyLine('No marketplace categories yet');
    return mpCategories.map(cat => {
      const parent = categoryById(cat.parent_id);
      return `
        <div style="display:flex;align-items:center;gap:10px;padding:12px 0;border-bottom:1px solid #f8fafc;">
          <div style="width:36px;height:36px;border-radius:12px;background:#f8fafc;display:flex;align-items:center;justify-content:center;color:#1e293b;"><i class="fa-solid ${_esc(cat.icon || 'fa-tag')}"></i></div>
          <div style="flex:1;min-width:0;">
            <div style="font-size:0.88rem;font-weight:900;color:#1e293b;">${_esc(cat.name)}</div>
            <div style="font-size:0.72rem;color:#94a3b8;">${_esc(parent?.name || 'Top level')} · ${_esc(cat.kind || 'product')}</div>
          </div>
          <button class="mobile-mp-edit" data-id="${_esc(cat.category_id)}" style="border:none;background:#f1f5f9;color:#334155;border-radius:9px;padding:8px;font-weight:900;">Edit</button>
          <button class="mobile-mp-delete" data-id="${_esc(cat.category_id)}" style="border:none;background:#fee2e2;color:#991b1b;border-radius:9px;padding:8px;font-weight:900;">Del</button>
        </div>
      `;
    }).join('');
  }

  function _inputStyle() {
    return 'width:100%;border:1px solid #e2e8f0;border-radius:10px;background:#fff;padding:10px 12px;font-size:0.84rem;margin-bottom:8px;color:#1e293b;box-sizing:border-box;';
  }

  async function _saveCategory() {
    const name = container.querySelector('#mobile-mp-name')?.value.trim() || '';
    const slug = container.querySelector('#mobile-mp-slug')?.value.trim() || slugify(name);
    if (!name || !slug) { alert('Name and slug are required.'); return; }
    const rawSchema = container.querySelector('#mobile-mp-schema')?.value.trim() || '';
    let schema = null;
    if (rawSchema) {
      try { schema = JSON.parse(rawSchema); }
      catch { alert('Attributes schema must be valid JSON.'); return; }
    }
    const payload = {
      parent_id: container.querySelector('#mobile-mp-parent')?.value || null,
      name,
      slug,
      icon: container.querySelector('#mobile-mp-icon')?.value.trim() || 'fa-tag',
      kind: container.querySelector('#mobile-mp-kind')?.value || 'product',
      sort_order: parseInt(container.querySelector('#mobile-mp-sort')?.value || '0', 10) || 0,
      is_active: !!container.querySelector('#mobile-mp-active')?.checked,
      attributes_schema: schema,
    };
    try {
      if (editingCategoryId) await api.updateMarketplaceCategory(editingCategoryId, payload);
      else await api.saveMarketplaceCategory(payload);
      showCategoryForm = false;
      editingCategoryId = null;
      await loadMarketplaceCategories();
    } catch (err) {
      alert(err.message || 'Could not save category.');
    }
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
    container.querySelector('#mobile-admin-listing-filter')?.addEventListener('change', e => {
      listingFilter = e.target.value;
      _render();
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
        await db.listings.update(btn.dataset.id, { status: 'active', is_active: true, moderation_status: 'approved', rejection_reason: '' }).catch(() => alert('Could not approve listing.'));
        _render();
      });
    });
    container.querySelectorAll('.admin-reject').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        btn.disabled = true;
        const reason = prompt('Rejection reason (optional):') || 'Violates marketplace guidelines';
        await db.listings.update(btn.dataset.id, { status: 'rejected', is_active: false, moderation_status: 'rejected', rejection_reason: reason }).catch(() => alert('Could not reject listing.'));
        _render();
      });
    });
    container.querySelector('#mobile-mp-add')?.addEventListener('click', () => {
      showCategoryForm = true;
      editingCategoryId = null;
      _render();
    });
    container.querySelector('#mobile-mp-cancel')?.addEventListener('click', () => {
      showCategoryForm = false;
      editingCategoryId = null;
      _render();
    });
    container.querySelector('#mobile-mp-name')?.addEventListener('input', e => {
      const slugEl = container.querySelector('#mobile-mp-slug');
      if (slugEl && !editingCategoryId) slugEl.value = slugify(e.target.value);
    });
    container.querySelector('#mobile-mp-save')?.addEventListener('click', _saveCategory);
    container.querySelectorAll('.mobile-mp-edit').forEach(btn => {
      btn.addEventListener('click', () => {
        editingCategoryId = btn.dataset.id;
        showCategoryForm = false;
        _render();
      });
    });
    container.querySelectorAll('.mobile-mp-delete').forEach(btn => {
      btn.addEventListener('click', async () => {
        if (!confirm('Delete this marketplace category?')) return;
        try {
          await api.deleteMarketplaceCategory(btn.dataset.id);
          await loadMarketplaceCategories();
        } catch (err) {
          alert(err.message || 'Could not delete category.');
        }
      });
    });
  }

  _render();
  loadMarketplaceCategories();
}

function _esc(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c]));
}

export default init;
