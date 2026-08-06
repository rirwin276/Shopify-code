# Storefront appearance builder

This experiment is intentionally additive and reversible.

## Persistence

The backend adds one optional JSON field to the existing `custom_shop` metaobject definition:

- Key: `storefront_settings`
- Type: `json`

It stores a versioned object containing colors, style, pattern, storefront messages, and catalog display toggles. The save mutation patches only this field; existing `custom_shop` fields are preserved.

## Theme integration

- `storefront-appearance-settings.liquid` is the visual builder shown above Admin Powers.
- `private-store-appearance.liquid` applies saved colors, patterns, and messages only when `enabled` is true.
- `private-store-catalog-tools.liquid` adds the optional featured row and conditional product tabs.

Stores without enabled settings keep the current storefront unchanged.

## Rollback

1. Remove `storefront-settings` from `templates/page.admin-powers.json`.
2. Remove `appearance` and `catalog_tools` from `templates/collection.private-store.json`.
3. Remove the backend route installer from `runtime_app.py`.

The optional `custom_shop.storefront_settings` data can remain safely unused or the field can be removed later through Shopify custom data settings. No existing store field is overwritten by this feature.
