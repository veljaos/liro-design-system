# Group D1 — P5.18 document lines, P5.19 LookupField (notes for the integrator)

Branch `bp/P5-group-D1`, from the scaffold `eb37070`. Everything below is ready to paste; the
integrator copies it into `docs/decisions.md`, `AGENTS.md` and `BUILD-PLAN.md`.

## 1. decisions.md entries

Under "Editable grid" (or a new "Complex documents (P5.18)" heading):

- **2026-10-08 — LookupField (P5.19, new, exported).** The one searching field for catalogues of
  tens of thousands of records (customers, items, services, fixed assets, accounts), in forms and
  in document lines. It is ComboboxField's WAI-ARIA combobox (the input keeps the focus, the active
  row announced through `aria-activedescendant`, Enter chooses, Escape closes, Alt+ArrowDown
  opens) with: **the application's search only** — `onSearch(query)` after `searchDelay` (default
  300ms, as ComboboxField; never called for empty text), `results`, `loading` (the last results
  stay under the loading message); **recent records first** while nothing is typed (`recent`,
  under `messages['lookup.recent']`); **results grouped by kind** in the order of `kinds`
  (`LookupKind`: `key`, `heading` "Services", `label` "Service"), records of no known kind last
  without a heading; each record a name, an optional second line (`description`: code,
  warehouse) and an end detail (`detail`: "240 pc in stock", the application's text); **"+ Create
  <kind> “<query>”"** entries after the results while something is typed (`create`:
  `LookupCreateKind` `{ kind, noun }`, reported by `onCreate(kind, query)`); a **one-off entry**
  where the application allows it (`allowOneOff`; chosen, it is reported as
  `{ value: '', label: query, oneOff: true }`); **"Search all…"** last (`onSearchAll(query)`,
  which opens the application's LookupDialog). **Choices made:** the list opens on typing,
  ArrowDown, Alt+ArrowDown or a press on the field — never on Tab alone (a grid of lookup cells
  would open a list in every cell); while something is typed the **first record found is
  active**, so Enter takes it (the old grid's item search; a "Create …" entry is never made
  active by itself, so Enter cannot create by accident); ArrowDown/ArrowUp wrap (ComboboxField),
  PageDown/PageUp move by ten, Home/End go to the ends while the list is open (in the field they
  move the caret otherwise). **Virtualised** with the company switcher's own small virtualiser
  (`rowOffsets`, `visibleRows`, `scrollToShow` of `templates/company-logic.ts`, reused, not
  copied): headings 28px, records 36px or 48px with a second line, action rows 36px; every option
  carries `aria-setsize` / `aria-posinset`; the kind headings are for the eye (`aria-hidden`, a
  flat virtualised listbox cannot nest groups) and each record's accessible name ends with its
  kind (", Fixed asset"). The list is at most 320px high and at least 20rem wide (or the screen
  less 2rem), as wide as the field otherwise (Mantine Combobox values for options and the
  floating surface). "Nothing found" and "Loading…" stand above the list, outside the listbox
  (`role="status"`). Read-only is text (as ComboboxField), disabled shows its reason, errors as
  every field. The logic (`lookupRows`, `lookupKeyTarget`, `lookupRowHeight`, `lookupKindLabel`,
  `choosableCount`) is unit-tested.
  - **Messages:** `lookup.recent`, `lookup.create(kind, query)`, `lookup.oneOff(query)`,
    `lookup.oneOffKind`, `lookup.searchAll`.
- **2026-10-08 — The "+ Create …" panel: a Drawer (P5.18/P5.19, `LookupCreateDrawer`, new,
  exported).** Chosen per AGENTS.md D14: a **Drawer at the end** — a short edit with the document
  still visible. A popover inside a 28px grid cell would cover the lines around it and, being
  non-modal, would let the focus leave a half-filled record. Title "New <noun>"
  (`lookup.createTitle`), the fields **name** (prefilled with the typed text, focused and
  selected), **unit of measure** (SelectField from `units`), **price** (MoneyField in `currency`)
  and **tax category** (SelectField, "S 20%"); the footer Cancel, then Create (the main action
  last, `DialogFooter`). The application saves: `onCreate(draft)` returns a promise of the new
  record, or null when it did not save (its `errors` under the fields); while it runs, the panel
  cannot be closed (no close button, Escape and a press outside ignored, buttons disabled). On
  success `onCreated(option)`; the focus returns where the application says (`onCloseFocus`; the
  grid returns it to the line's search field).
  - **Messages:** `lookup.createTitle(kind)`, `lookup.name`, `lookup.unit`, `lookup.price`,
    `lookup.taxCategory`, `lookup.createButton`.
- **2026-10-08 — Document lines in EditableGrid (P5.18, additive).**
  1. **Line types** (`getRowType`, `components/line-types.ts`), by typography, never colour: a
     **section heading** and a **text line** are one field across the row (`lineText`:
     `{ columnId, value }`, changes reported through `onCellChange` with that column id), the
     heading semibold, the text line xs `text.secondary` (the typing area takes the line type's
     typography); a **subtotal** has no field — its text (`lineText.value`) end-aligned and
     semibold across the columns before the first value column, its amounts in the display
     columns (from the application), a 1px `border.strong` rule above (`border-t-strong` on its
     cells — in a bordered grid `SUBTOTAL_RULE`'s `border-strong` would colour every side), no
     remove button (the application removes a section with its heading); **discount** and
     **deduction** are lines whose negative amounts come from the application. Phones keep the
     types by typography in the same flat list (a subtotal card with the rule above, its amounts
     as label and value).
  2. **Keyboard across types** (`gridKeyAction`, additive `rowCells` and `preferredColumn`,
     tested): rows without cells (subtotals) are skipped by Enter, Shift+Enter, phones' "next"
     and the focus after Ctrl+Delete; a one-cell row (heading, text) takes the focus in its cell,
     and the column of the last full line comes back in the next full line. Ctrl+Enter and Enter
     on the last row add a normal line.
  3. **"Add line ▾"** (`addTypes`): the button adds a normal line; its chevron (the SplitAction
     look, neutral default weight, "More options: Add line") offers the rarer types the document
     allows — text line, section heading, discount, deduction (`grid.addText`,
     `grid.addHeading`, `grid.addDiscount`, `grid.addDeduction`). `onAddRow(index, type)` gets the
     type (additive second argument); a heading's subtotal is the application's to add with it.
     Without `addTypes` it stays the plain "Add line" button of P4.9.
  4. **Lookup column** (`type: 'lookup'`): one LookupField per line instead of a "Type" column
     (`value`, `results(row)`, `onSearch(rowId, query)`, `loading`, `recent`, `kinds`,
     `allowOneOff`, `onSearchAll(rowId, query)`, `create` — `GridLookupCreate`: the kinds,
     units, tax categories, currency, defaults, `onCreate(rowId, draft)` and `errors`). The chosen
     record's kind stands in the cell after the field as xs `text.secondary` text ("Service",
     "Fixed asset", "One-off"); "+ Create …" opens LookupCreateDrawer at grid level and fills the
     line through `onCellChange(rowId, columnId, option)`; the focus returns to the line.
  5. **Details per line** (`details`, `GridDetail` `{ text, internal? }`): under the row in xs
     `text.secondary`, before its messages, and pointed to by the row's fields
     (`aria-describedby`). **Internal values** (`internal: true`, e.g. a fixed asset's book value)
     are written after the provider's "Internal" note (`grid.internal`, semibold). What reaches
     the customer's PDF is the application's and the Core's rule; the mark only says so on
     screen. A stock warning is an ordinary row message of tone warning from the application.
  6. **Tax category and unit columns** (`type: 'taxCategory'` with `categories: TaxCategory[]`,
     shown as the code with the rate through `format.percent` — "S 20%", `taxCategoryText`;
     `type: 'unit'` with `units: UnitOfMeasure[]` — "pc" shown, its UN/ECE code "H87" stored).
     Both are SelectFields in the cell; the unit is its own column (P4.9d).
  7. **One-off lines** where the application allows them (`allowOneOff`): the line then needs an
     account and a tax category — the application's validation, shown as row messages (the
     examples make the Account column editable only for a one-off line).
  - **Messages:** `grid.textCell`, `grid.headingCell`, `grid.addText`, `grid.addHeading`,
    `grid.addDiscount`, `grid.addDeduction`, `grid.internal`.
- **2026-10-08 — 300 lines stay responsive (P5.18, measured).** A grid of fields was slow at 300
  lines (first measurement, specification story, before the changes: typing a character 1.8–3.0 s,
  inserting a line 9–14 s, the page about 20 s — partly the story's own queries and axe). Three
  causes, three fixes, cells still always fields: (1) **an inserted line mounted every line after
  it again** — the table body was an array of per-line arrays, keyed by position; it is now one
  flat keyed list (this also affected P3.4 grids); (2) **every cell rendered on every change** —
  each editable cell is now a memoised `GridCellEditor` whose props are the values its column
  gives for the row (the column compared by what its field draws, not by identity, since an
  application rebuilds its columns when their display functions read its state); the line number
  in each field's name ("Quantity, line 3") comes from a context read by a tiny `CellName`, so an
  inserted line renames the fields below without rendering them; callbacks reach the latest props
  through one stable object; (3) **mounting 1,800 fields (600 of them Radix selects, which render
  their items while closed) and running axe over them** — a grid of **100 lines or more**
  (`VIRTUALIZE_FROM`, or `virtualize`) draws only the lines in view and 600px around them
  (`gridWindow`, `editable-grid-window.ts`, reusing the company switcher's `rowOffsets` /
  `visibleRows`), **plus the focused line, one before and two after it** (so Enter, Tab and the
  row shortcuts always find their target), with spacer rows; heights are measured once drawn
  (estimated 37px per table line before), the view follows any scrolling ancestor and resizing
  (one capture listener, one animation frame), and assistive technology still hears the whole
  table (`aria-rowcount`, `aria-rowindex` on every drawn row, its notes row counted; on phones
  `aria-setsize` / `aria-posinset` on the cards). **Measured** (built Storybook, Chromium of
  Playwright 1.63 on the owner's Windows machine, from the event to the next painted frame, five
  times each; "4× slower" is Chrome's CPU throttling; the a11y addon set to manual):
  - "EditableGrid / Specification, 300 positions" (312 rows, 6 fields each): typing a character
    11–19ms (4× slower 107–160ms); Enter to the next line 14–34ms (88–204ms); inserting a line
    (Ctrl+Enter) 54–124ms (536–836ms, one 2.4 s outlier on the first insert); the story ready
    about 2.2 s after navigation, Storybook's start included.
  - "Examples / Interim situation, editing the specification" (324 rows in the AppShell and
    DocumentPage): typing 20–31ms (111–178ms); Enter 14–29ms after a first 200ms (59–159ms after a
    first 977ms); inserting a line 53–88ms (220–481ms).
  - Found on the way, for the provider's owner: `format.money` creates an `Intl.NumberFormat` on
    every call (`currencyFirst`), about 9% of a re-render of 300 amounts (see Needs).

Under "Fields" (one line): **2026-10-08 — ComboboxPopover takes `className`** (additive, internal
— LookupField's minimum width).

## 2. AGENTS.md rows (components table)

| Name                                                                                                                                                                                            | Kind      | Step  | Note                                                                                                                                                                                                                                                                                                                                 |
| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `LookupField`, `LookupOption`, `LookupKind`, `LookupCreateKind`, `lookupRows`, `lookupKeyTarget`, `lookupRowHeight`, `lookupKindLabel`, `choosableCount`, `LOOKUP_ROW_HEIGHTS`                  | Component | P5.19 | The one catalogue search: the application's search after 300ms, recent first, results grouped by kind (second line, end detail), "+ Create <kind> “…”", one-off where allowed, "Search all…" last (`onSearchAll` → LookupDialog); WAI-ARIA combobox, first record active while typing, virtualised (company switcher's virtualiser). |
| `LookupCreateDrawer`, `LookupDraft`, `LookupDraftErrors`                                                                                                                                        | Component | P5.18 | "+ Create …" panel: an end Drawer (D14), name (typed text), unit, price, tax category; the application saves (`onCreate` → record or null with `errors`), not closable while saving.                                                                                                                                                 |
| `EditableGrid` line types, `GridDetail`, `GridLookupCreate`, `LINE_TYPES`, `LineType`, `spansRow`, `editableCellCount`, `ADDABLE_LINE_TYPES`, `TaxCategory`, `UnitOfMeasure`, `taxCategoryText` | Component | P5.18 | Additive: `getRowType` (heading/text one field across the row, subtotal without a field, end-aligned with a rule above), `lineText`, `addTypes` ("Add line ▾"), `lookup` / `taxCategory` / `unit` columns, `details` (internal after "Internal"), `virtualize` (from 100 rows: a row window, focused line kept); cells memoised.     |

(Update the EditableGrid row's note: "… Phones: line cards, totals sticky at the top (P3.6).
Line types, lookup, tax category and unit columns, a row window from 100 lines (P5.18)".)

## 3. BUILD-PLAN status notes

- P5.18 (D1 part): EditableGrid line types, "Add line ▾", lookup/taxCategory/unit columns, line
  details with internal marks, LookupCreateDrawer, the row window for 300 positions (measured);
  examples "Invoice draft, lines by search" and "Interim situation, editing the specification".
- P5.19 (D1 part): LookupField (recent, kinds, create, one-off, Search all…, virtualised).

## 4. Needs (other groups, protected or unowned files)

- **combobox-field.tsx (unowned, touched additively):** `ComboboxPopover` gained an optional
  `className` (merged last). Nothing else changed there.
- **Layering (integrator):** `lookup-field.tsx` and `editable-grid-window.ts` import
  `rowOffsets` / `visibleRows` / `scrollToShow` from `templates/company-logic.ts` (group B's
  area; not changed). A component importing a template module is backwards: move the three pure
  functions to a neutral module (e.g. `components/virtual-rows.ts`) and re-export them from
  `company-logic.ts`.
- **Provider `format` (D2 owns `provider/format.ts`):** `format.money` calls `currencyFirst`,
  which builds a new `Intl.NumberFormat` on every call; cache it per currency (a Map in
  `createFormat`). It showed as ~9% of a 300-amount re-render.
- **SelectField (unowned):** Radix Select renders all its items while closed (to show the chosen
  text); in a long grid that is 600 selects × their options. The row window hides it; a later
  improvement would render the items only while open (SelectValue given the chosen label).
- **D2 (read-only lines):** use `LINE_TYPES`, `spansRow`, `LINE_TYPE_TEXT`, `SUBTOTAL_RULE`,
  `taxCategoryText` and `lookupKindLabel` (the kind label of a line) from `line-types.ts` /
  `lookup-logic.ts`; they are exported from `index.ts` in D1's block — D2 should not export them
  again. In a bordered table use `border-t-strong` (top only) for the subtotal rule.
- **E (LookupDialog):** `screens-D1.tsx` has `// INTEGRATION: LookupDialog (group E)` at the
  draft's lookup column (`onSearchAll(rowId, query)` is a no-op now); open LookupDialog with
  `initialQuery = query`, and on `onChoose(row)` call the grid's line change as a chosen record
  (`fromRecord` in data-D1.ts). E's catalogue example can put a LookupField with `onSearchAll`
  in its form the same way.
- **D2 (specification):** `specificationOf()` in `data-D1.ts` follows the shared recipe exactly
  and returns, per group, a `heading` row ("3. Concrete works"), 25 `line` rows (id `p<g>-<i>`,
  text "`<g>.<i> <group name>, position <i>`", quantity, unit MTK for odd i / H87 for even i,
  price in paras, `previous`, `current` = this period) and a `subtotal` row ("Subtotal 3.
  Concrete works"). Totals: `specTotals()` (contract value, this period, recap S 20%). Keep one
  of the two functions; if D2's position texts differ, keep either — the figures are the same.
- **Document numbers claimed:** draft invoice **F-2026-0419** (to Bojović i sinovi d.o.o.,
  issued 2026-10-06, due 2026-10-21); the service created in the walk-through **USL-102
  "Montaža skele"** (1.850,00 RSD per hour, S 20%).
- **AppShell (B):** nothing needed.
- **Visual baselines:** new stories need baselines on CI (LookupField: 15 stories; EditableGrid:
  6 new stories; Examples: 4 new). Changed baselines expected for no existing story: the P3.4
  stories render as before (the Add line button is unchanged without `addTypes`).

## 5. Third-party code

None copied. No new dependencies.

## 6. Verification (run on the branch, Windows, local)

- `npx pnpm@12.6.0 lint` — pass (0 warnings).
- `npx pnpm@12.6.0 typecheck` — pass.
- `npx pnpm@12.6.0 test` — pass (ui 48 files / 553 tests; tokens 45; eslint-config 40).
- `npx prettier --check packages apps docs/p5-notes` — pass.
- `npx pnpm@12.6.0 build`, `npx pnpm@12.6.0 build-storybook` — pass.
- Story tests and accessibility on port 6104 (`playwright.local.config.mjs`, untracked), all
  four modes: `npx playwright test -c playwright.local.config.mjs tests/stories.spec.ts
tests/accessibility.spec.ts -g "(LookupField|EditableGrid|Invoice draft|Interim situation)"`
  — 320 passed (every EditableGrid story, old and new, every LookupField story, the four D1
  example stories). `tests/stories.spec.ts -g "Examples /"` — 108 passed (the walk-through and
  all P4.8 screens still work with the D1 routes registered).
- Not verified here: visual baselines (CI only); Firefox/WebKit; the whole story suite.
