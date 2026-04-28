import { getCurrentUser, isAdmin, logout } from '../services/auth.js';
import { navigate } from '../router.js';
import { db, getLiveListingCount } from '../services/db.js';
import { getTotalVisits, getTopSearchQueries, getZeroResultQueries } from '../services/analytics.js';
import { uploadImage } from '../services/upload.js';
import { parseMarkdown } from '../services/blog-data.js';

// ─────────────────────────────────────────────────────────────
// Admin Dashboard Entry Point
// ─────────────────────────────────────────────────────────────

export function renderAdminPage(app) {
    // Middleware already handles authentication and admin role check
    const user = getCurrentUser();
    
    console.log('[ADMIN PAGE] Rendering admin page for user:', user?.email, 'role:', user?.role);

    const path = window.location.pathname || '/admin';
    let view = 'overview';
    if (path === '/admin/listings') view = 'listings';
    if (path === '/admin/users') view = 'users';
    if (path === '/admin/reports') view = 'reports';
    if (path === '/admin/analytics') view = 'analytics';
    if (path === '/admin/cities') view = 'cities';
    if (path === '/admin/content') view = 'content';
    if (path === '/admin/verifications') view = 'verifications';
    if (path === '/admin/settings') view = 'admin_settings';
    if (path === '/admin/fb-groups') view = 'fb_groups';
    if (path === '/admin/queries') view = 'queries';
    if (path === '/admin/images') view = 'images';

    console.log('[ADMIN PAGE] Current view:', view, 'path:', path);

    const pendingCount = db.listings.find(l => l.moderation_status === 'pending').length + db.listings.find(l => l.moderation_status === 'flagged').length;
    const openReports = db.reports.find(r => r.status === 'pending').length;
    const pendingVerifs = db.users.find(u => u.id_status === 'pending').length;
    const newQueriesCount = db.user_queries.find(q => !q.is_read).length;

    const navLinks = [
        { id: 'overview', icon: 'fa-gauge-high', label: 'Overview', href: '/admin', section: 'Platform' },
        { id: 'listings', icon: 'fa-house-circle-check', label: 'Listing Moderation', href: '/admin/listings', badge: pendingCount, section: 'Moderation' },
        { id: 'verifications', icon: 'fa-id-card-clip', label: 'ID Verifications', href: '/admin/verifications', badge: pendingVerifs, section: 'Moderation' },
        { id: 'reports', icon: 'fa-flag', label: 'Reports & Flags', href: '/admin/reports', badge: openReports, section: 'Moderation' },
        { id: 'users', icon: 'fa-users', label: 'User Management', href: '/admin/users', section: 'Management' },
        { id: 'cities', icon: 'fa-map-location-dot', label: 'City Management', href: '/admin/cities', section: 'Management' },
        { id: 'fb_groups', icon: 'fa-thumbs-up', label: 'FB Groups', href: '/admin/fb-groups', section: 'Management' },
        { id: 'queries', icon: 'fa-envelope-open-text', label: 'User Queries', href: '/admin/queries', badge: newQueriesCount, section: 'Management' },
        { id: 'images', icon: 'fa-images', label: 'Image Assets', href: '/admin/images', section: 'Management' },
        { id: 'analytics', icon: 'fa-chart-line', label: 'Analytics', href: '/admin/analytics', section: 'Insights' },
        { id: 'content', icon: 'fa-newspaper', label: 'Content / Blog', href: '/admin/content', section: 'Insights' },
        { id: 'admin_settings', icon: 'fa-sliders', label: 'Settings', href: '/admin/settings', section: 'System' },
    ];

    // Group nav links by section — accordion style
    const sectionIcons = {
        'Platform':   'fa-gauge-high',
        'Moderation': 'fa-shield-halved',
        'Management': 'fa-users-gear',
        'Insights':   'fa-chart-line',
        'System':     'fa-sliders',
    };
    const sections = [...new Set(navLinks.map(n => n.section))];
    const sidebarLinks = sections.map(section => {
        const sectionLinks = navLinks.filter(n => n.section === section);
        const hasActive = sectionLinks.some(n => n.id === view);
        const sectionIcon = sectionIcons[section] || 'fa-folder';

        const sectionBadgeCount = sectionLinks.reduce((sum, n) => sum + (Number(n.badge) || 0), 0);
        const sectionBadgeHtml = sectionBadgeCount > 0 ? '<span class="adm-section-badge">' + sectionBadgeCount + '</span>' : '';

        const links = sectionLinks.map(n => {
            const isActive = n.id === view;
            const badgeHtml = n.badge ? '<span class="adm-nav-badge">' + n.badge + '</span>' : '';
            return '<a href="' + n.href + '" class="adm-nav-link' + (isActive ? ' active' : '') + '">' +
                '<i class="fa-solid ' + n.icon + '"></i>' +
                '<span>' + n.label + '</span>' +
                badgeHtml +
                '</a>';
        }).join('');

        return '<div class="adm-accordion-group' + (hasActive ? ' open' : '') + '">' +
            '<button class="adm-accordion-header">' +
            '<i class="fa-solid ' + sectionIcon + ' adm-accordion-icon"></i>' +
            '<span class="adm-accordion-title">' + section + '</span>' +
            sectionBadgeHtml +
            '<i class="fa-solid fa-chevron-right adm-accordion-chevron"></i>' +
            '</button>' +
            '<div class="adm-accordion-body">' + links + '</div>' +
            '</div>';
    }).join('');

    const isCollapsed = localStorage.getItem('adm_sidebar_collapsed') === 'true';

    app.innerHTML = [
        '<div class="admin-layout">',
        // Mobile overlay
        '<div class="adm-sidebar-overlay" id="adm-sidebar-overlay"></div>',
        // Sidebar
        '<aside class="admin-sidebar' + (isCollapsed ? ' collapsed' : '') + '" id="admin-sidebar">',
        '<div class="adm-sidebar-brand">',
        '<i class="fa-solid fa-shield-halved"></i>',
        '<div><div class="adm-brand-name">RG Admin</div><div class="adm-brand-sub">Control Panel</div></div>',
        '<button class="adm-collapse-btn" id="adm-collapse-btn" title="Toggle Sidebar"><i class="fa-solid fa-chevron-left"></i></button>',
        '</div>',
        '<nav class="adm-nav">' + sidebarLinks + '</nav>',
        '<div class="adm-sidebar-footer">',
        '<img src="https://ui-avatars.com/api/?name=' + encodeURIComponent(user.display_name) + '&background=6366f1&color=fff&size=40" class="adm-user-avatar">',
        '<div style="flex:1;min-width:0;"><div class="adm-user-name">' + escHtml(user.display_name) + '</div><div class="adm-user-role">Administrator</div></div>',
        '<button id="admin-logout-btn" class="adm-logout-btn" title="Sign Out"><i class="fa-solid fa-arrow-right-from-bracket"></i></button>',
        '</div>',
        '</aside>',
        // Main
        '<div class="admin-main">',
        '<div class="admin-topbar">',
        '<button class="adm-mobile-toggle" id="adm-menu-toggle"><i class="fa-solid fa-bars"></i></button>',
        '<h1 class="adm-page-title">' + (navLinks.find(n => n.id === view)?.label || 'Admin') + '</h1>',
        '<div class="adm-topbar-right">',
        '<span class="adm-topbar-time">' + new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }) + '</span>',
        '<a href="/" target="_blank" class="adm-topbar-site-btn"><i class="fa-solid fa-house"></i> Go to Website</a>',
        '</div>',
        '</div>',
        '<div class="admin-content" id="admin-content"></div>',
        '</div>',
        '</div>'
    ].join('');

    const content = app.querySelector('#admin-content');

    switch (view) {
        case 'overview': renderAdminOverview(content, user); break;
        case 'listings': renderAdminListings(content); break;
        case 'users': renderAdminUsers(content); break;
        case 'reports': renderAdminReports(content); break;
        case 'analytics': renderAdminAnalytics(content); break;
        case 'cities': renderAdminCities(content); break;
        case 'content': renderAdminContent(content); break;
        case 'verifications': renderAdminVerifications(content); break;
        case 'fb_groups': renderAdminFBGroups(content); break;
        case 'admin_settings': renderAdminSettings(content); break;
        case 'queries': renderAdminQueries(content); break;
        case 'images': renderAdminImages(content); break;
        default: renderAdminPlaceholder(content, navLinks.find(n => n.id === view)?.label || 'Section'); break;
    }

    // Mobile sidebar toggle + overlay
    const sidebar = app.querySelector('#admin-sidebar');
    const overlay = app.querySelector('#adm-sidebar-overlay');

    app.querySelector('#adm-menu-toggle')?.addEventListener('click', () => {
        sidebar.classList.toggle('mobile-open');
        overlay.classList.toggle('visible');
    });

    overlay?.addEventListener('click', () => {
        sidebar.classList.remove('mobile-open');
        overlay.classList.remove('visible');
    });

    // Desktop sidebar collapse
    app.querySelector('#adm-collapse-btn')?.addEventListener('click', () => {
        const collapsed = sidebar.classList.toggle('collapsed');
        localStorage.setItem('adm_sidebar_collapsed', collapsed ? 'true' : 'false');
        const icon = app.querySelector('#adm-collapse-btn i');
        if (icon) icon.className = 'fa-solid ' + (collapsed ? 'fa-chevron-right' : 'fa-chevron-left');
    });

    // Set correct chevron direction on load
    if (isCollapsed) {
        const icon = app.querySelector('#adm-collapse-btn i');
        if (icon) icon.className = 'fa-solid fa-chevron-right';
    }

    // Accordion — one section open at a time
    app.querySelectorAll('.adm-accordion-header').forEach(header => {
        header.addEventListener('click', () => {
            const group = header.closest('.adm-accordion-group');
            const isOpen = group.classList.contains('open');
            app.querySelectorAll('.adm-accordion-group').forEach(g => g.classList.remove('open'));
            if (!isOpen) group.classList.add('open');
        });
    });

    // Admin logout
    app.querySelector('#admin-logout-btn')?.addEventListener('click', async () => {
        await logout();
        navigate('/');
        window.location.reload();
    });
}

// ─────────────────────────────────────────────────────────────
// Shared Helpers
// ─────────────────────────────────────────────────────────────

function escHtml(str) {
    return String(str || '')
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function compressImage(base64Str, maxWidth = 800, maxHeight = 600, quality = 0.6) {
    return new Promise((resolve) => {
        const img = new Image();
        img.src = base64Str;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > height) {
                if (width > maxWidth) {
                    height *= maxWidth / width;
                    width = maxWidth;
                }
            } else {
                if (height > maxHeight) {
                    width *= maxHeight / height;
                    height = maxHeight;
                }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', quality));
        };
    });
}

function relTime(iso) {
    const diff = Date.now() - new Date(iso).getTime();
    const m = Math.floor(diff / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + 'm ago';
    const h = Math.floor(m / 60);
    if (h < 24) return h + 'h ago';
    return Math.floor(h / 24) + 'd ago';
}

function screenBadge(score) {
    if (score >= 70) return '<span class="screen-badge screen-good"><i class="fa-solid fa-circle-check"></i> ' + score + '</span>';
    if (score >= 40) return '<span class="screen-badge screen-warn"><i class="fa-solid fa-triangle-exclamation"></i> ' + score + '</span>';
    return '<span class="screen-badge screen-bad"><i class="fa-solid fa-circle-xmark"></i> ' + score + '</span>';
}

async function logAdminAction(adminId, action, target) {
    await db.admin_logs.create({ admin_id: adminId, action, target });
}

function showToast(msg, type = 'success') {
    const old = document.getElementById('adm-toast');
    if (old) old.remove();
    const t = document.createElement('div');
    t.id = 'adm-toast';
    t.className = 'adm-toast adm-toast-' + type;
    t.innerHTML = '<i class="fa-solid ' + (type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check') + '"></i> ' + msg;
    document.body.appendChild(t);
    setTimeout(() => t.classList.add('visible'), 10);
    setTimeout(() => { t.classList.remove('visible'); setTimeout(() => t.remove(), 300); }, 3000);
}

// ─────────────────────────────────────────────────────────────
// SVG Chart Helpers
// ─────────────────────────────────────────────────────────────

function buildLineChart(data, color = '#1a1a1a', width = 300, height = 80) {
    const max = Math.max(...data, 1);
    const pts = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (v / max) * height;
        return x + ',' + y;
    }).join(' ');
    const area = data.map((v, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - (v / max) * height;
        return x + ',' + y;
    }).join(' ') + ' ' + width + ',' + height + ' 0,' + height;
    return '<svg viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none" style="width:100%;height:' + height + 'px">' +
        '<defs><linearGradient id="lg_' + color.replace('#', '') + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="' + color + '" stop-opacity="0.3"/><stop offset="100%" stop-color="' + color + '" stop-opacity="0"/></linearGradient></defs>' +
        '<polygon points="' + area + '" fill="url(#lg_' + color.replace('#', '') + ')"/>' +
        '<polyline points="' + pts + '" fill="none" stroke="' + color + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>' +
        '</svg>';
}

function buildBarChart(data, color = '#1a1a1a', width = 300, height = 80) {
    const max = Math.max(...data, 1);
    const barW = width / data.length;
    const bars = data.map((v, i) => {
        const bh = (v / max) * height;
        const x = i * barW + barW * 0.1;
        const y = height - bh;
        return '<rect x="' + x + '" y="' + y + '" width="' + (barW * 0.8) + '" height="' + bh + '" rx="2" fill="' + color + '" opacity="0.85"/>';
    }).join('');
    return '<svg viewBox="0 0 ' + width + ' ' + height + '" preserveAspectRatio="none" style="width:100%;height:' + height + 'px">' + bars + '</svg>';
}


// ─────────────────────────────────────────────────────────────
// Overview
// ─────────────────────────────────────────────────────────────

function renderAdminOverview(container) {
    const allUsers = db.users.findAll();
    const allListings = db.listings.findAll();
    const activeListings = allListings.filter(l => l.status === 'active');
    const pendingListings = allListings.filter(l => l.moderation_status === 'pending' || l.moderation_status === 'flagged');
    const openReports = db.reports.find(r => r.status === 'pending').length;
    const pendingVerifs = db.users.find(u => u.id_status === 'pending').length;
    const logs = db.admin_logs.findAll().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 10);
    const recentQueries = db.user_queries.findAll().sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 5);
    const newQueriesTotal = db.user_queries.find(q => !q.is_read).length;

    const TIER_PRICE = { free: 0, premium: 29, pro: 49, admin: 0 };
    const totalMRR = allUsers.reduce((sum, u) => sum + (TIER_PRICE[u.subscription_tier] || 0), 0);
    const todayMsgs = db.messages.find(m => new Date(m.created_at) > new Date(Date.now() - 86400000)).length;
    const flatZero = Array(30).fill(0);
    const userChart = Array(30).fill(0).map((_, i) => i === 29 ? allUsers.length : 0);
    const listingChart = Array(30).fill(0).map((_, i) => i === 29 ? activeListings.length : 0);
    const revenueChart = Array(30).fill(0).map((_, i) => i === 29 ? totalMRR : 0);

    // KPI cards with distinct colors
    const kpis = [
        { label: 'Total Users', value: allUsers.length, icon: 'fa-users', bg: '#ede9fe', fg: '#6d28d9', chart: buildLineChart(userChart, '#7c3aed') },
        { label: 'Active Listings', value: activeListings.length, icon: 'fa-house', bg: '#d1fae5', fg: '#065f46', chart: buildLineChart(listingChart, '#059669') },
        { label: 'MRR', value: '$' + totalMRR.toLocaleString(), icon: 'fa-dollar-sign', bg: '#fef3c7', fg: '#92400e', chart: buildLineChart(revenueChart, '#d97706') },
        { label: 'Messages Today', value: todayMsgs, icon: 'fa-comment-dots', bg: '#dbeafe', fg: '#1e40af', chart: buildLineChart(flatZero.map((_, i) => i === 29 ? todayMsgs : 0), '#3b82f6') },
        { label: 'Active Cities', value: db.cities.find(c => c.is_active !== false).length, icon: 'fa-map-location-dot', bg: '#fee2e2', fg: '#991b1b', chart: buildLineChart(flatZero.map((_, i) => i === 29 ? db.cities.findAll().length : 0), '#ef4444') },
    ];

    const kpiHtml = kpis.map(k => [
        '<div class="adm-kpi-card">',
        '<div class="adm-kpi-top">',
        '<div class="adm-kpi-icon" style="background:' + k.bg + ';color:' + k.fg + '"><i class="fa-solid ' + k.icon + '"></i></div>',
        '<div><div class="adm-kpi-value">' + k.value + '</div><div class="adm-kpi-label">' + k.label + '</div></div>',
        '</div>',
        '<div class="adm-kpi-trend"><span class="trend-up"><i class="fa-solid fa-arrow-trend-up"></i> Live data</span></div>',
        '<div class="adm-kpi-chart">' + k.chart + '</div>',
        '</div>'
    ].join('')).join('');

    // Quick action cards
    const quickActions = [
        { href: '/admin/listings', icon: 'fa-clock', bg: '#fef3c7', fg: '#b45309', label: 'Pending Review', count: pendingListings.length + ' listings' },
        { href: '/admin/reports', icon: 'fa-flag', bg: '#fee2e2', fg: '#b91c1c', label: 'Open Reports', count: openReports + ' reports' },
        { href: '/admin/verifications', icon: 'fa-id-card', bg: '#ede9fe', fg: '#6d28d9', label: 'ID Verifications', count: pendingVerifs + ' pending' },
        { href: '/admin/users', icon: 'fa-users', bg: '#dbeafe', fg: '#1e40af', label: 'Total Members', count: allUsers.length + ' users' },
    ];

    const quickActionsHtml = quickActions.map(q => [
        '<a href="' + q.href + '" class="adm-quick-action-card">',
        '<div class="adm-qa-icon" style="background:' + q.bg + ';color:' + q.fg + '"><i class="fa-solid ' + q.icon + '"></i></div>',
        '<div><div class="adm-qa-label">' + q.label + '</div><div class="adm-qa-count">' + q.count + '</div></div>',
        '</a>'
    ].join('')).join('');

    const logsHtml = logs.length === 0 ? '<div class="adm-empty" style="padding:30px"><i class="fa-solid fa-inbox"></i><p>No recent activity.</p></div>' :
        logs.map(l => [
            '<div class="adm-log-item">',
            '<div class="adm-log-icon"><i class="fa-solid fa-clock-rotate-left"></i></div>',
            '<div class="adm-log-body"><div class="adm-log-action">' + escHtml(l.action) + '</div><div class="adm-log-target">' + escHtml(l.target) + '</div></div>',
            '<div class="adm-log-time">' + relTime(l.created_at) + '</div>',
            '</div>'
        ].join('')).join('');

    container.innerHTML = [
        // Moderation alert
        pendingListings.length > 0 ? [
            '<div class="adm-alert adm-alert-warning">',
            '<i class="fa-solid fa-triangle-exclamation"></i>',
            '<span><strong>' + pendingListings.length + ' listing' + (pendingListings.length !== 1 ? 's' : '') + '</strong> awaiting moderation review.</span>',
            '<a href="/admin/listings" class="adm-alert-btn">Review Now</a>',
            '</div>'
        ].join('') : '',
        // New queries alert
        newQueriesTotal > 0 ? [
            '<div class="adm-alert" style="background:#eff6ff;border-left:4px solid #3b82f6;color:#1e40af;">',
            '<i class="fa-solid fa-envelope-open-text"></i>',
            '<span><strong>' + newQueriesTotal + ' new user quer' + (newQueriesTotal === 1 ? 'y' : 'ies') + '</strong> awaiting your response.</span>',
            '<a href="/admin/queries" class="adm-alert-btn" style="background:#3b82f6;color:white;">View Queries</a>',
            '</div>'
        ].join('') : '',

        // Quick actions
        '<div class="adm-quick-actions">' + quickActionsHtml + '</div>',

        // KPI grid
        '<div class="adm-kpi-grid">' + kpiHtml + '</div>',

        // Charts row
        '<div class="adm-charts-row">',
        '<div class="adm-panel">',
        '<div class="adm-panel-header"><h3><i class="fa-solid fa-users" style="color:#7c3aed;margin-right:6px"></i>New Users (30 days)</h3></div>',
        '<div class="adm-chart-box">' + buildLineChart(userChart, '#7c3aed', 600, 120) + '</div>',
        '<div class="adm-chart-labels">' + ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'This Week'].map(m => '<span>' + m + '</span>').join('') + '</div>',
        '</div>',
        '<div class="adm-panel">',
        '<div class="adm-panel-header"><h3><i class="fa-solid fa-house" style="color:#059669;margin-right:6px"></i>Listings Per Day (14 days)</h3></div>',
        '<div class="adm-chart-box">' + buildBarChart(listingChart.slice(-14), '#059669', 600, 120) + '</div>',
        '</div>',
        '</div>',

        // Revenue + Activity log
        '<div class="adm-charts-row">',
        '<div class="adm-panel">',
        '<div class="adm-panel-header"><h3><i class="fa-solid fa-dollar-sign" style="color:#d97706;margin-right:6px"></i>Revenue Trend (MRR)</h3></div>',
        '<div class="adm-chart-box">' + buildLineChart(revenueChart, '#d97706', 600, 120) + '</div>',
        '</div>',
        '<div class="adm-panel">',
        '<div class="adm-panel-header"><h3><i class="fa-solid fa-clock-rotate-left" style="color:#6366f1;margin-right:6px"></i>Recent Admin Activity</h3></div>',
        '<div class="adm-log-list">' + logsHtml + '</div>',
        '</div>',
        '</div>',

        '</div>',
        
        // Cities & Content Row
        '<div class="adm-charts-row">',
        '<div class="adm-panel">',
        '<div class="adm-panel-header"><h3><i class="fa-solid fa-map-location-dot" style="color:#ef4444;margin-right:6px"></i>Popular Cities</h3></div>',
        '<div style="padding:10px;">',
        db.cities.findAll().sort((a, b) => (b.listing_count || 0) - (a.listing_count || 0)).slice(0, 5).map(c => `
            <div style="display:flex;align-items:center;justify-content:space-between;padding:12px;border-bottom:1px solid #f1f5f9;">
                <div style="display:flex;align-items:center;gap:12px;">
                    <img src="${c.hero_image}" style="width:40px;height:30px;object-fit:cover;border-radius:4px;">
                    <div>
                        <div style="font-weight:600;font-size:0.9rem;">${c.name}</div>
                        <div style="font-size:0.75rem;color:#64748b;">${c.listing_count || 0} listings</div>
                    </div>
                </div>
                <a href="/cities/${c.slug}" target="_blank" style="color:#6366f1;font-size:0.8rem;"><i class="fa-solid fa-arrow-up-right-from-square"></i></a>
            </div>
        `).join(''),
        '</div>',
        '</div>',
        '<div class="adm-panel">',
        '<div class="adm-panel-header" style="display:flex;align-items:center;justify-content:space-between;">',
        '<h3><i class="fa-solid fa-envelope-open-text" style="color:#3b82f6;margin-right:6px"></i>Recent User Queries</h3>',
        '<a href="/admin/queries" style="font-size:0.85rem;color:#3b82f6;font-weight:600;text-decoration:none;">View All →</a>',
        '</div>',
        recentQueries.length === 0
            ? '<div class="adm-empty" style="padding:24px"><i class="fa-solid fa-inbox"></i><p>No queries yet.</p></div>'
            : '<div style="overflow-x:auto;"><table style="width:100%;border-collapse:collapse;font-size:0.875rem;">' +
              '<thead><tr style="background:#f8fafc;">' +
              '<th style="padding:9px 14px;text-align:left;font-size:0.75rem;font-weight:700;color:#64748b;text-transform:uppercase;">Name</th>' +
              '<th style="padding:9px 14px;text-align:left;font-size:0.75rem;font-weight:700;color:#64748b;text-transform:uppercase;">Topic</th>' +
              '<th style="padding:9px 14px;text-align:left;font-size:0.75rem;font-weight:700;color:#64748b;text-transform:uppercase;">Status</th>' +
              '</tr></thead><tbody>' +
              recentQueries.map(q => {
                  const statusHtml = q.status === 'replied'
                      ? '<span style="background:#d1fae5;color:#065f46;padding:2px 8px;border-radius:12px;font-size:0.75rem;font-weight:700;">Replied</span>'
                      : (!q.is_read
                          ? '<span style="background:#fee2e2;color:#991b1b;padding:2px 8px;border-radius:12px;font-size:0.75rem;font-weight:700;">New</span>'
                          : '<span style="background:#f1f5f9;color:#475569;padding:2px 8px;border-radius:12px;font-size:0.75rem;font-weight:700;">Read</span>');
                  return '<tr style="border-top:1px solid #f1f5f9;' + (!q.is_read && q.status !== 'replied' ? 'background:#fffbeb;' : '') + '">' +
                      '<td style="padding:10px 14px;font-weight:600;color:#1e293b;">' + escHtml(q.first_name + ' ' + q.last_name) + '</td>' +
                      '<td style="padding:10px 14px;color:#64748b;">' + escHtml(q.topic_label || q.topic) + '</td>' +
                      '<td style="padding:10px 14px;">' + statusHtml + '</td>' +
                      '</tr>';
              }).join('') +
              '</tbody></table></div>',
        '</div>',
        '</div>',
    ].join('');
}

// ─────────────────────────────────────────────────────────────
// Listing Moderation
// ─────────────────────────────────────────────────────────────

function renderAdminListings(container) {
    let activeTab = 'pending';
    let selectedIds = new Set();
    let cityFilter = '';
    let categoryFilter = '';

    function getTabListings() {
        const statusMap = {
            pending: l => l.moderation_status === 'pending',
            flagged: l => l.moderation_status === 'flagged',
            reported: l => db.reports.find(r => r.target_id === l.listing_id && r.status === 'pending').length > 0,
            approved: l => l.moderation_status === 'approved',
            rejected: l => l.moderation_status === 'rejected',
        };
        return db.listings.find(l => {
            const matchTab = statusMap[activeTab] ? statusMap[activeTab](l) : true;
            const matchCity = !cityFilter || l.city === cityFilter;
            const matchCat = !categoryFilter || l.category === categoryFilter;
            return matchTab && matchCity && matchCat;
        }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    function countTab(tab) {
        const statusMap = { pending: 'pending', flagged: 'flagged', approved: 'approved', rejected: 'rejected' };
        if (tab === 'reported') return db.reports.find(r => r.status === 'pending').length;
        return db.listings.find(l => l.moderation_status === statusMap[tab]).length;
    }

    async function doAction(listingId, action, reason = '') {
        const user = getCurrentUser();
        const listing = db.listings.findById(listingId);
        if (!listing) return;

        if (action === 'approve') {
            await db.listings.update(listingId, { moderation_status: 'approved', status: 'active' });
            await logAdminAction(user.user_id, 'Approved listing', listingId);
            
            // Notify listing owner
            await db.notifications.create({
                user_id: listing.user_id,
                type: 'listing_approved',
                title: 'Listing Approved! ✅',
                body: `Your listing "${listing.title}" has been approved and is now live.`,
                link: `/listing/${listingId}`
            });
            showToast('Listing approved.');
        } else if (action === 'reject') {
            await db.listings.update(listingId, { moderation_status: 'rejected', status: 'rejected', rejection_reason: reason });
            await logAdminAction(user.user_id, 'Rejected listing', listingId);

            // Notify listing owner
            await db.notifications.create({
                user_id: listing.user_id,
                type: 'listing_rejected',
                title: 'Listing Rejected ❌',
                body: `Your listing "${listing.title}" was rejected. Reason: ${reason}`,
                link: `/dashboard`
            });
            showToast('Listing rejected.', 'error');
        } else if (action === 'flag') {
            await db.listings.update(listingId, { moderation_status: 'flagged' });
            await logAdminAction(user.user_id, 'Flagged listing for senior review', listingId);
            showToast('Listing flagged for senior review.', 'warning');
        }
        renderContent();
    }

    function renderContent() {
        const listings = getTabListings();
        const cities = db.cities.findAll();
        const tabs = ['pending', 'flagged', 'reported', 'approved', 'rejected'];

        const tabsHtml = tabs.map(t => {
            const count = countTab(t);
            return '<button class="adm-tab' + (t === activeTab ? ' active' : '') + '" data-tab="' + t + '">' +
                t.charAt(0).toUpperCase() + t.slice(1) + (count > 0 ? ' <span class="adm-tab-count">' + count + '</span>' : '') + '</button>';
        }).join('');

        const filtersHtml = [
            '<div class="adm-filters">',
            '<select class="adm-select" id="adm-city-filter">',
            '<option value="">All Cities</option>',
            cities.map(c => '<option value="' + c.city_id + '"' + (cityFilter === c.city_id ? ' selected' : '') + '>' + c.name + '</option>').join(''),
            '</select>',
            '<select class="adm-select" id="adm-cat-filter">',
            '<option value="">All Categories</option>',
            ['room', 'apartment', 'sublet', 'roommate_wanted', 'coliving', 'house', 'student_housing', 'room_wanted'].map(c => '<option value="' + c + '"' + (categoryFilter === c ? ' selected' : '') + '>' + c + '</option>').join(''),
            '</select>',
            selectedIds.size > 0 ? [
                '<button class="btn btn-sm btn-success" id="adm-bulk-approve"><i class="fa-solid fa-check"></i> Approve (' + selectedIds.size + ')</button>',
                '<button class="btn btn-sm btn-danger" id="adm-bulk-reject"><i class="fa-solid fa-xmark"></i> Reject (' + selectedIds.size + ')</button>',
            ].join('') : '',
            '</div>'
        ].join('');

        const listingsHtml = listings.length === 0 ? '<div class="adm-empty"><i class="fa-solid fa-inbox"></i><p>No listings in this category.</p></div>' :
            listings.map(l => {
                const city = db.cities.findById(l.city);
                const countryObj = l.country ? db.countries.findById(l.country) : (city && city.country ? db.countries.findById(city.country) : null);
                const locationStr = city ? city.name + (countryObj ? ', ' + countryObj.name : '') : 'N/A';
                const poster = db.users.findById(l.user_id);
                const isSelected = selectedIds.has(l.listing_id);
                const reportCount = db.reports.find(r => r.target_id === l.listing_id && r.status === 'pending').length;
                let _imgs = l.images || l.photos || [];
                if (typeof _imgs === 'string') { try { _imgs = JSON.parse(_imgs); } catch(e) { _imgs = []; } }
                let thumb = (_imgs && _imgs[0]) ? _imgs[0] : 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=120&h=90&fit=crop';
                if (typeof thumb === 'object' && thumb !== null) thumb = thumb.thumb || thumb.medium || thumb.full || 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=120&h=90&fit=crop';
                return [
                    '<div class="adm-listing-row' + (isSelected ? ' selected' : '') + '" data-id="' + l.listing_id + '">',
                    '<input type="checkbox" class="adm-row-check"' + (isSelected ? ' checked' : '') + ' data-id="' + l.listing_id + '">',
                    '<img src="' + thumb + '" class="adm-listing-thumb" alt="">',
                    '<div class="adm-listing-info">',
                    '<div class="adm-listing-title">' + escHtml(l.title) + '</div>',
                    '<div class="adm-listing-meta">',
                    '<span><i class="fa-solid fa-user"></i> ' + (poster ? escHtml(poster.display_name) : 'Unknown') + '</span>',
                    '<span><i class="fa-solid fa-location-dot"></i> ' + locationStr + '</span>',
                    '<span><i class="fa-solid fa-tag"></i> $' + (l.rent ?? l.price ?? '?') + '/mo</span>',
                    '<span><i class="fa-solid fa-clock"></i> ' + relTime(l.created_at) + '</span>',
                    reportCount > 0 ? '<span class="adm-report-badge"><i class="fa-solid fa-flag"></i> ' + reportCount + ' report' + (reportCount > 1 ? 's' : '') + '</span>' : '',
                    '</div>',
                    '</div>',
                    '<div class="adm-screen-col">' + screenBadge(l.auto_screen_score || 0) + '</div>',
                    '<div class="adm-row-actions">',
                    l.moderation_status !== 'approved' ? '<button class="adm-btn adm-btn-approve" data-action="approve" data-id="' + l.listing_id + '"><i class="fa-solid fa-check"></i> Approve</button>' : '',
                    l.moderation_status !== 'rejected' ? '<button class="adm-btn adm-btn-reject" data-action="reject" data-id="' + l.listing_id + '"><i class="fa-solid fa-xmark"></i> Reject</button>' : '',
                    l.moderation_status !== 'flagged' ? '<button class="adm-btn adm-btn-flag" data-action="flag" data-id="' + l.listing_id + '"><i class="fa-solid fa-flag"></i> Flag</button>' : '',
                    '</div>',
                    '</div>'
                ].join('');
            }).join('');

        container.innerHTML = [
            '<div class="adm-section-header"><h2>Listing Moderation</h2></div>',
            '<div class="adm-tabs">' + tabsHtml + '</div>',
            filtersHtml,
            '<div class="adm-listing-queue">' + listingsHtml + '</div>'
        ].join('');

        // Events
        container.querySelectorAll('.adm-tab').forEach(t => {
            t.addEventListener('click', () => { activeTab = t.dataset.tab; selectedIds.clear(); renderContent(); });
        });
        container.querySelectorAll('.adm-row-check').forEach(cb => {
            cb.addEventListener('change', () => {
                const id = cb.dataset.id;
                if (cb.checked) selectedIds.add(id); else selectedIds.delete(id);
                renderContent();
            });
        });
        container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const reason = btn.dataset.action === 'reject' ? (prompt('Rejection reason (optional):') || 'Violates guidelines') : '';
                doAction(btn.dataset.id, btn.dataset.action, reason);
            });
        });
        container.querySelector('#adm-city-filter')?.addEventListener('change', e => { cityFilter = e.target.value; renderContent(); });
        container.querySelector('#adm-cat-filter')?.addEventListener('change', e => { categoryFilter = e.target.value; renderContent(); });
        container.querySelector('#adm-bulk-approve')?.addEventListener('click', () => {
            selectedIds.forEach(id => doAction(id, 'approve'));
            selectedIds.clear();
        });
        container.querySelector('#adm-bulk-reject')?.addEventListener('click', () => {
            selectedIds.forEach(id => doAction(id, 'reject', 'Bulk rejected'));
            selectedIds.clear();
        });
    }

    renderContent();
}

