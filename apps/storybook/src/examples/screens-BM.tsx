import { FlaskConical } from 'lucide-react'
import { useContext, useState, type ReactNode } from 'react'
import {
  Button,
  DataTable,
  DateText,
  DetailPage,
  Drawer,
  KeyValueList,
  MaskedValue,
  SelectField,
  SidePanels,
  StatusBadge,
  toneFor,
  useLiro,
  type DataTableColumn,
  type KeyFigure,
  type Tone,
} from '@veljaos/ui'
import { LineChart, type ChartSeries } from '../../../../packages/ui/src/charts'
import type { ExampleRoute } from './example-app'
import { Navigate } from './example-shell'
import { ClinicShell, H_ROUTES } from './screens-H'
import { REVEAL_REASONS } from './data-H'
import {
  BM_ROUTES,
  BM_TODAY,
  CHART_FIGURES,
  CHART_PATIENT,
  FINDINGS,
  LAB_TESTS,
  LATEST_PANEL,
  LATEST_RESULTS,
  MEDICINE_TONES,
  MEDICINES,
  resultsOf,
  VERDICT_TONES,
  VISIT_TONES,
  VISITS,
  type ChartFinding,
  type LabResult,
  type LabTest,
  type LatestResult,
  type Medicine,
  type ReferenceRange,
  type Visit,
} from './data-BM'

/*
 * Group BM's example screens (P5.72, the patient chart): Jovana Nikolić's chart at Ambulanta
 * Liman of Dom zdravlja Novi Sad (group H), opened from the doctor's calendar or the clinic's
 * schedule. Assembled from the library only:
 * - The chart is a DetailPage: her visits first (a DataTable by date; a press opens the visit in an
 *   end Drawer), her findings with the diagnosis and the text masked until a reason is given
 *   (MaskedValue, P5.14: the clinic's reasons, access logged), her medicines (current and past,
 *   dose, directions and period), the latest laboratory results with the laboratory's reference
 *   ranges and verdicts (a StatusBadge in the application's words and tone), and the patient, her
 *   allergy and the next appointment in SidePanels. On phones the visits come first: no key
 *   figures above them, the panels under the content.
 * - Lab results: the latest results with the one before each, and one test over time — a small
 *   LineChart whose reference range is data (the laboratory's upper and lower limit as grey
 *   series beside the result, so the tooltip and "Show as table" read them too) and the test's
 *   results by date.
 * The library judges nothing: every verdict, tone, count and range comes from data-BM.ts.
 */

export { BM_ROUTES }

const LINK = 'text-link no-underline visited:text-link hover:underline'

/** A code or a number inside a sentence or a link, always left to right. */
function Code({ children }: { children: ReactNode }) {
  return <span dir="ltr">{children}</span>
}

function badge(label: string, tones: Readonly<Record<string, Tone>>) {
  return <StatusBadge label={label} tone={toneFor(label, tones)} />
}

/** "08.10.2026. 07:30": a visit's day and time through the provider. */
function useWhen() {
  const { format } = useLiro()
  return (start: string) => `${format.date(start.slice(0, 10))} ${format.time(start)}`
}

/** The laboratory's range in the tenant's digits: "3,9–6,1", "< 5,2", "> 1,2". */
function useRangeText() {
  const { format } = useLiro()
  return (range: ReferenceRange) => {
    if (range.low !== undefined && range.high !== undefined) {
      return `${format.number(range.low)}–${format.number(range.high)}`
    }
    if (range.high !== undefined) return `< ${format.number(range.high)}`
    if (range.low !== undefined) return `> ${format.number(range.low)}`
    return '—'
  }
}

/** A result's value through the provider; "—" while the laboratory has not reported it. */
function useValueText() {
  const { format } = useLiro()
  return (value: string | null) => (value === null ? '—' : format.number(value))
}

function testOf(id: string): LabTest {
  const found = LAB_TESTS.find((each) => each.id === id) ?? LAB_TESTS[0]
  if (found === undefined) throw new Error(`No laboratory test ${id}`)
  return found
}

// ── Masked health data ────────────────────────────────────────────────────────────────────────

/** Which masked values the application has passed after a reason: "<finding>:diagnosis". */
type Revealed = Readonly<Record<string, boolean>>

