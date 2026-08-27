# A4T Studio release audit

**Date:** 27 August 2026
**Scope:** Local release candidate only. No production deployment was audited or changed.
**Original verdict:** **Hold for a short consistency correction.** The findings below are retained as the original audit record.

## Remediation verified — 27 August 2026 (Europe/Athens)

**Current state:** All five content, schema, and architecture findings are corrected locally. The manual name check and explicit release approval remain outstanding. Nothing was committed, pushed, deployed, or submitted to a search engine.

- Open Graph and Twitter titles/descriptions now match the current page metadata. DMAR is explicitly family-connected, app delivery is scoped in stages, and contact/recruitment previews no longer advertise ESG.
- ESG was removed from new professional-profile choices and Worker validation. Existing stored applications are untouched.
- Organization `sameAs` now identifies the legal company only. Founder profiles belong to `Person`; Pinglo has its own `MobileApplication` identity and company publisher reference across the homepage and case study.
- Design deliverables and handover guidance are in Brand Development. Company milestones are in an expandable, vertical About timeline. Limited evidence-led communication guidance sits under commercial direction, with a clear qualified-adviser boundary.
- The three retired HTML pages are preserved outside the deployment source in `archive/legacy-site/consolidated-20260827/`. Their old clean, slash, `.html`, and `/index.html` URLs redirect to the relevant page and anchor. Internal links and sitemap entries use the new destinations.
- The audit now checks share-copy alignment, company identity boundaries, redirect destination anchors, and internal page anchors. Updated script and stylesheet URLs prevent reuse of the previous immutable cached versions.

### Verification

- `npm run check`: 40 tests passed; static audit passed 20 HTML pages / 17 indexable routes.
- Local Worker: all 12 legacy URL aliases returned 301, preserved query parameters, and resolved to HTTP 200 without another redirect. `/404`, `/404/`, `/404.html`, and a missing page all returned HTTP 404 without a loop.
- Browser: all 20 pages checked at 390×844 and 1440×900; one H1 each, no horizontal overflow, and no broken loaded images in the initial viewport. This is a layout check, not a full accessibility certification or field-performance measurement.
- Visual and interaction checks: About timeline and design disclosure open/close correctly; legacy History and Responsible Growth links reveal their destination disclosures. Desktop and mobile timeline screenshots checked after the vertical-layout correction.
- `git diff --check` and `npx wrangler deploy --dry-run` pass. The dry run reads 112 assets; no upload or deployment occurs. No live form was submitted.

**Next action:** Nikita Piazenko to complete the manual UK IPO/name check and review the candidate before separately authorising Git and production actions. No release date is committed.

## Findings

### High — the narrowed offer and the indexed site still disagree

The homepage and services page now lead with brand, website, app, and photography work, but `/responsible-growth/` remains indexable and in the sitemap. ESG also remains in contact social metadata, the professional-network metadata/schema/form, and the history promise. A visitor or search engine can still conclude that ESG is a core A4T Studio service even though the conversion work deliberately removed it from the main offer.

**Evidence:** `public/responsible-growth/index.html`, `public/sitemap.xml`, `public/contact/index.html`, `public/professionals/index.html`, `public/history/index.html`, and `src/worker.js`.

**Recommendation:** remove ESG from active contact/recruitment metadata and project choices; merge any defensible responsible-growth guidance into a supporting service section; redirect or noindex the standalone route after a deliberate URL decision.

### High — DMAR’s relationship is contradicted in share metadata

The search description correctly calls DMAR family-connected, while the Twitter description calls it an “independent marine consultancy website.” The company itself may be independent, but that wording beside a case study can reasonably be read as independent-client proof. This weakens the otherwise careful disclosure.

**Evidence:** `public/case-studies/dmar-international/index.html:7` and `:24`.

**Recommendation:** use the same family-connected relationship language in HTML, Open Graph, Twitter, schema, and every work card.

### Medium — app social metadata advertises an offer that was removed

The visible app page now uses honest scoped stages, but its Twitter description still promises “app onboarding, launch builds, and six-month development partnerships.” A shared link could therefore revive the fixed-package language removed during the conversion correction.

**Evidence:** `public/app-development/index.html:22-23`.

**Recommendation:** make Open Graph and Twitter title/description match the new product-definition, prototype, build, launch, and support model.

### Medium — Organization `sameAs` mixes the company with its founder and product

The Organization graph lists Companies House, Nikita’s personal LinkedIn, Nikita’s photography Instagram, and the Pinglo App Store page as equivalent identities. `sameAs` should point to pages that unambiguously represent the same organization. The founder profiles belong on the `Person`; Pinglo should be modelled as an owned product or subject, not as the company itself.

**Evidence:** `public/index.html:41-46`.

**Recommendation:** keep Companies House and a future official A4T Studio profile in Organization `sameAs`; retain founder links on `Person`; connect Pinglo through an ownership or product relationship.

### Medium — the site architecture is still larger than the proof base

Standalone Design duplicates Brand Development, History duplicates the stronger About timeline, and Responsible Growth has no delivered case study. These pages add upkeep and broaden search intent without adding equal evidence.

**Evidence:** `/design/`, `/history/`, `/responsible-growth/`, and `full-site-inspection-20260827.md`.

**Recommendation:** merge the useful material into Brand Development and About, then preserve old URLs with explicit redirects.

### Release dependency — A4T Studio is not yet recorded as legally cleared

The repository records a clear Nominet result, but the official UK IPO search could not be completed because of its security check. This does not prove the name is unavailable; it means the release candidate should not be described as legally cleared.

**Evidence:** `company-ops/a4t-studio-rollout.md`.

## What passed

- 36 Worker tests passed.
- Static audit passed 23 HTML pages and 20 indexable routes.
- `git diff --check` passed.
- Twelve core routes passed at 1440×900 and 390×844 with no horizontal overflow and no missing visible images.
- Mobile navigation appeared at the expected breakpoint; desktop navigation remained visible.
- Checked pages contained one clear H1, no duplicate IDs, and no heading-level jumps.
- Contact budget options, guided assistant options, Worker validation, and the public £50,000 ceiling agree.
- The 404 regression, form rate limits, CV validation, security headers, redirect controls, and retention tests passed.

## Positive assessment

The first screens now read as one company. The visual language is consistent, the mobile typography is controlled, proof appears earlier, and the founder-led offer is much easier to understand. The remaining work is a focused consistency correction, not another redesign.

## Recommended release order

1. Correct the DMAR, app, contact, professional-network, history, and schema inconsistencies.
2. Decide the merge/redirect treatment for Design, History, and Responsible Growth.
3. Complete and record the manual UK IPO check.
4. Rerun the automated and responsive checks.
5. Review, commit, push, and deploy only with explicit approval.
