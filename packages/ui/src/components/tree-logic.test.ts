import { describe, expect, it } from 'vitest'
import {
  findTreeNode,
  isExpandable,
  needsChildren,
  toggleTreeSelection,
  treeAncestors,
  treeCheckStates,
  treeKeyAction,
  typeAheadTarget,
  visibleTreeRows,
  type TreeNode,
  type TreeRow,
} from './tree-logic'

/*
 * A small chart of accounts:
 *   1 Fixed assets
 *     10 Intangible assets
 *       100 Research
 *       101 Software
 *     12 Equipment (lazy)
 *   2 Current assets
 *     24 Cash (lazy, failed)
 *   3 Equity (leaf)
 */
const TREE: TreeNode[] = [
  {
    id: '1',
    code: '1',
    label: 'Fixed assets',
    children: [
      {
        id: '10',
        code: '10',
        label: 'Intangible assets',
        children: [
          { id: '100', code: '100', label: 'Research' },
          { id: '101', code: '101', label: 'Software' },
        ],
      },
      { id: '12', code: '12', label: 'Equipment', hasChildren: true },
    ],
  },
  {
    id: '2',
    code: '2',
    label: 'Current assets',
    children: [{ id: '24', code: '24', label: 'Cash', hasChildren: true, loadError: true }],
  },
  { id: '3', code: '3', label: 'Equity', children: [] },
]

const ids = (rows: readonly TreeRow<unknown>[]) => rows.map((row) => row.id)

describe('visibleTreeRows', () => {
  it('shows the top level when nothing is expanded', () => {
    const rows = visibleTreeRows(TREE, [])
    expect(ids(rows)).toEqual(['1', '2', '3'])
    expect(rows[0]).toMatchObject({ level: 1, setSize: 3, posInSet: 1, expandable: true })
    // A node with no children is a leaf.
    expect(rows[2]).toMatchObject({ expandable: false, expanded: false })
  })

  it('shows the children of expanded nodes whose ancestors are expanded too', () => {
    const rows = visibleTreeRows(TREE, ['1', '10', '101'])
    expect(ids(rows)).toEqual(['1', '10', '100', '101', '12', '2', '3'])
    expect(rows[2]).toMatchObject({ level: 3, setSize: 2, posInSet: 1, parentId: '10' })
    // A child of a collapsed node stays hidden even when it is in the list.
    expect(ids(visibleTreeRows(TREE, ['10']))).toEqual(['1', '2', '3'])
  })

  it('puts a loading row under an expanded node whose children are not loaded', () => {
    const rows = visibleTreeRows(TREE, ['1', '12'])
    const at = rows.findIndex((row) => row.id === '12')
    expect(rows[at + 1]).toMatchObject({ kind: 'loading', parentId: '12', level: 3 })
  })

  it('puts an error row under a node whose children failed to load', () => {
    const rows = visibleTreeRows(TREE, ['2', '24'])
    expect(rows.at(-2)).toMatchObject({ kind: 'error', parentId: '24', level: 3, error: true })
  })
})

describe('isExpandable and needsChildren', () => {
  it('tells loaded, lazy and empty nodes apart', () => {
    const lazy = { id: 'a', label: 'A', hasChildren: true }
    expect(isExpandable(lazy)).toBe(true)
    expect(needsChildren(lazy)).toBe(true)
    // Loaded and empty: no longer expandable, nothing to load.
    expect(isExpandable({ ...lazy, children: [] })).toBe(false)
    expect(needsChildren({ ...lazy, children: [] })).toBe(false)
    expect(isExpandable({ id: 'b', label: 'B' })).toBe(false)
  })
})

