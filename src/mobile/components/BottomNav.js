/**
 * src/mobile/components/BottomNav.js
 *
 * Renders the 5-tab fixed bottom navigation bar.
 * Tabs: Home | Search | Post | Messages | Profile
 *
 * Usage:
 *   renderBottomNav(appEl, 'home');
 *   updateActiveTab('search');
 */

// SVG Icons for premium look
const ICONS = {
  home: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
  search: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
  post: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>`,
  messages: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path></svg>`,
  dashboard: `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
};

// Tab definitions — route names match ROUTE_LOADERS keys in mobile-main.js
const TABS = [
  { id: 'home', icon: ICONS.home, label: 'Home', route: 'home' },
  { id: 'search', icon: ICONS.search, label: 'Search', route: 'search' },
  { id: 'post', icon: ICONS.post, label: 'Post', route: 'post' },
  { id: 'messages', icon: ICONS.messages, label: 'Messages', route: 'chat' },
  { id: 'dashboard', icon: ICONS.dashboard, label: 'Dashboard', route: 'dashboard' },
];

let _navEl = null;

/**
 * @param {HTMLElement} container  — element to append the nav into
 * @param {string}      activeTab  — id of the initially active tab
 */
export function renderBottomNav(container, activeTab = 'home') {
  // Remove any existing nav to avoid double-render
  const existing = container.querySelector('.mobile-bottom-nav');
  if (existing) existing.remove();

  const nav = document.createElement('nav');
  nav.className = 'mobile-bottom-nav';
  nav.setAttribute('role', 'navigation');
  nav.setAttribute('aria-label', 'Main navigation');

  nav.innerHTML = `
    <div class="mobile-nav-tabs" role="tablist">
      ${TABS.map(tab => `
        <button
          id="mobile-tab-${tab.id}"
          class="mobile-nav-tab${tab.id === 'post' ? ' tab-post' : ''}${tab.id === activeTab ? ' active' : ''}"
          role="tab"
          aria-selected="${tab.id === activeTab}"
          aria-label="${tab.label}"
          data-tab="${tab.id}"
          data-route="${tab.route}"
        >
          <span class="mobile-nav-tab-icon" style="position: relative; display: inline-flex;">
            ${tab.icon}
            ${tab.id === 'messages' ? '<span id="mobile-nav-badge-messages" style="display:none; position:absolute; top:-4px; right:-8px; background:#ef4444; color:#fff; font-size:0.6rem; font-weight:800; padding:1px 5px; border-radius:10px; border:2px solid #fff; min-width:16px; text-align:center;">0</span>' : ''}
          </span>
          <span class="mobile-nav-tab-label">${tab.label}</span>
        </button>
      `).join('')}
    </div>
  `;

  container.appendChild(nav);
  _navEl = nav;

  // Wire click handlers — dynamic import to avoid circular deps
  nav.querySelectorAll('.mobile-nav-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabId = btn.dataset.tab;
      const route = btn.dataset.route;
      updateActiveTab(tabId);
      import('../mobile-main.js').then(m => {
        if (typeof m.navigate === 'function') {
          m.navigate(route);
        } else if (typeof m.mobileNavigate === 'function') {
          m.mobileNavigate(route);
        }
      });
    });
  });

  console.log('[MOBILE] BottomNav rendered, active:', activeTab);
  return nav;
}

/**
 * Updates the highlighted tab without re-rendering the entire nav.
 * @param {string} tabId — e.g. 'search'
 */
export function updateActiveTab(tabId) {
  if (!_navEl) return;
  _navEl.querySelectorAll('.mobile-nav-tab').forEach(btn => {
    const isActive = btn.dataset.tab === tabId;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', String(isActive));
  });
}

/**
 * Updates the message tab badge count.
 * @param {number} count 
 */
export function updateMessageBadge(count) {
  if (!_navEl) return;
  const badge = _navEl.querySelector('#mobile-nav-badge-messages');
  if (!badge) return;
  if (count > 0) {
    badge.textContent = count > 99 ? '99+' : count;
    badge.style.display = 'block';
  } else {
    badge.style.display = 'none';
  }
}

/**
 * Maps a URL path to a tab id (kept for backward-compat).
 * @param {string} path
 * @returns {string}
 */
export function getTabForPath(path) {
  if (path === '/' || path === '') return 'home';
  if (path.startsWith('/search')) return 'search';
  if (path.startsWith('/post-listing')) return 'post';
  if (path.startsWith('/dashboard/messages')) return 'messages';
  if (path.startsWith('/dashboard')) return 'profile';
  return 'home';
}
