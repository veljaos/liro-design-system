---
'@veljaos/ui': patch
---

P4.4: new templates `DetailPage` and `RecordFormPage` (back button, key figures, sections, side column 300px from 75em, an optional sticky section bar; the record form's actions at the top and in the bottom bar with the unsaved-changes guard on back), new components `KeyFigures` and `SectionBar`; PageHeader gains `back`, `status` and `subtitle`, and `BackButton` is exported. New messages `page.backTo`, `page.sections`. Links (lockup, breadcrumbs, module tabs, section bar, launchpad cards, back button, skip link) set their colour for every state, never the browser's visited colour. DataTable `inCard`: no gap of its own above the table.
