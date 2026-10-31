# Layout and floorplans

Every screen is one of seven floorplans inside a shell. Pick the floorplan, fill it with the
application's data and the library's components. Storybook "Examples / F1 List" … "F7 Canvases"
show each on a desktop and a phone.

## Shells

- **AppShell** — everyone inside a company. Header 56px: lockup, breadcrumbs, search (Ctrl K),
  notifications, company switcher, user menu; centred module tabs when a module has several
  screens. No sidebar. Phones: compact lockup, companies in the user menu, a bottom action bar.
- **AuthShell** — sign-in, two-factor, recovery, invitations: a 420px card on the sunken surface,
  one field or decision per step; no card frame on phones.
- **PortalShell** — patients, parents, students, customers, employees: brand and the person's menu,
  up to five sections as centred tabs (a bottom bar on phones; a sixth is a menu entry there). The
  home shows quick actions, to-dos, what is new and the top common questions.
- **PosShell** — the till, full screen (F7).

## Shared rules

- One primary action, last in its group; the rest under "More".
- Which container: a **page** for anything with more than about ten fields, tabs or attachments; a
  **Drawer** for a short edit with the list still visible; a **Dialog** for one action with one
  outcome or a read-only view; a **ConfirmDialog** only before what cannot be undone or reaches
  other people.
- A dialog on one record has the action as its title and the record bold under it (`subject`); on
  several or none the title is a question ("Approve 12 invoices?").
- Long forms have actions at the top and at the bottom. A list: search at the start, filters beside
  it, actions at the end, paging at the bottom.
- Moving what others rely on (appointments, shifts, seats, beds) only proposes; the application
  confirms with ChangeConfirmDialog (old → new, who it concerns, "Notify …" checkboxes).
- Tabs switch different content and stand above it at the start, 16px apart; hidden panels are not
  mounted, so a dialog opened from a tab lives at page level. Only the AppShell module tabs and
  PortalShell sections are centred.
- A tab row never wraps: it scrolls sideways with faded edges, chevrons and the wheel, keeping the
  active tab in view (`useTabRow`).
- Everything sticky at the top sits under the shell: `top-[var(--liro-shell-top,0px)]`.

## Templates

Shells, Launchpad; F1 `ListPage`, `RegisterPage`; F2 `DetailPage`, `RecordFormPage`,
`SettingsPage`; F3 `DocumentPage`; F4 `WorklistPage`; F5 `DashboardPage`, `ReportPage`,
`StatutoryFormPage`; F6 `PeriodicRunPage`; `StatusPage`, `NotificationsPage`. Everything else is
composed (see Recipes).

## F1 List — `ListPage`

A set of records to find, scan and act on. The main action above ONE card: saved views as tabs
(the first five, the rest under More), the FilterBar, the DataTable. A press previews in a
QuickPreview drawer; Enter or "Open" opens the record. Bulk actions in the BulkActionBar; "Search
all…" is LookupDialog; BulkEditDrawer changes a field on many records. Never edit in the list.
Phone: views as one select, search and a Filters drawer, rows as cards.

## F2 Record — `DetailPage`, `RecordFormPage`, `SettingsPage`

One thing viewed and edited as a whole. Back, title, state, actions; KeyFigures; sections as
SectionCards (a SectionBar beyond four); side panels 300px from 75em. Edit the whole record at once
(`mode="edit"`, Cancel – Save in a sticky bar). RecordFormPage for a new record, with the
unsaved-changes guard. SettingsPage saves each row at once with "Saved" in the row.

## F3 Document — `DocumentPage`

A business document with lines. Fixed order: LifecycleBar, back + number + state + actions, a
banner when cancelled, the header (counterparty, dates, currency, "Based on: …"), the lines card,
DocumentTotals at the end side, notes, attachments, sections, side panels. One line editor for
every document: `EditableGrid` (Enter goes down and adds a line; headings, text and discounts from
"Add line ▾"; the application computes every amount). A draft is edited in place
(ChangeableValues); a posted document is read only and corrected only by another document, linked
both ways.

## F4 Worklist — `WorklistPage`

Items decided one after another, from a handful to thousands: approvals, statement lines,
screening matches, alerts. Never a table with a drawer. Optional `WorklistSummary` strip (figures,
"3 of 10 done", the final action once nothing waits). One card: the queue (380px) and the detail
beside it from 62em. On top of the queue: the bulk action for what the application matched ("Accept
all exact matches (6)" with Undo), the search, the states as chips with counts ("All" first, the
state that needs the user chosen). The decision bar: position, Previous, Next, the main decision
last; it opens the next waiting item with "… done · Undo" in place. Keys: one tab stop,
ArrowUp/ArrowDown/Home/End, Enter decides. From 100 items only rows in view are drawn.

## F5 Overview and analysis

