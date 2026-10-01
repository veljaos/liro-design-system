---
'@veljaos/ui': patch
---

P3.2: `DataTable` on phones, long lists and resizable columns. Below 48em the rows are cards (only the cards are rendered), described by `mobile` (title, subtitle, badge, detail columns); `layout` forces the table or the cards. `virtualize` draws only the rows in view (44px rows, sticky header; cards measured), with `aria-rowcount` / `aria-rowindex`. `resizable` columns (`width`, `minWidth`, `resizable`, `label`; `onColumnWidthsChange`): the handle at the header's end, arrow keys (10px, Shift 40px, in the reading direction), and a popover with "Narrower" / "Wider" for resizing without dragging; widths 64–640px, text cut with an ellipsis. Helpers `clampWidth`, `widthAfterKey`, `widthAfterDrag` and the limits. New messages `table.resizeColumn`, `table.narrower`, `table.wider`.
