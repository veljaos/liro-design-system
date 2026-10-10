import { FileCheck } from 'lucide-react'
import { useCallback, useMemo, useRef, useState } from 'react'
import {
  Button,
  ChangeableValue,
  DateField,
  DateText,
  DocumentPage,
  EditableGrid,
  LookupDialog,
  MoneyText,
  NumberText,
  TextField,
  useLiro,
  type DataTableColumn,
  type EditableGridColumn,
  type GridDetail,
  type GridMessage,
  type LifecycleStep,
  type LookupOption,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { SALES_TABS, Shell, statusBadge } from './example-shell'
import {
  ACCOUNTS,
  addQuantities,
  draftAmount,
  draftSubtotals,
  draftTotals,
  DRAFT,
  fromParas,
  findInCatalogue,
  fromRecord,
  initialDraft,
  KINDS,
  newLine,
  NEW_SERVICE,
  RECENT,
  recordOf,
  searchCatalogue,
  SITUATION,
  specAmounts,
  specificationOf,
  specTotals,
  TAX_CATEGORIES,
  toUnits,
  UNITS,
  type CatalogueRecord,
  type DraftLine,
  type SpecRow,
} from './data-D1'

/*
 * Group D1's example screens (Phase 5: P5.18 document lines, P5.19 LookupField):
 * - "Invoice draft, lines by search" (/sales/invoices/new): a draft to Bojović i sinovi d.o.o.
 *   whose lines are found by one search field per line — items with their stock, services, a
 *   fixed asset sold with its number and its internal book value — with a section heading and
 *   subtotal per section, a text line, a discount, S 20% and S 10%, and "+ Create service …".
 * - "Interim situation, editing the specification" (/projects/IS-2026-007/specification): the
 *   300 positions of IS-2026-007 in 12 groups with subtotals and Previous / This period /
 *   Cumulative columns, edited line by line like document lines.
 * Every amount comes from data-D1.ts (whole paras); the screens only show them.
 */

export const D1_ROUTES = {
  draft: '/sales/invoices/new',
  specification: `/projects/${SITUATION.number}/specification`,
  situation: `/projects/${SITUATION.number}`,
}

const STEPS: LifecycleStep[] = [
  { key: 'draft', label: 'Draft' },
  { key: 'issued', label: 'Issued' },
  { key: 'sent', label: 'Sent to SEF' },
  { key: 'paid', label: 'Paid' },
]

const NO_RESULTS: LookupOption[] = []

/** The Core's search per line (the catalogue's first page after 400ms), by line id. */
function useLineSearch() {
  const [results, setResults] = useState<Readonly<Record<string, LookupOption[]>>>({})
  const [loading, setLoading] = useState<Readonly<Record<string, boolean>>>({})
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const onSearch = useCallback((rowId: string, query: string) => {
    setLoading((current) => ({ ...current, [rowId]: true }))
    clearTimeout(timers.current.get(rowId))
    timers.current.set(
      rowId,
      setTimeout(() => {
        setResults((current) => ({ ...current, [rowId]: searchCatalogue(query) }))
        setLoading((current) => ({ ...current, [rowId]: false }))
      }, 400),
    )
  }, [])
  return { results, loading, onSearch }
}

/** The Core's checks of the draft's lines: stock, and a one-off line's account. */
function draftMessages(lines: readonly DraftLine[]): Record<string, GridMessage[]> {
  const result: Record<string, GridMessage[]> = {}
  for (const line of lines) {
    const list: GridMessage[] = []
    const record = line.item === null ? undefined : recordOf(line.item.value)
    if (
      record?.stock !== undefined &&
      line.quantity !== null &&
      toUnits(line.quantity, 3) > toUnits(record.stock, 3)
    ) {
      list.push({
        tone: 'warning',
        text: `Only ${record.stock} pc of ${record.value} in stock: the rest goes on back order.`,
        columns: ['quantity'],
      })
    }
    if (line.item?.oneOff === true && line.account === '') {
      list.push({
        tone: 'danger',
        text: 'A one-off line needs a revenue account.',
        columns: ['account'],
      })
    }
    if (list.length > 0) result[line.id] = list
  }
  return result
}

// ── The whole catalogue ("Search all…") ──────────────────────────────────────────────────────

const KIND_NAMES: Record<CatalogueRecord['kind'], string> = {
  item: 'Item',
  service: 'Service',
  asset: 'Fixed asset',
  discount: 'Discount',
}

const CATALOGUE_COLUMNS: DataTableColumn<CatalogueRecord>[] = [
  { id: 'code', header: 'Code', cell: (record) => <bdi>{record.value}</bdi> },
  { id: 'name', header: 'Name', cell: (record) => record.label },
  { id: 'kind', header: 'Kind', cell: (record) => KIND_NAMES[record.kind] },
  {
    id: 'price',
    header: 'Price',
    numeric: true,
    cell: (record) => <MoneyText value={record.price} currency="RSD" />,
  },
]

// ── Invoice draft, lines by search ──────────────────────────────────────────────────────────

export function InvoiceDraft({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const [lines, setLines] = useState<DraftLine[]>(initialDraft)
  const [number, setNumber] = useState(DRAFT.number)
  const [issued, setIssued] = useState<string | null>(DRAFT.issued)
  const [due, setDue] = useState<string | null>(DRAFT.due)
  const { results, loading, onSearch } = useLineSearch()
  const [searchAll, setSearchAll] = useState<{ rowId: string; query: string } | null>(null)
  const [allQuery, setAllQuery] = useState('')
  const [allCursor, setAllCursor] = useState(0)
  const allFound = useMemo(() => findInCatalogue(allQuery), [allQuery])
  const subtotals = useMemo(() => draftSubtotals(lines), [lines])
  const totals = useMemo(() => draftTotals(lines), [lines])

  const columns = useMemo<EditableGridColumn<DraftLine>[]>(
    () => [
      {
        id: 'item',
        header: 'Item, service or asset',
        type: 'lookup',
        width: 300,
        value: (line) => line.item,
        results: (line) => results[line.id] ?? NO_RESULTS,
        loading: (line) => loading[line.id] === true,
        onSearch,
        recent: RECENT,
        kinds: KINDS,
        allowOneOff: true,
        // "Search all…" opens the whole catalogue in LookupDialog, with the text typed so far.
        onSearchAll: (rowId, query) => {
          setSearchAll({ rowId, query })
          setAllQuery(query)
          setAllCursor(0)
        },
        create: {
          kinds: [
            { kind: 'service', noun: 'service' },
            { kind: 'item', noun: 'item' },
          ],
          units: UNITS,
          taxCategories: TAX_CATEGORIES,
          currency: 'RSD',
          defaultUnit: 'HUR',
          defaultTaxCategory: 'S20',
          // The Core saves the record and answers with it.
          onCreate: (_rowId, draft) =>
            new Promise((resolve) => {
              setTimeout(() => {
                resolve({ value: NEW_SERVICE.value, label: draft.name, kind: draft.kind })
              }, 300)
            }),
        },
      },
      {
        id: 'quantity',
        header: 'Quantity',
        type: 'number',
        width: 90,
        value: (line) => line.quantity,
      },
      { id: 'unit', header: 'Unit', type: 'unit', width: 76, value: (l) => l.unit, units: UNITS },
      {
        id: 'price',
        header: 'Price',
        type: 'number',
        width: 120,
        decimals: 2,
        value: (line) => line.price,
      },
      {
        id: 'tax',
        header: 'VAT',
        type: 'taxCategory',
        width: 90,
        value: (line) => line.tax,
        categories: TAX_CATEGORIES,
      },
      {
        id: 'account',
        header: 'Account',
        type: 'select',
        width: 170,
        value: (line) => line.account,
        options: ACCOUNTS,
        // A catalogue record brings its account; a one-off line chooses it.
        readOnly: (line) => line.item !== null && line.item.oneOff !== true,
      },
      {
        id: 'amount',
        header: 'Amount',
        type: 'display',
        width: 140,
        align: 'end',
        numeric: true,
        display: (line) => <MoneyText value={draftAmount(line, subtotals)} currency="RSD" />,
      },
    ],
    [results, loading, onSearch, subtotals],
  )

  const details: Record<string, GridDetail[]> = {}
  for (const line of lines) {
    const record = line.item === null ? undefined : recordOf(line.item.value)
    if (record?.assetNumber === undefined || record.bookValue === undefined) continue
    details[line.id] = [
      { text: `Fixed asset ${record.assetNumber}: sold, it leaves the asset register on issue.` },
      { text: `Book value ${format.money(record.bookValue, 'RSD')}`, internal: true },
    ]
  }

  const issue = (
    <Button family="primary" icon={FileCheck} label="Issue invoice" emphasis="primary" />
  )
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Invoices', href: '#/sales/invoices' }, { label: 'New invoice' }]}
      tabs={SALES_TABS}
      {...(phone ? { bottomBar: issue } : {})}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title="New invoice"
        back={{ href: '#/sales/invoices', label: 'Invoices' }}
        status={statusBadge('Draft')}
        lifecycle={{ steps: STEPS, current: 0, label: 'Invoice status' }}
        counterparty={{
          label: 'Customer',
          name: DRAFT.customer,
          taxId: `PIB ${DRAFT.taxId}`,
          address: DRAFT.address,
        }}
        details={
          <>
            <ChangeableValue
              label="Number"
              value={<span dir="ltr">{number}</span>}
              field={
                <TextField label="Number" direction="ltr" value={number} onChange={setNumber} />
              }
            />
            <ChangeableValue
              label="Issue date"
              value={<DateText value={issued} />}
              field={<DateField label="Issue date" value={issued} onChange={setIssued} />}
            />
            <ChangeableValue
              label="Due date"
              value={<DateText value={due} />}
              field={<DateField label="Due date" value={due} onChange={setDue} />}
            />
          </>
        }
        actions={
          <>
            <Button intent="preview" label="Preview" />
            {phone ? null : issue}
          </>
        }
        lines={
          <EditableGrid<DraftLine>
            label="Lines"
            inCard
            layout={phone ? 'phone' : 'desktop'}
            columns={columns}
            rows={lines}
            getRowId={(line) => line.id}
            getRowType={(line) => line.type}
            lineText={{ columnId: 'text', value: (line) => line.text }}
            addTypes={['text', 'heading', 'discount']}
            messages={draftMessages(lines)}
            details={details}
            totals={{ amount: { value: totals.net, currency: 'RSD' } }}
            totalsLabel="Total without VAT"
            onCellChange={(rowId, columnId, value) => {
              setLines((current) =>
                current.map((line) => {
                  if (line.id !== rowId) return line
                  if (columnId === 'item') return fromRecord(line, value as LookupOption | null)
                  return { ...line, [columnId]: value }
                }),
              )
            }}
            onAddRow={(index, type) => {
              setLines((current) => {
                // A heading starts a section: the Core adds its subtotal with it.
                const added =
                  type === 'heading'
                    ? [newLine('heading'), newLine('subtotal', { text: 'Subtotal' })]
                    : type === 'discount'
                      ? [fromRecord(newLine('discount'), recordOf('POP-05') ?? null)]
                      : [newLine(type)]
                return [...current.slice(0, index), ...added, ...current.slice(index)]
              })
            }}
            onRemoveRow={(rowId) => {
              setLines((current) => current.filter((line) => line.id !== rowId))
            }}
          />
        }
        totals={{ rows: totals.rows, total: totals.total, label: 'Totals' }}
        sections={[]}
        panels={[]}
      />
      <LookupDialog
        open={searchAll !== null}
        onOpenChange={(open) => {
          if (!open) setSearchAll(null)
        }}
        title="Items, services and assets"
        initialQuery={searchAll?.query ?? ''}
        onSearch={(query) => {
          setAllQuery(query)
          setAllCursor(0)
        }}
        searchPlaceholder="Name or code"
        columns={CATALOGUE_COLUMNS}
        rows={allFound.slice(allCursor, allCursor + 25)}
        getRowId={(record) => record.value}
        getRowLabel={(record) => `${record.label}, ${record.value}`}
        onChoose={(record) => {
          const rowId = searchAll?.rowId
          setLines((current) =>
            current.map((line) => (line.id === rowId ? fromRecord(line, record) : line)),
          )
        }}
        hasNext={allCursor + 25 < allFound.length}
        onNext={() => {
          setAllCursor(allCursor + 25)
        }}
        hasPrevious={allCursor > 0}
        onPrevious={() => {
          setAllCursor(Math.max(0, allCursor - 25))
        }}
        count={allFound.length}
        mobile={{ subtitle: (record) => `${record.value} · ${KIND_NAMES[record.kind]}` }}
        layout={phone ? 'phone' : 'desktop'}
      />
    </Shell>
  )
}

// ── Interim situation, editing the specification ──────────────────────────────────────────────

export function SpecificationEditor({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const [rows, setRows] = useState<SpecRow[]>(specificationOf)
  const totals = useMemo(() => specTotals(rows), [rows])
  const { groups } = totals

  const columns = useMemo<EditableGridColumn<SpecRow>[]>(
    () => [
      { id: 'text', header: 'Position', type: 'text', value: (row) => row.text },
      {
        id: 'unit',
        header: 'Unit',
        type: 'unit',
        width: 76,
        value: (row) => row.unit,
        units: UNITS,
      },
      {
        id: 'quantity',
        header: 'Quantity',
        type: 'number',
        width: 90,
        value: (row) => row.quantity,
      },
      {
        id: 'price',
        header: 'Unit price',
        type: 'number',
        width: 116,
        decimals: 2,
        value: (row) => row.price,
      },
      {
        id: 'tax',
        header: 'VAT',
        type: 'taxCategory',
        width: 84,
        value: (row) => row.tax,
        categories: TAX_CATEGORIES,
      },
      {
        id: 'previous',
        header: 'Previous',
        type: 'display',
        width: 84,
        align: 'end',
        numeric: true,
        display: (row) => (row.type === 'line' ? <NumberText value={row.previous} /> : null),
      },
      {
        id: 'current',
        header: 'This period',
        type: 'number',
        width: 96,
        value: (row) => row.current,
      },
      {
        id: 'cumulative',
        header: 'Cumulative',
        type: 'display',
        width: 96,
        align: 'end',
        numeric: true,
        display: (row) =>
          row.type === 'line' ? (
            <NumberText value={addQuantities(row.previous, row.current)} />
          ) : null,
      },
      {
        id: 'amount',
        header: 'This period, amount',
        type: 'display',
        width: 150,
        align: 'end',
        numeric: true,
        display: (row) => {
          if (row.type === 'subtotal') {
            return <MoneyText value={fromParas(groups.get(row.id)?.current ?? 0n)} currency="RSD" />
          }
          const amounts = specAmounts(row)
          return amounts === null ? null : (
            <MoneyText value={fromParas(amounts.current)} currency="RSD" />
          )
        },
      },
    ],
    [groups],
  )

  const save = <Button intent="save" label="Save specification" />
  return (
    <Shell
      phone={phone}
      crumbs={[
        { label: 'Projects', href: '#/projects' },
        { label: SITUATION.number, href: `#${D1_ROUTES.situation}` },
        { label: 'Specification' },
      ]}
      {...(phone ? { bottomBar: save } : {})}
    >
      <DocumentPage
        layout={phone ? 'phone' : 'desktop'}
        title={`${SITUATION.number}: specification of works`}
        back={{ href: `#${D1_ROUTES.situation}`, label: SITUATION.number }}
        status={statusBadge('Draft')}
        counterparty={{
          label: 'Investor',
          name: SITUATION.customer,
          taxId: `PIB ${SITUATION.taxId}`,
          address: SITUATION.address,
        }}
        keyFigures={[
          {
            key: 'positions',
            label: 'Positions',
            value: format.number(String(totals.positions)),
          },
          {
            key: 'contract',
            label: 'Contract value',
            value: <MoneyText value={fromParas(totals.contract)} currency="RSD" />,
          },
          {
            key: 'current',
            label: 'This period',
            value: <MoneyText value={fromParas(totals.current)} currency="RSD" />,
          },
        ]}
        details={
          <>
            <ChangeableValue label="Contract" value={SITUATION.contract} />
            <ChangeableValue label="Site" value={SITUATION.site} />
            <ChangeableValue label="Period" value={SITUATION.period} />
          </>
        }
        actions={
          <>
            <Button intent="cancel" label="Cancel" />
            {phone ? null : save}
          </>
        }
        lines={
          <EditableGrid<SpecRow>
            label="Specification of works"
            inCard
            layout={phone ? 'phone' : 'desktop'}
            columns={columns}
            rows={rows}
            getRowId={(row) => row.id}
            getRowType={(row) => row.type}
            lineText={{ columnId: 'text', value: (row) => row.text }}
            addTypes={['heading', 'text']}
            totals={{ amount: { value: fromParas(totals.current), currency: 'RSD' } }}
            totalsLabel="This period"
            onCellChange={(rowId, columnId, value) => {
              setRows((current) =>
                current.map((row) => (row.id === rowId ? { ...row, [columnId]: value } : row)),
              )
            }}
            onAddRow={(index, type) => {
              setRows((current) => {
                const group = current[Math.max(0, index - 1)]?.group ?? 1
                const id = `new-${String(current.length + 1)}`
                const blank: SpecRow = {
                  id,
                  type,
                  group,
                  position: 0,
                  text: '',
                  quantity: null,
                  unit: 'H87',
                  price: null,
                  tax: 'S20',
                  previous: '0',
                  current: null,
                }
                const added: SpecRow[] =
                  type === 'heading'
                    ? [blank, { ...blank, id: `${id}-s`, type: 'subtotal', text: 'Subtotal' }]
                    : [blank]
                return [...current.slice(0, index), ...added, ...current.slice(index)]
              })
            }}
            onRemoveRow={(rowId) => {
              setRows((current) => current.filter((row) => row.id !== rowId))
            }}
          />
        }
        totals={{ ...totals.recap, label: 'This situation' }}
        sections={[]}
        panels={[]}
      />
    </Shell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_D1_ROUTES: ExampleRoute[] = [
  { path: D1_ROUTES.draft, render: (phone) => <InvoiceDraft phone={phone} /> },
  { path: D1_ROUTES.specification, render: (phone) => <SpecificationEditor phone={phone} /> },
]
