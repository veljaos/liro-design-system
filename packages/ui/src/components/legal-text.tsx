import {
  CalendarClock,
  ChevronDown,
  ChevronUp,
  Ellipsis,
  Eye,
  History,
  Link as LinkIcon,
  Search,
} from 'lucide-react'
import {
  Fragment,
  useCallback,
  useEffect,
  useImperativeHandle,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type ReactNode,
  type Ref,
} from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { AUTO_DIRECTION, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { Input } from '../primitives/input'
import { Popover, PopoverContent, PopoverTrigger } from '../primitives/popover'
import { ToggleGroup, ToggleGroupItem } from '../primitives/toggle-group'
import { langAttribute } from '../provider/lang'
import { useLiro } from '../provider/liro-provider'
import { CompactIconButton, IconButton } from './button'
import { DropdownMenu, type MenuEntry } from './dropdown-menu'
import {
  deletedPart,
  firstReference,
  flattenLegalNodes,
  inlineRunText,
  labelPart,
  LEGAL_ENTRY_ESTIMATE,
  LEGAL_SEARCH_MIN_LENGTH,
  latinTag,
  legalSearchIndex,
  mapArticleText,
  mapFootnotesText,
  mapLegalText,
  markRuns,
  previewSide,
  searchLegalIndex,
  serbianScript,
  stepHit,
  titlePart,
  transliterateCyrillicToLatin,
  transliterates,
  type LegalEntry,
  type LegalSearchHit,
} from './legal-logic'
import type {
  LegalArticle,
  LegalFootnote,
  LegalInline,
  LegalNode,
  LegalParagraph,
  LegalPoint,
  LegalTarget,
} from './legal-model'
import { notice } from './notice'
import { SELECTED_BAR } from './tree-view'
import { usePhone } from './use-phone'
import { useTreeWindow } from './tree-window'
import { spacersBetween } from './virtual-rows'

/*
 * LegalText (BUILD-PLAN P5.27 b): the text of a legal act as the application gives it
 * (`legal-model.ts`), for reading. The library presents it and decides nothing legal.
 * - Reading width: at most 70 characters a line, at the start side. Parts, chapters and sections
 *   are real headings, from `headingLevel` down by depth; an article's label and title are its
 *   heading. Paragraphs with their label ("(1)"), items and sub-items as lists; emphasis; footnote
 *   marks link to the footnotes under the text.
 * - Every article: "Copy link" (the application's `onCopyLink`, else its address on the
 *   clipboard and a "Link copied" toast); its label selects it (`onArticleSelect`: the selection
 *   is surface.selected with the border.selected bar, D17); the application's actions
 *   (`articleActions`: a note, a bookmark) in a menu. Phones: one menu with all of them.
 * - Change marks under the heading, small: "Amended by No. 47/2018 · applies from 01.07.2018."
 *   (neutral) and "Applies from 01.01.2027." for an article not yet in force (premium). Never blue.
 *   A deleted article shows its words ("Deleted (No. 33/2021)") with its earlier text collapsed.
 * - References are links through the provider's `linkComponent`; with `resolveTarget` a 24px
 *   preview button after each opens the target article in a popover (keyboard: Tab to it, Enter;
 *   Escape closes; the popover is not modal, so the focus is never trapped).
 * - Search in the act runs on the data (`legal-logic.ts`), so it also finds articles that are not
 *   drawn: hits marked on status.warning.bg (never a blue fill), the current one also underlined
 *   twice as thick ("3 of 12", Enter / Shift+Enter, previous / next), brought into view.
 * - Serbian: a Latin / Cyrillic switch when the act is Serbian; Cyrillic is shown in Latin by
 *   transliteration (one to one), Latin in Cyrillic is the application's text (`onScriptChange`).
 * - Long acts: with `maxHeight` the text scrolls inside it and only the headings and articles in
 *   view are drawn (TanStack Virtual, the shared rules of `virtual-rows.ts`).
 * - The text carries `lang` when it differs from the page (D15); every block takes its direction
 *   from its content (TEXT_DIRECTION).
 */

/** What a LegalText can be asked to do from outside: the table of contents goes to an entry. */
export interface LegalTextHandle {
  /**
   * Brings a heading or an article into view — drawing it first in a long act — and moves the
   * focus to its heading.
   */
  revealNode: (id: string) => void
}

export interface LegalTextProps {
  /** The act's text: headings and articles, from the application. */
  nodes: readonly LegalNode[]
  /** The act's footnotes, listed under the text. */
  footnotes?: readonly LegalFootnote[]
  /** Names the text for assistive technology: the act's title. */
  label: string
  /** The language tag of the text (`sr-Cyrl`, `sr-Latn`, `en`), for `lang` and the script switch. */
  lang?: string
  /** The level of the outermost headings (a part). Default 2, under the page's h1. */
  headingLevel?: 2 | 3 | 4 | 5
  /** The selected article (the side panel narrows to it), or none. */
  selectedArticleId?: string | null
  /** An article's label was pressed (or "Select" chosen): its id, or null to clear. */
  onArticleSelect?: (id: string | null) => void
  /**
   * "Copy link" was chosen. Without it the library copies the article's address (`href`, made
   * absolute) to the clipboard and confirms with a toast (`notice`; the application mounts the
   * Toaster).
   */
  onCopyLink?: (article: LegalArticle) => void
  /** The application's actions on an article (add a note, bookmark), shown in its menu. */
  articleActions?: (article: LegalArticle) => readonly MenuEntry[]
  /**
   * The article a reference leads to, for its preview. Without it references are links only.
   */
  resolveTarget?: (target: LegalTarget) => LegalArticle | undefined
  /** The reference (its `href`) whose preview stands open at first: a restored state. */
  defaultPreview?: string
  /** The search field above the text. Default true. */
  showSearch?: boolean
  /** The search text (controlled). */
  search?: string
  /** The search text at first (uncontrolled): a restored search. */
  defaultSearch?: string
  onSearchChange?: (text: string) => void
  /** The current hit at first, from 0 (with `defaultSearch`). Default the first. */
  defaultHit?: number
  /** The script the act is shown in (Serbian acts). Default the text's own. */
  script?: 'latin' | 'cyrillic'
  defaultScript?: 'latin' | 'cyrillic'
  /**
   * The script was switched. Cyrillic to Latin the library does itself; for Latin to Cyrillic
   * the application passes the Cyrillic `nodes` and `lang`. Without it, the switch is shown
   * only for a Cyrillic text.
   */
  onScriptChange?: (script: 'latin' | 'cyrillic') => void
  /** Deleted articles whose earlier text stands open at first. */
  defaultShownDeleted?: readonly string[]
  /**
   * The text scrolls inside this height (CSS length, e.g. "70vh") and draws only the headings
   * and articles in view: for long acts (300 articles and more). Not on phones: there the text
   * flows with the page (P5.90).
   */
  maxHeight?: string
  /** 'phone' puts every article action in one menu; default by the viewport (below 48em). */
  layout?: 'desktop' | 'phone'
  /** Layout classes (width, margins). */
  className?: string
  ref?: Ref<LegalTextHandle>
}

/** The scroll margin of an entry brought into view: under the shell's sticky top, 16px air. */
const SCROLL_MARGIN = 'scroll-mt-[calc(var(--liro-shell-top,0px)+16px)]'

/** A hit of the search; the current one also underlined (more than colour). */
const HIT = 'rounded-xs bg-status-warning-bg text-primary'
const CURRENT_HIT = 'underline decoration-2 underline-offset-2'

/** The DOM id of an entry, from the text's own prefix. */
const entryDomId = (prefix: string, id: string) => `${prefix}-${id}`

interface Marks {
  /** The hits of each part, with their index in the whole search. */
  byPart: ReadonlyMap<string, readonly { start: number; end: number; index: number }[]>
  current: number
}

/** A run of text with its hits marked. */
function MarkedText({
  text,
  offset,
  partId,
  marks,
}: {
  text: string
  offset: number
  partId: string
  marks: Marks
}) {
  const ranges = marks.byPart.get(partId)
  if (ranges === undefined) return <>{text}</>
  return (
    <>
      {markRuns(text, offset, ranges).map((run, index) =>
        run.hit === null ? (
          <Fragment key={index}>{run.text}</Fragment>
        ) : (
          <mark
            key={index}
            data-legal-hit={run.hit}
            {...(run.hit === marks.current ? { 'aria-current': true } : {})}
            className={cn(HIT, run.hit === marks.current && CURRENT_HIT)}
          >
            {run.text}
          </mark>
        ),
      )}
    </>
  )
}

/** What the inline runs of a part need from the text around them. */
interface InlineContext {
  marks: Marks
  footnotePrefix: string
  resolveTarget: LegalTextProps['resolveTarget']
  /** Every text of a previewed article through the act's transliteration. */
  mapArticle: (article: LegalArticle) => LegalArticle
  /** The reference (`partId:index`) whose preview stands open at first, until it closes. */
  defaultPreview: string | null
  dismissDefaultPreview: () => void
}

/** A part's runs: text, references (with their preview), emphasis and footnote marks. */
function Inlines({
  content,
  partId,
  context,
}: {
  content: readonly LegalInline[]
  partId: string
  context: InlineContext
}) {
  const { messages } = useLiro()
  // Where each run starts in the part's text (a footnote mark is not part of it).
  const starts = content.reduce<number[]>(
    (list, inline, index) => [...list, (list[index] ?? 0) + inlineRunText(inline).length],
    [0],
  )
  return (
    <>
      {content.map((inline, index) => {
        const at = starts[index] ?? 0
        if (typeof inline === 'string') {
          return (
            <MarkedText
              key={index}
              text={inline}
              offset={at}
              partId={partId}
              marks={context.marks}
            />
          )
        }
        if (inline.kind === 'footnote') {
          return (
            <sup key={index} className="leading-none">
              <a
                href={`#${context.footnotePrefix}-${inline.id}`}
                aria-label={messages['legal.footnote'](inline.mark)}
                className={cn('text-xs text-link', FOCUS_RING)}
              >
                {inline.mark}
              </a>
            </sup>
          )
        }
        const text = (
          <MarkedText text={inline.text} offset={at} partId={partId} marks={context.marks} />
        )
        if (inline.kind === 'emphasis') return <em key={index}>{text}</em>
        return (
          <Reference
            key={index}
            inline={inline}
            context={context}
            restored={context.defaultPreview === `${partId}:${String(index)}`}
            runs={text}
          />
        )
      })}
    </>
  )
}

/** A reference: the link, and with `resolveTarget` its preview button and popover. */
function Reference({
  inline,
  context,
  restored,
  runs,
}: {
  inline: Extract<LegalInline, { kind: 'ref' }>
  context: InlineContext
  /** Its preview stands open at first (`defaultPreview`), without taking the focus. */
  restored: boolean
  runs: ReactNode
}) {
  const { linkComponent: Link, messages } = useLiro()
  const [open, setOpen] = useState(restored)
  const [side, setSide] = useState<'top' | 'bottom'>('bottom')
  const trigger = useRef<HTMLButtonElement>(null)
  const measure = useCallback(() => {
    const box = trigger.current?.getBoundingClientRect()
    if (box !== undefined) setSide(previewSide(box.top, box.bottom, window.innerHeight))
  }, [])
  useLayoutEffect(() => {
    if (restored) measure()
  }, [restored, measure])
  const link = (
    <Link
      href={inline.target.href}
      className={cn(
        'text-link underline decoration-1 underline-offset-2 hover:decoration-2',
        FOCUS_RING,
      )}
    >
      {runs}
    </Link>
  )
  if (context.resolveTarget === undefined) return link
  const found = context.resolveTarget(inline.target)
  const target = found === undefined ? undefined : context.mapArticle(found)
  return (
    <>
      {link}
      <Popover
        open={open}
        onOpenChange={(next) => {
          if (next) measure()
          else if (restored) context.dismissDefaultPreview()
          setOpen(next)
        }}
      >
        <PopoverTrigger asChild>
          <button
            ref={trigger}
            type="button"
            aria-label={messages['legal.preview'](inline.text)}
            data-slot="legal-preview-button"
            className={cn(
              'mx-0.5 -my-1 inline-flex size-6 cursor-pointer items-center justify-center rounded-sm border-0 bg-transparent p-0 align-middle text-secondary hover:bg-surface-hover hover:text-primary',
              FOCUS_RING,
            )}
          >
            <Eye aria-hidden="true" className="size-3.5" />
          </button>
        </PopoverTrigger>
        <PopoverContent
          side={side}
          align="start"
          avoidCollisions={false}
          aria-label={messages['legal.preview'](inline.text)}
          className="flex max-h-(--radix-popover-content-available-height) w-96 flex-col gap-2 overflow-y-auto"
          // A preview restored open does not take the focus from the page.
          onOpenAutoFocus={(event) => {
            if (restored) event.preventDefault()
          }}
        >
          {target === undefined ? (
            <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
              {messages['legal.previewMissing']}
            </p>
          ) : (
            <PreviewArticle article={target} />
          )}
        </PopoverContent>
      </Popover>
    </>
  )
}

/** The target article in a preview: its label, title, paragraphs and a link to it. */
function PreviewArticle({ article }: { article: LegalArticle }) {
  const { linkComponent: Link, messages } = useLiro()
  const plain = (content: readonly LegalInline[]) =>
    content.map((inline, index) =>
      typeof inline === 'string' ? (
        <Fragment key={index}>{inline}</Fragment>
      ) : inline.kind === 'footnote' ? null : (
        <Fragment key={index}>{inline.text}</Fragment>
      ),
    )
  const points = (list: readonly LegalPoint[] | undefined): ReactNode =>
    list === undefined ? null : (
      <ul className="m-0 flex list-none flex-col gap-0.5 ps-4">
        {list.map((point) => (
          <li key={point.id} className={TEXT_DIRECTION}>
            <span className="me-1">{point.label}</span>
            {plain(point.content)}
            {points(point.points)}
          </li>
        ))}
      </ul>
    )
  return (
    <>
      <p className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
        {article.title === undefined ? article.label : `${article.label} · ${article.title}`}
      </p>
      {article.deleted !== undefined && (
        <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>{article.deleted}</p>
      )}
      {article.paragraphs.map((paragraph) => (
        <div key={paragraph.id} className="flex flex-col gap-1 text-sm text-primary">
          <p className={cn('m-0 leading-relaxed', TEXT_DIRECTION)}>
            {paragraph.label !== undefined && <span className="me-1">{paragraph.label}</span>}
            {plain(paragraph.content)}
          </p>
          {points(paragraph.points)}
        </div>
      ))}
      <Link
        href={article.href}
        className={cn('self-start text-sm text-link underline', TEXT_ISOLATE, FOCUS_RING)}
      >
        {messages['legal.open'](article.label)}
      </Link>
    </>
  )
}

/** Items and sub-items as nested lists. */
function Points({ points, context }: { points: readonly LegalPoint[]; context: InlineContext }) {
  return (
    <ol className="m-0 flex list-none flex-col gap-1 p-0 ps-6">
      {points.map((point) => (
        <li key={point.id} className="flex items-baseline gap-2">
          <span className={cn('shrink-0 font-medium', TEXT_ISOLATE)}>{point.label}</span>
          <div className="flex min-w-0 flex-col gap-1">
            <span className={TEXT_DIRECTION}>
              <Inlines content={point.content} partId={point.id} context={context} />
            </span>
            {point.points !== undefined && <Points points={point.points} context={context} />}
          </div>
        </li>
      ))}
    </ol>
  )
}

/** The paragraphs of an article. */
function Paragraphs({
  paragraphs,
  context,
  muted = false,
}: {
  paragraphs: readonly LegalParagraph[]
  context: InlineContext
  muted?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col gap-2 text-md leading-relaxed',
        muted ? 'text-secondary' : 'text-primary',
      )}
    >
      {paragraphs.map((paragraph) => (
        <div key={paragraph.id} className="flex flex-col gap-1">
          <p className={cn('m-0', TEXT_DIRECTION)}>
            {paragraph.label !== undefined && (
              <span className="me-1.5 font-medium">{paragraph.label}</span>
            )}
            <Inlines content={paragraph.content} partId={paragraph.id} context={context} />
          </p>
          {paragraph.points !== undefined && <Points points={paragraph.points} context={context} />}
        </div>
      ))}
    </div>
  )
}

