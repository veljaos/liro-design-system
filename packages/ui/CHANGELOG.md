# @veljaos/ui

## 1.0.0

### Major Changes

- e976399: 1.0.0, the first stable release of the Liro Design System.

  - **What it is:** the tokens, components and page templates of 0.1.0-alpha.5. The API is unchanged since then; this release makes it stable. From now on a breaking change raises the major version, and releases are published under the `latest` dist-tag.
  - **Upgrading from an alpha:** follow the release notes of 0.1.0-alpha.5 below (removed templates and print parts, read only instead of `disabled`, `unavailableReason`, renamed props), then the earlier alpha entries if you come from further back.
  - **What changed since 0.1.0-alpha.5** (no change to the published code's behaviour):
    - every component with text keeps an Arabic and a Japanese story, checked in CI, and Serbian Latin and Cyrillic were checked across the catalogue;
    - a performance budget: the list and document example screens stay under 250 KB of JavaScript and 160 KB of CSS (gzip);
    - comments in the code say what it does, without history;
    - the documentation is short rule documents by subject in `docs/`, a README and a slim AGENTS.md.

### Patch Changes

- Updated dependencies [e976399]
  - @veljaos/tokens@1.0.0

## 0.1.0-alpha.5

### Release notes: breaking changes of P5.92–P5.96b and how to migrate

The detailed entries follow under "Minor Changes" and "Patch Changes". In short:

- **Removed page templates** (P5.92). Compose the page from the core templates instead:
  - `LegalActPage` → `DocumentPage` with `LegalText`, `LegalContents` and `useLegalPanels`.
  - `LegalSearchPage` → `ListPage` with `FilterBar` and `SearchResultList` (`snippetFromRanges` stays).
  - `CoursePage`, `ArticlePage`, `AskPage` → a reading page on `DetailPage`.
  - `PickList`, `StockCount` → `WorklistPage` or `ListPage` inside `<LiroProvider density="touch">`.
  - `PaymentOrderForm` → `RecordFormPage`.
  - `SigningPage` → `DetailPage` or `DocumentPage` with `SignerList`.
  - `FileBrowser` → `ListPage` with `FileGrid`, `FileDetails` and the file dialogs.
  - Their message keys (`article.*`, `course.*`, `legalPage.*`, `legalSearch.*`, `pick.*`, `count.*`, `signing.*`) are gone.
- **Printed documents moved to liro-folio** (P5.95). Removed: `PrintPage`, `PrintDocument`, every print part (`PrintTitle`, `PrintDetails`, `PrintTable`, `PrintSection`, `PrintSignatures`, `PrintSignatureField`, `PrintAmountDueLine`, `PrintPaymentDetails`, `PrintIssuedLine`), the printouts `PrintCertificate`, `PrintGradeReport`, `PrintFinding`, `PrintLegalAct`, and `print-logic`. Render the document with liro-folio and show its PDF with `FilePreview` or `DocumentFrame`, or its page images with `PageViewer`. Signature areas come from liro-folio: page (from 1) and `x y width height` in PDF points, origin at the page's bottom-left.
- **`ReceiptPreview` removed** (with `ReceiptItem`, `ReceiptAmount`, `ReceiptRecap`, `ReceiptRecapColumn`). Show the issued receipt with `ReceiptResult`; `ReceiptFact` is now exported with it.
- **`DocumentTotals` lost `ruled`.** Remove the prop.
- **Fields have one non-editable state, read only** (P5.93). `disabled` and `disabledReason` are removed from every field and from `CodeInput`, `BuyerField`, `PlanComparison`, `NumericKeypad`, `ScanField`, `DefinedField` and `RuleBuilder`: use `readOnly`. Say the reason once where the page needs it.
- **Actions with a reason** (P5.93). `AssistantComposer`, `MessageComposer`, `ReplyComposer`, `EmailFirstForm`, `NewsletterSignup`, `SatisfactionRating`, `FileDropzone`: `disabled` + `disabledReason` → `unavailableReason`.
- **Renamed props and types** (P5.93):
  - maps: `tiles` → `baseLayer`, `MapTiles` → `MapBaseLayer`;
  - `ReceiptFinder`: `onSearch(text)` with one field, `defaultQuery` → `defaultSearch`, `ReceiptQuery` removed;
  - `RuleDraft` is `{ trigger, branches, otherwise }` (a single rule is `branches: [{ id, join, conditions, actions }]`, `otherwise: null`);
  - `AnswerSourcesBlock.title` is a string;
  - `Diagram` `hideAttribution` removed (the credit link is never shown).
- **Changed behaviour** (P5.93–P5.94):
  - `NameConflictDialog` answers with one press (`defaultChoice` removed);
  - `ShareDialog` creates the link through "General access";
  - `PaymentDialog` puts other ways under "Other…", takes parts by any way, and `onCardStart(amount)` receives the part's amount;
  - `VersionList` restores at once;
  - `Pivot` opens its chooser as a sheet (`defaultFieldsOpen` false);
  - charts take a series toggle in `toggle`, not `controls`;
  - `ProductStock.text` is the detail ("3 left");
  - `AreaMap` areas are the main blue by default (`tone: 'neutral'` for grey).
- **Maps** (P5.96–P5.96b). No area name is written on the map; the area under the pointer or the keys shows its outline over its neighbours and a tooltip.
- **Focus rings** (P5.96b). Every ring now draws. If your code pairs `outline-none` with a ring, add `outline-solid`.
- **Messages.** An application with its own complete `messages` adds the new keys and drops the removed ones; the detailed entries below list them.

### Minor Changes

- 786cdbb: P5.23, the owner's review of Phase 5 part 1.

  - New: `CandidateList` (`Candidate`, `chooseCandidate`), `DocumentSource` (`DocumentSourceItem`), DocumentPage `source`, `worklistPosition`, `compactStep`, `hasMessage`, `DESCRIPTION_MIN_WIDTH`, `DataTableHandle` (`ref.revealRow(id)`).
  - WorklistPage: a decision bar (position, Previous, Next, `detailActions`) and `back`, `status`, `subtitle`, `summary`, `onPrevious`.
  - Dialog and ConfirmDialog `size: 'wide'`; ConfirmDialog `preview`. Banner `role`.
  - `ChangeableValue.field` optional (a read-only header value). Tabs put one 16px gap above their panel. An Alert with only a title is compact; Banner uses the same one-line padding.
  - BulkActionBar is a row of its own with standard buttons. Stepper, FormWizard and ImportWizard phone layouts (compact stepper, one sticky footer row, Cancel as a header close button with a leave confirmation). LookupDialog `sort` / `onSortChange`; `UnavailableAction.reasonId`.
  - RegisterPage: correction links both ways, `onGoToEntry`, its own card spacing; DataTable `minWidth` holds without resizing, `loaderSlot`.
  - CancellationBanner is danger by default and says "Cancelled" once.
  - Breaking (alpha): `MatchingView` and its logic exports and `matching.*` messages removed; `UnavailableAction.small` removed.
  - Messages: new `worklist.previous`, `worklist.position`, `candidates.empty`, `stepper.step`, `import.cancel`, `import.leaveTitle`, `import.leaveMessage`, `document.sourceDate`, `document.sourceTotal`; `document.cancelledBy` now writes the part after the title.
  - Tokens: contrast checks for text and links on every tone background.
  - Initial states, so every look can be rendered directly (P5.23, visual stories are static): `defaultOpen` on DateField, DateRangeField, MonthField, PeriodField, DropdownMenu, SplitAction and Tooltip; `defaultQuery` on ComboboxField, MultiSelectField, LookupField and CommandPalette; FilterBar `defaultFiltersOpen`; Questionnaire `defaultStep`; AppShell `defaultOpenMenu`; the charts' `defaultView` ('chart' or 'table').
  - A steady view: when content shrinks at the end of WorklistPage's detail (both layouts), a Dialog's or Drawer's body or a confirmation's body, what is in view no longer moves.

- 9b025c5: Phase 5: floor plans, seating, room rack and diagrams; working-time follow-up.

  - ShiftPlanner: "Apply rotation…" opens with people chosen (`rotationPeople`, else everyone in view), shows what it will add per person and day, and the application's checks of it (`rotationConflicts`). MyShifts: `swapDefaults` (a colleague suggested).
  - FloorPlan (the plan of a place: items, areas, states as data, choosing, a list view, edit mode reporting adds, moves, resizes, turns and removes) and SeatingChart (seats round tables, the guest list, seating by keyboard, drag or "Seat at…").
  - RoomRack (rooms by floor with occupancy and housekeeping states, search and state chips, keyboard, compact density, phones) and its helpers; ResourceSchedule `scale="days"` for stays over days (`fitOnDays`).
  - `@veljaos/ui/diagram` (new subpath): `Diagram` — workflows and orchestrator runs in a BPMN-style notation on React Flow 12.12.0 and dagre 3.1.1, in view, edit (operations through `onChange`) and run modes; React Flow's credit link shown unless `hideAttribution`. New dependencies `@xyflow/react` 12.12.0 and `@dagrejs/dagre` 3.1.1 (MIT), loaded only through that subpath.
  - New messages `shifts.rotation*`, `floorPlan.*`, `seating.*`, `rack.*`, `diagram.*` (English defaults).
  - FloorPlan (P5.25a, no new dependency): `background` (the building's plan as an image in plan units under the items; decorative unless `alt`; `srcDark`, else inverted in the dark theme; `opacity`), polygon areas (`FloorArea` is now `FloorRectArea | FloorPolygonArea` with `points` and `labelAt`; code that reads `area.x` narrows it first with `isPolygonArea` or `areaBox`), `FloorItem.level` (a percentage as a decimal string: words and a bar), item kind `place`, and the helpers `isPolygonArea`, `areaBox`, `areaContains`, `areaLabelPoint`, `polygonBounds`, `polygonCentroid`, `pointInPolygon`, `svgPoints`, `percentPoint`, `levelWidth`, `levelText`; message `floorPlan.level`.

- 5c389ce: Legal information (P5.27), no new dependency:

  - The shared model of a legal act (`LegalAct`, `LegalNode`, `LegalArticle`, `LegalVersion`, `LegalAmendment`, `RelatedAct`, `PracticeItem`, `LegalNote` and the rest), exported as types.
  - `LegalText` (an act's text: headings, articles with copy link, selection and actions, change marks, deleted articles collapsed, references with a preview, search in the act, Latin / Cyrillic switch, windowing for long acts, `revealNode`), `LegalContents` (the table of contents in a start-side drawer), `LegalCompare` (two versions inline, word diff), and the helpers of `legal-logic.ts` (word diff, Serbian Cyrillic to Latin, search on the data, comparison, contents tree).
  - `LegalActPage` (a legal act in DocumentPage's layout: gazette, version picker, actions, side panels, a phone sheet), the act's side panels (`useLegalPanels`, `LegalArticleSummary`) and their helpers, and `PrintLegalAct` (an act on A4).
  - `LegalSearchPage` (full-text search across acts on ListPage: filters, the count and sort, results with a marked snippet and the article they matched in; `snippetFromRanges`), `GazetteIssues` (what is new in a gazette, issue by issue).
  - FilterBar: a `tree` filter kind (TreeView in the drawer; `treeFilterLabels`, `treeFilterIds`).
  - New messages `legal.*`, `legalPage.*`, `legalPanel.*`, `legalPrint.footnotes`, `legalSearch.*`, `gazette.*` (English defaults).

- 788bdc7: P5.28, the owner's review of Phase 5 part 2.

  - Phones: select lists, popovers, menus and tooltips keep 8px inside the screen and are never wider than the room there (long options wrap); on a phone a popover or menu always moves to stay on the screen. Every dialog (Dialog, ConfirmDialog and its presets, and dialogs built on them) is a full-width bottom sheet on a phone. PeriodField opens a bottom sheet on a phone (presets first, then one month across the sheet).
  - SelectField: from 11 options the list is searched by typing (`searchable` to choose either way; `SEARCHABLE_FROM`, `isSearchable` exported); `defaultOpen`. Select lists scroll natively with a thin scrollbar (the scroll buttons are gone). ComboboxField and MultiSelectField open their list on a press. ComboboxField, MultiSelectField and SelectField keep the active option in view as the keys move.
  - LookupDialog on a phone: one compact row per result (title, `mobile.subtitle`, `mobile.badge`); `mobile.details` default none there.
  - ActionGroup, FilterBar's pills and Breadcrumbs no longer make a narrow page scroll sideways (a long pill or current crumb is cut with an ellipsis).
  - `numericFormat(locale, timeZone?)`: another locale's digits without its words. Month and weekday names, long dates and the week's first day come only from the provider's `locale`.
  - CalendarView and ResourceSchedule take `now` (the application's clock) and draw the one "now" marker; Timetable draws the same marker in the running period instead of an outline and a "Now" chip.
  - Sticky table headers stay below the shell's sticky header while the page scrolls (AttendanceGrid, ShiftPlanner, ResourceSchedule, DataTable, EditableGrid, CalendarView, TreeTable — also without `maxHeight` —, StatutoryFormPage, also when its grid scrolls sideways); in a card, DataTable's and EditableGrid's first column stays at the start; EditableGrid's phone totals stick below the shell. DataTable's corner cells are measured so a cell reached by the keyboard clears the sticky first column. PortalShell publishes its header's height as `--liro-shell-top`.
  - **Breaking (alpha):** DataTable `stickyHeader` now defaults to true: every DataTable's header stays below the shell while the page scrolls (nothing moves at rest; `stickyHeader={false}` keeps a header still).
  - `subject` on Dialog, Drawer and every ConfirmDialog: the one record a dialog acts on, bold on its own line under the action, part of the dialog's name. `SignerList` `declineSubject`, `RunRerun.subject`. ShiftPlanner's move dialog, AttendanceGrid's correction and PickList's skip are titled by the action with the record bold under it; ResourceSchedule's "Move to…" shows the booking under its title; StatutoryFormPage's source drawer is titled "Source documents" with the row as its subject.
  - `Alert` `actions` (neutral secondary buttons under the message); DuplicateWarning's choices and StatutoryFormPage's "Go to" are neutral secondary buttons.
  - `ChangeConfirmDialog`: confirms a move or change of something other people rely on — the change old → new, who it concerns, the application's warning, "Notify …" checkboxes as the application sets them — with Cancel / Save; helpers `initialNotify`, `toggleNotify`, `changeConfirmLabel`.
  - `ConfirmDialog` `notify` and `notifyConfirmLabel`: the messages the application can send with the action as "Notify …" checkboxes; `onConfirm` receives `{ notify }`. `ShiftPlanner` `publishNotify`, `defaultPublishOpen`; `onPublish` receives `{ notify }`.
  - `MaskedValue` `sentenceLabel` and `subject`; the logging note is a neutral Alert ("Access is logged" bold). `FileDropzone` `camera`.
  - CoursePage: the outline's rows are square, full width and flush; no padding under the last one.
  - StatutoryFormPage is the form's real grid: parts with their own columns (a group over its sub-columns, or one column), nested numbered collapsible groups (`defaultCollapsed`), absent cells left blank, cells `entered` (`field`) / `computed` / `source` (`sources`, `sourceName`), "Compare with …" (`compare`, `defaultCompare`, `onCompareChange`) under each value, the form's `lang`; phones show one card per row. New helpers: `statutoryCellId`, `statutoryCellLabel`, `statutoryColumnLabel`, `statutoryHeaderRows`, `statutoryGridLines`, `statutoryRows`, `statutoryRowRules`, `findStatutoryPlace`, `isStatutoryGroup`.
  - **Breaking (alpha):** StatutoryFormPage: `StatutoryField` is removed; `StatutorySection` takes `columns` and `items` (rows and groups); rules, `editing`, `onSaveOverride` and `onUseComputed` take row or cell ids (`statutoryCellId`).
  - Printouts as simple as a Stripe invoice: title at the start, `logo` at the end; PrintDocument `details` as a key/value block, parties with short detail lines, `amountDue` ("X RSD due DD.MM.YYYY."), `payment` with an IPS QR slot (`code`), thin rules, ruled totals; "Page 1 of 1" at the end of the footer on screen; grey draft and cancelled markers without boxes. New parts: `PrintSignatureField`, `PrintAmountDueLine`, `PrintPaymentDetails`; `PrintDetails` `layout` "rows"; DocumentTotals `ruled`. Electronic signature fields with a stable `id`, their page and PDF rectangle reported by `onSignatureFields` (and written as `data-pdf-page` / `data-pdf-rect`), `onSign` for a "Sign here" button on screen; helpers `signatureFieldPlacement`, `printedPageCount`, `lengthToMm`, `PT_PER_MM`.
  - **Breaking (alpha):** printouts: `letterhead`, `emblem` and `seal` are removed (use `logo`); PrintDocument has no `signatures` or `issued`; `PrintSignature.key` is `id`; PrintSignatures has no `seal`.
  - ReceiptKindPicker, BuyerField, ReceiptFinder, LineQuantityPicker, AdvanceList and ReceiptResult: the till's fiscal sale flows as the application's data.
  - PaymentDialog: the application's own ways to pay (`PaymentOption`), several ways on one receipt (`onAddPart`, `onRemovePart`), an instant payment's code (`qrCode`), a way's reason and `extra`, `doneContent`. **Breaking (alpha):** `method`, `onMethodChange` and `onAddPart` take string ids.
  - CartPanel: `kindLabel`, `marker`, `details`, `totalLabel`; a line's `note`, `state` and `onEditLine`. ReceiptPreview: `banner`, `end`, `kindLine`, `marker`, `recap`, `issuedFacts`, `signature`. PosShell: `banners`, `queueState`, `queueAction`.
  - Messages: new `schedule.now` (`(timeText) => string`), `masked.loggedTitle`, `clock.correctSubject`, `change.*`, `file.takePhoto`, `attendance.correctAction`, `attendance.correctSubject`, `shifts.moveAction`, `shifts.moveSubject`, `shifts.publishAndNotify`, `shifts.publishChangesAndNotify`, `pick.skipAction`, `statutory.compareWith`, `statutory.comparing`, `statutory.previousValue`, `statutory.sources`, `print.amountDue`, `print.signHere`, `payment.qrStart`, `payment.qrWaiting`, `payment.qrHint`, `payment.qrCancel`, `payment.qrDeclined`, `payment.qrApproved`, `payment.qrCode`, `payment.addPart`, `payment.removePart`, `cart.edit`, `pos.queueFailed`, `receiptKind.type`, `receiptKind.transaction`, `receiptKind.unavailable`, `buyer.title`, `buyer.type`, `buyer.id`, `buyer.optionalType`, `buyer.optional`, `receiptFinder.*`, `lines.all`, `lines.of`, `lines.chosenTotal`, `advances.*`, `receiptResult.*`; changed `masked.logged`, `clock.correctTitle` (now a string), `diagram.renameTitle`, `diagram.connectTitle` (now a string), `diagram.labelTitle`, `signing.declineTitle`. **Breaking (alpha):** removed `timetable.now`, `attendance.correctTitle`, `shifts.moveTitle`, `pick.skipTitle`.
  - **Breaking (alpha):** FloorPlan: `FloorItemKind` has no `wall`, `door` or `window`; `FIXTURE_KINDS` is `['stage', 'counter']`. Areas are plain labelled regions; a building plan is `background`.
  - FloorPlan: labels are never cut — the number and state, then `planDetail` (new); `detail` is shown in the list and the name only (`labelFit`, `labelRoom`). An area switcher (`area`, `defaultArea`, `onAreaChange`, `areaChoices`): all areas or one, segmented up to four, a select beyond; one area drawn alone (`AREA_SEGMENTS_UP_TO`, `areaSwitchKind`, `switchableAreas`, `planFrame`, `inArea`). On phones the list as cards, the plan fitted to the width, no edit mode.
  - FloorPlan's Move / Resize and SeatingChart's seat dialogs: the action as the title, the item, seat or guest as the subject. SeatingChart: `seatingChanges`; tables write their count on the plan. ChangeConfirmDialog: `children`, the application's choice above the change. ResourceSchedule's "Move to…" names its select by `resourceLabel`.
  - Messages: new `floorPlan.area`, `floorPlan.allAreas`, `floorPlan.editOnLarger`, `seating.seatTitle`. **Breaking (alpha):** `floorPlan.moveTitle` ("Move"), `floorPlan.sizeTitle` ("Resize") and `seating.seatAtTitle` ("Choose a seat") are strings, no longer functions of the name.

- 061645d: P5.29 and P5.30, the Admin, Superadmin and Helpdesk views.

  - `HealthList`: monitored things — connections, services, queues, databases, backups, regions — with their state (the application's words and tone, with an icon by `kind`), figures, last success and last error with its message, and the application's actions (Retry); one card per thing on phones. Helpers `healthIcon`, `healthFacts`, `HEALTH_KINDS`.
  - ImpersonationBar: an optional `note` after the reason, from the application (an audited view of a tenant: "Every page you open is recorded in the audit log").
  - SlaTimer: a deadline in words against the application's now — due in, overdue by (danger), paused, met, missed — with its pure helpers (`slaText`, `durationText`, `slaReading`, `durationParts`, `millisecondsBetween`, `slaUrgency`, `SLA_TONES`).
  - ReplyComposer in `@veljaos/ui/rich-text`: reply or internal note, saved replies, files, a link from the application's search, Ctrl/Cmd+Enter (helpers `groupSavedReplies`, `linkNodes`, `isSendKey`).
  - RichTextField: a `ref` handle (`RichTextFieldHandle`: insert at the caret, focus, clear; `insertable`) and `surface`.
  - MessageBubble and ThreadMessage: `internal`, an internal note marked "Internal" on the note surface.
  - DataTable: ArrowDown / ArrowUp, Home and End move between pressable rows and cards (`rowFocusTarget`).
  - Add SatisfactionRating, HelpfulFeedback, LinkSuggestions, PageContents, SearchResultList and CategoryGrid for customer portals and help centres (P5.30 d, e); helpers `ratingAnswer`, `ratingOption`, `scaleValueText`, `asksWhy`, `currentEntry`, `highlightText`, `highlightMatches`, `HighlightedText`.
  - RichText: `headingIds` gives headings stable ids for a page's contents; `richTextHeadings` and `headingSlug` in `@veljaos/ui/rich-text`.
  - `numericFormat` made without a time zone now follows the provider's `timeZone`: `createFormat` rebuilds its `dateTime` and `time` for the provider's zone (they showed the device's zone before, e.g. 06:30 for 08:30+02:00 on a machine in UTC).
  - Messages: new `health.lastSuccess`, `health.lastError`, `health.errorMessage`, `health.never`, `health.empty`, `health.actionNamed`, `sla.dueIn`, `sla.overdueBy`, `sla.overdue`, `sla.paused`, `sla.met`, `sla.missedBy`, `sla.duration`, `sla.dueAt`, `sla.labelled`, `message.internal`, `composer.modes`, `composer.reply`, `composer.note`, `composer.noteHint`, `composer.send`, `composer.addNote`, `composer.sendHint`, `composer.savedReplies`, `composer.findSavedReply`, `composer.attach`, `composer.insertLink`, `rating.comment`, `rating.send`, `rating.required`, `rating.thanks`, `rating.given`, `helpful.question`, `helpful.yes`, `helpful.no`, `helpful.thanks`, `helpful.why`, `helpful.send`, `helpful.commentThanks`, `suggestions.count`, `suggestions.searching`, `pageContents.title`, `searchResults.count`, `searchResults.retry`.

- 0a5cea3: P5.31 to P5.43, the workflows of the accounting product.

  - `PageViewer` (P5.31): a document's pages as the application's images, with pages, zoom and one region highlighted in the page's units (helpers `regionBox`, `regionPage`, `clampPage`, `labelSide`); light in both themes, never mirrored; loading, error and `unavailable` (a locked PDF).
  - `RecognizedField` (P5.31): the application's confidence under any field, an uncertain reading marked with an icon and words, "Changed by you" and "Show where it was read".
  - Merge values in `@veljaos/ui/rich-text` (P5.31): typed and computed merge fields (RichTextMergeField `kind`, `currency`, `decimals`, `computed`, `offsetDays`) filled in by RichText, RichTextField and ReplyComposer (`mergeValues`, `now`); a field without a value stays a pill marked "No value". Helpers `resolveMergeFields`, `resolveMergeText`, `mergeFieldText`, `missingMergeFields`.
  - The sticky first columns of DataTable (also after its selection column), AttendanceGrid, ShiftPlanner, ResourceSchedule and EditableGrid now stand on a layer of their own, as StatutoryFormPage's, so they are drawn the same way every time.
  - `ValueComparison` (P5.33): two sources' values side by side, the differences the application marks, "2 of 4 differ" (`valueComparisonCounts`).
  - The Liro Assistant (P5.34): `AssistantAnswer`, `ProposedAction`, `AssistantComposer`, `AssistantPanel` (with `QuestionList`, `AskedQuestion`), the template `AskPage`, their types and helpers (`AnswerBlock`, `AnswerState`, `ANSWER_STATES`, `answerBusy`, `shownBlocks`, `followUpsShown`, `canReport`, `answerSources`, `questionKey`, `questionReady`, `actionOffers`, `actionSettled`). An answer is the application's data; nothing calls a model. `AgentMark` gained `label` (default "Agent").
  - `PlanComparison` (P5.36): plans side by side, one chosen (`featureCell`, `comparisonRows`, `choosablePlan`; row type `PlanComparisonRow`), and `UsageMeter`: used of an allowance in words and a bar (`meterShare`, `usageWords`, `usageAmount`).
  - New subpath `@veljaos/ui/gantt` (P5.37): `Gantt` on SVAR React Gantt 2.7.3 (MIT edition; a dependency of `@veljaos/ui`, loaded only through the subpath) — phases, tasks, milestones, dependencies, progress, who does each, a phase's budget against spent, the one "now" marker from the application's `now`, months or days; edits by drag and by the rows' dialogs (Move…, Change dates…, Set progress…, Dependencies…) reported through `onChange`; right to left mirrored; phones a list by phase. Helpers `applyGanttChange`, `ganttRows`, `phaseGroups`, `movedDates`, `draggedDates`, `dragChange`, `chartRange`, `dependencyCandidates`, `dependsOn`, `predecessors`, `linkType`, `dependencyType`, `nowPosition`, `isProgress`, `durationDays`, `nextDependencyId`, `forbiddenGanttPackages`; its CSS is in `styles.css`.
  - `EmailPreview` (P5.38): a message as its reader sees it, Desktop / Phone width and Light / Dark mail client (`emailPreviewWidth`).
  - The blog's reading pieces (P5.39): `ArticleList`, `NewsletterSignup`, `ShareLinks` (`opensOutside`), the template `ArticlePage`, and `looksLikeEmail`, `emailProblem`, `bylineText`, `articlePlaces`.
  - `QrCode` (P5.40, on `qr` 0.7.2): any text as a real QR code, dark on light in both themes. The IPS NBS QR helpers (`ipsQrText`, `ipsAmount`, `ipsAccountValid`, `normalizeIpsAccount`, `ipsAccountText`, `ipsReferenceValid`, `ipsProblemsOf`) name every problem by field and never round. The template `PaymentOrderForm` draws a bank's paper payment order as its real form (Serbian forms 1, 2 and 3). PaymentDialog draws no frame for an empty `qrCode`.
  - New subpath `@veljaos/ui/map` (P5.41) on Leaflet 1.9.4 (BSD-2-Clause; a dependency of `@veljaos/ui`, loaded only through the subpath, drawn with SVG):
    - `AreaMap`: GeoJSON areas with their names, the list beside the map, an address with the area it falls in, a legend.
    - `LocationCheck`: a workplace's allowed area, the person's position with its accuracy, the application's verdict, "Use my location" through `onLocate`, the check-in unavailable with its reason.
    - `RegionChart`: a choropleth in the charts' card. Areas take the colour of their value's step (decimal strings compared exactly with the application's breaks; at most five steps of the main blue or neutral). Areas without a value are hatched with "No data". The legend writes its ranges through `format`. Places are points or bubbles. The keyboard and "Show as table" work as in the other charts.
    - The base map's tiles are optional and the application's.
    - Helpers `pointInArea`, `areaAt`, `labelPoint`, `labelFits`, `distanceMeters`, `withinRadius`, `circleBounds`, `geometryBounds`, `unionBounds`, `regionStep`, `regionStepRanges`, `rampShade`, `regionReadingOrder`, `regionKeyTarget`, `bubbleRadius`; its CSS is in `styles.css`.
  - `HierarchyChart` (P5.42): an organisation chart, units, a group of companies or cost centres drawn top-down in HTML (lines by CSS borders, mirrored in right-to-left), with collapse and expand, stacked leaves, a unit shown alone, search, `onOpen`, a WAI-ARIA tree with roving focus, Fit to width, TreeView on phones and a paper mode; pure helpers `indexHierarchy`, `hierarchyPath`, `descendantCount`, `initiallyExpanded`, `revealNode`, `stacksChildren`, `matchHierarchy`, `visibleHierarchy`, `hierarchyKeyAction`.
  - Files and folders (P5.43): the template `FileBrowser` (tree, quick places, path, list or grid, search in the folder or everywhere, upload of files and folders with progress, drag onto a folder, details, storage; empty, no results, no access and offline states), `FileGrid`, `FolderPicker` and `FolderPickerDialog`, `NameConflictDialog`, `FileNameDialog`, `ShareDialog`, `VersionList`, `FilePreview`, `FileDetails`, `FileIcon`; helpers `fileIconKind`, `sizeText`, `momentText`, `folderPath`, `canDropInto`, `blockedFolders`, `pickerTree`, `toggleSelection`, `selectRange`, `withPaths`, `uploadCounts`, `resolveConflicts`, `expiresTooSoon`, `folderPathText`.
  - ActivityList keeps a time given as text in its own order in a right-to-left page (D15), for every caller.
  - Messages: new
    - `richText.mergeFieldMissing`, `richText.missingValues` (merge values)
    - `recognized.*`, `viewer.highlighted`, `comparison.*` (P5.31, P5.33)
    - `assistant.*` (P5.34)
    - `plan.current`, `plan.feature`, `plan.included`, `plan.notIncluded`, `usage.amount`, `usage.ofLimit`, `usage.noLimit` (P5.36)
    - `gantt.*` (P5.37)
    - `emailPreview.*` (P5.38)
    - `article.*`, `share.*`, `newsletter.*` (P5.39)
    - `qr.tooLong`, `ips.problem` (P5.40)
    - `map.*` and `location.*` (P5.41)
    - `hierarchy.*` (P5.42)
    - `files.*`, `folderPicker.*`, `conflict.*`, `sharing.*`, `versions.*` (P5.43)
  - `react-dom` (`^19.0.0`) is now a peer dependency, as `react` is: the package imports it, and a bundled copy failed at import time.
  - ActionGroup and BulkActionBar: a row that folded its actions into "More" unfolds again when there is room (a row sized by its content stayed folded).

- 27764d3: P5.77–P5.81, Group D (analytics and automation):

  - New subpath `@veljaos/ui/pivot` (P5.77), built on TanStack Table: `Pivot` — the user chooses rows, columns, values with their aggregation and filters (buttons and menus, no dragging; a sheet on phones) and the application computes the result, which the pivot lays out as a treegrid with multi-row headers, row groups, subtotals and totals, sticky header and first column, keyboard navigation, drill-down (`onDrillDown`) and export (`exportAction`); its layout and result helpers. Messages `pivot.*`.
  - New: `RuleBuilder` (P5.78) — an automation rule's "When / If / Then" from the application's triggers, fields, tests and actions, with groups, keyboard reordering, problems and the rule in words; its helpers. Messages `rule.*`.
  - ValueComparison (P5.79): `chosen` and `onChoose` choose the values to keep when two records are merged; `chosenCounts`. Messages `comparison.chosenCount`, `comparison.choose`, `comparison.chosen`.
  - New: `DashboardGrid` (P5.81) — cards the user adds, removes, resizes and rearranges (drag, the keyboard on each card's handle, or its menu; phones by the menus), with its pure layout helpers. Messages `dashboardGrid.*`.

- 55bd3bd: P5.90, the owner's review applied to the floorplans: one sticky header band per table in pure CSS (glued at any speed, no seams); the line editor flush in its card, one focus style, optional columns, rebuilt on phones as one card per line; TimeField and FormTimeField; CatalogPicker; Questionnaire number keys; CoursePage's collapsible outline; ResourceSchedule's phone lists; the "now" line under the content; no nested scroll boxes on phones; module tabs that show they scroll; long text that wraps; empty states with room; a quieter reveal dialog; helper text under the input; toasts that never block. Breaking: PosShell `productsOpen` / `defaultProductsOpen` / `onProductsOpenChange` became `orderOpen` / `defaultOrderOpen` / `onOrderOpenChange`, with `orderSummary` (see P5.91 for the migration).
- 34c85bb: P5.92: the page templates consolidated to the core (about eighteen). **Breaking (alpha):** these
  templates and their exports are removed; compose the page from the core templates and the
  components as the recipes in `docs/floorplans.md` describe:

  - `LegalActPage` → `DocumentPage` with `LegalText`, `LegalContents`, `useLegalPanels`.
  - `LegalSearchPage` (`LegalSearchResult`, `LegalSnippet`, `snippetText`, `gazetteNumbers`) →
    `ListPage` with `FilterBar` and `SearchResultList`; `snippetFromRanges` is still exported.
  - `CoursePage` (`CourseModule`, `CourseLesson`, `moduleProgress`, `courseProgress`, …),
    `ArticlePage`, `AskPage` → a reading page on `DetailPage`.
  - `PickList`, `StockCount` (`pickProgress`, `pickStepState`, `PICK_STEPS`, `CountItem`) →
    `WorklistPage` / `ListPage` inside `<LiroProvider density="touch">`.
  - `PaymentOrderForm` → `RecordFormPage`; its paper form is a JSON layout.
  - `SigningPage` → `DetailPage` (or `DocumentPage`) with `SignerList`.
  - `FileBrowser` (`FilePlace`, `FileColumn`, `FileUploadRules`) → `ListPage` with `FileGrid`,
    `FileDetails` and the file dialogs.
  - `PrintCertificate`, `PrintGradeReport`, `PrintFinding`, `PrintLegalAct` → JSON definitions
    rendered from the print parts (still exported). `PrintDocument` stays.

  Their message keys (`article.*`, `course.*`, `legalPage.*`, `legalSearch.*`, `pick.*`, `count.*`,
  `signing.*` and others) are removed from `LiroMessages`.

- c5dc213: P5.93, the owner's fourth review. Breaking changes (alpha) and how to migrate:

  P5.93 (helper a): fields have one non-editable state — read only.

  **Breaking (alpha):**

  - `FieldBaseProps` loses `disabled` and `disabledReason`, so every field does: TextField, TextAreaField, SelectField, ComboboxField, MultiSelectField, CheckboxField, SwitchField, RadioGroupField, DateField, DateRangeField, PeriodField, MonthField, TimeField, NumberField, MoneyField, PasswordField, LookupField, QuantityStepper, ScanField, MentionCombobox, RichTextField, Field (and `FieldControl.disabled`), the `@veljaos/ui/form` bindings. Migration: use `readOnly`. It now looks like the old disabled field (grey, with a border) and stays readable, focusable and selectable; it shows no hint and no placeholder, and an empty value shows "—". A reason under the field is no longer shown: say it once where the page needs it (an Alert above the form, a section's line).
  - `CodeInput`, `BuyerField`, `PlanComparison`, `NumericKeypad`: `disabled` (and `disabledReason`) → `readOnly`. NumericKeypad read only shows the display without keys. ScanField now takes `readOnly`.
  - `DefinedField.disabledReason` is removed: use `readOnly: true` in the definition.
  - `RuleBuilder` `disabledReason` is removed: use `readOnly`.
  - `AssistantComposer`, `MessageComposer`, `ReplyComposer`, `EmailFirstForm`, `NewsletterSignup`, `SatisfactionRating`: `disabled` + `disabledReason` → `unavailableReason` (the field read only, the action unavailable, the reason in words under it).
  - `FileDropzone`: `disabled` + `disabledReason` → `unavailableReason` ("Choose files" stays focusable, aria-disabled).
  - The message `rule.fieldFirst` is removed (RuleBuilder shows the test once the field is chosen).

  **Added:** QuantityStepper `maxReason` / `minReason` (and the messages `quantity.atMax`, `quantity.atMin`): at a limit − / + stays focusable and says why in a tooltip and a line under the field. HierarchyChart `emptyAction`; LinkSuggestions `emptyText` (`suggestions.empty`); DefinedForm `loading` and an empty state (`definedForm.empty`). Skeletons stay visible on sunken surfaces. MaskedValue's refusals are a neutral line under the value.

  P5.93: Diagram (`@veljaos/ui/diagram`) never shows React Flow's credit link. The `hideAttribution` prop is removed — delete it where you pass it; the link is now always hidden (React Flow's credit stays in THIRD-PARTY-NOTICES.md).

  P5.93: CodeBlock (`@veljaos/ui`) and syntax highlighting (`@veljaos/ui/code`, `<CodeHighlighting>`, Shiki). Trace and the assistant's work patterns (Reasoning, ChainOfThought, Plan, Queue, Task, Subagent, Sources). AssistantAnswer: a `code` block kind and `work`. HealthList: `lastError.detail` / `detailLanguage`. Diagram: a run step's `log` / `logLanguage`.

  Migration: AssistantAnswer's `sources` block is now one line "Used N records" that opens into the links (it was an always-open numbered list), and `AnswerSourcesBlock.title` is a `string` (it was a ReactNode) — pass plain text. The message `assistant.sources` is no longer used by AssistantAnswer.

  ### P5.93 (helper c) — migration notes
  - **Toasts:** every `notice` toast now has a close button, also success and info. Nothing to change
    in calls. For a routine action in a till or on a floor plan, drop the toast and answer in place:
    a line's `state`, `CartPanel` `undo={{ message, onUndo, after }}` or `<InlineUndo message onUndo />`.
  - **CatalogPicker:** with one choice there is no footer and no Cancel button any more (the header's
    X closes it); tests that pressed "Cancel" press the X ("Close"). The link back from a level is a
    link-styled button whose name is still "Back to …"; pass `topLabel` ("All services") to name the
    top level (default `messages['catalog.top']`, "All").
  - **IconButton, CompactIconButton, dialogs' close buttons and other icon buttons** no longer carry
    a `title` attribute; their label shows in the library's Tooltip. Tests that read `title` read the
    accessible name instead.
  - **EmailPreview:** `from` and `to` also take `{ name, address }` (`EmailAddress`); a string still
    works.
  - **SidePanels:** the gap under a panel's header is 16px (was 12px when open).
  - No public prop was removed.

  P5.93 (helper d) — breaking changes and how to migrate:

  - **ReceiptFinder:** one search field instead of number, date and total. `onSearch` now receives the typed text (`onSearch(text: string)`, trimmed, after 300ms of quiet or at once on Enter) instead of a `ReceiptQuery`; read the text yourself (a date with `format.parseDate`, an amount with `format.parseNumber`, otherwise the receipt's number). `defaultQuery` is replaced by `defaultSearch?: string`; the `ReceiptQuery` type is removed. New: `searchDelay`.
  - **NameConflictDialog:** the answers are buttons and one press answers (`onResolve` is called on the press); the radio group and Continue are gone, and so is `defaultChoice` (Keep both is always the default, focused). `defaultApplyToAll` now ticks "Do this for the other N conflicts". New: `ConflictFile.thumbnail`, `layout`.
  - **ShareDialog:** same props (new `layout`); the link is created by choosing "Anyone with the link" under General access and turned off by choosing "Restricted" (one confirmation) — there is no "Create link" or "Revoke link" button any more; the access level and Remove access are in one menu per person.
  - **PaymentDialog:** same props; the ways other than the first cash and card way are now in an "Other…" menu (tests that pressed e.g. "Cheque" directly open "Other…" first).
  - **ValueComparison:** numeric columns are no longer end-aligned. While choosing, identical rows are hidden behind "Show identical fields" (`defaultShowIdentical` to show them) and a merged-record preview appears with `onChoose` (`preview={false}` to hide it). New: `onChooseAll`, `preview`, `previewTitle`, `comparisonRowsShown`, `mergedFields`, `MergedField`.
  - **ProductStock:** new optional `label`; a warning or danger stock now shows a state line ("Low stock" / "Out of stock" by default) over its `text` — write `text` as the detail ("3 left"), not "Low stock: 3".
  - **Messages:** removed `conflict.choice`, `conflict.replaceHint`, `conflict.skipHint`, `conflict.continue`, `conflict.applyToAll` (now `conflict.applyToOthers(count, countText)`, the others' count), `sharing.levelOf` (now `sharing.levelMenu(level, name)`), `sharing.remove` (now `sharing.removeAccess`), `sharing.link`, `sharing.linkNone`, `sharing.createLink`, `receiptFinder.searchBy`, `receiptFinder.orSearchBy`, `receiptFinder.number`, `receiptFinder.date`, `receiptFinder.total`, `receiptFinder.search`. Added: `stateLine.unavailable`, `stateLine.locked`, `pos.lowStock`, `pos.outOfStock`, `payment.other`, `payment.doneDetails`, `receiptFinder.searchLabel`, `receiptFinder.orSearch`, `receiptFinder.searchHint`, `comparison.kept`, `comparison.keepAll`, `comparison.source`, `comparison.showIdentical`, `comparison.preview`, `comparison.notChosen`, `conflict.replaceUnavailable`, `conflict.applyToOthers`, `sharing.levelMenu`, `sharing.removeAccess`, `sharing.general`, `sharing.restricted`, `sharing.restrictedHint`, `sharing.anyone`, `sharing.anyoneHint`, `sharing.copied`. Changed English texts: `conflict.title` ("Keep both files?"), `conflict.message`, `conflict.keepBothHint`, `sharing.add`, `sharing.addButton` ("Invite"), `sharing.who`, `sharing.linkAddress`, `sharing.revokeLink`, `sharing.revokeTitle`, `sharing.revokeMessage`. An application with its own messages adds the new keys and drops the removed ones.

  `@veljaos/ui/map`: the base map prop is now `baseLayer` (P5.93 item 37). `AreaMap`, `LocationCheck` and `RegionChart` take `baseLayer` instead of `tiles`, and the type `MapTiles` is now `MapBaseLayer`, with a new optional `maxZoom` (the deepest zoom the provider serves, default 18).

  Migration: rename the prop and the type — `<AreaMap tiles={{ url, attribution, urlDark }} />` becomes `<AreaMap baseLayer={{ url, attribution, urlDark, maxZoom: 19 }} />`; `import type { MapTiles }` becomes `import type { MapBaseLayer }`. The base map stays off by default; its provider, key and usage terms are the application's.

  ReplyComposer's mode switch is now a segmented control: tests that looked for the buttons "Reply" / "Internal note" with `aria-pressed` find radios (`getByRole('radio', { name: 'Reply' })`, checked).

  RuleBuilder (P5.93 item 46) — breaking: a rule has branches.

  `RuleDraft` was `{ trigger, join, conditions, actions }`; it is now
  `{ trigger, branches: RuleBranch[], otherwise: RuleAction[] | null }`, where
  `RuleBranch` is `{ id, join, conditions, actions }` — the first branch is "If", the others
  "Else if" (tried in order), and `otherwise` is "Else" (null when the rule has none).

  Migrate a stored rule:

  ```ts
  const draft: RuleDraft = {
    trigger: old.trigger,
    branches: [{ id: 'b1', join: old.join, conditions: old.conditions, actions: old.actions }],
    otherwise: null,
  }
  ```

  and back, while a rule has one branch and no Else: `const { join, conditions, actions } = draft.branches[0]`.

  - `addRuleCondition(draft, containerId?)`, `addRuleGroup(draft, branchId?)`, `addRuleAction(draft, branchId?)`
    and `setRuleJoin(draft, join, containerId?)` take a branch's (or a group's) id; without it they act on the
    first branch, as before. `addRuleAction(draft, RULE_OTHERWISE)` adds to Else.
  - New: `RuleBranch`, `RULE_OTHERWISE`, `addRuleBranch`, `addRuleOtherwise`, `moveRuleItemTo`.
  - `rulePlace` reports `branchId`, and `list: 'branches'` for an Else-if block.
  - `removeRuleItem` also removes an Else-if branch or Else (`RULE_OTHERWISE`); the first branch stays.
  - Removed: `moveFocusTarget` (internal; the move buttons became one menu per item).
  - Messages: removed `rule.field`, `rule.operator`, `rule.value`, `rule.action`; added `rule.elseIf`,
    `rule.else`, `rule.branchName`, `rule.fieldOf`, `rule.operatorOf`, `rule.valueOf`, `rule.actionOf`,
    `rule.chooseTrigger`, `rule.chooseField`, `rule.chooseTest`, `rule.chooseAction`, `rule.addElseIf`,
    `rule.addElse`, `rule.itemMenu`, `rule.moved`. An application with its own messages adds them.

  Pivot (P5.93 item 45): `views` (the application's suggested views, `PivotView`); the chooser is closed
  by default (`defaultFieldsOpen` now defaults to false on every screen) and opens as a sheet; the
  start column beside the grid is gone; `PIVOT_AREAS` is now ordered rows, columns, values, filters;
  "Expand all" and "Collapse all" are one button. New exports: `PivotView`, `PivotZone`,
  `PivotSummaryParts`, `sameLayout`, `pivotViewOf`, `pivotSummaryParts`, `acceptsField`, `dropField`.
  New messages: `pivot.views`, `pivot.summary`, `pivot.summaryValue`, `pivot.summaryFilter`,
  `pivot.summaryFilters`, `pivot.summaryMany`, `pivot.moved`, `pivot.removedField`.

  Charts (P5.93 item 42): every chart (and RegionChart) takes `toggle` — a ChartSeriesToggle shown as
  the interactive header (key figures at the header's end, under the title on phones). Pass a
  ChartSeriesToggle there instead of in `controls`.

  # Changeset notes from helper h (P5.93 items 43 and 44)

  Not breaking. New: seven charts in `@veljaos/ui/charts` (CandlestickChart, FunnelChart, ScatterChart, Heatmap, SankeyChart, MatrixChart, Treemap) with their helpers; `loadSerbiaBoundaries` and the TopoJSON reader in `@veljaos/ui/map`; RegionChart `attribution`. `regionStep` & co. now come from the charts' step helpers (same names and behaviour; a break beyond the fourth no longer makes a sixth step). New message keys: `chart.itemKeys`, `chart.open`, `chart.high`, `chart.low`, `chart.close`, `chart.rising`, `chart.falling`, `chart.cellName`, `chart.flow`, `chart.from`, `chart.to`, `chart.none`, `chart.more` — an application with its own complete `messages` adds them. `@veljaos/ui/map` now ships boundary data under the ODbL 1.0 (notice in THIRD-PARTY-NOTICES.md).

- 1ca7fb6: P5.94, the owner's fifth review. Breaking changes (alpha) and how to migrate:

  - PaymentDialog: with `onAddPart` the default ways are Cash and Card (no "Split" way); every way can take a part. `onCardStart` receives the amount of the part (`(amount: string | null) => void`; a handler without the argument still works). Mark a card's or an instant payment's part `state: 'approved'`: it has no remove button and cancelling the payment says it is reversed, then calls the new `onCancel` (the application reverses it). `PaymentOption.maxAmount` and `maxReason` limit a part of a way (a voucher's value). "Complete payment" waits with "Still to pay" while the remaining amount is more than zero after a part.
  - VersionList: Restore runs at once, without a question (it is not destructive). The messages `versions.restoreTitle`, `versions.restoreMessage` and `versions.restore` are removed; drop them from your messages.
  - New messages: `payment.partPaid`, `payment.partApproved`, `payment.payByCard`, `payment.payByCode`, `payment.overRemaining`, `payment.overLimit`, `payment.stillToPay`, `payment.declinedHint`, `payment.reverseWarning`, `payment.keepPaying`, `payment.cancelPayment`, `assistant.answering`.
  - AssistantComposer: `onStop` turns the ask button into Stop while `busy`.
  - NewsletterSignup: subscribed shows only the thanks; the band no longer keeps its size.
  - SettlingValue: the reserved width is measured in pixels (the `SettlingMemory` widths are pixels); `reserveChars` still reserves characters.
  - IconButton and CompactIconButton show no tooltip while `disabled`.
  - Launchpad: the home page has no "Customize"; show the editing mode in the user's preferences.
  - New exports: `CURRENT_TONE`, `CURRENT_ROW` (the one "current" look), `partOverLimit`, `stillToPay`, `closesOnSpace`. `mentionQueryAt` takes the chosen mentions as an optional third argument.
  - Buttons, tabs, menu items and field labels never break a word inside (a CSS rule in the package's styles).
  - New: CommonQuestions (a portal's common questions); FileDropzone `expected` (`ExpectedFile`); date fields read a day and a month alone in today's year; DateRangeField types into its first empty end from a press anywhere in its frame; PeriodField's custom range is typed. New messages `file.expected*` and `questions.*`.
  - New in `@veljaos/ui/map`: the `'city-municipality'` level of `loadSerbiaBoundaries`, `SerbiaArea.hasLowerLevel`, `loadSerbiaChildren`, `SerbiaDrillStep`, `serbiaLowerLevel`, `SERBIA_DIVIDED_CITIES`, `SERBIA_CITY_MUNICIPALITIES_ATTRIBUTION`, `RegionChartArea.choosable`, and the MapAreaTone `'main'` — now AreaMap's default (areas were neutral grey; pass `tone: 'neutral'` for the old look). New message `map.regionKeysView`. `@veljaos/ui/map` ships more ODbL boundary data (notice in THIRD-PARTY-NOTICES.md).
  - CalendarView, ResourceSchedule and Timetable draw "now" only as its time (no line). `format.time` / `dateTime` write a 12-hour hour without a leading zero ("7:00 AM").
  - WorklistPage for long queues: rows drawn only in view from 100 items (`WORKLIST_WINDOW_FROM`); `search` / `onSearchChange` / `searchLabel`; `filters` (`WorklistFilter`) / `filter` / `onFilterChange` / `filtersLabel` as chips with counts; `toolbar` stands at the top of the queue, outside its scroll; one tab stop with ArrowUp / ArrowDown / Home / End (choosing from 62em) and `onConfirm` on Enter; the focus follows the next chosen item; a new item's detail opens at its top. New exports `WorklistSummary` (`WorklistSummaryProps`, `WorklistFact`), `worklistKeyTarget`, `nextWorklistItem`, `WORKLIST_WINDOW_FROM`. New messages `worklist.search`, `worklist.filters`, `worklist.done`.

- 8040688: P5.95: printed documents leave the Design System. Every printed document (invoices, credit and debit notes, quotes, delivery notes, decisions and rulings, contracts, letters, minutes, payslips, IOS statements, ledger reports, prescribed forms, the fiscal receipt and labels) is now a PDF that **liro-folio** renders (its own repository, on `@veljaos/tokens` only). The Design System keeps the screens around documents and shows the PDF or its page images. Breaking changes (alpha) and what to use instead:

  - **`PrintPage`, `PrintDocument` and every print part are removed** (`PrintTitle`, `PrintDetails`, `PrintTable`, `PrintSection`, `PrintSignatures`, `PrintSignatureField`, `PrintAmountDueLine`, `PrintPaymentDetails`, `PrintIssuedLine`, with their types `PrintPageProps`, `PrintFrameProps`, `PrintStatus`, `PrintDocumentProps`, `PrintParty`, `PrintColumn`, `PrintDetail`, `PrintDetailsProps`, `PrintIssued`, `PrintSectionProps`, `PrintSignature`, `PrintSignaturesProps`, `PrintTableProps`, `PrintAmountDue`, `PrintPayment`, `PrintSignatureFieldProps`). Instead: render the document with liro-folio and show its PDF with `FilePreview` or `DocumentFrame`, or its page images with `PageViewer`; offer "PDF" / "Download PDF" as an action.
  - **`print-logic` is removed** (`sheetSize`, `fitZoom`, `resolvedMargins`, `cssString`, `pageNumberContent`, `pageName`, `pageRules`, `lengthToMm`, `signatureFieldPlacement`, `printedPageCount`, `PRINT_MARGINS`, `PX_PER_MM`, `PT_PER_MM`, `PageRulesOptions`, `PrintMargins`, `PrintOrientation`, `PrintBodyArea`, `SheetBox`, `SignatureFieldPlacement`). Instead: liro-folio lays out the pages and returns each signature area as its page (from 1) and its rectangle `x y width height` in PDF points, origin at the page's bottom-left.
  - **`ReceiptPreview` is removed** (`ReceiptPreviewProps`, `ReceiptItem`, `ReceiptAmount`, `ReceiptRecap`, `ReceiptRecapColumn`). Instead: show the issued receipt with `ReceiptResult` (state, number, code and link, Print, Send, Copy); its printed form is liro-folio's. `ReceiptFact` is now exported with `ReceiptResult` (same shape).
  - **`DocumentTotals` loses `ruled`** (the thin rules were for paper). Remove the prop.
  - **Messages removed:** `print.pageNumber`, `print.draft`, `print.placeAndDate`, `print.amountDue`, `print.signHere`, `receipt.title`; drop them from your messages.
  - **The print sheet's `@media print` rules** in the package's styles are removed. A screen printed as you see it (a report, a chart, a list; HierarchyChart with `toolbar={false}` and `framed={false}`) still prints.

- 97bf7f1: P5.96: Questions and answers, a page of its own. `QuestionsAndAnswers` shows every question of a portal (300 and more) on CommonQuestion's data: one search field that filters as you type and marks the words found, the categories as chips with their counts, a row per question linking to its own answer page (`answerHref`, through the provider's `linkComponent`), 30 at a time with "Show more" (`pageSize`), and nothing found offering the application's `askAction` with the words typed. `AnswerView` is one answer's page: the question as the title with the way back, the answer, "What to do", "What you need" and the request that does it. New helpers `highlightQuestion`, `questionCounts` (`QuestionCounts`) and `QUESTIONS_PAGE`; new messages `questions.showMore` and `questions.askInstead`. `CommonQuestions` is unchanged and stays for a home page's top questions.
- 820a79a: Phase 5 part 2, Liro patterns.

  - P5.8 Calendar and scheduling: `CalendarView` (day, week, month, agenda), `ResourceSchedule` (drag, keyboard and "Move to…" moves; unavailable times), `SlotPicker`, `Timetable`, with their logic helpers. `LiroProvider` takes `timeZone` (IANA; default the browser's) and the context carries it: `format.dateTime` shows instants in it, `format.time` converts an instant with an offset only when a zone is given; local times without an offset are shown as written. `createFormat` takes the zone as a third argument; new `deviceTimeZone`, `localDateTimeIn`.

  - P5.9, P5.14, P5.16: `TreeView` and `TreeTable` (with `TreeNode`, `TreeTableColumn`, the tree logic `visibleTreeRows`, `treeKeyAction`, `typeAheadTarget`, `treeCheckStates`, `toggleTreeSelection`, `treeAncestors`, `findTreeNode`, `isExpandable`, `needsChildren`); the sensitive value `MaskedValue`; the `PortalShell` template for external participants. New messages: `tree.*`, `masked.*`, `portal.*`.

  - P5.10 touch and POS, P5.11 scanner-first warehouse: `LiroProvider` `density="touch"` (targets of at least 44px, overlays included; type `Density`); `NumericKeypad`, `ProductGrid` / `ProductTile`, `CartPanel`, `PaymentDialog`, `ReceiptPreview`, the `PosShell` template; `ScanField`, `QuantityStepper`, the `PickList` and `StockCount` templates; helpers `keypadInput`, `keypadValue`, `keypadText`, `keypadKeyFor`, `decimalSeparator`, `entryFromValue`, `scanDecision`, `scanKey`, `compareDecimal`, `stepDecimal`, `stepQuantity`, `canStep`, `quantityRange`, `isDecimal`, `pickProgress`, `pickStepState`. Buttons carry `data-shape`. New messages under `pos.*`, `keypad.*`, `cart.*`, `payment.*`, `receipt.*`, `scan.*`, `quantity.*`, `queue.*`, `pick.*` and `count.*`.

  - P5.13 and P5.24 (a, c, e): `AttendanceGrid` — one keyboard grid of people × days or lessons for quick attendance marking, gradebook marks and monthly timesheets (hours and a code per day), with range marking, fill, "Copy previous week", totals and marks from props, a locked state with audited corrections, a hand-off action and a phone view — and `ClockRecordList`, clock-in and clock-out records with audited corrections. New messages under `attendance.*` and `clock.*`.

  - P5.15 Print templates and P5.12 Learning. New: `PrintPage` (an A4 sheet for printing: its own `@page` size and margins, the page number from `messages['print.pageNumber']`, a header and a footer on every printed page, paper always light, a draft or cancelled marker, scaled or scrolling on narrow screens) with the parts `PrintTitle`, `PrintDetails`, `PrintTable`, `PrintSection`, `PrintSignatures`, `PrintIssuedLine` and the helpers of `print-logic`; the templates `PrintDocument`, `PrintCertificate`, `PrintGradeReport`, `PrintFinding`; `CoursePage` with `moduleProgress`, `courseProgress`, `findLesson`; `QuizResult`. styles.css gains print rules inside a PrintPage (rows and headings kept together, a table's header repeated). New messages under `print.*`, `course.*`, `quiz.*`.

  - P5.22: `@veljaos/ui/rich-text`, a new subpath: `RichTextField` (formatted text with a keyboard toolbar, merge fields as pills, @mentions; the value as Tiptap JSON plus sanitized HTML) and `RichText` (the read-only view), with `sanitizeRichHtml`, `richTextToHtml`, `richTextFromHtml` and the other helpers. New dependencies of `@veljaos/ui`, loaded only through the subpath: Tiptap 3.31.4 (MIT packages only).

  - P5.24 b and d, working time: `ShiftPlanner` (people × days of shift templates; keyboard, menu and drag assignment; conflicts, hours and coverage from data; publishing with a confirmation; "Apply rotation…"; one day at a time on phones) with `assignChanges`, `removeChanges`, `moveChange`, `rotationAssignments`, `shiftSpan`, `crossesMidnight`, `templateKey`, `templateForKey`, `movePlannerPeriod`, `todayPeriod`, `shiftsByWeek`, `conflictList`; `MyShifts`; `ShiftSwapDialog`; `WorkingTimeBalance`. New messages under `shifts.*`, `swap.*` and `workingTime.*`.
  - Tokens: the dark theme's text shades over a selection now apply to every `bg-surface-selected` element, also when the theme attribute sits on that element itself.

### Patch Changes

- 0631a75: P4.9, fixes from the owner's Storybook review. **Alpha breaking changes:** every message that shows a number now receives it already formatted (`(count, text, …)`; `lifecycle.step` takes both step and total with their texts) and `formatCount` takes `format`; `ShellCompany.waiting` and `messages['shell.waiting']` are removed (use `note`, written by the application); `WorklistItem.actions` is removed (decisions stand in the detail; `checked`, `onCheckedChange`, `bulkBar`).

  New: `NotificationsPanel` and `NotificationsPage` with their helpers; a company switcher for thousands of companies (`pinned`, `recent`, `status`, `note`, virtualised, full-screen on phones, "Switch company…" in the command palette); `ReasonConfirmDialog`; `FormGrid`; `RelatedDocuments`, `ActivityList`, `ChangeableValue`; `DetailPage` view and edit mode; `StatusPage` `subject` for a suspended company or account; ListPage `visibleViews` (tabs and More, one select on phones); FilterBar `phoneMenu`; EditableGrid `inCard`; `format.time`; toast actions (Undo); `filter.all` and other messages.

  Changed: DueDate shows the date with small tone text instead of a badge; DataTable in a card on phones is a flat list with dividers; the card ends at its last row; side panels share one spacing rule; KeyValueList and form grids take their columns from their own width; one dialog footer rule; launchpad dragging is live, on pointer events; the charts' table view is right in right-to-left; one breadcrumb is not shown; the user menu is neutral.

- badb97a: P4.9d: the phone company switcher is a true full-screen sheet (new `SheetContent` side `full`), focused on its search field and returning the focus to the user menu; one 16px inset for every dialog's header, text and footer; confirmations focus Cancel / Stay when they open; `Toaster` has a `layout` and stands above AppShell's bottom bar on phones (`--liro-shell-bottom`); new message `shell.switchCompanyTitle`.
- 71950bf: P5.31a: AreaMap, LocationCheck and RegionChart measure their labels again when web fonts finish loading, so whether a name fits inside its area no longer depends on how fast the fonts arrived; the map reports itself ready only once the fonts are settled.
- 0bd6b4a: P5.44–P5.61, Group A (accounting and trade), assembled from the library's components:

  - `StatutoryCell.content`: the application's own content in place of an amount, for a column that holds no figure (a financial statement's Note column with a link to the note).
  - ValueComparison compares two or three sources (`ComparisonValues`), for the three-way match of an order, its receipt and the invoice.
  - DocumentPage `counterparties`: the further parties of a document among three parties, beside the counterparty.
  - Toaster: toasts are shown and removed without the fade in a browser driven by automation, so a test never reads a toast at half contrast.

- 1f09230: P5.62–P5.71, Group B (users, HR, documents and governance):

  - New: `DefinedForm` — a form drawn from the application's field definitions (sections, field types, required, `visibleWhen` / `requiredWhen` conditions), with the handle's `check()`, the application's `errors`, `readOnly`, `lang` and a `custom` field; its pure helpers (`definedFormState`, `definedConditionHolds`, `definedFormProblems`, …) and the messages `definedForm.fill`, `definedForm.choose`, `definedForm.tick`.
  - SettingsPage: a section may hold a block after its rows (`content`), such as the signed-in devices.
  - SelectField, ComboboxField and MultiSelectField options take `lang`: a language written in its own name keeps it in the list and once chosen.
  - DateField: the typed and read-only date takes its direction from its text (`dir="auto"`, at the page's start), as DateRangeField: a Serbian date keeps its full stop at the end in a right-to-left page.

- 8024703: P5.72–P5.76, Group C (health, university, field service, fleet, property): examples only, assembled from existing components; CandidateList's `empty` given as text takes its direction from its content, as the default message.
- b41cf48: P5.82–P5.88, Group E (AML compliance): examples only, assembled from existing components.
- 5a40ffb: P5.91: a table's sticky first column never loses a row's line.

  **Breaking (from P5.90): PosShell's phone props are renamed.** A phone till now shows the products first and the order as a compact bar that opens a sheet, so the props that opened the products sheet became props that open the order sheet:

  - `productsOpen` → `orderOpen`
  - `defaultProductsOpen` → `defaultOrderOpen`
  - `onProductsOpenChange` → `onOrderOpenChange`
  - new `orderSummary`: the bar's words, for example "Order · 3 items · 1.011,00 RSD" (the application's count and total).

  Migration: rename the three props. The meaning is inverted (open now means the order is shown over the products), so an application that opened the products sheet by default drops `defaultProductsOpen` instead of renaming it.

- 97bf7f1: P5.96: a map names an area only while it is pointed at or reached by the keys. RegionChart and AreaMap no longer write the names that fit on the map by themselves; after a drill-down, Back or another level no area is named or drawn strong until the user points at one (the focus ring stays the only mark of focus). WorklistPage's `filters`: the first chip is always "All" with every item's count, while the queue opens on the state that needs the user (the application gives the chips and counts, as before).
- 7d5be13: P5.96a: a map's marks follow real input only (RegionChart, AreaMap, LocationCheck). After a drill-down by mouse or touch no area is outlined, named or showing its tooltip until the pointer really moves — an area that appears under a still pointer is not hovered, whatever the browser repeats; the hovered area is drawn by a class, never CSS `:hover`. Leaving the map clears every mark. The focus ring and the keys' area show only when the focus came from the keyboard (a Tab or a key), never after a press of the pointer or a touch; the keys work as before. AreaMap names an area from its list only on the keys' focus.
- 1a06216: P5.96b: one look per interaction on every item. Maps (RegionChart, AreaMap): no name is written on an area; the area under the pointer and the area the keys reached show the same outline, drawn over their neighbours, and a tooltip with the name (AreaMap gains its tooltip); the chosen area is drawn over its neighbours too. Focus rings: `FOCUS_RING` and every ring beside `outline-none` now say `outline-solid` — with Tailwind 4 they drew nothing; rings and frames no longer covered by a neighbour (ToggleGroup's segmented options, CalendarView's events, ResourceSchedule's bookings, ShiftPlanner's cells: the ring inside; FloorPlan's and SeatingChart's focused and chosen items over their neighbours); the Launchpad's locked tile shows the ring.
- 21a0cf6: Phase 5 part 1 — Liro patterns: history, messages and mentions (`HistoryList`, the Message family, `MentionCombobox`); `Questionnaire`; presence and agents (`PresenceAvatars`, `AgentMark`, `AgentQuestion`); shell markers (`ImpersonationBar`, `OfflineIndicator`, `EnvironmentMarker`, `ConnectionState`, AppShell `banners`); delivery and job progress (`StatusTimeline`, `JobProgress`); files and the document frame (`FileDropzone`, `AttachmentList`, `DocumentFrame`); sign-in blocks (`EmailFirstForm`, `ProviderSignInButtons`, `PasswordField`, `CodeInput`, `RecoveryCodes`, `SessionList`); `KanbanBoard`; complex and corrective documents (EditableGrid line types and lookup columns, `LookupCreateDrawer`, `DocumentReferences`, `DocumentCurrency`, `DocumentNotes`, `DocumentSpecification`, `CancellationBanner`, `correctionColumns`, DocumentTotals recap / exchange / footnotes, DocumentPage block order, IrreversibleConfirmDialog `reason`, `format` `sign: 'always'`); catalogues at scale (`LookupField`, `LookupDialog`, `ImportWizard`, `BulkEditDrawer`, `DuplicateWarning`); registers and official forms (`RegisterPage`, `StatutoryFormPage`); common business processes (`PermissionMatrix`, `SetupChecklist`, `SignerList`, `SigningPage`, `MatchingView`, `BalanceBar`, `PeriodicRunPage`). New runtime dependency `@shadcn/react` 0.3.1.

  AppShell gets an `agent` slot before the notifications bell. One row window for long lists (600px around the view, the focused row kept), memoised DataTable rows and cached Intl formatters. Changes before 1.0: the message keys `notifications.today` / `notifications.yesterday` are now `day.today` / `day.yesterday`; `import.chooseFile` and `import.progressText` are removed (ImportWizard uses FileDropzone and JobProgress; new `maxSize`, `maxSizeText`); `RunProgress.text` is now `current` (PeriodicRunPage's running step is JobProgress); DataTable's `getRowLabel` must depend on the row only; StatusTimeline shows the tenant's clock.

- 311681a: P5.21a: the company switcher, `LookupField`, `MatchingView` and `EditableGrid`'s row window run on TanStack Virtual (`useVirtualizer`), as `DataTable` does, with the shared window rules: the rows in view and 600px around them (the company switcher and LookupField drew 240px before), the focused line or the active option always drawn, the keyboard's active option scrolled into view with `scrollToIndex`. Nothing changes in the props, the markup's roles or the look.
- Updated dependencies [786cdbb]
- Updated dependencies [788bdc7]
- Updated dependencies [061645d]
- Updated dependencies [820a79a]
  - @veljaos/tokens@0.1.0-alpha.5

## 0.1.0-alpha.4

### Patch Changes

- a716219: P3.6: polish from the owner's review. `@veljaos/tokens`: `surface.selected` is neutral (gray2 / `#363636`, was blue) and the new `border.selected` (gray7 / gray4, utility `border-selected`) marks a selection. `@veljaos/ui`: selected rows and cards, the sorted header, BulkActionBar and PersonAvatar are neutral; every text block takes its direction from its content (`unicode-bidi: plaintext`); `Alert` and `Banner` default to a bordered `neutral` tone (`tone` is optional); MultiSelectField clears its search after a choice and has a one-line `summary` mode; EditableGrid shows line cards with sticky totals on phones; FilterBar: one-line inline multiSelect, "From" / "To" labels and an optional `currency` on number ranges, actions wrap above; FormActions shows the bottom bar only while the top actions are out of view; FormTabs is the form card; DataTable's refetch loader stands above the table with "Updating…"; new `Spinner` and `Accordion`. **Breaking (alpha):** messages `filter.rangeFrom` and `filter.rangeTo` are replaced by `filter.from` and `filter.to`; new messages `field.selectedCount` and `table.updating`.
- 0cb112e: P3.6c: free text in TextField, TextAreaField, ComboboxField and MultiSelectField, and the chosen option of SelectField, takes its direction from its content (`dir="auto"`) and stays at the page's start side; TextField's new `direction: 'ltr'` writes a code (a tax number, an IBAN) left to right, as e-mail, telephone and URL fields always are. NumberField and MoneyField take a `startText` ("From"). DateRangeField takes `endPlaceholder`, and an empty range shows no lone dash. FilterBar: a number range has one label over its two fields, "From" / "To" inside them, named "Total from" / "Total to" (the messages `filter.rangeFrom` and `filter.rangeTo` are back; 0.1.0-alpha.3 wrote "Total, from"); an empty date range reads "From – To".
- 1304bbd: P3.6d: FilterBar's amount range shows its currency once, in the label ("Total (EUR)", new message `filter.rangeLabel`), and only "From" / "To" and the number in its fields; `filter.rangeFrom` / `filter.rangeTo` take the currency ("Total from (EUR)"). The range's fields are at least 140px and grow with a long amount; the pair wraps instead of cutting it.
- 32c2626: P3.7: the Liro brand files in `@veljaos/tokens/brand/` (`@veljaos/tokens/brand/*`): the wordmark and the icon in every version (SVG, wordmark also PNG) and `web/` (favicon.ico, favicon.svg, apple-touch-icon.png, icon-192.png, icon-512.png, icon-maskable-512.png, site.webmanifest), the Core's default brand. Components take a logo only through props.
- c6a663a: P4.0: `@veljaos/tokens`: `brand/web/favicon.svg` and `favicon.ico` are the tab favicon — the dots without the tile, brand blue (lighter in a dark browser), simplified for 16px; the installed-app icons keep the blue tile. `@veljaos/ui`: new `BrandLockup` (and `lockupName`): the application's name as text ("Liro Business Apps": the brand bold, the product regular, Space Grotesk, `text.brand`), sizes `md` (header) and `lg`, only the brand name below 48em (`compact`), one link home named by the full product name.
- 8d4cd41: P4.1: new template `AppShell` (with `ModuleTab`, `ShellCompany`, `ShellCompanies`, `ShellUser`, `ShellNotifications`, `matchingCompanies`, `COMPANY_SEARCH_THRESHOLD`): the 56px header with the brand lockup, breadcrumbs, search (opens the CommandPalette), notifications dot, company switcher and user menu; centred module tabs; slots for the impersonation bar, environment marker and offline indicator; on phones the bottom action bar with safe-area insets. New messages `shell.*`. `@veljaos/tokens`: new meaning `text.logo` (#0078D4 / #3EACEB, utility `text-logo`); BrandLockup uses it. CommandPalette group headings are in normal case (xs, semibold).
- ba3b733: P4.2: new template `Launchpad` (with `LaunchpadModule`, `launchpadArrowTarget`, `launchpadDigitTarget`, `moveModule`, `dropModule`): module cards in one, two or three columns, counters, locked modules, keys 1–9 and arrows, an editing mode to reorder (buttons and dragging) and hide, skeleton cards. New messages `launchpad.*`.
- 3a94198: P4.3: new templates `ListPage` (saved views, one list card, hidden title by default), `WorklistPage` (list and detail side by side from 62em, Back / Next item below), `PageHeader` (`titleHidden`), `ColumnChooser` and `QuickPreview`. DataTable: `inCard`, `onRowOpen` (Enter opens the record while click and Space keep `onRowClick`), and Space presses a row. AppShell publishes its sticky top's height as `--liro-shell-top`. New messages `list.views`, `columns.*`, `preview.open`, `worklist.*`. Fixes: StatusBadge labels and DateText take their direction from their own text in right-to-left pages. `@veljaos/tokens`: on a selected row or card (`data-liro-surface="selected"`) the dark-theme danger, premium, primary, document and destructive texts take the shade that passes 4.5:1 (`ON_SELECTED`); every status and family colour is now measured on every surface and on the selection.
- ddeeede: P4.4: new templates `DetailPage` and `RecordFormPage` (back button, key figures, sections, side column 300px from 75em, an optional sticky section bar; the record form's actions at the top and in the bottom bar with the unsaved-changes guard on back), new components `KeyFigures` and `SectionBar`; PageHeader gains `back`, `status` and `subtitle`, and `BackButton` is exported. New messages `page.backTo`, `page.sections`. Links (lockup, breadcrumbs, module tabs, section bar, launchpad cards, back button, skip link) set their colour for every state, never the browser's visited colour. DataTable `inCard`: no gap of its own above the table.
- 0b163ba: P4.5: new template `DocumentPage` (lifecycle bar, counterparty, key figures, the lines card with the totals, sections, side panels collapsible one by one and as a whole column) and new components `LifecycleBar`, `DocumentTotals` and `SidePanels`. DataTable in a card reserves its refetch slot only when `loading` or an export slot is given. New messages `lifecycle.step`, `document.*`.
- 6f7492c: P4.6: new templates `ReportPage`, `DashboardPage` and `SettingsPage`; new components `StatCard` and the charts `BarChart`, `LineChart`, `AreaChart`, `DonutChart` (on Recharts 3.10.1, a new dependency of `@veljaos/ui`, with `react-is` 19.3.0). Tokens: the `chart.*` meanings (main, comparison, other, category1–5). Every field takes `hideLabel`. New messages `chart.*`, `report.*`, `settings.saved`.
- 7745e61: P4.7: new templates `StatusPage` (401, 402, 403, 404, 500 with the case number, maintenance, suspended; with `STATUS_KINDS`, `statusLook`) and `AuthShell` (the sign-in frame). `SettingsPage` and its tabs now stand at the page's start; `Tabs` takes `align`. `BarChart` takes `orientation="horizontal"`; the donut is drawn smaller in its card. New messages `status.*`.
- f1ea8f3: P4.7a: the charts move to a subpath of their own, `@veljaos/ui/charts`, rebuilt on the shadcn/ui Chart primitive. **Breaking (alpha):** `BarChart`, `LineChart`, `AreaChart`, `DonutChart`, `seriesColour`, `plotValue` and the chart types are no longer exported from `@veljaos/ui`; import them from `@veljaos/ui/charts`. `DonutSlice` is now `PieSlice`. New: `PieChart`, `RadarChart`, `RadialChart`, `ChartSeriesToggle`, `shortTick`, `percentTick`, `isEmptyChart`; every chart takes `controls`, `legend`, axis and grid switches, `tooltip` (indicator, label, total, defaultCategory), `loading`, `error` and `layout`; area `curve` and `stack`; bar `stack`, `labels`, `activeCategory`, `signTones`, `colorBy`; line `curve`, `dots`, `labels`. New messages `chart.noData`, `chart.error`, `chart.retry`, `chart.loading`, `chart.thousands`, `chart.millions`, `chart.billions`, `chart.percent`.
- cc7c321: P4.7c: light `status.warning.solid` is orange 6; the categorical chart palette is blue, magenta, purple, teal, indigo (no status hues). `Tabs` stand at the start by default (`align="center"` for centred content). `LiroFormat` gains `percent` (the locale's pattern: "62,4%" in Serbian); `messages['chart.percent']` is removed (breaking, alpha). Charts: lines and areas straight up to 31 points with dots up to 12 (`defaultCurve`), equal ticks on dense axes (`equalTicks`), areas take `dots`; `RadialChart` takes `percent`, and labelled rings show their values in one colour.
- cde5cc0: P4.8: `DetailPage` and `RecordFormPage` keep their side column under the content in the phone layout, whatever the viewport. (The example screens are stories only.)
- Updated dependencies [a716219]
- Updated dependencies [0cb112e]
- Updated dependencies [1304bbd]
- Updated dependencies [32c2626]
- Updated dependencies [c6a663a]
- Updated dependencies [8d4cd41]
- Updated dependencies [3a94198]
- Updated dependencies [6f7492c]
- Updated dependencies [abe1548]
- Updated dependencies [cc7c321]
  - @veljaos/tokens@0.1.0-alpha.4

## 0.1.0-alpha.3

### Patch Changes

- 34cac33: P3.1: `DataTable` on TanStack Table 9, fully controlled — columns (alignment, tabular digits, sortable headers with `aria-sort`), `sort`/`onSortChange` (ascending, descending, ascending again), `filters`/`onFiltersChange` (empty state versus "no rows match" with "Clear filters"), selection with `BulkActionBar`, row press and row actions menu, totals row from props (sticky), count through `formatCount` (exact up to 10,000), cursor paging, skeleton first load and refetch loader, row-limit message and export slots. Helpers `formatCount`, `hasActiveFilters`, `isActiveFilterValue`, `nextSort`, `ariaSort`, `COUNT_THRESHOLD`. New messages `table.clearFilters`, `table.selectAll`, `table.selectRow`, `table.rowActions`.
- 876df35: P3.2: `DataTable` on phones, long lists and resizable columns. Below 48em the rows are cards (only the cards are rendered), described by `mobile` (title, subtitle, badge, detail columns); `layout` forces the table or the cards. `virtualize` draws only the rows in view (44px rows, sticky header; cards measured), with `aria-rowcount` / `aria-rowindex`. `resizable` columns (`width`, `minWidth`, `resizable`, `label`; `onColumnWidthsChange`): the handle at the header's end, arrow keys (10px, Shift 40px, in the reading direction), and a popover with "Narrower" / "Wider" for resizing without dragging; widths 64–640px, text cut with an ellipsis. Helpers `clampWidth`, `widthAfterKey`, `widthAfterDrag` and the limits. New messages `table.resizeColumn`, `table.narrower`, `table.wider`.
- 6456eee: P3.2a: fixes from the owner's review. Option and menu items are border-box, so ComboboxField, MultiSelectField, SelectField, DropdownMenu and CommandPalette lists never scroll sideways. ConfirmDialog's button always follows the dialog's tone (`confirmFamily`; without an action, warning → caution, danger → destructive, info → primary, success → positive, neutral → neutral). Every field puts its control 4px under the label block, with or without a description. **Breaking (alpha):** SectionCard has no `withDivider` and draws no line under its header; KeyValueList's default layout is "rows" (label at the start, value at the end, lines between rows), with `layout="stacked"`, `groups` (`KeyValueGroup`) and `columns` 1–3 (4 removed); labels are never upper case. New export `keyValueLines`.
- 4b400e0: P3.3: `FilterBar` — search at the start (260px, clear button, reported after 300ms), filters beside it, actions at the end. Six kinds (select, multiSelect, dateRange, numberRange, boolean, text); the first `inline` filters stand in the row with labels above, the rest in a drawer from the end (320px); active filters that are not inline as removable pills with "Clear all"; on phones every filter in the drawer and a "Sort" menu (`sort`, `sortColumns`, `onSortChange`). Controlled: it only reports `values`, the search and the sort. Helpers `isFilterSet`, `emptyFilterValue`, `clearFilters`, `filterValueText`, `rangeText`, `sortButtonText`. `SelectField` gains `clearable`. New messages `field.clear` and `filter.*`.
- 7ca7bda: P3.4: `EditableGrid` — the lines of a document or journal entry, entered from the keyboard. Cells are the Design System's fields (text, number, select, combobox, date) without frames, or values the application shows; Enter goes down the column and adds a line after the last, Shift+Enter goes up, Ctrl/Cmd+Enter inserts and Ctrl/Cmd+Delete removes a line (`minRows`, `maxRows`); on phones Enter goes through the row. Errors and warnings from `messages` stand under their row; `totals` are shown with SettlingValue. Controlled: `onCellChange`, `onAddRow`, `onRemoveRow`. Helpers `gridKeyAction`, `orderMessages`. Fields gain `describedBy`. New messages `grid.*`.
- f2bdd01: P3.5: form layout. `FormSection` (the SectionCard card with a 1–3 column field grid, `FormFullWidth`, a `collapsible` variant), `FormTabs` (a tab with errors shows a danger warning icon and is named "… — has errors"), `FormActions` (actions at the top and a sticky bottom bar while the form scrolls, `stickyActions`, "Unsaved changes" with `dirty`), `useUnsavedChangesGuard`, `FormWizard` (checked steps, Back keeps the data) and `focusFirstInvalid` (selects the tab or opens the section with the first error and focuses it). New subpath **`@veljaos/ui/form`**: the fields bound to React Hook Form (optional peer dependency `react-hook-form` 7.89.0), and `useFocusFirstInvalid`. New messages `form.*` and `wizard.*`.
- Updated dependencies [7e029e7]
  - @veljaos/tokens@0.1.0-alpha.3

## 0.1.0-alpha.2

### Patch Changes

- 79c0854: P2.1: three new meanings in `@veljaos/tokens`: `surface.inverse` and `text.onInverse` (tooltips) and `border.control` (the boundary of inputs, checkboxes, radios and the off state of switches, at least 3:1 on every surface), with the utilities `bg-surface-inverse`, `text-on-inverse`, `border-control` and `bg-control`. `@veljaos/ui` gains its internal primitives (not exported) and new runtime dependencies (cmdk, react-day-picker, clsx, tailwind-merge); `LiroProvider` now renders an element that overlays render into, so they inherit the theme and direction.
- 24bf323: P2.2a: `Field`, `TextField`, `TextAreaField`, `SelectField`, `CheckboxField`, `SwitchField` and `RadioGroupField`, with the error under the field, a required mark, read-only as plain text and disabled with a visible reason. `@veljaos/tokens` adds the `border-status-danger-fg` utility for the border of an invalid field.
- 4d67fd6: P2.2b: `ComboboxField` (one choice found by typing; the application searches after a 300ms pause with `onSearch` and `loading`, or the field filters its options) and `MultiSelectField` (several choices as pills). New messages `field.loading`, `field.noResults` and `field.remove`.
- 18b9f69: P2.3a: `NumberField` and `MoneyField`. No input mask: the text is read by the provider's `format.parseNumber` on leaving the field or on Enter; the value is a decimal string or null, never a JavaScript number and never 0 for unreadable text. `decimals` adds zeros and never rounds. Unreadable text stays in the field with the new message `field.invalidNumber`, and `onValidityChange` tells the application. MoneyField shows the currency on the side where `format.money` writes it for the locale.
- 1acb483: P2.3b: `DateField` and `DateRangeField`. A date is typed (read by `format.parseDate` on leaving the field or on Enter) or picked in the calendar, which opens only from its button or with Alt+ArrowDown, on the provider's `today`; the value is YYYY-MM-DD. A range whose end is before its start is an error, never swapped. New messages: `field.invalidDate`, `field.invalidRange`, `field.openCalendar`, `field.rangeStart`, `field.rangeEnd`, `calendar.previousMonth`, `calendar.nextMonth`, `calendar.navigation`. **Breaking:** the provider type `DateField` (`'day' | 'month' | 'year'`) is renamed `DatePart`, because the component takes the name.
- 0da9978: P2.3c: `PeriodField`, the previous Design System's PeriodPicker: a button that opens presets (today, this week, this month, last month, this quarter, last quarter, year to date, last year; optional "Clear") and a custom range calendar. Presets follow `yearStartMonth`, `quarterBasis` ('business' or 'calendar') and the provider's `today`. New `format.businessYear` ("2026", "2025/26") and messages `period.*`.
- 4ccc64a: P2.3d: `MonthField`, one month (YYYY-MM) chosen in a grid of twelve, the previous Design System's AccountingPeriodSelect. New messages `calendar.previousYear` and `calendar.nextYear`.
- ba06814: P2.4a: `Dialog`, `Drawer`, `Popover`, `Tooltip` and `DropdownMenu` (entries as data), with the new message `dialog.close`. `Button`, `IconButton` and `CompactIconButton` now pass other attributes and a ref through, so they work as the trigger of an overlay.
- 8c133e3: P2.4b: `ConfirmDialog` (the previous Design System's ConfirmModal: tone from the action's family, loading that blocks closing), `DeleteConfirmDialog` (texts from the provider) and `IrreversibleConfirmDialog` (enabled by typing a given text), with `confirmTone`. New messages `dialog.cancel`, `confirm.deleteTitle`, `confirm.deleteMessage`, `confirm.deleteLabel`, `confirm.typeToConfirm`.
- 5a47909: P2.5a: toasts — place `<Toaster />` once inside LiroProvider and call `notice.success | info | warning | error | loading(message, { title })`; `notice.update(id, kind, message)` turns a loading toast into its result; `notice.dismiss(id)`. New runtime dependency sonner 2.0.8 (MIT) and messages `notice.close`, `notice.region`.
- eb939e6: P2.5b: `Alert` and `Banner` (tones info, success, warning, danger; dismissible), `EmptyState` (empty, no-results, error; compact; one action) and `ErrorState` (case number and report action). New messages `alert.close` and `empty.*`.
- 01e8a9e: P2.5c: `ProgressBar` (named, 5px, fills from the start side), `Skeleton` and `Stepper` (32px step icons, `aria-current`, optional `onStepClick`). New message `stepper.completed`.
- 6d2c6b3: P2.6a: `Tabs` (centred, only the active panel mounted), `Breadcrumbs` (links through the provider's `linkComponent`), `CursorPagination` (previous and next only) and `ShortcutHint`. New message `breadcrumbs.label`.
- 8259054: P2.6b: `CommandPalette` — Ctrl/Cmd+K or Ctrl/Cmd+P, actions first then "Go to", matches highlighted, items found by label, description or keywords; local filtering or `onSearch` with `loading`. New messages `command.*`.
- 99468d5: P2.7a: `ActionGroup` (actions as data, the main one last, the others into a "More" menu on a narrow row) and `UnavailableAction` (`aria-disabled`, its reason in words beside it and in a tooltip on hover, focus and touch). Buttons now draw `aria-disabled="true"` like `disabled`. New message `action.more`.
- 8259054: P2.7b: `SplitAction` — a main action and a chevron menu of related actions joined into one control. New message `action.moreOptions`.
- 8259054: P2.7c: `BulkActionBar` — appears on a selection with the count (announced), "Select all N", clear, and small actions; an action that confirms asks once for the whole selection. `UnavailableAction` takes `small`. New messages `bulk.*`.
- 5cd8a8a: P2.7d: a long button label wraps instead of overflowing: lines centred, normally at most two, the button growing in height from its 36px (30px small) minimum; never cut with "…". Text buttons can now shrink to their container. `BulkActionBar` moves the actions before the main one into a "More" menu when they do not fit, as `ActionGroup` does, so wrapping is the last resort.
- 43c8064: P2.8a: `Card`, `SectionCard` (header with icon, title, description and actions; divider; flush body) and `KeyValueList` (one to four columns, labels upper case only in scripts with letter case, empty values as "—", loading skeletons).
- 8259054: P2.8b: `PersonAvatar` (photo or initials from the first and last word, light primary style) and `PersonName`, with `initialsOf`.
- 8259054: P2.8c: `DateText`, `DateRangeText`, `DueDate` (from the provider's `today`; overdue days in the badge), `NumberText` and `MoneyText`, with `dueState` and `daysBetween`. New `format.dateLong` and messages `due.*`.
- 8259054: P2.8d: `SettlingValue` — the last confirmed value stays still while a new one is computed, a quiet dot after 300ms, reserved width, and one polite announcement when it settles.
- Updated dependencies [79c0854]
- Updated dependencies [24bf323]
  - @veljaos/tokens@0.1.0-alpha.2

## 0.1.0-alpha.1

### Patch Changes

- Phase 1, the look. `@veljaos/tokens`: every value and meaning of the previous Design System (colour ramps, surfaces, text, borders, brand, status tones, button families, spacing, radius, shadows, motion, layout, typography), light and dark themes, the Tailwind theme without raw colours, `tokens.json`, and the interface fonts for seven script classes with on-demand subsets; the build measures contrast and fails below 4.5:1. `@veljaos/ui`: the complete `LiroProvider` (messages, number, money and date formatting and parsing on decimal strings, today, week start, link component, Radix direction), `Button`, `IconButton`, `CompactIconButton` with interface intents and families, `StatusBadge` with `toneFor`, and `useLangAttribute`. `@veljaos/eslint-config`: `liro/no-raw-colors` and `liro/logical-properties`, and Radix imports forbidden under both package names.
- Updated dependencies
  - @veljaos/tokens@0.1.0-alpha.1
