import {
  CalendarClock,
  FileText,
  House,
  Languages,
  LogOut,
  PenLine,
  Plane,
  Send,
  Undo2,
  UserRound,
  Wallet,
} from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  Alert,
  Button,
  DataTable,
  DateRangeField,
  DateRangeText,
  DateText,
  Drawer,
  KeyFigures,
  KeyValueList,
  MoneyText,
  MyShifts,
  notice,
  PageHeader,
  PortalShell,
  PrintDetails,
  PrintPage,
  PrintSection,
  PrintTable,
  PrintTitle,
  SectionCard,
  SelectField,
  SignerList,
  DetailPage,
  StatusBadge,
  StatusTimeline,
  TextAreaField,
  TextField,
  Toaster,
  useLiro,
  type DataTableColumn,
  type MenuEntry,
  type MyShift,
  type PortalSection,
  type PrintColumn,
  type Signer,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, ROUTES } from './example-shell'
import { Tenant } from './screens-G'
import {
  ANNEX,
  annexSigners,
  CHANGE_REQUESTS,
  CHANGEABLE,
  CREW,
  DECEMBER_DRAFT,
  DECLINE_REASONS,
  DETAILS,
  DOCUMENT_TONES,
  DOCUMENTS,
  EMPLOYEE,
  HR_CONTACT,
  LEAVE_BALANCE,
  LEAVE_KINDS,
  LEAVE_REQUESTS,
  LEAVE_TONES,
  NIKOLA_SHIFTS,
  PAYSLIPS,
  SEPTEMBER,
  workingDays,
  Y_ROUTES,
  Y_TODAY,
  type ChangeRequest,
  type EmployeeDocument,
  type LeaveRequest,
  type Payslip,
  type PayslipLine,
} from './data-Y'

/*
 * Group Y's example screens (P5.35): the employee portal of Kvadrat Gradnja d.o.o. (PortalShell,
 * made for a phone first), as Nikola Marković, a site worker on Liman 4, sees it on 14.10.2026.
 * - Home: the latest payslip, the leave left, the next shift and what waits for his signature.
 * - Payslips: the list (DataTable, cards on a phone), one payslip (KeyFigures and KeyValueLists:
 *   hours, earnings, deductions, the account, what the employer pays on top) and its PDF (a
 *   PrintPage preview, as the application renders it).
 * - Leave: the balance (KeyFigures), the requests with their state (StatusBadge), one request's
 *   approval (StatusTimeline: submitted, the site manager, HR) and a new request (the
 *   application counts the working days).
 * - Shifts: MyShifts with "Request swap" to his crew.
 * - Documents: what waits for his signature and what he signed; an annex on a record page (DetailPage + SignerList) with
 *   SignerList (Sign, Decline with a reason). The signing itself is the application's.
 * - My details: what HR has, and change requests waiting for HR's approval (a Drawer for the
 *   request, D14).
 * Every figure is the application's (data-Y.ts); the screens use only `@veljaos/ui`.
 */

const LINK = 'text-link no-underline visited:text-link hover:underline'

export type SectionKey = 'home' | 'payslips' | 'leave' | 'shifts' | 'documents' | 'details'

const SECTIONS: PortalSection[] = [
  { key: 'home', label: 'Home', href: `#${Y_ROUTES.home}`, icon: House },
  { key: 'payslips', label: 'Payslips', href: `#${Y_ROUTES.payslips}`, icon: Wallet },
  { key: 'leave', label: 'Leave', href: `#${Y_ROUTES.leave}`, icon: Plane },
  { key: 'shifts', label: 'Shifts', href: `#${Y_ROUTES.shifts}`, icon: CalendarClock },
  {
    key: 'documents',
    label: 'Documents',
    href: `#${Y_ROUTES.documents}`,
    icon: PenLine,
    note: '1 to sign',
  },
]

function portalMenu(navigate: (path: string) => void): MenuEntry[] {
  return [
    {
      label: 'My details',
      icon: UserRound,
      onSelect: () => {
        navigate(Y_ROUTES.details)
      },
    },
    { label: 'Language: English', icon: Languages, onSelect: () => undefined },
    { type: 'separator' },
    {
      label: 'Sign out',
      icon: LogOut,
      onSelect: () => {
        navigate(ROUTES.signIn)
      },
    },
  ]
}

/** The portal's frame: PortalShell with the five sections, the tenant's digits and today. */
export function EmployeePortal({
  phone,
  current,
  children,
}: {
  phone: boolean
  current: SectionKey
  children: ReactNode
}) {
  const navigate = useContext(Navigate)
  return (
    <Tenant today={Y_TODAY}>
      <PortalShell
        layout={phone ? 'phone' : 'desktop'}
        brand={{
          brandName: 'Kvadrat Gradnja',
          productName: 'Employees',
          href: `#${Y_ROUTES.home}`,
        }}
        participant={{ name: EMPLOYEE.name, detail: `${EMPLOYEE.role} · ${EMPLOYEE.company}` }}
        menu={portalMenu(navigate)}
        sections={SECTIONS.map((section) =>
          section.key === current ? { ...section, current: true } : section,
        )}
        footer={`${HR_CONTACT} · Illustrative data`}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </PortalShell>
    </Tenant>
  )
}

