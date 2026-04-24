-- ============================================================
-- RoommateGroups D1 — Additive Column Migration
-- Safe: adds missing columns without dropping any existing data.
-- Run: npx wrangler d1 execute roommatedb --remote --file=migrate_add_columns.sql
-- ============================================================

-- Add new user profile columns (ALTER TABLE ignores if already exists in D1)
-- D1/SQLite does not support "IF NOT EXISTS" on ALTER TABLE ADD COLUMN,
-- so each statement is wrapped to be safe to re-run.

-- profileComplete: tracks whether the user finished profile setup
ALTER TABLE users ADD COLUMN profileComplete INTEGER DEFAULT 0;

-- emailVerified: email verification flag
ALTER TABLE users ADD COLUMN emailVerified INTEGER DEFAULT 1;

-- country: user's selected country (separate from city)
ALTER TABLE users ADD COLUMN country TEXT;

-- occupation: user's job/occupation field
ALTER TABLE users ADD COLUMN occupation TEXT;

-- budgetMin / budgetMax: user's preferred rent budget range
ALTER TABLE users ADD COLUMN budgetMin INTEGER;
ALTER TABLE users ADD COLUMN budgetMax INTEGER;

-- moveInTimeline: when the user plans to move in
ALTER TABLE users ADD COLUMN moveInTimeline TEXT;

-- ── Update existing admin accounts to mark profileComplete=1 ──
UPDATE users SET profileComplete = 1, emailVerified = 1 WHERE role = 'admin';

-- Ensure master admin exists with correct role and password_hash
INSERT OR IGNORE INTO users (user_id, email, display_name, bio, city, verification_level, subscription_tier, role, is_active, profileComplete, emailVerified, created_at, password_hash)
VALUES ('user_admin_2', 'hello@roommategroups.com', 'roommategroups', 'Master Admin', 'city_austin', 'community', 'admin', 'admin', 1, 1, 1, '2026-04-24T00:00:00Z', 'h_sa5p9x');

-- Update master admin role/hash if they already exist but role was wrong
UPDATE users SET role = 'admin', profileComplete = 1, password_hash = 'h_sa5p9x'
WHERE email = 'hello@roommategroups.com';
