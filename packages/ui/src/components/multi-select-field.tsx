import { X } from 'lucide-react'
import { useId, useRef, useState, type KeyboardEvent } from 'react'
import { BUTTON_RESET, FOCUS_RING, INPUT } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { ComboboxList, ComboboxPopover, optionId, type ComboboxOption } from './combobox-field'
import { filterChoices, MOVE_KEYS, moveActive, type MoveKey } from './combobox-logic'
import { Field, fieldProps, type FieldBaseProps } from './field'

/*
 * Several choices from a list, shown as pills inside the field (Mantine MultiSelect, PillsInput
 * and Pill.css, size 'sm'): the field grows with its pills, 5.5px vertical padding (multiline
 * input), 8px between pills (PillGroup 'sm'); a pill is 22px high, fully rounded, 12px text,
 * padding 0.8em, in the neutral tone (Mantine: gray-1); its remove button is the pill's height
 * and 2em wide. The typing area is at least 100px wide and 1.6em high. The list stays open while
 * choosing; Backspace in the empty typing area removes the last pill.
 */

export interface MultiSelectFieldProps extends FieldBaseProps {
  options: readonly ComboboxOption[]
  /** Controlled values, in the order chosen. */
  value?: readonly string[]
  /** Uncontrolled initial values. */
  defaultValue?: readonly string[]
  onChange?: (values: string[]) => void
  /** Shown while nothing is chosen. From the application. */
  placeholder?: string
  /** The form field name; one hidden input per value. */
  name?: string
}

/** Values with `value` added, or removed when it is already there. */
export function toggleValue(values: readonly string[], value: string): string[] {
  return values.includes(value) ? values.filter((item) => item !== value) : [...values, value]
}

/**
 * Several choices from a known list, found by typing. Chosen options appear as pills with a
 * remove button; read-only shows the pills without it.
 */
export function MultiSelectField(props: MultiSelectFieldProps) {
  const { messages, locale } = useLiro()
  const listId = `${useId()}-list`
  const inputRef = useRef<HTMLInputElement>(null)
  const [inner, setInner] = useState<readonly string[]>(props.defaultValue ?? [])
  const values = props.value ?? inner
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const shown = filterChoices(props.options, query, locale)
  const chosen = values.flatMap((value) => {
    const option = props.options.find((candidate) => candidate.value === value)
    return option === undefined ? [] : [option]
  })
  const showEmpty = shown.length === 0 && query !== ''
  const visible = open && (shown.length > 0 || showEmpty)
  const update = (next: string[]) => {
    setInner(next)
    props.onChange?.(next)
  }

  return (
    <Field {...fieldProps(props)}>
      {(control) => {
        const pills = (removable: boolean) =>
          chosen.map((option) => (
            <span
              key={option.value}
              data-slot="pill"
              className={cn(
                'inline-flex h-[22px] max-w-full items-center rounded-full bg-status-neutral-bg ps-[0.8em] text-xs leading-none text-status-neutral-fg',
                !removable && 'pe-[0.8em]',
              )}
            >
              <span className="truncate">{option.label}</span>
              {removable && (
                <button
                  type="button"
                  aria-label={messages['field.remove'](option.label)}
                  className={cn(
                    BUTTON_RESET,
                    'flex h-full min-w-[2em] cursor-pointer items-center justify-center rounded-e-full ps-[0.1em] pe-[0.3em] text-inherit',
                    FOCUS_RING,
                  )}
                  onClick={() => {
                    update(values.filter((value) => value !== option.value))
                    inputRef.current?.focus()
                  }}
                >
                  <X aria-hidden="true" className="size-3" />
                </button>
              )}
            </span>
          ))

        if (control.readOnly) {
          return (
            <div
              id={control.id}
              role="list"
              aria-labelledby={control.labelId}
              aria-describedby={control.describedBy}
              title={messages['field.readOnly']}
              className="flex min-h-control flex-wrap items-center gap-2 px-3 py-[5.5px] font-sans"
            >
              {chosen.map((option) => (
                <span key={option.value} role="listitem" className="flex">
                  {pills(false).find((pill) => pill.key === option.value)}
                </span>
              ))}
            </div>
          )
        }

        const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
          if ((MOVE_KEYS as readonly string[]).includes(event.key)) {
            if (!open && (event.key === 'Home' || event.key === 'End')) return
            event.preventDefault()
            setOpen(true)
            setActive(moveActive(event.key as MoveKey, active, shown))
          } else if (event.key === 'Enter' && visible && active >= 0) {
            event.preventDefault()
            const option = shown[active]
            if (option !== undefined && option.disabled !== true) {
              update(toggleValue(values, option.value))
            }
          } else if (event.key === 'Escape' && open) {
            event.preventDefault()
            setOpen(false)
          } else if (event.key === 'Backspace' && query === '' && values.length > 0) {
            update(values.slice(0, -1))
          }
        }

        return (
          <>
            <ComboboxPopover
              open={visible}
              onOpenChange={setOpen}
              onOptionHover={setActive}
              onOptionClick={(index) => {
                const option = shown[index]
                if (option !== undefined) update(toggleValue(values, option.value))
              }}
              anchor={
                <div
                  data-slot="multi-select"
                  className={cn(
                    INPUT,
                    'flex h-auto min-h-control cursor-text flex-wrap items-center gap-2 py-[5.5px] focus-within:border-focus',
                    control.invalid &&
                      'border-status-danger-fg focus-within:border-status-danger-fg',
                    control.disabled &&
                      'cursor-not-allowed border-default bg-surface-disabled text-disabled',
                  )}
                >
                  {pills(!control.disabled)}
                  <input
                    ref={inputRef}
                    id={control.id}
                    role="combobox"
                    aria-autocomplete="list"
                    aria-expanded={visible && shown.length > 0}
                    aria-controls={visible && shown.length > 0 ? listId : undefined}
                    aria-activedescendant={
                      visible && active >= 0 ? optionId(listId, active) : undefined
                    }
                    aria-describedby={control.describedBy}
                    aria-invalid={control.invalid || undefined}
                    aria-required={control.required || undefined}
                    disabled={control.disabled}
                    autoComplete="off"
                    value={query}
                    {...(props.placeholder !== undefined && values.length === 0
                      ? { placeholder: props.placeholder }
                      : {})}
                    className="m-0 h-[1.6em] min-w-25 flex-1 border-0 bg-transparent p-0 font-sans text-sm text-inherit outline-none placeholder:text-tertiary disabled:cursor-not-allowed"
                    onChange={(event) => {
                      setQuery(event.target.value)
                      setOpen(true)
                      setActive(-1)
                    }}
                    onKeyDown={onKeyDown}
                    onBlur={() => {
                      setOpen(false)
                      setQuery('')
                    }}
                  />
                </div>
              }
            >
              <ComboboxList
                listId={listId}
                labelId={control.labelId}
                options={shown}
                active={active}
                isChosen={(option) => values.includes(option.value)}
                multiple
                loading={false}
                showEmpty={showEmpty}
              />
            </ComboboxPopover>
            {props.name !== undefined &&
              values.map((value) => (
                <input key={value} type="hidden" name={props.name} value={value} />
              ))}
          </>
        )
      }}
    </Field>
  )
}
