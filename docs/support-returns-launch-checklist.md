# Support and returns launch checklist

## Deployment order

1. Merge and deploy `Printful_Automation` PR #207.
2. Confirm these routes return successfully:
   - `/support/health`
   - `/public/catalog`
3. Confirm Railway has working mail settings. The support service accepts the same aliases already used by the build-alert mailer:
   - `SMTP_USER`
   - `SMTP_PASSWORD` or `ALERT_SMTP_PASS`
   - `ALERT_EMAIL_TO`, `BUILD_ALERT_EMAIL_TO`, `SMTP_TO`, or the optional `SUPPORT_EMAIL_TO`
4. Merge this theme PR only after the API is live.

## Shopify Theme Editor

Open the page using the storefront explainer template, then open the **Personalization showcase** section.

Upload the real checkout screenshot in:

- **Checkout name-and-number screenshot**

The placeholder is intentional and remains visible until this image is selected.

## Shopify policies

In **Settings → Policies**, review and publish:

- Refund policy
- Shipping policy
- Privacy policy
- Terms of service

Recommended made-to-order rules:

- Damaged, defective, misprinted, missing, or incorrect items should be reported with photos.
- Personalized products are final sale unless damaged or produced incorrectly.
- Size, color, or change-of-mind requests are not automatically eligible for a free replacement.
- Production and delivery estimates are not guaranteed event-arrival dates.

The theme footer links directly to the Shopify policy URLs.

## Shopify self-serve returns

Enable self-serve returns in Shopify customer-account settings. Copy the dedicated customer-account return URL and place it in the Support Center section's **Return portal or account URL** setting. Until then, the section safely falls back to `/account`.

Do not switch the entire storefront login system without testing private-store customer tags and dashboard access first.

## Shopify Flow recipes

Keep refunds manual. Use Flow only for routing and visibility.

Suggested workflows:

1. **Return requested**
   - Add order tag `return-requested`
   - Send an internal notification
2. **Return approved**
   - Add order tag `return-approved`
3. **Return processed**
   - Add order tag `return-processed`
   - Send an internal completion notice
4. **Return closed**
   - Add order tag `return-closed`

The custom support form separately adds `support-open`, an issue-specific tag, and a case-number tag to verified Shopify orders.

## Test before announcing

Use a real or test order and verify:

- The order number and checkout email match successfully.
- Up to four photos reach the support email.
- The owner receives the case email.
- The customer receives an acknowledgement for a verified order.
- Shopify receives the support tags and `custom.latest_support_case` metafield.
- The public catalog opens each product popup.
- Every product displays color swatches and names on hover and keyboard focus.
- Product-page made-to-order guidance appears beneath the buy buttons.
- The cart event-date warning appears above checkout.
