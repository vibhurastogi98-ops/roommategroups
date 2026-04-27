// /src/seo.js
// SEO Update — Reusable vanilla-JS SEO utility for RoommateGroups SPA

const SITE_NAME   = 'RoommateGroups';
const SITE_URL    = 'https://roommategroups.com';
const DEFAULT_OG  = 'https://roommategroups.com/logo.png';

/**
 * setSEO({ title, description, canonical, ogImage, schema })
 * Call at the top of every page render function.
 */
export function setSEO({ title, description, canonical, ogImage = DEFAULT_OG, schema } = {}) {
    // ── Title ────────────────────────────────────────────────────────
    document.title = title || SITE_NAME;

    // ── Core meta ────────────────────────────────────────────────────
    setMeta('name', 'description',  description || '');
    setMeta('name', 'robots',       'index, follow');
    setMeta('name', 'theme-color',  '#7C3AED');

    // ── Open Graph ───────────────────────────────────────────────────
    setMeta('property', 'og:title',       title || SITE_NAME);
    setMeta('property', 'og:description', description || '');
    setMeta('property', 'og:url',         canonical || SITE_URL);
    setMeta('property', 'og:type',        'website');
    setMeta('property', 'og:image',       ogImage);
    setMeta('property', 'og:site_name',   SITE_NAME);

    // ── Twitter Card ─────────────────────────────────────────────────
    setMeta('name', 'twitter:card',        'summary_large_image');
    setMeta('name', 'twitter:title',       title || SITE_NAME);
    setMeta('name', 'twitter:description', description || '');
    setMeta('name', 'twitter:image',       ogImage);

    // ── Canonical ────────────────────────────────────────────────────
    if (canonical) setCanonical(canonical);

    // ── JSON-LD Schema ───────────────────────────────────────────────
    if (schema) setSchema(schema);
}

// ── Helpers ──────────────────────────────────────────────────────────

function setMeta(attr, key, value) {
    let el = document.querySelector(`meta[${attr}="${key}"]`);
    if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attr, key);
        document.head.appendChild(el);
    }
    el.setAttribute('content', value);
}

function setCanonical(url) {
    let el = document.querySelector('link[rel="canonical"]');
    if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', 'canonical');
        document.head.appendChild(el);
    }
    el.setAttribute('href', url);
}

function setSchema(data) {
    let el = document.getElementById('seo-schema');
    if (!el) {
        el = document.createElement('script');
        el.id   = 'seo-schema';
        el.type = 'application/ld+json';
        document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
}
