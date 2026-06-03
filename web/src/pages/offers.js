import { renderNavbar, initNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { api } from '../services/api.js';
import { navigate } from '../router.js';
import { getAssetUrl, getAvatarUrl } from '../services/assets.js';
import { setSEO } from '../seo.js';

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
}

function photoUrl(offer) {
    let photos = offer.images || [];
    if (typeof photos === 'string') { try { photos = JSON.parse(photos || '[]'); } catch (_) { photos = []; } }
    const first = Array.isArray(photos) ? photos[0] : photos;
    const src = typeof first === 'object' && first ? (first.medium || first.thumb || first.full) : first;
    return getAssetUrl(src || 'https://images.unsplash.com/photo-1517705008128-361805f42e86?w=800&h=600&fit=crop');
}

function statusClass(status) {
    return status === 'accepted' ? 'ok' : status === 'declined' ? 'bad' : 'pending';
}

function offerRow(offer, mode) {
    const otherName = mode === 'received' ? offer.buyer_name : offer.seller_name;
    const otherPhoto = mode === 'received' ? offer.buyer_photo : offer.seller_photo;
    return `
        <article class="offer-row" data-offer-id="${escHtml(offer.offer_id)}">
            <img class="offer-thumb" src="${photoUrl(offer)}" alt="${escHtml(offer.listing_title)}" loading="lazy">
            <div class="offer-main">
                <div class="offer-top">
                    <h3>${escHtml(offer.listing_title || 'Listing')}</h3>
                    <span class="offer-status ${statusClass(offer.status)}">${escHtml(offer.status || 'pending')}</span>
                </div>
                <div class="offer-amount">$${Number(offer.amount || 0).toLocaleString()}</div>
                <div class="offer-person">
                    <img src="${getAvatarUrl(otherPhoto, otherName || 'User')}" alt="" loading="lazy">
                    <span>${mode === 'received' ? 'From' : 'To'} ${escHtml(otherName || 'User')}</span>
                </div>
                <div class="offer-actions">
                    <button class="offer-link" data-thread="${escHtml(offer.thread_id || '')}"><i class="fa-solid fa-comments"></i> Open chat</button>
                    <a class="offer-link" href="/listing/${escHtml(offer.listing_id)}"><i class="fa-solid fa-tag"></i> View listing</a>
                    ${mode === 'received' && offer.status === 'pending' ? `
                        <button class="offer-action accept" data-status="accepted">Accept</button>
                        <button class="offer-action decline" data-status="declined">Decline</button>
                    ` : ''}
                </div>
            </div>
        </article>
    `;
}

export function renderOffersPage(app) {
    setSEO({
        title: 'Offers | RoommateGroups',
        description: 'Manage sent and received marketplace offers.',
        canonical: 'https://roommategroups.com/offers',
    });

    let offers = { sent: [], received: [] };
    let active = 'received';

    function renderShell(loading = false, error = '') {
        const rows = offers[active] || [];
        app.innerHTML = `
            <style>
                .offers-page { background:#f8fafc; min-height:100vh; padding:42px 24px 72px; }
                .offers-shell { max-width:980px; margin:0 auto; }
                .offers-head { display:flex; justify-content:space-between; gap:16px; align-items:end; margin-bottom:22px; }
                .offers-head h1 { margin:0; color:#0f172a; font-size:2rem; font-weight:900; }
                .offers-tabs { display:flex; gap:8px; background:#e2e8f0; padding:4px; border-radius:12px; }
                .offers-tab { border:none; border-radius:9px; padding:10px 16px; font-weight:900; color:#475569; background:transparent; cursor:pointer; }
                .offers-tab.active { background:#fff; color:#0f172a; box-shadow:0 1px 4px rgba(15,23,42,.08); }
                .offer-list { display:grid; gap:14px; }
                .offer-row { display:grid; grid-template-columns:120px 1fr; gap:16px; background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:14px; }
                .offer-thumb { width:120px; height:120px; object-fit:cover; border-radius:12px; background:#e2e8f0; }
                .offer-top { display:flex; justify-content:space-between; gap:12px; align-items:start; }
                .offer-top h3 { margin:0; color:#0f172a; font-size:1.05rem; }
                .offer-amount { color:#0f172a; font-size:1.35rem; font-weight:900; margin:8px 0; }
                .offer-person { display:flex; align-items:center; gap:8px; color:#64748b; font-size:.9rem; }
                .offer-person img { width:24px; height:24px; border-radius:50%; object-fit:cover; }
                .offer-status { text-transform:capitalize; border-radius:999px; padding:5px 10px; font-weight:900; font-size:.75rem; }
                .offer-status.pending { background:#fff7ed; color:#9a3412; }
                .offer-status.ok { background:#dcfce7; color:#047857; }
                .offer-status.bad { background:#fee2e2; color:#b91c1c; }
                .offer-actions { display:flex; flex-wrap:wrap; gap:8px; margin-top:14px; }
                .offer-link, .offer-action { border:1px solid #e2e8f0; background:#fff; color:#1e293b; border-radius:10px; padding:9px 12px; font-weight:900; text-decoration:none; cursor:pointer; }
                .offer-action.accept { background:#0f172a; color:#fff; border-color:#0f172a; }
                .offer-action.decline { color:#b91c1c; border-color:#fecaca; }
                .offers-empty { background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:36px; color:#64748b; text-align:center; }
                @media (max-width:640px) { .offers-head { align-items:stretch; flex-direction:column; } .offer-row { grid-template-columns:1fr; } .offer-thumb { width:100%; height:180px; } }
            </style>
            ${renderNavbar()}
            <div class="offers-page">
                <div class="offers-shell">
                    <div class="offers-head">
                        <div><h1>Offers</h1><p style="margin:6px 0 0;color:#64748b;">Manage marketplace negotiations.</p></div>
                        <div class="offers-tabs">
                            <button class="offers-tab ${active === 'received' ? 'active' : ''}" data-tab="received">Received (${offers.received.length})</button>
                            <button class="offers-tab ${active === 'sent' ? 'active' : ''}" data-tab="sent">Sent (${offers.sent.length})</button>
                        </div>
                    </div>
                    ${loading ? '<div class="offers-empty">Loading offers...</div>' : error ? `<div class="offers-empty">${escHtml(error)}</div>` : rows.length ? `<div class="offer-list">${rows.map(o => offerRow(o, active)).join('')}</div>` : '<div class="offers-empty">No offers here yet.</div>'}
                </div>
            </div>
            ${renderFooter()}
        `;
        initNavbar();
        app.querySelectorAll('.offers-tab').forEach(btn => btn.addEventListener('click', () => {
            active = btn.dataset.tab;
            renderShell();
        }));
        app.querySelectorAll('.offer-link[data-thread]').forEach(btn => btn.addEventListener('click', () => {
            if (btn.dataset.thread) navigate('/dashboard/messages?threadId=' + btn.dataset.thread);
        }));
        app.querySelectorAll('.offer-action').forEach(btn => btn.addEventListener('click', async () => {
            const row = btn.closest('.offer-row');
            const id = row?.dataset.offerId;
            if (!id) return;
            btn.disabled = true;
            await api.respondOffer(id, btn.dataset.status);
            const offer = offers.received.find(o => o.offer_id === id);
            if (offer) offer.status = btn.dataset.status;
            renderShell();
        }));
    }

    renderShell(true);
    api.getOffers(true).then(data => {
        offers = { sent: data?.sent || [], received: data?.received || [] };
        renderShell();
    }).catch(err => renderShell(false, err.message || 'Could not load offers.'));
}
