/*
 * Group U's example data (P5.31, the document inbox with recognition): Kvadrat Gradnja d.o.o.'s
 * incoming documents on 14 October 2026 at 09:40 — uploaded, e-mailed to the inbox address,
 * scanned at the office or received through SEF. Each has its kind, sender, time and state, and
 * what the recognition service reported: the values, the service's confidence in its own words,
 * which readings it calls uncertain, and where on the page each was read (in points from the
 * page's top-left corner). Nothing here is computed from a confidence: `low` is the service's
 * verdict, as the Core will pass it. The pages are drawn as SVG (`pageUri`), the application's
 * images of the PDFs and scans. Every name, number and amount is invented; PIBs and accounts are
 * illustrative; e-mail addresses at example.com. Not part of the package. No classes here.
 */
import {
  BLURRED_PAGES,
  pageUri,
  A4,
  type DrawnPage,
} from '../../../../packages/ui/src/components/page-viewer-story-data'
import type { LookupOption, PageRegion, Tone, ViewerPage } from '@veljaos/ui'

/** The examples' today and now (the application's clock, never the device's). */
export const U_TODAY = '2026-10-14'
export const U_NOW = '2026-10-14T09:40'

/** The inbox's own e-mail address (documents forwarded there arrive in the inbox). */
export const INBOX_ADDRESS = 'inbox.kvadrat-gradnja@example.com'

export const U_ROUTES = {
  inbox: '/accounting/inbox',
  /** Every document, not only those to review. */
  inboxAll: '/accounting/inbox?view=all',
  /** Three documents checked: the bulk bar. */
  inboxChecked: '/accounting/inbox?checked',
  /** The review, at Beton Mix d.o.o.'s invoice 2026-1187. */
  review: '/accounting/inbox/review',
  /** The review of one document. */
  reviewOf: (id: string) => `/accounting/inbox/review?doc=${id}`,
  /** Invoice 2026-1187 with its due date's region shown on the page. */
  reviewSource: '/accounting/inbox/review?source=dueDate',
  /** "Reject…" asked for invoice 2026-1187. */
  reviewReject: '/accounting/inbox/review?ask=reject',
  /** "Mark as duplicate…" asked for the photo of 2026-1187. */
  reviewDuplicate: '/accounting/inbox/review?doc=u6&ask=duplicate',
}

// ── Documents ─────────────────────────────────────────────────────────────────────────────────

export type DocKind = 'Supplier invoice' | 'Bank statement' | 'Receipt' | 'Contract' | 'Other'
export type DocSource = 'Upload' | 'E-mail' | 'Scan' | 'SEF'
export type DocState = 'New' | 'Recognised' | 'Needs review' | 'Posted' | 'Rejected' | 'Duplicate'
/** Why a new document waits: still recognised, or it could not be. */
export type DocCondition = 'processing' | 'failed' | 'password' | 'unreadable'

export const DOC_KINDS: DocKind[] = [
  'Supplier invoice',
  'Bank statement',
  'Receipt',
  'Contract',
  'Other',
]
export const DOC_SOURCES: DocSource[] = ['Upload', 'E-mail', 'Scan', 'SEF']

/** The application's state-to-tone map: New and Needs review wait on someone. */
export const DOC_TONES: Record<DocState, Tone> = {
  New: 'warning',
  Recognised: 'info',
  'Needs review': 'warning',
  Posted: 'success',
  Rejected: 'danger',
  Duplicate: 'neutral',
}

/** A new document's condition in words, under its state. */
export const CONDITION_TEXT: Record<DocCondition, string> = {
  processing: 'Recognising…',
  failed: 'Not recognised: enter by hand',
  password: 'Locked with a password',
  unreadable: 'Scan cannot be read',
}

/** A value the recognition read: its words of confidence, its verdict and its place. */
export interface ReadValue {
  id: string
  label: string
  kind: 'text' | 'date' | 'money'
  value: string | null
  confidence?: string
  /** The service calls this reading uncertain. */
  low?: boolean
  /** Its words when the value was not found. */
  lowLabel?: string
  /** The region it was read from. */
  region?: string
  /** A code or a number written left to right in every language. */
  ltr?: boolean
}

/** A line the recognition read, with the account the application suggests. */
export interface ReadLine {
  id: string
  description: string
  unit: string
  quantity: string | null
  price: string | null
  amount: string | null
  account: string | null
  /** Why the account is suggested, in the application's words. */
  accountNote?: string
  /** An uncertain reading in this line: the columns and the service's words. */
  uncertain?: { columns: string[]; text: string }
}

