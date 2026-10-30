# BUILD-PLAN — Liro Design System, from zero

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
7. Draws a printed document. Its printed form comes from liro-folio (see below).

### Out of scope: printed documents → liro-folio (owner, 2026-10-29, P5.95)

Every printed document — invoices, credit and debit notes, quotes, delivery notes, decisions and rulings, contracts, letters, minutes, payslips, IOS statements, ledger reports, prescribed forms, the fiscal receipt and labels — is a PDF rendered by **liro-folio**, a standalone project in its own repository that depends only on `@veljaos/tokens` (never on `@veljaos/ui` or React). The Design System owns only the **screens** around documents and shows the PDF or the page images liro-folio produced (`FilePreview`, `DocumentFrame`, `PageViewer`; `ReceiptResult` at the till). It contains **no React replica** of a printed document, so one source of truth decides how a document looks. Browser printing of a screen — a report, a chart or a list printed as you see it — is not a document and stays.

---

## 2. Decisions already taken

| Topic | Decision |
|---|---|
| Foundation | **shadcn/ui** (Radix primitives + Tailwind CSS), code copied into this repository and owned by it |
| Tables | **TanStack Table** + **TanStack Virtual** |
| Catalogue and playground | **Storybook**, English only, small. Not hosted anywhere: viewed locally with `pnpm storybook`; CI and the publish workflow attach the static build as a downloadable artifact |
| Look | Kept from the previous Design System: token values are carried over **1:1** (Appendix A). Refreshing later is a change in one place. |
| Tokens | **Three layers.** Values (open, change freely) → meanings (closed vocabulary, change rarely and deliberately) → components (choose a meaning, never a colour). |
| Colour by purpose | Buttons choose an **intent** or a **family** (Appendix A.6), never a colour or a variant. Blue means confirm, red means destructive, everywhere. |
| Layout freedom | Screens and components may set layout freely (width, alignment, spacing to neighbours) with Tailwind. **Raw colours are forbidden** (`bg-red-500`, `text-[#…]`); only semantic names (`bg-destructive`). Lint enforces it. |
| Backend | None. One provider (section 5) carries language, direction, texts, formatting and "today". |
| Languages | Every component works left-to-right and right-to-left, and with Latin, Cyrillic, Greek, Arabic, Hebrew, Chinese and Japanese text. |
| Accessibility | WCAG 2.2 AA, automated and manual, zero allowed exceptions. |
| Devices | Mobile-first, installable web app (PWA) friendly, one-hand use on phones. |
| Version | Packages start at **0.1.0-alpha.0** (end of Phase 0), then `0.1.0-alpha.1`, … after each phase, and reach **1.0.0** at the end of this plan (P6.5). No `@veljaos/*` package was published before. |
| Package names | `@veljaos/tokens`, `@veljaos/ui`, `@veljaos/eslint-config`. GitHub Packages accepts only the scope of the account that owns the repository (`veljaos`); the name `liro` on GitHub belongs to someone else. The components keep the Liro names (`LiroProvider`, `--liro-*`). |
| License | Proprietary: `"license": "UNLICENSED"` in every package, `LICENSE` at the root, third-party notices in `THIRD-PARTY-NOTICES.md` |
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
| Forms | Presentational fields in `@veljaos/ui`; an optional React Hook Form binding in `@veljaos/ui/form`. No validation library inside the Design System. |
| Library build | tsup (JavaScript + type declarations) and the Tailwind CLI (CSS) |
| Catalogue | Storybook (React + Vite), with the accessibility addon and a toolbar of globals |
| Tests | Vitest (logic), Storybook test runner / Vitest addon (stories), Playwright + axe-core (accessibility and visual), in a pinned Linux Docker image |
| Releases | GitHub Packages, published only by `.github/workflows/publish.yml` when a tag `v<version>` is pushed, with the workflow's own `GITHUB_TOKEN` (`packages: write`); no personal token. Changesets for version bumps and changelogs from the end of Phase 1 |

### Repository layout

```
liro-design-system/
├── AGENTS.md                 rules for every agent (written in P0.5)
├── BUILD-PLAN.md             this file
├── docs/
│   └── decisions.md          why things are as they are (seeded from Appendix B)
├── packages/
│   ├── tokens/               @veljaos/tokens — CSS variables (light, dark), Tailwind theme, tokens.json, fonts
│   ├── ui/                   @veljaos/ui — provider, components, templates
│   │   └── src/
│   │       ├── primitives/   shadcn copies, adapted; NOT exported
│   │       ├── components/   the Liro API
│   │       ├── templates/    screen templates
│   │       ├── provider/     LiroProvider, messages, format
│   │       └── form/         optional React Hook Form binding (subpath export)
│   └── eslint-config/        @veljaos/eslint-config — the rules, shipped to consumers
└── apps/
    ├── storybook/            the catalogue and playground
    └── consumer-check/       a plain Vite + React app that installs the built packages like a consumer
```

**Primitives are private.** `packages/ui/src/primitives/` holds shadcn code adapted to Liro tokens. Only `components/` and `templates/` are exported. Consumers (`liro-core`) import `@veljaos/ui` only — never Radix, never a primitive. Lint enforces it.

### How consumers use it

- `import '@veljaos/tokens/tokens.css'` and `import '@veljaos/ui/styles.css'` — **precompiled CSS**, so a consumer does not need Tailwind to use the components.
- A consumer that uses Tailwind for its own layout imports `@veljaos/tokens/theme.css` (Tailwind v4 `@theme`) to get the same semantic names.
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
10. **No silent guard changes.** A pull request that changes lint configuration, `tsconfig*`, CI, the Playwright or Storybook test configuration, any accessibility setting, or the agent permissions in `.claude/settings.json` must contain a section `## Protected file changes` with a reason per file; CI fails without it. The owner is told in the step report.
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
9. **Exported** from `@veljaos/ui` and documented in its story: what it is for, when to use it, when not to.

---

## 7. Status table

Status: `todo`, `in progress`, `blocked (reason)`, `done`.

