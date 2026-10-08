import type { Meta, StoryObj } from '@storybook/react-vite'
import { Download, RotateCcw, Send } from 'lucide-react'
import { useEffect, useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { SectionCard } from './cards'
import { Dialog } from './dialog'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { JobProgress, type JobFailure, type JobProgressProps, type JobState } from './job-progress'
import { ExampleProvider, expectContentDirection, PhoneFrame, StoryProvider } from './story-frames'

/** Customers of the example dataset, with their reasons for a failed delivery. */
const FAILED_TO: [string, string][] = [
  ['Drina Prevoz d.o.o.', 'The buyer is not registered for e-invoices in SEF.'],
  ['Medic Lab Niš d.o.o.', 'SEF did not answer in time. Send it again later.'],
  ['Stanić Elektro STR', 'The buyer’s PIB 112048376 is closed in the business register.'],
  ['Rakić Pekara SZR', 'The invoice date is in a closed VAT period.'],
  ['Bojović i sinovi d.o.o.', 'SEF did not answer in time. Send it again later.'],
]

/** Fourteen failed invoices: more than the list shows at once, so it scrolls. */
const FAILURES: JobFailure[] = Array.from({ length: 14 }, (_, index) => {
  const [customer, reason] = FAILED_TO[index % FAILED_TO.length] ?? ['', '']
  const number = `F-2026-0${String(271 + index * 7)}`
  return { key: number, label: `${number} · ${customer}`, reason }
})

const REPORT_ACTIONS = (
  <>
    <Button family="document" icon={Download} label="Download report" />
    <Button family="primary" icon={RotateCcw} label="Retry failed" />
  </>
)

const meta = {
  title: 'Components/Feedback/JobProgress',
  component: JobProgress,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a long job — sending 1.284 invoices to SEF, an import, a payroll run — ' +
          'while it runs and after it ends: the ProgressBar with "312 of 1.284" (both counts ' +
          'through `format.number`) and the item being worked on, Cancel, then the report: ' +
          '"Finished" or "Cancelled", the outcome lines with the application’s own counts and ' +
          'nouns ("1.270 invoices sent", "14 not sent"), the failed items with their reasons, ' +
          'and the application’s actions ("Download report", "Retry failed"). Without a total, a ' +
          'Spinner. It generalises "Progress in a dialog": the same component inline in a card ' +
          'or as a Dialog’s content (the dialog not dismissible while the job runs).\n\n' +
          '**When:** work that takes more than a few seconds and that the user waits for or ' +
          'comes back to.\n\n' +
          '**When not:** a short wait (a Button’s loading state, a Spinner); the states of a ' +
          'process over hours or days (StatusTimeline); a single upload (AttachmentList shows its ' +
          'own progress).',
      },
    },
  },
  args: {
    label: 'Sending invoices to SEF',
    state: 'running',
    done: 312,
    total: 1284,
    current: 'F-2026-0412 · Panonija Agro d.o.o.',
    onCancel: fn(),
  },
  render: (args) => (
    <ExampleProvider>
      <div className="max-w-140">
        <SectionCard title="Send to SEF">
          <JobProgress {...args} />
        </SectionCard>
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof JobProgress>

export default meta

type Story = StoryObj<typeof meta>

/** Running, inline in a card: the bar, "312 of 1.284", the current item, Cancel. */
export const Running: Story = {
  play: async ({ canvasElement, args }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('progressbar', { name: 'Sending invoices to SEF' })).toBeVisible()
    await expect(canvas.getByText('312 of 1.284')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))
    await expect(args.onCancel).toHaveBeenCalledOnce()
  },
}

