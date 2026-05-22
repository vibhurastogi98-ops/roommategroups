import { Capacitor } from '@capacitor/core';
import './styles/style.css';
import { initRouter, addRoute } from './router.js';
import { renderHomePage } from './pages/home.js';
import { renderRegisterPage } from './pages/register.js';
import { renderLoginPage } from './pages/login.js';
import { renderForgotPasswordPage } from './pages/forgot-password.js';
import { renderProfileSetupPage } from './pages/profile-setup.js';
import { renderDashboardPage } from './pages/dashboard.js';
import { renderPostListingPage } from './pages/post-listing.js';
import { renderCityPage } from './pages/city.js';
import { renderAdminPage } from './pages/admin.js';
import { renderAdminLoginPage } from './pages/admin-login.js';
import { requireAdmin, requireAuth } from './middleware/adminAuth.js';
import { renderSearchPage } from './pages/search.js';
import { renderBlogPage } from './pages/blog.js';
import { renderBlogPostPage } from './pages/blog-post.js';
import { renderAboutPage } from './pages/about.js';
import { renderFAQPage } from './pages/faq.js';
import { renderSafetyPage } from './pages/safety.js';
import { renderTermsPage } from './pages/terms.js';
import { renderPrivacyPage } from './pages/privacy.js';
import { renderContactPage } from './pages/contact.js';
import { renderListingDetailPage } from './pages/listing.js';
import { renderProfilePage } from './pages/profile.js';
import { renderFBGroupsPage } from './pages/fb-groups.js';
import { renderPricingPage } from './pages/pricing.js';
import { renderGroupDetailPage } from './pages/group-detail.js';
import { initDB } from './services/db.js';
import { installGlobalErrorBoundary } from './services/ui.js';

installGlobalErrorBoundary();

