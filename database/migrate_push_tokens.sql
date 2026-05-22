-- ============================================================
-- RoommateGroups D1 — Push Tokens Migration
-- Adds push_tokens column to users table (missing from prior migrations).
-- Run: npx wrangler d1 execute roommatedb --remote --file=migrate_push_tokens.sql
-- ============================================================

ALTER TABLE users ADD COLUMN push_tokens TEXT;
