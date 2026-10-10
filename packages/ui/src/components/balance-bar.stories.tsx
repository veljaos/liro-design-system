import type { Meta, StoryObj } from '@storybook/react-vite'
import { BookCheck } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { LiroProvider, useLiro } from '../provider/liro-provider'
import type { LiroMessages } from '../provider/messages'
import { settle } from '../primitives/story-helpers'
import { UnavailableAction } from './actions'
import { BalanceBar, type BalanceState } from './balance-bar'
import { Button } from './button'
import { EditableGrid, type EditableGridColumn } from './editable-grid'
import type { GridMessage } from './editable-grid-logic'
import { decimal as decimalOf, paras as parasOf, sumUnits as sumParas } from './amounts-story-data'
import { ExampleProvider, PhoneFrame } from './story-frames'

/** One line of a journal entry, as the application keeps it. */
interface EntryLine {
  id: string
  account: { value: string; label: string } | null
  text: string
  debit: string | null
  credit: string | null
}

const ACCOUNTS = [
  { value: '2410', label: '2410 Current account, Banca Intesa' },
  { value: '2700', label: '2700 Input VAT 20%' },
  { value: '4350', label: '4350 Suppliers in the country' },
  { value: '5120', label: '5120 Construction materials' },
  { value: '5330', label: '5330 Equipment rental' },
]

const account = (value: string) => ACCOUNTS.find((each) => each.value === value) ?? null

/** Material and crane rental for the Temerinski put site, with input VAT, owed to the supplier. */
const LINES: EntryLine[] = [
  {
    id: '1',
    account: account('5120'),
    text: 'Material, Temerinski put',
    debit: '84600.00',
    credit: null,
  },
  {
    id: '2',
    account: account('5330'),
    text: 'Crane rental, September',
    debit: '36000.00',
    credit: null,
  },
  { id: '3', account: account('2700'), text: 'Input VAT 20%', debit: '24120.00', credit: null },
  {
    id: '4',
    account: account('4350'),
    text: 'Gradska mehanizacija d.o.o., UF-2026-1204',
    debit: null,
    credit: '144720.00',
  },
]

const COLUMNS: EditableGridColumn<EntryLine>[] = [
  {
    id: 'account',
    header: 'Account',
    type: 'combobox',
    width: 260,
    value: (line) => line.account,
    options: ACCOUNTS,
  },
  { id: 'text', header: 'Description', type: 'text', value: (line) => line.text },
  {
    id: 'debit',
    header: 'Debit',
    type: 'number',
    width: 140,
    decimals: 2,
    value: (line) => line.debit,
  },
  {
    id: 'credit',
    header: 'Credit',
    type: 'number',
    width: 140,
    decimals: 2,
    value: (line) => line.credit,
  },
]

/**
 * The application: it sums the debits and credits in whole paras, decides whether the entry
 * balances (the Core's rule), writes the row messages and keeps "Post" unavailable with its
 * reason while the entry does not balance.
 */
