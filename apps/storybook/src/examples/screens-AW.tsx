import { Send } from 'lucide-react'
import { useContext, useState } from 'react'
import {
  Button,
  DataTable,
  DateText,
  DocumentPage,
  DocumentReferences,
  ListPage,
  MoneyText,
  notice,
  SignerList,
  SplitAction,
  toneFor,
  type DataTableColumn,
  type LineType,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate } from './example-shell'
import { useExampleState } from './example-state'
import { TRADE_TONES } from './data-AU'
import {
  AW_ROUTES,
  COMPENSATION_SIGNED,
  OFFSET_ROWS,
  OFFSETS,
  offsetPath,
  type OffsetDocument,
  type OffsetItem,
  type OffsetRow,
  type OffsetState,
} from './data-AW'
import { W_ROUTES } from './data-W'
import {
  counterpartyOf,
  historyPanel,
  moduleTabs,
  TradeShell,
  tradeBadge,
  usePanels,
} from './screens-AU'

/*
 * Group AW's example screens (P5.55): compensation, cession and assignment at Kvadrat Gradnja
 * d.o.o. on 14 October 2026, seen by Milica Petrović. One pattern, three kinds of document:
 * - The list of offsets (ListPage): number, kind, the other parties, date, amount and state;
 *   "New compensation" with cession and assignment in its menu (SplitAction).
 * - The document (DocumentPage): the other parties with their roles at the counterparty's level
 *   (`counterparty` and `counterparties`), what it does in one sentence; "Based on" the confirmed
 *   statement of open items (the compensation); the items of each side in one table — a heading
 *   per side ("Beton Mix d.o.o. owes Kvadrat Gradnja d.o.o."), each item open / settled /
 *   remaining, a subtotal per side — the amount settled under it; what remains, sentence by
 *   sentence; each party's signature (SignerList, any order). Send reminder while signatures are
 *   missing, Post once all have signed. Every figure is the application's (data-AW.ts).
 */

export { AW_ROUTES }

const ACCOUNTING = [
  { key: 'inbox', label: 'Document inbox', path: '/accounting/inbox' },
  { key: 'ios', label: 'Statements of open items', path: W_ROUTES.list },
  { key: 'offsets', label: 'Offsets and assignments', path: AW_ROUTES.list },
]

const money = (value: string | null) => <MoneyText value={value} currency="RSD" />

const STEPS = [
  { key: 'draft', label: 'Draft' },
  { key: 'signing', label: 'Sent for signatures' },
  { key: 'signed', label: 'Signed' },
  { key: 'posted', label: 'Posted' },
]

const STEP_OF: Record<OffsetState, number> = {
  Draft: 0,
  'Awaiting signatures': 1,
  Signed: 2,
  Posted: 3,
}

/** A row of the items' table: a side's heading, an item, or a side's subtotal. */
type ItemRow =
  | { id: string; type: 'heading'; title: string }
  | { id: string; type: 'line'; item: OffsetItem }
  | { id: string; type: 'subtotal'; open: string; settled: string; remains: string }

function itemRows(document: OffsetDocument): ItemRow[] {
  return document.sides.flatMap((side): ItemRow[] => [
    { id: `${side.key}-heading`, type: 'heading', title: side.title },
    ...side.items.map((item): ItemRow => ({ id: item.id, type: 'line', item })),
    { id: `${side.key}-total`, type: 'subtotal', ...side.totals },
  ])
}

function itemColumns(document: OffsetDocument): DataTableColumn<ItemRow>[] {
  const amount =
    (pick: (row: { open: string; settled: string; remains: string }) => string) =>
    (row: ItemRow) =>
      row.type === 'heading' ? null : money(pick(row.type === 'line' ? row.item : row))
  return [
    {
      id: 'document',
      header: 'Document',
      minWidth: 200,
      cell: (row) =>
        row.type === 'line' ? (
          <span className="flex flex-col">
            <span dir="ltr" className="text-start font-medium tabular-nums">
              {row.item.document}
            </span>
            <span className="bidi-content text-xs text-secondary">{row.item.kind}</span>
          </span>
        ) : null,
    },
    {
      id: 'date',
      header: 'Date',
      numeric: true,
      cell: (row) => (row.type === 'line' ? <DateText value={row.item.date} /> : null),
    },
    { id: 'open', header: 'Open', align: 'end', numeric: true, cell: amount((row) => row.open) },
    {
      id: 'settled',
      header: document.settledLabel,
      align: 'end',
      numeric: true,
      cell: amount((row) => row.settled),
    },
    {
      id: 'remains',
      header: 'Remains',
      align: 'end',
      numeric: true,
      cell: amount((row) => row.remains),
    },
  ]
}

