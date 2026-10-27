import type { Meta, StoryObj } from '@storybook/react-vite'
import {
  BookOpen,
  CalendarDays,
  CalendarCheck,
  ClipboardList,
  FileText,
  FlaskConical,
  Languages,
  LifeBuoy,
  LogOut,
  House,
  MessageSquare,
  Package,
  Pill,
  Receipt,
  UserRound,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Banner } from '../components/alert'
import { Button } from '../components/button'
import { KeyValueList, SectionCard } from '../components/cards'
import { DateText, MoneyText } from '../components/display-text'
import type { MenuEntry } from '../components/dropdown-menu'
import { StatusBadge } from '../components/status-badge'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { settle } from '../primitives/story-helpers'
import { PortalShell, type PortalSection, type PortalShellProps } from './portal-shell'

const MENU: MenuEntry[] = [
  { label: 'My details', icon: UserRound, onSelect: () => undefined },
  { label: 'Language: English', icon: Languages, onSelect: () => undefined },
  { type: 'separator' },
  { label: 'Sign out', icon: LogOut, onSelect: () => undefined },
]

const PATIENT_SECTIONS: PortalSection[] = [
  { key: 'home', label: 'Home', href: '#home', icon: House, current: true },
  { key: 'appointments', label: 'Appointments', href: '#appointments', icon: CalendarDays },
  { key: 'results', label: 'Results', href: '#results', icon: FlaskConical, note: '1 new' },
  { key: 'messages', label: 'Messages', href: '#messages', icon: MessageSquare, note: '2 new' },
]

const PATIENT: PortalShellProps = {
  brand: { brandName: 'Dom zdravlja', productName: 'Novi Sad', href: '#home' },
  participant: { name: 'Jovana Nikolić', detail: 'Patient · LBO 10234567891' },
  menu: MENU,
  sections: PATIENT_SECTIONS,
  footer: 'Dom zdravlja Novi Sad · Bulevar cara Lazara 75 · Appointments 021 4879 000, 07–19 h',
  children: null,
}

/** The width of a portal page: one column, centred on wide screens. */
function Page({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="mx-auto box-border flex w-full max-w-3xl flex-col gap-4 p-4 sm:p-6">
      <h1 className={cn('m-0 text-h2 text-primary', TEXT_DIRECTION)}>{title}</h1>
      {children}
    </div>
  )
}

/** One thing on the home page: what, when or from whom, and its one action. */
function HomeRow(props: { title: string; detail: ReactNode; action?: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-0 border-b border-solid border-default pb-3 last:border-b-0 last:pb-0">
      <div className="flex min-w-0 flex-1 basis-56 flex-col gap-0.5">
        <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
          {props.title}
        </span>
        <span className={cn('text-sm text-secondary', TEXT_DIRECTION)}>{props.detail}</span>
      </div>
      {props.action}
    </li>
  )
}

/**
 * A portal's home shows only what matters now (P5.93 item 11, the owner's review): the quick
 * actions, what the person has to do, and what is new for them — no grid of equal cards.
 */
function PatientHome() {
  return (
    <Page title="Hello, Jovana">
      <div className="flex flex-wrap gap-2">
        <Button family="neutral" icon={MessageSquare} label="Write to your doctor" />
        <Button family="neutral" icon={Pill} label="Renew a prescription" />
        <Button intent="create" emphasis="primary" label="Book an appointment" />
      </div>
      <SectionCard title="To do" headingLevel={2}>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          <HomeRow
            title="Confirm your laboratory appointment"
            detail={
              <>
                <DateText value="2026-10-27" /> · 13:40 · Laboratorija, ground floor
              </>
            }
            action={<Button family="neutral" icon={CalendarCheck} label="Confirm" />}
          />
          <HomeRow
            title="A new result: blood count and glucose"
            detail={
              <>
                From the laboratory, <DateText value="2026-10-10" />
              </>
            }
            action={<Button family="neutral" icon={FlaskConical} label="Open result" />}
          />
        </ul>
      </SectionCard>
      <SectionCard title="New for you" headingLevel={2}>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          <HomeRow
            title="dr Marko Stanković: your prescription is renewed"
            detail={
              <>
                Message, <DateText value="2026-10-12" />
              </>
            }
          />
          <HomeRow
            title="Flu vaccines from 1 November"
            detail="Dom zdravlja Novi Sad · no appointment needed at the vaccination point"
          />
        </ul>
      </SectionCard>
    </Page>
  )
}

