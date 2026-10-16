import {
  ClipboardPlus,
  LogOut,
  PenLine,
  RefreshCw,
  Square,
  UserRound,
  UserRoundCog,
} from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  Alert,
  AppShell,
  AttachmentList,
  Button,
  CheckboxField,
  ComboboxField,
  ConnectionState,
  DataTable,
  DateField,
  DateText,
  DetailPage,
  Dialog,
  FileDropzone,
  FilterBar,
  KeyValueList,
  ListPage,
  NumberField,
  OfflineIndicator,
  QuantityStepper,
  SelectField,
  SignerList,
  StatusBadge,
  TextAreaField,
  toneFor,
  Toaster,
  UnavailableAction,
  notice,
  useLiro,
  type Attachment,
  type ConnectionStatus,
  type DataTableColumn,
  type DataTableFilters,
  type DetailSection,
  type FilterDefinition,
  type ModuleTab,
  type Signer,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { BRAND, COMPANIES, Navigate, ROUTES, Shell, type ExampleAccount } from './example-shell'
import { useExampleState } from './example-state'
import { Tenant } from './screens-G'
import {
  BO_ROUTES,
  BO_TODAY,
  CHECKLIST,
  CREATE_DEFAULTS,
  CREATE_TASK,
  DECLINE_REASONS,
  FAULT,
  FEATURED_ORDER,
  inOrdersView,
  inPlanView,
  machineOf,
  NEW_PHOTO,
  NEXT_ORDER,
  OFFLINE_WAITING,
  ORDER_TONES,
  ORDER_VIEWS,
  ORDERS,
  orderFromTask,
  PARTS,
  PARTS_ISSUE,
  PHOTOS,
  PLAN,
  PLAN_TONES,
  PLAN_VIEWS,
  PRIORITY_TONES,
  SAVED_AT,
  SIGNED_AT,
  SPARE_PARTS,
  TECHNICIANS,
  technicianName,
  TIME,
  TIME_TOTAL,
  WORK_DONE,
  WORK_STOPPED,
  type CheckItem,
  type OrdersView,
  type OrderState,
  type PartLine,
  type PlanState,
  type PlanTask,
  type PlanView,
  type TimeEntry,
  type WorkOrder,
} from './data-BO'

/*
 * Group BO's example screens (P5.74, field service and maintenance): Kvadrat Gradnja d.o.o.'s
 * machines on 14 October 2026 at 09:40.
 * - The work orders (ListPage, Marko Đorđević dispatching the machinery pool): every order with
 *   its machine, the fault or the task, the technician, the day and the state in words; views
 *   Open / Unassigned / Done / All, a technician filter, and "Assign…" in the row's menu (a
 *   dialog: the technician and the day).
 * - The work order on the technician's phone (DetailPage, Saša Vukadinović of the service
 *   partner): the fault and the service due, the machine and its operating hours, the checklist
 *   ("5 of 9 done"), photos ("Take a photo", FileDropzone `camera`, and AttachmentList), the parts
 *   issued from the Central warehouse with what was used (QuantityStepper) and "Add a part", the
 *   time (the running work entry and "Stop work"), what was done, and the signatures (SignerList).
 *   Offline-first as the handheld of group I: OfflineIndicator with what waits on the phone and
 *   ConnectionState in the bottom bar (saved on this phone, sent, not sent with "Send again").
 *   "Finish and sign" says why it cannot be used until the checklist is done; then the phone is
 *   handed to the site manager, who signs or declines with a reason (SignerList, she is the one
 *   at the device); then the order is done and sent. On a desktop the same order is the office's
 *   view: read-only, with the parts and the time as tables.
 * - The preventive maintenance plan (ListPage): by machine and task, the interval, when it was
 *   last done, when it is due next (a date or a reading), the state in words (overdue, due soon,
 *   planned) and its work order — or "Create work order" (a dialog: the technician and the day;
 *   the application numbers it and it appears in the work orders).
 * The screens play the application: the orders, the plan and the technician's work live above the
 * screens (`useExampleState`); every figure and every word of a state comes from data-BO.ts.
 */

export { BO_ROUTES }

const KVADRAT = COMPANIES.filter((company) => company.id === 'kvadrat')

const DISPATCHER: ExampleAccount = {
  name: 'Marko Đorđević',
  email: 'marko.djordjevic@kvadratgradnja.example.com',
  companies: KVADRAT,
  links: [
    { label: 'Work orders', path: BO_ROUTES.orders },
    { label: 'Maintenance plan', path: BO_ROUTES.plan },
  ],
}

const TECHNICIAN = {
  name: 'Saša Vukadinović',
  email: 'sasa.vukadinovic@mehanizacijabacka.example.com',
  role: 'Service technician, Mehanizacija Bačka d.o.o.',
}

const SITE_MANAGER = { name: 'Snežana Popović', role: 'Site manager, Liman 4' }

// ── Shared pieces ─────────────────────────────────────────────────────────────────────────────

type MaintenanceTab = 'orders' | 'plan'

