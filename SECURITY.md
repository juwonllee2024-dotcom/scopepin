# Security policy

## ScopePin's security boundary

ScopePin is designed to keep the MVP local and reviewable:

- no network requests or external API keys;
- no `<all_urls>` permission;
- page reading occurs only after the user clicks **Pin this page**;
- selected text is bounded to 12,000 characters;
- the extension never submits a prompt automatically.

This is not an OS-level sandbox. Browser-provider DOM changes can affect the send-action guard, and users should not treat the banner as a complete security guarantee.

## Reporting a vulnerability

Please do not publish credentials, private page contents, or an exploitable proof of concept in a public issue. Contact the repository maintainer through the private security contact configured on GitHub and include:

1. affected version and browser;
2. exact reproduction steps;
3. expected and observed behavior;
4. whether any page content left the browser.

Do not include real secrets in reports. We will acknowledge a report when practical and coordinate a fix or mitigation before public disclosure.
