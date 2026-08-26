# ScopePin v0.1.0 verification capsule

Date: 2026-08-25  
Artifact: local `dist/scopepin-extension` bundle  
Repository: https://github.com/juwonllee2024-dotcom/scopepin  
Policy: only the verified source, documentation, and CI configuration were committed and pushed.

## Automated checks

The following commands were run from the `scopepin` directory:

```text
npm ci
npm run verify
npm audit --audit-level=high
git diff --check
```

Recorded result: `npm ci` completed with 0 vulnerabilities; `npm run verify` passed 7 tests, syntax checks, and built 8 extension files; `npm audit --audit-level=high` reported 0 vulnerabilities; `git diff --check` reported no whitespace errors. A separate source scan found no trailing whitespace in 22 candidate files.

## Real input → result smoke record

Input:

```text
source tab 42
URL https://example.com/article#comments
title An article
selection "  Keep this excerpt.  "
```

Expected result:

```text
URL https://example.com/article
selection "Keep this excerpt."
staleReason null
```

The same engine then reports `SOURCE_URL_CHANGED` for a navigation to another page and returns `ok: false` for submission. The capsule remains reviewable Markdown; it is never submitted by the extension.

Observed output:

```text
selectedHash b2d01061
normalizedUrl https://example.com/article
staleCode SOURCE_URL_CHANGED
canSubmit false
capsule [ScopePin v1] ... [/ScopePin]
```

Bundle file count: 8 extension files plus `BUILD.txt`.  
SHA-256: `dist/scopepin-extension/manifest.json` = `c5276ba2f9fce635168a07bf9b5ac2944f05399714012fb8759ee3c67c0d851d`.

## Published verification

- Initial MVP commit: `c7a1108`
- CI workflow commit: `e374f26`
- CI run: [32914609622](https://github.com/juwonllee2024-dotcom/scopepin/actions/runs/32914609622) — passed
- Release: `v0.1.0` — published after CI passed

## Manual browser check still required

Load `dist/scopepin-extension` through `chrome://extensions` and run [the first-user scenario](../../examples/first-user-test.md) in each supported provider. Provider DOM selectors may change independently of the pure engine tests.
