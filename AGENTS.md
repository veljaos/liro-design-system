# AGENTS.md — how to work on the Liro Design System

Read `README.md` and `docs/principles.md` first, then the rule document of the area you touch
(`docs/`). The two principles — simplicity first, ease sells — apply to every change.

## How to work

- One change = one branch `bp/<short-name>` = one pull request. Commits are in English and say what
  changed.
- Done means CI is green on Linux. Run the checks; never assume them.
- After opening a pull request, turn on auto-merge (squash). A pull request that changes a
  protected file gets no auto-merge: the owner merges it.
- A pull request that changes a protected file has a section `## Protected file changes` naming
  each file with a reason (checked by the `Protected files` workflow). Protected:
  `.claude/settings.json`, every `eslint.config.*`, `packages/eslint-config/**`, `tsconfig*.json`,
  `.github/**`, `scripts/protected-files.mjs`, `scripts/static-stories.mjs`,
  `scripts/sample-text-stories.mjs`, `scripts/consumer-check.mjs`, `apps/consumer-check/check.mjs`,
  `**/playwright.config.*`, `apps/storybook/.storybook/**`, `apps/storybook/tests/*.ts`.
- Delete a branch right after its pull request is merged or closed, on GitHub and locally. At the
  end of a piece of work `main` is the only branch.
- Stop and ask when the rules do not cover something, for a product, money or scope decision,
  before anything irreversible, and when a check fails for a reason you do not understand.
- Report to the owner in Serbian, in plain language, at the end of every piece of work: what
  changed, where to see it (the full Storybook link and the sidebar path), what is left.

## Code rules

- English in code, comments, stories, tests, commits and docs. Serbian only as sample data.
- A comment says what the code does or why it must be so, in one or two lines. No history, no
  dates, no review references; no comment that repeats the code.
- TypeScript strict with `noUncheckedIndexedAccess`; lint uses the type-checked presets.
- No `eslint-disable` comments (exceptions go into `eslint.config.mjs`); no `@ts-ignore` or
  `@ts-nocheck`; `@ts-expect-error` only in tests, with a description.
- Formatting is Prettier's.
- Every dependency pinned to an exact version (`save-exact=true`). Add the exact notice of any
  third-party code to `THIRD-PARTY-NOTICES.md` in the same pull request.
- Packages work from their tarballs: complete `files`, nothing private, license and notices
  inside (`pnpm consumer-check`).
- Primitives (`packages/ui/src/primitives/`) are never exported.

## How to add a component

1. If it needs a shadcn primitive, add it with the shadcn CLI into `packages/ui/src/primitives/`,
   adapt it to the tokens and logical properties, and add its notice.
2. Write it in `packages/ui/src/components/<name>.tsx` (templates in `templates/`). Props only;
   text from props or `messages`; numbers and dates through `format`.
3. Export it and its props type from `packages/ui/src/index.ts` (or its subpath).
4. Write `<name>.stories.tsx` beside it (see `docs/testing.md`) and unit tests for its logic.
5. Add a changeset (`pnpm changeset`) for every change to a published package.
6. Run locally: `pnpm lint` (with `NODE_OPTIONS=--max-old-space-size=7000`), `pnpm typecheck`,
   `pnpm test`, `pnpm build`, `pnpm consumer-check`, `pnpm build-storybook`. Look at it in
   `pnpm storybook` in both themes, both directions and at phone width.
7. Add its visual baselines (below) and open the pull request.

## Storybook and tests

```sh
pnpm install
pnpm build        # Storybook reads the built @veljaos/tokens
pnpm storybook    # http://localhost:6006
```

- Storybook is not hosted: each CI run keeps its build as the artifact `storybook-static` (7 days),
  each published version as `storybook-<version>` (90 days).
- The Playwright tests run against the built Storybook: `pnpm --filter liro-storybook test:stories`,
  `test:a11y`, `test:visual`.
- A local Playwright run needs the proxy variables unset and a free port.

## Visual baselines

Baselines live in `apps/storybook/tests/__screenshots__/` and are made **only** in CI's pinned
Playwright image. Never commit screenshots taken on Windows or macOS.

- **Baselines workflow (fastest).** Push a commit whose message contains `[baselines]` to a `bp/*`
  branch, or start "Baselines" from the Actions tab. Download its artifact `baselines` into an empty
  folder (`gh run download <run-id> -n baselines -D <tmp>`), copy it over
  `apps/storybook/tests/__screenshots__/`, look at every image, commit.
- **Through CI.** A failing visual job uploads `playwright-results` with the new images.
- **Locally with Docker.** `node scripts/update-baselines.mjs`.

A baseline changes only when the look is meant to change; say why in the pull request. Images of
removed stories are deleted by hand.

## Releases

1. Every pull request that changes a published package adds a changeset; the three packages share
   one version.
2. A release pull request runs `pnpm changeset version` (bumps versions, writes the changelogs).
3. After it is merged, the owner approves the tag `v<version>` on its commit on `main`; the
   `Publish` workflow publishes to GitHub Packages. No personal token; the agent never pushes a
   tag without the owner's explicit permission.

## Safety

- Public repository: never secrets, tokens, `.env` files or real client data.
- Never widen `.claude/settings.json` without the owner's explicit approval; never administrator
  rights; no force-push; no rebase of a shared branch.
- If a security check does not look right, stop and ask.
