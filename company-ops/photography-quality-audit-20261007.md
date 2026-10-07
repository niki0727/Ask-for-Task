# Independent photography trust and quality audit — 7 October 2026

**Reviewed:** 7 October 2026, Europe/Athens

**Scope:** Live `/photography/`, `/portfolio/` and the eight linked portfolio collections; current local generators, assets and release records.

**Decision:** **Not approved as a clean release baseline.** The customer-facing experience is working and the main Photography page performs well, but two high-severity release-control gaps and two medium findings require review. This audit did not edit production, remove photographs, commit, push, migrate a database or deploy.

## Findings, ordered by severity

### H1 — Public people and event photographs do not have a completed rights/permission record

- **Affected:** The live portfolio, especially identifiable people in `/portfolio/events/` and `/portfolio/people/`.
- **Evidence:** The 29 September v14 and v15 review records explicitly say that `rights/consent` checks remained open. The later publication records show owner authorisation to publish and subsequent curation decisions, but no evidence closes that earlier gate or records the applicable contract, subject release, venue/client authority, privacy assessment or lawful basis. Publication authorisation is not itself evidence of those underlying rights. The public privacy notice does not explain portfolio-image processing. This is an evidence gap, not a finding that every image lacks a valid basis.
- **Risk:** ASK FOR TASK LTD cannot presently demonstrate why each identifiable image may be used publicly for portfolio marketing or how an objection/removal request would be handled. Current ICO guidance says personal information requires a lawful basis; relying on legitimate interests requires a necessity and balancing assessment against the person's rights and reasonable expectations: https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/lawful-basis/a-guide-to-lawful-basis/legitimate-interests/.
- **Reproduction:** Read `company-ops/project-status.md` entries for 29 September publication and the 25/29 September review gates, then search `company-ops/decisions.md` for rights/consent. The record preserves the open gate and owner publication decisions but not its closure.
- **Recommended action:** Build an image/story rights register covering source, ownership, commissioned purpose, client/venue permission, identifiable subjects, minors/sensitive contexts, intended portfolio use, lawful basis, restrictions, evidence location and removal contact. Review the highest-risk people/nightlife stories first. If evidence cannot be established for an image, hold it from the public build pending a documented decision. Obtain legal advice where the basis is uncertain.
- **Verification required:** A reviewer can trace every published people/event story to evidence and an approved basis; the privacy information and removal process match the chosen basis; affected images are either cleared or absent from the generated public build. Nikita owns the factual rights decisions. No completion date is committed.

### H2 — The live photography release is not recoverable from the Git baseline

- **Affected:** Current Photography page, all portfolio routes and their generated assets.
- **Evidence:** `HEAD`, `origin/master` and `origin/HEAD` are all `0c4eb14`, while `public/photography/index.html` is modified and `public/portfolio/`, `public/image-sitemap.xml`, `public/photography/nightlife-story.js` and the portfolio build scripts are untracked. `public/portfolio/` contains 533 files / 77 MB. A fresh 7 October parity check found all 38 checked live text resources identical to the dirty local tree, showing that production contains the changes while the remote repository does not.
- **Risk:** Loss of this workstation or an accidental clean checkout would remove the source of the current live release. A teammate or CI system cannot reproduce, audit or safely roll back the production site from `master`. The next deployment can also unintentionally mix already-live and still-prepared files.
- **Reproduction:** Run `git status --short`, `git log -1 --oneline --decorate`, then `node scripts/audit-live-parity.mjs`. Compare the untracked portfolio with `origin/master`.
- **Recommended action:** Preserve the worktree, classify all local changes as live, prepared or unrelated, then create a reviewed release commit or equivalent protected source snapshot containing the exact live generator inputs and public output. Include a manifest, Worker version, asset count, tests and rollback route. Do not blindly commit the whole dirty tree.
- **Verification required:** A clean checkout of the approved revision reproduces the 38 live text-resource hashes and required portfolio assets; `npm run check` and portfolio browser QA pass from that checkout; the release record identifies the deployed revision. Codex can prepare the baseline; Nikita approves any push. No date is committed.

### M1 — “Returning clients” is a prominent commercial proof claim without auditable support

- **Affected:** `public/photography/index.html:93` and `:187`.
- **Evidence:** The hero says “Professional work for returning clients” and the profile says “Many clients return for further assignments.” `company-ops/decisions.md` records this as an owner-supplied, unquantified statement rather than a testimonial. The linked My Soho Times profile supports the age-11, professional-history and in-house-photographer statements, but not the returning-client claim.
- **Customer impact:** Repetition in the hero and profile makes the statement function as trust evidence. Without booking or client records, an independent reviewer cannot approve “many” or the implied recurrence rate.
- **Recommended action:** Either retain private evidence showing multiple distinct repeat clients and define the period/count used, or replace both occurrences with a factual statement supported by the My Soho Times profile and portfolio.
- **Verification required:** The wording traces to dated records without exposing client-confidential information, or the unsupported quantifier is absent from active copy and metadata.

### M2 — Linked portfolio pages have inconsistent and sometimes poor mobile LCP

