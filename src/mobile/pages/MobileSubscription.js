/**
 * src/mobile/pages/MobileSubscription.js
 * Subscription management page for mobile, mirroring the website's design and functionality.
 */

import { getCurrentUser } from '../../services/auth.js';
import { db } from '../../services/db.js';

async function getMobile() { return await import('../mobile-main.js'); }

export async function init(container) {
  const user = getCurrentUser();
  if (!user) { (await getMobile()).navigate('auth'); return; }

  const { updateHeader, goBack, navigate } = await getMobile();

  const dbUser = db.users.findById(user.user_id || user.id);
  const tier = (dbUser?.subscription_tier || 'free').toLowerCase();
  const PORTAL_URL = 'https://billing.stripe.com/p/login/14kdTJ1l3ghc4cEdQQ';

  const PLANS = {
    free: {
      name: 'Free',
      price: '$0',
      period: 'forever',
      color: '#64748b',
      icon: '🌱',
      features: [
        '1 active listing',
        '5 messages per day',
        'Basic search & filters',
        'Standard listing visibility',
        'Standard support (48hr)'
      ]
    },
    premium: {
      name: 'Premium',
      price: '$4.99',
      period: '/month',
      color: '#6366f1',
      icon: '⭐',
      features: [
        '3 active listings',
        'Unlimited messages',
        '2x boosted visibility',
        'Verified badge',
        'Basic compatibility score',
        'Priority support (24hr)'
      ]
    },
    pro: {
      name: 'Pro',
      price: '$8.99',
      period: '/month',
      color: '#1a1a1a',
      icon: '⚡',
      features: [
        '5 active listings',
        'Unlimited messages',
        '5x top ranking placement',
        'Gold verified badge',
        'Full analytics dashboard',
        '24-hour early access',
        'VIP support (4hr)'
      ]
    },
  };

  const plan = PLANS[tier] || PLANS.free;
  const isPaid = tier !== 'free';
  const renewDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  updateHeader({
    title: 'Subscription',
    showBack: true,
    onBack: goBack,
    rightAction: isPaid ? {
      icon: `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>`,
      label: 'Manage',
      onClick: () => window.open(PORTAL_URL, '_blank'),
    } : null,
  });

  function _render() {
    container.innerHTML = `
      <div style="padding: 20px; background: #f8fafc; min-height: 100%; padding-bottom: 40px; font-family: 'Inter', sans-serif;">
        
        <!-- Current Plan Card -->
        <div style="background: white; border-radius: 24px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px rgba(0,0,0,0.03); margin-bottom: 24px; border-left: 6px solid ${plan.color};">
          <div style="display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 20px;">
            <div style="display: flex; gap: 16px; align-items: center;">
              <div style="width: 52px; height: 52px; background: ${plan.color}15; color: ${plan.color}; border-radius: 14px; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; flex-shrink: 0;">
                ${plan.icon}
              </div>
              <div>
                <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 2px;">Current Plan</div>
                <div style="display: flex; align-items: center; gap: 8px;">
                  <span style="font-size: 1.25rem; font-weight: 800; color: #1e293b;">${plan.name}</span>
                  <span style="font-size: 0.65rem; background: #f1f5f9; color: #475569; padding: 3px 8px; border-radius: 20px; font-weight: 700; border: 1px solid #e2e8f0;">ACTIVE</span>
                </div>
              </div>
            </div>
          </div>

          <div style="margin-bottom: 24px;">
            <div style="font-size: 2rem; font-weight: 900; color: #1e293b;">${plan.price}<span style="font-size: 0.95rem; font-weight: 500; color: #64748b;">${plan.period}</span></div>
            ${isPaid ? `
              <div style="margin-top: 12px; padding: 12px; background: #f8fafc; border-radius: 12px; border: 1px solid #f1f5f9;">
                <div style="font-size: 0.75rem; color: #64748b; margin-bottom: 2px;">Next billing date</div>
                <div style="font-size: 0.9rem; font-weight: 700; color: #1e293b;">${renewDate}</div>
              </div>
            ` : `
              <p style="font-size: 0.85rem; color: #64748b; margin-top: 12px; line-height: 1.5;">Upgrade to unlock more listings, unlimited messages, and powerful analytics.</p>
            `}
          </div>

          <div style="display: flex; flex-direction: column; gap: 10px;">
            ${isPaid ? `
              <button id="btn-manage-sub" style="background: white; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; font-weight: 700; font-size: 0.9rem; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
                Manage Subscription
              </button>
              <button id="btn-portal-billing" style="background: white; color: #1e293b; border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; font-weight: 700; font-size: 0.9rem; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05);">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
                Update Payment
              </button>
              <button id="btn-portal-cancel" style="background: transparent; color: #ef4444; border: none; padding: 12px; font-weight: 700; font-size: 0.85rem; width: 100%; display: flex; align-items: center; justify-content: center; gap: 6px;">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                Cancel Subscription
              </button>
            ` : `
              <button id="btn-upgrade-plans" style="background: #1e293b; color: white; border: none; border-radius: 14px; padding: 14px; font-weight: 700; font-size: 0.9rem; width: 100%; display: flex; align-items: center; justify-content: center; gap: 8px;">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                Upgrade Plan
              </button>
            `}
          </div>
        </div>

        <!-- Features Section -->
        <div style="background: white; border-radius: 24px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 15px rgba(0,0,0,0.03); margin-bottom: 24px;">
          <h3 style="font-size: 1rem; font-weight: 800; color: #1e293b; margin-bottom: 16px;">What's included in ${plan.name}</h3>
          <div style="display: flex; flex-direction: column; gap: 14px;">
            ${plan.features.map(f => `
              <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div style="width: 20px; height: 20px; border-radius: 50%; background: ${plan.color}15; color: ${plan.color}; display: flex; align-items: center; justify-content: center; flex-shrink: 0; margin-top: 2px;">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                </div>
                <span style="font-size: 0.9rem; color: #475569; font-weight: 500;">${f}</span>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- Upgrade Banner -->
        ${tier !== 'pro' ? `
          <div style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); border-radius: 24px; padding: 24px; color: white; position: relative; overflow: hidden; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
            <div style="position: relative; z-index: 2;">
              <h3 style="font-size: 1.1rem; font-weight: 800; margin-bottom: 8px;">${tier === 'free' ? 'Ready to get more?' : 'Want even more power?'}</h3>
              <p style="font-size: 0.85rem; opacity: 0.9; margin-bottom: 20px; line-height: 1.5;">
                ${tier === 'free' 
                  ? 'Upgrade to Premium or Pro to unlock unlimited messages, advanced filters, and more.' 
                  : 'Upgrade to Pro to unlock 5x ranking, full analytics, and VIP support.'}
              </p>
              <button id="btn-banner-upgrade" style="background: white; color: #1e293b; border: none; border-radius: 12px; padding: 12px 24px; font-weight: 800; font-size: 0.85rem; display: flex; align-items: center; gap: 8px;">
                Upgrade Now
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
              </button>
            </div>
            <div style="position: absolute; right: -20px; bottom: -20px; opacity: 0.1; transform: rotate(-15deg);">
              <svg width="120" height="120" viewBox="0 0 24 24" fill="currentColor"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
            </div>
          </div>
        ` : ''}

      </div>
    `;

    _wire();
  }

  function _wire() {
    container.querySelector('#btn-portal-billing')?.addEventListener('click', () => window.open(PORTAL_URL, '_blank'));
    container.querySelector('#btn-manage-sub')?.addEventListener('click', () => window.open(PORTAL_URL, '_blank'));
    container.querySelector('#btn-portal-cancel')?.addEventListener('click', () => {
      if (confirm('This will open Stripe to cancel your subscription. Continue?')) {
        window.open(PORTAL_URL, '_blank');
      }
    });
    container.querySelector('#btn-upgrade-plans')?.addEventListener('click', () => navigate('pricing'));
    container.querySelector('#btn-banner-upgrade')?.addEventListener('click', () => navigate('pricing'));
  }

  _render();
}

export const renderMobileSubscription = init;