// ─────────────────────────────────────────────────────────────
// User Management
// ─────────────────────────────────────────────────────────────

function renderAdminUsers(container) {
    let searchQ = '';
    let statusFilter = '';
    let tierFilter = '';
    let countryFilter = '';
    let cityFilter = '';
    let dropdownFor = null;

    function getUsers() {
        return db.users.findAll().filter(u => {
            const matchQ = !searchQ || u.display_name.toLowerCase().includes(searchQ.toLowerCase()) || u.email.toLowerCase().includes(searchQ.toLowerCase());
            const matchStatus = !statusFilter || (statusFilter === 'active' ? u.is_active : !u.is_active);
            const matchTier = !tierFilter || u.subscription_tier === tierFilter;
            const matchCountry = !countryFilter || u.country === countryFilter;
            const matchCity = !cityFilter || u.city === cityFilter;
            return matchQ && matchStatus && matchTier && matchCountry && matchCity;
        }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    async function doUserAction(userId, action) {
        const admin = getCurrentUser();
        const u = db.users.findById(userId);
        if (!u) return;
        if (u.role === 'admin' && u.user_id === admin?.user_id && (action === 'suspend' || action === 'block' || action === 'delete')) {
            showToast('You cannot perform this action on your own admin account.', 'error'); return;
        }
        if (action === 'suspend') {
            await db.users.update(userId, { is_active: false });
            await logAdminAction(admin.user_id, 'Suspended user', u.display_name);
            showToast('User suspended.');
        } else if (action === 'activate') {
            await db.users.update(userId, { is_active: true, is_blocked: false });
            await logAdminAction(admin.user_id, 'Reactivated user', u.display_name);
            showToast('User reactivated.');
        } else if (action === 'block') {
            await db.users.update(userId, { is_active: false, is_blocked: true });
            await logAdminAction(admin.user_id, 'Blocked user', u.display_name);
            showToast('User blocked. They cannot log in or access the platform.', 'error');
        } else if (action === 'unblock') {
            await db.users.update(userId, { is_active: true, is_blocked: false });
            await logAdminAction(admin.user_id, 'Unblocked user', u.display_name);
            showToast('User unblocked.');
        } else if (action === 'make_admin') {
            await db.users.update(userId, { role: 'admin' });
            await logAdminAction(admin.user_id, 'Granted admin role', u.display_name);
            showToast('Admin role granted.');
        } else if (action === 'remove_admin') {
            await db.users.update(userId, { role: 'user' });
            await logAdminAction(admin.user_id, 'Removed admin role', u.display_name);
            showToast('Admin role removed.');
        } else if (action === 'delete') {
            if (!confirm('Permanently delete "' + u.display_name + '"? This will also remove all their listings, messages, and threads. This cannot be undone.')) return;
            // Remove all their listings
            const userListings = db.listings.find(l => l.user_id === userId);
            for (const l of userListings) {
                await db.listings.delete(l.listing_id);
            }
            // Remove threads they are in + associated messages
            const userThreads = db.threads.find(t => {
                const parts = typeof t.participants === 'string' ? JSON.parse(t.participants || '[]') : (t.participants || []);
                return parts.includes(userId);
            });
            for (const t of userThreads) {
                const threadMsgs = db.messages.find(m => m.thread_id === t.thread_id);
                for (const m of threadMsgs) {
                    await db.messages.delete(m.message_id);
                }
                await db.threads.delete(t.thread_id);
            }
            // Remove reports filed by or against this user
            const userReports = db.reports.find(r => r.reporter_id === userId || r.target_id === userId);
            for (const r of userReports) {
                await db.reports.delete(r.report_id);
            }
            // Delete the user
            await db.users.delete(userId);
            await logAdminAction(admin.user_id, 'Deleted user account', u.display_name);
            showToast('User "' + u.display_name + '" permanently deleted.', 'error');
        }
        dropdownFor = null;
        renderContent();
    }

    function renderContent() {
        const users = getUsers();
        const allCountries = db.countries.findAll().sort((a, b) => a.name.localeCompare(b.name));
        const citiesForFilter = countryFilter
            ? db.cities.find(c => c.country === countryFilter && c.is_active !== false).sort((a, b) => a.name.localeCompare(b.name))
            : db.cities.findAll().sort((a, b) => a.name.localeCompare(b.name));

        const filtersHtml = [
            '<div class="adm-filters">',
            '<div class="adm-search-wrap"><i class="fa-solid fa-magnifying-glass"></i><input type="text" id="adm-user-search" class="adm-search-input" placeholder="Search by name or email..." value="' + escHtml(searchQ) + '"></div>',
            '<select class="adm-select" id="adm-status-filter">',
            '<option value="">All Status</option>',
            '<option value="active"' + (statusFilter === 'active' ? ' selected' : '') + '>Active</option>',
            '<option value="inactive"' + (statusFilter === 'inactive' ? ' selected' : '') + '>Suspended</option>',
            '</select>',
            '<select class="adm-select" id="adm-tier-filter">',
            '<option value="">All Tiers</option>',
            ['free', 'basic', 'premium', 'pro'].map(t => '<option value="' + t + '"' + (tierFilter === t ? ' selected' : '') + '>' + t.charAt(0).toUpperCase() + t.slice(1) + '</option>').join(''),
            '</select>',
            '<select class="adm-select" id="adm-country-filter">',
            '<option value="">All Countries</option>',
            allCountries.map(c => '<option value="' + c.country_id + '"' + (countryFilter === c.country_id ? ' selected' : '') + '>' + (c.flag_emoji ? c.flag_emoji + ' ' : '') + c.name + '</option>').join(''),
            '</select>',
            '<select class="adm-select" id="adm-city-filter">',
            '<option value="">All Cities</option>',
            citiesForFilter.map(c => '<option value="' + c.city_id + '"' + (cityFilter === c.city_id ? ' selected' : '') + '>' + escHtml(c.name) + '</option>').join(''),
            '</select>',
            '</div>'
        ].join('');

        const verIcon = { basic: '🔵', phone: '📱', id: '🟢', community: '⭐' };
        const tierColor = { free: '#94a3b8', basic: '#333333', premium: '#1a1a1a', pro: '#555555' };

        const rows = users.map(u => {
            const userCity = db.cities.findById(u.city) || db.cities.findOne(c => c.name === u.city);
            const userCountry = u.country ? db.countries.findById(u.country) : (userCity ? db.countries.findById(userCity.country) : null);
            const userListings = db.listings.find(l => l.user_id === u.user_id).length;
            const src = u.profile_photo || ('https://ui-avatars.com/api/?name=' + encodeURIComponent(u.display_name) + '&background=6366f1&color=fff&size=40');
            const isDropOpen = dropdownFor === u.user_id;
            return [
                '<tr class="adm-user-row">',
                '<td><div class="adm-user-cell"><img src="' + src + '" class="adm-user-sm-avatar"><div><div class="adm-user-nm">' + escHtml(u.display_name) + '</div><div class="adm-user-em">' + escHtml(u.email) + '</div></div></div></td>',
                '<td>' + (userCountry ? (userCountry.flag_emoji ? userCountry.flag_emoji + ' ' : '') + escHtml(userCountry.name) : '—') + '</td>',
                '<td>' + (userCity ? escHtml(userCity.name) : (u.city || '—')) + '</td>',
                '<td>' + new Date(u.created_at).toLocaleDateString() + '</td>',
                '<td><span style="color:' + (tierColor[u.subscription_tier] || '#94a3b8') + ';font-weight:600">' + (u.subscription_tier || 'free') + '</span></td>',
                '<td>' + (verIcon[u.verification_level] || '⚪') + ' ' + (u.verification_level || 'basic') + '</td>',
                '<td>' + userListings + '</td>',
                '<td><span class="adm-status-pill ' + (u.is_blocked ? 'pill-rejected' : u.is_active ? 'pill-active' : 'pill-inactive') + '"><i class="fa-solid ' + (u.is_blocked ? 'fa-ban' : u.is_active ? 'fa-circle-check' : 'fa-circle-xmark') + '" style="font-size:0.65rem"></i> ' + (u.is_blocked ? 'Blocked' : u.is_active ? 'Active' : 'Suspended') + '</span></td>',
                '<td><div style="position:relative">',
                '<button class="adm-action-toggle" data-uid="' + u.user_id + '"><i class="fa-solid fa-ellipsis-vertical"></i></button>',
                isDropOpen ? [
                    '<div class="adm-user-dropdown">',
                    u.is_blocked
                        ? '<div class="adm-dd-item" data-uid="' + u.user_id + '" data-action="unblock"><i class="fa-solid fa-lock-open"></i> Unblock</div>'
                        : u.is_active
                            ? '<div class="adm-dd-item" data-uid="' + u.user_id + '" data-action="suspend"><i class="fa-solid fa-user-slash"></i> Suspend</div>'
                            : '<div class="adm-dd-item" data-uid="' + u.user_id + '" data-action="activate"><i class="fa-solid fa-user-check"></i> Reactivate</div>',
                    !u.is_blocked ? '<div class="adm-dd-item adm-dd-item-warn" data-uid="' + u.user_id + '" data-action="block"><i class="fa-solid fa-ban"></i> Block User</div>' : '',
                    u.role !== 'admin' ? '<div class="adm-dd-item" data-uid="' + u.user_id + '" data-action="make_admin"><i class="fa-solid fa-shield-halved"></i> Make Admin</div>' : '',
                    u.role === 'admin' ? '<div class="adm-dd-item" data-uid="' + u.user_id + '" data-action="remove_admin"><i class="fa-solid fa-shield"></i> Remove Admin</div>' : '',
                    '<div class="adm-dd-divider"></div>',
                    '<div class="adm-dd-item adm-dd-item-danger" data-uid="' + u.user_id + '" data-action="delete"><i class="fa-solid fa-trash"></i> Delete User</div>',
                    '</div>'
                ].join('') : '',
                '</div></td>',
                '</tr>'
            ].join('');
        }).join('');

        container.innerHTML = [
            '<div class="adm-section-header">',
            '<h2>User Management</h2>',
            '<span class="adm-count-badge">' + users.length + ' users</span>',
            '<div style="margin-left:auto;display:flex;gap:8px;">',
            '<button class="adm-btn adm-btn-sm" id="adm-sync-hono-btn" style="display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-arrows-rotate"></i> Sync with Hono</button>',
            '<button class="btn btn-primary btn-sm" id="adm-send-notif-btn" style="display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-bell"></i> Send Notification</button>',
            '</div>',
            '</div>',
            filtersHtml,
            '<div class="adm-table-wrap">',
            '<table class="adm-table">',
            '<thead><tr><th>User</th><th>Country</th><th>City</th><th>Joined</th><th>Tier</th><th>Verification</th><th>Listings</th><th>Status</th><th>Actions</th></tr></thead>',
            '<tbody>' + rows + '</tbody>',
            '</table>',
            '</div>'
        ].join('');

        // Events
        container.querySelector('#adm-user-search')?.addEventListener('input', e => { searchQ = e.target.value; renderContent(); });
        container.querySelector('#adm-status-filter')?.addEventListener('change', e => { statusFilter = e.target.value; renderContent(); });
        container.querySelector('#adm-tier-filter')?.addEventListener('change', e => { tierFilter = e.target.value; renderContent(); });
        container.querySelector('#adm-country-filter')?.addEventListener('change', e => { countryFilter = e.target.value; cityFilter = ''; renderContent(); });
        container.querySelector('#adm-city-filter')?.addEventListener('change', e => { cityFilter = e.target.value; renderContent(); });

        container.querySelectorAll('.adm-action-toggle').forEach(btn => {
            btn.addEventListener('click', e => {
                e.stopPropagation();
                dropdownFor = dropdownFor === btn.dataset.uid ? null : btn.dataset.uid;
                renderContent();
            });
        });
        document.addEventListener('click', () => { if (dropdownFor) { dropdownFor = null; renderContent(); } }, { once: true });

        container.querySelectorAll('[data-uid][data-action]').forEach(item => {
            item.addEventListener('click', e => {
                e.stopPropagation();
                doUserAction(item.dataset.uid, item.dataset.action);
            });
        });

        container.querySelector('#adm-send-notif-btn')?.addEventListener('click', openNotifModal);
        container.querySelector('#adm-sync-hono-btn')?.addEventListener('click', async () => {
            const btn = container.querySelector('#adm-sync-hono-btn');
            const icon = btn.querySelector('i');
            icon.classList.add('fa-spin');
            btn.disabled = true;
            
            showToast('Syncing users from Hono API...', 'info');
            const success = await db.syncUsers();
            
            icon.classList.remove('fa-spin');
            btn.disabled = false;
            
            if (success) {
                showToast('Successfully synced users!');
                renderContent();
            } else {
                showToast('Failed to sync users. Check if the Worker is running.', 'error');
            }
        });
    }

    // ── Send Notification Modal ──
    function openNotifModal() {
        const existing = document.getElementById('adm-notif-modal');
        if (existing) existing.remove();

        const allCountries = db.countries.findAll().filter(c => c.is_active).sort((a, b) => a.name.localeCompare(b.name));
        const allUsers = db.users.findAll().filter(u => u.role !== 'admin');

        const modal = document.createElement('div');
        modal.id = 'adm-notif-modal';
        modal.className = 'adm-notif-overlay';
        modal.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.45);backdrop-filter:blur(4px);display:flex;align-items:center;justify-content:center;z-index:99999;padding:16px;';
        modal.innerHTML = `
        <div style="background:#fff;border-radius:16px;width:100%;max-width:560px;max-height:90vh;display:flex;flex-direction:column;box-shadow:0 24px 64px rgba(0,0,0,0.2);overflow:hidden;">
          <div style="display:flex;align-items:center;justify-content:space-between;padding:20px 24px;border-bottom:1px solid #e2e8f0;">
            <h3 style="margin:0;font-size:1.05rem;font-weight:700;display:flex;align-items:center;gap:8px;"><i class="fa-solid fa-bell" style="color:var(--primary);"></i> Send Notification</h3>
            <button id="adm-notif-close" style="background:none;border:none;cursor:pointer;width:32px;height:32px;border-radius:8px;display:flex;align-items:center;justify-content:center;color:#64748b;font-size:1rem;"><i class="fa-solid fa-xmark"></i></button>
          </div>
          <div style="display:flex;flex-direction:column;gap:16px;padding:20px 24px;overflow-y:auto;flex:1;">

            <div class="form-group">
              <label style="font-weight:600;font-size:0.85rem;">Target Audience</label>
              <select class="form-control" id="notif-target-type">
                <option value="all">All Users</option>
                <option value="country">By Country</option>
                <option value="city">By City</option>
                <option value="manual">Manual Selection</option>
              </select>
            </div>

            <div class="form-group" id="notif-country-wrap" style="display:none;">
              <label style="font-weight:600;font-size:0.85rem;">Select Country</label>
              <select class="form-control" id="notif-country">
                <option value="">Select a country</option>
                ${allCountries.map(c => `<option value="${c.country_id}">${c.flag_emoji ? c.flag_emoji + ' ' : ''}${escHtml(c.name)}</option>`).join('')}
              </select>
            </div>

            <div class="form-group" id="notif-city-wrap" style="display:none;">
              <label style="font-weight:600;font-size:0.85rem;">Select City</label>
              <select class="form-control" id="notif-city">
                <option value="">Select a city</option>
              </select>
            </div>

            <div class="form-group" id="notif-manual-wrap" style="display:none;">
              <label style="font-weight:600;font-size:0.85rem;">Select Users</label>
              <div id="notif-user-list" style="max-height:180px;overflow-y:auto;border:1px solid var(--border);border-radius:8px;padding:8px;display:flex;flex-direction:column;gap:6px;">
                ${allUsers.map(u => `
                  <label style="display:flex;align-items:center;gap:8px;cursor:pointer;padding:4px 2px;font-size:0.85rem;">
                    <input type="checkbox" class="notif-user-cb" value="${u.user_id}" style="width:15px;height:15px;">
                    <img src="${u.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.display_name)}&background=6366f1&color=fff&size=32`}" style="width:26px;height:26px;border-radius:50%;object-fit:cover;">
                    <span>${escHtml(u.display_name)}</span>
                    <span style="color:var(--text-secondary);font-size:0.75rem;">${escHtml(u.email)}</span>
                  </label>`).join('')}
              </div>
            </div>

            <div class="form-group">
              <label style="font-weight:600;font-size:0.85rem;">Title <span style="color:#e53e3e">*</span></label>
              <input type="text" class="form-control" id="notif-title" placeholder="Notification title" maxlength="100">
            </div>

            <div class="form-group">
              <label style="font-weight:600;font-size:0.85rem;">Description <span style="color:#e53e3e">*</span></label>
              <textarea class="form-control" id="notif-desc" rows="3" placeholder="Write your message..." maxlength="500"></textarea>
            </div>

            <div class="form-group">
              <label style="font-weight:600;font-size:0.85rem;">Image <span style="color:var(--text-secondary);font-weight:400;">(optional)</span></label>
              <div id="notif-img-preview" style="display:none;margin-bottom:8px;"><img id="notif-img-thumb" src="" style="max-height:120px;border-radius:8px;border:1px solid var(--border);"></div>
              <label class="btn btn-outline btn-sm" for="notif-img-input" style="cursor:pointer;display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-image"></i> Upload Image<input type="file" id="notif-img-input" accept="image/*" style="display:none;"></label>
            </div>

            <div class="form-group">
              <label style="font-weight:600;font-size:0.85rem;">Website URL <span style="color:var(--text-secondary);font-weight:400;">(optional)</span></label>
              <input type="url" class="form-control" id="notif-url" placeholder="https://example.com">
            </div>

          </div>
          <div style="display:flex;justify-content:flex-end;gap:10px;padding:16px 24px;border-top:1px solid #e2e8f0;flex-shrink:0;">
            <button class="btn btn-outline" id="adm-notif-cancel">Cancel</button>
            <button class="btn btn-primary" id="adm-notif-submit"><i class="fa-solid fa-paper-plane"></i> Send</button>
          </div>
        </div>`;

        document.body.appendChild(modal);

        const targetSel   = modal.querySelector('#notif-target-type');
        const countryWrap = modal.querySelector('#notif-country-wrap');
        const cityWrap    = modal.querySelector('#notif-city-wrap');
        const manualWrap  = modal.querySelector('#notif-manual-wrap');
        const countrySel  = modal.querySelector('#notif-country');
        const citySel     = modal.querySelector('#notif-city');
        let notifImageB64 = '';

        targetSel.addEventListener('change', () => {
            const v = targetSel.value;
            countryWrap.style.display = v === 'country' || v === 'city' ? '' : 'none';
            cityWrap.style.display    = v === 'city' ? '' : 'none';
            manualWrap.style.display  = v === 'manual' ? '' : 'none';
        });

        countrySel.addEventListener('change', () => {
            const cid = countrySel.value;
            citySel.innerHTML = '<option value="">Select a city</option>';
            if (cid) {
                db.cities.find(c => c.country === cid && c.is_active !== false)
                    .sort((a, b) => a.name.localeCompare(b.name))
                    .forEach(c => {
                        const o = document.createElement('option');
                        o.value = c.city_id; o.textContent = c.name;
                        citySel.appendChild(o);
                    });
            }
        });

        modal.querySelector('#notif-img-input').addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => {
                notifImageB64 = ev.target.result;
                modal.querySelector('#notif-img-thumb').src = notifImageB64;
                modal.querySelector('#notif-img-preview').style.display = '';
            };
            reader.readAsDataURL(file);
        });

        function closeModal() { modal.remove(); }
        modal.querySelector('#adm-notif-close').addEventListener('click', closeModal);
        modal.querySelector('#adm-notif-cancel').addEventListener('click', closeModal);
        modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

        modal.querySelector('#adm-notif-submit').addEventListener('click', () => {
            const title = modal.querySelector('#notif-title').value.trim();
            const desc  = modal.querySelector('#notif-desc').value.trim();
            const url   = modal.querySelector('#notif-url').value.trim();
            if (!title) { showToast('Title is required.', 'error'); return; }
            if (!desc)  { showToast('Description is required.', 'error'); return; }

            const admin = getCurrentUser();
            const targetType = targetSel.value;
            let recipients = [];

            if (targetType === 'all') {
                recipients = db.users.findAll().filter(u => u.role !== 'admin').map(u => u.user_id);
            } else if (targetType === 'country') {
                const cid = countrySel.value;
                if (!cid) { showToast('Please select a country.', 'error'); return; }
                recipients = db.users.find(u => u.country === cid && u.role !== 'admin').map(u => u.user_id);
            } else if (targetType === 'city') {
                const cityId = citySel.value;
                if (!cityId) { showToast('Please select a city.', 'error'); return; }
                recipients = db.users.find(u => u.city === cityId && u.role !== 'admin').map(u => u.user_id);
            } else if (targetType === 'manual') {
                modal.querySelectorAll('.notif-user-cb:checked').forEach(cb => recipients.push(cb.value));
                if (recipients.length === 0) { showToast('Please select at least one user.', 'error'); return; }
            }

            if (recipients.length === 0) { showToast('No users match the selected target.', 'error'); return; }

            recipients.forEach(userId => {
                db.notifications.create({
                    user_id:     userId,
                    sent_by:     admin.user_id,
                    title,
                    description: desc,
                    image_url:   notifImageB64 || null,
                    website_url: url || null,
                    is_read:     false,
                    created_at:  new Date().toISOString(),
                });
            });

            logAdminAction(admin.user_id, 'Sent notification to ' + recipients.length + ' users', title);
            showToast('Notification sent to ' + recipients.length + ' user(s)!', 'success');
            closeModal();
        });
    }

    renderContent();
}

// ─────────────────────────────────────────────────────────────
// Verification Approvals
// ─────────────────────────────────────────────────────────────

