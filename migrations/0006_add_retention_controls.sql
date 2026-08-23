ALTER TABLE contact_messages
ADD COLUMN retention_reference_at TEXT;

ALTER TABLE contact_messages
ADD COLUMN retention_hold INTEGER NOT NULL DEFAULT 0 CHECK (retention_hold IN (0, 1));

ALTER TABLE client_reviews
ADD COLUMN retention_reference_at TEXT;

ALTER TABLE client_reviews
ADD COLUMN retention_hold INTEGER NOT NULL DEFAULT 0 CHECK (retention_hold IN (0, 1));

ALTER TABLE professional_applications
ADD COLUMN retention_reference_at TEXT;

ALTER TABLE professional_applications
ADD COLUMN retention_hold INTEGER NOT NULL DEFAULT 0 CHECK (retention_hold IN (0, 1));

CREATE INDEX IF NOT EXISTS idx_contact_messages_retention
ON contact_messages (retention_hold, retention_reference_at, created_at);

CREATE INDEX IF NOT EXISTS idx_client_reviews_retention
ON client_reviews (retention_hold, retention_reference_at, created_at);

CREATE INDEX IF NOT EXISTS idx_professional_applications_retention
ON professional_applications (retention_hold, retention_reference_at, created_at);
