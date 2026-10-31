import { addDays } from '../components/period-logic'
import type { LiroFormat } from '../provider/format'
import type { RichTextMergeField } from './rich-text'
import type { RichTextNode } from './rich-text-logic'

/*
 * Merge values: a text with merge fields — a saved reply, an e-mail
 * template, a notification — shown or inserted with the values filled in. "Dear {{name}}, thank
 * you for calling. On {{incident_date}} … we start on {{date_now}}."
 *
 * - **The values are the application's** (`MergeValues`, keyed by the field's key): plain text,
 *   or a typed value — a date (YYYY-MM-DD), an instant, a number or an amount (decimal strings) —
 *   written through the provider's `format`, so a date reads "14.10.2026." in Serbian digits and
 *   an amount keeps every decimal. A field's `kind` says how a plain string is written.
 * - **Computed fields** need no value: a field with `computed: 'today'` is the provider's `today`
 *   (moved by `offsetDays`, "in 7 days"), `computed: 'now'` the application's `now` (the date and
 *   time, or the time with `kind: 'time'`) — never the device's clock. The keys are the
 *   application's ("date_now", "today"); only the meaning is built in.
 * - **A field without a value stays a field**, drawn as a pill marked "No value" (dashed, warning
 *   tone, the words read), so the user sees what is left to fill in; nothing is replaced by an
 *   empty string or a guess.
 *
 * The library writes values, it never computes business values: a due date, a total or a
 * name comes from the application.
 */

/** How a merge field's value is written: text as given, or through the provider's `format`. */
export type MergeValueKind = 'text' | 'date' | 'dateTime' | 'time' | 'number' | 'money'

/** A merge field's value from the application: plain text, or a typed value. */
export type MergeValue =
  | string
  | { kind: 'text'; value: string }
  | { kind: 'date'; value: string }
  | { kind: 'dateTime' | 'time'; value: string }
  | { kind: 'number'; value: string; decimals?: number }
  | { kind: 'money'; value: string; currency: string; decimals?: number }

/** The values of a text's merge fields, by key; a missing or null value leaves the field. */
export type MergeValues = Readonly<Record<string, MergeValue | null | undefined>>

/** What filling in needs: the fields (kinds, computed), the values, the provider's format and day. */
export interface MergeContext {
  fields?: readonly RichTextMergeField[] | undefined
  values?: MergeValues | undefined
  format: LiroFormat
  /** The provider's `today` (YYYY-MM-DD). */
  today: string
  /** The application's "now" as an instant, for fields computed from it. */
  now?: string | undefined
}

function written(
  kind: MergeValueKind,
  value: string,
  field: RichTextMergeField | undefined,
  format: LiroFormat,
): string {
  switch (kind) {
    case 'date':
      return format.date(value)
    case 'dateTime':
      return format.dateTime(value)
    case 'time':
      return format.time(value)
    case 'number':
      return format.number(
        value,
        field?.decimals === undefined ? undefined : { decimals: field.decimals },
      )
    case 'money':
      return field?.currency === undefined
        ? format.number(
            value,
            field?.decimals === undefined ? undefined : { decimals: field.decimals },
          )
        : format.money(
            value,
            field.currency,
            field.decimals === undefined ? undefined : { decimals: field.decimals },
          )
    case 'text':
      return value
  }
}

/**
 * The text a merge field shows with these values, or null when it has none (the field stays a
 * pill marked "No value").
 */
export function mergeFieldText(key: string, context: MergeContext): string | null {
  const field = context.fields?.find((each) => each.key === key)
  if (field?.computed === 'today') {
    return context.format.date(addDays(context.today, field.offsetDays ?? 0))
  }
  if (field?.computed === 'now') {
    if (context.now === undefined || context.now === '') return null
    return field.kind === 'time'
      ? context.format.time(context.now)
      : context.format.dateTime(context.now)
  }
  const value = context.values?.[key]
  if (value === undefined || value === null) return null
  if (typeof value === 'string') {
    if (value.trim() === '') return null
    return written(field?.kind ?? 'text', value, field, context.format)
  }
  if (value.value.trim() === '') return null
  switch (value.kind) {
    case 'number':
      return context.format.number(
        value.value,
        value.decimals === undefined ? undefined : { decimals: value.decimals },
      )
    case 'money':
      return context.format.money(
        value.value,
        value.currency,
        value.decimals === undefined ? undefined : { decimals: value.decimals },
      )
    default:
      return written(value.kind, value.value, field, context.format)
  }
}

/** The text with every merge field that has a value written in, and the keys still without one. */
export interface MergeResult {
  doc: RichTextNode
  /** The keys left as fields, each once, in the order of the text. */
  missing: string[]
}

/**
 * Fills a text's merge fields in: each field with a value becomes text (keeping its bold, italic,
 * underline or link), each without one stays a field. Pure; the input is not changed.
 */
export function resolveMergeFields(doc: RichTextNode, context: MergeContext): MergeResult {
  const missing: string[] = []
  const walk = (node: RichTextNode): RichTextNode => {
    if (node.type === 'mergeField') {
      const key = typeof node.attrs?.key === 'string' ? node.attrs.key : ''
      const text = mergeFieldText(key, context)
      if (text === null) {
        if (!missing.includes(key)) missing.push(key)
        return node
      }
      return node.marks === undefined
        ? { type: 'text', text }
        : { type: 'text', text, marks: node.marks }
    }
    if (node.content === undefined) return node
    return { ...node, content: node.content.map(walk) }
  }
  return { doc: walk(doc), missing }
}

/** "{{key}}" in a plain text: the same key rule as a merge field (letters, digits, ".", "_", "-"). */
const PLAIN_FIELD = /\{\{([A-Za-z0-9_.-]{1,64})\}\}/gu

/**
 * Fills "{{key}}" in a plain text (a subject line, an SMS, a push notification) the same way;
 * a field without a value is left as "{{key}}".
 */
export function resolveMergeText(
  text: string,
  context: MergeContext,
): { text: string; missing: string[] } {
  const missing: string[] = []
  const out = text.replace(PLAIN_FIELD, (whole, key: string) => {
    const value = mergeFieldText(key, context)
    if (value !== null) return value
    if (!missing.includes(key)) missing.push(key)
    return whole
  })
  return { text: out, missing }
}

/** The keys of these fields that have no value (the pills to mark), each once, in order. */
export function missingMergeFields(keys: readonly string[], context: MergeContext): string[] {
  const out: string[] = []
  for (const key of keys) {
    if (!out.includes(key) && mergeFieldText(key, context) === null) out.push(key)
  }
  return out
}
