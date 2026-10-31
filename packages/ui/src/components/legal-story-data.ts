import type {
  LegalArticle,
  LegalFootnote,
  LegalInline,
  LegalNode,
  LegalParagraph,
  LegalStatus,
  LegalTarget,
} from './legal-model'

/*
 * The story data of legal information, shared by the stories of LegalText, LegalContents
 * and LegalCompare, the act page and the search page. Not part of the package: nothing in
 * src/index.ts imports this file.
 *
 * **Every act here is invented** and says so: the gazette is the "Illustrative Gazette", the law
 * is the "Law on Illustrative Building Works", its by-law the "Rulebook on Illustrative Site
 * Records", the company's act "Kvadrat Gradnja d.o.o. — Work Rulebook". No text is copied from a
 * real act, a consolidated text or a commentary; every article was written for these stories.
 */

const LAW = '#/legal/acts/building-works'
const RULEBOOK = '#/legal/acts/site-records'
const COMPANY = '#/legal/acts/kvadrat-work-rulebook'

/** A paragraph from its id, label and text runs. */
function p(id: string, label: string | undefined, ...content: LegalInline[]): LegalParagraph {
  return { id, ...(label === undefined ? {} : { label }), content }
}

/** A reference to an article of the law. */
function lawRef(text: string, article: number): LegalInline {
  return {
    kind: 'ref',
    text,
    target: { articleId: `a${String(article)}`, href: `${LAW}/article-${String(article)}` },
  }
}

/** A reference to an article of the rulebook (another act). */
function rulebookRef(text: string, article: number): LegalInline {
  return {
    kind: 'ref',
    text,
    target: {
      actId: 'illustrative-site-records',
      articleId: `r${String(article)}`,
      href: `${RULEBOOK}/article-${String(article)}`,
    },
  }
}

function article(
  number: number,
  title: string | undefined,
  paragraphs: LegalParagraph[],
  more: Partial<LegalArticle> = {},
): LegalArticle {
  return {
    kind: 'article',
    id: `a${String(number)}`,
    label: `Article ${String(number)}`,
    ...(title === undefined ? {} : { title }),
    paragraphs,
    href: `${LAW}/article-${String(number)}`,
    ...more,
  }
}

export const STATUS_IN_FORCE: LegalStatus = { id: 'in-force', label: 'In force', tone: 'success' }
export const STATUS_OLD: LegalStatus = {
  id: 'no-longer',
  label: 'No longer in force',
  tone: 'neutral',
}

const CHANGE_2018 = {
  amendmentId: 'am-2018',
  label: 'Amended by No. 47/2018',
  appliesFrom: '2018-07-01',
}
const CHANGE_2021 = {
  amendmentId: 'am-2021',
  label: 'Amended by No. 33/2021',
  appliesFrom: '2021-05-15',
}
const CHANGE_2024 = {
  amendmentId: 'am-2024',
  label: 'Amended by No. 9/2024',
  appliesFrom: '2024-03-01',
}

// ── The Law on Illustrative Building Works, current version (9/2024) ──

const LAW_ARTICLE_1 = article(1, 'Subject', [
  p(
    'a1p1',
    '(1)',
    'This Law sets out illustrative rules for building works, site records and the supervision of works.',
  ),
  p(
    'a1p2',
    '(2)',
    'The rules of this Law are invented for the Liro Design System and have no legal effect.',
    { kind: 'footnote', id: 'fn1', mark: '1' },
  ),
])

const LAW_ARTICLE_2 = article(2, 'Meaning of terms', [
  {
    id: 'a2p1',
    content: ['In this Law:'],
    points: [
      {
        id: 'a2p1i1',
        label: '1)',
        content: ['“works” means building, extending or repairing a structure;'],
      },
      {
        id: 'a2p1i2',
        label: '2)',
        content: ['“site” means the land on which works are carried out;'],
      },
      {
        id: 'a2p1i3',
        label: '3)',
        content: ['“contractor” means the person who carries out the works, namely:'],
        points: [
          { id: 'a2p1i3a', label: 'a)', content: ['the main contractor;'] },
          { id: 'a2p1i3b', label: 'b)', content: ['a subcontractor named in the site diary.'] },
        ],
      },
    ],
  },
])

