import type { RowData } from '@tanstack/react-table'
import { useEffect, useId, useRef, useState } from 'react'
import {
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Dialog as DialogRoot,
} from '../primitives/dialog'
import { Sheet, SheetContent } from '../primitives/sheet'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { isTypingKey, lookupKeyTarget } from './catalog-logic'
import { DataTable, type DataTableColumn, type DataTableMobile } from './data-table'
import type { DataTableFilters } from './data-table-logic'
import { FilterBar } from './filter-bar'
import type { FilterDefinition } from './filter-logic'
import { usePhone } from './use-phone'

/*
 * LookupDialog (BUILD-PLAN P5.19, "Search all…"): the whole catalogue — tens of thousands of
 * customers, items or accounts — in a large dialog, opened from a LookupField's last entry. The
 * search and filters (FilterBar), the table with the application's columns (DataTable), keyset
 * paging (the application's cursor: `hasNext` / `onNext`, CursorPagination under the table) and
 * keyboard selection. The application searches, filters and pages on the server; the dialog only
 * renders what it is given and reports.
 *
 * Keyboard (decided, docs/p5-notes/group-E.md): the search field takes the focus when the dialog
 * opens; ArrowDown moves the focus to the first result; ArrowDown / ArrowUp move between results
 * (ArrowUp from the first back to the search field), PageDown / PageUp by ten, Home / End to the
 * first and last; Enter or Space chooses the focused result; typing on a result sends the focus
 * back to the search field with the typed character. The focused row is the active one: the focus
 * ring shows it and a screen reader reads the row, so nothing depends on colour. Chosen over the
 * combobox pattern (focus kept in the field, `aria-activedescendant`) because the results are a
 * table with columns, whose rows DataTable already makes focusable and pressable; a combobox's
 * listbox cannot hold a table.
 *
 * Size: a 960px dialog (at most 90% of the width) with the table scrolling inside 55% of the
 * screen's height under a sticky header; on phones (below 48em, or `layout`) a full-screen sheet
 * with the results as a flat list (the P4.9d sheet, `side="full"`).
 */

export interface LookupDialogProps<Row extends RowData> {
  /** Controlled: the application opens it ("Search all…") and closes it. */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The catalogue's name, the dialog's title ("Customers"). Also names the results table. */
  title: string
  /** A line under the title, from the application. */
  description?: string
  /**
   * The search text when the dialog opens: what the user typed in the LookupField. The
   * application opens the dialog with its results for this text.
   */
  initialQuery?: string
  /** The search text after typing pauses (300ms, FilterBar's): the application searches. */
  onSearch: (query: string) => void
  /** The search field's placeholder and name ("Name, tax number or city"). */
  searchPlaceholder?: string
  /** Filters of the catalogue (FilterBar's); the first `inlineFilters` stand in the row. */
  filters?: readonly FilterDefinition[]
  filterValues?: DataTableFilters
  onFilterValuesChange?: (values: DataTableFilters) => void
  /** How many filters stand beside the search on desktop. Default 2. */
  inlineFilters?: number
  /** The columns the application chose for this catalogue. */
  columns: readonly DataTableColumn<Row>[]
  /** The current page of results, in the order to show. */
  rows: readonly Row[]
  getRowId: (row: Row) => string
  /** Names a row for assistive technology. */
  getRowLabel: (row: Row) => string
  /** A result was chosen (Enter, Space or a press). The dialog then closes. */
  onChoose: (row: Row) => void
  /** Keyset paging: another page after this one (the application keeps the cursor). */
  hasNext: boolean
  onNext: () => void
  hasPrevious?: boolean
  onPrevious?: () => void
  /** The number of matching records, from the application; `countIsExact` false for a lower bound. */
  count?: number
  countIsExact?: boolean
  /** The application is searching: skeletons on the first load, a small loader after. */
  loading?: boolean
  /** The result's card on a phone (DataTable's). */
  mobile?: DataTableMobile<Row>
  /** 'phone' forces the full-screen sheet; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
}

/** The search's key among the table's filters (it decides "no rows match"). */
const SEARCH = '__search'

/** The rows (desktop) or cards (phone) that take the focus, in order. */
function resultElements(area: HTMLElement): HTMLElement[] {
  return [...area.querySelectorAll<HTMLElement>('tbody > tr[tabindex], li > [tabindex]')]
}

/** The search field of the dialog's FilterBar (its first input). */
function searchInput(area: HTMLElement | null): HTMLInputElement | null {
  return area?.querySelector<HTMLInputElement>('[data-slot="filter-bar"] input') ?? null
}

/** The full catalogue in a large dialog: search, filters, columns, keyset paging, keyboard. */
export function LookupDialog<Row extends RowData>(props: LookupDialogProps<Row>) {
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const Root = phone ? Sheet : DialogRoot
  return (
    <Root open={props.open} onOpenChange={props.onOpenChange}>
      {props.open && <LookupBody {...props} phone={phone} />}
    </Root>
  )
}

/** The content, mounted while open, so each opening starts from `initialQuery`. */
function LookupBody<Row extends RowData>(props: LookupDialogProps<Row> & { phone: boolean }) {
  const { messages } = useLiro()
  const hintId = useId()
  const descriptionId = useId()
  const area = useRef<HTMLDivElement>(null)
  const [query, setQuery] = useState(props.initialQuery ?? '')
  const { phone } = props

  // The keys of the search field and of the results, as they bubble (a native listener: the
  // container is not a control of its own).
  useEffect(() => {
    const element = area.current
    if (element === null) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement
      const search = searchInput(element)
      const rows = resultElements(element)
      const index = rows.indexOf(target)
      if (target !== search && index < 0) return
      if (index >= 0 && isTypingKey(event)) {
        // The character goes to the field that now has the focus.
        search?.focus()
        return
      }
      const next = lookupKeyTarget(event.key, index, rows.length)
      if (next === null) return
      event.preventDefault()
      if (next === 'search') search?.focus()
      else rows[next]?.focus()
    }
    element.addEventListener('keydown', onKey)
    return () => {
      element.removeEventListener('keydown', onKey)
    }
  }, [])

