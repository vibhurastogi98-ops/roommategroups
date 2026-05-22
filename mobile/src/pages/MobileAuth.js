/**
 * src/mobile/pages/MobileAuth.js
 * Premium Modern Auth Screen (Sign In / Sign Up)
 */

import { login, register, getPasswordStrength } from '../../../web/src/services/auth.js';
import { initGoogleSignIn } from '../../../web/src/services/googleAuth.js';

// Premium Auth Styles
const authStyles = `
  .auth-container {
    min-height: 100%;
    display: flex;
    flex-direction: column;
    background: #ffffff;
    color: #000000;
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    font-family: var(--font, 'Inter', sans-serif);
    padding-bottom: env(safe-area-inset-bottom, 0px);
  }

  .auth-hero {
    padding: max(24px, env(safe-area-inset-top, 40px)) 24px 16px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    animation: authFadeDown 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .auth-logo {
    display: inline-flex;
    align-items: center;
    height: 36px;
    background: #000;
    border-radius: 12px;
    overflow: hidden;
    margin-bottom: 20px;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  }
  .auth-logo-l { background: #000; color: #fff; padding: 0 12px 0 16px; font-weight: 900; font-size: 0.85rem; letter-spacing: 0.05em; text-transform: uppercase; }
  .auth-logo-r { background: #fff; color: #000; padding: 0 16px 0 12px; font-weight: 900; font-size: 0.85rem; letter-spacing: 0.05em; text-transform: uppercase; height: 100%; display: flex; align-items: center; }

  .auth-title {
    font-size: 1.9rem;
    font-weight: 800;
    line-height: 1.1;
    letter-spacing: -0.04em;
    margin-bottom: 8px;
    color: #000;
  }

  .auth-subtitle {
    font-size: 0.95rem;
    color: #666;
    max-width: 280px;
    line-height: 1.3;
  }

  .auth-tabs-wrapper {
    position: relative;
    display: flex;
    background: #f4f4f5;
    border-radius: 14px;
    margin: 0 24px 20px;
    padding: 4px;
    animation: authFadeIn 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s forwards;
    opacity: 0;
  }

  .auth-tab {
    flex: 1;
    text-align: center;
    padding: 12px 0;
    font-size: 0.95rem;
    font-weight: 700;
    color: #71717a;
    border: none;
    background: transparent;
    cursor: pointer;
    border-radius: 10px;
    transition: color 0.3s ease;
    position: relative;
    z-index: 2;
    -webkit-tap-highlight-color: transparent;
  }

  .auth-tab.active {
    color: #000;
  }

  .auth-tab-bg {
    position: absolute;
    top: 4px;
    bottom: 4px;
    width: calc(50% - 4px);
    background: #fff;
    border-radius: 10px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.02);
    transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.1);
    z-index: 1;
  }
  
  .auth-tab-bg.right {
    transform: translateX(100%);
  }

  .auth-form-wrapper {
    flex: 1;
    padding: 0 24px 24px;
    animation: authSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s forwards;
    opacity: 0;
  }

  .auth-form-group {
    margin-bottom: 16px;
    position: relative;
  }

  .auth-label {
    display: block;
    font-size: 0.8rem;
    font-weight: 700;
    margin-bottom: 6px;
    color: #18181b;
  }

  .auth-input-wrapper {
    position: relative;
  }

  .auth-input {
    width: 100%;
    height: 52px;
    background: #f4f4f5;
    border: 2px solid transparent;
    border-radius: 14px;
    padding: 0 16px;
    font-size: 1rem;
    font-weight: 500;
    color: #000;
    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    box-sizing: border-box;
    -webkit-appearance: none;
  }

  .auth-input::placeholder {
    color: #a1a1aa;
  }

  .auth-input:focus {
    outline: none;
    background: #fff;
    border-color: #000;
    box-shadow: 0 4px 16px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }

  .auth-pw-toggle {
    position: absolute;
    right: 16px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    color: #a1a1aa;
    cursor: pointer;
    padding: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: color 0.2s ease, transform 0.2s ease;
  }

  .auth-pw-toggle:hover { color: #000; }
  .auth-pw-toggle:active { transform: translateY(-50%) scale(0.9); }

  .auth-error {
    display: none;
    color: #ef4444;
    font-size: 0.8rem;
    font-weight: 600;
    margin-top: 6px;
    animation: authFadeIn 0.3s ease forwards;
  }

  .auth-global-error {
    display: none;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #b91c1c;
    padding: 12px 16px;
    border-radius: 14px;
    font-size: 0.85rem;
    font-weight: 600;
    margin-bottom: 20px;
    text-align: center;
    animation: authSlideDown 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
  }

  .auth-btn-primary {
    width: 100%;
    height: 52px;
    background: #000;
    color: #fff;
    border: none;
    border-radius: 14px;
    font-size: 1rem;
    font-weight: 700;
    cursor: pointer;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), background 0.2s ease, box-shadow 0.2s ease;
    margin-top: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .auth-btn-primary:active {
    transform: scale(0.96);
    background: #18181b;
    box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  }

  .auth-divider {
    display: flex;
    align-items: center;
    text-align: center;
    margin: 20px 0;
    color: #a1a1aa;
    font-size: 0.8rem;
    font-weight: 600;
  }
  .auth-divider::before, .auth-divider::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #e4e4e7;
  }
  .auth-divider:not(:empty)::before { margin-right: 16px; }
  .auth-divider:not(:empty)::after { margin-left: 16px; }

  .auth-social-container {
    display: flex;
    gap: 12px;
  }

  .auth-social-btn {
    flex: 1;
    height: 52px;
    background: #fff;
    color: #000;
    border: 1.5px solid #e4e4e7;
    border-radius: 14px;
    font-size: 0.95rem;
    font-weight: 700;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), border-color 0.2s ease, background 0.2s ease;
  }

  .auth-social-btn:active {
    transform: scale(0.96);
    border-color: #d4d4d8;
    background: #fafafa;
  }

  /* Animations */
  @keyframes authFadeDown {
    from { opacity: 0; transform: translateY(-24px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes authSlideUp {
    from { opacity: 0; transform: translateY(32px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes authFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes authSlideDown {
    from { opacity: 0; transform: translateY(-16px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes authShake {
    0%, 100% { transform: translateX(0); }
    20% { transform: translateX(-6px); }
    40% { transform: translateX(6px); }
    60% { transform: translateX(-4px); }
    80% { transform: translateX(4px); }
  }
  
  /* Container transition */
  .auth-form-content {
    animation: authFadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
  }
`;

