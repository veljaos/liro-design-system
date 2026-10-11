/*
 * Group O's example data (P5.27, legal information: the act page). **Everything here is invented**
 * and labelled "Illustrative": the gazette is the "Illustrative Gazette", the assembly, the courts,
 * the ministry and every number are made up, and the article texts are written for the examples,
 * short and plainly fictitious — no real act, consolidated text or commentary is copied. The acts
 * are the search's (group P, data-P.ts): the Law on Illustrative Building Works (No. 12/2016,
 * amended 47/2018, 33/2021, 9/2024) with its four versions, its Rulebook on Illustrative Site
 * Records, Kvadrat Gradnja d.o.o.'s Work Rulebook (2022 and 2025), three further acts as short
 * pages, two court decisions and an opinion. Not part of the package. No classes here.
 */
import type {
  GazetteReference,
  LegalAct,
  LegalAmendment,
  LegalArticle,
  LegalInline,
  LegalNode,
  LegalNote,
  LegalParagraph,
  LegalStatus,
  LegalVersion,
  PracticeItem,
  RelatedAct,
} from '@veljaos/ui'
import { toneOf, type ExampleStatus } from './example-shell'

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

/** An act's page and an article's (the search's links, group P, lead here). */
export const actRoute = (id: string) => `/legal/acts/${id}`
export const articleRoute = (id: string, article: string) => `/legal/acts/${id}/article-${article}`
export const practiceRoute = (id: string) => `/legal/practice/${id}`

export const O_ROUTES = {
  /** The law, the version in force, every panel. */
  law: actRoute('building-works'),
  /** The law with Article 57 chosen: the panels narrowed to it. */
  lawArticle: articleRoute('building-works', '57'),
  /** The law as it stood from 30.06.2018. (the first amendment). */
  lawVersion: `${actRoute('building-works')}?version=v2`,
  /** The 2021 version of the law compared with the version in force. */
  lawCompare: `${actRoute('building-works')}/compare/v3-v4`,
  /** The Work Rulebook's 2022 and 2025 versions compared. */
  rulebookCompare: `${actRoute('work-rulebook')}/compare/w1-w2`,
  /** The law's printout (A4). */
  lawPrint: `${actRoute('building-works')}/print`,
  /** The law's by-law. */
  byLaw: actRoute('site-records'),
  /** Kvadrat Gradnja's Work Rulebook, the 2025 version. */
  rulebook: actRoute('work-rulebook'),
  /** The search and the gazette (group P). */
  search: '/legal/search',
  gazette: '/legal/gazette',
} as const

const GAZETTE_HREF = `#${O_ROUTES.gazette}`

// ── Statuses and words ────────────────────────────────────────────────────────────────────────

type LegalStatusLabel = Extract<
  ExampleStatus,
  'In force' | 'Partly in force' | 'Not yet in force' | 'No longer in force' | 'Final'
>

/** A status from the examples' one tone map (never blue). */
function status(id: string, label: LegalStatusLabel): LegalStatus {
  const tone = toneOf(label)
  return { id, label, tone: tone === 'info' ? 'neutral' : tone }
}

export const STATUS = {
  inForce: status('in-force', 'In force'),
  partly: status('partly', 'Partly in force'),
  notYet: status('not-yet', 'Not yet in force'),
  noLonger: status('no-longer', 'No longer in force'),
  final: status('final', 'Final'),
}

export const GAZETTE = 'Illustrative Gazette'

export const ILLUSTRATIVE =
  'Illustrative: the act, the gazette, the courts and every number on this page are invented for the examples.'

// ── Building blocks ───────────────────────────────────────────────────────────────────────────

/** An article whose id is its act's letter and number ("a57"); its address is its route. */
function article(
  actId: string,
  id: string,
  title: string,
  paragraphs: readonly LegalParagraph[],
  more: Partial<LegalArticle> = {},
): LegalArticle {
  const number = id.slice(1)
  return {
    kind: 'article',
    id,
    label: `Article ${number}`,
    title,
    href: `#${articleRoute(actId, number)}`,
    paragraphs,
    ...more,
  }
}

/** One paragraph of plain text (an article of one paragraph has no label). */
function text(id: string, ...content: LegalInline[]): LegalParagraph {
  return { id, content }
}

/** A reference to an article of the law. */
function lawRef(number: string, words = `Article ${number}`): LegalInline {
  return {
    kind: 'ref',
    text: words,
    target: {
      actId: 'building-works',
      articleId: `a${number}`,
      href: `#${articleRoute('building-works', number)}`,
    },
  }
}

