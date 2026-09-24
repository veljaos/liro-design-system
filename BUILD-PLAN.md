# BUILD-PLAN — Liro Design System 2.0, from zero

**For:** the coding agent (Claude Code) building `liro-design-system` from an empty folder.
**Owner:** Veljko Stanojević. Not an engineer — see rule 9.
**What this is:** the complete work order for building the Design System. It states what the system is, the decisions already taken, the order of work, and how to know each step is done. The appendices hold everything worth keeping from the previous Design System, whose repository no longer exists.

---

## 1. What we are building

**One sentence:** the shared look, components and screen templates of every Liro application, so that every screen in every module looks and behaves the same.

**The model** is Carbon (IBM) and SAP's UI5 controls, not an application framework:

- The Design System is **independent of any backend.** It knows nothing about Liro Business Core, tenants, permissions, APIs, manifests, translations or document types. It receives everything it shows through props and one provider.
- **Liro Business Core adapts to it**, through an adapter layer that lives in `liro-core`, not here. That adapter turns the Core's descriptors into props, plugs in the Core's translations and formatting, and passes permission answers as "disabled, because …". The Design System never waits for the Core.
- It is **small on purpose.** Bricks (components) and templates (screen layouts), with Liro's look. Whole flows — sign-in, onboarding, data-subject requests, agent confirmation — are built in `liro-core` **from** these bricks.

### What the Design System never does

1. Calls an API, reads a cookie, or knows a URL of a backend.
2. Translates. It shows the text it is given; its own few strings ("Next", "Rows per page") come from the provider with English defaults.
3. Decides permissions. It shows what it is told: hidden, read-only, or disabled with a reason.
4. Computes money. Amounts arrive as decimal strings and totals arrive already computed; the Design System displays them and never adds, rounds or converts them to a JavaScript `number`.
5. Knows a business domain. No "invoice", "post", "storno", "PIB" or "VAT" inside components. Examples in Storybook may use them as fictitious data.
6. Hard-codes colours, a language or a direction.

---

## 2. Decisions already taken

| Topic | Decision |
|---|---|
| Foundation | **shadcn/ui** (Radix primitives + Tailwind CSS), code copied into this repository and owned by it |
| Tables | **TanStack Table** + **TanStack Virtual** |
| Catalogue and playground | **Storybook**, English only, small |
| Look | Kept from the previous Design System: token values are carried over **1:1** (Appendix A). Refreshing later is a change in one place. |
| Tokens | **Three layers.** Values (open, change freely) → meanings (closed vocabulary, change rarely and deliberately) → components (choose a meaning, never a colour). |
| Colour by purpose | Buttons choose an **intent** or a **family** (Appendix A.6), never a colour or a variant. Blue means confirm, red means destructive, everywhere. |
| Layout freedom | Screens and components may set layout freely (width, alignment, spacing to neighbours) with Tailwind. **Raw colours are forbidden** (`bg-red-500`, `text-[#…]`); only semantic names (`bg-destructive`). Lint enforces it. |
| Backend | None. One provider (section 5) carries language, direction, texts, formatting and "today". |
| Languages | Every component works left-to-right and right-to-left, and with Latin, Cyrillic, Greek, Arabic, Hebrew, Chinese and Japanese text. |
| Accessibility | WCAG 2.2 AA, automated and manual, zero allowed exceptions. |
| Devices | Mobile-first, installable web app (PWA) friendly, one-hand use on phones. |
| Version | Packages start at **2.0.0**. An old `@liro/*` 1.0.0 was published before; the numbers must not collide. |
| Language of everything technical | English. Reports to the owner in Serbian. |

---

## 3. Technology

Pin every dependency to an **exact** version (no `^`, no `~`). At setup, take the latest **stable** release of each and record the versions in `docs/decisions.md`.

| Concern | Choice |
|---|---|
| Runtime | Node.js 24 LTS |
| Package manager | pnpm, workspace |
| Language | TypeScript, `strict`, exact version — if `liro-core` already pins one, use the same |
| UI | React 19 |
| Styling | Tailwind CSS v4, CSS variables for all tokens |
| Primitives | shadcn/ui components (Radix), copied into `packages/ui/src/primitives/` |
| Icons | lucide-react |
| Table | @tanstack/react-table, @tanstack/react-virtual |
| Calendar | react-day-picker (shadcn Calendar), month and weekday names supplied by the provider's `format`, never by bundled locale files |
| Command palette | cmdk (shadcn Command) |
| Toasts | sonner (shadcn) |
| Charts | Recharts through shadcn Chart |
| Forms | Presentational fields in `@liro/ui`; an optional React Hook Form binding in `@liro/ui/form`. No validation library inside the Design System. |
| Library build | tsup (JavaScript + type declarations) and the Tailwind CLI (CSS) |
| Catalogue | Storybook (React + Vite), with the accessibility addon and a toolbar of globals |
| Tests | Vitest (logic), Storybook test runner / Vitest addon (stories), Playwright + axe-core (accessibility and visual), in a pinned Linux Docker image |
| Releases | Changesets, GitHub Packages |

### Repository layout

```
liro-design-system/
├── AGENTS.md                 rules for every agent (written in P0.5)
├── BUILD-PLAN.md             this file
├── docs/
│   └── decisions.md          why things are as they are (seeded from Appendix B)
├── packages/
│   ├── tokens/               @liro/tokens — CSS variables (light, dark), Tailwind theme, tokens.json, fonts
│   ├── ui/                   @liro/ui — provider, components, templates
│   │   └── src/
│   │       ├── primitives/   shadcn copies, adapted; NOT exported
│   │       ├── components/   the Liro API
│   │       ├── templates/    screen templates
│   │       ├── provider/     LiroProvider, messages, format
│   │       └── form/         optional React Hook Form binding (subpath export)
│   └── eslint-config/        @liro/eslint-config — the rules, shipped to consumers
└── apps/
    ├── storybook/            the catalogue and playground
    └── consumer-check/       a plain Vite + React app that installs the built packages like a consumer
```

**Primitives are private.** `packages/ui/src/primitives/` holds shadcn code adapted to Liro tokens. Only `components/` and `templates/` are exported. Consumers (`liro-core`) import `@liro/ui` only — never Radix, never a primitive. Lint enforces it.

### How consumers use it

- `import '@liro/tokens/tokens.css'` and `import '@liro/ui/styles.css'` — **precompiled CSS**, so a consumer does not need Tailwind to use the components.
- A consumer that uses Tailwind for its own layout imports `@liro/tokens/theme.css` (Tailwind v4 `@theme`) to get the same semantic names.
- Wrap the application in `<LiroProvider>` (section 5).

