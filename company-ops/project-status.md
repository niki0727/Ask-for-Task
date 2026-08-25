# Project status

As of: 25 August 2026 (Europe/Athens)

## Executive view

- **Overall:** Amber
- **Why:** Outreach inventory is scheduled and website checks are green, but revenue conversion remains unproven. The first substantive human outreach reply was an explicit cease-and-desist instruction, and there is still no positive reply or qualified opportunity.
- **Immediate attention:** Enforce the Screen Share suppression, monitor the 24 August follow-ups, and protect the 25 August–7 September queue from duplicates or unauthorised changes.

| Workstream | Health | Current state | Next action | Main risk / blocker |
| --- | --- | --- | --- | --- |
| Community / digital outreach | Red/amber | 15 prospects inferred delivered on 23 Aug; six final follow-ups sent 24 Aug; 20 first touches scheduled; one explicit cease-and-desist reply | Suppress Screen Share; monitor the remaining follow-ups and scheduled cohort | Negative human reply, routed inboxes and no positive reply |
| Visual-production outreach | Amber | 5 sent on 23 Aug; 20 first touches scheduled, including prospects 26–30 on 25 Aug | Measure direct vs routed exposure and production ownership | Agency ownership and routed addresses |
| Writing outreach | Amber | 5 sent on 23 Aug; 5 first touches scheduled | Measure response to contained proof offers | Internal marketing ownership and routed addresses |
| Conversion control | Red | First substantive human reply is negative; no positive reply, conversation, proposal or win | Review each cohort after five UK working days and enforce suppression | Positioning, sender credibility, route quality, offer size and contact tolerance |
| Website and Worker | Green | Trust remediation and visual-system consolidation are live as Worker version `2cfc9a0b-ea27-43dc-8398-543ca0becb64`; automated and live custom-domain checks pass | Monitor live behaviour and preserve the canonical system | Real-user behaviour and Search Console coverage remain unverified |

## Known delivery facts

- The 23 August live activation involved 16 attempts for 15 prospects, with one Tilia address bounce and one retry to an official regional address.
- Forty-five first-touch emails are queued for 25 August–7 September; 31 August is excluded.
- Queued messages are not yet sent and must remain separate in reporting.
- Community prospects 40–44 are scheduled for 26 August between 09:15 and 11:15 UK time.
- Visual prospects 26–30 are scheduled for 25 August between 09:15 and 11:15 UK time.
- Six community follow-ups were sent on 24 August. Automatic away messages came from Community TechAid, The Restart Project and Screen Share; Screen Share then sent an explicit cease-and-desist response and is permanently suppressed.
- The three prospect-generation automations are paused; the weekly conversion-review automation remains active.
- No qualified opportunity, proposal, win, or evidenced outreach profit is recorded in the current conversion log.

## 25 August 2026 — Visual-system consolidation prepared

- **Delivery state:** Implemented and locally verified; not deployed.
- **Direction:** The current light blue/lime public identity is the company baseline. Dark navy remains a controlled trust/campaign variant.
- **Implementation:** `public/a4t-system.css` is now the canonical source for shared colour, typography, spacing, shape, motion, and focus tokens. All 22 deployed HTML pages load it before the existing component layers, whose historical token names now resolve through compatibility aliases.
- **Source control:** `public/` is documented as the deployment source of truth. Duplicate root pages and older stylesheet experiments remain preserved as legacy snapshots and are not active in the public build.
- **Controls:** The static audit rejects missing, reordered, or legacy public stylesheet links.
- **Verification:** `npm run check` passed 36 tests and the audit of 22 HTML pages / 20 indexable routes. `npx wrangler deploy --dry-run` passed.
- **Next action:** Owner: Nikita Piazenko. Review and explicitly authorise production deployment if the consolidation is accepted. No deployment date is committed.

## 25 August 2026 — Full visual-system release candidate completed

- **Delivery state:** Complete and release-verified locally; not deployed.
- **System:** Active typography, route colours, layout measures, spacing primitives, radii, shadows, motion, focus states, logo usage, and mobile interaction targets resolve through the canonical design system.
- **Reference:** A noindex `/design-system/` route provides internal visual QA for colour, typography, actions, evidence components, forms, dark surfaces, focus, and responsive behaviour.
- **Source consolidation:** The former root site and its uncommitted homepage hardening work are preserved under `archive/legacy-site/`. `public/` is now the only active deployment source.
- **Accessibility corrections:** Computed QA identified and corrected muted-text, teal-action, dark-result, and photography-caption contrast. Representative mobile controls now provide at least 44px targets.
- **Verification:** `git diff --check`, 36 tests, the audit of 23 HTML pages / 20 indexable routes, and the Wrangler dry run pass. Homepage, design-system reference, contact, photography, and the DMAR case study pass at 1280px and 390px with one H1, no horizontal overflow, no missing images, no computed contrast failures, and no active target below 44px.
- **Next action:** Owner: Nikita Piazenko. Explicitly authorise or reject production deployment. No deployment date is committed.

## Decisions needed

1. When to schedule the recurring weekly company-report preparation, if an automated cadence is desired.

## 25 August 2026 — Visual-system release deployed

