/**
 * src/mobile/components/BottomSheet.js
 *
 * Singleton bottom sheet — replaces all desktop modals on mobile.
 *
 * Usage:
 *   showBottomSheet({ title, content, actions, onClose })
 *   hideBottomSheet()
 */

let _backdrop = null;
let _sheet    = null;
let _isOpen   = false;

// ── Public: showBottomSheet ───────────────────────────────────
export function showBottomSheet({ title = '', content = '', actions = [], onClose } = {}) {
  hideBottomSheet(true); // close any existing one immediately

  console.log('[MOBILE] BottomSheet:', title);

  // ── Backdrop ──
  _backdrop = document.createElement('div');
  _backdrop.className = 'mobile-sheet-backdrop';
  _backdrop.setAttribute('role', 'presentation');
  document.body.appendChild(_backdrop);
  
  // ── Lock background scroll ──
  const activePage = document.querySelector('.mobile-page:not(.exit)');
  if (activePage) activePage.classList.add('no-scroll');

  // ── Sheet panel ──
  _sheet = document.createElement('div');
  _sheet.className = 'mobile-sheet';
  _sheet.setAttribute('role', 'dialog');
  _sheet.setAttribute('aria-modal', 'true');
  _sheet.setAttribute('aria-label', title);

  const actionsHtml = actions.map((a, i) => `
    <button
      id="bs-action-${i}"
      class="mobile-btn ${a.variant === 'accent' ? 'mobile-btn-accent' : a.variant === 'danger' ? 'mobile-btn-primary' : 'mobile-btn-outline'}"
      style="${a.variant === 'danger' ? 'background:#ef4444;' : ''}"
    >${a.label}</button>
  `).join('');

  _sheet.innerHTML = `
    <div class="mobile-sheet-handle" id="bs-handle" style="cursor:grab;"></div>
    ${title ? `<div class="mobile-sheet-title">${title}</div>` : ''}
    <div class="mobile-sheet-content" id="bs-content">${content}</div>
    ${actionsHtml ? `<div class="mobile-sheet-footer">${actionsHtml}</div>` : ''}
  `;

  document.body.appendChild(_sheet);

  // ── Animate in ──
  requestAnimationFrame(() => {
    _backdrop.classList.add('visible');
    _sheet.classList.add('open');
    _isOpen = true;
  });

  // ── Action callbacks ──
  actions.forEach((a, i) => {
    _sheet.querySelector(`#bs-action-${i}`)?.addEventListener('click', () => {
      if (typeof a.onClick === 'function') a.onClick();
      if (a.closeOnClick !== false) hideBottomSheet();
    });
  });

  // ── Backdrop tap → close ──
  _backdrop.addEventListener('click', () => {
    hideBottomSheet();
    onClose?.();
  });

  // ── Drag-down gesture ──
  _attachDragGesture(_sheet, () => { hideBottomSheet(); onClose?.(); });

  return { hide: () => { hideBottomSheet(); onClose?.(); } };
}

// ── Public: hideBottomSheet ───────────────────────────────────
export function hideBottomSheet(immediate = false) {
  if (!_isOpen || !_sheet || !_backdrop) {
    if (!immediate) return;
    const oldSheet = document.querySelector('.mobile-sheet');
    const oldBackdrop = document.querySelector('.mobile-sheet-backdrop');
    if (oldSheet) oldSheet.remove();
    if (oldBackdrop) oldBackdrop.remove();
    return;
  }

  _sheet.classList.remove('open');
  _backdrop.classList.remove('visible');
  _isOpen = false;

  const sheet = _sheet;
  const backdrop = _backdrop;
  _sheet = null;
  _backdrop = null;

  const activePage = document.querySelector('.mobile-page:not(.exit)');
  if (activePage) activePage.classList.remove('no-scroll');

  if (immediate) {
    sheet.remove();
    backdrop.remove();
  } else {
    setTimeout(() => {
      if (sheet.parentNode) sheet.remove();
      if (backdrop.parentNode) backdrop.remove();
    }, 320);
  }
}

// ── Drag gesture helper ───────────────────────────────────────
function _attachDragGesture(sheetEl, onDismiss) {
  let startY    = 0;
  let currentY  = 0;
  let isDragging = false;

  const handle = sheetEl.querySelector('#bs-handle') || sheetEl;

  handle.addEventListener('touchstart', (e) => {
    startY     = e.touches[0].clientY;
    isDragging = true;
    sheetEl.style.transition = 'none';
  }, { passive: true });

  handle.addEventListener('touchmove', (e) => {
    if (!isDragging) return;
    currentY = e.touches[0].clientY;
    const delta = Math.max(0, currentY - startY);
    sheetEl.style.transform = `translateY(${delta}px)`;
  }, { passive: true });

  handle.addEventListener('touchend', () => {
    if (!isDragging) return;
    isDragging = false;
    sheetEl.style.transition = '';

    const delta = currentY - startY;
    if (delta > 100) {
      onDismiss();
    } else {
      sheetEl.style.transform = '';
    }
  });
}
