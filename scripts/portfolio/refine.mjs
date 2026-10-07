import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';
import { vilniusPhotos } from './vilnius.mjs';
import { italianPhotos } from './italian.mjs';

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
  'Bubba Oasis': ['adobe-events-035', 'adobe-events-032', 'adobe-events-033'],
  'FashionTV': ['work-0850', 'adobe-events-002', 'adobe-events-008', '09'],
  'Liv Kirby · Garden editorial': ['elysium-cover', 'work-1066'],
  'Basketball': ['sports-0024', '84', '48', 'sports-0014', 'sports-0026', 'sports-0031', 'sports-0010'],
  'Nikita · Curonian Lagoon': ['adobe-portraits-014', 'adobe-portraits-015', 'adobe-portraits-013', 'adobe-portraits-017', 'adobe-portraits-018', 'adobe-portraits-023', 'adobe-portraits-022', 'adobe-portraits-020'],
};
const orders = {
  events: ['COODIE · Café session', 'Bubba Oasis', 'Highlights · Open air festival', 'My Soho Times · The BoTree', 'Aqua Nueva', 'CE LA VI', 'My Soho Times · Magazine launch', 'FashionTV', 'District 29 · Boat to Gallery 1986', 'E1 · Club coverage'],
  travel: ['Greece · Coast to evening', 'Portugal', 'Lakes & mountains'],
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
  const addedRows = [...vilniusPhotos, ...italianPhotos].map(photo => ({ key: photo.key, image: `images/${photo.slug}.webp`, thumb: `images/${photo.slug}-small.webp`, alt: photo.alt }));
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
  const story = (name, photos, id) => `<section class="story" id="${id}" aria-label="${escape(name)}"><div class="story-head"><h2>${escape(name)}</h2><button class="view-story" type="button" aria-label="View ${escape(name)} full screen" hidden>View story <span aria-hidden="true">↗</span></button></div>${name === 'District 29 · Boat to Gallery 1986' ? '<p class="story-deck">One summer-night event in Vilnius: District boat, then the later programme at Gallery 1986. The edit moves from the open air into the crowd and red-lit room.</p>' : ''}<div class="gallery" data-gallery>${photos.join('')}</div></section>`;
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
  const coverBySlug = { events: 'fresh-0494', hospitality: 'adobe-food-027', products: '72' };
  const personalPhotos = photosOf(fs.readFileSync(path.join(source, 'personal.html'), 'utf8'));
  const selectedPortraits = curonianSelection.map(key => personalPhotos.find(photo => photoKey(photo) === key)).map(photo => {
    if (!photo) throw new Error('A selected Curonian Lagoon portrait is missing from the source archive.');
    return photo.replaceAll('images/', '/portfolio/images/');
  });
  const report = { reviewed: rows.length, newSelections: [
    ...vilniusPhotos.map(photo => ({ key: photo.key, original: photo.original, source: photo.sourcePath, chapter: photo.chapter, provenance: photo.provenance })),
    ...italianPhotos.map(photo => ({ key: photo.key, original: `${photo.number}.jpg`, source: photo.sourcePath, chapter: Number(photo.number) < 26 ? 'Bocca in Cielo' : 'Mare Fabris Osteria', provenance: 'Edited JPEG in the private Adobe Food review archive' })),
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
          '04', '05', 'vilnius-7118', 'district29-057', 'district29-069', '06', 'district29-074',
          'vilnius-7852', 'vilnius-7685', 'vilnius-7711', 'vilnius-7939',
          'vilnius-8262', '17', 'vilnius-8821', 'vilnius-8169', 'vilnius-8070',
          'vilnius-8199', 'vilnius-8215', 'vilnius-8819', '08', 'vilnius-8308',
          'vilnius-8504', 'vilnius-8714', 'vilnius-8364', 'vilnius-8724',
        ];
        photos = sequence.map(key => existing.get(key) || additions.get(key) || (() => { throw new Error(`Missing District 29 selection: ${key}`); })());
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
    if (slug === 'people') stories.push({ name: 'Curonian Lagoon · Portrait study', id: 'curonian-portraits', photos: selectedPortraits });
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
      html = html.slice(0, firstStory) + stories.map((s, i) => story(s.name, s.photos, s.id || `project-${i}`)).join('') + html.slice(last.index + last[0].length);
      const jump = `${slug === 'events' ? '<p class="swipe-hint">Swipe through the stories →</p>' : ''}<nav class="collection-jump" aria-label="Stories in this collection">${stories.map((s, i) => `<a href="#${s.id || `project-${i}`}">${escape(s.name)}</a>`).join('')}</nav>`;
      html = html.replace(/<(?:div|nav) class="collection-jump"[\s\S]*?<\/(?:div|nav)>/, jump);
      // Some short collections originally had no project navigation.
      if (!html.includes('class="collection-jump"')) html = html.replace('<section class="story"', jump + '<section class="story"');
      const nextSlug = links[(links.findIndex(([key]) => key === slug) + 1) % links.length];
      html = html.replace('<section class="enquiry"', `<nav class="collection-next" aria-label="Continue exploring"><a href="/portfolio/">← All collections</a><a href="/portfolio/${nextSlug[0]}/">Explore ${escape(nextSlug[1].toLowerCase())} →</a></nav><section class="enquiry"`);
    } else {
      html = html.replace(/<section class="opening"[\s\S]*?<\/section>/, old => `<section class="opening" aria-label="Selected photographs"><div class="opening-head"><p>Selected work</p><button class="view-story" type="button" hidden>View selection ↗</button></div><div class="gallery" data-gallery>${photosOf(old).slice(0, 3).join('')}</div></section>`);
      html = html.replace(/<div class="intro">([\s\S]*?)<\/div>/, (_, content) => `<div class="intro">${content}</div>`);
      // The hockey, tacos and festival photographs remain inside their collections;
      // removing the second opening row eliminates repeated category previews.
      html = html.replace(/<a class="index-link" href="\/portfolio\/personal\/">[\s\S]*?<\/a>/, '');
    }
    if (slug === 'events') html = html.replace('Event photography: atmosphere, people and the story of the occasion.', 'From daylight gatherings and open-air crowds to evening launches and late-night rooms. Each set tells one event story.');
    if (slug === 'people') html = html.replace('Editorial portraits, location sessions and personal-brand photography.', 'Editorial portraits, location sessions and a concise personal portrait study.');
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
      for (const [cardSlug, key] of Object.entries(coverBySlug)) {
        const row = byKey.get(key), info = row && meta.get(path.basename(row.image));
        if (!row || !info) continue;
        const cardPattern = new RegExp(`(<a class="index-link" href="/portfolio/${cardSlug}/">[\\s\\S]*?<img )([^>]+)(>)[\\s\\S]*?(</a>)`);
        html = html.replace(cardPattern, (_, start, attributes, end, close) => {
          const nextAttributes = attributes
            .replace(/src="[^"]+"/, `src="/portfolio/${row.image.replace('.webp', '-small.webp')}"`)
            .replace(/srcset="[^"]+"/, `srcset="${responsiveSrcset(row, info)}"`)
            .replace(/alt="[^"]+"/, `alt="${escape(row.alt)}"`)
            .replace(/width="\d+"/, `width="${info.width}"`)
            .replace(/height="\d+"/, `height="${info.height}"`);
          return `${start}${nextAttributes}${end}${html.match(new RegExp(`(<a class="index-link" href="/portfolio/${cardSlug}/">[\\s\\S]*?</a>)`))?.[1]?.replace(/^[\s\S]*?<img [^>]+>/, '') || close}`;
        });
      }
    }
    // Normalise inherited markup before prioritising only the first visible photograph.
    html = html.replace(/<a class="photo"[\s\S]*?<\/a>/g, photo => photo.replace(/\sfetchpriority="[^"]+"/g, '').replace(/loading="(?:eager|lazy)"/, 'loading="lazy"'));
    let eager = 0;
    html = html.replace(/(<a class="photo"[\s\S]*?<img\b[^>]*?)loading="lazy"/g, (match, prefix) => ++eager === 1 ? `${prefix}loading="eager" fetchpriority="high"` : match);
    html = html.replace(/sizes="\(max-width:640px\) calc\(100vw - 36px\), \(max-width:1000px\) 45vw, 36vw"/g, 'sizes="(max-width:640px) calc(100vw - 36px), (max-width:1000px) 48vw, 45vw"');
    html = html.replace(/href="mailto:nikita.piazenko@askfortask.co.uk\?subject=Photography%20enquiry"/g, 'href="/contact/?topic=Photography%20package"');
    // Refinement adds data attributes before href, so do not depend on attribute order.
    const firstPhoto = photosOf(html)[0];
    const firstImage = firstPhoto?.match(/\bhref="([^"]+)"/)?.[1];
    const firstAlt = firstPhoto?.match(/<img\b[^>]*\balt="([^"]+)"/)?.[1];
    if (firstImage) html = html.replace('</head>', `<meta property="og:image" content="https://askfortask.co.uk${firstImage}"><meta property="og:image:alt" content="${firstAlt || 'Selected photograph by Nikita Piazenko'}"><meta name="twitter:image" content="https://askfortask.co.uk${firstImage}"><meta name="twitter:image:alt" content="${firstAlt || 'Selected photograph by Nikita Piazenko'}"></head>`);
    html = html.replace(/<dialog id="viewer"[\s\S]*?<\/dialog>/, `<dialog id="viewer" aria-labelledby="viewer-title"><div class="viewer-bar"><div class="viewer-context"><p id="viewer-title">Selected photographs</p><span id="viewer-position" aria-hidden="true"></span></div><div class="viewer-actions"><button id="toggle-overview" type="button" aria-expanded="false" aria-controls="viewer-overview">Overview</button><button id="fullscreen-viewer" type="button" hidden>Full screen</button><button id="close-viewer" type="button" aria-label="Close ×">Close ×</button></div></div><div class="viewer-stage" aria-busy="false"><button id="previous-photo" class="viewer-arrow" type="button" aria-label="Previous photograph">←</button><img id="viewer-image" alt="Photograph viewer" width="1" height="1"><button id="next-photo" class="viewer-arrow" type="button" aria-label="Next photograph">→</button></div><p id="viewer-error" role="status" hidden>This photograph could not load. <button id="retry-photo" type="button">Try again</button></p><div id="viewer-overview" class="viewer-overview" aria-label="Photographs in this story" hidden></div><div class="viewer-footer"><span>Arrow keys or swipe to explore · Esc to close</span><button id="next-story" type="button" hidden>Next story →</button></div><p class="sr-only" id="viewer-status" aria-live="polite"></p></dialog>`);
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
  console.log(`Refined portfolio: ${rows.length - held.size + addedRows.length} selections (${vilniusPhotos.length} Lightroom edits, ${italianPhotos.length} edited food JPEGs); ${held.size} images held in the source archive.`);
}
