import {
  BellRing,
  FileSignature,
  FileText,
  House,
  LayoutGrid,
  List,
  LogOut,
  ReceiptText,
  Send,
  UserPlus,
  UserRound,
  Wrench,
} from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  Alert,
  AttachmentList,
  Button,
  DataTable,
  DateField,
  DateRangeText,
  DateText,
  Dialog,
  DocumentFrame,
  Drawer,
  FileDropzone,
  FilterBar,
  KeyFigures,
  KeyValueList,
  ListPage,
  LiroProvider,
  MaskedValue,
  MoneyField,
  MoneyText,
  notice,
  numericFormat,
  PageHeader,
  PeriodicRunPage,
  PortalShell,
  PrintDocument,
  RadioGroupField,
  RoomRack,
  SectionCard,
  SelectField,
  StatusBadge,
  StatusTimeline,
  TextAreaField,
  TextField,
  Toaster,
  toneFor,
  useLiro,
  DetailPage,
  type Attachment,
  type DataTableColumn,
  type DataTableFilters,
  type FilterDefinition,
  type KeyValueItem,
  type MenuEntry,
  type ModuleTab,
  type PortalSection,
  type PrintColumn,
  type RunCheck,
  type StatusTimelineStep,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, ROUTES, Shell, type ExampleAccount } from './example-shell'
import { useExampleState } from './example-state'
import { Frame } from './screens-G'
import {
  ACCESS_OPTIONS,
  BQ_NOW,
  BQ_ROUTES,
  BQ_TODAY,
  BUILDINGS,
  buildingOf,
  FEATURED_LEASE,
  FEATURED_LEASE_FACTS,
  FEATURED_TENANT,
  findLease,
  findRequest,
  findTenant,
  findUnit,
  HANDLERS,
  inLeaseView,
  inRequestView,
  inTenantView,
  INVOICE_TONES,
  LEASE_END_NOTES,
  LEASE_FILES,
  LEASE_TONES,
  LEASE_VIEWER,
  LEASE_VIEWS,
  LEASES,
  MANAGER,
  must,
  NEW_REQUEST,
  OVERDUE_INVOICES,
  RADOVIC_INVOICES,
  rackFloors,
  RENT_STATES,
  REQUEST_CATEGORIES,
  REQUEST_STEPS,
  REQUEST_TONES,
  REQUEST_VIEWS,
  REQUESTS,
  RERUN_REASONS,
  REVEAL_REASONS,
  ROOMS,
  RUN_INVOICES,
  RUN_PERIOD,
  RUN_STEPS,
  RUN_TOTALS,
  TENANT_TONES,
  TENANT_VIEWS,
  TENANTS,
  UNIT_FIGURES,
  UNIT_STATE_WORDS,
  UNIT_STATES,
  UNIT_TONES,
  UNITS,
  unitPlace,
  type Building,
  type Lease,
  type LeaseView,
  type MaintenanceRequest,
  type PropertyTenant,
  type RentInvoice,
  type RequestState,
  type RequestView,
  type RunInvoice,
  type TenantView,
  type Unit,
  type UnitState,
} from './data-BQ'

/*
 * Group BQ's example screens (P5.76, property management): Kvadrat Nekretnine d.o.o. lets the
 * units of Residential building Liman 2 and Residential building Grbavica 7 (both built by Kvadrat
 * Gradnja d.o.o.); Vesna Tomić, its property manager, on 14.10.2026 at 09:40. Assembled from the
 * library only:
 * - Units: RoomRack by building and floor (Let / Vacant / Under repair in words, the rent's state
 *   as the second state, the tenant and the lease's term on each tile), a unit open in a Drawer;
 *   the same units as a list (ListPage, FilterBar, DataTable).
 * - Tenants: the list (ListPage) and a tenant's record (DetailPage: contact, the national ID as
 *   MaskedValue, leases, invoices, maintenance requests).
 * - Leases: the list and one lease (DetailPage: the unit, the tenant, the term, rent and deposit,
 *   the renewal and expiry reminders in the application's words in an Alert, Renew… in a Dialog,
 *   the documents with the lease itself in DocumentFrame on a page of its own).
 * - Rent invoices: the November 2026 run (PeriodicRunPage: lock, steps, checks in words, the
 *   preview with every invoice and its totals; one invoice as it is printed, PrintDocument in a
 *   Dialog), Issue.
 * - Maintenance: the manager's list with states and who handles it, a request in a Drawer (the
 *   photos, the progress, Handled by, the field-service work order by its route).
 * - The tenants' portal (PortalShell) of Ivana Radović: home, "Report a problem" (what, where,
 *   photos with "Take a photo", access), her requests and one request's progress, her invoices.
 * Every figure is the application's (data-BQ.ts, D4); the screens keep only what the user changed
 * (`useExampleState`), so a request reported in the portal is in the manager's list.
 */

export { BQ_ROUTES }

// ── Shared pieces ─────────────────────────────────────────────────────────────────────────────

const DIGITS = numericFormat('sr-Latn-RS', 'Europe/Belgrade')

/**
 * The company's provider: the tenant's digits, today, and the words RoomRack uses for units
 * instead of rooms (the application's messages, D2).
 */
function PropertyProvider({ children }: { children: ReactNode }) {
  const liro = useLiro()
  return (
    <LiroProvider
      locale={liro.locale}
      direction={liro.direction}
      colorScheme={liro.colorScheme}
      messages={{
        ...liro.messages,
        'rack.instructions': 'Use the arrow keys to move between the units, and Enter to open one.',
        'rack.empty': 'No units yet',
        'rack.emptyDescription': 'The units appear here once the buildings are set up.',
      }}
      format={DIGITS}
      today={BQ_TODAY}
      timeZone="Europe/Belgrade"
      linkComponent={liro.linkComponent}
    >
      {children}
    </LiroProvider>
  )
}

const NEKRETNINE = [
  { id: MANAGER.companyId, name: MANAGER.company, description: `PIB ${MANAGER.taxId}` },
]

const ACCOUNT: ExampleAccount = {
  name: MANAGER.name,
  email: MANAGER.email,
  companies: NEKRETNINE,
  links: [
    { label: 'Units', path: BQ_ROUTES.units },
    { label: 'Tenants', path: BQ_ROUTES.tenants },
    { label: 'Leases', path: BQ_ROUTES.leases },
    { label: `Rent invoices ${RUN_PERIOD}`, path: BQ_ROUTES.run },
    { label: 'Maintenance requests', path: BQ_ROUTES.requests },
  ],
}

type PropertyTab = 'units' | 'tenants' | 'leases' | 'rent' | 'maintenance'

function propertyTabs(current: PropertyTab): ModuleTab[] {
  const tab = (key: PropertyTab, label: string, path: string): ModuleTab => ({
    key,
    label,
    href: `#${path}`,
    current: current === key,
  })
  return [
    tab('units', 'Units', BQ_ROUTES.units),
    tab('tenants', 'Tenants', BQ_ROUTES.tenants),
    tab('leases', 'Leases', BQ_ROUTES.leases),
    tab('rent', 'Rent invoices', BQ_ROUTES.run),
    tab('maintenance', 'Maintenance', BQ_ROUTES.requests),
  ]
}

function PropertyShell({
  phone,
  tab,
  crumbs,
  bottomBar,
  children,
}: {
  phone: boolean
  tab: PropertyTab
  crumbs: { label: string; href?: string }[]
  bottomBar?: ReactNode
  children: ReactNode
}) {
  return (
    <PropertyProvider>
      <Shell
        phone={phone}
        account={ACCOUNT}
        company={MANAGER.companyId}
        crumbs={crumbs}
        tabs={propertyTabs(tab)}
        {...(bottomBar === undefined ? {} : { bottomBar })}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </PropertyProvider>
  )
}

function money(value: string | null) {
  return <MoneyText value={value} currency="RSD" />
}

/** A link through the provider's linkComponent, in the link colour. */
function RecordLink({ href, children }: { href: string; children: ReactNode }) {
  const { linkComponent: Link } = useLiro()
  return (
    <Link href={`#${href}`} className="bidi-isolate text-link no-underline hover:underline">
      {children}
    </Link>
  )
}

/** "54,10 m²" through the provider's digits. */
function Area({ value }: { value: string }) {
  const { format } = useLiro()
  return <bdi className="tabular-nums">{`${format.number(value, { decimals: 2 })} m²`}</bdi>
}

/** "November 2026" from "2026-11", through the provider's month names. */
function useMonthText() {
  const { format } = useLiro()
  return (month: string) => {
    const [year = '', number = '1'] = month.split('-')
    return `${format.monthName(Number(number), 'long')} ${year}`
  }
}

function MonthText({ month }: { month: string }) {
  const monthText = useMonthText()
  return <span className="bidi-content">{monthText(month)}</span>
}

function unitBadge(state: UnitState) {
  return <StatusBadge label={UNIT_STATE_WORDS[state]} tone={UNIT_TONES[state]} />
}

function leaseBadge(lease: Lease) {
  return <StatusBadge label={lease.state} tone={toneFor(lease.state, LEASE_TONES)} />
}

function tenantBadge(tenant: PropertyTenant) {
  return <StatusBadge label={tenant.state} tone={toneFor(tenant.state, TENANT_TONES)} />
}

function requestBadge(state: RequestState) {
  return <StatusBadge label={state} tone={toneFor(state, REQUEST_TONES)} />
}

function invoiceBadge(invoice: RentInvoice) {
  return <StatusBadge label={invoice.state} tone={toneFor(invoice.state, INVOICE_TONES)} />
}

function vatWords(lease: Lease | undefined): string {
  return lease?.vat === '20' ? '20% (illustrative)' : 'Exempt: residential (illustrative)'
}

/** Two lines in one cell: the main text and a secondary line. */
function TwoLines({ main, detail }: { main: ReactNode; detail: ReactNode }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="bidi-content font-medium">{main}</span>
      <span className="bidi-content text-xs text-secondary">{detail}</span>
    </span>
  )
}

/** The requests as the application keeps them, above the screens (the portal adds to them). */
function useRequests() {
  return useExampleState<readonly MaintenanceRequest[]>('BQ.requests', () => REQUESTS)
}

function handlerName(value: string | undefined): string {
  return HANDLERS.find((handler) => handler.value === value)?.label ?? 'Nobody yet'
}

function whereText(request: MaintenanceRequest): string {
  const building = BUILDINGS.find((each) => each.id === request.building)?.short ?? ''
  if (request.unit !== undefined) {
    return request.room === undefined ? request.unit : `${request.unit}, ${request.room}`
  }
  return `${building} · ${request.area ?? ''}`
}

