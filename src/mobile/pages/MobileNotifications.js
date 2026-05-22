/**
 * src/mobile/pages/MobileNotifications.js
 * Notifications feed for mobile.
 */

import { db } from '../../services/db.js';
import { getCurrentUser } from '../../services/auth.js';

async function getMobile() { return await import('../mobile-main.js'); }

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

    container.innerHTML = `
      <div style="background: #f8fafc; min-height: 100%;">
        <div style="padding: 16px; display: flex; flex-direction: column; gap: 12px;">
          ${notifications.map(n => {
            const bodyText = n.message || n.description || n.body || '';
            const titleText = n.title || 'Notification';
            return `
            <div class="notif-row"
              data-id="${n.notification_id || n.id}"
              data-type="${n.type}"
              data-thread="${n.thread_id || n.threadId || ''}"
              data-listing="${n.listing_id || n.listingId || ''}"
              data-sender="${n.sender_id || n.senderId || ''}"
              data-url="${n.website_url || ''}"
              style="position: relative; background: ${n.is_read ? '#fff' : 'var(--mobile-accent-soft)'}; border-radius: 16px; padding: 16px; border: 1px solid #f1f5f9; display: flex; gap: 12px; align-items: flex-start; cursor: pointer;"
            >
              <div style="position: relative; width: 40px; height: 40px; border-radius: 12px; background: #fff; border: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;">
                ${_getIcon(n.type)}
                ${!n.is_read ? `<div style="position: absolute; top: -2px; right: -2px; width: 10px; height: 10px; border-radius: 50%; background: var(--mobile-accent); border: 2px solid #fff;"></div>` : ''}
              </div>
              <div style="flex: 1; padding-right: 24px;">
                <div style="font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 4px;">${_esc(titleText)}</div>
                <div style="font-size: 0.8rem; color: #64748b; line-height: 1.4;">${_esc(bodyText)}</div>
                <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 8px; font-weight: 600;">${_formatTime(n.created_at)}</div>
              </div>
              <button class="notif-delete-btn" aria-label="Delete Notification" style="position: absolute; top: 12px; right: 12px; background: none; border: none; font-size: 1.2rem; color: #cbd5e1; padding: 4px; border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer;">&times;</button>
            </div>
          `}).join('')}
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
        
        // Deep linking logic
        if (type === 'message' || type === 'new_message') {
            if (threadId) {
                (await getMobile()).navigate('chat-detail', { threadId });
            } else if (senderId) {
                (await getMobile()).navigate('chat-detail', { userId: senderId });
            } else {
                (await getMobile()).navigate('chat');
            }
        } else if (type === 'listing_approved' || type === 'listing_rejected' || type === 'favorite' || type === 'moderation_pending') {
            if (listingId) {
                (await getMobile()).navigate('listing', { id: listingId });
            } else if (url && url.includes('/listing/')) {
                const parts = url.split('/');
                (await getMobile()).navigate('listing', { id: parts[parts.length - 1] });
            } else {
                (await getMobile()).navigate('dashboard');
            }
        } else if (url) {
            (await getMobile()).navigate(url);
        } else {
            _render();
        }
      });
    });
  }

  function _getIcon(type) {
    const icons = { message: '💬', new_message: '💬', listing: '🏠', listing_approved: '✅', listing_rejected: '❌', moderation_pending: '⏳', alert: '⚠️', system: '⚙️', verification: '🛡️', favorite: '❤️' };
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
