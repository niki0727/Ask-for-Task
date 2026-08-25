CREATE TABLE IF NOT EXISTS form_rate_limits (
  key_hash TEXT NOT NULL,
  route TEXT NOT NULL CHECK (route IN ('contact', 'reviews', 'professionals')),
  window_started_at INTEGER NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 1 CHECK (request_count > 0),
  expires_at INTEGER NOT NULL,
  PRIMARY KEY (key_hash, route, window_started_at)
);

CREATE INDEX IF NOT EXISTS idx_form_rate_limits_expires_at
ON form_rate_limits (expires_at);
