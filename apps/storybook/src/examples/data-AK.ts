/*
 * Group AK's example data (P5.44): Kvadrat Gradnja d.o.o.'s general ledger on 14 October 2026,
 * behind the trial balance (screens-AL.tsx) — the chart of accounts (illustrative, in the shape of
 * the Serbian chart: classes 0–9, groups, synthetic and analytic accounts), the opening balances of
 * 01.01.2026, the turnover of January–August as the books' summary, and every posting from
 * 1 September to 14 October: September's invoices of the invoice list (examples-story-data.ts),
 * bank statement 188 as worked line by line (data-bank.ts; its line 10 is left for later, so not
 * posted), the cancellation ST-2026-0004 and the decrease KO-2026-0009, journal entry NK-2026-0912
 * (data-F.ts), and the cash desk's slips of 12–14 October.
 *
 * The data plays the Core: the trial balance is worked out here in whole paras, the way the Core
 * would, and checked (a disagreement throws, so every story fails instead of showing books that do
 * not balance). The screens and the components only show the decimal strings (D4). Every account,
 * figure and document is invented. Not part of the package. No classes here.
 */
import { decimal, paras, sumUnits } from '../../../../packages/ui/src/components/amounts-story-data'

// ── Facts and routes ──────────────────────────────────────────────────────────────────────────

/** The ledger's day: the examples' today in Phase 5's last batch. */
export const LEDGER_TODAY = '2026-10-14'

export const AK_ROUTES = {
  /** An account's card, which the trial balance's figures link to. */
  card: (code: string) => `/accounting/accounts/${code}/card`,
}

// ── The chart of accounts ─────────────────────────────────────────────────────────────────────

export type AccountKind =
  | 'Asset'
  | 'Contra asset'
  | 'Equity'
  | 'Liability'
  | 'Expense'
  | 'Revenue'
  | 'Closing'
  | 'Off-balance'

export type NormalSide = 'Debit' | 'Credit'

/** An analytic account: what the Core knows about it. */
export interface LedgerAccount {
  code: string
  name: string
  kind: AccountKind
  side: NormalSide
  /** The analytics every posting must carry ("Partner", "Cost centre"). */
  analytics: readonly string[]
  /** The tax category linked to the account, in the Core's words. */
  taxCategory?: string
  /** A foreign-currency account's currency. */
  currency?: string
  /** An account that cannot be posted to any more, and why. */
  inactive?: string
}

/** A level above the accounts: a class (1 digit), a group (2) or a synthetic account (3). */
export interface ChartLevel {
  code: string
  name: string
  /** A class that is not kept, and why. */
  notKept?: string
  children: readonly (ChartLevel | LedgerAccount)[]
}

function account(
  code: string,
  name: string,
  kind: AccountKind,
  side: NormalSide,
  analytics: readonly string[] = [],
  extra: Partial<Pick<LedgerAccount, 'taxCategory' | 'currency' | 'inactive'>> = {},
): LedgerAccount {
  return { code, name, kind, side, analytics, ...extra }
}

function level(code: string, name: string, children: ChartLevel['children']): ChartLevel {
  return { code, name, children }
}

const PARTNER = 'Partner'
const EMPLOYEE = 'Employee'
const COST_CENTRE = 'Cost centre'
const PROJECT = 'Project'

