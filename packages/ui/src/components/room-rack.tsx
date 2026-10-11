import { Circle, CircleCheck, CircleX, Info, Search, Star, TriangleAlert } from 'lucide-react'
import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Input } from '../primitives/input'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { CompactIconButton } from './button'
import { toneClasses } from './calendar-view'
import { EmptyState } from './empty-state'
import type { IconComponent } from './intents'
import {
  EMPTY_RACK_FILTER,
  rackCounts,
  rackFilterActive,
  rackKeyTarget,
  rackMatches,
  type RackFilter,
  type RackPlace,
} from './room-rack-logic'
import { StatusBadge, type Tone } from './status-badge'
import { usePhone } from './use-phone'

/*
 * RoomRack (BUILD-PLAN P5.25): the rooms of a place at a glance — the front desk's "room rack" of
 * a hotel, the beds of a ward, the cabins of a ship. Floors (or sections) one under another, each
 * room a tile; every fact comes from the application: the number, a short type, the occupancy
 * state and the housekeeping state (the application's states, each with its words, tone and
 * icon), the guest, arrival and departure (through `format`), notes such as "VIP".
 * - States are never colour alone: the occupancy state is a StatusBadge (icon and words on the
 *   tone), the housekeeping state its icon and words in the tone's colour.
 * - Filters: a search (number or name) and one chip per state with its count — the application's
 *   `count`, else the rooms given counted. One occupancy and one housekeeping state at a time;
 *   pressing the pressed chip clears it. Chips use the neutral selection (D17). The filtering is
 *   local; `filter` / `onFilterChange` make it controlled.
 * - Keyboard: one tile in the tab order (roving); the arrows move in reading order — the rack is
 *   a list of rooms, not a map of the building, so it follows the page's direction
 *   (`rackKeyTarget`) —; ArrowUp and ArrowDown a line, across floors; Home / End the floor's
 *   ends, with Ctrl the rack's; Enter or Space opens (`onRoomOpen`).
 * - The chosen room (`selectedId`, e.g. the one open in a Drawer): surface.selected with the
 *   border.selected bar, `aria-current`.
 * - `compact` for 200 rooms and more: 80px tiles with the number and both states as icons on the
 *   occupancy tone; the words stay for assistive technology and in the tile's title, and the
 *   chips are the legend.
 * - Phones (below 48em or `layout="phone"`): a list grouped by floor with the same facts.
 * - `loading`: skeleton tiles. No rooms: EmptyState; nothing matches: "no results" with Clear.
 *   `readOnly` (or no `onRoomOpen`): tiles are text.
 */

/** A state of a room, from the application: its words, a status tone and an icon. */
export interface RackState {
  id: string
  /** The state in words ("Occupied", "Dirty"). */
  label: string
  /** A status tone (Appendix A.2); default neutral. */
  tone?: Tone
  /** An icon beside the words; default by the tone. */
  icon?: IconComponent
  /** The count on its chip, written by the application ("12"); default the rooms given counted. */
  count?: string
}

/** A short note on a room ("VIP", "Late check-out 14:00"), from the application. */
export interface RackNote {
  label: string
  /** Default neutral. */
  tone?: Tone
}

/** A room, from the application. */
export interface RackRoom {
  id: string
  /** Its number or name ("204"). */
  number: string
  /** A short type ("DBL", "Suite"). */
  type?: string
  /** The id of its occupancy state. */
  occupancy: string
  /** The id of its housekeeping state. */
  housekeeping?: string
  /** Who is in it, or arrives. */
  guest?: string
  /** YYYY-MM-DD. */
  arrival?: string
  departure?: string
  notes?: readonly RackNote[]
}

/** A floor (or a section) of the rack, from the application. */
export interface RackFloor {
  id: string
  /** "Floor 2", "East wing". */
  label: string
  /** A line beside the name ("10 rooms · 3 to clean"), written by the application. */
  description?: string
  rooms: readonly RackRoom[]
}

