/**
 * src/mobile/pages/MobilePricing.js
 * Pricing plans adapted for mobile view, mirroring the website's detailed plans and functional logic.
 */

import { getCurrentUser } from '../../../web/src/services/auth.js';

async function getMobile() { return await import('../mobile-main.js'); }

export async function init(container) {
  const user = getCurrentUser();
  let isAnnual = false;

  const { updateHeader, goBack, navigate } = await getMobile();
  updateHeader({ title: 'Pricing Plans', showBack: true, onBack: goBack });

  const plans = {
    free: {
      name: 'Free',
      icon: '🆓',
      priceMonthly: 0,
      priceAnnual: 0,
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
        { name: 'Messaging', value: '5 msgs/day' },
        { name: 'Verified Badge', included: false },
        { name: 'Listing Visibility', value: 'Standard' },
        { name: 'Social Community', value: 'View only' },
        { name: 'Priority Support', value: 'Standard (48h)' },
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
      isPopular: false,
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
        { name: 'Messaging', value: 'Unlimited Messaging' },
        { name: 'Verified Badge', included: true },
        { name: 'Listing Visibility', value: '2x Boosted' },
        { name: 'Social Community', value: 'Post & Comment' },
        { name: 'Priority Support', value: 'Priority (24h)' },
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
        { name: 'Messaging', value: 'Unlimited + Read Receipts' },
        { name: 'Verified Badge', value: 'Gold Verified Badge', included: true },
        { name: 'Listing Visibility', value: '5x Top Ranking' },
        { name: 'Social Community', value: 'Full Access' },
        { name: 'Priority Support', value: 'VIP (4h)' },
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
  const allFeatures = plans.free.features.map(f => f.name);
  const marketplaceStartIndex = allFeatures.indexOf('Sell Items Locally');

  function renderMobileValue(featureObj) {
    if (featureObj.value) return featureObj.value;
    if (featureObj.included === true) return '✓';
    if (featureObj.included === false) return '×';
    return '';
  }

  function renderMobileCompareRows() {
    return allFeatures.map((featName, i) => `
      ${i === 0 ? '<tr><td colspan="4" style="padding:12px 14px; background:#eef2ff; color:#1e293b; font-size:0.7rem; font-weight:900; letter-spacing:0.08em; text-transform:uppercase;">Roommates & Rentals</td></tr>' : ''}
      ${i === marketplaceStartIndex ? '<tr><td colspan="4" style="padding:12px 14px; background:#eef2ff; color:#1e293b; font-size:0.7rem; font-weight:900; letter-spacing:0.08em; text-transform:uppercase;">Marketplace</td></tr>' : ''}
      <tr>
        <td style="padding:12px 14px; border-bottom:1px solid #e2e8f0; text-align:left; font-weight:700; color:#334155; background:#fff; position:sticky; left:0;">${featName}</td>
        <td style="padding:12px 14px; border-bottom:1px solid #e2e8f0; text-align:center; color:#475569;">${renderMobileValue(plans.free.features[i])}</td>
        <td style="padding:12px 14px; border-bottom:1px solid #e2e8f0; text-align:center; color:#475569;">${renderMobileValue(plans.premium.features[i])}</td>
        <td style="padding:12px 14px; border-bottom:1px solid #e2e8f0; text-align:center; color:#475569;">${renderMobileValue(plans.pro.features[i])}</td>
      </tr>
    `).join('');
  }

  function _render() {
    container.innerHTML = `
      <div style="padding: 0; background: #f8fafc; min-height: 100%; padding-bottom: 60px; font-family: 'Inter', sans-serif;">
        
        <!-- Hero Section -->
        <div style="text-align: center; padding: 40px 20px 30px;">
          <h2 style="font-size: 1.8rem; font-weight: 900; color: #1e293b; margin-bottom: 12px; letter-spacing: -0.02em;">Simple, Transparent Pricing</h2>
          <p style="font-size: 0.95rem; color: #64748b; line-height: 1.5; max-width: 320px; margin: 0 auto 24px;">Find roommates AND buy & sell locally. Listing items is always free — upgrade for more listings, promote credits, and a verified seller badge.</p>
          
          <!-- Billing Toggle -->
          <div style="display: inline-flex; align-items: center; background: #f1f5f9; border-radius: 30px; padding: 4px; position: relative; cursor: pointer;" id="mobile-billing-toggle">
            <div id="toggle-indicator" style="position: absolute; top: 4px; bottom: 4px; width: calc(50% - 4px); background: white; border-radius: 26px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 1; transform: ${isAnnual ? 'translateX(100%)' : 'translateX(0)'};"></div>
            <div class="toggle-opt ${!isAnnual ? 'active' : ''}" data-val="monthly" style="padding: 8px 20px; border-radius: 26px; font-weight: 700; font-size: 0.85rem; color: ${!isAnnual ? '#1e293b' : '#64748b'}; position: relative; z-index: 2; transition: color 0.3s;">Monthly</div>
            <div class="toggle-opt ${isAnnual ? 'active' : ''}" data-val="annual" style="padding: 8px 20px; border-radius: 26px; font-weight: 700; font-size: 0.85rem; color: ${isAnnual ? '#1e293b' : '#64748b'}; position: relative; z-index: 2; transition: color 0.3s;">
                Annually <span style="position: absolute; top: -10px; right: -10px; background: #22c55e; color: white; font-size: 0.6rem; font-weight: 800; padding: 2px 6px; border-radius: 10px; text-transform: uppercase;">Save 80%</span>
            </div>
          </div>
        </div>

        <p style="margin: -8px 20px 24px; text-align: center; color: #64748b; font-size: 0.88rem; line-height: 1.55;">
          <strong style="color:#1e293b;">Buying and selling basic items is 100% free</strong> — no listing fees, no commission. Paid plans just add more listings, promotion, and seller tools.
        </p>

        <!-- Plans Grid (Vertical for Mobile) -->
        <div id="pricing-list" style="display: flex; flex-direction: column; gap: 24px; padding: 0 20px;">
          ${Object.keys(plans).map(key => {
            const p = plans[key];
            const price = isAnnual ? p.priceAnnual : p.priceMonthly;
            const billedNote = key === 'free' ? 'Valid for 1 month' : (isAnnual ? 'Billed Annually' : 'Billed Monthly');
            
            return `
              <div style="background:#fff; border-radius: 24px; border: 2px solid ${p.isPopular ? '#1e293b' : '#f1f5f9'}; overflow: hidden; position: relative; box-shadow: 0 4px 20px rgba(0,0,0,0.04); display: flex; flex-direction: column;">
                ${p.isPopular ? `<div style="position:absolute; top: 0; right: 0; background: linear-gradient(135deg, #f59e0b, #ef4444); color: #fff; font-size: 0.7rem; font-weight: 800; padding: 6px 16px; border-bottom-left-radius: 14px; text-transform: uppercase;">🔥 Most Popular</div>` : ''}
                
                <div style="padding: 30px 24px; text-align: center; background: ${key === 'free' ? '#f8fafc' : (key === 'premium' ? '#334155' : '#1e293b')}; color: ${key === 'free' ? '#1e293b' : '#fff'};">
                    <div style="font-size: 1.1rem; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px; margin-bottom: 8px;">
                        <span>${p.icon}</span> ${p.name}
                    </div>
                    <div style="font-size: 2.8rem; font-weight: 900; line-height: 1;">$${price}<span style="font-size: 1rem; font-weight: 500; opacity: 0.8;">/mo</span></div>
                    <div style="font-size: 0.8rem; opacity: 0.8; margin-top: 6px; font-weight: 600;">${billedNote}</div>
                </div>

                <div style="padding: 24px; flex: 1;">
                    <ul style="list-style: none; padding: 0; margin: 0 0 24px; display: flex; flex-direction: column; gap: 12px;">
                      ${p.highlights.map(text => `
                            <li style="display: flex; align-items: flex-start; gap: 10px; font-size: 0.9rem; color: #475569; font-weight: 600;">
                                <span style="color: #22c55e; font-weight: 900; margin-top: 1px;">✓</span>
                                <span>${text}</span>
                            </li>
                        `).join('')}
                    </ul>
                    <a href="#mobile-compare-plans" style="display:inline-flex; margin: -8px 0 18px; color:#64748b; font-size:0.82rem; font-weight:700; text-decoration:none;">See full comparison ↓</a>
                    <button class="mobile-btn pricing-cta" data-plan="${key}" style="
                        background: ${key === 'free' ? '#f1f5f9' : (key === 'premium' ? '#334155' : '#1e293b')}; 
                        color: ${key === 'free' ? '#1e293b' : '#fff'}; 
                        height: 52px; font-size: 1rem; font-weight: 800; border-radius: 16px; border: none; width: 100%; cursor: pointer;">
                      ${p.ctaText}
                    </button>
                </div>
              </div>
            `;
          }).join('')}
        </div>

        <section id="mobile-compare-plans" style="padding: 48px 20px 8px;">
          <h3 style="text-align:center; font-size:1.35rem; font-weight:900; color:#1e293b; margin:0 0 20px;">Compare Plans</h3>
          <div style="overflow-x:auto; background:#fff; border:1px solid #e2e8f0; border-radius:16px; box-shadow:0 4px 18px rgba(15,23,42,0.04);">
            <table style="width:100%; min-width:620px; border-collapse:collapse; font-size:0.78rem;">
              <thead>
                <tr>
                  <th style="text-align:left; padding:13px; background:#f8fafc; color:#1e293b;">Feature</th>
                  <th style="padding:13px; background:#f8fafc; color:#1e293b;">Free</th>
                  <th style="padding:13px; background:#f8fafc; color:#334155;">Premium</th>
                  <th style="padding:13px; background:#f8fafc; color:#1e293b;">Pro</th>
                </tr>
              </thead>
              <tbody>
                ${renderMobileCompareRows()}
              </tbody>
            </table>
          </div>
        </section>

        <!-- FAQ Section -->
        <div style="padding: 60px 20px 40px;">
            <h3 style="text-align: center; font-size: 1.4rem; font-weight: 900; color: #1e293b; margin-bottom: 24px;">Frequently Asked Questions</h3>
            <div style="display: flex; flex-direction: column; gap: 16px;">
                ${[
                    { q: 'Can I switch plans anytime?', a: 'Yes! Upgrade, downgrade, or cancel anytime from your settings. Upgrades are prorated.' },
                    { q: 'Is there a money-back guarantee?', a: 'We offer a 7-day money-back guarantee if you are not completely satisfied.' },
                    { q: 'What happens if I downgrade?', a: 'Your most recent listings remain active up to the new limit; others are paused.' },
                    { q: 'Is it free to sell items on RoommateGroups?', a: 'Yes. Listing and selling items is completely free on every plan, with no listing fees or commission. Paid plans add more active listings, promote credits, and a verified seller badge.' },
                    { q: 'What are promote credits?', a: 'Promote credits let you boost an item to the top of search and category results for more visibility. Premium and Pro include monthly credits; anyone can also buy a one-off boost.' },
                    { q: 'Do I need a paid plan to buy things?', a: 'No. Browsing, chatting with sellers, and making offers are free for everyone.' }
                ].map(faq => `
                    <div style="background: #fff; padding: 20px; border-radius: 16px; border: 1px solid #f1f5f9;">
                        <div style="font-size: 0.95rem; font-weight: 800; color: #1e293b; margin-bottom: 8px;">${faq.q}</div>
                        <div style="font-size: 0.85rem; color: #64748b; line-height: 1.5;">${faq.a}</div>
                    </div>
                `).join('')}
            </div>
        </div>

        <!-- Footer CTA -->
        <div style="margin: 20px; background: linear-gradient(135deg, #000000, #334155); border-radius: 24px; padding: 40px 20px; text-align: center; color: white;">
            <h2 style="font-size: 1.5rem; font-weight: 900; margin-bottom: 12px;">Still not sure?</h2>
            <p style="font-size: 0.9rem; opacity: 0.9; margin-bottom: 24px;">Start free — no credit card required to browse listings and connect.</p>
            <button id="mobile-pricing-footer-cta" style="background: #fff; color: #000000; border: none; font-weight: 800; padding: 14px 32px; border-radius: 14px; font-size: 1rem;">Create Free Account</button>
        </div>

      </div>
    `;

    _wire();
  }

  async function _wire() {
    const { navigate } = await getMobile();

    // Events
    container.querySelectorAll('.toggle-opt').forEach(opt => {
        opt.addEventListener('click', () => {
            isAnnual = opt.dataset.val === 'annual';
            _render();
        });
    });

    container.querySelectorAll('.pricing-cta').forEach(btn => {
      btn.addEventListener('click', () => {
        const planId = btn.dataset.plan;
        const p = plans[planId];
        if (planId === 'free') {
          navigate(user ? 'dashboard' : 'auth');
          return;
        }
        const stripeUrl = isAnnual ? p.annualUrl : p.monthlyUrl;
        if (stripeUrl) {
          const finalUrl = user?.email ? `${stripeUrl}?prefilled_email=${encodeURIComponent(user.email)}` : stripeUrl;
          window.open(finalUrl, '_blank');
        }
      });
    });

    container.querySelector('#mobile-pricing-footer-cta')?.addEventListener('click', () => {
        navigate(user ? 'dashboard' : 'auth');
    });
  }

  _render();
}

export const renderMobilePricing = init;
