import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { BarChart, LineChart } from '../charts'
import { settle } from '../primitives/story-helpers'
import { useLiro } from '../provider/liro-provider'
import { CASH, REVENUE } from '../templates/insight-story-data'
import { KeyValueList, SectionCard } from './cards'
import { DashboardGrid, type DashboardCard, type DashboardGridProps } from './dashboard-grid'
import type { DashboardCardSize, DashboardLayoutItem } from './dashboard-grid-logic'
import { DateText, MoneyText } from './display-text'
import { EmptyState } from './empty-state'
import { StatCard } from './stat-card'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/** A share through the provider's format. */
function Percent({ value }: { value: string }) {
  const { format } = useLiro()
  return <bdi>{format.percent(value)}</bdi>
}

const SIZES: DashboardCardSize[] = [
  { id: 'small', label: 'Small', columns: 1 },
  { id: 'medium', label: 'Medium', columns: 2 },
  { id: 'full', label: 'Full width', columns: 4 },
]

/** The application's cards: what each shows, and the size it starts at. */
const CARDS: DashboardCard[] = [
  {
    id: 'revenue',
    title: 'Revenue, September',
    size: 'small',
    content: (
      <StatCard
        label="Revenue, September"
        value={<MoneyText value="5684200.00" currency="RSD" />}
        comparison="vs September 2025"
      />
    ),
  },
  {
    id: 'receivables',
    title: 'Open receivables',
    size: 'small',
    content: (
      <StatCard
        label="Open receivables"
        value={<MoneyText value="2690700.00" currency="RSD" />}
        comparison="11 invoices"
      />
    ),
  },
  {
    id: 'cash',
    title: 'Cash',
    size: 'small',
    content: (
      <StatCard
        label="Cash"
        value={<MoneyText value="3012775.40" currency="RSD" />}
        comparison="vs 31.08.2026."
      />
    ),
  },
  {
    id: 'vat',
    title: 'VAT due 15.10.',
    size: 'small',
    content: (
      <StatCard label="VAT due 15.10." value={<MoneyText value="612480.00" currency="RSD" />} />
    ),
  },
  {
    id: 'revenue-chart',
    title: 'Revenue by month',
    size: 'medium',
    sizes: ['medium', 'full'],
    content: <BarChart {...REVENUE} height={200} />,
  },
  {
    id: 'cash-chart',
    title: 'Cash at month end',
    size: 'medium',
    sizes: ['medium', 'full'],
    content: <LineChart {...CASH} height={200} />,
  },
  {
    id: 'project',
    title: 'Residential building Liman 4',
    size: 'full',
    content: (
      <SectionCard title="Residential building Liman 4" headingLevel={3}>
        <KeyValueList
          columns={3}
          items={[
            { label: 'Done', value: <Percent value="46" />, numeric: true },
            {
              label: 'Spent',
              value: <MoneyText value="112295000.00" currency="RSD" />,
              numeric: true,
            },
            { label: 'Handover', value: <DateText value="2027-05-28" />, numeric: true },
          ]}
        />
      </SectionCard>
    ),
  },
]

/** The application around the grid: it applies each change to its layout. */
function Dashboard(
  props: Omit<DashboardGridProps, 'cards' | 'sizes' | 'label'> & {
    cards?: readonly DashboardCard[]
    label?: string
  },
) {
  const initial = props.cards ?? CARDS
  const [layout, setLayout] = useState<DashboardLayoutItem[]>(
    initial.map((card) => ({ id: card.id, size: card.size })),
  )
  const cards = layout.flatMap((item) => {
    const card = initial.find((each) => each.id === item.id)
    return card === undefined ? [] : [{ ...card, size: item.size }]
  })
  return (
    <DashboardGrid
      {...props}
      label={props.label ?? 'Overview'}
      sizes={SIZES}
      cards={cards}
      onLayoutChange={(next) => {
        setLayout(next)
      }}
    />
  )
}

/** The cards' titles in the order shown (from the editing toolbars' handles or menus). */
function order(canvasElement: HTMLElement): string[] {
  return Array.from(
    canvasElement.querySelectorAll<HTMLElement>(
      '[data-dashboard-card] [data-dashboard-focus^="menu:"]',
    ),
  ).map((button) => (button.getAttribute('aria-label') ?? '').replace('Options: ', ''))
}

function rtl(canvasElement: HTMLElement): boolean {
  return (
    getComputedStyle(canvasElement.querySelector('[data-slot="dashboard-grid"]') ?? canvasElement)
      .direction === 'rtl'
  )
}

