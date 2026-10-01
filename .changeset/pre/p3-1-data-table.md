---
'@veljaos/ui': patch
---

P3.1: `DataTable` on TanStack Table 9, fully controlled — columns (alignment, tabular digits, sortable headers with `aria-sort`), `sort`/`onSortChange` (ascending, descending, ascending again), `filters`/`onFiltersChange` (empty state versus "no rows match" with "Clear filters"), selection with `BulkActionBar`, row press and row actions menu, totals row from props (sticky), count through `formatCount` (exact up to 10,000), cursor paging, skeleton first load and refetch loader, row-limit message and export slots. Helpers `formatCount`, `hasActiveFilters`, `isActiveFilterValue`, `nextSort`, `ariaSort`, `COUNT_THRESHOLD`. New messages `table.clearFilters`, `table.selectAll`, `table.selectRow`, `table.rowActions`.
