import { useContext, useRef, useState, type ReactNode } from 'react'
import {
  Alert,
  BackButton,
  Button,
  Card,
  findLegalArticle,
  LegalActPage,
  LegalCompare,
  LegalContents,
  LegalText,
  notice,
  PageHeader,
  PrintLegalAct,
  SelectField,
  Toaster,
  useLiro,
  type LegalActPageProps,
  type LegalTextHandle,
  type PageBack,
} from '@veljaos/ui'
import type { LegalAct, LegalArticle, LegalNode, LegalTarget } from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell } from './example-shell'
import { Frame } from './screens-G'
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
 * The act's text is LegalText (headings, articles, changes, references with their previews, the
 * search in the act) with LegalContents' drawer in the page's toolbar; "Compare versions" and
 * "Compare with…" open the comparison (LegalCompare) of the version shown with another.
 */

export { O_ROUTES }

/** Where a reference leads, among the examples' acts: the article's text for its preview. */
function resolveExampleTarget(target: LegalTarget): LegalArticle | undefined {
  if (target.articleId === undefined) return undefined
  const acts: Record<string, LegalAct> = {
    'building-works': lawVersion('v4'),
    'site-records': byLawVersion('s2'),
    'work-rulebook': rulebookVersion('w2'),
  }
  for (const act of SHORT_ACTS) acts[act.id] = act
  const act = acts[target.actId ?? 'building-works']
  return act === undefined ? undefined : findLegalArticle(act.nodes, target.articleId)
}

/**
 * The act's text on its page: LegalText with the contents drawer in the page's toolbar, the
 * search in the act, the reference previews, and the article's own actions (a note).
 */
