import { Ban, CircleX, TriangleAlert } from 'lucide-react'
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import { foldCatalogText } from './catalog-picker-logic'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { launchpadArrowTarget } from '../templates/launchpad-logic'
import { MoneyText } from './display-text'
import { EmptyState } from './empty-state'
import { FLASH_CLASS, FLASH_TRANSITION, tapFeedback, useFlash } from './pos-feedback'
import { TextField } from './text-field'

/*
 * ProductTile and ProductGrid (BUILD-PLAN P5.10; docs/decisions.md "Touch and POS"). The products
 * a till sells, as large targets for fingers: a tile is a button (at least 112px high) with an
 * optional image slot, the name (wrapping, never cut), a detail line, the price through
 * `format.money` (a decimal string) and the stock state in the application's words. A tile that
 * cannot be sold is `aria-disabled` — still focusable, so its reason is read — on the sunken
 * surface with the reason in words and a Ban icon. No text selection or touch callout on a tile:
 * a long press must not select its name (kiosk-safe).
 *
 * The grid fills the width with 144px-or-wider columns; one tile is in the tab order and the
 * arrows move from the leading edge (`launchpadArrowTarget`), Home and End to the ends.
 * Categories are pressed chips at the start (the neutral selection: surface.selected with a
 * border.selected border, never blue, D17), "All" first; the grid shows the products of the
 * chosen category (`categoryId`).
 *
 * P5.90 (item 20, "ease sells"): every press answers at once — the tile is highlighted briefly
 * (the neutral selection, kept with reduced motion; only the fade goes) and a device that can
 * vibrate gives a short pulse (`tapFeedback`); `inOrder` shows on the tile how many of it the
 * order holds ("2"), so the count going up is seen where the finger is, and its name says it. A
 * product may stand under several categories (`categoryIds`: the application's "Most sold" first,
 * chosen by default). `search` adds a search field above the chips: typing finds products by name
 * or detail in every category (a local filter of the products given, as ComboboxField's).
 */

/** The stock state of a product in the application's words ("12 left", "Sold out"). */
export interface ProductStock {
  /** neutral: plenty; warning: running low; danger: none left. Shown with an icon, never alone. */
  tone: 'neutral' | 'warning' | 'danger'
  text: string
}

export interface ProductTileProps {
  /** The product's name, from the application. */
  name: string
  /** The price, a decimal string. */
  price: string
  /** The currency, from the application. */
  currency: string
  /** A line under the name: the size, the code ("60 g", "PLU 1043"). */
  detail?: string
  /** An image of the product, from the application (an <img> with an empty alt). */
  image?: ReactNode
  stock?: ProductStock
  /** The product cannot be sold now: the reason, shown on the tile. */
  unavailableReason?: string
  /** How many of it the order holds now, a decimal string; shown on the tile while above zero. */
  inOrder?: string
  /** The tile was pressed (not while unavailable). */
  onSelect: () => void
  /** The roving tab index the grid gives; default 0. */
  tabIndex?: number
  /** The grid's arrow keys. */
  onKeyDown?: (event: KeyboardEvent<HTMLButtonElement>) => void
  /** Layout classes. */
  className?: string
}

const STOCK_ICON = { warning: TriangleAlert, danger: CircleX } as const

const STOCK_CLASS = {
  neutral: 'text-secondary',
  warning: 'text-status-warning-fg',
  danger: 'text-status-danger-fg',
} as const

