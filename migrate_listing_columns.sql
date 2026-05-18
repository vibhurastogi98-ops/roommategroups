-- ============================================================
-- RoommateGroups D1 — Listing Extended Columns Migration
-- Adds fields sent by mobile/web that were missing from D1.
-- Run: npx wrangler d1 execute roommatedb --remote --file=migrate_listing_columns.sql
-- ============================================================

ALTER TABLE listings ADD COLUMN currency TEXT DEFAULT 'USD';
ALTER TABLE listings ADD COLUMN deposit REAL DEFAULT 0;
ALTER TABLE listings ADD COLUMN min_stay TEXT;
ALTER TABLE listings ADD COLUMN utilities_included INTEGER DEFAULT 0;
ALTER TABLE listings ADD COLUMN furnished TEXT;
ALTER TABLE listings ADD COLUMN country TEXT;
ALTER TABLE listings ADD COLUMN roommate_prefs TEXT;  -- JSON: {gender, ageMin, ageMax, tags}