export async function init(container) {
  console.log('[MOBILE] Auth page init');
  
  // Inject styles if not present
  if (!document.getElementById('auth-premium-styles')) {
    const styleEl = document.createElement('style');
    styleEl.id = 'auth-premium-styles';
    styleEl.innerHTML = authStyles;
    document.head.appendChild(styleEl);
  }

  let currentTab = 'login';

  // Main UI Skeleton
  container.innerHTML = `
    <div class="auth-container">
      <div class="auth-hero">
        <div class="auth-logo">
          <div class="auth-logo-l">Roommate</div>
          <div class="auth-logo-r">Groups</div>
        </div>
        <h1 class="auth-title" id="auth-title">Welcome Back</h1>
        <p class="auth-subtitle" id="auth-subtitle">Find rooms, rentals, and roommates.</p>
      </div>

      <div class="auth-tabs-wrapper">
        <div class="auth-tab-bg" id="auth-tab-indicator"></div>
        <button class="auth-tab active" id="tab-login">Sign In</button>
        <button class="auth-tab" id="tab-register">Sign Up</button>
      </div>

      <div class="auth-form-wrapper" id="auth-form-wrapper"></div>
    </div>
  `;

  const wrapper = container.querySelector('#auth-form-wrapper');
  const titleEl = container.querySelector('#auth-title');
  const subtitleEl = container.querySelector('#auth-subtitle');
  const indicator = container.querySelector('#auth-tab-indicator');
  const tabLogin = container.querySelector('#tab-login');
  const tabRegister = container.querySelector('#tab-register');

  const renderForm = (tab) => {
    // Smooth text transition
    titleEl.style.opacity = '0';
    subtitleEl.style.opacity = '0';
    titleEl.style.transform = 'translateY(4px)';
    subtitleEl.style.transform = 'translateY(4px)';
    
    setTimeout(() => {
      if (tab === 'login') {
        titleEl.textContent = 'Welcome Back';
        subtitleEl.textContent = 'Find rooms, rentals, and roommates.';
      } else {
        titleEl.textContent = 'Create Account';
        subtitleEl.textContent = 'Start finding your perfect roommate.';
      }
      titleEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      subtitleEl.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
      titleEl.style.opacity = '1';
      subtitleEl.style.opacity = '1';
      titleEl.style.transform = 'translateY(0)';
      subtitleEl.style.transform = 'translateY(0)';
    }, 200);

    // Update tabs
    if (tab === 'login') {
      tabLogin.classList.add('active');
      tabRegister.classList.remove('active');
      indicator.classList.remove('right');
    } else {
      tabRegister.classList.add('active');
      tabLogin.classList.remove('active');
      indicator.classList.add('right');
    }

    // Inject Form content
    wrapper.innerHTML = `<div class="auth-form-content">
      ${tab === 'login' ? _loginHTML() : _registerHTML()}
    </div>`;

    _wireForm(container, tab);
  };

  // Initial render
  renderForm(currentTab);

  // Tab listeners
  tabLogin.onclick = () => {
    if (currentTab !== 'login') {
      currentTab = 'login';
      renderForm(currentTab);
    }
  };
  tabRegister.onclick = () => {
    if (currentTab !== 'register') {
      currentTab = 'register';
      renderForm(currentTab);
    }
  };
}
export const renderMobileAuth = init;

