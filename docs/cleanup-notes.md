# Cleanup Notes

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
