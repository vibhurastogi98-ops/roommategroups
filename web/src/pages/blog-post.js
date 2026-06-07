import { navigate } from '../router.js';
import { getPostBySlug, getRelatedPosts, getBlogPosts, parseMarkdown } from '../services/blog-data.js';
import { renderNavbar, initNavbar } from '../components/navbar.js';
import { renderFooter } from '../components/footer.js';
import { setSEO } from '../seo.js'; // SEO Update

// ── Field normalizer ─────────────────────────────────────────
// Works with both legacy blog-data.js shape and new CMS db.js shape
function norm(post) {
    const author = post.author || {};
    return {
        ...post,
        _image:      post.featured_image || post.image || '',
        _date:       post.published_date  || post.date  || '',
        _readTime:   post.readTime || '',
        _authorName: author.name  || post.author_name || 'RoommateGroups',
        _authorAvatar: author.avatar || post.author_avatar || `https://i.pravatar.cc/150?u=${encodeURIComponent(author.name || 'rg')}`,
        _authorBio:  author.bio   || post.author_bio  || '',
        _tags:       Array.isArray(post.tags) ? post.tags : [],
    };
}

// ── Related Posts: category first, fill with tag matches ─────
function getRelated(post, allPosts) {
    const pid = post.id || post.post_id;
    const byCategory = allPosts.filter(p =>
        (p.id || p.post_id) !== pid &&
        (p.category === post.category || p.category_id === post.category)
    );
    if (byCategory.length >= 3) return byCategory.slice(0, 3);

    const postTags = norm(post)._tags;
    const byTags = allPosts.filter(p => {
        if ((p.id || p.post_id) === pid) return false;
        if (byCategory.includes(p)) return false;
        const pTags = Array.isArray(p.tags) ? p.tags : [];
        return pTags.some(t => postTags.includes(t));
    });

    return [...byCategory, ...byTags].slice(0, 3);
}

