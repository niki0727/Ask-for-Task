CREATE TABLE IF NOT EXISTS contact_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  topic TEXT,
  message TEXT NOT NULL,
  consent INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'askfortask.co.uk',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contact_messages_created_at
ON contact_messages (created_at);

CREATE INDEX IF NOT EXISTS idx_contact_messages_email
ON contact_messages (email);
