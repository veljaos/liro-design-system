import { PanelRight } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  Alert,
  BackButton,
  Button,
  LegalActPage,
  notice,
  PrintLegalAct,
  Toaster,
  useLiro,
  type LegalActPageProps,
  type PageBack,
} from '@veljaos/ui'
import type {
  LegalAct,
  LegalInline,
  LegalNode,
} from '../../../../packages/ui/src/components/legal-model'
import type { ExampleRoute } from './example-app'
import { Navigate, RouterLink, Shell } from './example-shell'
import {
  actRoute,
  articleRoute,
  BY_LAW_HIGHER,
  BY_LAW_PRACTICE,
  byLawVersion,
  GAZETTE,
  ILLUSTRATIVE,
  LAW_CITATION,
  LAW_LOWER,
  LAW_NOTES,
  LAW_PRACTICE,
  LAW_REFERRED_BY,
  LAW_REFERS_TO,
  lawVersion,
  O_ROUTES,
  practiceRoute,
  RULEBOOK_HIGHER,
  RULEBOOK_REFERS_TO,
  rulebookVersion,
  SHORT_ACTS,
  shortActRefersTo,
} from './data-O'

/*
 * Group O's example screens (P5.27, legal information), all invented and labelled
 * "Illustrative": the Law on Illustrative Building Works (three amendments, its by-law, two court
 * decisions and an opinion) on LegalActPage — the whole act, Article 57 chosen with the panels
 * narrowed to it, an older version, and its printout (PrintLegalAct) —, its Rulebook on
 * Illustrative Site Records, Kvadrat Gradnja d.o.o.'s Work Rulebook in its 2025 version with its
 * legal basis, and short pages for the search's other acts, the decisions and the opinion. Every
 * act is at `/legal/acts/<id>`, every article at `/legal/acts/<id>/article-<n>`, the practice at
 * `/legal/practice/<id>` (the search's links, group P). Each screen plays the
 * application: it keeps the version, the chosen article, watching and the bookmark, and answers
 * the actions with a toast.
 *
 * The act's text is drawn by a minimal renderer of this file (`ActText`): the text components of
 * P5.27 (LegalText, its contents drawer, search and compare) replace it when the parts are joined.
 */

export { O_ROUTES }

function Inline({ content }: { content: readonly LegalInline[] }) {
  return (
    <>
      {content.map((part, index) =>
        typeof part === 'string' ? (
          part
        ) : part.kind === 'ref' ? (
          <RouterLink
            key={index}
            href={part.target.href}
            className="rounded-sm text-link underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--liro-border-focus)"
          >
            {part.text}
          </RouterLink>
        ) : part.kind === 'footnote' ? (
          <sup key={index}>{part.mark}</sup>
        ) : (
          <em key={index}>{part.text}</em>
        ),
      )}
    </>
  )
}

/**
 * The act's text, minimal: headings, articles with their paragraphs, items and changes, and a
 * button per article that narrows the panels to it (the stand-in for LegalText's article actions).
 */
