// ── Database Service (Local Storage) ───────────────────
import { api } from './api.js';

const DB_KEY = 'rg_database';

const SEED_FAKE_USER_IDS = new Set([
    'user_host_1', 'user_guest_1', 'user_guest_2', 'user_guest_3',
    'user_guest_4', 'user_guest_5', 'user_rm_1', 'user_rm_2', 'user_rm_3'
]);

// Determine if we are on a live production URL
const IS_PROD = window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');

export function getLiveListingCount(cityId) {
    const listings = db.listings.findAll();
    return listings.filter(l => (l.city === cityId || l.city_id === cityId) && l.is_active !== false).length;
}

const SEED_DATA = {
    users: [
        {
            user_id: 'user_admin_1',
            email: 'admin@roommategroups.com',
            display_name: 'RG Admin',
            profile_photo: '',
            bio: 'System Administrator',
            city: 'city_austin',
            age_range: '25-30',
            lifestyle_tags: [],
            verification_level: 'id',
            subscription_tier: 'admin',
            stripe_customer_id: 'cus_admin001',
            saved_listings: [],
            saved_searches: [],
            blocked_users: [],
            passwordHash: 'h_n7qt9z',
            role: 'admin',
            is_active: true,
            profileComplete: true,
            created_at: '2025-01-01T00:00:00Z',
            last_active: new Date().toISOString(),
        },
        {
            user_id: 'user_admin_2',
            email: 'hello@roommategroups.com',
            display_name: 'roommategroups',
            profile_photo: '',
            bio: 'Master Admin',
            city: 'city_austin',
            age_range: '25-35',
            lifestyle_tags: [],
            verification_level: 'community',
            subscription_tier: 'admin',
            stripe_customer_id: 'cus_admin002',
            saved_listings: [],
            saved_searches: [],
            blocked_users: [],
            passwordHash: 'h_sa5p9x', // Hash for Vibhu$12345
            role: 'admin',
            is_active: true,
            profileComplete: true,
            created_at: '2026-04-24T00:00:00Z',
            last_active: new Date().toISOString(),
        }
    ],
    listings: [],
    // On live URLs, we start with an empty city list and wait for D1 sync
    cities: IS_PROD ? [] : [
        {
            city_id: 'city_austin',
            name: 'Austin',
            slug: 'austin',
            country: 'country_us',
            state_province: 'TX',
            latitude: 30.2672,
            longitude: -97.7431,
            hero_image: 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800&q=80',
            description: `<h3>A Guide to Living in Austin, Texas</h3><p>Austin is one of the fastest-growing cities in the United States.</p><h4>Cost of Living</h4><p>The median rent for a one-bedroom is around $1,600.</p>`,
            avg_rent: 1450,
            listing_count: 342,
            member_count: 1200,
            is_active: true,
            show_in_popular: true,
            show_in_footer: true,
            meta_title: 'Rooms for Rent in Austin | Find Roommates - RoommateGroups',
            meta_description: 'Discover verified rooms for rent and roommates in Austin, TX.',
            faq_items: [
                { question: 'What is the average rent in Austin?', answer: 'The average rent for a private room in Austin is approximately $1,150 per month.' },
                { question: 'How do I find a roommate in Austin?', answer: 'Browse profiles on RoommateGroups, filtering by lifestyle tags, budget, and neighborhood.' },
                { question: 'What are the best neighborhoods for renters in Austin?', answer: 'Downtown for luxury, East Austin for a bohemian vibe, and West Campus for students.' },
                { question: 'Is public transport reliable in Austin?', answer: 'Austin has a growing CapMetro system, but most residents benefit from having a car.' },
                { question: 'When is the best time to search?', answer: 'April–June is the peak season as many student leases expire.' }
            ]
        }
    ],
    countries: [
        { country_id: 'country_us', name: 'United States', slug: 'us', code: 'US', flag_emoji: '🇺🇸', is_active: true },
        { country_id: 'country_fr', name: 'France', slug: 'france', code: 'FR', flag_emoji: '🇫🇷', is_active: true },
        { country_id: 'country_de', name: 'Germany', slug: 'germany', code: 'DE', flag_emoji: '🇩🇪', is_active: true },
        { country_id: 'country_nl', name: 'Netherlands', slug: 'netherlands', code: 'NL', flag_emoji: '🇳🇱', is_active: true }
    ],
    neighborhoods: [
        { neighborhood_id: 'nb_austin_downtown', city: 'city_austin', name: 'Downtown', slug: 'downtown', avg_rent: 2200, description: 'The heart of Austin with luxury high-rises and vibrant nightlife.', listing_count: 45 },
        { neighborhood_id: 'nb_austin_east', city: 'city_austin', name: 'East Austin', slug: 'east-austin', avg_rent: 1600, description: 'A trendy, walkable area with eclectic bars and local art.', listing_count: 32 },
        { neighborhood_id: 'nb_austin_westcampus', city: 'city_austin', name: 'West Campus', slug: 'west-campus', avg_rent: 1200, description: 'Student-centric area near UT Austin with plenty of shared housing.', listing_count: 28 },
        { neighborhood_id: 'nb_austin_domain', city: 'city_austin', name: 'The Domain', slug: 'the-domain', avg_rent: 1900, description: 'High-end shopping and residential district in North Austin.', listing_count: 15 }
    ],
    threads: [],
    messages: [],
    reports: [],
    admin_logs: [],
    user_queries: [],
    images: [],
    amenities: [
        { amenity_id: 'amen_wifi', name: 'High-Speed WiFi', icon: 'fa-wifi' },
        { amenity_id: 'amen_laundry', name: 'In-unit Laundry', icon: 'fa-washing-machine' },
        { amenity_id: 'amen_ac', name: 'Air Conditioning', icon: 'fa-snowflake' },
        { amenity_id: 'amen_parking', name: 'Parking', icon: 'fa-car' },
        { amenity_id: 'amen_gym', name: 'Gym', icon: 'fa-dumbbell' }
    ],
    tags: [
        { tag_id: 'tag_clean', name: 'Clean', icon: 'fa-broom' },
        { tag_id: 'tag_social', name: 'Social', icon: 'fa-users' },
        { tag_id: 'tag_quiet', name: 'Quiet', icon: 'fa-volume-xmark' },
        { tag_id: 'tag_pet', name: 'Pet-Friendly', icon: 'fa-paw' }
    ],
    categories: IS_PROD ? [] : [
        { category_id: 'cat_1', name: 'City Guides',     slug: 'city-guides',     description: 'Guides to living in various cities.',              color: '#1a1a1a' },
        { category_id: 'cat_2', name: 'Roommate Tips',   slug: 'roommate-tips',   description: 'Tips for finding and living with roommates.',       color: '#333333' },
        { category_id: 'cat_3', name: 'Market Reports',  slug: 'market-reports',  description: 'Data and insights on the rental market.',           color: '#333333' },
        { category_id: 'cat_4', name: 'Moving Guides',   slug: 'moving-guides',   description: 'Step-by-step guides for a smooth move.',            color: '#555555' },
        { category_id: 'cat_5', name: 'Student Housing', slug: 'student-housing', description: 'Housing tips and resources for students.',          color: '#555555' }
    ],
    posts: IS_PROD ? [] : [
        {
            post_id: 'post_1',
            slug: "ultimate-guide-splitting-rent",
            title: "The Ultimate Guide to Splitting Rent Fairly",
            excerpt: "Discover the best methods for dividing rent up among roommates without ruining your friendship. Learn about income-based splits and room size calculations.",
            category: "Roommate Tips",
            author: { 
                name: "Sarah Jenkins", 
                avatar: "https://i.pravatar.cc/150?img=1",
                bio: "Sarah is a housing expert and former mediator who specializes in helping co-living arrangements thrive. She has lived with over 15 different roommates in 4 cities."
            },
            date: "Oct 12, 2026",
            readTime: "8 min read",
            image: "https://images.unsplash.com/photo-1449844908441-8829872d2607?auto=format&fit=crop&q=80&w=1200",
            content: `<p class="lead">Splitting rent with roommates can be tricky. Here's our comprehensive guide to doing it fairly.</p><h2>1. Income-Based Split</h2><p>The most common method is to split rent proportionally based on each person's income. If one person earns 60% of the total household income, they pay 60% of the rent.</p><h2>2. Room Size Method</h2><p>Larger rooms should cost more. A master bedroom with private bathroom might be worth 1.5x a smaller bedroom.</p><h2>3. Equal Split</h2><p>Simplest method - everyone pays the same. Best for similar incomes and room sizes.</p>`,
            published_date: '2026-10-12T12:00:00Z',
            is_published: true
        }
    ],
    fb_countries: [
        { fb_country_id: 'fbc_1', country_name: 'United States', created_at: '2026-01-01T00:00:00Z' },
        { fb_country_id: 'fbc_2', country_name: 'United Kingdom', created_at: '2026-01-01T00:00:00Z' },
        { fb_country_id: 'fbc_3', country_name: 'Germany', created_at: '2026-01-01T00:00:00Z' },
        { fb_country_id: 'fbc_4', country_name: 'France', created_at: '2026-01-01T00:00:00Z' },
        { fb_country_id: 'fbc_5', country_name: 'Australia', created_at: '2026-01-01T00:00:00Z' },
        { fb_country_id: 'fbc_6', country_name: 'Canada', created_at: '2026-01-01T00:00:00Z' },
    ],
    fb_cities: IS_PROD ? [] : [
        { fb_city_id: 'fbcity_1', country_id: 'fbc_1', city_name: 'Austin', city_image: 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800&h=400&fit=crop', fb_group_name: 'Austin Roommates & Rooms for Rent', fb_group_link: 'https://www.facebook.com/groups/austinroommates', total_members: 24800, is_popular: true, priority: 1, created_at: '2026-01-01T00:00:00Z' },
        { fb_city_id: 'fbcity_2', country_id: 'fbc_1', city_name: 'New York City', city_image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=400&fit=crop', fb_group_name: 'NYC Rooms & Roommates', fb_group_link: 'https://www.facebook.com/groups/nycroommates', total_members: 142000, is_popular: true, priority: 2, created_at: '2026-01-01T00:00:00Z' }
    ],
};

function getDB() { return JSON.parse(localStorage.getItem(DB_KEY) || '{}'); }
function saveDB(data) {
    try {
        localStorage.setItem(DB_KEY, JSON.stringify(data));
    } catch (e) {
        if (e.name === 'QuotaExceededError' || e.code === 22) {
            console.error('[DB] LocalStorage quota exceeded!', e);
            const sizeKB = (JSON.stringify(data).length / 1024).toFixed(2);
            throw new Error(`Database is full (Quota exceeded). Current size: ${sizeKB}KB. Please try uploading smaller images or deleting old posts.`);
        }
        throw e;
    }
}
function generateId(prefix) { return prefix + '_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6); }

// Collections that are synced to D1 so all devices share the same data
const D1_SYNC_MAP = {
    users:        { save: (item) => api.createUser(item), update: (id,d) => api.updateUser(id,d), del: (id) => api.deleteUser(id) },
    cities:       { save: (item) => api.saveCity(item),   update: (id,d) => api.updateCity(id,d),   del: (id) => api.deleteCity(id) },
    listings:     { save: (item) => api.saveListing(item),update: (id,d) => api.updateListing(id,d),del: (id) => api.deleteListing(id) },
    posts:        { save: (item) => api.savePost(item),   update: (id,d) => api.updatePost(id,d),   del: (id) => api.deletePost(id) },
    fb_countries: { save: (item) => api.saveFbCountry(item), update: (id,d) => api.updateFbCountry(id,d), del: (id) => api.deleteFbCountry(id) },
    fb_cities:    { save: (item) => api.saveFbCity(item), update: (id,d) => api.updateFbCity(id,d), del: (id) => api.deleteFbCity(id) },
    threads:      { save: (item) => api.saveThread(item), update: (id,d) => api.updateThread(id,d), del: (id) => api.deleteThread(id) },
    messages:     { save: (item) => api.saveMessage(item), update: (id,d) => api.updateMessage(id,d), del: (id) => api.deleteMessage(id) },
    reports:      { save: (item) => api.saveReport(item), update: (id,d) => api.updateReport(id,d), del: (id) => api.deleteReport(id) },
    notifications:{ save: (item) => api.saveNotification(item), update: (id,d) => api.updateNotification(id,d), del: (id) => api.deleteNotification(id) },
    user_queries: { save: (item) => api.post('/user_queries', item), update: (id,d) => api.put(`/user_queries/${id}`, d), del: (id) => api.delete(`/user_queries/${id}`) },
};

class Collection {
    constructor(name, idField, prefix) {
        this.name = name; this.idField = idField; this.prefix = prefix;
    }
    findAll() { return getDB()[this.name] || []; }
    findById(id) {
        return this.findAll().find(i => (i[this.idField] === id) || (i.id === id)) || null;
    }
    find(predicate) { return this.findAll().filter(predicate); }
    findOne(predicate) { return this.findAll().find(predicate) || null; }
    findMany(query = {}) {
        return this.findAll().filter(item =>
            Object.entries(query).every(([k, v]) => {
                if (k === this.idField && !item[k] && item.id) return item.id === v;
                if (Array.isArray(item[k]) && !Array.isArray(v)) return item[k].includes(v);
                return item[k] === v;
            })
        );
    }
    async create(data) {
        const raw = getDB();
        if (!raw[this.name]) raw[this.name] = [];
        const item = { [this.idField]: generateId(this.prefix), created_at: new Date().toISOString(), ...data };
        raw[this.name].push(item);
        saveDB(raw);
        // 🔄 Sync to D1 so all devices see this immediately
        const sync = D1_SYNC_MAP[this.name];
        if (sync) {
            try {
                await sync.save(item);
            } catch (e) {
                console.error('[D1 sync create failed]', e);
                // Optionally: Rollback local change if sync is critical
                // For now, we just log it, but since it's awaited, the caller can catch it.
                throw e;
            }
        }
        window.dispatchEvent(new CustomEvent('db-synced', { detail: { type: this.name, action: 'create' } }));
        return item;
    }
    async update(id, data) {
        const raw = getDB();
        const items = raw[this.name] || [];
        const idx = items.findIndex(i => (i[this.idField] === id) || (i.id === id));
        if (idx === -1) return null;
        const updated = { ...items[idx], ...data, updated_at: new Date().toISOString() };
        items[idx] = updated;
        saveDB(raw);
        // 🔄 Sync to D1
        const sync = D1_SYNC_MAP[this.name];
        if (sync) {
            try {
                await sync.update(id, data);
            } catch (e) {
                console.error('[D1 sync update failed]', e);
                throw e;
            }
        }
        window.dispatchEvent(new CustomEvent('db-synced', { detail: { type: this.name, action: 'update' } }));
        return updated;
    }
    async delete(id) {
        const raw = getDB();
        const items = raw[this.name] || [];
        const idx = items.findIndex(i => (i[this.idField] === id) || (i.id === id));
        if (idx === -1) return false;
        items.splice(idx, 1);
        saveDB(raw);
        // 🔄 Sync to D1
        const sync = D1_SYNC_MAP[this.name];
        if (sync) {
            try {
                await sync.del(id);
            } catch (e) {
                console.error('[D1 sync delete failed]', e);
                throw e;
            }
        }
        window.dispatchEvent(new CustomEvent('db-synced', { detail: { type: this.name, action: 'delete' } }));
        return true;
    }
}

export const db = {
    users:         new Collection('users', 'user_id', 'user'),
    listings:      new Collection('listings', 'listing_id', 'list'),
    cities:        new Collection('cities', 'city_id', 'city'),
    countries:     new Collection('countries', 'country_id', 'country'),
    neighborhoods: new Collection('neighborhoods', 'neighborhood_id', 'nb'),
    threads:       new Collection('threads', 'thread_id', 'th'),
    messages:      new Collection('messages', 'message_id', 'msg'),
    reports:       new Collection('reports', 'report_id', 'rep'),
    admin_logs:    new Collection('admin_logs', 'log_id', 'log'),
    user_queries:  new Collection('user_queries', 'query_id', 'q'),
    images:        new Collection('images', 'image_id', 'img'),
    amenities:     new Collection('amenities', 'amenity_id', 'amen'),
    tags:          new Collection('tags', 'tag_id', 'tag'),
    categories:    new Collection('categories', 'category_id', 'cat'),
    posts:         new Collection('posts', 'post_id', 'post'),
    fb_countries:  new Collection('fb_countries', 'fb_country_id', 'fbc'),
    fb_cities:     new Collection('fb_cities', 'fb_city_id', 'fbcity'),
    notifications: new Collection('notifications', 'notification_id', 'notif'),
};

export async function initDB() {
    // ── Step 1: Seed localStorage if this is a brand-new device ──
    if (!localStorage.getItem(DB_KEY)) {
        // console.log('[DB] First load — seeding localStorage with initial data.');
        localStorage.setItem(DB_KEY, JSON.stringify(SEED_DATA));
    }

    // ── Step 2: Run localStorage migrations ───────────────────
    const raw = getDB();
    let updated = false;
    if (!raw.fb_countries) { raw.fb_countries = SEED_DATA.fb_countries; updated = true; }
    if (!raw.user_queries)  { raw.user_queries = [];                      updated = true; }
    if (!raw.categories)    { raw.categories   = SEED_DATA.categories;    updated = true; }
    if (!raw.posts)         { raw.posts        = SEED_DATA.posts;         updated = true; }
    if (!raw.fb_cities)     { raw.fb_cities    = SEED_DATA.fb_cities;     updated = true; }
    if (updated) saveDB(raw);

    // ── Step 3: Global Sync with D1 ───────────────────────────
    // This is the key step: D1 is the single source of truth for
    // admin-edited content. Fetch it and overwrite localStorage.
    try {
        const [d1Users, d1Cities, d1Listings, d1Posts, d1FbCities, d1Categories, d1FbCountries, d1Threads, d1Messages, d1Reports, d1Notifications, d1UserQueries] = await Promise.all([
            api.getUsers().catch(() => null),
            api.getCities().catch(() => null),
            api.getListings().catch(() => null),
            api.getPosts().catch(() => null),
            api.getFbCities().catch(() => null),
            api.get('/categories').catch(() => null),
            api.getFbCountries().catch(() => null),
            api.getThreads().catch(() => null),
            api.getMessages().catch(() => null),
            api.get('/reports').catch(() => null),
            api.get('/notifications').catch(() => null),
            api.get('/user_queries').catch(() => null),
        ]);
        const live = getDB();
        let liveUpdated = false;
        
        // IMPORTANT: We overwrite local data even if the array is empty [].
        // This ensures that if the admin deletes all data, all devices see an empty list.
        if (Array.isArray(d1Users)) {
            // Map D1 snake_case keys back to localStorage camelCase if necessary, 
            // but for now we just store as is and update auth.js to be flexible.
            live.users = d1Users; 
            liveUpdated = true; 
        }
        if (Array.isArray(d1Cities))    { live.cities    = d1Cities;    liveUpdated = true; }
        if (Array.isArray(d1Listings))  { live.listings  = d1Listings;  liveUpdated = true; }
        if (Array.isArray(d1Posts))     { live.posts     = d1Posts;     liveUpdated = true; }
        if (Array.isArray(d1FbCities))  { live.fb_cities = d1FbCities;  liveUpdated = true; }
        if (Array.isArray(d1Categories)){ live.categories = d1Categories; liveUpdated = true; }
        if (Array.isArray(d1FbCountries)){ live.fb_countries = d1FbCountries; liveUpdated = true; }
        if (Array.isArray(d1Threads))   { live.threads = d1Threads; liveUpdated = true; }
        if (Array.isArray(d1Messages))  { live.messages = d1Messages; liveUpdated = true; }
        if (Array.isArray(d1Reports))   { live.reports = d1Reports; liveUpdated = true; }
        if (Array.isArray(d1Notifications)){ live.notifications = d1Notifications; liveUpdated = true; }
        if (Array.isArray(d1UserQueries)) { live.user_queries = d1UserQueries; liveUpdated = true; }
        
        if (liveUpdated) {
            saveDB(live);
            // console.log('[DB] ✅ Loaded live data from D1 — all devices in sync.');
            return true;
        }
    } catch (err) {
        console.debug('[DB] D1 not reachable — using cached localStorage data.', err);
    }
    return false;
}

/**
 * ── Background Sync ──
 * Only fetches threads and messages to keep it lightweight.
 */
export async function syncMessagesAndThreads() {
    try {
        const [d1Threads, d1Messages, d1Notifications, d1Reports] = await Promise.all([
            api.getThreads().catch(() => null),
            api.getMessages().catch(() => null),
            api.get('/notifications').catch(() => []),
            api.get('/reports').catch(() => []),
        ]);

        const dbData = getDB();
        let changed = false;

        if (Array.isArray(d1Threads)) {
            const old = JSON.stringify(dbData.threads);
            const next = JSON.stringify(d1Threads);
            if (old !== next) { dbData.threads = d1Threads; changed = true; }
        }
        if (Array.isArray(d1Messages)) {
            const old = JSON.stringify(dbData.messages);
            const next = JSON.stringify(d1Messages);
            if (old !== next) { dbData.messages = d1Messages; changed = true; }
        }
        if (Array.isArray(d1Notifications)) {
            const old = JSON.stringify(dbData.notifications);
            const next = JSON.stringify(d1Notifications);
            if (old !== next) { dbData.notifications = d1Notifications; changed = true; }
        }
        if (Array.isArray(d1Reports)) {
            const old = JSON.stringify(dbData.reports);
            const next = JSON.stringify(d1Reports);
            if (old !== next) { dbData.reports = d1Reports; changed = true; }
        }

        if (changed) {
            saveDB(dbData);
            window.dispatchEvent(new CustomEvent('db-synced', { detail: { type: 'messages' } }));
            return true;
        }
    } catch (err) {
        console.warn('[DB] Background sync failed', err);
    }
    return false;
}


// Function to reset database (for testing purposes)
export function resetDB() {
    localStorage.removeItem(DB_KEY);
    window.location.reload();
}
