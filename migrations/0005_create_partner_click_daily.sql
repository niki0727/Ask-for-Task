CREATE TABLE IF NOT EXISTS partner_click_daily (
  partner_slug TEXT NOT NULL,
  source_page TEXT NOT NULL,
  click_date TEXT NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0 CHECK (request_count >= 0),
  PRIMARY KEY (partner_slug, source_page, click_date)
);

CREATE INDEX IF NOT EXISTS idx_partner_click_daily_date
ON partner_click_daily (click_date);
