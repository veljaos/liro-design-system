import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import {
  instantText,
  isAllowed,
  matrixFocusTarget,
  matrixKeyTarget,
  maySign,
  recoveryCodesText,
  resumeStep,
  setPermission,
  setupProgress,
  signerTurn,
  signingSummary,
  type SignerState,
} from './admin-logic'
import {
  codeBoxes,
  codeCharacters,
  codeComplete,
  codeKeyTarget,
  codeValue,
  eraseCode,
  fillCode,
} from './code-input-logic'
import {
  dragLayout,
  dropTarget,
  kanbanKeyTarget,
  moveCard,
  placeOf,
  type ColumnGeometry,
} from './kanban-logic'

describe('CodeInput logic', () => {
  it('reads the characters of a code, dropping spaces and dashes', () => {
    expect(codeCharacters('123 456', 'numeric')).toEqual(['1', '2', '3', '4', '5', '6'])
    expect(codeCharacters('12a-3', 'numeric')).toEqual(['1', '2', '3'])
    expect(codeCharacters('ab12-cd', 'alphanumeric')).toEqual(['A', 'B', '1', '2', 'C', 'D'])
    // Arabic-Indic digits are not the code the server sent.
    expect(codeCharacters('١٢٣', 'numeric')).toEqual([])
  })

  it('fills every box from the first when a whole code is pasted into any box', () => {
    const empty = codeBoxes('', 6)
    expect(fillCode(empty, 3, '482 913', 'numeric')).toEqual({
      boxes: ['4', '8', '2', '9', '1', '3'],
      focus: 5,
    })
    // A longer text keeps the first six characters.
    expect(fillCode(empty, 0, '4829137', 'numeric').boxes).toEqual(['4', '8', '2', '9', '1', '3'])
  })

  it('fills from the box typed into and moves the focus on', () => {
    expect(fillCode(['1', '', '', '', '', ''], 1, '2', 'numeric')).toEqual({
      boxes: ['1', '2', '', '', '', ''],
      focus: 2,
    })
    expect(fillCode(['', '', '', '', '', ''], 4, '78', 'numeric')).toEqual({
      boxes: ['', '', '', '', '7', '8'],
      focus: 5,
    })
    // Nothing usable: nothing changes.
    expect(fillCode(['1', '', '', '', '', ''], 1, 'x', 'numeric')).toEqual({
      boxes: ['1', '', '', '', '', ''],
      focus: 1,
    })
  })

  it('keeps empty boxes as spaces in the value', () => {
    expect(codeValue(['1', '', '3', '', '', ''])).toBe('1 3')
    expect(codeBoxes('1 3', 6)).toEqual(['1', '', '3', '', '', ''])
    expect(codeComplete(codeBoxes('123456', 6))).toBe(true)
    expect(codeComplete(codeBoxes('12345', 6))).toBe(false)
  })

  it('moves with the arrows from the leading edge', () => {
    expect(codeKeyTarget('ArrowRight', 2, 6, 'ltr')).toBe(3)
    expect(codeKeyTarget('ArrowLeft', 2, 6, 'ltr')).toBe(1)
    expect(codeKeyTarget('ArrowLeft', 2, 6, 'rtl')).toBe(3)
    expect(codeKeyTarget('ArrowRight', 2, 6, 'rtl')).toBe(1)
    expect(codeKeyTarget('Home', 4, 6, 'ltr')).toBe(0)
    expect(codeKeyTarget('End', 1, 6, 'ltr')).toBe(5)
    expect(codeKeyTarget('ArrowRight', 5, 6, 'ltr')).toBeNull()
    expect(codeKeyTarget('ArrowLeft', 0, 6, 'ltr')).toBeNull()
    expect(codeKeyTarget('a', 0, 6, 'ltr')).toBeNull()
  })

  it('erases with Backspace: the box itself, else the one before', () => {
    expect(eraseCode(['1', '2', '3', '', '', ''], 2)).toEqual({
      boxes: ['1', '2', '', '', '', ''],
      focus: 2,
    })
    expect(eraseCode(['1', '2', '', '', '', ''], 2)).toEqual({
      boxes: ['1', '', '', '', '', ''],
      focus: 1,
    })
    expect(eraseCode(['', '', '', '', '', ''], 0)).toEqual({
      boxes: ['', '', '', '', '', ''],
      focus: 0,
    })
  })
})

