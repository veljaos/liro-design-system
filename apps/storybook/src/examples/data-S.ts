/*
 * Group S's example data (P5.30, Helpdesk — the agent's side): Liro support for its customer
 * companies on 14 October 2026 at 09:40. Three agents in three teams, 34 tickets (the shared
 * #4821, #4822 and #4823 among them), their service levels, threads, saved replies and a few
 * knowledge-base articles for "Insert article". Fictitious; e-mail addresses at example.com. The
 * views, counts, overdue checks and the dashboard's figures are the application's work, played
 * here; the components only show them. Not part of the package. No classes here.
 */
import type { MentionCandidate } from '@veljaos/ui'
import { slaReading } from '@veljaos/ui'
import type { RichTextMergeField } from '../../../../packages/ui/src/rich-text'
import type { RichTextNode, SavedReply } from '../../../../packages/ui/src/rich-text'

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const S_ROUTES = {
  /** The agent's inbox, "My open". */
  inbox: '/support/tickets',
  unassigned: '/support/tickets?view=unassigned',
  overdue: '/support/tickets?view=overdue',
  all: '/support/tickets?view=all',
  /** "All" with three tickets checked: the bulk bar. */
  selected: '/support/tickets?view=all&selected=3',
  /** The same with "Assign…" asked. */
  assign: '/support/tickets?view=all&selected=3&assign=open',
  ticket: (number: string) => `/support/tickets/${number}`,
  /** #4821 with the composer in the note mode. */
  ticketNote: '/support/tickets/4821?compose=note',
  /** #4821 with "Insert article" asked: the knowledge base in a dialog. */
  ticketArticle: '/support/tickets/4821?article=open',
  /** #4821 on a phone with its details open in a sheet. */
  ticketDetails: '/support/tickets/4821?details=open',
  dashboard: '/support/dashboard',
} as const

// ── Now ───────────────────────────────────────────────────────────────────────────────────────

/** The examples' today and now (the application's clock, never the device's). */
export const SUPPORT_TODAY = '2026-10-14'
export const NOW = '2026-10-14T09:40:00+02:00'

/** An instant on a day of October 2026 in Belgrade ("14", "09:40"). */
export function at(day: string, time: string): string {
  return `2026-10-${day}T${time}:00+02:00`
}

// ── People and teams ──────────────────────────────────────────────────────────────────────────

export type TeamId = 'einvoicing' | 'accounts' | 'payroll'
export type AgentId = 'nikola' | 'ana' | 'stefan'

export const TEAMS: Record<TeamId, string> = {
  einvoicing: 'E-invoicing',
  accounts: 'Accounts',
  payroll: 'Payroll',
}

export interface Agent {
  id: AgentId
  name: string
  team: TeamId
  email: string
}

export const AGENTS: Record<AgentId, Agent> = {
  nikola: {
    id: 'nikola',
    name: 'Nikola Ilić',
    team: 'einvoicing',
    email: 'nikola.ilic@example.com',
  },
  ana: { id: 'ana', name: 'Ana Kovač', team: 'accounts', email: 'ana.kovac@example.com' },
  stefan: {
    id: 'stefan',
    name: 'Stefan Đorđević',
    team: 'payroll',
    email: 'stefan.djordjevic@example.com',
  },
}

/** The agent signed in: Nikola Ilić of the E-invoicing team. */
export const ME: AgentId = 'nikola'

/** Who "@" offers in an internal note. */
export const TEAM_MENTIONS: MentionCandidate[] = Object.values(AGENTS).map((agent) => ({
  id: agent.id,
  name: agent.name,
  description: `${TEAMS[agent.team]} team`,
}))

// ── Tickets ───────────────────────────────────────────────────────────────────────────────────

export const TICKET_STATUSES = ['Open', 'Replied', 'Paused', 'Resolved', 'Closed'] as const
export type TicketStatus = (typeof TICKET_STATUSES)[number]
export const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent'] as const
export type Priority = (typeof PRIORITIES)[number]
export const TICKET_TYPES = ['Problem', 'Access', 'Question', 'Request'] as const
export type TicketType = (typeof TICKET_TYPES)[number]

