import { Command as CommandPrimitive } from 'cmdk'
import { ArrowDown, ArrowUp, Check, ChevronDown, Columns3 } from 'lucide-react'
import { useId, useState, type ReactNode } from 'react'
import { Button } from '../components/button'
import { KeyValueList, type KeyValueGroup, type KeyValueItem } from '../components/cards'
import { commandMatches } from '../components/command-logic'
import { Drawer } from '../components/dialog'
import { usePhone } from '../components/use-phone'
import { ButtonPrimitive } from '../primitives/button'
import { Checkbox } from '../primitives/checkbox'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '../primitives/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover'
import { useLiro } from '../provider/liro-provider'
import { moveModule } from './launchpad-logic'
import { PageHeader } from './page-header'

/*
 * ListPage, ColumnChooser and QuickPreview (BUILD-PLAN P4.3; the owner's values,
 * docs/decisions.md "List page"):
 * - The page's main action ("New invoice") at the end of a row on the page background; the title
 *   is the page's h1 for screen readers only, because the module tab already names the page
 *   (`titleHidden`, default true; PageHeader). Below them ONE card (the raised surface,
 *   border.default, radius lg, no shadow) holding the saved views as its first row, the FilterBar
 *   (inCard) and the table edge to edge. No other cards. The FilterBar keeps only the list's own
 *   actions (Export, Columns).
 * - Saved views: the card's first row, start-aligned (list filters, not page tabs), the tab look
 *   with the blue line under the active one; the count after the label in xs text.tertiary,
 *   tabular (through `format.number`); the "Save view" slot at the end of the row. The DS only
 *   renders them; the Core stores them. P4.9: on desktop the first five (`visibleViews`) are tabs
 *   and the rest are under "More", whose button names the current view when it is there; on
 *   phones one select "View: All 1.284" lists them with their counts, searchable above 7.
 * - ColumnChooser: a neutral small button "Columns" opening a list of the columns, each with a
 *   checkbox (shown) and 28px move up / move down buttons — no dragging needed (WCAG 2.5.7); the
 *   choice is reported with `onChange`.
 * - QuickPreview: the Drawer from the end (440px): the record's number as the title, a
 *   KeyValueList, then Close and "Open" (primary, the full page) at the bottom. On a list, a click
 *   or Space on a row opens it, Enter opens the full page (DataTable `onRowOpen`).
 */

/** One saved view of a list: a name, an optional count. */
export interface SavedView {
  id: string
  /** From the application ("Unpaid"). */
  label: string
  /** How many records the view holds; shown after the label. */
  count?: number
}