const meta = {
  title: 'Components/DashboardGrid',
  component: DashboardGrid,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a dashboard the user arranges — the application’s cards (StatCard, the ' +
          'charts, a SectionCard with a table or figures) in the user’s order and sizes. The ' +
          'grid shows what it is given and reports every change with the new layout ' +
          '(`onLayoutChange(layout, change)`); the application keeps the draft, saves it on its ' +
          '"Done", puts it back on "Cancel", adds cards from its catalogue and keeps the saved ' +
          'layouts.\n\n' +
          '**Sizes** are the application’s (`sizes`: a name and how many of the `columns` a card ' +
          'takes); a card may allow only some (`sizes` on the card). Four columns from 62em, two ' +
          'from 36em, one on phones; heights follow the content.\n\n' +
          '**Editing (`editing`):** each card in a dashed frame with a toolbar — the handle, its ' +
          'title, its size (a menu of the sizes), its menu (move earlier, later, to the start, to ' +
          'the end) and Remove; the content stays visible and is not reached.\n\n' +
          '**Moving — three ways (WCAG 2.5.7):** drag (the card lifts and follows the pointer, a ' +
          'neutral dashed placeholder of its size shows where it lands; touch after a 250ms ' +
          'press); the keyboard on its handle (Space picks it up, the arrows move it — along the ' +
          'reading order, up and down by the grid —, Space drops, Escape cancels, each step ' +
          'announced); or its menu. **Phones:** one column, every card full width, the menu ' +
          'moves (no dragging, no size).\n\n' +
          '**When:** a home or overview page whose cards people choose and arrange themselves.\n\n' +
          '**When not:** a fixed dashboard (DashboardPage); module cards of one size to reorder ' +
          'and hide (Launchpad); cards in stages (KanbanBoard).',
      },
    },
  },
  args: { cards: CARDS, sizes: SIZES, label: 'Overview' },
  render: () => (
    <ExampleProvider>
      <Dashboard />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof DashboardGrid>

export default meta

type Story = StoryObj<typeof meta>

/** View mode: only the cards, in the user's order and sizes. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('list', { name: 'Overview' })).toBeVisible()
    await expect(canvas.queryByRole('button', { name: /^Move:/ })).toBeNull()
  },
}

/** Editing: every card framed with its handle, title, size, menu and Remove. */
export const Editing: Story = {
  render: () => (
    <ExampleProvider>
      <Dashboard editing />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const handle = canvas.getByRole('button', { name: 'Move: Revenue, September' })
    await expect(handle).toHaveAccessibleDescription(/Press Space to pick up the card/)
    await expect(
      canvas.getByRole('button', { name: 'Medium, size of Revenue by month' }),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Remove: Cash' })).toBeVisible()
  },
}

/** The keyboard: pick up Revenue, move it one place later and down a row, drop it. */
export const Keyboard: Story = {
  name: 'Keyboard, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Dashboard editing />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const title = 'Revenue, September'
    canvas.getByRole('button', { name: `Move: ${title}` }).focus()
    await userEvent.keyboard(' ')
    await expect(canvas.getByRole('button', { name: `Move: ${title}` })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(canvas.getByRole('status')).toHaveTextContent(
      `Picked up ${title}. Position 1 of 7.`,
    )
    await userEvent.keyboard(rtl(canvasElement) ? '{ArrowLeft}' : '{ArrowRight}')
    await expect(canvas.getByRole('status')).toHaveTextContent(`${title}: position 2 of 7.`)
    await expect(canvas.getByRole('button', { name: `Move: ${title}` })).toHaveFocus()
    await userEvent.keyboard('{End}')
    await expect(canvas.getByRole('status')).toHaveTextContent(`${title}: position 7 of 7.`)
    await userEvent.keyboard(' ')
    await expect(canvas.getByRole('status')).toHaveTextContent(`Dropped ${title}.`)
    await waitFor(async () => {
      await expect(order(canvasElement).at(-1)).toBe(title)
    })
  },
}

/** Escape puts a picked-up card back. */
export const KeyboardCancel: Story = {
  name: 'Keyboard, cancelled, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Dashboard editing />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    canvas.getByRole('button', { name: 'Move: Cash' }).focus()
    await userEvent.keyboard(' ')
    await userEvent.keyboard('{Home}')
    await expect(order(canvasElement)[0]).toBe('Cash')
    await userEvent.keyboard('{Escape}')
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Move cancelled. Cash is back in its place.',
    )
    await expect(order(canvasElement)[2]).toBe('Cash')
  },
}

