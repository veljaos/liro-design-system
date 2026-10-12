import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { PhoneFrame, StoryProvider } from '../components/story-frames'
import { Diagram } from './diagram'
import {
  APPROVAL_CONNECTIONS,
  APPROVAL_LANES,
  APPROVAL_STEPS,
  APPROVAL_STEPS_PLAIN,
  ARABIC_CONNECTIONS,
  ARABIC_STEPS,
  diagramReady,
  JAPANESE_CONNECTIONS,
  JAPANESE_STEPS,
  LONG_CONNECTIONS,
  LONG_STEPS,
} from './diagram-story-data'

/** The step a focus is on, by its accessible name. */
function focusedName(): string {
  return document.activeElement?.getAttribute('aria-label') ?? ''
}

/** Whether the story's page runs right to left. */
function rtl(canvasElement: HTMLElement): boolean {
  const diagram = canvasElement.querySelector('[data-slot="diagram"]') ?? canvasElement
  return getComputedStyle(diagram).direction === 'rtl'
}

const meta = {
  title: 'Components/Diagram/View',
  component: Diagram,
  parameters: {
    docs: {
      description: {
        component:
          '`@veljaos/ui/diagram` — a subpath of its own, so React Flow loads only where a ' +
          'diagram is used.\n\n' +
          '**What for:** a process of steps and connections — an approval, a workflow, an ' +
          'orchestrator’s job — in a BPMN-style notation drawn with Liro tokens: start, end, ' +
          'timer and message events (circles), tasks, user tasks and automatic tasks (boxes), ' +
          'sub-processes (a box with +), decisions and parallel paths (diamonds with X and +), ' +
          'lanes as labelled bands. Connections carry their conditions; the default path out ' +
          'of a decision has a slash near its start.\n\n' +
          '**Modes:** `view` (this page), `edit` and `run` (their own pages). Steps and ' +
          'connections are data; without positions the layout is automatic (dagre), from the ' +
          'leading edge (`layout="start-to-end"`, mirrored in right-to-left) or ' +
          '`"top-to-bottom"`. The view is fitted; zoom with the buttons; `minimap` adds an ' +
          'overview.\n\n' +
          '**Keyboard:** every step is a Tab stop in the flow’s order, named by its kind, ' +
          'name, lane and state; the arrow along the flow goes to the connection out of a step ' +
          'and on to the next step, the opposite arrow back; the other two arrows move between ' +
          'the connections out of one step (the branches of a decision). "Show steps as a ' +
          'list" is the diagram as text, for assistive technology and small screens.\n\n' +
          '**Phones:** the diagram fits the width; zoom in with the buttons, or read the list.\n\n' +
          '**When not:** a sequence of one record’s states (StatusTimeline, LifecycleBar); ' +
          'BPMN files (import and export are the application’s).',
      },
    },
  },
  args: {
    label: 'Approval of a supplier invoice',
    steps: APPROVAL_STEPS_PLAIN,
    connections: APPROVAL_CONNECTIONS,
  },
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
  },
} satisfies Meta<typeof Diagram>

export default meta

type Story = StoryObj<typeof meta>

/** The approval of a supplier invoice, laid out from the leading edge. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    const check = canvas.getByRole('group', { name: 'User task: Check the invoice' })
    await expect(check).toHaveAttribute('tabindex', '0')
    await expect(check).toHaveAccessibleDescription(/Tab moves between the steps/)
    await expect(
      canvas.getByRole('group', {
        name: 'Connection from Amount to Manager approves. Up to 100.000,00 RSD. Default',
      }),
    ).toBeInTheDocument()
    await expect(canvas.getByText('Above 100.000,00 RSD')).toBeVisible()
    await expect(canvasElement.querySelectorAll('[data-slot="diagram-default-mark"]').length).toBe(
      2,
    )
  },
}

/** The keyboard: Tab to a step, then along the connections and between the branches. */
export const Keyboard: Story = {
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    const forward = rtl(canvasElement) ? '{ArrowLeft}' : '{ArrowRight}'
    const back = rtl(canvasElement) ? '{ArrowRight}' : '{ArrowLeft}'
    canvas.getByRole('group', { name: 'Decision: Amount' }).focus()
    await expect(focusedName()).toBe('Decision: Amount')
    await userEvent.keyboard(forward)
    // The branch drawn first (the upper one) comes first; ArrowDown goes to the one below.
    await expect(focusedName()).toMatch(/^Connection from Amount to Director approves/)
    await userEvent.keyboard('{ArrowDown}')
    await expect(focusedName()).toMatch(/^Connection from Amount to Manager approves/)
    await userEvent.keyboard(forward)
    await expect(focusedName()).toBe('User task: Manager approves')
    await userEvent.keyboard(back)
    await userEvent.keyboard(back)
    await expect(focusedName()).toBe('Decision: Amount')
    await userEvent.keyboard('{Home}')
    await expect(focusedName()).toBe('Start: Invoice received')
    await userEvent.tab()
    await expect(focusedName()).toBe('User task: Check the invoice')
  },
}

