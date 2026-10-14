import { FileCheck, KeyRound, Landmark, Rocket, Wallet } from 'lucide-react'
import {
  snippetFromRanges,
  type Highlight,
  type IconComponent,
  type SearchResult,
  type Tone,
} from '@veljaos/ui'
import type { RichTextNode } from '../../../../packages/ui/src/rich-text'

/*
 * Group T's dataset (P5.30 d and e): Liro's support for its customer companies, as the customer
 * portal and the knowledge base show it. Milica Petrović of Kvadrat Gradnja d.o.o. is signed in to
 * the portal on Wednesday 14.10.2026 at 09:40. The shared helpdesk facts (the agents, tickets
 * 4821, 4822 and 4823, the three shared articles) are copied here as the brief gives them; the
 * agent helper's dataset holds the same facts, and the lead may join the two.
 *
 * This file plays the application: it searches the articles (words in the title, the summary and
 * the text; matches marked with `snippetFromRanges`), proposes articles while a ticket is being
 * written, and keeps the counts. Everything is invented; the articles are illustrative help texts,
 * not the real rules of any system.
 */

// ── Today ─────────────────────────────────────────────────────────────────────────────────────

export const T_TODAY = '2026-10-14'
export const T_NOW = '2026-10-14T09:40:00+02:00'

// ── People ────────────────────────────────────────────────────────────────────────────────────

export interface SupportAgent {
  id: string
  name: string
  team: string
}

/** Liro's support agents (the shared facts). */
export const AGENTS: Record<'nikola' | 'ana' | 'stefan', SupportAgent> = {
  nikola: { id: 'nikola', name: 'Nikola Ilić', team: 'E-invoicing' },
  ana: { id: 'ana', name: 'Ana Kovač', team: 'Accounts' },
  stefan: { id: 'stefan', name: 'Stefan Đorđević', team: 'Payroll' },
}

export type AgentId = keyof typeof AGENTS

/** The customer signed in to the portal. */
export const MILICA = {
  id: 'milica',
  name: 'Milica Petrović',
  company: 'Kvadrat Gradnja d.o.o.',
  email: 'milica.petrovic@example.com',
}

export const SUPPORT_EMAIL = 'support@example.com'

// ── Tickets ───────────────────────────────────────────────────────────────────────────────────

export type TicketStatus = 'Open' | 'Replied' | 'Paused' | 'Resolved' | 'Closed'
export type TicketPriority = 'Low' | 'Normal' | 'High' | 'Urgent'
export type TicketType = 'Problem' | 'Question' | 'Access' | 'Request'

/**
 * The tones of a ticket's status in the portal (never by colour alone: the badge says the word).
 * Open is with Liro (info), Replied waits for the customer's answer (warning), Paused waits for
 * something else (neutral), Resolved is done and asks for a rating (success), Closed is archived
 * (neutral).
 */
export const TICKET_TONES: Record<TicketStatus, Tone> = {
  Open: 'info',
  Replied: 'warning',
  Paused: 'neutral',
  Resolved: 'success',
  Closed: 'neutral',
}

/** What the customer reads under a status in the portal. */
export const STATUS_HINTS: Record<TicketStatus, string> = {
  Open: 'With Liro support',
  Replied: 'Waiting for your answer',
  Paused: 'Waiting for you',
  Resolved: 'Solved: rate the help you got',
  Closed: 'Closed',
}

export interface Ticket {
  /** The number without its sign ("4821"); written "#4821" through `ticketRef`. */
  number: string
  subject: string
  company: string
  contact: string
  status: TicketStatus
  /** Why a paused ticket waits ("Waiting for the customer"). */
  statusNote?: string
  priority: TicketPriority
  type: TicketType
  team: string
  agent: AgentId
  /** When it was opened and last changed, instants in the tenant's offset. */
  opened: string
  updated: string
  /** The first response is due (the agents' SLA; the portal does not show it). */
  firstResponseDue?: string
  /** The agents see it as overdue. */
  overdue?: boolean
}

/** "#4821": the sign added here, so no literal looks like a colour to the lint rule. */
export function ticketRef(number: string): string {
  return `#${number}`
}

/** 4821, the shared ticket that is Milica's. */
const TICKET_4821: Ticket = {
  number: '4821',
  subject: 'SEF invoice rejected',
  company: 'Kvadrat Gradnja d.o.o.',
  contact: 'Milica Petrović',
  status: 'Open',
  priority: 'High',
  type: 'Problem',
  team: 'E-invoicing',
  agent: 'nikola',
  opened: '2026-10-14T08:52:00+02:00',
  updated: '2026-10-14T09:05:00+02:00',
  firstResponseDue: '2026-10-14T10:30:00+02:00',
  overdue: true,
}

