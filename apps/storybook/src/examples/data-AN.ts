/*
 * Group AN's example data (P5.59): foreign currency at Kvadrat Gradnja d.o.o. on 14.10.2026 —
 * "Illustrative NBS middle rates" (invented values, never the bank's list), the foreign-currency
 * accounts with their value in dinars, and the open items in foreign currency revalued at the
 * day's middle rate. The invoice in euros is F-2026-0415 to Donau Bau GmbH (group D2's screen,
 * data-D2.ts). Every rate, value and difference is the Core's, written here as decimal strings;
 * the ledger's balances in dinars are data-AK.ts's. Not part of the package. No classes here.
 */

export const AN_ROUTES = {
  rates: '/accounting/currencies/rates',
  accounts: '/accounting/currencies/accounts',
  revaluation: '/accounting/currencies/revaluation',
  /** The revaluation with "Post differences" asked. */
  revaluationPost: '/accounting/currencies/revaluation?post',
  /** The invoice in euros (group D2). */
  eurInvoice: '/sales/invoices/F-2026-0415',
}

/** One currency of the list: country, unit and the three rates, decimal strings. */
export interface ExchangeRate {
  code: string
  /** ISO 4217 numeric code. */
  number: string
  country: string
  unit: number
  buying: string
  middle: string
  selling: string
}

export const RATE_LIST = {
  number: '198',
  date: '2026-10-14',
  /** When the list applies from, as the Core writes it. */
  applies: 'Applies from 14.10.2026. 08:00',
}

export const RATES: readonly ExchangeRate[] = [
  {
    code: 'EUR',
    number: '978',
    country: 'European Monetary Union',
    unit: 1,
    buying: '116.8699',
    middle: '117.2216',
    selling: '117.5733',
  },
  {
    code: 'USD',
    number: '840',
    country: 'United States',
    unit: 1,
    buying: '100.5717',
    middle: '100.8743',
    selling: '101.1769',
  },
  {
    code: 'CHF',
    number: '756',
    country: 'Switzerland',
    unit: 1,
    buying: '124.9621',
    middle: '125.3381',
    selling: '125.7141',
  },
  {
    code: 'GBP',
    number: '826',
    country: 'United Kingdom',
    unit: 1,
    buying: '134.6361',
    middle: '135.0412',
    selling: '135.4463',
  },
  {
    code: 'JPY',
    number: '392',
    country: 'Japan',
    unit: 100,
    buying: '67.1086',
    middle: '67.3105',
    selling: '67.5124',
  },
  {
    code: 'CNY',
    number: '156',
    country: 'China',
    unit: 1,
    buying: '14.1109',
    middle: '14.1534',
    selling: '14.1959',
  },
  {
    code: 'BAM',
    number: '977',
    country: 'Bosnia and Herzegovina',
    unit: 1,
    buying: '59.7541',
    middle: '59.9339',
    selling: '60.1137',
  },
  {
    code: 'HUF',
    number: '348',
    country: 'Hungary',
    unit: 100,
    buying: '29.7228',
    middle: '29.8122',
    selling: '29.9016',
  },
  {
    code: 'CAD',
    number: '124',
    country: 'Canada',
    unit: 1,
    buying: '73.2314',
    middle: '73.4518',
    selling: '73.6722',
  },
  {
    code: 'AUD',
    number: '036',
    country: 'Australia',
    unit: 1,
    buying: '66.0819',
    middle: '66.2807',
    selling: '66.4795',
  },
  {
    code: 'SEK',
    number: '752',
    country: 'Sweden',
    unit: 1,
    buying: '10.3534',
    middle: '10.3846',
    selling: '10.4158',
  },
  {
    code: 'NOK',
    number: '578',
    country: 'Norway',
    unit: 1,
    buying: '9.5824',
    middle: '9.6112',
    selling: '9.6400',
  },
  {
    code: 'DKK',
    number: '208',
    country: 'Denmark',
    unit: 1,
    buying: '15.6621',
    middle: '15.7092',
    selling: '15.7563',
  },
  {
    code: 'CZK',
    number: '203',
    country: 'Czechia',
    unit: 1,
    buying: '4.7277',
    middle: '4.7419',
    selling: '4.7561',
  },
  {
    code: 'PLN',
    number: '985',
    country: 'Poland',
    unit: 1,
    buying: '27.3528',
    middle: '27.4351',
    selling: '27.5174',
  },
]

// ── Foreign-currency accounts ─────────────────────────────────────────────────────────────────

/** A foreign-currency account: its balance in the currency and in dinars. */
export interface FxAccount {
  account: string
  name: string
  bank: string
  iban: string
  currency: string
  /** The balance in the account's currency. */
  balance: string
  /** The middle rate of the day. */
  rate: string
  /** The balance at the day's middle rate. */
  value: string
  /** The dinars the ledger holds for it (data-AK.ts). */
  booked: string
  /** The value less the booked dinars: what a revaluation would post. */
  difference: string
}

