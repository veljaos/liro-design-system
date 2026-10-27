import { ChevronDown } from 'lucide-react'
import { useId, useState, type KeyboardEvent } from 'react'
import { AUTO_DIRECTION, READ_ONLY } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Input } from '../primitives/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '../primitives/select'
import { useLiro } from '../provider/liro-provider'
import { CompactIconButton } from './button'
import { ComboboxList, ComboboxPopover, optionId } from './combobox-field'
import { filterChoices, MOVE_KEYS, moveActive, type MoveKey } from './combobox-logic'
import {
  controlAttributes,
  Field,
  fieldProps,
  type FieldBaseProps,
  type FieldControl,
} from './field'

/** One choice of a SelectField. */
export interface SelectOption {
  /** The value the application stores. Not empty. */
  value: string
  /** What the user sees. From the application. */
  label: string
  /** Shown, but cannot be chosen. */
  disabled?: boolean
  /**
   * The label's language when it differs from the page's (D15): a language written in its own name
   * ("Srpski (latinica)" in an English page) carries `lang="sr-Latn"`, in the list and once chosen.
   */
  lang?: string
  /** Options with the same group are listed together under this heading, in order of first use. */
  group?: string
}

export interface SelectFieldProps extends FieldBaseProps {
  options: readonly SelectOption[]
  /** Controlled value; undefined or '' shows the placeholder. */
  value?: string
  /** Uncontrolled initial value. */
  defaultValue?: string
  /** Called with the chosen value, or '' when the field is cleared. */
  onChange?: (value: string) => void
  /**
   * While a value is chosen, a clear button (named by `messages['field.clear']`) replaces the
   * chevron (Mantine Select `clearable`). For optional choices such as filters.
   */
  clearable?: boolean
  /** Shown while nothing is chosen. From the application. */
  placeholder?: string
  /** The form field name. */
  name?: string
  /** Shows the list from the start (a story's picture of the open list, P5.28). Closed by default. */
  defaultOpen?: boolean
  /**
   * The list is searched by typing (P5.28 item 3): the field is a text box that filters the
   * options as the user types, and a press shows them all. Default: when there are more than
   * SEARCHABLE_FROM − 1 (10) options — a class of 30 pupils, a list of countries. False keeps the
   * plain list however long it is; true searches a short one.
   */
  searchable?: boolean
}

/** From this many options a SelectField is searched by typing (P5.28: "more than about 10"). */
export const SEARCHABLE_FROM = 11

/** Whether a SelectField with `count` options is searched by typing. */
export function isSearchable(count: number, searchable?: boolean): boolean {
  return searchable ?? count >= SEARCHABLE_FROM
}

/** The options in their groups, groups in order of first appearance; ungrouped options first. */
export function groupOptions(options: readonly SelectOption[]) {
  const groups = new Map<string | undefined, SelectOption[]>()
  for (const option of options) {
    const list = groups.get(option.group) ?? []
    list.push(option)
    groups.set(option.group, list)
  }
  const ungrouped = groups.get(undefined) ?? []
  groups.delete(undefined)
  return { ungrouped, groups: [...groups.entries()] as [string, SelectOption[]][] }
}

/** An option's text, in its own language when it has one (it travels into the trigger too). */
function OptionLabel({ option }: { option: SelectOption }) {
  if (option.lang === undefined) return option.label
  return <span lang={option.lang}>{option.label}</span>
}

/**
 * A choice from a known list (Mantine Select look). From SEARCHABLE_FROM options it is searched
 * by typing (Mantine Select `searchable`); for a list searched on the server, use ComboboxField.
 * Read-only shows the chosen option's label in the read-only look ("—" when none is chosen).
 */
export function SelectField(props: SelectFieldProps) {
  const { messages } = useLiro()
  const { ungrouped, groups } = groupOptions(props.options)
  const [innerValue, setInnerValue] = useState(props.defaultValue ?? '')
  const value = props.value ?? innerValue
  const change = (next: string) => {
    setInnerValue(next)
    props.onChange?.(next)
  }
  const chosen = props.value ?? props.defaultValue
  const chosenOption = props.options.find((option) => option.value === chosen)
  const chosenLabel = chosenOption?.label ?? ''
  return (
    <Field {...fieldProps(props)}>
      {(control) => {
        if (control.readOnly) {
          return (
            <Input
              {...controlAttributes(control, messages['field.readOnly'])}
              value={chosenLabel}
              {...(chosenOption?.lang === undefined ? {} : { lang: chosenOption.lang })}
              className={READ_ONLY}
            />
          )
        }
        if (isSearchable(props.options.length, props.searchable)) {
          return (
            <SearchableSelect
              {...props}
              control={control}
              value={value}
              onChoose={change}
              groupOrder={[...ungrouped, ...groups.flatMap(([, members]) => members)]}
            />
          )
        }
        const { id, required } = control
        const showClear = props.clearable === true && value !== ''
        return (
          <div className="relative">
            <Select
              value={value}
              onValueChange={change}
              defaultOpen={props.defaultOpen === true}
              {...(props.name === undefined ? {} : { name: props.name })}
              required={required}
            >
              <SelectTrigger
                id={id}
                aria-describedby={control.describedBy}
                aria-invalid={control.invalid || undefined}
                className={cn('w-full', showClear && 'pe-9 [&>svg]:hidden')}
              >
                {/* The chosen option's text takes its direction from itself (P3.6c). */}
                <SelectValue
                  dir="auto"
                  {...(props.placeholder === undefined ? {} : { placeholder: props.placeholder })}
                />
              </SelectTrigger>
              <SelectContent>
                {ungrouped.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    disabled={option.disabled === true}
                  >
                    <OptionLabel option={option} />
                  </SelectItem>
                ))}
                {groups.map(([heading, members], index) => (
                  <SelectGroup key={heading}>
                    {(index > 0 || ungrouped.length > 0) && <SelectSeparator />}
                    <SelectLabel>{heading}</SelectLabel>
                    {members.map((option) => (
                      <SelectItem
                        key={option.value}
                        value={option.value}
                        disabled={option.disabled === true}
                      >
                        <OptionLabel option={option} />
                      </SelectItem>
                    ))}
                  </SelectGroup>
                ))}
              </SelectContent>
            </Select>
            {showClear && (
              <span className="absolute inset-y-0 end-1 flex items-center">
                <CompactIconButton
                  intent="cancel"
                  label={messages['field.clear']}
                  onClick={() => {
                    change('')
                  }}
                />
              </span>
            )}
          </div>
        )
      }}
    </Field>
  )
}