/** The three shared tickets, exactly as the brief gives them. */
export const SHARED_TICKETS: Ticket[] = [
  TICKET_4821,
  {
    number: '4822',
    subject: 'Cannot sign in',
    company: 'Pekara Zlatni klas',
    contact: 'Jovana Marković',
    status: 'Replied',
    priority: 'Urgent',
    type: 'Access',
    team: 'Accounts',
    agent: 'ana',
    opened: '2026-10-14T07:58:00+02:00',
    updated: '2026-10-14T08:20:00+02:00',
  },
  {
    number: '4823',
    subject: 'Payroll export question',
    company: 'Dom zdravlja Novi Sad',
    contact: 'Dragan Lazić',
    status: 'Paused',
    statusNote: 'Waiting for the customer',
    priority: 'Normal',
    type: 'Question',
    team: 'Payroll',
    agent: 'stefan',
    opened: '2026-10-13T13:40:00+02:00',
    updated: '2026-10-13T16:05:00+02:00',
  },
]

/** Milica's tickets, newest change first: 4821 is one of them; 4796 is resolved and asks for a rating. */
export const MILICA_TICKETS: Ticket[] = [
  TICKET_4821,
  {
    number: '4807',
    subject: 'Bank statement import shows the wrong value dates',
    company: MILICA.company,
    contact: MILICA.name,
    status: 'Replied',
    priority: 'Normal',
    type: 'Problem',
    team: 'Accounts',
    agent: 'ana',
    opened: '2026-10-12T14:10:00+02:00',
    updated: '2026-10-13T15:20:00+02:00',
  },
  {
    number: '4796',
    subject: 'Add a user for our new accountant',
    company: MILICA.company,
    contact: MILICA.name,
    status: 'Resolved',
    priority: 'Normal',
    type: 'Request',
    team: 'Accounts',
    agent: 'ana',
    opened: '2026-10-12T09:15:00+02:00',
    updated: '2026-10-13T11:05:00+02:00',
  },
  {
    number: '4772',
    subject: 'Payroll file rejected by the bank',
    company: MILICA.company,
    contact: MILICA.name,
    status: 'Closed',
    priority: 'High',
    type: 'Problem',
    team: 'Payroll',
    agent: 'stefan',
    opened: '2026-09-30T10:20:00+02:00',
    updated: '2026-10-02T12:40:00+02:00',
  },
  {
    number: '4751',
    subject: 'Which form for the VAT return?',
    company: MILICA.company,
    contact: MILICA.name,
    status: 'Closed',
    priority: 'Low',
    type: 'Question',
    team: 'Accounts',
    agent: 'ana',
    opened: '2026-09-23T11:00:00+02:00',
    updated: '2026-09-24T09:30:00+02:00',
  },
  {
    number: '4738',
    subject: 'Logo missing on the invoice PDF',
    company: MILICA.company,
    contact: MILICA.name,
    status: 'Closed',
    priority: 'Normal',
    type: 'Problem',
    team: 'E-invoicing',
    agent: 'nikola',
    opened: '2026-09-14T15:45:00+02:00',
    updated: '2026-09-15T10:10:00+02:00',
  },
]

/** The resolved ticket that asks for a rating. */
export const RESOLVED_TICKET = '4796'
/** The ticket waiting for Milica's answer. */
export const REPLIED_TICKET = '4807'
/** The number the next ticket gets. */
export const NEXT_TICKET = '4824'

/** The ratings Milica already gave, by ticket. */
export const RATINGS: Record<string, { value: string; comment: string }> = {
  '4772': { value: '5', comment: 'Stefan found the cause within an hour.' },
}

// ── Conversations ─────────────────────────────────────────────────────────────────────────────

export interface TicketFile {
  name: string
  sizeText: string
}

/** One message of a ticket: from the customer or an agent. Internal notes never reach the portal. */
export interface TicketMessage {
  id: string
  /** 'milica' or an agent's id. */
  author: string
  at: string
  text: string
  files?: TicketFile[]
}

