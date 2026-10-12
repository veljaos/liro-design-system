import { useVirtualizer, type Range } from '@tanstack/react-virtual'
import { Check, Plus, Search, TextCursorInput } from 'lucide-react'
import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { AUTO_DIRECTION, READ_ONLY, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Input } from '../primitives/input'
import { useLiro } from '../provider/liro-provider'
import { ComboboxPopover } from './combobox-field'
import { useDebouncedCallback } from './combobox-logic'
import { controlAttributes, Field, fieldProps, type FieldBaseProps } from './field'
import {
  choosableCount,
  firstChoosable,
  isChoosable,
  lookupKeyTarget,
  LOOKUP_ROW_HEIGHTS,
  lookupRowHeight,
  lookupRows,
  type LookupCreateKind,
  type LookupKind,
  type LookupOption,
  type LookupRow,
} from './lookup-logic'
import { keepFocusedRow, overscanRows } from './virtual-rows'

/*
 * LookupField (BUILD-PLAN P5.19): the one searching field for catalogues of tens of thousands of
 * records — customers, items, services, accounts — in forms and in document lines (EditableGrid's
 * `lookup` column, P5.18). It is ComboboxField's WAI-ARIA combobox (the input keeps the focus,
 * the active row announced through aria-activedescendant, Enter chooses, Escape closes) with:
 * - the application's search while typing (`onSearch` after `searchDelay`, default 300ms, with
 *   `loading`): the field never filters a catalogue itself;
 * - the recent records first while nothing is typed (`recent`, under "Recent");
 * - the results grouped by kind (`kinds`: Items, Services, Fixed assets …), each record with a
 *   second line (`description`) and a short text at the end (`detail`, e.g. the stock); the
 *   kind's heading is for the eye, and each record's name carries its kind for assistive
 *   technology (a flat virtualised listbox cannot nest groups, as the company switcher);
 * - "+ Create <kind> “<query>”" entries after the results (`create`, reported by `onCreate`; the
 *   application opens LookupCreateDrawer or its own form), a one-off entry when the application
 *   allows it (`allowOneOff`), and "Search all…" last (`onSearchAll`, which opens the application's
 *   LookupDialog with the query);
 * - only the rows in view, 600px around them and the active row are in the page (TanStack
 *   Virtual with the shared window rules of `virtual-rows.ts`; rows of known heights: headings
 *   28px, records 36px or 48px with a second line, actions 36px), so a long result list stays
 *   quick; each row carries aria-setsize and aria-posinset.
 * The list opens on typing, ArrowDown, Alt+ArrowDown or a press on the field, never on Tab alone
 * (a grid of lookup cells would open a list in every cell). While something is typed, the first
 * record found is active, so Enter takes it (as the old grid's item search); nothing is active
 * before the user types or moves.
 */

/** The list's height at most (and its first guess before it is measured). */
const LIST_HEIGHT = 320

/**
 * The listbox of the open list: only the rows in view, 600px around them and the active row are
 * drawn. Mounted with the list, so a list opened anew starts at its top.
 */