| Step | Title | Depends on | Status | Date | Note |
|---|---|---|---|---|---|
| P0.1 | Repository and toolchain | — | done | 2026-09-24 | pnpm 12, TypeScript 6.0.3, ESLint 9, Prettier; CI green on PR #1 |
| P0.2 | Packages, build, consumer check | P0.1 | done | 2026-09-24 | tsup + Tailwind CLI 4.3; consumer-check installs packed tarballs outside the repo; placeholder Button until P1.3 |
| P0.3 | Storybook with the toolbar | P0.2 | done | 2026-09-24 | Storybook 10.6; first LiroProvider subset (locale, direction, theme, number format); Vitest; license UNLICENSED + notices |
| P0.4 | CI on Linux: tests, accessibility, visual | P0.3 | done | 2026-09-24 | Playwright 1.63 image pinned by digest; story tests via Storybook events; axe WCAG 2.2 AA; baselines ×4; protected-files check |
| P0.4a | CI test steps without step timeouts | P0.4 | done | 2026-09-28 | A 5-minute step timeout killed Playwright but left its server on port 6006, failing the next step; Playwright now stops itself (`globalTimeout` 25 min), job limit 90 min |
| P0.5 | AGENTS.md and decisions.md | P0.4 | done | 2026-09-25 | Packages renamed to `@veljaos/*` (GitHub Packages scope); tag-triggered publish workflow; notices completed; local baseline script |
| P1.1 | Tokens: values, meanings, themes | P0.5 | done | 2026-09-25 | One source (`tokens.ts`) generates CSS, Tailwind theme and JSON, tested against Appendix A; raw palette removed; lint rules `liro/no-raw-colors` and `liro/logical-properties` with fixtures; Tokens page |
| P1.2 | Typography and fonts for seven scripts | P1.1 | done | 2026-09-25 | A.5 type scale as tokens and Tailwind utilities; Noto families, Space Grotesk and Inter shipped with unicode-range subsets; CJK order by lang; per-script leading; `useLangAttribute`; Scripts story |
| P1.3 | Intents, families and Button | P1.1 | done | 2026-09-25 | Seven families as tokens (owner's Mantine weights; hover text one shade stronger for contrast); 470 contrast checks fail the build below 4.5:1; Button and IconButton by intent or family; all 20 intents |
| P1.3a | Icon sizes and icon-only buttons | P1.3 | done | 2026-09-25 | Owner's correction from the old ActionButton: 15px icons with text; IconButton 36px without text; CompactIconButton 28px for tight places |
| P1.4 | Status tones and badges | P1.1 | done | 2026-09-25 | StatusBadge with the owner's exact badge weights; toneFor with the map as data (A.7 example in Storybook only); every tone measured in both themes on every surface |
| P1.5 | LiroProvider, messages and format | P0.5 | done | 2026-09-25 | Every provider prop; typed messages; parseNumber per B.3/B.4; dates Gregorian with Latin digits, parsed in the locale's order; Radix direction |
| P2.1 | Primitives adapted | P1.3 | done | 2026-09-25 | 24 shadcn primitives in `src/primitives/` with Mantine 9.6.2 values and Liro tokens, unexported; internal stories; overlays render inside the provider; RTL fixed in sheet, calendar and progress; owner added `surface.inverse`, `text.onInverse`, `border.control` |
| P2.2 | Field system and text inputs | P2.1, P1.5 | done | 2026-09-28 | Split into P2.2a and P2.2b |
| P2.2a | Field and the simple fields | P2.1, P1.5 | done | 2026-09-25 | Field, TextField, TextAreaField, SelectField, CheckboxField, SwitchField, RadioGroupField; owner: read-only as plain text, error border in danger fg |
| P2.2b | ComboboxField and MultiSelectField | P2.2a | done | 2026-09-28 | Own WAI-ARIA combobox; application search after 300ms (owner) with loading and "nothing found"; pills with Mantine Pill values, remove target 24×24 |
| P2.3 | Numbers, money and dates | P2.2 | done | 2026-09-28 | Split into P2.3a–P2.3d |
| P2.3a | NumberField and MoneyField | P2.2 | done | 2026-09-28 | No mask, read on blur or Enter; decimal string or null; owner: currency on the locale's side, start-aligned, unreadable text kept with the field's own message |
| P2.3b | DateField and DateRangeField | P2.3a | done | 2026-09-28 | Typed or picked, YYYY-MM-DD; owner: calendar only from its button or Alt+ArrowDown, focus in and back; opens on the provider's today; range end before start is an error |
| P2.3c | PeriodField | P2.3b | done | 2026-09-28 | Owner: the old PeriodPicker (presets and a custom range); `yearStartMonth`, `quarterBasis`; `format.businessYear` "2025/26"; tested with a July business year and a `today` other than the device's |
| P2.3d | MonthField | P2.3c | done | 2026-09-28 | Owner: the old AccountingPeriodSelect; Mantine MonthPickerInput look; arrows from the leading edge |
| P2.4 | Overlays and confirmations | P2.1 | done | 2026-09-28 | Split into P2.4a and P2.4b |
| P2.4a | Dialog, Drawer, Popover, Tooltip, DropdownMenu | P2.1 | done | 2026-09-28 | On the P2.1 primitives; B.8 rules in AGENTS.md D14; Button passes trigger attributes through; non-modal menu |
| P2.4b | ConfirmDialog, delete preset, IrreversibleConfirmDialog | P2.4a | done | 2026-09-28 | Owner: the old ConfirmModal (tone from family, centred, radius lg, loading blocks closing); DeleteConfirmDialog texts from messages; typed text enables the irreversible one |
| P2.5 | Feedback | P2.1 | done | 2026-09-28 | Split into P2.5a–P2.5c |
| P2.5a | Toast | P2.1 | done | 2026-09-28 | Owner: the old notice API (kinds, times, loading → update), bottom end, 4 visible; sonner 2.0.8 |
| P2.5b | Alert, Banner, EmptyState, ErrorState | P2.5a | done | 2026-09-28 | Owner: Mantine Alert light, radius md; the old EmptyState (three variants, icons, texts from messages, compact); ErrorState with case number and report slot; 24px close target |
| P2.5c | Skeleton, ProgressBar, Stepper | P2.5b | done | 2026-09-28 | Owner: Stepper sm with 32px icons, primary; ProgressBar sm, fully rounded, flips in rtl; Skeleton radius md |
| P2.6 | Navigation pieces and command palette | P2.1 | done | 2026-09-28 | Split into P2.6a and P2.6b |
| P2.6a | Tabs, Breadcrumbs, CursorPagination, ShortcutHint | P2.1 | done | 2026-09-28 | Owner: centred tabs, panels not kept (AGENTS.md D16); "›" separator; Pagination sm previous/next only; Kbd xs |
| P2.6b | CommandPalette | P2.6a | done | 2026-09-28 | Owner: the old Spotlight (Ctrl/Cmd+K and +P, actions then Go to, highlighted matches, keywords); cmdk |
| P2.7 | Actions | P1.3, P2.4 | done | 2026-09-29 | Split into P2.7a–P2.7d; the unavailable action with its reason is shown at phone width |
| P2.7a | ActionGroup, UnavailableAction | P2.4 | done | 2026-09-28 | Owner: end-aligned wrapping row; "More" overflow keeps the main action; unavailable with visible reason (phone-width story) and tooltip on focus and touch |
| P2.7b | SplitAction | P2.7a | done | 2026-09-28 | Owner: joined halves, 30% currentColor line (a logical pseudo-element), menu bottom-end with arrow and pop, 16px item icons |
| P2.7c | BulkActionBar | P2.7b | done | 2026-09-28 | Owner: brand.subtle panel sliding in (140ms), live count, select all, small actions, one confirmation with the count |
| P2.7d | Long button labels wrap | P2.7c | done | 2026-09-29 | Owner: never "…"; wraps centred (normally two lines), the button grows from 36px; ActionGroup and BulkActionBar move actions into "More" first |
| P2.8 | Display pieces | P2.3 | done | 2026-09-28 | Split into P2.8a–P2.8d |
| P2.8a | Card, SectionCard, KeyValueList | P2.1 | done | 2026-09-28 | Owner: radius lg; SectionCard header and divider; KeyValueList labels upper case only in cased scripts (by :lang) |
| P2.8b | PersonAvatar, PersonName | P2.8a | done | 2026-09-28 | Owner: light primary avatar, radius xl; initials from the first and last word (B.9, tested); decorative unless alt |
| P2.8c | DateText, DateRangeText, DueDate, NumberText, MoneyText | P2.8b | done | 2026-09-28 | Owner: tabular, "—" when empty; DueDate from the provider today, overdue days in the badge; new `format.dateLong` |
| P2.8d | SettlingValue | P2.8c | done | 2026-09-28 | Owner: 6px dot after 300ms in a reserved slot; a Playwright test proves no layout shift and one announcement per settle (ltr, rtl) |
| P3.0 | Faster CI | P0.4 | done | 2026-09-30 | Story tests, accessibility and visual in 4 parts each on 12 machines: CI 39 → 6 min; the visual test fails on a failed story before any screenshot |
| P3.0a | Local baselines match CI | P3.0 | done | 2026-10-01 | Cause: the unshipped system monospace (WenQuanYi first, Liberation Mono after the first screenshot) made the Tokens page 77px taller after one capture; JetBrains Mono is now shipped |
| P3.1 | DataTable core | P2.7, P2.8 | done | 2026-09-30 | Owner: old look (sm text, sunken header, sort asc → desc → asc with 13px icons in text.brand, skeleton first load and 14px refetch loader, sticky totals); filters only choose the empty state, no `filterable` flag; TanStack Table 9.2.4 |
| P3.2 | Table on phones, large lists, column resize | P3.1 | done | 2026-09-30 | Owner: cards below 48em by real branching; the old resize handle (9px strip, 3px line, arrows 10/40px, reading direction) plus a +/− popover without dragging (WCAG 2.5.7); TanStack Virtual 3.14.13; 1,000 rows: select 13–16ms (4× slower CPU 100–146ms) |
| P3.2a | Fixes from the owner's Storybook review | P3.2 | done | 2026-10-01 | Option lists border-box, with a story-test check for sideways overflow; ConfirmDialog button follows its tone; 4px between label and control; cards and KeyValueList redesigned (rows layout, groups, stacked option) |
| P3.3 | Filters and search | P3.1 | done | 2026-10-01 | Owner: old Toolbar layout (search 260px, bottom-aligned row), labelled inline filters, drawer from the end 320px, pills with "Clear all", phone "Sort" menu; six filter kinds; SelectField `clearable` |
| P3.4 | Editable grid | P3.1, P2.3 | done | 2026-10-01 | Owner: cells always fields (the DS fields without frames), focus inset line on a neutral cell, Enter as Excel, Ctrl/Cmd+Enter and +Delete, messages under the row, totals with SettlingValue under a 2px line; ten lines by keyboard in ltr and rtl |
| P3.5 | Form layout | P2.2, P2.7 | done | 2026-10-01 | Owner: FormSection as the SectionCard card with a field grid, collapsible variant; tab errors as a 13px danger AlertTriangle; actions top and a sticky bottom bar while the form scrolls; `focusFirstInvalid`; unsaved-changes guard; FormWizard; `@veljaos/ui/form` on React Hook Form 7.89.0 (optional peer) |
| P3.6 | Polish from the owner's review | P3.5 | done | 2026-10-02 | Less blue (neutral selection, sort header, bulk bar, avatar; `border.selected`), text direction from content (`unicode-bidi: plaintext`), neutral default Alert, EditableGrid cards on phones, FilterBar summary / From–To / actions above, bottom bar by IntersectionObserver, FormTabs in the card, Chip-style multiple toggles, Spinner and Accordion; 2026-10-05: EditableGrid keeps focus, typed text and pending dots across a layout change (the Linux visual flake), direction gaps from the baseline review, baselines |
| P3.6a | consumer-check covers `@veljaos/ui/form` | P3.5 | done | 2026-10-02 | Separate pull request #48 (protected files, merged by the owner): React Hook Form installed beside the packed tarballs, a bound field type-checked and rendered |
| P3.6b | Branch hygiene | P3.6 | done | 2026-10-05 | Rule W16 in AGENTS.md (owner): a step's branch is deleted when its pull request is merged or closed; `main` is the only branch at the end of every phase. The six branches of #29–#34 (combined into #35) and `bp/P3.6-polish` were checked against `main` and removed |
| P3.6c | Field polish from the owner's P3.6 review | P3.6 | done | 2026-10-05 | Free text and chosen options take their direction from their content (`dir="auto"`) at the page's start side, codes left to right (TextField `direction`); FilterBar number range: one label, "From" / "To" inside the fields (`startText`); empty date range "From – To" without a lone dash |
| P3.6d | FilterBar amount range | P3.6c | done | 2026-10-05 | The currency once in the label ("Total (EUR)"), "From" / "To" and the number in the fields; fields grow with a long amount and the pair wraps, never cut |
| P3.7 | Liro brand assets | P3.6 | done | 2026-10-05 | The owner's logo in `@veljaos/tokens/brand/` (exported `./brand/*`, checked by `brand.test.ts`); Storybook's title, wordmark and favicon; "Foundations / Brand"; rule D18 (logo through props) |
| P4.0 | Baselines on CI, Storybook and brand follow-ups | P3.7 | done | 2026-10-06 | Workflow `Baselines`: twelve machines, one artifact of new and changed images; Storybook favicon (Windows path bug), 28px sidebar wordmark, no onboarding checklist; Brand page shows each surface's own versions; `BrandLockup` (owner: the app name as text, no icon); tab favicon without the tile, simplified dots, lighter in dark browsers; no ready-made "Liro Business Apps" file in the owner's folder |
| P4.1 | Application shell | P2.6, P2.7 | done | 2026-10-06 | Owner's values: 56px header, lockup, xs breadcrumbs, search with Ctrl K, red unread dot without a number, company switcher (search above 7, in the user menu on phones), avatar user menu, centred module tabs as links, slots, phone bottom bar with safe areas, skip link; no sidebar |
| P4.2 | Home (launchpad) | P4.1 | done | 2026-10-06 | Owner's values: cards with the icon in a sunken square that turns blue on hover, plain counter, locked cards, 1–9 and arrows, editing mode (move, hide, drag, hidden list with Show), skeletons |
| P4.3 | List and worklist templates | P3.3, P4.1 | done | 2026-10-06 | Owner's values: one list card (saved views, FilterBar, table edge to edge), hidden page title where a tab names it (PageHeader), column chooser without dragging, quick preview (click/Space; Enter opens), worklist 380px + detail from 62em, Back / Next item below |
| P4.4 | Detail and record form templates | P3.5, P4.1 | done | 2026-10-06 | Owner's values: key figures (20px, colour only for state), sticky section bar like module tabs, side column 300px from 75em, the old 28px back button "Back to <list>"; sections as SectionCards; record form with top and bottom actions and the unsaved-changes guard on back |
| P4.5 | Document template | P3.4, P4.4 | done | 2026-10-06 | Owner's values: lifecycle bar (dots and lines, error step with reason, one line on phones), counterparty only, lines card without title, totals block on the baseline (rows from props, groups, large final row), side panels collapsible one by one and as a column, both reported |
| P4.6 | Report, dashboard and settings templates | P4.1 | done | 2026-10-06 | Owner's values: one blue and greys for charts (categorical opt-in, validated, teal 5 at 2.8:1 covered by legend and table), StatCard, settings rows saved at once with Saved/error, report parameters collapsing to a summary; charts on Recharts 3.10.1 directly, as shadcn Chart is (its wrapper not copied: our own card, legend, tooltip and table); settings width 960px chosen, reported |
| P4.7 | Status pages and sign-in shell | P4.1 | done | 2026-10-07 | Owner's values: StatusPage for 401, 402, 403, 404, 500 (case number), maintenance, suspended — tone square 84px (warning, neutral or danger, never blue), the bare code above the title; AuthShell 420px card on surface.sunken, lockup above, no frame on phones; SettingsPage and its tabs start-aligned (Tabs `align`); dashboard: "Top 5 customers" horizontal bars beside the donut, donut sized to its card |
| P4.7a | Charts catalogue | P4.7 | done | 2026-10-07 | shadcn Chart copied into `primitives/chart.tsx` and adapted; the four P4.6 charts rebuilt on it plus Pie, Radar, Radial and ChartSeriesToggle; every shadcn variant as a story with Serbian data; `@veljaos/ui/charts` subpath (Recharts only there); keyboard, motion, states, phones; "Choosing a chart" page |
| P4.7b | Small-size favicon | P4.7 | done | 2026-10-07 | The owner rejected the three pixel-grid variants and drew the small mark from the logo's rule; his favicon.svg, favicon.ico (16, 32, 48) and 16/32px PNGs copied as they are; Storybook links favicon.svg first and favicon.ico as the fallback, both `?v=2` |
| P4.7c | Fixes from the owner's P4.7a review | P4.7a | done | 2026-10-07 | Light warning.solid orange6 (icons only, on raised surfaces; tested); Tabs start-aligned by default (D16: only the shell's module tabs centred); believable daily data, equal ticks; lines straight up to 31 points with dots up to 12; categorical palette without status hues (blue, magenta, purple, teal, indigo; validated, ≥3:1, Palette story); radial labels with values in one blue; `format.percent` (CLDR) |
| P4.8 | Example screens | P4.2–P4.7c | done | 2026-10-07 | Storybook "Examples": sign in, home, invoice list, invoice F-2026-0412, overview, approvals, employee record, 404 — one dataset (the same invoice and totals in list, document and overview), linked through LiroProvider's `linkComponent` into one walk-through; desktop and phone, both themes and directions; public entry points only |
| P4.9 | Fixes from the owner's Storybook review | P4.8 | done | 2026-10-08 | Company switcher for thousands, notifications panel and page, record view/edit mode, approvals with reasons, counts through format, flat lists on phones, live launchpad drag, charts table in RTL; the class fixed, not the instance |
| P4.9d | Follow-ups to the owner's review of #68 | P4.9 | done | 2026-10-08 | Full-screen company sheet with focus return, one dialog inset, Cancel focused in confirmations, phone toasts above the bottom bar, units of measure as their own value, SettlingValue test on Windows |
| P5.1 | History, comments and messages | P2.8 | done | 2026-10-09 | HistoryList, Message family, MentionCombobox and Questionnaire on the shadcn primitives (Bubble, Marker, Message, Message Scroller, Questionnaire; `@shadcn/react` 0.3.1); examples F-2026-0410 with history and comments, employment contract questionnaire |
| P5.2 | Presence and agent marking | P2.8 | done | 2026-10-09 | PresenceAvatars, AgentMark |
| P5.3 | Connection, environment and session markers | P4.1 | done | 2026-10-09 | ImpersonationBar, OfflineIndicator, EnvironmentMarker, ConnectionState, AppShell `banners` and the order of the shell markers (B); AgentQuestion for agent interactions (A) |
| P5.4 | Delivery and progress status | P2.8 | done | 2026-10-09 | StatusTimeline (LifecycleBar's states, a next-step block), JobProgress (inline and in a Dialog, generalising "Progress in a dialog") |
| P5.5 | Files and document frame | P2.5 | done | 2026-10-09 | FileDropzone, AttachmentList (per-file control slot), DocumentFrame with its protocol in `docs/document-frame.md` |
| P5.6 | Sign-in building blocks | P2.2 | done | 2026-10-09 | EmailFirstForm, ProviderSignInButtons (Microsoft and Google marks in `provider-marks.tsx`), PasswordField, CodeInput, RecoveryCodes, SessionList; Sign in example with providers |
| P5.7 | Kanban board | P2.8 | done | 2026-10-09 | KanbanBoard with pointer drag, keyboard and menu moving, phones one column at a time; Tasks example |
| P5.8 | Calendar and scheduling | P2.3 | done | 2026-10-10 | CalendarView (day, week, month, agenda), ResourceSchedule (drag, keyboard, "Move to…"), SlotPicker, Timetable; LiroProvider `timeZone` |
| P5.9 | Tree | P2.8 | done | 2026-10-10 | TreeView and TreeTable: lazy children, WAI-ARIA tree keys mirrored in RTL, selection with tri-state, virtualised |
| P5.10 | Touch mode and POS | P5.3 | done | 2026-10-10 | LiroProvider `density="touch"` (44px targets, overlays included), NumericKeypad, ProductGrid, CartPanel, PaymentDialog, ReceiptPreview, PosShell |
| P5.11 | Scanner-first warehouse | P5.3 | done | 2026-10-10 | ScanField (scanner burst vs typing), QuantityStepper (exact decimal strings), PickList and StockCount at 360px, offline queue |
| P5.12 | Learning | P5.1, P5.15 | done | 2026-10-10 | CoursePage (outline, progress, lessons, completion with the certificate), QuizResult; quizzes on Questionnaire |
| P5.13 | Attendance and quick marking | P3.4 | done | 2026-10-10 | AttendanceGrid in code mode (one key per mark, bulk and range marking, gradebook); one pattern with P5.24 |
| P5.14 | Sensitive fields | P2.8 | done | 2026-10-10 | MaskedValue: reveal with a reason, "access logged", auto-hide, not allowed with a reason |
| P5.15 | Print templates | P4.5 | done | 2026-10-10 | PrintPage (A4, header and footer on every page, page numbers, paper always light) and PrintDocument, PrintCertificate, PrintGradeReport, PrintFinding |
| P5.16 | Portal shell | P4.1 | done | 2026-10-10 | PortalShell for patients, parents, students and customers: tabs on desktop, bottom navigation on phones |
| P5.17 | Industry example screens | P5.8–P5.16 | done | 2026-10-10 | Examples: appointment booking, POS checkout, warehouse picking and stock count, school timetable, attendance and gradebook, a safety course, printouts |
| P5.18 | Complex documents | P4.5, P3.4 | done | 2026-10-09 | EditableGrid line types, "Add line ▾", lookup / tax category / unit columns, line details, LookupCreateDrawer, a row window for 300 positions (measured) (D1); DocumentPage block order, DocumentReferences, DataTable line types, DocumentTotals recap / deductions / exchange / footnotes, DocumentCurrency, DocumentNotes, DocumentSpecification, corrective documents, cancellation (D2); examples F-2026-0419, IS-2026-007, F-2026-0418, F-2026-0415, KO-2026-0009, F-2026-0407 + ST-2026-0004 |
| P5.19 | Catalogs at scale | P3.1, P2.2 | done | 2026-10-09 | LookupField (recent, kinds, create, one-off, Search all…, virtualised) (D1); LookupDialog, ImportWizard, BulkEditDrawer, DuplicateWarning, inactive records by views and a neutral badge (E); customers example with 50,000 records and import |
| P5.20 | Registers and official forms | P4.4, P5.1 | done | 2026-10-09 | RegisterPage and StatutoryFormPage; examples VAT return September 2026 and work-injury register 2026 (and 5,000 entries) |
| P5.21 | Common business processes | P3.4, P4.3 | done | 2026-10-09 | PermissionMatrix (users and roles composed from DataTables), SetupChecklist, SignerList and SigningPage (C); MatchingView, BalanceBar, PeriodicRunPage (F); examples users and roles, setup, contract signing, bank statement 188, journal entry NK-2026-0912, payroll September 2026 |
| P5.21a | TanStack Virtual for every list | P5.21 | done | 2026-10-09 | The company switcher, LookupField, MatchingView and EditableGrid's row window on `useVirtualizer` with the shared window rules (600px, the focused or active row kept); the custom virtualiser removed (measured) |
| P5.23 | Owner's review of Phase 5 part 1 | P5.21a | done | 2026-10-10 | Bank statement worked line by line on WorklistPage (CandidateList; MatchingView removed); draft headers as the invoice draft's; one tab gap; bulk bar a row of its own; catalogue lists sort and multi-select; multi-step flows on phones; compact one-line alerts; Cancelled danger with one status map; one register pattern; a correcting document's source in the header; room for the description column; visual stories static (`interaction` tag, `scripts/static-stories.mjs`, initial-state props); a steady view when content shrinks (`useSteadyBottom`) |
| P5.21b | Overscan per component | P5.21a | done | 2026-10-10 | EditableGrid draws 240px around the view (page jump −25%, about 400ms on the owner's laptop), light lists keep 600px (measured) |
| P5.22 | Rich text | P2.2, P5.1 | done | 2026-10-10 | `@veljaos/ui/rich-text` on Tiptap 3.31.4 (MIT packages only): RichTextField, RichText, merge-field pills, @mentions, JSON plus sanitized HTML |
| P5.24 | Working time | P5.13, P4.3 | done | 2026-10-10 | AttendanceGrid timesheets, ClockRecordList, ShiftPlanner, MyShifts, ShiftSwapDialog, WorkingTimeBalance; examples Kvadrat Gradnja, Prodavnica 12, Dom zdravlja |
| P5.24a | Working time: rotation and swap follow-up | P5.24 | done | 2026-10-11 | Apply rotation opens with people chosen, shows what it adds and the application's checks; MyShifts swap defaults |
| P5.25 | Floor plans and seating | P5.10, P5.8 | done | 2026-10-11 | FloorPlan (plan and list, edit mode), SeatingChart, RoomRack, ResourceSchedule by days; restaurant, café, event and hotel examples |
| P5.25a | Floor plans: background, polygons, three more places | P5.25 | done | 2026-10-11 | FloorPlan `background`, polygon areas, `level`, kind `place`; warehouse, hospital ward and office examples |
| P5.26 | Diagrams | P2.1 | done | 2026-10-11 | `@veljaos/ui/diagram` on React Flow 12.12.0 and dagre 3.1.1 (MIT): view, edit, run; approval workflow and orchestrator run examples |
| P5.27 | Legal information | P4.5, P4.3, P5.15 | done | 2026-10-11 | LegalText, LegalContents, LegalCompare, LegalActPage with its panels, PrintLegalAct, LegalSearchPage, GazetteIssues, FilterBar tree kind; illustrative law, by-law, practice and Kvadrat Gradnja's rulebook |
| P5.28 | Owner's review of Phase 5 part 2 | P5.27 | done | 2026-10-13 | Phones never scroll sideways (PhoneFrame as the screen, dialogs as bottom sheets, `phone-overflow.spec.ts`); day and month names and week start only from the locale (`numericFormat`); selects over 10 options searched; table headers sticky below the shell, first column at the start (DataTable `stickyHeader` by default); one-record dialogs with `subject`; neutral actions on toned boxes; ChangeConfirmDialog and "Notify …" choices; one "now" marker; Examples sidebar two stories per screen; StatutoryFormPage as the real form grid; printouts as simple as a Stripe invoice with electronic signature fields; POS fiscal flows and open tabs on tables; floor plans without walls, labels never cut, one area at a time, phones on the list, moves confirmed with the free tables or beds |
| P5.29 | Admin and Superadmin views | P5.28 | done | 2026-10-14 | HealthList; ImpersonationBar `note`; a tenant's administration (overview, sign-in activity with masked addresses, audit log, security, integrations) and the Superadmin in one shell (system status, network, incidents on DocumentPage, security events on WorklistPage, tenants with an audited read-only "view as", announcements with a Banner preview); `numericFormat` follows the provider's time zone |
| P5.30 | Helpdesk | P5.28 | done | 2026-10-14 | SlaTimer, ReplyComposer (reply or internal note, saved replies, files, article links), internal notes in a conversation, RichTextField `ref` handle, DataTable rows by the arrows; SatisfactionRating, HelpfulFeedback, LinkSuggestions, PageContents, SearchResultList, CategoryGrid, RichText `headingIds`; the agents' inbox, ticket and overview under `/helpdesk`, the customer portal under `/support` and the knowledge base in both |
| P5.31 | Document inbox with recognition | P5.30 | done | 2026-10-14 | PageViewer (pages as images, a highlighted region in page units), RecognizedField (the application's confidence, "Show where it was read"); the document inbox and its review document by document (Enter confirms; recognising, failed, locked PDF, unreadable scan, duplicate, new supplier); merge values filled in by RichText, RichTextField and ReplyComposer; every sticky first column on its own layer |
| P5.32 | Accountant's workspace for many clients | P5.30 | done | 2026-10-14 | Built from the library: 214 clients by urgency, the deadlines calendar (CalendarView), a client's month close (SetupChecklist), the company switcher at 214 clients, "Ask the client" in a Drawer and the client portal's request page |
| P5.33 | IOS: statements of open items | P5.30 | done | 2026-10-14 | ValueComparison; the partners' statements (prepare, Liro Bridge or e-mail, preview, reminders), the partner's side in Liro's partner portal (confirm or dispute), a disputed statement reconciled line by line |
| P5.34 | Liro Assistant (AI) | P5.30 | done | 2026-10-14 | AssistantAnswer, ProposedAction, AssistantComposer, AssistantPanel and AskPage: answers as the application's data (never a model), labelled AI-generated, tables, a chart slot, sources, a proposed action that waits for Confirm, no access in the application's words; AgentMark `label` |
| P5.35 | Employee portal | P5.30 | done | 2026-10-14 | Built from the library (PortalShell): home, payslips and the payslip's PDF, leave with its approval and a new request, shifts, documents to sign, my details with change requests |
| P5.36 | Subscription and billing | P5.30 | done | 2026-10-14 | PlanComparison and UsageMeter; the subscription (plan, usage, next invoice, payment method, invoices and their PDF), change plan with the proration, cancel; trial, past-due and cancelled banners; one set of plan names (Start, Business, Pro) |
| P5.37 | Project timeline (Gantt) | P5.30 | done | 2026-10-14 | `@veljaos/ui/gantt` on SVAR React Gantt 2.7.3 (MIT edition): phases, tasks, milestones, dependencies, budget against spent, the one now marker; drag and the rows' dialogs reported through `onChange`; mirrored in right to left; phones a list by phase |
| P5.38 | E-mail and notification templates | P5.30 | done | 2026-10-14 | EmailPreview (Desktop / Phone width, Light / Dark mail client); the template editor in three languages with the merge values' preview, versions and send test |
| P5.39 | Blog | P5.30 | done | 2026-10-14 | ArticleList, NewsletterSignup, ShareLinks and ArticlePage; Liro's public blog (categories, tags, search, an article with its contents) and its authoring (posts, editor, schedule, publish, preview) |
| P5.40 | IPS NBS QR and payment orders | P5.10, P5.15 | done | 2026-10-14 | QrCode on `qr` 0.7.2 (every illustrative code now real), the IPS NBS QR text with its problems by field, PaymentOrderForm (Serbian forms 1, 2, 3); payment orders and the till's instant payment (PT shown, PK scanned) |
| P5.41 | Maps | P5.24 | done | 2026-10-14 | `@veljaos/ui/map` on Leaflet 1.9.4 (SVG, no tiles needed): AreaMap (areas, the list, "Falls in: …"), LocationCheck (the application's verdict, "Use my location" through `onLocate`), RegionChart (a choropleth in the charts' card, "No data" hatched); property-tax zones, a site check-in, revenue by country and by illustrative region |
| P5.42 | Organisation chart and hierarchies | P5.9 | done | 2026-10-14 | HierarchyChart (HTML, CSS-border lines, mirrored in right to left; "+N" toggles, stacked leaves, a unit alone, search, a WAI-ARIA tree, Fit to width, TreeView on phones, a paper mode); Kvadrat Gradnja's organisation of forty people and Kvadrat group's ownership |
| P5.43 | Files and folders | P5.5, P5.9 | done | 2026-10-14 | FileBrowser with FileGrid, FolderPickerDialog, NameConflictDialog, FileNameDialog, ShareDialog, VersionList, FilePreview and FileDetails (upload of files and folders, drag onto a folder with the menu's way, list only on phones); Kvadrat Gradnja's company documents and Knjigovodstvo Jelić's client folders shared with the client portal; ActivityList isolates its times |
| P5.31a | The owner's decisions after P5.31–P5.43 | P5.41 | done | 2026-10-15 | Maps follow the law of the Republic of Serbia (Kosovo and Metohija within Serbia, tested); the phone test no longer waits on a trigger whose dialog closed |
| P5.31b | IPS QR codes checked with the NBS validator | P5.31a | done | 2026-10-15 | Every IPS code the stories and examples show accepted by the National Bank of Serbia's validator; the accepted texts locked in a unit test |
| P5.44 | Chart of accounts and the account card | P5.9 | done | 2026-10-16 | ListPage + TreeTable chart of accounts (search, details in a Drawer); the account card on ReportPage + DataTable (opening and turnover lines, running balance, every document a link) |
| P5.45 | Trial balance and financial statements | P5.20, P5.44 | done | 2026-10-16 | The trial balance and the balance sheet / income statement on the StatutoryFormPage grid (Opening / Turnover / Closing × Debit / Credit, compare with 2025, the previous year beside, notes through `StatutoryCell.content`); drill-down trial balance → card → document |
| P5.46 | Cash book | P5.20 | done | 2026-10-16 | Cash book by day (DataTable line types), cash receipt and payment slips, the application's cash-limit warning |
| P5.47 | Fixed assets | P5.21 | done | 2026-10-16 | Register (ListPage), asset card (DetailPage: value history, schedule), September depreciation run (PeriodicRunPage), disposal (IrreversibleConfirmDialog) and sale |
| P5.48 | Travel orders | P5.5 | done | 2026-10-16 | Travel order (RecordFormPage), settlement with receipt photos (FileDropzone `camera`), per-diems and DocumentTotals, approval (WorklistPage) |
| P5.49 | Purchasing chain | P5.18 | done | 2026-10-16 | Purchase order, goods receipt (Ordered / Difference / Received), three-way match (ValueComparison with three sources) linked to the document inbox |
| P5.50 | Sales chain | P5.18 | done | 2026-10-16 | Quote → order → delivery note → invoice, the next one in one click (SplitAction), the chain in RelatedDocuments |
| P5.51 | Item card and transfers | P5.11 | done | 2026-10-16 | Item card (balance per warehouse, movements with running balance and value) and transfer MP-2026-0031 |
| P5.52 | Production | P5.9, P5.37 | done | 2026-10-16 | Bill of materials (TreeTable, a semi-finished good with its own bill), work order (planned / used, good and scrap), the production plan on Gantt |
| P5.53 | Retail price calculation (kalkulacija) | P3.4 | done | 2026-10-16 | Retail price calculation on EditableGrid (only the retail price editable), DocumentTotals with VAT by rate, the price change |
| P5.54 | Price lists, discounts and promotions | P4.3 | done | 2026-10-16 | Price lists, customers' own prices, promotions with their validity, discount rules |
| P5.55 | Compensation, cession and assignment | P5.21 | done | 2026-10-16 | Compensation, cession and assignment as one DocumentPage pattern (`counterparties`), both sides' items, what remains, each party's signature |
| P5.56 | Late-payment interest | P4.6 | done | 2026-10-16 | Interest per invoice and rate period, the illustrative rate table, the interest note |
| P5.57 | Stocktaking lists | P5.11 | done | 2026-10-16 | Stocktaking list (Book / Difference / Counted), the count on group I's handheld, the commission's signatures, posting the differences |
| P5.58 | Budget and cost centres | P5.9 | done | 2026-10-16 | Plan against actual by cost centre and project (TreeTable, bar chart, state in words), drill-down to the entries |
| P5.59 | Foreign currency | P5.18 | done | 2026-10-16 | Illustrative NBS middle rates, FX accounts, exchange-rate differences posted (the foreign-currency invoice is group D2's F-2026-0415) |
| P5.60 | Loans and leasing | P4.4 | done | 2026-10-16 | Loans and leases (ListPage), a loan with KeyFigures, the outstanding principal chart and the repayment schedule |
| P5.61 | Service and author contracts | P5.21 | done | 2026-10-16 | Service and author contracts (RecordFormPage) with the application's calculation, the monthly run (PeriodicRunPage) |
| P5.62 | My profile | P5.6 | done | 2026-10-16 | My profile on SettingsPage (language in its own name, theme, two-factor with QrCode, CodeInput and RecoveryCodes, passkeys, SessionList through `SettingsSection.content`) |
| P5.63 | Sign-in flows | P5.6 | done | 2026-10-16 | Sign-in password, two-factor code, forgot and new password, accepting an invitation, account locked, session expired — AuthShell, EmailFirstForm, PasswordField, CodeInput, StatusPage |
| P5.64 | Recruitment | P5.7 | done | 2026-10-16 | Job openings and a posting, candidates on KanbanBoard (reject with a reason, hire after an offer), the candidate, interview scheduling (SlotPicker), scorecards (RadioGroupField) |
| P5.65 | Onboarding a new employee | P5.21 | done | 2026-10-16 | HR's checklist (DataTable by owner and due date), the new employee's portal (SetupChecklist), documents to sign (SigningPage), the salary account |
| P5.66 | A document from a JSON definition | P5.5, P5.21 | done | 2026-10-16 | DefinedForm (new): the form from the JSON definitions with conditions, the application's PDF preview in DocumentFrame, the registry number, signing; eleven document types as data |
| P5.67 | CRM | P5.7 | done | 2026-10-16 | The pipeline on KanbanBoard (lost with a reason, won with an accepted quote), the deal, the contact's timeline, activities as a list and a calendar |
| P5.68 | Registry book (delovodnik) | P5.20 | done | 2026-10-16 | The registry book (RegisterPage), an entry linked to documents and files, a new entry |
| P5.69 | Archive book and retention | P5.20 | done | 2026-10-16 | The archive book, retention periods per type, what expires, the disposal list with its minutes |
| P5.70 | Meetings of company bodies | P5.66 | done | 2026-10-16 | Meetings, the next meeting with the agenda and materials, attendance and quorum, votes per item, minutes and decisions signed |
| P5.71 | Contracts | P5.20 | done | 2026-10-16 | The contracts register with expiry and renewal in words, a contract with versions and linked documents |
| P5.72 | Patient chart | P5.14 | done | 2026-10-16 | Jovana Nikolić's chart (visits by date with a visit's drawer, masked diagnoses and findings, medicines, the latest results with the laboratory's ranges and verdicts, her allergy) and her lab results over time (LineChart with the limits as data), opened from group H's clinic |
| P5.73 | University | P5.17 | done | 2026-10-16 | The student portal, exam registration (CandidateList, the fee, unavailable exams with reasons), grades, exam periods, the examiner's exam records and the exam record (DocumentPage, EditableGrid, SignerList, locked once signed) |
| P5.74 | Field service and maintenance | P5.11 | done | 2026-10-16 | Work orders, a technician's work order on the phone (checklist, photos, parts used, offline, the customer's signature with SignerList), the office's read-only view, the preventive maintenance plan |
| P5.75 | Fleet | P4.3 | done | 2026-10-16 | Vehicles (registration and the next service due in words), a vehicle with registration, insurance, services, fuel and reminders ("Add fuel entry"), the reminders list ("Mark as done…") |
| P5.76 | Property management | P4.3 | done | 2026-10-16 | Units on RoomRack and as a list, tenants, leases with renewal, the monthly rent run (PeriodicRunPage), maintenance requests, the tenants' portal (report a problem, my requests, invoices) |
| P5.77 | Pivot analysis | P3.1 | done | 2026-10-21 | Pivot (new, `@veljaos/ui/pivot` on TanStack Table after the library evaluation): fields to rows, columns, values with the application's aggregations and filters by buttons and menus; the application's result as a treegrid with subtotals and totals, drill-down and export; Kvadrat Gradnja's cost analysis and Pekara Zlatni klas's sales analysis |
| P5.78 | Automation rules | P5.26 | done | 2026-10-21 | RuleBuilder (new): When / If / Then from the application's triggers, fields, tests and actions, groups, keyboard reordering, the rule in words; Kvadrat Gradnja's rules list (on / off), a rule with its last failed run, edit with test run and problems, the run log |
| P5.79 | Merging duplicates | P5.19 | done | 2026-10-21 | ValueComparison `chosen` / `onChoose`: the values to keep per differing row; Beton Mix d.o.o. and "Beton-Mix doo" merged (which record stays, what will happen, irreversible confirmation) and two cement items |
| P5.80 | Scheduled reports | P4.6 | done | 2026-10-21 | Scheduled reports (ListPage, DetailPage, RecordFormPage): schedule, recipients and outside addresses, format, the application's next runs, last runs (sent, failed, skipped), Send now, pause, the e-mail preview |
| P5.81 | Customizable dashboard | P4.6 | done | 2026-10-21 | DashboardGrid (new): the director's overview — add from the catalogue, remove, resize, rearrange by drag, keyboard or menu; saved layouts (save as, rename, default, delete); phones by the menus |
| P5.82 | AML client risk assessment | P5.1 | done | 2026-10-21 | The client's risk assessment (DetailPage: risk in force, the application's score and factors, an override with a reason) and the risk review (Questionnaire with branches, sent for the application's assessment) |
| P5.83 | Know your customer (client file) | P5.42 | done | 2026-10-21 | The AML clients by risk, review due and file state; the client file (identification with MaskedValue, documents with validity, owners on HierarchyChart with shares and an undisclosed owner, PEP, source of funds, review history) |
| P5.84 | Screening | P5.33 | done | 2026-10-21 | Screening matches decided one by one (WorklistPage, the client's record beside the list entry with ValueComparison, True match / False positive with a reason), a client's screening and re-screening history |
| P5.85 | Transaction monitoring alerts | P4.3 | done | 2026-10-21 | The alert queue (WorklistPage: rule, client, amount, risk, age, assignee), an alert with its transactions and the client's profile, close with a reason, escalate to a case |
| P5.86 | AML case management | P5.18 | done | 2026-10-21 | A case (DocumentPage): timeline, linked alerts, transactions, documents, notes, tasks, the decision proposed and approved by a second person (SignerList, four eyes) |
| P5.87 | Suspicious transaction report | P5.66 | done | 2026-10-21 | The suspicious transaction report from the authority's field definitions (DefinedForm), review and submission states, what was sent and when; confidential throughout |
| P5.88 | AML overview and obligations | P4.6 | done | 2026-10-21 | The AML overview (DashboardPage: clients by risk, reviews due, open alerts and cases, ageing) and obligations (the compliance officer and deputy, training, procedures, retention, the audit trail) |
| P5.89 | Consolidate to floorplans | P5.88 | done | 2026-10-23 | Seven floorplans (`docs/floorplans.md`); 26 canonical example screens, one story file per floorplan; every other screen a recipe (`docs/recipes.md`) |
| P5.90 | The owner's review, applied to the floorplans | P5.89 | done | 2026-10-23 | Twenty-one review items fixed as classes: one sticky header band in pure CSS, the line editor rebuilt (phones one card per line), the bank statement automatic first, TimeField, CatalogPicker, schedules on phones as today's lists, the till and restaurant for a first-day waiter, toasts that never block |
| P5.91 | P5.90 follow-ups: the till's renamed props, the first column's row lines | P5.90 | done | 2026-10-23 | The PosShell rename announced in the release notes with its migration; a sticky first column never loses a row line (its cells on a `translateZ(0)` layer, placed on whole pixels) |
| P5.92 | Templates consolidated to the core | P5.91 | done | 2026-10-27 | Eighteen core page templates; the domain templates (legal act and search, course, article, ask, picking, stock count, payment order, signing, files) and four printouts composed from them and the components, as recipes; four to six sidebar stories per template |
| P5.93 | The owner's review, round 4 | P5.92 | done | 2026-10-28 | Forty-nine findings fixed as classes: read only as the one non-editable field state, visible loading and useful empty states, toasts with a close button and Undo in place, the library's tooltips, scrolling tab rows, the portal home, the till's payment without scrolling, merging, sharing, the now marker's time, a readable Gantt, simpler pivot, rules as blocks, CodeBlock, the assistant's work display, seven new charts and the maps of Serbia |
| P5.94 | The owner's review, round 5 | P5.93 | done | 2026-10-29 | Twenty findings fixed as classes, in two pull requests: A (items 1–18 and 20) and B (item 19, the bank statement as a worklist) |
| P5.95 | Printed documents leave the Design System | P5.94 | done | 2026-10-29 | PrintPage, PrintDocument, the print parts, print-logic and ReceiptPreview removed; printed documents are liro-folio's PDFs; the examples show them as liro-folio's output |
| P5.96 | The owner's review of P5.94–P5.95 | P5.95 | done | 2026-10-30 | Questions and answers as a page of their own in every portal; a map names an area only while it is pointed at; "All" first in every worklist's state chips; the Launchpad's story named "Home" |
| P6.1 | Full language and direction matrix | Phases 1–5 | todo | | |
| P6.3 | Performance budget | P4.8 | todo | | |
| P6.6 | Full cleanup | P6.3 | todo | | |
| P6.5 | Release 1.0.0 | all | todo | | |

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
- `@veljaos/tokens`, `@veljaos/ui`, `@veljaos/eslint-config` with `exports` maps; tsup for JavaScript and type declarations; Tailwind CLI producing `@veljaos/ui/styles.css`; `files` fields that include everything needed at runtime (Appendix B.10).
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
- The `protected-files` check of rule 10, covering every file class it names, including `.claude/settings.json`.

**Done when** all jobs run on every pull request; a pull request changing `eslint.config.mjs` or `.claude/settings.json` without the protected-files section fails.

### P0.5 — AGENTS.md and decisions.md
**Do**
- `AGENTS.md`: sections 1, 2, 5 and 6 of this plan condensed into working rules; the component and template list as it grows; how to add a component; how to refresh baselines.
- `docs/decisions.md`: the versions chosen in P0.1–P0.4 with one line each; every lesson of Appendix B copied as a dated entry, so the reasons survive.

**Done when** both files exist and every rule in `AGENTS.md` names the lint rule or test that enforces it, or says "enforced by review".

**End of Phase 0:** publish `0.1.0-alpha.0`; report to the owner with how to open Storybook locally (`pnpm storybook`).

---

## Phase 1 — The look (about 1–2 weeks)

### P1.1 — Tokens: values, meanings, themes
**Do**
- **Values** (`@veljaos/tokens`): the colour ramps, spacing, radius, shadows, motion and layout sizes of Appendix A, exactly.
- **Meanings**: the semantic tokens of Appendix A.2 as CSS variables for light and dark (`--liro-surface-page`, `--liro-text-secondary`, `--liro-status-danger-fg`, …).
- **Tailwind theme** (`theme.css`): semantic utility names (`bg-surface-raised`, `text-secondary`, `border-strong`, `bg-status-danger-bg`, `text-brand`, …).
- **shadcn compatibility**: shadcn's variables (`--background`, `--foreground`, `--primary`, `--destructive`, `--muted`, `--border`, `--input`, `--ring` …) are **mapped onto Liro meanings**, so copied primitives look Liro without edits. Liro components use Liro names.
- `tokens.json`: the same values as data, for non-React renderers (PDF and e-mail templates in `liro-core`).
- Lint rule in `@veljaos/eslint-config`: no raw colour utilities (`bg-red-500`, `text-gray-700`), no arbitrary colour values (`bg-[#…]`, `text-[rgb(…)]`), no hex literals outside `packages/tokens`.
- Storybook page "Tokens" showing every value and meaning in both themes.

**Done when** the tokens page renders; the lint rule has fixture tests; light and dark switch everything without a single component rule.

### P1.2 — Typography and fonts for seven scripts
**Do**
- Font sizes, weights, line heights, letter spacing and headings of Appendix A.5.
- Fonts shipped with `@veljaos/tokens` as CSS with `unicode-range` subsets: Noto Sans (Latin, Cyrillic, Greek), Noto Sans Arabic, Noto Sans Hebrew, Noto Sans SC, Noto Sans TC, Noto Sans JP; the brand face for the wordmark and status pages. Each subset downloads only when text needs it.
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

**End of Phase 1:** `0.1.0-alpha.1`; report.

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

**End of Phase 2:** `0.1.0-alpha.2`; report.

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
**Do** `FormSection`, `FormTabs` (a tab with an error shows an indicator and focus moves to the first error), `FormActions` at the top **and** a sticky bar at the bottom that appears only when the form scrolls (Appendix B.8), `useUnsavedChangesGuard`, `FormWizard` (per-step validation hooks, no re-entry of data). Optional `@veljaos/ui/form` binding for React Hook Form.

**End of Phase 3:** `0.1.0-alpha.3`; report.

---

## Phase 4 — Screen templates (about 3–5 weeks)

Templates are layouts with **slots**; they contain no data logic.

### P4.1 — Application shell
**Do** `AppShell`: header with product name and logo (props), search trigger (opens `CommandPalette`), slots for a company switcher, notifications and the user menu; **module tabs** inside a module (navigation is a launchpad plus tabs, not a sidebar — Appendix B.8); breadcrumbs; slots for the offline indicator, environment marker and impersonation bar (P5.3); on phones, a bottom action bar within thumb reach and safe-area insets for installed apps. The logo is a prop: the application passes the Liro brand files of `@veljaos/tokens/brand/` as the default; the component never imports them (AGENTS.md D18, P3.7).

### P4.2 — Home (launchpad)
**Do** `Launchpad` with `ModuleCard`s: icon, name, counter, optional **locked** state with a text passed in (e.g. "Available in <plan>"), reorder and hide through callbacks, keyboard 1–9 to open and arrows to move.

### P4.3 — List and worklist templates
**Do** `ListPage` (title, actions, `FilterBar`, `DataTable`, `CursorPagination`), `WorklistPage` (a queue processed item by item: list plus detail side by side on desktop, stacked on phones). The page's main action (e.g. "New invoice") goes into the page header; the `FilterBar` keeps only the list's own actions, such as Export (owner, P3.6).

### P4.4 — Detail and record form templates
**Do** `DetailPage` (header with status and actions, sections, side column); `RecordFormPage` (back link, actions top and bottom, side column, unsaved-changes guard).

### P4.5 — Document template
**Do** `DocumentPage`: header (number, parties, dates, status badge, actions), a lines slot (usually `EditableGrid` or a read-only table), a **totals block from props** using `SettlingValue`, and **side-panel slots** for delivery status, related documents, history and comments, presence, attachments.

### P4.6 — Report, dashboard and settings templates
**Do** `ReportPage` (parameters, result, export slot), `DashboardPage` with `StatCard` and chart wrappers (bar, line, area, donut) on shadcn Chart with tokens, `SettingsPage` (sections of rows).

### P4.7 — Status pages and sign-in shell
**Do** status pages: not signed in (401), no access (403), not found (404), error (500, with case-id slot), maintenance, suspended; `AuthShell` (centred card, product name and logo from props). The status pages also take the logo from props; the Liro brand files of `@veljaos/tokens/brand/` are the application's default (D18, P3.7).

### P4.7a — Charts catalogue (owner, 2026-10-07)
**Do** a catalogue of chart variants after shadcn/ui's charts (https://ui.shadcn.com/charts), on Recharts as shadcn's Chart is, each a story with realistic Serbian business data, so the example screens (P4.8) can use them.
- **Area:** default, linear, step, stacked, stacked expanded (100%), with legend, axes, interactive (a time-range Select "Last 3 months / 30 days / 7 days" and a series toggle in the header). shadcn's gradient variant becomes a flat fill at low opacity — no gradients.
- **Bar:** default, horizontal, multiple, stacked with legend, with labels, a custom label inside the bar, active (one bar highlighted), negative (profit/loss), mixed (a colour per bar, only with the categorical palette), interactive.
- **Line:** default, linear, step, multiple, with dots, with labels, interactive.
- **Pie:** simple, with labels, label list, with legend, donut, donut active, donut with the total in the centre, stacked (two rings), interactive.
- **Radar:** default, with dots, multiple, lines only, circular grid, no grid, with legend.
- **Radial:** simple, with labels, with grid, value in the centre, stacked, progress to a goal.
- **Tooltip:** default, line indicator, no indicator, custom label, formatted values, with a total row.

Rules for every chart:
- **Colour:** one series is brand blue, a second neutral grey (as in P4.6); three or more series only with the opt-in categorical palette (chart tokens, contrast-checked in both themes, colour-blind-safe order). Green and red only when the data carries that meaning (profit/loss, overdue). No gradients, shadows or 3D.
- **Numbers and dates** through the provider's `format`: money as decimal strings, never rounded in tooltips (axis ticks may be abbreviated, with words from `messages`); `null` is a gap in a line or a missing bar, never 0.
- **Right-to-left:** time runs right to left, the value axis on the right, the legend's order follows the direction.
- **Accessibility:** every chart has a title, a description and the "Show as table" toggle; the chart is keyboard-focusable and the arrow keys move between points and show the tooltip; never colour alone (a legend or direct labels; stacked parts separated); 3:1 for graphical elements.
- **Motion:** short (at most 300ms), none under `prefers-reduced-motion` and none in tests.
- **States:** loading (a chart-shaped skeleton, no spinner), empty ("No data for this period"), error with Retry, partial data with gaps.
- **Phones:** fewer axis ticks, the legend below, horizontal bars when labels are long; the interactive header stacks.
- **Packaging:** charts are exported from a subpath, `@veljaos/ui/charts`, so an application without charts does not load Recharts. Recharts pinned exactly; `THIRD-PARTY-NOTICES.md` updated.
- **A short docs page "Choosing a chart":** a trend over time → line or area; comparing categories → bar (horizontal when labels are long or there are more than 7 items); a part of a whole with 5 or fewer parts → donut, otherwise bar; radar and radial only for a few scores or progress to a goal, never for money over time.

**Done when** every variant has its story in both themes, both directions and phone width, and the rules above hold.

### P4.7b — Small-size favicon (owner, 2026-10-07)
**Do** a dedicated small mark for 16 and 32px: far fewer, larger dots on a whole-pixel grid (no dot under 2px at 16px, no sub-pixel positions, no anti-aliased specks), keeping the logo's round silhouette; the full sphere stays for 48px and up (apple-touch-icon, manifest). The transparent background and the dark-mode colour rule stay. Three variants are shown to the owner at real size and at 400% on light and dark tab bars; the chosen one is merged. Storybook's favicon URL carries a version (`?v=N`), so browsers pick up a change at once.

### P4.8 — Example screens
**Do** Storybook "Examples" section, English, fictitious data, full-screen: a list of invoices, an invoice document with lines and totals, an employee record form, a dashboard, a worklist. Each works in both themes, both directions and phone width.

**Done when** the owner can open the examples and see Liro as it will look.

### P4.9 — Fixes from the owner's Storybook review (owner, 2026-10-08)
**Do** in one pull request, fixing each class of fault everywhere in the library (components, templates, examples, docs), not only the instance found, and recording each general rule in `docs/decisions.md`:
- **Shell and navigation:** a company switcher for thousands of companies (search by name or tax number; pinned, then recent, then all; keyboard; virtualised; status for suspended or inactive companies; labelled or no counts; "Switch company…" in the command palette; a full-screen sheet on phones; a clear empty result); notifications — the bell keeps its dot, a panel of recent notifications with the unread count, "Mark all as read" and "View all", and a `NotificationsPage` (grouped by day, All / Unread, by company and type, read state per item, settings link, empty states) in the walk-through; no company heading on the home page (a hidden h1), the overview's subtitle only the period, no breadcrumbs with one level; a live launchpad drag (the card lifts, the others move aside, a drop placeholder, no grey ghost, none of the motion under reduced motion; the keyboard stays); a suspended page for a company or an account; a neutral sign-out.
- **Lists, documents, records, reports:** every count through `format`; the due date always shown, its state as small tone text; "All" as an empty filter's placeholder; amounts never rounded; saved views as tabs with "More" (a select on phones), phone filter bar with search first and Export in a menu; no white area under tables; one spacing rule for side panels; related documents as links with type, number and status; comments with the latest two and "Show all"; the document header as slots; a simple draft document; approvals decided in the detail with a reason for rejecting, the next item opening and Undo; records in one view/edit mode without tabs or side column; one dialog footer.
- **Phone and right-to-left:** no cards inside a card; key figures in two columns; the bottom bar within thumb reach; no horizontal overflow at 360px; a fade at the edge of scrolling module tabs; charts in one column; label above value; words never broken; one label per setting; the charts' table view right in right-to-left, with baselines.

**Done when** every item of the owner's list holds in Storybook in light, dark, right-to-left and at 360px, the new and changed components pass axe and the keyboard, and CI with new baselines is green.

**End of Phase 4:** `0.1.0-alpha.4`; report with the Storybook path of every example screen.

---

## Phase 5 — Liro patterns (about 3–4 weeks)

All generic: labels and states come in as props.

### P5.1 — History, comments and messages
**Do** `Timeline` / `HistoryList` (who, when, what changed; actor kind marker for human, system, agent, integration; "on behalf of" line); the **`Message` family** (`MessageBubble`, `MessageList`, `MessageThread`, `MessageComposer` — Enter sends, Shift+Enter breaks the line) used for comments and task conversations; `MentionCombobox` for mentions (candidate list comes from props). The Message family and the agent interactions are built on the shadcn/ui Radix versions of **Bubble**, **Marker**, **Message Scroller** and **Questionnaire** (Questionnaire for the questions an agent asks the user), adapted like the P2.1 primitives; shadcn's Carousel is not used (owner, P3.6).

**Questionnaire is a general step-by-step question component** (owner, 2026-10-07), not only for agents: e.g. guided document generation — an employment contract (fixed or indefinite term, the end date, place of work: office / remote / hybrid, probation …). It must support **branching** (the next question depends on the answer); **answer types**: single choice, multiple choice, date, number, amount, short text, and "Other" with its own text; **Back** without losing answers; a **final summary** where any answer can be changed; and **progress**. The questions, their branching and the answers come from the Core or a module (props); the component decides nothing about the content.

### P5.2 — Presence and agent marking
**Do** `PresenceAvatars` (who else is here, overflow count, tooltips with names); `AgentMark` (a consistent machine marker shown next to any name that belongs to an agent).

### P5.3 — Connection, environment and session markers
**Do** `OfflineIndicator` (always visible while offline, in the shell); `ConnectionState` for drafts (saved on this device / sending / sent); `EnvironmentMarker` (e.g. sandbox, demo — label from props, always visible); `ImpersonationBar` (not dismissible; shows whose account, mode, reason and time left, with an exit action); generic `Banner` placements in the shell. Agent interactions in the shell (an agent asking the user something, an agent's marker) use the same shadcn/ui Radix Bubble, Marker, Message Scroller and Questionnaire as P5.1 (owner, P3.6).

### P5.4 — Delivery and progress status
**Do** `StatusTimeline` (a sequence of states with the current one highlighted and a next-step slot, e.g. "delivery pending — action needed" with retry and manual-export actions); `JobProgress` (progress, cancel, final report of successes and failures).

### P5.5 — Files and document frame
**Do** `FileDropzone` and `AttachmentList`: accepted types and size limit shown before choosing (props); states **uploading, scanning, available, quarantined** with the next step; a flag slot (e.g. "not archival format"); remove only when a `canRemove(file)` prop allows it; downloads through a callback (the consumer fetches a short-lived link at click time). `DocumentFrame`: hosts a document viewer from another origin in a sandboxed iframe with a small message protocol (page, zoom, loading, error), documented in `docs/`.

### P5.6 — Sign-in building blocks
**Do** building blocks only, the flows live in `liro-core`: `EmailFirstForm`, `PasswordField` (paste allowed, show/hide), `CodeInput` for one-time codes (paste of the whole code works), `RecoveryCodes` (shown once, copy, download, print, "I have saved them" confirmation), `SessionList` (device, place, time, revoke, "this wasn't me" action slot).

**Addition (owner, 2026-10-08).** Reference: https://ui.shadcn.com/blocks/login — our `AuthShell` matches login-03 and `EmailFirstForm` matches login-05. Add `ProviderSignInButtons` ("Continue with Microsoft" / "Continue with Google"; the providers and their labels from props; each provider's official mark drawn as its brand rules require; neutral buttons, never the provider's colours as a fill) with an "or" divider between them and the e-mail form; optional slots under the form for a "No account?" link and a terms and privacy sentence. No cover-image variants (owner's decision in P4.7).

### P5.7 — Kanban board
**Do** `KanbanBoard` with columns and cards, drag **and** a keyboard/menu alternative for moving a card (WCAG 2.2 dragging), rtl-correct.

**Beyond the ERP (owner, 2026-10-07).** Liro Business Apps is not only an ERP: the same Design System serves Health, School, University, Learning, Inventory, Warehouse, POS and other business systems. It stays domain-neutral — P5.8–P5.17 are shared building blocks and layouts; the module logic lives in the applications. Every existing rule applies (tokens only, less blue, right-to-left, accessibility, baselines, one pull request per step).

### P5.8 — Calendar and scheduling
**Do** `CalendarView` (day, week, month, agenda; the week start and the month and weekday names from `LiroProvider`); `ResourceSchedule` (rows of resources such as doctors, rooms, teachers × time; drag, and a keyboard/menu alternative); `SlotPicker` (free slots for booking); `Timetable` (a weekly school grid with periods). Right-to-left correct; the time zone and "today" from the provider. After the date components of P2.3.

### P5.9 — Tree
**Do** `TreeView` and `TreeTable`: expand and collapse, lazy children, keyboard per the WAI-ARIA tree pattern, selection, right-to-left. Uses: chart of accounts, warehouse locations, org units, course structure.

### P5.10 — Touch mode and POS
**Do** a "touch" density (targets at least 44px); `PosShell` (full screen, no header, kiosk-safe); `NumericKeypad`; a `ProductTile` grid; `CartPanel`; `PaymentDialog` (cash, card, split, change due; amounts as decimal strings); `ReceiptPreview`. Works offline (the state shown, a queue slot), with keyboard and barcode-scanner input. After the connection markers of P5.3.

### P5.11 — Scanner-first warehouse
**Do** `ScanField` (a hardware scanner as keyboard input, plus an optional camera through a consumer callback); `QuantityStepper`; `PickList` and `StockCount` layouts for handheld devices at 360px; clear success and error feedback (sound and vibration slots, never colour alone); the offline state. After the connection markers of P5.3.

### P5.12 — Learning
**Do** a `CoursePage` layout (course outline, lesson content, progress, previous/next); progress to completion; quizzes use the general Questionnaire (P5.1); the certificate's print layout comes from P5.15.

### P5.13 — Attendance and quick marking
**Do** an EditableGrid pattern for fast marking (present / absent / late / excused) with one key per mark, bulk marking, and a gradebook example.

### P5.14 — Sensitive fields
**Do** `MaskedValue`: reveal requires a reason (the list of reasons from props), an "access logged" note, and a callback for the audit. Used for health data and salaries.

### P5.15 — Print templates
**Do** A4 print layouts with print CSS: a document (invoice), a certificate, a school report, a medical finding; header and footer slots, page numbers, no application chrome. After P4.5.

### P5.16 — Portal shell
**Do** a simpler shell for external participants (patient, parent, student, customer): no launchpad, few sections, the same tokens, phone-first.

### P5.17 — Industry example screens
**Do** in Storybook "Examples": appointment booking (Health), POS checkout, warehouse picking on a handheld, a school timetable and attendance, a course lesson. Realistic Serbian data, English interface text, both themes, both directions, phone width. After P5.8–P5.16.

### P5.18 — Complex documents (owner, 2026-10-08)
A design question, not a list of business cases: the `DocumentPage` layout must stay calm and readable when a document carries a lot of structure. All rules, codes, numbers and legal texts come from the Core as data; the Design System only presents them and offers them for choice.

**Building blocks**
- **Line types:** item, service, free-text line, section heading with subtotal, line and document discount, deduction line (e.g. an advance).
- **One search field per line instead of a "Type" column:** the user types a name, code or asset number and the results are grouped by kind (Items with stock and warehouse, Services, Fixed assets, other kinds the Core allows for this document type). The kind is taken from the chosen result and shown as a small secondary text label in the line (no colour). Kind-specific details from props: a stock warning when the quantity exceeds the stock; the asset number and a sale note for fixed assets; internal values (e.g. book value) never on the customer's PDF. An "Add line ▾" menu for the rarer line types (text line, section heading, discount); Enter adds a normal line; which kinds are allowed per document comes from the Core. When the search finds nothing, the list ends with "+ Create service '…'" / "+ Create item '…'" (kinds and labels from props), opening a small panel (name, unit of measure, price, tax category) that saves and fills the line without leaving the document. A one-off line without a catalogue entry is allowed only when the Core says so, and then requires an account and a tax category.
- **Every line carries a tax category** (code and rate, e.g. "S 20%", "S 10%", "AE", "E", as the e-invoice system requires) **and a unit of measure** (display name and code, e.g. "pc" with its standard code); both chosen from lists supplied by the Core.
- **`DocumentReferences` block:** links to related documents — proforma, advances, the original document, delivery notes, contract and order numbers.
- **Currency block** for foreign-currency documents: currency, rate, rate date, equivalents in the home currency.
- **Notes block:** template texts and free notes.
- **Attachments** with a "send with the e-invoice" flag.
- **Specification:** created and edited the same way as document lines (EditableGrid, line by line, the same keyboard shortcuts, a tax category and unit of measure per line), grouped with subtotals per group; it can also be produced as an attachment.

**Design principles**
- A fixed block order: header → "Based on" references → lines → totals → notes → attachments; a block without content is not rendered.
- References as one line of links: "Based on: Proforma PR-2026-031 · Advances A-2026-031, A-2026-044 · Contract 12/2026".
- Line types distinguished by typography, not colour: a section heading bold across the row; a subtotal end-aligned, semibold, with a rule above; a text line smaller and secondary; discounts as negative amounts.
- The tax category shown as a short code with the rate in the VAT column; exemption and reverse-charge reasons appear once, as footnotes under the totals ("Exempt¹", "AE²").
- The totals block ends with a recap by tax category (category, base, rate, VAT), then the deductions (one row per advance with its number), then a bold "Amount due"; a specification ends with subtotals per group and the same recap.
- Foreign currency: lines in the document's currency; the home-currency equivalents and the rate line only in the totals block.
- A long specification is not inside the lines table: a summary row ("Specification of works: 84 positions, 2.418.300,00 RSD") with "Open", which shows the full-width specification (columns previous / this period / cumulative where relevant).
- On phones the same order; tables become lists; footnotes stay.

**Corrective documents (addition, owner, 2026-10-08).** A template for decrease and increase documents, linked to one original document or to several documents for a period, with lines shown as Original / Change / New. Cancellation (storno) as an action on an issued document: a required reason, `IrreversibleConfirmDialog`, then the status "Cancelled", a visible marker on the page and on the PDF, and links both ways between the document and its cancellation.

**Done when** two or three stress-test examples put many of these on one document — for example a final invoice deducting two advances, with notes, references and attachments; a construction interim situation with a long specification of works; an invoice in EUR with mixed tax categories — in light, dark, right-to-left and phone versions, all numbers consistent.

### P5.19 — Catalogs at scale (owner, 2026-10-08)
**Do** for catalogues of tens of thousands of records (customers, items, services, accounts):
- `LookupField` for forms and document lines: asynchronous search while typing, recent records first, "+ Create …" when nothing is found.
- `LookupDialog` ("Search all…"): the full table with filters, columns, keyset paging and keyboard selection.
- Bulk work on catalogue lists: import from Excel or CSV with column mapping and a validation preview before anything is saved; edit several records at once; inactive records hidden but not deleted (a filter shows them); a duplicate warning (the same PIB or name) from the Core.

### P5.20 — Registers and official forms (owner, 2026-10-08)
**Do**
- `RegisterPage`: a chronological register for a period (e.g. VAT records, the work-injury register, the safety-training register). Entries are never deleted, only corrected by a new entry that references the old one; locked periods clearly marked; export and print.
- `StatutoryFormPage`: mirrors an official form with its own section and field numbers (e.g. "3.2", "8a.1"); values prefilled from the books, each amount drills down to its source documents; manually overridden values clearly marked with who and when; rule checks ("5.4 must equal 5.1 + 5.2 + 5.3") shown next to the field and in a summary; comparison with the previous period; status draft → checked → submitted; print and export.
- Field definitions, numbering, rules and texts come from the Core as data. Guided forms may use the Questionnaire (P5.1).

**Done when** a VAT return form and a work-injury register for Kvadrat Gradnja are examples in light, dark, right-to-left and phone width.

### P5.21 — Common business processes (owner, 2026-10-08)
**Do** generic building blocks; the data comes from the Core:
- `MatchingView` (reconciliation): two lists side by side (e.g. bank statement lines and open invoices), suggested matches with a confidence label, match and unmatch, partial matches, keyboard support; on phones one list at a time.
- **Balanced entry** (journal entry): an EditableGrid with an always-visible Debit / Credit / Difference bar; a non-zero difference is clearly marked and blocks posting (the rule from the Core).
- `PeriodicRunPage` (payroll, depreciation, VAT period close): the steps prepare → calculate → review → post → send, checks per step, a preview before posting, the period's lock state, a rerun with a reason.
- **Users and roles:** a role list and a permissions matrix (areas × actions) for a company administrator; who has which role; the state of invitations.
- `SetupChecklist`: the first-run steps of a new company (company data, e-invoicing connection, import customers, first invoice) with progress and resume.
- **Signing:** the list of signers in order, the state per signer (waiting, signed, declined), the current user's "Sign" action and the document's preview; the signing itself is done by the Core / Liro Bridge.

### P5.21b — Overscan per component (owner, 2026-10-09)
**The first step of Phase 5 part 2, before P5.8.** P5.21a put every list on TanStack Virtual with one overscan of 600px, and the EditableGrid's page jump on the 300-line specification became slower (409 → 568ms at 1×, 1,240 → 1,513ms at 4× CPU; docs/decisions.md). **Do** tune the overscan per component: keep it smaller for the EditableGrid, whose rows are heavy (a line of fields), so that the page jump on the 300-line specification is back to **about 400ms or less** (1×, the P5.21a method); keep 600px for the light lists (DataTable, the company switcher, LookupField, MatchingView). Re-measure every list with the P5.21a method and record the numbers in docs/decisions.md.

**Done when** the specification's page jump is about 400ms or less at 1×, the light lists keep their P5.21a figures, the focused row is still kept drawn everywhere, and the numbers are recorded.

### P5.22 — Rich text (owner, 2026-10-10)
**Do** `RichTextField` and `RichText` (read-only view) on **Tiptap, MIT-licensed packages only** (no Pro or paid extensions): paragraphs, headings, bold, italic, underline, lists, links, a small toolbar reachable by keyboard; **merge fields as pills** (the list of fields and their labels from props, inserted from a menu or by typing "{{"); **@mentions** (candidates from props or `onSearch`, as MentionCombobox); the value is stored as **Tiptap JSON plus sanitized HTML** (both reported on change; the HTML sanitized before it leaves the component and before it is shown). Tokens only, right-to-left by content, paste kept as plain structure.

### P5.24 — Working time (owner, 2026-10-10)
Built together with P5.13 as **one pattern**: a grid of people × days whose cells hold a value and a code, entered from the keyboard. The rules, limits, codes and totals are the application's data; the Design System shows them and offers them for choice. **Legal limits are not encoded:** the application passes them as data; examples use illustrative values, labelled as such.

**a) Monthly timesheet.** Employees × the days of a month; each cell holds hours and a code: regular work, night work, overtime, work on a public holiday, annual leave, sick leave, paid leave, unpaid leave, public holiday, business trip, absence (codes, short labels and meanings from props). Weekends and public holidays are shaded. Totals per type per employee and per day, from props. Keyboard entry like EditableGrid; fill a range; copy the previous week. A month locks after payroll: corrected, never deleted, like the registers (P5.20). Hand-off to payroll (an action and its state). Phone: one employee per screen, a list of days.

**b) Shift schedule.** Shift templates (e.g. 06–14, 14–22, 22–06 crossing midnight), rotation patterns, a planner by employee and by team or site, assignment by keyboard and by drag (with a keyboard and menu alternative). Conflicts — too little rest between shifts, double booking, weekly hours over the limit — arrive as warnings from data. Publishing the schedule. The employee's view on a phone ("My shifts"). A shift swap request with approval, on the worklist / approval pattern (P4.3, P5.23).

**c) Shift work.** Night hours shown separately; shift allowances indicated.

**d) Working-time redistribution.** A plan for a period (start, end, planned hours per week), and per employee a balance of planned against worked hours and the running average; warnings when the plan breaks the limits (from data).

**e) Clock-in / clock-out records** from terminals or a phone, with audited corrections (who, when, why; the original kept).

**Examples:** Kvadrat Gradnja site workers; a retail store with shifts (POS); a 24/7 health facility with rotating shifts.

**Done when** the timesheet, the shift planner, My shifts, the balance and the clock records have stories in light, dark, right-to-left and phone width, pass axe and the keyboard, and the three examples show them with one dataset each.

### P5.24a — Working time follow-up (owner, 2026-10-11)
**Do** "Apply rotation…" in ShiftPlanner as a complete flow: it opens with the people already chosen (the rows of the selected range, else everyone in view, or the application's `rotationPeople`), shows what it will create before Apply (shifts per person, the dates, conflicts it would cause, from data), and reports the assignments. My shifts can open a swap request with a colleague already chosen.

### P5.25 — Floor plans and seating (owner, 2026-10-11)
**Do** the plan of a place, for a restaurant, a café, a hotel floor and an event:
- **FloorPlan:** tables, rooms, seats and fixtures placed on the plan (positions and sizes from the application, in plan units), areas (terrace, hall, floor 2) as labelled regions, each item's state in words and a tone (free, occupied, reserved, blocked, needs cleaning — the states and their tones are the application's data), capacity, a note; one item chosen at a time or several; arrow keys move between items by position; a list view of the same items (by area) as the accessible and phone alternative. **Edit mode:** add from a palette, move by drag, by arrow keys and by "Move to…" with numbers, resize, rotate in 90° steps, remove; the plan reports changes, it saves nothing. The plan is a physical place: it is not mirrored in a right-to-left page; the page around it is.
- **SeatingChart** for events (weddings, conferences, gala dinners): tables with their seats, the guest list beside the plan (unseated first, groups and notes such as diet as data), seating a guest by choosing a seat and a guest (keyboard), by drag, and by "Seat at…"; "112 of 140 seated"; a table's guests in order; conflicts from data (a full table, guests to keep apart).
- **RoomRack** for hotels: floors × rooms, each room with its number, type, occupancy and housekeeping state (in words), the guest, arrival and departure; filters by state; reservations over days stay on ResourceSchedule (P5.8).
**Examples:** a restaurant (service: open a table, move guests, merge tables), a café terrace with the POS (P5.10), a hotel (room rack and the booking timeline), an event's seating.
**Done when** every component has stories in light, dark, right-to-left and phone width, passes axe, the keyboard and the text-order check, and the four examples show them.

### P5.25a — Floor plans: background, polygons, three more places (owner, 2026-10-11)
**No new library:** FloorPlan stays on our own components (no Konva, tldraw, react-leaflet, react-planner, Excalidraw or three.js), and there is no second plan component. **Do,** inside FloorPlan:
- **a) Background:** an optional layer under the items — an image, an SVG, or a PDF page the application has rendered as an image — placed and scaled in plan units, for a real building's plan; decorative, never the only way to read the plan.
- **b) Polygon areas:** an area may be a polygon (its points in plan units) for rooms and zones that are not rectangles; its label, state and keyboard behaviour as a rectangular one.
- **c) Three more examples:** a **warehouse** (zones, racks and bins with a fill level and a stock state; a bin opens its record; tied to the scanner flow of P5.11), a **hospital ward** (rooms and beds: free, occupied, needs cleaning, blocked; the patient's name is a sensitive field, masked as in P5.14), and an **office** (bookable desks).
**Done when** the background and polygon areas have stories in light, dark, right-to-left and phone width, pass axe, the keyboard and the text-order check, and the three examples show them.

### P5.26 — Diagrams (owner, 2026-10-11)
**Do** `@veljaos/ui/diagram` (its own subpath, loaded only there) on **React Flow (@xyflow/react, MIT)** with **dagre (MIT)** for automatic layout: a diagram of steps and connections for workflows and orchestrators, in a **BPMN-style notation** (start, end, task, user task, service task, timer and message events, exclusive and parallel gateways, sub-process, lanes) drawn by us with tokens; no bpmn-js, no BPMN XML (import and export are the application's). **View** (read-only, fit to view, zoom, minimap), **edit** (add a step from a palette or "Add step after…", connect by drag or by "Connect to…", label a connection, remove; changes reported, nothing saved) and **run state** (an instance: done, running, waiting, failed with its reason, skipped; the path taken). Validation messages from the application on their steps. Layout from the leading edge (mirrored in right-to-left), or top to bottom. Keyboard: every step and connection reachable; no drag-only action.
**Examples:** an approval workflow for a supplier invoice, an orchestrator's run with a failed step and Retry, editing a workflow.
**Done when** the diagram has stories in light, dark, right-to-left and phone width (view on phones, editing on desktop), passes axe and the keyboard, and the examples show view, edit and run state.

### P5.27 — Legal information (owner, 2026-10-11)
Laws, regulations, by-laws, court decisions, official opinions and a company's internal acts (its work rulebook). Every text, date, status and reference is the application's data; the library presents them. The act page follows the **invoice's DocumentPage layout:** the act on the start side, the side panel on the end side (with "Hide panels"), the same patterns; nothing new where an existing component fits.
- **a) Header:** type and title, issuer, every official gazette reference ("No. 24/2005, 61/2005, 54/2009"), status from the application's status map (In force / Not yet in force / No longer in force / Partly in force), "Version as of 11.10.2026." with a version picker by date. Actions: Compare versions, Copy citation, Print / PDF (the A4 print pattern of P5.15), Watch for changes, Bookmark.
- **b) The act's text, structured:** parts, chapters and sections as headings; articles ("Article 57", optional title) with numbered paragraphs, items and sub-items; footnotes. Every article has its own link (copy link to article). A changed article names the amendment that changed it and the date it applies from; a deleted article shows as "Deleted (…)", collapsed; an article not yet in force shows its date. References in the text are links (to an article of this act or of another act) with a keyboard-accessible preview of the target article. Search in the act: hits highlighted, "3 of 12", next / previous. A table of contents. A comfortable reading width. A Latin / Cyrillic switch for Serbian text (Cyrillic to Latin may be transliterated in the library, one to one; everything else comes from the application). A long act (300+ articles) stays fast, and the search still finds every article.
- **c) The side panel,** in sections like the invoice's: Versions (every consolidated version, from–to, the amending act; pick one; "Compare with…"); History of changes (per amending act: the articles it changed, published, applies from); Legal hierarchy (higher acts — the legal basis, "Based on Article 63 of …" — and lower acts, each with its status); References ("This act refers to", "Referred to by", grouped by type); Court practice and opinions (court or issuer, number, date, a short summary; filterable by article); My notes and bookmarks. With an article selected the panel narrows to it ("Article 57: changed twice, 3 court decisions, 1 opinion") with a clear way back to the whole act.
- **d) Compare versions:** changed articles only by default ("Show all"); insertions and deletions marked by more than colour (underline, strikethrough, labels).
- **e) Search page** on ListPage: full text across acts; filters by type, issuer, area (a tree), status, gazette year and number, date in force; results with title, type, gazette, status, a highlighted snippet and the article it matched in. "New in the Official Gazette", issue by issue.
- **f) Phone:** the act full width, the contents in a drawer, the panel through a button as a sheet, article actions in a menu, compare in one column with inline changes.
- **g) Data:** examples use **invented** acts, numbers and gazette references, labelled "Illustrative": the gazette itself is invented ("Illustrative Gazette"), so no real gazette number is ever attached to invented text; nothing is copied from commercial legal databases (consolidated texts, editorial notes, commentary). Examples: an illustrative law with three amendments, its by-law, two court decisions and an opinion; Kvadrat Gradnja d.o.o.'s internal work rulebook with two versions and its legal basis.
**Done when** the act page, compare, the search page and the gazette list have stories in light, dark, right-to-left and phone width, pass axe, the keyboard and the text-order check, a 300-article act stays fast, and the examples show them.

