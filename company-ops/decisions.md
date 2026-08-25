# Decision log

## 25 August 2026 — Deploy the consolidated visual system

- **Decision:** Deploy the complete visual-system release candidate from commit `4c30a7a` to the production Ask for Task Worker.
- **Reason:** Nikita explicitly approved deployment after asking whether the Creative Director had implemented the audit rather than only reporting it. Automated, dry-run, source, desktop, and mobile checks confirmed that the audit actions were implemented.
- **Effect:** Worker version `2cfc9a0b-ea27-43dc-8398-543ca0becb64` is live. The canonical system layer, internal noindex reference, accessibility corrections, and active-source consolidation are now customer-facing. Future production changes still require explicit approval.
- **Source:** User instruction and Cloudflare deployment output, 25 August 2026.

## 25 August 2026 — Complete the visual system and archive the duplicate site

- **Decision:** Finish every action in the visual-system audit, preserve the former root site under `archive/legacy-site/`, keep `public/` as the only active source, and prepare the result for a separately authorised production deployment.
- **Reason:** The first consolidation pass established tokens but left component migration, canonical asset enforcement, visual QA, responsive/contrast verification, and duplicate-source removal incomplete.
- **Effect:** The full release candidate is locally complete and verified. The legacy site remains recoverable, including its uncommitted root-homepage hardening changes. No production change has occurred.
- **Source:** User instruction to implement all remaining audit work on 25 August 2026; `design-system-audit-20260825.md`, browser QA, repository checks, and Wrangler dry-run evidence.

## 25 August 2026 — Consolidate the current public visual system

- **Decision:** Adopt the existing light blue/lime public direction as the ASK FOR TASK company baseline, retain dark navy as a controlled trust/campaign variant, and centralise shared visual values in `public/a4t-system.css`.
- **Reason:** The visual audit found a strong public direction but overlapping token vocabularies, optional platform-dependent font stacks, and ambiguity between deployed `public/` source and legacy root snapshots.
- **Effect:** All deployed pages now load one canonical system layer before the existing component layers. Legacy token names remain as compatibility aliases, and the static audit prevents missing, reordered, or legacy public stylesheet links. The implementation is locally verified but not deployed.
- **Source:** User approval to fix the audit findings on 25 August 2026; `design-system-audit-20260825.md` and repository verification output.

## 24 August 2026 — Use privacy-preserving D1 limits for public forms

- **Decision:** Protect contact, review, and professional-application submissions with route-scoped D1 short-window limits. Store only a SHA-256 client-address hash and retain expired counters only until scheduled cleanup. Keep Turnstile as a later option if observed abuse warrants it.
- **Reason:** The independent trust audit identified an enforceable anti-abuse gap. A server-side control protects every client without adding a visible challenge to normal enquiries.
- **Effect:** Nikita authorised deployment on 24 August. Remote migration `0007_create_form_rate_limits.sql` and Worker version `30d3f55e-65b8-4965-91dd-8641dd953ab4` are now live; future production changes still require explicit authorisation.
- **Source:** User approval to proceed on 24 August 2026; implementation and test evidence in the website repository.

## 24 August 2026 — Pause prospect generation and schedule the prepared batches

- **Decision:** Pause the community, visual-production and writing prospect-generation automations; keep the weekly conversion-review automation active. Schedule visual prospects 26–30 for 25 August and community prospects 40–44 for 26 August during UK business hours.
- **Reason:** Nikita explicitly approved the prepared messages for sending and approved the recommendation to stop further inventory expansion while current outreach is measured.
- **Effect:** Ten previously prepared prospects are now `scheduled`, not merely `prepared`. Total queued first touches rise from 35 to 45. No further automated prospect research should run until the paused automations are explicitly resumed.
- **Source:** Outlook scheduling results and the 24 August user instruction; detailed records in `outreach-campaign.md` and `outreach-visual-production.md`.

## 24 August 2026 — Permanently suppress Screen Share

- **Decision:** Do not contact Screen Share, Moses Seitler, Mahlet Mairegu, or another Screen Share route again unless Screen Share itself explicitly reopens contact.
- **Reason:** Moses Seitler replied “Cease and desist” on 24 August following a final follow-up.
- **Effect:** The organisation is disqualified and suppressed across first touches, follow-ups, retries and future prospect research. No acknowledgement reply is to be sent.
- **Source:** `admin@askfortask.co.uk` Inbox, 24 August 2026 at 09:35 UTC; recorded in `outreach-conversion-log.md`.

## 24 August 2026 — Permit one visual-production research batch

- **Decision:** Treat the named visual-production automation run as a one-batch exception to the 23 August inventory pause; prepare prospects 26–30 but do not send, schedule, create external drafts or update CRM.
- **Reason:** The newer task instruction explicitly required the visual-production lane to run. Recording the exception preserves the conversion-control decision instead of silently contradicting it.
- **Effect:** The five prospects remain `prepared` only. The general pause on further inventory expansion resumes after this batch until queued outreach is activated and measured or Nikita gives a newer instruction.
- **Source:** `outreach-visual-production.md`, prospects 26–30.

## 24 August 2026 — Activate a project-level Chief of Staff control layer

- **Decision:** Use `AGENTS.md` and `company-ops/` as the durable operating system for priorities, briefs, deadlines, decisions, project status, and weekly reports.
- **Reason:** The project already has detailed delivery records but no single executive control view.
- **Effect:** Future project work should update the control layer when material state changes, while the existing source records remain authoritative for detailed evidence.
- **Owner:** Nikita

## 23 August 2026 — Treat scheduled prospects as contacted for deduplication

- **Decision:** Do not prepare, schedule, or send queued recipients again unless a scheduled item is cancelled or a later follow-up is explicitly approved.
- **Reason:** Avoid duplicate outreach while 35 first-touch messages are already queued.
- **Source:** Scheduling records in the outreach lane files and `outreach-conversion-log.md`.

## 23 August 2026 — Pause inventory expansion until live outreach is measured

- **Decision:** Activate and measure existing drafts before researching another batch.
- **Reason:** Earlier cohorts produced no substantive human replies, and additional inventory would not resolve the conversion constraint.
- **Source:** `outreach-conversion-log.md`.

## Standing decision — Require approval for consequential external actions

- **Decision:** Email sends, production deployments, remote migrations, purchases, and comparable actions require explicit user authorisation.
- **Reason:** Preparation and control do not imply permission to mutate external systems.
