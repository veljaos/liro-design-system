import { Ban, Merge } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  ActionGroup,
  Alert,
  CandidateList,
  DataTable,
  DateText,
  DetailPage,
  IrreversibleConfirmDialog,
  KeyValueList,
  ListPage,
  notice,
  RelatedDocuments,
  StatusBadge,
  ValueComparison,
  chosenCounts,
  type ComparisonRow,
  type DataTableColumn,
  type Tone,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate } from './example-shell'
import { useExampleState } from './example-state'
import { BT_MERGED_AT, BT_PAIRS, BT_ROUTES, BT_VIEWS, type BtPair, type BtState } from './data-BT'
import { moduleTabs, TradeShell } from './screens-AU'

/*
 * Group BT's example screens (P5.79, merging duplicates): Kvadrat Gradnja d.o.o.'s master data on
 * 14 October 2026 at 09:40, seen by Milica Petrović.
 * - Possible duplicates (ListPage): the pairs the application found, the two records, why it
 *   thinks they are one, when found, the state in words (To review, Merged, Not duplicates).
 * - Merge (DetailPage): which record stays (CandidateList, one choice, the application's reason
 *   for each and its preselection); the values to keep (ValueComparison with `chosen` /
 *   `onChoose`: the two records side by side, a choice per differing field, the neutral
 *   selection; on a phone one card per field); "What will happen" with the application's counts;
 *   Merge is unavailable, with its reason, until every differing field has its value; then the
 *   irreversible confirmation (the merged record's code typed) with the values kept.
 * - The result (DetailPage of the kept record): the merge in words, the values kept, the
 *   documents that moved here as links (invoice 2026-1187 in the document inbox; the item's
 *   receipts at Site Liman 4), its history.
 * Beton Mix d.o.o. and "Beton-Mix doo" (the same PIB; the second made by the document inbox from
 * invoice 2026-1187), and Kvadrat Gradnja's cement and the site's own record of it (same barcode).
 * The screen plays the application: it keeps the choice and moves to the result; nothing is
 * compared or merged here.
 */

export { BT_ROUTES }

const MASTER_DATA = [
  { key: 'duplicates', label: 'Possible duplicates', path: BT_ROUTES.duplicates },
]

const STATE_TONES: Record<BtState, Tone> = {
  'To review': 'warning',
  Merged: 'success',
  'Not duplicates': 'neutral',
}

function btStateBadge(state: BtState) {
  return <StatusBadge label={state} tone={STATE_TONES[state]} />
}

function BtShell({
  phone,
  crumbs,
  children,
}: {
  phone: boolean
  crumbs: { label: string; href?: string }[]
  children: ReactNode
}) {
  return (
    <TradeShell phone={phone} tabs={moduleTabs(MASTER_DATA, 'duplicates')} crumbs={crumbs}>
      {children}
    </TradeShell>
  )
}

/** What the user chose for a pair, kept for the result as the application keeps it. */
interface BtChoice {
  keep: 0 | 1
  chosen: Record<string, number>
}

function useBtChoice(pair: BtPair) {
  return useExampleState<BtChoice>(`BT.choice.${pair.id}`, () => ({
    keep: 0,
    chosen: { ...(pair.preselected?.[0] ?? {}) },
  }))
}

function btPair(id: string): BtPair {
  const pair = BT_PAIRS.find((each) => each.id === id)
  if (pair === undefined) throw new Error(`No pair ${id}`)
  return pair
}

/** The two records' columns: the one that stays first named so. */
function btColumns(pair: BtPair, keep: 0 | 1): readonly [string, string] {
  const [first, second] = pair.records
  return keep === 0
    ? [`${first.name} (stays)`, `${second.name} (merged into it)`]
    : [`${first.name} (merged into it)`, `${second.name} (stays)`]
}

function btRows(pair: BtPair): ComparisonRow[] {
  return (pair.fields ?? []).map((field) => ({
    id: field.id,
    label: field.label,
    values: field.values,
    ...(field.differs === true ? { differs: true } : {}),
    ...(field.note === undefined ? {} : { note: field.note }),
  }))
}

