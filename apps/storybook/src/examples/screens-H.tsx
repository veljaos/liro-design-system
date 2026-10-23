import {
  CalendarDays,
  CalendarPlus,
  FlaskConical,
  Languages,
  LogOut,
  MessageSquare,
  UserRound,
} from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  Alert,
  Button,
  CalendarView,
  KeyValueList,
  PageHeader,
  PortalShell,
  RadioGroupField,
  SectionCard,
  SelectField,
  SlotPicker,
  Stepper,
  Toaster,
  UnavailableAction,
  slotKey,
  useLiro,
  type MenuEntry,
  type ModuleTab,
  type PortalSection,
  type ShellCompany,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell, statusBadge, type ExampleAccount } from './example-shell'
import { Frame, Tenant } from './screens-G'
import {
  BOOKINGS,
  CHOSEN_DOCTOR,
  CLINIC,
  DOCTOR_EVENTS,
  DOCTORS,
  FREE_SLOTS,
  JOVANA_SLOT,
  PATIENT,
  SERVICES,
} from './data-H'

/*
 * Group H's example screens (P5.17, industry examples) for Dom zdravlja Novi Sad (data-H.ts):
 * Jovana Nikolić books a check-up in the patient portal (PortalShell: service and doctor, a free
 * time, booked), and the doctor's week (CalendarView) with her booking. Every screen plays the
 * application: it keeps the state and works out the counts (data-H.ts).
 */

export const H_ROUTES = {
  book: '/portal/health/book',
  bookTime: '/portal/health/book?step=time',
  bookConfirm: '/portal/health/book?step=confirm',
  booked: '/portal/health/book?step=done',
  clinicSchedule: `/clinic/schedule/${CLINIC.day}`,
  doctorCalendar: `/clinic/calendar/${CHOSEN_DOCTOR}/${CLINIC.week.start}`,
}

const LINK = 'text-link no-underline visited:text-link hover:underline'
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

// ── The patient portal ────────────────────────────────────────────────────────────────────────

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
            </>
          )}
        </PortalPage>
      </HealthPortal>
    </Tenant>
  )
}

// ── The clinic ────────────────────────────────────────────────────────────────────────────────

const CLINIC_COMPANY: ShellCompany = {
  id: CLINIC.companyId,
  name: CLINIC.company,
  description: CLINIC.name,
}

const RECEPTION: ExampleAccount = {
  name: 'Gordana Babić',
  email: 'gordana.babic@dzns.rs',
  companies: [CLINIC_COMPANY],
  links: [{ label: 'Calendar of dr Marko Stanković', path: H_ROUTES.doctorCalendar }],
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
    href: '#/clinic/patients',
    current: current === 'patients',
  },
]

export function ClinicShell({
  phone,
  tab,
  crumb,
  today,
  children,
}: {
  phone: boolean
  tab: 'schedule' | 'calendar' | 'patients'
  crumb: string
  /** The calendar is seen on the day of the appointment (P5.28 item 10). */
  today?: string
  children: ReactNode
}) {
  return (
    <Tenant {...(today === undefined ? {} : { today })}>
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

export function DoctorCalendar({ phone }: { phone: boolean }) {
  const count = BOOKINGS.filter((each) => each.resourceId === CHOSEN_DOCTOR).length
  const { format } = useLiro()
  return (
    <ClinicShell phone={phone} tab="calendar" crumb={doctorName(CHOSEN_DOCTOR)} today={CLINIC.day}>
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
          now={CLINIC.now}
          layout={phone ? 'phone' : 'desktop'}
        />
      </Frame>
    </ClinicShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_H_ROUTES: ExampleRoute[] = [
  { path: H_ROUTES.book, render: (phone) => <Booking phone={phone} step="service" /> },
  { path: H_ROUTES.bookTime, render: (phone) => <Booking phone={phone} step="time" /> },
  { path: H_ROUTES.bookConfirm, render: (phone) => <Booking phone={phone} step="confirm" /> },
  { path: H_ROUTES.booked, render: (phone) => <Booking phone={phone} step="done" /> },
  { path: H_ROUTES.doctorCalendar, render: (phone) => <DoctorCalendar phone={phone} /> },
]
