/**
 * src/mobile/mobile-main.js
 *
 * Mobile router — entry point for Capacitor native builds.
 * Called exclusively by the platform guard in src/main.js.
 * Desktop code is never imported here — mobile code never imported by desktop.
 */

import './mobile-styles.css';
import { getCurrentUser } from '../services/auth.js';
import { initDB, db } from '../services/db.js';
import { getTotalUnread } from '../services/messaging.js';
import { renderBottomNav, updateActiveTab, updateMessageBadge } from './components/BottomNav.js';
import { renderMobileHeader } from './components/MobileHeader.js';
import { App } from '@capacitor/app';

const TAB_ORDER = ['home', 'search', 'post', 'chat', 'profile'];
let swipeStartX = 0, swipeStartY = 0;

// ── Path → route name adapter (for legacy mobileNavigate calls) ─
const PATH_TO_ROUTE = {
  '/': 'home',
  '/search': 'search',
  '/search/rooms': 'search',
  '/post-listing': 'post',
  '/dashboard/messages': 'chat',
  '/dashboard': 'profile',
  '/admin': 'admin',
  '/settings/blocked': 'block-list',
  '/dashboard/messages/archived': 'archived-chats',
  '/auth/login': 'auth',
  '/auth/register': 'auth',
  '/pricing': 'pricing',
  '/fb-groups': 'fbGroups',
  '/blog': 'blog',
};

// ── Route state ───────────────────────────────────────────────
const state = {
  current: null,
  params: {},
  history: [],
};

// ── Lazy route loaders ────────────────────────────────────────
const ROUTE_LOADERS = {
  home: () => import('./pages/MobileHome.js'),
  search: () => import('./pages/MobileSearch.js'),
  listing: () => import('./pages/MobileListing.js'),
  post: () => import('./pages/MobilePost.js'),
  chat: () => import('./pages/MobileMessages.js'),
  'chat-detail': () => import('./pages/MobileChatDetail.js'),
  profile: () => import('./pages/MobileProfile.js'),
  auth: () => import('./pages/MobileAuth.js'),
  pricing: () => import('./pages/MobilePricing.js'),
  fbGroups: () => import('./pages/MobileFBGroups.js'),
  fbGroupDetail: () => import('./pages/MobileFBGroupDetail.js'),
  blog: () => import('./pages/MobileBlog.js'),
  'my-listings': () => import('./pages/MobileMyListings.js'),
  saved: () => import('./pages/MobileSaved.js'),
  contact: () => import('./pages/MobileContact.js'),
  dashboard: () => import('./pages/MobileDashboard.js'),
  admin: () => import('./pages/MobileAdminDashboard.js'),
  settings: () => import('./pages/MobileSettings.js'),
  'block-list': () => import('./pages/MobileBlockList.js'),
  'archived-chats': () => import('./pages/MobileArchivedChats.js'),
  notifications: () => import('./pages/MobileNotifications.js'),
  safety: () => import('./pages/MobileSafety.js'),
  verification: () => import('./pages/MobileVerification.js'),
  faq: () => import('./pages/MobileFAQ.js'),
  'saved-searches': () => import('./pages/MobileSavedSearches.js'),
  subscription: () => import('./pages/MobileSubscription.js'),
  'profile-setup': () => import('./pages/MobileProfileSetup.js'),
  about: () => import('./pages/MobileAbout.js'),
  city: () => import('./pages/MobileCity.js'),
};

// Route name → bottom-nav tab id (null = hide nav, undefined falls back to 'home')
const ROUTE_TO_TAB = {
  home: 'home',
  search: 'search',
  listing: 'home',
  city: 'home',
  faq: 'home',
  about: 'home',
  safety: 'home',
  blog: 'home',
  fbGroups: 'home',
  fbGroupDetail: 'home',
  pricing: 'home',
  contact: 'home',
  post: 'post',
  chat: 'messages',
  'chat-detail': 'messages',
  profile: 'dashboard',
  dashboard: 'dashboard',
  admin: 'dashboard',
  settings: 'dashboard',
  'block-list': 'dashboard',
  'archived-chats': 'messages',
  verification: 'dashboard',
  'saved-searches': 'dashboard',
  subscription: 'dashboard',
  'my-listings': 'dashboard',
  saved: 'dashboard',
  notifications: 'dashboard',
  auth: null,
  'profile-setup': null,
};

