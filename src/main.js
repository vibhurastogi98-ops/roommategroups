import './style.css';
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
import { initDB } from './services/db.js';
addRoute('/', renderHomePage);
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
addRoute('/post-listing', renderPostListingPage, [requireAuth()]);
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

// Admin routes (protected with admin middleware)
addRoute('/admin-login', renderAdminLoginPage);
addRoute('/admin', renderAdminPage, [requireAdmin()]);
addRoute('/admin/listings', renderAdminPage, [requireAdmin()]);
addRoute('/admin/users', renderAdminPage, [requireAdmin()]);
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

// Initialize database (only reset if completely missing)
initDB();

initRouter(app);
