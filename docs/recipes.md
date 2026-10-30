# Recipes

These are the screens the Storybook examples no longer show. Each entry names the screen's
floorplan and the library pieces that compose it, so the knowledge stays without the screen. The
data, the rules and every figure are always the application's: the pieces show and report, they
never count, check or decide. To build a new screen, pick its floorplan in `docs/floorplans.md`
and compose these pieces; the 26 kept examples in Storybook "Examples" show each floorplan.

## Out of scope: printed documents → liro-folio (P5.95)

Every printed document — invoices, credit and debit notes, quotes, delivery notes, decisions and
rulings, contracts, letters, minutes, payslips, IOS statements, ledger reports, prescribed forms,
the fiscal receipt and labels — is a PDF that liro-folio renders (its own repository, on
`@veljaos/tokens` only, never `@veljaos/ui` or React). The Design System owns only the screens
around a document and shows the PDF or its page images: a "PDF" / "Download PDF" action,
`FilePreview`, `DocumentFrame`, `PageViewer`, `AttachmentList`, `EmailPreview`; at the till
`ReceiptResult` (state, number, Print, Send, Copy). It has no React replica of a printed document.
A screen printed "as you see it" (a report, a chart, a list; HierarchyChart with `toolbar={false}`
and `framed={false}`, a screen's `@media print` rules) is not a document and stays.

## Pages composed from the core templates (P5.92)

The library keeps these page templates: the shells (AppShell, AuthShell, PortalShell, PosShell),
Launchpad, ListPage, DetailPage, RecordFormPage, SettingsPage, DocumentPage, WorklistPage,
DashboardPage, ReportPage, StatutoryFormPage, RegisterPage, PeriodicRunPage, StatusPage and
NotificationsPage (PrintPage and PrintDocument left in P5.95, see "Out of scope: printed documents
→ liro-folio"). The domain page templates it had before P5.92 are composed from them and the
components, as below; the components stay.

- **Legal act** — F3 Document: `DocumentPage` (back, the act's title as the h1 with `lang`, its
  status as a `StatusBadge`, "type · issuer" as the subtitle, the gazette line as
  `DocumentReferences`, the version in a `SelectField` "Version as of …"; actions Compare
  versions, Copy citation, Print / PDF, Watch and Bookmark with the state in the label) with
  `LegalText` (and its toolbar) in the lines' card, `LegalContents` in a start-side `Drawer`, and
  `useLegalPanels` as the side panels ("Hide panels" from 75em; a "Details" full-screen sheet on
  phones). Comparing two versions: `LegalCompare`, the versions from `useVersionRange`.
- **Legal search** — F1 List: `ListPage` with saved views, `FilterBar` (the area as a `tree`
  filter, type, issuer, status, dates) and, instead of the table, `SearchResultList` (type,
  issuer and status as context; the title link; gazette references; the snippet from
  `snippetFromRanges` with matches marked; "Found in Article 57"); "Sort: …" as a menu beside the
  count, `CursorPagination` under the list; the application searches.
- **Reading page** (a course lesson, a blog article, "Ask") — F2 Record: `DetailPage` with one
  section of reading width and no frame (`RichText` with `headingIds`; pictures and video within
  its width), `PageContents` or the course outline (`TreeView` with the lesson states in words,
  "7 of 12 lessons") in the side column, previous / next and Mark as done at the end; phones:
  the content first, the outline in a `Drawer`. A page with only a question box ("Ask") is the
  same page with `AssistantComposer` large and centred.
- **Going through many lines and deciding** (a bank statement, a supplier's statement of open
  items, an IOS reconciliation, recognised documents, screening matches, alerts, a card's
  payments) — F4 Worklist, one pattern (P5.94 item 19): `WorklistPage` with `WorklistSummary` as
  the record's strip (its figures, "3 of 10 done", its check; the final action only once nothing
  waits), the bulk action for what the application matched by itself as `toolbar` ("Accept all
  exact matches (N)", then `InlineUndo`), `search` and `filters` (Needs you, Suggestion, Matched
  automatically, Done, each with its count, Needs you chosen), the item whole in `detail` (the
  proposal or the choices, the reasons as neutral `StatusBadge` labels, `CandidateList`), Confirm
  last in `detailActions` and `onConfirm` for Enter; the application opens the next item that
  waits (`nextWorklistItem`) and shows "… done · Undo" in place. Thousands of items are drawn in
  view only. The example "Bank statement 188" (and 189, 1,240 lines) shows it whole.
- **Questions and answers (any portal)** (an employee's, a patient's, a tenant's, a client's;
  P5.96) — in `PortalShell`, a page of its own once there are more than a home page's few:
  `PageHeader` ("Questions and answers", back home), then `QuestionsAndAnswers` with every
  question (300 and more): one search field first that filters as you type over the questions,
  answers, documents and keywords (case and accents ignored, "dj" finds "đ") and marks the words
  found, the categories as chips with their counts ("All" first, the neutral selection), 30 at a
  time with "Show more", and nothing found offering the application's `askAction` ("Ask HR")
  with the words typed (a `Drawer` to write the question, D14). Each question is a link to its
  answer's own page (`answerHref`, through the provider's `linkComponent`): `AnswerView` — the
  question as the h1 with the way back, the answer, "What to do", "What you need" and the
  request that does it started filled in (the page's main action). The home page keeps the top
  three to five as `CommonQuestions` (`limit`, opened in place) beside "All questions"; the page
  is reached from there and from the portal's navigation: on desktop a section of its own (a
  tab), on phones, whose bottom bar holds five sections, an entry of the participant's menu. The questions, answers, order and counts' categories are the application's data;
  a search on the server is `SearchResultList` instead. The Shell example "Employee portal,
  questions and answers" (330 questions) and "Employee portal, an answer" show it.
