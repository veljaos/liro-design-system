import type { Meta, StoryObj } from '@storybook/react-vite'
import { useCallback, useMemo, useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { useLiro } from '../provider/liro-provider'
import {
  matchesChoice,
  pageOf,
  searchCustomers,
  sortRows,
  storyCustomers,
  type SortKey,
  type StoryCustomer,
} from './catalog-story-data'
import type { DataTableColumn } from './data-table'
import type { DataTableFilters, DataTableSort } from './data-table-logic'
import { MoneyText } from './display-text'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import type { FilterDefinition } from './filter-logic'
import { LookupDialog } from './lookup-dialog'
import { StatusBadge } from './status-badge'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const ALL = storyCustomers(4993)
const PAGE = 25

// A catalogue sorts by every column and filters by several values (P5.23).
const COLUMNS: DataTableColumn<StoryCustomer>[] = [
  { id: 'name', header: 'Name', sortable: true, cell: (row) => row.name },
  { id: 'taxId', header: 'Tax number', numeric: true, sortable: true, cell: (row) => row.taxId },
  { id: 'city', header: 'City', sortable: true, cell: (row) => row.city },
  {
    id: 'balance',
    header: 'Open balance',
    align: 'end',
    numeric: true,
    sortable: true,
    cell: (row) => <MoneyText value={row.balance} currency="RSD" />,
  },
]

const SORT_KEYS: Record<string, SortKey<StoryCustomer>> = {
  name: { kind: 'text', value: (row) => row.name },
  taxId: { kind: 'decimal', value: (row) => row.taxId, places: 0 },
  city: { kind: 'text', value: (row) => row.city },
  balance: { kind: 'decimal', value: (row) => row.balance },
}

const FILTERS: FilterDefinition[] = [
  { id: 'inactive', label: 'Show inactive', type: 'boolean' },
  {
    id: 'city',
    label: 'City',
    type: 'multiSelect',
    options: ['Novi Sad', 'Zrenjanin', 'Niš', 'Subotica'].map((city) => ({
      value: city,
      label: city,
    })),
  },
]

/** The application around the dialog: it searches, filters and pages (keyset, by cursor). */
function Lookup({
  open: startOpen = false,
  initialQuery = '',
  loading = false,
  layout,
  title = 'Customers',
}: {
  open?: boolean
  initialQuery?: string
  loading?: boolean
  layout?: 'desktop' | 'phone'
  title?: string
}) {
  const [open, setOpen] = useState(startOpen)
  const [query, setQuery] = useState(initialQuery)
  const { locale } = useLiro()
  const [filters, setFilters] = useState<DataTableFilters>({})
  const [sort, setSort] = useState<DataTableSort>(null)
  const [cursor, setCursor] = useState(0)
  const [chosen, setChosen] = useState<StoryCustomer | null>(null)
  const matches = useMemo(() => {
    const found = searchCustomers(ALL, query).filter(
      (customer) =>
        (filters.inactive === true || customer.active) &&
        matchesChoice(filters.city, customer.city),
    )
    return sortRows(found, sort, SORT_KEYS, locale)
  }, [query, filters, sort, locale])
  const page = pageOf(matches, cursor, PAGE)
  const onSearch = useCallback((text: string) => {
    setQuery(text)
    setCursor(0)
  }, [])
  return (
    <div className="flex flex-col items-start gap-3">
      <Button
        intent="view"
        emphasis="secondary"
        label="Search all…"
        onClick={() => {
          setOpen(true)
        }}
      />
      <p className="m-0 text-sm text-secondary">
        {chosen === null ? 'No customer chosen.' : `Chosen: ${chosen.name}`}
      </p>
      <LookupDialog
        open={open}
        onOpenChange={setOpen}
        title={title}
        initialQuery={initialQuery}
        onSearch={onSearch}
        searchPlaceholder="Name, tax number or city"
        filters={FILTERS}
        filterValues={filters}
        onFilterValuesChange={(values) => {
          setFilters(values)
          setCursor(0)
        }}
        columns={COLUMNS}
        sort={sort}
        onSortChange={(next) => {
          setSort(next)
          setCursor(0)
        }}
        rows={loading ? [] : page.rows}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.name}
        onChoose={setChosen}
        hasNext={page.hasNext}
        onNext={() => {
          setCursor(cursor + PAGE)
        }}
        hasPrevious={page.hasPrevious}
        onPrevious={() => {
          setCursor(Math.max(0, cursor - PAGE))
        }}
        count={matches.length}
        loading={loading}
        mobile={{
          subtitle: (row) => `${row.taxId} · ${row.city}`,
          badge: (row) =>
            row.active ? undefined : <StatusBadge label="Inactive" tone="neutral" />,
          details: ['balance'],
        }}
        {...(layout === undefined ? {} : { layout })}
      />
    </div>
  )
}

