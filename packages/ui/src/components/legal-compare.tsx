import { ChevronDown, ChevronUp } from 'lucide-react'
import { Fragment, useId, useMemo, useState, type ReactNode } from 'react'
import { ButtonPrimitive } from '../primitives/button'
import { TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { langAttribute } from '../provider/lang'
import { useLiro } from '../provider/liro-provider'
import {
  compareArticles,
  compareBlocks,
  comparisonCounts,
  latinTag,
  mapLegalText,
  serbianScript,
  transliterateCyrillicToLatin,
  transliterates,
  wordDiff,
  type ArticleComparison,
  type DiffSegment,
} from './legal-logic'
import type { LegalArticle, LegalNode } from './legal-model'
import { StatusBadge } from './status-badge'

/*
 * LegalCompare (BUILD-PLAN P5.27 d, f): two versions of an act, inline, in one column on every
 * width (the decision of P5.27). The library computes the word diff of the texts it is given
 * (`wordDiff`, pure and tested); what changed legally is the application's.
 * - Changed articles only by default ("Show all" shows every article); a run of unchanged articles
 *   between them is one line, "8 unchanged articles", which opens that run.
 * - Inside an article, paragraph by paragraph (items and sub-items too): an insertion underlined,
 *   a deletion struck through — never colour alone — each with a word for assistive technology
 *   before it ("Added:", "Deleted:"), and a visible legend. The success and danger tints only
 *   help the eye.
 * - An article added or deleted whole is labelled ("Added", "Deleted"), a changed one "Changed".
 *   An article the newer version deletes shows its deletion words (the data's "Deleted (…)").
 */

/** One version of the act: its name ("Version of 01.03.2024.") and its text. */
export interface LegalCompareVersion {
  label: string
  nodes: readonly LegalNode[]
}

export interface LegalCompareProps {
  /** The older version. */
  before: LegalCompareVersion
  /** The newer version. */
  after: LegalCompareVersion
  /** Every article (controlled); false shows the changed ones only. */
  showAll?: boolean
  /** Every article at first (uncontrolled). Default false. */
  defaultShowAll?: boolean
  onShowAllChange?: (showAll: boolean) => void
  /** The level of the comparison's title; the articles are one level below. Default 2. */
  headingLevel?: 2 | 3 | 4
  /** The language tag of the text, for `lang` and the transliteration (as LegalText's). */
  lang?: string
  /** The script shown, as LegalText's. */
  script?: 'latin' | 'cyrillic'
  /** Layout classes (width, margins). */
  className?: string
}

/** An insertion: underlined, a success tint. A deletion: struck through, a danger tint. */
const ADDED =
  'rounded-xs bg-status-success-bg text-primary underline decoration-2 underline-offset-2'
const REMOVED = 'rounded-xs bg-status-danger-bg text-secondary line-through decoration-2'

/** The runs of a diff, each change with its word for assistive technology. */
function Segments({ segments }: { segments: readonly DiffSegment[] }) {
  const { messages } = useLiro()
  return (
    <>
      {segments.map((segment, index) =>
        segment.kind === 'same' ? (
          <Fragment key={index}>{segment.text}</Fragment>
        ) : segment.kind === 'added' ? (
          <ins key={index} className={ADDED}>
            <span className="sr-only">{`${messages['legal.addedMark']} `}</span>
            {segment.text}
          </ins>
        ) : (
          <del key={index} className={REMOVED}>
            <span className="sr-only">{`${messages['legal.deletedMark']} `}</span>
            {segment.text}
          </del>
        ),
      )}
    </>
  )
}

/** An article's text as compared: deleted words, as in force (none when it is deleted). */
function inForce(article: LegalArticle | undefined): LegalArticle | undefined {
  return article?.deleted === undefined ? article : { ...article, paragraphs: [] }
}

/** How an article is labelled: an article the newer version deletes reads "Deleted". */
function shownKind(item: ArticleComparison): ArticleComparison['kind'] {
  if (item.after?.deleted !== undefined && item.before?.deleted === undefined) return 'removed'
  if (item.before?.deleted !== undefined && item.after?.deleted === undefined) return 'added'
  return item.kind
}

/** One compared article. */
function ComparedArticle({ item, level }: { item: ArticleComparison; level: number }) {
  const { messages } = useLiro()
  const Tag = `h${String(Math.min(6, level))}` as 'h3'
  const article = item.after ?? item.before
  const kind = shownKind(item)
  const blocks = compareBlocks(inForce(item.before), inForce(item.after))
  const title: ReactNode =
    item.before?.title === item.after?.title ||
    item.before === undefined ||
    item.after === undefined ? (
      article?.title
    ) : (
      <Segments segments={wordDiff(item.before.title ?? '', item.after.title ?? '')} />
    )
  const badge =
    kind === 'same' ? null : (
      <StatusBadge
        label={
          kind === 'added'
            ? messages['legal.added']
            : kind === 'removed'
              ? messages['legal.deleted']
              : messages['legal.changed']
        }
        tone={kind === 'added' ? 'success' : kind === 'removed' ? 'danger' : 'neutral'}
      />
    )
  return (
    <article
      data-legal-compare={item.id}
      data-kind={kind}
      className="flex flex-col gap-2 border-0 border-b border-solid border-subtle py-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <Tag className="m-0 flex min-w-0 flex-col font-semibold">
          <span className={cn('text-sm text-secondary', TEXT_DIRECTION)}>{article?.label}</span>
          {title !== undefined && (
            <span className={cn('text-md text-primary', TEXT_DIRECTION)}>{title}</span>
          )}
        </Tag>
        {badge}
      </div>
      {item.after?.deleted !== undefined && (
        <p className={cn('m-0 text-md text-secondary', TEXT_DIRECTION)}>{item.after.deleted}</p>
      )}
      <div className="flex flex-col gap-2 text-md leading-relaxed text-primary">
        {blocks.map((block) => (
          <p
            key={block.id}
            className={cn('m-0', TEXT_DIRECTION)}
            style={{ paddingInlineStart: block.depth * 24 }}
          >
            {block.label !== undefined && <span className="me-1.5 font-medium">{block.label}</span>}
            <Segments segments={block.segments} />
          </p>
        ))}
      </div>
    </article>
  )
}

/** A run of unchanged articles between the changed ones, folded into one line. */
interface Run {
  kind: 'run'
  id: string
  items: ArticleComparison[]
}

/** Two versions of an act compared inline, article by article. */
export function LegalCompare(props: LegalCompareProps) {
  const { messages, format, locale } = useLiro()
  const titleId = useId()
  const level = props.headingLevel ?? 2
  const Title = `h${String(level)}` as 'h2'
  const [innerShowAll, setInnerShowAll] = useState(props.defaultShowAll ?? false)
  const showAll = props.showAll ?? innerShowAll
  const [openRuns, setOpenRuns] = useState<ReadonlySet<string>>(new Set())

  const script = props.script ?? serbianScript(props.lang) ?? 'latin'
  const latin = transliterates(props.lang, script)
  const comparison = useComparison(props.before.nodes, props.after.nodes, latin)
  const counts = comparisonCounts(comparison.map((item) => ({ ...item, kind: shownKind(item) })))
  const textLang = latin && props.lang !== undefined ? latinTag(props.lang) : props.lang

  // In "changes only", the unchanged articles between changes fold into runs.
  const rows: (ArticleComparison | Run)[] = []
  for (const item of comparison) {
    const last = rows.at(-1)
    if (showAll || item.kind !== 'same') rows.push(item)
    else if (last !== undefined && 'items' in last) last.items.push(item)
    else rows.push({ kind: 'run', id: `run-${item.id}`, items: [item] })
  }
  const number = (count: number) => format.number(String(count))

  return (
    <section
      aria-labelledby={titleId}
      data-slot="legal-compare"
      className={cn('flex min-w-0 max-w-[70ch] flex-col gap-3 font-sans', props.className)}
    >
      <div className="flex flex-col gap-2">
        <Title
          id={titleId}
          className={cn('m-0 text-h3 font-semibold text-primary', TEXT_DIRECTION)}
        >
          {messages['legal.compareTitle'](props.before.label, props.after.label)}
        </Title>
        <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
          {counts.changed + counts.added + counts.removed === 0
            ? messages['legal.noChanges']
            : messages['legal.compareSummary'](
                number(counts.changed),
                number(counts.added),
                number(counts.removed),
              )}
        </p>
        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          <p
            data-slot="legal-compare-legend"
            className="m-0 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm"
          >
            <span className={cn(ADDED, 'px-1', TEXT_ISOLATE)}>{messages['legal.added']}</span>
            <span className={cn(REMOVED, 'px-1', TEXT_ISOLATE)}>{messages['legal.deleted']}</span>
          </p>
          <ButtonPrimitive
            family="neutral"
            emphasis="secondary"
            onClick={() => {
              setInnerShowAll(!showAll)
              props.onShowAllChange?.(!showAll)
            }}
          >
            <span className={TEXT_DIRECTION}>
              {showAll ? messages['legal.showChanges'] : messages['legal.showAll']}
            </span>
          </ButtonPrimitive>
        </div>
      </div>
      <div {...langAttribute(textLang, locale)} className="flex flex-col">
        {rows.map((row) => {
          if (!('items' in row)) {
            return <ComparedArticle key={row.id} item={row} level={level + 1} />
          }
          const open = openRuns.has(row.id)
          const regionId = `${titleId}-${row.id}`
          return (
            <div
              key={row.id}
              className="flex flex-col border-0 border-b border-solid border-subtle py-2"
            >
              <ButtonPrimitive
                family="neutral"
                emphasis="menu"
                aria-expanded={open}
                aria-controls={regionId}
                className="h-7 min-h-7 gap-1.5 self-start px-2 text-sm"
                onClick={() => {
                  setOpenRuns((previous) => {
                    const next = new Set(previous)
                    if (open) next.delete(row.id)
                    else next.add(row.id)
                    return next
                  })
                }}
              >
                {open ? (
                  <ChevronUp aria-hidden="true" className="size-3.5" />
                ) : (
                  <ChevronDown aria-hidden="true" className="size-3.5" />
                )}
                <span className={TEXT_DIRECTION}>
                  {messages['legal.unchanged'](row.items.length, number(row.items.length))}
                </span>
              </ButtonPrimitive>
              {open && (
                <div id={regionId} className="flex flex-col">
                  {row.items.map((item) => (
                    <ComparedArticle key={item.id} item={item} level={level + 1} />
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}

/** The two versions compared, transliterated to Latin first when `latin`. */
function useComparison(
  before: readonly LegalNode[],
  after: readonly LegalNode[],
  latin: boolean,
): ArticleComparison[] {
  return useMemo(() => {
    const shown = (nodes: readonly LegalNode[]) =>
      latin ? mapLegalText(nodes, transliterateCyrillicToLatin) : nodes
    return compareArticles(shown(before), shown(after))
  }, [before, after, latin])
}
