import { CalendarPlus, Send, Users, UserX } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  ActionGroup,
  AttachmentList,
  Button,
  CheckboxField,
  DataTable,
  DateField,
  DateText,
  DetailPage,
  Dialog,
  FilterBar,
  FormFullWidth,
  FormGrid,
  FormSection,
  HistoryList,
  KanbanBoard,
  KeyValueList,
  ListPage,
  MoneyField,
  MoneyText,
  moveCard,
  notice,
  PageHeader,
  PersonName,
  placeOf,
  RadioGroupField,
  ReasonConfirmDialog,
  RecordFormPage,
  SelectField,
  SlotPicker,
  slotKey,
  StatusBadge,
  TextAreaField,
  TextField,
  Toaster,
  toneFor,
  useLiro,
  type DataTableColumn,
  type FreeSlot,
  type HistoryEntry,
  type KanbanMove,
  type ModuleTab,
} from '@veljaos/ui'
import type { ExampleRoute } from './example-app'
import { COMPANIES, HR_TABS, Navigate, Shell, type ExampleAccount } from './example-shell'
import { useExampleState } from './example-state'
import { Frame, Tenant } from './screens-G'
import {
  ACCEPTED_OFFERS,
  BJ_ROUTES,
  BJ_TODAY,
  CANDIDATE,
  CANDIDATE_HISTORY,
  CRITERIA,
  CV_FILES,
  EMPLOYMENT_KINDS,
  FEATURED_CANDIDATE,
  initialStages,
  INTERVIEWS,
  OPENING_VIEWS,
  OPENINGS,
  POSTING,
  RECOMMENDATIONS,
  RECRUITER,
  REJECT_REASONS,
  SCALE,
  SCORECARD_DRAFT,
  SCORECARDS,
  SECOND_INTERVIEW,
  STAGE_TONES,
  UNITS,
  type Interview,
  type Opening,
  type Scorecard,
  type StageColumn,
} from './data-BJ'

/*
 * Group BJ's example screens (P5.64, recruitment): Kvadrat Gradnja d.o.o.'s HR on 14.10.2026 at
 * 09:40, seen by Jelena Marković (HR manager). Built from the library alone:
 * - The openings (ListPage + DataTable): views Open / Filled / All; the filled maternity cover
 *   opens Teodora Lazić's onboarding (group BK).
 * - Job posting JOB-2026-007 "Buyer, construction materials" (DetailPage, one record read and
 *   edited as a whole, P4.9): the position, what the work is, what is asked, where it is
 *   published, the hiring team; Edit turns the same sections into fields.
 * - The candidates (KanbanBoard): applied → interview → offer → hired / rejected. A move is only
 *   reported; the screen plays the application, which decides: Rejected asks why first
 *   (ReasonConfirmDialog with the company's reasons), Hired is refused until the offer is accepted
 *   (a toast says so), every other move is applied.
 * - A candidate, Tijana Babić (DetailPage): the application, the CV and documents
 *   (AttachmentList), the interviews, the scorecards side by side and the history (HistoryList);
 *   Reject, Schedule interview, Make an offer.
 * - Scheduling (Dialog, the candidate as its subject, D22): the format, SlotPicker with the slots
 *   when every interviewer is free (the application's), and the invitation as an explicit choice.
 * - A scorecard (RecordFormPage): the posting's criteria on the company's scale, each a
 *   RadioGroupField; the recommendation; notes. Sending checks that everything is rated.
 * The stages, the second interview and Jelena's scorecard are kept above the screens, as the
 * application keeps them.
 */

export { BJ_ROUTES }

// ── Shared: the HR shell ──────────────────────────────────────────────────────────────────────

const KVADRAT_ONLY = COMPANIES.filter((company) => company.id === 'kvadrat')

/** Jelena Marković, signed in at Kvadrat Gradnja d.o.o. */
export const HR_MANAGER: ExampleAccount = {
  name: RECRUITER.name,
  email: RECRUITER.email,
  companies: KVADRAT_ONLY,
  links: [
    { label: 'Recruitment', path: BJ_ROUTES.openings },
    { label: 'Candidates for JOB-2026-007', path: BJ_ROUTES.candidates },
    { label: 'Onboarding: Teodora Lazić', path: '/hr/onboarding/teodora-lazic' },
  ],
}

export type PeopleTab = 'employees' | 'recruitment' | 'onboarding'

