# AGENTS.md — working rules for the Liro Design System

Read this file, `BUILD-PLAN.md` and `docs/decisions.md` at the start of every session. This file
condenses sections 1, 2, 5 and 6 of the plan into rules. Every rule names what enforces it: a
lint rule, a test or check, or **review** (a person or agent reading the pull request). Where a
plan step will add an automatic check later, the rule says which step.

## What this repository is

The shared look, components and screen templates of every Liro application: `@veljaos/tokens`,
`@veljaos/ui` and `@veljaos/eslint-config`, plus a Storybook catalogue (`apps/storybook`) and a
consumer check (`apps/consumer-check`). Liro Business Core (`liro-core`) adapts to it; it never
adapts to the Core.

## Working rules

| #   | Rule                                                                                                                                                                                                                                                                          | Enforced by                                                                                                              |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| W1  | One plan step = one branch `bp/<step-id>-<short-name>` = one pull request. Commits start with the step ID. The status table in `BUILD-PLAN.md` is updated in the same pull request.                                                                                           | Review                                                                                                                   |
| W2  | Done means every line of the step's _Done when_ passes in CI on Linux. Run the checks; do not assume them.                                                                                                                                                                    | CI workflow `CI` (required checks on `main`)                                                                             |
| W3  | After opening a pull request, run `gh pr merge <number> --auto --squash`. **Exception:** a pull request that changes a protected file gets no auto-merge; the owner merges it.                                                                                                | Review; branch protection on `main`                                                                                      |
| W4  | A pull request that changes a protected file (lint configuration, `tsconfig*`, `.github/`, check scripts, Playwright/Storybook test configuration, accessibility settings, `.claude/settings.json`) has a section `## Protected file changes` naming each file with a reason. | Workflow `Protected files` (`scripts/protected-files.mjs`, tests in `scripts/protected-files.test.mjs`)                  |
| W5  | Never widen `.claude/settings.json` without the owner's explicit approval in chat. Never use administrator rights (`--admin`, `runas`).                                                                                                                                       | Deny list in `.claude/settings.json`; `Protected files` check                                                            |
| W6  | Stop and ask when a _Stop and ask if_ condition occurs, when the plan does not cover something, or when a check fails for a reason you do not understand.                                                                                                                     | Review                                                                                                                   |
| W7  | English in code, identifiers, comments, commits, stories and docs. Reports to the owner in Serbian, in plain language, at the end of every step.                                                                                                                              | Review                                                                                                                   |
| W8  | No `eslint-disable` comments; exceptions go into `eslint.config.mjs`.                                                                                                                                                                                                         | `linterOptions.noInlineConfig`, `reportUnusedDisableDirectives: "error"`, `--max-warnings 0`                             |
| W9  | No `@ts-ignore` / `@ts-nocheck`; `@ts-expect-error` only in test files, with a description.                                                                                                                                                                                   | `@typescript-eslint/ban-ts-comment`                                                                                      |
| W10 | TypeScript `strict` with `noUncheckedIndexedAccess`; lint uses the type-checked presets.                                                                                                                                                                                      | `pnpm typecheck`; `tseslint.configs.strictTypeChecked`                                                                   |
| W11 | Every dependency pinned to an exact version; versions and reasons recorded in `docs/decisions.md`.                                                                                                                                                                            | `save-exact=true` in `.npmrc`; review                                                                                    |
| W12 | Formatting is Prettier's.                                                                                                                                                                                                                                                     | `pnpm format:check` in CI                                                                                                |
| W13 | Packages must work when installed from their tarballs: complete `files`, nothing private, license and notices inside.                                                                                                                                                         | `pnpm consumer-check` (`scripts/consumer-check.mjs`, `apps/consumer-check/check.mjs`)                                    |
| W14 | `THIRD-PARTY-NOTICES.md` gets the exact notice of any third-party code added to the repository, the packages or the Storybook build, in the same pull request.                                                                                                                | Review                                                                                                                   |
| W15 | Releases are published only by `.github/workflows/publish.yml`, on a tag `v<version>` on `main`, equal to every package version. No personal token. The owner approves each tag push.                                                                                         | The workflow's own checks (commit on `main`, tag = versions); `git push` of tags is outside the agent's allowed commands |

## Design System rules (plan sections 1, 2 and 5)