const BOARD = [
  { id: 'todo', cards: [{ id: 'a' }, { id: 'b' }, { id: 'c' }] },
  { id: 'doing', cards: [{ id: 'd' }] },
  { id: 'done', cards: [] as { id: string }[] },
]

describe('KanbanBoard logic', () => {
  it('finds a card and moves it, keeping the others in order', () => {
    expect(placeOf(BOARD, 'b')).toEqual({ column: 'todo', index: 1 })
    expect(placeOf(BOARD, 'x')).toBeNull()
    const moved = moveCard(BOARD, 'b', { column: 'doing', index: 0 })
    expect(moved.map((column) => column.cards.map((card) => card.id))).toEqual([
      ['a', 'c'],
      ['b', 'd'],
      [],
    ])
    // Within a column; the index is counted without the card itself, and clamped.
    expect(moveCard(BOARD, 'a', { column: 'todo', index: 9 })[0]?.cards.map((c) => c.id)).toEqual([
      'b',
      'c',
      'a',
    ])
    // Into an empty column; an unknown column changes nothing.
    expect(moveCard(BOARD, 'd', { column: 'done', index: 0 })[2]?.cards).toEqual([{ id: 'd' }])
    expect(moveCard(BOARD, 'd', { column: 'nowhere', index: 0 })).toEqual(BOARD)
  })

  it('moves a lifted card with the keys, between columns from the leading edge', () => {
    const at = { column: 'todo', index: 1 }
    expect(kanbanKeyTarget('ArrowUp', at, BOARD, 'b', 'ltr')).toEqual({ column: 'todo', index: 0 })
    expect(kanbanKeyTarget('ArrowDown', at, BOARD, 'b', 'ltr')).toEqual({
      column: 'todo',
      index: 2,
    })
    // At the bottom of its column it stays.
    expect(kanbanKeyTarget('ArrowDown', { column: 'todo', index: 2 }, BOARD, 'b', 'ltr')).toBeNull()
    expect(kanbanKeyTarget('ArrowUp', { column: 'todo', index: 0 }, BOARD, 'b', 'ltr')).toBeNull()
    // Forward: ArrowRight in left-to-right, ArrowLeft in right-to-left; the index is kept as far
    // as the next column allows (one card there: index 1 at most).
    expect(kanbanKeyTarget('ArrowRight', at, BOARD, 'b', 'ltr')).toEqual({
      column: 'doing',
      index: 1,
    })
    expect(kanbanKeyTarget('ArrowLeft', at, BOARD, 'b', 'rtl')).toEqual({
      column: 'doing',
      index: 1,
    })
    expect(kanbanKeyTarget('ArrowLeft', at, BOARD, 'b', 'ltr')).toBeNull()
    expect(kanbanKeyTarget('ArrowRight', at, BOARD, 'b', 'rtl')).toBeNull()
    expect(kanbanKeyTarget('ArrowRight', { column: 'doing', index: 1 }, BOARD, 'b', 'ltr')).toEqual(
      { column: 'done', index: 0 },
    )
    expect(kanbanKeyTarget('Enter', at, BOARD, 'b', 'ltr')).toBeNull()
  })

  // Two columns 280px wide, 16px apart; cards 80px high, 8px apart, the lists start at y 40.
  const geometry = (x0: number, x1: number): ColumnGeometry[] => [
    {
      id: 'todo',
      x: x0,
      width: 280,
      top: 40,
      cards: [
        { id: 'a', y: 40, height: 80 },
        { id: 'b', y: 128, height: 80 },
        { id: 'c', y: 216, height: 80 },
      ],
    },
    { id: 'doing', x: x1, width: 280, top: 40, cards: [{ id: 'd', y: 40, height: 80 }] },
  ]

  it('finds the drop place under the dragged card, in both directions', () => {
    const ltr = geometry(0, 296)
    // b dragged right into the second column, its centre below d's centre: after d.
    expect(dropTarget(ltr, 'b', { x: 400, y: 120 })).toEqual({ column: 'doing', index: 1 })
    // Above d's centre: before it.
    expect(dropTarget(ltr, 'b', { x: 400, y: 60 })).toEqual({ column: 'doing', index: 0 })
    // Within its own column, below c: the last place (counted without itself).
    expect(dropTarget(ltr, 'b', { x: 100, y: 300 })).toEqual({ column: 'todo', index: 2 })
    // Right to left: the first column stands at the right; measured slots need no mirroring.
    const rtl = geometry(296, 0)
    expect(dropTarget(rtl, 'b', { x: 100, y: 120 })).toEqual({ column: 'doing', index: 1 })
    // Between the columns or past the board: the nearest column.
    expect(dropTarget(ltr, 'b', { x: 900, y: 120 })).toEqual({ column: 'doing', index: 1 })
  })

  it('makes room: cards after the gap move up, cards after the target move down', () => {
    const { shifts, placeholder } = dragLayout(
      geometry(0, 296),
      'a',
      { column: 'doing', index: 0 },
      8,
    )
    // a left its column: b and c move up by a's height and the gap.
    expect(shifts).toEqual({ b: -88, c: -88, d: 88 })
    expect(placeholder).toEqual({ column: 'doing', y: 0, height: 80 })
    // Within the column: b dropped after c.
    const within = dragLayout(geometry(0, 296), 'b', { column: 'todo', index: 2 }, 8)
    expect(within.shifts).toEqual({ a: 0, c: -88, d: 0 })
    expect(within.placeholder).toEqual({ column: 'todo', y: 176, height: 80 })
    // At its own place nothing moves.
    expect(dragLayout(geometry(0, 296), 'b', { column: 'todo', index: 1 }, 8).shifts).toEqual({
      a: 0,
      c: 0,
      d: 0,
    })
  })
})

