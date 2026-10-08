# Phase 5 part 1 — group B notes (P5.3, P5.4, P5.5)

Branch `bp/P5-group-B`, from the scaffold `eb37070`. Steps: P5.3 Connection, environment and
session markers; P5.4 Delivery and progress status; P5.5 Files and document frame. No example
screens of our own (the integrator places the components in the other groups' screens).

## 1. decisions.md entries (ready to paste; a new section "Liro patterns (Phase 5)" or under it)

- **2026-10-08 — Shell markers (P5.3).** `ImpersonationBar`, `OfflineIndicator`,
  `EnvironmentMarker` and `ConnectionState` (`components/shell-markers.tsx`, logic in
  `shell-markers-logic.ts`, tested), and an additive `banners` slot on `AppShell`.
  1. **Two bars, not Banners.** The impersonation bar and the offline indicator are strips across
     the screen aligned with the header's content: 8px top and bottom, the header's side padding
     (16px with the safe-area insets on phones, 24px from 48em), 13px text, one line that wraps,
     a 1px line under them. A Banner (16px padding, radius md, a 20px icon) is a message inside a
     page; these are part of the shell and stay for as long as their state lasts, so they cost as
     little height as possible. Each starts with a 16px icon and a semibold lead, then the parts
     separated by a decorative "·".
  2. **ImpersonationBar** (not dismissible): the warning tone (`status.warning.bg`, a
     `status.warning.border` line under it, the icon UserCog and the lead "Viewing as Milica
     Petrović" in `status.warning.fg`, the rest in `text.primary`), then the mode, "Reason: …" and
     the time left, and at the end "Exit" (a small neutral default button, LogOut mirrored in
     right-to-left; `exitLabel` replaces the text). A `section` named "Session as another user".
     **Time left (the choice the brief left open):** the application passes the end as an instant
     (`endsAt`, ISO 8601 with its offset); the bar shows the whole minutes left, **rounded up**
     (`minutesLeft`, tested: 22 min 30 s reads "23 minutes left", the last seconds read "1 minute
     left", never "0"), through `messages['impersonation.minutesLeft'](minutes, text)` with the
     number written by `format.number`, and "Time is up" after the end. It redraws exactly when the
     number changes (`untilNextMinute`, tested), not on a fixed tick, so it is never a minute late.
     The time is not a live region (it would speak every minute); ending the session is the Core's.
     Above the header, sticky with it (the AppShell slot).
  3. **OfflineIndicator** (`offline`, `waiting`, `action`): while offline a strip under the header
     in the neutral tone with its border (the neutral Banner's look, `status.neutral.bg`, the
     WifiOff icon), "Offline" (`connection.offline`, the plan's key) and what is waiting in the
     application's words with its own count ("2 changes are kept on this device and sent when the
     connection returns."), an optional action at the end ("Try now"). When the connection returns
     the strip goes without a trace; a live region that is always in the page says "Offline" when
     it goes and "Back online" (`connection.online`) once when it returns, cleared after 5 s, and
     nothing on a page that starts online. Neutral, not warning: being offline is a state of the
     device, nothing is lost (the impersonation bar takes the warning tone, so the two never look
     alike).
  4. **EnvironmentMarker** (`label`, `tone`): a bordered StatusBadge after the brand, on phones too
     (AppShell renders the slot in both layouts), never shrinking or wrapping; read as
     "Environment: Sandbox" (`environment.prefix`, screen readers only). **Tone:** warning by
     default (the data are not real: take care); the application may choose premium, neutral,
     success or danger; the type `EnvironmentTone` excludes info, so it is never blue (D17).
     Production shows no marker.
  5. **ConnectionState** (`status`: local / sending / sent / failed, `at`, `onRetry`): where a
     draft is, beside its actions — 12px text with a 14px icon in a `role="status"`: HardDrive
     "Saved on this device" or "Saved on this device at 14:12" (`at` through `format.time`, the
     tenant's clock as P4.9 decided), the Spinner's small ring "Sending…" (drawn inline: the Spinner
     is a status of its own), CloudCheck in `status.success.fg` "Sent at 14:13", and CircleAlert
     with the text in `status.danger.fg` "Not sent. It is kept on this device." with a small
     "Send again" button (RotateCcw) when `onRetry` is given. The button stands outside the live
     region.
  6. **Banners in the shell (AppShell `banners`, additive).** Application-wide Banners (a trial
     ending, a maintenance window, most important first) stand at the top of `main`, under the
     header and the offline indicator, above the page: full width and square (no radius, no side
     borders, a 1px `border.default` line under each, 12px by the header's side padding), and
     **they scroll away with the page**. **The order, top to bottom:** impersonation bar → header
     (with module tabs) → offline indicator → banners → page. The first three are sticky together
     (the existing sticky top); a session as another user outranks everything, so it is first;
     being offline concerns every action on the screen, so it stays in view; a trial ending does
     not. A dismissible banner is the application's state (`onClose`). A message about one page's
     content stays an Alert in the page. Tested (`app-shell.test.tsx`: the order in the markup,
     banners inside `main`), and the story "Templates / AppShell / Shell markers" (desktop and
     phone) checks the order on screen and the phone width.
  - **Messages:** `connection.online`, `connection.local(time)`, `connection.sending`,
    `connection.sent(time)`, `connection.failed`, `connection.retry`, `environment.prefix`,
    `impersonation.region`, `impersonation.viewingAs(name)`, `impersonation.reason(reason)`,
    `impersonation.minutesLeft(minutes, text)`, `impersonation.ended`, `impersonation.exit`.

- **2026-10-08 — Delivery and progress (P5.4).**
  1. **StatusTimeline** (`components/status-timeline.tsx`): a process's states in order (delivery
     to SEF: Prepared → Sent to SEF → Delivered → Accepted), the current one highlighted, when each
     was reached and what comes next. A vertical list: a 16px dot per state on a 1px
     `border.default` line joining the dots, the name (13px) with its time (`at`, an instant,
     through `format.dateTime`, in a `time` element, 12px `text.tertiary`) on the same line, an
     optional `detail` line (12px `text.secondary`: "by Dragan Ilić", "SEF ID …"), 16px between
     states. **One look for states:** the dots and the state logic are LifecycleBar's
     (`lifecycleState` is reused, not copied): reached states neutral with a check (the name in
     `text.primary`, "Completed" for screen readers), the current one `brand.solid` with its name
     semibold in `text.brand` and `aria-current="step"`, later ones an empty ring with the name in
     `text.tertiary`, a failed one `status.danger.solid` with an X and its reason under the name in
     `status.danger.fg` ("Failed" for screen readers). **The next step** (`next`: title,
     description, actions, tone) stands under the current state inside its item: an inset block —
     not a card: radius md, 12px padding, the tone's subtle background, no border — with the title
     13px semibold in the tone's fg, the description and the application's actions 8px apart; a
     `group` named by "Next step: <title>". Neutral by default, warning or danger when the user
     must act; never blue. **The Dot is a copy of LifecycleBar's 15 lines** (LifecycleBar is
     group D2's file and does not export it; see Needs).
  2. **JobProgress** (`components/job-progress.tsx`, logic `job-logic.ts`, tested) generalises
     "Progress in a dialog" (P3.6) instead of adding a second pattern: the same Spinner (total not
     known) or ProgressBar with the count, now with Cancel and the final report; one component
     inline in a card or as a Dialog's content. **Running:** the label (13px semibold), the
     ProgressBar, under it "312 of 1.284" (`job.progress`, both counts through `format.number`) and
     the item being worked on at the end of that line, cut with "…"; Cancel (the cancel intent) at
     the end of the footer, "Cancelling…" and disabled while the job stops (`cancelling`); the
     count never draws past the total (`clampedDone`). **Report:** a 16px icon and "Finished" /
     "Cancelled" (13px semibold) — CircleCheck `status.success.fg` when nothing failed,
     TriangleAlert `status.warning.fg` when some items failed, CircleSlash `text.secondary` when
     cancelled (`jobOutcome`, tested) —, the outcome lines written by the application with its own
     counts and nouns ("1.270 invoices sent", "14 not sent"), each in its tone's fg, the failed
     items as rows (the item 13px medium, the reason 12px `text.secondary`, 1px `border.subtle`
     lines) at most 240px high and scrolling (focusable only while it scrolls, as WorklistPage's
     pane), and the application's actions ("Download report", then "Retry failed") at the end of
     the footer. **The footer** stands 16px under the content with its buttons 8px apart at the
     end — DialogFooter's rule — so the component reads the same in a card and in a dialog. **In a
     dialog** the application makes the Dialog not dismissible while the job runs (story "In a
     dialog"). **Live regions (a departure from "Progress in a dialog", which put the count in a
     `role="status"`):** the running count is not live — a job that advances several times a
     second would make a screen reader talk without end; the ProgressBar carries its value for
     whoever asks — and the report is: a status region always in the page announces "Finished:
     <label>" and the outcome lines once, when the job ends.
  3. **Which one (for the integrator's rule):** StatusTimeline — one process's states over minutes
     to days with what comes next (a delivery, a payment order, a bank import), in a side panel or a
     document section; LifecycleBar — the dots above a document's header, one row; HistoryList
     (group A) — the full record of who changed what; ActivityList — the compact side-panel list;
     Stepper / FormWizard — steps the user goes through; JobProgress — a job running now.
  - **Messages:** `timeline.failed`, `timeline.next`, `job.progress(done, doneText, total,
totalText)`, `job.cancel`, `job.cancelling`, `job.finished`, `job.cancelled`, `job.failures`.

- **2026-10-08 — Files and document frame (P5.5).**
  1. **FileDropzone** (`components/file-dropzone.tsx`, logic `file-logic.ts`, tested): the field
     frame (label, description, error, disabled with its reason; no read-only) around a zone —
     radius md, a 1px dashed `border.control` border on the raised surface (`status.danger.fg`
     when invalid, disabled surface when disabled), 16px padding — with a 20px Upload icon, the
     "Choose files" / "Choose a file" button (`file.choose(multiple)`, the neutral default weight,
     FileUp) and "or drop them here" (`file.drop(multiple)`); under them, **before choosing**, the
     accepted types and the size limit as the application writes them ("PDF, XML, JPG or PNG ·
     up to 10 MB": `acceptText`, and `maxSizeText` "10 MB" through `file.maxSize`), 12px
     `text.secondary`, the button's description. The labelled group is the field's
     (`role="group"`, named by the label). **Dropping is a shortcut, never the only way:** the
     button opens the file dialog (a hidden input); phones show no drop text. While files are
     dragged over it the zone takes the neutral selection (`surface.selected`, a solid
     `border.selected` border), never blue. **The dragging rule is untouched:** files dropped from
     the operating system arrive only through the browser's drop events — there is no dragged
     element of ours, no ghost, nothing to lift; the drop listeners are native (a drop target has
     no role, and jsx-a11y allows no handlers on an element without one). **Checks:** every chosen
     or dropped file is checked again (`checkFiles`: the type first — extension in any case, exact
     MIME type or a "type/*" family, a typeless file only by extension —, then the size, then the
     count against `maxFiles` counting `existing`; a rejected file never uses up the count) because
     a dropped file never passes the input's `accept` and the dialog can be switched to "All
     files". Accepted files go to `onFiles`, rejected ones to `onReject` and are named under the
     zone in `status.danger.fg` with the reason (`file.rejectedType(name, accepted)`,
     `file.rejectedSize(name, limit)`, `file.rejectedCount(name, max, text)`) in an always-present
     `role="alert"`, until the next choice. Sizes are bytes compared only; the user reads the
     application's text (D4).
  2. **AttachmentList** (`components/attachment-list.tsx`): rows, never cards (P4.9 rule 4), a 1px
     `border.subtle` line between them; on its own or in a side panel the rows are 8px above and
     below and carry `panel-row`, so SidePanels' edge rule holds; `inCard` pads them 12px by 16px
     for a card. Each row: the name 13px medium (`bdi`, `dir="auto"`, long names wrap), the size as
     the application's text (12px `text.tertiary`), an optional `flag` (a StatusBadge with the
     application's tone and text: "Not an archival format"), an optional `detail` line, the state
     line, then `extra(file)` — **the per-file control slot** (group D2's "Send with the
     e-invoice" checkbox; story "In a card, a control per file"). **States and their next step in
     words:** uploading — a ProgressBar (named by the file) and "Uploading, 45%. It is checked for
     viruses next." (`format.percent`); scanning — ScanSearch, "Checking for viruses. It can be
     opened in a moment."; available — no state line, the name is a link-coloured button that
     downloads; quarantined — ShieldAlert in `status.danger.fg`, "Blocked: a threat was found, so
     it cannot be opened. Upload a clean copy." (the name in `text.secondary`); failed (added:
     an upload can fail) — CircleAlert, "Not uploaded." and the application's reason, with "Upload
     again" when `onRetry`. **Download** through `onDownload(file)` at the moment of the click (the
     application fetches a short-lived link then; a stored link would expire); while its promise is
     pending the name is `aria-busy` with a 14px Spinner after it. **Remove** (a 28px Trash2,
     destructive family, subtle) only where `canRemove(file)` returns true and `onRemove` is given;
     asking first is the application's. `attachmentOffers` (tested) decides what a row offers.
     Loading: three skeleton rows, `aria-busy`; empty: "No attachments" (`attachment.none`) or the
     application's `empty`.
  3. **DocumentFrame** (`components/document-frame.tsx`, protocol `document-frame-protocol.ts`,
     tested; documented for viewer authors in `docs/document-frame.md`): a viewer from another
     origin in an iframe with `sandbox="allow-scripts"` (`allow-same-origin` only with
     `allowSameOrigin`), `referrerpolicy="no-referrer"`. A message is taken only when it comes from
     the frame's own window, from `allowedOrigin` **exactly**, and matches the protocol
     (`{ protocol: 'liro-document-frame', version: 1, type, … }`; viewer → host `loading`,
     `ready(page, pageCount, zoom)`, `page`, `zoom`, `error(message?)`; host → viewer `goToPage`,
     `setZoom`); anything else is ignored. Commands go to `allowedOrigin` only; "*" only for an
     opaque origin ("null": a sandbox without `allow-same-origin`, or `srcdoc`), which cannot be
     named — the commands carry only a page number or a zoom level. **The viewer owns the state:**
     the toolbar shows what the viewer reports back, never a guess. **Toolbar** (a row on the
     raised surface, 8px by 12px, a line under it): previous and next page (28px compact buttons,
     chevrons mirrored in right-to-left), "Page 2 of 3" (`frame.page`, both numbers through
     `format.number`, a polite status), zoom out, the level (`format.percent`, read as "Zoom
     125%"), zoom in; steps 50, 75, 100, 125, 150, 200, 300 (`ZOOM_STEPS`, `zoomStep` tested);
     disabled at the ends and until ready. **Loading:** a page-shaped skeleton over the frame,
     `aria-busy`. **Error:** the viewer's `error` (its text, at most 300 characters) or no `ready`
     within `timeout` (default 20 s, `FRAME_TIMEOUT`): an ErrorState "The document could not be
     shown." with the text or "The document viewer did not answer." and "Try again", which loads a
     new frame. The frame: radius md, `border.default`, the sunken surface; 480px high unless the
     application sizes it. The stories host a viewer written in the story (`srcdoc`) that speaks
     the protocol; one proves that messages from another origin are ignored.
  - **Messages:** `file.choose(multiple)`, `file.drop(multiple)`, `file.maxSize(limit)`,
    `file.rejectedType(name, accepted)`, `file.rejectedSize(name, limit)`,
    `file.rejectedCount(name, max, text)`, `attachment.uploading(percent)`,
    `attachment.scanning`, `attachment.quarantined`, `attachment.failed`,
    `attachment.download(name)`, `attachment.remove(name)`, `attachment.retry(name)`,
    `attachment.retryLabel`, `attachment.none`, `frame.toolbar`, `frame.previousPage`,
    `frame.nextPage`, `frame.zoomIn`, `frame.zoomOut`, `frame.page(page, pageText, count,
countText)`, `frame.zoom(text)`, `frame.loading`, `frame.error`, `frame.timeout`,
    `frame.retry`.

## 2. AGENTS.md rows (components table)

| Name                                                                                                                                                                                                                                                    | Kind      | Step | Note                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `ImpersonationBar`, `OfflineIndicator`, `EnvironmentMarker`, `EnvironmentTone`, `ConnectionState`, `ConnectionStatus`, `CONNECTION_STATUSES`, `minutesLeft`, `untilNextMinute`                                                                          | Component | P5.3 | Shell markers: impersonation bar in the warning tone, not dismissible, minutes left rounded up from `endsAt`, "Exit"; offline strip (neutral) with the application's waiting text, "Back online" announced once; environment badge after the brand, warning by default, never blue; a draft's local / sending / sent / failed with "Send again". AppShell `banners`: full-width square strips at the top of the content, under the sticky impersonation bar, header and offline indicator. |
| `StatusTimeline`, `StatusTimelineStep`, `StatusNextStep`                                                                                                                                                                                                | Component | P5.4 | A process's states, vertical, LifecycleBar's dots (`lifecycleState`), times through `format.dateTime`, a failed state's reason, the next step (inset block, neutral / warning / danger, the application's actions) under the current state.                                                                                                                                                                                                                                                |
| `JobProgress`, `JobOutcomeLine`, `JobFailure`, `JobState`, `JobOutcome`, `clampedDone`, `jobOutcome`                                                                                                                                                    | Component | P5.4 | A long job inline or in a Dialog: ProgressBar with "312 of 1.284" (Spinner without a total), Cancel; then "Finished" / "Cancelled", the application's outcome lines, failed items with reasons (scrolling at 240px), report actions; DialogFooter's spacing.                                                                                                                                                                                                                               |
| `FileDropzone`, `FileFacts`, `FileRules`, `FileRejection`, `RejectionReason`, `acceptsFile`, `checkFiles`                                                                                                                                               | Component | P5.5 | Field frame around a dashed zone: "Choose files" button (the way) and drop (the shortcut, native drop events, neutral selection while over); accepted types and "up to 10 MB" shown before choosing; every file re-checked (type, size, count); rejections named under it and reported.                                                                                                                                                                                                    |
| `AttachmentList`, `Attachment`, `AttachmentState`, `AttachmentOffers`, `attachmentOffers`                                                                                                                                                               | Component | P5.5 | Rows divided by lines (`panel-row`; `inCard` 12×16px): name (downloads when available, through `onDownload` at click time), size text, flag badge, state with its next step (uploading with a bar, scanning, quarantined, failed with "Upload again"), `extra(file)` control, remove only where `canRemove`.                                                                                                                                                                               |
| `DocumentFrame`, `FrameState`, `ViewerMessage`, `HostMessage`, `FRAME_PROTOCOL`, `FRAME_VERSION`, `FRAME_TIMEOUT`, `ZOOM_STEPS`, `readViewerMessage`, `originAllowed`, `targetOrigin`, `hostMessage`, `frameReducer`, `INITIAL_FRAME_STATE`, `zoomStep` | Component | P5.5 | A viewer from another origin in `sandbox="allow-scripts"`; messages only from its window and `allowedOrigin` exactly, in the protocol of `docs/document-frame.md`; toolbar pages and zoom showing what the viewer reports; skeleton; ErrorState with "Try again" on error or timeout.                                                                                                                                                                                                      |

## 3. BUILD-PLAN status notes

- **P5.3** — done (group B): ImpersonationBar, OfflineIndicator, EnvironmentMarker, ConnectionState; AppShell `banners` slot and the order of the shell's markers; story "AppShell / Shell markers" (desktop, phone). Agent interactions in the shell are group A's (AgentQuestion).
- **P5.4** — done (group B): StatusTimeline (with LifecycleBar's states and a next-step slot), JobProgress (inline and in a Dialog, generalising "Progress in a dialog").
- **P5.5** — done (group B): FileDropzone, AttachmentList (per-file control slot for D2), DocumentFrame with its protocol in `docs/document-frame.md`.

## 4. Needs (from other groups or protected files)

1. **Integrator — placements (brief item 7):** AttachmentList into D2's final invoice
   F-2026-0418 (`// INTEGRATION: AttachmentList`; use `inCard` inside the document's attachments
   SectionCard `flush`, and `extra={(file) => <CheckboxField label="Send with the e-invoice" … />}`
   as the story "In a card, a control per file" does) and into C's signing screen; DocumentFrame
   as C's signing `preview` (`// INTEGRATION: DocumentFrame`; the story "Components / Files /
   DocumentFrame" contains a `srcdoc` viewer of RU-2026-017 that can be copied into C's data, with
   `allowedOrigin="null"`); StatusTimeline into an invoice's delivery side panel (as in the
   "Default" story); the shell markers into the examples' `Shell` (`example-shell.tsx`) if the
   integrator wants an example with a sandbox marker or an impersonation session. JobProgress
   replaces E's `// INTEGRATION: JobProgress` (import progress) and F's (periodic run), and
   FileDropzone E's `// INTEGRATION: FileDropzone` (import upload: `multiple={false}`,
   `accept={['.csv', '.xlsx']}`).
2. **Group D2 (LifecycleBar owner), optional:** export LifecycleBar's `Dot` (or move it to a
   shared internal module), so StatusTimeline uses it instead of its 15-line copy
   (`status-timeline.tsx`, `Dot`). Purely internal; nothing breaks if it stays.
3. **Group A (HistoryList):** the "which one" rule above lists HistoryList; the integrator merges it
   with A's wording.
4. **Group A (AgentQuestion in the shell):** AppShell (ours) has no agent slot; A wrote that it
   needs none or will say so. If A's notes ask for one, it is an additive slot in
   `templates/app-shell.tsx` (a Popover/Drawer opened by the application needs no slot).
5. Nothing needed in protected files.

## 5. Third-party code

None. No shadcn files were copied and no dependency was added. Icons are lucide-react's (already a
dependency): UserCog, WifiOff, HardDrive, CloudCheck, CircleAlert, RotateCcw, LogOut, Check, X,
CircleCheck, CircleSlash, TriangleAlert, Upload, FileUp, ScanSearch, ShieldAlert, Trash2,
ChevronLeft, ChevronRight, ZoomIn, ZoomOut, Download, Send, CreditCard.

## 6. Verification results

Run on Windows on 2026-10-08, branch `bp/P5-group-B`:

- `npx pnpm@12.6.0 typecheck` — pass.
- `npx pnpm@12.6.0 test` — pass (packages/ui 49 files, 553 tests; eslint-config 40; scripts 9).
  New tests: `shell-markers.test.tsx`, `file-logic.test.ts`, `document-frame.test.ts`,
  `job-progress.test.tsx` (also StatusTimeline), `app-shell.test.tsx` (banners order),
  `provider-p15.test.tsx` (message keys).
- `npx pnpm@12.6.0 lint` — pass (exit 0, `--max-warnings 0`).
- `npx prettier --check packages/ui/src docs` — pass.
- `npx pnpm@12.6.0 build` — pass. `npx pnpm@12.6.0 build-storybook` — pass.
- Story and accessibility tests in the four modes on port 6102
  (`playwright.local.config.mjs`, `tests/stories.spec.ts tests/accessibility.spec.ts -g
"Shell markers|StatusTimeline|JobProgress|Components/Files/|Templates/AppShell"`): 704 tests;
  691 passed in the full run, the 13 FileDropzone failures (a test helper: Testing Library's
  `fireEvent` cannot carry files in a DragEvent; the stories now dispatch real DragEvents) and
  then all 96 FileDropzone tests passed on the rerun. Fixed on the way: the download name's
  target was under 24px (now `min-h-6`), disabled dropzone text used `text.disabled` (now
  `text.secondary`, contrast).
- Not verified here: visual baselines (CI only); the consumer check was not run.
