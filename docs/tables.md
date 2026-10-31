# Tables and grids

- DataTable is controlled: it never sorts, filters or sums. Sort cycles ascending → descending →
  ascending; counts above 10,000 read "More than 10,000".
- First load shows skeleton rows; a refetch keeps the rows with a thin loader and "Updating…".
- Below 48em the rows are cards (`mobile`); `virtualize` draws only what is in view.
- Columns resize by drag, by the arrow keys on the handle, or by a Narrower / Wider popover
  (64–640px). `minWidth` holds without resizing.
- Pressable rows move with ArrowDown / ArrowUp, Home and End (`rowFocusTarget`).
- Every table, grid and schedule header is ONE sticky band under the shell: `STICKY_HEAD` on the
  header group (`data-sticky-head`), never on its cells; totals likewise a sticky `tfoot`. The band
  follows the page in pure CSS (a scroll-driven animation), no script on scroll.
- The first column stays at the start while the grid scrolls sideways (`STICKY_START`, its own
  layer on whole pixels, on an opaque surface; `STICKY_START_AFTER_SELECT` after a selection
  column). The region carries `STICKY_CLEARANCE` so a cell reached by the keys is never hidden.
- No box between a sticky region and the page's scroller is `overflow: hidden` (cards clip with
  `overflow: clip`).
- EditableGrid: lines entered from the keyboard; cells are the library's fields without frames;
  Enter goes down the column and adds a line after the last; Ctrl/Cmd+Enter inserts,
  Ctrl/Cmd+Delete removes; messages under their line; totals from props (SettlingValue). Optional
  columns (a line's discount) appear when used. Phones: one card per line, totals after the cards.
- A changing value stays still while it settles; a dot after 300ms in a reserved slot
  (SettlingValue).
- An official form is its real grid: groups over sub-columns, numbered collapsible sections, absent
  cells blank (never 0, never a disabled field), entered / computed / source cells (a source opens
  its documents), the previous period under each value. Phones: one card per row, each value
  labelled with its group and column.
- A register is chronological: numbered, never deleted, corrections linked both ways, locked
  periods with a reason (RegisterPage).
- A tree is the WAI-ARIA tree (TreeTable a treegrid): arrows mirror in right-to-left, type-ahead,
  lazy children with loading and error rows; it computes nothing.
