-- ============================================================
-- RoommateGroups D1 - Rental Listing Category Migration
-- Adds the rental category selected in the post flow.
-- Run: npx wrangler d1 execute roommatedb --remote --file=database/migrate_listing_category.sql
-- ============================================================

ALTER TABLE listings ADD COLUMN category TEXT;
