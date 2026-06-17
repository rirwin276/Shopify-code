# Fundraising — backend contract & metaobject spec

This documents what the **studio-uploader** backend and Shopify need so the
fundraising wizard (in `sections/admin-powers-page.liquid`) stops being a shell
and actually persists state, reprices products, and pays out.

The frontend already speaks to **one endpoint** through the secure App Proxy
relay. No secret is ever exposed to the browser — the relay (Printful_Automation)
injects `X-Admin-Secret` server-side, exactly like every other admin action.

```
GET  /apps/ss/relay/store/{handle}/fundraising   → load current state
POST /apps/ss/relay/store/{handle}/fundraising   → save / launch / stop
```

The relay forwards to studio-uploader:

```
GET  {STUDIO_UPLOADER}/api/fundraising/{handle}
POST {STUDIO_UPLOADER}/api/fundraising/{handle}     (requires X-Admin-Secret)
```

---

## Status (what's built)

**Phase 1 — persistence — DONE and live in code:**
- `studio-uploader` serves `GET/POST /api/fundraising/{handle}` (in `app.py`).
- `Printful_Automation` relays `GET/POST /relay/store/{handle}/fundraising`
  → studio-uploader, injecting `X-Admin-Secret`.
- The metaobject definition is **auto-created on first call** — you do not need
  to create it by hand in the Shopify admin.
- The wizard's Launch and Stop persist authoritatively to the metaobject;
  reopening the admin reflects server state.

**Phase 2 — money movement — NOT built yet:** product reprice on launch /
revert on stop, the order-paid webhook that grows `total_raised`, the 7-day
escrow ledger, batched weekly Stripe payouts, and Stripe Connect onboarding.
See §3 and §5.

## 1. Shopify metaobject

One singleton metaobject per store, keyed by the store handle. Created
automatically by `_ensure_fundraising_definition()` in studio-uploader.

- **Type:** `store_fundraising`
- **Handle:** the store handle (e.g. `westview-baseball`)
- **Storefront access:** `PUBLIC_READ` (so the public progress bar can read it
  via Liquid / the Storefront API later, without the relay)

### Fields

