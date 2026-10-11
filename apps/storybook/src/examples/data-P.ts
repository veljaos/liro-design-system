/*
 * Group P's example data (P5.27, legal information: the search and the gazette). Every act,
 * gazette number and article text is invented and labelled "Illustrative": the "Illustrative
 * Gazette" is no real gazette, and nothing is copied from a consolidated text or a commentary.
 * The acts are those of the act page's examples (group O): the Law on Illustrative Building Works
 * (No. 12/2016, amended 47/2018, 33/2021, 9/2024), its Rulebook on Illustrative Site Records,
 * two court decisions, an opinion and Kvadrat Gradnja d.o.o.'s Work Rulebook. The search, the
 * filters, the sort and the paging are the application's work, played here (`searchActs`); the
 * page only shows the results. Not part of the package. No classes here.
 */
import {
  snippetFromRanges,
  type FilterDefinition,
  type GazetteIssue,
  type LegalSearchResult,
  type LegalSearchSort,
  type Tone,
  type TreeNode,
} from '@veljaos/ui'
import { toneOf, type ExampleStatus } from './example-shell'

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const P_ROUTES = {
  /** The search for "site records" with the area and the date in force set. */
  search: '/legal/search',
  /** "New in the Illustrative Gazette", issue by issue. */
  gazette: '/legal/gazette',
} as const

/** An act's page and an article's (the act page's routes, group O). */
export const actRoute = (id: string) => `/legal/acts/${id}`
export const articleRoute = (id: string, article: string) => `/legal/acts/${id}/article-${article}`

// ── Statuses ──────────────────────────────────────────────────────────────────────────────────

type LegalStatusLabel = Extract<
  ExampleStatus,
  'In force' | 'Partly in force' | 'Not yet in force' | 'No longer in force' | 'Final'
>

/** A status from the examples' one tone map (never blue: info would read as neutral). */
function status(id: string, label: LegalStatusLabel) {
  const tone: Tone = toneOf(label)
  return { id, label, tone: tone === 'info' ? 'neutral' : tone } as const
}

export const STATUS = {
  inForce: status('in-force', 'In force'),
  partly: status('partly', 'Partly in force'),
  notYet: status('not-yet', 'Not yet in force'),
  noLonger: status('no-longer', 'No longer in force'),
  final: status('final', 'Final'),
}

// ── The acts ──────────────────────────────────────────────────────────────────────────────────

export const GAZETTE = 'Illustrative Gazette'

interface Article {
  /** "57" — the label is "Article 57". */
  number: string
  text: string
}

interface ExampleAct {
  id: string
  type: string
  title: string
  issuer: string
  /** The gazette's references, the original first (none for a decision or an internal act). */
  gazette: { id: string; label: string; published: string }[]
  status: ReturnType<typeof status>
  /** The areas of the tree below the act belongs to. */
  areas: string[]
  /** In force from, and until (a repealed act). */
  from: string
  to?: string
  /** Its page: an act's own, or a decision's. */
  href: string
  articles: Article[]
}

const LAW_GAZETTE = [
  { id: 'g12-2016', label: 'No. 12/2016', published: '2016-02-19' },
  { id: 'g47-2018', label: '47/2018', published: '2018-06-22' },
  { id: 'g33-2021', label: '33/2021', published: '2021-04-02' },
  { id: 'g9-2024', label: '9/2024', published: '2024-02-15' },
]

