# Ask for Task website — independent trust and quality audit

**Audit date:** 23 September 2026, Europe/Athens

**Reviewer:** Independent AI Trust & Quality Reviewer

**Scope:** Current `master` release at commit `691f983` and the matching live site at `https://askfortask.co.uk`
**Decision:** **Not fully approved. Targeted remediation is required before the next release.** No critical or high-severity defect was found, but two medium findings remain reproducible.

No production change, form submission, database write, deployment, external message, or source-code fix was made during this audit.

## Findings

### M1 — The main contact form can create duplicate enquiries

- **Severity:** Medium
- **Affected area:** `/contact/`, `public/script.js:317-354`, `src/worker.js:822-912`
- **Evidence:** The guided assistant, review form, and professional form disable their submit controls while a request is pending. The main contact form does not. Each accepted request is inserted as a new D1 row and sent through Resend; unlike the other email paths, the contact email has no idempotency key.
- **Reproduction:** Complete the main contact form and trigger submit twice before the first request resolves, for example with a double click or a slow connection. Two `fetch("/api/contact")` calls can be started. The route's five-request rate limit does not deduplicate them.
- **Customer impact:** A customer can receive the impression that one enquiry was sent while the company receives duplicate records and duplicate notification emails. Retries after an uncertain network response can have the same effect.
- **Recommended fix:** Disable and relabel the main submit button before awaiting the request, restore it on failure, and add a request-level idempotency key enforced in storage and passed to Resend. Do not rely only on the client-side button state.
- **Verification required:** An automated pending-request double-submit test must observe exactly one database insert and one email attempt. A retry with the same key must return the original result without a second send.

### M2 — Pulse Point attribution conflicts with the Work page's own transparency promise

- **Severity:** Medium
- **Affected area:** `/ventures/`, `public/ventures/index.html:65-75` and `101-108`
- **Evidence:** The page says every relationship is labelled honestly and that each example states A4T Studio's role. DMAR is labelled “Family-connected client” and NK Sports “Specialist partner”. Pulse Point Events is only described as “an event brand reference”; it does not state whether it is owned, a client, a partner, family-connected, speculative, or what A4T Studio delivered.
- **Reproduction:** Open `/ventures/`, read the page promise, then compare the three “Business development in practice” entries.
- **Customer impact:** A reasonable customer cannot distinguish credited work from inspiration or association. This weakens the credibility of the entire proof page.
- **Recommended fix:** State the relationship, A4T Studio's exact role, what was delivered, and what can be independently inspected. If that cannot be substantiated, remove the example from the proof section.
- **Verification required:** Review the source evidence for the relationship and deliverables, then verify the public label and linked evidence match it without implying client work that did not occur.

### L1 — Photography carousel uses an invalid ARIA role/element combination

- **Severity:** Low
- **Affected area:** `/photography/`, `public/photography/index.html:110-130`
- **Evidence:** Lighthouse 13.5.0 reports “ARIA role should be appropriate for the element” for `<article role="tabpanel">`. The page scores 100 for conventional accessibility but 50 for agentic browsing; the other 16 indexable routes score 100.
- **Reproduction:** Run Lighthouse mobile against `/photography/` with the agentic-browsing category and inspect `agent-accessibility-tree`.
- **Recommended fix:** Use a neutral `<div role="tabpanel">` for each panel, or retain `<article>` and redesign the carousel semantics without overriding it with `tabpanel`.
- **Verification required:** Lighthouse agentic browsing must return 100, while keyboard Left/Right/Home/End navigation, selected state, focus, and hidden panels still work.

### L2 — Mobile image delivery remains oversized

- **Severity:** Low
- **Affected area:** Homepage work cards and Photography portfolio/aerial imagery
- **Evidence:** Lighthouse estimates about 409 KiB of avoidable image transfer on the homepage and 449 KiB on Photography. Examples include 1280-pixel website captures rendered around 380 pixels wide and a 2200-pixel aerial image rendered around 380 pixels wide.
- **Customer impact:** Extra transfer cost and slower loading on constrained mobile connections. Current scores remain good, so this is optimisation rather than a release blocker.
- **Recommended fix:** Generate responsive AVIF/WebP widths, add `srcset`/`sizes`, and keep JPEG only as a fallback where needed.
- **Verification required:** Repeat three mobile Lighthouse runs; confirm the image-delivery estimate falls materially without visible quality loss or broken fallbacks.

