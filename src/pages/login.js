import { login } from '../services/auth.js';
import { navigate } from '../router.js';
import { initGoogleSignIn, displayOneTap } from '../services/googleAuth.js';

// ── Config ──
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 30 * 1000; // 30 seconds
const ATTEMPTS_KEY = 'rg_login_attempts';

// ── Rate Limiting ──
function getAttempts() {
    try { return JSON.parse(localStorage.getItem(ATTEMPTS_KEY)) || { count: 0, lockUntil: 0 }; }
    catch { return { count: 0, lockUntil: 0 }; }
}
function saveAttempts(data) { localStorage.setItem(ATTEMPTS_KEY, JSON.stringify(data)); }
function recordFailedAttempt() {
    const a = getAttempts();
    a.count += 1;
    if (a.count >= MAX_ATTEMPTS) a.lockUntil = Date.now() + LOCKOUT_MS;
    saveAttempts(a);
    return a;
}
function resetAttempts() { localStorage.removeItem(ATTEMPTS_KEY); }
function getLockRemaining() {
    const a = getAttempts();
    if (!a.lockUntil) return 0;
    return Math.max(0, Math.ceil((a.lockUntil - Date.now()) / 1000));
}


export function renderLoginPage(app) {
    app.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <a href="/" class="auth-logo">
            <span class="logo-badge"><span class="logo-badge-left">Roommate</span><span class="logo-badge-right">Groups</span></span>
          </a>
          <h1>Welcome back</h1>
          <p>Sign in to find your perfect room or roommate</p>
        </div>

        <!-- Google Login -->
        <div class="social-login">
          <button type="button" class="social-btn social-google" id="btn-google-login">
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Sign in with Google
          </button>
        </div>

        <div class="auth-divider"><span>or sign in with email</span></div>

        <!-- Login Form -->
        <form class="auth-form" id="login-form" novalidate>
          <div class="form-group">
            <label for="login-email">Email Address</label>
            <div class="input-wrapper">
              <i class="fas fa-envelope"></i>
              <input type="email" id="login-email" class="form-input" placeholder="you@example.com"
                required autocomplete="email" inputmode="email" />
            </div>
            <div class="form-error" id="email-error"></div>
          </div>

          <div class="form-group">
            <div class="label-row">
              <label for="login-password">Password</label>
            </div>
            <div class="input-wrapper">
              <i class="fas fa-lock"></i>
              <input type="password" id="login-password" class="form-input" placeholder="••••••••"
                required autocomplete="current-password" />
              <button type="button" class="password-toggle" id="password-toggle" aria-label="Toggle password visibility">
                <i class="fas fa-eye"></i>
              </button>
            </div>
            <div class="form-error" id="password-error"></div>
          </div>



          <div class="form-row">
            <label class="checkbox-label">
              <input type="checkbox" id="remember-me" />
              <span class="checkmark"></span>
              Remember me
            </label>
            <a href="/auth/forgot-password" class="auth-link forgot-link">Forgot Password?</a>
          </div>

          <div class="form-error form-error-global" id="global-error"></div>
          <div class="login-lockout-msg" id="lockout-msg" style="display:none;"></div>

          <button type="submit" class="btn btn-primary btn-lg auth-submit" id="login-btn">
            Sign In
          </button>
        </form>

        <div class="auth-footer">
          Don't have an account? <a href="/auth/register" class="auth-link">Sign up</a>
        </div>
      </div>
    </div>

    <div class="toast" id="toast"></div>
  `;

    // ── Auto-focus email ──
    const emailInput = document.getElementById('login-email');
    const passwordInput = document.getElementById('login-password');
    const form = document.getElementById('login-form');
    const loginBtn = document.getElementById('login-btn');
    const lockoutMsg = document.getElementById('lockout-msg');
    const toggleBtn = document.getElementById('password-toggle');

    setTimeout(() => emailInput?.focus(), 50);

    // ── Check lockout on load ──
    checkLockout();

    // ── Toggle Password ──
    toggleBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        toggleBtn.querySelector('i').className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });

    // ── Real-time email validation ──
    emailInput.addEventListener('blur', () => {
        const v = emailInput.value.trim();
        if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
            setFieldError('email-error', emailInput, 'Please enter a valid email address.');
        } else {
            clearFieldError('email-error', emailInput);
        }
    });

    // ── Form submit ──
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        clearAllErrors();

        const remaining = getLockRemaining();
        if (remaining > 0) { showLockout(remaining); return; }

        const email = emailInput.value.trim();
        const password = passwordInput.value;
        let valid = true;

        if (!email) {
            setFieldError('email-error', emailInput, 'Email address is required.');
            valid = false;
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setFieldError('email-error', emailInput, 'Please enter a valid email address.');
            valid = false;
        }

        if (!password) {
            setFieldError('password-error', passwordInput, 'Password is required.');
            valid = false;
        }

        if (!valid) return;

        setLoading(true);

        setTimeout(async () => {
            const result = await login(email, password);

            if (!result.success) {
                const a = recordFailedAttempt();
                const left = getLockRemaining();
                if (left > 0) {
                    showLockout(left);
                } else {
                    if (result.error.includes('Password')) {
                        setFieldError('password-error', passwordInput, result.error);
                    } else {
                        setFieldError('global-error', null, result.error);
                    }
                }
                setLoading(false);
                return;
            }

            resetAttempts();
            showToast('Welcome back!', 'success');
            setTimeout(() => {
                navigate(result.user.profileComplete ? '/dashboard' : '/profile-setup');
            }, 800);
        }, 500);
    });

    // ── Google Login ──
    document.getElementById('btn-google-login').addEventListener('click', () => {
        initGoogleSignIn(
            ({ user }) => {
                resetAttempts();
                showToast('Signed in with Google!', 'success');
                setTimeout(() => navigate(user?.profileComplete ? '/dashboard' : '/profile-setup'), 800);
            },
            (msg) => showToast(msg, 'error')
        );
    });

    // ── Lockout countdown ──
    function checkLockout() {
        const remaining = getLockRemaining();
        if (remaining > 0) showLockout(remaining);
    }

    function showLockout(seconds) {
        lockoutMsg.style.display = 'flex';
        lockoutMsg.innerHTML = `<i class="fas fa-clock"></i> Too many attempts. Try again in <strong id="lockout-count">${seconds}s</strong>`;
        loginBtn.disabled = true;
        loginBtn.textContent = 'Sign In';

        const interval = setInterval(() => {
            const rem = getLockRemaining();
            const counter = document.getElementById('lockout-count');
            if (rem <= 0) {
                clearInterval(interval);
                lockoutMsg.style.display = 'none';
                loginBtn.disabled = false;
                resetAttempts();
            } else if (counter) {
                counter.textContent = rem + 's';
            }
        }, 1000);
    }

    function setLoading(loading) {
        loginBtn.disabled = loading;
        loginBtn.innerHTML = loading
            ? '<i class="fas fa-spinner fa-spin"></i> Signing in...'
            : 'Sign In';
    }

    // ── Google One Tap Auto-Prompt ──
    displayOneTap(
        ({ user, isNew }) => {
            showToast(isNew ? 'Account created with Google!' : 'Welcome back!', 'success');
            setTimeout(() => navigate(user?.profileComplete ? '/dashboard' : '/profile-setup'), 800);
        },
        (err) => console.log('One Tap skipped:', err)
    );
}

// ── Error Helpers ──
function setFieldError(errorId, input, msg) {
    if (errorId) {
        const el = document.getElementById(errorId);
        if (el) { el.textContent = msg || ''; el.classList.toggle('visible', !!msg); }
    }
    if (input) input.classList.toggle('input-error', !!msg);
}

function clearFieldError(errorId, input) {
    setFieldError(errorId, input, null);
}

function clearAllErrors() {
    document.querySelectorAll('.form-error').forEach(el => {
        el.textContent = ''; el.classList.remove('visible');
    });
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
    const lockoutMsg = document.getElementById('lockout-msg');
    if (lockoutMsg) lockoutMsg.style.display = 'none';
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast toast-${type} visible`;
    setTimeout(() => toast.classList.remove('visible'), 4000);
}
