/**
 * ── API Service (Connects to Hono Backend) ───────────────────
 * Handles communication with the Cloudflare Worker / D1 API.
 * All write operations (create/update/delete) sync to D1 so
 * changes made in the Admin panel are visible on every device.
 */

import { API_URL } from './config.js';
import { showToast } from './ui.js';


async function req(method, path, data, silent = false) {
    try {
        const session = JSON.parse(localStorage.getItem('rg_session') || 'null');
        const token = localStorage.getItem('token') || session?.token || session?.userId || '';

        const opts = { method, headers: { 'Content-Type': 'application/json' } };
        if (token) opts.headers.Authorization = `Bearer ${token}`;
        if (data !== undefined) opts.body = JSON.stringify(data);
        
        const url = `${API_URL}${path}`;

        const res = await fetch(url, opts);
        if (res.status === 401) {
            localStorage.removeItem('token');
            localStorage.removeItem('rg_session');
            if (!silent) {
                sessionStorage.setItem('redirectAfterLogin', window.location.pathname + window.location.search);
                showToast('Your session expired. Please sign in again.', 'warning');
                if (window.location.pathname !== '/auth/login') {
                    window.location.href = '/auth/login';
                }
            }
            return null;
        }
        if (!res.ok) {
            const err = await res.clone().json().catch(async () => {
                const body = await res.text().catch(() => '');
                return { error: body || 'Server error' };
            });
            throw new Error(err.error || err.message || `HTTP ${res.status}`);
        }

        if (res.status === 204) return null;

        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) {
            const body = await res.text().catch(() => '');
            throw new Error(`${method} ${path} → expected JSON but got "${ct || 'no content-type'}"${body ? ': ' + body.slice(0, 100) : ''}`);
        }

        const text = await res.text();
        try {
            return text ? JSON.parse(text) : null;
        } catch (e) {
            throw new Error(`${method} ${path} → invalid JSON: ${e.message}`);
        }
    } catch (err) {
        if (!silent) console.debug(`[API ${method}] ${path}:`, err);
        if (!silent) showToast(err.message || 'Server error', 'error');
        throw err;
    }
}

function toQueryString(params = {}) {
    const qs = new URLSearchParams();
    Object.entries(params || {}).forEach(([key, value]) => {
        if (value === undefined || value === null || value === '') return;
        if (Array.isArray(value)) {
            value.forEach(v => {
                if (v !== undefined && v !== null && v !== '') qs.append(key, String(v));
            });
        } else {
            qs.set(key, String(value));
        }
    });
    return qs.toString();
}

