# Contributing to ScopePin

Thanks for testing a small, privacy-first idea.

## Before opening a change

1. Read [docs/design.md](docs/design.md) and preserve the explicit-scope boundary.
2. Keep new permissions, network access, automatic submission, and provider-specific behavior clearly justified.
3. Add or update a test before changing the implementation.
4. Run `npm run verify`, `npm audit --audit-level=high`, and `git diff --check`.

## Pull requests

Describe the user pain, the smallest changed behavior, the privacy impact, and how you tested it. Screenshots or a short reproduction are useful for provider DOM changes. Please do not include real page contents, credentials, or tracking code.
