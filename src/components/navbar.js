import { getCurrentUser, isAdmin } from '../services/auth.js';
import { navigate } from '../router.js';
import { getTotalUnread } from '../services/messaging.js';
import { db } from '../services/db.js';

export function getNavAuthButtons() {
    const user = getCurrentUser();
    if (user) {
        const fullName = user.fullName || user.display_name || 'User';
        const initials = fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const profilePhoto = user.profile_photo || user.profilePhoto || '';
        const adminBtn = isAdmin()
            ? `<a href="/admin" class="btn btn-outline" style="display:inline-flex;align-items:center;gap:6px;"><i class="fa-solid fa-shield-halved"></i> Admin</a>`
            : '';
        return `
            ${adminBtn}
            <a href="/dashboard/notifications" class="nav-msg-btn" id="nav-notif-btn" title="Notifications" aria-label="Notifications">
                <i class="fa-solid fa-bell"></i>
                <span class="nav-msg-badge" id="nav-notif-badge" style="display:none;"></span>
            </a>
            <a href="/dashboard/messages" class="nav-msg-btn" id="nav-msg-btn" title="Messages" aria-label="Messages">
                <i class="fa-solid fa-message"></i>
                <span class="nav-msg-badge" id="nav-msg-badge" style="display:none;"></span>
            </a>
            <a href="/dashboard" class="user-avatar-nav" style="background: linear-gradient(135deg, var(--primary), var(--primary-light));">
                ${profilePhoto ? `<img src="${profilePhoto}" alt="${fullName}" />` : initials}
            </a>
        `;
    }
    return `
        <a href="/auth/register" class="btn btn-outline">List Your Room</a>
        <a href="/auth/login" class="btn btn-primary">Sign In</a>
    `;
}

export function renderAdminBar() {
    if (!isAdmin()) return '';
    return `
    <div class="admin-preview-bar" id="admin-preview-bar">
        <span><i class="fa-solid fa-eye"></i> Previewing as Admin</span>
        <div class="admin-preview-bar-actions">
            <a href="/admin" class="admin-bar-btn"><i class="fa-solid fa-shield-halved"></i> Admin Panel</a>
            <button class="admin-bar-close" id="admin-bar-close" title="Dismiss"><i class="fa-solid fa-xmark"></i></button>
        </div>
    </div>
    `;
}

export function renderNavbar() {
    const path = window.location.pathname;
    const isHome = path === '/' || path === '';

    return `
    ${renderAdminBar()}
    <nav class="navbar" id="navbar">
      <div class="nav-container">
        <a href="/" class="nav-logo">
          <span class="logo-badge">
            <span class="logo-badge-left">Roommate</span><span class="logo-badge-right">Groups</span>
          </span>
        </a>
        ${isHome ? `
        <div class="nav-links" id="nav-links">
          <a href="#cities">Cities</a>
          <a href="#how-it-works">How It Works</a>
          <a href="#listings">Listings</a>
          <a href="/blog">Blog</a>
          <a href="/fb-groups" style="display:inline-flex;align-items:center;gap:5px;"><i class="fab fa-facebook" style="color:#1877f2;"></i> FB Groups</a>
        </div>` : '<div class="nav-links" id="nav-links"></div>'}
        <div class="nav-cta" id="nav-cta">
          ${getNavAuthButtons()}
        </div>
        <button class="hamburger" id="hamburger" aria-label="Toggle menu">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>
    </nav>
    `;
}

function initNavbarBadge() {
    const user = getCurrentUser();
    if (!user) return;

    // Clear any pre-existing poll to avoid duplicates on re-render
    if (window._navBadgeInterval) {
        clearInterval(window._navBadgeInterval);
        window._navBadgeInterval = null;
    }

    function updateBadge() {
        const badge = document.getElementById('nav-msg-badge');
        const notifBadge = document.getElementById('nav-notif-badge');

        // Stop polling only when neither badge exists (user navigated away from nav)
        if (!badge && !notifBadge) {
            clearInterval(window._navBadgeInterval);
            window._navBadgeInterval = null;
            return;
        }

        if (badge) {
            const count = getTotalUnread(user.user_id);
            if (count > 0) {
                badge.textContent = count > 99 ? '99+' : count;
                badge.style.display = 'flex';
            } else {
                badge.style.display = 'none';
            }
        }

        if (notifBadge) {
            const unreadNotifs = db.notifications.find(n => n.user_id === user.user_id && !n.is_read).length;
            if (unreadNotifs > 0) {
                notifBadge.textContent = unreadNotifs > 99 ? '99+' : unreadNotifs;
                notifBadge.style.display = 'flex';
            } else {
                notifBadge.style.display = 'none';
            }
        }
    }

    updateBadge();
    window._navBadgeInterval = setInterval(updateBadge, 10000);
}

export function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    initNavbarBadge();

    // Admin preview bar close
    const adminBar = document.getElementById('admin-preview-bar');
    const adminBarClose = document.getElementById('admin-bar-close');
    if (adminBar && adminBarClose) {
        adminBarClose.addEventListener('click', () => {
            adminBar.style.display = 'none';
        });
    }

    // Logo: always go home and scroll to top
    const logo = navbar.querySelector('.nav-logo');
    if (logo) {
        logo.addEventListener('click', e => {
            e.preventDefault();
            const isHome = window.location.pathname === '/' || window.location.pathname === '';
            if (isHome) {
                // Already on home — just reset scroll position
                window.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                // Navigate home, then scroll to top after render
                navigate('/');
                // Use requestAnimationFrame to scroll after the router re-renders
                requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'instant' }));
            }
        });
    }

    // Navbar scroll effect
    window.addEventListener('scroll', () => {
        navbar.classList.toggle('scrolled', window.scrollY > 20);
    });

    // Mobile menu toggle
    const hamburger = document.getElementById('hamburger');
    const navLinks = document.getElementById('nav-links');
    const navCta = document.getElementById('nav-cta');
    if (hamburger && navLinks) {
        hamburger.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('active');
            if (navCta) {
                navCta.classList.toggle('active', isOpen);
                if (isOpen) {
                    const linksBottom = navLinks.getBoundingClientRect().bottom;
                    navCta.style.top = linksBottom + 'px';
                }
            }
            const spans = hamburger.querySelectorAll('span');
            if (isOpen) {
                spans[0].style.transform = 'rotate(45deg) translate(5px, 5px)';
                spans[1].style.opacity = '0';
                spans[2].style.transform = 'rotate(-45deg) translate(5px, -5px)';
            } else {
                spans[0].style.transform = 'none';
                spans[1].style.opacity = '1';
                spans[2].style.transform = 'none';
            }
        });
    }

    // Smooth scroll for in-page anchors
    document.querySelectorAll('.nav-links a[href^="#"]').forEach(anchor => {
        const href = anchor.getAttribute('href');
        if (href.startsWith('#/')) return;
        if (href === '#') return;

        anchor.addEventListener('click', (e) => {
            const target = document.querySelector(href);
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                // Close mobile menu
                if (navLinks) {
                    navLinks.classList.remove('active');
                    if (navCta) navCta.classList.remove('active');
                    const spans = hamburger.querySelectorAll('span');
                    if (spans.length === 3) {
                        spans[0].style.transform = 'none';
                        spans[1].style.opacity = '1';
                        spans[2].style.transform = 'none';
                    }
                }
            }
        });
    });
}
