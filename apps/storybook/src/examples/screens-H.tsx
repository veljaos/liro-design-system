import {
  BookOpen,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  ClipboardList,
  FlaskConical,
  Languages,
  LogOut,
  MessageSquare,
  Send,
  UserRound,
} from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  Alert,
  AttendanceGrid,
  Button,
  CalendarView,
  DataTable,
  DateText,
  DetailPage,
  KeyFigures,
  KeyValueList,
  MaskedValue,
  PageHeader,
  PortalShell,
  RadioGroupField,
  ResourceSchedule,
  SectionCard,
  SelectField,
  SlotPicker,
  Stepper,
  Timetable,
  Toaster,
  UnavailableAction,
  notice,
  slotKey,
  useLiro,
  type AttendanceChange,
  type AttendanceValue,
  type DataTableColumn,
  type MenuEntry,
  type ModuleTab,
  type PortalSection,
  type ScheduleBooking,
  type ShellCompany,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell, statusBadge, type ExampleAccount } from './example-shell'
import { Frame, Tenant } from './screens-G'
import {
  ABSENCES,
  ASSESSMENTS,
  ATTENDANCE_CODES,
  ATTENDANCE_VALUE,
  attendanceTotals,
  BOOKINGS,
  CHOSEN_DOCTOR,
  CLINIC,
  CURRENT_LESSON,
  DAY_BOOKINGS,
  DOCTOR_EVENTS,
  DOCTORS,
  FINDING,
  FREE_SLOTS,
  GRADEBOOK_VALUE,
  gradebookTotals,
  JOVANA_BOOKING,
  JOVANA_SLOT,
  LESSONS,
  LUKA,
  MARK_CODES,
  PARENT,
  PATIENT,
  PERIODS,
  PUPILS,
  REVEAL_REASONS,
  SCHOOL,
  SERVICES,
  TODAY_LESSONS,
  UNAVAILABLE,
  type Absence,
} from './data-H'

/*
 * Group H's example screens (P5.17, industry examples), one dataset each (data-H.ts).
 * - Health: Jovana Nikolić books a check-up in Dom zdravlja Novi Sad's patient portal (PortalShell:
 *   service and doctor, a free time, booked); the clinic's schedule of that day (ResourceSchedule)
 *   and the doctor's week (CalendarView) with her booking; her last finding, whose diagnosis is
 *   shown only for a reason (MaskedValue).
 * - School: OŠ "Jovan Popović", class 7/2: the timetable, the attendance of today's lessons
 *   (marked one key per pupil), the mathematics gradebook, and Luka Jovanović's absences in the
 *   parents' portal.
 * Every screen plays the application: it keeps the state and works out the counts (data-H.ts).
 */

export const H_ROUTES = {
  book: '/portal/health/book',
  bookTime: '/portal/health/book?step=time',
  bookConfirm: '/portal/health/book?step=confirm',
  booked: '/portal/health/book?step=done',
  clinicSchedule: `/clinic/schedule/${CLINIC.day}`,
  doctorCalendar: `/clinic/calendar/${CHOSEN_DOCTOR}/${CLINIC.week.start}`,
  finding: `/clinic/patients/jovana-nikolic/findings/${FINDING.number}`,
  findingAsk: `/clinic/patients/jovana-nikolic/findings/${FINDING.number}?reveal=ask`,
  findingShown: `/clinic/patients/jovana-nikolic/findings/${FINDING.number}?reveal=shown`,
  timetable: '/school/classes/7-2/timetable',
  attendance: `/school/classes/7-2/attendance/${SCHOOL.day}`,
  gradebook: '/school/classes/7-2/gradebook/mathematics',
  parent: '/portal/school/attendance',
}

const LINK = 'text-link no-underline visited:text-link hover:underline'
/** A link inside a sentence is underlined: colour alone does not tell it apart (WCAG 1.4.1). */
const LINK_IN_TEXT = 'text-link underline visited:text-link'

const PORTAL_MENU: MenuEntry[] = [
  { label: 'My details', icon: UserRound, onSelect: () => undefined },
  { label: 'Language: English', icon: Languages, onSelect: () => undefined },
  { type: 'separator' },
  { label: 'Sign out', icon: LogOut, onSelect: () => undefined },
]

