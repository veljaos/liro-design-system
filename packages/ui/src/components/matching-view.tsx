import { ArrowLeftRight, Check, Link2, Unlink2 } from 'lucide-react'
import { useId, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group'
import { useLiro } from '../provider/liro-provider'
import { ActionButton, UnavailableAction } from './actions'
import { CompactIconButton } from './button'
import { EmptyState } from './empty-state'
import {
  canMatch,
  matchingKeyAction,
  MATCHING_ROW_HEIGHT,
  MATCHING_VIRTUALIZE_FROM,
  nextActive,
  toggleSelection,
} from './matching-logic'
import { ShortcutHint } from './navigation'
import { Skeleton } from './progress'
import { TextField } from './text-field'
import { usePhone } from './use-phone'
import { rowOffsets, scrollToShow, visibleRows } from './virtual-rows'

/*
 * MatchingView (BUILD-PLAN P5.21): reconciliation of two lists — bank statement lines and open
 * items, a supplier's statement and the purchase ledger. Generic: the lists, the suggestions, the
 * matches, every amount and what is left come from the application (the Core decides what may be
 * matched and computes the rest); the view shows them and reports what the user does.
 * - One card. At the top a bar: the application's `summary` (matched / left, KeyFigures) at the
 *   start; "Match" at the end (the screen's main action), with the keys beside it; while one side
 *   has nothing selected it is an UnavailableAction with the reason ("Select at least one line in
 *   each list").
 * - "Suggested matches": rows of one or more items on each side, with the confidence in words
 *   ("Exact: amount and reference", "Likely: amount") — never colour alone —, the application's
 *   note for a partial match ("Leaves 36.420,35 RSD open on F-2026-0410"), "Match" and a dismiss
 *   button. Then the two lists side by side, a 1px border.default line between them; then
 *   "Matched": the matches made, each with "Unmatch". Repeated items inside the card are rows
 *   divided by border.subtle lines (P4.9 rule 4).
 * - A list: its title (h2 by default) and description, an optional search field (the application
 *   filters; large lists are searched, P4.9 rule 12), and a multi-select listbox. The focus stays
 *   on the list, its active item is `aria-activedescendant`: ArrowDown/ArrowUp, Home/End,
 *   PageDown/PageUp by ten, Space selects, Enter matches the selection of both lists, Escape clears
 *   it; Tab goes to the other list (`matchingKeyAction`, tested). A press selects or deselects.
 *   A selected item is the neutral selection (AGENTS.md D17): surface.selected with the 3px
 *   border.selected bar at its start, and its checkbox drawn checked (checked boxes are blue).
 * - Rows: the title (sm medium) and a subtitle (xs text.secondary) at the start, the amount at the
 *   end (tabular) with what is left under it (xs text.secondary), 12px by 16px. From 100 items a
 *   list draws only the rows in view (64px rows, one line each, in a 480px area; the company
 *   switcher's small virtualiser).
 * - Phones (`layout` 'single', default below 48em): one list at a time — a segmented switch with
 *   both titles (and how many are selected in each) — the selection kept while switching; the bar
 *   sticks under the shell's top.
 * - States: `loading` (skeleton rows, aria-busy), an empty list (the application's EmptyState or
 *   "Nothing left to match"; "no results" while a search is typed), `readOnly` (a posted statement:
 *   the lists can be read and moved through, nothing can be selected, matched or unmatched),
 *   `matchUnavailableReason` (the application's reason instead of the default one).
 */

/** One item of a list: a statement line, an open invoice. Everything from the application. */
export interface MatchingItem {
  id: string
  /** The item's name as plain text: for assistive technology ("Line 2 · Drina Prevoz d.o.o."). */
  label: string
  /** The first line ("Drina Prevoz d.o.o."). */
  title: ReactNode
  /** The second line: reference, date, number. */
  subtitle?: ReactNode
  /** The amount at the end (MoneyText). */
  amount?: ReactNode
  /** Under the amount: what is left after a partial match ("36.420,35 RSD left"). */
  remaining?: ReactNode
}

/** One of the two lists. */
export interface MatchingList {
  /** The list's title ("Statement 188", "Open invoices"): its heading and accessible name. */
  title: string
  /** A line under the title, from the application ("14 lines, 1.204.511,27 RSD"). */
  description?: ReactNode
  items: readonly MatchingItem[]
  /** The selected ids (controlled). */
  selected: readonly string[]
  onSelectedChange: (ids: string[]) => void
  /** The search text; with `onSearchChange` the list has a search field. The application filters. */
  search?: string
  onSearchChange?: (text: string) => void
  /** Shown when the list is empty (an EmptyState). Default: "Nothing left to match". */
  empty?: ReactNode
}

/** A match suggested by the application. */
export interface MatchSuggestion {
  id: string
  left: readonly MatchingItem[]
  right: readonly MatchingItem[]
  /** The suggestion as plain text, for its buttons' names ("Line 2 with F-2026-0411"). */
  label: string
  /** Why it is suggested, in words ("Exact: amount and reference"). */
  confidence: string
  /** A partial match: what is left, from the application. */
  note?: ReactNode
}

/** A match made (by hand or from a suggestion). */
export interface MatchingMatch {
  id: string
  left: readonly MatchingItem[]
  right: readonly MatchingItem[]
  /** The match as plain text, for its button's name. */
  label: string
  /** A line under it: a partial match's remainder, how it was made. */
  note?: ReactNode
}

export interface MatchingViewProps {
  /** The view's accessible name ("Matching statement 188"). */
  label: string
  /** The list at the start (e.g. the statement lines). */
  left: MatchingList
  /** The list at the end (e.g. the open items). */
  right: MatchingList
  /** Matches the selection: the ids of each side, in the order chosen. */
  onMatch?: (left: string[], right: string[]) => void
  /** Why matching is not possible now, from the application; replaces the default reason. */
  matchUnavailableReason?: string
  suggestions?: readonly MatchSuggestion[]
  onAcceptSuggestion?: (id: string) => void
  /** Gives each suggestion a dismiss button. */
  onDismissSuggestion?: (id: string) => void
  matches?: readonly MatchingMatch[]
  /** Gives each match an "Unmatch" button. */
  onUnmatch?: (id: string) => void
  /** At the start of the bar: what is matched and what is left (KeyFigures), from the application. */
  summary?: ReactNode
  /** First load: skeleton rows in the lists. */
  loading?: boolean
  /** Nothing can be selected, matched or unmatched (a posted statement). */
  readOnly?: boolean
  /** The headings' level. Default 2. */
  headingLevel?: 2 | 3 | 4
  /** 'split' (side by side) or 'single' (one list at a time); default by the viewport (48em). */
  layout?: 'split' | 'single'
  className?: string
}

type Heading = 'h2' | 'h3' | 'h4'

/** The 480px area of a virtualised list. */
const VIRTUAL_HEIGHT = 480

/** One side of a suggestion or a match: its items, one per line. */
function MatchSide({ items }: { items: readonly MatchingItem[] }) {
  return (
    <ul className="m-0 flex min-w-0 list-none flex-col gap-1 p-0">
      {items.map((item) => (
        <li key={item.id} className="flex min-w-0 items-baseline justify-between gap-3">
          <span className="flex min-w-0 flex-col">
            <span className={cn('text-sm font-medium text-primary', TEXT_DIRECTION)}>
              {item.title}
            </span>
            {item.subtitle !== undefined && (
              <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{item.subtitle}</span>
            )}
          </span>
          {item.amount !== undefined && (
            <span className="shrink-0 text-sm font-medium whitespace-nowrap text-primary tabular-nums">
              {item.amount}
            </span>
          )}
        </li>
      ))}
    </ul>
  )
}

/** A suggestion or match: the two sides with an arrow between them, a note line and actions. */
function PairRow({
  left,
  right,
  meta,
  actions,
}: {
  left: readonly MatchingItem[]
  right: readonly MatchingItem[]
  meta: ReactNode
  actions: ReactNode
}) {
  const { messages } = useLiro()
  return (
    <li className="@container flex flex-col gap-2 border-0 border-b border-solid border-subtle px-4 py-3 last:border-b-0">
      <div className="grid grid-cols-1 items-start gap-x-4 gap-y-1 @min-[36rem]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
        <MatchSide items={left} />
        <span className="flex items-center gap-1 text-xs text-tertiary @min-[36rem]:pt-0.5">
          <ArrowLeftRight aria-hidden="true" className="size-4 shrink-0" />
          <span className="sr-only">{messages['matching.matchedWith']}</span>
        </span>
        <MatchSide items={right} />
      </div>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <div className="flex min-w-0 flex-col gap-0.5 text-xs">{meta}</div>
        {actions !== null && <div className="ms-auto flex items-center gap-2">{actions}</div>}
      </div>
    </li>
  )
}

/** The rows of a list: in the flow, or only those in view when the list is long. */
function ListBox({
  list,
  active,
  setActive,
  readOnly,
  loading,
  hintId,
  onMatch,
  onClear,
}: {
  list: MatchingList
  active: number
  setActive: (index: number) => void
  readOnly: boolean
  loading: boolean
  hintId: string | undefined
  onMatch: () => void
  onClear: () => void
}) {
  const listId = useId()
  const scroller = useRef<HTMLDivElement>(null)
  const items = list.items
  const virtual = items.length >= MATCHING_VIRTUALIZE_FROM
  const [view, setView] = useState({ top: 0, height: VIRTUAL_HEIGHT })
  const optionId = (index: number) => `${listId}-${String(index)}`
  const activeItem = items[active]

  const toggle = (index: number) => {
    const item = items[index]
    if (item === undefined || readOnly) return
    list.onSelectedChange(toggleSelection(list.selected, item.id))
  }

  // Keep the active item in view when the keyboard moves it.
  const fromKeys = useRef(false)
  useLayoutEffect(() => {
    if (!fromKeys.current) return
    fromKeys.current = false
    const element = scroller.current
    if (element === null || active < 0) return
    if (virtual) {
      const next = scrollToShow(
        active * MATCHING_ROW_HEIGHT,
        MATCHING_ROW_HEIGHT,
        element.scrollTop,
        element.clientHeight,
      )
      if (next !== undefined) element.scrollTop = next
    } else {
      document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' })
    }
  })

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const action = matchingKeyAction(event.key, active, items.length, {
      ctrl: event.ctrlKey,
      meta: event.metaKey,
      alt: event.altKey,
    })
    if (action === null) return
    event.preventDefault()
    switch (action.type) {
      case 'move':
        fromKeys.current = true
        setActive(action.to)
        return
      case 'toggle':
        toggle(active)
        return
      case 'match':
        if (!readOnly) onMatch()
        return
      case 'clear':
        if (!readOnly) onClear()
        return
    }
  }

  const option = (item: MatchingItem, index: number) => {
    const selected = list.selected.includes(item.id)
    return (
      <div
        key={item.id}
        id={optionId(index)}
        role="option"
        aria-selected={selected}
        tabIndex={-1}
        data-index={index}
        data-active={index === active ? '' : undefined}
        data-liro-surface={selected ? 'selected' : undefined}
        {...(virtual ? { 'aria-setsize': items.length, 'aria-posinset': index + 1 } : {})}
        className={cn(
          'relative box-border flex cursor-pointer items-start gap-3 border-0 border-b border-solid border-subtle px-4 py-3 select-none',
          virtual && 'h-16',
          selected
            ? "bg-surface-selected before:absolute before:inset-y-0 before:start-0 before:border-0 before:border-s-[3px] before:border-solid before:border-selected before:content-['']"
            : 'hover:bg-surface-hover',
          // The active item, while the list has the keyboard focus.
          'group-focus-visible:data-active:outline-2 group-focus-visible:data-active:-outline-offset-2 group-focus-visible:data-active:outline-focus group-focus-visible:data-active:outline-solid',
          readOnly && 'cursor-default',
        )}
      >
        {!readOnly && (
          <span
            aria-hidden="true"
            className={cn(
              'mt-0.5 box-border flex size-4 shrink-0 items-center justify-center rounded-sm border border-solid',
              selected
                ? 'border-brand bg-brand-solid text-brand-on-solid'
                : 'border-control bg-surface-raised',
            )}
          >
            {selected && <Check className="size-2.5" />}
          </span>
        )}
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span
            className={cn(
              'text-sm font-medium text-primary',
              virtual && 'truncate',
              TEXT_DIRECTION,
            )}
          >
            {item.title}
          </span>
          {item.subtitle !== undefined && (
            <span className={cn('text-xs text-secondary', virtual && 'truncate', TEXT_DIRECTION)}>
              {item.subtitle}
            </span>
          )}
        </span>
        {(item.amount !== undefined || item.remaining !== undefined) && (
          <span className="flex shrink-0 flex-col items-end gap-0.5">
            {item.amount !== undefined && (
              <span className="text-sm font-medium whitespace-nowrap text-primary tabular-nums">
                {item.amount}
              </span>
            )}
            {item.remaining !== undefined && (
              <span
                className={cn(
                  'text-xs whitespace-nowrap text-secondary tabular-nums',
                  TEXT_DIRECTION,
                )}
              >
                {item.remaining}
              </span>
            )}
          </span>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div aria-busy="true" className="flex flex-col gap-2 p-4">
        {[0, 1, 2, 3, 4].map((index) => (
          <Skeleton key={index} className="h-12 w-full" />
        ))}
      </div>
    )
  }

  if (items.length === 0) {
    const searching = list.search !== undefined && list.search.trim() !== ''
    return <div className="p-4">{list.empty ?? <EmptyMessage searching={searching} />}</div>
  }

  const { tops, total } = virtual
    ? rowOffsets(items.map(() => MATCHING_ROW_HEIGHT))
    : { tops: [], total: 0 }
  const { first, last } = virtual
    ? visibleRows(tops, total, view.top, view.height)
    : { first: 0, last: items.length }

  return (
    // The pointer is handled on the list (the options are found by their index); the keyboard
    // focus stays on the list, its active option is aria-activedescendant.
    <div
      ref={scroller}
      id={listId}
      role="listbox"
      aria-label={list.title}
      aria-multiselectable={readOnly ? undefined : true}
      aria-readonly={readOnly || undefined}
      aria-describedby={hintId}
      tabIndex={0}
      {...(activeItem === undefined ? {} : { 'aria-activedescendant': optionId(active) })}
      onKeyDown={onKeyDown}
      onFocus={() => {
        if (active < 0 && items.length > 0) setActive(0)
      }}
      onClick={(event) => {
        const element =
          event.target instanceof Element ? event.target.closest('[data-index]') : null
        if (element === null) return
        const index = Number(element.getAttribute('data-index'))
        setActive(index)
        toggle(index)
      }}
      onScroll={(event) => {
        const element = event.currentTarget
        if (virtual) setView({ top: element.scrollTop, height: element.clientHeight })
      }}
      className={cn(
        'group min-w-0 outline-none focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-focus',
        virtual && 'h-120 overflow-y-auto',
      )}
    >
      {virtual ? (
        <div className="relative w-full" style={{ height: total }}>
          {items.slice(first, last).map((item, offset) => {
            const index = first + offset
            return (
              <div
                key={item.id}
                className="absolute inset-x-0 top-0"
                style={{ transform: `translateY(${String(tops[index] ?? 0)}px)` }}
              >
                {option(item, index)}
              </div>
            )
          })}
        </div>
      ) : (
        items.map(option)
      )}
    </div>
  )
}

function EmptyMessage({ searching }: { searching: boolean }) {
  const { messages } = useLiro()
  return searching ? (
    <EmptyState variant="no-results" compact />
  ) : (
    <p className={cn('m-0 py-2 text-sm text-secondary', TEXT_DIRECTION)}>
      {messages['matching.empty']}
    </p>
  )
}

/** One list with its heading, description and search field. */
function ListColumn({
  list,
  heading: HeadingTag,
  showHeading,
  children,
}: {
  list: MatchingList
  heading: Heading
  showHeading: boolean
  children: ReactNode
}) {
  const { messages } = useLiro()
  const search = list.onSearchChange
  return (
    <section aria-label={list.title} className="flex min-w-0 flex-col">
      {(showHeading || list.description !== undefined || search !== undefined) && (
        <div className="flex flex-col gap-2 border-0 border-b border-solid border-subtle px-4 py-3">
          {(showHeading || list.description !== undefined) && (
            <div className="flex flex-col gap-0.5">
              {showHeading && (
                <HeadingTag
                  className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}
                >
                  {list.title}
                </HeadingTag>
              )}
              {list.description !== undefined && (
                <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                  {list.description}
                </span>
              )}
            </div>
          )}
          {search !== undefined && (
            <TextField
              type="search"
              label={messages['matching.search'](list.title)}
              hideLabel
              placeholder={messages['filter.search']}
              value={list.search ?? ''}
              onChange={search}
            />
          )}
        </div>
      )}
      {children}
    </section>
  )
}

/** The active item of a list, kept on the same item when the list changes. */
function useActiveItem(items: readonly MatchingItem[]) {
  const [state, setState] = useState<{ index: number; id: string | undefined }>({
    index: -1,
    id: undefined,
  })
  const ids = items.map((item) => item.id)
  const index = nextActive(state.id, state.index, ids)
  const set = (next: number) => {
    setState({ index: next, id: ids[next] })
  }
  return [index, set] as const
}

/** Two lists matched against each other, with suggestions, matches and a summary. */
export function MatchingView(props: MatchingViewProps) {
  const { messages, format } = useLiro()
  const phone = usePhone()
  const single = props.layout === undefined ? phone : props.layout === 'single'
  const readOnly = props.readOnly === true
  const loading = props.loading === true
  const Heading = `h${String(props.headingLevel ?? 2)}` as Heading
  const hintId = useId()
  const hasHint = !readOnly && props.onMatch !== undefined
  const [shown, setShown] = useState<'left' | 'right'>('left')

  const [leftActive, setLeftActive] = useActiveItem(props.left.items)
  const [rightActive, setRightActive] = useActiveItem(props.right.items)

  const matchable = canMatch(props.left.selected, props.right.selected)
  const match = () => {
    if (!matchable || props.matchUnavailableReason !== undefined) return
    props.onMatch?.([...props.left.selected], [...props.right.selected])
  }
  const clear = () => {
    if (props.left.selected.length > 0) props.left.onSelectedChange([])
    if (props.right.selected.length > 0) props.right.onSelectedChange([])
  }

  const reason =
    props.matchUnavailableReason ?? (matchable ? undefined : messages['matching.selectBoth'])
  const matchAction = { family: 'primary' as const, icon: Link2, label: messages['matching.match'] }
  const bar = (
    <div
      data-slot="matching-bar"
      className={cn(
        'flex flex-wrap items-center justify-between gap-x-6 gap-y-3 rounded-t-lg border-0 border-b border-solid border-default bg-surface-raised px-4 py-3',
        single && 'sticky top-[var(--liro-shell-top,0px)] z-(--liro-layer-sticky)',
      )}
    >
      {props.summary !== undefined && <div className="min-w-0">{props.summary}</div>}
      {hasHint && (
        <div className="ms-auto flex flex-wrap items-center justify-end gap-x-4 gap-y-2">
          {!single && (
            <span id={hintId} className="flex flex-wrap items-center gap-3 text-xs text-secondary">
              <span className="flex items-center gap-1">
                <span className={TEXT_DIRECTION}>{messages['matching.select']}</span>
                <ShortcutHint keys={[messages['matching.spaceKey']]} />
              </span>
              <span className="flex items-center gap-1">
                <span className={TEXT_DIRECTION}>{messages['matching.match']}</span>
                <ShortcutHint keys={[messages['matching.enterKey']]} />
              </span>
              <span className="flex items-center gap-1">
                <span className={TEXT_DIRECTION}>{messages['matching.clear']}</span>
                <ShortcutHint keys={[messages['matching.escapeKey']]} />
              </span>
            </span>
          )}
          {reason === undefined ? (
            <ActionButton
              action={{ ...matchAction, emphasis: 'primary' }}
              onClick={match}
              type="button"
            />
          ) : (
            <UnavailableAction {...matchAction} emphasis="primary" reason={reason} />
          )}
        </div>
      )}
    </div>
  )

  const listBox = (side: 'left' | 'right') => {
    const list = side === 'left' ? props.left : props.right
    return (
      <ListBox
        list={list}
        active={side === 'left' ? leftActive : rightActive}
        setActive={side === 'left' ? setLeftActive : setRightActive}
        readOnly={readOnly}
        loading={loading}
        hintId={hasHint ? hintId : undefined}
        onMatch={match}
        onClear={clear}
      />
    )
  }

  const selectedText = (list: MatchingList) =>
    list.selected.length === 0
      ? list.title
      : `${list.title} · ${messages['bulk.selected'](list.selected.length, format.number(String(list.selected.length)))}`

  const suggestions = props.suggestions ?? []
  const matches = props.matches ?? []

  return (
    <div
      role="region"
      aria-label={props.label}
      data-slot="matching-view"
      data-layout={single ? 'single' : 'split'}
      className={cn(
        'flex min-w-0 flex-col rounded-lg border border-solid border-default bg-surface-raised font-sans text-primary',
        props.className,
      )}
    >
      {bar}
      {suggestions.length > 0 && (
        <section className="border-0 border-b border-solid border-default">
          <Heading
            className={cn('m-0 px-4 pt-3 pb-1 text-sm font-semibold text-primary', TEXT_DIRECTION)}
          >
            {messages['matching.suggestions']}
          </Heading>
          <ul className="m-0 list-none p-0">
            {suggestions.map((suggestion) => (
              <PairRow
                key={suggestion.id}
                left={suggestion.left}
                right={suggestion.right}
                meta={
                  <>
                    <span className={cn('font-medium text-secondary', TEXT_DIRECTION)}>
                      {suggestion.confidence}
                    </span>
                    {suggestion.note !== undefined && (
                      <span className={cn('text-secondary', TEXT_DIRECTION)}>
                        {suggestion.note}
                      </span>
                    )}
                  </>
                }
                actions={
                  readOnly ? null : (
                    <>
                      {props.onDismissSuggestion !== undefined && (
                        <CompactIconButton
                          intent="cancel"
                          label={messages['matching.dismissSuggestion'](suggestion.label)}
                          onClick={() => {
                            props.onDismissSuggestion?.(suggestion.id)
                          }}
                        />
                      )}
                      {props.onAcceptSuggestion !== undefined && (
                        <ActionButton
                          small
                          action={{
                            family: 'neutral',
                            icon: Link2,
                            label: messages['matching.match'],
                          }}
                          aria-label={messages['matching.acceptSuggestion'](suggestion.label)}
                          onClick={() => {
                            props.onAcceptSuggestion?.(suggestion.id)
                          }}
                        />
                      )}
                    </>
                  )
                }
              />
            ))}
          </ul>
        </section>
      )}
      {single ? (
        <div className="flex min-w-0 flex-col">
          <div className="border-0 border-b border-solid border-subtle px-4 py-3">
            <ToggleGroup
              type="single"
              aria-label={messages['matching.showList']}
              value={shown}
              onValueChange={(value) => {
                if (value === 'left' || value === 'right') setShown(value)
              }}
              className="flex w-full"
            >
              <ToggleGroupItem value="left" className="min-w-0 whitespace-normal">
                {selectedText(props.left)}
              </ToggleGroupItem>
              <ToggleGroupItem value="right" className="min-w-0 whitespace-normal">
                {selectedText(props.right)}
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
          <ListColumn
            key={shown}
            list={shown === 'left' ? props.left : props.right}
            heading={Heading}
            showHeading={false}
          >
            {listBox(shown)}
          </ListColumn>
          {/* The keys, for assistive technology (a phone may have a keyboard too). */}
          {hasHint && (
            <span id={hintId} className="sr-only">
              {`${messages['matching.select']}: ${messages['matching.spaceKey']}. ${messages['matching.match']}: ${messages['matching.enterKey']}. ${messages['matching.clear']}: ${messages['matching.escapeKey']}.`}
            </span>
          )}
        </div>
      ) : (
        <div className="grid min-w-0 grid-cols-2">
          <div className="min-w-0 border-0 border-e border-solid border-default">
            <ListColumn list={props.left} heading={Heading} showHeading>
              {listBox('left')}
            </ListColumn>
          </div>
          <ListColumn list={props.right} heading={Heading} showHeading>
            {listBox('right')}
          </ListColumn>
        </div>
      )}
      {matches.length > 0 && (
        <section className="border-0 border-t border-solid border-default">
          <Heading
            className={cn('m-0 px-4 pt-3 pb-1 text-sm font-semibold text-primary', TEXT_DIRECTION)}
          >
            {messages['matching.matched']}
          </Heading>
          <ul className="m-0 list-none p-0">
            {matches.map((matched) => (
              <PairRow
                key={matched.id}
                left={matched.left}
                right={matched.right}
                meta={
                  matched.note === undefined ? null : (
                    <span className={cn('text-secondary', TEXT_DIRECTION)}>{matched.note}</span>
                  )
                }
                actions={
                  readOnly || props.onUnmatch === undefined ? null : (
                    <ActionButton
                      small
                      action={{
                        family: 'neutral',
                        icon: Unlink2,
                        emphasis: 'menu',
                        label: messages['matching.unmatch'],
                      }}
                      aria-label={messages['matching.unmatchItem'](matched.label)}
                      onClick={() => {
                        props.onUnmatch?.(matched.id)
                      }}
                    />
                  )
                }
              />
            ))}
          </ul>
        </section>
      )}
    </div>
  )
}
