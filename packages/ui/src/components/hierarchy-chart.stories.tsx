import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { PrintPage } from '../templates/print-page'
import { HierarchyChart } from './hierarchy-chart'
import {
  ARABIC_PEOPLE,
  COMPANIES,
  JAPANESE_PEOPLE,
  LONG_PEOPLE,
  PEOPLE,
  UNITS,
} from './hierarchy-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Tree/HierarchyChart',
  component: HierarchyChart,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a hierarchy drawn top-down — people and positions by their reporting ' +
          'lines (an organisation chart), units with their heads and headcounts, a group of ' +
          'companies with the ownership shares on the lines, cost centres. Boxes and lines in ' +
          'HTML: it mirrors in right-to-left, prints, wraps and is read as a tree. The first ' +
          'levels are open; "+N" opens a node; a level of leaves stands as one list; "Show only ' +
          'this unit" with the way back up; the search reveals a node; a press or Enter calls ' +
          '`onOpen`, and the application opens its card. Secondary (dotted-line) relations are ' +
          'listed in that card, never drawn. Phones: an indented list.\n\n' +
          '**When to use:** to see where someone or something stands among the others. **When ' +
          'not:** to choose a node in a form or a filter (TreeView), or figures by a hierarchy ' +
          '(TreeTable).',
      },
    },
  },
  args: { label: 'Organisation of Northwind Ltd.', nodes: PEOPLE, maxHeight: '36rem' },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <Story />
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof HierarchyChart>

export default meta

type Story = StoryObj<typeof meta>

/** People by their reporting lines: three levels open, the site crews as lists, one vacant. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const tree = canvas.getByRole('tree', { name: 'Organisation of Northwind Ltd.' })
    await expect(
      within(tree).getByRole('treeitem', { name: 'Ana Horvat, Managing director' }),
    ).toHaveAttribute('tabindex', '0')
    await expect(within(tree).getByRole('treeitem', { name: /^Payroll assistant/ })).toBeVisible()
    await expect(within(tree).getByText('Vacant')).toBeVisible()
    await expect(
      within(tree).getByRole('button', { name: 'Show the 3 under Frank Berg' }),
    ).toBeVisible()
  },
}

/** Only the top two levels open: "+N" says how many stand under each closed node. */
export const Collapsed: Story = {
  args: { defaultExpandedDepth: 2 },
}

/** Units with their heads and headcounts. */
export const Units: Story = {
  args: { label: 'Units of Northwind Ltd.', nodes: UNITS },
}

/** A group of companies: the ownership shares on the lines, the associate marked. */
export const Companies: Story = {
  name: 'Group of companies',
  args: { label: 'Northwind group', nodes: COMPANIES },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('60%')).toBeVisible()
    await expect(canvas.getByText('Associate')).toBeVisible()
  },
}

/** One unit shown alone, with its way back up. */
export const OneUnit: Story = {
  name: 'Only one unit',
  args: { defaultUnit: 'ops' },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('navigation', { name: 'Path to the unit' })).toBeVisible()
    await expect(canvas.queryByText('Boris Lang')).toBeNull()
  },
}

