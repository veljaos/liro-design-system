import { RadioGroup as RadioGroupPrimitive } from 'radix-ui'
import { useState } from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { EmptyState, type EmptyAction } from './empty-state'
import { Field, fieldProps, type FieldBaseProps } from './field'
import { groupSlots, localOfAbsolute, slotKey, spanOf, type FreeSlot } from './schedule-logic'

/*
 * SlotPicker (BUILD-PLAN P5.8): the free slots the application offers for booking, grouped by day
 * (and, with `resources`, by resource within a day), one chosen with radio semantics. The
 * application finds the slots; the picker shows them and reports the choice.
 * - A Field (label, description, error, required, read-only, disabled with its reason) around one
 *   radio group. Each day under its date in words ("Today" marked); each slot a 36px chip with its
 *   start time (tabular); its accessible name says the time, the day and the resource. The arrow
 *   keys move between all slots, from the leading edge (Radix).
 * - The chosen slot is a checked radio: brand.solid with its text (D17: a checked radio is blue).
 * - Loading: skeleton chips (`slots.loading` names the busy group). Nothing free: an empty state
 *   (`slots.none`, `slots.noneDescription`) with an optional action ("Show next week").
 */

/** A row the slots belong to (a doctor, a room), for grouping. */
export interface SlotResource {
  id: string
  name: string
}

export interface SlotPickerProps extends FieldBaseProps {
  slots: readonly FreeSlot[]
  /** Groups the slots of each day by these, in this order, under their names. */
  resources?: readonly SlotResource[]
  /** The chosen slot's key (its `id`, else `resourceId@start`), controlled; null for none. */
  value?: string | null
  defaultValue?: string | null
  onChange?: (slot: FreeSlot) => void
  /** Skeleton chips while the slots load. */
  loading?: boolean
  /** The first step when nothing is free, e.g. "Show next week". */
  emptyAction?: EmptyAction
  /** The form field name; the chosen key is submitted. */
  name?: string
}

/** Free slots by day, one chosen. */
export function SlotPicker(props: SlotPickerProps) {
  const { format, messages, timeZone, today } = useLiro()
  const [inner, setInner] = useState<string | null>(props.defaultValue ?? null)
  const value = props.value === undefined ? inner : props.value
  const byResource = props.resources !== undefined
  const days = groupSlots(
    props.slots,
    timeZone,
    byResource,
    (props.resources ?? []).map((each) => each.id),
  )
  const resourceName = (id: string | null) =>
    id === null ? null : (props.resources?.find((each) => each.id === id)?.name ?? null)

  return (
    <Field {...fieldProps(props)} group>
      {(control) => {
        if (props.loading === true) {
          return (
            <div
              role="group"
              aria-busy="true"
              aria-label={messages['slots.loading']}
              className="flex flex-col gap-3"
            >
              {[0, 1].map((row) => (
                <div key={row} className="flex flex-col gap-2">
                  <Skeleton className="h-4 w-40" />
                  <div className="flex flex-wrap gap-2">
                    {[0, 1, 2, 3].map((chip) => (
                      <Skeleton key={chip} className="h-9 w-20" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )
        }
        if (days.length === 0) {
          return (
            <EmptyState
              compact
              className="rounded-md bg-surface-sunken px-4 py-6"
              title={messages['slots.none']}
              description={messages['slots.noneDescription']}
              {...(props.emptyAction === undefined ? {} : { action: props.emptyAction })}
            />
          )
        }
        return (
          <RadioGroupPrimitive.Root
            value={value ?? ''}
            onValueChange={(next) => {
              if (control.readOnly) return
              const slot = props.slots.find((each) => slotKey(each) === next)
              if (slot === undefined) return
              setInner(next)
              props.onChange?.(slot)
            }}
            {...(props.name === undefined ? {} : { name: props.name })}
            aria-labelledby={control.labelId}
            aria-describedby={control.describedBy}
            aria-invalid={control.invalid || undefined}
            aria-readonly={control.readOnly || undefined}
            aria-required={control.required || undefined}
            required={control.required}
            disabled={control.disabled}
            className="flex flex-col gap-4"
          >
            {days.map((day) => {
              const dayId = `${control.id}-${day.day}`
              const dateText = format.dateLong(day.day)
              return (
                <div
                  key={day.day}
                  role="group"
                  aria-labelledby={dayId}
                  className="flex flex-col gap-2"
                >
                  <p
                    id={dayId}
                    className={cn(
                      'm-0 flex flex-wrap items-baseline gap-2 text-sm font-semibold text-primary',
                      TEXT_DIRECTION,
                    )}
                  >
                    <span className="inline-block first-letter:uppercase">{dateText}</span>
                    {day.day === today && (
                      <span className="text-xs font-medium text-secondary">
                        {messages['calendar.todayMark']}
                      </span>
                    )}
                  </p>
                  {day.groups.map((group) => {
                    const name = resourceName(group.resourceId)
                    return (
                      <div key={group.resourceId ?? ''} className="flex flex-col gap-1.5">
                        {name !== null && (
                          <p className={cn('m-0 text-xs text-secondary', TEXT_DIRECTION)}>{name}</p>
                        )}
                        <div className="flex flex-wrap gap-2">
                          {group.slots.map((slot) => {
                            const span = spanOf(slot, timeZone)
                            if (span === null) return null
                            const start = format.time(localOfAbsolute(span.start))
                            const time =
                              span.end === span.start
                                ? start
                                : messages['calendar.range'](
                                    start,
                                    format.time(localOfAbsolute(span.end)),
                                  )
                            const key = slotKey(slot)
                            return (
                              <RadioGroupPrimitive.Item
                                key={key}
                                value={key}
                                aria-label={messages['slots.slotLabel'](time, dateText, name)}
                                className={cn(
                                  BUTTON_RESET,
                                  'inline-flex h-control min-w-20 items-center justify-center rounded-md border border-solid border-control bg-surface-raised px-3 text-sm text-primary tabular-nums transition-colors duration-(--liro-duration-fast) ease-standard',
                                  'data-[state=checked]:border-transparent data-[state=checked]:bg-brand-solid data-[state=checked]:font-semibold data-[state=checked]:text-brand-on-solid',
                                  'disabled:cursor-not-allowed disabled:border-default disabled:bg-surface-disabled disabled:text-disabled',
                                  control.readOnly
                                    ? 'cursor-default'
                                    : 'cursor-pointer enabled:data-[state=unchecked]:hover:bg-surface-hover',
                                  control.invalid &&
                                    'data-[state=unchecked]:border-status-danger-fg',
                                  FOCUS_RING,
                                )}
                              >
                                <span className={TEXT_ISOLATE}>{start}</span>
                              </RadioGroupPrimitive.Item>
                            )
                          })}
                        </div>
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </RadioGroupPrimitive.Root>
        )
      }}
    </Field>
  )
}
