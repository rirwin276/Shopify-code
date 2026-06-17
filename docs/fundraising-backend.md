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

## 1. Shopify metaobject

Create a metaobject definition (same pattern as `global_pricing`). One entry
per store, keyed by the shop handle.

- **Type:** `store_fundraising`
- **Handle:** the shop handle (e.g. `westview-baseball`) — one singleton per store

### Fields

| Key                  | Type                  | Notes |
|----------------------|-----------------------|-------|
| `enabled`            | `boolean`             | Is the fundraiser live right now |
| `cause_name`         | `single_line_text`    | Shown on storefront + admin |
| `amount`             | `number_integer`      | Dollars per item to the cause (1–8) |
| `goal`               | `number_decimal`      | Optional goal; 0/empty = no goal |
| `end_date`           | `date`                | Optional; max 1 year out |
| `show_bar`           | `boolean`             | Public progress bar vs admin-only |
| `total_raised`       | `number_decimal`      | Running total, updated by order webhook |
| `stripe_account_id`  | `single_line_text`    | Connected Express account (`acct_…`) |
| `stripe_connected`   | `boolean`             | True once onboarding completes |
| `setup_step`         | `number_integer`      | Resume position (1–4) before launch |
| `base_prices`        | `json`                | Snapshot of product prices BEFORE markup, so Stop can revert exactly |
| `created_at`         | `date_time`           | First launch timestamp |

> The wizard currently saves an in-progress draft to `localStorage`
> (`ss_fr_draft_{handle}`) so resume works today without a backend. Once the
> metaobject + endpoint exist, mirror the same shape server-side and the draft
> becomes the authoritative `setup_step` / `stripe_connected` source.

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

- Wizard is viewport-contained; each step scrolls internally.
- Resume: closing mid-setup and reopening returns to the furthest step reached,
  with Stripe status, terms, amount, cause, goal, date, and visibility restored.
- Launch and Stop are **best-effort** against the endpoint above — the UI renders
  the active/empty state regardless so the flow is reviewable before the backend
  ships. Wire the endpoint and the same calls become authoritative.
