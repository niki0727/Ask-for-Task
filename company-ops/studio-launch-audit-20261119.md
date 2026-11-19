# Studio launch audit

Reviewed on 19 November 2026. Nikita Piazenko owns Studio operations. The public app is https://studio.askfortask.co.uk. The release is merged into master and deployed from master at 1eb71f3.

## Public access

- Render verified studio.askfortask.co.uk and issued its HTTPS certificate.
- The previous Render address redirects to the public domain.
- Public registration is enabled and requires verified email access.
- A real sign-in email pointed to the public domain and opened the owner's account.
- The profile editor, creator directory, private projects and A4T enquiry inbox are available.
- AI connection remains deferred at Nikita's request.

## Enquiry operations

A queued test enquiry survived deployment and generated an alert on its first attempt after the sending key was configured. A second, fresh guest submission generated its own alert through the normal request flow. Both emails were found in the owner's Outlook inbox and contained the correct reference and public inbox link.

The alert link opened the A4T operator inbox. Same-tab navigation to that link was also verified. Each test brief appeared with the correct creator, client and reference. Both synthetic enquiries were closed through the operator UI with private verification notes. The open inbox was then empty.

Alerts carry a reference and operator link, while the private brief stays in Studio. Provider acceptance is recorded separately from actual inbox delivery. Failed alerts retry from durable database state. The operator chooses when to reply and records an actual creator handoff after receipt. No synthetic test was represented as a completed human handoff.

## Verification

- Eight integration and import tests passed, including operator isolation, failed-alert retention and retry, concurrent-worker claims, public registration, avatar privacy, profile persistence and project ownership.
- The dependency audit reported zero known vulnerabilities.
- Profile and operator layouts were checked at 320, 390 and 1440 pixels without horizontal overflow.
- Same-tab sign-in, sign-out draft cleanup, selected-work ordering, public source import and returning email access were checked.
- Public app and privacy routes returned HTTP 200.
- The Studio database connection now verifies the provider's certificate authority.

## Recovery and agreed free-tier limits

An encrypted export of the Studio and Auth schemas restored successfully into a temporary PostgreSQL database, matching counts for 37 tables. The registered macOS LaunchAgent was explicitly run and exited with code 0 after its restore check.

The job runs daily at 03:20 local Mac time and retains encrypted snapshots for 30 days. Configuration, archives and the encryption key are in the protected A4T Studio application-support directory on Nikita's Mac. This depends on that Mac being available and provides local recovery copies.

Nikita chose to keep everything free. Render retains its idle shutdown, so a first visit after inactivity can be slow.

Provider references are https://render.com/docs/free and https://supabase.com/docs/guides/platform/backups.
