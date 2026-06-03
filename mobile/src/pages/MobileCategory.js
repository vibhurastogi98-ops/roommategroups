import { api } from '../../../web/src/services/api.js';
import { setSEO } from '../../../web/src/seo.js';
import { db } from '../../../web/src/services/db.js';
import { renderMobileCard, attachMobileCardEvents } from '../components/MobileCard.js';

async function getMobile() {
  return await import('../mobile-main.js');
}

function escHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[c]));
}

function flatten(items = []) {
  return items.flatMap(cat => [cat, ...flatten(cat.children || [])]);
}

function _iconClass(icon) {
  const raw = String(icon || 'fa-tag').trim();
  if (raw.includes('fa-solid') || raw.includes('fa-regular') || raw.includes('fa-brands') || raw.includes('fab ')) {
    return raw.replace(/\bfas\b/g, 'fa-solid').replace(/\bfab\b/g, 'fa-brands');
  }
  return raw.startsWith('fa-') ? `fa-solid ${raw}` : `fa-solid fa-${raw}`;
}

function _collectCategoryIds(category) {
  const ids = [];
  const visit = cat => {
    if (!cat) return;
    if (cat.category_id) ids.push(String(cat.category_id));
    if (cat.slug) ids.push(String(cat.slug));
    (cat.children || []).forEach(visit);
  };
  visit(category);
  return ids;
}

function _categoryNav(category, allCategories) {
  const topCategories = allCategories.filter(cat => !cat.parent_id);
  const parent = category?.parent_id
    ? allCategories.find(cat => String(cat.category_id) === String(category.parent_id))
    : null;
  const root = parent || (category?.children?.length ? category : null);
  const items = root
    ? [
        { category: root, label: `All ${root.name}` },
        ...(root.children || []).map(child => ({ category: child, label: child.name })),
      ]
    : topCategories.map(cat => ({ category: cat, label: cat.name }));
  return { root, items };
}

function _listingId(listing) {
  return listing?.listing_id || listing?.id || '';
}

function _isActiveSaleListing(listing) {
  return listing?.status === 'active' && listing?.is_active !== false && String(listing?.kind || '').toLowerCase() === 'sale';
}

function _localCategoryListings(category) {
  const ids = new Set(_collectCategoryIds(category));
  return db.listings.find(l => _isActiveSaleListing(l) && ids.has(String(l.category_id || l.category || '')));
}

function _mergeListings(primary = [], fallback = []) {
  const seen = new Set();
  return [...primary, ...fallback].filter(listing => {
    const id = _listingId(listing);
    if (!id || seen.has(id)) return false;
    seen.add(id);
    return true;
  });
}

