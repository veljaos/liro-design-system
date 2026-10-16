/*
 * Group BE's example data (P5.66, a document from a JSON definition): Kvadrat Gradnja d.o.o. on
 * 14 October 2026 at 09:40, seen by Milica Petrović. The application's list of document types,
 * each with its field definitions (the JSON the application keeps per type: sections, field types,
 * required, conditions — data, drawn by DefinedForm), the values of a draft, and the pages its PDF
 * renderer (liro-core-pdf) returns for the preview — played here as viewer pages. The design
 * system renders the form only, never the document. Every name, number and legal wording is
 * invented and labelled illustrative; e-mail addresses at example.com. No classes here.
 */
import { viewer } from '../../../../packages/ui/src/components/document-frame-story-data'
import type { DefinedSection, DefinedValue, DefinedValues, Signer } from '@veljaos/ui'
import { PEOPLE } from './data-AJ'

export const BE_TODAY = '2026-10-14'
export const BE_NOW = '2026-10-14T09:40:00+02:00'

/** The decision on annual leave numbered from the registry book (group BF, entry 412). */
export const LEAVE_NUMBER = '01-412/2026'
/** The same number in an address. */
const LEAVE_SLUG = '01-412-2026'

const BASE = '/records/documents'

export const BE_ROUTES = {
  /** Choose the document type. */
  types: `${BASE}/new`,
  /** A new document of a type. */
  draft: (type: string) => `${BASE}/new/${type}`,
  /** The decision on Nikola Marković's annual leave, filled in, its preview ready. */
  leave: `${BASE}/new/decision-leave`,
  /** The same, sent to the preview with two values missing. */
  leaveMissing: `${BASE}/new/decision-leave?missing`,
  /** The preview while the application renders it. */
  leaveLoading: `${BASE}/new/decision-leave?preview=loading`,
  /** The preview the application could not render. */
  leaveFailed: `${BASE}/new/decision-leave?preview=failed`,
  /** Numbered from the registry book: read-only, ready to send for signature. */
  leaveNumbered: `${BASE}/${LEAVE_SLUG}`,
  /** Sent for signature: the director signs, then the employee confirms receipt. */
  leaveSigning: `${BASE}/${LEAVE_SLUG}/signing`,
  /** Both signatures in. */
  leaveSigned: `${BASE}/${LEAVE_SLUG}/signing?signed`,
  businessLetter: `${BASE}/new/business-letter`,
  proforma: `${BASE}/new/proforma`,
  invoiceAbroad: `${BASE}/new/invoice-abroad`,
  boardMinutes: `${BASE}/new/minutes-supervisory-board`,
} as const

// ── Field options from the application ────────────────────────────────────────────────────────

const EMPLOYEES = PEOPLE.filter((person) => person.vacant !== true).map((person) => ({
  value: person.id,
  label: person.name,
}))

const SIGNATORIES = [
  { value: 'director', label: 'Nenad Kovačević, Director' },
  { value: 'hr', label: 'Jelena Marković, HR manager, by authorisation' },
]

const COUNTRIES = [
  { value: 'RS', label: 'Serbia' },
  { value: 'HU', label: 'Hungary' },
  { value: 'HR', label: 'Croatia' },
  { value: 'DE', label: 'Germany' },
  { value: 'AT', label: 'Austria' },
]

const BODIES = [
  { value: 'director', label: 'Director' },
  { value: 'assembly', label: 'General assembly' },
  { value: 'supervisory', label: 'Supervisory board' },
]

// ── The definitions (the application's JSON) ─────────────────────────────────────────────────

