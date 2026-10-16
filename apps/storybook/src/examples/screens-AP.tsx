import { Ban, BookCheck, HandCoins } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  ActionGroup,
  Button,
  DataTable,
  DateField,
  DateText,
  DetailPage,
  Dialog,
  FilterBar,
  IrreversibleConfirmDialog,
  KeyValueList,
  ListPage,
  MoneyField,
  MoneyText,
  PeriodicRunPage,
  SelectField,
  StatusBadge,
  toneFor,
  Toaster,
  notice,
  useLiro,
  type ActionItem,
  type DataTableColumn,
  type DataTableFilters,
  type FilterDefinition,
  type ModuleTab,
  type RunCheck,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell } from './example-shell'
import { useExampleState } from './example-state'
import { Tenant } from './screens-G'
import {
  AP_ROUTES,
  AP_TODAY,
  ASSET_TONES,
  ASSETS,
  BUYERS,
  DISPOSAL_REASONS,
  GROUPS,
  HISTORIES,
  inRegisterView,
  REGISTER_VIEWS,
  RERUN_REASONS,
  RUN_LINES,
  RUN_PERIOD,
  RUN_STEPS,
  RUN_TOTALS,
  SALE_INVOICE,
  SCHEDULE_TONES,
  SCHEDULE_TOTALS,
  SCHEDULES,
  type AssetState,
  type FixedAsset,
  type HistoryRow,
  type RegisterView,
  type RunLine,
  type ScheduleRow,
  type ScheduleState,
} from './data-AP'
import { AS_ROUTES } from './data-AS'

/*
 * Group AP's example screens (P5.47, fixed assets): Kvadrat Gradnja d.o.o. on 14 October 2026,
 * its books kept by Knjigovodstvo Jelić.
 * - The register (ListPage): every asset with its group, location, responsible person,
 *   acquisition, acquisition value, book value after the last posted depreciation and its state in
 *   words; views "In the register", "Disposed and sold", "All"; search and a filter by group.
 * - The asset card (DetailPage): the key figures (acquisition value, accumulated depreciation,
 *   book value, the rate), the acquisition with the supplier's document and the financing (a link
 *   to the loan, group AS), the location and the responsible person, the depreciation group, the
 *   value history and the year's depreciation schedule month by month (tables from data); "Sell…"
 *   (a dialog: the buyer, the date, the price; the application makes the sales invoice) and
 *   "Dispose…" (an irreversible confirmation with the reason and the asset's number typed). A sold
 *   asset shows its sale and the invoice.
 * - The September 2026 depreciation run (PeriodicRunPage): the period's lock, the steps, the
 *   checks in words, the preview before posting (the figures and every asset's line), Rerun with a
 *   reason.
 * The screens play the application: the assets live above the screens (`useExampleState`), so a
 * disposal or a sale shows in the register; every figure comes from data-AP.ts (D4).
 */

export { AP_ROUTES }

// ── Shared pieces ─────────────────────────────────────────────────────────────────────────────

type AssetsTab = 'register' | 'run'

function assetTabs(current: AssetsTab): ModuleTab[] {
  return [
    {
      key: 'register',
      label: 'Fixed assets',
      href: `#${AP_ROUTES.register}`,
      current: current === 'register',
    },
    {
      key: 'run',
      label: 'Depreciation',
      href: `#${AP_ROUTES.run}`,
      current: current === 'run',
    },
  ]
}

