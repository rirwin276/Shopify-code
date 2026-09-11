# Command Center and visitor journeys

The directory is the initial view. It makes one `/admin/command-center/index`
request through the signed Shopify proxy. A cold activity snapshot builds in
the background while all stores remain searchable. Latest visit, product build,
and purchase timestamps determine the default engagement sort. The index lists
every store through backend pagination instead of Liquid's limited iterations.

Store details, session lists, individual journeys, performance, and outreach
load only when opened. Snapshot timestamps and partial/unavailable states are
shown. Detail responses from a previous store selection cannot replace the
current selection. Navigation and dialogs support keyboard use.

The site-wide tracker sends paths and allowlisted creation events after load,
then at 30-second intervals during activity and on page exit. It does not send
form values, query strings, account IDs, email addresses, or IP addresses.
Storefront sections only provide a store-handle marker; the old one-hit tracker
no longer issues a second request. Shopify's proxy supplies verified identity.

Creation events distinguish opening the page, interacting with the form,
validation failure, submission, request acceptance, and submission failure.
Request acceptance is **not** build completion. The existing provisioning timer
is not used as evidence of success. External Shopify sign-in/checkout pages are
outside this tracker, so it cannot prove why a visitor left or follow every
external step.

Session duration is observed first-to-last receipt time; active time counts
visible interaction windows. One-hit visits without a heartbeat have unknown
duration. Sessions become ended after 30 minutes without a report. The displayed
sample is bounded to the newest 1,000 recorded sessions, with a 60-page limit per
journey. The UI marks truncation. Activity summaries use filtered journeys rather
than old unfiltered traffic. Prior page histories cannot be reconstructed.

Owner visits set `ss-analytics-exclude=1` in that browser. It remains after logout;
each additional device needs an owner sign-in before anonymous visits can be
recognized as yours. Signing in during an existing anonymous session excludes
the entire session. Known crawler user agents and automation indicators are
filtered heuristically. Unverified customer-role lookups are excluded. No filter
can guarantee detection of every bot or an owner on an unrecognized browser.

Visit location is unavailable because no trusted geolocation provider is
configured. Browser timezone is separately labeled and is never passed off as
location. Anonymous account/store membership is unknown; authenticated store
membership comes from verified Shopify customer tags.

The tracker respects Shopify's analytics permission when exposed and browser
DNT/GPC signals. Tracking failure never blocks form submission or navigation.

## Deployment and verification

Deploy `studio-uploader` first (`command_center_fast.py`, `site_sessions.py`, and
the existing module installer), then the `Printful_Automation` signed relay,
then these theme files. Existing endpoints remain supported. No orders or
fulfillment code is changed.

Run `npm install --no-save jsdom@30.0.1`, then
`node --test tests/command-center.test.cjs tests/session-tracker.test.cjs`.
These are DOM behavior tests, not a substitute for live visual verification.
The cloud browser could not access the local preview in this work session.
Verify desktop/mobile appearance and an authenticated owner session after the
theme and both backend deployments are available.
