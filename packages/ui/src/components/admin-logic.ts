import type { LiroFormat } from '../provider/format'

/*
 * The logic of the P5.6 and P5.21 building blocks, kept apart from the markup so it can be
 * unit-tested (AGENTS.md C7): the permission matrix's values and keys, the setup checklist's
 * progress, the signers' turn, an instant written as date and time, and the recovery codes' file.
 */

// ── An instant ────────────────────────────────────────────────────────────────────────────────

/**
 * An instant ("2026-10-05T14:12:00+02:00", in the tenant's offset) as its date and clock time,
 * "05.10.2026. 14:12": the day from `format.date` and the time from `format.time`, both as the
 * instant writes them, so the two never disagree (P4.9 notifications). Unreadable input is
 * returned as it is.
 */
export function instantText(format: LiroFormat, instant: string): string {
  const day = /^\d{4}-\d{2}-\d{2}/.exec(instant)?.[0]
  if (day === undefined || !/T\d{2}:\d{2}/.test(instant)) return instant
  return `${format.date(day)} ${format.time(instant)}`
}

// ── Permission matrix ─────────────────────────────────────────────────────────────────────────

/** The actions each area allows: area id → action ids. */
export type PermissionValue = Readonly<Record<string, readonly string[]>>

/** Whether `action` is allowed in `area`. */
export function isAllowed(value: PermissionValue, area: string, action: string): boolean {
  return value[area]?.includes(action) === true
}

/**
 * The value after allowing or forbidding one action in one area; the area's actions keep the
 * order of `actions` (the matrix's columns), so the value reads the same however it was built.
 */
export function setPermission(
  value: PermissionValue,
  area: string,
  action: string,
  allowed: boolean,
  actions: readonly string[],
): PermissionValue {
  const current = new Set(value[area] ?? [])
  if (allowed) current.add(action)
  else current.delete(action)
  return { ...value, [area]: actions.filter((each) => current.has(each)) }
}

/** A cell of the matrix: its row (area) and column (action), counted from 0. */
export interface MatrixCell {
  row: number
  column: number
}

/**
 * The cell the focus moves to in the matrix (the WAI-ARIA grid pattern): the arrows one cell —
 * the arrow pointing forward in the reading direction to the next column (B.7) —, Home and End to
 * the row's first and last cell, Ctrl (or Cmd) with Home or End to the first and last cell of the
 * matrix. Null when the key does not move.
 */
export function matrixKeyTarget(
  key: string,
  cell: MatrixCell,
  rows: number,
  columns: number,
  direction: 'ltr' | 'rtl',
  control = false,
): MatrixCell | null {
  const forward = direction === 'ltr' ? 'ArrowRight' : 'ArrowLeft'
  const backward = direction === 'ltr' ? 'ArrowLeft' : 'ArrowRight'
  let target: MatrixCell
  if (key === forward) target = { row: cell.row, column: cell.column + 1 }
  else if (key === backward) target = { row: cell.row, column: cell.column - 1 }
  else if (key === 'ArrowDown') target = { row: cell.row + 1, column: cell.column }
  else if (key === 'ArrowUp') target = { row: cell.row - 1, column: cell.column }
  else if (key === 'Home') target = control ? { row: 0, column: 0 } : { row: cell.row, column: 0 }
  else if (key === 'End') {
    target = control
      ? { row: rows - 1, column: columns - 1 }
      : { row: cell.row, column: columns - 1 }
  } else return null
  const inside =
    target.row >= 0 && target.row < rows && target.column >= 0 && target.column < columns
  if (!inside || (target.row === cell.row && target.column === cell.column)) return null
  return target
}

/**
 * The cell the focus moves to when only some cells can take it (a checkbox; a cell the action
 * does not apply to cannot): the arrows go on past cells that cannot, in the same direction;
 * Home and End take the row's first and last cell that can; with Ctrl the matrix's. Null when no
 * such cell is that way.
 */
