/*
 * Fictitious data for the template stories (realistic Serbian companies and people; the
 * interface text stays English, the Core translates). Not part of the package: nothing in
 * src/index.ts imports this file. No classes here: Storybook compiles classes only from
 * *.stories.tsx files.
 */
import {
  BookOpen,
  Building,
  Building2,
  ChartColumn,
  Landmark,
  LogOut,
  Package,
  Receipt,
  Settings,
  ShoppingCart,
  UserRound,
  Users,
  Wallet,
} from 'lucide-react'
import type { BrandLockupProps } from '../components/brand-lockup'
import type { Crumb } from '../components/navigation'
import { LIRO_BRAND } from '../components/story-brand'
import type { CommandItem } from '../components/command-palette'
import type { ModuleTab, ShellCompany, ShellUser } from './app-shell'
import type { LaunchpadModule } from './launchpad'

export const BRAND: BrandLockupProps = { ...LIRO_BRAND, href: '#home' }

export const CRUMBS: Crumb[] = [
  { label: 'Sales', href: '#sales' },
  { label: 'Invoices', href: '#sales/invoices' },
  { label: 'F-2026-0412' },
]

export const SALES_TABS: ModuleTab[] = [
  { key: 'invoices', label: 'Invoices', href: '#sales/invoices', current: true },
  { key: 'quotes', label: 'Quotes', href: '#sales/quotes' },
  { key: 'orders', label: 'Orders', href: '#sales/orders' },
  { key: 'customers', label: 'Customers', href: '#sales/customers' },
  { key: 'prices', label: 'Price lists', href: '#sales/price-lists' },
  { key: 'reports', label: 'Reports', href: '#sales/reports' },
]

/** Recently used first, as the Core orders them. */
export const COMPANIES: ShellCompany[] = [
  { id: 'kvadrat', name: 'Kvadrat Gradnja d.o.o.', description: 'PIB 108452317', waiting: 3 },
  { id: 'panonija', name: 'Panonija Agro d.o.o.', description: 'PIB 104987265' },
  { id: 'bojovic', name: 'Bojović i sinovi d.o.o.', description: 'PIB 109773148', waiting: 12 },
]

export const MANY_COMPANIES: ShellCompany[] = [
  ...COMPANIES,
  { id: 'drina', name: 'Drina Prevoz d.o.o.', description: 'PIB 101665092' },
  { id: 'stanic', name: 'Stanić Elektro STR', description: 'PIB 112048376', waiting: 1 },
  { id: 'vojvodjanka', name: 'Vojvođanka Mlin a.d.', description: 'PIB 100421987' },
  { id: 'jelic', name: 'Knjigovodstvo Jelić', description: 'PIB 110583224' },
  { id: 'zlatibor', name: 'Zlatibor Turs d.o.o.', description: 'PIB 106234871' },
  { id: 'medic', name: 'Medic Lab Niš d.o.o.', description: 'PIB 107819450', waiting: 5 },
  { id: 'rakic', name: 'Rakić Pekara SZR', description: 'PIB 111296603' },
]

export const USER: ShellUser = {
  name: 'Milica Petrović',
  email: 'milica.petrovic@kvadratgradnja.rs',
  entries: [
    { label: 'Profile', icon: UserRound, onSelect: () => undefined },
    { label: 'Company settings', icon: Building2, onSelect: () => undefined },
    { label: 'Preferences', icon: Settings, onSelect: () => undefined },
    { type: 'separator' },
    { label: 'Sign out', icon: LogOut, onSelect: () => undefined },
  ],
}

export const COMMANDS: CommandItem[] = [
  { id: 'new-invoice', label: 'New invoice', group: 'actions', onSelect: () => undefined },
  { id: 'new-customer', label: 'New customer', group: 'actions', onSelect: () => undefined },
  { id: 'go-invoices', label: 'Invoices', group: 'navigation', onSelect: () => undefined },
  { id: 'go-customers', label: 'Customers', group: 'navigation', onSelect: () => undefined },
  { id: 'go-ledger', label: 'General ledger', group: 'navigation', onSelect: () => undefined },
]

export interface InvoiceRow {
  id: string
  number: string
  customer: string
  issued: string
  due: string
  total: string
  status: 'Draft' | 'Sent' | 'Paid' | 'Overdue' | 'Partially paid'
}

export const INVOICES: InvoiceRow[] = [
  {
    id: '1',
    number: 'F-2026-0412',
    customer: 'Panonija Agro d.o.o.',
    issued: '2026-09-28',
    due: '2026-10-13',
    total: '12345.60',
    status: 'Sent',
  },
  {
    id: '2',
    number: 'F-2026-0411',
    customer: 'Drina Prevoz d.o.o.',
    issued: '2026-09-26',
    due: '2026-10-03',
    total: '4870.00',
    status: 'Overdue',
  },
  {
    id: '3',
    number: 'F-2026-0410',
    customer: 'Medic Lab Niš d.o.o.',
    issued: '2026-09-25',
    due: '2026-10-25',
    total: '186420.35',
    status: 'Partially paid',
  },
  {
    id: '4',
    number: 'F-2026-0409',
    customer: 'Stanić Elektro STR',
    issued: '2026-09-22',
    due: '2026-10-07',
    total: '23918.40',
    status: 'Paid',
  },
  {
    id: '5',
    number: 'F-2026-0408',
    customer: 'Vojvođanka Mlin a.d.',
    issued: '2026-09-19',
    due: '2026-10-19',
    total: '61204.75',
    status: 'Draft',
  },
]

