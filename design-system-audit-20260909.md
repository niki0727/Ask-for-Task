# A4T Studio — current visual language audit

**Status:** P2 findings implemented, deployed, and live-verified

**Audit date:** 9 September 2026, 12:36 Athens

**Live snapshot:** commit `b567b97`; Cloudflare Worker version `54891c63-cea0-4621-903b-1ec7cde0f36c`

**Scope:** Current `public/` source, live desktop and 390px mobile routes, internal links and images, computed contrast and target checks, stylesheet structure, and a desktop performance trace

## Executive outcome

The current site is release-ready, visually coherent, and commercially credible. The light blue/lime identity, editorial structure, restrained shapes, real work, and founder-led language now behave as one recognisable system. No critical visual, responsive, accessibility, routing, or desktop-performance defect was verified.

The next design pass should not redesign the site. It should reduce the cost of maintaining the system, make work screenshots more consistently inspectable, and remove avoidable image weight. The four recommended actions below preserve the current appearance.

## Current visual language

- **Objective:** Present A4T Studio as a clear, accountable, founder-led partner that can turn an uncertain brief into a defined and delivered result.
- **Visual idea:** A calm light canvas carries dark editorial typography, blue actions, lime signals, fine rules, numbered routes, and visible work. Dark navy is reserved for concentrated proof and trust rather than becoming a second global theme.
- **System:** The implemented token layer, system-sans type, compact radii, restrained shadows, editorial grids, proof cards, accordions, fact strips, and a stable primary action form a credible minimal vocabulary.
- **Required assets:** Existing SVG mark, social lockup, founder portrait, photography library, and current Pinglo/DMAR/project captures are sufficient. A consistent set of responsive next-generation website screenshots would improve delivery; no new decorative illustration library is needed.
- **Responsive behaviour:** Desktop compositions collapse cleanly to one-column mobile layouts; navigation becomes a labelled menu; headings scale without crowding; images preserve dimensions; and no checked route produced horizontal overflow.
- **Implementation notes:** Keep `public/` as the only source of truth. Improve component ownership and asset delivery inside the existing system; do not append another dated override layer or change production without a separately authorised implementation pass.

## Findings

| Priority | Finding | Evidence and impact | Recommended action |
| --- | --- | --- | --- |
| P2 | Active CSS is expensive to own | Every page loads three layers totalling 10,503 lines and 188,742 uncompressed bytes: `a4t-system.css`, `a4t-evolution-20260724.css`, and `a4t-polish-20260805.css`. A rough inventory found about 1,767 selectors. Runtime performance is already excellent, so the cost is change risk and unclear component ownership rather than page speed. | Consolidate one component family at a time into documented ownership, remove proven-dead selectors with route coverage, and retire obsolete deployed legacy CSS assets. Preserve rendered output throughout. |
| P2 | One existing image optimisation is not used consistently | `event-dj.avif` is about 52 KB while its JPG fallback is about 268 KB. Photography uses the efficient `<picture>` treatment, but Home, About, and Ventures request the JPG directly. That is about 216 KB of avoidable transfer whenever the lazy image is loaded on each affected page. | Reuse the existing AVIF/JPG `<picture>` pattern in those three placements. Keep dimensions, crop, alt text, and lazy loading unchanged. |
| P2 | Website proof has two crop rules | Pinglo presents an inspectable 16:9 interface capture. The DMAR case hero uses a tall cover crop that removes much of the interface, making the evidence harder to assess. Cover is appropriate for photography but less useful for interface proof. | Add one `website-proof` media rule using a stable 16:9 frame and `object-fit: contain`; reserve `cover` for editorial photography. Produce responsive AVIF/WebP variants for larger screenshots when regenerated. |
| P2 | Immutable asset versioning is manual | CSS, JS, and assets are cached for one year as immutable. Nineteen pages reference `a4t-polish-20260805.css?v=20260827-audit-v1`, while Pinglo uses a newer page-specific query. The current release is internally correct, but a future shared edit can be published without every reference changing. | Replace hand-maintained query strings with content-hashed filenames or one release asset version generated centrally. Extend the static audit to fail when an immutable asset changes without its public reference changing. |
| P3 / decision | Recruitment competes with the primary buyer journey | “Join projects” appears in the primary navigation and receives a substantial homepage band. This supports the two-sided operating model, but it competes with the current priority to win client work. No analytics evidence was available to show whether that trade-off helps or hurts conversion. | Keep the content, but review navigation prominence after route and CTA analytics are available. If buyer conversion is the immediate objective, move recruitment to the secondary navigation or footer rather than rewriting it. |

## What is working

- One H1, no broken images, no horizontal overflow, and no broken internal route were found across the checked live pages.
- Computed WCAG AA checks found no rendered text-contrast failures on the 17 indexable routes.
- The mobile menu opens correctly, reports its expanded state, traps no page width, and retains usable tap targets.
- The project assistant has an accessible dialog label, focus management, Escape handling, focus containment, and focus return.
- The founder portrait renders correctly in AVIF with a JPG fallback and explicit dimensions. An initially blank automated capture was a screenshot-timing artefact, not a site defect.
- Current DMAR and Pinglo materials are specific, recent, and substantially stronger as commercial proof than generic mockups.
- The four lead offers are easier to understand and the family relationship on the DMAR work remains disclosed.