/** The request's progress as StatusTimeline steps: the application's times. */
function requestSteps(request: MaintenanceRequest): StatusTimelineStep[] {
  return REQUEST_STEPS.map((label, index) => {
    const at = request.times[index]
    const detail =
      index === 0
        ? `${request.reportedBy} · ${request.channel}`
        : index === 1 && request.handler !== undefined
          ? handlerName(request.handler)
          : index === 3 && request.done !== undefined
            ? request.done
            : undefined
    return {
      key: label,
      label,
      ...(at === undefined ? {} : { at }),
      ...(detail === undefined ? {} : { detail }),
    }
  })
}

function currentStep(request: MaintenanceRequest): number {
  if (request.state === 'Done') return REQUEST_STEPS.length
  return Math.max(0, request.times.length - 1)
}

function photoFiles(request: MaintenanceRequest): Attachment[] {
  return request.photos.map((photo) => ({ ...photo, state: 'available' as const }))
}

// ── Units ─────────────────────────────────────────────────────────────────────────────────────

type BuildingChoice = Building['id'] | 'all'

const BUILDING_OPTIONS = [
  { value: 'all', label: 'Both buildings' },
  ...BUILDINGS.map((building) => ({ value: building.id, label: building.name })),
]

/** A unit's facts, in the rack's drawer and the list's. */
function UnitFacts({ unit }: { unit: Unit }) {
  const building = buildingOf(unit)
  const tenant = findTenant(unit.tenant ?? '')
  const lease = findLease(unit.lease ?? '')
  const items: KeyValueItem[] = [
    { key: 'state', label: 'State', value: unitBadge(unit.state) },
    { key: 'building', label: 'Building', value: `${building.name}, ${building.address}` },
    { key: 'floor', label: 'Floor', value: unitPlace(unit).split(' · ')[1] ?? '' },
    {
      key: 'kind',
      label: 'Kind',
      value: unit.kind === 'Flat' ? `Flat, ${unit.type} rooms` : unit.kind,
    },
    { key: 'area', label: 'Area', value: <Area value={unit.area} />, numeric: true },
    ...(unit.situation === undefined
      ? []
      : [{ key: 'situation', label: 'Situation', value: unit.situation, fullWidth: true }]),
    ...(tenant === undefined
      ? []
      : [
          {
            key: 'tenant',
            label: unit.state === 'let' ? 'Tenant' : 'Next tenant',
            value: <RecordLink href={BQ_ROUTES.tenant(tenant.id)}>{tenant.name}</RecordLink>,
          },
        ]),
    ...(lease === undefined
      ? []
      : [
          {
            key: 'lease',
            label: 'Lease',
            value: (
              <span className="flex flex-col gap-0.5">
                <RecordLink href={BQ_ROUTES.lease(lease.number)}>{lease.number}</RecordLink>
                <DateRangeText from={lease.start} to={lease.end} className="text-sm" />
              </span>
            ),
          },
        ]),
    {
      key: 'rent',
      label: unit.state === 'let' ? 'Monthly rent' : 'Asking rent',
      value: money(unit.monthlyRent),
      numeric: true,
    },
    {
      key: 'charges',
      label: 'Common charges',
      value: money(unit.commonCharges),
      numeric: true,
    },
    ...(unit.rent === undefined
      ? []
      : [
          {
            key: 'paid',
            label: 'Rent',
            value: (
              <StatusBadge
                label={unit.rent === 'paid' ? 'Rent paid' : 'Rent overdue'}
                tone={unit.rent === 'paid' ? 'success' : 'danger'}
              />
            ),
          },
        ]),
    ...(unit.request === undefined
      ? []
      : [
          {
            key: 'request',
            label: 'Maintenance',
            value: (
              <RecordLink href={BQ_ROUTES.request(unit.request)}>
                {`${unit.request} · ${findRequest(unit.request)?.what ?? ''}`}
              </RecordLink>
            ),
          },
        ]),
  ]
  return <KeyValueList columns={1} items={items} />
}

function UnitDrawer({ unit, onClose }: { unit: Unit | undefined; onClose: () => void }) {
  return (
    <Drawer
      side="end"
      open={unit !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={unit === undefined ? '' : `Unit ${unit.id}`}
      {...(unit === undefined ? {} : { description: unitPlace(unit) })}
    >
      {unit !== undefined && <UnitFacts unit={unit} />}
    </Drawer>
  )
}

function UnitFigures({ phone }: { phone: boolean }) {
  const { format } = useLiro()
  return (
    <KeyFigures
      layout={phone ? 'phone' : 'desktop'}
      items={[
        {
          key: 'let',
          label: 'Let',
          value: `${format.number(UNIT_FIGURES.let)} of ${format.number(UNIT_FIGURES.units)}`,
        },
        { key: 'vacant', label: 'Vacant', value: format.number(UNIT_FIGURES.vacant) },
        { key: 'repair', label: 'Under repair', value: format.number(UNIT_FIGURES.repair) },
        {
          key: 'overdue',
          label: 'Rent overdue',
          value: money(UNIT_FIGURES.overdue),
          tone: 'danger',
        },
      ]}
    />
  )
}

export function UnitRack({ phone, unit = null }: { phone: boolean; unit?: string | null }) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const [building, setBuilding] = useState<BuildingChoice>('all')
  const [chosen, setChosen] = useState<string | null>(unit)
  const current = chosen === null ? undefined : findUnit(chosen)
  return (
    <PropertyShell phone={phone} tab="units" crumbs={[{ label: 'Property' }, { label: 'Units' }]}>
      <Frame phone={phone} wide>
        <PageHeader
          title="Units"
          subtitle={`${MANAGER.company} · ${format.dateLong(BQ_TODAY)}`}
          actions={
            <Button
              family="neutral"
              icon={List}
              label="Show as a list"
              onClick={() => {
                navigate(BQ_ROUTES.unitsList)
              }}
            />
          }
        />
        <UnitFigures phone={phone} />
        <div className={phone ? 'w-full' : 'w-80'}>
          <SelectField
            label="Building"
            options={BUILDING_OPTIONS}
            value={building}
            onChange={(value) => {
              setBuilding(value as BuildingChoice)
            }}
          />
        </div>
        <RoomRack
          label={`Units, ${format.date(BQ_TODAY)}`}
          floors={rackFloors(building)}
          occupancyStates={UNIT_STATES}
          housekeepingStates={RENT_STATES}
          occupancyLabel="Unit"
          housekeepingLabel="Rent"
          searchLabel="Search by unit or tenant"
          layout={phone ? 'phone' : 'desktop'}
          {...(chosen === null ? {} : { selectedId: chosen })}
          onRoomOpen={(room) => {
            setChosen(room.id)
          }}
        />
      </Frame>
      <UnitDrawer
        unit={current}
        onClose={() => {
          setChosen(null)
        }}
      />
    </PropertyShell>
  )
}

type UnitView = 'all' | UnitState

const UNIT_FILTERS: FilterDefinition[] = [
  {
    id: 'building',
    label: 'Building',
    type: 'select',
    options: BUILDINGS.map((building) => ({ value: building.id, label: building.short })),
  },
]

function unitMatches(unit: Unit, search: string, filters: DataTableFilters): boolean {
  const query = search.trim().toLocaleLowerCase('sr-Latn')
  const tenant = findTenant(unit.tenant ?? '')?.name ?? ''
  if (
    query !== '' &&
    ![unit.id, tenant].some((text) => text.toLocaleLowerCase('sr-Latn').includes(query))
  ) {
    return false
  }
  const building = filters.building
  return typeof building !== 'string' || building === '' || building === unit.building
}

const UNIT_COLUMNS: DataTableColumn<Unit>[] = [
  {
    id: 'unit',
    header: 'Unit',
    minWidth: 140,
    cell: (unit) => (
      <TwoLines
        main={unit.id}
        detail={unit.kind === 'Flat' ? `Flat, ${unit.type} rooms` : unit.kind}
      />
    ),
  },
  { id: 'where', header: 'Where', cell: (unit) => unitPlace(unit) },
  { id: 'area', header: 'Area', numeric: true, cell: (unit) => <Area value={unit.area} /> },
  {
    id: 'tenant',
    header: 'Tenant',
    minWidth: 180,
    cell: (unit) =>
      unit.state === 'let' ? (
        <span className="bidi-content">{findTenant(unit.tenant ?? '')?.name}</span>
      ) : (
        <span className="bidi-content text-secondary">{unit.notes?.[0]?.label ?? '—'}</span>
      ),
  },
  {
    id: 'rent',
    header: 'Monthly rent',
    numeric: true,
    cell: (unit) => money(unit.monthlyRent),
  },
  { id: 'state', header: 'State', cell: (unit) => unitBadge(unit.state) },
]

export function UnitList({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [view, setView] = useState<UnitView>('all')
  const [filters, setFilters] = useState<DataTableFilters>({})
  const [search, setSearch] = useState('')
  const [chosen, setChosen] = useState<string | null>(null)
  const rows = UNITS.filter(
    (unit) => (view === 'all' || unit.state === view) && unitMatches(unit, search, filters),
  )
  const counts: Record<UnitView, string> = {
    all: UNIT_FIGURES.units,
    let: UNIT_FIGURES.let,
    vacant: UNIT_FIGURES.vacant,
    repair: UNIT_FIGURES.repair,
  }
  return (
    <PropertyShell phone={phone} tab="units" crumbs={[{ label: 'Property' }, { label: 'Units' }]}>
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Units"
        actions={
          <Button
            family="neutral"
            icon={LayoutGrid}
            label="Show by floor"
            onClick={() => {
              navigate(BQ_ROUTES.units)
            }}
          />
        }
        views={(['all', 'let', 'vacant', 'repair'] as const).map((id) => ({
          id,
          label: id === 'all' ? 'All' : UNIT_STATE_WORDS[id],
          count: Number(counts[id]),
        }))}
        view={view}
        onViewChange={(id) => {
          setView(id as UnitView)
        }}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={UNIT_FILTERS}
            inline={1}
            values={filters}
            onValuesChange={setFilters}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Unit or tenant"
          />
        }
      >
        <DataTable
          label="Units"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={UNIT_COLUMNS}
          rows={rows}
          getRowId={(unit) => unit.id}
          getRowLabel={(unit) => `${unit.id} ${unitPlace(unit)}`}
          filters={{ ...filters, search }}
          onFiltersChange={() => {
            setFilters({})
            setSearch('')
          }}
          count={rows.length}
          onRowClick={(unit) => {
            setChosen(unit.id)
          }}
          mobile={{
            title: (unit) => unit.id,
            subtitle: (unit) => <span className="bidi-content">{unitPlace(unit)}</span>,
            badge: (unit) => unitBadge(unit.state),
            details: ['tenant', 'rent'],
          }}
        />
      </ListPage>
      <UnitDrawer
        unit={chosen === null ? undefined : findUnit(chosen)}
        onClose={() => {
          setChosen(null)
        }}
      />
    </PropertyShell>
  )
}

