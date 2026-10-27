import { Ban, BadgePercent, Check, ChevronLeft, ChevronRight } from 'lucide-react'
import { useId, useRef, useState, type KeyboardEvent, type ReactNode } from 'react'
import {
  DialogBody,
  DialogCloseButton,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Dialog as DialogRoot,
} from '../primitives/dialog'
import { ButtonPrimitive } from '../primitives/button'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Sheet, SheetContent } from '../primitives/sheet'
import { Skeleton } from '../primitives/skeleton'
import { useLiro } from '../provider/liro-provider'
import { launchpadArrowTarget } from '../templates/launchpad-logic'
import { UnavailableAction } from './actions'
import { Button } from './button'
import { DialogHeading, dialogHeaderClass } from './dialog'
import { MoneyText } from './display-text'
import { EmptyState, ErrorState } from './empty-state'
import { TextField } from './text-field'
import { usePhone } from './use-phone'
import {
  applyCatalogFilters,
  categoryTrail,
  childCategories,
  countBelow,
  itemsDirectlyIn,
  searchCatalog,
  sectionItems,
  shownCount,
  toggleCatalogItem,
  toggleFilter,
  type CatalogCategory,
  type CatalogFilter,
  type CatalogItem,
  type CatalogSection,
} from './catalog-picker-logic'

/*
 * CatalogPicker (P5.90 item 14): choosing from a large catalogue — 50 to 1,500 services,
 * products or courses — where radio buttons do not scale. A dialog on a desktop (720px), a
 * full-screen sheet on phones (D19). From the top down:
 *
 * - **Search** first: typing finds items in every level by name, detail, provider, keywords or
 *   their levels' names; the results show where each stands.
 * - **Filters** as pressed chips (the neutral selection, D17): the application's rules
 *   (`matches`); several pressed all apply, everywhere.
 * - **Sections** at the top level, from data: "Most chosen", "Your recent", "Recommended", "On
 *   discount" — each a short list of cards in the application's order.
 * - **Levels** as a drill-down (Specialist exam → Cardiology → the doctors' services): a level is
 *   a button with its count, a level opened shows "Back to …" and its name, then its own levels
 *   and its items.
 * - **Items as cards** in a listbox: name, detail and who provides it, the price through
 *   `format.money` (the price before a discount struck through, the discount in the
 *   application's words), the reason it cannot be chosen (Ban icon and words, still focusable).
 *   One item: a press chooses it and closes. Several (`multiple`): presses toggle (a check and
 *   the neutral selection), "Choose 2" confirms; whether two items combine is the application's —
 *   it answers by giving the others an `unavailableReason` (`onSelectedChange` reports each
 *   change).
 * - **Keyboard:** Tab reaches the search, the chips, the levels and each list; in a list the
 *   arrows move between cards by the measured columns (from the leading edge), Home and End,
 *   Enter or Space choose.
 * - **Long lists** show 40 cards and "Show more" (paged, not virtualised: a card's height
 *   follows its words); a search narrows first.
 * - **States:** `loading` (skeleton cards), `error` with `onRetry`, nothing in the catalogue,
 *   nothing found (with "Clear search and filters").
 *
 * Computes nothing: prices, discounts, what combines and what is recommended are the
 * application's data.
 *
 * P5.93 (items 4, 5 and 12, the owner's fourth review): the search and the chips stay at the top
 * and only the cards scroll, in a region of their own that ends above the footer with room to
 * spare — nothing floats over them. One choice has no footer at all (the header's X closes it);
 * several end with one opaque footer behind one line: what is chosen, then "Choose 2". A level
 * opened shows a quiet "‹ All services" link back (`topLabel`), not a button. On phones the cards
 * and the levels are one column and a card's price (or the application's words for it) stands
 * under its name, so no word is broken.
 */