/** HR's module tabs with Recruitment and Onboarding after Employees. */
export function peopleTabs(current: PeopleTab): ModuleTab[] {
  const [employees, ...rest] = HR_TABS
  const extra: ModuleTab[] = [
    { key: 'recruitment', label: 'Recruitment', href: `#${BJ_ROUTES.openings}` },
    { key: 'onboarding', label: 'Onboarding', href: '#/hr/onboarding/teodora-lazic' },
  ]
  return [...(employees === undefined ? [] : [employees]), ...extra, ...rest].map((tab) => ({
    ...tab,
    current: tab.key === current,
  }))
}

export function HrShell({
  phone,
  tab,
  crumbs,
  bottomBar,
  children,
}: {
  phone: boolean
  tab: PeopleTab
  crumbs: { label: string; href?: string }[]
  bottomBar?: ReactNode
  children: ReactNode
}) {
  return (
    <Tenant today={BJ_TODAY}>
      <Shell
        phone={phone}
        account={HR_MANAGER}
        tabs={peopleTabs(tab)}
        crumbs={crumbs}
        {...(bottomBar === undefined ? {} : { bottomBar })}
      >
        {children}
        <Toaster layout={phone ? 'phone' : 'desktop'} />
      </Shell>
    </Tenant>
  )
}

function stageBadge(stage: string) {
  return <StatusBadge label={stage} tone={toneFor(stage, STAGE_TONES)} />
}

const OPENING_TONES = { Published: 'info', Filled: 'success', Draft: 'neutral' } as const

function openingBadge(state: string) {
  return <StatusBadge label={state} tone={toneFor(state, OPENING_TONES)} />
}

const money = (value: string | null) => <MoneyText value={value} currency="RSD" />

// ── The openings ──────────────────────────────────────────────────────────────────────────────

const OPENING_COLUMNS: DataTableColumn<Opening>[] = [
  {
    id: 'position',
    header: 'Position',
    minWidth: 220,
    cell: (row) => (
      <span className="flex flex-col">
        <span className="bidi-content font-medium">{row.position}</span>
        <span dir="ltr" className="text-xs text-secondary tabular-nums">
          {row.id}
        </span>
      </span>
    ),
  },
  { id: 'unit', header: 'Unit', cell: (row) => <span className="bidi-content">{row.unit}</span> },
  { id: 'openings', header: 'Openings', cell: (row) => row.openings },
  {
    id: 'candidates',
    header: 'Candidates',
    cell: (row) => <span className="bidi-content">{row.note ?? row.candidates}</span>,
  },
  {
    id: 'published',
    header: 'Published',
    numeric: true,
    cell: (row) => <DateText value={row.published} />,
  },
  {
    id: 'applyBy',
    header: 'Apply by',
    numeric: true,
    cell: (row) => <DateText value={row.applyBy} />,
  },
  { id: 'state', header: 'State', cell: (row) => openingBadge(row.state) },
]

export function OpeningsScreen({ phone }: { phone: boolean }) {
  const navigate = useContext(Navigate)
  const [view, setView] = useState('open')
  const [search, setSearch] = useState('')
  const inView = (row: Opening, id: string) =>
    OPENING_VIEWS.find((each) => each.id === id)?.states.includes(row.state) === true
  const needle = search.trim().toLocaleLowerCase()
  const rows = OPENINGS.filter(
    (row) =>
      inView(row, view) &&
      (needle === '' ||
        `${row.id} ${row.position} ${row.unit}`.toLocaleLowerCase().includes(needle)),
  )
  const create = <Button intent="create" label="New job posting" />
  return (
    <HrShell
      phone={phone}
      tab="recruitment"
      crumbs={[{ label: 'Human resources' }, { label: 'Recruitment' }]}
      {...(phone ? { bottomBar: create } : {})}
    >
      <ListPage
        layout={phone ? 'phone' : 'desktop'}
        title="Recruitment"
        {...(phone ? {} : { actions: create })}
        views={OPENING_VIEWS.map((each) => ({
          id: each.id,
          label: each.label,
          count: OPENINGS.filter((row) => inView(row, each.id)).length,
        }))}
        view={view}
        onViewChange={setView}
        filterBar={
          <FilterBar
            inCard
            layout={phone ? 'phone' : 'desktop'}
            filters={[]}
            values={{}}
            onValuesChange={() => undefined}
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Position or unit"
          />
        }
      >
        <DataTable
          label="Job postings"
          layout={phone ? 'cards' : 'table'}
          inCard
          columns={OPENING_COLUMNS}
          rows={rows}
          getRowId={(row) => row.id}
          getRowLabel={(row) => `${row.position}, ${row.id}`}
          filters={{ search }}
          onFiltersChange={() => {
            setSearch('')
          }}
          count={rows.length}
          onRowClick={(row) => {
            if (row.id === POSTING.id) navigate(BJ_ROUTES.posting)
            else if (row.id === 'JOB-2026-005') navigate('/hr/onboarding/teodora-lazic')
            else notice.info(`${row.id} is not part of the examples.`)
          }}
          mobile={{
            title: (row) => row.position,
            subtitle: (row) => <span className="bidi-content">{row.note ?? row.candidates}</span>,
            badge: (row) => openingBadge(row.state),
            details: ['unit', 'applyBy'],
          }}
        />
      </ListPage>
    </HrShell>
  )
}

