/*
 * Line types of a document (BUILD-PLAN P5.18): how a line READS, never what it means to the
 * business. The editable lines (EditableGrid) and the read-only lines (DataTable) of a document,
 * and a specification, draw every type the same way, from this one module:
 *
 * - `line`: a normal line — an item, a service, a fixed asset or a one-off line; what it is (its
 *   kind) is a small secondary text label in the line, never a colour.
 * - `text`: a free-text line, smaller and secondary, across the row.
 * - `heading`: a section heading, bold across the row; its section ends with a `subtotal`.
 * - `subtotal`: end-aligned, semibold, with a rule above.
 * - `discount`: a line or document discount; its amount is negative (from the application).
 * - `deduction`: a deduction such as an advance; its amount is negative (from the application).
 *
 * Typography, not colour, tells the types apart (P5.18 "Design principles").
 */

export const LINE_TYPES = ['line', 'text', 'heading', 'subtotal', 'discount', 'deduction'] as const

export type LineType = (typeof LINE_TYPES)[number]

/** Types whose content spans the row instead of filling the columns. */
export function spansRow(type: LineType): boolean {
  return type === 'text' || type === 'heading'
}

/** Classes for the row's text, by type. */
export const LINE_TYPE_TEXT: Record<LineType, string> = {
  line: 'text-sm text-primary',
  text: 'text-xs text-secondary',
  heading: 'text-sm font-semibold text-primary',
  subtotal: 'text-sm font-semibold text-primary',
  discount: 'text-sm text-primary',
  deduction: 'text-sm text-primary',
}

/** A subtotal's rule above it (on its cells, so sticky and collapsed borders keep it). */
export const SUBTOTAL_RULE = 'border-t border-strong'