### P5.28 — Owner's review of Phase 5 part 2 (owner, 2026-10-13)
Fix every finding in one branch and fix its **class**: search the library, stories and examples for the same fault, fix every occurrence, write the rule down (`docs/decisions.md`, AGENTS.md where it is a rule).

**A. Across the library**
1. **Phones never scroll sideways.** Select and combobox lists fit the viewport (long options wrap) or open as a bottom sheet; dialogs on phones are full-width sheets; popovers that do not fit open as a sheet. PeriodField on phones: presets first, then "Custom range" with one month full width. An automated check: no horizontal overflow in any phone story, with every select, menu, popover and dialog opened.
2. **Locale:** day and month names, date formats and the first day of the week come only from the LiroProvider locale (an English UI never shows "Januar, Ned Pon Uto", "sre 7", "utorak, 6. oktobar 2026."; `sr` weeks start on Monday). Every calendar, date and period display.
3. **Selects with more than about 10 options become searchable comboboxes**; no scroll-arrow buttons in lists on touch.
4. **Sticky table headers stick below the shell's sticky header, and the first column stays sticky** when scrolling sideways: DataTable, AttendanceGrid, ShiftPlanner, ResourceSchedule, RoomRack, EditableGrid, statutory forms; desktop and phone.
5. **Overlays on phones cover the whole screen.**
6. **A dialog that acts on one record** shows the action as its title and the record, bold, on its own line.
7. **An action inside an Alert or banner is a neutral (secondary) button**, never a tinted family on a toned background.
8. **A toast never tells the user what to do next;** the next step opens what it needs.
9. **Moving something other people rely on** (appointments, shifts, reservations, seating, room or bed moves) is never final and never messages anyone without confirmation: the change (old → new, who), "Notify …" as an explicit choice, Cancel / Save (primary last), or pending changes with Save.
10. **One "now" marker** everywhere (CalendarView, clinic schedule, Timetable).
11. **Phone stories scroll like a real phone** (the frame scrolls its page; sticky header and bottom bar stay); visual tests keep their fixed 390×844 picture.
12. **Examples sidebar: two stories per screen,** desktop and phone; interaction and intermediate-state stories hidden from the sidebar and kept for the tests.