/**
 * The application's status-to-tone map for tickets: open waits on the team (warning), replied is
 * on its way to the customer (info), paused and closed are neutral, resolved is success.
 */
export const TICKET_TONES = {
  Open: 'warning',
  Replied: 'info',
  Paused: 'neutral',
  Resolved: 'success',
  Closed: 'neutral',
} as const

export interface Ticket {
  number: string
  subject: string
  customer: string
  contact: string
  email: string
  status: TicketStatus
  priority: Priority
  type: TicketType
  team: TeamId
  assignee: AgentId | null
  opened: string
  updated: string
  firstResponseDue: string
  firstResponseAt?: string
  resolutionDue: string
  resolvedAt?: string
  /** Why the clock is stopped, in the application's words. */
  pausedReason?: string
}

type Row = [
  number: string,
  subject: string,
  customer: string,
  contact: string,
  status: TicketStatus,
  priority: Priority,
  type: TicketType,
  team: TeamId,
  assignee: AgentId | null,
  opened: string,
  firstResponseDue: string,
  firstResponseAt: string | null,
  resolutionDue: string,
  resolvedAt: string | null,
]

/** The contact's e-mail at example.com ("milica.petrovic@kvadrat-gradnja.example.com"). */
function emailOf(contact: string, customer: string): string {
  const plain = (text: string) =>
    text.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'dj').replace(/Đ/g, 'Dj').toLowerCase()
  const user = plain(contact).replace(/\s+/g, '.')
  const company = plain(customer)
    .replace(/\s+(d\.o\.o\.|a\.d\.|str|szr)$/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return `${user}@${company}.example.com`
}

