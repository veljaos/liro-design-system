/*
 * The illustrative acts of the legal page's stories (P5.27). Invented: the gazette is the
 * "Illustrative Gazette", the acts, articles, courts and numbers are made up for the examples and
 * copy no real text. Not part of the package: nothing in src/index.ts imports this file. No
 * classes here (Storybook compiles classes only from *.stories.tsx files).
 */
import type {
  LegalAct,
  LegalAmendment,
  LegalNode,
  LegalNote,
  LegalStatus,
  PracticeItem,
  RelatedAct,
} from './legal-model'

export const IN_FORCE: LegalStatus = { id: 'in-force', label: 'In force', tone: 'success' }
export const PARTLY_IN_FORCE: LegalStatus = {
  id: 'partly',
  label: 'Partly in force',
  tone: 'warning',
}
export const NO_LONGER: LegalStatus = {
  id: 'repealed',
  label: 'No longer in force',
  tone: 'neutral',
}

export const GAZETTE_NAME = 'Illustrative Gazette'

/** The note every story with an act shows: the act is invented. */
export const ILLUSTRATIVE_NOTE =
  'Illustrative: an invented act, gazette and numbers, written for the design system’s examples.'

const ACT = '#legal/acts/building-works'

/** "Article 57" and its address. */
function at(id: string) {
  return `${ACT}#${id}`
}

export const AMENDMENTS: LegalAmendment[] = [
  {
    id: 'am1',
    label: 'Law amending the Law on Illustrative Building Works',
    gazette: { id: 'g2', label: 'No. 47/2018', published: '2018-06-15', href: '#gazette/2018/47' },
    appliesFrom: '2018-06-23',
    articleIds: ['a12', 'a57'],
    href: '#legal/acts/building-works-amendment-2018',
  },
  {
    id: 'am2',
    label: 'Law amending the Law on Illustrative Building Works',
    gazette: { id: 'g3', label: 'No. 33/2021', published: '2021-04-09', href: '#gazette/2021/33' },
    appliesFrom: '2021-04-17',
    articleIds: ['a20', 'a57'],
    href: '#legal/acts/building-works-amendment-2021',
  },
  {
    id: 'am3',
    label: 'Law amending the Law on Illustrative Building Works',
    gazette: { id: 'g4', label: 'No. 9/2024', published: '2024-02-02', href: '#gazette/2024/9' },
    appliesFrom: '2024-02-10',
    articleIds: ['a63', 'a90'],
    articlesText: 'Articles 63 and 90',
    href: '#legal/acts/building-works-amendment-2024',
  },
]