---

## 4. How to work with this file

1. **Read first, every session:** this file, `AGENTS.md` (once it exists), `docs/decisions.md`.
2. **One step at a time.** Take the first step in the status table (section 7) whose status is `todo` and whose dependencies are `done`.
3. **One step = one branch = one pull request.** Branch `bp/<step-id>-<short-name>`; commits start with the step ID (`P2.3: add NumberField`).
4. **Done means every line of *Done when* passes in CI on Linux.** Run the checks; do not assume them.
5. **Update the status table** in the same pull request: status, date, one-line note.
6. **Split a step that is too large** into `P2.3a`, `P2.3b` …, add them to the table, finish them in order.
7. **Stop and ask** when a *Stop and ask if* condition occurs, when something is not covered here, or when a check fails for a reason you do not understand. Do not guess.
8. **English only** in code, identifiers, comments, commits, stories and documentation.
9. **Report to the owner in Serbian, in plain language,** at the end of every step: what was done, how to see it in Storybook, what is next, anything waiting for him. One line of explanation for any technical word.
10. **No silent guard changes.** A pull request that changes lint configuration, `tsconfig*`, CI, the Playwright or Storybook test configuration, or any accessibility setting must contain a section `## Protected file changes` with a reason per file; CI fails without it. The owner is told in the step report.
11. **Every prop must do something.** A prop that is accepted and ignored is a bug (Appendix B.9). Each prop is exercised by a story or a test.

---

## 5. The provider — how the Design System supports everything without a backend

One provider carries everything that differs between applications, languages and customers. Every value has a sensible default, so the Design System works on its own and in Storybook; `liro-core` replaces the defaults with its own.

```ts
interface LiroProviderProps {
  /** BCP 47 tag, e.g. 'en', 'sr-Latn-RS', 'sr-Cyrl-RS', 'ar', 'ja'. Used for direction and formatting only. */
  locale: string
  /** Default: derived from `locale`. */
  direction?: 'ltr' | 'rtl'
  /** The Design System's own strings. English defaults for every key. */
  messages?: Partial<LiroMessages>
  /** Formatting and parsing. Intl-based defaults. */
  format?: Partial<LiroFormat>
  /** The date "today" as YYYY-MM-DD. Default: the browser's local date. The Core passes the tenant's date. */
  today?: string
  /** 0 = Sunday … 6 = Saturday. Default: from the locale. */
  weekStartsOn?: 0 | 1 | 2 | 3 | 4 | 5 | 6
  colorScheme?: 'light' | 'dark' | 'system'
  /** Router link component, so navigation stays client-side. Default: <a>. */
  linkComponent?: React.ElementType
  children: React.ReactNode
}
```

**`LiroMessages`** is a typed object of the Design System's own texts. Values are strings, or functions where the text depends on a value, so that the Core can supply its own plural and gender rules:

```ts
interface LiroMessages {
  'table.next': string
  'table.previous': string
  'table.count': (count: number, exact: boolean) => string   // "1,234 rows" / "More than 10,000 rows"
  'table.noRows': string
  'table.noMatch': string
  'field.required': string
  'field.readOnly': string
  'action.unavailable': (reason: string) => string
  'connection.offline': string
  // … every string a component shows on its own, and nothing else
}
```

All other text — labels, titles, errors, option names — comes in through props as ready strings or React nodes. **Components never contain user-visible text.** The English defaults live in one file, `packages/ui/src/provider/messages.en.ts`.

**`LiroFormat`** formats and parses numbers, money and dates:

```ts
interface LiroFormat {
  /** value is a decimal string, e.g. "1234.5". Never a JavaScript number. */
  number(value: string, options?: { decimals?: number }): string
  money(value: string, currency: string, options?: { decimals?: number }): string
  /** Accepts what people type: "1234.56", "1234,56", "1.234,56", "1,234.56", spaces, apostrophes. Returns a decimal string or null. */
  parseNumber(text: string): string | null
  /** value is YYYY-MM-DD. */
  date(value: string): string
  dateTime(isoInstant: string): string
  /** Accepts "010326", "1.3.2026", "01/03/2026" and the locale's own format. Returns YYYY-MM-DD or null. */
  parseDate(text: string): string | null
  monthName(month: number, style: 'long' | 'short'): string
  weekdayName(weekday: number, style: 'long' | 'short' | 'narrow'): string
  /** Separator scheme: 'dot-comma' (1.234,56), 'comma-dot' (1,234.56), 'space-comma', 'space-dot', 'apostrophe-dot'. */
  numberScheme: NumberScheme
  /** Default number of decimals for money. */
  moneyDecimals: number
}
```

**Money rules the defaults must obey:**
- Formatting works on the decimal string. It **never rounds and never truncates.** If the string has more digits than `decimals`, all are shown; if fewer, zeros are added. Rounding is the server's job.
- Parsing returns `null` for anything unreadable, never `0` (Appendix B.4).
- Amount and currency are joined by a non-breaking space; currency position follows the locale.

**Decimals are selectable** everywhere a number is shown or entered: the `decimals` option on `format`, the `decimals` prop on `NumberField`, `MoneyField`, `MoneyText` and table money columns. Storybook's toolbar sets the default.

---

## 6. Definition of done for every component

A component is finished only when all of these hold. Each step's *Done when* includes this list for every component it adds.

1. **Tokens only.** Semantic Tailwind classes or CSS variables; no raw colours, no hex values.
2. **Logical properties only.** `ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`, `text-start`; never `ml-`, `left-`, `text-left`. Lint enforces it. Drag and pointer logic measures from the leading edge (Appendix B.7).
3. **No text of its own** except provider `messages`; no formatting of its own except provider `format`.
4. **Stories:** default; every state it supports (disabled with reason, read-only, error, loading, empty); long text; phone width; one story with Arabic sample text and one with Japanese sample text.
5. **Accessibility:** axe with WCAG 2.2 AA tags passes in light and dark, left-to-right and right-to-left; operable by keyboard alone; visible focus never hidden under sticky elements; targets at least 24×24 CSS pixels; no interaction possible only by dragging.
6. **Visual baselines** on Linux for light/dark × ltr/rtl.
7. **Unit tests** for any logic (parsing, counting, keyboard handling).
8. **Every prop exercised** by a story or a test (rule 11).
9. **Exported** from `@liro/ui` and documented in its story: what it is for, when to use it, when not to.

---

## 7. Status table

Status: `todo`, `in progress`, `blocked (reason)`, `done`.

