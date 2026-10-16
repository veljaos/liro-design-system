import { BellOff, FileText } from 'lucide-react'
import { useContext, useState } from 'react'
import {
  Alert,
  Button,
  DataTable,
  DateRangeText,
  DateText,
  DetailPage,
  KeyValueList,
  ListPage,
  MoneyText,
  notice,
  RelatedDocuments,
  StatusBadge,
  toneFor,
  useLiro,
  VersionList,
  type DataTableColumn,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate } from './example-shell'
import { IN_TEXT_LINK, RecordsShell } from './screens-BE'
import {
  BI_ROUTES,
  CONTRACT_TONES,
  CONTRACT_VIEWS,
  CONTRACTS,
  contractByNumber,
  inContractView,
  UGO_027_MEETING,
  UGO_044,
  UGO_044_LINKED,
  UGO_044_VERSIONS,
  type Contract,
  type ContractState,
  type ContractView,
} from './data-BI'
import { BE_ROUTES } from './data-BE'

/*
 * Group BI's example screens (P5.71, contracts): Kvadrat Gradnja d.o.o. on 14 October 2026.
 * - The register (ListPage): number and subject, partner, kind, value ("—" for a framework
 *   contract), term, how it renews, the application's reminder in words and the state (Active,
 *   Notice due, Expiring, Expired, Ended, Draft); views In force, Need attention, Ended and expired,
 *   All.
 * - A contract (DetailPage): the reminder first ("Give notice by 16.10.2026 or it renews on
 *   01.11.2026") with its two ways — prepare the notice (a letter of group BE) or let it renew —
 *   as neutral secondary buttons on the warning (D23); the contract's facts; its versions
 *   (VersionList: the signed contract and two annexes; a signed version is never restored); the
 *   linked documents (RelatedDocuments: the order, the receipt and the invoice of groups AU and U).
 */

export { BI_ROUTES }

export function contractBadge(state: ContractState) {
  return <StatusBadge label={state} tone={toneFor(state, CONTRACT_TONES)} />
}

function Term({ contract }: { contract: Contract }) {
  return contract.end === null ? (
    <span className="bidi-isolate">
      From <DateText value={contract.start} />, indefinite
    </span>
  ) : (
    <DateRangeText from={contract.start} to={contract.end} />
  )
}

const COLUMNS: DataTableColumn<Contract>[] = [
  {
    id: 'contract',
    header: 'Contract',
    minWidth: 240,
    cell: (contract) => (
      <span className="flex flex-col gap-0.5">
        <span className="bidi-content font-medium">{contract.subject}</span>
        <span className="bidi-content text-xs text-secondary">
          <bdi dir="ltr">{contract.number}</bdi>
          {` · ${contract.kind}`}
        </span>
      </span>
    ),
  },
  {
    id: 'partner',
    header: 'Partner',
    minWidth: 160,
    cell: (contract) => <span className="bidi-content">{contract.partner}</span>,
  },
  {
    id: 'value',
    header: 'Value',
    numeric: true,
    cell: (contract) => <MoneyText value={contract.value} currency="RSD" />,
  },
  { id: 'term', header: 'Term', cell: (contract) => <Term contract={contract} /> },
  {
    id: 'reminder',
    header: 'Renewal and reminder',
    minWidth: 240,
    cell: (contract) => (
      <span className="flex flex-col gap-0.5">
        <span className="bidi-content">{contract.reminder ?? contract.renewal}</span>
        {contract.reminder === null ? null : (
          <span className="bidi-content text-xs text-secondary">{contract.renewal}</span>
        )}
      </span>
    ),
  },
  { id: 'state', header: 'State', cell: (contract) => contractBadge(contract.state) },
]

function ContractList({ phone, view: startView }: { phone: boolean; view: ContractView }) {
  const navigate = useContext(Navigate)
  const [view, setView] = useState<ContractView>(startView)
  const rows = CONTRACTS.filter((contract) => inContractView(contract, view))
  return (
    <RecordsShell phone={phone} tab="contracts" crumbs={[{ label: 'Contracts' }]}>
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Contracts"
        titleHidden={false}
        actions={<Button intent="create" emphasis="primary" label="New contract" />}
        views={CONTRACT_VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: CONTRACTS.filter((contract) => inContractView(contract, each.id)).length,
        }))}
        view={view}
        onViewChange={(id) => {
          setView(id as ContractView)
        }}
      >
        <DataTable
          label="Contracts"
          inCard
          layout={phone ? 'cards' : 'table'}
          columns={COLUMNS}
          rows={rows}
          getRowId={(contract) => contract.number}
          getRowLabel={(contract) => `${contract.number} ${contract.subject}`}
          count={rows.length}
          onRowClick={(contract) => {
            if (contract.number === 'UGO-2025-044') navigate(BI_ROUTES.contract)
          }}
          mobile={{
            title: (contract) => contract.subject,
            subtitle: (contract) => (
              <span className="bidi-content">{`${contract.partner} · ${contract.number}`}</span>
            ),
            badge: (contract) => contractBadge(contract.state),
            details: ['term', 'reminder'],
          }}
        />
      </ListPage>
    </RecordsShell>
  )
}

