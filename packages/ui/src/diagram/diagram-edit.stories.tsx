import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { PhoneFrame } from '../components/story-frames'
import { Diagram, type DiagramProps } from './diagram'
import {
  applyDiagramOperations,
  nextDiagramId,
  type DiagramConnection,
  type DiagramOperation,
  type DiagramStep,
} from './diagram-logic'
import {
  diagramReady,
  LEAVE_CONNECTIONS,
  LEAVE_PROBLEMS,
  LEAVE_STEPS,
  quiet,
} from './diagram-story-data'

/** One reported operation in words, for the story's log. */
function describe(operation: DiagramOperation): string {
  switch (operation.type) {
    case 'add-step':
      return `add-step ${operation.step.id} (${operation.step.kind})`
    case 'add-connection':
      return `add-connection ${operation.connection.from} → ${operation.connection.to}`
    case 'move-step':
      return `move-step ${operation.id} to ${String(operation.position.x)}, ${String(operation.position.y)}`
    case 'rename-step':
      return `rename-step ${operation.id}: ${operation.label}`
    case 'label-connection':
      return `label-connection ${operation.id}: ${operation.label ?? '—'}`
    default:
      return `${operation.type} ${operation.id}`
  }
}

/**
 * The application around an editing diagram: it applies each change to its own copy (as it
 * would before saving) and lists what was reported.
 */
function Editing(
  props: Omit<DiagramProps, 'steps' | 'connections' | 'label'> & {
    steps?: readonly DiagramStep[]
    connections?: readonly DiagramConnection[]
    label?: string
  },
) {
  const [model, setModel] = useState({
    steps: props.steps ?? LEAVE_STEPS,
    connections: props.connections ?? LEAVE_CONNECTIONS,
  })
  const [log, setLog] = useState<string[]>([])
  return (
    <div className="flex flex-col gap-3">
      <Diagram
        {...props}
        label={props.label ?? 'Leave request'}
        mode="edit"
        steps={model.steps}
        connections={model.connections}
        onChange={(operations) => {
          setModel((current) => applyDiagramOperations(current, operations))
          setLog((current) => [...current, ...operations.map(describe)])
        }}
      />
      {log.length > 0 && (
        <ol
          aria-label="Reported changes"
          className="m-0 flex list-none flex-col gap-0.5 p-0 font-mono text-xs text-secondary"
        >
          {log.map((line, index) => (
            <li key={index} className="bidi-content">
              {line}
            </li>
          ))}
        </ol>
      )}
    </div>
  )
}

function changes(canvasElement: HTMLElement): string {
  return within(canvasElement).queryByRole('list', { name: 'Reported changes' })?.textContent ?? ''
}

function focusedName(): string {
  return document.activeElement?.getAttribute('aria-label') ?? ''
}

const meta = {
  title: 'Components/Diagram/Edit',
  component: Diagram,
  parameters: {
    docs: {
      description: {
        component:
          '`mode="edit"`: the diagram reports every change through `onChange` as a list of ' +
          'operations (add-step, remove-step, rename-step, move-step, add-connection, ' +
          'remove-connection, label-connection) and saves nothing; `applyDiagramOperations` ' +
          'is what an application does with them before it saves.\n\n' +
          '**Adding:** the palette at the start — click a kind to add it after the chosen step ' +
          '(between it and its only next step), or drag it onto the diagram; "Add step after…" ' +
          'on the chosen step. **Connecting:** drag from a step’s end handle to another step, ' +
          'or "Connect to…" (a list of the steps it may lead to, with an optional condition). ' +
          '**Changing:** "Rename…" (or F2, or a double click), "Label…" on a chosen ' +
          'connection, "Remove" (or Delete). **Moving:** drag a step; or choose it with Enter ' +
          'and move it with the arrow keys (Shift: five times as far), Escape lets it go — ' +
          'every drag has another way (WCAG 2.5.7).\n\n' +
          '**Problems:** the application’s validation messages (`problems`) stand on their ' +
          'steps and connections in the danger colour and in a list ("3 problems") with Go to.\n\n' +
          '**Phones:** no editing; the diagram says to open it on a larger screen and shows ' +
          'it as in view.',
      },
    },
  },
  args: {
    label: 'Leave request',
    steps: LEAVE_STEPS,
    connections: LEAVE_CONNECTIONS,
    mode: 'edit',
  },
  render: (args) => <Editing {...args} />,
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
  },
} satisfies Meta<typeof Diagram>

