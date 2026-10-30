# Floorplans

Every Liro screen is one of seven floorplans, inside one of three shells. A module author does not
design a screen: they pick its floorplan, fill it with their data and the library's components, and
the screen looks and behaves like every other Liro screen. The examples in Storybook
("Examples / F1 List" … "Examples / F7 Canvases") show each floorplan on a desktop and on a phone;
`docs/recipes.md` says how the screens the examples no longer show are composed (P5.89).

## The two principles (owner)

They apply to every screen, before any rule below.

1. **Simplicity first.** Show the minimum by default; advanced options are tucked away (a menu, a
   "More" drawer, a section that opens).
2. **Ease sells.** A first-day user must manage without training, under pressure: the fewest
   steps, big clear targets, immediate visible feedback on every action, **Undo** instead of a
   confirmation for anything reversible, nothing that blocks the user.

## Rules every floorplan shares

- **The application decides, the screen shows.** Figures, totals, states, rules, permissions and
  texts come from the application through props (AGENTS.md D1–D4). No floorplan adds, filters or
  sorts.
- **One primary action**, last in its group (D13). Secondary actions beside it; the rest under
  "More".
- **Phones:** one column, nothing scrolls sideways, lists flow with the page (no box that scrolls
  inside the page), dialogs are bottom sheets, the main action sits in the bottom bar (D19).
- **States, always:** loading (skeletons in the final layout, never a spinner over an empty
  page), empty (EmptyState with what to do next), no results (with "Clear filters"), error
  (ErrorState with "Try again"), no access (the reason in words), offline (OfflineIndicator).
