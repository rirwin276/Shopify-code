# Shopify-code

This repo holds Shopify theme code for Stella & Sage storefront pages, dashboard pages, and admin pages.

## Cleanup workflow

We are cleaning the live theme in small safe steps.

1. Change one file or one section at a time.
2. Test the live page after each change.
3. Keep existing access working before removing old compatibility paths.
4. Document the purpose of important files as they are cleaned.

## Important file: sections/admin-powers-page.liquid

This section renders the store admin control page at `/pages/admin-powers?shop=<store-handle>`.

It currently handles:

- Store admin page layout
- Member management UI
- Product management UI
- Add-product builder UI
- Store settings UI
- Store sleep/delete UI
- Product editor iframe behavior
- Calls to backend Railway services

The cleanup goal is to make this file easier to understand without changing the current user experience.

## Safe test after changes

After changing the admin page, test:

1. Open an existing admin page while logged in as the owner account.
2. Confirm the Products tab loads.
3. Confirm Share Store opens.
4. Confirm the Dashboard button works.
5. Confirm a normal store admin can still open their own store admin page.
6. Confirm a normal member cannot manage a store they do not admin.

## Do not break

- Existing owner access
- Existing store admin access
- Existing member shopping access
- Product editing links
- Share/join links
- Dashboard return link
- Product loading