describe('treeKeyAction', () => {
  const rows = visibleTreeRows(TREE, ['1', '10'])
  // 1, 10, 100, 101, 12, 2, 3
  const at = (id: string) => rows.findIndex((row) => row.id === id)

  it('moves down and up, to the first and the last row', () => {
    expect(treeKeyAction('ArrowDown', rows, at('1'), 'ltr')).toEqual({ type: 'focus', index: 1 })
    expect(treeKeyAction('ArrowUp', rows, at('1'), 'ltr')).toBeNull()
    expect(treeKeyAction('ArrowDown', rows, at('3'), 'ltr')).toBeNull()
    expect(treeKeyAction('End', rows, at('1'), 'ltr')).toEqual({
      type: 'focus',
      index: rows.length - 1,
    })
    expect(treeKeyAction('Home', rows, at('101'), 'ltr')).toEqual({ type: 'focus', index: 0 })
  })

  it('opens a closed node with the arrow toward the trailing side, then enters it', () => {
    expect(treeKeyAction('ArrowRight', rows, at('12'), 'ltr')).toEqual({
      type: 'expand',
      id: '12',
    })
    expect(treeKeyAction('ArrowRight', rows, at('10'), 'ltr')).toEqual({
      type: 'focus',
      index: at('100'),
    })
    // A leaf does nothing.
    expect(treeKeyAction('ArrowRight', rows, at('100'), 'ltr')).toBeNull()
  })

  it('closes an open node with the other arrow, or goes to the parent', () => {
    expect(treeKeyAction('ArrowLeft', rows, at('10'), 'ltr')).toEqual({
      type: 'collapse',
      id: '10',
    })
    expect(treeKeyAction('ArrowLeft', rows, at('101'), 'ltr')).toEqual({
      type: 'focus',
      index: at('10'),
    })
    expect(treeKeyAction('ArrowLeft', rows, at('2'), 'ltr')).toBeNull()
  })

  it('mirrors Left and Right in right to left: "into" is toward the trailing side', () => {
    expect(treeKeyAction('ArrowLeft', rows, at('12'), 'rtl')).toEqual({ type: 'expand', id: '12' })
    expect(treeKeyAction('ArrowRight', rows, at('10'), 'rtl')).toEqual({
      type: 'collapse',
      id: '10',
    })
    expect(treeKeyAction('ArrowRight', rows, at('100'), 'rtl')).toEqual({
      type: 'focus',
      index: at('10'),
    })
    expect(treeKeyAction('ArrowRight', rows, at('12'), 'rtl')).toEqual({ type: 'focus', index: 0 })
    expect(treeKeyAction('ArrowRight', rows, at('2'), 'rtl')).toBeNull()
  })

  it('opens every closed sibling with *', () => {
    expect(treeKeyAction('*', rows, at('1'), 'ltr')).toEqual({ type: 'expandMany', ids: ['2'] })
    expect(treeKeyAction('*', rows, at('10'), 'ltr')).toEqual({ type: 'expandMany', ids: ['12'] })
    expect(treeKeyAction('*', rows, at('100'), 'ltr')).toBeNull()
  })

  it('goes from a loading or error row to its parent', () => {
    const lazy = visibleTreeRows(TREE, ['2', '24'])
    const error = lazy.findIndex((row) => row.kind === 'error')
    expect(treeKeyAction('ArrowLeft', lazy, error, 'ltr')).toEqual({
      type: 'focus',
      index: lazy.findIndex((row) => row.id === '24'),
    })
    expect(treeKeyAction('ArrowRight', lazy, error, 'ltr')).toBeNull()
  })

  it('ignores other keys', () => {
    expect(treeKeyAction('a', rows, 0, 'ltr')).toBeNull()
    expect(treeKeyAction('ArrowDown', rows, 99, 'ltr')).toBeNull()
  })
})

