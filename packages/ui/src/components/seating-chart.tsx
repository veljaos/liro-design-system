import { CircleDashed, MoreHorizontal, UserRound, UserRoundX } from 'lucide-react'
import { useId, useState, type PointerEvent } from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { Button, CompactIconButton } from './button'
import { Dialog } from './dialog'
import { DropdownMenu, type MenuEntry } from './dropdown-menu'
import { EmptyState } from './empty-state'
import { FloorPlan, type FloorArea, type FloorState, type FloorWarning } from './floor-plan'
import type { FloorItem } from './floor-plan-logic'
import { initialsOf } from './person'
import {
  freeSeats,
  guestAt,
  guestGroups,
  guestMatches,
  parseSeatId,
  sameSeat,
  seatCentres,
  seatId,
  seatingCounts,
  type SeatingConflict,
  type SeatingGuest,
  type SeatingTable,
  type SeatRef,
} from './seating-logic'
import { SelectField } from './select-field'
import { ConflictIcon } from './shift-parts'
import { StatusBadge } from './status-badge'
import { TextField } from './text-field'
import { usePhone } from './use-phone'

/*
 * SeatingChart: who sits where at
 * an event — a wedding, a gala dinner, a conference. Built on FloorPlan: the tables where the
 * application puts them, their seats drawn round them (round tables evenly, rectangular ones
 * along the long sides, `seatCentres`), each seat a target named "Table 3, seat 4, Ana
 * Petrović, Taken". Beside the plan the guest list: "112 of 140 seated", a search, the guests
 * not seated first, then each table's guests in seat order, groups and notes (diet) as data.
 *
 * Seating a guest, three ways (WCAG 2.5.7): choose a seat (a press, or Enter on the plan or in
 * its list) and then a guest from the list in its dialog — the keyboard's way; drag a guest from
 * the list onto a seat (pointer events: a mouse after 4px, a touch after a 250ms press; the seat
 * under the pointer is marked with a neutral dashed outline; Escape cancels); or "Seat at…" from
 * the guest's menu (a table, then a free seat). "Unseat" in the menu and in a taken seat's
 * dialog. Every change is reported as `onSeat(guestId, seat | null)`; the chart never decides:
 * the application seats the guest (or not) and passes the guests again. Others rely on a seating
 * plan: the application keeps the changes pending and saves them together through
 * ChangeConfirmDialog (`seatingChanges`: each guest's seat old → new; the guests' e-mail a choice).
 * The seat and "Seat at…" dialogs are titled by the action with the seat or the guest under it.
 * A table opens its guests in order. Conflicts are the application's: on the table (an icon, the
 * words in its name and the plan's warnings) and on the guests (an icon and the words in their
 * rows).
 */

export type { SeatingConflict, SeatingGuest, SeatingTable, SeatRef } from './seating-logic'

export interface SeatingChartProps {
  /** Names the plan ("Gala dinner, Hall A"). */
  label: string
  tables: readonly SeatingTable[]
  guests: readonly SeatingGuest[]
  /** The plan's size in plan units. */
  width: number
  height: number
  /** Fixtures and other items drawn on the plan (the stage, the doors, the dance floor). */
  fixtures?: readonly FloorItem[]
  areas?: readonly FloorArea[]
  conflicts?: readonly SeatingConflict[]
  /** A guest seated (or unseated: null). Without it the chart is read-only. */
  onSeat?: (guestId: string, seat: SeatRef | null) => void
  /** A seat's diameter in plan units. Default 30. */
  seatSize?: number
  /** The room between a table and its seats, in plan units. Default 6. */
  seatGap?: number
  /** The panel's title. Default `messages['seating.guests']`. */
  guestsTitle?: string
  /** A seat's dialog open when it appears (a picture). */
  defaultSeatDialog?: SeatRef
  /** "Seat at…" open for this guest when it appears (a picture). */
  defaultSeatAt?: string
  /** A table's guests open when it appears (a picture). */
  defaultTableDialog?: string
  /** The search when it appears (a picture, a restored screen). */
  defaultQuery?: string
  /** 'phone' puts the guest list first and the plan's list; default by the viewport. */
  layout?: 'desktop' | 'phone'
  loading?: boolean
  className?: string
}

