# Cleanup Notes

## Send admin secret on the Nuke button (security — pairs with studio-uploader)

Date: 2026-06-15

What changed:
- `sections/admin-powers-page.liquid` — the "Destroy Store" (nuke) `fetch` to
  `/api/storefront/{handle}/nuke` now sends the `X-Admin-Secret: AP_ADMIN_SECRET`
  header, matching how the working admin endpoints (e.g. `/admin/store/{handle}/products`)
  already authenticate.

Why:
- The `studio-uploader` backend was hardened (2026-06-15) to require authorization on the
  nuke endpoint — it previously deleted a store on an unauthenticated empty-body POST.
  Without this header the Admin Powers nuke button gets a `401`.

Deploy / ordering:
- Publish this theme change so the nuke button sends the secret.
- This must be live together with (ideally before) the studio-uploader backend change.
- Tested expectation: authorized nuke returns a job id and runs; an unauthenticated POST
  (no header) returns 401.

Caveat:
- `AP_ADMIN_SECRET` is still the shared, browser-visible secret. This makes nuke consistent
  with the other admin calls but is not the final fix — the real fix is server-side
  permission validation. When the secret is rotated, update this theme value AND the
  backend `ADMIN_SECRET` env together or nuke will break.

## Admin Powers cleanup

Date: 2026-06-14

Status:
- Admin Powers access logic was cleaned up and verified live.
- Founder access uses the `super-admin` tag, with Ryan's owner email kept as a temporary fallback.
- Admin Powers backend/editor config was cleaned up so shared backend URLs are easier to reason about.
- The `apPost()` helper was cleaned up and verified live.
- `setStatus()` received a small missing-element guard and was verified live.
- Pro Builder editor return URLs now preserve the current admin page query string so returning from an editor keeps the `shop` handle.
- Ryan tested Admin Powers after the return URL fix and confirmed it was working again.

Important current note:
- The one-line duplicate admin config value cleanup was identified but not applied because the GitHub connector blocked that secret-related edit.
- If applied later, keep the route and header behavior the same. Only dedupe the local JavaScript value to use the shared config value.

Temporary workflow cleanup:
- Old one-run workflow files were removed after they were no longer needed.
- A stale failed `apply-ap-post-cleanup.yml` workflow was removed from `main` so old failure notifications stop showing up as active problems.

Recovery note:
- If any Admin Powers cleanup needs to be reverted, recover the older version of `sections/admin-powers-page.liquid` from Git history before the specific cleanup commit.
- Do not remove the owner email fallback until founder access has been tested through the `super-admin` Shopify customer tag.

## Fundraising feature

Date: 2026-06-17

Full backend contract lives in `docs/fundraising-backend.md`. Summary of where
things stand:

Frontend (Shopify-code, `sections/admin-powers-page.liquid` + `assets/ss-admin-pro-builder-cards.js`):
- The fundraising wizard is a viewport-contained 5-step flow: (1) how it works +
  legal agreement, (2) about Stripe, (3) connect Stripe, (4) fundraiser details,
  (5) display settings + launch.
- All wizard CSS is injected with `!important` via `injectFundraiserStyles()` in
  the JS asset. The matching rules in the liquid `{% style %}` block are NOT
  authoritative — the injected styles win, so any visual change must be made in
  the JS asset (this is why benefit cards / the amount stepper looked unstyled
  until their CSS was moved into the injected block).
- In-progress setup is saved to `localStorage` (`ss_fr_draft_{handle}`) so an
  admin can close and resume; we deliberately do NOT hit the Shopify Admin API
  on every keystroke.

Backend — phase 1 (persistence) DONE:
- studio-uploader: `GET/POST /api/fundraising/{handle}` persists state to a
  `store_fundraising` metaobject (single JSON `data` field, auto-created).
- Printful_Automation: `GET/POST /relay/store/{handle}/fundraising` relays to it,
  injecting `X-Admin-Secret`. Requires `ADMIN_SECRET` identical on both services
  (same secret as sleep/wakeup/nuke — no new env var).

Backend — phase 2 (money movement) NOT built:
- Product reprice on launch / revert on stop (snapshot into `base_prices`).
- Order-paid webhook growing `total_raised`, 7-day escrow, weekly batched Stripe
  payouts, goal-met email.
- Stripe Connect (Express) onboarding: needs `stripe` dependency + the platform
  `STRIPE_SECRET_KEY` (sk_…, server-side only) on studio-uploader, and Connect
  enabled in the Stripe Dashboard. See `fundraising-backend.md` §5.B.
