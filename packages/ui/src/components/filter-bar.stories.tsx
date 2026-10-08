import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileSpreadsheet } from 'lucide-react'
import { useState, type ComponentProps } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { Card } from './cards'
import type { DataTableFilters, DataTableSort } from './data-table-logic'
import { FilterBar } from './filter-bar'
import type { FilterDefinition } from './filter-logic'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { useLiro } from '../provider/liro-provider'
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

/** The list's actions as menu entries for phones (P4.9). */
const PHONE_MENU = [{ label: 'Export', icon: FileSpreadsheet, onSelect: () => undefined }]

const ACTIONS = (
  <>
    <Button intent="export" label="Export" />
    <Button intent="create" label="New invoice" />
  </>
)

/**
 * Inline choices stay one control high (P3.6): two customers read "2 selected" on one line (the
 * pills are edited in the list or in the drawer); the amount range has one label over two money
 * fields with "From" and "To" inside them (P3.6c), and the empty date range reads "From – To".
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
    // One label over the pair; "From" and "To" inside the fields, which are named by the label.
    const from = canvas.getByRole('textbox', { name: 'Total from (EUR)' })
    await expect(from).toBeVisible()
    await expect(canvas.getByRole('textbox', { name: 'Total to (EUR)' })).toBeVisible()
    // The currency once, in the label; the names are for screen readers only.
    await expect(canvas.getByRole('group', { name: 'Total (EUR)' })).toBeVisible()
    await expect(canvas.getByText('Total from (EUR)')).toHaveClass('sr-only')
    await expect(from).toHaveValue('100.00')
    // Every control's top edge on one line: the pair stands under its label as the others do.
    const select = canvas.getByRole('combobox', { name: 'Status' })
    const box = from.closest('[data-slot="money"]') ?? from
    await expect(box.getBoundingClientRect().top).toBeCloseTo(select.getBoundingClientRect().top, 0)
    // The empty date range: "From – To", faint placeholders, no lone dash.
    await expect(canvas.getByRole('textbox', { name: 'Issue date Start' })).toHaveAttribute(
      'placeholder',
      'From',
    )
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
    await expect(canvas.getByText(/^Total: EUR\s1,000\.00 –$/)).toBeVisible()
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
    await waitFor(() =>
      expect(within(drawer).getByRole('group', { name: 'Total (EUR)' })).toBeVisible(),
    )
  },
}

/** Every typing area of the amount range shows all of its text: none is cut. */
async function expectWholeAmounts(scope: HTMLElement) {
  const group = within(scope).getByRole('group', { name: 'Total (EUR)' })
  const fields = within(group).getAllByRole('textbox')
  await expect(fields.map((field) => (field as HTMLInputElement).value)).toEqual([
    '1.234.567,89',
    '9.876.543,21',
  ])
  for (const field of fields) {
    await expect(field.scrollWidth).toBeLessThanOrEqual(field.clientWidth)
  }
}

/** A long amount in the screen's own number format ("1.234.567,89"). */
function LongAmount(props: { inline: number }) {
  const { direction } = useLiro()
  return (
    <StoryProvider locale="sr-Latn-RS" direction={direction}>
      <Controlled
        inline={props.inline}
        layout="desktop"
        initial={{ total: { min: '1234567.89', max: '9876543.21' } }}
      />
    </StoryProvider>
  )
}

/**
 * A long amount fits (P3.6d): each field grows with its number instead of cutting it, and the
 * pair wraps when it does not fit in the row.
 */
export const LongAmountInline: Story = {
  name: 'Long amount',
  render: () => <LongAmount inline={4} />,
  play: async ({ canvasElement }) => {
    await expectWholeAmounts(canvasElement)
    await settle()
  },
}

/** The same long amount in the Filters drawer, 320px wide: the pair wraps, nothing is cut. */
export const LongAmountDrawer: Story = {
  name: 'Long amount in the drawer',
  render: () => <LongAmount inline={1} />,
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Filters' }))
    const drawer = await body.findByRole('dialog', { name: 'Filters' })
    await settle()
    await expectWholeAmounts(drawer)
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

/**
 * Phone: search first, full width; every filter in the drawer; "Sort" shows the current sort; the
 * list's actions in one "⋯" menu (`phoneMenu`) instead of the desktop row (P4.9).
 */
export const Phone: Story = {
  name: 'Phone width',
  render: () => (
    <div className="w-[390px] max-w-full">
      <Controlled
        inline={2}
        layout="phone"
        initial={{ status: 'sent' }}
        actions={ACTIONS}
        phoneMenu={PHONE_MENU}
      />
    </div>
  ),
}

/** The phone's "⋯" menu with the list's actions (Export). */
export const PhoneActions: Story = {
  name: 'Phone actions menu',
  render: () => (
    <div className="w-[390px] max-w-full">
      <Controlled layout="phone" actions={ACTIONS} phoneMenu={PHONE_MENU} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await expect(within(canvasElement).queryByRole('button', { name: 'Export' })).toBeNull()
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'More actions' }))
    const menu = await body.findByRole('menu')
    await settle()
    await waitFor(() =>
      expect(within(menu).getByRole('menuitem', { name: 'Export' })).toBeVisible(),
    )
  },
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