if (Capacitor.isNativePlatform()) {
  import('../../mobile/src/mobile-main.js').then(m => m.initMobile());
} else {
addRoute('/', renderHomePage);
addRoute('/pricing', renderPricingPage);
addRoute('/auth/register', renderRegisterPage);
addRoute('/auth/login', renderLoginPage);
addRoute('/auth/forgot-password', renderForgotPasswordPage);
addRoute('/profile-setup', renderProfileSetupPage, [requireAuth()]);
addRoute('/dashboard', renderDashboardPage, [requireAuth()]);
addRoute('/dashboard/listings', renderDashboardPage, [requireAuth()]);
addRoute('/dashboard/messages', renderDashboardPage, [requireAuth()]);
addRoute('/dashboard/saved', renderDashboardPage, [requireAuth()]);
addRoute('/dashboard/searches', renderDashboardPage, [requireAuth()]);
addRoute('/dashboard/verification', renderDashboardPage, [requireAuth()]);
addRoute('/dashboard/subscription', renderDashboardPage, [requireAuth()]);
addRoute('/dashboard/settings', renderDashboardPage, [requireAuth()]);
addRoute('/dashboard/notifications', renderDashboardPage, [requireAuth()]);
addRoute('/dashboard/blocked-users', renderDashboardPage, [requireAuth()]);
addRoute('/dashboard/archived-chats', renderDashboardPage, [requireAuth()]);
addRoute('/settings', renderDashboardPage, [requireAuth()]);
addRoute('/notifications', renderDashboardPage, [requireAuth()]);
addRoute('/blocked-users', renderDashboardPage, [requireAuth()]);
addRoute('/archived-chats', renderDashboardPage, [requireAuth()]);
addRoute('/profile', renderDashboardPage, [requireAuth()]);
addRoute('/post-listing', renderPostListingPage, [requireAuth()]);
addRoute('/post-listing/:id', renderPostListingPage, [requireAuth()]);
addRoute('/cities/:slug', renderCityPage);
addRoute('/cities/:country/:slug', renderCityPage);
addRoute('/search/rooms', renderSearchPage);
addRoute('/blog', renderBlogPage);
addRoute('/blog/:slug', renderBlogPostPage);
addRoute('/about', renderAboutPage);
addRoute('/faq', renderFAQPage);
addRoute('/safety', renderSafetyPage);
addRoute('/terms', renderTermsPage);
addRoute('/privacy', renderPrivacyPage);
addRoute('/contact', renderContactPage);
addRoute('/listing/:id', renderListingDetailPage);
addRoute('/profile/:id', renderProfilePage);
addRoute('/fb-groups', renderFBGroupsPage);
addRoute('/fb-groups/:slug', renderGroupDetailPage);

// Admin routes (protected with admin middleware)
addRoute('/admin-login', renderAdminLoginPage);
addRoute('/admin', renderAdminPage, [requireAdmin()]);
addRoute('/admin/listings', renderAdminPage, [requireAdmin()]);
addRoute('/admin/listing-moderation', renderAdminPage, [requireAdmin()]);
addRoute('/admin/users', renderAdminPage, [requireAdmin()]);
addRoute('/admin/user-management', renderAdminPage, [requireAdmin()]);
addRoute('/admin/verifications', renderAdminPage, [requireAdmin()]);
addRoute('/admin/reports', renderAdminPage, [requireAdmin()]);
addRoute('/admin/analytics', renderAdminPage, [requireAdmin()]);
addRoute('/admin/cities', renderAdminPage, [requireAdmin()]);
addRoute('/admin/content', renderAdminPage, [requireAdmin()]);
addRoute('/admin/settings', renderAdminPage, [requireAdmin()]);
addRoute('/admin/fb-groups', renderAdminPage, [requireAdmin()]);
addRoute('/admin/queries', renderAdminPage, [requireAdmin()]);

// Start
const app = document.querySelector('#app');

// Show a loading spinner while D1 data is being fetched
app.innerHTML = `
  <div style="display:flex;align-items:center;justify-content:center;min-height:100vh;background:#f8fafc;">
    <div style="text-align:center;">
      <div style="width:48px;height:48px;border:4px solid #e2e8f0;border-top-color:#1a1a1a;border-radius:50%;animation:rg-spin 0.7s linear infinite;margin:0 auto 16px;"></div>
      <p style="color:#64748b;font-family:system-ui,sans-serif;font-size:0.95rem;">Loading RoommateGroups…</p>
    </div>
  </div>
  <style>@keyframes rg-spin{to{transform:rotate(360deg)}}</style>
`;

// Initialize database first (fetch live data from D1), THEN start the router.
// This ensures admin/auth middleware always has the latest D1 data when it runs.
initDB().then(() => {
    // console.log('[Main] D1 sync complete — starting router.');
    initRouter(app);
}).catch((err) => {
    console.warn('[Main] D1 sync failed, starting router with cached data.', err);
    initRouter(app);
});


// Global Share Modal
const shareModalHtml = `
<div id="rg-share-modal" class="share-modal-overlay" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.5); z-index:9999; align-items:center; justify-content:center;">
    <div class="share-modal-content" style="background:#fff; border-radius:16px; padding:24px; width:90%; max-width:400px; box-shadow:0 10px 40px rgba(0,0,0,0.2);">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:20px;">
            <h3 style="margin:0; font-size:1.2rem; font-weight:800; color:#1a1a1a;">Share this listing</h3>
            <button onclick="closeShareModal()" style="background:none; border:none; font-size:1.2rem; cursor:pointer; color:#64748b;"><i class="fa-solid fa-xmark"></i></button>
        </div>
        <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px;">
            <a id="share-btn-fb" href="#" target="_blank" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:12px; border-radius:12px; background:#e0f2fe; color:#0284c7; text-decoration:none; font-weight:700;"><i class="fa-brands fa-facebook"></i> Facebook</a>
            <a id="share-btn-wa" href="#" target="_blank" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:12px; border-radius:12px; background:#dcfce7; color:#16a34a; text-decoration:none; font-weight:700;"><i class="fa-brands fa-whatsapp"></i> WhatsApp</a>
            <a id="share-btn-tw" href="#" target="_blank" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:12px; border-radius:12px; background:#f1f5f9; color:#0f1419; text-decoration:none; font-weight:700;"><i class="fa-brands fa-x-twitter"></i> Twitter</a>
            <button onclick="copyShareLink('Instagram')" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:12px; border-radius:12px; background:#fce7f3; color:#db2777; border:none; font-weight:700; cursor:pointer; font-size:1rem;"><i class="fa-brands fa-instagram"></i> Instagram</button>
            <button onclick="copyShareLink()" style="display:flex; align-items:center; justify-content:center; gap:8px; padding:12px; border-radius:12px; background:#f3e8ff; color:#7c3aed; border:none; font-weight:700; cursor:pointer; font-size:1rem; grid-column: span 2;"><i class="fa-solid fa-link"></i> Copy Link</button>
        </div>
    </div>
</div>
`;
document.body.insertAdjacentHTML('beforeend', shareModalHtml);

window.openShareModal = function(listingId, e) {
    if (e) { e.preventDefault(); e.stopPropagation(); }
    const url = window.location.origin + '/listing/' + listingId;
    const encodedUrl = encodeURIComponent(url);
    const text = encodeURIComponent("Check out this listing on RoommateGroups!");
    
    document.getElementById('share-btn-fb').href = 'https://www.facebook.com/sharer/sharer.php?u=' + encodedUrl;
    document.getElementById('share-btn-wa').href = 'https://api.whatsapp.com/send?text=' + text + '%20' + encodedUrl;
    document.getElementById('share-btn-tw').href = 'https://twitter.com/intent/tweet?url=' + encodedUrl + '&text=' + text;
    
    window._currentShareUrl = url;
    const modal = document.getElementById('rg-share-modal');
    modal.style.display = 'flex';
};

window.closeShareModal = function() {
    document.getElementById('rg-share-modal').style.display = 'none';
};

window.copyShareLink = function(platform) {
    if (window._currentShareUrl) {
        navigator.clipboard.writeText(window._currentShareUrl).then(() => {
            if (platform === 'Instagram') {
                alert('Link copied! You can now paste it into Instagram.');
            } else {
                alert('Link copied to clipboard!');
            }
            window.closeShareModal();
        });
    }
};

document.getElementById('rg-share-modal').addEventListener('click', (e) => {
    if (e.target.id === 'rg-share-modal') window.closeShareModal();
});
}
