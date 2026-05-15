/**
 * src/mobile/components/MobileHeader.js
 *
 * Renders a fixed top header for mobile views.
 *
 * Usage:
 *   renderMobileHeader(container, {
 *     title: 'Search',
 *     showBack: true,
 *     onBack: () => navigate('/'),
 *     rightAction: { icon: '⚙️', label: 'Settings', onClick: () => {} }
 *   });
 */

/**
 * @param {HTMLElement} container  — element to prepend the header into (usually document.body or #app)
 * @param {object}      opts
 * @param {string}      opts.title        — centred title text
 * @param {boolean}     [opts.showBack]   — show ← back button (default false)
 * @param {Function}    [opts.onBack]     — custom back handler; falls back to history.back()
 * @param {{ icon:string, label:string, onClick:Function }} [opts.rightAction] — right icon button
 * @returns {{ el: HTMLElement, setTitle: Function, setRightAction: Function, setHomeRightActions: Function }}
 */
export function renderMobileHeader(container, {
  title = '',
  showBack = false,
  onBack = null,
  leftAction = null,
  rightAction = null,
  homeRightActions = null, // { bell: { onClick }, avatar: { src, name, onClick } }
} = {}) {

  // Remove any existing header so we never double-render
  const existing = container.querySelector('.mobile-header');
  if (existing) existing.remove();

  const header = document.createElement('header');
  header.className = 'mobile-header';
  header.setAttribute('role', 'banner');
  
  const showLeft = showBack || leftAction;

  // Build right-side HTML
  const rightHTML = homeRightActions
    ? `<div id="mobile-header-home-actions" style="display:flex;align-items:center;gap:10px;">
        <button id="mobile-header-bell" aria-label="Notifications" style="position:relative;width:44px;height:44px;border-radius:12px;background:#1a1a1a;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          <span id="mobile-header-bell-badge" class="header-badge hidden"></span>
        </button>
        <button id="mobile-header-avatar" aria-label="Profile" style="width:44px;height:44px;border-radius:12px;background:none;border:2.5px solid #f5c842;padding:0;cursor:pointer;overflow:hidden;flex-shrink:0;">
          <img id="mobile-header-avatar-img"
            src="${homeRightActions.avatar?.src || `https://ui-avatars.com/api/?name=${encodeURIComponent(homeRightActions.avatar?.name || 'U')}&background=1e293b&color=fff&bold=true`}"
            alt="Profile"
            style="width:100%;height:100%;object-fit:cover;display:block;"
          />
        </button>
      </div>`
    : `<button
        id="mobile-header-right"
        class="mobile-header-action${rightAction ? '' : ' hidden'}"
        aria-label="${rightAction ? escapeHtml(rightAction.label || 'Action') : 'Action'}"
        ${rightAction ? '' : 'tabindex="-1"'}
      >
        ${rightAction ? rightAction.icon : ''}
        <span id="mobile-header-right-badge" class="header-badge hidden"></span>
      </button>`;

  header.innerHTML = `
    <div class="mobile-header-inner">
      <button
        id="mobile-header-left"
        class="mobile-header-back${showLeft ? '' : ' hidden'}"
        aria-label="${showBack ? 'Go back' : (leftAction ? escapeHtml(leftAction.label || 'Action') : 'Action')}"
        ${showLeft ? '' : 'tabindex="-1"'}
      >${showBack ? '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>' : (leftAction ? leftAction.icon : '')}</button>

      <h1 class="mobile-header-title" id="mobile-header-title">
        ${title === 'LOGO' ? `
          <div class="mobile-logo-pill" style="height:32px; box-shadow:none; border:1.5px solid #1a1a1a;">
            <div class="mobile-logo-left" style="padding:0 8px 0 12px; font-size:0.75rem;">ROOMMATE</div>
            <div class="mobile-logo-right" style="padding:0 12px 0 8px; font-size:0.75rem; background:#fff;">GROUPS</div>
          </div>
        ` : escapeHtml(title)}
      </h1>

      ${rightHTML}
    </div>
  `;

  // Insert at the very top of container
  container.prepend(header);

  // Left button handler
  const leftBtn = header.querySelector('#mobile-header-left');
  leftBtn.addEventListener('click', () => {
    if (showBack) {
      if (typeof onBack === 'function') onBack();
      else history.back();
    } else if (leftAction && typeof leftAction.onClick === 'function') {
      leftAction.onClick();
    }
  });

  // Home dual-action handlers
  if (homeRightActions) {
    const bellBtn = header.querySelector('#mobile-header-bell');
    if (bellBtn && typeof homeRightActions.bell?.onClick === 'function') {
      bellBtn.addEventListener('click', homeRightActions.bell.onClick);
    }
    const avatarBtn = header.querySelector('#mobile-header-avatar');
    if (avatarBtn && typeof homeRightActions.avatar?.onClick === 'function') {
      avatarBtn.addEventListener('click', homeRightActions.avatar.onClick);
    }
  }

  // Right action handler (single button mode)
  const rightBtn = header.querySelector('#mobile-header-right');
  if (rightBtn && rightAction && typeof rightAction.onClick === 'function') {
    rightBtn.addEventListener('click', rightAction.onClick);
  }

  console.log('[MOBILE] Header rendered:', title);

  // ── Public API ────────────────────────────────────────────────
  function setTitle(newTitle) {
    const titleEl = header.querySelector('#mobile-header-title');
    if (newTitle === 'LOGO') {
      titleEl.innerHTML = `
        <div class="mobile-logo-pill" style="height:32px; box-shadow:none; border:1.5px solid #1a1a1a;">
          <div class="mobile-logo-left" style="padding:0 8px 0 12px; font-size:0.75rem;">ROOMMATE</div>
          <div class="mobile-logo-right" style="padding:0 12px 0 8px; font-size:0.75rem; background:#fff;">GROUPS</div>
        </div>
      `;
    } else {
      titleEl.textContent = newTitle;
    }
  }

  function setLeftAction(newAction) {
    const btn = header.querySelector('#mobile-header-left');
    if (newAction) {
      btn.innerHTML = newAction.icon || '';
      btn.setAttribute('aria-label', newAction.label || 'Action');
      btn.className = 'mobile-header-back';
      btn.removeAttribute('tabindex');
      // Replace listener
      const freshBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(freshBtn, btn);
      if (typeof newAction.onClick === 'function') {
        freshBtn.addEventListener('click', newAction.onClick);
      }
    } else {
      btn.className = 'mobile-header-back hidden';
      btn.setAttribute('tabindex', '-1');
    }
  }

  function setRightAction(newAction) {
    // If home dual-actions are mounted, ignore single-action calls
    if (header.querySelector('#mobile-header-home-actions')) return;
    const btn = header.querySelector('#mobile-header-right');
    if (!btn) return;
    if (newAction) {
      btn.innerHTML = newAction.icon || '';
      btn.setAttribute('aria-label', newAction.label || 'Action');
      btn.className = 'mobile-header-action';
      btn.removeAttribute('tabindex');
      // Replace listener
      const freshBtn = btn.cloneNode(true);
      btn.parentNode.replaceChild(freshBtn, btn);
      if (typeof newAction.onClick === 'function') {
        freshBtn.addEventListener('click', newAction.onClick);
      }
    } else {
      btn.className = 'mobile-header-action hidden';
      btn.setAttribute('tabindex', '-1');
    }
  }

  function setRightBadge(count) {
    // Support both single-button badge and bell badge in dual-action mode
    const badge = header.querySelector('#mobile-header-bell-badge') ||
                  header.querySelector('#mobile-header-right-badge');
    if (!badge) return;
    if (count > 0) {
      badge.textContent = count > 99 ? '99+' : count;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  }

  function setHomeRightActions(actions) {
    if (!actions) return;

    // If home-actions area not yet in DOM, build it (replaces single-button right)
    let homeActionsEl = header.querySelector('#mobile-header-home-actions');
    if (!homeActionsEl) {
      // Remove old single-button right if present
      const oldRight = header.querySelector('#mobile-header-right');
      if (oldRight) oldRight.remove();

      const avatarSrc = actions.avatar?.src ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(actions.avatar?.name || 'U')}&background=1e293b&color=fff&bold=true`;

      homeActionsEl = document.createElement('div');
      homeActionsEl.id = 'mobile-header-home-actions';
      homeActionsEl.style.cssText = 'display:flex;align-items:center;gap:10px;';
      homeActionsEl.innerHTML = `
        <button id="mobile-header-bell" aria-label="Notifications" style="position:relative;width:44px;height:44px;border-radius:12px;background:#1a1a1a;border:none;display:flex;align-items:center;justify-content:center;cursor:pointer;">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
          <span id="mobile-header-bell-badge" class="header-badge hidden"></span>
        </button>
        <button id="mobile-header-avatar" aria-label="Profile" style="width:44px;height:44px;border-radius:12px;background:none;border:2.5px solid #f5c842;padding:0;cursor:pointer;overflow:hidden;flex-shrink:0;">
          <img id="mobile-header-avatar-img"
            src="${avatarSrc}"
            alt="Profile"
            style="width:100%;height:100%;object-fit:cover;display:block;"
          />
        </button>
      `;

      // Append to header inner
      const inner = header.querySelector('.mobile-header-inner');
      if (inner) inner.appendChild(homeActionsEl);

      // Attach click handlers
      const bellBtn = homeActionsEl.querySelector('#mobile-header-bell');
      if (bellBtn && typeof actions.bell?.onClick === 'function') {
        bellBtn.addEventListener('click', actions.bell.onClick);
      }
      const avatarBtn = homeActionsEl.querySelector('#mobile-header-avatar');
      if (avatarBtn && typeof actions.avatar?.onClick === 'function') {
        avatarBtn.addEventListener('click', actions.avatar.onClick);
      }
    } else {
      // Already exists — just update avatar src if provided
      if (actions.avatar?.src) {
        const img = homeActionsEl.querySelector('#mobile-header-avatar-img');
        if (img) img.src = actions.avatar.src;
      }
    }

    // Always sync badge if provided
    if (actions.badge !== undefined) setRightBadge(actions.badge);
  }

  function showBackButton(show, handler) {
    const b = header.querySelector('#mobile-header-left');
    if (show) {
      b.innerHTML = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>';
      b.classList.remove('hidden');
      b.removeAttribute('tabindex');
      b.setAttribute('aria-label', 'Go back');
      if (handler) {
        const fresh = b.cloneNode(true);
        b.parentNode.replaceChild(fresh, b);
        fresh.addEventListener('click', handler);
      }
    } else {
      b.classList.add('hidden');
      b.setAttribute('tabindex', '-1');
    }
  }

  return { el: header, setTitle, setLeftAction, setRightAction, setRightBadge, setHomeRightActions, showBackButton };
}

// ── Helpers ───────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
