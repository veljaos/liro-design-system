/*
 * Group BM's example data (P5.72, the patient chart): Jovana Nikolić's chart at Ambulanta Liman of
 * Dom zdravlja Novi Sad (group H), seen on Wednesday 14.10.2026 at 09:40, two hours before the
 * check-up she booked in the patient portal. Her visits (the emergency department of 02.08.2026
 * among them, with dr Jelena Popović of the department's team in group G), her findings (diagnosis
 * and text are health data: masked until a reason is given, P5.14), her medicines, her laboratory
 * results with the laboratory's reference ranges and verdicts, and their history for the trend.
 * Every verdict, tone, count and range is the application's; the screens only show them.
 * Fictitious people and results; the reference ranges are illustrative.
 */
import type { Tone } from '@veljaos/ui'
import { CLINIC, FINDING, PATIENT, PATIENT_PHONE } from './data-H'

const CHART = '/clinic/patients/jovana-nikolic/chart'
const LAB = '/clinic/patients/jovana-nikolic/lab'

export const BM_ROUTES = {
  chart: CHART,
  /** The chart with the emergency visit of 02.08.2026 open in its drawer. */
  chartVisit: `${CHART}?visit=v-2026-08-02`,
  /** The same visit with its diagnosis shown after a reason (the application passed it). */
  chartVisitShown: `${CHART}?visit=v-2026-08-02&reveal=shown`,
  lab: LAB,
  /** The results with one test's trend chosen (a press on a result in the chart). */
  labOf: (test: string) => `${LAB}?test=${test}`,
  /** The results while the application loads them. */
  labLoading: `${LAB}?state=loading`,
  /** Group H's finding page (the one finding with a page of its own). */
  finding: `/clinic/patients/jovana-nikolic/findings/${FINDING.number}`,
}

/** The examples' clock in the clinic (group H): the day of Jovana's check-up. */
export const BM_TODAY = CLINIC.day

// ── The patient ───────────────────────────────────────────────────────────────────────────────

export const CHART_PATIENT = {
  ...PATIENT,
  /** The application's words for her age on the day. */
  age: '47 years',
  phone: PATIENT_PHONE,
  address: 'Bulevar cara Lazara 41, Novi Sad',
  chosenDoctor: 'dr Marko Stanković',
  /** Recorded allergies: not masked, every clinician must see them. */
  allergies: [{ id: 'penicillin', label: 'Penicillin', reaction: 'Rash, 2014' }],
}

// ── Visits ────────────────────────────────────────────────────────────────────────────────────

export interface Visit {
  id: string
  /** YYYY-MM-DDTHH:mm, local. */
  start: string
  kind: string
  who: string
  place: string
  /** The application's state ("Booked", "Done", "Results ready"). */
  state: string
  /** Not health data: how the visit came about. */
  note?: string
  findingId?: string
  /** The laboratory order of a blood draw. */
  labOrder?: string
  /** The medicines started or given at the visit (ids of MEDICINES). */
  medicines?: readonly string[]
}