function maintenanceTabs(current: MaintenanceTab): ModuleTab[] {
  return [
    {
      key: 'orders',
      label: 'Work orders',
      href: `#${BO_ROUTES.orders}`,
      current: current === 'orders',
    },
    {
      key: 'plan',
      label: 'Maintenance plan',
      href: `#${BO_ROUTES.plan}`,
      current: current === 'plan',
    },
  ]
}

function MaintenanceShell({
  phone,
  tab,
  crumbs,
  children,
}: {
  phone: boolean
  tab: MaintenanceTab
  crumbs: { label: string; href?: string }[]
  children: ReactNode
}) {
  return (
    <Tenant today={BO_TODAY}>
      <Shell phone={phone} account={DISPATCHER} crumbs={crumbs} tabs={maintenanceTabs(tab)}>
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

/**
 * The technician's frame: AppShell with his account and the shell's offline strip (the examples'
 * Shell has no offline slot, so this one is built here as an application builds its own).
 */
function TechnicianShell({
  phone,
  offline,
  onTryNow,
  bottomBar,
  children,
}: {
  phone: boolean
  offline: boolean
  onTryNow: () => void
  bottomBar?: ReactNode
  children: ReactNode
}) {
  const navigate = useContext(Navigate)
  return (
    <Tenant today={BO_TODAY}>
      <AppShell
        layout={phone ? 'phone' : 'desktop'}
        brand={BRAND}
        breadcrumbs={[{ label: 'My work orders' }, { label: FEATURED_ORDER }]}
        commands={{ items: [] }}
        companies={{ items: KVADRAT, current: 'kvadrat', onSelect: () => undefined }}
        user={{
          name: TECHNICIAN.name,
          email: TECHNICIAN.email,
          entries: [
            { label: 'Profile', icon: UserRound, onSelect: () => undefined },
            { type: 'separator' },
            {
              label: 'Sign out',
              icon: LogOut,
              onSelect: () => {
                navigate(ROUTES.signIn)
              },
            },
          ],
        }}
        offlineIndicator={
          <OfflineIndicator
            offline={offline}
            layout={phone ? 'phone' : 'desktop'}
            waiting={OFFLINE_WAITING}
            action={<Button family="neutral" icon={RefreshCw} label="Try now" onClick={onTryNow} />}
          />
        }
        {...(bottomBar === undefined ? {} : { bottomBar })}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </AppShell>
    </Tenant>
  )
}

function orderBadge(state: OrderState) {
  return <StatusBadge label={state} tone={toneFor(state, ORDER_TONES)} />
}

function planBadge(state: PlanState) {
  return <StatusBadge label={state} tone={toneFor(state, PLAN_TONES)} />
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

/** A name and a second line under it (number, place). */
function TwoLines({ first, second }: { first: ReactNode; second: ReactNode }) {
  return (
    <span className="flex flex-col gap-0.5">
      <span className="bidi-content font-medium">{first}</span>
      <span className="bidi-content text-xs text-secondary">{second}</span>
    </span>
  )
}

/** The orders and the plan as the application keeps them, above the screens. */
function useOrders() {
  return useExampleState<readonly WorkOrder[]>('BO.orders', () => ORDERS)
}

function usePlan() {
  return useExampleState<readonly PlanTask[]>('BO.plan', () => PLAN)
}

// ── The work orders ───────────────────────────────────────────────────────────────────────────

const ORDER_FILTERS: FilterDefinition[] = [
  {
    id: 'technician',
    label: 'Technician',
    type: 'select',
    options: TECHNICIANS.map((each) => ({ value: each.value, label: each.label })),
  },
]

function matchesOrder(each: WorkOrder, search: string, filters: DataTableFilters): boolean {
  const query = search.trim().toLocaleLowerCase('sr-Latn')
  const machine = machineOf(each.machine)
  if (
    query !== '' &&
    ![each.number, each.title, machine.name, machine.number, machine.location].some((text) =>
      text.toLocaleLowerCase('sr-Latn').includes(query),
    )
  ) {
    return false
  }
  const technician = filters.technician
  return typeof technician !== 'string' || technician === '' || technician === each.technician
}

function technicianCell(each: WorkOrder): ReactNode {
  const name = technicianName(each.technician)
  return name === null ? (
    <span className="text-secondary">Unassigned</span>
  ) : (
    <span className="bidi-content">{name}</span>
  )
}

const ORDER_COLUMNS: DataTableColumn<WorkOrder>[] = [
  {
    id: 'order',
    header: 'Work order',
    cell: (each) => <TwoLines first={<bdi>{each.number}</bdi>} second={each.kind} />,
  },
  {
    id: 'machine',
    header: 'Machine',
    minWidth: 200,
    cell: (each) => {
      const machine = machineOf(each.machine)
      return <TwoLines first={machine.name} second={`${machine.number} · ${machine.location}`} />
    },
  },
  {
    id: 'title',
    header: 'Fault or task',
    minWidth: 220,
    cell: (each) => <span className="bidi-content">{each.title}</span>,
  },
  { id: 'technician', header: 'Technician', cell: technicianCell },
  {
    id: 'planned',
    header: 'Planned',
    numeric: true,
    cell: (each) => <DateText value={each.planned} />,
  },
  {
    id: 'priority',
    header: 'Priority',
    cell: (each) => <StatusBadge label={each.priority} tone={PRIORITY_TONES[each.priority]} />,
  },
  { id: 'state', header: 'State', cell: (each) => orderBadge(each.state) },
]

export function WorkOrders({ phone, view: startView }: { phone: boolean; view?: OrdersView }) {
  const navigate = useContext(Navigate)
  const [orders, setOrders] = useOrders()
  const [view, setView] = useState<OrdersView>(startView ?? 'open')
  const [filters, setFilters] = useState<DataTableFilters>({})
  const [search, setSearch] = useState('')
  const [assigning, setAssigning] = useState<WorkOrder | null>(null)
  const rows = orders.filter(
    (each) => inOrdersView(each, view) && matchesOrder(each, search, filters),
  )
  return (
    <MaintenanceShell
      phone={phone}
      tab="orders"
      crumbs={[{ label: 'Maintenance' }, { label: 'Work orders' }]}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Work orders"
        views={ORDER_VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: orders.filter((order) => inOrdersView(order, each.id)).length,
        }))}
        view={view}
        onViewChange={(id) => {
          setView(id as OrdersView)
        }}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={ORDER_FILTERS}
            inline={1}
            values={filters}
            onValuesChange={setFilters}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Number, machine, site or fault"
          />
        }
      >
        <DataTable
          label="Work orders"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={ORDER_COLUMNS}
          rows={rows}
          getRowId={(each) => each.number}
          getRowLabel={(each) => `${each.number} ${machineOf(each.machine).name}`}
          filters={{ ...filters, search }}
          onFiltersChange={() => {
            setFilters({})
            setSearch('')
          }}
          count={rows.length}
          onRowClick={(each) => {
            navigate(BO_ROUTES.order(each.number))
          }}
          rowActions={(each) =>
            each.state === 'Done'
              ? [
                  {
                    label: 'Open',
                    onSelect: () => {
                      navigate(BO_ROUTES.order(each.number))
                    },
                  },
                ]
              : [
                  {
                    label: 'Open',
                    onSelect: () => {
                      navigate(BO_ROUTES.order(each.number))
                    },
                  },
                  {
                    label: each.technician === null ? 'Assign…' : 'Reassign…',
                    icon: UserRoundCog,
                    onSelect: () => {
                      setAssigning(each)
                    },
                  },
                ]
          }
          mobile={{
            title: (each) => machineOf(each.machine).name,
            subtitle: (each) => (
              <span className="bidi-content">{`${each.number} · ${each.title}`}</span>
            ),
            badge: (each) => orderBadge(each.state),
            details: ['technician', 'planned', 'priority'],
          }}
        />
      </ListPage>
      <AssignDialog
        order={assigning}
        onClose={() => {
          setAssigning(null)
        }}
        onAssign={(number, technician, day) => {
          setOrders((current) =>
            current.map((each) =>
              each.number === number
                ? {
                    ...each,
                    technician,
                    planned: day,
                    state: each.state === 'New' ? 'Scheduled' : each.state,
                  }
                : each,
            ),
          )
          setAssigning(null)
          notice.success(`${number} assigned to ${technicianName(technician) ?? ''}.`)
        }}
      />
    </MaintenanceShell>
  )
}

