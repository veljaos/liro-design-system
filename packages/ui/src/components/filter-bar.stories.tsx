import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ComponentProps } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { Card } from './cards'
import type { DataTableFilters, DataTableSort } from './data-table-logic'
import { FilterBar } from './filter-bar'
import type { FilterDefinition } from './filter-logic'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Table/FilterBar',
  component: FilterBar,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the search and filters above a list. Search at the start, filters ' +
          'beside it, actions at the end (Appendix B.8). The first `inline` filters stand in the ' +
          'row on desktop, each labelled above; the rest are in a drawer opened by "Filters". ' +
          'Active filters that are not inline show as removable pills, with "Clear all". On ' +
          'phones every filter is in the drawer, and a "Sort" button replaces the column ' +
          'headers. Kinds: select, multiSelect, dateRange, numberRange (decimal strings), ' +
          'boolean (yes / no) and text. **Controlled:** the bar reports the search (after a ' +
          '300ms pause), the values and the sort; the application filters and sorts on the ' +
          'server.\n\n**When not:** a form (fields in FormSection, P3.5); a search across the ' +
          'whole application (CommandPalette).',
      },
    },
  },
  args: { filters: [], values: {}, onValuesChange: () => undefined },
  play: settle,
} satisfies Meta<typeof FilterBar>

export default meta

type Story = StoryObj<typeof meta>

const FILTERS: FilterDefinition[] = [
  {
    id: 'status',
    label: 'Status',
    type: 'select',
    options: [
      { value: 'draft', label: 'Draft' },
      { value: 'sent', label: 'Sent' },
      { value: 'paid', label: 'Paid' },
    ],
  },
  {
    id: 'customer',
    label: 'Customer',
    type: 'multiSelect',
    options: [
      { value: 'alfa', label: 'Alfa Trade' },
      { value: 'beta', label: 'Beta Logistics' },
      { value: 'gama', label: 'Gama Print' },
    ],
  },
  { id: 'issued', label: 'Issue date', type: 'dateRange' },
  { id: 'total', label: 'Total', type: 'numberRange', decimals: 2, currency: 'EUR' },
  { id: 'paid', label: 'Paid', type: 'boolean' },
  { id: 'reference', label: 'Reference', type: 'text' },
]

const SORT_COLUMNS = [
  { id: 'issued', label: 'Date' },
  { id: 'customer', label: 'Customer' },
  { id: 'total', label: 'Total' },
]

/** A FilterBar that keeps its own state, as an application would. */
function Controlled(
  props: Partial<ComponentProps<typeof FilterBar>> & { initial?: DataTableFilters },
) {
  const [values, setValues] = useState<DataTableFilters>(props.initial ?? {})
  const [search, setSearch] = useState(props.search ?? '')
  const [sort, setSort] = useState<DataTableSort>(
    props.sort ?? { column: 'issued', direction: 'desc' },
  )
  return (
    <FilterBar
      filters={FILTERS}
      sortColumns={SORT_COLUMNS}
      {...props}
      values={values}
      onValuesChange={setValues}
      search={search}
      onSearchChange={setSearch}
      sort={sort}
      onSortChange={setSort}
    />
  )
}

const ACTIONS = (
  <>
    <Button intent="export" label="Export" />
    <Button intent="create" label="New invoice" />
  </>
)

/**
 * Inline choices stay one control high (P3.6): two customers read "2 selected" on one line (the
 * pills are edited in the list or in the drawer), and the amount range has "From" and "To" money
 * fields.
 */
export const InlineChoices: Story = {
  render: () => (
    <Controlled
      inline={4}
      layout="desktop"
      initial={{ customer: ['alfa', 'beta'], total: { min: '100', max: null } }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('2 selected')).toBeVisible()
    const frame = canvasElement.querySelector('[data-slot="multi-select"]')
    await expect(frame?.getBoundingClientRect().height).toBe(36)
    await expect(canvas.getByRole('textbox', { name: 'From EUR' })).toBeVisible()
    await expect(canvas.getByRole('textbox', { name: 'To EUR' })).toBeVisible()
    await settle()
  },
}

/**
 * Actions that do not fit beside search and filters move to their own line ABOVE them, at the
 * end (P3.6) — never wrapped under the filters.
 */
export const ActionsAbove: Story = {
  render: () => (
    <div className="max-w-180">
      <Controlled inline={2} actions={ACTIONS} layout="desktop" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const action = canvas.getByRole('button', { name: 'New invoice' }).getBoundingClientRect()
    const search = canvas.getByRole('textbox', { name: 'Search…' }).getBoundingClientRect()
    await expect(action.bottom).toBeLessThanOrEqual(search.top)
    await settle()
  },
}

/** Desktop: search, two inline filters, "Filters" for the rest, actions at the end. */
export const Default: Story = {
  render: () => <Controlled inline={2} actions={ACTIONS} layout="desktop" />,
}