function MaskedPart({
  finding,
  part,
  revealed,
  onChange,
}: {
  finding: ChartFinding
  part: 'diagnosis' | 'text'
  revealed: Revealed
  onChange: (key: string, shown: boolean) => void
}) {
  const key = `${finding.number}:${part}`
  const label = part === 'diagnosis' ? 'Diagnosis' : 'Finding and advice'
  return (
    <MaskedValue
      label={label}
      sentenceLabel={label.toLowerCase()}
      subject={`${CHART_PATIENT.name}, finding ${finding.number}`}
      reasons={REVEAL_REASONS}
      allowOther
      {...(revealed[key] === true ? { value: finding[part] } : {})}
      onReveal={() => {
        onChange(key, true)
      }}
      onHide={() => {
        onChange(key, false)
      }}
    />
  )
}

function FindingNumber({ finding }: { finding: ChartFinding }) {
  const { linkComponent: Link } = useLiro()
  if (finding.page === undefined) return <Code>{finding.number}</Code>
  return (
    <Link href={`#${finding.page}`} className={LINK}>
      <Code>{finding.number}</Code>
    </Link>
  )
}

// ── Columns ───────────────────────────────────────────────────────────────────────────────────

function visitColumns(when: (start: string) => string): DataTableColumn<Visit>[] {
  return [
    {
      id: 'when',
      header: 'Date and time',
      numeric: true,
      cell: (row) => when(row.start),
    },
    { id: 'kind', header: 'Visit', cell: (row) => row.kind },
    { id: 'who', header: 'Doctor or service', cell: (row) => row.who },
    { id: 'place', header: 'Place', cell: (row) => row.place },
    { id: 'note', header: 'Note', minWidth: 200, cell: (row) => row.note ?? '' },
    { id: 'state', header: 'State', cell: (row) => badge(row.state, VISIT_TONES) },
  ]
}

function findingColumns(
  revealed: Revealed,
  onChange: (key: string, shown: boolean) => void,
): DataTableColumn<ChartFinding>[] {
  return [
    {
      id: 'date',
      header: 'Date',
      numeric: true,
      cell: (row) => <DateText value={row.date} />,
    },
    { id: 'number', header: 'Finding', cell: (row) => <FindingNumber finding={row} /> },
    { id: 'kind', header: 'Visit', cell: (row) => row.kind },
    { id: 'who', header: 'Doctor', cell: (row) => row.who },
    {
      id: 'diagnosis',
      header: 'Diagnosis',
      minWidth: 200,
      cell: (row) => (
        <MaskedPart finding={row} part="diagnosis" revealed={revealed} onChange={onChange} />
      ),
    },
  ]
}

function medicineColumns(): DataTableColumn<Medicine>[] {
  return [
    {
      id: 'name',
      header: 'Medicine',
      cell: (row) => (
        <span className="flex flex-col">
          <span className="bidi-content font-medium">{row.name}</span>
          <span className="bidi-content text-sm text-secondary">{row.dose}</span>
        </span>
      ),
    },
    { id: 'directions', header: 'How to take it', minWidth: 200, cell: (row) => row.directions },
    { id: 'from', header: 'From', numeric: true, cell: (row) => <DateText value={row.from} /> },
    {
      id: 'until',
      header: 'Until',
      numeric: true,
      cell: (row) => (row.until === null ? 'No end date' : <DateText value={row.until} />),
    },
    { id: 'who', header: 'Prescribed by', cell: (row) => row.who },
    { id: 'state', header: 'State', cell: (row) => badge(row.state, MEDICINE_TONES) },
  ]
}

function latestColumns(
  rangeText: (range: ReferenceRange) => string,
  valueText: (value: string | null) => string,
  withPrevious: boolean,
): DataTableColumn<LatestResult>[] {
  return [
    { id: 'test', header: 'Test', cell: (row) => row.test.name },
    {
      id: 'result',
      header: 'Result',
      align: 'end',
      numeric: true,
      cell: (row) => valueText(row.result.value),
    },
    { id: 'unit', header: 'Unit', cell: (row) => <Code>{row.test.unit}</Code> },
    {
      id: 'range',
      header: 'Reference range',
      numeric: true,
      cell: (row) => rangeText(row.test.range),
    },
    { id: 'verdict', header: 'Verdict', cell: (row) => badge(row.result.verdict, VERDICT_TONES) },
    ...(withPrevious
      ? [
          {
            id: 'previous',
            header: 'Previous',
            align: 'end' as const,
            numeric: true,
            cell: (row: LatestResult) =>
              row.previous === null ? null : (
                <span className="flex flex-col items-end">
                  <span>{valueText(row.previous.value)}</span>
                  <span className="text-xs text-tertiary">
                    <DateText value={row.previous.date} />
                  </span>
                </span>
              ),
          },
        ]
      : []),
  ]
}