/** The total is not known yet (loading): a Spinner with the label. */
export const UnknownTotal: Story = {
  name: 'Total not known (loading)',
  args: { label: 'Preparing the invoices…', done: 0 },
  render: (args) => (
    <ExampleProvider>
      <div className="max-w-140">
        <SectionCard title="Send to SEF">
          <JobProgress
            label={args.label}
            state={args.state}
            done={args.done}
            {...(args.onCancel === undefined ? {} : { onCancel: args.onCancel })}
          />
        </SectionCard>
      </div>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('progressbar')).toBeNull()
    await expect(canvas.getByText('Preparing the invoices…')).toBeVisible()
  },
}

/** After Cancel, while the job stops: "Cancelling…", disabled. */
export const Cancelling: Story = {
  args: { cancelling: true },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('button', { name: 'Cancelling…' })).toBeDisabled()
  },
}

/** Finished without failures. */
export const Finished: Story = {
  args: {
    state: 'finished',
    done: 1284,
    outcomes: [{ key: 'sent', text: '1.284 invoices sent', tone: 'success' }],
    actions: <Button family="document" icon={Download} label="Download report" />,
  },
}

/** Finished with failures (error): the reasons listed, scrolling; Retry failed. */
export const FinishedWithFailures: Story = {
  name: 'Finished with failures (error)',
  args: {
    state: 'finished',
    done: 1284,
    outcomes: [
      { key: 'sent', text: '1.270 invoices sent', tone: 'success' },
      { key: 'failed', text: '14 not sent', tone: 'danger' },
    ],
    failures: FAILURES,
    actions: REPORT_ACTIONS,
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('Finished')
    await expect(canvas.getByRole('status')).toHaveTextContent('14 not sent')
    await expect(canvas.getByRole('list', { name: 'Not done' })).toBeVisible()
    // Fourteen rows scroll inside 240px; the scrolling list takes the focus.
    const region = canvas.getByRole('region', { name: 'Not done' })
    await expect(region.scrollHeight).toBeGreaterThan(region.clientHeight)
    await expect(canvas.queryByRole('button', { name: 'Cancel' })).toBeNull()
  },
}

/** Cancelled: what was done before, neutral. */
export const Cancelled: Story = {
  args: {
    state: 'cancelled',
    outcomes: [
      { key: 'sent', text: '312 invoices sent before cancelling' },
      { key: 'left', text: '972 not sent' },
    ],
    actions: <Button family="primary" icon={Send} label="Send the rest" />,
  },
}

/** Plays the application: a job that advances, then reports. */
function useSimulatedJob(total: number, step: number) {
  const [running, setRunning] = useState(false)
  const [done, setDone] = useState(0)
  useEffect(() => {
    if (!running) return
    const timer = window.setInterval(() => {
      setDone((count) => Math.min(count + step, total))
    }, 60)
    return () => {
      window.clearInterval(timer)
    }
  }, [running, step, total])
  const state: JobState = done >= total ? 'finished' : 'running'
  return {
    done,
    state,
    start: () => {
      setDone(0)
      setRunning(true)
    },
  }
}

/**
 * In a dialog ("Progress in a dialog", generalised): not dismissible while it runs; the report and
 * a close button when it ends.
 */
export const InADialog: Story = {
  name: 'In a dialog',
  render: function Render(args: JobProgressProps) {
    const [open, setOpen] = useState(false)
    const job = useSimulatedJob(1284, 107)
    const finished = job.state === 'finished'
    return (
      <ExampleProvider>
        <Dialog
          open={open}
          onOpenChange={setOpen}
          title="Send to SEF"
          dismissible={finished}
          trigger={
            <Button
              family="primary"
              icon={Send}
              label="Send 1.284 invoices"
              onClick={() => {
                job.start()
              }}
            />
          }
        >
          <JobProgress
            label={args.label}
            state={job.state}
            done={job.done}
            total={1284}
            onCancel={() => {
              setOpen(false)
            }}
            {...(finished
              ? {
                  outcomes: [
                    { key: 'sent', text: '1.270 invoices sent', tone: 'success' as const },
                    { key: 'failed', text: '14 not sent', tone: 'danger' as const },
                  ],
                  failures: FAILURES.slice(0, 3),
                  actions: (
                    <>
                      <Button family="document" icon={Download} label="Download report" />
                      <Button
                        family="primary"
                        icon={RotateCcw}
                        label="Retry failed"
                        onClick={() => {
                          setOpen(false)
                        }}
                      />
                    </>
                  ),
                }
              : {})}
          />
        </Dialog>
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Send 1.284 invoices' }),
    )
    const body = within(document.body)
    const dialog = await body.findByRole('dialog', { name: 'Send to SEF' })
    // Running: no close button, the dialog stays.
    await expect(within(dialog).queryByRole('button', { name: 'Close' })).toBeNull()
    await waitFor(() => expect(within(dialog).getByRole('status')).toHaveTextContent('Finished'), {
      timeout: 5000,
    })
    await expect(within(dialog).getByRole('button', { name: 'Close' })).toBeVisible()
    await expect(within(dialog).getByText('1.270 invoices sent')).toBeVisible()
    await settle()
  },
}