/** A part, chapter or section heading. */
function HeadingEntry({
  entry,
  base,
  domId,
  marks,
}: {
  entry: Extract<LegalEntry, { kind: 'heading' }>
  base: number
  domId: string
  marks: Marks
}) {
  // The outermost level down by depth, h6 at most.
  const Tag = `h${String(Math.min(6, base + entry.depth))}` as 'h3'
  const node = entry.node
  return (
    <Tag
      id={domId}
      tabIndex={-1}
      data-legal-heading=""
      className={cn(
        'm-0 flex flex-col gap-0.5 font-semibold text-primary',
        entry.depth === 0 ? 'text-h3' : entry.depth === 1 ? 'text-h4' : 'text-h5',
        FOCUS_RING,
        SCROLL_MARGIN,
      )}
    >
      <span className={TEXT_DIRECTION}>
        <MarkedText text={node.label} offset={0} partId={labelPart(node.id)} marks={marks} />
      </span>
      {node.title !== undefined && (
        <span className={TEXT_DIRECTION}>
          <MarkedText text={node.title} offset={0} partId={titlePart(node.id)} marks={marks} />
        </span>
      )}
    </Tag>
  )
}

/** An article: heading, actions, change marks, its text (or its deletion). */
function ArticleEntry({
  article,
  depth,
  base,
  domId,
  phone,
  selected,
  shownDeleted,
  onToggleDeleted,
  onSelect,
  onCopyLink,
  actions,
  context,
}: {
  article: LegalArticle
  depth: number
  base: number
  domId: string
  phone: boolean
  selected: boolean
  shownDeleted: boolean
  onToggleDeleted: () => void
  onSelect: ((id: string | null) => void) | undefined
  onCopyLink: (article: LegalArticle) => void
  actions: readonly MenuEntry[]
  context: InlineContext
}) {
  const { messages, format } = useLiro()
  const Tag = `h${String(Math.min(6, base + depth))}` as 'h3'
  const headId = `${domId}-heading`
  const bodyId = `${domId}-body`
  const marks = context.marks
  const label = (
    <MarkedText text={article.label} offset={0} partId={labelPart(article.id)} marks={marks} />
  )
  const withTitle = article.title !== undefined
  const copy: MenuEntry = {
    label: messages['legal.copyLink'](article.label),
    icon: LinkIcon,
    onSelect: () => {
      onCopyLink(article)
    },
  }
  const select: MenuEntry[] =
    onSelect === undefined
      ? []
      : [
          selected
            ? {
                label: messages['legal.clearSelection'],
                onSelect: () => {
                  onSelect(null)
                },
              }
            : {
                label: messages['legal.select'],
                onSelect: () => {
                  onSelect(article.id)
                },
              },
        ]
  const menu: MenuEntry[] = phone
    ? [copy, ...select, ...actions]
    : actions.length > 0
      ? [...select, ...actions]
      : []
  return (
    <article
      id={domId}
      data-legal-node={article.id}
      aria-labelledby={headId}
      {...(selected ? { 'data-liro-surface': 'selected' } : {})}
      className={cn(
        'flex flex-col gap-2 rounded-md px-3 py-3',
        selected && cn('bg-surface-selected', SELECTED_BAR),
        SCROLL_MARGIN,
      )}
    >
      <div className="flex items-start gap-2">
        <Tag
          id={headId}
          tabIndex={-1}
          data-legal-heading=""
          className={cn('m-0 flex min-w-0 flex-1 flex-col font-semibold', FOCUS_RING)}
        >
          {onSelect === undefined ? (
            <span
              className={cn(
                withTitle ? 'text-sm text-secondary' : 'text-md text-primary',
                TEXT_DIRECTION,
              )}
            >
              {label}
            </span>
          ) : (
            <button
              type="button"
              aria-pressed={selected}
              onClick={() => {
                onSelect(selected ? null : article.id)
              }}
              className={cn(
                'm-0 inline-flex min-h-6 cursor-pointer items-center self-start rounded-sm border-0 bg-transparent p-0 font-sans font-semibold hover:underline',
                withTitle ? 'text-sm text-secondary' : 'text-md text-primary',
                FOCUS_RING,
              )}
            >
              <span className={TEXT_DIRECTION}>{label}</span>
            </button>
          )}
          {withTitle && (
            <span className={cn('text-md text-primary', TEXT_DIRECTION)}>
              <MarkedText
                text={article.title ?? ''}
                offset={0}
                partId={titlePart(article.id)}
                marks={marks}
              />
            </span>
          )}
        </Tag>
        <div className="flex shrink-0 items-center gap-1">
          {!phone && (
            <CompactIconButton
              icon={LinkIcon}
              label={messages['legal.copyLink'](article.label)}
              onClick={() => {
                onCopyLink(article)
              }}
            />
          )}
          {menu.length > 0 && (
            <DropdownMenu
              align="end"
              entries={menu}
              trigger={
                <CompactIconButton
                  icon={Ellipsis}
                  label={messages['legal.articleActions'](article.label)}
                />
              }
            />
          )}
        </div>
      </div>
      {(article.changes !== undefined || article.inForceFrom !== undefined) && (
        <ul className="m-0 flex list-none flex-col gap-0.5 p-0 text-xs">
          {article.changes?.map((change) => (
            <li
              key={`${change.amendmentId}-${change.appliesFrom}`}
              className="flex items-start gap-1.5 text-secondary"
            >
              <History aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              <span className={TEXT_DIRECTION}>
                {messages['legal.change'](change.label, format.date(change.appliesFrom))}
              </span>
            </li>
          ))}
          {article.inForceFrom !== undefined && (
            <li className="flex items-start gap-1.5 font-medium text-status-premium-fg">
              <CalendarClock aria-hidden="true" className="mt-px size-3.5 shrink-0" />
              <span className={TEXT_DIRECTION}>
                {messages['legal.appliesFrom'](format.date(article.inForceFrom))}
              </span>
            </li>
          )}
        </ul>
      )}
      {article.deleted !== undefined ? (
        <>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <p className={cn('m-0 text-md text-secondary', TEXT_DIRECTION)}>
              <MarkedText
                text={article.deleted}
                offset={0}
                partId={deletedPart(article.id)}
                marks={marks}
              />
            </p>
            {article.paragraphs.length > 0 && (
              <ButtonPrimitive
                family="neutral"
                emphasis="menu"
                aria-expanded={shownDeleted}
                aria-controls={bodyId}
                onClick={onToggleDeleted}
                className="h-7 min-h-7 gap-1.5 px-2 text-sm"
              >
                {shownDeleted ? (
                  <ChevronUp aria-hidden="true" className="size-3.5" />
                ) : (
                  <ChevronDown aria-hidden="true" className="size-3.5" />
                )}
                <span className={TEXT_DIRECTION}>
                  {shownDeleted ? messages['legal.hideText'] : messages['legal.showText']}
                </span>
              </ButtonPrimitive>
            )}
          </div>
          {shownDeleted && (
            <div id={bodyId} className="border-0 border-s-2 border-solid border-default ps-3">
              <Paragraphs paragraphs={article.paragraphs} context={context} muted />
            </div>
          )}
        </>
      ) : (
        <Paragraphs paragraphs={article.paragraphs} context={context} />
      )}
    </article>
  )
}

