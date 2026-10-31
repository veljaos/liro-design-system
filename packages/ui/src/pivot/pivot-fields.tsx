import { GripVertical, Plus } from 'lucide-react'
import {
  useId,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent,
  type ReactNode,
} from 'react'
import { Button, CompactIconButton } from '../components/button'
import { DropdownMenu, type MenuEntry } from '../components/dropdown-menu'
import { MultiSelectField } from '../components/multi-select-field'
import { SelectField } from '../components/select-field'
import { DROP_LINE, DROP_ZONE_ACTIVE, LIFTED, useListDrag } from '../components/use-list-drag'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import type { LiroMessages } from '../provider/messages'
import {
  acceptsField,
  areaFieldIds,
  dropField,
  fieldAreas,
  moveField,
  PIVOT_AREAS,
  placeField,
  removeField,
  setAggregation,
  setFilterValues,
  unusedFields,
  type PivotArea,
  type PivotField,
  type PivotLayout,
  type PivotZone,
} from './pivot-logic'

/*
 * The pivot's field chooser: four clear zones — Rows,
 * Columns, Values, Filters — each a dashed box of field chips, then the fields not used yet.
 * - Dragging is the shortcut: a chip goes to another zone, to another place in its zone, or back
 *   among the unused fields, on the dragging rule (`useListDrag`: pointer events, a mouse after
 *   4px, a touch after a 250ms press; the chip lifts, the zone it would land in takes the neutral
 *   selection and a line marks the place; Escape puts it back). A zone that cannot take the field
 *   (a measure in Rows) is never offered.
 * - The menu is the way for the keyboard and for everyone else (WCAG 2.5.7): a used field's menu
 *   moves it up or down in its zone, to another zone it may stand in, or out; an unused field is
 *   added by its one button when it fits only one zone, else from its menu.
 * - A value chooses its aggregation from the application's list; a filter its kept values (none
 *   chosen: every value). Every change is reported at once through `onChange` and announced
 *   politely ("Region in Columns, position 2 of 2"); the application computes.
 */

/** An area's name from the provider's messages. */
export function areaName(messages: LiroMessages, area: PivotArea): string {
  switch (area) {
    case 'filters':
      return messages['pivot.areaFilters']
    case 'columns':
      return messages['pivot.areaColumns']
    case 'rows':
      return messages['pivot.areaRows']
    case 'values':
      return messages['pivot.areaValues']
  }
}

export interface PivotFieldsProps {
  fields: readonly PivotField[]
  layout: PivotLayout
  onChange: (layout: PivotLayout) => void
}

/** A chip: raised, border.default, radius md; the whole chip drags (not its controls). */
const CHIP =
  'box-border flex min-w-0 cursor-grab touch-manipulation flex-col gap-2 rounded-md border border-solid bg-surface-raised px-2 py-1.5 select-none'

/** Whether a press on the chip starts a drag: not on its buttons, fields or menus. */
function dragsFrom(event: PointerEvent<HTMLElement>): boolean {
  return !(
    event.target instanceof Element &&
    event.target.closest('button, input, textarea, select, a, [role="combobox"]') !== null
  )
}

/** What a chip needs from the chooser: its drag attributes and how a change is applied. */
interface ChipContext {
  props: PivotFieldsProps
  apply: (next: PivotLayout, field: PivotField, zone: PivotZone) => void
  chip: (id: string) => {
    'data-drop-item': string
    onPointerDown: (event: PointerEvent<HTMLElement>) => void
    style: CSSProperties | undefined
  }
  dragged: string | undefined
}

/** A zone's look while a chip is dragged: the neutral selection, and the landing line. */
interface ZoneLook {
  zone: PivotZone
  active: boolean
  line: ReactNode
}

