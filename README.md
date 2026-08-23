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

Before a production release, run:

```bash
npm run check
npx wrangler deploy --dry-run
```

Applying D1 migrations and deploying are separate production actions and should only be run when the release is authorised.
