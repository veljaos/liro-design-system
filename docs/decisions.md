# Decisions

Why things are as they are. Newest entries at the end of each section. The lessons carried over from Design System 1.0 are added in P0.5.

## Versions

All dependencies are pinned to exact versions (`.npmrc`: `save-exact=true`). Each was the latest stable release on the date shown, unless the line says why not.

### P0.1 — Repository and toolchain (2026-09-24)

| Tool                          | Version | Note                                                                                                                                                                                                                             |
| ----------------------------- | ------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Node.js                       | 24.21.0 | Latest 24 LTS ("Krypton"). `.nvmrc` pins it; `engines` accepts any 24.x. Node 26 is newer but not LTS.                                                                                                                           |
| pnpm                          | 12.6.0  | Pinned through `packageManager` and `engines`. Corepack 0.34 (bundled with Node 24.11) cannot start pnpm 12, which ships as a native binary; run `npx pnpm@12.6.0` or update Corepack (`npm i -g corepack@latest`) locally.      |
| TypeScript                    | 6.0.3   | **Not 7.0.2.** typescript-eslint 8.70.1 supports `typescript >=4.8.4 <6.1.0`; TypeScript 7 (the native compiler) has no supported lint integration yet. Revisit when typescript-eslint supports 7. No `liro-core` pin to follow. |
| ESLint                        | 9.39.5  | **Not 10.11.0.** eslint-plugin-jsx-a11y 6.10.2 (latest) declares support up to ESLint 9 only. Revisit when it supports 10.                                                                                                       |
| @eslint/js                    | 9.39.5  | Matches ESLint.                                                                                                                                                                                                                  |
| typescript-eslint             | 8.70.1  | `strictTypeChecked` + `stylisticTypeChecked` on TypeScript files.                                                                                                                                                                |
| eslint-plugin-jsx-a11y        | 6.10.2  | `strict` preset on JSX/TSX files.                                                                                                                                                                                                |
| @types/eslint-plugin-jsx-a11y | 6.10.1  | The plugin ships no types; needed to typecheck `eslint.config.mjs`.                                                                                                                                                              |
| eslint-plugin-react-hooks     | 7.1.1   | `recommended-latest` flat preset.                                                                                                                                                                                                |
| eslint-config-prettier        | 10.1.8  | Turns off formatting rules; Prettier owns formatting.                                                                                                                                                                            |
| globals                       | 17.12.0 |                                                                                                                                                                                                                                  |
| Prettier                      | 3.9.9   | One configuration, `prettier.config.mjs`. `BUILD-PLAN.md` is excluded so the owner's document is never reformatted.                                                                                                              |
| @types/node                   | 24.13.6 | Latest 24.x, matching the Node.js major.                                                                                                                                                                                         |
| actions/checkout              | v7.0.1  | Pinned by commit SHA in CI.                                                                                                                                                                                                      |
| actions/setup-node            | v7.0.0  | Pinned by commit SHA; reads `.nvmrc`.                                                                                                                                                                                            |
| pnpm/action-setup             | v6.1.0  | Pinned by commit SHA; reads `packageManager`.                                                                                                                                                                                    |

### P0.2 — Packages, build, consumer check (2026-09-24)

| Tool                           | Version | Note                                                                                                                                                                                                                                                   |
| ------------------------------ | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| React, React DOM               | 19.3.0  | `@liro/ui` declares `react ^19.0.0` as a peer; the exact version is used for building and for consumer-check.                                                                                                                                          |
| @types/react, @types/react-dom | 19.3.0  | Match React.                                                                                                                                                                                                                                           |
| tsup                           | 8.5.1   | JavaScript (ESM) and type declarations. Its declaration build sets `baseUrl`, which TypeScript 6 reports as deprecated; `ignoreDeprecations: "6.0"` is passed to that build only, in `tsup.config.ts`, not to any tsconfig. Revisit with TypeScript 7. |
| tailwindcss, @tailwindcss/cli  | 4.3.3   | Builds `@liro/ui/styles.css`.                                                                                                                                                                                                                          |
| Vite                           | 8.3.0   | consumer-check only. **Not 8.3.1**, which was published on 2026-09-24 and is younger than pnpm's one-day minimum release age.                                                                                                                          |
| @vitejs/plugin-react           | 6.1.1   | consumer-check only.                                                                                                                                                                                                                                   |

### P0.3 — Storybook with the toolbar (2026-09-24)

| Tool                                                                           | Version | Note                                                                                             |
| ------------------------------------------------------------------------------ | ------- | ------------------------------------------------------------------------------------------------ |
| storybook, @storybook/react-vite, @storybook/addon-docs, @storybook/addon-a11y | 10.6.0  | Telemetry off (`core.disableTelemetry`).                                                         |
| @tailwindcss/vite                                                              | 4.3.3   | Compiles the `@liro/ui` source styles inside Storybook.                                          |
| Vite                                                                           | 8.3.0   | Same as consumer-check.                                                                          |
| Vitest                                                                         | 5.0.1   | Unit tests of `@liro/ui`, in Node. Brought forward from P0.4 because P0.3 adds formatting logic. |

## Lint

- **2026-09-24 — Inline configuration is off.** `linterOptions.noInlineConfig: true`, `reportUnusedDisableDirectives: "error"` and `--max-warnings 0`: an `eslint-disable` comment produces a warning, and a warning fails the run. Exceptions go into `eslint.config.mjs`, where they are visible and protected (BUILD-PLAN rule 10).
- **2026-09-24 — TypeScript escape hatches.** `@ts-ignore`, `@ts-nocheck` and `@ts-expect-error` are errors outside test files. Test files (`*.test.ts(x)`, `*.spec.ts(x)`, `__tests__/`) may use `@ts-expect-error` with a description, to prove that a wrong call does not compile.
- **2026-09-24 — Line endings.** `.gitattributes` forces LF so Prettier gives the same result on Windows and on the Linux CI runner.

