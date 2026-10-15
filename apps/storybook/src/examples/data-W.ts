/*
 * Group W's example data (P5.33, IOS — statements of open items): Kvadrat Gradnja d.o.o.'s
 * statements to its partners at the cut-off date 30.09.2026, on 14 October 2026 at 09:40. Each
 * partner has its open items in our books (the balance is their sum, in whole paras), the
 * statement's state (Not sent, Sent, Opened, Confirmed, Disputed, No answer), how it went (e-mail,
 * or a signed PDF through Liro Bridge where the partner has it), when it was sent and opened, the
 * answer and the reminders.
 *
 * Elektro Sistem d.o.o. disputed this morning: its books show 300.000,00 RSD, ours 180.000,00.
 * The difference of 120.000,00 comes from two items: invoice ES-2026-0533 of 28.09.2026
 * (36.000,00), which they have and we did not — it reached our document inbox through SEF on
 * 13.10.2026 (group U) — and our payment of ES-2026-0498 (84.000,00), sent on 30.09.2026 (bank
 * statement 187) and booked by them on 01.10.2026, after the cut-off. Every name, number and
 * amount is invented; PIBs and accounts are illustrative; e-mail addresses at example.com. Not
 * part of the package. No classes here.
 */
import type { Tone } from '@veljaos/ui'
import { decimal, paras, sumUnits } from '../../../../packages/ui/src/components/amounts-story-data'

export const W_TODAY = '2026-10-14'
export const CUT_OFF = '2026-09-30'

/** Elektro Sistem d.o.o.'s statement, the disputed one. */
export const DISPUTED = 'IOS-2026-0042'

export const W_ROUTES = {
  list: '/accounting/ios',
  /** The Disputed view. */
  disputed: '/accounting/ios?view=disputed',
  /** The four partners not sent yet, checked, and "Prepare statements…" asked. */
  prepare: '/accounting/ios?prepare',
  /** The same, at the preview of the first statement. */
  preview: '/accounting/ios?preview',
  /** Three partners waiting for an answer checked, and "Send reminder…" asked. */
  remind: '/accounting/ios?remind',
  reconcile: `/accounting/ios/${DISPUTED}`,
  reconcileItem: (id: string) => `/accounting/ios/${DISPUTED}?item=${id}`,
  /** Both differences resolved: our answer can be sent. */
  resolved: `/accounting/ios/${DISPUTED}?stage=resolved`,
  /** The partner's side, in Liro's partner portal. */
  portal: `/partners/ios/${DISPUTED}`,
  portalDispute: `/partners/ios/${DISPUTED}?dispute`,
  portalDisputed: `/partners/ios/${DISPUTED}?disputed`,
  portalConfirm: `/partners/ios/${DISPUTED}?confirm`,
}

export type IosState = 'Not sent' | 'Sent' | 'Opened' | 'Confirmed' | 'Disputed' | 'No answer'

/** The states in their order (the filters, the views). */
export const IOS_STATES: IosState[] = [
  'Not sent',
  'Sent',
  'Opened',
  'Confirmed',
  'Disputed',
  'No answer',
]

/**
 * The application's state-to-tone map: on its way blue, confirmed green, a dispute waits on us
 * (warning), no answer after the deadline red; not sent is neutral. "Reconciled" closes a dispute.
 */
export const IOS_TONES: Record<IosState | 'Reconciled', Tone> = {
  'Not sent': 'neutral',
  Sent: 'info',
  Opened: 'info',
  Confirmed: 'success',
  Disputed: 'warning',
  'No answer': 'danger',
  Reconciled: 'success',
}

export type SendMethod = 'email' | 'bridge'

export const METHOD_TEXT: Record<SendMethod, string> = {
  email: 'E-mail with a PDF',
  bridge: 'Signed PDF via Liro Bridge',
}

/** An open item in our books at the cut-off. */
export interface IosItem {
  document: string
  kind: 'Invoice' | 'Supplier invoice' | 'Credit note' | 'Advance'
  date: string
  due: string
  amount: string
}