const LAW_ARTICLE_3 = article(
  3,
  'Application',
  [
    p(
      'a3p1',
      '(1)',
      'This Law applies to all works on a site, except the small works listed in ',
      lawRef('Article 12', 12),
      '.',
    ),
    p(
      'a3p2',
      '(2)',
      'The keeping of site records is further regulated by ',
      rulebookRef('Article 4 of the Rulebook on Illustrative Site Records', 4),
      '.',
    ),
  ],
  { changes: [CHANGE_2018] },
)

const LAW_ARTICLE_4 = article(4, 'Permit required', [
  p(
    'a4p1',
    undefined,
    'Works may begin only under a building permit issued under ',
    lawRef('Article 5', 5),
    '. ',
    { kind: 'emphasis', text: 'A permit cannot be given after the works have begun.' },
  ),
])

const LAW_ARTICLE_5 = article(
  5,
  'Issuing the permit',
  [
    p(
      'a5p1',
      '(1)',
      'The illustrative authority issues the building permit within 30 days of a complete request.',
    ),
    p(
      'a5p2',
      '(2)',
      'The request includes the design, proof of the right to build and the site plan.',
    ),
    p('a5p3', '(3)', 'A permit is valid for three years and may be extended once, for two years.'),
  ],
  { changes: [CHANGE_2021, CHANGE_2024] },
)

const LAW_ARTICLE_6 = article(
  6,
  undefined,
  [
    p(
      'a6p1',
      undefined,
      'A temporary permit could be issued for works lasting less than one year.',
    ),
  ],
  { deleted: 'Deleted (No. 33/2021)', changes: [CHANGE_2021] },
)

const LAW_ARTICLE_7 = article(7, 'Site diary', [
  p(
    'a7p1',
    '(1)',
    'The contractor keeps a ',
    { kind: 'emphasis', text: 'site diary' },
    ' for each site, from the first day of works until the last.',
  ),
  p(
    'a7p2',
    '(2)',
    'The form of the site diary is set out in ',
    rulebookRef('Article 2 of the Rulebook on Illustrative Site Records', 2),
    '.',
  ),
])

const LAW_ARTICLE_8 = article(
  8,
  'Electronic site records',
  [
    p(
      'a8p1',
      '(1)',
      'The site diary may be kept electronically, in the illustrative register of sites.',
    ),
    p('a8p2', '(2)', 'An electronic entry is signed by the person who made it.'),
  ],
  {
    changes: [{ ...CHANGE_2024, appliesFrom: '2027-01-01' }],
    inForceFrom: '2027-01-01',
  },
)

const LAW_ARTICLE_9 = article(9, 'Supervision', [
  p(
    'a9p1',
    '(1)',
    'The illustrative inspector checks that works on a site have a permit under ',
    lawRef('Article 4', 4),
    ' and that the site diary under ',
    lawRef('Article 7', 7),
    ' is kept.',
  ),
  p('a9p2', '(2)', 'The inspector may stop works that are carried out without a permit.'),
])

const LAW_ARTICLE_10 = article(
  10,
  'Offences',
  [
    p(
      'a10p1',
      undefined,
      'A contractor who begins works without a permit under ',
      lawRef('Article 4', 4),
      ' commits an illustrative offence.',
    ),
  ],
  { changes: [CHANGE_2018] },
)

const LAW_ARTICLE_11 = article(11, 'Entry into force', [
  p(
    'a11p1',
    undefined,
    'This Law enters into force on the eighth day after its publication in the Illustrative Gazette.',
  ),
])

/** The Law on Illustrative Building Works as in force from 1.3.2024 (No. 9/2024). */
export const LAW_NODES: LegalNode[] = [
  {
    kind: 'heading',
    id: 'part-1',
    level: 1,
    label: 'Part One',
    title: 'General provisions',
    children: [LAW_ARTICLE_1, LAW_ARTICLE_2, LAW_ARTICLE_3],
  },
  {
    kind: 'heading',
    id: 'part-2',
    level: 1,
    label: 'Part Two',
    title: 'Permits and records',
    children: [
      {
        kind: 'heading',
        id: 'chapter-1',
        level: 2,
        label: 'Chapter I',
        title: 'Building permit',
        children: [LAW_ARTICLE_4, LAW_ARTICLE_5, LAW_ARTICLE_6],
      },
      {
        kind: 'heading',
        id: 'chapter-2',
        level: 2,
        label: 'Chapter II',
        title: 'Site records',
        children: [LAW_ARTICLE_7, LAW_ARTICLE_8],
      },
    ],
  },
  {
    kind: 'heading',
    id: 'part-3',
    level: 1,
    label: 'Part Three',
    title: 'Supervision and final provisions',
    children: [LAW_ARTICLE_9, LAW_ARTICLE_10, LAW_ARTICLE_11],
  },
]

