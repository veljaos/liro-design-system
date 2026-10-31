import { Ban, FileSpreadsheet, RotateCcw } from 'lucide-react'
import { useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Alert,
  BulkEditDrawer,
  Button,
  DataTable,
  DuplicateWarning,
  FilterBar,
  ImportWizard,
  ListPage,
  LookupDialog,
  MoneyField,
  MoneyText,
  NumberText,
  PageHeader,
  QuickPreview,
  SelectField,
  StatutoryFormPage,
  useLiro,
  type BulkEditField,
  type DataTableColumn,
  type DataTableFilters,
  type DataTableSort,
  type FilterDefinition,
  type ImportMapping,
  type ImportStep,
  type ModuleTab,
  type StatutoryOverride,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, reportsTabs, SALES_TABS, Shell, statusBadge } from './example-shell'
import {
  allCustomers,
  csvColumns,
  CUSTOMER_FIELDS,
  IMPORT_COUNTS,
  IMPORT_FILE_DESCRIPTION,
  IMPORT_PREVIEW,
  IMPORT_SUGGESTION,
  readImportFile,
  searchCustomers,
  SEPTEMBER_10,
  SEPTEMBER_ADVANCES,
  SEPTEMBER_PURCHASES_20,
  SEPTEMBER_REVERSE_CHARGE,
  SEPTEMBER_SALES_20,
  VAT_INPUT_OVERRIDE,
  type Customer,
} from './data-E'
import {
  VAT_ENTERED,
  VAT_FORM_LANG,
  vatFormRules,
  vatFormSections,
  vatFormValues,
  type VatEntered,
  type VatFormDocuments,
} from '../../../../packages/ui/src/templates/statutory-story-data'
import {
  matchesChoice,
  sortRows,
  type SortKey,
} from '../../../../packages/ui/src/components/catalog-story-data'

/*
 * Catalogues at scale, registers and official forms:
 * the customer catalogue with its lookup, bulk edit and import, and the VAT return for September
 * 2026. Only the public entry point `@veljaos/ui`.
 */

export const E_ROUTES = {
  customers: '/sales/customers',
  customerImport: '/sales/customers/import',
  vatReturn: '/accounting/vat-return/2026-09',
}

const CUSTOMER_TABS: ModuleTab[] = SALES_TABS.map((tab) => ({
  ...tab,
  current: tab.key === 'customers',
}))

// ── Customers ─────────────────────────────────────────────────────────────────────────────────

const inactiveBadge = statusBadge('Inactive')

/**
 * The name, with "Inactive" after it only where the list mixes active and inactive customers
 * (the All view, the lookup with "Show inactive"): on the Inactive view the tab already says it.
 */
function CustomerName({ customer, marked }: { customer: Customer; marked: boolean }) {
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="bidi-isolate">{customer.name}</span>
      {marked && !customer.active && inactiveBadge}
    </span>
  )
}

/** The catalogue's columns, every one sortable (a catalogue list sorts by its columns). */
function customerColumns(markInactive: boolean): DataTableColumn<Customer>[] {
  return [
    {
      id: 'name',
      header: 'Name',
      sortable: true,
      cell: (row) => <CustomerName customer={row} marked={markInactive} />,
    },
    { id: 'taxId', header: 'Tax number', numeric: true, sortable: true, cell: (row) => row.taxId },
    { id: 'city', header: 'City', sortable: true, cell: (row) => row.city },
    { id: 'group', header: 'Group', sortable: true, cell: (row) => row.group },
    {
      id: 'term',
      header: 'Payment term (days)',
      label: 'Payment term',
      align: 'end',
      numeric: true,
      sortable: true,
      cell: (row) => <NumberText value={row.paymentTerm} decimals={0} />,
    },
    {
      id: 'balance',
      header: 'Open balance',
      align: 'end',
      numeric: true,
      sortable: true,
      cell: (row) => <MoneyText value={row.balance} currency="RSD" />,
    },
  ]
}

const LIST_COLUMNS = customerColumns(false)
const MIXED_COLUMNS = customerColumns(true)

/** How the application sorts each column: text by collation, numbers and amounts exactly. */
const CUSTOMER_SORT: Record<string, SortKey<Customer>> = {
  name: { kind: 'text', value: (row) => row.name },
  taxId: { kind: 'decimal', value: (row) => row.taxId, places: 0 },
  city: { kind: 'text', value: (row) => row.city },
  group: { kind: 'text', value: (row) => row.group },
  term: { kind: 'decimal', value: (row) => row.paymentTerm, places: 0 },
  balance: { kind: 'decimal', value: (row) => row.balance },
}