export const THREADS: Record<string, TicketMessage[]> = {
  '4821': [
    {
      id: '4821-1',
      author: 'milica',
      at: '2026-10-14T08:52:00+02:00',
      text: 'This morning SEF rejected our invoice F-2026-0420 to Drina Prevoz d.o.o. The message says the buyer is not registered, but we have sent them invoices all year. Can you check what changed?',
      files: [{ name: 'sef-rejection.png', sizeText: '184 KB' }],
    },
    {
      id: '4821-2',
      author: 'milica',
      at: '2026-10-14T09:05:00+02:00',
      text: 'I am attaching the invoice’s PDF as well.',
      files: [{ name: 'F-2026-0420.pdf', sizeText: '96 KB' }],
    },
  ],
  '4807': [
    {
      id: '4807-1',
      author: 'milica',
      at: '2026-10-12T14:10:00+02:00',
      text: 'We imported statement 191 from our bank today. Every line shows the value date one day before the date on the bank’s PDF. The amounts are right.',
    },
    {
      id: '4807-2',
      author: 'ana',
      at: '2026-10-12T15:02:00+02:00',
      text: 'Thank you, Milica. I can see statement 191 in your company. The dates come from the file your bank sends. Could you send us the XML file you imported, so we can compare it with the PDF?',
    },
    {
      id: '4807-3',
      author: 'milica',
      at: '2026-10-13T08:47:00+02:00',
      text: 'Here is the file.',
      files: [{ name: 'statement-191.xml', sizeText: '42 KB' }],
    },
    {
      id: '4807-4',
      author: 'ana',
      at: '2026-10-13T15:20:00+02:00',
      text: 'Your bank’s file writes the value date in UTC, so a payment booked after midnight our time shows the day before. We corrected the import for your bank; it applies to every statement you import from now on. Please import statement 191 again and tell us whether the dates match the PDF now.',
    },
  ],
  '4796': [
    {
      id: '4796-1',
      author: 'milica',
      at: '2026-10-12T09:15:00+02:00',
      text: 'Our new accountant, Jelena Savić, starts on Monday. She needs to see invoices and post bank statements, but not payroll. How do I add her?',
    },
    {
      id: '4796-2',
      author: 'ana',
      at: '2026-10-12T10:02:00+02:00',
      text: 'Hello Milica. Open Company settings, then Users, and choose Invite user. Enter Jelena’s e-mail and give her the role Accountant; then open the role and turn Payroll off. The article “Add a user to your company” shows each step.',
    },
    {
      id: '4796-3',
      author: 'milica',
      at: '2026-10-12T11:30:00+02:00',
      text: 'Done, she received the invitation and signed in. Thank you!',
    },
    {
      id: '4796-4',
      author: 'ana',
      at: '2026-10-13T11:05:00+02:00',
      text: 'Glad it worked. I am marking this request as resolved. If anything else comes up, reply here and it opens again.',
    },
  ],
  '4772': [
    {
      id: '4772-1',
      author: 'milica',
      at: '2026-09-30T10:20:00+02:00',
      text: 'The bank does not accept the payroll file for September. It says the file has a wrong format.',
    },
    {
      id: '4772-2',
      author: 'stefan',
      at: '2026-09-30T11:15:00+02:00',
      text: 'The bank changed its format on 29 September. Choose the new format in Payroll settings, then export the file again; the article “Export payroll to your bank” shows where.',
    },
    {
      id: '4772-3',
      author: 'milica',
      at: '2026-10-02T12:40:00+02:00',
      text: 'The bank accepted it. Thank you.',
    },
  ],
  '4751': [
    {
      id: '4751-1',
      author: 'milica',
      at: '2026-09-23T11:00:00+02:00',
      text: 'Which form do we submit for the VAT return of a quarter?',
    },
    {
      id: '4751-2',
      author: 'ana',
      at: '2026-09-24T09:30:00+02:00',
      text: 'Liro prepares the same return for a month or a quarter; choose the period on the VAT return page. Your company files monthly.',
    },
  ],
  '4738': [
    {
      id: '4738-1',
      author: 'milica',
      at: '2026-09-14T15:45:00+02:00',
      text: 'Our logo is missing on the invoice PDF since yesterday.',
    },
    {
      id: '4738-2',
      author: 'nikola',
      at: '2026-09-15T10:10:00+02:00',
      text: 'The logo was larger than 1 MB after your last change. I made it smaller; your invoices show it again.',
    },
  ],
}

// ── The new ticket ────────────────────────────────────────────────────────────────────────────

export const TICKET_TYPES: { value: TicketType; label: string; description: string }[] = [
  { value: 'Problem', label: 'Problem', description: 'Something does not work as it should' },
  { value: 'Question', label: 'Question', description: 'How to do something in Liro' },
  { value: 'Access', label: 'Access', description: 'Signing in, users and what they may do' },
  { value: 'Request', label: 'Request', description: 'Ask us to set up or change something' },
]

