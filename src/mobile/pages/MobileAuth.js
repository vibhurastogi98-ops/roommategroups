/**
 * src/mobile/pages/MobileAuth.js
 * Full-screen login / register — no bottom nav on this route.
 * Exports: async init(container)
 */

import { login, register, getPasswordStrength } from '../../services/auth.js';
import { initGoogleSignIn } from '../../services/googleAuth.js';

export async function init(container) {
  console.log('[MOBILE] Auth page init');
  _render(container, 'login');
}
export const renderMobileAuth = init;

// ── Main render ───────────────────────────────────────────────
function _render(container, tab) {
  container.innerHTML = `
    <div style="min-height:100%;display:flex;flex-direction:column;background:#fff;overflow-y:auto;-webkit-overflow-scrolling:touch;">

      <div style="background:linear-gradient(135deg,#1a1a1a 0%,#000000 100%);padding:48px 24px 32px;text-align:center;flex-shrink:0;">
        <div class="mobile-logo-pill" style="margin-bottom:20px;border:1px solid rgba(255,255,255,0.15);">
          <div class="mobile-logo-left">Roommate</div>
          <div class="mobile-logo-right">Groups</div>
        </div>
        <div style="font-size:1.4rem;font-weight:900;color:#fff;letter-spacing:-0.03em;line-height:1.25;">Find Rooms, Rentals & <br><span style="opacity:0.8;">Roommates</span> — All in One Place</div>
      </div>

      <div id="mauth-tabs" style="display:flex;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
        <button id="tab-login" style="flex:1;padding:14px;border:none;cursor:pointer;font-weight:700;font-size:0.9rem;background:transparent;
          color:${tab === 'login' ? 'var(--mobile-accent)' : '#94a3b8'};
          border-bottom:2.5px solid ${tab === 'login' ? 'var(--mobile-accent)' : 'transparent'};
          transition:color .2s,border-color .2s;">Sign In</button>
        <button id="tab-register" style="flex:1;padding:14px;border:none;cursor:pointer;font-weight:700;font-size:0.9rem;background:transparent;
          color:${tab === 'register' ? 'var(--mobile-accent)' : '#94a3b8'};
          border-bottom:2.5px solid ${tab === 'register' ? 'var(--mobile-accent)' : 'transparent'};
          transition:color .2s,border-color .2s;">Register</button>
      </div>

      <div id="mauth-body" style="flex:1;padding:28px 24px 48px;max-width:480px;width:100%;margin:0 auto;box-sizing:border-box;">
        ${tab === 'login' ? _loginHTML() : _registerHTML()}
      </div>
    </div>
  `;

  container.querySelector('#tab-login').onclick = () => { if (tab !== 'login') _render(container, 'login'); };
  container.querySelector('#tab-register').onclick = () => { if (tab !== 'register') _render(container, 'register'); };
  _wireForm(container, tab);
}

function _loginHTML() {
  return `
  <form id="mauth-form" novalidate>
    <div class="mobile-form-group">
      <label class="mobile-form-label">Email</label>
      <input class="mobile-input" id="f-email" type="email" placeholder="you@example.com" autocomplete="email" inputmode="email">
      <div id="e-email" style="display:none;color:#ef4444;font-size:0.78rem;font-weight:600;margin-top:4px;"></div>
    </div>
    <div class="mobile-form-group">
      <label class="mobile-form-label">Password</label>
      <div style="position:relative;">
        <input class="mobile-input" id="f-password" type="password" placeholder="••••••••" autocomplete="current-password" style="padding-right:52px;">
        <button type="button" id="pw-toggle" aria-label="Show/hide password"
          style="position:absolute;right:0;top:0;width:52px;height:52px;background:none;border:none;cursor:pointer;font-size:1.1rem;color:#94a3b8;">👁</button>
      </div>
      <div id="e-password" style="display:none;color:#ef4444;font-size:0.78rem;font-weight:600;margin-top:4px;"></div>
    </div>
    <div id="e-global" style="display:none;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:10px;padding:10px 14px;color:#ef4444;font-size:.85rem;font-weight:600;margin-bottom:14px;"></div>
    <button type="submit" id="mauth-submit" class="mobile-btn mobile-btn-accent" style="height:52px;font-size:1rem;margin-bottom:14px;">→ Sign In</button>
    <div style="display:flex;align-items:center;gap:10px;margin:16px 0;font-size:.78rem;color:#94a3b8;">
      <div style="flex:1;height:1px;background:#e2e8f0;"></div>or<div style="flex:1;height:1px;background:#e2e8f0;"></div>
    </div>
    <button type="button" id="google-btn" class="mobile-btn mobile-btn-outline" style="height:52px;gap:10px;">
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" height="20" alt=""> Continue with Google
    </button>
  </form>`;
}