/** Her visits, newest first. */
export const VISITS: readonly Visit[] = [
  {
    id: 'v-2026-10-14',
    start: '2026-10-14T11:30',
    kind: 'Check-up',
    who: 'dr Marko Stanković',
    place: CLINIC.name,
    state: 'Booked',
    note: 'Booked online in the patient portal',
  },
  {
    id: 'v-2026-10-08',
    start: '2026-10-08T07:30',
    kind: 'Blood draw',
    who: 'Laboratory',
    place: CLINIC.name,
    state: 'Results ready',
    note: 'Ordered at the check-up of 14.09.2026.',
    labOrder: 'LAB-2026-11872',
  },
  {
    id: 'v-2026-09-14',
    start: '2026-09-14T09:00',
    kind: 'Check-up',
    who: 'dr Marko Stanković',
    place: CLINIC.name,
    state: 'Done',
    note: 'Control after the emergency visit',
    findingId: FINDING.number,
    medicines: ['amlodipine'],
  },
  {
    id: 'v-2026-08-02',
    start: '2026-08-02T22:15',
    kind: 'Emergency',
    who: 'dr Jelena Popović',
    place: 'Emergency department',
    state: 'Done',
    note: 'Came in by herself',
    findingId: 'IZ-2026-02988',
    labOrder: 'LAB-2026-08310',
    medicines: ['captopril'],
  },
  {
    id: 'v-2026-03-10',
    start: '2026-03-10T08:00',
    kind: 'Check-up',
    who: 'dr Vesna Lukić',
    place: CLINIC.name,
    state: 'Done',
    note: 'Instead of the chosen doctor (annual leave)',
    findingId: 'IZ-2026-00981',
    labOrder: 'LAB-2026-02417',
    medicines: ['azithromycin', 'paracetamol'],
  },
  {
    id: 'v-2025-11-20',
    start: '2025-11-20T07:30',
    kind: 'Blood draw',
    who: 'Laboratory',
    place: CLINIC.name,
    state: 'Done',
    note: 'Preventive check-up',
    labOrder: 'LAB-2025-21904',
  },
  {
    id: 'v-2025-11-18',
    start: '2025-11-18T10:30',
    kind: 'Preventive check-up',
    who: 'dr Marko Stanković',
    place: CLINIC.name,
    state: 'Done',
    findingId: 'IZ-2025-04102',
  },
  {
    id: 'v-2025-05-15',
    start: '2025-05-15T07:30',
    kind: 'Blood draw',
    who: 'Laboratory',
    place: CLINIC.name,
    state: 'Done',
    note: 'Control of blood sugar and fats',
    labOrder: 'LAB-2025-09125',
  },
  {
    id: 'v-2024-11-14',
    start: '2024-11-14T07:30',
    kind: 'Blood draw',
    who: 'Laboratory',
    place: CLINIC.name,
    state: 'Done',
    note: 'Preventive check-up',
    labOrder: 'LAB-2024-20517',
  },
]

/** The application's visit states and their tones. */
export const VISIT_TONES: Readonly<Record<string, Tone>> = {
  Booked: 'info',
  Done: 'neutral',
  'Results ready': 'success',
}

// ── Findings ──────────────────────────────────────────────────────────────────────────────────

export interface ChartFinding {
  number: string
  date: string
  who: string
  kind: string
  /** Health data: passed to MaskedValue only after a reason. */
  diagnosis: string
  text: string
  /** The finding's own page, where the application has one. */
  page?: string
}

/** Her findings, newest first; the first is group H's IZ-2026-03417. */
export const FINDINGS: readonly ChartFinding[] = [
  {
    number: FINDING.number,
    date: FINDING.date,
    who: FINDING.doctor,
    kind: FINDING.kind,
    diagnosis: FINDING.diagnosis,
    text: FINDING.text,
    page: BM_ROUTES.finding,
  },
  {
    number: 'IZ-2026-02988',
    date: '2026-08-02',
    who: 'dr Jelena Popović',
    kind: 'Emergency department',
    diagnosis: 'R03.0 Elevated blood-pressure reading, without diagnosis of hypertension',
    text: 'Headache since the afternoon, blood pressure 175/105 mmHg. Captopril 25 mg given; 150/95 mmHg after an hour. Sent home; a check-up with the chosen doctor and blood tests.',
  },
  {
    number: 'IZ-2026-00981',
    date: '2026-03-10',
    who: 'dr Vesna Lukić',
    kind: 'Check-up, general practice',
    diagnosis: 'J02.9 Acute pharyngitis, unspecified',
    text: 'Sore throat and 38,2 °C for two days. Allergic to penicillin: azithromycin for three days, paracetamol when needed; back if not better in five days.',
  },
  {
    number: 'IZ-2025-04102',
    date: '2025-11-18',
    who: 'dr Marko Stanković',
    kind: 'Preventive check-up',
    diagnosis: 'Z00.0 General medical examination',
    text: 'No complaints. Blood pressure 135/85 mmHg. Blood tests for the preventive check-up ordered; a control of blood sugar in a year.',
  },
]

// ── Medicines ─────────────────────────────────────────────────────────────────────────────────