function gazette(id: string, label: string, published: string): GazetteReference {
  return { id, label, published, href: GAZETTE_HREF }
}

// ── The Law on Illustrative Building Works ────────────────────────────────────────────────────

export const LAW_AMENDMENTS: LegalAmendment[] = [
  {
    id: 'am1',
    label: 'Law amending the Law on Illustrative Building Works',
    gazette: gazette('g47-2018', 'No. 47/2018', '2018-06-22'),
    appliesFrom: '2018-06-30',
    articleIds: ['a12', 'a57'],
  },
  {
    id: 'am2',
    label: 'Law amending the Law on Illustrative Building Works',
    gazette: gazette('g33-2021', 'No. 33/2021', '2021-04-02'),
    appliesFrom: '2021-04-10',
    articleIds: ['a20', 'a57'],
  },
  {
    id: 'am3',
    label: 'Law amending the Law on Illustrative Building Works',
    gazette: gazette('g9-2024', 'No. 9/2024', '2024-02-15'),
    appliesFrom: '2024-02-23',
    articleIds: ['a63', 'a90'],
  },
]

export const LAW_VERSIONS: LegalVersion[] = [
  { id: 'v1', from: '2016-02-27', to: '2018-06-29', status: STATUS.noLonger },
  { id: 'v2', from: '2018-06-30', to: '2021-04-09', amendmentId: 'am1', status: STATUS.noLonger },
  { id: 'v3', from: '2021-04-10', to: '2024-02-22', amendmentId: 'am2', status: STATUS.noLonger },
  { id: 'v4', from: '2024-02-23', amendmentId: 'am3' },
]

const ORDER = ['v1', 'v2', 'v3', 'v4']

/** Whether the version `id` is the version `from` or a later one. */
function since(id: string, from: string) {
  return ORDER.indexOf(id) >= ORDER.indexOf(from)
}

function change(amendmentId: string, label: string, appliesFrom: string) {
  return { amendmentId, label, appliesFrom }
}