const ROUTE_TITLES = {
  home: 'RoommateGroups',
  search: 'Search',
  listing: 'Listing',
  post: 'Post a Listing',
  chat: 'Messages',
  'chat-detail': 'Chat',
  profile: 'Profile',
  auth: 'Welcome',
  pricing: 'Pricing Plans',
  fbGroups: 'FB Groups',
  fbGroupDetail: 'Group Details',
  blog: 'Blog',
  'my-listings': 'My Listings',
  saved: 'Saved Listings',
  about: 'About Us',
  faq: 'FAQ',
  city: 'City',
  contact: 'Contact Us',
  dashboard: 'Dashboard',
  admin: 'Admin Dashboard',
  settings: 'Settings',
  'block-list': 'Blocked Users',
  'archived-chats': 'Archived Chats',
  notifications: 'Notifications',
  safety: 'Safety Tips',
  verification: 'Trust & Verification',
  'saved-searches': 'Saved Searches',
  subscription: 'Subscription',
  'profile-setup': 'Profile Setup',
};

// ── App shell refs ────────────────────────────────────────────
let _appEl = null;
let _pageEl = null;
let _headerCtrl = null;
let _rendering = false;

// ── Public: navigate(route, params) ──────────────────────────
export async function navigate(routeOrPath, params = {}, direction = 'forward') {
  // ── Backward-compat: accept URL paths from legacy pages ──
  let route = routeOrPath;
  let resolvedParams = { ...params };

  if (typeof routeOrPath === 'string' && routeOrPath.startsWith('/')) {
    // /listing/abc123 → route='listing', params.id='abc123'
    if (routeOrPath.startsWith('/listing/')) {
      route = 'listing';
      resolvedParams.id = routeOrPath.split('/listing/')[1].split('?')[0];
    } else if (routeOrPath.startsWith('/profile/')) {
      route = 'profile';
      resolvedParams.userId = routeOrPath.split('/profile/')[1].split('?')[0];
    } else if (routeOrPath.startsWith('/cities/')) {
      route = 'city';
      resolvedParams.slug = routeOrPath.split('/cities/')[1].split('?')[0];
    } else {
      route = PATH_TO_ROUTE[routeOrPath] || 'home';
    }
  }

  console.log('[MOBILE] Navigating to:', route, resolvedParams);

  // Push current to history stack (skip auth from history)
  if (state.current && state.current !== 'auth') {
    state.history.push({ route: state.current, params: { ...state.params } });
  }

  state.current = route;
  state.params = resolvedParams;

  await _renderRoute(route, resolvedParams, direction);
}

// ── Public: getRouteParams() ──────────────────────────────────
export function getRouteParams() {
  return { ...state.params };
}

// ── Public: updateHeader() ────────────────────────────────────
export function updateHeader(opts = {}) {
  if (!_headerCtrl) return;
  if (opts.title !== undefined) _headerCtrl.setTitle(opts.title);
  if (opts.showBack !== undefined) _headerCtrl.showBackButton(opts.showBack, opts.onBack || goBack);
  if (opts.leftAction !== undefined) _headerCtrl.setLeftAction(opts.leftAction);
  if (opts.homeRightActions !== undefined) _headerCtrl.setHomeRightActions(opts.homeRightActions);
  if (opts.rightAction !== undefined) _headerCtrl.setRightAction(opts.rightAction);
}

// ── Public: updateBellBadge(count) ───────────────────────────
// Lets any page directly set (or clear) the notification bell badge.
export function updateBellBadge(count) {
  if (_headerCtrl) _headerCtrl.setRightBadge(count);
}

// ── Public: goBack() ─────────────────────────────────────────
export function goBack() {
  const prev = state.history.pop();
  if (prev) {
    console.log('[MOBILE] Going back to:', prev.route, prev.params);
    state.current = prev.route;
    state.params = prev.params;
    _renderRoute(prev.route, prev.params, 'back');
  } else {
    navigate('home', {}, 'back');
  }
}

// ── Alias for BottomNav backward-compat ──────────────────────
export const mobileNavigate = navigate;

