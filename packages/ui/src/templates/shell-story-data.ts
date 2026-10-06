/*
 * Fictitious data for the template stories (realistic Serbian companies and people; the
 * interface text stays English, the Core translates). Not part of the package: nothing in
 * src/index.ts imports this file. No classes here: Storybook compiles classes only from
 * *.stories.tsx files.
 */
import { Building2, LogOut, Settings, UserRound } from 'lucide-react'
import type { BrandLockupProps } from '../components/brand-lockup'
import type { Crumb } from '../components/navigation'
import { LIRO_BRAND } from '../components/story-brand'
import type { CommandItem } from '../components/command-palette'
import type { ModuleTab, ShellCompany, ShellUser } from './app-shell'

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
