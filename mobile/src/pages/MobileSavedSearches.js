/**
 * src/mobile/pages/MobileSavedSearches.js
 * Saved searches list for mobile.
 */

import { getCurrentUser } from '../../../web/src/services/auth.js';
import { db } from '../../../web/src/services/db.js';
import { showBottomSheet } from '../components/BottomSheet.js';

async function getMobile() { return await import('../mobile-main.js'); }

export async function init(container) {
  const user = getCurrentUser();
  if (!user) {
    (await getMobile()).navigate('auth');
    return;
  }

  const { updateHeader, goBack, navigate } = await getMobile();
  updateHeader({ title: 'Saved Searches', showBack: true, onBack: goBack });

  const dbUser = db.users.findById(user.user_id || user.id);
  const searches = dbUser?.saved_searches || [];

  function _render() {
    if (searches.length === 0) {
        container.innerHTML = `
            <div class="mobile-empty" style="padding: 100px 24px; text-align: center;">
                <div style="font-size: 3rem; margin-bottom: 16px;">🔔</div>
                <div style="font-size: 1.2rem; font-weight: 800; color: #1e293b; margin-bottom: 8px;">No saved searches</div>
                <div style="font-size: 0.9rem; color: #94a3b8; line-height: 1.5;">Save a search to get notified when new matching listings are posted.</div>
                <button id="browse-btn" class="mobile-btn mobile-btn-accent" style="margin-top: 24px; width: auto; padding: 12px 32px;">Start Searching</button>
            </div>
        `;
        container.querySelector('#browse-btn')?.addEventListener('click', () => navigate('search'));
        return;
    }

    container.innerHTML = `
      <div style="padding: 20px; background: #f8fafc; min-height: 100%;">
        <div style="display: flex; flex-direction: column; gap: 16px;">
            ${searches.map((s, idx) => `
                <div style="background: #fff; border-radius: 24px; padding: 20px; border: 1px solid #f1f5f9; box-shadow: 0 4px 15px rgba(0,0,0,0.03);">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px;">
                        <div>
                            <div style="font-size: 1rem; font-weight: 800; color: #1e293b;">${s.name || 'Saved Search'}</div>
                            <div style="font-size: 0.8rem; color: #64748b; margin-top: 2px;">📍 ${s.city || 'Any Location'}</div>
                        </div>
                        <button class="delete-search-btn" data-idx="${idx}" style="background: none; border: none; color: #cbd5e1; font-size: 1.2rem; padding: 0;">×</button>
                    </div>
                    
                    <div style="display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 16px;">
                        ${_renderChips(s.queryStr || '')}
                    </div>

                    <div style="display: flex; align-items: center; justify-content: space-between;">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <div style="width: 36px; height: 20px; border-radius: 10px; background: ${s.notify ? '#1a1a1a' : '#e2e8f0'}; position: relative;">
                                <div style="width: 14px; height: 14px; border-radius: 50%; background: #fff; position: absolute; top: 3px; ${s.notify ? 'right: 3px' : 'left: 3px'};"></div>
                            </div>
                            <span style="font-size: 0.75rem; font-weight: 600; color: #64748b;">Email alerts</span>
                        </div>
                        <button class="mobile-btn" style="width: auto; padding: 8px 16px; min-height: unset; font-size: 0.8rem; background: #f8fafc; border: 1px solid #e2e8f0; color: #1a1a1a;">
                            Search Now
                        </button>
                    </div>
                </div>
            `).join('')}
        </div>
      </div>
    `;

    // Events
    container.querySelectorAll('.delete-search-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const idx = parseInt(btn.dataset.idx);
            showBottomSheet({
                title: 'Delete Search',
                content: `
                    <div style="padding: 10px 0; text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 16px;">🗑️</div>
                        <div style="font-size: 1.1rem; font-weight: 800; color: #1e293b; margin-bottom: 8px;">Delete this saved search?</div>
                        <div style="font-size: 0.9rem; color: #64748b; line-height: 1.5;">You will no longer receive notifications for new listings matching this search criteria.</div>
                    </div>
                `,
                actions: [
                    { 
                        label: 'Yes, Delete', 
                        variant: 'danger', 
                        onClick: async () => {
                            const newSearches = [...searches];
                            newSearches.splice(idx, 1);
                            await db.users.update(dbUser.user_id, { saved_searches: newSearches });
                            init(container); // Re-render local page
                        }
                    },
                    { label: 'Cancel', variant: 'outline', onClick: () => {} }
                ]
            });
        });
    });
  }

  function _renderChips(queryStr) {
      const params = new URLSearchParams(queryStr);
      const chips = [];
      if (params.get('minPrice') || params.get('maxPrice')) {
          chips.push(`$${params.get('minPrice') || 0} - $${params.get('maxPrice') || '∞'}`);
      }
      if (params.get('room_type')) chips.push(params.get('room_type').replace('_', ' '));
      
      return chips.map(c => `
        <span style="background: #f1f5f9; color: #475569; font-size: 0.7rem; font-weight: 700; padding: 4px 10px; border-radius: 8px; text-transform: capitalize;">${c}</span>
      `).join('');
  }

  _render();
}

export const renderMobileSavedSearches = init;
