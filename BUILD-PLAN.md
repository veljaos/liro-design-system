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
| P5.8 | Calendar and scheduling | P2.3 | todo | | |
| P5.9 | Tree | P2.8 | todo | | |
| P5.10 | Touch mode and POS | P5.3 | todo | | |
| P5.11 | Scanner-first warehouse | P5.3 | todo | | |
| P5.12 | Learning | P5.1, P5.15 | todo | | |
| P5.13 | Attendance and quick marking | P3.4 | todo | | |
| P5.14 | Sensitive fields | P2.8 | todo | | |
| P5.15 | Print templates | P4.5 | todo | | |
| P5.16 | Portal shell | P4.1 | todo | | |
| P5.17 | Industry example screens | P5.8–P5.16 | todo | | |
| P5.18 | Complex documents | P4.5, P3.4 | done | 2026-10-09 | EditableGrid line types, "Add line ▾", lookup / tax category / unit columns, line details, LookupCreateDrawer, a row window for 300 positions (measured) (D1); DocumentPage block order, DocumentReferences, DataTable line types, DocumentTotals recap / deductions / exchange / footnotes, DocumentCurrency, DocumentNotes, DocumentSpecification, corrective documents, cancellation (D2); examples F-2026-0419, IS-2026-007, F-2026-0418, F-2026-0415, KO-2026-0009, F-2026-0407 + ST-2026-0004 |
| P5.19 | Catalogs at scale | P3.1, P2.2 | done | 2026-10-09 | LookupField (recent, kinds, create, one-off, Search all…, virtualised) (D1); LookupDialog, ImportWizard, BulkEditDrawer, DuplicateWarning, inactive records by views and a neutral badge (E); customers example with 50,000 records and import |
| P5.20 | Registers and official forms | P4.4, P5.1 | done | 2026-10-09 | RegisterPage and StatutoryFormPage; examples VAT return September 2026 and work-injury register 2026 (and 5,000 entries) |
| P5.21 | Common business processes | P3.4, P4.3 | done | 2026-10-09 | PermissionMatrix (users and roles composed from DataTables), SetupChecklist, SignerList and SigningPage (C); MatchingView, BalanceBar, PeriodicRunPage (F); examples users and roles, setup, contract signing, bank statement 188, journal entry NK-2026-0912, payroll September 2026 |
| P5.21a | TanStack Virtual for every list | P5.21 | done | 2026-10-09 | The company switcher, LookupField, MatchingView and EditableGrid's row window on `useVirtualizer` with the shared window rules (600px, the focused or active row kept); the custom virtualiser removed (measured) |
| P5.21b | Overscan per component | P5.21a | todo | | First step of Phase 5 part 2, before P5.8 (owner, 2026-10-09) |
| P6.1 | Full language and direction matrix | Phases 1–5 | todo | | |
| P6.2 | Manual WCAG 2.2 checks | P6.1 | todo | | |
| P6.3 | Performance budget | P4.8 | todo | | |
| P6.4 | Documentation for consumers | P6.2 | todo | | |
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

**End of Phase 5:** `0.1.0-alpha.5`; report.

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