// ── Possible duplicates ───────────────────────────────────────────────────────────────────────

const PAIR_COLUMNS: DataTableColumn<BtPair>[] = [
  {
    id: 'records',
    header: 'Records',
    minWidth: 300,
    cell: (row) => (
      <span className="flex flex-col gap-0.5">
        {row.records.map((record) => (
          <span key={record.code} className="flex flex-wrap gap-x-2">
            <span className="bidi-content font-medium">{record.name}</span>
            <span dir="ltr" className="text-xs text-secondary tabular-nums">
              {record.code}
            </span>
          </span>
        ))}
      </span>
    ),
  },
  { id: 'kind', header: 'Kind', cell: (row) => row.kind },
  {
    id: 'reason',
    header: 'Why',
    minWidth: 200,
    cell: (row) => <span className="bidi-content">{row.reason}</span>,
  },
  { id: 'found', header: 'Found', numeric: true, cell: (row) => <DateText value={row.found} /> },
  {
    id: 'state',
    header: 'State',
    minWidth: 220,
    cell: (row) => (
      <span className="flex flex-col items-start gap-1">
        {btStateBadge(row.state)}
        {row.decided !== undefined && (
          <span className="bidi-content text-xs text-secondary">{row.decided}</span>
        )}
      </span>
    ),
  },
]

export function BtDuplicatesScreen({
  phone,
  start = 'review',
}: {
  phone: boolean
  start?: string
}) {
  const navigate = useContext(Navigate)
  const [view, setView] = useState(start)
  const inView = (pair: BtPair, id: string) =>
    (BT_VIEWS.find((each) => each.id === id)?.states as readonly string[] | undefined)?.includes(
      pair.state,
    ) === true
  const rows = BT_PAIRS.filter((pair) => inView(pair, view))
  return (
    <BtShell phone={phone} crumbs={[{ label: 'Master data' }, { label: 'Possible duplicates' }]}>
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Possible duplicates"
        views={BT_VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: BT_PAIRS.filter((pair) => inView(pair, each.id)).length,
        }))}
        view={view}
        onViewChange={setView}
      >
        <DataTable
          label="Possible duplicates"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={PAIR_COLUMNS}
          rows={rows}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.records.map((record) => record.name).join(' and ')}
          count={rows.length}
          onRowClick={(row) => {
            if (row.path !== undefined && row.state === 'To review') navigate(row.path)
            else notice.info(`${row.records[0].name} is not part of the examples.`)
          }}
          mobile={{
            title: (row) => (
              <span className="bidi-content">
                {row.records.map((record) => record.name).join(' · ')}
              </span>
            ),
            subtitle: (row) => <span className="bidi-content">{row.reason}</span>,
            badge: (row) => btStateBadge(row.state),
            details: ['kind', 'found'],
          }}
        />
      </ListPage>
    </BtShell>
  )
}

// ── Merge ─────────────────────────────────────────────────────────────────────────────────────