/** Rešenje: a decision on an employee's annual leave. */
const LEAVE: DefinedSection[] = [
  {
    id: 'employee',
    title: 'Employee',
    fields: [
      {
        id: 'employee',
        type: 'select',
        label: 'Employee',
        required: true,
        options: EMPLOYEES,
      },
      {
        id: 'position',
        type: 'text',
        label: 'Position',
        readOnly: true,
        description: 'From the employee’s record.',
      },
    ],
  },
  {
    id: 'leave',
    title: 'Annual leave',
    description: 'Days as the leave plan gives them; the entitlement is the application’s.',
    fields: [
      { id: 'year', type: 'text', label: 'For the year', readOnly: true, direction: 'ltr' },
      {
        id: 'entitlement',
        type: 'number',
        label: 'Working days of leave in the year',
        readOnly: true,
      },
      {
        id: 'mode',
        type: 'radio',
        label: 'Used',
        required: true,
        fullWidth: true,
        options: [
          { value: 'once', label: 'At once' },
          {
            value: 'parts',
            label: 'In two parts',
            description:
              'The first part at least two working weeks, as the law asks (illustrative).',
          },
        ],
      },
      { id: 'firstFrom', type: 'date', label: 'From', required: true },
      { id: 'firstTo', type: 'date', label: 'To', required: true },
      { id: 'firstDays', type: 'number', label: 'Working days', required: true },
      {
        id: 'secondFrom',
        type: 'date',
        label: 'Second part from',
        required: true,
        visibleWhen: { field: 'mode', equals: 'parts' },
      },
      {
        id: 'secondTo',
        type: 'date',
        label: 'Second part to',
        required: true,
        visibleWhen: { field: 'mode', equals: 'parts' },
      },
      {
        id: 'secondDays',
        type: 'number',
        label: 'Second part, working days',
        required: true,
        visibleWhen: { field: 'mode', equals: 'parts' },
      },
    ],
  },
  {
    id: 'delivery',
    title: 'Delivery',
    fields: [
      {
        id: 'delivery',
        type: 'radio',
        label: 'Delivered',
        required: true,
        options: [
          { value: 'hand', label: 'In person, against signature' },
          { value: 'email', label: 'By e-mail, with a read receipt' },
        ],
      },
      {
        id: 'email',
        type: 'email',
        label: 'Employee’s e-mail',
        required: true,
        visibleWhen: { field: 'delivery', equals: 'email' },
      },
      {
        id: 'remedy',
        type: 'textarea',
        label: 'Legal remedy',
        readOnly: true,
        fullWidth: true,
        description: 'The template’s wording (illustrative).',
      },
    ],
  },
  {
    id: 'signatory',
    title: 'Signatory',
    fields: [
      {
        id: 'signatory',
        type: 'select',
        label: 'Signed by',
        required: true,
        options: SIGNATORIES,
      },
      {
        id: 'authorisation',
        type: 'text',
        label: 'Authorisation number',
        direction: 'ltr',
        required: true,
        visibleWhen: { field: 'signatory', equals: 'hr' },
      },
    ],
  },
]

/** Odluka: a decision of the director or a company body. */
const DECISION: DefinedSection[] = [
  {
    id: 'decision',
    title: 'Decision',
    fields: [
      { id: 'adoptedBy', type: 'select', label: 'Adopted by', required: true, options: BODIES },
      { id: 'subject', type: 'text', label: 'Subject', required: true },
      { id: 'legalBasis', type: 'text', label: 'Legal basis', readOnly: true },
      { id: 'decided', type: 'textarea', label: 'Decided', required: true, fullWidth: true },
      {
        id: 'effective',
        type: 'radio',
        label: 'In force',
        required: true,
        options: [
          { value: 'adoption', label: 'On the day it is adopted' },
          { value: 'date', label: 'From a date' },
        ],
      },
      {
        id: 'effectiveDate',
        type: 'date',
        label: 'In force from',
        required: true,
        visibleWhen: { field: 'effective', equals: 'date' },
      },
      { id: 'noticeBoard', type: 'switch', label: 'Published on the notice board' },
    ],
  },
]

/** Zaključak: a conclusion in a procedure. */
const CONCLUSION: DefinedSection[] = [
  {
    id: 'conclusion',
    title: 'Conclusion',
    fields: [
      { id: 'case', type: 'text', label: 'Case number', direction: 'ltr', required: true },
      { id: 'subject', type: 'text', label: 'Subject', required: true },
      { id: 'text', type: 'textarea', label: 'Concluded', required: true, fullWidth: true },
      {
        id: 'remedy',
        type: 'select',
        label: 'Legal remedy',
        required: true,
        options: [
          { value: 'none', label: 'No separate appeal (illustrative)' },
          { value: 'appeal8', label: 'Appeal within 8 days (illustrative)' },
        ],
      },
    ],
  },
]

