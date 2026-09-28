import { Check } from 'lucide-react'
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { READ_ONLY, FLOATING, FLOATING_MOTION, OPTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Input } from '../primitives/input'
import { Popover, PopoverAnchor, PopoverContent } from '../primitives/popover'
import { useLiro } from '../provider/liro-provider'
import {
  filterChoices,
  MOVE_KEYS,
  moveActive,
  useDebouncedCallback,
  type Choice,
  type MoveKey,
} from './combobox-logic'
import { controlAttributes, Field, fieldProps, type FieldBaseProps } from './field'

/*
 * The list part of ComboboxField and MultiSelectField: a listbox under the input, in the
 * floating surface (Mantine Combobox: 4px padding, options 6px 10px, 13px, the keyboard's option
 * filled with the brand colour, a check before chosen options, at most 220px high, 8px from the
 * input, as wide as it). The input keeps the focus; the active option is announced through
 * aria-activedescendant (WAI-ARIA combobox pattern). Loading and "nothing found" are the
 * Design System's own messages, shown under the options, outside the listbox.
 */

/** One choice of a ComboboxField or MultiSelectField. */
export interface ComboboxOption extends Choice {
  /** The value the application stores. */
  value: string
  /** What the user sees and what the search matches. From the application. */
  label: string
  /** Shown, but cannot be chosen. */
  disabled?: boolean
}

interface ListProps {
  listId: string
  labelId: string
  options: readonly ComboboxOption[]
  active: number
  isChosen: (option: ComboboxOption) => boolean
  multiple: boolean
  loading: boolean
  showEmpty: boolean
}

export function optionId(listId: string, index: number): string {
  return `${listId}-option-${String(index)}`
}

export function ComboboxList(props: ListProps) {
  const { messages } = useLiro()
  return (
    <>
      {props.options.length > 0 && (
        <div
          id={props.listId}
          role="listbox"
          aria-labelledby={props.labelId}
          aria-multiselectable={props.multiple || undefined}
          className="max-h-55 overflow-y-auto"
        >
          {props.options.map((option, index) => (
            <div
              key={option.value}
              id={optionId(props.listId, index)}
              role="option"
              aria-selected={props.isChosen(option)}
              aria-disabled={option.disabled === true || undefined}
              data-highlighted={index === props.active ? '' : undefined}
              data-disabled={option.disabled === true ? '' : undefined}
              className={OPTION}
              data-index={index}
              tabIndex={-1}
            >
              <span className="flex size-[0.8em] shrink-0 items-center justify-center">
                {props.isChosen(option) && <Check aria-hidden="true" className="size-[0.8em]" />}
              </span>
              <span className="min-w-0 break-words">{option.label}</span>
            </div>
          ))}
        </div>
      )}
      {props.loading && (
        <p role="status" className="m-0 px-2.5 py-1.5 text-center text-sm text-secondary">
          {messages['field.loading']}
        </p>
      )}
      {!props.loading && props.showEmpty && (
        <p role="status" className="m-0 px-2.5 py-1.5 text-center text-sm text-secondary">
          {messages['field.noResults']}
        </p>
      )}
    </>
  )
}

/** The option under a pointer event, from its data-index. */
function indexAt(target: EventTarget): number | null {
  const option = target instanceof Element ? target.closest('[data-index]') : null
  if (option === null || option.getAttribute('aria-disabled') === 'true') return null
  return Number(option.getAttribute('data-index'))
}

/**
 * The floating box around the list, anchored to `anchor`, keeping the focus in the input. The
 * pointer is handled here for all options: a press never moves the focus out of the input, a
 * hover makes the option active, a click picks it (the keyboard is handled by the input).
 */
export function ComboboxPopover({
  open,
  onOpenChange,
  anchor,
  onOptionHover,
  onOptionClick,
  children,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  anchor: ReactNode
  onOptionHover: (index: number) => void
  onOptionClick: (index: number) => void
  children: ReactNode
}) {
  const anchorRef = useRef<HTMLDivElement>(null)
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverAnchor asChild>
        <div ref={anchorRef}>{anchor}</div>
      </PopoverAnchor>
      <PopoverContent
        align="start"
        className={cn(FLOATING, FLOATING_MOTION, 'w-(--radix-popover-trigger-width) p-1')}
        onOpenAutoFocus={(event) => {
          event.preventDefault()
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault()
        }}
        onMouseDown={(event) => {
          event.preventDefault()
        }}
        onMouseMove={(event) => {
          const index = indexAt(event.target)
          if (index !== null) onOptionHover(index)
        }}
        onClick={(event) => {
          const index = indexAt(event.target)
          if (index !== null) onOptionClick(index)
        }}
        onInteractOutside={(event) => {
          if (event.target instanceof Node && anchorRef.current?.contains(event.target)) {
            event.preventDefault()
          }
        }}
      >
        {children}
      </PopoverContent>
    </Popover>
  )
}