// ── Tenants ───────────────────────────────────────────────────────────────────────────────────

const TENANT_COLUMNS: DataTableColumn<PropertyTenant>[] = [
  {
    id: 'tenant',
    header: 'Tenant',
    minWidth: 200,
    cell: (tenant) => <TwoLines main={tenant.name} detail={tenant.kind} />,
  },
  {
    id: 'unit',
    header: 'Unit',
    cell: (tenant) => {
      const unit = findUnit(tenant.unit)
      return <TwoLines main={tenant.unit} detail={unit === undefined ? '' : unitPlace(unit)} />
    },
  },
  {
    id: 'since',
    header: 'Tenant since',
    numeric: true,
    cell: (tenant) => <DateText value={tenant.since} />,
  },
  {
    id: 'contact',
    header: 'Contact',
    minWidth: 200,
    cell: (tenant) => (
      <span className="flex flex-col gap-0.5">
        <bdi className="tabular-nums" dir="ltr">
          {tenant.phone}
        </bdi>
        <span className="bidi-content text-xs text-secondary">{tenant.email ?? 'No e-mail'}</span>
      </span>
    ),
  },
  {
    id: 'overdue',
    header: 'Overdue',
    numeric: true,
    cell: (tenant) => money(tenant.overdue),
  },
  { id: 'state', header: 'State', cell: (tenant) => tenantBadge(tenant) },
]

function tenantMatches(tenant: PropertyTenant, search: string): boolean {
  const query = search.trim().toLocaleLowerCase('sr-Latn')
  return (
    query === '' ||
    [tenant.name, tenant.unit, tenant.email ?? ''].some((text) =>
      text.toLocaleLowerCase('sr-Latn').includes(query),
    )
  )
}

export function TenantList({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [view, setView] = useState<TenantView>('current')
  const [search, setSearch] = useState('')
  const rows = TENANTS.filter(
    (tenant) => inTenantView(tenant, view) && tenantMatches(tenant, search),
  )
  return (
    <PropertyShell
      phone={phone}
      tab="tenants"
      crumbs={[{ label: 'Property' }, { label: 'Tenants' }]}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Tenants"
        views={TENANT_VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: TENANTS.filter((tenant) => inTenantView(tenant, each.id)).length,
        }))}
        view={view}
        onViewChange={(id) => {
          setView(id as TenantView)
        }}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={[]}
            values={{}}
            onValuesChange={() => undefined}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Name, unit or e-mail"
          />
        }
      >
        <DataTable
          label="Tenants"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={TENANT_COLUMNS}
          rows={rows}
          getRowId={(tenant) => tenant.id}
          getRowLabel={(tenant) => `${tenant.name} ${tenant.unit}`}
          filters={{ search }}
          onFiltersChange={() => {
            setSearch('')
          }}
          count={rows.length}
          onRowClick={(tenant) => {
            navigate(BQ_ROUTES.tenant(tenant.id))
          }}
          mobile={{
            title: (tenant) => tenant.name,
            subtitle: (tenant) => <span className="bidi-content">{tenant.unit}</span>,
            badge: (tenant) => tenantBadge(tenant),
            details: ['since', 'overdue'],
          }}
        />
      </ListPage>
    </PropertyShell>
  )
}

const LEASE_ROW_COLUMNS: DataTableColumn<Lease>[] = [
  {
    id: 'lease',
    header: 'Lease',
    cell: (lease) => <RecordLink href={BQ_ROUTES.lease(lease.number)}>{lease.number}</RecordLink>,
  },
  { id: 'unit', header: 'Unit', cell: (lease) => <bdi>{lease.unit}</bdi> },
  {
    id: 'term',
    header: 'Term',
    cell: (lease) => <DateRangeText from={lease.start} to={lease.end} />,
  },
  { id: 'state', header: 'State', cell: (lease) => leaseBadge(lease) },
]

const INVOICE_COLUMNS: DataTableColumn<RentInvoice>[] = [
  { id: 'month', header: 'Month', cell: (invoice) => <MonthText month={invoice.month} /> },
  { id: 'number', header: 'Invoice', cell: (invoice) => <bdi>{invoice.number}</bdi> },
  { id: 'due', header: 'Due', numeric: true, cell: (invoice) => <DateText value={invoice.due} /> },
  { id: 'total', header: 'Amount', numeric: true, cell: (invoice) => money(invoice.total) },
  {
    id: 'paid',
    header: 'Paid on',
    numeric: true,
    cell: (invoice) => <DateText value={invoice.paid ?? null} />,
  },
  { id: 'state', header: 'State', cell: (invoice) => invoiceBadge(invoice) },
]

function tenantInvoices(id: string): RentInvoice[] {
  if (id === FEATURED_TENANT) return RADOVIC_INVOICES
  return OVERDUE_INVOICES[id] ?? []
}

export function TenantRecord({ phone, id }: { phone: boolean; id: string }) {
  const [requests] = useRequests()
  const [revealed, setRevealed] = useState(false)
  const tenant = findTenant(id)
  if (tenant === undefined) return null
  const unit = findUnit(tenant.unit)
  const leases = LEASES.filter((lease) => lease.tenant === tenant.id)
  const current = leases.find((lease) => lease.state !== 'Ended')
  const invoices = tenantInvoices(tenant.id)
  const theirRequests = requests.filter((request) => request.reportedBy === tenant.name)
  const contact: KeyValueItem[] = [
    { key: 'phone', label: 'Phone', value: <bdi dir="ltr">{tenant.phone}</bdi> },
    { key: 'email', label: 'E-mail', value: tenant.email ?? 'No e-mail address' },
    ...(tenant.taxId === undefined
      ? []
      : [{ key: 'pib', label: 'PIB', value: <bdi>{tenant.taxId}</bdi>, numeric: true }]),
    ...(tenant.nationalId === undefined
      ? []
      : [
          {
            key: 'jmbg',
            label: 'National ID (JMBG)',
            value: (
              <MaskedValue
                label="National ID"
                sentenceLabel="national ID"
                subject={tenant.name}
                reasons={REVEAL_REASONS}
                allowOther
                {...(revealed ? { value: <bdi>{tenant.nationalId}</bdi> } : {})}
                onReveal={() => {
                  setRevealed(true)
                }}
                onHide={() => {
                  setRevealed(false)
                }}
              />
            ),
          },
        ]),
    { key: 'portal', label: 'Tenants’ portal', value: tenant.portal, fullWidth: true },
  ]
  return (
    <PropertyShell
      phone={phone}
      tab="tenants"
      crumbs={[{ label: 'Tenants', href: `#${BQ_ROUTES.tenants}` }, { label: tenant.name }]}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={tenant.name}
        back={{ href: `#${BQ_ROUTES.tenants}`, label: 'Tenants' }}
        status={tenantBadge(tenant)}
        subtitle={
          <span className="bidi-content">
            {`${tenant.kind} · ${tenant.unit}${unit === undefined ? '' : `, ${unitPlace(unit)}`}`}
          </span>
        }
        keyFigures={[
          {
            key: 'rent',
            label: 'Monthly rent',
            value: money(unit?.monthlyRent ?? null),
          },
          {
            key: 'charges',
            label: 'Common charges',
            value: money(unit?.commonCharges ?? null),
          },
          { key: 'deposit', label: 'Deposit', value: money(current?.deposit ?? null) },
          {
            key: 'overdue',
            label: 'Overdue',
            value: money(tenant.overdue),
            ...(tenant.state === 'Rent overdue' ? { tone: 'danger' as const } : {}),
          },
        ]}
        sections={[
          {
            id: 'balance',
            label: 'Balance',
            content: <p className="bidi-content m-0 text-sm text-primary">{tenant.balance}</p>,
          },
          {
            id: 'contact',
            label: 'Contact',
            content: <KeyValueList columns={phone ? 1 : 2} items={contact} />,
          },
          {
            id: 'leases',
            label: 'Leases',
            flush: true,
            content: (
              <DataTable
                label={`Leases of ${tenant.name}`}
                layout={phone ? 'cards' : 'table'}
                inCard
                stickyHeader={false}
                columns={LEASE_ROW_COLUMNS}
                rows={leases}
                getRowId={(lease) => lease.number}
                getRowLabel={(lease) => lease.number}
                mobile={{
                  title: (lease) => (
                    <RecordLink href={BQ_ROUTES.lease(lease.number)}>{lease.number}</RecordLink>
                  ),
                  subtitle: (lease) => <DateRangeText from={lease.start} to={lease.end} />,
                  badge: (lease) => leaseBadge(lease),
                }}
              />
            ),
          },
          ...(invoices.length === 0
            ? []
            : [
                {
                  id: 'invoices',
                  label: 'Rent invoices',
                  flush: true,
                  content: (
                    <DataTable
                      label={`Rent invoices of ${tenant.name}`}
                      layout={phone ? 'cards' : 'table'}
                      inCard
                      stickyHeader={false}
                      columns={INVOICE_COLUMNS}
                      rows={invoices}
                      getRowId={(invoice) => invoice.number}
                      getRowLabel={(invoice) => invoice.number}
                      mobile={{
                        title: (invoice) => <MonthText month={invoice.month} />,
                        subtitle: (invoice) => <bdi>{invoice.number}</bdi>,
                        badge: (invoice) => invoiceBadge(invoice),
                        details: ['total', 'due'],
                      }}
                    />
                  ),
                },
              ]),
          {
            id: 'requests',
            label: 'Maintenance requests',
            content:
              theirRequests.length === 0 ? (
                <p className="bidi-content m-0 text-sm text-secondary">No requests.</p>
              ) : (
                <ul className="m-0 flex list-none flex-col gap-2 p-0">
                  {theirRequests.map((request) => (
                    <li key={request.number} className="flex flex-wrap items-center gap-2">
                      <RecordLink href={BQ_ROUTES.request(request.number)}>
                        {`${request.number} · ${request.what}`}
                      </RecordLink>
                      {requestBadge(request.state)}
                    </li>
                  ))}
                </ul>
              ),
          },
        ]}
      />
    </PropertyShell>
  )
}

// ── Leases ────────────────────────────────────────────────────────────────────────────────────

const LEASE_FILTERS: FilterDefinition[] = UNIT_FILTERS

function leaseMatches(lease: Lease, search: string, filters: DataTableFilters): boolean {
  const query = search.trim().toLocaleLowerCase('sr-Latn')
  if (
    query !== '' &&
    ![lease.number, lease.unit, lease.tenantName].some((text) =>
      text.toLocaleLowerCase('sr-Latn').includes(query),
    )
  ) {
    return false
  }
  const building = filters.building
  return typeof building !== 'string' || building === '' || lease.unit.startsWith(building)
}