function renderAdminVerifications(container) {
    let mode = 'pending';

    function getPendingVerifs() {
        return db.users.find(u => mode === 'pending' ? u.id_status === 'pending' : u.id_status !== 'pending' && u.id_status !== undefined)
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    async function doVerifyAction(userId, action, reason = '') {
        const admin = getCurrentUser();
        const u = db.users.findById(userId);
        if (!u) return;
        
        if (action === 'approve') {
            await db.users.update(userId, { id_status: 'approved', id_verified: true, verification_level: u.verification_level === 'basic' || u.verification_level === 'phone' ? 'id' : u.verification_level });
            await logAdminAction(admin.user_id, 'Approved ID Verification', u.display_name);
            
            // Notify user
            await db.notifications.create({
                user_id: userId,
                type: 'verification_approved',
                title: 'ID Verification Approved! ✅',
                body: 'Your identity has been verified. You now have a verified badge on your profile.',
                link: '/dashboard/profile'
            });
            showToast('User ID verified successfully.');
        } else if (action === 'reject') {
            await db.users.update(userId, { id_status: 'rejected', id_reject_reason: reason, verification_id_photo: null, verification_selfie: null });
            await logAdminAction(admin.user_id, 'Rejected ID Verification: ' + reason, u.display_name);
            
            // Notify user
            await db.notifications.create({
                user_id: userId,
                type: 'verification_rejected',
                title: 'ID Verification Rejected ❌',
                body: `Your ID verification request was rejected. Reason: ${reason}. Please try again with clearer photos.`,
                link: '/dashboard/profile'
            });
            showToast('ID Verification rejected and removed.', 'error');
        }
        
        renderContent();
    }

    function renderContent() {
        const verifs = getPendingVerifs();
        
        const tabsHtml = [
            '<button class="adm-tab' + (mode === 'pending' ? ' active' : '') + '" data-mode="pending">Pending Queue ' + (mode === 'pending' ? '<span class="adm-tab-count">' + verifs.length + '</span>' : '') + '</button>',
            '<button class="adm-tab' + (mode === 'history' ? ' active' : '') + '" data-mode="history">History</button>'
        ].join('');

        const verifCards = verifs.length === 0
            ? `<div class="adm-empty"><i class="fa-solid fa-check-double" style="font-size:3rem;color:#333333;"></i><p>No ${mode === 'pending' ? 'pending' : 'historical'} ID verifications.</p></div>`
            : verifs.map(u => {
                const submittedDate = u.updated_at ? new Date(u.updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Unknown';
                const statusBadge = u.id_status === 'pending'
                    ? `<span class="badge badge-warning"><i class="fas fa-clock"></i> Pending Review</span>`
                    : u.id_status === 'approved'
                        ? `<span class="badge badge-success"><i class="fas fa-check"></i> Approved</span>`
                        : `<span class="badge badge-danger"><i class="fas fa-times"></i> Rejected</span>`;
                const avatar = u.profile_photo
                    ? `<img src="${escHtml(u.profile_photo)}" style="width:44px;height:44px;border-radius:50%;object-fit:cover;border:2px solid #e2e8f0;">`
                    : `<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,#1a1a1a,#555555);color:white;display:flex;align-items:center;justify-content:center;font-weight:700;font-size:1.1rem;">${(u.display_name || '?').charAt(0).toUpperCase()}</div>`;
                const verifLevelIcon = { basic: '⚪', phone: '🔵', id: '🟣', community: '🌟' }[u.verification_level] || '⚪';

                return `
                <div class="adm-panel" style="border-radius:16px;overflow:hidden;border:1px solid #e2e8f0;">
                    <div class="adm-panel-header" style="background:linear-gradient(135deg,#f8fafc,#f1f5f9);padding:18px 24px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;justify-content:space-between;gap:16px;">
                        <div style="display:flex;align-items:center;gap:14px;">
                            ${avatar}
                            <div>
                                <div style="font-weight:700;font-size:1.05rem;">${escHtml(u.display_name || 'Unknown')} ${verifLevelIcon}</div>
                                <div style="font-size:0.82rem;color:#64748b;">${escHtml(u.email)} · Submitted ${submittedDate}</div>
                            </div>
                        </div>
                        <div style="display:flex;align-items:center;gap:10px;">
                            ${statusBadge}
                        </div>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:0;background:#f8fafc;">
                        <div style="padding:20px;border-right:1px solid #e2e8f0;text-align:center;">
                            <div style="font-weight:700;color:#475569;margin-bottom:12px;font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;"><i class="fas fa-id-card" style="color:#1a1a1a;"></i> Government ID</div>
                            ${u.verification_id_photo
                                ? `<img src="${escHtml(u.verification_id_photo)}" alt="ID Photo" style="max-width:100%;max-height:220px;object-fit:contain;border-radius:10px;border:1px solid #e2e8f0;cursor:pointer;" onclick="window.open(this.src,'_blank')" title="Click to open full size">`
                                : `<div style="height:180px;background:#f1f5f9;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#94a3b8;border:2px dashed #dddddd;"><i class="fas fa-image" style="font-size:3rem;"></i></div>`}
                        </div>
                        <div style="padding:20px;text-align:center;">
                            <div style="font-weight:700;color:#475569;margin-bottom:12px;font-size:0.9rem;text-transform:uppercase;letter-spacing:0.05em;"><i class="fas fa-camera" style="color:#1a1a1a;"></i> Live Selfie</div>
                            ${u.verification_selfie
                                ? `<img src="${escHtml(u.verification_selfie)}" alt="Selfie" style="max-width:100%;max-height:220px;object-fit:contain;border-radius:10px;border:1px solid #e2e8f0;cursor:pointer;" onclick="window.open(this.src,'_blank')" title="Click to open full size">`
                                : `<div style="height:180px;background:#f1f5f9;border-radius:10px;display:flex;align-items:center;justify-content:center;color:#94a3b8;border:2px dashed #dddddd;"><i class="fas fa-user-circle" style="font-size:3rem;"></i></div>`}
                        </div>
                    </div>
                    ${u.id_status === 'pending' ? `
                    <div style="padding:16px 24px;background:white;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                        <button class="btn btn-outline btn-sm adm-btn-fraud" data-uid="${escHtml(u.user_id)}" style="gap:6px;">
                            <i class="fa-solid fa-database"></i> Check Fraud DB
                        </button>
                        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
                            <select class="form-control adm-reject-reason" data-uid="${escHtml(u.user_id)}" style="min-width:200px;">
                                <option value="">Select Rejection Reason...</option>
                                <option value="Blurry Photo">📷 Blurry Photo</option>
                                <option value="ID Mismatch">🔍 ID Mismatch</option>
                                <option value="Expired ID">📅 Expired ID</option>
                                <option value="Underage">🔞 Underage</option>
                                <option value="Suspected Fraud">🚨 Suspected Fraud</option>
                            </select>
                            <button class="adm-btn adm-btn-reject" data-action="reject" data-uid="${escHtml(u.user_id)}" style="display:flex;align-items:center;gap:6px;">
                                <i class="fas fa-times"></i> Reject
                            </button>
                            <button class="adm-btn adm-btn-approve" data-action="approve" data-uid="${escHtml(u.user_id)}" style="display:flex;align-items:center;gap:6px;">
                                <i class="fas fa-check"></i> Approve
                            </button>
                        </div>
                    </div>` : (u.id_reject_reason
                        ? `<div style="padding:16px 24px;background:#f5f5f5;border-top:1px solid #dddddd;color:#1a1a1a;font-size:0.9rem;"><i class="fas fa-times-circle"></i> Rejected: ${escHtml(u.id_reject_reason)}</div>`
                        : `<div style="padding:16px 24px;background:#f5f5f5;border-top:1px solid #dddddd;color:#333333;font-size:0.9rem;"><i class="fas fa-check-circle"></i> Approved — User is now ID Verified</div>`)}
                </div>`;
            }).join('');

        container.innerHTML = [
            '<div class="adm-section-header"><h2>ID Verifications</h2></div>',
            '<div class="adm-tabs">' + tabsHtml + '</div>',
            '<div class="adm-verif-list" style="display:grid;gap:20px;">' + verifCards + '</div>'
        ].join('');


        container.querySelectorAll('.adm-tab').forEach(t => t.addEventListener('click', () => { mode = t.dataset.mode; renderContent(); }));
        
        container.querySelectorAll('[data-action]').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.dataset.uid;
                const act = btn.dataset.action;
                let reason = '';
                if (act === 'reject') {
                    const select = container.querySelector('.adm-reject-reason[data-uid="' + uid + '"]');
                    if (!select.value) { alert('Please select a rejection reason.'); return; }
                    reason = select.value;
                }
                doVerifyAction(uid, act, reason);
            });
        });

        container.querySelectorAll('.adm-btn-fraud').forEach(btn => {
            btn.addEventListener('click', () => {
                const uid = btn.dataset.uid;
                btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Checking...';
                setTimeout(() => {
                    const isFraud = Math.random() > 0.8; // 20% Mock
                    if (isFraud) {
                        doVerifyAction(uid, 'reject', 'Found in Fraud Database');
                    } else {
                        btn.innerHTML = '<i class="fa-solid fa-check" style="color:#333333;"></i> Clean (Not in DB)';
                        btn.disabled = true;
                    }
                }, 1000);
            });
        });
    }

    renderContent();
}

// ─────────────────────────────────────────────────────────────
// Reports & Flags
// ─────────────────────────────────────────────────────────────

function renderAdminReports(container) {
    let statusFilter = 'pending';

    function getReports() {
        const all = db.reports.findAll();

        // Calculate report counts per target
        const counts = {};
        all.forEach(r => { counts[r.target_id] = (counts[r.target_id] || 0) + 1; });

        return all
            .filter(r => !statusFilter || r.status === statusFilter)
            .map(r => ({ ...r, report_count: counts[r.target_id] || 1, priority: counts[r.target_id] >= 3 ? 'high' : (counts[r.target_id] >= 2 ? 'medium' : 'low') }))
            .sort((a, b) => {
                const pOrder = { high: 0, medium: 1, low: 2 };
                if (pOrder[a.priority] !== pOrder[b.priority]) return pOrder[a.priority] - pOrder[b.priority];
                return new Date(b.created_at) - new Date(a.created_at);
            });
    }

    async function doReportAction(reportId, action) {
        const admin = getCurrentUser();
        const r = db.reports.findById(reportId);
        if (!r) return;
        if (action === 'dismiss') {
            db.reports.update(reportId, { status: 'dismissed' });
            logAdminAction(admin.user_id, 'Dismissed report', r.target_name);
            showToast('Report dismissed.');
        } else if (action === 'remove') {
            await db.listings.update(r.target_id, { status: 'removed', moderation_status: 'rejected' });
            await db.reports.update(reportId, { status: 'resolved' });
            await logAdminAction(admin.user_id, 'Removed content', r.target_name);

            // Notify owner
            const listing = db.listings.findById(r.target_id);
            if (listing) {
                await db.notifications.create({
                    user_id: listing.user_id,
                    type: 'content_removed',
                    title: 'Content Removed ⚠️',
                    body: `Your listing "${listing.title}" was removed due to multiple user reports.`,
                    link: '/dashboard'
                });
            }
            showToast('Content removed.', 'error');
        } else if (action === 'warn') {
            await db.reports.update(reportId, { status: 'warned' });
            await logAdminAction(admin.user_id, 'Issued warning', r.target_name);

            // Notify user
            const targetId = r.target_type === 'user' ? r.target_id : (db.listings.findById(r.target_id)?.user_id);
            if (targetId) {
                await db.notifications.create({
                    user_id: targetId,
                    type: 'system_warning',
                    title: 'System Warning ⚠️',
                    body: `You have received a formal warning due to your recent activity. Please review our community guidelines.`,
                    link: '/safety'
                });
            }
            showToast('Warning issued to user.');
        } else if (action === 'ban') {
            const targetId = r.target_type === 'user' ? r.target_id : (db.listings.findById(r.target_id)?.user_id);
            if (targetId) {
                await db.users.update(targetId, { is_active: false });
                await db.reports.update(reportId, { status: 'resolved' });
                await logAdminAction(admin.user_id, 'Banned user', r.target_name);
                showToast('User banned successfully.', 'error');
            }
        }
        renderContent();
    }

    function renderContent() {
        const reports = getReports();
        const statusTabs = ['pending', 'dismissed', 'resolved', 'warned'];

        const tabsHtml = statusTabs.map(s => {
            const count = db.reports.find(r => r.status === s).length;
            return '<button class="adm-tab' + (s === statusFilter ? ' active' : '') + '" data-tab="' + s + '">' +
                s.charAt(0).toUpperCase() + s.slice(1) + (count > 0 ? ' <span class="adm-tab-count">' + count + '</span>' : '') + '</button>';
        }).join('');

        const priorityBadge = p => ({
            high: '<span class="adm-priority high"><i class="fa-solid fa-fire"></i> High</span>',
            medium: '<span class="adm-priority medium"><i class="fa-solid fa-exclamation"></i> Medium</span>',
            low: '<span class="adm-priority low"><i class="fa-solid fa-minus"></i> Low</span>',
        }[p] || '');

        const reportItems = reports.length === 0 ? '<div class="adm-empty"><i class="fa-solid fa-flag"></i><p>No reports in this category.</p></div>' :
            reports.map(r => [
                '<div class="adm-report-card' + (r.priority === 'high' ? ' escalated' : '') + '">',
                '<div class="adm-report-left">',
                '<div class="adm-report-priority">' + priorityBadge(r.priority) + (r.report_count >= 3 ? '<span class="adm-escalated-tag">Auto-escalated</span>' : '') + '</div>',
                '<div class="adm-report-type-badge ' + r.type + '">' + (r.type === 'listing' ? '<i class="fa-solid fa-house"></i>' : '<i class="fa-solid fa-user"></i>') + ' ' + r.type + '</div>',
                '</div>',
                '<div class="adm-report-body">',
                '<div class="adm-report-target">' + escHtml(r.target_name) + '</div>',
                '<div class="adm-report-reason">"' + escHtml(r.reason) + '" — reported by <strong>' + escHtml(r.reporter_name) + '</strong></div>',
                '<div class="adm-report-meta">' + relTime(r.created_at) + ' · ' + r.report_count + ' total report(s)</div>',
                '</div>',
                '<div class="adm-report-actions">',
                r.status === 'pending' ? [
                    '<button class="adm-btn adm-btn-sm" data-rid="' + r.report_id + '" data-raction="dismiss">Dismiss</button>',
                    '<button class="adm-btn adm-btn-sm adm-btn-warn" data-rid="' + r.report_id + '" data-raction="warn">Warn</button>',
                    r.target_type === 'listing' ? '<button class="adm-btn adm-btn-sm adm-btn-reject" data-rid="' + r.report_id + '" data-raction="remove">Remove</button>' : '',
                    '<button class="adm-btn adm-btn-sm adm-btn-danger" data-rid="' + r.report_id + '" data-raction="ban"><i class="fa-solid fa-ban"></i> Ban</button>',
                ].join('') : '<span class="adm-status-pill pill-inactive">' + r.status + '</span>',
                '</div>',
                '</div>'
            ].join('')).join('');

        container.innerHTML = [
            '<div class="adm-section-header"><h2>Reports & Flags</h2><span class="adm-count-badge">' + reports.length + ' shown</span></div>',
            '<div class="adm-tabs">' + tabsHtml + '</div>',
            '<div class="adm-reports-list">' + reportItems + '</div>'
        ].join('');

        container.querySelectorAll('.adm-tab').forEach(t => {
            t.addEventListener('click', () => { statusFilter = t.dataset.tab; renderContent(); });
        });
        container.querySelectorAll('[data-raction]').forEach(btn => {
            btn.addEventListener('click', () => doReportAction(btn.dataset.rid, btn.dataset.raction));
        });
    }

    renderContent();
}

// ─────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────

function renderAdminAnalytics(container) {
    // ── Live data from DB ──────────────────────────────────────
    const allUsers = db.users.find(u => u.role !== 'admin');
    const activeListings = db.listings.find(l => l.status === 'active');
    const allThreads = db.threads.findAll();
    const allMessages = db.messages.findAll();

    // Conversion funnel — all numbers are real, percentages auto-calculated
    const visitors = getTotalVisits();
    const registered = allUsers.length;
    const listed = activeListings.length;
    // Messaged = unique conversations started
    const messaged = allThreads.length;
    // Converted = threads with replies from both sides (2+ messages in thread)
    const threadMsgCounts = {};
    allMessages.forEach(m => {
        threadMsgCounts[m.thread_id] = (threadMsgCounts[m.thread_id] || 0) + 1;
    });
    const converted = Object.values(threadMsgCounts).filter(n => n >= 2).length;

    const safeBase = Math.max(visitors, 1);
    const pct = v => visitors > 0 ? +((v / safeBase) * 100).toFixed(1) : 0;

    const funnel = [
        { label: 'Visitors',   value: visitors,   pct: 100 },
        { label: 'Registered', value: registered, pct: pct(registered) },
        { label: 'Listed',     value: listed,     pct: pct(listed) },
        { label: 'Messaged',   value: messaged,   pct: pct(messaged) },
        { label: 'Converted',  value: converted,  pct: pct(converted) },
    ];

    const funnelHtml = funnel.map((step, i) => {
        const widthPct = 100 - i * 15;
        return [
            '<div class="adm-funnel-step">',
            '<div class="adm-funnel-bar" style="width:' + widthPct + '%;opacity:' + (1 - i * 0.15) + '">',
            '<span class="adm-funnel-label">' + step.label + '</span>',
            '<span class="adm-funnel-value">' + step.value.toLocaleString() + '</span>',
            '</div>',
            '<div class="adm-funnel-pct">' + step.pct + '%</div>',
            '</div>'
        ].join('');
    }).join('');

    // ── 30-day charts — real per-day counts from DB ────────────
    function getDailyCountsFor30Days(items, dateField) {
        const counts = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dayStr = d.toISOString().slice(0, 10);
            counts.push(items.filter(item => {
                const ts = item[dateField];
                return ts && ts.slice(0, 10) === dayStr;
            }).length);
        }
        return counts;
    }

    const newUserCounts     = getDailyCountsFor30Days(allUsers, 'created_at');
    const newListingCounts  = getDailyCountsFor30Days(activeListings, 'created_at');
    const newUserTotal      = newUserCounts.reduce((s, n) => s + n, 0);
    const newListingTotal   = newListingCounts.reduce((s, n) => s + n, 0);

    // ── Top cities using live listing counts ───────────────────
    const citiesData = db.cities.findAll()
        .map(c => ({ ...c, liveCount: getLiveListingCount(c.city_id) }))
        .sort((a, b) => b.liveCount - a.liveCount)
        .slice(0, 5);
    const maxListings = Math.max(...citiesData.map(c => c.liveCount), 1);
    const citiesHtml = citiesData.map((c, i) => [
        '<div class="adm-top-city">',
        '<span class="adm-city-rank">' + (i + 1) + '</span>',
        '<div class="adm-city-row-info">',
        '<span class="adm-city-name">' + escHtml(c.name) + '</span>',
        '<div class="adm-city-bar-wrap"><div class="adm-city-bar" style="width:' + Math.round(c.liveCount / maxListings * 100) + '%"></div></div>',
        '</div>',
        '<span class="adm-city-count">' + c.liveCount + '</span>',
        '</div>'
    ].join('')).join('');

    // ── Revenue breakdown ──────────────────────────────────────
    const TIER_PRICE_AN = { free: 0, premium: 29, pro: 49, admin: 0 };
    const subMRR = db.users.findAll().reduce((sum, u) => sum + (TIER_PRICE_AN[u.subscription_tier] || 0), 0);
    const revBreakdown = subMRR > 0
        ? [{ label: 'Subscriptions', value: subMRR, pct: 100, color: '#1a1a1a' }]
        : [{ label: 'No revenue yet', value: 0, pct: 0, color: '#94a3b8' }];
    const revHtml = revBreakdown.map(r => [
        '<div class="adm-rev-row">',
        '<div class="adm-rev-dot" style="background:' + r.color + '"></div>',
        '<span class="adm-rev-label">' + r.label + '</span>',
        '<div class="adm-rev-bar-wrap"><div class="adm-rev-bar" style="width:' + r.pct + '%;background:' + r.color + '"></div></div>',
        '<span class="adm-rev-value">$' + r.value.toLocaleString() + '</span>',
        '</div>'
    ].join('')).join('');

    // ── Search analytics — live from tracked queries ───────────
    const topQueries  = getTopSearchQueries(5);
    const zeroQueries = getZeroResultQueries(5);
    const searchHtml = topQueries.length
        ? topQueries.map((q, i) => '<div class="adm-search-row"><span class="adm-search-rank">' + (i + 1) + '</span><span class="adm-search-query">' + escHtml(q.query) + '</span><span class="adm-search-count">' + q.count + 'x</span></div>').join('')
        : '<div class="adm-search-row" style="color:#94a3b8">No searches recorded yet</div>';
    const zeroHtml = zeroQueries.length
        ? zeroQueries.map(q => '<div class="adm-search-row zero"><i class="fa-solid fa-circle-xmark"></i><span class="adm-search-query">' + escHtml(q.query) + '</span><span class="adm-search-count">' + q.count + 'x</span></div>').join('')
        : '<div class="adm-search-row" style="color:#94a3b8">No zero-result searches</div>';

    container.innerHTML = [
        '<div class="adm-section-header"><h2>Analytics</h2></div>',

        '<div class="adm-analytics-grid">',

        // Funnel
        '<div class="adm-panel adm-panel-full">',
        '<div class="adm-panel-header"><h3>Conversion Funnel</h3><span style="font-size:.8rem;color:#64748b">Based on ' + visitors.toLocaleString() + ' tracked page views</span></div>',
        '<div class="adm-funnel">' + funnelHtml + '</div>',
        '</div>',

        // New Users (30 days) — real per-day line chart
        '<div class="adm-panel">',
        '<div class="adm-panel-header"><h3>New Users (30 days) <span style="font-size:.85rem;font-weight:400">+' + newUserTotal + '</span></h3></div>',
        '<div class="adm-chart-box">' + buildLineChart(newUserCounts, '#1a1a1a', 500, 140) + '</div>',
        '</div>',

        // Listings Published (30 days) — real per-day bar chart
        '<div class="adm-panel">',
        '<div class="adm-panel-header"><h3>Listings Published (30 days) <span style="font-size:.85rem;font-weight:400">+' + newListingTotal + '</span></h3></div>',
        '<div class="adm-chart-box">' + buildBarChart(newListingCounts, '#333333', 500, 140) + '</div>',
        '</div>',

        // Top cities
        '<div class="adm-panel">',
        '<div class="adm-panel-header"><h3>Top Cities by Activity</h3></div>',
        '<div class="adm-top-cities">' + citiesHtml + '</div>',
        '</div>',

        // Revenue
        '<div class="adm-panel">',
        '<div class="adm-panel-header"><h3>Revenue Breakdown <span style="font-size:.85rem;font-weight:400">MRR: $' + subMRR.toLocaleString() + '</span></h3></div>',
        '<div class="adm-rev-list">' + revHtml + '</div>',
        '</div>',

        // Search analytics
        '<div class="adm-panel">',
        '<div class="adm-panel-header"><h3>Top Search Queries</h3></div>',
        '<div class="adm-search-list">' + searchHtml + '</div>',
        '</div>',
        '<div class="adm-panel">',
        '<div class="adm-panel-header"><h3>Zero-Result Queries</h3></div>',
        '<div class="adm-search-list">' + zeroHtml + '</div>',
        '</div>',

        '</div>'
    ].join('');
}

// ─────────────────────────────────────────────────────────────
// City Management
// ─────────────────────────────────────────────────────────────

