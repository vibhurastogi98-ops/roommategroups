import { api } from '../../../web/src/services/api.js';
import { getAssetUrl, getAvatarUrl } from '../../../web/src/services/assets.js';

async function getMobile() {
  return await import('../mobile-main.js');
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
}

function offerPhoto(offer) {
  let photos = offer.images || [];
  if (typeof photos === 'string') { try { photos = JSON.parse(photos || '[]'); } catch (_) { photos = []; } }
  const first = Array.isArray(photos) ? photos[0] : photos;
  const src = typeof first === 'object' && first ? (first.thumb || first.medium || first.full) : first;
  return getAssetUrl(src || 'https://images.unsplash.com/photo-1517705008128-361805f42e86?w=600&h=450&fit=crop');
}

function statusStyle(status) {
  if (status === 'accepted') return 'background:#dcfce7;color:#047857;';
  if (status === 'declined') return 'background:#fee2e2;color:#b91c1c;';
  return 'background:#fff7ed;color:#9a3412;';
}

function offerCard(offer, mode) {
  const otherName = mode === 'received' ? offer.buyer_name : offer.seller_name;
  const otherPhoto = mode === 'received' ? offer.buyer_photo : offer.seller_photo;
  return `
    <div class="mo-offer" data-offer-id="${escHtml(offer.offer_id)}" style="background:#fff;border:1px solid #f1f5f9;border-radius:18px;padding:12px;display:flex;gap:12px;margin-bottom:12px;">
      <img src="${offerPhoto(offer)}" alt="${escHtml(offer.listing_title)}" style="width:88px;height:88px;border-radius:14px;object-fit:cover;flex-shrink:0;">
      <div style="flex:1;min-width:0;">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:start;">
          <div style="font-size:0.9rem;font-weight:900;color:#0f172a;line-height:1.25;overflow:hidden;text-overflow:ellipsis;">${escHtml(offer.listing_title || 'Listing')}</div>
          <span style="${statusStyle(offer.status)}border-radius:999px;padding:4px 8px;font-size:0.65rem;font-weight:900;text-transform:capitalize;white-space:nowrap;">${escHtml(offer.status || 'pending')}</span>
        </div>
        <div style="font-size:1.18rem;font-weight:900;color:#0f172a;margin:7px 0;">$${Number(offer.amount || 0).toLocaleString()}</div>
        <div style="display:flex;align-items:center;gap:6px;color:#64748b;font-size:0.74rem;">
          <img src="${getAvatarUrl(otherPhoto, otherName || 'User')}" alt="" style="width:20px;height:20px;border-radius:50%;object-fit:cover;">
          <span>${mode === 'received' ? 'From' : 'To'} ${escHtml(otherName || 'User')}</span>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
          <button class="mo-chat" data-thread="${escHtml(offer.thread_id || '')}" style="border:1px solid #e2e8f0;background:#fff;border-radius:10px;padding:7px 10px;font-size:0.74rem;font-weight:900;">Chat</button>
          ${mode === 'received' && offer.status === 'pending' ? `
            <button class="mo-action" data-status="accepted" style="border:none;background:#0f172a;color:#fff;border-radius:10px;padding:7px 10px;font-size:0.74rem;font-weight:900;">Accept</button>
            <button class="mo-action" data-status="declined" style="border:1px solid #fecaca;background:#fff;color:#b91c1c;border-radius:10px;padding:7px 10px;font-size:0.74rem;font-weight:900;">Decline</button>
          ` : ''}
        </div>
      </div>
    </div>
  `;
}

export default async function init(container) {
  const { updateHeader, navigate } = await getMobile();
  updateHeader({ title: 'Offers', showBack: true });

  let active = 'received';
  let data = { sent: [], received: [] };

  function render(loading = false, error = '') {
    const rows = data[active] || [];
    container.innerHTML = `
      <div class="mobile-page-content" style="padding:16px;">
        <div style="display:flex;gap:8px;background:#e2e8f0;border-radius:14px;padding:4px;margin-bottom:16px;">
          <button class="mo-tab" data-tab="received" style="flex:1;border:none;border-radius:10px;padding:10px;font-weight:900;background:${active === 'received' ? '#fff' : 'transparent'};color:${active === 'received' ? '#0f172a' : '#64748b'};">Received (${data.received.length})</button>
          <button class="mo-tab" data-tab="sent" style="flex:1;border:none;border-radius:10px;padding:10px;font-weight:900;background:${active === 'sent' ? '#fff' : 'transparent'};color:${active === 'sent' ? '#0f172a' : '#64748b'};">Sent (${data.sent.length})</button>
        </div>
        ${loading ? `
          <div class="mobile-empty" style="padding:48px 16px;"><div class="mobile-empty-title">Loading offers...</div></div>
        ` : error ? `
          <div class="mobile-empty" style="padding:48px 16px;"><div class="mobile-empty-title">Couldn't load offers</div><div class="mobile-empty-text">${escHtml(error)}</div></div>
        ` : rows.length ? rows.map(o => offerCard(o, active)).join('') : `
          <div class="mobile-empty" style="padding:48px 16px;"><div class="mobile-empty-title">No offers here yet</div></div>
        `}
      </div>
    `;

    container.querySelectorAll('.mo-tab').forEach(btn => btn.addEventListener('click', () => {
      active = btn.dataset.tab;
      render();
    }));
    container.querySelectorAll('.mo-chat').forEach(btn => btn.addEventListener('click', () => {
      if (btn.dataset.thread) navigate('chat-detail', { threadId: btn.dataset.thread });
    }));
    container.querySelectorAll('.mo-action').forEach(btn => btn.addEventListener('click', async () => {
      const id = btn.closest('.mo-offer')?.dataset.offerId;
      if (!id) return;
      btn.disabled = true;
      await api.respondOffer(id, btn.dataset.status);
      const offer = data.received.find(o => o.offer_id === id);
      if (offer) offer.status = btn.dataset.status;
      render();
    }));
  }

  render(true);
  try {
    data = await api.getOffers(true) || { sent: [], received: [] };
    render();
  } catch (err) {
    render(false, err.message || 'Please try again.');
  }
}