describe('typeAheadTarget', () => {
  const texts = [['Cash', '24'], ['Current assets', '2'], null, ['Equity', '3'], ['capital', '30']]

  it('finds the next row starting with the letters, wrapping around', () => {
    expect(typeAheadTarget(texts, 0, 'e')).toBe(3)
    expect(typeAheadTarget(texts, 3, 'c')).toBe(4)
    expect(typeAheadTarget(texts, 4, 'c')).toBe(0)
  })

  it('stays on the current row while more letters still match it', () => {
    expect(typeAheadTarget(texts, 1, 'cu')).toBe(1)
    expect(typeAheadTarget(texts, 0, 'cu')).toBe(1)
  })

  it('cycles through the rows when the same letter is typed again', () => {
    expect(typeAheadTarget(texts, 0, 'cc')).toBe(1)
  })

  it('finds a code, ignores rows without texts, and returns null without a match', () => {
    expect(typeAheadTarget(texts, 0, '30')).toBe(4)
    expect(typeAheadTarget(texts, 0, 'x')).toBeNull()
    expect(typeAheadTarget(texts, 0, '')).toBeNull()
    expect(typeAheadTarget([], 0, 'a')).toBeNull()
  })

  it('ignores case in the page locale', () => {
    expect(typeAheadTarget([['İzmir'], ['Istanbul']], 1, 'i', 'tr')).toBe(0)
  })
})

describe('treeCheckStates', () => {
  it('derives a branch from its children: all, none or mixed', () => {
    const states = treeCheckStates(TREE, ['100'])
    expect(states.get('100')).toBe(true)
    expect(states.get('101')).toBe(false)
    expect(states.get('10')).toBe('mixed')
    expect(states.get('1')).toBe('mixed')
    expect(states.get('2')).toBe(false)
    const all = treeCheckStates(TREE, ['100', '101', '12'])
    expect(all.get('10')).toBe(true)
    expect(all.get('1')).toBe(true)
  })

  it("lets a node's own checked state override the computed one", () => {
    const lazy: TreeNode[] = [{ id: 'a', label: 'A', hasChildren: true, checked: 'mixed' }]
    expect(treeCheckStates(lazy, []).get('a')).toBe('mixed')
  })

  it('reads a node without loaded children from its own id', () => {
    expect(treeCheckStates(TREE, ['12']).get('12')).toBe(true)
    expect(treeCheckStates(TREE, ['3']).get('3')).toBe(true)
  })
})

describe('toggleTreeSelection', () => {
  it('checks a branch with its loaded descendants, and its parent when all are checked', () => {
    expect(toggleTreeSelection(TREE, [], '10')).toEqual(['10', '100', '101'])
    expect(toggleTreeSelection(TREE, ['10', '100', '101'], '12')).toEqual([
      '10',
      '100',
      '101',
      '12',
      '1',
    ])
  })

  it('unchecks a checked branch with its descendants and clears the ancestors', () => {
    expect(toggleTreeSelection(TREE, ['1', '10', '100', '101', '12'], '10')).toEqual(['12'])
  })

  it('checks a mixed branch completely', () => {
    expect(toggleTreeSelection(TREE, ['100'], '10')).toEqual(['100', '10', '101'])
  })

  it('leaves a node that cannot be selected, and its own state', () => {
    const tree: TreeNode[] = [
      {
        id: 'p',
        label: 'P',
        children: [
          { id: 'a', label: 'A' },
          { id: 'b', label: 'B', disabledReason: 'Inactive' },
        ],
      },
    ]
    expect(toggleTreeSelection(tree, [], 'p')).toEqual(['a'])
    expect(toggleTreeSelection(tree, [], 'b')).toEqual([])
    expect(toggleTreeSelection(tree, ['x'], 'unknown')).toEqual(['x'])
  })
})

describe('findTreeNode and treeAncestors', () => {
  it('finds a node at any depth and its ancestors, nearest last', () => {
    expect(findTreeNode(TREE, '101')?.label).toBe('Software')
    expect(findTreeNode(TREE, 'nope')).toBeNull()
    expect(treeAncestors(TREE, '101')).toEqual(['1', '10'])
    expect(treeAncestors(TREE, '1')).toEqual([])
  })
})