/** The illustrative chart: classes 0–9, as the Core keeps it for Kvadrat Gradnja d.o.o. */
export const CHART: readonly ChartLevel[] = [
  level('0', 'Non-current assets', [
    level('02', 'Property, plant and equipment', [
      level('022', 'Buildings', [
        account('0220', 'Office building, Novi Sad', 'Asset', 'Debit', [COST_CENTRE]),
      ]),
      level('023', 'Plant and equipment', [
        account('0230', 'Construction machinery', 'Asset', 'Debit', [COST_CENTRE]),
        account('0231', 'Vehicles', 'Asset', 'Debit', [COST_CENTRE]),
      ]),
      level('029', 'Value adjustment of property, plant and equipment', [
        account('0290', 'Accumulated depreciation', 'Contra asset', 'Credit', [COST_CENTRE]),
      ]),
    ]),
  ]),
  level('1', 'Inventories', [
    level('10', 'Material', [
      level('101', 'Material in warehouses', [
        account('1010', 'Material, Central warehouse', 'Asset', 'Debit'),
        account('1011', 'Material, Site Liman 4', 'Asset', 'Debit', [PROJECT]),
      ]),
    ]),
  ]),
  level('2', 'Short-term receivables, investments and cash', [
    level('20', 'Receivables from sales', [
      level('204', 'Customers in the country', [
        account('2040', 'Customers in the country', 'Asset', 'Debit', [PARTNER]),
      ]),
      level('205', 'Customers abroad', [
        account('2050', 'Customers abroad', 'Asset', 'Debit', [PARTNER], { currency: 'EUR' }),
      ]),
    ]),
    level('22', 'Other short-term receivables', [
      level('221', 'Receivables from employees', [
        account('2210', 'Travel advances to employees', 'Asset', 'Debit', [EMPLOYEE]),
      ]),
    ]),
    level('24', 'Cash and cash equivalents', [
      level('241', 'Current accounts', [
        account('2410', 'Current account, Banca Intesa', 'Asset', 'Debit'),
        account('2411', 'Current account, Raiffeisen banka', 'Asset', 'Debit'),
        account('2412', 'Current account, Komercijalna banka', 'Asset', 'Debit', [], {
          inactive: 'Inactive: the account was closed on 30.06.2025.',
        }),
      ]),
      level('243', 'Cash desk', [account('2430', 'Main cash desk', 'Asset', 'Debit')]),
      level('244', 'Foreign-currency accounts', [
        account('2440', 'FX account EUR, Banca Intesa', 'Asset', 'Debit', [], {
          currency: 'EUR',
        }),
        account('2441', 'FX account EUR, Raiffeisen banka', 'Asset', 'Debit', [], {
          currency: 'EUR',
        }),
        account('2442', 'FX account USD, Banca Intesa', 'Asset', 'Debit', [], {
          currency: 'USD',
        }),
      ]),
    ]),
    level('27', 'Value added tax', [
      level('270', 'Input VAT', [
        account('2700', 'Input VAT, general rate 20%', 'Asset', 'Debit', [PARTNER], {
          taxCategory: 'Input VAT, general rate 20% (illustrative)',
        }),
      ]),
    ]),
  ]),
  level('3', 'Equity', [
    level('30', 'Share capital', [
      level('302', 'Share capital of a limited liability company', [
        account('3020', 'Share capital', 'Equity', 'Credit'),
      ]),
    ]),
    level('34', 'Retained earnings', [
      level('341', 'Retained earnings of previous years', [
        account('3410', 'Retained earnings of previous years', 'Equity', 'Credit'),
      ]),
    ]),
  ]),
  level('4', 'Provisions and liabilities', [
    level('43', 'Operating liabilities', [
      level('430', 'Advances received', [
        account('4300', 'Advances received', 'Liability', 'Credit', [PARTNER]),
      ]),
      level('435', 'Suppliers in the country', [
        account('4350', 'Suppliers in the country', 'Liability', 'Credit', [PARTNER]),
      ]),
      level('436', 'Suppliers abroad', [
        account('4360', 'Suppliers abroad', 'Liability', 'Credit', [PARTNER], {
          currency: 'EUR',
        }),
      ]),
    ]),
    level('45', 'Salaries payable', [
      level('450', 'Net salaries payable', [
        account('4500', 'Net salaries payable', 'Liability', 'Credit', [EMPLOYEE]),
      ]),
      level('451', 'Taxes and contributions on salaries', [
        account('4510', 'Taxes and contributions on salaries', 'Liability', 'Credit'),
      ]),
    ]),
    level('47', 'VAT payable', [
      level('470', 'Output VAT', [
        account('4700', 'Output VAT, general rate 20%', 'Liability', 'Credit', [PARTNER], {
          taxCategory: 'Taxable supply, general rate 20% (illustrative)',
        }),
      ]),
    ]),
  ]),
  level('5', 'Expenses', [
    level('51', 'Costs of material and energy', [
      level('512', 'Costs of material', [
        account('5120', 'Construction materials', 'Expense', 'Debit', [COST_CENTRE, PROJECT]),
      ]),
      level('513', 'Costs of fuel and energy', [
        account('5130', 'Fuel and energy', 'Expense', 'Debit', [COST_CENTRE]),
      ]),
    ]),
    level('52', 'Salary costs', [
      level('520', 'Gross salaries', [
        account('5200', 'Gross salaries', 'Expense', 'Debit', [COST_CENTRE]),
      ]),
    ]),
    level('53', 'Production services', [
      level('533', 'Rental costs', [
        account('5330', 'Equipment rental', 'Expense', 'Debit', [COST_CENTRE, PROJECT]),
      ]),
    ]),
    level('54', 'Depreciation and provisions', [
      level('540', 'Depreciation', [
        account('5400', 'Depreciation', 'Expense', 'Debit', [COST_CENTRE]),
      ]),
    ]),
    level('55', 'Non-production costs', [
      level('553', 'Costs of payment services', [
        account('5530', 'Bank charges', 'Expense', 'Debit'),
      ]),
      level('559', 'Other non-production costs', [
        account('5590', 'Other non-production costs', 'Expense', 'Debit', [COST_CENTRE]),
      ]),
    ]),
    level('56', 'Financial expenses', [
      level('563', 'Negative exchange differences', [
        account('5630', 'Negative exchange differences', 'Expense', 'Debit', [PARTNER]),
      ]),
    ]),
  ]),
  level('6', 'Revenue', [
    level('60', 'Revenue from sales of goods', [
      level('604', 'Sales of goods, domestic market', [
        account('6040', 'Revenue from sales of goods, domestic market', 'Revenue', 'Credit', [], {
          taxCategory: 'Taxable supply, general rate 20% (illustrative)',
        }),
      ]),
    ]),
    level('61', 'Revenue from products and services', [
      level('614', 'Services, domestic market', [
        account('6140', 'Revenue from services, domestic market', 'Revenue', 'Credit', [PROJECT], {
          taxCategory: 'Taxable supply, general rate 20% (illustrative)',
        }),
      ]),
      level('615', 'Services, foreign market', [
        account('6150', 'Revenue from services, foreign market', 'Revenue', 'Credit', [PARTNER], {
          taxCategory: 'Exempt with the right to deduct (illustrative)',
        }),
      ]),
    ]),
    level('66', 'Financial revenue', [
      level('662', 'Interest income', [
        account('6620', 'Interest income', 'Revenue', 'Credit', [PARTNER]),
      ]),
      level('663', 'Positive exchange differences', [
        account('6630', 'Positive exchange differences', 'Revenue', 'Credit', [PARTNER]),
      ]),
    ]),
  ]),
  level('7', 'Opening and closing of accounts', [
    level('72', 'Profit and loss', [
      level('720', 'Profit and loss account', [
        account('7200', 'Profit and loss account', 'Closing', 'Credit'),
      ]),
    ]),
  ]),
  level('8', 'Off-balance-sheet records', [
    level('88', 'Off-balance-sheet assets', [
      level('880', 'Assets received for use', [
        account('8800', 'Machinery received for use', 'Off-balance', 'Debit', [PARTNER]),
      ]),
    ]),
    level('89', 'Off-balance-sheet liabilities', [
      level('890', 'Liabilities for assets received', [
        account('8900', 'Liabilities for machinery received', 'Off-balance', 'Credit', [PARTNER]),
      ]),
    ]),
  ]),
  {
    code: '9',
    name: 'Cost accounting',
    notKept: 'Not kept: Kvadrat Gradnja d.o.o. follows costs by cost centre and project.',
    children: [],
  },
]

