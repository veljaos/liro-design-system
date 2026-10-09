import { Ban, FileSpreadsheet, RotateCcw } from 'lucide-react'
import { useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Alert,
  BulkEditDrawer,
  Button,
  DataTable,
  DateText,
  DuplicateWarning,
  FilterBar,
  ImportWizard,
  ListPage,
  LookupDialog,
  MoneyField,
  MoneyText,
  NumberText,
  PageHeader,
  PeriodField,
  QuickPreview,
  RegisterPage,
  SelectField,
  StatusBadge,
  StatutoryFormPage,
  useLiro,
  type BulkEditField,
  type DataTableColumn,
  type DataTableFilters,
  type DateRange,
  type FilterDefinition,
  type ImportMapping,
  type ImportStep,
  type ModuleTab,
  type StatutoryOverride,
  type StatutoryRule,
  type StatutorySection,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { HR_TABS, Navigate, SALES_TABS, Shell, statusBadge } from './example-shell'
import {
  allCustomers,
  csvColumns,
  CUSTOMER_FIELDS,
  IMPORT_COUNTS,
  IMPORT_FILE_DESCRIPTION,
  IMPORT_PREVIEW,
  IMPORT_SUGGESTION,
  INJURIES,
  manyInjuries,
  searchCustomers,
  SEPTEMBER_PURCHASES_20,
  SEPTEMBER_SALES_20,
  vatAt20,
  VAT_RETURN,
  type Customer,
  type Injury,
} from './data-E'
import { decimal, paras } from '../../../../packages/ui/src/components/amounts-story-data'

/*
 * Group E's example screens (P5.19 catalogues at scale, P5.20 registers and official forms):
 * the customer catalogue with its lookup, bulk edit and import, the VAT return for September
 * 2026, and the work-injury register for 2026. Only the public entry point `@veljaos/ui`.
 */

export const E_ROUTES = {
  customers: '/sales/customers',
  customerImport: '/sales/customers/import',
  vatReturn: '/accounting/vat-return/2026-09',
  injuryRegister: '/hr/safety/injury-register/2026',
  /** The stress story: 5,000 generated entries. */
  injuryRegisterGenerated: '/hr/safety/injury-register/2026-generated',
}

const CUSTOMER_TABS: ModuleTab[] = SALES_TABS.map((tab) => ({
  ...tab,
  current: tab.key === 'customers',
}))

const SAFETY_TABS: ModuleTab[] = [
  ...HR_TABS.map((tab) => ({ ...tab, current: false })),
  { key: 'safety', label: 'Safety at work', href: `#${E_ROUTES.injuryRegister}`, current: true },
]

const ACCOUNTING_TABS: ModuleTab[] = [
  { key: 'journal', label: 'Journal', href: '#/accounting/journal' },
  { key: 'vat', label: 'VAT returns', href: `#${E_ROUTES.vatReturn}`, current: true },
  { key: 'registers', label: 'Registers', href: '#/accounting/registers' },
]

// ── Customers ─────────────────────────────────────────────────────────────────────────────────

const inactiveBadge = <StatusBadge label="Inactive" tone="neutral" />

function CustomerName({ customer }: { customer: Customer }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span>{customer.name}</span>
      {!customer.active && inactiveBadge}
    </span>
  )
}

const CUSTOMER_COLUMNS: DataTableColumn<Customer>[] = [
  { id: 'name', header: 'Name', cell: (row) => <CustomerName customer={row} /> },
  { id: 'taxId', header: 'Tax number', numeric: true, cell: (row) => row.taxId },
  { id: 'city', header: 'City', cell: (row) => row.city },
  { id: 'group', header: 'Group', cell: (row) => row.group },
  {
    id: 'term',
    header: 'Payment term (days)',
    align: 'end',
    numeric: true,
    cell: (row) => <NumberText value={row.paymentTerm} decimals={0} />,
  },
  {
    id: 'balance',
    header: 'Open balance',
    align: 'end',
    numeric: true,
    cell: (row) => <MoneyText value={row.balance} currency="RSD" />,
  },
]