/** Known progress in a dialog, as it looks while running. */
export const DialogRunning: Story = {
  name: 'In a dialog, running',
  render: (args) => (
    <ExampleProvider>
      <Dialog defaultOpen title="Send to SEF" dismissible={false}>
        <JobProgress {...args} />
      </Dialog>
    </ExampleProvider>
  ),
}

/** Long texts wrap; the current item is cut with "…" on its line. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    label: LONG.label,
    current: LONG.value,
  },
}

/** Long report texts. */
export const LongReport: Story = {
  name: 'Long text, report',
  args: {
    state: 'finished',
    label: LONG.label,
    outcomes: [{ key: 'a', text: LONG.description, tone: 'warning' }],
    failures: [{ key: 'a', label: LONG.value, reason: LONG.error }],
    actions: REPORT_ACTIONS,
  },
}

/** Phone width: the same, full width; the report's actions wrap. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  args: {
    state: 'finished',
    done: 1284,
    outcomes: [
      { key: 'sent', text: '1.270 invoices sent', tone: 'success' },
      { key: 'failed', text: '14 not sent', tone: 'danger' },
    ],
    failures: FAILURES.slice(0, 4),
    actions: REPORT_ACTIONS,
  },
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="box-border p-4">
          <SectionCard title="Send to SEF">
            <JobProgress {...args} />
          </SectionCard>
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const job = canvasElement.querySelector('[data-slot="job-progress"]')
    await expect(job?.scrollWidth).toBeLessThanOrEqual(job?.clientWidth ?? 0)
  },
}

/** Arabic sample text, right to left: the bar fills from the right. */
export const Arabic: Story = {
  args: { label: ARABIC.label, current: ARABIC.value },
  render: (args) => (
    <StoryProvider locale="ar">
      <div className="max-w-140">
        <JobProgress {...args} />
      </div>
    </StoryProvider>
  ),
}

/** Japanese sample text, the report. */
export const Japanese: Story = {
  args: {
    state: 'finished',
    label: JAPANESE.label,
    outcomes: [{ key: 'a', text: JAPANESE.description, tone: 'success' }],
    failures: [{ key: 'a', label: JAPANESE.value, reason: JAPANESE.error }],
  },
  render: (args) => (
    <StoryProvider locale="ja">
      <div className="max-w-140">
        <JobProgress {...args} />
      </div>
    </StoryProvider>
  ),
}

/** English in a right-to-left page (P3.6). */
export const EnglishInRtl: Story = {
  name: 'English in RTL',
  args: {
    state: 'finished',
    outcomes: [{ key: 'sent', text: '1.270 invoices sent', tone: 'success' }],
    failures: FAILURES.slice(0, 1),
  },
  render: (args) => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <div className="max-w-140">
          <JobProgress {...args} />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expectContentDirection(
      canvas.getByText('1.270 invoices sent'),
      canvas.getByText('The buyer is not registered for e-invoices in SEF.'),
    )
  },
}