// [number, subject, customer, contact, status, priority, type, team, assignee, opened,
//  first response due, first response at, resolution due, resolved at]
// prettier-ignore
const ROWS: Row[] = [
  // The shared three (helper brief, round 6).
  ['4821', 'SEF invoice rejected', 'Kvadrat Gradnja d.o.o.', 'Milica Petrović', 'Open', 'High', 'Problem', 'einvoicing', 'nikola', at('14', '08:30'), at('14', '10:30'), null, at('15', '08:30'), null],
  ['4822', 'Cannot sign in', 'Pekara Zlatni klas', 'Jovana Marković', 'Replied', 'Urgent', 'Access', 'accounts', 'ana', at('14', '07:55'), at('14', '08:55'), at('14', '08:20'), at('14', '15:55'), null],
  ['4823', 'Payroll export question', 'Dom zdravlja Novi Sad', 'Dragan Lazić', 'Paused', 'Normal', 'Question', 'payroll', 'stefan', at('13', '11:10'), at('13', '15:10'), at('13', '12:02'), at('16', '11:10'), null],
  // New this morning.
  ['4824', 'Payslips missing for two employees', 'Medic Lab Niš d.o.o.', 'Ivana Đokić', 'Open', 'Urgent', 'Problem', 'payroll', null, at('14', '08:50'), at('14', '09:50'), null, at('14', '16:50'), null],
  ['4825', 'Question about the licence renewal', 'Stanić Elektro STR', 'Goran Stanić', 'Open', 'Normal', 'Question', 'accounts', null, at('14', '09:05'), at('14', '13:05'), null, at('17', '09:05'), null],
  ['4826', 'Import of opening balances', 'Vojvođanka Mlin a.d.', 'Mirjana Tot', 'Open', 'Normal', 'Request', 'accounts', null, at('14', '09:22'), at('14', '13:22'), null, at('17', '09:22'), null],
  // Overdue.
  ['4818', 'Bank statement import stopped', 'Drina Prevoz d.o.o.', 'Petar Savić', 'Open', 'Urgent', 'Problem', 'accounts', 'ana', at('14', '07:10'), at('14', '08:10'), null, at('14', '15:10'), null],
  ['4815', 'VAT return shows the wrong period', 'Knjigovodstvo Jelić', 'Snežana Jelić', 'Open', 'High', 'Problem', 'accounts', null, at('13', '16:40'), at('13', '18:40'), null, at('14', '16:40'), null],
  ['4809', 'E-invoice stuck in Sending', 'Bojović i sinovi d.o.o.', 'Marko Bojović', 'Replied', 'High', 'Problem', 'einvoicing', 'nikola', at('13', '09:00'), at('13', '11:00'), at('13', '09:40'), at('14', '09:00'), null],
  ['4812', 'Cannot add a new user', 'Panonija Agro d.o.o.', 'Zoran Kiš', 'Open', 'Normal', 'Access', 'accounts', 'ana', at('13', '08:00'), at('13', '12:00'), null, at('16', '08:00'), null],
  // Nikola's other tickets.
  ['4816', 'SEF says the buyer is not registered', 'Bistro Dunav', 'Vesna Ristić', 'Open', 'Normal', 'Problem', 'einvoicing', 'nikola', at('13', '15:20'), at('14', '10:20'), null, at('16', '15:20'), null],
  ['4811', 'Credit note for a returned delivery', 'Kvadrat Gradnja d.o.o.', 'Dragan Ilić', 'Replied', 'Normal', 'Question', 'einvoicing', 'nikola', at('13', '10:05'), at('13', '14:05'), at('13', '11:30'), at('16', '10:05'), null],
  ['4805', 'How to send an advance invoice', 'Panonija Agro d.o.o.', 'Zoran Kiš', 'Paused', 'Low', 'Question', 'einvoicing', 'nikola', at('12', '13:00'), at('12', '21:00'), at('12', '14:10'), at('17', '13:00'), null],
  ['4819', 'Invoice numbering after the merger', 'Hotel Fruška', 'Bojan Mihajlović', 'Open', 'High', 'Question', 'einvoicing', 'nikola', at('14', '07:45'), at('14', '09:45'), null, at('15', '07:45'), null],
  ['4800', 'Attach the delivery note to an e-invoice', 'Kvadrat Gradnja d.o.o.', 'Milica Petrović', 'Resolved', 'Normal', 'Question', 'einvoicing', 'nikola', at('09', '09:30'), at('09', '13:30'), at('09', '10:15'), at('12', '09:30'), at('10', '16:20')],
  ['4796', 'Wrong VAT rate on a credit note', 'Bistro Dunav', 'Vesna Ristić', 'Closed', 'High', 'Problem', 'einvoicing', 'nikola', at('08', '11:00'), at('08', '13:00'), at('08', '11:25'), at('09', '11:00'), at('08', '17:40')],
  // Ana's (Accounts).
  ['4817', 'Two-factor code not arriving', 'Medic Lab Niš d.o.o.', 'Nenad Popović', 'Replied', 'High', 'Access', 'accounts', 'ana', at('14', '06:50'), at('14', '08:50'), at('14', '07:30'), at('15', '06:50'), null],
  ['4814', 'Opening balance for a new account', 'Knjigovodstvo Jelić', 'Snežana Jelić', 'Paused', 'Normal', 'Question', 'accounts', 'ana', at('13', '12:30'), at('13', '16:30'), at('13', '13:05'), at('16', '12:30'), null],
  ['4810', 'Change the company’s address', 'Bojović i sinovi d.o.o.', 'Jelena Bojović', 'Resolved', 'Low', 'Request', 'accounts', 'ana', at('13', '09:40'), at('13', '17:40'), at('13', '10:00'), at('18', '09:40'), at('13', '11:15')],
  ['4806', 'Remove a former employee’s access', 'Drina Prevoz d.o.o.', 'Petar Savić', 'Closed', 'High', 'Access', 'accounts', 'ana', at('12', '08:10'), at('12', '10:10'), at('12', '08:40'), at('13', '08:10'), at('12', '09:30')],
  ['4802', 'Bank account missing from the list', 'Vojvođanka Mlin a.d.', 'Mirjana Tot', 'Resolved', 'Normal', 'Problem', 'accounts', 'ana', at('10', '14:00'), at('10', '18:00'), at('10', '15:40'), at('13', '14:00'), at('13', '15:30')],
  ['4798', 'Locked out after a password change', 'Pekara Zlatni klas', 'Jovana Marković', 'Closed', 'Urgent', 'Access', 'accounts', 'ana', at('09', '07:20'), at('09', '08:20'), at('09', '07:35'), at('09', '15:20'), at('09', '08:05')],
  // Stefan's (Payroll).
  ['4820', 'Payroll for a part-time worker', 'Hotel Fruška', 'Bojan Mihajlović', 'Open', 'Normal', 'Question', 'payroll', null, at('14', '08:05'), at('14', '12:05'), null, at('17', '08:05'), null],
  ['4813', 'Sick-leave days in the payroll', 'Dom zdravlja Novi Sad', 'Dragan Lazić', 'Replied', 'Normal', 'Question', 'payroll', 'stefan', at('13', '10:00'), at('13', '14:00'), at('13', '10:50'), at('16', '10:00'), null],
  ['4808', 'Bank file rejected by the bank', 'Bistro Dunav', 'Vesna Ristić', 'Open', 'High', 'Problem', 'payroll', 'stefan', at('13', '08:30'), at('13', '10:30'), at('13', '09:10'), at('14', '08:30'), null],
  ['4804', 'Overtime rate for holidays', 'Kvadrat Gradnja d.o.o.', 'Milica Petrović', 'Resolved', 'Normal', 'Question', 'payroll', 'stefan', at('12', '09:00'), at('12', '13:00'), at('12', '09:45'), at('15', '09:00'), at('12', '16:10')],
  ['4801', 'Payslip in English', 'Medic Lab Niš d.o.o.', 'Ivana Đokić', 'Closed', 'Low', 'Request', 'payroll', 'stefan', at('10', '11:30'), at('10', '19:30'), at('10', '12:00'), at('15', '11:30'), at('11', '10:00')],
  ['4797', 'Contributions base for September', 'Stanić Elektro STR', 'Goran Stanić', 'Resolved', 'High', 'Problem', 'payroll', 'stefan', at('08', '13:15'), at('08', '15:15'), at('08', '13:40'), at('09', '13:15'), at('09', '14:30')],
  // Older, closed.
  ['4795', 'Price list for the new year', 'Vojvođanka Mlin a.d.', 'Mirjana Tot', 'Closed', 'Low', 'Question', 'accounts', 'ana', at('07', '10:00'), at('07', '18:00'), at('07', '10:30'), at('12', '10:00'), at('07', '12:00')],
  ['4794', 'SEF certificate expires soon', 'Panonija Agro d.o.o.', 'Zoran Kiš', 'Closed', 'High', 'Request', 'einvoicing', 'nikola', at('07', '08:30'), at('07', '10:30'), at('07', '09:00'), at('08', '08:30'), at('07', '13:45')],
  ['4793', 'Export the journal to Excel', 'Knjigovodstvo Jelić', 'Snežana Jelić', 'Closed', 'Normal', 'Question', 'accounts', 'ana', at('06', '15:00'), at('06', '19:00'), at('06', '15:20'), at('09', '15:00'), at('07', '09:10')],
  ['4792', 'Annual leave carried over', 'Hotel Fruška', 'Bojan Mihajlović', 'Closed', 'Normal', 'Question', 'payroll', 'stefan', at('06', '09:10'), at('06', '13:10'), at('06', '10:00'), at('09', '09:10'), at('08', '11:00')],
  ['4791', 'Invoice sent twice to the same buyer', 'Bojović i sinovi d.o.o.', 'Marko Bojović', 'Closed', 'High', 'Problem', 'einvoicing', 'nikola', at('05', '12:00'), at('05', '14:00'), at('05', '12:15'), at('06', '12:00'), at('05', '16:30')],
  ['4790', 'New company in the group', 'Dom zdravlja Novi Sad', 'Dragan Lazić', 'Closed', 'Low', 'Request', 'accounts', 'ana', at('05', '08:00'), at('05', '16:00'), at('05', '09:30'), at('10', '08:00'), at('06', '14:00')],
]