### L3 — Sitemap modification dates lag the content release

- **Severity:** Low
- **Affected area:** `public/sitemap.xml`
- **Evidence:** All 17 entries report `2026-09-08`, while commit `b567b97` changed public page copy and assets on 9 September 2026.
- **Customer/SEO impact:** Search engines receive a modification signal that does not describe the final published content date. It is not an indexing failure by itself.
- **Recommended fix:** Generate `lastmod` from the last meaningful content change for each canonical page; do not update it for every build if the content did not change.
- **Verification required:** Compare every sitemap date to the relevant content history and validate the live sitemap after release.

### L4 — Deployment toolchain is not pinned or auditable from the repository

- **Severity:** Low
- **Affected area:** `package.json`, `wrangler.jsonc`
- **Evidence:** There is no package lockfile and no declared Wrangler dependency. `npm audit` cannot run without a lockfile. The audit used Wrangler 4.118.0 while npm reported 4.136.3 current on 23 September. The Worker compatibility date is `2026-08-04`; current Cloudflare guidance recommends keeping it current.
- **Impact:** Two machines can validate or deploy with different tool versions, and dependency review cannot be reproduced from the repository.
- **Recommended fix:** Add Wrangler as a pinned dev dependency, commit the generated lockfile, run dependency review in CI, and advance the compatibility date only after tests pass against the newer runtime behavior.
- **Verification required:** A clean checkout must install deterministically, pass `npm audit`, all 40 tests, the site audit, and `wrangler deploy --dry-run` using the declared version.

## Page-completeness decision

The site does **not** contain structurally unfinished public pages. All 20 deployed HTML routes return the correct status and byte-match the repository. Every indexable page has a unique title and description, one H1, canonical URL, valid structured data where present, and working internal navigation. Each page also rendered without horizontal overflow or completed broken images at 390×844 and 1440×900.

The customer-facing weakness is proof depth, not page volume. Brand, app, website, and service pages contain substantial explanations and clearly mark hypothetical examples as illustrative, but they repeatedly depend on the same small evidence set: the owned Pinglo product, one family-connected DMAR project, the photography portfolio, and one writing partner. The next content investment should therefore be verified independent-client case studies and permissioned testimonials, not more general service copy.

### Recommended target order

1. **Contact flow and Worker** — correct M1 before driving more traffic.
2. **Work / Ventures** — correct Pulse Point attribution, then add one genuinely independent client result with an explicit role and evidence.
3. **Photography** — correct carousel semantics and ship responsive image variants.
4. **Homepage** — reuse the responsive work images and preserve current conversion structure.
5. **SEO/release controls** — automate meaningful sitemap dates and pin the deployment toolchain.

App Development, Website Development, Brand Development, Services, About, FAQ, and the two case studies do not need broad rewrites. Their next improvement should be additional substantiated proof, not more promises or illustrative scenarios.

## Passed controls

- `npm run check`: 40/40 tests passed; asset versions match; static audit passed for 20 HTML pages and 17 indexable routes.
- `git diff --check`: passed.
- `wrangler deploy --dry-run`: passed; no deployment occurred.
- Live release: all 20 HTML responses byte-match their repository files; the custom missing route returns 404; 41 unique internal page/asset targets returned expected statuses.
- Responsive rendering: all 20 routes at mobile and desktop widths had one H1, no document-width overflow, no completed broken images, correct mobile/desktop navigation, and no console warning or error in the rendered checks.
- Lighthouse mobile: all 17 indexable routes scored 100 for accessibility, best practices, and SEO. Sixteen scored 100 for agentic browsing; Photography is the exception recorded in L1.
- Performance: three homepage mobile runs scored 94, 99, and 100, with median LCP 1.70 s, TBT 0 ms, and CLS 0. Photography scored 98 with LCP 2.2 s, TBT 0 ms, and CLS 0. These are lab results, not field evidence.
- Security: restrictive live CSP, HSTS, framing protection, nosniff, referrer and permissions policies, no-store API responses, server-side size/type/value validation, D1 prepared statements, route/IP-hash rate limits, controlled outbound redirects, HTML escaping, PDF signature checks, and retention cleanup were verified. No actionable XSS, open redirect, secret exposure, or injection path was found.
- Factual checks: Companies House currently lists ASK FOR TASK LTD, number 14697408, as active at the address shown on the site; the Pinglo App Store listing is live and the `/go/` destination resolves to it. Personal biography and five-year experience statements remain owner-supplied claims rather than independently certified facts.