export function isAccount(item: ChartLevel | LedgerAccount): item is LedgerAccount {
  return 'kind' in item
}

function accountsOf(levels: readonly (ChartLevel | LedgerAccount)[]): LedgerAccount[] {
  return levels.flatMap((item) => (isAccount(item) ? [item] : accountsOf(item.children)))
}

/** Every analytic account, in the chart's order. */
export const ACCOUNTS: readonly LedgerAccount[] = accountsOf(CHART)

export function accountByCode(code: string): LedgerAccount {
  const found = ACCOUNTS.find((each) => each.code === code)
  if (found === undefined) throw new Error(`Example ledger: account ${code} is missing`)
  return found
}

/** The levels above an account, outermost first (class, group, synthetic account). */
export function accountPath(code: string): ChartLevel[] {
  const walk = (
    levels: readonly (ChartLevel | LedgerAccount)[],
    path: ChartLevel[],
  ): ChartLevel[] | null => {
    for (const item of levels) {
      if (isAccount(item)) {
        if (item.code === code) return path
      } else {
        const found = walk(item.children, [...path, item])
        if (found !== null) return found
      }
    }
    return null
  }
  return walk(CHART, []) ?? []
}

// ── The books: opening, January–August, the postings since September ─────────────────────────

/** The opening balances of 01.01.2026: debit positive, credit negative. */
const OPENING: Readonly<Record<string, string>> = {
  '0220': '48600000.00',
  '0230': '31250000.00',
  '0231': '9840000.00',
  '0290': '-22415600.00',
  '1010': '6284310.40',
  '1011': '1172880.00',
  '2040': '8914220.35',
  '2050': '1248600.00',
  '2410': '4120775.30',
  '2411': '1350400.00',
  '2430': '46120.00',
  '2440': '2412690.20',
  '2442': '318450.75',
  '3020': '-20000000.00',
  '3410': '-57903873.70',
  '4300': '-1850000.00',
  '4350': '-7413560.90',
  '4360': '-968220.40',
  '4500': '-2208000.00',
  '4510': '-1326502.00',
  '4700': '-1472690.00',
}