/** The chooser: the four zones, then the fields not used. */
export function PivotFields(props: PivotFieldsProps) {
  const { messages, format } = useLiro()
  const container = useRef<HTMLDivElement>(null)
  const [announcement, setAnnouncement] = useState('')
  const fieldOf = (id: string) => props.fields.find((field) => field.id === id)

  /** Applies a change and says where the field now stands. */
  const apply = (next: PivotLayout, field: PivotField, zone: PivotZone) => {
    props.onChange(next)
    if (zone === 'available') {
      setAnnouncement(messages['pivot.removedField'](field.label))
      return
    }
    const ids = areaFieldIds(next, zone)
    setAnnouncement(
      messages['pivot.moved'](
        field.label,
        areaName(messages, zone),
        format.number(String(ids.indexOf(field.id) + 1)),
        format.number(String(ids.length)),
      ),
    )
  }

  const { drag, startDrag } = useListDrag({
    container,
    accepts: (itemId, zone) => {
      const field = fieldOf(itemId)
      return field !== undefined && acceptsField(field, zone as PivotZone)
    },
    onDrop: (itemId, from, to) => {
      const field = fieldOf(itemId)
      if (field === undefined || (from.zone === 'available' && to.zone === 'available')) return
      const zone = to.zone as PivotZone
      apply(dropField(props.layout, field, zone, to.index), field, zone)
    },
  })

  const context: ChipContext = {
    props,
    apply,
    dragged: drag?.itemId,
    chip: (id) => ({
      'data-drop-item': id,
      onPointerDown: (event) => {
        if (dragsFrom(event)) startDrag(event, id)
      },
      style:
        drag?.itemId === id
          ? { transform: `translate(${String(drag.dx)}px, ${String(drag.dy)}px)` }
          : undefined,
    }),
  }

  const look = (zone: PivotZone): ZoneLook => ({
    zone,
    active: drag !== null && drag.target.zone === zone && drag.from.zone !== zone,
    line:
      drag !== null && drag.target.zone === zone ? (
        <li aria-hidden="true" className={DROP_LINE} style={{ top: drag.line }} />
      ) : null,
  })

  return (
    <div ref={container} data-slot="pivot-fields" className="relative flex flex-col gap-4">
      <div role="status" className="sr-only">
        {announcement}
      </div>
      {PIVOT_AREAS.map((area) => (
        <Zone key={area} area={area} context={context} look={look(area)} />
      ))}
      <Available context={context} look={look('available')} />
    </div>
  )
}

/** One zone: its name (h3) and its chips in order, in a dashed box. */
function Zone({ area, context, look }: { area: PivotArea; context: ChipContext; look: ZoneLook }) {
  const { messages } = useLiro()
  const titleId = useId()
  const ids = areaFieldIds(context.props.layout, area)
  const used = ids.flatMap((id) => context.props.fields.filter((field) => field.id === id))
  return (
    <section aria-labelledby={titleId} data-area={area} className="flex flex-col gap-1.5">
      <h3 id={titleId} className={cn('m-0 text-xs font-semibold text-secondary', TEXT_DIRECTION)}>
        {areaName(messages, area)}
      </h3>
      <ul
        data-drop-zone={look.zone}
        aria-labelledby={titleId}
        className={cn(
          'relative m-0 box-border flex min-h-12 list-none flex-col gap-2 rounded-md border border-dashed border-strong p-2',
          look.active ? DROP_ZONE_ACTIVE : 'bg-surface-sunken',
        )}
      >
        {look.line}
        {used.length === 0 ? (
          <li className={cn('px-1 py-1.5 text-sm text-secondary', TEXT_DIRECTION)}>
            {messages['pivot.areaEmpty']}
          </li>
        ) : (
          used.map((field, index) => (
            <UsedField
              key={field.id}
              field={field}
              area={area}
              index={index}
              count={used.length}
              context={context}
            />
          ))
        )}
      </ul>
    </section>
  )
}