export interface IosPartner {
  id: string
  name: string
  taxId: string
  side: 'Supplier' | 'Customer'
  email: string
  /** The partner receives documents through Liro Bridge. */
  bridge: boolean
  number?: string
  state: IosState
  method?: SendMethod
  sent?: string
  opened?: string
  answerBy?: string
  answered?: string
  reminders: string[]
  /** Their balance and note, when they disputed. */
  theirBalance?: string
  theirNote?: string
  items: IosItem[]
}

function partner(data: Omit<IosPartner, 'reminders'> & { reminders?: string[] }): IosPartner {
  return { reminders: [], ...data }
}

export const PARTNERS: IosPartner[] = [
  partner({
    id: 'beton-mix',
    name: 'Beton Mix d.o.o.',
    taxId: '106543218',
    side: 'Supplier',
    email: 'racuni@betonmix.example.com',
    bridge: true,
    number: 'IOS-2026-0040',
    state: 'Confirmed',
    method: 'bridge',
    sent: '2026-10-07',
    opened: '2026-10-07',
    answerBy: '2026-10-15',
    answered: '2026-10-08T10:12',
    items: [
      {
        document: '2026-1131',
        kind: 'Supplier invoice',
        date: '2026-09-29',
        due: '2026-10-29',
        amount: '186000.00',
      },
      {
        document: '2026-1102',
        kind: 'Supplier invoice',
        date: '2026-09-18',
        due: '2026-10-18',
        amount: '294000.00',
      },
    ],
  }),
  partner({
    id: 'elektro-sistem',
    name: 'Elektro Sistem d.o.o.',
    taxId: '104556789',
    side: 'Supplier',
    email: 'racunovodstvo@elektrosistem.example.com',
    bridge: true,
    number: DISPUTED,
    state: 'Disputed',
    method: 'bridge',
    sent: '2026-10-07',
    opened: '2026-10-07',
    answerBy: '2026-10-15',
    answered: '2026-10-14T08:55',
    theirBalance: '300000.00',
    theirNote:
      'Our books also show ES-2026-0498 (84.000,00) and ES-2026-0533 (36.000,00) as open. Our open items are attached.',
    items: [
      {
        document: 'ES-2026-0412',
        kind: 'Supplier invoice',
        date: '2026-08-05',
        due: '2026-09-04',
        amount: '120000.00',
      },
      {
        document: 'ES-2026-0517',
        kind: 'Supplier invoice',
        date: '2026-09-15',
        due: '2026-10-15',
        amount: '60000.00',
      },
    ],
  }),
  partner({
    id: 'toplana',
    name: 'Gradska toplana Novi Sad',
    taxId: '101234870',
    side: 'Customer',
    email: 'finansije@toplana.example.com',
    bridge: false,
    number: 'IOS-2026-0043',
    state: 'Opened',
    method: 'email',
    sent: '2026-10-07',
    opened: '2026-10-08',
    answerBy: '2026-10-15',
    items: [
      {
        document: 'F-2026-0398',
        kind: 'Invoice',
        date: '2026-09-10',
        due: '2026-10-10',
        amount: '740000.00',
      },
      {
        document: 'F-2026-0405',
        kind: 'Invoice',
        date: '2026-09-25',
        due: '2026-10-25',
        amount: '500000.00',
      },
    ],
  }),
  partner({
    id: 'stanogradnja',
    name: 'Stanogradnja Plus d.o.o.',
    taxId: '108990341',
    side: 'Customer',
    email: 'knjigovodstvo@stanogradnja.example.com',
    bridge: true,
    number: 'IOS-2026-0044',
    state: 'Sent',
    method: 'bridge',
    sent: '2026-10-07',
    answerBy: '2026-10-15',
    items: [
      {
        document: 'F-2026-0389',
        kind: 'Invoice',
        date: '2026-08-31',
        due: '2026-09-30',
        amount: '2360500.00',
      },
      {
        document: 'F-2026-0402',
        kind: 'Invoice',
        date: '2026-09-22',
        due: '2026-10-22',
        amount: '1500000.00',
      },
    ],
  }),
  partner({
    id: 'drvoplast',
    name: 'Drvoplast d.o.o.',
    taxId: '105338810',
    side: 'Supplier',
    email: 'nabavka@drvoplast.example.com',
    bridge: false,
    number: 'IOS-2026-0036',
    state: 'No answer',
    method: 'email',
    sent: '2026-10-01',
    answerBy: '2026-10-09',
    reminders: ['2026-10-10'],
    items: [
      {
        document: 'DP-311/2026',
        kind: 'Supplier invoice',
        date: '2026-09-12',
        due: '2026-10-12',
        amount: '64800.00',
      },
    ],
  }),
  partner({
    id: 'fasada-pro',
    name: 'Fasada Pro d.o.o.',
    taxId: '110458672',
    side: 'Supplier',
    email: 'office@fasadapro.example.com',
    bridge: false,
    number: 'IOS-2026-0037',
    state: 'No answer',
    method: 'email',
    sent: '2026-10-01',
    opened: '2026-10-02',
    answerBy: '2026-10-09',
    reminders: ['2026-10-10'],
    items: [
      {
        document: 'FP-2026-088',
        kind: 'Supplier invoice',
        date: '2026-09-05',
        due: '2026-10-05',
        amount: '312000.00',
      },
    ],
  }),
  partner({
    id: 'signal-telekom',
    name: 'Signal Telekom d.o.o.',
    taxId: '101908356',
    side: 'Supplier',
    email: 'ios@signal-telekom.example.com',
    bridge: true,
    number: 'IOS-2026-0038',
    state: 'Confirmed',
    method: 'bridge',
    sent: '2026-10-01',
    opened: '2026-10-01',
    answerBy: '2026-10-09',
    answered: '2026-10-02T09:30',
    items: [
      {
        document: 'ST-2026-09-4471',
        kind: 'Supplier invoice',
        date: '2026-09-30',
        due: '2026-10-15',
        amount: '18240.00',
      },
    ],
  }),
  partner({
    id: 'kamen-kop',
    name: 'Kamen-Kop d.o.o.',
    taxId: '106771203',
    side: 'Supplier',
    email: 'racuni@kamenkop.example.com',
    bridge: false,
    number: 'IOS-2026-0039',
    state: 'Confirmed',
    method: 'email',
    sent: '2026-10-01',
    opened: '2026-10-03',
    answerBy: '2026-10-09',
    answered: '2026-10-06T13:41',
    items: [
      {
        document: 'KK-0917',
        kind: 'Supplier invoice',
        date: '2026-09-17',
        due: '2026-10-17',
        amount: '57900.00',
      },
    ],
  }),
  partner({
    id: 'put',
    name: 'JP Put Novi Sad',
    taxId: '100733415',
    side: 'Customer',
    email: 'finansije@jpput.example.com',
    bridge: false,
    number: 'IOS-2026-0045',
    state: 'Sent',
    method: 'email',
    sent: '2026-10-07',
    answerBy: '2026-10-15',
    items: [
      {
        document: 'F-2026-0401',
        kind: 'Invoice',
        date: '2026-09-21',
        due: '2026-10-21',
        amount: '740000.00',
      },
    ],
  }),
  partner({
    id: 'lager-petrovic',
    name: 'Lager Petrović d.o.o.',
    taxId: '107845591',
    side: 'Supplier',
    email: 'lager@petrovic.example.com',
    bridge: true,
    number: 'IOS-2026-0046',
    state: 'Opened',
    method: 'bridge',
    sent: '2026-10-07',
    opened: '2026-10-09',
    answerBy: '2026-10-15',
    items: [
      {
        document: 'LP-2026-311',
        kind: 'Supplier invoice',
        date: '2026-09-15',
        due: '2026-10-15',
        amount: '22300.00',
      },
    ],
  }),
  partner({
    id: 'gradski-prevoz',
    name: 'Gradski prevoz d.o.o.',
    taxId: '103877412',
    side: 'Supplier',
    email: 'racuni@gradskiprevoz.example.com',
    bridge: true,
    state: 'Not sent',
    items: [
      {
        document: 'GP-0874',
        kind: 'Supplier invoice',
        date: '2026-09-24',
        due: '2026-10-09',
        amount: '42600.00',
      },
    ],
  }),
  partner({
    id: 'skele-sistem',
    name: 'Skele Sistem d.o.o.',
    taxId: '109112087',
    side: 'Supplier',
    email: 'office@skelesistem.example.com',
    bridge: false,
    state: 'Not sent',
    items: [
      {
        document: 'SS-2026-140',
        kind: 'Supplier invoice',
        date: '2026-09-01',
        due: '2026-10-01',
        amount: '96000.00',
      },
    ],
  }),
  partner({
    id: 'novi-dom',
    name: 'Novi Dom Invest d.o.o.',
    taxId: '111208764',
    side: 'Customer',
    email: 'finansije@novidom.example.com',
    bridge: true,
    state: 'Not sent',
    items: [
      {
        document: 'F-2026-0399',
        kind: 'Invoice',
        date: '2026-09-14',
        due: '2026-10-14',
        amount: '2150000.00',
      },
      {
        document: 'A-2026-029',
        kind: 'Advance',
        date: '2026-09-02',
        due: '2026-09-02',
        amount: '-400000.00',
      },
    ],
  }),
  partner({
    id: 'linija',
    name: 'Projektni biro Linija',
    taxId: '112093516',
    side: 'Supplier',
    email: 'biro@linija.example.com',
    bridge: false,
    state: 'Not sent',
    items: [
      {
        document: 'PBL-22/2026',
        kind: 'Supplier invoice',
        date: '2026-09-28',
        due: '2026-10-28',
        amount: '150000.00',
      },
    ],
  }),
]