/** A guest being dragged onto a seat. */
interface GuestDrag {
  guestId: string
  x: number
  y: number
  target: SeatRef | null
}

/** The event's plan, its seats and the guest list; reports every seating. */
export function SeatingChart(props: SeatingChartProps) {
  const { messages, format, locale } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const baseId = useId()
  const [query, setQuery] = useState(props.defaultQuery ?? '')
  const [seatDialog, setSeatDialog] = useState<SeatRef | null>(props.defaultSeatDialog ?? null)
  const [seatAtGuest, setSeatAtGuest] = useState<string | null>(props.defaultSeatAt ?? null)
  const [tableDialog, setTableDialog] = useState<string | null>(props.defaultTableDialog ?? null)
  const [drag, setDrag] = useState<GuestDrag | null>(null)
  const [announcement, setAnnouncement] = useState('')
  const editable = props.onSeat !== undefined
  const size = props.seatSize ?? 30
  const gap = props.seatGap ?? 6
  const conflicts = props.conflicts ?? []
  const tableOf = (id: string) => props.tables.find((table) => table.id === id)
  const number = (value: number) => format.number(String(value))
  const seatName = (ref: SeatRef) =>
    messages['seating.seatName'](tableOf(ref.tableId)?.label ?? '', number(ref.seat))
  const guestName = (id: string) => props.guests.find((guest) => guest.id === id)?.name ?? ''

  const seat = (guestId: string, ref: SeatRef | null) => {
    if (!editable) return
    props.onSeat?.(guestId, ref)
    setAnnouncement(
      ref === null
        ? messages['seating.unseated'](guestName(guestId))
        : messages['seating.seated'](guestName(guestId), seatName(ref)),
    )
  }

  if (props.loading === true) {
    return (
      <div
        role="region"
        aria-busy="true"
        aria-label={props.label}
        className={cn(
          'grid gap-4 font-sans',
          !phone && 'grid-cols-[minmax(0,1fr)_20rem]',
          props.className,
        )}
      >
        <Skeleton
          className="w-full rounded-lg"
          style={{ aspectRatio: `${String(props.width)} / ${String(props.height)}` }}
        />
        <div className="flex flex-col gap-2">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-9" />
          <Skeleton className="h-64" />
        </div>
      </div>
    )
  }

  // ── The plan's items: the fixtures, the tables and their seats ──
  const states: FloorState[] = [
    { id: 'free', label: messages['seating.free'], tone: 'success', icon: CircleDashed },
    { id: 'taken', label: messages['seating.taken'], tone: 'neutral', icon: UserRound },
  ]
  const items: FloorItem[] = [...(props.fixtures ?? [])]
  for (const table of props.tables) {
    const taken = props.guests.filter((guest) => guest.seat?.tableId === table.id).length
    items.push({
      id: table.id,
      kind: 'table',
      shape: table.shape,
      label: table.label,
      ...(table.shortLabel === undefined ? {} : { shortLabel: table.shortLabel }),
      x: table.x,
      y: table.y,
      width: table.width,
      height: table.height,
      ...(table.rotation === undefined ? {} : { rotation: table.rotation }),
      detail: messages['seating.tableCount'](number(taken), number(table.seats)),
      // "8 of 10" under the table's number on the plan too (dropped, never cut).
      planDetail: messages['seating.tableCount'](number(taken), number(table.seats)),
      ...(table.areaId === undefined ? {} : { areaId: table.areaId }),
      ...(table.note === undefined ? {} : { note: table.note }),
    })
    for (const centre of seatCentres(table, size, gap)) {
      const ref = { tableId: table.id, seat: centre.seat }
      const guest = guestAt(props.guests, ref)
      items.push({
        id: seatId(ref),
        kind: 'seat',
        label: seatName(ref),
        shortLabel: guest === undefined ? number(centre.seat) : initialsOf(guest.name, locale),
        x: centre.x - size / 2,
        y: centre.y - size / 2,
        width: size,
        height: size,
        stateId: guest === undefined ? 'free' : 'taken',
        ...(guest === undefined ? {} : { detail: guest.name }),
        ...(table.areaId === undefined ? {} : { areaId: table.areaId }),
      })
    }
  }
  const warnings: FloorWarning[] = conflicts.flatMap((conflict) =>
    conflict.tableId === undefined
      ? []
      : [{ itemId: conflict.tableId, text: conflict.text, tone: conflict.tone }],
  )

  const plan = (
    <FloorPlan
      label={props.label}
      items={items}
      width={props.width}
      height={props.height}
      {...(props.areas === undefined ? {} : { areas: props.areas })}
      states={states}
      selectionMode="none"
      warnings={warnings}
      {...(drag?.target == null ? {} : { dropTargetId: seatId(drag.target) })}
      onItemActivate={(item) => {
        const ref = parseSeatId(item.id)
        if (ref !== null && editable) setSeatDialog(ref)
        else setTableDialog(ref?.tableId ?? item.id)
      }}
      listed={(item) => item.kind === 'seat'}
      listGroup={(item) => {
        const table = tableOf(parseSeatId(item.id)?.tableId ?? '')
        return table === undefined ? null : { id: table.id, label: table.label }
      }}
      layout={phone ? 'phone' : 'desktop'}
    />
  )

  // ── Dragging a guest onto a seat ──
  const startDrag = (event: PointerEvent<HTMLElement>, guest: SeatingGuest) => {
    if (!editable || event.button !== 0) return
    if (event.target instanceof Element && event.target.closest('button, a, input') !== null) return
    const touch = event.pointerType === 'touch'
    const startX = event.clientX
    const startY = event.clientY
    let active = false
    let current: GuestDrag | null = null
    const seatUnder = (x: number, y: number): SeatRef | null => {
      const element = document.elementFromPoint(x, y)?.closest('[data-floor-item]')
      const id = element?.getAttribute('data-floor-item')
      return id == null ? null : parseSeatId(id)
    }
    const timer = touch
      ? window.setTimeout(() => {
          active = true
          current = { guestId: guest.id, x: startX, y: startY, target: null }
          setDrag(current)
        }, 250)
      : undefined
    const finish = (commit: boolean) => {
      window.clearTimeout(timer)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onCancel)
      window.removeEventListener('keydown', onKey, true)
      window.removeEventListener('touchmove', onTouchMove)
      const target = current?.target ?? null
      if (active && commit && target !== null && !sameSeat(guest.seat, target)) {
        seat(guest.id, target)
      }
      setDrag(null)
    }
    const onMove = (move: globalThis.PointerEvent) => {
      const distance = Math.hypot(move.clientX - startX, move.clientY - startY)
      if (!active) {
        if (touch) {
          if (distance > 8) finish(false)
          return
        }
        if (distance < 4) return
        active = true
      }
      current = {
        guestId: guest.id,
        x: move.clientX,
        y: move.clientY,
        target: seatUnder(move.clientX, move.clientY),
      }
      setDrag(current)
    }
    const onUp = () => {
      finish(true)
    }
    const onCancel = () => {
      finish(false)
    }
    const onKey = (key: globalThis.KeyboardEvent) => {
      if (key.key !== 'Escape' || !active) return
      key.preventDefault()
      key.stopPropagation()
      finish(false)
    }
    const onTouchMove = (touchMove: TouchEvent) => {
      if (active) touchMove.preventDefault()
    }
    window.addEventListener('pointermove', onMove)
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onCancel)
    window.addEventListener('keydown', onKey, true)
    window.addEventListener('touchmove', onTouchMove, { passive: false })
  }

  // ── The guest list ──
  const counts = seatingCounts(props.guests)
  const countText = messages['seating.count'](number(counts.seated), number(counts.total))
  const shownGuests = props.guests.filter((guest) => guestMatches(guest, query, locale))
  const groups = guestGroups(shownGuests, props.tables)
  const conflictsOf = (guestId: string) =>
    conflicts.filter((conflict) => conflict.guestIds?.includes(guestId) === true)
  const titleId = `${baseId}-guests`
  const guestPanel = (
    <section
      aria-labelledby={titleId}
      data-slot="seating-guests"
      className="flex min-w-0 flex-col gap-3 rounded-lg border border-solid border-default bg-surface-raised p-3"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 id={titleId} className={cn('m-0 text-h4 font-semibold text-primary', TEXT_DIRECTION)}>
          {props.guestsTitle ?? messages['seating.guests']}
        </h2>
        <span className={cn('text-sm text-secondary', TEXT_ISOLATE)}>{countText}</span>
      </div>
      <TextField
        type="search"
        label={messages['seating.search']}
        hideLabel
        placeholder={messages['seating.search']}
        value={query}
        onChange={setQuery}
      />
      <div
        data-slot="seating-guest-list"
        // Read-only, the rows hold no control: the list itself takes the focus to scroll.
        {...(editable || phone ? {} : { tabIndex: 0, role: 'group', 'aria-labelledby': titleId })}
        className={cn(
          FOCUS_RING,
          'flex flex-col gap-3',
          !phone && 'relative max-h-[min(70vh,44rem)] overflow-y-auto',
        )}
      >
        {groups.length === 0 ? (
          <EmptyState
            compact
            variant={query.trim() === '' ? 'empty' : 'no-results'}
            title={query.trim() === '' ? messages['seating.noGuests'] : messages['seating.noMatch']}
            description={
              query.trim() === ''
                ? messages['seating.noGuestsDescription']
                : messages['seating.noMatchDescription']
            }
          />
        ) : (
          groups.map((group) => {
            const table = group.table
            const heading =
              table === undefined
                ? messages['seating.notSeated']
                : `${table.label} · ${messages['seating.tableCount'](
                    number(props.guests.filter((guest) => guest.seat?.tableId === table.id).length),
                    number(table.seats),
                  )}`
            return (
              <section
                key={group.id}
                aria-labelledby={`${baseId}-group-${group.id}`}
                className="flex flex-col gap-1"
              >
                <h3
                  id={`${baseId}-group-${group.id}`}
                  className={cn('m-0 text-xs font-semibold text-secondary', TEXT_DIRECTION)}
                >
                  {heading}
                </h3>
                <ul className="m-0 flex list-none flex-col p-0">
                  {group.guests.map((guest) => (
                    <GuestRow
                      key={guest.id}
                      guest={guest}
                      seatText={
                        guest.seat == null || table === undefined
                          ? undefined
                          : number(guest.seat.seat)
                      }
                      conflicts={conflictsOf(guest.id)}
                      dragging={drag?.guestId === guest.id}
                      editable={editable}
                      onPointerDown={(event) => {
                        startDrag(event, guest)
                      }}
                      onSeatAt={() => {
                        setSeatAtGuest(guest.id)
                      }}
                      onUnseat={() => {
                        seat(guest.id, null)
                      }}
                    />
                  ))}
                </ul>
              </section>
            )
          })
        )}
      </div>
    </section>
  )

  const dragged =
    drag === null ? undefined : props.guests.find((guest) => guest.id === drag.guestId)
  const ghost = drag !== null && dragged !== undefined && (
    <div
      aria-hidden="true"
      data-slot="seating-drag"
      style={{ insetInlineStart: drag.x + 12, top: drag.y + 12 }}
      className={cn(
        'pointer-events-none fixed z-(--liro-layer-popover) rounded-md border border-solid border-strong bg-surface-raised px-2 py-1 text-sm font-semibold text-primary shadow-lg',
        TEXT_ISOLATE,
      )}
    >
      {dragged.name}
    </div>
  )

  const tableForDialog = tableDialog === null ? undefined : tableOf(tableDialog)
  return (
    <div
      data-slot="seating-chart"
      className={cn(
        'grid min-w-0 items-start gap-4 font-sans',
        !phone && 'grid-cols-[minmax(0,1fr)_20rem]',
        props.className,
      )}
    >
      {phone && guestPanel}
      {plan}
      {!phone && guestPanel}
      {ghost}
      {seatDialog !== null && editable && (
        <SeatDialog
          seatRef={seatDialog}
          seatName={seatName(seatDialog)}
          guests={props.guests}
          tables={props.tables}
          onClose={() => {
            setSeatDialog(null)
          }}
          onSeat={(guestId, ref) => {
            seat(guestId, ref)
            setSeatDialog(null)
          }}
        />
      )}
      {seatAtGuest !== null && editable && (
        <SeatAtDialog
          guest={props.guests.find((guest) => guest.id === seatAtGuest)}
          tables={props.tables}
          guests={props.guests}
          onClose={() => {
            setSeatAtGuest(null)
          }}
          onSeat={(guestId, ref) => {
            seat(guestId, ref)
            setSeatAtGuest(null)
          }}
        />
      )}
      {tableForDialog !== undefined && (
        <TableDialog
          table={tableForDialog}
          guests={props.guests}
          conflicts={conflicts.filter((conflict) => conflict.tableId === tableForDialog.id)}
          onClose={() => {
            setTableDialog(null)
          }}
        />
      )}
      <div role="status" data-slot="seating-announcer" className="sr-only">
        {announcement}
      </div>
    </div>
  )
}

