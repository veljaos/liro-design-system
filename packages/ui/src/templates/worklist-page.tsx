import { ArrowLeft, ArrowRight } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type SVGProps } from 'react'
import { Button, IconButton } from '../components/button'
import { Checkbox } from '../primitives/checkbox'
import { useBelowMd } from '../components/use-phone'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { PageHeader, type PageBack } from './page-header'

/*
 * WorklistPage (BUILD-PLAN P4.3; the owner's values, docs/decisions.md "Worklist"): a queue
 * processed item by item.
 * - From md (62em): the list 380px at the start, the detail fills the rest, a 1px border.default
 *   line between them; each scrolls on its own, the page filling the screen under the shell
 *   (AppShell's --liro-shell-top).
 * - Below md: the list; choosing an item shows its detail full width (the whole screen, never a
 *   second list under it), its top row "Back to list" at the start and the position ("3 of 11")
 *   with Previous and Next at the end. The item's decisions go into AppShell's bottom bar (the
 *   application passes them there; P4.9 rule 16).
 * - One way to decide items one by one (P5.23, the owner's review): the position, Previous, Next
 *   and the decisions — the main one last ("Confirm and next", "Approve") — stand in one bar at
 *   the bottom of the detail pane from md, always in view; after a decision the application
 *   opens the next item and confirms with a toast (Undo where the Core can take it back).
 * - `summary` stands between the title and the list: the record the queue belongs to (a
 *   statement's balances and progress); the title row takes `back`, `status` and `subtitle`.
 * - Rows (the old WorklistItem): the title (sm semibold), a subtitle (xs text.secondary), one
 *   deciding figure at the end (sm medium, tabular) with the status badge under it; rows
 *   separated by border.subtle, padding sm by md. The chosen row is surface.selected with a 3px
 *   border.selected bar at its start (the neutral selection, AGENTS.md D17). The detail pane is
 *   optional.
 * - Decisions (Approve, Reject) stand only in the detail, where the item is seen whole, and in the
 *   bulk bar for checked rows — never in every row (P4.9, the owner's review). With
 *   `onCheckedChange` each row has a checkbox at its start (16px, a 24px target); `bulkBar` (a
 *   BulkActionBar) stands above the list while any row is checked.
 */

/** One item of the queue. */
export interface WorklistItem {
  id: string
  /** From the application ("F-2026-0412 · Drina Prevoz d.o.o."). */
  title: ReactNode
  subtitle?: ReactNode
  /** The one figure the decision depends on (an amount through MoneyText). */
  figure?: ReactNode
  /** A StatusBadge. */
  status?: ReactNode
  /** The item's name as plain text, for its checkbox ("UF-2026-1187"). Default: the title, if text. */
  label?: string
}

export interface WorklistPageProps {
  /** The page's title (h1). */
  title: string
  /** The title for screen readers only, when a module tab already names the page. Default false. */
  titleHidden?: boolean
  /** The page's actions at the end of the title row. */
  actions?: ReactNode
  /** The back button at the start of the title (the record's list). */
  back?: PageBack
  /** After the title: a StatusBadge (the record's state). */
  status?: ReactNode
  /** A line under the title. */
  subtitle?: ReactNode
  /**
   * Between the title and the list: what the queue belongs to (KeyFigures, a progress line).
   * Below md it stands above the list and is not shown with an item's detail.
   */
  summary?: ReactNode
  /** Names the list for assistive technology ("Invoices to approve"). */
  label: string
  items: readonly WorklistItem[]
  /** The chosen item's id. */
  selected?: string
  onSelect?: (id: string) => void
  /** The chosen item's detail. Optional: a worklist may be a list alone. */
  detail?: ReactNode
  /**
   * The chosen item's decisions, the main one last ("Leave for later", "Confirm and next"). From
   * md they end the detail pane's bottom bar; below md WorklistPage does not show them: the
   * application puts them into AppShell's `bottomBar`, within thumb reach.
   */
  detailActions?: ReactNode
  /** Below md: back from the detail to the list (the application clears `selected`). */
  onBack?: () => void
  /** To the previous item (the application chooses it, and whether the queue wraps around). */
  onPrevious?: () => void
  /** On to the next item. */
  onNext?: () => void
  /** Above the list (a FilterBar or a count). */
  toolbar?: ReactNode
  /** The checked rows' ids (for bulk decisions). */
  checked?: readonly string[]
  /** Gives every row a checkbox; reports the checked ids. */
  onCheckedChange?: (ids: string[]) => void
  /** Above the list while any row is checked: a BulkActionBar with the decisions. */
  bulkBar?: ReactNode
  /** Shown instead of the rows when there are none (an EmptyState). */
  empty?: ReactNode
  /** 'split' (list and detail side by side) or 'stacked'; default by the viewport (62em). */
  layout?: 'split' | 'stacked'
  className?: string
}

