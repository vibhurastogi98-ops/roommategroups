-- ============================================================
-- RoommateGroups D1 - City Marketplace Page Columns
-- Adds admin-managed marketplace landing page fields to cities.
-- Run: wrangler d1 execute roommatedb --remote --file=database/migrate_city_marketplace.sql
-- ============================================================

ALTER TABLE cities ADD COLUMN marketplace_enabled INTEGER DEFAULT 0;
ALTER TABLE cities ADD COLUMN marketplace_hero_image TEXT;
ALTER TABLE cities ADD COLUMN marketplace_description TEXT;
ALTER TABLE cities ADD COLUMN marketplace_meta_title TEXT;
ALTER TABLE cities ADD COLUMN marketplace_meta_description TEXT;
ALTER TABLE cities ADD COLUMN marketplace_faq_items TEXT;
ALTER TABLE cities ADD COLUMN marketplace_reviews TEXT;
