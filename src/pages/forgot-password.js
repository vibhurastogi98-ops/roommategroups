export function renderForgotPasswordPage(app) {
    app.innerHTML = `
    <div class="auth-page">
      <div class="auth-card auth-card-narrow">
        <div class="auth-header">
          <a href="/" class="auth-logo">
            <span class="logo-badge"><span class="logo-badge-left">Roommate</span><span class="logo-badge-right">Groups</span></span>
          </a>
          <div class="auth-icon-circle">
            <i class="fas fa-key"></i>
          </div>
          <h1>Forgot your password?</h1>
          <p>Enter your email and we'll send you a reset link</p>
        </div>

        <!-- Reset Form -->
        <form class="auth-form" id="forgot-form" novalidate>
          <div class="form-group">
            <label for="forgot-email">Email Address</label>
            <div class="input-wrapper">
              <i class="fas fa-envelope"></i>
              <input type="email" id="forgot-email" class="form-input" placeholder="you@example.com" required autocomplete="email" />
            </div>
            <div class="form-error" id="email-error"></div>
          </div>

          <button type="submit" class="btn btn-primary btn-lg auth-submit" id="reset-btn">
            Send Reset Link
          </button>
        </form>

        <!-- Success State (hidden initially) -->
        <div class="forgot-success" id="forgot-success" style="display:none;">
          <div class="success-icon">
            <i class="fas fa-envelope-circle-check"></i>
          </div>
          <h2>Check your email</h2>
          <p>We've sent a password reset link to <strong id="sent-email"></strong>. Check your inbox and follow the link to reset your password.</p>
          <a href="/auth/login" class="btn btn-outline btn-lg auth-submit">
            Back to Sign In
          </a>
        </div>

        <div class="auth-footer">
          Remember your password? <a href="/auth/login" class="auth-link">Sign in</a>
        </div>
      </div>
    </div>
  `;

    const form = document.getElementById('forgot-form');

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const emailInput = document.getElementById('forgot-email');
        const email = emailInput.value.trim();
        const errorEl = document.getElementById('email-error');

        // Clear
        errorEl.textContent = '';
        errorEl.classList.remove('visible');

        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errorEl.textContent = 'Please enter a valid email address.';
            errorEl.classList.add('visible');
            return;
        }

        // Simulate sending
        const btn = document.getElementById('reset-btn');
        btn.disabled = true;
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';

        setTimeout(() => {
            // Show success state
            form.style.display = 'none';
            const success = document.getElementById('forgot-success');
            success.style.display = 'block';
            document.getElementById('sent-email').textContent = email;
        }, 1200);
    });
}
