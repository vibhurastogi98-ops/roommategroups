import { getCurrentUser, logout, getVerificationBadge, isAdmin, changePassword } from '../services/auth.js';
import { navigate } from '../router.js';
import { db, syncMessagesAndThreads } from '../services/db.js';
import { getTotalUnread, getUnreadCountForThread } from '../services/messaging.js';
import { getAssetUrl, getAvatarUrl } from '../services/assets.js';
import { api } from '../services/api.js';
import { uploadImage } from '../services/upload.js';

// Module-level timers so they survive re-renders and can be cleared properly
let _msgPollingTimer = null;
let _dashGlobalTimer = null;

export function updateSidebarBadges(app, userId) {
    if (!app || !userId) return;
    const msgBadge = app.querySelector('#dash-sidebar-msg-badge');
    const notifBadge = app.querySelector('#dash-sidebar-notif-badge');
    const listBadge = app.querySelector('#dash-sidebar-list-badge');

    if (msgBadge) {
        const unread = getTotalUnread(userId);
        msgBadge.textContent = unread;
        msgBadge.style.display = unread > 0 ? 'flex' : 'none';
    }
    if (notifBadge) {
        const count = db.notifications.find(n => n.user_id === userId && !n.is_read).length;
        notifBadge.textContent = count;
        notifBadge.style.display = count > 0 ? 'flex' : 'none';
        // Also update mobile topbar if it exists
        const mobileNotifBadge = app.querySelector('#mobile-notif-badge');
        if (mobileNotifBadge) {
            mobileNotifBadge.textContent = count > 99 ? '99+' : count;
            mobileNotifBadge.style.display = count > 0 ? 'flex' : 'none';
        }
    }
    if (listBadge) {
        const pending = db.listings.find(l => l.user_id === userId && l.moderation_status === 'pending').length;
        const rejected = db.listings.find(l => l.user_id === userId && l.moderation_status === 'rejected').length;
        const total = pending + rejected;
        listBadge.textContent = total;
        listBadge.style.display = total > 0 ? 'flex' : 'none';
    }
}

export function renderDashboardPage(app) {
    // Clear any stale polling timer from a previous messages view
    if (_msgPollingTimer) { clearInterval(_msgPollingTimer); _msgPollingTimer = null; }
    const user = getCurrentUser();
    if (!user) {
        navigate('/auth/login');
        return;
    }

    const currentPath = (window.location.pathname || '/dashboard').split('?')[0];
    const dbUser = db.users.findById(user.id);

    let viewName = 'overview';
    if (currentPath === '/dashboard/listings') viewName = 'listings';
    if (currentPath === '/dashboard/messages') viewName = 'messages';
    if (currentPath === '/dashboard/archived-chats' || currentPath === '/archived-chats') viewName = 'archived';
    if (currentPath === '/dashboard/saved') viewName = 'saved';
    if (currentPath === '/dashboard/searches') viewName = 'searches';
    if (currentPath === '/profile' || currentPath === '/dashboard/profile') viewName = 'profile';
    if (currentPath === '/dashboard/offers') viewName = 'offers';
    if (currentPath === '/dashboard/reviews') viewName = 'reviews';
    if (currentPath === '/dashboard/verification') viewName = 'verification';
    if (currentPath === '/dashboard/subscription') viewName = 'subscription';
    if (currentPath === '/dashboard/settings' || currentPath === '/settings') viewName = 'settings';
    if (currentPath === '/dashboard/notifications' || currentPath === '/notifications') viewName = 'notifications';
    if (currentPath === '/dashboard/blocked-users' || currentPath === '/blocked-users') viewName = 'blocked';

    const avatarSrc = getAvatarUrl(dbUser.profile_photo, dbUser.display_name);
    const tierKey = dbUser.subscription_tier || 'free';
    const tierLabels = { free: 'Free', basic: 'Basic', premium: 'Premium', pro: 'Pro', admin: 'Admin' };

    function navLink(href, icon, label, view, badge) {
        const active = viewName === view ? 'active' : '';
        return '<a href="' + href + '" class="sidebar-link ' + active + '" onclick="event.preventDefault(); window.navigate(\'' + href + '\')">' +
            '<span class="link-icon"><i class="fa-solid ' + icon + '"></i></span>' +
            '<span class="link-text">' + label + '</span>' +
            (badge || '') +
            '</a>';
    }

    app.innerHTML = [
        '<div class="dashboard-layout">',
        '<h1 style="position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0;">My Dashboard</h1>',
        // ── Sidebar ──
        '<aside class="dashboard-sidebar" id="dashboard-sidebar">',
        '<div class="sidebar-header">',
        '<a href="/" class="sidebar-logo"><span class="logo-badge"><span class="logo-badge-left">Roommate</span><span class="logo-badge-right">Groups</span></span></a>',
        '<button class="mobile-menu-close" id="sidebar-close"><i class="fa-solid fa-xmark"></i></button>',
        '</div>',
        '<div class="sidebar-user">',
        '<div class="sidebar-user-wrap">',
        '<img src="' + avatarSrc + '" alt="User Avatar" class="sidebar-avatar" loading="lazy">',
        '<div>',
        '<div class="sidebar-user-name">' + escapeHtml(dbUser.display_name) + '</div>',
        '<div class="sidebar-user-tier tier-' + tierKey + '">' + (tierKey !== 'free' ? '<i class="fa-solid fa-bolt" style="font-size:0.6rem;"></i> ' : '') + tierLabels[tierKey] + ' Plan</div>',
        '</div>',
        '</div>',
        '</div>',
        '<nav class="sidebar-nav">',
        '<div class="sidebar-nav-section">Menu</div>',
        navLink('/dashboard', 'fa-house', 'Overview', 'overview'),
        navLink('/dashboard/listings', 'fa-list-ul', 'My Listings', 'listings', getListingsModerationBadge(dbUser.user_id)),
        navLink('/dashboard/messages', 'fa-message', 'Messages', 'messages', getUnreadCountBadge(dbUser.user_id)),
        navLink('/dashboard/notifications', 'fa-bell', 'Notifications', 'notifications', getUnreadNotifBadge(dbUser.user_id)),
        navLink('/dashboard/saved', 'fa-heart', 'Saved Listings', 'saved'),
        navLink('/dashboard/searches', 'fa-magnifying-glass', 'Saved Searches', 'searches'),
        navLink('/dashboard/archived-chats', 'fa-box-archive', 'Archived Chats', 'archived'),
        '<div class="sidebar-nav-section">Marketplace</div>',
        navLink('/dashboard/offers', 'fa-tag', 'Offers', 'offers', getPendingOffersBadge()),
        navLink('/dashboard/reviews', 'fa-star', 'Reviews', 'reviews'),
        '<div class="sidebar-nav-section">Account</div>',
        navLink('/dashboard/profile', 'fa-user', 'Profile', 'profile'),
        navLink('/dashboard/verification', 'fa-shield-halved', 'Verification', 'verification', getVerificationStatusBadge(dbUser)),
        navLink('/dashboard/subscription', 'fa-credit-card', 'Subscription', 'subscription'),
        navLink('/dashboard/settings', 'fa-gear', 'Settings', 'settings'),
        navLink('/dashboard/blocked-users', 'fa-ban', 'Blocked Users', 'blocked'),
        (isAdmin() ? '<div class="sidebar-nav-section">Admin</div>' + navLink('/admin', 'fa-lock', 'Admin Panel', '') : ''),
        '</nav>',
        '<div class="sidebar-footer">',
        '<button id="btn-signout" class="sidebar-link" style="color:#1a1a1a;"><span class="link-icon" style="color:#1a1a1a;"><i class="fa-solid fa-arrow-right-from-bracket"></i></span> Sign Out</button>',
        '</div>',
        '</aside>',
        // ── Backdrop (mobile) ──
        '<div class="sidebar-backdrop" id="sidebar-backdrop"></div>',
        // ── Main ──
        '<main class="dashboard-main">',
        '<div class="dashboard-topbar mobile-only">',
        '<button id="sidebar-toggle" class="btn btn-icon" style="background:rgba(0,0,0,0.03);border:1px solid var(--border);width:44px;height:44px;border-radius:10px;display:flex;align-items:center;justify-content:center;cursor:pointer;flex-shrink:0;"><i class="fa-solid fa-bars" style="font-size:1.1rem;color:var(--text-primary);"></i></button>',
        '<div class="topbar-logo"><i class="fa-solid fa-house-chimney" style="color:var(--primary);margin-right:6px;"></i>Dashboard</div>',
        '<div style="display:flex;align-items:center;gap:8px;">',
        '<a href="/dashboard/notifications" class="nav-msg-btn" style="position:relative;" title="Notifications">',
        '<i class="fa-solid fa-bell" style="font-size:1rem;color:var(--text-secondary);"></i>',
        (() => { const c = db.notifications.find(n => n.user_id === dbUser.user_id && !n.is_read).length; return '<span class="nav-msg-badge" id="mobile-notif-badge" style="' + (c > 0 ? 'display:flex;' : 'display:none;') + '">' + (c > 99 ? '99+' : c) + '</span>'; })(),
        '</a>',
        '<div class="topbar-user-pill"><img src="' + avatarSrc + '" class="topbar-avatar" alt="User Avatar" loading="lazy"><span>' + escapeHtml(dbUser.display_name.split(' ')[0]) + '</span></div>',
        '</div>',
        '</div>',
        '<div class="dashboard-content fade-in' + (viewName === 'messages' || viewName === 'archived' ? ' msg-view-active' : '') + '" id="dashboard-content"></div>',
        '</main>',
        '</div>'
    ].join('');

    const contentArea = app.querySelector('#dashboard-content');

    switch (viewName) {
        case 'overview': renderOverview(contentArea, dbUser); break;
        case 'listings': renderMyListings(contentArea, dbUser); break;
        case 'messages': renderMessages(contentArea, dbUser, app); break;
        case 'archived': renderArchivedChats(contentArea, dbUser, app); break;
        case 'saved': renderSaved(contentArea, dbUser); break;
        case 'searches': renderSavedSearches(contentArea, dbUser); break;
        case 'profile': renderProfileDashboard(contentArea, dbUser); break;
        case 'offers': renderOffersDashboard(contentArea, dbUser, app); break;
        case 'reviews': renderReviewsDashboard(contentArea, dbUser); break;
        case 'verification': renderVerification(contentArea, dbUser); break;
        case 'subscription': renderSubscription(contentArea, dbUser); break;
        case 'settings': renderSettings(contentArea, dbUser); break;
        case 'notifications': renderNotifications(contentArea, dbUser); break;
        case 'blocked': renderBlockedUsers(contentArea, dbUser); break;
    }
    hydrateSellerListingsForDashboard(dbUser, app, viewName);

    app.querySelector('#btn-signout').addEventListener('click', async () => {
        await logout();
        navigate('/');
    });

    const sidebar  = app.querySelector('#dashboard-sidebar');
    const backdrop = app.querySelector('#sidebar-backdrop');
    const toggleBtn = app.querySelector('#sidebar-toggle');
    const closeBtn  = app.querySelector('#sidebar-close');
    function openSidebar()  { sidebar.classList.add('mobile-open'); backdrop.classList.add('visible'); }
    function closeSidebar() { sidebar.classList.remove('mobile-open'); backdrop.classList.remove('visible'); }
    if (toggleBtn) toggleBtn.addEventListener('click', openSidebar);
    if (closeBtn)  closeBtn.addEventListener('click', closeSidebar);
    if (backdrop)  backdrop.addEventListener('click', closeSidebar);

    const updateBadges = () => updateSidebarBadges(app, dbUser.user_id);
    hydratePendingOffersBadge(app);

    window.addEventListener('db-synced', updateBadges);
    
    // Global dashboard polling (every 15s) to keep sidebar badges in sync
    if (_dashGlobalTimer) clearInterval(_dashGlobalTimer);
    _dashGlobalTimer = setInterval(async () => {
        // Only run if we are still on a dashboard page
        if (!window.location.pathname.startsWith('/dashboard')) {
            clearInterval(_dashGlobalTimer);
            _dashGlobalTimer = null;
            return;
        }
        const changed = await syncMessagesAndThreads();
        if (changed) updateBadges();
    }, 15000);
}

// ── Helpers ──────────────────────────────────────────────────

function getUnreadCountBadge(userId) {
    const unread = getTotalUnread(userId);
    return '<span class="badge badge-primary badge-sm" id="dash-sidebar-msg-badge" style="margin-left:auto;background:#ef4444;' + (unread > 0 ? '' : 'display:none;') + '">' + unread + '</span>';
}

function getUnreadNotifBadge(userId) {
    const count = db.notifications.find(n => n.user_id === userId && !n.is_read).length;
    return '<span class="badge badge-primary badge-sm" id="dash-sidebar-notif-badge" style="margin-left:auto;background:#ef4444;' + (count > 0 ? '' : 'display:none;') + '">' + count + '</span>';
}

function getListingsModerationBadge(userId) {
    const pending = db.listings.find(l => l.user_id === userId && l.moderation_status === 'pending').length;
    const rejected = db.listings.find(l => l.user_id === userId && l.moderation_status === 'rejected').length;
    const total = pending + rejected;
    return '<span class="badge badge-primary badge-sm" id="dash-sidebar-list-badge" style="margin-left:auto;background:#ef4444;' + (total > 0 ? '' : 'display:none;') + '">' + total + '</span>';
}

function getVerificationStatusBadge(dbUser) {
    if (dbUser.id_status === 'pending') return '<span class="badge badge-primary badge-sm" style="margin-left:auto;background:#f59e0b;"><i class="fa-solid fa-clock"></i></span>';
    if (dbUser.id_status === 'rejected') return '<span class="badge badge-primary badge-sm" style="margin-left:auto;background:#ef4444;"><i class="fa-solid fa-triangle-exclamation"></i></span>';
    return '';
}

// getVerificationBadge imported from auth.js