export interface CatalogPickerProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The dialog's title: the action ("Choose a service"). */
  title: string
  /** What it is chosen for, bold under the title (D22). */
  subject?: ReactNode
  description?: ReactNode
  items: readonly CatalogItem[]
  /** The levels; without them the items are one list. */
  categories?: readonly CatalogCategory[]
  /** Groups shown first at the top level ("Most chosen", "Your recent"), from the application. */
  sections?: readonly CatalogSection[]
  /** Filter chips, the application's rules. */
  filters?: readonly CatalogFilter[]
  /** The currency of every price, from the application. */
  currency?: string
  /** Several items may be chosen; default one (a press chooses it and closes). */
  multiple?: boolean
  /** Controlled chosen ids. */
  selected?: readonly string[]
  /** Uncontrolled chosen ids when it opens. */
  defaultSelected?: readonly string[]
  /** Each change of the chosen ids (the application then marks what does not combine). */
  onSelectedChange?: (ids: string[]) => void
  /** The choice: the item pressed (one), or the items when "Choose" is pressed (several). */
  onChoose: (ids: string[]) => void
  /** The level open when it opens; default the top. */
  defaultCategory?: string | null
  /** The search as it opens (what was typed in the field it was opened from). */
  initialQuery?: string
  /** How a count of items is written ("12 services"). Default: `messages['catalog.count']`. */
  countLabel?: (count: number, countText: string) => string
  /** The search field's label. Default: `messages['catalog.search']`. */
  searchLabel?: string
  /** The top level's name, in the link back to it ("All services"). Default: `messages['catalog.top']`. */
  topLabel?: string
  /** The items are loading: skeleton cards. */
  loading?: boolean
  /** The catalogue could not be loaded: the application's words. */
  error?: string
  /** "Try again" after an error. */
  onRetry?: () => void
  /** 'phone' forces the full-screen sheet; default by the viewport (48em). */
  layout?: 'desktop' | 'phone'
}

/** The catalogue in a dialog (a full-screen sheet on phones): search, filters, levels, cards. */
export function CatalogPicker(props: CatalogPickerProps) {
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const Root = phone ? Sheet : DialogRoot
  return (
    <Root open={props.open} onOpenChange={props.onOpenChange}>
      {props.open && <PickerBody {...props} phone={phone} />}
    </Root>
  )
}

