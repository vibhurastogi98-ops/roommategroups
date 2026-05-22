import { renderNavbar, initNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { setSEO } from '../seo.js'; // SEO Update

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
            { q: 'How does pricing work?', a: 'Free accounts can post 1 listing at a time. Premium accounts ($4.99/mo) get up to 3 listings and boosted search visibility. Pro accounts ($8.99/mo) get up to 5 listings and top ranking placement.' },
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
    // SEO Update
    setSEO({
        title: 'FAQ — Roommate Groups & Rental Questions | RoommateGroups',
        description: 'Answers to the most common questions about finding a roommate, listing a room, safety, pricing, and payments on RoommateGroups.',
        canonical: 'https://roommategroups.com/faq',
        schema: {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: FAQ_DATA.flatMap(cat => cat.faqs.slice(0, 2).map(item => ({
                '@type': 'Question',
                name: item.q,
                acceptedAnswer: { '@type': 'Answer', text: item.a },
            }))),
        },
    });
    app.innerHTML = `
    <style>
        .faq-hero { background: #fff; color: #1a2740; border-bottom: 1px solid #eef2f6; padding: 100px 24px 80px; text-align: center; }
        .faq-hero h1 { font-size: clamp(2rem, 5vw, 2.8rem); font-weight: 800; margin-bottom: 16px; letter-spacing: -0.02em; }
        .faq-hero p { color: #64748b; max-width: 600px; margin: 0 auto 32px; font-size: 1.1rem; }
        .faq-search-wrap { max-width: 540px; margin: 0 auto; position: relative; }
        .faq-search { width: 100%; padding: 16px 24px 16px 52px; border-radius: 14px; border: 1.5px solid #eef2f6; font-size: 1rem; outline: none; transition: all 0.2s; background: #f8fafc; }
        .faq-search:focus { border-color: #7c3aed; background: #fff; box-shadow: 0 0 0 4px rgba(124, 58, 237, 0.1); }
        .faq-search-icon { position: absolute; left: 20px; top: 50%; transform: translateY(-50%); color: #94a3b8; font-size: 1.1rem; }
        .faq-container { max-width: 900px; margin: 0 auto; padding: 60px 24px; }
        .faq-category { margin-bottom: 64px; }
        .faq-cat-header { display: flex; align-items: center; gap: 14px; margin-bottom: 24px; padding-bottom: 12px; border-bottom: 2px solid #f1f5f9; width: fit-content; }
        .faq-cat-header span { font-size: 1.5rem; }
        .faq-cat-header h2 { font-size: 1.4rem; font-weight: 800; color: #1a2740; letter-spacing: -0.01em; }
        .faq-list { display: flex; flex-direction: column; }
        .faq-item { display: flex; gap: 24px; padding: 32px 0; border-bottom: 1px solid #f1f5f9; transition: transform 0.2s ease; }
        .faq-item:last-child { border-bottom: none; }
        .faq-icon-box { flex-shrink: 0; width: 52px; height: 52px; background: #f1f5f9; border-radius: 14px; display: flex; align-items: center; justify-content: center; color: #64748b; font-size: 1.25rem; transition: all 0.2s; border: 1px solid transparent; }
        .faq-item:hover .faq-icon-box { background: #fff; border-color: #7c3aed; color: #7c3aed; box-shadow: 0 4px 12px rgba(124,58,237,0.12); }
        .faq-content { flex: 1; }
        .faq-q { font-size: 1.15rem; font-weight: 700; color: #1a2740; margin-bottom: 10px; line-height: 1.4; }
        .faq-a { font-size: 1.05rem; line-height: 1.7; color: #64748b; }
        .contact-cta { background: #f8fafc; border: 1px solid #eef2f6; border-radius: 24px; padding: 56px; text-align: center; color: #1a2740; margin-top: 64px; }
        .contact-cta h2 { font-size: 1.8rem; font-weight: 800; margin-bottom: 12px; letter-spacing: -0.02em; }
        .contact-cta p { color: #64748b; margin-bottom: 32px; font-size: 1.1rem; }
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
                <div class="home-faq-list" style="background: transparent;">
                    ${cat.faqs.map((item, fi) => `
                        <div class="home-faq-item" style="border-bottom: 1px solid #f1f5f9;">
                            <div class="home-faq-icon">
                                <i class="fas fa-question"></i>
                            </div>
                            <div class="home-faq-content">
                                <div class="home-faq-q">${item.q}</div>
                                <div class="home-faq-a">${item.a}</div>
                            </div>
                        </div>
                    `).join('')}
                </div>
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

    // No FAQ accordion logic needed for the new design

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
