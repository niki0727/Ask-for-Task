# Website release baseline

**As of:** 7 October 2026 (Europe/Athens). **Owner:** AI Head of Digital Product and Systems. **Status:** Read-only baseline verified for public text assets; no deployment candidate or release date committed.

## Source and production evidence

- Deployment source is `public/` plus `src/worker.js`, configured by `wrangler.jsonc`. Current Git branch is `master` at commit `0c4eb14` (23 September 2026), with substantial later uncommitted and untracked work retained.
- The latest production Worker version recorded in `company-ops/project-status.md` is `196be42c-3eff-4836-80cc-43fe750048fd` from 7 October. This review could not verify the Worker version through Cloudflare account access; treat it as a recorded release fact, not a fresh dashboard read-back.
- `node scripts/audit-live-parity.mjs` fetched all 38 deployable public text files (`.html`, `.css`, `.js`, `.xml`, `.txt`) on 7 October and matched each live response body to the local SHA-256. This includes all 26 indexed routes, the image sitemap, the site script and the two CSS layers. Exact results and hashes: `company-ops/release-parity-20261007.json`.
- The live `/api/contact-config` endpoint returned `ok: true` and all four configuration booleans true. This is a configuration check only; no form was submitted.
- Local `npm run check` passed 42 Worker tests, immutable asset versions, 289 image-sitemap references and the 29-page / 26-indexable-route site audit. `git diff --check` passed.

## Boundaries

The parity script does not compare the 585 binary/public files outside its text filter, deployed Worker source, D1 schema/data, secrets, Resend delivery or Cloudflare logs. The current Wrangler account could not run a read-only remote D1 query (Cloudflare code 7403), so remote migration state is unverified here. The same credentials may also limit deployment management; no attempt to deploy or change permissions was made.

Git HEAD is older than several documented production releases. Git status therefore does not identify the live release boundary on its own. Preserve the existing tree and do not stage or commit all paths as a proxy for deployment scope.

## Next-release manifest template

Complete this with exact paths and evidence for the next actual candidate:

| Field | Required entry |
| --- | --- |
| User outcome and approved scope | Specific requested change and reviewer |
| Changed source and generated files | Exact paths, build command and source-to-output mapping |
| Live baseline | Recorded Worker version, route hashes, binary assets and any D1 migration state |
| Local verification | Relevant tests, static audit, browser/responsive check and dry run |
| External dependencies | D1, Resend, DNS, Search Console, analytics and secrets affected, or explicitly none |
| Release and rollback | Approved deploy method, previous known-good version and route checks |
| Post-release evidence | Live route/API results, hashes, error logs and observed user outcome |

Production deployment, remote D1 migration, DNS/access changes and new data collection each require explicit action approval for a concrete candidate. No such candidate was produced by this review.