const LEASE_COLUMNS: DataTableColumn<Lease>[] = [
  {
    id: 'lease',
    header: 'Lease',
    minWidth: 140,
    cell: (lease) => <TwoLines main={lease.number} detail={lease.unit} />,
  },
  {
    id: 'tenant',
    header: 'Tenant',
    minWidth: 180,
    cell: (lease) => <span className="bidi-content">{lease.tenantName}</span>,
  },
  {
    id: 'term',
    header: 'Term',
    minWidth: 200,
    cell: (lease) => (
      <span className="flex flex-col gap-0.5">
        <DateRangeText from={lease.start} to={lease.end} />
        {LEASE_END_NOTES[lease.number] !== undefined && (
          <span className="bidi-content text-xs text-secondary">
            {LEASE_END_NOTES[lease.number]}
          </span>
        )}
      </span>
    ),
  },
  {
    id: 'rent',
    header: 'Monthly rent',
    numeric: true,
    cell: (lease) => money(lease.monthlyRent),
  },
  { id: 'deposit', header: 'Deposit', numeric: true, cell: (lease) => money(lease.deposit) },
  { id: 'state', header: 'State', cell: (lease) => leaseBadge(lease) },
]

export function LeaseList({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [view, setView] = useState<LeaseView>('active')
  const [filters, setFilters] = useState<DataTableFilters>({})
  const [search, setSearch] = useState('')
  const rows = LEASES.filter(
    (lease) => inLeaseView(lease, view) && leaseMatches(lease, search, filters),
  )
  return (
    <PropertyShell phone={phone} tab="leases" crumbs={[{ label: 'Property' }, { label: 'Leases' }]}>
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Leases"
        views={LEASE_VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: LEASES.filter((lease) => inLeaseView(lease, each.id)).length,
        }))}
        view={view}
        onViewChange={(id) => {
          setView(id as LeaseView)
        }}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={LEASE_FILTERS}
            inline={1}
            values={filters}
            onValuesChange={setFilters}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Lease, unit or tenant"
          />
        }
      >
        <DataTable
          label="Leases"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={LEASE_COLUMNS}
          rows={rows}
          getRowId={(lease) => lease.number}
          getRowLabel={(lease) => `${lease.number} ${lease.unit} ${lease.tenantName}`}
          filters={{ ...filters, search }}
          onFiltersChange={() => {
            setFilters({})
            setSearch('')
          }}
          count={rows.length}
          onRowClick={(lease) => {
            navigate(BQ_ROUTES.lease(lease.number))
          }}
          mobile={{
            title: (lease) => lease.tenantName,
            subtitle: (lease) => <bdi>{`${lease.number} · ${lease.unit}`}</bdi>,
            badge: (lease) => leaseBadge(lease),
            details: ['term', 'rent'],
          }}
        />
      </ListPage>
    </PropertyShell>
  )
}

/** The renewal's fields while the dialog is open. */
interface RenewalDraft {
  end: string | null
  rent: string | null
}

