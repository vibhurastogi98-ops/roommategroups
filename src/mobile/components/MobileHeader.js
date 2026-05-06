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
 * @returns {{ el: HTMLElement, setTitle: Function, setRightAction: Function }}
 */
export function renderMobileHeader(container, {
  title = '',
  showBack = false,
  onBack = null,
  leftAction = null,
  rightAction = null,
} = {}) {

  // Remove any existing header so we never double-render
  const existing = container.querySelector('.mobile-header');
  if (existing) existing.remove();

  const header = document.createElement('header');
  header.className = 'mobile-header';
  header.setAttribute('role', 'banner');
  
  const showLeft = showBack || leftAction;

  header.innerHTML = `
    <div class="mobile-header-inner">
      <button
        id="mobile-header-left"
        class="mobile-header-back${showLeft ? '' : ' hidden'}"
        aria-label="${showBack ? 'Go back' : (leftAction ? escapeHtml(leftAction.label || 'Action') : 'Action')}"
        ${showLeft ? '' : 'tabindex="-1"'}
      >${showBack ? '&#8592;' : (leftAction ? leftAction.icon : '')}</button>

      <h1 class="mobile-header-title" id="mobile-header-title">
        ${title === 'LOGO' ? `
          <div class="mobile-logo-pill" style="height:32px; box-shadow:none; border:1.5px solid #1a1a1a;">
            <div class="mobile-logo-left" style="padding:0 8px 0 12px; font-size:0.75rem;">ROOMMATE</div>
            <div class="mobile-logo-right" style="padding:0 12px 0 8px; font-size:0.75rem; background:#fff;">GROUPS</div>
          </div>
        ` : escapeHtml(title)}
      </h1>

      <button
        id="mobile-header-right"
        class="mobile-header-action${rightAction ? '' : ' hidden'}"
        aria-label="${rightAction ? escapeHtml(rightAction.label || 'Action') : 'Action'}"
        ${rightAction ? '' : 'tabindex="-1"'}
      >${rightAction ? rightAction.icon : ''}</button>
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

  // Right action handler
  const rightBtn = header.querySelector('#mobile-header-right');
  if (rightAction && typeof rightAction.onClick === 'function') {
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
    const btn = header.querySelector('#mobile-header-right');
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

  function showBackButton(show, handler) {
    const b = header.querySelector('#mobile-header-left');
    if (show) {
      b.innerHTML = '&#8592;';
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

  return { el: header, setTitle, setLeftAction, setRightAction, showBackButton };
}

// ── Helpers ───────────────────────────────────────────────────
function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
