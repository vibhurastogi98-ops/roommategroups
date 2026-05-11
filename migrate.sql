-- ============================================================
-- RoommateGroups D1 — Full Reset Migration
-- Drop all app tables (safe) then recreate with correct schema
-- ============================================================

PRAGMA foreign_keys = OFF;

-- Drop all existing app tables (order matters for FK safety)
DROP TABLE IF EXISTS images;
DROP TABLE IF EXISTS notifications;
DROP TABLE IF EXISTS user_queries;
DROP TABLE IF EXISTS fb_cities;
DROP TABLE IF EXISTS fb_countries;
DROP TABLE IF EXISTS posts;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS admin_logs;
DROP TABLE IF EXISTS reports;
DROP TABLE IF EXISTS tags;
DROP TABLE IF EXISTS amenities;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS threads;
DROP TABLE IF EXISTS neighborhoods;
DROP TABLE IF EXISTS listings;
DROP TABLE IF EXISTS cities;
DROP TABLE IF EXISTS countries;
DROP TABLE IF EXISTS users;

PRAGMA foreign_keys = ON;

-- ── 1. users ────────────────────────────────────────────────
CREATE TABLE users (
  user_id            TEXT PRIMARY KEY,
  email              TEXT UNIQUE NOT NULL,
  display_name       TEXT,
  profile_photo      TEXT,
  bio                TEXT,
  city               TEXT,
  country            TEXT,
  age_range          TEXT,
  occupation         TEXT,
  lifestyle_tags     TEXT,
  verification_level TEXT DEFAULT 'none',
  subscription_tier  TEXT DEFAULT 'free',
  stripe_customer_id TEXT,
  saved_listings     TEXT,
  saved_searches     TEXT,
  blocked_users      TEXT,
  password_hash      TEXT,
  role               TEXT DEFAULT 'user',
  is_active          INTEGER DEFAULT 1,
  profileComplete    INTEGER DEFAULT 0,
  emailVerified      INTEGER DEFAULT 1,
  budgetMin          INTEGER,
  budgetMax          INTEGER,
  moveInTimeline     TEXT,
  created_at         TEXT DEFAULT (datetime('now')),
  last_active        TEXT
);

-- ── 2. countries ────────────────────────────────────────────
CREATE TABLE countries (
  country_id  TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  code        TEXT UNIQUE,
  flag_emoji  TEXT,
  is_active   INTEGER DEFAULT 1
);

-- ── 3. cities ───────────────────────────────────────────────
CREATE TABLE cities (
  city_id          TEXT PRIMARY KEY,
  name             TEXT NOT NULL,
  slug             TEXT UNIQUE NOT NULL,
  country          TEXT,
  state_province   TEXT,
  latitude         REAL,
  longitude        REAL,
  hero_image       TEXT,
  description      TEXT,
  avg_rent         REAL,
  listing_count    INTEGER DEFAULT 0,
  member_count     INTEGER DEFAULT 0,
  is_active        INTEGER DEFAULT 1,
  show_in_popular  INTEGER DEFAULT 0,
  show_in_popular_section INTEGER DEFAULT 0,
  show_in_footer   INTEGER DEFAULT 0,
  meta_title       TEXT,
  meta_description TEXT,
  faq_items        TEXT,
  reviews          TEXT,
  FOREIGN KEY (country) REFERENCES countries(country_id)
);

-- ── 4. neighborhoods ────────────────────────────────────────
CREATE TABLE neighborhoods (
  neighborhood_id TEXT PRIMARY KEY,
  city_id         TEXT NOT NULL,
  name            TEXT NOT NULL,
  slug            TEXT,
  description     TEXT,
  avg_rent        REAL,
  is_active       INTEGER DEFAULT 1,
  created_at      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (city_id) REFERENCES cities(city_id)
);

