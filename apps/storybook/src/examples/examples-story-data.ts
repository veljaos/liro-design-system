/*
 * The one dataset of the example screens (P4.8): Kvadrat Gradnja d.o.o., a construction-materials
 * trader in Novi Sad, on 6 October 2026. The same invoice — F-2026-0412 to Panonija Agro d.o.o.,
 * total 185.954,00 RSD, amount due 135.954,00 RSD after an advance — appears in the list, the
 * document and the dashboard. Amounts are decimal strings, added here in whole paras where a total
 * is needed (the stories play the application; components never add). Not part of the package.
 * No classes here: Storybook compiles classes only from *.stories.tsx files.
 */
import type { CartesianChartProps } from '../../../../packages/ui/src/charts'

export interface ExampleInvoice {
  number: string
  customer: string
  taxId: string
  address: string
  issued: string
  due: string
  /** The invoice total with VAT. */
  total: string
  /** What is still to be paid. */
  open: string
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Partially paid' | 'Cancelled'
}

/** The invoice list's first page (1,284 invoices in all), newest first. */
export const INVOICES: ExampleInvoice[] = [
  {
    number: 'F-2026-0412',
    customer: 'Panonija Agro d.o.o.',
    taxId: '104987265',
    address: 'Novosadski put 14, 21241 Kać',
    issued: '2026-09-28',
    due: '2026-10-13',
    total: '185954.00',
    open: '135954.00',
    status: 'Sent',
  },
  {
    number: 'F-2026-0411',
    customer: 'Drina Prevoz d.o.o.',
    taxId: '101665092',
    address: 'Karađorđeva 9, 15300 Loznica',
    issued: '2026-09-26',
    due: '2026-10-03',
    total: '58440.00',
    open: '58440.00',
    status: 'Overdue',
  },
  {
    number: 'F-2026-0410',
    customer: 'Medic Lab Niš d.o.o.',
    taxId: '107819450',
    address: 'Bulevar Nemanjića 25, 18000 Niš',
    issued: '2026-09-25',
    due: '2026-10-25',
    // After decrease KO-2026-0009 (06.10.2026.): 186.420,35 − 18.657,60.
    total: '167762.75',
    open: '67762.75',
    status: 'Partially paid',
  },
  {
    number: 'F-2026-0409',
    customer: 'Stanić Elektro STR',
    taxId: '112048376',
    address: 'Cara Dušana 112, 21000 Novi Sad',
    issued: '2026-09-22',
    due: '2026-10-07',
    total: '23918.40',
    open: '0.00',
    status: 'Paid',
  },
  {
    number: 'F-2026-0408',
    customer: 'Vojvođanka Mlin a.d.',
    taxId: '100421987',
    address: 'Industrijska 4, 23000 Zrenjanin',
    issued: '2026-09-19',
    due: '2026-10-19',
    total: '61204.75',
    open: '61204.75',
    status: 'Draft',
  },
  {
    number: 'F-2026-0407',
    customer: 'Bojović i sinovi d.o.o.',
    taxId: '109773148',
    address: 'Kralja Petra I 31, 11300 Smederevo',
    issued: '2026-09-18',
    due: '2026-10-02',
    total: '94500.00',
    // Cancelled on 06.10.2026. by ST-2026-0004.
    open: '0.00',
    status: 'Cancelled',
  },
  {
    number: 'F-2026-0406',
    customer: 'Zlatibor Turs d.o.o.',
    taxId: '106234871',
    address: 'Tržni centar 3, 31315 Zlatibor',
    issued: '2026-09-17',
    due: '2026-10-17',
    total: '33612.80',
    open: '33612.80',
    status: 'Sent',
  },
  {
    number: 'F-2026-0405',
    customer: 'Rakić Pekara SZR',
    taxId: '111296603',
    address: 'Njegoševa 7, 21000 Novi Sad',
    issued: '2026-09-15',
    due: '2026-09-30',
    total: '21845.00',
    open: '0.00',
    status: 'Paid',
  },
  {
    number: 'F-2026-0404',
    customer: 'Knjigovodstvo Jelić',
    taxId: '110583224',
    address: 'Zmaj Jovina 12, 21000 Novi Sad',
    issued: '2026-09-12',
    due: '2026-09-27',
    total: '14400.00',
    open: '0.00',
    status: 'Paid',
  },
  {
    number: 'F-2026-0403',
    customer: 'Panonija Agro d.o.o.',
    taxId: '104987265',
    address: 'Novosadski put 14, 21241 Kać',
    issued: '2026-09-10',
    due: '2026-10-10',
    total: '247809.12',
    open: '247809.12',
    status: 'Sent',
  },
]

/** The invoice the walk-through opens. */
export const FEATURED = 'F-2026-0412'

export interface ExampleLine {
  id: string
  item: string
  quantity: string
  unit: string
  price: string
  /** The tax category and its rate, as the e-invoice system names them ("S 20%", "E"). */
  vat: 'S 20%' | 'S 10%' | 'E'
  amount: string
}

