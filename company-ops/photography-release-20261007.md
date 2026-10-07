# Photography trust and performance release — 7 October 2026

**Authorisation:** Nikita instructed Codex to deploy the completed fixes after confirming publication rights for all current portfolio photographs.

**Source:** `master` commit `d6fcba0`; pushed to `origin/master` before deployment.

**Production:** Cloudflare Worker `askfortask`, version `ccbbf4ad-7e8c-4720-939f-b4d239824665`.

## Released changes

- Replaced the unsubstantiated returning-client statements with the verified My Soho Times role.
- Added 251 responsive 1200 px WebP variants and limited each portfolio page to one eager/high-priority image.
- Added a one-hour portfolio-image browser cache with 24-hour stale revalidation.
- Added portfolio-photo privacy, objection and removal information.
- Added the 38-story rights register and strict release gate; all current stories are cleared on Nikita's confirmation that clients discussed and approved portfolio publication.
- Captured the previously untracked live portfolio and its generator/checking source in Git.

## Pre-release verification

- `npm run check`: 42 tests, immutable asset checks, 289-reference image sitemap, 38-story rights audit and 29-page/26-indexable-route site audit passed.
- `npm run deploy:dry-run`: passed with 913 assets and the expected D1, static asset and contact-email bindings.
- Local portfolio browser QA passed all nine routes at 1440, 768 and 390 px, viewer/focus/history/touch flows and no-JavaScript fallback.

## Live verification

- 262 changed assets uploaded; 611 were already present.
- All 38 checked public text resources match local files byte-for-byte.
- Photography, portfolio, Events, Privacy, a representative 1200 px image and contact configuration returned HTTP 200 from `https://askfortask.co.uk`.
- The unsupported returning-client copy is absent; the My Soho Times role and portfolio privacy section are present.
- Portfolio and Events each expose one eager/high-priority image; the representative medium image returns `Cache-Control: public, max-age=3600, stale-while-revalidate=86400`.
- Live browser QA passed all nine portfolio routes at 1440, 768 and 390 px, including full-size image decoding, navigation, focus trap, Escape/focus return, browser Back, touch swipe, rotation and no-JavaScript fallback.
- Three live mobile Lighthouse Events runs scored 94/97/98 performance with median LCP 2.43 s; accessibility, best practices and SEO were 100 in all three. A live Portfolio run scored 98 with 2.1 s LCP and 100/100/100 for the other categories.
- `www` redirects to the apex while preserving path/query; an arbitrary missing route resolves to the branded HTTP 404.

## Boundaries

No database migration, form submission, D1 data change, DNS change, Search Console action or customer communication was performed. Client contracts/correspondence were not independently inspected; the rights register records Nikita's accountable owner confirmation. Real-user Core Web Vitals remain subject to field data.