export const NODES: LegalNode[] = [
  {
    kind: 'heading',
    id: 'p1',
    level: 1,
    label: 'Part One',
    title: 'General provisions',
    children: [
      {
        kind: 'article',
        id: 'a1',
        label: 'Article 1',
        title: 'Subject',
        href: at('a1'),
        paragraphs: [
          {
            id: 'a1-1',
            content: [
              'This Law governs illustrative building works: their planning, permits, site records and supervision. It is invented for the examples of a design system.',
            ],
          },
        ],
      },
      {
        kind: 'article',
        id: 'a2',
        label: 'Article 2',
        title: 'Meaning of terms',
        href: at('a2'),
        paragraphs: [
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
                  '“site records” are the records of the works kept under ',
                  {
                    kind: 'ref',
                    text: 'Article 57',
                    target: { articleId: 'a57', href: at('a57') },
                  },
                  ' of this Law.',
                ],
              },
            ],
          },
        ],
      },
      {
        kind: 'article',
        id: 'a12',
        label: 'Article 12',
        title: 'Site manager',
        href: at('a12'),
        changes: [
          { amendmentId: 'am1', label: 'Amended by No. 47/2018', appliesFrom: '2018-06-23' },
        ],
        paragraphs: [
          {
            id: 'a12-1',
            label: '(1)',
            content: ['The contractor appoints a site manager for every building site.'],
          },
          {
            id: 'a12-2',
            label: '(2)',
            content: [
              'The site manager signs the site records ',
              { kind: 'emphasis', text: 'every working day' },
              '.',
            ],
          },
        ],
      },
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
        title: 'Permits',
        children: [
          {
            kind: 'article',
            id: 'a20',
            label: 'Article 20',
            href: at('a20'),
            deleted: 'Deleted (No. 33/2021)',
            changes: [
              { amendmentId: 'am2', label: 'Deleted by No. 33/2021', appliesFrom: '2021-04-17' },
            ],
            paragraphs: [],
          },
          {
            kind: 'article',
            id: 'a57',
            label: 'Article 57',
            title: 'Site records',
            href: at('a57'),
            changes: [
              { amendmentId: 'am1', label: 'Amended by No. 47/2018', appliesFrom: '2018-06-23' },
              { amendmentId: 'am2', label: 'Amended by No. 33/2021', appliesFrom: '2021-04-17' },
            ],
            paragraphs: [
              {
                id: 'a57-1',
                label: '(1)',
                content: [
                  'The investor keeps site records for every building site from the day the works begin.',
                ],
              },
              {
                id: 'a57-2',
                label: '(2)',
                content: ['Site records contain:'],
                points: [
                  { id: 'a57-2-1', label: '1)', content: ['the daily entries of the works done;'] },
                  {
                    id: 'a57-2-2',
                    label: '2)',
                    content: ['the entries of the supervising engineer, with:'],
                    points: [
                      { id: 'a57-2-2-a', label: 'a)', content: ['the day of the visit;'] },
                      { id: 'a57-2-2-b', label: 'b)', content: ['what was found.'] },
                    ],
                  },
                ],
              },
              {
                id: 'a57-3',
                label: '(3)',
                content: [
                  'The form of site records is prescribed by the by-law under ',
                  {
                    kind: 'ref',
                    text: 'Article 63',
                    target: { articleId: 'a63', href: at('a63') },
                  },
                  '.',
                  { kind: 'footnote', id: 'f1', mark: '1' },
                ],
              },
            ],
          },
        ],
      },
      {
        kind: 'heading',
        id: 'c2',
        level: 2,
        label: 'Chapter II',
        title: 'Supervision',
        children: [
          {
            kind: 'article',
            id: 'a63',
            label: 'Article 63',
            title: 'By-laws',
            href: at('a63'),
            changes: [
              { amendmentId: 'am3', label: 'Amended by No. 9/2024', appliesFrom: '2024-02-10' },
            ],
            paragraphs: [
              {
                id: 'a63-1',
                content: [
                  'The minister responsible for construction prescribes the content of site records and the manner of keeping them referred to in ',
                  {
                    kind: 'ref',
                    text: 'Article 57',
                    target: { articleId: 'a57', href: at('a57') },
                  },
                  ' of this Law.',
                ],
              },
            ],
          },
          {
            kind: 'article',
            id: 'a90',
            label: 'Article 90',
            title: 'Electronic site records',
            href: at('a90'),
            inForceFrom: '2027-01-01',
            changes: [
              { amendmentId: 'am3', label: 'Added by No. 9/2024', appliesFrom: '2027-01-01' },
            ],
            paragraphs: [
              {
                id: 'a90-1',
                content: [
                  'Site records may be kept electronically, signed with a qualified signature.',
                ],
              },
            ],
          },
        ],
      },
    ],
  },
]

/** The Law on Illustrative Building Works, the version in force. */
export const LAW: LegalAct = {
  id: 'building-works',
  type: 'Law',
  title: 'Law on Illustrative Building Works',
  issuer: 'Illustrative National Assembly',
  gazette: [
    { id: 'g1', label: 'No. 12/2016', published: '2016-02-19', href: '#gazette/2016/12' },
    { id: 'g2', label: '47/2018', published: '2018-06-15', href: '#gazette/2018/47' },
    { id: 'g3', label: '33/2021', published: '2021-04-09', href: '#gazette/2021/33' },
    { id: 'g4', label: '9/2024', published: '2024-02-02', href: '#gazette/2024/9' },
  ],
  status: PARTLY_IN_FORCE,
  versionId: 'v4',
  versions: [
    { id: 'v1', from: '2016-02-27', to: '2018-06-22' },
    { id: 'v2', from: '2018-06-23', to: '2021-04-16', amendmentId: 'am1' },
    { id: 'v3', from: '2021-04-17', to: '2024-02-09', amendmentId: 'am2' },
    { id: 'v4', from: '2024-02-10', amendmentId: 'am3' },
  ],
  amendments: AMENDMENTS,
  nodes: NODES,
  footnotes: [
    {
      id: 'f1',
      mark: '1',
      content: ['Illustrative footnote: paragraph 3 as worded by No. 33/2021.'],
    },
  ],
  lang: 'en',
}

