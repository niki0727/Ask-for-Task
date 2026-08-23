# Ask for Task website

Cloudflare website and Worker for `askfortask.co.uk`.

This is the public home of ASK FOR TASK LTD: a founder-led managed project delivery company. Pinglo is an owned venture and public app-development case study; DMAR International and other inspectable work provide additional evidence for the services.

## Preview locally

For the static pages:

```bash
python3 -m http.server 8788 --directory public
```

Then visit `http://localhost:8788`.

For the Worker API and D1 binding:

```bash
npx wrangler dev
```

Run the Worker tests and the static SEO/content audit:

```bash
npm run check
```

## Cloudflare setup

Create the D1 database:

```bash
npx wrangler d1 create askfortask_messages
```

Copy the returned database ID into `wrangler.jsonc` if it changes.

Apply all pending migrations:

```bash
npx wrangler d1 migrations apply askfortask_messages --remote
```

## Deploy

Deploy to the existing Cloudflare Worker service `askfortask` with Wrangler:

```bash
npx wrangler deploy
```

## Domain setup

In Cloudflare, add routes/custom domains for:

- `askfortask.co.uk`
- `www.askfortask.co.uk`

The Worker permanently redirects public HTTP traffic to HTTPS, redirects `www` to the apex domain, and canonicalises page paths while preserving query strings.

## Contact

The Worker provides three form endpoints:

- `/api/contact` validates project enquiries, stores them in D1, and sends the notification through Resend.
- `/api/reviews` stores submitted reviews for moderation and sends an internal notification. Reviews are never published automatically.
- `/api/professionals` validates professional profiles and PDF CVs, stores the application record, and sends the CV through Resend.

Notifications are sent to `admin@askfortask.co.uk` by default.

Set these Worker variables/secrets in Cloudflare:

- Secret: `RESEND_API_KEY`
- Optional variable: `CONTACT_TO=admin@askfortask.co.uk`
- Optional variable: `CONTACT_FROM=Ask for Task <contact@askfortask.co.uk>`

The sending domain used in `CONTACT_FROM` must be verified in Resend.

## Partner-link measurement

Public partner, project, app-store, and portfolio links use fixed `/go/<slug>` routes. The Worker maps each slug to a server-side allowlist, records only the slug, a controlled source-page identifier, the UTC date, and an aggregate request count, then redirects. It never accepts a destination URL from the browser.

Read totals by partner, source page, and date:

```bash
npx wrangler d1 execute askfortask_messages --remote --command "SELECT partner_slug, source_page, click_date, SUM(request_count) AS outbound_requests FROM partner_click_daily GROUP BY partner_slug, source_page, click_date ORDER BY click_date DESC, partner_slug, source_page;"
```

These are outbound partner-link requests, not guaranteed human visits. Bots and link scanners may request the same routes.

## Retention cleanup

The Worker runs D1 retention cleanup at `03:00 UTC` on the first day of each month. It removes:

- ordinary enquiries and non-published review records older than 24 months;
- professional application records older than 12 months; and
- daily partner-link totals older than 24 months.

The cleanup uses `COALESCE(retention_reference_at, created_at)` for records that may have later correspondence. Update `retention_reference_at` when the latest relevant contact changes. Set `retention_hold = 1` before the cutoff when a record relates to an active contract, an approved review still in use, a legal duty, complaint, or claim. The scheduled handler is the only cleanup entry point; there is no public deletion URL.

Example hold:

```bash
npx wrangler d1 execute askfortask_messages --remote --command "UPDATE contact_messages SET retention_hold = 1 WHERE id = 123;"
```

## Remaining anti-abuse setup

The forms use server-side validation, body-size limits, strict content types, honeypots, and restrictive CV checks. Cloudflare Turnstile or a dedicated rate-limiting binding is not configured.

To add Turnstile correctly:

1. Create a managed Turnstile widget for `askfortask.co.uk` in Cloudflare.
2. Add the public site key to the three form experiences.
3. Store the secret with `npx wrangler secret put TURNSTILE_SECRET_KEY`.
4. Verify each submitted token against Cloudflare Siteverify in the Worker before accepting `/api/contact`, `/api/reviews`, or `/api/professionals`.
5. Add success, failure, expiry, and unavailable-service tests before deployment.

Do not add placeholder keys or treat a browser-only widget as server protection.

## Policy maintenance

The public Privacy, Cookies and Analytics, Trust and Standards, Terms, and FAQ wording is based on the implemented website flows and confirmed company information. Final legal wording, lawful-basis choices, retention exceptions, project contracts, and any future tracking changes should receive professional legal review before being relied on for a new processing activity or jurisdiction.

Before a production release, run:

```bash
npm run check
npx wrangler deploy --dry-run
```

Applying D1 migrations and deploying are separate production actions and should only be run when the release is authorised.