export function BtMergeScreen({
  phone,
  id,
  start = 'review',
}: {
  phone: boolean
  id: string
  start?: 'review' | 'ready' | 'confirm' | 'other'
}) {
  const navigate = useContext(Navigate)
  const pair = btPair(id)
  const [choice, setChoice] = useBtChoice(pair)
  const [initial] = useState<BtChoice>(() => {
    if (start === 'other') return { keep: 1, chosen: { ...(pair.preselected?.[1] ?? {}) } }
    if (start === 'ready' || start === 'confirm')
      return { keep: 0, chosen: { ...(pair.preselected?.[0] ?? {}), email: 0 } }
    return choice
  })
  const [current, setCurrent] = useState<BtChoice>(initial)
  const [confirming, setConfirming] = useState(start === 'confirm')
  const rows = btRows(pair)
  const counts = chosenCounts(rows, current.chosen)
  const left = counts.total - counts.chosen
  const kept = pair.records[current.keep]
  const merged = pair.records[current.keep === 0 ? 1 : 0]
  const noun = pair.kind === 'Partner' ? 'partners' : 'items'
  const columns = btColumns(pair, current.keep)
  return (
    <BtShell
      phone={phone}
      crumbs={[
        { label: 'Possible duplicates', href: `#${BT_ROUTES.duplicates}` },
        { label: `Merge ${noun}` },
      ]}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={`Merge ${noun}`}
        back={{ href: `#${BT_ROUTES.duplicates}`, label: 'Possible duplicates' }}
        status={btStateBadge(pair.state)}
        subtitle={`${pair.reason} · found by Liro`}
        actions={
          <ActionGroup
            actions={[
              {
                key: 'not',
                family: 'neutral',
                icon: Ban,
                label: 'Not duplicates',
                onClick: () => {
                  notice.success('Marked as not duplicates. Liro will not propose this pair again.')
                  navigate(BT_ROUTES.duplicates)
                },
              },
              {
                key: 'merge',
                family: 'caution',
                icon: Merge,
                emphasis: 'primary',
                label: 'Merge',
                onClick: () => {
                  setConfirming(true)
                },
                ...(left === 0
                  ? {}
                  : {
                      unavailableReason:
                        left === 1
                          ? 'Choose the value to keep for 1 more field.'
                          : `Choose the values to keep for ${String(left)} more fields.`,
                    }),
              },
            ]}
          />
        }
        sections={[
          {
            id: 'stays',
            label: 'Which record stays',
            description: 'The other is merged into it and closed. Liro proposes the first.',
            content: (
              <CandidateList
                label="Which record stays"
                multiple={false}
                candidates={pair.records.map((record) => ({
                  id: record.code,
                  title: record.name,
                  label: `${record.name}, ${record.code}`,
                  subtitle: record.subtitle,
                  reason: record.reason,
                  figure: record.figure,
                }))}
                selected={[kept.code]}
                onSelectedChange={(ids) => {
                  const keep = ids[0] === pair.records[1].code ? 1 : 0
                  setCurrent({ keep, chosen: { ...(pair.preselected?.[keep] ?? {}) } })
                }}
              />
            ),
          },
          {
            id: 'values',
            label: 'Values to keep',
            description: `Where the two differ, choose the value ${kept.name} keeps.`,
            content: (
              <ValueComparison
                label="Values to keep"
                columns={columns}
                rows={rows}
                rowHeader="Field"
                layout={phone ? 'phone' : 'desktop'}
                chosen={current.chosen}
                onChoose={(rowId, index) => {
                  setCurrent((value) => ({ ...value, chosen: { ...value.chosen, [rowId]: index } }))
                }}
              />
            ),
          },
          {
            id: 'effects',
            label: 'What will happen',
            content: (
              <KeyValueList
                columns={1}
                items={(pair.effects?.[current.keep] ?? []).map((effect) => ({
                  key: effect.label,
                  label: effect.label,
                  value: <span className="bidi-content">{effect.value}</span>,
                }))}
              />
            ),
          },
        ]}
      />
      <IrreversibleConfirmDialog
        open={confirming}
        onOpenChange={setConfirming}
        family="caution"
        actionIcon={Merge}
        title={`Merge ${noun}`}
        subject={`${merged.name} into ${kept.name}`}
        message={`${merged.name} (${merged.code}) is closed and everything listed under "What will happen" moves to ${kept.name}. A merge cannot be undone.`}
        preview={
          <ValueComparison
            label="Values kept"
            columns={columns}
            rows={rows}
            rowHeader="Field"
            layout="phone"
            chosen={current.chosen}
          />
        }
        confirmText={merged.code}
        confirmLabel="Merge"
        onConfirm={() => {
          setChoice(current)
          notice.success(`${merged.name} is merged into ${kept.name}.`)
          if (pair.resultPath !== undefined) navigate(pair.resultPath)
        }}
      />
    </BtShell>
  )
}

