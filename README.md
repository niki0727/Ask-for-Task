# A4T Studio website

Cloudflare website and Worker for `askfortask.co.uk`.

The deployment source of truth is `public/`, as configured by `wrangler.jsonc`.
The former root-level HTML, assets, scripts, and older stylesheet stack are
preserved under `archive/legacy-site/`; they are historical snapshots and are
not part of the deployed site.

## Visual system

All deployed HTML pages load the visual layers in this order:

1. `public/a4t-system.css` — canonical colour, typography, spacing, shape,
   motion, and accessibility tokens.
2. `public/a4t-evolution-20260724.css` — shared layout and component styles.
3. `public/a4t-polish-20260805.css` — current route-specific refinements.

The dated component filenames are retained to preserve the working site, but
they must resolve shared values through `a4t-system.css`. `npm run audit`
rejects missing, reordered, or legacy public stylesheet links.

Canonical brand assets:

- Navigation, favicon, and structured company logo: `public/assets/a4t-mark-soft.svg`.
- Company-wide social preview: `public/assets/a4t-studio-social.png`.
- Case-study and specialist-route social previews may use the relevant verified work image instead of the company card.

The noindex route at `/design-system/` is the internal visual-QA reference for
tokens, type, actions, proof surfaces, forms, focus states, and responsive
behaviour. It is deliberately excluded from the sitemap.

This is the public home of ASK FOR TASK LTD: a founder-led managed project delivery company. Pinglo is an owned venture and public app-development case study; DMAR International and other inspectable work provide additional evidence for the services.

## Preview locally

For the static pages:

```bash
python3 -m http.server 8788 --directory public
```

Then visit `http://localhost:8788`.

For the Worker API, D1 binding, and canonical/legacy redirects (local bindings):

```bash
npx wrangler dev --local
```

Run the Worker tests and the static SEO/content audit:

```bash
npm run check
```

## Consolidated routes

The Worker maintains the three retired page routes in `CONSOLIDATED_PAGES`:

- `/design/` redirects to `/brand-development/#visual-development`.
- `/history/` redirects to `/about/#company-timeline`.
- `/responsible-growth/` redirects to `/services/#business-development`.

Clean, trailing-slash, `.html`, and `/index.html` variants preserve queries and
redirect in one hop. Old source is preserved under
`archive/legacy-site/consolidated-20260827/`, outside the deployed assets.
Use Wrangler, not the static Python preview, to verify those redirects.
The site audit checks their destination anchors and keeps retired pages out of
the sitemap. Share titles and descriptions must match current page metadata.
When changing an immutable cached stylesheet or script, update its version query
across every public page.

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

The Worker provides three rate-limited form endpoints:

- `/api/contact` validates project enquiries, stores them in D1, and sends the notification through Resend.
- `/api/reviews` stores submitted reviews for moderation and sends an internal notification. Reviews are never published automatically.
- `/api/professionals` validates professional profiles and PDF CVs, stores the application record, and sends the CV through Resend.

Notifications are sent to `admin@askfortask.co.uk` by default.

Set these Worker variables/secrets in Cloudflare:

- Secret: `RESEND_API_KEY`
- Optional variable: `CONTACT_TO=admin@askfortask.co.uk`
- Optional variable: `CONTACT_FROM=A4T Studio <contact@askfortask.co.uk>`

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

## Form anti-abuse controls

The forms use server-side validation, body-size limits, strict content types, honeypots, restrictive CV checks, and a D1-backed 15-minute submission limit. Limits are five project enquiries, four reviews, and three professional applications per connecting address and window.

The Worker hashes the connecting address before writing the rate-limit key. It never stores the raw address in D1. Rate-limit rows expire after 30 minutes and are removed during scheduled retention cleanup. Apply migration `0007_create_form_rate_limits.sql` before deploying the Worker release that enforces these limits.

Turnstile can still be added later if automated abuse persists. A browser widget must not be treated as protection unless every submitted token is also verified server-side.

## Policy maintenance

The public Privacy, Cookies and Analytics, Trust and Standards, Terms, and FAQ wording is based on the implemented website flows and confirmed company information. Final legal wording, lawful-basis choices, retention exceptions, project contracts, and any future tracking changes should receive professional legal review before being relied on for a new processing activity or jurisdiction.

Before a production release, run:

```bash
npm run check
npx wrangler deploy --dry-run
```

Applying D1 migrations and deploying are separate production actions and should only be run when the release is authorised.