/** A portal page: one column, centred on wide screens. */
function PortalPage({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto box-border flex w-full max-w-3xl min-w-0 flex-col gap-4 p-4 sm:p-6">
      <h1 className="bidi-content m-0 text-h2 text-primary">{title}</h1>
      {children}
    </div>
  )
}

// ── 4. Health: the patient portal ──────────────────────────────────────────────────────────────

const HEALTH_SECTIONS: PortalSection[] = [
  {
    key: 'appointments',
    label: 'Appointments',
    href: `#${H_ROUTES.book}`,
    icon: CalendarDays,
    current: true,
  },
  { key: 'results', label: 'Results', href: '#/portal/health/results', icon: FlaskConical },
  {
    key: 'messages',
    label: 'Messages',
    href: '#/portal/health/messages',
    icon: MessageSquare,
    note: '1 new',
  },
]

function HealthPortal({ phone, children }: { phone: boolean; children: ReactNode }) {
  return (
    <PortalShell
      layout={phone ? 'phone' : 'desktop'}
      brand={{ brandName: 'Dom zdravlja', productName: 'Novi Sad', href: `#${H_ROUTES.book}` }}
      participant={{ name: PATIENT.name, detail: `Patient · ${PATIENT.insurance}` }}
      menu={PORTAL_MENU}
      sections={HEALTH_SECTIONS}
      footer={`${CLINIC.company} · ${CLINIC.name}, ${CLINIC.address} · Appointments ${CLINIC.phone}, 07–19 h`}
    >
      {children}
    </PortalShell>
  )
}

const BOOKING_STEPS = [{ label: 'Service and doctor' }, { label: 'Time' }, { label: 'Confirm' }]

const DOCTOR_OPTIONS = DOCTORS.filter((each) => each.id !== 'lab').map((each) => ({
  value: each.id,
  label: `${each.name}${each.id === CHOSEN_DOCTOR ? ' (your chosen doctor)' : ''}`,
}))

function doctorName(id: string) {
  return DOCTORS.find((each) => each.id === id)?.name ?? ''
}

/** The appointment in words: "Wednesday, 14 October 2026 at 11:30". */
function useWhen() {
  const { format } = useLiro()
  return (start: string) => `${format.dateLong(start.slice(0, 10))} at ${format.time(start)}`
}