export function renderBlogPostPage(app, params) {
    const slug = params.slug;
    const rawFound = getPostBySlug(slug);
    // Treat unpublished/draft posts as not found for public visitors
    const raw = (rawFound && rawFound.is_published !== false && rawFound.status !== 'draft') ? rawFound : null;

    if (!raw) {
        app.innerHTML = `
            ${renderNavbar()}
            <main class="post-page" style="min-height: calc(100vh - 70px); display: flex; align-items: center; justify-content: center; padding: 40px 20px;">
                <div style="text-align:center; padding: 50px 40px; background: white; border-radius: var(--radius-lg); box-shadow: var(--shadow-sm); border: 1px solid var(--border); max-width: 500px; width: 100%;">
                    <div style="width: 80px; height: 80px; background: var(--bg-light); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px;">
                        <i class="far fa-file-alt" style="font-size: 2.2rem; color: var(--text-muted);"></i>
                    </div>
                    <h1 style="font-size: 2rem; font-weight: 800; color: var(--text-primary); margin-bottom: 12px;">Article Not Found</h1>
                    <p style="color: var(--text-secondary); line-height: 1.6; margin-bottom: 32px; font-size: 1.05rem;">The post you're looking for doesn't exist, has been removed, or the link may be broken.</p>
                    <button class="btn btn-primary" onclick="navigate('/blog')" style="width: 100%; padding: 14px; font-weight: 600;">
                        <i class="fas fa-arrow-left" style="margin-right: 8px;"></i> Return to Blog
                    </button>
                </div>
            </main>`;
        return;
    }

    const post = norm(raw);
    // SEO Update: injects Organization schema, robots, canonical, OG/Twitter tags via setSEO
    let isoDate;
    try { isoDate = post._date ? new Date(post._date).toISOString() : new Date().toISOString(); }
    catch { isoDate = new Date().toISOString(); }

    setSEO({
        title: (post.seoTitle || post.meta_title || `${post.title} | RoommateGroups Blog`).substring(0, 60),
        description: (post.seoDescription || post.meta_description || post.excerpt || '').substring(0, 160),
        canonical: `https://roommategroups.com/blog/${raw.slug}`,
        ogImage: post._image || 'https://roommategroups.com/logo.png',
        schema: {
            '@context': 'https://schema.org',
            '@graph': [
                {
                    '@type': 'Article',
                    headline: (post.seoTitle || post.meta_title || `${post.title} | RoommateGroups Blog`).substring(0, 60),
                    description: (post.seoDescription || post.meta_description || post.excerpt || '').substring(0, 160),
                    image: post._image || 'https://roommategroups.com/logo.png',
                    url: `https://roommategroups.com/blog/${raw.slug}`,
                    datePublished: isoDate,
                    author: { '@type': 'Person', name: post._authorName },
                    publisher: { '@type': 'Organization', name: 'RoommateGroups', logo: { '@type': 'ImageObject', url: 'https://roommategroups.com/logo.png' } }
                },
                {
                    '@type': 'BreadcrumbList',
                    itemListElement: [
                        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://roommategroups.com/' },
                        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://roommategroups.com/blog' },
                        { '@type': 'ListItem', position: 3, name: post.title, item: `https://roommategroups.com/blog/${raw.slug}` }
                    ]
                }
            ]
        }
    });

    const relatedPosts = getRelated(raw, getBlogPosts());

    // Format date nicely
    const displayDate = (() => {
        if (!post._date) return '';
        try { return new Date(post._date).toLocaleDateString('en-US', { year:'numeric', month:'long', day:'numeric' }); }
        catch { return post._date; }
    })();

    // ── Problem 1 fix: detect HTML vs legacy markdown ─────────────
    function renderContent(content) {
        const trimmed = (content || '').trim();
        const isHTML = /^<[a-zA-Z]/.test(trimmed);
        return isHTML ? trimmed : parseMarkdown(trimmed);
    }

    app.innerHTML = `
        ${renderNavbar()}

        <main class="post-page">

            <!-- ① Featured Image Hero -->
            <section class="post-hero">
                <div class="post-hero-img-wrap">
                    <img src="${post._image}" alt="${post.title}" class="post-hero-img" loading="eager" fetchpriority="high" />
                    <div class="post-hero-overlay"></div>
                </div>
                <div class="container post-hero-content">
                    <nav class="post-breadcrumb" aria-label="breadcrumb">
                        <a href="/">Home</a> <span>/</span>
                        <a href="/blog">Blog</a> <span>/</span>
                        <span>${post.category || ''}</span>
                    </nav>
                    <span class="category-badge big">${post.category || ''}</span>
                    <!-- ② H1 Title -->
                    <h1 class="post-title">${post.title}</h1>
                    <!-- ② Meta: Author, Date, Read Time -->
                    <div class="post-meta-hero">
                        <div class="author-info">
                            <img src="${post._authorAvatar}" alt="${post._authorName} Avatar" class="author-avatar" loading="lazy" />
                            <span class="author-name">${post._authorName}</span>
                        </div>
                        <div class="post-stats-hero">
                            ${displayDate ? `<span><i class="far fa-calendar"></i> ${displayDate}</span>` : ''}
                            ${post._readTime ? `<span class="dot-separator">•</span><span><i class="far fa-clock"></i> ${post._readTime}</span>` : ''}
                        </div>
                    </div>
                </div>
            </section>

            <!-- ③ Main Content Grid -->
            <section class="post-main-container container">
                <div class="post-layout-grid">
                    <article class="post-content-area prose" id="post-article">
                        <!-- ③ Rich Text Content -->
                        ${renderContent(post.content)}

                        <!-- Tags -->
                        ${post._tags.length > 0 ? `
                        <div class="post-tags">
                            <i class="fas fa-tags"></i>
                            ${post._tags.map(t => `<span class="tag-pill">${t}</span>`).join('')}
                        </div>` : ''}

                        <!-- ⑥ Social Share Buttons -->
                        <div class="social-share">
                            <h4>Share this article</h4>
                            <div class="share-buttons">
                                <button class="share-btn twitter" id="share-twitter">
                                    <i class="fab fa-twitter"></i> Twitter
                                </button>
                                <button class="share-btn facebook" id="share-facebook">
                                    <i class="fab fa-facebook-f"></i> Facebook
                                </button>
                                <button class="share-btn linkedin" id="share-linkedin">
                                    <i class="fab fa-linkedin-in"></i> LinkedIn
                                </button>
                                <button class="share-btn copy-link" id="share-copy">
                                    <i class="fas fa-link"></i> Copy Link
                                </button>
                            </div>
                        </div>

                        <!-- ⑦ CTA Banner -->
                        <div class="cta-inline-banner">
                            <div class="cta-inline-content">
                                <div class="cta-inline-text">
                                    <h3>${post.ctaHeading || 'Ready to Find Your Next Room?'}</h3>
                                    <p>${post.ctaText || 'Browse thousands of verified rooms and roommate listings across the US.'}</p>
                                </div>
                                <button class="btn btn-primary cta-inline-btn" onclick="navigate('${post.ctaBtnLink || '/search/rooms'}')">
                                    ${post.ctaBtnText || 'Find a Room'} <i class="fas fa-arrow-right"></i>
                                </button>
                            </div>
                        </div>

                        <!-- ⑤ Author Bio Card -->
                        <div class="author-bio-card">
                            <div class="bio-avatar-wrap">
                                <img src="${post._authorAvatar}" alt="${post._authorName} Profile Photo" class="bio-avatar" loading="lazy" onerror="this.src='https://ui-avatars.com/api/?name=${encodeURIComponent(post._authorName)}&background=6366f1&color=fff&size=200'" />
                            </div>
                            <div class="bio-content">
                                <h4>About ${post._authorName}</h4>
                                <p>${post._authorBio || 'Contributing writer at RoommateGroups.'}</p>
                            </div>
                        </div>
                    </article>

                    <aside class="post-sidebar">
                        <div class="sticky-sidebar">
                            <!-- Table of Contents -->
                            <div class="sidebar-widget">
                                <h3><i class="fas fa-list-ul"></i> Table of Contents</h3>
                                <nav class="toc-nav" id="toc-container">
                                    <div class="toc-placeholder">Generating summary...</div>
                                </nav>
                            </div>

                            <!-- CTA Widget -->
                            <div class="sidebar-widget cta-widget">
                                <h3>Looking for a Roommate?</h3>
                                <p>Join thousands of people finding their perfect match in our verified community.</p>
                                <button class="btn btn-primary btn-sm" style="width:100%" onclick="navigate('/search/roommates')">Browse Roommates</button>
                            </div>
                        </div>
                    </aside>
                </div>
            </section>

            <!-- ⑧ Related Posts -->
            ${relatedPosts.length > 0 ? `
            <section class="related-posts-section">
                <div class="container">
                    <h2 class="section-title">More Like This</h2>
                    <div class="related-grid">
                        ${relatedPosts.map(rp => {
                            const rn = norm(rp);
                            return `
                            <article class="related-card" onclick="navigate('/blog/${rp.slug}')">
                                <div class="related-card-img">
                                    <img src="${rn._image}" alt="${rp.title}" loading="lazy" />
                                    <span class="rc-badge">${rp.category || ''}</span>
                                </div>
                                <div class="related-card-body">
                                    <h3>${rp.title}</h3>
                                    <p>${rp.excerpt ? rp.excerpt.substring(0, 80) + '…' : ''}</p>
                                    <span class="rc-read-more">Read article <i class="fas fa-arrow-right"></i></span>
                                </div>
                            </article>`;
                        }).join('')}
                    </div>
                </div>
            </section>` : ''}

        </main>

        ${renderFooter()}

        <style>
            /* ═══════════════════════════════════════
               POST PAGE LAYOUT
            ═══════════════════════════════════════ */
            .post-page {
                background: var(--bg-light);
                min-height: 100vh;
                margin-top: 70px;
            }

            /* ── Breadcrumb ── */
            .post-breadcrumb {
                display: flex;
                align-items: center;
                gap: 8px;
                color: rgba(255,255,255,0.75);
                font-size: 0.85rem;
                margin-bottom: 16px;
            }
            .post-breadcrumb a { color: rgba(255,255,255,0.75); text-decoration: none; }
            .post-breadcrumb a:hover { color: white; }
            .post-breadcrumb span { opacity: 0.5; }
            .post-breadcrumb span:last-child { opacity: 1; color: white; }

            /* ── Hero ── */
            .post-hero {
                position: relative;
                height: 55vh;
                min-height: 420px;
                max-height: 640px;
                display: flex;
                align-items: flex-end;
                color: white;
            }
            .post-hero-img-wrap {
                position: absolute;
                inset: 0;
                z-index: 1;
            }
            .post-hero-img {
                width: 100%;
                height: 100%;
                object-fit: cover;
            }
            .post-hero-overlay {
                position: absolute;
                inset: 0;
                background: linear-gradient(to bottom, rgba(0,0,0,0.05) 0%, rgba(0,0,0,0.82) 100%);
            }
            .post-hero-content {
                position: relative;
                z-index: 2;
                padding-bottom: 52px;
            }
            .category-badge.big {
                background: var(--primary);
                color: white;
                font-size: 0.82rem;
                font-weight: 700;
                letter-spacing: 0.8px;
                text-transform: uppercase;
                padding: 6px 16px;
                border-radius: 30px;
                display: inline-block;
                margin-bottom: 16px;
            }
            .post-title {
                font-size: clamp(2rem, 5vw, 3.5rem);
                font-weight: 800;
                line-height: 1.15;
                margin-bottom: 24px;
                max-width: 900px;
                text-shadow: 0 2px 12px rgba(0,0,0,0.5);
            }
            .post-meta-hero {
                display: flex;
                align-items: center;
                gap: 20px;
                flex-wrap: wrap;
            }
            .post-meta-hero .author-info {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            .post-meta-hero .author-avatar {
                width: 44px;
                height: 44px;
                border-radius: 50%;
                border: 2px solid rgba(255,255,255,0.7);
                object-fit: cover;
            }
            .post-meta-hero .author-name { font-weight: 600; font-size: 1rem; }
            .post-stats-hero {
                display: flex;
                align-items: center;
                gap: 10px;
                font-size: 0.9rem;
                opacity: 0.85;
            }
            .dot-separator { opacity: 0.5; }

            /* ── Main Grid ── */
            .post-main-container {
                max-width: 1200px;
                margin: 0 auto;
                padding: 40px 20px;
            }
            .post-layout-grid {
                display: grid;
                grid-template-columns: 1fr 320px;
                gap: 40px;
                align-items: start;
            }
            @media (max-width: 1024px) {
                .post-layout-grid {
                    grid-template-columns: 1fr;
                }
                .post-sidebar { display: none; }
            }

    /* ═══════════════════════════════════════
       PROSE / RICH TEXT  ← KEY ADDITION
    ═══════════════════════════════════════ */
    .prose {
        background: white;
        padding: 60px;
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow);
        border: 1px solid var(--border);
        line-height: 1.85;
        font-size: 1.2rem;
        font-family: 'Inter', system-ui, sans-serif;
        color: #1e293b;
    }
    @media (max-width: 768px) { .prose { padding: 30px 24px; font-size: 1.1rem; } }

            .prose p { margin-bottom: 2em; color: #334155; }
            .prose .lead {
                font-size: 1.4rem;
                line-height: 1.8;
                color: var(--text-primary);
                font-weight: 500;
                margin-bottom: 2.5em;
            }
            .prose h2 {
                font-size: 2.75rem;
                font-weight: 800;
                color: #0f172a;
                margin-top: 3.5rem;
                margin-bottom: 1.5rem;
                line-height: 1.1;
                letter-spacing: -0.05em;
                font-family: 'Plus Jakarta Sans', sans-serif;
            }

            .prose h3 {
                font-size: 1.85rem;
                font-weight: 800;
                margin-top: 2.5rem;
                margin-bottom: 1.25rem;
                color: #1e293b;
                line-height: 1.2;
                letter-spacing: -0.03em;
                font-family: 'Plus Jakarta Sans', sans-serif;
            }
            .prose h4 {
                font-size: 1.25rem;
                font-weight: 700;
                color: var(--text-primary);
                margin-top: 2em;
                margin-bottom: 0.5em;
                font-family: 'Plus Jakarta Sans', sans-serif;
            }
            .prose ul, .prose ol {
                margin: 2em 0;
                padding-left: 1.5em;
            }
            .prose li { margin-bottom: 1em; line-height: 1.7; }
            .prose strong { color: #0f172a; font-weight: 700; }
            .prose a { color: var(--primary); text-decoration: underline; }
            .prose a:hover { opacity: 0.8; }

            /* Blockquote */
            .prose blockquote {
                border-left: 4px solid var(--primary);
                padding: 1em 1.5em;
                margin: 1.5em 0;
                background: var(--bg-light);
                border-radius: 0 var(--radius);
                font-style: italic;
                color: var(--text-secondary);
                border-radius: 0 10px 10px 0;
            }
            .prose blockquote p { margin: 0; color: inherit; }

            /* Images */
            .prose img {
                width: 100%;
                border-radius: var(--radius);
                margin: 2em 0;
                box-shadow: var(--shadow-sm);
                display: block;
            }
            .prose figure { margin: 2em 0; }
            .prose figcaption {
                text-align: center;
                font-size: 0.875rem;
                color: var(--text-secondary);
                margin-top: -1em;
                margin-bottom: 1em;
            }

            /* ── Embedded Videos (iframe / video) ── */
            .prose iframe,
            .prose video {
                width: 100%;
                aspect-ratio: 16 / 9;
                border-radius: var(--radius);
                margin: 2em 0;
                border: none;
                display: block;
            }
            .prose .video-wrapper {
                position: relative;
                padding-bottom: 56.25%;
                height: 0;
                overflow: hidden;
                border-radius: var(--radius);
                margin: 2em 0;
            }
            .prose .video-wrapper iframe,
            .prose .video-wrapper video {
                position: absolute;
                inset: 0;
                width: 100%;
                height: 100%;
                margin: 0;
                border-radius: 0;
            }

            /* ── Tables ── */
            .prose table {
                width: 100%;
                border-collapse: collapse;
                margin: 2em 0;
                font-size: 0.95rem;
                border-radius: var(--radius);
                overflow: hidden;
                box-shadow: var(--shadow-sm);
            }
            .prose table thead {
                background: var(--primary);
                color: white;
            }
            .prose table thead th {
                padding: 14px 18px;
                text-align: left;
                font-weight: 700;
                font-size: 0.875rem;
                letter-spacing: 0.5px;
                text-transform: uppercase;
            }
            .prose table tbody tr {
                border-bottom: 1px solid var(--border);
                transition: background 0.15s;
            }
            .prose table tbody tr:hover { background: var(--bg-light); }
            .prose table tbody tr:last-child { border-bottom: none; }
            .prose table td {
                padding: 12px 18px;
                color: #1a1a1a;
                vertical-align: top;
            }

            /* ── Code Blocks ── */
            .prose code {
                background: #1e293b;
                color: #e2e8f0;
                padding: 2px 8px;
                border-radius: 5px;
                font-family: 'Fira Code', 'Consolas', monospace;
                font-size: 0.88em;
                white-space: nowrap;
            }
            .prose pre {
                background: #0f172a;
                color: #e2e8f0;
                padding: 28px;
                border-radius: var(--radius);
                overflow-x: auto;
                margin: 2em 0;
                font-family: 'Fira Code', 'Consolas', monospace;
                font-size: 0.9rem;
                line-height: 1.7;
                border: 1px solid #1a1a1a;
                position: relative;
            }
            .prose pre code {
                background: none;
                color: inherit;
                padding: 0;
                border-radius: 0;
                font-size: inherit;
                white-space: pre;
            }
            /* Language label on code blocks */
            .prose pre[data-lang]::before {
                content: attr(data-lang);
                position: absolute;
                top: 10px;
                right: 14px;
                font-size: 0.7rem;
                text-transform: uppercase;
                color: #64748b;
                letter-spacing: 1px;
                font-family: sans-serif;
            }

            /* Horizontal Rule */
            .prose hr {
                border: none;
                border-top: 2px solid var(--border);
                margin: 3em 0;
            }

            /* ── Tags ── */
            .post-tags {
                display: flex;
                align-items: center;
                gap: 10px;
                flex-wrap: wrap;
                margin: 40px 0 10px;
                padding-top: 24px;
                border-top: 1px solid var(--border);
                color: var(--text-secondary);
                font-size: 0.9rem;
            }
            .tag-pill {
                background: var(--bg-light);
                border: 1px solid var(--border);
                padding: 4px 14px;
                border-radius: 30px;
                font-size: 0.82rem;
                color: var(--text-secondary);
                cursor: pointer;
                transition: all 0.2s;
            }
            .tag-pill:hover {
                background: var(--primary);
                color: white;
                border-color: var(--primary);
            }

            /* ── Social Share ── */
            .social-share {
                margin-top: 40px;
                padding-top: 28px;
                border-top: 1px solid var(--border);
            }
            .social-share h4 { font-size: 1rem; margin-bottom: 14px; color: var(--text-primary); }
            .share-buttons { display: flex; gap: 12px; flex-wrap: wrap; }
            .share-btn {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 10px 20px;
                border-radius: 30px;
                border: none;
                font-weight: 600;
                font-size: 0.9rem;
                cursor: pointer;
                transition: all 0.2s;
                color: white;
                text-decoration: none;
            }
            .share-btn.twitter  { background: #1a1a1a; }
            .share-btn.facebook { background: #1a1a1a; }
            .share-btn.linkedin { background: #1a1a1a; }
            .share-btn.copy-link {
                background: var(--bg-light);
                color: var(--text-primary);
                border: 1px solid var(--border);
            }
            .share-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.15); }
            .share-btn.copy-link:hover { background: var(--border); }

            /* ── Inline CTA Banner ── */
            .cta-inline-banner {
                background: linear-gradient(135deg, var(--primary) 0%, #1e1b4b 100%);
                border-radius: var(--radius-lg);
                padding: 48px 50px;
                margin: 60px 0;
                color: white;
                box-shadow: 0 20px 40px -10px rgba(0,0,0,0.3);
            }
            .cta-inline-content {
                display: flex;
                align-items: center;
                justify-content: space-between;
                gap: 24px;
                flex-wrap: wrap;
            }
            .cta-inline-text h3 {
                font-size: 1.6rem;
                font-weight: 800;
                margin-bottom: 8px;
                color: white !important;
                margin-top: 0;
            }
            .cta-inline-text p {
                font-size: 0.95rem;
                opacity: 0.9;
                margin: 0;
                color: white;
            }
            .cta-inline-btn {
                background: white;
                color: var(--primary);
                font-weight: 700;
                padding: 14px 28px;
                border-radius: 30px;
                white-space: nowrap;
                flex-shrink: 0;
                border: none;
                cursor: pointer;
                font-size: 1rem;
                transition: all 0.2s;
            }
            .cta-inline-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(0,0,0,0.25);
            }
            @media (max-width: 600px) {
                .cta-inline-banner { padding: 28px 22px; }
                .cta-inline-content { flex-direction: column; align-items: flex-start; }
            }

            /* ── Author Bio ── */
            .author-bio-card {
                display: flex;
                gap: 24px;
                background: white;
                padding: 32px;
                border-radius: var(--radius-lg);
                border: 1px solid var(--border);
                margin-top: 40px;
                box-shadow: var(--shadow-sm);
            }
            .bio-avatar-wrap {
                width: 100px;
                height: 100px;
                border-radius: 50%;
                overflow: hidden;
                flex-shrink: 0;
                border: 4px solid var(--bg-light);
                background: var(--bg-light);
                display: flex;
                align-items: center;
                justify-content: center;
            }
            .bio-avatar {
                width: 100%;
                height: 100%;
                object-fit: cover;
                display: block;
            }
            .bio-content h4 { font-size: 1.25rem; margin-bottom: 8px; color: var(--text-primary); font-weight: 700; }
            .bio-content p { font-size: 1rem; line-height: 1.6; color: var(--text-secondary); margin: 0; }
            @media (max-width: 600px) {
                .author-bio-card { flex-direction: column; align-items: center; text-align: center; padding: 24px; }
            }

            /* ── Sidebar ── */
            .sticky-sidebar {
                position: sticky;
                top: 100px;
                display: flex;
                flex-direction: column;
                gap: 24px;
            }
            .sidebar-widget {
                background: white;
                border-radius: var(--radius-lg);
                padding: 22px;
                box-shadow: var(--shadow-sm);
                border: 1px solid var(--border);
            }
            .sidebar-widget h3 {
                font-size: 0.8rem;
                color: var(--text-secondary);
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid var(--border);
                text-transform: uppercase;
                letter-spacing: 1px;
                display: flex;
                align-items: center;
                gap: 8px;
            }

            /* TOC */
            .toc-nav ul { list-style: none; padding: 0; margin: 0; }
            .toc-nav li { margin-bottom: 2px; }

            /* H2 items */
            .toc-nav li.toc-h2 > a {
                color: var(--text-secondary);
                text-decoration: none;
                font-size: 0.9rem;
                display: block;
                padding: 5px 10px;
                border-radius: 6px;
                line-height: 1.4;
                transition: all 0.15s;
                border-left: 2px solid transparent;
            }
            /* H3 items — indented */
            .toc-nav li.toc-h3 > a {
                color: var(--text-secondary);
                text-decoration: none;
                font-size: 0.82rem;
                display: block;
                padding: 4px 10px 4px 22px;
                border-radius: 6px;
                line-height: 1.4;
                transition: all 0.15s;
                border-left: 2px solid transparent;
                opacity: 0.8;
            }
            .toc-nav a:hover {
                color: var(--primary);
                background: var(--bg-light);
                border-left-color: var(--primary);
            }
            .toc-nav a.active {
                color: var(--primary);
                background: var(--primary-ghost, #f5f5f5);
                border-left-color: var(--primary);
                font-weight: 600;
            }

            /* CTA widget */
            .cta-widget {
                background: linear-gradient(135deg, var(--bg-light) 0%, white 100%);
                border-top: 3px solid var(--primary);
            }
            .cta-widget h3 { color: var(--primary); border-bottom: none; padding: 0; margin-bottom: 8px; }
            .cta-widget p { color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 16px; line-height: 1.5; }

            /* ── Related Posts ── */
            .related-posts-section {
                padding: 72px 0 90px;
                background: white;
                border-top: 1px solid var(--border);
            }
            .section-title {
                font-size: 2rem;
                font-weight: 800;
                text-align: center;
                margin-bottom: 48px;
                color: var(--text-primary);
            }
            .related-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 28px;
            }
            .related-card {
                border-radius: var(--radius-lg);
                overflow: hidden;
                background: white;
                border: 1px solid var(--border);
                box-shadow: var(--shadow-sm);
                cursor: pointer;
                transition: all 0.25s;
            }
            .related-card:hover {
                transform: translateY(-4px);
                box-shadow: 0 12px 32px rgba(0,0,0,0.12);
            }
            .related-card-img {
                position: relative;
                height: 190px;
                overflow: hidden;
            }
            .related-card-img img {
                width: 100%;
                height: 100%;
                object-fit: cover;
                transition: transform 0.4s;
            }
            .related-card:hover .related-card-img img { transform: scale(1.05); }
            .rc-badge {
                position: absolute;
                top: 14px;
                left: 14px;
                background: var(--primary);
                color: white;
                font-size: 0.72rem;
                font-weight: 700;
                text-transform: uppercase;
                letter-spacing: 0.8px;
                padding: 4px 10px;
                border-radius: 20px;
            }
            .related-card-body { padding: 20px; }
            .related-card-body h3 {
                font-size: 1.05rem;
                font-weight: 700;
                color: var(--text-primary);
                margin-bottom: 8px;
                line-height: 1.4;
            }
            .related-card-body p {
                font-size: 0.875rem;
                color: var(--text-secondary);
                margin-bottom: 14px;
                line-height: 1.5;
            }
            .rc-read-more {
                font-size: 0.85rem;
                font-weight: 600;
                color: var(--primary);
                display: flex;
                align-items: center;
                gap: 6px;
            }
        </style>
    `;

    // ── Post-render JS ──────────────────────────────────────
    setTimeout(() => {
        buildTOC();
        setupShareButtons(post);
        setupScrollSpy();
        initNavbar();
    }, 100);
}