export const LAW_FOOTNOTES: LegalFootnote[] = [
  {
    id: 'fn1',
    mark: '1',
    content: [
      'Illustrative Gazette No. 12/2016, 47/2018, 33/2021 and 9/2024. The gazette and its numbers are invented.',
    ],
  },
]

// ── The same law as in force from 1.7.2018 (No. 47/2018), for the comparison ──

/** The law as in force from 1.7.2018 until 14.5.2021: Article 5 and 6 differ, no Article 8. */
export const LAW_2018_NODES: LegalNode[] = [
  {
    kind: 'heading',
    id: 'part-1',
    level: 1,
    label: 'Part One',
    title: 'General provisions',
    children: [LAW_ARTICLE_1, LAW_ARTICLE_2, LAW_ARTICLE_3],
  },
  {
    kind: 'heading',
    id: 'part-2',
    level: 1,
    label: 'Part Two',
    title: 'Permits and records',
    children: [
      {
        kind: 'heading',
        id: 'chapter-1',
        level: 2,
        label: 'Chapter I',
        title: 'Building permit',
        children: [
          LAW_ARTICLE_4,
          article(5, 'Issuing the permit', [
            p(
              'a5p1',
              '(1)',
              'The illustrative authority issues the building permit within 60 days of a request.',
            ),
            p('a5p2', '(2)', 'The request includes the design and proof of the right to build.'),
            p('a5p3', '(3)', 'A permit is valid for two years.'),
          ]),
          article(6, 'Temporary permit', [
            p(
              'a6p1',
              undefined,
              'A temporary permit may be issued for works lasting less than one year.',
            ),
          ]),
        ],
      },
      {
        kind: 'heading',
        id: 'chapter-2',
        level: 2,
        label: 'Chapter II',
        title: 'Site records',
        children: [LAW_ARTICLE_7],
      },
    ],
  },
  {
    kind: 'heading',
    id: 'part-3',
    level: 1,
    label: 'Part Three',
    title: 'Supervision and final provisions',
    children: [LAW_ARTICLE_9, LAW_ARTICLE_10, LAW_ARTICLE_11],
  },
]

// ── The rulebook (another act), for the preview of a reference ──

function rulebookArticle(number: number, title: string, text: string): LegalArticle {
  return {
    kind: 'article',
    id: `r${String(number)}`,
    label: `Article ${String(number)}`,
    title,
    paragraphs: [p(`r${String(number)}p1`, undefined, text)],
    href: `${RULEBOOK}/article-${String(number)}`,
  }
}

export const RULEBOOK_ARTICLES: LegalArticle[] = [
  rulebookArticle(
    2,
    'Form of the site diary',
    'The site diary has numbered pages; each day of works takes a new page, signed by the site manager.',
  ),
  rulebookArticle(
    4,
    'Keeping of records',
    'Site records are kept on the site and shown to the illustrative inspector on request.',
  ),
]

/**
 * The application's lookup behind a reference's preview: an article of the law or of the
 * rulebook; a target it does not hold gives nothing.
 */
export function resolveIllustrativeTarget(target: LegalTarget): LegalArticle | undefined {
  if (target.actId === 'illustrative-site-records') {
    return RULEBOOK_ARTICLES.find((each) => each.id === target.articleId)
  }
  const all = [
    LAW_ARTICLE_1,
    LAW_ARTICLE_2,
    LAW_ARTICLE_3,
    LAW_ARTICLE_4,
    LAW_ARTICLE_5,
    LAW_ARTICLE_6,
    LAW_ARTICLE_7,
    LAW_ARTICLE_8,
    LAW_ARTICLE_9,
    LAW_ARTICLE_10,
    LAW_ARTICLE_11,
  ]
  return all.find((each) => each.id === target.articleId)
}

// ── Kvadrat Gradnja d.o.o. — Work Rulebook, 2022 and 2025 ──

