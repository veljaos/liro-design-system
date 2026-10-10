import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { rowKeyAction } from '../components/data-table-logic'
import { LiroProvider } from '../provider/liro-provider'
import { ListPage, splitViews } from './list-page'
import { PageHeader } from './page-header'
import { WorklistPage, worklistPosition } from './worklist-page'

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

describe('saved views (P4.9)', () => {
  const VIEWS = ['all', 'unpaid', 'overdue', 'mine', 'drafts', 'sent', 'archived'].map((id) => ({
    id,
    label: id,
  }))

  it('shows the first views as tabs and the rest under "More", never a menu of one', () => {
    expect(splitViews(VIEWS, 5).tabs.map((view) => view.id)).toEqual([
      'all',
      'unpaid',
      'overdue',
      'mine',
      'drafts',
    ])
    expect(splitViews(VIEWS, 5).more).toHaveLength(2)
    expect(splitViews(VIEWS.slice(0, 6), 5).more).toHaveLength(0)
  })

  it('desktop: a "More" button that names the current view when it is under it', () => {
    const html = render(
      <ListPage layout="desktop" title="Invoices" views={VIEWS} view="archived" visibleViews={3}>
        <table />
      </ListPage>,
    )
    expect(html).toMatch(/aria-pressed="true"[^>]*>.*archived/)
    expect(html).not.toContain('>More<')
  })

  it('phone: one select with the current view and its count through format', () => {
    const html = render(
      <ListPage
        layout="phone"
        title="Invoices"
        views={[
          { id: 'all', label: 'All', count: 1284 },
          { id: 'mine', label: 'Mine' },
        ]}
        view="all"
      >
        <table />
      </ListPage>,
    )
    expect(html).toContain('View: All')
    expect(html).toContain('1.284')
    expect(html).not.toContain('aria-pressed')
  })
})

const ITEMS = [
  { id: 'a', title: 'EPS Snabdevanje d.o.o.', subtitle: 'UF-2026-1187', figure: '48.216,90' },
  { id: 'b', title: 'Telekom Srbija a.d.' },
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
  it('marks the chosen row as a selected surface', () => {
    const split = render(
      <WorklistPage
        layout="split"
        title="T"
        label="T"
        items={ITEMS}
        selected="a"
        detail={<p>D</p>}
      />,
    )
    expect(split).toContain('data-liro-surface="selected"')
  })
  it('checkboxes and the bulk bar: the bar only while a row is checked', () => {
    const none = render(
      <WorklistPage
        layout="split"
        title="T"
        label="T"
        items={ITEMS}
        checked={[]}
        onCheckedChange={() => undefined}
        bulkBar={<p>BULK</p>}
      />,
    )
    expect(none).toContain('aria-label="Select EPS Snabdevanje d.o.o."')
    expect(none).not.toContain('BULK')
    const one = render(
      <WorklistPage
        layout="split"
        title="T"
        label="T"
        items={[{ id: 'a', title: 'EPS Snabdevanje d.o.o.', label: 'UF-2026-1187' }]}
        checked={['a']}
        onCheckedChange={() => undefined}
        bulkBar={<p>BULK</p>}
      />,
    )
    expect(one).toContain('BULK')
    expect(one).toContain('aria-label="Select UF-2026-1187"')
  })
  it('worklistPosition: the chosen item’s place, or null', () => {
    expect(worklistPosition(ITEMS, 'b')).toEqual({ index: 2, total: 2 })
    expect(worklistPosition(ITEMS, undefined)).toBeNull()
    expect(worklistPosition(ITEMS, 'gone')).toBeNull()
  })
  it('split: one bar under the detail — position, Previous, Next, then the decisions', () => {
    const html = render(
      <WorklistPage
        layout="split"
        title="Statement 188"
        back={{ href: '#s', label: 'Statements' }}
        status={<span>STATUS</span>}
        subtitle="SUBTITLE"
        summary={<p>SUMMARY</p>}
        label="Lines"
        items={[...ITEMS, { id: 'c', title: 'Third' }]}
        selected="b"
        detail={<p>DETAIL</p>}
        detailActions={<button type="button">CONFIRM</button>}
        onPrevious={() => undefined}
        onNext={() => undefined}
      />,
    )
    expect(html).toContain('Back to Statements')
    expect(html).toContain('STATUS')
    expect(html).toContain('SUBTITLE')
    expect(html.indexOf('SUMMARY')).toBeLessThan(html.indexOf('aria-label="Lines"'))
    const bar = html.slice(html.indexOf('data-slot="worklist-detail-bar"'))
    expect(bar).toContain('2 of 3')
    expect(bar.indexOf('Previous item')).toBeLessThan(bar.indexOf('Next item'))
    expect(bar.indexOf('Next item')).toBeLessThan(bar.indexOf('CONFIRM'))
  })
  it('stacked: the item full screen with the position, and its decisions left to the shell', () => {
    const html = render(
      <WorklistPage
        layout="stacked"
        title="T"
        label="T"
        items={ITEMS}
        selected="a"
        summary={<p>SUMMARY</p>}
        detail={<p>DETAIL</p>}
        detailActions={<button type="button">CONFIRM</button>}
        onBack={() => undefined}
        onPrevious={() => undefined}
        onNext={() => undefined}
      />,
    )
    expect(html).toContain('1 of 2')
    expect(html).toContain('aria-label="Previous item"')
    expect(html).toContain('aria-label="Next item"')
    expect(html).not.toContain('CONFIRM')
    expect(html).not.toContain('SUMMARY')
    const list = render(
      <WorklistPage layout="stacked" title="T" label="T" items={ITEMS} summary={<p>SUMMARY</p>} />,
    )
    expect(list).toContain('SUMMARY')
  })
  it('writes the position through the provider’s format and messages', () => {
    const many = Array.from({ length: 1200 }, (_, index) => ({
      id: String(index),
      title: `Item ${String(index)}`,
    }))
    const html = renderToStaticMarkup(
      <LiroProvider
        locale="sr-Latn-RS"
        messages={{ 'worklist.position': (_i, index, _t, total) => `${index} od ${total}` }}
      >
        <WorklistPage
          layout="split"
          title="T"
          label="T"
          items={many}
          selected="1099"
          detail={<p>D</p>}
        />
      </LiroProvider>,
    )
    expect(html).toContain('1.100 od 1.200')
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
