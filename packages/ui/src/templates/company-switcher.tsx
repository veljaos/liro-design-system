import { Check, ChevronDown, Search } from 'lucide-react'
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type RefObject,
} from 'react'
import { StatusBadge } from '../components/status-badge'
import { ButtonPrimitive } from '../primitives/button'
import { INPUT, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { DialogCloseButton, DialogHeader, DialogTitle } from '../primitives/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover'
import { Sheet, SheetContent } from '../primitives/sheet'
import { useLiro } from '../provider/liro-provider'
import { rowOffsets, scrollToShow, visibleRows } from '../components/virtual-rows'
import {
  companyKeyTarget,
  companyMatcher,
  companyRows,
  companySections,
  type CompanyRow,
  type CompanySectionKey,
  type ShellCompanies,
} from './company-logic'

/*
 * The company switcher (P4.1; scaled in P4.9, the owner's review: an accountant may have 5,000
 * companies). One list for the desktop popover and the phone sheet:
 * - a search field at the top (name or description — the application's tax-number line —
 *   ignoring case and accents) when there are more than COMPANY_SEARCH_THRESHOLD companies, and
 *   always on a phone;
 * - sections: Pinned (the user's favourites), Recent, All companies; the headings only when there
 *   is more than one section; a company stands in one section only;
 * - each company: a 14px check for the current one, the name (13px; medium when current), its
 *   description (xs text.tertiary), a status badge for a suspended or inactive company, and the
 *   application's note at the end ("5 tasks");
 * - the keyboard: ArrowDown/ArrowUp, PageDown/PageUp (ten), Home/End (in the list; in the search
 *   field they move the caret), Enter chooses; the WAI-ARIA combobox pattern with
 *   aria-activedescendant, so the focus stays in the search field;
 * - only the rows in view (and 240px around them) are in the page — rows have known heights
 *   (headings 28px, companies 36px, 48px with a description), so a small virtualiser of its own
 *   places them without measuring; each option carries aria-setsize and aria-posinset;
 * - nothing found: "No company matches “…”".
 * Desktop: a 320px popover under the button at the end, the list at most 400px high. Phones: a
 * full-screen sheet with the search field at the top, opened from the user menu or the command
 * palette.
 */

/** The companies list shows a search field above this many (and always on a phone). */
export const COMPANY_SEARCH_THRESHOLD = 7

/** The list's height on desktop (and the first guess of its height before it is measured). */
const LIST_HEIGHT = 400

const HEADING_HEIGHT = 28
const ROW_HEIGHT = 36
const TWO_LINE_HEIGHT = 48

function rowHeight(row: CompanyRow): number {
  if (row.kind === 'heading') return HEADING_HEIGHT
  return row.company.description === undefined ? ROW_HEIGHT : TWO_LINE_HEIGHT
}

/** The first company row, or the current company's when it is listed. */
function startRow(rows: readonly CompanyRow[], current: string): number {
  const currentRow = rows.findIndex((row) => row.kind === 'company' && row.company.id === current)
  if (currentRow !== -1) return currentRow
  return rows.findIndex((row) => row.kind === 'company')
}

/** The searchable, sectioned, virtualised list of companies. */
export function CompanyList({
  companies,
  onDone,
  searchable: forceSearch = false,
  fill = false,
}: {
  companies: ShellCompanies
  onDone: () => void
  /** Show the search field even for few companies (the phone sheet). */
  searchable?: boolean
  /** Fill the height of the container (the phone sheet) instead of at most 400px. */
  fill?: boolean
}) {
  const { messages, locale } = useLiro()
  const id = useId()
  const listId = `${id}-list`
  const [query, setQuery] = useState('')
  const searchable = forceSearch || companies.items.length > COMPANY_SEARCH_THRESHOLD
  const match = useMemo(() => companyMatcher(companies.items, locale), [companies.items, locale])
  const rows = useMemo(
    () => companyRows(companySections(match(query), companies.pinned, companies.recent)),
    [match, query, companies.pinned, companies.recent],
  )
  const total = rows.reduce((count, row) => count + (row.kind === 'company' ? 1 : 0), 0)
  const [active, setActive] = useState(() => startRow(rows, companies.current))
  const scroller = useRef<HTMLDivElement>(null)
  const { tops, total: totalHeight } = useMemo(() => rowOffsets(rows.map(rowHeight)), [rows])
  // The list's own small virtualiser: rows have known heights, so only the rows in view (and
  // 240px around them) are in the page — 5,000 companies stay as quick as five.
  const [view, setView] = useState({ top: 0, height: LIST_HEIGHT })
  const { first, last } = visibleRows(tops, totalHeight, view.top, view.height)
  useLayoutEffect(() => {
    const list = scroller.current
    if (list === null) return
    const measure = () => {
      setView((previous) =>
        previous.height === list.clientHeight && previous.top === list.scrollTop
          ? previous
          : { top: list.scrollTop, height: list.clientHeight || LIST_HEIGHT },
      )
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(list)
    return () => {
      observer.disconnect()
    }
  }, [])

  // A new search starts at the first company found.
  const lastQuery = useRef(query)
  useLayoutEffect(() => {
    if (lastQuery.current === query) return
    lastQuery.current = query
    setActive(startRow(rows, ''))
    if (scroller.current !== null) scroller.current.scrollTop = 0
    setView((previous) => ({ ...previous, top: 0 }))
  }, [query, rows])

  const optionId = (index: number) => `${id}-option-${String(index)}`

  // The active row stays in view.
  useEffect(() => {
    const list = scroller.current
    const row = rows[active]
    if (list === null || row === undefined) return
    const to = scrollToShow(tops[active] ?? 0, rowHeight(row), list.scrollTop, list.clientHeight)
    if (to !== undefined) list.scrollTop = to
  }, [active, rows, tops])

  const choose = (index: number) => {
    const row = rows[index]
    if (row?.kind !== 'company') return
    companies.onSelect(row.company.id)
    onDone()
  }

  const onKeyDown = (event: KeyboardEvent<HTMLElement>, inField: boolean) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      choose(active)
      return
    }
    // In the search field Home and End move the caret.
    if (inField && (event.key === 'Home' || event.key === 'End')) return
    const target = companyKeyTarget(rows, active, event.key)
    if (target === undefined) return
    event.preventDefault()
    setActive(target)
  }

  const activeId = active >= 0 && active < rows.length ? optionId(active) : undefined
  const headingText: Record<CompanySectionKey, string> = {
    pinned: messages['shell.pinnedCompanies'],
    recent: messages['shell.recentCompanies'],
    all: messages['shell.allCompanies'],
  }

  const renderRow = (row: CompanyRow, index: number) => {
    if (row.kind === 'heading') {
      // Section headings are for the eye; the options carry their own names and positions.
      return (
        <div
          aria-hidden="true"
          className="box-border flex h-7 items-end px-2.5 pb-1 text-xs font-semibold text-secondary"
        >
          <span className={TEXT_DIRECTION}>{headingText[row.key]}</span>
        </div>
      )
    }
    const { company } = row
    const current = company.id === companies.current
    return (
      <div
        id={optionId(index)}
        role="option"
        aria-selected={index === active}
        aria-setsize={total}
        aria-posinset={row.position}
        {...(current ? { 'aria-current': 'true' as const } : {})}
        data-highlighted={index === active ? '' : undefined}
        data-index={index}
        tabIndex={-1}
        className={cn(
          'box-border flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 text-sm text-primary select-none data-highlighted:bg-surface-sunken',
          company.description === undefined ? 'h-9' : 'h-12',
        )}
      >
        <span aria-hidden="true" className="flex size-3.5 shrink-0 items-center">
          {current && <Check className="size-3.5" />}
        </span>
        <span className="flex min-w-0 flex-1 flex-col">
          <span className={cn('truncate', TEXT_DIRECTION, current && 'font-medium')}>
            {company.name}
          </span>
          {company.description !== undefined && (
            <span className={cn('truncate text-xs text-tertiary', TEXT_DIRECTION)}>
              {company.description}
            </span>
          )}
        </span>
        {company.status !== undefined && (
          <span className="shrink-0">
            <StatusBadge label={company.status.label} tone={company.status.tone} />
          </span>
        )}
        {company.note !== undefined && (
          <span className={cn('max-w-24 shrink-0 truncate text-xs text-secondary', TEXT_DIRECTION)}>
            {company.note}
          </span>
        )}
      </div>
    )
  }

  return (
    <div className={cn('flex min-h-0 flex-col font-sans text-primary', fill && 'flex-1')}>
      {searchable && (
        <div className="relative mb-1 shrink-0">
          <Search
            aria-hidden="true"
            className="pointer-events-none absolute start-3 top-1/2 size-3.75 -translate-y-1/2 text-tertiary"
          />
          <input
            type="text"
            role="combobox"
            aria-expanded="true"
            aria-controls={listId}
            aria-autocomplete="list"
            {...(activeId === undefined ? {} : { 'aria-activedescendant': activeId })}
            aria-label={messages['shell.findCompany']}
            placeholder={messages['shell.findCompanyHint']}
            autoComplete="off"
            spellCheck={false}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
            }}
            onKeyDown={(event) => {
              onKeyDown(event, true)
            }}
            className={cn(INPUT, 'box-border ps-9')}
          />
        </div>
      )}
      {total === 0 && (
        <p role="status" className="m-0 px-2.5 py-3 text-center text-sm text-secondary">
          <span className={TEXT_DIRECTION}>{messages['shell.noCompany'](query.trim())}</span>
        </p>
      )}
      {/* The pointer is handled on the list (the options are found by their index); the press
          keeps the focus in the search field. */}
      <div
        ref={scroller}
        id={listId}
        role="listbox"
        aria-label={messages['shell.companies']}
        // Without a search field the list itself takes the focus and the keys.
        tabIndex={searchable ? -1 : 0}
        {...(!searchable && activeId !== undefined ? { 'aria-activedescendant': activeId } : {})}
        onKeyDown={(event) => {
          if (!searchable) onKeyDown(event, false)
        }}
        onMouseDown={(event) => {
          if (searchable) event.preventDefault()
        }}
        onMouseMove={(event) => {
          const index = optionIndex(event.target)
          if (index !== undefined && index !== active) setActive(index)
        }}
        onClick={(event) => {
          const index = optionIndex(event.target)
          if (index !== undefined) choose(index)
        }}
        onScroll={(event) => {
          const list = event.currentTarget
          setView({ top: list.scrollTop, height: list.clientHeight })
        }}
        className={cn(
          'min-h-0 overflow-y-auto rounded-md outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
          fill ? 'flex-1' : 'max-h-100',
          total === 0 && 'hidden',
        )}
      >
        <div className="relative w-full" style={{ height: totalHeight }}>
          {rows.slice(first, last).map((row, offset) => {
            const index = first + offset
            return (
              <div
                key={row.kind === 'heading' ? `h-${row.key}` : row.company.id}
                className="absolute inset-x-0 top-0"
                style={{ transform: `translateY(${String(tops[index] ?? 0)}px)` }}
              >
                {renderRow(row, index)}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

/** The option's index under the pointer. */
function optionIndex(target: EventTarget): number | undefined {
  if (!(target instanceof Element)) return undefined
  const option = target.closest('[data-index]')
  if (option === null) return undefined
  const index = Number(option.getAttribute('data-index'))
  return Number.isInteger(index) ? index : undefined
}

export function currentCompanyName(companies: ShellCompanies): string {
  return companies.items.find((company) => company.id === companies.current)?.name ?? ''
}

/** Desktop: the button with the current company and the popover with the list. */
export function CompanySwitcher({
  companies,
  open,
  onOpenChange,
}: {
  companies: ShellCompanies
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { messages } = useLiro()
  const name = currentCompanyName(companies)
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <ButtonPrimitive
          family="neutral"
          emphasis="menu"
          aria-label={messages['shell.switchCompany'](name)}
          className="min-h-control-sm gap-1.5 px-2.5 text-sm font-medium"
        >
          <span className={cn('max-w-60 truncate', TEXT_DIRECTION)}>{name}</span>
          <ChevronDown aria-hidden="true" className="size-3.5 shrink-0" />
        </ButtonPrimitive>
      </PopoverTrigger>
      <PopoverContent align="end" className="box-border w-80 p-1 shadow-md">
        <CompanyList
          companies={companies}
          onDone={() => {
            onOpenChange(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}

/** Phones: the list as a full-screen sheet, the search field at the top. */
export function CompanySheet({
  companies,
  open,
  onOpenChange,
  returnFocusTo,
}: {
  companies: ShellCompanies
  open: boolean
  onOpenChange: (open: boolean) => void
  /**
   * Where the focus goes when the sheet closes (Escape, the close button, a choice): the button
   * that opened it. The menu entry that opened it is gone by then, so Radix would lose the focus.
   */
  returnFocusTo?: RefObject<HTMLElement | null>
}) {
  const { messages } = useLiro()
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="full"
        onCloseAutoFocus={(event) => {
          const target = returnFocusTo?.current
          if (target === null || target === undefined) return
          event.preventDefault()
          target.focus({ preventScroll: true })
        }}
        aria-describedby={undefined}
        // The search field takes the focus, not the close button (the sheet is for finding).
        onOpenAutoFocus={(event) => {
          event.preventDefault()
          const sheet = event.currentTarget
          if (sheet instanceof HTMLElement)
            sheet.querySelector('input')?.focus({ preventScroll: true })
        }}
        className="overflow-hidden pb-[env(safe-area-inset-bottom)] ps-[env(safe-area-inset-left)] pe-[env(safe-area-inset-right)]"
      >
        <DialogHeader className="shrink-0 pt-[max(16px,env(safe-area-inset-top))]">
          <DialogTitle>{messages['shell.switchCompanyTitle']}</DialogTitle>
          <DialogCloseButton label={messages['dialog.close']} />
        </DialogHeader>
        <div className="flex min-h-0 flex-1 flex-col px-4 pb-4">
          <CompanyList
            companies={companies}
            searchable
            fill
            onDone={() => {
              onOpenChange(false)
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  )
}
