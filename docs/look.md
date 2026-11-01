# Tokens and look

## Tokens

- Three layers: values → meanings → components. Components choose a meaning, never a value.
- Every value and meaning lives in `packages/tokens/src/tokens.ts`; the build writes `tokens.css`,
  `theme.css` and `tokens.json` from it.
- Only semantic utilities: `bg-surface-raised`, `text-secondary`, `border-strong`,
  `bg-status-danger-bg`. Never a palette class (`bg-red-500`), hex, `rgb(…)` or `dark:`; themes
  switch through the tokens (`liro/no-raw-colors`). The Tailwind theme removes the raw palette.
- The one exception: `provider-marks.tsx` draws the Microsoft and Google marks in their colours.
- Every text-on-background pair passes 4.5:1 and every control boundary 3:1 in both themes; the
  build fails otherwise (`packages/tokens/src/contrast.ts`).
- Layout (width, alignment, spacing to neighbours) is free with Tailwind; colour is not.
- Motion uses the duration and easing tokens; with reduced motion every duration is 0.

## Colour has meaning

- Blue is for actions, links, the focus ring, checked controls, the highlighted option, the active
  tab line, the selected calendar day and completed steps. Everything else is neutral.
- A selection is `surface.selected` with a `border.selected` bar or frame, never colour alone.
- The item in force now (current version, current plan) has the one "current" look: a success
  badge and, on a plain list row, the subtle success background (`CURRENT_TONE`, `CURRENT_ROW`).
- Status tones (neutral, info, success, warning, danger, premium) always come with words or an icon.

## Buttons

- A button chooses an `intent` (save, delete, …) or a `family` + `icon`; never a colour or variant.
  `label` is required.
- Emphasis: primary (filled), secondary (light tint; neutral is bordered), menu (subtle).
- One primary-emphasis button per screen; the main action is last in its group.
- `IconButton` is 36px with its label in the Tooltip; `CompactIconButton` (28px) only in tight
  places such as row menus and close buttons.
- A label wraps between words, centred, and the button grows; it is never cut.
- Back and next arrows mirror in right-to-left.

## Type

- Fonts, sizes and weights only from the type utilities (`font-sans`, `text-md`, `text-h2`,
  `font-semibold`). Body text is 14px.
- Noto Sans covers Latin, Cyrillic, Greek, Arabic, Hebrew and CJK (by `lang`); Space Grotesk is the
  brand face, JetBrains Mono the code face. All ship with `@veljaos/tokens`; `tokens.css` loads
  every face except Chinese and Japanese, which are `@veljaos/tokens/fonts-cjk.css`.
- Amounts and figures use `tabular-nums`.
- Titles are never underlined: a heading or a card whose title is its link shows hover on its
  surface (`LINK_ITEM_HOVER`); a link inside running text underlines on hover.

## Density

- `LiroProvider density="touch"`: every control, row and target inside is at least 44px, overlays
  included; a nested provider never lowers it.
