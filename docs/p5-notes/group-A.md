# Group A — P5.1 History, comments and messages; P5.2 Presence and agent marking; agents in the shell

Branch `bp/P5-group-A`, from the scaffold commit eb37070. Notes for the integrator: paste the
entries into `docs/decisions.md`, `AGENTS.md` and `BUILD-PLAN.md`.

## 1. decisions.md entries

Under a new heading, e.g. `## Liro patterns (Phase 5)`:

- **2026-10-08 — The shadcn/ui message and questionnaire primitives (P5.1, owner: "Phase 5 builds
  on shadcn/ui").** shadcn/ui's registry items `bubble`, `marker`, `message`, `message-scroller`
  and `questionnaire` (style `radix-vega`, fetched 2026-10-08 from
  `https://ui.shadcn.com/r/styles/radix-vega/<name>.json`) are copied into
  `packages/ui/src/primitives/` (`bubble.tsx`, `marker.tsx`, `message.tsx`,
  `message-scroller.tsx`, `questionnaire.tsx`) and adapted as the P2.1 primitives: Liro meanings
  instead of shadcn colours, logical properties, no text of their own (required props), `cn`
  from `primitives/cn.ts`, `exactOptionalPropertyTypes`, not exported (D10); internal stories
  "Internal/Primitives/Messages" and "Internal/Primitives/Questionnaire".
  - **One new runtime dependency, `@shadcn/react` 0.3.1** (MIT, no dependencies of its own, peer
    React ≥ 19; published 2026-08-31): Message Scroller and Questionnaire are thin styles over its
    unstyled `@shadcn/react/message-scroller` and `@shadcn/react/questionnaire`, which hold the
    behaviour (the scroll anchoring, "following the end", the questionnaire's fieldsets, number-key
    shortcuts and focus). Copying its compiled code instead was rejected (unreadable, untestable,
    not maintained with the registry). Bubble, Marker and Message are plain markup.
  - **Bubble:** shadcn's seven variants (default = the primary colour, secondary, muted, tinted,
    outline, ghost, destructive) are replaced by three neutral **surfaces** — `raised`
    (surface.raised with a border.default line: other people's messages), `sunken`
    (surface.sunken: the user's own) and `ghost` (no box) — **no blue bubbles (D17)**. Radius lg,
    padding 8px 12px, 13px, text direction from the content. Not kept: `asChild` (bubbles are not
    buttons) and BubbleReactions (no reactions in Liro).
  - **Marker:** xs text.secondary (shadcn sm, which competed with the message); the separator's
    lines 1px border.subtle drawn as the pseudo-elements' top borders (a border colour is not a
    background utility here), 4px from the text with `me-1` / `ms-1` (shadcn `mr-1` / `ml-1`).
  - **Message:** the avatar slot 26px (PersonAvatar 'sm') at the top of the row beside the name
    (shadcn put it at the bubble's bottom and moved it up by 32px with a footer); header and footer
    xs text.secondary without inline padding; `align="end"` is `flex-row-reverse`, which follows
    the direction.
  - **Message Scroller:** the region's name (`label`; shadcn "Messages") and the button's text are
    required; the region focusable with the inset focus ring; the content a `log` (new messages
    announced politely); 12px between items (shadcn 32px); shadcn's `scrollbar-thin`,
    `scroll-fade-b` and `scrollbar-gutter-stable` utilities do not exist in Liro and are left
    out. The button is the Liro neutral "default" button, small (30px), with an arrow and text,
    centred at the bottom; it fades and slides in the base duration, none under reduced motion.
  - **Questionnaire:** a choice is a 44px row, border.default, radius md, padding 12px 16px,
    surface.hover under the pointer; **a chosen choice is the neutral selection (surface.selected
    with a border.selected line)**, while its radio or checkbox is the Liro control, filled with
    brand.solid (checked controls stay blue, D17); the focus ring around the whole row; disabled
    without opacity; invalid with the danger border. The number key is drawn as ShortcutHint's
    key. **Not kept:** the primitive's Previous / Next / Skip / Submit (English defaults, and they
    move in list order, not along a branching path), its Progress ("Question 1 of 5", a position,
    not answered questions) and its Input (the Design System's fields are used).
- **2026-10-08 — HistoryList (P5.1; the plan's "Timeline / HistoryList", one component named
  HistoryList).** The full history of a record: entries newest first, grouped by day like the
  notifications page — "Today", "Yesterday", then `format.date` — each heading an h3 by default
  (`headingLevel`), xs semibold text.secondary. An entry's `at` is an ISO instant in the tenant's
  offset; its date part is its day and its clock part is shown with `format.time` (the
  application may pass `time`), so heading and time always agree. Each entry is a row with a 1px
  border.subtle line above it (none above a day's first): at the start a 26px **actor marker** —
  a person's PersonAvatar 'sm' (nothing else marks a human), the Bot square for an agent (and
  AgentMark after its name), a neutral Settings2 icon for the system and a Plug for an integration
  (SEF, a bank import), both on surface.sunken and named "System" / "Integration"
  (`role="img"`); then the name (sm semibold), the time (xs text.tertiary, tabular), the
  application's sentence (sm), each changed field as "label old → new" (label and old value
  text.secondary, the new value text.primary medium, both isolated (`bdi`) and exactly as the
  application gives them; an arrow that mirrors in right-to-left; "Before:" / "After:" for
  assistive technology; an emptied field shows "—"), and "On behalf of <name>" (xs
  text.secondary). **Paging from the application:** `hasMore` shows "Show more" (a neutral
  button) under the list, `onLoadMore` asks for older entries, `loading` shows skeleton rows on
  the first page and a small spinner in place of the button after it. Empty: EmptyState compact
  ("No changes yet"). The day grouping is `components/day-groups.ts` (`groupByDayOf`, newest or
  oldest first; tested), shared with MessageList.
  - **Which one (for the integrator's single rule):** HistoryList = the whole history of a record,
    on its page (a section); ActivityList (P4.9) = the latest two or three entries (or comments)
    in a side panel; StatusTimeline (group B, P5.4) = the states of one process with its next
    step; LifecycleBar (P4.5) = the dots of a document's lifecycle above it; MessageThread = a
    conversation.
  - **Messages:** `history.system`, `history.integration`, `history.onBehalfOf(name)`,
    `history.before`, `history.after`, `history.showMore`, `history.emptyTitle`,
    `history.emptyDescription`. The day headings reuse `notifications.today` /
    `notifications.yesterday` (one text, not two; a rename to a neutral `day.*` key is the
    integrator's choice).
- **2026-10-08 — The Message family (P5.1).** For comments on a record and task conversations,
  on Bubble, Marker, Message and Message Scroller.
  1. **MessageBubble:** the author (PersonAvatar 'sm' and the name sm semibold; an agent's Bot
     square and AgentMark), the time (`format.time(at)`, or the application's `time`), the text in
     a Bubble (`whitespace-pre-wrap`, so Shift+Enter's line breaks show), an optional `extra`
     inside the bubble under the text (a questionnaire, files). **Own and others' messages differ
     by side and surface, never colour:** others at the start on the raised surface with a border,
     the user's own at the end on surface.sunken without avatar and name ("You" for assistive
     technology, `message.you`). `status` 'sending' shows a small spinner with "Sending…";
     'failed' shows "Not sent" in status.danger.fg with an icon (`role="alert"`) and a Retry link
     button (`onRetry`).
  2. **MessageList:** the messages **oldest first**, as a conversation reads, on Message Scroller
     (opens at the latest, follows the end while the reader is there, keeps the reader's place
     otherwise). A **day separator** (a Marker between lines: Today, Yesterday, the date) starts
     each day. **Runs:** messages of one author within 5 minutes on the same day (`startsRun`,
     `RUN_MINUTES`, tested) show only their bubbles under one header, 4px apart (12px between
     runs); the author stays named for assistive technology. **"Jump to latest"** appears at the
     bottom while the reader is away from the end; when messages arrived meanwhile it says "2 new
     messages" (`message.newMessages(count, text)`, the count through `format.number`). The user's
     own new message scrolls the list to the end. The list's height is its container's
     (`className`). Empty: EmptyState compact ("No messages yet"); loading: skeleton rows.
     `ThreadMessage.element` lets the application draw a whole message itself — an AgentQuestion.
  3. **MessageComposer:** a MentionCombobox (label for assistive technology only) and a toolbar:
     the application's `tools` at the start (attach), the hint "Enter sends, Shift+Enter starts a
     new line" (xs text.tertiary), Send at the end — the primary family in the light weight, so the
     page keeps its one filled button (D13). **Enter sends, Shift+Enter breaks the line**, Enter
     while the mention list is open chooses the person, an IME composition is never sent.
     `onSend({ text, mentions })` may return a promise: the text stays as sent (typing waits, the
     field keeps its look and focus), the hint becomes a spinner with "Sending…", and the text is
     cleared when it resolves (kept when it rejects). Disabled with a visible reason; `error`;
     `attachments` is a slot above the toolbar (for group B's AttachmentList).
  4. **MessageThread:** the list (taking the room) and the composer under it, 12px apart.
  - **ActivityList stays** (decided here): the compact side-panel list of the latest entries; it
    is not a conversation. In the example, the side panel "Latest activity" keeps ActivityList
    while the page's Comments and History sections use MessageThread and HistoryList.
  - **Messages:** `message.you`, `message.send`, `message.sending`, `message.sendHint`,
    `message.failed`, `message.retry`, `message.jumpToLatest`, `message.newMessages(count, text)`,
    `message.emptyTitle`, `message.emptyDescription`.
- **2026-10-08 — MentionCombobox (P5.1).** A multi-line text field in which "@" offers people:
  candidates from the application (all of them, filtered by name ignoring case and accents as
  ComboboxField; or its own search with `onSearch` after 300ms and `loading`, as ComboboxField).
  A mention starts at an "@" at the start or after a space (not inside an e-mail address) and
  reads up to 40 characters with at most two spaces (`mentionQueryAt`, tested). Choosing writes
  "@Name " as **one token: Backspace right after it removes the whole name** (`tokenBefore`); the
  mentions still in the text, with their ids, are reported on every change
  (`onMentionsChange`, `mentionsInText`), so the application never parses names. **WAI-ARIA:** the
  combobox pattern on a text area — the focus stays in the text, the shared ComboboxPopover list
  (a press never takes the focus), `aria-activedescendant`, `aria-autocomplete="list"`,
  `aria-controls` while open; **no `role="combobox"`, which a `<textarea>` may not carry (ARIA in
  HTML)**. Keys while open: ArrowDown / ArrowUp (wrapping), Home / End, Enter or Tab chooses,
  Escape closes until the next "@". Options: the 26px avatar (Bot square for an agent), the name
  and the application's line; the highlighted option the brand fill (the highlighted option in a
  list stays blue, D17). The text area grows with its content (`field-sizing: content`) from 60px
  to 160px. `MentionText` draws a message's text with its mentions semibold (`splitMentions`,
  longer names first; tested). **Messages:** `mention.list`.
- **2026-10-08 — Questionnaire (P5.1, owner 2026-10-07: a general step-by-step question
  component).** On the shadcn Questionnaire primitive (each question a fieldset named by its
  legend, the choices real radio buttons and checkboxes, the number keys, the focus moving to the
  question whose turn it is). Questions as data (`QuestionDefinition`: id, title, description,
  type, options, required (default true), next, currency, decimals, placeholder, otherLabel,
  fieldLabel); the logic in `questionnaire-logic.ts` (tested).
  1. **Branching (declarative):** a question's `next` names the next question, `null` ends, left
     out the next in the list follows; an option's `next` wins over its question's; for several
     choices the first chosen option (in the options' order) that names one. The path is
     recomputed from the answers; a loop or an unknown id ends it.
  2. **Answer types:** single choice, multiple choice, date (DateField), number (NumberField),
     amount (MoneyField), short text (TextField), and "Other" with its own text on any choice
     (`other: true`; its text field appears under the options and takes the focus; required while
     chosen). Typed answers use the fields hidden-labelled (the legend shows the question; their
     label, `fieldLabel ?? title`, names them).
  3. **Back keeps every answer. The rule:** answers on a branch no longer taken are kept in the
     component's state and come back when the user returns to that branch, but **only the answers
     of the questions on the current path are submitted** (`answersOnPath`).
  4. **Summary** (`summary`, default true): "Check your answers" (h2, `headingLevel`), every
     question on the path with its answer in a one-column KeyValueList (answers formatted by the
     provider: `format.date`, `format.number`, `format.money`; several choices joined with
     `text.join`; an optional question left empty "Not answered"), each with the 28px pencil of
     ChangeableValue ("Change <question>", `value.change`). After a change, Next returns to the
     summary — **unless the change opened questions on the path that have no answer: those are
     asked first.** The summary takes the focus when it opens. The final button is the
     application's (`submitLabel`, `submitIcon`), filled; `onSubmit` may return a promise
     (spinner, buttons wait), or `submitting`. Without a summary the last question's button
     submits (an agent's short question).
  5. **Progress:** "3 of 7 answered" — answered questions on the current path (so it can go down
     when a branch adds questions), both numbers through `format.number` — above a ProgressBar;
     `progress={false}` for a single question.
  6. **Keyboard:** Enter goes on (not on a button, which presses itself; a typed date or number is
     read by its own field on that Enter first, and its new value is used); the number keys 1–9
     choose options while the focus is not in a typing field (the key is shown at the end of each
     option); radio buttons move with the arrows natively, checkboxes by the primitive.
  7. **Required and the application's checks:** a required question without an answer
     ("Answer this question to go on."), an "Other" without its text ("Write your own answer to go
     on."), then `validate(question, answer, answers)` returns the application's own message. The
     error shows after Next, under the choices (the primitive's error, the fieldset
     `aria-invalid`) or under the field, and the focus goes to the answer.
  8. Buttons: Back (the back intent, light) at the start, hidden on the first question; the main
     action last at the end: Next (the next intent, filled), "Review answers" before the summary,
     the application's label without a summary.
  - **When to use which:** Questionnaire for a guided path whose next question depends on the
    answer; FormWizard (P3.5) for a long multi-step form whose fields are known; FormSection for
    an ordinary form.
  - **Messages:** `questionnaire.next`, `questionnaire.back`, `questionnaire.review`,
    `questionnaire.submit`, `questionnaire.progress(answered, answeredText, total, totalText)`,
    `questionnaire.progressLabel`, `questionnaire.summaryTitle`, `questionnaire.notAnswered`,
    `questionnaire.required`, `questionnaire.otherRequired`, and `text.join(items)` (a list of
    labels or names on one line; English: ", ").
- **2026-10-08 — PresenceAvatars and AgentMark (P5.2).**
  - **AgentMark:** one marker after every name that belongs to an agent: lucide's Bot at 14px in
    text.secondary, **neutral, never blue** (an agent is not an action), the word
    `messages['agent.mark']` ("Agent") for assistive technology and in a tooltip on hover;
    `showLabel` writes the word beside the icon (xs medium) where it must be read without
    hovering. An agent's avatar, wherever one is shown, is the Bot icon on the neutral 26px
    square, never initials. Where only text can carry it (an accessible name), the name becomes
    "Liro agent (agent)" (`agent.named`).
  - **PresenceAvatars:** who else has the record open (the application's data; the component never
    polls): up to `max` avatars (default 3), **4px apart, not overlapping** — an overlap needs a
    ring in the colour of the surface behind the row, which the component cannot know without a
    colour value — then "+N" (`presence.more(count, text)`, the count through `format.number`) on
    the same neutral square; "+1" is never shown (the last avatar takes its place). The row is one
    button (target 28px): its accessible name and tooltip name everyone ("Also here: Dragan Ilić,
    Liro agent (agent)", `presence.here(names)` with `text.join`); pressing it (touch, click,
    Enter) opens a popover "Who is here" listing each person with the application's line
    ("Viewing", "Editing") and AgentMark. Nothing for an empty list.
  - **Messages:** `agent.mark`, `agent.named(name)`, `presence.here(names)`,
    `presence.more(count, text)`, `presence.list`.
- **2026-10-08 — AgentQuestion (P5.3's agent sentence).** An agent asking the user something it
  cannot decide: MessageBubble with the agent's name, AgentMark and time, its question as the text,
  and the way to answer inside the bubble (`children`: a Questionnaire — one question with
  `summary={false}` and `progress={false}` for a short answer — or a short form); once answered,
  `answer` replaces the form with the decision as text, so the conversation keeps it. A group named
  "Question from <agent>" (`agent.question`). It is content: the application opens it in a Popover
  (the shell's agent button), a Drawer, or a MessageThread (`ThreadMessage.element`). **The shell
  has no agent slot yet** (AppShell is group B's): see Needs. **Messages:** `agent.question(name)`.
- **2026-10-08 — Example screens of group A (P5.1, P5.2).** "Examples / Invoice with history,
  comments and presence" (`/sales/invoices/F-2026-0410`; also reached from the invoice list's
  preview): F-2026-0410 to Medic Lab Niš d.o.o. as a DocumentPage — four lines (S 20% tiles,
  adhesive, silicone; S 10% printed manuals) whose amounts, bases, VAT and total are computed in
  `data-A.ts` in whole paras and checked against the dataset (186.420,35 RSD, 100.000,00 paid on
  02.10.2026., 86.420,35 due; the module throws if they disagree); PresenceAvatars in the header
  (Dragan Ilić, Liro agent); Comments as a MessageThread in which the Liro agent asks for the
  payment date with an AgentQuestion (answering adds the agent's reply and a history entry);
  History as a HistoryList (created and issued by Dragan, delivered by SEF, the payment booked by
  the Banca Intesa import, a system reminder, the agent on behalf of Milica, Ivana's change of
  the payment reference; "Show more" loads the first entry); side panels Delivery, Related
  documents (order N-2026-0149, bank statement 187) and Latest activity (ActivityList).
  "Examples / Employment contract questionnaire" (`/hr/contracts/new`): Stefan Nikolić's contract
  — employee (or someone else), position (choice + Other), indefinite / fixed (end date and
  reason), start date, office / remote / hybrid (office days), probation (months), full / part
  time (hours), gross salary (RSD), annual leave days; the application's checks (start and end
  after today, leave at least 20 days — illustrative); "Generate contract" goes to
  `/hr/contracts/RU-2026-017/signing` (group C's screen). Desktop and phone stories; the play
  functions check the figures, the agent's question, a comment with a mention, the history paging
  and the whole questionnaire path from the keyboard. Choices made: 3 office days a week, 22
  annual leave days (not in the shared facts).

## 2. AGENTS.md rows (components table)

| Name                                                                                                                                                                 | Kind      | Step | Note                                                                                                                                                                                                                                          |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- | ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `HistoryList`, `HistoryEntry`, `HistoryActor`, `HistoryChange`, `ActorKind`                                                                                          | Component | P5.1 | A record's full history, newest first, grouped by day; actor markers (avatar; Bot + AgentMark; neutral icons for system and integration), old → new values, "On behalf of"; paging from the application (`hasMore`, `onLoadMore`, `loading`). |
| `MessageBubble`, `MessageList`, `MessageThread`, `MessageComposer`, `MentionText`, `ThreadMessage`, `MessageAuthor`, `ComposedMessage`                               | Component | P5.1 | On shadcn Bubble, Marker, Message, Message Scroller: no blue bubbles (side + surface), runs of one author, day separators, "Jump to latest" / "N new messages", Enter sends, Shift+Enter breaks; sending and failed states.                   |
| `MentionCombobox`, `MentionCandidate`, `Mention`, `mentionsInText`, `splitMentions`                                                                                  | Component | P5.1 | "@" offers people (local filter or `onSearch` with `loading`); a mention is one token (Backspace removes it); mentions reported with ids; combobox pattern on a text area without `role`.                                                     |
| `Questionnaire`, `QuestionDefinition`, `QuestionOption`, `QuestionAnswer(s)`, `QuestionType`, `QuestionnaireStep`, `questionPath`, `nextQuestionId`, `answersOnPath` | Component | P5.1 | On shadcn Questionnaire: declarative branching, single/multiple/date/number/amount/text and "Other"; Back keeps answers (off-path answers kept, not submitted); summary with change; progress "3 of 7 answered"; Enter and number keys.       |
| `PresenceAvatars`, `PresencePerson`                                                                                                                                  | Component | P5.2 | Who else is here: up to `max` avatars, "+N", names in the button's name and tooltip, a list on press; agents marked.                                                                                                                          |
| `AgentMark`                                                                                                                                                          | Component | P5.2 | The one machine marker after an agent's name: Bot icon, neutral, "Agent" for assistive technology and tooltip; `showLabel`.                                                                                                                   |
| `AgentQuestion`                                                                                                                                                      | Component | P5.3 | An agent asking: its bubble with a Questionnaire or short form inside, the answer kept as text; opened by the application in a Popover, Drawer or thread.                                                                                     |
| Examples group A (`apps/storybook/src/examples/screens-A.tsx`)                                                                                                       | Example   | P5.1 | Invoice F-2026-0410 with presence, comments (agent question) and history; employment contract questionnaire.                                                                                                                                  |

## 3. BUILD-PLAN status notes

- P5.1 — done (group A): HistoryList, Message family, MentionCombobox, Questionnaire on the shadcn
  primitives (Bubble, Marker, Message, Message Scroller, Questionnaire; `@shadcn/react` 0.3.1);
  examples F-2026-0410 and the employment contract questionnaire.
- P5.2 — done (group A): PresenceAvatars, AgentMark.
- P5.3 — agent part done (group A): AgentQuestion; the shell's agent slot is a need for AppShell
  (group B / integrator).

## 4. Needs

1. **AppShell (group B / integrator): an agent slot in the header.** P5.3 places agent
   interactions in the shell. Proposed: `agent?: ReactNode` in AppShell's end group before the
   notifications bell — the application passes a subtle 36px IconButton (Bot, named e.g. "Liro
   agent, 1 question") that opens a Popover with AgentQuestion (story "AgentQuestion / In a
   popover" shows the content). Not done: app-shell.tsx is group B's.
2. **`package.json` / `pnpm-lock.yaml`:** `@shadcn/react` 0.3.1 added to `packages/ui`
   dependencies (`pnpm --filter @veljaos/ui add @shadcn/react@0.3.1`); the lockfile hunk may
   conflict with other groups' additions — regenerate with `pnpm install` after merging.
3. **decisions.md "Versions" table:** add `@shadcn/react | 0.3.1 | Runtime dependency of
@veljaos/ui: the unstyled Message Scroller and Questionnaire under the shadcn/ui primitives
(P5.1). MIT, no dependencies.`
4. **AttachmentList (group B):** MessageComposer's `attachments` slot is where it goes for a
   comment's files; nothing to wire now.
5. Day headings reuse `notifications.today` / `notifications.yesterday` (HistoryList,
   MessageList); the integrator may rename them to neutral keys.
6. **Storybook story-data exclusion:** `collaboration-story-data.ts` follows the `*-story-data.ts`
   name, so its (absent) classes stay out of the package CSS; nothing to change.

## 5. Third-party code

- Copied and adapted from shadcn/ui (MIT, already in THIRD-PARTY-NOTICES.md as "shadcn/ui"):
  `packages/ui/src/primitives/bubble.tsx`, `marker.tsx`, `message.tsx`,
  `message-scroller.tsx`, `questionnaire.tsx`, from
  `https://ui.shadcn.com/r/styles/radix-vega/{bubble,marker,message,message-scroller,questionnaire}.json`
  (fetched 2026-10-08). Add these files to the list of shadcn/ui files in the notice if it lists
  them.
- New dependency `@shadcn/react` 0.3.1 (MIT, © shadcn, https://github.com/shadcn-ui/ui,
  `packages/react`): its LICENSE.md is the standard MIT text ("Copyright (c) 2023 shadcn");
  THIRD-PARTY-NOTICES.md needs an entry for it as a runtime dependency of `@veljaos/ui` (the
  packed tarball's notices include it).

## 6. Verification

Run on Windows (the owner's machine), on this branch, with other groups' builds running in
parallel:

- `npx pnpm@12.6.0 lint` — pass (`eslint . --max-warnings 0`).
- `npx pnpm@12.6.0 typecheck` — pass.
- `npx pnpm@12.6.0 test` — pass (ui 543 tests in 47 files, among them the new
  `questionnaire-logic.test.ts` and `message-logic.test.ts`; tokens 45; eslint-config 40). One
  earlier run under heavy load failed the existing timing test "searches 5,000 companies quickly"
  (app-shell.test.tsx, not group A's); it passes when the machine is not saturated.
- `npx pnpm@12.6.0 build` — pass. `npx pnpm@12.6.0 consumer-check` — pass (with `@shadcn/react`
  installed from the packed tarball's dependencies).
- `npx storybook build` (build-storybook) — pass.
- Story tests and axe, all four modes, port 6101 (`playwright.local.config.mjs`, not committed):
  `tests/stories.spec.ts tests/accessibility.spec.ts -g "Collaboration|Primitives/Messages|
Primitives/Questionnaire|Examples / Invoice with history|Examples / Employment contract"` — 472
  tests; all pass after two fixes to play functions (waiting for overlay animations; counts of
  the contract path); the example stories re-run: 32 passed. `tests/stories.spec.ts -g "Examples /"`
  (every example, to check the route registry did not disturb the others) — 107 passed, 1 timed
  out under load ("Invoice list [dark-ltr]", waiting for fonts) and passed when re-run alone.
- Not verified: visual baselines (made on CI only); Firefox and Safari (the story tests run
  Chromium).
