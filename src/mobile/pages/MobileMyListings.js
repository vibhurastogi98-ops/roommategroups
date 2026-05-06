/**
 * src/mobile/pages/MobileMyListings.js
 * Full list of user's own listings for mobile with status filters.
 * Mirrored from the web dashboard "My Listings" view.
 */

import { db } from '../../services/db.js';
import { getCurrentUser } from '../../services/auth.js';
import { renderMobileCard, attachMobileCardEvents } from '../components/MobileCard.js';

async function getMobile() { return await import('../mobile-main.js'); }

export async function init(container) {
  const user = getCurrentUser();
  if (!user) {
    (await getMobile()).navigate('auth');
    return;
  }

  const { updateHeader, goBack, navigate } = await getMobile();
  updateHeader({ title: 'My Listings', showBack: true, onBack: goBack });

  const allListings = (db.listings?.findAll?.() || []).filter(l =>
    (l.user_id === user.user_id || l.user_id === user.id)
  ).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  let activeFilter = 'all'; // 'all' | 'active' | 'paused'

  function _render() {
    const filtered = allListings.filter(l => {
        if (activeFilter === 'active') return l.status === 'active' || l.is_active !== false;
        if (activeFilter === 'paused') return l.status === 'paused' || l.is_active === false;
        return true;
    });

    const activeCount = allListings.filter(l => l.status === 'active' || l.is_active !== false).length;
    const pausedCount = allListings.filter(l => l.status === 'paused' || l.is_active === false).length;

    container.innerHTML = `
      <div style="padding: 16px; background: #f8fafc; min-height: 100%; padding-bottom: 40px;">
        
        <!-- Filter Tabs -->
        <div style="display: flex; gap: 8px; margin-bottom: 20px; overflow-x: auto; padding-bottom: 4px; scrollbar-width: none;">
            ${_renderTab('all', `All (${allListings.length})`, activeFilter === 'all')}
            ${_renderTab('active', `Active (${activeCount})`, activeFilter === 'active')}
            ${_renderTab('paused', `Paused (${pausedCount})`, activeFilter === 'paused')}
        </div>

        ${filtered.length === 0 ? `
            <div class="mobile-empty" style="padding: 60px 24px; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 16px;">🏠</div>
                <div style="font-size: 1.2rem; font-weight: 800; color: #1e293b; margin-bottom: 8px;">No listings found</div>
                <div style="font-size: 0.9rem; color: #94a3b8; line-height: 1.5;">${activeFilter === 'all' ? "You haven't posted any listings yet." : `No ${activeFilter} listings found.`}</div>
                ${activeFilter === 'all' ? `<button id="post-btn-empty" class="mobile-btn mobile-btn-accent" style="margin-top: 24px; width: auto; padding: 12px 32px;">Post a Listing</button>` : ''}
            </div>
        ` : `
            <div id="my-feed" style="display: flex; flex-direction: column; gap: 16px;">
                ${filtered.map(l => renderMobileCard(l)).join('')}
            </div>
        `}
      </div>
    `;

    // Events
    container.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            activeFilter = tab.dataset.filter;
            _render();
        });
    });

    container.querySelector('#post-btn-empty')?.addEventListener('click', () => navigate('post'));

    const feed = container.querySelector('#my-feed');
    if (feed) {
      attachMobileCardEvents(feed, (id) => navigate('listing', { id }));
    }
  }

  function _renderTab(id, label, active) {
      return `
        <button class="filter-tab" data-filter="${id}" style="
            background: ${active ? '#1a1a1a' : '#fff'};
            color: ${active ? '#fff' : '#64748b'};
            border: 1px solid ${active ? '#1a1a1a' : '#e2e8f0'};
            padding: 8px 16px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: 700;
            white-space: nowrap;
            cursor: pointer;
            transition: all 0.2s;
        ">${label}</button>
      `;
  }

  _render();
}

export const renderMobileMyListings = init;
