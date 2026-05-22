-- ============================================================
-- RoommateGroups D1 — Blog SEO & Content Migration
-- Adds missing SEO, CTA, and meta columns to the posts table.
-- ============================================================

-- SEO Columns
ALTER TABLE posts ADD COLUMN seoTitle TEXT;
ALTER TABLE posts ADD COLUMN seoDescription TEXT;
ALTER TABLE posts ADD COLUMN focusKeyword TEXT;
ALTER TABLE posts ADD COLUMN canonicalUrl TEXT;
ALTER TABLE posts ADD COLUMN metaRobots TEXT DEFAULT 'index,follow';

-- Social Columns
ALTER TABLE posts ADD COLUMN ogTitle TEXT;
ALTER TABLE posts ADD COLUMN ogDescription TEXT;
ALTER TABLE posts ADD COLUMN ogImage TEXT;

-- Image Meta
ALTER TABLE posts ADD COLUMN imgAlt TEXT;
ALTER TABLE posts ADD COLUMN imgTitle TEXT;
ALTER TABLE posts ADD COLUMN imgCaption TEXT;

-- Content Features
ALTER TABLE posts ADD COLUMN tocEnabled INTEGER DEFAULT 0;
ALTER TABLE posts ADD COLUMN faqs TEXT; -- JSON array
ALTER TABLE posts ADD COLUMN tags TEXT; -- JSON array

-- Call to Action (CTA)
ALTER TABLE posts ADD COLUMN ctaHeading TEXT;
ALTER TABLE posts ADD COLUMN ctaText TEXT;
ALTER TABLE posts ADD COLUMN ctaBtnText TEXT;
ALTER TABLE posts ADD COLUMN ctaBtnLink TEXT;
ALTER TABLE posts ADD COLUMN ctaPosition TEXT DEFAULT 'bottom';

-- Advanced / Schema
ALTER TABLE posts ADD COLUMN schemaType TEXT DEFAULT 'BlogPosting';
ALTER TABLE posts ADD COLUMN schemaText TEXT;

-- Redirects
ALTER TABLE posts ADD COLUMN redirectFrom TEXT;
ALTER TABLE posts ADD COLUMN redirectTo TEXT;
