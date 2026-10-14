import type { RichTextMergeField, RichTextNode } from '../../../../packages/ui/src/rich-text'

/*
 * Group AB (P5.38): Kvadrat Gradnja d.o.o.'s e-mail and notification templates on 14.10.2026,
 * edited by its administrator Milica Petrović. Each template has a subject and a body per
 * language — English, Serbian in Latin and in Cyrillic script (never a bare "sr", D12) — with
 * merge fields the application fills when it sends. Invented data; addresses at example.com.
 */

export const AB_TODAY = '2026-10-14'

export const AB_ROUTES = {
  list: '/settings/email-templates',
  template: (id: string) => `/settings/email-templates/${id}`,
  /** The invoice e-mail with the versions open, the test dialog open, previews. */
  versions: '/settings/email-templates/invoice/versions',
  sendTest: '/settings/email-templates/invoice/send-test',
  darkPhone: '/settings/email-templates/invoice/preview-dark-phone',
  cyrillic: '/settings/email-templates/invoice/sr-Cyrl',
  /** The welcome e-mail on its missing Cyrillic variant. */
  missing: '/settings/email-templates/welcome/sr-Cyrl',
}

export type Lang = 'en' | 'sr-Latn' | 'sr-Cyrl'

export const LANGS: readonly { code: Lang; label: string }[] = [
  { code: 'en', label: 'English' },
  { code: 'sr-Latn', label: 'Srpski (latinica)' },
  { code: 'sr-Cyrl', label: 'Српски (ћирилица)' },
]

export const MERGE_FIELDS: RichTextMergeField[] = [
  { key: 'customer.name', label: 'Customer name', group: 'Customer' },
  { key: 'customer.contact', label: 'Contact person', group: 'Customer' },
  { key: 'invoice.number', label: 'Invoice number', group: 'Invoice' },
  { key: 'invoice.date', label: 'Invoice date', group: 'Invoice' },
  { key: 'invoice.total', label: 'Amount due', group: 'Invoice' },
  { key: 'invoice.due', label: 'Due date', group: 'Invoice' },
  { key: 'invoice.daysLate', label: 'Days late', group: 'Invoice' },
  { key: 'payment.account', label: 'Payment account', group: 'Payment' },
  { key: 'payment.reference', label: 'Payment reference', group: 'Payment' },
  { key: 'statement.date', label: 'Statement date', group: 'Statement' },
  { key: 'statement.balance', label: 'Balance', group: 'Statement' },
  { key: 'user.name', label: 'Sender name', group: 'Kvadrat Gradnja' },
  { key: 'user.email', label: 'Recipient e-mail', group: 'Kvadrat Gradnja' },
  { key: 'company.name', label: 'Company name', group: 'Kvadrat Gradnja' },
  { key: 'link.url', label: 'Link', group: 'Kvadrat Gradnja' },
  { key: 'code.value', label: 'Code', group: 'Kvadrat Gradnja' },
]

/** The sample the preview fills in: Gradska toplana Novi Sad and invoice F-2026-0423. */
export const SAMPLE = {
  customer: 'Gradska toplana Novi Sad',
  contact: 'Petar Simić',
  invoice: 'F-2026-0423',
  invoiceDate: '2026-09-30',
  total: '1284600.00',
  due: '2026-10-30',
  daysLate: '14',
  account: '160-0000012345678-21',
  reference: '97 2026-0423',
  statementDate: '2026-09-30',
  balance: '1697100.00',
  user: 'Milica Petrović',
  email: 'petar.simic@example.com',
  company: 'Kvadrat Gradnja d.o.o.',
  link: 'https://kvadrat.example.com/i/F-2026-0423',
  code: '482 913',
}

/** The other sample for "Send test". */
export const SAMPLES = [
  { value: 'toplana', label: 'Gradska toplana Novi Sad, invoice F-2026-0423' },
  { value: 'stanogradnja', label: 'Stanogradnja Plus d.o.o., invoice F-2026-0428' },
]

export const TEST_ADDRESS = 'milica.petrovic@example.com'

/** The company's e-mail address and footer, as on its printouts. */
export const SENDER = {
  name: 'Kvadrat Gradnja d.o.o.',
  address: 'billing@kvadrat.example.com',
  footer:
    'Kvadrat Gradnja d.o.o. · Bulevar oslobođenja 102, 21000 Novi Sad · PIB 108452317 · You receive this e-mail because you are our customer.',
}

// ── The texts ────────────────────────────────────────────────────────────────────────────────

type Part = string | { field: string; bold?: boolean }

function inline(parts: readonly Part[]): RichTextNode[] {
  return parts.map((part) =>
    typeof part === 'string'
      ? { type: 'text', text: part }
      : {
          type: 'mergeField',
          attrs: { key: part.field },
          ...(part.bold === true ? { marks: [{ type: 'bold' }] } : {}),
        },
  )
}

