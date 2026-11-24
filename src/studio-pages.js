import {featuredCreators} from '../studio/creators.mjs';

const publicFiles = new Set(['', 'privacy/', 'studio.css', 'studio.js', 'operator.js', 'enquiry.js', 'sketch.js']);
const publicProfiles = new Set(featuredCreators.map(creator => 'creators/' + creator.id));
const policy = "default-src 'self'; img-src 'self' https: blob:; base-uri 'none'; frame-ancestors 'none'; form-action 'self'; object-src 'none'";

export async function studioPage(request, assets) {
  const url = new URL(request.url);
  const route = url.pathname.slice('/studio/'.length).replace(/^(creators\/[a-z0-9-]+)\/$/, '$1');
  if (!['GET', 'HEAD'].includes(request.method)) return null;
  if (!publicFiles.has(route) && !publicProfiles.has(route) && route !== 'brand.svg') return null;

  url.pathname = route === 'brand.svg' ? '/assets/a4t-mark-soft.svg' : '/_studio-shell/' + route;
  const response = await assets.fetch(new Request(url, {method:request.method}));
  const headers = new Headers(response.headers);
  headers.set('Content-Security-Policy', policy);
  if (publicProfiles.has(route)) headers.set('X-Robots-Tag', 'noindex');
  return new Response(response.body, {status:response.status, headers});
}