/** The modules of a mid-sized company, in the user's order. */
export const MODULES: LaunchpadModule[] = [
  {
    id: 'sales',
    name: 'Sales',
    description: 'Invoices, quotes, customers',
    icon: Receipt,
    href: '#sales',
    counter: '3 to send',
  },
  {
    id: 'purchasing',
    name: 'Purchasing',
    description: 'Supplier invoices and orders',
    icon: ShoppingCart,
    href: '#purchasing',
    counter: '7 to approve',
  },
  {
    id: 'banking',
    name: 'Banking',
    description: 'Statements and payments',
    icon: Landmark,
    href: '#banking',
    counter: '2 statements',
  },
  {
    id: 'accounting',
    name: 'Accounting',
    description: 'General ledger, journal entries, VAT',
    icon: BookOpen,
    href: '#accounting',
  },
  {
    id: 'inventory',
    name: 'Inventory',
    description: 'Items, warehouses, stock counts',
    icon: Package,
    href: '#inventory',
    counter: '14 below minimum',
  },
  {
    id: 'hr',
    name: 'Employees',
    description: 'Records, contracts, leave',
    icon: Users,
    href: '#hr',
    counter: '1 leave request',
  },
  {
    id: 'payroll',
    name: 'Payroll',
    description: 'September 2026 due on 15.10.',
    icon: Wallet,
    href: '#payroll',
  },
  {
    id: 'reports',
    name: 'Reports',
    description: 'Balance sheet, income statement',
    icon: ChartColumn,
    href: '#reports',
  },
  {
    id: 'assets',
    name: 'Fixed assets',
    description: 'Register and depreciation',
    icon: Building,
    href: '#assets',
    locked: 'Available in Pro',
  },
]

/** One of MODULES by id. */
export function moduleById(id: string): LaunchpadModule {
  const found = MODULES.find((module) => module.id === id)
  if (found === undefined) throw new Error(`No story module ${id}`)
  return found
}

/** A fuller invoice list (the list page and the examples). */
export const INVOICE_LIST: InvoiceRow[] = [
  ...INVOICES,
  {
    id: '6',
    number: 'F-2026-0407',
    customer: 'Bojović i sinovi d.o.o.',
    issued: '2026-09-18',
    due: '2026-10-02',
    total: '9450.00',
    status: 'Overdue',
  },
  {
    id: '7',
    number: 'F-2026-0406',
    customer: 'Zlatibor Turs d.o.o.',
    issued: '2026-09-17',
    due: '2026-10-17',
    total: '33612.80',
    status: 'Sent',
  },
  {
    id: '8',
    number: 'F-2026-0405',
    customer: 'Rakić Pekara SZR',
    issued: '2026-09-15',
    due: '2026-09-30',
    total: '2184.50',
    status: 'Paid',
  },
  {
    id: '9',
    number: 'F-2026-0404',
    customer: 'Knjigovodstvo Jelić',
    issued: '2026-09-12',
    due: '2026-09-27',
    total: '14400.00',
    status: 'Paid',
  },
  {
    id: '10',
    number: 'F-2026-0403',
    customer: 'Panonija Agro d.o.o.',
    issued: '2026-09-10',
    due: '2026-10-10',
    total: '247809.12',
    status: 'Sent',
  },
]

/** Supplier invoices waiting for approval (the worklist). */
export interface ApprovalRow {
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

export const APPROVALS: ApprovalRow[] = [
  {
    id: 'u1',
    number: 'UF-2026-1187',
    supplier: 'EPS Snabdevanje d.o.o.',
    received: '2026-10-01',
    due: '2026-10-15',
    total: '48216.90',
    status: 'To approve',
    costCenter: 'Proizvodnja Novi Sad',
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
    costCenter: 'Uprava',
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
    costCenter: 'Magacin Zrenjanin',
    requester: 'Dragan Ilić',
  },
  {
    id: 'u4',
    number: 'UF-2026-1179',
    supplier: 'Metalac Proizvodnja a.d.',
    received: '2026-09-27',
    due: '2026-10-27',
    total: '386400.00',
    status: 'Query sent',
    costCenter: 'Proizvodnja Novi Sad',
    requester: 'Nikola Stojanović',
  },
  {
    id: 'u5',
    number: 'UF-2026-1176',
    supplier: 'NIS a.d. Novi Sad',
    received: '2026-09-26',
    due: '2026-10-11',
    total: '27345.60',
    status: 'To approve',
    costCenter: 'Vozni park',
    requester: 'Marko Đorđević',
  },
]