export const ACTS: ExampleAct[] = [
  {
    id: 'building-works',
    type: 'Law',
    title: 'Law on Illustrative Building Works',
    issuer: 'Illustrative Assembly',
    gazette: LAW_GAZETTE,
    status: STATUS.inForce,
    areas: ['permits', 'works', 'site-records', 'site-safety'],
    from: '2016-02-27',
    href: `#${actRoute('building-works')}`,
    articles: [
      {
        number: '1',
        text: 'This Law governs illustrative building works: who builds, who supervises the works and which records are kept on the building site.',
      },
      {
        number: '12',
        text: 'The investor appoints a supervising engineer before the works start.',
      },
      {
        number: '57',
        text: '(1) The contractor keeps the site records on the building site from the first day of works until the works are handed over. (2) The supervising engineer signs each entry of the site records within three days.',
      },
      {
        number: '63',
        text: 'The minister prescribes the content of the site records and the manner of keeping them.',
      },
      {
        number: '90',
        text: 'The contractor fences the building site and marks it with a site sign.',
      },
    ],
  },
  {
    id: 'site-records',
    type: 'Rulebook',
    title: 'Rulebook on Illustrative Site Records',
    issuer: 'Illustrative Ministry',
    gazette: [
      { id: 'g21-2016', label: 'No. 21/2016', published: '2016-03-25' },
      { id: 'g40-2021', label: '40/2021', published: '2021-05-07' },
    ],
    status: STATUS.inForce,
    areas: ['works', 'site-records'],
    from: '2016-04-02',
    href: `#${actRoute('site-records')}`,
    articles: [
      {
        number: '1',
        text: 'Based on Article 63 of the Law on Illustrative Building Works, this Rulebook prescribes the content of the site records.',
      },
      {
        number: '3',
        text: 'The site records consist of the site diary, the site book and the record of handed-over works.',
      },
      {
        number: '7',
        text: 'Electronic site records are kept in an application that records the author and the time of each entry.',
      },
    ],
  },
  {
    id: 'work-rulebook',
    type: 'Internal act',
    title: 'Kvadrat Gradnja d.o.o. — Work Rulebook',
    issuer: 'Kvadrat Gradnja d.o.o.',
    gazette: [],
    status: STATUS.inForce,
    areas: ['rulebooks', 'employment'],
    from: '2025-03-01',
    href: `#${actRoute('work-rulebook')}`,
    articles: [
      {
        number: '14',
        text: 'The site manager signs the site records at the end of each working day.',
      },
      {
        number: '20',
        text: 'Working hours on the building site are from 07:00 to 15:00, Monday to Friday.',
      },
    ],
  },
  {
    id: 'gz-101-2022',
    type: 'Court decision',
    title: 'Illustrative Appellate Court, Gž 101/2022',
    issuer: 'Illustrative Appellate Court',
    gazette: [],
    status: STATUS.final,
    areas: ['civil', 'site-records'],
    from: '2022-11-14',
    href: '#/legal/practice/gz-101-2022',
    articles: [
      {
        number: '',
        text: 'Site records written after the works were handed over do not prove when the works were done.',
      },
    ],
  },
  {
    id: 'rev-202-2023',
    type: 'Court decision',
    title: 'Illustrative Supreme Court, Rev 202/2023',
    issuer: 'Illustrative Supreme Court',
    gazette: [],
    status: STATUS.final,
    areas: ['civil', 'site-records'],
    from: '2023-09-21',
    href: '#/legal/practice/rev-202-2023',
    articles: [
      {
        number: '',
        text: 'A contractor who kept no site records has to prove by other means on which days the works were done.',
      },
    ],
  },
  {
    id: 'opinion-011-00-55-2023',
    type: 'Opinion',
    title: 'Illustrative Ministry, opinion 011-00-55/2023',
    issuer: 'Illustrative Ministry',
    gazette: [],
    status: STATUS.final,
    areas: ['site-records'],
    from: '2023-05-30',
    href: '#/legal/practice/opinion-011-00-55-2023',
    articles: [
      {
        number: '',
        text: 'Electronic site records meet the Rulebook when each entry carries its author and its time.',
      },
    ],
  },
  {
    id: 'site-signs',
    type: 'Rulebook',
    title: 'Rulebook on Illustrative Site Signs',
    issuer: 'Illustrative Ministry',
    gazette: [{ id: 'g5-2016', label: 'No. 5/2016', published: '2016-01-22' }],
    status: STATUS.noLonger,
    areas: ['works', 'site-safety'],
    from: '2016-01-30',
    to: '2021-04-09',
    href: `#${actRoute('site-signs')}`,
    articles: [
      {
        number: '2',
        text: 'The site sign names the investor, the contractor and the place where the site records are kept.',
      },
    ],
  },
  {
    id: 'safety-at-work',
    type: 'Law',
    title: 'Law on Illustrative Safety at Work',
    issuer: 'Illustrative Assembly',
    gazette: [
      { id: 'g18-2017', label: 'No. 18/2017', published: '2017-03-03' },
      { id: 'g33-2021b', label: '33/2021', published: '2021-04-02' },
    ],
    status: STATUS.partly,
    areas: ['safety', 'site-safety'],
    from: '2017-03-11',
    href: `#${actRoute('safety-at-work')}`,
    articles: [
      {
        number: '22',
        text: 'The employer keeps a record of the safety training of every worker on the building site.',
      },
    ],
  },
  {
    id: 'construction-fees',
    type: 'Decree',
    title: 'Decree on Illustrative Construction Fees',
    issuer: 'Illustrative Government',
    gazette: [{ id: 'g9-2024b', label: 'No. 9/2024', published: '2024-02-15' }],
    status: STATUS.notYet,
    areas: ['permits'],
    from: '2027-01-01',
    href: `#${actRoute('construction-fees')}`,
    articles: [
      {
        number: '4',
        text: 'The fee for a building permit is paid before the permit is issued.',
      },
    ],
  },
]

// ── Filters ───────────────────────────────────────────────────────────────────────────────────