export interface RoomRackProps {
  floors: readonly RackFloor[]
  /** The occupancy states, in the order of their chips. */
  occupancyStates: readonly RackState[]
  /** The housekeeping states; without them, no housekeeping chips or line. */
  housekeepingStates?: readonly RackState[]
  /** Names the rack for assistive technology, from the application ("Rooms, 6 October"). */
  label: string
  /** A room was opened (pressed, Enter or Space). Without it the tiles are text. */
  onRoomOpen?: (room: RackRoom) => void
  /** The room shown as chosen (the one open beside the rack). */
  selectedId?: string
  /** The filter (controlled). */
  filter?: RackFilter
  /** The first filter (uncontrolled). */
  defaultFilter?: Partial<RackFilter>
  onFilterChange?: (filter: RackFilter) => void
  /** No search and chips (a rack already narrowed by the application). Default true. */
  filters?: boolean
  /** 80px tiles with the states as icons, for 200 rooms and more. */
  compact?: boolean
  /** Tiles are text: nothing opens. */
  readOnly?: boolean
  /** Skeleton tiles while the rooms load. */
  loading?: boolean
  /** The search field's name and placeholder; default `messages['rack.search']`. */
  searchLabel?: string
  /** The chip groups' names; default `messages['rack.occupancy']`, `['rack.housekeeping']`. */
  occupancyLabel?: string
  housekeepingLabel?: string
  /** The empty state when there are no rooms; default from messages. */
  emptyTitle?: string
  emptyDescription?: string
  /** The floors' heading level in the page's outline. Default 2. */
  headingLevel?: 2 | 3 | 4
  /** 'phone' shows a list grouped by floor; default by the viewport (below 48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

const TONE_ICON: Record<Tone, IconComponent> = {
  success: CircleCheck,
  warning: TriangleAlert,
  danger: CircleX,
  info: Info,
  neutral: Circle,
  premium: Star,
}

/** Every class written out, so Tailwind finds them. */
const TILE_TONE: Record<Tone, string> = {
  success: 'bg-status-success-bg text-status-success-fg border-status-success-border',
  warning: 'bg-status-warning-bg text-status-warning-fg border-status-warning-border',
  danger: 'bg-status-danger-bg text-status-danger-fg border-status-danger-border',
  info: 'bg-status-info-bg text-status-info-fg border-status-info-border',
  neutral: 'bg-status-neutral-bg text-status-neutral-fg border-status-neutral-border',
  premium: 'bg-status-premium-bg text-status-premium-fg border-status-premium-border',
}

/** The neutral selection: surface.selected with a 3px border.selected bar at the start (D17). */
const SELECTED =
  "bg-surface-selected before:absolute before:inset-y-0 before:start-0 before:border-0 before:border-s-[3px] before:border-solid before:border-selected before:content-['']"

const CHIP =
  'inline-flex min-h-8 cursor-pointer items-center gap-1.5 rounded-sm border border-solid px-2.5 text-sm whitespace-nowrap transition-colors'

function iconOf(state: RackState | undefined): IconComponent {
  return state?.icon ?? TONE_ICON[state?.tone ?? 'neutral']
}

/** The rooms of a place by floor: number, type, occupancy, housekeeping, guest and stay. */
export function RoomRack(props: RoomRackProps) {
  const { messages, format, direction } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const compact = props.compact === true && !phone
  const instructionsId = useId()
  const rack = useRef<HTMLDivElement>(null)
  const [innerFilter, setInnerFilter] = useState<RackFilter>({
    ...EMPTY_RACK_FILTER,
    ...props.defaultFilter,
  })
  const filter = props.filter ?? innerFilter
  const [active, setActive] = useState<string | null>(null)
  const focusNext = useRef<string | null>(null)
  const openable = props.readOnly !== true && props.onRoomOpen !== undefined
  const housekeepingStates = props.housekeepingStates ?? []
  const Heading = `h${String(props.headingLevel ?? 2)}` as 'h2'

  const setFilter = (next: RackFilter) => {
    setInnerFilter(next)
    props.onFilterChange?.(next)
  }

  const allRooms = props.floors.flatMap((floor) => floor.rooms)
  const shownFloors = props.floors
    .map((floor) => ({ floor, rooms: floor.rooms.filter((room) => rackMatches(room, filter)) }))
    .filter((each) => each.rooms.length > 0)
  const shownRooms = shownFloors.flatMap((each) => each.rooms)
  const filtered = rackFilterActive(filter)

  // The tile in the tab order: the focused one, else the chosen one, else the first shown.
  const current =
    shownRooms.find((room) => room.id === active)?.id ??
    shownRooms.find((room) => room.id === props.selectedId)?.id ??
    shownRooms[0]?.id

  useLayoutEffect(() => {
    const id = focusNext.current
    if (id === null) return
    focusNext.current = null
    rack.current?.querySelector<HTMLElement>(`[data-rack-room="${CSS.escape(id)}"]`)?.focus()
  })

  const occupancyOf = (room: RackRoom) =>
    props.occupancyStates.find((state) => state.id === room.occupancy)
  const housekeepingOf = (room: RackRoom) =>
    room.housekeeping === undefined
      ? undefined
      : housekeepingStates.find((state) => state.id === room.housekeeping)

  const stayText = (room: RackRoom): string | null => {
    if (room.arrival === undefined && room.departure === undefined) return null
    const arrival = room.arrival === undefined ? '—' : format.date(room.arrival)
    const departure = room.departure === undefined ? '—' : format.date(room.departure)
    return messages['calendar.range'](arrival, departure)
  }

  /** Everything a tile says, in words: the compact tile's title and its name for assistive technology. */
  const summary = (room: RackRoom): string =>
    [
      room.number,
      room.type,
      occupancyOf(room)?.label ?? room.occupancy,
      housekeepingOf(room)?.label,
      room.guest,
      stayText(room) ?? undefined,
      ...(room.notes ?? []).map((note) => note.label),
    ]
      .filter((part): part is string => part !== undefined && part !== '')
      .join(', ')

  const onTileKey = (event: KeyboardEvent<HTMLElement>, room: RackRoom) => {
    if (event.key === 'Enter' || event.key === ' ') return
    const floor = shownFloors.findIndex((each) => each.rooms.some((one) => one.id === room.id))
    const index = shownFloors[floor]?.rooms.findIndex((one) => one.id === room.id) ?? -1
    if (floor === -1 || index === -1) return
    const list = rack.current?.querySelector<HTMLElement>('[data-rack-list]')
    const columns =
      phone || list === null || list === undefined
        ? 1
        : getComputedStyle(list).gridTemplateColumns.split(' ').filter(Boolean).length
    const target: RackPlace | null = rackKeyTarget(
      event.key,
      { floor, index },
      shownFloors.map((each) => each.rooms.length),
      columns,
      direction,
      event.ctrlKey || event.metaKey,
    )
    if (target === null) return
    const id = shownFloors[target.floor]?.rooms[target.index]?.id
    if (id === undefined) return
    event.preventDefault()
    setActive(id)
    focusNext.current = id
  }

  const notesOf = (room: RackRoom, small: boolean) =>
    room.notes !== undefined && room.notes.length > 0 ? (
      <span className="flex flex-wrap gap-1">
        {room.notes.map((note, index) =>
          small ? (
            <span key={index} className="sr-only">
              {note.label}
            </span>
          ) : (
            <StatusBadge key={index} label={note.label} tone={note.tone ?? 'neutral'} withBorder />
          ),
        )}
      </span>
    ) : null

  const housekeepingLine = (room: RackRoom) => {
    const state = housekeepingOf(room)
    if (state === undefined) return null
    const Icon = iconOf(state)
    return (
      <span
        className={cn('flex items-center gap-1 text-xs font-medium', toneClasses(state.tone).fg)}
      >
        <Icon aria-hidden="true" className="size-3.5 shrink-0" />
        <span className={TEXT_DIRECTION}>{state.label}</span>
      </span>
    )
  }

  const occupancyBadge = (room: RackRoom) => {
    const state = occupancyOf(room)
    return (
      <StatusBadge
        label={state?.label ?? room.occupancy}
        tone={state?.tone ?? 'neutral'}
        icon={iconOf(state)}
      />
    )
  }

  /** The facts of a room under its number: badge, housekeeping, guest, stay, notes. */
  const facts = (room: RackRoom) => {
    const stay = stayText(room)
    return (
      <>
        {phone ? (
          <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
            {occupancyBadge(room)}
            {housekeepingLine(room)}
          </span>
        ) : (
          <>
            <span className="flex">{occupancyBadge(room)}</span>
            {housekeepingLine(room)}
          </>
        )}
        {room.guest !== undefined && (
          <span className={cn('text-sm text-primary break-words', TEXT_DIRECTION)}>
            {room.guest}
          </span>
        )}
        {stay !== null && (
          <span className={cn('text-xs text-secondary tabular-nums', TEXT_DIRECTION)}>{stay}</span>
        )}
        {notesOf(room, false)}
      </>
    )
  }

  const tileBody = (room: RackRoom): ReactNode => {
    if (compact) {
      const occupancy = occupancyOf(room)
      const housekeeping = housekeepingOf(room)
      const OccupancyIcon = iconOf(occupancy)
      const HousekeepingIcon = housekeeping === undefined ? null : iconOf(housekeeping)
      return (
        <>
          <span className="sr-only">{summary(room)}</span>
          <span
            aria-hidden="true"
            className={cn(
              'box-border flex w-full items-center justify-between gap-1 px-2 pt-1.5 pb-1',
              TILE_TONE[occupancy?.tone ?? 'neutral'],
            )}
          >
            <span className={cn('truncate text-sm font-semibold tabular-nums', TEXT_ISOLATE)}>
              {room.number}
            </span>
            <OccupancyIcon className="size-3.5 shrink-0" />
          </span>
          <span
            aria-hidden="true"
            className="box-border flex min-h-6 w-full items-center justify-between gap-1 px-2"
          >
            {HousekeepingIcon !== null && housekeeping !== undefined ? (
              <HousekeepingIcon
                className={cn('size-3.5 shrink-0', toneClasses(housekeeping.tone).fg)}
              />
            ) : (
              <span />
            )}
            {room.notes !== undefined && room.notes.length > 0 && (
              <Star className="size-3 shrink-0 text-secondary" />
            )}
          </span>
        </>
      )
    }
    if (phone) {
      return (
        <>
          <span className="flex w-14 shrink-0 flex-col gap-0.5">
            <span className={cn('text-md font-semibold text-primary tabular-nums', TEXT_ISOLATE)}>
              {room.number}
            </span>
            {room.type !== undefined && (
              <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{room.type}</span>
            )}
          </span>
          <span className="flex min-w-0 flex-1 flex-col items-start gap-1">{facts(room)}</span>
        </>
      )
    }
    return (
      <>
        <span className="flex w-full items-baseline gap-2">
          <span className={cn('text-md font-semibold text-primary tabular-nums', TEXT_ISOLATE)}>
            {room.number}
          </span>
          {room.type !== undefined && (
            <span className={cn('min-w-0 truncate text-xs text-secondary', TEXT_ISOLATE)}>
              {room.type}
            </span>
          )}
        </span>
        {facts(room)}
      </>
    )
  }

  const tile = (room: RackRoom) => {
    const selected = room.id === props.selectedId
    const look = cn(
      'relative box-border flex w-full min-w-0 overflow-hidden text-start',
      compact
        ? 'min-h-14 flex-col items-stretch rounded-md border border-solid'
        : phone
          ? 'flex-row items-start gap-3 px-3 py-2.5'
          : 'min-h-28 flex-col items-start gap-1.5 rounded-md border border-solid p-3',
      compact || !phone ? (selected ? 'border-selected' : 'border-default') : '',
      selected ? SELECTED : 'bg-surface-raised',
    )
    const title = compact ? summary(room) : undefined
    if (!openable) {
      return (
        <div className={look} title={title} {...(selected ? { 'aria-current': true } : {})}>
          {tileBody(room)}
        </div>
      )
    }
    return (
      <button
        type="button"
        data-rack-room={room.id}
        tabIndex={room.id === current ? 0 : -1}
        // Its facts in words, in order and with pauses ("204, DBL, Occupied, Clean, …").
        aria-label={summary(room)}
        title={title}
        {...(selected ? { 'aria-current': true } : {})}
        {...(room.id === current ? { 'aria-describedby': instructionsId } : {})}
        onKeyDown={(event) => {
          onTileKey(event, room)
        }}
        onFocus={() => {
          setActive(room.id)
        }}
        onClick={() => {
          setActive(room.id)
          props.onRoomOpen?.(room)
        }}
        className={cn(
          BUTTON_RESET,
          FOCUS_RING,
          look,
          'cursor-pointer',
          !selected && 'hover:bg-surface-hover',
        )}
      >
        {tileBody(room)}
      </button>
    )
  }

  const chip = (state: RackState, kind: 'occupancy' | 'housekeeping', counted: number) => {
    const pressed = filter[kind] === state.id
    const Icon = iconOf(state)
    return (
      <button
        key={state.id}
        type="button"
        aria-pressed={pressed}
        onClick={() => {
          setFilter({ ...filter, [kind]: pressed ? null : state.id })
        }}
        className={cn(
          BUTTON_RESET,
          FOCUS_RING,
          CHIP,
          pressed
            ? 'border-selected bg-surface-selected text-primary'
            : 'border-default bg-surface-raised text-primary hover:bg-surface-hover',
        )}
      >
        <Icon aria-hidden="true" className={cn('size-3.5 shrink-0', toneClasses(state.tone).fg)} />
        <span className={TEXT_ISOLATE}>{state.label}</span>
        <span className={cn('font-semibold text-secondary tabular-nums', TEXT_ISOLATE)}>
          {state.count ?? format.number(String(counted))}
        </span>
      </button>
    )
  }

  const toolbar = () => {
    const occupancyCounts = rackCounts(allRooms, 'occupancy')
    const housekeepingCounts = rackCounts(allRooms, 'housekeeping')
    const searchLabel = props.searchLabel ?? messages['rack.search']
    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className={cn('relative', phone ? 'w-full' : 'w-65')}>
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 start-0 flex w-9 items-center justify-center text-secondary"
            >
              <Search className="size-3.75" />
            </span>
            <Input
              aria-label={searchLabel}
              placeholder={searchLabel}
              autoComplete="off"
              value={filter.query}
              onChange={(event) => {
                setFilter({ ...filter, query: event.target.value })
              }}
              className={cn('ps-9', filter.query !== '' && 'pe-9')}
            />
            {filter.query !== '' && (
              <span className="absolute inset-y-0 end-1 flex items-center">
                <CompactIconButton
                  intent="cancel"
                  label={messages['filter.clearSearch']}
                  onClick={() => {
                    setFilter({ ...filter, query: '' })
                  }}
                />
              </span>
            )}
          </div>
          <p
            role="status"
            className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION, !filtered && 'sr-only')}
          >
            {filtered
              ? messages['rack.shown'](
                  shownRooms.length,
                  allRooms.length,
                  format.number(String(shownRooms.length)),
                  format.number(String(allRooms.length)),
                )
              : ''}
          </p>
        </div>
        <div
          role="group"
          aria-label={props.occupancyLabel ?? messages['rack.occupancy']}
          className="flex flex-wrap gap-2"
        >
          {props.occupancyStates.map((state) =>
            chip(state, 'occupancy', occupancyCounts.get(state.id) ?? 0),
          )}
        </div>
        {housekeepingStates.length > 0 && (
          <div
            role="group"
            aria-label={props.housekeepingLabel ?? messages['rack.housekeeping']}
            className="flex flex-wrap gap-2"
          >
            {housekeepingStates.map((state) =>
              chip(state, 'housekeeping', housekeepingCounts.get(state.id) ?? 0),
            )}
          </div>
        )}
      </div>
    )
  }

  const body = () => {
    if (props.loading === true) {
      return (
        <div aria-busy="true" className="flex flex-col gap-6">
          {[0, 1].map((floor) => (
            <div key={floor} className="flex flex-col gap-3">
              <Skeleton className="h-5 w-32" />
              <div
                className={cn(
                  'grid gap-2',
                  phone
                    ? 'grid-cols-1'
                    : compact
                      ? 'grid-cols-[repeat(auto-fill,minmax(5rem,1fr))]'
                      : 'grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))]',
                )}
              >
                {Array.from({ length: phone ? 3 : 6 }, (_, index) => (
                  <Skeleton
                    key={index}
                    className={cn('rounded-md', compact ? 'h-14' : phone ? 'h-20' : 'h-28')}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )
    }
    if (allRooms.length === 0) {
      return (
        <EmptyState
          compact
          title={props.emptyTitle ?? messages['rack.empty']}
          description={props.emptyDescription ?? messages['rack.emptyDescription']}
        />
      )
    }
    if (shownRooms.length === 0) {
      return (
        <EmptyState
          compact
          variant="no-results"
          title={messages['rack.noMatches']}
          description={messages['rack.noMatchesDescription']}
          action={{
            label: messages['rack.clearFilters'],
            onClick: () => {
              setFilter(EMPTY_RACK_FILTER)
            },
          }}
        />
      )
    }
    return (
      <div className={cn('flex flex-col', phone ? 'gap-4' : 'gap-6')}>
        {shownFloors.map(({ floor, rooms }) => {
          const headingId = `${instructionsId}-${floor.id}`
          return (
            <section key={floor.id} aria-labelledby={headingId} className="flex flex-col gap-2.5">
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
                <Heading
                  id={headingId}
                  className={cn('m-0 text-md font-semibold text-primary', TEXT_DIRECTION)}
                >
                  {floor.label}
                </Heading>
                {floor.description !== undefined && (
                  <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                    {floor.description}
                  </span>
                )}
              </div>
              <ul
                data-rack-list=""
                className={cn(
                  'm-0 list-none p-0',
                  phone
                    ? 'flex flex-col overflow-hidden rounded-md border border-solid border-default bg-surface-raised'
                    : cn(
                        'grid gap-2',
                        compact
                          ? 'grid-cols-[repeat(auto-fill,minmax(5rem,1fr))]'
                          : 'grid-cols-[repeat(auto-fill,minmax(10.5rem,1fr))]',
                      ),
                )}
              >
                {rooms.map((room) => (
                  <li
                    key={room.id}
                    className={cn(
                      'flex min-w-0',
                      phone && 'border-0 border-t border-solid border-subtle first:border-t-0',
                    )}
                  >
                    {tile(room)}
                  </li>
                ))}
              </ul>
            </section>
          )
        })}
      </div>
    )
  }

  return (
    <section
      aria-label={props.label}
      data-slot="room-rack"
      data-density={compact ? 'compact' : 'default'}
      className={cn('flex min-w-0 flex-col gap-4 font-sans', props.className)}
    >
      <span id={instructionsId} className="sr-only">
        {messages['rack.instructions']}
      </span>
      {props.filters !== false && props.loading !== true && allRooms.length > 0 && toolbar()}
      <div ref={rack} className="min-w-0">
        {body()}
      </div>
    </section>
  )
}
