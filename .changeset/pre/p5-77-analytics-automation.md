---
'@veljaos/ui': minor
---

P5.77–P5.81, Group D (analytics and automation):

- New subpath `@veljaos/ui/pivot` (P5.77), built on TanStack Table: `Pivot` — the user chooses rows, columns, values with their aggregation and filters (buttons and menus, no dragging; a sheet on phones) and the application computes the result, which the pivot lays out as a treegrid with multi-row headers, row groups, subtotals and totals, sticky header and first column, keyboard navigation, drill-down (`onDrillDown`) and export (`exportAction`); its layout and result helpers. Messages `pivot.*`.
- New: `RuleBuilder` (P5.78) — an automation rule's "When / If / Then" from the application's triggers, fields, tests and actions, with groups, keyboard reordering, problems and the rule in words; its helpers. Messages `rule.*`.
- ValueComparison (P5.79): `chosen` and `onChoose` choose the values to keep when two records are merged; `chosenCounts`. Messages `comparison.chosenCount`, `comparison.choose`, `comparison.chosen`.
- New: `DashboardGrid` (P5.81) — cards the user adds, removes, resizes and rearranges (drag, the keyboard on each card's handle, or its menu; phones by the menus), with its pure layout helpers. Messages `dashboardGrid.*`.