function renderAdminCities(container) {
    let activeTab = 'countries';
    let editingCountry = null;
    let editingCity = null;
    let editingNeighborhood = null;
    let showCountryForm = false;
    let showCityForm = false;
    let showNeighborhoodForm = false;

    const admin = getCurrentUser();

    function renderContent() {
        const countries = db.countries.findAll();
        const cities = db.cities.findAll().sort((a, b) => (b.listing_count || 0) - (a.listing_count || 0));

        // ── Country form ──
        const countryForm = (editingCountry || showCountryForm) ? (() => {
            const c = editingCountry || {};
            return [
                '<div class="adm-city-form-panel">',
                '<div class="adm-panel-header"><h3>' + (editingCountry ? 'Edit Country' : 'Add Country') + '</h3>',
                '<button class="adm-close-btn" id="adm-country-form-close"><i class="fa-solid fa-xmark"></i></button></div>',
                '<div class="adm-form-grid">',
                '<div class="adm-form-group"><label>Country Name *</label><input id="f-country-name" class="adm-input" value="' + escHtml(c.name || '') + '" placeholder="e.g. United States"></div>',
                '<div class="adm-form-group"><label>2-Letter Code *</label><input id="f-country-code" class="adm-input" value="' + escHtml(c.code || '') + '" placeholder="e.g. US" maxlength="2" style="text-transform:uppercase;"></div>',
                '<div class="adm-form-group"><label>Flag Emoji</label><input id="f-country-flag" class="adm-input" value="' + escHtml(c.flag_emoji || '') + '" placeholder="e.g. 🇺🇸"></div>',
                '<div class="adm-form-group"><label>Active</label><label class="adm-toggle-wrap" style="display:inline-flex"><input type="checkbox" id="f-country-active"' + (c.is_active !== false ? ' checked' : '') + '><span class="adm-toggle-slider"></span></label></div>',
                '<div class="adm-form-group adm-form-full adm-form-actions">',
                '<button class="btn btn-primary" id="adm-country-save"><i class="fa-solid fa-floppy-disk"></i> ' + (editingCountry ? 'Save Changes' : 'Add Country') + '</button>',
                '<button class="btn btn-outline" id="adm-country-cancel">Cancel</button>',
                '</div>',
                '</div>',
                '</div>'
            ].join('');
        })() : '';

        // ── City form ──
        const countryOptions = countries.map(co =>
            '<option value="' + co.country_id + '"' + ((editingCity ? editingCity.country : '') === co.country_id ? ' selected' : '') + '>' + escHtml((co.flag_emoji ? co.flag_emoji + ' ' : '') + co.name) + '</option>'
        ).join('');

        const cityForm = (editingCity || showCityForm) ? (() => {
            const c = editingCity || {};
            return [
                '<div class="adm-city-form-panel">',
                '<div class="adm-panel-header"><h3>' + (editingCity ? 'Edit: ' + escHtml(c.name) : 'Add New City') + '</h3>',
                '<button class="adm-close-btn" id="adm-city-form-close"><i class="fa-solid fa-xmark"></i></button></div>',
                '<div class="adm-form-grid">',
                '<div class="adm-form-group"><label>City Name *</label><input id="f-name" class="adm-input" value="' + escHtml(c.name || '') + '" placeholder="e.g. New York"></div>',
                '<div class="adm-form-group"><label>URL Slug *</label><input id="f-slug" class="adm-input" value="' + escHtml(c.slug || '') + '" placeholder="e.g. new-york"></div>',
                '<div class="adm-form-group"><label>Country *</label><select id="f-country" class="adm-input"><option value="">Select Country</option>' + countryOptions + '</select></div>',
                '<div class="adm-form-group"><label>State / Province</label><input id="f-state" class="adm-input" value="' + escHtml(c.state_province || '') + '" placeholder="e.g. NY"></div>',
                '<div class="adm-form-group"><label>Avg Rent ($/mo)</label><input id="f-rent" type="number" class="adm-input" value="' + (c.avg_rent || '') + '"></div>',
                '<div class="adm-form-group"><label>Latitude</label><input id="f-lat" type="number" class="adm-input" value="' + (c.latitude || '') + '"></div>',
                '<div class="adm-form-group"><label>Longitude</label><input id="f-lng" type="number" class="adm-input" value="' + (c.longitude || '') + '"></div>',
                '<div class="adm-form-group adm-form-full"><label>City Image</label>',
                // URL input row
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">',
                '<i class="fa-solid fa-link" style="color:#64748b;flex-shrink:0;"></i>',
                '<input id="f-hero-url" class="adm-input" style="flex:1;" value="' + escHtml((c.hero_image && typeof c.hero_image === 'string' && !c.hero_image.startsWith('data:')) ? c.hero_image : '') + '" placeholder="Paste image URL (e.g. https://images.unsplash.com/...)">',
                '</div>',
                // Upload row
                '<div style="display:flex;align-items:center;gap:8px;margin-bottom:8px;">',
                '<i class="fa-solid fa-upload" style="color:#64748b;flex-shrink:0;"></i>',
                '<label class="adm-btn" style="cursor:pointer;margin:0;flex-shrink:0;"><i class="fa-solid fa-image"></i> Upload Image File',
                '<input type="file" id="f-hero-file" accept="image/*" style="display:none;"></label>',
                '<span id="f-hero-filename" style="font-size:0.8rem;color:#64748b;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1;">' + (c.hero_image && typeof c.hero_image === 'string' && c.hero_image.startsWith('data:') ? 'Uploaded image stored' : 'No file chosen') + '</span>',
                '<button type="button" id="f-hero-clear" style="flex-shrink:0;background:none;border:none;color:#ef4444;cursor:pointer;font-size:0.8rem;display:' + (c.hero_image ? 'inline' : 'none') + '"><i class="fa-solid fa-xmark"></i> Clear</button>',
                '</div>',
                // Hidden field to hold base64 upload data
                '<input type="hidden" id="f-hero-data" value="' + (c.hero_image && typeof c.hero_image === 'string' && c.hero_image.startsWith('data:') ? escHtml(c.hero_image) : '') + '">',
                // Preview
                (c.hero_image ? '<img id="f-hero-preview" src="' + escHtml(c.hero_image) + '" style="margin-top:4px;max-height:100px;border-radius:8px;object-fit:cover;display:block;">' : '<img id="f-hero-preview" style="display:none;margin-top:4px;max-height:100px;border-radius:8px;object-fit:cover;">'),
                '</div>',
                '<div class="adm-form-group adm-form-full"><label>City Description (Living Guide)</label><textarea id="f-description" class="adm-textarea" style="height:150px;" placeholder="Describe the city, neighborhoods, and lifestyle...">' + escHtml(c.description || '') + '</textarea></div>',
                '<div class="adm-form-group adm-form-full"><label>FAQ Items (JSON Format)</label><textarea id="f-faqs" class="adm-textarea" style="height:150px;font-family:monospace;font-size:0.85rem;" placeholder=\'[{"question": "How is the rent?", "answer": "It varies..."}]\'>' + escHtml(JSON.stringify(c.faq_items || [], null, 2)) + '</textarea><p style="font-size:0.75rem;color:#64748b;margin-top:4px;">Format: Array of objects with "question" and "answer" keys.</p></div>',
                '<div class="adm-form-group adm-form-full"><label>Community Reviews (JSON Format)</label><textarea id="f-reviews" class="adm-textarea" style="height:120px;font-family:monospace;font-size:0.85rem;" placeholder=\'[{"name": "John Doe", "text": "Amazing city!", "rating": 5, "date": "2 days ago"}]\'>' + escHtml(JSON.stringify(c.reviews || [], null, 2)) + '</textarea><p style="font-size:0.75rem;color:#64748b;margin-top:4px;">Format: Array of objects with "name", "text", "rating", and "date" keys.</p></div>',
                '<div class="adm-form-group adm-form-full"><label>Meta Title</label><input id="f-meta-title" class="adm-input" value="' + escHtml(c.meta_title || '') + '"></div>',
                '<div class="adm-form-group adm-form-full"><label>Meta Description</label><textarea id="f-meta-desc" class="adm-textarea">' + escHtml(c.meta_description || '') + '</textarea></div>',
                '<div class="adm-form-group"><label>Active</label><label class="adm-toggle-wrap" style="display:inline-flex"><input type="checkbox" id="f-active"' + (c.is_active !== false ? ' checked' : '') + '><span class="adm-toggle-slider"></span></label></div>',
                '<div class="adm-form-group"><label>Show on Homepage</label><label class="adm-toggle-wrap" style="display:inline-flex"><input type="checkbox" id="f-popular"' + (c.show_in_popular !== false ? ' checked' : '') + '><span class="adm-toggle-slider"></span></label></div>',
                '<div class="adm-form-group"><label>Show in Popular Cities Section</label><label class="adm-toggle-wrap" style="display:inline-flex"><input type="checkbox" id="f-popular-section"' + (c.show_in_popular_section ? ' checked' : '') + '><span class="adm-toggle-slider"></span></label></div>',
                '<div class="adm-form-group"><label>Show in Footer City Directory</label><label class="adm-toggle-wrap" style="display:inline-flex"><input type="checkbox" id="f-footer"' + (c.show_in_footer !== false ? ' checked' : '') + '><span class="adm-toggle-slider"></span></label></div>',
                '<div class="adm-form-group adm-form-full adm-form-actions">',
                '<button class="btn btn-primary" id="adm-city-save"><i class="fa-solid fa-floppy-disk"></i> ' + (editingCity ? 'Save Changes' : 'Add City') + '</button>',
                '<button class="btn btn-outline" id="adm-city-cancel">Cancel</button>',
                '</div>',
                '</div>',
                '</div>'
            ].join('');
        })() : '';

        // ── Countries table ──
        const countryRows = countries.length ? countries.map(c => {
            const cityCount = cities.filter(x => x.country === c.country_id).length;
            return [
                '<tr>',
                '<td><strong>' + escHtml((c.flag_emoji ? c.flag_emoji + ' ' : '') + c.name) + '</strong></td>',
                '<td>' + escHtml(c.code || '—') + '</td>',
                '<td>' + cityCount + ' ' + (cityCount === 1 ? 'city' : 'cities') + '</td>',
                '<td><label class="adm-toggle-wrap"><input type="checkbox" class="adm-country-active-toggle" data-id="' + c.country_id + '"' + (c.is_active !== false ? ' checked' : '') + '><span class="adm-toggle-slider"></span></label></td>',
                '<td style="display:flex;gap:8px;">',
                '<button class="adm-btn adm-btn-sm" data-edit-country="' + c.country_id + '"><i class="fa-solid fa-pen"></i> Edit</button>',
                '<button class="adm-btn adm-btn-sm adm-btn-danger" data-del-country="' + c.country_id + '"><i class="fa-solid fa-trash"></i> Delete</button>',
                '</td>',
                '</tr>'
            ].join('');
        }).join('') : '<tr><td colspan="5" style="text-align:center;color:var(--text-muted);padding:2rem;">No countries added yet.</td></tr>';

        // ── Cities table ──
        const cityRows = cities.length ? cities.map(c => {
            const country = countries.find(x => x.country_id === c.country);
            return [
                '<tr>',
                '<td>',
                c.hero_image ? '<img src="' + escHtml(c.hero_image) + '" style="width:48px;height:36px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:8px;" onerror="this.style.display=\'none\'">' : '',
                '<strong>' + escHtml(c.name) + '</strong><br><small class="text-muted">' + escHtml(c.slug) + '</small>',
                '</td>',
                '<td>' + (country ? escHtml((country.flag_emoji ? country.flag_emoji + ' ' : '') + country.name) : '—') + '</td>',
                '<td style="display:flex;gap:8px;">',
                '<a href="/cities/' + c.slug + '" target="_blank" class="adm-btn adm-btn-sm" style="text-decoration:none;"><i class="fa-solid fa-eye"></i> View</a>',
                '<button class="adm-btn adm-btn-sm" data-edit-city="' + c.city_id + '"><i class="fa-solid fa-pen"></i> Edit</button>',
                '<button class="adm-btn adm-btn-sm adm-btn-danger" data-del-city="' + c.city_id + '"><i class="fa-solid fa-trash"></i> Delete</button>',
                '</td>',
                '</tr>'
            ].join('');
        }).join('') : '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:2rem;">No cities added yet.</td></tr>';

        // ── Neighborhood form ──
        const cityOptions = cities.map(ci =>
            '<option value="' + ci.city_id + '"' + ((editingNeighborhood ? editingNeighborhood.city : '') === ci.city_id ? ' selected' : '') + '>' + escHtml(ci.name) + '</option>'
        ).join('');

        const neighborhoodForm = (editingNeighborhood || showNeighborhoodForm) ? (() => {
            const n = editingNeighborhood || {};
            return [
                '<div class="adm-city-form-panel">',
                '<div class="adm-panel-header"><h3>' + (editingNeighborhood ? 'Edit Neighborhood' : 'Add Neighborhood') + '</h3>',
                '<button class="adm-close-btn" id="adm-neighborhood-form-close"><i class="fa-solid fa-xmark"></i></button></div>',
                '<div class="adm-form-grid">',
                '<div class="adm-form-group"><label>Neighborhood Name *</label><input id="f-nh-name" class="adm-input" value="' + escHtml(n.name || '') + '" placeholder="e.g. Mitte"></div>',
                '<div class="adm-form-group"><label>URL Slug *</label><input id="f-nh-slug" class="adm-input" value="' + escHtml(n.slug || '') + '" placeholder="e.g. mitte"></div>',
                '<div class="adm-form-group"><label>City *</label><select id="f-nh-city" class="adm-input"><option value="">Select City</option>' + cityOptions + '</select></div>',
                '<div class="adm-form-group"><label>Avg Rent ($/mo)</label><input id="f-nh-rent" type="number" class="adm-input" value="' + (n.avg_rent || '') + '"></div>',
                '<div class="adm-form-group adm-form-full"><label>Description</label><textarea id="f-nh-desc" class="adm-textarea" placeholder="Briefly describe this neighborhood...">' + escHtml(n.description || '') + '</textarea></div>',
                '<div class="adm-form-group adm-form-full adm-form-actions">',
                '<button class="btn btn-primary" id="adm-neighborhood-save"><i class="fa-solid fa-floppy-disk"></i> ' + (editingNeighborhood ? 'Save Changes' : 'Add Neighborhood') + '</button>',
                '<button class="btn btn-outline" id="adm-neighborhood-cancel">Cancel</button>',
                '</div>',
                '</div>',
                '</div>'
            ].join('');
        })() : '';

        // ── Neighborhoods table ──
        const neighborhoodsList = db.neighborhoods ? db.neighborhoods.findAll() : [];
        const neighborhoodRows = neighborhoodsList.length ? neighborhoodsList.map(n => {
            const city = cities.find(x => x.city_id === n.city);
            return [
                '<tr>',
                '<td><strong>' + escHtml(n.name) + '</strong><br><small class="text-muted">' + escHtml(n.slug) + '</small></td>',
                '<td>' + (city ? escHtml(city.name) : '—') + '</td>',
                '<td>$' + (n.avg_rent || 0) + '</td>',
                '<td style="display:flex;gap:8px;">',
                '<button class="adm-btn adm-btn-sm" data-edit-neighborhood="' + n.neighborhood_id + '"><i class="fa-solid fa-pen"></i> Edit</button>',
                '<button class="adm-btn adm-btn-sm adm-btn-danger" data-del-neighborhood="' + n.neighborhood_id + '"><i class="fa-solid fa-trash"></i> Delete</button>',
                '</td>',
                '</tr>'
            ].join('');
        }).join('') : '<tr><td colspan="4" style="text-align:center;color:var(--text-muted);padding:2rem;">No neighborhoods added yet.</td></tr>';

        container.innerHTML = [
            '<div class="adm-section-header"><h2>City Management</h2></div>',

            // Tabs
            '<div class="adm-tabs" style="display:flex;gap:0;margin-bottom:1.5rem;border-bottom:2px solid var(--border);">',
            '<button class="adm-tab' + (activeTab === 'countries' ? ' active' : '') + '" data-tab="countries" style="padding:.65rem 1.4rem;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid ' + (activeTab === 'countries' ? 'var(--primary)' : 'transparent') + ';color:' + (activeTab === 'countries' ? 'var(--primary)' : 'var(--text-muted)') + ';margin-bottom:-2px;">',
            '<i class="fas fa-globe" style="margin-right:6px;"></i>Countries</button>',
            '<button class="adm-tab' + (activeTab === 'cities' ? ' active' : '') + '" data-tab="cities" style="padding:.65rem 1.4rem;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid ' + (activeTab === 'cities' ? 'var(--primary)' : 'transparent') + ';color:' + (activeTab === 'cities' ? 'var(--primary)' : 'var(--text-muted)') + ';margin-bottom:-2px;">',
            '<i class="fas fa-city" style="margin-right:6px;"></i>Cities</button>',
            '<button class="adm-tab' + (activeTab === 'neighborhoods' ? ' active' : '') + '" data-tab="neighborhoods" style="padding:.65rem 1.4rem;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid ' + (activeTab === 'neighborhoods' ? 'var(--primary)' : 'transparent') + ';color:' + (activeTab === 'neighborhoods' ? 'var(--primary)' : 'var(--text-muted)') + ';margin-bottom:-2px;">',
            '<i class="fas fa-map-location" style="margin-right:6px;"></i>Neighborhoods</button>',
            '</div>',

            // Countries panel
            '<div id="adm-countries-panel" style="display:' + (activeTab === 'countries' ? 'block' : 'none') + ';">',
            '<div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">',
            '<button class="btn btn-primary" id="adm-add-country"><i class="fa-solid fa-plus"></i> Add Country</button>',
            '</div>',
            countryForm,
            '<div class="adm-table-wrap">',
            '<table class="adm-table">',
            '<thead><tr><th>Country</th><th>Code</th><th>Cities</th><th>Active</th><th>Actions</th></tr></thead>',
            '<tbody>' + countryRows + '</tbody>',
            '</table></div>',
            '</div>',

            // Cities panel
            '<div id="adm-cities-panel" style="display:' + (activeTab === 'cities' ? 'block' : 'none') + ';">',
            '<div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">',
            '<button class="btn btn-primary" id="adm-add-city"><i class="fa-solid fa-plus"></i> Add City</button>',
            '</div>',
            cityForm,
            '<div class="adm-table-wrap">',
            '<table class="adm-table">',
            '<thead><tr><th>City</th><th>Country</th><th>Actions</th></tr></thead>',
            '<tbody>' + cityRows + '</tbody>',
            '</table></div>',
            '</div>',

            // Neighborhoods panel
            '<div id="adm-neighborhoods-panel" style="display:' + (activeTab === 'neighborhoods' ? 'block' : 'none') + ';">',
            '<div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">',
            '<button class="btn btn-primary" id="adm-add-neighborhood"><i class="fa-solid fa-plus"></i> Add Neighborhood</button>',
            '</div>',
            neighborhoodForm,
            '<div class="adm-table-wrap">',
            '<table class="adm-table">',
            '<thead><tr><th>Neighborhood</th><th>City</th><th>Avg Rent</th><th>Actions</th></tr></thead>',
            '<tbody>' + neighborhoodRows + '</tbody>',
            '</table></div>',
            '</div>',
        ].join('');

        // ── Tab switching ──
        container.querySelectorAll('.adm-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                activeTab = btn.dataset.tab;
                editingCountry = null; showCountryForm = false;
                editingCity = null; showCityForm = false;
                renderContent();
            });
        });

        // ── Country actions ──
        container.querySelector('#adm-add-country')?.addEventListener('click', () => {
            showCountryForm = true; editingCountry = null; renderContent();
        });
        container.querySelector('#adm-country-form-close')?.addEventListener('click', () => {
            showCountryForm = false; editingCountry = null; renderContent();
        });
        container.querySelector('#adm-country-cancel')?.addEventListener('click', () => {
            showCountryForm = false; editingCountry = null; renderContent();
        });

        container.querySelectorAll('[data-edit-country]').forEach(btn => {
            btn.addEventListener('click', () => {
                editingCountry = db.countries.findById(btn.dataset.editCountry);
                showCountryForm = false; renderContent();
            });
        });

        container.querySelectorAll('[data-del-country]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.delCountry;
                const hasCities = db.cities.find(c => c.country === id).length > 0;
                if (hasCities) { showToast('Remove all cities in this country first.', 'error'); return; }
                if (!confirm('Delete this country?')) return;
                try {
                    await db.countries.delete(id);
                    logAdminAction(admin.user_id, 'Deleted country', id);
                    showToast('Country deleted.');
                    renderContent();
                } catch (e) {
                    showToast('Failed to delete country: ' + e.message, 'error');
                }
            });
        });

        container.querySelectorAll('.adm-country-active-toggle').forEach(cb => {
            cb.addEventListener('change', async () => {
                try {
                    await db.countries.update(cb.dataset.id, { is_active: cb.checked });
                    showToast('Country status updated.');
                } catch (e) {
                    showToast('Update failed.', 'error');
                    cb.checked = !cb.checked;
                }
            });
        });

        container.querySelector('#adm-country-save')?.addEventListener('click', async () => {
            const name = container.querySelector('#f-country-name').value.trim();
            const code = container.querySelector('#f-country-code').value.trim().toUpperCase();
            if (!name || !code) { showToast('Country name and code are required.', 'error'); return; }
            const flag = container.querySelector('#f-country-flag').value.trim();
            const isActive = container.querySelector('#f-country-active').checked;
            const slug = name.toLowerCase().replace(/\s+/g, '-');
            try {
                if (editingCountry) {
                    await db.countries.update(editingCountry.country_id, { name, code, flag_emoji: flag, slug, is_active: isActive });
                    logAdminAction(admin.user_id, 'Updated country', name);
                    showToast('Country updated.');
                } else {
                    await db.countries.create({ name, code, flag_emoji: flag, slug, is_active: isActive });
                    logAdminAction(admin.user_id, 'Added country', name);
                    showToast('Country added!');
                }
                editingCountry = null; showCountryForm = false; renderContent();
            } catch (e) {
                showToast('Failed to save country: ' + e.message, 'error');
            }
        });

        // ── City actions ──
        container.querySelector('#adm-add-city')?.addEventListener('click', () => {
            showCityForm = true; editingCity = null; renderContent();
        });
        container.querySelector('#adm-city-form-close')?.addEventListener('click', () => {
            showCityForm = false; editingCity = null; renderContent();
        });
        container.querySelector('#adm-city-cancel')?.addEventListener('click', () => {
            showCityForm = false; editingCity = null; renderContent();
        });

        container.querySelectorAll('[data-edit-city]').forEach(btn => {
            btn.addEventListener('click', () => {
                editingCity = db.cities.findById(btn.dataset.editCity);
                showCityForm = false; renderContent();
            });
        });

        container.querySelectorAll('[data-del-city]').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (!confirm('Delete this city? This cannot be undone.')) return;
                try {
                    const id = btn.dataset.delCity;
                    await db.cities.delete(id);
                    logAdminAction(admin.user_id, 'Deleted city', id);
                    showToast('City deleted.');
                    renderContent();
                } catch (e) {
                    showToast('Failed to delete city: ' + e.message, 'error');
                }
            });
        });

        // City image file upload
        container.querySelector('#f-hero-file')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const filenameSpan = container.querySelector('#f-hero-filename');
            filenameSpan.textContent = 'Uploading...';
            
            try {
                const imageUrl = await uploadImage(file, 'city-hero.jpg');
                // Store URL in hidden field
                container.querySelector('#f-hero-data').value = imageUrl;
                container.querySelector('#f-hero-url').value = ''; // clear URL field when file uploaded
                container.querySelector('#f-hero-filename').textContent = file.name;
                container.querySelector('#f-hero-clear').style.display = 'inline';
                const preview = container.querySelector('#f-hero-preview');
                preview.src = imageUrl;
                preview.style.display = 'block';
                showToast('Image uploaded successfully.');
            } catch (err) {
                console.warn('[ADMIN] Server upload failed, falling back to Base64:', err);
                // Fallback to Base64 for local storage environment
                const reader = new FileReader();
                reader.onload = (rev) => {
                    const base64Data = rev.target.result;
                    container.querySelector('#f-hero-data').value = base64Data;
                    container.querySelector('#f-hero-url').value = ''; 
                    container.querySelector('#f-hero-filename').textContent = file.name + ' (Local)';
                    container.querySelector('#f-hero-clear').style.display = 'inline';
                    const preview = container.querySelector('#f-hero-preview');
                    preview.src = base64Data;
                    preview.style.display = 'block';
                    showToast('Success! Image saved to your browser (Local Fallback).', 'success');
                };
                reader.onerror = () => {
                    showToast('Upload failed and local fallback failed.', 'error');
                    filenameSpan.textContent = 'Upload failed';
                };
                reader.readAsDataURL(file);
            }
        });

        // URL input live preview
        container.querySelector('#f-hero-url')?.addEventListener('input', (e) => {
            const val = e.target.value.trim();
            const preview = container.querySelector('#f-hero-preview');
            if (val) {
                // Clear any uploaded file when URL is typed
                container.querySelector('#f-hero-data').value = '';
                container.querySelector('#f-hero-filename').textContent = 'No file chosen';
                container.querySelector('#f-hero-file').value = '';
                container.querySelector('#f-hero-clear').style.display = 'inline';
                preview.src = val;
                preview.style.display = 'block';
            } else {
                preview.style.display = 'none';
                container.querySelector('#f-hero-clear').style.display = 'none';
            }
        });

        // Clear button
        container.querySelector('#f-hero-clear')?.addEventListener('click', () => {
            container.querySelector('#f-hero-url').value = '';
            container.querySelector('#f-hero-data').value = '';
            container.querySelector('#f-hero-file').value = '';
            container.querySelector('#f-hero-filename').textContent = 'No file chosen';
            container.querySelector('#f-hero-clear').style.display = 'none';
            const preview = container.querySelector('#f-hero-preview');
            preview.src = '';
            preview.style.display = 'none';
        });

        // Auto-generate slug from city name (new cities only)
        const nameInput = container.querySelector('#f-name');
        const slugInput = container.querySelector('#f-slug');
        if (nameInput && slugInput && !editingCity) {
            nameInput.addEventListener('input', (e) => {
                slugInput.value = e.target.value
                    .toLowerCase()
                    .trim()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-|-$/g, '');
            });
        }

        container.querySelector('#adm-city-save')?.addEventListener('click', async () => {
            const btn = container.querySelector('#adm-city-save');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
            btn.disabled = true;

            const name = container.querySelector('#f-name').value.trim();
            const rawSlug = container.querySelector('#f-slug').value.trim();
            // Normalize: lowercase, spaces→hyphens, strip non-slug chars
            const slug = rawSlug
                .toLowerCase()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-]/g, '')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
            if (!name || !slug) { 
                showToast('Name and slug are required.', 'error'); 
                btn.innerHTML = originalText; btn.disabled = false;
                return; 
            }

            // Prevent duplicate slugs
            const existingWithSlug = db.cities.findOne(c => c.slug === slug && (!editingCity || c.city_id !== editingCity.city_id));
            if (existingWithSlug) { 
                showToast('A city with the slug "' + slug + '" already exists (' + existingWithSlug.name + '). Please use a different name or slug.', 'error'); 
                btn.innerHTML = originalText; btn.disabled = false;
                return; 
            }

            // URL takes priority; fall back to uploaded base64 data
            const heroUrl = (container.querySelector('#f-hero-url')?.value || '').trim();
            const heroData = (container.querySelector('#f-hero-data')?.value || '').trim();
            const heroImage = heroUrl || heroData;
            // Warn if uploaded image is too large (base64 strings > 200KB are risky for localStorage)
            if (heroImage && typeof heroImage === 'string' && heroImage.startsWith('data:') && heroImage.length > 200000) {
                showToast('Image is too large to store. Please use a smaller image or paste an image URL instead.', 'error');
                btn.innerHTML = originalText; btn.disabled = false;
                return;
            }

            let faqs = [];
            try {
                faqs = JSON.parse(container.querySelector('#f-faqs').value || '[]');
            } catch(e) {
                showToast('Invalid FAQ JSON format.', 'error');
                btn.innerHTML = originalText; btn.disabled = false;
                return;
            }

            let reviews = [];
            try {
                reviews = JSON.parse(container.querySelector('#f-reviews').value || '[]');
            } catch(e) {
                showToast('Invalid Reviews JSON format.', 'error');
                btn.innerHTML = originalText; btn.disabled = false;
                return;
            }

            const data = {
                name,
                slug,
                state_province: container.querySelector('#f-state').value.trim(),
                avg_rent: parseInt(container.querySelector('#f-rent').value) || 0,
                latitude: parseFloat(container.querySelector('#f-lat').value) || 0,
                longitude: parseFloat(container.querySelector('#f-lng').value) || 0,
                hero_image: heroImage,
                meta_title: container.querySelector('#f-meta-title').value.trim(),
                meta_description: container.querySelector('#f-meta-desc').value.trim(),
                is_active: container.querySelector('#f-active').checked,
                show_in_popular: container.querySelector('#f-popular').checked,
                show_in_popular_section: container.querySelector('#f-popular-section').checked,
                show_in_footer: container.querySelector('#f-footer').checked,
                country: container.querySelector('#f-country').value || '',
                listing_count: editingCity ? (editingCity.listing_count ?? 0) : 0,
                member_count: editingCity ? (editingCity.member_count ?? 0) : 0,
                faq_items: faqs,
                reviews,
                description: container.querySelector('#f-description').value.trim(),
            };

            try {
                if (editingCity) {
                    await db.cities.update(editingCity.city_id, data);
                    logAdminAction(admin.user_id, 'Updated city', name);
                    showToast('City updated.');
                } else {
                    await db.cities.create(data);
                    logAdminAction(admin.user_id, 'Added new city', name);
                    showToast('City added!');
                }
                editingCity = null; showCityForm = false; renderContent();
            } catch (err) {
                showToast(err.message || 'Failed to save city. The image may be too large.', 'error');
                btn.innerHTML = originalText; btn.disabled = false;
            }
        });

        // ── Neighborhood actions ──
        container.querySelector('#adm-add-neighborhood')?.addEventListener('click', () => {
            showNeighborhoodForm = true; editingNeighborhood = null; renderContent();
        });
        container.querySelector('#adm-neighborhood-form-close')?.addEventListener('click', () => {
            showNeighborhoodForm = false; editingNeighborhood = null; renderContent();
        });
        container.querySelector('#adm-neighborhood-cancel')?.addEventListener('click', () => {
            showNeighborhoodForm = false; editingNeighborhood = null; renderContent();
        });

        container.querySelectorAll('[data-edit-neighborhood]').forEach(btn => {
            btn.addEventListener('click', () => {
                editingNeighborhood = db.neighborhoods.findById(btn.dataset.editNeighborhood);
                showNeighborhoodForm = false; renderContent();
            });
        });

        container.querySelectorAll('[data-del-neighborhood]').forEach(btn => {
            btn.addEventListener('click', async () => {
                const id = btn.dataset.delNeighborhood;
                if (!confirm('Delete this neighborhood?')) return;
                try {
                    await db.neighborhoods.delete(id);
                    logAdminAction(admin.user_id, 'Deleted neighborhood', id);
                    showToast('Neighborhood deleted.');
                    renderContent();
                } catch (e) {
                    showToast('Failed to delete neighborhood: ' + e.message, 'error');
                }
            });
        });

        // Auto-slug for neighborhoods
        const nhNameInput = container.querySelector('#f-nh-name');
        const nhSlugInput = container.querySelector('#f-nh-slug');
        if (nhNameInput && nhSlugInput && !editingNeighborhood) {
            nhNameInput.addEventListener('input', (e) => {
                nhSlugInput.value = e.target.value.toLowerCase().trim().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
            });
        }

        container.querySelector('#adm-neighborhood-save')?.addEventListener('click', async () => {
            const name = container.querySelector('#f-nh-name').value.trim();
            const slug = container.querySelector('#f-nh-slug').value.trim();
            const city = container.querySelector('#f-nh-city').value;
            const rent = parseInt(container.querySelector('#f-nh-rent').value) || 0;
            const desc = container.querySelector('#f-nh-desc').value.trim();

            if (!name || !slug || !city) { showToast('Name, slug, and city are required.', 'error'); return; }

            try {
                if (editingNeighborhood) {
                    await db.neighborhoods.update(editingNeighborhood.neighborhood_id, { name, slug, city, avg_rent: rent, description: desc });
                    logAdminAction(admin.user_id, 'Updated neighborhood', name);
                    showToast('Neighborhood updated.');
                } else {
                    await db.neighborhoods.create({ name, slug, city, avg_rent: rent, description: desc, listing_count: 0 });
                    logAdminAction(admin.user_id, 'Added neighborhood', name);
                    showToast('Neighborhood added!');
                }
                editingNeighborhood = null; showNeighborhoodForm = false; renderContent();
            } catch (e) {
                showToast('Failed to save: ' + e.message, 'error');
            }
        });
    }

    renderContent();
}

// ─────────────────────────────────────────────────────────────
// FB Group Management
// ─────────────────────────────────────────────────────────────