// ── Job posting JOB-2026-007 ──────────────────────────────────────────────────────────────────

function Paragraphs({ items }: { items: readonly string[] }) {
  return (
    <ul className="m-0 flex list-disc flex-col gap-1 ps-5 text-sm text-primary">
      {items.map((item) => (
        <li key={item} className="bidi-content">
          {item}
        </li>
      ))}
    </ul>
  )
}

export function PostingScreen({ phone, editing = false }: { phone: boolean; editing?: boolean }) {
  const navigate = useContext(Navigate)
  const [mode, setMode] = useState<'view' | 'edit'>(editing ? 'edit' : 'view')
  const [saved, setSaved] = useState({ position: POSTING.position, applyBy: POSTING.applyBy })
  const [values, setValues] = useState(saved)
  const dirty = values.position !== saved.position || values.applyBy !== saved.applyBy
  const candidates = (
    <Button
      family="primary"
      emphasis="primary"
      icon={Users}
      label="Open candidates"
      onClick={() => {
        navigate(BJ_ROUTES.candidates)
      }}
    />
  )
  const edit = (
    <Button
      intent="edit"
      label="Edit"
      onClick={() => {
        setMode('edit')
      }}
    />
  )
  return (
    <HrShell
      phone={phone}
      tab="recruitment"
      crumbs={[{ label: 'Recruitment', href: `#${BJ_ROUTES.openings}` }, { label: POSTING.id }]}
      {...(phone && mode === 'view'
        ? {
            bottomBar: (
              <>
                {edit}
                {candidates}
              </>
            ),
          }
        : {})}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={values.position}
        back={{ href: `#${BJ_ROUTES.openings}`, label: 'Recruitment' }}
        status={openingBadge('Published')}
        subtitle={<bdi dir="ltr">{POSTING.id}</bdi>}
        keyFigures={[
          { label: 'Candidates', value: '11' },
          { label: 'In interview', value: '3' },
          { label: 'Offers', value: '1' },
          { label: 'Open for', value: POSTING.daysOpen },
        ]}
        {...(phone
          ? {}
          : {
              actions: (
                <>
                  {edit}
                  {candidates}
                </>
              ),
            })}
        mode={mode}
        dirty={dirty}
        editActions={
          <ActionGroup
            actions={[
              {
                key: 'cancel',
                intent: 'cancel',
                label: 'Cancel',
                onClick: () => {
                  setValues(saved)
                  setMode('view')
                },
              },
              {
                key: 'save',
                intent: 'save',
                label: 'Save',
                onClick: () => {
                  setSaved(values)
                  setMode('view')
                  notice.success(`${POSTING.id} is saved.`)
                },
              },
            ]}
          />
        }
        sections={[
          {
            id: 'position',
            label: 'Position',
            content: (
              <KeyValueList
                columns={phone ? 1 : 2}
                items={[
                  { label: 'Unit', value: POSTING.unit },
                  { label: 'Reports to', value: POSTING.reportsTo },
                  { label: 'Location', value: POSTING.location },
                  { label: 'Employment', value: POSTING.employment },
                  { label: 'Openings', value: POSTING.openings, numeric: true },
                  {
                    label: 'Gross salary',
                    value: (
                      <span className="tabular-nums">
                        {money(POSTING.salaryFrom)} – {money(POSTING.salaryTo)}
                      </span>
                    ),
                    numeric: true,
                  },
                  {
                    label: 'Published',
                    value: <DateText value={POSTING.published} />,
                    numeric: true,
                  },
                  { label: 'Apply by', value: <DateText value={values.applyBy} />, numeric: true },
                ]}
              />
            ),
            edit: (
              <FormGrid>
                <TextField
                  label="Position"
                  required
                  value={values.position}
                  onChange={(position) => {
                    setValues((current) => ({ ...current, position }))
                  }}
                />
                <SelectField label="Unit" options={UNITS} defaultValue={POSTING.unit} />
                <TextField label="Location" defaultValue={POSTING.location} />
                <SelectField
                  label="Employment"
                  options={EMPLOYMENT_KINDS}
                  defaultValue="indefinite"
                />
                <MoneyField
                  label="Gross salary from"
                  currency="RSD"
                  defaultValue={POSTING.salaryFrom}
                />
                <MoneyField
                  label="Gross salary to"
                  currency="RSD"
                  defaultValue={POSTING.salaryTo}
                />
                <DateField
                  label="Apply by"
                  value={values.applyBy}
                  onChange={(applyBy) => {
                    if (applyBy !== null) setValues((current) => ({ ...current, applyBy }))
                  }}
                />
              </FormGrid>
            ),
          },
          {
            id: 'work',
            label: 'The work',
            content: (
              <div className="flex flex-col gap-3">
                <p className="bidi-content m-0 text-sm text-primary">{POSTING.summary}</p>
                <Paragraphs items={POSTING.duties} />
              </div>
            ),
            edit: (
              <FormGrid>
                <FormFullWidth>
                  <TextAreaField label="About the work" rows={3} defaultValue={POSTING.summary} />
                </FormFullWidth>
                <FormFullWidth>
                  <TextAreaField
                    label="Duties, one per line"
                    rows={4}
                    defaultValue={POSTING.duties.join('\n')}
                  />
                </FormFullWidth>
              </FormGrid>
            ),
          },
          {
            id: 'requirements',
            label: 'What we ask',
            content: <Paragraphs items={POSTING.requirements} />,
            edit: (
              <FormGrid>
                <FormFullWidth>
                  <TextAreaField
                    label="Requirements, one per line"
                    rows={4}
                    defaultValue={POSTING.requirements.join('\n')}
                  />
                </FormFullWidth>
              </FormGrid>
            ),
          },
          {
            id: 'published',
            label: 'Published on',
            description: 'Changed through each channel',
            content: (
              <KeyValueList
                items={POSTING.channels.map((channel) => ({
                  key: channel.key,
                  label: channel.label,
                  value: channel.state,
                }))}
              />
            ),
          },
          {
            id: 'team',
            label: 'Hiring team',
            content: (
              <ul className="m-0 flex list-none flex-col gap-3 p-0">
                {POSTING.team.map((person) => (
                  <li key={person.name}>
                    <PersonName name={person.name} description={person.role} />
                  </li>
                ))}
              </ul>
            ),
          },
        ]}
      />
    </HrShell>
  )
}