| #   | Rule                                                                                                                                                                                                                                                                                                                                                 | Enforced by                                                                                                                                                                                                                                                                                     |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| D1  | No backend: no API calls, cookies, backend URLs, tenants, permissions, manifests or document types. Everything arrives through props and `LiroProvider`.                                                                                                                                                                                             | Review                                                                                                                                                                                                                                                                                          |
| D2  | No translation and no text of its own: components show the text they are given; their own few strings come from provider `messages` (English defaults in `packages/ui/src/provider/messages.en.ts`).                                                                                                                                                 | Review; from P1.5 the `LiroMessages` type makes a missing key a compile error                                                                                                                                                                                                                   |
| D3  | No permission decisions: show what you are told — hidden, read-only, or disabled with a visible reason.                                                                                                                                                                                                                                              | Review                                                                                                                                                                                                                                                                                          |
| D4  | Money and numbers are decimal strings. Never convert to a JavaScript `number`, never add, round or truncate; totals arrive computed. Unreadable input parses to `null`, never `0`.                                                                                                                                                                   | Unit tests in `packages/ui/src/provider/format.test.ts` (extended in P1.5); review                                                                                                                                                                                                              |
| D5  | No business domain inside components ("invoice", "VAT", "PIB" …). Fictitious examples in stories are fine.                                                                                                                                                                                                                                           | Review                                                                                                                                                                                                                                                                                          |
| D6  | No raw colours: only semantic names (`bg-surface-raised`, `text-secondary`, `border-strong`, `bg-status-danger-bg`). No `bg-red-500`, no `text-[#…]`, no `rgb(…)`, no `dark:` variant, no hex outside `packages/tokens`. The meanings and their utilities: Storybook "Foundations/Tokens".                                                           | `liro/no-raw-colors` in `@veljaos/eslint-config`, applied to this repository by `eslint.config.mjs` (fixture tests: `packages/eslint-config/src/rules.test.ts`, `fixtures/`); the Tailwind theme removes the raw palette (`--color-*: initial`), tested in `packages/tokens/src/tokens.test.ts` |
| D7  | Three token layers: values → meanings → components. Components choose a meaning, never a value. Buttons choose an **intent** or a **family**, never a colour or variant. All values and meanings live in `packages/tokens/src/tokens.ts`, carried over 1:1 from Appendix A; the build generates `tokens.css`, `theme.css` and `tokens.json` from it. | `packages/tokens/src/tokens.test.ts` compares the tokens with Appendix A as written in `BUILD-PLAN.md`; the ramps are not Tailwind utilities; from P1.3 the `Button` props have no `color` or `variant`, so the types enforce it                                                                |
| D8  | Layout (width, alignment, spacing to neighbours) may be set freely with Tailwind; colour may not (D6).                                                                                                                                                                                                                                               | Review                                                                                                                                                                                                                                                                                          |
| D9  | Logical properties only: `ms-`/`me-`/`ps-`/`pe-`/`start-`/`end-`/`text-start`; never `ml-`/`left-`/`text-left`. Pointer and keyboard movement measures from the leading edge.                                                                                                                                                                        | `liro/logical-properties` in `@veljaos/eslint-config` (Tailwind classes and inline `style`), with fixture tests; the ltr/rtl runs of the visual and accessibility tests                                                                                                                         |
| D10 | Consumers import `@veljaos/ui` only — never Radix, never `src/primitives/`. Primitives are not exported from `packages/ui/src/index.ts`.                                                                                                                                                                                                             | `no-restricted-imports` in `@veljaos/eslint-config` (verified by consumer-check); review of `index.ts`                                                                                                                                                                                          |
| D11 | Everything that differs between applications, languages and customers goes through `LiroProvider` (locale, direction, messages, format, today, week start, colour scheme, link component), each with a default.                                                                                                                                      | Review; provider tests in `packages/ui/src/provider/liro-provider.test.tsx`                                                                                                                                                                                                                     |
| D12 | Language tags name the script (`sr-Latn`, `sr-Cyrl`); bare `sr` is never used.                                                                                                                                                                                                                                                                       | Review                                                                                                                                                                                                                                                                                          |
| D13 | One primary-emphasis button per screen; the main action is last in its group.                                                                                                                                                                                                                                                                        | Review (P1.3 adds the Button rules)                                                                                                                                                                                                                                                             |
| D14 | Modal vs drawer vs page, actions top and bottom, list layout (search start, filters beside, actions end, paging bottom): Appendix B.8.                                                                                                                                                                                                               | Review                                                                                                                                                                                                                                                                                          |
| D15 | Text whose language differs from the page carries `lang` (use `useLangAttribute` / `langAttribute`), and its own `dir` when its direction differs. Fonts, sizes and weights come only from the type utilities (`font-sans`, `text-md`, `text-h2`, `font-semibold`, …); amounts use `tabular-nums`.                                                   | Review; tests in `packages/ui/src/provider/lang.test.tsx`; the Scripts story in the visual tests                                                                                                                                                                                                |

## Definition of done for every component (plan section 6)

