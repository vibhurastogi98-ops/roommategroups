import { getCurrentUser, isAdmin, logout } from '../services/auth.js';
import { navigate } from '../router.js';
import { getTotalUnread } from '../services/messaging.js';
import { db, syncMessagesAndThreads } from '../services/db.js';

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
            <div class="nav-user-dropdown-container">
                <button class="user-avatar-nav" id="user-menu-trigger" style="background: linear-gradient(135deg, var(--primary), var(--primary-light)); display: flex; align-items: center; gap: 10px; padding: 0 12px 0 4px; width: auto; min-width: 76px; border: none;">
                    <div class="user-avatar-img-wrap" style="width:34px;height:34px;border-radius:8px;overflow:hidden;display:flex;align-items:center;justify-content:center;background: rgba(255,255,255,0.1); font-weight: 800; font-size: 0.8rem;">
                        ${profilePhoto ? `<img src="${profilePhoto}" alt="${fullName}" style="width:100%;height:100%;object-fit:cover;" />` : initials}
                    </div>
                    <i class="fa-solid fa-chevron-down" id="user-menu-chevron" style="font-size:0.7rem;opacity:0.9;color:white;transition:transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);"></i>
                </button>
                
                <div class="nav-user-dropdown" id="user-menu-dropdown">
                    <div class="nav-user-header">
                        <div class="nav-user-info">
                            <span class="nav-user-name">${fullName}</span>
                            <span class="nav-user-email">${user.email}</span>
                        </div>
                    </div>
                    <a href="/dashboard" class="nav-dropdown-item">
                        <i class="fa-solid fa-house-user"></i>
                        Go to Dashboard
                    </a>
                    <a href="/dashboard/settings" class="nav-dropdown-item">
                        <i class="fa-solid fa-user-gear"></i>
                        Profile Setting
                    </a>
                    <button id="nav-logout-btn" class="nav-dropdown-item logout">
                        <i class="fa-solid fa-right-from-bracket"></i>
                        Logout
                    </button>
                </div>
            </div>
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
    window._navBadgeInterval = setInterval(async () => {
        await syncMessagesAndThreads();
        updateBadge();
    }, 3000);

    // Also update if other parts of the app trigger a sync
    window.addEventListener('db-synced', updateBadge);
}

export function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    initNavbarBadge();

    // User Dropdown Logic
    const userTrigger = document.getElementById('user-menu-trigger');
    const userDropdown = document.getElementById('user-menu-dropdown');
    const userChevron = document.getElementById('user-menu-chevron');
    const logoutBtn = document.getElementById('nav-logout-btn');

    if (userTrigger && userDropdown) {
        userTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isActive = userDropdown.classList.toggle('active');
            if (userChevron) {
                userChevron.style.transform = isActive ? 'rotate(180deg)' : 'rotate(0deg)';
            }
        });

        // Close when clicking outside
        document.addEventListener('click', (e) => {
            if (!userTrigger.contains(e.target) && !userDropdown.contains(e.target)) {
                userDropdown.classList.remove('active');
                if (userChevron) userChevron.style.transform = 'rotate(0deg)';
            }
        });

        // Handle Logout
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await logout();
                window.location.href = '/';
            });
        }

        // Close on escape
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                userDropdown.classList.remove('active');
                if (userChevron) userChevron.style.transform = 'rotate(0deg)';
            }
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
    // Capture original parent/sibling BEFORE any DOM moves
    const navCtaOriginalParent = navCta ? navCta.parentElement : null;
    const navCtaNextSibling = navCta ? navCta.nextElementSibling : null;

    if (hamburger && navLinks) {
        function closeMobileMenu() {
            navLinks.classList.remove('active');
            if (navCta) {
                navCta.classList.remove('active');
                // Restore nav-cta to its original DOM position.
                // Use parentElement check (not .contains) because nav-links
                // is itself inside nav-container, so .contains() always returns true.
                if (navCtaOriginalParent && navCta.parentElement !== navCtaOriginalParent) {
                    if (navCtaNextSibling && navCtaNextSibling.parentElement === navCtaOriginalParent) {
                        navCtaOriginalParent.insertBefore(navCta, navCtaNextSibling);
                    } else {
                        navCtaOriginalParent.appendChild(navCta);
                    }
                }
            }
            document.body.style.overflow = '';
            const spans = hamburger.querySelectorAll('span');
            spans[0].style.transform = 'none';
            spans[1].style.opacity = '1';
            spans[2].style.transform = 'none';
        }

        // Expose so anchor clicks can also close menu
        window._closeMobileMenu = closeMobileMenu;

        hamburger.addEventListener('click', () => {
            const isOpen = navLinks.classList.toggle('active');
            if (navCta) {
                navCta.classList.toggle('active', isOpen);
                if (isOpen) {
                    // Move nav-cta inside nav-links so both scroll in one unified drawer
                    navLinks.appendChild(navCta);
                } else {
                    closeMobileMenu();
                    return;
                }
            }
            // Lock/unlock body scroll
            document.body.style.overflow = isOpen ? 'hidden' : '';
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

            // Close mobile menu and restore scroll
            if (window._closeMobileMenu) window._closeMobileMenu();
        });
    });
}