/** Dopis: a letter to an authority or a partner. */
const LETTER: DefinedSection[] = [
  {
    id: 'to',
    title: 'Recipient',
    fields: [
      { id: 'recipient', type: 'text', label: 'Recipient', required: true },
      { id: 'address', type: 'textarea', label: 'Address', rows: 2 },
      { id: 'theirRef', type: 'text', label: 'Their reference', direction: 'ltr' },
      {
        id: 'channel',
        type: 'radio',
        label: 'Sent by',
        required: true,
        options: [
          { value: 'post', label: 'Registered post' },
          { value: 'email', label: 'E-mail' },
        ],
      },
      {
        id: 'email',
        type: 'email',
        label: 'Recipient’s e-mail',
        required: true,
        visibleWhen: { field: 'channel', equals: 'email' },
      },
    ],
  },
  {
    id: 'content',
    title: 'Content',
    fields: [
      { id: 'subject', type: 'text', label: 'Subject', required: true, fullWidth: true },
      { id: 'body', type: 'textarea', label: 'Text', required: true, rows: 6, fullWidth: true },
      { id: 'enclosures', type: 'number', label: 'Enclosures' },
    ],
  },
]

/** Poslovno pismo: a business letter, in English or Serbian. */
const BUSINESS_LETTER: DefinedSection[] = [
  {
    id: 'recipient',
    title: 'Recipient',
    fields: [
      { id: 'company', type: 'text', label: 'Company', required: true },
      { id: 'country', type: 'select', label: 'Country', required: true, options: COUNTRIES },
      { id: 'contact', type: 'text', label: 'Contact person' },
      {
        id: 'language',
        type: 'radio',
        label: 'Language of the letter',
        required: true,
        options: [
          { value: 'en', label: 'English' },
          { value: 'sr-Latn', label: 'Serbian (Latin)' },
        ],
      },
    ],
  },
  {
    id: 'letter',
    title: 'Letter',
    fields: [
      {
        id: 'salutation',
        type: 'select',
        label: 'Salutation',
        required: true,
        options: [
          { value: 'named', label: 'Dear + the contact person’s name' },
          { value: 'general', label: 'Dear Sir or Madam' },
        ],
      },
      { id: 'subject', type: 'text', label: 'Subject', required: true },
      { id: 'body', type: 'textarea', label: 'Text', required: true, rows: 8, fullWidth: true },
      {
        id: 'closing',
        type: 'select',
        label: 'Closing',
        required: true,
        options: [
          { value: 'regards', label: 'Kind regards' },
          { value: 'sincerely', label: 'Yours sincerely' },
        ],
      },
      { id: 'signatory', type: 'select', label: 'Signed by', required: true, options: SIGNATORIES },
    ],
  },
]

/**
 * A commercial document outside SEF: a proforma invoice, an invoice or an advance invoice for a
 * buyer abroad. One definition; the document's kind is a context value the conditions read.
 */
const COMMERCIAL: DefinedSection[] = [
  {
    id: 'buyer',
    title: 'Buyer',
    fields: [
      { id: 'buyer', type: 'text', label: 'Buyer', required: true },
      { id: 'country', type: 'select', label: 'Country', required: true, options: COUNTRIES },
      {
        id: 'buyerVat',
        type: 'text',
        label: 'Buyer’s VAT number',
        direction: 'ltr',
        requiredWhen: { field: 'country', notEquals: 'RS' },
        visibleWhen: { field: 'country', filled: true },
      },
      {
        id: 'currency',
        type: 'select',
        label: 'Currency',
        required: true,
        options: [
          { value: 'EUR', label: 'EUR' },
          { value: 'RSD', label: 'RSD' },
        ],
      },
    ],
  },
  {
    id: 'terms',
    title: 'Terms',
    fields: [
      {
        id: 'validUntil',
        type: 'date',
        label: 'Valid until',
        required: true,
        visibleWhen: { field: 'documentKind', equals: 'proforma' },
      },
      {
        id: 'supplyDate',
        type: 'date',
        label: 'Date of supply',
        required: true,
        visibleWhen: { field: 'documentKind', equals: 'invoice' },
      },
      {
        id: 'advanceFor',
        type: 'text',
        label: 'Advance for contract',
        direction: 'ltr',
        required: true,
        visibleWhen: { field: 'documentKind', equals: 'advance' },
      },
      { id: 'dueDate', type: 'date', label: 'Payment due', required: true },
      {
        id: 'exemption',
        type: 'select',
        label: 'VAT exemption',
        description: 'The basis printed on the document (illustrative wording).',
        requiredWhen: { field: 'country', notEquals: 'RS' },
        visibleWhen: {
          all: [
            { field: 'country', filled: true },
            { field: 'country', notEquals: 'RS' },
          ],
        },
        options: [
          { value: 'export', label: 'Export of goods (illustrative article 24)' },
          { value: 'services', label: 'Services to a foreign person (illustrative article 12)' },
        ],
      },
      { id: 'incoterms', type: 'text', label: 'Delivery terms', direction: 'ltr' },
    ],
  },
  {
    id: 'lines',
    title: 'Lines',
    description: 'The lines and their amounts are the application’s.',
    columns: 1,
    fields: [{ id: 'lines', type: 'custom', label: 'Lines' }],
  },
]