describe('PermissionMatrix logic', () => {
  const actions = ['view', 'create', 'edit', 'delete']
  it('allows and forbids, keeping the columns’ order', () => {
    const value = { sales: ['view'] }
    expect(isAllowed(value, 'sales', 'view')).toBe(true)
    expect(isAllowed(value, 'sales', 'edit')).toBe(false)
    expect(isAllowed(value, 'banking', 'view')).toBe(false)
    const more = setPermission(value, 'sales', 'delete', true, actions)
    expect(setPermission(more, 'sales', 'create', true, actions)).toEqual({
      sales: ['view', 'create', 'delete'],
    })
    expect(setPermission(more, 'sales', 'view', false, actions)).toEqual({ sales: ['delete'] })
    expect(setPermission(value, 'banking', 'view', true, actions)).toEqual({
      sales: ['view'],
      banking: ['view'],
    })
  })

  it('moves like a grid, forward in the reading direction', () => {
    const at = { row: 1, column: 1 }
    expect(matrixKeyTarget('ArrowRight', at, 3, 4, 'ltr')).toEqual({ row: 1, column: 2 })
    expect(matrixKeyTarget('ArrowLeft', at, 3, 4, 'rtl')).toEqual({ row: 1, column: 2 })
    expect(matrixKeyTarget('ArrowRight', at, 3, 4, 'rtl')).toEqual({ row: 1, column: 0 })
    expect(matrixKeyTarget('ArrowDown', at, 3, 4, 'ltr')).toEqual({ row: 2, column: 1 })
    expect(matrixKeyTarget('ArrowUp', at, 3, 4, 'ltr')).toEqual({ row: 0, column: 1 })
    expect(matrixKeyTarget('Home', at, 3, 4, 'ltr')).toEqual({ row: 1, column: 0 })
    expect(matrixKeyTarget('End', at, 3, 4, 'ltr')).toEqual({ row: 1, column: 3 })
    expect(matrixKeyTarget('Home', at, 3, 4, 'ltr', true)).toEqual({ row: 0, column: 0 })
    expect(matrixKeyTarget('End', at, 3, 4, 'ltr', true)).toEqual({ row: 2, column: 3 })
    expect(matrixKeyTarget('ArrowUp', { row: 0, column: 0 }, 3, 4, 'ltr')).toBeNull()
    expect(matrixKeyTarget('ArrowRight', { row: 0, column: 3 }, 3, 4, 'ltr')).toBeNull()
    expect(matrixKeyTarget(' ', at, 3, 4, 'ltr')).toBeNull()
  })
})