// ── The result ────────────────────────────────────────────────────────────────────────────────

export function BtMergedScreen({ phone, id }: { phone: boolean; id: string }) {
  const pair = btPair(id)
  const [choice] = useBtChoice(pair)
  const kept = pair.records[choice.keep]
  const merged = pair.records[choice.keep === 0 ? 1 : 0]
  const fields = pair.fields ?? []
  const value = (index: number, fieldId: string) => {
    const field = fields.find((each) => each.id === fieldId)
    if (field === undefined) return null
    return field.values[choice.chosen[fieldId] ?? index] ?? field.values[index] ?? null
  }
  const name = value(choice.keep, 'name') ?? kept.name
  const isPartner = pair.kind === 'Partner'
  return (
    <BtShell phone={phone} crumbs={[{ label: isPartner ? 'Partners' : 'Items' }, { label: name }]}>
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={name}
        back={{ href: `#${BT_ROUTES.duplicates}`, label: 'Possible duplicates' }}
        status={<StatusBadge label="Active" tone="success" />}
        subtitle={kept.subtitle}
        sections={[
          {
            id: 'merge',
            label: 'Merged',
            content: (
              <div className="flex flex-col gap-4">
                <Alert
                  tone="success"
                  title={`${merged.name} was merged into this ${isPartner ? 'partner' : 'item'}`}
                >
                  {`${merged.name} (${merged.code}) on ${BT_MERGED_AT} by Milica Petrović. Its code leads here.`}
                </Alert>
                <KeyValueList
                  columns={1}
                  items={(pair.effects?.[choice.keep] ?? []).map((effect) => ({
                    key: effect.label,
                    label: effect.label,
                    value: <span className="bidi-content">{effect.value}</span>,
                  }))}
                />
              </div>
            ),
          },
          {
            id: 'details',
            label: 'Details',
            content: (
              <KeyValueList
                items={fields.map((field) => ({
                  key: field.id,
                  label: field.label,
                  value: <span className="bidi-content">{value(choice.keep, field.id)}</span>,
                }))}
              />
            ),
          },
          {
            id: 'moved',
            label: 'Documents moved here',
            content: (
              <RelatedDocuments
                label="Documents moved here"
                items={(pair.moved ?? []).map((each) => ({
                  key: each.key,
                  type: each.type,
                  number: each.number,
                  href: `#${each.path ?? BT_ROUTES.duplicates}`,
                  status: <StatusBadge label={each.status} tone="neutral" />,
                }))}
              />
            ),
          },
        ]}
      />
    </BtShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BT_ROUTES: ExampleRoute[] = [
  { path: BT_ROUTES.duplicates, render: (phone) => <BtDuplicatesScreen phone={phone} /> },
  {
    path: BT_ROUTES.merged,
    render: (phone) => <BtDuplicatesScreen phone={phone} start="merged" />,
  },
  { path: BT_ROUTES.partners, render: (phone) => <BtMergeScreen phone={phone} id="BMX" /> },
  {
    path: BT_ROUTES.partnersReady,
    render: (phone) => <BtMergeScreen phone={phone} id="BMX" start="ready" />,
  },
  {
    path: BT_ROUTES.partnersConfirm,
    render: (phone) => <BtMergeScreen phone={phone} id="BMX" start="confirm" />,
  },
  {
    path: BT_ROUTES.partnersOther,
    render: (phone) => <BtMergeScreen phone={phone} id="BMX" start="other" />,
  },
  { path: BT_ROUTES.partnerMerged, render: (phone) => <BtMergedScreen phone={phone} id="BMX" /> },
  { path: BT_ROUTES.items, render: (phone) => <BtMergeScreen phone={phone} id="CEM" /> },
  {
    path: BT_ROUTES.itemsConfirm,
    render: (phone) => <BtMergeScreen phone={phone} id="CEM" start="confirm" />,
  },
  { path: BT_ROUTES.itemMerged, render: (phone) => <BtMergedScreen phone={phone} id="CEM" /> },
]
