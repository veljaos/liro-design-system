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

## Lint

- **2026-09-24 — Inline configuration is off.** `linterOptions.noInlineConfig: true`, `reportUnusedDisableDirectives: "error"` and `--max-warnings 0`: an `eslint-disable` comment produces a warning, and a warning fails the run. Exceptions go into `eslint.config.mjs`, where they are visible and protected (BUILD-PLAN rule 10).
- **2026-09-24 — TypeScript escape hatches.** `@ts-ignore`, `@ts-nocheck` and `@ts-expect-error` are errors outside test files. Test files (`*.test.ts(x)`, `*.spec.ts(x)`, `__tests__/`) may use `@ts-expect-error` with a description, to prove that a wrong call does not compile.
- **2026-09-24 — Line endings.** `.gitattributes` forces LF so Prettier gives the same result on Windows and on the Linux CI runner.