**B. Screens:** 13 LookupField "Search all…" on phones opens LookupDialog full screen with compact rows; 14 the course outline without the empty strip, the selected item square and flush; 15 the sensitive-field reveal ("Show diagnosis" sentence case, space above the question, "Access is logged" as an info note); 16 the parents' portal excuse flow (absences, reason, attachment with the camera on phones, Send, then "Excuse sent, waiting for the class teacher"); 17 hotel bookings open a booking in place (a drawer over the timeline), never switch tabs; 18 the hospital ward's "Transfer…" dialog with free beds by room, and "Admit patient" on a free bed.

**C. Bigger pieces**
19. **StatutoryFormPage as the real form grid** (PP PDV, POPDV, the input-VAT records): two-level column headers (a group over sub-columns), a cell that does not apply is absent, three kinds of cells (entered, computed, from a source that opens its documents), nested numbered collapsible sections with long wrapping labels, one-column sections, the previous period as a comparison that does not replace the rate columns; phones one field per card labelled with group and column. Rows, columns, codes and texts are the application's.
20. **Printouts as simple as a Stripe invoice,** in Liro's design: title at the start and logo at the end; a small key/value block; seller and buyer side by side; one prominent "X RSD due DD.MM.YYYY." line and the payment details with an IPS QR slot; the lines with thin rules only; totals at the end side; the VAT recap by rate only when given; notes; "Page 1 of 1". Black and grey, brand colour only for the logo and links; no stamps, seals or frames; signature lines only where required (certificate, finding). Every template that can be signed has an **electronic signature field** with a stable id and its position on the page (PDF coordinates). The same simplicity for the certificate, grade report and finding.
21. **POS and Serbian fiscalisation** (all codes, rules and texts are data): receipt kind = invoice type × transaction, non-fiscal kinds marked, training banner; several payment methods with the remaining amount (cash, card, cheque, wire / deferred with a buyer, voucher, instant payment QR, other cashless); buyer ID with its type and the optional buyer field; refund (find the original, choose lines and quantities, the reference carried over); advances (take, list, close on the final sale, refund); cancelling a receipt issued by mistake, a copy, sale without compensation, corporate card; the result (PFR number and time, counter, QR, delivery by print / e-mail / SMS, the journal, the daily report); offline count and state; an online sale delivered electronically. Today's look kept. Desktop, tablet and phone.
22. **Open tabs on tables:** a tab persists; Send order to the kitchen or bar; edit lines; discounts per line and per order; promotions from data; split the bill; move items or the tab; pay part; close with the fiscal receipt.