/** The content, mounted while open, so each opening starts at its level with an empty search. */
function PickerBody(props: CatalogPickerProps & { phone: boolean }) {
  const { messages, format, locale } = useLiro()
  const descriptionId = useId()
  const listsId = useId()
  const search = useRef<HTMLDivElement>(null)
  const categories = props.categories ?? []
  const multiple = props.multiple === true
  const [query, setQuery] = useState(props.initialQuery ?? '')
  const [pressed, setPressed] = useState<string[]>([])
  const [level, setLevel] = useState<string | null>(props.defaultCategory ?? null)
  const [pages, setPages] = useState(1)
  const [innerSelected, setInnerSelected] = useState<readonly string[]>(props.defaultSelected ?? [])
  const selected = props.selected ?? innerSelected
  const count = (value: number) =>
    (props.countLabel ?? messages['catalog.count'])(value, format.number(String(value)))
  const topLabel = props.topLabel ?? messages['catalog.top']
  /** One column on phones (P5.93 item 5): the layout follows the picker, not the viewport. */
  const grid = props.phone ? 'grid-cols-1' : 'grid-cols-2'

  const filtered = applyCatalogFilters(props.items, props.filters ?? [], pressed)
  const searching = query.trim() !== ''
  const found = searching ? searchCatalog(filtered, categories, query, locale) : []
  const trail = categoryTrail(categories, level)
  const current = trail.at(-1)
  const parent = trail.at(-2)
  const levels = searching
    ? []
    : childCategories(categories, level).filter(
        (each) => countBelow(categories, filtered, each.id) > 0 || pressed.length === 0,
      )
  const here = searching ? found : itemsDirectlyIn(filtered, level)
  const sections =
    searching || level !== null
      ? []
      : (props.sections ?? [])
          .map((section) => ({ section, items: sectionItems(filtered, section) }))
          .filter((each) => each.items.length > 0)
  const shown = shownCount(here.length, pages)

  const goTo = (next: string | null) => {
    setLevel(next)
    setPages(1)
  }
  const press = (item: CatalogItem) => {
    const next = toggleCatalogItem(selected, item, multiple)
    if (!multiple) {
      if (next.length === 0 || item.unavailableReason !== undefined) return
      props.onSelectedChange?.(next)
      props.onChoose(next)
      props.onOpenChange(false)
      return
    }
    setInnerSelected(next)
    props.onSelectedChange?.(next)
  }
  const clearAll = () => {
    setQuery('')
    setPressed([])
  }
  const focusSearch = (event: Event) => {
    event.preventDefault()
    search.current?.querySelector('input')?.focus()
  }

  const nothingAtAll = props.items.length === 0
  const nothingHere = here.length === 0 && levels.length === 0 && sections.length === 0
  const chosenNames = selected.flatMap((id) => {
    const item = props.items.find((each) => each.id === id)
    return item === undefined ? [] : [item.name]
  })

  const content = (
    <div className="flex min-w-0 flex-col gap-4" id={listsId}>
      {props.loading === true ? (
        <div className={cn('grid gap-2', grid)}>
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-20 rounded-md" />
          ))}
        </div>
      ) : props.error !== undefined ? (
        <ErrorState
          compact
          description={props.error}
          {...(props.onRetry === undefined
            ? {}
            : { action: { label: messages['catalog.retry'], onClick: props.onRetry } })}
        />
      ) : nothingAtAll ? (
        <EmptyState compact title={messages['catalog.empty']} />
      ) : (
        <>
          {!searching && current !== undefined && (
            <div className="flex flex-col items-start gap-1">
              {/* A quiet link back up, not a button (P5.93 item 4). */}
              <button
                type="button"
                data-slot="catalog-back"
                aria-label={messages['catalog.back'](parent?.label ?? topLabel)}
                onClick={() => {
                  goTo(parent?.id ?? null)
                }}
                className={cn(
                  BUTTON_RESET,
                  FOCUS_RING,
                  'inline-flex min-h-6 cursor-pointer items-center gap-1 rounded-sm text-sm text-link hover:underline',
                )}
              >
                <ChevronLeft aria-hidden="true" className="size-4 shrink-0 rtl:-scale-x-100" />
                <span className={TEXT_DIRECTION}>{parent?.label ?? topLabel}</span>
              </button>
              <h3 className={cn('m-0 text-h3 text-primary', TEXT_DIRECTION)}>{current.label}</h3>
              {current.description !== undefined && (
                <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
                  {current.description}
                </p>
              )}
            </div>
          )}
          {searching && (
            <p role="status" className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
              {messages['catalog.found'](found.length, format.number(String(found.length)))}
            </p>
          )}
          {sections.map(({ section, items }) => (
            <section key={section.id} className="flex flex-col gap-2">
              <h3 className={cn('m-0 text-h4 text-primary', TEXT_DIRECTION)}>{section.label}</h3>
              <CardList
                phone={props.phone}
                label={section.label}
                items={items}
                selected={selected}
                multiple={multiple}
                currency={props.currency}
                categories={categories}
                showLevel
                onPress={press}
              />
            </section>
          ))}
          {levels.length > 0 && (
            <section className="flex flex-col gap-2">
              {sections.length > 0 && (
                <h3 className={cn('m-0 text-h4 text-primary', TEXT_DIRECTION)}>
                  {messages['catalog.levels']}
                </h3>
              )}
              <ul
                aria-label={current?.label ?? messages['catalog.levels']}
                className={cn('m-0 grid list-none gap-2 p-0', grid)}
              >
                {levels.map((each) => (
                  <li key={each.id} className="flex min-w-0">
                    <button
                      type="button"
                      data-slot="catalog-level"
                      onClick={() => {
                        goTo(each.id)
                      }}
                      className={cn(
                        BUTTON_RESET,
                        FOCUS_RING,
                        'flex min-h-14 w-full min-w-0 cursor-pointer items-center gap-3 rounded-md border border-solid border-default bg-surface-raised px-4 py-3 text-start text-primary hover:bg-surface-hover',
                      )}
                    >
                      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className={cn('text-md font-semibold break-words', TEXT_DIRECTION)}>
                          {each.label}
                        </span>
                        {each.description !== undefined && (
                          <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                            {each.description}
                          </span>
                        )}
                      </span>
                      <span className={cn('shrink-0 text-xs text-secondary', TEXT_ISOLATE)}>
                        {count(countBelow(categories, filtered, each.id))}
                      </span>
                      <ChevronRight
                        aria-hidden="true"
                        className="size-4 shrink-0 text-secondary rtl:-scale-x-100"
                      />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
          {here.length > 0 && (
            <section className="flex flex-col gap-2">
              {!searching && (sections.length > 0 || levels.length > 0) && (
                <h3 className={cn('m-0 text-h4 text-primary', TEXT_DIRECTION)}>
                  {current?.label ?? topLabel}
                </h3>
              )}
              <CardList
                phone={props.phone}
                label={searching ? messages['catalog.results'] : (current?.label ?? topLabel)}
                items={here.slice(0, shown)}
                selected={selected}
                multiple={multiple}
                currency={props.currency}
                categories={categories}
                showLevel={searching}
                onPress={press}
              />
              {shown < here.length && (
                <div>
                  <ButtonPrimitive
                    family="neutral"
                    emphasis="secondary"
                    onClick={() => {
                      setPages((value) => value + 1)
                    }}
                  >
                    <span className={TEXT_DIRECTION}>
                      {messages['catalog.showMore'](
                        format.number(String(shown)),
                        format.number(String(here.length)),
                      )}
                    </span>
                  </ButtonPrimitive>
                </div>
              )}
            </section>
          )}
          {nothingHere && (
            <EmptyState
              compact
              variant="no-results"
              {...(searching || pressed.length > 0
                ? { action: { label: messages['catalog.clear'], onClick: clearAll } }
                : {})}
            />
          )}
        </>
      )}
    </div>
  )

  const head = (
    <>
      <DialogHeader className={dialogHeaderClass(props.subject)}>
        <DialogTitle>
          <DialogHeading title={props.title} subject={props.subject} />
        </DialogTitle>
        <DialogCloseButton label={messages['dialog.close']} />
      </DialogHeader>
      <DialogBody className="flex min-h-0 flex-1 flex-col gap-4 pb-0">
        {props.description !== undefined && (
          <DialogDescription id={descriptionId}>{props.description}</DialogDescription>
        )}
        <div ref={search} className="flex flex-col gap-3">
          <TextField
            type="search"
            label={props.searchLabel ?? messages['catalog.search']}
            hideLabel
            placeholder={props.searchLabel ?? messages['catalog.search']}
            value={query}
            onChange={(text) => {
              setQuery(text)
              setPages(1)
            }}
          />
          {props.filters !== undefined && props.filters.length > 0 && (
            <div
              role="group"
              aria-label={messages['catalog.filters']}
              className="flex flex-wrap gap-2"
            >
              {props.filters.map((filter) => {
                const on = pressed.includes(filter.id)
                return (
                  <button
                    key={filter.id}
                    type="button"
                    aria-pressed={on}
                    onClick={() => {
                      setPressed((value) => toggleFilter(value, filter.id))
                      setPages(1)
                    }}
                    className={cn(
                      BUTTON_RESET,
                      FOCUS_RING,
                      'inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full border border-solid px-3 text-sm font-medium whitespace-nowrap',
                      on
                        ? 'border-selected bg-surface-selected text-primary'
                        : 'border-default bg-surface-raised text-primary hover:bg-surface-hover',
                    )}
                  >
                    {on && <Check aria-hidden="true" className="size-3.5 shrink-0" />}
                    <span className={TEXT_DIRECTION}>{filter.label}</span>
                  </button>
                )
              })}
            </div>
          )}
        </div>
        {/* Only the cards scroll, above the footer, with room under the last (P5.93 item 4):
            the search and the chips stay; nothing is drawn over the cards. The 4px inset keeps
            a card's focus ring inside the region. */}
        <div
          data-slot="catalog-lists"
          className="-mx-1 min-h-0 flex-1 overflow-y-auto px-1 pt-1 pb-4 [scrollbar-width:thin]"
        >
          {content}
        </div>
      </DialogBody>
      {multiple && (
        <DialogFooter className="flex-nowrap items-center border-0 border-t border-solid border-default bg-surface-overlay px-4 py-3">
          <p className={cn('m-0 min-w-0 flex-1 text-sm text-secondary', TEXT_DIRECTION)}>
            {chosenNames.length === 0
              ? messages['catalog.noneChosen']
              : messages['catalog.chosen'](chosenNames.join(', '))}
          </p>
          {selected.length === 0 ? (
            <UnavailableAction
              family="primary"
              emphasis="primary"
              icon={Check}
              label={messages['catalog.choose'](0, format.number('0'))}
              reason={messages['catalog.noneChosen']}
            />
          ) : (
            <Button
              family="primary"
              emphasis="primary"
              icon={Check}
              label={messages['catalog.choose'](
                selected.length,
                format.number(String(selected.length)),
              )}
              onClick={() => {
                props.onChoose([...selected])
                props.onOpenChange(false)
              }}
            />
          )}
        </DialogFooter>
      )}
    </>
  )

  const describedBy = props.description === undefined ? undefined : descriptionId
  if (props.phone) {
    return (
      <SheetContent
        side="full"
        aria-describedby={describedBy}
        onOpenAutoFocus={focusSearch}
        data-slot="catalog-picker"
        className="pb-[env(safe-area-inset-bottom)]"
      >
        {head}
      </SheetContent>
    )
  }
  return (
    <DialogContent
      aria-describedby={describedBy}
      onOpenAutoFocus={focusSearch}
      data-slot="catalog-picker"
      className="w-180"
    >
      {head}
    </DialogContent>
  )
}

/** The columns of a list as laid out: the cards on the first card's row. */
function columnsOf(cards: readonly HTMLElement[]): number {
  const top = cards[0]?.offsetTop
  return Math.max(1, cards.filter((card) => card.offsetTop === top).length)
}

/** Items as cards in a listbox: one tab stop, the arrows by the measured columns. */
function CardList(props: {
  /** One column, the price under the name (P5.93 items 5 and 12). */
  phone: boolean
  label: string
  items: readonly CatalogItem[]
  selected: readonly string[]
  multiple: boolean
  currency: string | undefined
  categories: readonly CatalogCategory[]
  /** Under the name, the levels it stands in (search results, sections). */
  showLevel: boolean
  onPress: (item: CatalogItem) => void
}) {
  const { direction } = useLiro()
  const list = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const current = Math.min(active, Math.max(0, props.items.length - 1))

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>, item: CatalogItem) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      props.onPress(item)
      return
    }
    const cards = Array.from(
      list.current?.querySelectorAll<HTMLElement>('[data-slot="catalog-item"]') ?? [],
    )
    const index = cards.indexOf(event.currentTarget)
    if (index === -1) return
    const target = launchpadArrowTarget(event.key, index, cards.length, columnsOf(cards), direction)
    if (target === null) return
    event.preventDefault()
    setActive(target)
    cards[target]?.focus()
  }

  return (
    <div
      ref={list}
      role="listbox"
      aria-label={props.label}
      aria-multiselectable={props.multiple || undefined}
      className={cn('m-0 grid list-none gap-2 p-0', props.phone ? 'grid-cols-1' : 'grid-cols-2')}
    >
      {props.items.map((item, index) => (
        <CatalogCard
          key={item.id}
          stacked={props.phone}
          item={item}
          chosen={props.selected.includes(item.id)}
          multiple={props.multiple}
          currency={props.currency}
          level={
            props.showLevel
              ? categoryTrail(props.categories, item.categoryId ?? null)
                  .map((each) => each.label)
                  .join(' › ')
              : ''
          }
          tabIndex={index === current ? 0 : -1}
          onKeyDown={(event) => {
            onKeyDown(event, item)
          }}
          onPress={() => {
            setActive(index)
            props.onPress(item)
          }}
        />
      ))}
    </div>
  )
}