A single JSON field holds the whole state — deliberately schemaless (like
`global_pricing`'s `prices` field) so partial drafts round-trip without
per-field type validation:

| Key    | Type   | Notes |
|--------|--------|-------|
| `data` | `json` | The full state object below |

### `data` shape

```json
{
  "enabled": true,
  "cause_name": "Westview Youth Baseball",
  "amount": 4,
  "goal": 500,
  "end_date": "2026-09-01",
  "show_bar": true,
  "stripe_account_id": "acct_123",
  "stripe_connected": true,
  "setup_step": 5,
  "total_raised": 184.00,
  "created_at": "2026-06-17T18:00:00+00:00",
  "updated_at": "2026-06-17T18:30:00+00:00"
}
```

`total_raised` is owned by the order webhook (phase 2) and is never clobbered by
a wizard save. `base_prices` (price snapshot for exact revert on Stop) will be
added in phase 2 when reprice lands.

> In-progress drafts (before Launch) are still kept in `localStorage`
> (`ss_fr_draft_{handle}`) on purpose — we don't POST to the Shopify Admin API
> on every keystroke (rate limits). The metaobject is the source of truth for
> committed Launch/Stop state; localStorage covers same-browser resume.

---

## 2. Endpoint payloads

### GET response
```json
{
  "ok": true,
  "enabled": true,
  "cause_name": "Westview Youth Baseball",
  "amount": 4,
  "goal": 500,
  "end_date": "2026-09-01",
  "show_bar": true,
  "total_raised": 184.00,
  "stripe_account_id": "acct_123",
  "stripe_connected": true,
  "setup_step": 4
}
```
A store that has never set up fundraising should return `{ "ok": true, "enabled": false }`.

### POST body (launch / update)
```json
{
  "enabled": true,
  "amount": 4,
  "cause_name": "Westview Youth Baseball",
  "show_bar": true,
  "goal": 500,
  "end_date": "2026-09-01"
}
```

### POST body (stop)
```json
{ "enabled": false, "amount": 0, "cause_name": "", "show_bar": false, "goal": 0, "end_date": "" }
```

---

## 3. Backend responsibilities (studio-uploader)

On **launch** (`enabled: true`):
1. Snapshot every product's current price into `base_prices` (so Stop reverts exactly).
2. Add `amount + 1` (cause + $1 fee) to each product price via Admin API.
3. Persist the metaobject.

On **stop** (`enabled: false`):
1. Restore prices from `base_prices`.
2. Set `enabled = false`, clear `total_raised` if desired.

On **order paid webhook**:
1. Count fundraising items, add `amount × qty` to `total_raised`.
2. Record the contribution in an escrow ledger with a 7-day-hold release date.
3. If `total_raised >= goal`, send the "goal met" email (close vs. set new goal).

**Payouts (batched, weekly):** a scheduled job sums all held contributions per
connected account that are past the 7-day hold and issues **one** Stripe transfer
per account on the set payout day — never per-order — to avoid per-transaction fees.

**Stripe Connect:** the wizard's "Connect with Stripe" button needs an endpoint
that creates an Express account + onboarding link and returns the URL to open in
a popup. On return, set `stripe_connected = true` and store `stripe_account_id`.

---

## 4. Frontend behavior already in place

- Wizard is a viewport-contained 5-step flow; each step scrolls internally.
  1. How it works + legal agreement
  2. About Stripe (what it is / what the recipient needs)
  3. Connect with Stripe
  4. Fundraiser details (cause, amount, goal, end date)
  5. Display settings + Launch
- Resume: closing mid-setup and reopening returns to the furthest step reached,
  with Stripe status, terms, amount, cause, goal, date, and visibility restored
  (localStorage). A live fundraiser loaded from the metaobject supersedes any
  local draft.
- Launch and Stop POST through the relay and now persist to the metaobject.

---

## 5. Finish-line checklist

### A. Make persistence live (phase 1 — code is merged)
1. Both services already share `ADMIN_SECRET` (used by sleep/wakeup/nuke). No new
   env var is needed for persistence. Confirm `ADMIN_SECRET` is identical on the
   Printful_Automation and studio-uploader Railway services.
2. Deploy both branches. The `store_fundraising` metaobject definition is created
   automatically the first time the wizard loads or saves — nothing to do in the
   Shopify admin.
3. Test: open Admin Powers → Start a Fundraiser → Launch. Reload the page; it
   should come back as "Active." In the Shopify admin, **Content → Metaobjects →
   Store Fundraising** will show one entry per store.

### B. Stripe (phase 2 — not built yet)

This feature uses **Stripe Connect** (the platform collects on each sale and
routes the cause's share to the recipient's connected account). That means:

1. **Use the platform _Secret_ key, not a publishable/restricted key.** It looks
   like `sk_live_…` (or `sk_test_…` while testing). The publishable key (`pk_…`)
   is client-side only and can't create accounts or transfers. All Stripe calls
   run server-side in studio-uploader, so the secret key lives there as an env
   var (e.g. `STRIPE_SECRET_KEY`) — never in the theme or the browser.
2. **Enable Connect** in the Stripe Dashboard: dashboard.stripe.com → Connect →
   Get started. Choose **Express** accounts. This is what lets recipients onboard
   their own bank without you ever seeing their details.
3. **Set the platform name/branding** under Connect settings (shows on the
   recipient's onboarding screen).
4. Add `stripe` to `studio-uploader/requirements.txt` and set
   `STRIPE_SECRET_KEY` on the studio-uploader Railway service.
5. Build the four Stripe endpoints (all in studio-uploader, behind the relay):
   - `POST /api/fundraising/{handle}/stripe/connect` → create/find an Express
     account, create an account onboarding link, return its URL. The wizard's
     "Connect with Stripe" button opens it in a popup.
   - `GET  /api/fundraising/{handle}/stripe/status` → on popup return, read the
     account; if `details_submitted && charges_enabled`, set
     `stripe_connected:true` + `stripe_account_id` in the metaobject.
   - Order-paid webhook → add `amount × qty` to `total_raised`; write an escrow
     ledger row with a release date 7 days out.
   - Weekly payout job → sum released (past-hold) contributions per connected
     account and issue **one** `Transfer` per account (never per order).
6. Reprice: on Launch, snapshot product prices into `base_prices`, then raise
   each price by `amount + 1`; on Stop, restore from `base_prices`. Reuse
   Printful_Automation's `reprice_products` / `variant_rest_update` helpers.

> Test mode first: with `sk_test_…` and Stripe's test bank numbers you can run
> the whole flow end-to-end with fake money before switching to `sk_live_…`.