// ── The candidates ────────────────────────────────────────────────────────────────────────────

function useStages() {
  return useExampleState<StageColumn[]>('BJ.stages', initialStages)
}

function candidateName(columns: readonly StageColumn[], id: string): string {
  for (const column of columns) {
    const found = column.cards.find((each) => each.id === id)
    if (found !== undefined) return found.title
  }
  return ''
}

function count(n: number) {
  return `${String(n)} ${n === 1 ? 'candidate' : 'candidates'}`
}

/** Luka Perić's move to Rejected, waiting for its reason (the pictured state). */
function pendingRejection(columns: readonly StageColumn[], id: string): KanbanMove | null {
  const from = placeOf(columns, id)
  return from === null ? null : { cardId: id, from, to: { column: 'rejected', index: 0 } }
}

export function CandidatesScreen({ phone, reject }: { phone: boolean; reject?: string }) {
  const { format } = useLiro()
  const [columns, setColumns] = useStages()
  const [pending, setPending] = useState<KanbanMove | null>(() =>
    reject === undefined ? null : pendingRejection(columns, reject),
  )
  const pendingName = pending === null ? '' : candidateName(columns, pending.cardId)
  return (
    <HrShell
      phone={phone}
      tab="recruitment"
      crumbs={[
        { label: 'Recruitment', href: `#${BJ_ROUTES.openings}` },
        { label: POSTING.id, href: `#${BJ_ROUTES.posting}` },
        { label: 'Candidates' },
      ]}
    >
      <Frame phone={phone} wide>
        <PageHeader
          title="Candidates"
          back={{ href: `#${BJ_ROUTES.posting}`, label: POSTING.position }}
          subtitle={`${POSTING.position} · ${POSTING.id}`}
        />
        <KanbanBoard
          label={`Candidates for ${POSTING.position}`}
          layout={phone ? 'phone' : 'desktop'}
          columns={columns.map((column) => ({ ...column, count: count(column.cards.length) }))}
          onMove={(move) => {
            const name = candidateName(columns, move.cardId)
            if (move.to.column === 'rejected' && move.from.column !== 'rejected') {
              setPending(move)
              return
            }
            if (move.to.column === 'hired' && !ACCEPTED_OFFERS.includes(move.cardId)) {
              notice.warning(`Not moved: ${name} has not accepted an offer.`)
              return
            }
            setColumns((current) => moveCard(current, move.cardId, move.to))
          }}
        />
      </Frame>
      <ReasonConfirmDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) setPending(null)
        }}
        family="destructive"
        actionIcon={UserX}
        title="Reject"
        subject={pendingName}
        message="The reason stays with the application. The candidate is not notified from here."
        reasons={REJECT_REASONS}
        confirmLabel="Reject"
        onConfirm={(answer) => {
          if (pending === null) return
          const reason = REJECT_REASONS.find((each) => each.value === answer.reason)?.label ?? ''
          setColumns((current) =>
            moveCard(current, pending.cardId, pending.to).map((column) => ({
              ...column,
              cards: column.cards.map((each) =>
                each.id === pending.cardId
                  ? { ...each, description: `Rejected ${format.date(BJ_TODAY)} · ${reason}` }
                  : each,
              ),
            })),
          )
          notice.success(`${pendingName} is moved to Rejected.`)
          setPending(null)
        }}
      />
    </HrShell>
  )
}

