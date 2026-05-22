// ── Analytics Tracking Service (Local Storage) ──────────────

const ANALYTICS_KEY = 'rg_analytics';

function getAnalyticsData() {
    try {
        return JSON.parse(localStorage.getItem(ANALYTICS_KEY) || '{}');
    } catch {
        return {};
    }
}

function saveAnalyticsData(data) {
    try {
        localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
    } catch (e) {
        console.error('[Analytics] Failed to save:', e);
    }
}

function todayKey() {
    return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

/**
 * Track a page view. Admin routes are excluded to avoid skewing visitor data.
 */
export function trackPageView(path) {
    if (path.startsWith('/admin')) return;
    const data = getAnalyticsData();
    const day = todayKey();
    data.total_visits = (data.total_visits || 0) + 1;
    if (!data.daily_visits) data.daily_visits = {};
    data.daily_visits[day] = (data.daily_visits[day] || 0) + 1;
    saveAnalyticsData(data);
}

/**
 * Track a search query and its result count.
 */
export function trackSearch(query, resultCount) {
    if (!query || query.trim() === '') return;
    const data = getAnalyticsData();
    if (!data.searches) data.searches = [];
    data.searches.push({
        query: query.trim().toLowerCase(),
        results: resultCount,
        ts: new Date().toISOString(),
    });
    // Keep last 1000 searches
    if (data.searches.length > 1000) {
        data.searches = data.searches.slice(-1000);
    }
    saveAnalyticsData(data);
}

/**
 * Return total recorded page visits.
 */
export function getTotalVisits() {
    return getAnalyticsData().total_visits || 0;
}

/**
 * Return an array of daily visit counts for the last `days` days (oldest first).
 */
export function getDailyVisitCounts(days = 30) {
    const dailyVisits = getAnalyticsData().daily_visits || {};
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        result.push(dailyVisits[d.toISOString().slice(0, 10)] || 0);
    }
    return result;
}

/**
 * Return top N search queries sorted by frequency: [{ query, count }]
 */
export function getTopSearchQueries(n = 5) {
    const searches = getAnalyticsData().searches || [];
    const counts = {};
    searches.forEach(s => {
        counts[s.query] = (counts[s.query] || 0) + 1;
    });
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([query, count]) => ({ query, count }));
}

/**
 * Return top N zero-result search queries: [{ query, count }]
 */
export function getZeroResultQueries(n = 5) {
    const searches = (getAnalyticsData().searches || []).filter(s => s.results === 0);
    const counts = {};
    searches.forEach(s => {
        counts[s.query] = (counts[s.query] || 0) + 1;
    });
    return Object.entries(counts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, n)
        .map(([query, count]) => ({ query, count }));
}
