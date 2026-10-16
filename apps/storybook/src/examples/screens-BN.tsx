import {
  Ban,
  BookOpenCheck,
  ClipboardPen,
  GraduationCap,
  Languages,
  Lock,
  LogOut,
  PenLine,
} from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  Alert,
  Button,
  CandidateList,
  ChangeableValue,
  ConfirmDialog,
  DataTable,
  DateRangeText,
  DateText,
  DocumentPage,
  EditableGrid,
  KeyFigures,
  KeyValueList,
  MoneyText,
  notice,
  PageHeader,
  PortalShell,
  SectionCard,
  SignerList,
  StatusBadge,
  Toaster,
  UnavailableAction,
  useLiro,
  type Candidate,
  type DataTableColumn,
  type EditableGridColumn,
  type GridMessage,
  type LifecycleStep,
  type MenuEntry,
  type ModuleTab,
  type PortalSection,
  type Tone,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, ROUTES, Shell, type ExampleAccount } from './example-shell'
import { useExampleState } from './example-state'
import { Frame, Tenant } from './screens-G'
import { Page } from './screens-Y'
import { usePanels } from './screens-AU'
import {
  BN_ROUTES,
  BN_TODAY,
  CHOSEN_EXAMS,
  ECTS_REQUIRED,
  EXAM_PERIODS,
  FACULTY,
  GRADE_OPTIONS,
  GRADING_SCALE,
  gradeText,
  LATEST_RESULTS,
  MY_RECORDS,
  OPEN_PERIOD,
  PASSED_EXAMS,
  passes,
  PROFESSOR,
  RECORD,
  RECORD_ROWS,
  RECORD_ROWS_READY,
  recordFigures,
  recordSigners,
  REGISTRABLE,
  registrationFee,
  rowChecks,
  STUDENT,
  STUDIES,
  totalPoints,
  type ExamPeriod,
  type ExamRecordSummary,
  type PassedExam,
  type RecordRow,
  type RegistrableExam,
} from './data-BN'

/*
 * Group BN's example screens (P5.73, University): the Illustrative Faculty of Engineering, Novi
 * Sad, on 14.10.2026. Assembled from the library; nothing new was needed.
 * - The student portal (PortalShell, made for a phone first), as Teodora Pavlović sees it: my
 *   exams (the period's registration in an Alert, the average, ECTS and exams passed as
 *   KeyFigures, the registered exams and the latest results as DataTables), the registration for
 *   the October 2 period (the exams open to her as a CandidateList with the application's
 *   conditions and fee, the total to pay from the application, Register with one confirmation;
 *   registered exams with Withdraw; the exams not open to her with the reason in words), and
 *   her grades (DataTable with ECTS and the total from the application).
 * - The faculty (AppShell), as Prof. Milan Radović sees it: the exam periods with their dates and
 *   state in words, his exam records, and record ZI-2026-0417 (DocumentPage): the students
 *   registered as an EditableGrid — the exam's points and the grade entered from the keyboard,
 *   the pre-exam points, the total and the ECTS from the application, its checks under the rows
 *   — the grading scale and the signers (SignerList) in side panels; signed by the examiner, it
 *   is locked.
 * Every rule, number, condition, fee, grade and average is the application's (data-BN.ts).
 */

export { BN_ROUTES }

const LINK = 'text-link no-underline visited:text-link hover:underline'

// ── States in words, never colour alone ───────────────────────────────────────────────────────

const TONES: Record<string, Tone> = {
  Upcoming: 'neutral',
  'Registration open': 'success',
  Grading: 'warning',
  Finished: 'neutral',
  Draft: 'neutral',
  Locked: 'neutral',
  Registered: 'success',
}

function campusBadge(state: string) {
  return (
    <StatusBadge
      label={state}
      tone={TONES[state] ?? 'neutral'}
      {...(state === 'Locked' ? { icon: Lock } : {})}
    />
  )
}

/** "1st registration", "4th registration". */
function registrationText(attempt: number): string {
  const suffix = attempt === 1 ? 'st' : attempt === 2 ? 'nd' : attempt === 3 ? 'rd' : 'th'
  return `${String(attempt)}${suffix} registration`
}

/** The fee in words: "Free" or the amount. */
function Fee({ value }: { value: string }) {
  return value === '0.00' ? <>Free</> : <MoneyText value={value} currency="RSD" />
}

// ── The student portal ────────────────────────────────────────────────────────────────────────

type PortalKey = 'exams' | 'registration' | 'grades'