function CatalogCard(props: {
  /** The price under the name, not beside it (phones). */
  stacked: boolean
  item: CatalogItem
  chosen: boolean
  multiple: boolean
  currency: string | undefined
  /** The levels it stands in, or empty. */
  level: string
  tabIndex: number
  onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
  onPress: () => void
}) {
  const { messages, format } = useLiro()
  const reasonId = useId()
  const { item } = props
  const unavailable = item.unavailableReason !== undefined
  const facts = [item.detail, item.provider].filter((each) => each !== undefined).join(' · ')
  // The price (or the application's words for it): at the end beside the name on a desktop, under
  // the name on a phone, so neither is squeezed into broken words (P5.93 items 5 and 12).
  const price =
    item.price === undefined && item.priceText === undefined ? null : (
      <span
        className={cn(
          'flex gap-0.5',
          props.stacked
            ? 'flex-wrap items-baseline gap-x-2'
            : 'max-w-[45%] shrink-0 flex-col items-end text-end',
        )}
      >
        {item.price !== undefined && props.currency !== undefined ? (
          <MoneyText
            value={item.price}
            currency={props.currency}
            className="text-md font-semibold text-primary"
          />
        ) : (
          <span className={cn('text-sm font-medium text-primary', TEXT_DIRECTION)}>
            {item.priceText}
          </span>
        )}
        {item.originalPrice !== undefined && props.currency !== undefined && (
          <span className="text-xs text-tertiary">
            <span className="sr-only">
              {messages['catalog.wasPrice'](format.money(item.originalPrice, props.currency))}
            </span>
            <s aria-hidden="true" className={cn('tabular-nums', TEXT_ISOLATE)}>
              {format.money(item.originalPrice, props.currency)}
            </s>
          </span>
        )}
      </span>
    )
  return (
    <div
      role="option"
      data-slot="catalog-item"
      aria-selected={props.chosen}
      aria-disabled={unavailable || undefined}
      aria-describedby={unavailable ? reasonId : undefined}
      tabIndex={props.tabIndex}
      onKeyDown={props.onKeyDown}
      onClick={props.onPress}
      className={cn(
        FOCUS_RING,
        'flex min-h-20 min-w-0 cursor-pointer gap-3 rounded-md border border-solid px-4 py-3 text-start select-none',
        props.chosen
          ? 'border-selected bg-surface-selected'
          : unavailable
            ? 'cursor-not-allowed border-default bg-surface-sunken'
            : 'border-default bg-surface-raised hover:bg-surface-hover',
      )}
    >
      {props.multiple && (
        <span
          aria-hidden="true"
          className={cn(
            'mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-sm border border-solid',
            props.chosen
              ? 'border-transparent bg-brand-solid text-on-accent'
              : 'border-control bg-surface-raised',
          )}
        >
          {props.chosen && <Check strokeWidth={3} className="size-3" />}
        </span>
      )}
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cn(
            'text-md font-semibold break-words',
            unavailable ? 'text-secondary' : 'text-primary',
            TEXT_DIRECTION,
          )}
        >
          {item.name}
        </span>
        {props.level !== '' && (
          <span className={cn('text-xs text-tertiary', TEXT_DIRECTION)}>{props.level}</span>
        )}
        {facts !== '' && (
          <span className={cn('text-sm text-secondary', TEXT_DIRECTION)}>{facts}</span>
        )}
        {props.stacked && price}
        {item.discount !== undefined && !unavailable && (
          <span
            className={cn(
              'flex items-center gap-1 text-xs font-medium text-status-success-fg',
              TEXT_DIRECTION,
            )}
          >
            <BadgePercent aria-hidden="true" className="size-3.5 shrink-0" />
            {item.discount}
          </span>
        )}
        {unavailable && (
          <span id={reasonId} className="flex items-start gap-1 text-xs text-secondary">
            <Ban aria-hidden="true" className="mt-px size-3 shrink-0" />
            <span className={TEXT_DIRECTION}>
              {messages['action.unavailable'](item.unavailableReason ?? '')}
            </span>
          </span>
        )}
      </span>
      {!props.stacked && price}
    </div>
  )
}