| Step | Title | Depends on | Status | Date | Note |
|---|---|---|---|---|---|
| P0.1 | Repository and toolchain | — | in progress | 2026-09-24 | Local install, lint, typecheck pass; waiting for a GitHub repository to run CI |
| P0.2 | Packages, build, consumer check | P0.1 | todo | | |
| P0.3 | Storybook with the toolbar | P0.2 | todo | | |
| P0.4 | CI on Linux: tests, accessibility, visual | P0.3 | todo | | |
| P0.5 | AGENTS.md and decisions.md | P0.4 | todo | | |
| P1.1 | Tokens: values, meanings, themes | P0.5 | todo | | |
| P1.2 | Typography and fonts for seven scripts | P1.1 | todo | | |
| P1.3 | Intents, families and Button | P1.1 | todo | | |
| P1.4 | Status tones and badges | P1.1 | todo | | |
| P1.5 | LiroProvider, messages and format | P0.5 | todo | | |
| P2.1 | Primitives adapted | P1.3 | todo | | |
| P2.2 | Field system and text inputs | P2.1, P1.5 | todo | | |
| P2.3 | Numbers, money and dates | P2.2 | todo | | |
| P2.4 | Overlays and confirmations | P2.1 | todo | | |
| P2.5 | Feedback | P2.1 | todo | | |
| P2.6 | Navigation pieces and command palette | P2.1 | todo | | |
| P2.7 | Actions | P1.3, P2.4 | todo | | |
| P2.8 | Display pieces | P2.3 | todo | | |
| P3.1 | DataTable core | P2.7, P2.8 | todo | | |
| P3.2 | Table on phones, large lists, column resize | P3.1 | todo | | |
| P3.3 | Filters and search | P3.1 | todo | | |
| P3.4 | Editable grid | P3.1, P2.3 | todo | | |
| P3.5 | Form layout | P2.2, P2.7 | todo | | |
| P4.1 | Application shell | P2.6, P2.7 | todo | | |
| P4.2 | Home (launchpad) | P4.1 | todo | | |
| P4.3 | List and worklist templates | P3.3, P4.1 | todo | | |
| P4.4 | Detail and record form templates | P3.5, P4.1 | todo | | |
| P4.5 | Document template | P3.4, P4.4 | todo | | |
| P4.6 | Report, dashboard and settings templates | P4.1 | todo | | |
| P4.7 | Status pages and sign-in shell | P4.1 | todo | | |
| P4.8 | Example screens | P4.2–P4.7 | todo | | |
| P5.1 | History, comments and messages | P2.8 | todo | | |
| P5.2 | Presence and agent marking | P2.8 | todo | | |
| P5.3 | Connection, environment and session markers | P4.1 | todo | | |
| P5.4 | Delivery and progress status | P2.8 | todo | | |
| P5.5 | Files and document frame | P2.5 | todo | | |
| P5.6 | Sign-in building blocks | P2.2 | todo | | |
| P5.7 | Kanban board | P2.8 | todo | | |
| P6.1 | Full language and direction matrix | Phases 1–5 | todo | | |
| P6.2 | Manual WCAG 2.2 checks | P6.1 | todo | | |
| P6.3 | Performance budget | P4.8 | todo | | |
| P6.4 | Documentation for consumers | P6.2 | todo | | |
| P6.5 | Release 2.0.0 | all | todo | | |

---

## Phase 0 — Setup (about 1–2 weeks)

### P0.1 — Repository and toolchain
**Do**
- pnpm workspace with the layout of section 3. Node 24 LTS in `engines`, `.nvmrc` and CI.
- TypeScript `strict`, `noUncheckedIndexedAccess`, exact version.
- ESLint flat config: `linterOptions.noInlineConfig: true`, `reportUnusedDisableDirectives: "error"`, `--max-warnings 0`; ban `@ts-ignore`, `@ts-nocheck`, `@ts-expect-error` outside test files; `eslint-plugin-jsx-a11y`; React hooks rules.
- Prettier with one shared configuration.

**Done when** `pnpm install`, `pnpm lint`, `pnpm typecheck` pass on an empty workspace in CI.

### P0.2 — Packages, build, consumer check
**Do**
- `@liro/tokens`, `@liro/ui`, `@liro/eslint-config` with `exports` maps; tsup for JavaScript and type declarations; Tailwind CLI producing `@liro/ui/styles.css`; `files` fields that include everything needed at runtime (Appendix B.10).
- `apps/consumer-check`: a Vite + React app that installs the **packed** packages (`pnpm pack`), not workspace links, and renders one button.

**Done when** `pnpm build` produces `dist/` for every package and `consumer-check` builds and renders in CI from the packed tarballs.

### P0.3 — Storybook with the toolbar
**Do**
- Storybook in `apps/storybook`, reading stories from `packages/ui`.
- Toolbar globals, applied through `LiroProvider` in a global decorator: **theme** (light, dark), **direction** (ltr, rtl), **format locale** (`en`, `sr-Latn-RS`, `ar`, `ja` — affects formatting and direction only; story text stays English), **number scheme**, **money decimals** (0, 2, 4, 6), **viewport** (phone, tablet, desktop).
- Accessibility addon enabled with WCAG 2.2 AA tags.
- A "Rules" page rendering the principles of section 1 and section 6.

**Done when** Storybook builds in CI; switching every global visibly changes a sample story.

### P0.4 — CI on Linux: tests, accessibility, visual
**Do**
- One workflow: lint → typecheck → unit tests → build → consumer check → Storybook build → story tests → accessibility → visual.
- Accessibility and visual runs happen inside the official Playwright Docker image **pinned by digest**, against the built Storybook, for **light/dark × ltr/rtl**. The Storybook server is started by the job, never reused.
- Visual baselines are generated only in that image. `AGENTS.md` (P0.5) explains how to refresh them locally through the same image.
- The `protected-files` check of rule 10.

**Done when** all jobs run on every pull request; a pull request changing `eslint.config.mjs` without the protected-files section fails.

### P0.5 — AGENTS.md and decisions.md
**Do**
- `AGENTS.md`: sections 1, 2, 5 and 6 of this plan condensed into working rules; the component and template list as it grows; how to add a component; how to refresh baselines.
- `docs/decisions.md`: the versions chosen in P0.1–P0.4 with one line each; every lesson of Appendix B copied as a dated entry, so the reasons survive.

**Done when** both files exist and every rule in `AGENTS.md` names the lint rule or test that enforces it, or says "enforced by review".

**End of Phase 0:** publish `2.0.0-alpha.0`; report to the owner with a link to the Storybook build.

