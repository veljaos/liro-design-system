# @veljaos/ui

## 0.1.0-alpha.1

### Patch Changes

- Phase 1, the look. `@veljaos/tokens`: every value and meaning of the previous Design System (colour ramps, surfaces, text, borders, brand, status tones, button families, spacing, radius, shadows, motion, layout, typography), light and dark themes, the Tailwind theme without raw colours, `tokens.json`, and the interface fonts for seven script classes with on-demand subsets; the build measures contrast and fails below 4.5:1. `@veljaos/ui`: the complete `LiroProvider` (messages, number, money and date formatting and parsing on decimal strings, today, week start, link component, Radix direction), `Button`, `IconButton`, `CompactIconButton` with interface intents and families, `StatusBadge` with `toneFor`, and `useLangAttribute`. `@veljaos/eslint-config`: `liro/no-raw-colors` and `liro/logical-properties`, and Radix imports forbidden under both package names.
- Updated dependencies
  - @veljaos/tokens@0.1.0-alpha.1