- **Delivery state:** Deployed and live-verified.
- **Production version:** `2cfc9a0b-ea27-43dc-8398-543ca0becb64`.
- **Release evidence:** `npm run check` passed 36 tests and the audit of 23 HTML pages / 20 indexable routes. Wrangler read 114 production assets and deployed 26 new or modified assets.
- **Live verification:** The homepage, contact, photography, DMAR case study, internal design-system reference, and canonical system stylesheet returned HTTP 200 with security headers present. Every checked page loaded the canonical system layer. Desktop and 390px mobile checks found one H1, no horizontal overflow, the expected mobile menu, no missing visible images, and no visible mobile target below 44px.
- **Source control note:** Production was deployed from commit `4c30a7a`; `origin/master` remains at `289c84f` until a separate push is authorised.
- **Next action:** Owner: Nikita Piazenko. Monitor customer-facing behaviour and decide whether to authorise pushing commit `4c30a7a` to the connected GitHub branch.

## 24 August 2026 — Baseline website trust and quality audit

- **Review status:** Not approved pending findings review. This is an independent review outcome, not a production incident declaration.
- **High findings:** Public contact, review, and professional-application routes rely on honeypots and validation but have no enforceable rate limit or Turnstile; the site repeatedly promises a response within 48 hours while the Terms state that no enquiry response timeframe is guaranteed.
- **Medium findings:** Several design/contact accent combinations fail WCAG AA contrast in computed browser checks; contact and professional forms do not put a Privacy Policy link at the collection/consent point; the ESG page has no named specialist, qualification, or case-study evidence; some mobile footer links render below the recommended 44-by-44 CSS-pixel target.
- **SEO/content status:** All 20 sitemap routes returned HTTP 200 with unique titles, descriptions, canonical URLs, one H1, and dimensioned images. The review form is correctly `noindex, follow` and excluded from the sitemap. Search index coverage remains unverified without Search Console access.
- **Performance status:** Chrome DevTools lab traces added after the baseline review. The homepage measured 258 ms LCP and 0.00 CLS on desktop, then 342 ms LCP and 0.00 CLS with Fast 4G and 4x CPU mobile emulation. The image-heavy photography page measured 339 ms LCP and 0.00 CLS under the same mobile emulation. Lighthouse mobile scores on the homepage were 100 for accessibility, best practices, SEO, and agentic browsing. No CrUX field data was available, so real-user LCP, CLS, and INP remain unverified. A 60 ms forced layout on the desktop homepage trace originated in `updatePagePosition` in `public/script.js`; Chrome estimated no metric savings, so this is non-blocking optimisation work rather than a release finding.
- **Positive controls verified:** HTTP-to-HTTPS and `www` redirects, HSTS, restrictive CSP, framing protection, no-store API responses, custom 404 status, server-side payload validation, parameterised D1 statements, retention cleanup, and a successful Wrangler dry run.
- **Evidence:** Live HTTP and browser checks plus `npm run check` and `npx wrangler deploy --dry-run`, all run 24 Aug 2026. No live form was submitted and no production or source fix was made.
- **Next action:** Owner: Nikita Piazenko. Review and accept, reject, or reclassify each finding before implementation. No implementation date is committed.

## 24 August 2026 — Website trust remediation prepared

- **Delivery state:** Prepared and locally verified; not deployed.
- **High findings addressed:** Contact, review, and professional-application routes now use route-scoped D1 short-window limits. The site now says enquiries are usually answered within two business days, while the Terms explain that complex, incomplete, or out-of-hours enquiries may take longer.
- **Medium findings addressed:** Form consent text links directly to the Privacy Policy; affected accent colours pass WCAG AA contrast checks; mobile footer links meet the 44 CSS-pixel target; and the responsible-growth page states the specialist-selection and evidence boundary without claiming unavailable credentials or case studies.
- **Privacy design:** The rate limiter stores a SHA-256 hash of the route and client address, not the raw address, and scheduled retention removes expired records.
- **Verification:** `npm test` passed 36 tests; `npm run audit` passed 22 HTML pages / 20 indexable routes; `npm run check`, `git diff --check`, local migration `0007`, and `npx wrangler deploy --dry-run` passed. Browser checks covered desktop contact and mobile contact, reviews, professionals, terms, safety, design, and photography without horizontal overflow. Six local submissions from one test address produced five processed requests followed by HTTP 429 with `Retry-After`.
- **Release dependency:** Owner: Nikita Piazenko. Explicitly authorise the remote D1 migration and production deployment. No release date is committed.
- **Source:** `src/worker.js`, `src/worker.test.js`, `migrations/0007_create_form_rate_limits.sql`, public HTML/CSS/JS, `scripts/audit-site.mjs`, and local verification output from 24 Aug 2026.

## 24 August 2026 — Website trust release deployed

- **Delivery state:** Deployed and smoke-tested.
- **Production version:** `30d3f55e-65b8-4965-91dd-8641dd953ab4`.
- **Database:** Remote migration `0007_create_form_rate_limits.sql` applied to `askfortask_messages`; Wrangler reports no pending migrations.
- **Live verification:** The apex homepage, contact, privacy, Terms, and contact-config routes returned HTTP 200; `www` redirected to the apex with HTTP 301; HSTS and CSP were present; the API remained `no-store`; the custom missing-page route returned HTTP 404; and contact configuration reported Resend, sender, recipient, and D1 configured. No live customer form was submitted.
- **Next action:** Owner: Nikita Piazenko. Monitor submissions and Worker errors. No further production change is committed.