const SECTIONS: PortalSection[] = [
  { key: 'exams', label: 'My exams', href: `#${BN_ROUTES.portal}`, icon: BookOpenCheck },
  {
    key: 'registration',
    label: 'Registration',
    href: `#${BN_ROUTES.registration}`,
    icon: ClipboardPen,
    note: 'Open',
  },
  { key: 'grades', label: 'Grades', href: `#${BN_ROUTES.grades}`, icon: GraduationCap },
]

function StudentPortal({
  phone,
  current,
  children,
}: {
  phone: boolean
  current: PortalKey
  children: ReactNode
}) {
  const navigate = useContext(Navigate)
  const menu: MenuEntry[] = [
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
  return (
    <Tenant today={BN_TODAY}>
      <PortalShell
        layout={phone ? 'phone' : 'desktop'}
        brand={{ brandName: FACULTY.brand, productName: 'Students', href: `#${BN_ROUTES.portal}` }}
        participant={{
          name: STUDENT.name,
          detail: `${STUDENT.index} · ${STUDENT.programme}, ${STUDENT.year}`,
        }}
        menu={menu}
        sections={SECTIONS.map((section) =>
          section.key === current ? { ...section, current: true } : section,
        )}
        footer={`${FACULTY.name} · ${FACULTY.address} · ${FACULTY.services} · Illustrative data`}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </PortalShell>
    </Tenant>
  )
}

/** The exams she is registered for, kept above the screens as the faculty keeps them. */
function useRegistered(initial: () => readonly string[]) {
  return useExampleState<readonly string[]>('bn-registered', initial)
}

const REGISTERED_BEFORE = REGISTRABLE.filter((each) => each.registeredOn !== undefined).map(
  (each) => each.id,
)

function useRegisteredColumns(): DataTableColumn<RegistrableExam>[] {
  const { format } = useLiro()
  return [
    {
      id: 'course',
      header: 'Course',
      minWidth: 200,
      cell: (row) => <span className="bidi-content">{row.course}</span>,
    },
    {
      id: 'date',
      header: 'Exam',
      cell: (row) => (
        <span className="whitespace-nowrap">
          <DateText value={row.date} /> {row.time}
        </span>
      ),
    },
    { id: 'room', header: 'Room', cell: (row) => row.room },
    {
      id: 'ects',
      header: 'ECTS',
      align: 'end',
      numeric: true,
      cell: (row) => format.number(row.ects),
    },
  ]
}

export function StudentExams({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const [registered] = useRegistered(() => REGISTERED_BEFORE)
  const rows = REGISTRABLE.filter((each) => registered.includes(each.id))
  const registeredColumns = useRegisteredColumns()
  type Result = (typeof LATEST_RESULTS)[number]
  const resultColumns: DataTableColumn<Result>[] = [
    {
      id: 'course',
      header: 'Course',
      minWidth: 200,
      cell: (row) => <span className="bidi-content">{row.course}</span>,
    },
    { id: 'period', header: 'Exam period', cell: (row) => row.period },
    { id: 'date', header: 'Date', cell: (row) => <DateText value={row.date} /> },
    {
      id: 'points',
      header: 'Points',
      align: 'end',
      numeric: true,
      cell: (row) => (row.points === null ? '—' : format.number(row.points)),
    },
    { id: 'grade', header: 'Result', cell: (row) => resultText(row.grade) },
  ]
  return (
    <StudentPortal phone={phone} current="exams">
      <Page>
        <PageHeader
          title="My exams"
          subtitle={`${STUDENT.name} · ${STUDENT.index} · ${STUDENT.programme}, ${STUDENT.year}`}
        />
        <Alert
          title={`Registration for ${OPEN_PERIOD.name} is open`}
          actions={
            <Button
              family="neutral"
              icon={ClipboardPen}
              emphasis="secondary"
              label="Register for exams"
              onClick={() => {
                navigate(BN_ROUTES.registration)
              }}
            />
          }
        >
          {`Until ${format.date(OPEN_PERIOD.registrationTo)} at 23:59. The exams run ${format.date(OPEN_PERIOD.examsFrom)} – ${format.date(OPEN_PERIOD.examsTo)}`}
        </Alert>
        <KeyFigures
          layout={phone ? 'phone' : 'desktop'}
          items={[
            { key: 'average', label: 'Average grade', value: format.number(STUDIES.average) },
            {
              key: 'ects',
              label: 'ECTS',
              value: `${format.number(STUDIES.ects)} of ${format.number(ECTS_REQUIRED)}`,
            },
            { key: 'passed', label: 'Exams passed', value: format.number(STUDIES.passed) },
          ]}
        />
        <SectionCard
          title={`Registered for ${OPEN_PERIOD.name}`}
          headingLevel={2}
          flush
          actions={<To href={BN_ROUTES.registration}>Registration</To>}
        >
          <DataTable
            label={`Exams registered for ${OPEN_PERIOD.name}`}
            columns={registeredColumns}
            rows={rows}
            getRowId={(row) => row.id}
            getRowLabel={(row) => row.course}
            inCard
            layout={phone ? 'cards' : 'table'}
            mobile={{
              title: (row) => row.course,
              subtitle: (row) => `${format.date(row.date)} ${row.time} · ${row.room}`,
              details: ['ects'],
            }}
          />
        </SectionCard>
        <SectionCard
          title="Latest results"
          headingLevel={2}
          flush
          actions={<To href={BN_ROUTES.grades}>All grades</To>}
        >
          <DataTable
            label="Latest results"
            columns={resultColumns}
            rows={LATEST_RESULTS}
            getRowId={(row) => row.id}
            getRowLabel={(row) => `${row.course}, ${row.period}`}
            inCard
            layout={phone ? 'cards' : 'table'}
            mobile={{
              title: (row) => row.course,
              subtitle: (row) => `${row.period} · ${format.date(row.date)}`,
              details: ['points', 'grade'],
            }}
          />
        </SectionCard>
      </Page>
    </StudentPortal>
  )
}

/** A link in a card's header, in the page's router. */
function To({ href, children }: { href: string; children: ReactNode }) {
  const { linkComponent: Link } = useLiro()
  return (
    <Link href={`#${href}`} className={`text-sm ${LINK}`}>
      {children}
    </Link>
  )
}

/** A result in words: "9 · excellent (B)", "5 · fail (F): not passed", "Did not take the exam". */
function resultText(grade: string): string {
  return grade === '5' ? `${gradeText(grade)}: not passed` : gradeText(grade)
}

// ── Registration ──────────────────────────────────────────────────────────────────────────────

export function ExamRegistration({
  phone,
  state,
}: {
  phone: boolean
  /** The page as the application restores it: the confirmation open, or both registered. */
  state?: 'confirm' | 'registered'
}) {
  const { format } = useLiro()
  const [registered, setRegistered] = useRegistered(() =>
    state === 'registered' ? [...REGISTERED_BEFORE, ...CHOSEN_EXAMS] : REGISTERED_BEFORE,
  )
  const [chosen, setChosen] = useState<readonly string[]>(state === 'confirm' ? CHOSEN_EXAMS : [])
  const [confirming, setConfirming] = useState(state === 'confirm')
  const [withdrawing, setWithdrawing] = useState<RegistrableExam | null>(null)
  const registeredRows = REGISTRABLE.filter((each) => registered.includes(each.id))
  const open = REGISTRABLE.filter((each) => each.allowed && !registered.includes(each.id))
  const closed = REGISTRABLE.filter((each) => !each.allowed)
  const fee = registrationFee(chosen)
  const chosenRows = open.filter((each) => chosen.includes(each.id))
  const count = chosenRows.length
  const examsWord = count === 1 ? 'exam' : 'exams'
  const registeredColumns: DataTableColumn<RegistrableExam>[] = [
    ...useRegisteredColumns(),
    {
      id: 'fee',
      header: 'Fee',
      align: 'end',
      numeric: true,
      cell: (row) => <Fee value={row.fee} />,
    },
  ]
  const candidates: Candidate[] = open.map((each) => ({
    id: each.id,
    label: each.course,
    title: each.course,
    subtitle: `Year ${each.year} · ${format.number(each.ects)} ECTS · ${format.date(each.date)} at ${each.time}, ${each.room}`,
    reason: `${each.conditions} · ${registrationText(each.attempt)} · ${each.feeRule}`,
    figure: <Fee value={each.fee} />,
  }))
  return (
    <StudentPortal phone={phone} current="registration">
      <Page>
        <PageHeader
          title="Exam registration"
          subtitle={`${OPEN_PERIOD.name} · ${STUDENT.name}, ${STUDENT.index}`}
        />
        <Alert title={`Open until ${format.date(OPEN_PERIOD.registrationTo)} at 23:59`}>
          {`The exams run ${format.date(OPEN_PERIOD.examsFrom)} – ${format.date(OPEN_PERIOD.examsTo)}. A registration can be withdrawn until the deadline; fees are charged to your student account.`}
        </Alert>
        <SectionCard title="Open to you" headingLevel={2}>
          <div className="flex flex-col gap-4">
            <CandidateList
              label={`Exams open to you in ${OPEN_PERIOD.name}`}
              candidates={candidates}
              selected={chosen}
              onSelectedChange={setChosen}
              empty="Every exam open to you is registered."
            />
            {open.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="bidi-content m-0 text-sm text-secondary">
                  To pay: <MoneyText value={fee} currency="RSD" /> from your student account
                  (balance <MoneyText value={STUDENT.balance} currency="RSD" />)
                </p>
                {count === 0 ? (
                  <UnavailableAction
                    intent="confirm"
                    label="Register"
                    reason="Choose at least one exam."
                  />
                ) : (
                  <Button
                    intent="confirm"
                    label={`Register for ${format.number(String(count))} ${examsWord}`}
                    onClick={() => {
                      setConfirming(true)
                    }}
                  />
                )}
              </div>
            )}
          </div>
        </SectionCard>
        <SectionCard title="Registered" headingLevel={2} flush>
          <DataTable
            label={`Exams registered for ${OPEN_PERIOD.name}`}
            columns={registeredColumns}
            rows={registeredRows}
            getRowId={(row) => row.id}
            getRowLabel={(row) => row.course}
            inCard
            layout={phone ? 'cards' : 'table'}
            rowActions={(row) => [
              {
                label: 'Withdraw registration',
                onSelect: () => {
                  setWithdrawing(row)
                },
              },
            ]}
            mobile={{
              title: (row) => row.course,
              subtitle: (row) => `${format.date(row.date)} ${row.time} · ${row.room}`,
              details: ['ects', 'fee'],
            }}
          />
        </SectionCard>
        <SectionCard
          title="Not open to you"
          description="The faculty’s conditions, as its records stand today"
          headingLevel={2}
        >
          <ul className="m-0 flex list-none flex-col p-0">
            {closed.map((each) => (
              <li
                key={each.id}
                className="flex flex-col gap-0.5 border-0 border-b border-solid border-subtle py-3 first:pt-0 last:border-b-0 last:pb-0"
              >
                <span className="bidi-content text-sm font-medium text-primary">{each.course}</span>
                <span className="bidi-content text-xs text-secondary">
                  {`Year ${each.year} · ${format.number(each.ects)} ECTS`}
                </span>
                <span className="flex items-start gap-1.5 text-xs font-medium text-secondary">
                  <Ban aria-hidden="true" className="mt-px size-3.5 shrink-0" />
                  <span className="bidi-content">{`Not allowed: ${each.conditions}`}</span>
                </span>
              </li>
            ))}
          </ul>
        </SectionCard>
      </Page>
      <ConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        intent="confirm"
        title={`Register for ${format.number(String(count))} ${examsWord}?`}
        message={
          <span className="flex flex-col gap-2">
            <span className="bidi-content">
              {chosenRows
                .map((each) => `${each.course}, ${format.date(each.date)} at ${each.time}`)
                .join('; ')}
            </span>
            <span className="bidi-content">
              {`${format.money(fee, 'RSD')} is charged to your student account. You can withdraw until ${format.date(OPEN_PERIOD.registrationTo)}.`}
            </span>
          </span>
        }
        confirmLabel="Register"
        onConfirm={() => {
          setRegistered((current) => [...current, ...chosenRows.map((each) => each.id)])
          setChosen([])
          setConfirming(false)
          notice.success(
            `Registered for ${format.number(String(count))} ${examsWord} of ${OPEN_PERIOD.name}.`,
          )
        }}
      />
      <ConfirmDialog
        open={withdrawing !== null}
        onOpenChange={(next) => {
          if (!next) setWithdrawing(null)
        }}
        family="caution"
        actionIcon={Ban}
        title="Withdraw registration"
        {...(withdrawing === null
          ? {}
          : { subject: `${withdrawing.course}, ${format.date(withdrawing.date)}` })}
        message={`You can register again until ${format.date(OPEN_PERIOD.registrationTo)}. A fee already charged is returned to your student account.`}
        confirmLabel="Withdraw"
        onConfirm={() => {
          const course = withdrawing
          setRegistered((current) => current.filter((id) => id !== course?.id))
          setWithdrawing(null)
          if (course !== null) notice.success(`${course.course}: registration withdrawn.`)
        }}
      />
    </StudentPortal>
  )
}

// ── Grades ────────────────────────────────────────────────────────────────────────────────────

export function StudentGrades({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const columns: DataTableColumn<PassedExam>[] = [
    {
      id: 'course',
      header: 'Course',
      minWidth: 220,
      cell: (row) => <span className="bidi-content">{row.course}</span>,
    },
    {
      id: 'year',
      header: 'Year',
      align: 'end',
      numeric: true,
      cell: (row) => format.number(row.year),
    },
    {
      id: 'ects',
      header: 'ECTS',
      align: 'end',
      numeric: true,
      cell: (row) => format.number(row.ects),
    },
    { id: 'grade', header: 'Grade', cell: (row) => gradeText(row.grade) },
    { id: 'date', header: 'Date', cell: (row) => <DateText value={row.date} /> },
    { id: 'period', header: 'Exam period', cell: (row) => row.period },
  ]
  return (
    <StudentPortal phone={phone} current="grades">
      <Page>
        <PageHeader
          title="Grades"
          subtitle={`${STUDENT.name} · ${STUDENT.index} · ${STUDENT.programme}, ${STUDENT.year}`}
        />
        <KeyFigures
          layout={phone ? 'phone' : 'desktop'}
          items={[
            { key: 'average', label: 'Average grade', value: format.number(STUDIES.average) },
            {
              key: 'ects',
              label: 'ECTS',
              value: `${format.number(STUDIES.ects)} of ${format.number(ECTS_REQUIRED)}`,
            },
            { key: 'passed', label: 'Exams passed', value: format.number(STUDIES.passed) },
          ]}
        />
        <SectionCard
          title="Passed exams"
          description="The average counts every passed exam once, as the faculty’s rules say"
          headingLevel={2}
          flush
        >
          <DataTable
            label="Passed exams"
            columns={columns}
            rows={PASSED_EXAMS}
            getRowId={(row) => row.id}
            getRowLabel={(row) => row.course}
            inCard
            layout={phone ? 'cards' : 'table'}
            totals={{ ects: format.number(STUDIES.ects) }}
            totalsLabel="Total"
            mobile={{
              title: (row) => row.course,
              subtitle: (row) =>
                `Year ${format.number(row.year)} · ${format.number(row.ects)} ECTS · ${format.date(row.date)}`,
              details: ['grade', 'period'],
            }}
          />
        </SectionCard>
      </Page>
    </StudentPortal>
  )
}

// ── The faculty ───────────────────────────────────────────────────────────────────────────────

const PROFESSOR_ACCOUNT: ExampleAccount = {
  name: PROFESSOR.name,
  email: PROFESSOR.email,
  companies: [{ id: FACULTY.id, name: FACULTY.name, description: 'School year 2026/2027' }],
  links: [
    { label: 'Exam periods', path: BN_ROUTES.periods },
    { label: 'My exam records', path: BN_ROUTES.records },
    { label: `Exam record ${RECORD.number}`, path: BN_ROUTES.record },
  ],
}

function facultyTabs(current: 'periods' | 'records'): ModuleTab[] {
  return [
    {
      key: 'periods',
      label: 'Exam periods',
      href: `#${BN_ROUTES.periods}`,
      current: current === 'periods',
    },
    {
      key: 'records',
      label: 'My exam records',
      href: `#${BN_ROUTES.records}`,
      current: current === 'records',
    },
  ]
}

function FacultyShell({
  phone,
  tab,
  crumbs,
  bottomBar,
  children,
}: {
  phone: boolean
  tab: 'periods' | 'records'
  crumbs: { label: string; href?: string }[]
  bottomBar?: ReactNode
  children: ReactNode
}) {
  return (
    <Tenant today={BN_TODAY}>
      <Shell
        phone={phone}
        account={PROFESSOR_ACCOUNT}
        company={FACULTY.id}
        crumbs={crumbs}
        tabs={facultyTabs(tab)}
        {...(bottomBar === undefined ? {} : { bottomBar })}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

export function ExamPeriods({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const columns: DataTableColumn<ExamPeriod>[] = [
    {
      id: 'name',
      header: 'Exam period',
      minWidth: 200,
      cell: (row) => <span className="bidi-content">{row.name}</span>,
    },
    { id: 'year', header: 'School year', cell: (row) => row.schoolYear },
    {
      id: 'exams',
      header: 'Exams',
      cell: (row) => <DateRangeText from={row.examsFrom} to={row.examsTo} />,
    },
    {
      id: 'registration',
      header: 'Registration',
      cell: (row) => <DateRangeText from={row.registrationFrom} to={row.registrationTo} />,
    },
    {
      id: 'count',
      header: 'Exams held',
      align: 'end',
      numeric: true,
      cell: (row) => format.number(row.exams),
    },
    { id: 'records', header: 'Exam records', cell: (row) => row.records },
    { id: 'state', header: 'State', cell: (row) => campusBadge(row.state) },
  ]
  return (
    <FacultyShell
      phone={phone}
      tab="periods"
      crumbs={[{ label: 'Studies' }, { label: 'Exam periods' }]}
    >
      <Frame phone={phone} wide>
        <PageHeader title="Exam periods" subtitle={`${FACULTY.name} · illustrative`} />
        <SectionCard flush>
          <DataTable
            label="Exam periods"
            columns={columns}
            rows={EXAM_PERIODS}
            getRowId={(row) => row.id}
            getRowLabel={(row) => row.name}
            inCard
            layout={phone ? 'cards' : 'table'}
            mobile={{
              title: (row) => row.name,
              subtitle: (row) =>
                `Exams ${format.date(row.examsFrom)} – ${format.date(row.examsTo)}`,
              badge: (row) => campusBadge(row.state),
              details: ['registration', 'records'],
            }}
          />
        </SectionCard>
      </Frame>
    </FacultyShell>
  )
}

/** The record's state, kept above the screens as the faculty's application keeps it. */
interface RecordState {
  rows: readonly RecordRow[]
  locked: boolean
}

function useRecord(initial: () => RecordState) {
  return useExampleState<RecordState>('bn-record', initial)
}

const DRAFT_RECORD = (): RecordState => ({ rows: RECORD_ROWS, locked: false })

export function ExamRecords({ phone }: { phone: boolean }) {
  const { format, linkComponent: Link } = useLiro()
  const [record] = useRecord(DRAFT_RECORD)
  const figures = recordFigures(record.rows)
  const rows = MY_RECORDS.map((each) =>
    each.number === RECORD.number
      ? {
          ...each,
          graded: `${figures.graded} of ${figures.registered}`,
          state: record.locked ? ('Locked' as const) : each.state,
        }
      : each,
  )
  const number = (row: ExamRecordSummary) =>
    row.number === RECORD.number ? (
      <Link href={`#${BN_ROUTES.record}`} className={LINK}>
        <span dir="ltr">{row.number}</span>
      </Link>
    ) : (
      <span dir="ltr">{row.number}</span>
    )
  const columns: DataTableColumn<ExamRecordSummary>[] = [
    { id: 'number', header: 'Record', cell: number },
    {
      id: 'course',
      header: 'Course',
      minWidth: 180,
      cell: (row) => <span className="bidi-content">{row.course}</span>,
    },
    { id: 'period', header: 'Exam period', cell: (row) => row.period },
    { id: 'date', header: 'Exam date', cell: (row) => <DateText value={row.date} /> },
    {
      id: 'registered',
      header: 'Students',
      align: 'end',
      numeric: true,
      cell: (row) => format.number(row.registered),
    },
    { id: 'graded', header: 'Graded', cell: (row) => row.graded },
    { id: 'state', header: 'State', cell: (row) => campusBadge(row.state) },
  ]
  return (
    <FacultyShell
      phone={phone}
      tab="records"
      crumbs={[{ label: 'Studies' }, { label: 'My exam records' }]}
    >
      <Frame phone={phone} wide>
        <PageHeader
          title="My exam records"
          subtitle={`${PROFESSOR.name} · ${PROFESSOR.department}`}
        />
        <SectionCard flush>
          <DataTable
            label="My exam records"
            columns={columns}
            rows={rows}
            getRowId={(row) => row.number}
            getRowLabel={(row) => `${row.number}, ${row.course}`}
            inCard
            layout={phone ? 'cards' : 'table'}
            mobile={{
              title: number,
              subtitle: (row) => `${row.course} · ${row.period} · ${format.date(row.date)}`,
              badge: (row) => campusBadge(row.state),
              details: ['registered', 'graded'],
            }}
          />
        </SectionCard>
      </Frame>
    </FacultyShell>
  )
}

const RECORD_STEPS: LifecycleStep[] = [
  { key: 'draft', label: 'Grades entered' },
  { key: 'signed', label: 'Signed by the examiner' },
  { key: 'confirmed', label: 'Confirmed by the department' },
]

/** The application's value of a row's ECTS: the course's when the exam is passed. */
function ectsOf(row: RecordRow): string | null {
  return passes(row.grade) ? RECORD.ects : null
}

function useRecordColumns(locked: boolean): EditableGridColumn<RecordRow>[] {
  const { format } = useLiro()
  const figure = (value: string | null) => (
    <span className="bidi-isolate">{value === null ? '—' : format.number(value)}</span>
  )
  return [
    {
      id: 'index',
      header: 'Index',
      width: 112,
      type: 'display',
      display: (row) => <span dir="ltr">{row.index}</span>,
    },
    {
      id: 'name',
      header: 'Student',
      width: 180,
      type: 'display',
      display: (row) => <span className="bidi-content">{row.name}</span>,
    },
    {
      id: 'attempt',
      header: 'Attempt',
      width: 80,
      type: 'display',
      align: 'end',
      numeric: true,
      display: (row) => figure(String(row.attempt)),
    },
    {
      id: 'preExam',
      header: `Pre-exam (of ${RECORD.preExamMax})`,
      width: 120,
      type: 'display',
      align: 'end',
      numeric: true,
      display: (row) => figure(row.preExam),
    },
    {
      id: 'exam',
      header: `Exam points (of ${RECORD.examMax})`,
      width: 136,
      type: 'number',
      value: (row) => row.exam,
      readOnly: () => locked,
    },
    {
      id: 'total',
      header: 'Total',
      width: 80,
      type: 'display',
      align: 'end',
      numeric: true,
      display: (row) => figure(totalPoints(row)),
    },
    {
      id: 'grade',
      header: 'Grade',
      width: 208,
      type: 'select',
      value: (row) => row.grade,
      options: GRADE_OPTIONS,
      readOnly: () => locked,
    },
    {
      id: 'ects',
      header: 'ECTS',
      width: 72,
      type: 'display',
      align: 'end',
      numeric: true,
      display: (row) => figure(ectsOf(row)),
    },
  ]
}

export function ExamRecord({
  phone,
  state = 'draft',
}: {
  phone: boolean
  /** The record as the application restores it. */
  state?: 'draft' | 'ready' | 'sign' | 'locked'
}) {
  const { format } = useLiro()
  const [record, setRecord] = useRecord(() =>
    state === 'draft' ? DRAFT_RECORD() : { rows: RECORD_ROWS_READY, locked: state === 'locked' },
  )
  const [signing, setSigning] = useState(state === 'sign')
  const panels = usePanels(['signatures', 'scale'])
  const columns = useRecordColumns(record.locked)
  const figures = recordFigures(record.rows)
  const messages: Record<string, GridMessage[]> = {}
  for (const row of record.rows) {
    const checks = rowChecks(row)
    if (checks.length > 0) {
      messages[row.id] = checks.map((check) => ({
        tone: check.tone,
        text: check.text,
        columns: [check.column],
      }))
    }
  }
  const subject = `${RECORD.number} · ${RECORD.course}, ${format.date(RECORD.date)}`
  const signers = recordSigners(record.locked, figures.complete)
  const signatures = (
    <div className="flex flex-col gap-3">
      {!record.locked && !figures.complete && (
        <p className="bidi-content m-0 text-sm text-secondary">
          {`You sign when every student has a grade: ${format.number(figures.missing)} ${figures.missing === '1' ? 'is' : 'are'} still missing.`}
        </p>
      )}
      <SignerList
        signers={signers}
        signLabel="Sign record"
        onSign={() => {
          setSigning(true)
        }}
        declineSubject={subject}
      />
    </div>
  )
  return (
    <FacultyShell
      phone={phone}
      tab="records"
      crumbs={[
        { label: 'Studies' },
        { label: 'My exam records', href: `#${BN_ROUTES.records}` },
        { label: RECORD.number },
      ]}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title={RECORD.number}
        back={{ href: `#${BN_ROUTES.records}`, label: 'My exam records' }}
        status={campusBadge(record.locked ? 'Locked' : 'Draft')}
        lifecycle={{
          steps: RECORD_STEPS,
          current: record.locked ? 1 : 0,
          label: 'Exam record status',
        }}
        actions={<Button intent="print" emphasis="secondary" label="Print" />}
        {...(record.locked
          ? {
              banner: (
                <Alert title="Locked" icon={Lock}>
                  {`Signed by ${PROFESSOR.name} on ${format.date(RECORD.signedAt.slice(0, 10))} at ${RECORD.signedAt.slice(11, 16)}. The grades are in the students’ records; a correction goes through student services with a reason.`}
                </Alert>
              ),
            }
          : {})}
        details={
          <>
            <ChangeableValue
              label="Course"
              value={`${RECORD.course} (${RECORD.code}), ${format.number(RECORD.ects)} ECTS`}
            />
            <ChangeableValue label="Exam period" value={RECORD.period} />
            <ChangeableValue
              label="Exam"
              value={`${RECORD.exam}, ${format.date(RECORD.date)} at ${RECORD.time}, ${RECORD.room}`}
            />
            <ChangeableValue label="Examiner" value={PROFESSOR.name} />
          </>
        }
        keyFigures={[
          { key: 'registered', label: 'Registered', value: format.number(figures.registered) },
          {
            key: 'graded',
            label: 'Graded',
            value: `${format.number(figures.graded)} of ${format.number(figures.registered)}`,
            ...(figures.complete ? {} : { tone: 'warning' as const }),
          },
          { key: 'passed', label: 'Passed', value: format.number(figures.passed) },
          {
            key: 'average',
            label: 'Average grade of those who passed',
            value: figures.average === null ? '—' : format.number(figures.average),
          },
        ]}
        linesTitle="Students registered"
        lines={
          <EditableGrid<RecordRow>
            label={`Students of ${RECORD.number}`}
            inCard
            layout={phone ? 'phone' : 'desktop'}
            columns={columns}
            rows={record.rows}
            getRowId={(row) => row.id}
            minRows={record.rows.length}
            maxRows={record.rows.length}
            messages={messages}
            onCellChange={(rowId, columnId, value) => {
              setRecord((current) => ({
                ...current,
                rows: current.rows.map((row) => {
                  if (row.id !== rowId) return row
                  if (columnId === 'exam') {
                    return { ...row, exam: typeof value === 'string' ? value : null }
                  }
                  if (columnId === 'grade') return { ...row, grade: String(value) }
                  return row
                }),
              }))
            }}
            onAddRow={() => undefined}
            onRemoveRow={() => undefined}
          />
        }
        panels={[
          { key: 'signatures', title: 'Signatures', content: signatures },
          {
            key: 'scale',
            title: 'Grading scale',
            content: (
              <KeyValueList
                columns={1}
                items={GRADING_SCALE.map((step) => ({
                  key: step.grade,
                  label: `${step.grade} · ${step.words} (${step.ects})`,
                  value: `${step.points} points`,
                }))}
              />
            ),
          },
        ]}
        {...panels}
      />
      <ConfirmDialog
        open={signing}
        onOpenChange={setSigning}
        family="primary"
        actionIcon={PenLine}
        title="Sign exam record"
        subject={subject}
        message={`The points and grades of ${format.number(figures.registered)} students are locked and published to their records. ${HEAD_TEXT}`}
        confirmLabel="Sign"
        onConfirm={() => {
          setRecord((current) => ({ ...current, locked: true }))
          setSigning(false)
          notice.success(`${RECORD.number} is signed and locked.`)
        }}
      />
    </FacultyShell>
  )
}

const HEAD_TEXT =
  'The head of department confirms it next; a correction afterwards goes through student services with a reason.'

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BN_ROUTES: ExampleRoute[] = [
  { path: BN_ROUTES.portal, render: (phone) => <StudentExams phone={phone} /> },
  { path: BN_ROUTES.grades, render: (phone) => <StudentGrades phone={phone} /> },
  { path: BN_ROUTES.registration, render: (phone) => <ExamRegistration phone={phone} /> },
  {
    path: BN_ROUTES.registrationConfirm,
    render: (phone) => <ExamRegistration phone={phone} state="confirm" />,
  },
  {
    path: BN_ROUTES.registrationDone,
    render: (phone) => <ExamRegistration phone={phone} state="registered" />,
  },
  { path: BN_ROUTES.periods, render: (phone) => <ExamPeriods phone={phone} /> },
  { path: BN_ROUTES.records, render: (phone) => <ExamRecords phone={phone} /> },
  { path: BN_ROUTES.record, render: (phone) => <ExamRecord phone={phone} /> },
  { path: BN_ROUTES.recordReady, render: (phone) => <ExamRecord phone={phone} state="ready" /> },
  { path: BN_ROUTES.recordSign, render: (phone) => <ExamRecord phone={phone} state="sign" /> },
  {
    path: BN_ROUTES.recordLocked,
    render: (phone) => <ExamRecord phone={phone} state="locked" />,
  },
]
