import { BookCheck } from 'lucide-react'
import { useContext, useState } from 'react'
import {
  Button,
  ChangeableValue,
  ChangeText,
  ConfirmDialog,
  correctionColumns,
  DataTable,
  DateText,
  DESCRIPTION_MIN_WIDTH,
  DocumentPage,
  IconButton,
  KeyValueList,
  MoneyText,
  notice,
  SignerList,
  StockCount,
  Toaster,
  UnavailableAction,
  useLiro,
  type DataTableColumn,
  type LifecycleStep,
  type ScanFeedback,
  type Signer,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell } from './example-shell'
import { useExampleState } from './example-state'
import { Tenant } from './screens-G'
import { Handheld } from './screens-I'
import { inventoryTabs, stockBadge } from './screens-AY'
import {
  A02_COUNTS,
  A02_CURRENT,
  BB_ROUTES,
  BB_TODAY,
  COMMISSION,
  COUNT_AT_A02,
  MILICA_SIGNED_AT,
  STOCKTAKING,
  STOCKTAKING_LINES,
  STOCKTAKING_STEPS,
  STOCKTAKING_TOTALS,
  type BlindCount,
  type StocktakingLine,
  type StocktakingState,
} from './data-BB'

/*
 * Group BB's example screens (P5.57, stocktaking lists): Kvadrat Gradnja d.o.o.'s stocktaking
 * POP-2026-02 of Central warehouse. The list is a DocumentPage: per line the book quantity, the
 * difference and the counted quantity (the Original / Change / New columns, `correctionColumns`)
 * and the difference's value — surpluses and shortages from the application —, the totals
 * (DocumentTotals), the commission's signatures (SignerList) and "Post differences", a
 * confirmation; the posting is the application's. The count itself is group I's handheld
 * (StockCount in the touch density, `Handheld` of screens-I), counting blind: the books'
 * quantities are not shown to the commission while it counts.
 */

export { BB_ROUTES }

const STEPS: LifecycleStep[] = STOCKTAKING_STEPS.map((state) => ({ key: state, label: state }))

/** The line's location code, left to right. */
function Location({ code }: { code: string }) {
  return <span dir="ltr">{code}</span>
}

function ItemWithNote({ line }: { line: StocktakingLine }) {
  return (
    <span className="flex flex-col">
      <span className="bidi-content">{line.item}</span>
      {line.note === undefined ? null : (
        <span className="bidi-content text-xs text-secondary">{line.note}</span>
      )}
    </span>
  )
}

const LINE_COLUMNS: DataTableColumn<StocktakingLine>[] = [
  { id: 'location', header: 'Location', cell: (line) => <Location code={line.location} /> },
  {
    id: 'item',
    header: 'Item',
    minWidth: DESCRIPTION_MIN_WIDTH,
    cell: (line) => <ItemWithNote line={line} />,
  },
  { id: 'unit', header: 'Unit', cell: (line) => line.unit },
  ...correctionColumns<StocktakingLine>({
    id: 'quantity',
    original: (line) => line.book,
    change: (line) => line.difference,
    next: (line) => line.counted,
    headers: { original: 'Book', change: 'Difference', next: 'Counted' },
  }),
  {
    id: 'cost',
    header: 'Average cost',
    align: 'end',
    numeric: true,
    cell: (line) => <MoneyText value={line.cost} currency="RSD" />,
  },
  {
    id: 'differenceValue',
    header: 'Difference value',
    align: 'end',
    numeric: true,
    cell: (line) => <ChangeText value={line.differenceValue} currency="RSD" />,
  },
]

export type StocktakingStart = 'list' | 'signed' | 'post' | 'posted'

