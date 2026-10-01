---
'@veljaos/ui': patch
---

P3.2a: fixes from the owner's review. Option and menu items are border-box, so ComboboxField, MultiSelectField, SelectField, DropdownMenu and CommandPalette lists never scroll sideways. ConfirmDialog's button always follows the dialog's tone (`confirmFamily`; without an action, warning → caution, danger → destructive, info → primary, success → positive, neutral → neutral). Every field puts its control 4px under the label block, with or without a description. **Breaking (alpha):** SectionCard has no `withDivider` and draws no line under its header; KeyValueList's default layout is "rows" (label at the start, value at the end, lines between rows), with `layout="stacked"`, `groups` (`KeyValueGroup`) and `columns` 1–3 (4 removed); labels are never upper case. New export `keyValueLines`.
