/**
 * src/mobile/pages/MobilePricing.js
 * Pricing plans adapted for mobile view, mirroring the website's detailed plans and functional logic.
 */

import { getCurrentUser } from '../../services/auth.js';

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
      features: [
        { name: 'Active Listings', value: '1 Listing' },
        { name: 'Messaging', value: '5 msgs/day' },
        { name: 'Verified Badge', included: false },
        { name: 'Listing Visibility', value: 'Standard' },
        { name: 'Social Community', value: 'View only' },
        { name: 'Priority Support', value: 'Standard (48h)' }
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
      features: [
        { name: 'Active Listings', value: '3 Listings' },
        { name: 'Messaging', value: 'Unlimited Messaging' },
        { name: 'Verified Badge', included: true },
        { name: 'Listing Visibility', value: '2x Boosted' },
        { name: 'Social Community', value: 'Post & Comment' },
        { name: 'Priority Support', value: 'Priority (24h)' }
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
      features: [
        { name: 'Active Listings', value: '5 Listings' },
        { name: 'Messaging', value: 'Unlimited + Read Receipts' },
        { name: 'Verified Badge', value: 'Gold Badge', included: true },
        { name: 'Listing Visibility', value: '5x Top Ranking' },
        { name: 'Social Community', value: 'Full Access' },
        { name: 'Priority Support', value: 'VIP (4h)' }
      ]
    }
  };

  function _render() {
    container.innerHTML = `
      <div style="padding: 0; background: #f8fafc; min-height: 100%; padding-bottom: 60px; font-family: 'Inter', sans-serif;">
        
        <!-- Hero Section -->
        <div style="text-align: center; padding: 40px 20px 30px;">
          <h2 style="font-size: 1.8rem; font-weight: 900; color: #1e293b; margin-bottom: 12px; letter-spacing: -0.02em;">Simple, Transparent Pricing</h2>
          <p style="font-size: 0.95rem; color: #64748b; line-height: 1.5; max-width: 280px; margin: 0 auto 24px;">Find your perfect roommate. Upgrade or cancel anytime.</p>
          
          <!-- Billing Toggle -->
          <div style="display: inline-flex; align-items: center; background: #f1f5f9; border-radius: 30px; padding: 4px; position: relative; cursor: pointer;" id="mobile-billing-toggle">
            <div id="toggle-indicator" style="position: absolute; top: 4px; bottom: 4px; width: calc(50% - 4px); background: white; border-radius: 26px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 1; transform: ${isAnnual ? 'translateX(100%)' : 'translateX(0)'};"></div>
            <div class="toggle-opt ${!isAnnual ? 'active' : ''}" data-val="monthly" style="padding: 8px 20px; border-radius: 26px; font-weight: 700; font-size: 0.85rem; color: ${!isAnnual ? '#1e293b' : '#64748b'}; position: relative; z-index: 2; transition: color 0.3s;">Monthly</div>
            <div class="toggle-opt ${isAnnual ? 'active' : ''}" data-val="annual" style="padding: 8px 20px; border-radius: 26px; font-weight: 700; font-size: 0.85rem; color: ${isAnnual ? '#1e293b' : '#64748b'}; position: relative; z-index: 2; transition: color 0.3s;">
                Annually <span style="position: absolute; top: -10px; right: -10px; background: #22c55e; color: white; font-size: 0.6rem; font-weight: 800; padding: 2px 6px; border-radius: 10px; text-transform: uppercase;">Save 80%</span>
            </div>
          </div>
        </div>

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
                      ${p.features.map(f => {
                        const isIncluded = f.included !== false;
                        return `
                            <li style="display: flex; align-items: flex-start; gap: 10px; font-size: 0.88rem; color: ${isIncluded ? '#475569' : '#94a3b8'}; font-weight: 500;">
                                <span style="color: ${isIncluded ? '#22c55e' : '#ef4444'}; font-weight: 900; margin-top: 2px;">${isIncluded ? '✓' : '×'}</span>
                                <div>
                                    <span style="font-weight: 700; display: block; color: #1e293b;">${f.name}</span>
                                    <span style="font-size: 0.75rem;">${f.value || (isIncluded ? 'Included' : 'Not included')}</span>
                                </div>
                            </li>
                        `;
                      }).join('')}
                    </ul>
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

        <!-- FAQ Section -->
        <div style="padding: 60px 20px 40px;">
            <h3 style="text-align: center; font-size: 1.4rem; font-weight: 900; color: #1e293b; margin-bottom: 24px;">Frequently Asked Questions</h3>
            <div style="display: flex; flex-direction: column; gap: 16px;">
                ${[
                    { q: 'Can I switch plans anytime?', a: 'Yes! Upgrade, downgrade, or cancel anytime from your settings. Upgrades are prorated.' },
                    { q: 'Is there a money-back guarantee?', a: 'We offer a 7-day money-back guarantee if you are not completely satisfied.' },
                    { q: 'What happens if I downgrade?', a: 'Your most recent listings remain active up to the new limit; others are paused.' }
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