const CITY_OPTIONS = ['Novi Sad', 'Zrenjanin', 'Kać', 'Subotica', 'Niš', 'Inđija'].map((city) => ({
  value: city,
  label: city,
}))
const GROUP_OPTIONS = ['Construction companies', 'Wholesale', 'Retail'].map((group) => ({
  value: group,
  label: group,
}))
const TERM_OPTIONS = ['7', '15', '30', '45', '60'].map((days) => ({
  value: days,
  label: `${days} days`,
}))

const CUSTOMER_FILTERS: FilterDefinition[] = [
  { id: 'city', label: 'City', type: 'select', options: CITY_OPTIONS },
  { id: 'group', label: 'Group', type: 'select', options: GROUP_OPTIONS },
]

/** The catalogue with the application's changes (activation, bulk edits) kept above the list. */
function useCatalogue() {
  const [changes, setChanges] = useState<ReadonlyMap<string, Partial<Customer>>>(new Map())
  const all = useMemo(() => {
    const base = allCustomers()
    if (changes.size === 0) return base
    return base.map((customer) => {
      const change = changes.get(customer.id)
      return change === undefined ? customer : { ...customer, ...change }
    })
  }, [changes])
  const change = useCallback((ids: readonly string[], values: Partial<Customer>) => {
    setChanges((current) => {
      const next = new Map(current)
      for (const id of ids) next.set(id, { ...next.get(id), ...values })
      return next
    })
  }, [])
  return { all, change }
}

/** Matches a customer to the list's filters. */
function matchesFilters(customer: Customer, filters: DataTableFilters): boolean {
  const city = filters.city
  const group = filters.group
  if (typeof city === 'string' && city !== '' && customer.city !== city) return false
  if (typeof group === 'string' && group !== '' && customer.group !== group) return false
  return true
}

