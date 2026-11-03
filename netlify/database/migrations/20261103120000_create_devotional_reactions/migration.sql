-- One row per reader per devotional. A reader who changes their answer
-- updates their existing row instead of adding a second vote.
-- visitor_id is a random ID generated in the reader's browser; no IP
-- address, name, or other personal information is stored.
CREATE TABLE IF NOT EXISTS devotional_reactions (
  id          BIGSERIAL PRIMARY KEY,
  series_slug TEXT        NOT NULL,
  day         SMALLINT    NOT NULL CHECK (day > 0),
  reaction    TEXT        NOT NULL CHECK (reaction IN ('spoke', 'helpful', 'okay', 'not_today')),
  visitor_id  UUID        NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (series_slug, day, visitor_id)
);

CREATE INDEX IF NOT EXISTS devotional_reactions_page_idx
  ON devotional_reactions (series_slug, day);