const FALLBACK_MARKETPLACE_CATEGORY_TREE = [
    {
        category_id: 'cat_furniture',
        parent_id: null,
        name: 'Furniture',
        slug: 'furniture',
        icon: 'fa-couch',
        kind: 'product',
        sort_order: 10,
        is_active: 1,
        children: [
            { category_id: 'cat_furniture_sofas', parent_id: 'cat_furniture', name: 'Sofas', slug: 'furniture-sofas', icon: 'fa-couch', kind: 'product', sort_order: 11, is_active: 1, children: [] },
            { category_id: 'cat_furniture_beds', parent_id: 'cat_furniture', name: 'Beds', slug: 'furniture-beds', icon: 'fa-bed', kind: 'product', sort_order: 12, is_active: 1, children: [] },
            { category_id: 'cat_furniture_tables', parent_id: 'cat_furniture', name: 'Tables', slug: 'furniture-tables', icon: 'fa-table', kind: 'product', sort_order: 13, is_active: 1, children: [] },
            { category_id: 'cat_furniture_chairs', parent_id: 'cat_furniture', name: 'Chairs', slug: 'furniture-chairs', icon: 'fa-chair', kind: 'product', sort_order: 14, is_active: 1, children: [] },
            { category_id: 'cat_furniture_storage', parent_id: 'cat_furniture', name: 'Storage', slug: 'furniture-storage', icon: 'fa-box-archive', kind: 'product', sort_order: 15, is_active: 1, children: [] },
        ],
    },
    {
        category_id: 'cat_electronics',
        parent_id: null,
        name: 'Electronics',
        slug: 'electronics',
        icon: 'fa-tv',
        kind: 'product',
        sort_order: 20,
        is_active: 1,
        children: [
            { category_id: 'cat_electronics_computers', parent_id: 'cat_electronics', name: 'Computers', slug: 'electronics-computers', icon: 'fa-computer', kind: 'product', sort_order: 21, is_active: 1, children: [] },
            { category_id: 'cat_electronics_tvs', parent_id: 'cat_electronics', name: 'TVs', slug: 'electronics-tvs', icon: 'fa-tv', kind: 'product', sort_order: 22, is_active: 1, children: [] },
            { category_id: 'cat_electronics_audio', parent_id: 'cat_electronics', name: 'Audio', slug: 'electronics-audio', icon: 'fa-headphones', kind: 'product', sort_order: 23, is_active: 1, children: [] },
            { category_id: 'cat_electronics_cameras', parent_id: 'cat_electronics', name: 'Cameras', slug: 'electronics-cameras', icon: 'fa-camera', kind: 'product', sort_order: 24, is_active: 1, children: [] },
        ],
    },
    {
        category_id: 'cat_mobiles',
        parent_id: null,
        name: 'Mobiles',
        slug: 'mobiles',
        icon: 'fa-mobile-screen-button',
        kind: 'product',
        attributes_schema: { fields: ['brand', 'model', 'storage', 'condition'] },
        sort_order: 30,
        is_active: 1,
        children: [
            { category_id: 'cat_mobiles_smartphones', parent_id: 'cat_mobiles', name: 'Smartphones', slug: 'mobiles-smartphones', icon: 'fa-mobile-screen-button', kind: 'product', attributes_schema: { fields: ['brand', 'model', 'storage', 'condition'] }, sort_order: 31, is_active: 1, children: [] },
            { category_id: 'cat_mobiles_tablets', parent_id: 'cat_mobiles', name: 'Tablets', slug: 'mobiles-tablets', icon: 'fa-tablet-screen-button', kind: 'product', attributes_schema: { fields: ['brand', 'model', 'storage', 'condition'] }, sort_order: 32, is_active: 1, children: [] },
            { category_id: 'cat_mobiles_accessories', parent_id: 'cat_mobiles', name: 'Accessories', slug: 'mobiles-accessories', icon: 'fa-charging-station', kind: 'product', sort_order: 33, is_active: 1, children: [] },
            { category_id: 'cat_mobiles_wearables', parent_id: 'cat_mobiles', name: 'Wearables', slug: 'mobiles-wearables', icon: 'fa-clock', kind: 'product', sort_order: 34, is_active: 1, children: [] },
        ],
    },
    {
        category_id: 'cat_vehicles',
        parent_id: null,
        name: 'Vehicles',
        slug: 'vehicles',
        icon: 'fa-car',
        kind: 'vehicle',
        sort_order: 40,
        is_active: 1,
        children: [
            { category_id: 'cat_vehicles_cars', parent_id: 'cat_vehicles', name: 'Cars', slug: 'vehicles-cars', icon: 'fa-car-side', kind: 'vehicle', attributes_schema: { fields: ['year', 'make', 'model', 'mileage', 'fuel', 'transmission'] }, sort_order: 41, is_active: 1, children: [] },
            { category_id: 'cat_vehicles_bikes', parent_id: 'cat_vehicles', name: 'Bikes', slug: 'vehicles-bikes', icon: 'fa-bicycle', kind: 'vehicle', sort_order: 42, is_active: 1, children: [] },
            { category_id: 'cat_vehicles_scooters', parent_id: 'cat_vehicles', name: 'Scooters', slug: 'vehicles-scooters', icon: 'fa-motorcycle', kind: 'vehicle', sort_order: 43, is_active: 1, children: [] },
            { category_id: 'cat_vehicles_parts', parent_id: 'cat_vehicles', name: 'Parts & Accessories', slug: 'vehicles-parts-accessories', icon: 'fa-gears', kind: 'vehicle', sort_order: 44, is_active: 1, children: [] },
        ],
    },
    {
        category_id: 'cat_home_garden',
        parent_id: null,
        name: 'Home & Garden',
        slug: 'home-garden',
        icon: 'fa-seedling',
        kind: 'product',
        sort_order: 50,
        is_active: 1,
        children: [
            { category_id: 'cat_home_garden_decor', parent_id: 'cat_home_garden', name: 'Decor', slug: 'home-garden-decor', icon: 'fa-rug', kind: 'product', sort_order: 51, is_active: 1, children: [] },
            { category_id: 'cat_home_garden_tools', parent_id: 'cat_home_garden', name: 'Tools', slug: 'home-garden-tools', icon: 'fa-hammer', kind: 'product', sort_order: 52, is_active: 1, children: [] },
            { category_id: 'cat_home_garden_plants', parent_id: 'cat_home_garden', name: 'Plants', slug: 'home-garden-plants', icon: 'fa-leaf', kind: 'product', sort_order: 53, is_active: 1, children: [] },
            { category_id: 'cat_home_garden_outdoor', parent_id: 'cat_home_garden', name: 'Outdoor', slug: 'home-garden-outdoor', icon: 'fa-umbrella-beach', kind: 'product', sort_order: 54, is_active: 1, children: [] },
        ],
    },
    {
        category_id: 'cat_appliances',
        parent_id: null,
        name: 'Appliances',
        slug: 'appliances',
        icon: 'fa-blender',
        kind: 'product',
        sort_order: 60,
        is_active: 1,
        children: [
            { category_id: 'cat_appliances_refrigerators', parent_id: 'cat_appliances', name: 'Refrigerators', slug: 'appliances-refrigerators', icon: 'fa-temperature-low', kind: 'product', sort_order: 61, is_active: 1, children: [] },
            { category_id: 'cat_appliances_washers_dryers', parent_id: 'cat_appliances', name: 'Washers & Dryers', slug: 'appliances-washers-dryers', icon: 'fa-soap', kind: 'product', sort_order: 62, is_active: 1, children: [] },
            { category_id: 'cat_appliances_kitchen', parent_id: 'cat_appliances', name: 'Kitchen Appliances', slug: 'appliances-kitchen', icon: 'fa-kitchen-set', kind: 'product', sort_order: 63, is_active: 1, children: [] },
            { category_id: 'cat_appliances_vacuums', parent_id: 'cat_appliances', name: 'Vacuums', slug: 'appliances-vacuums', icon: 'fa-broom', kind: 'product', sort_order: 64, is_active: 1, children: [] },
        ],
    },
    {
        category_id: 'cat_fashion',
        parent_id: null,
        name: 'Fashion',
        slug: 'fashion',
        icon: 'fa-shirt',
        kind: 'product',
        sort_order: 80,
        is_active: 1,
        children: [
            { category_id: 'cat_fashion_clothing', parent_id: 'cat_fashion', name: 'Clothing', slug: 'fashion-clothing', icon: 'fa-shirt', kind: 'product', sort_order: 81, is_active: 1, children: [] },
            { category_id: 'cat_fashion_shoes', parent_id: 'cat_fashion', name: 'Shoes', slug: 'fashion-shoes', icon: 'fa-shoe-prints', kind: 'product', sort_order: 82, is_active: 1, children: [] },
            { category_id: 'cat_fashion_bags', parent_id: 'cat_fashion', name: 'Bags', slug: 'fashion-bags', icon: 'fa-bag-shopping', kind: 'product', sort_order: 83, is_active: 1, children: [] },
            { category_id: 'cat_fashion_accessories', parent_id: 'cat_fashion', name: 'Accessories', slug: 'fashion-accessories', icon: 'fa-glasses', kind: 'product', sort_order: 84, is_active: 1, children: [] },
        ],
    },
    {
        category_id: 'cat_free_stuff',
        parent_id: null,
        name: 'Free Stuff',
        slug: 'free-stuff',
        icon: 'fa-gift',
        kind: 'product',
        sort_order: 90,
        is_active: 1,
        children: [
            { category_id: 'cat_free_stuff_furniture', parent_id: 'cat_free_stuff', name: 'Free Furniture', slug: 'free-stuff-furniture', icon: 'fa-couch', kind: 'product', sort_order: 91, is_active: 1, children: [] },
            { category_id: 'cat_free_stuff_electronics', parent_id: 'cat_free_stuff', name: 'Free Electronics', slug: 'free-stuff-electronics', icon: 'fa-tv', kind: 'product', sort_order: 92, is_active: 1, children: [] },
            { category_id: 'cat_free_stuff_home', parent_id: 'cat_free_stuff', name: 'Free Home Goods', slug: 'free-stuff-home-goods', icon: 'fa-box-open', kind: 'product', sort_order: 93, is_active: 1, children: [] },
            { category_id: 'cat_free_stuff_misc', parent_id: 'cat_free_stuff', name: 'Miscellaneous', slug: 'free-stuff-miscellaneous', icon: 'fa-gift', kind: 'product', sort_order: 94, is_active: 1, children: [] },
        ],
    },
];

