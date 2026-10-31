# Testing

## Definition of done for a component

- Tokens only, logical properties only, no text or formatting of its own.
- Stories: default; every supported state (read only, unavailable with its reason, error, loading,
  empty); long text; phone width; one Arabic and one Japanese story. The story says what the
  component is for, when to use it and when not.
- Every prop does something and is exercised by a story or a test.
- Unit tests for any logic (parsing, counting, keyboard handling).
- Exported from `@veljaos/ui` (or its subpath) with its props type.

## What CI runs

- `pnpm lint` (`--max-warnings 0`, no inline `eslint-disable`; exceptions live in
  `eslint.config.mjs`), `pnpm typecheck` (strict, `noUncheckedIndexedAccess`, no `@ts-ignore`;
  `@ts-expect-error` only in tests, with a description), `pnpm format:check`, `pnpm test`,
  `pnpm build`, `pnpm consumer-check` (the packed tarballs installed by a plain Vite app),
  `pnpm build-storybook`, `pnpm perf` (the performance budget).
- Story tests: every story renders, its play function passes, no error is logged, no list or
  popover overflows sideways, no word breaks inside, and in right-to-left texts keep their order —
  in light and dark × left-to-right and right-to-left.
- Accessibility: axe with the WCAG 2.2 A/AA tags, in the same four modes.
- Visual: every pictured story against its Linux baseline in the four modes, `maxDiffPixels: 0`.
- Phone overflow: every phone story, with each select, menu, popover and dialog open.

## Stories

- A pictured story renders its state from args or initial state: no clicks, typing, focus or
  scrolling. A story that acts is tagged `interaction` (tested, not pictured); the look it reaches
  gets a static story (`scripts/static-stories.mjs`).
- Intermediate states, tablet variants and every `interaction` story carry `'!dev'`: out of the
  sidebar, still tested.
- The Examples are one story file per floorplan, each screen as a desktop and a phone story.

## Performance budget

- `apps/perf` builds the list and the document example screens for production; `pnpm perf`
  fails when their JavaScript or CSS (gzip) grows above `apps/perf/budget.json`.