export function LeasePage({
  phone,
  number,
  renew = false,
}: {
  phone: boolean
  number: string
  renew?: boolean
}) {
  const { format } = useLiro()
  const [renewing, setRenewing] = useState(renew)
  const [renewed, setRenewed] = useExampleState<boolean>('BQ.renewed', () => false)
  const [draft, setDraft] = useState<RenewalDraft>({
    end: FEATURED_LEASE_FACTS.renewalEnd,
    rent: FEATURED_LEASE_FACTS.renewalRent,
  })
  const lease = findLease(number)
  if (lease === undefined) return null
  const unit = findUnit(lease.unit)
  const tenant = findTenant(lease.tenant)
  const featured = lease.number === FEATURED_LEASE
  const subject = `${lease.number} · ${lease.tenantName}`
  const files: Attachment[] = featured
    ? LEASE_FILES.map((file) => ({ ...file, state: 'available' as const }))
    : [
        {
          id: 'lease',
          name: `Lease agreement ${lease.number}.pdf`,
          sizeText: '398 KB',
          state: 'available',
        },
      ]
  const renewal = (
    <Alert
      tone={renewed ? 'neutral' : 'warning'}
      title={
        renewed
          ? `${FEATURED_LEASE_FACTS.annex} sent to ${lease.tenantName} for signature on ${format.date(BQ_TODAY)}.`
          : FEATURED_LEASE_FACTS.ending
      }
      {...(renewed
        ? {}
        : {
            actions: (
              <Button
                family="neutral"
                icon={BellRing}
                label="Remind the tenant"
                onClick={() => {
                  notice.success(`Reminder sent to ${lease.tenantName}.`)
                }}
              />
            ),
          })}
    >
      {renewed ? (
        `Two more years from 01.01.2027 at ${format.money(draft.rent ?? FEATURED_LEASE_FACTS.renewalRent, 'RSD')} a month; the lease is renewed when both sides have signed.`
      ) : (
        <span className="flex flex-col gap-1">
          <span className="bidi-content">{FEATURED_LEASE_FACTS.offer}</span>
          <span className="bidi-content">{FEATURED_LEASE_FACTS.noticeBy}</span>
        </span>
      )}
    </Alert>
  )
  const canRenew = featured && !renewed
  return (
    <PropertyShell
      phone={phone}
      tab="leases"
      crumbs={[{ label: 'Leases', href: `#${BQ_ROUTES.leases}` }, { label: lease.number }]}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={`Lease ${lease.number}`}
        back={{ href: `#${BQ_ROUTES.leases}`, label: 'Leases' }}
        status={leaseBadge(lease)}
        subtitle={<span className="bidi-content">{`${lease.unit} · ${lease.tenantName}`}</span>}
        {...(canRenew
          ? {
              actions: (
                <Button
                  family="primary"
                  icon={FileSignature}
                  emphasis="primary"
                  label="Renew…"
                  onClick={() => {
                    setRenewing(true)
                  }}
                />
              ),
            }
          : {})}
        keyFigures={[
          { key: 'rent', label: 'Monthly rent', value: money(lease.monthlyRent) },
          { key: 'charges', label: 'Common charges', value: money(lease.commonCharges) },
          { key: 'deposit', label: 'Deposit', value: money(lease.deposit) },
          { key: 'end', label: 'Ends', value: <DateText value={lease.end} /> },
        ]}
        sections={[
          ...(featured ? [{ id: 'renewal', label: 'Renewal and expiry', content: renewal }] : []),
          {
            id: 'parties',
            label: 'Unit and tenant',
            content: (
              <KeyValueList
                columns={phone ? 1 : 2}
                items={[
                  {
                    key: 'unit',
                    label: 'Unit',
                    value: (
                      <RecordLink href={BQ_ROUTES.unit(lease.unit)}>
                        {unit === undefined ? lease.unit : `${lease.unit}, ${unitPlace(unit)}`}
                      </RecordLink>
                    ),
                  },
                  ...(unit === undefined
                    ? []
                    : [
                        {
                          key: 'address',
                          label: 'Address',
                          value: buildingOf(unit).address,
                        },
                        { key: 'area', label: 'Area', value: <Area value={unit.area} /> },
                      ]),
                  {
                    key: 'tenant',
                    label: 'Tenant',
                    value:
                      tenant === undefined ? (
                        lease.tenantName
                      ) : (
                        <RecordLink href={BQ_ROUTES.tenant(tenant.id)}>{tenant.name}</RecordLink>
                      ),
                  },
                  { key: 'landlord', label: 'Landlord', value: MANAGER.company },
                ]}
              />
            ),
          },
          {
            id: 'term',
            label: 'Term',
            content: (
              <KeyValueList
                columns={phone ? 1 : 2}
                items={[
                  ...(featured
                    ? [
                        {
                          key: 'signed',
                          label: 'Signed',
                          value: <DateText value={FEATURED_LEASE_FACTS.signed} />,
                          numeric: true,
                        },
                      ]
                    : []),
                  {
                    key: 'start',
                    label: 'Start',
                    value: <DateText value={lease.start} />,
                    numeric: true,
                  },
                  {
                    key: 'end',
                    label: 'End',
                    value: <DateText value={lease.end} />,
                    numeric: true,
                  },
                  ...(featured
                    ? [
                        { key: 'length', label: 'Term', value: FEATURED_LEASE_FACTS.term },
                        {
                          key: 'notice',
                          label: 'Notice period',
                          value: FEATURED_LEASE_FACTS.notice,
                        },
                        { key: 'renewal', label: 'Renewal', value: FEATURED_LEASE_FACTS.renewal },
                      ]
                    : []),
                ]}
              />
            ),
          },
          {
            id: 'rent',
            label: 'Rent and deposit',
            content: (
              <KeyValueList
                columns={phone ? 1 : 2}
                items={[
                  {
                    key: 'rent',
                    label: 'Monthly rent',
                    value: money(lease.monthlyRent),
                    numeric: true,
                  },
                  {
                    key: 'charges',
                    label: 'Common charges',
                    value: money(lease.commonCharges),
                    numeric: true,
                  },
                  { key: 'vat', label: 'VAT', value: vatWords(lease) },
                  ...(featured
                    ? [
                        { key: 'due', label: 'Paid', value: FEATURED_LEASE_FACTS.dueDay },
                        {
                          key: 'indexation',
                          label: 'Indexation',
                          value: FEATURED_LEASE_FACTS.indexation,
                        },
                      ]
                    : []),
                  {
                    key: 'deposit',
                    label: 'Deposit',
                    value: money(lease.deposit),
                    numeric: true,
                  },
                  ...(featured
                    ? [
                        {
                          key: 'held',
                          label: 'Deposit held',
                          value: `${FEATURED_LEASE_FACTS.depositState}, ${FEATURED_LEASE_FACTS.depositAccount}`,
                        },
                      ]
                    : []),
                ]}
              />
            ),
          },
          {
            id: 'documents',
            label: 'Documents',
            ...(featured
              ? {
                  actions: (
                    <RecordLink href={BQ_ROUTES.leaseDocument(lease.number)}>
                      Open the lease agreement
                    </RecordLink>
                  ),
                }
              : {}),
            flush: true,
            content: (
              <AttachmentList
                label={`Documents of ${lease.number}`}
                files={files}
                onDownload={(file) => {
                  notice.info(`${file.name} is downloading.`)
                }}
              />
            ),
          },
          ...(featured
            ? [
                {
                  id: 'invoices',
                  label: 'Rent invoices',
                  flush: true,
                  content: (
                    <DataTable
                      label={`Rent invoices of ${lease.number}`}
                      layout={phone ? 'cards' : 'table'}
                      inCard
                      stickyHeader={false}
                      columns={INVOICE_COLUMNS}
                      rows={RADOVIC_INVOICES}
                      getRowId={(invoice) => invoice.number}
                      getRowLabel={(invoice) => invoice.number}
                      mobile={{
                        title: (invoice) => <MonthText month={invoice.month} />,
                        subtitle: (invoice) => <bdi>{invoice.number}</bdi>,
                        badge: (invoice) => invoiceBadge(invoice),
                        details: ['total', 'paid'],
                      }}
                    />
                  ),
                },
              ]
            : []),
        ]}
      />
      <Dialog
        open={renewing}
        onOpenChange={setRenewing}
        title="Renew lease"
        subject={subject}
        description={`The application makes ${FEATURED_LEASE_FACTS.annex} with these terms and sends it to the tenant for signature.`}
        actions={
          <>
            <Button
              intent="cancel"
              label="Cancel"
              onClick={() => {
                setRenewing(false)
              }}
            />
            <Button
              family="primary"
              icon={Send}
              emphasis="primary"
              label="Send the annex"
              onClick={() => {
                setRenewing(false)
                setRenewed(true)
                notice.success(
                  `${FEATURED_LEASE_FACTS.annex} to ${lease.number} sent to ${lease.tenantName} for signature.`,
                )
              }}
            />
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <DateField
            label="New end"
            required
            value={draft.end}
            onChange={(end) => {
              setDraft((current) => ({ ...current, end }))
            }}
          />
          <MoneyField
            label="Monthly rent from 01.01.2027"
            required
            currency="RSD"
            description="The application’s proposal: today’s rent indexed by 3,9% (illustrative)."
            value={draft.rent}
            onChange={(rent) => {
              setDraft((current) => ({ ...current, rent }))
            }}
          />
        </div>
      </Dialog>
    </PropertyShell>
  )
}

export function LeaseDocument({ phone, number }: { phone: boolean; number: string }) {
  return (
    <PropertyShell
      phone={phone}
      tab="leases"
      crumbs={[
        { label: 'Leases', href: `#${BQ_ROUTES.leases}` },
        { label: number, href: `#${BQ_ROUTES.lease(number)}` },
        { label: 'Lease agreement' },
      ]}
    >
      <Frame phone={phone}>
        <PageHeader
          title={`Lease agreement ${number}`}
          back={{ href: `#${BQ_ROUTES.lease(number)}`, label: `Lease ${number}` }}
          subtitle="Signed on 15.12.2024 · illustrative text"
        />
        <DocumentFrame
          title={`Lease agreement ${number}`}
          srcDoc={LEASE_VIEWER}
          allowedOrigin="null"
        />
      </Frame>
    </PropertyShell>
  )
}

// ── Rent invoices ─────────────────────────────────────────────────────────────────────────────

function runColumns(issued: boolean): DataTableColumn<RunInvoice>[] {
  return [
    {
      id: 'unit',
      header: 'Unit',
      minWidth: 200,
      cell: (row) => (
        <TwoLines main={findTenant(row.tenant)?.name ?? ''} detail={`${row.unit} · ${row.lease}`} />
      ),
    },
    ...(issued
      ? [
          {
            id: 'number',
            header: 'Invoice',
            cell: (row: RunInvoice) => <bdi>{row.number}</bdi>,
          },
        ]
      : []),
    { id: 'rent', header: 'Rent', numeric: true, cell: (row) => money(row.rent) },
    { id: 'common', header: 'Common charges', numeric: true, cell: (row) => money(row.common) },
    { id: 'vat', header: 'VAT', numeric: true, cell: (row) => money(row.vat) },
    { id: 'total', header: 'Total', numeric: true, cell: (row) => money(row.total) },
    { id: 'delivery', header: 'Sent by', cell: (row) => row.delivery },
  ]
}

const PRINT_COLUMNS: PrintColumn<{ id: string; text: string; amount: string; vat: string }>[] = [
  { key: 'text', header: 'Description', cell: (line) => line.text },
  { key: 'vat', header: 'VAT', cell: (line) => line.vat, width: '28mm' },
  {
    key: 'amount',
    header: 'Amount',
    align: 'end',
    cell: (line) => <MoneyText value={line.amount} currency="RSD" />,
  },
]

/** One rent invoice as it is printed: the application's figures, PrintDocument's paper. */
function RentInvoicePrint({ row, issued }: { row: RunInvoice; issued: boolean }) {
  const monthText = useMonthText()
  const tenant = findTenant(row.tenant)
  const unit = findUnit(row.unit)
  const month = monthText('2026-11')
  const vat = row.vat === null ? 'Exempt' : '20%'
  return (
    <PrintDocument
      title="Invoice"
      {...(issued ? { number: row.number } : {})}
      footer={`${MANAGER.company} · ${issued ? row.number : 'Draft'} · Illustrative`}
      details={[
        {
          key: 'number',
          label: 'Invoice number',
          value: issued ? <bdi>{row.number}</bdi> : 'Given on issue',
          numeric: issued,
        },
        {
          key: 'issued',
          label: 'Date of issue',
          value: <DateText value={BQ_TODAY} />,
          numeric: true,
        },
        { key: 'period', label: 'Period', value: month },
        {
          key: 'due',
          label: 'Due date',
          value: <DateText value={RUN_TOTALS.dueDate} />,
          numeric: true,
        },
        { key: 'lease', label: 'Lease', value: <bdi>{row.lease}</bdi> },
      ]}
      parties={[
        {
          key: 'landlord',
          label: 'Landlord',
          name: MANAGER.company,
          lines: [MANAGER.address],
          details: [{ key: 'pib', label: 'PIB', value: MANAGER.taxId, numeric: true }],
        },
        {
          key: 'tenant',
          label: 'Tenant',
          name: tenant?.name ?? '',
          lines: unit === undefined ? [] : [`${unit.id}, ${buildingOf(unit).address}`],
          details: [
            ...(tenant?.taxId === undefined
              ? []
              : [{ key: 'pib', label: 'PIB', value: tenant.taxId, numeric: true }]),
            ...(tenant?.email === null || tenant === undefined
              ? []
              : [{ key: 'email', label: 'E-mail', value: tenant.email }]),
          ],
        },
      ]}
      amountDue={{ value: row.total, currency: 'RSD', date: RUN_TOTALS.dueDate }}
      payment={{
        title: 'Payment details',
        details: [
          { key: 'recipient', label: 'Recipient', value: `${MANAGER.company}, Novi Sad` },
          { key: 'account', label: 'Account', value: <bdi>{MANAGER.account}</bdi>, numeric: true },
          {
            key: 'reference',
            label: 'Reference number',
            value: <bdi>{`97 ${row.unit.replace(/[^0-9]/g, '')}-2026-11`}</bdi>,
            numeric: true,
          },
        ],
      }}
      lines={{
        caption: 'Lines',
        columns: PRINT_COLUMNS,
        rows: [
          {
            id: 'rent',
            text: `Rent for ${row.unit}, ${month}`,
            amount: row.rent,
            vat,
          },
          {
            id: 'common',
            text: `Common charges for ${row.unit}, ${month}`,
            amount: row.common,
            vat,
          },
        ],
        rowKey: (line) => line.id,
      }}
      totals={{
        label: 'Totals',
        rows: [
          { key: 'rent', label: 'Rent', value: row.rent, currency: 'RSD' },
          { key: 'common', label: 'Common charges', value: row.common, currency: 'RSD' },
          {
            key: 'vat',
            label: row.vat === null ? 'VAT (exempt, illustrative)' : 'VAT 20% (illustrative)',
            value: row.vat ?? '0.00',
            currency: 'RSD',
          },
        ],
        total: { key: 'total', label: 'Amount due', value: row.total, currency: 'RSD' },
      }}
      notes={[
        row.vat === null
          ? 'Residential rent is exempt from VAT (illustrative).'
          : 'VAT is charged on the rent of business premises (illustrative).',
        'Please quote the reference number when you pay.',
      ]}
    />
  )
}

export function RentRun({
  phone,
  preview: startPreview,
  issued: startIssued = false,
}: {
  phone: boolean
  preview?: string
  issued?: boolean
}) {
  const { format, linkComponent: Link } = useLiro()
  const [issued, setIssued] = useExampleState<boolean>('BQ.issued', () => startIssued)
  const [rerun, setRerun] = useState<string | null>(null)
  const [preview, setPreview] = useState<string | null>(startPreview ?? null)
  const running = rerun !== null
  const shown = RUN_INVOICES.find((row) => row.unit === preview)
  const linkClass = 'bidi-isolate text-sm text-link no-underline hover:underline'
  const checks: RunCheck[] = [
    {
      id: 'leases',
      label: 'Every let unit has an active lease',
      result: 'passed',
      detail: `${format.number(UNIT_FIGURES.let)} of ${format.number(UNIT_FIGURES.let)} let units`,
    },
    {
      id: 'starts',
      label: 'Leases starting in November',
      result: 'passed',
      detail:
        'UZ-2026-019, L2-4.2, Đorđe Milosavljević from 01.11.2026: the first invoice is in this run.',
    },
    {
      id: 'endings',
      label: 'Leases ending in November',
      result: 'warning',
      detail:
        'UZ-2024-009, G7-1.3, Mina Lazarević gave notice: the last rent is for November; the deposit is settled after the handover on 30.11.2026.',
      action: (
        <Link href={`#${BQ_ROUTES.lease('UZ-2024-009')}`} className={linkClass}>
          Open UZ-2024-009
        </Link>
      ),
    },
    {
      id: 'empty',
      label: 'Vacant units and units under repair are left out',
      result: 'passed',
      detail: 'L2-P.2 vacant; L2-2.1 and G7-2.2 under repair.',
    },
    {
      id: 'overdue',
      label: 'Tenants with overdue rent',
      result: 'warning',
      detail: `3 tenants owe ${format.money(UNIT_FIGURES.overdue, 'RSD')} from October; their November invoices are made as usual.`,
      action: (
        <Link href={`#${BQ_ROUTES.tenants}`} className={linkClass}>
          Open tenants
        </Link>
      ),
    },
    {
      id: 'delivery',
      label: 'Every tenant can receive the invoice',
      result: 'passed',
      detail: '16 by e-mail, 3 companies by e-invoice, 2 by post (no e-mail address).',
    },
  ]
  const issue = (
    <Button
      family="primary"
      icon={ReceiptText}
      emphasis="primary"
      label="Issue invoices"
      onClick={() => {
        setIssued(true)
        notice.success(
          `${RUN_TOTALS.invoices} rent invoices issued, ${RUN_TOTALS.first} to ${RUN_TOTALS.last}.`,
        )
      }}
    />
  )
  const table = (
    <DataTable
      label={`Rent invoices ${RUN_PERIOD}`}
      columns={runColumns(issued)}
      rows={RUN_INVOICES}
      getRowId={(row) => row.unit}
      getRowLabel={(row) => `${row.unit} ${findTenant(row.tenant)?.name ?? ''}`}
      inCard
      layout={phone ? 'cards' : 'table'}
      onRowClick={(row) => {
        setPreview(row.unit)
      }}
      totalsLabel="Total"
      totals={{
        rent: money(RUN_TOTALS.rent),
        common: money(RUN_TOTALS.common),
        vat: money(RUN_TOTALS.vat),
        total: money(RUN_TOTALS.total),
      }}
      mobile={{
        title: (row) => findTenant(row.tenant)?.name,
        subtitle: (row) => <bdi>{issued ? `${row.number} · ${row.unit}` : row.unit}</bdi>,
        details: ['rent', 'total'],
      }}
    />
  )
  return (
    <PropertyShell
      phone={phone}
      tab="rent"
      crumbs={[{ label: 'Rent invoices' }, { label: RUN_PERIOD }]}
      {...(phone && !running && !issued ? { bottomBar: issue } : {})}
    >
      <PeriodicRunPage
        layout={phone ? 'phone' : 'desktop'}
        title={`Rent invoices ${RUN_PERIOD}`}
        status={
          issued ? (
            <StatusBadge label="Issued" tone="success" />
          ) : (
            <StatusBadge label={running ? 'Calculating' : 'In review'} tone="info" />
          )
        }
        subtitle={
          issued
            ? `${format.number(RUN_TOTALS.invoices)} invoices, ${RUN_TOTALS.first} to ${RUN_TOTALS.last}, due ${format.date(RUN_TOTALS.dueDate)}`
            : `${format.number(RUN_TOTALS.leases)} leases · due ${format.date(RUN_TOTALS.dueDate)} · rates illustrative`
        }
        steps={RUN_STEPS}
        active={issued ? RUN_STEPS.length : running ? 1 : 2}
        lock={{
          state: 'open',
          detail: 'Prepared by Vesna Tomić on 14.10.2026 at 09:12.',
        }}
        keyFigures={[
          {
            key: 'invoices',
            label: 'Invoices',
            value: format.number(RUN_TOTALS.invoices),
          },
          { key: 'base', label: 'Rent and charges', value: money(RUN_TOTALS.rent) },
          { key: 'vat', label: 'VAT', value: money(RUN_TOTALS.vat) },
          { key: 'total', label: 'Total', value: money(RUN_TOTALS.total) },
        ]}
        {...(running
          ? {
              progress: {
                label: 'Calculating the rent',
                value: 0,
                max: Number(RUN_TOTALS.leases),
                current: rerun,
              },
            }
          : issued
            ? {
                preview: {
                  title: 'Issued invoices',
                  description: 'Sent to every tenant; each opens as it was printed.',
                  table,
                },
              }
            : {
                checks,
                ...(phone ? {} : { actions: issue }),
                preview: {
                  description:
                    'The invoices are made from these figures. Open one to see it as the tenant receives it.',
                  summary: (
                    <KeyValueList
                      columns={phone ? 1 : 2}
                      items={[
                        {
                          key: 'rent',
                          label: 'Rent',
                          value: money(RUN_TOTALS.rent),
                          numeric: true,
                        },
                        {
                          key: 'common',
                          label: 'Common charges',
                          value: money(RUN_TOTALS.common),
                          numeric: true,
                        },
                        {
                          key: 'vat',
                          label: 'VAT on business premises',
                          value: money(RUN_TOTALS.vat),
                          numeric: true,
                        },
                        {
                          key: 'total',
                          label: 'Total to invoice',
                          value: money(RUN_TOTALS.total),
                          numeric: true,
                        },
                      ]}
                    />
                  ),
                  table,
                },
              })}
        rerun={{
          title: 'Rerun the rent',
          subject: RUN_PERIOD,
          message: 'The figures of every invoice are calculated again. Nothing has been issued.',
          confirmLabel: 'Rerun',
          reasonLabel: 'Reason for the rerun',
          reasons: RERUN_REASONS,
          onConfirm: (answer) => {
            const reason = RERUN_REASONS.find((each) => each.value === answer.reason)
            setRerun(answer.text === '' ? (reason?.label ?? '') : answer.text)
          },
          ...(running ? { unavailableReason: 'The rent is being calculated.' } : {}),
          ...(issued ? { unavailableReason: 'The invoices are issued.' } : {}),
        }}
      />
      <Dialog
        open={shown !== undefined}
        onOpenChange={(open) => {
          if (!open) setPreview(null)
        }}
        size="wide"
        title={issued ? 'Invoice' : 'Invoice preview'}
        {...(shown === undefined
          ? {}
          : {
              subject: `${issued ? shown.number : shown.unit} · ${findTenant(shown.tenant)?.name ?? ''}`,
            })}
        description={
          issued
            ? 'As the tenant received it.'
            : 'As the tenant will receive it; the number is given on issue.'
        }
      >
        {shown !== undefined && <RentInvoicePrint row={shown} issued={issued} />}
      </Dialog>
    </PropertyShell>
  )
}

// ── Maintenance (the manager) ─────────────────────────────────────────────────────────────────

const REQUEST_FILTERS: FilterDefinition[] = [
  ...UNIT_FILTERS,
  {
    id: 'handler',
    label: 'Handled by',
    type: 'select',
    options: HANDLERS.map((handler) => ({ value: handler.value, label: handler.label })),
  },
]

function requestMatches(
  request: MaintenanceRequest,
  search: string,
  filters: DataTableFilters,
): boolean {
  const query = search.trim().toLocaleLowerCase('sr-Latn')
  if (
    query !== '' &&
    ![request.number, request.what, request.unit ?? '', request.reportedBy].some((text) =>
      text.toLocaleLowerCase('sr-Latn').includes(query),
    )
  ) {
    return false
  }
  const { building, handler } = filters
  if (typeof building === 'string' && building !== '' && building !== request.building) return false
  return typeof handler !== 'string' || handler === '' || handler === request.handler
}

function WorkOrderLink({ number }: { number: string | undefined }) {
  if (number === undefined) return <span className="text-secondary">—</span>
  // The maintenance company's work orders are not among the examples: the number, no link.
  return <bdi className="tabular-nums">{number}</bdi>
}

const REQUEST_COLUMNS: DataTableColumn<MaintenanceRequest>[] = [
  {
    id: 'request',
    header: 'Request',
    minWidth: 240,
    cell: (request) => <TwoLines main={request.what} detail={request.number} />,
  },
  { id: 'where', header: 'Where', minWidth: 160, cell: (request) => whereText(request) },
  {
    id: 'reported',
    header: 'Reported',
    minWidth: 160,
    cell: (request) => (
      <span className="flex flex-col gap-0.5">
        <span className="bidi-content">{request.reportedBy}</span>
        <span className="text-xs text-secondary">
          <DateText value={request.reportedAt.slice(0, 10)} />
        </span>
      </span>
    ),
  },
  {
    id: 'handler',
    header: 'Handled by',
    minWidth: 200,
    cell: (request) => (
      <span
        className={request.handler === undefined ? 'bidi-content text-secondary' : 'bidi-content'}
      >
        {handlerName(request.handler)}
      </span>
    ),
  },
  {
    id: 'order',
    header: 'Work order',
    cell: (request) => <WorkOrderLink number={request.workOrder} />,
  },
  { id: 'state', header: 'State', cell: (request) => requestBadge(request.state) },
]

function RequestDrawer({
  request,
  onClose,
  onAssign,
}: {
  request: MaintenanceRequest | undefined
  onClose: () => void
  onAssign: (request: MaintenanceRequest, handler: string) => void
}) {
  const { format } = useLiro()
  const [handler, setHandler] = useState(request?.handler ?? '')
  const [tried, setTried] = useState(false)
  const done = request?.state === 'Done'
  const changed = request !== undefined && handler !== (request.handler ?? '')
  return (
    <Drawer
      side="end"
      open={request !== undefined}
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={request === undefined ? '' : request.what}
      {...(request === undefined
        ? {}
        : { description: `${request.number} · ${whereText(request)}` })}
      {...(request === undefined || done
        ? {}
        : {
            actions: (
              <>
                <Button intent="cancel" label="Close" onClick={onClose} />
                <Button
                  family="primary"
                  icon={UserPlus}
                  emphasis="primary"
                  label={request.handler === undefined ? 'Assign' : 'Save'}
                  onClick={() => {
                    setTried(true)
                    if (handler === '' || !changed) return
                    onAssign(request, handler)
                  }}
                />
              </>
            ),
          })}
    >
      {request !== undefined && (
        <div className="flex flex-col gap-6">
          <KeyValueList
            columns={1}
            items={[
              { key: 'state', label: 'State', value: requestBadge(request.state) },
              { key: 'category', label: 'Kind', value: request.category },
              {
                key: 'reported',
                label: 'Reported',
                value: `${request.reportedBy}, ${format.date(request.reportedAt.slice(0, 10))} at ${format.time(request.reportedAt)} · ${request.channel}`,
              },
              ...(request.access === undefined
                ? []
                : [{ key: 'access', label: 'Access', value: request.access }]),
              {
                key: 'order',
                label: 'Work order',
                value: <WorkOrderLink number={request.workOrder} />,
              },
              { key: 'description', label: 'Description', value: request.description },
            ]}
          />
          {request.photos.length > 0 && (
            <AttachmentList
              label={`Photos of ${request.number}`}
              files={photoFiles(request)}
              onDownload={(file) => {
                notice.info(`${file.name} is downloading.`)
              }}
            />
          )}
          <StatusTimeline
            label={`Progress of ${request.number}`}
            steps={requestSteps(request)}
            current={currentStep(request)}
            {...(request.next === undefined
              ? {}
              : { next: { title: request.next, tone: 'neutral' as const } })}
          />
          {done ? (
            <KeyValueList
              columns={1}
              items={[{ key: 'handler', label: 'Handled by', value: handlerName(request.handler) }]}
            />
          ) : (
            <SelectField
              label="Handled by"
              required
              placeholder="Choose who handles it"
              options={HANDLERS}
              {...(handler === '' ? {} : { value: handler })}
              onChange={setHandler}
              {...(tried && handler === '' ? { error: 'Choose who handles the request.' } : {})}
            />
          )}
        </div>
      )}
    </Drawer>
  )
}

export function MaintenanceList({
  phone,
  request: startRequest = null,
}: {
  phone: boolean
  request?: string | null
}) {
  const [requests, setRequests] = useRequests()
  const [view, setView] = useState<RequestView>('open')
  const [filters, setFilters] = useState<DataTableFilters>({})
  const [search, setSearch] = useState('')
  const [chosen, setChosen] = useState<string | null>(startRequest)
  const rows = requests.filter(
    (request) => inRequestView(request, view) && requestMatches(request, search, filters),
  )
  const current = requests.find((request) => request.number === chosen)
  return (
    <PropertyShell
      phone={phone}
      tab="maintenance"
      crumbs={[{ label: 'Property' }, { label: 'Maintenance' }]}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Maintenance requests"
        views={REQUEST_VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: requests.filter((request) => inRequestView(request, each.id)).length,
        }))}
        view={view}
        onViewChange={(id) => {
          setView(id as RequestView)
        }}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={REQUEST_FILTERS}
            inline={2}
            values={filters}
            onValuesChange={setFilters}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Number, problem, unit or tenant"
          />
        }
      >
        <DataTable
          label="Maintenance requests"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={REQUEST_COLUMNS}
          rows={rows}
          getRowId={(request) => request.number}
          getRowLabel={(request) => `${request.number} ${request.what}`}
          filters={{ ...filters, search }}
          onFiltersChange={() => {
            setFilters({})
            setSearch('')
          }}
          count={rows.length}
          onRowClick={(request) => {
            setChosen(request.number)
          }}
          mobile={{
            title: (request) => request.what,
            subtitle: (request) => (
              <span className="bidi-content">{`${request.number} · ${whereText(request)}`}</span>
            ),
            badge: (request) => requestBadge(request.state),
            details: ['handler', 'order'],
          }}
        />
      </ListPage>
      <RequestDrawer
        key={chosen ?? 'none'}
        request={current}
        onClose={() => {
          setChosen(null)
        }}
        onAssign={(request, handler) => {
          setRequests((list) =>
            list.map((each) =>
              each.number === request.number
                ? {
                    ...each,
                    handler,
                    state: each.state === 'New' ? 'Assigned' : each.state,
                    times: each.state === 'New' ? [each.times[0], BQ_NOW] : each.times,
                  }
                : each,
            ),
          )
          setChosen(null)
          notice.success(`${request.number} is handled by ${handlerName(handler)}.`)
        }}
      />
    </PropertyShell>
  )
}