/** January–August 2026 as the books' summary: debit account, credit account, amount. */
const JANUARY_TO_AUGUST: readonly (readonly [string, string, string])[] = [
  ['2040', '6040', '31420600.00'],
  ['2040', '4700', '6284120.00'],
  ['2040', '6140', '48215300.00'],
  ['2040', '4700', '9643060.00'],
  ['2050', '6150', '6842150.00'],
  ['2410', '2040', '95161030.10'],
  ['2440', '2050', '6912400.00'],
  ['2410', '4300', '2400000.00'],
  ['4300', '2040', '2950000.00'],
  ['1010', '4350', '28410500.00'],
  ['2700', '4350', '5682100.00'],
  ['5120', '1010', '27904300.00'],
  ['1011', '1010', '3215000.00'],
  ['5120', '1011', '2980400.00'],
  ['5330', '4350', '4818000.00'],
  ['2700', '4350', '963600.00'],
  ['4350', '2410', '37950420.00'],
  ['0230', '4360', '7420000.00'],
  ['4360', '2440', '6980300.00'],
  ['5200', '4500', '17664000.00'],
  ['5200', '4510', '10612016.00'],
  ['4500', '2410', '17560300.00'],
  ['4510', '2410', '10549398.00'],
  ['4700', '2700', '6645700.00'],
  ['4700', '2410', '8910400.00'],
  ['5130', '2410', '1612300.00'],
  ['5530', '2410', '94600.63'],
  ['5400', '0290', '2104000.00'],
  ['2430', '2410', '400000.00'],
  ['5590', '2430', '186200.00'],
  ['2210', '2430', '214500.00'],
  ['2430', '2210', '21400.00'],
  ['5130', '2210', '189900.00'],
  ['2040', '6620', '18640.00'],
  ['2050', '6630', '12400.00'],
  ['5630', '2050', '8900.00'],
  ['2411', '2410', '20720000.00'],
]

/** The document behind a posting: its kind, its number and its page where one exists. */
export interface PostingDocument {
  kind: string
  number: string
}

/** One posting (a journal entry): its lines balance. */
export interface Posting {
  id: string
  date: string
  document: PostingDocument
  description: string
  partner?: string
  /** Account, debit or credit (decimal strings; one of them null). */
  lines: readonly { account: string; debit: string | null; credit: string | null }[]
}

function dr(accountCode: string, amount: string) {
  return { account: accountCode, debit: amount, credit: null }
}
function cr(accountCode: string, amount: string) {
  return { account: accountCode, debit: null, credit: amount }
}

function invoice(
  id: string,
  date: string,
  number: string,
  partner: string,
  revenue: string,
  base: string,
  vat: string,
  total: string,
  description: string,
): Posting {
  return {
    id,
    date,
    document: { kind: 'Invoice', number },
    description,
    partner,
    lines: [dr('2040', total), cr(revenue, base), cr('4700', vat)],
  }
}

function received(
  id: string,
  date: string,
  statement: string,
  partner: string,
  amount: string,
  description: string,
): Posting {
  return {
    id,
    date,
    document: { kind: 'Bank statement', number: `Statement ${statement}` },
    description,
    partner,
    lines: [dr('2410', amount), cr('2040', amount)],
  }
}

function cash(
  id: string,
  date: string,
  number: string,
  description: string,
  partner: string,
  debit: string,
  credit: string,
  amount: string,
): Posting {
  return {
    id,
    date,
    document: { kind: number.startsWith('CR') ? 'Cash receipt' : 'Cash payment', number },
    description,
    partner,
    lines: [dr(debit, amount), cr(credit, amount)],
  }
}

