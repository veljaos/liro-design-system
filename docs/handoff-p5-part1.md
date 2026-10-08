# Handoff — Phase 5 part 1 (stopped 2026-10-08 at the owner's request)

Work stopped after merging every group. Nothing is pushed, no pull request is open. This note is
for the session that continues; delete it in the final pull request.

## Where things are

- **Integration branch:** `bp/P5-part1-liro-patterns` in the main checkout
  (`C:\Users\Veljko\Desktop\liro-design-system`), 34 commits on `main` (`badb97a`), local only.
  Scaffold commit `eb37070` (examples moved to `apps/storybook/src/examples/`, route registry,
  `components/line-types.ts`, the owner's two leftovers: two-line "Switch company" menu item with
  `MenuEntry.value`, SettlingValue test driven by `page.clock` with the story delay back at 1.2 s).
- **Group branches (all merged into the integration branch, worktrees clean):**

  | Group | Steps                                 | Branch           | Head    | Worktree                                             |
  | ----- | ------------------------------------- | ---------------- | ------- | ---------------------------------------------------- |
  | A     | P5.1, P5.2, agents                    | `bp/P5-group-A`  | 527d724 | `.claude/worktrees/agent-ab51e7f9e10bf7266`          |
  | B     | P5.3, P5.4, P5.5                      | `bp/P5-group-B`  | e1a4795 | `.claude/worktrees/agent-a69611313d457f29c` (locked) |
  | C     | P5.6, P5.7, P5.21 users/setup/signing | `bp/P5-group-C`  | 296459f | `.claude/worktrees/agent-a975cb17dd657e923`          |
  | D1    | P5.18 lines, P5.19 LookupField        | `bp/P5-group-D1` | fa95757 | `.claude/worktrees/agent-ab8bdea7103b3b6e7`          |
  | D2    | P5.18 documents                       | `bp/P5-group-D2` | e5134e9 | `.claude/worktrees/agent-a4878bc1748a23b9a`          |
  | E     | P5.19, P5.20                          | `bp/P5-group-E`  | 6f21e25 | `.claude/worktrees/agent-a17393da77c985b02`          |
  | F     | P5.21 matching, journal, run          | `bp/P5-group-F`  | 89eb3d0 | `.claude/worktrees/agent-aed373ff4eef6b57c`          |

  Each worktree also has `worktree-agent-*` branches from the harness. All of these are local;
  remove the worktrees (`git worktree remove`) and delete the branches (`git branch -D`) once the
  pull request is merged (W16).

- **The groups' notes** (decisions.md entries, AGENTS.md rows, status lines, needs, measurements):
  `docs/p5-notes/group-{A,B,C,D1,D2,E,F}.md`. The briefs they worked from are in this session's
  scratchpad (not in the repository): common rules, shared example facts, group briefs.

## Done since the merges (by the integrator)

- Merge conflicts were all append blocks (`index.ts`, `messages.ts`, `messages.en.ts`,
  `example-app.tsx`, `examples.stories.tsx`); the key list in `provider-p15.test.tsx` is sorted
  (481 keys). Name clash fixed: E's `lookupKeyTarget` → `lookupDialogKeyTarget`; one `SERBIAN`
  format in `examples.stories.tsx` (group F's block).
- **Owner's notes of 2026-10-08:**
  - Provider marks moved out of `@veljaos/tokens` (tokens only) into
    `packages/ui/src/components/provider-marks.tsx`, drawn by ProviderSignInButtons for
    `mark: 'microsoft' | 'google'`; one rule exception (`liro/no-raw-colors` off for that file)
    in `eslint.config.mjs` — a protected file. `brand.test.ts` is back to `main`.
  - `@shadcn/react` is pinned exactly at **0.3.1** (MIT, pre-1.0; added by group A for the
    shadcn Message Scroller and Questionnaire) — still to record in decisions.md "Versions" and
    THIRD-PARTY-NOTICES.md.
- Verified after the last merge: `tsc` for packages/ui and apps/storybook, `vitest` packages/ui
  (703 tests), eslint on the examples and the touched files. NOT yet run on the merged branch:
  full `pnpm lint`, `pnpm test`, `format:check`, `build`, `consumer-check`, `build-storybook`,
  story / accessibility tests.

## What is left

1. **Cross-group wiring** (marked `// INTEGRATION:` in the code; `grep -rn "INTEGRATION:"`):
   AttachmentList (B) into F-2026-0418 (D2, "Send with the e-invoice" via `extra`) and both
   signing screens (C); DocumentFrame (B) as C's signing preview (B's stories have a viewer with
   `allowedOrigin="null"`); FileDropzone and JobProgress (B) into E's ImportWizard and F's
   PeriodicRunPage; StatusTimeline (B) into an invoice's delivery panel; LookupField (D1)
   `onSearchAll` → LookupDialog (E) in E's customers screen and D1's draft invoice; A's request
   for an AppShell `agent` slot (additive, AppShell is B's); one `specificationOf()` (D1 and D2
   each have one — keep D1's, which includes headings and subtotals); D2's F-2026-0410 lines
   reused by A's F-2026-0410 screen (with a "Corrected by KO-2026-0009" reference; after the
   decrease the total is 167.762,75 and open 67.762,75); F-2026-0407 is cancelled in D2's
   examples but still "Overdue" in `INVOICES` and in the overview's overdue sum (152.940,00) —
   make it "Cancelled" (tone) and fix the overview figures; C's `CompanyShell` copy → a
   `company` prop on the examples' `Shell`; StatusTimeline's copied LifecycleBar dot → export it;
   duplicated whole-paras helpers in story data → one.