export interface TicketDraft {
  type: TicketType | ''
  subject: string
  description: string
  files: TicketFile[]
}

export const EMPTY_DRAFT: TicketDraft = { type: '', subject: '', description: '', files: [] }

/** A draft half written: the subject and the first sentence of a rejected invoice. */
export const SEF_DRAFT: TicketDraft = {
  type: 'Problem',
  subject: 'SEF rejected our invoice',
  description: 'SEF rejected invoice F-2026-0421 to Panonija Agro d.o.o. this morning; it says the',
  files: [],
}

export const TICKET_FILES = {
  accept: ['.pdf', '.png', '.jpg', '.jpeg', '.xml', '.csv'],
  acceptText: 'PDF, PNG, JPG, XML or CSV',
  maxSize: 10 * 1024 * 1024,
  maxSizeText: '10 MB',
}

// ── The knowledge base ────────────────────────────────────────────────────────────────────────

export interface KbCategory {
  id: string
  title: string
  description: string
  icon: IconComponent
}

export const KB_CATEGORIES: KbCategory[] = [
  {
    id: 'e-invoicing',
    title: 'E-invoicing',
    description: 'Send, receive, cancel and correct invoices in SEF.',
    icon: FileCheck,
  },
  {
    id: 'accounts',
    title: 'Accounts',
    description: 'Sign-in, two-factor sign-in, users and what they may do.',
    icon: KeyRound,
  },
  {
    id: 'payroll',
    title: 'Payroll',
    description: 'Monthly runs, payslips and the export to your bank.',
    icon: Wallet,
  },
  {
    id: 'banking',
    title: 'Banking',
    description: 'Import statements and match payments to invoices.',
    icon: Landmark,
  },
  {
    id: 'getting-started',
    title: 'Getting started',
    description: 'Set up your company and invite the people you work with.',
    icon: Rocket,
  },
]

export interface KbArticle {
  slug: string
  title: string
  category: string
  summary: string
  author: AgentId
  /** YYYY-MM-DD. */
  updated: string
  /** "Was this helpful?" so far. */
  helpful: { yes: number; answers: number }
  body: RichTextNode
  /** Related articles by slug. */
  related: string[]
}

const text = (value: string): RichTextNode => ({ type: 'text', text: value })
const bold = (value: string): RichTextNode => ({
  type: 'text',
  text: value,
  marks: [{ type: 'bold' }],
})
const p = (...parts: (string | RichTextNode)[]): RichTextNode => ({
  type: 'paragraph',
  content: parts.map((part) => (typeof part === 'string' ? text(part) : part)),
})
const h2 = (value: string): RichTextNode => ({
  type: 'heading',
  attrs: { level: 2 },
  content: [text(value)],
})
const h3 = (value: string): RichTextNode => ({
  type: 'heading',
  attrs: { level: 3 },
  content: [text(value)],
})
const list = (type: 'bulletList' | 'orderedList', items: string[]): RichTextNode => ({
  type,
  content: items.map((item) => ({ type: 'listItem', content: [p(item)] })),
})
const doc = (...content: RichTextNode[]): RichTextNode => ({ type: 'doc', content })

/** A short article: what it is for, then its steps. */
function steps(intro: string, items: string[], after?: string): RichTextNode {
  return doc(
    p(intro),
    h2('Steps'),
    list('orderedList', items),
    ...(after === undefined ? [] : [p(after)]),
  )
}