// ── The tenants' portal ───────────────────────────────────────────────────────────────────────

const RESIDENT = must(findTenant(FEATURED_TENANT), FEATURED_TENANT)
const RESIDENT_UNIT = must(findUnit(RESIDENT.unit), RESIDENT.unit)
const RESIDENT_LEASE = must(findLease(FEATURED_LEASE), FEATURED_LEASE)

type PortalKey = 'home' | 'requests' | 'invoices'

function portalMenu(navigate: (path: string) => void): MenuEntry[] {
  return [
    { label: 'My details', icon: UserRound, onSelect: () => undefined },
    { type: 'separator' },
    {
      label: 'Sign out',
      icon: LogOut,
      onSelect: () => {
        navigate(ROUTES.signIn)
      },
    },
  ]
}

function TenantPortal({
  phone,
  current,
  children,
}: {
  phone: boolean
  current: PortalKey
  children: ReactNode
}) {
  const navigate = useContext(Navigate)
  const [requests] = useRequests()
  const open = requests.filter(
    (request) => request.reportedBy === RESIDENT.name && request.state !== 'Done',
  ).length
  const sections: PortalSection[] = [
    { key: 'home', label: 'Home', href: `#${BQ_ROUTES.portal}`, icon: House },
    {
      key: 'requests',
      label: 'Requests',
      href: `#${BQ_ROUTES.portalRequests}`,
      icon: Wrench,
      ...(open === 0 ? {} : { note: `${String(open)} open` }),
    },
    { key: 'invoices', label: 'Invoices', href: `#${BQ_ROUTES.portalInvoices}`, icon: FileText },
  ]
  return (
    <PropertyProvider>
      <PortalShell
        layout={phone ? 'phone' : 'desktop'}
        brand={{
          brandName: 'Kvadrat Nekretnine',
          productName: 'Tenants',
          href: `#${BQ_ROUTES.portal}`,
        }}
        participant={{
          name: RESIDENT.name,
          detail: `Flat ${RESIDENT.unit} · ${unitPlace(RESIDENT_UNIT)}`,
        }}
        menu={portalMenu(navigate)}
        sections={sections.map((section) =>
          section.key === current ? { ...section, current: true } : section,
        )}
        footer={`${MANAGER.company} · ${MANAGER.phone} · Illustrative data`}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </PortalShell>
    </PropertyProvider>
  )
}

