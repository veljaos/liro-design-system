---
'@veljaos/tokens': patch
'@veljaos/ui': patch
---

P4.1: new template `AppShell` (with `ModuleTab`, `ShellCompany`, `ShellCompanies`, `ShellUser`, `ShellNotifications`, `matchingCompanies`, `COMPANY_SEARCH_THRESHOLD`): the 56px header with the brand lockup, breadcrumbs, search (opens the CommandPalette), notifications dot, company switcher and user menu; centred module tabs; slots for the impersonation bar, environment marker and offline indicator; on phones the bottom action bar with safe-area insets. New messages `shell.*`. `@veljaos/tokens`: new meaning `text.logo` (#0078D4 / #3EACEB, utility `text-logo`); BrandLockup uses it. CommandPalette group headings are in normal case (xs, semibold).