export const ARTICLES: KbArticle[] = [
  // E-invoicing
  {
    slug: 'sef-rejected',
    title: 'Why was my SEF invoice rejected?',
    category: 'e-invoicing',
    summary:
      'Read the rejection message, then fix the buyer, the dates or the amounts and send the invoice again.',
    author: 'nikola',
    updated: '2026-10-08',
    helpful: { yes: 41, answers: 46 },
    related: ['sef-send', 'sef-cancel', 'sef-api-key'],
    body: doc(
      p(
        'When SEF rejects an invoice, Liro shows the rejection message on the invoice and sets its status to ',
        bold('Rejected'),
        '. The invoice keeps its number, and nothing reaches the buyer. Most invoices are rejected for one of the reasons below; each takes a few minutes to fix.',
      ),
      h2('Read the rejection message'),
      p(
        'Open the invoice. The message stands at the top, in the words SEF sent it, with the field it names marked in the invoice. Keep it open while you work through this article.',
      ),
      list('bulletList', [
        '“Buyer not registered”: see The buyer is not registered.',
        '“Date outside the allowed period”: see The dates do not match.',
        '“Totals do not match the lines”: see The amounts do not add up.',
      ]),
      h2('The buyer is not registered'),
      p(
        'SEF accepts an invoice only for a buyer whose tax number is registered in SEF on the invoice date. Liro checks the number when you choose the buyer, but a buyer can change between the draft and the day you send it.',
      ),
      h3('A buyer that changed its legal form'),
      p(
        'A company that changed its legal form or merged with another one may have a new tax number. Ask the buyer for the number they use now, change it on the customer’s record, and the draft takes it.',
      ),
      h3('A buyer outside SEF'),
      p(
        'Some buyers are not in SEF at all: foreign companies and private persons. Send them the invoice by e-mail instead; Liro offers it when the buyer has no SEF registration.',
      ),
      h2('The dates do not match'),
      p(
        'The delivery date must not be after the invoice date, and the invoice date must not be in a VAT period you already closed. Change the dates on the draft; the number stays.',
      ),
      h2('The amounts do not add up'),
      p(
        'SEF adds the lines again and compares them with the totals. A difference of one para usually comes from a discount entered as an amount on a line with a quantity. Enter the discount as a percentage, or as a line of its own.',
      ),
      h2('Send the invoice again'),
      list('orderedList', [
        'Open the rejected invoice and choose Edit.',
        'Fix what the message names. Liro checks the draft again as you type.',
        'Choose Send to SEF. The invoice keeps its number and its date.',
      ]),
      h2('Still rejected?'),
      p(
        'Submit a ticket from the support portal with the invoice number and a picture of the message. The E-invoicing team answers within two working hours.',
      ),
    ),
  },
  {
    slug: 'sef-send',
    title: 'Send an invoice to SEF',
    category: 'e-invoicing',
    summary: 'From a draft to “Sent to SEF”: what Liro checks before it sends.',
    author: 'nikola',
    updated: '2026-09-30',
    helpful: { yes: 88, answers: 95 },
    related: ['sef-rejected', 'sef-cancel'],
    body: steps(
      'An invoice to a buyer registered in SEF is sent from its page. Liro checks the buyer, the dates and the totals before it sends.',
      [
        'Open the invoice and choose Issue.',
        'Check the summary: the buyer, the total and the due date.',
        'Choose Send to SEF. The status changes to Sent to SEF.',
      ],
      'The buyer accepts or rejects the invoice in SEF; Liro shows the answer on the invoice.',
    ),
  },
  {
    slug: 'sef-cancel',
    title: 'Cancel or correct an invoice in SEF',
    category: 'e-invoicing',
    summary: 'When to cancel, when to issue a correction, and what the buyer sees.',
    author: 'nikola',
    updated: '2026-09-30',
    helpful: { yes: 52, answers: 61 },
    related: ['sef-rejected', 'sef-send'],
    body: steps(
      'An invoice the buyer has not accepted yet can be cancelled. An invoice the buyer accepted is corrected with a credit or debit note. An invoice the buyer rejected cannot be cancelled; change the draft and send it again.',
      [
        'Open the invoice and choose More, then Cancel in SEF.',
        'Give the reason; the buyer sees it.',
        'Confirm. The status changes to Cancelled.',
      ],
    ),
  },
  {
    slug: 'sef-receive',
    title: 'Receive supplier invoices from SEF',
    category: 'e-invoicing',
    summary: 'Incoming invoices arrive by themselves; accept or reject each within 15 days.',
    author: 'nikola',
    updated: '2026-09-22',
    helpful: { yes: 30, answers: 34 },
    related: ['sef-api-key'],
    body: steps(
      'Liro fetches your incoming invoices from SEF every 15 minutes and puts them in Purchasing, Supplier invoices to approve.',
      [
        'Open the invoice from the list.',
        'Check it against the order or the delivery note.',
        'Approve it, or reject it with a reason; the supplier sees the reason in SEF.',
      ],
    ),
  },
  {
    slug: 'sef-api-key',
    title: 'Connect Liro to SEF with an API key',
    category: 'e-invoicing',
    summary: 'Create the key in SEF, paste it into Liro, and test the connection.',
    author: 'nikola',
    updated: '2026-08-28',
    helpful: { yes: 64, answers: 70 },
    related: ['sef-send', 'sef-receive'],
    body: steps(
      'Liro sends and receives invoices on your behalf with an API key you create in SEF.',
      [
        'Sign in to SEF and open Settings, then API access.',
        'Create a key and copy it.',
        'In Liro, open Company settings, then Integrations, then SEF, and paste the key.',
        'Choose Test connection.',
      ],
    ),
  },
  // Accounts
  {
    slug: 'reset-2fa',
    title: 'Reset two-factor sign-in',
    category: 'accounts',
    summary: 'A lost phone: sign in with a recovery code, or ask your administrator to reset it.',
    author: 'ana',
    updated: '2026-10-02',
    helpful: { yes: 73, answers: 80 },
    related: ['add-user', 'sign-in-microsoft'],
    body: doc(
      p(
        'Two-factor sign-in asks for a code from your phone after your password. If you lost the phone or changed it, you can still sign in.',
      ),
      h2('With a recovery code'),
      list('orderedList', [
        'Sign in with your e-mail and password.',
        'Choose Use a recovery code and enter one of the codes you saved.',
        'Open Profile, then Security, and set up two-factor sign-in on your new phone.',
      ]),
      h2('Without a recovery code'),
      p(
        'Ask your company’s administrator to reset your two-factor sign-in in Company settings, Users. If you are the only administrator, submit a ticket of the type Access; we confirm who you are before we reset it.',
      ),
    ),
  },
  {
    slug: 'add-user',
    title: 'Add a user to your company',
    category: 'accounts',
    summary: 'Invite a colleague or your accountant by e-mail and choose their role.',
    author: 'ana',
    updated: '2026-09-18',
    helpful: { yes: 120, answers: 126 },
    related: ['roles', 'invite-accountant'],
    body: steps(
      'Administrators invite users from Company settings. The invited person receives an e-mail and sets their own password.',
      [
        'Open Company settings, then Users, and choose Invite user.',
        'Enter the e-mail address and choose a role.',
        'Choose Send invitation.',
      ],
      'The invitation is valid for seven days.',
    ),
  },
  {
    slug: 'roles',
    title: 'Change what a user may do',
    category: 'accounts',
    summary: 'Roles group permissions; change a role or give a user another one.',
    author: 'ana',
    updated: '2026-09-18',
    helpful: { yes: 44, answers: 51 },
    related: ['add-user'],
    body: steps(
      'What a user may do comes from their role. The built-in roles cannot be changed; copy one to make your own.',
      [
        'Open Company settings, then Roles.',
        'Choose a role, or Copy a built-in one.',
        'Turn each area’s actions on or off and choose Save.',
      ],
    ),
  },
  {
    slug: 'sign-in-microsoft',
    title: 'Sign in with Microsoft or Google',
    category: 'accounts',
    summary: 'Use your work account instead of a Liro password.',
    author: 'ana',
    updated: '2026-07-10',
    helpful: { yes: 39, answers: 42 },
    related: ['reset-2fa'],
    body: steps(
      'If your company uses Microsoft or Google accounts, you can sign in to Liro with them.',
      [
        'On the sign-in page, choose Continue with Microsoft or Continue with Google.',
        'Sign in to your work account.',
        'The first time, confirm that Liro may read your name and e-mail.',
      ],
    ),
  },
  // Payroll
  {
    slug: 'payroll-bank-export',
    title: 'Export payroll to your bank',
    category: 'payroll',
    summary: 'Make the payment file for your bank after the payroll run is posted.',
    author: 'stefan',
    updated: '2026-10-05',
    helpful: { yes: 57, answers: 63 },
    related: ['payroll-run', 'payslip-correct'],
    body: doc(
      p(
        'After a payroll run is posted, Liro makes the payment file your bank imports: one payment per employee, with the purpose and the reference your bank expects.',
      ),
      h2('Choose your bank’s format'),
      p(
        'Open Payroll settings, then Payments, and choose your bank. When a bank changes its format, we add the new one here; choose it before the next export.',
      ),
      h2('Export the file'),
      list('orderedList', [
        'Open the posted payroll run.',
        'Choose Export to bank.',
        'Save the file and import it in your bank’s e-banking.',
      ]),
      h2('If the bank does not accept the file'),
      p(
        'Check that the bank’s format in Payroll settings is the current one, and export again. If it still fails, submit a ticket with the bank’s message.',
      ),
    ),
  },
  {
    slug: 'payroll-run',
    title: 'Run payroll for a month',
    category: 'payroll',
    summary: 'Hours, calculation, checks, posting: the monthly run step by step.',
    author: 'stefan',
    updated: '2026-09-25',
    helpful: { yes: 35, answers: 40 },
    related: ['payroll-bank-export'],
    body: steps(
      'A payroll run takes the month’s hours from the timesheets and calculates every payslip.',
      [
        'Open Payroll and choose New run for the month.',
        'Check the hours and the calculation.',
        'Read the checks and fix what they name.',
        'Choose Post.',
      ],
    ),
  },
  {
    slug: 'payslip-correct',
    title: 'Correct a payslip after posting',
    category: 'payroll',
    summary: 'Rerun the payroll with a reason; the first run is kept.',
    author: 'stefan',
    updated: '2026-09-01',
    helpful: { yes: 18, answers: 22 },
    related: ['payroll-run'],
    body: steps(
      'A posted payroll run is never changed. A correction is a new run of the same month, with a reason.',
      [
        'Open the posted run and choose Rerun.',
        'Give the reason and change what was wrong.',
        'Post the new run; both stay in the history.',
      ],
    ),
  },
  // Banking
  {
    slug: 'statement-import',
    title: 'Import a bank statement',
    category: 'banking',
    summary: 'Import the file from your bank; Liro proposes a match for each line.',
    author: 'ana',
    updated: '2026-09-12',
    helpful: { yes: 66, answers: 70 },
    related: ['match-payments', 'value-dates'],
    body: steps(
      'Statements come from your bank’s e-banking as a file. Liro reads it and proposes what each line pays.',
      [
        'Open Banking, then Statements, and choose Import.',
        'Choose the file from your bank.',
        'Check the opening and closing balance against the bank’s PDF.',
      ],
    ),
  },
  {
    slug: 'match-payments',
    title: 'Match payments to invoices',
    category: 'banking',
    summary: 'Accept the proposed match, or choose the open items yourself.',
    author: 'ana',
    updated: '2026-09-12',
    helpful: { yes: 49, answers: 55 },
    related: ['statement-import'],
    body: steps(
      'For each line of a statement, Liro proposes the open items it pays, best first, with the reason.',
      [
        'Open the statement and choose the first line to do.',
        'Accept the proposal, or choose other open items.',
        'Move to the next line.',
      ],
    ),
  },
  {
    slug: 'value-dates',
    title: 'Value dates in imported statements',
    category: 'banking',
    summary: 'Why a value date can differ from the bank’s PDF, and what to do.',
    author: 'ana',
    updated: '2026-10-13',
    helpful: { yes: 6, answers: 7 },
    related: ['statement-import'],
    body: steps(
      'Liro shows the value date the bank’s file gives. Some banks write it in UTC, so a payment booked after midnight our time shows the day before. We correct such files for each bank as we learn of them.',
      [
        'Compare a line with the bank’s PDF.',
        'If the dates differ by one day, submit a ticket with the file.',
        'After our correction, import the statement again.',
      ],
    ),
  },
  // Getting started
  {
    slug: 'setup-company',
    title: 'Set up your company',
    category: 'getting-started',
    summary: 'The first steps: company details, bank accounts, numbering and users.',
    author: 'ana',
    updated: '2026-06-30',
    helpful: { yes: 140, answers: 151 },
    related: ['invite-accountant', 'add-user'],
    body: steps(
      'The setup checklist on the home page walks you through the first steps; you can leave it and come back.',
      [
        'Enter the company’s details and tax number.',
        'Add your bank accounts.',
        'Choose how documents are numbered.',
        'Invite your users.',
      ],
    ),
  },
  {
    slug: 'invite-accountant',
    title: 'Invite your accountant',
    category: 'getting-started',
    summary: 'Give your accounting office access to your company in Liro.',
    author: 'ana',
    updated: '2026-06-30',
    helpful: { yes: 77, answers: 80 },
    related: ['add-user', 'roles'],
    body: steps(
      'An accounting office works for many companies; it signs in once and switches between them.',
      [
        'Open Company settings, then Users, and choose Invite user.',
        'Enter the accountant’s e-mail and choose the role Accountant.',
        'Choose Send invitation.',
      ],
    ),
  },
  {
    slug: 'shortcuts',
    title: 'Keyboard shortcuts',
    category: 'getting-started',
    summary:
      'Search with Ctrl K, open a module with its number, move through lists with the arrows.',
    author: 'nikola',
    updated: '2026-05-20',
    helpful: { yes: 25, answers: 27 },
    related: ['setup-company'],
    body: doc(
      p('Most of Liro can be used from the keyboard.'),
      list('bulletList', [
        'Ctrl K (Cmd K on a Mac): search and go anywhere.',
        '1 to 9 on the home page: open a module.',
        'Arrows in a list: move between rows; Enter opens one.',
      ]),
    ),
  },
]

