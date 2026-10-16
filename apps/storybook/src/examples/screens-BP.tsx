import { CheckCheck, Fuel } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  Button,
  DataTable,
  DateField,
  DateText,
  DetailPage,
  Dialog,
  FilterBar,
  KeyValueList,
  ListPage,
  MoneyField,
  MoneyText,
  NumberField,
  SelectField,
  StatusBadge,
  TextAreaField,
  toneFor,
  Toaster,
  notice,
  useLiro,
  type DataTableColumn,
  type DataTableFilters,
  type DetailSection,
  type FilterDefinition,
  type ModuleTab,
  type Tone,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { Navigate, Shell } from './example-shell'
import { useExampleState } from './example-state'
import { Tenant } from './screens-G'
import {
  BP_ROUTES,
  BP_TODAY,
  FEATURED_VEHICLE,
  FUEL,
  FUEL_TOTALS,
  inRemindersView,
  inVehiclesView,
  KIND_OPTIONS,
  NEW_FUEL,
  PAID_OPTIONS,
  PAPERS,
  REMINDER_KINDS,
  REMINDER_TONES,
  REMINDER_VIEWS,
  REMINDERS,
  SERVICES,
  SERVICES_TOTAL,
  VAN_FIGURES,
  VEHICLE_TONES,
  VEHICLE_VIEWS,
  VEHICLES,
  type Due,
  type FuelEntry,
  type Paper,
  type Reminder,
  type RemindersView,
  type ReminderState,
  type ServiceEntry,
  type Vehicle,
  type VehiclesView,
  type VehicleState,
} from './data-BP'

/*
 * Group BP's example screens (P5.75, fleet): Kvadrat Gradnja d.o.o.'s vehicles on 14 October 2026,
 * kept by Milica Petrović.
 * - The vehicles (ListPage): the registration plate and the model, the driver, the mileage, the
 *   registration's expiry and the next service — each with the application's words in its tone
 *   ("Expires in 5 days", "Overdue by 2.880 km") — and the state; views "In the fleet", "Sold and
 *   returned", "All"; search and a filter by kind.
 * - One vehicle (DetailPage, the site van NS-123-AB): the key figures (mileage, the application's
 *   consumption, fuel this year), the vehicle and how it is held (lease, fixed asset), the
 *   registration and insurance with their expiry, its reminders, the services with their invoices,
 *   the fuel entries with litres, cost, mileage and the application's consumption, and "Add fuel
 *   entry" (a dialog; the application writes the consumption).
 * - The reminders (ListPage): registration, insurance, service and tyres for every vehicle, the
 *   due date or reading, the state in words; "Mark as done…" in the row's menu (a dialog: when,
 *   and a note).
 * The screens play the application: the vehicles, fuel entries and reminders live above the
 * screens (`useExampleState`); every figure and every word of a state comes from data-BP.ts.
 */

export { BP_ROUTES }

// ── Shared pieces ─────────────────────────────────────────────────────────────────────────────

type FleetTab = 'vehicles' | 'reminders'

function fleetTabs(current: FleetTab): ModuleTab[] {
  return [
    {
      key: 'vehicles',
      label: 'Vehicles',
      href: `#${BP_ROUTES.vehicles}`,
      current: current === 'vehicles',
    },
    {
      key: 'reminders',
      label: 'Reminders',
      href: `#${BP_ROUTES.reminders}`,
      current: current === 'reminders',
    },
  ]
}