function renderAdminFBGroups(container) {
    let activeTab = 'cities'; // 'countries' | 'cities'
    let editingCountry = null;
    let editingCity = null;
    let showCountryForm = false;
    let showCityForm = false;

    const admin = getCurrentUser();

    function renderContent() {
        const countries = db.fb_countries.findAll();
        const cities = db.fb_cities.findAll();

        // ── Country form ──
        const countryForm = (editingCountry || showCountryForm) ? (() => {
            const c = editingCountry || {};
            return [
                '<div class="adm-city-form-panel">',
                '<div class="adm-panel-header"><h3>' + (editingCountry ? 'Edit Country' : 'Add Country') + '</h3>',
                '<button class="adm-close-btn" id="fbg-country-form-close"><i class="fa-solid fa-xmark"></i></button></div>',
                '<div class="adm-form-grid">',
                '<div class="adm-form-group adm-form-full"><label>Country Name *</label>',
                '<input id="fbg-country-name" class="adm-input" value="' + escHtml(c.country_name || '') + '" placeholder="e.g. United States"></div>',
                '<div class="adm-form-group adm-form-full adm-form-actions">',
                '<button class="btn btn-primary" id="fbg-country-save"><i class="fa-solid fa-floppy-disk"></i> ' + (editingCountry ? 'Save Changes' : 'Add Country') + '</button>',
                '<button class="btn btn-outline" id="fbg-country-cancel">Cancel</button>',
                '</div>',
                '</div>',
                '</div>'
            ].join('');
        })() : '';

        // ── City form ──
        const countryOptions = countries.map(c =>
            '<option value="' + c.fb_country_id + '"' + ((editingCity && editingCity.country_id === c.fb_country_id) ? ' selected' : '') + '>' + escHtml(c.country_name) + '</option>'
        ).join('');

        const cityForm = (editingCity || showCityForm) ? (() => {
            const c = editingCity || {};
            return [
                '<div class="adm-city-form-panel">',
                '<div class="adm-panel-header"><h3>' + (editingCity ? 'Edit City Group' : 'Add City Group') + '</h3>',
                '<button class="adm-close-btn" id="fbg-city-form-close"><i class="fa-solid fa-xmark"></i></button></div>',
                '<div class="adm-form-grid">',
                '<div class="adm-form-group"><label>Country *</label>',
                '<select id="fbg-city-country" class="adm-input"><option value="">Select Country</option>' + countryOptions + '</select></div>',
                '<div class="adm-form-group"><label>City Name *</label>',
                '<input id="fbg-city-name" class="adm-input" value="' + escHtml(c.city_name || '') + '" placeholder="e.g. New York City"></div>',
                '<div class="adm-form-group"><label>FB Group Name *</label>',
                '<input id="fbg-city-group-name" class="adm-input" value="' + escHtml(c.fb_group_name || '') + '" placeholder="e.g. NYC Rooms & Roommates"></div>',
                '<div class="adm-form-group"><label>FB Group Link *</label>',
                '<input id="fbg-city-group-link" class="adm-input" value="' + escHtml(c.fb_group_link || '') + '" placeholder="https://facebook.com/groups/..."></div>',
                '<div class="adm-form-group"><label>Total Members</label>',
                '<input id="fbg-city-members" type="number" class="adm-input" value="' + (c.total_members || '') + '" placeholder="e.g. 24800"></div>',
                '<div class="adm-form-group"><label>Priority (Order)</label>',
                '<input id="fbg-city-priority" type="number" class="adm-input" value="' + (c.priority || '') + '" placeholder="e.g. 1"></div>',
                '<div class="adm-form-group adm-form-full"><label>Group Description / About</label>',
                '<textarea id="fbg-city-description" class="adm-input" style="height:80px;resize:vertical;" placeholder="Tell members about this city group community...">' + escHtml(c.description || '') + '</textarea></div>',
                '<div class="adm-form-group adm-form-full"><label>Group FAQs (JSON Format)</label>',
                '<textarea id="fbg-city-faqs" class="adm-input" style="height:120px;resize:vertical;font-family:monospace;font-size:0.85rem;" placeholder=\'[{"q": "How to join?", "a": "Click the button above."}]\'>' + escHtml(JSON.stringify(c.faqs || [], null, 2)) + '</textarea>',
                '<p style="font-size:0.75rem;color:var(--text-muted);margin-top:4px;">Format: Array of objects with "q" and "a" properties.</p></div>',
                '<div class="adm-form-group adm-form-full" style="display:flex;align-items:center;gap:20px;margin-top:10px;flex-wrap:wrap;">',
                '<div style="display:flex;align-items:center;gap:10px;">',
                '<label class="adm-toggle-wrap"><input type="checkbox" id="fbg-city-popular"' + (c.is_popular !== false ? ' checked' : '') + '><span class="adm-toggle-slider"></span></label>',
                '<span><strong>Show on Homepage</strong></span>',
                '</div>',
                '<div style="display:flex;align-items:center;gap:10px;">',
                '<label class="adm-toggle-wrap"><input type="checkbox" id="fbg-city-footer"' + (c.is_footer ? ' checked' : '') + '><span class="adm-toggle-slider"></span></label>',
                '<span><strong>Show in Footer</strong></span>',
                '</div>',
                '</div>',
                '<div class="adm-form-group adm-form-full"><label>City Image</label>',
                '<div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;">',
                '<input id="fbg-city-image-url" class="adm-input" style="flex:1;min-width:200px;" value="' + escHtml(c.city_image || '') + '" placeholder="Paste image URL or upload below">',
                '<label class="adm-btn" style="cursor:pointer;margin:0;"><i class="fa-solid fa-upload"></i> Upload',
                '<input type="file" id="fbg-city-image-file" accept="image/*" style="display:none;"></label>',
                '</div>',
                c.city_image ? '<img id="fbg-city-img-preview" src="' + escHtml(c.city_image) + '" style="margin-top:8px;max-height:100px;border-radius:8px;object-fit:cover;">' : '<img id="fbg-city-img-preview" style="display:none;margin-top:8px;max-height:100px;border-radius:8px;object-fit:cover;">',
                '</div>',
                '<div class="adm-form-group adm-form-full adm-form-actions">',
                '<button class="btn btn-primary" id="fbg-city-save"><i class="fa-solid fa-floppy-disk"></i> ' + (editingCity ? 'Save Changes' : 'Add City') + '</button>',
                '<button class="btn btn-outline" id="fbg-city-cancel">Cancel</button>',
                '</div>',
                '</div>',
                '</div>'
            ].join('');
        })() : '';

        // ── Countries table ──
        const countryRows = countries.length ? countries.map(c => {
            const cityCount = cities.filter(x => x.country_id === c.fb_country_id).length;
            return [
                '<tr>',
                '<td><strong>' + escHtml(c.country_name) + '</strong></td>',
                '<td>' + cityCount + ' ' + (cityCount === 1 ? 'city' : 'cities') + '</td>',
                '<td style="display:flex;gap:8px;">',
                '<button class="adm-btn adm-btn-sm" data-edit-country="' + c.fb_country_id + '"><i class="fa-solid fa-pen"></i> Edit</button>',
                '<button class="adm-btn adm-btn-sm adm-btn-danger" data-del-country="' + c.fb_country_id + '"><i class="fa-solid fa-trash"></i> Delete</button>',
                '</td>',
                '</tr>'
            ].join('');
        }).join('') : '<tr><td colspan="3" style="text-align:center;color:var(--text-muted);padding:2rem;">No countries added yet.</td></tr>';

        // ── Cities table ──
        const cityRows = cities.length ? cities.sort((a,b) => (a.priority || 0) - (b.priority || 0)).map(c => {
            const country = countries.find(x => x.fb_country_id === c.country_id);
            return [
                '<tr>',
                '<td>',
                c.city_image ? '<img src="' + escHtml(c.city_image) + '" style="width:48px;height:36px;object-fit:cover;border-radius:6px;vertical-align:middle;margin-right:8px;">' : '',
                '<strong>' + escHtml(c.city_name) + '</strong>',
                '</td>',
                '<td>' + (country ? escHtml(country.country_name) : '—') + '</td>',
                '<td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="' + escHtml(c.fb_group_name) + '">' + escHtml(c.fb_group_name) + '</td>',
                '<td style="display:flex;flex-direction:column;gap:4px;">' +
                  '<a href="' + escHtml(c.fb_group_link) + '" target="_blank" rel="noopener" style="color:#1877f2;font-size:0.8rem;font-weight:600;display:inline-flex;align-items:center;gap:4px;"><i class="fab fa-facebook-f"></i> Facebook</a>' +
                  '<a href="/fb-groups/' + c.city_name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g,'') + '" style="color:var(--primary);font-size:0.8rem;font-weight:600;display:inline-flex;align-items:center;gap:4px;"><i class="fa-solid fa-eye"></i> View Page</a>' +
                '</td>',
                '<td>' + (Number(c.total_members) || 0).toLocaleString() + '</td>',
                '<td>' + (c.priority || '—') + '</td>',
                '<td>',
                '  <div style="display:flex;flex-direction:column;gap:4px;">',
                '    <span class="adm-status-pill ' + (c.is_popular !== false ? 'pill-active' : 'pill-inactive') + '" style="font-size:0.65rem;">Home: ' + (c.is_popular !== false ? 'Yes' : 'No') + '</span>',
                '    <span class="adm-status-pill ' + (c.is_footer ? 'pill-active' : 'pill-inactive') + '" style="font-size:0.65rem;">Footer: ' + (c.is_footer ? 'Yes' : 'No') + '</span>',
                '  </div>',
                '</td>',
                '<td style="display:flex;gap:8px;">',
                '<button class="adm-btn adm-btn-sm" data-edit-city="' + c.fb_city_id + '"><i class="fa-solid fa-pen"></i> Edit</button>',
                '<button class="adm-btn adm-btn-sm adm-btn-danger" data-del-city="' + c.fb_city_id + '"><i class="fa-solid fa-trash"></i> Delete</button>',
                '</td>',
                '</tr>'
            ].join('');
        }).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem;">No cities added yet.</td></tr>';

        container.innerHTML = [
            '<div class="adm-section-header"><h2>FB Group Management</h2></div>',

            // Tabs
            '<div class="adm-tabs" style="display:flex;gap:0;margin-bottom:1.5rem;border-bottom:2px solid var(--border);">',
            '<button class="adm-tab' + (activeTab === 'countries' ? ' active' : '') + '" data-tab="countries" style="padding:.65rem 1.4rem;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid ' + (activeTab === 'countries' ? 'var(--primary)' : 'transparent') + ';color:' + (activeTab === 'countries' ? 'var(--primary)' : 'var(--text-muted)') + ';margin-bottom:-2px;">',
            '<i class="fas fa-globe" style="margin-right:6px;"></i>Countries</button>',
            '<button class="adm-tab' + (activeTab === 'cities' ? ' active' : '') + '" data-tab="cities" style="padding:.65rem 1.4rem;font-weight:600;border:none;background:none;cursor:pointer;border-bottom:2px solid ' + (activeTab === 'cities' ? 'var(--primary)' : 'transparent') + ';color:' + (activeTab === 'cities' ? 'var(--primary)' : 'var(--text-muted)') + ';margin-bottom:-2px;">',
            '<i class="fas fa-city" style="margin-right:6px;"></i>Cities</button>',
            '</div>',

            // Countries panel
            '<div id="fbg-countries-panel" style="display:' + (activeTab === 'countries' ? 'block' : 'none') + ';">',
            '<div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">',
            '<button class="btn btn-primary" id="fbg-add-country"><i class="fa-solid fa-plus"></i> Add Country</button>',
            '</div>',
            countryForm,
            '<div class="adm-table-wrap">',
            '<table class="adm-table">',
            '<thead><tr><th>Country</th><th>Cities</th><th>Actions</th></tr></thead>',
            '<tbody>' + countryRows + '</tbody>',
            '</table></div>',
            '</div>',

            // Cities panel
            '<div id="fbg-cities-panel" style="display:' + (activeTab === 'cities' ? 'block' : 'none') + ';">',
            '<div style="display:flex;justify-content:flex-end;margin-bottom:1rem;">',
            '<button class="btn btn-primary" id="fbg-add-city"><i class="fa-solid fa-plus"></i> Add City</button>',
            '</div>',
            cityForm,
            '<div class="adm-table-wrap">',
            '<table class="adm-table">',
            '<thead><tr><th>City</th><th>Country</th><th>Group Name</th><th>Members</th><th>Priority</th><th>Status</th><th>Actions</th></tr></thead>',
            '<tbody>' + cityRows + '</tbody>',
            '</table></div>',
            '</div>',
        ].join('');

        // ── Tab switching ──
        container.querySelectorAll('.adm-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                activeTab = btn.dataset.tab;
                editingCountry = null; showCountryForm = false;
                editingCity = null; showCityForm = false;
                renderContent();
            });
        });

        // ── Country actions ──
        container.querySelector('#fbg-add-country')?.addEventListener('click', () => {
            showCountryForm = true; editingCountry = null; renderContent();
        });
        container.querySelector('#fbg-country-form-close')?.addEventListener('click', () => {
            showCountryForm = false; editingCountry = null; renderContent();
        });
        container.querySelector('#fbg-country-cancel')?.addEventListener('click', () => {
            showCountryForm = false; editingCountry = null; renderContent();
        });

        container.querySelectorAll('[data-edit-country]').forEach(btn => {
            btn.addEventListener('click', () => {
                editingCountry = db.fb_countries.findById(btn.dataset.editCountry);
                showCountryForm = false; renderContent();
            });
        });

        container.querySelectorAll('[data-del-country]').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.dataset.delCountry;
                const hasCities = db.fb_cities.find(c => c.country_id === id).length > 0;
                if (hasCities) { showToast('Remove all cities in this country first.', 'error'); return; }
                if (!confirm('Delete this country?')) return;
                db.fb_countries.delete(id);
                logAdminAction(admin.user_id, 'Deleted FB country', id);
                showToast('Country deleted.');
                renderContent();
            });
        });

        container.querySelector('#fbg-country-save')?.addEventListener('click', () => {
            const name = container.querySelector('#fbg-country-name').value.trim();
            if (!name) { showToast('Country name is required.', 'error'); return; }
            if (editingCountry) {
                db.fb_countries.update(editingCountry.fb_country_id, { country_name: name });
                logAdminAction(admin.user_id, 'Updated FB country', name);
                showToast('Country updated.');
            } else {
                db.fb_countries.create({ country_name: name });
                logAdminAction(admin.user_id, 'Added FB country', name);
                showToast('Country added!');
            }
            editingCountry = null; showCountryForm = false; renderContent();
        });

        // ── City actions ──
        container.querySelector('#fbg-add-city')?.addEventListener('click', () => {
            showCityForm = true; editingCity = null; renderContent();
        });
        container.querySelector('#fbg-city-form-close')?.addEventListener('click', () => {
            showCityForm = false; editingCity = null; renderContent();
        });
        container.querySelector('#fbg-city-cancel')?.addEventListener('click', () => {
            showCityForm = false; editingCity = null; renderContent();
        });

        container.querySelectorAll('[data-edit-city]').forEach(btn => {
            btn.addEventListener('click', () => {
                editingCity = db.fb_cities.findById(btn.dataset.editCity);
                showCityForm = false; renderContent();
            });
        });

        container.querySelectorAll('[data-del-city]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!confirm('Delete this city group?')) return;
                db.fb_cities.delete(btn.dataset.delCity);
                logAdminAction(admin.user_id, 'Deleted FB city', btn.dataset.delCity);
                showToast('City deleted.');
                renderContent();
            });
        });

        // Image file upload preview
        container.querySelector('#fbg-city-image-file')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            try {
                showToast('Uploading image...', 'info');
                const imageUrl = await uploadImage(file, 'fb-city.jpg');
                container.querySelector('#fbg-city-image-url').value = imageUrl;
                const preview = container.querySelector('#fbg-city-img-preview');
                preview.src = imageUrl;
                preview.style.display = 'block';
                showToast('Image uploaded successfully.', 'success');
            } catch (err) {
                console.warn('[ADMIN] FB City upload failed, falling back to Base64:', err);
                const reader = new FileReader();
                reader.onload = async (ev) => {
                    const compressed = await compressImage(ev.target.result, 800, 600, 0.7);
                    container.querySelector('#fbg-city-image-url').value = compressed;
                    const preview = container.querySelector('#fbg-city-img-preview');
                    preview.src = compressed;
                    preview.style.display = 'block';
                    showToast('Image saved to browser (Local Fallback).', 'success');
                };
                reader.onerror = () => {
                    showToast('Upload failed.', 'error');
                };
                reader.readAsDataURL(file);
            }
        });

        // URL input live preview
        container.querySelector('#fbg-city-image-url')?.addEventListener('input', (e) => {
            const preview = container.querySelector('#fbg-city-img-preview');
            preview.src = e.target.value;
            preview.style.display = e.target.value ? 'block' : 'none';
        });

        container.querySelector('#fbg-city-save')?.addEventListener('click', async () => {
            const countryId = container.querySelector('#fbg-city-country').value;
            const cityName = container.querySelector('#fbg-city-name').value.trim();
            const groupName = container.querySelector('#fbg-city-group-name').value.trim();
            const groupLink = container.querySelector('#fbg-city-group-link').value.trim();
            const members = parseInt(container.querySelector('#fbg-city-members').value) || 0;
            const priority = parseInt(container.querySelector('#fbg-city-priority').value) || 0;
            const isPopular = container.querySelector('#fbg-city-popular').checked;
            const isFooter = container.querySelector('#fbg-city-footer').checked;
            const image = container.querySelector('#fbg-city-image-url').value.trim();
            const description = container.querySelector('#fbg-city-description').value.trim();
            const faqJson = container.querySelector('#fbg-city-faqs').value.trim();

            let faqs = [];
            try {
                if (faqJson) faqs = JSON.parse(faqJson);
            } catch (e) {
                showToast('Invalid FAQ JSON format. Saving with empty FAQs.', 'warning');
            }

            if (!countryId || !cityName || !groupName || !groupLink) {
                showToast('Country, city name, group name, and link are required.', 'error'); return;
            }

            const data = { 
                country_id: countryId, 
                city_name: cityName, 
                fb_group_name: groupName, 
                fb_group_link: groupLink, 
                total_members: members, 
                priority,
                is_popular: isPopular,
                is_footer: isFooter,
                city_image: image,
                description,
                faqs
            };

            const btn = container.querySelector('#fbg-city-save');
            const originalText = btn.innerHTML;
            btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
            btn.disabled = true;

            try {
                if (editingCity) {
                    await db.fb_cities.update(editingCity.fb_city_id, data);
                    logAdminAction(admin.user_id, 'Updated FB city', cityName);
                    showToast('City updated.');
                } else {
                    await db.fb_cities.create(data);
                    logAdminAction(admin.user_id, 'Added FB city', cityName);
                    showToast('City added!');
                }
                editingCity = null; showCityForm = false; renderContent();
            } catch (err) {
                showToast(err.message || 'Failed to save city.', 'error');
                btn.innerHTML = originalText; btn.disabled = false;
            }
        });
    }

    renderContent();
}

// ─────────────────────────────────────────────────────────────
// Settings
// ─────────────────────────────────────────────────────────────

function renderAdminSettings(container) {
    // Load settings from localStorage or default
    const defaultSettings = {
        maintenanceMode: false,
        requireApprovalAccounts: false,
        requireApprovalListings: true,
        allowGuestSearch: true,
        maxListingsPerUser: 5,
        siteName: 'RoommateGroups',
        contactEmail: 'hello@roommategroups.com'
    };
    
    let currentSettings = { ...defaultSettings };
    try {
        const saved = localStorage.getItem('rg_admin_settings');
        if (saved) currentSettings = { ...defaultSettings, ...JSON.parse(saved) };
    } catch(e) {}

    container.innerHTML = [
        '<div class="adm-section-header">',
        '<h2>Platform Settings</h2>',
        '<button class="adm-btn adm-btn-primary" id="adm-save-settings"><i class="fa-solid fa-save"></i> Save Changes</button>',
        '</div>',
        '<div class="adm-settings-grid">',
        
        // General Settings Card
        '<div class="adm-card">',
        '<h3>General Configuration</h3>',
        '<div class="adm-form-group">',
        '<label>Site Name</label>',
        '<input type="text" id="set-sitename" class="adm-input" value="' + escHtml(currentSettings.siteName) + '">',
        '</div>',
        '<div class="adm-form-group">',
        '<label>Support Email</label>',
        '<input type="email" id="set-email" class="adm-input" value="' + escHtml(currentSettings.contactEmail) + '">',
        '</div>',
        '<div class="adm-form-group" style="display:flex;justify-content:space-between;align-items:center;gap:16px;">',
        '<span><strong>Maintenance Mode</strong><br><small style="color:#64748b;">Disables public access to the platform</small></span>',
        '<label class="adm-toggle-wrap"><input type="checkbox" id="set-maintenance"' + (currentSettings.maintenanceMode ? ' checked' : '') + '><span class="adm-toggle-slider"></span></label>',
        '</div>',
        '</div>',

        // Moderation & Access Card
        '<div class="adm-card">',
        '<h3>Moderation & Access</h3>',
        '<div class="adm-form-group" style="display:flex;justify-content:space-between;align-items:center;gap:16px;">',
        '<span><strong>Require Account Approval</strong><br><small style="color:#64748b;">New users must be vetted by admins</small></span>',
        '<label class="adm-toggle-wrap"><input type="checkbox" id="set-req-accounts"' + (currentSettings.requireApprovalAccounts ? ' checked' : '') + '><span class="adm-toggle-slider"></span></label>',
        '</div>',
        '<div class="adm-form-group" style="display:flex;justify-content:space-between;align-items:center;gap:16px;">',
        '<span><strong>Require Listing Approval</strong><br><small style="color:#64748b;">New listings run through the moderation queue</small></span>',
        '<label class="adm-toggle-wrap"><input type="checkbox" id="set-req-listings"' + (currentSettings.requireApprovalListings ? ' checked' : '') + '><span class="adm-toggle-slider"></span></label>',
        '</div>',
        '<div class="adm-form-group" style="display:flex;justify-content:space-between;align-items:center;gap:16px;">',
        '<span><strong>Allow Guest Browsing</strong><br><small style="color:#64748b;">Unregistered users can view listings</small></span>',
        '<label class="adm-toggle-wrap"><input type="checkbox" id="set-guest-search"' + (currentSettings.allowGuestSearch ? ' checked' : '') + '><span class="adm-toggle-slider"></span></label>',
        '</div>',
        '<div class="adm-form-group">',
        '<label>Max Listings Per User</label>',
        '<input type="number" id="set-max-listings" class="adm-input" min="1" max="50" value="' + currentSettings.maxListingsPerUser + '">',
        '</div>',
        '</div>',

        // Database Management Card
        (() => {
            const raw = localStorage.getItem('rg_database') || '{}';
            const sizeKB = (raw.length / 1024).toFixed(1);
            const pct = Math.min(100, Math.round(raw.length / (5 * 1024 * 1024) * 100));
            const barColor = pct > 85 ? '#ef4444' : pct > 60 ? '#f59e0b' : '#22c55e';
            let parsed;
            try { parsed = JSON.parse(raw); } catch(e) { parsed = {}; }
            const cityImgKB = ((parsed.cities || []).reduce((s, c) => s + (c.hero_image && typeof c.hero_image === 'string' && c.hero_image.startsWith('data:') ? c.hero_image.length : 0), 0) / 1024).toFixed(1);
            const logKB = (JSON.stringify(parsed.admin_logs || []).length / 1024).toFixed(1);
            const reportKB = (JSON.stringify(parsed.reports || []).length / 1024).toFixed(1);
            const listingImgKB = ((parsed.listings || []).reduce((s, l) => {
                let _imgs = l.images || l.photos || [];
                if (typeof _imgs === 'string') { try { _imgs = JSON.parse(_imgs); } catch(e) { _imgs = []; } }
                return s + _imgs.filter(p => p && typeof p === 'string' && p.startsWith('data:')).reduce((a, p) => a + p.length, 0);
            }, 0) / 1024).toFixed(1);
            return [
                '<div class="adm-card" style="grid-column:1/-1">',
                '<h3>Database Storage</h3>',
                '<div style="margin-bottom:1rem;">',
                '<div style="display:flex;justify-content:space-between;margin-bottom:6px;"><span style="font-weight:600;">' + sizeKB + ' KB used of ~5,120 KB</span><span style="color:' + barColor + ';font-weight:700;">' + pct + '%</span></div>',
                '<div style="height:10px;background:#e5e7eb;border-radius:99px;overflow:hidden;"><div style="height:100%;width:' + pct + '%;background:' + barColor + ';border-radius:99px;transition:width .4s;"></div></div>',
                '</div>',
                '<div class="adm-form-grid" style="margin-bottom:1.25rem;font-size:0.85rem;color:#64748b;">',
                '<div>📷 City hero images (embedded): <strong>' + cityImgKB + ' KB</strong></div>',
                '<div>🏠 Listing photos (embedded): <strong>' + listingImgKB + ' KB</strong></div>',
                '<div>📋 Admin logs: <strong>' + logKB + ' KB</strong></div>',
                '<div>🚩 Reports: <strong>' + reportKB + ' KB</strong></div>',
                '</div>',
                '<div style="display:flex;flex-wrap:wrap;gap:10px;">',
                '<button class="adm-btn" id="db-clean-city-imgs" title="Replace base64 city images with empty string"><i class="fa-solid fa-image"></i> Clear City Base64 Images (' + cityImgKB + ' KB)</button>',
                '<button class="adm-btn" id="db-clean-listing-imgs" title="Remove base64 listing photos"><i class="fa-solid fa-house"></i> Clear Listing Base64 Photos (' + listingImgKB + ' KB)</button>',
                '<button class="adm-btn" id="db-clean-logs" title="Delete all admin action logs"><i class="fa-solid fa-scroll"></i> Clear Admin Logs (' + logKB + ' KB)</button>',
                '<button class="adm-btn" id="db-clean-reports" title="Delete resolved/dismissed reports"><i class="fa-solid fa-flag"></i> Clear Resolved Reports</button>',
                '<button class="adm-btn adm-btn-danger" id="db-reset" title="Wipe all data and re-seed defaults"><i class="fa-solid fa-triangle-exclamation"></i> Full Reset</button>',
                '</div>',
                '</div>',
            ].join('');
        })(),

        '</div>' // end grid
    ].join('');

    container.querySelector('#adm-save-settings').addEventListener('click', () => {
        const newSettings = {
            siteName: container.querySelector('#set-sitename').value.trim(),
            contactEmail: container.querySelector('#set-email').value.trim(),
            maintenanceMode: container.querySelector('#set-maintenance').checked,
            requireApprovalAccounts: container.querySelector('#set-req-accounts').checked,
            requireApprovalListings: container.querySelector('#set-req-listings').checked,
            allowGuestSearch: container.querySelector('#set-guest-search').checked,
            maxListingsPerUser: parseInt(container.querySelector('#set-max-listings').value, 10) || 5
        };

        localStorage.setItem('rg_admin_settings', JSON.stringify(newSettings));
        showToast('Platform settings saved successfully.');
        const user = getCurrentUser();
        logAdminAction(user?.user_id, 'Updated Platform Settings', 'System Settings');
    });

    // ── Database cleanup actions ──
    container.querySelector('#db-clean-city-imgs')?.addEventListener('click', () => {
        if (!confirm('Remove all embedded (base64) city images? This cannot be undone. City image URLs will be cleared.')) return;
        const raw = JSON.parse(localStorage.getItem('rg_database') || '{}');
        let count = 0;
        (raw.cities || []).forEach(c => { if (c.hero_image && typeof c.hero_image === 'string' && c.hero_image.startsWith('data:')) { c.hero_image = ''; count++; } });
        localStorage.setItem('rg_database', JSON.stringify(raw));
        showToast('Cleared base64 images from ' + count + ' cities. Refreshing…');
        setTimeout(() => renderAdminSettings(container), 800);
    });

    container.querySelector('#db-clean-listing-imgs')?.addEventListener('click', () => {
        if (!confirm('Remove all embedded (base64) listing photos? Listings will show placeholder images.')) return;
        const raw = JSON.parse(localStorage.getItem('rg_database') || '{}');
        let count = 0;
        (raw.listings || []).forEach(l => {
            let _imgs = l.images || l.photos || [];
            if (typeof _imgs === 'string') { try { _imgs = JSON.parse(_imgs); } catch(e) { _imgs = []; } }
            if (Array.isArray(_imgs)) {
                const before = _imgs.length;
                _imgs = _imgs.filter(p => !p || typeof p !== 'string' || !p.startsWith('data:'));
                count += before - _imgs.length;
                l.images = JSON.stringify(_imgs);
            }
        });
        localStorage.setItem('rg_database', JSON.stringify(raw));
        showToast('Removed ' + count + ' embedded listing photos. Refreshing…');
        setTimeout(() => renderAdminSettings(container), 800);
    });

    container.querySelector('#db-clean-logs')?.addEventListener('click', () => {
        if (!confirm('Delete all admin action logs? This cannot be undone.')) return;
        const raw = JSON.parse(localStorage.getItem('rg_database') || '{}');
        raw.admin_logs = [];
        localStorage.setItem('rg_database', JSON.stringify(raw));
        showToast('Admin logs cleared. Refreshing…');
        setTimeout(() => renderAdminSettings(container), 800);
    });

    container.querySelector('#db-clean-reports')?.addEventListener('click', () => {
        if (!confirm('Delete all resolved and dismissed reports?')) return;
        const raw = JSON.parse(localStorage.getItem('rg_database') || '{}');
        const before = (raw.reports || []).length;
        raw.reports = (raw.reports || []).filter(r => r.status === 'pending');
        localStorage.setItem('rg_database', JSON.stringify(raw));
        showToast('Removed ' + (before - raw.reports.length) + ' closed reports. Refreshing…');
        setTimeout(() => renderAdminSettings(container), 800);
    });

    container.querySelector('#db-reset')?.addEventListener('click', () => {
        if (!confirm('⚠️ FULL RESET: This will delete ALL data (users, listings, cities, posts) and restore defaults. Are you absolutely sure?')) return;
        if (!confirm('Second confirmation: All user accounts and listings will be permanently lost. Continue?')) return;
        localStorage.removeItem('rg_database');
        showToast('Database reset. Reloading page…');
        setTimeout(() => window.location.reload(), 1000);
    });
}

// ─────────────────────────────────────────────────────────────
// Content / Blog
// ─────────────────────────────────────────────────────────────

