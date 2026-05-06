/**
 * src/mobile/pages/MobileDashboard.js
 * Fully functional dashboard — clickable stat cards, activity feed,
 * quick actions, and a self-cleaning background sync timer.
 */

import { getCurrentUser } from '../../services/auth.js';
import { db, initDB, syncMessagesAndThreads } from '../../services/db.js';
import { getTotalUnread, getUnreadCountForThread } from '../../services/messaging.js';

async function getMobile() { return await import('../mobile-main.js'); }

export async function init(container) {
  const user = getCurrentUser();
  if (!user) { (await getMobile()).navigate('auth'); return; }

  const { updateHeader, navigate } = await getMobile();

  updateHeader({
    title: 'Dashboard',
    showBack: false,
    rightAction: {
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 4.6a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
      label: 'Settings',
      onClick: async () => (await getMobile()).navigate('settings'),
    },
  });

  await initDB().catch(() => {});

  // ── Timer — self-cleaning: stops when container leaves the DOM ──
  let timer = null;
  function startTimer() {
    if (timer) clearInterval(timer);
    timer = setInterval(async () => {
      if (!container.isConnected) { clearInterval(timer); return; }
      const changed = await syncMessagesAndThreads().catch(() => false);
      if (changed && container.isConnected) _render();
    }, 15000);
  }

  function _render() {
    const dbUser = db.users.findById(user.user_id || user.id);
    if (!dbUser) {
      container.innerHTML = `<div style="padding:40px;text-align:center;color:#94a3b8;font-size:0.9rem;">Could not load your profile. Pull to refresh or restart the app.</div>`;
      return;
    }

    const userListings = db.listings.find(l => l.user_id === dbUser.user_id);
    const activeListings  = userListings.filter(l => l.status === 'active' || l.is_active !== false).length;
    const totalViews      = userListings.reduce((s, l) => s + (l.view_count || l.views_count || 0), 0);
    const savedCount      = (dbUser.saved_listings || []).length;
    const unread          = getTotalUnread(dbUser.user_id);

    const threads = db.threads.find(t => {
      const parts = Array.isArray(t.participants) ? t.participants : JSON.parse(t.participants || '[]');
      return parts.includes(dbUser.user_id);
    });

    // ── Activity items ──
    const activityItems = [];

    [...threads]
      .filter(t => !t.is_archived)
      .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))
      .slice(0, 3)
      .forEach(t => {
        const parts = Array.isArray(t.participants) ? t.participants : JSON.parse(t.participants || '[]');
        const senderId = parts.find(id => id !== dbUser.user_id);
        const sender   = senderId ? db.users.findById(senderId) : null;
        const listing  = db.listings.findById(t.listing_id);
        const threadUnread = getUnreadCountForThread(t.thread_id, dbUser.user_id);
        activityItems.push({
          icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>`,
          bold: threadUnread > 0,
          text: `<strong>${_esc(sender?.display_name || 'Someone')}</strong> ${threadUnread > 0 ? 'sent a new message' : 'messaged you'} about <em>${_esc(listing?.title || 'a listing')}</em>`,
          time: _relTime(t.last_message_at),
          route: 'chat', params: { threadId: t.thread_id },
        });
      });

    userListings.filter(l => (l.views_count || 0) >= 50).slice(0, 2).forEach(l => {
      activityItems.push({
        icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
        bold: false,
        text: `Your listing <em>${_esc(l.title)}</em> reached <strong>${l.views_count} views</strong>`,
        time: _relTime(l.created_at),
        route: 'my-listings', params: {},
      });
    });

    const firstName = (dbUser.display_name || 'there').split(' ')[0];
    const greeting = unread > 0
      ? `You have <strong>${unread} unread message${unread !== 1 ? 's' : ''}</strong> waiting.`
      : activeListings > 0
        ? `Your ${activeListings} listing${activeListings !== 1 ? 's are' : ' is'} live.`
        : 'Post your first listing to start connecting.';

    container.innerHTML = `
      <div style="padding:20px;background:#f8fafc;min-height:100%;padding-bottom:40px;">

        <!-- Welcome Banner -->
        <div style="background:linear-gradient(135deg,#1a1a1a 0%,#333 100%);border-radius:24px;padding:24px;color:#fff;margin-bottom:24px;box-shadow:0 10px 25px rgba(0,0,0,0.15);position:relative;overflow:hidden;">
          <div style="position:relative;z-index:2;">
            <h2 style="font-size:1.4rem;font-weight:800;margin-bottom:8px;">Hi, ${_esc(firstName)}!</h2>
            <p style="font-size:0.9rem;opacity:0.8;margin-bottom:20px;line-height:1.4;max-width:220px;">${greeting}</p>
            <button id="dash-browse-btn" style="background:#fff;color:#1a1a1a;border:none;border-radius:20px;padding:10px 24px;font-size:0.85rem;font-weight:800;cursor:pointer;touch-action:manipulation;">
              Browse Rooms
            </button>
          </div>
          <div style="position:absolute;right:-20px;bottom:-20px;opacity:0.05;transform:rotate(-15deg);">
            <svg width="140" height="140" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
          </div>
        </div>

        <!-- Stat Cards (all tappable) -->
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:24px;">
          ${_stat('🏠', activeListings,  'Active Listings', 'my-listings')}
          ${_stat('👁️', totalViews,      'Total Views',     'my-listings')}
          ${_stat('💬', unread,          'Messages',        'chat')}
          ${_stat('❤️', savedCount,      'Saved',           'saved')}
        </div>

        <!-- Quick Actions -->
        <div style="background:#fff;border-radius:24px;padding:20px;border:1px solid #f1f5f9;margin-bottom:24px;box-shadow:0 4px 15px rgba(0,0,0,0.03);">
          <h3 style="font-size:1rem;font-weight:800;color:#1e293b;margin-bottom:16px;">Quick Actions</h3>
          <div style="display:flex;flex-direction:column;gap:4px;">
            ${_action('➕', 'Post New Listing',  'post')}
            ${_action('💬', 'Messages',           'chat',          unread)}
            ${_action('📋', 'My Listings',        'my-listings')}
            ${_action('🔔', 'Notifications',      'notifications')}
            ${_action('⚙️', 'Account Settings',  'settings')}
            ${_action('💳', 'Upgrade Plan',       'pricing')}
            ${_action('🛡️', 'Verify Account',    'verification')}
          </div>
        </div>

        <!-- Recent Activity -->
        <div style="background:#fff;border-radius:24px;padding:20px;border:1px solid #f1f5f9;box-shadow:0 4px 15px rgba(0,0,0,0.03);">
          <h3 style="font-size:1rem;font-weight:800;color:#1e293b;margin-bottom:16px;">Recent Activity</h3>
          ${activityItems.length === 0
            ? `<div style="text-align:center;padding:24px;color:#94a3b8;font-size:0.85rem;">No recent activity yet.</div>`
            : `<div style="display:flex;flex-direction:column;gap:16px;">
                ${activityItems.map(a => `
                  <div class="dash-activity" data-route="${a.route}" data-params='${JSON.stringify(a.params)}'
                    style="display:flex;gap:12px;align-items:flex-start;cursor:pointer;touch-action:manipulation;">
                    <div style="width:36px;height:36px;border-radius:12px;background:#f1f5f9;color:#1a1a1a;display:flex;align-items:center;justify-content:center;flex-shrink:0;">${a.icon}</div>
                    <div style="flex:1;min-width:0;">
                      <div style="font-size:0.85rem;color:#475569;line-height:1.4;">${a.text}</div>
                      <div style="font-size:0.72rem;color:#94a3b8;margin-top:4px;font-weight:600;">${a.time}</div>
                    </div>
                    ${a.bold ? '<div style="width:8px;height:8px;border-radius:50%;background:#ef4444;flex-shrink:0;margin-top:4px;"></div>' : ''}
                  </div>
                `).join('')}
              </div>`
          }
        </div>
      </div>
    `;

    _wireEvents();
  }

  async function _wireEvents() {
    const { navigate } = await getMobile();

    container.querySelector('#dash-browse-btn')?.addEventListener('click', () => navigate('search'));

    // Stat cards
    container.querySelectorAll('[data-stat-route]').forEach(el => {
      el.addEventListener('click', () => navigate(el.dataset.statRoute));
    });

    // Quick action rows
    container.querySelectorAll('[data-action-route]').forEach(el => {
      el.addEventListener('click', () => navigate(el.dataset.actionRoute));
    });

    // Activity items
    container.querySelectorAll('.dash-activity').forEach(el => {
      el.addEventListener('click', () => {
        navigate(el.dataset.route, JSON.parse(el.dataset.params || '{}'));
      });
    });
  }

  // ── Builders ─────────────────────────────────────────────────
  function _stat(icon, val, label, route) {
    return `
      <div data-stat-route="${route}" style="background:#fff;padding:16px;border-radius:20px;border:1px solid #f1f5f9;box-shadow:0 4px 15px rgba(0,0,0,0.03);cursor:pointer;touch-action:manipulation;">
        <div style="font-size:1.3rem;margin-bottom:8px;">${icon}</div>
        <div style="font-size:1.4rem;font-weight:900;color:#1e293b;">${val}</div>
        <div style="font-size:0.7rem;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:0.02em;margin-top:2px;">${label}</div>
      </div>
    `;
  }

  function _action(icon, label, route, badge = 0) {
    return `
      <div data-action-route="${route}" style="display:flex;align-items:center;gap:16px;padding:12px 4px;cursor:pointer;border-bottom:1px solid #f8fafc;touch-action:manipulation;">
        <div style="width:32px;height:32px;border-radius:10px;background:#f8fafc;display:flex;align-items:center;justify-content:center;font-size:1rem;flex-shrink:0;">${icon}</div>
        <span style="flex:1;font-size:0.9rem;font-weight:700;color:#334155;">${label}</span>
        ${badge > 0 ? `<span style="background:#ef4444;color:#fff;font-size:0.7rem;font-weight:800;padding:2px 8px;border-radius:10px;">${badge}</span>` : ''}
        <span style="color:#cbd5e1;font-size:1.1rem;">›</span>
      </div>
    `;
  }

  function _relTime(iso) {
    if (!iso) return '';
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1)  return 'Just now';
    if (m < 60) return `${m}m ago`;
    const h = Math.floor(m / 60);
    if (h < 24) return `${h}h ago`;
    const d = Math.floor(h / 24);
    if (d < 7)  return `${d}d ago`;
    return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
  }

  function _esc(str) {
    return String(str || '').replace(/[&<>"']/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;' }[c]));
  }

  _render();
  startTimer();
}

export const renderMobileDashboard = init;
