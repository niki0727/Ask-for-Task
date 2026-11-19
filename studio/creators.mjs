const site = 'https://askfortask.co.uk';
const nikita = {
 id: 'nikita-piazenko',
 name: 'Nikita Piazenko',
 role: 'Photographer',
 place: 'London',
 bio: 'Photography for events, people and places.',
 portfolio: site + '/photography/',
 specialties: ['Events', 'Portraits', 'Hospitality'],
 available: true,
 works: [
  {title: 'District · Vilnius nightlife', credit: 'Event photography by Nikita Piazenko', url: site + '/portfolio/events/#project-8', image: site + '/portfolio/images/district-boat-dj-under-red-light-vilnius.webp', imageSmall: site + '/portfolio/images/district-boat-dj-under-red-light-vilnius-small.webp', alt: 'DJ performing in red light at the District boat event'},
  {title: 'Elysium Lifestyle · June 2026 cover', credit: 'Editorial photography by Nikita Piazenko', url: site + '/portfolio/people/#project-0'}
 ]
};
export const featuredCreators = [nikita];

export function httpsLink(value) {
 if (typeof value !== 'string' || value.length > 500) return '';
 try {
  const url = new URL(value);
  if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
 } catch {}
 return '';
}

const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({
 '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
})[char]);

export function creatorPage(creator, hosted) {
 if (!creator) return '<!doctype html><html lang="en"><meta charset="utf-8"><title>Creator unavailable · A4T Studio</title><link rel="stylesheet" href="/studio.css"><main class="section"><h1>Creator unavailable</h1><a href="/#directory">Explore creators</a></main></html>';
 const {id, name, role, place, bio, works, specialties, available, portfolio, avatar, headline, remote, socials=[]} = creator;
 const enquiry = available ? `
 <form id="enquiry" method="post" action="/api/enquiries" data-creator="${escape(id)}">
  <h2>Enquire about this creator</h2>
  <p>A4T Studio will reply by email and check availability with ${escape(name)}. You can send a brief without an account.</p>
  ${hosted ? '' : '<p class="muted">Local preview. Use sample details. This form saves a test enquiry without sending email.</p>'}
  <label>Your name<input name="name" autocomplete="name" maxlength="120" required></label>
  <label>Email<input name="email" type="email" autocomplete="email" maxlength="254" required></label>
  <label>Project brief<textarea name="brief" rows="5" maxlength="2400" required></textarea></label>
  <label class="check"><input name="consent" type="checkbox" required><span>A4T Studio may use my details to respond to this enquiry. <a href="/privacy/">Privacy policy</a></span></label>
  <button>Send enquiry</button>
  <p id="enquiry-status" role="status"></p>
 </form>` : '<p class="muted">Currently closed to enquiries through A4T Studio.</p>';
 const work = works.length ? `<section class="section"><h2>Selected work</h2><div class="grid">${works.map(item => `
 <article>${item.image ? `<img class="work-preview" src="${escape(item.image)}" ${item.imageSmall ? `srcset="${escape(item.imageSmall)} 800w, ${escape(item.image)} 1920w" sizes="(max-width: 760px) 90vw, 600px"` : ''} alt="${escape(item.alt||item.title)}" width="1920" height="1277" loading="lazy">` : ''}
 <h3><a href="${escape(item.url)}">${escape(item.title)}</a></h3><p class="muted">${escape(item.credit)}</p></article>`).join('')}</div></section>` : '';
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
 <title>${escape(name)} · Ask for Task Studio</title><link rel="icon" href="/brand.svg" type="image/svg+xml"><link rel="stylesheet" href="/studio.css"><script src="/enquiry.js" defer></script></head>
 <body><header><a class="brand" href="/" aria-label="Ask for Task Studio home"><img src="/brand.svg" width="100" height="43" alt=""></a><nav aria-label="Main"><a href="https://askfortask.co.uk/services/">Services</a><a href="/#directory">Explore creators</a></nav></header><main class="creator-page">
 <section class="section creator-intro">${avatar ? `<img class="avatar public-avatar" src="${escape(avatar)}" alt="" width="104" height="104">` : ''}<h1>${escape(name)}</h1><p>${escape([role, place].filter(Boolean).join(' · '))}</p><p class="creator-headline">${escape(headline)}</p><p>${escape(bio)}</p>${remote?'<p class="muted">Available for remote projects</p>':''}
 <ul class="disciplines">${specialties.map(label => `<li>${escape(label)}</li>`).join('')}</ul>
 <div class="social-links">${socials.map(link=>`<a href="${escape(link.url)}" rel="noopener noreferrer">${escape(link.label)} ↗</a>`).join('')}</div><div class="actions">${portfolio ? `<a href="${escape(portfolio)}">Full portfolio ↗</a>` : ''}${available ? '<a class="button" href="#enquiry">Enquire about this creator</a>' : ''}</div></section>
 ${work}${enquiry}</main></body></html>`;
}