/** The supplier as read: its name and tax number, and whether the catalog has it. */
export interface ReadSupplier {
  name: string
  taxId: string
  /** The catalog's record when the tax number matched one; null when it is new. */
  match: string | null
  confidence: string
  region: string
}

export interface Recognition {
  supplier?: ReadSupplier
  /** Number, dates, reference. */
  facts: ReadValue[]
  /** VAT by rate and the total. */
  amounts: ReadValue[]
  lines?: ReadLine[]
}

export interface InboxDoc {
  id: string
  kind: DocKind
  source: DocSource
  /** The sender as the application knows it; null when unknown. */
  sender: string | null
  /** An e-mail address or a tax number. */
  senderDetail?: string
  /** When it arrived (local, Europe/Belgrade). */
  received: string
  file: string
  state: DocState
  condition?: DocCondition
  number?: string
  total?: string | null
  /** The document this one repeats (marked, or suggested by the application). */
  duplicateOf?: string
  /** Why it was rejected. */
  rejectReason?: string
  /** What it was posted as. */
  postedAs?: string
  pages: ViewerPage[]
  regions: PageRegion[]
  recognition?: Recognition
}

// ── The suppliers' catalog ────────────────────────────────────────────────────────────────────

export const SUPPLIERS: LookupOption[] = [
  { value: 'beton-mix', label: 'Beton Mix d.o.o.', description: 'PIB 106543218', kind: 'supplier' },
  {
    value: 'elektro-sistem',
    label: 'Elektro Sistem d.o.o.',
    description: 'PIB 104556789',
    kind: 'supplier',
  },
  { value: 'drvoplast', label: 'Drvoplast d.o.o.', description: 'PIB 105338810', kind: 'supplier' },
  {
    value: 'gradski-prevoz',
    label: 'Gradski prevoz d.o.o.',
    description: 'PIB 103877412',
    kind: 'supplier',
  },
  {
    value: 'signal-telekom',
    label: 'Signal Telekom d.o.o.',
    description: 'PIB 101908356',
    kind: 'supplier',
  },
  {
    value: 'papirus',
    label: 'Papirus Novi Sad d.o.o.',
    description: 'PIB 102664089',
    kind: 'supplier',
  },
  {
    value: 'pumpa-liman',
    label: 'Benzinska pumpa Liman',
    description: 'PIB 107223941',
    kind: 'supplier',
  },
]

export function supplierOption(value: string | null): LookupOption | null {
  return value === null ? null : (SUPPLIERS.find((each) => each.value === value) ?? null)
}

/** The accounts a line may be booked to (illustrative). */
export const COST_ACCOUNTS = [
  { value: '5110', label: '5110 Construction material' },
  { value: '5120', label: '5120 Fuel and energy' },
  { value: '5310', label: '5310 Transport services' },
  { value: '5330', label: '5330 Equipment rental' },
  { value: '5500', label: '5500 Other services' },
  { value: '5520', label: '5520 Office supplies' },
]

// ── Beton Mix d.o.o.'s invoice 2026-1187 (the shared fact of Round 7) ─────────────────────────