/** The lines of F-2026-0412: three tax categories (S 20%, S 10% and E, an exempt deposit). */
export const LINES: ExampleLine[] = [
  {
    id: '1',
    item: 'Cement CEM II 42,5 R, 25 kg',
    quantity: '120',
    unit: 'bag',
    price: '685.00',
    vat: 'S 20%',
    amount: '82200.00',
  },
  {
    id: '2',
    item: 'Armature mesh Q188, 2,15 × 6 m',
    quantity: '18',
    unit: 'pc',
    price: '2940.00',
    vat: 'S 20%',
    amount: '52920.00',
  },
  {
    id: '3',
    item: 'Transport Novi Sad – Kać',
    quantity: '1',
    unit: 'trip',
    price: '9800.00',
    vat: 'S 20%',
    amount: '9800.00',
  },
  {
    id: '4',
    item: 'Technical drawings, printed set',
    quantity: '2',
    unit: 'set',
    price: '4250.00',
    vat: 'S 10%',
    amount: '8500.00',
  },
  {
    id: '5',
    item: 'Pallet deposit, returnable',
    quantity: '6',
    unit: 'pc',
    price: '450.00',
    vat: 'E',
    amount: '2700.00',
  },
]

/**
 * The totals of F-2026-0412 as the application sends them: bases 144.920,00 (20%) and 8.500,00
 * (10%), VAT 28.984,00 and 850,00, the exempt deposit 2.700,00; total 185.954,00; advance
 * A-2026-031 of 50.000,00 deducted; amount due 135.954,00.
 */
export const TOTALS = {
  base20: '144920.00',
  vat20: '28984.00',
  base10: '8500.00',
  vat10: '850.00',
  exempt: '2700.00',
  total: '185954.00',
  advance: '-50000.00',
  due: '135954.00',
}

/** Months April–September 2026. */
const MONTHS = [
  { key: '2026-04', label: 'Apr' },
  { key: '2026-05', label: 'May' },
  { key: '2026-06', label: 'Jun' },
  { key: '2026-07', label: 'Jul' },
  { key: '2026-08', label: 'Aug' },
  { key: '2026-09', label: 'Sep' },
]

/** Revenue 2026 against 2025, thousands of RSD. */
export const REVENUE: CartesianChartProps = {
  title: 'Revenue',
  description: 'Thousands of RSD, without VAT',
  categories: MONTHS,
  series: [
    { key: 'y2026', label: '2026' },
    { key: 'y2025', label: '2025' },
  ],
  values: {
    y2026: {
      '2026-04': '4812.4',
      '2026-05': '5230.9',
      '2026-06': '4977.1',
      '2026-07': '3906.5',
      '2026-08': '4421.8',
      '2026-09': '5684.2',
    },
    y2025: {
      '2026-04': '4390.2',
      '2026-05': '4718.6',
      '2026-06': '4655.0',
      '2026-07': '3711.3',
      '2026-08': '3958.7',
      '2026-09': '4870.1',
    },
  },
  decimals: 1,
}

/** Cash at month end, thousands of RSD. */
export const CASH: CartesianChartProps = {
  title: 'Cash at month end',
  description: 'Thousands of RSD, all accounts',
  categories: MONTHS,
  series: [{ key: 'cash', label: 'Cash' }],
  values: {
    cash: {
      '2026-04': '2486.3',
      '2026-05': '2894.1',
      '2026-06': '2078.6',
      '2026-07': '1662.9',
      '2026-08': '2215.4',
      '2026-09': '3012.8',
    },
  },
  decimals: 1,
}

/** The open invoices of the list, largest amount due first (the dashboard's table). */
export const LARGEST_OPEN = INVOICES.filter(
  (invoice) => invoice.open !== '0.00' && invoice.status !== 'Draft',
)
  .slice()
  .sort((a, b) => Number(b.open) - Number(a.open))
  .slice(0, 5)

/** Supplier invoices waiting for approval. */
export interface ExampleApproval {
  id: string
  number: string
  supplier: string
  received: string
  due: string
  total: string
  status: 'To approve' | 'Query sent' | 'Overdue'
  costCenter: string
  requester: string
}

export const APPROVALS: ExampleApproval[] = [
  {
    id: 'u1',
    number: 'UF-2026-1187',
    supplier: 'EPS Snabdevanje d.o.o.',
    received: '2026-10-01',
    due: '2026-10-15',
    total: '48216.90',
    status: 'To approve',
    costCenter: 'Warehouse Novi Sad',
    requester: 'Dragan Ilić',
  },
  {
    id: 'u2',
    number: 'UF-2026-1186',
    supplier: 'Telekom Srbija a.d.',
    received: '2026-10-01',
    due: '2026-10-20',
    total: '12873.40',
    status: 'To approve',
    costCenter: 'Administration',
    requester: 'Jelena Marković',
  },
  {
    id: 'u3',
    number: 'UF-2026-1183',
    supplier: 'Gradska čistoća Novi Sad',
    received: '2026-09-29',
    due: '2026-10-04',
    total: '6520.00',
    status: 'Overdue',
    costCenter: 'Warehouse Zrenjanin',
    requester: 'Dragan Ilić',
  },
  {
    id: 'u4',
    number: 'UF-2026-1179',
    supplier: 'Beočinska fabrika cementa',
    received: '2026-09-27',
    due: '2026-10-27',
    total: '386400.00',
    status: 'Query sent',
    costCenter: 'Warehouse Novi Sad',
    requester: 'Nikola Petković',
  },
  {
    id: 'u5',
    number: 'UF-2026-1176',
    supplier: 'NIS a.d. Novi Sad',
    received: '2026-09-26',
    due: '2026-10-11',
    total: '27345.60',
    status: 'To approve',
    costCenter: 'Vehicles',
    requester: 'Marko Đorđević',
  },
]

