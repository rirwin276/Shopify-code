# Storefront appearance builder

This experiment is intentionally additive, minimal, and reversible.

## Persistence

The backend uses one optional JSON field on the existing `custom_shop` metaobject definition:

- Key: `storefront_settings`
- Type: `json`

The save mutation patches only this field. Existing store fields such as name, logo, owner, collection handle, and join settings are preserved.

## Theme behavior

- `storefront-appearance-settings.liquid` appears above Admin Powers and previews the store's existing title, filters, and product cards.
- `private-store-appearance.liquid` does nothing unless `storefront_settings.enabled` is true.
- The only visible options are team colors, an optional announcement bar, and a background behind the existing product area.
- Background choices are Original, Diagonal split, and Team stripe.
- The original Shopify product grid, filters, sorting, product order, and cards are never replaced.
- `private-store-catalog-tools.liquid` is intentionally a no-op in this version; featured rows and category tabs are deferred.

A store with no saved settings remains visually unchanged. Selecting Original with no announcement also leaves the storefront unchanged.

## Rollback

1. Remove `storefront-settings` from `templates/page.admin-powers.json`.
2. Remove `appearance` and `catalog_tools` from `templates/collection.private-store.json`.
3. The optional `custom_shop.storefront_settings` data can remain safely unused.

No existing store field is overwritten by this feature.