/** The areas of law (the application's classification, illustrative). */
export const AREAS: TreeNode[] = [
  {
    id: 'construction',
    label: 'Construction and spatial planning',
    children: [
      { id: 'permits', label: 'Building permits' },
      {
        id: 'works',
        label: 'Building works',
        children: [
          { id: 'site-records', label: 'Site records' },
          { id: 'site-safety', label: 'Site safety' },
        ],
      },
    ],
  },
  {
    id: 'labour',
    label: 'Labour and employment',
    children: [
      { id: 'employment', label: 'Employment relations' },
      { id: 'rulebooks', label: 'Work rulebooks' },
      { id: 'safety', label: 'Safety at work' },
    ],
  },
  {
    id: 'courts',
    label: 'Courts and procedure',
    children: [{ id: 'civil', label: 'Civil procedure' }],
  },
]

const slug = (text: string) => text.toLowerCase().replaceAll(/[^a-z0-9]+/g, '-')
const options = (labels: Iterable<string>) =>
  [...new Set(labels)].map((label) => ({ value: slug(label), label }))

const YEARS = [
  ...new Set(ACTS.flatMap((act) => act.gazette.map((ref) => ref.published.slice(0, 4)))),
].sort((a, b) => b.localeCompare(a))

export const FILTERS: FilterDefinition[] = [
  { id: 'type', label: 'Type', type: 'multiSelect', options: options(ACTS.map((act) => act.type)) },
  {
    id: 'status',
    label: 'Status',
    type: 'multiSelect',
    options: Object.values(STATUS).map((one) => ({ value: one.id, label: one.label })),
  },
  {
    id: 'issuer',
    label: 'Issuer',
    type: 'multiSelect',
    options: options(ACTS.map((act) => act.issuer)),
  },
  { id: 'area', label: 'Area', type: 'tree', nodes: AREAS },
  {
    id: 'year',
    label: 'Gazette year',
    type: 'select',
    options: YEARS.map((year) => ({ value: year, label: year })),
  },
  { id: 'number', label: 'Gazette number', type: 'text' },
  { id: 'inForce', label: 'In force between', type: 'dateRange' },
]

/** The screen's search when it opens: "site records" in building works, in force today. */
export const START = {
  search: 'site records',
  values: {
    area: ['works', 'site-records', 'site-safety'],
    inForce: { start: '2026-10-06', end: '2026-10-06' },
  } as Record<string, unknown>,
}

export const SORTS: LegalSearchSort[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest first' },
  { value: 'title', label: 'Title' },
]

export const VIEWS = [
  { id: 'all', label: 'All acts', count: ACTS.length },
  {
    id: 'in-force',
    label: 'In force',
    count: ACTS.filter((act) => act.status.id === 'in-force').length,
  },
]

// ── The search (the application's work) ───────────────────────────────────────────────────────

/** How many results one page holds (the cursor moves by this many). */
export const PAGE_SIZE = 4

const list = (value: unknown): string[] =>
  Array.isArray(value) ? value.filter((one): one is string => typeof one === 'string') : []

/** Every place the words stand in a text, ignoring case. */
function matches(text: string, words: string): [number, number][] {
  const lower = text.toLocaleLowerCase('en')
  const wanted = words.toLocaleLowerCase('en')
  const found: [number, number][] = []
  if (wanted === '') return found
  for (let at = lower.indexOf(wanted); at >= 0; at = lower.indexOf(wanted, at + wanted.length)) {
    found.push([at, at + wanted.length])
  }
  return found
}

function inForceBetween(act: ExampleAct, range: unknown): boolean {
  if (typeof range !== 'object' || range === null) return true
  const { start, end } = range as { start?: string | null; end?: string | null }
  if (typeof end === 'string' && act.from > end) return false
  if (typeof start === 'string' && act.to !== undefined && act.to < start) return false
  return true
}

/** Whether an act passes the filters. */
function passes(act: ExampleAct, values: Record<string, unknown>): boolean {
  const types = list(values.type)
  const statuses = list(values.status)
  const issuers = list(values.issuer)
  const areas = list(values.area)
  const year = typeof values.year === 'string' ? values.year : ''
  const number = typeof values.number === 'string' ? values.number.trim() : ''
  if (types.length > 0 && !types.includes(slug(act.type))) return false
  if (statuses.length > 0 && !statuses.includes(act.status.id)) return false
  if (issuers.length > 0 && !issuers.includes(slug(act.issuer))) return false
  if (areas.length > 0 && !act.areas.some((area) => areas.includes(area))) return false
  if (year !== '' && !act.gazette.some((ref) => ref.published.startsWith(year))) return false
  if (number !== '' && !act.gazette.some((ref) => ref.label.includes(number))) return false
  return inForceBetween(act, values.inForce)
}

/**
 * The search: the acts that pass the filters and hold the words (in the title or an article),
 * each with the first article that holds them as its snippet, sorted; every match marked.
 */
