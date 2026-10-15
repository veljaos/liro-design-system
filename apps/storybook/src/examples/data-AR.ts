/*
 * Group AR's example data (P5.58, budget and cost centres): Kvadrat Gradnja d.o.o.'s budget 2026
 * (version 2, approved 15.01.2026) against the books for January–September 2026, on 14 October
 * 2026. By cost centre — administration, sales, the three sites under construction, the machinery
 * pool — and by project — Residential building Liman 4, Bulevar Evrope 24, Hall B extension — each
 * by cost type (material, labour, subcontractors, machinery and fuel). Every figure is the
 * application's: the plan for the nine months, the actual, the variance (actual less plan, signed),
 * the share used and the state in the application's words (over budget above 100 %, under budget
 * below 95 %, within budget between) — decimal strings, never computed by the screens (D4). The
 * drill-down shows each line's latest entries with the application's count of all of them. The
 * accounts follow the illustrative chart of accounts; every name, number and amount is invented.
 * Not part of the package. No classes here.
 */
import type { Tone } from '@veljaos/ui'
import { AP_ROUTES } from './data-AP'

export const AR_TODAY = '2026-10-14'

export type BudgetView = 'centres' | 'projects'

export const AR_ROUTES = {
  budget: '/accounting/budget',
  /** The same, by project. */
  projects: '/accounting/budget?by=projects',
  /** Liman 4's material chosen in the projects' tree: "Show entries" can be used. */
  projectsChosen: '/accounting/budget?by=projects&line=p310-5120',
  entries: (line: string) => `/accounting/budget/entries/${line}`,
} as const

export const BUDGET = {
  name: 'Budget 2026',
  version: 'Version 2, approved 15.01.2026',
  period: 'January–September 2026',
  plan: '252300000.00',
  actual: '255345000.00',
  variance: '3045000.00',
  used: '101.2',
  /** The year's plan, all twelve months. */
  yearPlan: '338400000.00',
}

export type BudgetState = 'Over budget' | 'Within budget' | 'Under budget'

export const BUDGET_TONES: Record<BudgetState, Tone> = {
  'Over budget': 'danger',
  'Within budget': 'success',
  'Under budget': 'neutral',
}

/** One line of the budget: a cost centre, a project or a cost type. */
export interface BudgetLine {
  id: string
  code: string
  name: string
  plan: string
  actual: string
  /** Actual less plan, signed. */
  variance: string
  /** Actual as a percentage of plan. */
  used: string
  state: BudgetState
  /** How many entries make the actual (the application's count). */
  entryCount: string
  children?: readonly BudgetLine[]
}

const line = (
  id: string,
  code: string,
  name: string,
  plan: string,
  actual: string,
  variance: string,
  used: string,
  state: BudgetState,
  entryCount: string,
  children?: readonly BudgetLine[],
): BudgetLine => ({
  id,
  code,
  name,
  plan,
  actual,
  variance,
  used,
  state,
  entryCount,
  ...(children === undefined ? {} : { children }),
})

export const BY_CENTRE: readonly BudgetLine[] = [
  line(
    'c100',
    '100',
    'Administration',
    '18000000.00',
    '17240000.00',
    '-760000.00',
    '95.8',
    'Within budget',
    '412',
  ),
  line(
    'c200',
    '200',
    'Sales',
    '6300000.00',
    '6905000.00',
    '605000.00',
    '109.6',
    'Over budget',
    '138',
  ),
  line(
    'c300',
    '300',
    'Construction',
    '218100000.00',
    '221440000.00',
    '3340000.00',
    '101.5',
    'Over budget',
    '1294',
    [
      line(
        'c310',
        '310',
        'Residential building Liman 4',
        '132000000.00',
        '141380000.00',
        '9380000.00',
        '107.1',
        'Over budget',
        '618',
      ),
      line(
        'c320',
        '320',
        'Bulevar Evrope 24',
        '64500000.00',
        '58920000.00',
        '-5580000.00',
        '91.3',
        'Under budget',
        '471',
      ),
      line(
        'c330',
        '330',
        'Hall B extension',
        '21600000.00',
        '21140000.00',
        '-460000.00',
        '97.9',
        'Within budget',
        '205',
      ),
    ],
  ),
  line(
    'c400',
    '400',
    'Machinery pool',
    '9900000.00',
    '9760000.00',
    '-140000.00',
    '98.6',
    'Within budget',
    '264',
  ),
]

