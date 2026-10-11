import type { FilterDefinition } from '../components/filter-logic'
import type { GazetteIssue } from '../components/gazette-issues'
import type { LegalStatus } from '../components/legal-model'
import type { TreeNode } from '../components/tree-logic'
import {
  snippetFromRanges,
  type LegalSearchResult,
  type LegalSearchSort,
} from './legal-search-logic'

/*
 * Story data of LegalSearchPage and GazetteIssues (P5.27). Every act, number and text is
 * invented and labelled "Illustrative": the "Illustrative Gazette" is no real gazette, and no
 * article text is copied from anywhere. Not part of the package.
 */

export const STATUSES = {
  inForce: { id: 'in-force', label: 'In force', tone: 'success' },
  partly: { id: 'partly', label: 'Partly in force', tone: 'warning' },
  notYet: { id: 'not-yet', label: 'Not yet in force', tone: 'neutral' },
  noLonger: { id: 'no-longer', label: 'No longer in force', tone: 'danger' },
} as const satisfies Record<string, LegalStatus>

/** The areas of law, as a tree (the application's classification, illustrative). */
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
      { id: 'planning', label: 'Spatial planning' },
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
  { id: 'administration', label: 'Public administration' },
]

const choice = (labels: readonly string[]) =>
  labels.map((label) => ({ value: label.toLowerCase().replaceAll(' ', '-'), label }))

/** The search page's filters: type, status and issuer in the row; the rest in the drawer. */
export const LEGAL_FILTERS: FilterDefinition[] = [
  {
    id: 'type',
    label: 'Type',
    type: 'multiSelect',
    options: choice(['Law', 'Decree', 'Rulebook', 'Court decision', 'Opinion', 'Internal act']),
  },
  {
    id: 'status',
    label: 'Status',
    type: 'multiSelect',
    options: Object.values(STATUSES).map((status) => ({ value: status.id, label: status.label })),
  },
  {
    id: 'issuer',
    label: 'Issuer',
    type: 'multiSelect',
    options: choice([
      'Illustrative Assembly',
      'Illustrative Government',
      'Illustrative Ministry',
      'Illustrative Appellate Court',
      'Illustrative Supreme Court',
      'Kvadrat Gradnja d.o.o.',
    ]),
  },
  { id: 'area', label: 'Area', type: 'tree', nodes: AREAS },
  {
    id: 'year',
    label: 'Gazette year',
    type: 'select',
    options: ['2024', '2023', '2022', '2021', '2018', '2016'].map((year) => ({
      value: year,
      label: year,
    })),
  },
  { id: 'number', label: 'Gazette number', type: 'text' },
  { id: 'inForce', label: 'In force between', type: 'dateRange' },
]

/** Filters set: laws and rulebooks in force, on building works, from the 2016 gazette on. */
export const ACTIVE_VALUES = {
  type: ['law', 'rulebook'],
  status: ['in-force'],
  area: ['works', 'site-records', 'site-safety'],
  year: '2016',
  inForce: { start: '2026-01-01', end: null },
}

export const SORTS: LegalSearchSort[] = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'newest', label: 'Newest first' },
  { value: 'title', label: 'Title' },
]

export const VIEWS = [
  { id: 'all', label: 'All acts', count: 1284 },
  { id: 'in-force', label: 'In force', count: 911 },
  { id: 'bookmarked', label: 'Bookmarked', count: 7 },
]

/** A text with every occurrence of `word` marked, as a search engine's ranges would give it. */
export function marked(text: string, word: string) {
  const ranges: [number, number][] = []
  for (let at = text.indexOf(word); at >= 0; at = text.indexOf(word, at + word.length)) {
    ranges.push([at, at + word.length])
  }
  return snippetFromRanges(text, ranges)
}

const LAW_GAZETTE = [
  { id: 'g12-2016', label: 'No. 12/2016', published: '2016-02-19' },
  { id: 'g47-2018', label: '47/2018', published: '2018-06-22' },
  { id: 'g33-2021', label: '33/2021', published: '2021-04-02' },
  { id: 'g9-2024', label: '9/2024', published: '2024-02-15' },
]

