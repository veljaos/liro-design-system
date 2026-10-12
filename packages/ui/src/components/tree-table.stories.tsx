import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { NumberText } from './display-text'
import { EmptyState } from './empty-state'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'
import type { TreeNode } from './tree-logic'
import {
  ARABIC_ACCOUNTS,
  CHART_OF_ACCOUNTS,
  CHART_TOTALS,
  JAPANESE_ACCOUNTS,
  LOCATIONS,
  LONG_CHART,
  ZONE_B,
  type AccountFigures,
  type LocationFigures,
} from './tree-story-data'
import { TreeTable, type TreeTableColumn } from './tree-table'

/** Debit, credit and balance: the books' figures, written through the provider's format. */
function accountColumns(
  debit: string,
  credit: string,
  balance: string,
): TreeTableColumn<AccountFigures>[] {
  return [
    {
      id: 'debit',
      header: debit,
      numeric: true,
      cell: (node) => <NumberText value={node.data?.debit ?? null} decimals={2} />,
    },
    {
      id: 'credit',
      header: credit,
      numeric: true,
      cell: (node) => <NumberText value={node.data?.credit ?? null} decimals={2} />,
    },
    {
      id: 'balance',
      header: balance,
      numeric: true,
      minWidth: 140,
      cell: (node) => <NumberText value={node.data?.balance ?? null} decimals={2} />,
    },
  ]
}

const ACCOUNT_COLUMNS = accountColumns('Debit', 'Credit', 'Balance')

const ACCOUNT_TOTALS = {
  debit: <NumberText value={CHART_TOTALS.debit} decimals={2} />,
  credit: <NumberText value={CHART_TOTALS.credit} decimals={2} />,
  balance: <NumberText value={CHART_TOTALS.balance} decimals={2} />,
}

const LOCATION_COLUMNS: TreeTableColumn<LocationFigures>[] = [
  {
    id: 'free',
    header: 'Free places',
    numeric: true,
    cell: (node) => <NumberText value={node.data?.free ?? null} />,
  },
  {
    id: 'places',
    header: 'Places',
    numeric: true,
    cell: (node) => <NumberText value={node.data?.places ?? null} />,
  },
]

/** The table with the application around it: zone B loads when opened. */
function Locations({ layout }: { layout?: 'desktop' | 'phone' }) {
  const [nodes, setNodes] = useState(LOCATIONS)
  return (
    <TreeTable
      label="Warehouse locations"
      treeHeader="Location"
      nodes={nodes}
      columns={LOCATION_COLUMNS}
      defaultExpanded={['ns', 'ns-a']}
      totals={{ free: <NumberText value="46" />, places: <NumberText value="320" /> }}
      {...(layout === undefined ? {} : { layout })}
      onLoadChildren={(id) => {
        window.setTimeout(() => {
          setNodes((current) =>
            current.map(function attach(node): TreeNode<LocationFigures> {
              if (node.id === id) return { ...node, children: id === 'ns-b' ? ZONE_B : [] }
              return node.children === undefined
                ? node
                : { ...node, children: node.children.map(attach) }
            }),
          )
        }, 400)
      }}
    />
  )
}