/** The articles of a category, in their order. */
export function articlesIn(category: string): KbArticle[] {
  return ARTICLES.filter((article) => article.category === category)
}

export function findArticle(slug: string): KbArticle | undefined {
  return ARTICLES.find((article) => article.slug === slug)
}

export function findCategory(id: string): KbCategory | undefined {
  return KB_CATEGORIES.find((category) => category.id === id)
}

/** "5 articles". */
export function articleCount(count: number): string {
  return `${String(count)} ${count === 1 ? 'article' : 'articles'}`
}

/** The most read articles, as the application ranks them (most helpful answers first). */
export const POPULAR = ['sef-rejected', 'add-user', 'reset-2fa', 'payroll-bank-export']

// ── Searching the articles (the application's search) ─────────────────────────────────────────

/** An article's text without its markup. */
export function plainText(node: RichTextNode): string {
  if (node.type === 'text') return node.text ?? ''
  const inner = (node.content ?? []).map(plainText)
  const block = ['paragraph', 'heading', 'listItem'].includes(node.type)
  return block ? `${inner.join('')} ` : inner.join('')
}

const STOP_WORDS = new Set([
  'the',
  'and',
  'our',
  'you',
  'your',
  'for',
  'with',
  'this',
  'that',
  'from',
  'what',
  'how',
  'was',
  'were',
  'why',
  'can',
  'not',
  'are',
  'its',
  'says',
  'today',
  'morning',
])