/** One used field: its name, its control (aggregation or kept values) and its menu. */
function UsedField({
  field,
  area,
  index,
  count,
  context,
}: {
  field: PivotField
  area: PivotArea
  index: number
  count: number
  context: ChipContext
}) {
  const { messages } = useLiro()
  const { layout, onChange } = context.props
  const { apply } = context
  const entries: MenuEntry[] = [
    {
      label: messages['pivot.moveUp'],
      disabled: index === 0,
      onSelect: () => {
        apply(moveField(layout, field.id, -1), field, area)
      },
    },
    {
      label: messages['pivot.moveDown'],
      disabled: index === count - 1,
      onSelect: () => {
        apply(moveField(layout, field.id, 1), field, area)
      },
    },
  ]
  const others = fieldAreas(field).filter((each) => each !== area)
  if (others.length > 0) {
    entries.push({ type: 'separator' })
    for (const other of PIVOT_AREAS.filter((each) => others.includes(each))) {
      entries.push({
        label: messages['pivot.moveTo'](areaName(messages, other)),
        onSelect: () => {
          apply(placeField(layout, field, other), field, other)
        },
      })
    }
  }
  entries.push(
    { type: 'separator' },
    {
      label: messages['pivot.remove'],
      onSelect: () => {
        apply(removeField(layout, field.id), field, 'available')
      },
    },
  )
  const value = layout.values.find((each) => each.field === field.id)
  const filter = layout.filters.find((each) => each.field === field.id)
  return (
    <li
      data-field={field.id}
      {...context.chip(field.id)}
      className={cn(CHIP, context.dragged === field.id ? LIFTED : 'border-default')}
    >
      <span className="flex min-h-7 items-center gap-1.5">
        <GripVertical aria-hidden="true" className="size-4 shrink-0 text-tertiary" />
        <span className={cn('min-w-0 flex-1 text-sm font-medium text-primary', TEXT_DIRECTION)}>
          {field.label}
        </span>
        <DropdownMenu
          align="end"
          entries={entries}
          trigger={
            <CompactIconButton intent="more" label={messages['pivot.fieldMenu'](field.label)} />
          }
        />
      </span>
      {area === 'values' && value !== undefined && (field.aggregations?.length ?? 0) > 1 && (
        <SelectField
          label={messages['pivot.aggregationOf'](field.label)}
          hideLabel
          options={(field.aggregations ?? []).map((each) => ({
            value: each.id,
            label: each.label,
          }))}
          value={value.aggregation}
          onChange={(aggregation) => {
            if (aggregation !== '') onChange(setAggregation(layout, field.id, aggregation))
          }}
        />
      )}
      {area === 'values' && value !== undefined && field.aggregations?.length === 1 && (
        <span className={cn('ps-5.5 text-xs text-secondary', TEXT_DIRECTION)}>
          {field.aggregations[0]?.label}
        </span>
      )}
      {area === 'filters' && filter !== undefined && (
        <MultiSelectField
          label={messages['pivot.filterOf'](field.label)}
          hideLabel
          summary
          placeholder={messages['pivot.allValues']}
          options={(field.values ?? []).map((each) => ({ value: each.id, label: each.label }))}
          value={filter.values}
          onChange={(values) => {
            onChange(setFilterValues(layout, field.id, values))
          }}
        />
      )}
    </li>
  )
}

/** The fields not used: each a chip added by its one button, or a menu of the zones it may go to. */
function Available({ context, look }: { context: ChipContext; look: ZoneLook }) {
  const { messages } = useLiro()
  const titleId = useId()
  const { props, apply } = context
  const fields = unusedFields(props.fields, props.layout).filter(
    (field) => fieldAreas(field).length > 0,
  )
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-1.5">
      <h3 id={titleId} className={cn('m-0 text-xs font-semibold text-secondary', TEXT_DIRECTION)}>
        {messages['pivot.available']}
      </h3>
      <ul
        data-drop-zone={look.zone}
        aria-labelledby={titleId}
        className={cn(
          'relative m-0 box-border flex min-h-12 list-none flex-col gap-2 rounded-md p-0',
          look.active && cn(DROP_ZONE_ACTIVE, 'p-2'),
        )}
      >
        {look.line}
        {fields.length === 0 ? (
          <li className={cn('py-1.5 text-sm text-secondary', TEXT_DIRECTION)}>
            {messages['pivot.allUsed']}
          </li>
        ) : (
          fields.map((field) => {
            const areas = PIVOT_AREAS.filter((area) => fieldAreas(field).includes(area))
            const only = areas.length === 1 ? areas[0] : undefined
            return (
              <li
                key={field.id}
                data-field={field.id}
                {...context.chip(field.id)}
                className={cn(CHIP, context.dragged === field.id ? LIFTED : 'border-default')}
              >
                <span className="flex min-h-7 items-center gap-1.5">
                  <GripVertical aria-hidden="true" className="size-4 shrink-0 text-tertiary" />
                  <span className={cn('min-w-0 flex-1 text-sm text-primary', TEXT_DIRECTION)}>
                    {field.label}
                  </span>
                  {only === undefined ? (
                    <DropdownMenu
                      align="end"
                      entries={areas.map((area) => ({
                        label: messages['pivot.addToArea'](areaName(messages, area)),
                        onSelect: () => {
                          apply(placeField(props.layout, field, area), field, area)
                        },
                      }))}
                      trigger={
                        <CompactIconButton
                          icon={Plus}
                          label={messages['pivot.addField'](field.label)}
                        />
                      }
                    />
                  ) : (
                    <CompactIconButton
                      icon={Plus}
                      label={messages['pivot.addTo'](field.label, areaName(messages, only))}
                      onClick={() => {
                        apply(placeField(props.layout, field, only), field, only)
                      }}
                    />
                  )}
                </span>
              </li>
            )
          })
        )}
      </ul>
    </section>
  )
}

/** "Done" under the chooser in its sheet. */
export function PivotFieldsDone({ onClose }: { onClose: () => void }) {
  const { messages } = useLiro()
  return <Button intent="confirm" label={messages['pivot.done']} onClick={onClose} />
}