/** The search for "site records": six acts, the matches marked by the application. */
export const RESULTS: LegalSearchResult[] = [
  {
    id: 'building-works',
    type: 'Law',
    title: 'Law on Illustrative Building Works',
    href: '#/legal/acts/building-works',
    issuer: 'Illustrative Assembly',
    gazetteName: 'Illustrative Gazette',
    gazette: LAW_GAZETTE,
    status: STATUSES.inForce,
    snippet: marked(
      '(1) The contractor keeps the site records on the building site from the first day of works until the works are handed over.',
      'site records',
    ),
    article: { label: 'Article 57', href: '#/legal/acts/building-works/article-57' },
  },
  {
    id: 'site-records',
    type: 'Rulebook',
    title: 'Rulebook on Illustrative Site Records',
    href: '#/legal/acts/site-records',
    issuer: 'Illustrative Ministry',
    gazetteName: 'Illustrative Gazette',
    gazette: [
      { id: 'g21-2016', label: 'No. 21/2016' },
      { id: 'g40-2021', label: '40/2021' },
    ],
    status: STATUSES.inForce,
    snippet: [
      'The ',
      { match: 'site records' },
      ' consist of the site diary, the site book and the record of handed-over works.',
    ],
    article: { label: 'Article 3', href: '#/legal/acts/site-records/article-3' },
  },
  {
    id: 'work-rulebook-2025',
    type: 'Internal act',
    title: 'Kvadrat Gradnja d.o.o. — Work Rulebook',
    href: '#/legal/acts/work-rulebook',
    issuer: 'Kvadrat Gradnja d.o.o.',
    gazette: [],
    status: STATUSES.inForce,
    snippet: [
      '… the site manager signs the ',
      { match: 'site records' },
      ' at the end of each working day.',
    ],
    article: { label: 'Article 14', href: '#/legal/acts/work-rulebook/article-14' },
  },
  {
    id: 'appellate-gz-101-2022',
    type: 'Court decision',
    title: 'Illustrative Appellate Court, Gž 101/2022',
    href: '#/legal/practice/gz-101-2022',
    issuer: 'Illustrative Appellate Court',
    gazette: [],
    status: STATUSES.inForce,
    snippet: [
      '… ',
      { match: 'site records' },
      ' written after the works were handed over do not prove when the works were done.',
    ],
  },
  {
    id: 'ministry-opinion-55-2023',
    type: 'Opinion',
    title: 'Illustrative Ministry, opinion 011-00-55/2023',
    href: '#/legal/practice/opinion-011-00-55-2023',
    issuer: 'Illustrative Ministry',
    gazette: [],
    status: STATUSES.inForce,
    snippet: [
      'Electronic ',
      { match: 'site records' },
      ' meet the rulebook when each entry carries its author and time.',
    ],
  },
  {
    id: 'site-signs',
    type: 'Rulebook',
    title: 'Rulebook on Illustrative Site Signs',
    href: '#/legal/acts/site-signs',
    issuer: 'Illustrative Ministry',
    gazetteName: 'Illustrative Gazette',
    gazette: [{ id: 'g5-2016', label: 'No. 5/2016' }],
    status: STATUSES.noLonger,
    snippet: [
      'The sign names the investor, the contractor and where the ',
      { match: 'site records' },
      ' are kept.',
    ],
    article: { label: 'Article 2', href: '#/legal/acts/site-signs/article-2' },
  },
]

const [LAW, RULEBOOK] = RESULTS as [LegalSearchResult, LegalSearchResult]

/** Results with long titles and a long issuer: they wrap, never cut. */
export const LONG_RESULTS: LegalSearchResult[] = [
  {
    ...LAW,
    id: 'long-1',
    title:
      'Law amending and supplementing the Law on Illustrative Building Works, Illustrative Spatial Planning and the Illustrative Supervision of Construction Sites in the Transitional Period',
    issuer:
      'Illustrative Assembly of the Illustrative Autonomous Province, Committee for Construction',
    gazette: [
      ...LAW_GAZETTE,
      { id: 'g1', label: '15/2024' },
      { id: 'g2', label: '22/2024' },
      { id: 'g3', label: '41/2024' },
      { id: 'g4', label: '3/2025' },
    ],
    status: STATUSES.partly,
    article: {
      label: 'Article 157a (transitional and final provisions)',
      href: '#/legal/acts/building-works/article-157a',
    },
  },
  {
    ...RULEBOOK,
    id: 'long-2',
    title:
      'Rulebook on the content, the manner of keeping and the form of the Illustrative Site Records, the site diary and the book of handed-over works for buildings of category V',
    status: STATUSES.notYet,
  },
]