export const HIGHER: RelatedAct[] = [
  {
    id: 'constitution',
    type: 'Constitution',
    title: 'Illustrative Constitution',
    status: IN_FORCE,
    href: '#legal/acts/constitution',
    note: 'Based on Article 97 of the Illustrative Constitution',
  },
]

export const LOWER: RelatedAct[] = [
  {
    id: 'site-records',
    type: 'Rulebook',
    title: 'Rulebook on Illustrative Site Records',
    status: IN_FORCE,
    href: '#legal/acts/site-records',
    note: 'Based on Article 63 of this Law',
    articleIds: ['a57', 'a63'],
  },
]

export const REFERS_TO: RelatedAct[] = [
  {
    id: 'planning',
    type: 'Law',
    title: 'Law on Illustrative Spatial Planning',
    status: IN_FORCE,
    href: '#legal/acts/planning',
    note: 'Article 12 refers to',
    articleIds: ['a12'],
  },
  {
    id: 'procedure',
    type: 'Law',
    title: 'Law on Illustrative Administrative Procedure',
    status: IN_FORCE,
    href: '#legal/acts/procedure',
    articleIds: ['a20'],
  },
  {
    id: 'classes',
    type: 'Decree',
    title: 'Decree on Illustrative Building Classes',
    status: NO_LONGER,
    href: '#legal/acts/classes',
    note: 'Article 2 refers to',
    articleIds: ['a2'],
  },
]

export const REFERRED_BY: RelatedAct[] = [
  {
    id: 'site-records-ref',
    type: 'Rulebook',
    title: 'Rulebook on Illustrative Site Records',
    status: IN_FORCE,
    href: '#legal/acts/site-records',
    note: 'Articles 3 and 8 refer to Article 57',
    articleIds: ['a57'],
  },
  {
    id: 'work-rulebook',
    type: 'Internal act',
    title: 'Kvadrat Gradnja d.o.o. — Work Rulebook',
    status: IN_FORCE,
    href: '#legal/acts/work-rulebook',
    note: 'Article 14 refers to Article 57',
    articleIds: ['a57'],
  },
]

export const PRACTICE: PracticeItem[] = [
  {
    id: 'd1',
    kind: 'decision',
    issuer: 'Illustrative Appellate Court',
    number: 'Gž 101/2022',
    date: '2022-05-12',
    summary: 'Site records kept on paper meet Article 57 when the site manager signs every page.',
    href: '#legal/practice/gz-101-2022',
    articleIds: ['a57'],
  },
  {
    id: 'd2',
    kind: 'decision',
    issuer: 'Illustrative Supreme Court',
    number: 'Rev 202/2023',
    date: '2023-11-03',
    summary: 'An entry made after the inspection does not replace a missing daily entry.',
    href: '#legal/practice/rev-202-2023',
    articleIds: ['a57', 'a12'],
  },
  {
    id: 'o1',
    kind: 'opinion',
    issuer: 'Illustrative Ministry',
    number: 'opinion 011-00-55/2023',
    date: '2023-03-20',
    summary: 'A subcontractor’s site manager signs the entries of the works he manages.',
    href: '#legal/practice/011-00-55-2023',
    articleIds: ['a57', 'a12'],
  },
]

export const NOTES: LegalNote[] = [
  { id: 'n1', articleId: 'a57', kind: 'bookmark', created: '2026-09-30' },
  {
    id: 'n2',
    articleId: 'a12',
    kind: 'note',
    text: 'Check the signatures with the site manager before the inspection on 20.10.',
    created: '2026-10-02',
  },
  {
    id: 'n3',
    kind: 'note',
    text: 'Compare with the 2021 version for the Bulevar Evrope 24 site.',
    created: '2026-10-05',
  },
]

/** A by-law with one version and nothing related: the panels' empty states. */
export const EMPTY_ACT: LegalAct = {
  id: 'site-records',
  type: 'Rulebook',
  title: 'Rulebook on Illustrative Site Records',
  issuer: 'Illustrative Ministry',
  gazette: [{ id: 's1', label: 'No. 70/2016' }],
  status: IN_FORCE,
  versionId: 's-v1',
  versions: [{ id: 's-v1', from: '2016-08-01' }],
  amendments: [],
  nodes: [
    {
      kind: 'article',
      id: 's1',
      label: 'Article 1',
      href: '#legal/acts/site-records#s1',
      paragraphs: [
        {
          id: 's1-1',
          content: ['This Rulebook prescribes the form of illustrative site records.'],
        },
      ],
    },
  ],
}