const BETON_MIX_PAGE: DrawnPage = {
  ...A4,
  texts: [
    { x: 48, y: 72, text: 'BETON MIX d.o.o.', size: 16, bold: true },
    { x: 48, y: 90, text: 'Industrijska zona bb, 21000 Novi Sad', grey: true },
    { x: 48, y: 104, text: 'PIB 106543218 · MB 21000187', grey: true },
    { x: 48, y: 118, text: 'Tekući račun 160-0000000412345-11', grey: true },
    { x: 547, y: 72, text: 'FAKTURA', size: 18, bold: true, anchor: 'end' },
    { x: 547, y: 92, text: 'Broj 2026-1187', size: 11, anchor: 'end' },
    { x: 547, y: 106, text: 'Datum izdavanja 12.10.2026.', anchor: 'end' },
    { x: 547, y: 120, text: 'Datum prometa 12.10.2026.', anchor: 'end' },
    { x: 547, y: 134, text: 'Valuta plaćanja 11.11.2026.', grey: true, anchor: 'end' },
    { x: 48, y: 168, text: 'Kupac', grey: true },
    { x: 48, y: 184, text: 'Kvadrat Gradnja d.o.o.', size: 11, bold: true },
    { x: 48, y: 198, text: 'Bulevar oslobođenja 102, 21000 Novi Sad', grey: true },
    { x: 48, y: 212, text: 'PIB 108452317', grey: true },
    { x: 48, y: 252, text: 'Opis', grey: true },
    { x: 300, y: 252, text: 'Jed.', grey: true },
    { x: 360, y: 252, text: 'Kol.', grey: true, anchor: 'end' },
    { x: 450, y: 252, text: 'Cena', grey: true, anchor: 'end' },
    { x: 547, y: 252, text: 'Iznos', grey: true, anchor: 'end' },
    { x: 48, y: 280, text: 'Gotov beton C25/30' },
    { x: 300, y: 280, text: 'm3' },
    { x: 360, y: 280, text: '35', anchor: 'end' },
    { x: 450, y: 280, text: '6.200,00', anchor: 'end' },
    { x: 547, y: 280, text: '217.000,00', anchor: 'end' },
    { x: 48, y: 304, text: 'Pumpa za beton' },
    { x: 300, y: 304, text: 'h' },
    { x: 360, y: 304, text: '4', grey: true, anchor: 'end' },
    { x: 450, y: 304, text: '5.500,00', anchor: 'end' },
    { x: 547, y: 304, text: '22.000,00', anchor: 'end' },
    { x: 48, y: 328, text: 'Prevoz, gradilište Liman 4' },
    { x: 300, y: 328, text: 'kom' },
    { x: 360, y: 328, text: '1', anchor: 'end' },
    { x: 450, y: 328, text: '6.000,00', anchor: 'end' },
    { x: 547, y: 328, text: '6.000,00', anchor: 'end' },
    { x: 340, y: 380, text: 'Osnovica 20%', grey: true },
    { x: 547, y: 380, text: '245.000,00', anchor: 'end' },
    { x: 340, y: 400, text: 'PDV 20%', grey: true },
    { x: 547, y: 400, text: '49.000,00', anchor: 'end' },
    { x: 340, y: 428, text: 'Ukupno za uplatu', size: 12, bold: true },
    { x: 547, y: 428, text: '294.000,00 RSD', size: 12, bold: true, anchor: 'end' },
    { x: 48, y: 480, text: 'Poziv na broj 97 12-2026-1187', grey: true },
    { x: 48, y: 800, text: 'Ilustrativni primer · nije stvaran dokument', grey: true },
  ],
  rules: [
    [48, 260, 547, 260],
    [48, 288, 547, 288],
    [48, 312, 547, 312],
    [48, 336, 547, 336],
    [340, 412, 547, 412],
  ],
}

const BETON_MIX_REGIONS: PageRegion[] = [
  { id: 'supplier', page: 1, x: 44, y: 56, width: 230, height: 68, label: 'Supplier' },
  { id: 'number', page: 1, x: 462, y: 81, width: 89, height: 15, label: 'Number' },
  { id: 'issueDate', page: 1, x: 410, y: 96, width: 141, height: 14, label: 'Issue date' },
  { id: 'deliveryDate', page: 1, x: 418, y: 110, width: 133, height: 14, label: 'Delivery date' },
  { id: 'dueDate', page: 1, x: 412, y: 124, width: 139, height: 14, label: 'Due date' },
  { id: 'lines', page: 1, x: 44, y: 266, width: 507, height: 70, label: 'Lines' },
  { id: 'base20', page: 1, x: 336, y: 370, width: 215, height: 14, label: 'Base at 20%' },
  { id: 'vat20', page: 1, x: 336, y: 390, width: 215, height: 14, label: 'VAT at 20%' },
  { id: 'total', page: 1, x: 336, y: 416, width: 215, height: 18, label: 'Total' },
  { id: 'reference', page: 1, x: 44, y: 470, width: 170, height: 14, label: 'Payment reference' },
]