/** Every posting from 01.09.2026 to 14.10.2026, in the order they were booked. */
export const POSTINGS: readonly Posting[] = [
  invoice(
    'p1',
    '2026-09-10',
    'F-2026-0398',
    'Gradska toplana Novi Sad',
    '6140',
    '616666.67',
    '123333.33',
    '740000.00',
    'Heating substation works, August',
  ),
  invoice(
    'p2',
    '2026-09-10',
    'F-2026-0403',
    'Panonija Agro d.o.o.',
    '6040',
    '206507.60',
    '41301.52',
    '247809.12',
    'Reinforcement steel and cement',
  ),
  invoice(
    'p3',
    '2026-09-12',
    'F-2026-0404',
    'Knjigovodstvo Jelić',
    '6140',
    '12000.00',
    '2400.00',
    '14400.00',
    'Office partition works',
  ),
  invoice(
    'p4',
    '2026-09-15',
    'F-2026-0405',
    'Rakić Pekara SZR',
    '6040',
    '18204.17',
    '3640.83',
    '21845.00',
    'Ceramic tiles',
  ),
  received(
    'p5',
    '2026-09-15',
    '181',
    'Stanogradnja Plus d.o.o.',
    '1240000.00',
    'Payment of F-2026-0352',
  ),
  received('p6', '2026-09-16', '182', 'Knjigovodstvo Jelić', '14400.00', 'Payment of F-2026-0404'),
  invoice(
    'p7',
    '2026-09-17',
    'F-2026-0406',
    'Zlatibor Turs d.o.o.',
    '6040',
    '28010.67',
    '5602.13',
    '33612.80',
    'Facade insulation boards',
  ),
  invoice(
    'p8',
    '2026-09-18',
    'F-2026-0407',
    'Bojović i sinovi d.o.o.',
    '6040',
    '78750.00',
    '15750.00',
    '94500.00',
    'Concrete blocks',
  ),
  invoice(
    'p9',
    '2026-09-22',
    'F-2026-0402',
    'Stanogradnja Plus d.o.o.',
    '6140',
    '1250000.00',
    '250000.00',
    '1500000.00',
    'Concrete works, Liman 4, phase 1',
  ),
  invoice(
    'p10',
    '2026-09-22',
    'F-2026-0409',
    'Stanić Elektro STR',
    '6040',
    '19932.00',
    '3986.40',
    '23918.40',
    'Cable trays',
  ),
  invoice(
    'p11',
    '2026-09-25',
    'F-2026-0410',
    'Medic Lab Niš d.o.o.',
    '6040',
    '155350.29',
    '31070.06',
    '186420.35',
    'Laboratory fit-out material',
  ),
  invoice(
    'p12',
    '2026-09-26',
    'F-2026-0411',
    'Drina Prevoz d.o.o.',
    '6140',
    '48700.00',
    '9740.00',
    '58440.00',
    'Yard paving',
  ),
  invoice(
    'p13',
    '2026-09-28',
    'F-2026-0412',
    'Panonija Agro d.o.o.',
    '6040',
    '154961.67',
    '30992.33',
    '185954.00',
    'Building materials, September order',
  ),
  {
    id: 'p14',
    date: '2026-09-28',
    document: { kind: 'Invoice', number: 'F-2026-0412' },
    description: 'Advance A-2026-031 deducted',
    partner: 'Panonija Agro d.o.o.',
    lines: [dr('4300', '50000.00'), cr('2040', '50000.00')],
  },
  received('p15', '2026-09-29', '185', 'Rakić Pekara SZR', '21845.00', 'Payment of F-2026-0405'),
  received(
    'p16',
    '2026-09-30',
    '185',
    'Medic Lab Niš d.o.o.',
    '100000.00',
    'Part payment of F-2026-0410',
  ),
  {
    id: 'p17',
    date: '2026-09-30',
    document: { kind: 'Payroll', number: 'Salary advance 09/2026' },
    description: 'Salary advance for September 2026, 46 employees',
    lines: [dr('5200', '3534502.00'), cr('4500', '2208000.00'), cr('4510', '1326502.00')],
  },
  received('p18', '2026-10-02', '186', 'Stanić Elektro STR', '23918.40', 'Payment of F-2026-0409'),
  {
    id: 'p18b',
    date: '2026-10-05',
    document: { kind: 'Invoice', number: 'F-2026-0415' },
    description: 'Works abroad, invoiced in EUR',
    partner: 'Donau Bau GmbH',
    lines: [dr('2050', '1248989.67'), cr('6150', '1071633.96'), cr('4700', '177355.71')],
  },
  {
    id: 'p19',
    date: '2026-10-06',
    document: { kind: 'Cancellation', number: 'ST-2026-0004' },
    description: 'Cancellation of F-2026-0407',
    partner: 'Bojović i sinovi d.o.o.',
    lines: [dr('6040', '78750.00'), dr('4700', '15750.00'), cr('2040', '94500.00')],
  },
  {
    id: 'p20',
    date: '2026-10-06',
    document: { kind: 'Decrease', number: 'KO-2026-0009' },
    description: 'Decrease of F-2026-0410',
    partner: 'Medic Lab Niš d.o.o.',
    lines: [dr('6040', '15548.00'), dr('4700', '3109.60'), cr('2040', '18657.60')],
  },
  {
    id: 'p21',
    date: '2026-10-06',
    document: { kind: 'Journal entry', number: 'NK-2026-0912' },
    description: 'Supplier invoice UF-2026-1204',
    partner: 'Gradska mehanizacija d.o.o.',
    lines: [
      dr('5120', '84600.00'),
      dr('5330', '36000.00'),
      dr('2700', '24120.00'),
      cr('4350', '144720.00'),
    ],
  },
  received(
    'p22',
    '2026-10-06',
    '188',
    'Panonija Agro d.o.o.',
    '135954.00',
    'Payment of F-2026-0412',
  ),
  {
    id: 'p23',
    date: '2026-10-06',
    document: { kind: 'Bank statement', number: 'Statement 188' },
    description: 'Account fee, September 2026',
    partner: 'Banca Intesa a.d. Beograd',
    lines: [dr('5530', '1240.00'), cr('2410', '1240.00')],
  },
  received(
    'p24',
    '2026-10-06',
    '188',
    'Medic Lab Niš d.o.o.',
    '50000.00',
    'Part payment of F-2026-0410',
  ),
  {
    id: 'p25',
    date: '2026-10-06',
    document: { kind: 'Bank statement', number: 'Statement 188' },
    description: 'Payment of UF-2026-1204',
    partner: 'Gradska mehanizacija d.o.o.',
    lines: [dr('4350', '144720.00'), cr('2410', '144720.00')],
  },
  {
    id: 'p26',
    date: '2026-10-06',
    document: { kind: 'Bank statement', number: 'Statement 188' },
    description: 'Salary advance for September 2026, paid',
    lines: [dr('4500', '2208000.00'), cr('2410', '2208000.00')],
  },
  {
    id: 'p27',
    date: '2026-10-06',
    document: { kind: 'Bank statement', number: 'Statement 188' },
    description: 'Taxes and contributions on the salary advance',
    partner: 'Poreska uprava',
    lines: [dr('4510', '1326502.00'), cr('2410', '1326502.00')],
  },
  received(
    'p28',
    '2026-10-06',
    '188',
    'Zlatibor Turs d.o.o.',
    '33612.40',
    'Payment of F-2026-0406',
  ),
  {
    id: 'p29',
    date: '2026-10-06',
    document: { kind: 'Bank statement', number: 'Statement 188' },
    description: 'Transfer to the Raiffeisen banka account',
    lines: [dr('2411', '500000.00'), cr('2410', '500000.00')],
  },
  {
    id: 'p30',
    date: '2026-10-06',
    document: { kind: 'Bank statement', number: 'Statement 188' },
    description: 'Advance on quote P-2026-118',
    partner: 'Vojvođanka Mlin a.d.',
    lines: [dr('2410', '60000.00'), cr('4300', '60000.00')],
  },
  invoice(
    'p31',
    '2026-10-07',
    'F-2026-0431',
    'Gradska toplana Novi Sad',
    '6140',
    '960000.00',
    '192000.00',
    '1152000.00',
    'Heating substation works, September',
  ),
  invoice(
    'p32',
    '2026-10-09',
    'F-2026-0432',
    'Stanogradnja Plus d.o.o.',
    '6140',
    '720300.00',
    '144060.00',
    '864360.00',
    'Concrete works, Liman 4, phase 2',
  ),
  cash(
    'p33',
    '2026-10-12',
    'CR-2026-0141',
    'Cash withdrawal for site expenses',
    'Banca Intesa',
    '2430',
    '2410',
    '50000.00',
  ),
  cash(
    'p34',
    '2026-10-12',
    'CP-2026-0210',
    'Fuel, site van NS-123-AB',
    'NIS Petrol, Novi Sad',
    '5130',
    '2430',
    '6200.00',
  ),
  cash(
    'p35',
    '2026-10-12',
    'CP-2026-0211',
    'Small material, Site Liman 4',
    'Gvožđara Liman',
    '5120',
    '2430',
    '8640.00',
  ),
  cash(
    'p36',
    '2026-10-12',
    'CP-2026-0212',
    'Travel advance, Subotica 15.–16.10.2026',
    'Nikola Marković',
    '2210',
    '2430',
    '15000.00',
  ),
  received('p37', '2026-10-12', '190', 'Drina Prevoz d.o.o.', '58440.00', 'Payment of F-2026-0411'),
  cash(
    'p38',
    '2026-10-13',
    'CR-2026-0142',
    'Unused travel advance returned',
    'Stefan Ilić',
    '2430',
    '2210',
    '3200.00',
  ),
  cash(
    'p39',
    '2026-10-13',
    'CR-2026-0143',
    'Reservation deposit, apartment 3.2, Liman 4',
    'Jovan Petković',
    '2430',
    '4300',
    '150000.00',
  ),
  cash(
    'p40',
    '2026-10-13',
    'CP-2026-0213',
    'Postage and courier',
    'Pošta Srbije',
    '5590',
    '2430',
    '1150.00',
  ),
  received(
    'p41',
    '2026-10-13',
    '191',
    'Gradska toplana Novi Sad',
    '740000.00',
    'Payment of F-2026-0398',
  ),
  invoice(
    'p42',
    '2026-10-13',
    'F-2026-0433',
    'Vojvođanka Mlin a.d.',
    '6040',
    '210000.00',
    '42000.00',
    '252000.00',
    'Steel profiles for the mill extension',
  ),
  cash(
    'p43',
    '2026-10-14',
    'CP-2026-0214',
    'Fuel, site van NS-123-AB',
    'NIS Petrol, Novi Sad',
    '5130',
    '2430',
    '4800.00',
  ),
]