/** A portal page: one column, centred on wide screens. */
export function Page({ wide = false, children }: { wide?: boolean; children: ReactNode }) {
  return (
    <div
      className={`mx-auto box-border flex w-full min-w-0 flex-col gap-4 p-4 sm:gap-6 sm:p-6 ${wide ? 'max-w-6xl' : 'max-w-3xl'}`}
    >
      {children}
    </div>
  )
}

/** A link inside a card, in the page's router. */
function To({ href, children }: { href: string; children: ReactNode }) {
  const { linkComponent: Link } = useLiro()
  return (
    <Link href={`#${href}`} className={`bidi-content self-start rounded-sm font-medium ${LINK}`}>
      {children}
    </Link>
  )
}

function monthName(month: string, format: ReturnType<typeof useLiro>['format']): string {
  const [year = '', number = '1'] = month.split('-')
  return `${format.monthName(Number(number), 'long')} ${year}`
}

// ── Home ──────────────────────────────────────────────────────────────────────────────────────

/** One thing on the home page: what, its detail, its one action or state. */
function HomeRow({
  title,
  detail,
  end,
}: {
  title: ReactNode
  detail?: ReactNode
  end?: ReactNode
}) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-0 border-b border-solid border-default pb-3 last:border-b-0 last:pb-0">
      <div className="flex min-w-0 flex-1 basis-56 flex-col gap-0.5">
        <span className="text-sm font-semibold text-primary bidi-content">{title}</span>
        {detail !== undefined && (
          <span className="text-sm text-secondary bidi-content">{detail}</span>
        )}
      </div>
      {end}
    </li>
  )
}

/**
 * The portal's home shows only what matters now (P5.93 item 11, the owner's review): the quick
 * actions, what waits for Nikola, and what is new for him — no grid of equal cards.
 */
