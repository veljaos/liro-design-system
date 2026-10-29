import { Bookmark, GitCompare, StickyNote } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { BUTTON_RESET, FOCUS_RING, TEXT_DIRECTION, TEXT_ISOLATE } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { useLiro } from '../provider/liro-provider'
import { Button } from './button'
import { DateText } from './display-text'
import { DropdownMenu } from './dropdown-menu'
import type {
  LegalAct,
  LegalAmendment,
  LegalNote,
  LegalVersion,
  PracticeItem,
  RelatedAct,
} from './legal-model'
import {
  amendmentsFor,
  articleCounts,
  findArticle,
  groupRelatedByType,
  itemsForArticle,
  notesFor,
  otherVersions,
  practiceArticles,
} from './legal-panels-logic'
import { SelectField } from './select-field'
import type { SidePanel } from './side-panels'
import { CURRENT_TONE, StatusBadge } from './status-badge'

/*
 * The side panels of a legal act's page (BUILD-PLAN P5.27 c), as the invoice's panels: each a
 * SidePanel entry for SidePanels (one spacing rule, collapsible, the open keys the
 * application's), the rows drawn as the panel lists (P4.9: 8px above and below, a border.subtle
 * line between rows, `data-slot="panel-row"`, so the panel's first and last rows meet its padding).
 * - **Versions:** every consolidated version, its days ("01.07.2024. – 30.06.2026.", the current
 *   one "From …" with a "Current" tag) and the amending act that produced it ("Original text"
 *   without one). The version shown is the selection — neutral (D17): surface.selected with the
 *   border.selected bar at the start, `aria-current`; a press on another reports it
 *   (`onVersionChange`). "Compare with…" opens a menu of the other versions, newest first
 *   (`onCompare(versionId)`).
 * - **History of changes:** per amending act its name (a link when it has one) and gazette number,
 *   "Published …", "Applies from …", and the articles it changed — the application's words
 *   (`articlesText`) or the articles' labels as links to them.
 * - **Legal hierarchy:** higher acts (the legal basis, with the application's note "Based on
 *   Article 63 of …") and lower acts; **References:** "This act refers to" and "Referred to by",
 *   each grouped by the related act's type. A related act is a row: its type (xs secondary), its
 *   title as a link, its status (StatusBadge, the application's tone), the note under it.
 *   RelatedDocuments was not reused: it writes the number left to right as the link and has no
 *   note line, and an act is named by a title, not a number.
 * - **Court practice and opinions:** issuer as the link, number and date, the summary; filtered by
 *   article with a SelectField ("All articles", then the articles some item concerns, in the act's
 *   order) — controlled (`practiceArticleId`) or not.
 * - **My notes and bookmarks:** each note's kind (icon and word), its article (a link) or "Whole
 *   act", the text and the day; "Add note" reports the article the panel is narrowed to (or none).
 *   Nothing is saved here.
 * - **Narrowed to an article** (`selectedArticleId`): the panels other than Versions keep only
 *   the items whose `articleIds` name it (an item about the whole act names none) — and
 *   `LegalArticleSummary` above them says what concerns it ("Article 57: changed twice, 3 court
 *   decisions, 1 opinion") with "Back to the whole act". The counts are the same lists' lengths.
 * - A panel without items says so in words (`legalPanel.no…`); a panel whose data is not given
 *   (no `practice`, no `notes`) is not shown.
 */

const ROW =
  'flex min-w-0 flex-col gap-0.5 border-0 border-b border-solid border-subtle py-2 last:border-b-0'

/**
 * A link in a panel row: the link colour, underlined on hover, its direction from its text; at
 * least 24px high (WCAG 2.5.8: rows of links stand close together), the text centred in it.
 */
const LINK = cn(
  'flex min-h-6 min-w-0 items-center rounded-sm text-sm font-medium text-link no-underline hover:underline',
  FOCUS_RING,
  TEXT_DIRECTION,
)

