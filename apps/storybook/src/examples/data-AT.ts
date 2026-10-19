/*
 * Group AT's example data (P5.61, service and author contracts): Kvadrat Gradnja d.o.o. on 14
 * October 2026, its payroll kept by Knjigovodstvo Jelić. A new author contract for Dragana Vasić
 * (the show flat's interior, Residential building Liman 4) and the September 2026 run of five
 * contracts. Every figure of a calculation — gross, normed costs, tax base, tax, the pension and
 * health contributions, net — is the application's, for the amount, the kind and the normed costs'
 * share it was given (D4): the screens never compute. A gross-up from a net amount is the
 * application's too. The rates (tax 20 %, pension 25,5 %, health 10,3 %) and the normed costs'
 * shares are illustrative; every person, number and amount is invented. Not part of the package.
 * No classes here.
 */
import type { Tone } from '@veljaos/ui'

export const AT_TODAY = '2026-10-14'

export const AT_ROUTES = {
  /** A new author contract, filled in. */
  newContract: '/hr/contracts/service/new',
  /** The same with the amount agreed as net: the application's gross-up. */
  newContractNet: '/hr/contracts/service/new?basis=net',
  run: '/hr/contracts/service/run/2026-09',
} as const

export type ContractKind = 'author' | 'service'
export type AmountBasis = 'gross' | 'net'

export const KIND_LABELS: Record<ContractKind, string> = {
  author: 'Author contract',
  service: 'Service contract',
}

/** The normed costs' shares by kind (illustrative), as the application offers them. */
export const NORMED_SHARES: Record<ContractKind, { value: string; label: string }[]> = {
  author: [
    { value: '43', label: '43% — author’s work' },
    { value: '50', label: '50% — fine art, photography, design' },
  ],
  service: [{ value: '20', label: '20% — contract for services' }],
}

/** The rates the calculation uses (illustrative), in the application's words. */
export const RATES = {
  tax: '20',
  pension: '25.5',
  health: '10.3',
  validFrom: '2026-01-01',
}

/** The people the company contracts (the application's register of contractors). */
export const CONTRACTORS = [
  { value: 'vasic', label: 'Dragana Vasić', description: 'Architect, Novi Sad' },
  { value: 'radovic', label: 'Ivan Radović', description: 'Land surveyor, Sremska Kamenica' },
  { value: 'tosic', label: 'Mila Tošić', description: 'Translator, Novi Sad' },
  { value: 'kecman', label: 'Bojan Kecman', description: 'Photographer, Novi Sad' },
  { value: 'peric', label: 'Jovan Perić', description: 'Safety trainer, Zrenjanin' },
]

export const PROJECTS = [
  { value: '310', label: '310 Residential building Liman 4' },
  { value: '320', label: '320 Bulevar Evrope 24' },
  { value: '330', label: '330 Hall B extension' },
  { value: '100', label: '100 Administration' },
]

/** The new contract as the form opens it. */
export const NEW_CONTRACT = {
  number: 'UG-2026-025',
  person: 'vasic',
  kind: 'author' as ContractKind,
  work: 'Interior design of the show flat, Residential building Liman 4: plans, finishes and furniture list.',
  start: '2026-10-15',
  end: '2026-11-30',
  project: '310',
  basis: 'gross' as AmountBasis,
  amount: '150000.00',
  share: '43',
}

/** One calculation, as the application returns it. */
export interface Calculation {
  gross: string
  normed: string
  base: string
  tax: string
  pension: string
  health: string
  contributions: string
  net: string
}

/**
 * The application's calculations for the new contract's amount (150.000,00 RSD), by kind, normed
 * costs' share and basis ("author|43|gross"). For another amount the application calculates when
 * the draft is saved.
 */
export const CALCULATED_AMOUNT = '150000.00'

