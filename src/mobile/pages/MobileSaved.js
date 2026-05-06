/**
 * src/mobile/pages/MobileSaved.js
 * Full list of saved listings for mobile.
 */

import { db } from '../../services/db.js';
import { getCurrentUser } from '../../services/auth.js';
import { renderMobileCard, attachMobileCardEvents } from '../components/MobileCard.js';
import { navigate, updateHeader } from '../mobile-main.js';

export async function init(container) {
  const user = getCurrentUser();
  if (!user) {
    navigate('auth');
    return;
  }

  updateHeader({ title: 'Saved Listings', showBack: true });

  const savedIds = user.saved_listings || [];
  const savedListings = savedIds.map(id => db.listings?.findById?.(id)).filter(Boolean);

  function _render() {
    if (savedListings.length === 0) {
      container.innerHTML = `
        <div class="mobile-empty" style="padding: 100px 24px; text-align: center;">
          <div style="font-size: 3rem; margin-bottom: 16px;">🤍</div>
          <div style="font-size: 1.2rem; font-weight: 800; color: #1e293b; margin-bottom: 8px;">No saved listings</div>
          <div style="font-size: 0.9rem; color: #94a3b8; line-height: 1.5;">Tap the heart icon on any listing to save it for later.</div>
          <button id="browse-btn" class="mobile-btn mobile-btn-accent" style="margin-top: 24px; width: auto; padding: 12px 32px;">Browse Listings</button>
        </div>
      `;
      container.querySelector('#browse-btn')?.addEventListener('click', () => navigate('home'));
      return;
    }

    container.innerHTML = `
      <div style="padding: 16px; background: #f8fafc; min-height: 100%;">
        <div id="saved-feed" style="display: flex; flex-direction: column; gap: 16px;">
          ${savedListings.map(l => renderMobileCard(l)).join('')}
        </div>
      </div>
    `;

    const feed = container.querySelector('#saved-feed');
    if (feed) {
      attachMobileCardEvents(feed, (id) => navigate('listing', { id }));
    }
  }

  _render();
}

export const renderMobileSaved = init;
