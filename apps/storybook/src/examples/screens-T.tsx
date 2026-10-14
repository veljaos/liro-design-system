import {
  BookOpen,
  House,
  Languages,
  Link2,
  LogOut,
  Paperclip,
  Search,
  Send,
  Ticket as TicketIcon,
  UserRound,
} from 'lucide-react'
import { useContext, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  AttachmentList,
  Button,
  CategoryGrid,
  DataTable,
  EmptyState,
  FileDropzone,
  HelpfulFeedback,
  instantText,
  KeyValueList,
  LinkSuggestions,
  MessageThread,
  notice,
  PageContents,
  PageHeader,
  PortalShell,
  RadioGroupField,
  SatisfactionRating,
  SearchResultList,
  SectionCard,
  SelectField,
  StatusBadge,
  TextAreaField,
  TextField,
  Toaster,
  useLiro,
  type Attachment,
  type DataTableColumn,
  type MenuEntry,
  type PortalSection,
  type ThreadMessage,
} from '@veljaos/ui'
import { RichText, richTextHeadings } from '../../../../packages/ui/src/rich-text'
import type { ExampleRoute } from './example-app'
import { Navigate, ROUTES, Shell, type ExampleAccount } from './example-shell'
import { useExampleState } from './example-state'
import { Frame, Tenant } from './screens-G'
import {
  AGENTS,
  ARTICLES,
  articleCount,
  articlesIn,
  EMPTY_DRAFT,
  findArticle,
  findCategory,
  KB_CATEGORIES,
  MILICA,
  MILICA_TICKETS,
  NEXT_TICKET,
  POPULAR,
  RATINGS,
  RESOLVED_TICKET,
  searchArticles,
  searchResult,
  SEF_DRAFT,
  STATUS_HINTS,
  suggestArticles,
  SUPPORT_EMAIL,
  T_NOW,
  T_TODAY,
  THREADS,
  TICKET_FILES,
  TICKET_TONES,
  TICKET_TYPES,
  ticketRef,
  type AgentId,
  type KbArticle,
  type Ticket,
  type TicketDraft,
  type TicketFile,
  type TicketMessage,
  type TicketType,
} from './data-T'

/*
 * Group T's example screens (P5.30 d and e): Liro's support portal for its customer companies and
 * the knowledge base, as Milica Petrović of Kvadrat Gradnja d.o.o. sees them on 14.10.2026 at
 * 09:40 (PortalShell), and the same knowledge base inside the agents' AppShell (Nikola Ilić).
 * - The portal: home (search, her open tickets, the categories), a new ticket (type, subject,
 *   description, files; articles proposed while she writes — LinkSuggestions, never blocking
 *   Submit), My tickets (status in words and tone), a ticket's conversation (MessageThread; the
 *   agents' internal notes are not in the data the portal gets), and the rating of a resolved
 *   ticket (SatisfactionRating).
 * - The knowledge base: categories (CategoryGrid), a category's articles, an article (RichText
 *   with PageContents, "Was this helpful?" and related articles) and the search (SearchResultList,
 *   the matches marked).
 * Each screen plays the application with data-T.ts: it keeps the tickets above the screens
 * (`useExampleState`), searches the articles and proposes them. Inserting an article's link into
 * a reply is the agents' reply composer (another group); this group's articles are the ones it links to.
 */

export const T_ROUTES = {
  home: '/support',
  newTicket: '/support/tickets/new',
  /** The new ticket half written, the articles proposed. */
  newTicketDraft: '/support/tickets/new?draft=sef',
  tickets: '/support/tickets',
  ticket: (number: string) => `/support/tickets/${number}`,
  /** The resolved ticket after its rating was sent. */
  rated: `/support/tickets/${RESOLVED_TICKET}?rated`,
  kb: '/support/kb',
  kbCategory: (id: string) => `/support/kb/${id}`,
  kbArticle: (slug: string) => `/support/kb/articles/${slug}`,
  kbSearch: '/support/kb/search',
  kbSearchRejected: '/support/kb/search?q=rejected',
  kbSearchNothing: '/support/kb/search?q=fiscal+printer',
  agentKb: '/helpdesk/kb',
  agentCategory: (id: string) => `/helpdesk/kb/${id}`,
  agentArticle: (slug: string) => `/helpdesk/kb/articles/${slug}`,
  agentSearch: '/helpdesk/kb/search?q=two-factor',
}

/** Where the knowledge base's links lead: the portal's pages, or the agents'. */
interface KbPlace {
  agent: boolean
  home: string
  category: (id: string) => string
  article: (slug: string) => string
  search: string
}

const PORTAL_KB: KbPlace = {
  agent: false,
  home: T_ROUTES.kb,
  category: T_ROUTES.kbCategory,
  article: T_ROUTES.kbArticle,
  search: T_ROUTES.kbSearch,
}

const AGENT_KB: KbPlace = {
  agent: true,
  home: T_ROUTES.agentKb,
  category: T_ROUTES.agentCategory,
  article: T_ROUTES.agentArticle,
  search: '/helpdesk/kb/search',
}

const LINK = 'text-link no-underline visited:text-link hover:underline'

