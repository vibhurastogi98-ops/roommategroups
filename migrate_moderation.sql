-- ── 1. Update users table ──
ALTER TABLE users ADD COLUMN id_verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN id_status TEXT DEFAULT 'none';
ALTER TABLE users ADD COLUMN id_reject_reason TEXT;
ALTER TABLE users ADD COLUMN verification_id_photo TEXT;
ALTER TABLE users ADD COLUMN verification_selfie TEXT;
ALTER TABLE users ADD COLUMN phone_verified INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN updated_at TEXT;

-- ── 2. Update listings table ──
ALTER TABLE listings ADD COLUMN moderation_status TEXT DEFAULT 'approved';
ALTER TABLE listings ADD COLUMN rejection_reason TEXT;
ALTER TABLE listings ADD COLUMN bedrooms INTEGER;
ALTER TABLE listings ADD COLUMN size_sqft INTEGER;
ALTER TABLE listings ADD COLUMN preferredArea TEXT;
ALTER TABLE listings ADD COLUMN moveInTimeline TEXT;
ALTER TABLE listings ADD COLUMN budgetMin INTEGER;
ALTER TABLE listings ADD COLUMN budgetMax INTEGER;