export function EmployeeHome({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const latest = PAYSLIPS[0]
  const pending = LEAVE_REQUESTS.find((request) => request.state === 'Waiting for HR')
  const next = NIKOLA_SHIFTS.find((shift) => shift.date > Y_TODAY)
  const toSign = DOCUMENTS.find((document) => document.state === 'To sign')
  return (
    <EmployeePortal phone={phone} current="home">
      <Page>
        <PageHeader title="Hello, Nikola" subtitle={`${EMPLOYEE.role} · ${EMPLOYEE.site}`} />
        <div className="flex flex-wrap gap-2">
          <Button
            family="neutral"
            icon={CalendarClock}
            label="My shifts"
            onClick={() => {
              navigate(Y_ROUTES.shifts)
            }}
          />
          <Button
            family="neutral"
            icon={Wallet}
            label="Payslips"
            onClick={() => {
              navigate(Y_ROUTES.payslips)
            }}
          />
          <Button
            family="primary"
            emphasis="primary"
            icon={Plane}
            label="Request leave"
            onClick={() => {
              navigate(Y_ROUTES.newLeave)
            }}
          />
        </div>
        {toSign !== undefined && (
          <SectionCard title="To do" headingLevel={2}>
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              <HomeRow
                title={`Sign: ${toSign.title}`}
                detail={`By ${format.date(toSign.due ?? Y_TODAY)}`}
                end={
                  <Button
                    family="neutral"
                    icon={PenLine}
                    label="Open the annex"
                    onClick={() => {
                      navigate(Y_ROUTES.document(toSign.id))
                    }}
                  />
                }
              />
            </ul>
          </SectionCard>
        )}
        <SectionCard title="New for you" headingLevel={2}>
          <ul className="m-0 flex list-none flex-col gap-3 p-0">
            {next !== undefined && (
              <HomeRow
                title={
                  <To href={Y_ROUTES.shifts}>
                    {`Next shift: ${format.dateLong(next.date)}, ${next.start}–${next.end}`}
                  </To>
                }
                detail={`${next.label} · ${next.place ?? ''}`}
                {...(next.changed === undefined
                  ? {}
                  : { end: <StatusBadge label="Changed" tone="warning" /> })}
              />
            )}
            {latest !== undefined && (
              <HomeRow
                title={
                  <To href={Y_ROUTES.payslip(latest.month)}>{monthName(latest.month, format)}</To>
                }
                detail={
                  <>
                    Net pay <MoneyText value={latest.net} currency="RSD" />, paid{' '}
                    <DateText value={latest.paidOn} />
                  </>
                }
              />
            )}
            {pending !== undefined && (
              <HomeRow
                title={
                  <To
                    href={Y_ROUTES.leave}
                  >{`${pending.kind}, ${format.date(pending.from)} – ${format.date(pending.to)}`}</To>
                }
                detail={`${LEAVE_BALANCE.available} days left in ${LEAVE_BALANCE.year}`}
                end={<StatusBadge label={pending.state} tone={LEAVE_TONES[pending.state]} />}
              />
            )}
          </ul>
        </SectionCard>
      </Page>
    </EmployeePortal>
  )
}

// ── Payslips ──────────────────────────────────────────────────────────────────────────────────

export function PayslipsScreen({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const columns: DataTableColumn<Payslip>[] = [
    {
      id: 'month',
      header: 'Month',
      minWidth: 180,
      cell: (row) => (
        <span className="flex items-center gap-2">
          <To href={Y_ROUTES.payslip(row.month)}>{monthName(row.month, format)}</To>
          {row.isNew === true && <StatusBadge label="New" tone="info" />}
        </span>
      ),
    },
    { id: 'paid', header: 'Paid on', cell: (row) => <DateText value={row.paidOn} /> },
    {
      id: 'gross',
      header: 'Gross',
      align: 'end',
      numeric: true,
      cell: (row) => <MoneyText value={row.gross} currency="RSD" />,
    },
    {
      id: 'net',
      header: 'Net',
      align: 'end',
      numeric: true,
      cell: (row) => <MoneyText value={row.net} currency="RSD" />,
    },
  ]
  return (
    <EmployeePortal phone={phone} current="payslips">
      <Page>
        <PageHeader title="Payslips" subtitle="2026 · paid to your account at Banca Intesa" />
        <SectionCard flush>
          <DataTable
            label="Payslips"
            columns={columns}
            rows={PAYSLIPS}
            getRowId={(row) => row.month}
            getRowLabel={(row) => monthName(row.month, format)}
            inCard
            layout={phone ? 'cards' : 'table'}
            onRowOpen={(row) => {
              navigate(Y_ROUTES.payslip(row.month))
            }}
            mobile={{
              title: (row) => monthName(row.month, format),
              subtitle: (row) =>
                `Net ${format.money(row.net, 'RSD')} · paid ${format.date(row.paidOn)}`,
              badge: (row) => (row.isNew === true ? <StatusBadge label="New" tone="info" /> : null),
            }}
          />
        </SectionCard>
      </Page>
    </EmployeePortal>
  )
}

/** A payslip's lines as a key/value list, the amount at the end, the basis under the label. */
function lineItems(lines: readonly PayslipLine[]) {
  return lines.map((line) => ({
    key: line.key,
    label:
      line.basis === undefined ? (
        line.label
      ) : (
        <span className="flex flex-col">
          <span className="bidi-content">{line.label}</span>
          <span className="bidi-content text-xs text-secondary">{line.basis}</span>
        </span>
      ),
    value: <MoneyText value={line.amount} currency="RSD" />,
    numeric: true,
  }))
}

export function PayslipScreen({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const slip = SEPTEMBER
  return (
    <EmployeePortal phone={phone} current="payslips">
      <Page>
        <PageHeader
          title={`Payslip for ${monthName(slip.month, format)}`}
          back={{ href: `#${Y_ROUTES.payslips}`, label: 'Payslips' }}
          subtitle={`${slip.number} · ${format.date(slip.period.from)} – ${format.date(slip.period.to)}`}
          actions={
            <>
              <Button
                intent="download"
                label="Download PDF"
                onClick={() => {
                  notice.success(`${slip.number}.pdf is downloaded.`)
                }}
              />
              <Button
                intent="pdf"
                label="View PDF"
                onClick={() => {
                  navigate(Y_ROUTES.payslipPdf(slip.month))
                }}
              />
            </>
          }
        />
        <KeyFigures
          layout={phone ? 'phone' : 'desktop'}
          items={[
            { key: 'net', label: 'Net pay', value: <MoneyText value={slip.net} currency="RSD" /> },
            {
              key: 'gross',
              label: 'Gross pay',
              value: <MoneyText value={slip.gross} currency="RSD" />,
            },
            { key: 'paid', label: 'Paid on', value: <DateText value={slip.paidOn} /> },
          ]}
        />
        <SectionCard title="Hours" headingLevel={2}>
          <KeyValueList
            columns={1}
            items={slip.hours.map((each) => ({ ...each, numeric: true }))}
          />
        </SectionCard>
        <SectionCard title="Earnings" headingLevel={2}>
          <KeyValueList
            columns={1}
            items={[
              ...lineItems(slip.earnings),
              {
                key: 'gross',
                label: <strong>Gross pay</strong>,
                value: (
                  <strong>
                    <MoneyText value={slip.gross} currency="RSD" />
                  </strong>
                ),
                numeric: true,
              },
            ]}
          />
        </SectionCard>
        <SectionCard title="Deductions" headingLevel={2}>
          <KeyValueList
            columns={1}
            items={[
              ...lineItems(slip.deductions),
              {
                key: 'total',
                label: <strong>Deductions</strong>,
                value: (
                  <strong>
                    <MoneyText value={slip.deductionsTotal} currency="RSD" />
                  </strong>
                ),
                numeric: true,
              },
            ]}
          />
        </SectionCard>
        <SectionCard title="Paid to" headingLevel={2}>
          <KeyValueList
            columns={1}
            items={[
              {
                key: 'net',
                label: 'Net pay',
                value: <MoneyText value={slip.net} currency="RSD" />,
                numeric: true,
              },
              { key: 'account', label: 'Account', value: <bdi>{slip.account}</bdi>, numeric: true },
              { key: 'bank', label: 'Bank', value: slip.bank },
            ]}
          />
        </SectionCard>
        <SectionCard
          title="What Kvadrat Gradnja pays on top"
          description="Contributions the employer pays for you; they are not taken from your pay."
          headingLevel={2}
        >
          <KeyValueList
            columns={1}
            items={[
              ...lineItems(slip.employer),
              {
                key: 'cost',
                label: <strong>Your work costs the employer</strong>,
                value: (
                  <strong>
                    <MoneyText value={slip.cost} currency="RSD" />
                  </strong>
                ),
                numeric: true,
              },
            ]}
          />
        </SectionCard>
      </Page>
    </EmployeePortal>
  )
}

const SLIP_COLUMNS: PrintColumn<PayslipLine>[] = [
  { key: 'label', header: 'Item', cell: (line) => line.label },
  { key: 'basis', header: 'Basis', cell: (line) => line.basis ?? '', width: '42mm' },
  {
    key: 'amount',
    header: 'Amount',
    align: 'end',
    width: '36mm',
    cell: (line) => <MoneyText value={line.amount} currency="RSD" />,
  },
]

/** The payslip's PDF, as the application renders it: a bar with the way back, the sheet. */
export function PayslipPdfScreen() {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const slip = SEPTEMBER
  return (
    <Tenant today={Y_TODAY}>
      <div className="flex min-h-full w-full flex-col bg-surface-sunken font-sans">
        <header className="sticky top-0 z-10 box-border flex items-center gap-3 border-0 border-b border-solid border-default bg-surface-raised px-4 py-2 print:hidden">
          <Button
            intent="back"
            label="Back to the payslip"
            onClick={() => {
              navigate(Y_ROUTES.payslip(slip.month))
            }}
          />
          <p className="bidi-content m-0 min-w-0 flex-1 text-sm font-semibold text-primary">
            {`${slip.number}.pdf`}
          </p>
          <Button
            intent="print"
            label="Print"
            onClick={() => {
              window.print()
            }}
          />
        </header>
        <main className="flex min-w-0 flex-1 flex-col">
          <PrintPage
            title={`Payslip ${slip.number}`}
            footer={`${EMPLOYEE.company} · ${HR_CONTACT}`}
          >
            <div className="flex flex-col gap-6">
              <PrintTitle
                title="Payslip"
                number={slip.number}
                subtitle={`${monthName(slip.month, format)} · ${EMPLOYEE.company}`}
              />
              <PrintDetails
                items={[
                  { key: 'employee', label: 'Employee', value: EMPLOYEE.name },
                  {
                    key: 'number',
                    label: 'Employee number',
                    value: EMPLOYEE.number,
                    numeric: true,
                  },
                  { key: 'role', label: 'Position', value: EMPLOYEE.role },
                  {
                    key: 'period',
                    label: 'Period',
                    value: <DateRangeText from={slip.period.from} to={slip.period.to} />,
                    numeric: true,
                  },
                  {
                    key: 'paid',
                    label: 'Paid on',
                    value: <DateText value={slip.paidOn} />,
                    numeric: true,
                  },
                  {
                    key: 'account',
                    label: 'Account',
                    value: <bdi>{slip.account}</bdi>,
                    numeric: true,
                  },
                ]}
              />
              <PrintSection title="Earnings">
                <PrintTable
                  caption="Earnings"
                  columns={SLIP_COLUMNS}
                  rows={[
                    ...slip.earnings,
                    { key: 'gross', label: 'Gross pay', amount: slip.gross },
                  ]}
                  rowKey={(line) => line.key}
                  lineType={(line) => (line.key === 'gross' ? 'subtotal' : 'line')}
                />
              </PrintSection>
              <PrintSection title="Deductions">
                <PrintTable
                  caption="Deductions"
                  columns={SLIP_COLUMNS}
                  rows={[
                    ...slip.deductions,
                    { key: 'total', label: 'Deductions', amount: slip.deductionsTotal },
                  ]}
                  rowKey={(line) => line.key}
                  lineType={(line) => (line.key === 'total' ? 'subtotal' : 'line')}
                />
              </PrintSection>
              <p className="bidi-content m-0 text-md font-semibold text-primary">
                {`Net pay ${format.money(slip.net, 'RSD')}, paid ${format.date(slip.paidOn)}.`}
              </p>
              <PrintSection title="Paid by the employer on top">
                <PrintTable
                  caption="Paid by the employer"
                  columns={SLIP_COLUMNS}
                  rows={[
                    ...slip.employer,
                    { key: 'cost', label: 'Total cost of the work', amount: slip.cost },
                  ]}
                  rowKey={(line) => line.key}
                  lineType={(line) => (line.key === 'cost' ? 'subtotal' : 'line')}
                />
              </PrintSection>
            </div>
          </PrintPage>
        </main>
      </div>
    </Tenant>
  )
}

// ── Leave ─────────────────────────────────────────────────────────────────────────────────────

function LeaveBadge({ request }: { request: LeaveRequest }) {
  return <StatusBadge label={request.state} tone={LEAVE_TONES[request.state]} />
}

/** A new request just sent (the route carries it, as the Core's list would). */
const SENT_REQUEST: LeaveRequest = {
  id: 'LR-2026-032',
  kind: 'Annual leave',
  from: DECEMBER_DRAFT.from,
  to: '2026-12-28',
  days: '6',
  submitted: Y_TODAY,
  state: 'Waiting for site manager',
  steps: [],
  current: 0,
}

export function LeaveScreen({ phone, sent = false }: { phone: boolean; sent?: boolean }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const requests = sent ? [SENT_REQUEST, ...LEAVE_REQUESTS] : LEAVE_REQUESTS
  return (
    <EmployeePortal phone={phone} current="leave">
      <Page>
        <PageHeader
          title="Leave"
          subtitle={`Annual leave ${LEAVE_BALANCE.year}`}
          actions={
            <Button
              intent="create"
              label="Request leave"
              onClick={() => {
                navigate(Y_ROUTES.newLeave)
              }}
            />
          }
        />
        {sent && (
          <Alert tone="success" title="Request sent">
            {`${EMPLOYEE.manager} approves it first, then HR. You get a notification at each step.`}
          </Alert>
        )}
        <KeyFigures
          layout={phone ? 'phone' : 'desktop'}
          items={[
            { key: 'entitlement', label: 'Days this year', value: LEAVE_BALANCE.entitlement },
            { key: 'used', label: 'Taken', value: LEAVE_BALANCE.used },
            {
              key: 'requested',
              label: 'Waiting for approval',
              value: sent ? '11' : LEAVE_BALANCE.requested,
            },
            { key: 'available', label: 'Left', value: sent ? '0' : LEAVE_BALANCE.available },
          ]}
        />
        <SectionCard title="Requests" headingLevel={2}>
          <ul className="m-0 flex list-none flex-col p-0">
            {requests.map((request) => (
              <li
                key={request.id}
                className="flex flex-col gap-1 border-0 border-b border-solid border-subtle py-3 first:pt-0 last:border-b-0 last:pb-0"
              >
                <div className="flex flex-wrap items-start gap-x-3 gap-y-1">
                  <span className="flex min-w-0 flex-1 flex-col">
                    {request.steps.length > 0 ? (
                      <To href={Y_ROUTES.leaveRequest(request.id)}>
                        {`${request.kind}, ${format.date(request.from)} – ${format.date(request.to)}`}
                      </To>
                    ) : (
                      <span className="bidi-content font-medium text-primary">
                        {`${request.kind}, ${format.date(request.from)} – ${format.date(request.to)}`}
                      </span>
                    )}
                    <span className="bidi-content text-xs text-secondary">
                      {`${request.id} · ${request.days} working ${request.days === '1' ? 'day' : 'days'} · sent ${format.date(request.submitted)}`}
                    </span>
                  </span>
                  <LeaveBadge request={request} />
                </div>
                {request.reason !== undefined && (
                  <span className="bidi-content text-sm text-secondary">{request.reason}</span>
                )}
              </li>
            ))}
          </ul>
        </SectionCard>
      </Page>
    </EmployeePortal>
  )
}

export function LeaveRequestScreen({ phone, id }: { phone: boolean; id: string }) {
  const { format } = useLiro()
  const request = LEAVE_REQUESTS.find((each) => each.id === id) ?? LEAVE_REQUESTS[0]
  const [withdrawn, setWithdrawn] = useState(false)
  if (request === undefined) return null
  const waiting = request.state.startsWith('Waiting') && !withdrawn
  return (
    <EmployeePortal phone={phone} current="leave">
      <Page>
        <PageHeader
          title={request.id}
          back={{ href: `#${Y_ROUTES.leave}`, label: 'Leave' }}
          status={
            withdrawn ? (
              <StatusBadge label="Withdrawn" tone="neutral" />
            ) : (
              <LeaveBadge request={request} />
            )
          }
          subtitle={`${request.kind} · ${format.date(request.from)} – ${format.date(request.to)} · ${request.days} working days`}
        />
        <SectionCard title="Approval" headingLevel={2}>
          <StatusTimeline
            label={`Approval of ${request.id}`}
            steps={request.steps}
            current={request.current}
            {...(waiting
              ? {
                  next: {
                    title: `${EMPLOYEE.hr} (HR) approves next`,
                    description: 'You get a notification when it is decided.',
                    actions: (
                      <Button
                        family="neutral"
                        icon={Undo2}
                        label="Withdraw request"
                        onClick={() => {
                          setWithdrawn(true)
                          notice.success(`${request.id} withdrawn.`)
                        }}
                      />
                    ),
                  },
                }
              : {})}
          />
        </SectionCard>
        <SectionCard title="Details" headingLevel={2}>
          <KeyValueList
            columns={1}
            items={[
              { key: 'kind', label: 'Kind', value: request.kind },
              {
                key: 'dates',
                label: 'Dates',
                value: <DateRangeText from={request.from} to={request.to} />,
                numeric: true,
              },
              { key: 'days', label: 'Working days', value: request.days, numeric: true },
              {
                key: 'sent',
                label: 'Sent',
                value: <DateText value={request.submitted} />,
                numeric: true,
              },
              { key: 'note', label: 'Note', value: request.note ?? '' },
            ]}
          />
        </SectionCard>
      </Page>
    </EmployeePortal>
  )
}

export function NewLeaveScreen({ phone, draft = false }: { phone: boolean; draft?: boolean }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const [kind, setKind] = useState(draft ? DECEMBER_DRAFT.kind : 'annual')
  const [range, setRange] = useState<{ start: string | null; end: string | null }>(
    draft ? { start: DECEMBER_DRAFT.from, end: '2026-12-28' } : { start: null, end: null },
  )
  const [note, setNote] = useState(draft ? DECEMBER_DRAFT.note : '')
  const [missing, setMissing] = useState(false)
  // The application counts the working days of the range (weekends and holidays out).
  const days = workingDays(range.start, range.end)
  const over = days !== null && kind === 'annual' && Number(days) > Number(LEAVE_BALANCE.available)
  return (
    <EmployeePortal phone={phone} current="leave">
      <Page>
        <PageHeader title="Request leave" back={{ href: `#${Y_ROUTES.leave}`, label: 'Leave' }} />
        <SectionCard>
          <form
            noValidate
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              if (range.start === null || range.end === null) {
                setMissing(true)
                return
              }
              notice.success('Leave request sent to Snežana Popović.')
              navigate(`${Y_ROUTES.leave}?sent`)
            }}
          >
            <SelectField
              label="Kind"
              required
              value={kind}
              onChange={setKind}
              options={LEAVE_KINDS}
            />
            <DateRangeField
              label="Dates"
              required
              value={range}
              onChange={(next) => {
                setRange(next)
                setMissing(false)
              }}
              description={
                days === null
                  ? `You have ${LEAVE_BALANCE.available} days of annual leave left this year.`
                  : `${days} working ${days === '1' ? 'day' : 'days'} · ${LEAVE_BALANCE.available} left this year`
              }
              {...(missing ? { error: 'Choose the first and the last day.' } : {})}
            />
            {over && (
              <Alert tone="warning" title="More days than you have left">
                {`The request is sent as it is; HR decides how the ${format.number(String(Number(days) - Number(LEAVE_BALANCE.available)))} extra days are taken.`}
              </Alert>
            )}
            <TextAreaField label="Note for your site manager" value={note} onChange={setNote} />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                intent="cancel"
                label="Cancel"
                onClick={() => {
                  navigate(Y_ROUTES.leave)
                }}
              />
              <Button
                family="primary"
                icon={Send}
                emphasis="primary"
                type="submit"
                label="Send request"
              />
            </div>
          </form>
        </SectionCard>
      </Page>
    </EmployeePortal>
  )
}

// ── Shifts ────────────────────────────────────────────────────────────────────────────────────

export function EmployeeShiftsScreen({ phone }: { phone: boolean }) {
  const [shifts, setShifts] = useState<MyShift[]>(NIKOLA_SHIFTS)
  return (
    <EmployeePortal phone={phone} current="shifts">
      <Page>
        <MyShifts
          shifts={shifts}
          colleagues={() => CREW}
          onSwapSubmit={(request) => {
            const colleague = CREW.find((each) => each.id === request.colleagueId)
            setShifts((current) =>
              current.map((shift) =>
                shift.id === request.shiftId
                  ? {
                      ...shift,
                      swapState:
                        colleague === undefined
                          ? 'Swap requested · waiting for the site manager'
                          : `Swap requested with ${colleague.name} · waiting for the site manager`,
                    }
                  : shift,
              ),
            )
            notice.success(`Swap request sent to ${EMPLOYEE.manager}.`)
          }}
        />
      </Page>
    </EmployeePortal>
  )
}

// ── Documents ─────────────────────────────────────────────────────────────────────────────────

function DocumentBadge({ document }: { document: EmployeeDocument }) {
  return <StatusBadge label={document.state} tone={DOCUMENT_TONES[document.state]} />
}

export function DocumentsScreen({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const groups = [
    { title: 'To sign', items: DOCUMENTS.filter((each) => each.state === 'To sign') },
    { title: 'Signed', items: DOCUMENTS.filter((each) => each.state !== 'To sign') },
  ]
  return (
    <EmployeePortal phone={phone} current="documents">
      <Page>
        <PageHeader title="Documents" subtitle="What Kvadrat Gradnja sent you to sign" />
        {groups.map((group) => (
          <SectionCard key={group.title} title={group.title} headingLevel={2}>
            <ul className="m-0 flex list-none flex-col p-0">
              {group.items.map((document) => (
                <li
                  key={document.id}
                  className="flex flex-wrap items-start gap-x-3 gap-y-1 border-0 border-b border-solid border-subtle py-3 first:pt-0 last:border-b-0 last:pb-0"
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    {document.state === 'To sign' ? (
                      <To href={Y_ROUTES.document(document.id)}>{document.title}</To>
                    ) : (
                      <span className="bidi-content font-medium text-primary">
                        {document.title}
                      </span>
                    )}
                    <span className="bidi-content text-xs text-secondary">
                      {document.state === 'To sign'
                        ? `${document.kind} · sent ${format.date(document.sent)} · sign by ${format.date(document.due ?? document.sent)}`
                        : `${document.kind} · signed ${format.date(document.signedOn ?? document.sent)}`}
                    </span>
                  </span>
                  <DocumentBadge document={document} />
                  {document.state !== 'To sign' && (
                    <Button
                      intent="download"
                      label="Download PDF"
                      onClick={() => {
                        notice.success(`${document.id}.pdf is downloaded.`)
                      }}
                    />
                  )}
                </li>
              ))}
            </ul>
          </SectionCard>
        ))}
      </Page>
    </EmployeePortal>
  )
}

/** The annex as it is signed: its text on a sheet (the preview). */
function AnnexSheet() {
  return (
    <PrintPage title={ANNEX.title} pageNumbers={false}>
      <div className="flex flex-col gap-4">
        <PrintTitle
          title={ANNEX.title}
          subtitle="Kvadrat Gradnja d.o.o. · Novi Sad · illustrative"
        />
        <p className="bidi-content m-0 text-sm text-primary">{ANNEX.parties}</p>
        {ANNEX.articles.map((article) => (
          <PrintSection key={article.heading} title={article.heading} headingLevel={3}>
            <p className="bidi-content m-0 text-sm text-primary">{article.text}</p>
          </PrintSection>
        ))}
      </div>
    </PrintPage>
  )
}

export function AnnexScreen({ phone }: { phone: boolean }) {
  const document = DOCUMENTS[0]
  const [signers, setSigners] = useState<Signer[]>(annexSigners('waiting'))
  if (document === undefined) return null
  const mine = signers.find((each) => each.id === 'nikola')
  const update = (patch: Partial<Signer>) => {
    setSigners((list) => list.map((each) => (each.id === 'nikola' ? { ...each, ...patch } : each)))
  }
  const signerList = (
    <SignerList
      signers={signers}
      declineReasons={DECLINE_REASONS}
      declineMessage={`The annex goes back to ${EMPLOYEE.hr} (HR) with your reason.`}
      declineSubject={ANNEX.title}
      onSign={() => {
        update({ state: 'signed', at: '2026-10-14T09:42:00+02:00' })
        notice.success('Annex signed. Nenad Kovačević signs next.')
      }}
      onDecline={(_signer, answer) => {
        const reason = DECLINE_REASONS.find((each) => each.value === answer.reason)?.label
        update({
          state: 'declined',
          at: '2026-10-14T09:42:00+02:00',
          reason: [reason, answer.text].filter(Boolean).join(': '),
        })
      }}
    />
  )
  return (
    <EmployeePortal phone={phone} current="documents">
      <Page wide>
        <DetailPage
          layout={phone ? 'phone' : 'desktop'}
          title={document.id}
          back={{ href: `#${Y_ROUTES.documents}`, label: 'Documents' }}
          status={
            mine?.state === 'signed' ? (
              <StatusBadge label="Signed by you" tone="success" />
            ) : mine?.state === 'declined' ? (
              <StatusBadge label="Declined" tone="danger" />
            ) : (
              <StatusBadge label="To sign" tone="warning" />
            )
          }
          subtitle={document.title}
          actions={
            <Button
              intent="download"
              label="Download PDF"
              onClick={() => {
                notice.success(`${document.id}.pdf is downloaded.`)
              }}
            />
          }
          sections={[
            ...(phone ? [{ id: 'signers', label: 'Signers', content: signerList }] : []),
            { id: 'document', label: 'Document', flush: true, content: <AnnexSheet /> },
          ]}
          {...(phone
            ? {}
            : {
                side: (
                  <SectionCard title="Signers" headingLevel={2}>
                    {signerList}
                  </SectionCard>
                ),
              })}
        />
      </Page>
    </EmployeePortal>
  )
}

// ── My details ────────────────────────────────────────────────────────────────────────────────

function detailItems(
  items: readonly { key: string; label: string; value: string; date?: boolean }[],
) {
  return items.map((item) => ({
    key: item.key,
    label: item.label,
    value: item.date === true ? <DateText value={item.value} /> : <bdi>{item.value}</bdi>,
    ...(item.date === true ? { numeric: true } : {}),
  }))
}

export function MyDetailsScreen({ phone, open = false }: { phone: boolean; open?: boolean }) {
  const { format } = useLiro()
  const [requests, setRequests] = useState<ChangeRequest[]>(CHANGE_REQUESTS)
  const [drawer, setDrawer] = useState(open)
  const [field, setField] = useState(open ? 'address' : 'phone')
  const [value, setValue] = useState(open ? 'Narodnog fronta 12, 21000 Novi Sad' : '')
  const [reason, setReason] = useState(open ? 'Moved on 1 October.' : '')
  const [missing, setMissing] = useState(false)
  const chosen = CHANGEABLE.find((each) => each.value === field)
  const current = [...DETAILS.personal, ...DETAILS.pay].find((each) => each.key === field)
  return (
    <EmployeePortal phone={phone} current="details">
      <Page>
        <PageHeader
          title="My details"
          subtitle="What HR has about you. Changes are approved by HR."
          actions={
            <Button
              intent="edit"
              label="Request a change"
              onClick={() => {
                setDrawer(true)
              }}
            />
          }
        />
        <SectionCard title="Change requests" headingLevel={2}>
          <ul className="m-0 flex list-none flex-col p-0">
            {requests.map((request) => (
              <li
                key={request.id}
                className="flex flex-wrap items-start gap-x-3 gap-y-1 border-0 border-b border-solid border-subtle py-3 first:pt-0 last:border-b-0 last:pb-0"
              >
                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="bidi-content font-medium text-primary">{request.field}</span>
                  <span className="bidi-content text-sm text-secondary">
                    <del>{request.from}</del> → {request.to}
                  </span>
                  <span className="bidi-content text-xs text-secondary">
                    {`${request.id} · sent ${format.date(request.submitted)}`}
                  </span>
                </span>
                <StatusBadge
                  label={request.state}
                  tone={request.state === 'Approved' ? 'success' : 'warning'}
                />
              </li>
            ))}
          </ul>
        </SectionCard>
        <SectionCard title="Personal" headingLevel={2}>
          <KeyValueList columns={1} items={detailItems(DETAILS.personal)} />
        </SectionCard>
        <SectionCard title="Work" headingLevel={2}>
          <KeyValueList columns={1} items={detailItems(DETAILS.work)} />
        </SectionCard>
        <SectionCard title="Pay" headingLevel={2}>
          <KeyValueList columns={1} items={detailItems(DETAILS.pay)} />
        </SectionCard>
        <Drawer
          side="end"
          open={drawer}
          onOpenChange={setDrawer}
          title="Request a change"
          description="HR checks the change and updates your details; you get a notification."
          actions={
            <>
              <Button
                intent="cancel"
                label="Cancel"
                onClick={() => {
                  setDrawer(false)
                }}
              />
              <Button
                family="primary"
                emphasis="primary"
                icon={FileText}
                label="Send to HR"
                onClick={() => {
                  if (value.trim() === '') {
                    setMissing(true)
                    return
                  }
                  setRequests((list) => [
                    {
                      id: 'CR-2026-010',
                      field: chosen?.label ?? field,
                      from: current?.value ?? '',
                      to: value.trim(),
                      submitted: Y_TODAY,
                      state: 'Waiting for HR',
                    },
                    ...list,
                  ])
                  setDrawer(false)
                  notice.success(`Change request sent to ${EMPLOYEE.hr}.`)
                }}
              />
            </>
          }
        >
          <div className="flex flex-col gap-4">
            <SelectField
              label="What changes"
              value={field}
              onChange={(next) => {
                setField(next)
                setValue('')
                setMissing(false)
              }}
              options={CHANGEABLE.map(({ value: key, label }) => ({ value: key, label }))}
            />
            <KeyValueList
              columns={1}
              items={[{ key: 'now', label: 'Now', value: <bdi>{current?.value ?? '—'}</bdi> }]}
            />
            <TextField
              label="New value"
              required
              value={value}
              onChange={(next) => {
                setValue(next)
                setMissing(false)
              }}
              {...(missing ? { error: 'Write the new value.' } : {})}
            />
            <TextAreaField label="Note for HR" value={reason} onChange={setReason} />
            {chosen?.proof !== undefined && (
              <Alert tone="neutral" title="HR will ask for proof">
                {chosen.proof}
              </Alert>
            )}
          </div>
        </Drawer>
      </Page>
    </EmployeePortal>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_Y_ROUTES: ExampleRoute[] = [
  { path: Y_ROUTES.home, render: (phone) => <EmployeeHome phone={phone} /> },
  { path: Y_ROUTES.payslips, render: (phone) => <PayslipsScreen phone={phone} /> },
  ...PAYSLIPS.map((slip) => ({
    path: Y_ROUTES.payslip(slip.month),
    render: (phone: boolean) => <PayslipScreen phone={phone} />,
  })),
  { path: Y_ROUTES.payslipPdf(SEPTEMBER.month), render: () => <PayslipPdfScreen /> },
  { path: Y_ROUTES.leave, render: (phone) => <LeaveScreen phone={phone} /> },
  { path: `${Y_ROUTES.leave}?sent`, render: (phone) => <LeaveScreen phone={phone} sent /> },
  ...LEAVE_REQUESTS.map((request) => ({
    path: Y_ROUTES.leaveRequest(request.id),
    render: (phone: boolean) => <LeaveRequestScreen phone={phone} id={request.id} />,
  })),
  { path: Y_ROUTES.newLeave, render: (phone) => <NewLeaveScreen phone={phone} /> },
  { path: Y_ROUTES.newLeaveDraft, render: (phone) => <NewLeaveScreen phone={phone} draft /> },
  { path: Y_ROUTES.shifts, render: (phone) => <EmployeeShiftsScreen phone={phone} /> },
  { path: Y_ROUTES.documents, render: (phone) => <DocumentsScreen phone={phone} /> },
  {
    path: Y_ROUTES.document(DOCUMENTS[0]?.id ?? ''),
    render: (phone) => <AnnexScreen phone={phone} />,
  },
  { path: Y_ROUTES.details, render: (phone) => <MyDetailsScreen phone={phone} /> },
  { path: Y_ROUTES.detailsChange, render: (phone) => <MyDetailsScreen phone={phone} open /> },
]
