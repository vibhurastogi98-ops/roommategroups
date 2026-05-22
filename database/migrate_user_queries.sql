-- Migration to update user_queries table with support ticket columns
-- Drop and recreate if we want to be clean, but usually we just add columns.
-- Since this table was previously used for search analytics (based on schema.sql), 
-- we'll recreate it for the new contact form purpose.

DROP TABLE IF EXISTS user_queries;

CREATE TABLE user_queries (
  query_id         TEXT PRIMARY KEY,
  user_id          TEXT,
  first_name       TEXT,
  last_name        TEXT,
  email            TEXT,
  topic            TEXT,
  topic_label      TEXT,
  message          TEXT,
  status           TEXT DEFAULT 'new',
  is_read          INTEGER DEFAULT 0,
  reply            TEXT,
  replied_at       TEXT,
  created_at       TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (user_id) REFERENCES users(user_id)
);
