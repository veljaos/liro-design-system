# P5.19/P5.20 — one row window for long lists (measured)

The owner's request after group E: the 5,000-entry register and the 50,000-record catalogue felt
slow (group E measured a 2,000px scroll jump at up to 3.4 s with 4× CPU throttling, selecting a
row up to 1.07 s, switching view up to 1.76 s; `group-E.md` section 6). This note records what
was changed, why, and the numbers before and after.

## 1. What changed

1. **One set of window rules** (`packages/ui/src/components/virtual-rows.ts`). `rowOffsets`,
   `visibleRows` and `scrollToShow` left `templates/company-logic.ts` for this neutral module
   (they were never public; `index.ts` did not export them); the company switcher, EditableGrid
   (`editable-grid-window.ts`), LookupField and the matching view import them from there, and
   their tests moved to `virtual-rows.test.ts`. The rules, shared by every virtualised list:
   - the rows in view and `WINDOW_OVERSCAN` (600px) above and below them are drawn;
   - the row that holds the focus is drawn wherever it is, with one row before and two after it
     (`FOCUS_ROWS_BEFORE`, `FOCUS_ROWS_AFTER`), so Tab, Enter and the arrows find their next row;
   - the list still tells its whole size (`aria-rowcount` / `aria-rowindex`, `aria-setsize` /
     `aria-posinset` on phone cards).
2. **DataTable keeps TanStack Virtual** (the plan's choice for tables) and applies the same rules:
   `overscan: overscanRows(44)` = 14 rows (600px; it was 8 rows, 352px), cards
   `overscanRows(104)` = 6; a `rangeExtractor` adds the focused row and its neighbours
   (`withFocusedRow`; the focus is followed by `focusin`/`focusout` on the scroll area, rows carry
   `data-index`); spacer rows are placed before, between and after the drawn rows
   (`spacersBetween`), since the focused row may stand apart from the window.
3. **Memoised rows** (`packages/ui/src/components/data-table-row.tsx`). Each table row is a
   `memo` component whose props are the record, its index, its type, its selection, whether a
   subtotal follows, and one `shared` object (columns, flags, messages, `rowActions`, `lineText`,
   `lineKind`, the joined cell classes) that the table rebuilds only when one of them changes.
   Handlers (`onRowClick`, `onRowOpen`, the selection toggle) and `getRowLabel` are read through
   a ref when used, so an application that passes new functions on every render does not redraw
   every row; `getRowLabel` is documented as a function of the row. A scroll now renders only the
   rows entering the window (TanStack renders the table again when scrolling stops and on every
   range change; those renders no longer touch the rows already drawn). Cells call
   `column.cell(row)` directly instead of TanStack's `FlexRender`, and the cell classes are joined
   once per table instead of with `cn` (tailwind-merge) per cell.
4. **The row menu is built when first used** (`LazyDropdownMenu`, internal to
   `dropdown-menu.tsx`, not exported). A Radix menu on every drawn row (root, popper, collection,
   contexts) was about a quarter of a scroll jump (measured by drawing rows without it: register
   at 4× from about 260ms to about 190ms per jump). Until it is used the trigger is the same
   button with `aria-haspopup="menu"`, `aria-expanded="false"` and `data-state="closed"`; a press
   (pointer or touch) builds and opens the menu, the keyboard's focus builds it (the focus moves
   to the rebuilt button), a click without a press (assistive technology) opens it too. Its
   entries are read when the menu is drawn.
5. **Cached Intl formatters** (`packages/ui/src/provider/format.ts`). `format.money` asked
   `Intl.NumberFormat` on every call which side the currency stands on (`currencyFirst`, about 9%
   of a re-render of 300 amounts, `group-D1.md`); now `cachedNumberFormat` /
   `cachedDateTimeFormat` keep one formatter per (locale, options) and the currency's side is kept
   per (locale, currency). The date formatters of `createFormat`, `monthName`, `weekdayName`,
   the percent pattern and `numberSchemeForLocale` use the same cache. Only patterns come from
   Intl; amounts stay decimal strings, never rounded (D4). `format.test.ts` checks that the cache
   returns the same formatter for equal options, the same text on every call and for a fresh
   format in five locales, and every digit of a 20-digit amount with 9 decimals.

Not changed: `format.date` already built its `Intl.DateTimeFormat` once per format; its cost per
cell (about 1µs) is not what made the register slow (see section 3).

## 2. Method

- Machine: the owner's Windows 11 Pro laptop, AMD Ryzen 7 5700U (8 cores, 16 threads), 14 GB.
  Unlike group E's run, no other builds or test runs shared the machine (other agents may have
  been idle in the background).