function formatRelativeTime(isoString) {
    const diff = Date.now() - new Date(isoString).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return mins + 'm ago';
    const hours = Math.floor(mins / 60);
    if (hours < 24) return hours + 'h ago';
    const days = Math.floor(hours / 24);
    if (days < 7) return days + 'd ago';
    return new Date(isoString).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function parseArray(value) {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') { try { return JSON.parse(value || '[]'); } catch (e) { return []; } }
    return [];
}

function getListingId(listing) {
    return listing?.listing_id || listing?.id || '';
}

function getListingKind(listing) {
    const kind = String(listing?.kind || 'rental').toLowerCase();
    if (kind === 'sale') return 'sale';
    const hasMarketplaceShape = listing?.category_id
        || listing?.condition
        || listing?.brand
        || listing?.attributes
        || ((listing?.price !== undefined && listing?.price !== null && listing?.price !== '') && (listing?.rent === undefined || listing?.rent === null || listing?.rent === ''));
    return hasMarketplaceShape ? 'sale' : 'rental';
}

function isSaleListing(listing) {
    return getListingKind(listing) === 'sale';
}

function isSoldListing(listing) {
    return listing?.status === 'sold' || Boolean(listing?.sold_at);
}

function formatListingPrice(listing) {
    const symbol = listing?.currency === 'INR' ? '₹' : listing?.currency === 'EUR' ? '€' : listing?.currency === 'GBP' ? '£' : '$';
    const value = isSaleListing(listing) ? listing?.price : (listing?.rent ?? listing?.price);
    if (value === undefined || value === null || value === '') return isSaleListing(listing) ? 'Ask seller' : 'Price TBC';
    const formatted = symbol + Number(value).toLocaleString(listing?.currency === 'INR' ? 'en-IN' : 'en-US');
    return isSaleListing(listing) ? formatted : formatted + '/mo';
}

function getListingThumb(listing, fallback = '') {
    let imgs = listing?.images || listing?.photos || [];
    if (typeof imgs === 'string') { try { imgs = JSON.parse(imgs || '[]'); } catch (e) { imgs = []; } }
    const first = Array.isArray(imgs) ? imgs[0] : imgs;
    const raw = typeof first === 'object' && first ? (first.thumb || first.medium || first.full || '') : first;
    return raw ? getAssetUrl(raw) : fallback;
}

async function refreshDashboardUser(user) {
    const userId = user?.user_id || user?.id;
    if (!userId) return user;
    try {
        const users = await api.getUsers(true);
        const rows = Array.isArray(users) ? users : (users?.results || users?.users || []);
        const fresh = rows.find(u => (u.user_id || u.id) === userId);
        if (fresh) {
            await db.users.update(userId, fresh).catch(() => {});
            return { ...user, ...fresh, user_id: fresh.user_id || userId, id: fresh.user_id || fresh.id || userId };
        }
    } catch (_) {}
    return db.users.findById(userId) || user;
}

function normalizeOffersPayload(payload) {
    return {
        sent: Array.isArray(payload?.sent) ? payload.sent : [],
        received: Array.isArray(payload?.received) ? payload.received : []
    };
}

async function loadDashboardOffers() {
    try {
        return normalizeOffersPayload(await api.getOffers(true));
    } catch (_) {
        return { sent: [], received: [] };
    }
}

async function hydrateSellerListingsForDashboard(user, app, viewName) {
    const userId = user?.user_id || user?.id;
    if (!userId || app.dataset.sellerListingsHydrated === userId) return;
    app.dataset.sellerListingsHydrated = userId;

    try {
        const seller = await api.getSeller(userId, true);
        const listings = Array.isArray(seller?.listings) ? seller.listings : [];
        let changed = false;

        for (const listing of listings) {
            if (!listing?.listing_id || db.listings.findById(listing.listing_id)) continue;
            await db.listings.create({
                ...listing,
                user_id: listing.user_id || userId,
                kind: listing.kind || (listing.category_id || listing.price !== undefined ? 'sale' : 'rental'),
            });
            changed = true;
        }

        if (changed && (viewName === 'overview' || viewName === 'listings')) {
            renderDashboardPage(app);
        }
    } catch (_) {
        // Recovery only: older direct-API sale items may not be in local SPA cache.
    }
}

function getPendingOffersBadge() {
    return '<span class="badge badge-primary badge-sm" id="dash-sidebar-offer-badge" style="margin-left:auto;background:#ef4444;display:none;">0</span>';
}

async function hydratePendingOffersBadge(app) {
    const badge = app?.querySelector('#dash-sidebar-offer-badge');
    if (!badge) return;
    const offers = await loadDashboardOffers();
    const count = offers.received.filter(o => String(o.status || 'pending').toLowerCase() === 'pending').length;
    badge.textContent = count;
    badge.style.display = count > 0 ? 'flex' : 'none';
}

function renderStars(value) {
    const rating = Math.round(Math.max(0, Math.min(5, Number(value) || 0)));
    return [1, 2, 3, 4, 5].map(i => '<i class="fa-' + (i <= rating ? 'solid' : 'regular') + ' fa-star"></i>').join('');
}

function showToast(message, type = 'success') {
    const existing = document.getElementById('rg-toast');
    if (existing) existing.remove();
    const toast = document.createElement('div');
    toast.id = 'rg-toast';
    toast.className = 'rg-toast rg-toast-' + type;
    toast.innerHTML = '<i class="fa-solid ' + (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check') + '"></i> ' + message;
    document.body.appendChild(toast);
    setTimeout(() => toast.classList.add('visible'), 10);
    setTimeout(() => { toast.classList.remove('visible'); setTimeout(() => toast.remove(), 300); }, 3500);
}

function showDashboardConfirm({
    title = 'Confirm action',
    message = 'Are you sure?',
    confirmLabel = 'OK',
    cancelLabel = 'Cancel',
    danger = true,
} = {}) {
    return new Promise(resolve => {
        document.getElementById('dashboard-confirm-overlay')?.remove();

        const overlay = document.createElement('div');
        overlay.id = 'dashboard-confirm-overlay';
        overlay.style.cssText = [
            'position:fixed',
            'inset:0',
            'z-index:99999',
            'display:flex',
            'align-items:center',
            'justify-content:center',
            'padding:20px',
            'background:rgba(15,23,42,0.48)',
            'backdrop-filter:blur(6px)',
        ].join(';');

        overlay.innerHTML = `
            <div role="dialog" aria-modal="true" aria-labelledby="dashboard-confirm-title" style="width:min(420px,100%);background:var(--surface,#fff);border:1px solid var(--border,#e5e7eb);border-radius:20px;box-shadow:0 24px 80px rgba(15,23,42,.28);padding:24px;">
              <div style="display:flex;gap:14px;align-items:flex-start;">
                <div style="width:42px;height:42px;border-radius:14px;background:${danger ? 'rgba(239,68,68,.1)' : 'rgba(15,23,42,.06)'};color:${danger ? '#ef4444' : 'var(--text-primary,#111827)'};display:flex;align-items:center;justify-content:center;flex-shrink:0;">
                  <i class="fa-solid ${danger ? 'fa-trash-can' : 'fa-circle-question'}"></i>
                </div>
                <div style="flex:1;min-width:0;">
                  <h3 id="dashboard-confirm-title" style="margin:0 0 8px;font-size:1.08rem;line-height:1.25;color:var(--text-primary,#111827);font-weight:900;">${escapeHtml(title)}</h3>
                  <p style="margin:0;color:var(--text-secondary,#64748b);font-size:.92rem;line-height:1.55;">${escapeHtml(message)}</p>
                </div>
              </div>
              <div style="display:flex;justify-content:flex-end;gap:10px;margin-top:24px;flex-wrap:wrap;">
                <button type="button" id="dashboard-confirm-cancel" class="btn btn-outline btn-sm">${escapeHtml(cancelLabel)}</button>
                <button type="button" id="dashboard-confirm-ok" class="btn btn-sm" style="background:${danger ? '#1a1a1a' : 'var(--primary,#1a1a1a)'};color:#fff;border:1px solid ${danger ? '#1a1a1a' : 'var(--primary,#1a1a1a)'};">${escapeHtml(confirmLabel)}</button>
              </div>
            </div>
        `;

        const finish = value => {
            overlay.remove();
            document.removeEventListener('keydown', onKey);
            resolve(value);
        };
        const onKey = event => {
            if (event.key === 'Escape') finish(false);
        };
        document.addEventListener('keydown', onKey);
        overlay.querySelector('#dashboard-confirm-cancel').addEventListener('click', () => finish(false));
        overlay.querySelector('#dashboard-confirm-ok').addEventListener('click', () => finish(true));
        overlay.addEventListener('click', event => {
            if (event.target === overlay) finish(false);
        });
        setTimeout(() => overlay.querySelector('#dashboard-confirm-ok')?.focus(), 0);
        document.body.appendChild(overlay);
    });
}

// ── Overview ──────────────────────────────────────────────────

async function renderOverview(container, user) {
    const userListings = db.listings.find(l => l.user_id === user.user_id);
    const activeListingsCount = userListings.filter(l => l.status === 'active' && l.is_active !== false).length;
    const soldItemsCount = userListings.filter(l => isSaleListing(l) && isSoldListing(l)).length;
    const totalViews = userListings.reduce((sum, l) => sum + (l.view_count || l.views_count || 0), 0);
    const savedCount = parseArray(user.saved_listings).length;
    const offersData = await loadDashboardOffers();
    const pendingOffers = offersData.received.filter(o => String(o.status || 'pending').toLowerCase() === 'pending');
    const sellerRating = Number(user.seller_rating_avg || user.rating_avg || 0);
    const sellerRatingCount = Number(user.seller_rating_count || user.rating_count || 0);
    const threads = db.threads.find(t => {
        const parts = typeof t.participants === 'string' ? JSON.parse(t.participants || '[]') : (t.participants || []);
        return parts.includes(user.user_id);
    }).map(t => ({
        ...t,
        participants: typeof t.participants === 'string' ? JSON.parse(t.participants || '[]') : (t.participants || [])
    }));
    const unreadMessages = getTotalUnread(user.user_id);

    // ── Build activity from real data ──
    const activityItems = [];

    // Recent messages received (latest 4 threads, most recent first)
    const recentThreads = threads
        .filter(t => !t.is_archived)
        .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at))
        .slice(0, 3);

    recentThreads.forEach(t => {
        const senderId = t.participants.find(id => id !== user.user_id);
        const sender = senderId ? db.users.findById(senderId) : null;
        const listing = db.listings.findById(t.listing_id);
        const unread = getUnreadCountForThread(t.thread_id, user.user_id);
        const senderName = sender ? sender.display_name : 'Someone';
        const listingTitle = listing ? listing.title : 'a listing';
        activityItems.push({
            icon: 'fa-envelope',
            color: unread > 0 ? 'activity-icon-violet' : 'activity-icon-blue',
            text: '<strong>' + escapeHtml(senderName) + '</strong> ' + (unread > 0 ? 'sent you a new message' : 'messaged you') + ' about <em>' + escapeHtml(listingTitle) + '</em>.',
            time: formatRelativeTime(t.last_message_at),
        });
    });

    // View milestones on own listings
    userListings.filter(l => (l.views_count || 0) >= 50).slice(0, 2).forEach(l => {
        activityItems.push({
            icon: 'fa-eye',
            color: 'activity-icon-green',
            text: 'Your listing <em>' + escapeHtml(l.title) + '</em> has <strong>' + (l.views_count || 0) + ' views</strong>.',
            time: formatRelativeTime(l.created_at),
        });
    });

    // Saved listings activity
    if (savedCount > 0) {
        activityItems.push({
            icon: 'fa-heart',
            color: 'activity-icon-rose',
            text: 'You have <strong>' + savedCount + ' saved listing' + (savedCount !== 1 ? 's' : '') + '</strong>. Browse them anytime.',
            time: 'Saved',
        });
    }

    pendingOffers.slice(0, 3).forEach(o => {
        activityItems.push({
            icon: 'fa-tag',
            color: 'activity-icon-amber',
            text: 'New offer of <strong>$' + Number(o.amount || 0).toLocaleString() + '</strong> on <em>' + escapeHtml(o.listing_title || 'your item') + '</em>.',
            time: formatRelativeTime(o.created_at),
        });
    });

    const activityHTML = activityItems.length === 0
        ? '<div class="activity-empty"><i class="fa-solid fa-inbox"></i><p>No activity yet. Post a listing or send a message to get started.</p></div>'
        : activityItems.slice(0, 5).map(a => [
            '<div class="activity-item">',
            '<div class="activity-icon ' + a.color + '"><i class="fa-solid ' + a.icon + '"></i></div>',
            '<div class="activity-content">',
            '<div class="activity-meta">' + a.text + '</div>',
            '<div class="activity-time">' + a.time + '</div>',
            '</div>',
            '</div>'
        ].join('')).join('');

    const firstName = user.display_name.split(' ')[0];
    const greeting = unreadMessages > 0
        ? 'You have <strong>' + unreadMessages + ' unread message' + (unreadMessages !== 1 ? 's' : '') + '</strong> waiting.'
        : activeListingsCount > 0
            ? 'Your ' + activeListingsCount + ' listing' + (activeListingsCount !== 1 ? 's are' : ' is') + ' live and visible.'
            : 'Post your first listing to start connecting with renters.';

    container.innerHTML = [
        '<div class="dashboard-header-bar">',
        '<h2>Overview</h2>',
        '<a href="/post-listing" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Post Listing</a>',
        '</div>',

        // Welcome banner
        '<div class="welcome-banner">',
        '<div class="welcome-text">',
        '<h2>Welcome back, ' + escapeHtml(firstName) + '! 👋</h2>',
        '<p>' + greeting + '</p>',
        '</div>',
        '<div class="welcome-cta">',
        '<a href="/search/rooms" class="btn btn-outline" style="background:rgba(255,255,255,0.15);border-color:rgba(255,255,255,0.4);color:white;">',
        '<i class="fa-solid fa-magnifying-glass"></i> Browse Rooms</a>',
        '</div>',
        '</div>',

        // Stats
        '<div class="stats-grid">',
        '<div class="stat-card stat-card-blue">',
        '<div class="stat-icon stat-icon-blue"><i class="fa-solid fa-house"></i></div>',
        '<div class="stat-body"><div class="stat-value">' + activeListingsCount + '</div><div class="stat-label">Active Listings</div>',
        '<div class="stat-trend neutral"><i class="fa-solid fa-arrow-right"></i> ' + userListings.length + ' total</div>',
        '</div></div>',
        '<div class="stat-card stat-card-green">',
        '<div class="stat-icon stat-icon-green"><i class="fa-solid fa-eye"></i></div>',
        '<div class="stat-body"><div class="stat-value">' + totalViews + '</div><div class="stat-label">Total Views</div>',
        '<div class="stat-trend ' + (totalViews > 0 ? 'up' : 'neutral') + '"><i class="fa-solid fa-' + (totalViews > 0 ? 'arrow-up' : 'minus') + '"></i> All listings</div>',
        '</div></div>',
        '<div class="stat-card stat-card-violet">',
        '<div class="stat-icon stat-icon-violet"><i class="fa-solid fa-message"></i></div>',
        '<div class="stat-body"><div class="stat-value">' + unreadMessages + '</div><div class="stat-label">Unread Messages</div>',
        '<div class="stat-trend ' + (unreadMessages > 0 ? 'up' : 'neutral') + '"><i class="fa-solid fa-' + (unreadMessages > 0 ? 'circle-exclamation' : 'check') + '"></i> ' + threads.length + ' conversations</div>',
        '</div></div>',
        '<div class="stat-card stat-card-rose">',
        '<div class="stat-icon stat-icon-rose"><i class="fa-solid fa-heart"></i></div>',
        '<div class="stat-body"><div class="stat-value">' + savedCount + '</div><div class="stat-label">Saved Listings</div>',
        '<div class="stat-trend neutral"><i class="fa-solid fa-bookmark"></i> Wishlist</div>',
        '</div></div>',
        '<div class="stat-card stat-card-green">',
        '<div class="stat-icon stat-icon-green"><i class="fa-solid fa-circle-check"></i></div>',
        '<div class="stat-body"><div class="stat-value">' + soldItemsCount + '</div><div class="stat-label">Items Sold</div>',
        '<div class="stat-trend neutral"><i class="fa-solid fa-store"></i> Marketplace</div>',
        '</div></div>',
        '<div class="stat-card stat-card-amber">',
        '<div class="stat-icon stat-icon-amber"><i class="fa-solid fa-tag"></i></div>',
        '<div class="stat-body"><div class="stat-value">' + pendingOffers.length + '</div><div class="stat-label">Offers Received</div>',
        '<div class="stat-trend ' + (pendingOffers.length ? 'up' : 'neutral') + '"><i class="fa-solid fa-handshake"></i> Pending</div>',
        '</div></div>',
        '<div class="stat-card stat-card-violet">',
        '<div class="stat-icon stat-icon-violet"><i class="fa-solid fa-star"></i></div>',
        '<div class="stat-body"><div class="stat-value">' + (sellerRating ? sellerRating.toFixed(1) : '—') + '</div><div class="stat-label">Seller Rating</div>',
        '<div class="stat-trend neutral"><i class="fa-solid fa-comment"></i> ' + sellerRatingCount + ' reviews</div>',
        '</div></div>',
        '</div>',

        // Bottom row
        '<div class="dashboard-row" style="gap:20px;">',
        '<div class="db-panel" style="flex:2;min-width:0;">',
        '<h3 class="panel-title"><i class="fa-solid fa-clock-rotate-left"></i> Recent Activity</h3>',
        '<div class="activity-feed">' + activityHTML + '</div>',
        '</div>',
        '<div class="db-panel" style="flex:1;min-width:220px;">',
        '<h3 class="panel-title"><i class="fa-solid fa-bolt"></i> Quick Actions</h3>',
        '<div class="quick-actions-list">',
        '<a href="/post-listing" class="qa-item"><span class="qa-item-icon qa-green"><i class="fa-solid fa-plus"></i></span>Post New Listing<i class="fa-solid fa-chevron-right qa-arrow"></i></a>',
        '<a href="/dashboard/messages" class="qa-item"><span class="qa-item-icon qa-blue"><i class="fa-solid fa-comments"></i></span>Check Messages' + (unreadMessages > 0 ? ' <span class="badge-sm" style="background:var(--primary);color:#fff;padding:1px 7px;border-radius:20px;font-size:0.68rem;font-weight:700;margin-left:4px;">' + unreadMessages + '</span>' : '') + '<i class="fa-solid fa-chevron-right qa-arrow"></i></a>',
        '<a href="/dashboard/listings" class="qa-item"><span class="qa-item-icon qa-amber"><i class="fa-solid fa-list-ul"></i></span>My Listings<i class="fa-solid fa-chevron-right qa-arrow"></i></a>',
        '<a href="/dashboard/offers" class="qa-item"><span class="qa-item-icon qa-green"><i class="fa-solid fa-tag"></i></span>Offers' + (pendingOffers.length > 0 ? ' <span class="badge-sm" style="background:#ef4444;color:#fff;padding:1px 7px;border-radius:20px;font-size:0.68rem;font-weight:700;margin-left:4px;">' + pendingOffers.length + '</span>' : '') + '<i class="fa-solid fa-chevron-right qa-arrow"></i></a>',
        '<a href="/profile-setup" class="qa-item"><span class="qa-item-icon qa-violet"><i class="fa-solid fa-user-pen"></i></span>Edit Profile<i class="fa-solid fa-chevron-right qa-arrow"></i></a>',
        '<a href="/dashboard/verification" class="qa-item"><span class="qa-item-icon" style="background:#f5f5f5;color:#333333;"><i class="fa-solid fa-shield-halved"></i></span>Verify Account<i class="fa-solid fa-chevron-right qa-arrow"></i></a>',
        '</div>',
        '</div>',
        '</div>',
    ].join('');
}

// ── My Listings ────────────────────────────────────────────────

function renderMyListings(container, user) {
    const allListings = db.listings.find(l => l.user_id === user.user_id && l.status !== 'deleted')
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    let activeFilter = 'all'; // 'all' | 'active' | 'paused' | 'sold'

    function buildRows(listings) {
        if (listings.length === 0) {
            return '<div class="empty-state"><i class="fa-solid fa-house-circle-xmark"></i><h3>No listings here</h3><p>Post a room or list an item to start connecting.</p><div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;"><a href="/post-listing?kind=sale" class="btn btn-primary"><i class="fa-solid fa-store"></i> List an Item</a><a href="/post-listing?kind=rental" class="btn btn-outline"><i class="fa-solid fa-house"></i> Post a Room</a></div></div>';
        }
        const rows = listings.map(l => {
            const cityObj = db.cities.findById(l.city);
            const location = cityObj ? cityObj.name : (l.city || '');
            const msgCount = db.threads.find(t => {
                const parts = typeof t.participants === 'string' ? JSON.parse(t.participants || '[]') : (t.participants || []);
                return t.listing_id === l.listing_id && parts.includes(user.user_id);
            }).length;
            const isActive = l.status === 'active' && l.is_active !== false;
            const isSold = isSoldListing(l);
            const isPaused = !isSold && (l.status === 'paused' || l.is_active === false);
            const _imgs = l.images || l.photos || [];
            const parsedImgs = typeof _imgs === 'string' ? JSON.parse(_imgs || '[]') : _imgs;
            const rawPhoto = parsedImgs && parsedImgs[0];
            const rawThumbSrc = !rawPhoto ? '' : (typeof rawPhoto === 'string' ? rawPhoto : (rawPhoto.thumb || rawPhoto.medium || rawPhoto.full || ''));
            const thumbSrc = rawThumbSrc ? getAssetUrl(rawThumbSrc) : '';
            const thumb = thumbSrc ? 'background-image:url(\'' + thumbSrc + '\')' : '';
            const kindLabel = isSaleListing(l) ? 'Item' : 'Room';
            return [
                '<tr data-lid="' + l.listing_id + '">',
                '<td><div class="td-listing">',
                '<div class="td-thumb" style="' + thumb + '">' + (!parsedImgs || !parsedImgs[0] ? '<i class="fa-solid fa-' + (isSaleListing(l) ? 'store' : 'house') + '"></i>' : '') + '</div>',
                '<div class="td-info">',
                '<h4><a href="/listing/' + l.listing_id + '" style="color:inherit;text-decoration:none;">' + escapeHtml(l.title) + '</a> <span class="badge badge-gray" style="font-size:0.66rem;padding:2px 8px;border-radius:20px;margin-left:6px;">' + kindLabel + '</span></h4>',
                '<p>' + escapeHtml(location) + ' &bull; ' + formatListingPrice(l) + '</p>',
                '</div></div></td>',
                '<td>' + (() => {
                    const modStatus = l.moderation_status || 'approved';
                    if (modStatus === 'pending') return '<span class="badge badge-warning" style="font-size:0.72rem;padding:3px 10px;border-radius:20px;"><i class="fa-solid fa-clock"></i> Pending Review</span>';
                    if (modStatus === 'rejected') return '<div class="status-reject-wrap"><span class="badge badge-danger" style="font-size:0.72rem;padding:3px 10px;border-radius:20px;"><i class="fa-solid fa-circle-xmark"></i> Rejected</span><div class="reject-reason-tip">' + escapeHtml(l.rejection_reason || 'Guidelines violation') + '</div></div>';
                    if (modStatus === 'flagged') return '<span class="badge badge-warning" style="font-size:0.72rem;padding:3px 10px;border-radius:20px;"><i class="fa-solid fa-flag"></i> Flagged</span>';
                    
                    if (isSold) return '<span class="badge badge-success" style="font-size:0.72rem;padding:3px 10px;border-radius:20px;"><i class="fa-solid fa-check"></i> Sold</span>';
                    if (isActive) return '<span class="badge badge-success" style="font-size:0.72rem;padding:3px 10px;border-radius:20px;">Active</span>';
                    if (isPaused) return '<span class="badge badge-warning" style="font-size:0.72rem;padding:3px 10px;border-radius:20px;">Paused</span>';
                    return '<span class="badge badge-gray" style="font-size:0.72rem;padding:3px 10px;border-radius:20px;">' + (l.status || 'Inactive').charAt(0).toUpperCase() + (l.status || 'Inactive').slice(1) + '</span>';
                })() + '</td>',
                '<td><div class="td-stats"><span><i class="fa-solid fa-eye"></i> ' + (l.view_count || l.views_count || 0) + '</span><span><i class="fa-solid fa-message"></i> ' + msgCount + '</span></div></td>',
                '<td><div class="td-actions">',
                '<button class="btn-icon-sm action-view" data-id="' + l.listing_id + '" title="View listing"><i class="fa-solid fa-eye"></i></button>',
                '<button class="btn-icon-sm action-edit" data-id="' + l.listing_id + '" title="Edit listing"><i class="fa-solid fa-pen"></i></button>',
                !isSold ? '<button class="btn-icon-sm ' + (isActive ? '' : 'success') + ' action-toggle" data-id="' + l.listing_id + '" title="' + (isActive ? 'Pause' : 'Activate') + '"><i class="fa-solid fa-' + (isActive ? 'pause' : 'play') + '"></i></button>' : '',
                isSaleListing(l) && isActive && !isSold ? '<button class="btn-icon-sm action-promote" data-id="' + l.listing_id + '" title="Promote item"><i class="fa-solid fa-rocket"></i></button>' : '',
                isSaleListing(l) && isActive && !isSold ? '<button class="btn-icon-sm success action-sold" data-id="' + l.listing_id + '" title="Mark as sold"><i class="fa-solid fa-circle-check"></i></button>' : '',
                '<button class="btn-icon-sm danger action-delete" data-id="' + l.listing_id + '" title="Delete"><i class="fa-solid fa-trash"></i></button>',
                '</div></td>',
                '</tr>'
            ].join('');
        }).join('');
        return '<table class="db-table"><thead><tr><th>Listing</th><th>Status</th><th>Stats</th><th>Actions</th></tr></thead><tbody>' + rows + '</tbody></table>';
    }

    function getFiltered() {
        if (activeFilter === 'active') return allListings.filter(l => l.status === 'active' && l.is_active !== false);
        if (activeFilter === 'paused') return allListings.filter(l => !isSoldListing(l) && (l.status === 'paused' || l.is_active === false));
        if (activeFilter === 'sold') return allListings.filter(l => isSoldListing(l));
        return allListings;
    }

    function rerender() {
        const activeCount = allListings.filter(l => l.status === 'active' && l.is_active !== false).length;
        const pausedCount = allListings.filter(l => !isSoldListing(l) && (l.status === 'paused' || l.is_active === false)).length;
        const soldCount = allListings.filter(l => isSoldListing(l)).length;

        const tabs = container.querySelectorAll('.db-tab');
        tabs.forEach(t => {
            const filter = t.dataset.filter;
            t.classList.toggle('active', filter === activeFilter);
            if (filter === 'all') t.textContent = 'All (' + allListings.length + ')';
            if (filter === 'active') t.textContent = 'Active (' + activeCount + ')';
            if (filter === 'paused') t.textContent = 'Paused (' + pausedCount + ')';
            if (filter === 'sold') t.textContent = 'Sold (' + soldCount + ')';
        });

        const tableWrap = container.querySelector('.listings-table-container');
        if (tableWrap) tableWrap.innerHTML = buildRows(getFiltered());
        bindActions();
    }

    function bindActions() {
        container.querySelectorAll('.action-view').forEach(btn => {
            btn.addEventListener('click', () => { navigate('/listing/' + btn.dataset.id); });
        });
        container.querySelectorAll('.action-toggle').forEach(btn => {
            btn.addEventListener('click', async () => {
                const l = db.listings.findById(btn.dataset.id);
                if (!l) return;
                if (isSoldListing(l)) return;
                const newStatus = l.status === 'active' ? 'paused' : 'active';
                const updates = { status: newStatus, is_active: newStatus === 'active' };
                await db.listings.update(btn.dataset.id, updates);
                // reflect change in local array
                const idx = allListings.findIndex(x => x.listing_id === btn.dataset.id);
                if (idx > -1) allListings[idx] = { ...allListings[idx], ...updates };
                showToast('Listing ' + (newStatus === 'active' ? 'activated' : 'paused') + '.');
                rerender();
            });
        });
        container.querySelectorAll('.action-delete').forEach(btn => {
            btn.addEventListener('click', async () => {
                const l = db.listings.findById(btn.dataset.id);
                if (!l) return;
                const ok = await showDashboardConfirm({
                    title: 'Delete listing',
                    message: 'Delete "' + (l.title || 'this listing') + '"? This cannot be undone.',
                    confirmLabel: 'Delete',
                });
                if (!ok) return;
                const updates = { status: 'deleted', is_active: false, deleted_at: new Date().toISOString() };
                db.listings.update(btn.dataset.id, updates);
                const idx = allListings.findIndex(x => x.listing_id === btn.dataset.id);
                if (idx > -1) allListings[idx] = { ...allListings[idx], ...updates };
                showToast('Listing deleted.');
                rerender();
            });
        });

        container.querySelectorAll('.action-edit').forEach(btn => {
            btn.addEventListener('click', () => {
                navigate('/post-listing/' + btn.dataset.id);
            });
        });
        container.querySelectorAll('.action-promote').forEach(btn => {
            btn.addEventListener('click', () => {
                navigate('/post-listing/' + btn.dataset.id + '?promote=1');
            });
        });
        container.querySelectorAll('.action-sold').forEach(btn => {
            btn.addEventListener('click', async () => {
                const l = db.listings.findById(btn.dataset.id);
                if (!l) return;
                const ok = await showDashboardConfirm({
                    title: 'Mark as sold',
                    message: 'Mark "' + (l.title || 'this listing') + '" as sold?',
                    confirmLabel: 'Mark Sold',
                    danger: false,
                });
                if (!ok) return;
                try {
                    const result = await api.markSold(btn.dataset.id, true);
                    const updates = { status: 'sold', sold_at: result?.sold_at || new Date().toISOString(), is_active: false };
                    await db.listings.update(btn.dataset.id, updates);
                    const idx = allListings.findIndex(x => x.listing_id === btn.dataset.id);
                    if (idx > -1) allListings[idx] = { ...allListings[idx], ...updates };
                    showToast('Listing marked as sold.');
                    activeFilter = 'sold';
                    rerender();
                } catch (err) {
                    showToast(err.message || 'Could not mark listing sold.', 'error');
                }
            });
        });
    }

    // ── Edit Modal Logic ──
    function openEditModal(l) {
        const overlay = container.querySelector('#edit-listing-overlay');
        const isSale = isSaleListing(l);
        container.querySelector('#el-title').value = l.title || '';
        container.querySelector('#el-price').value = isSale ? (l.price ?? l.rent ?? '') : (l.rent ?? l.price ?? '');
        const priceLabel = container.querySelector('#el-price-label');
        if (priceLabel) priceLabel.textContent = isSale ? 'Price ($) *' : 'Price ($/mo) *';
        container.querySelector('#el-deposit').value = l.deposit || '';
        container.querySelector('#el-room-type').value = l.room_type || 'private_room';
        container.querySelector('#el-available').value = l.available_from || l.move_in_date || '';
        container.querySelector('#el-min-stay').value = l.min_stay || 'flexible';
        container.querySelector('#el-utilities').checked = !!l.utilities_included;
        container.querySelector('#el-description').value = l.description || '';
        overlay.dataset.editId = l.listing_id;
        overlay.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    function closeEditModal() {
        const overlay = container.querySelector('#edit-listing-overlay');
        overlay.style.display = 'none';
        document.body.style.overflow = '';
    }

    const activeCount = allListings.filter(l => l.status === 'active' && l.is_active !== false).length;
    const pausedCount = allListings.filter(l => !isSoldListing(l) && (l.status === 'paused' || l.is_active === false)).length;
    const soldCount = allListings.filter(l => isSoldListing(l)).length;

    container.innerHTML = [
        '<div class="dashboard-header-bar"><h2>My Listings</h2><a href="/post-listing" class="btn btn-primary"><i class="fa-solid fa-plus"></i> Post New</a></div>',
        '<div class="dashboard-tabs">',
        '<button class="db-tab active" data-filter="all">All (' + allListings.length + ')</button>',
        '<button class="db-tab" data-filter="active">Active (' + activeCount + ')</button>',
        '<button class="db-tab" data-filter="paused">Paused (' + pausedCount + ')</button>',
        '<button class="db-tab" data-filter="sold">Sold (' + soldCount + ')</button>',
        '</div>',
        '<div class="listings-table-container">' + buildRows(allListings) + '</div>',

        // ── Edit Modal ──
        '<div id="edit-listing-overlay" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.55);z-index:1000;overflow-y:auto;padding:24px 16px;">',
        '<div id="edit-listing-modal" style="background:#fff;max-width:640px;margin:0 auto;border-radius:20px;overflow:hidden;box-shadow:0 24px 80px rgba(0,0,0,0.2);">',
        '<div style="display:flex;justify-content:space-between;align-items:center;padding:20px 24px;border-bottom:1px solid #e2e8f0;">',
        '<h3 style="margin:0;font-size:1.2rem;font-weight:700;color:#1e293b;">Edit Listing</h3>',
        '<button id="edit-modal-close" style="background:none;border:none;font-size:1.4rem;cursor:pointer;color:#64748b;line-height:1;">&times;</button>',
        '</div>',
        '<div style="padding:24px;display:flex;flex-direction:column;gap:18px;">',
        '<div><label style="display:block;font-weight:600;font-size:0.85rem;color:#475569;margin-bottom:6px;">Title *</label>',
        '<input id="el-title" class="adm-input" style="width:100%;box-sizing:border-box;" placeholder="e.g. Cozy private room in downtown"></div>',
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">',
        '<div><label id="el-price-label" style="display:block;font-weight:600;font-size:0.85rem;color:#475569;margin-bottom:6px;">Price ($/mo) *</label>',
        '<input id="el-price" type="number" class="adm-input" style="width:100%;box-sizing:border-box;" placeholder="e.g. 1200"></div>',
        '<div><label style="display:block;font-weight:600;font-size:0.85rem;color:#475569;margin-bottom:6px;">Deposit ($)</label>',
        '<input id="el-deposit" type="number" class="adm-input" style="width:100%;box-sizing:border-box;" placeholder="e.g. 500"></div>',
        '</div>',
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;">',
        '<div><label style="display:block;font-weight:600;font-size:0.85rem;color:#475569;margin-bottom:6px;">Room Type</label>',
        '<select id="el-room-type" class="adm-input" style="width:100%;box-sizing:border-box;">',
        '<option value="private_room">Private Room</option>',
        '<option value="shared_room">Shared Room</option>',
        '<option value="entire_apartment">Entire Apartment</option>',
        '<option value="studio">Studio</option>',
        '</select></div>',
        '<div><label style="display:block;font-weight:600;font-size:0.85rem;color:#475569;margin-bottom:6px;">Date Available</label>',
        '<input id="el-available" type="date" class="adm-input" style="width:100%;box-sizing:border-box;"></div>',
        '</div>',
        '<div><label style="display:block;font-weight:600;font-size:0.85rem;color:#475569;margin-bottom:6px;">Min. Stay</label>',
        '<select id="el-min-stay" class="adm-input" style="width:100%;box-sizing:border-box;">',
        '<option value="flexible">Flexible</option>',
        '<option value="1_month">1 Month</option>',
        '<option value="3_months">3 Months</option>',
        '<option value="6_months">6 Months</option>',
        '<option value="12_months">12 Months</option>',
        '</select></div>',
        '<div style="display:flex;justify-content:space-between;align-items:center;">',
        '<span style="font-weight:600;font-size:0.9rem;color:#475569;">Utilities Included</span>',
        '<label style="display:inline-flex;align-items:center;cursor:pointer;gap:8px;"><input type="checkbox" id="el-utilities" style="width:18px;height:18px;cursor:pointer;"> <span style="font-size:0.9rem;color:#1e293b;">Yes</span></label>',
        '</div>',
        '<div><label style="display:block;font-weight:600;font-size:0.85rem;color:#475569;margin-bottom:6px;">Description</label>',
        '<textarea id="el-description" class="adm-input" rows="5" style="width:100%;box-sizing:border-box;resize:vertical;" placeholder="Describe the space, rules, and surroundings…"></textarea></div>',
        '</div>',
        '<div style="display:flex;gap:12px;padding:16px 24px;border-top:1px solid #e2e8f0;justify-content:flex-end;">',
        '<button id="edit-modal-cancel" class="btn btn-outline">Cancel</button>',
        '<button id="edit-modal-save" class="btn btn-primary"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>',
        '</div>',
        '</div></div>',
    ].join('');

    container.querySelectorAll('.db-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            activeFilter = tab.dataset.filter;
            rerender();
        });
    });

    bindActions();

    // ── Edit modal listeners (must run after container.innerHTML is set) ──
    container.querySelector('#edit-modal-close').addEventListener('click', closeEditModal);
    container.querySelector('#edit-modal-cancel').addEventListener('click', closeEditModal);
    container.querySelector('#edit-listing-overlay').addEventListener('click', (e) => {
        if (e.target === container.querySelector('#edit-listing-overlay')) closeEditModal();
    });
    container.querySelector('#edit-modal-save').addEventListener('click', () => {
        const overlay = container.querySelector('#edit-listing-overlay');
        const id = overlay.dataset.editId;
        const existingListing = db.listings.findById(id);
        const isSale = isSaleListing(existingListing);
        const title = container.querySelector('#el-title').value.trim();
        const price = Number(container.querySelector('#el-price').value) || 0;
        if (!title) { showToast('Title is required.', 'error'); return; }
        if (!price) { showToast('Price is required.', 'error'); return; }
        const updates = isSale ? {
            title,
            price,
            description: container.querySelector('#el-description').value.trim(),
        } : {
            title,
            rent: price,
            deposit: parseInt(container.querySelector('#el-deposit').value) || 0,
            room_type: container.querySelector('#el-room-type').value,
            available_from: container.querySelector('#el-available').value,
            move_in_date: container.querySelector('#el-available').value,
            min_stay: container.querySelector('#el-min-stay').value,
            utilities_included: container.querySelector('#el-utilities').checked,
            description: container.querySelector('#el-description').value.trim(),
        };
        db.listings.update(id, updates);
        const idx = allListings.findIndex(x => x.listing_id === id);
        if (idx > -1) allListings[idx] = { ...allListings[idx], ...updates };
        closeEditModal();
        showToast('Listing updated successfully.');
        rerender();
    });
}