---

## Phase 1 — The look (about 1–2 weeks)

### P1.1 — Tokens: values, meanings, themes
**Do**
- **Values** (`@liro/tokens`): the colour ramps, spacing, radius, shadows, motion and layout sizes of Appendix A, exactly.
- **Meanings**: the semantic tokens of Appendix A.2 as CSS variables for light and dark (`--liro-surface-page`, `--liro-text-secondary`, `--liro-status-danger-fg`, …).
- **Tailwind theme** (`theme.css`): semantic utility names (`bg-surface-raised`, `text-secondary`, `border-strong`, `bg-status-danger-bg`, `text-brand`, …).
- **shadcn compatibility**: shadcn's variables (`--background`, `--foreground`, `--primary`, `--destructive`, `--muted`, `--border`, `--input`, `--ring` …) are **mapped onto Liro meanings**, so copied primitives look Liro without edits. Liro components use Liro names.
- `tokens.json`: the same values as data, for non-React renderers (PDF and e-mail templates in `liro-core`).
- Lint rule in `@liro/eslint-config`: no raw colour utilities (`bg-red-500`, `text-gray-700`), no arbitrary colour values (`bg-[#…]`, `text-[rgb(…)]`), no hex literals outside `packages/tokens`.
- Storybook page "Tokens" showing every value and meaning in both themes.

**Done when** the tokens page renders; the lint rule has fixture tests; light and dark switch everything without a single component rule.

### P1.2 — Typography and fonts for seven scripts
**Do**
- Font sizes, weights, line heights, letter spacing and headings of Appendix A.5.
- Fonts shipped with `@liro/tokens` as CSS with `unicode-range` subsets: Noto Sans (Latin, Cyrillic, Greek), Noto Sans Arabic, Noto Sans Hebrew, Noto Sans SC, Noto Sans TC, Noto Sans JP; the brand face for the wordmark and status pages. Each subset downloads only when text needs it.
- A `lang` helper and rule: text whose language differs from the page carries `lang`, so Serbian Cyrillic italics use Serbian letterforms and Japanese does not render with Chinese glyphs.
- Per-script line-height adjustment; tabular (fixed-width) digits utility for numbers and amounts.

**Done when** a "Scripts" story shows one sentence in each of the seven script classes, correct in visual baselines for ltr and rtl.

### P1.3 — Intents, families and Button
**Do**
- The seven **families** and their colours (Appendix A.6): primary, verify, document, positive, destructive, caution, neutral. Filled buttons use the shade listed there; **measure** white-on-filled contrast with a script and fail the build below 4.5:1 (Appendix B.6).
- The **interface intents** (Appendix A.6): each with family, default emphasis, icon, and whether it asks for confirmation.
- `Button` for product use takes **either** `intent` (an interface intent) **or** `family` + `icon` + `label` (for any other action, e.g. an action a module declares). It takes **no** `color` and **no** `variant`. `emphasis?: 'primary' | 'secondary' | 'menu'` may lower or raise weight within the family's rules.
- `IconButton` with a required accessible label.
- Rule in `AGENTS.md`: one primary-emphasis button per screen; the main action is last in its group.

**Done when** Storybook shows every family and every interface intent in both themes and both directions, all passing contrast and axe.

### P1.4 — Status tones and badges
**Do** the six tones (success, warning, danger, info, neutral, premium — Appendix A.2); `StatusBadge` takes a label and a tone; `toneFor(status, map)` helper that takes the mapping as data (a default example map lives in Storybook only, Appendix A.7). Text on a tone is always the tone's `fg` on its `bg` (Appendix B.6).

**Done when** every tone passes contrast in both themes.

### P1.5 — LiroProvider, messages and format
**Do**
- `LiroProvider` exactly as section 5, with `useLiro()`.
- `messages.en.ts` with every Design System string; the type makes a missing key a compile error.
- Default `format` implemented on **decimal strings** without converting to `number` (write the grouping yourself; do not rely on `Intl.NumberFormat` for money), month and weekday names from `Intl.DateTimeFormat`, parsing per Appendix B.3 and B.4.
- Direction: `dir` on the provider's root element; Radix `DirectionProvider` set from it.
- Unit tests: `"12345678901234.567891"` formats without loss in every scheme; `decimals: 2` on `"1.5"` gives `1,50` / `1.50`; `decimals: 2` on `"1.567"` shows all three digits (never rounds); `parseNumber` for all Appendix B.3 cases; `parseNumber("abc") === null`.

**Done when** the tests pass and the Storybook toolbar drives the provider.

**End of Phase 1:** `2.0.0-alpha.1`; report.

---

## Phase 2 — Core components (about 4–6 weeks)

### P2.1 — Primitives adapted
**Do** add with the shadcn CLI into `src/primitives/` and adapt each to Liro tokens and logical properties: button, input, textarea, label, select, checkbox, radio-group, switch, dialog, alert-dialog, sheet, popover, tooltip, dropdown-menu, tabs, command, calendar, separator, scroll-area, skeleton, avatar, progress, toggle-group, collapsible. **Verify right-to-left on each** (arrows, chevrons, side of sheets, submenu direction) and record findings in `docs/decisions.md`.

**Done when** each primitive has an internal story passing axe in ltr and rtl. Primitives stay unexported.

### P2.2 — Field system and text inputs
**Do**
- `Field`: label, optional description, **error next to the field** (never only at the top), required mark, and three states: normal, **read-only** (readable, selectable, announced as read-only, visually distinct from disabled), disabled (with optional reason).
- `TextField`, `TextAreaField`, `SelectField`, `ComboboxField` (async search with debounce, loading and empty states), `MultiSelectField`, `CheckboxField`, `RadioGroupField`, `SwitchField`.
- Paste is always allowed.

**Done when** section 6 holds for each; a story shows read-only next to disabled.

### P2.3 — Numbers, money and dates
**Do**
- `NumberField` and `MoneyField`: **no input mask**; the text is parsed by `format.parseNumber` on blur (Appendix B.3); the value is a **decimal string**; `decimals` prop; tabular digits; currency shown beside the field.
- `DateField`: typed entry (`format.parseDate`) plus the calendar; value `YYYY-MM-DD`; `today` from the provider.
- `DateRangeField`; `PeriodField` (month, quarter, year) with a `yearStartMonth` prop so a business year that does not start in January works; presets ("this year", "last year", "year to date") computed from `today` and `yearStartMonth`.
- Calendar month and weekday names from `format`, not from date-fns locales.

**Done when** tests cover every Appendix B.3 input, a business year starting in July, and a `today` different from the browser's date.

