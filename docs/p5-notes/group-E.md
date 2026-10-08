# Group E — P5.19 catalogs at scale (except LookupField), P5.20 registers and official forms

Branch `bp/P5-group-E`, from the scaffold commit `eb37070`. Everything below is ready for the
integrator to copy into `docs/decisions.md`, `AGENTS.md` and `BUILD-PLAN.md`.

## 1. decisions.md entries

### Catalogs at scale (P5.19)

- **2026-10-08 — LookupDialog ("Search all…", P5.19).** `LookupDialog` (new, exported,
  `components/lookup-dialog.tsx`): the whole catalogue — tens of thousands of customers, items or
  accounts — in a large dialog that an application opens from a LookupField's last entry
  (`onSearchAll`, group D1) or a "Search all…" button. Props: `open` / `onOpenChange`, `title`
  (also the table's name), `description`, `initialQuery` (what was typed in the field; the
  application opens the dialog with its results for it), `onSearch(query)` (after FilterBar's
  300ms pause), `searchPlaceholder`, `filters` / `filterValues` / `onFilterValuesChange` /
  `inlineFilters` (FilterBar's, default 2 inline), `columns` / `rows` / `getRowId` /
  `getRowLabel` (DataTable's), `onChoose(row)` (the dialog then closes), keyset paging `hasNext` /
  `onNext` / `hasPrevious` / `onPrevious` (the application keeps the cursor; CursorPagination
  under the table), `count` / `countIsExact`, `loading`, `mobile`, `layout`.
  1. **Composed, not new:** FilterBar (search and filters) above a DataTable; the dialog is the
     Dialog primitive at 960px (`w-240`, at most 90% of the width), the table scrolling inside 55%
     of the screen's height under a sticky header. **Phones** (below 48em or `layout="phone"`):
     the full-screen sheet of P4.9d (`side="full"`), the results a flat list in the sheet
     (DataTable `inCard` cards), the safe area at the bottom.
  2. **Keyboard (decided; the brief left it open):** the search field takes the focus when the
     dialog opens; **ArrowDown** moves the focus to the first result; ArrowDown / ArrowUp move
     between results and stop at the ends (ArrowUp from the first returns to the search),
     PageDown / PageUp by ten (as the company switcher), Home / End to the first and last;
     **Enter or Space chooses** (DataTable's row press); **typing on a result** (a character or
     Backspace without Ctrl, Cmd or Alt) sends the focus back to the search field, which
     receives the character, so typing never stops. The focused row is the active one — the
     focus ring shows it and a screen reader reads the whole row. **Chosen over the combobox
     pattern** (focus kept in the field, `aria-activedescendant` naming an option) because the
     results are a table with columns: a listbox cannot hold a table, and DataTable's rows are
     already focusable and pressable (D2 owns DataTable; nothing in it changed). The keys are
     `lookupKeyTarget` and `isTypingKey` (exported, tested); the hint "Arrow keys move through
     the results; Enter chooses." (`lookup.keyboardHint`) stands under the table and is the
     dialog's description.
  3. **Nothing found:** the search counts as a filter for DataTable's empty state, so an empty
     result says "No rows match" with "Clear filters", which empties the search and the filters.
  4. The listener is a ref callback, not an effect: a dialog that is open on the first render in
     a nested provider (a phone frame) gets its portal content a moment later, and an effect
     found no element (found by the phone story test).
  - **Messages:** `lookup.keyboardHint`.

- **2026-10-08 — ImportWizard (P5.19, import with column mapping and a validation preview).**
  `ImportWizard` (new, exported; the name chosen for the plan's "import"): one card with the
  Stepper as its first row, the step's content, and the buttons at the bottom — Cancel at the
  start (when `onCancel`), then Back and the step's main action last. Four steps (`IMPORT_STEPS`,
  `step` / `onStepChange` controlled by the application, which reads the file and checks it):
  1. **File:** `acceptText` (the types, the size limit, "the first row holds the column names" —
     the application's words) is shown **before** choosing; "Choose file" (intent import) opens a
     plain file input with `accept` (`// INTEGRATION: FileDropzone` — group B's FileDropzone
     replaces it; dropping is then added, the button stays); `onFileChoose(file)`; `reading`
     shows a Spinner; `file` (`name`, `description` such as "1.213 rows, 8 columns, 96 KB") or
     `fileError` (danger, `role="alert"`). Next is disabled until a file is read.
  2. **Columns:** one row per catalogue **field** (`fields`: id, label, `required`,
     `description`) — the field (required marked " *" for the eye, "(Required)" for assistive
     technology), the file's column that fills it (a clearable SelectField named "Column for
     <field>", "Not imported" while empty), and a **sample value** of that column (`sourceColumns`
     with `sample`). Rows per field rather than per file column, so the required ones are marked
     where they are chosen. The application's suggestion is the starting `mapping`; `suggested`
     marks those fields "Suggested" (xs tertiary). **A column fills one field only**: choosing
     it for another field takes it from the first (`assignColumn`, tested), so a value is never
     imported twice. The file's columns that no field takes are listed ("Not imported: Napomena",
     `unusedColumns`). While a required field has no column, Next is an UnavailableAction:
     "Unavailable: Choose a column for Tax number" (`missingRequired`, tested).
  3. **Check — the validation preview, nothing saved yet:** the counts from the application
     (`counts`: ready, errors, warnings, duplicates — the whole file's) each with its icon and
     noun through `format.number` ("1.198 rows ready", "12 with errors", "3 duplicates"); the
     `previewNotice` slot (a DuplicateWarning); "Only rows with problems" (`problemsOnly` — the
     application filters, as DataTable never filters; `isProblemRow` exported for one that
     filters on the device) and "Skip rows with errors" (`skipInvalid`); the rows (DataTable,
     virtualised above 100 rows) with their **line in the file**, each mapped field's value with
     **its problems under it** (icon and words in the tone's colour, errors first: `issuesOf`),
     and the row's own problems in a last column. **Import is unavailable while rows have errors
     and they are not skipped** ("Correct the rows with errors in the file, or skip them",
     `importBlocked`, tested); the button says how many rows go in ("Import 1.198 rows").
     Filtered to nothing: "No row has a problem." (`role="status"`).
  4. **Import:** a ProgressBar named "Import progress" with "312 of 1.198" through the format
     (`progress`, `role="status"`; `// INTEGRATION: JobProgress` — group B's JobProgress takes
     its place and the report), then `result` (the application's report, e.g. a success Alert).
  - Phones: the mapping and the preview are flat lists in the card (DataTable cards `inCard`).
  - **No read-only or disabled state:** a wizard is an action; a user who may not import does
    not get the page (D3, the application's decision).
  - **Messages:** `import.stepFile`, `import.stepColumns`, `import.stepCheck`,
    `import.stepImport`, `import.chooseFile`, `import.field`, `import.column`, `import.sample`,
    `import.notImported`, `import.suggested`, `import.columnFor`, `import.unusedColumns`,
    `import.missingRequired`, `import.ready`, `import.withErrors`, `import.withWarnings`,
    `import.duplicates`, `import.problemsOnly`, `import.skipInvalid`, `import.fixOrSkip`,
    `import.line`, `import.problems`, `import.noProblems`, `import.run`, `import.progress`,
    `import.progressText`; reused `wizard.back`, `wizard.next`, `dialog.cancel`,
    `field.required`, `field.loading`.

- **2026-10-08 — BulkEditDrawer (P5.19, edit several records at once).** `BulkEditDrawer`
  (new, exported): the BulkActionBar → Drawer → ConfirmDialog pattern composed — the
  application's "Edit N records" bulk action opens it. A Drawer from the end (D14: a short edit
  with the list still visible), titled "Edit 24 records" (`bulkEdit.title`, the count through
  the format, `title` replaces it). **Each field that can be set for all** (`fields`: id, label,
  the application's `editor` with its label hidden, `valueText`) is a CheckboxField with the
  field's name and **"Leave unchanged" under it by default**; ticking it (`changing` /
  `onChangingChange`, in the fields' order: `toggleChanging`) shows the editor, indented under
  the checkbox's text. Rows divided by `border.subtle` lines (no cards in the drawer).
  **"What will change"** (an h3 region): each ticked field and its new value as a one-column
  KeyValueList (`changedFields`), or "Choose at least one field to change."; **Apply** ("Apply to
  24 records", the save intent) stays disabled until a field is ticked. Apply asks **once**:
  ConfirmDialog "Change 24 records?" with the changes in one line ("Payment term: 30 days",
  `filter.pill`) and "Change"; `onApply` may return a promise (the confirmation shows it is
  working and cannot be closed), then the drawer closes. A field the user may not change is the
  application's editor disabled with its reason (story "Several fields, one disabled with a
  reason"). Deactivating is not a field here: it is a row or bulk action.
  - **Messages:** `bulkEdit.title`, `bulkEdit.unchanged`, `bulkEdit.summary`, `bulkEdit.nothing`,
    `bulkEdit.apply`, `bulkEdit.confirmTitle`, `bulkEdit.confirm`.

- **2026-10-08 — Inactive records are hidden, never deleted (P5.19).** No new component: the
  rule is composed from what exists and shown in the customers example. A catalogue has saved
  views **Active / Inactive / All** (ListPage, with counts) — the default view hides inactive
  records; a LookupDialog offers a "Show inactive" yes/no filter instead. An inactive record is
  marked with a **neutral "Inactive" StatusBadge after its name** (the name cell and the phone
  card's badge), never by colour or strike-through alone. Rows have **"Deactivate" / "Activate"**
  (row menu, and the bulk bar with one confirmation and the count); **a catalogue offers no
  delete**. DataTable is unchanged (no row style was needed: the badge says it).

- **2026-10-08 — DuplicateWarning (P5.19).** `DuplicateWarning` (new, exported): the Core found
  records like the one being created (the same tax number or name); the DS never looks for
  duplicates. A **warning Alert** (`role="alert"`): the `title` ("This may be a duplicate" by
  default, `duplicate.title`) and the Core's `message`, then the `matches` as **RelatedDocuments**
  — each a link through the provider's `linkComponent` with its kind, number or name and state
  (P4.9 rule 7; reused, not a second list) — then the choices: **"Open existing"** (only with one
  match: a link drawn as the neutral default button; with several, each link is the way) and
  **"Create anyway"** (caution family, Plus; `createAnywayLabel`, e.g. "Import anyway"), the main
  choice last. With `reasonRequired`, Create anyway opens a **ReasonConfirmDialog** first (its
  `reasons` or a written reason, `reasonMessage`; Cancel focused first) and `onCreateAnyway`
  receives the answer. Used in a record form and in ImportWizard's `previewNotice`.
  - **Messages:** `duplicate.title`, `duplicate.existing`, `duplicate.openExisting`,
    `duplicate.createAnyway`, `duplicate.reasonTitle`.

### Registers and official forms (P5.20)

- **2026-10-08 — RegisterPage (P5.20).** `RegisterPage` (new, exported,
  `templates/register-page.tsx`): a chronological register for a period — VAT records, the
  work-injury register, the safety-training register. Layout as ListPage: a **visible** page
  header (no module tab names a register: title, `back`, `status`, `subtitle`, `actions` — Print,
  Export, New entry, the main one last), then **one card**: the period row (`period`: the
  application's PeriodField or MonthField; `tools` at its end), the locks, the table to the
  card's edges, count and paging under it.
  1. **Never deleted, corrected:** the page adds a **No.** column before the application's
     columns and a **Correction** column after them, from `entry(row)` (`number`, `corrects`,
     `correctedBy`, `locked`): the new entry reads "Corrects no. 4" (text.secondary), the
     corrected one carries a neutral badge "Corrected by no. 7" (its state). The application's
     row menu offers "Correct entry"; the page has no delete.
  2. **Locked periods:** each `locks` item (`period`, `reason`, `detail` — who and when, the
     application's words) is a row with a 16px Lock and words — "January–June 2026 is locked"
     (`register.periodLocked`), the reason, the detail in xs — on `surface.sunken` between
     lines at the top of the card (rows, not a card in the card); each locked entry has a 14px
     Lock before its number and "Locked" for assistive technology, and **its menu holds one
     unavailable item that says why** ("Locked period: entries cannot be changed",
     `registerMenu`, tested) in place of its actions — disabled with a visible reason (D3).
  3. **5,000 entries stay responsive:** `virtualize` (DataTable's 44px rows inside `maxHeight`,
     default `70dvh`); the "5,000 entries" stories check that fewer than 60 rows are drawn and
     that `aria-rowcount` is 5001. Measured: see section 6.
  4. Phones: entries as a flat list in the card, their number and correction among the details.
  - **Messages:** `register.number`, `register.correction`, `register.corrects`,
    `register.correctedBy`, `register.locked`, `register.lockedEntry`, `register.periodLocked`.

- **2026-10-08 — StatutoryFormPage (P5.20).** `StatutoryFormPage` (new, exported): an official
  form mirrored with its own section and field numbers ("3.2", "8a.1"); field definitions,
  numbering, rules and texts are the Core's data, and the page computes nothing.
  1. **Status draft → checked → submitted:** P4.5's **LifecycleBar** above the header (reused,
     not a second stepper: the form's life is a document's; steps and names from the Core,
     `lifecycle`), the state as a StatusBadge after the visible title.
  2. **Sections** (`sections`: title as the form writes it, fields) are SectionCards (h2, flush)
     each holding a DataTable `inCard`: **No.** (tabular, left to right) | **Description** |
     the previous period (`previousLabel`, the comparison column; none without it) | this period
     (`currentLabel`), amounts end-aligned through `format.money` (`currency`, per field
     `currency` / `decimals`); a `total` field is semibold. Phones: each field a row of the flat
     list with both periods under its number and name.
  3. **Drill-down:** an amount with `sources` is a button in the link colour with a dotted
     underline, named "510.809,60 RSD, sources of 3.2" (`statutory.showSources`, the visible
     amount first, WCAG 2.5.3); it opens a **Drawer from the end** titled with the field's number
     and name: each source a row — a link with its kind and number (through `linkComponent`),
     its date, its amount and its state — then "Field 3.2" with the field's value under a
     `border.strong` line. The documents' amounts are the Core's.
  4. **Manual overrides:** a field with `editor` (the application's MoneyField, label hidden) has
     a 28px pencil "Change 8a.2" (`value.change`, as ChangeableValue) that turns the amount into
     the editor with Cancel and Save (`onSaveOverride(field)`, a promise keeps the editor until
     it settles; `editing` / `onEditingChange` make it controlled). An overridden value
     (`override`: `computed`, `by`, `at`) shows a neutral **"Changed manually"** badge (PencilLine),
     "By Ivana Stojanović on 05.10.2026. 14:12", "Computed: 68.957,60 RSD", and **"Use computed
     value"** (Undo2, `onUseComputed`) — the way back. The Core keeps both values.
  5. **Rule checks** (`rules`: text, the fields they concern, result passed / failed / warning,
     `detail` such as "Difference: 64.400,00 RSD"): under each field they concern, those that did
     not pass, failures first (`fieldRules`), with an icon and words ("Check failed: 8e.6 must
     equal 8a.2 + 8b.2 · Difference: 64.400,00 RSD") in the tone's colour; and **a summary Alert**
     above the sections — danger with a failure, warning with a warning, success otherwise
     (`rulesTone`) — titled with the counts and their nouns ("1 check failed · 4 checks passed",
     `ruleCounts`), listing the open checks each with **"Go to 8e.6"**, which scrolls to the
     field's number and focuses it.
  6. `readOnly` (a submitted form): no pencils and no way back; the drill-down stays. Print and
     export are the application's actions; `notice` takes an Alert of its own (a deadline).
  - **Guided forms:** the Questionnaire (group A) is not used; a guided filing can put it before
    this page.
  - **No loading state:** the Core sends the form whole; an application shows the page once it
    has it.
  - **Messages:** `statutory.number`, `statutory.description`, `statutory.showSources`,
    `statutory.sources`, `statutory.noSources`, `statutory.fieldValue`, `statutory.overridden`,
    `statutory.overriddenBy`, `statutory.computed`, `statutory.useComputed`,
    `statutory.saveOverride`, `statutory.checkFailed`, `statutory.checkWarning`,
    `statutory.checkPassed`, `statutory.checksFailed`, `statutory.checksWarnings`,
    `statutory.checksPassed`, `statutory.goToField`, `statutory.checks`; reused `value.change`,
    `dialog.close`, `dialog.cancel`.

- **2026-10-08 — Example screens of group E (P5.19, P5.20).** In Storybook "Examples", linked
  into the one application (`screens-E.tsx`, `data-E.ts`, `GROUP_E_ROUTES`):
  1. **Customers** (`/sales/customers`, the Customers module tab): the dataset's seven customers
     and **50,000 generated** ones (repeatable Serbian names and PIBs), virtualised; views Active /
     Inactive / All with counts; search and City / Group filters; Panonija Agro d.o.o.'s open
     balance 383.763,12 RSD = F-2026-0412's 135.954,00 + F-2026-0403's 247.809,12 (added in
     paras); Rakić Pekara SZR inactive; bulk edit of the payment term and group; Deactivate /
     Activate; "Search all…" opens the LookupDialog over the whole catalogue
     (`// INTEGRATION: LookupField` — the integrator wires D1's LookupField `onSearchAll` to it);
     choosing shows the chosen customer in the list (its tax number in the search, view All).
     Opening another modal (the QuickPreview) in the same moment the dialog closes does not
     work: Radix returns the focus to the dialog's opener, which closes the new one — an
     application opens the next overlay after the dialog has closed, or fills its field.
  2. **Customer import** (`/sales/customers/import`): the four steps with the old system's CSV
     (`kupci-stari-sistem.csv`, 1.213 rows), the suggested mapping, the preview with the
     duplicate warning for Panonija Agro d.o.o. (line 2, the same PIB 104987265), a row with two
     errors and one with a warning; the import runs in steps of 300 rows to "1.198 customers
     imported".
  3. **VAT return** (`/accounting/vat-return/2026-09`): an illustrative PP PDV-like form for
     September 2026 — 3.2 tax base 510.809,60 RSD drilling down to six invoices of the dataset
     (F-2026-0412's 144.920,00 base at 20%, F-2026-0411, 0409, 0407, 0404, 0403, whose totals
     are whole at 20%), 3.6 102.161,92, 4.2 / 4.6 from F-2026-0412's 10% line (8.500,00 / 850,00),
     2.1 its exempt deposit 2.700,00, 5.1 / 5.2 the totals, 8a.1 / 8a.2 from UF-2026-1179 and
     UF-2026-1176, **8a.2 overridden by Ivana Stojanović** (4.557,60 instead of 68.957,60: she
     left out UF-2026-1179, whose price is queried), so **"8e.6 must equal 8a.2 + 8b.2" fails**
     with "Difference: 64.400,00 RSD"; 10.1 payable 34.054,32 = 5.2 − 8e.6; August 2026 beside
     it; status Checked. All sums in whole paras in `data-E.ts`.
  4. **Work-injury register** (`/hr/safety/injury-register/2026`, a "Safety at work" tab): nine
     entries of 2026, January–June locked by Jelena Marković ("Reported to the labour inspection
     with the half-year report"), no. 7 corrects no. 4 (Goran Mitić's back strain became a lumbar
     disc injury); and a stress route with 5,000 generated entries.
     Each has a desktop and a phone story (the catalogue also "bulk edit", "deactivate", "search
     all"); the docs say the legal codes, field numbers and texts are illustrative.

- **General rules recorded by group E (for the integrator's summary):** a catalogue record is
  deactivated, never deleted, and an inactive one is marked by a word; a register entry is
  corrected by a new entry that refers to it, both marked; a locked period says so with a lock,
  words and its reason, and its entries say why they cannot be changed; a value the system
  computed and a person changed shows who, when and the computed value, with a way back; a rule
  check stands next to the field it concerns and in a summary with a way to the field; a
  validation preview comes before anything is saved, and its counts carry their nouns.

## 2. AGENTS.md rows (components table)

| Name                                                                                                                                         | Kind      | Step  | Note                                                                                                                                                                                                                                                                                                   |
| -------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `LookupDialog`, `lookupKeyTarget`, `isTypingKey`, `LOOKUP_PAGE_STEP`                                                                         | Component | P5.19 | "Search all…": FilterBar + DataTable in a 960px dialog (full-screen sheet on phones); keyset paging (`hasNext` / `onNext`); search focused, ArrowDown into the results, arrows / PageUp / PageDown / Home / End, Enter or Space chooses, typing returns to the search; `initialQuery`, `onChoose`.     |
| `ImportWizard`, `IMPORT_STEPS`, `missingRequired`, `unusedColumns`, `assignColumn`, `isProblemRow`, `hasErrors`, `issuesOf`, `importBlocked` | Component | P5.19 | File (types and limit before choosing) → Columns (per field, required marked, sample, suggestion, one column per field) → Check (counts with nouns, problems in their cells, only problems, skip errors; nothing saved) → Import (progress, report). The application parses and checks.                |
| `BulkEditDrawer`, `toggleChanging`, `changedFields`                                                                                          | Component | P5.19 | BulkActionBar → Drawer → one ConfirmDialog with the count: each field "Leave unchanged" until ticked, "What will change", Apply.                                                                                                                                                                       |
| `DuplicateWarning`                                                                                                                           | Component | P5.19 | Warning Alert with the Core's matches as RelatedDocuments links, "Open existing" (one match) and "Create anyway" (optional ReasonConfirmDialog).                                                                                                                                                       |
| `RegisterPage`, `registerMenu`                                                                                                               | Template  | P5.20 | Chronological register: No. and Correction columns ("Corrects no. 4" / "Corrected by no. 7"), locked periods with a lock, words and reason, locked entries' menu says why; period row; virtualised for thousands.                                                                                      |
| `StatutoryFormPage`, `fieldRules`, `ruleCounts`, `rulesTone`, `fieldElementId`                                                               | Template  | P5.20 | Official form with its numbers: LifecycleBar draft → checked → submitted; sections as tables with the previous period; amounts drill down to their documents (Drawer); overrides with who, when, computed value and "Use computed value"; rule checks beside the fields and in a summary with "Go to". |

## 3. BUILD-PLAN status notes

- P5.19 (group E part): LookupDialog, ImportWizard, BulkEditDrawer, DuplicateWarning; inactive
  records by views and a neutral badge; customers example with 50,000 records, lookup, bulk edit
  and import. LookupField is group D1's.
- P5.20: RegisterPage and StatutoryFormPage; examples VAT return September 2026 and work-injury
  register 2026 (and 5,000 entries), light, dark, right-to-left and phone width.

## 4. Needs

- **Group D1 (LookupField):** wire `LookupField`'s `onSearchAll(query)` in the customers example
  to open the LookupDialog with `initialQuery={query}` (the "Search all…" button in
  `screens-E.tsx`, marked `// INTEGRATION: LookupField`, can then stay or go).
- **Group B (FileDropzone, JobProgress):** replace ImportWizard's plain file button
  (`// INTEGRATION: FileDropzone` in `components/import-wizard.tsx`; keep `accept` and
  `acceptText`, report rejected files through the provider's messages) and its ProgressBar step
  (`// INTEGRATION: JobProgress`; the `result` slot becomes JobProgress's report).
- **Group D2 (DataTable), optional, not needed now:** an `activeRowId` / `aria-activedescendant`
  mode would let LookupDialog keep the focus in the search field (the combobox pattern) if the
  owner prefers it; the roving focus works without it.
- **Integrator:** the provider-p15 key list has group E's keys inserted in sorted order (the
  test compares a sorted list); merge with the other groups' keys keeping the order.
- **Integrator (examples):** the VAT return's invoice links (`#/sales/invoices/F-2026-0411`, …)
  open the 404 screen unless another group adds those invoice routes; F-2026-0412 opens. The
  supplier invoices link to `#/purchasing/approvals`. F-2026-0410, 0406, 0405 (whose tax splits
  the dataset does not define) are not in the illustrative return; if group D2 defines their
  lines, the return can take them.

## 5. Third-party code

None. No new dependency; no file copied from shadcn/ui or elsewhere.

## 6. Verification results

All on the owner's Windows machine, branch `bp/P5-group-E`, while six other groups ran their
own builds and Playwright runs on the same machine (so the timings below are pessimistic).

- `npx pnpm@12.6.0 lint` — pass (0 warnings).
- `npx pnpm@12.6.0 typecheck` — pass (root, tokens, eslint-config, ui, storybook).
- `npx pnpm@12.6.0 test` — pass: tokens 45, eslint-config 40, ui 544 tests (48 files; group E
  adds `catalog-logic.test.ts`, `register-logic.test.ts`, `registers-and-catalogs.test.tsx`
  and its keys in `provider-p15.test.tsx`), scripts 9.
- `npx pnpm@12.6.0 build` and `npx pnpm@12.6.0 build-storybook` — pass.
- `npx prettier --check` on every changed path — pass (written with `--write`).
- Story and accessibility tests (`tests/stories.spec.ts`, `tests/accessibility.spec.ts`), all
  four modes, against the built Storybook on port 6106 (`playwright.local.config.mjs`, not
  committed): every story of Components/Catalogs/LookupDialog, ImportWizard, BulkEditDrawer,
  DuplicateWarning, Templates/RegisterPage, Templates/StatutoryFormPage and group E's
  Examples (Customers, phone, bulk edit, deactivate, search all; Customer import, phone; VAT
  return, phone; Work-injury register, phone, 5,000 entries) — all pass. The last failures
  found and fixed on the way: play functions (exact texts, a status role shared with
  DataTable, animations not yet settled, a non-breaking space in an accessible name, a search
  not yet applied) and timeouts under the machine's load, which passed again with
  `--workers=2`.
- Visual baselines: not made (CI only); every new story needs baselines from the Baselines
  workflow.
- **Performance** (built Storybook, Chromium of Playwright 1.63, from the event to the next
  painted frame, five times each; "4×" is Chrome's CPU throttling):
  - Register, 5,000 entries (story "5,000 entries (virtualized)"): a 2,000px scroll jump
    129–266ms; 4× slower 677–3,427ms (two runs; the register's two date columns go through
    `format.date` per cell).
  - Customers, 50,007 records (Examples / Customers, the whole catalogue in the browser,
    virtualised): a 2,000px scroll jump 163–463ms (4×: 243–1,089ms); selecting a row 86–109ms
    (4×: 135–1,072ms); switching view (the application filters 50,007) 120–200ms (4×:
    103–1,761ms); a search after the 300ms pause 145–178ms (4×: 693–789ms). Fewer than 60 rows
    are in the page at any time (checked by the stories). A real application pages from the
    server rather than holding 50,000 records; the example holds them to show that the list
    stays usable even so.