function _socialHTML() {
  return `
    <div class="auth-divider">or continue with</div>
    <div class="auth-social-container">
      <button type="button" class="auth-social-btn google-btn">
        <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" height="20" alt="">
        Google
      </button>
      <button type="button" class="auth-social-btn apple-btn">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="black"><path d="M16.365 14.363c-.021-3.155 2.584-4.685 2.698-4.757-1.465-2.148-3.738-2.441-4.542-2.483-1.92-.193-3.751 1.134-4.733 1.134-.98 0-2.511-1.1-4.092-1.07-2.051.026-3.947 1.196-5.006 3.036-2.138 3.708-.546 9.188 1.536 12.193 1.018 1.467 2.222 3.12 3.804 3.06 1.517-.06 2.091-.983 3.931-.983 1.838 0 2.38.983 3.957.953 1.637-.027 2.685-1.492 3.693-2.964 1.164-1.696 1.644-3.342 1.666-3.428-.035-.015-3.197-1.226-3.228-4.717zm-2.493-6.903c.833-1.008 1.393-2.413 1.24-3.818-1.192.048-2.658.793-3.511 1.822-.68.82-1.303 2.254-1.127 3.633 1.332.103 2.681-.611 3.398-1.637z"/></svg>
        Apple
      </button>
    </div>
  `;
}

function _loginHTML() {
  return `
  <form id="mauth-form" novalidate>
    <div id="e-global" class="auth-global-error"></div>
    
    <div class="auth-form-group">
      <label class="auth-label">Email Address</label>
      <input class="auth-input" id="f-email" type="email" placeholder="hello@example.com" autocomplete="email" inputmode="email">
      <div id="e-email" class="auth-error"></div>
    </div>

    <div class="auth-form-group">
      <label class="auth-label">Password</label>
      <div class="auth-input-wrapper">
        <input class="auth-input" id="f-password" type="password" placeholder="••••••••" autocomplete="current-password" style="padding-right: 56px;">
        <button type="button" id="pw-toggle" class="auth-pw-toggle" aria-label="Show/hide password">
          <svg id="icon-eye" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          <svg id="icon-eye-off" style="display:none;" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
        </button>
      </div>
      <div id="e-password" class="auth-error"></div>
    </div>

    <button type="submit" id="mauth-submit" class="auth-btn-primary">Sign In</button>

    ${_socialHTML()}
  </form>`;
}

function _registerHTML() {
  return `
  <form id="mauth-form" novalidate>
    <div id="e-global" class="auth-global-error"></div>
    
    <div class="auth-form-group">
      <label class="auth-label">Full Name</label>
      <input class="auth-input" id="f-name" type="text" placeholder="John Doe" autocomplete="name">
      <div id="e-name" class="auth-error"></div>
    </div>

    <div class="auth-form-group">
      <label class="auth-label">Email Address</label>
      <input class="auth-input" id="f-email" type="email" placeholder="hello@example.com" autocomplete="email" inputmode="email">
      <div id="e-email" class="auth-error"></div>
    </div>

    <div class="auth-form-group">
      <label class="auth-label">Password</label>
      <div class="auth-input-wrapper">
        <input class="auth-input" id="f-password" type="password" placeholder="Min 8 characters" autocomplete="new-password" style="padding-right: 56px;">
        <button type="button" id="pw-toggle" class="auth-pw-toggle" aria-label="Show/hide password">
          <svg id="icon-eye" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"></path><circle cx="12" cy="12" r="3"></circle></svg>
          <svg id="icon-eye-off" style="display:none;" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"></path><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"></path><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"></path><line x1="2" y1="2" x2="22" y2="22"></line></svg>
        </button>
      </div>
      <div id="strength-wrap" style="display:none; margin-top:12px;">
        <div style="height:4px;background:#e4e4e7;border-radius:2px;overflow:hidden;">
          <div id="strength-bar" style="height:100%;border-radius:2px;width:0;transition:width 0.4s cubic-bezier(0.16, 1, 0.3, 1), background 0.4s ease;"></div>
        </div>
        <div id="strength-label" style="font-size:0.75rem;font-weight:700;margin-top:8px;transition:color 0.4s ease;"></div>
      </div>
      <div id="e-password" class="auth-error"></div>
    </div>

    <button type="submit" id="mauth-submit" class="auth-btn-primary">Sign Up</button>

    ${_socialHTML()}
  </form>`;
}

