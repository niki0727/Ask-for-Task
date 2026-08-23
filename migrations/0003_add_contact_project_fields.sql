ALTER TABLE contact_messages ADD COLUMN region TEXT;
ALTER TABLE contact_messages ADD COLUMN budget TEXT;
ALTER TABLE contact_messages ADD COLUMN target_date TEXT;

CREATE INDEX IF NOT EXISTS idx_contact_messages_target_date
ON contact_messages (target_date);
