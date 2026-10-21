import { Plus } from 'lucide-react'
import { useId } from 'react'
import { Button, CompactIconButton } from '../components/button'
import { DropdownMenu, type MenuEntry } from '../components/dropdown-menu'
import { MultiSelectField } from '../components/multi-select-field'
import { SelectField } from '../components/select-field'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import type { LiroMessages } from '../provider/messages'
import {
  areaFieldIds,
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
} from './pivot-logic'

/*
 * The pivot's field chooser (P5.77): Filters, Columns, Rows and Values as lists, then the fields
 * not used yet. Everything by buttons and menus, nothing by dragging (WCAG 2.5.7): a used field's
 * menu moves it up or down in its area, to another area it may stand in, or out; an unused field
 * is added to an area from its menu (or by its one button when it fits only one area). A value
 * chooses its aggregation from the application's list; a filter its kept values (none chosen:
 * every value). Each change is reported at once through `onChange`; the application computes.
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

/** One used field: its name, its control (aggregation or kept values) and its menu. */
function UsedField({
  field,
  area,
  index,
  count,
  props,
}: {
  field: PivotField
  area: PivotArea
  index: number
  count: number
  props: PivotFieldsProps
}) {
  const { messages } = useLiro()
  const { layout, onChange } = props
  const entries: MenuEntry[] = [
    {
      label: messages['pivot.moveUp'],
      disabled: index === 0,
      onSelect: () => {
        onChange(moveField(layout, field.id, -1))
      },
    },
    {
      label: messages['pivot.moveDown'],
      disabled: index === count - 1,
      onSelect: () => {
        onChange(moveField(layout, field.id, 1))
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
          onChange(placeField(layout, field, other))
        },
      })
    }
  }
  entries.push(
    { type: 'separator' },
    {
      label: messages['pivot.remove'],
      onSelect: () => {
        onChange(removeField(layout, field.id))
      },
    },
  )
  const value = layout.values.find((each) => each.field === field.id)
  const filter = layout.filters.find((each) => each.field === field.id)
  return (
    <li
      data-field={field.id}
      className="flex flex-col gap-2 rounded-md border border-solid border-default bg-surface-raised px-3 py-2"
    >
      <span className="flex min-h-7 items-center gap-2">
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
        <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
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

/** One area: its name (h3) and its fields in order. */
function Area({ area, props }: { area: PivotArea; props: PivotFieldsProps }) {
  const { messages } = useLiro()
  const titleId = useId()
  const ids = areaFieldIds(props.layout, area)
  const used = ids.flatMap((id) => props.fields.filter((field) => field.id === id))
  return (
    <section aria-labelledby={titleId} data-area={area} className="flex flex-col gap-2">
      <h3 id={titleId} className={cn('m-0 text-xs font-semibold text-secondary', TEXT_DIRECTION)}>
        {areaName(messages, area)}
      </h3>
      {used.length === 0 ? (
        <p
          className={cn(
            'm-0 rounded-md border border-dashed border-default px-3 py-2 text-sm text-tertiary',
            TEXT_DIRECTION,
          )}
        >
          {messages['pivot.areaEmpty']}
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {used.map((field, index) => (
            <UsedField
              key={field.id}
              field={field}
              area={area}
              index={index}
              count={used.length}
              props={props}
            />
          ))}
        </ul>
      )}
    </section>
  )
}

/** The fields not used: each added by its one button, or a menu of the areas it may go to. */
function Available({ props }: { props: PivotFieldsProps }) {
  const { messages } = useLiro()
  const titleId = useId()
  const fields = unusedFields(props.fields, props.layout).filter(
    (field) => fieldAreas(field).length > 0,
  )
  return (
    <section aria-labelledby={titleId} className="flex flex-col gap-2">
      <h3 id={titleId} className={cn('m-0 text-xs font-semibold text-secondary', TEXT_DIRECTION)}>
        {messages['pivot.available']}
      </h3>
      {fields.length === 0 ? (
        <p className={cn('m-0 text-sm text-tertiary', TEXT_DIRECTION)}>
          {messages['pivot.allUsed']}
        </p>
      ) : (
        <ul className="m-0 flex list-none flex-col gap-1 p-0">
          {fields.map((field) => {
            const areas = PIVOT_AREAS.filter((area) => fieldAreas(field).includes(area))
            const only = areas.length === 1 ? areas[0] : undefined
            return (
              <li key={field.id} data-field={field.id} className="flex min-h-8 items-center gap-2">
                <span className={cn('min-w-0 flex-1 text-sm text-primary', TEXT_DIRECTION)}>
                  {field.label}
                </span>
                {only === undefined ? (
                  <DropdownMenu
                    align="end"
                    entries={areas.map((area) => ({
                      label: messages['pivot.addToArea'](areaName(messages, area)),
                      onSelect: () => {
                        props.onChange(placeField(props.layout, field, area))
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
                      props.onChange(placeField(props.layout, field, only))
                    }}
                  />
                )}
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/** The chooser: the four areas, then the fields not used. */
export function PivotFields(props: PivotFieldsProps) {
  return (
    <div data-slot="pivot-fields" className="flex flex-col gap-4">
      {PIVOT_AREAS.map((area) => (
        <Area key={area} area={area} props={props} />
      ))}
      <Available props={props} />
    </div>
  )
}

/** "Done" under the chooser in its phone sheet. */
export function PivotFieldsDone({ onClose }: { onClose: () => void }) {
  const { messages } = useLiro()
  return <Button intent="confirm" label={messages['pivot.done']} onClick={onClose} />
}
