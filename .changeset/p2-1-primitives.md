---
'@veljaos/tokens': patch
'@veljaos/ui': patch
---

P2.1: three new meanings in `@veljaos/tokens`: `surface.inverse` and `text.onInverse` (tooltips) and `border.control` (the boundary of inputs, checkboxes, radios and the off state of switches, at least 3:1 on every surface), with the utilities `bg-surface-inverse`, `text-on-inverse`, `border-control` and `bg-control`. `@veljaos/ui` gains its internal primitives (not exported) and new runtime dependencies (cmdk, react-day-picker, clsx, tailwind-merge); `LiroProvider` now renders an element that overlays render into, so they inherit the theme and direction.