// ── Table of Contents: H2 + H3 with scroll-spy ──────────────
function buildTOC() {
    const article  = document.getElementById('post-article');
    const container = document.getElementById('toc-container');
    if (!article || !container) return;

    const headings = article.querySelectorAll('h2, h3');
    if (headings.length === 0) {
        const widget = container.closest('.sidebar-widget');
        if (widget) widget.style.display = 'none';
        return;
    }

    container.innerHTML = '<ul id="toc-list" class="toc-list"></ul>';
    const tocList = container.querySelector('#toc-list');

    headings.forEach((heading, i) => {
        const id = `h-${i}`;
        heading.id = id;

        const li = document.createElement('li');
        li.classList.add(heading.tagName === 'H2' ? 'toc-h2' : 'toc-h3');

        const a = document.createElement('a');
        a.href    = '#' + id;
        a.textContent = heading.textContent.trim();

        a.addEventListener('click', e => {
            e.preventDefault();
            heading.scrollIntoView({ behavior: 'smooth', block: 'start' });
            document.querySelectorAll('.toc-nav a').forEach(l => l.classList.remove('active'));
            a.classList.add('active');
        });

        li.appendChild(a);
        tocList.appendChild(li);
    });
}

// ── Scroll-spy: highlight TOC item as user scrolls ──────────
function setupScrollSpy() {
    const article = document.getElementById('post-article');
    if (!article) return;
    const headings = [...article.querySelectorAll('h2[id], h3[id]')];
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                document.querySelectorAll('.toc-nav a').forEach(a => a.classList.remove('active'));
                const activeLink = document.querySelector(`.toc-nav a[href="#${entry.target.id}"]`);
                if (activeLink) activeLink.classList.add('active');
            }
        });
    }, { rootMargin: '-80px 0px -60% 0px', threshold: 0 });

    headings.forEach(h => observer.observe(h));
}

