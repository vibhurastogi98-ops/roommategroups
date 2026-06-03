CREATE VIRTUAL TABLE IF NOT EXISTS listings_fts USING fts5(
  title,
  description,
  brand,
  content='listings',
  content_rowid='rowid'
);

CREATE TRIGGER IF NOT EXISTS listings_fts_ai AFTER INSERT ON listings BEGIN
  INSERT INTO listings_fts(rowid, title, description, brand)
  VALUES (new.rowid, new.title, new.description, new.brand);
END;

CREATE TRIGGER IF NOT EXISTS listings_fts_ad AFTER DELETE ON listings BEGIN
  INSERT INTO listings_fts(listings_fts, rowid, title, description, brand)
  VALUES ('delete', old.rowid, old.title, old.description, old.brand);
END;

CREATE TRIGGER IF NOT EXISTS listings_fts_au AFTER UPDATE ON listings BEGIN
  INSERT INTO listings_fts(listings_fts, rowid, title, description, brand)
  VALUES ('delete', old.rowid, old.title, old.description, old.brand);
  INSERT INTO listings_fts(rowid, title, description, brand)
  VALUES (new.rowid, new.title, new.description, new.brand);
END;

INSERT INTO listings_fts(listings_fts) VALUES ('rebuild');
