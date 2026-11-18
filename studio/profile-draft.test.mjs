import test from 'node:test';
import assert from 'node:assert/strict';
import {publicAddress, generateProfileDraft, readProfilePage} from './profile-draft.mjs';

test('profile imports reject private, mapped and reserved addresses', async () => {
 for (const address of ['127.0.0.1', '10.0.0.1', '169.254.169.254', '192.168.1.1', '::1', '::ffff:127.0.0.1', 'fc00::1', 'fe80::1', '0.0.0.0']) {
  assert.equal(publicAddress(address), false, address);
 }
 assert.equal(publicAddress('1.1.1.1'), true);
 for (const url of ['https://127.0.0.1/', 'https://[::1]/', 'https://169.254.169.254/', 'http://example.com/', 'https://user:pass@example.com/', 'https://example.com:8443/']) {
  await assert.rejects(readProfilePage(url), error => error.status === 400);
 }
});

test('AI drafts stay grounded, structured and separate from persistence', async () => {
 await assert.rejects(generateProfileDraft({source:'Some source', apiKey:'', model:''}), error => error.status === 503);
 let request;
 const draft = await generateProfileDraft({
  source: 'I make documentary photographs and artist portraits.',
  tone: 'Natural and direct',
  apiKey: 'test',
  model: 'test',
  fetchAI: async (_url, options) => {
   request = JSON.parse(options.body);
   return Response.json({output:[{type:'message',content:[{type:'output_text',text:JSON.stringify({
    role:'Photographer',headline:'Documentary photographs and artist portraits',
    bio:'I make documentary photographs and artist portraits.',specialties:['Documentary','Portraits','Portraits']
   })}]}]});
  }
 });
 assert.equal(request.store, false);
 assert.equal(request.text.format.strict, true);
 assert.match(request.instructions, /Do not invent/);
 assert.deepEqual(draft.specialties, ['Documentary','Portraits']);
 await assert.rejects(generateProfileDraft({apiKey:'test',model:'test',fetchAI:async()=>Response.json({output:[]})}), error => error.status === 502);
});