export default async function init(container, params = {}) {
  const slug = String(params.slug || '').toLowerCase();
  const { updateHeader, navigate } = await getMobile();
  updateHeader({ title: 'Category', showBack: true });
  setSEO({ title: 'Category | RoommateGroups', description: 'Browse marketplace categories on RoommateGroups.' });

  container.classList.add('mobile-page-flex');
  container.innerHTML = `
    <div class="mobile-page-content" style="padding:16px;">
      <div class="mobile-empty" style="padding:48px 16px;">
        <div class="mobile-empty-title">Loading category...</div>
      </div>
    </div>
  `;

  try {
    const tree = await api.getCategoryTree(true);
    const all = flatten(Array.isArray(tree) ? tree : [])
      .filter(cat => cat.is_active !== false && String(cat.kind || '').toLowerCase() !== 'service');
    const category = all.find(cat =>
      String(cat.slug || '').toLowerCase() === slug ||
      String(cat.category_id || '').toLowerCase() === slug
    );

    if (!category) {
      updateHeader({ title: 'Category', showBack: true });
      container.innerHTML = `
        <div class="mobile-page-content" style="padding:16px;">
          <div class="mobile-empty" style="padding:48px 16px;">
            <div class="mobile-empty-title">Category not found</div>
            <div class="mobile-empty-text">This marketplace category is not available yet.</div>
            <button id="mc-marketplace" style="height:40px;border:none;border-radius:11px;background:#0f172a;color:#fff;font-size:0.78rem;font-weight:900;padding:0 14px;margin-top:14px;">Browse Marketplace</button>
          </div>
        </div>
      `;
      container.querySelector('#mc-marketplace')?.addEventListener('click', () => navigate('marketplace'));
      return;
    }

    const categoryKey = category.category_id || category.slug || slug;
    const payload = await api.searchListings({ kind: 'sale', category: categoryKey, page: 1, limit: 48, sort: 'newest' }, true).catch(() => ({ results: [] }));
    updateHeader({ title: category?.name || 'Category', showBack: true });
    const apiListings = Array.isArray(payload) ? payload : payload?.results || [];
    const listings = _mergeListings(apiListings.filter(_isActiveSaleListing), _localCategoryListings(category));
    const nav = _categoryNav(category, all);
    const categoryName = category?.name || 'Category';
    const lowerName = categoryName.toLowerCase();

    container.innerHTML = `
      <div class="mobile-page-content" style="padding:16px;">
        <div style="margin-bottom:16px;">
          <div style="font-size:0.76rem;color:#64748b;font-weight:800;margin-bottom:8px;">Marketplace</div>
          <div style="font-size:1.35rem;font-weight:900;color:#0f172a;letter-spacing:-0.02em;">${escHtml(categoryName)}</div>
          <div style="font-size:0.82rem;color:#64748b;margin-top:4px;line-height:1.45;">${listings.length} active ${listings.length === 1 ? 'listing' : 'listings'} for sale. Browse local ${escHtml(lowerName)} or post your own item.</div>
          <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:14px;">
            <button id="mc-search-category" style="height:38px;border:1px solid #e2e8f0;border-radius:11px;background:#fff;color:#0f172a;font-size:0.78rem;font-weight:900;padding:0 13px;">Search</button>
            <button id="mc-post-category" style="height:38px;border:none;border-radius:11px;background:#0f172a;color:#fff;font-size:0.78rem;font-weight:900;padding:0 13px;">Post ${escHtml(categoryName)}</button>
          </div>
        </div>
        ${nav.items.length ? `
          <div class="mobile-scroll-x" style="margin:0 -16px 16px;padding:0 16px;overflow-x:auto;">
            <div style="display:flex;gap:10px;width:max-content;">
              ${nav.items.map(item => {
                const navCat = item.category;
                const selected = String(navCat.category_id || '') === String(category.category_id || '')
                  || String(navCat.slug || '').toLowerCase() === String(category.slug || '').toLowerCase();
                return `
                  <button class="mc-child" data-slug="${escHtml(navCat.slug || navCat.category_id)}" style="border:1px solid ${selected ? '#0f172a' : '#e2e8f0'};background:${selected ? '#0f172a' : '#fff'};border-radius:14px;padding:10px 14px;font-weight:800;color:${selected ? '#fff' : '#1e293b'};display:flex;align-items:center;gap:8px;box-shadow:${selected ? '0 8px 18px rgba(15,23,42,0.12)' : 'none'};">
                    <i class="${_iconClass(navCat.icon)}"></i>
                    ${escHtml(item.label)}
                  </button>
                `;
              }).join('')}
            </div>
          </div>
        ` : ''}
        <div id="category-results" class="mobile-feed">
          ${listings.length ? listings.map(renderMobileCard).join('') : `
            <div class="mobile-empty" style="padding:48px 16px;">
              <div style="width:54px;height:54px;border-radius:16px;background:#f1f5f9;color:#0f172a;display:flex;align-items:center;justify-content:center;margin:0 auto 14px;font-size:1.25rem;"><i class="${_iconClass(category.icon)}"></i></div>
              <div class="mobile-empty-title">No ${escHtml(lowerName)} listings yet</div>
              <div class="mobile-empty-text">Fresh ${escHtml(lowerName)} items will appear here as members post them.</div>
              <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:14px;">
                <button id="mc-empty-post" style="height:40px;border:none;border-radius:11px;background:#0f172a;color:#fff;font-size:0.78rem;font-weight:900;padding:0 14px;">Post ${escHtml(categoryName)}</button>
                <button id="mc-empty-marketplace" style="height:40px;border:1px solid #e2e8f0;border-radius:11px;background:#fff;color:#0f172a;font-size:0.78rem;font-weight:900;padding:0 14px;">Browse All</button>
              </div>
            </div>
          `}
        </div>
        <div style="display:grid;gap:10px;margin-top:16px;">
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px;"><strong style="display:block;color:#0f172a;margin-bottom:4px;">Verified members</strong><span style="font-size:0.8rem;color:#64748b;line-height:1.45;">Trade with RoommateGroups users and keep contact in-app.</span></div>
          <div style="background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:14px;"><strong style="display:block;color:#0f172a;margin-bottom:4px;">Safe handoff</strong><span style="font-size:0.8rem;color:#64748b;line-height:1.45;">Meet in public and inspect the item before payment.</span></div>
        </div>
      </div>
    `;

    container.querySelector('#mc-search-category')?.addEventListener('click', () => navigate('search', { kind: 'sale', category: categoryKey }));
    container.querySelector('#mc-post-category')?.addEventListener('click', () => navigate('post', { kind: 'sale', category: categoryKey }));
    container.querySelector('#mc-empty-post')?.addEventListener('click', () => navigate('post', { kind: 'sale', category: categoryKey }));
    container.querySelector('#mc-empty-marketplace')?.addEventListener('click', () => navigate('marketplace'));
    container.querySelectorAll('.mc-child').forEach(btn => {
      btn.addEventListener('click', () => navigate('category', { slug: btn.dataset.slug }));
    });
    attachMobileCardEvents(
      container,
      id => navigate('listing', { id }),
      uid => navigate('seller', { id: uid })
    );
  } catch (err) {
    container.innerHTML = `
      <div class="mobile-empty" style="padding:64px 24px;">
        <div class="mobile-empty-title">Couldn't load category</div>
        <div class="mobile-empty-text">${escHtml(err.message || 'Please try again.')}</div>
      </div>
    `;
  }
}
