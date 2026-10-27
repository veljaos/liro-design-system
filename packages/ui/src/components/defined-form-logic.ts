/*
 * The logic of DefinedForm (P5.66), kept apart from the markup so it can be unit-tested
 * (AGENTS.md C7). A form is drawn from the application's definitions — sections of fields, each
 * with its type, whether it is required and when it shows — which are data (JSON the application
 * keeps per document type, report or request). The component decides nothing about the content:
 * the fields, their texts, options and conditions are the application's.
 *
 * **Conditions (declarative).** A field or a section shows while its `visibleWhen` holds; a field
 * is required when `required` is true or while its `requiredWhen` holds. A condition reads one
 * value (`field`) and asks whether it `equals` a value, `notEquals` it, is `oneOf` several, or is
 * `filled`; `all`, `any` and `not` combine conditions. A multiple choice equals a value when that
 * value is among those chosen. Numbers, amounts and dates are compared as the strings they are
 * (decimal strings, YYYY-MM-DD): never converted to a number (D4).
 *
 * **Order and hidden fields.** Conditions are read in the definitions' order, and a hidden field
 * counts as empty: a condition on a field that is itself hidden does not hold through its old
 * value. A value that is no field of the form (the document's type, the company's kind) is read as
 * the application gives it — a context value.
 *
 * **Hidden values are kept but not submitted** (as Questionnaire's branches): the values of hidden
 * fields stay in the form's state, so showing the field again brings them back; only the values of
 * the fields shown are submitted (`definedFormState(...).submitted`).
 */

/** The kinds of field, each drawn by one of the library's fields. */
export type DefinedFieldType =
  | 'text'
  | 'textarea'
  | 'email'
  | 'number'
  | 'money'
  | 'date'
  | 'select'
  | 'multiselect'
  | 'radio'
  | 'checkbox'
  | 'switch'
  | 'custom'

/** Every field type, in the order the documentation lists them. */
export const DEFINED_FIELD_TYPES: readonly DefinedFieldType[] = [
  'text',
  'textarea',
  'email',
  'number',
  'money',
  'date',
  'select',
  'multiselect',
  'radio',
  'checkbox',
  'switch',
  'custom',
]

/**
 * A field's value: text, a decimal string, a YYYY-MM-DD date or a chosen option's value (string);
 * the options chosen (multiselect); ticked or not (checkbox, switch); null for empty.
 */
export type DefinedValue = string | boolean | readonly string[] | null

/** The form's values by field id (and any context values the application adds). */
export type DefinedValues = Readonly<Record<string, DefinedValue | undefined>>

/** When a field or a section shows, or when a field is required. Data. */
export type DefinedCondition =
  | { field: string; equals: string | boolean }
  | { field: string; notEquals: string | boolean }
  | { field: string; oneOf: readonly string[] }
  | { field: string; filled: boolean }
  | { all: readonly DefinedCondition[] }
  | { any: readonly DefinedCondition[] }
  | { not: DefinedCondition }

/** One option of a select, a multiple choice or a radio group. */
export interface DefinedOption {
  /** The value the application stores. */
  value: string
  /** What the user reads. From the application. */
  label: string
  /** A line under the label (radio groups). */
  description?: string
  /** Shown, but cannot be chosen. */
  disabled?: boolean
  /** Options of a select with the same group are listed together under this heading. */
  group?: string
}

/** One field, from the application's definitions. */
export interface DefinedField {
  /** The key of its value. Unique in the form. */
  id: string
  type: DefinedFieldType
  /** The field's name for the user. */
  label: string
  /** A hint under the label. */
  description?: string
  /** Shown while the field is empty. Never the label repeated. */
  placeholder?: string
  /** Always required. */
  required?: boolean
  /** Required while this holds. */
  requiredWhen?: DefinedCondition
  /** Shown only while this holds. */
  visibleWhen?: DefinedCondition
  /**
   * Shown but not changed (a value the application filled in, a field the user may not change):
   * the read-only look of every field (P5.93; a field has no disabled state).
   */
  readOnly?: boolean
  /** The options of a select, multiselect or radio group. */
  options?: readonly DefinedOption[]
  /** The currency of an amount ('money'). */
  currency?: string
  /** Decimals shown for a number or an amount (never rounded). */
  decimals?: number
  /** Lines of a text area. */
  rows?: number
  /** 'ltr' for text written left to right in every language: a code, an account, an e-mail. */
  direction?: 'ltr'
  /** Spans every column of its section (an address, a long text). */
  fullWidth?: boolean
}

/** A titled group of fields. */
export interface DefinedSection {
  id: string
  title: string
  /** A line under the title. */
  description?: string
  /** Columns of fields by the section's own width (1–3). Default 2. */
  columns?: 1 | 2 | 3
  /** Folded away until opened: fields that are rarely used. */
  collapsible?: boolean
  /** Shown only while this holds. */
  visibleWhen?: DefinedCondition
  fields: readonly DefinedField[]
}

/** A shown field and whether it is required now. */
export interface DefinedFieldState {
  field: DefinedField
  required: boolean
  /** Required and empty. */
  missing: boolean
}

/** A shown section with its shown fields. */
export interface DefinedSectionState {
  section: DefinedSection
  fields: readonly DefinedFieldState[]
}

/** What the definitions and the values give now. */
export interface DefinedFormState {
  /** The sections shown, each with its fields shown (a section without any is left out). */
  sections: readonly DefinedSectionState[]
  /** The ids of the fields shown that are required and empty, in order. */
  missing: readonly string[]
  /** The values submitted: those of the fields shown only. */
  submitted: Readonly<Record<string, DefinedValue>>
}