/** Pravilnik: a rulebook (an internal act). */
const RULEBOOK: DefinedSection[] = [
  {
    id: 'act',
    title: 'Rulebook',
    fields: [
      { id: 'name', type: 'text', label: 'Name', required: true, fullWidth: true },
      { id: 'adoptedBy', type: 'select', label: 'Adopted by', required: true, options: BODIES },
      { id: 'legalBasis', type: 'text', label: 'Legal basis', readOnly: true },
      {
        id: 'effective',
        type: 'radio',
        label: 'In force',
        required: true,
        fullWidth: true,
        options: [
          { value: 'eighth', label: 'On the eighth day after it is published on the notice board' },
          { value: 'adoption', label: 'On the day it is adopted' },
          { value: 'date', label: 'From a date' },
        ],
      },
      {
        id: 'effectiveDate',
        type: 'date',
        label: 'In force from',
        required: true,
        visibleWhen: { field: 'effective', equals: 'date' },
      },
      { id: 'replaces', type: 'switch', label: 'Replaces an earlier rulebook' },
      {
        id: 'replaced',
        type: 'text',
        label: 'Rulebook it replaces',
        required: true,
        visibleWhen: { field: 'replaces', equals: true },
      },
      { id: 'text', type: 'textarea', label: 'Articles', required: true, rows: 8, fullWidth: true },
    ],
  },
]

/** Zapisnik: minutes of an occasion (a handover, an inspection, a commission). */
const MINUTES: DefinedSection[] = [
  {
    id: 'meeting',
    title: 'Minutes',
    fields: [
      { id: 'occasion', type: 'text', label: 'Occasion', required: true, fullWidth: true },
      { id: 'date', type: 'date', label: 'Date', required: true },
      { id: 'place', type: 'text', label: 'Place', required: true },
      { id: 'present', type: 'textarea', label: 'Present', required: true, fullWidth: true },
      { id: 'course', type: 'textarea', label: 'Course', rows: 6, fullWidth: true },
      { id: 'conclusions', type: 'textarea', label: 'Conclusions', fullWidth: true },
    ],
  },
]

/** Izveštaj: a report. */
const REPORT: DefinedSection[] = [
  {
    id: 'report',
    title: 'Report',
    fields: [
      { id: 'subject', type: 'text', label: 'Subject', required: true, fullWidth: true },
      { id: 'from', type: 'date', label: 'Period from', required: true },
      { id: 'to', type: 'date', label: 'Period to', required: true },
      {
        id: 'summary',
        type: 'textarea',
        label: 'Summary',
        required: true,
        rows: 6,
        fullWidth: true,
      },
      {
        id: 'recipients',
        type: 'multiselect',
        label: 'For',
        options: [
          { value: 'director', label: 'Director' },
          { value: 'assembly', label: 'General assembly' },
          { value: 'supervisory', label: 'Supervisory board' },
          { value: 'accountant', label: 'Knjigovodstvo Jelić' },
        ],
      },
    ],
  },
]

/**
 * The minutes of a meeting of a company body; the body is a context value. Who was present and
 * the quorum are the application's figures and words, from the meeting (group BH).
 */