function ActText({
  act,
  selected,
  onSelect,
}: {
  act: LegalAct
  selected?: string | undefined
  onSelect: (articleId: string) => void
}) {
  const { format } = useLiro()
  const nodes = (list: readonly LegalNode[], level: number): ReactNode =>
    list.map((node) => {
      const Heading = `h${String(Math.min(level, 6))}` as 'h2'
      if (node.kind === 'heading') {
        return (
          <section key={node.id} className="flex flex-col gap-4">
            <Heading className="bidi-content m-0 text-h3 text-primary">
              {node.label}
              {node.title === undefined ? '' : ` — ${node.title}`}
            </Heading>
            {nodes(node.children, level + 1)}
          </section>
        )
      }
      const chosen = selected === node.id
      return (
        <article
          key={node.id}
          id={node.id}
          {...(chosen ? { 'data-liro-surface': 'selected' } : {})}
          className={
            chosen
              ? 'flex flex-col gap-2 rounded-md border-0 border-s-[3px] border-solid border-selected bg-surface-selected p-3'
              : 'flex flex-col gap-2'
          }
        >
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Heading className="bidi-content m-0 text-h4 text-primary">
              {node.label}
              {node.title === undefined ? '' : ` — ${node.title}`}
            </Heading>
            <span className="contents rtl:[&_svg]:-scale-x-100">
              <Button
                family="neutral"
                emphasis="menu"
                icon={PanelRight}
                label={`Details of ${node.label}`}
                onClick={() => {
                  onSelect(node.id)
                }}
              />
            </span>
          </div>
          {node.changes !== undefined && node.changes.length > 0 && (
            <p className="bidi-content m-0 text-xs text-secondary">
              {node.changes
                .map((change) => `${change.label}, applies from ${format.date(change.appliesFrom)}`)
                .join(' · ')}
            </p>
          )}
          {node.inForceFrom !== undefined && (
            <p className="bidi-content m-0 text-xs font-medium text-status-warning-fg">
              Not yet in force: applies from {format.date(node.inForceFrom)}
            </p>
          )}
          {node.deleted !== undefined ? (
            <p className="bidi-content m-0 text-sm text-secondary italic">{node.deleted}</p>
          ) : (
            node.paragraphs.map((paragraph) => (
              <div key={paragraph.id} className="flex flex-col gap-1">
                <p className="bidi-content m-0 text-md text-primary">
                  {paragraph.label === undefined ? '' : `${paragraph.label} `}
                  <Inline content={paragraph.content} />
                </p>
                {paragraph.points?.map((point) => (
                  <div key={point.id} className="flex flex-col gap-1 ps-6">
                    <p className="bidi-content m-0 text-md text-primary">
                      {point.label} <Inline content={point.content} />
                    </p>
                    {point.points?.map((sub) => (
                      <p key={sub.id} className="bidi-content m-0 ps-6 text-md text-primary">
                        {sub.label} <Inline content={sub.content} />
                      </p>
                    ))}
                  </div>
                ))}
              </div>
            ))
          )}
        </article>
      )
    })
  return <div className="flex max-w-[44rem] flex-col gap-6">{nodes(act.nodes, 2)}</div>
}

/** An article's label ("Article 57") by its id. */
function articleLabel(nodes: readonly LegalNode[], id: string): string | undefined {
  for (const node of nodes) {
    if (node.kind === 'article' && node.id === id) return node.label
    if (node.kind === 'heading') {
      const found = articleLabel(node.children, id)
      if (found !== undefined) return found
    }
  }
  return undefined
}

const LEGAL_CRUMB = { label: 'Legal information', href: `#${O_ROUTES.search}` }
const LEGAL_BACK: PageBack = { href: `#${O_ROUTES.search}`, label: 'Legal information' }

/** What every act page of the examples shares: the actions answered with toasts. */
function useActPage() {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const [watching, setWatching] = useState(false)
  const [bookmarked, setBookmarked] = useState(false)
  const range = (act: LegalAct, versionId: string) => {
    const version = act.versions.find((each) => each.id === versionId)
    return version === undefined ? versionId : `the version from ${format.date(version.from)}`
  }
  return {
    navigate,
    watching,
    bookmarked,
    common: (act: LegalAct) => ({
      watching,
      onWatchChange: (next: boolean) => {
        setWatching(next)
        notice.success(
          next
            ? `You will be told when ${act.title} changes.`
            : `You no longer watch ${act.title}.`,
        )
      },
      bookmarked,
      onBookmarkChange: (next: boolean) => {
        setBookmarked(next)
        notice.success(next ? 'Bookmarked.' : 'Bookmark removed.')
      },
      onCompareVersions: () => {
        notice.info('Comparing the version shown with the one before it.')
      },
      onCompare: (versionId: string) => {
        notice.info(`Comparing the version shown with ${range(act, versionId)}.`)
      },
      onAddNote: (articleId: string | undefined) => {
        notice.info(
          articleId === undefined ? 'A new note on the whole act.' : 'A new note on the article.',
        )
      },
    }),
  }
}

