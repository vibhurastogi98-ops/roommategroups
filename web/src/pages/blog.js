import { navigate } from '../router.js';
import { getBlogPosts, getCategories } from '../services/blog-data.js';
import { renderNavbar, initNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { setSEO } from '../seo.js'; // SEO Update
import { getAssetUrl, getAvatarUrl } from '../services/assets.js';

function norm(post) {
    const author = post.author || {};
    return {
        ...post,
        _image:      getAssetUrl(post.featured_image || post.image || 'https://images.unsplash.com/photo-1499750310107-5fef28a66643?auto=format&fit=crop&q=80&w=1200'),
        _date:       post.published_date  || post.date  || '',
        _readTime:   post.readTime || '3 min read',
        _authorName: author.name  || post.author_name || 'RoommateGroups',
        _authorAvatar: getAvatarUrl(author.avatar || post.author_avatar, author.name || post.author_name || 'RoommateGroups'),
        _authorBio:  author.bio   || post.author_bio  || '',
    };
}

export function renderBlogPage(app) {
    // SEO Update
    setSEO({
        title: 'Roommate & Rental Tips Blog | RoommateGroups',
        description: 'Tips, guides, and housing market insights to help you find a roommate, negotiate rent, and settle into your new home. Updated weekly by the RoommateGroups team.',
        canonical: 'https://roommategroups.com/blog',
    });
    const ALL_POSTS = getBlogPosts().filter(p => p.is_published !== false && p.status !== 'draft').map(norm);
    const CATEGORIES = getCategories();
    let activeCategory = "All";

    function renderGrid() {
        const filtered = activeCategory === "All" 
            ? ALL_POSTS 
            : ALL_POSTS.filter(p => p.category === activeCategory);
        
        const grid = app.querySelector('.blog-grid');
        if (!grid) return;

        if (filtered.length === 0) {
            grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 4rem; background: white; border-radius: 12px; border: 1px solid var(--border); color: var(--text-secondary);">No posts found in this category.</div>';
            return;
        }

        grid.innerHTML = filtered.map(post => `
            <article class="blog-card" onclick="navigate('/blog/${post.slug}')">
                <div class="card-image">
                    <img src="${post._image}" alt="${post.title}" loading="lazy" />
                    <span class="category-badge">${post.category || 'General'}</span>
                </div>
                <div class="card-content">
                    <h3 class="card-title">${post.title}</h3>
                    <p class="card-excerpt">${post.excerpt || ''}</p>
                    
                    <div class="card-meta">
                        <div class="author-info">
                            <img src="${post._authorAvatar}" alt="${post._authorName}" class="author-avatar" />
                            <span class="author-name">${post._authorName}</span>
                        </div>
                        <div class="post-stats">
                            <span><i class="far fa-calendar"></i> ${post._date ? new Date(post._date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : post.date}</span>
                            <span><i class="far fa-clock"></i> ${post._readTime}</span>
                        </div>
                    </div>
                </div>
            </article>
        `).join('');
    }

    app.innerHTML = `
        ${renderNavbar()}

        <main class="blog-page">
            <section class="blog-hero">
                <div class="container hero-content">
                    <h1 style="color: #1a1a1a">RoommateGroups Blog</h1>
                    <p class="subtitle">Tips, guides, and market insights for renters and roommates</p>
                </div>
            </section>

            <section class="blog-main-container container">
                <div class="blog-content-area">
                    <div class="blog-categories">
                        ${CATEGORIES.map(cat => 
                            `<button class="category-tab ${cat === activeCategory ? 'active' : ''}" data-category="${cat}">${cat}</button>`
                        ).join('')}
                    </div>

                    <div class="blog-grid">
                        <!-- Grid items loaded by renderGrid() -->
                    </div>

                    <div class="load-more-container" style="display: none;">
                        <button class="btn btn-primary load-more-btn">Load More Posts</button>
                    </div>
                </div>
            </section>
        </main>
        ${renderFooter()}

        <style>
            .blog-page {
                background: var(--bg-light);
                min-height: 100vh;
                padding-bottom: 60px;
                margin-top: 70px;
            }
            .blog-hero {
                background: #f2f2f2;
                color: #1a1a1a;
                padding: 100px 20px;
                text-align: center;
                margin-bottom: 60px;
                border-bottom: 1px solid #e2e8f0;
            }
            .blog-hero h1 {
                font-size: 3.5rem;
                font-weight: 800;
                margin-bottom: 1rem;
                letter-spacing: -1px;
            }
            .blog-hero .subtitle {
                font-size: 1.25rem;
                opacity: 0.95;
                max-width: 600px;
                margin: 0 auto;
            }
            .blog-main-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 20px;
            }
            .blog-categories {
                display: flex;
                gap: 12px;
                margin-bottom: 40px;
                flex-wrap: wrap;
                justify-content: center;
            }
            .category-tab {
                padding: 10px 24px;
                border: 1px solid var(--border);
                background: white;
                color: var(--text-secondary);
                border-radius: 30px;
                cursor: pointer;
                transition: all 0.2s;
                font-weight: 600;
                font-size: 0.9rem;
            }
            .category-tab:hover {
                border-color: var(--primary);
                color: var(--primary);
                background: var(--bg-light);
            }
            .category-tab.active {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
                box-shadow: 0 4px 12px rgba(99, 102, 241, 0.3);
            }
            .blog-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
                gap: 32px;
                margin-bottom: 60px;
            }
            .blog-card {
                background: white;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 20px rgba(0,0,0,0.05);
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
                cursor: pointer;
                border: 1px solid var(--border);
                display: flex;
                flex-direction: column;
            }
            .blog-card:hover {
                transform: translateY(-8px);
                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                border-color: var(--primary-light);
            }
            .card-image {
                position: relative;
                height: 220px;
                overflow: hidden;
            }
            .card-image img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.5s;
            }
            .blog-card:hover .card-image img {
                transform: scale(1.05);
            }
            .category-badge {
                position: absolute;
                top: 16px;
                left: 16px;
                background: var(--primary);
                color: white;
                padding: 6px 14px;
                border-radius: 20px;
                font-size: 0.75rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            }
            .card-content {
                padding: 24px;
                display: flex;
                flex-direction: column;
                flex: 1;
            }
            .card-title {
                font-size: 1.4rem;
                font-weight: 700;
                margin-bottom: 12px;
                line-height: 1.3;
                color: var(--text-primary);
            }
            .card-excerpt {
                color: var(--text-secondary);
                font-size: 1rem;
                line-height: 1.6;
                margin-bottom: 24px;
                display: -webkit-box;
                -webkit-line-clamp: 3;
                -webkit-box-orient: vertical;
                overflow: hidden;
            }
            .card-meta {
                margin-top: auto;
                padding-top: 20px;
                border-top: 1px solid var(--border);
                display: flex;
                align-items: center;
                justify-content: space-between;
            }
            .author-info {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .author-avatar {
                width: 36px;
                height: 36px;
                border-radius: 50%;
                object-fit: cover;
                border: 2px solid var(--border);
            }
            .author-name {
                font-weight: 700;
                font-size: 0.85rem;
                color: var(--text-primary);
            }
            .post-stats {
                display: flex;
                gap: 12px;
                color: var(--text-muted);
                font-size: 0.8rem;
                font-weight: 500;
            }
            .post-stats span i {
                margin-right: 4px;
            }
            @media (max-width: 768px) {
                .blog-hero h1 { font-size: 2.5rem; }
                .blog-grid { grid-template-columns: 1fr; }
            }
        </style>
    `;

    renderGrid();

    // Interaction logic
    const tabs = app.querySelectorAll('.category-tab');
    tabs.forEach(tab => {
        tab.addEventListener('click', (e) => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeCategory = tab.dataset.category;
            renderGrid();
        });
    });

    initNavbar();
}