/** One product to sell, pressed to add it. */
export function ProductTile(props: ProductTileProps) {
  const { messages, format } = useLiro()
  const reasonId = useId()
  const countId = useId()
  const [flashing, flash] = useFlash()
  const unavailable = props.unavailableReason !== undefined
  const stock = props.stock
  const StockIcon = stock === undefined || stock.tone === 'neutral' ? null : STOCK_ICON[stock.tone]
  const inOrder =
    props.inOrder !== undefined &&
    /^\d+(\.\d+)?$/.test(props.inOrder) &&
    /[1-9]/.test(props.inOrder)
      ? props.inOrder
      : undefined
  const describedBy = [
    unavailable ? reasonId : undefined,
    inOrder === undefined ? undefined : countId,
  ]
    .filter((id) => id !== undefined)
    .join(' ')
  return (
    <button
      type="button"
      data-slot="product-tile"
      data-flash={flashing.has('tile') || undefined}
      tabIndex={props.tabIndex ?? 0}
      aria-disabled={unavailable || undefined}
      aria-describedby={describedBy === '' ? undefined : describedBy}
      onKeyDown={props.onKeyDown}
      onClick={() => {
        if (unavailable) return
        tapFeedback()
        flash(['tile'])
        props.onSelect()
      }}
      className={cn(
        BUTTON_RESET,
        FOCUS_RING,
        'relative flex min-h-28 w-full min-w-0 cursor-pointer flex-col items-stretch gap-1 rounded-lg border border-solid p-3 text-start select-none touch-manipulation [-webkit-touch-callout:none]',
        unavailable
          ? 'cursor-not-allowed border-transparent bg-surface-sunken text-secondary'
          : cn(
              'border-default text-primary hover:bg-surface-hover active:bg-surface-sunken',
              FLASH_TRANSITION,
              flashing.has('tile') ? cn(FLASH_CLASS, 'border-selected') : 'bg-surface-raised',
            ),
        props.className,
      )}
    >
      {inOrder !== undefined && (
        <>
          {/* Read after the name (the name stays the product's), shown at the corner. */}
          <span id={countId} hidden>
            {messages['pos.inOrder'](format.number(inOrder))}
          </span>
          <span
            aria-hidden="true"
            data-slot="product-tile-count"
            className="absolute -top-2 -end-2 flex min-h-6 min-w-6 items-center justify-center rounded-full border border-solid border-strong bg-surface-raised px-1.5 text-xs font-semibold text-primary tabular-nums"
          >
            {format.number(inOrder)}
          </span>
        </>
      )}
      {props.image !== undefined && (
        <span
          aria-hidden="true"
          className="mb-1 flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-md bg-surface-sunken [&>img]:size-full [&>img]:object-cover"
        >
          {props.image}
        </span>
      )}
      <span className={cn('text-sm font-semibold break-words', TEXT_DIRECTION)}>{props.name}</span>
      {props.detail !== undefined && (
        <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{props.detail}</span>
      )}
      <span className="mt-auto flex flex-wrap items-end justify-between gap-x-2 gap-y-1 pt-1">
        <MoneyText
          value={props.price}
          currency={props.currency}
          className="text-md font-semibold"
        />
        {stock !== undefined && !unavailable && (
          <span className={cn('flex items-center gap-1 text-xs', STOCK_CLASS[stock.tone])}>
            {StockIcon !== null && <StockIcon aria-hidden="true" className="size-3 shrink-0" />}
            <span className={TEXT_DIRECTION}>{stock.text}</span>
          </span>
        )}
      </span>
      {unavailable && (
        <span id={reasonId} className="flex items-start gap-1 text-xs text-secondary">
          <Ban aria-hidden="true" className="mt-px size-3 shrink-0" />
          <span className={TEXT_DIRECTION}>
            {messages['action.unavailable'](props.unavailableReason ?? '')}
          </span>
        </span>
      )}
    </button>
  )
}

/** A product of the grid. */
export interface PosProduct {
  id: string
  name: string
  /** A decimal string. */
  price: string
  detail?: string
  image?: ReactNode
  stock?: ProductStock
  unavailableReason?: string
  /** The category it is shown under; without one it is shown under "All" only. */
  categoryId?: string
  /** Further categories it is also shown under (the application's "Most sold", "Favourites"). */
  categoryIds?: readonly string[]
  /** How many of it the order holds now, a decimal string (`ProductTile` `inOrder`). */
  inOrder?: string
}

/** A category chip. */
export interface ProductCategory {
  id: string
  label: string
}

export interface ProductGridProps {
  products: readonly PosProduct[]
  /** The currency of every price, from the application. */
  currency: string
  /** A product was pressed. */
  onSelect: (id: string) => void
  /** The chips at the start; without them, no chips. */
  categories?: readonly ProductCategory[]
  /** Controlled chosen category; null is "All". */
  category?: string | null
  /** Uncontrolled initial category. Default null ("All"). */
  defaultCategory?: string | null
  onCategoryChange?: (category: string | null) => void
  /** The "All" chip's text. Default: `messages['pos.allProducts']`. */
  allLabel?: string
  /** Above the chips: a ScanField or a search, from the application. */
  toolbar?: ReactNode
  /**
   * A search field above the chips: typing finds products by name or detail in every category
   * (a local filter of `products`). Default false.
   */
  search?: boolean
  /** The search field's label and placeholder. Default: `messages['pos.search']`. */
  searchLabel?: string
  /** Skeleton tiles while the products load. */
  loading?: boolean
  /** The empty state's title. Default: `messages['pos.noProducts']`. */
  emptyTitle?: string
  /** The empty state's text. Default: `messages['pos.noProductsDescription']`. */
  emptyDescription?: string
  /** The region's name. Default: `messages['pos.products']`. */
  label?: string
  className?: string
}

