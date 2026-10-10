import type { Meta, StoryObj } from '@storybook/react-vite'
import { BookCheck, Send } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { UnavailableAction } from '../components/actions'
import { Button } from '../components/button'
import { DataTable, type DataTableColumn } from '../components/data-table'
import { MoneyText } from '../components/display-text'
import { ARABIC, JAPANESE } from '../components/field-story-data'
import { KeyFigures } from '../components/key-figures'
import { StatusBadge } from '../components/status-badge'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import {
  PeriodicRunPage,
  type PeriodicRunPageProps,
  type RunCheck,
  type RunRerun,
  type RunStep,
} from './periodic-run-page'
import { payrollLines, payrollTotals, type PayrollLine } from './periodic-run-story-data'

const STEPS: RunStep[] = [
  { key: 'prepare', label: 'Prepare', description: '01.10.2026.' },
  { key: 'calculate', label: 'Calculate', description: '05.10.2026.' },
  { key: 'review', label: 'Review' },
  { key: 'post', label: 'Post' },
  { key: 'send', label: 'Send' },
]

const LINES = payrollLines(6)
const TOTALS = payrollTotals(LINES)

const CHECKS: RunCheck[] = [
  {
    id: 'calculated',
    label: 'Every employee calculated',
    result: 'passed',
    detail: '6 of 6 employees',
  },
  { id: 'accounts', label: 'Bank accounts of all employees', result: 'passed' },
  {
    id: 'minimum',
    label: 'Minimum wage respected',
    result: 'passed',
  },
  {
    id: 'overtime',
    label: 'Overtime within the limit',
    result: 'warning',
    detail: 'Over 8 hours a week: Marko Đorđević (11 h), Snežana Popović (9 h).',
    action: (
      <a href="#overtime" className="text-xs text-link">
        Open hours
      </a>
    ),
  },
  { id: 'payslips', label: 'Payslips ready to send', result: 'notRun' },
]

const COLUMNS: DataTableColumn<PayrollLine>[] = [
  { id: 'name', header: 'Employee', cell: (line) => line.name },
  { id: 'position', header: 'Position', cell: (line) => line.position },
  {
    id: 'gross',
    header: 'Gross',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.gross} currency="RSD" />,
  },
  {
    id: 'contributions',
    header: 'Contributions',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.contributions} currency="RSD" />,
  },
  {
    id: 'tax',
    header: 'Tax',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.tax} currency="RSD" />,
  },
  {
    id: 'net',
    header: 'Net',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.net} currency="RSD" />,
  },
]

/** The preview: the run's totals (computed in paras by the story's "Core") and the lines. */
function previewOf(phone: boolean) {
  return {
    description: 'Payslips and the journal entry are made from these figures when posting.',
    summary: (
      <KeyFigures
        layout={phone ? 'phone' : 'desktop'}
        items={[
          {
            key: 'gross',
            label: 'Gross',
            value: <MoneyText value={TOTALS.gross} currency="RSD" />,
          },
          {
            key: 'contributions',
            label: 'Contributions (employee)',
            value: <MoneyText value={TOTALS.contributions} currency="RSD" />,
          },
          { key: 'tax', label: 'Tax', value: <MoneyText value={TOTALS.tax} currency="RSD" /> },
          { key: 'net', label: 'Net', value: <MoneyText value={TOTALS.net} currency="RSD" /> },
        ]}
      />
    ),
    table: (
      <DataTable
        label="Payroll lines"
        columns={COLUMNS}
        rows={LINES}
        getRowId={(line) => line.id}
        getRowLabel={(line) => line.name}
        inCard
        layout={phone ? 'cards' : 'table'}
        totalsLabel="Total"
        totals={{
          gross: <MoneyText value={TOTALS.gross} currency="RSD" />,
          contributions: <MoneyText value={TOTALS.contributions} currency="RSD" />,
          tax: <MoneyText value={TOTALS.tax} currency="RSD" />,
          net: <MoneyText value={TOTALS.net} currency="RSD" />,
        }}
        mobile={{ subtitle: (line) => line.position, details: ['gross', 'net'] }}
      />
    ),
  }
}

const RERUN: RunRerun = {
  title: 'Rerun payroll for September 2026?',
  message: 'The calculated figures are replaced. Nothing has been posted or sent yet.',
  confirmLabel: 'Rerun',
  reasonLabel: 'Reason for the rerun',
  reasons: [
    { value: 'hours', label: 'Corrected working hours' },
    { value: 'sick', label: 'Sick leave reported late' },
    { value: 'other', label: 'Other' },
  ],
  onConfirm: () => undefined,
}

