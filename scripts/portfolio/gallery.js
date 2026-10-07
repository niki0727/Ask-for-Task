const galleries = [...document.querySelectorAll('[data-gallery]')];
const groups = galleries.map(gallery => ({
  gallery,
  title: gallery.closest('.story')?.querySelector('h2')?.textContent || 'Selected photographs',
  photos: [...gallery.querySelectorAll('.photo')],
}));
const mobile = matchMedia('(max-width:640px)');

// Equal-height rows preserve every original frame, including the opening triptych.
// Small source files are never enlarged to fill a row.
function layout(group) {
  const { gallery, photos } = group;
  const width = gallery.clientWidth;
  if (!width) return;
  gallery.replaceChildren(...photos);
  for (const photo of photos) { photo.style.removeProperty('width'); photo.style.removeProperty('flex'); }
  if (mobile.matches) {
    for (const photo of photos) photo.style.width = `${Math.min(width, Number(photo.dataset.width))}px`;
    gallery.dataset.layoutReady = 'true';
    return;
  }
  const opening = gallery.closest('.opening');
  const gap = 14;
  for (let start = 0; start < photos.length;) {
    const left = photos.length - start;
    const size = opening ? Math.min(3, left) : left === 3 ? 3 : Math.min(2, left);
    const batch = photos.slice(start, start + size);
    const ratio = batch.reduce((sum, photo) => sum + Number(photo.dataset.ratio), 0);
    const maxHeight = opening ? 650 : size === 1 ? 620 : 560;
    const height = Math.min(maxHeight, (width - gap * (size - 1)) / ratio, ...batch.map(photo => Number(photo.dataset.height)));
    const row = document.createElement('div'); row.className = 'gallery-row';
    for (const photo of batch) {
      photo.style.width = `${Number(photo.dataset.ratio) * height}px`;
      photo.style.flex = 'none';
      row.append(photo);
    }
    gallery.append(row); start += size;
  }
  gallery.dataset.layoutReady = 'true';
}
groups.forEach(layout);
let resizeTimer;
addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => groups.forEach(layout), 120); });

const dialog = document.getElementById('viewer');
const image = document.getElementById('viewer-image');
const stage = dialog.querySelector('.viewer-stage');
const title = document.getElementById('viewer-title');
const position = document.getElementById('viewer-position');
const status = document.getElementById('viewer-status');
const previous = document.getElementById('previous-photo');
const next = document.getElementById('next-photo');
const nextStory = document.getElementById('next-story');
const overview = document.getElementById('viewer-overview');
const overviewToggle = document.getElementById('toggle-overview');
const fullscreen = document.getElementById('fullscreen-viewer');
const error = document.getElementById('viewer-error');
const closeButton = document.getElementById('close-viewer');
let groupIndex = 0, active = 0, opener = null, swipeStart = null, previousOverflow = '', request = 0, ownsHistory = false;
let returnURL = location.pathname + location.search;
const photoSlug = photo => new URL(photo.href).pathname.split('/').pop().replace(/\.webp$/, '');
const currentHash = () => '#photo=' + encodeURIComponent(photoSlug(groups[groupIndex].photos[active]));

function refreshOverview() {
  const group = groups[groupIndex];
  overview.replaceChildren(...group.photos.map((photo, index) => {
    const button = document.createElement('button'); button.type = 'button';
    button.setAttribute('aria-label', photo.dataset.alt);
    button.setAttribute('aria-current', String(index === active));
    const thumbnail = photo.querySelector('img');
    const preview = document.createElement('img'); preview.src = thumbnail.src; preview.alt = ''; preview.loading = 'lazy';
    preview.width = 80; preview.height = 58;
    button.append(preview); button.addEventListener('click', () => show(index));
    return button;
  }));
}

async function show(index, updateURL = true) {
  const group = groups[groupIndex];
  active = Math.max(0, Math.min(index, group.photos.length - 1));
  const photo = group.photos[active];
  const ticket = ++request;
  title.textContent = group.title;
  position.textContent = `${active + 1} / ${group.photos.length}`;
  previous.disabled = active === 0;
  next.disabled = active === group.photos.length - 1;
  nextStory.hidden = active !== group.photos.length - 1 || groupIndex === groups.length - 1;
  if (!nextStory.hidden) nextStory.setAttribute('aria-label', `Next story: ${groups[groupIndex + 1].title}`);
  error.hidden = true; stage.setAttribute('aria-busy', 'true');
  image.alt = photo.dataset.alt;
  for (const [i, button] of [...overview.children].entries()) button.setAttribute('aria-current', String(i === active));
  if (updateURL) history.replaceState(history.state, '', currentHash());
  const loaded = new Image(); loaded.src = photo.href;
  try {
    await loaded.decode();
    if (ticket !== request || !dialog.open) return;
    image.src = photo.href;
    image.width = loaded.naturalWidth; image.height = loaded.naturalHeight;
    stage.setAttribute('aria-busy', 'false');
    status.textContent = `${group.title}. Photograph ${active + 1} of ${group.photos.length}. ${photo.dataset.alt}`;
    // Only adjacent images are prefetched, not the complete collection.
    for (const neighbor of [group.photos[active - 1], group.photos[active + 1]].filter(Boolean)) { const preload = new Image(); preload.src = neighbor.href; }
  } catch {
    if (ticket !== request || !dialog.open) return;
    image.removeAttribute('src'); stage.setAttribute('aria-busy', 'false'); error.hidden = false;
    status.textContent = 'This photograph could not load. Try again or choose another photograph.';
  }
}

