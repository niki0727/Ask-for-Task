const site = 'https://askfortask.co.uk';
const nikita = {
 id: 'nikita-piazenko',
 name: 'Nikita Piazenko',
 role: 'Photographer',
 place: 'London',
 headline: 'Portraits with character, and events as they felt.',
 bio: 'Photography for events, people and places.',
 portfolio: site + '/photography/',
 specialties: ['Events', 'Portraits', 'Hospitality'],
 available: true,
 works: [
  {
   title: 'Elysium Lifestyle · June 2026 cover',
   credit: 'Editorial photography by Nikita Piazenko',
   url: site + '/portfolio/people/#project-0',
   image: site + '/portfolio/images/elysium-lifestyle-june-2026-cover-featuring-liv-kirby-in-a-pink-patterned-dress-medium.webp',
   imageSmall: site + '/portfolio/images/elysium-lifestyle-june-2026-cover-featuring-liv-kirby-in-a-pink-patterned-dress-small.webp',
   alt: 'Elysium Lifestyle cover with Liv Kirby in a pink patterned dress'
  },
  {
   title: 'District 29 · Vilnius',
   credit: 'Event photography by Nikita Piazenko',
   url: site + '/portfolio/events/#project-8',
   image: site + '/portfolio/images/district-boat-crowd-under-bridge-vilnius-medium.webp',
   imageSmall: site + '/portfolio/images/district-boat-crowd-under-bridge-vilnius-small.webp',
   alt: 'The District 29 crowd and DJ lights beneath a Vilnius bridge at dusk'
  }
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
 const {id, name, role, place, bio, works=[], specialties=[], available, portfolio, avatar, headline, remote, socials=[]} = creator;
 const enquiry = available ? `
 <form id="enquiry" method="post" action="/api/enquiries" data-creator="${escape(id)}">
  <h2>Enquire about this creator</h2>
  <p>A4T Studio will check availability with ${escape(name)} and reply by email. No account needed.</p>
  ${hosted ? '' : '<p class="muted">Local preview. Use sample details. This form saves a test enquiry without sending email.</p>'}
  <label>Your name<input name="name" autocomplete="name" maxlength="120" required></label>
  <label>Email<input name="email" type="email" autocomplete="email" maxlength="254" required></label>
  <label>Project brief<textarea name="brief" rows="5" maxlength="2400" placeholder="What are you planning? Include the date and location if you know them." required></textarea></label>
  <label class="check"><input name="consent" type="checkbox" required><span>A4T Studio may use my details to respond to this enquiry. <a href="/privacy/">Privacy policy</a></span></label>
  <button>Send enquiry</button>
  <p id="enquiry-status" role="status"></p>
 </form>` : '<p class="muted">Currently closed to enquiries through A4T Studio.</p>';
 const work = works.length ? `<section class="section creator-work" aria-labelledby="creator-work-title">
 <h2 id="creator-work-title">Selected work</h2>
 <div class="grid creator-work-grid">${works.map(item => `
 <article class="creator-work-card">
 <a href="${escape(item.url)}" class="creator-work-link">
  ${item.image ? `<img class="work-preview" src="${escape(item.image)}" ${item.imageSmall ? `srcset="${escape(item.imageSmall)} 800w, ${escape(item.image)} 1200w" sizes="(max-width: 760px) 90vw, 460px"` : ''} alt="${escape(item.alt||'')}" loading="lazy" decoding="async">` : ''}
  <div class="creator-work-caption"><h3>${escape(item.title)}</h3><span aria-hidden="true">↗</span></div>
 </a>${item.credit ? `<p class="muted">${escape(item.credit)}</p>` : ''}
 </article>`).join('')}</div>
 </section>` : '';
 return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
 <title>${escape(name)} · Ask for Task Studio</title><meta name="description" content="View ${escape(name)}'s public creator profile on A4T Studio. Explore the work and details they have chosen to share and send a project enquiry."><link rel="icon" href="/brand.svg" type="image/svg+xml"><link rel="stylesheet" href="/studio.css"><script src="/enquiry.js" defer></script></head>
 <body><header><a class="brand" href="https://askfortask.co.uk/" aria-label="Ask for Task Studio home"><img src="/brand.svg" width="100" height="43" alt=""></a><nav aria-label="Main"><a href="https://askfortask.co.uk/services/">Services</a><a href="/">Creator Studio</a></nav></header><main class="creator-page">
 <a class="creator-back" href="/#directory">← All creators</a>
 <section class="creator-intro" aria-labelledby="creator-name">
  <div class="creator-identity">
   ${avatar ? `<img class="avatar public-avatar" src="${escape(avatar)}" alt="" width="80" height="80">` : ''}
   <div><h1 id="creator-name">${escape(name)}</h1><p class="muted">${escape([role, place, remote ? 'Remote projects' : ''].filter(Boolean).join(' · '))}</p></div>
  </div>
  ${headline ? `<p class="creator-headline">${escape(headline)}</p>` : ''}
  ${bio ? `<p class="creator-bio">${escape(bio)}</p>` : ''}
  ${specialties.length ? `<ul class="disciplines" aria-label="Specialties">${specialties.map(label => `<li>${escape(label)}</li>`).join('')}</ul>` : ''}
  <div class="actions creator-actions">${available ? '<a class="button" href="#enquiry">Enquire about this creator</a>' : ''}${portfolio ? `<a class="creator-text-link" href="${escape(portfolio)}">Full portfolio ↗</a>` : ''}</div>
  ${socials.length ? `<div class="social-links">${socials.map(link=>`<a href="${escape(link.url)}" rel="noopener noreferrer">${escape(link.label)} ↗</a>`).join('')}</div>` : ''}
 </section>
 ${work}${enquiry}</main></body></html>`;
}