export function matrixFocusTarget(
  key: string,
  cell: MatrixCell,
  rows: number,
  columns: number,
  direction: 'ltr' | 'rtl',
  control: boolean,
  focusable: (cell: MatrixCell) => boolean,
): MatrixCell | null {
  const first = matrixKeyTarget(key, cell, rows, columns, direction, control)
  if (first === null) return null
  if (key.startsWith('Arrow')) {
    let target: MatrixCell | null = first
    while (target !== null && !focusable(target)) {
      target = matrixKeyTarget(key, target, rows, columns, direction)
    }
    return target
  }
  const all = Array.from({ length: rows * columns }, (_, index) => ({
    row: Math.floor(index / columns),
    column: index % columns,
  }))
  const candidates = control ? all : all.filter((each) => each.row === cell.row)
  const ordered = key === 'End' ? [...candidates].reverse() : candidates
  const target = ordered.find(focusable)
  if (target === undefined || (target.row === cell.row && target.column === cell.column)) {
    return null
  }
  return target
}

// ── Setup checklist ───────────────────────────────────────────────────────────────────────────

/** A step's state: done, the one to do now, still to do, or blocked (with a reason). */
export type SetupStepState = 'done' | 'current' | 'todo' | 'blocked'

/** How many steps are done, of how many. */
export function setupProgress(steps: readonly { state: SetupStepState }[]): {
  done: number
  total: number
} {
  return { done: steps.filter((step) => step.state === 'done').length, total: steps.length }
}

/**
 * The step the checklist highlights to resume: the one the application marks `current`, else
 * the first step still to do (a blocked step waits for something else); null when nothing is
 * open.
 */
export function resumeStep(steps: readonly { id: string; state: SetupStepState }[]): string | null {
  return (
    steps.find((step) => step.state === 'current')?.id ??
    steps.find((step) => step.state === 'todo')?.id ??
    null
  )
}

// ── Signing ───────────────────────────────────────────────────────────────────────────────────

/** A signer's state. */
export type SignerState = 'waiting' | 'signed' | 'declined'

/** How many have signed, of how many, and whether anyone declined. */
export function signingSummary(signers: readonly { state: SignerState }[]): {
  signed: number
  total: number
  declined: boolean
} {
  return {
    signed: signers.filter((signer) => signer.state === 'signed').length,
    total: signers.length,
    declined: signers.some((signer) => signer.state === 'declined'),
  }
}

/**
 * Whose turn it is. In order (`sequential`): the first signer still waiting, as long as nobody
 * declined (a declined document stops). In any order: every waiting signer may sign, so the
 * result is null and `maySign` answers per signer.
 */
export function signerTurn(
  signers: readonly { id: string; state: SignerState }[],
  sequential: boolean,
): string | null {
  if (!sequential || signers.some((signer) => signer.state === 'declined')) return null
  return signers.find((signer) => signer.state === 'waiting')?.id ?? null
}

/** Whether the signer `id` may sign now. */
export function maySign(
  signers: readonly { id: string; state: SignerState }[],
  id: string,
  sequential: boolean,
): boolean {
  const signer = signers.find((each) => each.id === id)
  if (signer?.state !== 'waiting') return false
  if (signers.some((each) => each.state === 'declined')) return false
  return sequential ? signerTurn(signers, true) === id : true
}

// ── Recovery codes ────────────────────────────────────────────────────────────────────────────

/**
 * The text file of recovery codes made in the browser (P5.6): the heading (the application's
 * account line, e.g. "Liro Business Apps — milica.petrovic@kvadratgradnja.rs"), an empty line,
 * one code per line, and a final line break. Windows line breaks would show as one line in no
 * editor any more, so plain "\n".
 */
export function recoveryCodesText(heading: string, codes: readonly string[]): string {
  return `${[heading, '', ...codes].join('\n')}\n`
}
