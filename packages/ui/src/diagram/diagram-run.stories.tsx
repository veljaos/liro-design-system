import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { PhoneFrame } from '../components/story-frames'
import { Diagram, type DiagramProps } from './diagram'
import type { DiagramRun } from './diagram-parts'
import {
  diagramReady,
  NIGHTLY_CONNECTIONS,
  NIGHTLY_DONE,
  NIGHTLY_FAILED,
  NIGHTLY_RUNNING,
  NIGHTLY_STEPS,
  NIGHTLY_WAITING,
} from './diagram-story-data'

/** The application around a run: Retry starts the failed step again, Skip goes past it. */
function Running(props: Omit<DiagramProps, 'run'> & { run: DiagramRun }) {
  const [run, setRun] = useState(props.run)
  return (
    <Diagram
      {...props}
      run={run}
      onStepAction={(stepId, action) => {
        setRun((current) => ({
          ...current,
          status: { label: 'Running', tone: 'neutral' },
          steps: {
            ...current.steps,
            [stepId]:
              action === 'retry'
                ? { state: 'running', note: 'Attempt 2' }
                : { state: 'skipped', reason: 'Skipped by Ana Petrović.' },
          },
        }))
      }}
    />
  )
}

const meta = {
  title: 'Components/Diagram/Run',
  component: Diagram,
  parameters: {
    docs: {
      description: {
        component:
          '`mode="run"`: one instance of the process — an orchestrator’s nightly job, an ' +
          'approval under way. Each step’s state from `run.steps` as an icon, words and a ' +
          'status tone: done (success), running (neutral, strong outline), waiting (warning), ' +
          'failed (danger, with its reason), skipped and not reached (dashed, muted). Never ' +
          'blue for a state (D17). The connections the run went along (`run.path`) are drawn ' +
          'strong, the others dashed. A failed step offers the application’s actions (Skip, ' +
          'Retry — the main one last) through `onStepAction`. Above the canvas: the run’s ' +
          'status, "4 of 11 steps done", the failures and the application’s line.\n\n' +
          '**When not:** a single record’s states without branches (StatusTimeline); the ' +
          'progress of one long job (JobProgress).',
      },
    },
  },
  args: {
    label: 'Nightly statement import',
    steps: NIGHTLY_STEPS,
    connections: NIGHTLY_CONNECTIONS,
    mode: 'run',
    run: NIGHTLY_FAILED,
  },
  render: (args) => <Running {...args} run={args.run ?? NIGHTLY_FAILED} />,
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
  },
} satisfies Meta<typeof Diagram>

export default meta

type Story = StoryObj<typeof meta>

/** A failed step: its reason, Skip and Retry; the path up to it drawn strong. */
export const Failed: Story = {
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByText('5 of 11 steps done')).toBeVisible()
    await expect(canvas.getByText('1 failed')).toBeVisible()
    await expect(
      canvas.getByRole('group', {
        name: 'Automatic task: Import the savings account. Failed. The bank did not answer in 30 s.',
      }),
    ).toBeInTheDocument()
    await expect(
      canvas.getByRole('button', { name: 'Retry: Import the savings account' }),
    ).toBeVisible()
    await expect(
      canvasElement.querySelectorAll('[data-slot="diagram-edge"][data-taken="true"]').length,
    ).toBe(6)
  },
}

/** Retry: the application starts the step again. */
export const Retry: Story = {
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Retry: Import the savings account' }))
    await expect(
      canvas.getByRole('group', { name: 'Automatic task: Import the savings account. Running' }),
    ).toBeInTheDocument()
    await expect(canvas.queryByText('1 failed')).toBeNull()
  },
}

/** Running: matching under way; what follows not reached yet. */
export const Running_: Story = {
  name: 'Running',
  args: { run: NIGHTLY_RUNNING },
}

/** Waiting for a person: the review of the lines that did not match. */
export const Waiting: Story = {
  args: { run: NIGHTLY_WAITING },
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    await expect(
      within(canvasElement).getByRole('group', {
        name: 'User task: Review what did not match. Waiting',
      }),
    ).toBeInTheDocument()
  },
}

/** Completed, one step skipped with its reason. */
export const Completed: Story = {
  args: { run: NIGHTLY_DONE },
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    await expect(within(canvasElement).getByText('10 of 11 steps done')).toBeVisible()
  },
}

/** The run as a list: each step's state, its reason and its actions. */
export const StepsList: Story = {
  name: 'Steps list',
  args: { defaultView: 'steps' },
  play: async ({ canvasElement }) => {
    await diagramReady(canvasElement)
    const list = within(canvasElement).getByRole('list', { name: 'Nightly statement import' })
    await expect(list).toHaveTextContent('The bank did not answer in 30 s.')
    await expect(
      within(list).getByRole('button', { name: 'Retry: Import the savings account' }),
    ).toBeVisible()
  },
}

/** Top to bottom, with the overview. */
export const TopToBottom: Story = {
  name: 'Top to bottom',
  args: { layout: 'top-to-bottom', height: 900, minimap: true },
}

/** A phone: the run fits the width; the summary above it. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <Running {...args} run={args.run ?? NIGHTLY_FAILED} screen="phone" />
      </div>
    </PhoneFrame>
  ),
}

/** A phone, the run as a list (the failed step's actions in reach). */
export const PhoneSteps: Story = {
  name: 'Phone, steps list',
  args: { defaultView: 'steps' },
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <Running {...args} run={args.run ?? NIGHTLY_FAILED} screen="phone" />
      </div>
    </PhoneFrame>
  ),
}
