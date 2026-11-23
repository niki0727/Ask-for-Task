-- Excludes controlled internal form tests identified by the exact message prefix.
-- Read-only A4T contact-enquiry counts. No names, addresses or message text leave D1.
-- Change the start date only when the reporting period is explicitly defined.
SELECT substr(created_at, 1, 10) AS utc_day,
       COUNT(*) AS accepted_enquiries,
       SUM(CASE WHEN notification_status = 'sent' THEN 1 ELSE 0 END) AS notifications_sent,
       SUM(CASE WHEN notification_status = 'failed' THEN 1 ELSE 0 END) AS notifications_failed,
       SUM(CASE WHEN notification_status = 'pending' THEN 1 ELSE 0 END) AS notifications_pending
FROM contact_messages
WHERE created_at >= '2026-09-01'
  AND message NOT LIKE '[A4T INTERNAL TEST]%'
GROUP BY substr(created_at, 1, 10)
ORDER BY utc_day;

-- Service-topic totals include historical combined briefs as their own category.
-- A notification status records a sending attempt, not mailbox receipt or a sale.
SELECT COALESCE(NULLIF(trim(topic), ''), 'Not specified') AS enquiry_topic,
       COUNT(*) AS accepted_enquiries,
       SUM(CASE WHEN notification_status = 'sent' THEN 1 ELSE 0 END) AS notifications_sent,
       SUM(CASE WHEN notification_status = 'failed' THEN 1 ELSE 0 END) AS notifications_failed,
       SUM(CASE WHEN notification_status = 'pending' THEN 1 ELSE 0 END) AS notifications_pending
FROM contact_messages
WHERE created_at >= '2026-09-01'
  AND message NOT LIKE '[A4T INTERNAL TEST]%'
GROUP BY COALESCE(NULLIF(trim(topic), ''), 'Not specified')
ORDER BY accepted_enquiries DESC, enquiry_topic;