const BETON_MIX_RECOGNITION: Recognition = {
  supplier: {
    name: 'Beton Mix d.o.o.',
    taxId: '106543218',
    match: 'beton-mix',
    confidence: '99%',
    region: 'supplier',
  },
  facts: [
    {
      id: 'number',
      label: 'Number',
      kind: 'text',
      value: '2026-1187',
      confidence: '98%',
      region: 'number',
      ltr: true,
    },
    {
      id: 'issueDate',
      label: 'Issue date',
      kind: 'date',
      value: '2026-10-12',
      confidence: '97%',
      region: 'issueDate',
    },
    {
      id: 'deliveryDate',
      label: 'Delivery date',
      kind: 'date',
      value: '2026-10-12',
      confidence: '95%',
      region: 'deliveryDate',
    },
    {
      id: 'dueDate',
      label: 'Due date',
      kind: 'date',
      value: '2026-11-11',
      confidence: '62%',
      low: true,
      region: 'dueDate',
    },
    {
      id: 'reference',
      label: 'Payment reference',
      kind: 'text',
      value: '97 12-2026-1187',
      confidence: '93%',
      region: 'reference',
      ltr: true,
    },
  ],
  amounts: [
    {
      id: 'base20',
      label: 'Base at 20%',
      kind: 'money',
      value: '245000.00',
      confidence: '98%',
      region: 'base20',
    },
    {
      id: 'vat20',
      label: 'VAT at 20%',
      kind: 'money',
      value: '49000.00',
      confidence: '98%',
      region: 'vat20',
    },
    {
      id: 'base10',
      label: 'Base at 10%',
      kind: 'money',
      value: null,
      confidence: 'not on the document',
    },
    {
      id: 'total',
      label: 'Total',
      kind: 'money',
      value: '294000.00',
      confidence: '99%',
      region: 'total',
    },
  ],
  lines: [
    {
      id: 'l1',
      description: 'Ready-mix concrete C25/30',
      unit: 'm³',
      quantity: '35',
      price: '6200.00',
      amount: '217000.00',
      account: '5110',
      accountNote:
        'Account suggested: Beton Mix d.o.o.’s concrete went to 5110 on the last 6 invoices.',
    },
    {
      id: 'l2',
      description: 'Concrete pump',
      unit: 'h',
      quantity: '4',
      price: '5500.00',
      amount: '22000.00',
      account: '5330',
      accountNote: 'Account suggested from the line’s words (“pump”).',
      uncertain: {
        columns: ['quantity'],
        text: 'Quantity read with low confidence (58%): the figure is faint. Check it.',
      },
    },
    {
      id: 'l3',
      description: 'Delivery, Liman 4 site',
      unit: 'pc',
      quantity: '1',
      price: '6000.00',
      amount: '6000.00',
      account: '5310',
      accountNote: 'Account suggested: delivery lines of Beton Mix d.o.o. went to 5310.',
    },
  ],
}

// ── The other documents' pages ───────────────────────────────────────────────────────────────

/** A plain one-page document with a heading block and a few lines (the other documents). */
function simplePage(heading: string, lines: readonly string[], total?: string): ViewerPage {
  const page: DrawnPage = {
    ...A4,
    texts: [
      { x: 48, y: 72, text: heading, size: 15, bold: true },
      ...lines.map((text, index) => ({ x: 48, y: 104 + index * 18, text, grey: index > 0 })),
      ...(total === undefined
        ? []
        : [
            { x: 340, y: 420, text: 'Ukupno', size: 12, bold: true },
            { x: 547, y: 420, text: total, size: 12, bold: true, anchor: 'end' as const },
          ]),
      { x: 48, y: 800, text: 'Ilustrativni primer · nije stvaran dokument', grey: true },
    ],
    rules: [[48, 86, 547, 86]],
  }
  return { src: pageUri(page), ...A4, alt: heading }
}

/** A narrow till receipt (80mm wide, in points). */
function receiptPage(lines: readonly string[]): ViewerPage {
  const size = { width: 227, height: 420 }
  const page: DrawnPage = {
    ...size,
    texts: lines.map((text, index) => ({
      x: 113,
      y: 36 + index * 16,
      text,
      anchor: 'middle' as const,
      bold: index === 0,
    })),
  }
  return { src: pageUri(page), ...size, alt: lines[0] ?? '' }
}

const PUMP_RECEIPT = receiptPage([
  'BENZINSKA PUMPA LIMAN',
  'PIB 107223941',
  'Novi Sad, 13.10.2026. 07:52',
  '--------------------------------',
  'Evrodizel 36,00 l × 180,00',
  '6.480,00',
  '--------------------------------',
  'PDV 20%: 1.080,00',
  'UKUPNO: 6.480,00',
  'Fiskalni račun 4F2K-77-1203',
])

