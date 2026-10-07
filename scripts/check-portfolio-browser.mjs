import fs from 'node:fs';
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || '/Users/nikitapiazenko/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs');
const origin = process.env.PORTFOLIO_ORIGIN || 'http://127.0.0.1:8787';
const out = 'outputs/portfolio-audit-20261005';
fs.mkdirSync(out, { recursive: true });
const browser = await chromium.launch({ headless: true, channel: 'chrome' });
const report = { origin, checkedAt: new Date().toISOString(), routes: [], interactions: [], errors: [] };
const routes = ['', 'events/', 'hospitality/', 'people/', 'sport/', 'aerial/', 'products/', 'streets/', 'travel/'];
try {
  for (const viewport of [{ width: 1440, height: 1000 }, { width: 768, height: 1024 }, { width: 390, height: 844 }]) {
    const context = await browser.newContext({ viewport, isMobile: viewport.width < 641, hasTouch: viewport.width < 641, deviceScaleFactor: 1 });
    const page = await context.newPage();
    page.on('pageerror', error => report.errors.push(String(error)));
    page.on('console', message => { if (message.type() === 'error' && /Content Security|Refused to/.test(message.text())) report.errors.push(message.text()); });
    for (const route of routes) {
      const response = await page.goto(`${origin}/portfolio/${route}`);
      assert.equal(response.status(), 200);
      await page.waitForSelector('[data-layout-ready]');
      await page.locator('.photo img').first().evaluate(image => image.decode());
      const metrics = await page.evaluate(async ({ decodeAll }) => {
        const photos = [...document.querySelectorAll('.photo')];
        const failures = [];
        if (decodeAll) await Promise.all(photos.map(async photo => {
          const image = new Image(); image.src = photo.href;
          try { await image.decode(); } catch { failures.push(photo.href); }
        }));
        const jumpLinks = [...document.querySelectorAll('.collection-jump a')];
        return {
          overflow: document.documentElement.scrollWidth > innerWidth + 1,
          photos: photos.length,
          broken: failures,
          brand: document.querySelector('.brand').getAttribute('href'),
          back: document.querySelector('.back')?.getAttribute('href'),
          badJumps: jumpLinks.filter(a => !document.getElementById(a.hash.slice(1))).length,
          badRatios: photos.filter(photo => { const img = photo.querySelector('img'), rect = img.getBoundingClientRect(); return rect.width > 0 && Math.abs(rect.width / rect.height - Number(photo.dataset.ratio)) > .02; }).map(p => p.dataset.key),
          firstImageTop: photos[0].getBoundingClientRect().top,
        };
      }, { decodeAll: viewport.width === 1440 });
      assert.equal(metrics.overflow, false, `${route} ${viewport.width}: page overflow`);
      assert.equal(metrics.brand, '/portfolio/');
      if (route) assert.equal(metrics.back, '/portfolio/');
      assert.equal(metrics.badJumps, 0); assert.deepEqual(metrics.badRatios, []); assert.deepEqual(metrics.broken, []);
      report.routes.push({ route, viewport: viewport.width, ...metrics });
      if ([1440,390].includes(viewport.width) && ['', 'events/', 'people/', 'travel/', 'streets/'].includes(route)) await page.screenshot({ path: `${out}/${route.replace('/', '') || 'home'}-${viewport.width}.png` });
    }
    await page.goto(`${origin}/portfolio/`);
    assert.equal(await page.locator('a[href="/portfolio/events/"] img').first().getAttribute('alt'), 'Two guests smiling and dancing beside the COODIE DJ desk');
    assert.equal(await page.locator('a[href="/portfolio/products/"] img').first().getAttribute('alt'), 'A polished circular object catches a clean arc of light against dark wood.');
    assert.equal(await page.locator('a[href="/portfolio/personal/"]').count(), 0);
    await page.locator('.service-grid a[href="/portfolio/people/"]').click();
    assert.equal(new URL(page.url()).pathname, '/portfolio/people/');
    assert.equal(await page.locator('#curonian-portraits .photo').count(), 4);
    await page.goto(`${origin}/portfolio/personal/`);
    assert.equal(new URL(page.url()).pathname, '/portfolio/people/');
    assert.equal(new URL(page.url()).hash, '#curonian-portraits');
    await page.goto(`${origin}/portfolio/events/`);
    assert.equal(await page.locator('#project-0 .photo').count(), 6);
    assert.equal(await page.locator('[data-key="fresh-0543"]').count(), 0);
    assert.equal(await page.locator('#project-8 .photo').count(), 25);
    assert.equal(await page.locator('#project-8 [data-key="07"]').count(), 0);
    for (const id of ['7685', '7852', '8070', '8215', '8364', '8504', '8821']) {
      assert.equal(await page.locator(`#project-8 [data-key="vilnius-${id}"]`).count(), 1, `Missing requested Vilnius frame ${id}`);
    }
    for (const id of ['7118', '7711', '8262', '8308']) {
      assert.equal(await page.locator(`#project-8 [data-key="vilnius-${id}"]`).count(), 1, `Missing new District/Gallery frame ${id}`);
    }
    const first = page.locator('.photo').first();
    await first.click();
    await page.waitForSelector('#viewer[open]');
    await page.waitForFunction(() => document.querySelector('.viewer-stage').getAttribute('aria-busy') === 'false');
    assert.equal(await page.locator('#viewer-title').innerText(), 'COODIE · Café session');
    assert.equal(await page.locator('#previous-photo').isDisabled(), true);
    await page.keyboard.press('ArrowRight');
    assert.equal(await page.locator('#viewer-position').innerText(), '2 / 6');
    await page.locator('#toggle-overview').click();
    await page.locator('#viewer-overview button').nth(4).click();
    assert.equal(await page.locator('#viewer-position').innerText(), '5 / 6');
    await page.keyboard.press('End');
    assert.equal(await page.locator('#next-photo').isDisabled(), true);
    assert.equal(await page.locator('#next-story').isVisible(), true);
    await page.locator('#next-story').click();
    assert.equal(await page.locator('#viewer-title').innerText(), 'Bubba Oasis');
    assert.equal(await page.locator('#viewer-position').innerText(), '1 / 12');
    await page.locator('#toggle-overview').click();
    await page.waitForFunction(() => document.querySelector('.viewer-stage').getAttribute('aria-busy') === 'false');
    await page.screenshot({ path: `${out}/viewer-${viewport.width}.png` });
    if (viewport.width === 1440) {
      await page.locator('#fullscreen-viewer').click();
      await page.waitForFunction(() => !!document.fullscreenElement);
      await page.locator('#fullscreen-viewer').click();
      await page.waitForFunction(() => !document.fullscreenElement);
    }
    for (let i = 0; i < 12; i++) { await page.keyboard.press('Tab'); assert.equal(await page.evaluate(() => document.getElementById('viewer').contains(document.activeElement)), true); }
    await page.keyboard.press('Escape');
    await page.waitForFunction(() => !document.getElementById('viewer').open);
    assert.equal(await page.evaluate(() => document.activeElement === document.querySelector('.photo')), true);
    await first.click();
    await page.goBack();
    await page.waitForFunction(() => !document.getElementById('viewer').open);
    assert.equal(new URL(page.url()).pathname, '/portfolio/events/');
    if (viewport.width === 390) {
      await first.click();
      const session = await context.newCDPSession(page);
      await session.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: 330, y: 420 }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 180, y: 420 }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: 60, y: 420 }] });
      await session.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      assert.equal(await page.locator('#viewer-position').innerText(), '2 / 6');
      await page.setViewportSize({ width: 844, height: 390 });
      await page.waitForTimeout(180);
      assert.equal(await page.locator('#viewer').isVisible(), true);
      await page.keyboard.press('Escape');
    }
    report.interactions.push({ viewport: viewport.width, pass: true, checks: 'open, arrow keys, overview jump, set boundary, next story, focus trap, Escape, focus return, browser Back' + (viewport.width === 390 ? ', actual touch swipe, rotation' : '') });
    console.log(`${viewport.width}px: all 9 routes and viewer interactions passed.`);
    await context.close();
  }
  const nojs = await browser.newContext({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } });
  const page = await nojs.newPage(); await page.goto(`${origin}/portfolio/people/`);
  assert.equal(await page.locator('.photo').count(), 28);
  assert.equal(await page.locator('.view-story').first().isVisible(), false);
  await page.locator('.collection-menu summary').click(); assert.equal(await page.locator('.collection-menu nav').isVisible(), true);
  await nojs.close(); report.interactions.push({ noJavaScript: true, pass: true });
  assert.deepEqual(report.errors, []);
  report.passed = true;
} catch (error) {
  report.passed = false; report.failure = String(error); console.error(error); process.exitCode = 1;
} finally {
  fs.writeFileSync(`${out}/browser-qa.json`, JSON.stringify(report, null, 2));
  await browser.close();
}