const BODY_MINUTES: DefinedSection[] = [
  {
    id: 'meeting',
    title: 'Meeting',
    fields: [
      { id: 'meetingDate', type: 'date', label: 'Held on', required: true },
      { id: 'place', type: 'text', label: 'Place', required: true },
      { id: 'chair', type: 'text', label: 'Chaired by', required: true },
      { id: 'minuteTaker', type: 'text', label: 'Minutes taken by', required: true },
      { id: 'present', type: 'textarea', label: 'Present', readOnly: true, fullWidth: true },
      { id: 'quorum', type: 'text', label: 'Quorum', readOnly: true, fullWidth: true },
      {
        id: 'auditor',
        type: 'text',
        label: 'Auditor’s representative',
        visibleWhen: { field: 'body', equals: 'supervisory' },
      },
    ],
  },
  {
    id: 'course',
    title: 'Agenda and decisions',
    columns: 1,
    fields: [
      { id: 'agenda', type: 'textarea', label: 'Agenda adopted', readOnly: true },
      {
        id: 'decisions',
        type: 'textarea',
        label: 'Decisions and votes',
        required: true,
        rows: 8,
        description: 'The votes are the application’s record of the meeting.',
      },
      { id: 'closedAt', type: 'text', label: 'Closed at', direction: 'ltr' },
    ],
  },
]

/** Zapisnik o uništenju: the minutes of a disposal of archival material (group BG). */
const DISPOSAL_MINUTES: DefinedSection[] = [
  {
    id: 'disposal',
    title: 'Disposal',
    fields: [
      { id: 'list', type: 'text', label: 'Disposal list', readOnly: true, direction: 'ltr' },
      { id: 'units', type: 'text', label: 'Units disposed', readOnly: true },
      { id: 'commission', type: 'textarea', label: 'Commission', readOnly: true, fullWidth: true },
      { id: 'date', type: 'date', label: 'Disposed on', required: true },
      {
        id: 'method',
        type: 'radio',
        label: 'How',
        required: true,
        fullWidth: true,
        options: [
          { value: 'shredded', label: 'Shredded on the premises' },
          { value: 'contractor', label: 'Handed to a contractor for destruction' },
        ],
      },
      {
        id: 'contractor',
        type: 'text',
        label: 'Contractor',
        required: true,
        visibleWhen: { field: 'method', equals: 'contractor' },
      },
      {
        id: 'certificate',
        type: 'text',
        label: 'Contractor’s certificate',
        direction: 'ltr',
        visibleWhen: { field: 'method', equals: 'contractor' },
      },
      { id: 'archiveConsent', type: 'text', label: 'Archive’s consent', readOnly: true },
    ],
  },
]

// ── The types (the application's list) ───────────────────────────────────────────────────────

export interface DocumentType {
  id: string
  group: string
  label: string
  description: string
  /** The type's field definitions (JSON). */
  sections: DefinedSection[]
  /** Values the conditions read that are no field: the document's kind, the body. */
  context?: DefinedValues
  /** The values a new document starts with (filled in by the application). */
  start: DefinedValues
  /** The document's title in the preview's heading. */
  title: string
}

const REMEDY =
  'Against this decision the employee may start a dispute before the competent court within 60 days of its delivery (illustrative wording).'

