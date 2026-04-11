import { register, getPasswordStrength } from '../services/auth.js';
import { navigate } from '../router.js';
import { initGoogleSignIn, displayOneTap } from '../services/googleAuth.js';

export function renderRegisterPage(app) {
    app.innerHTML = `
    <div class="auth-page">
      <div class="auth-card">
        <div class="auth-header">
          <a href="/" class="auth-logo">
            <span class="logo-badge"><span class="logo-badge-left">Roommate</span><span class="logo-badge-right">Groups</span></span>
          </a>
          <h1>Create your account</h1>
          <p>Join 1.5M+ members finding their perfect room</p>
        </div>

        <!-- Google Signup -->
        <div class="social-login">
          <button type="button" class="social-btn social-google" id="btn-google-register">
            <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </button>
        </div>

        <div class="auth-divider"><span>or register with email</span></div>

        <!-- Registration Form -->
        <form class="auth-form" id="register-form" novalidate>
          <div class="form-group">
            <label for="reg-name">Full Name</label>
            <div class="input-wrapper">
              <i class="fas fa-user"></i>
              <input type="text" id="reg-name" class="form-input" placeholder="John Doe" required autocomplete="name" />
            </div>
            <div class="form-error" id="name-error"></div>
          </div>

          <div class="form-group">
            <label for="reg-email">Email Address</label>
            <div class="input-wrapper">
              <i class="fas fa-envelope"></i>
              <input type="email" id="reg-email" class="form-input" placeholder="you@example.com" required autocomplete="email" inputmode="email" />
            </div>
            <div class="form-error" id="email-error"></div>
          </div>

          <div class="form-group">
            <label for="reg-password">Password</label>
            <div class="input-wrapper">
              <i class="fas fa-lock"></i>
              <input type="password" id="reg-password" class="form-input" placeholder="Min. 8 characters" required autocomplete="new-password" />
              <button type="button" class="password-toggle" id="password-toggle" aria-label="Toggle password visibility">
                <i class="fas fa-eye"></i>
              </button>
            </div>
            <div class="password-strength-meter">
              <div class="strength-bar" id="strength-bar"></div>
              <span class="strength-label" id="strength-label"></span>
            </div>
            <div class="form-error" id="password-error"></div>
          </div>

          <div class="form-group">
            <label class="checkbox-label">
              <input type="checkbox" id="reg-terms" required />
              <span class="checkmark"></span>
              I agree to the <a href="/terms" class="auth-link">Terms of Service</a> and <a href="/privacy" class="auth-link">Privacy Policy</a>
            </label>
            <div class="form-error" id="terms-error"></div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg auth-submit" id="register-btn">
            Create Account
          </button>
        </form>

        <div class="auth-footer">
          Already have an account? <a href="/auth/login" class="auth-link">Sign in</a>
        </div>
      </div>
    </div>

    <!-- Toast notification -->
    <div class="toast" id="toast"></div>
  `;

    // ── Refs ──
    const form = document.getElementById('register-form');
    const nameInput = document.getElementById('reg-name');
    const emailInput = document.getElementById('reg-email');
    const passwordInput = document.getElementById('reg-password');
    const toggleBtn = document.getElementById('password-toggle');
    const strengthBar = document.getElementById('strength-bar');
    const strengthLabel = document.getElementById('strength-label');

    // Auto-focus full name on load
    setTimeout(() => nameInput?.focus(), 50);

    // ── Toggle Password ──
    toggleBtn.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        toggleBtn.querySelector('i').className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });

    // ── Password Strength ──
    passwordInput.addEventListener('input', () => {
        const strength = getPasswordStrength(passwordInput.value);
        strengthBar.style.width = strength.percent + '%';
        strengthBar.style.backgroundColor = strength.color;
        strengthLabel.textContent = strength.label;
        strengthLabel.style.color = strength.color;
    });

    // Real-time email validation on blur
    emailInput.addEventListener('blur', () => {
        const v = emailInput.value.trim();
        if (v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) {
            setFieldError('email-error', emailInput, 'Please enter a valid email address.');
        } else {
            clearFieldError('email-error', emailInput);
        }
    });

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        clearAllErrors();

        const fullName = nameInput.value.trim();
        const email = emailInput.value.trim();
        const password = passwordInput.value;
        const terms = document.getElementById('reg-terms').checked;

        let valid = true;

        if (!fullName) {
            setFieldError('name-error', nameInput, 'Please enter your full name.');
            valid = false;
        }

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            setFieldError('email-error', emailInput, 'Please enter a valid email address.');
            valid = false;
        }

        if (!password) {
            setFieldError('password-error', passwordInput, 'Password is required.');
            valid = false;
        } else if (password.length < 8) {
            setFieldError('password-error', passwordInput, 'Password must be at least 8 characters.');
            valid = false;
        }

        if (!terms) {
            setFieldError('terms-error', null, 'You must agree to the terms.');
            valid = false;
        }

        if (!valid) return;

        const btn = document.getElementById('register-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creating account...';

        setTimeout(async () => {
            const result = await register({ fullName, email, password });

            if (!result.success) {
                setFieldError('email-error', emailInput, result.error);
                btn.disabled = false;
                btn.textContent = 'Create Account';
                return;
            }

            showToast('Account created! Welcome to RoommateGroups.', 'success');

            setTimeout(() => {
                navigate('/profile-setup');
            }, 1500);
        }, 800);
    });

    // Google Signup
    document.getElementById('btn-google-register').addEventListener('click', () => {
        initGoogleSignIn(
            ({ user, isNew }) => {
                showToast(isNew ? 'Account created with Google!' : 'Signed in with Google!', 'success');
                setTimeout(() => navigate(user?.profileComplete ? '/dashboard' : '/profile-setup'), 800);
            },
            (msg) => showToast(msg, 'error')
        );
    });

    // ── Google One Tap Auto-Prompt ──
    displayOneTap(
        ({ user, isNew }) => {
            showToast(isNew ? 'Account created with Google!' : 'Signed in with Google!', 'success');
            setTimeout(() => navigate(user?.profileComplete ? '/dashboard' : '/profile-setup'), 800);
        },
        (err) => console.log('One Tap skipped:', err)
    );
}

// ── Helpers ──

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
        el.textContent = '';
        el.classList.remove('visible');
    });
    document.querySelectorAll('.input-error').forEach(el => el.classList.remove('input-error'));
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    if (!toast) return;
    toast.textContent = message;
    toast.className = `toast toast-${type} visible`;
    setTimeout(() => toast.classList.remove('visible'), 4000);
}
