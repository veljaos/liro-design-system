import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { PhoneFrame, StoryProvider } from '../components/story-frames'
import { Gantt, type GanttProps } from './gantt'
import { applyGanttChange, type GanttChange, type GanttModel } from './gantt-logic'
import {
  ARABIC_TASKS,
  ganttReady,
  JAPANESE_TASKS,
  LONG_TASKS,
  PLAIN_TASKS,
  STORY_NOW,
  STORY_TODAY,
  WAREHOUSE_DEPENDENCIES,
  WAREHOUSE_TASKS,
} from './gantt-story-data'

/** The plan as an application keeps it: every reported change applied, the last one shown. */
function Controlled(props: Omit<GanttProps, 'tasks' | 'dependencies' | 'onChange'>) {
  const [model, setModel] = useState<GanttModel>({
    tasks: WAREHOUSE_TASKS,
    dependencies: WAREHOUSE_DEPENDENCIES,
  })
  const [last, setLast] = useState<GanttChange | null>(null)
  return (
    <div className="flex flex-col gap-3">
      <Gantt
        {...props}
        tasks={model.tasks}
        dependencies={model.dependencies}
        onChange={(change) => {
          setLast(change)
          setModel((current) => applyGanttChange(current, change))
        }}
      />
      <output data-testid="last-change" dir="ltr" className="font-mono text-xs text-secondary">
        {last === null ? '' : JSON.stringify(last)}
      </output>
    </div>
  )
}

const meta = {
  title: 'Components/Gantt',
  component: Gantt,
  parameters: {
    docs: {
      description: {
        component:
          '`@veljaos/ui/gantt` — a subpath of its own, so SVAR React Gantt (MIT edition) loads ' +
          'only where a plan is drawn.\n\n' +
          '**What for:** a project’s plan against time — phases (summary bars), tasks (bars ' +
          'with their progress as a line), milestones (diamonds), who does each, and the ' +
          'dependencies between them — with a phase’s budget and what was spent beside the ' +
          'timeline, as the application gives them (never added). The one “now” marker comes ' +
          'from the application’s `now`.\n\n' +
          '**Edit** (`mode="edit"`): drag a bar, its ends, its progress tab or a dot at its end; ' +
          'or, for every drag, the row’s Change menu — Move…, Change dates…, Set progress…, ' +
          'Dependencies… Each change is reported through `onChange`; nothing changes until the ' +
          'application passes new rows (`applyGanttChange` is what it may do with them).\n\n' +
          '**Right to left:** the timeline is mirrored, time running from the leading edge; ' +
          'dragging is off there and the dialogs edit.\n\n' +
          '**Phones:** a list by phase with dates; the timeline read-only.\n\n' +
          '**When not:** a day of bookings by resource (ResourceSchedule), a calendar ' +
          '(CalendarView), a process of steps (Diagram), a record’s states (StatusTimeline).',
      },
    },
  },
  decorators: [
    (Story) => (
      <StoryProvider today={STORY_TODAY}>
        <Story />
      </StoryProvider>
    ),
  ],
  args: {
    label: 'Warehouse extension',
    tasks: WAREHOUSE_TASKS,
    dependencies: WAREHOUSE_DEPENDENCIES,
    now: STORY_NOW,
  },
  play: async ({ canvasElement }) => {
    await ganttReady(canvasElement)
  },
} satisfies Meta<typeof Gantt>

export default meta

type Story = StoryObj<typeof meta>

/** The plan by month: the table with budget and spent, the timeline with today's marker. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await ganttReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('table', { name: 'Warehouse extension' })).toBeVisible()
    await expect(
      canvas.getByRole('rowheader', { name: /^Task: Steel frame, in Construction, .*40.*done/ }),
    ).toBeVisible()
    await expect(canvas.getByRole('columnheader', { name: 'Budget' })).toBeVisible()
    await expect(canvas.getByRole('img', { name: /^Now, / })).toBeInTheDocument()
    await expect(
      canvas.getByRole('region', { name: 'Timeline: Warehouse extension' }),
    ).toHaveAttribute('tabindex', '0')
    // View only: no Change menus.
    await expect(canvas.queryByRole('button', { name: /^Change / })).toBeNull()
  },
}

/** A column a day: the month above, the day's number below. */
export const Days: Story = {
  args: { defaultScale: 'days' },
}

/** Without budgets: the table has no money columns. */
export const WithoutBudget: Story = {
  name: 'Without budget',
  args: { tasks: PLAIN_TASKS },
  play: async ({ canvasElement }) => {
    await ganttReady(canvasElement)
    await expect(within(canvasElement).queryByRole('columnheader', { name: 'Budget' })).toBeNull()
  },
}

/** Editing: each task has its Change menu; the chosen row is marked (neutral). */
export const Edit: Story = {
  render: (args) => (
    <Controlled label={args.label} now={STORY_NOW} mode="edit" defaultSelected="frame" />
  ),
  play: async ({ canvasElement }) => {
    await ganttReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Change Steel frame' })).toBeVisible()
    // A phase's dates are the application's: no menu.
    await expect(canvas.queryByRole('button', { name: 'Change Construction' })).toBeNull()
  },
}

/** Move… open on a task, as an application restores it: the action, the task bold under it. */
export const MoveDialog: Story = {
  name: 'Move dialog',
  render: (args) => (
    <Controlled
      label={args.label}
      now={STORY_NOW}
      mode="edit"
      defaultDialog={{ type: 'move', id: 'frame' }}
    />
  ),
  play: async ({ canvasElement }) => {
    await ganttReady(canvasElement)
    const dialog = await within(canvasElement.ownerDocument.body).findByRole('dialog', {
      name: /Move\s*Steel frame/,
    })
    await expect(dialog).toHaveTextContent('The length stays the same.')
  },
}

