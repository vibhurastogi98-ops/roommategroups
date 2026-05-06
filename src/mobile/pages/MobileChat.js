/**
 * src/mobile/pages/MobileChat.js
 * Chat: thread list (no params) OR direct chat (params.userId).
 * Exports: async init(container, params)
 */

import { getCurrentUser } from '../../services/auth.js';
import { db } from '../../services/db.js';
import * as msgService from '../../services/messaging.js';
import { getAssetUrl } from '../../services/assets.js';

async function getMobile() { return await import('../mobile-main.js'); }

export async function init(container, params = {}) {
  const user = getCurrentUser();
  if (!user) { (await getMobile()).navigate('auth'); return; }

  // Request notification permission on first chat open
  msgService.requestPushPermission();

  if (params.threadId) {
    await _renderDirectChat(container, params.threadId, user);
  } else if (params.userId) {
    // Find or create thread first
    const thread = msgService.getOrCreateThread(user.user_id, params.userId, params.listingId || 'direct');
    await _renderDirectChat(container, thread.thread_id, user);
  } else {
    await _renderThreadList(container, user);
  }
}

export const renderMobileChat = init;

// ── Thread list ───────────────────────────────────────────────
async function _renderThreadList(container, user) {
  const { updateHeader, navigate } = await getMobile();
  updateHeader({ title: 'Messages', showBack: false });

  const render = (data) => {
    const { threads } = data;
    
    if (!threads.length) {
      container.innerHTML = `
        <div class="mobile-empty" style="padding:80px 24px;">
          <div class="mobile-empty-icon">📭</div>
          <div class="mobile-empty-title">No messages yet</div>
          <div class="mobile-empty-text">When you message a listing poster, your conversation appears here.</div>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div style="padding:8px 0;">
        ${threads.map(t => {
          const parts = Array.isArray(t.participants) ? t.participants : JSON.parse(t.participants || '[]');
          const otherId = parts.find(id => id !== user.user_id);
          const other = db.users.findById(otherId);
          const name = other?.display_name || other?.fullName || 'Unknown';
          const avatar = other?.profile_photo || other?.avatar;
          const text = t.last_message_preview || '…';
          const time = _timeShort(t.last_message_at);
          const unread = (t[`unread_count_${user.user_id}`] || 0) > 0;

          return `
            <div data-thread-id="${t.thread_id}" style="display:flex;align-items:center;gap:12px;padding:14px 16px;cursor:pointer;border-bottom:1px solid #f1f5f9;background:#fff;">
              <div style="position:relative;flex-shrink:0;">
                <div style="width:48px;height:48px;border-radius:50%;background:linear-gradient(135deg,#000000,#1a1a1a);display:flex;align-items:center;justify-content:center;font-size:1.1rem;font-weight:700;color:#fff;overflow:hidden;">
                  ${avatar ? `<img src="${getAssetUrl(avatar)}" style="width:100%;height:100%;object-fit:cover;">` : name.charAt(0).toUpperCase()}
                </div>
                ${unread ? `<div style="position:absolute;top:0;right:0;width:12px;height:12px;border-radius:50%;background:var(--mobile-accent);border:2px solid #fff;"></div>` : ''}
              </div>
              <div style="flex:1;min-width:0;">
                <div style="display:flex;align-items:center;justify-content:space-between;gap:8px;margin-bottom:2px;">
                  <div style="font-size:0.92rem;font-weight:${unread?'800':'600'};color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${name}</div>
                  <div style="font-size:0.7rem;color:#94a3b8;flex-shrink:0;">${time}</div>
                </div>
                <div style="font-size:0.8rem;color:${unread?'var(--text-primary)':'#94a3b8'};font-weight:${unread?'600':'400'};white-space:nowrap;overflow:hidden;text-overflow:ellipsis;">${text}</div>
              </div>
            </div>`;
        }).join('')}
      </div>`;

    container.querySelectorAll('[data-thread-id]').forEach(row => {
      row.addEventListener('click', () => navigate('chat', { threadId: row.dataset.threadId }));
    });
  };

  // Initial load
  render({ threads: msgService.getThreadsForUser(user.user_id) });

  // Start polling
  msgService.startPolling(user.user_id, null, (data) => {
    render(data);
  });
}

// ── Direct chat ───────────────────────────────────────────────
async function _renderDirectChat(container, threadId, user) {
  const { updateHeader, navigate, goBack } = await getMobile();

  const thread = db.threads.findById(threadId);
  if (!thread) { navigate('chat'); return; }

  const parts = Array.isArray(thread.participants) ? thread.participants : JSON.parse(thread.participants || '[]');
  const otherId = parts.find(id => id !== user.user_id);
  const other = db.users.findById(otherId);
  const otherName = other?.display_name || other?.fullName || 'User';

  updateHeader({
    title: otherName,
    showBack: true,
    onBack: () => { msgService.stopPolling(); goBack(); },
    rightAction: {
      icon: '👤',
      label: 'Profile',
      onClick: () => navigate('profile', { userId: otherId }),
    }
  });

  // Mark read immediately
  msgService.markThreadRead(threadId, user.user_id);

  const render = (data) => {
    const msgs = data.messages || [];
    let lastDate = '';
    const html = msgs.map(m => {
      const isSent = m.sender_id === user.user_id;
      const msgDate = m.created_at ? new Date(m.created_at).toDateString() : '';
      const separator = msgDate && msgDate !== lastDate
        ? `<div style="text-align:center;padding:8px 0;"><span style="font-size:0.72rem;font-weight:600;color:#94a3b8;background:#f1f5f9;padding:3px 12px;border-radius:20px;">${_dateLabel(m.created_at)}</span></div>`
        : '';
      lastDate = msgDate;
      const avatar = !isSent && (other?.profile_photo || other?.avatar);
      return `
        ${separator}
        <div style="display:flex;align-items:flex-end;gap:8px;padding:2px 16px;justify-content:${isSent?'flex-end':'flex-start'};">
          ${!isSent ? `<div style="width:28px;height:28px;border-radius:50%;background:linear-gradient(135deg,#000000,#1a1a1a);flex-shrink:0;overflow:hidden;display:flex;align-items:center;justify-content:center;font-size:0.65rem;font-weight:700;color:#fff;">
            ${avatar ? `<img src="${getAssetUrl(avatar)}" style="width:100%;height:100%;object-fit:cover;">` : otherName.charAt(0)}
          </div>` : ''}
          <div style="max-width:72%;">
            <div style="padding:10px 14px;border-radius:${isSent?'18px 18px 4px 18px':'18px 18px 18px 4px'};background:${isSent?'var(--mobile-accent)':'#fff'};color:${isSent?'#fff':'var(--text-primary)'};font-size:0.88rem;line-height:1.45;box-shadow:0 1px 4px rgba(0,0,0,0.08);">${_escHtml(m.content)}</div>
            <div style="font-size:0.65rem;color:#94a3b8;margin-top:3px;text-align:${isSent?'right':'left'};">${m.created_at ? _timeHHMM(m.created_at) : ''}</div>
          </div>
        </div>`;
    }).join('');

    const msgsEl = container.querySelector('#chat-msgs');
    if (msgsEl) {
        msgsEl.innerHTML = html + '<div id="chat-bottom-anchor"></div>';
        msgsEl.scrollTop = msgsEl.scrollHeight;
    }
  };

  container.classList.add('mobile-page-flex');
  container.innerHTML = `
      <div id="chat-msgs" class="mobile-page-content chat-messages-area" style="background:#f8fafc;padding-top:12px;">
        <div class="mobile-loader"><div class="mobile-spinner"></div></div>
      </div>

      <!-- Quick Replies -->
      <div class="mobile-scroll-x" style="background:#fff; border-top:1px solid #f1f5f9; padding:8px 12px 4px;">
        <div style="display:flex; gap:8px; width:max-content;">
          ${msgService.QUICK_REPLIES.map(q => `
            <button class="quick-reply-btn" style="background:#f1f5f9; border:none; padding:6px 12px; border-radius:12px; font-size:0.75rem; color:var(--text-primary); cursor:pointer;">${q}</button>
          `).join('')}
        </div>
      </div>

      <!-- Input bar -->
      <div style="flex-shrink:0;padding:10px 12px calc(10px + var(--mobile-safe-bottom));background:#fff;border-top:1px solid #e2e8f0;display:flex;align-items:flex-end;gap:8px;z-index:100;">
        <textarea id="chat-input" placeholder="Message…" rows="1" style="flex:1;resize:none;border:1.5px solid #e2e8f0;border-radius:20px;padding:10px 14px;font-size:0.9rem;font-family:inherit;outline:none;max-height:96px;overflow-y:auto;line-height:1.4;background:#f8fafc;"></textarea>
        <button id="chat-send" style="width:44px;height:44px;border-radius:50%;border:none;background:var(--mobile-accent);color:#fff;font-size:1.1rem;cursor:pointer;flex-shrink:0;display:flex;align-items:center;justify-content:center;opacity:0.4;" disabled>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
        </button>
      </div>
  `;

  const input   = container.querySelector('#chat-input');
  const sendBtn = container.querySelector('#chat-send');

  // Quick reply events
  container.querySelectorAll('.quick-reply-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        input.value = btn.textContent;
        input.dispatchEvent(new Event('input'));
        input.focus();
    });
  });

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 96) + 'px';
    const hasText = input.value.trim().length > 0;
    sendBtn.disabled = !hasText;
    sendBtn.style.opacity = hasText ? '1' : '0.4';
  });

  const doSend = async () => {
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    input.style.height = '';
    sendBtn.disabled = true;
    sendBtn.style.opacity = '0.4';

    const res = msgService.sendMessage(threadId, user.user_id, text);
    if (!res.success) {
        alert(res.error);
        return;
    }
    render({ messages: msgService.getMessagesForThread(threadId) });
  };

  sendBtn.addEventListener('click', doSend);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
  });

  // Start polling
  msgService.startPolling(user.user_id, threadId, (data) => {
    render(data);
    msgService.markThreadRead(threadId, user.user_id);
  });
}

// ── Utils ──────────────────────────────────────────────────────
function _timeShort(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diff = now - d;
  if (diff < 86400000 && d.getDate() === now.getDate()) return d.toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit' });
  if (diff < 604800000) return ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'short' });
}

function _timeHHMM(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12: true });
}

function _dateLabel(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { day:'numeric', month:'long', year:'numeric' });
}

function _escHtml(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
