# @veljaos/eslint-config

## 1.0.0

### Major Changes

- e976399: 1.0.0, the first stable release of the Liro Design System.

  - **What it is:** the tokens, components and page templates of 0.1.0-alpha.5. The API is unchanged since then; this release makes it stable. From now on a breaking change raises the major version, and releases are published under the `latest` dist-tag.
  - **Upgrading from an alpha:** follow the release notes of 0.1.0-alpha.5 below (removed templates and print parts, read only instead of `disabled`, `unavailableReason`, renamed props), then the earlier alpha entries if you come from further back.
  - **One import to add for Chinese or Japanese.** The Chinese and Japanese font faces (330 `@font-face` rules, about 96 KB of CSS gzip) moved out of `@veljaos/tokens/tokens.css` into `@veljaos/tokens/fonts-cjk.css`. An application that shows Chinese or Japanese text adds `import '@veljaos/tokens/fonts-cjk.css'` after `tokens.css`; every other application changes nothing and loads about 96 KB less render-blocking CSS on every page (the example list and document pages: 151.6 → 32.0 KB gzip). `@veljaos/ui/styles.css` stays one file: all subpaths together add 4 KB to it.
  - **What else changed since 0.1.0-alpha.5** (no change to the published code's behaviour):
    - every component with text keeps an Arabic and a Japanese story, checked in CI, and Serbian Latin and Cyrillic were checked across the catalogue;
    - a performance budget: the list and document example screens stay under 250 KB of JavaScript and 35 KB of CSS (gzip);
    - comments in the code say what it does, without history;
    - the documentation is short rule documents by subject in `docs/`, a README and a slim AGENTS.md.

## 0.1.0-alpha.5

### Patch Changes

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

## 0.1.0-alpha.4

No changes in this release.

## 0.1.0-alpha.3

No changes in this release.

## 0.1.0-alpha.2

No changes in this release.

## 0.1.0-alpha.1

### Patch Changes

- Phase 1, the look. `@veljaos/tokens`: every value and meaning of the previous Design System (colour ramps, surfaces, text, borders, brand, status tones, button families, spacing, radius, shadows, motion, layout, typography), light and dark themes, the Tailwind theme without raw colours, `tokens.json`, and the interface fonts for seven script classes with on-demand subsets; the build measures contrast and fails below 4.5:1. `@veljaos/ui`: the complete `LiroProvider` (messages, number, money and date formatting and parsing on decimal strings, today, week start, link component, Radix direction), `Button`, `IconButton`, `CompactIconButton` with interface intents and families, `StatusBadge` with `toneFor`, and `useLangAttribute`. `@veljaos/eslint-config`: `liro/no-raw-colors` and `liro/logical-properties`, and Radix imports forbidden under both package names.
