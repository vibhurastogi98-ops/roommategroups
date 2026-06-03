-- RoommateGroups D1 — User seller/settings fields
-- Run with:
-- wrangler d1 execute roommatedb --remote --file=database/migrate_user_seller_settings.sql

ALTER TABLE users ADD COLUMN notification_prefs TEXT;
ALTER TABLE users ADD COLUMN seller_default_country TEXT;
ALTER TABLE users ADD COLUMN seller_default_city TEXT;
ALTER TABLE users ADD COLUMN seller_payment_note TEXT;
ALTER TABLE users ADD COLUMN phone TEXT;
ALTER TABLE users ADD COLUMN show_phone INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN business_name TEXT;