// ── Messages ──────────────────────────────────────────────────

function renderMessages(container, user, app) {
    const urlParams = new URLSearchParams(window.location.search);
    const requestedThreadId = urlParams.get('threadId');

    let activeTab = (window.location.pathname === '/dashboard/archived-chats' || window.location.pathname === '/archived-chats') ? 'archived' : 'all';
    let activeThreadId = requestedThreadId || null;
    let searchQuery = '';

    // ── Helpers ──
    function parseStructuredMessage(content) {
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

    function renderOfferChip(payload, listing, messageId) {
        const status = String(payload.status || 'pending').toLowerCase();
        const amount = Number(payload.amount || 0);
        const isSeller = listing?.user_id === user.user_id;
        const canRespond = isSeller && status === 'pending';
        const statusColor = status === 'accepted'
            ? 'background:#dcfce7;color:#047857;'
            : status === 'declined'
                ? 'background:#fee2e2;color:#b91c1c;'
                : 'background:#fff7ed;color:#9a3412;';

        return [
            '<div class="msg-offer-chip" data-mid="' + escapeHtml(messageId || '') + '" data-offer-id="' + escapeHtml(payload.offer_id || '') + '" style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px;box-shadow:0 4px 12px rgba(15,23,42,.06);min-width:240px;max-width:320px;">',
            '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;margin-bottom:8px;">',
            '<strong style="color:#0f172a;font-size:.95rem;"><i class="fa-solid fa-hand-holding-dollar"></i> Offer</strong>',
            '<span style="' + statusColor + 'border-radius:999px;padding:4px 9px;font-size:.72rem;font-weight:900;text-transform:capitalize;">' + escapeHtml(status) + '</span>',
            '</div>',
            '<div style="font-size:1.35rem;font-weight:900;color:#0f172a;margin-bottom:4px;">$' + amount.toLocaleString() + '</div>',
            '<div style="font-size:.82rem;color:#64748b;line-height:1.4;">' + escapeHtml(payload.listing_title || listing?.title || 'Marketplace listing') + '</div>',
            canRespond ? '<div style="display:flex;gap:8px;margin-top:12px;"><button class="msg-offer-action" data-status="accepted" style="flex:1;border:none;background:#0f172a;color:#fff;border-radius:10px;padding:8px 10px;font-weight:900;cursor:pointer;">Accept</button><button class="msg-offer-action" data-status="declined" style="flex:1;border:1px solid #fecaca;background:#fff;color:#b91c1c;border-radius:10px;padding:8px 10px;font-weight:900;cursor:pointer;">Decline</button></div>' : '',
            '</div>'
        ].join('');
    }

    function renderSystemChip(payload) {
        if (payload.event !== 'offer_status') return '';
        const status = String(payload.status || '').toLowerCase();
        return '<div class="msg-bubble" style="background:#f1f5f9;color:#475569;">Offer ' + escapeHtml(status) + '</div>';
    }

    function maybeShowMarketplaceChatSafety(listing) {
        if (!listing || (listing.kind || 'rental') === 'rental') return;
        const key = 'rg_marketplace_chat_safety_seen_' + user.user_id;
        if (localStorage.getItem(key) === '1' || document.getElementById('mp-chat-safety-modal')) return;
        localStorage.setItem(key, '1');

        const overlay = document.createElement('div');
        overlay.id = 'mp-chat-safety-modal';
        overlay.style.cssText = 'position:fixed;inset:0;z-index:10000;background:rgba(15,23,42,.58);display:flex;align-items:center;justify-content:center;padding:24px;';
        overlay.innerHTML = [
            '<div role="dialog" aria-modal="true" aria-label="Marketplace safety tips" style="width:min(460px,100%);background:#fff;border-radius:18px;padding:24px;box-shadow:0 24px 80px rgba(15,23,42,.28);">',
            '<div style="width:48px;height:48px;border-radius:14px;background:#111827;color:#fff;display:flex;align-items:center;justify-content:center;margin-bottom:14px;"><i class="fa-solid fa-shield-halved"></i></div>',
            '<h3 style="margin:0 0 8px;color:#0f172a;font-size:1.3rem;font-weight:900;">Safety tips before you chat</h3>',
            '<p style="margin:0 0 16px;color:#64748b;line-height:1.6;">Keep your contact details private and use RoommateGroups chat for all marketplace coordination.</p>',
            '<ul style="margin:0 0 20px;padding:0;list-style:none;display:grid;gap:10px;color:#334155;font-weight:700;">',
            '<li><i class="fa-solid fa-check-circle" style="color:#16a34a;margin-right:8px;"></i> Do not share phone numbers or personal payment details.</li>',
            '<li><i class="fa-solid fa-check-circle" style="color:#16a34a;margin-right:8px;"></i> Meet in a public, well-lit location.</li>',
            '<li><i class="fa-solid fa-check-circle" style="color:#16a34a;margin-right:8px;"></i> Inspect the item before paying.</li>',
            '</ul>',
            '<div style="display:flex;gap:10px;flex-wrap:wrap;">',
            '<button id="mp-chat-safety-ok" class="btn btn-primary" style="flex:1;">I understand</button>',
            '<button id="mp-chat-safety-guide" class="btn btn-outline" style="flex:1;">Safe meetup guide</button>',
            '</div>',
            '</div>'
        ].join('');
        document.body.appendChild(overlay);
        overlay.querySelector('#mp-chat-safety-ok')?.addEventListener('click', () => overlay.remove());
        overlay.querySelector('#mp-chat-safety-guide')?.addEventListener('click', () => {
            overlay.remove();
            navigate('/safety#safe-meetup');
        });
    }

    function getFilteredThreads() {
        const all = db.threads.find(t => {
            const parts = typeof t.participants === 'string' ? JSON.parse(t.participants || '[]') : (t.participants || []);
            return parts.includes(user.user_id);
        }).map(t => ({
            ...t,
            participants: typeof t.participants === 'string' ? JSON.parse(t.participants || '[]') : (t.participants || [])
        }));
        return all
            .filter(t => {
                if (activeTab === 'unread') return getUnreadCountForThread(t.thread_id, user.user_id) > 0 && !t.is_archived;
                if (activeTab === 'archived') return t.is_archived;
                return !t.is_archived;
            })
            .filter(t => {
                if (!searchQuery) return true;
                const q = searchQuery.toLowerCase();
                const ou = db.users.findById(t.participants.find(id => id !== user.user_id));
                const li = db.listings.findById(t.listing_id);
                return (ou && ou.display_name.toLowerCase().includes(q)) || (li && li.title.toLowerCase().includes(q));
            })
            .sort((a, b) => new Date(b.last_message_at) - new Date(a.last_message_at));
    }

    // ── Thread List Re-render ──

    function refreshThreadList() {
        const listEl = container.querySelector('#msg-thread-list');
        if (!listEl) return;
        const threads = getFilteredThreads();
        if (threads.length === 0) {
            listEl.innerHTML = '<div class="msg-empty-threads"><i class="fa-solid fa-inbox"></i><p>' + (searchQuery ? 'No matching conversations.' : 'No conversations yet.') + '</p></div>';
            return;
        }
        listEl.innerHTML = threads.map(t => {
            const ouId = t.participants.find(id => id !== user.user_id);
            const ou = db.users.findById(ouId) || { display_name: 'User', profile_photo: '', verification_level: 'basic' };
            const li = db.listings.findById(t.listing_id);
            const unread = getUnreadCountForThread(t.thread_id, user.user_id);
            const isActive = t.thread_id === activeThreadId;
            const src = getAvatarUrl(ou.profile_photo, ou.display_name);
            return [
                '<div class="msg-thread-card ' + (isActive ? 'active' : '') + ' ' + (unread > 0 ? 'has-unread' : '') + '" data-tid="' + t.thread_id + '">',
                '<div class="msg-tc-avatar-wrap">',
                '<a href="/profile/' + ouId + '" class="msg-tc-avatar-link" onclick="event.preventDefault(); event.stopPropagation(); window.navigate(\'/profile/' + ouId + '\')"><img src="' + src + '" class="msg-tc-avatar" alt="' + escapeHtml(ou.display_name) + ' Avatar" loading="lazy"></a>',
                getVerificationBadge(ou.verification_level),
                '</div>',
                '<div class="msg-tc-body">',
                '<div class="msg-tc-top"><a href="/profile/' + ouId + '" class="msg-tc-name-link" onclick="event.preventDefault(); event.stopPropagation(); window.navigate(\'/profile/' + ouId + '\')">' + escapeHtml(ou.display_name) + '</a><span class="msg-tc-time">' + formatRelativeTime(t.last_message_at) + '</span></div>',
                li ? '<div class="msg-tc-listing"><a href="/listing/' + li.listing_id + '" onclick="event.preventDefault(); event.stopPropagation(); window.navigate(\'/listing/' + li.listing_id + '\')" style="color:inherit;text-decoration:none;"><i class="fa-solid fa-house-chimney"></i> ' + escapeHtml(li.title) + '</a></div>' : '',
                '<div class="msg-tc-preview ' + (unread > 0 ? 'font-semibold' : '') + '">' + escapeHtml(t.last_message_preview || 'New conversation') + '</div>',
                '</div>',
                unread > 0 ? '<div class="msg-unread-badge">' + unread + '</div>' : '',
                '</div>'
            ].join('');
        }).join('');
        listEl.querySelectorAll('.msg-thread-card').forEach(card => {
            card.addEventListener('click', () => {
                activeThreadId = card.dataset.tid;
                renderConversation();
                refreshThreadList();
            });
        });
    }

    // ── Conversation Panel Re-render ──

    function renderConversation() {
        const panel = container.querySelector('#msg-conv-panel');
        if (!panel) return;

        if (!activeThreadId) {
            panel.innerHTML = '<div class="msg-empty-convo"><i class="fa-solid fa-comments"></i><h3>Select a conversation</h3><p>Choose a thread from the left to start chatting.</p></div>';
            return;
        }

        const threadRaw = db.threads.findById(activeThreadId);
        if (!threadRaw) return;
        const thread = {
            ...threadRaw,
            participants: typeof threadRaw.participants === 'string' ? JSON.parse(threadRaw.participants || '[]') : (threadRaw.participants || [])
        };

        const ouId = thread.participants.find(id => id !== user.user_id);
        const ou = db.users.findById(ouId) || { display_name: 'User', profile_photo: '', verification_level: 'basic' };
        const li = db.listings.findById(thread.listing_id);
        const listingPriceLabel = li ? formatListingPrice(li) : 'Price TBC';
        const src = getAvatarUrl(ou.profile_photo, ou.display_name);

        // Mark unread messages as read
        db.messages.find(m => m.thread_id === activeThreadId && m.sender_id !== user.user_id && !m.is_read).forEach(m => {
            db.messages.update(m.message_id, { is_read: true, read_at: new Date().toISOString() });
        });
        
        // Update sidebar badges immediately
        updateSidebarBadges(app, user.user_id);

        const msgs = db.messages.find(m => m.thread_id === activeThreadId).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

        const bubbles = msgs.map(m => {
            const isMe = m.sender_id === user.user_id;
            const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const receipt = isMe ? '<span class="msg-receipt ' + (m.is_read ? 'read' : '') + '"><i class="fa-solid fa-check-double"></i></span>' : '';
            const messagePhoto = m.photo_url ? getAssetUrl(m.photo_url) : '';
            const photo = messagePhoto ? '<div class="msg-photo-wrap"><img src="' + messagePhoto + '" class="msg-photo-thumb" alt="Message Attachment" loading="lazy" onclick="var lb=document.getElementById(\'msg-lb\');lb.style.display=\'flex\';document.getElementById(\'msg-lb-img\').src=\'' + messagePhoto + '\'"></div>' : '';
            const payload = parseStructuredMessage(m.content);
            const text = payload?.kind === 'offer'
                ? renderOfferChip(payload, li, m.message_id)
                : payload?.kind === 'system'
                    ? renderSystemChip(payload)
                    : (m.content ? '<div class="msg-bubble">' + escapeHtml(m.content) + '</div>' : '');
            return [
                '<div class="msg-bubble-row ' + (isMe ? 'msg-out' : 'msg-in') + '" data-mid="' + m.message_id + '">',
                !isMe ? '<a href="/profile/' + ouId + '" class="msg-bubble-avatar-link" onclick="event.preventDefault(); window.navigate(\'/profile/' + ouId + '\')"><img src="' + src + '" class="msg-bubble-avatar" alt="Sender Avatar" loading="lazy"></a>' : '',
                '<div class="msg-bubble-group">',
                photo,
                text,
                '<div class="msg-bubble-meta"><span class="msg-time">' + time + '</span>' + receipt + '</div>',
                '</div>',
                '</div>'
            ].join('');
        }).join('');

        const header = [
            '<div class="msg-chat-header">',
            '<div class="msg-header-left">',
            '<a href="/profile/' + ouId + '" class="msg-hdr-avatar-link" onclick="event.preventDefault(); window.navigate(\'/profile/' + ouId + '\')"><img src="' + src + '" class="msg-hdr-avatar" alt="' + escapeHtml(ou.display_name) + ' Avatar" loading="lazy"></a>',
            '<div class="msg-header-info">',
            '<div class="msg-header-name"><a href="/profile/' + ouId + '" class="msg-hdr-name-link" onclick="event.preventDefault(); window.navigate(\'/profile/' + ouId + '\')">' + escapeHtml(ou.display_name) + '</a> ' + getVerificationBadge(ou.verification_level) + '</div>',
            li ? '<a href="/listing/' + li.listing_id + '" class="msg-header-listing" onclick="event.preventDefault(); window.navigate(\'/listing/' + li.listing_id + '\')"><i class="fa-solid fa-house-chimney"></i> ' + escapeHtml(li.title) + ' &middot; ' + listingPriceLabel + '</a>' : '',
            '</div>',
            '</div>',
            '<div class="msg-header-right">',
            '<div class="msg-three-dot-menu" style="position:relative">',
            '<button class="btn-icon" id="msg-menu-toggle" title="More options"><i class="fa-solid fa-ellipsis-vertical"></i></button>',
            '<div class="msg-dropdown" id="msg-dropdown" style="display:none">',
            '<a href="/profile/' + ouId + '" class="msg-dd-item" id="msg-view-profile-btn" onclick="event.preventDefault(); window.navigate(\'/profile/' + ouId + '\')"><i class="fa-solid fa-user"></i> View Profile</a>',
            li ? '<a href="/listing/' + li.listing_id + '" class="msg-dd-item" id="msg-view-listing-btn" onclick="event.preventDefault(); window.navigate(\'/listing/' + li.listing_id + '\')"><i class="fa-solid fa-house-chimney"></i> View Listing</a>' : '',
            '<div class="msg-dd-item" id="msg-archive-btn"><i class="fa-solid fa-box-archive"></i> ' + (thread.is_archived ? 'Unarchive' : 'Archive') + '</div>',
            '<div class="msg-dd-divider"></div>',
            '<div class="msg-dd-item text-danger" id="msg-delete-convo-btn"><i class="fa-solid fa-trash-can"></i> Delete Conversation</div>',
            '<div class="msg-dd-item text-danger" id="msg-block-btn"><i class="fa-solid fa-ban"></i> Block User</div>',
            '<div class="msg-dd-item text-danger" id="msg-report-btn"><i class="fa-solid fa-flag"></i> Report</div>',
            '</div>',
            '</div>',
            '</div>',
            '</div>'
        ].join('');

        const quickReplies = [
            '<div class="msg-qr-bar">',
            '<span class="qr-label"><i class="fa-solid fa-bolt"></i></span>',
            '<div class="qr-chips">',
            ['Is this still available?', 'When can I schedule a visit?', 'What is the lease duration?', 'Are utilities included?', 'Is it pet-friendly?'].map(r =>
                '<span class="qr-chip" data-text="' + escapeHtml(r) + '">' + escapeHtml(r) + '</span>'
            ).join(''),
            '</div>',
            '</div>'
        ].join('');

        const inputBar = [
            '<div class="msg-input-bar">',
            '<label class="msg-attach-btn" title="Attach photo"><i class="fa-solid fa-image"></i><input type="file" id="msg-file-input" accept="image/*" style="display:none"></label>',
            '<textarea id="msg-text-input" class="msg-textarea" placeholder="Type a message..." rows="1"></textarea>',
            '<button class="msg-send-btn" id="msg-send-btn" title="Send"><i class="fa-solid fa-paper-plane"></i></button>',
            '</div>'
        ].join('');

        const lightbox = '<div class="msg-lightbox" id="msg-lb" style="display:none" onclick="if(event.target===this)this.style.display=\'none\'"><button class="lightbox-close" onclick="document.getElementById(\'msg-lb\').style.display=\'none\'"><i class="fa-solid fa-xmark"></i></button><img id="msg-lb-img" src="" alt="Full size" loading="lazy"></div>';

        panel.innerHTML = [
            header,
            '<div class="msg-payment-warning" id="msg-pay-warn" style="display:none">',
            '<i class="fa-solid fa-triangle-exclamation"></i>',
            '<span><strong>Safety tip:</strong> Be cautious of requests to pay outside this platform.</span>',
            '<button onclick="this.parentElement.style.display=\'none\'"><i class="fa-solid fa-xmark"></i></button>',
            '</div>',
            '<div class="msg-chat-history" id="msg-history">',
            msgs.length === 0 ? '<div class="msg-empty-thread-tip"><i class="fa-solid fa-handshake-angle"></i> Start the conversation!</div>' : '',
            bubbles,
            '</div>',
            quickReplies,
            inputBar,
            lightbox
        ].join('');

        scrollToBottom();
        bindConvEvents(thread, ou, ouId);
        maybeShowMarketplaceChatSafety(li);
    }

    function scrollToBottom() {
        const h = container.querySelector('#msg-history');
        if (h) h.scrollTop = h.scrollHeight;
    }

    function appendBubble(content, time, messageId) {
        const h = container.querySelector('#msg-history');
        if (!h) return;
        const div = document.createElement('div');
        div.className = 'msg-bubble-row msg-out';
        if (messageId) div.dataset.mid = messageId;
        div.innerHTML = [
            '<div class="msg-bubble-group">',
            '<div class="msg-bubble">' + escapeHtml(content) + '</div>',
            '<div class="msg-bubble-meta"><span class="msg-time">' + time + '</span><span class="msg-receipt"><i class="fa-solid fa-check-double"></i></span></div>',
            '</div>'
        ].join('');
        h.appendChild(div);
        scrollToBottom();
    }

    // ── Event Binding ──

    function bindConvEvents(thread, ou, ouId) {
        const panel = container.querySelector('#msg-conv-panel');
        const textInput = panel.querySelector('#msg-text-input');
        const sendBtn = panel.querySelector('#msg-send-btn');
        const fileInput = panel.querySelector('#msg-file-input');
        const menuToggle = panel.querySelector('#msg-menu-toggle');
        const dropdown = panel.querySelector('#msg-dropdown');

        // Three-dot menu
        menuToggle?.addEventListener('click', e => {
            e.stopPropagation();
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });
        document.addEventListener('click', () => { if (dropdown) dropdown.style.display = 'none'; }, { once: true });

        panel.querySelector('#msg-view-profile-btn')?.addEventListener('click', () => {
            dropdown.style.display = 'none';
        });

        panel.querySelector('#msg-archive-btn')?.addEventListener('click', () => {
            const t = db.threads.findById(activeThreadId);
            db.threads.update(activeThreadId, { is_archived: !t.is_archived });
            if (!t.is_archived) activeThreadId = null;
            dropdown.style.display = 'none';
            renderConversation();
            refreshThreadList();
        });

        panel.querySelector('#msg-delete-convo-btn')?.addEventListener('click', async () => {
            const ok = await showDashboardConfirm({
                title: 'Delete conversation',
                message: 'Delete this entire conversation? This cannot be undone.',
                confirmLabel: 'Delete',
            });
            if (!ok) { dropdown.style.display = 'none'; return; }
            db.messages.find(x => x.thread_id === activeThreadId).forEach(m => db.messages.delete(m.message_id));
            db.threads.delete(activeThreadId);
            activeThreadId = null;
            dropdown.style.display = 'none';
            showToast('Conversation deleted.');
            renderConversation();
            refreshThreadList();
        });

        panel.querySelector('#msg-block-btn')?.addEventListener('click', () => {
            if (confirm('Block ' + ou.display_name + '? They cannot message you.')) {
                db.threads.update(activeThreadId, { blocked_by: user.user_id });
                const blocked = parseArray(user.blocked_users);
                if (!blocked.includes(ouId)) {
                    blocked.push(ouId);
                    db.users.update(user.user_id, { blocked_users: blocked });
                    user.blocked_users = blocked;
                }
                showToast('User blocked successfully.');
            }
            dropdown.style.display = 'none';
        });

        panel.querySelector('#msg-report-btn')?.addEventListener('click', () => {
            const reason = prompt('Describe the reason for this report:');
            if (reason) {
                db.reports.create({ thread_id: activeThreadId, reporter_id: user.user_id, reason, status: 'pending' });
                showToast('Report submitted. Thank you.');
            }
            dropdown.style.display = 'none';
        });

        panel.querySelectorAll('.msg-offer-action').forEach(btn => {
            btn.addEventListener('click', async () => {
                const chip = btn.closest('.msg-offer-chip');
                const offerId = chip?.dataset.offerId;
                const messageId = chip?.dataset.mid;
                const status = btn.dataset.status;
                if (!offerId || !status) return;

                btn.disabled = true;
                try {
                    await api.respondOffer(offerId, status);
                    const msg = messageId ? db.messages.findById(messageId) : null;
                    const payload = parseStructuredMessage(msg?.content);
                    if (msg && payload?.kind === 'offer') {
                        payload.status = status;
                        await db.messages.update(messageId, { content: JSON.stringify(payload) }).catch(() => {});
                    }
                    showToast('Offer ' + status + '.');
                    renderConversation();
                    refreshThreadList();
                } catch (err) {
                    showToast(err.message || 'Could not update offer.', 'error');
                    btn.disabled = false;
                }
            });
        });

        // Quick replies
        panel.querySelectorAll('.qr-chip').forEach(chip => {
            chip.addEventListener('click', () => {
                if (textInput) {
                    textInput.value = chip.dataset.text;
                    textInput.focus();
                    doSend();
                }
            });
        });

        // Auto-grow textarea
        textInput?.addEventListener('input', () => {
            textInput.style.height = 'auto';
            textInput.style.height = Math.min(textInput.scrollHeight, 120) + 'px';
        });

        // Send on Enter
        textInput?.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); doSend(); } });
        sendBtn?.addEventListener('click', doSend);

        async function doSend() {
            const content = textInput?.value.trim();
            if (!content) return;

            // Rate limit
            const rltKey = 'rg_rl_' + user.user_id;
            const now = Date.now();
            let rl = JSON.parse(localStorage.getItem(rltKey) || '{"count":0,"ws":0}');
            if (now - rl.ws > 3600000) rl = { count: 0, ws: now };
            if (rl.count >= 50) { showToast('Rate limit: max 50 messages per hour.', 'error'); return; }
            rl.count++;
            localStorage.setItem(rltKey, JSON.stringify(rl));

            // Payment link check
            if (/venmo\.com|paypal\.com|cashapp\.com|cash\.app|zelle/i.test(content)) {
                const warn = panel.querySelector('#msg-pay-warn');
                if (warn) warn.style.display = 'flex';
            }

            sendBtn.disabled = true;
            const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            appendBubble(content, time, '');
            textInput.value = '';
            textInput.style.height = 'auto';

            try {
                const t = db.threads.findById(activeThreadId);
                await db.messages.create({ thread_id: activeThreadId, sender_id: user.user_id, content, photo_url: null, is_read: false, read_at: null });
                await db.threads.update(activeThreadId, {
                    last_message_at: new Date().toISOString(),
                    last_message_preview: content.substring(0, 80),
                    ['unread_count_' + ouId]: (t['unread_count_' + ouId] || 0) + 1,
                });
                refreshThreadList();
            } catch (err) {
                showToast('Message failed to send. Please try again.', 'error');
                renderConversationHistoryOnly();
            } finally {
                sendBtn.disabled = false;
            }
        }

        // File attachment
        fileInput?.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = async ev => {
                const url = ev.target.result;
                await db.messages.create({ thread_id: activeThreadId, sender_id: user.user_id, content: '', photo_url: url, is_read: false, read_at: null });
                await db.threads.update(activeThreadId, { last_message_at: new Date().toISOString(), last_message_preview: '📷 Photo' });
                renderConversation();
            };
            reader.readAsDataURL(file);
        });
    }

    // ── Initial Render ──

    const initThreads = getFilteredThreads();
    if (!activeThreadId && initThreads.length > 0) {
        activeThreadId = initThreads[0].thread_id;
    } else if (activeThreadId) {
        // If threadId requested, make sure we are on the right tab
        const t = db.threads.findById(activeThreadId);
        if (t && t.is_archived) activeTab = 'archived';
        else if (t && (t['unread_count_' + user.user_id] || 0) > 0) activeTab = 'unread';
    }

    const totalUnread = getTotalUnread(user.user_id);

    container.innerHTML = [
        '<div class="messages-layout">',
        // Left panel
        '<div class="messages-sidebar">',
        '<div class="msg-sidebar-header">',
        '<div class="msg-sidebar-title-row"><h2>Messages</h2>' + (totalUnread > 0 ? '<span class="badge badge-primary">' + totalUnread + '</span>' : '') + '</div>',
        '<div class="msg-search-wrap"><i class="fa-solid fa-magnifying-glass msg-search-icon"></i><input type="text" id="msg-search" class="msg-search-input" placeholder="Search conversations..."></div>',
        '<div class="msg-tabs">',
        '<button class="msg-tab ' + (activeTab === 'all' ? 'active' : '') + '" data-tab="all">All</button>',
        '<button class="msg-tab ' + (activeTab === 'unread' ? 'active' : '') + '" data-tab="unread">Unread</button>',
        '<button class="msg-tab ' + (activeTab === 'archived' ? 'active' : '') + '" data-tab="archived">Archived</button>',
        '</div>',
        '</div>',
        '<div class="msg-thread-list" id="msg-thread-list"></div>',
        '</div>',
        // Right panel
        '<div class="messages-main" id="msg-conv-panel"></div>',
        '</div>'
    ].join('');

    refreshThreadList();
    renderConversation();

    container.querySelector('#msg-search')?.addEventListener('input', e => {
        searchQuery = e.target.value;
        refreshThreadList();
    });

    container.querySelectorAll('.msg-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            activeTab = tab.dataset.tab;
            container.querySelectorAll('.msg-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === activeTab));
            refreshThreadList();
        });
    });

    // Polling for real-time messages
    if (_msgPollingTimer) clearInterval(_msgPollingTimer);
    _msgPollingTimer = setInterval(async () => {
        const changed = await syncMessagesAndThreads();
        if (changed || true) { // Always refresh counts, but maybe only re-render if changed
            refreshThreadList();
            
            // If we are looking at a conversation, check for new messages
            if (activeThreadId) {
                const msgs = db.messages.find(m => m.thread_id === activeThreadId);
                const historyEl = container.querySelector('#msg-history');
                const currentCount = historyEl ? historyEl.querySelectorAll('.msg-bubble-row').length : 0;
                
                if (msgs.length > currentCount) {
                    // New messages arrived! 
                    // Instead of full renderConversation (which clears input), just refresh history
                    renderConversationHistoryOnly();
                }
            }

            // Update sidebar badge
            updateSidebarBadges(app, user.user_id);
        }
    }, 3000);

    // Helper to refresh only the bubbles, preserving input/header
    function renderConversationHistoryOnly() {
        const historyEl = container.querySelector('#msg-history');
        if (!historyEl) return;

        const msgs = db.messages.find(m => m.thread_id === activeThreadId).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
        
        const bubbles = msgs.map(m => {
            const isMe = m.sender_id === user.user_id;
            const time = new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const receipt = isMe ? '<span class="msg-receipt ' + (m.is_read ? 'read' : '') + '"><i class="fa-solid fa-check-double"></i></span>' : '';
            const messagePhoto = m.photo_url ? getAssetUrl(m.photo_url) : '';
            const photo = messagePhoto ? '<div class="msg-photo-wrap"><img src="' + messagePhoto + '" class="msg-photo-thumb" alt="Message Attachment" loading="lazy" onclick="var lb=document.getElementById(\'msg-lb\');lb.style.display=\'flex\';document.getElementById(\'msg-lb-img\').src=\'' + messagePhoto + '\'"></div>' : '';
            const text = m.content ? '<div class="msg-bubble">' + escapeHtml(m.content) + '</div>' : '';
            
            // Mark as read while we are at it
            if (!isMe && !m.is_read) {
                db.messages.update(m.message_id, { is_read: true, read_at: new Date().toISOString() });
            }

            return [
                '<div class="msg-bubble-row ' + (isMe ? 'msg-out' : 'msg-in') + '" data-mid="' + m.message_id + '">',
                !isMe ? '<img src="' + getAvatarUrl(db.users.findById(m.sender_id)?.profile_photo, 'User') + '" class="msg-bubble-avatar" alt="Sender Avatar" loading="lazy">' : '',
                '<div class="msg-bubble-group">',
                photo,
                text,
                '<div class="msg-bubble-meta"><span class="msg-time">' + time + '</span>' + receipt + '</div>',
                '</div>',
                '</div>'
            ].join('');
        }).join('');

        historyEl.innerHTML = bubbles;
        scrollToBottom();
        updateSidebarBadges(app, user.user_id);
    }
}