// ── An act's page ─────────────────────────────────────────────────────────────────────────────

type PanelData = Pick<
  LegalActPageProps,
  'higher' | 'lower' | 'refersTo' | 'referredBy' | 'practice' | 'notes' | 'defaultPanelsOpen'
>

/**
 * One act's page as the application shows it: the version and the chosen article kept here, the
 * actions answered with toasts; `print` opens the act's print route.
 */
function ActScreen({
  phone,
  version,
  initialVersion,
  articleId,
  crumb,
  banner = ILLUSTRATIVE,
  citation,
  print,
  panels,
}: {
  phone: boolean
  /** The act as the application gives it for a version. */
  version: (versionId: string) => LegalAct
  initialVersion: string
  articleId?: string | undefined
  crumb: string
  banner?: string
  citation: string
  print?: string
  panels: PanelData
}) {
  const [versionId, setVersionId] = useState(initialVersion)
  const [selected, setSelected] = useState<string | undefined>(articleId)
  const page = useActPage()
  const act = version(versionId)
  return (
    <Shell phone={phone} crumbs={[LEGAL_CRUMB, { label: crumb }]}>
      <LegalActPage
        act={act}
        gazetteName={GAZETTE}
        back={LEGAL_BACK}
        banner={<Alert tone="neutral" title={banner} />}
        layout={phone ? 'phone' : 'desktop'}
        {...page.common(act)}
        onCopyCitation={() => {
          const label = selected === undefined ? undefined : articleLabel(act.nodes, selected)
          notice.success(
            `Citation copied: ${label === undefined ? citation : `${citation}, ${label}`}`,
          )
        }}
        {...(print === undefined
          ? {}
          : {
              onPrint: () => {
                page.navigate(print)
              },
            })}
        onVersionChange={setVersionId}
        {...panels}
        selectedArticleId={selected}
        onArticleClear={() => {
          setSelected(undefined)
        }}
        defaultPanelSheetOpen={phone && articleId !== undefined}
        text={<ActText act={act} selected={selected} onSelect={setSelected} />}
      />
      <Toaster layout={phone ? 'phone' : 'desktop'} />
    </Shell>
  )
}

// ── 1. The Law on Illustrative Building Works ─────────────────────────────────────────────────

export function LawScreen({
  phone,
  articleId,
  initialVersion = 'v4',
}: {
  phone: boolean
  articleId?: string
  initialVersion?: string
}) {
  return (
    <ActScreen
      phone={phone}
      version={lawVersion}
      initialVersion={initialVersion}
      articleId={articleId}
      crumb="Law on Illustrative Building Works"
      citation={LAW_CITATION}
      print={O_ROUTES.lawPrint}
      panels={{
        lower: LAW_LOWER,
        refersTo: LAW_REFERS_TO,
        referredBy: LAW_REFERRED_BY,
        practice: LAW_PRACTICE,
        notes: LAW_NOTES,
        ...(initialVersion === 'v4' ? {} : { defaultPanelsOpen: ['versions', 'history'] }),
      }}
    />
  )
}

// ── 2. The law's printout ─────────────────────────────────────────────────────────────────────

/** The print route: the sheet alone, a bar with Back and Print above it on screen. */
function PrintPreview({
  title,
  back,
  children,
}: {
  title: string
  back: PageBack
  children: ReactNode
}) {
  return (
    <div className="flex min-h-full w-full flex-col bg-surface-sunken font-sans">
      <header className="sticky top-0 z-10 box-border flex items-center gap-3 border-0 border-b border-solid border-default bg-surface-raised px-4 py-2 print:hidden">
        <BackButton back={back} />
        <p className="bidi-content m-0 min-w-0 flex-1 text-sm font-semibold text-primary">
          {title}
        </p>
        <Button
          intent="print"
          label="Print"
          onClick={() => {
            window.print()
          }}
        />
      </header>
      <main className="flex min-w-0 flex-1 flex-col">{children}</main>
    </div>
  )
}