const PUMP_REGIONS: PageRegion[] = [
  { id: 'supplier', page: 1, x: 30, y: 24, width: 167, height: 30, label: 'Supplier' },
  { id: 'issueDate', page: 1, x: 40, y: 56, width: 147, height: 14, label: 'Date' },
  { id: 'vat20', page: 1, x: 50, y: 136, width: 127, height: 14, label: 'VAT at 20%' },
  { id: 'total', page: 1, x: 50, y: 152, width: 127, height: 14, label: 'Total' },
  { id: 'number', page: 1, x: 30, y: 168, width: 167, height: 14, label: 'Number' },
]

const SIMPLE_REGIONS: PageRegion[] = [
  { id: 'supplier', page: 1, x: 44, y: 56, width: 300, height: 22, label: 'Supplier' },
  { id: 'number', page: 1, x: 44, y: 94, width: 260, height: 14, label: 'Number' },
  { id: 'issueDate', page: 1, x: 44, y: 112, width: 260, height: 14, label: 'Issue date' },
  { id: 'total', page: 1, x: 336, y: 408, width: 215, height: 18, label: 'Total' },
]

/** A short recognition of a simple invoice: supplier, number, dates, total. */
function simpleRecognition(fields: {
  supplier: ReadSupplier
  number: string
  issueDate: string
  dueDate: string | null
  total: string
  vat: string | null
  low?: string[]
}): Recognition {
  const low = (id: string) => fields.low?.includes(id) === true
  return {
    supplier: fields.supplier,
    facts: [
      {
        id: 'number',
        label: 'Number',
        kind: 'text',
        value: fields.number,
        confidence: low('number') ? '55%' : '96%',
        low: low('number'),
        region: 'number',
        ltr: true,
      },
      {
        id: 'issueDate',
        label: 'Issue date',
        kind: 'date',
        value: fields.issueDate,
        confidence: '94%',
        region: 'issueDate',
      },
      {
        id: 'dueDate',
        label: 'Due date',
        kind: 'date',
        value: fields.dueDate,
        ...(fields.dueDate === null
          ? { low: true, lowLabel: 'Not found on the page' }
          : { confidence: '90%' }),
      },
    ],
    amounts: [
      {
        id: 'vat20',
        label: 'VAT at 20%',
        kind: 'money',
        value: fields.vat,
        confidence: low('vat20') ? '60%' : '95%',
        low: low('vat20'),
        ...(fields.vat === null ? {} : { region: 'vat20' }),
      },
      {
        id: 'total',
        label: 'Total',
        kind: 'money',
        value: fields.total,
        confidence: '97%',
        region: 'total',
      },
    ],
  }
}

// ── The inbox ─────────────────────────────────────────────────────────────────────────────────

const BETON_MIX_PAGES: ViewerPage[] = [
  { src: pageUri(BETON_MIX_PAGE), ...A4, alt: 'Beton Mix d.o.o., invoice 2026-1187' },
]

/** A photo of the paper copy of 2026-1187, delivered with the concrete. */
const BETON_MIX_PHOTO: ViewerPage[] = [
  {
    src: pageUri({ ...BETON_MIX_PAGE, texts: [...BETON_MIX_PAGE.texts] }),
    ...A4,
    alt: 'A photo of Beton Mix d.o.o.’s invoice 2026-1187 on paper',
  },
]

