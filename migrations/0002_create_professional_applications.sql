CREATE TABLE IF NOT EXISTS professional_applications (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  location TEXT NOT NULL,
  categories TEXT NOT NULL,
  specialisms TEXT NOT NULL,
  responsibility TEXT NOT NULL,
  profile_url TEXT,
  availability TEXT NOT NULL,
  project_interest TEXT NOT NULL,
  cv_filename TEXT NOT NULL,
  cv_size INTEGER NOT NULL,
  resend_email_id TEXT,
  status TEXT NOT NULL DEFAULT 'sending',
  consent INTEGER NOT NULL,
  source TEXT NOT NULL DEFAULT 'askfortask.co.uk/professionals',
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_professional_applications_created_at
ON professional_applications (created_at);

CREATE INDEX IF NOT EXISTS idx_professional_applications_email
ON professional_applications (email);

CREATE INDEX IF NOT EXISTS idx_professional_applications_status
ON professional_applications (status);
