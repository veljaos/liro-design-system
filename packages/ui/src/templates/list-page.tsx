import { ArrowDown, ArrowUp, Columns3 } from 'lucide-react'
import { useId, type ReactNode } from 'react'
import { Button } from '../components/button'
import { KeyValueList, type KeyValueGroup, type KeyValueItem } from '../components/cards'
import { Drawer } from '../components/dialog'
import { usePhone } from '../components/use-phone'
import { ButtonPrimitive } from '../primitives/button'
import { Checkbox } from '../primitives/checkbox'
import { FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover'
import { useLiro } from '../provider/liro-provider'
import { moveModule } from './launchpad-logic'

/*
 * ListPage, ColumnChooser and QuickPreview (BUILD-PLAN P4.3; the owner's values,
 * docs/decisions.md "List page"):
 * - The page title (h1) and the page's main action ("New invoice") on the page background, the
 *   title at the start and the actions at the end; below them ONE card (the raised surface,
 *   border.default, radius lg, no shadow) holding the saved views as its first row, the FilterBar
 *   (inCard) and the table edge to edge. No other cards. The FilterBar keeps only the list's own
 *   actions (Export, Columns).
 * - Saved views: the card's first row, start-aligned (list filters, not page tabs), the tab look
 *   with the blue line under the active one; the count after the label in xs text.tertiary,
 *   tabular; the "Save view" slot at the end of the row. The DS only renders them; the Core
 *   stores them.
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
  /** The page's main action at the end of the title row (a Button), the main one last. */
  actions?: ReactNode
  /** The saved views: the card's first row. */
  views?: readonly SavedView[]
  /** The current view's id. */
  view?: string
  onViewChange?: (id: string) => void
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

/** The saved views as a row of tab-like buttons; the current one is pressed. */
function SavedViews(props: {
  views: readonly SavedView[]
  view?: string
  onViewChange?: (id: string) => void
  saveView?: ReactNode
}) {
  const { messages, format } = useLiro()
  return (
    <div className="flex items-end gap-4 border-0 border-b border-solid border-default px-4">
      <div
        role="group"
        aria-label={messages['list.views']}
        className="-mb-px flex min-w-0 flex-1 overflow-x-auto [scrollbar-width:none]"
      >
        {props.views.map((view) => {
          const current = view.id === props.view
          return (
            <button
              key={view.id}
              type="button"
              aria-pressed={current}
              onClick={() => props.onViewChange?.(view.id)}
              className={cn(
                'm-0 box-border flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-t-md border-0 border-b-2 border-solid border-transparent bg-transparent px-4 font-sans text-sm leading-none whitespace-nowrap text-primary hover:border-default hover:bg-surface-hover',
                current && 'border-brand hover:border-brand',
                FOCUS_RING,
                '-outline-offset-2',
              )}
            >
              <span className={TEXT_DIRECTION}>{view.label}</span>
              {view.count !== undefined && (
                <span className="text-xs text-tertiary tabular-nums">
                  {format.number(String(view.count))}
                </span>
              )}
            </button>
          )
        })}
      </div>
      {props.saveView !== undefined && (
        <div className="flex shrink-0 items-center self-center">{props.saveView}</div>
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
  return (
    <div
      data-slot="list-page"
      className={cn(
        'mx-auto box-border flex w-full max-w-content flex-col',
        phone ? 'gap-4 p-4' : 'gap-6 p-6',
        props.className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
        <h1 className={cn('m-0 min-w-0 text-h1 text-primary', TEXT_DIRECTION)}>{props.title}</h1>
        {props.actions !== undefined && (
          <div className="flex flex-wrap items-center gap-2">{props.actions}</div>
        )}
      </div>
      <section
        aria-label={props.title}
        className="box-border flex min-w-0 flex-col overflow-hidden rounded-lg border border-solid border-default bg-surface-raised"
      >
        {props.views !== undefined && props.views.length > 0 && (
          <SavedViews
            views={props.views}
            {...(props.view === undefined ? {} : { view: props.view })}
            {...(props.onViewChange === undefined ? {} : { onViewChange: props.onViewChange })}
            {...(props.saveView === undefined ? {} : { saveView: props.saveView })}
          />
        )}
        {props.filterBar}
        {/* The table to the card's edges; on phones the cards stand inside 16px. */}
        <div className={cn('min-w-0', phone && 'p-4')}>{props.children}</div>
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