export function Booking({
  phone,
  step,
}: {
  phone: boolean
  step: 'service' | 'time' | 'confirm' | 'done'
}) {
  const navigate = useContext(Navigate)
  const { linkComponent: Link } = useLiro()
  const when = useWhen()
  const [service, setService] = useState('checkup')
  const [doctor, setDoctor] = useState(CHOSEN_DOCTOR)
  const [slot, setSlot] = useState<string | null>(
    step === 'service' || step === 'time' ? null : JOVANA_SLOT,
  )
  const chosen = FREE_SLOTS.find((each) => slotKey(each) === slot)
  const serviceName = SERVICES.find((each) => each.value === service)?.label ?? ''
  const active = { service: 0, time: 1, confirm: 2, done: 3 }[step]
  const summary = (
    <KeyValueList
      columns={1}
      items={[
        { label: 'Service', value: serviceName },
        { label: 'Doctor', value: doctorName(doctor) },
        { label: 'Where', value: `${CLINIC.name}, ${CLINIC.address}` },
        ...(chosen === undefined ? [] : [{ label: 'When', value: when(chosen.start) }]),
      ]}
    />
  )
  return (
    <Tenant>
      <HealthPortal phone={phone}>
        <PortalPage title={step === 'done' ? 'Appointment booked' : 'Book an appointment'}>
          <Stepper steps={BOOKING_STEPS} active={active} layout={phone ? 'phone' : 'desktop'} />
          {step === 'service' && (
            <SectionCard>
              <div className="flex flex-col gap-4">
                <RadioGroupField
                  label="Service"
                  options={SERVICES}
                  value={service}
                  onChange={setService}
                />
                <SelectField
                  label="Doctor"
                  description="Your chosen doctor sees you first; another doctor of the clinic when yours is away."
                  options={DOCTOR_OPTIONS}
                  value={doctor}
                  onChange={setDoctor}
                />
                <div className="flex justify-end">
                  <Button
                    intent="next"
                    emphasis="primary"
                    label="Continue"
                    onClick={() => {
                      navigate(H_ROUTES.bookTime)
                    }}
                  />
                </div>
              </div>
            </SectionCard>
          )}
          {(step === 'time' || step === 'confirm') && (
            <SectionCard
              title={`${serviceName} with ${doctorName(doctor)}`}
              headingLevel={2}
              actions={
                <Link href={`#${H_ROUTES.book}`} className={`text-sm ${LINK}`}>
                  Change
                </Link>
              }
            >
              <div className="flex flex-col gap-4">
                <SlotPicker
                  label="Free times next week"
                  description={`${CLINIC.name}, ${CLINIC.address} · 30 minutes`}
                  required
                  slots={FREE_SLOTS}
                  value={slot}
                  onChange={(free) => {
                    setSlot(slotKey(free))
                  }}
                />
                {chosen !== undefined && (
                  <section aria-labelledby="appointment-heading" className="flex flex-col gap-2">
                    <h3 id="appointment-heading" className="bidi-content m-0 text-h4 text-primary">
                      Your appointment
                    </h3>
                    {summary}
                    <p className="bidi-content m-0 text-sm text-secondary">
                      Please come 10 minutes early with your health card.
                    </p>
                  </section>
                )}
                <div className="flex justify-end">
                  {chosen === undefined ? (
                    <UnavailableAction
                      family="primary"
                      icon={CalendarPlus}
                      emphasis="primary"
                      label="Book"
                      reason="Choose a time first."
                    />
                  ) : (
                    <Button
                      family="primary"
                      icon={CalendarPlus}
                      emphasis="primary"
                      label="Book"
                      onClick={() => {
                        navigate(H_ROUTES.booked)
                      }}
                    />
                  )}
                </div>
              </div>
            </SectionCard>
          )}
          {step === 'done' && (
            <>
              <Alert tone="success" title="Your appointment is booked">
                {`We sent the confirmation to your e-mail. You can cancel it here until the day before.`}
              </Alert>
              <SectionCard title="Upcoming" headingLevel={2} actions={statusBadge('Confirmed')}>
                {summary}
              </SectionCard>
              <p className="bidi-content m-0 text-sm text-secondary">
                Walk-through: the appointment in the clinic’s{' '}
                <Link href={`#${H_ROUTES.clinicSchedule}`} className={LINK_IN_TEXT}>
                  schedule of 14.10.2026
                </Link>
                .
              </p>
            </>
          )}
        </PortalPage>
      </HealthPortal>
    </Tenant>
  )
}

// ── 4. Health: the clinic ──────────────────────────────────────────────────────────────────────

const CLINIC_COMPANY: ShellCompany = {
  id: CLINIC.companyId,
  name: CLINIC.company,
  description: CLINIC.name,
}

const RECEPTION: ExampleAccount = {
  name: 'Gordana Babić',
  email: 'gordana.babic@dzns.rs',
  companies: [CLINIC_COMPANY],
  links: [
    { label: 'Schedule', path: H_ROUTES.clinicSchedule },
    { label: 'Calendar of dr Marko Stanković', path: H_ROUTES.doctorCalendar },
    { label: `Finding ${FINDING.number}, ${PATIENT.name}`, path: H_ROUTES.finding },
  ],
}

const CLINIC_TABS = (current: 'schedule' | 'calendar' | 'patients'): ModuleTab[] => [
  {
    key: 'schedule',
    label: 'Schedule',
    href: `#${H_ROUTES.clinicSchedule}`,
    current: current === 'schedule',
  },
  {
    key: 'calendar',
    label: 'Doctor’s calendar',
    href: `#${H_ROUTES.doctorCalendar}`,
    current: current === 'calendar',
  },
  {
    key: 'patients',
    label: 'Patients',
    href: `#${H_ROUTES.finding}`,
    current: current === 'patients',
  },
]