function AssignDialog({
  order: current,
  onClose,
  onAssign,
}: {
  order: WorkOrder | null
  onClose: () => void
  onAssign: (number: string, technician: string, day: string) => void
}) {
  const [technician, setTechnician] = useState<string | null>(null)
  const [day, setDay] = useState<string | null>(null)
  const chosenTechnician = technician ?? current?.technician ?? null
  const chosenDay = day ?? current?.planned ?? BO_TODAY
  const machine = current === null ? null : machineOf(current.machine)
  return (
    <Dialog
      open={current !== null}
      onOpenChange={(open) => {
        if (!open) {
          setTechnician(null)
          setDay(null)
          onClose()
        }
      }}
      title={current?.technician === null ? 'Assign work order' : 'Reassign work order'}
      {...(current === null || machine === null
        ? {}
        : { subject: `${current.number} · ${machine.name}` })}
      description="The technician sees it on the phone at once, with the machine and the checklist."
      actions={
        <>
          <Button
            intent="cancel"
            label="Cancel"
            onClick={() => {
              setTechnician(null)
              setDay(null)
              onClose()
            }}
          />
          <Button
            family="primary"
            icon={UserRoundCog}
            emphasis="primary"
            label="Assign"
            onClick={() => {
              if (current === null || chosenTechnician === null) return
              onAssign(current.number, chosenTechnician, chosenDay)
              setTechnician(null)
              setDay(null)
            }}
          />
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <SelectField
          label="Technician"
          required
          options={TECHNICIANS.map((each) => ({ ...each }))}
          value={chosenTechnician ?? ''}
          onChange={setTechnician}
        />
        <DateField label="Planned for" required value={chosenDay} onChange={setDay} />
      </div>
    </Dialog>
  )
}

// ── One work order ────────────────────────────────────────────────────────────────────────────

type Stage = 'work' | 'sign' | 'done'

interface Work {
  checklist: readonly CheckItem[]
  parts: readonly PartLine[]
  photos: readonly Attachment[]
  time: readonly TimeEntry[]
  hours: string | null
  text: string
  stage: Stage
  /** The site manager's reason when she declined. */
  declined: string | null
}

function initialWork(stage: Stage): Work {
  const finished = stage !== 'work'
  return {
    checklist: finished ? CHECKLIST.map((item) => ({ ...item, done: true })) : CHECKLIST,
    parts: PARTS,
    photos: finished ? [...PHOTOS, NEW_PHOTO] : PHOTOS,
    time: finished ? TIME.map((entry) => (entry.to === null ? WORK_STOPPED : entry)) : TIME,
    hours: '1262',
    text: WORK_DONE,
    stage,
    declined: null,
  }
}

function signersOf(stage: Stage, technicianHere: boolean): Signer[] {
  return [
    {
      id: 'technician',
      name: TECHNICIAN.name,
      role: TECHNICIAN.role,
      state: stage === 'work' ? 'waiting' : 'signed',
      ...(stage === 'work' ? {} : { at: SIGNED_AT }),
      ...(technicianHere && stage !== 'sign' ? { current: true } : {}),
    },
    {
      id: 'site',
      name: SITE_MANAGER.name,
      role: SITE_MANAGER.role,
      state: stage === 'done' ? 'signed' : 'waiting',
      ...(stage === 'done' ? { at: SIGNED_AT } : {}),
      // The phone is in her hands while she signs (the application knows who is at the device).
      ...(technicianHere && stage === 'sign' ? { current: true } : {}),
    },
  ]
}

function TimeTable({
  entries,
  phone,
  running,
}: {
  entries: readonly TimeEntry[]
  phone: boolean
  running: boolean
}) {
  const { format } = useLiro()
  const columns: DataTableColumn<TimeEntry>[] = [
    { id: 'kind', header: 'Kind', cell: (entry) => entry.kind },
    {
      id: 'from',
      header: 'From',
      numeric: true,
      cell: (entry) => <bdi>{format.time(entry.from)}</bdi>,
    },
    {
      id: 'to',
      header: 'To',
      numeric: true,
      cell: (entry) =>
        entry.to === null ? (
          <span className="text-secondary">Running</span>
        ) : (
          <bdi>{format.time(entry.to)}</bdi>
        ),
    },
    {
      id: 'duration',
      header: 'Time',
      numeric: true,
      cell: (entry) => <bdi>{entry.duration}</bdi>,
    },
  ]
  return (
    <DataTable
      label={`Time on ${FEATURED_ORDER}`}
      layout={phone ? 'cards' : 'table'}
      inCard
      columns={columns}
      rows={entries}
      getRowId={(entry) => entry.id}
      getRowLabel={(entry) => entry.kind}
      totalsLabel="Total"
      totals={{ duration: <bdi>{running ? TIME_TOTAL.running : TIME_TOTAL.stopped}</bdi> }}
      mobile={{ title: (entry) => entry.kind, details: ['from', 'to', 'duration'] }}
    />
  )
}

function PartsTable({ parts, phone }: { parts: readonly PartLine[]; phone: boolean }) {
  const { format } = useLiro()
  const amount = (value: string, unit: string) => <bdi>{`${format.number(value)} ${unit}`}</bdi>
  const columns: DataTableColumn<PartLine>[] = [
    {
      id: 'part',
      header: 'Part',
      minWidth: 220,
      cell: (part) => <TwoLines first={part.name} second={<bdi>{part.code}</bdi>} />,
    },
    { id: 'taken', header: 'Taken', numeric: true, cell: (part) => amount(part.taken, part.unit) },
    { id: 'used', header: 'Used', numeric: true, cell: (part) => amount(part.used, part.unit) },
  ]
  return (
    <DataTable
      label={`Parts used on ${FEATURED_ORDER}`}
      layout={phone ? 'cards' : 'table'}
      inCard
      columns={columns}
      rows={parts}
      getRowId={(part) => part.id}
      getRowLabel={(part) => part.name}
      mobile={{
        title: (part) => part.name,
        subtitle: (part) => <bdi>{part.code}</bdi>,
        details: ['taken', 'used'],
      }}
    />
  )
}

/** The parts on the technician's phone: what was used of each, stepped; "Add a part". */
function PartsEditor({
  parts,
  onChange,
}: {
  parts: readonly PartLine[]
  onChange: (parts: readonly PartLine[]) => void
}) {
  const { format } = useLiro()
  const [adding, setAdding] = useState<string | null>(null)
  const choices = SPARE_PARTS.filter((spare) => !parts.some((part) => part.code === spare.value))
  return (
    <div className="flex flex-col gap-4">
      <ul className="m-0 flex list-none flex-col gap-4 p-0">
        {parts.map((part) => (
          <li key={part.id}>
            <QuantityStepper
              label={part.name}
              description={`${part.code} · taken ${format.number(part.taken)} ${part.unit}`}
              min="0"
              max={part.taken}
              step={part.step}
              unit={part.unit}
              value={part.used}
              onChange={(used) => {
                onChange(
                  parts.map((each) =>
                    each.id === part.id ? { ...each, used: used ?? '0' } : each,
                  ),
                )
              }}
            />
          </li>
        ))}
      </ul>
      {choices.length > 0 ? (
        <ComboboxField
          label="Add a part"
          description="Issued to this work order from the Central warehouse."
          options={choices.map((spare) => ({
            value: spare.value,
            label: spare.label,
            description: spare.description,
          }))}
          value={null}
          {...(adding === null ? {} : { defaultQuery: adding })}
          onChange={(option) => {
            const spare = SPARE_PARTS.find((each) => each.value === option?.value)
            if (spare === undefined) return
            setAdding(null)
            onChange([
              ...parts,
              {
                id: spare.value,
                code: spare.value,
                name: spare.label,
                unit: spare.unit,
                taken: '1',
                used: '1',
                step: '1',
              },
            ])
            notice.success(`${spare.label} issued to ${FEATURED_ORDER}.`)
          }}
        />
      ) : null}
    </div>
  )
}

/** The fault and the machine: what every view of the order starts with. */
function orderSections(
  each: WorkOrder,
  phone: boolean,
  format: ReturnType<typeof useLiro>['format'],
  hoursField?: ReactNode,
): DetailSection[] {
  const machine = machineOf(each.machine)
  return [
    {
      id: 'fault',
      label: each.kind === 'Preventive' ? 'Task' : 'Fault',
      content: (
        <KeyValueList
          columns={phone ? 1 : 2}
          items={[
            ...(each.reported === undefined
              ? []
              : [
                  { key: 'by', label: 'Reported by', value: each.reported.by },
                  {
                    key: 'at',
                    label: 'Reported',
                    value: <bdi>{format.dateTime(each.reported.at)}</bdi>,
                    numeric: true,
                  },
                ]),
            {
              key: 'title',
              label: each.kind === 'Preventive' ? 'Task' : 'Fault',
              value: each.number === FEATURED_ORDER ? FAULT.text : each.title,
              fullWidth: true,
            },
            ...(each.number === FEATURED_ORDER
              ? [{ key: 'service', label: 'Service due', value: FAULT.service, fullWidth: true }]
              : []),
            {
              key: 'priority',
              label: 'Priority',
              value: <StatusBadge label={each.priority} tone={PRIORITY_TONES[each.priority]} />,
            },
            {
              key: 'technician',
              label: 'Technician',
              value: technicianName(each.technician) ?? 'Unassigned',
            },
            {
              key: 'planned',
              label: 'Planned for',
              value: <DateText value={each.planned} />,
              numeric: true,
            },
            ...(each.note === undefined
              ? []
              : [{ key: 'note', label: 'Note', value: each.note, fullWidth: true }]),
          ]}
        />
      ),
    },
    {
      id: 'machine',
      label: 'Machine',
      content: (
        <div className="flex flex-col gap-4">
          <KeyValueList
            columns={phone ? 1 : 2}
            items={[
              {
                key: 'machine',
                label: 'Machine',
                value: (
                  <RecordLink
                    href={machine.href}
                  >{`${machine.name} (${machine.number})`}</RecordLink>
                ),
              },
              ...(machine.serial === undefined
                ? []
                : [{ key: 'serial', label: 'Serial number', value: <bdi>{machine.serial}</bdi> }]),
              { key: 'location', label: 'Location', value: machine.location },
              { key: 'responsible', label: 'Responsible', value: machine.responsible },
              ...(machine.hours === null || hoursField !== undefined
                ? []
                : [
                    {
                      key: 'hours',
                      label: 'Operating hours',
                      value: (
                        <bdi>{`${format.number(machine.hours.value)} h · ${format.date(machine.hours.at)}`}</bdi>
                      ),
                      numeric: true,
                    },
                  ]),
            ]}
          />
          {hoursField}
        </div>
      ),
    },
  ]
}

export function FieldWorkOrder({
  phone,
  number = FEATURED_ORDER,
  offline = false,
  sync = 'sent',
  stage: startStage = 'work',
}: {
  phone: boolean
  number?: string
  offline?: boolean
  sync?: ConnectionStatus
  stage?: Stage
}) {
  const liro = useLiro()
  const navigate = useContext(Navigate)
  const [orders, setOrders] = useOrders()
  const [work, setWork] = useExampleState<Work>('BO.work', () => initialWork(startStage))
  const [status, setStatus] = useState<ConnectionStatus>(offline ? 'local' : sync)
  const each = orders.find((order) => order.number === number)
  if (each === undefined) return null
  const featured = number === FEATURED_ORDER
  // The technician works on his phone; on a desktop the order is the office's, read-only.
  const technician = phone && featured
  const machine = machineOf(each.machine)
  const doneCount = work.checklist.filter((item) => item.done).length
  const left = work.checklist.length - doneCount
  const running = work.time.some((entry) => entry.to === null)
  const editing = technician && work.stage === 'work'
  const change = (next: Partial<Work>) => {
    setWork((current) => ({ ...current, ...next }))
    setStatus(offline ? 'local' : 'sent')
  }

  const finish = () => {
    change({
      stage: 'sign',
      declined: null,
      time: work.time.map((entry) => (entry.to === null ? WORK_STOPPED : entry)),
    })
    notice.success('Signed. Hand the phone to Snežana Popović.')
  }

  const finishButton =
    left === 0 ? (
      <Button
        family="primary"
        icon={PenLine}
        emphasis="primary"
        label="Finish and sign"
        onClick={finish}
      />
    ) : (
      <UnavailableAction
        family="primary"
        icon={PenLine}
        emphasis="primary"
        label="Finish and sign"
        reason={
          left === 1
            ? 'Tick the last check first.'
            : `Tick the ${String(left)} remaining checks first.`
        }
      />
    )

  const connection = (
    <ConnectionState
      status={status}
      at={SAVED_AT}
      {...(status === 'failed'
        ? {
            onRetry: () => {
              setStatus('sent')
              notice.success(`${FEATURED_ORDER} sent.`)
            },
          }
        : {})}
    />
  )

  const hoursField =
    technician && machine.hours !== null ? (
      <NumberField
        label="Operating hours now (h)"
        description="Read from the machine’s hour meter."
        value={work.hours}
        readOnly={!editing}
        onChange={(hours) => {
          change({ hours })
        }}
      />
    ) : undefined

  const checklist = (
    <ul className="m-0 flex list-none flex-col gap-3 p-0">
      {work.checklist.map((item) => (
        <li key={item.id}>
          <CheckboxField
            label={item.label}
            {...(item.hint === undefined ? {} : { description: item.hint })}
            checked={item.done}
            readOnly={!editing}
            onChange={(done) => {
              change({
                checklist: work.checklist.map((each) =>
                  each.id === item.id ? { ...each, done } : each,
                ),
              })
            }}
          />
        </li>
      ))}
    </ul>
  )

  const photos = (
    <div className="flex flex-col gap-4">
      {editing ? (
        <FileDropzone
          label="Add a photo"
          description="The fault, the old part and the work done; the application files them with the work order."
          accept={['image/jpeg', 'image/png']}
          acceptText="JPG or PNG"
          maxSize={15 * 1024 * 1024}
          maxSizeText="15 MB"
          camera
          layout="phone"
          onFiles={() => {
            if (work.photos.some((photo) => photo.id === NEW_PHOTO.id)) return
            change({ photos: [...work.photos, NEW_PHOTO] })
            notice.success(`${NEW_PHOTO.name} added.`)
          }}
        />
      ) : null}
      <AttachmentList
        label={`Photos of ${FEATURED_ORDER}`}
        files={work.photos}
        onDownload={(file) => {
          notice.info(`${file.name} is downloading.`)
        }}
      />
    </div>
  )

  const signers = signersOf(work.stage, technician)
  const signatures = (
    <SignerList
      signers={signers}
      {...(technician && work.stage === 'sign'
        ? {
            signLabel: 'Sign the work order',
            onSign: () => {
              change({ stage: 'done' })
              setOrders((current) =>
                current.map((order) =>
                  order.number === FEATURED_ORDER
                    ? {
                        ...order,
                        state: 'Done',
                        done: { at: SIGNED_AT, signedBy: SITE_MANAGER.name },
                      }
                    : order,
                ),
              )
              notice.success(
                offline
                  ? `${FEATURED_ORDER} is done. It is sent when the phone is back online.`
                  : `${FEATURED_ORDER} is done and sent.`,
              )
            },
            onDecline: (_signer, answer) => {
              const reason = DECLINE_REASONS.find((each) => each.value === answer.reason)?.label
              const words = [reason, answer.text.trim()].filter(
                (part) => part !== undefined && part !== '',
              )
              change({ stage: 'work', declined: words.join(' — ') })
            },
            declineReasons: DECLINE_REASONS,
            declineSubject: `${FEATURED_ORDER} · ${machine.name}`,
            declineMessage: 'The work order goes back to the technician with your reason.',
          }
        : {})}
    />
  )

  const workSections: DetailSection[] = featured
    ? [
        {
          id: 'checklist',
          label: 'Checklist',
          description: `${String(doneCount)} of ${String(work.checklist.length)} done`,
          content: checklist,
        },
        { id: 'photos', label: 'Photos', content: photos },
        {
          id: 'parts',
          label: 'Parts used',
          description: `Issued from the ${PARTS_ISSUE.warehouse} on ${liro.format.dateTime(PARTS_ISSUE.at)} (${PARTS_ISSUE.document}). What is not used goes back.`,
          ...(editing ? {} : { flush: true }),
          content: editing ? (
            <PartsEditor
              parts={work.parts}
              onChange={(parts) => {
                change({ parts })
              }}
            />
          ) : (
            <PartsTable parts={work.parts} phone={phone} />
          ),
        },
        {
          id: 'time',
          label: 'Time',
          flush: true,
          ...(editing && running
            ? {
                actions: (
                  <Button
                    family="neutral"
                    icon={Square}
                    emphasis="secondary"
                    label="Stop work"
                    onClick={() => {
                      change({
                        time: work.time.map((entry) => (entry.to === null ? WORK_STOPPED : entry)),
                      })
                    }}
                  />
                ),
              }
            : {}),
          content: <TimeTable entries={work.time} phone={phone} running={running} />,
        },
        {
          id: 'work',
          label: 'Work done',
          content: editing ? (
            <TextAreaField
              label="What was done"
              rows={3}
              value={work.text}
              onChange={(text) => {
                change({ text })
              }}
            />
          ) : (
            <p className="bidi-content m-0 text-sm text-primary">{work.text}</p>
          ),
        },
        { id: 'signatures', label: 'Signatures', content: signatures },
      ]
    : []

  const base = orderSections(each, phone, liro.format, hoursField)
  // The site manager reads what was done and signs: her part comes first.
  const sections =
    technician && work.stage === 'sign'
      ? [
          ...workSections.filter((section) => section.id === 'signatures' || section.id === 'work'),
          ...base,
          ...workSections.filter((section) => section.id !== 'signatures' && section.id !== 'work'),
        ]
      : [...base, ...workSections]

  const state: OrderState = featured && work.stage === 'done' ? 'Done' : each.state
  const page = (
    <DetailPage
      layout={phone ? 'phone' : 'desktop'}
      title={each.number}
      back={{ href: `#${BO_ROUTES.orders}`, label: 'Work orders' }}
      status={orderBadge(state)}
      subtitle={<span className="bidi-content">{`${machine.name} · ${machine.location}`}</span>}
      {...(featured
        ? {
            keyFigures: [
              {
                key: 'checklist',
                label: 'Checklist',
                value: <bdi>{`${String(doneCount)} of ${String(work.checklist.length)}`}</bdi>,
              },
              {
                key: 'time',
                label: 'Time',
                value: <bdi>{running ? TIME_TOTAL.running : TIME_TOTAL.stopped}</bdi>,
              },
              { key: 'photos', label: 'Photos', value: <bdi>{String(work.photos.length)}</bdi> },
            ],
          }
        : {})}
      sections={[
        ...(technician && work.stage === 'sign'
          ? [
              {
                id: 'handover',
                label: 'Check and sign',
                content: (
                  <Alert title={`${SITE_MANAGER.name}, please check the work and sign.`}>
                    Saša Vukadinović has signed. Your signature closes the work order; decline it
                    with a reason if something is not right.
                  </Alert>
                ),
              },
            ]
          : []),
        ...(technician && work.declined !== null && work.stage === 'work'
          ? [
              {
                id: 'declined',
                label: 'Declined',
                content: (
                  <Alert tone="warning" title={`${SITE_MANAGER.name} declined to sign`}>
                    {work.declined}
                  </Alert>
                ),
              },
            ]
          : []),
        ...sections,
      ]}
    />
  )

  if (!technician) {
    return (
      <MaintenanceShell
        phone={phone}
        tab="orders"
        crumbs={[
          { label: 'Maintenance' },
          { label: 'Work orders', href: `#${BO_ROUTES.orders}` },
          { label: each.number },
        ]}
      >
        {page}
      </MaintenanceShell>
    )
  }
  return (
    <TechnicianShell
      phone={phone}
      offline={offline}
      onTryNow={() => {
        notice.info('Still offline. The work order stays on this phone.')
      }}
      bottomBar={
        <div className="flex flex-col gap-2">
          {connection}
          {work.stage === 'work' ? finishButton : null}
          {work.stage === 'done' ? (
            <Button
              intent="back"
              label="Back to work orders"
              onClick={() => {
                navigate(BO_ROUTES.orders)
              }}
            />
          ) : null}
        </div>
      }
    >
      {page}
    </TechnicianShell>
  )
}

// ── The preventive maintenance plan ───────────────────────────────────────────────────────────

export function MaintenancePlan({ phone, create }: { phone: boolean; create?: string }) {
  const [plan, setPlan] = usePlan()
  const [, setOrders] = useOrders()
  const [view, setView] = useState<PlanView>('due')
  const [creating, setCreating] = useState<PlanTask | null>(
    () => PLAN.find((each) => each.id === create) ?? null,
  )
  const [technician, setTechnician] = useState<string>(CREATE_DEFAULTS.technician)
  const [day, setDay] = useState<string | null>(CREATE_DEFAULTS.planned)
  const rows = plan.filter((each) => inPlanView(each, view))

  const columns: DataTableColumn<PlanTask>[] = [
    {
      id: 'machine',
      header: 'Machine',
      minWidth: 200,
      cell: (each) => {
        const machine = machineOf(each.machine)
        return <TwoLines first={machine.name} second={`${machine.number} · ${machine.location}`} />
      },
    },
    {
      id: 'task',
      header: 'Task',
      minWidth: 220,
      cell: (each) => <TwoLines first={each.task} second={each.interval} />,
    },
    {
      id: 'last',
      header: 'Last done',
      numeric: true,
      cell: (each) => <bdi>{each.last}</bdi>,
    },
    {
      id: 'next',
      header: 'Next due',
      numeric: true,
      cell: (each) =>
        'date' in each.next ? <DateText value={each.next.date} /> : <bdi>{each.next.text}</bdi>,
    },
    {
      id: 'state',
      header: 'State',
      minWidth: 180,
      cell: (each) => (
        <span className="flex flex-col items-start gap-1">
          {planBadge(each.state)}
          <span className="bidi-content text-xs text-secondary">{each.words}</span>
        </span>
      ),
    },
    {
      id: 'order',
      header: 'Work order',
      cell: (each) =>
        each.order === undefined ? (
          <Button
            family="neutral"
            icon={ClipboardPlus}
            emphasis="secondary"
            label="Create work order"
            onClick={() => {
              setCreating(each)
            }}
          />
        ) : (
          <RecordLink href={BO_ROUTES.order(each.order)}>{each.order}</RecordLink>
        ),
    },
  ]

  const machine = creating === null ? null : machineOf(creating.machine)
  return (
    <MaintenanceShell
      phone={phone}
      tab="plan"
      crumbs={[{ label: 'Maintenance' }, { label: 'Maintenance plan' }]}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Maintenance plan"
        views={PLAN_VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: plan.filter((task) => inPlanView(task, each.id)).length,
        }))}
        view={view}
        onViewChange={(id) => {
          setView(id as PlanView)
        }}
      >
        <DataTable
          label="Maintenance plan"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={columns}
          rows={rows}
          getRowId={(each) => each.id}
          getRowLabel={(each) => `${machineOf(each.machine).name} ${each.task}`}
          count={rows.length}
          rowLimitMessage="Operating hours as the machines last reported them; the intervals and the rules are the application's."
          mobile={{
            title: (each) => machineOf(each.machine).name,
            subtitle: (each) => <span className="bidi-content">{each.task}</span>,
            badge: (each) => planBadge(each.state),
            details: ['next', 'state', 'order'],
          }}
          emptyAction={{
            label: 'Show all tasks',
            onClick: () => {
              setView('all')
            },
          }}
        />
      </ListPage>
      <Dialog
        open={creating !== null}
        onOpenChange={(open) => {
          if (!open) setCreating(null)
        }}
        title="Create work order"
        {...(creating === null || machine === null
          ? {}
          : { subject: `${machine.name} · ${creating.task}` })}
        {...(creating === null ? {} : { description: `${creating.state}: ${creating.words}.` })}
        actions={
          <>
            <Button
              intent="cancel"
              label="Cancel"
              onClick={() => {
                setCreating(null)
              }}
            />
            <Button
              family="primary"
              icon={ClipboardPlus}
              emphasis="primary"
              label="Create work order"
              onClick={() => {
                if (creating === null || day === null) return
                const made = orderFromTask(creating, technician, day)
                setOrders((current) => [made, ...current])
                setPlan((current) =>
                  current.map((each) =>
                    each.id === creating.id ? { ...each, order: made.number } : each,
                  ),
                )
                setCreating(null)
                notice.success(`${made.number} created for ${technicianName(technician) ?? ''}.`)
              }}
            />
          </>
        }
      >
        <div className="flex flex-col gap-4">
          <SelectField
            label="Technician"
            required
            options={TECHNICIANS.map((each) => ({ ...each }))}
            value={technician}
            onChange={setTechnician}
          />
          <DateField label="Planned for" required value={day} onChange={setDay} />
          <p className="bidi-content m-0 text-xs text-secondary">
            {`The application numbers it ${NEXT_ORDER} and adds the task’s checklist.`}
          </p>
        </div>
      </Dialog>
    </MaintenanceShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BO_ROUTES: ExampleRoute[] = [
  { path: BO_ROUTES.orders, render: (phone) => <WorkOrders phone={phone} /> },
  { path: BO_ROUTES.unassigned, render: (phone) => <WorkOrders phone={phone} view="unassigned" /> },
  ...ORDERS.map((each) => ({
    path: BO_ROUTES.order(each.number),
    render: (phone: boolean) => <FieldWorkOrder phone={phone} number={each.number} />,
  })),
  {
    path: BO_ROUTES.order(NEXT_ORDER),
    render: (phone: boolean) => <FieldWorkOrder phone={phone} number={NEXT_ORDER} />,
  },
  { path: BO_ROUTES.offline, render: (phone) => <FieldWorkOrder phone={phone} offline /> },
  { path: BO_ROUTES.notSent, render: (phone) => <FieldWorkOrder phone={phone} sync="failed" /> },
  { path: BO_ROUTES.handover, render: (phone) => <FieldWorkOrder phone={phone} stage="sign" /> },
  { path: BO_ROUTES.done, render: (phone) => <FieldWorkOrder phone={phone} stage="done" /> },
  { path: BO_ROUTES.plan, render: (phone) => <MaintenancePlan phone={phone} /> },
  {
    path: BO_ROUTES.planCreate,
    render: (phone) => <MaintenancePlan phone={phone} create={CREATE_TASK} />,
  },
]
