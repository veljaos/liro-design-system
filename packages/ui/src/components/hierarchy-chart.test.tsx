import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { HierarchyChart } from './hierarchy-chart'
import type { HierarchyNode } from './hierarchy-logic'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

const NODES: HierarchyNode[] = [
  {
    id: 'ceo',
    parentId: null,
    title: 'Ana Director',
    subtitle: 'Director',
    avatar: 'Ana Director',
  },
  {
    id: 'fin',
    parentId: 'ceo',
    title: 'Bora Finance',
    subtitle: 'Head of finance',
    count: '2 people',
  },
  { id: 'acc', parentId: 'fin', title: 'Cica Accountant', subtitle: 'Accountant' },
  { id: 'ops', parentId: 'ceo', title: 'Dara Operations', lineLabel: '60%' },
  { id: 'w1', parentId: 'ops', title: 'Eva Worker' },
  {
    id: 'w2',
    parentId: 'ops',
    title: 'Filip Worker',
    badge: { label: 'On leave', tone: 'warning' },
  },
  { id: 'w3', parentId: 'ops', title: 'Buyer', vacant: true },
]

describe('HierarchyChart', () => {
  it('is a tree of tree items with their places', () => {
    const html = render(<HierarchyChart label="Organisation" nodes={NODES} layout="desktop" />)
    expect(html).toContain('role="tree"')
    expect(html.match(/role="treeitem"/g)).toHaveLength(7)
    expect(html).toContain('aria-level="3"')
    expect(html).toContain('aria-setsize="3"')
    expect(html).toContain('aria-expanded="true"')
    // One node in the tab order.
    expect(html.match(/tabindex="0"/g)).toHaveLength(1)
    expect(html).toContain('>Vacant<')
    expect(html).toContain('border-dashed')
    expect(html).toContain('>60%<')
    expect(html).toContain('2 people')
    expect(html).toContain('On leave')
    expect(html).toContain('Find a person or unit')
    expect(html).toContain('Fit to width')
  })

  it('opens only the first levels, a closed node showing how many stand under it', () => {
    const html = render(
      <HierarchyChart
        label="Organisation"
        nodes={NODES}
        layout="desktop"
        defaultExpandedDepth={2}
      />,
    )
    expect(html).not.toContain('Cica Accountant')
    expect(html).toContain('Show the 1 under Bora Finance')
    expect(html).toContain('>+1<')
  })

  it('stacks leaves as one list', () => {
    const stacked = render(<HierarchyChart label="Org" nodes={NODES} layout="desktop" />)
    expect(stacked.match(/role="group"/g)?.length).toBeGreaterThan(0)
    expect(stacked).toContain('overflow-hidden rounded-md border')
    const spread = render(
      <HierarchyChart label="Org" nodes={NODES} layout="desktop" stackFrom={10} />,
    )
    expect(spread).not.toContain('overflow-hidden rounded-md border')
  })

  it('reveals and chooses what the search found at first', () => {
    const html = render(
      <HierarchyChart
        label="Org"
        nodes={NODES}
        layout="desktop"
        defaultExpandedDepth={1}
        defaultQuery="accountant"
      />,
    )
    expect(html).toContain('Cica Accountant')
    expect(html).toContain('1 of 1 found')
    expect(html).toContain('data-chosen="true"')
    expect(html).toContain('aria-selected="true"')
  })

  it('shows one unit with its way back up', () => {
    const html = render(
      <HierarchyChart label="Org" nodes={NODES} layout="desktop" defaultUnit="ops" />,
    )
    expect(html).not.toContain('Bora Finance')
    expect(html).toContain('Path to the unit')
    expect(html).toContain('Show the whole chart')
  })

  it('draws an indented list on phones', () => {
    const html = render(<HierarchyChart label="Org" nodes={NODES} layout="phone" />)
    expect(html).toContain('data-slot="tree-view"')
    expect(html).not.toContain('Fit to width')
  })

  it('waits, fails and is empty', () => {
    expect(render(<HierarchyChart label="Org" nodes={[]} loading />)).toContain('aria-busy="true"')
    const error = render(
      <HierarchyChart
        label="Org"
        nodes={NODES}
        error="The chart could not be loaded."
        onRetry={() => undefined}
      />,
    )
    expect(error).toContain('The chart could not be loaded.')
    expect(error).toContain('Try again')
    expect(render(<HierarchyChart label="Org" nodes={[]} empty="No people yet." />)).toContain(
      'No people yet.',
    )
  })

  it('leaves the toolbar out for print', () => {
    const html = render(
      <HierarchyChart label="Org" nodes={NODES} layout="desktop" toolbar={false} />,
    )
    expect(html).not.toContain('Find a person or unit')
  })
})
