/**
 * src/mobile/pages/MobileChatDetail.js
 * Mobile chat detail screen.
 */

import { getCurrentUser } from '../../../web/src/services/auth.js';
import { db, initDB, syncMessagesAndThreads } from '../../../web/src/services/db.js';
import * as msgService from '../../../web/src/services/messaging.js';
import { getAssetUrl, getAvatarUrl } from '../../../web/src/services/assets.js';
import { uploadImage } from '../../../web/src/services/upload.js';
import { api } from '../../../web/src/services/api.js';
import { showBottomSheet } from '../components/BottomSheet.js';

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
  const listingKind = listing?.kind || (listing?.price && !listing?.rent ? 'sale' : 'rental');
  const listingIsSale = listingKind === 'sale';
  const listingPrice = listing
    ? `$${Number(listingIsSale ? (listing.price ?? listing.rent ?? 0) : (listing.rent ?? listing.price ?? 0)).toLocaleString('en-US')}${listingIsSale ? '' : '/mo'}`
    : '';
  const listingTypeLabel = listingIsSale
    ? (listing.condition ? String(listing.condition).replace(/_/g, ' ') : 'Marketplace item')
    : (listing.room_type?.replace(/_/g, ' ') || 'Room');
  const listingThumb = (() => {
    if (!listing?.images) return listingIsSale ? '🏷️' : '🏠';
    try {
      const imgs = Array.isArray(listing.images) ? listing.images : JSON.parse(listing.images || '[]');
      return imgs?.[0]
        ? `<img src="${getAssetUrl(imgs[0])}" style="width:100%; height:100%; object-fit:cover;">`
        : (listingIsSale ? '🏷️' : '🏠');
    } catch (_) {
      return listingIsSale ? '🏷️' : '🏠';
    }
  })();

  function _maybeShowMarketplaceChatSafety() {
    if (!listing || (listing.kind || 'rental') === 'rental') return;
    const key = `rg_marketplace_chat_safety_seen_${user.user_id}`;
    if (localStorage.getItem(key) === '1') return;
    localStorage.setItem(key, '1');
    setTimeout(() => {
      showBottomSheet({
        title: 'Safety tips before you chat',
        content: `
          <div style="padding:4px 0 2px;">
            <div style="width:54px;height:54px;border-radius:16px;background:#111827;color:#fff;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;">
              <i class="fa-solid fa-shield-halved" style="font-size:1.3rem;"></i>
            </div>
            <p style="font-size:0.88rem;color:#64748b;line-height:1.55;text-align:center;margin:0 0 16px;">
              Keep contact inside RoommateGroups chat while you coordinate the handoff.
            </p>
            <div style="display:grid;gap:10px;">
              ${[
                'Do not share phone numbers or personal payment details.',
                'Meet in a public, well-lit location.',
                'Inspect the item before paying.',
              ].map(tip => `
                <div style="display:flex;gap:9px;align-items:flex-start;background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:10px 12px;">
                  <i class="fa-solid fa-check-circle" style="color:#16a34a;margin-top:2px;"></i>
                  <span style="font-size:0.82rem;color:#334155;font-weight:750;line-height:1.45;">${tip}</span>
                </div>
              `).join('')}
            </div>
          </div>
        `,
        actions: [
          { label: 'I understand', variant: 'accent' },
          { label: 'Safe meetup guide', variant: 'outline', onClick: () => navigate('safety', { section: 'safe-meetup' }) },
        ],
      });
    }, 250);
  }

  updateHeader({
    title: otherName,
    showBack: true,
    onBack: () => { msgService.stopPolling(); goBack(); },
    rightAction: {
      icon: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>`,
      label: 'Options',
      onClick: (e) => _toggleDropdown(e)
    }
  });

  container.classList.add('mobile-page-flex');

  async function _render() {
    const msgs = msgService.getMessagesForThread(threadId);
    container.innerHTML = `
      <div style="width: 100% !important; height: 100% !important; display: flex !important; flex-direction: column !important; background: #f8fafc; justify-content: flex-start !important; align-items: stretch !important; margin: 0 !important; padding: 0 !important;">
        
        <!-- Listing Info Bar -->
        ${listing ? `
          <div style="background: #fff; padding: 10px 16px; border-bottom: 1px solid #f1f5f9; display: flex; align-items: center; gap: 12px; flex-shrink: 0;">
            <div style="width: 40px; height: 40px; border-radius: 8px; background: #f1f5f9; flex-shrink: 0; overflow: hidden;">
              ${listingThumb}
            </div>
            <div style="flex: 1; min-width: 0;">
              <div style="font-size: 0.85rem; font-weight: 700; color: #1e293b; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${_esc(listing.title)}</div>
              <div style="font-size: 0.75rem; color: #64748b;">${listingPrice} &bull; ${_esc(listingTypeLabel)}</div>
            </div>
            <button id="view-listing-btn" style="background: #f1f5f9; border: none; border-radius: 8px; padding: 6px 12px; font-size: 0.75rem; font-weight: 700; color: #475569; cursor: pointer;">View</button>
          </div>
        ` : ''}

        <!-- Messages Area -->
        <div id="chat-scroller" style="flex: 1 1 auto; width: 100% !important; height: 100%; overflow-y: auto; -webkit-overflow-scrolling: touch; padding: 0; display: flex !important; flex-direction: column !important; align-items: stretch !important;">
          <div id="chat-msgs-container" class="chat-messages" style="width: 100% !important; flex: 0 0 auto !important;">
            ${_renderMessages(msgs)}
          </div>
        </div>

        <!-- Quick Replies -->
        <div style="background: #fff; border-top: 1px solid #f1f5f9; padding: 8px 0; flex-shrink: 0;">
          <div class="mobile-scroll-x" style="padding: 0 12px; overflow-x: auto; -webkit-overflow-scrolling: touch;">
            <div style="display: flex; gap: 8px; width: max-content;">
              ${msgService.QUICK_REPLIES.map(q => `
                <button class="qr-chip" data-text="${_esc(q)}" style="background: #f1f5f9; border: 1px solid #e2e8f0; border-radius: 12px; padding: 6px 12px; font-size: 0.75rem; color: #475569; font-weight: 600; white-space: nowrap; cursor: pointer;">${_esc(q)}</button>
              `).join('')}
            </div>
          </div>
        </div>

        <!-- Input Bar -->
        <div style="background: #fff; border-top: 1px solid #f1f5f9; padding: 10px 12px; display: flex; align-items: flex-end; gap: 10px; flex-shrink: 0;">
          <input type="file" id="chat-photo-input" accept="image/*" style="display: none;" />
          <button id="chat-photo-btn" style="width: 44px; height: 44px; border-radius: 50%; border: 1.5px solid #e2e8f0; background: #f8fafc; color: #64748b; display: flex; align-items: center; justify-content: center; flex-shrink: 0; cursor: pointer;">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><polyline points="21 15 16 10 5 21"></polyline></svg>
          </button>
          <textarea id="chat-input" placeholder="Message..." rows="1" 
            style="flex: 1; background: #f1f5f9; border: 1.5px solid #e2e8f0; border-radius: 20px; padding: 10px 16px; font-size: 0.92rem; font-family: inherit; outline: none; resize: none; max-height: 120px; margin: 0;"></textarea>
          <button id="chat-send" style="width: 44px; height: 44px; border-radius: 50%; border: none; background: #1a1a1a; color: #fff; display: flex; align-items: center; justify-content: center; opacity: 0.4; flex-shrink: 0; cursor: pointer;" disabled>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"></line><polygon points="22 2 15 22 11 13 2 9 22 2"></polygon></svg>
          </button>
        </div>
      </div>

      <!-- Dropdown Overlay & Menu -->
      <div id="chat-dropdown-overlay" class="chat-dropdown-overlay hidden"></div>
      <div id="chat-dropdown" class="chat-dropdown hidden">
        <button class="chat-dropdown-item" data-action="profile">
          <span class="icon">👤</span> View Profile
        </button>
        <button class="chat-dropdown-item" data-action="archive">
          <span class="icon">📁</span> ${thread.is_archived ? 'Unarchive Chat' : 'Archive Chat'}
        </button>
        <button class="chat-dropdown-item" data-action="block" style="color: #ef4444;">
          <span class="icon">🚫</span> Block User
        </button>
        <button class="chat-dropdown-item" data-action="delete" style="color: #ef4444;">
          <span class="icon">🗑️</span> Delete Chat
        </button>
      </div>

      <style>
        .chat-dropdown-overlay {
          position: fixed;
          inset: 0;
          z-index: 2900;
          background: transparent;
          display: block;
        }
        .chat-dropdown-overlay.hidden { display: none; }
        
        .chat-dropdown {
          position: fixed;
          top: calc(var(--mobile-header-height) + var(--mobile-safe-top) + 4px);
          right: 12px;
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
          border: 1px solid #f1f5f9;
          z-index: 3000;
          min-width: 180px;
          overflow: hidden;
          animation: dropdownIn 0.15s ease-out;
        }
        .chat-dropdown.hidden { display: none; }
        .chat-dropdown-item {
          width: 100%;
          text-align: left;
          padding: 12px 16px;
          border: none;
          background: none;
          font-size: 0.95rem;
          font-weight: 600;
          color: #1e293b;
          display: flex;
          align-items: center;
          gap: 12px;
          cursor: pointer;
          -webkit-tap-highlight-color: transparent;
        }
        .chat-dropdown-item:active { background: #f8fafc; }
        .chat-dropdown-item .icon { font-size: 1.1rem; width: 20px; text-align: center; }
        @keyframes dropdownIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
      </style>
    `;


    _wireEvents();
    _wireOfferActions();
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
      const payload = _parseStructuredMessage(m.content);
      const structuredHtml = payload?.kind === 'offer'
        ? _renderOfferChip(payload, m)
        : payload?.kind === 'system'
          ? _renderSystemChip(payload)
          : '';
      
      return `
        ${dateHeader}
        <div class="chat-bubble-row ${isMe ? 'sent' : 'received'}">
          ${!isMe ? `
            <div style="width:32px; height:32px; border-radius:10px; background:#f1f5f9; flex-shrink:0; overflow:hidden; display:flex; align-items:center; justify-content:center; font-size:0.8rem; font-weight:800; color:#64748b; border:1px solid #f1f5f9; margin-bottom:20px;">
              <img src="${getAvatarUrl(otherAvatar, otherName)}" style="width:100%; height:100%; object-fit:cover;">
            </div>
          ` : ''}
          <div class="chat-bubble">
            ${m.photo_url ? `
              <div style="margin-bottom:4px; border-radius:${isMe ? '18px 4px 18px 18px' : '4px 18px 18px 18px'}; overflow:hidden; border:1px solid #e2e8f0;">
                <img src="${getAssetUrl(m.photo_url)}" style="width:100%; max-height:200px; object-fit:cover; display:block;">
              </div>
            ` : ''}
            ${m.content ? `
            ${structuredHtml || `<div style="background:${isMe ? '#1a1a1a' : '#fff'}; color:${isMe ? '#fff' : '#1e293b'}; padding:10px 14px; border-radius:${isMe ? '18px 4px 18px 18px' : '4px 18px 18px 18px'}; box-shadow:0 1px 2px rgba(0,0,0,0.05); font-size:0.9rem; line-height:1.45; word-break:break-word;">
              ${_escHtml(m.content)}
            </div>`}
            ` : ''}
            <div class="chat-time" style="font-size:0.65rem; color:#94a3b8; font-weight:700; margin-top:4px;">
              ${time} ${isMe ? (m.is_read ? ' &bull; Read' : ' &bull; Sent') : ''}
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function _parseStructuredMessage(content) {
    if (!content || typeof content !== 'string') return null;
    const trimmed = content.trim();
    if (!trimmed.startsWith('{')) return null;
    try {
      const parsed = JSON.parse(trimmed);
      return parsed && typeof parsed === 'object' ? parsed : null;
    } catch (_) {
      return null;
    }
  }

  function _renderOfferChip(payload, message) {
    const status = String(payload.status || 'pending').toLowerCase();
    const canRespond = listing?.user_id === user.user_id && status === 'pending';
    const statusStyle = status === 'accepted'
      ? 'background:#dcfce7;color:#047857;'
      : status === 'declined'
        ? 'background:#fee2e2;color:#b91c1c;'
        : 'background:#fff7ed;color:#9a3412;';
    return `
      <div class="chat-offer-chip" data-mid="${_esc(message.message_id || '')}" data-offer-id="${_esc(payload.offer_id || '')}"
        style="background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:12px;box-shadow:0 3px 10px rgba(0,0,0,0.05);min-width:220px;max-width:280px;">
        <div style="display:flex;justify-content:space-between;gap:8px;align-items:center;margin-bottom:7px;">
          <strong style="font-size:0.84rem;color:#0f172a;"><i class="fa-solid fa-hand-holding-dollar"></i> Offer</strong>
          <span style="${statusStyle}border-radius:999px;padding:3px 8px;font-size:0.66rem;font-weight:900;text-transform:capitalize;">${_esc(status)}</span>
        </div>
        <div style="font-size:1.2rem;font-weight:900;color:#0f172a;">$${Number(payload.amount || 0).toLocaleString()}</div>
        <div style="font-size:0.76rem;color:#64748b;line-height:1.4;margin-top:3px;">${_esc(payload.listing_title || listing?.title || 'Marketplace listing')}</div>
        ${canRespond ? `
          <div style="display:flex;gap:8px;margin-top:10px;">
            <button class="chat-offer-action" data-status="accepted" style="flex:1;border:none;background:#0f172a;color:#fff;border-radius:10px;padding:8px;font-size:0.74rem;font-weight:900;">Accept</button>
            <button class="chat-offer-action" data-status="declined" style="flex:1;border:1px solid #fecaca;background:#fff;color:#b91c1c;border-radius:10px;padding:8px;font-size:0.74rem;font-weight:900;">Decline</button>
          </div>
        ` : ''}
      </div>
    `;
  }

  function _renderSystemChip(payload) {
    if (payload.event !== 'offer_status') return '';
    return `
      <div style="background:#f1f5f9;color:#475569;padding:9px 12px;border-radius:14px;font-size:0.82rem;font-weight:800;">
        Offer ${_esc(payload.status || 'updated')}
      </div>
    `;
  }

  function _wireEvents() {
    const input = container.querySelector('#chat-input');
    const sendBtn = container.querySelector('#chat-send');
    const photoBtn = container.querySelector('#chat-photo-btn');
    const photoInput = container.querySelector('#chat-photo-input');

    input.addEventListener('input', () => {
      input.style.height = 'auto';
      input.style.height = Math.min(input.scrollHeight, 120) + 'px';
      const hasText = input.value.trim().length > 0;
      sendBtn.disabled = !hasText;
      sendBtn.style.opacity = hasText ? '1' : '0.4';
    });

    const doSend = async (textOverride = null, photoUrl = null) => {
      const text = textOverride !== null ? textOverride : input.value.trim();
      if (!text && !photoUrl) return;
      if (textOverride === null) {
        input.value = '';
        input.style.height = '';
        sendBtn.disabled = true;
        sendBtn.style.opacity = '0.4';
      }

      const res = await msgService.sendMessage(threadId, user.user_id, text, photoUrl);
      if (res.success) {
        _partialUpdate();
      } else {
        alert(res.error || 'Failed to send message');
      }
    };

    photoBtn.addEventListener('click', () => {
      photoInput.click();
    });

    photoInput.addEventListener('change', async (e) => {
      if (!e.target.files || !e.target.files.length) return;
      const file = e.target.files[0];
      
      const originalIcon = photoBtn.innerHTML;
      photoBtn.innerHTML = '<div class="spinner" style="width:16px;height:16px;border:2px solid #ccc;border-top-color:#1a1a1a;border-radius:50%;animation:spin 1s linear infinite;"></div>';
      photoBtn.disabled = true;
      
      try {
        const url = await uploadImage(file);
        await doSend('', url);
      } catch (err) {
        alert(err.message || 'Failed to upload image');
      } finally {
        photoBtn.innerHTML = originalIcon;
        photoBtn.disabled = false;
        photoInput.value = '';
      }
    });

    sendBtn.addEventListener('click', () => doSend());
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); }
    });

    container.querySelectorAll('.qr-chip').forEach(btn => {
      btn.addEventListener('click', () => {
        doSend(btn.dataset.text);
      });
    });

    container.querySelector('#view-listing-btn')?.addEventListener('click', () => {
      navigate('listing', { id: thread.listing_id });
    });

    // Dropdown events
    const dropdown = container.querySelector('#chat-dropdown');
    const overlay = container.querySelector('#chat-dropdown-overlay');
    const closeDropdown = () => {
      dropdown?.classList.add('hidden');
      overlay?.classList.add('hidden');
    };

    overlay?.addEventListener('click', closeDropdown);

    container.querySelectorAll('.chat-dropdown-item').forEach(btn => {
      btn.addEventListener('click', async () => {
        const action = btn.dataset.action;
        closeDropdown();
        
        const { api } = await import('../../../web/src/services/api.js');

        if (action === 'profile') {
          navigate('profile', { userId: otherId });
        } else if (action === 'archive') {
          try {
            if (thread.is_archived) {
              await db.threads.update(threadId, { is_archived: false, archived_by: null });
              msgService.unarchiveThread(threadId);
            } else {
              msgService.archiveThread(threadId, user.user_id); // Sync local state
              api.archiveThread(threadId).catch(err => console.warn('[Chat] archive sync failed:', err));
              goBack();
            }
          } catch (err) {
            alert(thread.is_archived ? 'Failed to unarchive chat' : 'Failed to archive chat');
          }
        } else if (action === 'block') {
          showBottomSheet({
            title: 'Block User',
            content: `
              <div style="padding: 10px 0; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 16px;">🚫</div>
                <div style="font-size: 1.1rem; font-weight: 800; color: #1e293b; margin-bottom: 8px;">Block ${otherName}?</div>
                <div style="font-size: 0.9rem; color: #64748b; line-height: 1.5;">You will no longer receive messages from this user.</div>
              </div>
            `,
            actions: [
              { 
                label: 'Block User', 
                variant: 'danger', 
                onClick: async () => {
                  try {
                    msgService.blockUser(user.user_id, otherId, threadId); // Sync local state
                    api.blockUser(otherId).catch(err => console.warn('[Chat] block sync failed:', err));
                    goBack();
                  } catch (err) {
                    alert('Failed to block user');
                  }
                }
              },
              { label: 'Cancel', variant: 'outline', onClick: () => {} }
            ]
          });
        } else if (action === 'delete') {
          showBottomSheet({
            title: 'Delete Chat',
            content: `
              <div style="padding: 10px 0; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 16px;">🗑️</div>
                <div style="font-size: 1.1rem; font-weight: 800; color: #1e293b; margin-bottom: 8px;">Delete conversation?</div>
                <div style="font-size: 0.9rem; color: #64748b; line-height: 1.5;">This will permanently remove this chat from your history. This action cannot be undone.</div>
              </div>
            `,
            actions: [
              { 
                label: 'Delete Chat', 
                variant: 'danger', 
                onClick: async () => {
                  try {
                    await db.threads.delete(threadId);
                    api.deleteThread(threadId).catch(err => console.warn('[Chat] delete sync failed:', err));
                    goBack();
                  } catch (err) {
                    alert('Failed to delete chat');
                  }
                }
              },
              { label: 'Cancel', variant: 'outline', onClick: () => {} }
            ]
          });
        }
      });
    });
  }

  function _wireOfferActions() {
    container.querySelectorAll('.chat-offer-action:not([data-bound="true"])').forEach(btn => {
      btn.dataset.bound = 'true';
      btn.addEventListener('click', async () => {
        const chip = btn.closest('.chat-offer-chip');
        const offerId = chip?.dataset.offerId;
        const messageId = chip?.dataset.mid;
        const status = btn.dataset.status;
        if (!offerId || !status) return;

        btn.disabled = true;
        try {
          await api.respondOffer(offerId, status);
          const msg = messageId ? db.messages.findById(messageId) : null;
          const payload = _parseStructuredMessage(msg?.content);
          if (msg && payload?.kind === 'offer') {
            payload.status = status;
            await db.messages.update(messageId, { content: JSON.stringify(payload) }).catch(() => {});
          }
          await _partialUpdate();
        } catch (err) {
          alert(err.message || 'Could not update offer');
          btn.disabled = false;
        }
      });
    });
  }

  function _toggleDropdown(e) {
    if (e) e.stopPropagation();
    const dropdown = container.querySelector('#chat-dropdown');
    const overlay = container.querySelector('#chat-dropdown-overlay');
    if (dropdown && overlay) {
      const isHidden = dropdown.classList.contains('hidden');
      if (isHidden) {
        dropdown.classList.remove('hidden');
        overlay.classList.remove('hidden');
      } else {
        dropdown.classList.add('hidden');
        overlay.classList.add('hidden');
      }
    }
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
      _wireOfferActions();
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
  _maybeShowMarketplaceChatSafety();

  // Polling for new messages
  const poll = setInterval(async () => {
    if (!container.isConnected) { clearInterval(poll); return; }
    const changed = await syncMessagesAndThreads().catch(() => false);
    if (changed) {
      const msgs = msgService.getMessagesForThread(threadId);
      const currentCount = container.querySelectorAll('.chat-bubble-row')?.length || 0;
      if (msgs.length !== currentCount) {
        _partialUpdate();
      }
    }
  }, 3000);
}

export const MobileChatDetail = init;
export default init;
