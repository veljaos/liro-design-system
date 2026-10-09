/*
 * The logic of LookupField (BUILD-PLAN P5.19), kept apart from the markup so it can be
 * unit-tested (AGENTS.md C7): which rows the list shows for a query — the recent records while
 * nothing is typed, else the application's results grouped by kind, then "+ Create …", the
 * one-off entry and "Search all…" — their heights for the list's virtualiser (TanStack Virtual's
 * `estimateSize`; the rows are not measured), and the keyboard's movement.
 */

/** One record a LookupField can choose: an item, a service, a fixed asset, a customer … */
export interface LookupOption {
  /** The record's id, which the application stores. */
  value: string
  /** Its name, shown in the field once chosen. From the application. */
  label: string
  /** Its kind's key (`LookupKind.key`): the results are grouped by it. */
  kind?: string
  /** A second line: a code, a tax number, the warehouse. From the application. */
  description?: string
  /** A short text at the end: the stock ("240 pc in stock"), an asset number. From the application. */
  detail?: string
  /** Shown, but cannot be chosen. */
  disabled?: boolean
  /**
   * A one-off line without a catalogue record (only where the application allows it): the
   * typed text as its `label`, `value` empty. The application then asks for what a catalogue
   * record would have given (an account, a tax category).
   */
  oneOff?: boolean
}

/** A kind of record in the results, in the order the groups are shown. From the application. */
export interface LookupKind {
  key: string
  /** The group's heading in the list ("Services"). */
  heading: string
  /** The kind's name shown with a chosen record, e.g. in a document line ("Service"). */
  label: string
}

/** A kind the user may create from the typed text: "+ Create service “Montaža”". */
export interface LookupCreateKind {
  /** The kind's key, reported to the application. */
  kind: string
  /** The kind's noun inside the entry and the panel's title ("service"). From the application. */
  noun: string
}

/** A row of the list: a group heading, a record, or one of the actions after the results. */
export type LookupRow =
  | { type: 'heading'; text: string }
  | { type: 'option'; option: LookupOption; kindLabel: string | undefined; position: number }
  | { type: 'create'; kind: string; noun: string; position: number }
  | { type: 'oneOff'; position: number }
  | { type: 'searchAll'; position: number }

export interface LookupRowsInput {
  /** The text typed (trimmed by the caller or not; only its emptiness matters here). */
  query: string
  /** The application's results for the query. */
  results: readonly LookupOption[]
  /** Recently used records, shown while nothing is typed. */
  recent: readonly LookupOption[]
  /** The kinds, in the order of the groups. */
  kinds: readonly LookupKind[]
  /** The heading over the recent records (the provider's message). */
  recentHeading: string
  /** Kinds that may be created from the typed text. */
  create: readonly LookupCreateKind[]
  /** A one-off line is allowed. */
  oneOff: boolean
  /** The application offers a full search ("Search all…"). */
  searchAll: boolean
}

/**
 * The rows for a query. Nothing typed: the recent records under one heading. Something typed:
 * the results grouped by kind in the order of `kinds` (each group under its heading), records of
 * no known kind last without a heading; then one "+ Create …" entry per creatable kind, the
 * one-off entry, and "Search all…" last (also while nothing is typed). `position` counts the
 * choosable rows from 1, for aria-posinset in a virtualised list.
 */
export function lookupRows(input: LookupRowsInput): LookupRow[] {
  const rows: LookupRow[] = []
  let position = 0
  const kindOf = new Map(input.kinds.map((kind) => [kind.key, kind]))
  const add = (option: LookupOption) => {
    position += 1
    const kind = option.kind === undefined ? undefined : kindOf.get(option.kind)
    rows.push({ type: 'option', option, kindLabel: kind?.label, position })
  }
  const typed = input.query.trim() !== ''
  if (!typed) {
    if (input.recent.length > 0) {
      rows.push({ type: 'heading', text: input.recentHeading })
      input.recent.forEach(add)
    }
  } else {
    for (const kind of input.kinds) {
      const members = input.results.filter((option) => option.kind === kind.key)
      if (members.length === 0) continue
      rows.push({ type: 'heading', text: kind.heading })
      members.forEach(add)
    }
    input.results
      .filter((option) => option.kind === undefined || !kindOf.has(option.kind))
      .forEach(add)
    for (const create of input.create) {
      position += 1
      rows.push({ type: 'create', kind: create.kind, noun: create.noun, position })
    }
    if (input.oneOff) {
      position += 1
      rows.push({ type: 'oneOff', position })
    }
  }
  if (input.searchAll) {
    position += 1
    rows.push({ type: 'searchAll', position })
  }
  return rows
}

/** The number of rows that can be chosen (the size of the set for aria-setsize). */
export function choosableCount(rows: readonly LookupRow[]): number {
  return rows.reduce((count, row) => count + (row.type === 'heading' ? 0 : 1), 0)
}

/** Row heights in pixels: headings 28, records 36 (48 with a second line), actions 36. */
export const LOOKUP_ROW_HEIGHTS = { heading: 28, option: 36, twoLines: 48, action: 36 } as const

export function lookupRowHeight(row: LookupRow): number {
  if (row.type === 'heading') return LOOKUP_ROW_HEIGHTS.heading
  if (row.type === 'option') {
    return row.option.description === undefined
      ? LOOKUP_ROW_HEIGHTS.option
      : LOOKUP_ROW_HEIGHTS.twoLines
  }
  return LOOKUP_ROW_HEIGHTS.action
}

/** A row the keyboard and the pointer can make active: not a heading, not a disabled record. */
export function isChoosable(row: LookupRow | undefined): boolean {
  if (row === undefined || row.type === 'heading') return false
  return row.type !== 'option' || row.option.disabled !== true
}

/**
 * The row a key makes active, from `active` (an index into `rows`, -1 for none): ArrowDown and
 * ArrowUp move by one choosable row and wrap around (as ComboboxField, Mantine's `loop`);
 * PageDown and PageUp move by ten without wrapping; Home and End go to the first and the last.
 * Headings and disabled records are skipped. Undefined for any other key, or when nothing can be
 * chosen.
 */
export function lookupKeyTarget(
  rows: readonly LookupRow[],
  active: number,
  key: string,
): number | undefined {
  const usable = rows.flatMap((row, index) => (isChoosable(row) ? [index] : []))
  if (usable.length === 0) return undefined
  const first = usable[0]
  const last = usable[usable.length - 1]
  const at = usable.indexOf(active)
  const clamp = (position: number) => usable[Math.min(usable.length - 1, Math.max(0, position))]
  switch (key) {
    case 'ArrowDown':
      return at === -1 || at === usable.length - 1 ? first : usable[at + 1]
    case 'ArrowUp':
      return at <= 0 ? last : usable[at - 1]
    case 'PageDown':
      return clamp(at === -1 ? 0 : at + 10)
    case 'PageUp':
      return clamp(at === -1 ? 0 : at - 10)
    case 'Home':
      return first
    case 'End':
      return last
    default:
      return undefined
  }
}

/** The first choosable row (where a new list starts), or -1. */
export function firstChoosable(rows: readonly LookupRow[]): number {
  return rows.findIndex(isChoosable)
}

/** The name of a chosen record's kind, from the kinds (undefined when it has none). */
export function lookupKindLabel(
  option: LookupOption | null | undefined,
  kinds: readonly LookupKind[] | undefined,
  oneOffLabel: string,
): string | undefined {
  if (option === null || option === undefined) return undefined
  if (option.oneOff === true) return oneOffLabel
  if (option.kind === undefined) return undefined
  return kinds?.find((kind) => kind.key === option.kind)?.label
}