/** The law's text as it stood in one version (the application keeps every version's text). */
export function lawNodes(versionId: string): LegalNode[] {
  const one = since(versionId, 'v2')
  const two = since(versionId, 'v3')
  const three = since(versionId, 'v4')
  const law = (id: string, title: string, paragraphs: LegalParagraph[], more = {}) =>
    article('building-works', id, title, paragraphs, more)
  return [
    {
      kind: 'heading',
      id: 'p1',
      level: 1,
      label: 'Part One',
      title: 'General provisions',
      children: [
        law('a1', 'Subject', [
          text(
            'a1-1',
            'This Law governs illustrative building works: who builds, who supervises the works and which records are kept on the building site.',
          ),
        ]),
        law('a2', 'Meaning of terms', [
          {
            id: 'a2-1',
            content: ['In this Law:'],
            points: [
              {
                id: 'a2-1-1',
                label: '1)',
                content: ['“building site” is the land on which building works are carried out;'],
              },
              {
                id: 'a2-1-2',
                label: '2)',
                content: ['“investor” is the person for whom the works are carried out;'],
              },
              {
                id: 'a2-1-3',
                label: '3)',
                content: [
                  '“site records” are the records kept under ',
                  lawRef('57'),
                  ' of this Law.',
                ],
              },
            ],
          },
        ]),
        law(
          'a12',
          'Supervising engineer',
          [
            text(
              'a12-1',
              one
                ? 'The investor appoints a supervising engineer before the works start.'
                : 'The investor may appoint a supervising engineer.',
            ),
          ],
          one ? { changes: [change('am1', 'Amended by No. 47/2018', '2018-06-30')] } : {},
        ),
      ],
    },
    {
      kind: 'heading',
      id: 'p2',
      level: 1,
      label: 'Part Two',
      title: 'Building works',
      children: [
        {
          kind: 'heading',
          id: 'c1',
          level: 2,
          label: 'Chapter I',
          title: 'Permits and records',
          children: [
            two
              ? law('a20', 'Works by notice', [], {
                  deleted: 'Deleted (No. 33/2021)',
                  changes: [change('am2', 'Deleted by No. 33/2021', '2021-04-10')],
                })
              : law('a20', 'Works by notice', [
                  text(
                    'a20-1',
                    'Small works may begin on a notice to the municipality, without a permit.',
                  ),
                ]),
            law(
              'a57',
              'Site records',
              [
                {
                  id: 'a57-1',
                  label: '(1)',
                  content: [
                    one
                      ? 'The contractor keeps the site records on the building site from the first day of works until the works are handed over.'
                      : 'The contractor keeps site records for every building site.',
                  ],
                },
                {
                  id: 'a57-2',
                  label: '(2)',
                  content: [
                    two
                      ? 'The supervising engineer signs each entry of the site records within three days.'
                      : 'The supervising engineer signs the site records once a month.',
                  ],
                },
                {
                  id: 'a57-3',
                  label: '(3)',
                  content: ['Site records contain:'],
                  points: [
                    {
                      id: 'a57-3-1',
                      label: '1)',
                      content: ['the daily entries of the works done;'],
                    },
                    {
                      id: 'a57-3-2',
                      label: '2)',
                      content: ['the entries of the supervising engineer, with:'],
                      points: [
                        { id: 'a57-3-2-a', label: 'a)', content: ['the day of the visit;'] },
                        { id: 'a57-3-2-b', label: 'b)', content: ['what was found.'] },
                      ],
                    },
                  ],
                },
                {
                  id: 'a57-4',
                  label: '(4)',
                  content: [
                    'The form of site records is prescribed by the by-law under ',
                    lawRef('63'),
                    ' of this Law.',
                    { kind: 'footnote', id: 'f1', mark: '1' },
                  ],
                },
              ],
              {
                changes: [
                  ...(one ? [change('am1', 'Amended by No. 47/2018', '2018-06-30')] : []),
                  ...(two ? [change('am2', 'Amended by No. 33/2021', '2021-04-10')] : []),
                ],
              },
            ),
          ],
        },
        {
          kind: 'heading',
          id: 'c2',
          level: 2,
          label: 'Chapter II',
          title: 'Supervision',
          children: [
            law(
              'a63',
              'By-laws',
              [
                text(
                  'a63-1',
                  three
                    ? 'The minister prescribes the content of the site records and the manner of keeping them, on paper and electronically.'
                    : 'The minister prescribes the content of the site records and the manner of keeping them.',
                ),
              ],
              three ? { changes: [change('am3', 'Amended by No. 9/2024', '2024-02-23')] } : {},
            ),
            ...(three
              ? [
                  law(
                    'a90',
                    'Site fence and sign',
                    [
                      text(
                        'a90-1',
                        'The contractor fences the building site and marks it with a site sign.',
                      ),
                    ],
                    { changes: [change('am3', 'Added by No. 9/2024', '2024-02-23')] },
                  ),
                ]
              : []),
          ],
        },
      ],
    },
  ]
}

/** The law as the application gives it for one version. */
export function lawVersion(versionId: string): LegalAct {
  return {
    id: 'building-works',
    type: 'Law',
    title: 'Law on Illustrative Building Works',
    issuer: 'Illustrative Assembly',
    gazette: [
      gazette('g12-2016', 'No. 12/2016', '2016-02-19'),
      gazette('g47-2018', '47/2018', '2018-06-22'),
      gazette('g33-2021', '33/2021', '2021-04-02'),
      gazette('g9-2024', '9/2024', '2024-02-15'),
    ],
    status: versionId === 'v4' ? STATUS.inForce : STATUS.noLonger,
    versionId,
    versions: LAW_VERSIONS,
    amendments: LAW_AMENDMENTS,
    nodes: lawNodes(versionId),
    footnotes: [
      {
        id: 'f1',
        mark: '1',
        content: [
          'Illustrative footnote: the by-law in force is the Rulebook on Illustrative Site Records.',
        ],
      },
    ],
    lang: 'en',
  }
}

// ── The related acts and the practice ─────────────────────────────────────────────────────────

/** A related act by its id in the search's list, with what ties it. */
function related(
  id: string,
  type: string,
  title: string,
  actStatus: LegalStatus,
  note: string | undefined,
  articleIds?: string[],
): RelatedAct {
  return {
    id,
    type,
    title,
    status: actStatus,
    href: `#${actRoute(id)}`,
    ...(note === undefined ? {} : { note }),
    ...(articleIds === undefined ? {} : { articleIds }),
  }
}

export const LAW_LOWER: RelatedAct[] = [
  related(
    'site-records',
    'Rulebook',
    'Rulebook on Illustrative Site Records',
    STATUS.inForce,
    'Based on Article 63 of this Law',
    ['a57', 'a63'],
  ),
]

