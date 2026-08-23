CREATE TABLE IF NOT EXISTS client_reviews (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company_project TEXT,
  service TEXT NOT NULL,
  relationship TEXT NOT NULL,
  review_text TEXT NOT NULL,
  contact_consent INTEGER NOT NULL,
  publish_consent INTEGER NOT NULL DEFAULT 0,
  moderation_status TEXT NOT NULL DEFAULT 'pending',
  email_status TEXT NOT NULL DEFAULT 'sending',
  resend_email_id TEXT,
  source TEXT NOT NULL DEFAULT 'askfortask.co.uk/reviews',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_client_reviews_created_at
ON client_reviews (created_at);

CREATE INDEX IF NOT EXISTS idx_client_reviews_email
ON client_reviews (email);

CREATE INDEX IF NOT EXISTS idx_client_reviews_moderation_status
ON client_reviews (moderation_status);