- **Handheld picking and counting** — F4 Worklist (picking: one line at a time, decided with
  scans) or F1 List (counting: the items of a location) inside
  `<LiroProvider density="touch">` at 360px: `PageHeader` with the progress in words ("4 of 12"),
  `ScanField` for location and item, `QuantityStepper` (large) to confirm, skip with a reason in
  `ReasonConfirmDialog`, the route or the counted items as a list with their states in words,
  `OfflineIndicator` and the queue; "All lines are done" as `EmptyState`. Expected quantities
  and signed differences are the application's (none in a blind count).
- **Payment order** — F2 Record: `RecordFormPage` with the order's fields (`FormGrid`,
  `MoneyField`, `SelectField`, `RadioGroupField`, `ipsProblemsOf` for the checks under their
  fields); its printed form is liro-folio's PDF (P5.95), the IPS QR code on it from the same
  payment; on the screen `QrCode` from `ipsQrText`.
- **Signing** — F2 Record: `DetailPage` (or `DocumentPage` when the document has lines) with the
  document (liro-folio's PDF in `DocumentFrame` or `FilePreview`, or its page images in
  `PageViewer`) as the first, flush section, `AttachmentList`, and
  `SignerList` in the 300px side column — first on phones. The signing is the Core's. See the
  Shell example "Employee portal" (its annex).
- **Files** — F1 List: `ListPage` with a start column of places (`TreeView` of folders, the
  storage `UsageMeter`), the `FilterBar` (search, type, List / Grid, Details, New folder, Upload
  last), the list as `DataTable` or `FileGrid`, `FileDetails` in the side column, uploads in
  `AttachmentList`; `FileDropzone` in a `Dialog`, `FolderPickerDialog`, `NameConflictDialog`,
  `FileNameDialog`, `ShareDialog`, `VersionList`, `FilePreview`. The helpers of
  `file-browser-logic` (`canDropInto`, `blockedFolders`, `selectRange`, `uploadCounts`,
  `resolveConflicts`) stay exported.
- **Printed documents** (an invoice, a certificate, a school report, a medical finding, a legal
  act, a payment order, a statutory form, a payslip, the fiscal receipt) — not in the Design System
  (P5.95): liro-folio renders each as a PDF. The screen around it is the library's: a "PDF" or
  "Download PDF" action, the PDF in `FilePreview` or `DocumentFrame`, or its page images in
  `PageViewer`. See "Out of scope: printed documents → liro-folio".

## Accounting

