---
'@veljaos/ui': minor
'@veljaos/tokens': patch
---

P5.23, the owner's review of Phase 5 part 1.

- New: `CandidateList` (`Candidate`, `chooseCandidate`), `DocumentSource` (`DocumentSourceItem`), DocumentPage `source`, `worklistPosition`, `compactStep`, `hasMessage`, `DESCRIPTION_MIN_WIDTH`, `DataTableHandle` (`ref.revealRow(id)`).
- WorklistPage: a decision bar (position, Previous, Next, `detailActions`) and `back`, `status`, `subtitle`, `summary`, `onPrevious`.
- Dialog and ConfirmDialog `size: 'wide'`; ConfirmDialog `preview`. Banner `role`.
- `ChangeableValue.field` optional (a read-only header value). Tabs put one 16px gap above their panel. An Alert with only a title is compact; Banner uses the same one-line padding.
- BulkActionBar is a row of its own with standard buttons. Stepper, FormWizard and ImportWizard phone layouts (compact stepper, one sticky footer row, Cancel as a header close button with a leave confirmation). LookupDialog `sort` / `onSortChange`; `UnavailableAction.reasonId`.
- RegisterPage: correction links both ways, `onGoToEntry`, its own card spacing; DataTable `minWidth` holds without resizing, `loaderSlot`.
- CancellationBanner is danger by default and says "Cancelled" once.
- Breaking (alpha): `MatchingView` and its logic exports and `matching.*` messages removed; `UnavailableAction.small` removed.
- Messages: new `worklist.previous`, `worklist.position`, `candidates.empty`, `stepper.step`, `import.cancel`, `import.leaveTitle`, `import.leaveMessage`, `document.sourceDate`, `document.sourceTotal`; `document.cancelledBy` now writes the part after the title.
- Tokens: contrast checks for text and links on every tone background.
- Initial states, so every look can be rendered directly (P5.23, visual stories are static): `defaultOpen` on DateField, DateRangeField, MonthField, PeriodField, DropdownMenu, SplitAction and Tooltip; `defaultQuery` on ComboboxField, MultiSelectField, LookupField and CommandPalette; FilterBar `defaultFiltersOpen`; Questionnaire `defaultStep`; AppShell `defaultOpenMenu`; the charts' `defaultView` ('chart' or 'table').
- A steady view: when content shrinks at the end of WorklistPage's detail (both layouts), a Dialog's or Drawer's body or a confirmation's body, what is in view no longer moves.
