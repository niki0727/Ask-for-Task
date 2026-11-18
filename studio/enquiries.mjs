import {postgresStore} from './postgres-store.mjs';

const [command, reference] = process.argv.slice(2);
const withReference = ['show', 'handed-off', 'delete'].includes(command);
if ((!withReference && command !== 'pending') ||
    (withReference && !/^[a-f0-9]{8}(?:-[a-f0-9]{4}){3}-[a-f0-9]{12}$/.test(reference || ''))) {
 throw Error('Usage: node studio/enquiries.mjs pending | show <reference> | handed-off <reference> | delete <reference>');
}
if (!process.env.STUDIO_DATABASE_URL) throw Error('Set the Studio staging database connection.');
const store = await postgresStore(process.env.STUDIO_DATABASE_URL);
try {
 if (command === 'pending') {
  const rows = await store.all('SELECT id,creator_name,created FROM creator_enquiries WHERE handed_off IS NULL ORDER BY created LIMIT 50', []);
  console.log(JSON.stringify(rows, null, 2));
 } else if (command === 'show') {
  const row = await store.one('SELECT * FROM creator_enquiries WHERE id=?', [reference]);
  if (!row) throw Error('Enquiry not found.');
  console.log(JSON.stringify(row, null, 2));
 } else {
  const result = command === 'handed-off'
   ? await store.run('UPDATE creator_enquiries SET handed_off=? WHERE id=? AND handed_off IS NULL', [Date.now(), reference])
   : await store.run('DELETE FROM creator_enquiries WHERE id=?', [reference]);
  if (!result.changes) throw Error('Enquiry not found or already handed off.');
  console.log(command + ': ' + reference);
 }
} finally {
 await store.close();
}
