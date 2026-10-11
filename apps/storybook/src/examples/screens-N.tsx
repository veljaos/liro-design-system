import {
  ArrowRightLeft,
  Armchair,
  ClipboardList,
  LogOut,
  ScanLine,
  Sparkles,
  Unlock,
} from 'lucide-react'
import { useContext, useState } from 'react'
import {
  ActionGroup,
  addDays,
  Button,
  DateText,
  Drawer,
  EmptyState,
  FloorPlan,
  KeyFigures,
  KeyValueList,
  MaskedValue,
  notice,
  PageHeader,
  SectionCard,
  SelectField,
  StatusBadge,
  Toaster,
  useLiro,
  type ActionItem,
  type FloorItem,
  type FloorState,
  type KeyValueItem,
  type ShellCompany,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell, type ExampleAccount } from './example-shell'
import { Frame } from './screens-G'
import { I_ROUTES } from './data-I'
import {
  BED_STATES,
  bedItems,
  BEDS,
  BIN_STATES,
  binItems,
  BINS,
  DESK_BOOKINGS,
  DESK_STATES,
  deskItems,
  DESKS,
  HOSPITAL,
  N_ROUTES,
  NAME_REASONS,
  OFFICE,
  OFFICE_AREAS,
  OFFICE_DRAWING_URI,
  OFFICE_SIZE,
  rackOf,
  WARD_AREAS,
  WARD_DRAWING_URI,
  WARD_SIZE,
  WAREHOUSE,
  WAREHOUSE_AREAS,
  WAREHOUSE_FIXTURES,
  WAREHOUSE_SIZE,
  type Bed,
  type Bin,
} from './data-N'

/*
 * Group N's example screens (P5.25a): FloorPlan in three more places, each played by the
 * application around it (data-N.ts): it keeps the bins, beds and bookings, decides every action
 * and works out every state; the plan shows them and reports what the user chooses.
 * - Magacin Novi Sad's hall (zones, racks of bins, the bulk yard as a polygon): each bin how full
 *   and in which state; a bin opens its record in an end Drawer with its stock, and "Count" or
 *   "Pick here" go on to the handheld's count and pick list (group I, P5.11).
 * - Interno odeljenje 3 over the building's drawing: rooms (two polygons) and beds; a bed opens
 *   in a Drawer, the patient's name masked until the nurse gives a reason (MaskedValue, P5.14);
 *   never on the plan's face.
 * - Kvadrat Gradnja's office, floor 2, over the architect's drawing: desks for a day chosen from
 *   the provider's today; a free desk is booked, one's own booking cancelled.
 */

export { N_ROUTES }

const stateOf = (states: readonly FloorState[], id: string | undefined) =>
  states.find((state) => state.id === id)

/** A state as a badge, for a drawer or a panel. */
function StateBadge({ states, id }: { states: readonly FloorState[]; id: string | undefined }) {
  const state = stateOf(states, id)
  if (state === undefined) return null
  return <StatusBadge label={state.label} tone={state.tone} icon={state.icon} />
}

// ── The warehouse ─────────────────────────────────────────────────────────────────────────────

const WAREHOUSE_COMPANY: ShellCompany = {
  id: WAREHOUSE.companyId,
  name: WAREHOUSE.company,
  description: WAREHOUSE.address,
}

const SHIFT_LEADER: ExampleAccount = {
  name: WAREHOUSE.manager.name,
  email: WAREHOUSE.manager.email,
  companies: [WAREHOUSE_COMPANY],
  links: [
    { label: 'Floor plan', path: N_ROUTES.warehouse },
    { label: 'Pick list PL-2026-0418', path: I_ROUTES.picking },
    { label: 'Count CC-2026-0031', path: I_ROUTES.count },
  ],
}

/** The list's groups: one per rack, the bulk yard's bays together. */
function binGroup(item: FloorItem) {
  if (item.areaId === 'ze') return { id: 'E', label: 'Bulk yard E' }
  const rack = rackOf(item.id)
  const [aisle = '', number = ''] = rack.split('-')
  return { id: rack, label: `Rack ${aisle}${String(Number(number))}` }
}

