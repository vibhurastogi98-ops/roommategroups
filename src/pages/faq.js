import { renderNavbar, initNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';

const FAQ_DATA = [
    {
        category: 'Getting Started',
        icon: '🚀',
        faqs: [
            { q: 'Is RoommateGroups free to use?', a: 'Our basic plan is completely free — you can browse listings, create a profile, and contact other members. Premium plans unlock advanced features like featured listings, unlimited messages, and priority search placement.' },
            { q: 'How do I create an account?', a: 'Click "Get Started" or "Sign Up" on any page. You only need a valid email address. After registering, we recommend completing your profile and verifying your identity to build trust with other members.' },
            { q: 'Can I list my room or entire apartment?', a: 'Yes! You can list a private room in a shared home, an entire apartment, or a room in a coliving space. Use the "Post a Listing" button from your dashboard to get started.' },
            { q: 'Is RoommateGroups available outside the US?', a: 'Yes! We currently operate in 30+ cities including Paris, Berlin, Amsterdam, and many more. We\'re expanding internationally every quarter.' },
        ]
    },
    {
        category: 'Safety & Trust',
        icon: '🛡️',
        faqs: [
            { q: 'How does ID verification work?', a: 'Our 4-level verification system starts with email, then phone, then Government ID (passport or driver\'s license matched with a live selfie), and finally Community Verification from peer reviews. Each level unlocks more benefits.' },
            { q: 'Are listings screened for scams?', a: 'Yes. Our AI-powered scam detection flags suspicious listings before they go live. We also allow community members to report suspicious activity. All reported listings are reviewed within 24 hours.' },
            { q: 'What if someone contacts me inappropriately?', a: 'Use the "Report" button on any message or profile. Our Trust & Safety team reviews all reports within 24 hours. Repeated violations result in permanent account suspension.' },
            { q: 'Are my personal details shared publicly?', a: 'No. Your exact address and phone number are never shared publicly. Only your display name, profile photo, and verification badges are visible to other members before you choose to connect.' },
        ]
    },
    {
        category: 'Listings & Pricing',
        icon: '🏠',
        faqs: [
            { q: 'How do I make my listing stand out?', a: 'Upload high-quality photos, write a detailed description, set accurate amenities, complete your ID verification (it shows a badge on your listing), and consider upgrading to a Featured Listing for 3x more views.' },
            { q: 'Can I edit or deactivate my listing?', a: 'Yes, you can edit, pause, or delete your listing anytime from your Dashboard → My Listings section.' },
            { q: 'What are featured listings?', a: 'Featured listings appear at the top of search results for your city. They receive on average 3x more views and generate significantly more inquiries. Available on our Pro and Premium plans.' },
            { q: 'How does pricing work?', a: 'Free accounts can post 1 listing at a time. Pro accounts ($9.99/mo) get 5 listings and featured placement. Premium accounts ($24.99/mo) get unlimited listings and all advanced features.' },
        ]
    },
    {
        category: 'Payments & Billing',
        icon: '💳',
        faqs: [
            { q: 'What payment methods are accepted?', a: 'We accept all major credit and debit cards (Visa, Mastercard, Amex), PayPal, and Apple Pay. All payments are processed securely through Stripe.' },
            { q: 'Can I cancel my subscription anytime?', a: 'Yes. You can cancel your subscription at any time from your Dashboard → Subscription page. You\'ll retain access to premium features until the end of your current billing period.' },
            { q: 'Do you offer refunds?', a: 'We offer a 7-day money-back guarantee on all new subscriptions. If you\'re not satisfied within the first 7 days, contact us for a full refund.' },
            { q: 'Is my payment information secure?', a: 'Absolutely. We never store your full card details. All payment data is handled by Stripe, which is PCI-DSS Level 1 certified — the highest level of payment security.' },
        ]
    }
];

export function renderFAQPage(app) {
    app.innerHTML = `
    <style>
        .faq-hero { background: #f2f2f2; color: #1a1a1a; border-bottom: 1px solid #e2e8f0; padding: 100px 24px 80px; text-align: center; }
        .faq-hero h1 { font-size: clamp(2rem, 5vw, 3rem); font-weight: 800; margin-bottom: 16px; }
        .faq-hero p { opacity: 0.8; max-width: 600px; margin: 0 auto 32px; font-size: 1.1rem; }
        .faq-search-wrap { max-width: 480px; margin: 0 auto; position: relative; }
        .faq-search { width: 100%; padding: 14px 20px 14px 48px; border-radius: 12px; border: none; font-size: 1rem; outline: none; }
        .faq-search-icon { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: #64748b; }
        .faq-container { max-width: 860px; margin: 0 auto; padding: 60px 24px; }
        .faq-category { margin-bottom: 48px; }
        .faq-cat-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .faq-cat-header span { font-size: 1.5rem; }
        .faq-cat-header h2 { font-size: 1.3rem; font-weight: 800; color: #1a1a1a; }
        .faq-item { border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 10px; overflow: hidden; transition: box-shadow 0.2s; }
        .faq-item:hover { box-shadow: 0 4px 12px rgba(99,102,241,0.08); }
        .faq-q { display: flex; justify-content: space-between; align-items: center; padding: 18px 20px; cursor: pointer; gap: 16px; font-weight: 600; color: #1e293b; user-select: none; }
        .faq-q .chevron { color: #64748b; transition: transform 0.3s; flex-shrink: 0; }
        .faq-item.open .faq-q .chevron { transform: rotate(180deg); }
        .faq-item.open .faq-q { color: #1a1a1a; }
        .faq-a { max-height: 0; overflow: hidden; transition: max-height 0.35s ease, padding 0.2s; background: #f8fafc; }
        .faq-item.open .faq-a { max-height: 200px; padding: 16px 20px; }
        .faq-a p { color: #475569; line-height: 1.8; font-size: 0.95rem; }
        .contact-cta { background: #f2f2f2; border: 1px solid #e2e8f0; border-radius: 20px; padding: 48px; text-align: center; color: #1a1a1a; margin-top: 48px; }
        .contact-cta h2 { font-size: 1.6rem; font-weight: 800; margin-bottom: 12px; }
        .contact-cta p { opacity: 0.85; margin-bottom: 24px; }
    </style>

    ${renderNavbar()}

    <div class="faq-hero">
        <h1>Frequently Asked Questions</h1>
        <p>Can't find what you're looking for? Our support team is always ready to help.</p>
        <div class="faq-search-wrap">
            <i class="fas fa-search faq-search-icon"></i>
            <input type="text" class="faq-search" id="faq-search" placeholder="Search questions..." autocomplete="off">
        </div>
    </div>

    <div class="faq-container">
        ${FAQ_DATA.map((cat, ci) => `
            <div class="faq-category" data-cat="${ci}">
                <div class="faq-cat-header">
                    <span>${cat.icon}</span>
                    <h2>${cat.category}</h2>
                </div>
                ${cat.faqs.map((item, fi) => `
                    <div class="faq-item" data-idx="${ci}-${fi}">
                        <div class="faq-q">
                            <span>${item.q}</span>
                            <i class="fas fa-chevron-down chevron"></i>
                        </div>
                        <div class="faq-a"><p>${item.a}</p></div>
                    </div>
                `).join('')}
            </div>
        `).join('')}

        <div class="contact-cta">
            <h2>Still have questions?</h2>
            <p>Our friendly support team is available 7 days a week, 9am–9pm ET.</p>
            <a href="/contact" style="background:#1a1a1a;color:white;padding:12px 28px;border-radius:10px;font-weight:700;text-decoration:none;font-size:0.95rem;">Contact Support</a>
        </div>
    </div>

    ${renderFooter()}
    `;

    // FAQ accordion
    app.querySelectorAll('.faq-item').forEach(item => {
        item.querySelector('.faq-q').addEventListener('click', () => {
            item.classList.toggle('open');
        });
    });

    // Search filter
    const searchEl = app.querySelector('#faq-search');
    if (searchEl) {
        searchEl.addEventListener('input', () => {
            const q = searchEl.value.toLowerCase();
            app.querySelectorAll('.faq-item').forEach(item => {
                const text = item.textContent.toLowerCase();
                item.style.display = text.includes(q) ? '' : 'none';
            });
            app.querySelectorAll('.faq-category').forEach(cat => {
                const anyVisible = [...cat.querySelectorAll('.faq-item')].some(i => i.style.display !== 'none');
                cat.style.display = anyVisible ? '' : 'none';
            });
        });
    }

    initNavbar();
}