function openViewer(group, index, trigger, fromHistory = false) {
  groupIndex = group; active = index;
  if (!dialog.open) {
    opener = trigger || groups[group].photos[index];
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    if (!fromHistory) {
      returnURL = location.pathname + location.search + location.hash;
      history.pushState({ portfolioViewer: true }, '', currentHash()); ownsHistory = true;
    }
    dialog.showModal(); closeButton.focus();
  }
  refreshOverview(); show(index, !fromHistory);
}

function closeViewer() {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  if (ownsHistory && history.state?.portfolioViewer) { ownsHistory = false; history.back(); }
  else { history.replaceState(history.state, '', returnURL); dialog.close(); }
}

for (const [groupIndex, group] of groups.entries()) {
  for (const [index, photo] of group.photos.entries()) photo.addEventListener('click', event => {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault(); openViewer(groupIndex, index, photo);
  });
  const button = group.gallery.parentElement.querySelector('.view-story');
  if (button) { button.hidden = false; button.addEventListener('click', () => openViewer(groupIndex, 0, button)); }
}
previous.addEventListener('click', () => { if (active > 0) show(active - 1); });
next.addEventListener('click', () => { if (active < groups[groupIndex].photos.length - 1) show(active + 1); });
nextStory.addEventListener('click', () => { if (groupIndex < groups.length - 1) { groupIndex++; refreshOverview(); show(0); next.focus(); } });
closeButton.addEventListener('click', closeViewer);
document.getElementById('retry-photo').addEventListener('click', () => show(active));
overviewToggle.addEventListener('click', () => {
  overview.hidden = !overview.hidden; overviewToggle.setAttribute('aria-expanded', String(!overview.hidden));
  if (!overview.hidden) overview.querySelector('[aria-current="true"]')?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'instant' });
});
if (document.fullscreenEnabled) {
  fullscreen.hidden = false;
  fullscreen.addEventListener('click', async () => {
    try { if (document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); }
    catch { status.textContent = 'Full screen is unavailable in this browser. The photograph viewer remains open.'; }
  });
  document.addEventListener('fullscreenchange', () => { fullscreen.textContent = document.fullscreenElement ? 'Exit full screen' : 'Full screen'; });
}
dialog.addEventListener('cancel', event => { event.preventDefault(); closeViewer(); });
dialog.addEventListener('keydown', event => {
  if (event.key === 'Tab') {
    const buttons = [...dialog.querySelectorAll('button:not(:disabled)')].filter(button => button.getClientRects().length);
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }
  if (event.altKey || event.ctrlKey || event.metaKey) return;
  if (event.key === 'ArrowLeft') { event.preventDefault(); if (active > 0) show(active - 1); }
  if (event.key === 'ArrowRight') { event.preventDefault(); if (active < groups[groupIndex].photos.length - 1) show(active + 1); }
  if (event.key === 'Home') { event.preventDefault(); show(0); }
  if (event.key === 'End') { event.preventDefault(); show(groups[groupIndex].photos.length - 1); }
});
stage.addEventListener('touchstart', event => { swipeStart = event.touches.length === 1 ? [event.touches[0].clientX, event.touches[0].clientY] : null; }, { passive: true });
stage.addEventListener('touchend', event => {
  if (!swipeStart || !event.changedTouches.length) return;
  const dx = event.changedTouches[0].clientX - swipeStart[0], dy = event.changedTouches[0].clientY - swipeStart[1];
  if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
    if (dx < 0 && active < groups[groupIndex].photos.length - 1) show(active + 1);
    if (dx > 0 && active > 0) show(active - 1);
  }
  swipeStart = null;
}, { passive: true });
stage.addEventListener('touchcancel', () => { swipeStart = null; }, { passive: true });
dialog.addEventListener('close', () => {
  if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  request++; image.removeAttribute('src'); document.body.style.overflow = previousOverflow;
  overview.hidden = true; overviewToggle.setAttribute('aria-expanded', 'false');
  opener?.focus({ preventScroll: true });
});

function syncHistory() {
  const slug = location.hash.startsWith('#photo=') ? location.hash.slice(7) : '';
  let match;
  for (const [group, value] of groups.entries()) {
    const index = value.photos.findIndex(photo => encodeURIComponent(photoSlug(photo)) === slug);
    if (index >= 0) { match = [group, index]; break; }
  }
  if (match) openViewer(match[0], match[1], null, true);
  else if (dialog.open) dialog.close();
}
addEventListener('popstate', syncHistory);
syncHistory();

const menu = document.querySelector('.collection-menu');
document.addEventListener('click', event => { if (menu && !menu.contains(event.target)) menu.open = false; });
menu?.addEventListener('keydown', event => { if (event.key === 'Escape') { menu.open = false; menu.querySelector('summary').focus(); } });

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) {
      for (const link of document.querySelectorAll('.collection-jump a')) {
        if (link.hash === `#${entry.target.id}`) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      }
    }
  }, { rootMargin: '-15% 0px -65% 0px', threshold: 0 });
  document.querySelectorAll('.story').forEach(story => observer.observe(story));
}