export interface ComboboxFieldProps extends FieldBaseProps {
  /** The options to show: all of them, or the results of the last search. */
  options: readonly ComboboxOption[]
  /** Controlled choice; null is none. */
  value?: ComboboxOption | null
  /** Uncontrolled initial choice. */
  defaultValue?: ComboboxOption | null
  /** Called with the chosen option, or null when the field is cleared. */
  onChange?: (option: ComboboxOption | null) => void
  /**
   * Called with the text typed, after typing pauses for `searchDelay`. When given, the
   * application searches (usually on the server) and passes the results as `options`; when not,
   * the field filters `options` itself.
   */
  onSearch?: (query: string) => void
  /** Milliseconds of quiet before `onSearch`. Default: 300. */
  searchDelay?: number
  /** The application is searching: shows the loading message. */
  loading?: boolean
  /** Shown while the field is empty. From the application. */
  placeholder?: string
  /** The form field name; the chosen option's value is submitted. */
  name?: string
}

/**
 * A choice from a long list, found by typing: the application's search runs after a pause
 * (`onSearch`, with `loading` while it works), or the field filters a known list itself.
 * Loading and "nothing found" are shown in the list. Clearing the text clears the choice.
 */
export function ComboboxField(props: ComboboxFieldProps) {
  const { messages, locale } = useLiro()
  const listId = `${useId()}-list`
  const [innerValue, setInnerValue] = useState(props.defaultValue ?? null)
  const value = props.value === undefined ? innerValue : props.value
  const [query, setQuery] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const search = useDebouncedCallback(props.onSearch, props.searchDelay ?? 300)

  const shown =
    props.onSearch === undefined ? filterChoices(props.options, query ?? '', locale) : props.options
  const showEmpty = shown.length === 0 && (query ?? '') !== ''
  // Open only when there is something to show: options, loading, or "nothing found".
  const visible = open && (shown.length > 0 || props.loading === true || showEmpty)
  const choose = (option: ComboboxOption | null) => {
    setInnerValue(option)
    props.onChange?.(option)
    setQuery(null)
    setOpen(false)
    setActive(-1)
  }

  return (
    <Field {...fieldProps(props)}>
      {(control) => {
        const attributes = controlAttributes(control, messages['field.readOnly'])
        if (control.readOnly) {
          return <Input {...attributes} value={value?.label ?? ''} className={READ_ONLY} />
        }
        const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
          if ((MOVE_KEYS as readonly string[]).includes(event.key)) {
            if (!open && (event.key === 'Home' || event.key === 'End')) return
            event.preventDefault()
            setOpen(true)
            setActive(moveActive(event.key as MoveKey, active, shown))
          } else if (event.key === 'Enter' && open && active >= 0) {
            event.preventDefault()
            const option = shown[active]
            if (option !== undefined && option.disabled !== true) choose(option)
          } else if (event.key === 'Escape' && open) {
            event.preventDefault()
            setOpen(false)
            setQuery(null)
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
                if (option !== undefined) choose(option)
              }}
              anchor={
                <Input
                  {...attributes}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={visible && shown.length > 0}
                  aria-controls={visible && shown.length > 0 ? listId : undefined}
                  aria-activedescendant={
                    visible && active >= 0 ? optionId(listId, active) : undefined
                  }
                  autoComplete="off"
                  value={query ?? value?.label ?? ''}
                  {...(props.placeholder === undefined ? {} : { placeholder: props.placeholder })}
                  onChange={(event) => {
                    const text = event.target.value
                    setQuery(text)
                    setOpen(true)
                    setActive(-1)
                    search(text)
                  }}
                  onKeyDown={onKeyDown}
                  onBlur={() => {
                    if (query === '') choose(null)
                    else setQuery(null)
                    setOpen(false)
                  }}
                />
              }
            >
              <ComboboxList
                listId={listId}
                labelId={control.labelId}
                options={shown}
                active={active}
                isChosen={(option) => option.value === value?.value}
                multiple={false}
                loading={props.loading === true}
                showEmpty={showEmpty}
              />
            </ComboboxPopover>
            {props.name !== undefined && (
              <input type="hidden" name={props.name} value={value?.value ?? ''} />
            )}
          </>
        )
      }}
    </Field>
  )
}