const PARENT_SECTIONS: PortalSection[] = [
  { key: 'grades', label: 'Grades', href: '#grades', icon: BookOpen, current: true },
  { key: 'attendance', label: 'Attendance', href: '#attendance', icon: CalendarCheck },
  { key: 'timetable', label: 'Timetable', href: '#timetable', icon: ClipboardList },
  { key: 'messages', label: 'Messages', href: '#messages', icon: MessageSquare, note: '1 new' },
]

function Grades() {
  return (
    <Page title="Grades">
      <SectionCard
        title="Luka Jovanović, 6th grade, class 6/2"
        description="First term, 2026/27"
        headingLevel={2}
      >
        <KeyValueList
          items={[
            { label: 'Serbian language', value: '5, 4, 5', numeric: true },
            { label: 'Mathematics', value: '4, 3', numeric: true },
            { label: 'English language', value: '5', numeric: true },
            { label: 'History', value: '4', numeric: true },
            { label: 'Physics', value: '5, 5', numeric: true },
            { label: 'Physical education', value: '5', numeric: true },
          ]}
        />
      </SectionCard>
    </Page>
  )
}

const PARENT: PortalShellProps = {
  brand: { brandName: 'OŠ Jovan Popović', productName: 'Parents', href: '#home' },
  participant: { name: 'Ana Jovanović', detail: 'Parent of Luka Jovanović' },
  menu: [
    { label: 'Switch child: Mila Jovanović', icon: UserRound, onSelect: () => undefined },
    ...MENU,
  ],
  sections: PARENT_SECTIONS,
  banners: (
    <Banner tone="warning" title="No classes on Friday, 17 October">
      The school is a polling station. Classes continue on Monday.
    </Banner>
  ),
  children: null,
}

const CUSTOMER_SECTIONS: PortalSection[] = [
  { key: 'orders', label: 'Orders', href: '#orders', icon: Package },
  { key: 'invoices', label: 'Invoices', href: '#invoices', icon: Receipt, current: true },
  { key: 'documents', label: 'Documents', href: '#documents', icon: FileText },
  { key: 'support', label: 'Support', href: '#support', icon: LifeBuoy },
]

function Invoices() {
  return (
    <Page title="Invoices">
      <SectionCard title="Open invoices" headingLevel={2}>
        <ul className="m-0 flex list-none flex-col gap-3 p-0">
          {[
            { number: 'F-2026-0412', due: '2026-10-20', total: '248400.00', overdue: false },
            { number: 'F-2026-0381', due: '2026-09-30', total: '96300.50', overdue: true },
          ].map((invoice) => (
            <li
              key={invoice.number}
              className="flex flex-wrap items-center justify-between gap-2 border-0 border-b border-solid border-default pb-3 last:border-b-0 last:pb-0"
            >
              <div className="flex min-w-0 flex-col gap-0.5">
                <span className={cn('text-sm font-semibold text-primary', TEXT_DIRECTION)}>
                  {invoice.number}
                </span>
                <span className={cn('text-xs text-secondary', TEXT_DIRECTION)}>
                  Due <DateText value={invoice.due} />
                </span>
              </div>
              <div className="flex items-center gap-3">
                <MoneyText value={invoice.total} currency="RSD" className="text-sm" />
                <StatusBadge
                  label={invoice.overdue ? 'Overdue' : 'Open'}
                  tone={invoice.overdue ? 'danger' : 'neutral'}
                />
              </div>
            </li>
          ))}
        </ul>
      </SectionCard>
    </Page>
  )
}

const CUSTOMER: PortalShellProps = {
  brand: { brandName: 'Kvadrat Gradnja', productName: 'Customer portal', href: '#home' },
  participant: { name: 'Vojvođanka Mlin a.d.', detail: 'Customer 10042 · Dragan Ilić' },
  menu: MENU,
  sections: CUSTOMER_SECTIONS,
  footer: 'Kvadrat Gradnja d.o.o. · Temerinski put 51, Novi Sad · podrska@kvadrat-gradnja.rs',
  children: null,
}