export default meta

type Story = StoryObj<typeof meta>

/** A step chosen (as an application restores it): its actions in the bar above. */
export const Default: Story = {
  args: { defaultSelected: 'approve' },
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Add step after…' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Connect to…' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Rename…' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Add: User task' })).toBeVisible()
    const step = canvas.getByRole('group', { name: 'User task: Manager decides' })
    await expect(step.querySelector('[data-selected]')).not.toBeNull()
  },
}

/** Nothing chosen: the bar says how to begin. */
export const NothingChosen: Story = {
  name: 'Nothing chosen',
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    await expect(
      within(canvasElement).getByText('Choose a step or a connection to change it.'),
    ).toBeVisible()
  },
}

/** The application's check found three problems: on their steps and in the list. */
export const Problems: Story = {
  name: 'Validation problems',
  args: { problems: LEAVE_PROBLEMS },
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    const list = canvas.getByRole('region', { name: '3 problems' })
    await expect(list).toHaveTextContent('Tell the employee: Has no way out: connect it to an end.')
    await expect(list).toHaveTextContent(
      'Approved? → Record the leave: A decision needs a default path.',
    )
    await expect(
      canvas.getByRole('group', {
        name: 'Message: Tell the employee. 1 problem',
      }),
    ).toBeInTheDocument()
  },
}

/** Go to: the step takes the keyboard and is chosen. */
export const GoTo: Story = {
  name: 'Go to a problem',
  tags: ['interaction'],
  args: { problems: LEAVE_PROBLEMS },
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Go to Archive the request' }))
    await waitFor(async () => {
      await expect(focusedName()).toBe('Task: Archive the request. 1 problem')
    })
    await expect(canvas.getByRole('button', { name: 'Rename…' })).toBeVisible()
  },
}

/** An empty diagram: the palette and a hint. */
export const Empty: Story = {
  args: { steps: [], connections: [] },
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    await expect(
      within(canvasElement).getByText('Add the first step from the palette.'),
    ).toBeVisible()
  },
}

/** The palette, clicked: a task goes in between the chosen step and its next one. */
export const AddFromPalette: Story = {
  name: 'Add from the palette',
  tags: ['interaction'],
  args: { defaultSelected: 'approve' },
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Add: Task' }))
    await expect(changes(canvasElement)).toContain('add-step step-1 (task)')
    await expect(changes(canvasElement)).toContain('remove-connection l2')
    await expect(changes(canvasElement)).toContain('add-connection approve → step-1')
    await expect(changes(canvasElement)).toContain('add-connection step-1 → decision')
    await waitFor(async () => {
      await expect(focusedName()).toBe('Task: Task')
    })
    await expect(canvas.getByRole('status')).toHaveTextContent('Added Task.')
  },
}

/**
 * "Add step after…": a menu of the kinds the application offers (`palette`), and the
 * application's own ids for what is added (`newId`).
 */
export const AddStepAfter: Story = {
  name: 'Add step after',
  tags: ['interaction'],
  args: {
    defaultSelected: 'notify',
    palette: ['task', 'user-task', 'service-task', 'exclusive', 'end'],
    newId: (prefix, taken) => nextDiagramId(prefix === 'step' ? 'S' : 'F', taken),
  },
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button', { name: 'Add: Timer' })).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Add step after…' }))
    await expect(await within(document.body).findAllByRole('menuitem')).toHaveLength(5)
    await userEvent.click(await within(document.body).findByRole('menuitem', { name: 'End' }))
    await quiet()
    await expect(changes(canvasElement)).toContain('add-step S-1 (end)')
    await expect(changes(canvasElement)).toContain('add-connection notify → S-1')
  },
}

