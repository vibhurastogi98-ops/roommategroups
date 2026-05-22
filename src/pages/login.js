import { login } from '../services/auth.js';
import { navigate } from '../router.js';
import { showToast } from '../services/ui.js';

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

        <div class="auth-divider"><span>sign in with email</span></div>

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
                const redirect = sessionStorage.getItem('redirectAfterLogin');
                sessionStorage.removeItem('redirectAfterLogin');
                navigate(redirect || (result.user.profileComplete ? '/dashboard' : '/profile-setup'));
            }, 800);
        }, 500);
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