const meta = {
  title: 'Components/Catalogs/LookupDialog',
  component: LookupDialog,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** "Search all…" — the whole catalogue (tens of thousands of customers, ' +
          'items, accounts) in a large dialog: the search and filters (FilterBar), the ' +
          'application’s columns (DataTable), keyset paging (Next / Previous with the ' +
          'application’s cursor; the count from the server) and keyboard selection. Choosing a ' +
          'result calls `onChoose` and closes the dialog.\n\n' +
          '**Keyboard:** the search field has the focus when it opens; ArrowDown goes to the ' +
          'first result, ArrowDown / ArrowUp move (ArrowUp from the first returns to the search), ' +
          'PageDown / PageUp by ten, Home / End; Enter or Space chooses; typing on a result goes ' +
          'back to the search with the character.\n\n' +
          '**When:** opened from a LookupField’s last entry ("Search all…") or a "Search all…" ' +
          'button beside a field, when the few results under the field are not enough — ' +
          'filters, more columns, paging.\n\n' +
          '**When not:** choosing from a few dozen options (ComboboxField); the catalogue as a ' +
          'page of its own, to work on records (ListPage). On phones it is a full-screen sheet ' +
          'with the results as a flat list.',
      },
    },
  },
  args: {
    open: true,
    onOpenChange: () => undefined,
    title: 'Customers',
    onSearch: () => undefined,
    columns: [],
    rows: [],
    getRowId: () => '',
    getRowLabel: () => '',
    onChoose: () => undefined,
    hasNext: false,
    onNext: () => undefined,
  },
  render: () => (
    <ExampleProvider>
      <Lookup />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof LookupDialog>

export default meta

type Story = StoryObj<typeof meta>

/**
 * Opened from "Search all…": the search has the focus; ArrowDown goes into the results, Enter
 * chooses one and the dialog closes.
 */
export const Default: Story = {
  play: async () => {
    await settle()
  },
}

export const DefaultInteraction: Story = {
  name: 'Default, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Search all…' }))
    const dialog = within(await body.findByRole('dialog', { name: 'Customers' }))
    const search = dialog.getByRole('textbox', { name: 'Name, tax number or city' })
    await waitFor(() => expect(search).toHaveFocus())
    await userEvent.keyboard('{ArrowDown}')
    await expect(dialog.getByRole('row', { name: /Panonija Agro/ })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(dialog.getByRole('row', { name: /Drina Prevoz/ })).toHaveFocus()
    await userEvent.keyboard('{ArrowUp}{ArrowUp}')
    await expect(search).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}{End}')
    await expect(dialog.getAllByRole('row').at(-1)).toHaveFocus()
    await userEvent.keyboard('{Home}{ArrowDown}{Enter}')
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await expect(canvas.getByText('Chosen: Drina Prevoz d.o.o.')).toBeVisible()
  },
}

/** Opened with what was typed in the field ("novi sad"): the results already narrowed. */
export const InitialQuery: Story = {
  name: 'Initial query',
  render: () => (
    <ExampleProvider>
      <Lookup open initialQuery="novi sad" />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: 'Customers' }),
    )
    await expect(dialog.getByRole('textbox', { name: 'Name, tax number or city' })).toHaveValue(
      'novi sad',
    )
    await expect(dialog.getByRole('row', { name: /Stanić Elektro STR/ })).toBeVisible()
  },
}

