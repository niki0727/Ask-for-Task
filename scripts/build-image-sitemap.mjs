import { buildImageSitemap } from './portfolio/image-sitemap.mjs';

const result = buildImageSitemap(process.cwd(), { check: process.argv.includes('--check') });
console.log(`Image sitemap ${process.argv.includes('--check') ? 'verified' : 'built'}: ${result.images} image references across ${result.routes} landing pages.`);