const PAUSED_REASONS: Record<string, string> = {
  '4823': 'Waiting for the customer: the bank’s file format',
  '4805': 'Waiting for the customer: the advance’s amount',
  '4814': 'Waiting for the customer: the bank’s statement',
}

/** Every ticket, newest first. */
export const TICKETS: Ticket[] = ROWS.map((row) => {
  const [number, subject, customer, contact, status, priority, type, team, assignee, opened] = row
  const [, , , , , , , , , , firstResponseDue, firstResponseAt, resolutionDue, resolvedAt] = row
  const updated = resolvedAt ?? firstResponseAt ?? opened
  return {
    number,
    subject,
    customer,
    contact,
    email: emailOf(contact, customer),
    status,
    priority,
    type,
    team,
    assignee,
    opened,
    updated,
    firstResponseDue,
    resolutionDue,
    ...(firstResponseAt === null ? {} : { firstResponseAt }),
    ...(resolvedAt === null ? {} : { resolvedAt }),
    ...(PAUSED_REASONS[number] === undefined ? {} : { pausedReason: PAUSED_REASONS[number] }),
  }
}).sort((a, b) => Number(b.number) - Number(a.number))

/** A ticket by its number (the shared three are always there). */
export function ticketOf(tickets: readonly Ticket[], number: string): Ticket | undefined {
  return tickets.find((ticket) => ticket.number === number)
}