/** The menus: a card made full width, another moved to the start, a third removed. */
export const Menus: Story = {
  name: 'Menus, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Dashboard editing />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Medium, size of Revenue by month' }))
    await userEvent.click(await body.findByRole('menuitemradio', { name: 'Full width' }))
    await expect(
      await canvas.findByRole('button', { name: 'Full width, size of Revenue by month' }),
    ).toBeVisible()
    await expect(canvas.getByRole('status')).toHaveTextContent('Revenue by month: Full width.')
    await userEvent.click(canvas.getByRole('button', { name: 'Options: Cash at month end' }))
    await userEvent.click(await body.findByRole('menuitem', { name: 'Move to the start' }))
    await waitFor(async () => {
      await expect(order(canvasElement)[0]).toBe('Cash at month end')
    })
    await userEvent.click(canvas.getByRole('button', { name: 'Remove: VAT due 15.10.' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('VAT due 15.10. removed.')
    await expect(order(canvasElement)).not.toContain('VAT due 15.10.')
  },
}

/** Dragging: Cash is dropped on the place of the first card. */
export const Dragging: Story = {
  name: 'Dragging, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Dashboard editing />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const grip = canvas.getByRole('button', { name: 'Move: Cash' })
    const from = grip.getBoundingClientRect()
    const first = canvas
      .getByRole('button', { name: 'Move: Revenue, September' })
      .closest('[data-dashboard-card]')
    if (!(first instanceof HTMLElement)) throw new Error('no first card')
    const to = first.getBoundingClientRect()
    const x = from.left + from.width / 2
    const y = from.top + from.height / 2
    await fireEvent.pointerDown(grip, { button: 0, clientX: x, clientY: y, pointerType: 'mouse' })
    await fireEvent.pointerMove(window, { clientX: x + 10, clientY: y, pointerType: 'mouse' })
    const target = { clientX: to.left + to.width / 2, clientY: to.top + to.height / 2 }
    await fireEvent.pointerMove(window, { ...target, pointerType: 'mouse' })
    await waitFor(async () => {
      await expect(
        canvasElement.querySelector('[data-slot="dashboard-drop-placeholder"]'),
      ).not.toBeNull()
    })
    await fireEvent.pointerUp(window, { ...target, pointerType: 'mouse' })
    await waitFor(async () => {
      await expect(order(canvasElement)[0]).toBe('Cash')
    })
  },
}

/** Loading: each card's place keeps its size. */
export const Loading: Story = {
  render: () => (
    <ExampleProvider>
      <Dashboard loading />
    </ExampleProvider>
  ),
}

/** No cards: the application's empty state with its first step. */
export const Empty: Story = {
  render: () => (
    <ExampleProvider>
      <Dashboard
        cards={[]}
        empty={
          <EmptyState
            title="Your overview has no cards"
            description="Add the figures and charts you want to see first."
            action={{ label: 'Add card', onClick: () => undefined }}
          />
        }
      />
    </ExampleProvider>
  ),
}

/** Long titles wrap in the toolbar; the buttons keep their size. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <Dashboard
        editing
        cards={[
          {
            id: 'long',
            title:
              'Receivables from customers in the construction segment, overdue more than ninety days',
            size: 'small',
            content: (
              <StatCard
                label="Receivables from customers in the construction segment, overdue more than ninety days"
                value={<MoneyText value="1284500.00" currency="RSD" />}
              />
            ),
          },
          ...CARDS.slice(1, 5),
        ]}
      />
    </ExampleProvider>
  ),
}

/** Phones: one column, every card full width; editing by the menus only. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <Dashboard editing layout="phone" cards={CARDS.slice(0, 5)} />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button', { name: /^Move:/ })).toBeNull()
    await expect(canvas.getByRole('button', { name: 'Options: Cash' })).toBeVisible()
  },
}

/** Phones in view mode. */
export const PhoneView: Story = {
  name: 'Phone width, view',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <Dashboard layout="phone" cards={CARDS.slice(0, 5)} />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

const ARABIC_CARDS: DashboardCard[] = [
  {
    id: 'sales',
    title: 'المبيعات، سبتمبر',
    size: 'small',
    content: (
      <StatCard label="المبيعات، سبتمبر" value={<MoneyText value="5684200.00" currency="SAR" />} />
    ),
  },
  {
    id: 'cash',
    title: 'النقد',
    size: 'small',
    content: <StatCard label="النقد" value={<MoneyText value="3012775.40" currency="SAR" />} />,
  },
  {
    id: 'due',
    title: 'المستحقات المفتوحة',
    size: 'medium',
    content: (
      <StatCard
        label="المستحقات المفتوحة"
        value={<MoneyText value="2690700.00" currency="SAR" />}
      />
    ),
  },
]

export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <Dashboard editing label="نظرة عامة" cards={ARABIC_CARDS} />
    </StoryProvider>
  ),
}

const JAPANESE_CARDS: DashboardCard[] = [
  {
    id: 'sales',
    title: '売上（9月）',
    size: 'small',
    content: (
      <StatCard
        label="売上（9月）"
        value={<MoneyText value="5684200" currency="JPY" decimals={0} />}
      />
    ),
  },
  {
    id: 'cash',
    title: '現金',
    size: 'small',
    content: (
      <StatCard label="現金" value={<MoneyText value="3012775" currency="JPY" decimals={0} />} />
    ),
  },
  {
    id: 'due',
    title: '未回収の売掛金',
    size: 'medium',
    content: (
      <StatCard
        label="未回収の売掛金"
        value={<MoneyText value="2690700" currency="JPY" decimals={0} />}
      />
    ),
  },
]

export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <Dashboard editing label="概要" cards={JAPANESE_CARDS} />
    </StoryProvider>
  ),
}