function _wireForm(container, tab) {
  const form = container.querySelector('#mauth-form');
  const submitBtn = container.querySelector('#mauth-submit');
  const pwIn = container.querySelector('#f-password');
  const pwToggle = container.querySelector('#pw-toggle');

  // Password toggle
  if (pwToggle && pwIn) {
    pwToggle.addEventListener('click', () => {
      const isPass = pwIn.type === 'password';
      pwIn.type = isPass ? 'text' : 'password';
      container.querySelector('#icon-eye').style.display = isPass ? 'none' : 'block';
      container.querySelector('#icon-eye-off').style.display = isPass ? 'block' : 'none';
    });
  }

  // Strength bar
  if (tab === 'register' && pwIn) {
    pwIn.addEventListener('input', () => {
      const wrap = container.querySelector('#strength-wrap');
      const bar = container.querySelector('#strength-bar');
      const label = container.querySelector('#strength-label');
      if (!wrap) return;
      if (!pwIn.value) { wrap.style.display = 'none'; return; }
      
      const s = getPasswordStrength(pwIn.value);
      wrap.style.display = 'block';
      bar.style.width = `${s.percent}%`;
      bar.style.background = s.color;
      label.textContent = s.label;
      label.style.color = s.color;
    });
  }

  // Google
  const googleBtn = container.querySelector('.google-btn');
  if (googleBtn) {
    googleBtn.addEventListener('click', () => {
      googleBtn.disabled = true; 
      googleBtn.innerHTML = '<span style="opacity:0.7">Wait...</span>';
      _clearErrors(container);
      initGoogleSignIn(
        async (res) => {
          const { navigate } = await import('../mobile-main.js');
          if (res?.user && !res.user.profileComplete) {
            navigate('profile-setup');
          } else {
            navigate('home');
          }
        },
        (msg) => {
          googleBtn.disabled = false;
          googleBtn.innerHTML = '<img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" height="20" alt=""> Google';
          _showErr(container, 'e-global', msg || 'Google sign-in failed.');
        }
      );
    });
  }

  // Apple
  const appleBtn = container.querySelector('.apple-btn');
  if (appleBtn) {
    appleBtn.addEventListener('click', () => {
      _showErr(container, 'e-global', 'Apple Sign-In requires iOS integration.');
    });
  }

  // Submit
  if (form && submitBtn) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      _clearErrors(container);

      const email = (container.querySelector('#f-email')?.value || '').trim();
      const password = pwIn?.value || '';
      const name = (container.querySelector('#f-name')?.value || '').trim();

      let ok = true;
      if (tab === 'register' && !name) { _showErr(container, 'e-name', 'Name is required.'); ok = false; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { _showErr(container, 'e-email', 'Enter a valid email address.'); ok = false; }
      if (password.length < 8) { _showErr(container, 'e-password', 'Minimum 8 characters.'); ok = false; }
      
      if (!ok) {
        form.style.animation = 'none';
        form.offsetHeight; 
        form.style.animation = 'authShake 0.4s ease';
        return;
      }

      submitBtn.disabled = true; 
      submitBtn.innerHTML = '<span style="opacity:0.7">Please wait...</span>'; 
      submitBtn.style.opacity = '0.9';

      try {
        const res = tab === 'register'
          ? await register({ fullName: name, email, password })
          : await login(email, password);
        
        if (!res?.success) throw new Error(res?.error || 'Authentication failed.');
        console.log('[MOBILE] Auth success');
        const { navigate } = await import('../mobile-main.js');
        if (res.user && !res.user.profileComplete) {
          navigate('profile-setup');
        } else {
          navigate('home');
        }
      } catch (err) {
        console.log('[MOBILE] Auth error:', err?.message);
        _showErr(container, 'e-global', err?.message || 'Something went wrong.');
        submitBtn.disabled = false;
        submitBtn.innerHTML = tab === 'register' ? 'Sign Up' : 'Sign In';
        submitBtn.style.opacity = '1';
        
        form.style.animation = 'none';
        form.offsetHeight;
        form.style.animation = 'authShake 0.4s ease';
      }
    });
  }
}

function _showErr(container, id, msg) {
  const el = container.querySelector('#' + id);
  if (el) { 
    el.textContent = msg; 
    el.style.display = 'block'; 
  }
}

function _clearErrors(container) {
  container.querySelectorAll('[id^="e-"]').forEach(el => { 
    el.style.display = 'none'; 
    el.textContent = ''; 
  });
}