/** A partner's balance at the cut-off: the sum of its open items, in whole paras. */
export function balanceOf(partner: Pick<IosPartner, 'items'>): string {
  return decimal(sumUnits(partner.items.map((item) => paras(item.amount))))
}

export function partnerById(id: string): IosPartner | undefined {
  return PARTNERS.find((each) => each.id === id)
}

/** The list's saved views. */
export const IOS_VIEWS = [
  { id: 'all', label: 'All' },
  { id: 'notSent', label: 'Not sent' },
  { id: 'waiting', label: 'Waiting for an answer' },
  { id: 'disputed', label: 'Disputed' },
  { id: 'noAnswer', label: 'No answer' },
  { id: 'confirmed', label: 'Confirmed' },
] as const

export type IosView = (typeof IOS_VIEWS)[number]['id']

export function inIosView(partner: Pick<IosPartner, 'state'>, view: IosView): boolean {
  if (view === 'all') return true
  if (view === 'notSent') return partner.state === 'Not sent'
  if (view === 'waiting') return partner.state === 'Sent' || partner.state === 'Opened'
  if (view === 'disputed') return partner.state === 'Disputed'
  if (view === 'noAnswer') return partner.state === 'No answer'
  return partner.state === 'Confirmed'
}

/** A reminder goes only to a partner that has the statement and has not answered. */
export function mayRemind(partner: Pick<IosPartner, 'state'>): boolean {
  return partner.state === 'Sent' || partner.state === 'Opened' || partner.state === 'No answer'
}