function LookupList({
  rows,
  active,
  listId,
  labelledBy,
  hidden,
  renderRow,
}: {
  rows: readonly LookupRow[]
  active: number
  listId: string
  labelledBy: string
  hidden: boolean
  renderRow: (row: LookupRow, index: number) => ReactNode
}) {
  const scroller = useRef<HTMLDivElement>(null)
  // A new list of rows gives new keys, so their sizes are taken anew (rows have known heights).
  const getItemKey = useCallback(
    (index: number) => `${String(rows.length)}-${String(index)}`,
    [rows],
  )
  const estimateSize = useCallback(
    (index: number) => {
      const row = rows[index]
      return row === undefined ? LOOKUP_ROW_HEIGHTS.option : lookupRowHeight(row)
    },
    [rows],
  )
  const rangeExtractor = useCallback(
    (range: Range) => keepFocusedRow(range, active < 0 ? null : active),
    [active],
  )
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => scroller.current,
    estimateSize,
    getItemKey,
    overscan: overscanRows(LOOKUP_ROW_HEIGHTS.option),
    rangeExtractor,
    initialRect: { width: 0, height: LIST_HEIGHT },
  })

  // The active row stays in view.
  useEffect(() => {
    if (active >= 0 && active < rows.length) virtualizer.scrollToIndex(active)
  }, [active, rows, virtualizer])

  return (
    <div
      ref={scroller}
      id={listId}
      role="listbox"
      aria-labelledby={labelledBy}
      className={cn('max-h-80 overflow-y-auto', hidden && 'hidden')}
    >
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => {
          const row = rows[item.index]
          if (row === undefined) return null
          return (
            <div
              key={item.index}
              className="absolute inset-x-0 top-0"
              style={{ transform: `translateY(${String(item.start)}px)` }}
            >
              {renderRow(row, item.index)}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export interface LookupFieldProps extends FieldBaseProps {
  /** Controlled choice; null is none. */
  value?: LookupOption | null
  /** Uncontrolled initial choice. */
  defaultValue?: LookupOption | null
  /**
   * Text standing typed when the field first shows, with its list open (empty text: the recent
   * records): a search the application restores, with its `results` already passed.
   */
  defaultQuery?: string
  /** Called with the chosen record (or a one-off entry), or null when the field is cleared. */
  onChange?: (option: LookupOption | null) => void
  /**
   * Called with the text typed once typing pauses for `searchDelay` (never for empty text, which
   * shows the recent records). The application searches its catalogue and passes the results.
   */
  onSearch: (query: string) => void
  /** The application's results for the last query, in its order. */
  results: readonly LookupOption[]
  /** Milliseconds of quiet before `onSearch`. Default: 300. */
  searchDelay?: number
  /** The application is searching: the loading message shows, the last results stay. */
  loading?: boolean
  /** Recently used records, shown while nothing is typed. */
  recent?: readonly LookupOption[]
  /** The kinds of record in the order of their groups, with their headings and names. */
  kinds?: readonly LookupKind[]
  /** Kinds that may be created from the typed text: one "+ Create …" entry each. */
  create?: readonly LookupCreateKind[]
  /** A "+ Create …" entry was chosen: the kind and the text typed. */
  onCreate?: (kind: string, query: string) => void
  /** Offer a one-off entry (the typed text without a catalogue record). The application's rule. */
  allowOneOff?: boolean
  /** Adds "Search all…" as the last entry; called with the text typed. */
  onSearchAll?: (query: string) => void
  /** Shown while the field is empty. From the application (never the label again). */
  placeholder?: string
  /** The form field name; the chosen record's value is submitted. */
  name?: string
}

/**
 * A choice from a catalogue of tens of thousands, found by the application's search: recent
 * records first, results grouped by kind, "+ Create …" when the right one is not found, and
 * "Search all…" for the full catalogue.
 */
export function LookupField(props: LookupFieldProps) {
  const { messages } = useLiro()
  const id = useId()
  const listId = `${id}-list`
  const [innerValue, setInnerValue] = useState(props.defaultValue ?? null)
  const value = props.value === undefined ? innerValue : props.value
  const [query, setQuery] = useState<string | null>(props.defaultQuery ?? null)
  const [open, setOpen] = useState(props.defaultQuery !== undefined)
  const [active, setActive] = useState(-1)
  const search = useDebouncedCallback(props.onSearch, props.searchDelay ?? 300)
  const typed = query ?? ''
  const trimmed = typed.trim()
  const loading = props.loading === true

  const rows = useMemo(
    () =>
      lookupRows({
        query: typed,
        results: props.results,
        recent: props.recent ?? [],
        kinds: props.kinds ?? [],
        recentHeading: messages['lookup.recent'],
        create: props.onCreate === undefined ? [] : (props.create ?? []),
        oneOff: props.allowOneOff === true,
        searchAll: props.onSearchAll !== undefined,
      }),
    [
      typed,
      props.results,
      props.recent,
      props.kinds,
      props.create,
      props.onCreate,
      props.allowOneOff,
      props.onSearchAll,
      messages,
    ],
  )
  const setSize = choosableCount(rows)
  const noResults = trimmed !== '' && !loading && !rows.some((row) => row.type === 'option')
  const visible = open && (rows.length > 0 || loading || noResults)

  // While something is typed, the first record found is active (Enter takes it); a new list of
  // rows starts there, and at nothing while the recent records show.
  const [rowsSeen, setRowsSeen] = useState(rows)
  if (rowsSeen !== rows) {
    setRowsSeen(rows)
    const first = firstChoosable(rows)
    setActive(trimmed !== '' && rows[first]?.type === 'option' ? first : -1)
  }

  const close = () => {
    setOpen(false)
    setQuery(null)
    setActive(-1)
  }
  const choose = (option: LookupOption | null) => {
    setInnerValue(option)
    props.onChange?.(option)
    close()
  }
  const runRow = (index: number) => {
    const row = rows[index]
    if (!isChoosable(row) || row === undefined) return
    if (row.type === 'option') choose(row.option)
    else if (row.type === 'create') {
      const text = trimmed
      close()
      props.onCreate?.(row.kind, text)
    } else if (row.type === 'oneOff') {
      choose({ value: '', label: trimmed, oneOff: true })
    } else if (row.type === 'searchAll') {
      const text = trimmed
      close()
      props.onSearchAll?.(text)
    }
  }

  const optionId = (index: number) => `${listId}-option-${String(index)}`
  const activeShown = visible && active >= 0 && isChoosable(rows[active])

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' && event.altKey) {
      event.preventDefault()
      setOpen(true)
      return
    }
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      close()
      return
    }
    if (
      event.key === 'Enter' &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.altKey &&
      visible &&
      active >= 0
    ) {
      event.preventDefault()
      runRow(active)
      return
    }
    // In the field Home and End move the caret, unless the list is open.
    if ((event.key === 'Home' || event.key === 'End') && !visible) return
    if (event.altKey || event.ctrlKey || event.metaKey) return
    const target = lookupKeyTarget(rows, active, event.key)
    if (target === undefined) return
    event.preventDefault()
    setOpen(true)
    setActive(target)
  }

  const renderRow = (row: LookupRow, index: number) => {
    if (row.type === 'heading') {
      // Headings are for the eye; the records carry their kind in their own names.
      return (
        <div
          aria-hidden="true"
          className="box-border flex h-7 items-end px-2.5 pb-1 text-xs font-semibold text-secondary"
        >
          <span className={cn('truncate', TEXT_DIRECTION)}>{row.text}</span>
        </div>
      )
    }
    const highlighted = index === active
    const common = {
      id: optionId(index),
      role: 'option' as const,
      'aria-selected': highlighted,
      'aria-setsize': setSize,
      'aria-posinset': row.position,
      'data-index': index,
      'data-highlighted': highlighted ? '' : undefined,
      tabIndex: -1,
    }
    const rowClass =
      'group box-border flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 text-sm text-primary select-none data-highlighted:bg-brand-solid data-highlighted:text-brand-on-solid'
    if (row.type === 'option') {
      const { option } = row
      const chosen = option.value === value?.value && value.oneOff !== true
      return (
        <div
          {...common}
          aria-disabled={option.disabled === true || undefined}
          data-disabled={option.disabled === true ? '' : undefined}
          className={cn(
            rowClass,
            option.description === undefined ? 'h-9' : 'h-12',
            'data-disabled:cursor-not-allowed data-disabled:text-disabled',
          )}
        >
          <span aria-hidden="true" className="flex size-[0.8em] shrink-0 items-center">
            {chosen && <Check className="size-[0.8em]" />}
          </span>
          <span className="flex min-w-0 flex-1 flex-col">
            <span className={cn('truncate', TEXT_DIRECTION)}>{option.label}</span>
            {option.description !== undefined && (
              <span
                className={cn(
                  'truncate text-xs text-secondary group-data-highlighted:text-brand-on-solid',
                  TEXT_DIRECTION,
                )}
              >
                {option.description}
              </span>
            )}
          </span>
          {row.kindLabel !== undefined && <span className="sr-only">{`, ${row.kindLabel}`}</span>}
          {option.detail !== undefined && (
            <span
              className={cn(
                'max-w-36 shrink-0 truncate text-xs text-secondary tabular-nums group-data-highlighted:text-brand-on-solid',
                TEXT_DIRECTION,
              )}
            >
              {option.detail}
            </span>
          )}
        </div>
      )
    }
    const Icon = row.type === 'create' ? Plus : row.type === 'oneOff' ? TextCursorInput : Search
    const text =
      row.type === 'create'
        ? messages['lookup.create'](row.noun, trimmed)
        : row.type === 'oneOff'
          ? messages['lookup.oneOff'](trimmed)
          : messages['lookup.searchAll']
    return (
      <div {...common} data-action={row.type} className={cn(rowClass, 'h-9')}>
        <Icon aria-hidden="true" className="size-3.75 shrink-0" />
        <span className={cn('min-w-0 flex-1 truncate', TEXT_DIRECTION)}>{text}</span>
      </div>
    )
  }

  return (
    <Field {...fieldProps(props)}>
      {(control) => {
        const attributes = controlAttributes(control, messages['field.readOnly'])
        if (control.readOnly) {
          return (
            <Input
              {...attributes}
              value={value?.label ?? ''}
              dir={AUTO_DIRECTION.dir}
              className={cn(AUTO_DIRECTION.className, READ_ONLY)}
            />
          )
        }
        return (
          <>
            <ComboboxPopover
              open={visible}
              onOpenChange={(next) => {
                if (!next) close()
                else setOpen(true)
              }}
              className="min-w-[min(20rem,calc(100vw-2rem))]"
              onOptionHover={(index) => {
                if (isChoosable(rows[index])) setActive(index)
              }}
              onOptionClick={runRow}
              anchor={
                <Input
                  {...attributes}
                  role="combobox"
                  aria-autocomplete="list"
                  aria-expanded={visible && setSize > 0}
                  aria-controls={visible && setSize > 0 ? listId : undefined}
                  aria-activedescendant={activeShown ? optionId(active) : undefined}
                  autoComplete="off"
                  spellCheck={false}
                  dir={AUTO_DIRECTION.dir}
                  className={AUTO_DIRECTION.className}
                  value={query ?? value?.label ?? ''}
                  {...(props.placeholder === undefined ? {} : { placeholder: props.placeholder })}
                  onChange={(event) => {
                    const text = event.target.value
                    setQuery(text)
                    setOpen(true)
                    if (text.trim() !== '') search(text.trim())
                  }}
                  onPointerDown={() => {
                    setOpen(true)
                  }}
                  onKeyDown={onKeyDown}
                  onBlur={() => {
                    if (query !== null && query.trim() === '' && value !== null) choose(null)
                    else close()
                  }}
                />
              }
            >
              {loading && (
                <p
                  role="status"
                  className={cn('m-0 px-2.5 py-1.5 text-sm text-secondary', TEXT_ISOLATE)}
                >
                  {messages['field.loading']}
                </p>
              )}
              {noResults && (
                <p
                  role="status"
                  className={cn('m-0 px-2.5 py-1.5 text-sm text-secondary', TEXT_ISOLATE)}
                >
                  {messages['field.noResults']}
                </p>
              )}
              <LookupList
                rows={rows}
                active={active}
                listId={listId}
                labelledBy={control.labelId}
                hidden={setSize === 0}
                renderRow={renderRow}
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