### P2.4 — Overlays and confirmations
**Do** `Dialog`, `Drawer` (side sheet, follows direction), `Popover`, `Tooltip` (never the only place important information lives), `DropdownMenu`; `ConfirmDialog` whose title, tone and button come from the action's intent or family; `IrreversibleConfirmDialog` that states the consequence and requires typing a given word or number before the button enables. Rules from Appendix B.8 (modal vs drawer vs page) go into `AGENTS.md`.

### P2.5 — Feedback
**Do** `Toast` (success disappears, errors stay until dismissed — Appendix B.8); `Alert` and `Banner` (info, success, warning, danger; dismissible or not); `EmptyState` (distinguishes "nothing here yet" from "nothing matches" and offers the first step); `ErrorState` with an optional case-id slot and a "report a problem" action slot; `Skeleton`; `ProgressBar` (flips in rtl); `Stepper`.

### P2.6 — Navigation pieces and command palette
**Do** `Tabs`, `Breadcrumbs` (last item not a link), `CursorPagination` (only "previous" and "next", plus a count slot), `CommandPalette` (Ctrl/Cmd+K, async results grouped by section, keyboard only), `ShortcutHint`.

### P2.7 — Actions
**Do** `ActionGroup` (main action last, overflow into a "more" menu on narrow screens); `SplitAction`; **unavailable action**: disabled **with its reason visible as text** near the button (not only in a tooltip), announced to screen readers; `BulkActionBar` (appears on selection, shows the count, one confirmation for the whole batch).

**Done when** a story shows an unavailable action with a reason on a phone width.

