/*
 * Group AL's example data (P5.45): Kvadrat Gradnja d.o.o.'s financial statements — the balance
 * sheet at 30.09.2026 beside 31.12.2025, the income statement for January–September 2026 beside
 * the same months of 2025, and their notes. The trial balance is the ledger's (data-AK.ts). The
 * positions, their codes and the notes are illustrative, in the shape of the Serbian forms, never
 * the official form; every figure is the Core's, written here as decimal strings (the totals
 * worked out with the books' arithmetic and checked below). Not part of the package. No classes
 * here.
 */
import { paras, sumUnits } from '../../../../packages/ui/src/components/amounts-story-data'

export const AL_ROUTES = {
  trial: '/accounting/trial-balance',
  /** The trial balance compared with the same day of 2025. */
  trialCompare: '/accounting/trial-balance?compare',
  balanceSheet: '/accounting/statements/balance-sheet',
  /** The balance sheet with note 8 open. */
  balanceSheetNote: '/accounting/statements/balance-sheet?note=8',
  incomeStatement: '/accounting/statements/income-statement',
}

/** One position of a statement: its code, its words, its note, this year and the year before. */
export interface StatementLine {
  code: string
  label: string
  /** The note that explains it ("8"). */
  note?: string
  current: string
  previous: string
  /** A result line (a sum of the lines above it): semibold under a line. */
  total?: boolean
}

/** A lettered part of a statement ("A. Non-current assets"). */
export interface StatementGroup {
  key: string
  number: string
  title: string
  lines: readonly StatementLine[]
}

/** A statement's side ("Assets"): its groups and its final line. */
export interface StatementPart {
  key: string
  title: string
  groups: readonly StatementGroup[]
  total: StatementLine
}

function line(
  code: string,
  label: string,
  current: string,
  previous: string,
  note?: string,
): StatementLine {
  return { code, label, current, previous, ...(note === undefined ? {} : { note }) }
}

function total(code: string, label: string, current: string, previous: string): StatementLine {
  return { code, label, current, previous, total: true }
}

// ── The balance sheet at 30.09.2026 ───────────────────────────────────────────────────────────

export const BALANCE_SHEET: readonly StatementPart[] = [
  {
    key: 'assets',
    title: 'Assets',
    groups: [
      {
        key: 'A',
        number: 'A.',
        title: 'Non-current assets',
        lines: [
          line('0010', 'Property, plant and equipment', '74390400.00', '67274400.00', '5'),
          line('0030', 'Long-term financial investments', '1200000.00', '1200000.00', '6'),
          total('0002', 'Non-current assets', '75590400.00', '68474400.00'),
        ],
      },
      {
        key: 'B',
        number: 'B.',
        title: 'Current assets',
        lines: [
          line('0044', 'Inventories', '4982990.40', '7457190.40', '7'),
          line('0050', 'Receivables from sales', '8766760.25', '10162820.35', '8'),
          line('0060', 'Other receivables', '3200.00', '0.00'),
          line('0068', 'Cash and cash equivalents', '23154350.79', '7048436.25', '9'),
          total('0043', 'Current assets', '36907301.44', '24668447.00'),
        ],
      },
    ],
    total: total('0071', 'Total assets', '112497701.44', '93142847.00'),
  },
  {
    key: 'liabilities',
    title: 'Equity and liabilities',
    groups: [
      {
        key: 'C',
        number: 'A.',
        title: 'Equity',
        lines: [
          line('0402', 'Share capital', '20000000.00', '20000000.00', '10'),
          line('0415', 'Retained earnings of previous years', '57903873.70', '44152306.12'),
          line('0419', 'Profit of the current year', '17110294.44', '13751567.58', '11'),
          total('0401', 'Equity', '95014168.14', '77903873.70'),
        ],
      },
      {
        key: 'D',
        number: 'B.',
        title: 'Liabilities',
        lines: [
          line('0443', 'Advances received', '1360000.00', '1850000.00'),
          line('0444', 'Suppliers', '10745261.30', '8381781.30', '12'),
          line('0450', 'Salaries payable', '3534502.00', '3534502.00'),
          line('0457', 'VAT payable', '1843770.00', '1472690.00'),
          total('0442', 'Liabilities', '17483533.30', '15238973.30'),
        ],
      },
    ],
    total: total('0464', 'Total equity and liabilities', '112497701.44', '93142847.00'),
  },
]

// ── The income statement, January–September ──────────────────────────────────────────────────

export const INCOME_STATEMENT: readonly StatementPart[] = [
  {
    key: 'operating',
    title: 'Operating revenue and expenses',
    groups: [
      {
        key: 'A',
        number: 'A.',
        title: 'Operating revenue',
        lines: [
          line('1002', 'Revenue from sales of goods', '32107996.40', '27021716.00', '13'),
          line(
            '1009',
            'Revenue from services, domestic market',
            '50312666.67',
            '41465158.00',
            '13',
          ),
          line('1010', 'Revenue from services, foreign market', '6842150.00', '5884249.00', '13'),
          total('1001', 'Operating revenue', '89262813.07', '74371123.00'),
        ],
      },
      {
        key: 'B',
        number: 'B.',
        title: 'Operating expenses',
        lines: [
          line('1023', 'Costs of material and energy', '32892100.00', '29113486.00'),
          line('1024', 'Salary costs', '31810518.00', '27342519.00', '14'),
          line('1025', 'Depreciation', '2367000.00', '2035620.00', '5'),
          line('1026', 'Production services', '4818000.00', '4143480.00'),
          line('1027', 'Non-production costs', '287040.63', '241488.54'),
          total('1018', 'Operating expenses', '72174658.63', '62876593.54'),
        ],
      },
    ],
    total: total('1030', 'Operating profit', '17088154.44', '11494529.46'),
  },
  {
    key: 'financial',
    title: 'Financial revenue and expenses',
    groups: [
      {
        key: 'C',
        number: 'C.',
        title: 'Financial result',
        lines: [
          line('1032', 'Financial revenue', '31040.00', '26694.40'),
          line('1040', 'Financial expenses', '8900.00', '7654.00'),
        ],
      },
    ],
    total: total('1048', 'Financial profit', '22140.00', '19040.40'),
  },
  {
    key: 'result',
    title: 'Result',
    groups: [],
    total: total('1055', 'Profit for the period', '17110294.44', '11513569.86'),
  },
]