async function renderAdminContent(container) {
    container.innerHTML = '<div class="adm-empty" style="padding:4rem;"><i class="fas fa-spinner fa-spin fa-2x"></i><p style="margin-top:1rem;">Loading content...</p></div>';

    try {
        let activeTab      = 'posts';
        let isModalOpen    = false;
        let editingPostId  = null;
        let modalTab       = 'basic';
        let isCatModalOpen = false;
        let editingCatId   = null;
        let faqItems       = [];
        let formState      = {};
        let autoSaveTimer  = null;
        const autoSaveKey  = 'cms_autosave_draft';

        function getBlogs() { return db.posts.findAll(); }
        function getCats()  { return db.categories.findAll(); }

        function categoryOptions(selected) {
            return getCats().map(c =>
                '<option value="' + escHtml(c.name) + '"' + (c.name === selected ? ' selected' : '') + '>' + escHtml(c.name) + '</option>'
            ).join('');
        }

        function toSlug(str) {
            return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
        }

        function calcReadTime(html) {
            const words = (html || '').replace(/<[^>]*>/g, ' ').trim().split(/\s+/).filter(Boolean).length;
            return Math.max(1, Math.round(words / 200)) + ' min read';
        }

        function initFormState(post) {
            const p = post || {};
            formState = {
                title:        p.title || '',
                slug:         p.slug  || '',
                author:       p.author?.name || '',
                category:     p.category || '',
                tags:         Array.isArray(p.tags) ? p.tags.join(', ') : (p.tags || ''),
                publishDate:  p.publishDate || new Date().toISOString().slice(0, 16),
                status:       p.status || (p.is_published ? 'published' : 'draft'),
                excerpt:      p.excerpt || '',
                image:        p.image || p.featured_image || '',
                imgAlt:       p.imgAlt || '',
                imgTitle:     p.imgTitle || '',
                imgCaption:   p.imgCaption || '',
                content:      p.content || '',
                tocEnabled:   p.tocEnabled || false,
                seoTitle:     p.seoTitle || '',
                seoDesc:      p.seoDescription || '',
                focusKeyword: p.focusKeyword || '',
                canonicalUrl: p.canonicalUrl || '',
                metaRobots:   p.metaRobots || 'index,follow',
                ogTitle:      p.ogTitle || '',
                ogDesc:       p.ogDescription || '',
                ogImage:      p.ogImage || '',
                ctaHeading:   p.ctaHeading || '',
                ctaText:      p.ctaText || '',
                ctaBtnText:   p.ctaBtnText || '',
                ctaBtnLink:   p.ctaBtnLink || '',
                ctaPosition:  p.ctaPosition || 'bottom',
                schemaType:   p.schemaType || 'BlogPosting',
                schemaJson:   p.schemaText || '',
                redirectFrom: p.redirectFrom || '',
                redirectTo:   p.redirectTo   || '',
            };
            faqItems = Array.isArray(p.faqs) ? p.faqs.map(f => ({ q: f.q || f.question || '', a: f.a || f.answer || '' })) : [];
        }

        function captureFormState() {
            // Problem 4 fix: flush contenteditable → hidden field before reading
            const editorDiv = container.querySelector('#cms-content-editor');
            const hiddenField = container.querySelector('#cms-content-hidden');
            if (editorDiv && hiddenField) {
                hiddenField.value = editorDiv.innerHTML;
            }

            const map = {
                title: '#cms-title', slug: '#cms-slug', author: '#cms-author',
                category: '#cms-cat', tags: '#cms-tags', publishDate: '#cms-publish-date',
                status: '#cms-status', excerpt: '#cms-excerpt',
                imgAlt: '#cms-img-alt', imgTitle: '#cms-img-title', imgCaption: '#cms-img-caption',
                content: '#cms-content-hidden',
                seoTitle: '#cms-seo-title', seoDesc: '#cms-seo-desc',
                focusKeyword: '#cms-focus-keyword', canonicalUrl: '#cms-canonical',
                metaRobots: '#cms-meta-robots',
                ogTitle: '#cms-og-title', ogDesc: '#cms-og-desc', ogImage: '#cms-og-img',
                ctaHeading: '#cms-cta-head', ctaText: '#cms-cta-text',
                ctaBtnText: '#cms-cta-btn', ctaBtnLink: '#cms-cta-link', ctaPosition: '#cms-cta-position',
                schemaType: '#cms-schema-type', schemaJson: '#cms-schema',
                redirectFrom: '#cms-redirect-from', redirectTo: '#cms-redirect-to',
            };
            for (const [key, sel] of Object.entries(map)) {
                const el = container.querySelector(sel);
                if (el) formState[key] = el.type === 'checkbox' ? el.checked : el.value;
            }
            const imgEl = container.querySelector('#cms-img');
            if (imgEl) formState.image = imgEl.value;
            const tocEl = container.querySelector('#cms-toc');
            if (tocEl) formState.tocEnabled = tocEl.checked;
            container.querySelectorAll('[data-faq-q]').forEach(el => {
                const i = parseInt(el.dataset.faqQ);
                if (!faqItems[i]) faqItems[i] = { q: '', a: '' };
                faqItems[i].q = el.value;
            });
            container.querySelectorAll('[data-faq-a]').forEach(el => {
                const i = parseInt(el.dataset.faqA);
                if (!faqItems[i]) faqItems[i] = { q: '', a: '' };
                faqItems[i].a = el.value;
            });
        }

        // Shared style constants
        const inp = 'width:100%;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:0.9rem;color:#1e293b;background:#fff;box-sizing:border-box;outline:none;';
        const sel = 'width:100%;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:0.9rem;color:#1e293b;background:#fff;box-sizing:border-box;';
        const ta  = 'width:100%;padding:10px 12px;border:1px solid #e2e8f0;border-radius:8px;font-size:0.9rem;color:#1e293b;background:#fff;resize:vertical;box-sizing:border-box;outline:none;';
        const lbl = 'display:block;margin-bottom:6px;font-weight:600;font-size:0.85rem;color:#374151;';
        const row2 = 'display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px;';
        const mb = 'margin-bottom:16px;';
        const sectionHead = 'margin:0 0 16px;font-size:0.8rem;font-weight:700;color:#6366f1;text-transform:uppercase;letter-spacing:0.06em;padding-bottom:8px;border-bottom:2px solid #ede9fe;';

        function charCounter(id, max) {
            return '<div style="text-align:right;font-size:0.75rem;color:#94a3b8;margin-top:4px;" id="' + id + '-counter">0 / ' + max + ' characters</div>';
        }

        function renderFaqItems() {
            if (!faqItems.length) return '<div style="text-align:center;padding:16px;color:#94a3b8;border:1px dashed #e2e8f0;border-radius:8px;font-size:0.85rem;margin-bottom:10px;">No FAQ items yet.</div>';
            return faqItems.map((faq, i) => [
                '<div class="faq-item" style="border:1px solid #e2e8f0;border-radius:8px;padding:14px;margin-bottom:10px;background:#fafafa;">',
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">',
                '<strong style="font-size:0.78rem;color:#6366f1;text-transform:uppercase;letter-spacing:0.05em;">Question ' + (i + 1) + '</strong>',
                '<button data-action="remove_faq" data-faq-idx="' + i + '" style="background:none;border:none;cursor:pointer;color:#ef4444;padding:2px 6px;font-size:0.9rem;"><i class="fa-solid fa-xmark"></i></button>',
                '</div>',
                '<input type="text" data-faq-q="' + i + '" style="' + inp + 'margin-bottom:8px;" value="' + escHtml(faq.q) + '" placeholder="Enter question">',
                '<textarea data-faq-a="' + i + '" style="' + ta + 'min-height:60px;">' + escHtml(faq.a) + '</textarea>',
                '</div>',
            ].join('')).join('');
        }

        function renderBasicTab() {
            return [
                '<div style="' + row2 + '">',
                '<div><label style="' + lbl + '">Title <span style="color:#ef4444;">*</span></label>',
                '<input type="text" id="cms-title" style="' + inp + '" value="' + escHtml(formState.title) + '" placeholder="Enter blog post title"></div>',
                '<div><label style="' + lbl + '">Slug <span style="color:#ef4444;">*</span></label>',
                '<div style="display:flex;border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;background:#fff;">',
                '<span style="padding:10px 12px;background:#f8fafc;font-size:0.8rem;color:#94a3b8;white-space:nowrap;border-right:1px solid #e2e8f0;">/blog/</span>',
                '<input type="text" id="cms-slug" style="flex:1;padding:10px 12px;border:none;font-size:0.9rem;color:#1e293b;outline:none;" value="' + escHtml(formState.slug) + '" placeholder="url-friendly-slug">',
                '</div></div>',
                '</div>',
                '<div style="' + row2 + '">',
                '<div><label style="' + lbl + '">Author</label>',
                '<input type="text" id="cms-author" style="' + inp + '" value="' + escHtml(formState.author) + '" placeholder="Author name"></div>',
                '<div><label style="' + lbl + '">Category</label>',
                '<select id="cms-cat" style="' + sel + '"><option value="">Select Category</option>' + categoryOptions(formState.category) + '</select></div>',
                '</div>',
                '<div style="' + row2 + '">',
                '<div><label style="' + lbl + '">Tags <span style="font-weight:400;color:#94a3b8;">(comma-separated)</span></label>',
                '<input type="text" id="cms-tags" style="' + inp + '" value="' + escHtml(formState.tags) + '" placeholder="rent, roommate, guide"></div>',
                '<div><label style="' + lbl + '">Publish Date</label>',
                '<input type="datetime-local" id="cms-publish-date" style="' + inp + '" value="' + escHtml(formState.publishDate) + '"></div>',
                '</div>',
                '<div style="' + mb + '">',
                '<label style="' + lbl + '">Status</label>',
                '<select id="cms-status" style="' + sel + 'max-width:220px;">',
                '<option value="draft"' + (formState.status === 'draft' ? ' selected' : '') + '>Draft</option>',
                '<option value="published"' + (formState.status === 'published' ? ' selected' : '') + '>Published</option>',
                '<option value="scheduled"' + (formState.status === 'scheduled' ? ' selected' : '') + '>Scheduled</option>',
                '</select></div>',
                '<div style="' + mb + '">',
                '<label style="' + lbl + '">Excerpt / Short Description <span style="color:#ef4444;">*</span></label>',
                '<textarea id="cms-excerpt" style="' + ta + 'min-height:80px;" maxlength="160" placeholder="Brief description for blog listing">' + escHtml(formState.excerpt) + '</textarea>',
                charCounter('cms-excerpt', 160),
                '</div>',
            ].join('');
        }

        function renderSeoTab() {
            const slugPrev  = escHtml(formState.slug || 'url-friendly-title');
            const titlePrev = escHtml((formState.seoTitle || formState.title || 'Meta Title').slice(0, 60));
            const descPrev  = escHtml((formState.seoDesc || formState.excerpt || 'Meta description will appear here...').slice(0, 160));
            return [
                '<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin-bottom:24px;">',
                '<div style="font-size:0.72rem;font-weight:700;color:#94a3b8;margin-bottom:12px;text-transform:uppercase;letter-spacing:0.06em;">Google Search Preview</div>',
                '<div style="font-size:0.75rem;color:#202124;margin-bottom:4px;">roommategroups.com › blog › <span id="seo-preview-slug">' + slugPrev + '</span></div>',
                '<div id="seo-preview-title" style="font-size:1.1rem;color:#1a0dab;margin-bottom:4px;line-height:1.3;">' + titlePrev + '</div>',
                '<div id="seo-preview-desc" style="font-size:0.85rem;color:#4d5156;line-height:1.5;">' + descPrev + '</div>',
                '</div>',
                '<div style="' + mb + '">',
                '<label style="' + lbl + '">Meta Title <span style="color:#ef4444;">*</span></label>',
                '<input type="text" id="cms-seo-title" style="' + inp + '" maxlength="60" value="' + escHtml(formState.seoTitle) + '" placeholder="SEO-optimized title (max 60 chars)">',
                charCounter('cms-seo-title', 60),
                '</div>',
                '<div style="' + mb + '">',
                '<label style="' + lbl + '">Meta Description <span style="color:#ef4444;">*</span></label>',
                '<textarea id="cms-seo-desc" style="' + ta + 'min-height:80px;" maxlength="160" placeholder="Compelling meta description (max 160 chars)">' + escHtml(formState.seoDesc) + '</textarea>',
                charCounter('cms-seo-desc', 160),
                '</div>',
                '<div style="' + row2 + '">',
                '<div><label style="' + lbl + '">Focus Keyword</label>',
                '<input type="text" id="cms-focus-keyword" style="' + inp + '" value="' + escHtml(formState.focusKeyword) + '" placeholder="Primary keyword"></div>',
                '<div><label style="' + lbl + '">Canonical URL</label>',
                '<input type="url" id="cms-canonical" style="' + inp + '" value="' + escHtml(formState.canonicalUrl) + '" placeholder="https://..."></div>',
                '</div>',
                '<div style="' + mb + '">',
                '<label style="' + lbl + '">Meta Robots</label>',
                '<select id="cms-meta-robots" style="' + sel + 'max-width:280px;">',
                '<option value="index,follow"'       + (formState.metaRobots === 'index,follow'    ? ' selected' : '') + '>index, follow (default)</option>',
                '<option value="noindex,follow"'     + (formState.metaRobots === 'noindex,follow'  ? ' selected' : '') + '>noindex, follow</option>',
                '<option value="index,nofollow"'     + (formState.metaRobots === 'index,nofollow'  ? ' selected' : '') + '>index, nofollow</option>',
                '<option value="noindex,nofollow"'   + (formState.metaRobots === 'noindex,nofollow'? ' selected' : '') + '>noindex, nofollow</option>',
                '</select></div>',
            ].join('');
        }

        function renderContentTab() {
            const hasImg = !!formState.image;
            return [
                '<h4 style="' + sectionHead + '">Featured Image</h4>',
                '<div id="cms-img-dropzone" style="border:2px dashed #e2e8f0;border-radius:10px;padding:32px;text-align:center;cursor:pointer;background:#f8fafc;position:relative;display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:180px;overflow:hidden;margin-bottom:16px;">',
                '<input type="file" id="cms-img-file" accept="image/*" style="opacity:0;position:absolute;inset:0;width:100%;height:100%;cursor:pointer;z-index:10;">',
                '<i class="fa-regular fa-image" style="font-size:2rem;color:#cbd5e1;margin-bottom:12px;pointer-events:none;"></i>',
                '<div id="cms-img-preview-container" style="' + (hasImg ? '' : 'display:none;') + 'position:absolute;inset:0;z-index:5;">',
                '<img id="cms-img-preview" src="' + escHtml(formState.image) + '" style="width:100%;height:100%;object-fit:cover;opacity:0.7;">',
                '<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;color:white;font-weight:600;text-shadow:0 1px 4px rgba(0,0,0,0.8);pointer-events:none;">Click or drag to replace</div>',
                '</div>',
                '<span id="cms-img-text" style="' + (hasImg ? 'display:none;' : '') + 'font-weight:600;color:#475569;pointer-events:none;">Drag image here<br><small style="font-weight:400;color:#94a3b8;">or click to browse</small></span>',
                '</div>',
                '<input type="hidden" id="cms-img" value="' + escHtml(formState.image) + '">',
                '<div style="' + row2 + '">',
                '<div><label style="' + lbl + '">Alt Text</label>',
                '<input type="text" id="cms-img-alt" style="' + inp + '" value="' + escHtml(formState.imgAlt) + '" placeholder="Describe image for SEO & accessibility"></div>',
                '<div><label style="' + lbl + '">Image Title</label>',
                '<input type="text" id="cms-img-title" style="' + inp + '" value="' + escHtml(formState.imgTitle) + '" placeholder="Title attribute"></div>',
                '</div>',
                '<div style="' + mb + '"><label style="' + lbl + '">Caption</label>',
                '<input type="text" id="cms-img-caption" style="' + inp + '" value="' + escHtml(formState.imgCaption) + '" placeholder="Displayed below image"></div>',
                '<h4 style="' + sectionHead + 'margin-top:24px;">Blog Content (Visual Editor)</h4>',
                '<div style="' + mb + '">',
                '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">',
                '<div style="display:flex;align-items:center;gap:12px;">',
                '<label style="' + lbl + 'margin:0;">Write or Paste Content <span style="color:#ef4444;">*</span></label>',
                '<div style="display:flex;gap:6px;background:#f1f5f9;padding:4px;border-radius:8px;">',
                '<button type="button" class="rte-btn" data-cmd="bold" title="Bold" style="width:32px;height:32px;border:none;background:white;border-radius:6px;cursor:pointer;font-weight:900;box-shadow:0 1px 2px rgba(0,0,0,0.05);">B</button>',
                '<button type="button" class="rte-btn" data-cmd="formatBlock" data-val="h2" title="H2 Heading" style="width:32px;height:32px;border:none;background:white;border-radius:6px;cursor:pointer;font-weight:800;box-shadow:0 1px 2px rgba(0,0,0,0.05);">H2</button>',
                '<button type="button" class="rte-btn" data-cmd="formatBlock" data-val="h3" title="H3 Heading" style="width:32px;height:32px;border:none;background:white;border-radius:6px;cursor:pointer;font-weight:800;box-shadow:0 1px 2px rgba(0,0,0,0.05);">H3</button>',
                '<button type="button" class="rte-btn" data-cmd="insertUnorderedList" title="List" style="width:32px;height:32px;border:none;background:white;border-radius:6px;cursor:pointer;box-shadow:0 1px 2px rgba(0,0,0,0.05);"><i class="fa-solid fa-list-ul"></i></button>',
                '</div>',
                '</div>',
                '<span id="cms-readtime" style="font-size:0.78rem;color:#6366f1;background:#ede9fe;padding:3px 10px;border-radius:20px;font-weight:600;">' + escHtml(calcReadTime(formState.content)) + '</span>',
                '</div>',
                '<div id="cms-content-editor" contenteditable="true" class="prose" style="background:#ffffff !important;color:#1e293b !important;border:2px solid #e2e8f0;border-radius:12px;padding:40px;min-height:600px;max-height:900px;overflow-y:auto;outline:none;box-shadow:0 4px 12px rgba(0,0,0,0.03);font-size:1.1rem;" placeholder="Paste your content here...">',
                parseMarkdown(formState.content || ''),
                '</div>',
                '<textarea id="cms-content-hidden" style="display:none;">' + escHtml(formState.content || '') + '</textarea>',
                '</div>',
                '<div style="margin-top:12px;font-size:0.8rem;color:#64748b;display:flex;align-items:center;gap:6px;">',
                '<i class="fa-solid fa-circle-info"></i>',
                '<span><b>Tip:</b> Copy and paste directly from your source. Formatting, headings, and bolding will be preserved automatically.</span>',
                '</div>',
                '<div style="display:flex;align-items:center;gap:10px;padding:12px 16px;background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;margin-bottom:20px;">',
                '<input type="checkbox" id="cms-toc" style="width:16px;height:16px;accent-color:#6366f1;" ' + (formState.tocEnabled ? 'checked' : '') + '>',
                '<div><label for="cms-toc" style="font-weight:600;font-size:0.9rem;cursor:pointer;">Auto-generate Table of Contents</label>',
                '<div style="font-size:0.78rem;color:#64748b;">Automatically creates a TOC from H2/H3 headings</div></div>',
                '</div>',
                '<h4 style="' + sectionHead + '">FAQ Section</h4>',
                renderFaqItems(),
                '<button data-action="add_faq" style="padding:8px 16px;border:2px dashed #e2e8f0;background:transparent;border-radius:8px;cursor:pointer;color:#6366f1;font-size:0.85rem;font-weight:600;width:100%;margin-top:4px;"><i class="fa-solid fa-plus"></i> Add Question</button>',
            ].join('');
        }

        function renderSocialTab() {
            const previewTitle = formState.ogTitle || formState.seoTitle || formState.title || '';
            const previewDesc  = formState.ogDesc  || formState.seoDesc  || formState.excerpt || '';
            const previewImg   = formState.ogImage || formState.image || '';
            return [
                '<div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:0.82rem;color:#0369a1;">',
                '<i class="fa-solid fa-circle-info"></i> OG fields auto-fill from SEO settings if left empty.',
                '</div>',
                '<div style="' + mb + '"><label style="' + lbl + '">OG Title</label>',
                '<input type="text" id="cms-og-title" style="' + inp + '" value="' + escHtml(formState.ogTitle) + '" placeholder="Fallback: Meta Title"></div>',
                '<div style="' + mb + '"><label style="' + lbl + '">OG Description</label>',
                '<textarea id="cms-og-desc" style="' + ta + 'min-height:80px;" placeholder="Fallback: Meta Description">' + escHtml(formState.ogDesc) + '</textarea></div>',
                '<div style="' + mb + '"><label style="' + lbl + '">OG Image URL</label>',
                '<input type="text" id="cms-og-img" style="' + inp + '" value="' + escHtml(formState.ogImage) + '" placeholder="https://... (defaults to featured image)"></div>',
                previewTitle ? [
                    '<h4 style="' + sectionHead + 'margin-top:8px;">Social Preview</h4>',
                    '<div style="border:1px solid #e2e8f0;border-radius:10px;overflow:hidden;max-width:480px;">',
                    '<div style="background:#f1f3f4;height:160px;display:flex;align-items:center;justify-content:center;color:#94a3b8;overflow:hidden;">',
                    previewImg ? '<img src="' + escHtml(previewImg) + '" style="width:100%;height:100%;object-fit:cover;">' : '<i class="fa-regular fa-image" style="font-size:2rem;"></i>',
                    '</div>',
                    '<div style="padding:12px;background:#f8f9fa;border-top:1px solid #e2e8f0;">',
                    '<div style="font-size:0.72rem;color:#94a3b8;text-transform:uppercase;margin-bottom:4px;">ROOMMATEGROUPS.COM</div>',
                    '<div style="font-weight:700;font-size:0.9rem;margin-bottom:4px;color:#1e293b;">' + escHtml(previewTitle.slice(0, 60)) + '</div>',
                    '<div style="font-size:0.8rem;color:#64748b;">' + escHtml(previewDesc.slice(0, 120)) + '</div>',
                    '</div></div>',
                ].join('') : '',
            ].join('');
        }

        function renderCtaTab() {
            const showPreview = formState.ctaHeading || formState.ctaBtnText;
            return [
                '<h4 style="' + sectionHead + '">Call to Action Block</h4>',
                '<div style="' + mb + '"><label style="' + lbl + '">CTA Heading</label>',
                '<input type="text" id="cms-cta-head" style="' + inp + '" value="' + escHtml(formState.ctaHeading) + '" placeholder="e.g. Find Your Perfect Roommate"></div>',
                '<div style="' + mb + '"><label style="' + lbl + '">CTA Text</label>',
                '<textarea id="cms-cta-text" style="' + ta + 'min-height:70px;" placeholder="Supporting text for the CTA">' + escHtml(formState.ctaText) + '</textarea></div>',
                '<div style="' + row2 + '">',
                '<div><label style="' + lbl + '">Button Text</label>',
                '<input type="text" id="cms-cta-btn" style="' + inp + '" value="' + escHtml(formState.ctaBtnText) + '" placeholder="e.g. Get Started Free"></div>',
                '<div><label style="' + lbl + '">Button Link</label>',
                '<input type="url" id="cms-cta-link" style="' + inp + '" value="' + escHtml(formState.ctaBtnLink) + '" placeholder="https://..."></div>',
                '</div>',
                '<div style="' + mb + '"><label style="' + lbl + '">CTA Position</label>',
                '<select id="cms-cta-position" style="' + sel + 'max-width:200px;">',
                '<option value="top"'   + (formState.ctaPosition === 'top'    ? ' selected' : '') + '>Top of post</option>',
                '<option value="middle"'+ (formState.ctaPosition === 'middle' ? ' selected' : '') + '>Middle of post</option>',
                '<option value="bottom"'+ (formState.ctaPosition === 'bottom' ? ' selected' : '') + '>Bottom of post</option>',
                '</select></div>',
                showPreview ? [
                    '<h4 style="' + sectionHead + 'margin-top:8px;">Preview</h4>',
                    '<div style="background:linear-gradient(135deg,#6366f1,#8b5cf6);color:white;border-radius:12px;padding:24px;text-align:center;">',
                    formState.ctaHeading ? '<h3 style="margin:0 0 8px;font-size:1.1rem;">' + escHtml(formState.ctaHeading) + '</h3>' : '',
                    formState.ctaText    ? '<p style="margin:0 0 16px;opacity:0.9;font-size:0.85rem;">' + escHtml(formState.ctaText) + '</p>' : '',
                    formState.ctaBtnText ? '<span style="display:inline-block;background:white;color:#6366f1;padding:8px 24px;border-radius:6px;font-weight:700;font-size:0.9rem;">' + escHtml(formState.ctaBtnText) + '</span>' : '',
                    '</div>',
                ].join('') : '',
            ].join('');
        }

        function renderAdvancedTab() {
            return [
                '<div style="' + mb + '"><label style="' + lbl + '">Schema Type</label>',
                '<select id="cms-schema-type" style="' + sel + 'max-width:260px;">',
                ['BlogPosting', 'Article', 'HowTo', 'Guide', 'FAQPage'].map(t =>
                    '<option value="' + t + '"' + (formState.schemaType === t ? ' selected' : '') + '>' + t + '</option>'
                ).join(''),
                '</select></div>',
                '<div style="' + mb + '"><label style="' + lbl + '">Custom Schema JSON-LD <span style="font-weight:400;color:#94a3b8;">(optional override)</span></label>',
                '<textarea id="cms-schema" style="' + ta + 'min-height:120px;font-family:monospace;font-size:0.82rem;" placeholder=\'{"@context":"https://schema.org","@type":"BlogPosting",...}\'>' + escHtml(formState.schemaJson) + '</textarea></div>',
                '<h4 style="' + sectionHead + 'margin-top:8px;">301 Redirect</h4>',
                '<div style="' + row2 + '">',
                '<div><label style="' + lbl + '">From (Old URL)</label>',
                '<input type="text" id="cms-redirect-from" style="' + inp + '" value="' + escHtml(formState.redirectFrom) + '" placeholder="/old-blog-url"></div>',
                '<div><label style="' + lbl + '">To (New URL)</label>',
                '<input type="text" id="cms-redirect-to" style="' + inp + '" value="' + escHtml(formState.redirectTo) + '" placeholder="/new-blog-url"></div>',
                '</div>',
                '<div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:12px 16px;font-size:0.82rem;color:#92400e;">',
                '<i class="fa-solid fa-triangle-exclamation"></i> Redirects are stored as metadata. Implement server-side 301 handling separately.',
                '</div>',
            ].join('');
        }

        function renderPostModal(post) {
            const isEdit = !!post;
            const tabDefs = [
                { id: 'basic',    icon: 'fa-circle-info',      label: 'Basic Info' },
                { id: 'seo',      icon: 'fa-magnifying-glass', label: 'SEO Settings' },
                { id: 'content',  icon: 'fa-file-lines',       label: 'Content' },
                { id: 'social',   icon: 'fa-share-nodes',      label: 'Social Sharing' },
                { id: 'cta',      icon: 'fa-bullhorn',         label: 'CTA & Conversion' },
                { id: 'advanced', icon: 'fa-sliders',          label: 'Advanced' },
            ];
            const tabIds     = tabDefs.map(t => t.id);
            const currentIdx = tabIds.indexOf(modalTab);
            const isFirst    = currentIdx === 0;
            const isLast     = currentIdx === tabIds.length - 1;
            const prevId     = !isFirst ? tabIds[currentIdx - 1] : null;
            const nextId     = !isLast  ? tabIds[currentIdx + 1] : null;
            const prevLabel  = prevId ? tabDefs[currentIdx - 1].label : '';
            const nextLabel  = nextId ? tabDefs[currentIdx + 1].label : '';

            const tabs = tabDefs.map((t, i) => {
                const active = modalTab === t.id;
                const done   = i < currentIdx;
                return '<button data-modal-tab="' + t.id + '" style="display:flex;align-items:center;gap:6px;padding:11px 16px;border:none;background:none;cursor:pointer;font-size:0.83rem;font-weight:' + (active ? '700' : '500') + ';color:' + (active ? '#6366f1' : done ? '#22c55e' : '#64748b') + ';border-bottom:2px solid ' + (active ? '#6366f1' : 'transparent') + ';white-space:nowrap;transition:color 0.15s;">'
                    + '<i class="fa-solid ' + (done ? 'fa-circle-check' : t.icon) + '"></i>' + t.label + '</button>';
            }).join('');

            // Step progress dots
            const dots = tabDefs.map((_, i) =>
                '<span style="display:inline-block;width:' + (i === currentIdx ? '20px' : '8px') + ';height:8px;border-radius:4px;background:' + (i < currentIdx ? '#22c55e' : i === currentIdx ? '#6366f1' : '#e2e8f0') + ';transition:all 0.2s;"></span>'
            ).join('');

            let tabContent;
            switch (modalTab) {
                case 'seo':      tabContent = renderSeoTab();      break;
                case 'content':  tabContent = renderContentTab();  break;
                case 'social':   tabContent = renderSocialTab();   break;
                case 'cta':      tabContent = renderCtaTab();      break;
                case 'advanced': tabContent = renderAdvancedTab(); break;
                default:         tabContent = renderBasicTab();
            }

            // Bottom nav bar
            const bottomNav = [
                '<div style="padding:16px 24px;border-top:1px solid #e2e8f0;background:#f8fafc;border-radius:0 0 14px 14px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">',
                // Left: Back button
                '<div>',
                !isFirst
                    ? '<button type="button" data-action="tab_prev" style="display:flex;align-items:center;gap:6px;padding:9px 18px;border:1px solid #e2e8f0;background:#fff;color:#475569;border-radius:8px;cursor:pointer;font-size:0.85rem;font-weight:600;"><i class="fa-solid fa-arrow-left"></i> Back: ' + escHtml(prevLabel) + '</button>'
                    : '<button type="button" data-action="close_modal" style="padding:9px 18px;border:1px solid #e2e8f0;background:#fff;color:#475569;border-radius:8px;cursor:pointer;font-size:0.85rem;font-weight:600;">Cancel</button>',
                '</div>',
                // Center: step dots
                '<div style="display:flex;align-items:center;gap:6px;">' + dots + '</div>',
                // Right: Next or Publish
                '<div style="display:flex;gap:8px;">',
                !isLast
                    ? '<button type="button" data-action="tab_next" style="display:flex;align-items:center;gap:6px;padding:9px 18px;background:#6366f1;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:0.85rem;font-weight:600;">Next: ' + escHtml(nextLabel) + ' <i class="fa-solid fa-arrow-right"></i></button>'
                    : [
                        '<button type="button" data-action="open_preview" style="padding:9px 16px;background:transparent;border:1px solid #818cf8;color:#818cf8;border-radius:8px;cursor:pointer;font-size:0.85rem;font-weight:600;"><i class="fa-solid fa-eye"></i> Preview</button>',
                        '<button type="button" data-action="save_draft_post" style="padding:9px 16px;background:#334155;border:1px solid #475569;color:#cbd5e1;border-radius:8px;cursor:pointer;font-size:0.85rem;font-weight:600;"><i class="fa-regular fa-floppy-disk"></i> Save Draft</button>',
                        '<button type="button" data-action="publish_post" style="padding:9px 18px;background:#22c55e;border:none;color:#fff;border-radius:8px;cursor:pointer;font-size:0.85rem;font-weight:700;"><i class="fa-solid fa-rocket"></i> Publish</button>',
                    ].join(''),
                '</div>',
                '</div>',
            ].join('');

            return [
                '<div class="adm-modal-overlay" style="position:fixed;inset:0;background:rgba(15,23,42,0.85);display:flex;align-items:flex-start;justify-content:center;z-index:9999;padding:20px;overflow-y:auto;">',
                '<div style="background:#fff;color:#1e293b;width:100%;max-width:920px;border-radius:14px;box-shadow:0 30px 70px -12px rgba(0,0,0,0.6);display:flex;flex-direction:column;margin:auto;">',
                // Header
                '<div style="padding:16px 24px;border-bottom:1px solid #334155;display:flex;justify-content:space-between;align-items:center;background:linear-gradient(135deg,#1e293b,#334155);border-radius:14px 14px 0 0;flex-shrink:0;">',
                '<div style="display:flex;align-items:center;gap:12px;">',
                '<i class="fa-solid fa-newspaper" style="color:#818cf8;font-size:1.2rem;"></i>',
                '<div><div style="color:#fff;font-weight:700;font-size:0.95rem;">Blog Publishing CMS</div>',
                '<div style="color:#94a3b8;font-size:0.73rem;">' + (isEdit ? 'Editing: ' + escHtml(post.title || 'Post') : 'Creating new post') + '</div></div>',
                '</div>',
                '<div style="display:flex;align-items:center;gap:8px;">',
                '<span id="cms-autosave-badge" style="font-size:0.73rem;color:#94a3b8;margin-right:8px;"></span>',
                '<button type="button" data-action="open_preview" style="display:flex;align-items:center;gap:6px;padding:7px 16px;background:rgba(99,102,241,0.15);border:1px solid rgba(99,102,241,0.4);color:#a5b4fc;border-radius:8px;cursor:pointer;font-size:0.82rem;font-weight:600;transition:all 0.2s;"><i class="fa-solid fa-eye"></i> Preview</button>',
                '<button type="button" data-action="close_modal" style="background:none;border:none;color:#94a3b8;cursor:pointer;padding:6px;font-size:1.1rem;margin-left:4px;line-height:1;"><i class="fa-solid fa-xmark"></i></button>',
                '</div></div>',
                // Tab bar
                '<div style="display:flex;border-bottom:1px solid #e2e8f0;overflow-x:auto;background:#f8fafc;flex-shrink:0;padding:0 8px;">',
                tabs,
                '</div>',
                // Content
                '<div style="padding:24px;overflow-y:auto;max-height:calc(100vh - 240px);">',
                tabContent,
                '</div>',
                // Bottom nav
                bottomNav,
                '</div></div>',
            ].join('');
        }

        // ── Live Preview Modal ────────────────────────────────────
        function openPreviewModal() {
            captureFormState();
            document.getElementById('cms-preview-modal')?.remove();

            function rcPreview(content) {
                const t = (content || '').trim();
                return /^<[a-zA-Z]/.test(t) ? t : parseMarkdown(t);
            }

            const displayDate = (() => {
                try {
                    const d = formState.publishDate ? new Date(formState.publishDate) : new Date();
                    return d.toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' });
                } catch { return ''; }
            })();

            const authorName   = formState.author || 'Admin';
            const authorAvatar = 'https://ui-avatars.com/api/?name=' + encodeURIComponent(authorName) + '&background=6366f1&color=fff&size=80';
            const heroImg      = formState.image || '';
            const tags         = (formState.tags || '').split(',').map(t => t.trim()).filter(Boolean);
            const wordCount    = (formState.content || '').replace(/<[^>]*>/g,'').trim().split(/\s+/).filter(Boolean).length;
            const readTime     = Math.max(1, Math.round(wordCount / 200)) + ' min read';

            function buildTOC(content) {
                const div = document.createElement('div');
                div.innerHTML = rcPreview(content);
                const hs = div.querySelectorAll('h2,h3');
                if (!hs.length) return '';
                let li = '';
                hs.forEach((h, i) => {
                    const is3 = h.tagName === 'H3';
                    li += '<li style="margin-bottom:3px;"><a href="#ph-' + i + '" style="display:block;padding:' + (is3?'4px 10px 4px 22px':'5px 10px') + ';font-size:' + (is3?'0.8rem':'0.88rem') + ';color:#475569;text-decoration:none;border-radius:6px;border-left:2px solid transparent;" onmouseover="this.style.color=\'#6366f1\';this.style.background=\'#f5f3ff\';this.style.borderLeftColor=\'#6366f1\'" onmouseout="this.style.color=\'#475569\';this.style.background=\'transparent\';this.style.borderLeftColor=\'transparent\'">' + h.textContent.trim() + '</a></li>';
                });
                return '<ul style="list-style:none;padding:0;margin:0;">' + li + '</ul>';
            }

            function bodyWithIDs(content) {
                const div = document.createElement('div');
                div.innerHTML = rcPreview(content);
                div.querySelectorAll('h2,h3').forEach((h,i) => { h.id = 'ph-' + i; });
                return div.innerHTML;
            }

            const tocHTML  = buildTOC(formState.content || '');
            const bodyHTML = bodyWithIDs(formState.content || '');

            const tagsHTML = tags.length
                ? '<div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin:32px 0 10px;padding-top:20px;border-top:1px solid #e2e8f0;"><i class="fas fa-tags" style="color:#94a3b8;"></i>' + tags.map(t => '<span style="background:#f1f5f9;border:1px solid #e2e8f0;padding:4px 14px;border-radius:30px;font-size:0.8rem;color:#64748b;">' + escHtml(t) + '</span>').join('') + '</div>'
                : '';

            const ctaHTML = (formState.ctaHeading || formState.ctaBtnText)
                ? '<div style="background:linear-gradient(135deg,#6366f1 0%,#1e1b4b 100%);border-radius:16px;padding:40px 44px;margin:48px 0;color:white;"><div style="display:flex;align-items:center;justify-content:space-between;gap:20px;flex-wrap:wrap;"><div><h3 style="font-size:1.5rem;font-weight:800;margin:0 0 8px;color:white;">' + escHtml(formState.ctaHeading || 'Ready to Find Your Next Room?') + '</h3><p style="font-size:0.9rem;opacity:0.9;margin:0;color:white;">' + escHtml(formState.ctaText || '') + '</p></div>' + (formState.ctaBtnText ? '<span style="background:white;color:#6366f1;font-weight:700;padding:12px 24px;border-radius:30px;white-space:nowrap;">' + escHtml(formState.ctaBtnText) + ' →</span>' : '') + '</div></div>'
                : '';

            const iframeDoc = `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.0/css/all.min.css">
<style>
*{box-sizing:border-box;margin:0;padding:0;}
body{font-family:'Inter',system-ui,sans-serif;background:#f8fafc;color:#1e293b;line-height:1.7;}
.hero{position:relative;height:55vh;min-height:420px;max-height:640px;display:flex;align-items:flex-end;color:white;background:#0f172a;}
.hero-bg{position:absolute;inset:0;width:100%;height:100%;object-fit:cover;opacity:.8;}
.hero-ov{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,.05),rgba(0,0,0,.82));}
.hero-c{position:relative;z-index:2;padding:0 20px 52px;width:100%;max-width:1200px;margin:0 auto;}
.badge{background:#6366f1;color:white;font-size:.82rem;font-weight:700;letter-spacing:.8px;text-transform:uppercase;padding:6px 16px;border-radius:30px;display:inline-block;margin-bottom:16px;}
.bc{display:flex;align-items:center;gap:8px;color:rgba(255,255,255,.75);font-size:.85rem;margin-bottom:16px;}
h1.pt{font-size:clamp(2rem,5vw,3.5rem);font-weight:800;line-height:1.15;margin-bottom:24px;max-width:900px;text-shadow:0 2px 12px rgba(0,0,0,.5);}
.meta{display:flex;align-items:center;gap:20px;flex-wrap:wrap;}
.meta .ai{display:flex;align-items:center;gap:10px;}
.meta img{width:44px!important;height:44px!important;border-radius:50%!important;border:2px solid rgba(255,255,255,.7)!important;object-fit:cover!important;position:static!important;opacity:1!important;inset:auto!important;}
.meta .st{font-size:.9rem;opacity:.85;display:flex;align-items:center;gap:10px;}
.layout{max-width:1100px;margin:0 auto;padding:36px 24px;display:grid;grid-template-columns:1fr 300px;gap:36px;align-items:start;}
@media(max-width:900px){.layout{grid-template-columns:1fr;}.sb{display:none;}}
.prose{background:white;padding:52px;border-radius:16px;box-shadow:0 1px 3px rgba(0,0,0,.08);border:1px solid #e2e8f0;line-height:1.85;font-size:1.1rem;color:#1e293b;}
@media(max-width:640px){.prose{padding:24px;}}
.prose p{margin-bottom:1.75em;color:#334155;}
.prose h2{font-size:2rem;font-weight:800;color:#0f172a;margin:3rem 0 1.25rem;line-height:1.15;letter-spacing:-.04em;}
.prose h3{font-size:1.5rem;font-weight:700;color:#1e293b;margin:2.25rem 0 1rem;line-height:1.2;}
.prose h4{font-size:1.15rem;font-weight:700;color:#334155;margin:1.75rem 0 .5rem;}
.prose ul,.prose ol{margin:1.75em 0;padding-left:1.5em;}
.prose li{margin-bottom:.75em;line-height:1.7;}
.prose strong{color:#0f172a;font-weight:700;}
.prose a{color:#6366f1;text-decoration:underline;}
.prose blockquote{border-left:4px solid #6366f1;padding:1em 1.5em;margin:1.5em 0;background:#f5f3ff;border-radius:0 10px 10px 0;font-style:italic;color:#475569;}
.prose img{width:100%;border-radius:10px;margin:1.75em 0;display:block;}
.prose table{width:100%;border-collapse:collapse;margin:1.75em 0;font-size:.9rem;overflow:hidden;}
.prose thead{background:#6366f1;color:white;}
.prose th{padding:12px 16px;text-align:left;font-weight:700;font-size:.82rem;text-transform:uppercase;}
.prose td{padding:10px 16px;color:#1a1a1a;border-bottom:1px solid #e2e8f0;}
.prose tr:hover{background:#f8fafc;}
.prose code{background:#1e293b;color:#e2e8f0;padding:2px 7px;border-radius:4px;font-family:monospace;font-size:.87em;}
.prose pre{background:#0f172a;color:#e2e8f0;padding:24px;border-radius:10px;overflow-x:auto;margin:1.75em 0;font-family:monospace;font-size:.88rem;line-height:1.7;}
.prose hr{border:none;border-top:2px solid #e2e8f0;margin:2.5em 0;}
.share{margin-top:36px;padding-top:24px;border-top:1px solid #e2e8f0;}
.share h4{font-size:.9rem;margin-bottom:12px;color:#1e293b;}
.sbtns{display:flex;gap:10px;flex-wrap:wrap;}
.sbtn{display:flex;align-items:center;gap:6px;padding:8px 16px;border-radius:30px;border:none;font-weight:600;font-size:.85rem;cursor:pointer;color:white;background:#1a1a1a;}
.sbtn.cp{background:#f1f5f9;color:#334155;border:1px solid #e2e8f0;}
.bio{display:flex;gap:20px;background:white;padding:28px;border-radius:14px;border:1px solid #e2e8f0;margin-top:32px;}
.bio img{width:80px;height:80px;border-radius:50%;object-fit:cover;flex-shrink:0;border:3px solid #f1f5f9;}
.bio h4{font-size:1rem;margin-bottom:6px;font-weight:700;}
.bio p{font-size:.88rem;color:#64748b;line-height:1.6;}
.sb{position:sticky;top:20px;display:flex;flex-direction:column;gap:20px;}
.w{background:white;border-radius:14px;padding:20px;border:1px solid #e2e8f0;}
.w h3{font-size:.75rem;color:#94a3b8;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #e2e8f0;display:flex;align-items:center;gap:6px;}
.cta-w{background:linear-gradient(135deg,#f5f3ff,white);border-top:3px solid #6366f1;}
.cta-w h3{color:#6366f1;border:none;padding:0;}
.cta-w p{font-size:.85rem;color:#64748b;margin-bottom:14px;line-height:1.5;}
.cta-b{display:block;width:100%;padding:10px;border-radius:8px;background:#6366f1;color:white;text-align:center;font-weight:700;font-size:.88rem;border:none;cursor:pointer;}
</style></head><body>
<div class="hero">
  ${heroImg ? '<img class="hero-bg" src="' + escHtml(heroImg) + '" alt="">' : '<div style="position:absolute;inset:0;background:linear-gradient(135deg,#1e293b,#334155);"></div>'}
  <div class="hero-ov"></div>
  <div class="hero-c">
    <div class="bc"><span>Home</span><span>/</span><span>Blog</span>${formState.category ? '<span>/</span><span>' + escHtml(formState.category) + '</span>' : ''}</div>
    ${formState.category ? '<span class="badge">' + escHtml(formState.category) + '</span>' : ''}
    <h1 class="pt">${escHtml(formState.title || 'Untitled Post')}</h1>
    <div class="meta">
      <div class="ai"><img src="${authorAvatar}" alt="${escHtml(authorName)}"><span style="font-weight:600;">${escHtml(authorName)}</span></div>
      <div class="st">${displayDate ? '<span><i class="far fa-calendar"></i> ' + displayDate + '</span><span>•</span>' : ''}<span><i class="far fa-clock"></i> ${readTime}</span></div>
    </div>
  </div>
</div>
<div class="layout">
  <article>
    <div class="prose">
      ${bodyHTML || '<p style="color:#94a3b8;font-style:italic;">No content yet. Go to the Content tab to write your post.</p>'}
      ${tagsHTML}
      ${ctaHTML}
      <div class="share"><h4>Share this article</h4><div class="sbtns"><button class="sbtn"><i class="fab fa-twitter"></i> Twitter</button><button class="sbtn"><i class="fab fa-facebook-f"></i> Facebook</button><button class="sbtn"><i class="fab fa-linkedin-in"></i> LinkedIn</button><button class="sbtn cp"><i class="fas fa-link"></i> Copy Link</button></div></div>
    </div>
    <div class="bio"><img src="${authorAvatar}" alt="${escHtml(authorName)}"><div><h4>About ${escHtml(authorName)}</h4><p>Contributing writer at RoommateGroups.</p></div></div>
  </article>
  <aside class="sb">
    ${tocHTML ? '<div class="w"><h3><i class="fas fa-list-ul"></i> Table of Contents</h3>' + tocHTML + '</div>' : ''}
    <div class="w cta-w"><h3>Looking for a Roommate?</h3><p>Join thousands of people finding their perfect match.</p><button class="cta-b">Browse Roommates</button></div>
  </aside>
</div>
</body></html>`;

            // Build overlay
            const overlay = document.createElement('div');
            overlay.id = 'cms-preview-modal';
            overlay.style.cssText = 'position:fixed;inset:0;z-index:99999;background:rgba(2,6,23,0.97);display:flex;flex-direction:column;';

            const statusColor = formState.status === 'published' ? {bg:'#166534',fg:'#bbf7d0'} : {bg:'#92400e',fg:'#fde68a'};
            const seoDescLen  = (formState.seoDesc || '').length;

            overlay.innerHTML = `
<style>
@keyframes cmsPvFade{from{opacity:0}to{opacity:1}}
#cms-preview-modal{animation:cmsPvFade .2s ease;}
#cms-preview-modal .dv{display:flex;align-items:center;gap:5px;padding:7px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:transparent;color:rgba(255,255,255,.55);cursor:pointer;font-size:.8rem;font-weight:600;transition:all .15s;}
#cms-preview-modal .dv:hover,#cms-preview-modal .dv.on{background:rgba(99,102,241,.25);border-color:rgba(99,102,241,.6);color:#a5b4fc;}
#cms-preview-modal .dv.on{background:rgba(99,102,241,.35);}
</style>
<div style="display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid rgba(255,255,255,.07);flex-shrink:0;">
  <div style="display:flex;align-items:center;gap:10px;">
    <i class="fa-solid fa-eye" style="color:#818cf8;font-size:1rem;"></i>
    <div>
      <div style="color:white;font-weight:700;font-size:.9rem;">Live Preview</div>
      <div style="color:#64748b;font-size:.72rem;">${escHtml(formState.title||'Untitled Post')} <span style="margin-left:6px;padding:1px 7px;border-radius:10px;font-size:.68rem;font-weight:700;background:${statusColor.bg};color:${statusColor.fg};">${(formState.status||'draft').toUpperCase()}</span></div>
    </div>
  </div>
  <div style="display:flex;gap:6px;">
    <button class="dv on" data-dv="desktop"><i class="fa-solid fa-desktop"></i> Desktop</button>
    <button class="dv" data-dv="tablet"><i class="fa-solid fa-tablet-screen-button"></i> Tablet</button>
    <button class="dv" data-dv="mobile"><i class="fa-solid fa-mobile-screen"></i> Mobile</button>
  </div>
  <div style="display:flex;gap:8px;">
    <button id="pv-refresh" style="padding:7px 14px;border-radius:8px;border:1px solid rgba(255,255,255,.12);background:transparent;color:rgba(255,255,255,.55);cursor:pointer;font-size:.8rem;font-weight:600;display:flex;align-items:center;gap:5px;"><i class="fa-solid fa-rotate"></i> Refresh</button>
    <button id="pv-close" style="padding:7px 14px;border-radius:8px;background:rgba(239,68,68,.15);border:1px solid rgba(239,68,68,.3);color:#fca5a5;cursor:pointer;font-size:.8rem;font-weight:600;display:flex;align-items:center;gap:5px;"><i class="fa-solid fa-xmark"></i> Close Preview</button>
  </div>
</div>
<div style="padding:8px 20px;background:rgba(99,102,241,.08);border-bottom:1px solid rgba(99,102,241,.15);display:flex;align-items:center;gap:20px;font-size:.75rem;flex-shrink:0;flex-wrap:wrap;">
  <span style="color:#94a3b8;"><i class="fa-solid fa-magnifying-glass" style="color:#818cf8;"></i> <strong style="color:#a5b4fc;">SEO Title:</strong> ${escHtml((formState.seoTitle||formState.title||'—').slice(0,60))}</span>
  <span style="color:#94a3b8;"><i class="fa-solid fa-link" style="color:#818cf8;"></i> <strong style="color:#a5b4fc;">Slug:</strong> /blog/${escHtml(formState.slug||'—')}</span>
  <span style="color:#94a3b8;"><i class="fa-solid fa-clock" style="color:#818cf8;"></i> <strong style="color:#a5b4fc;">Read Time:</strong> ${readTime}</span>
  <span style="color:${seoDescLen>160?'#fca5a5':'#94a3b8'};"><i class="fa-solid fa-align-left" style="color:#818cf8;"></i> <strong style="color:#a5b4fc;">Meta Desc:</strong> ${seoDescLen}/160 chars</span>
</div>
<div style="flex:1;display:flex;align-items:center;justify-content:center;padding:16px;overflow:hidden;">
  <iframe id="pv-frame" style="width:100%;height:100%;border:none;background:white;box-shadow:0 30px 80px rgba(0,0,0,.7);transition:all .35s cubic-bezier(.4,0,.2,1);"></iframe>
</div>`;

            document.body.appendChild(overlay);

            // Write iframe content
            const fr = overlay.querySelector('#pv-frame');
            fr.contentDocument.open();
            fr.contentDocument.write(iframeDoc);
            fr.contentDocument.close();

            // Device toggle
            const dvMap = {desktop:'width:100%;height:100%;border-radius:0', tablet:'width:768px;height:90%;border-radius:12px', mobile:'width:390px;height:90%;border-radius:24px'};
            overlay.querySelectorAll('.dv[data-dv]').forEach(btn => {
                btn.addEventListener('click', () => {
                    overlay.querySelectorAll('.dv[data-dv]').forEach(b => b.classList.remove('on'));
                    btn.classList.add('on');
                    fr.style.cssText = 'border:none;background:white;box-shadow:0 30px 80px rgba(0,0,0,.7);transition:all .35s cubic-bezier(.4,0,.2,1);' + dvMap[btn.dataset.dv];
                });
            });

            overlay.querySelector('#pv-close').addEventListener('click', () => overlay.remove());
            overlay.querySelector('#pv-refresh').addEventListener('click', () => { overlay.remove(); openPreviewModal(); });

            const onKey = e => { if (e.key === 'Escape') { overlay.remove(); document.removeEventListener('keydown', onKey); } };
            document.addEventListener('keydown', onKey);
        }

        function renderCMS() {
            const blogs = getBlogs();
            const cats  = getCats();

            const html = [
                '<div class="adm-section-header">',
                '<h2>Content & Blog Management</h2>',
                activeTab === 'posts'
                    ? '<button class="adm-btn adm-btn-primary" data-action="new_post"><i class="fa-solid fa-plus"></i> New Post</button>'
                    : '<button class="adm-btn adm-btn-primary" data-action="new_cat"><i class="fa-solid fa-plus"></i> New Category</button>',
                '</div>',
                '<div style="display:flex;gap:6px;margin-bottom:18px;">',
                '<button class="adm-btn ' + (activeTab === 'posts' ? 'adm-btn-primary' : '') + '" data-action="tab_posts"><i class="fa-solid fa-newspaper"></i> Posts</button>',
                '<button class="adm-btn ' + (activeTab === 'categories' ? 'adm-btn-primary' : '') + '" data-action="tab_categories"><i class="fa-solid fa-tags"></i> Categories</button>',
                '</div>',
            ];

            if (activeTab === 'posts') {
                html.push(
                    '<div class="adm-card"><div class="adm-table-responsive">',
                    '<table class="adm-table"><thead><tr>',
                    '<th>Post Title</th><th>Category</th><th>Status</th><th>Author</th><th>Reading Time</th>',
                    '<th style="text-align:right;">Actions</th>',
                    '</tr></thead><tbody>'
                );
                if (!blogs || blogs.length === 0) {
                    html.push('<tr><td colspan="6" style="text-align:center;padding:2rem;color:#94a3b8;">No blog posts yet. Click <strong>New Post</strong> to get started.</td></tr>');
                } else {
                    [...blogs].reverse().forEach(post => {
                        const pid = post.post_id || post.id;
                        const status = post.status || (post.is_published ? 'published' : 'draft');
                        const statusColor = status === 'published' ? '#16a34a' : status === 'scheduled' ? '#d97706' : '#64748b';
                        const statusBg    = status === 'published' ? '#dcfce7'  : status === 'scheduled' ? '#fef3c7'  : '#f1f5f9';
                        html.push(
                            '<tr>',
                            '<td><strong>' + escHtml(post.title || 'Untitled') + '</strong><br><small style="color:var(--text-light);">/blog/' + escHtml(post.slug || '') + '</small></td>',
                            '<td><span class="adm-badge" style="background:var(--bg-elevated);color:var(--text);border:1px solid var(--border);">' + escHtml(post.category || 'Uncategorized') + '</span></td>',
                            '<td><span style="display:inline-block;padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:600;background:' + statusBg + ';color:' + statusColor + ';">' + status.charAt(0).toUpperCase() + status.slice(1) + '</span></td>',
                            '<td>' + escHtml(post.author?.name || 'Admin') + '</td>',
                            '<td>' + escHtml(post.readTime || calcReadTime(post.content || '')) + '</td>',
                            '<td style="text-align:right;display:flex;justify-content:flex-end;gap:8px;">',
                            '<button class="adm-btn adm-btn-icon" title="Edit" data-action="edit_post" data-post-id="' + pid + '"><i class="fa-solid fa-pen"></i></button>',
                            '<button class="adm-btn adm-btn-icon" style="color:var(--danger);" title="Delete" data-action="delete_post" data-post-id="' + pid + '"><i class="fa-solid fa-trash"></i></button>',
                            '</td></tr>'
                        );
                    });
                }
                html.push('</tbody></table></div></div>');

                if (isModalOpen) {
                    const post = editingPostId ? blogs.find(b => String(b.post_id || b.id) === String(editingPostId)) : null;
                    html.push(renderPostModal(post));
                }

            } else {
                html.push(
                    '<div class="adm-card"><div class="adm-table-responsive">',
                    '<table class="adm-table"><thead><tr>',
                    '<th>Name</th><th>Slug</th><th>Description</th><th>Color</th><th>Posts</th>',
                    '<th style="text-align:right;">Actions</th>',
                    '</tr></thead><tbody>'
                );
                if (!cats || cats.length === 0) {
                    html.push('<tr><td colspan="6" style="text-align:center;padding:2rem;">No categories found.</td></tr>');
                } else {
                    cats.forEach(cat => {
                        const cid = cat.category_id;
                        const postCount = blogs.filter(p => p.category === cat.name).length;
                        const canDelete = postCount === 0;
                        html.push(
                            '<tr>',
                            '<td><strong>' + escHtml(cat.name) + '</strong></td>',
                            '<td><code style="font-size:0.82rem;color:var(--text-light);">' + escHtml(cat.slug || '') + '</code></td>',
                            '<td style="max-width:220px;white-space:normal;">' + escHtml(cat.description || '—') + '</td>',
                            '<td><span style="display:inline-flex;align-items:center;gap:6px;"><span style="display:inline-block;width:16px;height:16px;border-radius:3px;background:' + escHtml(cat.color || '#999') + ';"></span>' + escHtml(cat.color || '') + '</span></td>',
                            '<td>' + postCount + '</td>',
                            '<td style="text-align:right;display:flex;justify-content:flex-end;gap:8px;">',
                            '<button class="adm-btn adm-btn-icon" title="Edit" data-action="edit_cat" data-cat-id="' + cid + '"><i class="fa-solid fa-pen"></i></button>',
                            '<button class="adm-btn adm-btn-icon" style="color:var(--danger);" title="' + (canDelete ? 'Delete' : 'Has posts — reassign first') + '" data-action="delete_cat" data-cat-id="' + cid + '"' + (canDelete ? '' : ' disabled') + '><i class="fa-solid fa-trash"></i></button>',
                            '</td></tr>'
                        );
                    });
                }
                html.push('</tbody></table></div></div>');

                if (isCatModalOpen) {
                    const cat    = editingCatId ? cats.find(c => String(c.category_id) === String(editingCatId)) : null;
                    const isEdit = !!cat;
                    html.push(
                        '<div class="adm-modal-overlay" style="position:fixed;inset:0;background:rgba(0,0,0,0.6);display:flex;align-items:center;justify-content:center;z-index:9999;">',
                        '<div style="background:#fff;color:#1e293b;width:90%;max-width:480px;border-radius:12px;box-shadow:0 25px 50px -12px rgba(0,0,0,0.5);display:flex;flex-direction:column;max-height:90vh;">',
                        '<div style="padding:20px 24px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;">',
                        '<h3 style="margin:0;font-size:1.25rem;">' + (isEdit ? 'Edit Category' : 'New Category') + '</h3>',
                        '<button data-action="close_cat_modal" style="background:none;border:none;font-size:1.2rem;cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>',
                        '</div>',
                        '<div style="padding:24px;overflow-y:auto;flex:1;">',
                        '<div style="margin-bottom:16px;"><label style="display:block;margin-bottom:8px;font-weight:500;">Name *</label>',
                        '<input type="text" id="cat-name" class="form-input" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:6px;" value="' + (isEdit ? escHtml(cat.name) : '') + '" placeholder="e.g. City Guides"></div>',
                        '<div style="margin-bottom:16px;"><label style="display:block;margin-bottom:8px;font-weight:500;">Slug *</label>',
                        '<input type="text" id="cat-slug" class="form-input" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:6px;" value="' + (isEdit ? escHtml(cat.slug) : '') + '" placeholder="city-guides"></div>',
                        '<div style="margin-bottom:16px;"><label style="display:block;margin-bottom:8px;font-weight:500;">Description</label>',
                        '<input type="text" id="cat-desc" class="form-input" style="width:100%;padding:10px;border:1px solid var(--border);border-radius:6px;" value="' + (isEdit ? escHtml(cat.description || '') : '') + '" placeholder="Short description"></div>',
                        '<div style="margin-bottom:24px;"><label style="display:block;margin-bottom:8px;font-weight:500;">Color</label>',
                        '<div style="display:flex;align-items:center;gap:10px;">',
                        '<input type="color" id="cat-color" style="width:44px;height:38px;border:1px solid var(--border);border-radius:6px;cursor:pointer;padding:2px;" value="' + (isEdit ? escHtml(cat.color || '#1a1a1a') : '#1a1a1a') + '">',
                        '<input type="text" id="cat-color-text" class="form-input" style="flex:1;padding:10px;border:1px solid var(--border);border-radius:6px;" value="' + (isEdit ? escHtml(cat.color || '#1a1a1a') : '#1a1a1a') + '" placeholder="#1a1a1a">',
                        '</div></div>',
                        '</div>',
                        '<div style="padding:16px 24px;border-top:1px solid #e2e8f0;display:flex;justify-content:flex-end;gap:12px;background:#f8fafc;border-radius:0 0 12px 12px;">',
                        '<button class="adm-btn" data-action="close_cat_modal" style="background:#fff;border:1px solid #dddddd;color:#334155;">Cancel</button>',
                        '<button class="adm-btn adm-btn-primary" data-action="save_cat">Save Category</button>',
                        '</div></div></div>'
                    );
                }
            }

            container.innerHTML = html.join('');
            bindEvents();
        }

        function bindEvents() {
            container.querySelector('[data-action="tab_posts"]')?.addEventListener('click', () => {
                activeTab = 'posts'; isModalOpen = false; renderCMS();
            });
            container.querySelector('[data-action="tab_categories"]')?.addEventListener('click', () => {
                activeTab = 'categories'; isCatModalOpen = false; renderCMS();
            });

            if (activeTab === 'posts') {
                container.querySelector('[data-action="new_post"]')?.addEventListener('click', () => {
                    editingPostId = null; faqItems = []; formState = {};
                    initFormState(null); isModalOpen = true; modalTab = 'basic'; renderCMS();
                });
                container.querySelectorAll('[data-action="edit_post"]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const pid = btn.dataset.postId;
                        editingPostId = pid;
                        const post = getBlogs().find(b => String(b.post_id || b.id) === String(pid));
                        faqItems = []; formState = {};
                        initFormState(post);
                        isModalOpen = true; modalTab = 'basic'; renderCMS();
                    });
                });
                container.querySelectorAll('[data-action="delete_post"]').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const pid = btn.dataset.postId;
                        if (pid && confirm('Delete this post? This cannot be undone.')) {
                            db.posts.delete(pid); showToast('Post deleted.'); renderCMS();
                        }
                    });
                });
                if (isModalOpen) bindModalEvents();
            } else {
                bindCatEvents();
            }
        }

        function bindModalEvents() {
            const tabOrder = ['basic', 'seo', 'content', 'social', 'cta', 'advanced'];

            // Tab switching via tab bar
            container.querySelectorAll('[data-modal-tab]').forEach(btn => {
                btn.addEventListener('click', () => {
                    captureFormState();
                    modalTab = btn.dataset.modalTab;
                    renderCMS();
                });
            });

            // Next button
            container.querySelector('[data-action="tab_next"]')?.addEventListener('click', () => {
                captureFormState();
                const idx = tabOrder.indexOf(modalTab);
                if (idx < tabOrder.length - 1) { modalTab = tabOrder[idx + 1]; renderCMS(); }
            });

            // Back button
            container.querySelector('[data-action="tab_prev"]')?.addEventListener('click', () => {
                captureFormState();
                const idx = tabOrder.indexOf(modalTab);
                if (idx > 0) { modalTab = tabOrder[idx - 1]; renderCMS(); }
            });

            // Close
            container.querySelectorAll('[data-action="close_modal"]').forEach(btn => {
                btn.addEventListener('click', () => { isModalOpen = false; formState = {}; faqItems = []; renderCMS(); });
            });

            // Image upload
            container.querySelector('#cms-img-file')?.addEventListener('change', async e => {
                const file = e.target.files[0];
                if (!file) return;
                
                const pt = container.querySelector('#cms-img-text');
                if (pt) pt.innerHTML = '<i class="fas fa-spinner fa-spin"></i><br>Uploading...';

                const updatePreview = (url) => {
                    formState.image = url;
                    const hi = container.querySelector('#cms-img');
                    const pc = container.querySelector('#cms-img-preview-container');
                    const pi = container.querySelector('#cms-img-preview');
                    if (hi) hi.value = url;
                    if (pc && pi && pt) { 
                        pi.src = url; 
                        pc.style.display = 'block'; 
                        pt.style.display = 'none'; 
                    }
                };

                try {
                    const imageUrl = await uploadImage(file, 'blog-post.jpg');
                    updatePreview(imageUrl);
                    showToast('Blog image uploaded.');
                } catch (err) {
                    console.warn('[ADMIN] Server upload failed, falling back to Base64:', err);
                    
                    // Fallback to Base64
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                        const base64Url = ev.target.result;
                        updatePreview(base64Url);
                        showToast('Note: Uploaded as local image (Server unavailable)', 'info');
                    };
                    reader.readAsDataURL(file);
                }
            });

            // Auto-slug from title
            container.querySelector('#cms-title')?.addEventListener('input', e => {
                formState.title = e.target.value;
                if (!editingPostId) {
                    const slugEl = container.querySelector('#cms-slug');
                    if (slugEl) { slugEl.value = toSlug(e.target.value); formState.slug = slugEl.value; }
                }
                updateSeoPreview();
                triggerAutoSave();
            });
            container.querySelector('#cms-slug')?.addEventListener('input', e => {
                formState.slug = e.target.value; updateSeoPreview();
            });

            // Character counters
            [['cms-excerpt', 160], ['cms-seo-title', 60], ['cms-seo-desc', 160]].forEach(([id, max]) => {
                const el      = container.querySelector('#' + id);
                const counter = container.querySelector('#' + id + '-counter');
                if (!el || !counter) return;
                const update = () => {
                    const len = el.value.length;
                    counter.textContent = len + ' / ' + max + ' characters';
                    counter.style.color = len > max * 0.9 ? '#ef4444' : '#94a3b8';
                };
                update();
                el.addEventListener('input', update);
            });

            // Live SEO preview
            container.querySelector('#cms-seo-title')?.addEventListener('input', () => updateSeoPreview());
            container.querySelector('#cms-seo-desc')?.addEventListener('input',  () => updateSeoPreview());

            // Visual Editor Logic
            const editorEl = container.querySelector('#cms-content-editor');
            const hiddenEl = container.querySelector('#cms-content-hidden');
            const rtBadge  = container.querySelector('#cms-readtime');

            if (editorEl && hiddenEl) {
                editorEl.addEventListener('input', () => {
                    const html = editorEl.innerHTML;
                    formState.content = html;
                    hiddenEl.value = html;
                    if (rtBadge) rtBadge.textContent = calcReadTime(editorEl.innerText);
                    triggerAutoSave();
                });

                // Handle toolbar buttons
                container.querySelectorAll('.rte-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const cmd = btn.dataset.cmd;
                        const val = btn.dataset.val || null;
                        
                        if (cmd === 'formatBlock' && val) {
                            document.execCommand(cmd, false, val);
                        } else {
                            document.execCommand(cmd, false, val);
                        }
                        
                        editorEl.focus();
                        editorEl.dispatchEvent(new Event('input'));
                    });
                });
            }

            // FAQ: add / remove
            container.querySelector('[data-action="add_faq"]')?.addEventListener('click', () => {
                captureFormState(); faqItems.push({ q: '', a: '' }); renderCMS();
            });
            container.querySelectorAll('[data-action="remove_faq"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    captureFormState();
                    faqItems.splice(parseInt(btn.dataset.faqIdx), 1);
                    renderCMS();
                });
            });

            // Save Draft
            container.querySelectorAll('[data-action="save_draft_post"]').forEach(btn => {
                btn.addEventListener('click', () => { captureFormState(); savePost('draft'); });
            });
            // Publish
            container.querySelectorAll('[data-action="publish_post"]').forEach(btn => {
                btn.addEventListener('click', () => { captureFormState(); savePost('published'); });
            });

            // Preview
            container.querySelectorAll('[data-action="open_preview"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    captureFormState();
                    openPreviewModal();
                });
            });
        }

        function updateSeoPreview() {
            const t = container.querySelector('#cms-seo-title')?.value || formState.title || '';
            const d = container.querySelector('#cms-seo-desc')?.value  || formState.excerpt || '';
            const s = container.querySelector('#cms-slug')?.value      || formState.slug || '';
            const pt = container.querySelector('#seo-preview-title');
            const pd = container.querySelector('#seo-preview-desc');
            const ps = container.querySelector('#seo-preview-slug');
            if (pt) pt.textContent = t.slice(0, 60) || 'Meta Title';
            if (pd) pd.textContent = d.slice(0, 160) || 'Meta description will appear here...';
            if (ps) ps.textContent = s || 'url-friendly-title';
        }

        function triggerAutoSave() {
            clearTimeout(autoSaveTimer);
            const badge = container.querySelector('#cms-autosave-badge');
            if (badge) badge.textContent = 'Saving...';
            autoSaveTimer = setTimeout(() => {
                captureFormState();
                try { localStorage.setItem(autoSaveKey, JSON.stringify({ formState, faqItems, editingPostId, ts: Date.now() })); } catch (_) {}
                if (badge) { badge.textContent = 'Saved'; setTimeout(() => { if (badge) badge.textContent = ''; }, 2000); }
            }, 1500);
        }

        function savePost(status) {
            try {
                const title = (formState.title || '').trim();
                const slug  = (formState.slug  || '').trim();
                if (!title)              { alert('Title is required.'); return; }
                if (!slug)               { alert('Slug is required.'); return; }
                if (!formState.content?.trim()) { alert('Content is required (go to the Content tab).'); return; }

                const authorName = (formState.author || 'Admin').trim();
                const postData = {
                    title, slug, status,
                    category:       formState.category || '',
                    excerpt:        formState.excerpt  || '',
                    content:        formState.content  || '',
                    seoTitle:       formState.seoTitle || '',
                    seoDescription: formState.seoDesc  || '',
                    focusKeyword:   formState.focusKeyword || '',
                    canonicalUrl:   formState.canonicalUrl || '',
                    metaRobots:     formState.metaRobots   || 'index,follow',
                    ogTitle:        formState.ogTitle || formState.seoTitle || '',
                    ogDescription:  formState.ogDesc  || formState.seoDesc  || '',
                    ogImage:        formState.ogImage || formState.image || '',
                    image:          formState.image || '',
                    featured_image: formState.image || '',
                    imgAlt:         formState.imgAlt     || '',
                    imgTitle:       formState.imgTitle   || '',
                    imgCaption:     formState.imgCaption || '',
                    tocEnabled:     formState.tocEnabled || false,
                    faqs:           faqItems.filter(f => f.q || f.a),
                    ctaHeading:     formState.ctaHeading  || '',
                    ctaText:        formState.ctaText     || '',
                    ctaBtnText:     formState.ctaBtnText  || '',
                    ctaBtnLink:     formState.ctaBtnLink  || '',
                    ctaPosition:    formState.ctaPosition || 'bottom',
                    schemaType:     formState.schemaType  || 'BlogPosting',
                    schemaText:     formState.schemaJson  || '',
                    redirectFrom:   formState.redirectFrom || '',
                    redirectTo:     formState.redirectTo   || '',
                    tags: (formState.tags || '').split(',').map(t => t.trim()).filter(Boolean),
                    is_published: status === 'published',
                    readTime:       calcReadTime(formState.content || ''),
                    publishDate:    formState.publishDate || new Date().toISOString(),
                };

                if (editingPostId) {
                    const existing = db.posts.findOne(p => String(p.post_id || p.id) === String(editingPostId));
                    if (existing) {
                        db.posts.update(existing.post_id || existing.id, {
                            ...existing, ...postData,
                            date: existing.date,
                            author: { ...existing.author, name: authorName || existing.author?.name || 'Admin' },
                        });
                        showToast('Post updated.');
                    } else { alert('Post not found.'); return; }
                } else {
                    db.posts.create({
                        ...postData,
                        author: { name: authorName, avatar: 'https://ui-avatars.com/api/?name=' + encodeURIComponent(authorName) + '&background=6366f1&color=fff', bio: 'Contributing writer at RoommateGroups.' },
                        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                        published_date: new Date().toISOString(),
                    });
                    showToast(status === 'published' ? 'Post published!' : 'Draft saved.');
                }

                try { localStorage.removeItem(autoSaveKey); } catch (_) {}
                isModalOpen = false; editingPostId = null; formState = {}; faqItems = [];
                renderCMS();
            } catch (err) { alert('Error saving post: ' + err.message); }
        }

        function bindCatEvents() {
            container.querySelector('[data-action="new_cat"]')?.addEventListener('click', () => {
                editingCatId = null; isCatModalOpen = true; renderCMS();
            });
            container.querySelectorAll('[data-action="edit_cat"]').forEach(btn => {
                btn.addEventListener('click', () => { editingCatId = btn.dataset.catId; isCatModalOpen = true; renderCMS(); });
            });
            container.querySelectorAll('[data-action="delete_cat"]').forEach(btn => {
                btn.addEventListener('click', () => {
                    const cid = btn.dataset.catId;
                    if (!cid || btn.disabled) return;
                    if (confirm('Delete this category?')) { db.categories.delete(cid); showToast('Category deleted.'); renderCMS(); }
                });
            });
            container.querySelectorAll('[data-action="close_cat_modal"]').forEach(btn => {
                btn.addEventListener('click', () => { isCatModalOpen = false; renderCMS(); });
            });
            container.querySelector('#cat-color')?.addEventListener('input', e => {
                const txt = container.querySelector('#cat-color-text');
                if (txt) txt.value = e.target.value;
            });
            container.querySelector('#cat-color-text')?.addEventListener('input', e => {
                const picker = container.querySelector('#cat-color');
                if (picker && /^#[0-9a-fA-F]{6}$/.test(e.target.value)) picker.value = e.target.value;
            });
            container.querySelector('#cat-name')?.addEventListener('input', e => {
                const slugEl = container.querySelector('#cat-slug');
                if (slugEl && !editingCatId) slugEl.value = toSlug(e.target.value);
            });
            container.querySelector('[data-action="save_cat"]')?.addEventListener('click', () => {
                const name = container.querySelector('#cat-name')?.value.trim();
                const slug = container.querySelector('#cat-slug')?.value.trim();
                if (!name || !slug) { alert('Name and Slug are required.'); return; }
                const description = container.querySelector('#cat-desc')?.value.trim();
                const color = container.querySelector('#cat-color-text')?.value.trim() || '#1a1a1a';
                if (editingCatId) {
                    const existing = db.categories.findOne(c => String(c.category_id) === String(editingCatId));
                    if (existing) { db.categories.update(existing.category_id, { ...existing, name, slug, description, color }); showToast('Category updated.'); }
                } else {
                    db.categories.create({ name, slug, description, color });
                    showToast('Category created.');
                }
                isCatModalOpen = false; editingCatId = null; renderCMS();
            });
        }

        renderCMS();

    } catch (err) {
        console.error('Error in renderAdminContent:', err);
        container.innerHTML = [
            '<div class="adm-section-header"><h2>Content & Blog Management</h2></div>',
            '<div class="adm-empty">',
            '<i class="fa-solid fa-triangle-exclamation" style="color:var(--danger);"></i>',
            '<h3>Error Loading Content</h3>',
            '<p>' + escHtml(err.message) + '</p>',
            '</div>'
        ].join('');
    }
}

