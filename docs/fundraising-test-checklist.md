# Fundraising Test Checklist

## Before testing

- Confirm Shopify-code draft theme is using `claude/dazzling-turing-76cjur`.
- Confirm Printful_Automation Railway is deployed from `claude/dazzling-turing-76cjur`.
- Confirm studio-uploader Railway is deployed from `claude/dazzling-turing-76cjur`.
- Confirm ADMIN_SECRET matches on Printful_Automation and studio-uploader.
- Confirm STRIPE_SECRET_KEY is test mode and only on studio-uploader.
- Confirm SHOPIFY_WEBHOOK_SECRET is set on studio-uploader before webhook testing.
- Confirm CRON_SECRET is set before payout testing.

## Frontend-only test

- Open draft Admin Powers page.
- Open fundraiser wizard.
- Complete Step 1 legal checkbox.
- Review Step 2 Stripe explanation.
- Confirm Step 3 does not lose `?shop=`.
- Enter cause, amount, goal, date.
- Confirm draft resumes after closing/reopening.
- Do not click Launch until backend is ready.

## Stripe test

- Click Connect with Stripe.
- Complete Stripe Express test onboarding.
- Confirm return URL still contains `?shop=`.
- Confirm wizard detects status.
- Confirm Stripe account ID is saved.

## Manual price backup before repricing test

Before clicking Launch on any test store:

- Export or screenshot all product variant prices in the test store.
- Confirm the test store has only disposable products.
- Confirm no real customer orders are expected during the test.
- Confirm you know how to manually restore prices in Shopify admin if the automatic restore fails.

## Launch test

- Use a throwaway test store with test products.
- Launch fundraiser at $1 amount.
- Confirm backend returns ok.
- Confirm pricing_status becomes pending.
- Confirm pricing_status becomes succeeded.
- Confirm product prices increased by $2 total ($1 fundraiser + $1 platform fee).

## Stop test

- Stop fundraiser.
- Confirm backend returns ok.
- Confirm pricing_status becomes pending.
- Confirm pricing_status becomes succeeded or skipped.
- Confirm product prices restore exactly to base_prices.

## Order-paid webhook test

- Send a Shopify orders/paid test payload.
- Confirm HMAC verification passes.
- Confirm total_raised increases by amount × quantity.
- Confirm ledger row is added.
- Confirm duplicate order ID does not double count.

## Payout test

- Use test Stripe balance.
- Run payout endpoint with test CRON_SECRET.
- Confirm insufficient balance skips safely.
- Confirm sufficient balance creates one transfer.
- Confirm ledger rows are marked paid only after transfer succeeds.

## Public progress bar test

- Add Fundraiser Bar section to collection template.
- Enable public progress.
- Confirm bar appears.
- Turn show_bar off.
- Confirm bar hides.