function AssetsShell({
  phone,
  tab,
  crumbs,
  bottomBar,
  children,
}: {
  phone: boolean
  tab: AssetsTab
  crumbs: { label: string; href?: string }[]
  bottomBar?: ReactNode
  children: ReactNode
}) {
  return (
    <Tenant today={AP_TODAY}>
      <Shell
        phone={phone}
        crumbs={crumbs}
        tabs={assetTabs(tab)}
        {...(bottomBar === undefined ? {} : { bottomBar })}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

/** The assets as the application keeps them, above the screens. */
function useAssets() {
  return useExampleState<readonly FixedAsset[]>('AP.assets', () => ASSETS)
}

function stateBadge(state: AssetState) {
  return <StatusBadge label={state} tone={toneFor(state, ASSET_TONES)} />
}

function money(value: string | null) {
  return <MoneyText value={value} currency="RSD" />
}

/** "September 2026" from "2026-09", through the provider's month names. */
function useMonthText() {
  const { format } = useLiro()
  return (month: string) => {
    const [year = '', number = '1'] = month.split('-')
    return `${format.monthName(Number(number), 'long')} ${year}`
  }
}

/** A link through the provider's linkComponent, in the link colour. */
function RecordLink({ href, children }: { href: string; children: ReactNode }) {
  const { linkComponent: Link } = useLiro()
  return (
    <Link href={href} className="bidi-isolate text-link no-underline hover:underline">
      {children}
    </Link>
  )
}

// ── The register ──────────────────────────────────────────────────────────────────────────────

const GROUP_OPTIONS = Object.values(GROUPS).map((group) => ({
  value: group.id,
  label: group.label,
}))

const REGISTER_FILTERS: FilterDefinition[] = [
  { id: 'group', label: 'Depreciation group', type: 'select', options: GROUP_OPTIONS },
]

function matchesAsset(asset: FixedAsset, search: string, filters: DataTableFilters): boolean {
  const query = search.trim().toLocaleLowerCase('sr-Latn')
  if (
    query !== '' &&
    ![asset.number, asset.name, asset.location, asset.responsible].some((text) =>
      text.toLocaleLowerCase('sr-Latn').includes(query),
    )
  ) {
    return false
  }
  const group = filters.group
  return typeof group !== 'string' || group === '' || group === asset.group
}

const REGISTER_COLUMNS: DataTableColumn<FixedAsset>[] = [
  {
    id: 'asset',
    header: 'Asset',
    minWidth: 240,
    cell: (asset) => (
      <span className="flex flex-col gap-0.5">
        <span className="bidi-content font-medium">{asset.name}</span>
        <span className="bidi-isolate text-xs text-secondary">{asset.number}</span>
      </span>
    ),
  },
  { id: 'group', header: 'Group', cell: (asset) => GROUPS[asset.group].label },
  {
    id: 'location',
    header: 'Location',
    minWidth: 160,
    cell: (asset) => (
      <span className="flex flex-col gap-0.5">
        <span className="bidi-content">{asset.location}</span>
        <span className="bidi-content text-xs text-secondary">{asset.responsible}</span>
      </span>
    ),
  },
  {
    id: 'acquired',
    header: 'Acquired',
    numeric: true,
    cell: (asset) => <DateText value={asset.acquired} />,
  },
  {
    id: 'value',
    header: 'Acquisition value',
    numeric: true,
    cell: (asset) => money(asset.value),
  },
  {
    id: 'book',
    header: 'Book value',
    numeric: true,
    cell: (asset) => (asset.disposal === undefined ? money(asset.book) : money(null)),
  },
  { id: 'state', header: 'State', cell: (asset) => stateBadge(asset.state) },
]

export function AssetRegister({ phone, view: startView }: { phone: boolean; view?: RegisterView }) {
  const navigate = useContext(Navigate)
  const [assets] = useAssets()
  const [view, setView] = useState<RegisterView>(startView ?? 'inUse')
  const [filters, setFilters] = useState<DataTableFilters>({})
  const [search, setSearch] = useState('')
  const rows = assets.filter(
    (asset) => inRegisterView(asset, view) && matchesAsset(asset, search, filters),
  )
  return (
    <AssetsShell
      phone={phone}
      tab="register"
      crumbs={[{ label: 'Accounting' }, { label: 'Fixed assets' }]}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Fixed assets"
        views={REGISTER_VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: assets.filter((asset) => inRegisterView(asset, each.id)).length,
        }))}
        view={view}
        onViewChange={(id) => {
          setView(id as RegisterView)
        }}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={REGISTER_FILTERS}
            inline={1}
            values={filters}
            onValuesChange={setFilters}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Number, name, location or person"
          />
        }
      >
        <DataTable
          label="Fixed assets"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={REGISTER_COLUMNS}
          rows={rows}
          getRowId={(asset) => asset.number}
          getRowLabel={(asset) => `${asset.number} ${asset.name}`}
          filters={{ ...filters, search }}
          onFiltersChange={() => {
            setFilters({})
            setSearch('')
          }}
          count={rows.length}
          onRowClick={(asset) => {
            navigate(AP_ROUTES.asset(asset.number))
          }}
          rowLimitMessage="Book values after the August 2026 depreciation; September's is in review."
          mobile={{
            title: (asset) => asset.name,
            subtitle: (asset) => (
              <span className="bidi-content">{`${asset.number} · ${asset.location}`}</span>
            ),
            badge: (asset) => stateBadge(asset.state),
            details: ['value', 'book'],
          }}
        />
      </ListPage>
    </AssetsShell>
  )
}