// ── Internal renderer ─────────────────────────────────────────
async function _renderRoute(route, params = {}, direction = 'forward') {
  if (!_pageEl || !_appEl) return;
  if (_rendering) return;
  _rendering = true;

  const isAuth = route === 'auth';
  const tabId = ROUTE_TO_TAB[route];
  const title = ROUTE_TITLES[route] || 'RoommateGroups';
  const hasBack = !isAuth && state.history.length > 0;

  // ── Header ──
  const headerEl = _appEl.querySelector('.mobile-header');
  if (headerEl) {
    headerEl.style.display = isAuth ? 'none' : '';
  }
  if (_headerCtrl && !isAuth) {
    _headerCtrl.setTitle(title);
    _headerCtrl.showBackButton(hasBack, hasBack ? goBack : null);
    // Remove home dual-action area when not on home route
    if (route !== 'home') {
      const homeActions = _appEl.querySelector('#mobile-header-home-actions');
      if (homeActions) homeActions.remove();
    }
    _headerCtrl.setRightAction(null);
  }

  // ── Bottom nav ──
  const existingNav = _appEl.querySelector('.mobile-bottom-nav');
  const hideNav = isAuth || route === 'post' || route === 'profile-setup';

  if (hideNav) {
    existingNav?.remove();
  } else {
    if (!existingNav) {
      renderBottomNav(_appEl, tabId || 'home');
    } else {
      updateActiveTab(tabId || 'home');
    }
  }

  // ── Page transition ──
  const oldPage = _pageEl;
  const newPage = document.createElement('div');
  newPage.className = 'mobile-page';

  // Auth page gets full-screen padding (no header/nav offsets)
  if (isAuth) {
    newPage.style.paddingTop = 'env(safe-area-inset-top, 44px)';
    newPage.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
  } else if (hideNav) {
    newPage.style.paddingTop = 'calc(var(--mobile-header-height) + var(--mobile-safe-top))';
    newPage.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
  } else {
    newPage.style.paddingTop = 'calc(var(--mobile-header-height) + var(--mobile-safe-top))';
    newPage.style.paddingBottom = 'calc(var(--mobile-bottom-nav-height) + var(--mobile-safe-bottom))';
  }

  // Apply animation classes
  if (direction === 'forward') {
    newPage.classList.add('slide-in-right');
    oldPage.classList.add('slide-out-left');
  } else {
    newPage.classList.add('slide-in-left');
    oldPage.classList.add('slide-out-right');
  }

  _appEl.appendChild(newPage);
  _pageEl = newPage;

  // Remove old page after animation
  setTimeout(() => {
    oldPage.remove();
    newPage.classList.remove('slide-in-right', 'slide-in-left');
  }, 300);

  // ── Load and call page module ──
  try {
    const loader = ROUTE_LOADERS[route];
    if (!loader) { _render404(newPage, route); _rendering = false; return; }

    const mod = await loader();
    const target = mod.default || mod;
    const initFn = (typeof target === 'function')
      ? target
      : (target.init || target[`renderMobile${_cap(route)}`] || target[`render${_cap(route)}`] || null);

    if (typeof initFn === 'function') {
      await initFn(newPage, params);
    } else {
      console.warn(`[MOBILE] No init function found for route: ${route}`, mod);
      _render404(newPage, route);
    }
  } catch (err) {
    console.error('[MOBILE] Error rendering route:', route, err);
    _render404(newPage, route, err);
  }

  _rendering = false;
}

function _cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function _render404(container, route, err) {
  const errMsg = err ? `<div style="font-size:0.72rem;color:#ef4444;margin-top:8px;word-break:break-all;padding:0 8px;">${String(err)}</div>` : '';
  container.innerHTML = `
    <div class="mobile-empty">
      <div class="mobile-empty-icon">🔍</div>
      <div class="mobile-empty-title">Page not found</div>
      <div class="mobile-empty-text">No mobile view for "${route}"</div>
      ${errMsg}
      <button class="mobile-btn mobile-btn-accent" id="back-btn-404" style="width:auto;margin-top:16px;">Go Back</button>
    </div>
  `;
  container.querySelector('#back-btn-404')?.addEventListener('click', goBack);
}

// ── Push Notifications ────────────────────────────────────────
async function initPushNotifications() {
  const PushNotifications = window.Capacitor?.Plugins?.PushNotifications;
  if (!PushNotifications) {
    console.warn('[MOBILE] PushNotifications plugin not found');
    return;
  }
  
  try {
    let permStatus = await PushNotifications.checkPermissions();

    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }

    if (permStatus.receive !== 'granted') {
      console.warn('[MOBILE] User denied push permission');
      return;
    }

    await PushNotifications.register();

    PushNotifications.addListener('registration', token => {
      console.info('[MOBILE] Push registration success, token:', token.value);
      const user = getCurrentUser();
      if (user) {
        let tokens = [];
        try { tokens = Array.isArray(user.push_tokens) ? user.push_tokens : JSON.parse(user.push_tokens || '[]'); } catch(e){}
        if (!tokens.includes(token.value)) {
          tokens.push(token.value);
          user.push_tokens = JSON.stringify(tokens);
          // Only update if db and users exist, fail gracefully
          if (db && db.users) {
            db.users.update(user.user_id || user.id, { push_tokens: user.push_tokens }).catch(e => console.error('[MOBILE] Failed to save push token:', e));
          }
        }
      }
    });

    PushNotifications.addListener('registrationError', err => {
      console.error('[MOBILE] Push registration error:', err.error);
    });

    PushNotifications.addListener('pushNotificationReceived', notification => {
      console.log('[MOBILE] Push received:', notification);
      // Update global unread count
      const user = getCurrentUser();
      if (user && _headerCtrl) {
        _headerCtrl.setRightBadge(getTotalUnread(user.user_id));
      }
    });

    PushNotifications.addListener('pushNotificationActionPerformed', notification => {
      console.log('[MOBILE] Push action performed:', notification);
      const data = notification.notification.data || {};
      
      if (data.type === 'message' || data.type === 'new_message') {
        if (data.threadId) {
          navigate('chat-detail', { threadId: data.threadId });
        } else if (data.senderId) {
          navigate('chat-detail', { userId: data.senderId });
        } else {
          navigate('chat');
        }
      } else if (data.listingId) {
        navigate('listing', { id: data.listingId });
      } else if (data.url) {
        navigate(data.url);
      } else {
        navigate('notifications');
      }
    });
  } catch (err) {
    console.error('[MOBILE] Push setup failed:', err);
  }
}

