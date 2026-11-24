import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { vilniusPhotos } from './vilnius.mjs';
import { italianPhotos } from './italian.mjs';
import { fashionPhotos } from './fashion.mjs';
import { celaviPhotos } from './celavi.mjs';
import { seventySevenPhotos } from './seventy-seven.mjs';
import { portraitPhotos } from './portraits.mjs';
import { bubbaPhotos } from './bubba.mjs';

// These changes are presentation decisions; the approved v15 archive stays intact.
const lowResolutionHeld = new Set(['30', '31']);
const editorialHeld = new Set(['70', 'adobe-portraits-013', 'adobe-portraits-015', 'adobe-portraits-018', 'adobe-portraits-023', 'adobe-portraits-010', 'remainder-2161', 'remainder-2205', 'work-0866', 'work-0869', 'district29-064', 'work-1087', 'work-1061', '07', 'fresh-0543']);
const held = new Set([...lowResolutionHeld, ...editorialHeld]);
// Held photographs stay in the private source archive, not in public assets.
const removedPublicAssets = new Set(held);
const curonianSelection = ['adobe-portraits-014', 'adobe-portraits-017', 'adobe-portraits-022', 'adobe-portraits-020'];
const priorities = {
  'COODIE · Café session': ['fresh-0494', 'fresh-0507', 'fresh-0528', 'fresh-0477', 'fresh-0518', 'fresh-0555'],
  'My Soho Times · The BoTree': ['adobe-events-083', 'adobe-events-075', 'adobe-events-062'],
  'Bubba Oasis': ['adobe-events-035', 'adobe-events-032', 'adobe-events-033', 'bubba-indoor-couple'],
  'FashionTV': [
    '09', 'adobe-events-003', 'adobe-events-002', 'fashion-design-007',
    'adobe-events-008', 'work-0850', 'fashion-drive-053', 'fashion-drive-068', 'fashion-guests-011',
    'fashion-venue-amber', 'fashion-drive-033', 'fashion-venue-red',
    'fashion-drive-052', 'work-0815', 'work-0837', '27', 'work-0875',
    'adobe-events-004', 'adobe-events-012', 'adobe-events-014', 'adobe-events-015',
  ],
  'Liv Kirby · Garden editorial': ['elysium-cover', 'work-1066'],
  'Basketball': ['sports-0024', '84', '48', 'sports-0014', 'sports-0026', 'sports-0031', 'sports-0010'],
  'Nikita · Curonian Lagoon': ['adobe-portraits-014', 'adobe-portraits-015', 'adobe-portraits-013', 'adobe-portraits-017', 'adobe-portraits-018', 'adobe-portraits-023', 'adobe-portraits-022', 'adobe-portraits-020'],
};
const orders = {
  events: ['COODIE · Café session', 'Bubba Oasis', 'Highlights · Open air festival', 'My Soho Times · The BoTree', 'Aqua Nueva', 'CE LA VI', 'My Soho Times · Magazine launch', 'FashionTV', 'District 29 · Boat to Gallery 1986', 'E1 · Club coverage', '77 London · DEB FA'],
  travel: ['Greece · Coast to evening', 'Portugal', 'Lakes & mountains'],
};
// Preview covers are curated independently of the full-screen story sequence.
const albumPreviews = {
  'FashionTV': { key: '09' },
  'Bubba Oasis': { key: 'adobe-events-035', focus: 'upper-quarter' },
  'Highlights · Open air festival': { key: 'work-0964' },
  'My Soho Times · The BoTree': { key: 'adobe-events-075', focus: 'upper' },
  'CE LA VI': { key: 'adobe-events-016', focus: 'upper-quarter' },
  '77 London · DEB FA': { key: 'seventy-seven-027' },
  'My Soho Times · Magazine launch': { key: 'adobe-events-093', focus: 'upper-quarter' },
  'Liv Kirby · Garden editorial': { focus: 'upper-quarter' },
  'Kai · Garden light': { focus: 'upper-quarter' },
  'Soho · In motion': { focus: 'upper-quarter' },
  'Kai · Covent Garden': { focus: 'upper-quarter' },
  'Alisher · Shoreditch': { focus: 'upper-quarter' },
  'Curonian Lagoon · Portrait study': { focus: 'upper-quarter' },
  'Ice hockey': { focus: 'upper-quarter' },
  'Basketball': { focus: 'upper-quarter' },
};
const escape = text => text.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const decode = text => text.replaceAll('&amp;', '&').replaceAll('&#x27;', "'").replaceAll('&#39;', "'");
const mediumWidth = 1200;

