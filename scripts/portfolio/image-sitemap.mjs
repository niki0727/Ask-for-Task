import fs from 'node:fs';
import path from 'node:path';

const origin = 'https://askfortask.co.uk';
const routes = [
  '/photography/', '/portfolio/', '/portfolio/events/', '/portfolio/hospitality/',
  '/portfolio/people/', '/portfolio/sport/', '/portfolio/aerial/',
  '/portfolio/products/', '/portfolio/streets/', '/portfolio/travel/',
];
const escapeXml = value => value.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');

export function imageSitemap(root) {
  const publicDir = path.join(root, 'public');
  const pageSitemap = fs.readFileSync(path.join(publicDir, 'sitemap.xml'), 'utf8');
  const sections = [];
  const publishedPortfolioImages = new Set();
  let imageCount = 0;

  for (const route of routes) {
    if (!pageSitemap.includes(`<loc>${origin}${route}</loc>`)) throw new Error(`Indexable page missing from sitemap.xml: ${route}`);
    const html = fs.readFileSync(path.join(publicDir, route, 'index.html'), 'utf8');
    if (/name="robots" content="[^"]*noindex/i.test(html)) throw new Error(`Noindex page in image sitemap: ${route}`);
    const images = new Set();

    for (const [tag] of html.matchAll(/<img\b[^>]*>/g)) {
      const rawSource = tag.match(/\bsrc="([^"]+)"/)?.[1];
      if (!rawSource) continue;
      const source = rawSource.split(/[?#]/)[0];
      if (!source.startsWith('/portfolio/images/') && !source.startsWith('/assets/photography/')) continue;
      const alt = tag.match(/\balt="([^"]*)"/)?.[1];
      if (!alt?.trim()) throw new Error(`Photograph has no descriptive alt text on ${route}: ${source}`);
      const fullSize = source.startsWith('/portfolio/images/') ? source.replace(/-small\.webp$/, '.webp') : source;
      const localFile = path.resolve(publicDir, `.${fullSize}`);
      if (!localFile.startsWith(`${publicDir}${path.sep}`) || !fs.existsSync(localFile)) {
        throw new Error(`Missing full-size photograph on ${route}: ${fullSize}`);
      }
      images.add(fullSize);
      if (fullSize.startsWith('/portfolio/images/')) publishedPortfolioImages.add(fullSize);
    }

    if (!images.size || images.size > 1000) throw new Error(`Unexpected image count on ${route}: ${images.size}`);
    imageCount += images.size;
    sections.push(`  <url>\n    <loc>${origin}${route}</loc>\n${[...images].map(image => `    <image:image><image:loc>${escapeXml(origin + image)}</image:loc></image:image>`).join('\n')}\n  </url>`);
  }

  const unlisted = fs.readdirSync(path.join(publicDir, 'portfolio/images'))
    .filter(file => file.endsWith('.webp') && !file.endsWith('-small.webp') && !file.endsWith('-medium.webp'))
    .map(file => `/portfolio/images/${file}`)
    .filter(file => !publishedPortfolioImages.has(file));
  if (unlisted.length) throw new Error(`Unlisted public portfolio images: ${unlisted.join(', ')}`);

  return { xml: `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${sections.join('\n')}\n</urlset>\n`, routes: routes.length, images: imageCount };
}

export function buildImageSitemap(root, { check = false } = {}) {
  const result = imageSitemap(root);
  const target = path.join(root, 'public/image-sitemap.xml');
  if (check) {
    if (!fs.existsSync(target) || fs.readFileSync(target, 'utf8') !== result.xml) {
      throw new Error('image-sitemap.xml does not match the published photography and portfolio pages. Rebuild the portfolio.');
    }
  } else fs.writeFileSync(target, result.xml);
  return result;
}