// ── One contract ──────────────────────────────────────────────────────────────────────────────

function ContractPage({ phone, renewed: startRenewed }: { phone: boolean; renewed: boolean }) {
  const navigate = useContext(Navigate)
  const { format, linkComponent: Link } = useLiro()
  const contract = contractByNumber('UGO-2025-044')
  const [renewed, setRenewed] = useState(startRenewed)
  if (contract === undefined) return null
  return (
    <RecordsShell
      phone={phone}
      tab="contracts"
      crumbs={[{ label: 'Contracts', href: `#${BI_ROUTES.list}` }, { label: contract.number }]}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={contract.number}
        back={{ href: `#${BI_ROUTES.list}`, label: 'Contracts' }}
        status={contractBadge(renewed ? 'Renews' : contract.state)}
        subtitle={
          <span className="bidi-content">{`${contract.subject} · ${contract.partner}`}</span>
        }
        actions={
          <>
            <Button intent="pdf" emphasis="secondary" label="Download contract" />
            <Button intent="edit" emphasis="secondary" label="Edit" />
          </>
        }
        keyFigures={[
          { key: 'term', label: 'Term', value: <Term contract={contract} /> },
          {
            key: 'ordered',
            label: 'Ordered in 2026',
            value: <MoneyText value={UGO_044.ordered} currency="RSD" />,
          },
          { key: 'owner', label: 'Owner', value: contract.owner },
        ]}
        sections={[
          {
            id: 'renewal',
            label: 'Renewal',
            content: (
              <div className="flex flex-col gap-4">
                {renewed ? (
                  <Alert tone="info" title={`Renews on ${format.date(UGO_044.renewsOn)}`}>
                    {`Until ${format.date(UGO_044.renewedUntil)}, on the same terms; the reminder is set for the next notice period.`}
                  </Alert>
                ) : (
                  <Alert
                    tone="warning"
                    title={contract.reminder ?? ''}
                    actions={
                      <>
                        <Button
                          family="neutral"
                          icon={FileText}
                          emphasis="secondary"
                          label="Prepare notice"
                          onClick={() => {
                            navigate(BE_ROUTES.draft('letter'))
                          }}
                        />
                        <Button
                          family="neutral"
                          icon={BellOff}
                          emphasis="secondary"
                          label="Let it renew"
                          onClick={() => {
                            setRenewed(true)
                            notice.success(
                              `${contract.number} renews on ${format.date(UGO_044.renewsOn)}.`,
                            )
                          }}
                        />
                      </>
                    }
                  >
                    {`${format.number('2')} days left. Notice is a registered letter to Beton Mix d.o.o.; the registry book gives its number.`}
                  </Alert>
                )}
                <KeyValueList
                  items={[
                    { label: 'Renewal', value: contract.renewal },
                    { label: 'Notice by', value: <DateText value={UGO_044.notice} /> },
                    { label: 'Ends', value: <DateText value={contract.end} /> },
                    {
                      label: 'Renews until',
                      value: <DateText value={UGO_044.renewedUntil} />,
                    },
                  ]}
                />
              </div>
            ),
          },
          {
            id: 'contract',
            label: 'Contract',
            content: (
              <KeyValueList
                items={[
                  { label: 'Partner', value: contract.partner },
                  { label: 'Kind', value: contract.kind },
                  {
                    label: 'Value',
                    value: 'Framework: by orders, at the agreed prices',
                  },
                  { label: 'Prices', value: UGO_044.prices },
                  { label: 'Orders', value: UGO_044.orders },
                  { label: 'Owner', value: contract.owner },
                ]}
              />
            ),
          },
          {
            id: 'versions',
            label: 'Versions',
            content: (
              <VersionList
                versions={UGO_044_VERSIONS}
                onDownload={() => undefined}
                onRestore={() => undefined}
                restoreUnavailable="A signed version is never restored: a change is a new annex."
                onUpload={() => {
                  notice.success('Annex 3 uploaded as the current version.')
                }}
              />
            ),
          },
          {
            id: 'linked',
            label: 'Linked documents',
            content: (
              <div className="flex flex-col gap-3">
                <RelatedDocuments label="Linked documents" items={UGO_044_LINKED} />
                <p className="bidi-content m-0 text-sm text-secondary">
                  The facade contract for the same site waits for the{' '}
                  <Link href={`#${UGO_027_MEETING}`} className={IN_TEXT_LINK}>
                    supervisory board
                  </Link>
                  .
                </p>
              </div>
            ),
          },
        ]}
      />
    </RecordsShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BI_ROUTES: ExampleRoute[] = [
  { path: BI_ROUTES.list, render: (phone) => <ContractList phone={phone} view="active" /> },
  {
    path: BI_ROUTES.attention,
    render: (phone) => <ContractList phone={phone} view="attention" />,
  },
  { path: BI_ROUTES.contract, render: (phone) => <ContractPage phone={phone} renewed={false} /> },
  { path: BI_ROUTES.renewed, render: (phone) => <ContractPage phone={phone} renewed /> },
]
