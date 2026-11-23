# Homepage and Creator Studio integration

Released 23 November 2026 at https://askfortask.co.uk/ and https://askfortask.co.uk/studio/.

## Visitor experience

The homepage opening section now pairs the existing client-service proposition with a prominent Creator Studio panel. Visitors can enter their email immediately, explore creators or open their workspace. New and returning members use the same verified-email flow. The mobile hero provides client and creator actions together. Main navigation and footer creator links stay on the main domain.

The app retains the approved A4T mark and existing creative animation, profiles, private projects and guest enquiries. The former Studio origin redirects page links into /studio/; email-link fragments survive that redirect and are only verified after the explicit confirmation button. Existing account records are unchanged. Members may need a fresh sign-in on the main domain because browser cookies are scoped to each host.

## Implementation and safeguards

A fixed-upstream Cloudflare Worker route serves the existing Node application at /studio/. It forwards only Studio session/verification cookies, validates the main-site origin for writes, bounds request bodies and retains the app's content security policy. The app emits mounted resource/profile/avatar URLs and scopes session cookies to /studio/. Main-site page slash canonicalization excludes the mounted app so API requests retain their exact paths. The public homepage email form reports pending, success and failure states, including free-hosting wake-up delays.

No database migration, new paid hosting, payment workflow or AI activation was added.

## Verification

- All 55 tests and the 29-page main-site audit pass. The Worker deployment dry-run passed.
- Regression coverage includes fixed-upstream forwarding, cookie isolation, cross-site write rejection, bounded failures, exact API paths, mounted sign-in/session/logout, creator enquiry URLs and old-origin redirects.
- Chrome checked the homepage desktop design and a 390px phone layout. Local mounted access opened the signed-in workspace without horizontal overflow.
- Public homepage, mounted app, privacy, logo, script, creator profile, session and directory endpoints return 200. Cross-site write requests return 403.
- A real sign-in request from the public homepage generated an email in the owner's Outlook inbox. Its original Studio-domain link redirected to /studio/#workspace; confirmation opened the existing Nikita Piazenko account. Reloading retained access and the saved profile.
- Anonymous test enquiry 2127019d-5910-4675-9f62-b1cb0101b48c returned 201 through the mounted route. Its alert arrived in the owner inbox and the correct brief appeared in the A4T operator UI. The test was saved as closed with a private verification note and disappeared from the refreshed open view. No booking or human creator handoff was claimed.

Application release f90ad43 is live on Render. Main Worker version 67462645-99d2-4b21-939c-b875ad26233b is deployed. The operational runtime remains on the agreed free tiers, with possible Render cold starts.
