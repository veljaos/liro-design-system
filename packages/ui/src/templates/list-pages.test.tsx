import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { rowKeyAction } from '../components/data-table-logic'
import { LiroProvider } from '../provider/liro-provider'
import { ListPage, splitViews } from './list-page'
import { PageHeader } from './page-header'
import {
  nextWorklistItem,
  WORKLIST_WINDOW_FROM,
  WorklistPage,
  WorklistSummary,
  worklistKeyTarget,
  worklistPosition,
} from './worklist-page'

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
  it('worklistKeyTarget: ArrowDown / ArrowUp by one, stopping at the ends; Home, End', () => {
    expect(worklistKeyTarget('ArrowDown', 0, 3)).toBe(1)
    expect(worklistKeyTarget('ArrowDown', 2, 3)).toBe(2)
    expect(worklistKeyTarget('ArrowUp', 1, 3)).toBe(0)
    expect(worklistKeyTarget('ArrowUp', 0, 3)).toBe(0)
    expect(worklistKeyTarget('Home', 2, 3)).toBe(0)
    expect(worklistKeyTarget('End', 0, 1200)).toBe(1199)
    expect(worklistKeyTarget('Enter', 0, 3)).toBeNull()
    expect(worklistKeyTarget('ArrowDown', 0, 0)).toBeNull()
    // A place outside the queue (the row just left it) starts from its nearest end.
    expect(worklistKeyTarget('ArrowDown', 7, 3)).toBe(2)
  })
  it('nextWorklistItem: the next item that waits, after the decided one, wrapping around', () => {
    const queue = [
      { id: 'a', waits: true },
      { id: 'b', waits: false },
      { id: 'c', waits: true },
      { id: 'd', waits: false },
    ]
    const waits = (item: { waits: boolean }) => item.waits
    expect(nextWorklistItem(queue, 'a', waits)?.id).toBe('c')
    expect(nextWorklistItem(queue, 'c', waits)?.id).toBe('a')
    expect(nextWorklistItem(queue, 'b', waits)?.id).toBe('c')
    // The decided item itself is never the answer, even when it still waits.
    expect(nextWorklistItem([{ id: 'a', waits: true }], 'a', waits)).toBeNull()
    // An item no longer in the queue: from the start.
    expect(nextWorklistItem(queue, 'gone', waits)?.id).toBe('a')
    expect(nextWorklistItem(queue, undefined, waits)?.id).toBe('a')
    expect(nextWorklistItem(queue, 'a', () => false)).toBeNull()
  })
  it('the queue is one tab stop: the chosen row, else the first; each row tells its place', () => {
    const chosen = render(
      <WorklistPage layout="split" title="T" label="T" items={ITEMS} selected="b" />,
    )
    expect(chosen.match(/tabindex="0"/g)).toHaveLength(1)
    expect(chosen).toMatch(/data-worklist-row="b"[^>]*>(?:(?!data-worklist-row).)*tabindex="0"/)
    expect(chosen).toContain('aria-posinset="2"')
    expect(chosen).toContain('aria-setsize="2"')
    const none = render(<WorklistPage layout="split" title="T" label="T" items={ITEMS} />)
    expect(none).toMatch(/data-worklist-row="a"[^>]*>(?:(?!data-worklist-row).)*tabindex="0"/)
  })
  it('the queue’s tools: search, the filter chips with counts (one pressed), the toolbar', () => {
    const html = render(
      <WorklistPage
        layout="split"
        title="T"
        label="Lines"
        items={ITEMS}
        toolbar={<button type="button">ACCEPT ALL</button>}
        search="drina"
        onSearchChange={() => undefined}
        searchLabel="Name or amount"
        filters={[
          { value: 'needs', label: 'Needs you', count: 3 },
          { value: 'done', label: 'Done', count: 1250 },
        ]}
        filter="needs"
        onFilterChange={() => undefined}
      />,
    )
    expect(html).toContain('ACCEPT ALL')
    expect(html).toContain('aria-label="Name or amount"')
    expect(html).toContain('value="drina"')
    expect(html).toContain('aria-label="Clear search"')
    expect(html).toContain('role="group" aria-label="Show"')
    expect(html).toMatch(/aria-pressed="true" data-worklist-filter="needs"/)
    expect(html).toMatch(/aria-pressed="false" data-worklist-filter="done"/)
    expect(html).toContain('1.250')
    // The tools stand above the rows, outside their scroll.
    expect(html.indexOf('data-slot="worklist-tools"')).toBeLessThan(
      html.indexOf('data-slot="worklist-scroller"'),
    )
    const plain = render(<WorklistPage layout="split" title="T" label="T" items={ITEMS} />)
    expect(plain).not.toContain('data-slot="worklist-tools"')
  })
  it(`draws only the rows in view from ${String(WORKLIST_WINDOW_FROM)} items`, () => {
    const many = Array.from({ length: 1240 }, (_, index) => ({
      id: `i${String(index)}`,
      title: `Item ${String(index)}`,
    }))
    const html = render(<WorklistPage layout="split" title="T" label="T" items={many} />)
    const drawn = html.match(/data-worklist-row="/g) ?? []
    expect(drawn.length).toBeGreaterThan(0)
    expect(drawn.length).toBeLessThan(60)
    expect(html).toContain('aria-setsize="1240"')
    const few = render(
      <WorklistPage
        layout="split"
        title="T"
        label="T"
        items={many.slice(0, WORKLIST_WINDOW_FROM - 1)}
      />,
    )
    expect(few.match(/data-worklist-row="/g)).toHaveLength(WORKLIST_WINDOW_FROM - 1)
  })
  it('WorklistSummary: the figures, "3 of 1.240 done" through format and messages, the action', () => {
    const html = render(
      <WorklistSummary
        layout="desktop"
        facts={[{ key: 'opening', label: 'Opening balance', value: '5.284.550,17' }]}
        done={3}
        total={1240}
        note={<span>CHECKS OUT</span>}
        action={<button type="button">POST</button>}
      />,
    )
    expect(html).toContain('Opening balance')
    expect(html).toContain('5.284.550,17')
    expect(html).toContain('3 of 1.240 done')
    expect(html).toContain('aria-label="3 of 1.240 done"')
    expect(html).toContain('CHECKS OUT')
    expect(html).toContain('POST')
    const waiting = render(<WorklistSummary layout="phone" facts={[]} done={0} total={0} />)
    expect(waiting).toContain('0 of 0 done')
    expect(waiting).not.toContain('POST')
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