function companyArticle(number: number, title: string, paragraphs: LegalParagraph[]): LegalArticle {
  return {
    kind: 'article',
    id: `k${String(number)}`,
    label: `Article ${String(number)}`,
    title,
    paragraphs,
    href: `${COMPANY}/article-${String(number)}`,
  }
}

const COMPANY_1 = companyArticle(1, 'Basis', [
  p(
    'k1p1',
    undefined,
    'This Work Rulebook is adopted on the basis of Article 7 of the Law on Illustrative Building Works (Illustrative Gazette No. 12/2016).',
  ),
])

/** The company's work rulebook, version 2022. */
export const COMPANY_2022_NODES: LegalNode[] = [
  COMPANY_1,
  companyArticle(2, 'Working hours', [
    p('k2p1', '(1)', 'Working hours on a site are from 7:00 to 15:00, Monday to Friday.'),
    p('k2p2', '(2)', 'The site manager may order work on Saturday for urgent works.'),
  ]),
  companyArticle(3, 'Protective equipment', [
    p('k3p1', undefined, 'Every worker wears a helmet and safety shoes on the site.'),
  ]),
  companyArticle(4, 'Site diary entries', [
    p('k4p1', undefined, 'The site manager writes the day’s entries in the site diary by 16:00.'),
  ]),
  companyArticle(5, 'Tools', [
    p('k5p1', undefined, 'Tools are returned to the site store at the end of each day.'),
  ]),
]

/** The company's work rulebook, version 2025: hours and equipment changed, a new article. */
export const COMPANY_2025_NODES: LegalNode[] = [
  COMPANY_1,
  companyArticle(2, 'Working hours', [
    p('k2p1', '(1)', 'Working hours on a site are from 7:00 to 15:30, Monday to Friday.'),
    p(
      'k2p2',
      '(2)',
      'The site manager may order work on Saturday for urgent works, with the workers’ consent.',
    ),
  ]),
  companyArticle(3, 'Protective equipment', [
    p(
      'k3p1',
      undefined,
      'Every worker wears a helmet, a high-visibility vest and safety shoes on the site.',
    ),
  ]),
  companyArticle(4, 'Site diary entries', [
    p('k4p1', undefined, 'The site manager writes the day’s entries in the site diary by 16:00.'),
  ]),
  companyArticle(6, 'Heat', [
    p('k6p1', undefined, 'Above 32 °C in the shade, outdoor work stops between 12:00 and 16:00.'),
  ]),
]

// ── An invented Serbian act in Cyrillic, for the script switch ──

function sr(number: number, title: string | undefined, paragraphs: LegalParagraph[]): LegalArticle {
  return {
    kind: 'article',
    id: `s${String(number)}`,
    label: `Члан ${String(number)}`,
    ...(title === undefined ? {} : { title }),
    paragraphs,
    href: `#/legal/acts/site-records-sr/article-${String(number)}`,
  }
}

/**
 * "Правилник о илустративној евиденцији градилишта" (Rulebook on Illustrative Site Records), in
 * Serbian Cyrillic, written for the stories: its capitals, digraphs (Љ, Њ, Џ) and a heading in
 * capitals show the transliteration.
 */
export const SERBIAN_CYRILLIC_NODES: LegalNode[] = [
  {
    kind: 'heading',
    id: 'sr-part-1',
    level: 1,
    label: 'ДЕО ПРВИ',
    title: 'ОПШТЕ ОДРЕДБЕ',
    children: [
      sr(1, 'Предмет', [
        p(
          's1p1',
          undefined,
          'Овим правилником уређује се илустративна евиденција градилишта. Правилник је измишљен и нема правно дејство.',
        ),
      ]),
      sr(2, 'Грађевински дневник', [
        {
          id: 's2p1',
          label: '(1)',
          content: ['Извођач води грађевински дневник за свако градилиште, у који се уписују:'],
          points: [
            { id: 's2p1i1', label: '1)', content: ['подаци о радницима и њиховим задацима;'] },
            { id: 's2p1i2', label: '2)', content: ['услови рада, време и дозвољена одступања;'] },
            { id: 's2p1i3', label: '3)', content: ['налози надзорног органа.'] },
          ],
        },
        p('s2p2', '(2)', 'Дневник потписује одговорни извођач радова.'),
      ]),
    ],
  },
  {
    kind: 'heading',
    id: 'sr-part-2',
    level: 1,
    label: 'ДЕО ДРУГИ',
    title: 'ЉУДСТВО И ЊЕГОВЕ ОБАВЕЗЕ',
    children: [
      sr(3, 'Џепна књига налога', [
        p(
          's3p1',
          undefined,
          'Пословођа носи џепну књигу налога у коју уписује налоге дате на градилишту.',
        ),
      ]),
      sr(4, 'Чување евиденције', [
        p(
          's4p1',
          undefined,
          'Евиденција се чува на градилишту и даје на увид инспектору. Љубазност према инспектору је обавезна.',
        ),
      ]),
    ],
  },
]