export function searchActs(
  words: string,
  values: Record<string, unknown>,
  sort: string,
): LegalSearchResult[] {
  const query = words.trim()
  const found = ACTS.filter((act) => passes(act, values)).flatMap((act) => {
    const article = act.articles.find((one) => matches(one.text, query).length > 0)
    const inTitle = matches(act.title, query).length > 0
    if (query !== '' && article === undefined && !inTitle) return []
    const hits = act.articles.reduce((sum, one) => sum + matches(one.text, query).length, 0)
    const shown = article ?? act.articles[0]
    const result: LegalSearchResult = {
      id: act.id,
      type: act.type,
      title: act.title,
      href: act.href,
      issuer: act.issuer,
      gazette: act.gazette,
      status: act.status,
      ...(act.gazette.length > 0 ? { gazetteName: GAZETTE } : {}),
      ...(shown === undefined
        ? {}
        : { snippet: snippetFromRanges(shown.text, matches(shown.text, query)) }),
      ...(article === undefined || article.number === ''
        ? {}
        : {
            article: {
              label: `Article ${article.number}`,
              href: `#${articleRoute(act.id, article.number)}`,
            },
          }),
    }
    return [{ result, hits, act }]
  })
  const sorted = [...found].sort((a, b) => {
    if (sort === 'newest') return b.act.from.localeCompare(a.act.from)
    if (sort === 'title') return a.act.title.localeCompare(b.act.title, 'en')
    return b.hits - a.hits
  })
  return sorted.map((one) => one.result)
}

// ── New in the Illustrative Gazette ───────────────────────────────────────────────────────────

const act = (id: string) => {
  const one = ACTS.find((each) => each.id === id)
  if (one === undefined) throw new Error(`No act ${id}`)
  return one
}

/** Every issue, newest first; the screen shows three and pages by "Show more issues". */
export const ISSUES: GazetteIssue[] = [
  {
    id: 'i9-2024',
    label: 'No. 9/2024',
    published: '2024-02-15',
    acts: [
      {
        id: 'amend-2024',
        type: 'Law',
        title: 'Law amending the Law on Illustrative Building Works',
        href: `#${actRoute('building-works')}`,
        status: STATUS.inForce,
        note: 'Amends the Law on Illustrative Building Works, Articles 12, 57 and 90',
      },
      {
        id: 'construction-fees',
        type: act('construction-fees').type,
        title: act('construction-fees').title,
        href: act('construction-fees').href,
        status: act('construction-fees').status,
        note: 'New; applies from 01.01.2027.',
      },
    ],
  },
  {
    id: 'i40-2021',
    label: 'No. 40/2021',
    published: '2021-05-07',
    acts: [
      {
        id: 'site-records-2021',
        type: 'Rulebook',
        title: 'Rulebook amending the Rulebook on Illustrative Site Records',
        href: `#${actRoute('site-records')}`,
        status: STATUS.inForce,
        note: 'Allows electronic site records (Article 7)',
      },
    ],
  },
  {
    id: 'i33-2021',
    label: 'No. 33/2021',
    published: '2021-04-02',
    acts: [
      {
        id: 'amend-2021',
        type: 'Law',
        title: 'Law amending the Law on Illustrative Building Works',
        href: `#${actRoute('building-works')}`,
        status: STATUS.inForce,
        note: 'Amends Article 57; deletes Article 58',
      },
      {
        id: 'safety-2021',
        type: 'Law',
        title: 'Law amending the Law on Illustrative Safety at Work',
        href: `#${actRoute('safety-at-work')}`,
        status: STATUS.partly,
        note: 'Amends Article 22; Articles 30 to 34 apply from 01.01.2027.',
      },
      {
        id: 'site-signs-repeal',
        type: 'Rulebook',
        title: 'Rulebook on Illustrative Site Signs',
        href: act('site-signs').href,
        status: STATUS.noLonger,
        note: 'Repealed by the Law amending the Law on Illustrative Building Works',
      },
    ],
  },
  {
    id: 'i47-2018',
    label: 'No. 47/2018',
    published: '2018-06-22',
    acts: [
      {
        id: 'amend-2018',
        type: 'Law',
        title: 'Law amending the Law on Illustrative Building Works',
        href: `#${actRoute('building-works')}`,
        status: STATUS.inForce,
        note: 'Amends Articles 12 and 63',
      },
    ],
  },
  {
    id: 'i18-2017',
    label: 'No. 18/2017',
    published: '2017-03-03',
    acts: [
      {
        id: 'safety-at-work',
        type: act('safety-at-work').type,
        title: act('safety-at-work').title,
        href: act('safety-at-work').href,
        status: act('safety-at-work').status,
        note: 'New',
      },
    ],
  },
]

/** How many issues the screen shows first, and how many more each "Show more issues" adds. */
export const ISSUE_PAGE = 3
