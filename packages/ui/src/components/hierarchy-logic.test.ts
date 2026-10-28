import { describe, expect, it } from 'vitest'
import {
  descendantCount,
  hasChildren,
  hierarchyKeyAction,
  hierarchyPath,
  indexHierarchy,
  initiallyExpanded,
  matchHierarchy,
  revealNode,
  stacksChildren,
  toggleWidth,
  visibleHierarchy,
  type HierarchyNode,
} from './hierarchy-logic'

/** A small company: a director, two units, a unit of three leaves, a vacant position. */
const NODES: HierarchyNode[] = [
  { id: 'ceo', parentId: null, title: 'Ana Director', subtitle: 'Director' },
  { id: 'fin', parentId: 'ceo', title: 'Bora Finance', subtitle: 'Head of finance' },
  { id: 'acc', parentId: 'fin', title: 'Cica Accountant', subtitle: 'Accountant' },
  { id: 'ops', parentId: 'ceo', title: 'Dara Operations', subtitle: 'Head of operations' },
  { id: 'w1', parentId: 'ops', title: 'Eva Worker', subtitle: 'Mason' },
  { id: 'w2', parentId: 'ops', title: 'Filip Worker', subtitle: 'Carpenter' },
  { id: 'w3', parentId: 'ops', title: 'Buyer', subtitle: 'Procurement', vacant: true },
  { id: 'orphan', parentId: 'missing', title: 'Gaga Orphan' },
]

const index = indexHierarchy(NODES)

describe('indexHierarchy and its walks', () => {
  it('groups by parent; a missing parent makes a top node', () => {
    expect(index.roots.map((node) => node.id)).toEqual(['ceo', 'orphan'])
    expect(index.children.get('ops')?.map((node) => node.id)).toEqual(['w1', 'w2', 'w3'])
    expect(hasChildren(index, 'fin')).toBe(true)
    expect(hasChildren(index, 'acc')).toBe(false)
  })

  it('finds the path from the top down, and nothing for an unknown id', () => {
    expect(hierarchyPath(index, 'w2')).toEqual(['ceo', 'ops', 'w2'])
    expect(hierarchyPath(index, 'ceo')).toEqual(['ceo'])
    expect(hierarchyPath(index, 'nobody')).toEqual([])
  })

  it('stops at a cycle in the data', () => {
    const cycle = indexHierarchy([
      { id: 'a', parentId: 'b', title: 'A' },
      { id: 'b', parentId: 'a', title: 'B' },
    ])
    expect(hierarchyPath(cycle, 'a')).toEqual(['b', 'a'])
  })

  it('counts every node under a node', () => {
    expect(descendantCount(index, 'ceo')).toBe(6)
    expect(descendantCount(index, 'ops')).toBe(3)
    expect(descendantCount(index, 'w1')).toBe(0)
  })
})

describe('what is open and drawn', () => {
  it('opens the first levels', () => {
    expect(initiallyExpanded(index, 1)).toEqual([])
    expect(initiallyExpanded(index, 2)).toEqual(['ceo'])
    expect(initiallyExpanded(index, 3)).toEqual(['ceo', 'fin', 'ops'])
    expect(initiallyExpanded(index, 2, ['ops'])).toEqual(['ops'])
  })

  it('reveals a node by opening the nodes above it', () => {
    expect(revealNode(index, [], 'acc')).toEqual(['ceo', 'fin'])
    expect(revealNode(index, ['ceo'], 'acc')).toEqual(['ceo', 'fin'])
  })

  it('stacks children that are all leaves, from the given count', () => {
    expect(stacksChildren(index, 'ops', 3)).toBe(true)
    expect(stacksChildren(index, 'ops', 4)).toBe(false)
    expect(stacksChildren(index, 'ceo', 1)).toBe(false)
  })

  it('lists the drawn nodes depth first with their tree positions', () => {
    const items = visibleHierarchy(index, index.roots, ['ceo', 'ops'], 3)
    expect(items.map((item) => item.id)).toEqual(['ceo', 'fin', 'ops', 'w1', 'w2', 'w3', 'orphan'])
    expect(items.find((item) => item.id === 'ops')).toMatchObject({
      level: 2,
      setSize: 2,
      posInSet: 2,
      expandable: true,
      expanded: true,
      stacked: false,
    })
    expect(items.find((item) => item.id === 'w2')).toMatchObject({
      level: 3,
      posInSet: 2,
      stacked: true,
    })
    expect(items.find((item) => item.id === 'fin')?.expanded).toBe(false)
  })
})