const p = (...parts: Part[]): RichTextNode => ({ type: 'paragraph', content: inline(parts) })
const strong = (...parts: Part[]): RichTextNode => ({
  type: 'paragraph',
  content: inline(parts).map((node) => ({ ...node, marks: [{ type: 'bold' }] })),
})
/** Lines in one paragraph, broken by hard breaks. */
const lines = (...rows: Part[][]): RichTextNode => ({
  type: 'paragraph',
  content: rows.flatMap((row, index) => [
    ...(index === 0 ? [] : [{ type: 'hardBreak' }]),
    ...inline(row),
  ]),
})
const doc = (...content: RichTextNode[]): RichTextNode => ({ type: 'doc', content })
const f = (field: string): Part => ({ field })

export interface Variant {
  subject: string
  body: RichTextNode
}

export interface Template {
  id: string
  name: string
  /** When the application sends it. */
  sentWhen: string
  state: 'Active' | 'Draft'
  changed: string
  changedBy: string
  version: number
  variants: Partial<Record<Lang, Variant>>
}

const SIGNATURE_EN = lines(['Kind regards,'], [f('user.name')], [f('company.name')])
const SIGNATURE_LATN = lines(['Srdačan pozdrav,'], [f('user.name')], [f('company.name')])
const SIGNATURE_CYRL = lines(['Срдачан поздрав,'], [f('user.name')], [f('company.name')])