// ── Tijana Babić ──────────────────────────────────────────────────────────────────────────────

function ratingText(value: string | undefined): string {
  return SCALE.find((each) => each.value === value)?.label ?? '—'
}

function recommendationText(value: string | null): string {
  return RECOMMENDATIONS.find((each) => each.value === value)?.label ?? '—'
}

interface ScoreRow {
  id: string
  label: string
  values: (string | null)[]
}

function scoreRows(cards: readonly Scorecard[]): ScoreRow[] {
  return [
    ...CRITERIA.map((criterion) => ({
      id: criterion.id,
      label: criterion.label,
      values: cards.map((each) =>
        each.submitted === null ? null : ratingText(each.ratings[criterion.id]),
      ),
    })),
    {
      id: 'recommendation',
      label: 'Recommendation',
      values: cards.map((each) =>
        each.submitted === null ? null : recommendationText(each.recommendation),
      ),
    },
  ]
}

function scoreColumns(cards: readonly Scorecard[]): DataTableColumn<ScoreRow>[] {
  return [
    {
      id: 'criterion',
      header: 'Criterion',
      minWidth: 200,
      cell: (row) => <span className="bidi-content font-medium">{row.label}</span>,
    },
    ...cards.map((each, index) => ({
      id: `by-${String(index)}`,
      header: each.submitted === null ? `${each.by} (not submitted)` : each.by,
      label: each.by,
      cell: (row: ScoreRow) => row.values[index] ?? '—',
    })),
  ]
}

const INTERVIEW_TONES = { Done: 'success', Scheduled: 'info', 'Not scheduled': 'warning' } as const

function useInterviewColumns(): DataTableColumn<Interview>[] {
  const { format } = useLiro()
  return [
    { id: 'title', header: 'Interview', cell: (row) => row.title },
    {
      id: 'when',
      header: 'When',
      numeric: true,
      cell: (row) =>
        row.start === '' ? '—' : `${format.dateTime(row.start)}–${format.time(row.end)}`,
    },
    {
      id: 'where',
      header: 'Where',
      cell: (row) => <span className="bidi-content">{row.where}</span>,
    },
    {
      id: 'interviewers',
      header: 'Interviewers',
      cell: (row) => <span className="bidi-content">{row.interviewers}</span>,
    },
    {
      id: 'state',
      header: 'State',
      cell: (row) => <StatusBadge label={row.state} tone={toneFor(row.state, INTERVIEW_TONES)} />,
    },
  ]
}

interface Scheduled {
  slot: FreeSlot
  where: string
}

function useSecondInterview() {
  return useExampleState<Scheduled | null>('BJ.second', () => null)
}

function useMyScorecard() {
  return useExampleState<Scorecard | null>('BJ.myScorecard', () => null)
}