// ── The notes ─────────────────────────────────────────────────────────────────────────────────

/** A note to the statements: its words and, where it has them, its figures. */
export interface StatementNote {
  number: string
  title: string
  text: string
  figures?: readonly { key: string; label: string; current: string; previous: string }[]
}

export const NOTES: readonly StatementNote[] = [
  {
    number: '5',
    title: 'Property, plant and equipment',
    text: 'Stated at cost less accumulated depreciation. A tower crane bought in March 2026 for site Liman 4 is the main addition. Depreciation is straight-line, at the illustrative rates of the asset groups.',
    figures: [
      {
        key: 'buildings',
        label: 'Office building, Novi Sad',
        current: '48600000.00',
        previous: '48600000.00',
      },
      {
        key: 'machinery',
        label: 'Construction machinery',
        current: '38670000.00',
        previous: '31250000.00',
      },
      { key: 'vehicles', label: 'Vehicles', current: '9840000.00', previous: '9840000.00' },
      {
        key: 'depreciation',
        label: 'Accumulated depreciation',
        current: '-22719600.00',
        previous: '-22415600.00',
      },
    ],
  },
  {
    number: '6',
    title: 'Long-term financial investments',
    text: 'A 10% share in Kvadrat Nekretnine d.o.o., Novi Sad, stated at cost.',
  },
  {
    number: '7',
    title: 'Inventories',
    text: 'Material in the Central warehouse and on Site Liman 4, at weighted average cost. The count of 30.09.2026 found no differences above the illustrative threshold.',
    figures: [
      {
        key: 'central',
        label: 'Material, Central warehouse',
        current: '3575510.40',
        previous: '6284310.40',
      },
      {
        key: 'site',
        label: 'Material, Site Liman 4',
        current: '1407480.00',
        previous: '1172880.00',
      },
    ],
  },
  {
    number: '8',
    title: 'Receivables from sales',
    text: 'Receivables from customers in the country and abroad, less the advances deducted. Gradska toplana Novi Sad and Stanogradnja Plus d.o.o. hold 61% of them. No receivable is older than 90 days; late-payment interest is charged from the due date.',
    figures: [
      {
        key: 'domestic',
        label: 'Customers in the country',
        current: '7584910.25',
        previous: '8914220.35',
      },
      { key: 'abroad', label: 'Customers abroad', current: '1181850.00', previous: '1248600.00' },
    ],
  },
  {
    number: '9',
    title: 'Cash and cash equivalents',
    text: 'Current accounts with Banca Intesa and Raiffeisen banka, the foreign-currency accounts at the illustrative NBS middle rate of the day, and the main cash desk.',
  },
  {
    number: '10',
    title: 'Share capital',
    text: 'Paid in full, registered with the business register. One member holds 100%.',
  },
  {
    number: '11',
    title: 'Profit of the current year',
    text: 'The profit before income tax for January–September 2026. Income tax is worked out at the end of the year.',
  },
  {
    number: '12',
    title: 'Suppliers',
    text: 'Suppliers in the country and abroad. Beton Mix d.o.o. and Elektro Sistem d.o.o. are the largest; every statement of open items of 30.09.2026 has been sent.',
  },
  {
    number: '13',
    title: 'Revenue',
    text: 'Revenue from construction works (by stage of completion, on interim situations), from sales of building materials and from works abroad for Donau Bau GmbH.',
  },
  {
    number: '14',
    title: 'Salary costs',
    text: 'Gross salaries of 46 employees with the employer’s contributions.',
  },
]

export function noteByNumber(number: string): StatementNote | undefined {
  return NOTES.find((each) => each.number === number)
}

// ── The books' arithmetic, checked ────────────────────────────────────────────────────────────

function fail(message: string): never {
  throw new Error(`Example statements: ${message}`)
}

function check(
  lines: readonly StatementLine[],
  result: StatementLine,
  year: 'current' | 'previous',
) {
  const sum = sumUnits(lines.map((each) => paras(each[year])))
  if (sum !== paras(result[year])) fail(`${result.code} is not the sum of its lines (${year})`)
}

for (const part of [...BALANCE_SHEET, ...INCOME_STATEMENT]) {
  for (const group of part.groups) {
    const result = group.lines.find((each) => each.total === true)
    if (result === undefined) continue
    const lines = group.lines.filter((each) => each.total !== true)
    check(lines, result, 'current')
    check(lines, result, 'previous')
  }
}

for (const year of ['current', 'previous'] as const) {
  const [assets, liabilities] = BALANCE_SHEET
  if (assets === undefined || liabilities === undefined) fail('the balance sheet is incomplete')
  if (assets.total[year] !== liabilities.total[year])
    fail(`the balance sheet does not balance (${year})`)
}