export interface ListPageProps {
  /** The page's title (h1), from the application. */
  title: string
  /**
   * The title for screen readers only, because the active module tab already names the page.
   * Default true (owner, P4.3); false where no tab names the list.
   */
  titleHidden?: boolean
  /** The page's main action at the end of the title row (a Button), the main one last. */
  actions?: ReactNode
  /** The saved views: the card's first row. */
  views?: readonly SavedView[]
  /** The current view's id. */
  view?: string
  onViewChange?: (id: string) => void
  /**
   * Desktop: how many views stand as tabs; the rest are under "More" (P4.9). Default 5
   * (`VISIBLE_VIEWS`). Phones show one select of all views.
   */
  visibleViews?: number
  /** At the end of the views row, e.g. a "Save view" button. */
  saveView?: ReactNode
  /** The FilterBar (with `inCard`). */
  filterBar?: ReactNode
  /** The list: a DataTable (it reaches the card's edges). */
  children: ReactNode
  /** 'desktop' or 'phone' forces one; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
  className?: string
}

/** On phones the view list shows a search field above this many views (as the companies). */
export const VIEW_SEARCH_THRESHOLD = 7

/** Desktop shows this many views as tabs by default; the rest go under "More". */
export const VISIBLE_VIEWS = 5

/**
 * The views shown as tabs and those under "More" (P4.9): the first `visible`, in the
 * application's order; one view more than `visible` is shown as a tab rather than a menu of one.
 * A current view under "More" stays there; the "More" button then names it.
 */
export function splitViews<View extends { id: string }>(
  views: readonly View[],
  visible: number,
): { tabs: View[]; more: View[] } {
  const count = views.length <= visible + 1 ? views.length : Math.max(1, visible)
  return { tabs: views.slice(0, count), more: views.slice(count) }
}

const VIEW_TAB =
  'm-0 box-border flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-t-md border-0 border-b-2 border-solid border-transparent bg-transparent px-4 font-sans text-sm leading-none whitespace-nowrap text-primary hover:border-default hover:bg-surface-hover'

/** A view's count after its name, through the provider's format. */
function ViewCount({ count }: { count: number | undefined }) {
  const { format } = useLiro()
  if (count === undefined) return null
  return <span className="text-xs text-tertiary tabular-nums">{format.number(String(count))}</span>
}

interface SavedViewsProps {
  views: readonly SavedView[]
  view?: string
  onViewChange?: (id: string) => void
  saveView?: ReactNode
  visible: number
}

/**
 * Desktop: the first views as a row of tab-like buttons (the current one pressed), the rest in a
 * "More" menu whose button takes the current view's name when that view is in it.
 */
function SavedViewTabs(props: SavedViewsProps) {
  const { messages } = useLiro()
  const { tabs, more } = splitViews(props.views, props.visible)
  const hiddenCurrent = more.find((view) => view.id === props.view)
  return (
    <div className="flex items-end gap-4 border-0 border-b border-solid border-default px-4">
      <div
        role="group"
        aria-label={messages['list.views']}
        className="-mb-px flex min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]"
      >
        {tabs.map((view) => {
          const current = view.id === props.view
          return (
            <button
              key={view.id}
              type="button"
              aria-pressed={current}
              onClick={() => props.onViewChange?.(view.id)}
              className={cn(
                VIEW_TAB,
                current && 'border-brand hover:border-brand',
                FOCUS_RING,
                '-outline-offset-2',
              )}
            >
              <span className={TEXT_DIRECTION}>{view.label}</span>
              <ViewCount count={view.count} />
            </button>
          )
        })}
        {more.length > 0 && (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                aria-pressed={hiddenCurrent !== undefined}
                className={cn(
                  VIEW_TAB,
                  hiddenCurrent !== undefined && 'border-brand hover:border-brand',
                  FOCUS_RING,
                  '-outline-offset-2',
                )}
              >
                <span className={TEXT_DIRECTION}>
                  {hiddenCurrent?.label ?? messages['list.moreViews']}
                </span>
                {hiddenCurrent !== undefined && <ViewCount count={hiddenCurrent.count} />}
                <ChevronDown aria-hidden="true" className="size-3.5 shrink-0 text-secondary" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="min-w-50 shadow-md">
              <DropdownMenuRadioGroup
                value={props.view ?? ''}
                onValueChange={(id) => props.onViewChange?.(id)}
              >
                {more.map((view) => (
                  <DropdownMenuRadioItem key={view.id} value={view.id} check>
                    <span className={cn('min-w-0 flex-1', TEXT_DIRECTION)}>{view.label}</span>
                    <ViewCount count={view.count} />
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      {props.saveView !== undefined && (
        <div className="flex shrink-0 items-center self-center">{props.saveView}</div>
      )}
    </div>
  )
}

/**
 * Phones: one select-like button "View: All 1.284" opening the views with their counts, the
 * current one checked; a search field above them when there are more than 7.
 */
function SavedViewSelect(props: SavedViewsProps) {
  const { messages, locale } = useLiro()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const current = props.views.find((view) => view.id === props.view)
  const searchable = props.views.length > VIEW_SEARCH_THRESHOLD
  const shown = searchable
    ? props.views.filter((view) => commandMatches({ label: view.label }, query, locale))
    : props.views
  return (
    <div className="flex items-center gap-2 border-0 border-b border-solid border-default px-2 py-2">
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next)
          if (!next) setQuery('')
        }}
      >
        <PopoverTrigger asChild>
          <ButtonPrimitive
            family="neutral"
            emphasis="menu"
            className="min-w-0 flex-1 justify-start gap-2 px-2 text-sm"
          >
            <span className={cn('min-w-0 truncate font-semibold', TEXT_DIRECTION)}>
              {messages['list.view'](current?.label ?? '')}
            </span>
            {current !== undefined && <ViewCount count={current.count} />}
            <ChevronDown aria-hidden="true" className="size-3.5 shrink-0 text-secondary" />
          </ButtonPrimitive>
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="box-border w-72 max-w-[calc(100vw-32px)] p-1 shadow-md"
        >
          <CommandPrimitive
            shouldFilter={false}
            label={searchable ? messages['list.findView'] : messages['list.views']}
            className="flex flex-col font-sans text-primary"
          >
            {searchable && (
              <CommandPrimitive.Input
                value={query}
                onValueChange={setQuery}
                placeholder={messages['list.findView']}
                className="mb-1 box-border block h-control w-full min-w-0 appearance-none rounded-md border border-solid border-control bg-surface-raised px-3 font-sans text-sm text-primary outline-none placeholder:text-tertiary focus:border-focus"
              />
            )}
            {shown.length === 0 && (
              <p role="status" className="m-0 px-2.5 py-1.5 text-sm text-secondary">
                {messages['field.noResults']}
              </p>
            )}
            <CommandPrimitive.List
              label={messages['list.views']}
              className="max-h-80 overflow-y-auto"
            >
              {shown.map((view) => {
                const isCurrent = view.id === props.view
                return (
                  <CommandPrimitive.Item
                    key={view.id}
                    value={view.id}
                    onSelect={() => {
                      props.onViewChange?.(view.id)
                      setOpen(false)
                      setQuery('')
                    }}
                    {...(isCurrent ? { 'aria-current': 'true' as const } : {})}
                    className="box-border flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-1.5 text-sm text-primary outline-none select-none data-[selected=true]:bg-surface-sunken"
                  >
                    <span aria-hidden="true" className="flex size-3.5 shrink-0 items-center">
                      {isCurrent && <Check className="size-3.5" />}
                    </span>
                    <span
                      className={cn(
                        'min-w-0 flex-1 truncate',
                        TEXT_DIRECTION,
                        isCurrent && 'font-medium',
                      )}
                    >
                      {view.label}
                    </span>
                    <ViewCount count={view.count} />
                  </CommandPrimitive.Item>
                )
              })}
            </CommandPrimitive.List>
          </CommandPrimitive>
        </PopoverContent>
      </Popover>
      {props.saveView !== undefined && (
        <div className="flex shrink-0 items-center">{props.saveView}</div>
      )}
    </div>
  )
}

/**
 * A list of records: the title and the page's main action, then one card with the saved views,
 * the filters and the table.
 */
export function ListPage(props: ListPageProps) {
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const Views = phone ? SavedViewSelect : SavedViewTabs
  return (
    <div
      data-slot="list-page"
      className={cn(
        'mx-auto box-border flex w-full max-w-content flex-col',
        phone ? 'gap-4 p-4' : 'gap-6 p-6',
        props.className,
      )}
    >
      <PageHeader
        title={props.title}
        titleHidden={props.titleHidden ?? true}
        {...(props.actions === undefined ? {} : { actions: props.actions })}
      />
      <section
        aria-label={props.title}
        className="box-border flex min-w-0 flex-col overflow-hidden rounded-lg border border-solid border-default bg-surface-raised"
      >
        {props.views !== undefined && props.views.length > 0 && (
          <Views
            visible={props.visibleViews ?? VISIBLE_VIEWS}
            views={props.views}
            {...(props.view === undefined ? {} : { view: props.view })}
            {...(props.onViewChange === undefined ? {} : { onViewChange: props.onViewChange })}
            {...(props.saveView === undefined ? {} : { saveView: props.saveView })}
          />
        )}
        {props.filterBar}
        {/* The table to the card's edges; on phones the cards 16px inside (DataTable inCard). */}
        <div className="min-w-0">{props.children}</div>
      </section>
    </div>
  )
}

/** One column of the ColumnChooser. */
export interface ChooserColumn {
  id: string
  /** The column's name, from the application. */
  label: string
  visible: boolean
  /** Always shown (the record's number): its checkbox cannot be cleared. */
  required?: boolean
}

export interface ColumnChooserProps {
  /** Every column, in the table's order. */
  columns: readonly ChooserColumn[]
  /** The columns after a change: the new order and visibility. */
  onChange: (columns: ChooserColumn[]) => void
}

/** Show, hide and reorder a list's columns, by keyboard as well as by pointer. */
export function ColumnChooser({ columns, onChange }: ColumnChooserProps) {
  const { messages } = useLiro()
  const titleId = useId()
  const ids = columns.map((column) => column.id)
  const reorder = (id: string, offset: number) => {
    const order = moveModule(ids, id, offset)
    onChange(order.flatMap((each) => columns.filter((column) => column.id === each)))
  }
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button family="neutral" icon={Columns3} label={messages['columns.button']} />
      </PopoverTrigger>
      <PopoverContent
        align="end"
        aria-labelledby={titleId}
        className="box-border flex w-70 flex-col gap-1 p-1 shadow-md"
      >
        <p id={titleId} className="m-0 px-3 py-1.5 text-xs font-semibold text-secondary">
          {messages['columns.title']}
        </p>
        <ul className="m-0 flex list-none flex-col p-0">
          {columns.map((column, index) => {
            const checkboxId = `${titleId}-${column.id}`
            return (
              <li key={column.id} className="flex items-center gap-2 rounded-md px-3 py-1">
                <Checkbox
                  id={checkboxId}
                  checked={column.visible}
                  disabled={column.required === true}
                  onCheckedChange={(checked) => {
                    onChange(
                      columns.map((each) =>
                        each.id === column.id ? { ...each, visible: checked === true } : each,
                      ),
                    )
                  }}
                />
                <label
                  htmlFor={checkboxId}
                  className={cn('min-w-0 flex-1 truncate text-sm text-primary', TEXT_DIRECTION)}
                >
                  {column.label}
                </label>
                <ButtonPrimitive
                  family="neutral"
                  emphasis="menu"
                  shape="compact"
                  aria-label={messages['columns.moveUp'](column.label)}
                  title={messages['columns.moveUp'](column.label)}
                  disabled={index === 0}
                  onClick={() => {
                    reorder(column.id, -1)
                  }}
                >
                  <ArrowUp aria-hidden="true" className="size-4" />
                </ButtonPrimitive>
                <ButtonPrimitive
                  family="neutral"
                  emphasis="menu"
                  shape="compact"
                  aria-label={messages['columns.moveDown'](column.label)}
                  title={messages['columns.moveDown'](column.label)}
                  disabled={index === columns.length - 1}
                  onClick={() => {
                    reorder(column.id, 1)
                  }}
                >
                  <ArrowDown aria-hidden="true" className="size-4" />
                </ButtonPrimitive>
              </li>
            )
          })}
        </ul>
      </PopoverContent>
    </Popover>
  )
}

export interface QuickPreviewProps {
  /** Controlled: the application opens it for a row (click or Space) and closes it. */
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The record's number or name: the drawer's title. */
  title: ReactNode
  /** A line under the title (the customer, a status badge). */
  description?: ReactNode
  /** The record's key information. */
  items?: readonly KeyValueItem[]
  groups?: readonly KeyValueGroup[]
  /** Opens the full page (the application's navigation). */
  onOpenRecord: () => void
  /** Other content under the values. */
  children?: ReactNode
}

/** The record's key information beside the list, with "Open" to its full page. */
export function QuickPreview(props: QuickPreviewProps) {
  const { messages } = useLiro()
  return (
    <Drawer
      side="end"
      open={props.open}
      onOpenChange={props.onOpenChange}
      title={props.title}
      {...(props.description === undefined ? {} : { description: props.description })}
      actions={
        <>
          <Button
            intent="cancel"
            label={messages['dialog.close']}
            onClick={() => {
              props.onOpenChange(false)
            }}
          />
          <Button intent="next" label={messages['preview.open']} onClick={props.onOpenRecord} />
        </>
      }
    >
      {props.groups !== undefined ? (
        <KeyValueList columns={1} groups={props.groups} />
      ) : (
        props.items !== undefined && <KeyValueList columns={1} items={props.items} />
      )}
      {props.children}
    </Drawer>
  )
}