function historyColumns(
  test: LabTest,
  rangeText: (range: ReferenceRange) => string,
  valueText: (value: string | null) => string,
): DataTableColumn<LabResult>[] {
  return [
    { id: 'date', header: 'Date', numeric: true, cell: (row) => <DateText value={row.date} /> },
    {
      id: 'result',
      header: `Result, ${test.unit}`,
      align: 'end',
      numeric: true,
      cell: (row) => valueText(row.value),
    },
    {
      id: 'range',
      header: 'Reference range',
      numeric: true,
      cell: () => rangeText(test.range),
    },
    { id: 'verdict', header: 'Verdict', cell: (row) => badge(row.verdict, VERDICT_TONES) },
  ]
}

// ── The side panels ───────────────────────────────────────────────────────────────────────────

function ChartPanels() {
  const { format, linkComponent: Link } = useLiro()
  const [open, setOpen] = useState<string[]>(['patient', 'allergies', 'next'])
  const next = VISITS[0]
  return (
    <SidePanels
      open={open}
      onOpenChange={setOpen}
      panels={[
        {
          key: 'patient',
          title: 'Patient',
          content: (
            <KeyValueList
              columns={1}
              items={[
                { label: 'Health insurance', value: <Code>{CHART_PATIENT.insurance}</Code> },
                {
                  label: 'Date of birth',
                  value: `${format.date(CHART_PATIENT.born)} (${CHART_PATIENT.age})`,
                  numeric: true,
                },
                { label: 'Phone', value: <Code>{CHART_PATIENT.phone}</Code>, numeric: true },
                { label: 'Address', value: CHART_PATIENT.address },
                { label: 'Chosen doctor', value: CHART_PATIENT.chosenDoctor },
              ]}
            />
          ),
        },
        {
          key: 'allergies',
          title: 'Allergies',
          count: CHART_PATIENT.allergies.length,
          content: (
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {CHART_PATIENT.allergies.map((each) => (
                <li key={each.id} className="flex flex-col items-start gap-1">
                  <StatusBadge label={each.label} tone="danger" />
                  <span className="bidi-content text-sm text-secondary">{each.reaction}</span>
                </li>
              ))}
            </ul>
          ),
        },
        ...(next === undefined
          ? []
          : [
              {
                key: 'next',
                title: 'Next appointment',
                content: (
                  <KeyValueList
                    columns={1}
                    items={[
                      {
                        label: 'When',
                        value: `${format.dateLong(next.start.slice(0, 10))} at ${format.time(next.start)}`,
                      },
                      { label: 'Visit', value: next.kind },
                      { label: 'Doctor', value: next.who },
                      {
                        label: 'Booked',
                        value: (
                          <Link href={`#${H_ROUTES.clinicSchedule}`} className={LINK}>
                            {next.note ?? next.state}
                          </Link>
                        ),
                      },
                    ]}
                  />
                ),
              },
            ]),
      ]}
    />
  )
}

// ── A visit in its drawer ─────────────────────────────────────────────────────────────────────

function VisitDrawer({
  visit,
  revealed,
  onReveal,
  onClose,
}: {
  visit: Visit
  revealed: Revealed
  onReveal: (key: string, shown: boolean) => void
  onClose: () => void
}) {
  const { format, linkComponent: Link } = useLiro()
  const when = useWhen()
  const finding = FINDINGS.find((each) => each.number === visit.findingId)
  const medicines = MEDICINES.filter((each) => visit.medicines?.includes(each.id) === true)
  return (
    <Drawer
      open
      side="end"
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
      title={`${visit.kind}, ${format.date(visit.start.slice(0, 10))}`}
      description={`${visit.who} · ${visit.place}`}
    >
      <KeyValueList
        columns={1}
        items={[
          { label: 'Date and time', value: when(visit.start), numeric: true },
          { label: 'State', value: badge(visit.state, VISIT_TONES) },
          ...(visit.note === undefined ? [] : [{ label: 'Note', value: visit.note }]),
          ...(finding === undefined
            ? []
            : [
                { label: 'Finding', value: <FindingNumber finding={finding} /> },
                {
                  label: 'Diagnosis',
                  value: (
                    <MaskedPart
                      finding={finding}
                      part="diagnosis"
                      revealed={revealed}
                      onChange={onReveal}
                    />
                  ),
                },
                {
                  label: 'Finding and advice',
                  value: (
                    <MaskedPart
                      finding={finding}
                      part="text"
                      revealed={revealed}
                      onChange={onReveal}
                    />
                  ),
                },
              ]),
          ...(medicines.length === 0
            ? []
            : [
                {
                  label: 'Medicines',
                  value: (
                    <ul className="m-0 flex list-none flex-col gap-1 p-0">
                      {medicines.map((each) => (
                        <li key={each.id} className="bidi-content">
                          {`${each.name} ${each.dose}: ${each.directions}`}
                        </li>
                      ))}
                    </ul>
                  ),
                },
              ]),
          ...(visit.labOrder === undefined
            ? []
            : [
                {
                  label: 'Laboratory order',
                  value:
                    visit.labOrder === LATEST_PANEL.order ? (
                      <Link href={`#${BM_ROUTES.lab}`} className={LINK}>
                        <Code>{visit.labOrder}</Code>
                      </Link>
                    ) : (
                      <Code>{visit.labOrder}</Code>
                    ),
                },
              ]),
        ]}
      />
    </Drawer>
  )
}