// ── Social Share Buttons ─────────────────────────────────────
function setupShareButtons(post) {
    const pageUrl  = encodeURIComponent(post.canonical_url || post.canonicalUrl || window.location.href);
    const pageTitle = encodeURIComponent(post.title);

    const btn = (id, url) => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('click', () => window.open(url, '_blank', 'width=600,height=450,noopener'));
    };

    btn('share-twitter',  `https://twitter.com/intent/tweet?url=${pageUrl}&text=${pageTitle}`);
    btn('share-facebook', `https://www.facebook.com/sharer/sharer.php?u=${pageUrl}`);
    btn('share-linkedin', `https://www.linkedin.com/sharing/share-offsite/?url=${pageUrl}`);

    const copyBtn = document.getElementById('share-copy');
    if (copyBtn) {
        copyBtn.addEventListener('click', () => {
            const href = post.canonical_url || post.canonicalUrl || window.location.href;
            navigator.clipboard.writeText(href).then(() => {
                const orig = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => { copyBtn.innerHTML = orig; }, 2000);
            }).catch(() => {
                // fallback
                const ta = document.createElement('textarea');
                ta.value = href; ta.style.position = 'fixed'; ta.style.opacity = '0';
                document.body.appendChild(ta);
                ta.select(); document.execCommand('copy');
                document.body.removeChild(ta);
                const orig = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                setTimeout(() => { copyBtn.innerHTML = orig; }, 2000);
            });
        });
    }
}