export interface Medicine {
  id: string
  name: string
  /** The dose and the form, as prescribed. */
  dose: string
  /** How it is taken, in the prescriber's words. */
  directions: string
  from: string
  /** Null while it is taken with no end date. */
  until: string | null
  who: string
  /** The application's state. */
  state: string
  note?: string
}

/** Current first, then the past ones, newest first. */
export const MEDICINES: readonly Medicine[] = [
  {
    id: 'amlodipine',
    name: 'Amlodipine',
    dose: '5 mg, tablet',
    directions: '1 tablet every morning',
    from: '2026-09-14',
    until: null,
    who: 'dr Marko Stanković',
    state: 'Current',
    note: 'Repeat prescription until 13.12.2026.',
  },
  {
    id: 'captopril',
    name: 'Captopril',
    dose: '25 mg, tablet',
    directions: '1 tablet once, in the department',
    from: '2026-08-02',
    until: '2026-08-02',
    who: 'dr Jelena Popović',
    state: 'Given once',
  },
  {
    id: 'azithromycin',
    name: 'Azithromycin',
    dose: '500 mg, tablet',
    directions: '1 tablet a day for 3 days',
    from: '2026-03-10',
    until: '2026-03-12',
    who: 'dr Vesna Lukić',
    state: 'Ended',
  },
  {
    id: 'paracetamol',
    name: 'Paracetamol',
    dose: '500 mg, tablet',
    directions: '1 tablet up to 3 times a day, when needed',
    from: '2026-03-10',
    until: '2026-03-17',
    who: 'dr Vesna Lukić',
    state: 'Ended',
  },
]

export const MEDICINE_TONES: Readonly<Record<string, Tone>> = {
  Current: 'success',
  Ended: 'neutral',
  'Given once': 'neutral',
}

// ── Laboratory ────────────────────────────────────────────────────────────────────────────────

/** A reference range from the laboratory: either end may be missing ("< 5,2"). */
export interface ReferenceRange {
  low?: string
  high?: string
}

export interface LabTest {
  id: string
  name: string
  unit: string
  /** The laboratory's range for this test (illustrative). */
  range: ReferenceRange
}

export interface LabResult {
  id: string
  testId: string
  date: string
  /** A decimal string; null while the laboratory has not reported it. */
  value: string | null
  /** The laboratory's verdict in words. */
  verdict: string
}

/** The laboratory's verdicts and their tones (the application's, never worked out here). */
export const VERDICT_TONES: Readonly<Record<string, Tone>> = {
  'In range': 'neutral',
  'Above range': 'warning',
  'Below range': 'warning',
  'Waiting for the laboratory': 'info',
}

export const LAB_TESTS: readonly LabTest[] = [
  { id: 'glucose', name: 'Glucose, fasting', unit: 'mmol/L', range: { low: '3.9', high: '6.1' } },
  { id: 'hba1c', name: 'HbA1c', unit: '%', range: { low: '4.0', high: '6.0' } },
  { id: 'cholesterol', name: 'Cholesterol, total', unit: 'mmol/L', range: { high: '5.2' } },
  { id: 'ldl', name: 'LDL cholesterol', unit: 'mmol/L', range: { high: '3.0' } },
  { id: 'hdl', name: 'HDL cholesterol', unit: 'mmol/L', range: { low: '1.2' } },
  { id: 'triglycerides', name: 'Triglycerides', unit: 'mmol/L', range: { high: '1.7' } },
  { id: 'creatinine', name: 'Creatinine', unit: 'µmol/L', range: { low: '49', high: '90' } },
  { id: 'potassium', name: 'Potassium', unit: 'mmol/L', range: { low: '3.5', high: '5.1' } },
  { id: 'hemoglobin', name: 'Haemoglobin', unit: 'g/L', range: { low: '120', high: '150' } },
  { id: 'leukocytes', name: 'Leukocytes', unit: '×10⁹/L', range: { low: '4.0', high: '10.0' } },
  { id: 'vitaminD', name: 'Vitamin D (25-OH)', unit: 'nmol/L', range: { low: '75', high: '250' } },
]