function cloneCategoryTree(tree = FALLBACK_MARKETPLACE_CATEGORY_TREE) {
    return JSON.parse(JSON.stringify(tree));
}

async function getCategoryTreeWithFallback() {
    try {
        const tree = await req('GET', '/categories/tree', undefined, true);
        if (Array.isArray(tree) && tree.length) return tree;
    } catch (err) {
        console.debug('[API] Using fallback marketplace categories:', err.message || err);
    }
    return cloneCategoryTree();
}

export const api = {
    // ── Generic helpers ──────────────────────────────────────
    get:    (path, silent = false) => req('GET',    path, undefined, silent),
    post:   (path, data, silent = false) => req('POST',   path, data, silent),
    put:    (path, data, silent = false) => req('PUT',    path, data, silent),
    delete: (path, silent = false)       => req('DELETE', path, undefined, silent),

    // ── Users ────────────────────────────────────────────────
    getUsers:     (silent = false) => req('GET',  '/users', undefined, silent),
    createUser:   (data, silent = false) => req('POST', '/users', data, silent),
    updateUser:   (id, d, silent = false) => req('PUT',    `/users/${id}`, d, silent),
    deleteUser:   (id, silent = false) => req('DELETE', `/users/${id}`, undefined, silent),
    blockUser:    (id, silent = false) => req('POST',   `/users/${id}/block`, undefined, silent),

    // ── Listings ─────────────────────────────────────────────
    getListings:    async (silent = false) => {
        const data = await req('GET', '/listings?limit=100', undefined, silent);
        return Array.isArray(data) ? data : (Array.isArray(data?.results) ? data.results : data);
    },
    getListing:     (id, silent = false) => req('GET', `/listings/${encodeURIComponent(id)}`, undefined, silent),
    searchListings: (params = {}, silent = false) => {
        const query = toQueryString(params);
        return req('GET', query ? `/listings?${query}` : '/listings', undefined, silent);
    },
    suggestSearch:   (q, silent = false) => req('GET', `/search/suggest?q=${encodeURIComponent(q || '')}`, undefined, silent),
    saveListing:    (item, silent = false) => req('POST',   '/listings', item, silent),
    updateListing:  (id, d, silent = false) => req('PUT',    `/listings/${id}`, d, silent),
    deleteListing:  (id, silent = false) => req('DELETE', `/listings/${id}`, undefined, silent),
    markSold:       (id, silent = false) => req('POST',   `/listings/${id}/sold`, undefined, silent),

    // ── Marketplace ──────────────────────────────────────────
    getCategoryTree: () => getCategoryTreeWithFallback(),
    getMarketplaceCategories: (silent = false) => req('GET', '/categories?scope=marketplace', undefined, silent),
    saveMarketplaceCategory: (item, silent = false) => req('POST', '/categories', item, silent),
    updateMarketplaceCategory: (id, data, silent = false) => req('PUT', `/categories/${id}`, data, silent),
    deleteMarketplaceCategory: (id, silent = false) => req('DELETE', `/categories/${id}`, undefined, silent),
    getAdminMarketplace: (silent = false) => req('GET', '/admin/marketplace', undefined, silent),
    voidMarketplaceOffer: (id, silent = false) => req('PUT', `/admin/marketplace/offers/${id}/void`, {}, silent),
    deleteMarketplaceReview: (id, silent = false) => req('DELETE', `/admin/marketplace/reviews/${id}`, undefined, silent),
    getSeller:       (id, silent = false) => req('GET', `/sellers/${id}`, undefined, silent),
    getReviews:      (revieweeId, silent = false) => req('GET', `/reviews?reviewee=${encodeURIComponent(revieweeId)}`, undefined, silent),
    createReview:    (body, silent = false) => req('POST', '/reviews', body, silent),
    makeOffer:       (body, silent = false) => req('POST', '/offers', body, silent),
    getOffers:       (silent = false) => req('GET', '/offers', undefined, silent),
    respondOffer:    (id, status, silent = false) => req('PUT', `/offers/${id}`, { status }, silent),

    // ── Auth ─────────────────────────────────────────────────
    login:       (email, pw, silent = false) => req('POST', '/auth/login', { email, password: pw }, silent),
    register:    (body, silent = false) => req('POST', '/auth/register', body, silent),

    // ── Cities ───────────────────────────────────────────────
    getCities:   (silent = false) => req('GET',    '/cities', undefined, silent),
    saveCity:    (item, silent = false) => req('POST',   '/cities', item, silent),
    updateCity:  (id, d, silent = false) => req('PUT',    `/cities/${id}`, d, silent),
    deleteCity:  (id, silent = false) => req('DELETE', `/cities/${id}`, undefined, silent),

    // ── Posts ────────────────────────────────────────────────
    getPosts:    (silent = false) => req('GET',    '/posts', undefined, silent),
    savePost:    (item, silent = false) => req('POST',   '/posts', item, silent),
    updatePost:  (id, d, silent = false) => req('PUT',    `/posts/${id}`, d, silent),
    deletePost:  (id, silent = false) => req('DELETE', `/posts/${id}`, undefined, silent),

    // ── FB Cities ────────────────────────────────────────────
    getFbCities:   (silent = false) => req('GET',    '/fb-cities', undefined, silent),
    saveFbCity:    (item, silent = false) => req('POST',   '/fb-cities', item, silent),
    updateFbCity:  (id, d, silent = false) => req('PUT',    `/fb-cities/${id}`, d, silent),
    deleteFbCity:  (id, silent = false) => req('DELETE', `/fb-cities/${id}`, undefined, silent),

    // ── FB Countries ─────────────────────────────────────────
    getFbCountries:   (silent = false) => req('GET',    '/fb-countries', undefined, silent),
    saveFbCountry:    (item, silent = false) => req('POST',   '/fb-countries', item, silent),
    updateFbCountry:  (id, d, silent = false) => req('PUT',    `/fb-countries/${id}`, d, silent),
    deleteFbCountry:  (id, silent = false) => req('DELETE', `/fb-countries/${id}`, undefined, silent),

    // ── Threads ──────────────────────────────────────────────
    getThreads:       (silent = false) => req('GET',    '/threads', undefined, silent),
    saveThread:       (item, silent = false) => req('POST',   '/threads', item, silent),
    updateThread:     (id, d, silent = false) => req('PUT',    `/threads/${id}`, d, silent),
    deleteThread:     (id, silent = false) => req('DELETE', `/threads/${id}`, undefined, silent),
    archiveThread:    (id, silent = false) => req('PUT',    `/threads/${id}/archive`, undefined, silent),

    // ── Messages ─────────────────────────────────────────────
    getMessages:      (tid, silent = false) => req('GET',    tid ? `/messages?thread_id=${tid}` : '/messages', undefined, silent),
    saveMessage:      (item, silent = false) => req('POST',   '/messages', item, silent),
    updateMessage:    (id, d, silent = false) => req('PUT',    `/messages/${id}`, d, silent),
    deleteMessage:    (id, silent = false) => req('DELETE', `/messages/${id}`, undefined, silent),

    // ── Reports ──────────────────────────────────────────────
    saveReport:       (item, silent = false) => req('POST',   '/reports', item, silent),
    updateReport:     (id, d, silent = false) => req('PUT',    `/reports/${id}`, d, silent),
    deleteReport:     (id, silent = false) => req('DELETE', `/reports/${id}`, undefined, silent),

    // ── Notifications ────────────────────────────────────────
    saveNotification: (item, silent = false) => req('POST',   '/notifications', item, silent),
    updateNotification:(id, d, silent = false) => req('PUT',    `/notifications/${id}`, d, silent),
    deleteNotification:(id, silent = false) => req('DELETE', `/notifications/${id}`, undefined, silent),
};