- Built Storybook (`pnpm build-storybook`) served by a small static server; Chromium of Playwright
  1.63, viewport 1280 × 720, device scale 1. "Before" is the Storybook built from
  `bp/P5-part1-liro-patterns` (with only the move of `virtual-rows.ts`, which changes nothing at
  run time); "after" is the final state of this change.
- Each time is from the event to the frame that first shows its result: the clock starts in the
  page at the `pointerdown` / `keydown` (capture listener) or just before setting `scrollTop`; the
  result is polled every animation frame (the row at the new position drawn; the row's
  `aria-selected="true"`; the table's `aria-rowcount` changed; the cell's value changed) and the
  clock stops in a `setTimeout(0)` after that frame.
- Stories: "Templates/RegisterPage / 5,000 entries (virtualized)", "Examples / Work-injury
  register, 5,000 entries", "Examples / Customers" (the story's play function ends on Inactive;
  the script first switches to All, 50,007 records, then measures scrolling and selecting there,
  then switching views Active → All → Inactive → All → Active) and "Components/Table/EditableGrid
  / Specification, 300 positions" (typing a character into a cell).
- Ten measurements each (only the first five for selecting and switching view: the sixth view
  switch repeats the current view and later selections reach rows the script does not scroll
  to), each 1× and with 4× CPU throttling (CDP `Emulation.setCPUThrottlingRate`, set after the
  story has loaded), and the whole run done twice, before and after alternating
  (before, after, before, after). The figures are the medians of each run, then the range.
- The measuring script lived in a temporary folder and is not part of the repository.

## 3. Results (milliseconds; median of run 1 / run 2, then the range of both)

| Story, action                                       | Before, 1×      | After, 1×       | Before, 4×          | After, 4×           |
| --------------------------------------------------- | --------------- | --------------- | ------------------- | ------------------- |
| Register 5,000 (story), 2,000px scroll jump         | 28 / 27 (25–33) | 30 / 27 (25–39) | 174 / 166 (151–213) | 178 / 193 (167–227) |
| Work-injury register 5,000 (example), jump          | 31 / 31 (26–41) | 30 / 31 (27–36) | 192 / 184 (155–223) | 219 / 206 (187–466) |
| Customers 50,007, 2,000px scroll jump               | 32 / 32 (28–36) | 34 / 31 (28–73) | 208 / 195 (174–311) | 234 / 202 (188–601) |
| Customers 50,007, selecting a row                   | 39 / 38 (32–43) | 33 / 31 (22–74) | 226 / 227 (210–264) | 227 / 203 (103–302) |
| Customers, switching view                           | 60 / 58 (30–80) | 52 / 41 (34–98) | 292 / 283 (208–378) | 272 / 295 (203–360) |
| EditableGrid, 300 positions, typing (no regression) | 9 / 13 (6–25)   | 8 / 8 (6–19)    | 42 / 44 (35–53)     | 39 / 41 (32–54)     |

What the numbers say:

- **Group E's seconds were the machine's load, not the lists.** On a quiet machine the same
  stories took 150–310ms at 4× before any change. The 3.4 s of group E came while six other
  groups were building and running Playwright on the same machine.
- **The window is about 40% larger at about the same cost.** A jump now draws about 40 rows instead of about
  28 (600px above and below instead of 8 rows), plus the focused row, and takes the same time
  within the noise (register at 4×: 166–174 before, 178–193 after): the cost of a drawn row fell
  by about a quarter (the lazy menu, the joined classes, cells without FlexRender). The larger
  window means a slower scroll never shows blank rows, and the focused row is never unmounted.
- **Selecting a row and switching view did not get faster in this example,** and the profile
  says why: the rows are no longer drawn again on a selection, but the example keeps its
  selection in the screen's state, so the whole screen (AppShell, ListPage, FilterBar, the
  BulkActionBar that measures its width) renders again; and a view switch hands DataTable a new
  array of up to 50,007 rows, from which TanStack Table builds its row model (about 12ms at 1×,
  plus garbage collection). Both are the application's part: a real application pages from the
  server (`group-E.md`), and its screen can keep the selection lower in the tree.
- **A part of every figure is Storybook's.** Storybook 10's highlight addon watches the story's
  DOM and, on every change, reads `getComputedStyle` of every element in the page (about 25–35%
  of a jump's JavaScript at 1× in the profile). Applications do not run it.

## 4. Checks

See the pull request: lint, typecheck, unit tests, Prettier, the Storybook build and the story and
accessibility tests of DataTable, EditableGrid, LookupDialog, LookupField, MatchingView,
RegisterPage, AppShell and the Customers and work-injury register examples.