### P2.8 — Display pieces
**Do** `Card` / `SectionCard`, `KeyValueList`, `PersonAvatar` / `PersonName` (initials from first and last name, Appendix B.9), `DateText` and `DueDate` (overdue computed from the provider's `today`), `NumberText` and `MoneyText` (formatted through `format`, empty value shown as an em dash, Appendix B.5), and **`SettlingValue`**:
- shows the last confirmed value unchanged while a new one is pending, with a small quiet indicator beside it;
- never blanks, never shows a spinner instead of the number, never shows an intermediate value;
- reserved width and tabular digits so nothing reflows, in ltr and rtl;
- announces the new value once, politely, when it settles;
- `unavailableText` prop for when no value can be shown (e.g. offline).

**Done when** a story simulates slow updates and fast typing, and a Playwright test proves no layout shift and one announcement per settle.

**End of Phase 2:** `2.0.0-alpha.2`; report.

---

## Phase 3 — Table and forms (about 4–6 weeks)

### P3.1 — DataTable core
**Do** on TanStack Table, fully **controlled** — the table never fetches, sorts or filters data itself:
- columns with header, cell renderer, alignment (numbers to the end), `sortable` and `filterable` flags; a column that is not sortable shows no sort control;
- `sort` and `onSortChange`; `filters` and `onFiltersChange`;
- **cursor paging**: `hasPrevious`, `hasNext`, `onPrevious`, `onNext` — no page numbers;
- **count display**: `count` + `countIsExact`; helper `formatCount` shows the exact number up to a threshold (default **10,000**) and "More than 10,000" above it, through `messages['table.count']`;
- **totals row** from props, never computed;
- row click, row actions menu, selection with `BulkActionBar`;
- loading, empty ("nothing yet") and no-match states; a row-limit message slot;
- an export action slot (the consumer runs exports as jobs).

**Done when** stories cover every state above; a unit test proves the table never sorts or sums by itself.

### P3.2 — Table on phones, large lists, column resize
**Do**
- **Real branching** between table and card layout by viewport (never both rendered and one hidden — Appendix B.5); the card layout is described per table (`mobile` prop: which fields are title, subtitle, amount, status).
- Virtualisation with TanStack Virtual for long lists.
- Column resize by pointer **and** keyboard, measuring from the leading edge (Appendix B.7), with a non-drag alternative.

**Done when** a 1,000-row story stays responsive (record the interaction timing in `docs/decisions.md`), and resize works in rtl.

### P3.3 — Filters and search
**Do** `FilterBar` (search on the start side, filters beside it, actions at the end — Appendix B.8), debounced search, filter chips with clear, controlled values only.

### P3.4 — Editable grid
**Do** a keyboard-first line editor on TanStack Table for document lines and journal entries: Enter/Tab move, add and remove rows by keyboard, cell editors from P2.2–P2.3, per-row warnings and errors, **totals and balance from props shown with `SettlingValue`** — nothing computed in the grid.

**Done when** a full entry of ten lines is possible without a mouse, in ltr and rtl.

### P3.5 — Form layout
**Do** `FormSection`, `FormTabs` (a tab with an error shows an indicator and focus moves to the first error), `FormActions` at the top **and** a sticky bar at the bottom that appears only when the form scrolls (Appendix B.8), `useUnsavedChangesGuard`, `FormWizard` (per-step validation hooks, no re-entry of data). Optional `@liro/ui/form` binding for React Hook Form.

**End of Phase 3:** `2.0.0-alpha.3`; report.

---

## Phase 4 — Screen templates (about 3–5 weeks)

Templates are layouts with **slots**; they contain no data logic.

### P4.1 — Application shell
**Do** `AppShell`: header with product name and logo (props), search trigger (opens `CommandPalette`), slots for a company switcher, notifications and the user menu; **module tabs** inside a module (navigation is a launchpad plus tabs, not a sidebar — Appendix B.8); breadcrumbs; slots for the offline indicator, environment marker and impersonation bar (P5.3); on phones, a bottom action bar within thumb reach and safe-area insets for installed apps.

### P4.2 — Home (launchpad)
**Do** `Launchpad` with `ModuleCard`s: icon, name, counter, optional **locked** state with a text passed in (e.g. "Available in <plan>"), reorder and hide through callbacks, keyboard 1–9 to open and arrows to move.

### P4.3 — List and worklist templates
**Do** `ListPage` (title, actions, `FilterBar`, `DataTable`, `CursorPagination`), `WorklistPage` (a queue processed item by item: list plus detail side by side on desktop, stacked on phones).

### P4.4 — Detail and record form templates
**Do** `DetailPage` (header with status and actions, sections, side column); `RecordFormPage` (back link, actions top and bottom, side column, unsaved-changes guard).

### P4.5 — Document template
**Do** `DocumentPage`: header (number, parties, dates, status badge, actions), a lines slot (usually `EditableGrid` or a read-only table), a **totals block from props** using `SettlingValue`, and **side-panel slots** for delivery status, related documents, history and comments, presence, attachments.

### P4.6 — Report, dashboard and settings templates
**Do** `ReportPage` (parameters, result, export slot), `DashboardPage` with `StatCard` and chart wrappers (bar, line, area, donut) on shadcn Chart with tokens, `SettingsPage` (sections of rows).

### P4.7 — Status pages and sign-in shell
**Do** status pages: not signed in (401), no access (403), not found (404), error (500, with case-id slot), maintenance, suspended; `AuthShell` (centred card, product name and logo from props).

### P4.8 — Example screens
**Do** Storybook "Examples" section, English, fictitious data, full-screen: a list of invoices, an invoice document with lines and totals, an employee record form, a dashboard, a worklist. Each works in both themes, both directions and phone width.

**Done when** the owner can open the examples and see Liro as it will look.

**End of Phase 4:** `2.0.0-alpha.4`; report with links to every example screen.

---

## Phase 5 — Liro patterns (about 3–4 weeks)

All generic: labels and states come in as props.

### P5.1 — History, comments and messages
**Do** `Timeline` / `HistoryList` (who, when, what changed; actor kind marker for human, system, agent, integration; "on behalf of" line); the **`Message` family** (`MessageBubble`, `MessageList`, `MessageThread`, `MessageComposer` — Enter sends, Shift+Enter breaks the line) used for comments and task conversations; `MentionCombobox` for mentions (candidate list comes from props).

### P5.2 — Presence and agent marking
**Do** `PresenceAvatars` (who else is here, overflow count, tooltips with names); `AgentMark` (a consistent machine marker shown next to any name that belongs to an agent).

### P5.3 — Connection, environment and session markers
**Do** `OfflineIndicator` (always visible while offline, in the shell); `ConnectionState` for drafts (saved on this device / sending / sent); `EnvironmentMarker` (e.g. sandbox, demo — label from props, always visible); `ImpersonationBar` (not dismissible; shows whose account, mode, reason and time left, with an exit action); generic `Banner` placements in the shell.

### P5.4 — Delivery and progress status
**Do** `StatusTimeline` (a sequence of states with the current one highlighted and a next-step slot, e.g. "delivery pending — action needed" with retry and manual-export actions); `JobProgress` (progress, cancel, final report of successes and failures).

### P5.5 — Files and document frame
**Do** `FileDropzone` and `AttachmentList`: accepted types and size limit shown before choosing (props); states **uploading, scanning, available, quarantined** with the next step; a flag slot (e.g. "not archival format"); remove only when a `canRemove(file)` prop allows it; downloads through a callback (the consumer fetches a short-lived link at click time). `DocumentFrame`: hosts a document viewer from another origin in a sandboxed iframe with a small message protocol (page, zoom, loading, error), documented in `docs/`.

### P5.6 — Sign-in building blocks
**Do** building blocks only, the flows live in `liro-core`: `EmailFirstForm`, `PasswordField` (paste allowed, show/hide), `CodeInput` for one-time codes (paste of the whole code works), `RecoveryCodes` (shown once, copy, download, print, "I have saved them" confirmation), `SessionList` (device, place, time, revoke, "this wasn't me" action slot).

### P5.7 — Kanban board
**Do** `KanbanBoard` with columns and cards, drag **and** a keyboard/menu alternative for moving a card (WCAG 2.2 dragging), rtl-correct.

**End of Phase 5:** `2.0.0-alpha.5`; report.

---

## Phase 6 — Acceptance and release (about 2–3 weeks)

### P6.1 — Full language and direction matrix
Every story in light/dark × ltr/rtl, plus Arabic and Japanese sample-text stories for every component with text. Fix every finding; record anything left open in `docs/decisions.md` with a reason (there should be nothing).

### P6.2 — Manual WCAG 2.2 checks
Check by hand what axe cannot: keyboard-only use of every template, focus never hidden under sticky bars, target sizes on phone width, a non-drag alternative for every drag, paste in every code and password field, 200% zoom. Write the results to `docs/wcag22.md`.

### P6.3 — Performance budget
Measure the JavaScript and CSS needed for the list example and the document example in mobile emulation (mid-range device, slow 4G). Record the numbers and set a budget in CI a little above them.

### P6.4 — Documentation for consumers
`README.md` and `docs/getting-started.md` for agents building `liro-core`: installing, the two CSS imports, `LiroProvider` and what the Core should pass into each field, the rule "never import primitives or Radix", how to choose an intent or family, how to ask for a missing component. Final pass on `AGENTS.md` and `docs/decisions.md`.

### P6.5 — Release 2.0.0
All steps `done`; changesets complete; `2.0.0` published with exact versions; final report to the owner in Serbian: what exists, where to see it, what `liro-core` does next.

**After 2.0.0 (not part of this plan):** the adapter in `liro-core`; the owner-approved human checks with a screen reader and native Arabic and Japanese readers, run on the product's real screens once they exist.

---

## Appendix A — The look, carried over from Design System 1.0

These values define the established Liro look. Carry them over exactly in P1.1–P1.4.

### A.1 Colour ramps (0 = lightest, 9 = darkest)

| Ramp | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 |
|---|---|---|---|---|---|---|---|---|---|---|
| blue (brand; 6 is the brand colour) | #E8F5FA | #BDE3F5 | #93D1F0 | #68BEEF | #3EACEB | #1499E6 | #0078D4 | #0069BC | #0059A4 | #004A8C |
| teal (secondary accent) | #E4F7F7 | #B8E8E9 | #8CD9DA | #5FC9CB | #33BABC | #17A8AB | #038387 | #027276 | #026165 | #015052 |
| gray (neutral, 90% of surfaces and text) | #FAF9F8 | #F3F2F1 | #EDEBE9 | #E1DFDD | #D2D0CE | #A19F9D | #797775 | #605E5C | #3B3A39 | #323130 |
| green (success) | #DFF6DD | #C3EBC0 | #A3DD9F | #7FCD7A | #5ABC55 | #3AA835 | #1C8815 | #107C10 | #0B6A0B | #054B05 |
| orange (warning) | #FFF4CE | #FFE7A0 | #FFD670 | #FFC043 | #FCA61F | #F08C00 | #E56F01 | #D83B01 | #B83101 | #8F2601 |
| red (error, destructive) | #FDE7E9 | #F9C8CD | #F3A3AB | #EB7A85 | #E05360 | #CF3A48 | #BD2F3B | #A4262C | #8A1F24 | #6B171C |
| violet (premium, documents) | #F3F0FF | #E5DBFF | #D0BFFF | #B197FC | #9775FA | #845EF7 | #7950F2 | #7048E8 | #6741D9 | #5F3DC4 |

Common: white #FFFFFF, black #000000, dark page `ink` #1B1B1B, `inkRaised` #242424, `inkSunken` #141414, `inkOverlay` #2C2C2C.

### A.2 Meanings (semantic tokens)

| Meaning | Light | Dark |
|---|---|---|
| surface.page | gray1 | ink |
| surface.raised | white | inkRaised |
| surface.sunken | gray2 | inkSunken |
| surface.overlay | white | inkOverlay |
| surface.header | white | inkRaised |
| surface.hover | gray0 | rgba(255,255,255,0.05) |
| surface.selected | blue0 | rgba(0,120,212,0.18) |
| surface.disabled | gray2 | rgba(255,255,255,0.06) |
| surface.backdrop | rgba(0,0,0,0.45) | rgba(0,0,0,0.65) |
| surface.scrim | rgba(0,0,0,0.55) | rgba(0,0,0,0.55) |
| text.primary | gray9 | gray1 |
| text.secondary | gray7 | #B3B0AD |
| text.tertiary | #6A6866 | gray5 |
| text.disabled | gray5 | gray6 |
| text.onAccent | white | white |
| text.brand / text.link | blue7 | blue4 |
| border.default | gray3 | #3B3B3B |
| border.strong | gray4 | #4D4D4D |
| border.subtle | gray2 | #2E2E2E |
| border.brand | blue6 | blue5 |
| border.focus | blue6 | blue4 |
| brand.solid / solidHover / solidActive | blue6 / blue7 / blue8 | blue6 / blue7 / blue8 |
| brand.subtle / subtleHover | blue0 / blue1 | rgba(0,120,212,0.16) / rgba(0,120,212,0.26) |
| brand.onSolid | white | white |
| brand.accent | teal6 | teal4 |

Status tones — `fg` / `bg` / `border` / `solid`:

| Tone | Light | Dark |
|---|---|---|
| success | green7 / green0 / green2 / green7 | green3 / rgba(16,124,16,0.20) / rgba(16,124,16,0.45) / green6 |
| warning | orange8 / orange0 / orange2 / orange7 | orange3 / rgba(216,59,1,0.20) / rgba(216,59,1,0.45) / orange6 |
| danger | red7 / red0 / red2 / red7 | red3 / rgba(164,38,44,0.22) / rgba(164,38,44,0.50) / red6 |
| info | blue7 / blue0 / blue2 / blue6 | blue3 / rgba(0,120,212,0.18) / rgba(0,120,212,0.45) / blue6 |
| neutral | gray9 / gray1 / gray3 / gray7 | gray1 / rgba(255,255,255,0.07) / #3B3B3B / gray5 |
| premium | violet7 / violet0 / violet2 / violet6 | violet3 / rgba(121,80,242,0.20) / rgba(121,80,242,0.45) / violet5 |

`brand.solid` is a background and `text.brand` is text; they move in opposite directions between themes and must never share a token.

### A.3 Spacing, radius, shadows

- Spacing: none 0 · xxs 4px · xs 8px · sm 12px · md 16px · lg 24px · xl 32px · xxl 48px · xxxl 64px.
- Radius: none 0 · xs 2px · sm 4px · md 8px · lg 12px · xl 16px · full 9999px.
- Shadows, light: xs `0 1px 2px rgba(0,0,0,0.06)` · sm `0 1px 4px rgba(0,0,0,0.08)` · md `0 2px 8px rgba(0,0,0,0.08)` · lg `0 4px 16px rgba(0,0,0,0.10)` · xl `0 8px 32px rgba(0,0,0,0.14)`.
- Shadows, dark: same offsets with opacity 0.35 · 0.40 · 0.45 · 0.50 · 0.60.

### A.4 Motion and layout

- Durations: instant 75ms · fast 100ms · base 150ms · slow 250ms. Easing: standard `cubic-bezier(0.33,0,0.67,1)` · decelerate `cubic-bezier(0.1,0.9,0.2,1)` · accelerate `cubic-bezier(0.9,0.1,1,0.2)`. Respect `prefers-reduced-motion`.
- Breakpoints: xs 36em · sm 48em · md 62em · lg 75em · xl 88em.
- Sizes: header height 56px · content max width 1440px · control height 36px · small control 30px.
- Layers (z-index): base 0 · raised 10 · sticky 100 · header 200 · drawer 300 · modal 400 · popover 500 · toast 600 · tooltip 700.

### A.5 Typography

- Interface face: Noto Sans (with the script families of P1.2). Brand face (wordmark, status pages): Space Grotesk with Inter fallback. Monospace: JetBrains Mono, Cascadia Code, system monospace.
- Sizes: xs 12px · sm 13px · md 14px (body) · lg 16px · xl 20px.
- Weights: regular 400 · medium 500 · semibold 600 · bold 700.
- Line heights: tight 1.25 · base 1.45 · relaxed 1.6. Letter spacing: heading −0.015em · body −0.01em · caps 0.5px.
- Headings (all semibold): h1 24px/1.3 · h2 20px/1.35 · h3 16px/1.4 · h4 14px/1.45 · h5 13px/1.45 · h6 12px/1.45.

### A.6 Families and interface intents

| Family | Colour | Filled shade | Meaning |
|---|---|---|---|
| primary | blue | 6 | create, save, confirm, go on |
| verify | teal | 6 | check, submit to an outside party, sign, send |
| document | violet | 6 | PDF, print, preview, download |
| positive | green | 6 | approve, complete, activate |
| destructive | red | 6 | delete, reject |
| caution | orange | **7** | hard-to-reverse: unlock, revert, void |
| neutral | gray | **7** | view, edit, filter, back, cancel, settings |

Gray and orange use shade 7 for filled buttons because shade 6 fails AA with white text (Appendix B.6). Measure all seven in P1.3.

Interface intents (`intent` prop) — family · default emphasis · confirms · lucide icon:

| Intent | Family | Emphasis | Confirms | Icon |
|---|---|---|---|---|
| create | primary | primary | — | Plus |
| save | primary | primary | — | Save |
| confirm | primary | primary | — | Check |
| next | primary | primary | — | ArrowRight |
| pdf | document | primary | — | FileText |
| print | document | primary | — | Printer |
| preview | document | secondary | — | Eye |
| download | document | secondary | — | Download |
| export | positive | secondary | — | FileSpreadsheet |
| delete | destructive | menu | yes | Trash2 |
| edit | neutral | secondary | — | Pencil |
| view | neutral | menu | — | Eye |
| filter | neutral | secondary | — | Filter |
| refresh | neutral | menu | — | RefreshCw |
| back | neutral | menu | — | ArrowLeft (mirrors in rtl) |
| cancel | neutral | secondary | — | X |
| duplicate | neutral | secondary | — | Copy |
| import | neutral | secondary | — | Upload |
| settings | neutral | menu | — | Settings |
| more | neutral | menu | — | MoreHorizontal |

Every other action uses `family` + `icon` + `label`. The previous system's domain intents map to families as follows, for reference when `liro-core` declares its actions: submit → primary (Check); verify → verify (ShieldCheck); sign → verify (Signature, confirms); send → verify (Send, confirms); sync → verify (Share2); approve → positive (CheckCheck, confirms); post → positive (BookCheck, confirms); complete → positive (CircleCheck); activate → positive (Power, confirms); reject → destructive (CircleX, confirms); reverse a document → destructive (FileMinus2, confirms); unlock → caution (Unlock, confirms); revert → caution (RotateCcw, confirms); void → caution (Ban, confirms); escalate → caution (ArrowUpCircle); archive → neutral (Archive).

Document buttons (PDF, print) carry full weight on purpose: bookkeepers look for them first; a light violet button gets lost next to a filled blue one.

### A.7 Example status-to-tone map (Storybook data only)

draft neutral · pending warning · in review info · approved success · posted success · signed info · sent info · paid success · partially paid warning · overdue danger · rejected danger · cancelled danger · archived neutral · active success · inactive neutral · locked warning · error danger.

---

## Appendix B — Lessons carried over from Design System 1.0

Each of these was learned by measurement or by a real defect. Copy them into `docs/decisions.md` in P0.5.

**B.1 Language tags name the script.** Always `sr-Latn` / `sr-Cyrl`, never bare `sr`: `Intl` reads bare `sr` as Cyrillic, which once produced Cyrillic month names on a Latin screen for weeks. Treat `sr-RS` as Latin (everyday Serbian usage).

**B.2 Two locales that barely differ hide bugs.** Bosnian and Serbian share about two thirds of their strings; a stale setting rendered Bosnian for an afternoon while everyone believed it was Serbian. Any language picker shows the current language.

**B.3 Number entry.** A masking input configured for Serbian turned `1234.56` into `123456` — a hundredfold error on the form people type when copying from foreign invoices. Hence no mask: parse the raw text. Accept `1234.56`, `1234,56`, `1.234,56`, `1,234.56`, grouping by space, non-breaking space, thin space or either apostrophe, and Indian 2-2-3 grouping. **The rule:** with both separators present, the last one is the decimal separator; with one kind present, it is a decimal separator when it appears once and grouping when it repeats; the screen's own number scheme is consulted **only** to break a tie the string cannot break itself (a string that is exactly a grouped integer in the scheme's own grouping, e.g. `240.000` on a dot-comma screen, is read as grouped). The alternative "under dot-comma a dot is never a decimal" breaks `1234.56` and was rejected. What the system prints, it must be able to read back — test every scheme's output through the parser.

