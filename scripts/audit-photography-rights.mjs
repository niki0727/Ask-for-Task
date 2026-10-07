import fs from 'node:fs';

const registerPath = 'company-ops/photography-rights-register.json';
const register = JSON.parse(fs.readFileSync(registerPath, 'utf8'));
const decode = value => value.replaceAll('&amp;', '&').replaceAll('&#x27;', "'").replaceAll('&#39;', "'");
const published = [];

for (const route of ['events', 'hospitality', 'people', 'sport', 'aerial', 'products', 'streets', 'travel']) {
  const html = fs.readFileSync(`public/portfolio/${route}/index.html`, 'utf8');
  for (const match of html.matchAll(/<section class="story"[^>]*aria-label="([^"]+)"/g)) {
    published.push({ route, story: decode(match[1]) });
  }
}

const keyOf = entry => `${entry.route}\u0000${entry.story}`;
const records = new Map(register.stories.map(entry => [keyOf(entry), entry]));
const missing = published.filter(entry => !records.has(keyOf(entry)));
const stale = register.stories.filter(entry => !published.some(item => keyOf(item) === keyOf(entry)));
const invalid = register.stories.filter(entry => !['cleared', 'review_required', 'held'].includes(entry.status));
const pending = published.map(entry => records.get(keyOf(entry))).filter(entry => entry?.status !== 'cleared');

if (missing.length || stale.length || invalid.length) {
  console.error(JSON.stringify({ missing, stale, invalid }, null, 2));
  process.exit(1);
}

if (process.env.REQUIRE_PHOTOGRAPHY_RIGHTS_CLEARANCE === '1' && pending.length) {
  console.error(`Photography rights gate blocked deployment: ${pending.length} published stories still require review.`);
  for (const entry of pending) console.error(`- /portfolio/${entry.route}/ — ${entry.story}: ${entry.status}`);
  process.exit(1);
}

console.log(`Photography rights register covers ${published.length} published stories; ${pending.length} require owner review before deployment.`);