/** A search's first match revealed, chosen and in view. */
export const Found: Story = {
  name: 'Search found',
  args: { defaultExpandedDepth: 1, defaultQuery: 'karla' },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('1 of 1 found')
    await expect(canvas.getByRole('treeitem', { name: 'Karla Stein, Foreman' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
  },
}

/** Nothing found. */
export const NotFound: Story = {
  name: 'Search, nothing found',
  args: { defaultQuery: 'zebra' },
}

/** Scaled to the card's width. */
export const Fit: Story = {
  name: 'Fit to width',
  args: { defaultZoom: 'fit', defaultExpandedDepth: 4, stackFrom: 10 },
}

/** Loading. */
export const Loading: Story = {
  args: { loading: true },
}

/** The nodes could not be loaded. */
export const Failed: Story = {
  name: 'Error',
  args: { error: 'The organisation could not be loaded.', onRetry: () => undefined },
}

/** No nodes (P5.93): an EmptyState with the application's words and first step; no tools. */
export const Empty: Story = {
  args: {
    nodes: [],
    empty: 'No positions yet: the chart is drawn from them.',
    emptyAction: { label: 'Add the first position', icon: Plus, onClick: () => undefined },
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Add the first position' })).toBeVisible()
    await expect(canvas.queryByRole('searchbox')).toBeNull()
  },
}

/** Long names and positions wrap inside their boxes. */
export const LongText: Story = {
  name: 'Long text',
  args: { nodes: LONG_PEOPLE },
}

/** Without the search (the application has its own). */
export const NoSearch: Story = {
  name: 'Without search',
  args: { search: false, searchLabel: 'Find someone' },
}

/** Phone width: the indented list with the same actions. */
export const Phone: Story = {
  args: { layout: 'phone' },
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <div className="p-4">
            <Story />
          </div>
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
}

/** Arabic: the chart mirrors (siblings from the right, the arrows too). */
export const Arabic: Story = {
  args: { label: 'الهيكل التنظيمي', nodes: ARABIC_PEOPLE, vacantLabel: 'شاغر', searchLabel: 'بحث' },
  decorators: [
    (Story) => (
      <StoryProvider locale="ar">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** Japanese. */
export const Japanese: Story = {
  args: { label: '組織図', nodes: JAPANESE_PEOPLE, vacantLabel: '欠員', searchLabel: '検索' },
  decorators: [
    (Story) => (
      <StoryProvider locale="ja">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** On a landscape sheet: every level open, no controls, scaled to the sheet. */
export const Print: Story = {
  render: () => (
    <PrintPage title="Organisation of Northwind Ltd." orientation="landscape">
      <HierarchyChart
        label="Organisation of Northwind Ltd."
        nodes={PEOPLE}
        layout="desktop"
        toolbar={false}
        framed={false}
        defaultExpandedDepth={9}
        stackFrom={2}
        defaultZoom="fit"
        maxHeight="none"
      />
    </PrintPage>
  ),
}

/** The application keeps the chosen node and shows what `onOpen` reported. */
function Opening() {
  const [opened, setOpened] = useState<string | null>(null)
  const [expanded, setExpanded] = useState<string[]>(['ceo', 'fin', 'ops'])
  const [unit, setUnit] = useState<string | null>(null)
  const [zoom, setZoom] = useState<'actual' | 'fit'>('actual')
  return (
    <div className="flex flex-col gap-3">
      <HierarchyChart
        label="Organisation of Northwind Ltd."
        nodes={PEOPLE}
        expanded={expanded}
        onExpandedChange={setExpanded}
        unit={unit}
        onUnitChange={setUnit}
        zoom={zoom}
        onZoomChange={setZoom}
        onOpen={setOpened}
        maxHeight="30rem"
      />
      <output className="bidi-isolate">{opened === null ? '' : `Opened: ${opened}`}</output>
    </div>
  )
}

/** The keys: down to a child, across to a sibling, up, Space closes, Enter opens the card. */
export const Keyboard: Story = {
  name: 'Keyboard, interaction',
  tags: ['interaction'],
  render: () => <Opening />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const top = canvas.getByRole('treeitem', { name: 'Ana Horvat, Managing director' })
    top.focus()
    await userEvent.keyboard('{ArrowDown}')
    const boris = canvas.getByRole('treeitem', { name: 'Boris Lang, Head of finance' })
    await waitFor(async () => {
      await expect(boris).toHaveFocus()
    })
    // The next sibling is toward the end of the reading direction.
    const rtl = getComputedStyle(top).direction === 'rtl'
    await userEvent.keyboard(rtl ? '{ArrowLeft}' : '{ArrowRight}')
    const eva = canvas.getByRole('treeitem', { name: 'Eva Novak, Head of operations' })
    await waitFor(async () => {
      await expect(eva).toHaveFocus()
    })
    await userEvent.keyboard('{ArrowUp}')
    await waitFor(async () => {
      await expect(top).toHaveFocus()
    })
    await userEvent.keyboard(' ')
    await expect(top).toHaveAttribute('aria-expanded', 'false')
    await userEvent.keyboard(' ')
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByText('Opened: ceo')).toBeVisible()
    await settle()
  },
}

/** Search, the next match with Enter, a unit alone and back, the size buttons. */
export const SearchAndUnit: Story = {
  name: 'Search and unit, interaction',
  tags: ['interaction'],
  render: () => <Opening />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.type(
      canvas.getByRole('searchbox', { name: 'Find a person or unit' }),
      'foreman',
    )
    await expect(canvas.getByText('1 of 2 found')).toBeVisible()
    await expect(canvas.getByRole('treeitem', { name: 'Gina Moll, Foreman' })).toHaveAttribute(
      'aria-selected',
      'true',
    )
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByText('2 of 2 found')).toBeVisible()
    const eva = canvas
      .getByRole('treeitem', { name: 'Eva Novak, Head of operations' })
      .querySelector<HTMLElement>('[data-slot="hierarchy-node"]')
    if (eva === null) throw new Error('Eva Novak’s box is missing')
    await userEvent.click(eva)
    await userEvent.click(canvas.getByRole('button', { name: 'Show only this unit' }))
    await expect(canvas.queryByText('Boris Lang')).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Show the whole chart' }))
    await waitFor(async () => {
      await expect(canvas.getByText('Boris Lang')).toBeVisible()
    })
    await userEvent.click(canvas.getByRole('button', { name: 'Fit to width' }))
    await expect(canvas.getByRole('button', { name: 'Fit to width' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await settle()
  },
}