function FleetShell({
  phone,
  tab,
  crumbs,
  children,
}: {
  phone: boolean
  tab: FleetTab
  crumbs: { label: string; href?: string }[]
  children: ReactNode
}) {
  return (
    <Tenant today={BP_TODAY}>
      <Shell phone={phone} crumbs={crumbs} tabs={fleetTabs(tab)}>
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

function useVehicles() {
  return useExampleState<readonly Vehicle[]>('BP.vehicles', () => VEHICLES)
}

function useReminders() {
  return useExampleState<readonly Reminder[]>('BP.reminders', () => REMINDERS)
}

function vehicleBadge(state: VehicleState) {
  return <StatusBadge label={state} tone={toneFor(state, VEHICLE_TONES)} />
}

function reminderBadge(state: ReminderState) {
  return <StatusBadge label={state} tone={toneFor(state, REMINDER_TONES)} />
}

/** The application's words in their tone's text colour; neutral ones in the secondary text. */
const TONE_TEXT: Record<Tone, string> = {
  danger: 'text-status-danger-fg',
  warning: 'text-status-warning-fg',
  success: 'text-status-success-fg',
  info: 'text-secondary',
  neutral: 'text-secondary',
  premium: 'text-secondary',
}

/** A date or a reading that falls due, and how far it is in the application's words. */
function DueCell({ due }: { due: Due | null }) {
  if (due === null) return <span className="text-secondary">—</span>
  return (
    <span className="flex flex-col gap-0.5">
      {due.date === undefined ? (
        <bdi className="tabular-nums">{due.text}</bdi>
      ) : (
        <DateText value={due.date} />
      )}
      <span className={`bidi-content text-xs ${TONE_TEXT[due.tone]}`}>{due.words}</span>
    </span>
  )
}

function TwoLines({ first, second }: { first: ReactNode; second: ReactNode }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="bidi-content font-medium">{first}</span>
      <span className="bidi-content text-xs text-secondary">{second}</span>
    </span>
  )
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

function money(value: string | null) {
  return <MoneyText value={value} currency="RSD" />
}

function useAmounts() {
  const { format } = useLiro()
  return {
    km: (value: string) => <bdi className="tabular-nums">{`${format.number(value)} km`}</bdi>,
    litres: (value: string) => <bdi className="tabular-nums">{`${format.number(value)} l`}</bdi>,
  }
}

// ── The vehicles ──────────────────────────────────────────────────────────────────────────────

const VEHICLE_FILTERS: FilterDefinition[] = [
  { id: 'kind', label: 'Kind', type: 'select', options: KIND_OPTIONS },
]

function matchesVehicle(each: Vehicle, search: string, filters: DataTableFilters): boolean {
  const query = search.trim().toLocaleLowerCase('sr-Latn')
  if (
    query !== '' &&
    ![each.plate, each.model, each.driver].some((text) =>
      text.toLocaleLowerCase('sr-Latn').includes(query),
    )
  ) {
    return false
  }
  const kind = filters.kind
  return typeof kind !== 'string' || kind === '' || kind === each.kind
}

export function Vehicles({ phone, view: startView }: { phone: boolean; view?: VehiclesView }) {
  const navigate = useContext(Navigate)
  const amounts = useAmounts()
  const [vehicles] = useVehicles()
  const [view, setView] = useState<VehiclesView>(startView ?? 'active')
  const [filters, setFilters] = useState<DataTableFilters>({})
  const [search, setSearch] = useState('')
  const rows = vehicles.filter(
    (each) => inVehiclesView(each, view) && matchesVehicle(each, search, filters),
  )
  const columns: DataTableColumn<Vehicle>[] = [
    {
      id: 'vehicle',
      header: 'Vehicle',
      minWidth: 200,
      cell: (each) => (
        <TwoLines first={<bdi>{each.plate}</bdi>} second={`${each.model} · ${each.kind}`} />
      ),
    },
    {
      id: 'driver',
      header: 'Driver',
      minWidth: 160,
      cell: (each) => <TwoLines first={each.driver} second={each.driverRole} />,
    },
    { id: 'mileage', header: 'Mileage', numeric: true, cell: (each) => amounts.km(each.mileage) },
    {
      id: 'registration',
      header: 'Registration',
      cell: (each) => <DueCell due={each.registration} />,
    },
    {
      id: 'service',
      header: 'Next service',
      minWidth: 160,
      cell: (each) => <DueCell due={each.service} />,
    },
    { id: 'state', header: 'State', cell: (each) => vehicleBadge(each.state) },
  ]
  return (
    <FleetShell phone={phone} tab="vehicles" crumbs={[{ label: 'Fleet' }, { label: 'Vehicles' }]}>
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Vehicles"
        views={VEHICLE_VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: vehicles.filter((vehicle) => inVehiclesView(vehicle, each.id)).length,
        }))}
        view={view}
        onViewChange={(id) => {
          setView(id as VehiclesView)
        }}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={VEHICLE_FILTERS}
            inline={1}
            values={filters}
            onValuesChange={setFilters}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Plate, model or driver"
          />
        }
      >
        <DataTable
          label="Vehicles"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={columns}
          rows={rows}
          getRowId={(each) => each.plate}
          getRowLabel={(each) => `${each.plate} ${each.model}`}
          filters={{ ...filters, search }}
          onFiltersChange={() => {
            setFilters({})
            setSearch('')
          }}
          count={rows.length}
          onRowClick={(each) => {
            navigate(BP_ROUTES.vehicle(each.plate))
          }}
          rowLimitMessage="Mileage as the drivers last entered it; the dates and the words are the application's."
          mobile={{
            title: (each) => <bdi>{each.plate}</bdi>,
            subtitle: (each) => (
              <span className="bidi-content">{`${each.model} · ${each.driver}`}</span>
            ),
            badge: (each) => vehicleBadge(each.state),
            details: ['mileage', 'registration', 'service'],
          }}
        />
      </ListPage>
    </FleetShell>
  )
}

