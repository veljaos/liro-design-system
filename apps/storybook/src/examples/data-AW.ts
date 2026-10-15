/*
 * Group AW's example data (P5.55, compensation, cession and assignment): Kvadrat Gradnja d.o.o.'s
 * offsets on 14.10.2026, one pattern for three kinds of document —
 * - compensation KMP-2026-0007 with Beton Mix d.o.o. (two parties offset what they owe each
 *   other: crane rental F-2026-0398 against part of Beton Mix's invoice 2026-1102, after the
 *   statement of open items IOS-2026-0040 was confirmed; group W);
 * - cession CES-2026-0003 (Kvadrat Gradnja assigns its claim on Stanogradnja Plus d.o.o. to Beton
 *   Mix d.o.o., in payment of Beton Mix's invoice 2026-1131);
 * - assignment ASG-2026-0002 (Kvadrat Gradnja instructs Gradska toplana Novi Sad, who owes it, to
 *   pay Elektro Sistem d.o.o., to whom it owes).
 * The parties with their roles, the items on each side with what is open, what the document
 * settles and what remains, and each party's signature. Every amount and every sentence of what
 * remains is the application's; the screens add nothing. Invented data.
 */

import type { Signer } from '@veljaos/ui'
import {
  BETON_MIX,
  ELEKTRO_SISTEM,
  GRADSKA_TOPLANA,
  KVADRAT,
  STANOGRADNJA,
  type Party,
} from './data-AU'

export const AW_ROUTES = {
  list: '/accounting/offsets',
  compensation: '/accounting/offsets/KMP-2026-0007',
  /** Both directors signed: the compensation may be posted. */
  compensationSigned: '/accounting/offsets/KMP-2026-0007?signed',
  cession: '/accounting/offsets/CES-2026-0003',
  assignment: '/accounting/offsets/ASG-2026-0002',
}

export type OffsetKind = 'Compensation' | 'Cession' | 'Assignment'
export type OffsetState = 'Draft' | 'Awaiting signatures' | 'Signed' | 'Posted'

/** One open item a side gives into the document. */
export interface OffsetItem {
  id: string
  document: string
  /** What it is, in the application's words. */
  kind: string
  date: string
  open: string
  /** What this document settles of it. */
  settled: string
  remains: string
}

/** One side: who owes whom, the items, and the side's totals (the application's). */
export interface OffsetSide {
  key: string
  title: string
  items: OffsetItem[]
  totals: { open: string; settled: string; remains: string }
}

export interface OffsetParty {
  role: string
  party: Party
}

export interface OffsetDocument {
  number: string
  kind: OffsetKind
  date: string
  state: OffsetState
  /** The user's own company and its role first; then the others. */
  parties: OffsetParty[]
  /** What the document does, in one sentence: the application's. */
  summary: string
  /** The settled column's heading ("Offset", "Assigned", "Paid on instruction"). */
  settledLabel: string
  /** The amount the document settles, and its name ("Amount offset"). */
  amount: string
  amountLabel: string
  sides: OffsetSide[]
  /** What remains after it, sentence by sentence: the application's. */
  remains: string[]
  signers: Signer[]
  /** The document it follows from ("Based on"). */
  basedOn?: { label: string; number: string; path: string; status: string }
}

const NENAD = 'Nenad Kovačević'

function director(id: string, name: string, company: string): Omit<Signer, 'state'> {
  return { id, name, role: `Director, ${company}` }
}

