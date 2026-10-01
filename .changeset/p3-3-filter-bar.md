---
'@veljaos/ui': patch
---

P3.3: `FilterBar` — search at the start (260px, clear button, reported after 300ms), filters beside it, actions at the end. Six kinds (select, multiSelect, dateRange, numberRange, boolean, text); the first `inline` filters stand in the row with labels above, the rest in a drawer from the end (320px); active filters that are not inline as removable pills with "Clear all"; on phones every filter in the drawer and a "Sort" menu (`sort`, `sortColumns`, `onSortChange`). Controlled: it only reports `values`, the search and the sort. Helpers `isFilterSet`, `emptyFilterValue`, `clearFilters`, `filterValueText`, `rangeText`, `sortButtonText`. `SelectField` gains `clearable`. New messages `field.clear` and `filter.*`.