// ── Arabic and Japanese sample acts (invented) ──

/** An invented act in Arabic: "law of illustrative works" (story sample text). */
export const ARABIC_NODES: LegalNode[] = [
  {
    kind: 'heading',
    id: 'ar-part-1',
    level: 1,
    label: 'الباب الأول',
    title: 'أحكام عامة',
    children: [
      {
        kind: 'article',
        id: 'ar1',
        label: 'المادة 1',
        title: 'الموضوع',
        paragraphs: [
          p('ar1p1', '(1)', 'يحدد هذا القانون قواعد توضيحية لأعمال البناء وسجلات الموقع.'),
          p('ar1p2', '(2)', 'هذه القواعد مخترعة لأغراض العرض ولا أثر قانوني لها.'),
        ],
        href: '#/legal/acts/ar/article-1',
      },
      {
        kind: 'article',
        id: 'ar2',
        label: 'المادة 2',
        title: 'رخصة البناء',
        paragraphs: [
          p(
            'ar2p1',
            undefined,
            'لا تبدأ الأعمال إلا بموجب رخصة بناء صادرة وفقاً لـ ',
            {
              kind: 'ref',
              text: 'المادة 1',
              target: { articleId: 'ar1', href: '#/legal/acts/ar/article-1' },
            },
            '.',
          ),
        ],
        changes: [
          { amendmentId: 'ar-am', label: 'عُدّلت بالعدد 47/2018', appliesFrom: '2018-07-01' },
        ],
        href: '#/legal/acts/ar/article-2',
      },
    ],
  },
]

/** An invented act in Japanese: "illustrative construction works act" (story sample text). */
export const JAPANESE_NODES: LegalNode[] = [
  {
    kind: 'heading',
    id: 'ja-part-1',
    level: 1,
    label: '第一章',
    title: '総則',
    children: [
      {
        kind: 'article',
        id: 'ja1',
        label: '第一条',
        title: '目的',
        paragraphs: [
          p('ja1p1', '1', 'この法律は、例示のための建設工事及び現場記録の規則を定める。'),
          p('ja1p2', '2', 'この規則は表示のために作られたものであり、法的効力を有しない。'),
        ],
        href: '#/legal/acts/ja/article-1',
      },
      {
        kind: 'article',
        id: 'ja2',
        label: '第二条',
        title: '建築許可',
        paragraphs: [
          p(
            'ja2p1',
            undefined,
            '工事は、',
            {
              kind: 'ref',
              text: '第一条',
              target: { articleId: 'ja1', href: '#/legal/acts/ja/article-1' },
            },
            'に定める許可に基づいてのみ開始することができる。',
          ),
        ],
        inForceFrom: '2027-01-01',
        href: '#/legal/acts/ja/article-2',
      },
    ],
  },
]

// ── A long act ──

const SUBJECTS = [
  'the site plan',
  'the site diary',
  'the building permit',
  'the illustrative inspector',
  'the main contractor',
  'a subcontractor',
  'the site store',
  'the design',
]

const DUTIES = [
  'is kept up to date on every day of works',
  'is shown on request to the person who supervises the works',
  'is signed by the person responsible for it',
  'is kept for five years after the works end',
]

/**
 * A long invented act: `count` articles under parts of four chapters each, ten articles a
 * chapter, every third article with a reference to an earlier one and every seventh changed;
 * the same text on every call (no randomness).
 */