/** A guest in the list: name, seat, group, notes and conflicts; the menu at the end. */
function GuestRow({
  guest,
  seatText,
  conflicts,
  dragging,
  editable,
  onPointerDown,
  onSeatAt,
  onUnseat,
}: {
  guest: SeatingGuest
  seatText: string | undefined
  conflicts: readonly SeatingConflict[]
  dragging: boolean
  editable: boolean
  onPointerDown: (event: PointerEvent<HTMLElement>) => void
  onSeatAt: () => void
  onUnseat: () => void
}) {
  const { messages } = useLiro()
  const menu: MenuEntry[] = [
    { label: messages['seating.seatAt'], icon: UserRound, onSelect: onSeatAt },
    ...(guest.seat == null
      ? []
      : [{ label: messages['seating.unseat'], icon: UserRoundX, onSelect: onUnseat }]),
  ]
  return (
    <li
      data-seating-guest={guest.id}
      data-dragging={dragging ? '' : undefined}
      onPointerDown={onPointerDown}
      className={cn(
        'flex items-start gap-2 rounded-md px-2 py-1.5',
        editable && 'cursor-grab touch-none hover:bg-surface-hover',
        dragging && 'bg-surface-sunken',
      )}
    >
      {seatText !== undefined && (
        <span
          className={cn('mt-px w-6 shrink-0 text-sm text-secondary tabular-nums', TEXT_ISOLATE)}
        >
          {seatText}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
          {guest.name}
        </span>
        {guest.group !== undefined && (
          <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{guest.group}</span>
        )}
        {(guest.notes ?? []).length > 0 && (
          <span className="flex flex-wrap gap-1">
            {(guest.notes ?? []).map((note) => (
              <StatusBadge key={note} label={note} tone="neutral" />
            ))}
          </span>
        )}
        {conflicts.map((conflict) => (
          <span key={conflict.id} className="flex items-start gap-1 text-xs text-primary">
            <ConflictIcon tone={conflict.tone} className="mt-px size-3.5" />
            <span className={TEXT_DIRECTION}>
              <span className="sr-only">
                {conflict.tone === 'danger'
                  ? messages['floorPlan.problem']('')
                  : messages['floorPlan.warning']('')}
              </span>
              {conflict.text}
            </span>
          </span>
        ))}
      </span>
      {editable && (
        <DropdownMenu
          align="end"
          entries={menu}
          trigger={
            <CompactIconButton
              icon={MoreHorizontal}
              label={messages['seating.guestActions'](guest.name)}
            />
          }
        />
      )}
    </li>
  )
}

/** A seat chosen: who sits there (Unseat), and the guests to seat on it, searchable. */
function SeatDialog({
  seatRef,
  seatName,
  guests,
  tables,
  onClose,
  onSeat,
}: {
  seatRef: SeatRef
  seatName: string
  guests: readonly SeatingGuest[]
  tables: readonly SeatingTable[]
  onClose: () => void
  onSeat: (guestId: string, seat: SeatRef | null) => void
}) {
  const { messages, format, locale } = useLiro()
  const [query, setQuery] = useState('')
  const current = guestAt(guests, seatRef)
  const candidates = guestGroups(
    guests.filter((guest) => guest.id !== current?.id && guestMatches(guest, query, locale)),
    tables,
  ).flatMap((group) => group.guests)
  const tableLabel = (id: string) => tables.find((table) => table.id === id)?.label ?? ''
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      // The action, then the seat on its own line.
      title={messages['seating.seatTitle']}
      subject={seatName}
      actions={<Button intent="cancel" label={messages['dialog.cancel']} onClick={onClose} />}
    >
      <div className="flex flex-col gap-3">
        {current !== undefined && (
          <div className="flex flex-wrap items-center gap-2 rounded-md border border-solid border-default bg-surface-sunken p-2">
            <span className={cn('min-w-0 flex-1 text-sm text-primary', TEXT_DIRECTION)}>
              {messages['seating.seatedHere']} <span className="font-semibold">{current.name}</span>
            </span>
            <Button
              family="destructive"
              icon={UserRoundX}
              label={messages['seating.unseat']}
              onClick={() => {
                onSeat(current.id, null)
              }}
            />
          </div>
        )}
        <TextField
          type="search"
          label={messages['seating.chooseGuest']}
          placeholder={messages['seating.search']}
          value={query}
          onChange={setQuery}
        />
        {candidates.length === 0 ? (
          <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
            {messages['seating.noMatch']}
          </p>
        ) : (
          <ul
            aria-label={messages['seating.chooseGuest']}
            className="relative m-0 flex max-h-80 list-none flex-col overflow-y-auto rounded-md border border-solid border-default p-0"
          >
            {candidates.map((guest) => (
              <li
                key={guest.id}
                className="border-0 border-b border-solid border-default last:border-b-0"
              >
                <button
                  type="button"
                  onClick={() => {
                    onSeat(guest.id, seatRef)
                  }}
                  className={cn(
                    BUTTON_RESET,
                    FOCUS_RING,
                    'focus-visible:-outline-offset-2',
                    'flex min-h-11 w-full cursor-pointer flex-col items-start gap-0.5 px-3 py-2 text-start hover:bg-surface-hover',
                  )}
                >
                  <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
                    {guest.name}
                  </span>
                  <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                    {[
                      guest.seat == null
                        ? messages['seating.notSeated']
                        : messages['seating.seatName'](
                            tableLabel(guest.seat.tableId),
                            format.number(String(guest.seat.seat)),
                          ),
                      guest.group,
                      ...(guest.notes ?? []),
                    ]
                      .filter((part) => part !== undefined)
                      .join(' · ')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Dialog>
  )
}

/** "Seat at…": a table (with its free seats), then a free seat. */
function SeatAtDialog({
  guest,
  tables,
  guests,
  onClose,
  onSeat,
}: {
  guest: SeatingGuest | undefined
  tables: readonly SeatingTable[]
  guests: readonly SeatingGuest[]
  onClose: () => void
  onSeat: (guestId: string, seat: SeatRef) => void
}) {
  const { messages, format } = useLiro()
  const others = guests.filter((each) => each.id !== guest?.id)
  const firstFree = tables.find((table) => freeSeats(table, others).length > 0)
  const [tableId, setTableId] = useState(guest?.seat?.tableId ?? firstFree?.id ?? '')
  const table = tables.find((each) => each.id === tableId)
  const free = table === undefined ? [] : freeSeats(table, others)
  const [seatValue, setSeatValue] = useState(
    guest?.seat?.tableId === tableId ? String(guest.seat.seat) : String(free[0] ?? ''),
  )
  if (guest === undefined) return null
  const number = (value: number) => format.number(String(value))
  const chosenSeat = free.includes(Number(seatValue)) ? Number(seatValue) : undefined
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={messages['seating.seatAtTitle']}
      subject={guest.name}
      actions={
        <>
          <Button intent="cancel" label={messages['dialog.cancel']} onClick={onClose} />
          <Button
            family="primary"
            emphasis="primary"
            icon={UserRound}
            label={messages['seating.seatButton']}
            disabled={chosenSeat === undefined}
            onClick={() => {
              if (chosenSeat !== undefined) onSeat(guest.id, { tableId, seat: chosenSeat })
            }}
          />
        </>
      }
    >
      <div className="flex flex-col gap-3">
        <SelectField
          label={messages['seating.table']}
          value={tableId}
          onChange={(value) => {
            setTableId(value)
            const next = tables.find((each) => each.id === value)
            setSeatValue(String((next === undefined ? [] : freeSeats(next, others))[0] ?? ''))
          }}
          options={tables.map((each) => {
            const count = freeSeats(each, others).length
            return {
              value: each.id,
              label: `${each.label} · ${messages['seating.freeSeats'](count, number(count))}`,
              disabled: count === 0,
            }
          })}
        />
        {/* A full table has no seat to choose: it says so instead of a dead field. */}
        {free.length === 0 ? (
          <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
            {messages['seating.tableFull']}
          </p>
        ) : (
          <SelectField
            label={messages['seating.seat']}
            value={seatValue}
            onChange={setSeatValue}
            options={free.map((each) => ({ value: String(each), label: number(each) }))}
          />
        )}
      </div>
    </Dialog>
  )
}

/** A table's guests in seat order, empty seats included, and its conflicts: a read-only view. */
function TableDialog({
  table,
  guests,
  conflicts,
  onClose,
}: {
  table: SeatingTable
  guests: readonly SeatingGuest[]
  conflicts: readonly SeatingConflict[]
  onClose: () => void
}) {
  const { messages, format } = useLiro()
  const taken = guests.filter((guest) => guest.seat?.tableId === table.id).length
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={table.label}
      description={messages['seating.tableCount'](
        format.number(String(taken)),
        format.number(String(table.seats)),
      )}
    >
      <div className="flex flex-col gap-3">
        {conflicts.map((conflict) => (
          <p key={conflict.id} className="m-0 flex items-start gap-2 text-sm text-primary">
            <ConflictIcon tone={conflict.tone} className="mt-0.5 size-4" />
            <span className={TEXT_DIRECTION}>
              <span className="sr-only">
                {conflict.tone === 'danger'
                  ? messages['floorPlan.problem']('')
                  : messages['floorPlan.warning']('')}
              </span>
              {conflict.text}
            </span>
          </p>
        ))}
        <ol className="m-0 flex list-none flex-col p-0">
          {Array.from({ length: table.seats }, (_, index) => {
            const guest = guestAt(guests, { tableId: table.id, seat: index + 1 })
            return (
              <li
                key={index}
                className="flex items-baseline gap-3 border-0 border-b border-solid border-default py-1.5 last:border-b-0"
              >
                <span
                  className={cn('w-6 shrink-0 text-sm text-secondary tabular-nums', TEXT_ISOLATE)}
                >
                  {format.number(String(index + 1))}
                </span>
                <span
                  className={cn(
                    'min-w-0 flex-1 text-sm',
                    guest === undefined ? 'text-tertiary' : 'text-primary',
                    TEXT_DIRECTION,
                  )}
                >
                  {guest?.name ?? messages['seating.emptySeat']}
                  {(guest?.notes ?? []).length > 0 && (
                    <span className="text-secondary"> · {(guest?.notes ?? []).join(', ')}</span>
                  )}
                </span>
              </li>
            )
          })}
        </ol>
      </div>
    </Dialog>
  )
}