/** The phone's "Sort" menu: the sortable columns with short labels. */
const CUSTOMER_SORT_COLUMNS = LIST_COLUMNS.map((column) => ({
  id: column.id,
  label: column.label ?? (typeof column.header === 'string' ? column.header : column.id),
}))

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

// Several cities or groups at once (a catalogue's choice filters are multiSelect).
const CUSTOMER_FILTERS: FilterDefinition[] = [
  { id: 'city', label: 'City', type: 'multiSelect', options: CITY_OPTIONS },
  { id: 'group', label: 'Group', type: 'multiSelect', options: GROUP_OPTIONS },
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
  return matchesChoice(filters.city, customer.city) && matchesChoice(filters.group, customer.group)
}

export function Customers({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const { format, locale } = useLiro()
  const { all, change } = useCatalogue()
  const [view, setView] = useState('active')
  const [search, setSearch] = useState('')
  const [filters, setFilters] = useState<DataTableFilters>({})
  const [sort, setSort] = useState<DataTableSort>(null)
  const [lookupSort, setLookupSort] = useState<DataTableSort>(null)
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
    const found = searchCustomers(inView, search).filter((customer) =>
      matchesFilters(customer, filters),
    )
    return sortRows(found, sort, CUSTOMER_SORT, locale)
  }, [all, view, search, filters, sort, locale])

  // The lookup's own search over the whole catalogue (the application's work), 25 per page.
  const found = useMemo(
    () =>
      sortRows(
        searchCustomers(all, lookupQuery).filter(
          (customer) =>
            (lookupFilters.inactive === true || customer.active) &&
            matchesFilters(customer, lookupFilters),
        ),
        lookupSort,
        CUSTOMER_SORT,
        locale,
      ),
    [all, lookupQuery, lookupFilters, lookupSort, locale],
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
            sort={sort}
            sortColumns={CUSTOMER_SORT_COLUMNS}
            onSortChange={setSort}
            actions={
              <>
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
          maxHeight="60dvh"
          columns={view === 'all' ? MIXED_COLUMNS : LIST_COLUMNS}
          sort={sort}
          onSortChange={setSort}
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
            badge: (row) => (view !== 'all' || row.active ? undefined : inactiveBadge),
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
              value: preview.active ? statusBadge('Active') : inactiveBadge,
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
        columns={MIXED_COLUMNS}
        sort={lookupSort}
        onSortChange={(next) => {
          setLookupSort(next)
          setLookupCursor(0)
        }}
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
  const [fileError, setFileError] = useState<string | undefined>(undefined)
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
            setFileError(undefined)
            void chosen.text().then((text) => {
              const read = readImportFile(chosen.name, text)
              setReading(false)
              // An unreadable file shows its error in words, never its content.
              if ('error' in read) {
                setFile(undefined)
                setColumns([])
                setMapping({})
                setFileError(read.error)
                return
              }
              setColumns(read.columns)
              setMapping(IMPORT_SUGGESTION)
              setFile({ name: chosen.name, description: IMPORT_FILE_DESCRIPTION })
            })
          }}
          {...(file === undefined ? {} : { file })}
          {...(fileError === undefined ? {} : { fileError })}
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
                  status: statusBadge('Active'),
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
  Cancelled: statusBadge('Cancelled'),
  'Query sent': statusBadge('Query sent'),
  'To approve': statusBadge('To approve'),
}

const invoiceRoute = (number: string) => `#/sales/invoices/${number}`

