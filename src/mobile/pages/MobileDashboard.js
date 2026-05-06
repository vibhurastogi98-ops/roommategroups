/**
 * src/mobile/pages/MobileDashboard.js
 * High-level overview for mobile users (Stats, Activity, Actions).
 * Mirrored from the web dashboard overview.
 */

import { getCurrentUser } from '../../services/auth.js';
import { db, initDB, syncMessagesAndThreads } from '../../services/db.js';
import { navigate, updateHeader } from '../mobile-main.js';
import { getTotalUnread, getUnreadCountForThread } from '../../services/messaging.js';

let _dashGlobalTimer = null;

export async function init(container) {
    const user = getCurrentUser();
    if (!user) {
        navigate('auth');
        return;
    }

    updateHeader({
        title: 'Dashboard',
        showBack: false,
        rightAction: {
            icon: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>',
            label: 'Settings',
            onClick: () => navigate('settings')
        }
    });

    // Ensure DB data is fresh
    await initDB().catch(() => {});

    function _render() {
        const dbUser = db.users.findById(user.user_id || user.id);
        if (!dbUser) return;
        
        const userListings = db.listings.find(l => l.user_id === dbUser.user_id);
        const activeListingsCount = userListings.filter(l => l.status === 'active' || l.is_active !== false).length;
        const totalViews = userListings.reduce((sum, l) => sum + (l.view_count || l.views_count || 0), 0);
        const savedCount = (dbUser.saved_listings || []).length;
        const unreadMessages = getTotalUnread(dbUser.user_id);
        
        const threads = db.threads.find(t => {
            const parts = Array.isArray(t.participants) ? t.participants : JSON.parse(t.participants || '[]');
            return parts.includes(dbUser.user_id);
        });

        // ── Build activity from real data ──
        const activityItems = [];
        
        // Recent messages received
        const recentThreads = [...threads]
            .filter(t => !t.is_archived)
            .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))
            .slice(0, 3);

        recentThreads.forEach(t => {
            const parts = Array.isArray(t.participants) ? t.participants : JSON.parse(t.participants || '[]');
            const senderId = parts.find(id => id !== dbUser.user_id);
            const sender = senderId ? db.users.findById(senderId) : null;
            const listing = db.listings.findById(t.listing_id);
            const unread = getUnreadCountForThread(t.thread_id, dbUser.user_id);
            const senderName = sender ? sender.display_name : 'Someone';
            const listingTitle = listing ? listing.title : 'a listing';
            activityItems.push({
                icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>',
                color: unread > 0 ? '#000000' : '#64748b',
                text: `<strong>${_escapeHtml(senderName)}</strong> ${unread > 0 ? 'sent you a new message' : 'messaged you'} about <em>${_escapeHtml(listingTitle)}</em>.`,
                time: _formatRelativeTime(t.last_message_at),
                route: 'chat',
                params: { threadId: t.thread_id }
            });
        });

        // View milestones
        userListings.filter(l => (l.views_count || 0) >= 50).slice(0, 2).forEach(l => {
            activityItems.push({
                icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
                color: '#64748b',
                text: `Your listing <em>${_escapeHtml(l.title)}</em> has <strong>${l.views_count || 0} views</strong>.`,
                time: _formatRelativeTime(l.created_at),
                route: 'my-listings'
            });
        });

        const firstName = dbUser.display_name.split(' ')[0];
        const greeting = unreadMessages > 0
            ? `You have <strong>${unreadMessages} unread message${unreadMessages !== 1 ? 's' : ''}</strong> waiting.`
            : activeListingsCount > 0
                ? `Your ${activeListingsCount} listing${activeListingsCount !== 1 ? 's are' : ' is'} live.`
                : 'Post your first listing to start connecting.';

        container.innerHTML = `
            <div style="padding: 20px; background: #f8fafc; min-height: 100%; padding-bottom: 40px;">
                
                <!-- Welcome Banner -->
                <div style="background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%); border-radius: 24px; padding: 24px; color: white; margin-bottom: 24px; box-shadow: 0 10px 25px rgba(0,0,0,0.15); position: relative; overflow: hidden;">
                    <div style="position: relative; z-index: 2;">
                        <h2 style="font-size: 1.4rem; font-weight: 800; margin-bottom: 8px;">Welcome back, ${firstName}!</h2>
                        <p style="font-size: 0.9rem; opacity: 0.8; margin-bottom: 20px; line-height: 1.4; max-width: 220px;">${greeting}</p>
                        <button id="dash-browse-btn" class="mobile-btn" style="background: #fff; color: #1a1a1a; width: auto; padding: 10px 24px; font-size: 0.85rem; font-weight: 800; border: none;">
                            Browse Rooms
                        </button>
                    </div>
                    <div style="position: absolute; right: -20px; bottom: -20px; opacity: 0.05; transform: rotate(-15deg); color: #fff;">
                        <svg width="140" height="140" viewBox="0 0 24 24" fill="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                    </div>
                </div>

                <!-- Stats Grid -->
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 24px;">
                    ${_statCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>', activeListingsCount, 'Active Listings', '#1a1a1a')}
                    ${_statCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>', totalViews, 'Total Views', '#1a1a1a')}
                    ${_statCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>', unreadMessages, 'Messages', '#1a1a1a')}
                    ${_statCard('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>', savedCount, 'Saved', '#1a1a1a')}
                </div>

                <!-- Quick Actions -->
                <div style="background: #fff; border-radius: 24px; padding: 20px; border: 1px solid #f1f5f9; margin-bottom: 24px; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                    <h3 style="font-size: 1rem; font-weight: 800; color: #1e293b; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                        Quick Actions
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 4px;">
                        ${_actionRow('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>', 'Post New Listing', 'post', '#1a1a1a')}
                        ${_actionRow('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path></svg>', 'Check Messages', 'chat', '#1a1a1a', unreadMessages)}
                        ${_actionRow('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line x1="8" y1="18" x2="21" y2="18"></line><line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line x1="3" y1="18" x2="3.01" y2="18"></line></svg>', 'My Listings', 'my-listings', '#1a1a1a')}
                        ${_actionRow('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>', 'Account Settings', 'settings', '#1a1a1a')}
                        ${_actionRow('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect><line x1="1" y1="10" x2="23" y2="10"></line></svg>', 'Upgrade Plan', 'pricing', '#1a1a1a')}
                        ${_actionRow('<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>', 'Verify Account', 'verification', '#1a1a1a')}
                    </div>
                </div>

                <!-- Recent Activity -->
                <div style="background: #fff; border-radius: 24px; padding: 20px; border: 1px solid #f1f5f9; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                    <h3 style="font-size: 1rem; font-weight: 800; color: #1e293b; margin-bottom: 16px; display: flex; align-items: center; gap: 8px;">
                        Recent Activity
                    </h3>
                    <div style="display: flex; flex-direction: column; gap: 20px;">
                        ${activityItems.length === 0 
                            ? `<div style="text-align: center; padding: 20px; color: #94a3b8; font-size: 0.85rem;">No recent activity yet.</div>`
                            : activityItems.map(a => `
                                <div class="dash-activity-item" data-route="${a.route}" data-params='${JSON.stringify(a.params || {})}' style="display: flex; gap: 12px; align-items: flex-start; cursor: pointer;">
                                    <div style="width: 36px; height: 36px; border-radius: 12px; background: #f1f5f9; color: #1a1a1a; display: flex; align-items: center; justify-content: center; flex-shrink: 0;">${a.icon}</div>
                                    <div style="flex: 1;">
                                        <div style="font-size: 0.85rem; color: #475569; line-height: 1.4;">${a.text}</div>
                                        <div style="font-size: 0.72rem; color: #94a3b8; margin-top: 4px; font-weight: 600;">${a.time}</div>
                                    </div>
                                </div>
                            `).join('')}
                    </div>
                </div>

            </div>
        `;

        // Events
        container.querySelector('#dash-browse-btn')?.addEventListener('click', () => navigate('search'));
        
        container.querySelectorAll('.dash-action-row').forEach(row => {
            row.addEventListener('click', () => navigate(row.dataset.route));
        });

        container.querySelectorAll('.dash-activity-item').forEach(item => {
            item.addEventListener('click', () => {
                const route = item.dataset.route;
                const params = JSON.parse(item.dataset.params || '{}');
                navigate(route, params);
            });
        });
    }

    function _statCard(icon, val, label, color) {
        return `
            <div style="background: #fff; padding: 16px; border-radius: 20px; border: 1px solid #f1f5f9; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                <div style="width: 32px; height: 32px; border-radius: 10px; background: ${color}15; color: ${color}; display: flex; align-items: center; justify-content: center; font-size: 1rem; margin-bottom: 12px;">${icon}</div>
                <div style="font-size: 1.3rem; font-weight: 800; color: #1e293b;">${val}</div>
                <div style="font-size: 0.7rem; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 0.02em;">${label}</div>
            </div>
        `;
    }

    function _actionRow(icon, label, route, color, badge = 0) {
        return `
            <div class="dash-action-row" data-route="${route}" style="display: flex; align-items: center; gap: 16px; padding: 12px 4px; cursor: pointer; border-bottom: 1px solid #f8fafc;">
                <div style="width: 32px; height: 32px; border-radius: 10px; background: ${color}10; color: ${color}; display: flex; align-items: center; justify-content: center; font-size: 1rem;">${icon}</div>
                <span style="flex: 1; font-size: 0.9rem; font-weight: 700; color: #334155;">${label}</span>
                ${badge > 0 ? `<span style="background: #ef4444; color: white; font-size: 0.7rem; font-weight: 800; padding: 2px 8px; border-radius: 10px;">${badge}</span>` : ''}
                <span style="color: #cbd5e1; font-size: 1.1rem;">›</span>
            </div>
        `;
    }

    function _formatRelativeTime(iso) {
        if (!iso) return 'Long ago';
        const diff = Date.now() - new Date(iso).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return mins + 'm ago';
        const hours = Math.floor(mins / 60);
        if (hours < 24) return hours + 'h ago';
        const days = Math.floor(hours / 24);
        if (days < 7) return days + 'd ago';
        return new Date(iso).toLocaleDateString([], { month: 'short', day: 'numeric' });
    }

    function _escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
    }

    _render();

    // Setup background sync polling
    if (_dashGlobalTimer) clearInterval(_dashGlobalTimer);
    _dashGlobalTimer = setInterval(async () => {
        const changed = await syncMessagesAndThreads();
        if (changed) _render();
    }, 15000);
}

export const renderMobileDashboard = init;