/** Dependencies… open: what it comes after, with Remove, and a task to add. */
export const DependenciesDialog: Story = {
  name: 'Dependencies dialog',
  render: (args) => (
    <Controlled
      label={args.label}
      now={STORY_NOW}
      mode="edit"
      defaultDialog={{ type: 'dependencies', id: 'roof' }}
    />
  ),
  play: async ({ canvasElement }) => {
    await ganttReady(canvasElement)
    const dialog = await within(canvasElement.ownerDocument.body).findByRole('dialog', {
      name: /Dependencies\s*Roof and walls/,
    })
    await waitFor(async () => {
      await expect(within(dialog).getByRole('button', { name: 'Remove Steel frame' })).toBeVisible()
    })
  },
}

/** Set progress… open on the steel frame. */
export const ProgressDialog: Story = {
  name: 'Progress dialog',
  render: (args) => (
    <Controlled
      label={args.label}
      now={STORY_NOW}
      mode="edit"
      defaultDialog={{ type: 'progress', id: 'frame' }}
    />
  ),
  play: async ({ canvasElement }) => {
    await ganttReady(canvasElement)
    await within(canvasElement.ownerDocument.body).findByRole('dialog', {
      name: /Set progress\s*Steel frame/,
    })
  },
}

/** The keyboard way of a drag: Change → Move…, a new start, Move; the change is reported. */
export const MoveByKeyboard: Story = {
  name: 'Move by keyboard',
  tags: ['interaction'],
  render: (args) => <Controlled label={args.label} now={STORY_NOW} mode="edit" />,
  play: async ({ canvasElement }) => {
    await ganttReady(canvasElement)
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Change Roof and walls' }))
    await userEvent.click(await body.findByRole('menuitem', { name: 'Move…' }))
    const dialog = await body.findByRole('dialog', { name: /Move\s*Roof and walls/ })
    const start = within(dialog).getByRole('textbox', { name: /New start/ })
    await userEvent.clear(start)
    await userEvent.type(start, '11/09/2026')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Move' }))
    await waitFor(async () => {
      await expect(canvas.getByTestId('last-change')).toHaveTextContent(
        '{"type":"dates","id":"roof","start":"2026-11-09","end":"2026-12-04"}',
      )
    })
    await waitFor(async () => {
      await expect(canvas.getByRole('status')).toHaveTextContent(/^Roof and walls: /)
    })
  },
}

/** Dependencies… adds a task it comes after, then removes it; both are reported. */
export const DependencyByKeyboard: Story = {
  name: 'Dependency by keyboard',
  tags: ['interaction'],
  render: (args) => <Controlled label={args.label} now={STORY_NOW} mode="edit" />,
  play: async ({ canvasElement }) => {
    await ganttReady(canvasElement)
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Change Technical inspection' }))
    await userEvent.click(await body.findByRole('menuitem', { name: 'Dependencies…' }))
    const dialog = await body.findByRole('dialog', { name: /Dependencies\s*Technical inspection/ })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add' }))
    await waitFor(async () => {
      await expect(canvas.getByTestId('last-change')).toHaveTextContent('"type":"add-dependency"')
    })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Remove Roof and walls' }))
    await waitFor(async () => {
      await expect(canvas.getByTestId('last-change')).toHaveTextContent(
        '{"type":"remove-dependency","id":"d6"}',
      )
    })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Done' }))
  },
}

/** The plan as text: each phase with its dates, progress and money, its rows under it. */
export const List: Story = {
  args: { defaultView: 'list' },
  play: async ({ canvasElement }) => {
    await ganttReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Construction' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent('After: Foundations')
  },
}

/** Long names are cut in the table and on the bars; the names and the list keep them whole. */
export const LongNames: Story = {
  name: 'Long names',
  args: { tasks: LONG_TASKS },
}

export const Loading: Story = {
  args: { loading: true },
}

export const Failed: Story = {
  args: {
    error: {
      onRetry: () => {
        // The application fetches the plan again.
      },
    },
  },
  play: async ({ canvasElement }) => {
    await ganttReady(canvasElement)
    await expect(within(canvasElement).getByRole('button', { name: 'Try again' })).toBeVisible()
  },
}

export const Empty: Story = {
  args: { tasks: [] },
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toHaveTextContent('No tasks yet')
  },
}

/** A phone: the list by phase; Timeline shows the chart read-only. */
export const Phone: Story = {
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <Gantt {...args} mode="edit" />
      </div>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await ganttReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Open this plan on a larger screen to change it.')).toBeVisible()
    await expect(canvas.getByRole('heading', { name: 'Design' })).toBeVisible()
  },
}

/** A phone with the timeline: read-only, scrolling sideways inside its card. */
export const PhoneTimeline: Story = {
  name: 'Phone, timeline',
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <Gantt {...args} defaultView="timeline" />
      </div>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await ganttReady(canvasElement)
    await expect(within(canvasElement).queryByRole('table')).toBeNull()
  },
}

export const Arabic: Story = {
  render: (args) => (
    <StoryProvider locale="ar" today={STORY_TODAY}>
      <Gantt {...args} label="توسعة المستودع" tasks={ARABIC_TASKS} />
    </StoryProvider>
  ),
}

export const Japanese: Story = {
  render: (args) => (
    <StoryProvider locale="ja" today={STORY_TODAY}>
      <Gantt {...args} label="倉庫の増築" tasks={JAPANESE_TASKS} />
    </StoryProvider>
  ),
}
