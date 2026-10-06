import type { Meta, StoryObj } from '@storybook/react-vite'
import { Printer } from 'lucide-react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '../components/button'
import { KeyValueList } from '../components/cards'
import { DataTable } from '../components/data-table'
import { DateRangeText, DateText, MoneyText } from '../components/display-text'
import { StatusBadge } from '../components/status-badge'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { AppShell } from './app-shell'
import { DetailPage, type DetailPageProps, type DetailSection } from './detail-page'
import { BRAND, COMMANDS, COMPANIES, EMPLOYEE, HR_TABS, USER } from './shell-story-data'

interface LeaveRow {
  id: string
  kind: string
  from: string
  to: string
  days: string
  status: 'Approved' | 'Requested'
}

const LEAVE: LeaveRow[] = [
  {
    id: '1',
    kind: 'Annual leave',
    from: '2026-07-20',
    to: '2026-08-07',
    days: '15',
    status: 'Approved',
  },
  {
    id: '2',
    kind: 'Sick leave',
    from: '2026-03-09',
    to: '2026-03-11',
    days: '3',
    status: 'Approved',
  },
  {
    id: '3',
    kind: 'Annual leave',
    from: '2026-12-28',
    to: '2026-12-31',
    days: '4',
    status: 'Requested',
  },
]

const SECTIONS: DetailSection[] = [
  {
    id: 'personal',
    label: 'Personal',
    content: (
      <KeyValueList
        items={[
          { label: 'Date of birth', value: <DateText value={EMPLOYEE.birthDate} />, numeric: true },
          { label: 'Personal ID', value: EMPLOYEE.personalId, numeric: true },
          { label: 'Phone', value: EMPLOYEE.phone, numeric: true },
          { label: 'E-mail', value: EMPLOYEE.email },
          { label: 'Address', value: EMPLOYEE.address, fullWidth: true },
        ]}
      />
    ),
  },
  {
    id: 'employment',
    label: 'Employment',
    actions: <Button intent="edit" label="Edit" />,
    content: (
      <KeyValueList
        items={[
          { label: 'Position', value: EMPLOYEE.position },
          { label: 'Department', value: EMPLOYEE.department },
          { label: 'Contract', value: EMPLOYEE.contract },
          {
            label: 'Contract period',
            value: <DateRangeText from={EMPLOYEE.since} to={EMPLOYEE.contractEnd} />,
            numeric: true,
          },
          { label: 'Working hours', value: EMPLOYEE.hours },
          { label: 'Manager', value: EMPLOYEE.manager },
        ]}
      />
    ),
  },
  {
    id: 'payroll',
    label: 'Payroll',
    content: (
      <KeyValueList
        items={[
          {
            label: 'Gross salary',
            value: <MoneyText value={EMPLOYEE.gross} currency="RSD" />,
            numeric: true,
          },
          { label: 'Bank account', value: EMPLOYEE.account, numeric: true },
          { label: 'Tax relief', value: 'Standard' },
          { label: 'Pension fund', value: 'PIO Fund of Serbia' },
        ]}
      />
    ),
  },
  {
    id: 'leave',
    label: 'Leave',
    flush: true,
    content: (
      <DataTable
        label="Leave"
        inCard
        columns={[
          { id: 'kind', header: 'Kind', cell: (row: LeaveRow) => row.kind },
          {
            id: 'period',
            header: 'Period',
            numeric: true,
            cell: (row: LeaveRow) => <DateRangeText from={row.from} to={row.to} />,
          },
          {
            id: 'days',
            header: 'Days',
            align: 'end',
            numeric: true,
            cell: (row: LeaveRow) => row.days,
          },
          {
            id: 'status',
            header: 'Status',
            cell: (row: LeaveRow) => (
              <StatusBadge
                label={row.status}
                tone={row.status === 'Approved' ? 'success' : 'warning'}
              />
            ),
          },
        ]}
        rows={LEAVE}
        getRowId={(row) => row.id}
        getRowLabel={(row) => `${row.kind} ${row.from}`}
      />
    ),
  },
]

/** The side column: the record's history and files (P5 brings the real panels). */
const SIDE = (
  <>
    <section className="flex flex-col gap-3 rounded-lg border border-solid border-default bg-surface-raised p-4">
      <h2 className="m-0 text-h5 text-primary">History</h2>
      <ol className="m-0 flex list-none flex-col gap-3 p-0 text-sm">
        <li className="flex flex-col gap-0.5">
          <span className="text-primary">Salary changed to 145.000,00 RSD</span>
          <span className="text-xs text-secondary">Dragan Ilić · 01.07.2026.</span>
        </li>
        <li className="flex flex-col gap-0.5">
          <span className="text-primary">Contract extended to 31.12.2026.</span>
          <span className="text-xs text-secondary">Milica Petrović · 15.12.2025.</span>
        </li>
      </ol>
    </section>
    <section className="flex flex-col gap-3 rounded-lg border border-solid border-default bg-surface-raised p-4">
      <h2 className="m-0 text-h5 text-primary">Attachments</h2>
      <ul className="m-0 flex list-none flex-col gap-2 p-0 text-sm text-primary">
        <li>Ugovor o radu 2025.pdf</li>
        <li>Aneks ugovora 01-2026.pdf</li>
      </ul>
    </section>
  </>
)