function useActText({
  act,
  selected,
  onSelect,
  onAddNote,
  phone,
}: {
  act: LegalAct
  selected: string | undefined
  onSelect: (id: string | undefined) => void
  onAddNote: (articleId: string) => void
  phone: boolean
}) {
  const text = useRef<LegalTextHandle>(null)
  const layout = phone ? 'phone' : 'desktop'
  return {
    toolbar: (
      <LegalContents
        nodes={act.nodes}
        currentId={selected ?? null}
        onNavigate={(id) => {
          text.current?.revealNode(id)
        }}
        {...(act.lang === undefined ? {} : { lang: act.lang })}
        layout={layout}
      />
    ),
    text: (
      <LegalText
        ref={text}
        nodes={act.nodes}
        {...(act.footnotes === undefined ? {} : { footnotes: act.footnotes })}
        label={act.title}
        {...(act.lang === undefined ? {} : { lang: act.lang })}
        selectedArticleId={selected ?? null}
        onArticleSelect={(id) => {
          onSelect(id ?? undefined)
        }}
        onCopyLink={(article) => {
          notice.success(`Link to ${article.label} copied.`)
        }}
        articleActions={(article) => [
          {
            label: 'Add note',
            onSelect: () => {
              onAddNote(article.id)
            },
          },
        ]}
        resolveTarget={resolveExampleTarget}
        layout={layout}
      />
    ),
  }
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
  compareRoute,
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
  /** The route comparing two of the act's versions, the earlier first. */
  compareRoute?: (earlier: string, later: string) => string
  panels: PanelData
}) {
  const [versionId, setVersionId] = useState(initialVersion)
  const [selected, setSelected] = useState<string | undefined>(articleId)
  const page = useActPage()
  const act = version(versionId)
  const body = useActText({
    act,
    selected,
    onSelect: setSelected,
    onAddNote: (articleId) => {
      page.common(act).onAddNote(articleId)
    },
    phone,
  })
  const compareWith = (other: string) => {
    if (compareRoute === undefined) return
    const order = act.versions.map((each) => each.id)
    const [earlier, later] =
      order.indexOf(other) < order.indexOf(versionId) ? [other, versionId] : [versionId, other]
    page.navigate(compareRoute(earlier, later))
  }
  // "Compare versions": the version shown with the one before it (the first with the next).
  const neighbour = (() => {
    const order = act.versions.map((each) => each.id)
    const at = order.indexOf(versionId)
    return order[at > 0 ? at - 1 : at + 1]
  })()
  return (
    <Shell phone={phone} crumbs={[LEGAL_CRUMB, { label: crumb }]}>
      <LegalActPage
        act={act}
        gazetteName={GAZETTE}
        back={LEGAL_BACK}
        banner={<Alert tone="neutral" title={banner} />}
        layout={phone ? 'phone' : 'desktop'}
        {...page.common(act)}
        {...(compareRoute === undefined || neighbour === undefined
          ? {}
          : {
              onCompareVersions: () => {
                compareWith(neighbour)
              },
              onCompare: compareWith,
            })}
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
        toolbar={body.toolbar}
        text={body.text}
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
      compareRoute={compareRoute('building-works')}
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

// ── Compare versions ─────────────────────────────────────────────────────────────────────────

/** The route comparing two versions of an act, the earlier first. */
export function compareRoute(actId: string) {
  return (earlier: string, later: string) => `${actRoute(actId)}/compare/${earlier}-${later}`
}

/**
 * Two versions of an act side by side in time: LegalCompare inline (changed articles only, "Show
 * all"), the two versions chosen above it.
 */
export function CompareScreen({
  phone,
  actId,
  version,
  earlier,
  later,
}: {
  phone: boolean
  actId: string
  version: (versionId: string) => LegalAct
  earlier: string
  later: string
}) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const before = version(earlier)
  const after = version(later)
  const order = after.versions.map((each) => each.id)
  const name = (id: string) => {
    const found = after.versions.find((each) => each.id === id)
    if (found === undefined) return id
    return found.to === undefined
      ? `From ${format.date(found.from)} (in force)`
      : `${format.date(found.from)} – ${format.date(found.to)}`
  }
  // In the comparison's heading: "Changes from the version of … to the version in force since …".
  const phrase = (id: string) => {
    const found = after.versions.find((each) => each.id === id)
    if (found === undefined) return id
    return found.to === undefined
      ? `the version in force since ${format.date(found.from)}`
      : `the version of ${format.date(found.from)} – ${format.date(found.to)}`
  }
  const options = (keep: (at: number) => boolean) =>
    order.filter((_, at) => keep(at)).map((id) => ({ value: id, label: name(id) }))
  const route = compareRoute(actId)
  const back: PageBack = { href: `#${actRoute(actId)}`, label: after.title }
  return (
    <Shell
      phone={phone}
      crumbs={[LEGAL_CRUMB, { label: after.title, href: back.href }, { label: 'Compare versions' }]}
    >
      <Frame phone={phone}>
        <PageHeader title="Compare versions" subtitle={after.title} back={back} />
        <Alert tone="neutral" title={ILLUSTRATIVE} />
        <Card className="flex flex-col gap-4 p-4">
          <div className="flex flex-wrap items-end gap-3">
            <SelectField
              label="Earlier version"
              options={options((at) => at < order.indexOf(later))}
              value={earlier}
              onChange={(next) => {
                navigate(route(next, later))
              }}
              className="w-full sm:w-64"
            />
            <SelectField
              label="Later version"
              options={options((at) => at > order.indexOf(earlier))}
              value={later}
              onChange={(next) => {
                navigate(route(earlier, next))
              }}
              className="w-full sm:w-64"
            />
          </div>
          <LegalCompare
            before={{ label: phrase(earlier), nodes: before.nodes }}
            after={{ label: phrase(later), nodes: after.nodes }}
            {...(after.lang === undefined ? {} : { lang: after.lang })}
          />
        </Card>
      </Frame>
      <Toaster layout={phone ? 'phone' : 'desktop'} />
    </Shell>
  )
}

/** Every pair of an act's versions, the earlier first. */
function compareRoutes(
  actId: string,
  version: (versionId: string) => LegalAct,
  ids: readonly string[],
): ExampleRoute[] {
  const routes: ExampleRoute[] = []
  ids.forEach((earlier, at) => {
    for (const later of ids.slice(at + 1))
      routes.push({
        path: compareRoute(actId)(earlier, later),
        render: (phone) => (
          <CompareScreen
            phone={phone}
            actId={actId}
            version={version}
            earlier={earlier}
            later={later}
          />
        ),
      })
  })
  return routes
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
      compareRoute={compareRoute('work-rulebook')}
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
  ...compareRoutes('building-works', lawVersion, ['v1', 'v2', 'v3', 'v4']),
  ...compareRoutes('work-rulebook', rulebookVersion, ['w1', 'w2']),
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
