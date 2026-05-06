/**
 * src/mobile/pages/MobileVerification.js
 * Trust & Verification page for mobile.
 */

import { getCurrentUser } from '../../services/auth.js';
import { db } from '../../services/db.js';
import { navigate, updateHeader, goBack } from '../mobile-main.js';

export async function init(container) {
    const user = getCurrentUser();
    if (!user) {
        navigate('auth');
        return;
    }

    updateHeader({ title: 'Trust & Verification', showBack: true, onBack: goBack });

    const dbUser = db.users.findById(user.user_id || user.id);
    if (!dbUser) return;

    const emailVerified = true;
    const phoneVerified = dbUser.phone_verified || dbUser.verification_level === 'phone' || dbUser.verification_level === 'id' || dbUser.verification_level === 'community';
    const idVerified = dbUser.id_verified || dbUser.id_status === 'approved' || dbUser.verification_level === 'id' || dbUser.verification_level === 'community';
    const idPending = dbUser.id_status === 'pending';
    const communityVerified = dbUser.community_verified || dbUser.verification_level === 'community';
    
    let currentLevel = 1;
    if (emailVerified) currentLevel = 2;
    if (phoneVerified) currentLevel = 3;
    if (idVerified || idPending) currentLevel = 4;
    if (communityVerified) currentLevel = 5;

    function _render() {
        container.innerHTML = `
            <div style="padding: 20px; background: #f8fafc; min-height: 100%; padding-bottom: 40px;">
                <p style="font-size: 0.85rem; color: #64748b; margin-bottom: 24px; line-height: 1.5;">Build trust in the community by completing your verification levels.</p>

                <!-- Progress Tracker -->
                <div style="display: flex; justify-content: space-between; position: relative; margin-bottom: 32px; padding: 0 10px;">
                    <div style="position: absolute; top: 18px; left: 10%; right: 10%; height: 2px; background: #e2e8f0; z-index: 0;">
                        <div style="height: 100%; background: #1a1a1a; width: ${((currentLevel - 1) / 4) * 100}%; transition: width 0.3s;"></div>
                    </div>
                    ${_renderStep(1, '📧', 'Email', currentLevel >= 1)}
                    ${_renderStep(2, '📱', 'Phone', currentLevel >= 2)}
                    ${_renderStep(3, '🆔', 'ID', currentLevel >= 3)}
                    ${_renderStep(4, '⭐', 'Trust', currentLevel >= 4)}
                </div>

                <!-- Accordion -->
                <div style="display: flex; flex-direction: column; gap: 12px;">
                    ${_renderPanel('Level 1: Email Verification', '📧', 'Your primary email is verified.', emailVerified, true)}
                    ${_renderPanel('Level 2: Phone Verification', '📱', 'Verify your phone number via SMS.', phoneVerified, currentLevel === 2)}
                    ${_renderPanel('Level 3: ID Verification', '🛡️', 'Government ID & selfie match.', idVerified, currentLevel === 3, idPending)}
                    ${_renderPanel('Level 4: Community Trust', '🤝', 'Earned from positive reviews.', communityVerified, currentLevel === 4)}
                </div>

                ${!communityVerified ? `
                    <div style="margin-top: 32px; background: #fff; border-radius: 20px; padding: 20px; border: 1px solid #f1f5f9;">
                        <h4 style="font-size: 0.9rem; font-weight: 800; color: #1e293b; margin-bottom: 8px;">Why verify?</h4>
                        <ul style="padding-left: 20px; margin: 0; font-size: 0.85rem; color: #64748b; line-height: 1.6;">
                            <li>Get 3x more messages from potential roommates.</li>
                            <li>Priority placement in search results.</li>
                            <li>Exclusive verified-only badge on your profile.</li>
                        </ul>
                    </div>
                ` : ''}
            </div>
        `;
    }

    function _renderStep(lvl, icon, label, active) {
        return `
            <div style="display: flex; flex-direction: column; align-items: center; gap: 8px; z-index: 1;">
                <div style="width: 36px; height: 36px; border-radius: 50%; background: ${active ? '#1a1a1a' : '#fff'}; color: ${active ? '#fff' : '#cbd5e1'}; border: 2px solid ${active ? '#1a1a1a' : '#e2e8f0'}; display: flex; align-items: center; justify-content: center; font-size: 0.9rem; font-weight: 700; box-shadow: 0 4px 10px rgba(0,0,0,0.05);">
                    ${active ? '✓' : lvl}
                </div>
                <span style="font-size: 0.65rem; font-weight: 700; color: ${active ? '#1e293b' : '#94a3b8'};">${label}</span>
            </div>
        `;
    }

    function _renderPanel(title, icon, desc, completed, active, pending = false) {
        return `
            <div style="background: #fff; border-radius: 20px; border: 1px solid ${active ? '#1a1a1a' : '#f1f5f9'}; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                <div style="padding: 16px; display: flex; align-items: center; gap: 12px;">
                    <div style="width: 40px; height: 40px; border-radius: 12px; background: #f8fafc; display: flex; align-items: center; justify-content: center; font-size: 1.2rem;">${icon}</div>
                    <div style="flex: 1;">
                        <div style="font-size: 0.9rem; font-weight: 800; color: #1e293b;">${title}</div>
                        <div style="font-size: 0.75rem; color: #64748b;">${desc}</div>
                    </div>
                    ${completed 
                        ? `<span style="color: #10b981; font-size: 1.1rem;">✓</span>` 
                        : pending 
                            ? `<span style="color: #f59e0b; font-size: 0.7rem; font-weight: 800; background: #fffbeb; padding: 4px 8px; border-radius: 8px;">PENDING</span>`
                            : active 
                                ? `<button style="background: #1a1a1a; color: white; border: none; padding: 6px 12px; border-radius: 10px; font-size: 0.75rem; font-weight: 700;">Start</button>`
                                : `<span style="color: #cbd5e1;">🔒</span>`
                    }
                </div>
            </div>
        `;
    }

    _render();
}

export const renderMobileVerification = init;
