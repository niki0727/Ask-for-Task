# Ask for Task website

Cloudflare website for `Askfortask.co.uk`, matching the structure used by the Pinglo site.

This is the public company/product home for ASK FOR TASK LTD, the operator behind Pinglo.

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

## Cloudflare setup

Create the D1 database:

```bash
npx wrangler d1 create askfortask_messages
```

Copy the returned database ID into `wrangler.jsonc` if it changes.

Apply the migration:

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

The included `_redirects` file redirects `www` to the root domain when served through the static asset layer.

## Contact

The contact form stores submissions in D1 through `/api/contact`. The fallback email link uses `support@askfortask.co.uk`.