describe('PermissionMatrix focus', () => {
  // Column 1 of row 0 and the whole column 2 do not apply (no checkbox).
  const focusable = (cell: { row: number; column: number }) =>
    !(cell.row === 0 && cell.column === 1) && cell.column !== 2
  it('goes on past cells without a checkbox', () => {
    expect(
      matrixFocusTarget('ArrowRight', { row: 0, column: 0 }, 3, 4, 'ltr', false, focusable),
    ).toEqual({ row: 0, column: 3 })
    expect(
      matrixFocusTarget('ArrowLeft', { row: 1, column: 3 }, 3, 4, 'ltr', false, focusable),
    ).toEqual({ row: 1, column: 1 })
    expect(
      matrixFocusTarget('ArrowDown', { row: 0, column: 3 }, 3, 4, 'ltr', false, focusable),
    ).toEqual({ row: 1, column: 3 })
    expect(
      matrixFocusTarget('ArrowUp', { row: 1, column: 1 }, 3, 4, 'ltr', false, focusable),
    ).toBeNull()
  })
  it('takes the first and last cell that can take the focus', () => {
    expect(matrixFocusTarget('End', { row: 1, column: 0 }, 3, 4, 'ltr', false, focusable)).toEqual({
      row: 1,
      column: 3,
    })
    expect(matrixFocusTarget('Home', { row: 0, column: 3 }, 3, 4, 'ltr', false, focusable)).toEqual(
      { row: 0, column: 0 },
    )
    // Already the first that can: nothing moves.
    expect(
      matrixFocusTarget('Home', { row: 0, column: 0 }, 3, 4, 'ltr', false, focusable),
    ).toBeNull()
    expect(matrixFocusTarget('End', { row: 0, column: 0 }, 3, 4, 'ltr', true, focusable)).toEqual({
      row: 2,
      column: 3,
    })
    expect(matrixFocusTarget('Home', { row: 2, column: 3 }, 3, 4, 'ltr', true, focusable)).toEqual({
      row: 0,
      column: 0,
    })
  })
})

describe('SetupChecklist logic', () => {
  it('counts the steps done and resumes at the next open one', () => {
    const steps = [
      { id: 'company', state: 'done' as const },
      { id: 'sef', state: 'done' as const },
      { id: 'bank', state: 'blocked' as const },
      { id: 'customers', state: 'todo' as const },
      { id: 'invoice', state: 'todo' as const },
    ]
    expect(setupProgress(steps)).toEqual({ done: 2, total: 5 })
    // The first step still to do; a blocked step is skipped.
    expect(resumeStep(steps)).toBe('customers')
    // The application's `current` wins.
    expect(
      resumeStep(steps.map((s) => (s.id === 'invoice' ? { ...s, state: 'current' } : s))),
    ).toBe('invoice')
    expect(resumeStep([{ id: 'company', state: 'done' }])).toBeNull()
  })
})

describe('Signing logic', () => {
  const signers: { id: string; state: SignerState }[] = [
    { id: 'nenad', state: 'signed' },
    { id: 'stefan', state: 'waiting' },
    { id: 'jelena', state: 'waiting' },
  ]
  it('counts the signatures', () => {
    expect(signingSummary(signers)).toEqual({ signed: 1, total: 3, declined: false })
  })
  it('gives the turn to the first waiting signer in order', () => {
    expect(signerTurn(signers, true)).toBe('stefan')
    expect(maySign(signers, 'stefan', true)).toBe(true)
    expect(maySign(signers, 'jelena', true)).toBe(false)
    expect(maySign(signers, 'nenad', true)).toBe(false)
    // In any order, every waiting signer may sign.
    expect(signerTurn(signers, false)).toBeNull()
    expect(maySign(signers, 'jelena', false)).toBe(true)
  })
  it('stops when someone declined', () => {
    const declined = signers.map((s) =>
      s.id === 'stefan' ? { ...s, state: 'declined' as const } : s,
    )
    expect(signingSummary(declined).declined).toBe(true)
    expect(signerTurn(declined, true)).toBeNull()
    expect(maySign(declined, 'jelena', false)).toBe(false)
  })
})

describe('instantText and recoveryCodesText', () => {
  it('writes an instant as its own date and clock time', () => {
    const format = createFormat('sr-Latn-RS')
    expect(instantText(format, '2026-10-05T14:12:00+02:00')).toBe('05.10.2026. 14:12')
    expect(instantText(format, 'yesterday')).toBe('yesterday')
  })
  it('makes the codes file: heading, empty line, one code per line', () => {
    expect(recoveryCodesText('Liro — milica', ['a1b2-c3d4', 'e5f6-g7h8'])).toBe(
      'Liro — milica\n\na1b2-c3d4\ne5f6-g7h8\n',
    )
  })
})