export function Customers({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const { all, change } = useCatalogue()
  const [view, setView] = useState('active')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<DataTableFilters>({})
  const [selection, setSelection] = useState<string[]>([])
  const [preview, setPreview] = useState<Customer | null>(null)
  const [lookupOpen, setLookupOpen] = useState(false)
  const [lookupQuery, setLookupQuery] = useState('')
  const [lookupFilters, setLookupFilters] = useState<DataTableFilters>({})
  const [lookupCursor, setLookupCursor] = useState(0)
  const [editing, setEditing] = useState(false)
  const [changing, setChanging] = useState<string[]>([])
  const [term, setTerm] = useState('30')
  const [group, setGroup] = useState('')

  const counts = useMemo(() => {
    const active = all.filter((customer) => customer.active).length
    return { active, inactive: all.length - active, all: all.length }
  }, [all])
  const rows = useMemo(() => {
    const inView = all.filter((customer) =>
      view === 'all' ? true : view === 'active' ? customer.active : !customer.active,
    )
    return searchCustomers(inView, search).filter((customer) => matchesFilters(customer, filters))
  }, [all, view, search, filters])

  // The lookup's own search over the whole catalogue (the application's work), 25 per page.
  const found = useMemo(
    () =>
      searchCustomers(all, lookupQuery).filter(
        (customer) =>
          (lookupFilters.inactive === true || customer.active) &&
          matchesFilters(customer, lookupFilters),
      ),
    [all, lookupQuery, lookupFilters],
  )
  const onLookupSearch = useCallback((query: string) => {
    setLookupQuery(query)
    setLookupCursor(0)
  }, [])

  const count = selection.length
  const countText = format.number(String(count))
  const setActive = (ids: readonly string[], active: boolean) => {
    change(ids, { active })
    setSelection([])
  }
  const fields: BulkEditField[] = [
    {
      id: 'paymentTerm',
      label: 'Payment term',
      editor: (
        <SelectField
          label="Payment term"
          hideLabel
          options={TERM_OPTIONS}
          value={term}
          onChange={setTerm}
        />
      ),
      ...(term === '' ? {} : { valueText: `${term} days` }),
    },
    {
      id: 'group',
      label: 'Customer group',
      editor: (
        <SelectField
          label="Customer group"
          hideLabel
          options={GROUP_OPTIONS}
          value={group}
          onChange={setGroup}
        />
      ),
      ...(group === '' ? {} : { valueText: group }),
    },
  ]
  const newCustomer = <Button intent="create" label="New customer" />
  const importButton = (
    <Button
      intent="import"
      label="Import"
      onClick={() => {
        navigate(E_ROUTES.customerImport)
      }}
    />
  )
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Sales', href: '#/sales/invoices' }, { label: 'Customers' }]}
      tabs={CUSTOMER_TABS}
      bottomBar={newCustomer}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Customers"
        {...(phone
          ? {}
          : {
              actions: (
                <>
                  {importButton}
                  {newCustomer}
                </>
              ),
            })}
        views={[
          { id: 'active', label: 'Active', count: counts.active },
          { id: 'inactive', label: 'Inactive', count: counts.inactive },
          { id: 'all', label: 'All', count: counts.all },
        ]}
        view={view}
        onViewChange={(id) => {
          setView(id)
          setSelection([])
        }}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={CUSTOMER_FILTERS}
            inline={2}
            values={filters}
            onValuesChange={setFilters}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Name, tax number or city"
            actions={
              <>
                {/* INTEGRATION: LookupField (D1) opens this LookupDialog with onSearchAll. */}
                <Button
                  intent="view"
                  emphasis="secondary"
                  label="Search all…"
                  onClick={() => {
                    setLookupOpen(true)
                  }}
                />
                <Button intent="export" label="Export" />
              </>
            }
            phoneMenu={[
              {
                label: 'Search all…',
                onSelect: () => {
                  setLookupOpen(true)
                },
              },
              {
                label: 'Import',
                onSelect: () => {
                  navigate(E_ROUTES.customerImport)
                },
              },
              { label: 'Export', icon: FileSpreadsheet, onSelect: () => undefined },
            ]}
          />
        }
      >
        <DataTable
          label="Customers"
          layout={phone ? 'cards' : 'table'}
          inCard
          virtualize
          maxHeight={phone ? '520px' : '60dvh'}
          columns={CUSTOMER_COLUMNS}
          rows={rows}
          getRowId={(row) => row.id}
          getRowLabel={(row) => row.name}
          filters={{ ...filters, search }}
          onFiltersChange={() => {
            setFilters({})
            setSearch('')
          }}
          onRowClick={setPreview}
          count={rows.length}
          selection={selection}
          onSelectionChange={setSelection}
          onSelectAll={() => {
            setSelection(rows.map((row) => row.id))
          }}
          bulkActions={[
            {
              key: 'edit',
              intent: 'edit',
              label: `Edit ${countText} ${count === 1 ? 'record' : 'records'}`,
              onClick: () => {
                setChanging([])
                setEditing(true)
              },
            },
            view === 'inactive'
              ? {
                  key: 'activate',
                  family: 'positive',
                  icon: RotateCcw,
                  label: 'Activate',
                  confirm: true,
                  onClick: () => {
                    setActive(selection, true)
                  },
                }
              : {
                  key: 'deactivate',
                  family: 'caution',
                  icon: Ban,
                  label: 'Deactivate',
                  confirm: true,
                  onClick: () => {
                    setActive(selection, false)
                  },
                },
          ]}
          rowActions={(row) => [
            row.active
              ? {
                  label: 'Deactivate',
                  icon: Ban,
                  onSelect: () => {
                    setActive([row.id], false)
                  },
                }
              : {
                  label: 'Activate',
                  icon: RotateCcw,
                  onSelect: () => {
                    setActive([row.id], true)
                  },
                },
          ]}
          mobile={{
            subtitle: (row) => `PIB ${row.taxId} · ${row.city}`,
            badge: (row) => (row.active ? undefined : inactiveBadge),
            details: ['term', 'balance'],
          }}
        />
      </ListPage>
      {preview !== null && (
        <QuickPreview
          open
          onOpenChange={(isOpen) => {
            if (!isOpen) setPreview(null)
          }}
          title={preview.name}
          description={`PIB ${preview.taxId}`}
          items={[
            {
              label: 'Status',
              value: preview.active ? <StatusBadge label="Active" tone="success" /> : inactiveBadge,
            },
            { label: 'City', value: preview.city },
            { label: 'Group', value: preview.group },
            {
              label: 'Payment term (days)',
              value: <NumberText value={preview.paymentTerm} decimals={0} />,
              numeric: true,
            },
            {
              label: 'Open balance',
              value: <MoneyText value={preview.balance} currency="RSD" />,
              numeric: true,
            },
          ]}
          onOpenRecord={() => {
            setPreview(null)
          }}
        />
      )}
      <LookupDialog
        open={lookupOpen}
        onOpenChange={setLookupOpen}
        title="Customers"
        initialQuery={lookupQuery}
        onSearch={onLookupSearch}
        searchPlaceholder="Name, tax number or city"
        filters={[{ id: 'inactive', label: 'Show inactive', type: 'boolean' }, ...CUSTOMER_FILTERS]}
        filterValues={lookupFilters}
        onFilterValuesChange={(values) => {
          setLookupFilters(values)
          setLookupCursor(0)
        }}
        columns={CUSTOMER_COLUMNS}
        rows={found.slice(lookupCursor, lookupCursor + 25)}
        getRowId={(row) => row.id}
        getRowLabel={(row) => row.name}
        // The chosen customer shown in the list: its tax number in the search, every view.
        onChoose={(customer) => {
          setView('all')
          setFilters({})
          setSearch(customer.taxId)
        }}
        hasNext={lookupCursor + 25 < found.length}
        onNext={() => {
          setLookupCursor(lookupCursor + 25)
        }}
        hasPrevious={lookupCursor > 0}
        onPrevious={() => {
          setLookupCursor(Math.max(0, lookupCursor - 25))
        }}
        count={found.length}
        mobile={{
          subtitle: (row) => `PIB ${row.taxId} · ${row.city}`,
          badge: (row) => (row.active ? undefined : inactiveBadge),
          details: ['balance'],
        }}
        layout={phone ? 'phone' : 'desktop'}
      />
      <BulkEditDrawer
        open={editing}
        onOpenChange={setEditing}
        count={count}
        fields={fields}
        changing={changing}
        onChangingChange={setChanging}
        onApply={() => {
          change(selection, {
            ...(changing.includes('paymentTerm') ? { paymentTerm: term } : {}),
            ...(changing.includes('group') && group !== ''
              ? { group: group as Customer['group'] }
              : {}),
          })
          setSelection([])
        }}
      />
    </Shell>
  )
}

