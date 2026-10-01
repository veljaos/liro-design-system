---
'@veljaos/ui': patch
---

P3.5: form layout. `FormSection` (the SectionCard card with a 1–3 column field grid, `FormFullWidth`, a `collapsible` variant), `FormTabs` (a tab with errors shows a danger warning icon and is named "… — has errors"), `FormActions` (actions at the top and a sticky bottom bar while the form scrolls, `stickyActions`, "Unsaved changes" with `dirty`), `useUnsavedChangesGuard`, `FormWizard` (checked steps, Back keeps the data) and `focusFirstInvalid` (selects the tab or opens the section with the first error and focuses it). New subpath **`@veljaos/ui/form`**: the fields bound to React Hook Form (optional peer dependency `react-hook-form` 7.89.0). New messages `form.*` and `wizard.*`.