/**
 * A catalogue sorts by its columns (the application sorts its search, P5.23): Open balance
 * descending puts the largest balance first.
 */
export const Sorted: Story = {
  name: 'Sorted by a column',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Lookup open />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: 'Customers' }),
    )
    await userEvent.click(dialog.getByRole('button', { name: 'Open balance' }))
    await userEvent.click(dialog.getByRole('button', { name: 'Open balance' }))
    await waitFor(() =>
      expect(dialog.getByRole('columnheader', { name: 'Open balance' })).toHaveAttribute(
        'aria-sort',
        'descending',
      ),
    )
  },
}

/** Keyset paging: Next asks the application for the page after its cursor. */
export const Paging: Story = {
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Lookup open />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: 'Customers' }),
    )
    await expect(dialog.getByRole('row', { name: /Panonija Agro/ })).toBeVisible()
    await userEvent.click(dialog.getByRole('button', { name: 'Next' }))
    await expect(dialog.queryByRole('row', { name: /Panonija Agro/ })).toBeNull()
    await expect(dialog.getByRole('button', { name: 'Previous' })).toBeEnabled()
    await settle()
  },
}

/** Typing on a result goes back to the search field with the typed character. */
export const TypingFromResults: Story = {
  name: 'Typing from the results',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Lookup open />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: 'Customers' }),
    )
    const search = dialog.getByRole('textbox', { name: 'Name, tax number or city' })
    await waitFor(() => expect(search).toHaveFocus())
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    await expect(dialog.getByRole('row', { name: /Drina Prevoz/ })).toHaveFocus()
    await userEvent.keyboard('m')
    await expect(search).toHaveFocus()
  },
}

/** Nothing found: "No rows match" with "Clear filters", which empties the search. */
export const NothingFound: Story = {
  name: 'Nothing found',
  render: () => (
    <ExampleProvider>
      <Lookup open initialQuery="Beogradska banka" />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: 'Customers' }),
    )
    await expect(dialog.getByText('No rows match')).toBeVisible()
    await settle()
  },
}

export const NothingFoundInteraction: Story = {
  name: 'Nothing found, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Lookup open initialQuery="Beogradska banka" />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = within(
      await within(canvasElement.ownerDocument.body).findByRole('dialog', { name: 'Customers' }),
    )
    await expect(dialog.getByText('No rows match')).toBeVisible()
    await userEvent.click(dialog.getByRole('button', { name: 'Clear filters' }))
    await expect(dialog.getByRole('textbox', { name: 'Name, tax number or city' })).toHaveValue('')
    await expect(await dialog.findByRole('row', { name: /Panonija Agro/ })).toBeVisible()
    await settle()
  },
}

/** The first load: skeleton rows under the header, the search already usable. */
export const Loading: Story = {
  render: () => (
    <ExampleProvider>
      <Lookup open loading />
    </ExampleProvider>
  ),
}

/** A long catalogue name and long search text wrap; nothing overflows. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <Lookup open title={LONG.label} initialQuery={LONG.value} />
    </ExampleProvider>
  ),
}

/** Phone width: a full-screen sheet, the results as a flat list; the keys work the same. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <Lookup open layout="phone" />
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = await within(canvasElement.ownerDocument.body).findByRole('dialog', {
      name: 'Customers',
    })
    // The sheet covers the frame and nothing scrolls sideways.
    await expect(dialog.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth)
    await settle()
  },
}

export const PhoneWidthInteraction: Story = {
  name: 'Phone width, interaction',
  tags: ['interaction'],
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <Lookup open layout="phone" />
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = await within(canvasElement.ownerDocument.body).findByRole('dialog', {
      name: 'Customers',
    })
    // The sheet covers the frame and nothing scrolls sideways.
    await expect(dialog.scrollWidth).toBeLessThanOrEqual(dialog.clientWidth)
    await userEvent.keyboard('{ArrowDown}')
    await expect(within(dialog).getAllByRole('listitem')[0]?.firstElementChild).toHaveFocus()
  },
}

/** Arabic sample text, right to left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <Lookup open title={ARABIC.label} />
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <Lookup open title={JAPANESE.label} />
    </StoryProvider>
  ),
}