/** A portal page: one column, centred on wide screens. */
function PortalPage({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto box-border flex w-full max-w-3xl min-w-0 flex-col gap-4 p-4 sm:gap-6 sm:p-6">
      {children}
    </div>
  )
}

const MY_REQUEST_COLUMNS: DataTableColumn<MaintenanceRequest>[] = [
  {
    id: 'request',
    header: 'Request',
    minWidth: 220,
    cell: (request) => (
      <span className="flex flex-col gap-0.5">
        <RecordLink href={BQ_ROUTES.portalRequest(request.number)}>{request.what}</RecordLink>
        <span className="bidi-isolate text-xs text-secondary">{request.number}</span>
      </span>
    ),
  },
  {
    id: 'reported',
    header: 'Reported',
    numeric: true,
    cell: (request) => <DateText value={request.reportedAt.slice(0, 10)} />,
  },
  { id: 'state', header: 'State', cell: (request) => requestBadge(request.state) },
]

export function PortalHome({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const [requests] = useRequests()
  const [renewed] = useExampleState<boolean>('BQ.renewed', () => false)
  const open = requests.filter(
    (request) => request.reportedBy === RESIDENT.name && request.state !== 'Done',
  )
  const last = RADOVIC_INVOICES[0]
  return (
    <TenantPortal phone={phone} current="home">
      <PortalPage>
        <PageHeader
          title="My home"
          subtitle={`${buildingOf(RESIDENT_UNIT).name}, flat ${RESIDENT.unit}`}
          actions={
            <Button
              family="primary"
              icon={Wrench}
              emphasis="primary"
              label="Report a problem"
              onClick={() => {
                navigate(BQ_ROUTES.portalNew)
              }}
            />
          }
        />
        <Alert
          tone={renewed ? 'neutral' : 'warning'}
          title={
            renewed
              ? 'Your lease renewal is waiting for your signature.'
              : 'Your lease ends on 31.12.2026.'
          }
          actions={
            <Button
              family="neutral"
              icon={FileText}
              label="Download the offer"
              onClick={() => {
                notice.info('Renewal offer, 01.10.2026.pdf is downloading.')
              }}
            />
          }
        >
          {`${MANAGER.company} offers two more years from 01.01.2027 at ${format.money(FEATURED_LEASE_FACTS.renewalRent, 'RSD')} a month. Please answer by 31.10.2026.`}
        </Alert>
        <SectionCard title="My flat" headingLevel={2}>
          <KeyValueList
            columns={phone ? 1 : 2}
            items={[
              {
                key: 'flat',
                label: 'Flat',
                value: `${RESIDENT.unit}, ${unitPlace(RESIDENT_UNIT)}`,
              },
              { key: 'address', label: 'Address', value: buildingOf(RESIDENT_UNIT).address },
              {
                key: 'lease',
                label: 'Lease',
                value: <DateRangeText from={RESIDENT_LEASE.start} to={RESIDENT_LEASE.end} />,
              },
              {
                key: 'rent',
                label: 'Monthly rent',
                value: money(RESIDENT_LEASE.monthlyRent),
                numeric: true,
              },
              {
                key: 'charges',
                label: 'Common charges',
                value: money(RESIDENT_LEASE.commonCharges),
                numeric: true,
              },
              { key: 'due', label: 'Paid', value: FEATURED_LEASE_FACTS.dueDay },
            ]}
          />
        </SectionCard>
        <SectionCard title="Repairs" headingLevel={2}>
          {open.length === 0 ? (
            <p className="bidi-content m-0 text-sm text-secondary">Nothing open.</p>
          ) : (
            <ul className="m-0 flex list-none flex-col gap-3 p-0">
              {open.map((request) => (
                <li key={request.number} className="flex flex-col gap-1">
                  <span className="flex flex-wrap items-center gap-2">
                    <RecordLink href={BQ_ROUTES.portalRequest(request.number)}>
                      {request.what}
                    </RecordLink>
                    {requestBadge(request.state)}
                  </span>
                  {request.next !== undefined && (
                    <span className="bidi-content text-sm text-secondary">{request.next}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </SectionCard>
        {last !== undefined && (
          <SectionCard title="Invoices" headingLevel={2}>
            <KeyValueList
              columns={phone ? 1 : 2}
              items={[
                {
                  key: 'last',
                  label: 'Last invoice',
                  value: (
                    <span className="bidi-content">
                      {`${last.number}, ${format.money(last.total, 'RSD')}, paid on ${format.date(last.paid ?? '')}`}
                    </span>
                  ),
                },
                {
                  key: 'next',
                  label: 'Next invoice',
                  value: `November 2026, due ${format.date(RUN_TOTALS.dueDate)}`,
                },
              ]}
            />
          </SectionCard>
        )}
      </PortalPage>
    </TenantPortal>
  )
}

/** What the tenant has written so far, kept above the screen. */
interface RequestDraft {
  category: string
  room: string
  description: string
  access: string
  phone: string
  photos: { id: string; name: string; sizeText: string }[]
}

const EMPTY_DRAFT: RequestDraft = {
  category: '',
  room: '',
  description: '',
  access: 'call',
  phone: RESIDENT.phone,
  photos: [],
}

const FILLED_DRAFT: RequestDraft = {
  category: 'Appliances',
  room: 'Kitchen',
  description: 'The oven does not heat; the light and the fan work.',
  access: 'enter',
  phone: RESIDENT.phone,
  photos: [{ id: 'p1', name: 'Oven display.jpg', sizeText: '2,6 MB' }],
}

export function PortalNewRequest({ phone, filled = false }: { phone: boolean; filled?: boolean }) {
  const navigate = useContext(Navigate)
  const [, setRequests] = useRequests()
  const [form, setForm] = useExampleState<RequestDraft>(
    filled ? 'BQ.draft-filled' : 'BQ.draft',
    () => (filled ? FILLED_DRAFT : EMPTY_DRAFT),
  )
  const [tried, setTried] = useState(false)
  const errors = {
    category: form.category === '' ? 'Choose what is wrong.' : undefined,
    description:
      form.description.trim() === '' ? 'Describe the problem in a sentence or two.' : undefined,
  }
  const submit = () => {
    setTried(true)
    if (errors.category !== undefined || errors.description !== undefined) return
    const category = REQUEST_CATEGORIES.find((each) => each.value === form.category)?.label ?? ''
    const request: MaintenanceRequest = {
      number: NEW_REQUEST,
      what: form.description.trim().split('.')[0] ?? category,
      category,
      unit: RESIDENT.unit,
      building: RESIDENT_UNIT.building,
      ...(form.room === '' ? {} : { room: form.room }),
      description: form.description.trim(),
      reportedBy: RESIDENT.name,
      reportedAt: BQ_NOW,
      channel: 'Tenants’ portal',
      state: 'New',
      access: ACCESS_OPTIONS.find((each) => each.value === form.access)?.label ?? '',
      next: 'Vesna Tomić assigns it today; you get a message when a visit is planned.',
      photos: form.photos,
      times: [BQ_NOW],
    }
    setRequests((list) => [request, ...list.filter((each) => each.number !== NEW_REQUEST)])
    setForm(EMPTY_DRAFT)
    notice.success(`Request ${NEW_REQUEST} sent to ${MANAGER.company}.`)
    navigate(BQ_ROUTES.portalRequest(NEW_REQUEST))
  }
  const files: Attachment[] = form.photos.map((photo) => ({ ...photo, state: 'available' }))
  return (
    <TenantPortal phone={phone} current="requests">
      <PortalPage>
        <PageHeader
          title="Report a problem"
          back={{ label: 'Requests', href: `#${BQ_ROUTES.portalRequests}` }}
          subtitle={`Flat ${RESIDENT.unit}, ${unitPlace(RESIDENT_UNIT)}`}
        />
        <Alert tone="warning" title="In an emergency, call">
          {`Water or gas pouring out, or no electricity in the whole flat: call ${MANAGER.phone} at once, day or night. Do not wait for an answer here.`}
        </Alert>
        <SectionCard headingLevel={2}>
          <form
            noValidate
            aria-label="New maintenance request"
            className="flex flex-col gap-4"
            onSubmit={(event) => {
              event.preventDefault()
              submit()
            }}
          >
            <SelectField
              label="What is wrong?"
              required
              placeholder="Choose"
              options={REQUEST_CATEGORIES}
              {...(form.category === '' ? {} : { value: form.category })}
              onChange={(category) => {
                setForm((current) => ({ ...current, category }))
              }}
              {...(tried && errors.category !== undefined ? { error: errors.category } : {})}
            />
            <SelectField
              label="Where?"
              placeholder="Choose the room"
              options={ROOMS}
              {...(form.room === '' ? {} : { value: form.room })}
              onChange={(room) => {
                setForm((current) => ({ ...current, room }))
              }}
            />
            <TextAreaField
              label="Description"
              required
              description="What happens, since when, and what you have done so far."
              value={form.description}
              onChange={(description) => {
                setForm((current) => ({ ...current, description }))
              }}
              {...(tried && errors.description !== undefined ? { error: errors.description } : {})}
            />
            <FileDropzone
              label="Photos"
              description="A photo helps the technician bring the right parts."
              accept={['image/jpeg', 'image/png', 'image/heic']}
              acceptText="JPG, PNG or HEIC"
              maxSize={15 * 1024 * 1024}
              maxSizeText="15 MB"
              multiple
              camera
              layout={phone ? 'phone' : 'desktop'}
              onFiles={(chosen) => {
                setForm((current) => ({
                  ...current,
                  photos: [
                    ...current.photos,
                    ...chosen.map((file, index) => ({
                      id: `${file.name}-${String(current.photos.length + index)}`,
                      name: file.name,
                      sizeText: '1,2 MB',
                    })),
                  ],
                }))
              }}
            />
            {files.length > 0 && (
              <AttachmentList
                label="Photos added"
                files={files}
                canRemove={() => true}
                onRemove={(file) => {
                  setForm((current) => ({
                    ...current,
                    photos: current.photos.filter((photo) => photo.id !== file.id),
                  }))
                }}
              />
            )}
            <RadioGroupField
              label="May we enter?"
              options={ACCESS_OPTIONS}
              value={form.access}
              onChange={(access) => {
                setForm((current) => ({ ...current, access }))
              }}
            />
            <TextField
              label="Phone"
              direction="ltr"
              value={form.phone}
              onChange={(value) => {
                setForm((current) => ({ ...current, phone: value }))
              }}
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                intent="cancel"
                label="Cancel"
                onClick={() => {
                  navigate(BQ_ROUTES.portalRequests)
                }}
              />
              <Button
                family="primary"
                icon={Send}
                emphasis="primary"
                type="submit"
                label="Send request"
              />
            </div>
          </form>
        </SectionCard>
      </PortalPage>
    </TenantPortal>
  )
}

export function PortalRequests({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [requests] = useRequests()
  const mine = requests.filter((request) => request.reportedBy === RESIDENT.name)
  return (
    <TenantPortal phone={phone} current="requests">
      <PortalPage>
        <PageHeader
          title="My requests"
          actions={
            <Button
              family="primary"
              icon={Wrench}
              emphasis="primary"
              label="Report a problem"
              onClick={() => {
                navigate(BQ_ROUTES.portalNew)
              }}
            />
          }
        />
        <DataTable
          label="My requests"
          layout={phone ? 'cards' : 'table'}
          columns={MY_REQUEST_COLUMNS}
          rows={mine}
          getRowId={(request) => request.number}
          getRowLabel={(request) => `${request.number} ${request.what}`}
          onRowClick={(request) => {
            navigate(BQ_ROUTES.portalRequest(request.number))
          }}
          mobile={{
            title: (request) => request.what,
            subtitle: (request) => <DateText value={request.reportedAt.slice(0, 10)} />,
            badge: (request) => requestBadge(request.state),
          }}
        />
      </PortalPage>
    </TenantPortal>
  )
}

export function PortalRequest({ phone, number }: { phone: boolean; number: string }) {
  const { format } = useLiro()
  const [requests] = useRequests()
  const request = requests.find((each) => each.number === number) ?? findRequest(number)
  if (request === undefined) return null
  return (
    <TenantPortal phone={phone} current="requests">
      <PortalPage>
        <PageHeader
          title={request.what}
          back={{ label: 'My requests', href: `#${BQ_ROUTES.portalRequests}` }}
          status={requestBadge(request.state)}
          subtitle={`${request.number} · reported ${format.date(request.reportedAt.slice(0, 10))} at ${format.time(request.reportedAt)}`}
        />
        <SectionCard title="Progress" headingLevel={2}>
          <StatusTimeline
            label={`Progress of ${request.number}`}
            steps={requestSteps(request)}
            current={currentStep(request)}
            {...(request.next === undefined
              ? {}
              : { next: { title: request.next, tone: 'neutral' as const } })}
          />
        </SectionCard>
        <SectionCard title="What you reported" headingLevel={2}>
          <KeyValueList
            columns={1}
            items={[
              { key: 'category', label: 'Kind', value: request.category },
              { key: 'where', label: 'Where', value: whereText(request) },
              { key: 'description', label: 'Description', value: request.description },
              ...(request.access === undefined
                ? []
                : [{ key: 'access', label: 'May we enter?', value: request.access }]),
            ]}
          />
        </SectionCard>
        {request.photos.length > 0 && (
          <SectionCard title="Photos" headingLevel={2} flush>
            <AttachmentList
              label={`Photos of ${request.number}`}
              files={photoFiles(request)}
              onDownload={(file) => {
                notice.info(`${file.name} is downloading.`)
              }}
            />
          </SectionCard>
        )}
      </PortalPage>
    </TenantPortal>
  )
}

export function PortalInvoices({ phone }: { phone: boolean }) {
  return (
    <TenantPortal phone={phone} current="invoices">
      <PortalPage>
        <PageHeader
          title="Invoices"
          subtitle={`Rent and common charges for flat ${RESIDENT.unit}`}
        />
        <DataTable
          label="Invoices"
          layout={phone ? 'cards' : 'table'}
          columns={INVOICE_COLUMNS}
          rows={RADOVIC_INVOICES}
          getRowId={(invoice) => invoice.number}
          getRowLabel={(invoice) => invoice.number}
          rowActions={(invoice) => [
            {
              label: 'Download PDF',
              icon: FileText,
              onSelect: () => {
                notice.info(`${invoice.number}.pdf is downloading.`)
              },
            },
          ]}
          mobile={{
            title: (invoice) => <MonthText month={invoice.month} />,
            subtitle: (invoice) => <bdi>{invoice.number}</bdi>,
            badge: (invoice) => invoiceBadge(invoice),
            details: ['total', 'paid'],
          }}
        />
      </PortalPage>
    </TenantPortal>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BQ_ROUTES: ExampleRoute[] = [
  { path: BQ_ROUTES.units, render: (phone) => <UnitRack phone={phone} /> },
  ...UNITS.map((unit) => ({
    path: BQ_ROUTES.unit(unit.id),
    render: (phone: boolean) => <UnitRack phone={phone} unit={unit.id} />,
  })),
  { path: BQ_ROUTES.unitsList, render: (phone) => <UnitList phone={phone} /> },
  { path: BQ_ROUTES.tenants, render: (phone) => <TenantList phone={phone} /> },
  ...TENANTS.map((tenant) => ({
    path: BQ_ROUTES.tenant(tenant.id),
    render: (phone: boolean) => <TenantRecord phone={phone} id={tenant.id} />,
  })),
  { path: BQ_ROUTES.leases, render: (phone) => <LeaseList phone={phone} /> },
  ...LEASES.map((lease) => ({
    path: BQ_ROUTES.lease(lease.number),
    render: (phone: boolean) => <LeasePage phone={phone} number={lease.number} />,
  })),
  {
    path: BQ_ROUTES.leaseRenew,
    render: (phone) => <LeasePage phone={phone} number={FEATURED_LEASE} renew />,
  },
  {
    path: BQ_ROUTES.leaseDocument(FEATURED_LEASE),
    render: (phone) => <LeaseDocument phone={phone} number={FEATURED_LEASE} />,
  },
  { path: BQ_ROUTES.run, render: (phone) => <RentRun phone={phone} /> },
  {
    path: BQ_ROUTES.runPreview,
    render: (phone) => <RentRun phone={phone} preview="L2-3.2" />,
  },
  { path: BQ_ROUTES.runIssued, render: (phone) => <RentRun phone={phone} issued /> },
  { path: BQ_ROUTES.requests, render: (phone) => <MaintenanceList phone={phone} /> },
  ...REQUESTS.map((request) => ({
    path: BQ_ROUTES.request(request.number),
    render: (phone: boolean) => <MaintenanceList phone={phone} request={request.number} />,
  })),
  { path: BQ_ROUTES.portal, render: (phone) => <PortalHome phone={phone} /> },
  { path: BQ_ROUTES.portalRequests, render: (phone) => <PortalRequests phone={phone} /> },
  { path: BQ_ROUTES.portalNew, render: (phone) => <PortalNewRequest phone={phone} /> },
  {
    path: `${BQ_ROUTES.portalNew}?draft=filled`,
    render: (phone) => <PortalNewRequest phone={phone} filled />,
  },
  ...[...REQUESTS.map((request) => request.number), NEW_REQUEST].map((number) => ({
    path: BQ_ROUTES.portalRequest(number),
    render: (phone: boolean) => <PortalRequest phone={phone} number={number} />,
  })),
  { path: BQ_ROUTES.portalInvoices, render: (phone) => <PortalInvoices phone={phone} /> },
]