export const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'decision-leave',
    group: 'Decisions and conclusions',
    label: 'Decision on annual leave',
    description: 'Rešenje: one employee’s leave, at once or in two parts.',
    sections: LEAVE,
    start: {
      year: '2026',
      remedy: REMEDY,
      signatory: 'director',
      delivery: 'hand',
      mode: 'once',
    },
    title: 'Decision on annual leave',
  },
  {
    id: 'decision',
    group: 'Decisions and conclusions',
    label: 'Decision',
    description: 'Odluka of the director, the general assembly or the supervisory board.',
    sections: DECISION,
    start: {
      legalBasis: 'Article 12 of the Articles of Association (illustrative)',
      effective: 'adoption',
      noticeBoard: false,
    },
    title: 'Decision',
  },
  {
    id: 'conclusion',
    group: 'Decisions and conclusions',
    label: 'Conclusion',
    description: 'Zaključak in a procedure: what was concluded and the remedy.',
    sections: CONCLUSION,
    start: {},
    title: 'Conclusion',
  },
  {
    id: 'letter',
    group: 'Letters',
    label: 'Letter',
    description: 'Dopis to an authority or a partner, by post or e-mail.',
    sections: LETTER,
    start: { channel: 'post' },
    title: 'Letter',
  },
  {
    id: 'business-letter',
    group: 'Letters',
    label: 'Business letter',
    description: 'To a partner at home or abroad, in English or Serbian.',
    sections: BUSINESS_LETTER,
    start: {
      company: 'Donau Bau GmbH',
      country: 'AT',
      contact: 'Katharina Huber',
      language: 'en',
      salutation: 'named',
      subject: 'Offer for the facade panels of Residential building Liman 4',
      body: 'Thank you for your enquiry of 8 October. We are pleased to send you our offer for the facade panels; the proforma invoice follows separately.',
      closing: 'regards',
      signatory: 'director',
    },
    title: 'Business letter',
  },
  {
    id: 'proforma',
    group: 'Commercial documents outside SEF',
    label: 'Proforma invoice',
    description: 'An offer to pay in advance; never sent to SEF.',
    sections: COMMERCIAL,
    context: { documentKind: 'proforma' },
    start: {
      buyer: 'Donau Bau GmbH',
      country: 'AT',
      buyerVat: 'ATU12345678',
      currency: 'EUR',
      validUntil: '2026-10-28',
      dueDate: '2026-10-28',
      exemption: 'export',
      incoterms: 'FCA Novi Sad',
    },
    title: 'Proforma invoice',
  },
  {
    id: 'invoice-abroad',
    group: 'Commercial documents outside SEF',
    label: 'Invoice for abroad',
    description: 'For a buyer abroad, outside SEF.',
    sections: COMMERCIAL,
    context: { documentKind: 'invoice' },
    start: { currency: 'EUR' },
    title: 'Invoice',
  },
  {
    id: 'advance-abroad',
    group: 'Commercial documents outside SEF',
    label: 'Advance invoice for abroad',
    description: 'An advance received from a buyer abroad.',
    sections: COMMERCIAL,
    context: { documentKind: 'advance' },
    start: { currency: 'EUR' },
    title: 'Advance invoice',
  },
  {
    id: 'rulebook',
    group: 'Internal acts and records',
    label: 'Rulebook',
    description: 'Pravilnik: an internal act and when it comes into force.',
    sections: RULEBOOK,
    start: {
      legalBasis: 'Article 12 of the Articles of Association (illustrative)',
      effective: 'eighth',
      replaces: false,
    },
    title: 'Rulebook',
  },
  {
    id: 'minutes',
    group: 'Internal acts and records',
    label: 'Minutes',
    description: 'Zapisnik of a handover, an inspection or a commission.',
    sections: MINUTES,
    start: {},
    title: 'Minutes',
  },
  {
    id: 'report',
    group: 'Internal acts and records',
    label: 'Report',
    description: 'For the director, a body or the accountant.',
    sections: REPORT,
    start: {},
    title: 'Report',
  },
  {
    id: 'minutes-disposal',
    group: 'Internal acts and records',
    label: 'Minutes of a disposal',
    description: 'Archival material destroyed after its retention period.',
    sections: DISPOSAL_MINUTES,
    start: {
      list: 'LB-2026-01',
      units: '4 units, 8 binders (archive book nos. 41, 42, 55 and 70)',
      commission: 'Ana Marić, chair; Milica Petrović; Ivan Lukić',
      date: '2026-10-14',
      method: 'contractor',
      contractor: 'Papir Reciklaža d.o.o. (illustrative)',
      archiveConsent: 'Historical Archive of Novi Sad (illustrative), no. 03-1187/2026',
    },
    title: 'Minutes of the disposal of archival material',
  },
  {
    id: 'minutes-general-assembly',
    group: 'Company bodies',
    label: 'Minutes of the general assembly',
    description: 'The meeting, the quorum, the agenda and the decisions.',
    sections: BODY_MINUTES,
    context: { body: 'assembly' },
    start: {},
    title: 'Minutes of the general assembly',
  },
  {
    id: 'minutes-supervisory-board',
    group: 'Company bodies',
    label: 'Minutes of the supervisory board',
    description: 'The meeting, the quorum, the agenda and the decisions.',
    sections: BODY_MINUTES,
    context: { body: 'supervisory' },
    start: {
      meetingDate: '2026-10-08',
      place: 'Kvadrat Gradnja d.o.o., Bulevar oslobođenja 102, Novi Sad, meeting room',
      chair: 'Vesna Radović, chair of the board',
      minuteTaker: 'Ana Marić',
      present:
        'Vesna Radović, Bojan Kovač, Jasmina Lukić, Đorđe Pantić; Nenad Kovačević, Director, invited',
      quorum: '4 of 5 members present: the board may decide (at least 3).',
      agenda:
        '1. Minutes of the previous meeting\n2. Report on the third quarter\n3. Residential building Liman 4: the facade contract\n4. Rulebook on business travel',
      decisions: '',
      closedAt: '11:20',
    },
    title: 'Minutes of the supervisory board',
  },
  {
    id: 'minutes-management-board',
    group: 'Company bodies',
    label: 'Minutes of the management board',
    description: 'The meeting, the quorum, the agenda and the decisions.',
    sections: BODY_MINUTES,
    context: { body: 'management' },
    start: {},
    title: 'Minutes of the management board',
  },
]

