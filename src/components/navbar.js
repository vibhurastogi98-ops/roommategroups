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
            <a href="/dashboard" class="user-avatar-nav" style="background: linear-gradient(135deg, var(--primary), var(--primary-light)); display: flex; align-items: center; gap: 8px; padding-right: 12px; min-width: 68px;">
                <div class="user-avatar-img-wrap" style="width:36px;height:36px;border-radius:50%;overflow:hidden;display:flex;align-items:center;justify-content:center;">
                    ${profilePhoto ? `<img src="${profilePhoto}" alt="${fullName}" style="width:100%;height:100%;object-fit:cover;" />` : initials}
                </div>
                <i class="fa-solid fa-chevron-down" style="font-size:0.75rem;opacity:0.8;color:white;"></i>
            </a>
        `;
    }
    return `
        <a href="/post-listing" class="btn btn-outline">List Your Room</a>
        <a href="/auth/login" class="btn btn-primary">Sign In</a>
    `;
}


export function renderNavbar() {
    const path = window.location.pathname;
    const isHome = path === '/' || path === '';

    return `
    <nav class="navbar" id="navbar">
      <div class="nav-container">
        <a href="/" class="nav-logo">
          <span class="logo-badge">
            <span class="logo-badge-left">Roommate</span><span class="logo-badge-right">Groups</span>
          </span>
        </a>
        <div class="nav-links" id="nav-links">
          <a href="/#cities" class="nav-anchor" data-external="true">Cities</a>
          <a href="/#how-it-works" class="nav-anchor" data-external="true">How It Works</a>
          <a href="/#listings" class="nav-anchor" data-external="true">Listings</a>
          <a href="/pricing">Pricing</a>
          <a href="/blog">Blog</a>
          <a href="/fb-groups" style="display:inline-flex;align-items:center;gap:5px;"><i class="fab fa-facebook" style="color:#1877f2;"></i> FB Groups</a>
        </div>
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
    document.querySelectorAll('.nav-anchor').forEach(anchor => {
        anchor.addEventListener('click', (e) => {
            e.stopPropagation();
            const href = anchor.getAttribute('href');
            const targetId = href.substring(href.indexOf('#'));
            const isHome = window.location.pathname === '/' || window.location.pathname === '';

            if (isHome) {
                e.preventDefault();
                const target = document.querySelector(targetId);
                if (target) {
                    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            } else {
                e.preventDefault();
                navigate('/');
                // Wait for the home page to render, then scroll
                setTimeout(() => {
                    const target = document.querySelector(targetId);
                    if (target) {
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }, 100);
            }

            // Close mobile menu
            if (navLinks) {
                navLinks.classList.remove('active');
                if (navCta) navCta.classList.remove('active');
                const spans = hamburger?.querySelectorAll('span');
                if (spans && spans.length === 3) {
                    spans[0].style.transform = 'none';
                    spans[1].style.opacity = '1';
                    spans[2].style.transform = 'none';
                }
            }
        });
    });
}
