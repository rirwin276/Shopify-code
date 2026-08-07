# Storefront appearance builder

This experiment is intentionally additive, minimal, and reversible.

## Persistence

The backend uses one optional JSON field on the existing `custom_shop` metaobject definition:

- Key: `storefront_settings`
- Type: `json`

The save mutation patches only this field. Existing store fields such as name, logo, owner, collection handle, and join settings are preserved.

## Admin Powers placement

- `storefront-appearance-settings.liquid` is rendered by the Admin Powers page template.
- Its JavaScript moves the designer card into the top of the existing **Settings** tab before the store-name and logo controls.
- The card is hidden until it is mounted, so it does not flash above the Admin Powers hero.
- After a successful save, the admin sees a confirmation telling them to allow up to one minute for the storefront to update, then the designer closes back to Settings.

## Storefront behavior

- `templates/collection.private-store.json` remains identical to the live template structure.
- The existing `private-store-collection` hero remains the source of truth for the logo, title, admin/member access, and buttons.
- Admin-only Share Store and Admin Powers controls remain admin-only. Member storefronts retain only their appropriate shopping/dashboard controls.
- `main-collection.liquid` reads the optional settings and applies a light color tint to the existing hero without replacing its layout.
- The only visible options are primary/accent colors, an optional compact announcement, and an optional background behind the existing product area.
- Background choices are Original, Diagonal split, and Team stripe.
- The original Shopify product grid, filters, sorting, product order, and cards are never replaced.
- Stores without enabled settings remain visually unchanged.

## Rollback

1. Remove `storefront-settings` from `templates/page.admin-powers.json`.
2. Revert the appearance additions in `sections/main-collection.liquid`.
3. The optional `custom_shop.storefront_settings` data can remain safely unused.

No existing store field is overwritten by this feature.