  const choose = (row: Row) => {
    props.onChoose(row)
    props.onOpenChange(false)
  }
  const focusOnOpen = (event: Event) => {
    event.preventDefault()
    searchInput(area.current)?.focus()
  }
  const describedBy = props.description === undefined ? hintId : `${descriptionId} ${hintId}`

  const parts = (
    <>
      <DialogHeader>
        <DialogTitle>{props.title}</DialogTitle>
        <DialogCloseButton label={messages['dialog.close']} />
      </DialogHeader>
      <div ref={area} className="flex min-h-0 flex-1 flex-col">
        <DialogBody className={cn('min-h-0 flex-1', phone && 'px-0')}>
          {props.description !== undefined && (
            <DialogDescription id={descriptionId} className={cn(phone && 'px-4')}>
              {props.description}
            </DialogDescription>
          )}
          <FilterBar
            layout={phone ? 'phone' : 'desktop'}
            className={cn(phone && 'px-4')}
            filters={props.filters ?? []}
            values={props.filterValues ?? {}}
            onValuesChange={props.onFilterValuesChange ?? (() => undefined)}
            inline={props.inlineFilters ?? 2}
            search={query}
            onSearchChange={(text) => {
              setQuery(text)
              props.onSearch(text)
            }}
            {...(props.searchPlaceholder === undefined
              ? {}
              : { searchPlaceholder: props.searchPlaceholder })}
          />
          <DataTable
            label={props.title}
            layout={phone ? 'cards' : 'table'}
            inCard={phone}
            columns={props.columns}
            rows={props.rows}
            getRowId={props.getRowId}
            getRowLabel={props.getRowLabel}
            // The search counts as a filter: nothing found says "No rows match" with "Clear
            // filters", which empties the search and the filters.
            filters={{ ...props.filterValues, [SEARCH]: query }}
            onFiltersChange={() => {
              setQuery('')
              props.onSearch('')
              props.onFilterValuesChange?.({})
            }}
            onRowClick={choose}
            hasNext={props.hasNext}
            onNext={props.onNext}
            hasPrevious={props.hasPrevious ?? false}
            onPrevious={props.onPrevious ?? (() => undefined)}
            {...(props.count === undefined ? {} : { count: props.count })}
            {...(props.countIsExact === undefined ? {} : { countIsExact: props.countIsExact })}
            {...(props.loading === undefined ? {} : { loading: props.loading })}
            {...(props.mobile === undefined ? {} : { mobile: props.mobile })}
            {...(phone ? {} : { stickyHeader: true, maxHeight: '55dvh' })}
          />
          <p
            id={hintId}
            className={cn('m-0 text-xs text-tertiary', TEXT_DIRECTION, phone && 'px-4')}
          >
            {messages['lookup.keyboardHint']}
          </p>
        </DialogBody>
      </div>
    </>
  )
  if (phone) {
    return (
      <SheetContent
        side="full"
        aria-describedby={describedBy}
        onOpenAutoFocus={focusOnOpen}
        className="pb-[env(safe-area-inset-bottom)]"
      >
        {parts}
      </SheetContent>
    )
  }
  return (
    <DialogContent aria-describedby={describedBy} onOpenAutoFocus={focusOnOpen} className="w-240">
      {parts}
    </DialogContent>
  )
}