function StocktakingList({ phone, start }: { phone: boolean; start: StocktakingStart }) {
  const { format } = useLiro()
  const [signers, setSigners] = useState<readonly Signer[]>(() =>
    start === 'list'
      ? COMMISSION
      : COMMISSION.map((each) =>
          each.current === true ? { ...each, state: 'signed', at: MILICA_SIGNED_AT } : each,
        ),
  )
  const [state, setState] = useState<StocktakingState>(
    start === 'posted' ? 'Posted' : start === 'list' ? 'Awaiting signatures' : 'Signed',
  )
  const [asking, setAsking] = useState(start === 'post')
  const signed = signers.filter((each) => each.state === 'signed').length
  const money = (value: string) => format.money(value, 'RSD')

  const post =
    state === 'Posted' ? null : state === 'Signed' ? (
      <Button
        family="primary"
        icon={BookCheck}
        emphasis="primary"
        label="Post differences"
        onClick={() => {
          setAsking(true)
        }}
      />
    ) : (
      <UnavailableAction
        family="primary"
        icon={BookCheck}
        emphasis="primary"
        label="Post differences"
        reason={`The commission has not signed the list yet: ${format.number(String(signed))} of ${format.number(String(signers.length))} signed.`}
      />
    )

  return (
    <Tenant today={BB_TODAY}>
      <Shell
        phone={phone}
        crumbs={[
          { label: 'Stocktaking', href: `#${BB_ROUTES.list}` },
          { label: STOCKTAKING.number },
        ]}
        tabs={inventoryTabs('stocktaking')}
        {...(phone && post !== null ? { bottomBar: post } : {})}
      >
        <DocumentPage
          layout={phone ? 'phone' : 'desktop'}
          title={STOCKTAKING.number}
          status={stockBadge(state)}
          lifecycle={{
            steps: STEPS,
            current: STOCKTAKING_STEPS.indexOf(state),
            label: 'Stocktaking status',
          }}
          details={
            <>
              <ChangeableValue label="Warehouse" value={STOCKTAKING.warehouse} />
              <ChangeableValue label="Counted on" value={<DateText value={STOCKTAKING.at} />} />
              <ChangeableValue label="Kind" value={STOCKTAKING.kind} />
              <ChangeableValue label="Based on" value={STOCKTAKING.decision} />
            </>
          }
          keyFigures={[
            {
              key: 'differences',
              label: 'Lines with a difference',
              value: `${format.number(String(STOCKTAKING_TOTALS.withDifference))} of ${format.number(String(STOCKTAKING_TOTALS.lines))}`,
            },
            {
              key: 'surplus',
              label: 'Surplus',
              value: <MoneyText value={STOCKTAKING_TOTALS.surplus} currency="RSD" />,
            },
            {
              key: 'shortage',
              label: 'Shortage',
              value: <MoneyText value={STOCKTAKING_TOTALS.shortage} currency="RSD" />,
            },
            {
              key: 'difference',
              label: 'Net difference',
              value: <MoneyText value={STOCKTAKING_TOTALS.difference} currency="RSD" />,
            },
          ]}
          actions={
            <>
              <Button intent="print" emphasis="secondary" label="Print list" />
              {phone ? null : post}
            </>
          }
          lines={
            <DataTable
              label={`Lines of ${STOCKTAKING.number}`}
              inCard
              layout={phone ? 'cards' : 'table'}
              columns={LINE_COLUMNS}
              rows={STOCKTAKING_LINES}
              getRowId={(line) => line.id}
              getRowLabel={(line) => line.item}
              mobile={{
                title: (line) => line.item,
                subtitle: (line) => (
                  <>
                    <Location code={line.location} />
                    {line.note === undefined ? null : ` · ${line.note}`}
                  </>
                ),
                details: [
                  'quantity.original',
                  'quantity.change',
                  'quantity.new',
                  'differenceValue',
                ],
              }}
            />
          }
          totals={{
            label: 'Totals',
            rows: [
              {
                key: 'book',
                label: 'Book value',
                value: STOCKTAKING_TOTALS.bookValue,
                currency: 'RSD',
              },
              {
                key: 'counted',
                label: 'Counted value',
                value: STOCKTAKING_TOTALS.countedValue,
                currency: 'RSD',
              },
              {
                key: 'surplus',
                label: 'Surplus',
                value: STOCKTAKING_TOTALS.surplus,
                currency: 'RSD',
                group: true,
              },
              {
                key: 'shortage',
                label: 'Shortage',
                value: STOCKTAKING_TOTALS.shortage,
                currency: 'RSD',
              },
            ],
            total: {
              key: 'difference',
              label: 'Net difference',
              value: STOCKTAKING_TOTALS.difference,
              currency: 'RSD',
            },
          }}
          sections={[
            {
              key: 'commission',
              title: 'Commission',
              content: (
                <SignerList
                  signers={signers}
                  onSign={(signer) => {
                    setSigners((current) =>
                      current.map((each) =>
                        each.id === signer.id
                          ? { ...each, state: 'signed', at: MILICA_SIGNED_AT }
                          : each,
                      ),
                    )
                    setState('Signed')
                    notice.success(`${STOCKTAKING.number} signed. The differences may be posted.`)
                  }}
                />
              ),
            },
            ...(state === 'Posted'
              ? [
                  {
                    key: 'posted',
                    title: 'Posting',
                    content: (
                      <KeyValueList
                        columns={1}
                        items={[
                          {
                            label: 'Surplus',
                            value: `Stocktaking surplus ${STOCKTAKING.surplusDocument}`,
                          },
                          {
                            label: 'Shortage',
                            value: `Stocktaking shortage ${STOCKTAKING.shortageDocument}`,
                          },
                          {
                            label: 'Posted by',
                            value: `Milica Petrović, ${format.date(BB_TODAY)} 09:40`,
                          },
                        ]}
                      />
                    ),
                  },
                ]
              : []),
          ]}
        />
        <ConfirmDialog
          open={asking}
          onOpenChange={setAsking}
          family="primary"
          actionIcon={BookCheck}
          tone="warning"
          title="Post differences"
          subject={`${STOCKTAKING.number} · ${STOCKTAKING.warehouse}`}
          message={`The surplus and the shortage are booked on ${format.date(STOCKTAKING.at)}, and the stock of Central warehouse follows the count. A posted stocktaking is corrected only with a new document.`}
          preview={
            <KeyValueList
              columns={1}
              items={[
                {
                  label: `Surplus, ${format.number(String(STOCKTAKING_TOTALS.surplusItems))} item`,
                  value: money(STOCKTAKING_TOTALS.surplus),
                  numeric: true,
                },
                {
                  label: `Shortage, ${format.number(String(STOCKTAKING_TOTALS.shortageItems))} items`,
                  value: money(STOCKTAKING_TOTALS.shortage),
                  numeric: true,
                },
                {
                  label: 'Net difference',
                  value: money(STOCKTAKING_TOTALS.difference),
                  numeric: true,
                },
              ]}
            />
          }
          confirmLabel="Post differences"
          onConfirm={() => {
            setState('Posted')
            notice.success(
              `Differences posted: ${STOCKTAKING.surplusDocument} and ${STOCKTAKING.shortageDocument}.`,
            )
          }}
        />
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

// ── The count on the handheld ─────────────────────────────────────────────────────────────────

/** The application's answer to a scan: a new id each time, so the same words are news again. */
function answer(previous: ScanFeedback | null, tone: ScanFeedback['tone'], text: string) {
  return { id: typeof previous?.id === 'number' ? previous.id + 1 : 1, tone, text }
}

function StocktakingCount({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [location, setLocation] = useState<string | null>(COUNT_AT_A02.location)
  const [counts, setCounts] = useExampleState<readonly BlindCount[]>(
    'stocktaking.a02',
    () => A02_COUNTS,
  )
  const [currentId, setCurrentId] = useState<string | null>(A02_CURRENT)
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null)
  return (
    <Tenant today={BB_TODAY}>
      <Handheld phone={phone}>
        <StockCount
          title={COUNT_AT_A02.title}
          subtitle={COUNT_AT_A02.subtitle}
          location={location}
          {...(location === COUNT_AT_A02.location
            ? { locationName: COUNT_AT_A02.locationName }
            : {})}
          items={location === null ? [] : counts}
          currentId={location === null ? null : currentId}
          feedback={feedback}
          onScan={(code, target) => {
            if (target === 'location') {
              if (code === COUNT_AT_A02.location) {
                setLocation(code)
                setFeedback((previous) => answer(previous, 'success', `Location ${code}`))
              } else {
                setFeedback((previous) =>
                  answer(previous, 'error', `${code} is not on this list. Scan A-02.`),
                )
              }
              return
            }
            const count = counts.find((each) => each.itemCode === code)
            if (count === undefined) {
              setFeedback((previous) =>
                answer(
                  previous,
                  'error',
                  `${code} is not booked at A-02. Put it aside for the commission.`,
                ),
              )
              return
            }
            setCurrentId(count.id)
            setFeedback((previous) => answer(previous, 'success', count.item))
          }}
          onCountChange={(itemId, counted) => {
            setCounts((current) =>
              current.map((each) => (each.id === itemId ? { ...each, counted } : each)),
            )
          }}
          onSelectItem={setCurrentId}
          onChangeLocation={() => {
            setLocation(null)
            setFeedback(null)
          }}
          onFinish={() => {
            notice.success(`Location ${COUNT_AT_A02.location} counted.`)
            navigate(BB_ROUTES.list)
          }}
          actions={<IconButton intent="more" label="Count menu" />}
        />
      </Handheld>
    </Tenant>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BB_ROUTES: ExampleRoute[] = [
  { path: BB_ROUTES.list, render: (phone) => <StocktakingList phone={phone} start="list" /> },
  { path: BB_ROUTES.signed, render: (phone) => <StocktakingList phone={phone} start="signed" /> },
  { path: BB_ROUTES.post, render: (phone) => <StocktakingList phone={phone} start="post" /> },
  { path: BB_ROUTES.posted, render: (phone) => <StocktakingList phone={phone} start="posted" /> },
  { path: BB_ROUTES.count, render: (phone) => <StocktakingCount phone={phone} /> },
]
