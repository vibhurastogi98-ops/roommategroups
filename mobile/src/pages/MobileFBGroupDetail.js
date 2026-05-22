/**
 * src/mobile/pages/MobileFBGroupDetail.js
 * Facebook Group detail screen for mobile.
 */

import { db } from '../../../web/src/services/db.js';
import { getAssetUrl } from '../../../web/src/services/assets.js';

async function getMobile() { return await import('../mobile-main.js'); }

export async function init(container, params) {
  const id = params.id;
  const group = db.fb_cities.findById(id);

  if (!group) {
    container.innerHTML = `<div style="padding:40px; text-align:center;">Group not found</div>`;
    return;
  }

  const { updateHeader } = await getMobile();
  updateHeader({ title: group.city_name, showBack: true });

  const fallback = 'https://images.unsplash.com/photo-1449844908441-8829872d2607?w=600&h=400&fit=crop';
  
  container.innerHTML = `
    <div style="background: #f8fafc; min-height: 100%; padding-bottom: 80px;">
      <!-- Hero -->
      <div style="height: 240px; position: relative;">
        <img src="${getAssetUrl(group.city_image) || fallback}" style="width:100%; height:100%; object-fit:cover;">
        <div style="position:absolute; inset:0; background:linear-gradient(to top, rgba(0,0,0,0.8), transparent);"></div>
        <div style="position:absolute; bottom:20px; left:20px; right:20px; color:#fff;">
          <h2 style="font-size: 1.5rem; font-weight: 900; margin: 0 0 4px; letter-spacing: -0.02em;">${group.fb_group_name}</h2>
          <div style="font-size: 0.85rem; font-weight: 600; opacity: 0.9;">${(group.total_members||0).toLocaleString()} members</div>
        </div>
      </div>

      <div style="padding: 24px 20px;">
        <div style="font-size: 0.72rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 12px;">ABOUT THIS COMMUNITY</div>
        <p style="font-size: 0.92rem; color: #475569; line-height: 1.6; margin-bottom: 24px;">
          ${group.description || `Join our active ${group.city_name} roommate community on Facebook. This group is dedicated to helping locals find verified rooms, roommates, and housing opportunities safely.`}
        </p>

        <!-- Stats -->
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 32px;">
          <div style="background:#fff; border: 1px solid #f1f5f9; border-radius: 16px; padding: 16px; text-align: center;">
            <div style="font-size: 1.2rem; font-weight: 800; color: #1e293b;">${Math.floor((group.total_members||0)/1000)}k+</div>
            <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Members</div>
          </div>
          <div style="background:#fff; border: 1px solid #f1f5f9; border-radius: 16px; padding: 16px; text-align: center;">
            <div style="font-size: 1.2rem; font-weight: 800; color: #1e293b;">Daily</div>
            <div style="font-size: 0.65rem; color: #94a3b8; font-weight: 700; text-transform: uppercase;">Active Posts</div>
          </div>
        </div>

        <div style="font-size: 0.72rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 16px;">COMMUNITY RULES</div>
        <div style="display: flex; flex-direction: column; gap: 12px;">
          ${[
            'No spam or irrelevant ads',
            'Be respectful to all members',
            'Report any suspicious activity',
            'No money before viewing a room'
          ].map(rule => `
            <div style="display: flex; align-items: flex-start; gap: 12px;">
              <span style="color: #000000; font-weight: 900;">•</span>
              <span style="font-size: 0.88rem; color: #475569; font-weight: 500;">${rule}</span>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Sticky Join Button -->
      <div style="position: fixed; bottom: calc(var(--mobile-bottom-nav-height) + 16px); left: 20px; right: 20px; z-index: 100;">
        <button id="join-fb-btn" class="mobile-btn" style="background: #1877f2; color: #fff; box-shadow: 0 8px 24px rgba(24,119,242,0.3); height: 52px; font-size: 1rem; font-weight: 800; gap: 10px;">
          <i class="fab fa-facebook-f"></i> Join on Facebook
        </button>
      </div>
    </div>
  `;

  container.querySelector('#join-fb-btn')?.addEventListener('click', () => {
    window.open(group.fb_group_link || 'https://facebook.com', '_blank');
  });
}

export const renderMobileFBGroupDetail = init;
