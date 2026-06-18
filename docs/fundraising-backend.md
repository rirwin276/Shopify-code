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

### B. Phase 2 — money mechanics (CODE NOW BUILT)

All of this is implemented in `studio-uploader/app.py` + relayed through
`Printful_Automation/app.py`. What remains is **configuration and registration**,
not coding.

**What the code does now:**
- **Repricing** — on Launch, every active variant for `tag:{handle}` is
  snapshotted into the metaobject's `base_prices` and raised by `amount + $1`;
  on Stop it's restored exactly. Idempotent, keyed on `markup_add`, runs in a
  background thread off the launch/stop POST.
- **Stripe Connect (Express)** —
  `POST /api/fundraising/{handle}/stripe/connect` creates/reuses the recipient's
  Express account (transfers capability) and returns a hosted onboarding URL;
  `GET .../stripe/status` re-checks `details_submitted && payouts_enabled` and
  persists `stripe_connected`. The wizard's Step 3 button now drives this and
  redirects to Stripe, returning to `?fr_stripe=return`.
- **Order-paid webhook** — `POST /webhooks/fundraising/order-paid` (Shopify
  HMAC, `SHOPIFY_WEBHOOK_SECRET`) attributes `amount × qty` to each
  fundraiser-active store tag on the order, grows `total_raised`, appends an
  escrow ledger row (idempotent per order id), and emails on goal-met.
- **Weekly payouts** — `POST /api/fundraising/payouts/run` (`X-Cron-Secret`)
  sums unpaid ledger rows past the 7-day hold per store and issues **one**
  Stripe `Transfer` per connected account, then marks rows paid.
- **Public progress bar** — `GET /api/fundraising/{handle}/public` (no auth,
  display-safe fields) feeds the drop-in `sections/fundraiser-bar.liquid`.

**Setup runbook — do these to turn it on:**

1. **Env vars (Railway):**
   - `studio-uploader`: `STRIPE_SECRET_KEY` (✅ you set this — use `sk_test_…`
     first), `SHOPIFY_WEBHOOK_SECRET` (for the order webhook), `CRON_SECRET`
     (for the payout job), and `SMTP_HOST/SMTP_PORT/SMTP_USER/SMTP_PASS/
     NOTIFY_EMAIL` (for goal-met email — may already be set).
   - `ADMIN_SECRET` identical on both services (already true if nuke works).
   - Do NOT put `STRIPE_SECRET_KEY` on Printful_Automation or in the theme.
2. **Stripe Dashboard:** Connect → Get started → enable **Express** accounts;
   set platform name/branding. Start in **test mode**.
3. **Register the order webhook:** Shopify admin → Settings → Notifications →
   Webhooks (or via API): topic **Order payment** (`orders/paid`), format JSON,
   URL `https://<studio-uploader>/webhooks/fundraising/order-paid`. The webhook
   signing secret Shopify shows you is the `SHOPIFY_WEBHOOK_SECRET` value.
4. **Schedule payouts:** add a Railway Cron (weekly) that POSTs to
   `https://<studio-uploader>/api/fundraising/payouts/run` with header
   `X-Cron-Secret: <CRON_SECRET>` (same shape as `cron_sleep_check.py`).
5. **Progress bar:** in the theme editor, add the **Fundraiser Bar** section to
   the collection template (it auto-detects the collection handle).
6. **Deploy** all three `claude/dazzling-turing-76cjur` branches.

**Test order (test mode):**
1. Start a fundraiser on a **test store** handle, connect Stripe with Stripe's
   test onboarding, Launch.
2. Confirm products under `tag:{handle}` went up by `amount + $1`; confirm the
   metaobject has `base_prices` + `markup_add`.
3. Place a test order on a fundraiser product → the webhook should grow
   `total_raised` and add a ledger row.
4. Hit the payout endpoint manually with the cron secret; with the 7-day hold
   you'll see `transferred: 0` until rows age (or temporarily set
   `FUNDRAISING_HOLD_DAYS=0` on studio-uploader to test a real transfer).
5. Stop → confirm prices restore exactly to base.

> Only after the whole flow is clean in **test mode**, switch
> `STRIPE_SECRET_KEY` to `sk_live_…` and re-test once on a real low-risk store.

### Still open / nice-to-have
- One order can contain items from multiple sub-stores; the webhook handles
  that (per-tag attribution). If a product carries more than one
  fundraiser-active store tag, the contribution is counted for each — keep
  store tags clean.
- `base_prices` lives in the metaobject JSON; for very large catalogs consider a
  per-variant metafield instead.
- Refund/chargeback reversal of ledger rows is not handled yet.