/** The act's text and footnotes as shown: transliterated to Latin when `latin`. */
function useShownText(
  nodes: readonly LegalNode[],
  footnotes: readonly LegalFootnote[] | undefined,
  latin: boolean,
) {
  const shownNodes = useMemo(
    () => (latin ? mapLegalText(nodes, transliterateCyrillicToLatin) : nodes),
    [latin, nodes],
  )
  const shownFootnotes = useMemo(
    () =>
      latin ? mapFootnotesText(footnotes ?? [], transliterateCyrillicToLatin) : (footnotes ?? []),
    [latin, footnotes],
  )
  return { nodes: shownNodes, footnotes: shownFootnotes }
}

/** The act prepared once for search and for the window, and the hits of `query`. */
function useSearchable(nodes: readonly LegalNode[], query: string) {
  const index = useMemo(() => legalSearchIndex(nodes), [nodes])
  const hits = useMemo(() => searchLegalIndex(index, query), [index, query])
  const entries = useMemo(() => flattenLegalNodes(nodes), [nodes])
  return { index, hits, entries }
}

/** The hits by part, for marking them where each part is drawn. */
function useMarks(hits: readonly LegalSearchHit[], current: number): Marks {
  return useMemo(() => {
    const byPart = new Map<string, { start: number; end: number; index: number }[]>()
    hits.forEach((hit, at) => {
      const list = byPart.get(hit.partId) ?? []
      list.push({ start: hit.start, end: hit.end, index: at })
      byPart.set(hit.partId, list)
    })
    return { byPart, current }
  }, [hits, current])
}

