/*
 * Class strings shared by several primitives. Values are Mantine 9.6.2 defaults with the Liro
 * tokens applied, read from @mantine/core styles/*.css (each source is named where it is used and
 * listed in docs/decisions.md, "Values taken from Mantine defaults").
 */

/**
 * The package ships no CSS reset (the reset belongs to the application), so a primitive drawn
 * on a <button> clears the browser's own button look first: margin, border, background, padding
 * and font. Its own classes then add what it needs.
 */
export const BUTTON_RESET =
  'm-0 box-border appearance-none border-0 border-solid bg-transparent p-0 font-sans'

/** Mantine's focus ring (global.css): 2px outline in the focus colour, 2px away from the element. */
export const FOCUS_RING =
  'outline-none focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-focus'

/**
 * A text input (Input.css, size 'sm'): 36px high, 12px (36 / 3) horizontal padding, radius md,
 * 1px border, 13px text; the border turns to the focus colour on focus. Border: border.control,
 * which meets 3:1 on every surface (owner's decision, 2026-09-25; Mantine's gray-4 did not).
 * Placeholder: text.tertiary. Invalid (aria-invalid): the border in status.danger.fg (owner's
 * decision, 2026-09-25). Disabled: surface.disabled and text.disabled, border.default, no
 * opacity (Appendix B.6).
 */
export const INPUT =
  'block h-control w-full min-w-0 rounded-md border border-solid border-control bg-surface-raised px-3 font-sans text-sm text-primary outline-none transition-colors duration-(--liro-duration-fast) ease-standard placeholder:text-tertiary focus:border-focus disabled:cursor-not-allowed disabled:border-default disabled:bg-surface-disabled disabled:text-disabled aria-invalid:border-status-danger-fg'

/**
 * A read-only control, the one state of a field that cannot be changed (owner, P5.93 item 1; it
 * replaces both the old plain-text read-only of 2026-09-25 and the disabled field): the look of
 * the old disabled control — surface.disabled background and a border.default line — with the
 * value in the full text colour, so it stays readable. It can be focused (the focus ring, the
 * border unchanged), selected and copied. An empty value shows "—" as its placeholder, in
 * text.secondary. Every field uses this one class set (READ_ONLY_CHOICE for checkboxes, radios
 * and switches).
 */
export const READ_ONLY =
  'cursor-text border-default bg-surface-disabled text-primary placeholder:text-secondary focus:border-default focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-offset-2 focus-visible:outline-focus'

/**
 * A read-only checkbox, radio or switch (P5.93 item 1), set with `data-readonly` on the control:
 * the disabled look (surface.disabled, border.default) with its state still drawn — the check
 * or the dot in text.secondary, a switch's thumb at its side — focusable, not changeable.
 */
export const READ_ONLY_CHOICE =
  'data-readonly:cursor-default data-readonly:border-default data-readonly:bg-surface-disabled data-readonly:text-secondary'

/**
 * The floating surface of popovers, menus and selects (Popover.css): 1px border, radius md, no
 * shadow. Mantine's border is gray-2 in light and dark-4 in dark; border.default is visible on the
 * overlay surface in both themes. z-index: the popover layer.
 */
export const FLOATING =
  'z-(--liro-layer-popover) rounded-md border border-solid border-default bg-surface-overlay font-sans text-primary outline-none'

/** Enter and leave animations of a floating surface (Popover: fade, 150ms). */
export const FLOATING_MOTION =
  'data-[state=open]:animate-liro-popover-in data-[state=closed]:animate-liro-popover-out'

/**
 * An item of a menu (Menu.css): 13px, padding 6.67px (10 / 1.5) by 12px, radius md; the
 * highlighted item takes surface.sunken (Mantine: gray-1; surface.hover, gray-0, is too faint to
 * show keyboard focus). Disabled: text.disabled, no opacity. Full width with padding, so its box
 * is border-box: without a reset it would be wider than its list by the padding, and the list
 * would scroll sideways under the highlighted item (P3.2a).
 */
