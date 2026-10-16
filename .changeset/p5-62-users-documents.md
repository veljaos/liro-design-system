---
'@veljaos/ui': patch
---

P5.62–P5.71, Group B (users, HR, documents and governance):

- New: `DefinedForm` — a form drawn from the application's field definitions (sections, field types, required, `visibleWhen` / `requiredWhen` conditions), with the handle's `check()`, the application's `errors`, `readOnly`, `lang` and a `custom` field; its pure helpers (`definedFormState`, `definedConditionHolds`, `definedFormProblems`, …) and the messages `definedForm.fill`, `definedForm.choose`, `definedForm.tick`.
- SettingsPage: a section may hold a block after its rows (`content`), such as the signed-in devices.
- SelectField, ComboboxField and MultiSelectField options take `lang`: a language written in its own name keeps it in the list and once chosen.
- DateField: the typed and read-only date takes its direction from its text (`dir="auto"`, at the page's start), as DateRangeField: a Serbian date keeps its full stop at the end in a right-to-left page.
