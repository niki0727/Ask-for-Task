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

Approved for commit, push, and deployment; not yet reported as deployed.
Production verification and release identifiers will be recorded after deployment.