/** Top to bottom: the same process from the top down; labels of events and decisions beside. */
export const TopToBottom: Story = {
  name: 'Top to bottom',
  args: { layout: 'top-to-bottom', height: 760 },
}

/** Lanes: who does each step, as labelled bands; the steps keep their order along the flow. */
export const Lanes: Story = {
  args: { steps: APPROVAL_STEPS, lanes: APPROVAL_LANES, height: 560 },
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Management')).toBeVisible()
    await expect(
      canvas.getByRole('group', { name: 'User task: Director approves. Lane: Management' }),
    ).toBeInTheDocument()
  },
}

/** Lanes from the top down: side by side. */
export const LanesTopToBottom: Story = {
  name: 'Lanes, top to bottom',
  args: { steps: APPROVAL_STEPS, lanes: APPROVAL_LANES, layout: 'top-to-bottom', height: 760 },
}

/** The overview in the end-bottom corner (`minimap`). */
export const Overview: Story = {
  args: { minimap: true },
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    await expect(
      within(canvasElement).getByRole('img', { name: 'Overview of the diagram' }),
    ).toBeVisible()
  },
}

/** Long names wrap inside their boxes and under their shapes; long conditions wrap too. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    label: 'A purchase request',
    steps: LONG_STEPS,
    connections: LONG_CONNECTIONS,
    // The application's own class: here a narrower diagram, where the names wrap all the more.
    className: 'max-w-200',
  },
}

/** The steps as a list: the diagram's text alternative (opened as an application restores it). */
export const StepsList: Story = {
  name: 'Steps list',
  args: { steps: APPROVAL_STEPS, lanes: APPROVAL_LANES, defaultView: 'steps' },
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const list = within(canvasElement).getByRole('list', { name: 'Approval of a supplier invoice' })
    await expect(list).toHaveTextContent(
      'Next: Manager approves (Up to 100.000,00 RSD), Director approves (Above 100.000,00 RSD)',
    )
    await expect(list).toHaveTextContent('Lane: Management')
    await expect(
      within(canvasElement).getByRole('button', { name: 'Show the diagram' }),
    ).toBeVisible()
  },
}

/** Switching between the diagram and the list. */
export const StepsListInteraction: Story = {
  name: 'Steps list, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Show steps as a list' }))
    await expect(canvas.getByRole('list', { name: 'Approval of a supplier invoice' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Show the diagram' }))
    await diagramReady(canvasElement)
    await expect(canvas.getByRole('group', { name: 'Task: Pay the supplier' })).toBeInTheDocument()
  },
}

/** Loading: a skeleton in the canvas's place. */
export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvasElement }) => {
    await expect(
      within(canvasElement).getByRole('status', { name: 'Loading the diagram' }),
    ).toBeVisible()
  },
}

/** No steps yet. */
export const Empty: Story = {
  args: { steps: [], connections: [] },
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    await expect(within(canvasElement).getByText('No steps yet')).toBeVisible()
  },
}

/** The diagram could not be fetched: the message and Retry. */
export const Failed: Story = {
  name: 'Error',
  args: { error: { onRetry: () => undefined } },
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    await expect(within(canvasElement).getByRole('alert')).toHaveTextContent(
      'The diagram could not be loaded.',
    )
    await expect(within(canvasElement).getByRole('button', { name: 'Retry' })).toBeEnabled()
  },
}

/** A phone: the diagram fits the width; the zoom buttons and the list are at hand. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <Diagram {...args} screen="phone" />
      </div>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Zoom in' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show steps as a list' })).toBeVisible()
  },
}

/** A phone, the steps as a list. */
export const PhoneSteps: Story = {
  name: 'Phone, steps list',
  args: { steps: APPROVAL_STEPS, lanes: APPROVAL_LANES, defaultView: 'steps' },
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <Diagram {...args} screen="phone" />
      </div>
    </PhoneFrame>
  ),
}

/** Arabic: the flow runs from the right; names and conditions keep their own order. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div lang="ar">
        <Diagram
          label="اعتماد فاتورة المورد"
          steps={ARABIC_STEPS}
          connections={ARABIC_CONNECTIONS}
        />
      </div>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <div lang="ja">
        <Diagram
          label="仕入先請求書の承認"
          steps={JAPANESE_STEPS}
          connections={JAPANESE_CONNECTIONS}
        />
      </div>
    </StoryProvider>
  ),
}

/** English in a right-to-left page: the layout is mirrored, the English names keep their order. */
export const EnglishInRtl: Story = {
  name: 'English in RTL',
  render: (args) => (
    <StoryProvider direction="rtl">
      <Diagram {...args} />
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const received = within(canvasElement).getByRole('group', { name: 'Start: Invoice received' })
    const paid = within(canvasElement).getByRole('group', { name: 'End: Paid' })
    // Mirrored: the start stands to the right of the end.
    await expect(received.getBoundingClientRect().left).toBeGreaterThan(
      paid.getBoundingClientRect().left,
    )
  },
}
