import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import { LiroProvider } from '../provider/liro-provider'
import { messagesEn } from '../provider/messages.en'
import { FilterBar } from './filter-bar'
import {
  clearFilters,
  emptyFilterValue,
  filterValueText,
  isFilterSet,
  treeFilterIds,
  treeFilterLabels,
  type FilterDefinition,
} from './filter-logic'
import type { TreeNode } from './tree-logic'

/* The tree filter kind: its value, its pill and its place in the bar. */

const AREAS: TreeNode[] = [
  {
    id: 'construction',
    label: 'Construction',
    children: [
      { id: 'permits', label: 'Building permits' },
      { id: 'safety', label: 'Site safety' },
    ],
  },
  {
    id: 'labour',
    label: 'Labour',
    children: [
      { id: 'contracts', label: 'Employment contracts' },
      {
        id: 'time',
        label: 'Working time',
        children: [{ id: 'leave', label: 'Leave' }],
      },
    ],
  },
]

const AREA: FilterDefinition = { id: 'area', label: 'Area', type: 'tree', nodes: AREAS }
const STATUS: FilterDefinition = {
  id: 'status',
  label: 'Status',
  type: 'select',
  options: [{ value: 'in-force', label: 'In force' }],
}

const format = createFormat('en')

describe('the tree filter kind', () => {
  it('is not set while empty, and empties to a list', () => {
    expect(emptyFilterValue(AREA)).toEqual([])
    expect(isFilterSet(emptyFilterValue(AREA))).toBe(false)
    expect(isFilterSet(['permits'])).toBe(true)
    expect(clearFilters([AREA], { area: ['permits'], other: 'kept' })).toEqual({
      area: [],
      other: 'kept',
    })
  })

  it('reads its value as a list of ids', () => {
    expect(treeFilterIds(['a', 'b'])).toEqual(['a', 'b'])
    expect(treeFilterIds('a')).toEqual(['a'])
    expect(treeFilterIds('')).toEqual([])
    expect(treeFilterIds(null)).toEqual([])
    expect(treeFilterIds(['a', 3])).toEqual(['a'])
  })

  it('names the highest chosen nodes, in the tree’s order', () => {
    // A checked branch stands for its children.
    expect(treeFilterLabels(AREAS, ['permits', 'safety', 'construction'])).toEqual(['Construction'])
    expect(treeFilterLabels(AREAS, ['leave', 'permits'])).toEqual(['Building permits', 'Leave'])
    expect(treeFilterLabels(AREAS, ['time', 'leave', 'contracts'])).toEqual([
      'Employment contracts',
      'Working time',
    ])
    // An id the tree does not hold (not loaded) as it is, at the end.
    expect(treeFilterLabels(AREAS, ['unknown', 'safety'])).toEqual(['Site safety', 'unknown'])
    expect(treeFilterLabels(AREAS, [])).toEqual([])
  })

  it('writes its pill text from the chosen nodes', () => {
    expect(filterValueText(AREA, ['construction', 'permits', 'safety'], format, messagesEn)).toBe(
      'Construction',
    )
    expect(filterValueText(AREA, ['leave', 'contracts'], format, messagesEn)).toBe(
      'Employment contracts, Leave',
    )
    expect(filterValueText(AREA, [], format, messagesEn)).toBeNull()
  })
})

describe('FilterBar with a tree filter', () => {
  const render = (node: React.ReactNode) =>
    renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

  it('keeps a tree in the drawer even among the inline filters, with its pill', () => {
    const html = render(
      <FilterBar
        filters={[AREA, STATUS]}
        values={{ area: ['permits'], status: 'in-force' }}
        onValuesChange={() => undefined}
        inline={2}
        layout="desktop"
      />,
    )
    // Status stands in the row; the tree is behind "Filters", shown as a pill.
    expect(html).toContain('>Status</label>')
    expect(html).toContain('>Filters</span>')
    expect(html).toContain('Area: Building permits')
    expect(html).not.toContain('Status: In force')
    expect(html).toContain('aria-label="Remove filter: Area"')
  })
})
