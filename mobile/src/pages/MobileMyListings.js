import { db } from '../../../web/src/services/db.js';
import { getCurrentUser } from '../../../web/src/services/auth.js';
import { renderMobileCard, attachMobileCardEvents } from '../components/MobileCard.js';
import { showBottomSheet, hideBottomSheet } from '../components/BottomSheet.js';
import { getAssetUrl } from '../../../web/src/services/assets.js';
import { api } from '../../../web/src/services/api.js';

async function getMobile() { return await import('../mobile-main.js'); }

export async function init(container) {
  const user = getCurrentUser();
  if (!user) {
    (await getMobile()).navigate('auth');
    return;
  }

  const { updateHeader, goBack, navigate } = await getMobile();
  updateHeader({ 
    title: 'My Listings', 
    showBack: true, 
    onBack: goBack,
    rightAction: {
      icon: '<i class="fa-solid fa-plus" style="font-size:1.1rem;"></i>',
      label: 'Post New',
      onClick: () => navigate('post')
    }
  });

  let activeFilter = 'all'; // 'all' | 'active' | 'paused' | 'sold'
  const _isActive = (l) => {
    if (!l) return false;
    // Match web dashboard logic: status must be 'active' and is_active must not be boolean false
    return l.status === 'active' && l.is_active !== false;
  };
  const _isSold = (l) => l?.status === 'sold' || Boolean(l?.sold_at);
  const _isSale = (l) => {
    if (String(l?.kind || '').toLowerCase() === 'sale') return true;
    return Boolean(
      l?.category_id
      || l?.condition
      || l?.brand
      || l?.attributes
      || ((l?.price !== undefined && l?.price !== null && l?.price !== '') && (l?.rent === undefined || l?.rent === null || l?.rent === ''))
    );
  };
  const _formatPrice = (l) => {
    const val = _isSale(l) ? l.price : (l.rent ?? l.price);
    if (val === undefined || val === null || val === '') return _isSale(l) ? 'Ask seller' : 'Price TBC';
    return '$' + Number(val).toLocaleString() + (_isSale(l) ? '' : '/mo');
  };

  async function _render() {
    const allListings = (db.listings?.findAll?.() || []).filter(l =>
      (l.user_id === user.user_id || l.user_id === user.id)
    ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    const filtered = allListings.filter(l => {
        if (activeFilter === 'active') return _isActive(l);
        if (activeFilter === 'paused') return !_isSold(l) && !_isActive(l);
        if (activeFilter === 'sold') return _isSold(l);
        return true;
    });

    const activeCount = allListings.filter(l => _isActive(l)).length;
    const pausedCount = allListings.filter(l => !_isSold(l) && !_isActive(l)).length;
    const soldCount = allListings.filter(l => _isSold(l)).length;

    container.innerHTML = `
      <div style="padding: 16px; background: #f8fafc; min-height: 100%; padding-bottom: 40px;">
        
        <!-- Filter Tabs -->
        <div style="display: flex; gap: 8px; margin-bottom: 24px; padding: 4px; background: #fff; border-radius: 12px; border: 1px solid #f1f5f9;">
            ${_renderTab('all', 'All', allListings.length, activeFilter === 'all')}
            ${_renderTab('active', 'Active', activeCount, activeFilter === 'active')}
            ${_renderTab('paused', 'Paused', pausedCount, activeFilter === 'paused')}
            ${_renderTab('sold', 'Sold', soldCount, activeFilter === 'sold')}
        </div>

        <div style="display:flex; flex-direction:column; gap:16px;">
            ${filtered.length === 0 ? `
                <div style="padding: 60px 24px; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 16px;">🏠</div>
                    <div style="font-size: 1rem; font-weight: 800; color: #1e293b;">No listings found</div>
                    <div style="font-size: 0.85rem; color: #94a3b8; margin-top:8px;">${activeFilter === 'all' ? 'Post a room or list an item.' : `No ${activeFilter} listings found.`}</div>
                    <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:16px;">
                      <button id="empty-list-item" style="height:40px;border:none;border-radius:12px;background:#0f172a;color:#fff;font-size:0.78rem;font-weight:900;padding:0 14px;">List an Item</button>
                      <button id="empty-post-room" style="height:40px;border:1px solid #e2e8f0;border-radius:12px;background:#fff;color:#0f172a;font-size:0.78rem;font-weight:900;padding:0 14px;">Post a Room</button>
                    </div>
                </div>
            ` : filtered.map(l => _renderListingRow(l)).join('')}
        </div>
      </div>
    `;

    _wireEvents();
  }

  // Register listener ONCE in init
  const onSync = () => { if (container.isConnected) _render(); };
  window.addEventListener('db-synced', onSync);
  
  // Cleanup
  const observer = new MutationObserver(() => {
    if (!container.isConnected) {
      window.removeEventListener('db-synced', onSync);
      observer.disconnect();
    }
  });
  observer.observe(document.body, { childList: true, subtree: true });

  function _renderTab(id, label, count, active) {
      return `
        <button class="filter-tab" data-filter="${id}" style="
            flex: 1;
            background: ${active ? '#1a1a1a' : 'transparent'};
            color: ${active ? '#fff' : '#64748b'};
            border: none;
            padding: 10px 4px;
            border-radius: 10px;
            font-size: 0.8rem;
            font-weight: 800;
            cursor: pointer;
            transition: all 0.2s ease;
            text-align: center;
        ">
            ${label} <span style="opacity:0.6; font-size:0.7rem; font-weight:600;">(${count})</span>
        </button>
      `;
  }

  function _renderListingRow(l) {
    const id = l.listing_id || l.id;
    const isActive = _isActive(l);
    const isSold = _isSold(l);
    const modStatus = l.moderation_status || 'approved';
    const msgCount = (db.threads?.find?.(t => t.listing_id === id) || []).length;
    
    let photoList = l.images || l.photos || [];
    if (typeof photoList === 'string') { try { photoList = JSON.parse(photoList); } catch(e) {} }
    const rawPhotoUrl = Array.isArray(photoList) && photoList[0] ? (typeof photoList[0] === 'string' ? photoList[0] : photoList[0].thumb || photoList[0].full) : '';
    const photoUrl = rawPhotoUrl ? getAssetUrl(rawPhotoUrl) : '';

    return `
      <div style="background:#fff; border-radius:20px; border:1px solid #f1f5f9; box-shadow: 0 4px 12px rgba(0,0,0,0.03); overflow:hidden; margin-bottom:12px;">
        <div style="display:flex; align-items:center; gap:16px; padding:16px;">
            <div style="width:64px; height:64px; border-radius:14px; background:#f1f5f9; overflow:hidden; flex-shrink:0;">
                ${photoUrl ? `<img src="${photoUrl}" style="width:100%; height:100%; object-fit:cover;">` : `<div style="width:100%; height:100%; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:1.2rem;"><i class="fa-solid fa-house"></i></div>`}
            </div>
            <div style="flex:1; min-width:0;">
                <div style="font-size:1rem; font-weight:800; color:#1e293b; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; margin-bottom:4px;">${l.title || 'Untitled'}</div>
                <div style="font-size:0.82rem;font-weight:900;color:#0f172a;margin-bottom:6px;">${_formatPrice(l)} <span style="font-size:0.64rem;color:#64748b;background:#f1f5f9;border-radius:20px;padding:2px 8px;text-transform:uppercase;">${_isSale(l) ? 'Item' : 'Room'}</span></div>
                <div style="display:flex; align-items:center; flex-wrap:wrap; gap:8px;">
                    ${modStatus === 'approved' ? `
                        <span style="font-size:0.65rem; font-weight:800; color:${isSold ? '#047857' : isActive ? '#10b981' : '#64748b'}; background:${isSold ? 'rgba(4,120,87,0.1)' : isActive ? 'rgba(16,185,129,0.1)' : 'rgba(100,116,139,0.1)'}; padding:2px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.02em;">${isSold ? 'Sold' : isActive ? 'Active' : 'Paused'}</span>
                    ` : `
                        <span style="font-size:0.65rem; font-weight:800; color:${modStatus === 'pending' ? '#f59e0b' : '#ef4444'}; background:${modStatus === 'pending' ? 'rgba(245,158,11,0.1)' : 'rgba(239,68,68,0.1)'}; padding:2px 10px; border-radius:20px; text-transform:uppercase; letter-spacing:0.02em;">${modStatus}</span>
                    `}
                    <div style="font-size:0.75rem; color:#94a3b8; display:flex; align-items:center; gap:4px;"><i class="fa-solid fa-eye" style="font-size:0.65rem;"></i> ${l.view_count || l.views_count || 0}</div>
                    <div style="font-size:0.75rem; color:#94a3b8; display:flex; align-items:center; gap:4px;"><i class="fa-solid fa-comment" style="font-size:0.65rem;"></i> ${msgCount}</div>
                </div>
            </div>
        </div>
        
        <div style="display:flex; border-top:1px solid #f1f5f9; background:#fafafa;">
            <button class="row-action action-view" data-id="${id}" style="flex:1; height:48px; border:none; background:transparent; border-right:1px solid #f1f5f9; color:#64748b; font-size:0.85rem; font-weight:700; display:flex; align-items:center; justify-content:center; gap:6px; cursor:pointer;"><i class="fa-solid fa-eye" style="font-size:0.75rem;"></i> View</button>
            <button class="row-action action-edit" data-id="${id}" style="flex:1; height:48px; border:none; background:transparent; border-right:1px solid #f1f5f9; color:#64748b; font-size:0.85rem; font-weight:700; display:flex; align-items:center; justify-content:center; gap:6px; cursor:pointer;"><i class="fa-solid fa-pen" style="font-size:0.75rem;"></i> Edit</button>
            ${isSold ? '' : `<button class="row-action action-toggle" data-id="${id}" style="flex:1; height:48px; border:none; background:transparent; border-right:1px solid #f1f5f9; color:${isActive ? '#64748b' : '#10b981'}; font-size:0.85rem; font-weight:700; display:flex; align-items:center; justify-content:center; gap:6px; cursor:pointer;"><i class="fa-solid fa-${isActive ? 'pause' : 'play'}" style="font-size:0.75rem;"></i> ${isActive ? 'Pause' : 'Live'}</button>`}
            ${_isSale(l) && isActive && !isSold ? `<button class="row-action action-promote" data-id="${id}" style="flex:1; height:48px; border:none; background:transparent; border-right:1px solid #f1f5f9; color:#7c3aed; font-size:0.85rem; font-weight:700; display:flex; align-items:center; justify-content:center; gap:6px; cursor:pointer;"><i class="fa-solid fa-rocket" style="font-size:0.75rem;"></i> Promote</button>` : ''}
            ${_isSale(l) && isActive && !isSold ? `<button class="row-action action-sold" data-id="${id}" style="flex:1; height:48px; border:none; background:transparent; border-right:1px solid #f1f5f9; color:#047857; font-size:0.85rem; font-weight:700; display:flex; align-items:center; justify-content:center; gap:6px; cursor:pointer;"><i class="fa-solid fa-check" style="font-size:0.75rem;"></i> Sold</button>` : ''}
            <button class="row-action action-delete" data-id="${id}" style="flex:0.6; height:48px; border:none; background:transparent; color:#ef4444; font-size:0.85rem; display:flex; align-items:center; justify-content:center; cursor:pointer;"><i class="fa-solid fa-trash" style="font-size:0.75rem;"></i></button>
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

    container.querySelectorAll('.action-view').forEach(btn => {
        btn.addEventListener('click', () => navigate('listing', { id: btn.dataset.id }));
    });

    container.querySelectorAll('.action-edit').forEach(btn => {
        btn.addEventListener('click', () => navigate('post', { listingId: btn.dataset.id }));
    });

    container.querySelector('#empty-list-item')?.addEventListener('click', () => navigate('post', { kind: 'sale' }));
    container.querySelector('#empty-post-room')?.addEventListener('click', () => navigate('post', { kind: 'rental' }));

    container.querySelectorAll('.action-toggle').forEach(btn => {
        btn.addEventListener('click', async () => {
            const l = db.listings.findById(btn.dataset.id);
            if (!l) return;
            if (_isSold(l)) return;
            const currentlyActive = _isActive(l);
            const nextStatus = currentlyActive ? 'paused' : 'active';
            const nextIsActive = !currentlyActive;
            await db.listings.update(btn.dataset.id, { status: nextStatus, is_active: nextIsActive });
            _render();
        });
    });

    container.querySelectorAll('.action-promote').forEach(btn => {
        btn.addEventListener('click', () => navigate('post', { listingId: btn.dataset.id, promote: true }));
    });

    container.querySelectorAll('.action-sold').forEach(btn => {
        btn.addEventListener('click', async () => {
            await api.markSold(btn.dataset.id, true).catch(() => null);
            await db.listings.update(btn.dataset.id, { status: 'sold', sold_at: new Date().toISOString(), is_active: false });
            activeFilter = 'sold';
            _render();
        });
    });

    container.querySelectorAll('.action-delete').forEach(btn => {
        btn.addEventListener('click', () => {
            showBottomSheet({
                title: 'Delete Listing',
                content: `
                    <div style="padding: 10px 0; text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 16px;">🗑️</div>
                        <div style="font-size: 1.1rem; font-weight: 800; color: #1e293b; margin-bottom: 8px;">Are you sure?</div>
                        <div style="font-size: 0.9rem; color: #64748b; line-height: 1.5;">This will permanently remove your listing. This action cannot be undone.</div>
                    </div>
                `,
                actions: [
                    { 
                        label: 'Yes, Delete', 
                        variant: 'danger', 
                        onClick: async () => {
                            await db.listings.delete(btn.dataset.id);
                            // No need to call _render() manually as we have the db-synced listener now
                        }
                    },
                    { label: 'Cancel', variant: 'outline', onClick: () => {} }
                ]
            });
        });
    });
  }

  function _showEditPopup(id) {
    const l = db.listings.findById(id);
    if (!l) return;
    const isSale = _isSale(l);
    const priceValue = isSale ? (l.price ?? l.rent ?? 0) : (l.rent ?? l.price ?? 0);

    const content = `
      <div style="padding: 0 4px;">
        <div class="mobile-form-group">
          <label class="mobile-form-label">Title *</label>
          <input class="mobile-input" id="ep-title" type="text" value="${_esc(l.title)}">
        </div>

        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="mobile-form-group">
            <label class="mobile-form-label">${isSale ? 'Price ($) *' : 'Price ($/mo) *'}</label>
            <input class="mobile-input" id="ep-price" type="number" value="${priceValue}">
          </div>
          ${isSale ? `
          <div class="mobile-form-group">
            <label class="mobile-form-label">Condition</label>
            <select class="mobile-input" id="ep-condition">
              ${['new','like_new','good','fair'].map(c => `<option value="${c}" ${String(l.condition || 'good') === c ? 'selected' : ''}>${c.replace('_',' ')}</option>`).join('')}
            </select>
          </div>
          ` : `
          <div class="mobile-form-group">
            <label class="mobile-form-label">Deposit ($)</label>
            <input class="mobile-input" id="ep-deposit" type="number" value="${l.deposit || 0}">
          </div>
          `}
        </div>

        ${isSale ? `
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px;">
          <div class="mobile-form-group">
            <label class="mobile-form-label">Brand</label>
            <input class="mobile-input" id="ep-brand" type="text" value="${_esc(l.brand || '')}">
          </div>
          <div class="mobile-form-group" style="display:flex; justify-content:space-between; align-items:center; background:#f8fafc; padding:12px 16px; border-radius:12px; margin-bottom:20px;">
            <span style="font-weight:700; font-size:0.9rem; color:#475569;">Negotiable</span>
            <input type="checkbox" id="ep-negotiable" ${l.negotiable !== false ? 'checked' : ''} style="width:20px;height:20px;">
          </div>
        </div>
        ` : `
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
        `}

        <div class="mobile-form-group">
          <label class="mobile-form-label">Description</label>
          <textarea class="mobile-input" id="ep-desc" style="height:120px; padding:12px; line-height:1.5;">${_esc(l.description)}</textarea>
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
    sheet.querySelector('#ep-utilities')?.addEventListener('change', (e) => {
        const toggle = e.target.nextElementSibling;
        const knob = toggle.querySelector('span');
        toggle.style.backgroundColor = e.target.checked ? '#1a1a1a' : '#cbd5e1';
        knob.style.transform = e.target.checked ? 'translateX(20px)' : 'none';
    });
  }

  async function _handlePopupSave(id) {
    const sheet = document.querySelector('.mobile-sheet');
    const existing = db.listings.findById(id);
    const isSale = _isSale(existing);
    const price = parseFloat(sheet.querySelector('#ep-price').value) || 0;
    const base = {
      title: sheet.querySelector('#ep-title').value.trim(),
      description: sheet.querySelector('#ep-desc').value.trim()
    };
    const updates = isSale ? {
      ...base,
      price,
      condition: sheet.querySelector('#ep-condition')?.value || existing?.condition || 'good',
      brand: sheet.querySelector('#ep-brand')?.value.trim() || '',
      negotiable: !!sheet.querySelector('#ep-negotiable')?.checked,
    } : {
      ...base,
      rent: price,
      deposit: parseInt(sheet.querySelector('#ep-deposit').value) || 0,
      room_type: sheet.querySelector('#ep-roomtype').value,
      available_from: sheet.querySelector('#ep-date').value,
      min_stay: sheet.querySelector('#ep-minstay').value,
      utilities_included: sheet.querySelector('#ep-utilities').checked,
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