const meta = {
  title: 'Components/Tree/TreeTable',
  component: TreeTable<AccountFigures>,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a hierarchy whose nodes carry figures — a chart of accounts with its ' +
          'debit, credit and balance, warehouse locations with their free places, a budget by ' +
          'org unit. The first column is the tree (TreeView’s rows, keys, lazy children and ' +
          'selection); the other columns are DataTable-like definitions, numbers at the end ' +
          'with tabular digits, written by the application through the provider’s `format`.\n\n' +
          '**Figures:** a branch’s figures and the totals row are the application’s — the table ' +
          'never adds (D4).\n\n' +
          '**Keyboard:** a WAI-ARIA treegrid whose rows take the focus: the tree’s keys (arrows ' +
          'mirrored in right-to-left, Home / End, `*`, type-ahead, Enter or Space).\n\n' +
          '**Thousands of nodes:** `maxHeight` scrolls the table inside it with a sticky header ' +
          'and draws only the rows in view (TanStack Virtual).\n\n' +
          '**Phones:** the tree with the main figure (`mainColumn`) at each row’s end and the ' +
          'total under it.\n\n' +
          '**When:** comparing figures along a hierarchy.\n\n' +
          '**When not:** a flat list of records (DataTable); a hierarchy without figures ' +
          '(TreeView); entering figures (EditableGrid).',
      },
    },
  },
  args: {
    nodes: CHART_OF_ACCOUNTS,
    label: 'Chart of accounts',
    treeHeader: 'Account',
    columns: ACCOUNT_COLUMNS,
  },
  render: (args) => (
    <ExampleProvider>
      <TreeTable {...args} />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof TreeTable<AccountFigures>>

export default meta

type Story = StoryObj<typeof meta>

/** The chart of accounts with turnover and balances; two classes open; the books' totals. */
export const Default: Story = {
  name: 'Chart of accounts',
  args: { defaultExpanded: ['0', '02', '2', '24'], totals: ACCOUNT_TOTALS },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const grid = canvas.getByRole('treegrid', { name: 'Chart of accounts' })
    const row = within(grid).getByRole('row', { name: /Građevinski objekti/ })
    await expect(row).toHaveAttribute('aria-level', '3')
    await expect(row).toHaveTextContent('42.750.000,00')
    await expect(within(grid).getByRole('row', { name: /^0\s/ })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    await expect(within(grid).getByRole('rowheader', { name: 'Total' })).toBeVisible()
  },
}

/** One account selected (the account a report or an entry is about). */
export const Selection: Story = {
  args: {
    defaultExpanded: ['2', '24'],
    selectionMode: 'single',
    defaultSelected: ['243'],
    totals: ACCOUNT_TOTALS,
    totalsLabel: 'Total, January–September 2026',
  },
  play: async ({ canvasElement }) => {
    await settle()
    const row = within(canvasElement).getByRole('row', { name: /Blagajna/ })
    await expect(row).toHaveAttribute('aria-selected', 'true')
    await expect(row).toHaveAttribute('tabindex', '0')
  },
}

/** The keyboard of the treegrid: open, enter, back, type a code. */
export const Keyboard: Story = {
  tags: ['interaction'],
  args: { selectionMode: 'single' },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const rtl = getComputedStyle(canvas.getByRole('treegrid')).direction === 'rtl'
    const into = rtl ? '{ArrowLeft}' : '{ArrowRight}'
    const first = canvas.getByRole('row', { name: /Stalna imovina/ })
    first.focus()
    await userEvent.keyboard(into)
    await expect(first).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard(into)
    await expect(canvas.getByRole('row', { name: /Nematerijalna imovina/ })).toHaveFocus()
    // Type-ahead finds a code.
    await userEvent.keyboard('4')
    const liabilities = canvas.getByRole('row', { name: /Dugoročna rezervisanja/ })
    await expect(liabilities).toHaveFocus()
    await userEvent.keyboard(' ')
    await expect(liabilities).toHaveAttribute('aria-selected', 'true')
  },
}

/** Warehouse locations with their places; zone B loads when it is opened. */
export const WarehouseStock: Story = {
  name: 'Warehouse locations',
  render: () => (
    <ExampleProvider>
      <Locations />
    </ExampleProvider>
  ),
}

/** Opening zone B: a loading row spans the table until the application passes its children. */
export const LazyLoading: Story = {
  name: 'Lazy loading, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Locations />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('row', { name: /Zona B/ }))
    await expect(canvas.getByRole('row', { name: /Loading/ })).toBeVisible()
    await expect(await canvas.findByRole('row', { name: /Komora B-02/ })).toBeVisible()
  },
}

/** Loading children: the row under an opened node; and an error row with "Try again". */
export const LoadingAndError: Story = {
  name: 'Loading children and error',
  render: () => (
    <ExampleProvider>
      <TreeTable
        label="Warehouse locations"
        treeHeader="Location"
        columns={LOCATION_COLUMNS}
        defaultExpanded={['ns', 'ns-b', 'ns-y']}
        onLoadChildren={() => undefined}
        nodes={LOCATIONS.map((node) => ({
          ...node,
          children: (node.children ?? []).map((child): TreeNode<LocationFigures> =>
            child.id === 'ns-y'
              ? { ...child, loadError: 'The yard’s places could not be loaded.' }
              : child,
          ),
        }))}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('row', { name: /Loading/ })).toHaveAttribute('aria-busy', 'true')
    await expect(canvas.getByRole('button', { name: 'Try again' })).toBeVisible()
  },
}

