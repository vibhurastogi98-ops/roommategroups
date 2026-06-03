import { renderNavbar, initNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { navigate } from '../router.js';
import { getCurrentUser } from '../services/auth.js';
import { setSEO } from '../seo.js'; // SEO Update

export function renderPricingPage(app) {
    // SEO Update
    setSEO({
        title: 'Pricing Plans — Free, Premium & Pro | RoommateGroups',
        description: 'Choose the plan that fits your roommate search and local marketplace selling. Basic item listings are free; upgrade for more listings, promote credits, seller tools, AI matching, and unlimited messaging.',
        canonical: 'https://roommategroups.com/pricing',
    });
    let isAnnual = false; // Toggle state

    function getPlanData() {
        return {
            free: {
                name: 'Free',
                icon: '🆓',
                priceMonthly: 0,
                priceAnnual: 0,
                ctaOutline: true,
                ctaText: 'Get Started Free',
                highlights: [
                    '1 room listing + 1 item',
                    'Browse & message (5/day)',
                    'Sell items free',
                    'Make & receive offers',
                    'Standard support'
                ],
                features: [
                    { name: 'Active Listings', value: '1 Listing' },
                    { name: 'Profile Setup', value: 'Basic Profile' },
                    { name: 'Browse & Search Listings', value: 'Yes', included: true },
                    { name: 'Messaging', value: '5 msgs/day' },
                    { name: 'Verified Badge', included: false },
                    { name: 'Listing Visibility', value: 'Standard' },
                    { name: 'Social Community', value: 'View & Like only (Facebook)' },
                    { name: 'Roommate Matching AI', included: false },
                    { name: 'Safety & Background Check', included: false },
                    { name: 'Listing Analytics', included: false },
                    { name: 'Early Access to Deals', included: false },
                    { name: 'Priority Support', value: 'Standard (48hr)' },
                    { name: 'Sell Items Locally', value: 'Free', included: true },
                    { name: 'Active Item Listings', value: '1 item' },
                    { name: 'Buyer↔Seller Chat', value: 'Included', included: true },
                    { name: 'Make & Receive Offers', value: 'Yes', included: true },
                    { name: 'Promote / Boost an Item', included: false },
                    { name: 'Seller Badge', included: false },
                    { name: 'Seller Analytics', included: false }
                ]
            },
            premium: {
                name: 'Premium',
                icon: '⚡',
                priceMonthly: 4.99,
                priceAnnual: 0.99,
                ctaOutline: false,
                ctaText: 'Subscribe to Premium',
                monthlyUrl: 'https://buy.stripe.com/14AeVecQq2PL4JaeOj3ZK1B',
                annualUrl:  'https://buy.stripe.com/bJefZi2bM3TPgrS35B3ZK1C',
                highlights: [
                    '3 room listings + 3 items',
                    'Unlimited messaging',
                    'Verified badge + 2x visibility',
                    '2 promote credits / mo',
                    'Basic seller analytics',
                    'Priority support (24hr)'
                ],
                features: [
                    { name: 'Active Listings', value: '3 Listings' },
                    { name: 'Profile Setup', value: 'Enhanced + Photo Verification' },
                    { name: 'Browse & Search Listings', value: 'Yes (Advanced Filters)', included: true },
                    { name: 'Messaging', value: 'Unlimited Messaging' },
                    { name: 'Verified Badge', included: true },
                    { name: 'Listing Visibility', value: '2x Boosted Visibility' },
                    { name: 'Social Community', value: 'Post & Comment (Facebook)' },
                    { name: 'Roommate Matching AI', value: 'Basic Compatibility Score', included: true },
                    { name: 'Safety & Background Check', included: false },
                    { name: 'Listing Analytics', value: 'Basic Views Count', included: true },
                    { name: 'Early Access to Deals', included: false },
                    { name: 'Priority Support', value: 'Priority (24hr)' },
                    { name: 'Sell Items Locally', value: 'Free', included: true },
                    { name: 'Active Item Listings', value: '3 items' },
                    { name: 'Buyer↔Seller Chat', value: 'Included', included: true },
                    { name: 'Make & Receive Offers', value: 'Yes', included: true },
                    { name: 'Promote / Boost an Item', value: '2 promote credits/mo', included: true },
                    { name: 'Seller Badge', value: 'Verified Seller', included: true },
                    { name: 'Seller Analytics', value: 'Basic (views & offers)', included: true }
                ]
            },
            pro: {
                name: 'Pro',
                icon: '🔥',
                priceMonthly: 8.99,
                priceAnnual: 1.99,
                isPopular: true,
                ctaOutline: false,
                ctaSuccess: true,
                ctaText: 'Go Pro Today',
                monthlyUrl: 'https://buy.stripe.com/28E14ocQq7611wY49F3ZK1D',
                annualUrl:  'https://buy.stripe.com/00w8wQg2C4XT3F6fSn3ZK1E',
                highlights: [
                    '5 room listings + 5 items',
                    'Gold Verified Badge',
                    '5x top placement',
                    '8 promote credits / mo',
                    'Full seller dashboard + AI match',
                    'VIP support (4hr + live chat)'
                ],
                features: [
                    { name: 'Active Listings', value: '5 Listings' },
                    { name: 'Profile Setup', value: 'Premium + Social link' },
                    { name: 'Browse & Search Listings', value: 'Priority Access', included: true },
                    { name: 'Messaging', value: 'Unlimited + Read Receipts' },
                    { name: 'Verified Badge', value: 'Gold Verified Badge', included: true },
                    { name: 'Listing Visibility', value: '5x Top Ranking Placement' },
                    { name: 'Social Community', value: 'Full Access (FB + IG)' },
                    { name: 'Roommate Matching AI', value: 'Advanced AI Match', included: true },
                    { name: 'Safety & Background Check', value: '1 Free Check/mo', included: true },
                    { name: 'Listing Analytics', value: 'Full Dashboard', included: true },
                    { name: 'Early Access to Deals', value: 'See listings 24hrs early', included: true },
                    { name: 'Priority Support', value: 'VIP (4hr + Live Chat)' },
                    { name: 'Sell Items Locally', value: 'Free', included: true },
                    { name: 'Active Item Listings', value: '5 items' },
                    { name: 'Buyer↔Seller Chat', value: 'Included', included: true },
                    { name: 'Make & Receive Offers', value: 'Yes', included: true },
                    { name: 'Promote / Boost an Item', value: '8 promote credits/mo', included: true },
                    { name: 'Seller Badge', value: 'Gold Verified Badge', included: true },
                    { name: 'Seller Analytics', value: 'Full storefront dashboard', included: true }
                ]
            }
        };
    }

    const plans = getPlanData();

    // ── Table features ──
    const allFeatures = plans.free.features.map(f => f.name);
    const marketplaceStartIndex = allFeatures.indexOf('Sell Items Locally');

    function renderValue(featureObj) {
        if (featureObj.value) return featureObj.value;
        if (featureObj.included === true) return '<i class="fa-solid fa-check text-success"></i>';
        if (featureObj.included === false) return '<i class="fa-solid fa-xmark text-danger"></i>';
        return '';
    }

    function renderCompareRows() {
        return allFeatures.map((featName, i) => `
            ${i === 0 ? '<tr class="compare-section-row"><td colspan="4">Roommates & Rentals</td></tr>' : ''}
            ${i === marketplaceStartIndex ? '<tr class="compare-section-row"><td colspan="4">Marketplace</td></tr>' : ''}
            <tr>
                <td>${featName}</td>
                <td>${renderValue(plans.free.features[i])}</td>
                <td>${renderValue(plans.premium.features[i])}</td>
                <td>${renderValue(plans.pro.features[i])}</td>
            </tr>
        `).join('');
    }

    function build() {
        return `
        <style>
            .pricing-page {
                font-family: 'Inter', sans-serif;
                background-color: var(--surface);
                min-height: 100vh;
                padding-bottom: 80px;
                padding-top: 60px;
            }
            .pricing-hero {
                text-align: center;
                padding: 60px 20px 40px;
            }
            .pricing-hero h1 {
                font-size: 2.8rem;
                font-weight: 800;
                color: #1e293b;
                margin-bottom: 16px;
                letter-spacing: -0.02em;
            }
            .pricing-hero p {
                font-size: 1.1rem;
                color: #64748b;
                max-width: 600px;
                margin: 0 auto 40px;
            }
            .billing-toggle {
                display: inline-flex;
                align-items: center;
                background: #f1f5f9;
                border-radius: 30px;
                padding: 4px;
                position: relative;
                margin: 0 auto;
                cursor: pointer;
            }
            .billing-toggle-option {
                padding: 10px 24px;
                border-radius: 26px;
                font-weight: 600;
                font-size: 0.95rem;
                color: #64748b;
                position: relative;
                z-index: 2;
                transition: color 0.3s ease;
            }
            .billing-toggle-option.active {
                color: #1e293b;
            }
            .billing-indicator {
                position: absolute;
                top: 4px;
                bottom: 4px;
                width: calc(50% - 4px);
                background: white;
                border-radius: 26px;
                box-shadow: 0 2px 4px rgba(0,0,0,0.05);
                transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                z-index: 1;
            }
            .save-badge {
                position: absolute;
                top: -12px;
                right: -20px;
                background: #22c55e;
                color: white;
                font-size: 0.7rem;
                font-weight: 700;
                padding: 2px 8px;
                border-radius: 12px;
                text-transform: uppercase;
                transform: rotate(5deg);
            }
            
            .pricing-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 24px;
                max-width: 1100px;
                margin: 0 auto 60px;
                padding: 0 20px;
            }
            .plan-card {
                background: white;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: var(--shadow-sm);
                transition: transform 0.3s ease, box-shadow 0.3s ease;
                display: flex;
                flex-direction: column;
                position: relative;
                border: 2px solid transparent;
            }
            .plan-card:hover {
                transform: translateY(-5px);
                box-shadow: var(--shadow-md);
            }
            .plan-card.free { border-color: #e2e8f0; }
            .plan-card.premium { border-color: #6366f1; }
            .plan-card.pro { border-color: #1a1a1a; }
            
            .plan-popular-badge {
                position: absolute;
                top: 0;
                right: 0;
                background: linear-gradient(135deg, #f59e0b, #ef4444);
                color: white;
                font-size: 0.75rem;
                font-weight: 700;
                padding: 6px 16px;
                border-bottom-left-radius: 12px;
                text-transform: uppercase;
            }
            
            .plan-header {
                padding: 30px 24px;
                text-align: center;
                border-bottom: 1px solid #f1f5f9;
            }
            .plan-card.free .plan-header { background: #f8fafc; }
            .plan-card.premium .plan-header { background: #6366f1; color: white; border-bottom: none; }
            .plan-card.pro .plan-header { background: #1a1a1a; color: white; border-bottom: none; }
            
            .plan-name {
                font-size: 1.2rem;
                font-weight: 700;
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 8px;
            }
            .plan-price {
                font-size: 3rem;
                font-weight: 800;
                line-height: 1;
                margin-bottom: 8px;
            }
            .plan-price span {
                font-size: 1rem;
                font-weight: 500;
                opacity: 0.8;
            }
            .plan-billed {
                font-size: 0.85rem;
                opacity: 0.8;
                min-height: 20px;
            }
            
            .plan-body {
                padding: 24px;
                flex: 1;
                display: flex;
                flex-direction: column;
            }
            .plan-features {
                list-style: none;
                padding: 0;
                margin: 0 0 24px;
                flex: 1;
            }
            .plan-features li {
                display: flex;
                align-items: flex-start;
                gap: 12px;
                margin-bottom: 14px;
                font-size: 0.95rem;
                color: #475569;
            }
            .plan-features li i.fa-check { color: #22c55e; margin-top: 3px; }
            .plan-features li i.fa-xmark { color: #ef4444; margin-top: 3px; }
            .plan-compare-link {
                display: inline-flex;
                align-self: flex-start;
                margin: -6px 0 18px;
                color: #64748b;
                font-size: 0.88rem;
                font-weight: 700;
                text-decoration: none;
            }
            .plan-compare-link:hover { color: #1e293b; }
            
            .pricing-table-section {
                max-width: 1100px;
                margin: 80px auto;
                padding: 0 20px;
            }
            .pricing-table-section h2 {
                text-align: center;
                font-size: 2rem;
                margin-bottom: 40px;
                color: #1e293b;
            }
            .table-wrap {
                overflow-x: auto;
                background: white;
                border-radius: 12px;
                box-shadow: var(--shadow-sm);
                border: 1px solid #e2e8f0;
            }
            .pricing-table {
                width: 100%;
                border-collapse: collapse;
                min-width: 800px;
            }
            .pricing-table th, .pricing-table td {
                padding: 16px;
                text-align: center;
                border-bottom: 1px solid #e2e8f0;
            }
            .pricing-table th {
                background: #f8fafc;
                font-weight: 700;
                color: #1e293b;
                position: sticky;
                top: 0;
            }
            .pricing-table th:first-child, .pricing-table td:first-child {
                text-align: left;
                position: sticky;
                left: 0;
                background: inherit;
                font-weight: 600;
                color: #334155;
                border-right: 1px solid #e2e8f0;
                width: 25%;
            }
            .pricing-table tr:nth-child(even) { background: #f8fafc; }
            .pricing-table tr:nth-child(odd) { background: white; }
            .pricing-table .compare-section-row td {
                background: #eef2ff !important;
                color: #1e293b;
                font-size: 0.78rem;
                font-weight: 800;
                letter-spacing: 0.08em;
                text-transform: uppercase;
                border-right: 0;
            }
            .marketplace-free-note {
                max-width: 980px;
                margin: -34px auto 54px;
                padding: 0 24px;
                text-align: center;
                color: #64748b;
                font-size: 0.98rem;
                line-height: 1.6;
            }
            .marketplace-free-note strong { color: #1e293b; }
            
            /* FAQ Section updated to match other pages */
            .pricing-page .section-header {
                margin-bottom: 40px;
            }
            .pricing-page .home-faq-list {
                margin-top: 20px;
            }
            
            
            .cta-banner {
                max-width: 1100px;
                margin: 60px auto;
                background: linear-gradient(135deg, var(--primary), var(--primary-light));
                border-radius: 20px;
                padding: 60px 20px;
                text-align: center;
                color: white;
            }
            .cta-banner h2 { font-size: 2.2rem; margin-bottom: 16px; }
            .cta-banner p { font-size: 1.1rem; opacity: 0.9; margin-bottom: 30px; }
            .cta-banner .btn { background: white; color: var(--primary); border: none; font-weight: 700; padding: 14px 32px; font-size: 1.1rem; }
            .cta-banner .btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px rgba(0,0,0,0.2); }
            
            @media (max-width: 900px) {
                .pricing-grid { grid-template-columns: 1fr; max-width: 400px; }
            }
        </style>
        
        ${renderNavbar()}
        
        <div class="pricing-page">
            <div class="pricing-hero">
                <h1>Simple, Transparent Pricing</h1>
                <p>Find roommates AND buy & sell locally. Listing items is always free — upgrade for more listings, promote credits, and a verified seller badge.</p>
                
                <div class="billing-toggle" id="billing-toggle">
                    <div class="billing-indicator" id="billing-indicator"></div>
                    <div class="billing-toggle-option active" data-val="monthly">Monthly</div>
                    <div class="billing-toggle-option" data-val="annual">
                        Annually <span class="save-badge">Save up to 80%</span>
                    </div>
                </div>
            </div>
            
            <div class="pricing-grid" id="pricing-cards">
                <!-- Cards injected here -->
            </div>

            <p class="marketplace-free-note">
                <strong>Buying and selling basic items is 100% free</strong> — no listing fees, no commission. Paid plans just add more listings, promotion, and seller tools.
            </p>
            
            <div class="pricing-table-section" id="compare-plans">
                <h2>Compare Plans</h2>
                <div class="table-wrap">
                    <table class="pricing-table">
                        <thead>
                            <tr>
                                <th>Feature</th>
                                <th>Free</th>
                                <th style="color:#6366f1;">Premium</th>
                                <th>Pro</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${renderCompareRows()}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <section class="section home-faq-section" id="faq" style="padding: 80px 20px;">
                <div class="container" style="max-width: 1100px; margin: 0 auto;">
                    <div class="section-header">
                        <h2 style="text-align: center; font-size: 2rem; color: #1e293b; margin-bottom: 12px;">Frequently Asked Questions</h2>
                        <p style="text-align: center; color: #64748b; margin-bottom: 40px;">Everything you need to know about RoommateGroups plans</p>
                    </div>
                    <div class="home-faq-list">
                        ${[
                { q: 'Can I switch plans anytime?', a: 'Yes! You can upgrade, downgrade, or cancel your subscription at any time from your dashboard settings. Upgrades are prorated.' },
                { q: 'Is there a free trial for paid plans?', a: 'We occasionally offer promotional trials for our Premium plan. Even without a trial, you can start on the Free plan for 1 month and upgrade when you need more power or time.' },
                { q: 'What payment methods do you accept?', a: 'We accept all major credit cards (Visa, MasterCard, American Express) as well as PayPal and Apple Pay.' },
                { q: 'What happens to my listings if I downgrade?', a: 'If you downgrade to a plan with a lower listing limit, your most recent active listings will remain active up to the new limit. The excess listings will be automatically paused until you either remove some or upgrade again.' },
                { q: 'Do you offer refunds?', a: 'We offer a 7-day money-back guarantee on all new subscriptions if you are not completely satisfied with the service.' },
                { q: 'Is it free to sell items on RoommateGroups?', a: 'Yes. Listing and selling items is completely free on every plan, with no listing fees or commission. Paid plans add more active listings, promote credits, and a verified seller badge.' },
                { q: 'What are promote credits?', a: 'Promote credits let you boost an item to the top of search and category results for more visibility. Premium and Pro include monthly credits; anyone can also buy a one-off boost.' },
                { q: 'Do I need a paid plan to buy things?', a: 'No. Browsing, chatting with sellers, and making offers are free for everyone.' },
            ].map(item => `
                            <div class="home-faq-item">
                                <div class="home-faq-icon"><i class="fas fa-question-circle"></i></div>
                                <div class="home-faq-content">
                                    <h3 class="home-faq-q" style="margin:0; font-size:1.1rem; font-weight:700;">${item.q}</h3>
                                    <div class="home-faq-a" style="margin-top:8px; color:#64748b; line-height:1.6;">
                                        <p style="margin:0;">${item.a}</p>
                                    </div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </section>

            
            <div class="cta-banner">
                <h2>Still not sure?</h2>
                <p>Start free — no credit card required to browse listings and connect.</p>
                <button class="btn" id="footer-cta-btn">Create Free Account</button>
            </div>
        </div>
        
        ${renderFooter()}
        `;
    }

    app.innerHTML = build();
    initNavbar();

    // ── Logic ──
    const user = getCurrentUser();

    function renderCards() {
        const cardsHtml = Object.keys(plans).map(key => {
            const p = plans[key];
            const price = isAnnual ? p.priceAnnual : p.priceMonthly;
            let billedNote = '';
            if (key === 'free') {
                billedNote = 'Valid for 1 month';
            } else {
                billedNote = isAnnual ? 'Billed annually' : 'Billed monthly';
            }
            const btnClass = p.ctaSuccess ? 'btn-success' : (p.ctaOutline ? 'btn-outline' : 'btn-primary');
            const badge = p.isPopular ? '<div class="plan-popular-badge">🔥 Most Popular</div>' : '';

            return `
            <div class="plan-card ${key}">
                ${badge}
                <div class="plan-header">
                    <div class="plan-name"><span>${p.icon}</span> ${p.name}</div>
                    <div class="plan-price">$${price}<span>/mo</span></div>
                    <div class="plan-billed">${billedNote}</div>
                </div>
                <div class="plan-body">
                    <ul class="plan-features">
                        ${p.highlights.map(text => `<li><i class="fa-solid fa-check"></i> <span>${text}</span></li>`).join('')}
                    </ul>
                    <a class="plan-compare-link" href="#compare-plans">See full comparison ↓</a>
                    <button class="btn ${btnClass} plan-cta-btn" data-plan="${key}" style="width:100%;">${p.ctaText}</button>
                </div>
            </div>
            `;
        }).join('');

        document.getElementById('pricing-cards').innerHTML = cardsHtml;

        // Bind CTA clicks
        document.querySelectorAll('.plan-cta-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const planId = btn.dataset.plan;
                const plan = plans[planId];

                if (planId === 'free') {
                    navigate(user ? '/dashboard' : '/auth/register');
                    return;
                }

                const stripeUrl = isAnnual ? plan.annualUrl : plan.monthlyUrl;

                if (stripeUrl) {
                    const url = user?.email
                        ? `${stripeUrl}?prefilled_email=${encodeURIComponent(user.email)}`
                        : stripeUrl;
                    window.location.href = url;
                }
            });
        });
    }

    renderCards();

    // Toggle Logic
    const toggleOpts = document.querySelectorAll('.billing-toggle-option');
    const indicator = document.getElementById('billing-indicator');

    toggleOpts.forEach((opt, idx) => {
        opt.addEventListener('click', () => {
            toggleOpts.forEach(o => o.classList.remove('active'));
            opt.classList.add('active');
            indicator.style.transform = idx === 1 ? 'translateX(100%)' : 'translateX(0)';
            isAnnual = (opt.dataset.val === 'annual');
            renderCards();
        });
    });



    // Footer CTA
    document.getElementById('footer-cta-btn').addEventListener('click', () => {
        navigate(user ? '/dashboard' : '/auth/register');
    });
}
