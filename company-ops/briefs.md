# Active briefs

Last updated: 25 August 2026 (Europe/Athens)

## Revenue outreach and conversion

- **Purpose:** Win managed-delivery, visual-production, and writing work through targeted outbound activity.
- **In scope:** Community/digital services, visual production, writing services, deduplication, reply monitoring, conversion reviews, and approved follow-ups.
- **Out of scope without explicit approval:** Sending unscheduled messages, cancelling queued messages, creating external CRM records, or expanding research inventory.
- **Primary records:** `outreach-campaign.md`, `outreach-visual-production.md`, `outreach-writing.md`, `outreach-conversion-log.md`.
- **Owner:** Nikita
- **Delivery controller:** AI Chief of Staff & Delivery Controller
- **Current milestone:** Deliver the 45 queued first touches between 25 August and 7 September, then measure each cohort after five UK working days. Visual prospects 26–30 deliver on 25 August; community prospects 40–44 deliver on 26 August.
- **Key controls:** Verified public addresses only; queued recipients count as contacted for deduplication; routed and direct addresses are measured separately; a missing bounce is only inferred delivery; Screen Share and its alternative contacts are permanently suppressed following the 24 August cease-and-desist reply.
- **Automation state:** Community, visual-production and writing prospect-generation automations are paused. The Friday conversion-review automation remains active.
- **Commercial qualification standard:** Draft framework in `company-ops/commercial-qualification.md`; use only after Nikita approves it, and keep enquiry, qualified, scoped, sent, and won as separate states.

## Website operations

- **Purpose:** Keep `askfortask.co.uk` credible, secure, testable, and ready for authorised release.
- **In scope:** Static site, Worker API, D1 migrations, contact/review/professional forms, policy content, redirects, partner-link measurement, tests, and audit.
- **Out of scope without explicit approval:** Production deployment, remote D1 migrations, DNS changes, new secrets, or deletion of live data.
- **Primary record:** `README.md` plus the repository code and tests.
- **Owner:** Nikita
- **Current milestone:** Trust remediation is live as Worker version `30d3f55e-65b8-4965-91dd-8641dd953ab4`. The complete 25 August visual-system release candidate passes automated, desktop/mobile, contrast, touch-target, and Cloudflare dry-run checks but is not deployed; production deployment requires explicit approval.
- **Key controls:** Run `npm run check` and `npx wrangler deploy --dry-run` before an authorised release. D1-backed short-window limits are the current enforceable anti-abuse control; store only a route-scoped SHA-256 client-address hash and delete expired records. Consider Turnstile later only if observed abuse justifies the added browser challenge.
