/**
 * src/mobile/pages/MobileSettings.js
 * Account settings and profile editing for mobile.
 * Mirrored from the web dashboard settings.
 */

import { getCurrentUser, logout } from '../../services/auth.js';
import { db } from '../../services/db.js';
import { updateHeader, navigate, goBack } from '../mobile-main.js';

export async function init(container) {
  const user = getCurrentUser();
  if (!user) {
    navigate('auth');
    return;
  }

  updateHeader({ title: 'Settings', showBack: true, onBack: goBack });

  const dbUser = db.users.findById(user.user_id || user.id);
  if (!dbUser) return;

  function _render() {
    container.innerHTML = `
      <div style="padding: 20px; background: #f8fafc; min-height: 100%; padding-bottom: 60px;">
        
        <!-- Profile Header -->
        <div style="display: flex; align-items: center; gap: 16px; margin-bottom: 32px; background: #fff; padding: 20px; border-radius: 24px; border: 1px solid #f1f5f9;">
            <div style="position: relative;">
                <img src="${dbUser.profile_photo || `https://ui-avatars.com/api/?name=${encodeURIComponent(dbUser.display_name)}&background=1B4F72&color=fff`}" style="width: 72px; height: 72px; border-radius: 50%; object-fit: cover; border: 2px solid #f1f5f9;">
                <div style="position: absolute; bottom: 0; right: 0; background: #1a1a1a; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.7rem; border: 2px solid #fff;">📸</div>
            </div>
            <div>
                <div style="font-size: 1.1rem; font-weight: 800; color: #1e293b;">${dbUser.display_name}</div>
                <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">${dbUser.email}</div>
                <div style="font-size: 0.7rem; color: #000000; font-weight: 700; text-transform: uppercase; margin-top: 4px; letter-spacing: 0.05em;">${dbUser.subscription_tier || 'Free'} Plan</div>
            </div>
        </div>

        <!-- Sections -->
        <div style="display: flex; flex-direction: column; gap: 24px;">
            
            <!-- Public Profile -->
            <div>
                <h3 style="${_sectionTitleStyle}">Public Profile</h3>
                <div style="${_cardStyle}">
                    ${_settingsRow('👤', 'Display Name', dbUser.display_name)}
                    ${_settingsRow('📝', 'Bio', dbUser.bio || 'Not set')}
                    ${_settingsRow('📍', 'Location', `${dbUser.city || ''}, ${dbUser.country || ''}`.replace(/^, /, ''))}
                    ${_settingsRow('💼', 'Occupation', dbUser.occupation || 'Not set')}
                </div>
            </div>

            <!-- Preferences -->
            <div>
                <h3 style="${_sectionTitleStyle}">Preferences</h3>
                <div style="${_cardStyle}">
                    ${_settingsRow('🏷️', 'Lifestyle Tags', `${(dbUser.lifestyle_tags || []).length} tags`)}
                    ${_settingsRow('💰', 'Monthly Budget', `$${dbUser.budgetMin || 0} - $${dbUser.budgetMax || 5000}`)}
                    ${_settingsRow('📅', 'Move-in Timeline', dbUser.moveInTimeline || 'Flexible')}
                </div>
            </div>

            <!-- Notifications -->
            <div>
                <h3 style="${_sectionTitleStyle}">Notifications</h3>
                <div style="${_cardStyle}">
                    ${_toggleRow('🔔', 'Messages', dbUser.notification_prefs?.messages !== false)}
                    ${_toggleRow('✨', 'Listing Matches', dbUser.notification_prefs?.matches !== false)}
                    ${_toggleRow('📉', 'Price Drops', dbUser.notification_prefs?.price_drops !== false)}
                </div>
            </div>

            <!-- Account -->
            <div>
                <h3 style="${_sectionTitleStyle}">Account</h3>
                <div style="${_cardStyle}">
                    ${_settingsRow('🔒', 'Privacy Settings', dbUser.profile_visibility || 'Everyone')}
                    ${_settingsRow('💳', 'Subscription', 'Manage Plan')}
                    ${_settingsRow('🚪', 'Log Out', '', false, true)}
                </div>
            </div>

            <!-- Danger Zone -->
            <div style="margin-top: 12px;">
                <button id="delete-account-btn" style="width: 100%; background: #fff; border: 1.5px solid #fee2e2; color: #ef4444; padding: 16px; border-radius: 16px; font-weight: 700; font-size: 0.9rem;">
                    Delete My Account
                </button>
            </div>

        </div>
      </div>
    `;

    // Events
    container.querySelector('#delete-account-btn')?.addEventListener('click', () => {
        if (confirm('Are you sure? This will permanently delete your account.')) {
            // In a real app, call API. For now, logout.
            logout();
            navigate('auth');
        }
    });

    container.querySelectorAll('.settings-row').forEach(row => {
        row.addEventListener('click', () => {
            const label = row.dataset.label;
            if (label === 'Log Out') {
                logout();
                navigate('auth');
            } else if (label === 'Subscription') {
                navigate('pricing');
            } else {
                // In a real app, open a sub-page or modal
                alert(`Editing ${label} is coming soon to mobile!`);
            }
        });
    });
  }

  const _sectionTitleStyle = `font-size: 0.72rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 12px; padding-left: 4px;`;
  const _cardStyle = `background: #fff; border-radius: 24px; border: 1px solid #f1f5f9; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.03);`;

  function _settingsRow(icon, label, value, showChevron = true, isDanger = false) {
    return `
      <div class="settings-row" data-label="${label}" style="display: flex; align-items: center; gap: 16px; padding: 16px; cursor: pointer; border-bottom: 1px solid #f8fafc;">
        <div style="width: 32px; height: 32px; border-radius: 10px; background: #f8fafc; display: flex; align-items: center; justify-content: center; font-size: 1rem;">${icon}</div>
        <div style="flex: 1;">
            <div style="font-size: 0.9rem; font-weight: 700; color: ${isDanger ? '#ef4444' : '#334155'};">${label}</div>
            ${value ? `<div style="font-size: 0.75rem; color: #94a3b8; margin-top: 1px;">${value}</div>` : ''}
        </div>
        ${showChevron ? `<span style="color: #cbd5e1; font-size: 1rem;">›</span>` : ''}
      </div>
    `;
  }

  function _toggleRow(icon, label, checked) {
    return `
      <div style="display: flex; align-items: center; gap: 16px; padding: 16px; border-bottom: 1px solid #f8fafc;">
        <div style="width: 32px; height: 32px; border-radius: 10px; background: #f8fafc; display: flex; align-items: center; justify-content: center; font-size: 1rem;">${icon}</div>
        <div style="flex: 1; font-size: 0.9rem; font-weight: 700; color: #334155;">${label}</div>
        <div style="width: 44px; height: 24px; border-radius: 12px; background: ${checked ? '#1a1a1a' : '#e2e8f0'}; position: relative; cursor: pointer;">
            <div style="width: 18px; height: 18px; border-radius: 50%; background: #fff; position: absolute; top: 3px; ${checked ? 'right: 3px' : 'left: 3px'}; transition: all 0.2s;"></div>
        </div>
      </div>
    `;
  }

  _render();
}

export const renderMobileSettings = init;