export const FX_ACCOUNTS: readonly FxAccount[] = [
  {
    account: '2440',
    name: 'FX account EUR',
    bank: 'Banca Intesa',
    iban: 'RS35 1600 0000 0045 6789 01',
    currency: 'EUR',
    balance: '20015.23',
    rate: '117.2216',
    value: '2346217.28',
    booked: '2344790.20',
    difference: '1427.08',
  },
  {
    account: '2441',
    name: 'FX account EUR',
    bank: 'Raiffeisen banka',
    iban: 'RS35 2650 0000 0012 3456 78',
    currency: 'EUR',
    balance: '0.00',
    rate: '117.2216',
    value: '0.00',
    booked: '0.00',
    difference: '0.00',
  },
  {
    account: '2442',
    name: 'FX account USD',
    bank: 'Banca Intesa',
    iban: 'RS35 1600 0000 0045 6789 02',
    currency: 'USD',
    balance: '3162.06',
    rate: '100.8743',
    value: '318970.59',
    booked: '318450.75',
    difference: '519.84',
  },
]

/** The accounts' value in dinars at the day's rates, and their balance by currency. */
export const FX_TOTALS = {
  value: '2665187.87',
  booked: '2663240.95',
  difference: '1946.92',
  byCurrency: [
    { currency: 'EUR', balance: '20015.23' },
    { currency: 'USD', balance: '3162.06' },
  ],
}

// ── Exchange-rate differences on 14.10.2026 ───────────────────────────────────────────────────

/** An open item in foreign currency, revalued at the day's middle rate. */
export interface RevaluedItem {
  id: string
  account: string
  document: string
  kind: string
  partner: string
  currency: string
  amount: string
  /** The rate it was booked at; null for an account's balance (booked over time). */
  bookedRate: string | null
  booked: string
  rate: string
  revalued: string
  /** A gain (revenue 6630) or a loss (expense 5630); the other one is null. */
  positive: string | null
  negative: string | null
}

export const REVALUATION = {
  date: '2026-10-14',
  number: 'NK-2026-0951',
  items: [
    {
      id: 'r1',
      account: '2050',
      document: 'F-2026-0371',
      kind: 'Invoice',
      partner: 'Donau Bau GmbH',
      currency: 'EUR',
      amount: '10080.26',
      bookedRate: '117.2440',
      booked: '1181850.00',
      rate: '117.2216',
      revalued: '1181624.21',
      positive: null,
      negative: '225.79',
    },
    {
      id: 'r2',
      account: '2050',
      document: 'F-2026-0415',
      kind: 'Invoice',
      partner: 'Donau Bau GmbH',
      currency: 'EUR',
      amount: '10658.50',
      bookedRate: '117.1825',
      booked: '1248989.67',
      rate: '117.2216',
      revalued: '1249406.42',
      positive: '416.75',
      negative: null,
    },
    {
      id: 'r3',
      account: '4360',
      document: 'BH-2026-0093',
      kind: 'Supplier invoice',
      partner: 'Baumaschinen Huber GmbH',
      currency: 'EUR',
      amount: '12017.31',
      bookedRate: '117.1577',
      booked: '1407920.40',
      rate: '117.2216',
      revalued: '1408688.31',
      positive: null,
      negative: '767.91',
    },
    {
      id: 'r4',
      account: '2440',
      document: 'FX account EUR',
      kind: 'Banca Intesa',
      partner: 'Banca Intesa',
      currency: 'EUR',
      amount: '20015.23',
      bookedRate: null,
      booked: '2344790.20',
      rate: '117.2216',
      revalued: '2346217.28',
      positive: '1427.08',
      negative: null,
    },
    {
      id: 'r5',
      account: '2442',
      document: 'FX account USD',
      kind: 'Banca Intesa',
      partner: 'Banca Intesa',
      currency: 'USD',
      amount: '3162.06',
      bookedRate: null,
      booked: '318450.75',
      rate: '100.8743',
      revalued: '318970.59',
      positive: '519.84',
      negative: null,
    },
  ] satisfies RevaluedItem[],
  positive: '2363.67',
  negative: '993.70',
  net: '1369.97',
  /** The journal entry the posting makes, as the Core proposes it. */
  journal: [
    { id: 'j1', account: '2050 Customers abroad, F-2026-0415', debit: '416.75', credit: null },
    { id: 'j1b', account: '2050 Customers abroad, F-2026-0371', debit: null, credit: '225.79' },
    { id: 'j2', account: '2440 FX account EUR, Banca Intesa', debit: '1427.08', credit: null },
    { id: 'j3', account: '2442 FX account USD, Banca Intesa', debit: '519.84', credit: null },
    { id: 'j4', account: '4360 Suppliers abroad', debit: null, credit: '767.91' },
    { id: 'j5', account: '6630 Positive exchange differences', debit: null, credit: '2363.67' },
    { id: 'j6', account: '5630 Negative exchange differences', debit: '993.70', credit: null },
  ],
  journalTotal: '3357.37',
}
