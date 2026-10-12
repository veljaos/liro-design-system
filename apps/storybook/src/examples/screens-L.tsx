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
import { useContext, useState, type ReactNode } from 'react'
import {
  ActionGroup,
  addDays,
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
  type ShellCompany,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell, type ExampleAccount } from './example-shell'
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
  STAYS,
  stayBookings,
  todayFigures,
  type Housekeeping,
  type Occupancy,
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
function useHotelRooms(initial: Readonly<Record<string, Housekeeping>> = {}) {
  const [housekeeping, setHousekeeping] = useState<Record<string, Housekeeping>>({ ...initial })
  const [occupancy, setOccupancy] = useState<Record<string, Occupancy>>({})
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

export function Bookings({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const [floor, setFloor] = useState('1')
  const [moved, setMoved] = useState<
    Record<string, Pick<ScheduleBooking, 'resourceId' | 'start' | 'end'>>
  >({})
  const resources = ROOM_SPECS.filter((room) => room.number.startsWith(floor)).map((room) => ({
    id: room.number,
    name: `Room ${room.number}`,
    description: ROOM_TYPES[room.type] ?? room.type,
  }))
  const bookings = [1, 2, 3, 4]
    .flatMap((each) => stayBookings(each))
    .map((booking) => ({ ...booking, ...moved[booking.id] }))
    .filter((booking) => booking.resourceId.startsWith(floor))
  const first = FORTNIGHT[0] ?? HOTEL.today
  const last = FORTNIGHT.at(-1) ?? HOTEL.today
  const arriving = STAYS.filter(
    (stay) => stay.arrival >= first && stay.arrival <= last && stay.arrival > HOTEL.today,
  ).length
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
          onMove={(move) => {
            setMoved((current) => ({
              ...current,
              [move.id]: { resourceId: move.resourceId, start: move.start, end: move.end },
            }))
            const stay = STAYS.find((each) => each.id === move.id)
            notice.success(
              `${stay?.guest ?? ''}: room ${move.resourceId}, ${format.date(move.start)} – ${format.date(addDays(move.end, 1))}. The guest gets an e-mail.`,
            )
          }}
          onSelect={(booking) => {
            navigate(`${L_ROUTES.rack}?room=${booking.resourceId}`)
          }}
        />
      </Frame>
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
  { path: L_ROUTES.housekeeping, render: (phone) => <Housekeeping phone={phone} /> },
  {
    path: L_ROUTES.housekeepingRoom,
    render: (phone) => <Housekeeping phone={phone} room="306" />,
  },
]