export const LAW_REFERS_TO: RelatedAct[] = [
  related(
    'safety-at-work',
    'Law',
    'Law on Illustrative Safety at Work',
    STATUS.partly,
    'Article 90 refers to',
    ['a90'],
  ),
]

export const LAW_REFERRED_BY: RelatedAct[] = [
  related(
    'site-records',
    'Rulebook',
    'Rulebook on Illustrative Site Records',
    STATUS.inForce,
    'Article 1 refers to Article 63',
    ['a63'],
  ),
  related(
    'site-signs',
    'Rulebook',
    'Rulebook on Illustrative Site Signs',
    STATUS.noLonger,
    'Article 2 referred to Article 90',
    ['a90'],
  ),
  related(
    'construction-fees',
    'Decree',
    'Decree on Illustrative Construction Fees',
    STATUS.notYet,
    'Article 4 refers to Article 12',
    ['a12'],
  ),
  related(
    'work-rulebook',
    'Internal act',
    'Kvadrat Gradnja d.o.o. — Work Rulebook',
    STATUS.inForce,
    'Article 14 refers to Article 57',
    ['a57'],
  ),
]

/** The two decisions and the opinion, as the law's practice panel lists them. */
export const LAW_PRACTICE: PracticeItem[] = [
  {
    id: 'gz-101-2022',
    kind: 'decision',
    issuer: 'Illustrative Appellate Court',
    number: 'Gž 101/2022',
    date: '2022-11-14',
    summary:
      'Site records written after the works were handed over do not prove when the works were done.',
    href: `#${practiceRoute('gz-101-2022')}`,
    articleIds: ['a57'],
  },
  {
    id: 'rev-202-2023',
    kind: 'decision',
    issuer: 'Illustrative Supreme Court',
    number: 'Rev 202/2023',
    date: '2023-09-21',
    summary:
      'A contractor who kept no site records has to prove by other means on which days the works were done.',
    href: `#${practiceRoute('rev-202-2023')}`,
    articleIds: ['a57', 'a12'],
  },
  {
    id: 'opinion-011-00-55-2023',
    kind: 'opinion',
    issuer: 'Illustrative Ministry',
    number: 'opinion 011-00-55/2023',
    date: '2023-05-30',
    summary:
      'Electronic site records meet the Rulebook when each entry carries its author and its time.',
    href: `#${practiceRoute('opinion-011-00-55-2023')}`,
    articleIds: ['a57', 'a63'],
  },
]

/** Milica Petrović's notes and bookmarks on the law (the application keeps them). */
export const LAW_NOTES: LegalNote[] = [
  { id: 'n1', articleId: 'a57', kind: 'bookmark', created: '2026-09-30' },
  {
    id: 'n2',
    articleId: 'a57',
    kind: 'note',
    text: 'Bulevar Evrope 24: the supervising engineer signs within three days; check the entries every Friday.',
    created: '2026-10-02',
  },
  {
    id: 'n3',
    kind: 'note',
    text: 'Compare the 2021 version for the works started before April 2021.',
    created: '2026-10-05',
  },
]

/** The citation the application copies, for the toast. */
export const LAW_CITATION =
  'Law on Illustrative Building Works (Illustrative Gazette No. 12/2016, 47/2018, 33/2021 and 9/2024)'

// ── The Rulebook on Illustrative Site Records (the law's by-law) ──────────────────────────────

