/*
 * Group AS's example data (P5.60, loans and leasing): Kvadrat Gradnja d.o.o.'s loans and leases on
 * 14 October 2026, its books kept by Knjigovodstvo Jelić. The investment loan KR-2025-004 that
 * bought the mini excavator OS-0142 (group AP), a working-capital loan, the finance lease of the
 * pickup OS-0133 — whose October instalment is overdue — and a loan repaid in May. Every figure is
 * the application's: the annuities, each instalment's principal and interest, the balance after it,
 * what was paid and what is outstanding, as decimal strings (D4); an instalment's state (Paid, Due,
 * Overdue, Upcoming) is the application's word. The banks, the lessor, the rates and the terms are
 * invented and illustrative. Not part of the package. No classes here.
 */
import type { Tone } from '@veljaos/ui'

export const AS_TODAY = '2026-10-14'

/** The featured contract: the investment loan for the mini excavator. */
export const FEATURED_LOAN = 'KR-2025-004'
/** The lease with an overdue instalment. */
export const OVERDUE_LEASE = 'LZ-2024-012'

export const AS_ROUTES = {
  list: '/accounting/loans',
  /** The "Repaid" view. */
  repaid: '/accounting/loans?view=repaid',
  contract: (number: string) => `/accounting/loans/${number}`,
  loan: `/accounting/loans/${FEATURED_LOAN}`,
  lease: `/accounting/loans/${OVERDUE_LEASE}`,
} as const

export type ContractKind = 'Investment loan' | 'Working capital loan' | 'Finance lease'
export type ContractState = 'Active' | 'Overdue' | 'Repaid'

export const CONTRACT_TONES: Record<ContractState, Tone> = {
  Active: 'info',
  Overdue: 'danger',
  Repaid: 'neutral',
}

export type InstalmentState = 'Paid' | 'Due' | 'Overdue' | 'Upcoming'

export const INSTALMENT_TONES: Record<InstalmentState, Tone> = {
  Paid: 'success',
  Due: 'warning',
  Overdue: 'danger',
  Upcoming: 'neutral',
}

export interface LoanContract {
  number: string
  kind: ContractKind
  lender: string
  principal: string
  /** The yearly rate, a percentage, and how it is set, in the application's words. */
  rate: string
  rateText: string
  /** Number of monthly instalments. */
  term: string
  drawn: string
  first: string
  last: string
  /** The regular instalment (the last one closes the balance). */
  instalment: string
  outstanding: string
  /** The next instalment not paid: its date and amount; null when repaid. */
  next: { date: string; amount: string } | null
  paidPrincipal: string
  paidInterest: string
  /** What it financed, and the asset (group AP) when there is one. */
  purpose: string
  asset?: string
  collateral: string
  /** Paid from this account. */
  account: string
  state: ContractState
  /** The overdue instalment in the application's words. */
  overdueText?: string
}