// ── One vehicle ───────────────────────────────────────────────────────────────────────────────

const PAPER_COLUMNS: DataTableColumn<Paper>[] = [
  {
    id: 'kind',
    header: 'Document',
    minWidth: 220,
    cell: (paper) => <TwoLines first={paper.kind} second={paper.detail} />,
  },
  {
    id: 'until',
    header: 'Valid until',
    numeric: true,
    cell: (paper) => <DateText value={paper.until} />,
  },
  {
    id: 'state',
    header: 'State',
    minWidth: 160,
    cell: (paper) => (
      <span className={`bidi-content text-sm ${TONE_TEXT[paper.tone]}`}>{paper.words}</span>
    ),
  },
]

function reminderDue(each: Reminder) {
  return 'date' in each.due ? <DateText value={each.due.date} /> : <bdi>{each.due.text}</bdi>
}

function reminderState(each: Reminder) {
  return (
    <span className="flex flex-col items-start gap-1">
      {reminderBadge(each.state)}
      <span className="bidi-content text-xs text-secondary">{each.words}</span>
    </span>
  )
}

export function VehiclePage({
  phone,
  plate = FEATURED_VEHICLE,
  askFuel = false,
}: {
  phone: boolean
  plate?: string
  askFuel?: boolean
}) {
  const { format } = useLiro()
  const amounts = useAmounts()
  const [vehicles, setVehicles] = useVehicles()
  const [reminders] = useReminders()
  const [fuel, setFuel] = useExampleState<readonly FuelEntry[]>('BP.fuel', () => FUEL)
  const [adding, setAdding] = useState(askFuel)
  const each = vehicles.find((vehicle) => vehicle.plate === plate)
  if (each === undefined) return null
  const featured = plate === FEATURED_VEHICLE
  const own = reminders.filter((reminder) => reminder.plate === plate)

  const reminderColumns: DataTableColumn<Reminder>[] = [
    {
      id: 'reminder',
      header: 'Reminder',
      minWidth: 200,
      cell: (reminder) => <TwoLines first={reminder.kind} second={reminder.title} />,
    },
    { id: 'due', header: 'Due', numeric: true, cell: reminderDue },
    { id: 'state', header: 'State', minWidth: 160, cell: reminderState },
  ]

  const serviceColumns: DataTableColumn<ServiceEntry>[] = [
    { id: 'date', header: 'Date', numeric: true, cell: (row) => <DateText value={row.date} /> },
    { id: 'mileage', header: 'Mileage', numeric: true, cell: (row) => amounts.km(row.mileage) },
    {
      id: 'work',
      header: 'Work',
      minWidth: 240,
      cell: (row) => <TwoLines first={row.work} second={row.workshop} />,
    },
    { id: 'cost', header: 'Cost', numeric: true, cell: (row) => money(row.cost) },
    { id: 'document', header: 'Invoice', cell: (row) => <bdi>{row.document}</bdi> },
  ]

  const fuelColumns: DataTableColumn<FuelEntry>[] = [
    { id: 'date', header: 'Date', numeric: true, cell: (row) => <DateText value={row.date} /> },
    {
      id: 'station',
      header: 'Station',
      minWidth: 180,
      cell: (row) => (
        <TwoLines
          first={row.station}
          second={
            row.paidHref === undefined ? (
              row.paid
            ) : (
              <RecordLink href={row.paidHref}>{row.paid}</RecordLink>
            )
          }
        />
      ),
    },
    { id: 'litres', header: 'Litres', numeric: true, cell: (row) => amounts.litres(row.litres) },
    { id: 'amount', header: 'Amount', numeric: true, cell: (row) => money(row.amount) },
    { id: 'mileage', header: 'Mileage', numeric: true, cell: (row) => amounts.km(row.mileage) },
    {
      id: 'consumption',
      header: 'l/100 km',
      numeric: true,
      cell: (row) =>
        row.consumption === null ? (
          <span className="text-secondary">—</span>
        ) : (
          <bdi className="tabular-nums">{format.number(row.consumption)}</bdi>
        ),
    },
  ]

  const vehicleSection: DetailSection = {
    id: 'vehicle',
    label: 'Vehicle',
    content: (
      <KeyValueList
        columns={phone ? 1 : 2}
        items={[
          { key: 'plate', label: 'Registration plate', value: <bdi>{each.plate}</bdi> },
          { key: 'model', label: 'Model', value: `${each.model} (${each.year})` },
          { key: 'kind', label: 'Kind', value: each.kind },
          { key: 'fuel', label: 'Fuel', value: each.fuel },
          { key: 'vin', label: 'VIN', value: <bdi>{each.vin}</bdi> },
          {
            key: 'mileage',
            label: 'Mileage',
            value: (
              <bdi>{`${format.number(each.mileage)} km · ${format.date(each.mileageAt)}`}</bdi>
            ),
            numeric: true,
          },
          { key: 'driver', label: 'Driver', value: `${each.driver}, ${each.driverRole}` },
          { key: 'centre', label: 'Cost centre', value: each.costCentre },
          {
            key: 'ownership',
            label: 'Held as',
            fullWidth: true,
            value:
              each.ownershipHref === undefined ? (
                each.ownership
              ) : (
                <RecordLink href={each.ownershipHref}>{each.ownership}</RecordLink>
              ),
          },
          ...(each.note === undefined
            ? []
            : [{ key: 'note', label: 'Note', value: each.note, fullWidth: true }]),
        ]}
      />
    ),
  }

  const remindersSection: DetailSection = {
    id: 'reminders',
    label: 'Reminders',
    flush: true,
    actions: <RecordLink href={BP_ROUTES.reminders}>All reminders</RecordLink>,
    content: (
      <DataTable
        label={`Reminders of ${each.plate}`}
        layout={phone ? 'cards' : 'table'}
        inCard
        columns={reminderColumns}
        rows={own}
        getRowId={(reminder) => reminder.id}
        getRowLabel={(reminder) => `${reminder.kind} ${reminder.title}`}
        mobile={{
          title: (reminder) => reminder.kind,
          subtitle: (reminder) => <span className="bidi-content">{reminder.title}</span>,
          badge: (reminder) => reminderBadge(reminder.state),
          details: ['due', 'state'],
        }}
      />
    ),
  }

  const sections: DetailSection[] = featured
    ? [
        vehicleSection,
        {
          id: 'papers',
          label: 'Registration and insurance',
          flush: true,
          content: (
            <DataTable
              label={`Registration and insurance of ${each.plate}`}
              layout={phone ? 'cards' : 'table'}
              inCard
              columns={PAPER_COLUMNS}
              rows={PAPERS}
              getRowId={(paper) => paper.id}
              getRowLabel={(paper) => paper.kind}
              mobile={{
                title: (paper) => paper.kind,
                subtitle: (paper) => <span className="bidi-content">{paper.detail}</span>,
                details: ['until', 'state'],
              }}
            />
          ),
        },
        remindersSection,
        {
          id: 'services',
          label: 'Services',
          flush: true,
          content: (
            <DataTable
              label={`Services of ${each.plate}`}
              layout={phone ? 'cards' : 'table'}
              inCard
              columns={serviceColumns}
              rows={SERVICES}
              getRowId={(row) => row.id}
              getRowLabel={(row) => row.work}
              totalsLabel="Total"
              totals={{ cost: money(SERVICES_TOTAL) }}
              mobile={{
                title: (row) => row.work,
                subtitle: (row) => <span className="bidi-content">{row.workshop}</span>,
                details: ['date', 'mileage', 'cost', 'document'],
              }}
            />
          ),
        },
        {
          id: 'fuel',
          label: 'Fuel',
          description:
            'The consumption is the application’s: the litres of a fill over the kilometres since the fill before.',
          flush: true,
          content: (
            <DataTable
              label={`Fuel entries of ${each.plate}`}
              layout={phone ? 'cards' : 'table'}
              inCard
              columns={fuelColumns}
              rows={fuel}
              getRowId={(row) => row.id}
              getRowLabel={(row) => `${row.station} ${row.date}`}
              totalsLabel="October"
              totals={{
                litres: amounts.litres(FUEL_TOTALS.litres),
                amount: money(FUEL_TOTALS.amount),
              }}
              mobile={{
                title: (row) => row.station,
                subtitle: (row) => <bdi>{row.paid}</bdi>,
                details: ['date', 'litres', 'amount', 'mileage', 'consumption'],
              }}
            />
          ),
        },
      ]
    : [
        vehicleSection,
        {
          id: 'due',
          label: 'Registration and service',
          content: (
            <KeyValueList
              columns={phone ? 1 : 2}
              items={[
                {
                  key: 'registration',
                  label: 'Registration',
                  value: <DueCell due={each.registration} />,
                },
                { key: 'service', label: 'Next service', value: <DueCell due={each.service} /> },
              ]}
            />
          ),
        },
        ...(own.length === 0 ? [] : [remindersSection]),
      ]

  const service = each.service
  return (
    <FleetShell
      phone={phone}
      tab="vehicles"
      crumbs={[
        { label: 'Fleet' },
        { label: 'Vehicles', href: `#${BP_ROUTES.vehicles}` },
        { label: each.plate },
      ]}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={each.plate}
        back={{ href: `#${BP_ROUTES.vehicles}`, label: 'Vehicles' }}
        status={vehicleBadge(each.state)}
        subtitle={<span className="bidi-content">{`${each.model} · ${each.driver}`}</span>}
        {...(featured
          ? {
              actions: (
                <Button
                  family="primary"
                  icon={Fuel}
                  emphasis="primary"
                  label="Add fuel entry"
                  onClick={() => {
                    setAdding(true)
                  }}
                />
              ),
              keyFigures: [
                { key: 'mileage', label: 'Mileage', value: amounts.km(each.mileage) },
                {
                  key: 'consumption',
                  label: `Consumption, ${VAN_FIGURES.consumptionWords}`,
                  value: <bdi>{format.number(VAN_FIGURES.consumption)}</bdi>,
                },
                { key: 'fuel', label: 'Fuel in 2026', value: money(VAN_FIGURES.fuelYear) },
                ...(service === null
                  ? []
                  : [
                      {
                        key: 'service',
                        label: 'Next service',
                        value: <span className="bidi-content">{service.words}</span>,
                        ...(service.tone === 'danger' ? { tone: 'danger' as const } : {}),
                      },
                    ]),
              ],
            }
          : {})}
        sections={sections}
      />
      {featured ? (
        <FuelDialog
          open={adding}
          onOpenChange={setAdding}
          plate={each.plate}
          onAdd={(entry) => {
            setFuel((current) => [entry, ...current])
            setVehicles((current) =>
              current.map((vehicle) =>
                vehicle.plate === plate
                  ? { ...vehicle, mileage: entry.mileage, mileageAt: entry.date }
                  : vehicle,
              ),
            )
            setAdding(false)
            notice.success(`Fuel entry of ${format.date(entry.date)} added to ${plate}.`)
          }}
        />
      ) : null}
    </FleetShell>
  )
}