// ── The Core's arithmetic, played here ────────────────────────────────────────────────────────

function fail(message: string): never {
  throw new Error(`Example ledger: ${message}`)
}

const units = (value: string | null) => (value === null ? 0n : paras(value))

/** Whether a date (YYYY-MM-DD) lies in [from, to]. */
const within = (date: string, from: string, to: string) => date >= from && date <= to

/** Debit and credit of one account: the summary of January–August and the postings in [from, to]. */
function turnover(code: string, from: string, to: string) {
  let debit = 0n
  let credit = 0n
  if (from <= '2026-01-01') {
    for (const [debitAccount, creditAccount, amount] of JANUARY_TO_AUGUST) {
      if (debitAccount === code) debit += paras(amount)
      if (creditAccount === code) credit += paras(amount)
    }
  }
  for (const posting of POSTINGS) {
    if (!within(posting.date, from, to)) continue
    for (const line of posting.lines) {
      if (line.account !== code) continue
      debit += units(line.debit)
      credit += units(line.credit)
    }
  }
  return { debit, credit }
}

/** A signed balance as debit and credit, each a decimal string or null. */
function sides(balance: bigint): { debit: string | null; credit: string | null } {
  if (balance > 0n) return { debit: decimal(balance), credit: null }
  if (balance < 0n) return { debit: null, credit: decimal(-balance) }
  return { debit: null, credit: null }
}

