import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { rowKeyAction } from '../components/data-table-logic'
import { LiroProvider } from '../provider/liro-provider'
import { ListPage } from './list-page'
import { PageHeader } from './page-header'
import { WorklistPage } from './worklist-page'

function render(node: React.ReactNode) {
  return renderToStaticMarkup(
    <LiroProvider locale="en" format={{ numberScheme: 'dot-comma' }}>
      {node}
    </LiroProvider>,
  )
}

describe('rowKeyAction', () => {
  it('Space presses (the preview); Enter opens when the table can open, else presses', () => {
    expect(rowKeyAction(' ', true)).toBe('press')
    expect(rowKeyAction(' ', false)).toBe('press')
    expect(rowKeyAction('Enter', true)).toBe('open')
    expect(rowKeyAction('Enter', false)).toBe('press')
    expect(rowKeyAction('a', true)).toBeNull()
  })
})

describe('ListPage', () => {
  it('renders the title, the action, the views with counts, the current one pressed', () => {
    const html = render(
      <ListPage
        layout="desktop"
        title="Invoices"
        actions={<button type="button">New invoice</button>}
        views={[
          { id: 'all', label: 'All', count: 1284 },
          { id: 'mine', label: 'Mine' },
        ]}
        view="all"
        saveView={<button type="button">Save view</button>}
      >
        <table />
      </ListPage>,
    )
    // The module tab names the page: the h1 is for screen readers only (owner, P4.3).
    expect(html).toContain('<h1 class="sr-only">Invoices</h1>')
    expect(html).toContain('New invoice')
    expect(html).toContain('aria-label="Views"')
    expect(html).toMatch(/aria-pressed="true"[^>]*>.*All.*1\.284/)
    expect(html).toMatch(/aria-pressed="false"[^>]*>.*Mine/)
    expect(html).toContain('Save view')
  })
})

const ITEMS = [
  { id: 'a', title: 'EPS Snabdevanje d.o.o.', subtitle: 'UF-2026-1187', figure: '48.216,90' },
  { id: 'b', title: 'Telekom Srbija a.d.', actions: <button type="button">Approve</button> },
]

describe('WorklistPage', () => {
  it('side by side: the list and the detail pane', () => {
    const html = render(
      <WorklistPage
        layout="split"
        title="To approve"
        label="To approve"
        items={ITEMS}
        selected="a"
        detail={<p>DETAIL</p>}
      />,
    )
    expect(html).toContain('grid-cols-[380px_minmax(0,1fr)]')
    expect(html).toContain('DETAIL')
    expect(html).toContain('aria-current="true"')
    expect(html).toContain('Approve')
  })
  it('stacked: the list until an item is chosen, then the detail with Back and Next', () => {
    const list = render(
      <WorklistPage layout="stacked" title="To approve" label="To approve" items={ITEMS} />,
    )
    expect(list).toContain('EPS Snabdevanje')
    const detail = render(
      <WorklistPage
        layout="stacked"
        title="To approve"
        label="To approve"
        items={ITEMS}
        selected="a"
        detail={<p>DETAIL</p>}
        onBack={() => undefined}
        onNext={() => undefined}
      />,
    )
    expect(detail).toContain('DETAIL')
    expect(detail).not.toContain('EPS Snabdevanje')
    expect(detail).toContain('Back to list')
    expect(detail).toContain('Next item')
  })
  it('marks the chosen row as a selected surface, and keeps its inline actions', () => {
    const items = ITEMS.map((item) => ({
      ...item,
      actions: <button type="button">Approve {item.id}</button>,
    }))
    const split = render(
      <WorklistPage
        layout="split"
        title="T"
        label="T"
        items={items}
        selected="a"
        detail={<p>D</p>}
      />,
    )
    expect(split).toContain('data-liro-surface="selected"')
    expect(split).toContain('Approve a')
  })
  it('shows the empty slot when there are no items', () => {
    const html = render(
      <WorklistPage layout="split" title="T" label="T" items={[]} empty={<p>NOTHING</p>} />,
    )
    expect(html).toContain('NOTHING')
  })
})

describe('PageHeader', () => {
  it('shows the title unless titleHidden, and keeps the h1 either way', () => {
    const shown = render(
      <PageHeader title="Ana Jovanović" actions={<button type="button">Edit</button>} />,
    )
    expect(shown).toMatch(/<h1 class="m-0 [^"]*text-h1[^"]*">Ana Jovanović<\/h1>/)
    const hidden = render(<PageHeader title="Invoices" titleHidden />)
    expect(hidden).toContain('<h1 class="sr-only">Invoices</h1>')
    expect(hidden).not.toContain('text-h1')
  })
})