export const CONTRACTS: readonly LoanContract[] = [
  {
    number: 'KR-2025-004',
    kind: 'Investment loan',
    lender: 'Dunav Banka a.d.',
    principal: '6000000.00',
    rate: '6.5',
    rateText: 'fixed',
    term: '36',
    drawn: '2025-03-10',
    first: '2025-04-15',
    last: '2028-03-15',
    instalment: '183894.02',
    outstanding: '3145740.46',
    next: { date: '2026-10-15', amount: '183894.02' },
    paidPrincipal: '2854259.54',
    paidInterest: '455832.82',
    purpose: 'Mini excavator 3.5 t',
    asset: 'OS-0142',
    collateral: 'Pledge on the mini excavator OS-0142',
    account: '160-0000012345678-67',
    state: 'Active',
  },
  {
    number: 'KR-2026-002',
    kind: 'Working capital loan',
    lender: 'Panonska Banka a.d.',
    principal: '8000000.00',
    rate: '5.4',
    rateText: 'variable: 3M BELIBOR + 1,90 % (illustrative)',
    term: '24',
    drawn: '2026-02-27',
    first: '2026-03-31',
    last: '2028-02-29',
    instalment: '352405.98',
    outstanding: '5755032.50',
    next: { date: '2026-10-31', amount: '352405.98' },
    paidPrincipal: '2244967.50',
    paidInterest: '221874.36',
    purpose: 'Materials for Residential building Liman 4',
    collateral: 'Bills of exchange (2)',
    account: '160-0000012345678-67',
    state: 'Active',
  },
  {
    number: 'LZ-2024-012',
    kind: 'Finance lease',
    lender: 'Lizing Plus d.o.o.',
    principal: '4128000.00',
    rate: '7.2',
    rateText: 'fixed',
    term: '36',
    drawn: '2024-02-12',
    first: '2024-03-10',
    last: '2027-02-10',
    instalment: '127838.47',
    outstanding: '627846.18',
    next: { date: '2026-10-10', amount: '127838.47' },
    paidPrincipal: '3500153.82',
    paidInterest: '462838.75',
    purpose: 'Pickup Toyota Hilux NS-911-LM',
    asset: 'OS-0133',
    collateral: 'The vehicle is the lessor’s until the last instalment',
    account: '160-0000012345678-67',
    state: 'Overdue',
    overdueText: 'Instalment 32 of 10.10.2026 is overdue by 4 days.',
  },
  {
    number: 'KR-2021-011',
    kind: 'Investment loan',
    lender: 'Panonska Banka a.d.',
    principal: '3000000.00',
    rate: '7.9',
    rateText: 'fixed',
    term: '60',
    drawn: '2021-05-24',
    first: '2021-06-30',
    last: '2026-05-30',
    instalment: '60685.71',
    outstanding: '0.00',
    next: null,
    paidPrincipal: '3000000.00',
    paidInterest: '641142.52',
    purpose: 'Formwork system for Bulevar Evrope 24',
    collateral: 'Pledge released on 05.06.2026',
    account: '160-0000012345678-67',
    state: 'Repaid',
  },
]

export function contractByNumber(number: string): LoanContract | undefined {
  return CONTRACTS.find((each) => each.number === number)
}

export type LoanView = 'active' | 'repaid' | 'all'

export const LOAN_VIEWS: { id: LoanView; label: string }[] = [
  { id: 'active', label: 'Active' },
  { id: 'repaid', label: 'Repaid' },
  { id: 'all', label: 'All' },
]

export function inLoanView(contract: LoanContract, view: LoanView): boolean {
  if (view === 'all') return true
  return view === 'repaid' ? contract.state === 'Repaid' : contract.state !== 'Repaid'
}

/** The schedule's totals (the application's), by contract. */
export const SCHEDULE_TOTALS: Record<
  string,
  { instalment: string; principal: string; interest: string }
> = {
  'KR-2025-004': { instalment: '6620184.62', principal: '6000000.00', interest: '620184.62' },
  'KR-2026-002': { instalment: '8457743.58', principal: '8000000.00', interest: '457743.58' },
  'LZ-2024-012': { instalment: '4602185.06', principal: '4128000.00', interest: '474185.06' },
  'KR-2021-011': { instalment: '3641142.52', principal: '3000000.00', interest: '641142.52' },
}

// ── The repayment schedules ───────────────────────────────────────────────────────────────────

export interface Instalment {
  /** Its number in the schedule. */
  number: number
  due: string
  amount: string
  principal: string
  interest: string
  /** The outstanding principal after it is paid. */
  balance: string
  state: InstalmentState
}

const inst = (
  number: number,
  due: string,
  amount: string,
  principal: string,
  interest: string,
  balance: string,
  state: InstalmentState,
): Instalment => ({ number, due, amount, principal, interest, balance, state })

