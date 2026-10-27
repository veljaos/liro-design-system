import type { GazetteIssue } from './gazette-issues'
import type { LegalStatus } from './legal-model'

/*
 * Story data of GazetteIssues (P5.27). Every act, number and text is invented and labelled
 * "Illustrative": the "Illustrative Gazette" is no real gazette. Not part of the package.
 */

const STATUSES = {
  inForce: { id: 'in-force', label: 'In force', tone: 'success' },
  partly: { id: 'partly', label: 'Partly in force', tone: 'warning' },
  notYet: { id: 'not-yet', label: 'Not yet in force', tone: 'neutral' },
  noLonger: { id: 'no-longer', label: 'No longer in force', tone: 'danger' },
} as const satisfies Record<string, LegalStatus>

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
