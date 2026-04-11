import { db } from './db.js';

export function getCategories() {
    try {
        const cats = db.categories.findAll();
        if (cats && cats.length > 0) {
            return ['All', ...cats.map(c => c.name)];
        }
    } catch (e) {
        console.warn('Error reading categories from db.categories', e);
    }
    return ['All', 'City Guides', 'Roommate Tips', 'Market Reports', 'Moving Guides', 'Student Housing'];
}

// Keep CATEGORIES as a backwards-compatible alias (computed once at import time)
export const CATEGORIES = getCategories();

export function getBlogPosts() {
    try {
        const posts = db.posts.findAll();
        if (posts && posts.length > 0) {
            return posts;
        }
    } catch (e) {
        console.warn('Error reading blogs from db.posts', e);
    }
    return [];
}

export function getPostBySlug(slug) {
    return getBlogPosts().find(post => post.slug === slug);
}

export function getRelatedPosts(category, currentId) {
    return getBlogPosts().filter(post => post.category === category && String(post.post_id || post.id) !== String(currentId)).slice(0, 3);
}