**D. Floor plans**
23. Walls, doors and windows removed from FloorPlan; areas are plain labelled regions; a real plan is the background image.
24. Labels on the plan are never cut: number and state, guests on a second line; the time in the drawer and the list.
25. "Move guests" lists the free tables with enough seats; every action of every floor-plan example works end to end.
26. An area switcher (all areas or one) usable with 6+ areas; takeaway and delivery are POS order channels, not plan areas.
27. Phones open on the list (cards by area with state, guests and time); the plan readable without sideways scroll; no editing on phones ("Edit the plan on a computer or tablet").

**Done when** every item and its class are fixed and recorded, CI is green, and the report names the stories to check on desktop and phone.

### P5.29 — Admin and Superadmin views (owner, 2026-10-13)
Built only from our components and templates (ListPage, DocumentPage, DetailPage, WorklistPage, DashboardPage, StatusTimeline, the charts); every figure, state and text is the application's; examples invented and labelled illustrative (documentation IP ranges).
- **a) Admin** (a customer company's administrator, inside one tenant): **Overview** (users and active sessions, failed sign-ins today, accounts without two-factor sign-in, integrations with errors, licences / seats used); **Sign-in activity** (who, when, from where — device, browser, approximate location, IP masked by default —, success / failed / blocked; filters by user, result, period); **Audit log** (who changed what and when: record, field, old → new; filterable, exportable; never edited or deleted); **Security** (two-factor status per user, sessions and devices with "Sign out", API keys and tokens — created, last used, revoke —, password and session policy from data); **Integrations health** (each connection — SEF, bank, e-mail, Liro Bridge … — with state, last success, last error and Retry).
- **b) Superadmin** (the Liro team, across tenants): **System status** (services up / degraded / down, uptime, response time and error rate as charts, queues, database, storage, backups with the last good backup and restore test, certificate expiry, scheduled maintenance); **Incidents** (a list: open / monitoring / resolved, severity, affected services and tenants, started, duration; an incident page on DocumentPage: timeline of updates, assignee and on-call, affected tenants, the status-page message, acknowledge / update / resolve, the postmortem; phones: see and acknowledge); **Security events** (failed-sign-in bursts, suspicious IPs, blocked attempts, privilege changes, MFA resets, data exports; severity, state new / investigating / closed, the action taken); **Network and infrastructure** (nodes and regions with health, latency, alerts); **Tenants** (plan, users, health, last activity; one tenant's admin view read-only behind an audited "view as" banner); **Announcements** (a banner or status message to all or chosen tenants, scheduled).
**Done when** every view has desktop and phone stories in light, dark and right-to-left, passes axe, the keyboard and the text-order check, and the examples show them.

### P5.30 — Helpdesk (owner, 2026-10-13)
In the spirit of Frappe Helpdesk — sleek, modern, calm — built only from our components; data from the application.
- **a) Agent inbox** (ListPage): subject, customer, status (Open / Replied / Paused / Resolved / Closed), priority, type, team, assignee, SLA (first response due / resolution due, overdue in danger tone); saved views (My open, Unassigned, Overdue, All); bulk assign / change status; keyboard navigation.
- **b) Ticket page:** the conversation as a thread (customer messages, agent replies, internal notes distinct and marked "Internal"); the composer on RichTextField (reply / internal note, canned responses, attachments, @mentions in notes); the side panel with the contact and company (their other tickets), properties changed in place (status, priority, type, team, agent), SLA timers, the activity log. Phones: the thread full width, properties in a sheet, the composer at the bottom.
- **c) Agent dashboard:** open, unassigned, overdue, first-response time, resolution time, satisfaction (charts).
- **d) Customer portal** (PortalShell): submit a ticket (type, subject, description, attachments), "My tickets" with status, the thread with replies, a satisfaction rating after resolution.
- **e) Knowledge base:** categories, articles (RichText), search; agents insert an article link into a reply; the portal suggests articles while the customer types a new ticket.
**Examples:** Liro support for customer companies ("SEF invoice rejected", "Cannot sign in", "Payroll export question").
**Done when** every view has desktop and phone stories in light, dark and right-to-left, passes axe, the keyboard and the text-order check, and the examples show them.