// ── Customer import ───────────────────────────────────────────────────────────────────────────

/** The import's rows imported per tick while it runs (the application's job, played here). */
const IMPORT_STEP_ROWS = 300

export function CustomerImport({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [step, setStep] = useState<ImportStep>('file')
  const [file, setFile] = useState<{ name: string; description: string } | undefined>(undefined)
  const [reading, setReading] = useState(false)
  const [columns, setColumns] = useState<ReturnType<typeof csvColumns>>([])
  const [mapping, setMapping] = useState<ImportMapping>({})
  const [problemsOnly, setProblemsOnly] = useState(false)
  const [skipInvalid, setSkipInvalid] = useState(false)
  const [done, setDone] = useState(0)
  const rows = problemsOnly ? IMPORT_PREVIEW.filter((row) => row.issues.length > 0) : IMPORT_PREVIEW
  const total = IMPORT_COUNTS.ready

  // The import runs as a job; its progress comes back in steps.
  useEffect(() => {
    if (step !== 'import' || done >= total) return
    const timer = window.setTimeout(() => {
      setDone(Math.min(total, done + IMPORT_STEP_ROWS))
    }, 150)
    return () => {
      window.clearTimeout(timer)
    }
  }, [step, done, total])

  const back = { href: '#/sales/customers', label: 'Customers' }
  return (
    <Shell
      phone={phone}
      crumbs={[{ label: 'Customers', href: '#/sales/customers' }, { label: 'Import' }]}
      tabs={CUSTOMER_TABS}
    >
      <div
        className={
          phone
            ? 'mx-auto box-border flex w-full max-w-content flex-col gap-4 p-4'
            : 'mx-auto box-border flex w-full max-w-content flex-col gap-6 p-6'
        }
      >
        <PageHeader
          title="Import customers"
          back={back}
          subtitle="Nothing is saved until the last step."
        />
        <ImportWizard
          layout={phone ? 'phone' : 'desktop'}
          step={step}
          onStepChange={setStep}
          accept=".csv,text/csv,.xlsx"
          acceptText="CSV (columns separated by ;) or Excel (.xlsx); the first row holds the column names"
          maxSize={10 * 1024 * 1024}
          maxSizeText="10 MB"
          onFileChoose={(chosen) => {
            setReading(true)
            void chosen.text().then((text) => {
              setColumns(csvColumns(text))
              setMapping(IMPORT_SUGGESTION)
              setFile({ name: chosen.name, description: IMPORT_FILE_DESCRIPTION })
              setReading(false)
            })
          }}
          {...(file === undefined ? {} : { file })}
          reading={reading}
          sourceColumns={columns}
          fields={CUSTOMER_FIELDS}
          mapping={mapping}
          onMappingChange={setMapping}
          suggested={Object.keys(IMPORT_SUGGESTION)}
          previewRows={rows}
          counts={IMPORT_COUNTS}
          problemsOnly={problemsOnly}
          onProblemsOnlyChange={setProblemsOnly}
          skipInvalid={skipInvalid}
          onSkipInvalidChange={setSkipInvalid}
          previewNotice={
            <DuplicateWarning
              title="3 rows match existing customers"
              message="Line 2 has the tax number of Panonija Agro d.o.o. Rows that match are not imported unless you choose to."
              matches={[
                {
                  key: 'panonija',
                  type: 'Customer',
                  number: 'Panonija Agro d.o.o.',
                  href: '#/sales/customers',
                  status: <StatusBadge label="Active" tone="success" />,
                },
              ]}
              onCreateAnyway={() => undefined}
              createAnywayLabel="Import anyway"
            />
          }
          onImport={() => {
            setDone(0)
            setStep('import')
          }}
          progress={{ done, total }}
          {...(done >= total
            ? {
                result: (
                  <div className="flex flex-col items-start gap-4">
                    <Alert tone="success" title="1.198 customers imported">
                      12 rows with errors were skipped; 3 rows that match existing customers were
                      not imported.
                    </Alert>
                    <Button
                      intent="next"
                      label="Go to customers"
                      onClick={() => {
                        navigate(E_ROUTES.customers)
                      }}
                    />
                  </div>
                ),
              }
            : {})}
          onCancel={() => {
            navigate(E_ROUTES.customers)
          }}
        />
      </div>
    </Shell>
  )
}

// ── VAT return ────────────────────────────────────────────────────────────────────────────────

const STATES: Record<string, ReactNode> = {
  Sent: statusBadge('Sent'),
  Overdue: statusBadge('Overdue'),
  Paid: statusBadge('Paid'),
  'Query sent': statusBadge('Query sent'),
  'To approve': statusBadge('To approve'),
}

const IVANA: StatutoryOverride = {
  computed: VAT_RETURN.inputVat.computed,
  by: 'Ivana Stojanović',
  at: '05.10.2026. 14:12',
}

function vatRules(input: string, money: (value: string) => string): StatutoryRule[] {
  const failed = input !== VAT_RETURN.inputTotal.current
  return [
    { id: 'r1', text: '5.1 must equal 3.2 + 4.2', fields: ['5.1'], result: 'passed' },
    { id: 'r2', text: '5.2 must equal 3.6 + 4.6', fields: ['5.2'], result: 'passed' },
    { id: 'r3', text: '3.6 must be 20% of 3.2', fields: ['3.6'], result: 'passed' },
    {
      id: 'r4',
      text: '8e.6 must equal 8a.2 + 8b.2',
      fields: ['8e.6', '8a.2'],
      result: failed ? 'failed' : 'passed',
      ...(failed
        ? { detail: `Difference: ${money(subtract(VAT_RETURN.inputTotal.current, input))}` }
        : {}),
    },
    { id: 'r5', text: '10.1 must equal 5.2 − 8e.6', fields: ['10.1'], result: 'passed' },
  ]
}

/** One amount less another in whole paras (the Core's check, played here). */
function subtract(value: string, less: string): string {
  return decimal(paras(value) - paras(less))
}

function vatSections(
  input: string,
  override: StatutoryOverride | undefined,
  editor: ReactNode,
): StatutorySection[] {
  const invoice = (number: string) => `#/sales/invoices/${number}`
  return [
    {
      key: '2',
      title: '2. Exempt supplies without the right to deduct',
      fields: [
        {
          id: '2.1',
          number: '2.1',
          label: 'Exempt supplies (returnable deposits)',
          value: VAT_RETURN.exempt.current,
          previous: VAT_RETURN.exempt.previous,
          sources: [
            {
              key: 'F-2026-0412',
              type: 'Invoice · Panonija Agro d.o.o.',
              number: 'F-2026-0412',
              href: invoice('F-2026-0412'),
              date: '2026-09-28',
              amount: VAT_RETURN.exempt.current,
              status: STATES.Sent,
            },
          ],
        },
      ],
    },
    {
      key: '3',
      title: '3. Taxable supplies at the general rate (20%)',
      fields: [
        {
          id: '3.2',
          number: '3.2',
          label: 'Tax base',
          value: VAT_RETURN.base20.current,
          previous: VAT_RETURN.base20.previous,
          sources: SEPTEMBER_SALES_20.map((sale) => ({
            key: sale.number,
            type: `Invoice · ${sale.customer}`,
            number: sale.number,
            href: invoice(sale.number),
            date: sale.date,
            amount: sale.base,
            status: STATES[sale.status],
          })),
        },
        {
          id: '3.6',
          number: '3.6',
          label: 'VAT',
          value: VAT_RETURN.vat20.current,
          previous: VAT_RETURN.vat20.previous,
          sources: SEPTEMBER_SALES_20.map((sale) => ({
            key: sale.number,
            type: `Invoice · ${sale.customer}`,
            number: sale.number,
            href: invoice(sale.number),
            date: sale.date,
            amount: vatAt20(sale.base),
            status: STATES[sale.status],
          })),
        },
      ],
    },
    {
      key: '4',
      title: '4. Taxable supplies at the special rate (10%)',
      fields: [
        {
          id: '4.2',
          number: '4.2',
          label: 'Tax base',
          value: VAT_RETURN.base10.current,
          previous: VAT_RETURN.base10.previous,
          sources: [
            {
              key: 'F-2026-0412',
              type: 'Invoice · Panonija Agro d.o.o.',
              number: 'F-2026-0412',
              href: invoice('F-2026-0412'),
              date: '2026-09-28',
              amount: VAT_RETURN.base10.current,
              status: STATES.Sent,
            },
          ],
        },
        {
          id: '4.6',
          number: '4.6',
          label: 'VAT',
          value: VAT_RETURN.vat10.current,
          previous: VAT_RETURN.vat10.previous,
        },
      ],
    },
    {
      key: '5',
      title: '5. Total supplies and VAT',
      fields: [
        {
          id: '5.1',
          number: '5.1',
          label: 'Total tax base (3.2 + 4.2)',
          value: VAT_RETURN.totalBase.current,
          previous: VAT_RETURN.totalBase.previous,
          total: true,
        },
        {
          id: '5.2',
          number: '5.2',
          label: 'Total VAT on supplies (3.6 + 4.6)',
          value: VAT_RETURN.totalVat.current,
          previous: VAT_RETURN.totalVat.previous,
          total: true,
        },
      ],
    },
    {
      key: '8',
      title: '8. Input tax',
      fields: [
        {
          id: '8a.1',
          number: '8a.1',
          label: 'Purchases at the general rate, tax base',
          value: VAT_RETURN.inputBase.current,
          previous: VAT_RETURN.inputBase.previous,
          sources: SEPTEMBER_PURCHASES_20.map((purchase) => ({
            key: purchase.number,
            type: `Supplier invoice · ${purchase.supplier}`,
            number: purchase.number,
            href: '#/purchasing/approvals',
            date: purchase.date,
            amount: purchase.base,
            status: STATES[purchase.status],
          })),
        },
        {
          id: '8a.2',
          number: '8a.2',
          label: 'Input tax at the general rate',
          value: input,
          previous: VAT_RETURN.inputVat.previous,
          sources: SEPTEMBER_PURCHASES_20.map((purchase) => ({
            key: purchase.number,
            type: `Supplier invoice · ${purchase.supplier}`,
            number: purchase.number,
            href: '#/purchasing/approvals',
            date: purchase.date,
            amount: vatAt20(purchase.base),
            status: STATES[purchase.status],
          })),
          editor,
          ...(override === undefined ? {} : { override }),
        },
        {
          id: '8e.6',
          number: '8e.6',
          label: 'Total input tax that may be deducted',
          value: VAT_RETURN.inputTotal.current,
          previous: VAT_RETURN.inputTotal.previous,
          total: true,
        },
      ],
    },
    {
      key: '10',
      title: '10. Tax liability',
      fields: [
        {
          id: '10.1',
          number: '10.1',
          label: 'VAT payable (5.2 − 8e.6)',
          value: VAT_RETURN.payable.current,
          previous: VAT_RETURN.payable.previous,
          total: true,
        },
      ],
    },
  ]
}

const VAT_STEPS = [
  { key: 'draft', label: 'Draft' },
  { key: 'checked', label: 'Checked' },
  { key: 'submitted', label: 'Submitted' },
]

export function VatReturn({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const [input, setInput] = useState(VAT_RETURN.inputVat.current)
  const [draft, setDraft] = useState<string | null>(VAT_RETURN.inputVat.current)
  const [override, setOverride] = useState<StatutoryOverride | undefined>(IVANA)
  const submit = <Button intent="confirm" label="Submit" />
  return (
    <Shell
      phone={phone}
      crumbs={[
        { label: 'VAT returns', href: `#${E_ROUTES.vatReturn}` },
        { label: 'September 2026' },
      ]}
      tabs={ACCOUNTING_TABS}
      bottomBar={submit}
    >
      <StatutoryFormPage
        layout={phone ? 'phone' : 'desktop'}
        title="VAT return, September 2026"
        subtitle="PP PDV (illustrative) · due 15.10.2026."
        back={{ href: `#${E_ROUTES.vatReturn}`, label: 'VAT returns' }}
        status={<StatusBadge label="Checked" tone="info" />}
        lifecycle={{ steps: VAT_STEPS, current: 1, label: 'Return status' }}
        actions={
          <>
            <Button intent="print" emphasis="secondary" label="Print" />
            <Button intent="export" label="Export XML" />
            {phone ? null : submit}
          </>
        }
        currency="RSD"
        currentLabel="September 2026"
        previousLabel="August 2026"
        sections={vatSections(
          input,
          override,
          <MoneyField
            label="Input tax at the general rate"
            hideLabel
            currency="RSD"
            value={draft}
            onChange={setDraft}
          />,
        )}
        rules={vatRules(input, (value) => format.money(value, 'RSD'))}
        onSaveOverride={() => {
          if (draft === null) return
          setInput(draft)
          setOverride(
            draft === VAT_RETURN.inputVat.computed
              ? undefined
              : { ...IVANA, by: 'Milica Petrović', at: '06.10.2026. 10:05' },
          )
        }}
        onUseComputed={() => {
          setInput(VAT_RETURN.inputVat.computed)
          setDraft(VAT_RETURN.inputVat.computed)
          setOverride(undefined)
        }}
      />
    </Shell>
  )
}

// ── Work-injury register ──────────────────────────────────────────────────────────────────────

const INJURY_COLUMNS: DataTableColumn<Injury>[] = [
  {
    id: 'recorded',
    header: 'Recorded',
    numeric: true,
    cell: (row) => <DateText value={row.recorded} />,
  },
  {
    id: 'date',
    header: 'Injury date',
    numeric: true,
    cell: (row) => <DateText value={row.date} />,
  },
  { id: 'employee', header: 'Employee', cell: (row) => row.employee },
  { id: 'position', header: 'Position', cell: (row) => row.position },
  { id: 'injury', header: 'Injury', cell: (row) => row.injury },
  { id: 'severity', header: 'Severity', cell: (row) => row.severity },
  {
    id: 'daysOff',
    header: 'Days off',
    align: 'end',
    numeric: true,
    cell: (row) => <NumberText value={row.daysOff} decimals={0} />,
  },
]

export function InjuryRegister({
  phone,
  generated = false,
}: {
  phone: boolean
  generated?: boolean
}) {
  const [period, setPeriod] = useState<DateRange | null>({ start: '2026-01-01', end: '2026-12-31' })
  const rows = useMemo(() => (generated ? manyInjuries(5000) : INJURIES), [generated])
  const newEntry = <Button intent="create" label="New entry" />
  return (
    <Shell
      phone={phone}
      crumbs={[
        { label: 'Safety at work', href: `#${E_ROUTES.injuryRegister}` },
        { label: 'Work-injury register' },
      ]}
      tabs={SAFETY_TABS}
      bottomBar={newEntry}
    >
      <RegisterPage
        layout={phone ? 'phone' : 'desktop'}
        title="Work-injury register 2026"
        subtitle="Kept under the safety-at-work law (illustrative); entries are corrected, never deleted."
        actions={
          <>
            <Button intent="print" emphasis="secondary" label="Print" />
            <Button intent="export" label="Export" />
            {phone ? null : newEntry}
          </>
        }
        period={<PeriodField label="Period" value={period} onChange={setPeriod} className="w-60" />}
        locks={[
          {
            key: 'h1',
            period: 'January–June 2026',
            reason: 'Reported to the labour inspection with the half-year report.',
            detail: 'Locked by Jelena Marković on 15.07.2026.',
          },
        ]}
        columns={INJURY_COLUMNS}
        rows={rows}
        getRowId={(row) => row.id}
        getRowLabel={(row) => `No. ${row.no}, ${row.employee}`}
        entry={(row) => ({
          number: row.no,
          ...(row.corrects === undefined ? {} : { corrects: row.corrects }),
          ...(row.correctedBy === undefined ? {} : { correctedBy: row.correctedBy }),
          ...(row.locked === undefined ? {} : { locked: row.locked }),
        })}
        rowActions={() => [{ label: 'Correct entry', onSelect: () => undefined }]}
        count={rows.length}
        virtualize={generated}
        mobile={{
          title: (row) => row.employee,
          subtitle: (row) => row.injury,
          details: ['date', 'severity', 'daysOff'],
        }}
      />
    </Shell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_E_ROUTES: ExampleRoute[] = [
  { path: E_ROUTES.customers, render: (phone) => <Customers phone={phone} /> },
  { path: E_ROUTES.customerImport, render: (phone) => <CustomerImport phone={phone} /> },
  { path: E_ROUTES.vatReturn, render: (phone) => <VatReturn phone={phone} /> },
  { path: E_ROUTES.injuryRegister, render: (phone) => <InjuryRegister phone={phone} /> },
  {
    path: E_ROUTES.injuryRegisterGenerated,
    render: (phone) => <InjuryRegister phone={phone} generated />,
  },
]