// ── The application's rules ───────────────────────────────────────────────────────────────────

/** Done: resolved or closed. */
export function isDone(ticket: Ticket): boolean {
  return ticket.status === 'Resolved' || ticket.status === 'Closed'
}

/** Whether a ticket's service level is broken now: a first response or a resolution overdue. */
export function isOverdue(ticket: Ticket, now = NOW): boolean {
  if (isDone(ticket) || ticket.status === 'Paused') return false
  const first =
    ticket.firstResponseAt === undefined
      ? slaReading(ticket.firstResponseDue, now)?.state === 'overdue'
      : false
  return first || slaReading(ticket.resolutionDue, now)?.state === 'overdue'
}

export type ViewId = 'mine' | 'unassigned' | 'overdue' | 'all'

/** The saved views: My open, Unassigned, Overdue, All. */
export const VIEWS: { id: ViewId; label: string }[] = [
  { id: 'mine', label: 'My open' },
  { id: 'unassigned', label: 'Unassigned' },
  { id: 'overdue', label: 'Overdue' },
  { id: 'all', label: 'All' },
]

export function inView(ticket: Ticket, view: ViewId): boolean {
  switch (view) {
    case 'mine':
      return ticket.assignee === ME && !isDone(ticket)
    case 'unassigned':
      return ticket.assignee === null && !isDone(ticket)
    case 'overdue':
      return isOverdue(ticket)
    case 'all':
      return true
  }
}

// ── Threads ───────────────────────────────────────────────────────────────────────────────────

export interface TicketMessage {
  id: string
  /** An agent's id, or the customer's contact. */
  author: AgentId | 'customer'
  at: string
  internal?: boolean
  text: string
  mentions?: { id: string; name: string }[]
  files?: { name: string; size: string }[]
}

/**
 * #4821: Milica's message with the rejection notice, Nikola's internal note asking Ana, Ana's
 * answer. No reply to the customer yet: the first response is due at 10:30.
 */
const THREAD_4821: TicketMessage[] = [
  {
    id: 'm1',
    author: 'customer',
    at: at('14', '08:30'),
    text:
      'Good morning. Our invoice F-2026-0412 to Drina Prevoz d.o.o. came back from SEF as ' +
      'rejected this morning. The notice says "buyer identification". We sent the same buyer ' +
      'an invoice last month without any problem. What is wrong, and how do we send it again?',
    files: [{ name: 'SEF rejection notice F-2026-0412.pdf', size: '84 KB' }],
  },
  {
    id: 'm2',
    author: 'nikola',
    at: at('14', '08:52'),
    internal: true,
    text: '@Ana Kovač did Drina Prevoz change its tax number recently? The notice points at the buyer.',
    mentions: [{ id: 'ana', name: 'Ana Kovač' }],
  },
  {
    id: 'm3',
    author: 'ana',
    at: at('14', '09:05'),
    internal: true,
    text:
      'Yes: Drina Prevoz merged into its parent on 01.10.2026. and has a new tax number since. ' +
      'Kvadrat Gradnja still has the old one on the buyer’s card.',
  },
]

