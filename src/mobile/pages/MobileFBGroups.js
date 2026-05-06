/**
 * src/mobile/pages/MobileFBGroups.js
 * Facebook Groups directory for mobile.
 */

import { db } from '../../services/db.js';
import { navigate } from '../mobile-main.js';

export async function init(container) {
  const allCountries = db.fb_countries.findAll();
  const allCities    = db.fb_cities.findAll();

  function _render() {
    container.innerHTML = `
      <div style="background: #f8fafc; min-height: 100%;">
        <!-- Hero Header -->
        <div style="background: linear-gradient(135deg, #1e293b, #0f172a); padding: 32px 20px; text-align: center; color: #fff;">
          <div style="width: 48px; height: 48px; background: rgba(255,255,255,0.1); border-radius: 12px; display: flex; align-items: center; justify-content: center; margin: 0 auto 16px;">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
          </div>
          <h2 style="font-size: 1.4rem; font-weight: 900; margin-bottom: 8px; letter-spacing: -0.02em;">FB Communities</h2>
          <p style="font-size: 0.85rem; opacity: 0.9; max-width: 280px; margin: 0 auto; line-height: 1.5;">Connect with thousands of locals in our curated Facebook groups.</p>
        </div>

        <div style="padding: 16px;">
          ${allCountries.map(country => {
            const cities = allCities.filter(c => c.country_id === country.fb_country_id);
            if (cities.length === 0) return '';
            return `
              <div style="margin-bottom: 24px;">
                <div style="font-size: 0.72rem; font-weight: 800; color: #94a3b8; letter-spacing: 0.06em; text-transform: uppercase; margin-bottom: 12px; display: flex; align-items: center; gap: 8px;">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg> ${country.country_name}
                </div>
                <div style="display: flex; flex-direction: column; gap: 10px;">
                  ${cities.map(city => `
                    <div class="fb-group-row" data-id="${city.fb_city_id}" style="background: #fff; border-radius: 14px; padding: 14px; display: flex; align-items: center; gap: 14px; border: 1px solid #f1f5f9; cursor: pointer;">
                      <div style="width: 44px; height: 44px; border-radius: 10px; background: #1877f2; display: flex; align-items: center; justify-content: center; color: #fff; font-size: 1.2rem;">
                        <i class="fab fa-facebook-f"></i>
                      </div>
                      <div style="flex: 1;">
                        <div style="font-size: 0.95rem; font-weight: 800; color: var(--text-primary);">${city.city_name}</div>
                        <div style="font-size: 0.75rem; color: #94a3b8; font-weight: 500;">${(city.total_members||0).toLocaleString()} Members</div>
                      </div>
                      <div style="color: #cbd5e1; font-size: 1.2rem;">›</div>
                    </div>
                  `).join('')}
                </div>
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `;

    // Attach events
    container.querySelectorAll('.fb-group-row').forEach(row => {
      row.addEventListener('click', () => {
        const id = row.dataset.id;
        navigate('fbGroupDetail', { id });
      });
    });
  }

  _render();
}

export const renderMobileFBGroups = init;