function _registerHTML() {
  return `
  <form id="mauth-form" novalidate>
    <div class="mobile-form-group">
      <label class="mobile-form-label">Full Name</label>
      <input class="mobile-input" id="f-name" type="text" placeholder="Your full name" autocomplete="name">
      <div id="e-name" style="display:none;color:#ef4444;font-size:.78rem;font-weight:600;margin-top:4px;"></div>
    </div>
    <div class="mobile-form-group">
      <label class="mobile-form-label">Email</label>
      <input class="mobile-input" id="f-email" type="email" placeholder="you@example.com" autocomplete="email" inputmode="email">
      <div id="e-email" style="display:none;color:#ef4444;font-size:.78rem;font-weight:600;margin-top:4px;"></div>
    </div>
    <div class="mobile-form-group">
      <label class="mobile-form-label">Password</label>
      <div style="position:relative;">
        <input class="mobile-input" id="f-password" type="password" placeholder="Min 8 characters" autocomplete="new-password" style="padding-right:52px;">
        <button type="button" id="pw-toggle" aria-label="Show/hide password"
          style="position:absolute;right:0;top:0;width:52px;height:52px;background:none;border:none;cursor:pointer;font-size:1.1rem;color:#94a3b8;">👁</button>
      </div>
      <div id="strength-wrap" style="display:none;margin-top:6px;">
        <div style="height:4px;background:#e2e8f0;border-radius:2px;overflow:hidden;">
          <div id="strength-bar" style="height:100%;border-radius:2px;width:0;transition:width .3s,background .3s;"></div>
        </div>
        <div id="strength-label" style="font-size:.72rem;font-weight:600;margin-top:3px;"></div>
      </div>
      <div id="e-password" style="display:none;color:#ef4444;font-size:.78rem;font-weight:600;margin-top:4px;"></div>
    </div>
    <div class="mobile-form-group">
      <label class="mobile-form-label">Confirm Password</label>
      <input class="mobile-input" id="f-confirm" type="password" placeholder="Repeat password" autocomplete="new-password">
      <div id="e-confirm" style="display:none;color:#ef4444;font-size:.78rem;font-weight:600;margin-top:4px;"></div>
    </div>
    <div id="e-global" style="display:none;background:rgba(239,68,68,.08);border:1px solid rgba(239,68,68,.2);border-radius:10px;padding:10px 14px;color:#ef4444;font-size:.85rem;font-weight:600;margin-bottom:14px;"></div>
    <button type="submit" id="mauth-submit" class="mobile-btn mobile-btn-accent" style="height:52px;font-size:1rem;">🚀 Create Account</button>
  </form>`;
}

// ── Event wiring ──────────────────────────────────────────────
function _wireForm(container, tab) {
  // Password toggle
  const pwIn = container.querySelector('#f-password');
  container.querySelector('#pw-toggle')?.addEventListener('click', () => {
    pwIn.type = pwIn.type === 'password' ? 'text' : 'password';
    container.querySelector('#pw-toggle').textContent = pwIn.type === 'password' ? '👁' : '🙈';
  });

  // Strength bar (register)
  if (tab === 'register') {
    pwIn?.addEventListener('input', () => {
      const wrap = container.querySelector('#strength-wrap');
      const bar = container.querySelector('#strength-bar');
      const label = container.querySelector('#strength-label');
      if (!wrap) return;
      if (!pwIn.value) { wrap.style.display = 'none'; return; }
      const s = getPasswordStrength(pwIn.value);
      wrap.style.display = '';
      bar.style.width = `${s.percent}%`;
      bar.style.background = s.color;
      label.textContent = s.label;
      label.style.color = s.color;
    });
  }

  // Google sign-in (login only)
  container.querySelector('#google-btn')?.addEventListener('click', () => {
    const btn = container.querySelector('#google-btn');
    btn.disabled = true; btn.textContent = '⏳ Connecting…';
    _clearErrors(container);
    initGoogleSignIn(
      async () => {
        const { navigate } = await import('../mobile-main.js');
        navigate('home');
      },
      (msg) => {
        btn.disabled = false;
        btn.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" height="20" alt=""> Continue with Google';
        _showErr(container, 'e-global', msg || 'Google sign-in failed.');
      }
    );
  });

  // Form submit
  const submit = container.querySelector('#mauth-submit');
  container.querySelector('#mauth-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    _clearErrors(container);

    const email = (container.querySelector('#f-email')?.value || '').trim();
    const password = pwIn?.value || '';
    const name = (container.querySelector('#f-name')?.value || '').trim();
    const confirm = (container.querySelector('#f-confirm')?.value || '');

    let ok = true;
    if (tab === 'register' && !name) { _showErr(container, 'e-name', 'Name is required.'); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { _showErr(container, 'e-email', 'Enter a valid email.'); ok = false; }
    if (password.length < 6) { _showErr(container, 'e-password', 'Min 6 characters.'); ok = false; }
    if (tab === 'register' && password !== confirm) { _showErr(container, 'e-confirm', 'Passwords do not match.'); ok = false; }
    if (!ok) return;

    submit.disabled = true; submit.textContent = '⏳ Please wait…'; submit.style.opacity = '0.75';

    try {
      const res = tab === 'register'
        ? await register({ fullName: name, email, password })
        : await login(email, password);
      if (!res?.success) throw new Error(res?.error || 'Authentication failed.');
      console.log('[MOBILE] Auth success → home');
      const { navigate } = await import('../mobile-main.js');
      navigate('home');
    } catch (err) {
      console.log('[MOBILE] Auth error:', err?.message);
      _showErr(container, 'e-global', err?.message || 'Something went wrong.');
      submit.disabled = false;
      submit.textContent = tab === 'register' ? '🚀 Create Account' : '→ Sign In';
      submit.style.opacity = '1';
    }
  });
}

function _showErr(container, id, msg) {
  const el = container.querySelector('#' + id);
  if (el) { el.textContent = msg; el.style.display = ''; }
}
function _clearErrors(container) {
  container.querySelectorAll('[id^="e-"]').forEach(el => { el.style.display = 'none'; el.textContent = ''; });
}
