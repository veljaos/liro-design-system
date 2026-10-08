# Group F — P5.21 matching, balanced entry, periodic run

Branch `bp/P5-group-F`, from the scaffold commit `eb37070`. Everything below is ready to paste;
the integrator owns the final wording.

## 1. decisions.md entries

Proposed section: `## Common business processes (P5.21)`.

- **2026-10-08 — MatchingView (P5.21).** `MatchingView` (`components/matching-view.tsx`, logic
  in `matching-logic.ts`, tested) reconciles two lists — bank statement lines and open items, a
  supplier's statement and the purchase ledger. **Generic and controlled:** the lists
  (`MatchingList`: `title`, `description`, `items`, `selected` / `onSelectedChange`, `search` /
  `onSearchChange`, `empty`), the suggestions (`MatchSuggestion`: `left` and `right` items,
  `label`, `confidence` in words, `note`), the matches (`MatchingMatch`), every amount, what is left
  after a partial match (`MatchingItem.remaining`) and the `summary` come from the application; the
  view reports `onMatch(leftIds, rightIds)`, `onAcceptSuggestion`, `onDismissSuggestion`,
  `onUnmatch`. It computes nothing and never decides whether two items may be matched (the Core's
  `matchUnavailableReason` replaces the default reason).
  1. **One card, top to bottom:** a bar (the application's `summary` — KeyFigures with what is
     matched and what is left — at the start; "Match" at the end, the screen's main action, primary,
     with the keys beside it as ShortcutHints); "Suggested matches"; the two lists side by side
     with a 1px `border.default` line between them; "Matched". Inside the card repeated items are
     rows divided by `border.subtle` lines (P4.9 rule 4). Suggestions first because accepting them
     is most of the work; the lists hold what is left.
  2. **Confidence in words, never colour** (`confidence`, xs medium `text.secondary`): "Exact:
     amount and reference", "Likely: amount and payer". No badge, no tone: a suggestion is not a
     state. A partial suggestion carries the application's note ("Leaves 36.420,35 RSD open on
     F-2026-0410"); after the match the item stays in its list with "36.420,35 RSD left" under
     its amount.
  3. **A row of a suggestion or match:** the left items, an ArrowLeftRight icon (with "matched
     with" for assistive technology), the right items; side by side from 36rem of the row's own
     width (`@container`, P4.9 rule 11), stacked below; then the confidence / note and the
     actions: dismiss (CompactIconButton, cancel intent, named "Dismiss suggestion: …") and "Match"
     (a small neutral button with Link2, named "Match: <suggestion>"), or "Unmatch" (small, subtle,
     Unlink2, named "Unmatch: <match>").
  4. **The lists** are multi-select listboxes; the focus stays on the list and its active item is
     `aria-activedescendant` (the company switcher's pattern). **Keys (decided here, the plan left
     them open):** ArrowDown / ArrowUp (no wrapping: a long list has an end), Home / End,
     PageDown / PageUp by ten, **Space** selects or deselects, **Enter** matches the selection of
     both lists (the same as the "Match" button), **Escape** clears both selections, **Tab** goes
     to the other list (each list is one tab stop; the search field before it). A press on an item
     selects or deselects it. `matchingKeyAction`, `toggleSelection`, `canMatch`, `nextActive` are
     tested. The keys are shown in the bar on desktop and are each list's description
     (`aria-describedby`).
  5. **Neutral selection (D17):** a selected item is `surface.selected` with the 3px
     `border.selected` bar at its start (`data-liro-surface="selected"`, so tones keep their
     contrast); its checkbox is drawn checked (blue — checked boxes stay blue); the active item has
     an inset focus outline only while the list has the keyboard focus.
  6. **Rows:** title sm medium and subtitle xs `text.secondary` at the start, the amount at the end
     (sm medium, tabular, never wrapping) with the remainder under it; 12px by 16px.
  7. **Large lists (P4.9 rule 12):** each list may have a search field (the application filters);
     from **100 items** (`MATCHING_VIRTUALIZE_FROM`) a list draws only the rows in view — fixed
     64px rows (`MATCHING_ROW_HEIGHT`, their text on one line each), a 480px scroll area, the
     company switcher's own small virtualiser (`rowOffsets`, `visibleRows`, `scrollToShow` from
     `templates/company-logic.ts`, reused, not copied), `aria-setsize` / `aria-posinset` on every
     option. The "Large list (5,000 items)" story draws fewer than 40 options and searches.
  8. **Phones** (`layout` 'single', default below 48em): one list at a time, switched by a
     segmented toggle at the top whose items carry the list's title and how many are selected
     ("Statement lines · 1 selected", `bulk.selected`); the selection is the application's, so it
     is kept while switching; the bar sticks under the shell's top (`--liro-shell-top`), so "Match"
     stays in reach. Two lists side by side do not fit 360px.
  9. **States:** `loading` (five skeleton rows per list, `aria-busy`), an empty list ("Nothing left
     to match", or the no-results EmptyState while a search is typed, or the application's
     `empty`), `readOnly` (a posted statement: the lists can still be read and moved through —
     `aria-readonly`, no checkboxes, no Match, Unmatch, accept or dismiss), `matchUnavailableReason`
     (the Match button as an UnavailableAction with the application's reason). Without a selection
     on both sides the Match button is an UnavailableAction with "Select at least one line in each
     list" — D3, never a silent grey button.
  - **Which one:** MatchingView pairs two sets of records; WorklistPage processes one list item by
    item; ComboboxField / LookupField choose one record for a field.
  - **Messages:** `matching.match`, `matching.selectBoth`, `matching.suggestions`,
    `matching.acceptSuggestion`, `matching.dismissSuggestion`, `matching.matched`,
    `matching.unmatch`, `matching.unmatchItem`, `matching.matchedWith`, `matching.search`,
    `matching.empty`, `matching.select`, `matching.clear`, `matching.spaceKey`,
    `matching.enterKey`, `matching.escapeKey`, `matching.showList`. Reused: `bulk.selected`,
    `filter.search` (the search placeholder).

- **2026-10-08 — Balanced entry and BalanceBar (P5.21).** A journal entry is an EditableGrid
  (account combobox, description, debit and credit number columns) with **`BalanceBar`** in its
  `footer` — beside "Add line" on desktop, in the totals card sticky at the top on phones (the
  grid's existing behaviour, P3.6), so the balance is always in view. `BalanceBar` takes `debit`,
  `credit`, `difference` (decimal strings from the application; the bar adds nothing), `state`
  ('balanced' | 'unbalanced' | 'incomplete', **the Core's rule**, not a comparison in the
  component), `currency`, `decimals`, `pending` and `layout` ('row' | 'stacked', default by the
  viewport). The amounts are SettlingValues (tabular, width reserved, the confirmed value still
  while new sums are computed, the quiet dot after 300ms) — the same as the grid's totals.
  **Balanced:** CircleCheck and "Balanced" in `status.success.fg`. **Not balanced:** the
  difference and "Not balanced" with CircleAlert in `status.danger.fg` — words and tone, never
  colour alone. **Amounts missing** (a line without an amount, or one that cannot be read): the
  difference "—", never 0 (Appendix B.4), "Amounts missing" with CircleHelp in `text.secondary`;
  an unreadable amount keeps the grid's own row message ("Debit: Enter a number", P3.4) and the
  application adds its own ("Enter a debit or a credit amount."). The state's words are a polite
  `role="status"`, so a change is heard once. **Posting** is the application's: while the entry
  does not balance its "Post" is an UnavailableAction with the Core's reason ("Debit and credit
  must be equal. The difference is 2.000,00 RSD.") — shown in the stories and the example. Layout
  'row': the three values on one wrapping row, label and value on one baseline, 24px apart, the
  state after them; 'stacked': label at the start and value at the end per line (as the grid's
  phone totals), the state under them. EditableGrid was not changed (owned by D1).
  - **Messages:** `balance.label`, `balance.debit`, `balance.credit`, `balance.difference`,
    `balance.balanced`, `balance.unbalanced`, `balance.incomplete`.

- **2026-10-08 — PeriodicRunPage (P5.21).** A template for a process run once per period —
  payroll, depreciation, a VAT period close (`templates/periodic-run-page.tsx`, `countChecks` in
  `periodic-run-logic.ts`, tested). Everything is data from the application: `steps` (names, a
  description such as the date done), `active` (the Stepper's index; `steps.length` = all done),
  `checks` (`RunCheck`: label, `result` 'passed' | 'warning' | 'failed' | 'notRun', detail, an
  optional action such as a link to fix it), `lock` ('open' | 'locked' with the application's who
  and when), `progress` (the running step), `preview` (title, description, `summary`, `table`),
  `rerun`, `actions`, `keyFigures`, `children`.
  1. **Layout, top to bottom:** PageHeader (back, the run and period as h1, status, subtitle, the
     step's actions at the end — Rerun before them, the main one last); the **lock line** (Lock or
     LockOpen 16px `text.secondary`, "Period locked" / "Period open" sm semibold, the
     application's who and when xs `text.secondary`); the key figures; the **Stepper** (P2.5,
     reused — done steps checked, the current ringed; the application's names); the **running
     step** (SectionCard titled by the progress label: ProgressBar and the application's count,
     "23 of 46 employees", in a polite status — `// INTEGRATION: JobProgress`, group B); **Checks**
     (a flush SectionCard, rows divided by lines: the result's icon and word in its tone — Passed
     success, Warning warning, Failed danger, Not run yet `text.tertiary` with a hollow circle;
     the check's name sm medium and detail xs; the counts as the description, "1 warning",
     "3 passed", attention first: failed, warning, passed); **Preview before posting** (a flush
     SectionCard: the summary — KeyFigures — and a DataTable `inCard`); further sections. Page
     padding 24px (16px on phones), the content's maximum width, as DetailPage.
  2. **Steps on phones:** "Step 3 of 5: Review" (the LifecycleBar's `lifecycle.step` message,
     reused) instead of the Stepper: five labelled steps wrap into five rows at 360px.
  3. **Rerun with a reason:** `rerun` gives a "Rerun" button (neutral, RotateCcw) that opens
     ReasonConfirmDialog (the caution family; the Core's reasons as radios, Cancel focused first)
     and reports `{ reason, text }`; with `unavailableReason` (a locked period, a running
     calculation) it is an UnavailableAction with that reason. The page does not change its own
     state: the application moves the run back to Calculate.
  4. **Posting blocked by a failed check** is the application's: its post action is an
     UnavailableAction with the Core's reason (story "Disabled with a reason (a failed check)").
  - **Which one:** PeriodicRunPage for a batch over a period that a person checks before posting;
    FormWizard for a form the user fills in step by step; LifecycleBar for a document's life
    above the document; Questionnaire (group A) for questions; JobProgress (group B) for one long
    job.
  - **Messages:** `run.checks`, `run.passed`, `run.warning`, `run.failed`, `run.notRun`,
    `run.passedCount(count, text)`, `run.warningCount(count, text)`, `run.failedCount(count,
text)`, `run.preview`, `run.periodOpen`, `run.periodLocked`, `run.rerun`. Reused:
    `lifecycle.step`.

- **2026-10-08 — Examples of P5.21 (group F).** Three screens of Kvadrat Gradnja d.o.o. on
  6 October 2026, numbers computed in whole paras in `data-F.ts`:
  1. **Bank statement matching** (`/banking/statements/188`): statement 188 of 06.10.2026 from
     Banca Intesa (160-0000000456789-12): 14 lines — 12 customer payments, the account fee
     (−1.240,00) and interest (312,40), which are booked to accounts and therefore not in the
     list to match. Opening balance 1.284.550,17 RSD; money in, money out and the closing balance
     computed from the lines. Open items: the dataset's open invoices (F-2026-0412 135.954,00,
     F-2026-0411 58.440,00, F-2026-0410 86.420,35, F-2026-0406 33.612,80, F-2026-0403 247.809,12)
     and nine earlier invoices of the same customers (F-2026-0381 … F-2026-0402). F-2026-0407
     (cancelled by group D2) and F-2026-0408 (a draft) are not open items. Lines 7–9 were matched
     at import; the Core suggests seven matches (exact and likely, one partial: 50.000,00 on
     F-2026-0410 leaves 36.420,35 open; one payment to two Vojvođanka Mlin invoices); line 10 has
     a malformed reference ("Plaćanje F-399") and is matched by hand; line 11 (a private person,
     "Uplata") stays unmatched, so "Post statement" stays unavailable with "1 line is not matched
     yet." Desktop and phone.
  2. **Journal entry** (`/accounting/journal/NK-2026-0912`): a draft DocumentPage (P4.9 drafts:
     no side panels, the system's values in `details`) booking supplier invoice UF-2026-1204 of
     Gradska mehanizacija d.o.o.: concrete 84.600,00 and crane rental 36.000,00 (debit), input
     VAT 20% 24.120,00 (debit, computed), the supplier 144.720,00 (credit). The **unbalanced
     stage** is the route `…/NK-2026-0912?stage=unbalanced` (the supplier's amount mistyped as
     142.720,00: difference 2.000,00, Post unavailable); its story corrects it. Phone: the balance
     in the sticky totals card, Post in the shell's bottom bar.
  3. **Payroll run** (`/hr/payroll/2026-09`): 46 employees (the seven named people of the dataset
     — Jelena Marković among them — and 39 generated), gross, employee contributions (14% +
     5,15% + 0,75%), tax (10% above an illustrative non-taxable 28.423,00) and net computed per
     employee in paras, half-up, and summed; at Review with one warning (overtime of Marko
     Đorđević and Snežana Popović), the period open (Ivana Stojanović, 01.10.2026.), the preview's
     table virtualised; "Payroll run, rerun" chooses "Corrected working hours" and the run goes
     back to Calculate. Stefan Nikolić is not in the September payroll (he starts 2026-11-02).
     **Rates are illustrative**, not the law.

## 2. AGENTS.md rows (components table)

| Name                                                                                                                                                                                                       | Kind      | Step  | Note                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MatchingView`, `MatchingItem`, `MatchingList`, `MatchSuggestion`, `MatchingMatch`, `matchingKeyAction`, `toggleSelection`, `canMatch`, `MATCHING_PAGE`, `MATCHING_ROW_HEIGHT`, `MATCHING_VIRTUALIZE_FROM` | Component | P5.21 | Two lists matched: suggestions first (confidence in words, partial notes), the lists side by side, the matches with Unmatch; multi-select listboxes (Space selects, Enter matches, Escape clears, Tab between lists); neutral selection; search and a virtualised list from 100 items; phones one list at a time. Computes nothing. |
| `BalanceBar`, `BalanceState`                                                                                                                                                                               | Component | P5.21 | Debit / Credit / Difference of a journal entry in EditableGrid's `footer` (sticky on phones); state from the application: Balanced, Not balanced (words + danger), Amounts missing ("—", never 0). Posting blocked by the application's UnavailableAction.                                                                          |
| `PeriodicRunPage`, `RunStep`, `RunCheck`, `RunLock`, `RunProgress`, `RunRerun`, `RunPreview`, `countChecks`, `RUN_RESULT_ORDER`, `RunCheckResult`                                                          | Template  | P5.21 | Payroll, depreciation, period close: header, lock line, Stepper (phones "Step 3 of 5: …"), running step's progress, checks in words and tone with counts, preview (summary + DataTable `inCard`), rerun with a reason (ReasonConfirmDialog).                                                                                        |

## 3. BUILD-PLAN status notes

- P5.21 (part, group F): `MatchingView` (keyboard, partial matches, phones), `BalanceBar` for the
  balanced entry (EditableGrid `footer`), `PeriodicRunPage`; examples bank statement 188, journal
  entry NK-2026-0912 (balanced and unbalanced), payroll September 2026 (review, rerun). Users and
  roles, SetupChecklist and Signing are group C's.

## 4. Needs

1. **AGENTS.md** components table: the three rows above (forbidden file for groups).
2. **docs/decisions.md**: the entries above, plus one "which one" rule for MatchingView /
   WorklistPage and for PeriodicRunPage / FormWizard / LifecycleBar / JobProgress (the
   integrator writes the combined rule with groups A and B).
3. **Group B (JobProgress):** `PeriodicRunPage`'s running-step block is marked
   `// INTEGRATION: JobProgress`; when JobProgress exists, the block can render it (label, value,
   max, text map directly onto it). `RunProgress` was kept small for that.
4. **Group D1 (company-logic helpers):** MatchingView imports `rowOffsets`, `visibleRows`,
   `scrollToShow` from `templates/company-logic.ts`. If D1 moves them to a neutral module, keep
   the old exports or update the import in `components/matching-view.tsx`.
5. **Group D2 / dataset:** the statement treats F-2026-0407 as not open (cancelled by D2) — the
   dataset's `INVOICES` still lists it as "Overdue 94.500,00"; if D2 changes its status in
   `examples-story-data.ts`, nothing changes here (it is excluded by number).
6. **Module links (integrator):** `/banking` is still a 404 in the core walk-through and the
   notification n6 links `#/banking`; the new routes are `/banking/statements/188`,
   `/accounting/journal/NK-2026-0912` and `/hr/payroll/2026-09`. Suggested: notification n6 to
   `#/banking/statements/188`, a Banking and an Accounting module on the Launchpad, the 404 story
   on another address (e.g. `/fleet`), and a "Payroll" module tab in `HR_TABS`
   (`screens-F.tsx` builds its own `PAYROLL_TABS` from `HR_TABS` for now).
7. **examples.stories.tsx imports:** group F's imports stand inside its block at the end of the
   file (ES imports are hoisted; lint and Prettier accept it) so blocks merge without touching the
   top. The integrator may move them to the top.
8. **Shared story helpers:** `components/matching-story-data.ts` (the matching "application":
   whole-paras allocation, `decimalOf`, `parasOf`, `sumParas`) and
   `templates/periodic-run-story-data.ts` (the payroll computation) are story-only files used by
   the component stories and by `data-F.ts`. If another group writes a paras helper, keep one.

## 5. Third-party code

None. No new dependencies; no shadcn files copied (icons from lucide-react, already a
dependency: ArrowLeftRight, Link2, Unlink2, Check, CircleCheck, CircleAlert, CircleHelp, CircleX,
Circle, TriangleAlert, Lock, LockOpen, RotateCcw, BookCheck, Send).

## 6. Verification results

Run on Windows (the owner's machine), 2026-10-08:

- `npx pnpm@12.6.0 lint` — pass. `npx pnpm@12.6.0 typecheck` — pass.
- `npx pnpm@12.6.0 test` — pass (packages/ui 47 files, 542 tests; new: `matching-view.test.tsx`
  15, `periodic-run-page.test.tsx` 5; `provider-p15.test.tsx` lists the 36 new keys).
- `npx pnpm@12.6.0 build` — pass. `npx pnpm@12.6.0 build-storybook` — pass.
  `npx prettier --check .` — pass.
- Story and accessibility tests on port 6107 (`playwright.local.config.mjs`), all four modes:
  `-g "MatchingView|BalanceBar|PeriodicRunPage|Examples /"` — every Components/Processes and
  Templates/PeriodicRunPage story passes (stories and axe). The Examples run with 4 workers had
  timeouts on heavy example screens, including the existing "Supplier invoices to approve" ones
  (other groups were running Playwright on the same machine); rerun with `--workers 2`:
  `-g "Examples / (Bank statement|Payroll|Journal|Supplier invoices to approve)"` — 88 passed.
- Not verified here: visual baselines (CI only, none created), the Linux CI run.
