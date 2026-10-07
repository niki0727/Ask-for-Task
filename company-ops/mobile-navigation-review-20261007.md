# Phone navigation review — 7 October 2026

## Request

Nikita asked for a simple, modern and clear phone view that quickly explains A4T Studio, makes the menu and photography easy to find, and gives visitors logical routes through the site.

## Prepared changes

- Shortened the homepage first-screen description to name brand, websites, apps and photography directly.
- Added a phone-first exploration action and four compact route cards for Websites, Apps, Photography and Our work. At 320 × 568 px the first card row begins within the first screen.
- Labelled the mobile menu “Menu” / “Close”; placed Photography near the top; added direct Website development and App development links across 20 standard-site pages.
- Tightened the mobile menu so its nine destinations fit at 320 × 568 px. Touch opening avoids a distracting focus outline; keyboard opening moves focus into the menu, Escape returns it, and the rest of the page is inert while open.
- Refreshed versioned CSS and JavaScript references.

## Verification and limits

Local Chrome browser checks covered the homepage at 320, 375, 390, 430, 900, 901, 1024 and 1440 px with no horizontal overflow. Seven core routes passed 320 px menu opening, visible destinations, keyboard focus, Escape and inert-state checks. A menu click reached the Photography route. The Photography page leads to selected work and the full portfolio. Screenshots: `outputs/mobile-navigation-20261007/home-320-final.png`, `home-after.png`, `home-menu-320-final.png` and `photography-after.png`.

`npm run check` passed 42 tests, immutable asset references, the image sitemap, photography rights audit and the 29-page site audit. `npm run deploy:dry-run` packaged 913 assets with the expected bindings; `git diff --check` passed. These are local checks; no production deployment or field-user evidence is claimed.

**Owner/status/next action:** Codex owns the prepared candidate. Nikita reviews the phone presentation and decides on production release. No date committed. This work does not add a company priority.

## Production release

Nikita authorised deployment on 7 October 2026. Commit `9ab800e` was pushed to `origin/master` and deployed as Cloudflare Worker version `75d0f762-a530-4e70-80ef-686e9a4bcf88`; 31 changed assets were uploaded.

All 38 public text files matched the live apex byte-for-byte after deployment. Live Chrome checks passed at 320 × 568 and 390 × 844 px: zero horizontal overflow, visible Menu/Close labels, four homepage routes, all nine menu destinations, inert background content and successful navigation to Photography, selected work and the full portfolio. The `www` redirect, security headers and read-only contact binding configuration also passed.

**Current status:** Published and live-verified. Codex monitors genuine issues; Nikita owns future production decisions. No next release date is committed.