function JournalEntry({ layout }: { layout?: 'desktop' | 'phone' }) {
  const { format } = useLiro()
  const [lines, setLines] = useState(LINES)
  const empty = (line: EntryLine) => line.debit === null && line.credit === null
  const debit = sumParas(lines.map((line) => (line.debit === null ? 0n : parasOf(line.debit))))
  const credit = sumParas(lines.map((line) => (line.credit === null ? 0n : parasOf(line.credit))))
  const incomplete = lines.some(empty)
  const state: BalanceState = incomplete
    ? 'incomplete'
    : debit === credit
      ? 'balanced'
      : 'unbalanced'
  const messages: Record<string, GridMessage[]> = Object.fromEntries(
    lines.filter(empty).map((line) => [
      line.id,
      [
        {
          tone: 'danger',
          text: 'Enter a debit or a credit amount.',
          columns: ['debit', 'credit'],
        },
      ],
    ]),
  )
  const difference = debit - credit
  const reason =
    state === 'balanced'
      ? undefined
      : state === 'incomplete'
        ? 'Every line needs a debit or a credit amount.'
        : `Debit and credit must be equal. The difference is ${format.money(decimalOf(difference < 0n ? -difference : difference), 'RSD')}.`
  return (
    <div className="flex flex-col gap-4">
      <EditableGrid
        label="Lines of NK-2026-0912"
        columns={COLUMNS}
        rows={lines}
        getRowId={(line) => line.id}
        onCellChange={(rowId, columnId, value) => {
          setLines((current) =>
            current.map((line) =>
              line.id === rowId ? { ...line, [columnId]: value as never } : line,
            ),
          )
        }}
        onAddRow={(index) => {
          setLines((current) => [
            ...current.slice(0, index),
            { id: String(Date.now()), account: null, text: '', debit: null, credit: null },
            ...current.slice(index),
          ])
        }}
        onRemoveRow={(rowId) => {
          setLines((current) => current.filter((line) => line.id !== rowId))
        }}
        minRows={2}
        messages={messages}
        {...(layout === undefined ? {} : { layout })}
        footer={
          <BalanceBar
            debit={decimalOf(debit)}
            credit={decimalOf(credit)}
            difference={decimalOf(difference)}
            state={state}
            currency="RSD"
            {...(layout === undefined ? {} : { layout: layout === 'phone' ? 'stacked' : 'row' })}
          />
        }
      />
      <div className="flex flex-wrap items-center justify-end gap-2">
        <Button intent="save" emphasis="secondary" label="Save draft" />
        {reason === undefined ? (
          <Button family="primary" icon={BookCheck} emphasis="primary" label="Post" />
        ) : (
          <UnavailableAction
            family="primary"
            icon={BookCheck}
            emphasis="primary"
            label="Post"
            reason={reason}
          />
        )}
      </div>
    </div>
  )
}

/** The application's translation of the bar's messages, in the story's theme. */
function Translated({
  locale,
  messages,
  children,
}: {
  locale: string
  messages: Partial<LiroMessages>
  children: ReactNode
}) {
  const liro = useLiro()
  return (
    <LiroProvider
      locale={locale}
      colorScheme={liro.colorScheme}
      today={liro.today}
      messages={messages}
    >
      {children}
    </LiroProvider>
  )
}

