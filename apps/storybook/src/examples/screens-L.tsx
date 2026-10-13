import {
  BadgeCheck,
  Ban,
  BedDouble,
  Brush,
  DoorOpen,
  LogIn,
  LogOut,
  Sparkles,
  Timer,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import {
  ActionGroup,
  addDays,
  ChangeConfirmDialog,
  DateRangeText,
  Drawer,
  KeyFigures,
  KeyValueList,
  MoneyText,
  notice,
  PageHeader,
  ResourceSchedule,
  RoomRack,
  SelectField,
  StatusBadge,
  Toaster,
  useLiro,
  type ActionItem,
  type ModuleTab,
  type RackFloor,
  type RackRoom,
  type RackState,
  type ScheduleBooking,
  type ScheduleMove,
  type ShellCompany,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { useExampleState } from './example-state'
import { Shell, type ExampleAccount } from './example-shell'
import { Frame, Tenant } from './screens-G'
import {
  FOLIOS,
  FORTNIGHT,
  HOTEL,
  L_ROUTES,
  nights,
  OUT_OF_ORDER,
  rackFloors,
  ROOM_SPECS,
  ROOM_TYPES,
  roomSpec,
  roomToday,
  STAY_MOVE,
  STAY_SHOWN,
  STAYS,
  stayBookings,
  todayFigures,
  type Housekeeping,
  type Occupancy,
  type Stay,
} from './data-L'

/*
 * Group L's example screens (P5.25, a hotel), one dataset (data-L.ts): Hotel Fruška's front desk
 * on Tuesday 6 October 2026 — the room rack (today's arrivals and departures, housekeeping), a
 * room in a drawer (the guest, the stay, the folio; Check in, Check out, Mark clean), the booking
 * timeline of the coming two weeks (ResourceSchedule by days) and the housekeeping view of one
 * floor on a phone. Every screen plays the application: it keeps the state and works out the
 * counts (data-L.ts); the components only show them.
 */

export { L_ROUTES }

/** The hotel's states and their tones: the application's data (one map for every screen). */
export const OCCUPANCY: RackState[] = [
  { id: 'arriving', label: 'Arriving today', tone: 'success', icon: LogIn },
  { id: 'departing', label: 'Departing today', tone: 'warning', icon: LogOut },
  { id: 'occupied', label: 'Occupied', tone: 'info', icon: BedDouble },
  { id: 'vacant', label: 'Vacant', tone: 'neutral', icon: DoorOpen },
  { id: 'out', label: 'Out of order', tone: 'danger', icon: Ban },
]

export const HOUSEKEEPING: RackState[] = [
  { id: 'dirty', label: 'Dirty', tone: 'warning', icon: Brush },
  { id: 'progress', label: 'Cleaning', tone: 'neutral', icon: Timer },
  { id: 'clean', label: 'Clean', tone: 'success', icon: Sparkles },
  { id: 'inspected', label: 'Inspected', tone: 'premium', icon: BadgeCheck },
]

const HOTEL_COMPANY: ShellCompany = {
  id: HOTEL.companyId,
  name: HOTEL.company,
  description: `${HOTEL.name}, ${HOTEL.town}`,
}

const FRONT_DESK: ExampleAccount = {
  name: 'Snežana Babić',
  email: 'recepcija@hotelfruska.rs',
  companies: [HOTEL_COMPANY],
  links: [
    { label: 'Room rack', path: L_ROUTES.rack },
    { label: 'Bookings, next two weeks', path: L_ROUTES.timeline },
    { label: 'Housekeeping, floor 3', path: L_ROUTES.housekeeping },
  ],
}

const HOUSEKEEPER: ExampleAccount = {
  name: 'Dragana Milošević',
  email: 'dragana.milosevic@hotelfruska.rs',
  companies: [HOTEL_COMPANY],
  links: [{ label: 'Housekeeping, floor 3', path: L_ROUTES.housekeeping }],
}

type HotelTab = 'rack' | 'bookings' | 'housekeeping'

const HOTEL_TABS = (current: HotelTab): ModuleTab[] => [
  { key: 'rack', label: 'Room rack', href: `#${L_ROUTES.rack}`, current: current === 'rack' },
  {
    key: 'bookings',
    label: 'Bookings',
    href: `#${L_ROUTES.timeline}`,
    current: current === 'bookings',
  },
  {
    key: 'housekeeping',
    label: 'Housekeeping',
    href: `#${L_ROUTES.housekeeping}`,
    current: current === 'housekeeping',
  },
]

function HotelShell({
  phone,
  tab,
  crumb,
  account = FRONT_DESK,
  children,
}: {
  phone: boolean
  tab: HotelTab
  crumb: string
  account?: ExampleAccount
  children: ReactNode
}) {
  return (
    <Tenant>
      <Shell
        phone={phone}
        account={account}
        company={HOTEL.companyId}
        crumbs={[{ label: HOTEL.name, href: `#${L_ROUTES.rack}` }, { label: crumb }]}
        tabs={HOTEL_TABS(tab)}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

/** The rooms as the screen keeps them: the stays' state today, with what was done since. */
function useHotelRooms() {
  // The hotel's record, kept above the screens (P5.28): what housekeeping marks clean, the front
  // desk sees, and a checked-out room stays vacant after leaving the rack.
  const [housekeeping, setHousekeeping] = useExampleState<Readonly<Record<string, Housekeeping>>>(
    'hotel.housekeeping',
    () => ({}),
  )
  const [occupancy, setOccupancy] = useExampleState<Readonly<Record<string, Occupancy>>>(
    'hotel.occupancy',
    () => ({}),
  )
  const floors: RackFloor[] = rackFloors(housekeeping).map((floor) => ({
    ...floor,
    rooms: floor.rooms.map((room) => {
      const changed = occupancy[room.id]
      if (changed === undefined) return room
      // Checked out: the room is vacant, its guest and stay gone from the rack.
      if (changed === 'vacant') {
        return {
          id: room.id,
          number: room.number,
          ...(room.type === undefined ? {} : { type: room.type }),
          occupancy: changed,
          ...(room.housekeeping === undefined ? {} : { housekeeping: room.housekeeping }),
        }
      }
      return { ...room, occupancy: changed }
    }),
  }))
  return {
    floors,
    setHousekeeping: (room: string, state: Housekeeping) => {
      setHousekeeping((current) => ({ ...current, [room]: state }))
    },
    setOccupancy: (room: string, state: Occupancy) => {
      setOccupancy((current) => ({ ...current, [room]: state }))
    },
  }
}

function findRoom(floors: readonly RackFloor[], id: string | null): RackRoom | undefined {
  return floors.flatMap((floor) => floor.rooms).find((room) => room.id === id)
}

const stateOf = (states: readonly RackState[], id: string | undefined) =>
  states.find((state) => state.id === id)

/** A room's facts in the drawer: states, guest, stay and the folio as text. */
function RoomFacts({ room }: { room: RackRoom }) {
  const { format } = useLiro()
  const spec = roomSpec(room.id)
  const stay = roomToday(spec).stay
  const folio = FOLIOS[room.id]
  const occupancy = stateOf(OCCUPANCY, room.occupancy)
  const housekeeping = stateOf(HOUSEKEEPING, room.housekeeping)
  return (
    <div className="flex flex-col gap-5">
      <KeyValueList
        columns={1}
        items={[
          {
            label: 'Occupancy',
            value: (
              <StatusBadge
                label={occupancy?.label ?? room.occupancy}
                tone={occupancy?.tone ?? 'neutral'}
                {...(occupancy?.icon === undefined ? {} : { icon: occupancy.icon })}
              />
            ),
          },
          { label: 'Housekeeping', value: housekeeping?.label },
          // A room without a guest shows no guest, stay or count rows.
          ...(room.guest === undefined || stay === undefined
            ? []
            : [
                { label: 'Guest', value: room.guest },
                {
                  label: 'Stay',
                  numeric: true,
                  value: (
                    <span className="bidi-content">
                      <DateRangeText from={stay.arrival} to={stay.departure} />
                      {` · ${format.number(String(nights(stay)))} ${nights(stay) === 1 ? 'night' : 'nights'}`}
                    </span>
                  ),
                },
                {
                  label: 'Guests',
                  numeric: true,
                  value: `${format.number(String(stay.adults))} ${stay.adults === 1 ? 'adult' : 'adults'}`,
                },
              ]),
          ...(room.notes === undefined
            ? []
            : [{ label: 'Notes', value: room.notes.map((note) => note.label).join(' · ') }]),
        ]}
      />
      {folio !== undefined && room.guest !== undefined && (
        <section aria-labelledby="folio-title" className="flex flex-col gap-2">
          <h3 id="folio-title" className="bidi-content m-0 text-sm font-semibold text-primary">
            Folio
          </h3>
          <KeyValueList
            columns={1}
            items={[
              ...folio.lines.map((line) => ({
                label: line.label,
                numeric: true,
                value: <MoneyText value={line.amount} currency={HOTEL.currency} />,
              })),
              {
                label: 'Total',
                numeric: true,
                value: <MoneyText value={folio.total} currency={HOTEL.currency} />,
              },
              {
                label: 'Paid',
                numeric: true,
                value: <MoneyText value={folio.paid} currency={HOTEL.currency} />,
              },
              {
                label: 'Balance',
                numeric: true,
                value: (
                  <MoneyText
                    value={folio.balance}
                    currency={HOTEL.currency}
                    className="font-semibold"
                  />
                ),
              },
            ]}
          />
        </section>
      )}
    </div>
  )
}

/** The room's drawer: its facts and the actions its state allows, the main one last. */
function RoomDrawer({
  room,
  actions,
  onClose,
}: {
  room: RackRoom | undefined
  actions: ActionItem[]
  onClose: () => void
}) {
  const spec = room === undefined ? undefined : roomSpec(room.id)
  return (
    <Drawer
      side="end"
      open={room !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={room === undefined ? '' : `Room ${room.number}`}
      description={
        spec === undefined
          ? undefined
          : `${ROOM_TYPES[spec.type] ?? spec.type} · Floor ${spec.number.slice(0, 1)}`
      }
      {...(actions.length === 0 ? {} : { actions: <ActionGroup actions={actions} /> })}
    >
      {room !== undefined && <RoomFacts room={room} />}
    </Drawer>
  )
}

// ── The front desk: the room rack ─────────────────────────────────────────────────────────────

export function FrontDesk({ phone, room = null }: { phone: boolean; room?: string | null }) {
  const { format } = useLiro()
  const rooms = useHotelRooms()
  const [chosen, setChosen] = useState<string | null>(room)
  const figures = todayFigures(rooms.floors)
  const current = findRoom(rooms.floors, chosen)

  const actions: ActionItem[] = []
  if (current !== undefined) {
    const ready = current.housekeeping === 'clean' || current.housekeeping === 'inspected'
    const markClean: ActionItem = {
      key: 'clean',
      label: 'Mark clean',
      family: 'positive',
      icon: Sparkles,
      onClick: () => {
        rooms.setHousekeeping(current.id, 'clean')
        notice.success(`Room ${current.number} is clean.`)
      },
    }
    if (current.occupancy === 'arriving') {
      if (!ready) actions.push(markClean)
      actions.push({
        key: 'check-in',
        label: 'Check in',
        family: 'primary',
        icon: LogIn,
        emphasis: 'primary',
        ...(ready ? {} : { unavailableReason: 'The room is not clean yet.' }),
        onClick: () => {
          rooms.setOccupancy(current.id, 'occupied')
          notice.success(`${current.guest ?? ''} checked in to room ${current.number}.`)
        },
      })
    } else if (current.occupancy === 'departing') {
      // Cleaning waits until the guest has left: the front desk's one action is Check out.
      actions.push({
        key: 'check-out',
        label: 'Check out',
        family: 'primary',
        icon: LogOut,
        emphasis: 'primary',
        onClick: () => {
          rooms.setOccupancy(current.id, 'vacant')
          rooms.setHousekeeping(current.id, 'dirty')
          notice.success(`${current.guest ?? ''} checked out of room ${current.number}.`)
        },
      })
    } else if (current.occupancy !== 'out' && !ready) {
      actions.push({ ...markClean, emphasis: 'primary' })
    }
  }

  return (
    <HotelShell phone={phone} tab="rack" crumb="Room rack">
      <Frame phone={phone} wide>
        <PageHeader
          title="Room rack"
          subtitle={`${HOTEL.name} · ${format.dateLong(HOTEL.today)}`}
        />
        <KeyFigures
          layout={phone ? 'phone' : 'desktop'}
          items={[
            { label: 'Arrivals today', value: format.number(String(figures.arrivals)) },
            { label: 'Departures today', value: format.number(String(figures.departures)) },
            {
              label: 'In house',
              value: `${format.number(String(figures.inHouse))} of ${format.number(String(figures.rooms))}`,
            },
            {
              label: 'To clean',
              value: format.number(String(figures.toClean)),
              tone: 'warning',
            },
          ]}
        />
        <RoomRack
          label={`Rooms, ${format.date(HOTEL.today)}`}
          floors={rooms.floors}
          occupancyStates={OCCUPANCY}
          housekeepingStates={HOUSEKEEPING}
          layout={phone ? 'phone' : 'desktop'}
          {...(chosen === null ? {} : { selectedId: chosen })}
          onRoomOpen={(each) => {
            setChosen(each.id)
          }}
        />
      </Frame>
      <RoomDrawer
        room={current}
        actions={actions}
        onClose={() => {
          setChosen(null)
        }}
      />
    </HotelShell>
  )
}

// ── The booking timeline ──────────────────────────────────────────────────────────────────────

/** A stay's dates as the front desk writes them: "06.10.2026. – 09.10.2026. · 3 nights". */
function stayDates(
  format: ReturnType<typeof useLiro>['format'],
  start: string,
  end: string,
): string {
  const departure = addDays(end, 1)
  const count = nights({ arrival: start, departure })
  return `${format.date(start)} – ${format.date(departure)} · ${format.number(String(count))} ${count === 1 ? 'night' : 'nights'}`
}

/**
 * A booking opened in place (P5.28 item 17): a drawer over the same timeline — the guest, the
 * room, the dates, the guests and the note. The user stays on the Bookings tab.
 */
function StayDrawer({
  stay,
  booking,
  onClose,
}: {
  stay: Stay | undefined
  booking: ScheduleBooking | undefined
  onClose: () => void
}) {
  const { format } = useLiro()
  const spec = booking === undefined ? undefined : roomSpec(booking.resourceId)
  return (
    <Drawer
      side="end"
      open={stay !== undefined && booking !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={stay?.guest ?? ''}
      description={
        booking === undefined || spec === undefined
          ? undefined
          : `Room ${booking.resourceId} · ${ROOM_TYPES[spec.type] ?? spec.type}`
      }
    >
      {stay !== undefined && booking !== undefined && (
        <KeyValueList
          columns={1}
          items={[
            { label: 'Room', value: `Room ${booking.resourceId}`, numeric: true },
            {
              label: 'Stay',
              numeric: true,
              value: (
                <span className="bidi-content">
                  {stayDates(format, booking.start, booking.end)}
                </span>
              ),
            },
            {
              label: 'Guests',
              numeric: true,
              value: `${format.number(String(stay.adults))} ${stay.adults === 1 ? 'adult' : 'adults'}`,
            },
            ...(stay.note === undefined ? [] : [{ label: 'Note', value: stay.note }]),
            {
              label: 'State',
              value: booking.locked === true ? 'In the house: the stay no longer moves' : 'Booked',
            },
          ]}
        />
      )}
    </Drawer>
  )
}

export function Bookings({
  phone,
  stay: initialStay,
  move: initialMove,
}: {
  phone: boolean
  /** A booking open in its drawer (a picture). */
  stay?: string
  /** A move proposed and asked (a picture). */
  move?: ScheduleMove
}) {
  const { format } = useLiro()
  const [floor, setFloor] = useState('1')
  // The stays' moves are the hotel's record, kept above the screens (P5.28).
  const [moved, setMoved] = useExampleState<
    Readonly<Record<string, Pick<ScheduleBooking, 'resourceId' | 'start' | 'end'>>>
  >('hotel.moves', () => ({}))
  const [open, setOpen] = useState<string | null>(initialStay ?? null)
  const [proposed, setProposed] = useState<ScheduleMove | null>(initialMove ?? null)
  const resources = ROOM_SPECS.filter((room) => room.number.startsWith(floor)).map((room) => ({
    id: room.number,
    name: `Room ${room.number}`,
    description: ROOM_TYPES[room.type] ?? room.type,
  }))
  const all = [1, 2, 3, 4]
    .flatMap((each) => stayBookings(each))
    .map((booking) => ({ ...booking, ...moved[booking.id] }))
  const bookings = all.filter((booking) => booking.resourceId.startsWith(floor))
  const first = FORTNIGHT[0] ?? HOTEL.today
  const last = FORTNIGHT.at(-1) ?? HOTEL.today
  const arriving = STAYS.filter(
    (stay) => stay.arrival >= first && stay.arrival <= last && stay.arrival > HOTEL.today,
  ).length
  const openBooking = all.find((booking) => booking.id === open)
  const openStay = STAYS.find((stay) => stay.id === open)
  const before = all.find((booking) => booking.id === proposed?.id)
  const movingStay = STAYS.find((stay) => stay.id === proposed?.id)
  return (
    <HotelShell phone={phone} tab="bookings" crumb="Bookings">
      <Frame phone={phone} wide>
        <PageHeader
          title="Bookings"
          subtitle={`${format.date(first)} – ${format.date(last)} · ${format.number(String(arriving))} arrivals to come`}
        />
        <div className={phone ? 'w-full' : 'w-48'}>
          <SelectField
            label="Floor"
            value={floor}
            options={['1', '2', '3', '4'].map((each) => ({ value: each, label: `Floor ${each}` }))}
            onChange={setFloor}
          />
        </div>
        <ResourceSchedule
          scale="days"
          days={FORTNIGHT}
          label={`Rooms on floor ${floor}, ${format.date(first)} – ${format.date(last)}`}
          resources={resources}
          bookings={bookings}
          unavailable={OUT_OF_ORDER}
          resourceLabel="Room"
          layout={phone ? 'phone' : 'desktop'}
          // A drag, the keys or "Move to…" only propose; the front desk confirms (P5.28 item 9).
          onMove={setProposed}
          // A booking opens in place, over the same timeline (P5.28 item 17).
          onSelect={(booking) => {
            setOpen(booking.id)
          }}
        />
      </Frame>
      <StayDrawer
        stay={openStay}
        booking={openBooking}
        onClose={() => {
          setOpen(null)
        }}
      />
      {proposed !== null && before !== undefined && movingStay !== undefined && (
        <ChangeConfirmDialog
          open
          onOpenChange={(next) => {
            if (!next) setProposed(null)
          }}
          title="Move stay"
          subject={movingStay.guest}
          changes={[
            ...(proposed.resourceId === before.resourceId
              ? []
              : [
                  {
                    label: 'Room',
                    from: `Room ${before.resourceId}`,
                    to: `Room ${proposed.resourceId}`,
                  },
                ]),
            ...(proposed.start === before.start && proposed.end === before.end
              ? []
              : [
                  {
                    label: 'Dates',
                    from: stayDates(format, before.start, before.end),
                    to: stayDates(format, proposed.start, proposed.end),
                  },
                ]),
          ]}
          affected={`${movingStay.guest} (guest), the front desk and housekeeping`}
          notify={[
            {
              id: 'guest',
              label: `Notify ${movingStay.guest} by e-mail`,
              description: 'The new room and dates, with the booking confirmation.',
              defaultChecked: true,
            },
          ]}
          onConfirm={(answer) => {
            setMoved((current) => ({
              ...current,
              [proposed.id]: {
                resourceId: proposed.resourceId,
                start: proposed.start,
                end: proposed.end,
              },
            }))
            notice.success(
              answer.notify.includes('guest')
                ? `Stay moved. ${movingStay.guest} gets an e-mail.`
                : 'Stay moved. No message was sent.',
            )
          }}
        />
      )}
    </HotelShell>
  )
}

// ── Housekeeping: one floor on a phone ────────────────────────────────────────────────────────

const MY_FLOOR = 'floor-3'

export function Housekeeping({ phone, room = null }: { phone: boolean; room?: string | null }) {
  const { format } = useLiro()
  const rooms = useHotelRooms()
  const [chosen, setChosen] = useState<string | null>(room)
  const floor = rooms.floors.filter((each) => each.id === MY_FLOOR)
  const current = findRoom(floor, chosen)
  const toClean = floor
    .flatMap((each) => each.rooms)
    .filter((each) => each.housekeeping === 'dirty')

  const actions: ActionItem[] = []
  if (current !== undefined && current.occupancy !== 'out') {
    const waiting = current.occupancy === 'departing' ? 'The guest has not checked out yet.' : null
    if (current.housekeeping === 'dirty') {
      actions.push({
        key: 'start',
        label: 'Start cleaning',
        family: 'neutral',
        icon: Timer,
        ...(waiting === null ? {} : { unavailableReason: waiting }),
        onClick: () => {
          rooms.setHousekeeping(current.id, 'progress')
          notice.info(`Cleaning room ${current.number}.`)
        },
      })
    }
    if (current.housekeeping === 'dirty' || current.housekeeping === 'progress') {
      actions.push({
        key: 'clean',
        label: 'Mark clean',
        family: 'positive',
        icon: Sparkles,
        emphasis: 'primary',
        ...(waiting === null ? {} : { unavailableReason: waiting }),
        onClick: () => {
          rooms.setHousekeeping(current.id, 'clean')
          setChosen(null)
          notice.success(`Room ${current.number} is clean. The front desk sees it.`)
        },
      })
    }
  }

  return (
    <HotelShell phone={phone} tab="housekeeping" crumb="Housekeeping" account={HOUSEKEEPER}>
      <Frame phone={phone} wide>
        <PageHeader
          title="Housekeeping"
          subtitle={`Floor 3 · ${format.number(String(toClean.length))} ${toClean.length === 1 ? 'room' : 'rooms'} to clean · ${HOUSEKEEPER.name}`}
        />
        <RoomRack
          label="Floor 3, rooms to clean"
          floors={floor}
          occupancyStates={OCCUPANCY}
          housekeepingStates={HOUSEKEEPING}
          defaultFilter={{ housekeeping: 'dirty' }}
          headingLevel={2}
          layout={phone ? 'phone' : 'desktop'}
          {...(chosen === null ? {} : { selectedId: chosen })}
          onRoomOpen={(each) => {
            setChosen(each.id)
          }}
        />
      </Frame>
      <RoomDrawer
        room={current}
        actions={actions}
        onClose={() => {
          setChosen(null)
        }}
      />
    </HotelShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_L_ROUTES: ExampleRoute[] = [
  { path: L_ROUTES.rack, render: (phone) => <FrontDesk phone={phone} /> },
  // Every room opens in the rack's drawer (the timeline's stays open their room).
  ...ROOM_SPECS.map((each) => ({
    path: `${L_ROUTES.rack}?room=${each.number}`,
    render: (phone: boolean) => <FrontDesk phone={phone} room={each.number} />,
  })),
  { path: L_ROUTES.timeline, render: (phone) => <Bookings phone={phone} /> },
  { path: L_ROUTES.timelineStay, render: (phone) => <Bookings phone={phone} stay={STAY_SHOWN} /> },
  { path: L_ROUTES.timelineMove, render: (phone) => <Bookings phone={phone} move={STAY_MOVE} /> },
  { path: L_ROUTES.housekeeping, render: (phone) => <Housekeeping phone={phone} /> },
  {
    path: L_ROUTES.housekeepingRoom,
    render: (phone) => <Housekeeping phone={phone} room="306" />,
  },
]