/** The second interview's dialog: format, a free slot of every interviewer, the invitation. */
function ScheduleDialog({
  open,
  onOpenChange,
  onSchedule,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSchedule: (scheduled: Scheduled, invite: boolean) => void
}) {
  const [where, setWhere] = useState('office')
  const [slot, setSlot] = useState<FreeSlot | null>(null)
  const [invite, setInvite] = useState(true)
  const [missing, setMissing] = useState(false)
  return (
    <Dialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Schedule ${SECOND_INTERVIEW.title.toLocaleLowerCase()}`}
      subject={CANDIDATE.name}
      description={`With ${SECOND_INTERVIEW.interviewers}. The times are when all of them are free.`}
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
            emphasis="primary"
            icon={CalendarPlus}
            label="Schedule"
            onClick={() => {
              if (slot === null) {
                setMissing(true)
                return
              }
              const label = SECOND_INTERVIEW.formats.find((each) => each.value === where)?.label
              onSchedule({ slot, where: label ?? '' }, invite)
            }}
          />
        </>
      }
    >
      <div className="flex flex-col gap-4">
        <RadioGroupField
          label="Format"
          options={SECOND_INTERVIEW.formats}
          value={where}
          onChange={setWhere}
        />
        <SlotPicker
          label="Time"
          required
          slots={SECOND_INTERVIEW.slots}
          value={slot === null ? null : slotKey(slot)}
          onChange={(next) => {
            setSlot(next)
            setMissing(false)
          }}
          {...(missing ? { error: 'Choose a time.' } : {})}
        />
        <CheckboxField
          label={`Send the invitation to ${CANDIDATE.email}`}
          checked={invite}
          onChange={setInvite}
        />
      </div>
    </Dialog>
  )
}

export function CandidateScreen({
  phone,
  scheduling = false,
}: {
  phone: boolean
  scheduling?: boolean
}) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const [columns, setColumns] = useStages()
  const [second, setSecond] = useSecondInterview()
  const [mine] = useMyScorecard()
  const [schedule, setSchedule] = useState(scheduling)
  const [rejecting, setRejecting] = useState(false)
  const [extra, setExtra] = useState<HistoryEntry[]>([])
  const interviewColumns = useInterviewColumns()
  const place = placeOf(columns, FEATURED_CANDIDATE)
  const stage = columns.find((column) => column.id === place?.column)?.title ?? 'Applied'
  const cards = SCORECARDS.map((each) =>
    each.by === RECRUITER.name && mine !== null ? mine : each,
  )
  const submittedCount = cards.filter((each) => each.submitted !== null).length
  const interviews: Interview[] = [
    ...INTERVIEWS,
    second === null
      ? {
          id: 'second',
          title: SECOND_INTERVIEW.title,
          start: '',
          end: '',
          where: '—',
          interviewers: SECOND_INTERVIEW.interviewers,
          state: 'Not scheduled',
        }
      : {
          id: 'second',
          title: SECOND_INTERVIEW.title,
          start: second.slot.start,
          end: second.slot.end ?? second.slot.start,
          where: second.where,
          interviewers: SECOND_INTERVIEW.interviewers,
          state: 'Scheduled',
        },
  ]
  const moveTo = (column: string) => {
    setColumns((current) => moveCard(current, FEATURED_CANDIDATE, { column, index: 0 }))
  }
  const history: HistoryEntry[] = [...extra, ...CANDIDATE_HISTORY]
  const closed = stage === 'Rejected' || stage === 'Hired'
  const actions = closed ? null : (
    <>
      <Button
        family="destructive"
        emphasis="secondary"
        icon={UserX}
        label="Reject"
        onClick={() => {
          setRejecting(true)
        }}
      />
      {second === null && (
        <Button
          family="neutral"
          emphasis="secondary"
          icon={CalendarPlus}
          label="Schedule interview"
          onClick={() => {
            setSchedule(true)
          }}
        />
      )}
      {stage !== 'Offer' && (
        <Button
          family="primary"
          emphasis="primary"
          icon={Send}
          label="Make an offer"
          onClick={() => {
            moveTo('offer')
            setExtra((list) => [
              {
                id: `offer-${String(list.length)}`,
                at: '2026-10-14T09:40:00+02:00',
                actor: { name: RECRUITER.name },
                changes: [{ field: 'Stage', from: stage, to: 'Offer' }],
              },
              ...list,
            ])
            notice.success(`${CANDIDATE.name} is moved to Offer.`)
          }}
        />
      )}
    </>
  )
  return (
    <HrShell
      phone={phone}
      tab="recruitment"
      crumbs={[
        { label: 'Recruitment', href: `#${BJ_ROUTES.openings}` },
        { label: 'Candidates', href: `#${BJ_ROUTES.candidates}` },
        { label: CANDIDATE.name },
      ]}
      {...(phone && actions !== null ? { bottomBar: actions } : {})}
    >
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={CANDIDATE.name}
        back={{ href: `#${BJ_ROUTES.candidates}`, label: 'Candidates' }}
        status={stageBadge(stage)}
        subtitle={`${POSTING.position} · applied ${format.date(CANDIDATE.applied)}`}
        keyFigures={[
          { label: 'Scorecards', value: `${String(submittedCount)} of ${String(cards.length)}` },
          { label: 'Recommendation so far', value: CANDIDATE.recommendation },
          { label: 'Notice period', value: CANDIDATE.notice },
        ]}
        {...(phone || actions === null ? {} : { actions })}
        sections={[
          {
            id: 'application',
            label: 'Application',
            content: (
              <KeyValueList
                columns={phone ? 1 : 2}
                items={[
                  { label: 'E-mail', value: <bdi dir="ltr">{CANDIDATE.email}</bdi> },
                  { label: 'Phone', value: <bdi dir="ltr">{CANDIDATE.phone}</bdi> },
                  { label: 'Now', value: CANDIDATE.current },
                  { label: 'Source', value: CANDIDATE.source },
                  {
                    label: 'Expected gross salary',
                    value: money(CANDIDATE.expected),
                    numeric: true,
                  },
                  { label: 'Notice period', value: CANDIDATE.notice },
                ]}
              />
            ),
          },
          {
            id: 'documents',
            label: 'CV and documents',
            flush: true,
            content: (
              <AttachmentList
                label="CV and documents"
                inCard
                files={CV_FILES.map((file) => ({
                  ...file,
                  state: 'available' as const,
                  detail: <span className="bidi-content">{file.detail}</span>,
                }))}
                onDownload={(file) => {
                  notice.success(`${file.name} is downloaded.`)
                }}
              />
            ),
          },
          {
            id: 'interviews',
            label: 'Interviews',
            flush: true,
            content: (
              <DataTable
                label="Interviews"
                layout={phone ? 'cards' : 'table'}
                inCard
                columns={interviewColumns}
                rows={interviews}
                getRowId={(row) => row.id}
                getRowLabel={(row) => row.title}
                mobile={{
                  badge: (row) => (
                    <StatusBadge label={row.state} tone={toneFor(row.state, INTERVIEW_TONES)} />
                  ),
                  details: ['when', 'where', 'interviewers'],
                }}
              />
            ),
          },
          {
            id: 'scorecards',
            label: 'Scorecards',
            flush: true,
            description: `${String(submittedCount)} of ${String(cards.length)} submitted`,
            ...(mine === null
              ? {
                  actions: (
                    <Button
                      intent="edit"
                      label="Fill in your scorecard"
                      onClick={() => {
                        navigate(BJ_ROUTES.scorecard)
                      }}
                    />
                  ),
                }
              : {}),
            content: (
              <DataTable
                label="Scorecards"
                layout={phone ? 'cards' : 'table'}
                inCard
                columns={scoreColumns(cards)}
                rows={scoreRows(cards)}
                getRowId={(row) => row.id}
                getRowLabel={(row) => row.label}
                mobile={{ title: (row) => row.label }}
              />
            ),
          },
          {
            id: 'history',
            label: 'History',
            content: <HistoryList label={`History of ${CANDIDATE.name}`} entries={history} />,
          },
        ]}
      />
      <ScheduleDialog
        open={schedule}
        onOpenChange={setSchedule}
        onSchedule={(scheduled, invite) => {
          setSecond(scheduled)
          setSchedule(false)
          setExtra((list) => [
            {
              id: `second-${String(list.length)}`,
              at: '2026-10-14T09:40:00+02:00',
              actor: { name: RECRUITER.name },
              text: `Scheduled the second interview for ${format.dateTime(scheduled.slot.start)}${invite ? '; the invitation was sent.' : '.'}`,
            },
            ...list,
          ])
          notice.success(
            `The second interview is scheduled for ${format.dateTime(scheduled.slot.start)}.`,
          )
        }}
      />
      <ReasonConfirmDialog
        open={rejecting}
        onOpenChange={setRejecting}
        family="destructive"
        actionIcon={UserX}
        title="Reject"
        subject={CANDIDATE.name}
        message="The reason stays with the application. The candidate is not notified from here."
        reasons={REJECT_REASONS}
        confirmLabel="Reject"
        onConfirm={() => {
          moveTo('rejected')
          setRejecting(false)
          notice.success(`${CANDIDATE.name} is moved to Rejected.`)
        }}
      />
    </HrShell>
  )
}

