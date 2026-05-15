/**
 * src/mobile/pages/MobileMessages.js
 * Conversation list screen for mobile.
 */

import { getCurrentUser } from '../../services/auth.js';
import { db, initDB, syncMessagesAndThreads } from '../../services/db.js';
import * as msgService from '../../services/messaging.js';
import { getAssetUrl, getAvatarUrl } from '../../services/assets.js';

async function getMobile() { return await import('../mobile-main.js'); }

export async function init(container) {
  const user = getCurrentUser();
  if (!user) { (await getMobile()).navigate('auth'); return; }

  const { updateHeader, navigate } = await getMobile();

  let activeTab = 'all'; // all, unread, archived
  let searchQuery = '';

  updateHeader({
    title: 'Messages',
    showBack: false,
    rightAction: null
  });

  await initDB().catch(() => {});

  async function _render() {
    const threads = msgService.getThreadsForUser(user.user_id, activeTab);
    const filtered = threads.filter(t => {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      let parts = [];
      try { parts = Array.isArray(t.participants) ? t.participants : JSON.parse(t.participants || '[]'); } catch(e) {}
      const otherId = parts.find(id => id !== user.user_id);
      const other = db.users.findById(otherId);
      const listing = db.listings.findById(t.listing_id);
      return (other?.display_name || '').toLowerCase().includes(q) || (listing?.title || '').toLowerCase().includes(q);
    });

    container.innerHTML = `
      <div style="background:#f8fafc; height:100%; display:flex; flex-direction:column;">
        <!-- Search Bar -->
        <div style="padding:12px 16px; background:#fff; border-bottom:1px solid #f1f5f9;">
          <div style="position:relative;">
            <span style="position:absolute; left:12px; top:50%; transform:translateY(-50%); color:#94a3b8;">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            </span>
            <input type="text" id="msg-search" placeholder="Search conversations..." value="${_esc(searchQuery)}"
              style="width:100%; background:#f1f5f9; border:none; border-radius:12px; padding:10px 12px 10px 36px; font-size:0.9rem; outline:none;">
          </div>
        </div>

        <!-- Tabs -->
        <div style="display:flex; background:#fff; border-bottom:1px solid #f1f5f9; padding:0 4px;">
          ${_tab('all', 'All')}
          ${_tab('unread', 'Unread')}
          ${_tab('archived', 'Archived')}
        </div>

        <!-- List -->
        <div id="thread-list" style="flex:1; min-height:0; overflow-y:scroll; -webkit-overflow-scrolling:touch; touch-action:pan-x pan-y; overscroll-behavior-y:contain; will-change:auto;">
          ${filtered.length === 0 
            ? `<div style="padding:60px 40px; text-align:center; color:#94a3b8;">
                <div style="font-size:3rem; margin-bottom:16px;">📭</div>
                <div style="font-weight:700; color:#475569; margin-bottom:4px;">No messages found</div>
                <div style="font-size:0.85rem;">${searchQuery ? 'Try a different search term' : 'Your conversations will appear here'}</div>
               </div>`
            : filtered.map(t => _threadItem(t)).join('')
          }
        </div>
      </div>
    `;

    _wireEvents();
  }

  function _tab(id, label) {
    const active = activeTab === id;
    const count = id === 'unread' ? msgService.getTotalUnread(user.user_id) : 0;
    return `
      <div class="msg-tab" data-tab="${id}" style="flex:1; text-align:center; padding:14px 0; font-size:0.85rem; font-weight:700; color:${active ? '#1a1a1a' : '#94a3b8'}; border-bottom:2px solid ${active ? '#1a1a1a' : 'transparent'}; cursor:pointer; position:relative;">
        ${label}
        ${count > 0 ? `<span style="position:absolute; top:8px; right:20%; background:#ef4444; color:#fff; font-size:0.65rem; padding:1px 5px; border-radius:10px; min-width:14px;">${count}</span>` : ''}
      </div>
    `;
  }

  function _threadItem(t) {
    let parts = [];
    try { parts = Array.isArray(t.participants) ? t.participants : JSON.parse(t.participants || '[]'); } catch(e) {}
    const otherId = parts.find(id => id !== user.user_id);
    const other = db.users.findById(otherId);
    const listing = db.listings.findById(t.listing_id);
    const name = other?.display_name || 'User';
    const avatar = other?.profile_photo || other?.avatar;
    const preview = t.last_message_preview || 'New conversation';
    const time = _timeShort(t.last_message_at);
    const unread = msgService.getUnreadCountForThread(t.thread_id, user.user_id);

    return `
      <div class="thread-row" data-tid="${t.thread_id}" style="display:flex; align-items:center; gap:12px; padding:16px; background:#fff; border-bottom:1px solid #f8fafc; cursor:pointer; touch-action:manipulation;">
        <div style="position:relative; flex-shrink:0;">
          <div style="width:52px; height:52px; border-radius:16px; background:#f1f5f9; overflow:hidden; display:flex; align-items:center; justify-content:center; font-size:1.2rem; font-weight:700; color:#64748b; border:1px solid #f1f5f9;">
            <img src="${getAvatarUrl(avatar, name)}" style="width:100%; height:100%; object-fit:cover;">
          </div>
          ${unread > 0 ? `<div style="position:absolute; -top:2px; -right:2px; width:14px; height:14px; background:#ef4444; border:2px solid #fff; border-radius:50%;"></div>` : ''}
        </div>
        <div style="flex:1; min-width:0;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:4px;">
            <div style="font-weight:800; font-size:0.95rem; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${_esc(name)}</div>
            <div style="font-size:0.72rem; color:#94a3b8; font-weight:600;">${time}</div>
          </div>
          ${listing ? `<div style="font-size:0.75rem; color:#6366f1; font-weight:700; margin-bottom:2px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${_esc(listing.title)}</div>` : ''}
          <div style="font-size:0.85rem; color:${unread > 0 ? '#1e293b' : '#64748b'}; font-weight:${unread > 0 ? '700' : '400'}; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${_esc(preview)}</div>
        </div>
      </div>
    `;
  }

  function _wireEvents() {
    container.querySelector('#msg-search')?.addEventListener('input', (e) => {
      searchQuery = e.target.value;
      // Partial update to avoid losing focus
      const list = container.querySelector('#thread-list');
      const threads = msgService.getThreadsForUser(user.user_id, activeTab);
      const filtered = threads.filter(t => {
        if (!searchQuery) return true;
        const q = searchQuery.toLowerCase();
        let parts = [];
        try { parts = Array.isArray(t.participants) ? t.participants : JSON.parse(t.participants || '[]'); } catch(e) {}
        const otherId = parts.find(id => id !== user.user_id);
        const other = db.users.findById(otherId);
        const listing = db.listings.findById(t.listing_id);
        return (other?.display_name || '').toLowerCase().includes(q) || (listing?.title || '').toLowerCase().includes(q);
      });
      list.innerHTML = filtered.length === 0 
        ? `<div style="padding:60px 40px; text-align:center; color:#94a3b8;"><div style="font-size:3rem; margin-bottom:16px;">📭</div><div style="font-weight:700; color:#475569; margin-bottom:4px;">No messages found</div></div>`
        : filtered.map(t => _threadItem(t)).join('');
      
      list.querySelectorAll('.thread-row').forEach(row => {
        row.addEventListener('click', () => navigate('chat-detail', { threadId: row.dataset.tid }));
      });
    });

    container.querySelectorAll('.msg-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab;
        _render();
      });
    });

    container.querySelectorAll('.thread-row').forEach(row => {
      row.addEventListener('click', () => navigate('chat-detail', { threadId: row.dataset.tid }));
    });
  }

  function _timeShort(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000 && d.getDate() === now.getDate()) return d.toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
    if (diff < 604800000) return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
    return d.toLocaleDateString([], { day:'numeric', month:'short' });
  }

  function _esc(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c]));
  }

  await _render();

  // Polling for list updates
  const poll = setInterval(async () => {
    if (!container.isConnected) { clearInterval(poll); return; }
    const changed = await syncMessagesAndThreads().catch(() => false);
    if (changed) _render();
  }, 5000);
}
