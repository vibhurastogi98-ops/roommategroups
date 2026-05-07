/**
 * src/mobile/pages/MobileChatDetail.js
 * Mobile chat detail screen.
 */

import { getCurrentUser } from '../../services/auth.js';
import { db, initDB, syncMessagesAndThreads } from '../../services/db.js';
import * as msgService from '../../services/messaging.js';
import { getAssetUrl } from '../../services/assets.js';

async function getMobile() { return await import('../mobile-main.js'); }

export async function init(container, params = {}) {
  const user = getCurrentUser();
  if (!user) { (await getMobile()).navigate('auth'); return; }

  const { updateHeader, navigate, goBack } = await getMobile();

  try {
    await _init(container, params, user, updateHeader, navigate, goBack);
  } catch (err) {
    console.error('[ChatDetail] init failed:', err);
    container.innerHTML = `
      <div class="mobile-empty" style="padding:64px 24px;">
        <div class="mobile-empty-icon">💬</div>
        <div class="mobile-empty-title">Couldn't open chat</div>
        <div class="mobile-empty-text">Something went wrong loading this conversation.</div>
        <button class="mobile-btn mobile-btn-accent" id="cd-back-err" style="width:auto;margin-top:20px;">← Go Back</button>
      </div>`;
    container.querySelector('#cd-back-err')?.addEventListener('click', goBack);
  }
}