## Performance evidence

| Measure | Desktop lab result | Interpretation |
| --- | ---: | --- |
| LCP | 141 ms | Excellent; the LCP is text, not an image dependency. |
| TTFB | 34 ms | Excellent in the observed run. |
| CLS | 0.00 | No layout instability in the trace. |
| Longest critical path | 56 ms | The three CSS files are render-blocking, but the trace estimated no material FCP/LCP saving from changing them. |
| Initial requests | 10 | Document, three stylesheets, script, logo, and four proof images. |
| Field data | Unavailable | These are laboratory observations, not CrUX evidence or a mobile Lighthouse score. |

The CSS consolidation recommendation is therefore a design-governance and delivery-safety improvement, not a claimed Core Web Vitals fix.

## Proposed next system pass: evidence-led consolidation

- **Objective:** Make routine visual changes safer and cheaper while improving the inspectability of A4T's proof.
- **Visual idea:** Keep the current visual identity intact; make the technical system as calm and legible as the interface by giving each token, component, and media type one owner.
- **System:** One canonical token layer, one owned definition per component family, explicit `website-proof`, `photography`, `portrait`, and `brand-mark` media roles, and automated immutable-asset versioning.
- **Required assets:** Reuse the existing event AVIF and current work captures. When project screenshots are next refreshed, export 16:9 AVIF/WebP and JPG fallbacks at sensible responsive widths. An environmental founder portrait can be added later for warmer editorial use, while the present headshot remains useful for formal trust contexts.
- **Responsive behaviour:** Website proof remains fully visible in a 16:9 frame on desktop and mobile; photography continues to crop editorially; picture sources select efficient formats without changing layout; components keep the current stack order and 44px interaction baseline.
- **Implementation notes:** Work in four small, independently testable changes: image source correction, proof-media rule, automated asset versioning, then measured CSS consolidation. Use visual regression checks on Home, Services, About, Photography, both case studies, Contact, and the internal design-system route before any release.

## Recommended delivery order

1. Reuse `event-dj.avif` on Home, About, and Ventures and standardise website-proof framing.
2. Introduce generated asset versioning or content hashes before the next shared CSS change.
3. Inventory selector use by route, consolidate component families, and remove only coverage-proven dead CSS.
4. Review “Join projects” prominence using real navigation and CTA evidence; make no hierarchy change on opinion alone.

No delivery date is committed. The first two items are bounded, low-risk implementation work; CSS consolidation should be phased rather than shipped as one rewrite.

## Verification record

- `npm run check`: 40 tests passed; static audit passed for 20 HTML pages and 17 indexable routes.
- `git diff --check`: passed at audit time.
- Live/source parity: the homepage, Services, About, Pinglo, DMAR, and the current polish stylesheet matched the deployed release.
- Browser coverage: Home, Services, About, Photography, Pinglo, DMAR, and Contact at 1280 × 800 and 390 × 844, plus all indexable routes for automated structural and contrast checks.
- Live internal-link crawl: no failing route found.
- Desktop performance trace: no throttling; no CrUX field data available.

## Decision boundary

This document is an audit and proposed implementation sequence only. No `public/` file, production setting, database, or deployment was changed during this audit. Any implementation and subsequent deployment require their own explicit instruction and release verification.

## 9 September 2026 implementation and release record

- Nikita Piazenko explicitly authorised implementation and live deployment after the audit.
- Consolidated the two dated component/route layers into `a4t-components.css`. Deployed pages now load only the canonical token layer and the consolidated component layer; eight historical and unused stylesheets were moved out of `public/` and preserved under `archive/legacy-site/styles-20260909/`.
- Added the existing AVIF source with JPG fallback to the Home, About, and Ventures event-photography placements.
- Added shared website-proof roles so Pinglo, DMAR, and supporting website evidence use inspectable 16:9 containment while photography keeps its editorial crop behaviour.
- Added content-derived versions for local immutable CSS, JavaScript, and asset references. The versioning check now fails before release when a referenced file and its cache key diverge.
- Extended the static audit to permit only the two active stylesheets and to enforce the event-image and case-proof rules.
- Verification passed: 40 tests; 20 HTML pages; 17 indexable routes; immutable-version validation; `git diff --check`; local Worker routes, redirects, stylesheets, and AVIF delivery; and the Cloudflare dry run.
- Commit `ea6b22c` was pushed to `origin/master` and deployed. The active deployment is Worker version `bdc8afad-8313-4385-8d4c-c09c57885346`; the live homepage and consolidated stylesheet exactly match local SHA-256 hashes, all 17 sitemap routes return 200 with the correct asset references, and the retired polish stylesheet returns 404.
- No D1 migration, form submission, navigation hierarchy change, or recruitment-content change was made. The P3 hierarchy question remains evidence-gated.