/** The long title of a long story. */
export const LONG_ACT: LegalAct = {
  ...LAW,
  title:
    'Law on Illustrative Building Works, Site Records, the Supervision of Construction and the Electronic Keeping of Building Documentation in Illustrative Municipalities',
  issuer:
    'Illustrative National Assembly of the Illustrative Republic, in its second regular session',
  gazette: [
    ...LAW.gazette,
    { id: 'g5', label: '14/2025', href: '#gazette/2025/14' },
    { id: 'g6', label: '52/2025 – illustrative decision of the Illustrative Constitutional Court' },
  ],
}

/** An Arabic act (invented): its text and words right to left. */
export const ARABIC_ACT: LegalAct = {
  id: 'ar',
  type: 'قانون',
  title: 'قانون أعمال البناء التوضيحية',
  issuer: 'الجمعية الوطنية التوضيحية',
  gazette: [
    { id: 'ar1', label: 'العدد 12/2016', href: '#ar/1' },
    { id: 'ar2', label: '47/2018', href: '#ar/2' },
  ],
  status: { id: 'in-force', label: 'ساري', tone: 'success' },
  versionId: 'ar-v2',
  versions: [
    { id: 'ar-v1', from: '2016-02-27', to: '2018-06-22' },
    { id: 'ar-v2', from: '2018-06-23', amendmentId: 'ar-am1' },
  ],
  amendments: [
    {
      id: 'ar-am1',
      label: 'قانون تعديل قانون أعمال البناء التوضيحية',
      gazette: { id: 'ar2', label: 'العدد 47/2018', published: '2018-06-15' },
      appliesFrom: '2018-06-23',
      articleIds: ['ar57'],
    },
  ],
  nodes: [
    {
      kind: 'article',
      id: 'ar57',
      label: 'المادة 57',
      title: 'سجلات الموقع',
      href: '#ar/57',
      changes: [
        { amendmentId: 'ar-am1', label: 'معدلة بالعدد 47/2018', appliesFrom: '2018-06-23' },
      ],
      paragraphs: [
        { id: 'ar57-1', label: '(1)', content: ['يحتفظ المستثمر بسجلات لكل موقع بناء.'] },
      ],
    },
  ],
  lang: 'ar',
}

export const ARABIC_PRACTICE: PracticeItem[] = [
  {
    id: 'ar-d1',
    kind: 'decision',
    issuer: 'محكمة الاستئناف التوضيحية',
    number: 'Gž 101/2022',
    date: '2022-05-12',
    summary: 'تفي السجلات الورقية بالمادة 57 إذا وقّع مدير الموقع كل صفحة.',
    href: '#ar/d1',
    articleIds: ['ar57'],
  },
]

/** A Japanese act (invented). */
export const JAPANESE_ACT: LegalAct = {
  id: 'ja',
  type: '法律',
  title: '例示建築工事法',
  issuer: '例示国会',
  gazette: [
    { id: 'ja1', label: '第12/2016号', href: '#ja/1' },
    { id: 'ja2', label: '第47/2018号', href: '#ja/2' },
  ],
  status: { id: 'in-force', label: '施行中', tone: 'success' },
  versionId: 'ja-v2',
  versions: [
    { id: 'ja-v1', from: '2016-02-27', to: '2018-06-22' },
    { id: 'ja-v2', from: '2018-06-23', amendmentId: 'ja-am1' },
  ],
  amendments: [
    {
      id: 'ja-am1',
      label: '例示建築工事法の一部を改正する法律',
      gazette: { id: 'ja2', label: '第47/2018号', published: '2018-06-15' },
      appliesFrom: '2018-06-23',
      articleIds: ['ja57'],
    },
  ],
  nodes: [
    {
      kind: 'article',
      id: 'ja57',
      label: '第五十七条',
      title: '工事記録',
      href: '#ja/57',
      changes: [
        { amendmentId: 'ja-am1', label: '第47/2018号により改正', appliesFrom: '2018-06-23' },
      ],
      paragraphs: [{ id: 'ja57-1', content: ['施主は、工事現場ごとに工事記録を備える。'] }],
    },
  ],
  lang: 'ja',
}

export const JAPANESE_PRACTICE: PracticeItem[] = [
  {
    id: 'ja-d1',
    kind: 'decision',
    issuer: '例示高等裁判所',
    number: 'Gž 101/2022',
    date: '2022-05-12',
    summary: '現場責任者が各頁に署名した紙の記録は第五十七条を満たす。',
    href: '#ja/d1',
    articleIds: ['ja57'],
  },
]
