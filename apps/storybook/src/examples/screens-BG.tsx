import { FileX2 } from 'lucide-react'
import { useContext, useState } from 'react'
import {
  Alert,
  Button,
  DataTable,
  DateText,
  DocumentPage,
  IrreversibleConfirmDialog,
  KeyValueList,
  ListPage,
  notice,
  RegisterPage,
  RelatedDocuments,
  SignerList,
  StatusBadge,
  toneFor,
  useLiro,
  type DataTableColumn,
  type LifecycleStep,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate } from './example-shell'
import { IN_TEXT_LINK, RecordsShell, Words } from './screens-BE'
import {
  ARCHIVE,
  ARCHIVE_COUNT,
  ARCHIVE_TONES,
  BG_ROUTES,
  CHOSEN,
  COMMISSION,
  DISPOSAL,
  DISPOSAL_MINUTES_ROUTE,
  DISPOSAL_STEPS,
  EXPIRING,
  RETENTION,
  type ArchiveState,
  type ArchiveUnit,
  type RetentionPeriod,
} from './data-BG'

/*
 * Group BG's example screens (P5.69, the archive book and retention): Kvadrat Gradnja d.o.o. on
 * 14 October 2026.
 * - The archive book (RegisterPage): a unit per entry — years, content with its classification,
 *   how much, paper or electronic, the retention in words, the day it may be disposed of (the
 *   application's date; "Permanently" for what is kept for ever), where it is, the state. The
 *   oldest entries are locked (certified by the archive).
 * - Retention periods (ListPage): the classification plan's categories, each with its retention,
 *   from when it runs and its legal basis — the application's data.
 * - What expires (ListPage): units whose retention ended or ends this year; units are chosen and
 *   "Propose for disposal" makes a disposal list (BulkActionBar).
 * - Disposal list LB-2026-01 (DocumentPage): Proposed → Commission signed → Archive consented →
 *   Disposed; the units, the commission's signatures (SignerList), the archive's consent; "Dispose"
 *   asks first (IrreversibleConfirmDialog: the list's number typed) and the minutes are a document
 *   of group BE, numbered from the registry book.
 */

export { BG_ROUTES }

export function archiveBadge(state: ArchiveState) {
  return <StatusBadge label={state} tone={toneFor(state, ARCHIVE_TONES)} />
}

function KeptUntil({ unit }: { unit: ArchiveUnit }) {
  return unit.keptUntil === null ? 'Permanently' : <DateText value={unit.keptUntil} />
}

function ContentCell({ unit }: { unit: ArchiveUnit }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="bidi-content">{unit.content}</span>
      {/* Codes and years: written left to right, on the page's start side. */}
      <span dir="ltr" className="bidi-content text-xs text-secondary">
        {`${unit.classification} · ${unit.years}${unit.note === undefined ? '' : ` · ${unit.note}`}`}
      </span>
    </span>
  )
}

const BOOK_COLUMNS: DataTableColumn<ArchiveUnit>[] = [
  {
    id: 'entered',
    header: 'Entered',
    numeric: true,
    cell: (unit) => <DateText value={unit.entered} />,
  },
  { id: 'content', header: 'Content', minWidth: 260, cell: (unit) => <ContentCell unit={unit} /> },
  { id: 'quantity', header: 'Quantity', cell: (unit) => <Words>{unit.quantity}</Words> },
  { id: 'medium', header: 'Medium', cell: (unit) => unit.medium },
  { id: 'retention', header: 'Retention', cell: (unit) => <Words>{unit.retention}</Words> },
  { id: 'keptUntil', header: 'Kept until', cell: (unit) => <KeptUntil unit={unit} /> },
  {
    id: 'location',
    header: 'Location',
    minWidth: 160,
    cell: (unit) => <Words>{unit.location}</Words>,
  },
  { id: 'state', header: 'State', cell: (unit) => archiveBadge(unit.state) },
]

