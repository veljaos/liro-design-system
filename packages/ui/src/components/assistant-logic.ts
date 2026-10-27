import type { ReactNode } from 'react'

/*
 * The data of an assistant's answer (BUILD-PLAN P5.34) and the pure rules the assistant's
 * components follow. Nothing here calls a model: an answer is the application's data — blocks of
 * text, small tables, charts, code (P5.93) and sources — and its state. Tested in assistant-logic.test.ts.
 */

/**
 * Where an answer is:
 * - 'thinking': asked, nothing written yet;
 * - 'streaming': being written — the blocks so far, and Stop;
 * - 'done': complete;
 * - 'stopped': the user stopped it — the blocks written until then, marked incomplete;
 * - 'error': it could not be answered (the application's words);
 * - 'noAccess': the user may not see what the answer needs (the application's words).
 */
export type AnswerState = 'thinking' | 'streaming' | 'done' | 'stopped' | 'error' | 'noAccess'

export const ANSWER_STATES: readonly AnswerState[] = [
  'thinking',
  'streaming',
  'done',
  'stopped',
  'error',
  'noAccess',
]

/** A heading inside a longer answer ("Overdue by customer"). */
export interface AnswerHeadingBlock {
  kind: 'heading'
  text: ReactNode
}

/** A paragraph of the answer. */
export interface AnswerTextBlock {
  kind: 'text'
  text: ReactNode
}

/** A short list (points, steps). */
export interface AnswerListBlock {
  kind: 'list'
  items: readonly ReactNode[]
  /** Numbered steps. Default false. */
  ordered?: boolean
}

/** A column of an answer's table. */
export interface AnswerColumn {
  key: string
  label: ReactNode
  /** Numbers, amounts and dates: tabular digits, at the end. */
  numeric?: boolean
}

/** A row of an answer's table: its cells by column key and, optionally, the record it comes from. */
export interface AnswerRow {
  id: string
  cells: Readonly<Record<string, ReactNode>>
  /** The record behind the row: its first cell becomes a link to it. */
  href?: string
}

/** A small table: what the answer counted, row by row. */
export interface AnswerTableBlock {
  kind: 'table'
  /** Names the table for assistive technology and stands over it. */
  caption: ReactNode
  columns: readonly AnswerColumn[]
  rows: readonly AnswerRow[]
  /** A total row, computed by the application (never by the component), by column key. */
  total?: Readonly<Record<string, ReactNode>>
}

/**
 * A chart: a slot, so the main entry never loads the charts. The application passes a chart from
 * `@veljaos/ui/charts` (its own card with title and "Show as table").
 */
export interface AnswerChartBlock {
  kind: 'chart'
  chart: ReactNode
}

/** A record or page the answer was taken from. */
export interface AnswerSource {
  id: string
  /** The record's name ("Invoice F-2026-0398"). */
  label: ReactNode
  href: string
  /** A line under it ("Sales invoices · 14.10.2026"). */
  detail?: ReactNode
}

/**
 * The records the answer came from: one line "Used 4 records" that opens into the links (Sources,
 * P5.93); the same record twice is listed once.
 */
export interface AnswerSourcesBlock {
  kind: 'sources'
  items: readonly AnswerSource[]
  /** Another line than "Used 4 records" (a string). */
  title?: string
}

/**
 * Code, a query, a payload or a log the answer shows (P5.93): a CodeBlock with Copy, highlighted
 * where the application gives `CodeHighlighting` (`@veljaos/ui/code`).
 */
export interface AnswerCodeBlock {
  kind: 'code'
  code: string
  /** "sql", "json", "ansi" for terminal output … (CodeBlock's `language`). */
  language?: string
  /** A file name or a label over the code ("Query", "webhook.json"). */
  title?: ReactNode
}

/** One block of an answer, in order. */
export type AnswerBlock =
  | AnswerHeadingBlock
  | AnswerTextBlock
  | AnswerListBlock
  | AnswerTableBlock
  | AnswerChartBlock
  | AnswerCodeBlock
  | AnswerSourcesBlock

/** The state of an action the assistant proposes. Nothing happens before 'running'. */
export type ProposedActionState = 'proposed' | 'running' | 'done' | 'dismissed' | 'failed'

/** The answer is still being made: its region is busy, Stop is offered. */
export function answerBusy(state: AnswerState): boolean {
  return state === 'thinking' || state === 'streaming'
}

/** The blocks shown in a state: none while thinking or when nothing could be answered. */
export function shownBlocks(
  state: AnswerState,
  blocks: readonly AnswerBlock[],
): readonly AnswerBlock[] {
  return state === 'thinking' || state === 'error' || state === 'noAccess' ? [] : blocks
}

/** Follow-up questions are offered only under a complete answer. */
export function followUpsShown(state: AnswerState, followUps: readonly string[] | undefined) {
  return state === 'done' ? (followUps ?? []) : []
}

/** A wrong answer can be reported once something was answered (complete or stopped). */
export function canReport(state: AnswerState): boolean {
  return state === 'done' || state === 'stopped'
}

/** A question can be asked: some text that is not only spaces. */
export function questionReady(text: string): boolean {
  return text.trim() !== ''
}

/**
 * What a key in the question box does: Enter asks, Shift+Enter (or Enter while an input method
 * composes a word) breaks the line, anything else types.
 */
export function questionKey(key: {
  key: string
  shiftKey: boolean
  isComposing?: boolean
}): 'ask' | 'newline' | null {
  if (key.key !== 'Enter') return null
  if (key.shiftKey || key.isComposing === true) return 'newline'
  return 'ask'
}

/** The buttons a proposed action offers in its state. */
export function actionOffers(state: ProposedActionState): {
  confirm: boolean
  dismiss: boolean
} {
  if (state === 'proposed' || state === 'failed') return { confirm: true, dismiss: true }
  if (state === 'running') return { confirm: true, dismiss: true }
  return { confirm: false, dismiss: false }
}

/** The action is settled: done or dismissed; its card then says what happened. */
export function actionSettled(state: ProposedActionState): boolean {
  return state === 'done' || state === 'dismissed'
}

/** The sources of an answer, in the order of its blocks (each id once). */
export function answerSources(blocks: readonly AnswerBlock[]): AnswerSource[] {
  const seen = new Set<string>()
  const out: AnswerSource[] = []
  for (const block of blocks) {
    if (block.kind !== 'sources') continue
    for (const item of block.items) {
      if (seen.has(item.id)) continue
      seen.add(item.id)
      out.push(item)
    }
  }
  return out
}
