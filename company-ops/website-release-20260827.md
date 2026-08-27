# A4T Studio website release - 27 August 2026

Timezone: Europe/Athens.

## Authorisation and scope

- Nikita explicitly requested "deploy and push" after reviewing the local candidate.
- Scope: the A4T Studio website, conversion and metadata updates, consolidated
  routes, regression checks, and related website documentation.
- Unrelated outreach records and mixed operational-file changes are left out of
  this release commit and preserved locally.
- No DNS changes, database migrations, customer messages, Google profile changes,
  purchases, or reindex requests are part of this release.

## Preflight

- Local branch `master` matches `origin/master` at `d1f9ee7` before the release.
- `npm run check`: 40 tests; 20 HTML pages and 17 indexable routes pass.
- `git diff --check`: passes.
- `npx wrangler deploy --dry-run`: passes; 112 static assets.
- Desktop/mobile and local redirect evidence: `release-audit-20260827.md`.

## Open name-check risk

The manual UK IPO check remains incomplete. The latest deployment instruction
authorises publishing the candidate, but is not evidence of trademark clearance.
Nikita owns this follow-up; no completion date is committed. Earlier rollout
documents retain the original pre-release recommendation as historical context.

## Delivery state

Deployed and live-verified on 27 August 2026.

- Website commit: `e1c55e3` (`feat: launch A4T Studio positioning and audited website`).
- Pushed to `origin/master` in `niki0727/Ask-for-Task`.
- Cloudflare Worker: `askfortask`.
- Deployment version: `e7e57f7e-69f6-468c-9480-6e689903064e`.
- Previous version: `2cfc9a0b-ea27-43dc-8398-543ca0becb64`.
- Wrangler read 112 assets and uploaded 30 new or changed files.
- Live domain: https://askfortask.co.uk/

## Live verification

- All 20 HTML pages match the release files byte-for-byte. Public and private
  utility pages return 200; the custom error page returns 404.
- All 12 retired page aliases return 301 with the correct target and query.
- `/404`, `/404/`, `/404.html`, and a nonexistent path return 404 without a loop.
- `www` redirects to the apex domain. Security headers are present on all checked
  HTML responses, and the new social image returns 200 with the correct MIME type.
- Contact configuration reports Resend, sender, recipient, and database configured.
  No real contact, review, or professional application was submitted; this confirms
  configuration, not end-to-end receipt of a new email.
- Homepage, About timeline, and Contact pass live layout checks at 1440x900 and
  390x844 without horizontal overflow or missing loaded images in the viewport.
  The timeline disclosure opens from its anchor; mobile Contact was inspected visually.

## Next action

Owner: Nikita Piazenko. Complete the manual name check and monitor genuine
enquiries and Worker errors. No next release date is committed. Search Console,
Google profile, DNS, database contents, and external social profiles were not changed.
