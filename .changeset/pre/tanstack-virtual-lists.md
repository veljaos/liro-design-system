---
'@veljaos/ui': patch
---

P5.21a: the company switcher, `LookupField`, `MatchingView` and `EditableGrid`'s row window run on TanStack Virtual (`useVirtualizer`), as `DataTable` does, with the shared window rules: the rows in view and 600px around them (the company switcher and LookupField drew 240px before), the focused line or the active option always drawn, the keyboard's active option scrolled into view with `scrollToIndex`. Nothing changes in the props, the markup's roles or the look.
