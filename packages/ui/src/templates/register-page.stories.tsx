import type { Meta, StoryObj } from '@storybook/react-vite'
import { useMemo, useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { Button } from '../components/button'
import type { DataTableColumn } from '../components/data-table'
import type { DateRange } from '../components/date-field'
import { DateText } from '../components/display-text'
import { ARABIC, JAPANESE, LONG } from '../components/field-story-data'
import { PeriodField } from '../components/period-field'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { RegisterPage, type RegisterLock } from './register-page'
import {
  expectCorrectionLink,
  expectLocksMeetTable,
  manyTraining,
  TRAINING,
  type TrainingEntry,
} from './register-story-data'

const COLUMNS: DataTableColumn<TrainingEntry>[] = [
  { id: 'date', header: 'Trained on', numeric: true, cell: (row) => <DateText value={row.date} /> },
  { id: 'employee', header: 'Employee', cell: (row) => row.employee },
  { id: 'position', header: 'Position', cell: (row) => row.position },
  { id: 'training', header: 'Training', cell: (row) => row.training },
  { id: 'instructor', header: 'Instructor', cell: (row) => row.instructor },
  {
    id: 'valid',
    header: 'Valid until',
    numeric: true,
    cell: (row) => <DateText value={row.validUntil} />,
  },
]

const LOCKS: RegisterLock[] = [
  {
    key: 'h1',
    period: 'January–June 2026',
    reason: 'Sent to the labour inspection with the half-year report.',
    detail: 'Locked by Ivana Stojanović on 15.07.2026.',
  },
]

/** The application around the page: the period, the corrections, export and print. */
function Register({
  rows = TRAINING,
  layout,
  title = 'Safety-training register 2026',
  loading = false,
  virtualize = false,
  locks = LOCKS,
}: {
  rows?: TrainingEntry[]
  layout?: 'desktop' | 'phone'
  title?: string
  loading?: boolean
  virtualize?: boolean
  locks?: RegisterLock[]
}) {
  const [period, setPeriod] = useState<DateRange | null>({ start: '2026-01-01', end: '2026-12-31' })
  const [opened, setOpened] = useState('')
  return (
    <>
      <RegisterPage
        {...(layout === undefined ? {} : { layout })}
        title={title}
        subtitle="Kvadrat Gradnja d.o.o. · entries are corrected, never deleted"
        back={{ href: '#safety', label: 'Safety at work' }}
        actions={
          <>
            <Button intent="print" emphasis="secondary" label="Print" />
            <Button intent="export" label="Export" />
            <Button intent="create" label="New entry" />
          </>
        }
        period={<PeriodField label="Period" value={period} onChange={setPeriod} className="w-60" />}
        locks={locks}
        columns={COLUMNS}
        rows={loading ? [] : rows}
        loading={loading}
        getRowId={(row) => row.id}
        getRowLabel={(row) => `No. ${row.no}, ${row.employee}`}
        entry={(row) => ({
          number: row.no,
          ...(row.corrects === undefined ? {} : { corrects: row.corrects }),
          ...(row.correctedBy === undefined ? {} : { correctedBy: row.correctedBy }),
          ...(row.locked === undefined ? {} : { locked: row.locked }),
        })}
        rowActions={(row) => [
          {
            label: 'Correct entry',
            onSelect: () => {
              setOpened(`Correcting no. ${row.no}`)
            },
          },
        ]}
        onRowClick={(row) => {
          setOpened(`Opened no. ${row.no}`)
        }}
        count={rows.length}
        emptyAction={{ label: 'New entry', onClick: () => undefined }}
        virtualize={virtualize}
        mobile={{
          subtitle: (row) => row.training,
          details: ['date', 'valid'],
        }}
      />
      <p className="sr-only" role="status">
        {opened}
      </p>
    </>
  )
}

const meta = {
  title: 'Templates/RegisterPage',
  component: RegisterPage,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** a chronological register for a period — VAT records, the work-injury ' +
          'register, the safety-training register. **Entries are never deleted:** a correction ' +
          'is a new entry that refers to the old one ("Corrects no. 4"), and the old one is ' +
          'marked "Corrected by no. 9" — both links of the same look that scroll to the other ' +
          'entry and focus its number (also across 5,000 virtualized entries; `onGoToEntry` for ' +
          'an entry on another page). **Locked periods** are marked with a lock and words where ' +
          'the list starts (the reason and who locked it, from the application) and on each ' +
          'entry; a locked entry’s menu says why it cannot be changed. The period is chosen in ' +
          'the first row; print and export are the page’s actions. `virtualize` keeps thousands ' +
          'of entries responsive. The page owns its spacing: the locks band meets the table’s ' +
          'header, and the refetch loader stands at the end of the first row; the examples use ' +
          'the same component and look the same.\n\n' +
          '**When:** a record the law or the company keeps in order and never rewrites.\n\n' +
          '**When not:** a list of records that are edited and deleted (ListPage); an official ' +
          'form with numbered fields (StatutoryFormPage). The registers’ contents in these ' +
          'stories are illustrative.',
      },
    },
  },
  args: {
    title: 'Safety-training register 2026',
    columns: [],
    rows: [],
    getRowId: () => '',
    getRowLabel: () => '',
    entry: () => ({ number: '' }),
  },
  render: () => (
    <ExampleProvider>
      <Register />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof RegisterPage>

export default meta

type Story = StoryObj<typeof meta>

/**
 * The register: the lock over January–June, the correction both ways; a locked entry's menu says
 * why it cannot be changed, an open one offers "Correct entry".
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await expect(canvas.getByText('January–June 2026 is locked')).toBeVisible()
    await expectLocksMeetTable(canvasElement)
    // Both corrections are links to the other entry.
    await expectCorrectionLink(canvasElement, 'Corrects no. 4', '4')
    await expectCorrectionLink(canvasElement, 'Corrected by no. 9', '9')
    await userEvent.click(canvas.getByRole('button', { name: 'Actions: No. 4, Snežana Popović' }))
    const locked = await body.findByRole('menuitem', {
      name: 'Locked period: entries cannot be changed',
    })
    await expect(locked).toHaveAttribute('aria-disabled', 'true')
    await userEvent.keyboard('{Escape}')
    await userEvent.click(canvas.getByRole('button', { name: 'Actions: No. 9, Snežana Popović' }))
    await userEvent.click(await body.findByRole('menuitem', { name: 'Correct entry' }))
    await expect(canvas.getByText('Correcting no. 9')).toBeInTheDocument()
  },
}

/** No period locked yet. */
export const NoLock: Story = {
  name: 'Nothing locked',
  render: () => (
    <ExampleProvider>
      <Register locks={[]} rows={TRAINING.map((row) => ({ ...row, locked: false }))} />
    </ExampleProvider>
  ),
}

/** The first load: skeleton rows. */
export const Loading: Story = {
  render: () => (
    <ExampleProvider>
      <Register loading />
    </ExampleProvider>
  ),
}

/** An empty register for the period: "Nothing here yet" with the first step. */
export const Empty: Story = {
  render: () => (
    <ExampleProvider>
      <Register rows={[]} locks={[]} />
    </ExampleProvider>
  ),
}

/**
 * 5,000 entries, virtualized: fewer than 60 rows are drawn, the rest scroll in (measured in
 * docs/decisions.md "Liro patterns (Phase 5 part 1)").
 */
export const FiveThousand: Story = {
  name: '5,000 entries (virtualized)',
  render: () => {
    function Many() {
      const rows = useMemo(() => manyTraining(5000), [])
      return <Register rows={rows} virtualize />
    }
    return (
      <ExampleProvider>
        <Many />
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const rows = canvasElement.querySelectorAll('tbody tr[aria-rowindex]')
    await expect(rows.length).toBeGreaterThan(5)
    await expect(rows.length).toBeLessThan(60)
    await expect(canvasElement.querySelector('table')).toHaveAttribute('aria-rowcount', '5001')
    // From no. 12 to no. 4990, thousands of rows down, and back.
    await expectCorrectionLink(canvasElement, 'Corrected by no. 4990', '4990')
    await expectCorrectionLink(canvasElement, 'Corrects no. 12', '12')
  },
}

/** Long text wraps in the header and the lock. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <Register
        title={LONG.label}
        locks={[{ key: 'long', period: LONG.value, reason: LONG.description }]}
      />
    </ExampleProvider>
  ),
}

/** Phone width: the entries as a flat list, the number and correction under each. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="h-full overflow-y-auto">
          <Register layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const page = canvasElement.querySelector('[data-slot="register-page"]')
    await expect(page?.scrollWidth).toBeLessThanOrEqual(page?.clientWidth ?? 0)
  },
}

/** Arabic sample text, right to left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <Register
        title={ARABIC.label}
        locks={[{ key: 'ar', period: ARABIC.value, reason: ARABIC.reason }]}
      />
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <Register
        title={JAPANESE.label}
        locks={[{ key: 'ja', period: JAPANESE.value, reason: JAPANESE.reason }]}
      />
    </StoryProvider>
  ),
}
