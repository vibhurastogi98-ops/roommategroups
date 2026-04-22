// ── Database Service (Local Storage) ───────────────────
import { api } from './api.js';

const DB_KEY = 'rg_database';

const SEED_FAKE_USER_IDS = new Set([
    'user_host_1', 'user_guest_1', 'user_guest_2', 'user_guest_3',
    'user_guest_4', 'user_guest_5', 'user_rm_1', 'user_rm_2', 'user_rm_3'
]);

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
            created_at: '2025-01-01T00:00:00Z',
            last_active: new Date().toISOString(),
        }
    ],
    listings: [],
    cities: [
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
        },
        { city_id: 'city_portland', name: 'Portland', slug: 'portland', country: 'country_us', state_province: 'OR', latitude: 45.5152, longitude: -122.6784, hero_image: 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80&v=3', description: 'Keep Portland Weird', avg_rent: 1300, listing_count: 218, member_count: 850, is_active: true, show_in_popular: true, show_in_footer: true, faq_items: [] },
        { city_id: 'city_san_antonio', name: 'San Antonio', slug: 'san-antonio', country: 'country_us', state_province: 'TX', latitude: 29.4241, longitude: -98.4936, hero_image: 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=1600&h=600&fit=crop&v=3', description: 'The Alamo City', avg_rent: 1100, listing_count: 185, member_count: 600, is_active: true, show_in_popular: false, show_in_footer: false, faq_items: [] },
        { city_id: 'city_houston', name: 'Houston', slug: 'houston', country: 'country_us', state_province: 'TX', latitude: 29.7604, longitude: -95.3698, hero_image: 'https://images.unsplash.com/photo-1530089711124-9ca31fb9e863?w=1600&h=600&fit=crop&v=3', description: 'Space City', avg_rent: 1350, listing_count: 412, member_count: 1500, is_active: false, show_in_popular: false, show_in_footer: false, faq_items: [] },
        { city_id: 'city_dallas', name: 'Dallas', slug: 'dallas', country: 'country_us', state_province: 'TX', latitude: 32.7767, longitude: -96.7970, hero_image: 'https://images.unsplash.com/photo-1568240219730-85f8398687b1?w=1600&h=600&fit=crop&v=3', description: 'Big D', avg_rent: 1400, listing_count: 367, member_count: 1100, is_active: true, show_in_popular: false, show_in_footer: false, faq_items: [] },
        { city_id: 'city_seattle', name: 'Seattle', slug: 'seattle', country: 'country_us', state_province: 'WA', latitude: 47.6062, longitude: -122.3321, hero_image: 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?auto=format&fit=crop&w=800&q=85&v=3', description: 'Emerald City', avg_rent: 1800, listing_count: 456, member_count: 1300, is_active: true, show_in_popular: true, show_in_footer: true, faq_items: [] },
        { city_id: 'city_sf', name: 'San Francisco', slug: 'san-francisco', country: 'country_us', state_province: 'CA', latitude: 37.7749, longitude: -122.4194, hero_image: 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=85&v=3', description: 'Bay Area', avg_rent: 2500, listing_count: 892, member_count: 2200, is_active: true, show_in_popular: true, show_in_footer: true, faq_items: [] },
        { city_id: 'city_la', name: 'Los Angeles', slug: 'los-angeles', country: 'country_us', state_province: 'CA', latitude: 34.0522, longitude: -118.2437, hero_image: 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=800&q=85&v=3', description: 'City of Angels', avg_rent: 2100, listing_count: 1204, member_count: 3100, is_active: true, show_in_popular: true, show_in_footer: true, faq_items: [] },
        { city_id: 'city_nola', name: 'New Orleans', slug: 'new-orleans', country: 'country_us', state_province: 'LA', latitude: 29.9511, longitude: -90.0715, hero_image: 'https://images.unsplash.com/photo-1549925245-da6cb6824962?auto=format&fit=crop&w=800&q=85&v=3', description: 'The Big Easy', avg_rent: 1200, listing_count: 156, member_count: 450, is_active: true, show_in_popular: true, show_in_footer: true, faq_items: [] },
        { city_id: 'city_paris', name: 'Paris', slug: 'paris', country: 'country_fr', state_province: 'IDF', latitude: 48.8566, longitude: 2.3522, hero_image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=85&v=3', description: 'City of Light', avg_rent: 1400, listing_count: 678, member_count: 1800, is_active: true, show_in_popular: true, show_in_footer: true, faq_items: [] },
        { city_id: 'city_berlin', name: 'Berlin', slug: 'berlin', country: 'country_de', state_province: 'BE', latitude: 52.5200, longitude: 13.4050, hero_image: 'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=800&q=85&v=3', description: 'Capital of Germany', avg_rent: 1100, listing_count: 534, member_count: 1500, is_active: true, show_in_popular: true, show_in_footer: true, faq_items: [] },
        { city_id: 'city_amsterdam', name: 'Amsterdam', slug: 'amsterdam', country: 'country_nl', state_province: 'NH', latitude: 52.3676, longitude: 4.9041, hero_image: 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=800&q=85&v=3', description: 'Venice of the North', avg_rent: 1600, listing_count: 412, member_count: 1100, is_active: true, show_in_popular: true, show_in_footer: true, faq_items: [] },
        { city_id: 'city_charleston', name: 'Charleston', slug: 'charleston', country: 'country_us', state_province: 'SC', latitude: 32.7765, longitude: -79.9311, hero_image: 'https://images.unsplash.com/photo-1551061713-2868fb7303d4?auto=format&fit=crop&w=800&q=85&v=3', description: 'Holy City', avg_rent: 1500, listing_count: 98, member_count: 300, is_active: true, show_in_popular: true, show_in_footer: true, faq_items: [] },
        { city_id: 'city_detroit', name: 'Detroit', slug: 'detroit', country: 'country_us', state_province: 'MI', latitude: 42.3314, longitude: -83.0458, hero_image: 'https://images.unsplash.com/photo-1502174832274-bc1ec64c3963?auto=format&fit=crop&w=800&q=85&v=3', description: 'Motor City', avg_rent: 1000, listing_count: 187, member_count: 550, is_active: true, show_in_popular: true, show_in_footer: true, faq_items: [] },
        { city_id: 'city_st_louis', name: 'St. Louis', slug: 'st-louis', country: 'country_us', state_province: 'MO', latitude: 38.6270, longitude: -90.1994, hero_image: 'https://images.unsplash.com/photo-1471644865743-1623432420fd?auto=format&fit=crop&w=800&q=85&v=3', description: 'Gateway to the West', avg_rent: 1050, listing_count: 143, member_count: 400, is_active: true, show_in_popular: true, faq_items: [] },
    ],
    countries: [
        { country_id: 'country_us', name: 'United States', slug: 'us', code: 'US', flag_emoji: '🇺🇸', is_active: true },
        { country_id: 'country_fr', name: 'France', slug: 'france', code: 'FR', flag_emoji: '🇫🇷', is_active: true },
        { country_id: 'country_de', name: 'Germany', slug: 'germany', code: 'DE', flag_emoji: '🇩🇪', is_active: true },
        { country_id: 'country_nl', name: 'Netherlands', slug: 'netherlands', code: 'NL', flag_emoji: '🇳🇱', is_active: true }
    ],
    neighborhoods: [],
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
    categories: [
        { category_id: 'cat_1', name: 'City Guides',     slug: 'city-guides',     description: 'Guides to living in various cities.',              color: '#1a1a1a' },
        { category_id: 'cat_2', name: 'Roommate Tips',   slug: 'roommate-tips',   description: 'Tips for finding and living with roommates.',       color: '#333333' },
        { category_id: 'cat_3', name: 'Market Reports',  slug: 'market-reports',  description: 'Data and insights on the rental market.',           color: '#333333' },
        { category_id: 'cat_4', name: 'Moving Guides',   slug: 'moving-guides',   description: 'Step-by-step guides for a smooth move.',            color: '#555555' },
        { category_id: 'cat_5', name: 'Student Housing', slug: 'student-housing', description: 'Housing tips and resources for students.',          color: '#555555' }
    ],
    posts: [
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
        },
        {
            post_id: 'post_2',
            slug: "renters-guide-austin-neighborhoods",
            title: "A Renter's Guide to Austin Neighborhoods",
            excerpt: "Moving to Austin? From the bustling streets of Downtown to the quirky vibes of South Congress, we explore the best neighborhoods for renters.",
            category: "City Guides",
            author: { 
                name: "Emily Rogers", 
                avatar: "https://i.pravatar.cc/150?img=5",
                bio: "Emily is an Austin native who loves exploring the city's food truck scene and live music venues."
            },
            date: "Oct 09, 2026",
            readTime: "12 min read",
            image: "https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&q=80&w=1200",
            content: `<p class="lead">Austin is notoriously sprawling and diverse. Finding the right neighborhood is the difference between loving your time here and spending half your life in traffic on I-35.</p><h2>South Congress (SoCo)</h2><p>If you have the budget and want to be in the center of the "Keep Austin Weird" culture, SoCo is the place. It is highly walkable, filled with vintage boutiques, iconic eateries, and live music. Rent is premium here, so pairing up with roommates is highly recommended.</p><h2>The Domain (North Austin)</h2><p>Often called "Austin's second downtown," The Domain is a massive mixed-use development that feels a bit more like Silicon Valley than Texas. If you work in tech and hate commuting, this is where you want to be. The apartments are new, amenity-heavy, and pricey.</p><h2>East Austin</h2><p>Once the industrial side of town, the East Side is now the epicenter of Austin's hip food, brewery, and arts scene. It's grittier than The Domain but offers more character and slightly more affordable duplex and housing rentals for roommate groups.</p>`,
            published_date: '2026-10-09T12:00:00Z',
            is_published: true
        },
        {
            post_id: 'post_3',
            slug: "red-flags-apartment-tours",
            title: "Red Flags to Watch Out For During Apartment Tours",
            excerpt: "Don't sign that lease until you've checked these 7 crucial areas. Learn how to spot hidden water damage, pest issues, and bad landlords.",
            category: "Moving Guides",
            author: { 
                name: "Michael Vance", 
                avatar: "https://i.pravatar.cc/150?img=8",
                bio: "Michael is a property manager turned tenant advocate. He exposes the tricks bad landlords use to hide apartment defects."
            },
            date: "Sep 28, 2026",
            readTime: "6 min read",
            image: "https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&q=80&w=1200",
            content: `<p class="lead">Apartment tours are designed to sell you on the space. Staging, lighting, and fresh paint can hide a multitude of sins. Here is exactly what you should be looking for.</p><h2>1. The Water Pressure Test</h2><p>Never walk out of a viewing without turning on the shower. Bad water pressure is rarely fixable because it usually points to building-wide plumbing issues. Turn on the sink and shower at the same time and flush the toilet. Did the temperature drop? Did the pressure die? Red flag.</p><h2>2. Cellular Service Dead Zones</h2><p>In the age of remote work, moving into an apartment where you can't get a signal is a disaster. Be sure to check your phone in every room—especially the room you plan to use as an office.</p><h2>3. Inspecting for Pests</h2><p>Don't just look at the floors. Open the cabinets under the sink. Look for small droppings or traps the landlord "forgot" to remove. Check the baseboards for gaps where insects might enter.</p><blockquote>"A fresh coat of paint over a water stain doesn't fix a leaking roof. Look up at the ceilings, not just down at the floors."</blockquote>`,
            published_date: '2026-09-28T12:00:00Z',
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

    fb_cities: [
        { fb_city_id: 'fbcity_1', country_id: 'fbc_1', city_name: 'Austin', city_image: 'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800&h=400&fit=crop', fb_group_name: 'Austin Roommates & Rooms for Rent', fb_group_link: 'https://www.facebook.com/groups/austinroommates', total_members: 24800, is_popular: true, priority: 1, created_at: '2026-01-01T00:00:00Z' },
        { fb_city_id: 'fbcity_2', country_id: 'fbc_1', city_name: 'New York City', city_image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=400&fit=crop', fb_group_name: 'NYC Rooms & Roommates', fb_group_link: 'https://www.facebook.com/groups/nycroommates', total_members: 142000, is_popular: true, priority: 2, created_at: '2026-01-01T00:00:00Z' },
        { fb_city_id: 'fbcity_3', country_id: 'fbc_1', city_name: 'Los Angeles', city_image: 'https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=800&h=400&fit=crop', fb_group_name: 'Los Angeles Roommates', fb_group_link: 'https://www.facebook.com/groups/laroommates', total_members: 89500, is_popular: true, priority: 3, created_at: '2026-01-01T00:00:00Z' },
        { fb_city_id: 'fbcity_4', country_id: 'fbc_1', city_name: 'Seattle', city_image: 'https://images.unsplash.com/photo-1542944037-460b12bc1126?w=800&h=400&fit=crop', fb_group_name: 'Seattle Roommates & Housing', fb_group_link: 'https://www.facebook.com/groups/seattleroommates', total_members: 31200, is_popular: true, priority: 4, created_at: '2026-01-01T00:00:00Z' },
        { fb_city_id: 'fbcity_5', country_id: 'fbc_1', city_name: 'Chicago', city_image: 'https://images.unsplash.com/photo-1494522303221-719e8b46ed65?w=800&h=400&fit=crop', fb_group_name: 'Chicago Roommates & Apartments', fb_group_link: 'https://www.facebook.com/groups/chicagoroommates', total_members: 67300, is_popular: true, priority: 5, created_at: '2026-01-01T00:00:00Z' },
        { fb_city_id: 'fbcity_6', country_id: 'fbc_2', city_name: 'London', city_image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=400&fit=crop', fb_group_name: 'London Flatmates & Room to Rent', fb_group_link: 'https://www.facebook.com/groups/londonflatmates', total_members: 215000, is_popular: true, priority: 6, created_at: '2026-01-01T00:00:00Z' },
        { fb_city_id: 'fbcity_7', country_id: 'fbc_2', city_name: 'Manchester', city_image: 'https://images.unsplash.com/photo-1543872084-c7bd3822856f?w=800&h=400&fit=crop', fb_group_name: 'Manchester Rooms & Flatmates', fb_group_link: 'https://www.facebook.com/groups/manchesterrooms', total_members: 38400, is_popular: true, priority: 7, created_at: '2026-01-01T00:00:00Z' },
        { fb_city_id: 'fbcity_8', country_id: 'fbc_3', city_name: 'Berlin', city_image: 'https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=800&h=400&fit=crop', fb_group_name: 'Berlin Rooms & WG Zimmer', fb_group_link: 'https://www.facebook.com/groups/berlinrooms', total_members: 92100, is_popular: true, priority: 8, created_at: '2026-01-01T00:00:00Z' },
        { fb_city_id: 'fbcity_9', country_id: 'fbc_3', city_name: 'Munich', city_image: 'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=800&h=400&fit=crop', fb_group_name: 'Munich Apartments & WG', fb_group_link: 'https://www.facebook.com/groups/munichrooms', total_members: 44600, is_popular: true, priority: 9, created_at: '2026-01-01T00:00:00Z' },
        { fb_city_id: 'fbcity_10', country_id: 'fbc_4', city_name: 'Paris', city_image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=400&fit=crop', fb_group_name: 'Paris Colocation & Rooms', fb_group_link: 'https://www.facebook.com/groups/pariscolocation', total_members: 78900, is_popular: true, priority: 10, created_at: '2026-01-01T00:00:00Z' },
        { fb_city_id: 'fbcity_11', country_id: 'fbc_5', city_name: 'Sydney', city_image: 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=400&fit=crop', fb_group_name: 'Sydney Flatmates & Share Houses', fb_group_link: 'https://www.facebook.com/groups/sydneyflatmates', total_members: 56200, is_popular: true, priority: 11, created_at: '2026-01-01T00:00:00Z' },
        { fb_city_id: 'fbcity_12', country_id: 'fbc_5', city_name: 'Melbourne', city_image: 'https://images.unsplash.com/photo-1545044846-351ba102b6d5?w=800&h=400&fit=crop', fb_group_name: 'Melbourne Rooms & Flatmates', fb_group_link: 'https://www.facebook.com/groups/melbournerooms', total_members: 48300, is_popular: true, priority: 12, created_at: '2026-01-01T00:00:00Z' },
        { fb_city_id: 'fbcity_13', country_id: 'fbc_6', city_name: 'Toronto', city_image: 'https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=800&h=400&fit=crop', fb_group_name: 'Toronto Roommates & Rooms', fb_group_link: 'https://www.facebook.com/groups/torontoroommates', total_members: 63800, is_popular: true, priority: 13, created_at: '2026-01-01T00:00:00Z' },
        { fb_city_id: 'fbcity_14', country_id: 'fbc_6', city_name: 'Vancouver', city_image: 'https://images.unsplash.com/photo-1560814304-4f05b62af116?w=800&h=400&fit=crop', fb_group_name: 'Vancouver Roommates & Rentals', fb_group_link: 'https://www.facebook.com/groups/vancouverroommates', total_members: 41700, is_popular: true, priority: 14, created_at: '2026-01-01T00:00:00Z' },
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
    create(data) {
        const raw = getDB();
        if (!raw[this.name]) raw[this.name] = [];
        const item = { [this.idField]: generateId(this.prefix), created_at: new Date().toISOString(), ...data };
        raw[this.name].push(item);
        saveDB(raw);
        return item;
    }
    update(id, data) {
        const raw = getDB();
        const col = raw[this.name] || [];
        const i = col.findIndex(x => (x[this.idField] === id) || (x.id === id));
        if (i === -1) return null;
        col[i] = { ...col[i], ...data };
        saveDB(raw);
        return col[i];
    }
    delete(id) {
        const raw = getDB();
        const col = raw[this.name] || [];
        raw[this.name] = col.filter(x => (x[this.idField] !== id) && (x.id !== id));
        saveDB(raw);
    }
}

export async function initDB() {
    const hasLocalData = !!localStorage.getItem(DB_KEY);
    
    // Check Hono API connection in background (silent to avoid console noise if not running)
    api.get('/r2-check', true).then(res => {
        console.log('[API] Hono connection established:', res.message);
    }).catch(() => {
        console.debug('[API] Hono backend not available locally — using localStorage fallback.');
    });

    // If we already have local data, migrate any new collections
    if (hasLocalData) {
        console.log('[DB] Using cached localStorage data.');
        const raw = getDB();
        let updated = false;
        if (!raw.fb_countries) { raw.fb_countries = SEED_DATA.fb_countries; updated = true; }
        if (!raw.fb_cities) { raw.fb_cities = SEED_DATA.fb_cities; updated = true; }
        else {
            if (raw.fb_cities.length > 0 && raw.fb_cities[0].is_popular === undefined) {
                raw.fb_cities = raw.fb_cities.map((c, idx) => ({ 
                    ...c, 
                    is_popular: true, 
                    priority: c.priority !== undefined ? c.priority : (idx + 1) 
                }));
                updated = true;
            }
        }
        if (!raw.user_queries) { raw.user_queries = []; updated = true; }
        // Versioned Migration: Force Refresh Curated Data (Fix visuals/mixups)
        if (!raw.system_version || raw.system_version < 3) {
            console.log('[DB] Migrating to version 3 (Force Data Sync)');
            raw.cities = SEED_DATA.cities.map(sc => {
                const existing = raw.cities?.find(c => c.city_id === sc.city_id);
                return existing ? { ...existing, ...sc } : sc;
            });
            raw.fb_cities = SEED_DATA.fb_cities;
            raw.system_version = 3;
            updated = true;
        }
        // Migrate: ensure all 5 base blog categories exist
        if (!raw.categories) { raw.categories = SEED_DATA.categories; updated = true; }
        else {
            const existingCatIds = new Set(raw.categories.map(c => c.category_id));
            SEED_DATA.categories.forEach(sc => {
                if (!existingCatIds.has(sc.category_id)) { raw.categories.push(sc); updated = true; }
            });
        }
        // Migrate: remove all fake seed users (keep only real users + admin)
        if (raw.users && raw.users.some(u => SEED_FAKE_USER_IDS.has(u.user_id))) {
            raw.users = raw.users.filter(u => !SEED_FAKE_USER_IDS.has(u.user_id));
            updated = true;
        }
        // Migrate: remove all listings owned by fake seed users
        if (raw.listings && raw.listings.some(l => SEED_FAKE_USER_IDS.has(l.user_id))) {
            raw.listings = raw.listings.filter(l => !SEED_FAKE_USER_IDS.has(l.user_id));
            updated = true;
        }
        // Migrate: remove threads involving fake seed users
        if (raw.threads && raw.threads.some(t => t.participants && t.participants.some(p => SEED_FAKE_USER_IDS.has(p)))) {
            const removedThreadIds = new Set(
                raw.threads.filter(t => t.participants && t.participants.some(p => SEED_FAKE_USER_IDS.has(p))).map(t => t.thread_id)
            );
            raw.threads = raw.threads.filter(t => !removedThreadIds.has(t.thread_id));
            if (raw.messages) raw.messages = raw.messages.filter(m => !removedThreadIds.has(m.thread_id));
            updated = true;
        }
        // Migrate: remove reports involving fake seed users or their listings
        if (raw.reports && raw.reports.some(r => SEED_FAKE_USER_IDS.has(r.reporter_id) || SEED_FAKE_USER_IDS.has(r.target_id))) {
            raw.reports = raw.reports.filter(r => !SEED_FAKE_USER_IDS.has(r.reporter_id) && !SEED_FAKE_USER_IDS.has(r.target_id));
            updated = true;
        }
        // Migrate: remove admin_logs created by fake seed users
        if (raw.admin_logs && raw.admin_logs.some(l => SEED_FAKE_USER_IDS.has(l.admin_id))) {
            raw.admin_logs = raw.admin_logs.filter(l => !SEED_FAKE_USER_IDS.has(l.admin_id));
            updated = true;
        }
        // Migrate: remove hardcoded seed neighborhoods
        const SEED_NH_IDS = new Set(['nh_austin_downtown','nh_austin_domain','nh_austin_east','nh_austin_west_campus','nh_austin_south_lamar']);
        if (raw.neighborhoods && raw.neighborhoods.some(n => SEED_NH_IDS.has(n.neighborhood_id))) {
            raw.neighborhoods = raw.neighborhoods.filter(n => !SEED_NH_IDS.has(n.neighborhood_id));
            updated = true;
        }
        if (updated) saveDB(raw);
        return;
    }

    // First-ever load: seed from localStorage
    console.log('[DB] Seeding localStorage with initial data.');
    localStorage.setItem(DB_KEY, JSON.stringify(SEED_DATA));
}

// Function to reset database (for testing purposes)
export function resetDB() {
    localStorage.removeItem(DB_KEY);
    localStorage.setItem(DB_KEY, JSON.stringify(SEED_DATA));
    console.log('[DB] Database reset with fresh seed data.');
}

export const db = {
    users: new Collection('users', 'user_id', 'usr'),
    listings: new Collection('listings', 'listing_id', 'list'),
    cities: new Collection('cities', 'city_id', 'city'),
    countries: new Collection('countries', 'country_id', 'country'),
    neighborhoods: new Collection('neighborhoods', 'neighborhood_id', 'nh'),
    messages: new Collection('messages', 'message_id', 'msg'),
    threads: new Collection('threads', 'thread_id', 'thread'),
    amenities: new Collection('amenities', 'amenity_id', 'amen'),
    tags: new Collection('tags', 'tag_id', 'tag'),
    reports: new Collection('reports', 'report_id', 'rpt'),
    admin_logs: new Collection('admin_logs', 'log_id', 'log'),
    categories: new Collection('categories', 'category_id', 'cat'),
    posts: new Collection('posts', 'post_id', 'post'),
    fb_countries: new Collection('fb_countries', 'fb_country_id', 'fbc'),
    fb_cities: new Collection('fb_cities', 'fb_city_id', 'fbcity'),
    user_queries: new Collection('user_queries', 'query_id', 'qry'),
    notifications: new Collection('notifications', 'notification_id', 'notif'),
    images: new Collection('images', 'image_id', 'img'),
    getCollection: (name) => getDB()[name] || [],
    
    // Sync logic
    async syncUsers() {
        try {
            console.log('[DB] Syncing users from Hono API...');
            const remoteUsers = await api.getUsers();
            if (Array.isArray(remoteUsers)) {
                const raw = getDB();
                // Merge remote users into local users
                // In a real app, we would handle conflicts and IDs properly
                const localUserIds = new Set(raw.users.map(u => u.user_id));
                remoteUsers.forEach(ru => {
                    // Map D1 'id' to 'user_id' if necessary
                    const userId = ru.user_id || `user_d1_${ru.id}`;
                    if (!localUserIds.has(userId)) {
                        raw.users.push({ ...ru, user_id: userId });
                    }
                });
                saveDB(raw);
                console.log(`[DB] Synced ${remoteUsers.length} users from API.`);
                return true;
            }
        } catch (err) {
            console.error('[DB SYNC ERROR]', err);
            return false;
        }
    }
};

/**
 * Returns the live count of active listings for a given city_id.
 * Always reads from the real listings collection — never the stale static field.
 */
export function getLiveListingCount(cityId) {
    return (getDB()['listings'] || []).filter(
        l => l.city === cityId && l.status === 'active'
    ).length;
}
