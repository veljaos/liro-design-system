# Accessibility

- WCAG 2.2 A and AA: axe passes in light and dark × left-to-right and right-to-left, with no rule
  disabled and nothing excluded.
- Everything works by keyboard; no drag-only interaction (a drag always has keys and a menu).
- Targets are at least 24 × 24 px (44px in touch density).
- Focus is never hidden. Every focus ring is a solid line: `FOCUS_RING`, and any ring beside
  `outline-none` says `outline-solid`. A ring is never covered by a neighbour: the item is drawn
  over its neighbours, or its ring stands inside it.
- A ring shows on keyboard focus only, never after a press of the pointer.
- Hover and focus hints are the library's Tooltip, never `title`: it opens on hover and on
  keyboard focus and only adds a description; what the user needs stays visible.
- A key the library handles (a number that chooses, Enter that goes on, 1–9 on the Launchpad,
  Ctrl/Cmd+K) stops where it was handled (`preventDefault`, `stopPropagation`).
- Changes the user must know are announced once, politely (live regions); errors use `role="alert"`.
- Composite widgets follow WAI-ARIA patterns: one tab stop, arrows inside (lists, grids, trees,
  tiles, toolbars, plans).
- Every icon-only control has a name; decorative icons are hidden.