/** Whether a value counts as given: text not blank, a choice made, a box ticked. */
export function definedValueFilled(value: DefinedValue | undefined): boolean {
  if (value === undefined || value === null) return false
  if (typeof value === 'boolean') return value
  if (typeof value === 'string') return value.trim() !== ''
  return value.length > 0
}

/** Whether one value matches a wanted value (a multiple choice: among the chosen). */
function matches(value: DefinedValue | undefined, wanted: string | boolean): boolean {
  if (value === undefined || value === null) return false
  if (typeof value === 'boolean' || typeof wanted === 'boolean') return value === wanted
  if (typeof value === 'string') return value === wanted
  return value.includes(wanted)
}

/** Whether a condition holds for these values. */
export function definedConditionHolds(condition: DefinedCondition, values: DefinedValues): boolean {
  if ('all' in condition) return condition.all.every((each) => definedConditionHolds(each, values))
  if ('any' in condition) return condition.any.some((each) => definedConditionHolds(each, values))
  if ('not' in condition) return !definedConditionHolds(condition.not, values)
  const value = values[condition.field]
  if ('equals' in condition) return matches(value, condition.equals)
  if ('notEquals' in condition) return !matches(value, condition.notEquals)
  if ('oneOf' in condition) return condition.oneOf.some((each) => matches(value, each))
  return definedValueFilled(value) === condition.filled
}

/** Whether a field is required for these values. */
export function definedFieldRequired(field: DefinedField, values: DefinedValues): boolean {
  if (field.required === true) return true
  return field.requiredWhen !== undefined && definedConditionHolds(field.requiredWhen, values)
}

/** The ids of every field in the definitions, in order. */
export function definedFieldIds(sections: readonly DefinedSection[]): string[] {
  return sections.flatMap((section) => section.fields.map((field) => field.id))
}

/**
 * The form now: the sections and fields shown, which are required, which are missing, and the
 * values submitted. Read in order; a hidden field counts as empty for the conditions after it.
 * A read-only or disabled field is never missing: the user cannot fill it.
 */
export function definedFormState(
  sections: readonly DefinedSection[],
  values: DefinedValues,
): DefinedFormState {
  const defined = new Set(definedFieldIds(sections))
  // What the conditions read: context values as given, fields only once they are shown.
  const seen: Record<string, DefinedValue | undefined> = {}
  for (const [key, value] of Object.entries(values)) {
    if (!defined.has(key)) seen[key] = value
  }
  const shown: DefinedSectionState[] = []
  const missing: string[] = []
  const submitted: Record<string, DefinedValue> = {}
  for (const section of sections) {
    const sectionShown =
      section.visibleWhen === undefined || definedConditionHolds(section.visibleWhen, seen)
    const fields: DefinedFieldState[] = []
    for (const field of section.fields) {
      const visible =
        sectionShown &&
        (field.visibleWhen === undefined || definedConditionHolds(field.visibleWhen, seen))
      if (!visible) continue
      const value = values[field.id]
      seen[field.id] = value
      const required = definedFieldRequired(field, seen)
      const editable = field.readOnly !== true
      const isMissing = required && editable && !definedValueFilled(value)
      if (isMissing) missing.push(field.id)
      submitted[field.id] = value ?? null
      fields.push({ field, required, missing: isMissing })
    }
    if (fields.length > 0) shown.push({ section, fields })
  }
  return { sections: shown, missing, submitted }
}

/** Every field id named by a condition (to check definitions against their fields). */
export function definedConditionFields(condition: DefinedCondition): string[] {
  if ('all' in condition) return condition.all.flatMap(definedConditionFields)
  if ('any' in condition) return condition.any.flatMap(definedConditionFields)
  if ('not' in condition) return definedConditionFields(condition.not)
  return [condition.field]
}

/**
 * Problems in the definitions themselves, for the application's tests: a field id used twice, a
 * choice without options, a condition that names a field defined after it (it would read that
 * field as empty). Context values are allowed when listed in `context`.
 */
export function definedFormProblems(
  sections: readonly DefinedSection[],
  context: readonly string[] = [],
): string[] {
  const problems: string[] = []
  const before = new Set(context)
  const all = new Set(definedFieldIds(sections))
  const check = (owner: string, condition: DefinedCondition | undefined) => {
    if (condition === undefined) return
    for (const id of definedConditionFields(condition)) {
      if (!before.has(id)) {
        problems.push(
          all.has(id)
            ? `${owner}: the condition reads "${id}", defined after it`
            : `${owner}: the condition reads "${id}", which is not defined`,
        )
      }
    }
  }
  for (const section of sections) {
    check(`Section "${section.id}"`, section.visibleWhen)
    for (const field of section.fields) {
      if (before.has(field.id) && !context.includes(field.id)) {
        problems.push(`Field "${field.id}" is defined twice`)
      }
      check(`Field "${field.id}"`, field.visibleWhen)
      check(`Field "${field.id}"`, field.requiredWhen)
      const choice =
        field.type === 'select' || field.type === 'multiselect' || field.type === 'radio'
      if (choice && (field.options ?? []).length === 0) {
        problems.push(`Field "${field.id}" is a choice without options`)
      }
      before.add(field.id)
    }
  }
  return problems
}

/** Which message names a missing value: a choice, a box to tick, or a value to write. */
export function definedMissingKind(type: DefinedFieldType): 'choose' | 'tick' | 'fill' {
  if (type === 'select' || type === 'multiselect' || type === 'radio') return 'choose'
  if (type === 'checkbox' || type === 'switch') return 'tick'
  return 'fill'
}

/** The value a field starts with when the application gives none. */
export function definedEmptyValue(type: DefinedFieldType): DefinedValue {
  if (type === 'checkbox' || type === 'switch') return false
  if (type === 'multiselect') return []
  return null
}