const COMPENSATION: OffsetDocument = {
  number: 'KMP-2026-0007',
  kind: 'Compensation',
  date: '2026-10-14',
  state: 'Awaiting signatures',
  parties: [
    { role: 'Party', party: KVADRAT },
    { role: 'Party', party: BETON_MIX },
  ],
  summary: 'Kvadrat Gradnja d.o.o. and Beton Mix d.o.o. offset 156.000,00 RSD they owe each other.',
  settledLabel: 'Offset',
  amount: '156000.00',
  amountLabel: 'Amount offset',
  sides: [
    {
      key: 'theirs',
      title: 'Beton Mix d.o.o. owes Kvadrat Gradnja d.o.o.',
      items: [
        {
          id: 'f398',
          document: 'F-2026-0398',
          kind: 'Invoice, crane rental in September',
          date: '2026-09-30',
          open: '156000.00',
          settled: '156000.00',
          remains: '0.00',
        },
      ],
      totals: { open: '156000.00', settled: '156000.00', remains: '0.00' },
    },
    {
      key: 'ours',
      title: 'Kvadrat Gradnja d.o.o. owes Beton Mix d.o.o.',
      items: [
        {
          id: 'b1102',
          document: '2026-1102',
          kind: 'Supplier invoice, ready-mix concrete',
          date: '2026-09-18',
          open: '294000.00',
          settled: '156000.00',
          remains: '138000.00',
        },
      ],
      totals: { open: '294000.00', settled: '156000.00', remains: '138000.00' },
    },
  ],
  remains: [
    'Beton Mix d.o.o. owes Kvadrat Gradnja d.o.o. nothing on F-2026-0398.',
    'Kvadrat Gradnja d.o.o. still owes Beton Mix d.o.o. 138.000,00 RSD on 2026-1102, due 18.10.2026.',
  ],
  signers: [
    {
      ...director('nenad', NENAD, KVADRAT.name),
      state: 'signed',
      at: '2026-10-14T09:12:00+02:00',
    },
    { ...director('vasic', 'Dragana Vasić', BETON_MIX.name), state: 'waiting' },
  ],
  basedOn: {
    label: 'Statement of open items',
    number: 'IOS-2026-0040',
    path: '/accounting/ios',
    status: 'Confirmed',
  },
}

/** The compensation once Beton Mix's director signed, through Liro Bridge. */
export const COMPENSATION_SIGNED: OffsetDocument = {
  ...COMPENSATION,
  state: 'Signed',
  signers: COMPENSATION.signers.map((signer) =>
    signer.id === 'vasic'
      ? { ...signer, state: 'signed', at: '2026-10-14T09:31:00+02:00' }
      : signer,
  ),
}

const CESSION: OffsetDocument = {
  number: 'CES-2026-0003',
  kind: 'Cession',
  date: '2026-10-14',
  state: 'Awaiting signatures',
  parties: [
    { role: 'Assignor', party: KVADRAT },
    { role: 'Assignee', party: BETON_MIX },
    { role: 'Debtor', party: STANOGRADNJA },
  ],
  summary:
    'Kvadrat Gradnja d.o.o. assigns 186.000,00 RSD of its claim on Stanogradnja Plus d.o.o. to Beton Mix d.o.o., in payment of Beton Mix d.o.o.’s invoice 2026-1131.',
  settledLabel: 'Assigned',
  amount: '186000.00',
  amountLabel: 'Amount assigned',
  sides: [
    {
      key: 'claim',
      title: 'The claim assigned: Stanogradnja Plus d.o.o. owes Kvadrat Gradnja d.o.o.',
      items: [
        {
          id: 'f341',
          document: 'F-2026-0341',
          kind: 'Invoice, precast elements',
          date: '2026-07-29',
          open: '236000.00',
          settled: '186000.00',
          remains: '50000.00',
        },
      ],
      totals: { open: '236000.00', settled: '186000.00', remains: '50000.00' },
    },
    {
      key: 'debt',
      title: 'The debt paid with it: Kvadrat Gradnja d.o.o. owes Beton Mix d.o.o.',
      items: [
        {
          id: 'b1131',
          document: '2026-1131',
          kind: 'Supplier invoice, ready-mix concrete',
          date: '2026-09-29',
          open: '186000.00',
          settled: '186000.00',
          remains: '0.00',
        },
      ],
      totals: { open: '186000.00', settled: '186000.00', remains: '0.00' },
    },
  ],
  remains: [
    'Stanogradnja Plus d.o.o. pays 186.000,00 RSD to Beton Mix d.o.o. instead of Kvadrat Gradnja d.o.o.',
    'Stanogradnja Plus d.o.o. still owes Kvadrat Gradnja d.o.o. 50.000,00 RSD on F-2026-0341.',
    'Kvadrat Gradnja d.o.o. owes Beton Mix d.o.o. nothing on 2026-1131.',
  ],
  signers: [
    {
      ...director('nenad', NENAD, KVADRAT.name),
      state: 'signed',
      at: '2026-10-14T09:15:00+02:00',
    },
    {
      ...director('vasic', 'Dragana Vasić', BETON_MIX.name),
      state: 'signed',
      at: '2026-10-14T09:33:00+02:00',
    },
    {
      id: 'maric',
      name: 'Bojana Marić',
      role: `Debtor’s acknowledgement, ${STANOGRADNJA.name}`,
      state: 'waiting',
    },
  ],
}