/**
 * SelectField's searched list (P5.28 item 3): a text box with the chosen option's label and the
 * chevron at its end; a press or ArrowDown shows every option, typing filters them (ignoring case
 * and accents, in the page's locale), the keys of ComboboxField choose (the WAI-ARIA combobox
 * pattern). The groups keep their headings. Leaving the box puts the chosen label back; an
 * emptied box clears the choice only when the field is `clearable`.
 */
function SearchableSelect(
  props: SelectFieldProps & {
    control: FieldControl
    value: string
    onChoose: (value: string) => void
    /** The options in their groups' order. */
    groupOrder: readonly SelectOption[]
  },
) {
  const { messages, locale } = useLiro()
  const listId = `${useId()}-list`
  const { control } = props
  const [query, setQuery] = useState<string | null>(null)
  const chosen = props.options.find((option) => option.value === props.value)
  const shown = filterChoices(props.groupOrder, query ?? '', locale)
  /** The chosen option's place in the full list: active when the list opens, as Mantine's. */
  const chosenIndex = props.groupOrder.findIndex((option) => option.value === props.value)
  const [open, setOpenState] = useState(props.defaultOpen === true)
  const [active, setActive] = useState(props.defaultOpen === true ? chosenIndex : -1)
  const setOpen = (next: boolean) => {
    if (next && !open && query === null) setActive(chosenIndex)
    setOpenState(next)
  }
  const showEmpty = shown.length === 0
  const visible = open
  const grouped = props.options.some((option) => option.group !== undefined)
  const choose = (next: string) => {
    props.onChoose(next)
    setQuery(null)
    setOpen(false)
    setActive(-1)
  }
  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if ((MOVE_KEYS as readonly string[]).includes(event.key)) {
      if (!open && (event.key === 'Home' || event.key === 'End')) return
      event.preventDefault()
      // From a closed list the first ArrowDown shows the chosen option; then the keys move.
      const from = open ? active : -1
      setOpenState(true)
      setActive(
        !open && query === null && chosenIndex >= 0 && event.key === 'ArrowDown'
          ? chosenIndex
          : moveActive(event.key as MoveKey, from, shown),
      )
    } else if (event.key === 'Enter' && open && active >= 0) {
      event.preventDefault()
      const option = shown[active]
      if (option !== undefined && option.disabled !== true) choose(option.value)
    } else if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
      setQuery(null)
    }
  }
  const showClear = props.clearable === true && props.value !== ''
  return (
    <div className="relative">
      <ComboboxPopover
        open={visible}
        onOpenChange={setOpen}
        onOptionHover={setActive}
        onOptionClick={(index) => {
          const option = shown[index]
          if (option !== undefined) choose(option.value)
        }}
        anchor={
          <Input
            {...controlAttributes(control, messages['field.readOnly'])}
            role="combobox"
            aria-autocomplete="list"
            aria-expanded={visible && shown.length > 0}
            aria-controls={visible && shown.length > 0 ? listId : undefined}
            aria-activedescendant={visible && active >= 0 ? optionId(listId, active) : undefined}
            autoComplete="off"
            dir={AUTO_DIRECTION.dir}
            className={cn(AUTO_DIRECTION.className, 'pe-9')}
            value={query ?? chosen?.label ?? ''}
            {...(query === null && chosen?.lang !== undefined ? { lang: chosen.lang } : {})}
            {...(props.placeholder === undefined ? {} : { placeholder: props.placeholder })}
            onChange={(event) => {
              setQuery(event.target.value)
              setOpen(true)
              setActive(-1)
            }}
            onClick={() => {
              setOpen(true)
            }}
            onKeyDown={onKeyDown}
            onBlur={() => {
              if (query === '' && props.clearable === true) choose('')
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
          isChosen={(option) => option.value === props.value}
          multiple={false}
          loading={false}
          showEmpty={showEmpty}
          {...(grouped
            ? {
                groupOf: (option) =>
                  props.options.find((each) => each.value === option.value)?.group,
              }
            : {})}
        />
      </ComboboxPopover>
      {showClear ? (
        <span className="absolute inset-y-0 end-1 flex items-center">
          <CompactIconButton
            intent="cancel"
            label={messages['field.clear']}
            onClick={() => {
              choose('')
            }}
          />
        </span>
      ) : (
        <ChevronDown
          aria-hidden="true"
          className="pointer-events-none absolute end-2 top-1/2 size-4.5 -translate-y-1/2 text-secondary"
        />
      )}
      {props.name !== undefined && <input type="hidden" name={props.name} value={props.value} />}
    </div>
  )
}