/** The next statement numbers (the Core's sequence, illustrative). */
export const NEXT_NUMBER = 47

// ── The disputed statement, line by line ─────────────────────────────────────────────────────

export type ReconKind = 'match' | 'timing' | 'missing'

/** One line of the comparison: a document as each side has it at the cut-off. */
export interface ReconLine {
  id: string
  document: string
  kind: ReconKind
  date: string
  due: string
  /** Its amount on the document. */
  amount: string
  /** What is open in our books at the cut-off; null when we do not have it. */
  ours: string | null
  /** What is open in theirs; null when they do not have it. */
  theirs: string | null
  /** What each side has besides (a payment and its date), in words. */
  oursNote?: string
  theirsNote?: string
  /** The application's ways to resolve the difference, the suggested one first. */
  options?: { value: string; label: string; description?: string }[]
  /** Why the first option is suggested. */
  suggestion?: string
}

export const RECON_LINES: ReconLine[] = [
  {
    id: 'r1',
    document: 'ES-2026-0412',
    kind: 'match',
    date: '2026-08-05',
    due: '2026-09-04',
    amount: '120000.00',
    ours: '120000.00',
    theirs: '120000.00',
  },
  {
    id: 'r2',
    document: 'ES-2026-0498',
    kind: 'timing',
    date: '2026-09-02',
    due: '2026-10-02',
    amount: '84000.00',
    ours: '0.00',
    theirs: '84000.00',
    oursNote: 'Paid 30.09.2026, bank statement 187',
    theirsNote: 'Payment booked 01.10.2026',
    options: [
      {
        value: 'timing',
        label: 'Timing: paid before the cut-off, booked by them after it',
        description: 'Nothing to book. Our answer tells them the payment date.',
      },
      {
        value: 'ours',
        label: 'Our error: correct our books',
        description: 'The payment is reopened and booked again.',
      },
      {
        value: 'theirs',
        label: 'Their error: ask them to correct',
        description: 'Our answer asks them to book the payment on 30.09.2026.',
      },
    ],
    suggestion:
      'Our payment of 84.000,00 RSD left on 30.09.2026 (bank statement 187); they booked it on 01.10.2026.',
  },
  {
    id: 'r3',
    document: 'ES-2026-0517',
    kind: 'match',
    date: '2026-09-15',
    due: '2026-10-15',
    amount: '60000.00',
    ours: '60000.00',
    theirs: '60000.00',
  },
  {
    id: 'r4',
    document: 'ES-2026-0533',
    kind: 'missing',
    date: '2026-09-28',
    due: '2026-10-28',
    amount: '36000.00',
    ours: null,
    theirs: '36000.00',
    oursNote: 'Not in our books at 30.09.2026',
    theirsNote: 'Issued 28.09.2026',
    options: [
      {
        value: 'late',
        label: 'Received after the cut-off: book it now',
        description: 'It is in the document inbox, received through SEF on 13.10.2026.',
      },
      {
        value: 'missing',
        label: 'Not received: ask them to send it',
        description: 'Our answer asks for the invoice.',
      },
      {
        value: 'notOurs',
        label: 'Not ours: ask them to cancel it',
        description: 'Our answer says the invoice is not ours.',
      },
    ],
    suggestion: 'Invoice ES-2026-0533 reached the document inbox through SEF on 13.10.2026.',
  },
]

/** The partner's balance in our books and in theirs, and the difference, in whole paras. */
export function reconTotals(lines: readonly ReconLine[]): {
  ours: string
  theirs: string
  difference: string
} {
  const ours = sumUnits(lines.map((line) => (line.ours === null ? 0n : paras(line.ours))))
  const theirs = sumUnits(lines.map((line) => (line.theirs === null ? 0n : paras(line.theirs))))
  return { ours: decimal(ours), theirs: decimal(theirs), difference: decimal(theirs - ours) }
}

/** The difference a line explains once resolved: theirs less ours, in whole paras. */
export function lineDifference(line: ReconLine): bigint {
  return (
    (line.theirs === null ? 0n : paras(line.theirs)) - (line.ours === null ? 0n : paras(line.ours))
  )
}

/** The documents the partner's file listed (their open items at 30.09.2026). */
export const THEIR_FILE = 'Elektro_Sistem_otvorene_stavke_30-09-2026.pdf'

/** Who answers at Elektro Sistem d.o.o. (the partner portal's participant). */
export const PARTNER_PERSON = {
  name: 'Jelena Popović',
  detail: 'Accountant, Elektro Sistem d.o.o.',
}