-- ── 5. listings ─────────────────────────────────────────────
CREATE TABLE listings (
  listing_id      TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  title           TEXT,
  description     TEXT,
  city            TEXT,
  neighborhood_id TEXT,
  address         TEXT,
  latitude        REAL,
  longitude       REAL,
  rent            REAL,
  rent_type       TEXT,
  room_type       TEXT,
  bathrooms       INTEGER,
  available_from  TEXT,
  lease_term      TEXT,
  amenities       TEXT,
  tags            TEXT,
  images          TEXT,
  status          TEXT DEFAULT 'active',
  is_featured     INTEGER DEFAULT 0,
  view_count      INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now')),
  updated_at      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ── 6. threads ──────────────────────────────────────────────
CREATE TABLE threads (
  thread_id       TEXT PRIMARY KEY,
  participants    TEXT NOT NULL,
  listing_id      TEXT,
  last_message_at      TEXT,
  last_message_preview TEXT,
  is_archived          INTEGER DEFAULT 0,
  created_at           TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (listing_id) REFERENCES listings(listing_id)
);

-- ── 7. messages ─────────────────────────────────────────────
CREATE TABLE messages (
  message_id TEXT PRIMARY KEY,
  thread_id  TEXT NOT NULL,
  sender_id  TEXT NOT NULL,
  content    TEXT NOT NULL,
  is_read    INTEGER DEFAULT 0,
  read_at    TEXT,
  photo_url  TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (thread_id) REFERENCES threads(thread_id),
  FOREIGN KEY (sender_id) REFERENCES users(user_id)
);

-- ── 8. amenities ────────────────────────────────────────────
CREATE TABLE amenities (
  amenity_id TEXT PRIMARY KEY,
  name       TEXT NOT NULL,
  icon       TEXT
);

-- ── 9. tags ─────────────────────────────────────────────────
CREATE TABLE tags (
  tag_id TEXT PRIMARY KEY,
  name   TEXT NOT NULL,
  icon   TEXT
);

-- ── 10. reports ─────────────────────────────────────────────
CREATE TABLE reports (
  report_id   TEXT PRIMARY KEY,
  reporter_id TEXT NOT NULL,
  target_id   TEXT NOT NULL,
  target_type TEXT,
  reason      TEXT,
  details     TEXT,
  status      TEXT DEFAULT 'pending',
  resolved_by TEXT,
  resolved_at TEXT,
  created_at  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (reporter_id) REFERENCES users(user_id)
);

-- ── 11. admin_logs ──────────────────────────────────────────
CREATE TABLE admin_logs (
  log_id      TEXT PRIMARY KEY,
  admin_id    TEXT NOT NULL,
  action      TEXT NOT NULL,
  target_type TEXT,
  target_id   TEXT,
  details     TEXT,
  created_at  TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (admin_id) REFERENCES users(user_id)
);

-- ── 12. categories (blog) ───────────────────────────────────
CREATE TABLE categories (
  category_id TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  slug        TEXT UNIQUE NOT NULL,
  description TEXT,
  color       TEXT
);

-- ── 13. posts (blog) ────────────────────────────────────────
CREATE TABLE posts (
  post_id        TEXT PRIMARY KEY,
  slug           TEXT UNIQUE NOT NULL,
  title          TEXT NOT NULL,
  excerpt        TEXT,
  category       TEXT,
  author_name    TEXT,
  author_avatar  TEXT,
  author_bio     TEXT,
  date_label     TEXT,
  read_time      TEXT,
  image          TEXT,
  content        TEXT,
  published_date TEXT,
  is_published   INTEGER DEFAULT 0,
  created_at     TEXT DEFAULT (datetime('now')),
  updated_at     TEXT DEFAULT (datetime('now'))
);

-- ── 14. fb_countries ────────────────────────────────────────
CREATE TABLE fb_countries (
  fb_country_id TEXT PRIMARY KEY,
  country_name  TEXT NOT NULL,
  created_at    TEXT DEFAULT (datetime('now'))
);

-- ── 15. fb_cities ───────────────────────────────────────────
CREATE TABLE fb_cities (
  fb_city_id    TEXT PRIMARY KEY,
  country_id    TEXT NOT NULL,
  city_name     TEXT NOT NULL,
  city_image    TEXT,
  fb_group_name TEXT,
  fb_group_link TEXT,
  total_members INTEGER DEFAULT 0,
  is_popular    INTEGER DEFAULT 0,
  priority      INTEGER DEFAULT 0,
  is_footer     INTEGER DEFAULT 0,
  description   TEXT,
  faqs          TEXT,
  created_at    TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (country_id) REFERENCES fb_countries(fb_country_id)
);

-- ── 16. user_queries ────────────────────────────────────────
CREATE TABLE user_queries (
  query_id     TEXT PRIMARY KEY,
  user_id      TEXT,
  query_text   TEXT,
  filters      TEXT,
  result_count INTEGER,
  created_at   TEXT DEFAULT (datetime('now'))
);

-- ── 17. notifications ───────────────────────────────────────
CREATE TABLE notifications (
  notification_id TEXT PRIMARY KEY,
  user_id         TEXT NOT NULL,
  type            TEXT,
  title           TEXT,
  body            TEXT,
  link            TEXT,
  is_read         INTEGER DEFAULT 0,
  created_at      TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ── 18. images ──────────────────────────────────────────────
CREATE TABLE images (
  image_id   TEXT PRIMARY KEY,
  user_id    TEXT,
  listing_id TEXT,
  url        TEXT NOT NULL,
  r2_key     TEXT,
  mime_type  TEXT,
  size_bytes INTEGER,
  created_at TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);

-- ============================================================
-- Indexes (performance — frequently queried columns)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_listings_user_id        ON listings (user_id);
CREATE INDEX IF NOT EXISTS idx_listings_city            ON listings (city);
CREATE INDEX IF NOT EXISTS idx_listings_status          ON listings (status);
CREATE INDEX IF NOT EXISTS idx_listings_created_at      ON listings (created_at);
CREATE INDEX IF NOT EXISTS idx_messages_thread_id       ON messages (thread_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id       ON messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_is_read         ON messages (is_read);
CREATE INDEX IF NOT EXISTS idx_threads_listing_id       ON threads (listing_id);
CREATE INDEX IF NOT EXISTS idx_threads_last_message_at  ON threads (last_message_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id    ON notifications (user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read    ON notifications (is_read);
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id      ON reports (reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_status           ON reports (status);
CREATE INDEX IF NOT EXISTS idx_user_queries_status      ON user_queries (status);
CREATE INDEX IF NOT EXISTS idx_posts_is_published       ON posts (is_published);
CREATE INDEX IF NOT EXISTS idx_posts_published_date     ON posts (published_date);

-- ============================================================
-- Seed Data
-- ============================================================

INSERT INTO countries (country_id, name, slug, code, flag_emoji, is_active) VALUES
  ('country_us', 'United States', 'us', 'US', '🇺🇸', 1),
  ('country_fr', 'France', 'france', 'FR', '🇫🇷', 1),
  ('country_de', 'Germany', 'germany', 'DE', '🇩🇪', 1),
  ('country_nl', 'Netherlands', 'netherlands', 'NL', '🇳🇱', 1);

INSERT INTO amenities (amenity_id, name, icon) VALUES
  ('amen_wifi', 'High-Speed WiFi', 'fa-wifi'),
  ('amen_laundry', 'In-unit Laundry', 'fa-washing-machine'),
  ('amen_ac', 'Air Conditioning', 'fa-snowflake'),
  ('amen_parking', 'Parking', 'fa-car'),
  ('amen_gym', 'Gym', 'fa-dumbbell');

INSERT INTO tags (tag_id, name, icon) VALUES
  ('tag_clean', 'Clean', 'fa-broom'),
  ('tag_social', 'Social', 'fa-users'),
  ('tag_quiet', 'Quiet', 'fa-volume-xmark'),
  ('tag_pet', 'Pet-Friendly', 'fa-paw');

INSERT INTO categories (category_id, name, slug, description, color) VALUES
  ('cat_1', 'City Guides',     'city-guides',     'Guides to living in various cities.',         '#1a1a1a'),
  ('cat_2', 'Roommate Tips',   'roommate-tips',   'Tips for finding and living with roommates.', '#333333'),
  ('cat_3', 'Market Reports',  'market-reports',  'Data and insights on the rental market.',     '#333333'),
  ('cat_4', 'Moving Guides',   'moving-guides',   'Step-by-step guides for a smooth move.',      '#555555'),
  ('cat_5', 'Student Housing', 'student-housing', 'Housing tips and resources for students.',    '#555555');

INSERT INTO cities (city_id, name, slug, country, state_province, latitude, longitude, hero_image, avg_rent, listing_count, member_count, is_active, show_in_popular, show_in_footer) VALUES
  ('city_austin',      'Austin',        'austin',        'country_us', 'TX',  30.2672,  -97.7431,  'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800&q=80',                        1450, 342,  1200, 1, 1, 1),
  ('city_portland',    'Portland',      'portland',      'country_us', 'OR',  45.5152,  -122.6784, 'https://images.unsplash.com/photo-1542601906990-b4d3fb778b09?w=800&q=80',                        1300, 218,  850,  1, 1, 1),
  ('city_san_antonio', 'San Antonio',   'san-antonio',   'country_us', 'TX',  29.4241,  -98.4936,  'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=1600&h=600&fit=crop',             1100, 185,  600,  1, 0, 0),
  ('city_houston',     'Houston',       'houston',       'country_us', 'TX',  29.7604,  -95.3698,  'https://images.unsplash.com/photo-1530089711124-9ca31fb9e863?w=1600&h=600&fit=crop',             1350, 412,  1500, 0, 0, 0),
  ('city_dallas',      'Dallas',        'dallas',        'country_us', 'TX',  32.7767,  -96.7970,  'https://images.unsplash.com/photo-1568240219730-85f8398687b1?w=1600&h=600&fit=crop',             1400, 367,  1100, 1, 0, 0),
  ('city_seattle',     'Seattle',       'seattle',       'country_us', 'WA',  47.6062,  -122.3321, 'https://images.unsplash.com/photo-1502175353174-a7a70e73b362?auto=format&fit=crop&w=800&q=85',   1800, 456,  1300, 1, 1, 1),
  ('city_sf',          'San Francisco', 'san-francisco', 'country_us', 'CA',  37.7749,  -122.4194, 'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?auto=format&fit=crop&w=800&q=85',   2500, 892,  2200, 1, 1, 1),
  ('city_la',          'Los Angeles',   'los-angeles',   'country_us', 'CA',  34.0522,  -118.2437, 'https://images.unsplash.com/photo-1444723121867-7a241cacace9?auto=format&fit=crop&w=800&q=85',   2100, 1204, 3100, 1, 1, 1),
  ('city_nola',        'New Orleans',   'new-orleans',   'country_us', 'LA',  29.9511,  -90.0715,  'https://images.unsplash.com/photo-1549925245-da6cb6824962?auto=format&fit=crop&w=800&q=85',      1200, 156,  450,  1, 1, 1),
  ('city_paris',       'Paris',         'paris',         'country_fr', 'IDF', 48.8566,  2.3522,    'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=800&q=85',   1400, 678,  1800, 1, 1, 1),
  ('city_berlin',      'Berlin',        'berlin',        'country_de', 'BE',  52.5200,  13.4050,   'https://images.unsplash.com/photo-1560969184-10fe8719e047?auto=format&fit=crop&w=800&q=85',      1100, 534,  1500, 1, 1, 1),
  ('city_amsterdam',   'Amsterdam',     'amsterdam',     'country_nl', 'NH',  52.3676,  4.9041,    'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?auto=format&fit=crop&w=800&q=85',   1600, 412,  1100, 1, 1, 1),
  ('city_charleston',  'Charleston',    'charleston',    'country_us', 'SC',  32.7765,  -79.9311,  'https://images.unsplash.com/photo-1551061713-2868fb7303d4?auto=format&fit=crop&w=800&q=85',      1500, 98,   300,  1, 1, 1),
  ('city_detroit',     'Detroit',       'detroit',       'country_us', 'MI',  42.3314,  -83.0458,  'https://images.unsplash.com/photo-1502174832274-bc1ec64c3963?auto=format&fit=crop&w=800&q=85',   1000, 187,  550,  1, 1, 1),
  ('city_st_louis',    'St. Louis',     'st-louis',      'country_us', 'MO',  38.6270,  -90.1994,  'https://images.unsplash.com/photo-1471644865743-1623432420fd?auto=format&fit=crop&w=800&q=85',   1050, 143,  400,  1, 1, 0);

INSERT INTO users (user_id, email, display_name, bio, city, verification_level, subscription_tier, role, is_active, profileComplete, emailVerified, created_at, password_hash) VALUES
  ('user_admin_1', 'admin@roommategroups.com',  'RG Admin',        'System Administrator', 'city_austin', 'id',        'admin', 'admin', 1, 1, 1, '2025-01-01T00:00:00Z', 'h_n7qt9z'),
  ('user_admin_2', 'hello@roommategroups.com', 'roommategroups', 'Master Admin',          'city_austin', 'community', 'admin', 'admin', 1, 1, 1, '2026-04-24T00:00:00Z', 'h_sa5p9x');

INSERT INTO fb_countries (fb_country_id, country_name, created_at) VALUES
  ('fbc_1', 'United States',  '2026-01-01T00:00:00Z'),
  ('fbc_2', 'United Kingdom', '2026-01-01T00:00:00Z'),
  ('fbc_3', 'Germany',        '2026-01-01T00:00:00Z'),
  ('fbc_4', 'France',         '2026-01-01T00:00:00Z'),
  ('fbc_5', 'Australia',      '2026-01-01T00:00:00Z'),
  ('fbc_6', 'Canada',         '2026-01-01T00:00:00Z');

INSERT INTO fb_cities (fb_city_id, country_id, city_name, city_image, fb_group_name, fb_group_link, total_members, is_popular, priority, created_at) VALUES
  ('fbcity_1',  'fbc_1', 'Austin',        'https://images.unsplash.com/photo-1531218150217-54595bc2b934?w=800&h=400&fit=crop', 'Austin Roommates & Rooms for Rent',    'https://www.facebook.com/groups/austinroommates',     24800,  1, 1,  '2026-01-01T00:00:00Z'),
  ('fbcity_2',  'fbc_1', 'New York City', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?w=800&h=400&fit=crop', 'NYC Rooms & Roommates',                 'https://www.facebook.com/groups/nycroommates',        142000, 1, 2,  '2026-01-01T00:00:00Z'),
  ('fbcity_3',  'fbc_1', 'Los Angeles',   'https://images.unsplash.com/photo-1580655653885-65763b2597d0?w=800&h=400&fit=crop', 'Los Angeles Roommates',                 'https://www.facebook.com/groups/laroommates',         89500,  1, 3,  '2026-01-01T00:00:00Z'),
  ('fbcity_4',  'fbc_1', 'Seattle',       'https://images.unsplash.com/photo-1542944037-460b12bc1126?w=800&h=400&fit=crop',    'Seattle Roommates & Housing',           'https://www.facebook.com/groups/seattleroommates',    31200,  1, 4,  '2026-01-01T00:00:00Z'),
  ('fbcity_5',  'fbc_1', 'Chicago',       'https://images.unsplash.com/photo-1494522303221-719e8b46ed65?w=800&h=400&fit=crop', 'Chicago Roommates & Apartments',        'https://www.facebook.com/groups/chicagoroommates',    67300,  1, 5,  '2026-01-01T00:00:00Z'),
  ('fbcity_6',  'fbc_2', 'London',        'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?w=800&h=400&fit=crop', 'London Flatmates & Room to Rent',       'https://www.facebook.com/groups/londonflatmates',     215000, 1, 6,  '2026-01-01T00:00:00Z'),
  ('fbcity_7',  'fbc_2', 'Manchester',    'https://images.unsplash.com/photo-1543872084-c7bd3822856f?w=800&h=400&fit=crop',    'Manchester Rooms & Flatmates',          'https://www.facebook.com/groups/manchesterrooms',     38400,  1, 7,  '2026-01-01T00:00:00Z'),
  ('fbcity_8',  'fbc_3', 'Berlin',        'https://images.unsplash.com/photo-1528728329032-2972f65dfb3f?w=800&h=400&fit=crop', 'Berlin Rooms & WG Zimmer',              'https://www.facebook.com/groups/berlinrooms',         92100,  1, 8,  '2026-01-01T00:00:00Z'),
  ('fbcity_9',  'fbc_3', 'Munich',        'https://images.unsplash.com/photo-1595867818082-083862f3d630?w=800&h=400&fit=crop', 'Munich Apartments & WG',                'https://www.facebook.com/groups/munichrooms',         44600,  1, 9,  '2026-01-01T00:00:00Z'),
  ('fbcity_10', 'fbc_4', 'Paris',         'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=800&h=400&fit=crop', 'Paris Colocation & Rooms',              'https://www.facebook.com/groups/pariscolocation',     78900,  1, 10, '2026-01-01T00:00:00Z'),
  ('fbcity_11', 'fbc_5', 'Sydney',        'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?w=800&h=400&fit=crop', 'Sydney Flatmates & Share Houses',       'https://www.facebook.com/groups/sydneyflatmates',     56200,  1, 11, '2026-01-01T00:00:00Z'),
  ('fbcity_12', 'fbc_5', 'Melbourne',     'https://images.unsplash.com/photo-1545044846-351ba102b6d5?w=800&h=400&fit=crop',    'Melbourne Rooms & Flatmates',           'https://www.facebook.com/groups/melbournerooms',      48300,  1, 12, '2026-01-01T00:00:00Z'),
  ('fbcity_13', 'fbc_6', 'Toronto',       'https://images.unsplash.com/photo-1517090504586-fde19ea6066f?w=800&h=400&fit=crop', 'Toronto Roommates & Rooms',             'https://www.facebook.com/groups/torontoroommates',    63800,  1, 13, '2026-01-01T00:00:00Z'),
  ('fbcity_14', 'fbc_6', 'Vancouver',     'https://images.unsplash.com/photo-1560814304-4f05b62af116?w=800&h=400&fit=crop',    'Vancouver Roommates & Rentals',         'https://www.facebook.com/groups/vancouverroommates',  41700,  1, 14, '2026-01-01T00:00:00Z');