/** The arrows of Previous and Next, pointing along the reading direction (mirrored in rtl). */
function ArrowStart(props: SVGProps<SVGSVGElement>) {
  return <ArrowLeft {...props} className={cn(props.className, 'rtl:-scale-x-100')} />
}
function ArrowEnd(props: SVGProps<SVGSVGElement>) {
  return <ArrowRight {...props} className={cn(props.className, 'rtl:-scale-x-100')} />
}

/** "3 of 11": the chosen item's place among the items, or null when none is chosen. */
export function worklistPosition(
  items: readonly { id: string }[],
  selected: string | undefined,
): { index: number; total: number } | null {
  const index = selected === undefined ? -1 : items.findIndex((item) => item.id === selected)
  return index < 0 ? null : { index: index + 1, total: items.length }
}

function Row({
  item,
  selected,
  onSelect,
  check,
}: {
  item: WorklistItem
  selected: boolean
  onSelect?: (id: string) => void
  check?: { checked: boolean; onChange: (checked: boolean) => void }
}) {
  const { messages } = useLiro()
  const choose = () => onSelect?.(item.id)
  const name = item.label ?? (typeof item.title === 'string' ? item.title : item.id)
  return (
    <li
      aria-current={selected ? 'true' : undefined}
      data-liro-surface={selected ? 'selected' : undefined}
      className={cn(
        'relative box-border flex items-start gap-3 border-0 border-b border-solid border-subtle px-4 py-3',
        selected
          ? "bg-surface-selected before:absolute before:inset-y-0 before:start-0 before:border-0 before:border-s-[3px] before:border-solid before:border-selected before:content-['']"
          : 'hover:bg-surface-hover',
      )}
    >
      {check !== undefined && (
        // Outside the row's button; 16px with a 24px target, on the title's first line.
        <Checkbox
          checked={check.checked}
          onCheckedChange={(value) => {
            check.onChange(value === true)
          }}
          aria-label={messages['table.selectRow'](name)}
          className="mt-0.5 flex size-4 after:-inset-1 [&_svg]:size-2.5"
        />
      )}
      <div
        role="button"
        tabIndex={0}
        aria-pressed={selected}
        onClick={choose}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            choose()
          }
        }}
        className="flex min-w-0 flex-1 cursor-pointer items-start gap-4 rounded-sm outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
            {item.title}
          </span>
          {item.subtitle !== undefined && (
            <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{item.subtitle}</span>
          )}
        </div>
        {(item.figure !== undefined || item.status !== undefined) && (
          <div className="flex shrink-0 flex-col items-end gap-1">
            {item.figure !== undefined && (
              <span className="text-sm font-medium text-primary tabular-nums">{item.figure}</span>
            )}
            {item.status}
          </div>
        )}
      </div>
    </li>
  )
}

/**
 * The detail pane from md: it scrolls on its own and takes the focus only while it scrolls, so
 * the keyboard can scroll it (WCAG 2.1.1, axe scrollable-region-focusable), as DataTable's area.
 */
function DetailPane({ label, children }: { label: string; children: ReactNode }) {
  const pane = useRef<HTMLDivElement>(null)
  const [scrolls, setScrolls] = useState(false)
  useEffect(() => {
    const element = pane.current
    if (element === null) return
    const measure = () => {
      setScrolls(element.scrollHeight > element.clientHeight)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    const content = element.firstElementChild
    if (content !== null) observer.observe(content)
    return () => {
      observer.disconnect()
    }
  }, [])
  return (
    <div
      ref={pane}
      {...(scrolls ? { tabIndex: 0, role: 'region', 'aria-label': label } : {})}
      className="min-h-0 min-w-0 flex-1 overflow-y-auto outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus"
    >
      <div>{children}</div>
    </div>
  )
}

/**
 * The detail's bar from md. It publishes how far its top stands above the bottom of the window
 * as --liro-shell-bottom on the provider's root (as AppShell's bottom bar does on phones,
 * P4.9d), so the toast that confirms a decision stands above the bar and never covers "Next" or
 * the next decision.
 */
function DetailBar({ children }: { children: ReactNode }) {
  const bar = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const element = bar.current
    if (element === null) return
    const owner = element.closest<HTMLElement>('[data-liro-theme]') ?? element
    const measure = () => {
      const distance = Math.max(0, window.innerHeight - element.getBoundingClientRect().top)
      owner.style.setProperty('--liro-shell-bottom', `${String(Math.round(distance))}px`)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    window.addEventListener('resize', measure)
    return () => {
      observer.disconnect()
      window.removeEventListener('resize', measure)
      owner.style.removeProperty('--liro-shell-bottom')
    }
  }, [])
  return (
    <div
      ref={bar}
      data-slot="worklist-detail-bar"
      className="flex shrink-0 flex-wrap items-center gap-2 border-0 border-t border-solid border-default px-6 py-3"
    >
      {children}
    </div>
  )
}