export const DOCUMENTS: InboxDoc[] = [
  {
    id: 'u16',
    kind: 'Supplier invoice',
    source: 'SEF',
    sender: 'Gradski prevoz d.o.o.',
    senderDetail: 'PIB 103877412',
    received: '2026-10-10T11:20',
    file: 'SEF 2026-GP-0912',
    state: 'Recognised',
    number: 'GP-0912',
    total: '42600.00',
    pages: [
      simplePage(
        'GRADSKI PREVOZ d.o.o.',
        ['Faktura GP-0912', 'Datum izdavanja 09.10.2026.', 'Prevoz armature, 3 ture'],
        '42.600,00 RSD',
      ),
    ],
    regions: SIMPLE_REGIONS,
    recognition: simpleRecognition({
      supplier: {
        name: 'Gradski prevoz d.o.o.',
        taxId: '103877412',
        match: 'gradski-prevoz',
        confidence: 'from SEF',
        region: 'supplier',
      },
      number: 'GP-0912',
      issueDate: '2026-10-09',
      dueDate: '2026-10-24',
      total: '42600.00',
      vat: '7100.00',
    }),
  },
  {
    id: 'u17',
    kind: 'Supplier invoice',
    source: 'E-mail',
    sender: 'Armatura Novi Sad d.o.o.',
    senderDetail: 'prodaja@armatura-ns.example.com',
    received: '2026-10-11T16:45',
    file: 'Racun_AR-2026-077.pdf',
    state: 'Needs review',
    number: 'AR-2026-077',
    total: '128400.00',
    pages: [
      simplePage(
        'ARMATURA NOVI SAD d.o.o.',
        ['Račun AR-2026-077', 'Datum izdavanja 10.10.2026.', 'Armatura B500B, 4,2 t'],
        '128.400,00 RSD',
      ),
    ],
    regions: SIMPLE_REGIONS,
    recognition: simpleRecognition({
      supplier: {
        name: 'Armatura Novi Sad d.o.o.',
        taxId: '109876543',
        match: null,
        confidence: '96%',
        region: 'supplier',
      },
      number: 'AR-2026-077',
      issueDate: '2026-10-10',
      dueDate: null,
      total: '128400.00',
      vat: '21400.00',
    }),
  },
  {
    id: 'u1',
    kind: 'Supplier invoice',
    source: 'E-mail',
    sender: 'Beton Mix d.o.o.',
    senderDetail: 'racuni@betonmix.example.com',
    received: '2026-10-12T14:05',
    file: 'Faktura_2026-1187.pdf',
    state: 'Needs review',
    number: '2026-1187',
    total: '294000.00',
    pages: BETON_MIX_PAGES,
    regions: BETON_MIX_REGIONS,
    recognition: BETON_MIX_RECOGNITION,
  },
  {
    id: 'u6',
    kind: 'Supplier invoice',
    source: 'Upload',
    sender: 'Beton Mix d.o.o.',
    senderDetail: 'Uploaded by Milica Petrović',
    received: '2026-10-13T07:40',
    file: 'IMG_2041.jpg',
    state: 'Needs review',
    number: '2026-1187',
    total: '294000.00',
    duplicateOf: 'u1',
    pages: BETON_MIX_PHOTO,
    regions: BETON_MIX_REGIONS,
    recognition: BETON_MIX_RECOGNITION,
  },
  {
    id: 'u4',
    kind: 'Receipt',
    source: 'Scan',
    sender: 'Benzinska pumpa Liman',
    senderDetail: 'Office scanner',
    received: '2026-10-13T08:15',
    file: 'Scan_2026-10-13_0815.pdf',
    state: 'Needs review',
    number: '4F2K-77-1203',
    total: '6480.00',
    pages: [PUMP_RECEIPT],
    regions: PUMP_REGIONS,
    recognition: simpleRecognition({
      supplier: {
        name: 'Benzinska pumpa Liman',
        taxId: '107223941',
        match: 'pumpa-liman',
        confidence: '91%',
        region: 'supplier',
      },
      number: '4F2K-77-1203',
      issueDate: '2026-10-13',
      dueDate: null,
      total: '6480.00',
      vat: '1080.00',
      low: ['vat20'],
    }),
  },
  {
    id: 'u2',
    kind: 'Supplier invoice',
    source: 'SEF',
    sender: 'Elektro Sistem d.o.o.',
    senderDetail: 'PIB 104556789',
    received: '2026-10-13T09:12',
    file: 'SEF ES-2026-0533',
    state: 'Recognised',
    number: 'ES-2026-0533',
    total: '36000.00',
    pages: [
      simplePage(
        'ELEKTRO SISTEM d.o.o.',
        [
          'Faktura ES-2026-0533',
          'Datum izdavanja 28.09.2026.',
          'Kablovi i razvodni ormar, Liman 4',
        ],
        '36.000,00 RSD',
      ),
    ],
    regions: SIMPLE_REGIONS,
    recognition: simpleRecognition({
      supplier: {
        name: 'Elektro Sistem d.o.o.',
        taxId: '104556789',
        match: 'elektro-sistem',
        confidence: 'from SEF',
        region: 'supplier',
      },
      number: 'ES-2026-0533',
      issueDate: '2026-09-28',
      dueDate: '2026-10-28',
      total: '36000.00',
      vat: '6000.00',
    }),
  },
  {
    id: 'u5',
    kind: 'Contract',
    source: 'E-mail',
    sender: 'Stanogradnja Plus d.o.o.',
    senderDetail: 'pravna@stanogradnja.example.com',
    received: '2026-10-13T12:30',
    file: 'Aneks_2_Liman_4.pdf',
    state: 'New',
    condition: 'password',
    pages: [],
    regions: [],
  },
  {
    id: 'u9',
    kind: 'Supplier invoice',
    source: 'E-mail',
    sender: 'Drvoplast d.o.o.',
    senderDetail: 'nabavka@drvoplast.example.com',
    received: '2026-10-13T15:02',
    file: 'racun_oktobar.pdf',
    state: 'New',
    condition: 'failed',
    pages: [
      simplePage('Drvoplast d.o.o.', [
        'Oplata i letve za gradilište Liman 4',
        'Iznos prema ponudi br. 44/2026',
        'Rukom upisano: 64.800,00',
      ]),
    ],
    regions: [],
  },
  {
    id: 'u3',
    kind: 'Bank statement',
    source: 'E-mail',
    sender: 'Banca Intesa',
    senderDetail: 'izvodi@bank.example.com',
    received: '2026-10-14T07:31',
    file: 'izvod-189.pdf',
    state: 'Recognised',
    number: '189',
    pages: [
      simplePage('IZVOD BR. 189', [
        'Račun 160-0000000456789-12',
        'Datum izvoda 13.10.2026.',
        'Prethodno stanje 1.395.654,57',
        'Novo stanje 1.120.204,57',
      ]),
    ],
    regions: [
      { id: 'number', page: 1, x: 44, y: 56, width: 200, height: 22, label: 'Statement number' },
      { id: 'issueDate', page: 1, x: 44, y: 112, width: 220, height: 14, label: 'Statement date' },
    ],
    recognition: {
      facts: [
        {
          id: 'number',
          label: 'Statement number',
          kind: 'text',
          value: '189',
          confidence: '99%',
          region: 'number',
          ltr: true,
        },
        {
          id: 'issueDate',
          label: 'Statement date',
          kind: 'date',
          value: '2026-10-13',
          confidence: '99%',
          region: 'issueDate',
        },
      ],
      amounts: [],
    },
  },
  {
    id: 'u7',
    kind: 'Receipt',
    source: 'Upload',
    sender: null,
    senderDetail: 'Uploaded from a phone by Nikola Marković',
    received: '2026-10-14T08:58',
    file: 'IMG_2044.jpg',
    state: 'New',
    condition: 'unreadable',
    pages: BLURRED_PAGES,
    regions: [],
  },
  {
    id: 'u8',
    kind: 'Other',
    source: 'Scan',
    sender: null,
    senderDetail: 'Office scanner',
    received: '2026-10-14T09:38',
    file: 'Scan_2026-10-14_0938.pdf',
    state: 'New',
    condition: 'processing',
    pages: [simplePage('Otpremnica 7781', ['Beton Mix d.o.o.', 'Gradilište Liman 4'])],
    regions: [],
  },
  // Done: posted, rejected, duplicates.
  {
    id: 'u10',
    kind: 'Supplier invoice',
    source: 'SEF',
    sender: 'Beton Mix d.o.o.',
    senderDetail: 'PIB 106543218',
    received: '2026-10-01T10:02',
    file: 'SEF 2026-1131',
    state: 'Posted',
    number: '2026-1131',
    total: '186000.00',
    postedAs: 'UF-2026-1219',
    pages: [simplePage('BETON MIX d.o.o.', ['Faktura 2026-1131'], '186.000,00 RSD')],
    regions: [],
  },
  {
    id: 'u11',
    kind: 'Supplier invoice',
    source: 'E-mail',
    sender: 'Signal Telekom d.o.o.',
    senderDetail: 'racuni@signal-telekom.example.com',
    received: '2026-10-05T06:10',
    file: 'Racun_09-2026.pdf',
    state: 'Posted',
    number: 'ST-2026-09-4471',
    total: '18240.00',
    postedAs: 'UF-2026-1222',
    pages: [simplePage('SIGNAL TELEKOM d.o.o.', ['Račun ST-2026-09-4471'], '18.240,00 RSD')],
    regions: [],
  },
  {
    id: 'u20',
    kind: 'Supplier invoice',
    source: 'Upload',
    sender: 'Signal Telekom d.o.o.',
    senderDetail: 'Uploaded by Milica Petrović',
    received: '2026-10-06T09:14',
    file: 'Racun_09-2026 (1).pdf',
    state: 'Duplicate',
    number: 'ST-2026-09-4471',
    total: '18240.00',
    duplicateOf: 'u11',
    pages: [simplePage('SIGNAL TELEKOM d.o.o.', ['Račun ST-2026-09-4471'], '18.240,00 RSD')],
    regions: [],
  },
  {
    id: 'u12',
    kind: 'Bank statement',
    source: 'E-mail',
    sender: 'Banca Intesa',
    senderDetail: 'izvodi@bank.example.com',
    received: '2026-10-03T07:30',
    file: 'izvod-187.pdf',
    state: 'Posted',
    number: '187',
    postedAs: 'Statement 187',
    pages: [simplePage('IZVOD BR. 187', ['Račun 160-0000000456789-12'])],
    regions: [],
  },
  {
    id: 'u13',
    kind: 'Receipt',
    source: 'Scan',
    sender: 'Papirus Novi Sad d.o.o.',
    senderDetail: 'Office scanner',
    received: '2026-10-08T12:44',
    file: 'Scan_2026-10-08_1244.pdf',
    state: 'Posted',
    number: '7C1D-02-5530',
    total: '3560.00',
    postedAs: 'Petty cash 2026-041',
    pages: [receiptPage(['PAPIRUS NOVI SAD', 'Kancelarijski materijal', 'UKUPNO: 3.560,00'])],
    regions: [],
  },
  {
    id: 'u15',
    kind: 'Contract',
    source: 'E-mail',
    sender: 'Gradska toplana Novi Sad',
    senderDetail: 'ugovori@toplana.example.com',
    received: '2026-10-07T13:25',
    file: 'Ugovor_odrzavanje_2026.pdf',
    state: 'Posted',
    postedAs: 'Contract UG-2026-018',
    pages: [simplePage('UGOVOR O ODRŽAVANJU', ['Gradska toplana Novi Sad', 'Broj UG-2026-018'])],
    regions: [],
  },
  {
    id: 'u14',
    kind: 'Other',
    source: 'Upload',
    sender: 'Skele Sistem d.o.o.',
    senderDetail: 'Uploaded by Milica Petrović',
    received: '2026-10-07T10:05',
    file: 'Ponuda_skela.pdf',
    state: 'Rejected',
    rejectReason: 'Not a business document: an offer, kept by the site manager.',
    pages: [simplePage('PONUDA 118/2026', ['Skele Sistem d.o.o.', 'Najam skele, 3 meseca'])],
    regions: [],
  },
  {
    id: 'u18',
    kind: 'Receipt',
    source: 'Upload',
    sender: 'Restoran Dunav',
    senderDetail: 'Uploaded from a phone by Nikola Marković',
    received: '2026-10-09T21:12',
    file: 'IMG_1988.jpg',
    state: 'Rejected',
    number: '2B7A-11-0904',
    total: '4200.00',
    rejectReason: 'Not addressed to us: a private expense.',
    pages: [receiptPage(['RESTORAN DUNAV', 'UKUPNO: 4.200,00'])],
    regions: [],
  },
]

