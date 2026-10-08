import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { Button } from '../components/button'
import { BarChart, DonutChart, LineChart } from '../charts'
import { SectionCard } from '../components/cards'
import { DataTable } from '../components/data-table'
import { DateText, MoneyText } from '../components/display-text'
import { EmptyState } from '../components/empty-state'
import { PeriodField } from '../components/period-field'
import { SelectField } from '../components/select-field'
import { SwitchField } from '../components/checkbox-field'
import { ExampleProvider, percentText, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { AppShell } from './app-shell'
import { DashboardPage } from './dashboard-page'
import { CASH, LEDGER, REVENUE, TOP_CUSTOMERS, type LedgerRow } from './insight-story-data'
import { ReportPage } from './report-page'
import { SettingsPage } from './settings-page'
import { BRAND, COMMANDS, COMPANIES, USER } from './shell-story-data'

/*
 * DashboardPage, ReportPage and SettingsPage in one catalogue page ("Templates/Insight pages"),
 * each with its own stories.
 */

function Shell({ phone = false, children }: { phone?: boolean; children: React.ReactNode }) {
  return (
    <AppShell
      layout={phone ? 'phone' : 'desktop'}
      brand={BRAND}
      commands={{ items: COMMANDS }}
      notifications={{ unread: 0, panel: <p className="m-0 text-sm">No notifications.</p> }}
      companies={{ items: COMPANIES, current: 'kvadrat', onSelect: () => undefined }}
      user={USER}
    >
      {children}
    </AppShell>
  )
}

function Dashboard({ phone = false, loading = false }: { phone?: boolean; loading?: boolean }) {
  return (
    <Shell phone={phone}>
      <DashboardPage
        layout={phone ? 'phone' : 'desktop'}
        title="Overview"
        subtitle="Kvadrat Gradnja d.o.o. · September 2026"
        loading={loading}
        stats={[
          {
            key: 'revenue',
            label: 'Revenue, September',
            value: <MoneyText value="5684200.00" currency="RSD" />,
            change: { text: percentText('16.7', 'always'), direction: 'up', sentiment: 'good' },
            comparison: 'vs September 2025',
            trend: ['4812.4', '5230.9', '4977.1', '3906.5', '4421.8', '5684.2'],
          },
          {
            key: 'receivables',
            label: 'Overdue receivables',
            value: <MoneyText value="421740.00" currency="RSD" />,
            change: { text: percentText('8.2', 'always'), direction: 'up', sentiment: 'bad' },
            comparison: 'vs last week',
          },
          {
            key: 'cash',
            label: 'Cash',
            value: <MoneyText value="3012775.40" currency="RSD" />,
            change: { text: percentText('34.1', 'always'), direction: 'up', sentiment: 'good' },
            comparison: 'vs 31.08.2026.',
          },
          {
            key: 'vat',
            label: 'VAT due 15.10.',
            value: <MoneyText value="612480.00" currency="RSD" />,
          },
        ]}
      >
        <BarChart {...REVENUE} />
        <LineChart {...CASH} />
        <DonutChart
          title="Receivables by age"
          description="RSD, on 06.10.2026."
          currency="RSD"
          slices={[
            { key: 'current', label: 'Not due', value: '1842300.00', share: percentText('62.4') },
            {
              key: 'late30',
              label: 'Up to 30 days',
              value: '688120.50',
              share: percentText('23.3'),
            },
            {
              key: 'late',
              label: 'Over 30 days',
              value: '421740.00',
              share: percentText('14.3'),
              tone: 'danger',
            },
          ]}
        />
        <BarChart {...TOP_CUSTOMERS} orientation="horizontal" />
      </DashboardPage>
    </Shell>
  )
}

function Report({ phone = false, ran = false }: { phone?: boolean; ran?: boolean }) {
  const [hasRun, setHasRun] = useState(ran)
  return (
    <Shell phone={phone}>
      <ReportPage
        layout={phone ? 'phone' : 'desktop'}
        title="Account card"
        subtitle="Customers in the country"
        actions={<Button intent="export" label="Export" />}
        {...(ran ? { parametersOpen: false } : {})}
        parameters={
          <>
            <PeriodField
              label="Period"
              defaultValue={{ start: '2026-01-01', end: '2026-09-30' }}
              className="w-60"
            />
            <SelectField
              label="Account"
              defaultValue="2040"
              className="w-60"
              options={[
                { value: '2040', label: '2040 Customers in the country' },
                { value: '2050', label: '2050 Customers abroad' },
              ]}
            />
          </>
        }
        summary={[
          { key: 'period', label: 'Period', value: '01.01.–30.09.2026.' },
          { key: 'account', label: 'Account', value: '2040' },
        ]}
        onRun={() => {
          setHasRun(true)
        }}
      >
        {hasRun ? (
          <SectionCard flush>
            <DataTable
              inCard
              label="Account card 2040"
              layout={phone ? 'cards' : 'table'}
              columns={[
                {
                  id: 'date',
                  header: 'Date',
                  numeric: true,
                  cell: (row: LedgerRow) => <DateText value={row.date} />,
                },
                { id: 'document', header: 'Document', cell: (row: LedgerRow) => row.document },
                {
                  id: 'description',
                  header: 'Description',
                  cell: (row: LedgerRow) => row.description,
                },
                {
                  id: 'debit',
                  header: 'Debit',
                  align: 'end',
                  numeric: true,
                  cell: (row: LedgerRow) => <MoneyText value={row.debit} currency="RSD" />,
                },
                {
                  id: 'credit',
                  header: 'Credit',
                  align: 'end',
                  numeric: true,
                  cell: (row: LedgerRow) => <MoneyText value={row.credit} currency="RSD" />,
                },
                {
                  id: 'balance',
                  header: 'Balance',
                  align: 'end',
                  numeric: true,
                  cell: (row: LedgerRow) => <MoneyText value={row.balance} currency="RSD" />,
                },
              ]}
              rows={LEDGER}
              getRowId={(row) => row.id}
              getRowLabel={(row) => row.document}
              totals={{
                debit: <MoneyText value="122918.40" currency="RSD" />,
                credit: <MoneyText value="143918.40" currency="RSD" />,
                balance: <MoneyText value="1883211.40" currency="RSD" />,
              }}
              totalsLabel="Total"
              mobile={{
                subtitle: (row) => row.description,
                details: ['date', 'debit', 'credit', 'balance'],
              }}
            />
          </SectionCard>
        ) : (
          <EmptyState
            title="Choose the parameters and run the report"
            description="The account card appears here."
          />
        )}
      </ReportPage>
    </Shell>
  )
}

function Settings({ phone = false }: { phone?: boolean }) {
  const [sef, setSef] = useState(true)
  return (
    <Shell phone={phone}>
      <SettingsPage
        layout={phone ? 'phone' : 'desktop'}
        title="Sales settings"
        groups={[
          {
            key: 'invoices',
            label: 'Invoices',
            sections: [
              {
                key: 'sending',
                title: 'Sending',
                rows: [
                  {
                    key: 'sef',
                    label: 'Send invoices to SEF automatically',
                    description: 'When an invoice is issued, it goes to SEF at once.',
                    control: (
                      <SwitchField
                        label="Send invoices to SEF automatically"
                        hideLabel
                        checked={sef}
                        onChange={setSef}
                      />
                    ),
                    state: 'saved',
                  },
                  {
                    key: 'copy',
                    label: 'Send a copy to the customer by e-mail',
                    description: 'The PDF goes to the e-mail address on the customer’s card.',
                    control: (
                      <SwitchField
                        label="Send a copy to the customer by e-mail"
                        hideLabel
                        defaultChecked={false}
                      />
                    ),
                    state: 'error',
                    error: 'Could not save: the e-mail server is not set up.',
                  },
                ],
              },
              {
                key: 'numbering',
                title: 'Numbering',
                rows: [
                  {
                    key: 'series',
                    label: 'Number series',
                    description: 'Used for new invoices.',
                    control: (
                      <SelectField
                        label="Number series"
                        hideLabel
                        className="w-48"
                        defaultValue="f"
                        options={[
                          { value: 'f', label: 'F-YYYY-NNNN' },
                          { value: 'r', label: 'R-NNNNN' },
                        ]}
                      />
                    ),
                  },
                ],
              },
            ],
          },
          {
            key: 'payments',
            label: 'Payments',
            sections: [
              {
                key: 'terms',
                title: 'Terms',
                rows: [
                  {
                    key: 'days',
                    label: 'Default payment term',
                    control: (
                      <SelectField
                        label="Default payment term"
                        className="w-48"
                        defaultValue="15"
                        options={[
                          { value: '15', label: '15 days' },
                          { value: '30', label: '30 days' },
                        ]}
                      />
                    ),
                  },
                ],
              },
            ],
          },
        ]}
      />
    </Shell>
  )
}

const meta = {
  title: 'Templates/Insight pages',
  component: DashboardPage,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**DashboardPage** — numbers first (StatCards, four in a row from 62em), then charts ' +
          '(two in a row); restrained colour. **ReportPage** — the parameters in one row in a ' +
          'card with "Run report"; after a run they collapse into a one-line summary with ' +
          '"Edit"; the result under them; Export in the header. **SettingsPage** — sections of ' +
          'rows (name and description at the start, the control at the end) that save at once, ' +
          '"Saved" or the error in the row; several groups as tabs, never a side navigation.\n\n' +
          '**When not:** a list of records (ListPage); one record (DetailPage).',
      },
    },
  },
  args: { title: 'Overview' },
  render: () => (
    <ExampleProvider>
      <Dashboard />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof DashboardPage>

export default meta

type Story = StoryObj<typeof meta>

/** A dashboard: four numbers, then the charts. */
export const DashboardStory: Story = { name: 'Dashboard' }

/** The dashboard while loading: skeleton cards. */
export const DashboardLoading: Story = {
  name: 'Dashboard, loading',
  render: () => (
    <ExampleProvider>
      <Dashboard loading />
    </ExampleProvider>
  ),
}

/** The dashboard at phone width. */
export const DashboardPhone: Story = {
  name: 'Dashboard, phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <Dashboard phone />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** A report before its first run: the parameters open, an empty result. */
export const ReportStory: Story = {
  name: 'Report',
  render: () => (
    <ExampleProvider>
      <Report />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Run report' }))
    await expect(canvas.getByRole('button', { name: 'Edit' })).toBeVisible()
    await expect(canvas.getByRole('table', { name: 'Account card 2040' })).toBeVisible()
  },
}

/** A report after a run: the parameters as one line, the result below. */
export const ReportRan: Story = {
  name: 'Report, after a run',
  render: () => (
    <ExampleProvider>
      <Report ran />
    </ExampleProvider>
  ),
}

/** The report at phone width. */
export const ReportPhone: Story = {
  name: 'Report, phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <Report phone />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Settings: two groups as tabs, rows that save at once, "Saved" and an error. */
export const SettingsStory: Story = {
  name: 'Settings',
  render: () => (
    <ExampleProvider>
      <Settings />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('alert')).toHaveTextContent('Could not save')
    await expect(canvas.getByText('Saved')).toBeVisible()
  },
}

/** Settings at phone width: the controls under the descriptions. */
export const SettingsPhone: Story = {
  name: 'Settings, phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <Settings phone />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic settings in a right-to-left page. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <SettingsPage
          layout="desktop"
          title="إعدادات المبيعات"
          groups={[
            {
              key: 'a',
              label: 'الفواتير',
              sections: [
                {
                  key: 's',
                  title: 'الإرسال',
                  rows: [
                    {
                      key: 'r',
                      label: 'إرسال الفواتير تلقائيا',
                      description: 'عند إصدار الفاتورة تُرسل فورا.',
                      control: (
                        <SwitchField label="إرسال الفواتير تلقائيا" hideLabel defaultChecked />
                      ),
                      state: 'saved',
                    },
                  ],
                },
              ],
            },
          ]}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese dashboard numbers. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <DashboardPage
          layout="desktop"
          title="概要"
          stats={[
            {
              key: 'r',
              label: '売上高（9月）',
              value: <MoneyText value="5684200.00" currency="RSD" />,
              change: { text: percentText('16.7', 'always'), direction: 'up', sentiment: 'good' },
              comparison: '前年同月比',
            },
          ]}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}
