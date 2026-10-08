---
'@veljaos/ui': patch
---

P4.9, fixes from the owner's Storybook review. **Alpha breaking changes:** every message that shows a number now receives it already formatted (`(count, text, …)`; `lifecycle.step` takes both step and total with their texts) and `formatCount` takes `format`; `ShellCompany.waiting` and `messages['shell.waiting']` are removed (use `note`, written by the application); `WorklistItem.actions` is removed (decisions stand in the detail; `checked`, `onCheckedChange`, `bulkBar`).

New: `NotificationsPanel` and `NotificationsPage` with their helpers; a company switcher for thousands of companies (`pinned`, `recent`, `status`, `note`, virtualised, full-screen on phones, "Switch company…" in the command palette); `ReasonConfirmDialog`; `FormGrid`; `RelatedDocuments`, `ActivityList`, `ChangeableValue`; `DetailPage` view and edit mode; `StatusPage` `subject` for a suspended company or account; ListPage `visibleViews` (tabs and More, one select on phones); FilterBar `phoneMenu`; EditableGrid `inCard`; `format.time`; toast actions (Undo); `filter.all` and other messages.

Changed: DueDate shows the date with small tone text instead of a badge; DataTable in a card on phones is a flat list with dividers; the card ends at its last row; side panels share one spacing rule; KeyValueList and form grids take their columns from their own width; one dialog footer rule; launchpad dragging is live, on pointer events; the charts' table view is right in right-to-left; one breadcrumb is not shown; the user menu is neutral.