const meta = {
  title: 'Templates/PortalShell',
  component: PortalShell,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** the frame of a portal for people outside the company — a patient, a ' +
          'parent, a student, a customer. The header (56px) has the brand (BrandLockup props: ' +
          'the application’s names, no logo inside) and the participant, whose menu holds ' +
          'their details, the language and signing out. A few sections (up to five): centred ' +
          'tabs on desktop, as the module tabs of AppShell (P5.93), a bottom navigation bar on phones within thumb reach, with the ' +
          'safe areas. A section’s note ("2 new") is small text on desktop and a dot on the ' +
          'icon on phones, read with the name. Portal-wide `banners` at the top of the content, ' +
          'the institution’s `footer` under it, a skip link first. Phone first.\n\n' +
          '**When:** a few pages for one person about their own records: appointments and ' +
          'results, grades and attendance, orders and invoices.\n\n' +
          '**When not:** the company’s own staff (AppShell with the launchpad and module tabs); ' +
          'signing in (AuthShell); more than five sections (the portal is too big: split it, or ' +
          'use AppShell).',
      },
    },
  },
  args: PATIENT,
  render: (args) => (
    <ExampleProvider>
      <PortalShell {...args} layout="desktop">
        <PatientHome />
      </PortalShell>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof PortalShell>

export default meta

type Story = StoryObj<typeof meta>

/** A patient portal: appointments, results, messages. */
/** The shell publishes its sticky header's height as --liro-shell-top (P5.28 item 4). */
async function expectShellTop(canvasElement: HTMLElement): Promise<void> {
  const shell = canvasElement.querySelector<HTMLElement>('[data-slot="portal-shell"]')
  const header = shell?.querySelector<HTMLElement>('header')
  if (shell === null || header === undefined || header === null) throw new Error('no shell')
  await waitFor(async () => {
    await expect(shell.style.getPropertyValue('--liro-shell-top')).toBe(
      `${String(header.offsetHeight)}px`,
    )
  })
}

export const Default: Story = {
  name: 'Patient portal',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const nav = within(canvas.getByRole('navigation', { name: 'Sections' }))
    await expect(nav.getByRole('link', { name: 'Home' })).toHaveAttribute('aria-current', 'page')
    // The home shows what matters now: the quick actions, the to-dos, what is new (P5.93).
    await expect(canvas.getByRole('heading', { name: 'To do' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Book an appointment' })).toBeVisible()
    // The sections are centred, as AppShell's module tabs (P5.93 item 11).
    const list = nav.getByRole('list')
    const first = list.firstElementChild?.getBoundingClientRect()
    const last = list.lastElementChild?.getBoundingClientRect()
    const box = list.getBoundingClientRect()
    if (first === undefined || last === undefined) throw new Error('no sections')
    await expect(Math.abs(first.left - box.left - (box.right - last.right))).toBeLessThanOrEqual(2)
    await expect(nav.getByRole('link', { name: 'Messages 2 new' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Account: Jovana Nikolić' })).toHaveTextContent(
      'Jovana Nikolić',
    )
    await expect(canvas.getByRole('link', { name: 'Skip to content' })).toBeInTheDocument()
    await expect(canvas.getByRole('contentinfo')).toHaveTextContent('Bulevar cara Lazara 75')
    // The header's height, for sticky parts of the page (as AppShell's).
    await expectShellTop(canvasElement)
  },
}

/** The patient portal on a phone: the sections in the bottom bar, notes as dots. */
export const PatientPhone: Story = {
  name: 'Patient portal, phone',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <PortalShell {...args} layout="phone">
          <PatientHome />
        </PortalShell>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const bar = canvasElement.querySelector<HTMLElement>('[data-slot="portal-bottom-bar"]')
    if (bar === null) throw new Error('no bottom bar')
    const links = within(bar).getAllByRole('link')
    await expect(links).toHaveLength(4)
    for (const link of links) {
      await expect(link.getBoundingClientRect().height).toBeGreaterThanOrEqual(56)
    }
    await expect(within(bar).getByRole('link', { name: 'Messages, 2 new' })).toBeVisible()
    await expect(canvas.queryByRole('button', { name: /Account/ })).toBeVisible()
    await expectShellTop(canvasElement)
  },
}

/** The participant menu open: who they are, then the application's entries. */
export const ParticipantMenu: Story = {
  tags: ['!dev'],
  name: 'Participant menu',
  args: { defaultMenuOpen: true },
  play: async () => {
    const menu = await within(document.body).findByRole('menu')
    await settle()
    await expect(within(menu).getByText('Patient · LBO 10234567891')).toBeVisible()
  },
}

/** Opening the participant menu. */
export const ParticipantMenuInteraction: Story = {
  name: 'Participant menu, interaction',
  tags: ['interaction', '!dev'],
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Account: Jovana Nikolić' }),
    )
    const menu = await within(document.body).findByRole('menu')
    await settle()
    await expect(within(menu).getByRole('menuitem', { name: 'Sign out' })).toBeVisible()
  },
}

/** A parent portal: a child's grades, attendance, timetable; a banner from the school. */
export const ParentPortal: Story = {
  name: 'Parent portal',
  args: PARENT,
  render: (args) => (
    <ExampleProvider>
      <PortalShell {...args} layout="desktop">
        <Grades />
      </PortalShell>
    </ExampleProvider>
  ),
}

/** The parent portal on a phone: four sections in the bottom bar. */
export const ParentPhone: Story = {
  tags: ['!dev'],
  name: 'Parent portal, phone',
  args: PARENT,
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <PortalShell {...args} layout="phone">
          <Grades />
        </PortalShell>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** A customer portal: orders, invoices, documents, support. */
export const CustomerPortal: Story = {
  name: 'Customer portal',
  args: CUSTOMER,
  render: (args) => (
    <ExampleProvider>
      <PortalShell {...args} layout="desktop">
        <Invoices />
      </PortalShell>
    </ExampleProvider>
  ),
}

/** The customer portal on a phone. */
export const CustomerPhone: Story = {
  tags: ['!dev'],
  name: 'Customer portal, phone',
  args: CUSTOMER,
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <PortalShell {...args} layout="phone">
          <Invoices />
        </PortalShell>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Long names: the participant's name is cut in the header and whole in the menu. */
export const LongText: Story = {
  tags: ['!dev'],
  name: 'Long text',
  args: {
    ...CUSTOMER,
    brand: {
      brandName: 'Kvadrat Gradnja',
      productName: 'Portal za kupce i poslovne partnere',
      href: '#home',
    },
    participant: {
      name: 'Poljoprivredno-industrijski kombinat Vojvođanka Mlin a.d. Novi Sad',
      detail: 'Customer 10042 · Dragan Ilić, commercial director for the region of Bačka',
    },
    sections: [
      ...CUSTOMER_SECTIONS.slice(0, 3),
      {
        key: 'support',
        label: 'Support and complaints',
        href: '#support',
        icon: LifeBuoy,
        note: '1 answer waiting',
      },
    ],
  },
  render: (args) => (
    <ExampleProvider>
      <PortalShell {...args} layout="desktop">
        <Invoices />
      </PortalShell>
    </ExampleProvider>
  ),
}

/** Long names on a phone: section names are cut in the bar and whole in their names. */
export const LongTextPhone: Story = {
  tags: ['!dev'],
  name: 'Long text, phone',
  args: LongText.args ?? {},
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <PortalShell {...args} layout="phone">
          <Invoices />
        </PortalShell>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const shell = canvasElement.querySelector<HTMLElement>('[data-slot="portal-shell"]')
    if (shell !== null) await expect(shell.scrollWidth).toBeLessThanOrEqual(shell.clientWidth)
  },
}

/** Arabic, on a phone: the bottom bar from the right. */
export const Arabic: Story = {
  tags: ['!dev'],
  render: () => (
    <PhoneFrame>
      <StoryProvider locale="ar">
        <PortalShell
          layout="phone"
          brand={{ brandName: 'مركز الصحة', productName: 'بوابتي', href: '#home' }}
          participant={{ name: 'سارة أحمد', detail: 'مريضة' }}
          menu={[{ label: 'تسجيل الخروج', icon: LogOut, onSelect: () => undefined }]}
          sections={[
            { key: 'a', label: 'المواعيد', href: '#a', icon: CalendarDays, current: true },
            { key: 'r', label: 'النتائج', href: '#r', icon: FlaskConical },
            { key: 'm', label: 'الرسائل', href: '#m', icon: MessageSquare, note: '٢ جديدة' },
          ]}
        >
          <div className="p-4">
            <h1 className={cn('m-0 text-h2 text-primary', TEXT_DIRECTION)}>المواعيد</h1>
          </div>
        </PortalShell>
      </StoryProvider>
    </PhoneFrame>
  ),
}

/** Japanese, on desktop. */
export const Japanese: Story = {
  tags: ['!dev'],
  render: () => (
    <StoryProvider locale="ja">
      <PortalShell
        layout="desktop"
        brand={{ brandName: 'さくら学園', productName: '保護者ポータル', href: '#home' }}
        participant={{ name: '佐藤 花子', detail: '佐藤 太郎の保護者' }}
        menu={[{ label: 'ログアウト', icon: LogOut, onSelect: () => undefined }]}
        sections={[
          { key: 'g', label: '成績', href: '#g', icon: BookOpen, current: true },
          { key: 'a', label: '出欠', href: '#a', icon: CalendarCheck },
          { key: 'm', label: 'メッセージ', href: '#m', icon: MessageSquare, note: '新着1件' },
        ]}
        footer="さくら学園 · 東京都"
      >
        <div className="p-6">
          <h1 className={cn('m-0 text-h2 text-primary', TEXT_DIRECTION)}>成績</h1>
        </div>
      </PortalShell>
    </StoryProvider>
  ),
}
