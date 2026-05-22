/**
 * src/mobile/pages/MobileArchivedChats.js
 * Archived conversation list with unarchive support.
 */

import { getCurrentUser } from '../../../web/src/services/auth.js';
import { db, initDB } from '../../../web/src/services/db.js';
import * as msgService from '../../../web/src/services/messaging.js';
import { getAvatarUrl } from '../../../web/src/services/assets.js';

async function getMobile() { return await import('../mobile-main.js'); }

export async function init(container) {
  const user = getCurrentUser();
  if (!user) { (await getMobile()).navigate('auth'); return; }

  const { updateHeader, goBack, navigate } = await getMobile();
  updateHeader({ title: 'Archived Chats', showBack: true, onBack: goBack, rightAction: null });

  await initDB().catch(() => {});

  function _render() {
    const threads = msgService.getThreadsForUser(user.user_id || user.id, 'archived');

    if (threads.length === 0) {
      container.innerHTML = `
        <div class="mobile-empty" style="padding:100px 24px;">
          <div class="mobile-empty-icon">📁</div>
          <div class="mobile-empty-title">No archived chats</div>
          <div class="mobile-empty-text">Archived conversations will appear here.</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div style="background:#f8fafc;min-height:100%;padding:16px;padding-bottom:40px;overflow-y:scroll;-webkit-overflow-scrolling:touch;touch-action:pan-x pan-y;overscroll-behavior-y:contain;will-change:auto;">
        <div style="display:flex;flex-direction:column;gap:12px;">
          ${threads.map(t => _threadRow(t)).join('')}
        </div>
      </div>
    `;

    container.querySelectorAll('.archived-row').forEach(row => {
      row.addEventListener('click', e => {
        if (e.target.closest('.unarchive-btn')) return;
        navigate('chat-detail', { threadId: row.dataset.threadId });
      });
    });

    container.querySelectorAll('.unarchive-btn').forEach(btn => {
      btn.addEventListener('click', async e => {
        e.stopPropagation();
        btn.disabled = true;
        try {
          await db.threads.update(btn.dataset.threadId, { is_archived: false, archived_by: null });
          msgService.unarchiveThread(btn.dataset.threadId);
          _render();
        } catch (err) {
          btn.disabled = false;
          alert('Could not unarchive this chat. Please try again.');
        }
      });
    });
  }

  function _threadRow(t) {
    let parts = [];
    try { parts = Array.isArray(t.participants) ? t.participants : JSON.parse(t.participants || '[]'); } catch (_) {}
    const otherId = parts.find(id => id !== (user.user_id || user.id));
    const other = otherId ? db.users.findById(otherId) : null;
    const listing = db.listings.findById(t.listing_id);
    const name = other?.display_name || other?.fullName || 'User';
    return `
      <div class="archived-row" data-thread-id="${t.thread_id || t.id}" style="background:#fff;border:1px solid #f1f5f9;border-radius:16px;padding:14px;display:flex;align-items:center;gap:12px;cursor:pointer;">
        <img src="${getAvatarUrl(other?.profile_photo || other?.avatar, name)}" alt="" style="width:48px;height:48px;border-radius:16px;object-fit:cover;flex-shrink:0;">
        <div style="flex:1;min-width:0;">
          <div style="font-size:0.95rem;font-weight:800;color:#1e293b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_esc(name)}</div>
          ${listing ? `<div style="font-size:0.75rem;color:var(--mobile-accent);font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_esc(listing.title)}</div>` : ''}
          <div style="font-size:0.82rem;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${_esc(t.last_message_preview || 'Archived conversation')}</div>
        </div>
        <button class="unarchive-btn" data-thread-id="${t.thread_id || t.id}" style="border:none;background:#f1f5f9;color:#1a1a1a;border-radius:12px;padding:10px 12px;font-size:0.78rem;font-weight:800;cursor:pointer;">Unarchive</button>
      </div>
    `;
  }

  _render();
}

function _esc(str) {
  return String(str || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c]));
}

export default init;