// ── The asset card ────────────────────────────────────────────────────────────────────────────

/** A change with its sign ("+6.840.000,00 RSD", "−57.000,00 RSD"); "—" for none. */
function SignedMoney({ value }: { value: string | null }) {
  const { format } = useLiro()
  if (value === null) return '—'
  return <bdi className="tabular-nums">{format.money(value, 'RSD', { sign: 'always' })}</bdi>
}

const HISTORY_COLUMNS: DataTableColumn<HistoryRow>[] = [
  { id: 'date', header: 'Date', numeric: true, cell: (row) => <DateText value={row.date} /> },
  {
    id: 'event',
    header: 'Event',
    minWidth: 220,
    cell: (row) => <span className="bidi-content">{row.event}</span>,
  },
  {
    id: 'change',
    header: 'Change',
    numeric: true,
    cell: (row) => <SignedMoney value={row.change} />,
  },
  {
    id: 'accumulated',
    header: 'Accumulated depreciation',
    numeric: true,
    cell: (row) => money(row.accumulated),
  },
  { id: 'book', header: 'Book value', numeric: true, cell: (row) => money(row.book) },
]

function scheduleBadge(state: ScheduleState) {
  return <StatusBadge label={state} tone={toneFor(state, SCHEDULE_TONES)} />
}

function MonthText({ month }: { month: string }) {
  const monthText = useMonthText()
  return <span className="bidi-content">{monthText(month)}</span>
}

const SCHEDULE_COLUMNS: DataTableColumn<ScheduleRow>[] = [
  { id: 'month', header: 'Month', cell: (row) => <MonthText month={row.month} /> },
  {
    id: 'depreciation',
    header: 'Depreciation',
    numeric: true,
    cell: (row) => money(row.depreciation),
  },
  {
    id: 'accumulated',
    header: 'Accumulated',
    numeric: true,
    cell: (row) => money(row.accumulated),
  },
  { id: 'book', header: 'Book value', numeric: true, cell: (row) => money(row.book) },
  { id: 'state', header: 'State', cell: (row) => scheduleBadge(row.state) },
]

/** The sale's fields, as the application keeps them while the dialog is open. */
interface SaleDraft {
  buyer: string
  date: string | null
  price: string | null
}