const material = '5120'
const labour = '5200'
const subcontractors = '5330'
const machinery = '5130'

export const BY_PROJECT: readonly BudgetLine[] = [
  line(
    'p310',
    '310',
    'Residential building Liman 4',
    '132000000.00',
    '141380000.00',
    '9380000.00',
    '107.1',
    'Over budget',
    '618',
    [
      line(
        'p310-5120',
        material,
        'Material',
        '58000000.00',
        '64820000.00',
        '6820000.00',
        '111.8',
        'Over budget',
        '236',
      ),
      line(
        'p310-5200',
        labour,
        'Labour',
        '36000000.00',
        '35410000.00',
        '-590000.00',
        '98.4',
        'Within budget',
        '27',
      ),
      line(
        'p310-5330',
        subcontractors,
        'Subcontractors',
        '28000000.00',
        '30150000.00',
        '2150000.00',
        '107.7',
        'Over budget',
        '84',
      ),
      line(
        'p310-5130',
        machinery,
        'Machinery and fuel',
        '10000000.00',
        '11000000.00',
        '1000000.00',
        '110.0',
        'Over budget',
        '271',
      ),
    ],
  ),
  line(
    'p320',
    '320',
    'Bulevar Evrope 24',
    '64500000.00',
    '58920000.00',
    '-5580000.00',
    '91.3',
    'Under budget',
    '471',
    [
      line(
        'p320-5120',
        material,
        'Material',
        '29000000.00',
        '25840000.00',
        '-3160000.00',
        '89.1',
        'Under budget',
        '182',
      ),
      line(
        'p320-5200',
        labour,
        'Labour',
        '18500000.00',
        '17960000.00',
        '-540000.00',
        '97.1',
        'Within budget',
        '27',
      ),
      line(
        'p320-5330',
        subcontractors,
        'Subcontractors',
        '12000000.00',
        '10620000.00',
        '-1380000.00',
        '88.5',
        'Under budget',
        '59',
      ),
      line(
        'p320-5130',
        machinery,
        'Machinery and fuel',
        '5000000.00',
        '4500000.00',
        '-500000.00',
        '90.0',
        'Under budget',
        '203',
      ),
    ],
  ),
  line(
    'p330',
    '330',
    'Hall B extension',
    '21600000.00',
    '21140000.00',
    '-460000.00',
    '97.9',
    'Within budget',
    '205',
    [
      line(
        'p330-5120',
        material,
        'Material',
        '9600000.00',
        '9850000.00',
        '250000.00',
        '102.6',
        'Over budget',
        '88',
      ),
      line(
        'p330-5200',
        labour,
        'Labour',
        '6400000.00',
        '6120000.00',
        '-280000.00',
        '95.6',
        'Within budget',
        '18',
      ),
      line(
        'p330-5330',
        subcontractors,
        'Subcontractors',
        '4000000.00',
        '3750000.00',
        '-250000.00',
        '93.8',
        'Under budget',
        '21',
      ),
      line(
        'p330-5130',
        machinery,
        'Machinery and fuel',
        '1600000.00',
        '1420000.00',
        '-180000.00',
        '88.8',
        'Under budget',
        '78',
      ),
    ],
  ),
]

/** The projects' totals, the construction centre's (the application's). */
export const PROJECTS_TOTAL = {
  plan: '218100000.00',
  actual: '221440000.00',
  variance: '3340000.00',
  used: '101.5',
}

// ── The charts' values (the same figures, by chart category) ──────────────────────────────────

export const CENTRE_CHART = {
  categories: [
    { key: 'c100', label: 'Administration' },
    { key: 'c200', label: 'Sales' },
    { key: 'c310', label: 'Liman 4' },
    { key: 'c320', label: 'Bulevar Evrope 24' },
    { key: 'c330', label: 'Hall B extension' },
    { key: 'c400', label: 'Machinery pool' },
  ],
  values: {
    plan: {
      c100: '18000000.00',
      c200: '6300000.00',
      c310: '132000000.00',
      c320: '64500000.00',
      c330: '21600000.00',
      c400: '9900000.00',
    },
    actual: {
      c100: '17240000.00',
      c200: '6905000.00',
      c310: '141380000.00',
      c320: '58920000.00',
      c330: '21140000.00',
      c400: '9760000.00',
    },
  },
}