/** The by-law in one of its two versions. */
export function byLawVersion(versionId: string): LegalAct {
  const amended = versionId === 's2'
  const rule = (id: string, title: string, paragraphs: LegalParagraph[], more = {}) =>
    article('site-records', id, title, paragraphs, more)
  return {
    id: 'site-records',
    type: 'Rulebook',
    title: 'Rulebook on Illustrative Site Records',
    issuer: 'Illustrative Ministry',
    gazette: [
      gazette('g21-2016', 'No. 21/2016', '2016-03-25'),
      gazette('g40-2021', '40/2021', '2021-05-07'),
    ],
    status: amended ? STATUS.inForce : STATUS.noLonger,
    versionId,
    versions: [
      { id: 's1', from: '2016-04-02', to: '2021-05-14', status: STATUS.noLonger },
      { id: 's2', from: '2021-05-15', amendmentId: 'sa1' },
    ],
    amendments: [
      {
        id: 'sa1',
        label: 'Rulebook amending the Rulebook on Illustrative Site Records',
        gazette: gazette('g40-2021', 'No. 40/2021', '2021-05-07'),
        appliesFrom: '2021-05-15',
        articleIds: ['s7'],
      },
    ],
    nodes: [
      rule('s1', 'Subject', [
        text(
          's1-1',
          'Based on ',
          lawRef('63', 'Article 63 of the Law on Illustrative Building Works'),
          ', this Rulebook prescribes the content of the site records.',
        ),
      ]),
      rule('s3', 'Parts of the site records', [
        text(
          's3-1',
          'The site records consist of the site diary, the site book and the record of handed-over works.',
        ),
      ]),
      rule(
        's7',
        'Electronic site records',
        [
          text(
            's7-1',
            amended
              ? 'Electronic site records are kept in an application that records the author and the time of each entry.'
              : 'Site records are kept on paper, in a bound book with numbered pages.',
          ),
        ],
        amended ? { changes: [change('sa1', 'Amended by No. 40/2021', '2021-05-15')] } : {},
      ),
    ],
    lang: 'en',
  }
}

export const BY_LAW_HIGHER: RelatedAct[] = [
  related(
    'building-works',
    'Law',
    'Law on Illustrative Building Works',
    STATUS.inForce,
    'Based on Article 63 of the Law on Illustrative Building Works',
    ['s1'],
  ),
]

export const BY_LAW_PRACTICE: PracticeItem[] = [
  {
    id: 'opinion-011-00-55-2023',
    kind: 'opinion',
    issuer: 'Illustrative Ministry',
    number: 'opinion 011-00-55/2023',
    date: '2023-05-30',
    summary:
      'Electronic site records meet the Rulebook when each entry carries its author and its time.',
    href: `#${practiceRoute('opinion-011-00-55-2023')}`,
    articleIds: ['s7'],
  },
]

// ── Kvadrat Gradnja d.o.o. — Work Rulebook ────────────────────────────────────────────────────

/** The rulebook in one of its two versions (2022, 2025). An internal act: no gazette. */
export function rulebookVersion(versionId: string): LegalAct {
  const amended = versionId === 'w2'
  const rule = (id: string, title: string, paragraphs: LegalParagraph[], more = {}) =>
    article('work-rulebook', id, title, paragraphs, more)
  return {
    id: 'work-rulebook',
    type: 'Internal act',
    title: 'Kvadrat Gradnja d.o.o. — Work Rulebook',
    issuer: 'Kvadrat Gradnja d.o.o.',
    gazette: [],
    status: amended ? STATUS.inForce : STATUS.noLonger,
    versionId,
    versions: [
      { id: 'w1', from: '2022-02-01', to: '2025-02-28', status: STATUS.noLonger },
      { id: 'w2', from: '2025-03-01', amendmentId: 'wa1' },
    ],
    amendments: [
      {
        id: 'wa1',
        label: 'Decision amending the Work Rulebook',
        gazette: { id: 'd3-2025', label: 'Decision No. 3/2025', published: '2025-02-20' },
        appliesFrom: '2025-03-01',
        articleIds: ['w20'],
      },
    ],
    nodes: [
      {
        kind: 'heading',
        id: 'wc1',
        level: 2,
        label: 'Chapter I',
        title: 'Work on the building site',
        children: [
          rule('w1', 'Subject', [
            text(
              'w1-1',
              'This Rulebook sets the site records and the working hours of Kvadrat Gradnja d.o.o.’s site crews. It is an illustrative internal act.',
            ),
          ]),
          rule('w14', 'Site records', [
            text(
              'w14-1',
              'The site manager signs the site records at the end of each working day, as ',
              lawRef('57', 'Article 57 of the Law on Illustrative Building Works'),
              ' requires.',
            ),
          ]),
          rule(
            'w20',
            'Working hours',
            [
              text(
                'w20-1',
                amended
                  ? 'Working hours on the building site are from 07:00 to 15:00, Monday to Friday.'
                  : 'Working hours on the building site are from 07:00 to 15:00, Monday to Saturday.',
              ),
            ],
            amended
              ? { changes: [change('wa1', 'Amended by Decision No. 3/2025', '2025-03-01')] }
              : {},
          ),
        ],
      },
    ],
    lang: 'en',
  }
}