// ─────────────────────────────────────────────────────────────
// Placeholder
// ─────────────────────────────────────────────────────────────

function renderAdminPlaceholder(container, title) {
    container.innerHTML = [
        '<div class="adm-section-header"><h2>' + escHtml(title) + '</h2></div>',
        '<div class="adm-empty">',
        '<i class="fa-solid fa-hammer"></i>',
        '<h3>' + escHtml(title) + ' — Coming Soon</h3>',
        '<p>This section is under construction. Check back soon!</p>',
        '</div>'
    ].join('');
}

// ─────────────────────────────────────────────────────────────
// User Queries
// ─────────────────────────────────────────────────────────────

function renderAdminQueries(container) {
    const TOPIC_LABELS = {
        account: 'Account & Login', listing: 'Listing Help', safety: 'Safety & Scam Report',
        billing: 'Billing & Subscription', verification: 'Verification Issues',
        partnership: 'Partnership / Press', other: 'Other',
    };

    function formatDate(iso) {
        if (!iso) return '—';
        const d = new Date(iso);
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) +
            ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }

    function statusBadge(q) {
        if (q.status === 'replied') return '<span style="background:#d1fae5;color:#065f46;padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;">Replied</span>';
        if (!q.is_read) return '<span style="background:#fee2e2;color:#991b1b;padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;">New</span>';
        return '<span style="background:#f1f5f9;color:#475569;padding:3px 10px;border-radius:20px;font-size:0.75rem;font-weight:700;">Read</span>';
    }

    function exportCSV(queries) {
        const headers = ['First Name', 'Last Name', 'Email', 'Topic', 'Message', 'Date', 'Status', 'Reply'];
        const rows = queries.map(q => [
            q.first_name, q.last_name, q.email,
            q.topic_label || q.topic,
            q.message,
            formatDate(q.created_at),
            q.status === 'replied' ? 'Replied' : (q.is_read ? 'Read' : 'New'),
            q.reply || '',
        ].map(v => '"' + String(v || '').replace(/"/g, '""') + '"'));
        const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'user-queries-' + new Date().toISOString().slice(0, 10) + '.csv';
        a.click();
        URL.revokeObjectURL(url);
    }

    function renderTable(queries) {
        const tbl = container.querySelector('#queries-table-body');
        if (!tbl) return;
        if (queries.length === 0) {
            tbl.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:40px;color:#94a3b8;"><i class="fa-solid fa-inbox" style="font-size:1.5rem;display:block;margin-bottom:8px;"></i>No queries found.</td></tr>';
            return;
        }
        tbl.innerHTML = queries.map(q => [
            '<tr style="' + (!q.is_read && q.status !== 'replied' ? 'background:#fffbeb;' : '') + '">',
            '<td style="padding:12px 14px;"><div style="font-weight:600;color:#1e293b;">' + escHtml(q.first_name + ' ' + q.last_name) + '</div></td>',
            '<td style="padding:12px 14px;color:#64748b;font-size:0.9rem;">' + escHtml(q.email) + '</td>',
            '<td style="padding:12px 14px;"><span style="background:#f1f5f9;color:#334155;padding:2px 8px;border-radius:6px;font-size:0.8rem;">' + escHtml(q.topic_label || q.topic) + '</span></td>',
            '<td style="padding:12px 14px;max-width:260px;"><div style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#475569;font-size:0.9rem;" title="' + escHtml(q.message) + '">' + escHtml(q.message) + '</div></td>',
            '<td style="padding:12px 14px;color:#64748b;font-size:0.85rem;white-space:nowrap;">' + formatDate(q.created_at) + '</td>',
            '<td style="padding:12px 14px;">' + statusBadge(q) + '</td>',
            '<td style="padding:12px 14px;">',
            '<div style="display:flex;gap:6px;">',
            q.status !== 'replied' ? '<button class="qry-reply-btn adm-btn-sm" data-id="' + q.query_id + '" style="background:#1a1a1a;color:white;border:none;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:0.8rem;"><i class="fa-solid fa-reply"></i> Reply</button>' : '<button class="qry-view-reply-btn adm-btn-sm" data-id="' + q.query_id + '" style="background:#e2e8f0;color:#334155;border:none;padding:5px 12px;border-radius:6px;cursor:pointer;font-size:0.8rem;"><i class="fa-solid fa-eye"></i> View</button>',
            !q.is_read ? '<button class="qry-read-btn" data-id="' + q.query_id + '" style="background:transparent;border:1px solid #cbd5e1;color:#64748b;padding:5px 10px;border-radius:6px;cursor:pointer;font-size:0.8rem;" title="Mark as read"><i class="fa-solid fa-envelope-open"></i></button>' : '',
            '</div>',
            '</td>',
            '</tr>',
        ].join('')).join('');

        // Reply buttons
        tbl.querySelectorAll('.qry-reply-btn').forEach(btn => {
            btn.addEventListener('click', () => openReplyModal(btn.dataset.id));
        });
        tbl.querySelectorAll('.qry-view-reply-btn').forEach(btn => {
            btn.addEventListener('click', () => openReplyModal(btn.dataset.id, true));
        });
        tbl.querySelectorAll('.qry-read-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                db.user_queries.update(btn.dataset.id, { is_read: true });
                applyFilters();
            });
        });
    }

    function openReplyModal(queryId, viewOnly = false) {
        const q = db.user_queries.findById(queryId);
        if (!q) return;
        // Mark as read when opened
        if (!q.is_read) db.user_queries.update(queryId, { is_read: true });

        const modal = document.getElementById('qry-modal');
        document.getElementById('qry-modal-name').textContent = q.first_name + ' ' + q.last_name;
        document.getElementById('qry-modal-email').textContent = q.email;
        document.getElementById('qry-modal-topic').textContent = q.topic_label || q.topic;
        document.getElementById('qry-modal-date').textContent = formatDate(q.created_at);
        document.getElementById('qry-modal-message').textContent = q.message;
        document.getElementById('qry-modal-id').value = queryId;

        const replyArea = document.getElementById('qry-reply-text');
        const sendBtn = document.getElementById('qry-send-btn');
        const prevReply = document.getElementById('qry-prev-reply');

        if (q.reply) {
            prevReply.style.display = 'block';
            prevReply.querySelector('.qry-prev-reply-text').textContent = q.reply;
            prevReply.querySelector('.qry-prev-reply-date').textContent = 'Sent: ' + formatDate(q.replied_at);
        } else {
            prevReply.style.display = 'none';
        }

        if (viewOnly) {
            replyArea.style.display = 'none';
            sendBtn.style.display = 'none';
        } else {
            replyArea.style.display = 'block';
            sendBtn.style.display = 'block';
            replyArea.value = '';
        }

        modal.style.display = 'flex';
    }

    function applyFilters() {
        const search = (container.querySelector('#qry-search')?.value || '').toLowerCase();
        const topicFilter = container.querySelector('#qry-filter-topic')?.value || '';
        const dateFilter = container.querySelector('#qry-filter-date')?.value || '';
        const statusFilter = container.querySelector('#qry-filter-status')?.value || '';

        let queries = db.user_queries.findAll().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        if (search) {
            queries = queries.filter(q =>
                (q.first_name + ' ' + q.last_name).toLowerCase().includes(search) ||
                q.email.toLowerCase().includes(search) ||
                q.message.toLowerCase().includes(search)
            );
        }
        if (topicFilter) queries = queries.filter(q => q.topic === topicFilter);
        if (statusFilter === 'new') queries = queries.filter(q => !q.is_read && q.status !== 'replied');
        if (statusFilter === 'read') queries = queries.filter(q => q.is_read && q.status !== 'replied');
        if (statusFilter === 'replied') queries = queries.filter(q => q.status === 'replied');
        if (dateFilter) {
            const now = new Date();
            queries = queries.filter(q => {
                const d = new Date(q.created_at);
                if (dateFilter === 'today') return d.toDateString() === now.toDateString();
                if (dateFilter === 'week') return (now - d) <= 7 * 864e5;
                if (dateFilter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                if (dateFilter === 'year') return d.getFullYear() === now.getFullYear();
                return true;
            });
        }

        renderTable(queries);
        container.querySelector('#qry-count').textContent = queries.length + ' quer' + (queries.length === 1 ? 'y' : 'ies');
        return queries;
    }

    const allQueries = db.user_queries.findAll();
    const totalNew = allQueries.filter(q => !q.is_read).length;

    container.innerHTML = [
        '<style>',
        '.qry-toolbar{display:flex;gap:10px;flex-wrap:wrap;align-items:center;margin-bottom:20px;}',
        '.qry-toolbar input,.qry-toolbar select{padding:8px 12px;border:1.5px solid #e2e8f0;border-radius:8px;font-size:0.875rem;outline:none;background:white;}',
        '.qry-toolbar input:focus,.qry-toolbar select:focus{border-color:#1a1a1a;}',
        '.qry-table-wrap{overflow-x:auto;border-radius:12px;border:1px solid #e2e8f0;}',
        '.qry-table{width:100%;border-collapse:collapse;font-size:0.875rem;}',
        '.qry-table thead th{background:#f8fafc;padding:10px 14px;text-align:left;font-weight:700;color:#475569;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.04em;border-bottom:1px solid #e2e8f0;}',
        '.qry-table tbody tr{border-bottom:1px solid #f1f5f9;}',
        '.qry-table tbody tr:hover{background:#f8fafc;}',
        '.qry-modal{display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);z-index:9999;align-items:center;justify-content:center;padding:20px;}',
        '.qry-modal-box{background:white;border-radius:16px;padding:32px;max-width:560px;width:100%;max-height:90vh;overflow-y:auto;}',
        '.qry-modal-field{margin-bottom:14px;}',
        '.qry-modal-field label{font-size:0.78rem;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:0.05em;display:block;margin-bottom:4px;}',
        '.qry-modal-field .val{color:#1e293b;font-size:0.95rem;}',
        '.qry-msg-box{background:#f8fafc;border-radius:10px;padding:14px;color:#334155;font-size:0.9rem;line-height:1.6;white-space:pre-wrap;margin-bottom:16px;}',
        '.qry-reply-textarea{width:100%;padding:12px;border:1.5px solid #e2e8f0;border-radius:10px;font-size:0.9rem;font-family:inherit;resize:vertical;min-height:100px;outline:none;box-sizing:border-box;}',
        '.qry-reply-textarea:focus{border-color:#1a1a1a;}',
        '</style>',

        // Page header
        '<div class="adm-section-header" style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">',
        '<div>',
        '<h2>User Queries</h2>',
        totalNew > 0 ? '<p style="color:#64748b;font-size:0.9rem;margin-top:4px;">' + totalNew + ' unread quer' + (totalNew === 1 ? 'y' : 'ies') + ' awaiting review.</p>' : '',
        '</div>',
        '<button id="qry-export-btn" style="background:#1a1a1a;color:white;border:none;padding:9px 18px;border-radius:8px;cursor:pointer;font-size:0.875rem;font-weight:600;"><i class="fa-solid fa-download"></i> Export CSV</button>',
        '</div>',

        // Toolbar
        '<div class="qry-toolbar">',
        '<input type="text" id="qry-search" placeholder="Search name, email, message..." style="flex:1;min-width:200px;">',
        '<select id="qry-filter-topic">',
        '<option value="">All Topics</option>',
        Object.entries(TOPIC_LABELS).map(([v, l]) => '<option value="' + v + '">' + l + '</option>').join(''),
        '</select>',
        '<select id="qry-filter-date">',
        '<option value="">All Dates</option>',
        '<option value="today">Today</option>',
        '<option value="week">This Week</option>',
        '<option value="month">This Month</option>',
        '<option value="year">This Year</option>',
        '</select>',
        '<select id="qry-filter-status">',
        '<option value="">All Status</option>',
        '<option value="new">New</option>',
        '<option value="read">Read</option>',
        '<option value="replied">Replied</option>',
        '</select>',
        '<span id="qry-count" style="color:#64748b;font-size:0.85rem;white-space:nowrap;"></span>',
        '</div>',

        // Table
        '<div class="qry-table-wrap">',
        '<table class="qry-table">',
        '<thead><tr>',
        '<th>Name</th><th>Email</th><th>Topic</th><th>Message</th><th>Date</th><th>Status</th><th>Actions</th>',
        '</tr></thead>',
        '<tbody id="queries-table-body"></tbody>',
        '</table>',
        '</div>',

        // Reply Modal
        '<div class="qry-modal" id="qry-modal">',
        '<div class="qry-modal-box">',
        '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;">',
        '<h3 style="font-size:1.1rem;font-weight:800;color:#1e293b;">Query Details</h3>',
        '<button id="qry-modal-close" style="background:none;border:none;font-size:1.3rem;cursor:pointer;color:#64748b;">✕</button>',
        '</div>',
        '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px;">',
        '<div class="qry-modal-field"><label>From</label><div class="val" id="qry-modal-name"></div></div>',
        '<div class="qry-modal-field"><label>Email</label><div class="val" id="qry-modal-email"></div></div>',
        '<div class="qry-modal-field"><label>Topic</label><div class="val" id="qry-modal-topic"></div></div>',
        '<div class="qry-modal-field"><label>Date</label><div class="val" id="qry-modal-date"></div></div>',
        '</div>',
        '<div class="qry-modal-field"><label>Message</label><div class="qry-msg-box" id="qry-modal-message"></div></div>',
        '<div id="qry-prev-reply" style="display:none;background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:14px;margin-bottom:14px;">',
        '<div style="font-size:0.78rem;font-weight:700;color:#065f46;margin-bottom:6px;"><i class="fa-solid fa-check-circle"></i> Reply Sent</div>',
        '<div class="qry-prev-reply-text" style="color:#166534;font-size:0.9rem;white-space:pre-wrap;"></div>',
        '<div class="qry-prev-reply-date" style="font-size:0.78rem;color:#64748b;margin-top:6px;"></div>',
        '</div>',
        '<div class="qry-modal-field">',
        '<label>Reply Message</label>',
        '<textarea id="qry-reply-text" class="qry-reply-textarea" placeholder="Write your reply here..."></textarea>',
        '</div>',
        '<input type="hidden" id="qry-modal-id">',
        '<div style="display:flex;gap:10px;justify-content:flex-end;margin-top:16px;">',
        '<button id="qry-cancel-btn" style="background:#f1f5f9;color:#475569;border:none;padding:9px 18px;border-radius:8px;cursor:pointer;font-weight:600;">Cancel</button>',
        '<button id="qry-send-btn" style="background:#1a1a1a;color:white;border:none;padding:9px 20px;border-radius:8px;cursor:pointer;font-weight:700;"><i class="fa-solid fa-paper-plane"></i> Send Reply</button>',
        '</div>',
        '</div>',
        '</div>',
    ].join('');

    // Initial render
    applyFilters();

    // Filter/search listeners
    container.querySelector('#qry-search')?.addEventListener('input', applyFilters);
    container.querySelector('#qry-filter-topic')?.addEventListener('change', applyFilters);
    container.querySelector('#qry-filter-date')?.addEventListener('change', applyFilters);
    container.querySelector('#qry-filter-status')?.addEventListener('change', applyFilters);

    // CSV export
    container.querySelector('#qry-export-btn')?.addEventListener('click', () => {
        const queries = db.user_queries.findAll().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        exportCSV(queries);
    });

    // Modal close
    const modal = container.querySelector('#qry-modal');
    container.querySelector('#qry-modal-close')?.addEventListener('click', () => { modal.style.display = 'none'; applyFilters(); });
    container.querySelector('#qry-cancel-btn')?.addEventListener('click', () => { modal.style.display = 'none'; applyFilters(); });
    modal?.addEventListener('click', (e) => { if (e.target === modal) { modal.style.display = 'none'; applyFilters(); } });

    // Send reply
    container.querySelector('#qry-send-btn')?.addEventListener('click', async () => {
        const queryId = document.getElementById('qry-modal-id').value;
        const replyText = document.getElementById('qry-reply-text').value.trim();
        if (!replyText) { showToast('Please write a reply message.', 'error'); return; }

        await db.user_queries.update(queryId, {
            status: 'replied',
            is_read: true,
            reply: replyText,
            replied_at: new Date().toISOString(),
        });

        const q = db.user_queries.findById(queryId);

        // If user was logged in when sending the query, notify them
        if (q && q.user_id) {
            await db.notifications.create({
                user_id: q.user_id,
                title: 'New Support Reply',
                description: replyText,
                type: 'support_reply',
                is_read: false,
                website_url: '/dashboard/notifications' // Or a specific query view if it existed
            });
        }

        // Simulate email send via mailto
        const subject = encodeURIComponent('Re: Your query – ' + (q?.topic_label || q?.topic || 'Support'));
        const emailBody = encodeURIComponent(replyText);
        window.location.href = 'mailto:' + (q?.email || '') + '?subject=' + subject + '&body=' + emailBody;

        modal.style.display = 'none';
        applyFilters();
        showToast('Reply sent and query marked as Replied.');
        logAdminAction(user.id, 'Replied to query', 'Query from ' + (q?.first_name || '') + ' ' + (q?.last_name || '') + ' — ' + (q?.email || ''));
    });
}