export const PROJECT_CHART = {
  categories: [
    { key: 'material', label: 'Material' },
    { key: 'labour', label: 'Labour' },
    { key: 'subcontractors', label: 'Subcontractors' },
    { key: 'machinery', label: 'Machinery and fuel' },
  ],
  /** Residential building Liman 4, by cost type. */
  values: {
    plan: {
      material: '58000000.00',
      labour: '36000000.00',
      subcontractors: '28000000.00',
      machinery: '10000000.00',
    },
    actual: {
      material: '64820000.00',
      labour: '35410000.00',
      subcontractors: '30150000.00',
      machinery: '11000000.00',
    },
  },
}

// ── The entries behind a line: its latest, from the books ─────────────────────────────────────

export interface BudgetEntry {
  id: string
  date: string
  /** The document's kind and number ("Supplier invoice UF-2026-1162"). */
  document: string
  /** Its page, when the examples have one. */
  href?: string
  partner: string
  account: string
  text: string
  amount: string
}

let entryId = 0
const e = (
  date: string,
  document: string,
  partner: string,
  account: string,
  text: string,
  amount: string,
  href?: string,
): BudgetEntry => {
  entryId += 1
  return {
    id: `e${String(entryId)}`,
    date,
    document,
    partner,
    account,
    text,
    amount,
    ...(href === undefined ? {} : { href }),
  }
}