/** The footnotes' heading, at the level of the outermost headings. */
function FootnotesHeading({ id, level, text }: { id: string; level: number; text: string }) {
  const Tag = `h${String(level)}` as 'h2'
  return (
    <Tag id={id} className={cn('m-0 text-h5 font-semibold text-primary', TEXT_DIRECTION)}>
      {text}
    </Tag>
  )
}

/** The text of a legal act, structured, searchable, with references and change marks. */
export function LegalText({ ref, ...props }: LegalTextProps) {
  const { messages, format, locale } = useLiro()
  const viewportPhone = usePhone()
  const phone = props.layout === undefined ? viewportPhone : props.layout === 'phone'
  const prefix = useId().replaceAll(':', '')
  const base = props.headingLevel ?? 2

  // ── Script ──
  const sourceScript = serbianScript(props.lang)
  const [innerScript, setInnerScript] = useState<'latin' | 'cyrillic'>(
    props.defaultScript ?? sourceScript ?? 'latin',
  )
  const script = props.script ?? innerScript
  const latin = transliterates(props.lang, script)
  const { nodes, footnotes } = useShownText(props.nodes, props.footnotes, latin)
  const textLang = latin && props.lang !== undefined ? latinTag(props.lang) : props.lang
  const showScript =
    sourceScript === 'cyrillic' || (sourceScript === 'latin' && props.onScriptChange !== undefined)

  // ── Search ──
  const [innerSearch, setInnerSearch] = useState(props.defaultSearch ?? '')
  const query = props.search ?? innerSearch
  const { index, hits, entries } = useSearchable(nodes, query)
  const [hitState, setHitState] = useState({ query, current: props.defaultHit ?? 0 })
  const current = hitState.query === query && hitState.current < hits.length ? hitState.current : 0
  const marks = useMarks(hits, current)
  // A deleted article's earlier text stands open while it holds a hit, so every hit counted is
  // shown.
  const hitNodes = new Set(
    hits.flatMap((hit) =>
      hit.partId === labelPart(hit.nodeId) ||
      hit.partId === titlePart(hit.nodeId) ||
      hit.partId === deletedPart(hit.nodeId)
        ? []
        : [hit.nodeId],
    ),
  )

  // ── Entries and the window ──
  // On phones the act flows with the page, never in a box with its own scroll (P5.90 item 5).
  const windowed = props.maxHeight !== undefined && !phone
  const scroller = useRef<HTMLDivElement>(null)
  const [focusIndex, setFocusIndex] = useState<number | null>(null)
  // The trees' row window (tree-window.ts): the rules of virtual-rows.ts, entries measured once
  // drawn (an article is as tall as its text).
  const virtualizer = useTreeWindow({
    count: entries.length,
    scroller,
    rowHeight: LEGAL_ENTRY_ESTIMATE,
    enabled: windowed,
    focusIndex,
    getKey: (at) => entries[at]?.node.id ?? String(at),
  })

  // ── Deleted articles shown, the current hit's always ──
  const [shownDeleted, setShownDeleted] = useState<ReadonlySet<string>>(
    () => new Set(props.defaultShownDeleted ?? []),
  )

  // ── Bringing an entry or the current hit into view ──
  // What is to be brought into view once drawn: an entry (and its heading focused), or the
  // current hit; `index` is the entry's place, for the window to scroll to it first.
  const pending = useRef<{ kind: 'node' | 'hit'; id: string; index: number } | null>(null)
  const [, setTick] = useState(0)
  const reveal = useCallback(
    (kind: 'node' | 'hit', nodeId: string) => {
      const at = entries.findIndex((entry) => entry.node.id === nodeId)
      if (at < 0) return
      pending.current = { kind, id: nodeId, index: at }
      if (windowed) virtualizer.scrollToIndex(at, { align: 'start' })
      setTick((tick) => tick + 1)
    },
    [entries, windowed, virtualizer],
  )
  useLayoutEffect(() => {
    const target = pending.current
    const root = scroller.current
    if (target === null || root === null) return
    const element =
      target.kind === 'hit'
        ? root.querySelector<HTMLElement>(`mark[aria-current]`)
        : root.querySelector<HTMLElement>(`[data-legal-node="${CSS.escape(target.id)}"]`)
    if (element === null) {
      // Not drawn yet (a long act): the window scrolls to it and draws it on a next render.
      if (windowed) virtualizer.scrollToIndex(target.index, { align: 'start' })
      return
    }
    pending.current = null
    element.scrollIntoView({ block: target.kind === 'hit' ? 'center' : 'start' })
    if (target.kind === 'node') {
      const heading = element.matches('[data-legal-heading]')
        ? element
        : element.querySelector<HTMLElement>('[data-legal-heading]')
      heading?.focus({ preventScroll: true })
    }
  })
  useImperativeHandle(
    ref,
    () => ({
      revealNode: (id: string) => {
        reveal('node', id)
      },
    }),
    [reveal],
  )

  // The focused entry stays drawn in a long act (virtual-rows.ts).
  useEffect(() => {
    const element = scroller.current
    if (!windowed || element === null) return
    const onFocusIn = (event: FocusEvent) => {
      const at =
        event.target instanceof Element
          ? event.target.closest('[data-index]')?.getAttribute('data-index')
          : undefined
      setFocusIndex(at === null || at === undefined ? null : Number(at))
    }
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget
      if (!(next instanceof Node) || !element.contains(next)) setFocusIndex(null)
    }
    element.addEventListener('focusin', onFocusIn)
    element.addEventListener('focusout', onFocusOut)
    return () => {
      element.removeEventListener('focusin', onFocusIn)
      element.removeEventListener('focusout', onFocusOut)
    }
  }, [windowed])

  const changeSearch = (text: string) => {
    setInnerSearch(text)
    setHitState({ query: text, current: 0 })
    props.onSearchChange?.(text)
    const first = searchLegalIndex(index, text)[0]
    if (first !== undefined) reveal('hit', first.nodeId)
  }
  const step = (by: 1 | -1) => {
    const next = stepHit(current, hits.length, by)
    const hit = hits[next]
    if (hit === undefined) return
    setHitState({ query, current: next })
    reveal('hit', hit.nodeId)
  }
  const onSearchKey = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') return
    event.preventDefault()
    step(event.shiftKey ? -1 : 1)
  }

  // ── Actions ──
  const copyLink = (article: LegalArticle) => {
    if (props.onCopyLink !== undefined) {
      props.onCopyLink(article)
      return
    }
    const address = new URL(article.href, window.location.href).href
    navigator.clipboard.writeText(address).then(
      () => {
        notice.success(messages['legal.linkCopied'])
      },
      () => {
        notice.error(messages['legal.copyFailed'])
      },
    )
  }
  const [defaultPreview, setDefaultPreview] = useState(() => {
    if (props.defaultPreview === undefined) return null
    const found = firstReference(props.nodes, props.defaultPreview)
    return found === null ? null : `${found.partId}:${String(found.index)}`
  })
  const context: InlineContext = {
    marks,
    footnotePrefix: `${prefix}-fn`,
    resolveTarget: props.resolveTarget,
    mapArticle: (article) =>
      latin ? mapArticleText(article, transliterateCyrillicToLatin) : article,
    defaultPreview,
    dismissDefaultPreview: () => {
      setDefaultPreview(null)
    },
  }

  const draw = (entry: LegalEntry) => {
    const domId = entryDomId(prefix, entry.node.id)
    if (entry.kind === 'heading') {
      return (
        <div className={entry.depth === 0 ? 'pt-6 pb-1' : 'pt-4 pb-1'}>
          <HeadingEntry entry={entry} base={base} domId={domId} marks={marks} />
        </div>
      )
    }
    const article = entry.node
    const shown = shownDeleted.has(article.id) || hitNodes.has(article.id)
    return (
      <div className="py-1">
        <ArticleEntry
          article={article}
          depth={entry.depth}
          base={base}
          domId={domId}
          phone={phone}
          selected={props.selectedArticleId === article.id}
          shownDeleted={shown}
          onToggleDeleted={() => {
            setShownDeleted((previous) => {
              const next = new Set(previous)
              if (shown) next.delete(article.id)
              else next.add(article.id)
              return next
            })
          }}
          onSelect={props.onArticleSelect}
          onCopyLink={copyLink}
          actions={props.articleActions?.(article) ?? []}
          context={context}
        />
      </div>
    )
  }

  const items = windowed ? virtualizer.getVirtualItems() : null
  const spacers = items === null ? null : spacersBetween(items, virtualizer.getTotalSize())

  const countText =
    Array.from(query.trim()).length < LEGAL_SEARCH_MIN_LENGTH
      ? ''
      : hits.length === 0
        ? messages['legal.noHits']
        : messages['legal.hits'](
            current + 1,
            hits.length,
            format.number(String(current + 1)),
            format.number(String(hits.length)),
          )

  const toolbar =
    props.showSearch === false && !showScript ? null : (
      <div
        data-slot="legal-text-toolbar"
        className={cn('flex flex-wrap items-center gap-2', phone && 'flex-col items-stretch')}
      >
        {props.showSearch !== false && (
          <div role="search" className="flex min-w-0 flex-wrap items-center gap-2">
            <div className={cn('relative', phone ? 'w-full' : 'w-72')}>
              <span
                aria-hidden="true"
                className="pointer-events-none absolute inset-y-0 start-0 flex w-9 items-center justify-center text-secondary"
              >
                <Search className="size-3.75" />
              </span>
              <Input
                type="search"
                aria-label={messages['legal.search']}
                placeholder={messages['legal.search']}
                autoComplete="off"
                value={query}
                dir={AUTO_DIRECTION.dir}
                onChange={(event) => {
                  changeSearch(event.target.value)
                }}
                onKeyDown={onSearchKey}
                className={cn('ps-9', AUTO_DIRECTION.className)}
              />
            </div>
            <div className="flex items-center gap-1">
              <IconButton
                family="neutral"
                icon={ChevronUp}
                emphasis="menu"
                label={messages['legal.previousHit']}
                disabled={hits.length === 0}
                onClick={() => {
                  step(-1)
                }}
              />
              <IconButton
                family="neutral"
                icon={ChevronDown}
                emphasis="menu"
                label={messages['legal.nextHit']}
                disabled={hits.length === 0}
                onClick={() => {
                  step(1)
                }}
              />
              <span
                aria-live="polite"
                data-slot="legal-search-count"
                className={cn('min-w-16 text-sm text-secondary tabular-nums', TEXT_DIRECTION)}
              >
                {countText}
              </span>
            </div>
          </div>
        )}
        {showScript && (
          <ToggleGroup
            type="single"
            value={script}
            aria-label={messages['legal.script']}
            className={cn(!phone && 'ms-auto', phone && 'self-start')}
            onValueChange={(value) => {
              if (value !== 'latin' && value !== 'cyrillic') return
              setInnerScript(value)
              props.onScriptChange?.(value)
            }}
          >
            <ToggleGroupItem value="latin">{messages['legal.latin']}</ToggleGroupItem>
            <ToggleGroupItem value="cyrillic">{messages['legal.cyrillic']}</ToggleGroupItem>
          </ToggleGroup>
        )}
      </div>
    )

  const footnoteList =
    footnotes.length === 0 ? null : (
      <section
        aria-labelledby={`${prefix}-footnotes`}
        className="mt-6 flex flex-col gap-2 border-0 border-t border-solid border-default px-3 pt-4"
      >
        <FootnotesHeading
          id={`${prefix}-footnotes`}
          level={base}
          text={messages['legal.footnotes']}
        />
        <ol className="m-0 flex list-none flex-col gap-1 p-0 text-sm text-secondary">
          {footnotes.map((footnote) => (
            <li
              key={footnote.id}
              id={`${prefix}-fn-${footnote.id}`}
              tabIndex={-1}
              className={cn('flex items-baseline gap-2', SCROLL_MARGIN, FOCUS_RING)}
            >
              <span className={cn('shrink-0 font-medium', TEXT_ISOLATE)}>{footnote.mark}</span>
              <span className={TEXT_DIRECTION}>
                <Inlines
                  content={footnote.content}
                  partId={`${footnote.id}#footnote`}
                  context={context}
                />
              </span>
            </li>
          ))}
        </ol>
      </section>
    )

  return (
    <div
      data-slot="legal-text"
      className={cn('flex min-w-0 flex-col gap-3 font-sans', props.className)}
    >
      {toolbar}
      <div
        ref={scroller}
        role="region"
        aria-label={props.label}
        // A long act scrolls in its own box: the box takes the focus to scroll by keyboard.
        {...(windowed ? { tabIndex: 0 } : {})}
        style={windowed ? { maxHeight: props.maxHeight } : undefined}
        className={cn('min-w-0', windowed && cn('overflow-y-auto', FOCUS_RING))}
      >
        <div
          {...langAttribute(textLang, locale)}
          data-slot="legal-text-body"
          className="max-w-[70ch]"
        >
          {items === null || spacers === null
            ? entries.map((entry) => <Fragment key={entry.node.id}>{draw(entry)}</Fragment>)
            : items.map((item, at) => {
                const entry = entries[item.index]
                if (entry === undefined) return null
                const before = spacers.before[at] ?? 0
                return (
                  <Fragment key={item.key}>
                    {before > 0 && <div aria-hidden="true" style={{ height: before }} />}
                    <div data-index={item.index} ref={virtualizer.measureElement}>
                      {draw(entry)}
                    </div>
                  </Fragment>
                )
              })}
          {spacers !== null && spacers.after > 0 && (
            <div aria-hidden="true" style={{ height: spacers.after }} />
          )}
          {footnoteList}
        </div>
      </div>
    </div>
  )
}
