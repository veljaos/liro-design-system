---
'@veljaos/tokens': major
'@veljaos/ui': major
'@veljaos/eslint-config': major
---

1.0.0, the first stable release of the Liro Design System.

- **What it is:** the tokens, components and page templates of 0.1.0-alpha.5. The API is unchanged since then; this release makes it stable. From now on a breaking change raises the major version, and releases are published under the `latest` dist-tag.
- **Upgrading from an alpha:** follow the release notes of 0.1.0-alpha.5 below (removed templates and print parts, read only instead of `disabled`, `unavailableReason`, renamed props), then the earlier alpha entries if you come from further back.
- **What changed since 0.1.0-alpha.5** (no change to the published code's behaviour):
  - every component with text keeps an Arabic and a Japanese story, checked in CI, and Serbian Latin and Cyrillic were checked across the catalogue;
  - a performance budget: the list and document example screens stay under 250 KB of JavaScript and 160 KB of CSS (gzip);
  - comments in the code say what it does, without history;
  - the documentation is short rule documents by subject in `docs/`, a README and a slim AGENTS.md.