// ── The scorecard ─────────────────────────────────────────────────────────────────────────────

export function ScorecardScreen({ phone, check = false }: { phone: boolean; check?: boolean }) {
  const navigate = useContext(Navigate)
  const [, setMine] = useMyScorecard()
  const [ratings, setRatings] = useState<Record<string, string>>(SCORECARD_DRAFT.ratings)
  const [recommendation, setRecommendation] = useState(SCORECARD_DRAFT.recommendation)
  const [notes, setNotes] = useState(SCORECARD_DRAFT.notes)
  const [checked, setChecked] = useState(check)
  const dirty =
    notes !== SCORECARD_DRAFT.notes ||
    recommendation !== SCORECARD_DRAFT.recommendation ||
    CRITERIA.some((each) => ratings[each.id] !== SCORECARD_DRAFT.ratings[each.id])
  const missing = (value: string | undefined) => checked && (value === undefined || value === '')
  const send = () => {
    setChecked(true)
    const complete =
      CRITERIA.every((criterion) => (ratings[criterion.id] ?? '') !== '') && recommendation !== ''
    if (!complete) return
    setMine({
      by: RECRUITER.name,
      role: 'Recruiter, HR',
      submitted: '2026-10-14T09:40:00+02:00',
      ratings,
      recommendation,
      notes,
    })
    notice.success('Your scorecard is submitted.')
    navigate(BJ_ROUTES.candidate)
  }
  return (
    <HrShell
      phone={phone}
      tab="recruitment"
      crumbs={[
        { label: 'Candidates', href: `#${BJ_ROUTES.candidates}` },
        { label: CANDIDATE.name, href: `#${BJ_ROUTES.candidate}` },
        { label: 'Scorecard' },
      ]}
    >
      <RecordFormPage
        layout={phone ? 'phone' : 'desktop'}
        title="Scorecard"
        subtitle={`${CANDIDATE.name} · first interview, 13.10.2026`}
        back={{ href: `#${BJ_ROUTES.candidate}`, label: CANDIDATE.name }}
        dirty={dirty}
        actions={
          <ActionGroup
            actions={[
              {
                key: 'cancel',
                intent: 'cancel',
                label: 'Cancel',
                onClick: () => {
                  navigate(BJ_ROUTES.candidate)
                },
              },
              {
                key: 'send',
                family: 'primary',
                emphasis: 'primary',
                icon: Send,
                label: 'Submit scorecard',
                onClick: send,
              },
            ]}
          />
        }
      >
        <div className="flex flex-col gap-4">
          <FormSection
            title="Ratings"
            description="Rate what you saw in the interview, on the company's scale."
            columns={phone ? 1 : 2}
            headingLevel={2}
          >
            {CRITERIA.map((criterion) => (
              <RadioGroupField
                key={criterion.id}
                label={criterion.label}
                description={criterion.description}
                required
                options={SCALE}
                value={ratings[criterion.id] ?? ''}
                onChange={(value) => {
                  setRatings((current) => ({ ...current, [criterion.id]: value }))
                }}
                {...(missing(ratings[criterion.id]) ? { error: 'Rate this criterion.' } : {})}
              />
            ))}
          </FormSection>
          <FormSection title="Your recommendation" columns={1} headingLevel={2}>
            <RadioGroupField
              label="Hire this candidate?"
              required
              options={RECOMMENDATIONS}
              value={recommendation}
              onChange={setRecommendation}
              {...(missing(recommendation) ? { error: 'Choose your recommendation.' } : {})}
            />
            <TextAreaField
              label="Notes"
              description="What you saw: examples and answers. The hiring team reads them."
              rows={4}
              value={notes}
              onChange={setNotes}
            />
          </FormSection>
        </div>
      </RecordFormPage>
    </HrShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BJ_ROUTES: ExampleRoute[] = [
  { path: BJ_ROUTES.openings, render: (phone) => <OpeningsScreen phone={phone} /> },
  { path: BJ_ROUTES.posting, render: (phone) => <PostingScreen phone={phone} /> },
  { path: BJ_ROUTES.postingEdit, render: (phone) => <PostingScreen phone={phone} editing /> },
  { path: BJ_ROUTES.candidates, render: (phone) => <CandidatesScreen phone={phone} /> },
  {
    path: BJ_ROUTES.candidatesReject,
    render: (phone) => <CandidatesScreen phone={phone} reject="luka" />,
  },
  { path: BJ_ROUTES.candidate, render: (phone) => <CandidateScreen phone={phone} /> },
  { path: BJ_ROUTES.schedule, render: (phone) => <CandidateScreen phone={phone} scheduling /> },
  { path: BJ_ROUTES.scorecard, render: (phone) => <ScorecardScreen phone={phone} /> },
  { path: BJ_ROUTES.scorecardErrors, render: (phone) => <ScorecardScreen phone={phone} check /> },
]