// ── The chart ─────────────────────────────────────────────────────────────────────────────────

function allergyStatus() {
  const first = CHART_PATIENT.allergies[0]
  return first === undefined ? undefined : (
    <StatusBadge label={`Allergy: ${first.label.toLowerCase()}`} tone="danger" />
  )
}

function useSubtitle() {
  const { format } = useLiro()
  return (
    <>
      {`Born ${format.date(CHART_PATIENT.born)} · ${CHART_PATIENT.age} · LBO `}
      <Code>{CHART_PATIENT.insurance.replace('LBO ', '')}</Code>
    </>
  )
}

export function PatientChart({
  phone,
  visit,
  shown = false,
}: {
  phone: boolean
  /** The visit open in the drawer when the page first shows (a page restored as it was left). */
  visit?: string
  /** Its diagnosis already shown after a reason. */
  shown?: boolean
}) {
  const { format } = useLiro()
  const navigate = useContext(Navigate)
  const when = useWhen()
  const rangeText = useRangeText()
  const valueText = useValueText()
  const subtitle = useSubtitle()
  const [open, setOpen] = useState<string | null>(visit ?? null)
  const opened = VISITS.find((each) => each.id === open)
  const firstFinding = VISITS.find((each) => each.id === visit)?.findingId
  const [revealed, setRevealed] = useState<Revealed>(
    shown && firstFinding !== undefined ? { [`${firstFinding}:diagnosis`]: true } : {},
  )
  const reveal = (key: string, value: boolean) => {
    setRevealed((current) => ({ ...current, [key]: value }))
  }
  const keyFigures: KeyFigure[] = [
    {
      key: 'next',
      label: 'Next appointment',
      value: `Today, ${format.time(VISITS[0]?.start ?? '')}`,
    },
    { key: 'medicines', label: 'Current medicines', value: CHART_FIGURES.currentMedicines },
    {
      key: 'results',
      label: `Results out of range, ${format.date(LATEST_PANEL.date)}`,
      value: `${LATEST_PANEL.outOfRange} of ${LATEST_PANEL.reported}`,
      tone: 'warning',
    },
  ]
  return (
    <ClinicShell phone={phone} tab="patients" crumb={CHART_PATIENT.name} today={BM_TODAY}>
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title={CHART_PATIENT.name}
        back={{ href: `#${H_ROUTES.doctorCalendar}`, label: 'Doctor’s calendar' }}
        {...(allergyStatus() === undefined ? {} : { status: allergyStatus() })}
        subtitle={subtitle}
        actions={
          <Button
            family="neutral"
            icon={FlaskConical}
            label="Lab results"
            emphasis="secondary"
            onClick={() => {
              navigate(BM_ROUTES.lab)
            }}
          />
        }
        // Phones: the visits first, nothing above them but the header.
        {...(phone ? {} : { keyFigures })}
        sectionBar={!phone}
        side={<ChartPanels />}
        sections={[
          {
            id: 'visits',
            label: 'Visits',
            description: 'Newest first. Choose a visit to see it.',
            flush: true,
            content: (
              <DataTable
                label={`Visits, ${CHART_PATIENT.name}`}
                inCard
                layout={phone ? 'cards' : 'table'}
                columns={visitColumns(when)}
                rows={VISITS}
                getRowId={(row) => row.id}
                getRowLabel={(row) => `${row.kind}, ${when(row.start)}`}
                onRowClick={(row) => {
                  setOpen(row.id)
                }}
                mobile={{
                  title: (row) => row.kind,
                  subtitle: (row) => `${when(row.start)} · ${row.who}`,
                  badge: (row) => badge(row.state, VISIT_TONES),
                  details: ['place', 'note'],
                }}
              />
            ),
          },
          {
            id: 'findings',
            label: 'Findings',
            description: 'Health data: shown only for a reason, and every look is logged.',
            flush: true,
            content: (
              <DataTable
                label={`Findings, ${CHART_PATIENT.name}`}
                inCard
                layout={phone ? 'cards' : 'table'}
                columns={findingColumns(revealed, reveal)}
                rows={FINDINGS}
                getRowId={(row) => row.number}
                getRowLabel={(row) => `Finding ${row.number}`}
                mobile={{
                  title: (row) => <FindingNumber finding={row} />,
                  subtitle: (row) => (
                    <>
                      <DateText value={row.date} /> · {row.who}
                    </>
                  ),
                  details: ['kind', 'diagnosis'],
                }}
              />
            ),
          },
          {
            id: 'medicines',
            label: 'Medicines',
            description: 'Current first, then the past ones.',
            flush: true,
            content: (
              <DataTable
                label={`Medicines, ${CHART_PATIENT.name}`}
                inCard
                layout={phone ? 'cards' : 'table'}
                columns={medicineColumns()}
                rows={MEDICINES}
                getRowId={(row) => row.id}
                getRowLabel={(row) => `${row.name} ${row.dose}`}
                mobile={{
                  title: (row) => `${row.name}, ${row.dose}`,
                  subtitle: (row) => row.directions,
                  badge: (row) => badge(row.state, MEDICINE_TONES),
                  details: ['from', 'until', 'who'],
                }}
              />
            ),
          },
          {
            id: 'results',
            label: 'Latest results',
            description: (
              <>
                {`Blood drawn ${format.date(LATEST_PANEL.date)} · `}
                <Code>{LATEST_PANEL.order}</Code>
                {` · ${LATEST_PANEL.outOfRange} of ${LATEST_PANEL.reported} reported results out of the laboratory’s range`}
              </>
            ),
            flush: true,
            actions: (
              <Button
                family="neutral"
                icon={FlaskConical}
                label="Results over time"
                emphasis="secondary"
                onClick={() => {
                  navigate(BM_ROUTES.lab)
                }}
              />
            ),
            content: (
              <DataTable
                label={`Latest results, ${CHART_PATIENT.name}`}
                inCard
                layout={phone ? 'cards' : 'table'}
                columns={latestColumns(rangeText, valueText, false)}
                rows={LATEST_RESULTS}
                getRowId={(row) => row.test.id}
                getRowLabel={(row) => row.test.name}
                onRowClick={(row) => {
                  navigate(BM_ROUTES.labOf(row.test.id))
                }}
                mobile={{
                  title: (row) => row.test.name,
                  badge: (row) => badge(row.result.verdict, VERDICT_TONES),
                  details: ['result', 'unit', 'range'],
                }}
              />
            ),
          },
        ]}
      />
      {opened !== undefined && (
        <VisitDrawer
          visit={opened}
          revealed={revealed}
          onReveal={reveal}
          onClose={() => {
            setOpen(null)
          }}
        />
      )}
    </ClinicShell>
  )
}

