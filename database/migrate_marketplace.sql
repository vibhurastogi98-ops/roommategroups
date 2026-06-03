-- ============================================================
-- RoommateGroups D1 — Marketplace Migration
-- Adds marketplace categories, listing fields, reviews, offers,
-- seller metadata, and referrals.
-- Run: wrangler d1 execute roommatedb --remote --file=database/migrate_marketplace.sql
-- Note: FTS5 is intentionally handled separately because D1 exports
-- do not support virtual tables.
-- ============================================================

CREATE TABLE IF NOT EXISTS mp_categories (
  category_id TEXT PRIMARY KEY, parent_id TEXT, name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL, icon TEXT, kind TEXT DEFAULT 'product',
  attributes_schema TEXT, sort_order INTEGER DEFAULT 0, is_active INTEGER DEFAULT 1,
  meta_title TEXT, meta_description TEXT,
  FOREIGN KEY (parent_id) REFERENCES mp_categories(category_id));
CREATE INDEX IF NOT EXISTS idx_mp_categories_parent ON mp_categories(parent_id);

ALTER TABLE listings ADD COLUMN kind TEXT DEFAULT 'rental';
ALTER TABLE listings ADD COLUMN category_id TEXT;
ALTER TABLE listings ADD COLUMN price REAL;
ALTER TABLE listings ADD COLUMN condition TEXT;
ALTER TABLE listings ADD COLUMN negotiable INTEGER DEFAULT 1;
ALTER TABLE listings ADD COLUMN brand TEXT;
ALTER TABLE listings ADD COLUMN attributes TEXT;
ALTER TABLE listings ADD COLUMN sold_at TEXT;
ALTER TABLE listings ADD COLUMN promoted_until TEXT;
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category_id);
CREATE INDEX IF NOT EXISTS idx_listings_kind ON listings(kind);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);

CREATE TABLE IF NOT EXISTS mp_reviews (
  review_id TEXT PRIMARY KEY, listing_id TEXT, reviewer_id TEXT NOT NULL,
  reviewee_id TEXT NOT NULL, role TEXT, rating INTEGER NOT NULL, comment TEXT,
  created_at TEXT DEFAULT (datetime('now')));
CREATE INDEX IF NOT EXISTS idx_mp_reviews_reviewee ON mp_reviews(reviewee_id);

CREATE TABLE IF NOT EXISTS mp_offers (
  offer_id TEXT PRIMARY KEY, listing_id TEXT NOT NULL, buyer_id TEXT NOT NULL,
  amount REAL NOT NULL, status TEXT DEFAULT 'pending', thread_id TEXT,
  created_at TEXT DEFAULT (datetime('now')));

ALTER TABLE users ADD COLUMN seller_rating_avg REAL DEFAULT 0;
ALTER TABLE users ADD COLUMN seller_rating_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN response_time_mins INTEGER;
ALTER TABLE users ADD COLUMN is_dealer INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN promote_credits INTEGER DEFAULT 0;

CREATE TABLE IF NOT EXISTS mp_referrals (
  referral_id TEXT PRIMARY KEY, referrer_id TEXT NOT NULL, referee_id TEXT,
  reward_status TEXT DEFAULT 'pending', created_at TEXT DEFAULT (datetime('now')));
