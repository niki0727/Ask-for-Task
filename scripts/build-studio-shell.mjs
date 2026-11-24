import {createHash} from 'node:crypto';
import {copyFile, mkdir, readFile, writeFile} from 'node:fs/promises';
import {creatorPage, featuredCreators} from '../studio/creators.mjs';
import {mountHTML} from '../studio/mount.mjs';

const output = new URL('../public/_studio-shell/', import.meta.url);
const source = new URL('../studio/site/', import.meta.url);
await mkdir(new URL('privacy/', output), {recursive:true});
await mkdir(new URL('creators/', output), {recursive:true});
let home = await readFile(new URL('index.html', source), 'utf8');
for (const name of ['studio.css', 'studio.js', 'operator.js', 'sketch.js']) {
  const contents = await readFile(new URL(name, source));
  const version = createHash('sha256').update(contents).digest('hex').slice(0, 12);
  home = home.replace(`="/${name}"`, `="/${name}?v=${version}"`);
}
await writeFile(new URL('index.html', output), mountHTML(home.replace(
  'Use a sample email to try Studio locally.', 'Use your email to join or sign in.'
), '/studio'));
const privacy = await readFile(new URL('privacy.html', source), 'utf8');
await writeFile(new URL('privacy/index.html', output), mountHTML(privacy, '/studio'));
await Promise.all([
  ...['studio.css', 'studio.js', 'operator.js', 'enquiry.js', 'sketch.js']
    .map(name => copyFile(new URL(name, source), new URL(name, output))),
  ...featuredCreators.map(creator => writeFile(
    new URL('creators/' + creator.id + '.html', output),
    mountHTML(creatorPage(creator, true), '/studio')
  ))
]);