## Evidence gaps and limitations

- Google Search Console and Bing Webmaster Tools were not available, so actual index coverage, impressions, queries, crawl exclusions, and rich-result status are unverified. Public search results show several core pages, but that is not a substitute for console evidence.
- No genuine enquiry, review, or professional application was submitted. End-to-end receipt in D1 and the destination mailbox remains unverified in this audit.
- No CrUX/real-user Core Web Vitals data or representative INP population was available; lab scores must not be presented as field performance.
- A4T Studio name/trademark clearance was not independently verified.
- LinkedIn blocks automated checks; its public destination was not treated as independently verified.

## Release gate

Review and accept, reject, or reclassify M1 and M2 before implementation. After corrections, rerun the full test suite, 17-route Lighthouse categories, responsive render checks, live/local hashes, external destinations, and one explicitly authorised end-to-end enquiry test. Do not claim full approval until those checks pass.

## External references used

- [Companies House: ASK FOR TASK LTD](https://find-and-update.company-information.service.gov.uk/company/14697408)
- [Pinglo on the Apple App Store](https://apps.apple.com/gb/app/pinglo-lost-found/id6768083250)
- [Cloudflare Workers best practices](https://developers.cloudflare.com/workers/best-practices/workers-best-practices/)
- [Core Web Vitals thresholds](https://web.dev/articles/defining-core-web-vitals-thresholds)

## Remediation verification — 23 September 2026, 11:58 Athens

All six findings are corrected in the prepared release and verified locally. Production approval remains conditional on applying `0008_add_contact_idempotency.sql` before deploying the Worker; the migration has been tested only against the local D1 database.

- **M1 corrected:** both enquiry interfaces lock while pending and reuse a UUID submission key after uncertain failures. D1 stores that key under a unique index, notification state is recorded, and Resend receives the same idempotency key. A retry test verifies one stored enquiry and one email send.
- **M2 corrected:** Pulse Point Events has been removed from public proof, structured data, and the controlled outbound-link list because the relationship and delivery scope were not evidenced.
- **L1 corrected:** carousel panels now use neutral `div` elements with `role="tabpanel"`. Keyboard behavior is unchanged and Lighthouse no longer reports an incompatible ARIA role.
- **L2 corrected:** twelve responsive AVIF variants cover the audited homepage website captures and the principal Photography images. At 390 pixels, the Photography hero selects the 480-pixel AVIF. New mobile Lighthouse runs score 100 for performance on Home and Photography, with LCP 1.5 s and 1.6 s respectively and no responsive-image savings warning.
- **L3 corrected:** meaningful `lastmod` dates for Home, Photography, Work, and Contact are 23 September 2026; unchanged pages retain their prior dates.
- **L4 corrected:** Wrangler is pinned to 4.136.3 with a lockfile, the compatibility date is 23 September 2026, `npm audit` reports zero vulnerabilities, and the repository dry run succeeds.

Verification passed: 41 tests, the 20-page / 17-indexable-route site audit, immutable asset validation, `git diff --check`, local D1 migration and schema inspection, Wrangler dry run, desktop visual inspection, 390×844 Photography inspection with no horizontal overflow, and Lighthouse 100/100/100/100 for performance/accessibility/best-practices/SEO on Home and Photography. No production migration, deployment, or genuine form submission occurred during remediation.