export function documentType(id: string): DocumentType | undefined {
  return DOCUMENT_TYPES.find((type) => type.id === id)
}

/** Nikola Marković's leave, as Milica filled it in (two parts). */
export const LEAVE_VALUES: DefinedValues = {
  ...(documentType('decision-leave')?.start ?? {}),
  employee: 'l-2',
  position: 'Site worker, Residential building Liman 4',
  entitlement: '22',
  mode: 'parts',
  firstFrom: '2026-10-26',
  firstTo: '2026-11-06',
  firstDays: '10',
  secondFrom: '2026-12-21',
  secondTo: '2026-12-31',
  secondDays: '8',
  delivery: 'hand',
}

/** Sent to the preview with the second part's dates missing. */
export const LEAVE_MISSING: DefinedValues = {
  ...LEAVE_VALUES,
  secondFrom: null,
  secondTo: null,
}

/** The proforma's lines, the application's (amounts and totals included). */
export const PROFORMA_LINES = [
  {
    id: 'l1',
    item: 'Facade panel FP-60, anthracite',
    quantity: '420',
    unit: 'm²',
    price: '38.50',
    amount: '16170.00',
  },
  {
    id: 'l2',
    item: 'Fixing set FS-2',
    quantity: '60',
    unit: 'set',
    price: '12.00',
    amount: '720.00',
  },
]
export const PROFORMA_TOTAL = '16890.00'

// ── The signers ───────────────────────────────────────────────────────────────────────────────

export const LEAVE_SIGNERS: Signer[] = [
  { id: 'director', name: 'Nenad Kovačević', role: 'Director', state: 'waiting' },
  {
    id: 'employee',
    name: 'Nikola Marković',
    role: 'Employee, confirms receipt',
    state: 'waiting',
  },
]

export const LEAVE_SIGNED: Signer[] = [
  {
    id: 'director',
    name: 'Nenad Kovačević',
    role: 'Director',
    state: 'signed',
    at: '2026-10-14T10:12:00+02:00',
  },
  {
    id: 'employee',
    name: 'Nikola Marković',
    role: 'Employee, confirms receipt',
    state: 'signed',
    at: '2026-10-14T13:05:00+02:00',
  },
]

// ── The application's renderer (liro-core-pdf), played ────────────────────────────────────────

function escape(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

/** DD.MM.YYYY. as the renderer prints a date. */
function printedDate(value: DefinedValue | undefined): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return '…'
  const [year, month, day] = value.split('-')
  return `${String(day)}.${String(month)}.${String(year)}.`
}

function text(value: DefinedValue | undefined): string {
  if (typeof value === 'string' && value.trim() !== '') return escape(value)
  return '…'
}

function personName(id: DefinedValue | undefined): string {
  return escape(PEOPLE.find((person) => person.id === id)?.name ?? '…')
}