/** The states still to review, in the order the queue takes them (oldest first). */
export const TO_REVIEW: readonly DocState[] = ['New', 'Recognised', 'Needs review']

export function isToReview(doc: InboxDoc): boolean {
  return TO_REVIEW.includes(doc.state)
}

/** The reasons a document is rejected (the application's list). */
export const REJECT_REASONS = [
  { value: 'notOurs', label: 'Not addressed to us' },
  { value: 'notBusiness', label: 'Not a business document' },
  { value: 'cancelled', label: 'Cancelled by the sender' },
]

/** The inbox's saved views. */
export const INBOX_VIEWS = [
  { id: 'review', label: 'To review' },
  { id: 'posted', label: 'Posted' },
  { id: 'closed', label: 'Rejected and duplicates' },
  { id: 'all', label: 'All' },
] as const

export type InboxView = (typeof INBOX_VIEWS)[number]['id']

export function inInboxView(doc: InboxDoc, view: InboxView): boolean {
  if (view === 'review') return isToReview(doc)
  if (view === 'posted') return doc.state === 'Posted'
  if (view === 'closed') return doc.state === 'Rejected' || doc.state === 'Duplicate'
  return true
}

/** The candidates the application proposes as the original of a document. */
export function originalCandidates(doc: InboxDoc, documents: readonly InboxDoc[]): InboxDoc[] {
  return documents.filter(
    (other) =>
      other.id !== doc.id &&
      other.state !== 'Duplicate' &&
      other.sender === doc.sender &&
      other.kind === doc.kind &&
      (other.number === doc.number || other.id === doc.duplicateOf),
  )
}