/** A bin's record: its state, how full, its stock, and what can be done there. */
function BinDrawer({
  bin,
  onClose,
  onCount,
  onPick,
  onUnblock,
}: {
  bin: Bin | undefined
  onClose: () => void
  onCount: (bin: Bin) => void
  onPick: () => void
  onUnblock: (bin: Bin) => void
}) {
  const { format, messages } = useLiro()
  const actions: ActionItem[] = []
  if (bin !== undefined) {
    if (bin.state === 'blocked') {
      actions.push({
        key: 'unblock',
        label: 'Unblock',
        family: 'neutral',
        icon: Unlock,
        onClick: () => {
          onUnblock(bin)
        },
      })
    }
    const pickHere = bin.code === 'B-03-04'
    actions.push({
      key: 'count',
      label: bin.state === 'count' ? 'Count now' : 'Count',
      family: 'primary',
      icon: ClipboardList,
      ...(pickHere || bin.state === 'blocked' ? {} : { emphasis: 'primary' as const }),
      onClick: () => {
        onCount(bin)
      },
    })
    if (pickHere) {
      actions.push({
        key: 'pick',
        label: 'Pick here',
        family: 'primary',
        icon: ScanLine,
        emphasis: 'primary',
        onClick: onPick,
      })
    }
  }
  const zone = WAREHOUSE_AREAS.find((area) => area.id === bin?.zone)
  const facts: KeyValueItem[] =
    bin === undefined
      ? []
      : [
          { label: 'State', value: <StateBadge states={BIN_STATES} id={bin.state} /> },
          {
            label: 'Fill level',
            numeric: true,
            value: messages['floorPlan.level'](format.percent(bin.percent)),
          },
          ...(bin.note === undefined ? [] : [{ label: 'Note', value: bin.note }]),
        ]
  return (
    <Drawer
      side="end"
      open={bin !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={bin === undefined ? '' : `Bin ${bin.code}`}
      description={bin === undefined ? undefined : `${bin.name} · ${zone?.label ?? ''}`}
      {...(actions.length === 0 ? {} : { actions: <ActionGroup actions={actions} /> })}
    >
      {bin !== undefined && (
        <div className="flex flex-col gap-5">
          <KeyValueList columns={1} items={facts} />
          <section aria-labelledby="bin-stock" className="flex flex-col gap-2">
            <h3 id="bin-stock" className="bidi-content m-0 text-sm font-semibold text-primary">
              Stock
            </h3>
            {bin.stock.length === 0 ? (
              <p className="bidi-content m-0 text-sm text-secondary">Nothing in this bin.</p>
            ) : (
              <KeyValueList
                columns={1}
                items={bin.stock.map((line) => ({
                  label: (
                    <span className="flex flex-col">
                      <span className="bidi-content">{line.item}</span>
                      <span className="text-xs text-tertiary" dir="auto">
                        {line.itemCode}
                      </span>
                    </span>
                  ),
                  numeric: true,
                  value: `${format.number(line.quantity)} ${line.unit}`,
                }))}
              />
            )}
          </section>
        </div>
      )}
    </Drawer>
  )
}

/** Magacin Novi Sad's hall: every bin, how full and in which state; a bin opens its record. */
export function WarehousePlan({ phone, bin: initial }: { phone: boolean; bin?: string }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const [bins, setBins] = useState<readonly Bin[]>(BINS)
  const [chosen, setChosen] = useState<string | undefined>(initial)
  const [open, setOpen] = useState(initial !== undefined)
  const bin = open ? bins.find((each) => each.code === chosen) : undefined
  const count = (state: string) =>
    format.number(String(bins.filter((each) => each.state === state).length))
  return (
    <Shell
      phone={phone}
      account={SHIFT_LEADER}
      company={WAREHOUSE.companyId}
      crumbs={[{ label: WAREHOUSE.name, href: `#${N_ROUTES.warehouse}` }, { label: 'Floor plan' }]}
    >
      <Frame phone={phone} wide>
        <PageHeader
          title="Floor plan"
          subtitle={`${WAREHOUSE.name} · ${format.dateLong('2026-10-06')}`}
        />
        <KeyFigures
          layout={phone ? 'phone' : 'desktop'}
          items={[
            { key: 'bins', label: 'Bins', value: format.number(String(bins.length)) },
            { key: 'empty', label: 'Empty', value: count('empty') },
            { key: 'low', label: 'Low', value: count('low'), tone: 'warning' },
            { key: 'blocked', label: 'Blocked', value: count('blocked'), tone: 'danger' },
          ]}
        />
        <FloorPlan
          label={`${WAREHOUSE.name}, bins`}
          items={[...WAREHOUSE_FIXTURES, ...binItems(bins)]}
          width={WAREHOUSE_SIZE.width}
          height={WAREHOUSE_SIZE.height}
          areas={WAREHOUSE_AREAS}
          states={BIN_STATES}
          selected={chosen === undefined ? [] : [chosen]}
          onSelectionChange={(selected) => {
            setChosen(selected[0])
          }}
          onItemActivate={(item) => {
            setChosen(item.id)
            setOpen(true)
          }}
          listGroup={binGroup}
          headingLevel={2}
          layout={phone ? 'phone' : 'desktop'}
        />
        <BinDrawer
          bin={bin}
          onClose={() => {
            setOpen(false)
          }}
          onCount={(each) => {
            if (each.code === 'A-02-03') {
              navigate(I_ROUTES.count)
              return
            }
            setBins((current) =>
              current.map((one) => (one.code === each.code ? { ...one, state: 'count' } : one)),
            )
            setOpen(false)
            notice.success(`Count CC-2026-0032 started for ${each.code}.`)
          }}
          onPick={() => {
            navigate(I_ROUTES.picking)
          }}
          onUnblock={(each) => {
            setBins((current) =>
              current.map((one) =>
                one.code === each.code ? { ...one, state: 'stock', note: 'Unblocked today.' } : one,
              ),
            )
            notice.success(`${each.code} unblocked.`)
          }}
        />
      </Frame>
      <Toaster layout={phone ? 'phone' : 'desktop'} />
    </Shell>
  )
}

// ── The hospital ward ─────────────────────────────────────────────────────────────────────────

const HOSPITAL_COMPANY: ShellCompany = {
  id: HOSPITAL.companyId,
  name: HOSPITAL.company,
  description: HOSPITAL.address,
}

const NURSE: ExampleAccount = {
  name: HOSPITAL.nurse.name,
  email: HOSPITAL.nurse.email,
  companies: [HOSPITAL_COMPANY],
  links: [{ label: `${HOSPITAL.ward}, beds`, path: N_ROUTES.ward }],
}

/** A bed's drawer: its state, the patient (the name masked), and what can be done. */
function BedDrawer({
  bed,
  onClose,
  onChange,
}: {
  bed: Bed | undefined
  onClose: () => void
  onChange: (bed: Bed, change: Partial<Bed>, message: string) => void
}) {
  // The name is in the page only after a reason (the application logs it); hidden again on close.
  const [revealed, setRevealed] = useState<string | null>(null)
  const room = WARD_AREAS.find((area) => area.id === bed?.room)
  const actions: ActionItem[] = []
  if (bed !== undefined) {
    const name = `Bed ${String(bed.number)}`
    if (bed.state === 'free') {
      actions.push({
        key: 'admit',
        label: 'Admit patient…',
        family: 'primary',
        icon: ArrowRightLeft,
        emphasis: 'primary',
        onClick: () => {
          notice.info(`Admission to ${name} opened in the admissions office’s list.`)
        },
      })
    } else if (bed.state === 'occupied') {
      actions.push(
        {
          key: 'transfer',
          label: 'Transfer…',
          family: 'neutral',
          icon: ArrowRightLeft,
          onClick: () => {
            notice.info(`Transfer from ${name}: choose the bed in the transfer list.`)
          },
        },
        {
          key: 'discharge',
          label: 'Discharge',
          family: 'primary',
          icon: LogOut,
          emphasis: 'primary',
          onClick: () => {
            setRevealed(null)
            onChange(
              bed,
              { state: 'cleaning', note: 'Discharged today' },
              `${name} discharged. It needs cleaning.`,
            )
          },
        },
      )
    } else if (bed.state === 'cleaning') {
      actions.push({
        key: 'clean',
        label: 'Mark clean',
        family: 'positive',
        icon: Sparkles,
        emphasis: 'primary',
        onClick: () => {
          onChange(bed, { state: 'free' }, `${name} is clean and free.`)
        },
      })
    } else {
      actions.push({
        key: 'unblock',
        label: 'Unblock',
        family: 'neutral',
        icon: Unlock,
        onClick: () => {
          onChange(bed, { state: 'free' }, `${name} unblocked.`)
        },
      })
    }
  }
  const items: KeyValueItem[] =
    bed === undefined
      ? []
      : [
          { label: 'State', value: <StateBadge states={BED_STATES} id={bed.state} /> },
          ...(bed.patient === undefined
            ? []
            : [
                {
                  label: 'Patient',
                  value: (
                    <MaskedValue
                      label="Patient’s name"
                      reasons={NAME_REASONS}
                      allowOther
                      {...(revealed === null ? {} : { value: revealed })}
                      onReveal={() => {
                        setRevealed(bed.patient?.name ?? null)
                      }}
                      onHide={() => {
                        setRevealed(null)
                      }}
                    />
                  ),
                },
                {
                  label: 'Admitted',
                  numeric: true,
                  value: <DateText value={bed.patient.admitted} />,
                },
                { label: 'Doctor', value: bed.patient.doctor },
              ]),
          ...(bed.note === undefined ? [] : [{ label: 'Note', value: bed.note }]),
        ]
  return (
    <Drawer
      side="end"
      open={bed !== undefined}
      onOpenChange={(open) => {
        if (!open) {
          setRevealed(null)
          onClose()
        }
      }}
      title={bed === undefined ? '' : `Bed ${String(bed.number)}`}
      description={bed === undefined ? undefined : `${room?.label ?? ''} · ${HOSPITAL.ward}`}
      {...(actions.length === 0 ? {} : { actions: <ActionGroup actions={actions} /> })}
    >
      {bed !== undefined && <KeyValueList columns={1} items={items} />}
    </Drawer>
  )
}

/** Interno odeljenje 3: rooms and beds over the building's drawing; a bed opens in a drawer. */
export function Ward({ phone, bed: initial }: { phone: boolean; bed?: string }) {
  const { format } = useLiro()
  const [beds, setBeds] = useState<readonly Bed[]>(BEDS)
  const [chosen, setChosen] = useState<string | undefined>(initial)
  const [open, setOpen] = useState(initial !== undefined)
  const bed = open ? beds.find((each) => each.id === chosen) : undefined
  const count = (state: string) =>
    format.number(String(beds.filter((each) => each.state === state).length))
  return (
    <Shell
      phone={phone}
      account={NURSE}
      company={HOSPITAL.companyId}
      crumbs={[{ label: HOSPITAL.ward, href: `#${N_ROUTES.ward}` }, { label: 'Beds' }]}
    >
      <Frame phone={phone} wide>
        <PageHeader title="Beds" subtitle={`${HOSPITAL.ward} · ${format.dateLong('2026-10-06')}`} />
        <KeyFigures
          layout={phone ? 'phone' : 'desktop'}
          items={[
            { key: 'free', label: 'Free', value: count('free') },
            { key: 'occupied', label: 'Occupied', value: count('occupied') },
            { key: 'cleaning', label: 'Needs cleaning', value: count('cleaning'), tone: 'warning' },
            { key: 'blocked', label: 'Blocked', value: count('blocked'), tone: 'danger' },
          ]}
        />
        <FloorPlan
          label={`${HOSPITAL.ward}, beds`}
          items={bedItems(beds)}
          width={WARD_SIZE.width}
          height={WARD_SIZE.height}
          areas={WARD_AREAS}
          states={BED_STATES}
          background={{ src: WARD_DRAWING_URI }}
          selected={chosen === undefined ? [] : [chosen]}
          onSelectionChange={(selected) => {
            setChosen(selected[0])
          }}
          onItemActivate={(item) => {
            setChosen(item.id)
            setOpen(true)
          }}
          headingLevel={2}
          layout={phone ? 'phone' : 'desktop'}
        />
        <BedDrawer
          // A new bed starts masked: the drawer's state belongs to one bed.
          key={bed?.id ?? 'none'}
          bed={bed}
          onClose={() => {
            setOpen(false)
          }}
          onChange={(each, change, message) => {
            setBeds((current) =>
              current.map((one) => (one.id === each.id ? { ...one, ...change } : one)),
            )
            notice.success(message)
          }}
        />
      </Frame>
      <Toaster layout={phone ? 'phone' : 'desktop'} />
    </Shell>
  )
}

// ── The office ────────────────────────────────────────────────────────────────────────────────

/** The next five working days from today (the provider's), as YYYY-MM-DD. */
function workingDays(today: string): string[] {
  const days: string[] = []
  for (let offset = 0; days.length < 5; offset += 1) {
    const day = addDays(today, offset)
    const [y = 2000, m = 1, d = 1] = day.split('-').map(Number)
    const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
    if (weekday !== 0 && weekday !== 6) days.push(day)
  }
  return days
}

/** The chosen desk on the chosen day: its facts and Book or Cancel booking. */
function DeskPanel({
  item,
  dayText,
  bookedBy,
  equipment,
  onBook,
  onCancel,
}: {
  item: FloorItem | undefined
  dayText: string
  bookedBy: string | undefined
  equipment: string
  onBook: () => void
  onCancel: () => void
}) {
  if (item === undefined) {
    return (
      <SectionCard title="Desk" headingLevel={2}>
        <EmptyState
          compact
          title="No desk chosen"
          description="Choose a desk on the plan or in the list to book it."
        />
      </SectionCard>
    )
  }
  const area = OFFICE_AREAS.find((each) => each.id === item.areaId)
  const facts: KeyValueItem[] = [
    { label: 'Day', value: dayText, numeric: true },
    { label: 'Area', value: area?.label ?? '' },
    { label: 'Equipment', value: equipment },
    ...(bookedBy === undefined ? [] : [{ label: 'Booked by', value: bookedBy }]),
    ...(item.note === undefined ? [] : [{ label: 'Note', value: item.note }]),
  ]
  const action =
    item.stateId === 'free' ? (
      <Button family="primary" emphasis="primary" icon={Armchair} label="Book" onClick={onBook} />
    ) : item.stateId === 'mine' ? (
      <Button intent="cancel" label="Cancel booking" onClick={onCancel} />
    ) : null
  return (
    <SectionCard
      title={
        <span className="flex flex-wrap items-center gap-2">
          <span className="bidi-content">{item.label}</span>
          <StateBadge states={DESK_STATES} id={item.stateId} />
        </span>
      }
      headingLevel={2}
    >
      <div className="flex flex-col gap-4">
        <KeyValueList items={facts} columns={1} />
        {action !== null && <div className="flex flex-wrap justify-end gap-2">{action}</div>}
      </div>
    </SectionCard>
  )
}

/** Kvadrat Gradnja's office, floor 2: desks on a day over the architect's drawing. */
export function OfficeDesks({ phone, desk: initial }: { phone: boolean; desk?: string }) {
  const { format, today } = useLiro()
  const days = workingDays(today)
  const [day, setDay] = useState(days[0] ?? today)
  const [bookings, setBookings] = useState<Record<string, Record<string, string>>>(DESK_BOOKINGS)
  const [chosen, setChosen] = useState<string | undefined>(initial)
  const dayText = (value: string) => {
    const [y = 2000, m = 1, d = 1] = value.split('-').map(Number)
    const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay()
    return `${format.weekdayName(weekday, 'long')} ${format.date(value)}`
  }
  const booked = bookings[day] ?? {}
  const items = deskItems(DESKS, booked)
  const item = items.find((each) => each.id === chosen)
  const desk = DESKS.find((each) => each.id === chosen)
  const who = chosen === undefined ? undefined : booked[chosen]
  const free = items.filter((each) => each.stateId === 'free').length
  const plan = (
    <FloorPlan
      label={`${OFFICE.name}, desks on ${dayText(day)}`}
      items={items}
      width={OFFICE_SIZE.width}
      height={OFFICE_SIZE.height}
      areas={OFFICE_AREAS}
      states={DESK_STATES}
      background={{ src: OFFICE_DRAWING_URI, opacity: 0.8 }}
      selected={chosen === undefined ? [] : [chosen]}
      onSelectionChange={(selected) => {
        setChosen(selected[0])
      }}
      onItemActivate={(each) => {
        setChosen(each.id)
      }}
      headingLevel={3}
      layout={phone ? 'phone' : 'desktop'}
    />
  )
  const panel = (
    <DeskPanel
      item={item}
      dayText={dayText(day)}
      bookedBy={who === OFFICE.me ? undefined : who}
      equipment={desk?.equipment ?? ''}
      onBook={() => {
        if (chosen === undefined || item === undefined) return
        const previous = Object.entries(booked).find(([, name]) => name === OFFICE.me)?.[0]
        // The office's rule: one desk a person a day; booking another gives the first back.
        const next: Record<string, string> = Object.fromEntries(
          Object.entries(booked).filter(([id]) => id !== previous),
        )
        next[chosen] = OFFICE.me
        setBookings((current) => ({ ...current, [day]: next }))
        const before = items.find((each) => each.id === previous)
        notice.success(
          before === undefined
            ? `${item.label} booked for ${dayText(day)}.`
            : `${item.label} booked for ${dayText(day)}; ${before.label} is free again.`,
        )
      }}
      onCancel={() => {
        if (chosen === undefined || item === undefined) return
        const next = Object.fromEntries(Object.entries(booked).filter(([id]) => id !== chosen))
        setBookings((current) => ({ ...current, [day]: next }))
        notice.success(`Booking of ${item.label} for ${dayText(day)} cancelled.`)
      }}
    />
  )
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Office', href: `#${N_ROUTES.office}` }, { label: 'Desks' }]}
    >
      <Frame phone={phone} wide>
        <PageHeader title="Desks" subtitle={`${OFFICE.name} · ${OFFICE.floor}`} />
        <div className="flex flex-wrap items-end gap-x-6 gap-y-2">
          <SelectField
            label="Day"
            value={day}
            onChange={(value) => {
              if (value !== '') setDay(value)
            }}
            options={days.map((value) => ({
              value,
              label: value === today ? `Today, ${dayText(value)}` : dayText(value),
            }))}
            className={phone ? 'w-full' : 'w-72'}
          />
          <p className="bidi-content m-0 pb-2 text-sm text-secondary">
            {free === 1 ? '1 desk free' : `${format.number(String(free))} desks free`}
          </p>
        </div>
        {phone ? (
          <div className="flex flex-col gap-4">
            {item !== undefined && panel}
            {plan}
          </div>
        ) : (
          <div className="grid grid-cols-[minmax(0,1fr)_20rem] items-start gap-6">
            {plan}
            {panel}
          </div>
        )}
      </Frame>
      <Toaster layout={phone ? 'phone' : 'desktop'} />
    </Shell>
  )
}

export const GROUP_N_ROUTES: ExampleRoute[] = [
  { path: N_ROUTES.warehouse, render: (phone) => <WarehousePlan phone={phone} /> },
  {
    path: N_ROUTES.warehouseBin,
    render: (phone) => <WarehousePlan phone={phone} bin="A-02-03" />,
  },
  {
    path: N_ROUTES.warehousePick,
    render: (phone) => <WarehousePlan phone={phone} bin="B-03-04" />,
  },
  { path: N_ROUTES.ward, render: (phone) => <Ward phone={phone} /> },
  { path: N_ROUTES.wardBed, render: (phone) => <Ward phone={phone} bed="b9" /> },
  { path: N_ROUTES.office, render: (phone) => <OfficeDesks phone={phone} /> },
  { path: N_ROUTES.officeDesk, render: (phone) => <OfficeDesks phone={phone} desk="d7" /> },
  { path: N_ROUTES.officeOwn, render: (phone) => <OfficeDesks phone={phone} desk="d3" /> },
]
