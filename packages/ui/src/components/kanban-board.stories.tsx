import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { useLiro } from '../provider/liro-provider'
import { TASK_COLUMNS } from './group-c-story-data'
import { KanbanBoard, type KanbanBoardProps, type KanbanColumn } from './kanban-board'
import { moveCard } from './kanban-logic'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/** The application writes each column's count with its noun ("3 tasks"). */
function useCounted(columns: readonly KanbanColumn[]): KanbanColumn[] {
  const { format } = useLiro()
  return columns.map((column) => {
    const n = column.cards.length
    return { ...column, count: `${format.number(String(n))} ${n === 1 ? 'task' : 'tasks'}` }
  })
}

/** The application around the board: it applies each move to its columns. */
function Board(
  props: Omit<KanbanBoardProps, 'columns' | 'label'> & {
    initial?: readonly KanbanColumn[]
    label?: string
  },
) {
  const [columns, setColumns] = useState<readonly KanbanColumn[]>(props.initial ?? TASK_COLUMNS)
  const counted = useCounted(columns)
  return (
    <KanbanBoard
      {...props}
      label={props.label ?? 'Tasks'}
      columns={counted}
      onMove={(move) => {
        setColumns((current) => moveCard(current, move.cardId, move.to))
      }}
    />
  )
}

/** The column a card stands in, by the column's heading. */
function columnOf(canvasElement: HTMLElement, title: string): HTMLElement {
  const card = within(canvasElement).getByText(title).closest('[data-kanban-column]')
  if (!(card instanceof HTMLElement)) throw new Error(`no column holds ${title}`)
  return card
}

function columnTitle(column: HTMLElement): string {
  return column.querySelector('h2')?.textContent ?? ''
}

/** Whether the story's page runs right to left (the toolbar's direction). */
function rtl(canvasElement: HTMLElement): boolean {
  return (
    getComputedStyle(canvasElement.querySelector('[data-slot="kanban-board"]') ?? canvasElement)
      .direction === 'rtl'
  )
}

const meta = {
  title: 'Components/KanbanBoard',
  component: KanbanBoard,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** work in stages — tasks, applications, cases: columns of cards, each ' +
          'card with its title (a link to it), a description line, the record it is about (kind, ' +
          'number, state), the due date (DueDate), a count with its noun and the assignee. The ' +
          'board shows what it is given and reports a move (`onMove`); the application decides.\n\n' +
          '**Moving a card — three ways (WCAG 2.5.7):** drag it (pointer events: it lifts with a ' +
          'shadow, the others make room, a neutral dashed placeholder shows where it lands; touch ' +
          'after a 250ms press); the keyboard on its handle (Space picks it up, the arrows move ' +
          'it — the forward arrow in the reading direction goes to the next column —, Space drops, ' +
          'Escape cancels, each step announced); or its menu ("Move to" a column, up, down).\n\n' +
          '**Phones:** one column at a time, chosen with its count; the menu moves cards between ' +
          'columns.\n\n' +
          '**When:** a few hundred cards at most, whose stage matters more than their order in a ' +
          'list.\n\n' +
          '**When not:** records to compare or sort by values (DataTable); a sequence of states ' +
          'of one process (StatusTimeline, LifecycleBar).',
      },
    },
  },
  args: { columns: TASK_COLUMNS, label: 'Tasks' },
  render: () => (
    <ExampleProvider>
      <Board />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof KanbanBoard>

export default meta

type Story = StoryObj<typeof meta>

/**
 * The keyboard: pick up "Send reminder for F-2026-0411", move it to the next column and one
 * place down, drop it; each step is announced.
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const title = 'Send reminder for F-2026-0411'
    const handle = canvas.getByRole('button', { name: `Move: ${title}` })
    await expect(handle).toHaveAccessibleDescription(/Press Space to pick up the card/)
    handle.focus()
    await userEvent.keyboard(' ')
    await expect(handle).toHaveAttribute('aria-pressed', 'true')
    await expect(canvas.getByRole('status')).toHaveTextContent(
      `Picked up ${title}. To do, position 1 of 3.`,
    )
    await userEvent.keyboard(rtl(canvasElement) ? '{ArrowLeft}' : '{ArrowRight}')
    await waitFor(async () => {
      await expect(columnTitle(columnOf(canvasElement, title))).toBe('In progress')
    })
    await expect(canvas.getByRole('button', { name: `Move: ${title}` })).toHaveFocus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(canvas.getByRole('status')).toHaveTextContent(
      `${title}: In progress, position 2 of 3.`,
    )
    await userEvent.keyboard(' ')
    await expect(canvas.getByRole('status')).toHaveTextContent(`Dropped ${title}`)
    await expect(columnTitle(columnOf(canvasElement, title))).toBe('In progress')
    await expect(columnOf(canvasElement, title)).toHaveTextContent('3 tasks')
  },
}

/** Escape puts a picked-up card back where it was. */
export const KeyboardCancel: Story = {
  name: 'Keyboard, cancelled',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const title = 'Match bank statement 188'
    canvas.getByRole('button', { name: `Move: ${title}` }).focus()
    await userEvent.keyboard(' ')
    await userEvent.keyboard(rtl(canvasElement) ? '{ArrowLeft}' : '{ArrowRight}')
    await waitFor(async () => {
      await expect(columnTitle(columnOf(canvasElement, title))).toBe('Waiting')
    })
    await userEvent.keyboard('{Escape}')
    await expect(columnTitle(columnOf(canvasElement, title))).toBe('In progress')
    await expect(canvas.getByRole('status')).toHaveTextContent('Move cancelled.')
  },
}