/** The columns of the grid as laid out: the tiles on the first tile's row. */
function columnsOf(tiles: readonly HTMLElement[]): number {
  const top = tiles[0]?.offsetTop
  return Math.max(1, tiles.filter((tile) => tile.offsetTop === top).length)
}

const CHIP =
  'inline-flex min-h-11 cursor-pointer items-center rounded-sm border border-solid px-4 text-sm font-semibold whitespace-nowrap select-none touch-manipulation transition-colors'

/** The products of a till as tiles under category chips, for fingers and the keyboard. */
export function ProductGrid(props: ProductGridProps) {
  const { messages, direction, locale } = useLiro()
  const [innerCategory, setInnerCategory] = useState<string | null>(props.defaultCategory ?? null)
  const category = props.category === undefined ? innerCategory : props.category
  const [active, setActive] = useState(0)
  const [query, setQuery] = useState('')
  const list = useRef<HTMLUListElement>(null)

  const choose = (next: string | null) => {
    setInnerCategory(next)
    setActive(0)
    props.onCategoryChange?.(next)
  }

  const searching = props.search === true && query.trim() !== ''
  const needle = foldCatalogText(query.trim(), locale)
  const shown = searching
    ? props.products.filter((product) =>
        foldCatalogText(`${product.name} ${product.detail ?? ''}`, locale).includes(needle),
      )
    : category === null
      ? props.products
      : props.products.filter(
          (product) => product.categoryId === category || product.categoryIds?.includes(category),
        )
  const current = Math.min(active, Math.max(0, shown.length - 1))

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    const tiles = Array.from(
      list.current?.querySelectorAll<HTMLElement>('[data-slot="product-tile"]') ?? [],
    )
    const index = tiles.indexOf(event.target as HTMLElement)
    if (index === -1) return
    const target = launchpadArrowTarget(event.key, index, tiles.length, columnsOf(tiles), direction)
    if (target === null) return
    event.preventDefault()
    setActive(target)
    tiles[target]?.focus()
  }

  const chip = (id: string | null, text: string) => {
    const pressed = category === id
    return (
      <button
        key={id ?? ''}
        type="button"
        aria-pressed={pressed}
        onClick={() => {
          choose(id)
        }}
        className={cn(
          BUTTON_RESET,
          FOCUS_RING,
          CHIP,
          pressed
            ? 'border-selected bg-surface-selected text-primary'
            : 'border-default bg-surface-raised text-primary hover:bg-surface-hover',
        )}
      >
        <span className={TEXT_DIRECTION}>{text}</span>
      </button>
    )
  }

  return (
    <section
      aria-label={props.label ?? messages['pos.products']}
      data-slot="product-grid"
      className={cn('flex min-w-0 flex-col gap-3 font-sans', props.className)}
    >
      {props.toolbar}
      {props.search === true && (
        <TextField
          type="search"
          label={props.searchLabel ?? messages['pos.search']}
          hideLabel
          placeholder={props.searchLabel ?? messages['pos.search']}
          value={query}
          onChange={(text) => {
            setQuery(text)
            setActive(0)
          }}
        />
      )}
      {props.categories !== undefined && props.categories.length > 0 && !searching && (
        <div role="group" aria-label={messages['pos.categories']} className="flex flex-wrap gap-2">
          {chip(null, props.allLabel ?? messages['pos.allProducts'])}
          {props.categories.map((item) => chip(item.id, item.label))}
        </div>
      )}
      {props.loading === true ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3">
          {Array.from({ length: 8 }, (_, index) => (
            <Skeleton key={index} className="h-28 rounded-lg" />
          ))}
        </div>
      ) : shown.length === 0 ? (
        <EmptyState
          compact
          variant="no-results"
          title={props.emptyTitle ?? messages['pos.noProducts']}
          description={props.emptyDescription ?? messages['pos.noProductsDescription']}
        />
      ) : (
        <ul
          ref={list}
          className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(9rem,1fr))] gap-3 p-0"
        >
          {shown.map((product, index) => (
            <li key={product.id} className="flex min-w-0">
              <ProductTile
                name={product.name}
                price={product.price}
                currency={props.currency}
                tabIndex={index === current ? 0 : -1}
                onKeyDown={onKeyDown}
                onSelect={() => {
                  setActive(index)
                  props.onSelect(product.id)
                }}
                {...(product.detail === undefined ? {} : { detail: product.detail })}
                {...(product.image === undefined ? {} : { image: product.image })}
                {...(product.stock === undefined ? {} : { stock: product.stock })}
                {...(product.unavailableReason === undefined
                  ? {}
                  : { unavailableReason: product.unavailableReason })}
                {...(product.inOrder === undefined ? {} : { inOrder: product.inOrder })}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