export const SCHEDULES: Record<string, readonly Instalment[]> = {
  'KR-2025-004': [
    inst(1, '2025-04-15', '183894.02', '151394.02', '32500.00', '5848605.98', 'Paid'),
    inst(2, '2025-05-15', '183894.02', '152214.07', '31679.95', '5696391.91', 'Paid'),
    inst(3, '2025-06-15', '183894.02', '153038.56', '30855.46', '5543353.35', 'Paid'),
    inst(4, '2025-07-15', '183894.02', '153867.52', '30026.50', '5389485.83', 'Paid'),
    inst(5, '2025-08-15', '183894.02', '154700.97', '29193.05', '5234784.86', 'Paid'),
    inst(6, '2025-09-15', '183894.02', '155538.94', '28355.08', '5079245.92', 'Paid'),
    inst(7, '2025-10-15', '183894.02', '156381.44', '27512.58', '4922864.48', 'Paid'),
    inst(8, '2025-11-15', '183894.02', '157228.50', '26665.52', '4765635.98', 'Paid'),
    inst(9, '2025-12-15', '183894.02', '158080.16', '25813.86', '4607555.82', 'Paid'),
    inst(10, '2026-01-15', '183894.02', '158936.43', '24957.59', '4448619.39', 'Paid'),
    inst(11, '2026-02-15', '183894.02', '159797.33', '24096.69', '4288822.06', 'Paid'),
    inst(12, '2026-03-15', '183894.02', '160662.90', '23231.12', '4128159.16', 'Paid'),
    inst(13, '2026-04-15', '183894.02', '161533.16', '22360.86', '3966626.00', 'Paid'),
    inst(14, '2026-05-15', '183894.02', '162408.13', '21485.89', '3804217.87', 'Paid'),
    inst(15, '2026-06-15', '183894.02', '163287.84', '20606.18', '3640930.03', 'Paid'),
    inst(16, '2026-07-15', '183894.02', '164172.32', '19721.70', '3476757.71', 'Paid'),
    inst(17, '2026-08-15', '183894.02', '165061.58', '18832.44', '3311696.13', 'Paid'),
    inst(18, '2026-09-15', '183894.02', '165955.67', '17938.35', '3145740.46', 'Paid'),
    inst(19, '2026-10-15', '183894.02', '166854.59', '17039.43', '2978885.87', 'Due'),
    inst(20, '2026-11-15', '183894.02', '167758.39', '16135.63', '2811127.48', 'Upcoming'),
    inst(21, '2026-12-15', '183894.02', '168667.08', '15226.94', '2642460.40', 'Upcoming'),
    inst(22, '2027-01-15', '183894.02', '169580.69', '14313.33', '2472879.71', 'Upcoming'),
    inst(23, '2027-02-15', '183894.02', '170499.25', '13394.77', '2302380.46', 'Upcoming'),
    inst(24, '2027-03-15', '183894.02', '171422.79', '12471.23', '2130957.67', 'Upcoming'),
    inst(25, '2027-04-15', '183894.02', '172351.33', '11542.69', '1958606.34', 'Upcoming'),
    inst(26, '2027-05-15', '183894.02', '173284.90', '10609.12', '1785321.44', 'Upcoming'),
    inst(27, '2027-06-15', '183894.02', '174223.53', '9670.49', '1611097.91', 'Upcoming'),
    inst(28, '2027-07-15', '183894.02', '175167.24', '8726.78', '1435930.67', 'Upcoming'),
    inst(29, '2027-08-15', '183894.02', '176116.06', '7777.96', '1259814.61', 'Upcoming'),
    inst(30, '2027-09-15', '183894.02', '177070.02', '6824.00', '1082744.59', 'Upcoming'),
    inst(31, '2027-10-15', '183894.02', '178029.15', '5864.87', '904715.44', 'Upcoming'),
    inst(32, '2027-11-15', '183894.02', '178993.48', '4900.54', '725721.96', 'Upcoming'),
    inst(33, '2027-12-15', '183894.02', '179963.03', '3930.99', '545758.93', 'Upcoming'),
    inst(34, '2028-01-15', '183894.02', '180937.83', '2956.19', '364821.10', 'Upcoming'),
    inst(35, '2028-02-15', '183894.02', '181917.91', '1976.11', '182903.19', 'Upcoming'),
    inst(36, '2028-03-15', '183893.92', '182903.19', '990.73', '0.00', 'Upcoming'),
  ],
  'LZ-2024-012': [
    inst(1, '2024-03-10', '127838.47', '103070.47', '24768.00', '4024929.53', 'Paid'),
    inst(2, '2024-04-10', '127838.47', '103688.89', '24149.58', '3921240.64', 'Paid'),
    inst(3, '2024-05-10', '127838.47', '104311.03', '23527.44', '3816929.61', 'Paid'),
    inst(4, '2024-06-10', '127838.47', '104936.89', '22901.58', '3711992.72', 'Paid'),
    inst(5, '2024-07-10', '127838.47', '105566.51', '22271.96', '3606426.21', 'Paid'),
    inst(6, '2024-08-10', '127838.47', '106199.91', '21638.56', '3500226.30', 'Paid'),
    inst(7, '2024-09-10', '127838.47', '106837.11', '21001.36', '3393389.19', 'Paid'),
    inst(8, '2024-10-10', '127838.47', '107478.13', '20360.34', '3285911.06', 'Paid'),
    inst(9, '2024-11-10', '127838.47', '108123.00', '19715.47', '3177788.06', 'Paid'),
    inst(10, '2024-12-10', '127838.47', '108771.74', '19066.73', '3069016.32', 'Paid'),
    inst(11, '2025-01-10', '127838.47', '109424.37', '18414.10', '2959591.95', 'Paid'),
    inst(12, '2025-02-10', '127838.47', '110080.92', '17757.55', '2849511.03', 'Paid'),
    inst(13, '2025-03-10', '127838.47', '110741.40', '17097.07', '2738769.63', 'Paid'),
    inst(14, '2025-04-10', '127838.47', '111405.85', '16432.62', '2627363.78', 'Paid'),
    inst(15, '2025-05-10', '127838.47', '112074.29', '15764.18', '2515289.49', 'Paid'),
    inst(16, '2025-06-10', '127838.47', '112746.73', '15091.74', '2402542.76', 'Paid'),
    inst(17, '2025-07-10', '127838.47', '113423.21', '14415.26', '2289119.55', 'Paid'),
    inst(18, '2025-08-10', '127838.47', '114103.75', '13734.72', '2175015.80', 'Paid'),
    inst(19, '2025-09-10', '127838.47', '114788.38', '13050.09', '2060227.42', 'Paid'),
    inst(20, '2025-10-10', '127838.47', '115477.11', '12361.36', '1944750.31', 'Paid'),
    inst(21, '2025-11-10', '127838.47', '116169.97', '11668.50', '1828580.34', 'Paid'),
    inst(22, '2025-12-10', '127838.47', '116866.99', '10971.48', '1711713.35', 'Paid'),
    inst(23, '2026-01-10', '127838.47', '117568.19', '10270.28', '1594145.16', 'Paid'),
    inst(24, '2026-02-10', '127838.47', '118273.60', '9564.87', '1475871.56', 'Paid'),
    inst(25, '2026-03-10', '127838.47', '118983.24', '8855.23', '1356888.32', 'Paid'),
    inst(26, '2026-04-10', '127838.47', '119697.14', '8141.33', '1237191.18', 'Paid'),
    inst(27, '2026-05-10', '127838.47', '120415.32', '7423.15', '1116775.86', 'Paid'),
    inst(28, '2026-06-10', '127838.47', '121137.81', '6700.66', '995638.05', 'Paid'),
    inst(29, '2026-07-10', '127838.47', '121864.64', '5973.83', '873773.41', 'Paid'),
    inst(30, '2026-08-10', '127838.47', '122595.83', '5242.64', '751177.58', 'Paid'),
    inst(31, '2026-09-10', '127838.47', '123331.40', '4507.07', '627846.18', 'Paid'),
    inst(32, '2026-10-10', '127838.47', '124071.39', '3767.08', '503774.79', 'Overdue'),
    inst(33, '2026-11-10', '127838.47', '124815.82', '3022.65', '378958.97', 'Upcoming'),
    inst(34, '2026-12-10', '127838.47', '125564.72', '2273.75', '253394.25', 'Upcoming'),
    inst(35, '2027-01-10', '127838.47', '126318.10', '1520.37', '127076.15', 'Upcoming'),
    inst(36, '2027-02-10', '127838.61', '127076.15', '762.46', '0.00', 'Upcoming'),
  ],
  'KR-2026-002': [
    inst(1, '2026-03-31', '352405.98', '316405.98', '36000.00', '7683594.02', 'Paid'),
    inst(2, '2026-04-30', '352405.98', '317829.81', '34576.17', '7365764.21', 'Paid'),
    inst(3, '2026-05-31', '352405.98', '319260.04', '33145.94', '7046504.17', 'Paid'),
    inst(4, '2026-06-30', '352405.98', '320696.71', '31709.27', '6725807.46', 'Paid'),
    inst(5, '2026-07-31', '352405.98', '322139.85', '30266.13', '6403667.61', 'Paid'),
    inst(6, '2026-08-31', '352405.98', '323589.48', '28816.50', '6080078.13', 'Paid'),
    inst(7, '2026-09-30', '352405.98', '325045.63', '27360.35', '5755032.50', 'Paid'),
    inst(8, '2026-10-31', '352405.98', '326508.33', '25897.65', '5428524.17', 'Due'),
    inst(9, '2026-11-30', '352405.98', '327977.62', '24428.36', '5100546.55', 'Upcoming'),
    inst(10, '2026-12-31', '352405.98', '329453.52', '22952.46', '4771093.03', 'Upcoming'),
    inst(11, '2027-01-31', '352405.98', '330936.06', '21469.92', '4440156.97', 'Upcoming'),
    inst(12, '2027-02-28', '352405.98', '332425.27', '19980.71', '4107731.70', 'Upcoming'),
    inst(13, '2027-03-31', '352405.98', '333921.19', '18484.79', '3773810.51', 'Upcoming'),
    inst(14, '2027-04-30', '352405.98', '335423.83', '16982.15', '3438386.68', 'Upcoming'),
    inst(15, '2027-05-31', '352405.98', '336933.24', '15472.74', '3101453.44', 'Upcoming'),
    inst(16, '2027-06-30', '352405.98', '338449.44', '13956.54', '2763004.00', 'Upcoming'),
    inst(17, '2027-07-31', '352405.98', '339972.46', '12433.52', '2423031.54', 'Upcoming'),
    inst(18, '2027-08-31', '352405.98', '341502.34', '10903.64', '2081529.20', 'Upcoming'),
    inst(19, '2027-09-30', '352405.98', '343039.10', '9366.88', '1738490.10', 'Upcoming'),
    inst(20, '2027-10-31', '352405.98', '344582.77', '7823.21', '1393907.33', 'Upcoming'),
    inst(21, '2027-11-30', '352405.98', '346133.40', '6272.58', '1047773.93', 'Upcoming'),
    inst(22, '2027-12-31', '352405.98', '347691.00', '4714.98', '700082.93', 'Upcoming'),
    inst(23, '2028-01-31', '352405.98', '349255.61', '3150.37', '350827.32', 'Upcoming'),
    inst(24, '2028-02-29', '352406.04', '350827.32', '1578.72', '0.00', 'Upcoming'),
  ],
  'KR-2021-011': [
    inst(1, '2021-06-30', '60685.71', '40935.71', '19750.00', '2959064.29', 'Paid'),
    inst(2, '2021-07-30', '60685.71', '41205.20', '19480.51', '2917859.09', 'Paid'),
    inst(3, '2021-08-30', '60685.71', '41476.47', '19209.24', '2876382.62', 'Paid'),
    inst(4, '2021-09-30', '60685.71', '41749.52', '18936.19', '2834633.10', 'Paid'),
    inst(5, '2021-10-30', '60685.71', '42024.38', '18661.33', '2792608.72', 'Paid'),
    inst(6, '2021-11-30', '60685.71', '42301.04', '18384.67', '2750307.68', 'Paid'),
    inst(7, '2021-12-30', '60685.71', '42579.52', '18106.19', '2707728.16', 'Paid'),
    inst(8, '2022-01-30', '60685.71', '42859.83', '17825.88', '2664868.33', 'Paid'),
    inst(9, '2022-02-30', '60685.71', '43141.99', '17543.72', '2621726.34', 'Paid'),
    inst(10, '2022-03-30', '60685.71', '43426.01', '17259.70', '2578300.33', 'Paid'),
    inst(11, '2022-04-30', '60685.71', '43711.90', '16973.81', '2534588.43', 'Paid'),
    inst(12, '2022-05-30', '60685.71', '43999.67', '16686.04', '2490588.76', 'Paid'),
    inst(13, '2022-06-30', '60685.71', '44289.33', '16396.38', '2446299.43', 'Paid'),
    inst(14, '2022-07-30', '60685.71', '44580.91', '16104.80', '2401718.52', 'Paid'),
    inst(15, '2022-08-30', '60685.71', '44874.40', '15811.31', '2356844.12', 'Paid'),
    inst(16, '2022-09-30', '60685.71', '45169.82', '15515.89', '2311674.30', 'Paid'),
    inst(17, '2022-10-30', '60685.71', '45467.19', '15218.52', '2266207.11', 'Paid'),
    inst(18, '2022-11-30', '60685.71', '45766.51', '14919.20', '2220440.60', 'Paid'),
    inst(19, '2022-12-30', '60685.71', '46067.81', '14617.90', '2174372.79', 'Paid'),
    inst(20, '2023-01-30', '60685.71', '46371.09', '14314.62', '2128001.70', 'Paid'),
    inst(21, '2023-02-30', '60685.71', '46676.37', '14009.34', '2081325.33', 'Paid'),
    inst(22, '2023-03-30', '60685.71', '46983.65', '13702.06', '2034341.68', 'Paid'),
    inst(23, '2023-04-30', '60685.71', '47292.96', '13392.75', '1987048.72', 'Paid'),
    inst(24, '2023-05-30', '60685.71', '47604.31', '13081.40', '1939444.41', 'Paid'),
    inst(25, '2023-06-30', '60685.71', '47917.70', '12768.01', '1891526.71', 'Paid'),
    inst(26, '2023-07-30', '60685.71', '48233.16', '12452.55', '1843293.55', 'Paid'),
    inst(27, '2023-08-30', '60685.71', '48550.69', '12135.02', '1794742.86', 'Paid'),
    inst(28, '2023-09-30', '60685.71', '48870.32', '11815.39', '1745872.54', 'Paid'),
    inst(29, '2023-10-30', '60685.71', '49192.05', '11493.66', '1696680.49', 'Paid'),
    inst(30, '2023-11-30', '60685.71', '49515.90', '11169.81', '1647164.59', 'Paid'),
    inst(31, '2023-12-30', '60685.71', '49841.88', '10843.83', '1597322.71', 'Paid'),
    inst(32, '2024-01-30', '60685.71', '50170.00', '10515.71', '1547152.71', 'Paid'),
    inst(33, '2024-02-30', '60685.71', '50500.29', '10185.42', '1496652.42', 'Paid'),
    inst(34, '2024-03-30', '60685.71', '50832.75', '9852.96', '1445819.67', 'Paid'),
    inst(35, '2024-04-30', '60685.71', '51167.40', '9518.31', '1394652.27', 'Paid'),
    inst(36, '2024-05-30', '60685.71', '51504.25', '9181.46', '1343148.02', 'Paid'),
    inst(37, '2024-06-30', '60685.71', '51843.32', '8842.39', '1291304.70', 'Paid'),
    inst(38, '2024-07-30', '60685.71', '52184.62', '8501.09', '1239120.08', 'Paid'),
    inst(39, '2024-08-30', '60685.71', '52528.17', '8157.54', '1186591.91', 'Paid'),
    inst(40, '2024-09-30', '60685.71', '52873.98', '7811.73', '1133717.93', 'Paid'),
    inst(41, '2024-10-30', '60685.71', '53222.07', '7463.64', '1080495.86', 'Paid'),
    inst(42, '2024-11-30', '60685.71', '53572.45', '7113.26', '1026923.41', 'Paid'),
    inst(43, '2024-12-30', '60685.71', '53925.13', '6760.58', '972998.28', 'Paid'),
    inst(44, '2025-01-30', '60685.71', '54280.14', '6405.57', '918718.14', 'Paid'),
    inst(45, '2025-02-30', '60685.71', '54637.48', '6048.23', '864080.66', 'Paid'),
    inst(46, '2025-03-30', '60685.71', '54997.18', '5688.53', '809083.48', 'Paid'),
    inst(47, '2025-04-30', '60685.71', '55359.24', '5326.47', '753724.24', 'Paid'),
    inst(48, '2025-05-30', '60685.71', '55723.69', '4962.02', '698000.55', 'Paid'),
    inst(49, '2025-06-30', '60685.71', '56090.54', '4595.17', '641910.01', 'Paid'),
    inst(50, '2025-07-30', '60685.71', '56459.80', '4225.91', '585450.21', 'Paid'),
    inst(51, '2025-08-30', '60685.71', '56831.50', '3854.21', '528618.71', 'Paid'),
    inst(52, '2025-09-30', '60685.71', '57205.64', '3480.07', '471413.07', 'Paid'),
    inst(53, '2025-10-30', '60685.71', '57582.24', '3103.47', '413830.83', 'Paid'),
    inst(54, '2025-11-30', '60685.71', '57961.32', '2724.39', '355869.51', 'Paid'),
    inst(55, '2025-12-30', '60685.71', '58342.90', '2342.81', '297526.61', 'Paid'),
    inst(56, '2026-01-30', '60685.71', '58726.99', '1958.72', '238799.62', 'Paid'),
    inst(57, '2026-02-30', '60685.71', '59113.61', '1572.10', '179686.01', 'Paid'),
    inst(58, '2026-03-30', '60685.71', '59502.78', '1182.93', '120183.23', 'Paid'),
    inst(59, '2026-04-30', '60685.71', '59894.50', '791.21', '60288.73', 'Paid'),
    inst(60, '2026-05-30', '60685.63', '60288.73', '396.90', '0.00', 'Paid'),
  ],
}
