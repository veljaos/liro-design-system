---
'@veljaos/tokens': patch
'@veljaos/ui': patch
---

P3.6: polish from the owner's review. `@veljaos/tokens`: `surface.selected` is neutral (gray2 / `#363636`, was blue) and the new `border.selected` (gray7 / gray4, utility `border-selected`) marks a selection. `@veljaos/ui`: selected rows and cards, the sorted header, BulkActionBar and PersonAvatar are neutral; every text block takes its direction from its content (`unicode-bidi: plaintext`); `Alert` and `Banner` default to a bordered `neutral` tone (`tone` is optional); MultiSelectField clears its search after a choice and has a one-line `summary` mode; EditableGrid shows line cards with sticky totals on phones; FilterBar: one-line inline multiSelect, "From" / "To" labels and an optional `currency` on number ranges, actions wrap above; FormActions shows the bottom bar only while the top actions are out of view; FormTabs is the form card; DataTable's refetch loader stands above the table with "Updating…"; new `Spinner` and `Accordion`. **Breaking (alpha):** messages `filter.rangeFrom` and `filter.rangeTo` are replaced by `filter.from` and `filter.to`; new messages `field.selectedCount` and `table.updating`.