/** The document's state, kept above the screens (signatures arrive, the user posts). */
function useOffsetState(document: OffsetDocument) {
  return useExampleState<OffsetState>(`AW.${document.number}`, () => document.state)
}

export function OffsetScreen({ phone, document }: { phone: boolean; document: OffsetDocument }) {
  const [state, setState] = useOffsetState(document)
  const panels = usePanels(['history'])
  const [, ...others] = document.parties
  const [first, ...rest] = others
  const main =
    state === 'Awaiting signatures' ? (
      <Button
        family="verify"
        icon={Send}
        label="Send reminder"
        onClick={() => {
          notice.success('A reminder to sign is sent.')
        }}
      />
    ) : state === 'Signed' ? (
      <Button
        intent="confirm"
        label="Post"
        onClick={() => {
          setState('Posted')
          notice.success(`${document.number} is posted.`)
        }}
      />
    ) : null
  return (
    <TradeShell
      phone={phone}
      tabs={moduleTabs(ACCOUNTING, 'offsets')}
      crumbs={[
        { label: 'Offsets and assignments', href: `#${AW_ROUTES.list}` },
        { label: document.number },
      ]}
      {...(phone && main !== null ? { bottomBar: main } : {})}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title={document.number}
        back={{ href: `#${AW_ROUTES.list}`, label: 'Offsets and assignments' }}
        status={tradeBadge(state)}
        lifecycle={{ steps: STEPS, current: STEP_OF[state], label: `${document.kind} status` }}
        {...(first === undefined
          ? {}
          : {
              counterparty: counterpartyOf(
                document.kind === 'Compensation' ? 'Partner' : first.role,
                first.party,
              ),
            })}
        counterparties={rest.map((each) => counterpartyOf(each.role, each.party))}
        details={<p className="bidi-content m-0 text-sm text-primary">{document.summary}</p>}
        {...(document.basedOn === undefined
          ? {}
          : {
              references: (
                <DocumentReferences
                  groups={[
                    {
                      key: 'basedOn',
                      label: document.basedOn.label,
                      items: [
                        {
                          key: 'basedOn',
                          number: document.basedOn.number,
                          href: `#${document.basedOn.path}`,
                          status: {
                            label: document.basedOn.status,
                            tone: toneFor(document.basedOn.status, TRADE_TONES),
                          },
                        },
                      ],
                    },
                  ]}
                />
              ),
            })}
        keyFigures={[
          { label: document.amountLabel, value: money(document.amount) },
          { label: 'Date', value: <DateText value={document.date} /> },
          { label: 'Kind', value: document.kind },
        ]}
        actions={
          <>
            <Button intent="pdf" label="PDF" emphasis="secondary" />
            {phone ? null : main}
          </>
        }
        lines={
          <DataTable
            label="Items"
            layout={phone ? 'cards' : 'table'}
            inCard
            columns={itemColumns(document)}
            rows={itemRows(document)}
            getRowId={(row) => row.id}
            getRowLabel={(row) =>
              row.type === 'line' ? row.item.document : row.type === 'heading' ? row.title : 'Total'
            }
            lineType={(row): LineType => row.type}
            lineText={(row) =>
              row.type === 'heading' ? (
                <span className="bidi-content">{row.title}</span>
              ) : row.type === 'subtotal' ? (
                'Total'
              ) : null
            }
            mobile={{ details: ['date', 'open', 'settled', 'remains'] }}
          />
        }
        totals={{
          label: 'Totals',
          rows: [],
          total: {
            key: 'amount',
            label: document.amountLabel,
            value: document.amount,
            currency: 'RSD',
          },
        }}
        sections={[
          {
            key: 'remains',
            title: 'What remains',
            content: (
              <ul className="m-0 flex list-disc flex-col gap-1 ps-5 text-sm text-primary">
                {document.remains.map((sentence) => (
                  <li key={sentence} className="bidi-content">
                    {sentence}
                  </li>
                ))}
              </ul>
            ),
          },
          {
            key: 'signatures',
            title: 'Signatures',
            content: <SignerList signers={document.signers} sequential={false} />,
          },
        ]}
        panels={[
          historyPanel([
            {
              key: 'h1',
              author: 'Milica Petrović',
              time: '14.10.2026. 08:55',
              text: `Prepared and sent for signatures through Liro Bridge.`,
            },
          ]),
        ]}
        {...panels}
      />
    </TradeShell>
  )
}