export const MENU_ITEM =
  'relative box-border flex w-full cursor-default items-center rounded-md px-3 py-[calc(10px/1.5)] text-sm text-primary outline-none select-none data-highlighted:bg-surface-sunken data-disabled:cursor-not-allowed data-disabled:text-disabled'

/**
 * An option of a select or command list (Combobox.css, size 'sm'): 13px, padding 6px 10px,
 * radius md; the option chosen with the keyboard is filled with the brand colour. Border-box, as
 * MENU_ITEM.
 */
export const OPTION =
  'relative box-border flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-primary outline-none select-none data-highlighted:bg-brand-solid data-highlighted:text-brand-on-solid data-disabled:cursor-not-allowed data-disabled:text-disabled'

/** The modal layer's backdrop (Overlay.css): surface.backdrop, fading with the modal (200ms). */
export const BACKDROP =
  'fixed inset-0 z-(--liro-layer-modal) bg-surface-backdrop data-[state=open]:animate-liro-overlay-in data-[state=closed]:animate-liro-overlay-out motion-reduce:animate-none'

/**
 * A dialog on a phone (P5.28 item 1): a sheet across the screen's full width, standing on its
 * bottom edge, as high as its content up to the screen's height less 40px (the page above it
 * shows that it is a sheet over the page), radius lg on its top corners, sliding up 200ms; the
 * safe area under it is padding. Percentages, not dvh or vw: its containing block is the screen —
 * the viewport, or a phone frame in a story — never the window. Comes after the dialog's own
 * classes, so a caller's width ('wide') does not apply on a phone.
 */
export const PHONE_DIALOG =
  'inset-x-0 top-auto bottom-0 mx-0 w-full max-w-full max-h-[calc(100%-40px)] rounded-none rounded-t-lg pb-[env(safe-area-inset-bottom)] [--liro-slide-from:translateY(100%)] data-[state=open]:animate-liro-slide-in data-[state=closed]:animate-liro-slide-out motion-reduce:animate-none'

/**
 * A block of text takes its direction from its own content, while the layout keeps the page's
 * (P3.6, owner): an English sentence in a right-to-left page — a message the application has not
 * translated yet — keeps its word order (".Unavailable: The period …" was broken), and an
 * Arabic one in a left-to-right page keeps its own. `unicode-bidi: plaintext` sets each
 * paragraph's direction from its first strong character and isolates an inline element; it
 * leaves `direction`, so the component's layout (the order of icon, text and buttons, flex rows,
 * logical margins) stays the page's. On its own it would also move the text to the side its
 * language starts on (`text-align: start` follows the paragraph), so an English title in a
 * right-to-left accordion drifted to the left; `text-align: match-parent` resolves start and end
 * against the parent's direction instead, keeping the text on the page's start side. The utility
 * is in styles.css (`bidi-content`): Chromium needs the -webkit- form, Firefox the plain one.
 */
export const TEXT_DIRECTION = 'bidi-content'

/**
 * TEXT_DIRECTION for inline text (a header label inside its cell) and for centred text: only the
 * word order follows the content. Never on a block with `text-start` or `text-end`: with
 * plaintext those resolve against the text's own direction, so an end-aligned English header
 * moved to the wrong side of a right-to-left cell.
 */
export const TEXT_ISOLATE = 'bidi-isolate'

/**
 * Props of a field's typing area for free text (P3.6c): its direction from the content
 * (`dir="auto"`), so "Alfa Trade d.o.o." keeps its full stop at the end in a right-to-left form,
 * while the text stays at the page's start side (`text-align: match-parent`). Numbers, money,
 * dates and codes are written left to right instead.
 */
export const AUTO_DIRECTION = { dir: 'auto', className: 'text-match-parent' } as const

/**
 * An item whose title is its link — a card, a result, a row (P5.94 item 10): the title is never
 * underlined; the item shows the hover on its surface and the keyboard's focus as the link's ring.
 * Rows without side padding add `-mx-2 px-2` so the surface has room round the text.
 */
export const LINK_ITEM_HOVER = 'has-[a:hover]:bg-surface-hover'
