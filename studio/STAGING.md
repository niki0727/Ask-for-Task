# Studio staging handoff

Use a dedicated Supabase test project, a test inbox you control, and a Node 24+ staging host behind HTTPS. Never point this configuration at the public A4T database or migrate local demo accounts.

For Render, connect the staging source branch as a Node Web Service. From the repository root use `npm ci --prefix studio` for the build and `node studio/staging.mjs` for the start command. Set `NODE_VERSION` to `24` and use the assigned HTTPS service URL as `STUDIO_ORIGIN`. Apply the schema before the first start. The app reads the host's `PORT`.

For Resend SMTP, use a key scoped to the verified sending domain and save it in Supabase's SMTP settings. The host is `smtp.resend.com`, port `465`, username `resend`, and the SMTP password is that Resend key. Choose a From address on the verified domain and disable click tracking on sign-in emails. The Node host does not need the Resend key.

1. Run `npm ci --prefix studio`. Generate the schema with `node studio/staging.mjs --print-schema`. Apply it to the staging database only. Use a dedicated database login with CRUD access to the private `studio_app` schema and sequence usage, not database owner privileges. Keep the schema out of the Data API. Use a direct connection or session pooler with TLS and certificate validation.
2. Enable confirmed email accounts. Configure a verified sender and [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp) for non-team test inboxes. Set the Auth Site URL to the exact staging HTTPS origin. In both Confirm signup and Magic Link templates use `{{ .SiteURL }}/#studio_access={{ .TokenHash }}` as the link. Set a short expiry, turn off email link rewriting and test that an email scanner cannot consume the link without the confirmation button.
3. Set `STUDIO_PILOT_EMAILS` (comma-separated approved test inboxes), `STUDIO_ORIGIN`, `STUDIO_DATABASE_URL`, `STUDIO_SUPABASE_URL`, `STUDIO_SUPABASE_KEY` (publishable) and `STUDIO_SUPABASE_ADMIN_KEY` (server-only, for account deletion) in the staging host’s secret settings. Start with `node studio/staging.mjs`. Preserve the exact public Host header in the proxy. Restrict traffic to pilot testers at the hosting layer; enable provider abuse limits and deploy-side request throttling before opening registration. Do not expose or log credentials, email tokens or database URLs.
4. In a fresh browser, request an email link; verify inbox receipt, confirm once, save a music or photography profile, and optionally set a generated phrase. Sign out, open a fresh browser, sign back in with both a fresh email link and the passphrase, and verify the same specialties, portfolio, visibility and projects. Confirm a reused link fails, accounts are isolated and account deletion removes both the identity and profile. Keep the live public site out of this test.

The passphrase suggestion is generated on the device from six independently random words and a random suffix. Gear and personal questions are deliberately kept out of account secrets. Generating or revealing a phrase does not save it; the creator decides when to save it and should keep it in their password manager. Set or replace it only after opening a fresh email link. Local demo shows the generator but never saves a real password.

## Hiring pilot

Reapply the generated schema to the dedicated staging database for the new portfolio and enquiry tables. The first featured profile links to Nikita's existing public work. Invite other creators individually and have them publish their own profile and up to three HTTPS project links. Use media the creator already has permission to share. The app stores titles, credits and URLs. It neither uploads media nor fetches member-supplied URLs. The featured thumbnail uses an existing first-party image.

Use only sample enquiry details and controlled inboxes during the pilot. Designate an A4T operator to check the queue before starting the pilot. The form records the enquiry in the database and gives the visitor a reference. It does not send an automated alert.

1. Follow a featured or member creator card to the public profile in a signed-out browser. Open a sample project, follow the enquiry button, submit the test brief and record its reference.
2. Run `node studio/enquiries.mjs pending` on the staging host to find the reference. Run `node studio/enquiries.mjs show <reference>` in a private terminal to read the brief and confirm it is addressed to the expected creator. Do not paste the row into chat, issue trackers or shared logs.
3. Reply from the controlled A4T inbox. With the tester's permission, share the agreed brief with the test creator and confirm receipt. Record the outcome with `node studio/enquiries.mjs handed-off <reference>` only after receipt. Delete the synthetic enquiry with `node studio/enquiries.mjs delete <reference>` after recording the test result.
4. Record the handoff time, missing brief details, and whether the quote needs a deposit, fixed fee, milestones or cancellation terms. Decide the booking and commission model from the pilot before implementing payments.

Before accepting real briefs, confirm who checks the queue, what response expectation can be met, and the privacy and retention arrangements for Studio enquiries and any subsequent sharing.
