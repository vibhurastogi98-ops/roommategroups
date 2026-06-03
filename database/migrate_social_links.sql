-- RoommateGroups D1 — Premium/Pro profile social links
-- Run with:
-- wrangler d1 execute roommatedb --remote --file=database/migrate_social_links.sql

ALTER TABLE users ADD COLUMN social_links TEXT;
