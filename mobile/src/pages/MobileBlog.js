/**
 * src/mobile/pages/MobileBlog.js
 * Blog list screen for mobile.
 */

import { getBlogPosts } from '../../../web/src/services/blog-data.js';

async function getMobile() { return await import('../mobile-main.js'); }

export async function init(container) {
  const allPosts = getBlogPosts().filter(p => p.is_published !== false);

  const { navigate } = await getMobile();

  function _render() {
    container.innerHTML = `
      <div style="background: #f8fafc; min-height: 100%;">
        <!-- Hero Header -->
        <div style="background: #1a1a1a; padding: 40px 20px; text-align: center; color: #fff;">
          <h2 style="font-size: 1.6rem; font-weight: 900; margin-bottom: 8px; letter-spacing: -0.02em;">Rental Guides & Tips</h2>
          <p style="font-size: 0.85rem; opacity: 0.8; max-width: 260px; margin: 0 auto; line-height: 1.5;">Expert advice on finding roommates, moving, and legal rights.</p>
        </div>

        <div style="padding: 20px; display: flex; flex-direction: column; gap: 20px;">
          ${allPosts.map(post => `
            <div class="blog-mobile-card" data-slug="${post.slug}" style="background: #fff; border-radius: 16px; overflow: hidden; border: 1px solid #f1f5f9; box-shadow: 0 4px 12px rgba(0,0,0,0.03); cursor: pointer;">
              <div style="height: 160px; position: relative;">
                <img src="${post.featured_image || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?auto=format&fit=crop&q=80&w=600'}" style="width:100%; height:100%; object-fit:cover;">
                <div style="position:absolute; top:12px; left:12px; background:var(--mobile-accent); color:#fff; font-size:0.65rem; font-weight:800; padding:4px 100px; border-radius:100px; text-transform:uppercase;">${post.category || 'Guide'}</div>
              </div>
              <div style="padding: 16px;">
                <div style="font-size: 1.1rem; font-weight: 800; color: #1e293b; line-height: 1.35; margin-bottom: 8px;">${post.title}</div>
                <div style="font-size: 0.85rem; color: #64748b; line-height: 1.5; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; margin-bottom: 12px;">${post.excerpt || 'Read our latest insights and expert tips…'}</div>
                <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid #f1f5f9;">
                  <div style="font-size: 0.72rem; color: #94a3b8; font-weight: 600;">${post.date || 'Apr 2026'}</div>
                  <div style="font-size: 0.82rem; color: var(--mobile-accent); font-weight: 800;">Read More →</div>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    // Attach events
    container.querySelectorAll('.blog-mobile-card').forEach(card => {
      card.addEventListener('click', () => {
        const slug = card.dataset.slug;
        // For mobile, we can reuse the web blog detail or create a mobile one.
        // Let's assume we create MobileBlogPost.js later.
        navigate('blog-post', { slug });
      });
    });
  }

  _render();
}

export const renderMobileBlog = init;