export const CALCULATIONS: Record<string, Calculation> = {
  'author|43|gross': {
    gross: '150000.00',
    normed: '64500.00',
    base: '85500.00',
    tax: '17100.00',
    pension: '21802.50',
    health: '8806.50',
    contributions: '30609.00',
    net: '102291.00',
  },
  'author|50|gross': {
    gross: '150000.00',
    normed: '75000.00',
    base: '75000.00',
    tax: '15000.00',
    pension: '19125.00',
    health: '7725.00',
    contributions: '26850.00',
    net: '108150.00',
  },
  'service|20|gross': {
    gross: '150000.00',
    normed: '30000.00',
    base: '120000.00',
    tax: '24000.00',
    pension: '30600.00',
    health: '12360.00',
    contributions: '42960.00',
    net: '83040.00',
  },
  'author|43|net': {
    gross: '219960.70',
    normed: '94583.10',
    base: '125377.60',
    tax: '25075.52',
    pension: '31971.29',
    health: '12913.89',
    contributions: '44885.18',
    net: '150000.00',
  },
  'author|50|net': {
    gross: '208044.39',
    normed: '104022.20',
    base: '104022.19',
    tax: '20804.44',
    pension: '26525.66',
    health: '10714.29',
    contributions: '37239.95',
    net: '150000.00',
  },
  'service|20|net': {
    gross: '270953.76',
    normed: '54190.75',
    base: '216763.01',
    tax: '43352.60',
    pension: '55274.57',
    health: '22326.59',
    contributions: '77601.16',
    net: '150000.00',
  },
}

export function calculationKey(kind: ContractKind, share: string, basis: AmountBasis): string {
  return `${kind}|${share}|${basis}`
}

// ── The September 2026 run ────────────────────────────────────────────────────────────────────

export const RUN_PERIOD = 'September 2026'

export const RUN_STEPS = [
  { key: 'prepare', label: 'Prepare', description: 'Work reports' },
  { key: 'calculate', label: 'Calculate' },
  { key: 'review', label: 'Review' },
  { key: 'post', label: 'Post and pay' },
] as const

export interface RunContract extends Calculation {
  number: string
  person: string
  kind: ContractKind
  share: string
  work: string
  /** The payment's state in the application's words. */
  payment: 'Ready' | 'Held'
}

export const PAYMENT_TONES: Record<RunContract['payment'], Tone> = {
  Ready: 'success',
  Held: 'warning',
}

export const RUN_CONTRACTS: readonly RunContract[] = [
  {
    number: 'UG-2026-019',
    person: 'Mila Tošić',
    kind: 'service',
    share: '20',
    work: 'Translation of the tower crane’s manual',
    payment: 'Held',
    gross: '36000.00',
    normed: '7200.00',
    base: '28800.00',
    tax: '5760.00',
    pension: '7344.00',
    health: '2966.40',
    contributions: '10310.40',
    net: '19929.60',
  },
  {
    number: 'UG-2026-020',
    person: 'Ivan Radović',
    kind: 'service',
    share: '20',
    work: 'Site survey, Hall B extension',
    payment: 'Ready',
    gross: '96000.00',
    normed: '19200.00',
    base: '76800.00',
    tax: '15360.00',
    pension: '19584.00',
    health: '7910.40',
    contributions: '27494.40',
    net: '53145.60',
  },
  {
    number: 'UG-2026-021',
    person: 'Dragana Vasić',
    kind: 'author',
    share: '43',
    work: 'Facade design, Residential building Liman 4',
    payment: 'Ready',
    gross: '150000.00',
    normed: '64500.00',
    base: '85500.00',
    tax: '17100.00',
    pension: '21802.50',
    health: '8806.50',
    contributions: '30609.00',
    net: '102291.00',
  },
  {
    number: 'UG-2026-023',
    person: 'Bojan Kecman',
    kind: 'author',
    share: '50',
    work: 'Photographs of the finished works, Bulevar Evrope 24',
    payment: 'Ready',
    gross: '60000.00',
    normed: '30000.00',
    base: '30000.00',
    tax: '6000.00',
    pension: '7650.00',
    health: '3090.00',
    contributions: '10740.00',
    net: '43260.00',
  },
  {
    number: 'UG-2026-024',
    person: 'Jovan Perić',
    kind: 'service',
    share: '20',
    work: 'Safety training for the crews',
    payment: 'Ready',
    gross: '120000.00',
    normed: '24000.00',
    base: '96000.00',
    tax: '19200.00',
    pension: '24480.00',
    health: '9888.00',
    contributions: '34368.00',
    net: '66432.00',
  },
]

/** The run's totals (the application's). */
export const RUN_TOTALS = {
  contracts: '5',
  gross: '462000.00',
  normed: '144900.00',
  base: '317100.00',
  tax: '63420.00',
  pension: '80860.50',
  health: '32661.30',
  contributions: '113521.80',
  net: '285058.20',
  /** The tax return the run prepares. */
  taxReturn: 'PPP-PD 2026-09-112',
}

export const RERUN_REASONS = [
  { value: 'report', label: 'A work report was corrected' },
  { value: 'amount', label: 'A contract’s amount was changed' },
  { value: 'rates', label: 'The rates were updated' },
]