const meta = {
  title: 'Components/Processes/BalanceBar',
  component: BalanceBar,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the Debit / Credit / Difference of a balanced entry (a journal entry), ' +
          'always in view: in EditableGrid’s `footer` — beside "Add line" on desktop, in the ' +
          'totals card sticky at the top on phones. The amounts and the state come from the ' +
          'application: whether an entry balances is the Core’s rule, and the bar adds nothing.\n\n' +
          '**States:** Balanced (a check and the word); Not balanced (the difference and the ' +
          'words in the danger colour — never colour alone); Amounts missing (a line without an ' +
          'amount, or one that cannot be read: the difference is "—", never 0, and the grid says ' +
          'which line under it).\n\n' +
          '**Posting:** while the entry does not balance, the application shows its post action ' +
          'as an UnavailableAction with the Core’s reason ("Debit and credit must be equal…").\n\n' +
          '**When not:** a document’s totals (DocumentTotals); a single sum under a column ' +
          '(EditableGrid `totals`).',
      },
    },
  },
  args: {
    debit: '144720.00',
    credit: '144720.00',
    difference: '0.00',
    state: 'balanced',
    currency: 'RSD',
    layout: 'row',
  },
  render: (args) => (
    <ExampleProvider>
      <BalanceBar {...args} />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof BalanceBar>

export default meta

type Story = StoryObj<typeof meta>

/** A balanced entry. */
export const Default: Story = {}

/** A difference: marked in words and the danger tone. */
export const Unbalanced: Story = {
  name: 'Not balanced',
  args: { debit: '146720.00', credit: '144720.00', difference: '2000.00', state: 'unbalanced' },
}

/** An amount is missing: the difference is not known, so it is not shown. */
export const Incomplete: Story = {
  name: 'Amounts missing',
  args: { debit: '84600.00', credit: '144720.00', difference: null, state: 'incomplete' },
}

/** New sums are being computed: the confirmed ones stay, with the quiet dot after 300ms. */
export const Pending: Story = {
  name: 'Loading (pending sums)',
  args: { pending: true },
}

/** Large amounts stay on one line each; the row wraps. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    debit: '1234567890123.45',
    credit: '1234567889123.45',
    difference: '1000.00',
    state: 'unbalanced',
  },
  render: (args) => (
    <ExampleProvider>
      <div className="w-[420px] max-w-full">
        <BalanceBar {...args} />
      </div>
    </ExampleProvider>
  ),
}

/**
 * In a journal entry: changing the credit unbalances it and makes "Post" unavailable with the
 * reason; emptying an amount makes the balance unknown.
 */
export const InJournalEntry: Story = {
  name: 'In a journal entry',
  render: () => (
    <ExampleProvider>
      <JournalEntry layout="desktop" />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const status = canvasElement.querySelector('[data-slot="balance-bar"] [role="status"]')
    if (status === null) throw new Error('no status')
    await expect(status).toHaveTextContent('Balanced')
    await settle()
  },
}

export const InJournalEntryInteraction: Story = {
  name: 'In a journal entry, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <JournalEntry layout="desktop" />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const status = canvasElement.querySelector('[data-slot="balance-bar"] [role="status"]')
    if (status === null) throw new Error('no status')
    await expect(status).toHaveTextContent('Balanced')
    const credit = canvas.getByRole('textbox', { name: 'Credit, line 4' })
    await userEvent.clear(credit)
    await userEvent.type(credit, '142720')
    await userEvent.tab()
    await expect(status).toHaveTextContent('Not balanced')
    await expect(canvasElement).toHaveTextContent(
      'Unavailable: Debit and credit must be equal. The difference is 2.000,00 RSD.',
    )
    const debit = canvas.getByRole('textbox', { name: 'Debit, line 2' })
    await userEvent.clear(debit)
    await userEvent.tab()
    await expect(status).toHaveTextContent('Amounts missing')
    await expect(canvasElement).toHaveTextContent('Enter a debit or a credit amount.')
    await userEvent.type(debit, '34000')
    await userEvent.tab()
    await expect(status).toHaveTextContent('Balanced')
    await settle()
  },
}

/** Phone width: the bar stacked in the grid's totals card, sticky at the top. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="h-full overflow-y-auto p-4">
          <JournalEntry layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const bar = canvasElement.querySelector('[data-slot="balance-bar"]')
    const totals = bar?.closest('[data-slot="grid-totals"]')
    await expect(
      totals === null || totals === undefined ? '' : getComputedStyle(totals).position,
    ).toBe('sticky')
    if (bar === null) throw new Error('no bar')
    await expect(bar.scrollWidth).toBeLessThanOrEqual(bar.clientWidth)
  },
}

/** Arabic: the application's translation of the bar's messages. */
export const Arabic: Story = {
  render: (args) => (
    <Translated
      locale="ar"
      messages={{
        'balance.label': 'الرصيد',
        'balance.debit': 'مدين',
        'balance.credit': 'دائن',
        'balance.difference': 'الفرق',
        'balance.unbalanced': 'غير متوازن',
      }}
    >
      <BalanceBar
        {...args}
        debit="146720.00"
        credit="144720.00"
        difference="2000.00"
        state="unbalanced"
      />
    </Translated>
  ),
}

/** Japanese: the application's translation of the bar's messages. */
export const Japanese: Story = {
  render: (args) => (
    <Translated
      locale="ja"
      messages={{
        'balance.label': '残高',
        'balance.debit': '借方',
        'balance.credit': '貸方',
        'balance.difference': '差額',
        'balance.balanced': '貸借一致',
      }}
    >
      <BalanceBar
        {...args}
        currency="JPY"
        decimals={0}
        debit="144720"
        credit="144720"
        difference="0"
      />
    </Translated>
  ),
}
