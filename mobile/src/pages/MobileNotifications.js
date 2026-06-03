/**
 * src/mobile/pages/MobileNotifications.js
 * Notifications feed for mobile.
 */

import { db } from '../../../web/src/services/db.js';
import { getCurrentUser } from '../../../web/src/services/auth.js';

async function getMobile() { return await import('../mobile-main.js'); }

const MARKETPLACE_ALERT_TYPES = new Set([
  'new_offer',
  'offer_accepted',
  'offer_declined',
  'price_drop',
  'saved_search_match',
  'seller_relist_prompt',
  'rental_furnish_prompt',
]);

export async function init(container) {
  const user = getCurrentUser();
  if (!user) {
    (await getMobile()).navigate('auth');
    return;
  }

  const { updateHeader, updateBellBadge } = await getMobile();

  const allNotifs = (db.notifications?.findAll?.() || []);
  const notifications = allNotifs
    .filter(n => (n.user_id === user.user_id) || (n.userId === user.user_id))
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  // Immediately clear the bell badge now that the user has opened the page
  const unreadCount = notifications.filter(n => !n.is_read).length;
  if (typeof updateBellBadge === 'function') updateBellBadge(0);

  function _updateHeaderState() {
    updateHeader({
      title: 'Notifications',
      showBack: true,
      rightAction: notifications.length > 0 ? {
        icon: '<span style="font-size:0.85rem; font-weight:600; color:#ef4444; padding:0 8px;">Clear All</span>',
        label: 'Clear All',
        onClick: async () => {
          if (confirm('Are you sure you want to clear all notifications?')) {
            try {
              for (const n of notifications) {
                await db.notifications.delete(n.notification_id || n.id);
              }
            } catch (err) {
              console.warn('[Notif] clear all failed', err);
            }
            notifications.length = 0;
            _render();
          }
        }
      } : null
    });
  }

  function _render() {
    _updateHeaderState();

    if (notifications.length === 0) {
      container.innerHTML = `
        <div class="mobile-empty" style="padding: 100px 24px; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 16px;">🔔</div>
          <div style="font-size: 1.2rem; font-weight: 800; color: #1e293b; margin-bottom: 8px;">No notifications</div>
          <div style="font-size: 0.9rem; color: #94a3b8; line-height: 1.5;">We'll let you know when something important happens.</div>
        </div>
      `;
      return;
    }

    const marketplaceAlerts = notifications.filter(_isMarketplaceAlert);
    const feedNotifications = notifications.filter(n => !_isMarketplaceAlert(n));

    container.innerHTML = `
      <div style="background: #f8fafc; min-height: 100%;">
        <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
          ${marketplaceAlerts.length ? _renderMarketplaceGroup(marketplaceAlerts) : ''}
          ${feedNotifications.length ? feedNotifications.map(n => _renderNotificationRow(n)).join('') : ''}
        </div>
      </div>
    `;

    container.querySelectorAll('.notif-row').forEach(row => {
      const deleteBtn = row.querySelector('.notif-delete-btn');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', async (e) => {
          e.stopPropagation();
          const id = row.dataset.id;
          try {
            await db.notifications.delete(id);
          } catch (err) {
            console.warn('[Notif] delete failed', err);
          }
          const idx = notifications.findIndex(n => (n.notification_id === id) || (n.id === id));
          if (idx !== -1) notifications.splice(idx, 1);
          _render();
        });
      }

      row.addEventListener('click', async () => {
        // Resolve correct ID — D1 uses notification_id as primary key
        const id = row.dataset.id;
        const type = row.dataset.type;
        const threadId = row.dataset.thread;
        const listingId = row.dataset.listing;
        const senderId = row.dataset.sender;
        const url = row.dataset.url;
        
        // Mark as read locally and on server
        try { await db.notifications.update(id, { is_read: true }); } catch(e) { console.warn('[Notif] mark-read failed', e); }
        
        // Update local array for instant UI feedback
        const nIdx = notifications.findIndex(n => (n.notification_id === id) || (n.id === id));
        if (nIdx !== -1) notifications[nIdx].is_read = true;

        // Update bell badge immediately
        const stillUnread = notifications.filter(n => !n.is_read).length;
        if (typeof updateBellBadge === 'function') updateBellBadge(stillUnread);
        
        await _navigateNotification({ type, threadId, listingId, senderId, url });
      });
    });

    container.querySelector('#mp-alerts-open')?.addEventListener('click', async () => {
      const first = marketplaceAlerts[0];
      await _navigateNotification({
        type: first?.type || 'saved_search_match',
        threadId: first?.thread_id || first?.threadId || '',
        listingId: first?.listing_id || first?.listingId || '',
        senderId: first?.sender_id || first?.senderId || '',
        url: _notifUrl(first),
      });
    });

    container.querySelector('#mp-alerts-search')?.addEventListener('click', async () => {
      (await getMobile()).navigate('search', { kind: 'sale', sort: 'newest' });
    });

    container.querySelector('#mp-alerts-offers')?.addEventListener('click', async () => {
      (await getMobile()).navigate('offers');
    });
  }

  function _renderMarketplaceGroup(items) {
    const unread = items.filter(n => !n.is_read).length;
    const offerCount = items.filter(n => ['new_offer', 'offer_accepted', 'offer_declined'].includes(n.type)).length;
    const latest = items[0];
    return `
      <section style="background:#111827;color:#fff;border-radius:20px;padding:16px;box-shadow:0 14px 30px rgba(15,23,42,.16);">
        <div style="display:flex;align-items:flex-start;gap:12px;">
          <div style="width:42px;height:42px;border-radius:14px;background:rgba(255,255,255,.14);display:flex;align-items:center;justify-content:center;font-size:1.25rem;flex-shrink:0;">🛍️</div>
          <div style="flex:1;min-width:0;">
            <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;">
              <h3 style="margin:0;font-size:1rem;font-weight:900;">Marketplace updates</h3>
              <span style="font-size:.68rem;font-weight:900;background:rgba(255,255,255,.14);border-radius:999px;padding:4px 8px;">${items.length} alert${items.length === 1 ? '' : 's'}</span>
            </div>
            <p style="margin:6px 0 0;color:rgba(255,255,255,.72);font-size:.8rem;line-height:1.45;">
              ${unread ? `${unread} unread. ` : ''}${_esc(latest?.title || 'Offers, saved searches, and price drops are ready.')}
            </p>
          </div>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;">
          <button id="mp-alerts-open" style="border:none;background:#fff;color:#111827;border-radius:12px;height:38px;padding:0 12px;font-size:.78rem;font-weight:900;">Open latest</button>
          <button id="mp-alerts-search" style="border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;border-radius:12px;height:38px;padding:0 12px;font-size:.78rem;font-weight:900;">Browse deals</button>
          ${offerCount ? `<button id="mp-alerts-offers" style="border:1px solid rgba(255,255,255,.22);background:rgba(255,255,255,.08);color:#fff;border-radius:12px;height:38px;padding:0 12px;font-size:.78rem;font-weight:900;">Offers (${offerCount})</button>` : ''}
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:14px;">
          ${items.slice(0, 4).map(n => _renderNotificationRow(n, true)).join('')}
        </div>
      </section>
    `;
  }

  function _renderNotificationRow(n, compact = false) {
    const bodyText = n.message || n.description || n.body || '';
    const titleText = n.title || 'Notification';
    return `
      <div class="notif-row"
        data-id="${n.notification_id || n.id}"
        data-type="${n.type || ''}"
        data-thread="${n.thread_id || n.threadId || ''}"
        data-listing="${n.listing_id || n.listingId || ''}"
        data-sender="${n.sender_id || n.senderId || ''}"
        data-url="${_esc(_notifUrl(n))}"
        style="position: relative; background: ${compact ? 'rgba(255,255,255,.1)' : n.is_read ? '#fff' : 'var(--mobile-accent-soft)'}; border-radius: ${compact ? '14px' : '16px'}; padding: ${compact ? '12px' : '16px'}; border: 1px solid ${compact ? 'rgba(255,255,255,.12)' : '#f1f5f9'}; display: flex; gap: 12px; align-items: flex-start; cursor: pointer;"
      >
        <div style="position: relative; width: ${compact ? '34px' : '40px'}; height: ${compact ? '34px' : '40px'}; border-radius: 12px; background: ${compact ? 'rgba(255,255,255,.14)' : '#fff'}; border: 1px solid ${compact ? 'rgba(255,255,255,.1)' : '#f1f5f9'}; display: flex; align-items: center; justify-content: center; font-size: 1.1rem; flex-shrink: 0;">
          ${_getIcon(n.type)}
          ${!n.is_read ? `<div style="position: absolute; top: -2px; right: -2px; width: 10px; height: 10px; border-radius: 50%; background: var(--mobile-accent); border: 2px solid ${compact ? '#111827' : '#fff'};"></div>` : ''}
        </div>
        <div style="flex: 1; padding-right: 24px; min-width:0;">
          <div style="font-size: ${compact ? '.82rem' : '.9rem'}; font-weight: 800; color: ${compact ? '#fff' : '#1e293b'}; margin-bottom: 4px; white-space:${compact ? 'nowrap' : 'normal'}; overflow:hidden; text-overflow:ellipsis;">${_esc(titleText)}</div>
          <div style="font-size: ${compact ? '.74rem' : '.8rem'}; color: ${compact ? 'rgba(255,255,255,.72)' : '#64748b'}; line-height: 1.4;">${_esc(bodyText)}</div>
          <div style="font-size: 0.7rem; color: ${compact ? 'rgba(255,255,255,.55)' : '#94a3b8'}; margin-top: 8px; font-weight: 700;">${_formatTime(n.created_at)}</div>
        </div>
        <button class="notif-delete-btn" aria-label="Delete Notification" style="position: absolute; top: ${compact ? '8px' : '12px'}; right: ${compact ? '8px' : '12px'}; background: none; border: none; font-size: 1.2rem; color: ${compact ? 'rgba(255,255,255,.46)' : '#cbd5e1'}; padding: 4px; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">&times;</button>
      </div>
    `;
  }

  function _isMarketplaceAlert(n) {
    return MARKETPLACE_ALERT_TYPES.has(n?.type);
  }

  function _notifUrl(n) {
    return n?.website_url || n?.link || '';
  }

  async function _navigateNotification({ type, threadId, listingId, senderId, url }) {
    const mobile = await getMobile();
    const parsed = _parseUrl(url);
    const path = parsed?.pathname || '';
    const threadFromUrl = parsed?.searchParams.get('thread_id') || parsed?.searchParams.get('threadId') || '';
    const listingFromUrl = path.startsWith('/listing/') ? path.split('/listing/')[1].split('/')[0] : '';

    if (type === 'message' || type === 'new_message' || type === 'new_offer' || type === 'offer_accepted' || type === 'offer_declined') {
      const targetThread = threadId || threadFromUrl;
      if (targetThread) return mobile.navigate('chat-detail', { threadId: targetThread });
      if (senderId) return mobile.navigate('chat-detail', { userId: senderId });
      if (type?.startsWith('offer')) return mobile.navigate('offers');
      return mobile.navigate('chat');
    }

    if (type === 'seller_relist_prompt' || path === '/post-listing') {
      const params = parsed ? Object.fromEntries(parsed.searchParams.entries()) : { kind: 'sale' };
      return mobile.navigate('post', { kind: 'sale', ...params });
    }

    if (type === 'rental_furnish_prompt' || path === '/search/rooms' || path === '/search') {
      const params = parsed ? Object.fromEntries(parsed.searchParams.entries()) : {};
      return mobile.navigate('search', { kind: 'sale', category: 'furniture', ...params });
    }

    if (listingId || listingFromUrl) {
      return mobile.navigate('listing', { id: listingId || listingFromUrl });
    }

    if (path === '/offers') return mobile.navigate('offers');
    if (url) return mobile.navigate(url);
    _render();
  }

  function _parseUrl(url) {
    if (!url) return null;
    try { return new URL(url, 'https://roommategroups.com'); } catch (_) { return null; }
  }

  function _getIcon(type) {
    const icons = {
      message: '💬',
      new_message: '💬',
      listing: '🏠',
      listing_approved: '✅',
      listing_rejected: '❌',
      moderation_pending: '⏳',
      alert: '⚠️',
      system: '⚙️',
      verification: '🛡️',
      favorite: '❤️',
      new_offer: '💸',
      offer_accepted: '✅',
      offer_declined: '↩️',
      price_drop: '🏷️',
      saved_search_match: '🔎',
      seller_relist_prompt: '🚀',
      rental_furnish_prompt: '🛋️',
      review_prompt: '⭐',
    };
    return icons[type] || '🔔';
  }

  function _formatTime(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
    if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function _esc(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c]));
  }

  _render();
}

export const renderMobileNotifications = init;