## Packaging

- **2026-09-24 — Consumers install tarballs.** `pnpm consumer-check` packs the three packages with `pnpm pack`, copies `apps/consumer-check` to a temporary folder outside the repository, installs the tarballs there and builds, typechecks and checks the app. `apps/consumer-check` is excluded from the workspace and from the root ESLint run, because its dependencies exist only in that temporary install (Appendix B.10).
- **2026-09-24 — What consumer-check proves.** The button renders (server-side render in Node); every CSS and JSON export resolves; the Vite bundle contains the token variables and the button utilities; the app typechecks against the packed `.d.ts` with `skipLibCheck: false`; `@liro/eslint-config` loads and reports Radix and internal `@liro/ui/*` imports. Rendering in a real browser comes with Playwright in P0.4.
- **2026-09-24 — Build outputs are declared.** Each build writes only to its package's `dist/`, and each build config states its outputs in a comment (Appendix B.10). `files: ["dist"]` in every package; no package is private.
- **2026-09-24 — No preflight in styles.css.** `@liro/ui/styles.css` contains the Tailwind theme and the utilities the components use, not Tailwind's reset: the reset belongs to the application.
- **2026-09-24 — @liro/tokens is a peer of @liro/ui.** The components' CSS reads the `--liro-*` variables, which the application loads once from `@liro/tokens/tokens.css`. pnpm warns that this peer is unmet in consumer-check, because it does not count a `file:` tarball as satisfying a version range; the peer is linked all the same.
- **2026-09-24 — Install scripts stay off.** `allowBuilds` in `pnpm-workspace.yaml` denies the install scripts of esbuild and @parcel/watcher; both load prebuilt binaries from optional platform packages.
- **2026-09-24 — Versions start at 2.0.0-alpha.0**, the version the end of Phase 0 publishes (BUILD-PLAN section 2: no collision with the old 1.0.0).
- **2026-09-24 — Proprietary license.** Every package has `"license": "UNLICENSED"`; the root `LICENSE` states the terms. Each build copies `LICENSE` and `THIRD-PARTY-NOTICES.md` into the package's `dist/` (`scripts/copy-legal.mjs`), and consumer-check verifies both are in every installed package.
- **2026-09-24 — Third-party notices.** `THIRD-PARTY-NOTICES.md` lists code copied into the repository, code included in the packages, runtime and peer dependencies, and what the published Storybook bundles. It is updated in the same pull request that adds any of these.

## Agent permissions

- **2026-09-24 — `.claude/settings.json` is protected** (BUILD-PLAN rule 10). It allows pushing `bp/*` branches and only these `gh pr` commands: `create`, `view`, `checks`, `diff`, `list`, `edit` with `--body`/`--body-file`, and `merge <number> --auto --squash`. It denies pushing to `main`, force pushes, `gh pr close`, `gh pr review`, merges with `--merge`/`--rebase`/`--disable-auto`, anything with `--admin`, and `gh api`. Permissions are never widened without the owner's approval. Personal settings go in `.claude/settings.local.json`, which is git-ignored.
- **2026-09-24 — Auto-merge.** After opening a pull request the agent runs `gh pr merge <number> --auto --squash`; GitHub merges only when CI passes. A pull request that changes a protected file gets no auto-merge: the owner merges it.

## Storybook

- **2026-09-24 — Stories use the source.** Storybook aliases `@liro/ui` to `packages/ui/src`, so the provider in the global decorator and the components in the stories are the same module. Tokens come from the built `@liro/tokens`: run `pnpm build` before `pnpm storybook`.
- **2026-09-24 — Stories stay out of the package CSS.** `packages/ui/src/styles.css` excludes `*.stories.tsx` and tests from its sources; Storybook adds them back in its own `preview.css`.
- **2026-09-24 — Toolbar globals** go through `LiroProvider`: theme, direction (from locale, or forced), format locale (`en`, `sr-Latn-RS`, `ar`, `ja`), number scheme (from locale, or one of five), money decimals (0, 2, 4, 6). The viewport is Storybook's own: phone 390×844, tablet 820×1180, desktop 1440×900. Storybook turns a numeric URL global into a number, so the decorator compares values as strings.
- **2026-09-24 — Accessibility.** The a11y addon runs only the WCAG 2.0/2.1/2.2 A and AA rules, with `test: "error"`, so a violation fails the story tests of P0.4.

## Provider

- **2026-09-24 — First LiroProvider subset (P0.3).** `locale`, `direction` (default from the locale's likely script, via `Intl.Locale.maximize()`), `colorScheme` (`system` follows `prefers-color-scheme`), and `format` with `number`, `money`, `numberScheme` (default read from Intl) and `moneyDecimals` (default 2). P1.5 adds messages, parsing, dates, `today`, `weekStartsOn` and `linkComponent`.
- **2026-09-24 — The provider sets `dir`, `lang` and `data-liro-theme` on a `display: contents` wrapper.** It adds no box to the layout, and all three still inherit. Portals (overlays, P2.4) will need their own container inside the provider.
- **2026-09-24 — Formatting works on the decimal string.** Zeros are added up to `decimals`; digits beyond it are never cut or rounded; a string that is not a decimal is shown unchanged. Group separators: `.`, `,`, no-break space, or right single quotation mark. The currency position comes from Intl for the locale; amount and currency are joined by a no-break space.
- **2026-09-24 — Numbers in right-to-left text need isolation.** Without it, the bidi algorithm moved the minus sign to the end of "-42,00" and put the currency on the wrong side. The Storybook sample wraps values in `<bdi>`. `NumberText` and `MoneyText` (P2.8) must do the same.