**B.4 Unreadable is `null`, never `0`.** An unparseable amount counted as zero once made an unbalanced journal entry look balanced. Also: `value * 100` is not a conversion (`1.005 * 100` is `100.49999999999999`); work on the decimal string. This was fixed once and reintroduced by a "simplification".

**B.5 Tables.** Rendering both the desktop table and the phone cards and hiding one with CSS gave 1,592 ms per interaction at 932 rows; real branching plus virtualisation gave 120 ms. `table-layout: fixed` made columns worse. An empty value is an em dash (—), never a hyphen, which reads as a minus sign. Amount and currency joined by a non-breaking space so they never wrap apart. Raw numbers, not formatted text, go into CSV and Excel.

**B.6 Contrast.** Opacity on text enters the contrast ratio (`opacity: 0.85` dropped a bar from passing to 4.31:1) — make quieter text with size and weight. Translucent dark-theme tokens assume the page background; on a coloured surface they mix (a tone on a blue bubble measured 2.34 instead of 6.32) — layer them over an opaque base. Status `solid` colours are for bars and dots, never text; text on a tone is its `fg` on its `bg`. Automatic contrast switching was measured and rejected: the threshold between two families was three thousandths apart. Contrast is measured after layers composite, not per token.

**B.7 Right-to-left.** Three drag handlers (column resize, split divider, their arrow keys) all ran backwards in right-to-left because they computed in physical pixels. Every pointer or keyboard movement measures from the **leading** edge. This is a class of bug, not an incident. Progress bars flip (a bar is a metaphor for reading); prop names like `left`/`right` and symmetric stretches do not.

