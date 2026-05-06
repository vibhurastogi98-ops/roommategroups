/**
 * src/mobile/mobile-main.js
 *
 * Mobile router — entry point for Capacitor native builds.
 * Called exclusively by the platform guard in src/main.js.
 * Desktop code is never imported here — mobile code never imported by desktop.
 */

import './mobile-styles.css';
import { getCurrentUser } from '../services/auth.js';
import { initDB } from '../services/db.js';
import { renderBottomNav, updateActiveTab } from './components/BottomNav.js';
import { renderMobileHeader } from './components/MobileHeader.js';

// ── Path → route name adapter (for legacy mobileNavigate calls) ─
const PATH_TO_ROUTE = {
  '/': 'home',
  '/search': 'search',
  '/search/rooms': 'search',
  '/post-listing': 'post',
  '/dashboard/messages': 'chat',
  '/dashboard': 'profile',
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
  chat: () => import('./pages/MobileChat.js'),
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
  settings: () => import('./pages/MobileSettings.js'),
  notifications: () => import('./pages/MobileNotifications.js'),
  safety: () => import('./pages/MobileSafety.js'),
  verification: () => import('./pages/MobileVerification.js'),
  faq: () => import('./pages/MobileFAQ.js'),
  'saved-searches': () => import('./pages/MobileSavedSearches.js'),
};

// Route name → bottom-nav tab id (null = hide nav)
const ROUTE_TO_TAB = {
  home: 'home',
  search: 'search',
  listing: 'home',
  faq: 'home',
  post: 'post',
  chat: 'messages',
  profile: 'dashboard',
  dashboard: 'dashboard',
  settings: 'dashboard',
  verification: 'dashboard',
  'saved-searches': 'dashboard',
  auth: null,
};

const ROUTE_TITLES = {
  home: 'RoommateGroups',
  search: 'Search',
  listing: 'Listing',
  post: 'Post a Listing',
  chat: 'Messages',
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
  contact: 'Contact Us',
  dashboard: 'Dashboard',
  settings: 'Settings',
  notifications: 'Notifications',
  safety: 'Safety Tips',
  verification: 'Trust & Verification',
  'saved-searches': 'Saved Searches',
};

// ── App shell refs ────────────────────────────────────────────
let _appEl = null;
let _pageEl = null;
let _headerCtrl = null;
let _rendering = false;

// ── Public: navigate(route, params) ──────────────────────────
export async function navigate(routeOrPath, params = {}) {
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

  await _renderRoute(route, resolvedParams);
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
  if (opts.rightAction !== undefined) _headerCtrl.setRightAction(opts.rightAction);
}

// ── Public: goBack() ─────────────────────────────────────────
export function goBack() {
  const prev = state.history.pop();
  if (prev) {
    console.log('[MOBILE] Going back to:', prev.route, prev.params);
    state.current = prev.route;
    state.params = prev.params;
    _renderRoute(prev.route, prev.params, true);
  } else {
    navigate('home');
  }
}

// ── Alias for BottomNav backward-compat ──────────────────────
export const mobileNavigate = navigate;

// ── Internal renderer ─────────────────────────────────────────
async function _renderRoute(route, params = {}, isBack = false) {
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
    _headerCtrl.setRightAction(null);
  }

  // ── Bottom nav ──
  const existingNav = _appEl.querySelector('.mobile-bottom-nav');
  const hideNav = isAuth || route === 'post';

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
  _pageEl.classList.remove('enter');
  _pageEl.classList.add('exit');

  const newPage = document.createElement('div');
  newPage.className = 'mobile-page';

  // Auth page gets full-screen padding (no header/nav offsets)
  if (isAuth) {
    newPage.style.paddingTop = 'env(safe-area-inset-top, 44px)';
    newPage.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
  }

  await new Promise(resolve => setTimeout(resolve, 180));

  _pageEl.remove();
  _pageEl = newPage;

  // Apply layout offsets — auth is full-screen, other routes clear the fixed header+nav
  if (hideNav) {
    _pageEl.style.paddingTop = 'calc(var(--mobile-header-height) + var(--mobile-safe-top))';
    _pageEl.style.paddingBottom = 'env(safe-area-inset-bottom, 0px)';
  } else {
    _pageEl.style.paddingTop = 'calc(var(--mobile-header-height) + var(--mobile-safe-top))';
    _pageEl.style.paddingBottom = 'calc(var(--mobile-bottom-nav-height) + var(--mobile-safe-bottom))';
  }

  _appEl.appendChild(_pageEl);

  requestAnimationFrame(() => {
    _pageEl.classList.add('mobile-page-enter');
    setTimeout(() => _pageEl.classList.remove('mobile-page-enter'), 320);
  });

  // ── Load and call page module ──
  try {
    const loader = ROUTE_LOADERS[route];
    if (!loader) { _render404(_pageEl, route); _rendering = false; return; }

    const mod = await loader();
    // Support both export styles: init(container, params) or renderMobileXxx(container)
    // Also handle cases where the loader returns a module with a .default property
    const target = mod.default || mod;
    const initFn = (typeof target === 'function') 
      ? target 
      : (target.init || target[`renderMobile${_cap(route)}`] || target[`render${_cap(route)}`] || null);

    if (typeof initFn === 'function') {
      await initFn(_pageEl, params);
    } else {
      console.warn(`[MOBILE] No init function found for route: ${route}`, mod);
      _render404(_pageEl, route);
    }
  } catch (err) {
    console.error('[MOBILE] Error rendering route:', route, err);
    _render404(_pageEl, route);
  }

  _rendering = false;
}

function _cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function _render404(container, route) {
  container.innerHTML = `
    <div class="mobile-empty">
      <div class="mobile-empty-icon">🔍</div>
      <div class="mobile-empty-title">Page not found</div>
      <div class="mobile-empty-text">No mobile view for "${route}"</div>
      <button class="mobile-btn mobile-btn-accent" id="back-btn-404" style="width:auto;margin-top:16px;">Go Back</button>
    </div>
  `;
  container.querySelector('#back-btn-404')?.addEventListener('click', goBack);
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
  } else {
    await navigate('home');
  }

  // 7. Fade out the branded splash now that the first page is rendered
  if (splash) {
    splash.style.transition = 'opacity 0.35s ease';
    splash.style.opacity = '0';
    setTimeout(() => splash.remove(), 350);
  }

  // 8. Android hardware back button
  document.addEventListener('backbutton', (e) => {
    e.preventDefault();
    goBack();
  }, false);

  console.log('[MOBILE] Shell ready. Route:', state.current);
}
