import { renderNavbar, initNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { api } from '../services/api.js';
import { db } from '../services/db.js';
import { getAvatarUrl, getAssetUrl } from '../services/assets.js';
import { getVerificationBadge, getTierBadge, renderSocialLinks } from '../services/auth.js';
import { setSEO } from '../seo.js';

function escHtml(str) {
    if (!str) return '';
    return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
}

function photoUrl(listing) {
    let photos = listing.images || listing.photos || [];
    if (typeof photos === 'string') { try { photos = JSON.parse(photos || '[]'); } catch (_) { photos = []; } }
    const first = Array.isArray(photos) ? photos[0] : photos;
    const src = typeof first === 'object' && first ? (first.medium || first.thumb || first.full) : first;
    return getAssetUrl(src || 'https://images.unsplash.com/photo-1517705008128-361805f42e86?w=800&h=600&fit=crop');
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

function listingCard(listing) {
    const price = listing.price ?? listing.rent;
    return `
        <a class="seller-listing-card" href="/listing/${escHtml(listing.listing_id)}">
            <img src="${photoUrl(listing)}" alt="${escHtml(listing.title)}" loading="lazy">
            <div>
                <strong>${price !== undefined && price !== null ? '$' + Number(price).toLocaleString() : 'Price TBC'}</strong>
                <span>${escHtml(listing.title || 'Untitled listing')}</span>
            </div>
        </a>
    `;
}

async function cacheSellerListings(listings = [], sellerId = '') {
    for (const listing of listings) {
        if (!listing?.listing_id || db.listings.findById(listing.listing_id)) continue;
        await db.listings.create({
            ...listing,
            user_id: listing.user_id || sellerId,
            kind: listing.kind || (listing.category_id || listing.price !== undefined ? 'sale' : 'rental'),
        });
    }
}

export function renderSellerProfilePage(app, params) {
    const sellerId = params.id;
    app.innerHTML = `
        ${renderNavbar()}
        <div class="seller-page"><div class="seller-shell"><div class="seller-empty">Loading seller...</div></div></div>
        ${renderFooter()}
    `;
    initNavbar();

    Promise.all([
        api.getSeller(sellerId, true),
        api.getReviews(sellerId, true).catch(() => []),
    ]).then(async ([seller, reviews]) => {
        const sellerName = seller?.display_name || 'Seller';
        setSEO({
            title: `${sellerName} Storefront | RoommateGroups`,
            description: `Browse listings and reviews for ${sellerName} on RoommateGroups.`,
            canonical: `https://roommategroups.com/seller/${sellerId}`,
        });

        const listings = seller?.listings || [];
        await cacheSellerListings(listings, seller?.user_id || sellerId);
        const reviewRows = (reviews || []).map(review => `
            <div class="seller-review">
                <div class="seller-review-stars">${stars(review.rating)}</div>
                <p>${escHtml(review.comment || 'No comment provided.')}</p>
                <span>${new Date(review.created_at).toLocaleDateString()}</span>
            </div>
        `).join('');

        app.innerHTML = `
            <style>
                .seller-page { min-height:100vh; background:#f8fafc; padding:42px 24px 72px; }
                .seller-shell { max-width:1100px; margin:0 auto; display:grid; grid-template-columns:300px 1fr; gap:28px; align-items:start; }
                .seller-card, .seller-section { background:#fff; border:1px solid #e2e8f0; border-radius:18px; padding:24px; }
                .seller-card { position:sticky; top:96px; text-align:center; }
                .seller-avatar { width:132px; height:132px; border-radius:50%; object-fit:cover; margin-bottom:16px; }
                .seller-card h1 { margin:0 0 8px; font-size:1.45rem; color:#0f172a; }
                .seller-rating { color:#f59e0b; display:flex; gap:3px; justify-content:center; margin:12px 0 6px; }
                .seller-meta { color:#64748b; font-size:.9rem; margin:0 0 10px; }
                .seller-bio { color:#475569; line-height:1.6; white-space:pre-wrap; }
                .seller-section { margin-bottom:22px; }
                .seller-section h2 { margin:0 0 16px; color:#0f172a; font-size:1.25rem; }
                .seller-listings { display:grid; grid-template-columns:repeat(auto-fill,minmax(220px,1fr)); gap:16px; }
                .seller-listing-card { color:inherit; text-decoration:none; border:1px solid #e2e8f0; border-radius:14px; overflow:hidden; background:#fff; }
                .seller-listing-card img { width:100%; aspect-ratio:4/3; object-fit:cover; display:block; }
                .seller-listing-card div { padding:12px; display:grid; gap:4px; }
                .seller-listing-card strong { color:#0f172a; }
                .seller-listing-card span { color:#475569; font-size:.9rem; }
                .seller-review { border-top:1px solid #f1f5f9; padding:16px 0; }
                .seller-review:first-child { border-top:none; padding-top:0; }
                .seller-review-stars { color:#f59e0b; margin-bottom:7px; }
                .seller-review p { margin:0 0 6px; color:#334155; }
                .seller-review span { color:#94a3b8; font-size:.82rem; }
                .seller-empty { background:#fff; border:1px solid #e2e8f0; border-radius:16px; padding:36px; color:#64748b; text-align:center; }
                @media (max-width:760px) { .seller-shell { grid-template-columns:1fr; } .seller-card { position:static; } }
            </style>
            ${renderNavbar()}
            <div class="seller-page">
                <div class="seller-shell">
                    <aside class="seller-card">
                        <img class="seller-avatar" src="${getAvatarUrl(seller.profile_photo, sellerName)}" alt="${escHtml(sellerName)}" loading="lazy">
                        <h1>${escHtml(sellerName)} ${getVerificationBadge(seller)} ${getTierBadge(seller)}</h1>
                        ${renderSocialLinks(seller)}
                        <div class="seller-rating">${stars(seller.seller_rating_avg)}</div>
                        <p class="seller-meta">${Number(seller.seller_rating_avg || 0).toFixed(1)} (${seller.seller_rating_count || 0} reviews)</p>
                        <p class="seller-meta">${escHtml(responseTime(seller.response_time_mins))}</p>
                        <p class="seller-meta">Joined ${new Date(seller.created_at).toLocaleDateString(undefined, { month:'long', year:'numeric' })}</p>
                        <a class="btn btn-primary" href="/reviews/${escHtml(seller.user_id)}" style="width:100%;margin-top:10px;">Reviews</a>
                    </aside>
                    <main>
                        <section class="seller-section">
                            <h2>About</h2>
                            <div class="seller-bio">${escHtml(seller.bio || 'No bio provided.')}</div>
                        </section>
                        <section class="seller-section">
                            <h2>Active Listings</h2>
                            ${listings.length ? `<div class="seller-listings">${listings.map(listingCard).join('')}</div>` : '<p class="seller-meta">No active listings right now.</p>'}
                        </section>
                        <section class="seller-section">
                            <h2>Reviews</h2>
                            ${reviewRows || '<p class="seller-meta">No reviews yet.</p>'}
                        </section>
                    </main>
                </div>
            </div>
            ${renderFooter()}
        `;
        initNavbar();
    }).catch(err => {
        app.querySelector('.seller-shell').innerHTML = `<div class="seller-empty">${escHtml(err.message || 'Seller not found.')}</div>`;
    });
}