/** A queue processed item by item: the list and the chosen item's detail. */
export function WorklistPage(props: WorklistPageProps) {
  const { messages, format } = useLiro()
  const viewportNarrow = useBelowMd()
  const stacked = props.layout === undefined ? viewportNarrow : props.layout === 'stacked'
  const showDetail = props.detail !== undefined && props.selected !== undefined

  const place = worklistPosition(props.items, props.selected)
  const position =
    place === null ? null : (
      <span data-slot="worklist-position" className="shrink-0 text-sm text-secondary tabular-nums">
        {messages['worklist.position'](
          place.index,
          format.number(String(place.index)),
          place.total,
          format.number(String(place.total)),
        )}
      </span>
    )

  const checked = props.checked ?? []
  const onChecked = props.onCheckedChange
  const list = (
    <div className="flex min-h-0 min-w-0 flex-col">
      {props.toolbar}
      {props.bulkBar !== undefined && checked.length > 0 && (
        <div className="border-0 border-b border-solid border-subtle p-3">{props.bulkBar}</div>
      )}
      {props.items.length === 0 ? (
        props.empty
      ) : (
        <ul aria-label={props.label} className="m-0 flex list-none flex-col p-0">
          {props.items.map((item) => (
            <Row
              key={item.id}
              item={item}
              selected={item.id === props.selected}
              {...(props.onSelect === undefined ? {} : { onSelect: props.onSelect })}
              {...(onChecked === undefined
                ? {}
                : {
                    check: {
                      checked: checked.includes(item.id),
                      onChange: (on: boolean) => {
                        onChecked(
                          on ? [...checked, item.id] : checked.filter((id) => id !== item.id),
                        )
                      },
                    },
                  })}
            />
          ))}
        </ul>
      )}
    </div>
  )

  const header = (
    <PageHeader
      title={props.title}
      {...(props.titleHidden === undefined ? {} : { titleHidden: props.titleHidden })}
      {...(props.back === undefined ? {} : { back: props.back })}
      {...(props.status === undefined ? {} : { status: props.status })}
      {...(props.subtitle === undefined ? {} : { subtitle: props.subtitle })}
      {...(props.actions === undefined ? {} : { actions: props.actions })}
    />
  )

  if (stacked) {
    return (
      <div
        data-slot="worklist-page"
        className={cn('box-border flex w-full flex-col gap-4 p-4', props.className)}
      >
        {showDetail ? (
          <>
            {/* The detail's header: back to the list; the position, Previous and Next. */}
            <div className="flex items-center gap-2">
              {props.onBack !== undefined && (
                <Button intent="back" label={messages['worklist.back']} onClick={props.onBack} />
              )}
              <div className="ms-auto flex items-center gap-2">
                {position}
                {props.onPrevious !== undefined && (
                  <IconButton
                    family="neutral"
                    icon={ArrowStart}
                    label={messages['worklist.previous']}
                    onClick={props.onPrevious}
                  />
                )}
                {props.onNext !== undefined && (
                  <IconButton
                    family="neutral"
                    icon={ArrowEnd}
                    label={messages['worklist.next']}
                    onClick={props.onNext}
                  />
                )}
              </div>
            </div>
            <div className="min-w-0">{props.detail}</div>
          </>
        ) : (
          <>
            {header}
            {props.summary}
            <div className="overflow-hidden rounded-lg border border-solid border-default bg-surface-raised">
              {list}
            </div>
          </>
        )}
      </div>
    )
  }

  const bar =
    position !== null ||
    props.onPrevious !== undefined ||
    props.onNext !== undefined ||
    props.detailActions !== undefined
  return (
    <div
      data-slot="worklist-page"
      className={cn(
        'box-border flex h-[calc(100dvh-var(--liro-shell-top,0px))] w-full flex-col gap-4 p-6',
        props.className,
      )}
    >
      {header}
      {props.summary}
      <div
        className={cn(
          'grid min-h-0 flex-1 overflow-hidden rounded-lg border border-solid border-default bg-surface-raised',
          props.detail === undefined ? 'grid-cols-1' : 'grid-cols-[380px_minmax(0,1fr)]',
        )}
      >
        <div
          className={cn(
            'min-h-0 overflow-y-auto',
            props.detail !== undefined && 'border-0 border-e border-solid border-default',
          )}
        >
          {list}
        </div>
        {props.detail !== undefined && (
          <div className="flex min-h-0 min-w-0 flex-col">
            <DetailPane label={messages['worklist.detail']}>{props.detail}</DetailPane>
            {bar && (
              // The item's bar: where it stands, Previous and Next, then its decisions with the
              // main one last — always in view under the scrolling detail.
              <DetailBar>
                <div className="me-auto">{position}</div>
                {props.onPrevious !== undefined && (
                  <Button
                    family="neutral"
                    icon={ArrowStart}
                    label={messages['worklist.previous']}
                    onClick={props.onPrevious}
                  />
                )}
                {props.onNext !== undefined && (
                  <Button
                    family="neutral"
                    icon={ArrowEnd}
                    label={messages['worklist.next']}
                    onClick={props.onNext}
                  />
                )}
                {props.detailActions}
              </DetailBar>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
