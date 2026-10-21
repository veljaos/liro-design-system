import { ClipboardCheck, Gauge, ScanSearch } from 'lucide-react'
import { useContext, useMemo, useState } from 'react'
import {
  ActionGroup,
  AttachmentList,
  DataTable,
  DateText,
  DetailPage,
  DueDate,
  FilterBar,
  HierarchyChart,
  HistoryList,
  KeyValueList,
  ListPage,
  MaskedValue,
  notice,
  SidePanels,
  StatusBadge,
  useLiro,
  type ActionItem,
  type Attachment,
  type DataTableColumn,
  type DataTableFilters,
  type FilterDefinition,
  type MenuEntry,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate } from './example-shell'
import {
  AmlLink,
  AmlShell,
  kycBadge,
  pepBadge,
  riskBadge,
  useAmlClient,
  useAmlClients,
} from './aml-shared'
import {
  AML_CLIENTS,
  AML_DOCUMENT_TONES,
  AML_REVIEW_CYCLE,
  AML_ROUTES,
  amlList,
  riskInForce,
  ownershipNodes,
  type AmlClient,
  type AmlRisk,
} from './data-aml'

/*
 * Group BX's example screens (P5.83, know your customer): Knjigovodstvo Jelić's clients as the
 * compliance officer, Snežana Jelić, sees them on 14 October 2026, and one client's file.
 * - The clients (ListPage, FilterBar, DataTable): risk in force (an override said so), the next
 *   review with its state (DueDate), the file's state in words, PEP status and the last
 *   screening; views All / Review due / High risk / Needs documents, in the application's order.
 * - The client file (DetailPage): what needs attention (the review due, the documents missing or
 *   expired); the identification of the company and its representative — the national ID and
 *   the date of birth masked until a reason is given (MaskedValue, the access logged); the
 *   documents with their validity in the application's words (AttachmentList); the owners as a
 *   tree with their shares on the lines (HierarchyChart: an undisclosed owner is a vacant node)
 *   and the beneficial owners with their PEP status; PEP status; the source of funds and wealth;
 *   the review history (HistoryList). The side column sums up the risk and the screening, each
 *   with its page.
 * Every state, share, date and verdict is the application's (data-aml.ts); nothing new was
 * needed in the library.
 */

// ── The clients ───────────────────────────────────────────────────────────────────────────────

type ViewId = 'all' | 'review-due' | 'high' | 'documents'

const VIEWS: { id: ViewId; label: string }[] = [
  { id: 'all', label: 'All clients' },
  { id: 'review-due', label: 'Review due' },
  { id: 'high', label: 'High risk' },
  { id: 'documents', label: 'Needs documents' },
]

/** The views are the application's: its flags, not dates the screen compares. */
function inView(client: AmlClient, view: ViewId): boolean {
  if (view === 'review-due') return client.kyc === 'Review due'
  if (view === 'high') return riskInForce(client.assessment) === 'High'
  if (view === 'documents') return client.kyc === 'Documents expired' || client.kyc === 'Incomplete'
  return true
}

const RISKS: AmlRisk[] = ['High', 'Medium', 'Low']

const FILTERS: FilterDefinition[] = [
  {
    id: 'risk',
    label: 'Risk',
    type: 'multiSelect',
    options: RISKS.map((risk) => ({ value: risk, label: risk })),
  },
  {
    id: 'pep',
    label: 'PEP',
    type: 'select',
    options: [
      { value: 'pep', label: 'PEP or potential match' },
      { value: 'none', label: 'Not a PEP' },
    ],
  },
  {
    id: 'accountant',
    label: 'Accountant',
    type: 'select',
    options: [
      { value: 'Snežana Jelić', label: 'Snežana Jelić' },
      { value: 'Marko Jelić', label: 'Marko Jelić' },
    ],
  },
]

function matches(client: AmlClient, search: string, filters: DataTableFilters): boolean {
  const query = search.trim().toLocaleLowerCase('sr-Latn')
  if (
    query !== '' &&
    !client.name.toLocaleLowerCase('sr-Latn').includes(query) &&
    !client.taxId.includes(query.replace(/^pib\s*/, ''))
  ) {
    return false
  }
  const risks = filters.risk
  if (Array.isArray(risks) && risks.length > 0 && !risks.includes(riskInForce(client.assessment))) {
    return false
  }
  const pep = filters.pep
  if (pep === 'pep' && client.pep.status === 'Not a PEP') return false
  if (pep === 'none' && client.pep.status !== 'Not a PEP') return false
  const accountant = filters.accountant
  if (typeof accountant === 'string' && accountant !== '' && client.accountant !== accountant) {
    return false
  }
  return true
}