const THREAD_4822: TicketMessage[] = [
  {
    id: 'm1',
    author: 'customer',
    at: at('14', '07:55'),
    text: 'None of us can sign in since this morning. The page says the code is wrong.',
  },
  {
    id: 'm2',
    author: 'ana',
    at: at('14', '08:20'),
    text:
      'Your phones’ clocks are an hour behind after the update, so the codes are wrong. Set the ' +
      'time to automatic and sign in again. Tell me if it still does not work.',
  },
]

const THREAD_4823: TicketMessage[] = [
  {
    id: 'm1',
    author: 'customer',
    at: at('13', '11:10'),
    text: 'Which format does the payroll export use for Banca Intesa? Our bank asks for a new one.',
  },
  {
    id: 'm2',
    author: 'stefan',
    at: at('13', '12:02'),
    text:
      'The export writes the format your bank sets in Payroll › Settings › Bank. Could you send ' +
      'us the specification the bank gave you? We will check it against ours.',
  },
  {
    id: 'm3',
    author: 'stefan',
    at: at('13', '12:04'),
    internal: true,
    text: 'Paused until Dragan sends the specification.',
  },
]

/** A ticket's conversation: the shared three in full, the others their first message. */
export function threadOf(ticket: Ticket): TicketMessage[] {
  if (ticket.number === '4821') return THREAD_4821
  if (ticket.number === '4822') return THREAD_4822
  if (ticket.number === '4823') return THREAD_4823
  const first: TicketMessage = {
    id: 'm1',
    author: 'customer',
    at: ticket.opened,
    text: `${ticket.subject}. Could you help us, please?`,
  }
  if (ticket.firstResponseAt === undefined || ticket.assignee === null) return [first]
  return [
    first,
    {
      id: 'm2',
      author: ticket.assignee,
      at: ticket.firstResponseAt,
      text: 'Thank you for writing. We are looking into it and will write again shortly.',
    },
  ]
}

// ── Activity ──────────────────────────────────────────────────────────────────────────────────

export interface TicketActivity {
  key: string
  author: string
  at: string
  text: string
}

/** #4821's log, oldest first. */
export const ACTIVITY_4821: TicketActivity[] = [
  { key: 'a1', author: 'Liro support', at: at('14', '08:30'), text: 'Created from an e-mail' },
  {
    key: 'a2',
    author: 'Liro support',
    at: at('14', '08:30'),
    text: 'Assigned to the E-invoicing team and Nikola Ilić by the routing rule',
  },
  { key: 'a3', author: 'Nikola Ilić', at: at('14', '08:48'), text: 'Priority: Normal → High' },
  { key: 'a4', author: 'Nikola Ilić', at: at('14', '08:52'), text: 'Added an internal note' },
  { key: 'a5', author: 'Ana Kovač', at: at('14', '09:05'), text: 'Added an internal note' },
]

// ── Composing ─────────────────────────────────────────────────────────────────────────────────

const text = (value: string): RichTextNode => ({ type: 'text', text: value })
const field = (key: string): RichTextNode => ({ type: 'mergeField', attrs: { key } })
const p = (...content: RichTextNode[]): RichTextNode => ({ type: 'paragraph', content })
const doc = (...content: RichTextNode[]): RichTextNode => ({ type: 'doc', content })
const bullets = (...items: string[]): RichTextNode => ({
  type: 'bulletList',
  content: items.map((item) => ({ type: 'listItem', content: [p(text(item))] })),
})

/** The fields a reply can use; the application fills them in when it sends. */
export const REPLY_FIELDS: RichTextMergeField[] = [
  { key: 'contact.firstName', label: 'Contact’s first name', group: 'Contact' },
  { key: 'ticket.number', label: 'Ticket number', group: 'Ticket' },
  { key: 'agent.name', label: 'Your name', group: 'Ticket' },
]