// Every posting balances; the opening and January–August balance.
for (const posting of POSTINGS) {
  const debit = sumUnits(posting.lines.map((line) => units(line.debit)))
  const credit = sumUnits(posting.lines.map((line) => units(line.credit)))
  if (debit !== credit) fail(`posting ${posting.id} does not balance`)
  for (const line of posting.lines) accountByCode(line.account)
}
if (sumUnits(Object.values(OPENING).map(paras)) !== 0n) fail('the opening does not balance')

// ── The trial balance's figures ───────────────────────────────────────────────────────────────

/** Opening, turnover and closing of one account, each as debit and credit. */
export interface AccountFigures {
  opening: { debit: string | null; credit: string | null }
  turnover: { debit: string | null; credit: string | null }
  closing: { debit: string | null; credit: string | null }
}

function figures(opening: bigint, debit: bigint, credit: bigint): AccountFigures {
  return {
    opening: sides(opening),
    turnover: {
      debit: debit === 0n ? null : decimal(debit),
      credit: credit === 0n ? null : decimal(credit),
    },
    closing: sides(opening + debit - credit),
  }
}

/** The same date of 2025: the opening of 01.01.2025 and the turnover to 14.10.2025. */
const PREVIOUS: Readonly<Record<string, { opening: string; debit: string; credit: string }>> = {
  '0220': { opening: '43740000.00', debit: '0.00', credit: '0.00' },
  '0230': { opening: '28125000.00', debit: '6381200.00', credit: '0.00' },
  '0231': { opening: '8856000.00', debit: '0.00', credit: '0.00' },
  '0290': { opening: '-20174040.00', debit: '0.00', credit: '1809440.00' },
  '1010': { opening: '5655879.36', debit: '24433030.00', credit: '26762598.00' },
  '1011': { opening: '1055592.00', debit: '2764900.00', credit: '2563144.00' },
  '2040': { opening: '8022798.31', debit: '82200279.20', credit: '84375485.88' },
  '2050': { opening: '1123740.00', debit: '5894913.00', credit: '5952318.00' },
  '2210': { opening: '0.00', debit: '184470.00', credit: '184470.00' },
  '2410': { opening: '3708697.77', debit: '83902485.88', credit: '84105780.02' },
  '2411': { opening: '1215360.00', debit: '17819200.00', credit: '0.00' },
  '2430': { opening: '41508.00', debit: '362404.00', credit: '344602.00' },
  '2440': { opening: '2171421.18', debit: '5944664.00', credit: '6003058.00' },
  '2442': { opening: '286605.67', debit: '0.00', credit: '0.00' },
  '2700': { opening: '0.00', debit: '5715302.00', credit: '5715302.00' },
  '3020': { opening: '-18000000.00', debit: '0.00', credit: '0.00' },
  '3410': { opening: '-52113486.32', debit: '0.00', credit: '0.00' },
  '4300': { opening: '-1665000.00', debit: '2537000.00', credit: '2064000.00' },
  '4350': { opening: '-6672204.81', debit: '32637361.20', credit: '34291812.00' },
  '4360': { opening: '-871398.36', debit: '6003058.00', credit: '6381200.00' },
  '4500': { opening: '-1987200.00', debit: '15101858.00', credit: '15191040.00' },
  '4510': { opening: '-1193851.80', debit: '9072482.28', credit: '9126333.76' },
  '4700': { opening: '-1325421.00', debit: '13378246.00', credit: '13697374.80' },
  '5120': { opening: '0.00', debit: '26560842.00', credit: '0.00' },
  '5130': { opening: '0.00', debit: '1552644.00', credit: '0.00' },
  '5200': { opening: '0.00', debit: '24317373.76', credit: '0.00' },
  '5330': { opening: '0.00', debit: '4143480.00', credit: '0.00' },
  '5400': { opening: '0.00', debit: '1809440.00', credit: '0.00' },
  '5530': { opening: '0.00', debit: '81356.54', credit: '0.00' },
  '5590': { opening: '0.00', debit: '160132.00', credit: '0.00' },
  '5630': { opening: '0.00', debit: '7654.00', credit: '0.00' },
  '6040': { opening: '0.00', debit: '0.00', credit: '27021716.00' },
  '6140': { opening: '0.00', debit: '0.00', credit: '41465158.00' },
  '6150': { opening: '0.00', debit: '0.00', credit: '5884249.00' },
  '6620': { opening: '0.00', debit: '0.00', credit: '16030.40' },
  '6630': { opening: '0.00', debit: '0.00', credit: '10664.00' },
}

