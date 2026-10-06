---
'@veljaos/ui': patch
---

P4.3: new templates `ListPage` (saved views, one list card, hidden title by default), `WorklistPage` (list and detail side by side from 62em, Back / Next item below), `PageHeader` (`titleHidden`), `ColumnChooser` and `QuickPreview`. DataTable: `inCard`, `onRowOpen` (Enter opens the record while click and Space keep `onRowClick`), and Space presses a row. AppShell publishes its sticky top's height as `--liro-shell-top`. New messages `list.views`, `columns.*`, `preview.open`, `worklist.*`. Fixes: StatusBadge labels and DateText take their direction from their own text in right-to-left pages.