function Empty({ children }: { children: ReactNode }) {
  return <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>{children}</p>
}

/** A small heading inside a panel ("Higher acts", "This act refers to", a type). */
function GroupHeading({ children, level }: { children: ReactNode; level: 3 | 4 }) {
  const Heading = `h${String(level)}` as 'h3'
  return (
    <Heading
      className={cn(
        'm-0 pt-2 text-xs',
        level === 3 ? 'font-semibold text-primary' : 'font-medium text-secondary',
        TEXT_DIRECTION,
      )}
    >
      {children}
    </Heading>
  )
}

// ── Versions ────────────────────────────────────────────────────────────────────────────────

/** "01.07.2024. – 30.06.2026.", or "From 01.07.2024." for the version in force. */
export function useVersionRange() {
  const { messages, format } = useLiro()
  return (version: LegalVersion) =>
    messages['legalPanel.versionRange'](
      format.date(version.from),
      version.to === undefined ? undefined : format.date(version.to),
    )
}

function VersionsList({
  act,
  onVersionChange,
  onCompare,
}: {
  act: LegalAct
  onVersionChange?: ((versionId: string) => void) | undefined
  onCompare?: ((versionId: string) => void) | undefined
}) {
  const { messages } = useLiro()
  const range = useVersionRange()
  if (act.versions.length === 0) return <Empty>{messages['legalPanel.noVersions']}</Empty>
  const amendment = (id: string | undefined) =>
    id === undefined ? undefined : act.amendments.find((each) => each.id === id)
  const others = otherVersions(act.versions, act.versionId)
  return (
    <div className="flex flex-col gap-3">
      <ul
        aria-label={messages['legalPanel.versions']}
        className="m-0 flex list-none flex-col gap-1 p-0"
      >
        {act.versions.map((version) => {
          const shown = version.id === act.versionId
          const by = amendment(version.amendmentId)
          return (
            <li key={version.id} className="-mx-2">
              <button
                type="button"
                aria-current={shown ? 'true' : undefined}
                {...(shown ? { 'data-liro-surface': 'selected' } : {})}
                onClick={() => {
                  if (!shown) onVersionChange?.(version.id)
                }}
                className={cn(
                  BUTTON_RESET,
                  'relative box-border flex w-full cursor-pointer flex-col gap-0.5 rounded-md px-2 py-1.5 text-start font-sans',
                  FOCUS_RING,
                  shown
                    ? "bg-surface-selected before:absolute before:inset-y-0 before:start-0 before:rounded-s-md before:border-0 before:border-s-[3px] before:border-solid before:border-selected before:content-['']"
                    : 'hover:bg-surface-hover',
                )}
              >
                <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                  <span
                    className={cn(
                      'text-sm text-primary tabular-nums',
                      shown ? 'font-semibold' : 'font-medium',
                      TEXT_ISOLATE,
                    )}
                  >
                    {range(version)}
                  </span>
                  {version.to === undefined && (
                    <StatusBadge
                      label={messages['legalPanel.current']}
                      tone={CURRENT_TONE}
                      withBorder
                    />
                  )}
                  {version.status !== undefined && (
                    <StatusBadge label={version.status.label} tone={version.status.tone} />
                  )}
                </span>
                <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                  {by?.label ?? messages['legalPanel.original']}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {onCompare !== undefined && others.length > 0 && (
        <div>
          <DropdownMenu
            trigger={
              <Button
                family="neutral"
                icon={GitCompare}
                emphasis="secondary"
                label={messages['legalPanel.compareWith']}
              />
            }
            entries={others.map((version) => ({
              label: range(version),
              onSelect: () => {
                onCompare(version.id)
              },
            }))}
          />
        </div>
      )}
    </div>
  )
}

// ── History of changes ──────────────────────────────────────────────────────────────────────

function ArticleLinks({ act, ids }: { act: LegalAct; ids: readonly string[] }) {
  const { linkComponent: Link } = useLiro()
  const articles = ids
    .map((id) => findArticle(act.nodes, id))
    .filter((article) => article !== undefined)
  return (
    <span className="flex min-w-0 flex-wrap gap-x-3 gap-y-0.5">
      {articles.map((article) => (
        <Link key={article.id} href={article.href} className={cn(LINK, 'font-regular')}>
          {article.label}
        </Link>
      ))}
    </span>
  )
}

function AmendmentRow({ act, amendment }: { act: LegalAct; amendment: LegalAmendment }) {
  const { messages, format, linkComponent: Link } = useLiro()
  return (
    <li data-slot="panel-row" className={ROW}>
      {amendment.href === undefined ? (
        <span className={cn('text-sm font-medium text-primary', TEXT_DIRECTION)}>
          {amendment.label}
        </span>
      ) : (
        <Link href={amendment.href} className={LINK}>
          {amendment.label}
        </Link>
      )}
      <span className={cn('text-xs text-secondary tabular-nums', TEXT_DIRECTION)}>
        {[
          amendment.gazette.label,
          amendment.gazette.published === undefined
            ? undefined
            : messages['legalPanel.published'](format.date(amendment.gazette.published)),
          messages['legalPanel.appliesFrom'](format.date(amendment.appliesFrom)),
        ]
          .filter((part) => part !== undefined)
          .join(' · ')}
      </span>
      <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-sm">
        <span className={cn('text-xs text-secondary', TEXT_ISOLATE)}>
          {messages['legalPanel.changedArticles']}
        </span>
        {amendment.articlesText === undefined ? (
          <ArticleLinks act={act} ids={amendment.articleIds} />
        ) : (
          <span className={cn('text-sm text-primary', TEXT_ISOLATE)}>{amendment.articlesText}</span>
        )}
      </span>
    </li>
  )
}

function HistoryList({
  act,
  amendments,
}: {
  act: LegalAct
  amendments: readonly LegalAmendment[]
}) {
  const { messages } = useLiro()
  if (amendments.length === 0) return <Empty>{messages['legalPanel.noChanges']}</Empty>
  return (
    <ul aria-label={messages['legalPanel.history']} className="m-0 flex list-none flex-col p-0">
      {amendments.map((amendment) => (
        <AmendmentRow key={amendment.id} act={act} amendment={amendment} />
      ))}
    </ul>
  )
}

// ── Related acts (hierarchy, references) ────────────────────────────────────────────────────

function RelatedActRow({ item }: { item: RelatedAct }) {
  const { linkComponent: Link } = useLiro()
  return (
    <li data-slot="panel-row" className={ROW}>
      <span className="flex min-w-0 items-start justify-between gap-3">
        <Link href={item.href} className={LINK}>
          {item.title}
        </Link>
        {item.status !== undefined && (
          <span className="shrink-0">
            <StatusBadge label={item.status.label} tone={item.status.tone} />
          </span>
        )}
      </span>
      {item.note !== undefined && (
        <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>{item.note}</span>
      )}
    </li>
  )
}

/** Related acts under a heading, grouped by type (each type a smaller heading). */
function RelatedGroup({
  title,
  items,
  byType,
}: {
  title: string
  items: readonly RelatedAct[]
  byType: boolean
}) {
  if (items.length === 0) return null
  return (
    <div className="flex flex-col">
      <GroupHeading level={3}>{title}</GroupHeading>
      {byType ? (
        groupRelatedByType(items).map((group) => (
          <div key={group.type} className="flex flex-col">
            <GroupHeading level={4}>{group.type}</GroupHeading>
            <ul aria-label={`${title}: ${group.type}`} className="m-0 flex list-none flex-col p-0">
              {group.items.map((item) => (
                <RelatedActRow key={item.id} item={item} />
              ))}
            </ul>
          </div>
        ))
      ) : (
        <ul aria-label={title} className="m-0 flex list-none flex-col p-0">
          {items.map((item) => (
            <RelatedActRow key={item.id} item={item} />
          ))}
        </ul>
      )}
    </div>
  )
}

/** Two groups of related acts (higher and lower, or refers to and referred by). */
function RelatedPanel({
  groups,
  empty,
  byType,
}: {
  groups: { title: string; items: readonly RelatedAct[] }[]
  empty: string
  byType: boolean
}) {
  if (groups.every((group) => group.items.length === 0)) return <Empty>{empty}</Empty>
  return (
    // The first group's heading meets the panel's 12px gap: its own top padding goes.
    <div className="flex flex-col gap-2 [&>div:first-child>h3]:pt-0">
      {groups.map((group) => (
        <RelatedGroup key={group.title} title={group.title} items={group.items} byType={byType} />
      ))}
    </div>
  )
}

// ── Court practice and opinions ─────────────────────────────────────────────────────────────

function PracticeRow({
  act,
  item,
  showArticles,
}: {
  act: LegalAct
  item: PracticeItem
  showArticles: boolean
}) {
  const { linkComponent: Link } = useLiro()
  const articles = item.articleIds
    .map((id) => findArticle(act.nodes, id)?.label)
    .filter((label) => label !== undefined)
  return (
    <li data-slot="panel-row" className={ROW}>
      <Link href={item.href} className={LINK}>
        {item.issuer}
      </Link>
      <span className="flex min-w-0 flex-wrap items-baseline gap-x-2 text-xs text-secondary">
        {/* A bdi: the number keeps its order in a right-to-left page ("Gž 101/2022"). */}
        <bdi dir="ltr" className="tabular-nums">
          {item.number}
        </bdi>
        <DateText value={item.date} />
        {showArticles && articles.length > 0 && (
          <span className={TEXT_ISOLATE}>{articles.join(', ')}</span>
        )}
      </span>
      <p className={cn('m-0 text-sm text-primary', TEXT_DIRECTION)}>{item.summary}</p>
    </li>
  )
}

function PracticeList({
  act,
  items,
  filter,
}: {
  act: LegalAct
  items: readonly PracticeItem[]
  filter: ReactNode
}) {
  const { messages } = useLiro()
  return (
    <div className="flex flex-col gap-2">
      {filter}
      {items.length === 0 ? (
        <Empty>{messages['legalPanel.noPractice']}</Empty>
      ) : (
        <ul
          aria-label={messages['legalPanel.practice']}
          className="m-0 flex list-none flex-col p-0"
        >
          {items.map((item) => (
            <PracticeRow key={item.id} act={act} item={item} showArticles={filter !== null} />
          ))}
        </ul>
      )}
    </div>
  )
}

// ── Notes and bookmarks ─────────────────────────────────────────────────────────────────────

function NotesList({
  act,
  notes,
  onAdd,
}: {
  act: LegalAct
  notes: readonly LegalNote[]
  onAdd?: (() => void) | undefined
}) {
  const { messages, linkComponent: Link } = useLiro()
  return (
    <div className="flex flex-col gap-2">
      {notes.length === 0 ? (
        <Empty>{messages['legalPanel.noNotes']}</Empty>
      ) : (
        <ul aria-label={messages['legalPanel.notes']} className="m-0 flex list-none flex-col p-0">
          {notes.map((note) => {
            const article =
              note.articleId === undefined ? undefined : findArticle(act.nodes, note.articleId)
            const Icon = note.kind === 'bookmark' ? Bookmark : StickyNote
            return (
              <li key={note.id} data-slot="panel-row" className={ROW}>
                <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-secondary">
                  <Icon aria-hidden="true" className="size-3.5 shrink-0" />
                  <span className={TEXT_ISOLATE}>
                    {note.kind === 'bookmark'
                      ? messages['legalPanel.bookmark']
                      : messages['legalPanel.note']}
                  </span>
                  {article === undefined ? (
                    <span className={TEXT_ISOLATE}>{messages['legalPanel.wholeAct']}</span>
                  ) : (
                    <Link href={article.href} className={cn(LINK, 'text-xs')}>
                      {article.label}
                    </Link>
                  )}
                  <DateText value={note.created} />
                </span>
                {note.text !== undefined && (
                  <p className={cn('m-0 text-sm text-primary', TEXT_DIRECTION)}>{note.text}</p>
                )}
              </li>
            )
          })}
        </ul>
      )}
      {onAdd !== undefined && (
        <div>
          <Button
            family="neutral"
            icon={StickyNote}
            emphasis="secondary"
            label={messages['legalPanel.addNote']}
            onClick={onAdd}
          />
        </div>
      )}
    </div>
  )
}

// ── The panels ──────────────────────────────────────────────────────────────────────────────

/** What the act's side panels show; a panel whose data is not given is left out. */
export interface LegalPanelsOptions {
  act: LegalAct
  /** Higher acts: the legal basis ("Based on Article 63 of …" as `note`). */
  higher?: readonly RelatedAct[]
  /** Lower acts: the by-laws based on this one. */
  lower?: readonly RelatedAct[]
  /** The acts this act refers to. */
  refersTo?: readonly RelatedAct[]
  /** The acts that refer to this one. */
  referredBy?: readonly RelatedAct[]
  /** Court decisions and official opinions on this act. */
  practice?: readonly PracticeItem[]
  /** The user's notes and bookmarks on this act. */
  notes?: readonly LegalNote[]
  /** Narrows the panels to this article (`LegalArticleSummary` says so above them). */
  selectedArticleId?: string | undefined
  /** A press on another version in Versions. */
  onVersionChange?: ((versionId: string) => void) | undefined
  /** "Compare with…" in Versions: the version chosen to compare the shown one with. */
  onCompare?: ((versionId: string) => void) | undefined
  /** The practice filter's article ('' for all), controlled; with its change. */
  practiceArticleId?: string | undefined
  /** The practice filter's first article, uncontrolled. Default '' (all). */
  defaultPracticeArticleId?: string | undefined
  onPracticeArticleChange?: ((articleId: string) => void) | undefined
  /** "Add note": the article the panel is narrowed to, or undefined for the whole act. */
  onAddNote?: ((articleId: string | undefined) => void) | undefined
}

/** The keys of the act's panels, for `panelsOpen`. */
export const LEGAL_PANEL_KEYS = [
  'versions',
  'history',
  'hierarchy',
  'references',
  'practice',
  'notes',
] as const

export type LegalPanelKey = (typeof LEGAL_PANEL_KEYS)[number]

/**
 * The act's side panels as SidePanel entries (keys in `LEGAL_PANEL_KEYS`), titles from messages,
 * counts of what each shows, narrowed to `selectedArticleId` when it is set.
 */
export function useLegalPanels(options: LegalPanelsOptions): SidePanel[] {
  const { messages } = useLiro()
  const [innerArticle, setInnerArticle] = useState(options.defaultPracticeArticleId ?? '')
  const { act, selectedArticleId: selected } = options
  const panels: SidePanel[] = [
    {
      key: 'versions',
      title: messages['legalPanel.versions'],
      count: act.versions.length,
      content: (
        <VersionsList
          act={act}
          onVersionChange={options.onVersionChange}
          onCompare={options.onCompare}
        />
      ),
    },
  ]

  const amendments = amendmentsFor(act.amendments, selected)
  panels.push({
    key: 'history',
    title: messages['legalPanel.history'],
    count: amendments.length,
    content: <HistoryList act={act} amendments={amendments} />,
  })

  if (options.higher !== undefined || options.lower !== undefined) {
    const higher = itemsForArticle(options.higher ?? [], selected)
    const lower = itemsForArticle(options.lower ?? [], selected)
    panels.push({
      key: 'hierarchy',
      title: messages['legalPanel.hierarchy'],
      count: higher.length + lower.length,
      content: (
        <RelatedPanel
          groups={[
            { title: messages['legalPanel.higher'], items: higher },
            { title: messages['legalPanel.lower'], items: lower },
          ]}
          empty={messages['legalPanel.noHierarchy']}
          byType={false}
        />
      ),
    })
  }

  if (options.refersTo !== undefined || options.referredBy !== undefined) {
    const refersTo = itemsForArticle(options.refersTo ?? [], selected)
    const referredBy = itemsForArticle(options.referredBy ?? [], selected)
    panels.push({
      key: 'references',
      title: messages['legalPanel.references'],
      count: refersTo.length + referredBy.length,
      content: (
        <RelatedPanel
          groups={[
            { title: messages['legalPanel.refersTo'], items: refersTo },
            { title: messages['legalPanel.referredBy'], items: referredBy },
          ]}
          empty={messages['legalPanel.noReferences']}
          byType
        />
      ),
    })
  }

  if (options.practice !== undefined) {
    const chosen = options.practiceArticleId ?? innerArticle
    // Narrowed to an article, the panel is that article's: the filter is not shown.
    const articleId = selected ?? (chosen === '' ? undefined : chosen)
    const items = itemsForArticle(options.practice, articleId)
    const choices = practiceArticles(act.nodes, options.practice)
    const filter =
      selected === undefined && choices.length > 0 ? (
        <SelectField
          label={messages['legalPanel.filterByArticle']}
          options={[
            { value: 'all', label: messages['legalPanel.allArticles'] },
            ...choices.map((article) => ({ value: article.id, label: article.label })),
          ]}
          value={chosen === '' ? 'all' : chosen}
          onChange={(value) => {
            const next = value === 'all' ? '' : value
            setInnerArticle(next)
            options.onPracticeArticleChange?.(next)
          }}
        />
      ) : null
    panels.push({
      key: 'practice',
      title: messages['legalPanel.practice'],
      count: items.length,
      content: <PracticeList act={act} items={items} filter={filter} />,
    })
  }

  if (options.notes !== undefined || options.onAddNote !== undefined) {
    const notes = notesFor(options.notes ?? [], selected)
    const onAddNote = options.onAddNote
    panels.push({
      key: 'notes',
      title: messages['legalPanel.notes'],
      count: notes.length,
      content: (
        <NotesList
          act={act}
          notes={notes}
          onAdd={
            onAddNote === undefined
              ? undefined
              : () => {
                  onAddNote(selected)
                }
          }
        />
      ),
    })
  }
  return panels
}

export interface LegalArticleSummaryProps {
  act: LegalAct
  /** The article the panels are narrowed to. */
  articleId: string
  /** The decisions and opinions, for the counts. */
  practice?: readonly PracticeItem[]
  /** "Back to the whole act". */
  onArticleClear?: () => void
  className?: string
}

/**
 * Above the narrowed panels: "Article 57: changed twice, 3 court decisions, 1 opinion" (counts by
 * `format.number`, plurals by the message) and "Back to the whole act".
 */
export function LegalArticleSummary(props: LegalArticleSummaryProps) {
  const { messages, format } = useLiro()
  const article = findArticle(props.act.nodes, props.articleId)
  const counts = articleCounts(props.act, props.practice ?? [], props.articleId)
  const summary = messages['legalPanel.articleSummary'](article?.label ?? props.articleId, counts, {
    changes: format.number(String(counts.changes)),
    decisions: format.number(String(counts.decisions)),
    opinions: format.number(String(counts.opinions)),
  })
  return (
    <div
      data-slot="legal-article-summary"
      className={cn(
        'flex flex-col items-start gap-3 rounded-lg border border-solid border-default bg-surface-raised p-4 font-sans',
        props.className,
      )}
    >
      <p role="status" className={cn('m-0 text-sm font-semibold text-primary', TEXT_DIRECTION)}>
        {summary}
      </p>
      {props.onArticleClear !== undefined && (
        <Button
          intent="back"
          emphasis="secondary"
          label={messages['legalPanel.backToAct']}
          onClick={props.onArticleClear}
        />
      )}
    </div>
  )
}