/** Active filters: inline ones show in their controls, the others as pills with "Clear all". */
export const ActiveFilters: Story = {
  render: () => (
    <Controlled
      inline={2}
      layout="desktop"
      search="F-2026"
      initial={{
        status: 'sent',
        customer: ['alfa'],
        issued: { start: '2026-09-01', end: '2026-09-30' },
        total: { min: '1000', max: null },
        paid: false,
        reference: 'PO-77',
      }}
    />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Total: 1,000.00 –')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Remove filter: Paid' }))
    await waitFor(() => expect(canvas.queryByText('Paid: No')).toBeNull())
    // An inline select is emptied in place by its clear button.
    await userEvent.click(canvas.getByRole('button', { name: 'Clear' }))
    await waitFor(() => expect(canvas.queryByRole('button', { name: 'Clear' })).toBeNull())
    await settle()
  },
}

/** "Clear all" clears the bar's filters, not the search. */
export const ClearAll: Story = {
  render: () => (
    <Controlled layout="desktop" search="F-2026" initial={{ status: 'paid', paid: true }} />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Clear all' }))
    await waitFor(() => expect(canvas.queryByRole('button', { name: 'Clear all' })).toBeNull())
    await expect(canvas.getByRole('textbox', { name: 'Search…' })).toHaveValue('F-2026')
    await settle()
  },
}

/** The drawer from the end side: every filter that is not inline, stacked. */
export const DrawerOpen: Story = {
  name: 'Filters drawer',
  render: () => (
    <Controlled inline={1} layout="desktop" initial={{ total: { min: '10', max: '500' } }} />
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Filters' }))
    const drawer = await body.findByRole('dialog', { name: 'Filters' })
    await settle()
    await waitFor(() => expect(within(drawer).getByRole('group', { name: 'Total' })).toBeVisible())
  },
}

/** Search: the clear button appears with text and empties it at once. */
export const Search: Story = {
  render: () => <Controlled layout="desktop" filters={[]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const search = canvas.getByRole('textbox', { name: 'Search…' })
    await userEvent.type(search, 'Alfa')
    const clear = canvas.getByRole('button', { name: 'Clear search' })
    await userEvent.click(clear)
    await expect(search).toHaveValue('')
    await expect(search).toHaveFocus()
    await userEvent.type(search, 'Beta')
    await settle()
  },
}

/** Inside a card: the bar takes the card's padding (16px, 8px at the bottom). */
export const InCard: Story = {
  render: () => (
    <Card className="max-w-240 p-0">
      <Controlled inline={2} actions={ACTIONS} layout="desktop" inCard />
      <div className="border-0 border-t border-solid border-default px-4 py-3 text-sm">
        The table starts here.
      </div>
    </Card>
  ),
}

/** Phone: search full width; every filter in the drawer; "Sort" shows the current sort. */
export const Phone: Story = {
  name: 'Phone width',
  render: () => (
    <div className="w-[390px] max-w-full">
      <Controlled inline={2} layout="phone" initial={{ status: 'sent' }} />
    </div>
  ),
}

/** The phone's sort menu: the sortable columns, then the two directions, with check marks. */
export const PhoneSort: Story = {
  name: 'Phone sort menu',
  render: () => (
    <div className="w-[390px] max-w-full">
      <Controlled layout="phone" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Sort: Date ↓' }))
    const menu = await body.findByRole('menu')
    await userEvent.click(within(menu).getByRole('menuitemradio', { name: 'Total' }))
    await waitFor(() =>
      expect(within(canvasElement).getByRole('button', { name: 'Sort: Total ↓' })).toBeVisible(),
    )
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Sort: Total ↓' }))
    await body.findByRole('menu')
    await settle()
  },
}

/** The drawer at phone width (a 390px frame): full width. */
export const PhoneDrawer: Story = {
  name: 'Phone drawer',
  render: () => (
    <PhoneFrame>
      <Controlled layout="phone" initial={{ customer: ['alfa', 'beta'] }} />
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Filters' }))
    await body.findByRole('dialog', { name: 'Filters' })
    await settle()
  },
}

/** Long labels and values at phone width: pills and buttons wrap. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="w-[390px] max-w-full">
      <Controlled
        layout="phone"
        filters={[
          {
            id: 'long',
            label: LONG.label,
            type: 'select',
            options: [{ value: 'x', label: LONG.value }],
          },
        ]}
        sortColumns={[{ id: 'long', label: LONG.label }]}
        sort={{ column: 'long', direction: 'asc' }}
        initial={{ long: 'x' }}
      />
    </div>
  ),
}

/** Arabic sample text, right to left: search at the start (right), actions at the end (left). */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <Controlled
        layout="desktop"
        inline={1}
        actions={<Button intent="create" label={ARABIC.reason} />}
        filters={[
          {
            id: 'a',
            label: ARABIC.label,
            type: 'select',
            options: ARABIC.options.map((label, index) => ({ value: String(index), label })),
          },
          { id: 'b', label: ARABIC.options[0] ?? '', type: 'text' },
        ]}
        initial={{ b: ARABIC.value }}
      />
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <Controlled
        layout="desktop"
        inline={1}
        filters={[
          {
            id: 'a',
            label: JAPANESE.label,
            type: 'select',
            options: JAPANESE.options.map((label, index) => ({ value: String(index), label })),
          },
          { id: 'b', label: JAPANESE.options[0] ?? '', type: 'text' },
        ]}
        initial={{ b: JAPANESE.value }}
      />
    </StoryProvider>
  ),
}
