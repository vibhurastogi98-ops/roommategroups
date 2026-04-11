import { login } from '../services/auth.js';
import { navigate } from '../router.js';

export function renderAdminLoginPage(app) {
    app.innerHTML = `
    <div class="auth-page">
      <div class="auth-card admin-login-card">
        <div class="auth-header">
          <div class="admin-logo">
            <i class="fas fa-shield-halved"></i>
            <span>RG Admin</span>
          </div>
          <h1>Admin Login</h1>
          <p>Access the RoommateGroups Admin Control Panel</p>
        </div>

        <div class="admin-security-notice">
          <i class="fas fa-lock"></i>
          <span>This area is restricted to administrators only</span>
        </div>

        <!-- Admin Login Form -->
        <form class="auth-form" id="admin-login-form" novalidate>
          <div class="form-group">
            <label for="admin-email">Admin Email</label>
            <div class="input-wrapper">
              <i class="fas fa-user-shield"></i>
              <input type="email" id="admin-email" class="form-input" placeholder="admin@roommategroups.com" required autocomplete="email" />
            </div>
            <div class="form-error" id="email-error"></div>
          </div>

          <div class="form-group">
            <label for="admin-password">Admin Password</label>
            <div class="input-wrapper">
              <i class="fas fa-key"></i>
              <input type="password" id="admin-password" class="form-input" placeholder="Enter admin password" required autocomplete="current-password" />
              <button type="button" class="password-toggle" id="toggle-password" aria-label="Toggle password visibility">
                <i class="fas fa-eye"></i>
              </button>
            </div>
            <div class="form-error" id="password-error"></div>
          </div>

          <div class="form-error form-error-global" id="global-error"></div>

          <button type="submit" class="btn btn-danger btn-lg auth-submit" id="admin-login-btn">
            <i class="fas fa-shield-halved"></i>
            Access Admin Panel
          </button>
        </form>

        <div class="auth-footer">
          <div class="admin-footer-links">
            <a href="/" class="auth-link">
              <i class="fas fa-arrow-left"></i>
              Back to Home
            </a>
            <a href="/auth/login" class="auth-link">
              <i class="fas fa-user"></i>
              User Login
            </a>
          </div>
        </div>
      </div>
    </div>

    <div class="toast" id="toast"></div>
  `;

    // ── Event Listeners ──

    const form = document.getElementById('admin-login-form');
    const passwordInput = document.getElementById('admin-password');
    const toggleBtn = document.getElementById('toggle-password');

    // Password visibility toggle
    toggleBtn.addEventListener('click', () => {
        const type = passwordInput.type === 'password' ? 'text' : 'password';
        passwordInput.type = type;
        toggleBtn.querySelector('i').className = type === 'password' ? 'fas fa-eye' : 'fas fa-eye-slash';
    });

    // Form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        clearErrors();

        const email = document.getElementById('admin-email').value.trim();
        const password = passwordInput.value;

        // Validate
        let valid = true;

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            showError('email-error', 'Please enter a valid email address.');
            valid = false;
        }

        if (!password) {
            showError('password-error', 'Please enter your password.');
            valid = false;
        }

        if (!valid) return;

        // Admin Login
        const btn = document.getElementById('admin-login-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Authenticating...';

        setTimeout(async () => {
            const result = await login(email, password);

            if (!result.success) {
                showError('global-error', result.error);
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-shield-halved"></i> Access Admin Panel';
                return;
            }

            // Check if user has admin role
            if (result.user.role !== 'admin') {
                showError('global-error', 'Access denied. Admin privileges required.');
                btn.disabled = false;
                btn.innerHTML = '<i class="fas fa-shield-halved"></i> Access Admin Panel';
                return;
            }

            showToast('Admin access granted!', 'success');

            setTimeout(() => {
                navigate('/admin');
            }, 1000);
        }, 600);
    });
}

function showError(id, msg) {
    const el = document.getElementById(id);
    if (el) {
        el.textContent = msg;
        el.classList.add('visible');
    }
}

function clearErrors() {
    document.querySelectorAll('.form-error').forEach(el => {
        el.textContent = '';
        el.classList.remove('visible');
    });
}

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast toast-${type} visible`;
    setTimeout(() => toast.classList.remove('visible'), 4000);
}
