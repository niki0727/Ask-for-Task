ALTER TABLE contact_messages ADD COLUMN request_id TEXT;
ALTER TABLE contact_messages ADD COLUMN notification_status TEXT NOT NULL DEFAULT 'legacy'
  CHECK (notification_status IN ('legacy', 'pending', 'sent', 'failed'));
ALTER TABLE contact_messages ADD COLUMN notification_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_messages_request_id
ON contact_messages (request_id)
WHERE request_id IS NOT NULL;