- **Chart of accounts** — F1 List: `ListPage` with `FilterBar` and `TreeTable` (classes, synthetic and analytic accounts), an account's details in a `Drawer` with `KeyValueList`; the chart is the application's.
- **Account card** — F5 Overview: `ReportPage` (account and period as parameters, `SelectField`), `DataTable` with the running balance and each document as a link; balances are the application's.
- **Balance sheet** and **Income statement** — F5 Overview: `StatutoryFormPage` (the form's grid, the previous year as a comparison under each value), a note in a `Drawer` with `KeyValueList`.
- **Cash book** — F5 Overview: `ReportPage` by day, `KeyFigures`, `DataTable`, a neutral `Alert` when the application says the cash limit is exceeded.
- **Cash receipt** and **Cash payment** — F3 Document: `DocumentPage` with `KeyValueList` and its lines in `DataTable`; the cash-limit warning is the application's `Alert`.
- **Late-payment interest** — F5 Overview: `ReportPage` with `KeyFigures`, the periods and rates in `DataTable`, `ConfirmDialog` to issue the interest note; rates and interest are the application's.
- **Interest note** — F3 Document: `DocumentPage`, `DocumentReferences` to the invoices it is based on, lines in `DataTable`.
- **Exchange rates** — F5 Overview: `ReportPage` with a `DateField`, the day's rates in `DataTable`, `EmptyState` for a day without a list; rates are never rounded.
- **Foreign-currency accounts** — F1 List: `ListPage` with `DataTable`, amounts in the currency and in the home currency.
- **Exchange-rate differences** — F5 Overview: `ReportPage` with `KeyFigures` and `DataTable`, posting through `ConfirmDialog`, `UnavailableAction` while a rate is missing; the differences are the application's.
- **Fixed assets** — F1 List: `ListPage`, saved views (in the register / disposed and sold / all), `FilterBar` by group, `DataTable`.
- **Fixed asset**, also **Asset disposal** — F2 Record: `DetailPage` with its key figures, value history and the year's schedule in `DataTable`; "Sell…" a `Dialog` (`DateField`, `MoneyField`), "Dispose…" an `IrreversibleConfirmDialog` with `reason`.
- **Depreciation run** — F6 Steps: `PeriodicRunPage` (lock, steps, checks in words, preview before posting, rerun with a reason), every asset's line in `DataTable`.
- **Budget**, also **Budget by project** — F5 Overview: `Tabs` (by cost centre / by project), `KeyFigures`, `TreeTable` of plan against actual, `BarChart` from `@veljaos/ui/charts`; `UnavailableAction` for what the user may not change.
- **Budget entries** — F1 List: the drill-down from a budget line, `KeyFigures` over `DataTable` of the entries, each a link.
- **Loans and leases** — F1 List: `ListPage` with `DataTable`.
- **Loan** — F2 Record: `DetailPage`, `KeyValueList`, the repayment schedule in `DataTable`, the outstanding principal as an `AreaChart`; the schedule is the application's.
- **Service contract** — F2 Record: `RecordFormPage` with `FormSection`, `DateRangeField`, `MoneyField`, `RadioGroupField`; the application's calculation shown in `DocumentTotals`.
- **Service contracts run** — F6 Steps: `PeriodicRunPage`, `KeyFigures`, the contracts in `DataTable`.
- **Travel order** — F3 Document: `DocumentPage` (traveller, destination, dates, how they travel and the cost centre as header fields), its costs and the advance in the line editor (`EditableGrid`), `DocumentTotals`; Send for approval goes to the approver's F4 worklist; per-diems and limits are the application's data.
- **Travel settlement** — F3 Document: `DocumentPage` based on its travel order (`DocumentReferences`), the costs in the line editor (`EditableGrid`), receipts by `FileDropzone` with `camera` and `AttachmentList`, per-diems and the settlement in `DocumentTotals`; the per-diems are the application's data.
- **Travel settlements to approve** — F4 Worklist: `WorklistPage`, Reject with `ReasonConfirmDialog`, then Approve.
- **Payment orders** — F2 Record: see "Payment order" under "Pages composed from the core templates".

## Trade (purchasing, sales, pricing, offsets)

- **Invoice with history, comments and presence** — F3 Document: `DocumentPage` with `PresenceAvatars`, `StatusTimeline`, `RelatedDocuments`, comments as `MessageThread` with an `AgentQuestion` (`Questionnaire` inside), `HistoryList`, `ActivityList` in the side panel.
- **Final invoice with advances** — F3 Document: `DocumentPage` with `DocumentReferences`, advances deducted in `DocumentTotals`, `DocumentNotes`, `AttachmentList`, `RelatedDocuments`; deductions and the tax recap are the application's.
- **Interim situation with a specification** — F3 Document: `DocumentPage`, `DocumentSpecification` (300 positions opened read-only), `DocumentTotals`, `DocumentReferences`.
- **Interim situation, editing the specification** — F3 Document: the line editor (`EditableGrid`) with heading and subtotal lines (`LINE_TYPES`), Previous / This period / Cumulative columns, `ChangeableValue` in the header.
- **Invoice in EUR, mixed tax categories** — F3 Document: `DocumentPage` with `DocumentCurrency` (rate never rounded), totals with `TaxRecap` and `TotalsExchange` in `DocumentTotals`.
- **Cancelled invoice and its cancellation document**, also **Cancellation document** — F3 Document: `DocumentPage` with `CancellationBanner` (who, when, why) and `RelatedDocuments`; the cancellation shows its source with `DocumentSource`.
- **Purchase order** — F3 Document: `DocumentPage`, `KeyValueList`, lines in `DataTable`.
- **Goods receipt** — F3 Document: `DocumentPage`, `DocumentReferences` to the order, Ordered / Difference / Received with `ChangeText`; the difference's reason is the application's.
- **Three-way match** — F4 Worklist step on `DetailPage`: `ValueComparison` with three sources (order, receipt, invoice), `RelatedDocuments`, `ActionGroup` to accept or ask for a credit note; the match is the application's.
- **Sales quotes** — F1 List: `ListPage`, `FilterBar`, `DataTable`.
- **Sales quote**, **Sales order**, **Delivery note**, **Sales invoice** — F3 Document: `DocumentPage` each, the next document in one click with `SplitAction`, the chain growing in `RelatedDocuments`.
- **Offsets and assignments** — F1 List: `ListPage` with `DataTable`, "New …" as `SplitAction`.
- **Compensation**, **Cession**, **Assignment** — F3 Document: `DocumentPage` with `counterparties` for the third party, both sides' items in `DataTable`, `DocumentReferences`, each party's signature in `SignerList`.
- **Price lists** — F1 List: `ListPage`, `DataTable` (retail, wholesale, scheduled, ended in words).
- **Price list** — F2 Record: `DetailPage` with `ActionGroup`, prices in `DataTable`; validity and prices are the application's.
- **Promotions** — F1 List: `ListPage`, `DataTable` with validity as `DateRangeText`.
- **Discount rules** — F1 List: `ListPage`, `DataTable` in the application's order.
- **CRM, pipeline** — F1 List as a board: `KanbanBoard` (stages as columns, "Move to"), `ReasonConfirmDialog` for Lost, `ConfirmDialog` for Won.
- **CRM, deal** — F2 Record: `DetailPage`, `KeyValueList`, `RelatedDocuments` (the quote), `HistoryList`, `DueDate` on next steps.
- **CRM, contact** — F2 Record: `DetailPage`, the timeline as `HistoryList`, `RelatedDocuments`, a new activity in a `Drawer` (`DateField`, `RadioGroupField`, `TextAreaField`).
- **CRM, activities** — F1 List: `ListPage`, `FilterBar`, `DueDate`, `PersonName`.
- **CRM, activity calendar** — F7 Calendar: `CalendarView` with the application's activities as events.

## Inventory and production

- **Item card** — F2 Record: `DetailPage`, balance per warehouse in `KeyValueList`, movements in `DataTable` with running balance and value, `ChangeText` for signed quantities, each document a link.
- **Transfer** — F3 Document: `DocumentPage`, the line editor (`EditableGrid`) with available per line, `ChangeableValue` for the warehouses, `UnavailableAction` when the application's check fails; Draft / In transit / Received.
- **Stocktaking list** — F3 Document: `DocumentPage` with book / difference / counted in `DataTable`, the commission's `SignerList`, posting through `ConfirmDialog`.
- **Stocktaking count** — the handheld count (see "Handheld picking and counting") in blind mode: no expected quantities, no differences.
- **Bill of materials** — F2 Record: `DetailPage`, `TreeTable` for nested bills, `RelatedDocuments` to work orders.
- **Work order** — F3 Document: `DocumentPage`, planned / difference / used material in `DataTable`, `ChangeableValue`, `DocumentReferences`; good and scrap are the application's.
- **Production plan** — F7 Gantt: `Gantt` from `@veljaos/ui/gantt` with `KeyFigures`; the screen applies each change with `applyGanttChange`.
- **Retail price calculation** — F3 Document: `DocumentPage`, the line editor (`EditableGrid`) where only the retail price is entered, `ChangeableValue`, `UnavailableAction`; every other figure and VAT is the application's.
- **Price change** — F3 Document: `DocumentPage`, old → new with `ChangeText`, `DocumentReferences` to the calculation that caused it.
- **Warehouse floor plan** — F7 Floor plan: `FloorPlan` (bins with level and state, polygon yard), `KeyFigures`, a bin in a `Drawer` with `KeyValueList` and `ActionGroup` (Count, Pick here).

## HR and payroll

- **Site timesheet** — F7 grid on a page: `AttendanceGrid` (codes by key, hand-off, locked with corrections), `KeyFigures`, `PageHeader`; totals and locks are the application's.
- **Site clock records** — F1 List: `ClockRecordList` (on `DataTable`), "Correct" in a `Drawer` with a required reason.
- **Store shifts** — F7 grid: `ShiftPlanner` (templates, conflicts with "Go to", Publish with counts and `publishNotify`).
- **Store, my shifts** — F1 List on a phone: `MyShifts` with "Request swap"; the request itself is `ShiftSwapDialog`.
- **Store, swap requests** — F4 Worklist: `WorklistPage`, `ChangeConfirmDialog` to approve, `ReasonConfirmDialog` to decline, `EmptyState`.
- **Emergency shifts, rotation applied** — F7 grid: `ShiftPlanner` with "Apply rotation…" (`rotationPeople`, `rotationConflicts`) and an `Alert`.
- **Emergency working-time balance** — F5 Overview: `WorkingTimeBalance` (planned, worked, signed difference, warnings in words); computes nothing.
- **Employment contract questionnaire** — F6 Steps: `Questionnaire` with branching; "Generate contract" opens the contract on its signing page (see "Signing").
- **Work-injury register** — F1 List: `RegisterPage` (numbered, never deleted, corrections both ways) with `PeriodField`.
- **Safety course, lesson** — the reading page (see "Reading page") with the course outline in its side column (locked lessons and reasons, "5 of 8 lessons", Mark as done); the final test is `Questionnaire` with `QuizResult`; the certificate is liro-folio's PDF (see "Printed documents").
- **Recruitment, job openings** — F1 List: `ListPage`, `FilterBar`, `DataTable`.
- **Recruitment, job posting** — F2 Record: `DetailPage` in view / edit mode, `FormGrid` with `TextField`, `TextAreaField`, `MoneyField`, `DateField`.
- **Recruitment, candidates** — F1 List as a board: `KanbanBoard`; Rejected asks why (`ReasonConfirmDialog`); Hired waits for the application's accepted offer.
- **Recruitment, candidate**, also **Recruitment, interview scheduling** — F2 Record: `DetailPage` with CV in `AttachmentList`, scorecards side by side in `DataTable`, `HistoryList`; scheduling a `Dialog` with `SlotPicker` over the application's free slots.
- **Recruitment, scorecard** — F2 Record: `RecordFormPage`, `FormSection` with `RadioGroupField` per criterion and `TextAreaField`.
- **Onboarding, checklist** — F2 Record: `DetailPage`, one section per kind of task, each a `DataTable` with owner (`PersonName`), `DueDate` and state; not `SetupChecklist`, as tasks run side by side.
- **Onboarding, the new employee's portal** — F6 Steps in `PortalShell`: `SetupChecklist` ("Before you start"), the salary account in a `Dialog` checked by the application.
- **Onboarding, documents to sign** and **Onboarding, the employment contract** — F2 Record in `PortalShell`: a list of documents in `SectionCard`, each on its signing page (see "Signing") with the document's PDF from liro-folio and `SignerList`.
- **Employee portal, payslips** — F1 List in `PortalShell`: `DataTable` of months.
- **Employee portal, payslip** — F2 Record in `PortalShell`: `KeyFigures` and `KeyValueList` by section; every figure is payroll's.
- **Employee portal, payslip PDF** — liro-folio's PDF under a bar with the way back (`FilePreview`); the Shell example stands it in with a page-shaped card and "Download PDF".
- **Employee portal, leave** — F1 List in `PortalShell`: balance as `KeyFigures`, requests with their state, `Alert` for the application's notes.
- **Employee portal, leave request** — F2 Record in `PortalShell`: `KeyValueList` and the approval as `StatusTimeline`; the proof sent with it as `AttachmentList` (what the approvers open).
- **Employee portal, new leave request** — F2 Record in `PortalShell`: `SelectField` Kind, then for paid leave a `SelectField` Reason (each reason with its days and its proof, the application's data), `DateRangeField` typed or picked, the proof as `FileDropzone` with `expected` (the documents from the data, "Required" or "Optional"; `camera` on phones) and `AttachmentList`, `TextAreaField`; the days counted are the application's, a required document missing is said under the dropzone.
- **Employee portal, common questions** — in `PortalShell`: `CommonQuestions` — its top four on the home page beside "All questions"; a question's action starts its request filled in (the change of address with its proof). Every question has its own page (see "Questions and answers (any portal)", P5.96).
- **HR, leave requests to approve** — F4 Worklist: `WorklistPage`, each request with its `StatusTimeline`, its proof in `AttachmentList` (a photo or PDF opens in `FilePreview`), Approve / Reject (`ReasonConfirmDialog`).
- **Employee portal, shifts** — `MyShifts` in `PortalShell`.
- **Employee portal, documents** and **Employee portal, document to sign** — F1 List then F2 Record in `PortalShell`: documents in `SectionCard`, one on its signing page (see "Signing").
- **Employee portal, my details** — F2 Record in `PortalShell`: `KeyValueList`, a change request in a `Drawer` with the proof the field needs (`FileDropzone` with `expected`, `AttachmentList`), waiting for HR shown in its list.

## Health

- **Health, clinic schedule** — F7 Calendar: `ResourceSchedule` (doctors × the day, `now`), a move confirmed with `ChangeConfirmDialog`.
- **Health, finding** — F2 Record: `DetailPage` with `KeyValueList`, the diagnosis in `MaskedValue` shown only for a reason.
- **Health, patient chart** — F2 Record: `DetailPage` with `SidePanels`, visits and medicines in `DataTable`, a visit in a `Drawer`, findings masked with `MaskedValue`; the allergy is never masked.
- **Health, lab results** — F2 Record: `DetailPage`, one test over time as a `LineChart` with the laboratory's limits as data, every result in `DataTable`, `SelectField` for the test.
- **Hospital ward** — F7 Floor plan: `FloorPlan` over the building's drawing (`background`, polygon rooms), a bed in a `Drawer` with `MaskedValue`; Transfer with `CandidateList` of free beds and `ChangeConfirmDialog`, Admit in a `Dialog`.

## School and university

- **School, timetable** — F7 Calendar: `Timetable` (periods × weekdays, the running period's time of "now").
- **School, attendance of a lesson** — F7 grid: `AttendanceGrid` in lesson mode, one key per pupil.
- **School, gradebook** — F7 grid: `AttendanceGrid` with the application's grade codes; averages are the application's.
- **School, parents' portal, absences** — F1 List in `PortalShell`: `KeyFigures`, absences in `DataTable`, an excuse in a `Drawer` with `RadioGroupField`, `FileDropzone` and `AttachmentList`.
- **University, student portal** — F5 Overview in `PortalShell`: `KeyFigures` (average, ECTS, exams passed), exams in `DataTable`.
- **University, exam registration** — F6 Steps in `PortalShell`: `CandidateList` of open exams with conditions and fees, the total to pay, one `ConfirmDialog`; exams not open shown with `UnavailableAction` and the reason.
- **University, grades** — F1 List in `PortalShell`: `DataTable` with `KeyFigures`.
- **University, exam periods** — F1 List: `DataTable` with `DateRangeText` and state.
- **University, exam records** — F1 List: `DataTable` of records.
- **University, exam record** — F3 Document: `DocumentPage`, points and grades in the line editor (`EditableGrid`), the examiner's `SignerList`, locked after signing; totals, checks and the scale are the application's.

## Hospitality (restaurant, café, hotel, events)

- **Hotel, room rack** — F7 Floor plan: `RoomRack` (tiles by floor, occupancy and housekeeping), `KeyFigures`, a room in a `Drawer` with `ActionGroup` (Check in, Check out, Mark clean).
- **Hotel, bookings** — F7 Calendar: `ResourceSchedule` with `scale="days"`, a booking in a `Drawer`, a stay move confirmed with `ChangeConfirmDialog`.
- **Hotel, housekeeping** — F7 Floor plan on a phone: `RoomRack` (list by floor) with a room's `Drawer`.
- **Restaurant floor plan, editing** — F7 Floor plan: `FloorPlan` in edit mode (palette, move, size, rotate; reported with `applyFloorChanges`), overlaps from the application's `warnings`.
- **Café terrace** — F7 Floor plan: `FloorPlan` of the terrace opening the till; tables' states are the application's.
- **Event seating, gala dinner** — F7 Floor plan: `SeatingChart` (seats round tables, the guest list beside), the pending seating saved through `ChangeConfirmDialog` with `seatingChanges`.
- **Café tab, new items to send** — F7 POS: `PosShell` with `ProductGrid` and `CartPanel` (lines' `state`, "Send order"), `LineQuantityPicker` to split or move, `PaymentDialog`, `ReceiptResult`.

## Point of sale and warehouse handhelds

- **POS fiscal, receipt kind** — F7 POS: `PosShell` with `ReceiptKindPicker` in a `Dialog`; the chosen kind's marker (`kindMarker`) in a warning `Alert`; kinds are the application's.
- **POS journal**, also **POS daily report** — F7 POS: `PosShell` with the issued receipts in `DataTable`, a copy issued from `ReceiptResult` (Copy; its printed form liro-folio's), cancel with `ReasonConfirmDialog`, not sent shown with `Banner`; the report's figures are the application's.
- **Web shop order, receipt delivered** — F2 Record: `PageHeader`, `KeyValueList`, `ReceiptResult` with delivery by e-mail; the receipt's PDF from liro-folio in `FilePreview`.
- **Warehouse picking, handheld** — see "Handheld picking and counting": scan location → item → quantity, skip with a reason, its menu as `DropdownMenu`.
- **Stock count, handheld** — see "Handheld picking and counting": `QuantityStepper` and the application's signed differences.

## Field service, fleet and maintenance

- **Field work orders** — F1 List: `ListPage`, `FilterBar`, assign in a `Dialog` (`SelectField`, `DateField`).
- **Field work order** — F2 Record on a phone: `DetailPage`, checklist with `CheckboxField`, photos with `FileDropzone` `camera` and `AttachmentList`, parts with `ComboboxField` and `QuantityStepper`, the signer's `SignerList`, `OfflineIndicator` and `ConnectionState` for unsent work.
- **Maintenance plan** — F1 List: `ListPage` by machine and interval, overdue by hours or days in words, "Create work order" in a `Dialog`.
- **Vehicles** — F1 List: `ListPage`, `FilterBar`, next service in words.
- **Vehicle** — F2 Record: `DetailPage`, registration and insurance in `KeyValueList`, services and fuel in `DataTable`, a fuel entry in a `Dialog` (`NumberField`, `MoneyField`); consumption is the application's.
- **Vehicle reminders** — F1 List: `ListPage`, `FilterBar`, "Mark as done" in a `Dialog`.

## Property

- **Property units** — F7 Floor plan: `RoomRack` (units by building and floor, let / vacant / under repair), `KeyFigures`, a unit in a `Drawer`.
- **Property unit list** — F1 List: `ListPage`, `FilterBar`, a unit in a `Drawer` with `KeyValueList`.
- **Property tenants** and **Property leases** — F1 List: `ListPage`, `FilterBar`, `DataTable`.
- **Property tenant** — F2 Record: `DetailPage`, `KeyValueList`, the national ID in `MaskedValue`, leases in `DataTable`.
- **Property lease** — F2 Record: `DetailPage`, renewal and expiry in words (`Alert`), "Renew…" in a `Dialog`, documents in `AttachmentList`.
- **Lease agreement** — F2 Record: the signed lease in `DocumentFrame`.
- **Rent invoices** — F6 Steps: `PeriodicRunPage` (checks, preview), one invoice as liro-folio's PDF in `FilePreview`.
- **Maintenance requests** — F1 List: `ListPage`, `FilterBar`, a request in a `Drawer` with `StatusTimeline` and `AttachmentList`.
- **Tenant portal** — F5 Overview in `PortalShell`: `CategoryGrid` of actions, `KeyValueList`, `Alert`.
- **Tenant portal, report a problem** — F2 Record in `PortalShell`: `RadioGroupField`, `SelectField`, `TextAreaField`, photos with `FileDropzone` and `AttachmentList`.
- **Tenant portal, my requests**, **request**, **invoices** — F1 List / F2 Record in `PortalShell`: `DataTable` with `DueDate`; a request with `StatusTimeline`, `AttachmentList` and a reply field.
- **Office desks** — F7 Floor plan: `FloorPlan` over the drawing, the day from the provider's `today` in `SelectField`, a desk's booking in `SectionCard`, `EmptyState`.

## Projects

- **Tasks** — F1 List as a board: `KanbanBoard` (pointer, keyboard handle, "Move to"); reports moves only.

## Documents, records and governance

- **Contract awaiting signatures** and **Contract signing, the employee signs** — see "Signing" (preview in `DocumentFrame`, `AttachmentList`, `SignerList` with Decline and Sign); the signing is the Core's.
- **Invoice PDF** — liro-folio's PDF under a bar with `BackButton` (`FilePreview` or `DocumentFrame`); the F3 example "Invoice" opens it from "PDF".
- **Certificate**, **school report**, **medical finding** — liro-folio's PDFs (see "Printed documents"); the screens around them show the PDF.
- **Document inbox** — F1 List: `ListPage`, `FilterBar`, `FileDropzone` (Add documents), a document's page in `QuickPreview` with `PageViewer`, bulk Reject with `ReasonConfirmDialog`.
- **Document review** — F4 Worklist (see "Going through many lines"): `WorklistPage` beside `PageViewer` (`highlight`), fields wrapped in `RecognizedField`, supplier by `LookupField`, lines in `EditableGrid`, `DuplicateWarning`, `CandidateList` for a new supplier; confidence and matches are the application's.
- **Company documents** and **Company document preview** — F1 List: the files page (see "Files") with `FileDetails`, `FolderPickerDialog`, `NameConflictDialog`, `FileNameDialog`, `ShareDialog`, `VersionList`; preview in `FilePreview` with `DocumentFrame` or `PageViewer`.
- **New document** — F1 List of types: `CategoryGrid` in a `SectionCard`.
- **Document draft** — F2 Record: `RecordFormPage` with `DefinedForm` from the application's JSON definition, the application's preview in `DocumentFrame`, the number from the registry book.
- **Document signing** — see "Signing".
- **Registry book** — F1 List: `RegisterPage` (overdue and corrected entries in words), year in `SelectField`.
- **Registry entry** — F2 Record: `DetailPage`, `KeyValueList`, `DueDate`, `AttachmentList`, `RelatedDocuments`, `ActivityList`.
- **New registry entry** — F2 Record: `RecordFormPage`, `FormSection`, `RadioGroupField`, `DateField`, `FileDropzone` and `AttachmentList`; the number is the application's.
- **Archive book** — F1 List: `RegisterPage`.
- **Retention periods** and **What expires** — F1 List: `ListPage` with `DataTable`.
- **Disposal list** — F3 Document: `DocumentPage`, items in `DataTable`, the commission's `SignerList`, `IrreversibleConfirmDialog`, `RelatedDocuments` to its minutes.
- **Meetings** — F1 List: `ListPage` with `DataTable`.
- **Meeting** — F2 Record: `DetailPage` with quorum in `KeyValueList`, agenda items and votes in `DataTable`, a vote in a `Dialog` (`RadioGroupField`), minutes to sign in `SignerList`; results are the application's.
- **Next meeting** — F2 Record: `DetailPage` with the invitation, agenda in `DataTable`, `ActionGroup`.
- **Contracts** — F1 List: `ListPage` with `DataTable`.
- **Contract** — F2 Record: `DetailPage`, notice due as an `Alert`, `VersionList`, `RelatedDocuments`.
- **Legal search** — see "Legal search" under "Pages composed from the core templates".
- **New in the Illustrative Gazette** — F1 List: `GazetteIssues`.
- **Illustrative law, act page**, **work rulebook**, **by-law**, **court decision** — see "Legal act" under "Pages composed from the core templates"; texts and versions are the application's.
- **Illustrative law, compare versions** — F2 Record: `LegalCompare` with two versions chosen in `SelectField`.
- **Illustrative law, printed** — liro-folio's PDF (see "Printed documents"); on the screen the act is `LegalText`.

## AML compliance

- **AML clients** — F1 List: `ListPage`, `FilterBar`, risk, review and file state, `DueDate`.
- **Client file** — F2 Record: `DetailPage` with `SidePanels`, owners as `HierarchyChart` (shares on the line), national ID in `MaskedValue`, `AttachmentList`, `HistoryList`.
- **Client risk assessment** — F2 Record: `DetailPage`, factors in `DataTable`, an override with `ReasonConfirmDialog`, `HistoryList`; the risk is the application's.
- **Risk review** — F6 Steps: `Questionnaire` in a `SectionCard`.
- **Screening matches** — F4 Worklist (see "Going through many lines"): `WorklistPage`, `ValueComparison` of client and list entry, `ReasonConfirmDialog` for false positive or true match, `BulkActionBar`, `KeyFigures`.
- **Client screening** — F2 Record: `DetailPage`, re-screening history in `HistoryList` and `DataTable`.
- **Alert queue** — F4 Worklist (see "Going through many lines"): `WorklistPage`, the rule's facts in `KeyValueList`, close with a reason (`ReasonConfirmDialog`) or escalate in a `Dialog`, `BulkActionBar`.
- **Cases** — F1 List: `ListPage` with `DataTable`.
- **Case** — F3 Document: `DocumentPage` with `StatusTimeline`, `RelatedDocuments`, `ActivityList`, `HistoryList`, the four-eyes approval in `SignerList`.
- **Reports** — F1 List: `ListPage` with `DataTable`.
- **Suspicious transaction report** — F2 Record: `DefinedForm` from the authority's JSON form, `StatusTimeline`, `AttachmentList`, `ConfirmDialog` to send.
- **AML overview** — F5 Overview: `DashboardPage` with `BarChart`, `DonutChart`, `KeyValueList` (officer and deputy), the year's obligations as `SetupChecklist`.
- **AML obligations** — F2 Record: `DetailPage` with training and procedures in `DataTable`, `AttachmentList`, `HistoryList` as the audit trail.

## Administration, security and helpdesk

- **Users and roles** — F1 List with a record: users in `DataTable` with `PersonAvatar`, `Tabs` for users / roles, a role's `PermissionMatrix`, a user in a `Drawer`.
- **First-run setup** — F6 Steps: `SetupChecklist` ("2 of 5 done", blocked with a reason).
- **Admin overview** — F5 Overview: `DashboardPage` with `HealthList`, `UsageMeter`, `BarChart`.
- **Admin sign-in activity** — F1 List: `ListPage`, `FilterBar`, addresses in `MaskedValue`.
- **Admin audit log** — F1 List: `ListPage`, `FilterBar`, an entry in a `Drawer` with `KeyValueList`.
- **Admin security** — F2 Record: `SectionCard`s with policies (`SelectField`), API keys in `DataTable` revoked with `ConfirmDialog`, `SessionList`.
- **Admin integrations health** — F5 Overview: `HealthList` (state in the application's words, last success and error, Retry).
- **Superadmin system status** — F5 Overview: `DashboardPage`, `HealthList`, `LineChart`.
- **Superadmin network and infrastructure** — F5 Overview: `HealthList`, `LineChart`, `FilterBar`, `DataTable`.
- **Superadmin incidents** — F1 List: `ListPage`, `FilterBar`, `DataTable`.
- **Superadmin incident** — F3 Document: `DocumentPage` with `StatusTimeline`, updates as `RichText`, post update in a `Dialog` (`RadioGroupField`, `TextAreaField`, `CheckboxField`), resolve with `ConfirmDialog`.
- **Superadmin security events** — F4 Worklist: `WorklistPage`, `ActivityList`, closed with the action taken (`ReasonConfirmDialog`), `BulkActionBar`.
- **Superadmin tenants** — F1 List: `ListPage`, `FilterBar`, suspend with `ReasonConfirmDialog`.
- **Superadmin view as tenant admin** — F2 Record read-only: `ImpersonationBar` with `note` (audited), the tenant's `DetailPage`.
- **Superadmin announcements** — F1 List: `ListPage`, `FilterBar`, `DataTable`.
- **Superadmin announcement editor** — F2 Record: `RecordFormPage`, `FormSection`, `MultiSelectField` for audiences, `DateField`, the `Banner` as its preview.
- **Helpdesk inbox** — F1 List: `ListPage` (My open, Unassigned, Overdue, All), `FilterBar`, `SlaTimer` per row, bulk assign in a `Dialog`.
- **Helpdesk ticket** — F2 Record: `DetailPage`, `MessageList` with internal notes, `ReplyComposer` (saved replies, files, "Insert article" via `LookupDialog`), `SlaTimer`, `SidePanels`, `RelatedDocuments`.
- **Helpdesk overview** — F5 Overview: `DashboardPage` with `LineChart`, `BarChart`, `DonutChart`, `DataTable`.
- **Support portal** — F5 Overview in `PortalShell`: search, `CategoryGrid`, recent tickets in `SectionCard`.
- **Support portal, new ticket** — F2 Record in `PortalShell`: `TextField`, `SelectField`, `TextAreaField`, `FileDropzone`, `LinkSuggestions` of articles the application proposes.
- **Support portal, my tickets** — F1 List in `PortalShell`: `DataTable`.
- **Support portal, ticket**, also **rating** — F2 Record in `PortalShell`: `MessageThread`, `AttachmentList`, and when closed `SatisfactionRating`.
- **Knowledge base**, also **Knowledge base for agents** — F1 List: `CategoryGrid` and a search `TextField` (in `PortalShell`, or as the agents' tab).
- **Knowledge base, category** — F1 List: articles in `SectionCard`.
- **Knowledge base, article** — F2 Record: `RichText` with `headingIds`, `PageContents`, `HelpfulFeedback`.
- **Knowledge base, search** — F1 List: `SearchResultList` (matches marked), `EmptyState`.
- **Sign-in password**, **Session expired** — `AuthShell` with `PersonAvatar` and `PasswordField`; the expired session returns to the page it left.
- **Two-factor code** — `AuthShell` with `CodeInput` (or a recovery code in `TextField`), "Remember this device" `CheckboxField`.
- **Forgot password** — `AuthShell` with `EmailFirstForm`, then "Check your e-mail" as an `Alert`.
- **New password** — `AuthShell`, `PasswordField` with the application's rules, mismatch and expired link as `Alert`.
- **Accept invitation** — `AuthShell`, the invitation in `KeyValueList`, `PasswordField` or `ProviderSignInButtons`.
- **Account locked** — `AuthShell` with an `Alert` in the application's words.
- **My profile, sign-in and security**, also **My profile, devices** — F2 Record: `SettingsPage`, two-factor turned on in a `Dialog` (`QrCode`, `CodeInput`, `RecoveryCodes`), `PasswordField`, passkeys removed with `DeleteConfirmDialog`, `SessionList`.

## Accountant's workspace

- **Accountant clients**, also **Accountant ask the client** — F1 List: `ListPage`, `FilterBar`, `DataTable` in the application's order of urgency with `DueDate`; "Ask the client" in a `Drawer` (`RadioGroupField`, `TextAreaField`, `DateField`, `CheckboxField`).
- **Accountant client switcher** — `AppShell`'s company switcher (`ShellCompanies`: pinned, recent, all, search by name or tax number, virtualised).
- **Accountant deadlines** — F7 Calendar: `CalendarView` across clients, `SelectField` and `SwitchField` as filters.
- **Accountant month close** — F6 Steps: `SetupChecklist` for one client's month, a step in a `Drawer`, `DueDate`.
- **Client portal requests** — F1 List in `PortalShell`: `DataTable` with `DueDate`.
- **Client portal request** — F2 Record in `PortalShell`: `StatusTimeline`, answer with `TextAreaField`, `FileDropzone` and `AttachmentList`.
- **Client portal documents** — F1 List in `PortalShell`: `AttachmentList`.
- **Client folders** and **Client portal files** — F1 List: the files page (see "Files") in `AppShell` for the firm and in `PortalShell` for the client, over the same files.
- **IOS partners** (statements of open items) — F1 List: `ListPage`, `FilterBar`, prepare in a `Dialog` (`DateField`, `RadioGroupField`), preview as liro-folio's PDF in `FilePreview`, send with `ConfirmDialog`.
- **IOS reconciliation** — F4 Worklist (see "Going through many lines"): `WorklistPage`, `ValueComparison`, `CandidateList`, `EditableGrid`, `BalanceBar`, `KeyFigures`; the matches and differences are the application's.
- **IOS partner portal** — F2 Record in `PortalShell`: the statement with `DocumentTotals`, confirm with `ConfirmDialog` or dispute in a `Drawer` (`MoneyField`, `TextAreaField`, `FileDropzone`).

## Analytics, automation and AI

- **Scheduled reports** — F1 List: `ListPage` with `DataTable`, a `SwitchField` per row to pause or resume, views by state.
- **Scheduled report** — F2 Record: `DetailPage`, the last runs in `DataTable`, `EmailPreview`, Send now with `ConfirmDialog`, a failed run as an `Alert` with neutral actions.
- **New scheduled report** — F2 Record: `RecordFormPage`, `FormSection`, `RadioGroupField`, `MultiSelectField` for recipients checked by the application, `EmailPreview`.
- **Director's overview** — F5 Overview: `DashboardPage` with `DashboardGrid` (editing mode: drag, keys or menus, the application's sizes), layouts in `SelectField` and `DropdownMenu`, "Add card" via `LookupDialog`, `FileNameDialog`, `DeleteConfirmDialog`.
- **Sales analysis** — F5 Overview: `Pivot` from `@veljaos/ui/pivot`, saved views in `SelectField`, a figure's records in a `Drawer` with `DataTable`.
- **Automation rules** — F1 List: `ListPage`, `DataTable`, `SwitchField` per rule, the last run's state in words.
- **Automation rule**, also **Edit automation rule** — F2 Record: `DetailPage` with `RuleBuilder` (`summary`, problems), the test run in `DataTable`, a failed run as `Alert`.
- **New automation rule** — F2 Record: `RecordFormPage` with `RuleBuilder` and `emptyRuleDraft`.
- **Automation run log** — F1 List: `ListPage` with `DataTable`.
- **Incoming invoice approval, workflow** — F7 Diagram: `Diagram` from `@veljaos/ui/diagram` in run mode (state as icon, words and tone), editing with `applyDiagramOperations` and the application's problems.
- **Nightly bank-statement import, failed run** — F7 Diagram: `Diagram` run stopped at a failed step with Retry.
- **Possible duplicates** — F1 List: `ListPage` of pairs with the application's reason and state.
- **Merge partners**, **Merge items** — F2 Record: `DetailPage`, `CandidateList` (which record stays), `ValueComparison` with `chosen` / `onChoose`, `IrreversibleConfirmDialog`.
- **Partners merged**, **Items merged** — F2 Record: `DetailPage` of the kept record, the merge in an `Alert`, moved documents in `RelatedDocuments`.
- **Liro Assistant** (overdue, revenue, proposed action, no access) — the page's floorplan with `AssistantPanel` from `AppShell`'s `agent` slot: `AssistantAnswer` (table, `BarChart`, sources, "no access" in the application's words), `ProposedAction` waiting for Confirm.
- **Ask Liro**, also **Ask Liro, answer** — the reading page (see "Reading page"): a large `AssistantComposer` with suggested and recent questions, then the question as the h1, `AssistantAnswer` and `ProposedAction`, a follow-up `AssistantComposer`; nothing calls a model in the library.
- **Property tax zones** — F7 Map: `AreaMap` from `@veljaos/ui/map`, properties in `RadioGroupField`, "Falls in" from `areaAt`.
- **Site check-in** — F7 Map in `PortalShell`: `LocationCheck` (the workplace's area, the position, the application's verdict); never `navigator.geolocation`.
- **Group revenue by country**, **Sales by region** — F5 Overview: `RegionChart` (choropleth steps from the application's `breaks`, no data hatched), `KeyValueList`.
- **Organisation chart**, **Company group** — F5 Overview: `HierarchyChart` (people / units `Tabs`, ownership shares on the lines), a node's card in a `Drawer`, `KeyFigures`.
- **Blog** — F1 List in `PortalShell`: `ArticleList` with `featured`, `NewsletterSignup`.
- **Blog article** — the reading page (see "Reading page") with `RichText`, `PageContents`, `ShareLinks`, `NewsletterSignup`, related `ArticleList`.
- **Blog posts** — F1 List: `ListPage` with `DataTable`.
- **Blog post editor** — F2 Record: `RecordFormPage`, `RichTextField`, cover with `FileDropzone`, `MultiSelectField` for tags, schedule with `DateField`.
- **E-mail templates** — F1 List: `ListPage` with `DataTable`.
- **E-mail template** — F2 Record: `RichTextField` with merge fields, `Tabs` per language, `EmailPreview`, versions in a `Drawer`, send test in a `Dialog`.
- **Subscription** — F2 Record: plan and payment method in `KeyValueList`, `UsageMeter`, next invoice in `DocumentTotals`, cancel with `IrreversibleConfirmDialog`, trial / past-due / cancelled as `Banner`.
- **Subscription invoices** — F1 List: `ListPage`, `DataTable`.
- **Subscription invoice PDF** — liro-folio's PDF in `FilePreview`.
- **Subscription change plan** — F6 Steps: `PlanComparison`, the proration in `DocumentTotals`, `ConfirmDialog`; prices are the application's.
