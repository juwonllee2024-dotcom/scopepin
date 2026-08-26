# ScopePin design

## One-line value

ScopePin makes browser AI context explicit: pin one source tab, see its scope inside the AI chat, and block submission after that source becomes stale.

## User flow

1. Open a source page, optionally select an excerpt, and click ScopePin → **Pin this page**.
2. Move to ChatGPT, Claude, Gemini, or Grok. The chat receives a visible scope banner with the source title and selection size.
3. If the source tab navigates or closes, ScopePin changes to **BLOCKED**. Enter and send-button events are stopped until the user deliberately pins a new source.
4. **Copy capsule** places a reviewable Markdown context block on the clipboard. ScopePin never silently injects page text into a prompt.

## Boundaries

- `src/scope-engine.mjs` is pure state logic: normalization, stable selection fingerprint, stale detection, submission decision, and capsule formatting.
- `background/service-worker.mjs` owns the one stored scope and marks it stale when its source tab changes or closes.
- `popup/` uses `activeTab` + `scripting` only after the user clicks Pin; it reads the selected excerpt at that moment.
- `content/content.js` adds the visible banner and blocks common Enter/send-button submission paths on supported AI hosts.

## Explicit non-goals

No API calls, no cloud account, no automatic prompt submission, no arbitrary `<all_urls>` permission, no file-system access, and no claim of OS-level sandboxing. Provider DOM changes can require adapter updates.

## Why this is different

Multi-provider sidebars and browser bridges help an agent reach an AI tab. ScopePin handles the moment before an AI tab is trusted: the user can see what source is pinned, and stale source state becomes a hard stop instead of a silent context change.