// ── Saved ─────────────────────────────────────────────────────

async function renderSaved(container, user) {
    container.innerHTML = '<div class="dashboard-header-bar"><h2>Saved Listings</h2></div><div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><h3>Loading saved listings...</h3></div>';
    const freshUser = await refreshDashboardUser(user);
    const savedIds = parseArray(freshUser.saved_listings);
    const savedListings = savedIds.map(id => db.listings.findById(id)).filter(Boolean);

    const FALLBACK = 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=600&h=400&fit=crop';

    const cards = savedListings.map(l => {
        const city = db.cities.findById(l.city);
        const _imgs = l.images || l.photos || [];
        const parsedImgs = typeof _imgs === 'string' ? JSON.parse(_imgs || '[]') : _imgs;
        const rawPhoto0 = parsedImgs && parsedImgs[0];
        const rawSavedPhoto = !rawPhoto0 ? FALLBACK : (typeof rawPhoto0 === 'string' ? rawPhoto0 : (rawPhoto0.medium || rawPhoto0.thumb || rawPhoto0.full || FALLBACK));
        const photo = getAssetUrl(rawSavedPhoto);
        return [
            '<div class="saved-card">',
            '<div class="saved-card-img" style="background-image:url(\'' + photo + '\')">',
            '<button class="save-btn active" data-id="' + l.listing_id + '" title="Remove from saved"><i class="fa-solid fa-heart"></i></button>',
            '</div>',
            '<div class="saved-card-body">',
            '<div class="saved-card-price">' + formatListingPrice(l) + '</div>',
            '<div class="saved-card-title">' + escapeHtml(l.title) + '</div>',
            '<div class="saved-card-location"><i class="fa-solid fa-location-dot"></i> ' + escapeHtml(city ? city.name : 'Unknown location') + '</div>',
            '<div class="saved-card-actions">',
            '<a href="/listing/' + l.listing_id + '" class="btn btn-primary btn-sm" style="flex:1;text-align:center;">View Listing</a>',
            '<button class="btn btn-outline btn-sm save-btn" data-id="' + l.listing_id + '" title="Remove"><i class="fa-solid fa-heart" style="color:#1a1a1a;"></i></button>',
            '</div>',
            '</div>',
            '</div>'
        ].join('');
    }).join('');

    container.innerHTML = [
        '<div class="dashboard-header-bar"><h2>Saved Listings</h2><span style="font-size:0.9rem;color:var(--text-muted);font-weight:500;">' + savedListings.length + ' saved</span></div>',
        savedListings.length === 0
            ? '<div class="empty-state"><i class="fa-regular fa-heart"></i><h3>No saved listings</h3><p>Click the heart icon on any listing to save it here.</p><a href="/search/rooms" class="btn btn-primary">Browse Listings</a></div>'
            : '<div class="saved-grid">' + cards + '</div>'
    ].join('');

    container.querySelectorAll('.save-btn').forEach(btn => btn.addEventListener('click', async e => {
        const saveBtn = e.target.closest('.save-btn');
        if (!saveBtn || !saveBtn.dataset.id) return;
        e.preventDefault();
        e.stopPropagation();
        const listingId = saveBtn.dataset.id;
        const saved = parseArray((await refreshDashboardUser(freshUser)).saved_listings);
        const idx = saved.indexOf(listingId);
        if (idx > -1) {
            saved.splice(idx, 1);
            await db.users.update(freshUser.user_id, { saved_listings: saved });
            await api.updateUser(freshUser.user_id, { saved_listings: saved }, true).catch(() => {});
            showToast('Removed from saved listings.');
            const updatedUser = await refreshDashboardUser(freshUser);
            renderSaved(container, updatedUser);
        }
    }));
}

// ── Saved Searches ───────────────────────────────────────────