- **Affected:** `/portfolio/` and image-heavy collections such as `/portfolio/events/`; the main `/photography/` page itself is not the problem.
- **Evidence:** Three Lighthouse mobile runs gave `/portfolio/` scores of 76, 81 and 81, with median LCP 5.0 s and about 1,428 KiB transferred. `/portfolio/events/` scored 76, 97 and 76, with median LCP 6.6 s and about 2,305 KiB transferred. The generated portfolio index marks three images eager; Events marks five eager, although `scripts/portfolio/refine.mjs:191` intends only two eager images on collection pages. Portfolio images return `Cache-Control: public, max-age=0, must-revalidate`; `public/_headers` only gives long caching to `/assets/*`, CSS and JavaScript. Main `/photography/` scored 99 with 2.1 s LCP, 0 CLS, accessibility 100, best practices 100 and SEO 100.
- **Customer impact:** Visitors who follow “View selected work” can wait several seconds for the most important portfolio content even though the service page feels fast. Results vary because multiple eager full-resolution candidates compete on image-heavy pages.
- **Recommended action:** Fix the generator so only the visible LCP candidate is high priority and at most the genuinely above-fold companion is eager; generate an intermediate responsive width between the small and 1277–1920 px originals; apply a deliberate portfolio-image cache policy, using fingerprinted URLs before `immutable`; rerun the generator rather than hand-editing one-line output.
- **Verification required:** At least three cold mobile Lighthouse runs per target route have median LCP at or below 2.5 s, no regression in image quality or gallery behavior, no broken images and repeat-navigation caching behaves as documented. Confirm with field data when available; lab results alone do not establish real-user Core Web Vitals.

## What passed

- `npm run check`: 42/42 tests, immutable asset versions, 289 image-sitemap references and the 29-page / 26-indexable-route site audit passed.
- Live/local text parity: 38/38 checked resources matched.
- Portfolio browser QA passed all nine portfolio routes at 1440, 768 and 390 px, including image decoding, anchors, viewer open/close, arrow navigation, overview, story boundaries, focus trap, Escape/focus return, browser Back, mobile swipe/rotation and no-JavaScript fallback.
- Live desktop and 390 px visual inspection found no horizontal overflow or browser console warnings/errors. The Photography nightlife dialog opened, advanced and returned focus correctly.
- Automated mobile Lighthouse accessibility, best-practices and SEO scores were 100 on the sampled Photography, portfolio and Events pages. This is useful coverage, not full WCAG, legal or search-ranking approval.
- Pricing, durations, booking payment, delivery and rescheduling language are internally consistent with the current Terms and recorded owner decisions.
- The linked My Soho Times profile supports Nikita's professional-photography history and in-house events/editorial/lifestyle role: https://mysohotimes.co.uk/nikita-piazenko/.

## Review decision and target order

1. Close or act on the image-rights evidence gap before adding more public people/event work.
2. Capture the exact live Photography/portfolio release in a reviewed, reproducible source baseline.
3. Substantiate or revise the returning-client claim.
4. Correct the portfolio generator's eager-loading output and responsive image delivery, then retest performance.

**Status:** Findings prepared for Nikita's review. No fix, takedown or production action is authorised by this audit. The working live experience should not be described as broken; the release should not be described as fully cleared or reproducible until H1 and H2 are verified.

## 7 October remediation update — prepared locally

- **H1 partially controlled, not closed:** Added `company-ops/photography-rights-register.json` with all 38 published stories explicitly marked `review_required`, a structural audit, and a strict deployment gate. `npm run deploy:dry-run` now stops until every published story is cleared or held. Added prepared Privacy Policy wording for identifiable portfolio images, objections and removal requests. The wording and register must not be deployed as a claim of completed clearance until Nikita supplies and verifies the applicable evidence.
- **H2 prepared for source capture:** The current public portfolio, generator, checks and audit records are assembled as one local candidate. A local source commit can preserve the exact candidate, but the remote-baseline finding remains open until an approved push makes it recoverable from the shared repository.
- **M1 corrected locally:** Removed both returning-client claims. The hero now uses the independently supported My Soho Times role.
- **M2 corrected locally:** Normalised every portfolio page to one eager/high-priority image, added 251 responsive 1200 px WebP variants, fixed the generator cleanup parser so it preserves every `srcset` candidate, and added a one-hour browser cache with 24-hour stale revalidation for portfolio images. Three local mobile Lighthouse runs produced median LCP 2.208 s / score 98 on `/portfolio/` and 2.505 s / score 97 on `/portfolio/events/`, down from 5.0 s and 6.6 s respectively. Both retained 100 accessibility, best-practices and SEO scores.
- **Regression evidence:** Forty-two tests, immutable asset checks, the 289-reference image sitemap, rights-register coverage and the 29-page/26-indexable-route audit pass. Live-style local browser QA passes all nine portfolio routes at 1440, 768 and 390 px, including full-image decoding, responsive layout, viewer navigation, focus, browser Back, touch swipe, rotation and no-JavaScript fallback. No production deployment was performed.