| #   | Requirement                                                                                                                                                                 | Enforced by                                                                                                                                         |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| C1  | Tokens only (D6).                                                                                                                                                           | See D6                                                                                                                                              |
| C2  | Logical properties only (D9).                                                                                                                                               | See D9                                                                                                                                              |
| C3  | No text or formatting of its own except provider `messages` and `format`.                                                                                                   | Review                                                                                                                                              |
| C4  | Stories: default; every supported state (disabled with reason, read-only, error, loading, empty); long text; phone width; one story with Arabic and one with Japanese text. | Review; every story runs in `tests/stories.spec.ts`                                                                                                 |
| C5  | Accessibility: axe with WCAG 2.2 A/AA tags passes in light/dark × ltr/rtl; keyboard-only operable; focus never hidden; targets ≥ 24×24 px; no drag-only interaction.        | `tests/accessibility.spec.ts` (axe, four modes); the a11y addon with `test: "error"` in story tests; `jsx-a11y` strict; review for the manual items |
| C6  | Visual baselines on Linux for light/dark × ltr/rtl.                                                                                                                         | `tests/visual.spec.ts` (`maxDiffPixels: 0`)                                                                                                         |
| C7  | Unit tests for any logic (parsing, counting, keyboard handling).                                                                                                            | `pnpm test` (Vitest); review for presence                                                                                                           |
| C8  | Every prop does something, and is exercised by a story or a test (Appendix B.9: an ignored prop was found eleven times, by no check).                                       | Review                                                                                                                                              |
| C9  | Exported from `@veljaos/ui`, and its story says what it is for, when to use it and when not to.                                                                             | Review; consumer-check typechecks the packed exports                                                                                                |

## Components and templates

Update this list in the pull request that adds, renames or removes one.

| Name                                                                                             | Kind       | Step | Note                                                                                                         |
| ------------------------------------------------------------------------------------------------ | ---------- | ---- | ------------------------------------------------------------------------------------------------------------ |
| `LiroProvider`, `useLiro`                                                                        | Provider   | P0.3 | Subset: `locale`, `direction`, `colorScheme`, `format` (number, money, scheme, decimals). P1.5 completes it. |
| `createFormat`, `formatDecimal`, `directionForLocale`, `numberSchemeForLocale`, `NUMBER_SCHEMES` | Helpers    | P0.3 | Formatting on decimal strings.                                                                               |
| Tokens page (`apps/storybook/src/foundations/tokens.stories.tsx`)                                | Foundation | P1.1 | Every value and meaning in both themes; reads `packages/tokens/src/tokens.ts`.                               |
| Typography page (`apps/storybook/src/foundations/typography.stories.tsx`)                        | Foundation | P1.2 | Scripts (seven script classes) and type scale.                                                               |
| `langAttribute`, `useLangAttribute`                                                              | Helpers    | P1.2 | The `lang` rule (D15).                                                                                       |
| `Button`                                                                                         | Component  | P0.2 | Placeholder for the packaging check; replaced by the intent/family `Button` in P1.3.                         |

No templates yet.

## How to add a component

1. Take the step from the status table (W1). Create the branch.
2. If it needs a shadcn primitive, add it with the shadcn CLI into `packages/ui/src/primitives/`,
   adapt it to Liro tokens and logical properties, and never export it (D10). Add its notice to
   `THIRD-PARTY-NOTICES.md` (W14).
3. Write the component in `packages/ui/src/components/<name>.tsx` (templates in
   `packages/ui/src/templates/`). Props only; text from props or provider `messages`; numbers and
   dates through provider `format`.
4. Export it and its props type from `packages/ui/src/index.ts`.
5. Write `<name>.stories.tsx` next to it with every story of C4, and a description (C9).
6. Write unit tests for its logic (C7).
7. Run locally: `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build`, `pnpm consumer-check`,
   `pnpm build-storybook`. Look at it in `pnpm storybook` in both themes, both directions and at
   phone width.
8. Add its baselines (next section), add it to the list above, update the status table, open the
   pull request.

## How to view Storybook locally

```sh
pnpm install
pnpm build        # Storybook reads the built @veljaos/tokens
pnpm storybook    # then open http://localhost:6006
```

Storybook is not hosted anywhere. Each CI run keeps its static build as the artifact
`storybook-static` (7 days), and each published version as `storybook-<version>` (90 days).

## How to refresh visual baselines

Baselines live in `apps/storybook/tests/__screenshots__/` and are generated **only** in the
Playwright image that CI uses (pinned by digest in `.github/workflows/ci.yml`). Never commit
screenshots taken on Windows or macOS directly.

- **Through CI.** Push the branch. When a story has no baseline or looks different, the job
  `Story tests, accessibility, visual` fails and uploads the artifact `playwright-results`, which
  contains the new images in `apps/storybook/tests/__screenshots__/`. Review them, copy them into
  the branch, commit.
- **Locally, with Docker.** `node scripts/update-baselines.mjs` runs install, build, Storybook
  build and the visual tests with `--update-snapshots=changed` inside the same image, and writes
  new and changed images back into `apps/storybook/tests/__screenshots__/`. Review with
  `git diff`, commit, and let CI confirm.

A baseline changes only when the look is meant to change; say why in the pull request.

## How to publish a version

1. In a step's pull request, set the same new version in `packages/*/package.json` (from the end of
   Phase 1, with Changesets). Merge.
2. Tag the merge commit on `main`: `git tag v<version> <commit>` and `git push origin v<version>`
   (the owner approves the push).
3. Workflow `Publish` checks, builds, publishes to GitHub Packages and confirms each version.