/** One account in the trial balance: this year to 14.10.2026 and the same day of 2025. */
export interface TrialAccount {
  account: LedgerAccount
  current: AccountFigures
  previous: AccountFigures
}

/** Every account with a figure in either year, in the chart's order. */
export const TRIAL_ACCOUNTS: readonly TrialAccount[] = ACCOUNTS.flatMap((each) => {
  const opening = paras(OPENING[each.code] ?? '0.00')
  const moved = turnover(each.code, '2026-01-01', LEDGER_TODAY)
  const before = PREVIOUS[each.code]
  if (opening === 0n && moved.debit === 0n && moved.credit === 0n && before === undefined) return []
  const previous =
    before === undefined
      ? figures(0n, 0n, 0n)
      : figures(paras(before.opening), paras(before.debit), paras(before.credit))
  return [{ account: each, current: figures(opening, moved.debit, moved.credit), previous }]
})

type Column =
  | 'openingDebit'
  | 'openingCredit'
  | 'turnoverDebit'
  | 'turnoverCredit'
  | 'closingDebit'
  | 'closingCredit'

/** The six columns' sums of some accounts, for one year. */
export type TrialTotals = Record<Column, string>

export function trialTotals(
  accounts: readonly TrialAccount[],
  year: 'current' | 'previous',
): TrialTotals {
  const sum = (pick: (figures: AccountFigures) => string | null) =>
    decimal(sumUnits(accounts.map((each) => units(pick(each[year])))))
  return {
    openingDebit: sum((each) => each.opening.debit),
    openingCredit: sum((each) => each.opening.credit),
    turnoverDebit: sum((each) => each.turnover.debit),
    turnoverCredit: sum((each) => each.turnover.credit),
    closingDebit: sum((each) => each.closing.debit),
    closingCredit: sum((each) => each.closing.credit),
  }
}

/** The whole trial balance's totals: each pair balances (checked below). */
export const TRIAL_TOTALS = trialTotals(TRIAL_ACCOUNTS, 'current')
export const TRIAL_TOTALS_PREVIOUS = trialTotals(TRIAL_ACCOUNTS, 'previous')

for (const totals of [TRIAL_TOTALS, TRIAL_TOTALS_PREVIOUS]) {
  if (totals.openingDebit !== totals.openingCredit) fail('the opening columns differ')
  if (totals.turnoverDebit !== totals.turnoverCredit) fail('the turnover columns differ')
  if (totals.closingDebit !== totals.closingCredit) fail('the closing columns differ')
}