**B.8 Ways of working that the owner established.**
- Navigation is a **launchpad of module cards** at the root and **tabs inside a module**, not a sidebar.
- **Full page** for creating or editing anything with more than about ten fields, tabs or attachments (it has an address, room for errors, and a back button); **drawer** for a short edit with the list still visible; **modal** for one action with one outcome, or a read-only view.
- Routes: `/things`, `/things/new`, `/things/[id]`, `/things/[id]/part`; breadcrumbs from the third level; the table never decides whether a row opens a page or a drawer.
- Actions at the top **and** at the bottom of a scrolling form; the bottom bar is sticky only while the form actually scrolls.
- On a list: search on the start side, filters beside it, actions at the end, paging at the bottom. Once a user knows where search is on one screen, they know it on every screen.
- One filled button per screen; the main action is last in its group.
- The error sits next to the field. Success messages disappear; errors wait.
- Hidden fields are never submitted.
- A table on a phone is not a table: it is cards.
- Confirmation does not scale: a bulk action asks once, with the count.

**B.9 Habits.** A prop that is accepted and does nothing was found eleven times, and none failed lint, types, tests or the accessibility sweep — each was found by looking at a screen. Initials come from first and last name ("Ana Jovanović" → AJ, not AN). A finding is a hypothesis until code confirms it. When a check fails on more places than a change could touch, suspect the environment (a crashed dev server once failed 166 of 198 accessibility tests).

**B.10 Packaging.** A package whose `files` field missed a sibling folder worked inside the workspace and returned errors for every consumer; a package marked private could not be installed at all. Workspace links hide both. That is why `consumer-check` installs **packed** tarballs. Every build tool task declares its outputs (a missing declaration once filled a cache to 223 GB).

**B.11 The JMBG sex marker is not gender identity.** Never prefill anything about a person's gender from an identification number. (Domain validation itself is not in the Design System; this is recorded for whoever builds forms on it.)