// ── The application's state above the screens ───────────────────────────────────────────────

interface PortalState {
  tickets: Ticket[]
  threads: Record<string, TicketMessage[]>
  ratings: Record<string, { value: string; comment: string }>
}

const INITIAL_STATE = (): PortalState => ({
  tickets: MILICA_TICKETS,
  threads: THREADS,
  ratings: RATINGS,
})

function usePortal() {
  return useExampleState<PortalState>('t-portal', INITIAL_STATE)
}

function agentName(id: string): string {
  return id in AGENTS ? AGENTS[id as AgentId].name : MILICA.name
}

function statusBadge(ticket: Ticket) {
  return <StatusBadge label={ticket.status} tone={TICKET_TONES[ticket.status]} />
}

// ── The portal's frame ────────────────────────────────────────────────────────────────────────

const PORTAL_MENU = (navigate: (path: string) => void): MenuEntry[] => [
  { label: 'My details', icon: UserRound, onSelect: () => undefined },
  { label: 'Language: English', icon: Languages, onSelect: () => undefined },
  { type: 'separator' },
  {
    label: 'Sign out',
    icon: LogOut,
    onSelect: () => {
      navigate(ROUTES.signIn)
    },
  },
]

type PortalSectionKey = 'home' | 'tickets' | 'kb'

function SupportPortal({
  phone,
  current,
  children,
}: {
  phone: boolean
  current: PortalSectionKey
  children: ReactNode
}) {
  const navigate = useContext(Navigate)
  const [state] = usePortal()
  const waiting = state.tickets.filter(
    (ticket) => ticket.status === 'Replied' || ticket.status === 'Resolved',
  ).length
  const sections: PortalSection[] = [
    { key: 'home', label: 'Home', href: `#${T_ROUTES.home}`, icon: House },
    {
      key: 'tickets',
      label: 'My tickets',
      href: `#${T_ROUTES.tickets}`,
      icon: TicketIcon,
      ...(waiting > 0 ? { note: `${String(waiting)} for you` } : {}),
    },
    { key: 'kb', label: 'Knowledge base', href: `#${T_ROUTES.kb}`, icon: BookOpen },
  ]
  return (
    <Tenant today={T_TODAY}>
      <PortalShell
        layout={phone ? 'phone' : 'desktop'}
        brand={{ brandName: 'Liro', productName: 'Support', href: `#${T_ROUTES.home}` }}
        participant={{ name: MILICA.name, detail: MILICA.company }}
        menu={PORTAL_MENU(navigate)}
        sections={sections.map((section) =>
          section.key === current ? { ...section, current: true } : section,
        )}
        footer={`Liro support · ${SUPPORT_EMAIL} · Monday to Friday, 08–17 h · Illustrative data`}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </PortalShell>
    </Tenant>
  )
}

/** A portal page: one column, centred on wide screens; `wide` for the knowledge base. */
function PortalPage({ wide = false, children }: { wide?: boolean; children: ReactNode }) {
  return (
    <div
      className={`mx-auto box-border flex w-full min-w-0 flex-col gap-4 p-4 sm:gap-6 sm:p-6 ${wide ? 'max-w-5xl' : 'max-w-3xl'}`}
    >
      {children}
    </div>
  )
}

/** Nikola Ilić of Liro support, in the agents' AppShell. */
const AGENT_ACCOUNT: ExampleAccount = {
  name: AGENTS.nikola.name,
  email: 'nikola.ilic@example.com',
  companies: [{ id: 'liro', name: 'Liro support', description: 'Helpdesk' }],
  links: [
    { label: 'Knowledge base', path: T_ROUTES.agentKb },
    { label: 'Search the knowledge base', path: AGENT_KB.search },
  ],
}