// ── initMobile ────────────────────────────────────────────────
export async function initMobile() {
  console.log('[MOBILE] Initializing mobile layer…');

  // 1. Grab or create the app root
  _appEl = document.querySelector('#app') || document.querySelector('#mobile-app');
  if (!_appEl) {
    _appEl = document.createElement('div');
    _appEl.id = 'mobile-app';
    document.body.appendChild(_appEl);
  }

  // Rescue the branded splash from #app before we wipe it, so it stays
  // visible over the shell while DB syncs and the first route renders.
  const splash = document.getElementById('initial-splash');
  if (splash) document.body.appendChild(splash); // move outside #app

  // 2. Set up shell
  _appEl.innerHTML = '';
  _appEl.className = 'mobile-app';
  _appEl.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:var(--bg-light);overflow:hidden;';

  // 3. Render header (hidden initially — shown once we know the route)
  _headerCtrl = renderMobileHeader(_appEl, { title: 'LOGO', showBack: false });

  // 4. Create page area
  _pageEl = document.createElement('div');
  _pageEl.className = 'mobile-page';
  _appEl.appendChild(_pageEl);

  // 5. Sync DB (splash covers the shell while this runs)
  await initDB().catch(err => console.log('[MOBILE] DB init warning:', err));

  // 6. Auth guard → navigate to first route
  const user = getCurrentUser();
  console.log('[MOBILE] Auth check:', user ? `logged in as ${user.display_name || user.email}` : 'not logged in');

  if (!user) {
    await navigate('auth');
  } else if (!user.profileComplete) {
    console.log('[MOBILE] Profile incomplete → setup');
    await navigate('profile-setup');
  } else {
    await navigate('home');
    // Seed bell badge immediately after first render (don't wait 10s)
    const unread = (db.notifications?.findAll?.() || [])
      .filter(n => (n.user_id === user.user_id || n.userId === user.user_id) && !n.is_read);
    if (_headerCtrl) _headerCtrl.setRightBadge(unread.length);
  }

  // 7. Fade out the branded splash now that the first page is rendered
  if (splash) {
    splash.style.transition = 'opacity 0.35s ease';
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 350);
  }

  // 8. Android hardware back button
  App.addListener('backButton', ({ canGoBack }) => {
    if (state.history.length > 1) {
      goBack();
    } else {
      App.exitApp();
    }
  });

  // 9. Gestures (Disabled swipe-to-switch per user request, only click allowed)
  document.addEventListener('touchstart', (e) => {
    swipeStartX = e.touches[0].clientX;
    swipeStartY = e.touches[0].clientY;
  }, { passive: true });

  // Note: touchmove and touchend swipe logic removed to prevent accidental tab/page switching
  // Navigation is now strictly handled by icon clicks in the bottom nav or header buttons.

  // 10. Scroll fixes (Removed e.preventDefault() as it can block valid scrolling)
  window.addEventListener('resize', () => {
    const activeEl = document.activeElement;
    if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')) {
      setTimeout(() => activeEl.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
    }
  });

  console.log('[MOBILE] Gestures initialized');
  console.log('[MOBILE] Shell ready. Route:', state.current);

  // 11. Global unread badge polling (every 10s)
  setInterval(async () => {
    const user = getCurrentUser();
    if (!user) return;
    
    // Update message tab badge
    const msgCount = getTotalUnread(user.user_id);
    updateMessageBadge(msgCount);

    // Update header notification badge (handle both field name variants)
    if (_headerCtrl) {
      const notifs = (db.notifications?.findAll?.() || [])
        .filter(n => (n.user_id === user.user_id || n.userId === user.user_id) && !n.is_read);
      _headerCtrl.setRightBadge(notifs.length);
    }
  }, 10000);

  // 12. Initialize push notifications
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    initPushNotifications();
  }
}