describe('matchHierarchy', () => {
  it('finds by title, subtitle or detail, ignoring case', () => {
    expect(matchHierarchy(NODES, 'worker')).toEqual(['w1', 'w2'])
    expect(matchHierarchy(NODES, 'MASON')).toEqual(['w1'])
    expect(matchHierarchy(NODES, '  ')).toEqual([])
  })

  it('compares in the given locale', () => {
    const nodes: HierarchyNode[] = [{ id: 'i', parentId: null, title: 'İstanbul' }]
    expect(matchHierarchy(nodes, 'istanbul', 'tr')).toEqual(['i'])
  })
})

describe('hierarchyKeyAction', () => {
  const items = visibleHierarchy(index, index.roots, ['ceo', 'ops'], 3)
  const act = (id: string, key: string, direction: 'ltr' | 'rtl' = 'ltr') =>
    hierarchyKeyAction(index, items, id, key, direction)

  it('goes down to the first child, opening a closed node', () => {
    expect(act('ceo', 'ArrowDown')).toEqual({ kind: 'move', id: 'fin' })
    expect(act('fin', 'ArrowDown')).toEqual({ kind: 'enter', id: 'fin', child: 'acc' })
    expect(act('w1', 'ArrowDown')).toEqual({ kind: 'move', id: 'w2' })
    expect(act('w3', 'ArrowDown')).toBeNull()
  })

  it('goes up to the parent, or along a stacked list', () => {
    expect(act('fin', 'ArrowUp')).toEqual({ kind: 'move', id: 'ceo' })
    expect(act('w2', 'ArrowUp')).toEqual({ kind: 'move', id: 'w1' })
    expect(act('w1', 'ArrowUp')).toEqual({ kind: 'move', id: 'ops' })
    expect(act('ceo', 'ArrowUp')).toBeNull()
  })

  it('moves between siblings, mirrored in right-to-left', () => {
    expect(act('fin', 'ArrowRight')).toEqual({ kind: 'move', id: 'ops' })
    expect(act('ops', 'ArrowLeft')).toEqual({ kind: 'move', id: 'fin' })
    expect(act('fin', 'ArrowLeft', 'rtl')).toEqual({ kind: 'move', id: 'ops' })
    expect(act('fin', 'ArrowRight', 'rtl')).toBeNull()
  })

  it('goes to the first and last drawn node', () => {
    expect(act('w2', 'Home')).toEqual({ kind: 'move', id: 'ceo' })
    expect(act('ceo', 'End')).toEqual({ kind: 'move', id: 'orphan' })
  })

  it('opens the card, toggles, and opens the siblings', () => {
    expect(act('w1', 'Enter')).toEqual({ kind: 'open', id: 'w1' })
    expect(act('ops', ' ')).toEqual({ kind: 'toggle', id: 'ops' })
    expect(act('w1', ' ')).toBeNull()
    expect(act('ops', '*')).toEqual({ kind: 'expand', ids: ['fin'] })
    expect(act('w1', '*')).toBeNull()
    expect(act('nobody', 'Enter')).toBeNull()
    expect(act('ceo', 'x')).toBeNull()
  })
})

describe('toggleWidth (P5.93 item 35)', () => {
  it('is odd, at least 25px, and grows with the label', () => {
    expect(toggleWidth('−')).toBe(25)
    expect(toggleWidth('+3')).toBe(25)
    expect(toggleWidth('+12')).toBe(31)
    expect(toggleWidth('+123')).toBe(37)
    expect(toggleWidth('+١٢')).toBe(31)
    for (const label of ['−', '+3', '+12', '+1.234']) expect(toggleWidth(label) % 2).toBe(1)
  })
})