/** The menu: "Move to" another column (the card goes to its end), up and down. */
export const Menu: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const title = 'Approve UF-2026-1187 from EPS Snabdevanje'
    await userEvent.click(canvas.getByRole('button', { name: `Move to: ${title}` }))
    await userEvent.click(await within(document.body).findByRole('menuitem', { name: 'Done' }))
    await waitFor(async () => {
      await expect(columnTitle(columnOf(canvasElement, title))).toBe('Done')
    })
    await expect(canvas.getByRole('status')).toHaveTextContent(`${title}: Done, position 1 of 1.`)
  },
}

/** Dragging with the pointer: drop a card into another column. */
export const Dragging: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const title = 'Collect the open amount of F-2026-0410'
    const card = canvas.getByText(title).closest('li')
    const target = canvasElement.querySelector('[data-kanban-column="waiting"] [data-kanban-list]')
    if (card === null || target === null) throw new Error('missing card or column')
    const from = card.getBoundingClientRect()
    const to = target.getBoundingClientRect()
    const start = { x: from.left + 40, y: from.top + 60 }
    const end = { x: to.left + to.width / 2, y: to.bottom - 10 }
    // One user session, so the release belongs to the same press.
    const user = userEvent.setup()
    await user.pointer([
      { keys: '[MouseLeft>]', target: card, coords: { clientX: start.x, clientY: start.y } },
      { coords: { clientX: start.x + 10, clientY: start.y + 4 } },
      { coords: { clientX: (start.x + end.x) / 2, clientY: (start.y + end.y) / 2 } },
      { coords: { clientX: end.x, clientY: end.y } },
    ])
    // While held: the card lifts and a neutral placeholder shows where it lands.
    await expect(card).toHaveAttribute('data-dragging')
    await expect(
      canvasElement.querySelector(
        '[data-kanban-column="waiting"] [data-slot="kanban-drop-placeholder"]',
      ),
    ).not.toBeNull()
    await user.pointer({ keys: '[/MouseLeft]', coords: { clientX: end.x, clientY: end.y } })
    await waitFor(async () => {
      await expect(columnTitle(columnOf(canvasElement, title))).toBe('Waiting')
    })
  },
}

/** A board the user may only read: no handles, menus or dragging. */
export const ReadOnly: Story = {
  name: 'Read-only',
  render: () => (
    <ExampleProvider>
      <Board readOnly />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).queryAllByRole('button')).toHaveLength(0)
  },
}

/** Loading: skeleton columns. */
export const Loading: Story = {
  render: () => (
    <ExampleProvider>
      <Board loading />
    </ExampleProvider>
  ),
}

/** Empty columns say so, and still take a dropped card. */
export const Empty: Story = {
  render: () => (
    <ExampleProvider>
      <Board initial={TASK_COLUMNS.map((column) => ({ ...column, cards: [] }))} />
    </ExampleProvider>
  ),
}

/** Long titles and descriptions wrap (the description at most two lines). */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <Board
        initial={[
          {
            id: 'todo',
            title: 'Waiting for the customer’s confirmation of the delivery date',
            cards: [
              {
                id: 'l1',
                title:
                  'Agree the delivery of 24 m³ of ready-mixed concrete C25/30 to the site at Temerinski put 51 with Vojvođanka Mlin a.d.',
                description:
                  'The customer asked for delivery on Friday morning before 07:00, which needs a permit for the access road from the city; the permit request was sent on 02.10.2026. and is still waiting for an answer.',
                assignee: { name: 'Snežana Popović' },
                due: '2026-10-09',
                meta: '14 comments and 3 attachments',
              },
            ],
          },
          ...TASK_COLUMNS.slice(1, 3),
        ]}
      />
    </ExampleProvider>
  ),
}

/** On a phone: one column at a time, chosen with its count. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <Board layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Send reminder for F-2026-0411')).toBeVisible()
    await expect(canvas.queryByText('Match bank statement 188')).toBeNull()
    const board = canvasElement.querySelector<HTMLElement>('[data-slot="kanban-board"]')
    if (board !== null) await expect(board.scrollWidth).toBeLessThanOrEqual(board.clientWidth)
  },
}

/** A fixed today two days after the cards' due date, so the picture never changes with the date. */
const OVERDUE_TODAY = '2026-10-09'

/** Arabic cards in a right-to-left board: the first column at the right. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar" today={OVERDUE_TODAY}>
      <Board
        label="المهام"
        initial={[
          {
            id: 'a',
            title: 'قيد الانتظار',
            cards: [
              {
                id: 'a1',
                title: 'إرسال تذكير بالدفع',
                description: 'لم يتم سداد الفاتورة حتى الآن.',
                assignee: { name: 'سارة أحمد' },
                due: '2026-10-07',
              },
            ],
          },
          { id: 'b', title: 'قيد التنفيذ', cards: [{ id: 'b1', title: 'مطابقة كشف الحساب' }] },
          { id: 'c', title: 'منجز', cards: [] },
        ]}
      />
    </StoryProvider>
  ),
}

/** Japanese cards. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja" today={OVERDUE_TODAY}>
      <Board
        label="タスク"
        initial={[
          {
            id: 'a',
            title: '未着手',
            cards: [
              {
                id: 'a1',
                title: '支払いの督促を送る',
                description: '請求書はまだ支払われていません。',
                assignee: { name: '佐藤 花子' },
                due: '2026-10-07',
              },
            ],
          },
          { id: 'b', title: '進行中', cards: [{ id: 'b1', title: '銀行明細の照合' }] },
          { id: 'c', title: '完了', cards: [] },
        ]}
      />
    </StoryProvider>
  ),
}
