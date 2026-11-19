import {randomUUID} from 'node:crypto';

export function resendAlerts({key, from, to, origin, fetcher=fetch}) {
 if (!key || !from || !to || !origin) throw Error('Configure the enquiry email key, sender, recipient and Studio origin.');
 return async enquiry => {
  const response = await fetcher('https://api.resend.com/emails', {
   method: 'POST',
   headers: {
    Authorization: 'Bearer ' + key,
    'Content-Type': 'application/json',
    'Idempotency-Key': 'studio-enquiry-' + enquiry.id
   },
   body: JSON.stringify({
    from, to: [to],
    subject: 'New Studio enquiry · ' + enquiry.creator_name,
    text: 'A new enquiry is waiting for ' + enquiry.creator_name + '.\n\nReference ' + enquiry.id +
     '\n\nReview and reply from your Studio inbox\n' + origin + '/#inbox'
   }),
   signal: AbortSignal.timeout(15000)
  });
  if (!response.ok) throw Error('The email provider did not accept this alert.');
  const data = await response.json();
  if (!data.id) throw Error('The email provider did not return an alert reference.');
  return data.id;
 };
}

export function enquiryQueue({one, run, sendAlert}) {
 let running = false;
 async function drain() {
  if (running || !sendAlert) return;
  running = true;
  try {
   for (let i=0; i<5; i++) {
    const now = Date.now(), claim = randomUUID();
    const item = await one(`UPDATE creator_enquiries
     SET notification_claim=?, notification_token=?, notification_attempts=notification_attempts+1
     WHERE id=(SELECT id FROM creator_enquiries WHERE notification_sent IS NULL
      AND notification_attempts<6 AND notification_next<=? AND notification_claim<=? ORDER BY created LIMIT 1)
      AND notification_sent IS NULL AND notification_claim<=?
     RETURNING id,creator_name,notification_attempts`, now+60000, claim, now, now, now);
    if (!item) break;
    try {
     const providerId = await sendAlert(item);
     await run(`UPDATE creator_enquiries SET notification_sent=?,notification_provider=?,notification_error='',notification_claim=0
      WHERE id=? AND notification_token=?`, Date.now(), providerId, item.id, claim);
    } catch {
     const retry = Date.now() + Math.min(60, 2 ** (item.notification_attempts-1)) * 60000;
     await run(`UPDATE creator_enquiries SET notification_error=?,notification_next=?,notification_claim=0
      WHERE id=? AND notification_token=?`, 'Email alert needs retry. The enquiry is saved in the inbox.', retry, item.id, claim);
    }
   }
  } finally {
   running = false;
  }
 }
 return {drain};
}