/** Arabic results (the stories' sample text): the act's words from the application. */
export const ARABIC_RESULTS: LegalSearchResult[] = [
  {
    id: 'ar-1',
    type: 'قانون',
    title: 'قانون الأعمال الإنشائية التوضيحي',
    href: '#ar-1',
    issuer: 'الجمعية التوضيحية',
    gazetteName: 'الجريدة التوضيحية',
    gazette: [
      { id: 'a', label: 'العدد 12/2016' },
      { id: 'b', label: '47/2018' },
    ],
    status: { id: 'in-force', label: 'ساري المفعول', tone: 'success' },
    snippet: [
      'يحتفظ المقاول ',
      { match: 'بسجلات الموقع' },
      ' في موقع البناء من اليوم الأول للأعمال.',
    ],
    article: { label: 'المادة 57', href: '#ar-1-57' },
  },
  {
    id: 'ar-2',
    type: 'لائحة',
    title: 'لائحة سجلات الموقع التوضيحية',
    href: '#ar-2',
    issuer: 'الوزارة التوضيحية',
    gazette: [{ id: 'c', label: 'العدد 21/2016' }],
    gazetteName: 'الجريدة التوضيحية',
    status: { id: 'no-longer', label: 'لم يعد ساريًا', tone: 'danger' },
    snippet: ['تتكون ', { match: 'سجلات الموقع' }, ' من يومية الموقع ودفتر الموقع.'],
  },
]

/** Japanese results. */
export const JAPANESE_RESULTS: LegalSearchResult[] = [
  {
    id: 'ja-1',
    type: '法律',
    title: '例示建設工事法',
    href: '#ja-1',
    issuer: '例示議会',
    gazetteName: '例示官報',
    gazette: [
      { id: 'a', label: '第12/2016号' },
      { id: 'b', label: '47/2018' },
    ],
    status: { id: 'in-force', label: '施行中', tone: 'success' },
    snippet: ['施工者は、工事の初日から引渡しまで、', { match: '現場記録' }, 'を現場に備え置く。'],
    article: { label: '第57条', href: '#ja-1-57' },
  },
  {
    id: 'ja-2',
    type: '規則',
    title: '例示現場記録規則',
    href: '#ja-2',
    issuer: '例示省',
    gazetteName: '例示官報',
    gazette: [{ id: 'c', label: '第21/2016号' }],
    status: { id: 'not-yet', label: '未施行', tone: 'neutral' },
    snippet: [{ match: '現場記録' }, 'は、現場日誌、現場台帳及び引渡し記録から成る。'],
  },
]

/** "New in the Illustrative Gazette": three issues, newest first. */
export const ISSUES: GazetteIssue[] = [
  {
    id: 'i9-2024',
    label: 'No. 9/2024',
    published: '2024-02-15',
    href: '#/legal/gazette/9-2024',
    acts: [
      {
        id: 'amend-2024',
        type: 'Law',
        title: 'Law amending the Law on Illustrative Building Works',
        href: '#/legal/acts/building-works-amendment-2024',
        status: STATUSES.inForce,
        note: 'Amends the Law on Illustrative Building Works, Articles 12, 57 and 90',
      },
      {
        id: 'fees-decree',
        type: 'Decree',
        title: 'Decree on Illustrative Construction Fees',
        href: '#/legal/acts/construction-fees',
        status: STATUSES.notYet,
        note: 'Applies from 01.01.2027.',
      },
    ],
  },
  {
    id: 'i40-2021',
    label: 'No. 40/2021',
    published: '2021-05-07',
    href: '#/legal/gazette/40-2021',
    acts: [
      {
        id: 'site-records-amend',
        type: 'Rulebook',
        title: 'Rulebook amending the Rulebook on Illustrative Site Records',
        href: '#/legal/acts/site-records-amendment-2021',
        status: STATUSES.inForce,
        note: 'Allows electronic site records',
      },
    ],
  },
  {
    id: 'i33-2021',
    label: 'No. 33/2021',
    published: '2021-04-02',
    href: '#/legal/gazette/33-2021',
    acts: [
      {
        id: 'amend-2021',
        type: 'Law',
        title: 'Law amending the Law on Illustrative Building Works',
        href: '#/legal/acts/building-works-amendment-2021',
        status: STATUSES.inForce,
        note: 'Amends Article 57; deletes Article 58',
      },
      {
        id: 'site-signs-repeal',
        type: 'Rulebook',
        title: 'Rulebook repealing the Rulebook on Illustrative Site Signs',
        href: '#/legal/acts/site-signs-repeal',
        status: STATUSES.inForce,
        note: 'The Rulebook on Illustrative Site Signs no longer applies',
      },
    ],
  },
]