async function renderSavedSearches(container, user) {
    container.innerHTML = '<div class="dashboard-header-bar"><h2>Saved Searches</h2></div><div class="empty-state"><i class="fa-solid fa-spinner fa-spin"></i><h3>Loading saved searches...</h3></div>';
    const freshUser = await refreshDashboardUser(user);
    const searches = parseArray(freshUser.saved_searches).slice();

    function getCityName(cityId) {
        if (!cityId) return 'Any Location';
        // cityId might be 'city_austin', a slug, or a search string
        const byId = db.cities.findById(cityId);
        if (byId) return byId.name;
        const bySlug = db.cities.findOne(c => c.slug === cityId);
        if (bySlug) return bySlug.name;
        // Last resort: prettify the raw value
        return cityId.replace(/^city_/, '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    }

    function formatQuery(str) {
        const params = new URLSearchParams(str);
        const chips = [];
        if (params.get('type')) chips.push(params.get('type').charAt(0).toUpperCase() + params.get('type').slice(1));
        const min = params.get('minPrice'), max = params.get('maxPrice');
        if (min || max) chips.push('$' + (min || '0') + ' – $' + (max || '∞'));
        if (params.get('dur')) chips.push(params.get('dur'));
        if (params.get('furn') === 'yes') chips.push('Furnished');
        const amen = params.get('amenities');
        if (amen) chips.push(amen.split(',').length + ' amenities');
        return chips.length > 0
            ? chips.map(c => '<span class="ss-chip">' + escapeHtml(c) + '</span>').join('')
            : '<span class="ss-chip">All listings</span>';
    }

    function renderCards() {
        if (searches.length === 0) {
            return '<div class="empty-state"><i class="fa-solid fa-bell-slash"></i><h3>No saved searches</h3><p>Run a search and click "Save Search" to get email alerts for new matches.</p><a href="/search/rooms" class="btn btn-primary">Browse Listings</a></div>';
        }
        return searches.map((ss, idx) => [
            '<div class="ss-card" data-idx="' + idx + '">',
            '<div class="ss-info">',
            '<div class="ss-name">' + escapeHtml(ss.name || 'Saved Search') + '</div>',
            '<div class="ss-location"><i class="fa-solid fa-location-dot"></i> ' + escapeHtml(getCityName(ss.city)) + '</div>',
            '<div class="ss-chips">' + formatQuery(ss.queryStr || '') + '</div>',
            '<label class="ss-notify">',
            '<input type="checkbox" class="ss-notify-toggle" data-idx="' + idx + '" ' + (ss.notify ? 'checked' : '') + '>',
            '<span>Email me new matches</span>',
            '</label>',
            '</div>',
            '<div class="ss-actions">',
            '<button class="btn btn-outline btn-sm ss-delete" data-idx="' + idx + '" style="color:#1a1a1a;border-color:#dddddd;"><i class="fa-solid fa-trash"></i></button>',
            '<a href="/search/rooms' + escapeHtml(ss.queryStr || '') + '" class="btn btn-primary btn-sm">Search Now</a>',
            '</div>',
            '</div>'
        ].join('')).join('');
    }

    container.innerHTML = [
        '<div class="dashboard-header-bar"><h2>Saved Searches</h2><span style="font-size:0.9rem;color:var(--text-muted);font-weight:500;">' + searches.length + ' saved</span></div>',
        '<div id="ss-list">' + renderCards() + '</div>',
    ].join('');

    // Notify toggle
    container.addEventListener('change', e => {
        const tog = e.target.closest('.ss-notify-toggle');
        if (!tog) return;
        const idx = parseInt(tog.dataset.idx);
        if (isNaN(idx)) return;
        searches[idx] = { ...searches[idx], notify: tog.checked };
        db.users.update(freshUser.user_id, { saved_searches: searches });
        api.updateUser(freshUser.user_id, { saved_searches: searches }, true).catch(() => {});
        showToast(tog.checked ? 'Email alerts enabled.' : 'Email alerts disabled.');
    });

    // Delete
    container.addEventListener('click', async e => {
        const del = e.target.closest('.ss-delete');
        if (!del) return;
        const idx = parseInt(del.dataset.idx);
        if (isNaN(idx)) return;
        const ok = await showDashboardConfirm({
            title: 'Delete saved search',
            message: 'Delete this saved search?',
            confirmLabel: 'Delete',
        });
        if (!ok) return;
        searches.splice(idx, 1);
        db.users.update(freshUser.user_id, { saved_searches: searches });
        api.updateUser(freshUser.user_id, { saved_searches: searches }, true).catch(() => {});
        showToast('Search deleted.');
        container.querySelector('#ss-list').innerHTML = renderCards();
    });
}

function renderArchivedChats(container, user, app) {
    renderMessages(container, user, app);
}

async function renderProfileDashboard(container, user) {
    const freshUser = await refreshDashboardUser(user);
    let seller = null;
    try { seller = await api.getSeller(freshUser.user_id, true); } catch (_) {}
    const rating = Number(seller?.seller_rating_avg || freshUser.seller_rating_avg || freshUser.rating_avg || 0);
    const ratingCount = Number(seller?.seller_rating_count || freshUser.seller_rating_count || freshUser.rating_count || 0);
    const responseTime = seller?.response_time || freshUser.response_time || freshUser.avg_response_time || 'Usually replies within a day';
    const avatar = getAvatarUrl(freshUser.profile_photo, freshUser.display_name);
    const memberSince = freshUser.created_at ? new Date(freshUser.created_at).toLocaleDateString([], { month: 'long', year: 'numeric' }) : 'Recently';
    const bio = freshUser.bio || freshUser.about || 'No bio added yet.';

    container.innerHTML = [
        '<div class="dashboard-header-bar"><h2>Profile</h2><a href="/profile-setup" class="btn btn-primary"><i class="fa-solid fa-user-pen"></i> Edit Profile</a></div>',
        '<div class="db-panel" style="padding:28px;">',
        '<div style="display:flex;gap:24px;align-items:flex-start;flex-wrap:wrap;">',
        '<img src="' + avatar + '" alt="Profile photo" style="width:112px;height:112px;border-radius:24px;object-fit:cover;border:1px solid var(--border);">',
        '<div style="flex:1;min-width:240px;">',
        '<h3 style="font-size:1.7rem;font-weight:900;margin:0 0 6px;color:var(--text-primary);">' + escapeHtml(freshUser.display_name || 'RoommateGroups member') + ' ' + getVerificationBadge(freshUser.verification_level || freshUser) + '</h3>',
        '<p style="color:var(--text-muted);line-height:1.65;margin:0 0 16px;">' + escapeHtml(bio) + '</p>',
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:18px;">',
        '<span class="badge badge-gray" style="padding:6px 12px;border-radius:999px;"><i class="fa-solid fa-calendar"></i> Member since ' + escapeHtml(memberSince) + '</span>',
        '<span class="badge badge-gray" style="padding:6px 12px;border-radius:999px;"><i class="fa-solid fa-clock"></i> ' + escapeHtml(responseTime) + '</span>',
        '</div>',
        '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:14px;max-width:520px;">',
        '<div class="stat-card" style="padding:16px;"><div style="color:#f59e0b;margin-bottom:6px;">' + renderStars(rating) + '</div><strong style="font-size:1.35rem;">' + (rating ? rating.toFixed(1) : '—') + '</strong><div style="color:var(--text-muted);font-size:.82rem;">Seller rating</div></div>',
        '<div class="stat-card" style="padding:16px;"><strong style="font-size:1.35rem;">' + ratingCount + '</strong><div style="color:var(--text-muted);font-size:.82rem;">Review' + (ratingCount === 1 ? '' : 's') + '</div></div>',
        '</div>',
        '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:22px;">',
        '<a href="/seller/' + freshUser.user_id + '" class="btn btn-outline"><i class="fa-solid fa-store"></i> View public storefront</a>',
        '<a href="/dashboard/settings#profile" class="btn btn-outline"><i class="fa-solid fa-gear"></i> Account settings</a>',
        '</div>',
        '</div></div></div>'
    ].join('');
}

function offerPhoto(offer) {
    return getListingThumb(offer, 'https://images.unsplash.com/photo-1517705008128-361805f42e86?w=600&h=450&fit=crop');
}

function offerStatusBadge(status) {
    const s = String(status || 'pending').toLowerCase();
    const cls = s === 'accepted' ? 'badge-success' : s === 'declined' ? 'badge-danger' : 'badge-warning';
    return '<span class="badge ' + cls + '" style="font-size:.72rem;padding:4px 10px;border-radius:999px;text-transform:capitalize;">' + escapeHtml(s) + '</span>';
}

async function renderOffersDashboard(container, user, app) {
    let activeTab = 'received';
    let offers = await loadDashboardOffers();

    function row(offer, mode) {
        const otherName = mode === 'received' ? offer.buyer_name : offer.seller_name;
        return [
            '<div class="ss-card offer-row" data-offer-id="' + escapeHtml(offer.offer_id) + '">',
            '<div class="td-listing" style="flex:1;">',
            '<div class="td-thumb" style="background-image:url(\'' + offerPhoto(offer) + '\')"></div>',
            '<div class="td-info">',
            '<h4>' + escapeHtml(offer.listing_title || 'Listing') + '</h4>',
            '<p>' + (mode === 'received' ? 'Buyer: ' : 'Seller: ') + escapeHtml(otherName || 'Member') + ' &bull; ' + formatRelativeTime(offer.created_at) + '</p>',
            '</div></div>',
            '<div style="font-size:1.05rem;font-weight:900;color:var(--text-primary);min-width:92px;">$' + Number(offer.amount || 0).toLocaleString() + '</div>',
            '<div style="min-width:105px;">' + offerStatusBadge(offer.status) + '</div>',
            '<div style="display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;">',
            mode === 'received' && String(offer.status || 'pending').toLowerCase() === 'pending'
                ? '<button class="btn btn-primary btn-sm offer-action" data-status="accepted">Accept</button><button class="btn btn-outline btn-sm offer-action" data-status="declined">Decline</button>'
                : '',
            offer.thread_id ? '<button class="btn btn-outline btn-sm offer-chat" data-thread="' + escapeHtml(offer.thread_id) + '"><i class="fa-solid fa-message"></i></button>' : '',
            '</div>',
            '</div>'
        ].join('');
    }

    function draw() {
        const rows = offers[activeTab] || [];
        container.innerHTML = [
            '<div class="dashboard-header-bar"><h2>Offers</h2><a href="/marketplace" class="btn btn-outline"><i class="fa-solid fa-store"></i> Browse Marketplace</a></div>',
            '<div class="dashboard-tabs">',
            '<button class="db-tab ' + (activeTab === 'received' ? 'active' : '') + '" data-tab="received">Received (' + offers.received.length + ')</button>',
            '<button class="db-tab ' + (activeTab === 'sent' ? 'active' : '') + '" data-tab="sent">Sent (' + offers.sent.length + ')</button>',
            '</div>',
            rows.length
                ? '<div style="display:grid;gap:12px;">' + rows.map(o => row(o, activeTab)).join('') + '</div>'
                : '<div class="empty-state"><i class="fa-solid fa-tag"></i><h3>No ' + activeTab + ' offers yet</h3><p>' + (activeTab === 'received' ? 'Offers on your marketplace items will appear here.' : 'Offers you make on marketplace items will appear here.') + '</p></div>'
        ].join('');
        bind();
    }

    function bind() {
        container.querySelectorAll('.db-tab').forEach(btn => btn.addEventListener('click', () => {
            activeTab = btn.dataset.tab;
            draw();
        }));
        container.querySelectorAll('.offer-action').forEach(btn => btn.addEventListener('click', async () => {
            const id = btn.closest('.offer-row')?.dataset.offerId;
            if (!id) return;
            btn.disabled = true;
            try {
                await api.respondOffer(id, btn.dataset.status);
                offers = await loadDashboardOffers();
                hydratePendingOffersBadge(app);
                showToast('Offer ' + btn.dataset.status + '.');
                draw();
            } catch (err) {
                showToast(err.message || 'Could not update offer.', 'error');
                btn.disabled = false;
            }
        }));
        container.querySelectorAll('.offer-chat').forEach(btn => btn.addEventListener('click', () => {
            navigate('/dashboard/messages?threadId=' + encodeURIComponent(btn.dataset.thread));
        }));
    }

    draw();
}

async function renderReviewsDashboard(container, user) {
    let reviews = [];
    try { reviews = await api.getReviews(user.user_id, true) || []; } catch (_) {}
    const rating = reviews.length ? reviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / reviews.length : Number(user.seller_rating_avg || 0);
    const count = reviews.length || Number(user.seller_rating_count || 0);
    container.innerHTML = [
        '<div class="dashboard-header-bar"><h2>Reviews</h2><a href="/seller/' + user.user_id + '" class="btn btn-outline"><i class="fa-solid fa-store"></i> Storefront</a></div>',
        '<div class="db-panel" style="margin-bottom:18px;">',
        '<div style="display:flex;align-items:center;gap:18px;flex-wrap:wrap;">',
        '<div style="font-size:2rem;font-weight:900;color:var(--text-primary);">' + (rating ? rating.toFixed(1) : '—') + '</div>',
        '<div><div style="color:#f59e0b;">' + renderStars(rating) + '</div><div style="color:var(--text-muted);font-size:.86rem;">' + count + ' review' + (count === 1 ? '' : 's') + ' received</div></div>',
        '</div></div>',
        reviews.length
            ? '<div style="display:grid;gap:12px;">' + reviews.map(r => [
                '<div class="ss-card">',
                '<div style="flex:1;">',
                '<div style="display:flex;justify-content:space-between;gap:12px;align-items:center;"><strong>' + escapeHtml(r.reviewer_name || 'Member') + '</strong><span style="color:#f59e0b;">' + renderStars(r.rating) + '</span></div>',
                '<p style="color:var(--text-secondary);line-height:1.55;margin:8px 0;">' + escapeHtml(r.comment || 'No comment provided.') + '</p>',
                '<div style="color:var(--text-muted);font-size:.78rem;">' + (r.created_at ? new Date(r.created_at).toLocaleDateString() : '') + '</div>',
                '</div></div>'
            ].join('')).join('') + '</div>'
            : '<div class="empty-state"><i class="fa-regular fa-star"></i><h3>No reviews yet</h3><p>Reviews from completed marketplace transactions will appear here.</p></div>'
    ].join('');
}

// ── Settings ──────────────────────────────────────────────────

function renderSettings(container, user) {
    const avatarSrc = getAvatarUrl(user.profile_photo, user.display_name);
    const notifPrefs = {
        messages: true,
        matches: true,
        price_drops: true,
        digest: false,
        offers: true,
        offer_updates: true,
        reviews: true,
        saved_search: true,
        ...(user.notification_prefs || {}),
    };
    const privacyVal = user.profile_visibility || 'everyone';
    let stagedProfilePhotoUrl = '';

    container.innerHTML = [
        '<div class="dashboard-header-bar">',
        '<h2>Settings</h2>',
        '<button class="btn btn-primary" id="btn-save-settings"><i class="fa-solid fa-floppy-disk"></i> Save Changes</button>',
        '</div>',
        '<div style="display:flex;gap:10px;flex-wrap:wrap;margin:0 0 18px;">',
        '<a href="/dashboard/verification" class="btn btn-outline btn-sm" style="text-decoration:none;"><i class="fa-solid fa-shield-halved"></i> Verification</a>',
        '<a href="/dashboard/subscription" class="btn btn-outline btn-sm" style="text-decoration:none;"><i class="fa-solid fa-crown"></i> Subscription</a>',
        '</div>',
        '<div class="settings-grid">',

        // ── Merged Profile panel ──
        (() => {
            const cpTags = [
                { id: 'clean', label: 'Clean', icon: 'fa-broom' },
                { id: 'social', label: 'Social', icon: 'fa-users' },
                { id: 'quiet', label: 'Quiet', icon: 'fa-volume-xmark' },
                { id: 'early-bird', label: 'Early Bird', icon: 'fa-sun' },
                { id: 'night-owl', label: 'Night Owl', icon: 'fa-moon' },
                { id: 'pet-friendly', label: 'Pet-Friendly', icon: 'fa-paw' },
                { id: 'non-smoker', label: 'Non-Smoker', icon: 'fa-ban-smoking' },
                { id: 'fitness', label: 'Fitness Enthusiast', icon: 'fa-dumbbell' },
                { id: 'remote-worker', label: 'Remote Worker', icon: 'fa-laptop-house' },
                { id: 'student', label: 'Student', icon: 'fa-graduation-cap' },
            ];
            const savedTags = user.lifestyle_tags || [];
            const ageOpts = ['18-24','25-30','31-35','36-40','41+']
                .map(r => `<option value="${r}"${user.age_range === r ? ' selected' : ''}>${r}</option>`).join('');
            const timelineOpts = [
                ['asap','As soon as possible'],['1-month','Within 1 month'],
                ['1-3-months','1–3 months'],['3-6-months','3–6 months'],['flexible','Flexible'],
            ].map(([v, l]) => `<option value="${v}"${user.moveInTimeline === v ? ' selected' : ''}>${l}</option>`).join('');
            const tagPills = cpTags.map(t => {
                const on = savedTags.includes(t.id);
                return `<label class="tag-pill${on ? ' active' : ''}"><input type="checkbox" value="${t.id}"${on ? ' checked' : ''}><i class="fas ${t.icon}"></i> ${t.label}</label>`;
            }).join('');
            const countryOpts = db.countries.findAll()
                .filter(c => c.is_active)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(c => `<option value="${c.country_id}"${user.country === c.country_id ? ' selected' : ''}>${c.flag_emoji ? c.flag_emoji + ' ' : ''}${c.name}</option>`)
                .join('');
            return `
            <div class="db-panel" style="grid-column:1 / -1;">
              <h3 class="panel-title"><i class="fa-solid fa-user-circle"></i> Public Profile</h3>
              <p style="color:var(--text-secondary);font-size:0.875rem;margin:0 0 24px;">This information is shown on your public profile to potential roommates.</p>

              <div class="settings-avatar-row">
                <div style="position:relative;flex-shrink:0;">
                  <img id="settings-avatar-img" src="${avatarSrc}" alt="Settings User Avatar" class="settings-avatar" loading="lazy">
                  <span id="settings-avatar-spinner" style="display:none;position:absolute;inset:0;border-radius:50%;background:rgba(255,255,255,0.72);align-items:center;justify-content:center;color:var(--text-primary);"><i class="fa-solid fa-spinner fa-spin"></i></span>
                </div>
                <div style="flex:1;">
                  <div class="settings-avatar-name">${escapeHtml(user.display_name)}</div>
                  <div class="settings-avatar-email">${escapeHtml(user.email || '')}</div>
                  <label class="btn btn-outline btn-sm" for="settings-photo-input" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-camera"></i> Change Photo<input type="file" id="settings-photo-input" accept="image/*" style="display:none;"></label>
                </div>
              </div>

              <div class="form-row-2col">
                <div class="form-group">
                  <label>Display Name</label>
                  <input type="text" class="form-control" id="settings-name" value="${escapeHtml(user.display_name)}" placeholder="Your display name">
                </div>
                <div class="form-group">
                  <label>Email Address</label>
                  <input type="email" class="form-control" value="${escapeHtml(user.email || '')}" disabled>
                  <div class="form-control-hint">Contact support to change your email address.</div>
                </div>
              </div>

              <div class="form-group">
                <label>Bio</label>
                <textarea class="form-control" id="settings-bio" rows="4" placeholder="Tell potential roommates a bit about yourself...">${escapeHtml(user.bio || '')}</textarea>
              </div>

              <div class="form-row-2col">
                <div class="form-group">
                  <label>Country</label>
                  <div class="input-wrapper">
                    <i class="fas fa-globe"></i>
                    <select class="form-control" id="settings-country">
                      <option value="">Select your country</option>
                      ${countryOpts}
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <label>City</label>
                  <div class="input-wrapper">
                    <i class="fas fa-location-dot"></i>
                    <select class="form-control" id="settings-city" ${user.country ? '' : 'disabled'}>
                      <option value="">Select a country first</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="form-row-2col">
                <div class="form-group">
                  <label>Age Range</label>
                  <div class="input-wrapper">
                    <i class="fas fa-cake-candles"></i>
                    <select class="form-control" id="settings-age-range">
                      <option value="">Select age range</option>
                      ${ageOpts}
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <label>Occupation</label>
                  <div class="input-wrapper">
                    <i class="fas fa-briefcase"></i>
                    <input type="text" class="form-control" id="settings-occupation" placeholder="e.g. Software Engineer" value="${escapeHtml(user.occupation || '')}">
                  </div>
                </div>
              </div>

              <div class="form-group">
                <div style="margin:6px 0 14px;padding-top:6px;border-top:1px solid var(--border);">
                  <h4 style="margin:0 0 4px;font-size:0.95rem;color:var(--text-primary);">Roommate Preferences</h4>
                  <p style="margin:0;color:var(--text-secondary);font-size:0.82rem;">These help match you with compatible roommates and rooms.</p>
                </div>
                <label>Lifestyle Tags</label>
                <p style="font-size:0.8rem;color:var(--text-secondary);margin:2px 0 10px;">Select all that apply</p>
                <div class="lifestyle-tags" id="settings-lifestyle-tags">${tagPills}</div>
              </div>

              <div class="form-group">
                <label>Monthly Budget</label>
                <div class="budget-display">
                  <span id="settings-bmin-disp">$${(user.budgetMin || 500).toLocaleString()}</span>
                  <span class="budget-separator">—</span>
                  <span id="settings-bmax-disp">$${(user.budgetMax || 2500).toLocaleString()}</span>
                </div>
                <div class="range-slider-container">
                  <input type="range" id="settings-bmin" class="range-slider" min="0" max="5000" step="100" value="${user.budgetMin || 500}">
                  <input type="range" id="settings-bmax" class="range-slider" min="0" max="5000" step="100" value="${user.budgetMax || 2500}">
                  <div class="range-track"><div class="range-fill" id="settings-range-fill"></div></div>
                </div>
                <div class="range-labels"><span>$0</span><span>$5,000</span></div>
              </div>

              <div class="form-group">
                <label>Move-in Timeline</label>
                <div class="input-wrapper">
                  <i class="fas fa-calendar-days"></i>
                  <select class="form-control" id="settings-timeline">
                    <option value="">When are you looking to move?</option>
                    ${timelineOpts}
                  </select>
                </div>
              </div>
            </div>`;
        })(),

        // ── Seller & Marketplace panel ──
        (() => {
            const countryOpts = db.countries.findAll()
                .filter(c => c.is_active)
                .sort((a, b) => a.name.localeCompare(b.name))
                .map(c => `<option value="${c.country_id}"${user.seller_default_country === c.country_id ? ' selected' : ''}>${c.flag_emoji ? c.flag_emoji + ' ' : ''}${c.name}</option>`)
                .join('');
            return `
            <div class="db-panel" style="grid-column:1 / -1;">
              <h3 class="panel-title"><i class="fa-solid fa-store"></i> Seller &amp; Marketplace</h3>
              <p style="color:var(--text-secondary);font-size:0.875rem;margin:0 0 20px;">Defaults and public seller details for items you list on RoommateGroups.</p>

              <div class="form-row-2col">
                <div class="form-group">
                  <label>Default Item Country</label>
                  <div class="input-wrapper">
                    <i class="fas fa-globe"></i>
                    <select class="form-control" id="seller-country">
                      <option value="">Select country</option>
                      ${countryOpts}
                    </select>
                  </div>
                </div>
                <div class="form-group">
                  <label>Default Item City</label>
                  <div class="input-wrapper">
                    <i class="fas fa-location-dot"></i>
                    <select class="form-control" id="seller-city" ${user.seller_default_country ? '' : 'disabled'}>
                      <option value="">Select a country first</option>
                    </select>
                  </div>
                </div>
              </div>

              <div class="form-group">
                <label>Payment Preferences Note</label>
                <input type="text" class="form-control" id="seller-payment-note" value="${escapeHtml(user.seller_payment_note || '')}" placeholder="Cash / UPI / Bank transfer">
                <div class="form-control-hint">Shown to buyers as guidance. Payments and contact still route through in-app chat.</div>
              </div>

              <div class="toggle-row">
                <div><div class="toggle-row-label">Show my phone number on listings</div><div class="toggle-row-sub">Default is off. In-app chat remains the recommended contact path.</div></div>
                <label class="toggle-switch"><input type="checkbox" id="seller-show-phone"${user.show_phone ? ' checked' : ''}><span class="slider"></span></label>
              </div>
              <div class="form-group" id="seller-phone-wrap" style="display:${user.show_phone ? '' : 'none'};margin-top:12px;">
                <label>Phone Number</label>
                <input type="tel" class="form-control" id="seller-phone" value="${escapeHtml(user.phone || '')}" placeholder="Contact number">
              </div>

              <div class="toggle-row" style="margin-top:12px;">
                <div><div class="toggle-row-label">Dealer / Business Account</div><div class="toggle-row-sub">Use this if you sell as a shop, dealer, or business.</div></div>
                <label class="toggle-switch"><input type="checkbox" id="seller-is-dealer"${user.is_dealer ? ' checked' : ''}><span class="slider"></span></label>
              </div>
              <div id="seller-business-wrap" style="display:${user.is_dealer ? '' : 'none'};margin-top:12px;">
                <div class="form-group">
                  <label>Business Name</label>
                  <input type="text" class="form-control" id="seller-business-name" value="${escapeHtml(user.business_name || '')}" placeholder="Business or storefront name">
                </div>
                <p style="font-size:0.82rem;color:var(--text-secondary);margin:0;">Dealer features and a verified storefront may require the <a href="/dashboard/subscription">Pro plan</a>.</p>
              </div>

              <div style="margin-top:18px;">
                <a class="btn btn-outline btn-sm" href="/seller/${encodeURIComponent(user.user_id)}" style="text-decoration:none;"><i class="fa-solid fa-arrow-up-right-from-square"></i> View my public storefront</a>
              </div>
            </div>`;
        })(),

        // ── Notifications panel ──
        '<div class="db-panel">',
        '<h3 class="panel-title"><i class="fa-solid fa-bell"></i> Notifications</h3>',
        '<div class="toggle-row"><div><div class="toggle-row-label">New Messages</div><div class="toggle-row-sub">When someone messages you</div></div><label class="toggle-switch"><input type="checkbox" id="notif-messages"' + (notifPrefs.messages !== false ? ' checked' : '') + '><span class="slider"></span></label></div>',
        '<div class="toggle-row"><div><div class="toggle-row-label">Listing Matches</div><div class="toggle-row-sub">New matches for saved searches</div></div><label class="toggle-switch"><input type="checkbox" id="notif-matches"' + (notifPrefs.matches !== false ? ' checked' : '') + '><span class="slider"></span></label></div>',
        '<div class="toggle-row"><div><div class="toggle-row-label">Price Drops</div><div class="toggle-row-sub">On your saved listings</div></div><label class="toggle-switch"><input type="checkbox" id="notif-price"' + (notifPrefs.price_drops !== false ? ' checked' : '') + '><span class="slider"></span></label></div>',
        '<div class="toggle-row"><div><div class="toggle-row-label">Weekly Digest</div><div class="toggle-row-sub">Summary of activity &amp; new listings</div></div><label class="toggle-switch"><input type="checkbox" id="notif-digest"' + (notifPrefs.digest ? ' checked' : '') + '><span class="slider"></span></label></div>',
        '<div class="toggle-row"><div><div class="toggle-row-label">New Offers</div><div class="toggle-row-sub">When someone offers on your item</div></div><label class="toggle-switch"><input type="checkbox" id="notif-offers"' + (notifPrefs.offers !== false ? ' checked' : '') + '><span class="slider"></span></label></div>',
        '<div class="toggle-row"><div><div class="toggle-row-label">Offer Updates</div><div class="toggle-row-sub">When an offer is accepted or declined</div></div><label class="toggle-switch"><input type="checkbox" id="notif-offer-updates"' + (notifPrefs.offer_updates !== false ? ' checked' : '') + '><span class="slider"></span></label></div>',
        '<div class="toggle-row"><div><div class="toggle-row-label">New Reviews</div><div class="toggle-row-sub">When you receive a seller review</div></div><label class="toggle-switch"><input type="checkbox" id="notif-reviews"' + (notifPrefs.reviews !== false ? ' checked' : '') + '><span class="slider"></span></label></div>',
        '<div class="toggle-row"><div><div class="toggle-row-label">Saved Search Matches</div><div class="toggle-row-sub">New local items matching your saved searches</div></div><label class="toggle-switch"><input type="checkbox" id="notif-saved-search"' + (notifPrefs.saved_search !== false ? ' checked' : '') + '><span class="slider"></span></label></div>',
        '<h3 class="panel-title" style="margin-top:22px;"><i class="fa-solid fa-eye"></i> Privacy</h3>',
        '<div class="form-group"><label>Profile Visibility</label>',
        '<select class="form-control" id="settings-visibility">',
        '<option value="everyone"' + (privacyVal === 'everyone' ? ' selected' : '') + '>Everyone</option>',
        '<option value="verified"' + (privacyVal === 'verified' ? ' selected' : '') + '>Verified Members Only</option>',
        '<option value="hidden"'  + (privacyVal === 'hidden'   ? ' selected' : '') + '>Hide My Profile</option>',
        '</select></div>',
        '</div>',

        // ── Security panel ──
        '<div class="db-panel">',
        '<h3 class="panel-title"><i class="fa-solid fa-lock"></i> Security</h3>',
        '<div class="form-group"><label>Current Password</label><input type="password" class="form-control" id="settings-current-password" autocomplete="current-password"></div>',
        '<div class="form-group"><label>New Password</label><input type="password" class="form-control" id="settings-new-password" autocomplete="new-password" minlength="8"><div class="form-control-hint">Use at least 8 characters.</div></div>',
        '<button class="btn btn-outline btn-sm" id="btn-change-password"><i class="fa-solid fa-key"></i> Change Password</button>',
        '<h3 class="panel-title" style="margin-top:22px;"><i class="fa-solid fa-ban"></i> Blocked Users</h3>',
        '<p style="color:var(--text-secondary);font-size:0.875rem;margin:0 0 12px;">Manage people you have blocked from conversations.</p>',
        '<a href="/dashboard/blocked-users" class="btn btn-outline btn-sm" style="display:inline-flex;text-decoration:none;"><i class="fa-solid fa-list"></i> View Blocked Users</a>',
        '</div>',

        // ── Danger zone ──
        '<div class="db-panel danger-zone-panel" style="grid-column:1 / -1;">',
        '<h3 class="panel-title"><i class="fa-solid fa-triangle-exclamation"></i> Danger Zone</h3>',
        '<p style="color:var(--text-secondary);margin-bottom:16px;font-size:0.9rem;">Permanently delete your account and all associated data. This cannot be undone.</p>',
        '<button class="btn btn-sm" id="btn-delete-account" style="border:1px solid #1a1a1a;color:#1a1a1a;background:white;"><i class="fa-solid fa-trash"></i> Delete My Account</button>',
        '</div>',
        '</div>',
    ].join('');

    // Save changes
    container.querySelector('#btn-save-settings').addEventListener('click', async () => {
        const btn = container.querySelector('#btn-save-settings');
        const newName = container.querySelector('#settings-name').value.trim();
        const newBio  = container.querySelector('#settings-bio').value.trim();
        if (!newName) { showToast('Display name cannot be empty.', 'error'); return; }

        const selectedTags = Array.from(
            container.querySelectorAll('#settings-lifestyle-tags .tag-pill input:checked')
        ).map(cb => cb.value);

        const updates = {
            display_name: newName,
            bio: newBio,
            profile_visibility: container.querySelector('#settings-visibility').value,
            notification_prefs: {
                messages:    container.querySelector('#notif-messages').checked,
                matches:     container.querySelector('#notif-matches').checked,
                price_drops: container.querySelector('#notif-price').checked,
                digest:      container.querySelector('#notif-digest').checked,
                offers:      container.querySelector('#notif-offers').checked,
                offer_updates: container.querySelector('#notif-offer-updates').checked,
                reviews:     container.querySelector('#notif-reviews').checked,
                saved_search: container.querySelector('#notif-saved-search').checked,
            },
            country:         container.querySelector('#settings-country').value,
            city:            container.querySelector('#settings-city').value,
            seller_default_country: container.querySelector('#seller-country')?.value || '',
            seller_default_city: container.querySelector('#seller-city')?.value || '',
            seller_payment_note: container.querySelector('#seller-payment-note')?.value.trim() || '',
            show_phone: container.querySelector('#seller-show-phone')?.checked || false,
            phone: container.querySelector('#seller-phone')?.value.trim() || '',
            is_dealer: container.querySelector('#seller-is-dealer')?.checked || false,
            business_name: container.querySelector('#seller-business-name')?.value.trim() || '',
            age_range:       container.querySelector('#settings-age-range').value,
            occupation:      container.querySelector('#settings-occupation').value.trim(),
            lifestyle_tags:  selectedTags,
            budgetMin:       parseInt(container.querySelector('#settings-bmin').value) || 0,
            budgetMax:       parseInt(container.querySelector('#settings-bmax').value) || 5000,
            moveInTimeline:  container.querySelector('#settings-timeline').value,
            profileComplete: Boolean(newName),
        };

        const avatarImg = container.querySelector('#settings-avatar-img');
        if (stagedProfilePhotoUrl || avatarImg.dataset.newSrc) updates.profile_photo = stagedProfilePhotoUrl || avatarImg.dataset.newSrc;

        await db.users.update(user.user_id, updates);
        Object.assign(user, updates);
        stagedProfilePhotoUrl = '';
        delete avatarImg.dataset.newSrc;

        btn.innerHTML = '<i class="fa-solid fa-check"></i> Saved!';
        btn.style.background = '#333333';
        setTimeout(() => { btn.innerHTML = '<i class="fa-solid fa-floppy-disk"></i> Save Changes'; btn.style.background = ''; }, 2400);
        showToast('Settings saved successfully.');
    });

    container.querySelector('#btn-change-password')?.addEventListener('click', async () => {
        const btn = container.querySelector('#btn-change-password');
        const current = container.querySelector('#settings-current-password').value;
        const next = container.querySelector('#settings-new-password').value;
        if (!next || next.length < 8) { showToast('New password must be at least 8 characters.', 'error'); return; }
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Updating...';
        const res = await changePassword(user.user_id, current, next);
        if (!res.success) {
            showToast(res.error || 'Could not update password.', 'error');
            btn.disabled = false;
            btn.innerHTML = '<i class="fa-solid fa-key"></i> Change Password';
            return;
        }
        container.querySelector('#settings-current-password').value = '';
        container.querySelector('#settings-new-password').value = '';
        btn.disabled = false;
        btn.innerHTML = '<i class="fa-solid fa-key"></i> Change Password';
        showToast('Password updated successfully.', 'success');
    });

    // Complete Profile — budget sliders
    const bMin = container.querySelector('#settings-bmin');
    const bMax = container.querySelector('#settings-bmax');
    const bMinDisp = container.querySelector('#settings-bmin-disp');
    const bMaxDisp = container.querySelector('#settings-bmax-disp');
    const bFill = container.querySelector('#settings-range-fill');
    function syncBudget() {
        let lo = parseInt(bMin.value), hi = parseInt(bMax.value);
        if (lo > hi) { bMin.value = hi; bMax.value = lo; [lo, hi] = [hi, lo]; }
        bMinDisp.textContent = '$' + lo.toLocaleString();
        bMaxDisp.textContent = '$' + hi.toLocaleString();
        bFill.style.left  = (lo / 5000 * 100) + '%';
        bFill.style.width = ((hi - lo) / 5000 * 100) + '%';
    }
    bMin.addEventListener('input', syncBudget);
    bMax.addEventListener('input', syncBudget);
    syncBudget();

    // Country / City cascade
    const settingsCountry = container.querySelector('#settings-country');
    const settingsCity = container.querySelector('#settings-city');

    function populateSettingsCities(countryId, selectedCityId = '') {
        settingsCity.innerHTML = '<option value="">Loading cities...</option>';
        settingsCity.disabled = true;
        const cities = db.cities.find(c => c.country === countryId && c.is_active !== false)
            .sort((a, b) => a.name.localeCompare(b.name));
        if (cities.length === 0) {
            settingsCity.innerHTML = '<option value="">No cities available</option>';
        } else {
            settingsCity.innerHTML = '<option value="">Select your city</option>';
            cities.forEach(city => {
                const opt = document.createElement('option');
                opt.value = city.city_id;
                opt.textContent = city.name;
                if (city.city_id === selectedCityId) opt.selected = true;
                settingsCity.appendChild(opt);
            });
            settingsCity.disabled = false;
        }
    }

    // Pre-populate cities if user already has a country
    if (user.country) {
        populateSettingsCities(user.country, user.city || '');
    }

    settingsCountry.addEventListener('change', () => {
        const countryId = settingsCountry.value;
        if (countryId) {
            populateSettingsCities(countryId);
        } else {
            settingsCity.innerHTML = '<option value="">Select a country first</option>';
            settingsCity.disabled = true;
        }
    });

    const sellerCountry = container.querySelector('#seller-country');
    const sellerCity = container.querySelector('#seller-city');
    function populateSellerCities(countryId, selectedCityId = '') {
        if (!sellerCity) return;
        sellerCity.innerHTML = '<option value="">Loading cities...</option>';
        sellerCity.disabled = true;
        const cities = db.cities.find(c => c.country === countryId && c.is_active !== false)
            .sort((a, b) => a.name.localeCompare(b.name));
        if (!cities.length) {
            sellerCity.innerHTML = '<option value="">No cities available</option>';
            return;
        }
        sellerCity.innerHTML = '<option value="">Select default city</option>';
        cities.forEach(city => {
            const opt = document.createElement('option');
            opt.value = city.city_id;
            opt.textContent = city.name;
            if (city.city_id === selectedCityId) opt.selected = true;
            sellerCity.appendChild(opt);
        });
        sellerCity.disabled = false;
    }
    if (sellerCountry?.value) populateSellerCities(sellerCountry.value, user.seller_default_city || '');
    sellerCountry?.addEventListener('change', () => {
        if (sellerCountry.value) {
            populateSellerCities(sellerCountry.value);
        } else if (sellerCity) {
            sellerCity.innerHTML = '<option value="">Select a country first</option>';
            sellerCity.disabled = true;
        }
    });

    const showPhoneToggle = container.querySelector('#seller-show-phone');
    const dealerToggle = container.querySelector('#seller-is-dealer');
    showPhoneToggle?.addEventListener('change', () => {
        const wrap = container.querySelector('#seller-phone-wrap');
        if (wrap) wrap.style.display = showPhoneToggle.checked ? '' : 'none';
    });
    dealerToggle?.addEventListener('change', () => {
        const wrap = container.querySelector('#seller-business-wrap');
        if (wrap) wrap.style.display = dealerToggle.checked ? '' : 'none';
    });

    // Profile — lifestyle tag pills
    container.querySelectorAll('#settings-lifestyle-tags .tag-pill').forEach(pill => {
        pill.querySelector('input').addEventListener('change', e => {
            pill.classList.toggle('active', e.target.checked);
        });
    });

    // Photo file picker — uploads to R2 and stages the URL until Save Changes.
    container.querySelector('#settings-photo-input').addEventListener('change', async e => {
        const file = e.target.files[0];
        if (!file) return;
        const allowed = ['image/jpeg', 'image/png', 'image/webp'];
        if (!allowed.includes(file.type)) { showToast('Profile photo must be JPG, PNG, or WebP.', 'error'); return; }
        if (file.size > 5 * 1024 * 1024) { showToast('Profile photo must be smaller than 5MB.', 'error'); return; }

        const img = container.querySelector('#settings-avatar-img');
        const spinner = container.querySelector('#settings-avatar-spinner');
        const previousSrc = img.src;
        const previewUrl = URL.createObjectURL(file);
        img.src = previewUrl;
        if (spinner) spinner.style.display = 'flex';
        try {
            const uploadedUrl = await uploadImage(file, 'profile.webp');
            stagedProfilePhotoUrl = uploadedUrl;
            img.dataset.newSrc = uploadedUrl;
            showToast('Photo ready. Click Save Changes to apply.', 'info');
        } catch (err) {
            img.src = previousSrc;
            stagedProfilePhotoUrl = '';
            delete img.dataset.newSrc;
            showToast(err.message || 'Profile photo upload failed.', 'error');
        } finally {
            if (spinner) spinner.style.display = 'none';
            URL.revokeObjectURL(previewUrl);
            e.target.value = '';
        }
    });

    // Delete account
    container.querySelector('#btn-delete-account').addEventListener('click', async () => {
        const firstOk = await showDashboardConfirm({
            title: 'Delete account',
            message: 'This will permanently delete your account and associated data.',
            confirmLabel: 'Continue',
        });
        if (!firstOk) return;
        const finalOk = await showDashboardConfirm({
            title: 'Final confirmation',
            message: 'Last warning. This is irreversible. Continue deleting your account?',
            confirmLabel: 'Delete Account',
        });
        if (!finalOk) return;
        try {
            await api.deleteUser(user.user_id);
            logout();
            showToast('Account deleted. Redirecting…');
            setTimeout(() => { navigate('/'); }, 800);
        } catch (err) {
            showToast(err.message || 'Could not delete account.', 'error');
        }
    });
}

// ── Notifications ─────────────────────────────────────────────

function renderNotifications(container, user) {
    function getNotifs() {
        return db.notifications.find(n => n.user_id === user.user_id)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    function render() {
        const notifs = getNotifs();
        const unreadCount = notifs.filter(n => !n.is_read).length;

        const cards = notifs.length === 0
            ? '<div style="text-align:center;padding:60px 20px;color:var(--text-secondary);"><i class="fa-solid fa-bell-slash" style="font-size:2.5rem;margin-bottom:16px;display:block;opacity:0.4;"></i><p style="font-size:0.95rem;">No notifications yet</p></div>'
            : notifs.map(n => {
                const time = new Date(n.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                return `
                <div class="notif-card${n.is_read ? '' : ' notif-card-unread'}" data-nid="${n.notification_id}" style="display:flex;gap:14px;align-items:flex-start;padding:16px;border-radius:12px;border:1px solid var(--border);background:${n.is_read ? 'var(--surface)' : '#f0f4ff'};margin-bottom:10px;cursor:pointer;transition:box-shadow 0.15s;">
                  ${n.image_url ? `<img src="${getAssetUrl(n.image_url)}" alt="Notification Attachment" style="width:64px;height:64px;border-radius:8px;object-fit:cover;flex-shrink:0;" loading="lazy">` : `<div style="width:42px;height:42px;border-radius:10px;background:var(--primary);display:flex;align-items:center;justify-content:center;flex-shrink:0;"><i class="fa-solid fa-bell" style="color:#fff;font-size:1rem;"></i></div>`}
                  <div style="flex:1;min-width:0;">
                    <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;">
                      <span style="font-weight:700;font-size:0.9rem;">${escapeHtml(n.title)}</span>
                      ${!n.is_read ? '<span style="width:8px;height:8px;border-radius:50%;background:var(--primary);display:inline-block;flex-shrink:0;"></span>' : ''}
                    </div>
                    <p style="margin:4px 0 6px;font-size:0.85rem;color:var(--text-secondary);line-height:1.5;">${escapeHtml(n.description || n.body || '')}</p>
                    <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
                      <span style="font-size:0.75rem;color:var(--text-secondary);">${time}</span>
                      ${(n.website_url || n.link) ? `<a href="${escapeHtml(n.website_url || n.link)}" target="_blank" rel="noopener" style="font-size:0.78rem;color:var(--primary);font-weight:600;display:inline-flex;align-items:center;gap:4px;" onclick="event.stopPropagation()"><i class="fa-solid fa-arrow-up-right-from-square" style="font-size:0.65rem;"></i> Learn more</a>` : ''}
                    </div>
                  </div>
                  <button class="notif-delete-btn" data-nid="${n.notification_id}" title="Delete" style="background:none;border:none;cursor:pointer;color:var(--text-secondary);padding:4px;flex-shrink:0;" onclick="event.stopPropagation()"><i class="fa-solid fa-xmark"></i></button>
                </div>`;
            }).join('');

        container.innerHTML = `
            <div class="dashboard-header-bar">
                <h2>Notifications</h2>
                ${unreadCount > 0 ? `<button class="btn btn-outline btn-sm" id="notif-mark-all-read"><i class="fa-solid fa-check-double"></i> Mark all as read</button>` : ''}
            </div>
            <div style="max-width:680px;">${cards}</div>`;

        container.querySelector('#notif-mark-all-read')?.addEventListener('click', () => {
            getNotifs().filter(n => !n.is_read).forEach(n => db.notifications.update(n.notification_id, { is_read: true }));
            render();
        });

        container.querySelectorAll('.notif-card').forEach(card => {
            card.addEventListener('click', () => {
                const nid = card.dataset.nid;
                db.notifications.update(nid, { is_read: true });
                const notif = db.notifications.findById(nid);
                const url = notif?.website_url || notif?.link;
                if (url) window.open(url, '_blank', 'noopener');
                else render();
            });
        });

        container.querySelectorAll('.notif-delete-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                db.notifications.delete(btn.dataset.nid);
                render();
            });
        });
    }

    render();
}

// ── Blocked Users ─────────────────────────────────────────────

function renderBlockedUsers(container, user) {
    function getBlockedIds() {
        const direct = parseArray(user.blocked_users);
        const fromThreads = db.threads.find(t => t.blocked_by === user.user_id).map(t => {
            const parts = typeof t.participants === 'string' ? JSON.parse(t.participants || '[]') : (t.participants || []);
            return parts.find(id => id !== user.user_id);
        }).filter(Boolean);
        return Array.from(new Set([...direct, ...fromThreads]));
    }

    function render() {
        const blockedIds = getBlockedIds();
        const blockedUsers = blockedIds.map(id => db.users.findById(id)).filter(Boolean);

        container.innerHTML = `
            <div class="dashboard-header-bar">
                <h2>Blocked Users</h2>
                <a href="/dashboard/settings" class="btn btn-outline btn-sm" style="text-decoration:none;"><i class="fa-solid fa-arrow-left"></i> Back to Settings</a>
            </div>
            <div class="db-panel" style="max-width:760px;">
                ${blockedUsers.length === 0 ? `
                    <div style="text-align:center;padding:56px 20px;color:var(--text-secondary);">
                        <i class="fa-solid fa-ban" style="font-size:2.25rem;margin-bottom:16px;display:block;opacity:0.35;"></i>
                        <h3 style="margin:0 0 8px;color:var(--text-primary);">No blocked users</h3>
                        <p style="margin:0;">People you block from chat will appear here.</p>
                    </div>
                ` : blockedUsers.map(u => {
                    const avatar = getAvatarUrl(u.profile_photo, u.display_name || 'User');
                    return `
                        <div class="blocked-user-row" style="display:flex;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--border);">
                            <img src="${escapeHtml(avatar)}" alt="${escapeHtml(u.display_name || 'User')} avatar" loading="lazy" style="width:48px;height:48px;border-radius:50%;object-fit:cover;">
                            <div style="flex:1;min-width:0;">
                                <div style="font-weight:800;color:var(--text-primary);">${escapeHtml(u.display_name || 'User')}</div>
                                <div style="font-size:0.84rem;color:var(--text-secondary);">${escapeHtml(u.email || '')}</div>
                            </div>
                            <button class="btn btn-outline btn-sm unblock-user-btn" data-uid="${escapeHtml(u.user_id)}"><i class="fa-solid fa-lock-open"></i> Unblock</button>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        container.querySelectorAll('.unblock-user-btn').forEach(btn => {
            btn.addEventListener('click', async () => {
                const uid = btn.dataset.uid;
                const nextBlocked = getBlockedIds().filter(id => id !== uid);
                await db.users.update(user.user_id, { blocked_users: nextBlocked });
                db.threads.find(t => {
                    const parts = typeof t.participants === 'string' ? JSON.parse(t.participants || '[]') : (t.participants || []);
                    return t.blocked_by === user.user_id && parts.includes(uid);
                }).forEach(t => db.threads.update(t.thread_id, { blocked_by: null }));
                user.blocked_users = nextBlocked;
                showToast('User unblocked.', 'success');
                render();
            });
        });
    }

    render();
}

// ── Subscription ─────────────────────────────────────────────

function renderSubscription(container, user) {
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === 'true') {
        showToast('🎉 Subscription activated! Thank you for upgrading.');
        window.history.replaceState({}, '', '/dashboard/subscription');
    }

    const tier = user.subscription_tier || 'free';
    const PORTAL_URL = 'https://billing.stripe.com/p/login/14kdTJ1l3ghc4cEdQQ';

    const PLANS = {
        free: { 
            name: 'Free', 
            price: '$0', 
            period: 'forever', 
            color: '#64748b', 
            icon: 'fa-seedling', 
            features: [
                '1 active listing', 
                '5 messages per day', 
                'Basic search & filters', 
                'Standard listing visibility', 
                'Standard support (48hr)'
            ] 
        },
        premium: { 
            name: 'Premium', 
            price: '$4.99', 
            period: '/month', 
            color: '#6366f1', 
            icon: 'fa-star', 
            features: [
                '3 active listings', 
                'Unlimited messages', 
                '2x boosted visibility', 
                'Verified badge', 
                'Basic compatibility score', 
                'Priority support (24hr)'
            ] 
        },
        pro: { 
            name: 'Pro', 
            price: '$8.99', 
            period: '/month', 
            color: '#1a1a1a', 
            icon: 'fa-bolt', 
            features: [
                '5 active listings', 
                'Unlimited messages', 
                '5x top ranking placement', 
                'Gold verified badge', 
                'Full analytics dashboard', 
                '24-hour early access', 
                'VIP support (4hr)'
            ] 
        },
    };

    const plan = PLANS[tier] || PLANS.free;
    const isPaid = tier !== 'free';

    const renewDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    container.innerHTML = `
        <div class="dashboard-header-bar">
            <h2>Subscription</h2>
            ${isPaid
                ? `<button class="btn btn-outline" id="btn-manage-sub">
                        <i class="fas fa-external-link-alt"></i> Manage Subscription
                   </button>`
                : `<button class="btn btn-primary" onclick="navigate('/pricing')">
                        <i class="fas fa-star"></i> Upgrade Plan
                   </button>`
            }
        </div>

        <!-- Current Plan Card -->
        <div class="sub-current-card" style="border-left: 4px solid ${plan.color};">
            <div class="sub-plan-left">
                <div class="sub-plan-icon" style="background:${plan.color}15; color:${plan.color};">
                    <i class="fas ${plan.icon}"></i>
                </div>
                <div>
                    <div class="sub-plan-label">Current Plan</div>
                    <div class="sub-plan-name">${plan.name}
                        <span class="sub-current-badge"><i class="fas fa-circle-check"></i> Active</span>
                    </div>
                    <div class="sub-plan-price">${plan.price}<span class="sub-plan-period">${plan.period}</span></div>
                </div>
            </div>
            ${isPaid ? `
            <div class="sub-plan-right">
                <div class="sub-billing-info">
                    <div class="sub-billing-label">Next billing date</div>
                    <div class="sub-billing-date">${renewDate}</div>
                </div>
                <div style="display:flex;flex-direction:column;gap:8px;align-items:flex-end;">
                    <button class="btn btn-outline btn-sm" id="btn-portal-billing">
                        <i class="fas fa-credit-card"></i> Update Payment
                    </button>
                    <button class="btn-text-danger" id="btn-portal-cancel">
                        <i class="fas fa-xmark"></i> Cancel Subscription
                    </button>
                </div>
            </div>` : `
            <div class="sub-plan-right">
                <p style="color:var(--text-secondary);font-size:0.9rem;max-width:260px;">
                    Upgrade to unlock more listings, unlimited messages, and powerful analytics.
                </p>
            </div>`}
        </div>

        <!-- Features -->
        <div class="db-panel" style="margin-top:24px;">
            <h3 class="panel-title">What's included in ${plan.name}</h3>
            <ul class="sub-feature-list">
                ${plan.features.map(f => `
                <li class="sub-feature-item">
                    <i class="fas fa-check sub-check" style="color:${plan.color}"></i>
                    <span>${f}</span>
                </li>`).join('')}
            </ul>
        </div>

        <!-- Upgrade Banner (non-Pro users) -->
        ${tier !== 'pro' ? `
        <div class="sub-upgrade-banner">
            <div class="sub-upgrade-text">
                <h3>${tier === 'free' ? 'Ready to get more?' : 'Want even more power?'}</h3>
                <p>${tier === 'free'
                    ? 'Upgrade to Premium or Pro to unlock unlimited messages, advanced filters, and more.'
                    : 'Upgrade to Pro to unlock 5x ranking, full analytics, and VIP support.'}
                </p>
            </div>
            <button class="btn btn-primary sub-upgrade-btn" onclick="navigate('/pricing')">
                Upgrade Now <i class="fas fa-arrow-right"></i>
            </button>
        </div>` : ''}

        <style>
            .sub-current-card {
                background: white;
                border-radius: 16px;
                border: 1px solid var(--border);
                padding: 28px 32px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 24px;
                flex-wrap: wrap;
                box-shadow: var(--shadow-sm);
                margin-top: 8px;
            }
            .sub-plan-left { display: flex; align-items: center; gap: 20px; }
            .sub-plan-icon {
                width: 56px; height: 56px;
                border-radius: 14px;
                display: flex; align-items: center; justify-content: center;
                font-size: 1.4rem; flex-shrink: 0;
            }
            .sub-plan-label { font-size: 0.78rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: var(--text-secondary); margin-bottom: 4px; }
            .sub-plan-name { font-size: 1.4rem; font-weight: 800; color: var(--text-primary); display: flex; align-items: center; gap: 10px; }
            .sub-current-badge { font-size: 0.72rem; background: #f5f5f5; color: #333333; border: 1px solid #dddddd; padding: 3px 10px; border-radius: 20px; font-weight: 700; }
            .sub-plan-price { font-size: 1.6rem; font-weight: 900; color: var(--text-primary); margin-top: 6px; }
            .sub-plan-period { font-size: 0.85rem; font-weight: 400; color: var(--text-secondary); margin-left: 3px; }
            .sub-plan-right { display: flex; flex-direction: column; align-items: flex-end; gap: 12px; }
            .sub-billing-label { font-size: 0.78rem; color: var(--text-secondary); text-align: right; }
            .sub-billing-date { font-size: 0.95rem; font-weight: 600; color: var(--text-primary); }
            .btn-text-danger { background: none; border: none; color: #ef4444; font-size: 0.85rem; font-weight: 600; cursor: pointer; display: flex; align-items: center; gap: 6px; padding: 0; }
            .btn-text-danger:hover { text-decoration: underline; }
            .sub-feature-list { list-style: none; padding: 0; margin: 16px 0 0; columns: 2; column-gap: 32px; }
            @media (max-width: 600px) { .sub-feature-list { columns: 1; } }
            .sub-feature-item { display: flex; align-items: flex-start; gap: 10px; padding: 6px 0; font-size: 0.9rem; color: var(--text-secondary); break-inside: avoid; }
            .sub-check { flex-shrink: 0; margin-top: 2px; }
            .sub-upgrade-banner {
                background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);
                border-radius: 16px;
                padding: 28px 32px;
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 24px;
                flex-wrap: wrap;
                margin-top: 24px;
                color: white;
            }
            .sub-upgrade-text h3 { font-size: 1.15rem; font-weight: 800; margin-bottom: 6px; }
            .sub-upgrade-text p { font-size: 0.875rem; opacity: 0.8; max-width: 480px; line-height: 1.5; margin: 0; }
            .sub-upgrade-btn {
                background: white !important; color: #1a1a1a !important; border: none;
                padding: 13px 26px; border-radius: 10px; font-weight: 700;
                white-space: nowrap; flex-shrink: 0; cursor: pointer;
                font-size: 0.95rem; transition: all 0.2s;
                display: flex; align-items: center; gap: 8px;
            }
            .sub-upgrade-btn:hover { 
                background: white !important; 
                color: #1a1a1a !important;
                transform: translateY(-2px); 
                box-shadow: 0 6px 20px rgba(0,0,0,0.2); 
            }
        </style>
    `;

    // Button bindings
    const manageBtn = container.querySelector('#btn-manage-sub');
    const portalBilling = container.querySelector('#btn-portal-billing');
    const portalCancel = container.querySelector('#btn-portal-cancel');

    if (manageBtn) {
        manageBtn.addEventListener('click', () => {
            window.open(PORTAL_URL, '_blank');
        });
    }

    if (portalBilling) {
        portalBilling.addEventListener('click', () => {
            window.open(PORTAL_URL, '_blank');
        });
    }

    if (portalCancel) {
        portalCancel.addEventListener('click', () => {
            if (confirm('This will open Stripe to cancel your subscription. Continue?')) {
                window.open(PORTAL_URL, '_blank');
            }
        });
    }
}