/** The payroll run of the stories: the review step, one warning, the period open. */
function PayrollRun({
  phone = false,
  noPreview = false,
  noRerun = false,
  noActions = false,
  ...rest
}: Partial<PeriodicRunPageProps> & {
  phone?: boolean
  noPreview?: boolean
  noRerun?: boolean
  noActions?: boolean
}) {
  return (
    <PeriodicRunPage
      title="Payroll September 2026"
      back={{ href: '#payroll', label: 'Payroll' }}
      status={<StatusBadge label="In review" tone="warning" />}
      subtitle="Kvadrat Gradnja d.o.o. · paid on 15.10.2026."
      steps={STEPS}
      active={2}
      lock={{ state: 'open', detail: 'Opened by Ivana Stojanović on 01.10.2026.' }}
      checks={CHECKS}
      {...(noPreview ? {} : { preview: previewOf(phone) })}
      {...(noActions
        ? {}
        : {
            actions: (
              <Button family="primary" icon={BookCheck} emphasis="primary" label="Post payroll" />
            ),
          })}
      {...(noRerun ? {} : { rerun: RERUN })}
      layout={phone ? 'phone' : 'desktop'}
      {...rest}
    />
  )
}

const meta = {
  title: 'Templates/PeriodicRunPage',
  component: PeriodicRunPage,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** a process run once per period — payroll, depreciation, closing a VAT ' +
          'period: its steps (prepare → calculate → review → post → send; names from the ' +
          'application), the checks of the current step (passed, warning, failed — in words and ' +
          'their tone), a preview before posting (the totals and the lines), the period’s lock ' +
          'state with who and when, the running step’s progress, and a rerun that asks for a ' +
          'reason first.\n\n' +
          '**When:** the application runs a batch over a period and a person checks it before ' +
          'it is posted.\n\n' +
          '**When not:** a multi-step form the user fills in (FormWizard); a document’s ' +
          'lifecycle (LifecycleBar); a single long job without steps (a progress dialog). The ' +
          'page decides nothing: what may be posted, the checks and the figures are the Core’s. ' +
          'Rates in the stories are illustrative.',
      },
    },
  },
  args: { title: '', steps: [], active: 0, lock: { state: 'open' } },
  render: () => (
    <ExampleProvider>
      <PayrollRun />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof PeriodicRunPage>

export default meta

type Story = StoryObj<typeof meta>

/** Review: one warning, the preview of the totals and the lines, the period open. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent(
      'Payroll September 2026',
    )
    await expect(canvasElement).toHaveTextContent('1 warning')
    await expect(canvasElement).toHaveTextContent('3 passed')
    await expect(canvasElement).toHaveTextContent('Period open')
    const current = canvasElement.querySelector('[aria-current="step"]')
    await expect(current).toHaveTextContent('Review')
  },
}

/** Calculating: the running step's progress. */
export const Running: Story = {
  name: 'Loading (step running)',
  render: () => (
    <ExampleProvider>
      <PayrollRun
        active={1}
        status={<StatusBadge label="Calculating" tone="info" />}
        checks={[]}
        progress={{
          label: 'Calculating payroll',
          value: 23,
          max: 46,
          current: 'Marko Petrović',
        }}
        noActions
        noRerun
        noPreview
      />
    </ExampleProvider>
  ),
}

/** A failed check: posting is unavailable, with the reason. */
export const Failed: Story = {
  name: 'Disabled with a reason (a failed check)',
  render: () => (
    <ExampleProvider>
      <PayrollRun
        checks={[
          ...CHECKS.slice(0, 1),
          {
            id: 'accounts',
            label: 'Bank accounts of all employees',
            result: 'failed',
            detail: 'Missing for Lazar Pavlović.',
          },
          ...CHECKS.slice(2),
        ]}
        actions={
          <UnavailableAction
            family="primary"
            icon={BookCheck}
            emphasis="primary"
            label="Post payroll"
            reason="A failed check must be fixed first."
          />
        }
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('1 failed')
    await expect(canvasElement).toHaveTextContent(
      'Unavailable: A failed check must be fixed first.',
    )
  },
}

/** Posted and sent: the period is locked; a rerun is unavailable, with the reason. */
export const Locked: Story = {
  name: 'Read-only (period locked)',
  render: () => (
    <ExampleProvider>
      <PayrollRun
        active={5}
        status={<StatusBadge label="Sent" tone="success" />}
        lock={{ state: 'locked', detail: 'Locked by Milica Petrović on 15.10.2026.' }}
        checks={CHECKS.map((check) => ({ ...check, result: 'passed' as const }))}
        actions={<Button intent="download" label="Payslips" />}
        rerun={{
          title: 'Rerun?',
          confirmLabel: 'Rerun',
          onConfirm: () => undefined,
          unavailableReason: 'The period is locked. Unlock it in the accounting periods first.',
        }}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Period locked')
    await expect(canvasElement).toHaveTextContent('Unavailable: The period is locked.')
    await expect(canvasElement.querySelector('[aria-current="step"]')).toBeNull()
  },
}

/** Prepared, nothing checked yet. */
export const Empty: Story = {
  name: 'Empty (not run yet)',
  render: () => (
    <ExampleProvider>
      <PayrollRun
        active={0}
        status={<StatusBadge label="Draft" tone="neutral" />}
        checks={CHECKS.map((check) => ({
          id: check.id,
          label: check.label,
          result: 'notRun' as const,
        }))}
        noPreview
        noRerun
        actions={<Button family="primary" icon={Send} emphasis="primary" label="Calculate" />}
      />
    </ExampleProvider>
  ),
}

/** The rerun asks for a reason; the run goes back to Calculate with its progress. */
export const Rerun: Story = {
  name: 'Rerun with a reason',
  tags: ['interaction'],
  render: function Render() {
    const [rerun, setRerun] = useState<string | null>(null)
    return (
      <PayrollRun
        {...(rerun === null
          ? {}
          : {
              active: 1,
              status: <StatusBadge label="Calculating" tone="info" />,
              checks: [],
              noPreview: true,
              noActions: true,
              progress: {
                label: 'Calculating payroll',
                value: 0,
                max: 6,
                current: rerun,
              },
            })}
        rerun={{
          title: 'Rerun payroll for September 2026?',
          message: 'The calculated figures are replaced. Nothing has been posted or sent yet.',
          confirmLabel: 'Rerun',
          reasonLabel: 'Reason for the rerun',
          reasons: [
            { value: 'hours', label: 'Corrected working hours' },
            { value: 'sick', label: 'Sick leave reported late' },
          ],
          onConfirm: (answer) => {
            setRerun(answer.reason === 'sick' ? 'Sick leave reported late' : 'Corrected hours')
          },
        }}
      />
    )
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <Story />
      </ExampleProvider>
    ),
  ],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Rerun' }))
    await settle()
    const dialog = within(document.body).getByRole('alertdialog')
    await expect(within(dialog).getByRole('button', { name: 'Cancel' })).toHaveFocus()
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Sick leave reported late' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Rerun' }))
    await settle()
    await expect(await canvas.findByText('0 of 6')).toBeVisible()
    await expect(canvas.getAllByText('Sick leave reported late')[0]).toBeVisible()
    await expect(canvasElement.querySelector('[aria-current="step"]')).toHaveTextContent(
      'Calculate',
    )
  },
}