/** The latest entries of each cost-type line and of the centres without projects. */
export const ENTRIES: Record<string, readonly BudgetEntry[]> = {
  'p310-5120': [
    e(
      '2026-09-29',
      'Supplier invoice UF-2026-1172',
      'Beton Mix d.o.o.',
      '5120',
      'Ready-mix concrete C30/37, 62 m³',
      '512400.00',
    ),
    e(
      '2026-09-24',
      'Supplier invoice UF-2026-1158',
      'Armatura Plus d.o.o.',
      '5120',
      'Reinforcing steel B500B, 18 t',
      '1638000.00',
    ),
    e(
      '2026-09-18',
      'Supplier invoice UF-2026-1141',
      'Beton Mix d.o.o.',
      '5120',
      'Ready-mix concrete C25/30, 44 m³',
      '338800.00',
    ),
  ],
  'p310-5200': [
    e(
      '2026-09-30',
      'Payroll August 2026',
      'Crews Ilić, Petrović, Jovanović',
      '5200',
      'Gross wages, site Liman 4',
      '3912000.00',
    ),
    e(
      '2026-08-31',
      'Payroll July 2026',
      'Crews Ilić, Petrović, Jovanović',
      '5200',
      'Gross wages, site Liman 4',
      '3874500.00',
    ),
    e(
      '2026-07-31',
      'Payroll June 2026',
      'Crews Ilić, Petrović, Jovanović',
      '5200',
      'Gross wages, site Liman 4',
      '3851000.00',
    ),
  ],
  'p310-5330': [
    e(
      '2026-09-26',
      'Supplier invoice UF-2026-1165',
      'Elektro Sistem d.o.o.',
      '5330',
      'Electrical installation, floors 1–2',
      '2460000.00',
    ),
    e(
      '2026-09-15',
      'Supplier invoice UF-2026-1137',
      'Novosadske fasade d.o.o.',
      '5330',
      'Facade insulation, south side',
      '1985000.00',
    ),
    e(
      '2026-09-03',
      'Supplier invoice UF-2026-1109',
      'Hidro Montaža d.o.o.',
      '5330',
      'Plumbing risers, floors 1–4',
      '1240000.00',
    ),
  ],
  'p310-5130': [
    e(
      '2026-09-30',
      'Depreciation August 2026',
      'OS-0142 Mini excavator 3.5 t',
      '5400',
      'Monthly depreciation',
      '57000.00',
      `#${AP_ROUTES.asset('OS-0142')}`,
    ),
    e(
      '2026-09-30',
      'Depreciation August 2026',
      'OS-0118 Tower crane Liebherr 81 K',
      '5400',
      'Monthly depreciation',
      '118333.33',
      `#${AP_ROUTES.asset('OS-0118')}`,
    ),
    e(
      '2026-09-22',
      'Supplier invoice UF-2026-1152',
      'Petrol Bačka d.o.o.',
      '5130',
      'Diesel, 1.840 l',
      '366160.00',
    ),
  ],
  'p320-5120': [
    e(
      '2026-09-28',
      'Supplier invoice UF-2026-1169',
      'Beton Mix d.o.o.',
      '5120',
      'Ready-mix concrete C30/37, 38 m³',
      '314000.00',
    ),
    e(
      '2026-09-21',
      'Supplier invoice UF-2026-1149',
      'Ciglana Kikinda d.o.o.',
      '5120',
      'Clay blocks 25 cm, 9.600 pcs',
      '806400.00',
    ),
    e(
      '2026-09-08',
      'Supplier invoice UF-2026-1118',
      'Armatura Plus d.o.o.',
      '5120',
      'Reinforcing mesh Q188, 140 pcs',
      '471800.00',
    ),
  ],
  'p320-5200': [
    e(
      '2026-09-30',
      'Payroll August 2026',
      'Crew Marković',
      '5200',
      'Gross wages, site Bulevar Evrope 24',
      '2014000.00',
    ),
    e(
      '2026-08-31',
      'Payroll July 2026',
      'Crew Marković',
      '5200',
      'Gross wages, site Bulevar Evrope 24',
      '1996500.00',
    ),
    e(
      '2026-07-31',
      'Payroll June 2026',
      'Crew Marković',
      '5200',
      'Gross wages, site Bulevar Evrope 24',
      '1988000.00',
    ),
  ],
  'p320-5330': [
    e(
      '2026-09-25',
      'Supplier invoice UF-2026-1163',
      'Krovovi Bačka d.o.o.',
      '5330',
      'Roof waterproofing, first half',
      '1320000.00',
    ),
    e(
      '2026-09-10',
      'Supplier invoice UF-2026-1124',
      'Elektro Sistem d.o.o.',
      '5330',
      'Temporary site power',
      '186000.00',
    ),
    e(
      '2026-08-27',
      'Supplier invoice UF-2026-1087',
      'Skele Sistem d.o.o.',
      '5330',
      'Scaffolding rent, August',
      '264000.00',
    ),
  ],
  'p320-5130': [
    e(
      '2026-09-30',
      'Depreciation August 2026',
      'OS-0133 Pickup Toyota Hilux NS-911-LM',
      '5400',
      'Monthly depreciation',
      '53750.00',
      `#${AP_ROUTES.asset('OS-0133')}`,
    ),
    e(
      '2026-09-19',
      'Supplier invoice UF-2026-1147',
      'Petrol Bačka d.o.o.',
      '5130',
      'Diesel, 620 l',
      '123380.00',
    ),
    e(
      '2026-09-04',
      'Supplier invoice UF-2026-1112',
      'Mehanizacija Bačka d.o.o.',
      '5130',
      'Excavator rent, 3 days',
      '144000.00',
    ),
  ],
  'p330-5120': [
    e(
      '2026-09-27',
      'Supplier invoice UF-2026-1167',
      'Čelik Konstrukcije d.o.o.',
      '5120',
      'Steel profiles HEA 200, 6,4 t',
      '892800.00',
    ),
    e(
      '2026-09-16',
      'Supplier invoice UF-2026-1139',
      'Beton Mix d.o.o.',
      '5120',
      'Ready-mix concrete C25/30, 21 m³',
      '161700.00',
    ),
    e(
      '2026-09-02',
      'Supplier invoice UF-2026-1104',
      'Panel Izolacije d.o.o.',
      '5120',
      'Sandwich panels 100 mm, 420 m²',
      '1134000.00',
    ),
  ],
  'p330-5200': [
    e(
      '2026-09-30',
      'Payroll August 2026',
      'Crew Babić',
      '5200',
      'Gross wages, site Hall B extension',
      '702000.00',
    ),
    e(
      '2026-08-31',
      'Payroll July 2026',
      'Crew Babić',
      '5200',
      'Gross wages, site Hall B extension',
      '698500.00',
    ),
    e(
      '2026-07-31',
      'Payroll June 2026',
      'Crew Babić',
      '5200',
      'Gross wages, site Hall B extension',
      '691000.00',
    ),
  ],
  'p330-5330': [
    e(
      '2026-09-23',
      'Service contract UG-2026-017',
      'Ivan Radović',
      '5330',
      'Site survey, first stage',
      '96000.00',
    ),
    e(
      '2026-09-12',
      'Supplier invoice UF-2026-1129',
      'Elektro Sistem d.o.o.',
      '5330',
      'Lighting of the hall',
      '418000.00',
    ),
    e(
      '2026-08-29',
      'Supplier invoice UF-2026-1091',
      'Hidro Montaža d.o.o.',
      '5330',
      'Drainage, east side',
      '237500.00',
    ),
  ],
  'p330-5130': [
    e(
      '2026-09-30',
      'Depreciation August 2026',
      'OS-0146 Generator set 60 kVA',
      '5400',
      'Monthly depreciation',
      '16000.00',
      `#${AP_ROUTES.asset('OS-0146')}`,
    ),
    e(
      '2026-09-20',
      'Supplier invoice UF-2026-1148',
      'Petrol Bačka d.o.o.',
      '5130',
      'Diesel for the generator, 410 l',
      '81590.00',
    ),
    e(
      '2026-09-06',
      'Supplier invoice UF-2026-1115',
      'Kranovi Bačka d.o.o.',
      '5130',
      'Mobile crane, 1 day',
      '96000.00',
    ),
  ],
  c100: [
    e(
      '2026-09-30',
      'Depreciation August 2026',
      'OS-0012 Office floor, Bulevar oslobođenja 102',
      '5400',
      'Monthly depreciation',
      '101250.00',
      `#${AP_ROUTES.asset('OS-0012')}`,
    ),
    e(
      '2026-09-29',
      'Supplier invoice UF-2026-1186',
      'Telekom Srbija a.d.',
      '5310',
      'Telephone and internet, September',
      '12873.40',
    ),
    e(
      '2026-09-25',
      'Travel settlement PN-2026-041',
      'Milica Petrović',
      '5290',
      'Seminar, Beograd',
      '8640.00',
    ),
  ],
  c200: [
    e(
      '2026-09-28',
      'Supplier invoice UF-2026-1170',
      'Reklam Studio d.o.o.',
      '5500',
      'Brochure of Residential building Liman 4',
      '186000.00',
    ),
    e(
      '2026-09-17',
      'Supplier invoice UF-2026-1143',
      'Sajam Gradnje d.o.o.',
      '5500',
      'Stand at the building fair',
      '420000.00',
    ),
    e(
      '2026-09-09',
      'Supplier invoice UF-2026-1121',
      'Oglasi Online d.o.o.',
      '5500',
      'Online advertising, August',
      '64800.00',
    ),
  ],
  c400: [
    e(
      '2026-09-30',
      'Depreciation August 2026',
      'OS-0047 Savijačica armature Sima CEL-32',
      '5400',
      'Monthly depreciation',
      '4132.06',
      `#${AP_ROUTES.asset('OS-0047')}`,
    ),
    e(
      '2026-09-24',
      'Supplier invoice UF-2026-1157',
      'Servis Mašina d.o.o.',
      '5130',
      'Service of the rebar bender',
      '48600.00',
    ),
    e(
      '2026-09-11',
      'Supplier invoice UF-2026-1126',
      'Petrol Bačka d.o.o.',
      '5130',
      'Diesel for the pool, 300 l',
      '59700.00',
    ),
  ],
}

/** Every line of both trees, by id. */
function allLines(lines: readonly BudgetLine[]): BudgetLine[] {
  return lines.flatMap((each) => [each, ...allLines(each.children ?? [])])
}

export const BUDGET_LINES: readonly BudgetLine[] = [...allLines(BY_CENTRE), ...allLines(BY_PROJECT)]

export function budgetLine(id: string): BudgetLine | undefined {
  return BUDGET_LINES.find((each) => each.id === id)
}

/** A site's cost centre is its project: its entries are the project's. */
const CENTRE_PROJECT: Record<string, string> = { c310: 'p310', c320: 'p320', c330: 'p330' }

/**
 * The latest entries of a line, newest first: a cost-type line's own, a branch's from the lines
 * under it (the application's list; the screens only show it).
 */
export function entriesOf(id: string): BudgetEntry[] {
  const own = ENTRIES[id]
  if (own !== undefined) return [...own]
  const source = budgetLine(CENTRE_PROJECT[id] ?? id)
  const under = (source?.children ?? []).flatMap((child) => entriesOf(child.id))
  return under.sort((a, b) => b.date.localeCompare(a.date))
}
