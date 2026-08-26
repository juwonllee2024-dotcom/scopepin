# First-user test: stale source stop

## Scenario

1. Open a documentation page in one tab.
2. Highlight one sentence and click **📌 Pin this page**.
3. Open ChatGPT, Claude, Gemini, or Grok in another tab.
4. Confirm the green **ScopePin LIVE** banner.
5. Return to the source tab and navigate to a different page.
6. Return to the AI tab and press Enter in the composer.

## Expected result

The banner is red, the send attempt is blocked, and the user sees a reason to pin the new source. No prompt is submitted automatically and no page content is sent to a server by ScopePin.

## What to record

- Browser and provider.
- Whether the user understood LIVE/BLOCKED without explanation.
- Whether the block prevented a real mistake.
- Whether the user would keep the extension installed.
