const storyDialog = document.querySelector('.nightlife-dialog');
const storyOpen = document.querySelector('.nightlife-open');

if (storyDialog && storyOpen && typeof storyDialog.showModal === 'function') {
  const slides = [...storyDialog.querySelectorAll('[data-story-slide]')];
  const steps = [...storyDialog.querySelectorAll('[data-story-step]')];
  const previous = storyDialog.querySelector('.nightlife-prev');
  const next = storyDialog.querySelector('.nightlife-next');
  const position = storyDialog.querySelector('.nightlife-position');
  let current = 0;
  let startX = 0;
  let startY = 0;

  const show = (index) => {
    current = Math.max(0, Math.min(slides.length - 1, index));
    slides.forEach((slide, i) => { slide.hidden = i !== current; });
    steps.forEach((step, i) => {
      if (i === current) step.setAttribute('aria-current', 'step');
      else step.removeAttribute('aria-current');
    });
    previous.disabled = current === 0;
    next.disabled = current === slides.length - 1;
    position.textContent = `${current + 1} of ${slides.length}`;
    slides[current + 1]?.querySelector('img')?.setAttribute('loading', 'eager');
  };

  storyOpen.hidden = false;
  storyOpen.addEventListener('click', () => {
    show(0);
    storyDialog.showModal();
    slides[0]?.querySelector('img')?.setAttribute('loading', 'eager');
  });
  storyDialog.querySelector('.nightlife-close').addEventListener('click', () => storyDialog.close());
  storyDialog.addEventListener('close', () => storyOpen.focus());
  previous.addEventListener('click', () => show(current - 1));
  next.addEventListener('click', () => show(current + 1));
  steps.forEach((step, index) => step.addEventListener('click', () => show(index)));
  storyDialog.addEventListener('keydown', (event) => {
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      show(current + (event.key === 'ArrowRight' ? 1 : -1));
    } else if (event.key === 'Home' || event.key === 'End') {
      event.preventDefault();
      show(event.key === 'Home' ? 0 : slides.length - 1);
    }
  });
  const stage = storyDialog.querySelector('.nightlife-stage');
  stage.addEventListener('touchstart', (event) => {
    startX = event.changedTouches[0].screenX;
    startY = event.changedTouches[0].screenY;
  }, { passive: true });
  stage.addEventListener('touchend', (event) => {
    const changeX = event.changedTouches[0].screenX - startX;
    const changeY = event.changedTouches[0].screenY - startY;
    if (Math.abs(changeX) > 48 && Math.abs(changeX) > Math.abs(changeY) * 1.4) {
      show(current + (changeX < 0 ? 1 : -1));
    }
  }, { passive: true });
}
