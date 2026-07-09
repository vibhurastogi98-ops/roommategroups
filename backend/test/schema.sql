-- Test schema: production tables (from database/migrate.sql +
-- migrate_marketplace.sql + migrate_listing_category.sql), trimmed of
-- FOREIGN KEY/CHECK clauses that don't matter for these unit tests.
-- Keep in sync with database/*.sql if a route under test starts touching
-- a column that isn't here yet ("no such column" errors are the tell).

CREATE TABLE users (
  user_id              TEXT PRIMARY KEY,
  email                TEXT UNIQUE NOT NULL,
  display_name         TEXT,
  profile_photo        TEXT,
  bio                  TEXT,
  city                 TEXT,
  country              TEXT,
  age_range            TEXT,
  occupation           TEXT,
  lifestyle_tags       TEXT,
  verification_level   TEXT DEFAULT 'none',
  subscription_tier    TEXT DEFAULT 'free',
  stripe_customer_id   TEXT,
  saved_listings       TEXT,
  saved_searches       TEXT,
  blocked_users        TEXT,
  notification_prefs   TEXT,
  social_links         TEXT,
  password_hash        TEXT,
  role                 TEXT DEFAULT 'user',
  is_active            INTEGER DEFAULT 1,
  profileComplete      INTEGER DEFAULT 0,
  emailVerified        INTEGER DEFAULT 1,
  id_verified          INTEGER DEFAULT 0,
  id_status            TEXT DEFAULT 'none',
  id_reject_reason     TEXT,
  verification_id_photo TEXT,
  verification_selfie  TEXT,
  phone_verified       INTEGER DEFAULT 0,
  budgetMin            INTEGER,
  budgetMax            INTEGER,
  moveInTimeline       TEXT,
  push_tokens          TEXT,
  seller_default_country TEXT,
  seller_default_city  TEXT,
  seller_payment_note  TEXT,
  phone                TEXT,
  show_phone           INTEGER DEFAULT 0,
  is_dealer            INTEGER DEFAULT 0,
  business_name        TEXT,
  seller_rating_avg    REAL DEFAULT 0,
  seller_rating_count  INTEGER DEFAULT 0,
  response_time_mins   INTEGER,
  promote_credits      INTEGER DEFAULT 0,
  created_at           TEXT DEFAULT (datetime('now')),
  updated_at           TEXT DEFAULT (datetime('now')),
  last_active          TEXT
);

CREATE TABLE listings (
  listing_id        TEXT PRIMARY KEY,
  user_id           TEXT NOT NULL,
  title             TEXT,
  description       TEXT,
  city              TEXT,
  neighborhood_id   TEXT,
  address           TEXT,
  latitude          REAL,
  longitude         REAL,
  rent              REAL,
  rent_type         TEXT,
  room_type         TEXT,
  bathrooms         INTEGER,
  available_from    TEXT,
  lease_term        TEXT,
  amenities         TEXT,
  tags              TEXT,
  images            TEXT,
  status            TEXT DEFAULT 'active',
  moderation_status TEXT DEFAULT 'approved',
  rejection_reason  TEXT,
  is_featured       INTEGER DEFAULT 0,
  view_count        INTEGER DEFAULT 0,
  bedrooms          INTEGER,
  size_sqft         INTEGER,
  preferredArea     TEXT,
  moveInTimeline    TEXT,
  budgetMin         INTEGER,
  budgetMax         INTEGER,
  currency          TEXT DEFAULT 'USD',
  deposit           REAL DEFAULT 0,
  min_stay          TEXT,
  utilities_included INTEGER DEFAULT 0,
  furnished         TEXT,
  country           TEXT,
  category          TEXT,
  roommate_prefs    TEXT,
  kind              TEXT DEFAULT 'rental',
  category_id       TEXT,
  price             REAL,
  condition         TEXT,
  negotiable        INTEGER DEFAULT 1,
  brand             TEXT,
  attributes        TEXT,
  sold_at           TEXT,
  promoted_until    TEXT,
  created_at        TEXT DEFAULT (datetime('now')),
  updated_at        TEXT DEFAULT (datetime('now'))
);
CREATE INDEX idx_listings_category ON listings(category_id);
CREATE INDEX idx_listings_kind ON listings(kind);
CREATE INDEX idx_listings_price ON listings(price);

CREATE TABLE mp_categories (
  category_id TEXT PRIMARY KEY, parent_id TEXT, name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, icon TEXT, kind TEXT DEFAULT 'product',
  attributes_schema TEXT, sort_order INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1,
  meta_title TEXT, meta_description TEXT
);
CREATE INDEX idx_mp_categories_parent ON mp_categories(parent_id);

CREATE TABLE mp_reviews (
  review_id TEXT PRIMARY KEY, listing_id TEXT, reviewer_id TEXT NOT NULL,
  reviewee_id TEXT NOT NULL, role TEXT, rating INTEGER NOT NULL, comment TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE mp_offers (
  offer_id TEXT PRIMARY KEY, listing_id TEXT NOT NULL, buyer_id TEXT NOT NULL,
  amount REAL NOT NULL, status TEXT DEFAULT 'pending', thread_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