/** "Add fuel entry": the receipt's figures; the application writes the consumption. */
function FuelDialog({
  open,
  onOpenChange,
  plate,
  onAdd,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  plate: string
  onAdd: (entry: FuelEntry) => void
}) {
  const [date, setDate] = useState<string | null>(NEW_FUEL.date)
  const [litres, setLitres] = useState<string | null>(NEW_FUEL.litres)
  const [amount, setAmount] = useState<string | null>(NEW_FUEL.amount)
  const [mileage, setMileage] = useState<string | null>(NEW_FUEL.mileage)
  const [paid, setPaid] = useState<string>(NEW_FUEL.paid)
  const missing = date === null || litres === null || amount === null || mileage === null
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title="Add fuel entry"
      subject={plate}
      description="From the receipt. The application writes the consumption since the fill before."
      actions={
        <>
          <Button
            intent="cancel"
            label="Cancel"
            onClick={() => {
              onOpenChange(false)
            }}
          />
          <Button
            family="primary"
            icon={Fuel}
            emphasis="primary"
            label="Add fuel entry"
            disabled={missing}
            onClick={() => {
              if (missing) return
              onAdd({
                id: `f-new-${date}`,
                date,
                station: NEW_FUEL.station,
                litres,
                amount,
                mileage,
                // The application answers with the consumption once it has the entry.
                consumption:
                  litres === NEW_FUEL.litres && mileage === NEW_FUEL.mileage
                    ? NEW_FUEL.consumption
                    : null,
                paid: PAID_OPTIONS.find((each) => each.value === paid)?.label ?? '',
              })
            }}
          />
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <DateField label="Date" required value={date} onChange={setDate} />
        <NumberField label="Litres" required value={litres} onChange={setLitres} />
        <MoneyField label="Amount" required currency="RSD" value={amount} onChange={setAmount} />
        <NumberField
          label="Mileage (km)"
          required
          description="The odometer at the pump."
          value={mileage}
          onChange={setMileage}
        />
        <SelectField label="Paid with" options={PAID_OPTIONS} value={paid} onChange={setPaid} />
      </div>
    </Dialog>
  )
}