/** The whole table loading: the header stays, skeleton rows under it. */
export const Loading: Story = {
  args: { nodes: [], loading: true, totals: ACCOUNT_TOTALS },
}

/** Nothing to show. */
export const Empty: Story = {
  args: {
    nodes: [],
    empty: (
      <EmptyState
        compact
        title="No accounts yet"
        description="Import the chart of accounts or start from the standard one."
      />
    ),
  },
}

const THOUSANDS_ARGS = {
  nodes: LONG_CHART,
  defaultExpanded: LONG_CHART.flatMap((node) => [
    node.id,
    ...(node.children ?? []).map((child) => child.id),
  ]),
  maxHeight: '480px',
}

/** 5,110 accounts: the table scrolls inside its height and draws only the rows in view. */
export const Thousands: Story = {
  name: 'Thousands of nodes',
  args: THOUSANDS_ARGS,
  play: async ({ canvasElement }) => {
    await settle()
    const grid = within(canvasElement).getByRole('treegrid')
    await expect(grid).toHaveAttribute('aria-rowcount', '5111')
    // Far fewer rows are drawn than there are.
    await expect(within(grid).getAllByRole('row').length).toBeLessThan(120)
  },
}

/** Scrolling the long table with the keyboard: End goes to the last account, drawn on the way. */
export const ThousandsKeyboard: Story = {
  name: 'Thousands of nodes, keyboard, interaction',
  tags: ['interaction'],
  args: THOUSANDS_ARGS,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    canvas.getByRole('row', { name: /Klasa 0/ }).focus()
    await userEvent.keyboard('{End}')
    await expect(await canvas.findByRole('row', { name: /Konto 9949/ })).toHaveFocus()
  },
}

/** Long names wrap in the tree column; the figures stay on one line. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <div className="max-w-3xl">
        <TreeTable
          label="Chart of accounts"
          treeHeader="Account"
          columns={[
            {
              id: 'kind',
              header: 'Kind',
              align: 'center',
              cell: (node) => ((node.children?.length ?? 0) > 0 ? 'Group' : 'Account'),
            },
            ...ACCOUNT_COLUMNS,
          ]}
          defaultExpanded={['2', '27']}
          nodes={CHART_OF_ACCOUNTS.filter((node) => node.id === '2')}
        />
      </div>
    </ExampleProvider>
  ),
}

/** Phone width: the tree with the balance at each row's end and the total under it. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <TreeTable
            label="Chart of accounts"
            treeHeader="Account"
            columns={ACCOUNT_COLUMNS}
            nodes={CHART_OF_ACCOUNTS}
            mainColumn="balance"
            defaultExpanded={['2', '24']}
            totals={ACCOUNT_TOTALS}
            layout="phone"
          />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('tree')).toBeVisible()
    await expect(canvas.getByRole('treeitem', { name: /Blagajna/ })).toHaveTextContent('13.550,00')
  },
}

/** Phone width, the default main figure (the first numeric column) and the warehouse. */
export const PhoneWarehouse: Story = {
  name: 'Phone width, warehouse',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <Locations layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic: the tree column at the right, the figures to its left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <TreeTable
        label="دليل الحسابات"
        treeHeader="الحساب"
        totalsLabel="الإجمالي"
        columns={accountColumns('مدين', 'دائن', 'الرصيد')}
        nodes={ARABIC_ACCOUNTS}
        defaultExpanded={['1', '11', '12']}
        totals={{
          debit: <NumberText value="1147000.00" decimals={2} />,
          credit: <NumberText value="217500.00" decimals={2} />,
          balance: <NumberText value="929500.00" decimals={2} />,
        }}
      />
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <TreeTable
        label="勘定科目"
        treeHeader="勘定科目"
        totalsLabel="合計"
        columns={accountColumns('借方', '貸方', '残高')}
        nodes={JAPANESE_ACCOUNTS}
        defaultExpanded={['1', '11', '2']}
        totals={{
          debit: <NumberText value="18960000.00" decimals={2} />,
          credit: <NumberText value="2875000.00" decimals={2} />,
          balance: <NumberText value="16085000.00" decimals={2} />,
        }}
      />
    </StoryProvider>
  ),
}
