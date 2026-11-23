// Keep the standalone app usable while serving the same app inside the main site.
export const studioMount = url => new URL(url, 'https://studio.askfortask.co.uk').pathname.startsWith('/studio/') ? '/studio' : '';
export function mountHTML(html, mount) {
 const marked=html.replace('<head>', '<head><meta name="studio-base" content="'+mount+'">');
 return mount ? marked.replace(/\b(href|src|action)="\/(?!\/)/g, '$1="'+mount+'/') : marked;
}
export function mountData(data, mount, key='') {
 if (!mount) return data;
 if (Array.isArray(data)) return data.map(value=>mountData(value,mount));
 if (data && typeof data==='object') return Object.fromEntries(Object.entries(data).map(([key,value])=>[key,mountData(value,mount,key)]));
 return ['avatar','localLink'].includes(key) && typeof data==='string' && /^\/(?:api\/avatar\/|creators\/|\?access=)/.test(data) ? mount+data : data;
}
