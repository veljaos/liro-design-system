import { ArrowUpDown, Search, X } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { DialogBody, DialogCloseButton, DialogHeader, DialogTitle } from '../primitives/dialog'
import {
  DropdownMenu as MenuRoot,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu'
import { Input } from '../primitives/input'
import { Sheet, SheetContent, SheetTrigger } from '../primitives/sheet'
import { useLiro } from '../provider/liro-provider'
import { ActionButton } from './actions'
import { CompactIconButton } from './button'
import { useDebouncedCallback } from './combobox-logic'
import type { DataTableFilters, DataTableSort } from './data-table-logic'
import { DateRangeField, type DateRange } from './date-field'
import {
  clearFilters,
  emptyFilterValue,
  filterValueText,
  isFilterSet,
  sortButtonText,
  type FilterDefinition,
  type FilterValue,
  type NumberRange,
  type SortColumn,
} from './filter-logic'
import { MultiSelectField } from './multi-select-field'
import { MoneyField, NumberField } from './number-field'
import { SelectField } from './select-field'
import { TextField } from './text-field'
import { usePhone } from './use-phone'

/*
 * FilterBar (BUILD-PLAN P3.3), the previous Design System's Toolbar and FilterBar (owner's
 * decisions, 2026-10-01, docs/decisions.md "Filters"):
 * - One row that wraps, aligned to the bottom (the control line): on the start side the search
 *   field and the filters, on the end side the actions (8px apart); 12px (sm) between items.
 *   Inside a card (`inCard`): padding 16px at the top and sides, 8px at the bottom.
 * - Search: 260px (100% below 36em), a 15px search icon at the start, a clear button at the end
 *   while there is text; placeholder and accessible name `messages['filter.search']` unless
 *   given. Reported after typing pauses (`searchDelay`, 300ms); clearing reports at once.
 * - The first `inline` filters stand in the row on desktop, each with its label above it and the
 *   same text as its placeholder; the others are in a drawer opened by "Filters" (intent filter).
 *   On phones (below 48em) every filter is in the drawer, full width.
 * - The drawer: from the end side, 320px (100% on phones), titled "Filters" (13px, bold), the
 *   controls stacked 12px apart.
 * - Inline widths: select and text 180px, multiSelect 220px, dateRange 240px, boolean 140px,
 *   each end of a number range 100px (140px with a currency: MoneyFields, P3.6).
 * - P3.6 (owner): an inline multiSelect keeps the control height, its choices summed up on one
 *   line ("Alfa Trade", "2 selected"); a number range has "From" and "To" labels (messages); the
 *   actions, when they do not fit beside search and filters, take their own line ABOVE them,
 *   end-aligned. The page's main action ("New invoice") belongs in the page header (P4.3); the
 *   bar keeps the list's own actions, such as Export.
 * - Active filters that are not inline show as removable pills "Label: value" under the row, with
 *   "Clear all" (subtle, xs), which clears only this bar's filters.
 * - On phones, where cards have no column headers, a "Sort" button beside "Filters" shows the
 *   current sort ("Date ↓") and opens a menu of the sortable columns and the two directions.
 * The bar only reports changes; the application filters and sorts, on the server.
 */

export interface FilterBarProps {
  /** The filters, in order; the first `inline` stand in the row on desktop. */
  filters: readonly FilterDefinition[]
  /** Every filter's value by id (see `FilterValue`); other keys are kept as they are. */
  values: DataTableFilters
  /** Called with all values after any filter changes. */
  onValuesChange: (values: DataTableFilters) => void
  /** How many filters stand in the row on desktop. Default: 0 (all in the drawer). */
  inline?: number
  /** The search text. With `onSearchChange`, the bar shows its search field. */
  search?: string
  /** Called with the search text after typing pauses for `searchDelay`, and at once on clear. */
  onSearchChange?: (text: string) => void
  /** Milliseconds of quiet before a search or text filter is reported. Default: 300. */
  searchDelay?: number
  /** The search field's placeholder and name. Default: `messages['filter.search']`. */
  searchPlaceholder?: string
  /** The current sort, for the phone's sort button (desktop sorts in the column headers). */
  sort?: DataTableSort
  /** The sortable columns, short labels ("Date"). With `onSortChange`, phones get "Sort". */
  sortColumns?: readonly SortColumn[]
  onSortChange?: (sort: DataTableSort) => void
  /** Actions at the end of the row (buttons), the main one last. */
  actions?: ReactNode
  /** The bar sits at the top of a card: it takes the card's padding. */
  inCard?: boolean
  /** Forces the desktop or the phone layout; default: by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** Inline widths on desktop (owner); literal classes, so Tailwind finds them. */
const INLINE_WIDTH: Record<FilterDefinition['type'], string> = {
  select: 'w-45',
  text: 'w-45',
  multiSelect: 'w-55',
  dateRange: 'w-60',
  boolean: 'w-35',
  numberRange: '',
}

interface ControlProps {
  filter: FilterDefinition
  value: unknown
  onChange: (value: FilterValue) => void
  /** In the row (fixed widths) or in the drawer (full width). */
  inline: boolean
  delay: number
}

/** A text filter, reported after typing pauses. */
function TextFilter({ filter, value, onChange, inline, delay }: ControlProps) {
  const [text, setText] = useState(typeof value === 'string' ? value : '')
  const report = useDebouncedCallback((next: string) => {
    onChange(next === '' ? null : next)
  }, delay)
  const outside = typeof value === 'string' ? value : ''
  const reported = useRef(outside)
  useEffect(() => {
    // A change from outside (a removed pill, "Clear all") replaces the text being typed.
    if (outside !== reported.current) setText(outside)
    reported.current = outside
  }, [outside])
  return (
    <TextField
      label={filter.label}
      placeholder={filter.label}
      value={text}
      onChange={(next) => {
        setText(next)
        reported.current = next
        report(next)
      }}
      className={inline ? INLINE_WIDTH.text : 'w-full'}
    />
  )
}

/**
 * A number range: the filter's label over two fields, 8px apart, so it lines up with the other
 * filters (P3.6c, owner). "From" and "To" (messages) are short texts inside each field at its
 * start, as the currency is at its side; the fields are named "Total from" / "Total to"
 * (`filter.rangeFrom` / `filter.rangeTo`). With a `currency` they are MoneyFields, 140px each in
 * the row (owner); otherwise NumberFields, 100px each. The same in the drawer.
 */
function NumberRangeFilter({ filter, value, onChange, inline }: ControlProps) {
  const { messages } = useLiro()
  const labelId = useId()
  const range = (value ?? { min: null, max: null }) as NumberRange
  const definition = filter.type === 'numberRange' ? filter : undefined
  const decimals = definition?.decimals === undefined ? {} : { decimals: definition.decimals }
  const currency = definition?.currency
  const end = (key: 'min' | 'max', name: string, startText: string) => {
    const common = {
      label: <span className="sr-only">{name}</span>,
      startText,
      value: range[key],
      onChange: (next: string | null) => {
        onChange({ ...range, [key]: next })
      },
      ...decimals,
    }
    const width = inline ? (currency === undefined ? 'w-25' : 'w-35') : 'min-w-0 flex-1'
    return currency === undefined ? (
      <NumberField {...common} className={width} />
    ) : (
      <MoneyField {...common} currency={currency} className={width} />
    )
  }
  return (
    <div role="group" aria-labelledby={labelId} className="flex min-w-0 flex-col">
      <span id={labelId} className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
        {filter.label}
      </span>
      {/* Each field keeps its own 4px under its (hidden) label: the pair stands 4px under the
          filter's label, as every other filter's control does. */}
      <div className="flex gap-2">
        {end('min', messages['filter.rangeFrom'](filter.label), messages['filter.from'])}
        {end('max', messages['filter.rangeTo'](filter.label), messages['filter.to'])}
      </div>
    </div>
  )
}

/** One filter's control, by its kind. */
function FilterControl(props: ControlProps) {
  const { messages } = useLiro()
  const { filter, value, onChange, inline } = props
  const width = inline ? INLINE_WIDTH[filter.type] : 'w-full'
  switch (filter.type) {
    case 'select':
      return (
        <SelectField
          label={filter.label}
          placeholder={filter.label}
          options={filter.options}
          value={typeof value === 'string' ? value : ''}
          onChange={(next) => {
            onChange(next === '' ? null : next)
          }}
          clearable
          className={width}
        />
      )
    case 'boolean':
      return (
        <SelectField
          label={filter.label}
          placeholder={filter.label}
          options={[
            { value: 'true', label: messages['filter.yes'] },
            { value: 'false', label: messages['filter.no'] },
          ]}
          value={value === true ? 'true' : value === false ? 'false' : ''}
          onChange={(next) => {
            onChange(next === '' ? null : next === 'true')
          }}
          clearable
          className={width}
        />
      )
    case 'multiSelect':
      return (
        <MultiSelectField
          label={filter.label}
          placeholder={filter.label}
          options={filter.options}
          value={Array.isArray(value) ? (value as string[]) : []}
          onChange={onChange}
          summary={inline}
          className={width}
        />
      )
    case 'dateRange':
      return (
        <DateRangeField
          label={filter.label}
          placeholder={messages['filter.from']}
          endPlaceholder={messages['filter.to']}
          value={(value ?? { start: null, end: null }) as DateRange}
          onChange={onChange}
          className={width}
        />
      )
    case 'numberRange':
      return <NumberRangeFilter {...props} />
    case 'text':
      return <TextFilter {...props} />
  }
}

/** The search field: icon at the start, a clear button at the end while there is text. */
function SearchField(props: {
  value: string
  onChange: (text: string) => void
  delay: number
  placeholder: string
  wide: boolean
}) {
  const { messages } = useLiro()
  const [text, setText] = useState(props.value)
  const inputRef = useRef<HTMLInputElement>(null)
  const report = useDebouncedCallback(props.onChange, props.delay)
  const reported = useRef(props.value)
  useEffect(() => {
    if (props.value !== reported.current) setText(props.value)
    reported.current = props.value
  }, [props.value])
  return (
    <div className={cn('relative', props.wide ? 'w-full xs:w-65' : 'w-full')}>
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 start-0 flex w-9 items-center justify-center text-secondary"
      >
        <Search className="size-3.75" />
      </span>
      <Input
        ref={inputRef}
        aria-label={props.placeholder}
        placeholder={props.placeholder}
        autoComplete="off"
        value={text}
        onChange={(event) => {
          setText(event.target.value)
          reported.current = event.target.value
          report(event.target.value)
        }}
        className={cn('ps-9', text !== '' && 'pe-9')}
      />
      {text !== '' && (
        <span className="absolute inset-y-0 end-1 flex items-center">
          <CompactIconButton
            intent="cancel"
            label={messages['filter.clearSearch']}
            onClick={() => {
              setText('')
              reported.current = ''
              props.onChange('')
              inputRef.current?.focus()
            }}
          />
        </span>
      )}
    </div>
  )
}

/**
 * An active filter as a pill with its remove button: Mantine Pill size 'sm' (as MultiSelectField's),
 * variant "contrast" (the raised surface, text.primary, the × in text.secondary) with a 1px
 * border.default border (owner, 2026-10-01); the remove button is a 24 × 24px target. The
 * default variant's grey is the page's own, and the border keeps it visible on a card too.
 */
function FilterPill({
  text,
  label,
  onRemove,
}: {
  text: string
  label: string
  onRemove: () => void
}) {
  const { messages } = useLiro()
  return (
    <li
      data-slot="filter-pill"
      className="box-border inline-flex h-[22px] max-w-full items-center rounded-full border border-solid border-default bg-surface-raised ps-[0.8em] text-xs leading-none text-primary"
    >
      <span className={cn('truncate', TEXT_DIRECTION)}>{text}</span>
      <button
        type="button"
        aria-label={messages['filter.remove'](label)}
        className={cn(
          BUTTON_RESET,
          'flex h-6 min-w-6 cursor-pointer items-center justify-center rounded-e-full ps-[0.1em] pe-[0.3em] text-secondary',
          FOCUS_RING,
        )}
        onClick={onRemove}
      >
        <X aria-hidden="true" className="size-3" />
      </button>
    </li>
  )
}

/** The phone's sort button and its menu: the sortable columns, then the two directions. */
function SortMenu(props: {
  sort: DataTableSort
  columns: readonly SortColumn[]
  onSortChange: (sort: DataTableSort) => void
}) {
  const { messages } = useLiro()
  const { sort, columns } = props
  const first = columns[0]
  return (
    <MenuRoot modal={false}>
      <DropdownMenuTrigger asChild>
        <ActionButton
          action={{
            family: 'neutral',
            icon: ArrowUpDown,
            emphasis: 'secondary',
            label: sortButtonText(sort, columns, messages['filter.sort']),
          }}
          aria-label={`${messages['filter.sort']}: ${sortButtonText(sort, columns, '—')}`}
        />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuRadioGroup
          value={sort?.column ?? ''}
          onValueChange={(column) => {
            props.onSortChange({ column, direction: sort?.direction ?? 'asc' })
          }}
        >
          {columns.map((column) => (
            <DropdownMenuRadioItem key={column.id} value={column.id} check>
              {column.label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
        <DropdownMenuSeparator />
        <DropdownMenuRadioGroup
          value={sort?.direction ?? ''}
          onValueChange={(direction) => {
            const column = sort?.column ?? first?.id
            if (column !== undefined) {
              props.onSortChange({ column, direction: direction === 'desc' ? 'desc' : 'asc' })
            }
          }}
        >
          <DropdownMenuRadioItem value="asc" check>
            {messages['filter.ascending']}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="desc" check>
            {messages['filter.descending']}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </MenuRoot>
  )
}

/**
 * The search and filters above a list: search at the start, filters beside it, actions at the
 * end (Appendix B.8). Controlled: it reports the search text, the filter values and, on phones,
 * the sort; the application fetches the matching rows.
 */
export function FilterBar(props: FilterBarProps) {
  const { messages, format } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const delay = props.searchDelay ?? 300
  const inlineCount = phone ? 0 : Math.max(0, props.inline ?? 0)
  const inlineFilters = props.filters.slice(0, inlineCount)
  const drawerFilters = props.filters.slice(inlineCount)

  const setValue = (filter: FilterDefinition, value: FilterValue) => {
    props.onValuesChange({ ...props.values, [filter.id]: value })
  }
  const control = (filter: FilterDefinition, inline: boolean) => (
    <FilterControl
      key={filter.id}
      filter={filter}
      value={props.values[filter.id]}
      onChange={(value) => {
        setValue(filter, value)
      }}
      inline={inline}
      delay={delay}
    />
  )
  const pills = drawerFilters.flatMap((filter) => {
    const text = filterValueText(filter, props.values[filter.id], format, messages)
    return text === null ? [] : [{ filter, text }]
  })
  const anySet = props.filters.some((filter) => isFilterSet(props.values[filter.id]))
  const sortable = phone && props.onSortChange !== undefined && (props.sortColumns?.length ?? 0) > 0

  return (
    <div
      data-slot="filter-bar"
      className={cn(
        'flex min-w-0 flex-col gap-2 font-sans text-primary',
        props.inCard === true && 'px-4 pt-4 pb-2',
        props.className,
      )}
    >
      {/*
        wrap-reverse (P3.6, owner): when the actions do not fit beside search and filters, their
        line goes ABOVE them, end-aligned, never under the filters. With wrap-reverse the cross
        axis runs upwards, so items-start keeps the controls on one bottom line.
      */}
      <div className="flex flex-wrap-reverse items-start justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-end gap-3">
          {props.onSearchChange !== undefined && (
            <SearchField
              value={props.search ?? ''}
              onChange={props.onSearchChange}
              delay={delay}
              placeholder={props.searchPlaceholder ?? messages['filter.search']}
              wide={!phone}
            />
          )}
          {inlineFilters.map((filter) => control(filter, true))}
          {(drawerFilters.length > 0 || sortable) && (
            <div className="flex flex-wrap items-end gap-3">
              {drawerFilters.length > 0 && (
                <Sheet>
                  <SheetTrigger asChild>
                    <ActionButton
                      action={{ intent: 'filter', label: messages['filter.filters'] }}
                    />
                  </SheetTrigger>
                  <SheetContent
                    side="end"
                    aria-describedby={undefined}
                    className="w-80 max-sm:w-full"
                  >
                    <DialogHeader>
                      <DialogTitle className="text-sm font-bold">
                        {messages['filter.filters']}
                      </DialogTitle>
                      <DialogCloseButton label={messages['dialog.close']} />
                    </DialogHeader>
                    <DialogBody className="gap-3">
                      {drawerFilters.map((filter) => control(filter, false))}
                    </DialogBody>
                  </SheetContent>
                </Sheet>
              )}
              {sortable && props.onSortChange !== undefined && (
                <SortMenu
                  sort={props.sort ?? null}
                  columns={props.sortColumns ?? []}
                  onSortChange={props.onSortChange}
                />
              )}
            </div>
          )}
        </div>
        {props.actions !== undefined && (
          <div className="ms-auto flex flex-wrap items-center gap-2">{props.actions}</div>
        )}
      </div>
      {pills.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <ul className="m-0 flex list-none flex-wrap items-center gap-2 p-0">
            {pills.map(({ filter, text }) => (
              <FilterPill
                key={filter.id}
                label={filter.label}
                text={messages['filter.pill'](filter.label, text)}
                onRemove={() => {
                  setValue(filter, emptyFilterValue(filter))
                }}
              />
            ))}
          </ul>
          {anySet && (
            <ActionButton
              small
              action={{ intent: 'cancel', emphasis: 'menu', label: messages['filter.clearAll'] }}
              onClick={() => {
                props.onValuesChange(clearFilters(props.filters, props.values))
              }}
            />
          )}
        </div>
      )}
    </div>
  )
}