/** The risk in force, and who set it when it is not the assessment's. */
export function RiskCell({ client }: { client: AmlClient }) {
  const override = client.assessment.override
  return (
    <span className="flex flex-col items-start gap-1">
      {riskBadge(riskInForce(client.assessment))}
      {override !== undefined && (
        <span className="bidi-content text-xs text-secondary">{`Set by ${override.by}`}</span>
      )}
    </span>
  )
}

function useClientColumns(): DataTableColumn<AmlClient>[] {
  const { format } = useLiro()
  return [
    {
      id: 'client',
      header: 'Client',
      minWidth: 220,
      cell: (client) => (
        <span className="flex flex-col gap-0.5">
          <span className="bidi-content font-medium">{client.name}</span>
          <span className="bidi-content text-xs text-secondary tabular-nums">{`PIB ${client.taxId}`}</span>
        </span>
      ),
    },
    { id: 'risk', header: 'Risk', cell: (client) => <RiskCell client={client} /> },
    {
      id: 'review',
      header: 'Next review',
      minWidth: 180,
      cell: (client) => (
        <span className="flex flex-col gap-0.5">
          <DueDate value={client.assessment.nextReview} warningDays={30} />
          <span className="bidi-content text-xs text-secondary">
            {AML_REVIEW_CYCLE[riskInForce(client.assessment)]}
          </span>
        </span>
      ),
    },
    {
      id: 'kyc',
      header: 'Client file',
      minWidth: 200,
      cell: (client) => (
        <span className="flex flex-col items-start gap-1">
          {kycBadge(client.kyc)}
          {client.kycNote !== undefined && (
            <span className="bidi-content text-xs text-secondary">{client.kycNote}</span>
          )}
        </span>
      ),
    },
    {
      id: 'pep',
      header: 'PEP',
      cell: (client) =>
        client.pep.status === 'Not a PEP' ? (
          <span className="bidi-content text-secondary">Not a PEP</span>
        ) : (
          pepBadge(client.pep.status)
        ),
    },
    {
      id: 'screening',
      header: 'Last screening',
      minWidth: 180,
      cell: (client) => (
        <span className="flex flex-col gap-0.5">
          <span className="bidi-content tabular-nums">
            {format.dateTime(client.screening.lastRun)}
          </span>
          <span
            className={
              client.screening.open > 0
                ? 'bidi-content text-xs font-medium text-status-warning-fg'
                : 'bidi-content text-xs text-secondary'
            }
          >
            {client.screening.note}
          </span>
        </span>
      ),
    },
    { id: 'accountant', header: 'Accountant', cell: (client) => client.accountant },
  ]
}

export function AmlClients({ phone, view: startView }: { phone: boolean; view: ViewId }) {
  const navigate = useContext(Navigate)
  const columns = useClientColumns()
  const [view, setView] = useState<ViewId>(startView)
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<DataTableFilters>({})
  const { clients } = useAmlClients()
  // The application's order (high risk and what is due first); the list never re-sorts it.
  const rows = useMemo(
    () => clients.filter((client) => inView(client, view) && matches(client, search, filters)),
    [clients, view, search, filters],
  )
  const actions = (client: AmlClient): MenuEntry[] => [
    {
      label: 'Risk assessment',
      icon: Gauge,
      onSelect: () => {
        navigate(AML_ROUTES.risk(client.id))
      },
    },
    {
      label: 'Screening',
      icon: ScanSearch,
      onSelect: () => {
        navigate(AML_ROUTES.clientScreening(client.id))
      },
    },
  ]
  return (
    <AmlShell phone={phone} tab="clients" crumbs={[{ label: 'Clients' }]}>
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Clients"
        views={VIEWS.map((each) => ({
          ...each,
          count: clients.filter((client) => inView(client, each.id)).length,
        }))}
        view={view}
        onViewChange={(id) => {
          setView(id as ViewId)
        }}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={FILTERS}
            inline={3}
            values={filters}
            onValuesChange={setFilters}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Name or tax number"
          />
        }
      >
        <DataTable
          label="Clients"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={columns}
          rows={rows}
          getRowId={(client) => client.id}
          getRowLabel={(client) => client.name}
          filters={{ ...filters, search }}
          onFiltersChange={() => {
            setFilters({})
            setSearch('')
          }}
          count={rows.length}
          onRowClick={(client) => {
            navigate(AML_ROUTES.client(client.id))
          }}
          rowActions={actions}
          rowLimitMessage="High risk first, then the reviews and documents due."
          mobile={{
            title: (client) => client.name,
            subtitle: (client) => (
              <span className="bidi-isolate">
                Next review <DueDate value={client.assessment.nextReview} warningDays={30} />
              </span>
            ),
            badge: (client) => riskBadge(riskInForce(client.assessment)),
            details: ['kyc', 'screening'],
          }}
        />
      </ListPage>
    </AmlShell>
  )
}