export function LawPrintScreen() {
  const act = lawVersion('v4')
  return (
    <PrintPreview title={act.title} back={{ href: `#${O_ROUTES.law}`, label: act.title }}>
      <PrintLegalAct act={act} gazetteName={GAZETTE} note={ILLUSTRATIVE} />
    </PrintPreview>
  )
}

// ── 3. The by-law, the Work Rulebook and the short pages ──────────────────────────────────────

export function ByLawScreen({ phone, articleId }: { phone: boolean; articleId?: string }) {
  return (
    <ActScreen
      phone={phone}
      version={byLawVersion}
      initialVersion="s2"
      articleId={articleId}
      crumb="Rulebook on Illustrative Site Records"
      citation="Rulebook on Illustrative Site Records (Illustrative Gazette No. 21/2016 and 40/2021)"
      panels={{ higher: BY_LAW_HIGHER, lower: [], practice: BY_LAW_PRACTICE }}
    />
  )
}

export function RulebookScreen({ phone, articleId }: { phone: boolean; articleId?: string }) {
  return (
    <ActScreen
      phone={phone}
      version={rulebookVersion}
      initialVersion="w2"
      articleId={articleId}
      crumb="Work Rulebook"
      banner="Illustrative: an invented internal act of Kvadrat Gradnja d.o.o., based on the illustrative law."
      citation="Kvadrat Gradnja d.o.o. — Work Rulebook (Decision No. 3/2025)"
      panels={{
        higher: RULEBOOK_HIGHER,
        lower: [],
        refersTo: RULEBOOK_REFERS_TO,
        referredBy: [],
        defaultPanelsOpen: ['versions', 'history', 'hierarchy'],
      }}
    />
  )
}

/** A further act, a decision or the opinion: one version, one article, what it concerns. */
function ShortActScreen({ phone, act }: { phone: boolean; act: LegalAct }) {
  return (
    <ActScreen
      phone={phone}
      version={() => act}
      initialVersion={act.versionId}
      crumb={act.title}
      citation={act.title}
      panels={{ refersTo: shortActRefersTo(act.id), referredBy: [] }}
    />
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

/** Every article of an act's text, as routes that open the act narrowed to it. */
function articleRoutes(
  actId: string,
  act: LegalAct,
  render: (phone: boolean, articleId: string) => ReactNode,
): ExampleRoute[] {
  const routes: ExampleRoute[] = []
  const walk = (nodes: readonly LegalNode[]) => {
    for (const node of nodes) {
      if (node.kind === 'heading') walk(node.children)
      else
        routes.push({
          path: articleRoute(actId, node.id.slice(1)),
          render: (phone) => render(phone, node.id),
        })
    }
  }
  walk(act.nodes)
  return routes
}

export const GROUP_O_ROUTES: ExampleRoute[] = [
  { path: O_ROUTES.law, render: (phone) => <LawScreen phone={phone} /> },
  ...articleRoutes('building-works', lawVersion('v4'), (phone, id) => (
    <LawScreen phone={phone} articleId={id} />
  )),
  { path: O_ROUTES.lawVersion, render: (phone) => <LawScreen phone={phone} initialVersion="v2" /> },
  { path: O_ROUTES.lawPrint, render: () => <LawPrintScreen /> },
  { path: O_ROUTES.byLaw, render: (phone) => <ByLawScreen phone={phone} /> },
  ...articleRoutes('site-records', byLawVersion('s2'), (phone, id) => (
    <ByLawScreen phone={phone} articleId={id} />
  )),
  { path: O_ROUTES.rulebook, render: (phone) => <RulebookScreen phone={phone} /> },
  ...articleRoutes('work-rulebook', rulebookVersion('w2'), (phone, id) => (
    <RulebookScreen phone={phone} articleId={id} />
  )),
  ...SHORT_ACTS.map((act) => ({
    path:
      act.type === 'Court decision' || act.type === 'Opinion'
        ? practiceRoute(act.id)
        : actRoute(act.id),
    render: (phone: boolean) => <ShortActScreen phone={phone} act={act} />,
  })),
]