/** The employee the walk-through opens. */
export const EMPLOYEE = {
  id: 'jelena-markovic',
  firstName: 'Jelena',
  lastName: 'Marković',
  name: 'Jelena Marković',
  position: 'Senior accountant',
  department: 'finance',
  since: '2021-03-01',
  contractEnd: '2026-12-31',
  birthDate: '1988-06-14',
  address: 'Bulevar oslobođenja 46, 21000 Novi Sad',
  phone: '+381 64 218 4473',
  email: 'jelena.markovic@kvadratgradnja.rs',
  manager: 'Dragan Ilić',
  gross: '145000.00',
  /** Net pay for September 2026, as the payroll computed it. */
  net: '98412.37',
  account: '160-0000012345678-21',
  contract: 'Fixed term',
  hours: '40 hours a week',
  leaveLeft: '14',
  leaveTaken: '6',
  /** The next approved leave. */
  nextLeave: { from: '2026-12-28', to: '2026-12-31' },
} as const

/** One line of a supplier invoice: the tax base and the VAT rate, as SEF delivers them. */
export interface ApprovalLine {
  item: string
  quantity: string
  unit: string
  vat: 'S 20%' | 'S 10%'
  /** Without VAT. */
  amount: string
}

/** What the approval detail shows beyond the row: the lines, the PDF and the goods receipt. */
export interface ApprovalDetailData {
  lines: ApprovalLine[]
  attachment: string
  purchaseOrder?: string
  /** The goods receipt for goods (none for services). */
  goods?: { state: 'Complete' | 'Partial'; date: string }
}

/**
 * The lines of each invoice to approve. Bases and VAT add up to the totals above: u1 40.180,75 +
 * 8.036,15; u2 10.727,83 + 2.145,57; u3 5.927,27 + 592,73 (10%); u4 322.000,00 + 64.400,00; u5
 * 22.788,00 + 4.557,60.
 */
export const APPROVAL_DETAILS: Record<string, ApprovalDetailData> = {
  u1: {
    attachment: 'UF-2026-1187.pdf',
    lines: [
      {
        item: 'Electricity, higher tariff, September',
        quantity: '3120',
        unit: 'kWh',
        vat: 'S 20%',
        amount: '30732.00',
      },
      {
        item: 'Electricity, lower tariff, September',
        quantity: '1450',
        unit: 'kWh',
        vat: 'S 20%',
        amount: '6090.00',
      },
      { item: 'Network fee', quantity: '1', unit: 'mo', vat: 'S 20%', amount: '3358.75' },
    ],
  },
  u2: {
    attachment: 'UF-2026-1186.pdf',
    lines: [
      {
        item: 'Mobile subscriptions, 12 lines',
        quantity: '12',
        unit: 'pc',
        vat: 'S 20%',
        amount: '8280.00',
      },
      {
        item: 'Business internet 500 Mbit/s',
        quantity: '1',
        unit: 'mo',
        vat: 'S 20%',
        amount: '2447.83',
      },
    ],
  },
  u3: {
    attachment: 'UF-2026-1183.pdf',
    lines: [
      {
        item: 'Waste collection, September',
        quantity: '1',
        unit: 'mo',
        vat: 'S 10%',
        amount: '5927.27',
      },
    ],
  },
  u4: {
    attachment: 'UF-2026-1179.pdf',
    purchaseOrder: 'N-2026-0151',
    goods: { state: 'Partial', date: '2026-09-26' },
    lines: [
      {
        item: 'Cement CEM II 42,5 R, 25 kg',
        quantity: '800',
        unit: 'bag',
        vat: 'S 20%',
        amount: '276000.00',
      },
      {
        item: 'Transport Beočin – Novi Sad',
        quantity: '4',
        unit: 'trip',
        vat: 'S 20%',
        amount: '46000.00',
      },
    ],
  },
  u5: {
    attachment: 'UF-2026-1176.pdf',
    purchaseOrder: 'N-2026-0157',
    goods: { state: 'Complete', date: '2026-09-26' },
    lines: [{ item: 'Eurodiesel', quantity: '120', unit: 'l', vat: 'S 20%', amount: '22788.00' }],
  },
}

/** The reasons the Core offers for rejecting a supplier invoice on SEF. */
export const REJECT_REASONS = [
  { value: 'price', label: 'Price differs from the order' },
  { value: 'quantity', label: 'Quantity differs from the delivery' },
  { value: 'duplicate', label: 'Invoice already received' },
  { value: 'other', label: 'Other' },
]
