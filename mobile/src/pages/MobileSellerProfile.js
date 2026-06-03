import { api } from '../../../web/src/services/api.js';
import { getAvatarUrl } from '../../../web/src/services/assets.js';
import { getVerificationBadge } from '../../../web/src/services/auth.js';
import { setSEO } from '../../../web/src/seo.js';
import { renderMobileCard, attachMobileCardEvents } from '../components/MobileCard.js';

async function getMobile() {
  return await import('../mobile-main.js');
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
}

function stars(value) {
  const rating = Math.round(Math.max(0, Math.min(5, Number(value) || 0)));
  return [1, 2, 3, 4, 5].map(i => `<i class="fa-${i <= rating ? 'solid' : 'regular'} fa-star"></i>`).join('');
}

function responseTime(mins) {
  const n = Number(mins);
  if (!Number.isFinite(n) || n <= 0) return 'Usually responds soon';
  if (n < 60) return `${Math.round(n)} min response`;
  if (n < 1440) return `${Math.round(n / 60)} hr response`;
  return `${Math.round(n / 1440)} day response`;
}

export default async function init(container, params = {}) {
  const id = params.id || params.userId;
  const { updateHeader, navigate } = await getMobile();
  updateHeader({ title: 'Seller', showBack: true });
  setSEO({ title: 'Seller Storefront | RoommateGroups', description: 'Browse seller listings and reviews.' });

  container.innerHTML = `
    <div class="mobile-empty" style="padding:64px 24px;">
      <div class="mobile-empty-title">Loading seller...</div>
    </div>
  `;

  try {
    const [seller, reviews] = await Promise.all([
      api.getSeller(id, true),
      api.getReviews(id, true).catch(() => []),
    ]);
    const name = seller?.display_name || 'Seller';
    updateHeader({ title: name, showBack: true });

    container.innerHTML = `
      <div class="mobile-page-content" style="padding:16px 16px 24px;">
        <section style="background:#fff;border:1px solid #f1f5f9;border-radius:22px;padding:20px;text-align:center;margin-bottom:12px;">
          <img src="${getAvatarUrl(seller.profile_photo, name)}" alt="${escHtml(name)}" style="width:104px;height:104px;border-radius:50%;object-fit:cover;margin-bottom:12px;">
          <div style="font-size:1.25rem;font-weight:900;color:#0f172a;display:flex;justify-content:center;align-items:center;gap:6px;">${escHtml(name)} ${getVerificationBadge(seller)}</div>
          <div style="color:#f59e0b;margin-top:8px;">${stars(seller.seller_rating_avg)}</div>
          <div style="font-size:0.78rem;color:#64748b;margin-top:4px;">${Number(seller.seller_rating_avg || 0).toFixed(1)} (${seller.seller_rating_count || 0}) • ${escHtml(responseTime(seller.response_time_mins))}</div>
          ${seller.is_dealer ? '<div style="display:inline-flex;margin-top:10px;padding:5px 10px;border-radius:999px;background:#f1f5f9;font-size:0.72rem;font-weight:800;color:#475569;">Dealer</div>' : ''}
        </section>

        <section style="background:#fff;border:1px solid #f1f5f9;border-radius:18px;padding:16px;margin-bottom:12px;">
          <div style="font-size:1rem;font-weight:900;color:#0f172a;margin-bottom:8px;">About</div>
          <div style="font-size:0.86rem;line-height:1.65;color:#475569;white-space:pre-wrap;">${escHtml(seller.bio || 'No bio provided.')}</div>
        </section>

        <section style="background:#fff;border:1px solid #f1f5f9;border-radius:18px;padding:16px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <div style="font-size:1rem;font-weight:900;color:#0f172a;">Reviews</div>
            <button id="seller-all-reviews" style="border:none;background:none;color:var(--mobile-accent);font-weight:800;">View all</button>
          </div>
          ${(reviews || []).slice(0, 3).map(review => `
            <div style="border-top:1px solid #f1f5f9;padding:12px 0;">
              <div style="color:#f59e0b;font-size:0.78rem;">${stars(review.rating)}</div>
              <div style="font-size:0.84rem;color:#334155;line-height:1.55;margin-top:5px;">${escHtml(review.comment || 'No comment provided.')}</div>
            </div>
          `).join('') || '<div style="font-size:0.84rem;color:#64748b;">No reviews yet.</div>'}
        </section>

        <div style="font-size:1rem;font-weight:900;color:#0f172a;margin:18px 0 12px;">Active listings</div>
        <div id="seller-listings" class="mobile-feed">
          ${(seller.listings || []).length ? seller.listings.map(renderMobileCard).join('') : `
            <div class="mobile-empty" style="padding:32px 16px;">
              <div class="mobile-empty-title">No active listings</div>
            </div>
          `}
        </div>
      </div>
    `;

    container.querySelector('#seller-all-reviews')?.addEventListener('click', () => navigate('reviews', { userId: id }));
    attachMobileCardEvents(
      container,
      listingId => navigate('listing', { id: listingId }),
      uid => navigate('seller', { id: uid })
    );
  } catch (err) {
    container.innerHTML = `
      <div class="mobile-empty" style="padding:64px 24px;">
        <div class="mobile-empty-title">Seller not found</div>
        <div class="mobile-empty-text">${escHtml(err.message || 'Please try again.')}</div>
      </div>
    `;
  }
}