// ── The list ──────────────────────────────────────────────────────────────────────────────────

const VIEWS: { id: string; label: string; states: readonly OffsetState[] }[] = [
  { id: 'open', label: 'Open', states: ['Draft', 'Awaiting signatures', 'Signed'] },
  { id: 'posted', label: 'Posted', states: ['Posted'] },
  { id: 'all', label: 'All', states: ['Draft', 'Awaiting signatures', 'Signed', 'Posted'] },
]

const LIST_COLUMNS: DataTableColumn<OffsetRow>[] = [
  {
    id: 'number',
    header: 'Number',
    cell: (row) => (
      <span dir="ltr" className="font-medium tabular-nums">
        {row.number}
      </span>
    ),
  },
  { id: 'kind', header: 'Kind', cell: (row) => row.kind },
  {
    id: 'parties',
    header: 'Other parties',
    minWidth: 220,
    cell: (row) => <span className="bidi-content">{row.parties}</span>,
  },
  { id: 'date', header: 'Date', numeric: true, cell: (row) => <DateText value={row.date} /> },
  { id: 'amount', header: 'Amount', align: 'end', numeric: true, cell: (row) => money(row.amount) },
  { id: 'state', header: 'State', cell: (row) => tradeBadge(row.state) },
]

export function OffsetsScreen({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [view, setView] = useState('open')
  const inView = (row: OffsetRow, id: string) =>
    VIEWS.find((each) => each.id === id)?.states.includes(row.state) === true
  const rows = OFFSET_ROWS.filter((row) => inView(row, view))
  const create = (kind: string) => () => {
    notice.info(`A new ${kind} opens as a draft.`)
  }
  return (
    <TradeShell
      phone={phone}
      tabs={moduleTabs(ACCOUNTING, 'offsets')}
      crumbs={[{ label: 'Accounting' }, { label: 'Offsets and assignments' }]}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Offsets and assignments"
        actions={
          <SplitAction
            intent="create"
            label="New compensation"
            onClick={create('compensation')}
            entries={[
              { label: 'New cession', onSelect: create('cession') },
              { label: 'New assignment', onSelect: create('assignment') },
            ]}
          />
        }
        views={VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: OFFSET_ROWS.filter((row) => inView(row, each.id)).length,
        }))}
        view={view}
        onViewChange={setView}
      >
        <DataTable
          label="Offsets and assignments"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={LIST_COLUMNS}
          rows={rows}
          getRowId={(row) => row.number}
          getRowLabel={(row) => `${row.kind} ${row.number}`}
          count={rows.length}
          onRowClick={(row) => {
            if (OFFSETS.some((each) => each.number === row.number)) navigate(offsetPath(row.number))
            else notice.info(`${row.number} is not part of the examples.`)
          }}
          mobile={{
            title: (row) => `${row.kind} ${row.number}`,
            subtitle: (row) => <span className="bidi-content">{row.parties}</span>,
            badge: (row) => tradeBadge(row.state),
            details: ['date', 'amount'],
          }}
        />
      </ListPage>
    </TradeShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_AW_ROUTES: ExampleRoute[] = [
  { path: AW_ROUTES.list, render: (phone) => <OffsetsScreen phone={phone} /> },
  ...OFFSETS.map((document) => ({
    path: offsetPath(document.number),
    render: (phone: boolean) => <OffsetScreen phone={phone} document={document} />,
  })),
  {
    path: AW_ROUTES.compensationSigned,
    render: (phone) => <OffsetScreen phone={phone} document={COMPENSATION_SIGNED} />,
  },
]