export const TEMPLATES: readonly Template[] = [
  {
    id: 'invoice',
    name: 'Invoice e-mail',
    sentWhen: 'An invoice is sent to a customer',
    state: 'Active',
    changed: '2026-10-14',
    changedBy: 'Milica Petrović',
    version: 7,
    variants: {
      en: {
        subject: 'Invoice {{invoice.number}} from {{company.name}}',
        body: doc(
          p('Dear ', f('customer.name'), ','),
          p('please find attached invoice ', f('invoice.number'), ' of ', f('invoice.date'), '.'),
          strong(f('invoice.total'), ' due ', f('invoice.due'), '.'),
          p(
            'Pay to account ',
            f('payment.account'),
            ' with reference ',
            f('payment.reference'),
            ', or scan the IPS QR code in the attached PDF.',
          ),
          SIGNATURE_EN,
        ),
      },
      'sr-Latn': {
        subject: 'Račun {{invoice.number}} od {{company.name}}',
        body: doc(
          p('Poštovani ', f('customer.name'), ','),
          p('u prilogu vam šaljemo račun ', f('invoice.number'), ' od ', f('invoice.date'), '.'),
          strong(f('invoice.total'), ' dospeva ', f('invoice.due'), '.'),
          p(
            'Uplatu izvršite na račun ',
            f('payment.account'),
            ' sa pozivom na broj ',
            f('payment.reference'),
            ', ili skenirajte IPS QR kod u priloženom PDF-u.',
          ),
          SIGNATURE_LATN,
        ),
      },
      'sr-Cyrl': {
        subject: 'Рачун {{invoice.number}} од {{company.name}}',
        body: doc(
          p('Поштовани ', f('customer.name'), ','),
          p('у прилогу вам шаљемо рачун ', f('invoice.number'), ' од ', f('invoice.date'), '.'),
          strong(f('invoice.total'), ' доспева ', f('invoice.due'), '.'),
          p(
            'Уплату извршите на рачун ',
            f('payment.account'),
            ' са позивом на број ',
            f('payment.reference'),
            ', или скенирајте IPS QR код у приложеном PDF-у.',
          ),
          SIGNATURE_CYRL,
        ),
      },
    },
  },
  {
    id: 'statement',
    name: 'Statement of open items (IOS)',
    sentWhen: 'Statements are sent for a cut-off date',
    state: 'Active',
    changed: '2026-09-30',
    changedBy: 'Snežana Jelić',
    version: 3,
    variants: {
      en: {
        subject: 'Statement of open items on {{statement.date}}',
        body: doc(
          p('Dear ', f('customer.name'), ','),
          p(
            'on ',
            f('statement.date'),
            ' our books show a balance of ',
            f('statement.balance'),
            ' in our favour. The statement is attached.',
          ),
          p('Please confirm it or tell us your figures within 8 days.'),
          SIGNATURE_EN,
        ),
      },
      'sr-Latn': {
        subject: 'Izvod otvorenih stavki na dan {{statement.date}}',
        body: doc(
          p('Poštovani ', f('customer.name'), ','),
          p(
            'na dan ',
            f('statement.date'),
            ' naše knjige pokazuju saldo od ',
            f('statement.balance'),
            ' u našu korist. Izvod je u prilogu.',
          ),
          p('Molimo vas da ga potvrdite ili nam pošaljete svoje podatke u roku od 8 dana.'),
          SIGNATURE_LATN,
        ),
      },
    },
  },
  {
    id: 'reminder',
    name: 'Payment reminder',
    sentWhen: 'An invoice is 7 days late',
    state: 'Active',
    changed: '2026-08-21',
    changedBy: 'Milica Petrović',
    version: 4,
    variants: {
      en: {
        subject: 'Reminder: invoice {{invoice.number}} is {{invoice.daysLate}} days late',
        body: doc(
          p('Dear ', f('customer.name'), ','),
          p(
            'invoice ',
            f('invoice.number'),
            ' was due on ',
            f('invoice.due'),
            ' and is still open.',
          ),
          strong(f('invoice.total'), ' is due now.'),
          p('If you have already paid, please ignore this e-mail.'),
          SIGNATURE_EN,
        ),
      },
      'sr-Latn': {
        subject: 'Podsetnik: račun {{invoice.number}} kasni {{invoice.daysLate}} dana',
        body: doc(
          p('Poštovani ', f('customer.name'), ','),
          p('račun ', f('invoice.number'), ' dospeo je ', f('invoice.due'), ' i još je otvoren.'),
          strong(f('invoice.total'), ' dospeva odmah.'),
          p('Ako ste već platili, zanemarite ovu poruku.'),
          SIGNATURE_LATN,
        ),
      },
    },
  },
  {
    id: 'welcome',
    name: 'Welcome',
    sentWhen: 'A person is invited to Liro',
    state: 'Active',
    changed: '2026-06-02',
    changedBy: 'Milica Petrović',
    version: 2,
    variants: {
      en: {
        subject: 'Welcome to {{company.name}} in Liro',
        body: doc(
          p('Hello ', f('customer.contact'), ','),
          p(f('user.name'), ' invited you to work with ', f('company.name'), ' in Liro.'),
          p('Open this link to set your password: ', f('link.url')),
          SIGNATURE_EN,
        ),
      },
      'sr-Latn': {
        subject: 'Dobro došli u {{company.name}} u Liru',
        body: doc(
          p('Zdravo ', f('customer.contact'), ','),
          p(f('user.name'), ' vas je pozvao da radite sa ', f('company.name'), ' u Liru.'),
          p('Otvorite ovaj link da postavite lozinku: ', f('link.url')),
          SIGNATURE_LATN,
        ),
      },
    },
  },
  {
    id: 'password',
    name: 'Password reset',
    sentWhen: 'Someone asks to reset their password',
    state: 'Active',
    changed: '2026-05-11',
    changedBy: 'Milica Petrović',
    version: 1,
    variants: {
      en: {
        subject: 'Reset your password',
        body: doc(
          p('Someone asked to reset the password of ', f('user.email'), '.'),
          p('Open this link within 30 minutes to choose a new one: ', f('link.url')),
          p('If it was not you, ignore this e-mail; your password stays as it is.'),
        ),
      },
      'sr-Latn': {
        subject: 'Promena lozinke',
        body: doc(
          p('Neko je zatražio promenu lozinke za ', f('user.email'), '.'),
          p('Otvorite ovaj link u roku od 30 minuta da izaberete novu: ', f('link.url')),
          p('Ako to niste bili vi, zanemarite ovu poruku; lozinka ostaje ista.'),
        ),
      },
      'sr-Cyrl': {
        subject: 'Промена лозинке',
        body: doc(
          p('Неко је затражио промену лозинке за ', f('user.email'), '.'),
          p('Отворите овај линк у року од 30 минута да изаберете нову: ', f('link.url')),
          p('Ако то нисте били ви, занемарите ову поруку; лозинка остаје иста.'),
        ),
      },
    },
  },
  {
    id: 'code',
    name: 'Sign-in code',
    sentWhen: 'Someone signs in with a code',
    state: 'Active',
    changed: '2026-05-11',
    changedBy: 'Milica Petrović',
    version: 1,
    variants: {
      en: {
        subject: 'Your sign-in code: {{code.value}}',
        body: doc(
          strong(f('code.value')),
          p('Enter this code to sign in. It works for 10 minutes.'),
        ),
      },
    },
  },
  {
    id: 'quote',
    name: 'Quote e-mail',
    sentWhen: 'A quote is sent to a customer',
    state: 'Draft',
    changed: '2026-10-13',
    changedBy: 'Milica Petrović',
    version: 1,
    variants: {
      en: {
        subject: 'Quote from {{company.name}}',
        body: doc(
          p('Dear ', f('customer.name'), ','),
          p('thank you for your enquiry. Our quote is attached; it is valid for 30 days.'),
          SIGNATURE_EN,
        ),
      },
    },
  },
]

export function findTemplate(id: string): Template | undefined {
  return TEMPLATES.find((each) => each.id === id)
}

export interface TemplateVersion {
  version: number
  at: string
  by: string
  note: string
}

/** The invoice e-mail's versions, newest first. */
export const INVOICE_VERSIONS: readonly TemplateVersion[] = [
  {
    version: 7,
    at: '2026-10-14T09:12:00+02:00',
    by: 'Milica Petrović',
    note: 'The amount due on a line of its own',
  },
  {
    version: 6,
    at: '2026-09-02T14:40:00+02:00',
    by: 'Snežana Jelić',
    note: 'Added the IPS QR code sentence',
  },
  {
    version: 5,
    at: '2026-06-18T10:05:00+02:00',
    by: 'Milica Petrović',
    note: 'Serbian Cyrillic variant',
  },
  {
    version: 4,
    at: '2026-03-03T08:30:00+01:00',
    by: 'Milica Petrović',
    note: 'New payment account',
  },
]
