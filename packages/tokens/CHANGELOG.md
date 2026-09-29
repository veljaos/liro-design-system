# @veljaos/tokens

## 0.1.0-alpha.2

### Patch Changes

- 79c0854: P2.1: three new meanings in `@veljaos/tokens`: `surface.inverse` and `text.onInverse` (tooltips) and `border.control` (the boundary of inputs, checkboxes, radios and the off state of switches, at least 3:1 on every surface), with the utilities `bg-surface-inverse`, `text-on-inverse`, `border-control` and `bg-control`. `@veljaos/ui` gains its internal primitives (not exported) and new runtime dependencies (cmdk, react-day-picker, clsx, tailwind-merge); `LiroProvider` now renders an element that overlays render into, so they inherit the theme and direction.
- 24bf323: P2.2a: `Field`, `TextField`, `TextAreaField`, `SelectField`, `CheckboxField`, `SwitchField` and `RadioGroupField`, with the error under the field, a required mark, read-only as plain text and disabled with a visible reason. `@veljaos/tokens` adds the `border-status-danger-fg` utility for the border of an invalid field.

## 0.1.0-alpha.1

### Patch Changes

- Phase 1, the look. `@veljaos/tokens`: every value and meaning of the previous Design System (colour ramps, surfaces, text, borders, brand, status tones, button families, spacing, radius, shadows, motion, layout, typography), light and dark themes, the Tailwind theme without raw colours, `tokens.json`, and the interface fonts for seven script classes with on-demand subsets; the build measures contrast and fails below 4.5:1. `@veljaos/ui`: the complete `LiroProvider` (messages, number, money and date formatting and parsing on decimal strings, today, week start, link component, Radix direction), `Button`, `IconButton`, `CompactIconButton` with interface intents and families, `StatusBadge` with `toneFor`, and `useLangAttribute`. `@veljaos/eslint-config`: `liro/no-raw-colors` and `liro/logical-properties`, and Radix imports forbidden under both package names.