/** The words of a query worth searching: three letters or more, not the commonest. */
export function queryWords(query: string): string[] {
  return [
    ...new Set(
      query
        .toLowerCase()
        .split(/[^\p{L}\p{N}]+/u)
        .filter((word) => word.length >= 3 && !STOP_WORDS.has(word)),
    ),
  ]
}

/** Every place a word starts in a text, as `[start, end)` ranges. */
function rangesOf(text: string, words: readonly string[]): [number, number][] {
  const lower = text.toLowerCase()
  const out: [number, number][] = []
  for (const word of words) {
    let at = lower.indexOf(word)
    while (at >= 0) {
      out.push([at, at + word.length])
      at = lower.indexOf(word, at + word.length)
    }
  }
  return out
}

/** About 180 characters around the first match, cut at spaces, with "…" where cut. */
function snippetAround(text: string, words: readonly string[]): Highlight {
  const ranges = rangesOf(text, words)
  const first = ranges.reduce((min, [start]) => Math.min(min, start), text.length)
  let start = Math.max(0, first - 60)
  let end = Math.min(text.length, start + 180)
  if (start > 0) start = text.indexOf(' ', start) + 1
  if (end < text.length) end = Math.max(text.lastIndexOf(' ', end), start)
  const cut = `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`
  return snippetFromRanges(cut, rangesOf(cut, words))
}

