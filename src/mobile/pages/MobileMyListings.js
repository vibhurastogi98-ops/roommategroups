import { db } from '../../services/db.js';
import { getCurrentUser } from '../../services/auth.js';
import { renderMobileCard, attachMobileCardEvents } from '../components/MobileCard.js';
import { showBottomSheet, hideBottomSheet } from '../components/BottomSheet.js';

async function getMobile() { return await import('../mobile-main.js'); }

export async function init(container) {
  const user = getCurrentUser();
  if (!user) {
    (await getMobile()).navigate('auth');
    return;
  }

  const { updateHeader, goBack, navigate } = await getMobile();
  updateHeader({ title: 'My Listings', showBack: true, onBack: goBack });

  let activeFilter = 'all'; // 'all' | 'active' | 'paused'

  async function _render() {
    const allListings = (db.listings?.findAll?.() || []).filter(l =>
      (l.user_id === user.user_id || l.user_id === user.id)
    ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const filtered = allListings.filter(l => {
        if (activeFilter === 'active') return l.status === 'active' || l.is_active !== false;
        if (activeFilter === 'paused') return l.status === 'paused' || l.is_active === false;
        return true;
    });

    const activeCount = allListings.filter(l => l.status === 'active' || l.is_active !== false).length;
    const pausedCount = allListings.filter(l => l.status === 'paused' || l.is_active === false).length;

    container.innerHTML = `
      <div style="padding: 16px; background: #fff; min-height: 100%; padding-bottom: 40px;">
        
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h2 style="font-size:1.4rem; font-weight:900; color:#1a1a1a;">My Listings</h2>
            <button id="post-btn-top" class="mobile-btn-accent" style="padding:8px 16px; border-radius:12px; font-size:0.8rem; font-weight:800; border:none; cursor:pointer;">+ Post New</button>
        </div>

        <!-- Filter Tabs -->
        <div style="display: flex; gap: 8px; margin-bottom: 24px; padding-bottom: 4px; border-bottom: 1px solid #f1f5f9;">
            ${_renderTab('all', 'All', allListings.length, activeFilter === 'all')}
            ${_renderTab('active', 'Active', activeCount, activeFilter === 'active')}
            ${_renderTab('paused', 'Paused', pausedCount, activeFilter === 'paused')}
        </div>

        <div style="display:flex; flex-direction:column; gap:16px;">
            ${filtered.length === 0 ? `
                <div style="padding: 60px 24px; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 16px;">🏠</div>
                    <div style="font-size: 1rem; font-weight: 800; color: #1e293b;">No listings found</div>
                    <div style="font-size: 0.85rem; color: #94a3b8; margin-top:8px;">${activeFilter === 'all' ? "You haven't posted any listings yet." : `No ${activeFilter} listings found.`}</div>
                </div>
            ` : filtered.map(l => _renderListingRow(l)).join('')}
        </div>
      </div>
    `;

    _wireEvents();
  }

  function _renderTab(id, label, count, active) {
      return `
        <button class="filter-tab" data-filter="${id}" style="
            background: none;
            color: ${active ? '#1a1a1a' : '#64748b'};
            border: none;
            padding: 8px 12px;
            font-size: 0.85rem;
            font-weight: 700;
            cursor: pointer;
            position: relative;
        ">
            ${label} (${count})
            ${active ? `<div style="position:absolute; bottom:-1px; left:0; width:100%; height:2px; background:#1a1a1a;"></div>` : ''}
        </button>
      `;
  }

  function _renderListingRow(l) {
    const id = l.listing_id || l.id;
    const isActive = l.status === 'active' || l.is_active !== false;
    const modStatus = l.moderation_status || 'approved';
    const msgCount = (db.threads?.find?.(t => t.listing_id === id) || []).length;
    
    let photoList = l.images || l.photos || [];
    if (typeof photoList === 'string') { try { photoList = JSON.parse(photoList); } catch(e) {} }
    const photoUrl = Array.isArray(photoList) && photoList[0] ? (typeof photoList[0] === 'string' ? photoList[0] : photoList[0].thumb || photoList[0].full) : '';

    return `
      <div style="display:flex; align-items:center; gap:12px; padding:12px; background:#f8fafc; border-radius:16px; border:1px solid #f1f5f9;">
        <div style="width:50px; height:50px; border-radius:10px; background:#e2e8f0; overflow:hidden; flex-shrink:0;">
            ${photoUrl ? `<img src="${photoUrl}" style="width:100%; height:100%; object-fit:cover;">` : `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#94a3b8;"><i class="fa-solid fa-house"></i></div>`}
        </div>
        <div style="flex:1; min-width:0;">
            <div style="font-size:0.9rem; font-weight:800; color:#1e293b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${l.title || 'Untitled'}</div>
            <div style="display:flex; align-items:center; gap:8px; margin-top:2px;">
                ${modStatus === 'pending' ? `<span style="font-size:0.65rem; font-weight:700; color:#f59e0b; background:rgba(245,158,11,0.1); padding:2px 8px; border-radius:20px;">Pending Review</span>` : ''}
                ${modStatus === 'rejected' ? `<span style="font-size:0.65rem; font-weight:700; color:#ef4444; background:rgba(239,68,68,0.1); padding:2px 8px; border-radius:20px;">Rejected</span>` : ''}
                ${modStatus === 'approved' ? `<span style="font-size:0.65rem; font-weight:700; color:${isActive ? '#10b981' : '#64748b'}; background:${isActive ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)'}; padding:2px 8px; border-radius:20px;">${isActive ? 'Active' : 'Paused'}</span>` : ''}
                <div style="font-size:0.7rem; color:#94a3b8; display:flex; align-items:center; gap:4px;"><i class="fa-solid fa-eye" style="font-size:0.6rem;"></i> ${l.view_count || l.views_count || 0}</div>
                <div style="font-size:0.7rem; color:#94a3b8; display:flex; align-items:center; gap:4px;"><i class="fa-solid fa-comment" style="font-size:0.6rem;"></i> ${msgCount}</div>
            </div>
        </div>
        <div style="display:flex; gap:6px;">
            <button class="row-action action-view" data-id="${id}" style="width:32px; height:32px; border-radius:8px; background:#fff; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; color:#64748b; cursor:pointer;"><i class="fa-solid fa-eye" style="font-size:0.8rem;"></i></button>
            <button class="row-action action-edit" data-id="${id}" style="width:32px; height:32px; border-radius:8px; background:#fff; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; color:#64748b; cursor:pointer;"><i class="fa-solid fa-pen" style="font-size:0.8rem;"></i></button>
            <button class="row-action action-toggle" data-id="${id}" style="width:32px; height:32px; border-radius:8px; background:#fff; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; color:${isActive ? '#64748b' : '#10b981'}; cursor:pointer;"><i class="fa-solid fa-${isActive ? 'pause' : 'play'}" style="font-size:0.8rem;"></i></button>
            <button class="row-action action-delete" data-id="${id}" style="width:32px; height:32px; border-radius:8px; background:#fff; border:1px solid #e2e8f0; display:flex; align-items:center; justify-content:center; color:#ef4444; cursor:pointer;"><i class="fa-solid fa-trash" style="font-size:0.8rem;"></i></button>
        </div>
      </div>
    `;
  }

  async function _wireEvents() {
    const { navigate } = await getMobile();

    container.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            activeFilter = tab.dataset.filter;
            _render();
        });
    });

    container.querySelector('#post-btn-top')?.addEventListener('click', () => navigate('post'));

    container.querySelectorAll('.action-view').forEach(btn => {
        btn.addEventListener('click', () => navigate('listing', { id: btn.dataset.id }));
    });

    container.querySelectorAll('.action-edit').forEach(btn => {
        btn.addEventListener('click', () => _showEditPopup(btn.dataset.id));
    });

    container.querySelectorAll('.action-toggle').forEach(btn => {
        btn.addEventListener('click', async () => {
            const l = db.listings.findById(btn.dataset.id);
            if (!l) return;
            const newStatus = l.status === 'active' ? 'paused' : 'active';
            await db.listings.update(btn.dataset.id, { status: newStatus });
            _render();
        });
    });

    container.querySelectorAll('.action-delete').forEach(btn => {
        btn.addEventListener('click', async () => {
            if (!confirm('Delete this listing?')) return;
            await db.listings.delete(btn.dataset.id);
            _render();
        });
    });
  }

  function _showEditPopup(id) {
    const l = db.listings.findById(id);
    if (!l) return;

    const content = `
      <div style="padding: 0 4px;">
        <div class="mobile-form-group">
          <label class="mobile-form-label">Title *</label>
          <input class="mobile-input" id="ep-title" type="text" value="${_esc(l.title)}">
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="mobile-form-group">
            <label class="mobile-form-label">Price ($/mo) *</label>
            <input class="mobile-input" id="ep-price" type="number" value="${l.rent || l.price || 0}">
          </div>
          <div class="mobile-form-group">
            <label class="mobile-form-label">Deposit ($)</label>
            <input class="mobile-input" id="ep-deposit" type="number" value="${l.deposit || 0}">
          </div>
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="mobile-form-group">
            <label class="mobile-form-label">Room Type</label>
            <select class="mobile-input" id="ep-roomtype">
              ${['Private Room','Shared Room','Entire Place','Studio'].map(rt => `<option value="${rt}" ${l.room_type === rt ? 'selected' : ''}>${rt}</option>`).join('')}
            </select>
          </div>
          <div class="mobile-form-group">
            <label class="mobile-form-label">Date Available</label>
            <input class="mobile-input" id="ep-date" type="date" value="${(l.available_from || '').slice(0,10)}">
          </div>
        </div>

        <div class="mobile-form-group">
          <label class="mobile-form-label">Min. Stay</label>
          <select class="mobile-input" id="ep-minstay">
            ${['flexible','1_month','3_months','6_months','12_months'].map(ms => `<option value="${ms}" ${l.min_stay === ms ? 'selected' : ''}>${ms.replace('_',' ')}</option>`).join('')}
          </select>
        </div>

        <div class="mobile-form-group" style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:12px 16px; border-radius:12px; margin-bottom:20px;">
          <span style="font-weight:700; font-size:0.9rem; color:#475569;">Utilities Included</span>
          <label style="position:relative; display:inline-block; width:44px; height:24px;">
            <input type="checkbox" id="ep-utilities" ${l.utilities_included ? 'checked' : ''} style="opacity:0; width:0; height:0;">
            <span style="position:absolute; cursor:pointer; inset:0; background-color:${l.utilities_included ? '#1a1a1a' : '#cbd5e1'}; transition:.4s; border-radius:24px;">
              <span style="position:absolute; height:18px; width:18px; left:3px; bottom:3px; background-color:white; transition:.4s; border-radius:50%; transform:${l.utilities_included ? 'translateX(20px)' : 'none'};"></span>
            </span>
          </label>
        </div>

        <div class="mobile-form-group">
          <label class="mobile-form-label">Description</label>
          <textarea class="mobile-input" id="ep-desc" style="height:120px; padding:12px; line-height:1.5;">${_esc(l.description)}</textarea>
        </div>
        
        <div style="text-align:center; margin-top:8px; margin-bottom:16px;">
            <button id="ep-full-edit" style="background:none; border:none; color:#6366f1; font-size:0.85rem; font-weight:800; text-decoration:underline; cursor:pointer;">Full Post Edit (Advanced)</button>
        </div>
      </div>
    `;

    showBottomSheet({
      title: 'Edit Listing',
      content,
      actions: [
        { label: 'Save Changes', variant: 'accent', onClick: () => _handlePopupSave(id) },
        { label: 'Cancel', variant: 'outline', onClick: () => {} }
      ]
    });

    // Wire internal events
    const sheet = document.querySelector('.mobile-sheet');
    sheet.querySelector('#ep-utilities').addEventListener('change', (e) => {
        const toggle = e.target.nextElementSibling;
        const knob = toggle.querySelector('span');
        toggle.style.backgroundColor = e.target.checked ? '#1a1a1a' : '#cbd5e1';
        knob.style.transform = e.target.checked ? 'translateX(20px)' : 'none';
    });

    sheet.querySelector('#ep-full-edit').addEventListener('click', async () => {
        hideBottomSheet();
        (await getMobile()).navigate('post', { listingId: id });
    });
  }

  async function _handlePopupSave(id) {
    const sheet = document.querySelector('.mobile-sheet');
    const updates = {
      title: sheet.querySelector('#ep-title').value.trim(),
      rent: parseInt(sheet.querySelector('#ep-price').value) || 0,
      price: parseInt(sheet.querySelector('#ep-price').value) || 0,
      deposit: parseInt(sheet.querySelector('#ep-deposit').value) || 0,
      room_type: sheet.querySelector('#ep-roomtype').value,
      available_from: sheet.querySelector('#ep-date').value,
      min_stay: sheet.querySelector('#ep-minstay').value,
      utilities_included: sheet.querySelector('#ep-utilities').checked,
      description: sheet.querySelector('#ep-desc').value.trim()
    };

    if (!updates.title) { alert('Title is required'); return false; }

    await db.listings.update(id, updates);
    _render();
    return true;
  }

  function _esc(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c]));
  }

  _render();
}

export const renderMobileMyListings = init;
