export const schemaUpgrades = {
 members: {details: "TEXT NOT NULL DEFAULT '{}'"},
 creator_enquiries: {
  review_status: "TEXT NOT NULL DEFAULT 'new'",
  operator_note: "TEXT NOT NULL DEFAULT ''",
  notification_sent: 'BIGINT',
  notification_attempts: 'INTEGER NOT NULL DEFAULT 0',
  notification_next: 'BIGINT NOT NULL DEFAULT 0',
  notification_claim: 'BIGINT NOT NULL DEFAULT 0',
  notification_token: "TEXT NOT NULL DEFAULT ''",
  notification_error: "TEXT NOT NULL DEFAULT ''",
  notification_provider: "TEXT NOT NULL DEFAULT ''"
 }
};
export function upgradeSQL() {
 return Object.entries(schemaUpgrades).flatMap(([table, columns]) =>
  Object.entries(columns).map(([name, definition]) =>
   'ALTER TABLE ' + table + ' ADD COLUMN IF NOT EXISTS ' + name + ' ' + definition + ';'
  )).join('\n');
}
