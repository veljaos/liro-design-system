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
  'outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

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
 * A read-only control (owner's decision, 2026-09-25): plain text in the full text colour, no
 * border and no background, at the same height and padding as an editable control, so a form
 * that mixes both stays aligned. It keeps a focus ring: it can be focused, selected and copied.
 */
export const READ_ONLY =
  'cursor-text border-transparent bg-transparent focus:border-transparent focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus'

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
 * show keyboard focus). Disabled: text.disabled, no opacity.
 */
export const MENU_ITEM =
  'relative flex w-full cursor-default items-center rounded-md px-3 py-[calc(10px/1.5)] text-sm text-primary outline-none select-none data-highlighted:bg-surface-sunken data-disabled:cursor-not-allowed data-disabled:text-disabled'

/**
 * An option of a select or command list (Combobox.css, size 'sm'): 13px, padding 6px 10px,
 * radius md; the option chosen with the keyboard is filled with the brand colour.
 */
export const OPTION =
  'relative flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-primary outline-none select-none data-highlighted:bg-brand-solid data-highlighted:text-brand-on-solid data-disabled:cursor-not-allowed data-disabled:text-disabled'

/** The modal layer's backdrop (Overlay.css): surface.backdrop, fading with the modal (200ms). */
export const BACKDROP =
  'fixed inset-0 z-(--liro-layer-modal) bg-surface-backdrop data-[state=open]:animate-liro-overlay-in data-[state=closed]:animate-liro-overlay-out motion-reduce:animate-none'