function ArchiveBook({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const toExpiring = (
    <Button
      intent="view"
      emphasis="secondary"
      label="What expires"
      onClick={() => {
        navigate(BG_ROUTES.expiring)
      }}
    />
  )
  return (
    <RecordsShell phone={phone} tab="archive" crumbs={[{ label: 'Archive book' }]}>
      <RegisterPage
        layout={phone ? 'phone' : 'desktop'}
        title="Archive book"
        subtitle={`Kvadrat Gradnja d.o.o. · ${format.number(String(ARCHIVE_COUNT))} units since 2016; what is disposed of stays in the book.`}
        actions={
          <>
            <Button
              intent="view"
              emphasis="secondary"
              label="Retention periods"
              onClick={() => {
                navigate(BG_ROUTES.retention)
              }}
            />
            <Button intent="print" emphasis="secondary" label="Print" />
            {toExpiring}
          </>
        }
        locks={[
          {
            key: 'certified',
            period: 'Entries 1–42 (2010–2015)',
            reason: 'Certified by the Historical Archive of Novi Sad (illustrative) on 12.03.2016.',
            detail: 'Locked by Ana Marić.',
          },
        ]}
        columns={BOOK_COLUMNS}
        rows={ARCHIVE}
        getRowId={(unit) => unit.number}
        getRowLabel={(unit) => `No. ${unit.number}, ${unit.content}`}
        entry={(unit) => ({
          number: unit.number,
          ...(unit.locked === true ? { locked: true } : {}),
        })}
        rowActions={() => [{ label: 'Correct entry', onSelect: () => undefined }]}
        count={ARCHIVE.length}
        mobile={{
          title: (unit) => unit.content,
          subtitle: (unit) => <bdi dir="ltr">{`${unit.classification} · ${unit.years}`}</bdi>,
          badge: (unit) => archiveBadge(unit.state),
          details: ['quantity', 'retention', 'keptUntil', 'location'],
        }}
      />
    </RecordsShell>
  )
}

// ── Retention periods ─────────────────────────────────────────────────────────────────────────

const RETENTION_COLUMNS: DataTableColumn<RetentionPeriod>[] = [
  {
    id: 'code',
    header: 'Code',
    cell: (row) => <bdi dir="ltr">{row.code}</bdi>,
  },
  {
    id: 'category',
    header: 'Category of documents',
    minWidth: 280,
    cell: (row) => <span className="bidi-content">{row.category}</span>,
  },
  { id: 'retention', header: 'Retention', cell: (row) => <Words>{row.retention}</Words> },
  { id: 'from', header: 'Runs from', minWidth: 200, cell: (row) => <Words>{row.from}</Words> },
  { id: 'basis', header: 'Basis', minWidth: 200, cell: (row) => <Words>{row.basis}</Words> },
]

type RetentionView = 'all' | 'permanent' | 'limited'

function RetentionPeriods({ phone }: { phone: boolean }) {
  const [view, setView] = useState<RetentionView>('all')
  const rows = RETENTION.filter((row) =>
    view === 'all' ? true : (row.retention === 'Permanently') === (view === 'permanent'),
  )
  return (
    <RecordsShell
      phone={phone}
      tab="archive"
      crumbs={[{ label: 'Archive book', href: `#${BG_ROUTES.book}` }, { label: 'Retention' }]}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Retention periods"
        titleHidden={false}
        actions={<Button intent="edit" emphasis="secondary" label="Change the plan" />}
        views={[
          { id: 'all', label: 'All categories', count: RETENTION.length },
          {
            id: 'permanent',
            label: 'Kept permanently',
            count: RETENTION.filter((row) => row.retention === 'Permanently').length,
          },
          {
            id: 'limited',
            label: 'With a period',
            count: RETENTION.filter((row) => row.retention !== 'Permanently').length,
          },
        ]}
        view={view}
        onViewChange={(id) => {
          setView(id as RetentionView)
        }}
      >
        <div className="bidi-content px-4 pt-3 text-sm text-secondary">
          The classification plan with the list of categories and their retention, adopted on
          01.03.2024 with the archive’s consent (illustrative). The periods are the plan’s; the
          application gives each unit its day.
        </div>
        <DataTable
          label="Retention periods"
          inCard
          layout={phone ? 'cards' : 'table'}
          columns={RETENTION_COLUMNS}
          rows={rows}
          getRowId={(row) => row.code}
          getRowLabel={(row) => `${row.code} ${row.category}`}
          count={rows.length}
          mobile={{
            title: (row) => row.category,
            subtitle: (row) => <bdi dir="ltr">{row.code}</bdi>,
            details: ['retention', 'from', 'basis'],
          }}
        />
      </ListPage>
    </RecordsShell>
  )
}

// ── What expires ──────────────────────────────────────────────────────────────────────────────

const EXPIRING_COLUMNS: DataTableColumn<ArchiveUnit>[] = [
  {
    id: 'number',
    header: 'No.',
    numeric: true,
    cell: (unit) => <bdi>{unit.number}</bdi>,
  },
  { id: 'content', header: 'Content', minWidth: 260, cell: (unit) => <ContentCell unit={unit} /> },
  { id: 'quantity', header: 'Quantity', cell: (unit) => <Words>{unit.quantity}</Words> },
  { id: 'retention', header: 'Retention', cell: (unit) => <Words>{unit.retention}</Words> },
  { id: 'keptUntil', header: 'Kept until', cell: (unit) => <KeptUntil unit={unit} /> },
  { id: 'state', header: 'State', cell: (unit) => archiveBadge(unit.state) },
]

function Expiring({ phone, chosen }: { phone: boolean; chosen: boolean }) {
  const navigate = useContext(Navigate)
  const units = EXPIRING.map((number) => ARCHIVE.find((unit) => unit.number === number)).filter(
    (unit): unit is ArchiveUnit => unit !== undefined,
  )
  const [selection, setSelection] = useState<string[]>(chosen ? CHOSEN : [])
  const [view, setView] = useState<'ended' | 'year' | 'listed'>('ended')
  const rows = units.filter((unit) =>
    view === 'listed'
      ? unit.state === 'On a disposal list'
      : view === 'ended'
        ? unit.state === 'Retention ended' || unit.state === 'In the archive'
        : true,
  )
  return (
    <RecordsShell
      phone={phone}
      tab="archive"
      crumbs={[{ label: 'Archive book', href: `#${BG_ROUTES.book}` }, { label: 'What expires' }]}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="What expires"
        titleHidden={false}
        actions={
          <Button
            intent="view"
            emphasis="secondary"
            label="Disposal list LB-2026-01"
            onClick={() => {
              navigate(BG_ROUTES.disposal)
            }}
          />
        }
        views={[
          {
            id: 'ended',
            label: 'Not on a list',
            count: units.filter((unit) => unit.state !== 'On a disposal list').length,
          },
          {
            id: 'listed',
            label: 'On a disposal list',
            count: units.filter((unit) => unit.state === 'On a disposal list').length,
          },
          { id: 'year', label: 'Until the end of 2026', count: units.length },
        ]}
        view={view}
        onViewChange={(id) => {
          setView(id as 'ended' | 'year' | 'listed')
        }}
      >
        <DataTable
          label="Units whose retention ends"
          inCard
          layout={phone ? 'cards' : 'table'}
          columns={EXPIRING_COLUMNS}
          rows={rows}
          getRowId={(unit) => unit.number}
          getRowLabel={(unit) => `No. ${unit.number}, ${unit.content}`}
          count={rows.length}
          selection={selection}
          onSelectionChange={setSelection}
          bulkActions={[
            {
              key: 'propose',
              label: 'Propose for disposal',
              family: 'caution',
              icon: FileX2,
              emphasis: 'primary',
              onClick: () => {
                notice.success(
                  'Disposal list LB-2026-02 proposed; the commission is asked to sign.',
                )
                setSelection([])
              },
            },
          ]}
          mobile={{
            title: (unit) => unit.content,
            subtitle: (unit) => <Words>{`No. ${unit.number} · ${unit.years}`}</Words>,
            badge: (unit) => archiveBadge(unit.state),
            details: ['retention', 'keptUntil'],
          }}
        />
      </ListPage>
    </RecordsShell>
  )
}

// ── Disposal list ─────────────────────────────────────────────────────────────────────────────

const STEPS: LifecycleStep[] = DISPOSAL_STEPS.map((step) => ({ key: step, label: step }))

const LIST_COLUMNS: DataTableColumn<ArchiveUnit>[] = [
  {
    id: 'number',
    header: 'No.',
    numeric: true,
    cell: (unit) => <bdi>{unit.number}</bdi>,
  },
  { id: 'content', header: 'Content', minWidth: 260, cell: (unit) => <ContentCell unit={unit} /> },
  { id: 'quantity', header: 'Quantity', cell: (unit) => <Words>{unit.quantity}</Words> },
  { id: 'keptUntil', header: 'Kept until', cell: (unit) => <KeptUntil unit={unit} /> },
  { id: 'location', header: 'Location', cell: (unit) => <Words>{unit.location}</Words> },
]

function DisposalList({ phone, disposed: startDisposed }: { phone: boolean; disposed: boolean }) {
  const { format, linkComponent: Link } = useLiro()
  const [disposed, setDisposed] = useState(startDisposed)
  const [asking, setAsking] = useState(false)
  const units = DISPOSAL.units
    .map((number) => ARCHIVE.find((unit) => unit.number === number))
    .filter((unit): unit is ArchiveUnit => unit !== undefined)
    .map((unit) => (disposed ? { ...unit, state: 'Disposed' as const } : unit))
  const dispose = (
    <Button
      family="destructive"
      icon={FileX2}
      emphasis="primary"
      label="Dispose"
      onClick={() => {
        setAsking(true)
      }}
    />
  )
  return (
    <RecordsShell
      phone={phone}
      tab="archive"
      crumbs={[{ label: 'Archive book', href: `#${BG_ROUTES.book}` }, { label: DISPOSAL.number }]}
      {...(phone && !disposed ? { bottomBar: dispose } : {})}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title={DISPOSAL.number}
        back={{ href: `#${BG_ROUTES.expiring}`, label: 'What expires' }}
        status={
          <StatusBadge
            label={disposed ? 'Disposed' : 'Ready to dispose'}
            tone={disposed ? 'neutral' : 'warning'}
          />
        }
        lifecycle={{
          steps: STEPS,
          current: disposed ? 3 : 2,
          label: 'Disposal list status',
        }}
        keyFigures={[
          {
            key: 'units',
            label: 'Units',
            value: <Words>{`${format.number(String(units.length))}, ${DISPOSAL.quantity}`}</Words>,
          },
          { key: 'proposed', label: 'Proposed', value: <DateText value={DISPOSAL.proposed} /> },
          { key: 'consent', label: 'Consent', value: <DateText value={DISPOSAL.consentDate} /> },
        ]}
        actions={
          <>
            <Button intent="print" emphasis="secondary" label="Print list" />
            {phone || disposed ? null : dispose}
          </>
        }
        banner={
          disposed ? (
            <Alert tone="neutral" title={`Disposed on ${format.date('2026-10-14')}`}>
              The units stay in the archive book as disposed; the minutes are{' '}
              {DISPOSAL.minutesNumber}.
            </Alert>
          ) : undefined
        }
        linesTitle="Units to dispose of"
        lines={
          <DataTable
            label={`Units of ${DISPOSAL.number}`}
            inCard
            layout={phone ? 'cards' : 'table'}
            columns={LIST_COLUMNS}
            rows={units}
            getRowId={(unit) => unit.number}
            getRowLabel={(unit) => `No. ${unit.number}, ${unit.content}`}
            mobile={{
              title: (unit) => unit.content,
              subtitle: (unit) => <Words>{`No. ${unit.number} · ${unit.years}`}</Words>,
              details: ['quantity', 'keptUntil', 'location'],
            }}
          />
        }
        sections={[
          {
            key: 'commission',
            title: 'Commission',
            content: <SignerList signers={COMMISSION} sequential={false} />,
          },
          {
            key: 'consent',
            title: 'The archive’s consent',
            content: (
              <KeyValueList
                columns={1}
                items={[
                  { label: 'Consent', value: DISPOSAL.consent },
                  { label: 'Dated', value: <DateText value={DISPOSAL.consentDate} /> },
                  { label: 'Destroyed by', value: DISPOSAL.contractor },
                ]}
              />
            ),
          },
          {
            key: 'minutes',
            title: 'Minutes',
            content: disposed ? (
              <RelatedDocuments
                label="Minutes"
                items={[
                  {
                    key: 'minutes',
                    type: 'Minutes of the disposal',
                    number: DISPOSAL.minutesNumber,
                    href: `#${DISPOSAL_MINUTES_ROUTE}`,
                    status: <StatusBadge label="Numbered" tone="info" />,
                  },
                ]}
              />
            ) : (
              <p className="bidi-content m-0 text-sm text-secondary">
                Made when the units are disposed of, from the{' '}
                <Link href={`#${DISPOSAL_MINUTES_ROUTE}`} className={IN_TEXT_LINK}>
                  minutes template
                </Link>
                , and numbered from the registry book.
              </p>
            ),
          },
        ]}
      />
      <IrreversibleConfirmDialog
        open={asking}
        onOpenChange={setAsking}
        title="Dispose of the units"
        subject={`${DISPOSAL.number} · ${format.number(String(units.length))} units, ${DISPOSAL.quantity}`}
        message="The units are destroyed by the contractor and marked as disposed in the archive book. The minutes are made and numbered from the registry book. This cannot be undone."
        confirmText={DISPOSAL.number}
        confirmLabel="Dispose"
        onConfirm={() => {
          setDisposed(true)
          notice.success(`Disposed. Minutes ${DISPOSAL.minutesNumber} made.`)
        }}
      />
    </RecordsShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BG_ROUTES: ExampleRoute[] = [
  { path: BG_ROUTES.book, render: (phone) => <ArchiveBook phone={phone} /> },
  { path: BG_ROUTES.retention, render: (phone) => <RetentionPeriods phone={phone} /> },
  { path: BG_ROUTES.expiring, render: (phone) => <Expiring phone={phone} chosen={false} /> },
  { path: BG_ROUTES.expiringChosen, render: (phone) => <Expiring phone={phone} chosen /> },
  { path: BG_ROUTES.disposal, render: (phone) => <DisposalList phone={phone} disposed={false} /> },
  { path: BG_ROUTES.disposed, render: (phone) => <DisposalList phone={phone} disposed /> },
]