// ─────────────────────────────────────────────────────────────
// Image Gallery Management
// ─────────────────────────────────────────────────────────────

function renderAdminImages(container) {
    const admin = getCurrentUser();
    let filterType = '';

    function getImages() {
        return db.images.findAll().filter(img => {
            return !filterType || (img.type && typeof img.type === 'string' && img.type.startsWith(filterType));
        }).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    function renderContent() {
        const images = getImages();
        const types = [...new Set(db.images.findAll().map(img => img.type ? img.type.split('/')[0] : null).filter(Boolean))];

        container.innerHTML = [
            '<div class="adm-section-header">',
            '<h2>Image Assets</h2>',
            '<span class="adm-count-badge">' + images.length + ' images</span>',
            '<label class="adm-btn adm-btn-primary" style="margin-left:auto;cursor:pointer;display:inline-flex;align-items:center;gap:6px;">',
            '<i class="fa-solid fa-cloud-arrow-up"></i> Upload New Image',
            '<input type="file" id="adm-image-upload" style="display:none;" accept="image/*">',
            '</label>',
            '</div>',
            
            '<div class="adm-filters">',
            '<div class="adm-search-wrap"><i class="fa-solid fa-filter"></i>',
            '<select id="adm-img-type-filter" class="adm-select" style="border:none;background:transparent;width:100%;outline:none;">',
            '<option value="">All File Types</option>',
            types.map(t => '<option value="' + t + '"' + (filterType === t ? ' selected' : '') + '>' + t.toUpperCase() + '</option>').join(''),
            '</select>',
            '</div>',
            '<button class="adm-btn" id="adm-refresh-imgs"><i class="fa-solid fa-rotate"></i> Refresh</button>',
            '</div>',

            '<div class="adm-image-grid" id="adm-image-grid">',
            images.length === 0 ? [
                '<div class="adm-empty" style="grid-column: 1/-1; padding: 4rem;">',
                '<i class="fa-solid fa-images"></i>',
                '<p>No images uploaded yet. Use the button above to upload your first asset.</p>',
                '</div>'
            ].join('') : images.map(img => [
                '<div class="adm-image-card">',
                '<div class="adm-img-preview-wrap">',
                '<img src="' + img.url + '" alt="' + escHtml(img.filename) + '" loading="lazy">',
                '<div class="adm-img-overlay">',
                '<button class="adm-img-btn" data-action="copy" data-url="' + img.url + '" title="Copy URL"><i class="fa-solid fa-link"></i></button>',
                '<button class="adm-img-btn adm-img-btn-danger" data-action="delete" data-id="' + img.image_id + '" title="Delete Image"><i class="fa-solid fa-trash"></i></button>',
                '</div>',
                '</div>',
                '<div class="adm-img-info">',
                '<div class="adm-img-name" title="' + escHtml(img.filename) + '">' + escHtml(img.filename) + '</div>',
                '<div class="adm-img-meta">',
                '<span>' + (img.size ? (img.size / 1024).toFixed(1) : '—') + ' KB</span>',
                '<span>' + relTime(img.created_at) + '</span>',
                '</div>',
                '</div>',
                '</div>'
            ].join('')).join(''),
            '</div>'
        ].join('');

        // Event Listeners
        container.querySelector('#adm-image-upload')?.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            showToast('Uploading image...', 'info');
            try {
                await uploadImage(file, file.name);
                showToast('Image uploaded and recorded!');
                renderContent();
            } catch (err) {
                showToast('Upload failed: ' + err.message, 'error');
            }
        });

        container.querySelector('#adm-img-type-filter')?.addEventListener('change', (e) => {
            filterType = e.target.value;
            renderContent();
        });

        container.querySelector('#adm-refresh-imgs')?.addEventListener('click', renderContent);

        container.querySelectorAll('[data-action="copy"]').forEach(btn => {
            btn.addEventListener('click', () => {
                const fullUrl = window.location.origin + btn.dataset.url;
                navigator.clipboard.writeText(fullUrl);
                showToast('URL copied to clipboard!');
            });
        });

        container.querySelectorAll('[data-action="delete"]').forEach(btn => {
            btn.addEventListener('click', () => {
                if (!confirm('Remove this image reference? (The file stays on the server, but the record is removed from this gallery).')) return;
                db.images.delete(btn.dataset.id);
                showToast('Image record removed.');
                renderContent();
            });
        });
    }

    renderContent();
}