const BASE: DetailPageProps = {
  title: EMPLOYEE.name,
  back: { href: '#hr/employees', label: 'Employees' },
  status: <StatusBadge label="Active" tone="success" />,
  subtitle: `${EMPLOYEE.position} · ${EMPLOYEE.department}`,
  actions: (
    <>
      <Button family="document" icon={Printer} label="Print record" emphasis="secondary" />
      <Button intent="edit" label="Edit" />
    </>
  ),
  keyFigures: [
    {
      label: 'Net salary, September 2026',
      value: <MoneyText value={EMPLOYEE.net} currency="RSD" />,
    },
    { label: 'Leave left', value: `${EMPLOYEE.leaveLeft} days` },
    { label: 'Contract ends', value: <DateText value={EMPLOYEE.contractEnd} /> },
    { label: 'Sick leave this year', value: `${EMPLOYEE.sickDays} days` },
  ],
  sections: SECTIONS,
  side: SIDE,
}

function Shell({ phone = false, ...props }: Partial<DetailPageProps> & { phone?: boolean }) {
  return (
    <AppShell
      layout={phone ? 'phone' : 'desktop'}
      brand={BRAND}
      breadcrumbs={[{ label: 'Employees', href: '#hr/employees' }, { label: EMPLOYEE.name }]}
      commands={{ items: COMMANDS }}
      notifications={{ unread: 0, panel: <p className="m-0 text-sm">No notifications.</p> }}
      companies={{ items: COMPANIES, current: 'kvadrat', onSelect: () => undefined }}
      user={USER}
      moduleTabs={HR_TABS}
    >
      <DetailPage {...BASE} {...props} layout={phone ? 'phone' : 'desktop'} />
    </AppShell>
  )
}

const meta = {
  title: 'Templates/DetailPage',
  component: DetailPage,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** one record to read. The header: the back button to its list, the ' +
          'record’s name (its h1, visible), the status, a line under it and the actions; the ' +
          'key figures under it; the sections as cards; the side column (history, files, ' +
          'related records) 300px from 75em, under the content below. `sectionBar` adds the ' +
          'sticky row of section names for long pages.\n\n' +
          '**How:** `title`, `back`, `status`, `subtitle`, `actions`, `keyFigures`, `sections` ' +
          '(id, label, content), `side`.\n\n' +
          '**When not:** editing (RecordFormPage); a business document with lines (DocumentPage, ' +
          'P4.5).',
      },
    },
  },
  args: BASE,
  render: (args) => (
    <ExampleProvider>
      <Shell {...args} />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof DetailPage>

export default meta

type Story = StoryObj<typeof meta>

/** An employee's record: back, key figures, sections, side panels. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: EMPLOYEE.name })).toBeVisible()
    await expect(canvas.getByRole('link', { name: 'Back to Employees' })).toHaveAttribute(
      'href',
      '#hr/employees',
    )
  },
}

/** A long record with the section bar: a press scrolls to the section and marks it current. */
export const SectionBarStory: Story = {
  name: 'Section bar',
  args: { sectionBar: true },
  play: async ({ canvasElement }) => {
    await settle()
    const nav = within(within(canvasElement).getByRole('navigation', { name: 'Sections' }))
    await userEvent.click(nav.getByRole('link', { name: 'Payroll' }))
    await expect(nav.getByRole('link', { name: 'Payroll' })).toHaveAttribute(
      'aria-current',
      'location',
    )
    await expect(document.activeElement?.id).toBe('payroll')
    // Back to the first section at once (whatever element scrolls), so the picture does not
    // depend on the smooth scroll's timing.
    document.getElementById('personal')?.scrollIntoView({ behavior: 'instant', block: 'start' })
    await waitFor(async () => {
      await expect(nav.getByRole('link', { name: 'Personal' })).toHaveAttribute(
        'aria-current',
        'location',
      )
    })
  },
}

/** Without key figures or a side column. */
export const Simple: Story = {
  args: { keyFigures: [], side: undefined, sections: SECTIONS.slice(0, 2) },
}

/** Phone width: figures in two columns, the side column under the content. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <Shell {...args} phone />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Long names and values wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    title: 'Aleksandra Stefanović-Radosavljević',
    subtitle: 'Head of accounting and financial reporting · Finance and controlling',
  },
}

/** Arabic record names in a right-to-left page. */
export const Arabic: Story = {
  args: {
    title: 'ليلى حداد',
    subtitle: 'محاسبة أولى · المالية',
    back: { href: '#e', label: 'الموظفون' },
    sections: SECTIONS.slice(0, 1),
  },
  render: (args) => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <DetailPage {...BASE} {...args} layout="desktop" />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese record names. */
export const Japanese: Story = {
  args: {
    title: '佐藤 花子',
    subtitle: '主任会計士 · 経理部',
    back: { href: '#e', label: '従業員' },
    sections: SECTIONS.slice(0, 1),
  },
  render: (args) => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <DetailPage {...BASE} {...args} layout="desktop" />
      </ExampleProvider>
    </StoryProvider>
  ),
}