// ── Verification ─────────────────────────────────────────────

function renderVerification(container, user) {
    const emailVerified = true;
    const phoneVerified = user.phone_verified || user.verification_level === 'phone' || user.verification_level === 'id' || user.verification_level === 'community';
    const idVerified = user.id_verified || user.id_status === 'approved' || user.verification_level === 'id' || user.verification_level === 'community';
    const idPending = user.id_status === 'pending';
    const idRejected = user.id_status === 'rejected';
    const communityVerified = user.community_verified || user.verification_level === 'community';
    const positiveReviews = Math.min(user.positive_reviews || 0, 5);

    let currentLevel = 1;
    if (emailVerified) currentLevel = 2;
    if (phoneVerified) currentLevel = 3;
    if (idVerified || idPending) currentLevel = 4;
    if (communityVerified) currentLevel = 5;

    const progressPct = Math.min(((currentLevel - 1) / 3) * 100, 100);

    const COUNTRY_CODES = [
        { code: '+1', flag: '🇺🇸', label: 'US' }, { code: '+1', flag: '🇨🇦', label: 'CA' },
        { code: '+44', flag: '🇬🇧', label: 'UK' }, { code: '+91', flag: '🇮🇳', label: 'IN' },
        { code: '+61', flag: '🇦🇺', label: 'AU' }, { code: '+49', flag: '🇩🇪', label: 'DE' },
        { code: '+33', flag: '🇫🇷', label: 'FR' }, { code: '+34', flag: '🇪🇸', label: 'ES' },
        { code: '+39', flag: '🇮🇹', label: 'IT' }, { code: '+7', flag: '🇷🇺', label: 'RU' },
        { code: '+55', flag: '🇧🇷', label: 'BR' }, { code: '+52', flag: '🇲🇽', label: 'MX' },
        { code: '+81', flag: '🇯🇵', label: 'JP' }, { code: '+82', flag: '🇰🇷', label: 'KR' },
        { code: '+86', flag: '🇨🇳', label: 'CN' }, { code: '+971', flag: '🇦🇪', label: 'AE' },
        { code: '+65', flag: '🇸🇬', label: 'SG' }, { code: '+60', flag: '🇲🇾', label: 'MY' },
        { code: '+31', flag: '🇳🇱', label: 'NL' }, { code: '+46', flag: '🇸🇪', label: 'SE' },
    ];

    const steps = [
        { label: 'Email', icon: 'fa-envelope', color: '#333333' },
        { label: 'Phone', icon: 'fa-phone', color: '#1a1a1a' },
        { label: 'ID', icon: 'fa-shield-halved', color: '#1a1a1a' },
        { label: 'Community', icon: 'fa-star', color: '#555555' },
    ];

    const renderProgress = () => `
        <div class="verif-progress-container mb-xl text-center">
            <div class="verif-progress-track">
                <div class="verif-track-line">
                    <div class="verif-track-fill" style="width:${progressPct}%"></div>
                </div>
                ${steps.map((s, i) => {
        const done = currentLevel > i + 1;
        const active = currentLevel === i + 1;
        return `
                    <div class="verif-step ${done ? 'completed' : active ? 'active' : ''}">
                        <div class="verif-step-bubble" style="${done ? `background:${s.color};` : active ? `background:var(--primary);box-shadow:0 0 0 6px rgba(27,79,114,0.15);` : ''}">
                            ${done ? '<i class="fas fa-check"></i>' : `<i class="fas ${s.icon}"></i>`}
                        </div>
                        <div class="verif-step-label" style="${done ? `color:${s.color};` : active ? 'color:var(--text-primary);font-weight:700;' : ''}">${s.label}</div>
                    </div>`;
    }).join('')}
            </div>
        </div>`;

    const levelClass = (done, lvl) => `db-panel verif-panel ${done ? 'verif-completed' : currentLevel === lvl ? 'expanded active-panel' : ''}`;

    // Community radial ring
    const radius = 36, circ = 2 * Math.PI * radius;
    const fill = circ - (positiveReviews / 5) * circ;

    container.innerHTML = `
        <div class="dashboard-header-bar">
            <h2>Trust &amp; Verification</h2>
        </div>
        <p class="text-muted mb-lg">Build trust in the RoommateGroups community by completing your verification levels.</p>

        ${renderProgress()}

        <div class="verification-accordion">

            <!-- Level 1: Email -->
            <div class="${levelClass(emailVerified, 1)}">
                <div class="verif-header" onclick="this.parentElement.classList.toggle('expanded')">
                    <div class="verif-title">
                        <span class="verif-icon-wrap" style="background:#f5f5f5;"><i class="fa-solid fa-envelope" style="color:#333333;"></i></span>
                        <div>
                            <h3>Level 1 — Email Verified</h3>
                            <p>Verify your email address</p>
                        </div>
                    </div>
                    <div class="verif-status">
                        <span class="badge badge-success"><i class="fas fa-check"></i> Completed</span>
                        <i class="fa-solid fa-chevron-down verif-chevron"></i>
                    </div>
                </div>
                <div class="verif-body">
                    <div class="verif-success-msg">
                        <i class="fa-solid fa-circle-check"></i>
                        Your email address has been successfully verified.
                    </div>
                </div>
            </div>

            <!-- Level 2: Phone -->
            <div class="${levelClass(phoneVerified, 2)}">
                <div class="verif-header" onclick="this.parentElement.classList.toggle('expanded')">
                    <div class="verif-title">
                        <span class="verif-icon-wrap" style="background:#f0f0f0;"><i class="fa-solid fa-phone" style="color:#1a1a1a;"></i></span>
                        <div>
                            <h3>Level 2 — Phone Verified</h3>
                            <p>Secure your account with SMS verification</p>
                        </div>
                    </div>
                    <div class="verif-status">
                        ${phoneVerified
            ? '<span class="badge badge-success"><i class="fas fa-check"></i> Completed</span>'
            : currentLevel === 2
                ? '<span class="badge badge-primary">Current Level</span>'
                : '<span class="badge badge-gray">Locked</span>'}
                        <i class="fa-solid fa-chevron-down verif-chevron"></i>
                    </div>
                </div>
                <div class="verif-body">
                    ${phoneVerified
            ? `<div class="verif-success-msg"><i class="fa-solid fa-circle-check"></i> Your phone number is verified.</div>`
            : `<div class="verif-perk mb-md"><i class="fa-solid fa-arrow-trend-up"></i> Your listings will appear higher in search results.</div>
                        <div class="form-group" style="max-width:340px;">
                            <label style="font-weight:600;margin-bottom:6px;display:block;">Phone Number</label>
                            <div style="display:flex;gap:8px;align-items:center;">
                                <select class="form-input" id="phone-country" style="width:120px;padding:10px 8px;">
                                    ${COUNTRY_CODES.map(c => `<option value="${c.code}">${c.flag} ${c.label} ${c.code}</option>`).join('')}
                                </select>
                                <input type="tel" id="phone-number" class="form-input" placeholder="(555) 000-0000" style="flex:1;">
                            </div>
                        </div>
                        <button class="btn btn-primary" id="btn-send-sms">Send Verification Code</button>

                        <div id="sms-otp-block" style="display:none;margin-top:20px;">
                            <label style="font-weight:600;margin-bottom:10px;display:block;">Enter 6-digit code</label>
                            <div class="otp-boxes">
                                ${[0, 1, 2, 3, 4, 5].map(i => `<input class="otp-box" id="otp-${i}" type="text" maxlength="1" inputmode="numeric" autocomplete="off">`).join('')}
                            </div>
                            <div style="display:flex;align-items:center;gap:16px;margin-top:14px;">
                                <button class="btn btn-success" id="btn-verify-sms">Verify Code</button>
                                <span class="text-muted" style="font-size:0.85rem;">Resend in <span id="sms-timer" style="font-weight:700;color:var(--primary);">60</span>s</span>
                                <button class="btn btn-outline" id="btn-resend-sms" style="display:none;font-size:0.85rem;padding:6px 12px;">Resend Code</button>
                            </div>
                        </div>`}
                </div>
            </div>

            <!-- Level 3: ID Verification -->
            <div class="${levelClass(idVerified, 3)}">
                <div class="verif-header" onclick="this.parentElement.classList.toggle('expanded')">
                    <div class="verif-title">
                        <span class="verif-icon-wrap" style="background:#f5f5f5;"><i class="fa-solid fa-shield-halved" style="color:#1a1a1a;"></i></span>
                        <div>
                            <h3>Level 3 — ID Verified</h3>
                            <p>Government ID &amp; live selfie match</p>
                        </div>
                    </div>
                    <div class="verif-status">
                        ${idVerified
            ? '<span class="badge badge-success"><i class="fas fa-check"></i> Completed</span>'
            : idPending
                ? '<span class="badge badge-warning"><i class="fas fa-clock"></i> Pending Review</span>'
                : idRejected
                    ? '<span class="badge badge-danger"><i class="fas fa-times"></i> Rejected</span>'
                    : currentLevel === 3
                        ? '<span class="badge badge-primary">Current Level</span>'
                        : '<span class="badge badge-gray">Locked</span>'}
                        <i class="fa-solid fa-chevron-down verif-chevron"></i>
                    </div>
                </div>
                <div class="verif-body">
                    ${idVerified
            ? `<div class="verif-success-msg"><i class="fa-solid fa-circle-check"></i> Your government ID was verified successfully.</div>`
            : idPending
                ? `<div class="verif-alert verif-alert-warning">
                                <i class="fa-solid fa-clock"></i>
                                <div><strong>Under Review</strong><br>Your ID is being reviewed by our team. Processing usually takes within 24 hours.</div>
                               </div>`
                : idRejected
                    ? `<div class="verif-alert verif-alert-danger">
                                    <i class="fa-solid fa-circle-exclamation"></i>
                                    <div><strong>Verification Rejected</strong><br>Reason: ${user.id_rejection_reason || 'Please resubmit clear photos of your ID and selfie.'}</div>
                                   </div>
                                   <button class="btn btn-primary mt-md" id="btn-retry-id">Retry Verification</button>`
                    : `<div class="verif-perk mb-lg"><i class="fa-solid fa-envelope-open-text"></i> Highest trust level — get 3× more messages!</div>

                                <div class="id-verif-steps">
                                    <!-- Step A: ID Upload -->
                                    <div class="id-step-card">
                                        <div class="id-step-number">A</div>
                                        <h4>Upload Government ID</h4>
                                        <p class="text-muted" style="font-size:0.85rem;margin-bottom:12px;">Passport, Driver's License, or National ID card</p>
                                        <label class="id-upload-box" id="id-drop-zone">
                                            <i class="fa-solid fa-id-card" style="font-size:2.5rem;color:#94a3b8;margin-bottom:12px;display:block;"></i>
                                            <p style="font-weight:600;margin:0 0 4px;">Click to upload or drag &amp; drop</p>
                                            <p style="font-size:0.8rem;color:#94a3b8;margin:0;">JPG, PNG — max 10MB</p>
                                            <input type="file" accept="image/*" id="id-photo-input" style="position:absolute;inset:0;opacity:0;cursor:pointer;width:100%;height:100%;">
                                        </label>
                                        <div id="id-photo-preview" style="display:none;margin-top:12px;text-align:center;position:relative;">
                                            <img src="" alt="ID Preview" style="max-width:100%;max-height:160px;border-radius:10px;object-fit:cover;border:2px solid #333333;" loading="lazy">
                                            <span class="id-preview-check"><i class="fas fa-check"></i></span>
                                        </div>
                                    </div>

                                    <!-- Step B: Live Selfie -->
                                    <div class="id-step-card">
                                        <div class="id-step-number">B</div>
                                        <h4>Live Selfie Capture</h4>
                                        <p class="text-muted" style="font-size:0.85rem;margin-bottom:12px;">Must be taken live — must match your ID photo</p>

                                        <div id="selfie-idle">
                                            <div class="id-upload-box" id="btn-selfie-cam" style="cursor:pointer;">
                                                <i class="fa-solid fa-camera" style="font-size:2.5rem;color:#94a3b8;margin-bottom:12px;display:block;"></i>
                                                <p style="font-weight:600;margin:0 0 4px;">Open Camera</p>
                                                <p style="font-size:0.8rem;color:#94a3b8;margin:0;">Requires camera permission</p>
                                            </div>
                                        </div>

                                        <div id="selfie-camera-wrap" style="display:none;text-align:center;">
                                            <div style="position:relative;display:inline-block;border-radius:12px;overflow:hidden;border:2px solid var(--primary);">
                                                <video id="selfie-video" autoplay playsinline muted style="width:260px;height:195px;object-fit:cover;display:block;background:#0f172a;"></video>
                                                <div class="camera-overlay-ring"></div>
                                            </div>
                                            <div style="margin-top:12px;display:flex;gap:10px;justify-content:center;">
                                                <button class="btn btn-primary" id="btn-capture-selfie"><i class="fas fa-camera"></i> Capture</button>
                                                <button class="btn btn-outline" id="btn-cancel-camera"><i class="fas fa-times"></i> Cancel</button>
                                            </div>
                                        </div>

                                        <div id="selfie-preview" style="display:none;margin-top:12px;text-align:center;position:relative;">
                                            <img src="" id="selfie-img" alt="Selfie Preview" style="max-width:100%;max-height:160px;border-radius:10px;object-fit:cover;border:2px solid #333333;" loading="lazy">
                                            <span class="id-preview-check"><i class="fas fa-check"></i></span>
                                            <div style="margin-top:8px;">
                                                <button class="btn btn-outline btn-sm" id="btn-retake-selfie"><i class="fas fa-redo"></i> Retake</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button class="btn btn-primary mt-lg btn-lg" id="btn-submit-id" disabled style="width:100%;">
                                    <i class="fas fa-shield-halved"></i> Submit for Verification
                                </button>
                                <p class="text-muted mt-sm" style="text-align:center;font-size:0.8rem;">🔒 Your documents are encrypted and securely stored</p>`}
                </div>
            </div>

            <!-- Level 4: Community -->
            <div class="${levelClass(communityVerified, 4)}">
                <div class="verif-header" onclick="this.parentElement.classList.toggle('expanded')">
                    <div class="verif-title">
                        <span class="verif-icon-wrap" style="background:#f5f5f5;"><i class="fa-solid fa-star" style="color:#555555;"></i></span>
                        <div>
                            <h3>Level 4 — Community Verified</h3>
                            <p>Earned from positive reviews by verified users</p>
                        </div>
                    </div>
                    <div class="verif-status">
                        ${communityVerified
            ? '<span class="badge badge-success"><i class="fas fa-check"></i> Completed</span>'
            : currentLevel === 4
                ? '<span class="badge badge-primary">In Progress</span>'
                : '<span class="badge badge-gray">Locked</span>'}
                        <i class="fa-solid fa-chevron-down verif-chevron"></i>
                    </div>
                </div>
                <div class="verif-body">
                    ${communityVerified
            ? `<div class="verif-success-msg"><i class="fa-solid fa-circle-check"></i> You are a pillar of the RoommateGroups community!</div>`
            : `<p class="mb-lg" style="color:var(--text-secondary);">This level is earned, not applied for. Collect 5 positive reviews from other verified users.</p>
                           <div class="community-ring-wrap">
                               <div class="community-ring">
                                   <svg viewBox="0 0 100 100" width="120" height="120">
                                       <circle cx="50" cy="50" r="${radius}" fill="none" stroke="#e2e8f0" stroke-width="10"/>
                                       <circle cx="50" cy="50" r="${radius}" fill="none" stroke="#555555" stroke-width="10"
                                           stroke-dasharray="${circ}" stroke-dashoffset="${fill}"
                                           stroke-linecap="round" transform="rotate(-90 50 50)" style="transition:stroke-dashoffset 1s ease;"/>
                                   </svg>
                                   <div class="community-ring-label">${positiveReviews}<span>/5</span></div>
                               </div>
                               <div class="community-ring-info">
                                   <p style="font-size:1rem;font-weight:700;margin:0 0 4px;">${positiveReviews} of 5 reviews</p>
                                   <p class="text-muted" style="margin:0;font-size:0.85rem;">${5 - positiveReviews > 0 ? `${5 - positiveReviews} more reviews needed` : 'Threshold reached! Badge will update shortly.'}</p>
                                   <a href="/dashboard/messages" class="btn btn-outline mt-md btn-sm">View my conversations</a>
                               </div>
                           </div>`}
                </div>
            </div>
        </div>

        <style>
            /* ── Progress Track ── */
            .verif-progress-container { padding: 8px 0 24px; }
            .verif-progress-track { display:flex; justify-content:space-between; position:relative; max-width:560px; margin:0 auto; }
            .verif-track-line { position:absolute; top:21px; left:10%; width:80%; height:4px; background:#e2e8f0; border-radius:4px; z-index:0; }
            .verif-track-fill { height:100%; background:linear-gradient(90deg,#333333,#1a1a1a); border-radius:4px; transition:width 0.8s ease; }
            .verif-step { position:relative; z-index:1; display:flex; flex-direction:column; align-items:center; gap:8px; flex:1; }
            .verif-step-bubble { width:44px; height:44px; background:#e2e8f0; color:#64748b; border-radius:50%; display:flex; align-items:center; justify-content:center; font-size:1rem; border:3px solid white; transition:all 0.4s; }
            .verif-step.active .verif-step-bubble { background:var(--primary); color:white; animation:pulse-ring 2s infinite; }
            .verif-step.completed .verif-step-bubble { color:white; }
            .verif-step-label { font-size:0.8rem; font-weight:600; color:#94a3b8; transition:color 0.3s; }
            @keyframes pulse-ring { 0%,100%{box-shadow:0 0 0 4px rgba(27,79,114,0.15);} 50%{box-shadow:0 0 0 8px rgba(99,102,241,0.08);} }

            /* ── Accordion Cards ── */
            .verification-accordion { display:flex; flex-direction:column; gap:16px; margin-bottom:40px; }
            .verif-panel { transition:all 0.3s; overflow:hidden; }
            .verif-panel.active-panel { border-color:var(--primary); box-shadow:0 4px 20px rgba(27,79,114,0.12); background:linear-gradient(135deg,rgba(99,102,241,0.02) 0%,rgba(255,255,255,0) 100%); }
            .verif-panel.verif-completed { border-color:#333333; background:linear-gradient(135deg,rgba(16,185,129,0.03),transparent); }
            .verif-header { display:flex; align-items:center; justify-content:space-between; cursor:pointer; padding:8px 0; user-select:none; }
            .verif-title { display:flex; align-items:center; gap:14px; }
            .verif-icon-wrap { width:48px; height:48px; border-radius:12px; display:flex; align-items:center; justify-content:center; font-size:1.3rem; flex-shrink:0; }
            .verif-title h3 { margin:0 0 2px; font-size:1.05rem; }
            .verif-title p { margin:0; font-size:0.82rem; color:var(--text-secondary); }
            .verif-status { display:flex; align-items:center; gap:14px; }
            .verif-chevron { transition:transform 0.3s; color:#94a3b8; }
            .verif-body { max-height:0; opacity:0; overflow:hidden; transition:max-height 0.4s ease, opacity 0.3s; border-top:1px solid transparent; }
            .verif-panel.expanded .verif-body { max-height:900px; opacity:1; padding-top:20px; margin-top:16px; border-top-color:var(--border); }
            .verif-panel.expanded .verif-chevron { transform:rotate(180deg); }

            /* ── Body elements ── */
            .verif-success-msg { display:flex; align-items:center; gap:10px; color:#333333; font-weight:600; background:#f5f5f5; padding:14px 18px; border-radius:10px; }
            .verif-success-msg i { font-size:1.3rem; }
            .verif-perk { display:inline-flex; align-items:center; gap:10px; background:#f5f5f5; color:#333333; padding:10px 18px; border-radius:10px; font-size:0.92rem; font-weight:600; margin-bottom:4px; }
            .verif-alert { display:flex; align-items:flex-start; gap:14px; padding:16px 18px; border-radius:10px; font-size:0.9rem; }
            .verif-alert i { font-size:1.3rem; margin-top:2px; flex-shrink:0; }
            .verif-alert-warning { background:#fffbeb; color:#b45309; border:1px solid #fcd34d; }
            .verif-alert-danger { background:#f5f5f5; color:#1a1a1a; border:1px solid #dddddd; }

            /* ── OTP Boxes ── */
            .otp-boxes { display:flex; gap:10px; }
            .otp-box { width:48px; height:56px; border:2px solid var(--border); border-radius:10px; text-align:center; font-size:1.5rem; font-weight:700; background:var(--bg-white); color:var(--text-primary); transition:border-color 0.2s; appearance:none; }
            .otp-box:focus { outline:none; border-color:var(--primary); box-shadow:0 0 0 3px rgba(27,79,114,0.15); }

            /* ── ID Upload Steps ── */
            .id-verif-steps { display:flex; gap:20px; flex-wrap:wrap; margin-top:4px; }
            .id-step-card { flex:1; min-width:240px; background:var(--bg-white); border:1px solid var(--border); border-radius:14px; padding:20px; position:relative; }
            .id-step-number { position:absolute; top:-12px; left:18px; width:28px; height:28px; background:var(--primary); color:white; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:700; font-size:0.85rem; }
            .id-step-card h4 { margin:0 0 4px; font-size:0.95rem; padding-top:4px; }
            .id-upload-box { border:2px dashed #cbd5e1; border-radius:12px; padding:28px 20px; text-align:center; background:#f8fafc; cursor:pointer; transition:all 0.2s; display:block; position:relative; }
            .id-upload-box:hover, .id-upload-box.drag-over { border-color:var(--primary); background:rgba(27,79,114,0.04); }
            .id-preview-check { position:absolute; bottom:8px; right:8px; background:#333333; color:white; border-radius:50%; width:22px; height:22px; display:flex; align-items:center; justify-content:center; font-size:0.75rem; }

            /* ── Camera ── */
            .camera-overlay-ring { position:absolute; top:50%; left:50%; transform:translate(-50%,-50%); width:190px; height:190px; border:3px solid rgba(99,102,241,0.6); border-radius:50%; pointer-events:none; box-shadow:0 0 0 9999px rgba(0,0,0,0.35); }

            /* ── Community Ring ── */
            .community-ring-wrap { display:flex; align-items:center; gap:28px; background:var(--bg-white); border:1px solid var(--border); border-radius:14px; padding:20px; max-width:400px; }
            .community-ring { position:relative; display:flex; align-items:center; justify-content:center; flex-shrink:0; }
            .community-ring-label { position:absolute; font-size:1.5rem; font-weight:800; color:#555555; text-align:center; line-height:1; }
            .community-ring-label span { font-size:0.85rem; color:var(--text-secondary); display:block; font-weight:500; }
        </style>
    `;

    // ── Interactivity ──
    setTimeout(() => {
        // ── Phone OTP logic (Level 2) ──
        const btnSendSMS = container.querySelector('#btn-send-sms');
        const smsBlock = container.querySelector('#sms-otp-block');
        const btnVerifySMS = container.querySelector('#btn-verify-sms');
        const btnResendSMS = container.querySelector('#btn-resend-sms');
        const smsTimerEl = container.querySelector('#sms-timer');
        const otpBoxes = container.querySelectorAll('.otp-box');
        let timerInterval = null;

        // OTP box auto-focus progression
        otpBoxes.forEach((box, idx) => {
            box.addEventListener('input', () => {
                if (box.value.length === 1 && idx < 5) otpBoxes[idx + 1].focus();
                if (box.value.length > 1) box.value = box.value.slice(-1);
            });
            box.addEventListener('keydown', e => {
                if (e.key === 'Backspace' && !box.value && idx > 0) otpBoxes[idx - 1].focus();
            });
        });

        function startTimer() {
            let t = 60;
            smsTimerEl && (smsTimerEl.textContent = t);
            clearInterval(timerInterval);
            timerInterval = setInterval(() => {
                t--;
                if (smsTimerEl) smsTimerEl.textContent = t;
                if (t <= 0) {
                    clearInterval(timerInterval);
                    if (btnResendSMS) { btnResendSMS.style.display = 'inline-flex'; }
                    const timerEl = smsTimerEl?.closest('span');
                    if (timerEl) timerEl.style.display = 'none';
                }
            }, 1000);
        }

        if (btnSendSMS) {
            btnSendSMS.addEventListener('click', () => {
                const phone = container.querySelector('#phone-number')?.value.trim();
                if (!phone) { showToast('Please enter a phone number.', 'error'); return; }
                btnSendSMS.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
                btnSendSMS.disabled = true;
                setTimeout(() => {
                    smsBlock.style.display = 'block';
                    otpBoxes[0].focus();
                    btnSendSMS.innerHTML = 'Code Sent!';
                    showToast('Verification code sent! (Demo: any 6-digit code works)', 'success');
                    startTimer();
                }, 1200);
            });
        }

        if (btnResendSMS) {
            btnResendSMS.addEventListener('click', () => {
                btnResendSMS.style.display = 'none';
                const timerEl = smsTimerEl?.closest('span');
                if (timerEl) timerEl.style.display = '';
                otpBoxes.forEach(b => b.value = '');
                otpBoxes[0].focus();
                showToast('New code sent!', 'success');
                startTimer();
            });
        }

        if (btnVerifySMS) {
            btnVerifySMS.addEventListener('click', () => {
                const code = Array.from(otpBoxes).map(b => b.value).join('');
                if (code.length < 6) { showToast('Enter all 6 digits.', 'error'); return; }
                btnVerifySMS.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Verifying...';
                btnVerifySMS.disabled = true;
                setTimeout(() => {
                    clearInterval(timerInterval);
                    const updatedUser = db.users.update(user.id || user.user_id, {
                        phone_verified: true,
                        verification_level: (user.verification_level === 'basic' ? 'phone' : user.verification_level)
                    });
                    showToast('Phone verified successfully! 🎉', 'success');
                    renderVerification(container, updatedUser || { ...user, phone_verified: true });
                }, 1200);
            });
        }

        // ── ID Upload logic (Level 3) ──
        const idPhotoInput = container.querySelector('#id-photo-input');
        const btnSubmitId = container.querySelector('#btn-submit-id');
        const dropZone = container.querySelector('#id-drop-zone');
        let hasId = false, hasSelfie = false, idPhotoFile = null, selfieBlob = null;
        let cameraStream = null;

        function checkIdSubmit() {
            if (btnSubmitId) btnSubmitId.disabled = !(hasId && hasSelfie);
        }

        // Drag & drop
        if (dropZone) {
            dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
            dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
            dropZone.addEventListener('drop', e => {
                e.preventDefault();
                dropZone.classList.remove('drag-over');
                const file = e.dataTransfer.files[0];
                if (file && file.type.startsWith('image/')) {
                    idPhotoFile = file;
                    hasId = true;
                    const reader = new FileReader();
                    reader.onload = ev => {
                        container.querySelector('#id-photo-preview').style.display = 'block';
                        container.querySelector('#id-photo-preview img').src = ev.target.result;
                    };
                    reader.readAsDataURL(file);
                    checkIdSubmit();
                }
            });
        }

        if (idPhotoInput) {
            idPhotoInput.addEventListener('change', e => {
                if (e.target.files.length > 0) {
                    idPhotoFile = e.target.files[0];
                    hasId = true;
                    const reader = new FileReader();
                    reader.onload = ev => {
                        container.querySelector('#id-photo-preview').style.display = 'block';
                        container.querySelector('#id-photo-preview img').src = ev.target.result;
                    };
                    reader.readAsDataURL(idPhotoFile);
                    checkIdSubmit();
                }
            });
        }

        // Camera selfie
        const btnOpenCam = container.querySelector('#btn-selfie-cam');
        const camWrap = container.querySelector('#selfie-camera-wrap');
        const selfieIdleWrap = container.querySelector('#selfie-idle');
        const selfiePreviewWrap = container.querySelector('#selfie-preview');
        const selfieImg = container.querySelector('#selfie-img');
        const video = container.querySelector('#selfie-video');
        const btnCapture = container.querySelector('#btn-capture-selfie');
        const btnCancelCam = container.querySelector('#btn-cancel-camera');
        const btnRetakeSelfie = container.querySelector('#btn-retake-selfie');

        async function openCamera() {
            try {
                cameraStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
                video.srcObject = cameraStream;
                selfieIdleWrap.style.display = 'none';
                camWrap.style.display = 'block';
                selfiePreviewWrap.style.display = 'none';
            } catch (err) {
                showToast('Camera access denied. Please allow camera permission.', 'error');
            }
        }

        function stopCamera() {
            if (cameraStream) { cameraStream.getTracks().forEach(t => t.stop()); cameraStream = null; }
        }

        if (btnOpenCam) btnOpenCam.addEventListener('click', openCamera);

        if (btnCapture) {
            btnCapture.addEventListener('click', () => {
                const canvas = document.createElement('canvas');
                canvas.width = video.videoWidth || 320;
                canvas.height = video.videoHeight || 240;
                canvas.getContext('2d').drawImage(video, 0, 0);
                stopCamera();
                canvas.toBlob(blob => {
                    selfieBlob = blob;
                    hasSelfie = true;
                    const url = URL.createObjectURL(blob);
                    selfieImg.src = url;
                    camWrap.style.display = 'none';
                    selfiePreviewWrap.style.display = 'block';
                    checkIdSubmit();
                }, 'image/jpeg', 0.9);
            });
        }

        if (btnCancelCam) {
            btnCancelCam.addEventListener('click', () => {
                stopCamera();
                camWrap.style.display = 'none';
                selfieIdleWrap.style.display = 'block';
            });
        }

        if (btnRetakeSelfie) {
            btnRetakeSelfie.addEventListener('click', () => {
                hasSelfie = false;
                selfieBlob = null;
                selfiePreviewWrap.style.display = 'none';
                selfieIdleWrap.style.display = 'block';
                selfieImg.src = '';
                checkIdSubmit();
            });
        }

        if (container.querySelector('#btn-retry-id')) {
            container.querySelector('#btn-retry-id').addEventListener('click', () => {
                db.users.update(user.id || user.user_id, { id_status: null, id_rejection_reason: null });
                renderVerification(container, { ...user, id_status: null, id_rejection_reason: null });
            });
        }

        // Submit ID for verification
        if (btnSubmitId) {
            btnSubmitId.addEventListener('click', async () => {
                btnSubmitId.disabled = true;
                btnSubmitId.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
                try {
                    // For now, just mark as pending without file upload
                    // In a real app, you'd implement local file handling or a different storage solution
                    const updatedUser = db.users.update(user.id || user.user_id, {
                        id_status: 'pending',
                        verification_id_photo: '',
                        verification_selfie: ''
                    });

                    showToast('ID Verification submitted! We\'ll review within 24 hours. 🛡️', 'success');
                    renderVerification(container, updatedUser || { ...user, id_status: 'pending' });
                } catch (error) {
                    console.error('Verification submission error:', error);
                    showToast('Submission failed. Please try again.', 'error');
                    btnSubmitId.innerHTML = '<i class="fas fa-shield-halved"></i> Submit for Verification';
                    btnSubmitId.disabled = false;
                }
            });
        }
    }, 0);
}


// ── Placeholder ────────────────────────────────────────────────

function renderPlaceholder(container, title, icon) {
    container.innerHTML = [
        '<div class="dashboard-header-bar"><h2>' + title + '</h2></div>',
        '<div class="empty-state">',
        '<i class="fa-solid ' + icon + '"></i>',
        '<h3>' + title + ' section coming soon</h3>',
        '<p>We are currently working on this feature. Check back later!</p>',
        '</div>'
    ].join('');
}