2. **Windowing (owner):** the 5,000-entry register (E) and the 50,000-record catalogue (E) are not
   responsive enough (up to 3.4 s per scroll at 4× CPU slowdown). Use the same row windowing as
   the EditableGrid (D1's row window: `editable-grid-window.ts`, rows in view plus 600px, the
   focused row kept, `aria-rowcount`/`aria-rowindex`) — one shared virtualisation approach — and
   re-measure both, recording numbers. Also: `rowOffsets`/`visibleRows`/`scrollToShow` live in
   `templates/company-logic.ts` but components import them — move to a neutral module;
   `format.money` builds an `Intl.NumberFormat` per call (cache per currency, D1's measurement:
   ~9% of a 300-amount render).
3. **One pattern per problem:** write the "which one" rule (HistoryList full history /
   ActivityList compact panel / StatusTimeline process states with next step / LifecycleBar
   document lifecycle); the busy-button look copied in EmailFirstForm, ProviderSignInButtons and
   SignerList → one shared loading button; HistoryList/MessageList reuse `notifications.today` /
   `.yesterday` → neutral keys; `LineType` and friends exported once.
4. **Walk-through:** wire the new screens into the examples (home modules Banking, Accounting,
   Payroll, Tasks; HR tabs Contracts/Safety/Payroll; Sales tab Customers; notification n6 to
   `/banking/statements/188`; settings → users; the questionnaire → signing link), extend the
   "Walk-through" story and the examples' description. New routes: A `/sales/invoices/F-2026-0410`,
   `/hr/contracts/new`; C `/settings/users`, `/setup`, `/hr/contracts/RU-2026-017/signing`,
   `/sign/RU-2026-017`, `/tasks`; D1 `/sales/invoices/new`,
   `/projects/IS-2026-007/specification`; D2 `/sales/invoices/F-2026-0418`, `/projects/IS-2026-007`,
   `/sales/invoices/F-2026-0415`, `/sales/corrections/KO-2026-0009`, `/sales/invoices/F-2026-0407`,
   `/sales/invoices/ST-2026-0004`; E `/sales/customers` (+ import), `/accounting/vat-return/2026-09`,
   `/hr/safety/injury-register/2026` (+ 5,000 stress); F `/banking/statements/188`,
   `/accounting/journal/NK-2026-0912` (+ `?stage=unbalanced`), `/hr/payroll/2026-09`.
5. **Full checks:** lint, typecheck, test, format, build, consumer-check, build-storybook; story
   and accessibility tests for every story in four modes (locally in parts; the committed
   Playwright config uses port 6006); the owner's final self-check of every example (old and new)
   in light, dark, RTL and 360px against the quality checklist; keyboard tests on every new
   component; large-data responsiveness (catalogue 50,000, specification 300, register 5,000).
6. **Docs:** decisions.md (a Phase 5 part 1 section from the seven notes, the rules above,
   `@shadcn/react` in "Versions", provider marks, the windowing rule), AGENTS.md (component rows;
   D18 note: Liro's logo through props, the providers' sign-in marks drawn by
   ProviderSignInButtons), BUILD-PLAN status rows P5.1–P5.7 and P5.18–P5.21,
   THIRD-PARTY-NOTICES.md (the five shadcn files of group A, `@shadcn/react` MIT, Microsoft and
   Google trademark note), `docs/document-frame.md` (B, already written), a changeset; delete
   `docs/p5-notes/` and this file.
7. **Pull request:** push the integration branch, baselines via the `Baselines` workflow
   (`[baselines]` commit), review and commit them, CI green. It touches protected files
   (`apps/storybook/tests/settling-value.spec.ts`, `eslint.config.mjs`), so it needs the section
   `## Protected file changes` and **no auto-merge** — the owner merges it.
8. **TanStack Virtual PR** (separate, after part 1; protected because `eslint.config.mjs` needs
   the `react-hooks/incompatible-library` exception per file): replace the custom virtual lists
   (company switcher, LookupField, MatchingView, the EditableGrid row window if it uses the same
   helpers) with `@tanstack/react-virtual` 3.14.13 (already a dependency); the owner merges it.

## Open problems reported by the groups

- Local Playwright runs time out under load when several suites run at once; re-runs with
  `--workers=2` pass (E, F, A).
- StatusTimeline times use `format.dateTime` (device zone): CI baselines will show UTC.
- LookupDialog: opening another modal at the moment it closes fails (the second closes); the E
  example works around it.
- Radix Select renders all items while closed (costly in long grids; hidden by the row window).
- Links to records no screen provides (PR-2026-031, A-2026-038, contract 12/2026, IS-2026-006,
  F-2026-0411) open the 404 screen.
- No visual baselines exist yet for any new story.