function csv(text) {
  const rows = []; let row = [], cell = '', quoted = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') { if (quoted && text[i + 1] === '"') { cell += '"'; i++; } else quoted = !quoted; }
    else if (!quoted && (c === ',' || c === '\n')) { row.push(cell.replace(/\r$/, '')); cell = ''; if (c === '\n') { rows.push(row); row = []; } }
    else cell += c;
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  const keys = rows.shift();
  return rows.map(values => Object.fromEntries(keys.map((key, i) => [key, values[i]])));
}

export async function refinePortfolio(destination, source) {
  fs.mkdirSync('outputs/portfolio-audit-20261005', { recursive: true });
  const rows = csv(fs.readFileSync(path.join(source, 'selection-manifest.csv'), 'utf8'));
  const addedRows = [...vilniusPhotos, ...italianPhotos, ...fashionPhotos, ...celaviPhotos, ...seventySevenPhotos, ...portraitPhotos, ...bubbaPhotos].map(photo => ({ key: photo.key, image: `images/${photo.slug}.webp`, thumb: `images/${photo.slug}-small.webp`, alt: photo.alt }));
  const byFile = new Map([...rows, ...addedRows].map(row => [path.basename(row.image), row]));
  const byKey = new Map([...rows, ...addedRows].map(row => [row.key, row]));
  const meta = new Map();
  for (const row of rows) meta.set(path.basename(row.image), await sharp(path.join(source, row.image)).metadata());
  for (const row of addedRows) meta.set(path.basename(row.image), await sharp(path.join(destination, row.image)).metadata());
  const mediumImage = row => row.image.replace(/\.webp$/, '-medium.webp');
  const responsiveSrcset = (row, info) => {
    const thumbWidth = Math.min(Number(row.thumb_width) || 800, info.width);
    const sources = [`/portfolio/${row.thumb} ${thumbWidth}w`];
    if (info.width > thumbWidth) sources.push(`/portfolio/${mediumImage(row)} ${Math.min(mediumWidth, info.width)}w`);
    if (info.width > mediumWidth) sources.push(`/portfolio/${row.image} ${info.width}w`);
    return sources.join(', ');
  };
  for (const row of [...rows, ...addedRows]) {
    if (held.has(row.key)) continue;
    const info = meta.get(path.basename(row.image));
    if (!info || info.width <= (Number(row.thumb_width) || 800)) continue;
    await sharp(path.join(destination, row.image))
      .resize({ width: mediumWidth, withoutEnlargement: true })
      .webp({ quality: 82, effort: 4 })
      .toFile(path.join(destination, mediumImage(row)));
  }
  const photoKey = html => byFile.get(html.match(/href="[^\"]*\/([^/\"]+)"/)?.[1])?.key;
  const photosOf = html => [...html.matchAll(/<a class="photo"[\s\S]*?<\/a>/g)].map(match => match[0]);
  const story = (name, photos, id, collapsible = false, collection = '') => {
    const denseLayout = name === 'FashionTV' ? ' data-layout="dense"' : name === 'CE LA VI' ? ' data-layout="editorial"' : '';
    const gallery = `<div class="story-head"><h2>${escape(name)}</h2><button class="view-story" type="button" aria-label="View story: ${escape(name)} full screen" hidden>View story <span aria-hidden="true">↗</span></button></div>${name === 'District 29 · Boat to Gallery 1986' ? '<p class="story-deck">One summer-night event in Vilnius: District boat, then the later programme at Gallery 1986. The edit moves from the open air into the crowd and red-lit room.</p>' : ''}<div class="gallery" data-gallery>${photos.join('')}</div>`;
    if (!collapsible) return `<section class="story" id="${id}" aria-label="${escape(name)}"${denseLayout}>${gallery}</section>`;
    const preview = albumPreviews[name];
    const coverPhoto = preview?.key ? photos.find(photo => photoKey(photo) === preview.key) : photos[0];
    if (!coverPhoto) throw new Error(`Missing album preview photograph: ${name}`);
    const cover = coverPhoto.match(/<img\b[^>]*\bsrc="([^"]+)"/)?.[1];
    const coverAlt = coverPhoto.match(/<img\b[^>]*\balt="([^"]+)"/)?.[1] || `${escape(name)} photograph`;
    const coverSize = coverPhoto.match(/\bwidth="(\d+)" height="(\d+)"/);
    const focus = preview?.focus ? ` data-preview-focus="${preview.focus}"` : '';
    const expandedGallery = gallery.replace(`<h2>${escape(name)}</h2>`, '');
    const type = collection === 'events' ? 'Event story' : 'Photo story';
    return `<details class="story album-story" id="${id}" aria-label="${escape(name)}"${denseLayout}><summary class="album-preview"><img src="${cover}" alt="${coverAlt}" width="${coverSize?.[1] || 800}" height="${coverSize?.[2] || 533}" loading="lazy" decoding="async"${focus}><span class="album-preview-copy"><span class="album-preview-label">${type} · ${photos.length} photograph${photos.length === 1 ? '' : 's'}</span><h2 class="album-preview-title">${escape(name)}</h2><span class="album-preview-action">Explore the story <span aria-hidden="true">↗</span></span></span></summary><div class="album-story-content">${expandedGallery}</div></details>`;
  };
  const addedPhoto = (photo) => {
    const info = meta.get(`${photo.slug}.webp`);
    if (!info?.width || !info?.height) throw new Error(`Missing generated photograph: ${photo.slug}`);
    const row = byKey.get(photo.key);
    return `<a class="photo" href="/portfolio/images/${photo.slug}.webp" data-alt="${escape(photo.alt)}" data-ratio="${info.width / info.height}" aria-label="Open photograph: ${escape(photo.alt)}"><img src="/portfolio/images/${photo.slug}-small.webp" srcset="${responsiveSrcset(row, info)}" sizes="(max-width:640px) calc(100vw - 36px), (max-width:1000px) 48vw, 45vw" alt="${escape(photo.alt)}" width="${info.width}" height="${info.height}" loading="lazy" decoding="async"></a>`;
  };
  const links = [
    ['events', 'Events'], ['hospitality', 'Food & hospitality'], ['people', 'People & editorial'],
    ['sport', 'Sport & action'], ['aerial', 'Drone & aerial'], ['streets', 'Streets & places'],
    ['travel', 'Travel & landscape'], ['products', 'Objects & still life'],
  ];
  const coverBySlug = { events: 'work-0964', hospitality: 'adobe-food-027', products: '72' };
  const coverFocusBySlug = { events: null };
  const selectedWorkDestinations = {
    'adobe-events-083': { href: '/portfolio/events/#project-3', label: 'View The BoTree story' },
    'bubba-indoor-couple': { href: '/portfolio/events/#project-1', label: 'View Bubba Oasis story' },
    '22': { href: '/portfolio/people/#project-2', label: 'View Soho · In motion' },
  };
  const selectedWorkOrder = ['adobe-events-083', '22', 'bubba-indoor-couple'];
  const selectedWorkCaptions = {
    'adobe-events-083': ['Events', 'The BoTree'],
    '22': ['People & editorial', 'Soho · In motion'],
    'bubba-indoor-couple': ['Events', 'Bubba Oasis'],
  };
  const personalPhotos = photosOf(fs.readFileSync(path.join(source, 'personal.html'), 'utf8'));
  const selectedPortraits = curonianSelection.map(key => personalPhotos.find(photo => photoKey(photo) === key)).map(photo => {
    if (!photo) throw new Error('A selected Curonian Lagoon portrait is missing from the source archive.');
    return photo.replaceAll('images/', '/portfolio/images/');
  });
  const report = { reviewed: rows.length, newSelections: [
    ...vilniusPhotos.map(photo => ({ key: photo.key, original: photo.original, source: photo.sourcePath, chapter: photo.chapter, provenance: photo.provenance })),
    ...italianPhotos.map(photo => ({ key: photo.key, original: `${photo.number}.jpg`, source: photo.sourcePath, chapter: Number(photo.number) < 26 ? 'Bocca in Cielo' : 'Mare Fabris Osteria', provenance: 'Edited JPEG in the private Adobe Food review archive' })),
    ...fashionPhotos.map(photo => ({ key: photo.key, original: `${photo.number}.jpg`, source: photo.sourcePath, chapter: 'FashionTV', provenance: 'Nikita’s published Adobe Events sequence' })),
    ...celaviPhotos.map(photo => ({ key: photo.key, original: photo.filename, source: photo.sourcePath, chapter: ['celavi-drive-006', 'celavi-drive-4881'].includes(photo.key) ? 'CE LA VI · Interiors' : 'CE LA VI', provenance: 'Edited original supplied by Nikita from the CE LA VI drive archive' })),
    ...seventySevenPhotos.map(photo => ({ key: photo.key, original: photo.filename, source: photo.sourcePath, chapter: '77 London · DEB FA', provenance: 'Edited original supplied by Nikita from the 77 London drive archive' })),
    ...portraitPhotos.map(photo => ({ key: photo.key, original: photo.filename, source: photo.sourcePath, chapter: 'Other portrait work', provenance: 'Edited photograph from the supplied portrait archive' })),
    ...bubbaPhotos.map(photo => ({ key: photo.key, original: photo.filename, source: photo.sourcePath, chapter: 'Bubba Oasis', provenance: 'Published Lightroom rendition supplied by Nikita from the shared Bubba Oasis album' })),
  ], held: rows.filter(row => held.has(row.key)).map(row => ({ key: row.key, image: row.image, reason: lowResolutionHeld.has(row.key) ? '212 × 320 source rendition; unsuitable for an immersive public gallery. Original retained in v15.' : ['work-0866', 'work-0869', 'district29-064', 'work-1087', 'work-1061', '07', 'fresh-0543'].includes(row.key) ? 'Removed from public presentation at Nikita’s request; original retained in v15.' : 'Held after final editorial review; original retained in v15.' })), pages: [] };
  const publishedImageFiles = new Set();

  for (const slug of ['index', ...links.map(([slug]) => slug)]) {
    const file = path.join(destination, slug === 'index' ? 'index.html' : `${slug}/index.html`);
    let html = fs.readFileSync(file, 'utf8');
    const nav = links.map(([key, name]) => `<a href="/portfolio/${key}/"${slug === key ? ' aria-current="page"' : ''}>${escape(name)}</a>`).join('');
    html = html.replace(/<header class="site-head">[\s\S]*?<\/header>/, `<header class="site-head"><a class="brand" href="/portfolio/" aria-label="Nikita Piazenko Photography portfolio">Nikita Piazenko <span>/ Photography</span></a><nav class="primary-nav" aria-label="Portfolio navigation"><a href="/portfolio/"${slug === 'index' ? ' aria-current="page"' : ''}>All collections</a><a class="site-return" href="/">A4T Studio ↗</a><details class="collection-menu"><summary>Collections <span aria-hidden="true">+</span></summary><nav aria-label="Collections">${nav}</nav></details></nav></header>`);
    html = html.replace(/<a class="back" href="[^"]+">/, '<a class="back" href="/portfolio/">');

    let stories = [...html.matchAll(/<section class="story"[\s\S]*?<\/section>/g)].map(match => {
      const name = decode(match[0].match(/aria-label="([^"]+)"/)[1]);
      let photos = photosOf(match[0]).filter(photo => !held.has(photoKey(photo)));
      const keys = priorities[name] || [];
      photos = [...keys.map(key => photos.find(photo => photoKey(photo) === key)).filter(Boolean), ...photos.filter(photo => !keys.includes(photoKey(photo)))];
      const displayNames = {
        'District 29': 'District 29 · Boat to Gallery 1986',
        'Travel & landscape': 'Lakes & mountains',
        'Kai shoot in covent garden': 'Kai · Covent Garden',
        'Alisher in Shorditch': 'Alisher · Shoreditch',
        'Highlights': 'Highlights · Open air festival',
      };
      if (slug === 'events' && name === 'District 29') {
        const existing = new Map(photos.map(photo => [photoKey(photo), photo]));
        const additions = new Map(vilniusPhotos.map(photo => [photo.key, addedPhoto(photo)]));
        const sequence = [
          'vilnius-7118', '05', 'district29-057', 'district29-069', '06', 'district29-074',
          'vilnius-7852', 'vilnius-7685', 'vilnius-7711', 'vilnius-7939',
          'vilnius-8262', '17', 'vilnius-8821', 'vilnius-8169', 'vilnius-8070',
          'vilnius-8199', 'vilnius-8215', 'vilnius-8819', '08', 'vilnius-8308',
          'vilnius-8504', 'vilnius-8714', 'vilnius-8364', 'vilnius-8724',
        ];
        photos = sequence.map(key => existing.get(key) || additions.get(key) || (() => { throw new Error(`Missing District 29 selection: ${key}`); })());
      }
      if (slug === 'events' && name === 'FashionTV') {
        const additions = fashionPhotos.map(addedPhoto);
        // Retain the strongest frame from each near-identical moment. The
        // originals remain in the private source archive, outside this edit.
        const repeatedViews = new Set([
          'fashion-drive-039', // same pastel-outfit moment as adobe-events-003
          'work-0849', // same branded-bag still life as fashion-drive-053
          'adobe-events-001', // alternate DJ frame would repeat the opening scene
          'work-0848', // ice installation superseded by fashion-drive-052
          'adobe-events-005', // amber lounge superseded by supplied venue view
          '16', // red lounge superseded by supplied venue view
        ]);
        photos = [...additions, ...photos].filter(photo => !repeatedViews.has(photoKey(photo)));
        const keys = priorities.FashionTV;
        photos = [...keys.map(key => photos.find(photo => photoKey(photo) === key)).filter(Boolean), ...photos.filter(photo => !keys.includes(photoKey(photo)))];
      }
      if (slug === 'events' && name === 'Bubba Oasis') {
        photos = [...bubbaPhotos.map(addedPhoto), ...photos];
        const keys = priorities['Bubba Oasis'];
        photos = [...keys.map(key => photos.find(photo => photoKey(photo) === key)).filter(Boolean), ...photos.filter(photo => !keys.includes(photoKey(photo)))];
      }
      if (slug === 'events' && name === 'CE LA VI') {
        // NP-130 is the original master of the existing Adobe phone image;
        // replace that rendition. The new DJ frame also supersedes the
        // similar close portrait, keeping the event edit varied.
        const existing = new Map(photos.filter(photo => !['adobe-events-023', 'adobe-events-022'].includes(photoKey(photo))).map(photo => [photoKey(photo), photo]));
        const additions = new Map(celaviPhotos.map(photo => [photo.key, addedPhoto(photo)]));
        const sequence = [
          'adobe-events-016', 'adobe-events-018',
          '67', 'adobe-events-021',
          'celavi-drive-027',
          'celavi-drive-108', 'adobe-events-020', 'celavi-drive-130', 'adobe-events-030',
          'celavi-drive-091', 'celavi-drive-107', 'adobe-events-026', 'adobe-events-027',
          'celavi-drive-116', 'celavi-drive-105', 'adobe-events-029', 'celavi-drive-122',
        ];
        photos = sequence.map(key => existing.get(key) || additions.get(key) || (() => { throw new Error(`Missing CE LA VI selection: ${key}`); })());
      }
      return { original: match[0], name: displayNames[name] || name, photos };
    });
    if (slug === 'streets') {
      const first = stories.shift();
      stories.unshift(
        { name: 'Light & geometry', photos: first.photos.filter(photo => ['32', '33', '69', '35'].includes(photoKey(photo))) },
        { name: 'City lights', photos: first.photos.filter(photo => !['32', '33', '69', '35'].includes(photoKey(photo))) },
      );
    }
    if (slug === 'hospitality') {
      const interiors = stories.find(story => story.name === 'CE LA VI · Interiors');
      if (interiors) {
        interiors.photos.push(...['celavi-drive-006', 'celavi-drive-4881'].map(key => {
          const photo = celaviPhotos.find(candidate => candidate.key === key);
          if (!photo) throw new Error(`Missing CE LA VI interior photograph: ${key}`);
          return addedPhoto(photo);
        }));
      }
      const italian = stories.find(story => story.name === 'Italian dining');
      if (italian) {
        const selected = new Map(italian.photos.map(photo => [photoKey(photo), photo]));
        for (const photo of italianPhotos) selected.set(photo.key, addedPhoto(photo));
        const pick = keys => keys.map(key => {
          const photo = selected.get(key);
          if (!photo) throw new Error(`Missing Italian restaurant photograph: ${key}`);
          return photo;
        });
        const restaurantStories = [
          { name: 'Bocca in Cielo', photos: pick(['adobe-food-016', 'italian-017', 'adobe-food-018', 'adobe-food-019', 'italian-020', 'italian-021', 'italian-022', 'italian-023', 'italian-024']) },
          { name: 'Mare Fabris Osteria', photos: pick(['adobe-food-026', 'adobe-food-027', 'italian-028', 'adobe-food-029', 'italian-030', 'adobe-food-031', 'adobe-food-033', 'italian-034', 'adobe-food-035', 'italian-036', 'italian-037']) },
        ];
        stories = stories.flatMap(story => story.name === 'Italian dining' ? restaurantStories : [story]);
      }
    }
    if (slug === 'people') {
      stories.push({ name: 'Curonian Lagoon · Portrait study', id: 'curonian-portraits', photos: selectedPortraits });
      stories.push({ name: 'Other portrait work', id: 'other-portrait-work', photos: portraitPhotos.map(addedPhoto) });
    }
    if (slug === 'events') stories.push({ name: '77 London · DEB FA', id: '77-london-deb-fa', photos: seventySevenPhotos.map(addedPhoto) });
    if (slug === 'products') stories = [{ name: 'Object & packaging studies', photos: ['72', '71', '73'].map(key => {
      const photo = stories.flatMap(s => s.photos).find(candidate => photoKey(candidate) === key);
      if (!photo) throw new Error(`Selected object photograph ${key} is missing from the source archive.`);
      return photo;
    }) }];
    if (orders[slug]) stories.sort((a, b) => orders[slug].indexOf(a.name) - orders[slug].indexOf(b.name));
    if (stories.length) {
      const firstStory = html.indexOf('<section class="story"');
      const oldStories = [...html.matchAll(/<section class="story"[\s\S]*?<\/section>/g)];
      const last = oldStories.at(-1);
      html = html.slice(0, firstStory) + stories.map((s, i) => story(s.name, s.photos, s.id || `project-${i}`, slug !== 'products' && stories.length > 1, slug)).join('') + html.slice(last.index + last[0].length);
      const jump = `${slug === 'events' ? '<p class="swipe-hint">Swipe through the stories →</p>' : ''}<nav class="collection-jump" aria-label="Stories in this collection">${stories.map((s, i) => `<a href="#${s.id || `project-${i}`}">${escape(s.name)}</a>`).join('')}</nav>`;
      html = html.replace(/<(?:div|nav) class="collection-jump"[\s\S]*?<\/(?:div|nav)>/, jump);
      // Some short collections originally had no project navigation.
      if (!html.includes('class="collection-jump"')) html = html.replace(slug !== 'products' && stories.length > 1 ? '<details class="story album-story"' : '<section class="story"', match => jump + match);
      const nextSlug = links[(links.findIndex(([key]) => key === slug) + 1) % links.length];
      html = html.replace('<section class="enquiry"', `<nav class="collection-next" aria-label="Continue exploring"><a href="/portfolio/">← All collections</a><a href="/portfolio/${nextSlug[0]}/">Explore ${escape(nextSlug[1].toLowerCase())} →</a></nav><section class="enquiry"`);
    } else {
      html = html.replace(/<section class="opening"[\s\S]*?<\/section>/, old => {
        const openingPhotos = photosOf(old).slice(0, 3);
        const available = new Map([...openingPhotos, ...bubbaPhotos.map(addedPhoto)].map(photo => [photoKey(photo), photo]));
        const selectedPhotos = selectedWorkOrder.map(key => available.get(key));
        if (selectedPhotos.some(photo => !photo)) throw new Error('A selected work photograph is missing from the source archive.');
        const captionedPhotos = selectedPhotos.map((photo, index) => {
          const [category, title] = selectedWorkCaptions[selectedWorkOrder[index]];
          return photo.replace(/aria-label="([^"]*)"/, (_, label) => `aria-label="${escape(category)} ${escape(title)}. ${label}"`).replace('</a>', `<span class="opening-caption" aria-hidden="true"><span>${escape(category)}</span> <strong>${escape(title)}</strong></span></a>`);
        });
        return `<section class="opening" aria-label="Selected photographs"><div class="opening-head"><p>Selected work <span>/ Three stories</span></p><button class="view-story" type="button" hidden>View selection ↗</button></div><div class="gallery" data-gallery>${captionedPhotos.join('')}</div><p class="opening-note">People, place and the moments in between. Select a photograph to explore its story.</p></section>`;
      });
      html = html.replace(/<div class="intro">([\s\S]*?)<\/div>/, (_, content) => `<div class="intro">${content}</div>`);
      html = html.replace('<a class="enquiry-link" href="#collections">Explore the collections ↓</a></div>', '<div class="intro-actions"><a class="enquiry-link" href="#collections">Explore the collections ↓</a><a class="intro-contact" href="/contact/?topic=Photography%20or%20aerial%20content">Discuss a shoot ↗</a></div></div>');
      // The hockey, tacos and festival photographs remain inside their collections;
      // removing the second opening row eliminates repeated category previews.
      html = html.replace(/<a class="index-link" href="\/portfolio\/personal\/">[\s\S]*?<\/a>/, '');
    }
    if (slug === 'events') html = html.replace('Event photography: atmosphere, people and the story of the occasion.', 'Daylight gatherings, launches, festivals and late-night rooms. Each set follows one event from the wider scene to the smaller moments.');
    if (slug === 'people') html = html.replace('Editorial portraits, location sessions and personal-brand photography.', 'Published editorial work, portraits on location and an independent portrait study.');
    if (slug === 'products') html = html.replace('Selected object studies and drinks in context.', 'Three studies of form, material and packaging.');

    html = html.replace(/<p class="view-hint">[\s\S]*?<\/p>/g, '');
    html = html.replace(/<a class="photo"[\s\S]*?<\/a>/g, photo => {
      const key = photoKey(photo), row = byKey.get(key), info = row && meta.get(path.basename(row.image));
      if (!info) return photo;
      return photo.replace('class="photo"', `class="photo" data-key="${escape(key)}" data-width="${info.width}" data-height="${info.height}"`).replace(/data-ratio="[^"]+"/, `data-ratio="${info.width / info.height}"`).replace(/srcset="[^"]+"/, `srcset="${responsiveSrcset(row, info)}"`).replace(/width="\d+" height="\d+"/, `width="${info.width}" height="${info.height}"`);
    });
    html = html.replace(/<a class="index-link"[\s\S]*?<\/a>/g, card => {
      const filename = card.match(/src="[^\"]*\/([^/\"]+)-small.webp"/)?.[1] + '.webp';
      const row = byFile.get(filename);
      const info = row && meta.get(path.basename(row.image));
      return row && info ? card.replace('alt="Photography collection preview"', `alt="${escape(row.alt)}"`).replace(/srcset="[^"]+"/, `srcset="${responsiveSrcset(row, info)}"`) : card;
    });
    if (slug === 'index') {
      html = html.replace('<section class="enquiry" aria-label="Photography enquiries">', '<section class="enquiry enquiry-feature" aria-label="Photography enquiries"><span class="enquiry-kicker">Work with Nikita</span>');
      html = html.replace(/<a class="photo"[\s\S]*?<\/a>/g, photo => {
        const destination = selectedWorkDestinations[photoKey(photo)];
        return destination ? photo.replace('class="photo"', `class="photo" data-collection-href="${destination.href}" data-collection-label="${escape(destination.label)}"`) : photo;
      });
      for (const [cardSlug, key] of Object.entries(coverBySlug)) {
        const row = byKey.get(key), info = row && meta.get(path.basename(row.image));
        if (!row || !info) continue;
        const cardPattern = new RegExp(`(<a class="index-link" href="/portfolio/${cardSlug}/">[\\s\\S]*?<img )([^>]+)(>)[\\s\\S]*?(</a>)`);
        html = html.replace(cardPattern, (_, start, attributes, end, close) => {
          let nextAttributes = attributes
            .replace(/src="[^"]+"/, `src="/portfolio/${row.image.replace('.webp', '-small.webp')}"`)
            .replace(/srcset="[^"]+"/, `srcset="${responsiveSrcset(row, info)}"`)
            .replace(/alt="[^"]+"/, `alt="${escape(row.alt)}"`)
            .replace(/width="\d+"/, `width="${info.width}"`)
            .replace(/height="\d+"/, `height="${info.height}"`);
          if (Object.hasOwn(coverFocusBySlug, cardSlug)) {
            nextAttributes = nextAttributes.replace(/(?:^|\s)data-focal="[^"]+"/g, '').trimStart();
            if (coverFocusBySlug[cardSlug]) nextAttributes += ` data-focal="${coverFocusBySlug[cardSlug]}"`;
          }
          return `${start}${nextAttributes}${end}${html.match(new RegExp(`(<a class="index-link" href="/portfolio/${cardSlug}/">[\\s\\S]*?</a>)`))?.[1]?.replace(/^[\s\S]*?<img [^>]+>/, '') || close}`;
        });
      }
    }
    // Normalise inherited markup before prioritising only the first visible photograph.
    html = html.replace(/<a class="photo"[\s\S]*?<\/a>/g, photo => photo.replace(/\sfetchpriority="[^"]+"/g, '').replace(/loading="(?:eager|lazy)"/, 'loading="lazy"'));
    let eager = 0;
    html = html.replace(/(<a class="photo"[\s\S]*?<img\b[^>]*?)loading="lazy"/g, (match, prefix) => ++eager === 1 ? `${prefix}loading="eager" fetchpriority="high"` : match);
    html = html.replace(/sizes="\(max-width:640px\) calc\(100vw - 36px\), \(max-width:1000px\) 45vw, 36vw"/g, 'sizes="(max-width:640px) calc(100vw - 36px), (max-width:1000px) 48vw, 45vw"');
    html = html.replace(/href="mailto:nikita.piazenko@askfortask.co.uk\?subject=Photography%20or%20aerial%20content"/g, 'href="/contact/?topic=Photography%20or%20aerial%20content"');
    // Refinement adds data attributes before href, so do not depend on attribute order.
    const firstPhoto = photosOf(html)[0];
    const firstImage = firstPhoto?.match(/\bhref="([^"]+)"/)?.[1];
    const firstAlt = firstPhoto?.match(/<img\b[^>]*\balt="([^"]+)"/)?.[1];
    if (firstImage) html = html.replace('</head>', `<meta property="og:image" content="https://askfortask.co.uk${firstImage}"><meta property="og:image:alt" content="${firstAlt || 'Selected photograph by Nikita Piazenko'}"><meta name="twitter:image" content="https://askfortask.co.uk${firstImage}"><meta name="twitter:image:alt" content="${firstAlt || 'Selected photograph by Nikita Piazenko'}"></head>`);
    html = html.replace(/<dialog id="viewer"[\s\S]*?<\/dialog>/, `<dialog id="viewer" aria-labelledby="viewer-title"><div class="viewer-bar"><div class="viewer-context"><p id="viewer-title">Selected photographs</p><span id="viewer-position" aria-hidden="true"></span></div><div class="viewer-actions"><button id="toggle-overview" type="button" aria-expanded="false" aria-controls="viewer-overview">Overview</button><button id="fullscreen-viewer" type="button" hidden>Full screen</button><button id="close-viewer" type="button" aria-label="Close ×">Close ×</button></div></div><div class="viewer-stage" aria-busy="false"><button id="previous-photo" class="viewer-arrow" type="button" aria-label="Previous photograph">←</button><img id="viewer-image" alt="Photograph viewer" width="1" height="1"><button id="next-photo" class="viewer-arrow" type="button" aria-label="Next photograph">→</button></div><p id="viewer-error" role="status" hidden>This photograph could not load. <button id="retry-photo" type="button">Try again</button></p><div id="viewer-overview" class="viewer-overview" aria-label="Photographs in this story" hidden></div><div class="viewer-footer"><span>Arrow keys or swipe to explore · Esc to close</span><a id="view-collection" class="viewer-collection-link" hidden>View related collection</a><button id="next-story" type="button" hidden>Next story →</button></div><p class="sr-only" id="viewer-status" aria-live="polite"></p></dialog>`);
    fs.writeFileSync(file, html);
    for (const match of html.matchAll(/\/portfolio\/images\/([^"?#,\s]+)/g)) publishedImageFiles.add(match[1]);
    report.pages.push({ slug, images: photosOf(html).length, stories: stories.map(s => ({ name: s.name, count: s.photos.length })) });
  }
  fs.copyFileSync('scripts/portfolio/style.css', path.join(destination, 'style.css'));
  fs.copyFileSync('scripts/portfolio/gallery.js', path.join(destination, 'gallery.js'));
  for (const key of removedPublicAssets) {
    const row = byKey.get(key);
    if (!row) throw new Error(`Missing removed public asset in source manifest: ${key}`);
    for (const image of [row.image, row.thumb]) {
      const target = path.resolve(destination, image);
      if (!target.startsWith(`${path.resolve(destination, 'images')}${path.sep}`)) throw new Error(`Unsafe public image path: ${image}`);
      fs.rmSync(target);
    }
  }
  for (const filename of fs.readdirSync(path.join(destination, 'images'))) {
    if (filename.endsWith('.webp') && !publishedImageFiles.has(filename)) fs.rmSync(path.join(destination, 'images', filename));
  }
  fs.writeFileSync('outputs/portfolio-audit-20261005/curation.json', JSON.stringify(report, null, 2));
  console.log(`Refined portfolio: ${rows.length - held.size + addedRows.length} selections (${vilniusPhotos.length} Lightroom edits, ${italianPhotos.length} edited food JPEGs, ${fashionPhotos.length} FashionTV photographs, ${celaviPhotos.length} CE LA VI originals, ${seventySevenPhotos.length} 77 London photographs, ${portraitPhotos.length} portrait photographs, ${bubbaPhotos.length} Bubba Oasis indoor photograph); ${held.size} images held in the source archive.`);
}