async function _init(container, params, user, updateHeader, navigate, goBack) {
  let threadId = params.threadId;

  // If we only have userId, find/create thread
  if (!threadId && params.userId) {
    const thread = await msgService.getOrCreateThread(user.user_id, params.userId, params.listingId || 'direct');
    threadId = thread.thread_id;
  }

  if (!threadId) { navigate('chat'); return; }

  await initDB().catch(() => {});
  const thread = db.threads.findById(threadId);
  if (!thread) { navigate('chat'); return; }

  let parts;
  try {
    parts = Array.isArray(thread.participants)
      ? thread.participants
      : JSON.parse(thread.participants || '[]');
  } catch (_) {
    parts = [];
  }
  const otherId = parts.find(id => id !== user.user_id);
  const other = db.users.findById(otherId);
  const listing = db.listings.findById(thread.listing_id);
  const otherName = other?.display_name || 'User';
  const otherAvatar = other?.profile_photo || other?.avatar;

  updateHeader({
    title: otherName,
    showBack: true,
    onBack: () => { msgService.stopPolling(); goBack(); },
    rightAction: {
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 4.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
      label: 'Options',
      onClick: () => _showOptions()
    }
  });

  container.classList.add('mobile-page-flex');

  async function _render() {
    const msgs = msgService.getMessagesForThread(threadId);
    
    container.innerHTML = `
      <div style="height:100%; display:flex; flex-direction:column; background:#f8fafc;">
        
        <!-- Listing Info Bar -->
        ${listing ? `
          <div style="background:#fff; padding:10px 16px; border-bottom:1px solid #f1f5f9; display:flex; align-items:center; gap:12px;">
            <div style="width:40px; height:40px; border-radius:8px; background:#f1f5f9; flex-shrink:0; overflow:hidden;">
              ${listing.images ? `<img src="${getAssetUrl(JSON.parse(listing.images || '[]')[0])}" style="width:100%; height:100%; object-fit:cover;">` : '🏠'}
            </div>
            <div style="flex:1; min-width:0;">
              <div style="font-size:0.85rem; font-weight:700; color:#1e293b; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${_esc(listing.title)}</div>
              <div style="font-size:0.75rem; color:#64748b;">$${listing.rent || listing.price || '?'}/mo &bull; ${listing.room_type?.replace('_', ' ') || 'Room'}</div>
            </div>
            <button id="view-listing-btn" style="background:#f1f5f9; border:none; border-radius:8px; padding:6px 12px; font-size:0.75rem; font-weight:700; color:#475569;">View</button>
          </div>
        ` : ''}

        <!-- Messages Area -->
        <div id="chat-scroller" style="flex:1; overflow-y:auto; padding:16px 0;">
          <div id="chat-msgs-container">
            ${_renderMessages(msgs)}
          </div>
        </div>

        <!-- Quick Replies -->
        <div style="background:#fff; border-top:1px solid #f1f5f9; padding:8px 0;">
          <div class="mobile-scroll-x" style="padding:0 12px;">
            <div style="display:flex; gap:8px; width:max-content; padding-bottom:4px;">
              ${msgService.QUICK_REPLIES.map(q => `
                <button class="qr-chip" data-text="${_esc(q)}" style="background:#f1f5f9; border:1px solid #e2e8f0; border-radius:12px; padding:6px 12px; font-size:0.75rem; color:#475569; font-weight:600; white-space:nowrap; cursor:pointer;">${_esc(q)}</button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Input Bar -->
        <div style="background:#fff; border-top:1px solid #f1f5f9; padding:10px 12px calc(10px + var(--mobile-safe-bottom)); display:flex; align-items:flex-end; gap:10px;">
          <textarea id="chat-input" placeholder="Message..." rows="1" 
            style="flex:1; background:#f1f5f9; border:1.5px solid #e2e8f0; border-radius:20px; padding:10px 16px; font-size:0.92rem; font-family:inherit; outline:none; resize:none; max-height:120px;"></textarea>
          <button id="chat-send" style="width:44px; height:44px; border-radius:50%; border:none; background:#1a1a1a; color:#fff; display:flex; align-items:center; justify-content:center; opacity:0.4;" disabled>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>

      <!-- Options Sheet (hidden by default) -->
      <div id="options-sheet" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.4); z-index:2000; align-items:flex-end; justify-content:center;">
        <div style="background:#fff; width:100%; border-radius:24px 24px 0 0; padding:24px; animation:slideUp 0.3s ease;">
          <div style="width:40px; height:4px; background:#e2e8f0; border-radius:2px; margin:0 auto 24px;"></div>
          <button class="opt-btn" data-action="profile" style="width:100%; text-align:left; padding:16px; border:none; background:none; font-size:1rem; font-weight:700; color:#1e293b; display:flex; align-items:center; gap:12px;">
            <span style="font-size:1.2rem;">👤</span> View Profile
          </button>
          <button class="opt-btn" data-action="archive" style="width:100%; text-align:left; padding:16px; border:none; background:none; font-size:1rem; font-weight:700; color:#1e293b; display:flex; align-items:center; gap:12px;">
            <span style="font-size:1.2rem;">📦</span> ${thread.is_archived ? 'Unarchive' : 'Archive'} Chat
          </button>
          <button class="opt-btn" data-action="block" style="width:100%; text-align:left; padding:16px; border:none; background:none; font-size:1rem; font-weight:700; color:#ef4444; display:flex; align-items:center; gap:12px;">
            <span style="font-size:1.2rem;">🚫</span> Block User
          </button>
          <button id="close-options" style="width:100%; margin-top:12px; padding:16px; border-radius:16px; border:none; background:#f1f5f9; font-size:0.95rem; font-weight:800; color:#1e293b;">Cancel</button>
        </div>
      </div>
      <style>
        @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
      </style>
    `;

    _wireEvents();
    _scrollToBottom(false);
    await msgService.markThreadRead(threadId, user.user_id).catch(err => {
      console.warn('[Chat] markThreadRead failed (non-fatal):', err);
    });
  }

  function _renderMessages(msgs) {
    let lastDate = '';
    return msgs.map(m => {
      const isMe = m.sender_id === user.user_id;
      const msgDate = new Date(m.created_at).toDateString();
      const dateHeader = msgDate !== lastDate 
        ? `<div style="text-align:center; margin:16px 0 8px;"><span style="font-size:0.72rem; font-weight:800; color:#94a3b8; background:#fff; padding:4px 12px; border-radius:20px; border:1px solid #f1f5f9;">${_dateLabel(m.created_at)}</span></div>`
        : '';
      lastDate = msgDate;
      const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      return `
        ${dateHeader}
        <div style="display:flex; padding:4px 16px; justify-content:${isMe ? 'flex-end' : 'flex-start'};">
          ${!isMe ? `
            <div style="width:32px; height:32px; border-radius:10px; background:#f1f5f9; flex-shrink:0; margin-right:8px; margin-top:2px; overflow:hidden; display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:800; color:#64748b; border:1px solid #f1f5f9;">
              ${otherAvatar ? `<img src="${getAssetUrl(otherAvatar)}" style="width:100%; height:100%; object-fit:cover;">` : otherName.charAt(0)}
            </div>
          ` : ''}
          <div style="max-width:75%;">
            <div style="background:${isMe ? '#1a1a1a' : '#fff'}; color:${isMe ? '#fff' : '#1e293b'}; padding:10px 14px; border-radius:${isMe ? '18px 18px 4px 18px' : '18px 18px 18px 4px'}; box-shadow:0 1px 2px rgba(0,0,0,0.05); font-size:0.9rem; line-height:1.45; word-break:break-word;">
              ${_escHtml(m.content)}
            </div>
            <div style="font-size:0.65rem; color:#94a3b8; font-weight:700; margin-top:4px; text-align:${isMe ? 'right' : 'left'};">
              ${time} ${isMe ? (m.is_read ? ' &bull; Read' : ' &bull; Sent') : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function _wireEvents() {
    const input = container.querySelector('#chat-input');
    const sendBtn = container.querySelector('#chat-send');

    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
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
      if (res.success) {
        _partialUpdate();
      } else {
        alert(res.error);
      }
    };

    sendBtn.addEventListener('click', doSend);
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
    });

    container.querySelectorAll('.qr-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        input.value = btn.dataset.text;
        input.dispatchEvent(new Event('input'));
        input.focus();
      });
    });

    container.querySelector('#view-listing-btn')?.addEventListener('click', () => {
      navigate('listing', { id: thread.listing_id });
    });

    // Options sheet
    container.querySelector('#close-options')?.addEventListener('click', () => {
      container.querySelector('#options-sheet').style.display = 'none';
    });

    container.querySelectorAll('.opt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        container.querySelector('#options-sheet').style.display = 'none';
        if (action === 'profile') navigate('profile', { userId: otherId });
        if (action === 'archive') {
          if (thread.is_archived) msgService.unarchiveThread(threadId);
          else msgService.archiveThread(threadId, user.user_id);
          goBack();
        }
        if (action === 'block') {
          if (confirm(`Block ${otherName}?`)) {
            msgService.blockUser(user.user_id, otherId, threadId);
            goBack();
          }
        }
      });
    });
  }

  function _showOptions() {
    container.querySelector('#options-sheet').style.display = 'flex';
  }

  function _scrollToBottom(smooth = true) {
    const scroller = container.querySelector('#chat-scroller');
    if (scroller) {
      scroller.scrollTo({ top: scroller.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    }
  }

  async function _partialUpdate() {
    const msgs = msgService.getMessagesForThread(threadId);
    const area = container.querySelector('#chat-msgs-container');
    if (area) {
      area.innerHTML = _renderMessages(msgs);
      _scrollToBottom();
      await msgService.markThreadRead(threadId, user.user_id).catch(err => {
        console.warn('[Chat] markThreadRead failed (non-fatal):', err);
      });
    }
  }

  function _dateLabel(iso) {
    const d = new Date(iso);
    const now = new Date();
    const diff = Math.floor((now - d) / 86400000);
    if (diff === 0) return 'TODAY';
    if (diff === 1) return 'YESTERDAY';
    if (diff < 7) return d.toLocaleDateString([], { weekday: 'long' }).toUpperCase();
    return d.toLocaleDateString([], { day: 'numeric', month: 'SHORT', year: 'numeric' }).toUpperCase();
  }

  function _esc(s) {
    return String(s || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c]));
  }

  function _escHtml(s) {
    return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  await _render();

  // Polling for new messages
  const poll = setInterval(async () => {
    if (!container.isConnected) { clearInterval(poll); return; }
    const changed = await syncMessagesAndThreads().catch(() => false);
    if (changed) {
      const msgs = msgService.getMessagesForThread(threadId);
      const currentCount = container.querySelectorAll('.msg-bubble-row')?.length || 0;
      if (msgs.length !== currentCount) {
        _partialUpdate();
      }
    }
  }, 3000);
}

export const MobileChatDetail = init;
export default init;