/** The decision on annual leave as the template prints it (Serbian, illustrative wording). */
function leavePages(values: DefinedValues, number: string | null): string[] {
  const parts =
    values.mode === 'parts'
      ? `<p>Prvi deo od ${printedDate(values.firstFrom)} do ${printedDate(values.firstTo)}, ${text(values.firstDays)} radnih dana; drugi deo od ${printedDate(values.secondFrom)} do ${printedDate(values.secondTo)}, ${text(values.secondDays)} radnih dana.</p>`
      : `<p>Od ${printedDate(values.firstFrom)} do ${printedDate(values.firstTo)}, ${text(values.firstDays)} radnih dana.</p>`
  const signatory =
    values.signatory === 'hr'
      ? `Jelena Marković, menadžer ljudskih resursa, po ovlašćenju br. ${text(values.authorisation)}`
      : 'Nenad Kovačević, direktor'
  return [
    `<p>Kvadrat Gradnja d.o.o., Novi Sad, PIB 108452317</p>
     <p>Broj: ${number === null ? '<em>dodeljuje se iz delovodnika</em>' : escape(number)}<br>Datum: ${printedDate(BE_TODAY)}</p>
     <h1>REŠENJE o korišćenju godišnjeg odmora za ${text(values.year)}. godinu</h1>
     <p>Zaposlenom ${personName(values.employee)}, ${text(values.position)}, utvrđuje se pravo na godišnji odmor u trajanju od ${text(values.entitlement)} radnih dana.</p>
     ${parts}
     <h2>Obrazloženje</h2>
     <p>Rešenje je doneto u skladu sa planom korišćenja godišnjih odmora (ilustrativni tekst).</p>
     <h2>Pouka o pravnom leku</h2>
     <p>${text(values.remedy)}</p>`,
    `<p>Dostavljeno: ${values.delivery === 'email' ? `elektronskom poštom na ${text(values.email)}` : 'lično, uz potpis'}</p>
     <p>${signatory}</p>
     <p><em>Ilustrativni dokument iz primera.</em></p>`,
  ]
}

/** Any other type: its title and every shown value, as the renderer's default layout prints it. */
function genericPages(
  type: DocumentType,
  submitted: Readonly<Record<string, DefinedValue>>,
  number: string | null,
): string[] {
  const rows = type.sections.flatMap((section) =>
    section.fields
      .filter((field) => field.id in submitted && field.type !== 'custom')
      .map((field) => {
        const value = submitted[field.id]
        const shown =
          field.type === 'date'
            ? printedDate(value)
            : typeof value === 'boolean'
              ? value
                ? 'Yes'
                : 'No'
              : Array.isArray(value)
                ? (value as readonly string[])
                    .map(
                      (each) =>
                        field.options?.find((option) => option.value === each)?.label ?? each,
                    )
                    .join(', ') || '…'
                : field.options !== undefined
                  ? escape(field.options.find((option) => option.value === value)?.label ?? '…')
                  : text(value)
        return `<p><strong>${escape(field.label)}:</strong> ${shown}</p>`
      }),
  )
  return [
    `<p>Kvadrat Gradnja d.o.o., Novi Sad, PIB 108452317</p>
     <p>No. ${number === null ? '<em>assigned from the registry book</em>' : escape(number)} · ${printedDate(BE_TODAY)}</p>
     <h1>${escape(type.title)}</h1>
     ${rows.join('\n')}
     <p><em>Illustrative document of the examples.</em></p>`,
  ]
}

/** What the renderer returns for a document: its viewer, or its error. */
export function previewDocument(
  type: DocumentType,
  submitted: Readonly<Record<string, DefinedValue>>,
  number: string | null,
  state: 'ready' | 'loading' | 'failed',
): string {
  const title = number === null ? type.title : `${type.title} ${number}`
  if (state === 'failed') {
    return viewer({
      title,
      lang: 'en',
      pages: [],
      error:
        'The template could not be rendered: the PDF service did not answer in time. Your values are kept.',
    })
  }
  if (state === 'loading') return viewer({ title, lang: 'en', pages: [], silent: true })
  const leave = type.id === 'decision-leave'
  return viewer({
    title,
    lang: leave ? 'sr-Latn' : 'en',
    pages: leave ? leavePages(submitted, number) : genericPages(type, submitted, number),
  })
}