export function longIllustrativeAct(count = 320): LegalNode[] {
  const parts: LegalNode[] = []
  let number = 1
  let partNumber = 1
  while (number <= count) {
    const chapters: LegalNode[] = []
    for (let chapter = 1; chapter <= 4 && number <= count; chapter += 1) {
      const articles: LegalArticle[] = []
      for (let each = 0; each < 10 && number <= count; each += 1) {
        const subject = SUBJECTS[number % SUBJECTS.length] ?? 'the site plan'
        const duty = DUTIES[number % DUTIES.length] ?? 'is kept up to date'
        const earlier = Math.max(1, number - 3)
        const id = `l${String(number)}`
        articles.push({
          kind: 'article',
          id,
          label: `Article ${String(number)}`,
          title: `Rules on ${subject} (${String(number)})`,
          paragraphs: [
            p(`${id}p1`, '(1)', `Under this Article, ${subject} ${duty}.`),
            number % 3 === 0
              ? p(
                  `${id}p2`,
                  '(2)',
                  'The exceptions are those of ',
                  {
                    kind: 'ref',
                    text: `Article ${String(earlier)}`,
                    target: {
                      articleId: `l${String(earlier)}`,
                      href: `#/legal/acts/long/article-${String(earlier)}`,
                    },
                  },
                  '.',
                )
              : p(
                  `${id}p2`,
                  '(2)',
                  'This rule is invented for the stories and has no legal effect.',
                ),
          ],
          ...(number % 7 === 0
            ? {
                changes: [
                  {
                    amendmentId: 'am-2021',
                    label: 'Amended by No. 33/2021',
                    appliesFrom: '2021-05-15',
                  },
                ],
              }
            : {}),
          href: `#/legal/acts/long/article-${String(number)}`,
        })
        number += 1
      }
      chapters.push({
        kind: 'heading',
        id: `p${String(partNumber)}c${String(chapter)}`,
        level: 2,
        label: `Chapter ${String(chapter)}`,
        title: `Illustrative chapter ${String(partNumber)}.${String(chapter)}`,
        children: articles,
      })
    }
    parts.push({
      kind: 'heading',
      id: `p${String(partNumber)}`,
      level: 1,
      label: `Part ${String(partNumber)}`,
      title: 'Illustrative provisions',
      children: chapters,
    })
    partNumber += 1
  }
  return parts
}

/** The Arabic sample act before a change: the permit article said less (for the comparison). */
export const ARABIC_EARLIER_NODES: LegalNode[] = mapArticles(ARABIC_NODES, (each) =>
  each.id === 'ar2'
    ? { ...each, paragraphs: [p('ar2p1', undefined, 'لا تبدأ الأعمال إلا برخصة.')] }
    : each,
)

/** The Japanese sample act before a change (for the comparison). */
export const JAPANESE_EARLIER_NODES: LegalNode[] = mapArticles(JAPANESE_NODES, (each) =>
  each.id === 'ja1'
    ? {
        ...each,
        paragraphs: [p('ja1p1', '1', 'この法律は、例示のための建設工事の規則を定める。')],
      }
    : each,
)

/** Every article of an act through `change`. */
function mapArticles(
  nodes: readonly LegalNode[],
  change: (article: LegalArticle) => LegalArticle,
): LegalNode[] {
  return nodes.map((node) =>
    node.kind === 'article'
      ? change(node)
      : { ...node, children: mapArticles(node.children, change) },
  )
}

/** An article with a long title and a long paragraph, for the "Long text" stories. */
export const LONG_TEXT_NODES: LegalNode[] = [
  {
    kind: 'heading',
    id: 'long-part',
    level: 1,
    label: 'Part One',
    title:
      'Provisions on the illustrative keeping, signing, storing and showing of every record of a building site, from the first to the last day of works',
    children: [
      {
        kind: 'article',
        id: 'long-1',
        label: 'Article 1',
        title:
          'Obligations of the main contractor, every subcontractor and the person who supervises the works in keeping the illustrative site records',
        paragraphs: [
          p(
            'long-1p1',
            '(1)',
            'The main contractor keeps the site diary, the book of inspections, the register of workers on the site, the record of deliveries and the record of tests, each from the first day of works until the last, and shows each of them on request to the illustrative inspector, to the person who supervises the works and to anyone else this invented Law names, without delay and without asking for a reason. ',
            lawRef('Article 7 of the Law on Illustrative Building Works', 7),
            ' applies to the form of each record.',
          ),
        ],
        changes: [
          {
            amendmentId: 'am-2021',
            label: 'Amended by No. 33/2021 (Law amending the Law on Illustrative Building Works)',
            appliesFrom: '2021-05-15',
          },
        ],
        href: `${LAW}/article-1-long`,
      },
    ],
  },
]