export function AssetCard({
  phone,
  number,
  ask,
}: {
  phone: boolean
  number: string
  ask?: 'dispose' | 'sell'
}) {
  const { format } = useLiro()
  const monthText = useMonthText()
  const [assets, setAssets] = useAssets()
  const [disposing, setDisposing] = useState(ask === 'dispose')
  const [selling, setSelling] = useState(ask === 'sell')
  const [sale, setSale] = useState<SaleDraft>({ buyer: '', date: AP_TODAY, price: null })
  const [saleErrors, setSaleErrors] = useState<{ buyer?: string; price?: string }>({})
  const asset = assets.find((each) => each.number === number)
  if (asset === undefined) return null
  const group = GROUPS[asset.group]
  const gone = asset.disposal !== undefined
  const history = HISTORIES[asset.number] ?? []
  const schedule = SCHEDULES[asset.number] ?? []
  const subject = `${asset.number} · ${asset.name}`

  const replace = (next: FixedAsset) => {
    setAssets((current) => current.map((each) => (each.number === next.number ? next : each)))
  }
  const actions: ActionItem[] = gone
    ? []
    : [
        {
          key: 'dispose',
          family: 'destructive',
          icon: Ban,
          label: 'Dispose…',
          onClick: () => {
            setDisposing(true)
          },
        },
        {
          key: 'sell',
          family: 'neutral',
          icon: HandCoins,
          label: 'Sell…',
          onClick: () => {
            setSelling(true)
          },
        },
      ]
  const sell = () => {
    const errors = {
      ...(sale.buyer === '' ? { buyer: 'Choose the buyer.' } : {}),
      ...(sale.price === null ? { price: 'Enter the price without VAT.' } : {}),
    }
    setSaleErrors(errors)
    if (Object.keys(errors).length > 0 || sale.price === null) return
    const buyer = BUYERS.find((each) => each.value === sale.buyer)?.label ?? ''
    replace({
      ...asset,
      state: 'Sold',
      book: '0.00',
      disposal: {
        date: sale.date ?? AP_TODAY,
        text: `Sold to ${buyer}`,
        detail: `Sold for ${format.money(sale.price, 'RSD')} without VAT. The book value and the result are posted with the invoice.`,
        invoice: SALE_INVOICE,
      },
    })
    setSelling(false)
    notice.success(`${asset.number} sold. Draft invoice ${SALE_INVOICE} is ready.`)
  }

  return (
    <AssetsShell
      phone={phone}
      tab="register"
      crumbs={[{ label: 'Fixed assets', href: `#${AP_ROUTES.register}` }, { label: asset.number }]}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={asset.name}
        back={{ href: `#${AP_ROUTES.register}`, label: 'Fixed assets' }}
        status={stateBadge(asset.state)}
        subtitle={<span className="bidi-content">{`${asset.number} · ${group.label}`}</span>}
        {...(actions.length === 0 ? {} : { actions: <ActionGroup actions={actions} /> })}
        keyFigures={[
          { key: 'value', label: 'Acquisition value', value: money(asset.value) },
          {
            key: 'accumulated',
            label: 'Accumulated depreciation',
            value: money(asset.accumulated),
          },
          { key: 'book', label: 'Book value', value: money(gone ? null : asset.book) },
          {
            key: 'rate',
            label: 'Depreciation rate',
            value: `${format.percent(group.rate)} a year`,
          },
        ]}
        sections={[
          ...(asset.disposal === undefined
            ? []
            : [
                {
                  id: 'disposal',
                  label: asset.state === 'Sold' ? 'Sale' : 'Disposal',
                  content: (
                    <KeyValueList
                      columns={phone ? 1 : 2}
                      items={[
                        {
                          key: 'date',
                          label: 'Date',
                          value: <DateText value={asset.disposal.date} />,
                          numeric: true,
                        },
                        {
                          key: 'what',
                          label: asset.state === 'Sold' ? 'Buyer' : 'Reason',
                          value: asset.disposal.text,
                        },
                        ...(asset.disposal.invoice === undefined
                          ? []
                          : [
                              {
                                key: 'invoice',
                                label: 'Sales invoice',
                                value: (
                                  <RecordLink href={`#/sales/invoices/${asset.disposal.invoice}`}>
                                    {asset.disposal.invoice}
                                  </RecordLink>
                                ),
                              },
                            ]),
                        {
                          key: 'detail',
                          label: 'Result',
                          value: asset.disposal.detail,
                          fullWidth: true,
                        },
                      ]}
                    />
                  ),
                },
              ]),
          {
            id: 'acquisition',
            label: 'Acquisition',
            content: (
              <KeyValueList
                columns={phone ? 1 : 2}
                items={[
                  {
                    key: 'acquired',
                    label: 'Acquired',
                    value: <DateText value={asset.acquired} />,
                    numeric: true,
                  },
                  {
                    key: 'in-use',
                    label: 'In use since',
                    value:
                      asset.inUse === null ? 'Not yet in use' : <DateText value={asset.inUse} />,
                    numeric: asset.inUse !== null,
                  },
                  { key: 'supplier', label: 'Supplier', value: asset.supplier },
                  {
                    key: 'document',
                    label: 'Supplier’s document',
                    value: (
                      <RecordLink href={`#/purchasing/documents/${asset.document}`}>
                        {asset.document}
                      </RecordLink>
                    ),
                  },
                  {
                    key: 'value',
                    label: 'Acquisition value, without VAT',
                    value: money(asset.value),
                    numeric: true,
                  },
                  ...(asset.financing === undefined
                    ? []
                    : [
                        {
                          key: 'financing',
                          label: 'Financed by',
                          value: (
                            <RecordLink href={`#${AS_ROUTES.contract(asset.financing)}`}>
                              {asset.financing.startsWith('LZ') ? 'Lease' : 'Loan'}{' '}
                              {asset.financing}
                            </RecordLink>
                          ),
                        },
                      ]),
                ]}
              />
            ),
          },
          {
            id: 'place',
            label: 'Location and responsibility',
            content: (
              <KeyValueList
                columns={phone ? 1 : 2}
                items={[
                  { key: 'location', label: 'Location', value: asset.location },
                  { key: 'centre', label: 'Cost centre', value: asset.costCentre },
                  {
                    key: 'responsible',
                    label: 'Responsible person',
                    value: `${asset.responsible}, ${asset.role}`,
                  },
                  ...(asset.serial === undefined
                    ? []
                    : [
                        {
                          key: 'serial',
                          label: 'Serial number',
                          value: <bdi dir="ltr">{asset.serial}</bdi>,
                        },
                      ]),
                ]}
              />
            ),
          },
          {
            id: 'depreciation',
            label: 'Depreciation',
            description: 'Straight line, monthly from the month after the asset is put into use.',
            content: (
              <KeyValueList
                columns={phone ? 1 : 2}
                items={[
                  { key: 'group', label: 'Depreciation group', value: group.label },
                  {
                    key: 'rate',
                    label: 'Rate',
                    value: `${format.percent(group.rate)} a year (illustrative)`,
                  },
                  { key: 'life', label: 'Useful life', value: group.life },
                  {
                    key: 'monthly',
                    label: 'Monthly depreciation',
                    value: money(asset.monthly),
                    numeric: true,
                  },
                  { key: 'account', label: 'Asset account', value: <bdi>{group.account}</bdi> },
                  {
                    key: 'by',
                    label: 'Fully depreciated',
                    value: asset.depreciatedBy ?? '—',
                  },
                ]}
              />
            ),
          },
          {
            id: 'history',
            label: 'Value history',
            flush: true,
            content: (
              <DataTable
                label={`Value history of ${asset.number}`}
                layout={phone ? 'cards' : 'table'}
                inCard
                columns={HISTORY_COLUMNS}
                rows={history}
                getRowId={(row) => row.id}
                getRowLabel={(row) => row.event}
                mobile={{
                  title: (row) => <span className="bidi-content">{row.event}</span>,
                  subtitle: (row) => <DateText value={row.date} />,
                  details: ['change', 'book'],
                }}
              />
            ),
          },
          {
            id: 'schedule',
            label: 'Depreciation schedule 2026',
            flush: true,
            content: (
              <DataTable
                label={`Depreciation schedule 2026 of ${asset.number}`}
                layout={phone ? 'cards' : 'table'}
                inCard
                columns={SCHEDULE_COLUMNS}
                rows={schedule}
                getRowId={(row) => row.month}
                getRowLabel={(row) => monthText(row.month)}
                {...(schedule.length === 0
                  ? {}
                  : {
                      totalsLabel: <span className="bidi-isolate">Total 2026</span>,
                      totals: { depreciation: money(SCHEDULE_TOTALS[asset.number] ?? null) },
                    })}
                mobile={{
                  title: (row) => <MonthText month={row.month} />,
                  badge: (row) => scheduleBadge(row.state),
                  details: ['depreciation', 'book'],
                }}
              />
            ),
          },
        ]}
      />
      <IrreversibleConfirmDialog
        open={disposing}
        onOpenChange={setDisposing}
        family="destructive"
        actionIcon={Ban}
        title="Dispose of asset"
        subject={subject}
        message={`The asset leaves the register today. Its book value of ${format.money(asset.book, 'RSD')} is written off as an expense. A disposal cannot be undone.`}
        reason={{ reasons: DISPOSAL_REASONS, label: 'Reason for the disposal' }}
        confirmText={asset.number}
        confirmLabel="Dispose"
        onConfirm={(answer) => {
          const reason = DISPOSAL_REASONS.find((each) => each.value === answer.reason)
          replace({
            ...asset,
            state: 'Disposed',
            book: '0.00',
            disposal: {
              date: AP_TODAY,
              text: answer.text === '' ? (reason?.label ?? '') : answer.text,
              detail: `Book value of ${format.money(asset.book, 'RSD')} written off.`,
            },
          })
          notice.success(`${asset.number} disposed.`)
        }}
      />
      <Dialog
        open={selling}
        onOpenChange={setSelling}
        title="Sell asset"
        subject={subject}
        description="The application makes a draft sales invoice to the buyer and posts the sale with it."
        actions={
          <>
            <Button
              intent="cancel"
              label="Cancel"
              onClick={() => {
                setSelling(false)
              }}
            />
            <Button
              family="primary"
              icon={HandCoins}
              emphasis="primary"
              label="Sell and make the invoice"
              onClick={sell}
            />
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <SelectField
            label="Buyer"
            required
            options={BUYERS}
            placeholder="Choose the buyer"
            value={sale.buyer}
            onChange={(buyer) => {
              setSale((current) => ({ ...current, buyer }))
            }}
            {...(saleErrors.buyer === undefined ? {} : { error: saleErrors.buyer })}
          />
          <DateField
            label="Date of sale"
            required
            value={sale.date}
            onChange={(date) => {
              setSale((current) => ({ ...current, date }))
            }}
          />
          <MoneyField
            label="Price without VAT"
            required
            currency="RSD"
            description={`Book value today: ${format.money(asset.book, 'RSD')}.`}
            value={sale.price}
            onChange={(price) => {
              setSale((current) => ({ ...current, price }))
            }}
            {...(saleErrors.price === undefined ? {} : { error: saleErrors.price })}
          />
        </div>
      </Dialog>
    </AssetsShell>
  )
}

// ── The September 2026 depreciation run ───────────────────────────────────────────────────────

interface RunRow extends RunLine {
  asset: FixedAsset | undefined
}

const RUN_COLUMNS: DataTableColumn<RunRow>[] = [
  {
    id: 'asset',
    header: 'Asset',
    minWidth: 220,
    cell: (row) => (
      <span className="flex flex-col gap-0.5">
        <span className="bidi-content font-medium">{row.asset?.name}</span>
        <span className="bidi-isolate text-xs text-secondary">{row.number}</span>
      </span>
    ),
  },
  {
    id: 'group',
    header: 'Group',
    cell: (row) => (row.asset === undefined ? '' : GROUPS[row.asset.group].label),
  },
  {
    id: 'depreciation',
    header: 'Depreciation',
    numeric: true,
    cell: (row) => money(row.depreciation),
  },
  {
    id: 'accumulated',
    header: 'Accumulated after',
    numeric: true,
    cell: (row) => money(row.accumulated),
  },
  { id: 'book', header: 'Book value after', numeric: true, cell: (row) => money(row.book) },
]

const RUN_ROWS: RunRow[] = RUN_LINES.map((line) => ({
  ...line,
  asset: ASSETS.find((each) => each.number === line.number),
}))

export function DepreciationRun({ phone, rerun: startRerun }: { phone: boolean; rerun?: string }) {
  const { format, linkComponent: Link } = useLiro()
  const [rerun, setRerun] = useState<string | null>(startRerun ?? null)
  const running = rerun !== null
  const checks: RunCheck[] = [
    {
      id: 'groups',
      label: 'Every asset in use has a depreciation group',
      result: 'passed',
      detail: `${format.number(RUN_TOTALS.inRegister)} of ${format.number(RUN_TOTALS.inRegister)} assets`,
    },
    {
      id: 'new',
      label: 'Acquisitions put into use',
      result: 'warning',
      detail:
        'OS-0151 Laptop Dell Latitude 5550, acquired 22.09.2026, is not in use yet: no depreciation this month.',
      action: (
        <Link
          href={`#${AP_ROUTES.asset('OS-0151')}`}
          className="bidi-isolate text-sm text-link no-underline hover:underline"
        >
          Open OS-0151
        </Link>
      ),
    },
    {
      id: 'disposals',
      label: 'Disposals and sales recorded',
      result: 'passed',
      detail: 'OS-0098 sold on 30.09.2026: depreciated through September.',
    },
    {
      id: 'full',
      label: 'Fully depreciated assets left out',
      result: 'passed',
      detail: 'OS-0031 reached a book value of 0,00 in August.',
    },
    { id: 'entry', label: `Journal entry ${RUN_TOTALS.entry} balanced`, result: 'notRun' },
  ]
  const post = (
    <Button
      family="primary"
      icon={BookCheck}
      emphasis="primary"
      label="Post depreciation"
      onClick={() => {
        notice.success(`Depreciation ${RUN_PERIOD} posted as ${RUN_TOTALS.entry}.`)
      }}
    />
  )
  return (
    <AssetsShell
      phone={phone}
      tab="run"
      crumbs={[
        { label: 'Fixed assets', href: `#${AP_ROUTES.register}` },
        { label: `Depreciation ${RUN_PERIOD}` },
      ]}
      {...(phone && !running ? { bottomBar: post } : {})}
    >
      <PeriodicRunPage
        layout={phone ? 'phone' : 'desktop'}
        title={`Depreciation ${RUN_PERIOD}`}
        back={{ href: `#${AP_ROUTES.register}`, label: 'Fixed assets' }}
        status={<StatusBadge label={running ? 'Calculating' : 'In review'} tone="info" />}
        subtitle={`${format.number(RUN_TOTALS.depreciated)} of ${format.number(RUN_TOTALS.inRegister)} assets · straight line, illustrative rates`}
        steps={RUN_STEPS}
        active={running ? 1 : 2}
        lock={{
          state: 'open',
          detail: 'Opened by Snežana Jelić (Knjigovodstvo Jelić) on 01.10.2026.',
        }}
        {...(running
          ? {
              progress: {
                label: 'Calculating depreciation',
                value: 0,
                max: Number(RUN_TOTALS.inRegister),
                current: rerun,
              },
            }
          : {
              checks,
              ...(phone ? {} : { actions: post }),
              preview: {
                description: `Journal entry ${RUN_TOTALS.entry} is made from these figures: depreciation expense against the accumulated depreciation of each group's account.`,
                summary: (
                  <KeyValueList
                    columns={phone ? 1 : 2}
                    items={[
                      {
                        key: 'depreciation',
                        label: 'Depreciation September 2026',
                        value: money(RUN_TOTALS.depreciation),
                        numeric: true,
                      },
                      {
                        key: 'assets',
                        label: 'Assets depreciated',
                        value: `${format.number(RUN_TOTALS.depreciated)} of ${format.number(RUN_TOTALS.inRegister)}`,
                        numeric: true,
                      },
                      {
                        key: 'accumulated',
                        label: 'Accumulated depreciation after',
                        value: money(RUN_TOTALS.accumulated),
                        numeric: true,
                      },
                      {
                        key: 'book',
                        label: 'Book value after',
                        value: money(RUN_TOTALS.book),
                        numeric: true,
                      },
                    ]}
                  />
                ),
                table: (
                  <DataTable
                    label="Depreciation by asset"
                    columns={RUN_COLUMNS}
                    rows={RUN_ROWS}
                    getRowId={(row) => row.number}
                    getRowLabel={(row) => `${row.number} ${row.asset?.name ?? ''}`}
                    inCard
                    layout={phone ? 'cards' : 'table'}
                    totalsLabel="Total"
                    totals={{
                      depreciation: money(RUN_TOTALS.depreciation),
                      accumulated: money(RUN_TOTALS.accumulated),
                      book: money(RUN_TOTALS.book),
                    }}
                    mobile={{
                      title: (row) => row.asset?.name,
                      subtitle: (row) => <bdi>{row.number}</bdi>,
                      details: ['depreciation', 'book'],
                    }}
                  />
                ),
              },
            })}
        rerun={{
          title: 'Rerun depreciation',
          subject: RUN_PERIOD,
          message: 'The calculated figures of every asset are replaced. Nothing has been posted.',
          confirmLabel: 'Rerun',
          reasonLabel: 'Reason for the rerun',
          reasons: RERUN_REASONS,
          onConfirm: (answer) => {
            const reason = RERUN_REASONS.find((each) => each.value === answer.reason)
            setRerun(answer.text === '' ? (reason?.label ?? '') : answer.text)
          },
          ...(running ? { unavailableReason: 'The depreciation is being calculated.' } : {}),
        }}
      />
    </AssetsShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_AP_ROUTES: ExampleRoute[] = [
  { path: AP_ROUTES.register, render: (phone) => <AssetRegister phone={phone} /> },
  {
    path: AP_ROUTES.disposed,
    render: (phone) => <AssetRegister phone={phone} view="disposed" />,
  },
  ...ASSETS.map((asset) => ({
    path: AP_ROUTES.asset(asset.number),
    render: (phone: boolean) => <AssetCard phone={phone} number={asset.number} />,
  })),
  {
    path: AP_ROUTES.dispose,
    render: (phone) => <AssetCard phone={phone} number="OS-0142" ask="dispose" />,
  },
  {
    path: AP_ROUTES.sell,
    render: (phone) => <AssetCard phone={phone} number="OS-0142" ask="sell" />,
  },
  { path: AP_ROUTES.run, render: (phone) => <DepreciationRun phone={phone} /> },
  {
    path: AP_ROUTES.runRerun,
    render: (phone) => (
      <DepreciationRun phone={phone} rerun="Rerun: an acquisition was added (OS-0151)" />
    ),
  },
]