/** September's e-invoices behind the source cells, from the dataset. */
const VAT_DOCUMENTS: VatFormDocuments = {
  sales20: SEPTEMBER_SALES_20.map((sale) => ({
    key: sale.number,
    type: `Invoice · ${sale.customer}`,
    number: sale.number,
    href: invoiceRoute(sale.number),
    date: sale.date,
    amount: sale.base,
    status: STATES[sale.status],
  })),
  sales10: [
    {
      key: 'F-2026-0412',
      type: 'Invoice · Panonija Agro d.o.o.',
      number: 'F-2026-0412',
      href: invoiceRoute('F-2026-0412'),
      date: '2026-09-28',
      amount: SEPTEMBER_10.base,
      status: STATES.Sent,
    },
  ],
  advances: SEPTEMBER_ADVANCES.map((advance) => ({
    key: advance.number,
    type: `Advance invoice · ${advance.customer}`,
    number: advance.number,
    href: '#/sales/invoices',
    date: advance.date,
    amount: advance.base,
    status: STATES[advance.status],
  })),
  reverseCharge: SEPTEMBER_REVERSE_CHARGE.map((sale) => ({
    key: sale.number,
    type: `Invoice · ${sale.customer}`,
    number: sale.number,
    href: '#/sales/invoices',
    date: sale.date,
    amount: sale.base,
    status: STATES[sale.status],
  })),
  exempt: [
    {
      key: 'F-2026-0412',
      type: 'Invoice · Panonija Agro d.o.o.',
      number: 'F-2026-0412',
      href: invoiceRoute('F-2026-0412'),
      date: '2026-09-28',
      amount: SEPTEMBER_10.exempt,
      status: STATES.Sent,
    },
  ],
  purchases20: SEPTEMBER_PURCHASES_20.map((purchase) => ({
    key: purchase.number,
    type: `Supplier invoice · ${purchase.supplier}`,
    number: purchase.number,
    href: '#/purchasing/approvals',
    date: purchase.date,
    amount: purchase.base,
    status: STATES[purchase.status],
  })),
}

/** The books' values, with September's typed cells. */
const VAT_BOOKS = vatFormValues(VAT_DOCUMENTS, VAT_ENTERED)

/** Ivana Stojanović left UF-2026-1179 out of 3.1.1's VAT: a query about its price is open. */
const IVANA: StatutoryOverride = {
  computed: VAT_BOOKS.inputVat,
  by: 'Ivana Stojanović',
  at: '05.10.2026. 14:12',
}

const VAT_STEPS = [
  { key: 'draft', label: 'Draft' },
  { key: 'checked', label: 'Checked' },
  { key: 'submitted', label: 'Submitted' },
]

export function VatReturn({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  const [entered, setEntered] = useState<VatEntered>(VAT_ENTERED)
  const [input, setInput] = useState(VAT_INPUT_OVERRIDE)
  const [draft, setDraft] = useState<string | null>(VAT_INPUT_OVERRIDE)
  const [override, setOverride] = useState<StatutoryOverride | undefined>(IVANA)
  const submit = <Button intent="confirm" label="Submit" />
  return (
    <Shell
      phone={phone}
      crumbs={[
        { label: 'VAT returns', href: `#${E_ROUTES.vatReturn}` },
        { label: 'September 2026' },
      ]}
      tabs={reportsTabs('vat')}
      bottomBar={submit}
    >
      <StatutoryFormPage
        layout={phone ? 'phone' : 'desktop'}
        title="VAT return, September 2026"
        subtitle="Illustrative PP PDV-like form, not the authority's · due 15.10.2026."
        back={{ href: `#${E_ROUTES.vatReturn}`, label: 'VAT returns' }}
        status={statusBadge('Checked')}
        lifecycle={{ steps: VAT_STEPS, current: 1, label: 'Return status' }}
        actions={
          <>
            <Button intent="print" emphasis="secondary" label="Print" />
            <Button intent="export" label="Export XML" />
            {phone ? null : submit}
          </>
        }
        lang={VAT_FORM_LANG}
        currency="RSD"
        currentLabel="September 2026"
        previousLabel="August 2026"
        defaultCollapsed={['1.2']}
        sections={vatFormSections({
          documents: VAT_DOCUMENTS,
          entered,
          field: (cell, label) => (
            <MoneyField
              label={label}
              hideLabel
              currency="RSD"
              value={entered[cell] ?? null}
              onChange={(value) => {
                setEntered((current) => ({ ...current, [cell]: value }))
              }}
            />
          ),
          inputVat: input,
          ...(override === undefined ? {} : { override }),
          editor: (
            <MoneyField
              label="3.1.1 · Општа стопа 20% · ПДВ"
              hideLabel
              currency="RSD"
              value={draft}
              onChange={setDraft}
            />
          ),
        })}
        rules={vatFormRules(VAT_DOCUMENTS, input, (value) => format.money(value, 'RSD'))}
        onSaveOverride={() => {
          if (draft === null) return
          setInput(draft)
          setOverride(
            draft === VAT_BOOKS.inputVat
              ? undefined
              : { ...IVANA, by: 'Milica Petrović', at: '06.10.2026. 10:05' },
          )
        }}
        onUseComputed={() => {
          setInput(VAT_BOOKS.inputVat)
          setDraft(VAT_BOOKS.inputVat)
          setOverride(undefined)
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
]
