/**
 * src/mobile/pages/MobileBlockList.js
 * Blocked users management for mobile settings.
 */

import { getCurrentUser } from '../../../web/src/services/auth.js';
import { db } from '../../../web/src/services/db.js';
import { getAvatarUrl } from '../../../web/src/services/assets.js';

async function getMobile() { return await import('../mobile-main.js'); }

export async function init(container) {
  const user = getCurrentUser();
  if (!user) { (await getMobile()).navigate('auth'); return; }

  const { updateHeader, goBack, navigate } = await getMobile();
  updateHeader({ title: 'Blocked Users', showBack: true, onBack: goBack, rightAction: null });

  function _render() {
    const dbUser = db.users.findById(user.user_id || user.id);
    const blockedIds = Array.isArray(dbUser?.blocked_users) ? dbUser.blocked_users : [];
    const blockedUsers = blockedIds.map(id => db.users.findById(id)).filter(Boolean);

    if (blockedIds.length === 0) {
      container.innerHTML = `
        <div class="mobile-empty" style="padding:100px 24px;">
          <div class="mobile-empty-icon">🚫</div>
          <div class="mobile-empty-title">No blocked users</div>
          <div class="mobile-empty-text">People you block from chat will appear here.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="background:#f8fafc;min-height:100%;padding:16px;padding-bottom:40px;overflow-y:scroll;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y;overscroll-behavior-y:contain;will-change:auto;">
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${blockedIds.map(id => {
            const blocked = blockedUsers.find(u => (u.user_id || u.id) === id);
            const name = blocked?.display_name || blocked?.fullName || 'Blocked user';
            return `
              <div class="blocked-row" data-user-id="${id}" style="background:#fff;border:1px solid #f1f5f9;border-radius:16px;padding:14px;display:flex;align-items:center;gap:12px;">
                <img src="${getAvatarUrl(blocked?.profile_photo || blocked?.avatar, name)}" alt="" style="width:44px;height:44px;border-radius:14px;object-fit:cover;flex-shrink:0;">
                <div style="flex:1;min-width:0;">
                  <div style="font-size:0.95rem;font-weight:800;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_esc(name)}</div>
                  <div style="font-size:0.78rem;color:#94a3b8;margin-top:2px;">Messages are blocked</div>
                </div>
                <button class="unblock-btn" data-user-id="${id}" style="border:none;background:#f1f5f9;color:#1a1a1a;border-radius:12px;padding:10px 14px;font-size:0.8rem;font-weight:800;cursor:pointer;">Unblock</button>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll('.blocked-row').forEach(row => {
      row.addEventListener('click', e => {
        if (e.target.closest('.unblock-btn')) return;
        navigate('profile', { userId: row.dataset.userId });
      });
    });

    container.querySelectorAll('.unblock-btn').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        const id = btn.dataset.userId;
        btn.disabled = true;
        const nextBlocked = blockedIds.filter(blockedId => blockedId !== id);
        const threads = db.threads.find(t => {
          let parts = [];
          try { parts = Array.isArray(t.participants) ? t.participants : JSON.parse(t.participants || '[]'); } catch (_) {}
          return parts.includes(user.user_id || user.id) && parts.includes(id);
        });
        try {
          await db.users.update(dbUser.user_id || dbUser.id, { blocked_users: nextBlocked });
          await Promise.all(threads.map(t => db.threads.update(t.thread_id || t.id, { blocked_by: null, blocked_user: null })));
          _render();
        } catch (err) {
          btn.disabled = false;
          alert('Could not unblock this user. Please try again.');
        }
      });
    });
  }

  _render();
}

function _esc(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c]));
}

export default init;