/** "Connect to…": choose the step and a condition. */
export const ConnectTo: Story = {
  name: 'Connect to',
  tags: ['interaction'],
  args: { defaultSelected: 'notify' },
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Connect to…' }))
    const dialog = await within(document.body).findByRole('dialog', {
      name: 'Connect to Tell the employee',
    })
    await quiet()
    await userEvent.click(within(dialog).getByRole('radio', { name: /Done/ }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Connect' }))
    await waitFor(async () => {
      await expect(within(document.body).queryByRole('dialog')).toBeNull()
    })
    await expect(changes(canvasElement)).toContain('add-connection notify → end')
    await expect(canvas.getByRole('status')).toHaveTextContent(
      'Connected Tell the employee to Done.',
    )
    await diagramReady(canvasElement)
  },
}

/** Rename with F2, from the keyboard. */
export const Rename: Story = {
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    canvas.getByRole('group', { name: 'Task: Archive the request' }).focus()
    await userEvent.keyboard('{F2}')
    const dialog = await within(document.body).findByRole('dialog', { name: /^Rename step / })
    await quiet()
    const name = within(dialog).getByRole('textbox', { name: 'Name' })
    await userEvent.clear(name)
    await userEvent.type(name, 'Archive the decision')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save' }))
    await waitFor(async () => {
      await expect(within(document.body).queryByRole('dialog')).toBeNull()
    })
    await expect(changes(canvasElement)).toContain('rename-step archive: Archive the decision')
    await expect(
      canvas.getByRole('group', { name: 'Task: Archive the decision' }),
    ).toBeInTheDocument()
    await diagramReady(canvasElement)
  },
}

/** Moving with the keyboard: Enter chooses, the arrows move by 8px, Escape lets go. */
export const KeyboardMove: Story = {
  name: 'Move with the keyboard',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    canvas.getByRole('group', { name: 'Task: Archive the request' }).focus()
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByRole('status')).toHaveTextContent('Archive the request chosen.')
    await userEvent.keyboard('{ArrowDown}{ArrowDown}')
    await expect(changes(canvasElement)).toMatch(/move-step archive to -?\d+, -?\d+/)
    await expect(canvas.getByRole('status')).toHaveTextContent('Moved Archive the request.')
    await userEvent.keyboard('{Escape}')
    await expect(canvas.getByRole('status')).toHaveTextContent('Archive the request let go.')
  },
}

/** Removing a connection from the keyboard: arrows to it, Delete. */
export const RemoveConnection: Story = {
  name: 'Remove a connection',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    const forward =
      getComputedStyle(canvasElement.querySelector('[data-slot="diagram"]') ?? canvasElement)
        .direction === 'rtl'
        ? '{ArrowLeft}'
        : '{ArrowRight}'
    canvas.getByRole('group', { name: 'Automatic task: Record the leave' }).focus()
    await userEvent.keyboard(forward)
    await expect(focusedName()).toBe('Connection from Record the leave to Done')
    await userEvent.keyboard('{Delete}')
    await expect(changes(canvasElement)).toContain('remove-connection l5')
  },
}

/** Dragging a kind from the palette onto the diagram (pointer events, as every drag). */
export const DragFromPalette: Story = {
  name: 'Drag from the palette',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    const entry = canvas.getByRole('button', { name: 'Add: Timer' })
    const area = canvasElement.querySelector('[data-slot="diagram-canvas"]')
    if (area === null) throw new Error('no canvas')
    const from = entry.getBoundingClientRect()
    const to = area.getBoundingClientRect()
    const start = { x: from.left + 20, y: from.top + 10 }
    const end = { x: to.left + to.width / 2, y: to.bottom - 60 }
    const user = userEvent.setup()
    await user.pointer([
      { keys: '[MouseLeft>]', target: entry, coords: { clientX: start.x, clientY: start.y } },
      { coords: { clientX: start.x + 12, clientY: start.y + 4 } },
      { coords: { clientX: end.x, clientY: end.y } },
    ])
    await expect(canvasElement.querySelector('[data-slot="diagram-palette-ghost"]')).not.toBeNull()
    await user.pointer({ keys: '[/MouseLeft]', coords: { clientX: end.x, clientY: end.y } })
    await expect(changes(canvasElement)).toMatch(/add-step step-1 \(timer\)/)
  },
}

/** A phone: no editing; the diagram as in view, with where to edit it. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <Editing {...args} screen="phone" />
      </div>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(
      canvas.getByText('Open this diagram on a larger screen to change it.'),
    ).toBeVisible()
    await expect(canvas.queryByRole('button', { name: 'Add: Task' })).toBeNull()
  },
}
