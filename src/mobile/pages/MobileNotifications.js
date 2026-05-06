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

  const { updateHeader } = await getMobile();
  updateHeader({ title: 'Notifications', showBack: true });

  const notifications = (db.notifications?.findAll?.() || [])
    .filter(n => n.user_id === user.user_id)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  function _render() {
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
          ${notifications.map(n => `
            <div class="notif-row" data-id="${n.id}" style="background: ${n.is_read ? '#fff' : 'var(--mobile-accent-soft)'}; border-radius: 16px; padding: 16px; border: 1px solid #f1f5f9; display: flex; gap: 12px; align-items: flex-start; cursor: pointer;">
              <div style="width: 40px; height: 40px; border-radius: 12px; background: #fff; border: 1px solid #f1f5f9; display: flex; align-items: center; justify-content: center; font-size: 1.2rem; flex-shrink: 0;">
                ${_getIcon(n.type)}
              </div>
              <div style="flex: 1;">
                <div style="font-size: 0.9rem; font-weight: 700; color: #1e293b; margin-bottom: 4px;">${n.title}</div>
                <div style="font-size: 0.8rem; color: #64748b; line-height: 1.4;">${n.message}</div>
                <div style="font-size: 0.7rem; color: #94a3b8; margin-top: 8px; font-weight: 600;">${_formatTime(n.created_at)}</div>
              </div>
              ${!n.is_read ? `<div style="width: 8px; height: 8px; border-radius: 50%; background: var(--mobile-accent); margin-top: 6px;"></div>` : ''}
            </div>
          `).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll('.notif-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.dataset.id;
        db.notifications.update(id, { is_read: true });
        _render();
      });
    });
  }

  function _getIcon(type) {
    const icons = { message: '💬', listing: '🏠', alert: '⚠️', system: '⚙️', verification: '🛡️' };
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

  _render();
}

export const renderMobileNotifications = init;