// ── Lab results over time ─────────────────────────────────────────────────────────────────────

export function LabResults({
  phone,
  test,
  loading = false,
}: {
  phone: boolean
  test: string
  loading?: boolean
}) {
  const { format } = useLiro()
  const rangeText = useRangeText()
  const valueText = useValueText()
  const subtitle = useSubtitle()
  const [chosen, setChosen] = useState(test)
  const shown = testOf(chosen)
  const results = resultsOf(shown.id)
  const { low, high } = shown.range
  // The laboratory's range is data: its limits are series of their own, grey beside the result.
  const series: ChartSeries[] = [
    { key: 'result', label: shown.name },
    ...(high === undefined
      ? []
      : [{ key: 'high', label: 'Upper limit', role: 'comparison' as const }]),
    ...(low === undefined ? [] : [{ key: 'low', label: 'Lower limit', role: 'other' as const }]),
  ]
  const values = {
    result: Object.fromEntries(results.map((each) => [each.date, each.value])),
    ...(high === undefined
      ? {}
      : { high: Object.fromEntries(results.map((each) => [each.date, high])) }),
    ...(low === undefined
      ? {}
      : { low: Object.fromEntries(results.map((each) => [each.date, low])) }),
  }
  const latest = [...results].reverse()
  return (
    <ClinicShell phone={phone} tab="patients" crumb="Lab results" today={BM_TODAY}>
      <DetailPage
        layout={phone ? 'phone' : 'desktop'}
        title="Lab results"
        back={{ href: `#${BM_ROUTES.chart}`, label: CHART_PATIENT.name }}
        subtitle={
          <>
            {`${CHART_PATIENT.name} · `}
            {subtitle}
          </>
        }
        sections={[
          {
            id: 'trend',
            label: 'Results over time',
            description: `The laboratory’s reference range: ${rangeText(shown.range)} ${shown.unit}`,
            content: (
              <div className="flex flex-col gap-4">
                <LineChart
                  title={`${shown.name}, ${shown.unit}`}
                  description={`${format.number(String(results.length))} results since ${format.date(results[0]?.date ?? LATEST_PANEL.date)}; the limits are the laboratory’s`}
                  // The axis names the month (a full date does not fit at the plot's ends); the
                  // tooltip, the table and "Show as table" give the day.
                  categories={results.map((each) => ({
                    key: each.date,
                    label: `${format.monthName(Number(each.date.slice(5, 7)), 'short')} ${each.date.slice(0, 4)}`,
                  }))}
                  tooltip={{ label: (category) => format.date(category.key) }}
                  series={series}
                  values={values}
                  height={phone ? 180 : 200}
                  layout={phone ? 'phone' : 'desktop'}
                  controls={
                    <SelectField
                      label="Test"
                      hideLabel
                      options={LAB_TESTS.map((each) => ({ value: each.id, label: each.name }))}
                      value={shown.id}
                      onChange={setChosen}
                    />
                  }
                  {...(loading ? { loading: true } : {})}
                />
                <DataTable
                  label={`${shown.name}, every result`}
                  layout={phone ? 'cards' : 'table'}
                  columns={historyColumns(shown, rangeText, valueText)}
                  rows={latest}
                  getRowId={(row) => row.id}
                  getRowLabel={(row) => `${shown.name}, ${format.date(row.date)}`}
                  loading={loading}
                  mobile={{
                    title: (row) => <DateText value={row.date} />,
                    badge: (row) => badge(row.verdict, VERDICT_TONES),
                    details: ['result', 'range'],
                  }}
                />
              </div>
            ),
          },
          {
            id: 'latest',
            label: 'Latest results',
            description: (
              <>
                {`Blood drawn ${format.date(LATEST_PANEL.date)} · `}
                <Code>{LATEST_PANEL.order}</Code>
                {` · ${LATEST_PANEL.laboratory}. Choose a test to see it over time.`}
              </>
            ),
            flush: true,
            content: (
              <DataTable
                label={`Latest results, ${CHART_PATIENT.name}`}
                inCard
                layout={phone ? 'cards' : 'table'}
                columns={latestColumns(rangeText, valueText, true)}
                rows={LATEST_RESULTS}
                getRowId={(row) => row.test.id}
                getRowLabel={(row) => row.test.name}
                loading={loading}
                onRowClick={(row) => {
                  setChosen(row.test.id)
                }}
                mobile={{
                  title: (row) => row.test.name,
                  badge: (row) => badge(row.result.verdict, VERDICT_TONES),
                  details: ['result', 'unit', 'range', 'previous'],
                }}
              />
            ),
          },
        ]}
      />
    </ClinicShell>
  )
}

// ── Routes ────────────────────────────────────────────────────────────────────────────────────

export const GROUP_BM_ROUTES: ExampleRoute[] = [
  { path: BM_ROUTES.chart, render: (phone) => <PatientChart phone={phone} /> },
  {
    path: BM_ROUTES.chartVisit,
    render: (phone) => <PatientChart phone={phone} visit="v-2026-08-02" />,
  },
  {
    path: BM_ROUTES.chartVisitShown,
    render: (phone) => <PatientChart phone={phone} visit="v-2026-08-02" shown />,
  },
  { path: BM_ROUTES.lab, render: (phone) => <LabResults phone={phone} test="glucose" /> },
  {
    path: BM_ROUTES.labLoading,
    render: (phone) => <LabResults phone={phone} test="glucose" loading />,
  },
  ...LAB_TESTS.map((each) => ({
    path: BM_ROUTES.labOf(each.id),
    render: (phone: boolean) => <LabResults phone={phone} test={each.id} />,
  })),
]