/** How well an article matches: a word in the title counts three, in the summary two, in the text one. */
function score(article: KbArticle, words: readonly string[]): number {
  const title = article.title.toLowerCase()
  const summary = article.summary.toLowerCase()
  const body = plainText(article.body).toLowerCase()
  return words.reduce(
    (sum, word) =>
      sum +
      (title.includes(word) ? 3 : 0) +
      (summary.includes(word) ? 2 : 0) +
      (body.includes(word) ? 1 : 0),
    0,
  )
}

/** The articles a query finds, best first; ties by title. */
export function searchArticles(query: string): KbArticle[] {
  const words = queryWords(query)
  if (words.length === 0) return []
  return ARTICLES.map((article) => ({ article, score: score(article, words) }))
    .filter((each) => each.score > 0)
    .sort((a, b) => b.score - a.score || a.article.title.localeCompare(b.article.title))
    .map((each) => each.article)
}

/** A found article as SearchResultList shows it: matches marked in the title and the snippet. */
export function searchResult(
  article: KbArticle,
  query: string,
  href: string,
  meta: string,
): SearchResult {
  const words = queryWords(query)
  const title = article.title
  const titleRanges = rangesOf(title, words)
  const body = plainText(article.body).replace(/\s+/g, ' ').trim()
  const inBody = rangesOf(body, words).length > 0
  return {
    id: article.slug,
    title: titleRanges.length > 0 ? snippetFromRanges(title, titleRanges) : title,
    href,
    meta,
    snippet: inBody
      ? snippetAround(body, words)
      : snippetFromRanges(article.summary, rangesOf(article.summary, words)),
  }
}

/**
 * The articles proposed while a ticket is written: the three that match its subject and
 * description best, none for fewer than three letters.
 */
export function suggestArticles(subject: string, description: string): KbArticle[] {
  return searchArticles(`${subject} ${description}`).slice(0, 3)
}