/** The rulebook's legal basis. */
export const RULEBOOK_HIGHER: RelatedAct[] = [
  related(
    'building-works',
    'Law',
    'Law on Illustrative Building Works',
    STATUS.inForce,
    'Based on Articles 12 and 57 of the Law on Illustrative Building Works',
    ['w14'],
  ),
  related(
    'safety-at-work',
    'Law',
    'Law on Illustrative Safety at Work',
    STATUS.partly,
    'Based on Article 22 of the Law on Illustrative Safety at Work',
  ),
]

export const RULEBOOK_REFERS_TO: RelatedAct[] = [
  related(
    'building-works',
    'Law',
    'Law on Illustrative Building Works',
    STATUS.inForce,
    'Article 14 refers to Article 57',
    ['w14'],
  ),
]

// ── Short pages: further acts, the decisions and the opinion ──────────────────────────────────

/** An act of one version and one article, as the search lists it. */
function shortAct(input: {
  id: string
  type: string
  title: string
  issuer: string
  gazette: GazetteReference[]
  status: LegalStatus
  from: string
  to?: string
  /** The article's number, or none for a decision's holding. */
  number?: string
  heading: string
  body: string
}): LegalAct {
  const node: LegalArticle = {
    kind: 'article',
    id: `x${input.number ?? '0'}`,
    label: input.number === undefined ? input.heading : `Article ${input.number}`,
    ...(input.number === undefined ? {} : { title: input.heading }),
    href:
      input.number === undefined
        ? `#${practiceRoute(input.id)}`
        : `#${articleRoute(input.id, input.number)}`,
    paragraphs: [text(`${input.id}-1`, input.body)],
  }
  return {
    id: input.id,
    type: input.type,
    title: input.title,
    issuer: input.issuer,
    gazette: input.gazette,
    status: input.status,
    versionId: `${input.id}-v1`,
    versions: [
      {
        id: `${input.id}-v1`,
        from: input.from,
        ...(input.to === undefined ? {} : { to: input.to }),
      },
    ],
    amendments: [],
    nodes: [node],
    lang: 'en',
  }
}

export const SHORT_ACTS: LegalAct[] = [
  shortAct({
    id: 'site-signs',
    type: 'Rulebook',
    title: 'Rulebook on Illustrative Site Signs',
    issuer: 'Illustrative Ministry',
    gazette: [gazette('g5-2016', 'No. 5/2016', '2016-01-22')],
    status: STATUS.noLonger,
    from: '2016-01-30',
    to: '2021-04-09',
    number: '2',
    heading: 'Content of the site sign',
    body: 'The site sign names the investor, the contractor and the place where the site records are kept.',
  }),
  shortAct({
    id: 'safety-at-work',
    type: 'Law',
    title: 'Law on Illustrative Safety at Work',
    issuer: 'Illustrative Assembly',
    gazette: [
      gazette('g18-2017', 'No. 18/2017', '2017-03-03'),
      gazette('g33-2021b', '33/2021', '2021-04-02'),
    ],
    status: STATUS.partly,
    from: '2017-03-11',
    number: '22',
    heading: 'Safety training',
    body: 'The employer keeps a record of the safety training of every worker on the building site.',
  }),
  shortAct({
    id: 'construction-fees',
    type: 'Decree',
    title: 'Decree on Illustrative Construction Fees',
    issuer: 'Illustrative Government',
    gazette: [gazette('g9-2024b', 'No. 9/2024', '2024-02-15')],
    status: STATUS.notYet,
    from: '2027-01-01',
    number: '4',
    heading: 'Permit fee',
    body: 'The fee for a building permit is paid before the permit is issued.',
  }),
  ...LAW_PRACTICE.map((item) =>
    shortAct({
      id: item.id,
      type: item.kind === 'decision' ? 'Court decision' : 'Opinion',
      title: `${item.issuer}, ${item.number}`,
      issuer: item.issuer,
      gazette: [],
      status: STATUS.final,
      from: item.date,
      heading: item.kind === 'decision' ? 'Holding' : 'Opinion',
      body: item.summary,
    }),
  ),
]

/** What a short page lists as the acts it concerns: the law, at the articles the item names. */
export function shortActRefersTo(id: string): RelatedAct[] {
  const item = LAW_PRACTICE.find((each) => each.id === id)
  if (item === undefined) return []
  return [
    related(
      'building-works',
      'Law',
      'Law on Illustrative Building Works',
      STATUS.inForce,
      item.articleIds.map((each) => `Article ${each.slice(1)}`).join(', '),
    ),
  ]
}