// ── The client file ───────────────────────────────────────────────────────────────────────────

/** The reasons the application accepts for showing a national ID or a date of birth. */
const REVEAL_REASONS = [
  { value: 'identity', label: 'Checking the client’s identity' },
  { value: 'review', label: 'Periodic review of the client file' },
  { value: 'authority', label: 'Request from the authority' },
]

const LOG_NOTE = 'Your name, the reason and the time are kept in the client’s history.'

function documentFiles(client: AmlClient): Attachment[] {
  return client.documents.map((each) => ({
    id: each.id,
    name: each.file,
    sizeText: each.sizeText,
    state: 'available',
    ...(each.state === 'Valid'
      ? {}
      : { flag: { label: each.state, tone: AML_DOCUMENT_TONES[each.state] } }),
    detail: (
      <span className="bidi-content">
        {each.title} ·{' '}
        {each.validUntil === null ? (
          <>
            issued <DateText value={each.issued} />
          </>
        ) : (
          <>
            valid until <DateText value={each.validUntil} />
          </>
        )}
      </span>
    ),
  }))
}

interface FileStart {
  /** The national ID's reason dialog is open (a page restored as it was left). */
  reveal?: boolean
}

export function AmlClientFile({
  phone,
  clientId,
  start = {},
}: {
  phone: boolean
  clientId: string
  start?: FileStart
}) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const [client] = useAmlClient(clientId)
  const risk = riskInForce(client.assessment)
  const [nationalId, setNationalId] = useState(false)
  const [birth, setBirth] = useState(false)
  const [panels, setPanels] = useState<string[]>(['risk', 'screening'])
  const person = client.representative
  const beneficial = client.owners.filter((owner) => owner.beneficial !== undefined)
  const subject = `${person.name}, ${client.name}`

  const actions: ActionItem[] = [
    {
      key: 'screening',
      label: 'Screening',
      family: 'neutral',
      icon: ScanSearch,
      onClick: () => {
        navigate(AML_ROUTES.clientScreening(client.id))
      },
    },
    {
      key: 'risk',
      label: 'Risk assessment',
      family: 'neutral',
      icon: Gauge,
      onClick: () => {
        navigate(AML_ROUTES.risk(client.id))
      },
    },
    {
      key: 'review',
      label: 'Start review',
      family: 'primary',
      icon: ClipboardCheck,
      emphasis: 'primary',
      onClick: () => {
        navigate(AML_ROUTES.review(client.id))
      },
    },
  ]

  const attention =
    client.kyc === 'Complete'
      ? []
      : [
          {
            id: 'attention',
            label: 'Needs attention',
            content: (
              <div className="flex flex-col gap-2">
                {client.kycNote !== undefined && (
                  <p className="bidi-content m-0 text-sm text-primary">{client.kycNote}</p>
                )}
                {client.missing !== undefined && client.missing.length > 0 && (
                  <>
                    <p className="bidi-content m-0 text-sm text-secondary">Missing:</p>
                    <ul className="m-0 flex flex-col gap-1 ps-5 text-sm text-primary">
                      {client.missing.map((item) => (
                        <li key={item} className="bidi-content">
                          {item}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            ),
          },
        ]

  const side = (
    <SidePanels
      open={panels}
      onOpenChange={setPanels}
      panels={[
        {
          key: 'risk',
          title: 'Risk',
          content: (
            <div className="flex flex-col gap-3">
              <KeyValueList
                columns={1}
                items={[
                  { key: 'risk', label: 'In force', value: riskBadge(risk) },
                  {
                    key: 'score',
                    label: 'Score',
                    value: `${client.assessment.score} of ${client.assessment.scale}`,
                    numeric: true,
                  },
                  {
                    key: 'assessed',
                    label: 'Assessed',
                    value: <DateText value={client.assessment.on} />,
                    numeric: true,
                  },
                ]}
              />
              <AmlLink href={AML_ROUTES.risk(client.id)}>Open the assessment</AmlLink>
            </div>
          ),
        },
        {
          key: 'screening',
          title: 'Screening',
          ...(client.screening.open > 0 ? { count: client.screening.open } : {}),
          content: (
            <div className="flex flex-col gap-3">
              <KeyValueList
                columns={1}
                items={[
                  {
                    key: 'last',
                    label: 'Last run',
                    value: (
                      <span className="bidi-content tabular-nums">
                        {format.dateTime(client.screening.lastRun)}
                      </span>
                    ),
                  },
                  { key: 'result', label: 'Result', value: client.screening.note },
                ]}
              />
              <AmlLink href={AML_ROUTES.clientScreening(client.id)}>Open the results</AmlLink>
            </div>
          ),
        },
      ]}
    />
  )

  return (
    <AmlShell
      phone={phone}
      tab="clients"
      crumbs={[{ label: 'Clients', href: `#${AML_ROUTES.clients}` }, { label: client.name }]}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={client.name}
        back={{ href: `#${AML_ROUTES.clients}`, label: 'Clients' }}
        status={kycBadge(client.kyc)}
        subtitle={
          <span className="bidi-content">
            {`PIB ${client.taxId} · client since `}
            <DateText value={client.clientSince} />
          </span>
        }
        actions={<ActionGroup actions={actions} />}
        keyFigures={[
          { key: 'risk', label: 'Risk', value: riskBadge(risk) },
          {
            key: 'review',
            label: 'Next review',
            value: <DueDate value={client.assessment.nextReview} warningDays={30} />,
          },
          {
            key: 'pep',
            label: 'PEP status',
            value: <span className="bidi-content">{client.pep.status}</span>,
          },
          {
            key: 'owners',
            label: 'Beneficial owners',
            value: <span className="bidi-isolate">{format.number(String(beneficial.length))}</span>,
          },
        ]}
        side={side}
        sections={[
          ...attention,
          {
            id: 'identification',
            label: 'Identification',
            content: (
              <KeyValueList
                columns={phone ? 1 : 2}
                groups={[
                  {
                    key: 'company',
                    title: 'Company',
                    items: [
                      { key: 'name', label: 'Name', value: client.name },
                      { key: 'form', label: 'Legal form', value: client.legalForm },
                      {
                        key: 'pib',
                        label: 'Tax number (PIB)',
                        value: <bdi>{client.taxId}</bdi>,
                        numeric: true,
                      },
                      {
                        key: 'mb',
                        label: 'Registration number',
                        value: <bdi>{client.registration}</bdi>,
                        numeric: true,
                      },
                      { key: 'activity', label: 'Activity', value: client.activity },
                      { key: 'accountant', label: 'Accountant', value: client.accountant },
                      { key: 'address', label: 'Address', value: client.address, fullWidth: true },
                    ],
                  },
                  {
                    key: 'representative',
                    title: 'Representative',
                    items: [
                      { key: 'person', label: person.role, value: person.name },
                      { key: 'citizenship', label: 'Citizenship', value: person.citizenship },
                      { key: 'document', label: 'Identity document', value: person.idDocument },
                      {
                        key: 'national-id',
                        label: 'National ID number',
                        value: (
                          <MaskedValue
                            label="National ID number"
                            sentenceLabel="national ID number"
                            subject={subject}
                            reasons={REVEAL_REASONS}
                            allowOther
                            logNote={LOG_NOTE}
                            defaultAsking={start.reveal === true}
                            {...(nationalId ? { value: <bdi>{person.nationalId}</bdi> } : {})}
                            onReveal={() => {
                              setNationalId(true)
                            }}
                            onHide={() => {
                              setNationalId(false)
                            }}
                          />
                        ),
                      },
                      {
                        key: 'birth',
                        label: 'Date of birth',
                        value: (
                          <MaskedValue
                            label="Date of birth"
                            sentenceLabel="date of birth"
                            subject={subject}
                            reasons={REVEAL_REASONS}
                            allowOther
                            logNote={LOG_NOTE}
                            {...(birth ? { value: <DateText value={person.dateOfBirth} /> } : {})}
                            onReveal={() => {
                              setBirth(true)
                            }}
                            onHide={() => {
                              setBirth(false)
                            }}
                          />
                        ),
                      },
                      {
                        key: 'identified',
                        label: 'Identified',
                        value: person.identified,
                        fullWidth: true,
                      },
                    ],
                  },
                ]}
              />
            ),
          },
          {
            id: 'documents',
            label: 'Documents',
            flush: true,
            content: (
              <AttachmentList
                label={`Documents of ${client.name}`}
                inCard
                files={documentFiles(client)}
                onDownload={(file) => {
                  notice.info(`${file.name} is downloading.`)
                }}
              />
            ),
          },
          {
            id: 'owners',
            label: 'Owners',
            description: client.ownersNote,
            content: (
              <div className="flex flex-col gap-4">
                <HierarchyChart
                  label={`Ownership of ${client.name}`}
                  nodes={ownershipNodes(client)}
                  defaultExpandedDepth={4}
                  search={false}
                  framed={false}
                  maxHeight="none"
                  vacantLabel="Unknown owner"
                  layout={phone ? 'phone' : 'desktop'}
                />
                <DataTable
                  label={`Beneficial owners of ${client.name}`}
                  layout={phone ? 'cards' : 'table'}
                  columns={BENEFICIAL_COLUMNS}
                  rows={beneficial}
                  getRowId={(owner) => owner.id}
                  getRowLabel={(owner) => owner.name}
                  mobile={{
                    title: (owner) => owner.name,
                    badge: (owner) => (owner.pep === undefined ? null : pepBadge(owner.pep)),
                    details: ['share', 'country'],
                  }}
                />
              </div>
            ),
          },
          {
            id: 'pep',
            label: 'Politically exposed persons',
            content: (
              <KeyValueList
                columns={1}
                items={[
                  { key: 'status', label: 'PEP status', value: pepBadge(client.pep.status) },
                  { key: 'note', label: 'Finding', value: client.pep.note },
                  {
                    key: 'checked',
                    label: 'Last checked',
                    value: (
                      <span className="bidi-content">
                        {`${format.dateTime(client.screening.lastRun)}, ${amlList('pep').name}`}
                      </span>
                    ),
                  },
                ]}
              />
            ),
          },
          {
            id: 'funds',
            label: 'Source of funds',
            content: (
              <KeyValueList
                columns={1}
                items={[
                  { key: 'funds', label: 'Source of funds', value: client.sourceOfFunds },
                  { key: 'wealth', label: 'Source of wealth', value: client.sourceOfWealth },
                  { key: 'purpose', label: 'Purpose of the relationship', value: client.purpose },
                  { key: 'activity', label: 'Expected activity', value: client.expectedActivity },
                ]}
              />
            ),
          },
          {
            id: 'history',
            label: 'Review history',
            content: (
              <HistoryList label={`Review history of ${client.name}`} entries={client.history} />
            ),
          },
        ]}
      />
    </AmlShell>
  )
}

const BENEFICIAL_COLUMNS: DataTableColumn<AmlClient['owners'][number]>[] = [
  {
    id: 'name',
    header: 'Beneficial owner',
    minWidth: 180,
    cell: (owner) => <span className="bidi-content font-medium">{owner.name}</span>,
  },
  {
    id: 'share',
    header: 'Ownership',
    cell: (owner) => <span className="bidi-content">{owner.beneficial}</span>,
  },
  { id: 'country', header: 'Country', cell: (owner) => owner.country ?? '—' },
  {
    id: 'pep',
    header: 'PEP status',
    cell: (owner) =>
      owner.pep === undefined ? (
        <StatusBadge label="Not checked" tone="neutral" />
      ) : (
        pepBadge(owner.pep)
      ),
  },
]

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BX_ROUTES: ExampleRoute[] = [
  { path: AML_ROUTES.clients, render: (phone) => <AmlClients phone={phone} view="all" /> },
  {
    path: AML_ROUTES.clientsReviewDue,
    render: (phone) => <AmlClients phone={phone} view="review-due" />,
  },
  ...AML_CLIENTS.map((client) => ({
    path: AML_ROUTES.client(client.id),
    render: (phone: boolean) => <AmlClientFile phone={phone} clientId={client.id} />,
  })),
  {
    path: AML_ROUTES.clientReveal,
    render: (phone) => <AmlClientFile phone={phone} clientId="kvadrat" start={{ reveal: true }} />,
  },
]