const ASSIGNMENT: OffsetDocument = {
  number: 'ASG-2026-0002',
  kind: 'Assignment',
  date: '2026-10-13',
  state: 'Signed',
  parties: [
    { role: 'Instructing party', party: KVADRAT },
    { role: 'Paying party', party: GRADSKA_TOPLANA },
    { role: 'Receiving party', party: ELEKTRO_SISTEM },
  ],
  summary:
    'Kvadrat Gradnja d.o.o. instructs Gradska toplana Novi Sad to pay 120.000,00 RSD to Elektro Sistem d.o.o.',
  settledLabel: 'Paid on instruction',
  amount: '120000.00',
  amountLabel: 'Amount to pay',
  sides: [
    {
      key: 'paying',
      title: 'Gradska toplana Novi Sad owes Kvadrat Gradnja d.o.o.',
      items: [
        {
          id: 'f352',
          document: 'F-2026-0352',
          kind: 'Invoice, trench works',
          date: '2026-08-06',
          open: '184800.00',
          settled: '120000.00',
          remains: '64800.00',
        },
      ],
      totals: { open: '184800.00', settled: '120000.00', remains: '64800.00' },
    },
    {
      key: 'receiving',
      title: 'Kvadrat Gradnja d.o.o. owes Elektro Sistem d.o.o.',
      items: [
        {
          id: 'es412',
          document: 'ES-2026-0412',
          kind: 'Supplier invoice, site electrics',
          date: '2026-08-05',
          open: '120000.00',
          settled: '120000.00',
          remains: '0.00',
        },
      ],
      totals: { open: '120000.00', settled: '120000.00', remains: '0.00' },
    },
  ],
  remains: [
    'Gradska toplana Novi Sad still owes Kvadrat Gradnja d.o.o. 64.800,00 RSD on F-2026-0352.',
    'Kvadrat Gradnja d.o.o. owes Elektro Sistem d.o.o. nothing on ES-2026-0412 once the payment arrives.',
  ],
  signers: [
    {
      ...director('nenad', NENAD, KVADRAT.name),
      state: 'signed',
      at: '2026-10-13T11:02:00+02:00',
    },
    {
      id: 'toplana',
      name: 'Milan Rakić',
      role: `Director, ${GRADSKA_TOPLANA.name}`,
      state: 'signed',
      at: '2026-10-13T14:20:00+02:00',
    },
    {
      id: 'elektro',
      name: 'Saša Đurić',
      role: `Director, ${ELEKTRO_SISTEM.name}`,
      state: 'signed',
      at: '2026-10-14T08:47:00+02:00',
    },
  ],
}

export const OFFSETS: OffsetDocument[] = [COMPENSATION, CESSION, ASSIGNMENT]

/** The offsets list's other rows (not opened in the examples). */
export interface OffsetRow {
  number: string
  kind: OffsetKind
  date: string
  parties: string
  amount: string
  state: OffsetState
}

export const OFFSET_ROWS: OffsetRow[] = [
  ...OFFSETS.map((each) => ({
    number: each.number,
    kind: each.kind,
    date: each.date,
    parties: each.parties
      .slice(1)
      .map((party) => party.party.name)
      .join(', '),
    amount: each.amount,
    state: each.state,
  })),
  {
    number: 'KMP-2026-0006',
    kind: 'Compensation',
    date: '2026-09-30',
    parties: 'Elektro Sistem d.o.o.',
    amount: '48000.00',
    state: 'Posted',
  },
  {
    number: 'KMP-2026-0005',
    kind: 'Compensation',
    date: '2026-09-12',
    parties: 'Skele Sistem d.o.o.',
    amount: '72500.00',
    state: 'Posted',
  },
  {
    number: 'CES-2026-0002',
    kind: 'Cession',
    date: '2026-08-28',
    parties: 'Kamen-Kop d.o.o., Novi Dom Invest d.o.o.',
    amount: '310000.00',
    state: 'Posted',
  },
]

export function offsetPath(number: string): string {
  return `${AW_ROUTES.list}/${number}`
}