const IN = 'In range'
const ABOVE = 'Above range'

/** Every result, by test, oldest first: [date, value, verdict]. */
const HISTORY: Readonly<Record<string, readonly (readonly [string, string | null, string])[]>> = {
  glucose: [
    ['2024-11-14', '5.4', IN],
    ['2025-05-15', '5.7', IN],
    ['2025-11-20', '5.8', IN],
    ['2026-10-08', '6.4', ABOVE],
  ],
  hba1c: [
    ['2025-11-20', '5.7', IN],
    ['2026-10-08', '5.9', IN],
  ],
  cholesterol: [
    ['2024-11-14', '5.1', IN],
    ['2025-05-15', '5.4', ABOVE],
    ['2025-11-20', '5.5', ABOVE],
    ['2026-10-08', '5.8', ABOVE],
  ],
  ldl: [
    ['2024-11-14', '2.9', IN],
    ['2025-05-15', '3.1', ABOVE],
    ['2025-11-20', '3.2', ABOVE],
    ['2026-10-08', '3.4', ABOVE],
  ],
  hdl: [
    ['2024-11-14', '1.5', IN],
    ['2025-11-20', '1.4', IN],
    ['2026-10-08', '1.4', IN],
  ],
  triglycerides: [
    ['2024-11-14', '1.3', IN],
    ['2025-11-20', '1.5', IN],
    ['2026-10-08', '1.6', IN],
  ],
  creatinine: [
    ['2024-11-14', '72', IN],
    ['2025-11-20', '75', IN],
    ['2026-08-02', '81', IN],
    ['2026-10-08', '78', IN],
  ],
  potassium: [
    ['2024-11-14', '4.4', IN],
    ['2025-11-20', '4.1', IN],
    ['2026-08-02', '3.9', IN],
    ['2026-10-08', '4.3', IN],
  ],
  hemoglobin: [
    ['2024-11-14', '135', IN],
    ['2025-11-20', '131', IN],
    ['2026-03-10', '128', IN],
    ['2026-08-02', '134', IN],
    ['2026-10-08', '132', IN],
  ],
  leukocytes: [
    ['2024-11-14', '6.2', IN],
    ['2025-11-20', '5.9', IN],
    ['2026-03-10', '11.2', ABOVE],
    ['2026-08-02', '7.4', IN],
    ['2026-10-08', '6.8', IN],
  ],
  vitaminD: [['2026-10-08', null, 'Waiting for the laboratory']],
}

/** A test's results, oldest first. */
export function resultsOf(testId: string): readonly LabResult[] {
  return (HISTORY[testId] ?? []).map(([date, value, verdict]) => ({
    id: `${testId}-${date}`,
    testId,
    date,
    value,
    verdict,
  }))
}

/** The latest laboratory order: blood drawn 08.10.2026 at 07:30, released 09.10.2026. */
export const LATEST_PANEL = {
  order: 'LAB-2026-11872',
  date: '2026-10-08',
  released: '2026-10-09T12:10',
  laboratory: `Laboratory, ${CLINIC.name}`,
  /** The application's counts. */
  outOfRange: '3',
  reported: '10',
  total: '11',
}

/** One row of the latest results: the result and the one before it (the application's). */
export interface LatestResult {
  test: LabTest
  result: LabResult
  previous: LabResult | null
}

export const LATEST_RESULTS: readonly LatestResult[] = LAB_TESTS.map((test) => {
  const results = resultsOf(test.id)
  const latest = results.find((each) => each.date === LATEST_PANEL.date)
  return {
    test,
    result: latest ?? {
      id: `${test.id}-${LATEST_PANEL.date}`,
      testId: test.id,
      date: LATEST_PANEL.date,
      value: null,
      verdict: 'Waiting for the laboratory',
    },
    previous: [...results].reverse().find((each) => each.date < LATEST_PANEL.date) ?? null,
  }
})

/** The application's counts for the chart's key figures. */
export const CHART_FIGURES = {
  currentMedicines: '1',
  lastVisit: '2026-10-08',
}