`DashboardPage` (StatCards 1/2/4 per row, charts in two columns from 62em, `DashboardGrid` when the
user arranges cards); `ReportPage` (parameters in one row with Run, then a one-line summary with
Edit); `StatutoryFormPage` (the official form's real grid, see [tables](tables.md)); `Pivot`
(suggested views first, the layout in words, fields in a sheet of four zones). A figure opens its
records; nothing is edited except an official form's entered cells.

## F6 Steps

A task with an order: ImportWizard, Questionnaire, FormWizard, PeriodicRunPage (lock, steps, checks
in words, preview, post, rerun with a reason). Stepper above, Back / Next with the main action
last, a summary before the final action. Back keeps the data; nothing is saved before the last
step; leaving asks first. Phone: "Step 2 of 4 · Columns" and one sticky Back / Next row.

## F7 Special canvases

Only where the shape is the information: time grids (CalendarView, ResourceSchedule, Timetable,
Gantt), plans (FloorPlan, SeatingChart, RoomRack), the till, a Diagram, a map. The record behind an
item opens in place in a Drawer, never on another page. A phone shows today's lists (an agenda,
today's arrivals), not the full canvas.

- Time: "now" only from the application's `now`; in calendar views one small dark tag with the
  time in the gutter, no line across the days; the current slot `aria-current="time"`. The Gantt
  keeps one neutral NowMarker line under its bars.
- Plans: no walls, doors or windows (a real drawing is `background`); labels are never cut (what
  does not fit is left out and said in the list); six or more areas are switched one at a time;
  takeaway and delivery are channels, not areas; phones open on the list and never edit a plan. A
  restaurant table opens its tab in one tap; "Needs cleaning" exists only if the application
  turns it on.

## Recipes

Each screen names its floorplan and pieces; data and rules are the application's.

- **Legal act** — F3: DocumentPage with LegalText, LegalContents (start Drawer), useLegalPanels;
  LegalCompare for versions. **Legal search** — F1: ListPage, FilterBar (tree filter),
  SearchResultList, CursorPagination.
- **Reading page** (lesson, article, "Ask") — F2: DetailPage, one reading-width section of RichText
  (`headingIds`), PageContents or a TreeView outline; "Ask" is AssistantComposer large and centred.
- **Going through many lines** (bank statement, open items, recognised documents, matches) — F4 as
  above, with CandidateList, ValueComparison, InlineUndo, `nextWorklistItem`.
- **Questions and answers** — PortalShell page: QuestionsAndAnswers (search, chips with counts, 30
  at a time, `askAction` when nothing is found), AnswerView per answer; the home keeps the top
  three to five as CommonQuestions.
- **Handheld picking and counting** — F4 / F1 inside `density="touch"` at 360px: ScanField,
  QuantityStepper, ReasonConfirmDialog to skip, OfflineIndicator; a blind count shows no expected
  figures.
- **Payment order** — F2 RecordFormPage with `ipsProblemsOf` checks; the screen's QR from
  `ipsQrText`.
- **Signing** — F2 DetailPage: the PDF (DocumentFrame, FilePreview or PageViewer) as the first
  section, SignerList in the side column (first on phones).
- **Files** — F1 ListPage: TreeView of folders, UsageMeter, FilterBar (List / Grid), DataTable or
  FileGrid, FileDetails, the file dialogs, FilePreview.
- **Accounting** — chart of accounts F1 (TreeTable); account card, cash book, rates, interest F5
  ReportPage; balance sheet F5 StatutoryFormPage; fixed asset F2 (Dispose = IrreversibleConfirm);
  depreciation and contracts runs F6 PeriodicRunPage; budget F5 (TreeTable, BarChart); travel
  order and settlement F3 (EditableGrid), settlements to approve F4.
- **Trade** — quotes, orders, deliveries, invoices F3 (SplitAction to the next document,
  RelatedDocuments); EUR invoices with DocumentCurrency, TaxRecap; cancellation with
  CancellationBanner and DocumentSource; goods receipt with ChangeText; three-way match with
  ValueComparison; CRM pipeline and candidates as KanbanBoard (lost asks why).
- **Inventory** — item card F2; transfer, stocktaking, work order, price calculation F3; bill of
  materials TreeTable; production plan Gantt; warehouse FloorPlan.
- **HR** — timesheet AttendanceGrid; clock records ClockRecordList; shifts ShiftPlanner, MyShifts,
  ShiftSwapDialog, swap approvals F4; WorkingTimeBalance; registers RegisterPage; leave requests
  in PortalShell with FileDropzone `expected`; approvals F4 with ReasonConfirmDialog.
- **Health** — schedule ResourceSchedule; findings and charts F2 with MaskedValue (allergies never
  masked); lab results LineChart; ward FloorPlan with `background`.
- **School** — Timetable; attendance and gradebook AttendanceGrid; parents' and students' portals
  in PortalShell; exam registration F6 with CandidateList; exam record F3 with SignerList.
- **Hospitality** — RoomRack, bookings ResourceSchedule `scale="days"`, restaurant FloorPlan and
  editing, SeatingChart (pending seating through ChangeConfirmDialog), café tab on PosShell.
- **Field service, fleet, property** — work orders F1/F2 (camera, offline); vehicles F1/F2; units
  RoomRack; leases F2; rent run F6; tenant portal CategoryGrid.
- **Documents and governance** — inbox F1 with PageViewer; review F4 with RecognizedField and
  DuplicateWarning; drafts from DefinedForm; registry and archive books RegisterPage; meetings F2
  with votes and SignerList; disposal F3 with IrreversibleConfirmDialog.
- **AML** — clients F1; client file F2 (HierarchyChart of owners, MaskedValue); screening and
  alerts F4; cases F3 with four-eyes SignerList; reports DefinedForm; overview DashboardPage.
- **Administration and helpdesk** — users and roles with PermissionMatrix; setup SetupChecklist;
  health HealthList; audit and sign-ins F1; impersonation ImpersonationBar with `note`; helpdesk
  inbox with SlaTimer, ticket with ReplyComposer; support portal with LinkSuggestions and
  SatisfactionRating; sign-in screens in AuthShell (PasswordField, CodeInput, RecoveryCodes).
- **Analytics and AI** — scheduled reports with EmailPreview; director's DashboardGrid; Pivot;
  RuleBuilder; Diagram run and edit; duplicates and merges with ValueComparison `chosen`;
  AssistantPanel, AssistantAnswer, ProposedAction (nothing calls a model); AreaMap,
  LocationCheck, RegionChart, HierarchyChart; blog ArticleList; e-mail templates with
  RichTextField merge fields; subscriptions with PlanComparison and UsageMeter.