function AgentFrame({
  phone,
  crumbs,
  children,
}: {
  phone: boolean
  crumbs: { label: string; href?: string }[]
  children: ReactNode
}) {
  return (
    <Tenant today={T_TODAY}>
      <Shell
        phone={phone}
        account={AGENT_ACCOUNT}
        company="liro"
        crumbs={[{ label: 'Helpdesk' }, ...crumbs]}
      >
        <Frame phone={phone}>{children}</Frame>
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

/** The knowledge base's frame: the portal for customers, AppShell for agents. */
function KbFrame({
  place,
  phone,
  crumbs,
  children,
}: {
  place: KbPlace
  phone: boolean
  crumbs: { label: string; href?: string }[]
  children: ReactNode
}) {
  if (place.agent) {
    return (
      <AgentFrame phone={phone} crumbs={crumbs}>
        {children}
      </AgentFrame>
    )
  }
  return (
    <SupportPortal phone={phone} current="kb">
      <PortalPage wide>{children}</PortalPage>
    </SupportPortal>
  )
}

// ── 1. The portal's home ──────────────────────────────────────────────────────────────────────

/** The search field and its button: the query goes to the search page. */
function KbSearchBox({ place, label }: { place: KbPlace; label: string }) {
  const navigate = useContext(Navigate)
  const [, setQuery] = useExampleState(place.agent ? 't-agent-query' : 't-kb-query', () => '')
  const [text, setText] = useState('')
  const go = () => {
    setQuery(text)
    navigate(place.search)
  }
  return (
    <form
      role="search"
      className="flex flex-wrap items-end gap-2"
      onSubmit={(event) => {
        event.preventDefault()
        go()
      }}
    >
      <TextField
        type="search"
        label={label}
        placeholder="For example: invoice rejected"
        value={text}
        onChange={setText}
        className="min-w-0 flex-1 basis-60"
      />
      <Button family="neutral" icon={Search} label="Search" type="submit" />
    </form>
  )
}

function TicketRows({ tickets }: { tickets: readonly Ticket[] }) {
  const { format, linkComponent: Link } = useLiro()
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {tickets.map((ticket) => (
        <li
          key={ticket.number}
          className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1 border-0 border-t border-solid border-subtle px-4 py-3 first:border-t-0"
        >
          <div className="flex min-w-0 flex-1 basis-60 flex-col gap-0.5">
            <Link
              href={`#${T_ROUTES.ticket(ticket.number)}`}
              className={`bidi-content self-start rounded-sm py-0.5 text-sm font-medium ${LINK}`}
            >
              {ticket.subject}
            </Link>
            <span className="bidi-content text-xs text-secondary">
              {`${ticketRef(ticket.number)} · ${STATUS_HINTS[ticket.status]} · updated ${instantText(format, ticket.updated)}`}
            </span>
          </div>
          {statusBadge(ticket)}
        </li>
      ))}
    </ul>
  )
}

export function PortalHome({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [state] = usePortal()
  const active = state.tickets.filter((ticket) => ticket.status !== 'Closed')
  return (
    <SupportPortal phone={phone} current="home">
      <PortalPage wide>
        <PageHeader
          title="How can we help, Milica?"
          subtitle={`${MILICA.company} · Liro support answers Monday to Friday, 08–17 h`}
          actions={
            <Button
              family="primary"
              emphasis="primary"
              icon={Send}
              label="Submit a ticket"
              onClick={() => {
                navigate(T_ROUTES.newTicket)
              }}
            />
          }
        />
        <KbSearchBox place={PORTAL_KB} label="Search the knowledge base" />
        <SectionCard
          title="Your tickets"
          headingLevel={2}
          flush
          actions={
            <Button
              family="neutral"
              emphasis="menu"
              icon={TicketIcon}
              label="All tickets"
              onClick={() => {
                navigate(T_ROUTES.tickets)
              }}
            />
          }
        >
          <TicketRows tickets={active} />
        </SectionCard>
        <section aria-labelledby="t-home-kb" className="flex flex-col gap-3">
          <h2 id="t-home-kb" className="bidi-content m-0 text-h3 text-primary">
            Browse the knowledge base
          </h2>
          <KbCategories place={PORTAL_KB} phone={phone} />
        </section>
      </PortalPage>
    </SupportPortal>
  )
}

// ── 2. A new ticket ───────────────────────────────────────────────────────────────────────────

/** The application's search for articles, 300ms after the last key (none while it waits). */
function useSuggestions(subject: string, description: string, immediate: boolean) {
  const query = `${subject} ${description}`.trim()
  const [answer, setAnswer] = useState<{ query: string; found: KbArticle[] }>(() =>
    immediate ? { query, found: suggestArticles(subject, description) } : { query: '', found: [] },
  )
  const searching = query.length >= 3
  useEffect(() => {
    if (!searching || answer.query === query) return
    const timer = window.setTimeout(() => {
      setAnswer({ query, found: suggestArticles(subject, description) })
    }, 300)
    return () => {
      window.clearTimeout(timer)
    }
  }, [query, searching, answer.query, subject, description])
  return {
    found: searching ? answer.found : [],
    loading: searching && answer.query !== query,
  }
}

function fileSize(bytes: number, format: { number: (value: string) => string }): string {
  return bytes >= 1024 * 1024
    ? `${format.number((bytes / (1024 * 1024)).toFixed(1))} MB`
    : `${format.number(String(Math.max(1, Math.round(bytes / 1024))))} KB`
}

export function NewTicket({ phone, draft }: { phone: boolean; draft?: 'sef' }) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const [, setState] = usePortal()
  // The draft is kept above the screen: reading a proposed article and coming back keeps it.
  const [form, setForm] = useExampleState<TicketDraft>(
    draft === 'sef' ? 't-draft-sef' : 't-draft',
    () => (draft === 'sef' ? SEF_DRAFT : EMPTY_DRAFT),
  )
  const [tried, setTried] = useState(false)
  const suggestions = useSuggestions(form.subject, form.description, draft === 'sef')
  const errors = {
    type: form.type === '' ? 'Choose what kind of help you need.' : undefined,
    subject: form.subject.trim() === '' ? 'Write a subject.' : undefined,
    description:
      form.description.trim() === '' ? 'Describe what happened and what you expected.' : undefined,
  }
  const submit = () => {
    setTried(true)
    if (errors.type !== undefined || errors.subject !== undefined) return
    if (errors.description !== undefined) return
    const ticket: Ticket = {
      number: NEXT_TICKET,
      subject: form.subject.trim(),
      company: MILICA.company,
      contact: MILICA.name,
      status: 'Open',
      priority: 'Normal',
      type: form.type as TicketType,
      team: 'E-invoicing',
      agent: 'nikola',
      opened: T_NOW,
      updated: T_NOW,
    }
    setState((current) => ({
      ...current,
      tickets: [ticket, ...current.tickets.filter((each) => each.number !== NEXT_TICKET)],
      threads: {
        ...current.threads,
        [NEXT_TICKET]: [
          {
            id: `${NEXT_TICKET}-1`,
            author: 'milica',
            at: T_NOW,
            text: form.description.trim(),
            ...(form.files.length > 0 ? { files: form.files } : {}),
          },
        ],
      },
    }))
    setForm(EMPTY_DRAFT)
    notice.success(
      `Ticket ${ticketRef(NEXT_TICKET)} submitted. We also sent it to ${MILICA.email}.`,
    )
    navigate(T_ROUTES.ticket(NEXT_TICKET))
  }
  const files: Attachment[] = form.files.map((file, index) => ({
    id: String(index),
    name: file.name,
    sizeText: file.sizeText,
    state: 'available',
  }))
  const suggestionList = (
    <LinkSuggestions
      title="These articles may help"
      headingLevel={2}
      loading={suggestions.loading}
      suggestions={suggestions.found.map((article) => ({
        id: article.slug,
        title: article.title,
        href: `#${T_ROUTES.kbArticle(article.slug)}`,
        meta: findCategory(article.category)?.title ?? '',
        summary: article.summary,
      }))}
    />
  )
  return (
    <SupportPortal phone={phone} current="tickets">
      <PortalPage wide>
        <PageHeader
          title="Submit a ticket"
          back={{ label: 'My tickets', href: `#${T_ROUTES.tickets}` }}
          subtitle="We answer within two working hours, here and by e-mail."
        />
        <div
          className={
            phone ? 'flex flex-col gap-4' : 'grid grid-cols-[minmax(0,1fr)_18rem] items-start gap-6'
          }
        >
          <SectionCard headingLevel={2}>
            <form
              noValidate
              aria-label="New ticket"
              className="flex flex-col gap-4"
              onSubmit={(event) => {
                event.preventDefault()
                submit()
              }}
            >
              {phone ? (
                // On a phone the four kinds as a select, so the proposed articles stand in the
                // first screen, right under the subject.
                <SelectField
                  label="What do you need?"
                  required
                  placeholder="Choose"
                  options={TICKET_TYPES.map((each) => ({
                    value: each.value,
                    label: `${each.label}: ${each.description.toLowerCase()}`,
                  }))}
                  {...(form.type === '' ? {} : { value: form.type })}
                  onChange={(type) => {
                    setForm((current) => ({ ...current, type: type as TicketType }))
                  }}
                  {...(tried && errors.type !== undefined ? { error: errors.type } : {})}
                />
              ) : (
                <RadioGroupField
                  label="What do you need?"
                  required
                  options={TICKET_TYPES}
                  {...(form.type === '' ? {} : { value: form.type })}
                  onChange={(type) => {
                    setForm((current) => ({ ...current, type: type as TicketType }))
                  }}
                  {...(tried && errors.type !== undefined ? { error: errors.type } : {})}
                />
              )}
              <TextField
                label="Subject"
                required
                value={form.subject}
                onChange={(subject) => {
                  setForm((current) => ({ ...current, subject }))
                }}
                {...(tried && errors.subject !== undefined ? { error: errors.subject } : {})}
              />
              {phone && suggestionList}
              <TextAreaField
                label="Description"
                description="What happened, what you expected, and the document's number if there is one."
                required
                rows={6}
                value={form.description}
                onChange={(description) => {
                  setForm((current) => ({ ...current, description }))
                }}
                {...(tried && errors.description !== undefined
                  ? { error: errors.description }
                  : {})}
              />
              <FileDropzone
                label="Files"
                description="A screenshot of the message, the document, or your bank's file."
                accept={TICKET_FILES.accept}
                acceptText={TICKET_FILES.acceptText}
                maxSize={TICKET_FILES.maxSize}
                maxSizeText={TICKET_FILES.maxSizeText}
                maxFiles={5}
                existing={form.files.length}
                camera
                layout={phone ? 'phone' : 'desktop'}
                onFiles={(chosen) => {
                  setForm((current) => ({
                    ...current,
                    files: [
                      ...current.files,
                      ...chosen.map((file) => ({
                        name: file.name,
                        sizeText: fileSize(file.size, format),
                      })),
                    ],
                  }))
                }}
              />
              {files.length > 0 && (
                <AttachmentList
                  label="Files"
                  files={files}
                  canRemove={() => true}
                  onRemove={(file) => {
                    setForm((current) => ({
                      ...current,
                      files: current.files.filter((_, index) => String(index) !== file.id),
                    }))
                  }}
                />
              )}
              <div className="flex flex-wrap justify-end gap-2">
                <Button
                  intent="cancel"
                  label="Cancel"
                  onClick={() => {
                    navigate(T_ROUTES.tickets)
                  }}
                />
                <Button
                  family="primary"
                  emphasis="primary"
                  icon={Send}
                  label="Submit ticket"
                  type="submit"
                />
              </div>
            </form>
          </SectionCard>
          {!phone && suggestionList}
        </div>
      </PortalPage>
    </SupportPortal>
  )
}

// ── 3. My tickets ─────────────────────────────────────────────────────────────────────────────

export function MyTickets({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const { format, linkComponent: Link } = useLiro()
  const [state] = usePortal()
  const rows = [...state.tickets].sort((a, b) => b.updated.localeCompare(a.updated))
  const columns: DataTableColumn<Ticket>[] = [
    {
      id: 'subject',
      header: 'Ticket',
      minWidth: 260,
      cell: (row) => (
        <span className="flex min-w-0 flex-col">
          <Link
            href={`#${T_ROUTES.ticket(row.number)}`}
            className={`bidi-content self-start rounded-sm py-0.5 font-medium ${LINK}`}
          >
            {row.subject}
          </Link>
          <span className="bidi-content text-xs text-secondary">{ticketRef(row.number)}</span>
        </span>
      ),
    },
    {
      id: 'status',
      header: 'Status',
      cell: (row) => (
        <span className="flex flex-col items-start gap-0.5">
          {statusBadge(row)}
          <span className="bidi-content text-xs text-secondary">{STATUS_HINTS[row.status]}</span>
        </span>
      ),
    },
    { id: 'type', header: 'Type', cell: (row) => row.type },
    { id: 'agent', header: 'Handled by', cell: (row) => AGENTS[row.agent].name },
    {
      id: 'updated',
      header: 'Last update',
      numeric: true,
      cell: (row) => instantText(format, row.updated),
    },
  ]
  return (
    <SupportPortal phone={phone} current="tickets">
      <PortalPage wide>
        <PageHeader
          title="My tickets"
          subtitle={`${MILICA.company}: the tickets you submitted`}
          actions={
            <Button
              family="primary"
              emphasis="primary"
              icon={Send}
              label="Submit a ticket"
              onClick={() => {
                navigate(T_ROUTES.newTicket)
              }}
            />
          }
        />
        <SectionCard flush>
          <DataTable
            label="My tickets"
            columns={columns}
            rows={rows}
            getRowId={(row) => row.number}
            getRowLabel={(row) => `${ticketRef(row.number)}, ${row.subject}`}
            inCard
            layout={phone ? 'cards' : 'table'}
            onRowOpen={(row) => {
              navigate(T_ROUTES.ticket(row.number))
            }}
            mobile={{
              title: (row) => row.subject,
              subtitle: (row) =>
                `${ticketRef(row.number)} · ${STATUS_HINTS[row.status]} · ${instantText(format, row.updated)}`,
              badge: (row) => statusBadge(row),
              details: ['type', 'agent'],
            }}
          />
        </SectionCard>
      </PortalPage>
    </SupportPortal>
  )
}

// ── 4. A ticket: the conversation and the rating ──────────────────────────────────────────────

function filesOf(files: readonly TicketFile[]): Attachment[] {
  return files.map((file, index) => ({
    id: `${file.name}-${String(index)}`,
    name: file.name,
    sizeText: file.sizeText,
    state: 'available',
  }))
}

const SCALE = [
  { value: '1', label: 'Very dissatisfied' },
  { value: '2', label: 'Dissatisfied' },
  { value: '3', label: 'Neither' },
  { value: '4', label: 'Satisfied' },
  { value: '5', label: 'Very satisfied' },
]

export function TicketPage({
  phone,
  number,
  rated = false,
}: {
  phone: boolean
  number: string
  /** The page as left after the rating was sent. */
  rated?: boolean
}) {
  const { format } = useLiro()
  const [state, setState] = usePortal()
  const [reply, setReply] = useState<TicketFile[]>([])
  const picker = useRef<HTMLInputElement>(null)
  const ticket = state.tickets.find((each) => each.number === number)
  if (ticket === undefined) {
    return (
      <SupportPortal phone={phone} current="tickets">
        <PortalPage>
          <EmptyState title="This ticket is not yours or does not exist" />
        </PortalPage>
      </SupportPortal>
    )
  }
  const thread = state.threads[number] ?? []
  const agent = AGENTS[ticket.agent]
  const rating =
    state.ratings[number] ??
    (rated ? { value: '4', comment: 'Ana answered within an hour. Clear steps.' } : undefined)
  const closed = ticket.status === 'Closed'
  const messages: ThreadMessage[] = thread.map((message) => ({
    id: message.id,
    author: { id: message.author, name: agentName(message.author) },
    own: message.author === 'milica',
    at: message.at,
    text: message.text,
    ...(message.files === undefined
      ? {}
      : {
          extra: (
            <AttachmentList
              label={`Files of the message at ${format.time(message.at)}`}
              files={filesOf(message.files)}
              onDownload={() => undefined}
            />
          ),
        }),
  }))
  const send = (text: string) => {
    const at = T_NOW
    setState((current) => ({
      ...current,
      tickets: current.tickets.map((each) =>
        each.number === number ? { ...each, status: 'Open', updated: at } : each,
      ),
      threads: {
        ...current.threads,
        [number]: [
          ...(current.threads[number] ?? []),
          {
            id: `${number}-${String((current.threads[number] ?? []).length + 1)}`,
            author: 'milica',
            at,
            text,
            ...(reply.length > 0 ? { files: reply } : {}),
          },
        ],
      },
    }))
    setReply([])
  }
  return (
    <SupportPortal phone={phone} current="tickets">
      <PortalPage>
        <PageHeader
          title={ticket.subject}
          back={{ label: 'My tickets', href: `#${T_ROUTES.tickets}` }}
          status={statusBadge(ticket)}
          subtitle={`${ticketRef(ticket.number)} · ${STATUS_HINTS[ticket.status]}`}
        />
        {ticket.status === 'Resolved' && (
          <SectionCard title="Rate the help you got" headingLevel={2}>
            <SatisfactionRating
              question="How satisfied are you with how we solved this ticket?"
              description={`${agent.name} marked it resolved on ${instantText(format, ticket.updated)}. Your answer goes to the support team.`}
              options={SCALE}
              layout={phone ? 'phone' : 'desktop'}
              submitted={rating ?? null}
              thanks="Thank you. Your answer helps us answer better."
              onSubmit={(answer) => {
                setState((current) => ({
                  ...current,
                  ratings: { ...current.ratings, [number]: answer },
                }))
              }}
            />
          </SectionCard>
        )}
        <SectionCard title="Details" headingLevel={2}>
          <KeyValueList
            columns={2}
            items={[
              { key: 'type', label: 'Type', value: ticket.type },
              { key: 'agent', label: 'Handled by', value: `${agent.name}, ${agent.team} team` },
              { key: 'opened', label: 'Opened', value: instantText(format, ticket.opened) },
              { key: 'updated', label: 'Last update', value: instantText(format, ticket.updated) },
            ]}
          />
        </SectionCard>
        <SectionCard title="Conversation" headingLevel={2}>
          <MessageThread
            label={`Conversation on ${ticketRef(ticket.number)}`}
            messages={messages}
            className={phone ? 'h-[34rem]' : 'h-[36rem]'}
            composer={{
              label: 'Reply',
              placeholder:
                ticket.status === 'Resolved'
                  ? 'Write a reply to open the ticket again'
                  : 'Write a reply',
              onSend: ({ text }) => {
                send(text)
              },
              ...(closed
                ? {
                    disabled: true,
                    disabledReason:
                      'This ticket is closed. Submit a new ticket if you need more help.',
                  }
                : {
                    tools: (
                      <>
                        <input
                          ref={picker}
                          type="file"
                          multiple
                          hidden
                          accept={TICKET_FILES.accept.join(',')}
                          onChange={(event) => {
                            const chosen = Array.from(event.target.files ?? [])
                            setReply((current) => [
                              ...current,
                              ...chosen.map((file) => ({
                                name: file.name,
                                sizeText: fileSize(file.size, format),
                              })),
                            ])
                            event.target.value = ''
                          }}
                        />
                        <Button
                          family="neutral"
                          emphasis="menu"
                          icon={Paperclip}
                          label="Attach"
                          onClick={() => picker.current?.click()}
                        />
                      </>
                    ),
                    ...(reply.length > 0
                      ? {
                          attachments: (
                            <AttachmentList
                              label="Files of the reply"
                              files={filesOf(reply)}
                              canRemove={() => true}
                              onRemove={(file) => {
                                setReply((current) =>
                                  current.filter(
                                    (each, index) => `${each.name}-${String(index)}` !== file.id,
                                  ),
                                )
                              }}
                            />
                          ),
                        }
                      : {}),
                  }),
            }}
          />
        </SectionCard>
      </PortalPage>
    </SupportPortal>
  )
}

// ── 5. The knowledge base ─────────────────────────────────────────────────────────────────────

function KbCategories({ place, phone }: { place: KbPlace; phone: boolean }) {
  return (
    <CategoryGrid
      label="Categories"
      layout={phone ? 'phone' : 'desktop'}
      categories={KB_CATEGORIES.map((category) => ({
        id: category.id,
        title: category.title,
        description: category.description,
        icon: category.icon,
        href: `#${place.category(category.id)}`,
        count: articleCount(articlesIn(category.id).length),
      }))}
    />
  )
}

/** Articles as rows: the title as a link, the summary, when it was updated. */
function ArticleRows({ place, articles }: { place: KbPlace; articles: readonly KbArticle[] }) {
  const { format, linkComponent: Link } = useLiro()
  return (
    <ul className="m-0 flex list-none flex-col p-0">
      {articles.map((article) => (
        <li
          key={article.slug}
          className="flex flex-col gap-0.5 border-0 border-t border-solid border-subtle px-4 py-3 first:border-t-0"
        >
          <Link
            href={`#${place.article(article.slug)}`}
            className={`bidi-content self-start rounded-sm py-0.5 text-sm font-medium ${LINK}`}
          >
            {article.title}
          </Link>
          <span className="bidi-content text-xs text-secondary">{article.summary}</span>
          <span className="bidi-content text-xs text-tertiary">
            {place.agent
              ? `Updated ${format.date(article.updated)} by ${AGENTS[article.author].name} · helpful to ${String(article.helpful.yes)} of ${String(article.helpful.answers)}`
              : `Updated ${format.date(article.updated)}`}
          </span>
        </li>
      ))}
    </ul>
  )
}

export function KbHome({ phone, place = PORTAL_KB }: { phone: boolean; place?: KbPlace }) {
  const popular = POPULAR.map(findArticle).filter(
    (article): article is KbArticle => article !== undefined,
  )
  return (
    <KbFrame place={place} phone={phone} crumbs={[{ label: 'Knowledge base' }]}>
      <PageHeader
        title="Knowledge base"
        subtitle={`${String(ARTICLES.length)} articles by Liro support · Illustrative help content`}
      />
      <KbSearchBox place={place} label="Search the knowledge base" />
      <KbCategories place={place} phone={phone} />
      <SectionCard title="Most read" headingLevel={2} flush>
        <ArticleRows place={place} articles={popular} />
      </SectionCard>
    </KbFrame>
  )
}

export function KbCategoryPage({
  phone,
  category,
  place = PORTAL_KB,
}: {
  phone: boolean
  category: string
  place?: KbPlace
}) {
  const found = findCategory(category)
  const articles = articlesIn(category)
  const title = found?.title ?? 'Category'
  return (
    <KbFrame
      place={place}
      phone={phone}
      crumbs={[{ label: 'Knowledge base', href: `#${place.home}` }, { label: title }]}
    >
      <PageHeader
        title={title}
        back={{ label: 'Knowledge base', href: `#${place.home}` }}
        subtitle={`${found?.description ?? ''} ${articleCount(articles.length)}.`}
      />
      <SectionCard flush>
        <ArticleRows place={place} articles={articles} />
      </SectionCard>
    </KbFrame>
  )
}

export function KbArticlePage({
  phone,
  slug,
  place = PORTAL_KB,
}: {
  phone: boolean
  slug: string
  place?: KbPlace
}) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const article = findArticle(slug)
  if (article === undefined) {
    return (
      <KbFrame place={place} phone={phone} crumbs={[{ label: 'Knowledge base' }]}>
        <EmptyState title="This article was moved or removed" />
      </KbFrame>
    )
  }
  const category = findCategory(article.category)
  const headings = richTextHeadings(article.body, 'article')
  const withContents = headings.length >= 4
  const related = article.related
    .map(findArticle)
    .filter((each): each is KbArticle => each !== undefined)
  const author = AGENTS[article.author]
  const contents = withContents ? (
    <PageContents entries={headings} layout={phone ? 'phone' : 'desktop'} sticky={!phone} />
  ) : null
  return (
    <KbFrame
      place={place}
      phone={phone}
      crumbs={[
        { label: 'Knowledge base', href: `#${place.home}` },
        { label: category?.title ?? '', href: `#${place.category(article.category)}` },
        { label: article.title },
      ]}
    >
      <div
        className={
          phone || !withContents
            ? 'flex flex-col gap-4'
            : 'grid grid-cols-[13rem_minmax(0,1fr)] items-start gap-8'
        }
      >
        {!phone && contents}
        <article className="flex min-w-0 flex-col gap-4">
          <PageHeader
            title={article.title}
            back={{
              label: category?.title ?? 'Knowledge base',
              href: `#${place.category(article.category)}`,
            }}
            subtitle={`${category?.title ?? ''} · Updated ${format.date(article.updated)} by ${author.name}`}
            {...(place.agent
              ? {
                  actions: (
                    <Button
                      family="neutral"
                      icon={Link2}
                      label="Copy link"
                      onClick={() => {
                        const link = `https://support.example.com/kb/${article.slug}`
                        void navigator.clipboard.writeText(link).then(
                          () => {
                            notice.success('Link copied')
                          },
                          () => {
                            notice.error('The link could not be copied')
                          },
                        )
                      }}
                    />
                  ),
                }
              : {})}
          />
          {phone && contents}
          <p className="bidi-content m-0 text-md text-secondary">{article.summary}</p>
          <RichText value={article.body} headingIds="article" className="max-w-[42rem] text-md" />
          <SectionCard headingLevel={2}>
            <HelpfulFeedback
              askWhy
              counts={`${format.number(String(article.helpful.yes))} of ${format.number(String(article.helpful.answers))} readers found this helpful`}
            />
          </SectionCard>
          {related.length > 0 && (
            <SectionCard title="Related articles" headingLevel={2} flush>
              <ArticleRows place={place} articles={related} />
            </SectionCard>
          )}
          {!place.agent && (
            <SectionCard title="Still need help?" headingLevel={2}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="bidi-content m-0 text-sm text-secondary">
                  Our support team answers within two working hours.
                </p>
                <Button
                  family="neutral"
                  icon={Send}
                  label="Submit a ticket"
                  onClick={() => {
                    navigate(T_ROUTES.newTicket)
                  }}
                />
              </div>
            </SectionCard>
          )}
        </article>
      </div>
    </KbFrame>
  )
}

export function KbSearchPage({
  phone,
  query: start,
  place = PORTAL_KB,
}: {
  phone: boolean
  /** The query the page opens with; else the one typed on the home page. */
  query?: string
  place?: KbPlace
}) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const [typed] = useExampleState(place.agent ? 't-agent-query' : 't-kb-query', () => '')
  const [query, setQuery] = useState(start ?? typed)
  const found = searchArticles(query)
  const results = found.map((article) =>
    searchResult(
      article,
      query,
      `#${place.article(article.slug)}`,
      `${findCategory(article.category)?.title ?? ''} · Updated ${format.date(article.updated)}`,
    ),
  )
  const asked = query.trim() !== ''
  return (
    <KbFrame
      place={place}
      phone={phone}
      crumbs={[{ label: 'Knowledge base', href: `#${place.home}` }, { label: 'Search' }]}
    >
      <PageHeader
        title="Search the knowledge base"
        back={{ label: 'Knowledge base', href: `#${place.home}` }}
      />
      <form
        role="search"
        onSubmit={(event) => {
          event.preventDefault()
        }}
      >
        <TextField
          type="search"
          label="Search words"
          description="The results follow as you type."
          value={query}
          onChange={setQuery}
        />
      </form>
      <SectionCard flush>
        {asked ? (
          <SearchResultList
            label="Articles found"
            results={results}
            count={results.length}
            summary={`${String(results.length)} ${results.length === 1 ? 'article' : 'articles'} for “${query.trim()}”`}
            empty={
              <EmptyState
                compact
                variant="no-results"
                className="py-8"
                title={`No articles for “${query.trim()}”`}
                description={
                  place.agent
                    ? 'Try other words, or write the article.'
                    : 'Try other words, or ask the support team.'
                }
                {...(place.agent
                  ? {}
                  : {
                      action: {
                        label: 'Submit a ticket',
                        onClick: () => {
                          navigate(T_ROUTES.newTicket)
                        },
                      },
                    })}
              />
            }
          />
        ) : (
          <EmptyState
            compact
            className="py-8"
            icon={Search}
            title="Type what you are looking for"
            description="For example: invoice rejected, two-factor, payroll export."
          />
        )}
      </SectionCard>
    </KbFrame>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_T_ROUTES: ExampleRoute[] = [
  { path: T_ROUTES.home, render: (phone) => <PortalHome phone={phone} /> },
  { path: T_ROUTES.newTicket, render: (phone) => <NewTicket phone={phone} /> },
  { path: T_ROUTES.newTicketDraft, render: (phone) => <NewTicket phone={phone} draft="sef" /> },
  { path: T_ROUTES.tickets, render: (phone) => <MyTickets phone={phone} /> },
  ...[...MILICA_TICKETS.map((ticket) => ticket.number), NEXT_TICKET].map((number) => ({
    path: T_ROUTES.ticket(number),
    render: (phone: boolean) => <TicketPage phone={phone} number={number} />,
  })),
  {
    path: T_ROUTES.rated,
    render: (phone) => <TicketPage phone={phone} number={RESOLVED_TICKET} rated />,
  },
  { path: T_ROUTES.kb, render: (phone) => <KbHome phone={phone} /> },
  ...KB_CATEGORIES.map((category) => ({
    path: T_ROUTES.kbCategory(category.id),
    render: (phone: boolean) => <KbCategoryPage phone={phone} category={category.id} />,
  })),
  ...ARTICLES.map((article) => ({
    path: T_ROUTES.kbArticle(article.slug),
    render: (phone: boolean) => <KbArticlePage phone={phone} slug={article.slug} />,
  })),
  { path: T_ROUTES.kbSearch, render: (phone) => <KbSearchPage phone={phone} /> },
  {
    path: T_ROUTES.kbSearchRejected,
    render: (phone) => <KbSearchPage phone={phone} query="rejected" />,
  },
  {
    path: T_ROUTES.kbSearchNothing,
    render: (phone) => <KbSearchPage phone={phone} query="fiscal printer" />,
  },
  // The agents' knowledge base: the same pages inside AppShell.
  { path: T_ROUTES.agentKb, render: (phone) => <KbHome phone={phone} place={AGENT_KB} /> },
  ...KB_CATEGORIES.map((category) => ({
    path: T_ROUTES.agentCategory(category.id),
    render: (phone: boolean) => (
      <KbCategoryPage phone={phone} category={category.id} place={AGENT_KB} />
    ),
  })),
  ...ARTICLES.map((article) => ({
    path: T_ROUTES.agentArticle(article.slug),
    render: (phone: boolean) => (
      <KbArticlePage phone={phone} slug={article.slug} place={AGENT_KB} />
    ),
  })),
  { path: AGENT_KB.search, render: (phone) => <KbSearchPage phone={phone} place={AGENT_KB} /> },
  {
    path: T_ROUTES.agentSearch,
    render: (phone) => <KbSearchPage phone={phone} query="two-factor" place={AGENT_KB} />,
  },
]