/** The team's saved replies (canned responses). */
export const SAVED: SavedReply[] = [
  {
    id: 'hello',
    label: 'Greeting',
    content: doc(p(text('Dear '), field('contact.firstName'), text(','))),
  },
  {
    id: 'sef-buyer',
    label: 'SEF rejected: the buyer’s tax number',
    group: 'E-invoicing',
    content: doc(
      p(
        text(
          'SEF rejected the invoice because the buyer’s tax number on it is not the one in the register.',
        ),
      ),
      bullets(
        'Open the buyer’s card and enter the tax number from the register.',
        'Open the invoice and choose Correct.',
        'Send the corrected invoice to SEF again.',
      ),
    ),
  },
  {
    id: 'sef-resent',
    label: 'Sent again, waiting for the buyer',
    group: 'E-invoicing',
    content: doc(p(text('The corrected invoice is in SEF. The buyer has 15 days to accept it.'))),
  },
  {
    id: 'reset-2fa',
    label: 'Two-factor sign-in reset',
    group: 'Accounts',
    content: doc(p(text('We reset your two-factor sign-in. Sign in again and set it up anew.'))),
  },
  {
    id: 'need-details',
    label: 'We need more details',
    group: 'General',
    content: doc(p(text('Could you send us a screenshot and the time it happened?'))),
  },
  {
    id: 'closing',
    label: 'Closing the ticket',
    group: 'General',
    content: doc(
      p(text('We are closing ticket #'), field('ticket.number'), text('. Reply to reopen it.')),
      p(text('Kind regards,')),
      p(field('agent.name')),
    ),
  },
]

/** Nikola's reply to #4821, started. */
export const DRAFT_4821 = doc(
  p(text('Dear Milica,')),
  p(
    text(
      'thank you for the notice. Drina Prevoz d.o.o. has a new tax number since 01.10.2026., ' +
        'so SEF did not find the buyer.',
    ),
  ),
)

// ── Knowledge base (for "Insert article") ─────────────────────────────────────────────────────

export interface Article {
  id: string
  title: string
  category: string
  updated: string
  href: string
}

export const ARTICLES: Article[] = [
  {
    id: 'kb1',
    title: 'Why was my SEF invoice rejected?',
    category: 'E-invoicing',
    updated: '2026-10-02',
    href: 'https://support.example.com/kb/sef-invoice-rejected',
  },
  {
    id: 'kb2',
    title: 'Reset two-factor sign-in',
    category: 'Accounts',
    updated: '2026-09-18',
    href: 'https://support.example.com/kb/reset-two-factor',
  },
  {
    id: 'kb3',
    title: 'Export payroll to your bank',
    category: 'Payroll',
    updated: '2026-09-30',
    href: 'https://support.example.com/kb/payroll-bank-export',
  },
  {
    id: 'kb4',
    title: 'Correct and resend an e-invoice',
    category: 'E-invoicing',
    updated: '2026-08-27',
    href: 'https://support.example.com/kb/correct-e-invoice',
  },
  {
    id: 'kb5',
    title: 'Update a buyer’s tax number',
    category: 'E-invoicing',
    updated: '2026-10-06',
    href: 'https://support.example.com/kb/buyer-tax-number',
  },
  {
    id: 'kb6',
    title: 'Add a user to your company',
    category: 'Accounts',
    updated: '2026-07-14',
    href: 'https://support.example.com/kb/add-user',
  },
]

// ── The dashboard's figures (the application's reports) ───────────────────────────────────────

/** The last seven days. */
export const WEEK = ['08', '09', '10', '11', '12', '13', '14'].map((day) => `2026-10-${day}`)

export const OPENED_RESOLVED = {
  opened: ['21', '18', '24', '9', '6', '27', '11'],
  resolved: ['19', '22', '20', '8', '5', '23', '4'],
}

/** The median first response, minutes, per day. */
export const FIRST_RESPONSE_MINUTES = ['58', '71', '64', '45', '40', '82', '66']

/** Satisfaction ratings of the last 30 days. */
export const RATINGS = { good: '46', okay: '3', bad: '1', share: '92' }

/** The median times of the last 30 days, minutes. */
export const MEDIANS = { firstResponse: 72, resolution: 580 }