### P5.31–P5.39 — Workflows of the accounting product (owner, 2026-10-13)
A design system: screens, components and states only. All data, rules, AI answers, OCR results and permissions arrive through props; nothing calls a backend or an AI model. Reuse our components and templates; desktop and phone (tablet where noted), light / dark, right-to-left, axe, keyboard, "fix the class"; examples illustrative.

### P5.31 — Document inbox with recognition
- **Inbox** (ListPage): documents by upload, e-mail, scan or SEF; type (supplier invoice, bank statement, receipt, contract, other), sender, received, state (New / Recognised / Needs review / Posted / Rejected / Duplicate); bulk actions; drag-and-drop upload; the camera on phones.
- **Review:** the document (PDF / image viewer, zoom, pages) beside the recognised fields (supplier with PIB matched to the catalog or "+ Create", number, dates, amounts, VAT by rate, lines, account suggestions); each field with its confidence, low confidence marked; a field shows where it was read on the document; Confirm and post / Save for later / Reject (reason) / Mark as duplicate (link to the original); keyboard-first (Tab through fields, Enter confirms, next document).
- **States:** processing, failed recognition (enter by hand), password-protected PDF, unreadable scan.

### P5.32 — Accountant's workspace for many clients
- **Clients overview:** upcoming deadlines (VAT return by the 15th, payroll tax returns, annual accounts — from data), missing documents, open tasks, last activity, health; filters by accountant, deadline and problem; sorted by urgency.
- A **deadlines calendar** across clients; a **per-client checklist** for closing the month.
- **Fast client switching** (the company switcher at 200+ clients) and **"Ask the client"** (a request for documents or answers, sent to the client's portal).

### P5.33 — IOS: statements of open items
- Partners with balance and IOS state (Not sent / Sent / Opened / Confirmed / Disputed / No answer); choose partners and a cut-off date; preview; send (e-mail, signed PDF via Liro Bridge); reminders.
- **Partner side** (PortalShell): the statement, Confirm or Dispute with their figures and a note.
- **Reconciling a disputed IOS:** our open items beside theirs, differences highlighted, resolved line by line (the bank statement's pattern).

### P5.34 — Liro Assistant (AI)
- A **side panel** on every page: ask in plain words; answers with text, small tables or charts and **links to the records** they come from; suggested follow-ups; proposed actions that **always wait for confirmation**; states thinking, streaming, stopped, error, no access ("You do not have permission to see salaries").
- A full **"Ask" page:** one large centred question box, suggested and recent questions under it; the answer as a calm, readable page (headings, text, tables, charts, sources); nothing else on the page.
- Answers **labelled as AI-generated**, with a way to report a wrong answer.

### P5.35 — Employee portal (PortalShell, phone-first)
My payslips (list, payslip view, PDF), leave balance and requests (approval state), my documents to sign (Signing), my shifts (MyShifts), my details (change requests to HR for approval).

### P5.36 — Subscription and billing
Plan and modules, seats used / available, usage, next invoice, Liro's invoices (list, PDF), payment method, change plan (compare, confirm, proration from data), cancel with a clear confirmation; trial and past-due banners.

### P5.37 — Project timeline (Gantt)
- `@veljaos/ui/gantt` (its own subpath) on an **MIT** library: evaluate SVAR React Gantt (MIT edition, never PRO) and Frappe Gantt against our rules (React 19, tokens-only theming, keyboard and screen reader, right-to-left, phones, size); pick one, pin it, add its notice, record why.
- Phases and tasks, dependencies, milestones, the one "now" marker, progress, assignees; drag with a keyboard / menu alternative; budget against actual per phase beside the timeline. Phones: a list by phase with dates, the timeline view-only. Example: a Kvadrat Gradnja construction project.

### P5.38 — E-mail and notification templates
A template list (invoice e-mail, IOS, payment reminder, welcome, password reset …); the editor on RichTextField with merge fields as pills, subject, preview with sample data (desktop and phone widths, light and dark mail clients), "Send test", versions, per-language variants; the e-mail layout as simple as the printouts.

### P5.39 — Blog
- Public list (cover, title, excerpt, category, author, date, reading time), categories and tags, search; the article page as a reading layout (RichText, contents for long articles, related articles, share, newsletter sign-up).
- Authoring on RichTextField: cover, slug, SEO title and description, category and tags, Draft / Scheduled / Published, preview, schedule.

**Done when** every item has desktop and phone stories (tablet where noted) in light, dark and right-to-left, passes axe, the keyboard and the text-order check, the examples show them, and CI is green.

### P5.40 — IPS NBS QR and payment orders (owner, 2026-10-14)
- **IPS QR at the till:** an instant payment shows the merchant's IPS QR code (kind PT: the amount, the merchant category, the sale's reference) for the buyer's bank app; or the cashier scans the buyer's code (PK). The bank's answer is the application's.
- **Payment orders:** a screen that fills in and prints the Serbian payment order (nalog za uplatu, form 1), withdrawal order (nalog za isplatu, form 2) and transfer order (nalog za prenos, form 3) as their real forms, with the IPS QR code (forms 1 and 3) written to the IPS NBS rules (tags, order, account and reference control numbers, amount format) and checked field by field; print or download.
- **Everywhere a code is shown** (invoices' payment details, receipts, tills) the QR code is real and readable.
- References: ips.nbs.rs — "QR validacija i generisanje", "Zašto instant plaćanja na prodajnim mestima", "Smernice Generator Validator".
**Done when** the codes scan, every order has desktop and phone stories in light, dark and right-to-left, passes axe, the keyboard and the text-order check, and the examples show them.

### P5.41 — Maps (owner, 2026-10-14)
On open-source software only; the map's background (tiles) and every shape are the application's data, nothing is fetched by the library.
- **Areas on a map:** municipalities, city zones (for example the zones of a local property tax), service areas — their boundaries drawn as lines and fills with tokens, labelled, chosen from the map or from a list beside it; a point (an address) shown with the area it falls in; the legend in the application's words.
- **Location check:** a workplace's allowed area (a circle or a shape) and the person's reported position with its accuracy; inside, outside or unknown in words, as the application decides; "Use my location" asks the application, which asks the browser; a check-in disabled with its reason when the position is outside.
- **Maps in charts:** values by country or region (a choropleth with steps of one meaning, points or bubbles), for a company working in several countries or watching its regions; areas without a value say "No data", never 0; legend, tooltip and "Show as table" as the other charts.
- Keyboard and screen readers: the list of areas and the position in words are the way; zoom and pan by buttons and keys; nothing only by dragging. Maps are never mirrored in right-to-left. Phones: the list first, the map full width.
**Done when** every view has desktop and phone stories in light, dark and right-to-left, passes axe, the keyboard and the text-order check, and the examples show them.

### P5.42 — Organisation chart and hierarchies (owner, 2026-10-14)
- **Organisation chart:** people and positions by their reporting lines (avatar, name, position, unit, headcount), vacant positions, collapse and expand, show one unit with the way back up, search that reveals a person's place, a person's card from the application; secondary (dotted-line) relations listed, not drawn across the chart.
- **Similar hierarchies on the same component:** units (departments with their head and headcount), a group of companies with ownership shares on the lines, cost centres.
- Keyboard and screen readers: a WAI-ARIA tree, arrows by the chart's direction (mirrored in right-to-left); phones: an indented list; print on a landscape sheet. The data and every word are the application's.
**Done when** every view has desktop and phone stories in light, dark and right-to-left, passes axe, the keyboard and the text-order check, and the examples show them.

### P5.43 — Files and folders (owner, 2026-10-14)
A full files-and-folders view beside FileDropzone and AttachmentList (P5.5). Design system only: files, folders, permissions and storage come from the application; reuse TreeView (P5.9), Breadcrumbs, DataTable, DocumentFrame, FileDropzone, BulkActionBar, Drawer and Signing.
- **Layout:** a folder tree at the start (collapsible), breadcrumbs, the content as a list (name, owner, modified, size, linked record) or a grid of thumbnails; sort, filter by type, search in the folder or everywhere. Quick places: Recent, Favourites, Shared with me, Trash.
- **Actions:** upload (files and whole folders, drag-and-drop, progress per file; uploading / scanning / available / quarantined from P5.5), new folder, rename, move or copy (a dialog with a folder picker; drag to a folder with a keyboard and menu alternative), download (one file or a zip of the selection), delete to Trash with Restore and empty Trash (irreversible confirm), bulk actions on a selection.
- **Conflicts:** "A file with this name exists": Replace / Keep both / Skip, with "Apply to all".
- **Preview:** PDF, images and office files in DocumentFrame, with next and previous through the folder.
- **Details panel:** type, size, owner, created and modified, versions (list, restore an older version, upload a new version), tags, the records the file is linked to (invoice F-2026-0412, an employee file), the retention label from data ("Keep until 2036"), activity.
- **Sharing:** with people, roles or a client's portal (view / edit), an external link with an expiry date and optional password, who has access, revoke.
- **Signing:** sign a document from here (Signing / Liro Bridge) and show its signed state.
- **Storage** used against the quota.
- **States:** empty folder, no results, no permission ("You do not have access to this folder"), offline.
- **Phone:** the list view, folders as rows, actions in a bottom sheet, upload from the camera or the phone's files, preview full screen.
- **Examples:** Kvadrat Gradnja's company documents (contracts, employee files, site documentation), and an accounting firm's client folders where the client uploads through the portal (tied to P5.31's document inbox and P5.32's accountant's workspace).
**Done when** every view has desktop and phone stories in light, dark and right-to-left, passes axe, the keyboard and the text-order check, and the examples show them.

### P5.31a — The owner's decisions after P5.31–P5.43 (owner, 2026-10-15)
The three questions left in P5.31's report, answered by the owner:
- **Maps follow the law of the Republic of Serbia.** Kosovo and Metohija is part of the Republic of Serbia: every map of the stories and examples draws it within Serbia's area, with no shape, border or name of its own. A test fails if a change draws it apart.
- **IPS QR against the NBS validator.** Every IPS code of the stories and examples is checked with the National Bank of Serbia's validator once `ips.nbs.rs` is reachable from the environment (the owner allows the domain); until then the rules stay those of the two public implementations P5.40 used.
- **The phone test (`phone-overflow.spec.ts`).** A trigger that closes its own dialog no longer makes the test wait until its timeout: a trigger no longer on the page is skipped at once, and a dialog's pass ends when that dialog has closed.
- **Found on the way: map labels and late fonts.** The maps measure their labels again when web fonts finish loading, so which names fit no longer depends on how fast the fonts arrived (as FloorPlan since P5.28).

**Done when** the map test and the phone test pass in CI, and the decisions are in `docs/decisions.md`.

### P5.31b — IPS QR codes checked with the NBS validator (owner, 2026-10-15)
The owner allowed `ips.nbs.rs`. Every IPS QR text the stories and examples show is sent to the National Bank of Serbia's validator (`https://nbs.rs/QRcode/api/qr/v1/validate`), and the texts it accepts are locked in `ips-qr.test.ts`, so a change to `ipsQrText` that writes them differently fails until it is checked there again.

**Done when** every code is "OK." at the NBS validator, the unit test passes in CI, and the result is in `docs/decisions.md`.

### P5.44–P5.81 — The last batch of Phase 5 (owner, 2026-10-15)
A design system: screens and states only. All data, numbers, rules, codes, legal texts and calculations come from the application through props; examples are illustrative. **Assemble from what exists first** (TreeView / TreeTable, DataTable, ReportPage, the StatutoryFormPage grid with two-level headers, DocumentPage with "Based on" and RelatedDocuments, the Original / Change / New pattern, EditableGrid, RegisterPage, PeriodicRunPage, DetailPage, RecordFormPage, WorklistPage, KanbanBoard, CalendarView, ResourceSchedule, Gantt, FileBrowser, Signing, QrCode, SettingsPage, SessionList, CodeInput, RecoveryCodes, AuthShell, EmailFirstForm, PasswordField, PortalShell, charts, maps); a new component only when something is truly missing, each listed in the report with the reason. Examples: one desktop and one phone story per screen, every intermediate state and interaction story `'!dev'`. Tokens only, the provider's formats and locale, right to left, light / dark, axe, keyboard, no sideways scroll on phones, "fix the class", decisions in `docs/decisions.md`. Five branches and pull requests in the order A, B, C, D, E (E added by the owner the same day); the next starts when the previous is green; a report in Serbian on each pull request. No release, no Phase 6.

#### Group A — Accounting and trade
- **P5.44 Chart of accounts and the account card.** The chart as a tree (classes, groups, synthetic and analytic accounts), search, an account's details; the account card: opening balance, entries with a running balance, period totals, drill-down to the source document.
- **P5.45 Trial balance and financial statements.** Opening / turnover / closing × debit / credit, by class and synthetic account, a period comparison, drill-down to the account card; the balance sheet and the income statement with the previous year beside and a notes slot.
- **P5.46 Cash book.** Cash receipt and payment slips, the daily cash journal with the balance per day, the cash limit warning from data.
- **P5.47 Fixed assets.** The asset card (acquisition, location, responsible person, depreciation group), the monthly depreciation run (PeriodicRunPage), disposal and sale.
- **P5.48 Travel orders.** The order, expenses with receipt photos, per-diems, the settlement, approval.
- **P5.49 Purchasing chain.** Purchase order → goods receipt (received against ordered, differences, the Original / Change / New pattern) → the link to the supplier invoice (three-way match).
- **P5.50 Sales chain.** Quote → order → delivery note → invoice; "Create … from" in one click; the chain visible in RelatedDocuments.
- **P5.51 Item card and transfers.** Receipts, issues, the balance per warehouse and its value; a transfer between warehouses.
- **P5.52 Production.** A bill of materials (a tree with quantities and units), the work order (planned against used material, finished goods, scrap), the production plan on the Gantt.
- **P5.53 Retail price calculation (kalkulacija).** Purchase price, dependent costs, margin, VAT and retail price per line; computed columns and totals from the application.
- **P5.54 Price lists, discounts and promotions.** Several price lists, prices per customer or group, promotions with their validity.
- **P5.55 Compensation, cession and assignment.** The parties, the items offset, each party's signature.
- **P5.56 Late-payment interest.** The calculation per partner and period; the rate table from data.
- **P5.57 Stocktaking lists.** The count (the existing scanner count), surpluses and shortages, posting the differences.
- **P5.58 Budget and cost centres.** Plan against actual by cost centre and project, variances.
- **P5.59 Foreign currency.** The NBS exchange-rate list, FX accounts, invoices in foreign currency, exchange-rate differences.
- **P5.60 Loans and leasing.** The repayment schedule, instalments, interest, the outstanding balance.
- **P5.61 Service and author contracts.** Taxes and contributions calculated by the application (a small payroll run).

#### Group B — Users, HR, documents and governance
- **P5.62 My profile.** Language, theme, turning on two-factor sign-in (a QR code for an authenticator app, the code, recovery codes), passkeys, my devices and sessions.
- **P5.63 Sign-in flows.** Forgot password, new password, the two-factor code, accepting an invitation, account locked, session expired — from the existing building blocks.
- **P5.64 Recruitment.** A job posting, candidates on a Kanban (applied → interview → offer → hired / rejected), scorecards, interview scheduling.
- **P5.65 Onboarding a new employee.** A checklist (equipment, accounts, training, documents to sign) with owners and due dates.
- **P5.66 A document from a JSON definition.** The documents are rendered by liro-folio, not by the design system: choose the document type, a form generated from the JSON field definitions (field types, required, sections, conditions), a live preview of the PDF the application returns (DocumentFrame), the number from the registry (P5.68), send for signature. Several types as data only: decision (rešenje / odluka), conclusion, letter, business letter, proforma, invoice or advance invoice outside SEF or for abroad, rulebook, minutes, report, minutes of the general assembly, supervisory or management board.
- **P5.67 CRM.** Lead → opportunity → quote pipeline on a Kanban, the contact's timeline, activities.
- **P5.68 Registry book (delovodnik).** Incoming and outgoing acts (number, date, sender or recipient, subject, assignee, due date), linked to documents and files.
- **P5.69 Archive book and retention.** Retention periods per document type (from data), what expires, disposal with minutes.
- **P5.70 Meetings of company bodies.** The schedule, an invitation with materials, attendance and quorum, voting per agenda item, minutes and decisions (P5.66 and Signing).
- **P5.71 Contracts.** A register with expiry and renewal reminders, versions, linked documents.

#### Group C — Health, university, field service, fleet, property
- **P5.72 Patient chart.** A timeline of visits, findings, therapy, lab results with reference ranges and a small trend chart; sensitive fields as in P5.14.
- **P5.73 University.** Exam periods, exam registration, the exam record (zapisnik) with grades, ECTS, the student portal.
- **P5.74 Field service and maintenance.** A technician's work order on the phone (checklist, photos, parts used, the customer's signature); the preventive maintenance plan for machines.
- **P5.75 Fleet.** Vehicles, registration, services, fuel, reminders.
- **P5.76 Property management.** Units, tenants, leases, rent invoicing, maintenance requests.

#### Group D — Analytics and automation
- **P5.77 Pivot analysis.** The user chooses rows, columns, values and aggregations, filters, drill-down to records, export. An MIT library if a maintained, accessible, themeable one exists, otherwise built on TanStack Table (MIT, already ours); in its own subpath, loaded only there; the evaluation recorded.
- **P5.78 Automation rules.** A "When X happens, if Y, do Z" builder (triggers, conditions and actions from data), a run log, enable and disable.
- **P5.79 Merging duplicates.** Two partners or items side by side, choose the values to keep, merge, the result.
- **P5.80 Scheduled reports.** A report sent by e-mail on a schedule, recipients, format, the last runs.
- **P5.81 Customizable dashboard.** The user adds, removes, resizes and rearranges cards (a keyboard alternative to dragging), saved layouts.

#### Group E — AML compliance (owner, 2026-10-15)
Anti-money laundering in the spirit of Napier AI, for an accounting firm as an obligated entity and for companies monitoring their own transactions. Same rules as the batch: assemble from what exists first; desktop and phone; design system only — every rule, threshold, list, score and legal text comes from the application; examples illustrative (Knjigovodstvo Jelić's clients and a trading company's transaction monitoring; every name, list and match invented). A fifth branch and pull request after Group D, with the report in Serbian; then stop.
- **P5.82 Client risk assessment.** A questionnaire (client type, activity, country, ownership, products, delivery channels), the resulting risk (low / medium / high) with the factors that drove it, an override with a reason, the next review date.
- **P5.83 Know your customer (client file).** Identification and documents (with expiry), beneficial owners as a tree (HierarchyChart) with ownership shares, PEP status, the source of funds, the review history; "Review due" states.
- **P5.84 Screening.** Results of checks against sanctions, PEP and watch lists (from the application); each potential match side by side with the client (name, date of birth, country, score); the decision True match / False positive with a reason; the re-screening history.
- **P5.85 Transaction monitoring alerts.** An alert queue (rule triggered, client, amount, risk, age, assignee; WorklistPage); an alert's detail with the transactions that triggered it and the client's profile; close with a reason, escalate to a case.
- **P5.86 Case management.** The case page (DocumentPage) with a timeline, linked alerts, transactions and documents, notes, tasks, the decision (no suspicion / report), four-eyes approval.
- **P5.87 Suspicious transaction report.** The report form for the authority (generated from JSON as in P5.66), review and submission states, the record of what was sent and when; confidentiality marked clearly (the client must not be informed).
- **P5.88 AML overview and obligations.** A dashboard (clients by risk, reviews due, open alerts and cases, ageing), the compliance officer and deputy, staff training records, internal procedures (documents), retention of records, the audit trail.

**Done when** each group's pull request is green in CI with every item's screens (desktop and phone stories), new components with their stories and tests, the decisions in `docs/decisions.md`, and the report in Serbian on the pull request.

#### Consolidation (owner, 2026-10-23)
The examples grew to almost three hundred screens; SAP repeats five or six floorplans. Keep every component; reduce the examples to a small canonical set; module authors compose their own screens from the floorplans. Two branches and pull requests, in order. The owner's two principles apply to every screen from now on: **simplicity first** (show the minimum by default, advanced options tucked away) and **ease sells** (a first-day user manages without training, under pressure: fewest steps, big clear targets, immediate visible feedback, Undo instead of confirmations for reversible actions, nothing that blocks the user).
- **P5.89 Consolidate to floorplans.** Seven floorplans in `docs/floorplans.md` (when to use each, its anatomy on desktop and phone, where actions go, how editing works, empty / loading / error states), each backed by an existing template: F1 List, F2 Record, F3 Document (one line editor for every document, the same on desktop and phone), F4 Worklist (auto-handled items first), F5 Overview and analysis, F6 Steps, F7 Special canvases; plus AppShell, AuthShell and PortalShell. Keep only the canonical example screens (each desktop and phone), brought onto their floorplan, with the walk-through; delete every other example screen, its stories, data, routes and pictures; components stay with their own stories. `docs/recipes.md`: one short entry per removed screen, by domain. CI reduced to what the smaller set needs.
- **P5.90 The owner's review, applied to the floorplans.** Twenty-one findings, each fixed as a class wherever it applies: table headers without white gaps; the line editor flush in its card, one look and one focus style per cell, rebuilt on phones (one card per line, the totals in one place); the invoice draft's date of supply and place of issue, only the usual line columns by default; no nested scroll boxes on phones; module tabs that show they scroll; long text that wraps and unreadable files as an error in words; sticky headers in pure CSS; the bank statement automatic first; number keys in the Questionnaire; a collapsible course outline with rich lessons; quick time entry; empty states with room; a service picker for bookings; no dots in the agenda; a quieter reveal dialog; the "now" line never over text; helper text under the input; resource schedules on phones as today's lists; restaurant service and POS for a first-day waiter; toasts that never block.
- **P5.91 P5.90 follow-ups (owner, 2026-10-23).** The till's renamed props (`productsOpen` → `orderOpen` and the rest) are told in the release notes with the migration; no repository uses the old names. A table's sticky first column (its own compositing layer, P5.28) lost a row's line where rows stand at fractional positions (the invoice list, the bank statement): fixed for every table with a sticky first column, with a check.

- **P5.92 Templates consolidated to the core (owner, 2026-10-27).** About eighteen page templates stay: AppShell, AuthShell, PortalShell, PosShell, Launchpad, ListPage, DetailPage, RecordFormPage, SettingsPage, DocumentPage, WorklistPage, DashboardPage, ReportPage, StatutoryFormPage, RegisterPage, PeriodicRunPage, StatusPage, NotificationsPage, PrintPage and PrintDocument. The domain templates are folded into them plus components, each a recipe in `docs/recipes.md`: LegalActPage and LegalSearchPage (DocumentPage / ListPage with LegalText, LegalCompare, SearchResultList), CoursePage, ArticlePage and AskPage (one reading page), PickList and StockCount (WorklistPage / ListPage in touch density), PaymentOrderForm (RecordFormPage), SigningPage (a record page with SignerList), FileBrowser (ListPage with the file components). PrintCertificate, PrintGradeReport, PrintFinding and PrintLegalAct are removed: layouts are JSON definitions rendered by liro-folio from the print parts; the Serbian formal acts come in a later step. Components stay. Each template shows four to six stories in the sidebar (default, empty, loading, error, phone, the one that matters most); every other variant carries `'!dev'`.
- **P5.93 The owner's review, round 4.** Forty-nine findings in groups A–H, each fixed as a class: one read-only state for fields; loading and empty states always visible and useful; toasts with a close button that never cover; opaque sticky bars; words that never break; alignment; the library's tooltips; a visible now marker; scrolling phone tabs; refusals that are not errors; portals and booking; the till and restaurant; accounting, documents and files; help, reading, legal and messages; planning, trees and maps; analytics (Serbian map charts, new chart kinds, a simpler pivot, rules as blocks, the diagram's attribution); new components (CodeBlock, the assistant's work display).
- **P5.94 The owner's review, round 5 (owner, 2026-10-29).** Twenty findings, each fixed as a class, under the two principles (simplicity first; ease sells): (1) a fourth level of the Serbia map, the city municipalities, loaded on first use, and the last level plainly the last; (2) every date and date-range field takes typed input at both ends; (3) proof documents on employee requests, set by data, with a Reason per paid leave and the attachments seen by the approver; (4) a button's or a label's word never breaks inside, with a check over every story; (5) a POS sale paid in parts by any ways in any order, one electronic part at a time, change only from cash, limits from data, the reversal said before cancelling; (6) the Gantt's rows lined up to the pixel with a test, the today badge covering no label; (7) a key/value label on its value's first line, "Show" unavailable when not allowed; (8) a chosen mention ends the search in every composer; (9) the Questionnaire's number key and Enter, with a test that holds against page shortcuts; (10) titles never underlined, hover on the surface; (11) the newsletter's thanks alone; (12) the assistant's busy state with Stop; (13) the one "current" look in green, Restore without a question; (14) BalanceBar on one baseline, measured; (15) never two separators in a row; (16) calendars keep only the now badge in the time gutter, times by the locale; (17) AreaMap in one colour unless the data asks for more; (18) the Launchpad without a title or Customize, its tiles chosen in Preferences; (19) the bank statement as a worklist for 1,000+ lines (its own pull request, B); (20) common questions for any portal, starting the request they need. Not in this round: the POS receipt format, the Serbian formal acts and the PDF (the owner provides them later).

- **P5.95 Printed documents leave the Design System (owner, 2026-10-29).** A new standalone project, liro-folio (its own repository, on `@veljaos/tokens` only, never `@veljaos/ui` or React), renders every printed document as a PDF; the Design System owns only the screens around documents and shows the PDF or page images liro-folio produced. Supersedes the decision of 2026-10-27 "Printouts are JSON definitions" (the renderer it names is liro-folio). Removed from `@veljaos/ui`, with their stories, tests, story data, messages, exports and baselines: PrintPage, PrintDocument and every print part, print-logic, ReceiptPreview (breaking; announced in the changeset). Kept, as screens: DocumentPage, DocumentFrame, PageViewer, QuickPreview, FilePreview, AttachmentList, EmailPreview, LegalText, LegalCompare, SignerList, QrCode and the IPS QR builder, ReceiptResult, ReceiptFinder, ReceiptKindPicker, PaymentDialog. The examples that showed a document as printed show liro-folio's output instead (a page-shaped stand-in with "Download PDF"); the till's receipt is ReceiptResult. The print rules recorded earlier are marked "moved to liro-folio" in `docs/decisions.md`; the e-signature coordinate convention stays there for the future signature position picker. Browser printing of a screen stays.
- **P5.96 The owner's review of P5.94–P5.95 (owner, 2026-10-30).** Four findings, each fixed as a class, under the two principles: (1) questions and answers are a page of their own in a portal — an entry in its navigation (desktop and phone), one search over questions and answers with the matches marked, categories with counts from data, a list that stays fast with 300+ questions, each answer on its own address with the request it starts, "nothing found" offering to ask; the portal home keeps three to five top questions and "All questions"; (2) a map names an area only while it is hovered or focused, never by itself and never left behind after a drill-down (RegionChart, AreaMap, every level, desktop and phone), with a test; (3) every worklist with state filters has "All" first with its count, the queue still opening on "Needs you"; (4) the Launchpad's default story is named "Home", and no story name describes something that is gone. The release 0.1.0-alpha.5 waits for the owner's word.

**Done when** P5.89's pull request (protected: CI changes, merged by the owner), P5.90's, P5.91's, P5.92's, P5.93's, P5.94's (A and B), P5.95's and P5.96's are green, with the report in Serbian on each.

**End of Phase 5:** `0.1.0-alpha.5`; report.

---

## Phase 6 — Acceptance and release (about 2–3 weeks)

### P6.1 — Full language and direction matrix
Every story in light/dark × ltr/rtl, plus Arabic and Japanese sample-text stories for every component with text. Fix every finding; record anything left open in `docs/decisions.md` with a reason (there should be nothing).

### P6.3 — Performance budget
Measure the JavaScript and CSS needed for the list example and the document example in mobile emulation (mid-range device, slow 4G). Record the numbers and set a budget in CI a little above them.

### P6.6 — Full cleanup
Remove dead code, unused files, stale scripts and stories; every comment in English and true to the code it describes; consistent names across packages, stories and docs. Final pass on `AGENTS.md` and `docs/decisions.md`.

*(P6.2 "Manual WCAG 2.2 checks" and P6.4 "Documentation for consumers" are removed by the owner's decision of 2026-10-23; the guide for `liro-core` is written outside the agent.)*

### P6.5 — Release 1.0.0
All steps `done`; changesets complete; `1.0.0` published with exact versions; final report to the owner in Serbian: what exists, where to see it, what `liro-core` does next.

**After 1.0.0 (not part of this plan):** the adapter in `liro-core`; the owner-approved human checks with a screen reader and native Arabic and Japanese readers, run on the product's real screens once they exist.

---

## Appendix A — The look, carried over from the previous Design System

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
| surface.selected | gray2 | #363636 |
| surface.disabled | gray2 | rgba(255,255,255,0.06) |
| surface.backdrop | rgba(0,0,0,0.45) | rgba(0,0,0,0.65) |
| surface.scrim | rgba(0,0,0,0.55) | rgba(0,0,0,0.55) |
| surface.inverse | gray9 | gray2 |
| text.primary | gray9 | gray1 |
| text.secondary | gray7 | #B3B0AD |
| text.tertiary | #6A6866 | gray5 |
| text.disabled | gray5 | gray6 |
| text.onAccent | white | white |
| text.brand / text.link | blue7 | blue4 |
| text.onInverse | white | black |
| text.logo | blue6 | blue4 |
| border.default | gray3 | #3B3B3B |
| border.strong | gray4 | #4D4D4D |
| border.subtle | gray2 | #2E2E2E |
| border.brand | blue6 | blue5 |
| border.focus | blue6 | blue4 |
| border.control | gray6 | gray6 |
| border.selected | gray7 | gray4 |
| brand.solid / solidHover / solidActive | blue6 / blue7 / blue8 | blue6 / blue7 / blue8 |
| brand.subtle / subtleHover | blue0 / blue1 | rgba(0,120,212,0.16) / rgba(0,120,212,0.26) |
| brand.onSolid | white | white |
| brand.accent | teal6 | teal4 |
| chart.main | blue6 | blue4 |
| chart.comparison | gray6 | gray5 |
| chart.other | gray8 | gray3 |
| chart.category1 | blue6 | blue5 |
| chart.category2 | #970E75 | #B75B97 |
| chart.category3 | #7E6EF2 | #8475F9 |
| chart.category4 | #179A8E | #059488 |
| chart.category5 | #334DB0 | #5778DF |

Status tones — `fg` / `bg` / `border` / `solid`:

| Tone | Light | Dark |
|---|---|---|
| success | green7 / green0 / green2 / green7 | green3 / rgba(16,124,16,0.20) / rgba(16,124,16,0.45) / green6 |
| warning | orange8 / orange0 / orange2 / orange6 | orange3 / rgba(216,59,1,0.20) / rgba(216,59,1,0.45) / orange6 |
| danger | red7 / red0 / red2 / red7 | red3 / rgba(164,38,44,0.22) / rgba(164,38,44,0.50) / red6 |
| info | blue7 / blue0 / blue2 / blue6 | blue3 / rgba(0,120,212,0.18) / rgba(0,120,212,0.45) / blue6 |
| neutral | gray9 / gray1 / gray3 / gray7 | gray1 / rgba(255,255,255,0.07) / #3B3B3B / gray5 |
| premium | violet7 / violet0 / violet2 / violet6 | violet3 / rgba(121,80,242,0.20) / rgba(121,80,242,0.45) / violet5 |

`surface.inverse`, `text.onInverse` (tooltips) and `border.control` (the boundary of inputs, checkboxes, radios and the off state of switches, at least 3:1 on every surface for WCAG 1.4.11) were added in P2.1 by the owner's decision. In P3.6 the owner made `surface.selected` neutral (it was blue0 / rgba(0,120,212,0.18)) and added `border.selected` (the start-edge bar of a selected row and the border of a selected card): blue is kept for actions, links, focus, checked controls and the highlighted option. In P4.6 the owner added the `chart.*` meanings: one brand blue for a chart's main series, greys for the comparison and the rest, and an opt-in categorical palette of five hues in a fixed order, validated for colour-vision deficiency; in P4.7c the owner replaced its hues that read as a status (orange, green) with blue, magenta, purple, teal and indigo (values outside the ramps), and made the light `warning.solid` orange6 (orange7 read like danger's red) — icons only, never on the page background. In P4.1 the owner added `text.logo` (blue6 / blue4, the colours of the logo files) for the app lockup, the application's name written as the logo; `text.brand` is unchanged.

On a selected row or card (`surface.selected`, marked `data-liro-surface="selected"`), five dark-theme text colours that measure below 4.5:1 over the selection take the next lighter shade, the one their hover already uses (P4.3, owner): status.danger.fg red3 → red2, status.premium.fg violet3 → violet2, and the family texts primary blue4 → blue3, document violet3 → violet2, destructive red3 → red2. The light theme needs none.

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

## Appendix B — Lessons carried over from the previous Design System

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
