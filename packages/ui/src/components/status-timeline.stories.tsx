import type { Meta, StoryObj } from '@storybook/react-vite'
import { Download, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { SectionCard } from './cards'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { StatusTimeline, type StatusTimelineStep } from './status-timeline'
import { ExampleProvider, expectContentDirection, PhoneFrame, StoryProvider } from './story-frames'

/** The delivery of F-2026-0412 to SEF (the e-invoice system), as the P4.8 example dataset has it. */
const DELIVERY: StatusTimelineStep[] = [
  {
    key: 'prepared',
    label: 'Prepared',
    at: '2026-10-06T09:12:00+02:00',
    detail: 'by Dragan Ilić',
  },
  {
    key: 'sent',
    label: 'Sent to SEF',
    at: '2026-10-06T09:14:00+02:00',
    detail: 'SEF ID 2f6c81a4-3d1e-4b70-9a52-07c5e1d84b19',
  },
  { key: 'delivered', label: 'Delivered to the buyer' },
  { key: 'accepted', label: 'Accepted by the buyer' },
]

const meta = {
  title: 'Components/Feedback/StatusTimeline',
  component: StatusTimeline,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the states of one process in order — a delivery to the e-invoice ' +
          'system, a payment order, a bank import — with the current one highlighted, when each ' +
          'was reached (`format.dateTime`), and what comes next under the current state: ' +
          '"Delivery pending — action needed" with the application’s actions (Retry, ' +
          '"Export for manual upload"). A failed state shows its reason. The states, times and ' +
          'actions come from the application; the component decides nothing.\n\n' +
          '**When:** a process the user may have to push along, in a side panel or a section of ' +
          'a document.\n\n' +
          '**When not — which one:** the dots above a document’s header (LifecycleBar: Draft → ' +
          'Issued → Sent → Paid, one row); the full record of who changed what (HistoryList, ' +
          'P5.1); the compact list of comments in a side panel (ActivityList); steps the user ' +
          'goes through in a form (Stepper, FormWizard); a long job running now (JobProgress).',
      },
    },
  },
  args: {
    label: 'Delivery to SEF',
    steps: DELIVERY,
    current: 1,
    next: {
      title: 'Delivery pending — action needed',
      description:
        'SEF has not confirmed the delivery for 2 hours. Send it again, or export it and upload it in SEF by hand.',
      tone: 'warning',
      actions: (
        <>
          <Button family="neutral" icon={Download} label="Export for manual upload" />
          <Button family="primary" icon={RotateCcw} label="Retry" />
        </>
      ),
    },
  },
  render: (args) => (
    <ExampleProvider>
      <div className="max-w-120">
        <StatusTimeline {...args} />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof StatusTimeline>

export default meta

type Story = StoryObj<typeof meta>

/** Sent, not yet delivered: the next step with Retry and the manual export. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const list = canvas.getByRole('list', { name: 'Delivery to SEF' })
    const items = within(list).getAllByRole('listitem')
    await expect(items[1]).toHaveAttribute('aria-current', 'step')
    await expect(items[0]).toHaveTextContent('Completed')
    await expect(items[0]).toHaveTextContent('06.10.2026.')
    const next = canvas.getByRole('group', { name: /Delivery pending — action needed/ })
    await expect(items[1]).toContainElement(next)
    await expect(within(next).getByRole('button', { name: 'Retry' })).toBeVisible()
  },
}

/** The application handles the actions: Retry sends again, and the state moves on. */
export const RetryMovesOn: Story = {
  name: 'Retry moves on',
  render: function Render(args) {
    const [current, setCurrent] = useState(1)
    const retry = fn()
    return (
      <ExampleProvider>
        <div className="max-w-120">
          <StatusTimeline
            {...args}
            current={current}
            steps={DELIVERY.map((step, index) =>
              index === 2 && current >= 2 ? { ...step, at: '2026-10-06T11:20:00+02:00' } : step,
            )}
            {...(current === 1
              ? {
                  next: {
                    title: 'Delivery pending — action needed',
                    tone: 'warning' as const,
                    actions: (
                      <Button
                        family="primary"
                        icon={RotateCcw}
                        label="Retry"
                        onClick={() => {
                          retry()
                          setCurrent(2)
                        }}
                      />
                    ),
                  },
                }
              : { next: { title: 'Waiting for the buyer to accept or reject' } })}
          />
        </div>
      </ExampleProvider>
    )
  },
  play: async () => {
    await settle()
  },
}

export const RetryMovesOnInteraction: Story = {
  name: 'Retry moves on, interaction',
  tags: ['interaction'],
  render: function Render(args) {
    const [current, setCurrent] = useState(1)
    const retry = fn()
    return (
      <ExampleProvider>
        <div className="max-w-120">
          <StatusTimeline
            {...args}
            current={current}
            steps={DELIVERY.map((step, index) =>
              index === 2 && current >= 2 ? { ...step, at: '2026-10-06T11:20:00+02:00' } : step,
            )}
            {...(current === 1
              ? {
                  next: {
                    title: 'Delivery pending — action needed',
                    tone: 'warning' as const,
                    actions: (
                      <Button
                        family="primary"
                        icon={RotateCcw}
                        label="Retry"
                        onClick={() => {
                          retry()
                          setCurrent(2)
                        }}
                      />
                    ),
                  },
                }
              : { next: { title: 'Waiting for the buyer to accept or reject' } })}
          />
        </div>
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Retry' }))
    const items = within(canvas.getByRole('list')).getAllByRole('listitem')
    await expect(items[2]).toHaveAttribute('aria-current', 'step')
    await expect(canvas.getByText('Waiting for the buyer to accept or reject')).toBeVisible()
  },
}

/** All done: the last state is current, no next step. */
export const Completed: Story = {
  args: {
    current: 3,
    steps: DELIVERY.map((step, index) =>
      index === 2
        ? { ...step, at: '2026-10-06T09:31:00+02:00' }
        : index === 3
          ? { ...step, at: '2026-10-06T10:05:00+02:00', detail: 'by Panonija Agro d.o.o.' }
          : step,
    ),
  },
  render: (args) => (
    <ExampleProvider>
      <div className="max-w-120">
        <StatusTimeline label={args.label} steps={args.steps} current={args.current} />
      </div>
    </ExampleProvider>
  ),
}

/** A state that failed (error), with its reason, and the way on. */
export const Rejected: Story = {
  args: {
    current: 2,
    steps: [
      ...DELIVERY.slice(0, 2),
      {
        key: 'rejected',
        label: 'Rejected by SEF',
        at: '2026-10-06T09:16:00+02:00',
        error: 'The buyer’s PIB 104987265 is not registered for e-invoices.',
      },
    ],
    next: {
      title: 'Correct the buyer and send again',
      tone: 'danger',
      actions: <Button intent="edit" label="Edit invoice" />,
    },
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText(/is not registered for e-invoices/)).toBeVisible()
    const items = within(canvas.getByRole('list')).getAllByRole('listitem')
    await expect(items[2]).toHaveTextContent('Failed')
  },
}

/** Not started yet: the first state is current, the rest to come; a neutral next step. */
export const NotStarted: Story = {
  name: 'Not started (empty)',
  args: {
    current: 0,
    steps: DELIVERY.map((step) => ({ key: step.key, label: step.label })),
    next: { title: 'The invoice is sent to SEF when it is issued.' },
  },
}

/** In a side panel's place: a card section with the timeline as its body. */
export const InACard: Story = {
  name: 'In a card',
  render: (args) => (
    <ExampleProvider>
      <div className="max-w-100">
        <SectionCard title="Delivery">
          <StatusTimeline {...args} />
        </SectionCard>
      </div>
    </ExampleProvider>
  ),
}

/** Long names, details and next step: everything wraps, the dots stay on their line. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    steps: [
      { key: 'a', label: LONG.label, at: '2026-10-06T09:12:00+02:00', detail: LONG.value },
      { key: 'b', label: 'Sent', at: '2026-10-06T09:14:00+02:00', detail: LONG.description },
      { key: 'c', label: 'Delivered' },
    ],
    next: { title: LONG.error, description: LONG.description, tone: 'warning' },
  },
}

/** Phone width: the same list, full width; the actions wrap. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="box-border p-4">
          <StatusTimeline {...args} />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const list = within(canvasElement).getByRole('list', { name: 'Delivery to SEF' })
    const frame = list.parentElement
    await expect(frame?.scrollWidth).toBeLessThanOrEqual(frame?.clientWidth ?? 0)
  },
}

/** Arabic sample text, right to left: the dots and the line on the right. */
export const Arabic: Story = {
  args: {
    label: ARABIC.label,
    steps: [
      { key: 'a', label: ARABIC.options[0] ?? '', at: '2026-10-06T09:12:00+02:00' },
      { key: 'b', label: ARABIC.options[1] ?? '', detail: ARABIC.value },
      { key: 'c', label: ARABIC.options[2] ?? '' },
    ],
    next: { title: ARABIC.error, description: ARABIC.description, tone: 'warning' },
  },
  render: (args) => (
    <StoryProvider locale="ar">
      <div className="max-w-120">
        <StatusTimeline {...args} />
      </div>
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  args: {
    label: JAPANESE.label,
    steps: [
      { key: 'a', label: JAPANESE.options[0] ?? '', at: '2026-10-06T09:12:00+02:00' },
      { key: 'b', label: JAPANESE.options[1] ?? '', detail: JAPANESE.value },
      { key: 'c', label: JAPANESE.options[2] ?? '' },
    ],
    next: { title: JAPANESE.error, description: JAPANESE.description },
  },
  render: (args) => (
    <StoryProvider locale="ja">
      <div className="max-w-120">
        <StatusTimeline {...args} />
      </div>
    </StoryProvider>
  ),
}

/** English in a right-to-left page (P3.6). */
export const EnglishInRtl: Story = {
  name: 'English in RTL',
  render: (args) => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <div className="max-w-120">
          <StatusTimeline {...args} />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expectContentDirection(
      canvas.getByText('Sent to SEF'),
      canvas.getByText('by Dragan Ilić'),
      canvas.getByText(/SEF has not confirmed the delivery/),
    )
  },
}
