---
'@veljaos/ui': patch
---

P3.4: `EditableGrid` — the lines of a document or journal entry, entered from the keyboard. Cells are the Design System's fields (text, number, select, combobox, date) without frames, or values the application shows; Enter goes down the column and adds a line after the last, Shift+Enter goes up, Ctrl/Cmd+Enter inserts and Ctrl/Cmd+Delete removes a line (`minRows`, `maxRows`); on phones Enter goes through the row. Errors and warnings from `messages` stand under their row; `totals` are shown with SettlingValue. Controlled: `onCellChange`, `onAddRow`, `onRemoveRow`. Helpers `gridKeyAction`, `orderMessages`. Fields gain `describedBy`. New messages `grid.*`.