- **Feedback:** a routine success is shown in place ("Saved" beside the action, a line's "Sent ·
  19:40", a table's state) with Undo beside what changed for anything reversible; a toast only
  for an error or an outcome outside the screen — it has its X, closes itself and covers no
  action; errors stay until read (D23).
- **Fields that cannot be changed are read only** (grey, readable, focusable, "—" when empty);
  an action that cannot be used says why. Hints are the library's tooltip, never the browser's
  (D3, D32).
- **Reversible actions are undone, not confirmed.** ConfirmDialog only before what cannot be
  undone or what reaches other people (D14, D24).

## The shells

| Shell           | For                                                                            | Anatomy                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **AppShell**    | Everyone inside a company: every floorplan below.                              | Header 56px: the product's lockup, breadcrumbs, search (Ctrl K), notifications, company switcher, user menu; module tabs (96px) when the module has more than one screen. Phones: compact lockup, the companies in the user menu, a bottom bar for the screen's main action.                                                                                                                                                                                                                                                                                              |
| **AuthShell**   | Signing in, two-factor, recovering a password, accepting an invitation.        | A 420px card on the sunken surface, the lockup above, the footer below; on phones no card frame. One field or one decision per step.                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| **PortalShell** | People outside the company: patients, parents, students, customers, employees. | Header with the brand and the person's menu; at most five sections as centred tabs, a bottom navigation bar on phones; the home shows only what matters now (quick actions, to-dos, what is new) and ends with the top common questions (CommonQuestions, `limit`) and "All questions" (P5.94), which opens Questions and answers, a page of its own (QuestionsAndAnswers, each answer on its own page in AnswerView, P5.96); a request that needs proof shows the expected documents under its FileDropzone (`expected`). The same floorplans inside, usually F2 and F6. |

PosShell is the till's full-screen shell (F7).

## Out of scope: printed documents → liro-folio (P5.95)

A printed document (an invoice, a note, a quote, a delivery note, a decision, a contract, a letter,
minutes, a payslip, an IOS statement, a ledger report, a prescribed form, the fiscal receipt, a
label) is not a floorplan and not a screen: liro-folio renders it as a PDF, from
`@veljaos/tokens` only. The Design System has no React replica of one; its screens show the PDF or
its page images (F3's "PDF" action, `FilePreview`, `DocumentFrame`, `PageViewer`) and, at the till,
`ReceiptResult`. A screen printed as you see it (a report, a chart, a list) is still a screen.

## The templates (P5.92)

The library keeps these page templates, each a floorplan's frame: the shells (AppShell,
AuthShell, PortalShell, PosShell) and Launchpad; F1 `ListPage`, `RegisterPage`; F2 `DetailPage`,
`RecordFormPage`, `SettingsPage`; F3 `DocumentPage`; F4 `WorklistPage`; F5 `DashboardPage`,
`ReportPage`, `StatutoryFormPage`; F6 `PeriodicRunPage`; `StatusPage` and `NotificationsPage`.
The printouts left in P5.95 (see "Out of scope: printed documents → liro-folio"). Everything else is a composition of these and the
components, written in `docs/recipes.md` ("Pages composed from the core templates"): a legal act
is a DocumentPage with LegalText, legal search a ListPage with SearchResultList, a course, an
article or "Ask" one reading page, picking and counting a WorklistPage or ListPage in touch
density, a payment order a RecordFormPage, signing a DetailPage with SignerList, the files a
ListPage with the file components. Each template shows four to six stories in the Storybook sidebar (default, empty,
loading, error, phone and the one that matters most); its other variants stay in the tests.

## F1 List — `ListPage`

**When:** a set of records to find, scan and act on: lists, catalogues, registers, queues (an
invoice list, customers, items, a registry book). Not for deciding items one by one (F4).

**Anatomy, desktop:** the title (hidden when a module tab names the page) and the main action
("New invoice") above ONE card: saved views as tabs at its start (counts in the tab, the first
five, the rest under "More"; "Save view" at the end), the FilterBar (search 260px at the start,
the most used filters beside it, the rest in "More filters", actions at the end), then the
DataTable (sticky header, the first column sticky, totals as its last row, paging at the bottom).
A press on a row previews the record in a QuickPreview drawer; "Open" or Enter opens its F2 or F3
page.

**Anatomy, phone:** the views as one select, the search and a "Filters" drawer, rows as cards
(the key value at the end of the first line, the state as a badge), the main action in the
bottom bar.

**Actions:** the list's main action at the top; a row's actions in its menu at the row's end;
actions on several rows in the BulkActionBar that slides in on a selection (with "Select all
N"); import and export in the toolbar's actions. "Search all…" (LookupDialog) for a choice among
thousands; BulkEditDrawer for changing a field on many records at once (each field "Leave
unchanged" until ticked).

**Editing:** never in the list. A short edit of one record: a Drawer over the list (D14); a
longer one: its page.

**States:** first load as table skeletons; refetching keeps the rows with a thin loader;
"no records yet" (EmptyState with the main action), "no results" (with "Clear filters"), error
with "Try again", no access.

**Examples:** Invoice list; Customers (search all, bulk edit, the import entry).

## F2 Record — `DetailPage`, `RecordFormPage`, `SettingsPage`

**When:** one thing viewed and edited as a whole: an employee, a customer, an item, a profile, a
company's settings. A record has fields and sections, not lines (lines make it F3).

**Anatomy, desktop:** back ("Back to Employees"), the title, its state and subtitle, the actions
at the end; KeyFigures under the title when a few values matter most; sections as SectionCards
(a SectionBar when there are more than four); a side column of 300px from 75em for related
records and activity (SidePanels), moved under the content below. SettingsPage: section cards of
rows (name and description at the start, the control at the end), groups as tabs.

**Anatomy, phone:** one column; sections stacked; the side panels after them; Edit and Save in
the bottom bar.

**Editing:** the whole record at once. **DetailPage** `mode="edit"` turns every section into its
fields; Cancel – Save in a sticky bar; one Save for everything. **RecordFormPage** for a new
record (actions at the top and in a bottom bar while the top is out of view; the unsaved-changes
guard on Back). **SettingsPage** saves each row at once and shows "Saved" or the error in that
row — no Save button. Errors stay under their fields; Save moves the focus to the first.

**States:** skeletons of the sections; not found (StatusPage 404); no access (403); read-only
with the reason; saving (the button busy, the record still readable).

**Examples:** Employee record (view and edit); My profile.

## F3 Document — `DocumentPage`

**When:** a business document with lines: an invoice and its draft, a journal entry, a purchase
order, a goods receipt, a delivery note, a travel order, a work order, a price calculation, a
stocktaking, a specification, a credit or debit note.

**Anatomy, desktop (fixed order):** the LifecycleBar (its states), back + number + state +
actions ("Hide panels" from 75em); a banner when it is cancelled or blocked; the header (the
counterparty with its address and tax number, dates, currency, references "Based on: …"); the
lines in one card without a title; the totals at the end side (DocumentTotals, from the
application); notes; attachments; further sections; side panels of 300px from 75em (related
documents, history, comments).

**The line editor — one for every document.** `EditableGrid`, the same on every document and on
every device: a line is item, quantity, unit, price, tax and amount by default (the application
chooses its columns); headings, text lines and discounts come from an "Add …" menu, and the
discount column shows only when a discount is used. Enter moves down the column and adds a line
after the last; the application computes every amount and total and returns them (SettlingValue
while it does). On a phone: one card per line with its fields, the totals (or balance) in one
clear place, "Add line" always visible, nothing overlapping.

**Phone:** the header as key values, the lines as cards, the totals after them, the main action
in the bottom bar; side panels after the document.

**Editing:** a draft is edited in place on the same page (the header fields as
ChangeableValues, the lines in the editor); a posted document is read-only and corrected only by
another document (a decrease, a cancellation), linked both ways.

**States:** skeleton of header, lines and totals; a draft with problems (each under its field or
line, the count at the top); posted, cancelled (CancellationBanner), locked period (the reason).

**Examples:** Invoice; Invoice draft; Journal entry; Decrease document.

## F4 Worklist — `WorklistPage`

**When:** items that each need a decision, one after another, from a handful to thousands:
approve or reject supplier invoices, match a bank statement's lines, decide screening matches,
handle alerts, approve travel settlements, review recognised documents. Every "go through many
lines and decide" screen is this one floorplan (P5.94 item 19) — never a table with a drawer, and
never a focus view of its own.

**Anatomy, desktop:** the title (with back, the record's state and a subtitle when the queue
belongs to a record) and, under it, a thin summary strip of the record when it has one
(`WorklistSummary`: its figures, "3 of 10 done" with a bar, the application's check in words,
and its final action — "Post statement" — only once nothing waits). Then one card: the queue
(380px) at the start and the chosen item's detail beside it from 62em, each scrolling on its own.
At the top of the queue, always in view: the bulk action for what the application handled
automatically ("Accept all exact matches (6)", answered by Undo in place, never a
confirmation), the search (name, amount, reference, account — the application's), and the states
as chips with their counts ("All 11", "Needs you 3", "Suggestion 2", "Matched automatically 6",
"Done 0"; always "All" first, so every item can be seen (P5.96), and the one that needs the user
chosen by default; chips wrap, so every state is in view). Each row:
title, a short subtitle (what it does), the deciding figure, the state in a badge. From 100 items
only the rows in view are drawn (thousands stay fast). The detail shows the item whole — for a
statement line the payer or payee, the amount, purpose and reference, the proposed match or the
choices, the reasons as short labels — and under it one bar: the position ("3 of 11"), Previous,
Next and the decisions, the main one last ("Confirm").

**Deciding:** the main decision opens the next item that waits by itself (in the chosen state
first, then the other states that wait), with "Line 3 done … Undo" in place above it; a decision
that reaches other people or cannot be taken back asks first or says so (a rejection sent to SEF,
an issued invoice). Keyboard: the queue is one tab stop; ArrowUp / ArrowDown, Home and End move in
it and the detail follows; Enter takes the main decision; the focus follows to the next item.

**Anatomy, phone:** the summary strip, then the queue (the state that needs the user first); a
press opens the item full screen with "Back to list", its position and Previous / Next in its
header and the decisions in the bottom bar; deciding opens the next item.

**Editing:** only the decision and what it needs (a reason, an account, the open items it
closes); the rest of the item is read-only; a decision is undone in place (or from the item's
history) until the record is finished.

**States:** loading rows; "Nothing needs you" (an EmptyState per state) and "No lines match"
with "Clear search"; an item that failed with its message; no access.

**Examples:** Supplier invoices to approve; Bank statement (188, and 189 with 1,240 lines).

## F5 Overview and analysis — `DashboardPage`, `ReportPage`, `StatutoryFormPage`, `Pivot`

**When:** to see where things stand and dig in: a module's overview, a report with parameters, an
official form (VAT return, financial statements), a pivot analysis.

**Anatomy:**

- **DashboardPage:** the title and the period; StatCards (1, 2 or 4 per row); charts in two
  columns from 62em; each chart opens its records. DashboardGrid when the user arranges cards.
- **ReportPage:** the parameters in one row with Run at the end; after a run a one-line summary
  with Edit; the result (a DataTable or TreeTable) under it; export in the header.
- **StatutoryFormPage:** the form's real grid (groups over sub-columns, numbered sections),
  entered / computed / source cells (a source cell opens its documents), the rule checks with
  "Go to", the previous period as a comparison under each value.
- **Pivot:** the application's suggested views first; the layout in one line of words; the
  fields in a sheet with four zones Rows / Columns / Values / Filters — chips dragged between
  them, or moved by their menus; a figure opens its records.

**Phone:** figures two per row, one chart per row, tables as cards (official forms one card per
row, each value labelled with its group and column).

**Editing:** none, except the cells an official form asks for; a figure is opened, not edited.

**States:** skeletons in the final layout; "no data for this period"; an error with "Try again";
a chart's own empty and error states.

**Examples:** Overview (dashboard); Trial balance; VAT return; Cost analysis (pivot).

## F6 Steps — a wizard

**When:** a task with an order the user must follow once: an import, a booking, a questionnaire, a
periodic run (payroll, depreciation, period close), onboarding.

**Anatomy, desktop:** the Stepper above the step; one step's content; Back and Next (the main
action last) at the bottom; a summary before the final action; what was done after it.
ImportWizard (file → columns → check → import), Questionnaire (branching questions), FormWizard
(steps of a form), PeriodicRunPage (lock, steps, checks in words, preview, post).

**Anatomy, phone:** the compact Stepper ("Step 2 of 4 · Columns") and one sticky Back / Next row.

**Editing:** Back keeps what was entered; nothing is saved before the last step; leaving a
started wizard asks first.

**States:** a step that waits for the application (JobProgress), a check that blocks Next with
its reason under the button, a finished run with its report.

**Examples:** Customer import; Health, book an appointment; Payroll run.

## F7 Special canvases — only where a list or a form cannot do

**When:** time on a grid (CalendarView, ResourceSchedule, Timetable, Gantt), places on a plan
(FloorPlan, SeatingChart, RoomRack), the till (PosShell, ProductGrid, CartPanel, PaymentDialog),
a process (Diagram) or a map. Use one only when the shape of the thing is the information.

**Anatomy:** the canvas fills the page under the shell; its toolbar above it (period or area,
view, zoom); the record behind an item opens in place in a Drawer, never on another page or
module tab (D29); the one "now" marker from the application's time (D25).

**Phone rule:** a phone shows today's lists, not the full canvas — a doctor's agenda instead of
the week grid, today's arrivals, departures and in-house guests instead of a 200-room timeline,
the list of tables instead of editing a plan — with search and filters; the full canvas stays on
desktops and tablets. The till on a phone is the product grid with the order as a compact bar
that expands.

**Editing:** moving or changing what other people rely on only proposes and the application
confirms (ChangeConfirmDialog, D24); dragging always has a keyboard and a menu way.

**States:** loading in the canvas's shape, an empty period or area, offline (the till keeps
selling and queues).

**Examples:** Doctor's calendar; Restaurant service (the floor plan with a table's tab); POS
checkout; Project timeline.