// ── Reminders ─────────────────────────────────────────────────────────────────────────────────

const REMINDER_FILTERS: FilterDefinition[] = [
  { id: 'kind', label: 'Kind', type: 'select', options: REMINDER_KINDS },
]

function matchesReminder(
  each: Reminder,
  vehicle: Vehicle | undefined,
  search: string,
  filters: DataTableFilters,
): boolean {
  const query = search.trim().toLocaleLowerCase('sr-Latn')
  if (
    query !== '' &&
    ![each.plate, each.title, vehicle?.model ?? ''].some((text) =>
      text.toLocaleLowerCase('sr-Latn').includes(query),
    )
  ) {
    return false
  }
  const kind = filters.kind
  return typeof kind !== 'string' || kind === '' || kind === each.kind
}

export function VehicleReminders({ phone, ask }: { phone: boolean; ask?: string }) {
  const navigate = useContext(Navigate)
  const { format } = useLiro()
  const [reminders, setReminders] = useReminders()
  const [vehicles] = useVehicles()
  const [view, setView] = useState<RemindersView>('due')
  const [filters, setFilters] = useState<DataTableFilters>({})
  const [search, setSearch] = useState('')
  const [marking, setMarking] = useState<Reminder | null>(
    () => REMINDERS.find((each) => each.id === ask) ?? null,
  )
  const [doneOn, setDoneOn] = useState<string | null>(BP_TODAY)
  const [note, setNote] = useState('')
  const vehicleOf = (plate: string) => vehicles.find((each) => each.plate === plate)
  const rows = reminders.filter(
    (each) =>
      inRemindersView(each, view) && matchesReminder(each, vehicleOf(each.plate), search, filters),
  )
  const columns: DataTableColumn<Reminder>[] = [
    {
      id: 'reminder',
      header: 'Reminder',
      minWidth: 220,
      cell: (each) => <TwoLines first={each.kind} second={each.title} />,
    },
    {
      id: 'vehicle',
      header: 'Vehicle',
      minWidth: 180,
      cell: (each) => (
        <TwoLines first={<bdi>{each.plate}</bdi>} second={vehicleOf(each.plate)?.model ?? ''} />
      ),
    },
    { id: 'due', header: 'Due', numeric: true, cell: reminderDue },
    { id: 'state', header: 'State', minWidth: 160, cell: reminderState },
  ]
  const close = () => {
    setMarking(null)
    setNote('')
    setDoneOn(BP_TODAY)
  }
  return (
    <FleetShell phone={phone} tab="reminders" crumbs={[{ label: 'Fleet' }, { label: 'Reminders' }]}>
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Reminders"
        views={REMINDER_VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: reminders.filter((reminder) => inRemindersView(reminder, each.id)).length,
        }))}
        view={view}
        onViewChange={(id) => {
          setView(id as RemindersView)
        }}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={REMINDER_FILTERS}
            inline={1}
            values={filters}
            onValuesChange={setFilters}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Plate, model or reminder"
          />
        }
      >
        <DataTable
          label="Reminders"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={columns}
          rows={rows}
          getRowId={(each) => each.id}
          getRowLabel={(each) => `${each.kind} ${each.plate}`}
          filters={{ ...filters, search }}
          onFiltersChange={() => {
            setFilters({})
            setSearch('')
          }}
          count={rows.length}
          onRowClick={(each) => {
            navigate(BP_ROUTES.vehicle(each.plate))
          }}
          rowActions={(each) => [
            {
              label: 'Open vehicle',
              onSelect: () => {
                navigate(BP_ROUTES.vehicle(each.plate))
              },
            },
            ...(each.state === 'Done'
              ? []
              : [
                  {
                    label: 'Mark as done…',
                    icon: CheckCheck,
                    onSelect: () => {
                      setMarking(each)
                    },
                  },
                ]),
          ]}
          mobile={{
            title: (each) => each.kind,
            subtitle: (each) => (
              <span className="bidi-content">{`${each.plate} · ${each.title}`}</span>
            ),
            badge: (each) => reminderBadge(each.state),
            details: ['due', 'state'],
          }}
        />
      </ListPage>
      <Dialog
        open={marking !== null}
        onOpenChange={(open) => {
          if (!open) close()
        }}
        title="Mark as done"
        {...(marking === null ? {} : { subject: `${marking.title} · ${marking.plate}` })}
        description="The application plans the next one from the vehicle's rules."
        actions={
          <>
            <Button intent="cancel" label="Cancel" onClick={close} />
            <Button
              family="positive"
              icon={CheckCheck}
              emphasis="primary"
              label="Mark as done"
              disabled={doneOn === null}
              onClick={() => {
                if (marking === null || doneOn === null) return
                const words = [`Done on ${format.date(doneOn)}`, note.trim()]
                  .filter((part) => part !== '')
                  .join(' · ')
                setReminders((current) =>
                  current.map((each) =>
                    each.id === marking.id ? { ...each, state: 'Done', words } : each,
                  ),
                )
                notice.success(`${marking.title}, ${marking.plate}: done.`)
                close()
              }}
            />
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <DateField label="Done on" required value={doneOn} onChange={setDoneOn} />
          <TextAreaField
            label="Note"
            rows={2}
            placeholder="Registered until 19.10.2027."
            value={note}
            onChange={setNote}
          />
        </div>
      </Dialog>
    </FleetShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BP_ROUTES: ExampleRoute[] = [
  { path: BP_ROUTES.vehicles, render: (phone) => <Vehicles phone={phone} /> },
  { path: BP_ROUTES.gone, render: (phone) => <Vehicles phone={phone} view="gone" /> },
  ...VEHICLES.map((each) => ({
    path: BP_ROUTES.vehicle(each.plate),
    render: (phone: boolean) => <VehiclePage phone={phone} plate={each.plate} />,
  })),
  { path: BP_ROUTES.addFuel, render: (phone) => <VehiclePage phone={phone} askFuel /> },
  { path: BP_ROUTES.reminders, render: (phone) => <VehicleReminders phone={phone} /> },
  {
    path: BP_ROUTES.remindersDone,
    render: (phone) => <VehicleReminders phone={phone} ask="r-reg-123" />,
  },
]
