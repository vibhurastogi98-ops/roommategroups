import { api } from '../../../web/src/services/api.js';
import { getCurrentUser } from '../../../web/src/services/auth.js';

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

export default async function init(container, params = {}) {
  const userId = params.userId || params.id;
  const { updateHeader } = await getMobile();
  updateHeader({ title: 'Reviews', showBack: true });

  const currentUser = getCurrentUser();
  let reviews = [];

  function render(loading = false, error = '') {
    container.innerHTML = `
      <div class="mobile-page-content" style="padding:16px;">
        <section style="background:#fff;border:1px solid #f1f5f9;border-radius:18px;padding:16px;margin-bottom:12px;">
          <div style="font-size:1.1rem;font-weight:900;color:#0f172a;margin-bottom:6px;">Reviews</div>
          <div style="font-size:0.8rem;color:#64748b;">${reviews.length} review${reviews.length === 1 ? '' : 's'}</div>
        </section>

        <section style="background:#fff;border:1px solid #f1f5f9;border-radius:18px;padding:16px;margin-bottom:12px;">
          ${loading ? '<div style="color:#64748b;font-size:0.86rem;">Loading reviews...</div>' : error ? `<div style="color:#b91c1c;font-size:0.86rem;">${escHtml(error)}</div>` : reviews.length ? reviews.map(review => `
            <div style="border-top:1px solid #f1f5f9;padding:14px 0;">
              <div style="color:#f59e0b;font-size:0.82rem;">${stars(review.rating)}</div>
              <div style="font-size:0.86rem;color:#334155;line-height:1.6;margin-top:6px;">${escHtml(review.comment || 'No comment provided.')}</div>
              <div style="font-size:0.72rem;color:#94a3b8;margin-top:6px;text-transform:capitalize;">${escHtml(review.role || 'review')} • ${new Date(review.created_at).toLocaleDateString()}</div>
            </div>
          `).join('') : '<div style="color:#64748b;font-size:0.86rem;">No reviews yet.</div>'}
        </section>

        ${currentUser ? `
          <section style="background:#fff;border:1px solid #f1f5f9;border-radius:18px;padding:16px;">
            <div style="font-size:1rem;font-weight:900;color:#0f172a;margin-bottom:12px;">Write a review</div>
            <form id="mr-form" style="display:grid;gap:10px;">
              <input id="mr-listing" class="mobile-input" placeholder="Listing ID" value="${escHtml(params.listing_id || '')}" required>
              <select id="mr-role" class="mobile-input">
                <option value="seller">Review as buyer</option>
                <option value="buyer">Review as seller</option>
              </select>
              <select id="mr-rating" class="mobile-input">
                <option value="5">5 stars</option>
                <option value="4">4 stars</option>
                <option value="3">3 stars</option>
                <option value="2">2 stars</option>
                <option value="1">1 star</option>
              </select>
              <textarea id="mr-comment" class="mobile-input" placeholder="Share what happened after the sale..." style="min-height:110px;padding:12px;line-height:1.5;" required></textarea>
              <button class="mobile-btn mobile-btn-accent" type="submit">Submit Review</button>
            </form>
          </section>
        ` : ''}
      </div>
    `;

    container.querySelector('#mr-form')?.addEventListener('submit', async e => {
      e.preventDefault();
      await api.createReview({
        listing_id: container.querySelector('#mr-listing').value.trim(),
        reviewee_id: userId,
        role: container.querySelector('#mr-role').value,
        rating: Number(container.querySelector('#mr-rating').value),
        comment: container.querySelector('#mr-comment').value.trim(),
      });
      reviews = await api.getReviews(userId, true).catch(() => reviews);
      render();
    });
  }

  render(true);
  try {
    reviews = await api.getReviews(userId, true) || [];
    render();
  } catch (err) {
    render(false, err.message || 'Could not load reviews.');
  }
}