/** Earlier steps can be opened to look at their checks (the application shows them). */
export const StepClick: Story = {
  name: 'Steps as buttons',
  render: function Render() {
    const [viewed, setViewed] = useState(2)
    return (
      <PayrollRun
        onStepClick={setViewed}
        checksTitle={`Checks: ${STEPS[viewed]?.label ?? ''}`}
        checks={viewed === 2 ? CHECKS : CHECKS.slice(0, 2)}
      />
    )
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <Story />
      </ExampleProvider>
    ),
  ],
  play: async () => {
    await settle()
  },
}

export const StepClickInteraction: Story = {
  name: 'Steps as buttons, interaction',
  tags: ['interaction'],
  render: function Render() {
    const [viewed, setViewed] = useState(2)
    return (
      <PayrollRun
        onStepClick={setViewed}
        checksTitle={`Checks: ${STEPS[viewed]?.label ?? ''}`}
        checks={viewed === 2 ? CHECKS : CHECKS.slice(0, 2)}
      />
    )
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <Story />
      </ExampleProvider>
    ),
  ],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /Calculate/ }))
    await expect(canvas.getByRole('heading', { name: 'Checks: Calculate' })).toBeVisible()
  },
}

/** Long names, details and figures wrap; amounts stay whole. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <PayrollRun
        title="Payroll September 2026, second part: the site workers of the Temerinski put hall extension"
        lock={{
          state: 'open',
          detail:
            'Opened by Ivana Stojanović on 01.10.2026. after the August period was closed and the corrections of the hours were approved by the site manager',
        }}
        checks={[
          {
            id: 'long',
            label:
              'Every employee with a fixed-term contract has an end date after the last day of the period',
            result: 'warning',
            detail:
              'Three contracts end within the period: Aleksandar Jovanović (15.09.2026.), Bojana Nikolić (20.09.2026.) and Dušan Pavlović (30.09.2026.). Check that their last salaries include the unused leave.',
          },
        ]}
      />
    </ExampleProvider>
  ),
}

/** Phone width: the step written out, the preview as a flat list. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="h-full overflow-y-auto">
          <PayrollRun phone />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Step 3 of 5 · Review')
    const page = canvasElement.querySelector('[data-slot="periodic-run-page"]')
    if (page === null) throw new Error('no page')
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
  },
}

/** Arabic text. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <PayrollRun
        title={ARABIC.value}
        subtitle={ARABIC.description}
        steps={[
          { key: 'a', label: 'تحضير' },
          { key: 'b', label: 'حساب' },
          { key: 'c', label: 'مراجعة' },
        ]}
        checks={[{ id: 'a', label: ARABIC.label, result: 'warning', detail: ARABIC.reason }]}
        noPreview
      />
    </StoryProvider>
  ),
}

/** Japanese text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <PayrollRun
        title={JAPANESE.value}
        subtitle={JAPANESE.description}
        steps={[
          { key: 'a', label: '準備' },
          { key: 'b', label: '計算' },
          { key: 'c', label: '確認' },
        ]}
        checks={[{ id: 'a', label: JAPANESE.label, result: 'failed', detail: JAPANESE.reason }]}
        noPreview
      />
    </StoryProvider>
  ),
}
