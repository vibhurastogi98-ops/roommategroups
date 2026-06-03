import { renderNavbar, initNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { api } from '../services/api.js';
import { getCurrentUser } from '../services/auth.js';
import { setSEO } from '../seo.js';

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
}

function stars(value) {
    const rating = Math.round(Math.max(0, Math.min(5, Number(value) || 0)));
    return [1, 2, 3, 4, 5].map(i => `<i class="fa-${i <= rating ? 'solid' : 'regular'} fa-star"></i>`).join('');
}

export function renderReviewsPage(app, params) {
    const userId = params.userId;
    const urlParams = new URLSearchParams(window.location.search);
    const listingId = urlParams.get('listing_id') || '';
    const currentUser = getCurrentUser();
    let reviews = [];

    setSEO({
        title: 'Reviews | RoommateGroups',
        description: 'Read and write marketplace reviews on RoommateGroups.',
        canonical: `https://roommategroups.com/reviews/${userId}`,
    });

    function render(loading = false, error = '') {
        const rows = reviews.map(review => `
            <article class="review-row">
                <div class="review-stars">${stars(review.rating)}</div>
                <p>${escHtml(review.comment || 'No comment provided.')}</p>
                <span>${escHtml(review.role || 'review')} • ${new Date(review.created_at).toLocaleDateString()}</span>
            </article>
        `).join('');

        app.innerHTML = `
            <style>
                .reviews-page { min-height:100vh; background:#f8fafc; padding:42px 24px 72px; }
                .reviews-shell { max-width:860px; margin:0 auto; display:grid; gap:22px; }
                .reviews-head h1 { margin:0; color:#0f172a; font-size:2rem; font-weight:900; }
                .reviews-head p { margin:8px 0 0; color:#64748b; }
                .reviews-card { background:#fff; border:1px solid #e2e8f0; border-radius:18px; padding:24px; }
                .reviews-card h2 { margin:0 0 16px; color:#0f172a; font-size:1.2rem; }
                .review-row { border-top:1px solid #f1f5f9; padding:18px 0; }
                .review-row:first-child { border-top:none; padding-top:0; }
                .review-stars { color:#f59e0b; margin-bottom:8px; }
                .review-row p { margin:0 0 8px; color:#334155; line-height:1.6; }
                .review-row span { color:#94a3b8; font-size:.84rem; text-transform:capitalize; }
                .review-form { display:grid; gap:12px; }
                .review-form input, .review-form select, .review-form textarea { width:100%; border:1px solid #e2e8f0; border-radius:12px; padding:12px; font:inherit; }
                .review-form textarea { min-height:110px; resize:vertical; }
                .review-submit { border:none; background:#0f172a; color:#fff; padding:12px 18px; border-radius:12px; font-weight:900; cursor:pointer; }
                .reviews-empty { color:#64748b; }
            </style>
            ${renderNavbar()}
            <div class="reviews-page">
                <div class="reviews-shell">
                    <div class="reviews-head">
                        <h1>Reviews</h1>
                        <p>${reviews.length} review${reviews.length === 1 ? '' : 's'} for this user.</p>
                    </div>
                    <section class="reviews-card">
                        <h2>Recent Reviews</h2>
                        ${loading ? '<p class="reviews-empty">Loading reviews...</p>' : error ? `<p class="reviews-empty">${escHtml(error)}</p>` : rows || '<p class="reviews-empty">No reviews yet.</p>'}
                    </section>
                    ${currentUser ? `
                    <section class="reviews-card">
                        <h2>Write a Review</h2>
                        <form class="review-form" id="review-form">
                            <input id="review-listing-id" placeholder="Listing ID" value="${escHtml(listingId)}" required>
                            <select id="review-role">
                                <option value="seller">Review as buyer</option>
                                <option value="buyer">Review as seller</option>
                            </select>
                            <select id="review-rating">
                                <option value="5">5 stars</option>
                                <option value="4">4 stars</option>
                                <option value="3">3 stars</option>
                                <option value="2">2 stars</option>
                                <option value="1">1 star</option>
                            </select>
                            <textarea id="review-comment" placeholder="Share what happened after the sale..." required></textarea>
                            <button class="review-submit" type="submit">Submit Review</button>
                        </form>
                    </section>
                    ` : ''}
                </div>
            </div>
            ${renderFooter()}
        `;
        initNavbar();
        app.querySelector('#review-form')?.addEventListener('submit', async e => {
            e.preventDefault();
            const body = {
                listing_id: app.querySelector('#review-listing-id').value.trim(),
                reviewee_id: userId,
                role: app.querySelector('#review-role').value,
                rating: Number(app.querySelector('#review-rating').value),
                comment: app.querySelector('#review-comment').value.trim(),
            };
            await api.createReview(body);
            app.querySelector('#review-comment').value = '';
            reviews = await api.getReviews(userId, true).catch(() => reviews);
            render();
        });
    }

    render(true);
    api.getReviews(userId, true).then(data => {
        reviews = Array.isArray(data) ? data : [];
        render();
    }).catch(err => render(false, err.message || 'Could not load reviews.'));
}
