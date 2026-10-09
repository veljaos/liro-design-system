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

// ── P5 group D1 ── (additive: tax category, unit of measure, editable cells per type)

/**
 * A tax category of a line, from the Core's list (as the e-invoice system names them): its code
 * ("S", "AE", "E", "O", "Z") and, where it has one, its rate as a decimal string ("20"). Shown as
 * the short code with the rate, "S 20%" (`taxCategoryText`); exemption and reverse-charge reasons
 * are the document's footnotes, not the line's.
 */
export interface TaxCategory {
  /** The value the application stores for the line (e.g. "S20"). */
  value: string
  /** The category's code, e.g. "S". */
  code: string
  /** The rate as a decimal string ("20", "10"); none for "AE", "E", "O". */
  rate?: string
}

/**
 * A tax category as a line shows it: the code with the rate written by the provider's
 * `format.percent` ("S 20%" in English, "S 20%" in sr-Latn, "S 20 %" in German); the code alone
 * when it has no rate ("AE").
 */
export function taxCategoryText(category: TaxCategory, percent: (value: string) => string): string {
  return category.rate === undefined ? category.code : `${category.code} ${percent(category.rate)}`
}

/**
 * A unit of measure, from the Core's list: the short name a person reads ("pc", "m²", "kWh") and
 * its standard code (UN/ECE Recommendation 20: "H87", "MTK", "KWH"), which the application
 * stores. The unit is a value of its own, in its own column, never joined to the quantity (P4.9d).
 */
export interface UnitOfMeasure {
  /** The standard code, stored by the application (e.g. "H87"). */
  value: string
  /** The short name shown (e.g. "pc"). */
  label: string
}

/**
 * How many editable cells a line of this type has in a grid with `columns` editable columns: a
 * normal line, a discount and a deduction all of them; a text line and a section heading one (its
 * text, across the row) when the grid has a text for them; a subtotal none (its amounts come from
 * the application, and the keyboard skips it).
 */
export function editableCellCount(type: LineType, columns: number, hasText: boolean): number {
  if (type === 'subtotal') return 0
  if (spansRow(type)) return hasText ? 1 : 0
  return columns
}

/** The rarer line types an "Add line ▾" menu can offer (a normal line is the button itself). */
export const ADDABLE_LINE_TYPES = ['text', 'heading', 'discount', 'deduction'] as const

export type AddableLineType = (typeof ADDABLE_LINE_TYPES)[number]