function ClinicShell({
  phone,
  tab,
  crumb,
  children,
}: {
  phone: boolean
  tab: 'schedule' | 'calendar' | 'patients'
  crumb: string
  children: ReactNode
}) {
  return (
    <Tenant>
      <Shell
        phone={phone}
        account={RECEPTION}
        company={CLINIC.companyId}
        crumbs={[{ label: CLINIC.name, href: `#${H_ROUTES.clinicSchedule}` }, { label: crumb }]}
        tabs={CLINIC_TABS(tab)}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

export function ClinicSchedule({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const [bookings, setBookings] = useState<readonly ScheduleBooking[]>(DAY_BOOKINGS)
  return (
    <ClinicShell phone={phone} tab="schedule" crumb="Schedule">
      <Frame phone={phone} wide>
        <PageHeader title="Schedule" subtitle={`${CLINIC.name} · ${format.dateLong(CLINIC.day)}`} />
        <ResourceSchedule
          label={`Doctors, ${format.date(CLINIC.day)}`}
          resources={DOCTORS}
          bookings={bookings}
          unavailable={UNAVAILABLE}
          date={CLINIC.day}
          dayStart="07:00"
          dayEnd="13:00"
          slotMinutes={30}
          resourceLabel="Doctor"
          layout={phone ? 'phone' : 'desktop'}
          onMove={(move) => {
            setBookings((current) =>
              current.map((each) =>
                each.id === move.id
                  ? { ...each, resourceId: move.resourceId, start: move.start, end: move.end }
                  : each,
              ),
            )
            notice.success('Appointment moved. The patient gets a message.')
          }}
          onSelect={(booking) => {
            if (booking.id === JOVANA_BOOKING.id) navigate(H_ROUTES.finding)
          }}
        />
      </Frame>
    </ClinicShell>
  )
}

export function DoctorCalendar({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const count = BOOKINGS.filter((each) => each.resourceId === CHOSEN_DOCTOR).length
  const { format } = useLiro()
  return (
    <ClinicShell phone={phone} tab="calendar" crumb={doctorName(CHOSEN_DOCTOR)}>
      <Frame phone={phone} wide>
        <PageHeader
          title={doctorName(CHOSEN_DOCTOR)}
          subtitle={`General practice · ${format.number(String(count))} appointments this week`}
        />
        <CalendarView
          label={`${doctorName(CHOSEN_DOCTOR)}, appointments`}
          events={DOCTOR_EVENTS}
          defaultView="week"
          defaultDate={CLINIC.day}
          dayStart="07:00"
          dayEnd="14:00"
          slotMinutes={30}
          layout={phone ? 'phone' : 'desktop'}
          onSelect={(event) => {
            if (event.id === JOVANA_BOOKING.id) navigate(H_ROUTES.finding)
          }}
        />
      </Frame>
    </ClinicShell>
  )
}

export function Finding({ phone, reveal }: { phone: boolean; reveal: 'none' | 'ask' | 'shown' }) {
  const { linkComponent: Link } = useLiro()
  const when = useWhen()
  const [diagnosis, setDiagnosis] = useState(reveal === 'shown')
  const [text, setText] = useState(false)
  return (
    <ClinicShell phone={phone} tab="patients" crumb={PATIENT.name}>
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={`Finding ${FINDING.number}`}
        back={{ href: `#${H_ROUTES.doctorCalendar}`, label: 'Doctor’s calendar' }}
        subtitle={`${PATIENT.name} · ${FINDING.kind}`}
        sections={[
          {
            id: 'patient',
            label: 'Patient',
            content: (
              <KeyValueList
                items={[
                  { label: 'Name', value: PATIENT.name },
                  { label: 'Health insurance', value: PATIENT.insurance, numeric: true },
                  {
                    label: 'Date of birth',
                    value: <DateText value={PATIENT.born} />,
                    numeric: true,
                  },
                ]}
              />
            ),
          },
          {
            id: 'finding',
            label: 'Finding',
            description: 'Health data: shown only for a reason, and every look is logged.',
            content: (
              <KeyValueList
                columns={1}
                items={[
                  { label: 'Date', value: <DateText value={FINDING.date} />, numeric: true },
                  { label: 'Doctor', value: FINDING.doctor },
                  {
                    label: 'Diagnosis',
                    value: (
                      <MaskedValue
                        label="Diagnosis"
                        reasons={REVEAL_REASONS}
                        allowOther
                        defaultAsking={reveal === 'ask'}
                        {...(diagnosis ? { value: FINDING.diagnosis } : {})}
                        onReveal={() => {
                          setDiagnosis(true)
                        }}
                        onHide={() => {
                          setDiagnosis(false)
                        }}
                      />
                    ),
                  },
                  {
                    label: 'Finding and advice',
                    value: (
                      <MaskedValue
                        label="Finding and advice"
                        reasons={REVEAL_REASONS}
                        allowOther
                        {...(text ? { value: FINDING.text } : {})}
                        onReveal={() => {
                          setText(true)
                        }}
                        onHide={() => {
                          setText(false)
                        }}
                      />
                    ),
                  },
                ]}
              />
            ),
          },
          {
            id: 'next',
            label: 'Next appointment',
            content: (
              <KeyValueList
                items={[
                  { label: 'When', value: when(FINDING.next) },
                  { label: 'Doctor', value: FINDING.doctor },
                  {
                    label: 'Booked',
                    value: (
                      <Link href={`#${H_ROUTES.clinicSchedule}`} className={LINK}>
                        Online, in the patient portal
                      </Link>
                    ),
                  },
                ]}
              />
            ),
          },
        ]}
      />
    </ClinicShell>
  )
}

// ── 5. School: the teacher's screens ───────────────────────────────────────────────────────────

const SCHOOL_COMPANY: ShellCompany = {
  id: SCHOOL.companyId,
  name: SCHOOL.name,
  description: `School year ${SCHOOL.year}`,
}

const TEACHER: ExampleAccount = {
  name: SCHOOL.teacher,
  email: 'dragana.simic@os-jovanpopovic.rs',
  companies: [SCHOOL_COMPANY],
  links: [
    { label: 'Timetable, class 7/2', path: H_ROUTES.timetable },
    { label: 'Attendance, class 7/2', path: H_ROUTES.attendance },
    { label: 'Gradebook, mathematics 7/2', path: H_ROUTES.gradebook },
  ],
}

const CLASS_TABS = (current: 'timetable' | 'attendance' | 'gradebook'): ModuleTab[] => [
  {
    key: 'timetable',
    label: 'Timetable',
    href: `#${H_ROUTES.timetable}`,
    current: current === 'timetable',
  },
  {
    key: 'attendance',
    label: 'Attendance',
    href: `#${H_ROUTES.attendance}`,
    current: current === 'attendance',
  },
  {
    key: 'gradebook',
    label: 'Gradebook',
    href: `#${H_ROUTES.gradebook}`,
    current: current === 'gradebook',
  },
]

function ClassShell({
  phone,
  tab,
  children,
}: {
  phone: boolean
  tab: 'timetable' | 'attendance' | 'gradebook'
  children: ReactNode
}) {
  return (
    <Tenant>
      <Shell
        phone={phone}
        account={TEACHER}
        company={SCHOOL.companyId}
        crumbs={[
          { label: 'Classes', href: `#${H_ROUTES.timetable}` },
          { label: `Class ${SCHOOL.className}` },
        ]}
        tabs={CLASS_TABS(tab)}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

export function ClassTimetable({ phone }: { phone: boolean }) {
  const { linkComponent: Link } = useLiro()
  return (
    <ClassShell phone={phone} tab="timetable">
      <Frame phone={phone}>
        <PageHeader
          title={`Timetable, class ${SCHOOL.className}`}
          subtitle={`${SCHOOL.name} · first term ${SCHOOL.year}`}
        />
        <p className="bidi-content m-0 text-sm text-secondary">
          Now: lesson 3, mathematics.{' '}
          <Link href={`#${H_ROUTES.attendance}`} className={LINK_IN_TEXT}>
            Mark attendance
          </Link>
        </p>
        <Timetable
          label={`Class ${SCHOOL.className}, ${SCHOOL.year}`}
          periods={PERIODS}
          lessons={LESSONS}
          now={SCHOOL.now}
          layout={phone ? 'phone' : 'desktop'}
        />
      </Frame>
    </ClassShell>
  )
}

/** The application applies the grid's changes to its value. */
function applyMarks(value: AttendanceValue, changes: readonly AttendanceChange[]) {
  const next: Record<string, Record<string, AttendanceChange['entry']>> = { ...value }
  for (const change of changes) {
    next[change.row] = { ...next[change.row], [change.column]: change.entry }
  }
  return next
}

export function LessonAttendance({ phone }: { phone: boolean }) {
  const { format, linkComponent: Link } = useLiro()
  const [value, setValue] = useState<AttendanceValue>(ATTENDANCE_VALUE)
  return (
    <ClassShell phone={phone} tab="attendance">
      <Frame phone={phone} wide>
        <PageHeader
          title={`Attendance, class ${SCHOOL.className}`}
          subtitle={`${format.dateLong(SCHOOL.day)} · lesson 3, mathematics, now`}
        />
        <p className="bidi-content m-0 text-sm text-secondary">
          Walk-through: what Luka Jovanović’s parent sees in the{' '}
          <Link href={`#${H_ROUTES.parent}`} className={LINK_IN_TEXT}>
            parents’ portal
          </Link>
          .
        </p>
        <AttendanceGrid
          label={`Attendance, class ${SCHOOL.className}, ${format.date(SCHOOL.day)}`}
          rowsLabel="Pupil"
          rows={PUPILS}
          columns={TODAY_LESSONS}
          codes={ATTENDANCE_CODES}
          value={value}
          onChange={(changes) => {
            setValue((current) => applyMarks(current, changes))
          }}
          {...attendanceTotals(value)}
          layout={phone ? 'phone' : 'desktop'}
          defaultRow={LUKA}
          defaultSelection={{
            anchor: { row: PUPILS[0]?.id ?? '', column: CURRENT_LESSON },
            focus: { row: PUPILS[0]?.id ?? '', column: CURRENT_LESSON },
          }}
        />
      </Frame>
    </ClassShell>
  )
}

export function Gradebook({ phone }: { phone: boolean }) {
  const [value, setValue] = useState<AttendanceValue>(GRADEBOOK_VALUE)
  return (
    <ClassShell phone={phone} tab="gradebook">
      <Frame phone={phone}>
        <PageHeader
          title={`Mathematics, class ${SCHOOL.className}`}
          subtitle={`Gradebook, first term ${SCHOOL.year} · ${SCHOOL.teacher}`}
        />
        <AttendanceGrid
          label={`Mathematics, class ${SCHOOL.className}, first term`}
          rowsLabel="Pupil"
          rows={PUPILS}
          columns={ASSESSMENTS}
          codes={MARK_CODES}
          value={value}
          onChange={(changes) => {
            setValue((current) => applyMarks(current, changes))
          }}
          rowTotals={gradebookTotals(value)}
          layout={phone ? 'phone' : 'desktop'}
          defaultRow={LUKA}
        />
      </Frame>
    </ClassShell>
  )
}

// ── 5. School: the parents' portal ─────────────────────────────────────────────────────────────

const PARENT_SECTIONS: PortalSection[] = [
  { key: 'grades', label: 'Grades', href: '#/portal/school/grades', icon: BookOpen },
  {
    key: 'attendance',
    label: 'Attendance',
    href: `#${H_ROUTES.parent}`,
    icon: CalendarCheck,
    current: true,
  },
  { key: 'timetable', label: 'Timetable', href: '#/portal/school/timetable', icon: ClipboardList },
  { key: 'messages', label: 'Messages', href: '#/portal/school/messages', icon: MessageSquare },
]

export function ParentAttendance({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const [absences, setAbsences] = useState<readonly Absence[]>(ABSENCES)
  const open = absences.filter((each) => !each.excused)
  const excused = absences.length - open.length
  const columns: DataTableColumn<Absence>[] = [
    {
      id: 'date',
      header: 'Date',
      numeric: true,
      cell: (row) => <DateText value={row.date} />,
    },
    {
      id: 'lesson',
      header: 'Lesson',
      numeric: true,
      cell: (row) => `${format.number(String(row.lesson))}.`,
    },
    { id: 'subject', header: 'Subject', cell: (row) => row.subject },
    {
      id: 'state',
      header: 'State',
      cell: (row) => statusBadge(row.excused ? 'Excused' : 'Not excused'),
    },
    { id: 'note', header: 'Note', cell: (row) => row.note ?? '—' },
  ]
  return (
    <Tenant>
      <PortalShell
        layout={phone ? 'phone' : 'desktop'}
        brand={{
          brandName: 'OŠ Jovan Popović',
          productName: 'Parents',
          href: `#${H_ROUTES.parent}`,
        }}
        participant={{ name: PARENT.name, detail: PARENT.detail }}
        menu={PORTAL_MENU}
        sections={PARENT_SECTIONS.map((section) =>
          section.key === 'attendance' && open.length > 0
            ? { ...section, note: `${format.number(String(open.length))} new` }
            : section,
        )}
        footer={`${SCHOOL.name} · Školska 5, Novi Sad · Secretary 021 6612 345, 08–14 h`}
      >
        <PortalPage title="Attendance">
          <SectionCard
            title={`Luka Jovanović, class ${SCHOOL.className}`}
            description={`First term ${SCHOOL.year}, up to ${format.date(SCHOOL.day)}`}
            headingLevel={2}
          >
            <KeyFigures
              layout={phone ? 'phone' : 'desktop'}
              items={[
                {
                  key: 'missed',
                  label: 'Lessons missed',
                  value: format.number(String(absences.length)),
                },
                { key: 'excused', label: 'Excused', value: format.number(String(excused)) },
                {
                  key: 'open',
                  label: 'Not excused yet',
                  value: format.number(String(open.length)),
                  ...(open.length > 0 ? { tone: 'warning' as const } : {}),
                },
              ]}
            />
          </SectionCard>
          {open.length > 0 && (
            <Alert tone="warning" title="Today’s absences are not excused yet">
              <div className="flex flex-col items-start gap-2">
                <span className="bidi-content">
                  {`Luka missed lessons 1 and 2 today (${open.map((each) => each.subject).join(', ')}). Excuse them within 8 days.`}
                </span>
                <Button
                  family="primary"
                  icon={Send}
                  label="Excuse today’s absences"
                  onClick={() => {
                    setAbsences((current) =>
                      current.map((each) =>
                        each.excused
                          ? each
                          : { ...each, excused: true, note: 'Dentist, note from the parent' },
                      ),
                    )
                    notice.success('Sent to the class teacher, Dragana Simić.')
                  }}
                />
              </div>
            </Alert>
          )}
          <SectionCard title="Absences" headingLevel={2} flush>
            <DataTable
              label="Absences of Luka Jovanović"
              columns={columns}
              rows={absences}
              getRowId={(row) => row.id}
              getRowLabel={(row) => `${format.date(row.date)}, lesson ${String(row.lesson)}`}
              inCard
              layout={phone ? 'cards' : 'table'}
              mobile={{
                title: (row) =>
                  `${format.date(row.date)} · lesson ${format.number(String(row.lesson))}`,
                subtitle: (row) => row.subject,
                badge: (row) => statusBadge(row.excused ? 'Excused' : 'Not excused'),
                details: ['note'],
              }}
            />
          </SectionCard>
        </PortalPage>
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </PortalShell>
    </Tenant>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_H_ROUTES: ExampleRoute[] = [
  { path: H_ROUTES.book, render: (phone) => <Booking phone={phone} step="service" /> },
  { path: H_ROUTES.bookTime, render: (phone) => <Booking phone={phone} step="time" /> },
  { path: H_ROUTES.bookConfirm, render: (phone) => <Booking phone={phone} step="confirm" /> },
  { path: H_ROUTES.booked, render: (phone) => <Booking phone={phone} step="done" /> },
  { path: H_ROUTES.clinicSchedule, render: (phone) => <ClinicSchedule phone={phone} /> },
  { path: H_ROUTES.doctorCalendar, render: (phone) => <DoctorCalendar phone={phone} /> },
  { path: H_ROUTES.finding, render: (phone) => <Finding phone={phone} reveal="none" /> },
  { path: H_ROUTES.findingAsk, render: (phone) => <Finding phone={phone} reveal="ask" /> },
  { path: H_ROUTES.findingShown, render: (phone) => <Finding phone={phone} reveal="shown" /> },
  { path: H_ROUTES.timetable, render: (phone) => <ClassTimetable phone={phone} /> },
  { path: H_ROUTES.attendance, render: (phone) => <LessonAttendance phone={phone} /> },
  { path: H_ROUTES.gradebook, render: (phone) => <Gradebook phone={phone} /> },
  { path: H_ROUTES.parent, render: (phone) => <ParentAttendance phone={phone} /> },
]
