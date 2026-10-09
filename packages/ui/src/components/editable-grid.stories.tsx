import type { Meta, StoryObj } from '@storybook/react-vite'
import { useCallback, useEffect, useMemo, useRef, useState, type ComponentProps } from 'react'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import type { ComboboxOption } from './combobox-field'
import { useLiro } from '../provider/liro-provider'
import { MoneyText, NumberText } from './display-text'
import { EditableGrid, type EditableGridColumn } from './editable-grid'
import type { GridDetail, GridMessage } from './editable-grid-logic'
import type { LineType } from './line-types'
import type { LookupKind, LookupOption } from './lookup-logic'
import {
  KINDS,
  recordOf,
  RECENT,
  searchCatalogue,
  TAX_CATEGORIES,
  UNITS,
} from './lookup-story-data'
import { SwitchField } from './checkbox-field'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { StoryProvider } from './story-frames'
import { toUnits } from './amounts-story-data'

const meta = {
  title: 'Components/Table/EditableGrid',
  component: EditableGrid,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** entering the lines of a document or a journal entry from the keyboard. ' +
          'Every cell is a field (text, number, select, combobox, date) or a value the ' +
          'application shows (the line amount). **Keys:** Enter goes to the same column in the ' +
          'next row and adds a row after the last; Shift+Enter goes up; Tab and Shift+Tab move ' +
          'across; while a list is open, Enter chooses. Ctrl+Enter (Cmd on a Mac) inserts a row ' +
          'below, Ctrl+Delete removes the row. **On phones** each line is a card (fields under ' +
          'their column labels, "Remove line" at the end), the totals and the balance stay in a ' +
          'card sticky at the top, and Enter ("next") goes through the line, then the next one. ' +
          '**Controlled:** the application keeps the rows, adds and removes them when asked, ' +
          'computes amounts and totals (shown with SettlingValue) and sends errors and warnings, ' +
          'shown under their row.\n\n' +
          '**Complex documents (P5.18).** Rows carry a line type (`getRowType`): a section ' +
          'heading and a text line are one field across the row (`lineText`; bold, and xs ' +
          'secondary), a subtotal has no field (its text end-aligned, semibold, a rule above, its ' +
          'amounts from the application), discounts and deductions are lines with negative ' +
          'amounts. "Add line" adds a normal line; with `addTypes` its chevron offers the rarer ' +
          'types. A `lookup` column is one LookupField per line (items, services, fixed assets ' +
          'grouped by kind; "+ Create …" opens LookupCreateDrawer and fills the line; a one-off ' +
          'line where allowed); the chosen kind stands in the line as small secondary text. ' +
          '`taxCategory` and `unit` columns choose from the Core’s lists ("S 20%"; "pc" stored ' +
          'as H87). `details` show an asset number or a sale note under the row, `internal` ones ' +
          'after "Internal" (never on the customer’s PDF: the application’s rule). Keep ' +
          '`columns` stable (useMemo) in long grids: every cell is a memoised field.\n\n' +
          '**When not:** a list to read (DataTable); one record (fields in a form, P3.5); an ' +
          'issued document (its read-only lines are a DataTable).',
      },
    },
  },
  args: {
    label: 'Invoice lines',
    columns: [],
    rows: [],
    getRowId: () => '',
    onCellChange: () => undefined,
    onAddRow: () => undefined,
    onRemoveRow: () => undefined,
  },
  play: settle,
} satisfies Meta<typeof EditableGrid>

export default meta

type Story = StoryObj<typeof meta>

// ---- The application's side of the stories: rows, decimal arithmetic, messages. ----

interface Line {
  id: string
  item: ComboboxOption | null
  description: string
  quantity: string | null
  price: string | null
  vat: string
  date: string | null
}

const ITEMS: ComboboxOption[] = [
  { value: 'paper', label: 'Paper A4, 500 sheets' },
  { value: 'toner', label: 'Toner cartridge' },
  { value: 'pens', label: 'Pens, box of 50' },
  { value: 'stapler', label: 'Stapler' },
  { value: 'folders', label: 'Folders, pack of 10' },
]

const VAT = [
  { value: '20', label: '20%' },
  { value: '10', label: '10%' },
  { value: '0', label: '0%' },
]

let nextId = 100
const emptyLine = (): Line => ({
  id: `line-${String((nextId += 1))}`,
  item: null,
  description: '',
  quantity: null,
  price: null,
  vat: '20',
  date: null,
})

/** An integer at `scale` decimals back to a decimal string, trailing zeros beyond two cut. */
function unscaled(value: bigint, scale: number): string {
  const negative = value < 0n
  const digits = (negative ? -value : value).toString().padStart(scale + 1, '0')
  const whole = digits.slice(0, -scale)
  const fraction = digits.slice(-scale).replace(/0+$/, '').padEnd(2, '0')
  return `${negative ? '-' : ''}${whole}.${fraction}`
}

const amountOf = (line: Line): string | null =>
  line.quantity === null || line.price === null
    ? null
    : unscaled(toUnits(line.quantity, 4) * toUnits(line.price, 4), 8)

const totalOf = (lines: readonly Line[]): string =>
  unscaled(
    lines.reduce((sum, line) => {
      const amount = amountOf(line)
      return amount === null ? sum : sum + toUnits(amount, 8)
    }, 0n),
    8,
  )

function messagesOf(lines: readonly Line[]): Record<string, GridMessage[]> {
  const result: Record<string, GridMessage[]> = {}
  for (const line of lines) {
    const list: GridMessage[] = []
    if (line.quantity !== null && toUnits(line.quantity, 4) <= 0n) {
      list.push({ tone: 'danger', text: 'Quantity must be more than 0.', columns: ['quantity'] })
    }
    if (line.item !== null && line.price === null) {
      list.push({ tone: 'warning', text: 'No price: the line will be saved at 0.' })
    }
    if (list.length > 0) result[line.id] = list
  }
  return result
}

const COLUMNS: EditableGridColumn<Line>[] = [
  {
    id: 'item',
    header: 'Item',
    type: 'combobox',
    value: (line) => line.item,
    options: ITEMS,
  },
  { id: 'description', header: 'Description', type: 'text', value: (line) => line.description },
  {
    id: 'quantity',
    header: 'Quantity',
    type: 'number',
    width: 110,
    value: (line) => line.quantity,
  },
  {
    id: 'price',
    header: 'Unit price',
    type: 'number',
    width: 130,
    decimals: 2,
    value: (line) => line.price,
  },
  { id: 'vat', header: 'VAT', type: 'select', width: 100, value: (line) => line.vat, options: VAT },
  {
    id: 'amount',
    header: 'Amount',
    type: 'display',
    width: 130,
    align: 'end',
    numeric: true,
    display: (line) => <NumberText value={amountOf(line)} decimals={2} />,
  },
]

const FILLED: Line[] = [
  {
    id: 'a',
    item: ITEMS[0] ?? null,
    description: 'For the office',
    quantity: '10',
    price: '4.20',
    vat: '20',
    date: null,
  },
  {
    id: 'b',
    item: ITEMS[1] ?? null,
    description: '',
    quantity: '2',
    price: '38.90',
    vat: '20',
    date: null,
  },
  {
    id: 'c',
    item: ITEMS[2] ?? null,
    description: 'Blue',
    quantity: '3',
    price: '6.75',
    vat: '10',
    date: null,
  },
]

/** The application around the grid: keeps the lines, sums them and checks them. */
function Lines(
  props: Partial<ComponentProps<typeof EditableGrid<Line>>> & {
    initial?: Line[]
    /** Totals take this long to settle, as a server would. */
    settleAfter?: number
  },
) {
  const [lines, setLines] = useState<Line[]>(props.initial ?? [emptyLine()])
  const current = totalOf(lines)
  const [settled, setSettled] = useState(current)
  const { settleAfter } = props
  useEffect(() => {
    if (settleAfter === undefined) return
    const timer = setTimeout(() => {
      setSettled(current)
    }, settleAfter)
    return () => {
      clearTimeout(timer)
    }
  }, [current, settleAfter])
  const total = settleAfter === undefined ? current : settled
  const pending = settleAfter !== undefined && settled !== current
  return (
    <EditableGrid<Line>
      label="Invoice lines"
      columns={COLUMNS}
      getRowId={(line) => line.id}
      messages={messagesOf(lines)}
      totals={{ amount: { value: total, pending, decimals: 2 } }}
      totalsLabel="Total"
      {...props}
      rows={lines}
      onCellChange={(rowId, columnId, value) => {
        setLines((current) =>
          current.map((line) => (line.id === rowId ? { ...line, [columnId]: value } : line)),
        )
      }}
      onAddRow={(index) => {
        setLines((current) => [...current.slice(0, index), emptyLine(), ...current.slice(index)])
      }}
      onRemoveRow={(rowId) => {
        setLines((current) => current.filter((line) => line.id !== rowId))
      }}
    />
  )
}

/** Three lines with the amount and the total from the application. */
export const Default: Story = {
  render: () => <Lines initial={FILLED} />,
}

/**
 * The plan's "Done when": ten lines entered without a mouse. For each line: the item by typing
 * and choosing (Enter chooses, it does not move), Tab, the description, Tab, quantity, Tab,
 * price; then Tab past the remove button to "Add line" and Enter, which adds a line and puts the
 * focus in its first cell. Runs in left-to-right and right-to-left.
 */
export const TenLinesByKeyboard: Story = {
  name: 'Ten lines by keyboard',
  render: () => <Lines />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('combobox', { name: 'Item, line 1' }))
    for (let line = 1; line <= 10; line += 1) {
      await userEvent.keyboard('Pap{ArrowDown}{Enter}')
      await expect(
        canvas.getByRole('combobox', { name: `Item, line ${String(line)}` }),
      ).toHaveValue('Paper A4, 500 sheets')
      await userEvent.keyboard('{Tab}')
      await userEvent.keyboard(`Line ${String(line)}{Tab}`)
      await userEvent.keyboard(`${String(line)}{Tab}`)
      await userEvent.keyboard('2.5{Tab}')
      if (line < 10) {
        // From VAT (kept) past the remove button (disabled while there is one line) to "Add line".
        const addLine = canvas.getByRole('button', { name: 'Add line' })
        for (let step = 0; step < 4 && document.activeElement !== addLine; step += 1) {
          await userEvent.keyboard('{Tab}')
        }
        await expect(addLine).toHaveFocus()
        await userEvent.keyboard('{Enter}')
        await waitFor(() =>
          expect(
            canvas.getByRole('combobox', { name: `Item, line ${String(line + 1)}` }),
          ).toHaveFocus(),
        )
      }
    }
    // 1 + 2 + … + 10 = 55 pieces at 2.50.
    // The visible total (SettlingValue also announces it in a live region).
    await waitFor(() => expect(canvas.getAllByText('137.50')[0]).toBeVisible())
    await expect(canvas.getAllByRole('combobox', { name: /^Item, line/ })).toHaveLength(10)
    await settle()
  },
}

/** Enter goes down the column and adds a line after the last; Shift+Enter goes up. */
export const EnterMovesDown: Story = {
  name: 'Enter moves down',
  render: () => <Lines initial={FILLED} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('textbox', { name: 'Quantity, line 1' }))
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByRole('textbox', { name: 'Quantity, line 2' })).toHaveFocus()
    await userEvent.keyboard('{Enter}{Enter}')
    await waitFor(() =>
      expect(canvas.getByRole('textbox', { name: 'Quantity, line 4' })).toHaveFocus(),
    )
    await userEvent.keyboard('{Shift>}{Enter}{/Shift}')
    await expect(canvas.getByRole('textbox', { name: 'Quantity, line 3' })).toHaveFocus()
    await settle()
  },
}

/** Ctrl+Enter inserts a line below; Ctrl+Delete removes it; the focus stays in the column. */
export const RowShortcuts: Story = {
  name: 'Row shortcuts',
  render: () => <Lines initial={FILLED} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('textbox', { name: 'Description, line 1' }))
    await userEvent.keyboard('{Control>}{Enter}{/Control}')
    await waitFor(() =>
      expect(canvas.getByRole('textbox', { name: 'Description, line 2' })).toHaveFocus(),
    )
    await expect(canvas.getByRole('textbox', { name: 'Description, line 2' })).toHaveValue('')
    await userEvent.keyboard('{Control>}{Delete}{/Control}')
    await waitFor(() =>
      expect(canvas.getByRole('textbox', { name: 'Description, line 2' })).toHaveValue(''),
    )
    await expect(canvas.getByRole('textbox', { name: 'Description, line 2' })).toHaveFocus()
    await expect(canvas.getAllByRole('combobox', { name: /^Item, line/ })).toHaveLength(3)
    await settle()
  },
}

/** Errors before warnings under their row; the invalid cell takes the danger line. */
export const Messages: Story = {
  name: 'Errors and warnings',
  render: () => (
    <Lines
      initial={[
        { ...emptyLine(), id: 'm1', item: ITEMS[3] ?? null, quantity: '0', price: null },
        ...FILLED.slice(0, 1),
      ]}
    />
  ),
}

/** An unreadable number stays in its cell, with the field's own message under the row. */
export const Unreadable: Story = {
  render: () => <Lines initial={FILLED} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const price = canvas.getByRole('textbox', { name: 'Unit price, line 2' })
    await userEvent.clear(price)
    await userEvent.type(price, 'abc{Tab}')
    await expect(await canvas.findByText('Unit price: Enter a number')).toBeVisible()
    await settle()
  },
}

/** Totals settle later, as from a server: the last total stays, with the quiet dot. */
export const SettlingTotals: Story = {
  name: 'Totals settling',
  render: () => <Lines initial={FILLED} settleAfter={60_000} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const quantity = canvas.getByRole('textbox', { name: 'Quantity, line 1' })
    await userEvent.clear(quantity)
    await userEvent.type(quantity, '12{Tab}')
    await settle()
  },
}

/** Read-only cells (a posted line) and the limits: at most 3 lines, at least 2. */
export const ReadOnlyAndLimits: Story = {
  name: 'Read-only cells and limits',
  render: () => (
    <Lines
      initial={FILLED}
      minRows={2}
      maxRows={3}
      columns={COLUMNS.map((column) =>
        column.id === 'item' ? { ...column, readOnly: (line: Line) => line.id === 'a' } : column,
      )}
    />
  ),
}

/** No lines yet (minRows 0): the header, "Add line" and its shortcuts. */
export const Empty: Story = {
  render: () => <Lines initial={[]} minRows={0} />,
}

const DATE_COLUMN: EditableGridColumn<Line> = {
  id: 'date',
  header: 'Delivery',
  type: 'date',
  width: 150,
  value: (line) => line.date,
}

/** A date column, and the balance in the footer slot (a journal entry). */
export const WithDateAndFooter: Story = {
  name: 'Date column and footer',
  render: () => (
    <Lines
      initial={FILLED}
      columns={[...COLUMNS.slice(0, 1), DATE_COLUMN, ...COLUMNS.slice(2)]}
      footer={<span className="text-sm text-secondary">Balance: 0.00</span>}
    />
  ),
}

/**
 * Phone width (P3.6, the old behaviour): each line is a card with its fields stacked under their
 * column labels and "Remove line" at its end; the total and the balance stand in a card sticky at
 * the top, where the operator keeps seeing them; "next" on the on-screen keyboard (Enter) goes
 * through a line's fields, then into the next line.
 */
export const Phone: Story = {
  name: 'Phone width',
  render: () => (
    <div className="w-[390px] max-w-full">
      <Lines
        initial={FILLED.slice(0, 2)}
        layout="phone"
        footer={<span className="text-sm text-secondary">Balance: 0.00</span>}
      />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const totals = canvasElement.querySelector('[data-slot="grid-totals"]')
    await expect(totals === null ? '' : getComputedStyle(totals).position).toBe('sticky')
    await userEvent.click(canvas.getByRole('textbox', { name: 'Description, line 1' }))
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByRole('textbox', { name: 'Quantity, line 1' })).toHaveFocus()
    await userEvent.click(canvas.getByRole('textbox', { name: 'Unit price, line 1' }))
    await userEvent.keyboard('{Enter}{Enter}')
    await expect(canvas.getByRole('combobox', { name: 'Item, line 2' })).toHaveFocus()
    await expect(canvas.getByRole('button', { name: 'Remove line 2' })).toBeVisible()
    await settle()
  },
}

/** The switch stands in for the viewport crossing 48em (a resize, a rotated tablet). */
function LayoutChange() {
  const [phone, setPhone] = useState(false)
  return (
    <div className="flex flex-col gap-4">
      <SwitchField label="Phone layout" checked={phone} onChange={setPhone} />
      <Lines
        initial={FILLED.slice(0, 2)}
        settleAfter={60_000}
        layout={phone ? 'phone' : 'desktop'}
      />
    </div>
  )
}

/**
 * When the layout changes between the table and the cards, nothing typed is lost: unreadable
 * text stays in its cell with its message, the focused cell keeps the focus and its selection,
 * and a pending total keeps its dot. The play switches without moving the focus, as a resize would.
 */
export const LayoutChangeKeepsFocus: Story = {
  name: 'Layout change keeps typing and focus',
  render: () => <LayoutChange />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const quantity = () => canvas.getByRole('textbox', { name: 'Quantity, line 1' })
    await userEvent.clear(quantity())
    await userEvent.type(quantity(), 'abc{Tab}')
    await expect(await canvas.findByText('Quantity: Enter a number')).toBeVisible()
    await userEvent.click(canvas.getByRole('textbox', { name: 'Unit price, line 2' }))
    const selected = () => {
      const active = document.activeElement
      return active instanceof HTMLInputElement
        ? [active.selectionStart, active.selectionEnd]
        : null
    }
    canvas
      .getByRole<HTMLInputElement>('textbox', { name: 'Unit price, line 2' })
      .setSelectionRange(1, 3)
    const dot = () => canvasElement.querySelector('[data-slot="settling-dot"]')
    await waitFor(() => expect(dot()).not.toBeNull())
    const toggle = canvas.getByRole('switch', { name: 'Phone layout' })
    await fireEvent.click(toggle)
    await waitFor(() => expect(canvas.getByRole('button', { name: 'Remove line 2' })).toBeVisible())
    // The cards' total is new, and already shows the dot: no 300ms without it.
    await expect(dot()).not.toBeNull()
    await expect(canvas.getByRole('textbox', { name: 'Unit price, line 2' })).toHaveFocus()
    await expect(selected()).toEqual([1, 3])
    await fireEvent.click(toggle)
    await waitFor(() => expect(canvas.getByRole('table', { name: 'Invoice lines' })).toBeVisible())
    await expect(canvas.getByRole('textbox', { name: 'Unit price, line 2' })).toHaveFocus()
    await expect(selected()).toEqual([1, 3])
    await expect(quantity()).toHaveValue('abc')
    await expect(quantity()).toHaveAttribute('aria-invalid', 'true')
    await expect(canvas.getByText('Quantity: Enter a number')).toBeVisible()
    await settle()
  },
}

/** Long text: headers and values wrap or scroll inside their cells. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <Lines
      initial={[{ ...FILLED[0], id: 'l1', description: LONG.value } as Line]}
      columns={COLUMNS.map((column) =>
        column.id === 'description' ? { ...column, header: LONG.label } : column,
      )}
    />
  ),
}

/** Arabic sample text, right to left: numbers stay at the end (left). */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <Lines
        initial={[{ ...FILLED[0], id: 'ar1', description: ARABIC.value } as Line]}
        columns={COLUMNS.map((column) =>
          column.id === 'description' ? { ...column, header: ARABIC.label } : column,
        )}
        totalsLabel={ARABIC.options[2] ?? ''}
      />
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <Lines
        initial={[{ ...FILLED[0], id: 'ja1', description: JAPANESE.value } as Line]}
        columns={COLUMNS.map((column) =>
          column.id === 'description' ? { ...column, header: JAPANESE.label } : column,
        )}
      />
    </StoryProvider>
  ),
}

// ── P5.18: line types, lines by search, tax category and unit, a long specification ──────────

/** A document line as the application keeps it (P5.18). */
interface DocLine {
  id: string
  type: LineType
  /** A text line's or a heading's text; a subtotal's label. */
  text: string
  item: LookupOption | null
  quantity: string | null
  unit: string
  price: string | null
  tax: string
  account: string
}

const DOC_KINDS: LookupKind[] = [
  ...KINDS,
  { key: 'discount', heading: 'Discounts', label: 'Discount' },
]

const ACCOUNTS = [
  { value: '6120', label: '6120 Goods' },
  { value: '6140', label: '6140 Services' },
  { value: '6720', label: '6720 Fixed assets sold' },
  { value: '6790', label: '6790 Other income' },
]

const ACCOUNT_OF: Record<string, string> = {
  item: '6120',
  service: '6140',
  asset: '6720',
  discount: '6120',
}

let nextDocId = 500
function docLine(type: LineType = 'line', extra: Partial<DocLine> = {}): DocLine {
  nextDocId += 1
  return {
    id: `doc-${String(nextDocId)}`,
    type,
    text: '',
    item: null,
    quantity: type === 'line' ? null : '1',
    unit: 'H87',
    price: null,
    tax: 'S20',
    account: '',
    ...extra,
  }
}

function catalogueLine(value: string, quantity: string, extra: Partial<DocLine> = {}): DocLine {
  const record = recordOf(value)
  return docLine('line', {
    item: record ?? null,
    quantity,
    unit: record?.unit ?? 'H87',
    price: record?.price ?? null,
    tax: record?.taxCategory ?? 'S20',
    account: record === undefined ? '' : (ACCOUNT_OF[record.kind] ?? ''),
    ...extra,
  })
}

const DISCOUNT: LookupOption = {
  value: 'POP-05',
  label: 'Popust 5% na materijal',
  kind: 'discount',
}

/** The lines of a draft: two sections with subtotals, a text line, a discount. */
const DOC_LINES: DocLine[] = [
  docLine('heading', { text: '1. Materials' }),
  catalogueLine('ART-0204', '40'),
  catalogueLine('ART-0118', '48'),
  catalogueLine('OS-0112', '1'),
  docLine('text', { text: 'Delivery to the site in Temerin, Novosadska 112, on 9 October.' }),
  docLine('subtotal', { text: 'Subtotal 1. Materials' }),
  docLine('heading', { text: '2. Services' }),
  catalogueLine('USL-014', '16'),
  catalogueLine('USL-021', '2'),
  docLine('subtotal', { text: 'Subtotal 2. Services' }),
  docLine('discount', { item: DISCOUNT, quantity: '1', price: '-1370.00', account: '6120' }),
]

/** The line's amount in paras (quantity × price, rounded half up to the para; the application's). */
function docAmount(line: DocLine): bigint | null {
  if (line.quantity === null || line.price === null) return null
  const product = toUnits(line.quantity, 3) * toUnits(line.price, 2)
  const half = product < 0n ? -500n : 500n
  return (product + half) / 1000n
}

const paras = (value: bigint | null): string | null =>
  value === null ? null : unscaled(value * 1000000n, 8)

/** Each subtotal's amount: the lines since the heading before it. */
function subtotals(lines: readonly DocLine[]): Map<string, bigint> {
  const result = new Map<string, bigint>()
  let running = 0n
  for (const line of lines) {
    if (line.type === 'heading') running = 0n
    else if (line.type === 'subtotal') result.set(line.id, running)
    else running += docAmount(line) ?? 0n
  }
  return result
}

function docTotal(lines: readonly DocLine[]): string {
  return (
    paras(
      lines.reduce(
        (sum, line) => (line.type === 'subtotal' ? sum : sum + (docAmount(line) ?? 0n)),
        0n,
      ),
    ) ?? '0.00'
  )
}

function docMessages(lines: readonly DocLine[]): Record<string, GridMessage[]> {
  const result: Record<string, GridMessage[]> = {}
  for (const line of lines) {
    const list: GridMessage[] = []
    const record = line.item === null ? undefined : recordOf(line.item.value)
    if (
      record?.stock !== undefined &&
      line.quantity !== null &&
      toUnits(line.quantity, 3) > toUnits(record.stock, 3)
    ) {
      list.push({
        tone: 'warning',
        text: `Only ${record.stock} pc in stock (${record.value}); the rest will be ordered.`,
        columns: ['quantity'],
      })
    }
    if (line.item?.oneOff === true && line.account === '') {
      list.push({
        tone: 'danger',
        text: 'A one-off line needs a revenue account.',
        columns: ['account'],
      })
    }
    if (list.length > 0) result[line.id] = list
  }
  return result
}

/** The application's search per line: results and loading by line id, answering after 400ms. */
function useLineSearch() {
  const [results, setResults] = useState<Readonly<Record<string, LookupOption[]>>>({})
  const [loading, setLoading] = useState<Readonly<Record<string, boolean>>>({})
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const onSearch = useCallback((rowId: string, query: string) => {
    setLoading((current) => ({ ...current, [rowId]: true }))
    clearTimeout(timers.current.get(rowId))
    timers.current.set(
      rowId,
      setTimeout(() => {
        setResults((current) => ({ ...current, [rowId]: searchCatalogue(query) }))
        setLoading((current) => ({ ...current, [rowId]: false }))
      }, 400),
    )
  }, [])
  return { results, loading, onSearch }
}

const NO_RESULTS: LookupOption[] = []

/** The draft's lines, kept by the application: search, create, line types, totals. */
function DocumentLines({
  layout,
  initial = DOC_LINES,
}: {
  layout?: 'desktop' | 'phone'
  initial?: DocLine[]
}) {
  const { format } = useLiro()
  const [lines, setLines] = useState<DocLine[]>(initial)
  const search = useLineSearch()
  const sums = useMemo(() => subtotals(lines), [lines])
  const { results, loading, onSearch } = search
  const columns = useMemo<EditableGridColumn<DocLine>[]>(
    () => [
      {
        id: 'item',
        header: 'Item, service or asset',
        type: 'lookup',
        width: 300,
        value: (line) => line.item,
        results: (line) => results[line.id] ?? NO_RESULTS,
        loading: (line) => loading[line.id] === true,
        onSearch,
        recent: RECENT,
        kinds: DOC_KINDS,
        allowOneOff: true,
        onSearchAll: () => undefined,
        create: {
          kinds: [
            { kind: 'service', noun: 'service' },
            { kind: 'item', noun: 'item' },
          ],
          units: UNITS,
          taxCategories: TAX_CATEGORIES,
          currency: 'RSD',
          defaultUnit: 'HUR',
          defaultTaxCategory: 'S20',
          onCreate: (_rowId, draft) =>
            new Promise((resolve) => {
              setTimeout(() => {
                resolve({ value: 'USL-101', label: draft.name, kind: draft.kind })
              }, 300)
            }),
        },
      },
      {
        id: 'quantity',
        header: 'Quantity',
        type: 'number',
        width: 90,
        value: (line) => line.quantity,
      },
      { id: 'unit', header: 'Unit', type: 'unit', width: 80, value: (l) => l.unit, units: UNITS },
      {
        id: 'price',
        header: 'Price',
        type: 'number',
        width: 120,
        decimals: 2,
        value: (line) => line.price,
      },
      {
        id: 'tax',
        header: 'VAT',
        type: 'taxCategory',
        width: 90,
        value: (line) => line.tax,
        categories: TAX_CATEGORIES,
      },
      {
        id: 'account',
        header: 'Account',
        type: 'select',
        width: 170,
        value: (line) => line.account,
        options: ACCOUNTS,
        // A catalogue record brings its account; a one-off line chooses it.
        readOnly: (line) => line.item !== null && line.item.oneOff !== true,
      },
      {
        id: 'amount',
        header: 'Amount',
        type: 'display',
        width: 140,
        align: 'end',
        numeric: true,
        display: (line) => (
          <MoneyText
            value={paras(line.type === 'subtotal' ? (sums.get(line.id) ?? 0n) : docAmount(line))}
            currency="RSD"
          />
        ),
      },
    ],
    [results, loading, onSearch, sums],
  )
  const details: Record<string, GridDetail[]> = {}
  for (const line of lines) {
    const record = line.item === null ? undefined : recordOf(line.item.value)
    if (record?.assetNumber === undefined || record.bookValue === undefined) continue
    details[line.id] = [
      { text: `Asset ${record.assetNumber}: leaves the register when the invoice is issued.` },
      { text: `Book value ${format.money(record.bookValue, 'RSD')}`, internal: true },
    ]
  }
  return (
    <EditableGrid<DocLine>
      label="Invoice lines"
      columns={columns}
      rows={lines}
      getRowId={(line) => line.id}
      getRowType={(line) => line.type}
      lineText={{ columnId: 'text', value: (line) => line.text }}
      addTypes={['text', 'heading', 'discount']}
      messages={docMessages(lines)}
      details={details}
      totals={{ amount: { value: docTotal(lines), currency: 'RSD' } }}
      totalsLabel="Total without VAT"
      {...(layout === undefined ? {} : { layout })}
      onCellChange={(rowId, columnId, value) => {
        setLines((current) =>
          current.map((line) => {
            if (line.id !== rowId) return line
            if (columnId !== 'item') return { ...line, [columnId]: value }
            // The application fills the line from the chosen record.
            const option = value as LookupOption | null
            const record = option === null ? undefined : recordOf(option.value)
            return {
              ...line,
              item: option,
              ...(record === undefined
                ? {}
                : {
                    unit: record.unit,
                    price: record.price,
                    tax: record.taxCategory,
                    account: ACCOUNT_OF[record.kind] ?? '',
                  }),
              ...(option?.value === 'USL-101'
                ? { unit: 'HUR', price: '1850.00', account: '6140' }
                : {}),
            }
          }),
        )
      }}
      onAddRow={(index, type) => {
        setLines((current) => {
          // A heading starts a section: the application adds its subtotal with it.
          const added =
            type === 'heading'
              ? [docLine('heading'), docLine('subtotal', { text: 'Subtotal' })]
              : [docLine(type, type === 'discount' ? { item: DISCOUNT, account: '6120' } : {})]
          return [...current.slice(0, index), ...added, ...current.slice(index)]
        })
      }}
      onRemoveRow={(rowId) => {
        setLines((current) => current.filter((line) => line.id !== rowId))
      }}
    />
  )
}

/**
 * P5.18: the line types of a document, told apart by typography — section headings bold across
 * the row, each section ending in its subtotal (end-aligned, semibold, a rule above), a text line
 * smaller and secondary, a discount with its negative amount. "Add line" adds a normal line; its
 * chevron offers a text line, a section heading and a discount. Enter skips the subtotals and
 * keeps its column through a heading.
 */
export const LineTypes: Story = {
  name: 'Line types and "Add line ▾"',
  render: () => <DocumentLines layout="desktop" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // A heading is one field across the row, bold; a text line one field, 12px secondary.
    const heading = canvas.getByRole('textbox', { name: 'Section heading, line 1' })
    await expect(getComputedStyle(heading).fontWeight).toBe('600')
    const text = canvas.getByRole('textbox', { name: 'Text, line 5' })
    await expect(getComputedStyle(text).fontSize).toBe('12px')
    // Enter from the quantity of line 4 passes the text line (one cell), skips the subtotal …
    await userEvent.click(canvas.getByRole('textbox', { name: 'Quantity, line 4' }))
    await userEvent.keyboard('{Enter}')
    await expect(text).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByRole('textbox', { name: 'Section heading, line 7' })).toHaveFocus()
    // … and comes back to the quantity column in the next full line.
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByRole('textbox', { name: 'Quantity, line 8' })).toHaveFocus()
    // "Add line ▾": a text line at the end, which takes the focus.
    await userEvent.click(canvas.getByRole('button', { name: 'More options: Add line' }))
    await userEvent.click(await within(document.body).findByRole('menuitem', { name: 'Text line' }))
    await waitFor(() =>
      expect(canvas.getByRole('textbox', { name: 'Text, line 12' })).toHaveFocus(),
    )
    await userEvent.keyboard('Prices valid until 31 October.')
    await expect(canvas.getByRole('textbox', { name: 'Text, line 12' })).toHaveValue(
      'Prices valid until 31 October.',
    )
    await settle()
  },
}

/**
 * P5.18: one search field per line. Typing a name, a code or an asset number finds items (with
 * their stock), services and fixed assets in groups; the chosen record fills the line (unit,
 * price, tax category, account — the application's) and its kind stands in the line as small
 * secondary text. A quantity above the stock is a warning under the row; a fixed asset brings its
 * number and a sale note, and its book value after "Internal" (never on the customer's PDF).
 */
export const LinesBySearch: Story = {
  name: 'Lines by search',
  render: () => <DocumentLines layout="desktop" initial={[DOC_LINES[2] ?? docLine(), docLine()]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // The first line holds 48 pieces of an article with 36 in stock: a warning, in words.
    await expect(
      canvas.getByText('Only 36 pc in stock (ART-0118); the rest will be ordered.'),
    ).toBeVisible()
    const item = canvas.getByRole('combobox', { name: 'Item, service or asset, line 2' })
    await userEvent.click(item)
    await userEvent.type(item, 'savijačica', { delay: 0 })
    const body = within(document.body)
    const option = await body.findByRole(
      'option',
      { name: /Savijačica armature.*Fixed asset/ },
      { timeout: 3000 },
    )
    await waitFor(() => expect(option).toHaveAttribute('aria-selected', 'true'))
    await userEvent.keyboard('{Enter}')
    await expect(item).toHaveValue('Savijačica armature Sima CEL-32')
    // The kind in the line, the asset's details under it.
    await expect(canvas.getByText('Fixed asset')).toBeVisible()
    await expect(canvas.getByText(/Asset OS-0047/)).toBeVisible()
    await expect(canvas.getByText('Internal')).toBeVisible()
    await expect(canvas.getByRole('textbox', { name: 'Price, line 2' })).toHaveValue('186,000.00')
    await settle()
  },
}

/** "+ Create service …": the panel with the typed name; Create fills the line, the focus returns. */
export const CreateFromLine: Story = {
  name: 'Create a service from a line',
  render: () => <DocumentLines layout="desktop" initial={[docLine()]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const item = canvas.getByRole('combobox', { name: 'Item, service or asset, line 1' })
    await userEvent.click(item)
    await userEvent.type(item, 'Montaža skele', { delay: 0 })
    const body = within(document.body)
    const create = await body.findByRole(
      'option',
      { name: 'Create service “Montaža skele”' },
      { timeout: 3000 },
    )
    await userEvent.click(create)
    const panel = await body.findByRole('dialog', { name: 'New service' })
    await userEvent.type(within(panel).getByRole('textbox', { name: /^Price/ }), '1850')
    await userEvent.click(within(panel).getByRole('button', { name: 'Create' }))
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await expect(item).toHaveValue('Montaža skele')
    await waitFor(() => expect(item).toHaveFocus())
    await expect(canvas.getByText('Service')).toBeVisible()
    await settle()
  },
}

/** A one-off line (allowed here): no catalogue record, so the account is the user's to choose. */
export const OneOffLine: Story = {
  name: 'One-off line',
  render: () => <DocumentLines layout="desktop" initial={[docLine()]} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const item = canvas.getByRole('combobox', { name: 'Item, service or asset, line 1' })
    await userEvent.click(item)
    await userEvent.type(item, 'Popravka kapije', { delay: 0 })
    const oneOff = await within(document.body).findByRole(
      'option',
      { name: 'Use “Popravka kapije” as a one-off line' },
      { timeout: 3000 },
    )
    await userEvent.click(oneOff)
    await expect(canvas.getByText('One-off')).toBeVisible()
    // The row's message (the account cell's own copy of it is hidden in the grid).
    await expect(
      canvas.getAllByText('A one-off line needs a revenue account.').at(-1),
    ).toBeVisible()
    await settle()
  },
}

/** Phones: the line types stay apart by typography in the flat list; "Add line ▾" under it. */
export const LineTypesPhone: Story = {
  name: 'Line types, phone width',
  render: () => (
    <div className="w-[390px] max-w-full">
      <DocumentLines layout="phone" initial={DOC_LINES.slice(0, 6)} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'More options: Add line' })).toBeVisible()
    await userEvent.click(canvas.getByRole('textbox', { name: 'Section heading, line 1' }))
    await userEvent.keyboard('{Enter}')
    await expect(
      canvas.getByRole('combobox', { name: 'Item, service or asset, line 2' }),
    ).toHaveFocus()
    await expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(
      document.documentElement.clientWidth,
    )
    await settle()
  },
}

// ── A specification of 300 positions ─────────────────────────────────────────────────────────

interface Position {
  id: string
  type: LineType
  text: string
  unit: string
  contracted: string | null
  price: string | null
  tax: string
  previous: string
  current: string | null
}

const SPEC_BLANK: Position = {
  id: '',
  type: 'line',
  text: '',
  unit: 'H87',
  contracted: null,
  price: null,
  tax: 'S20',
  previous: '0',
  current: null,
}

const SPEC_GROUPS = ['Earthworks', 'Concrete works', 'Masonry', 'Roofing', 'Facade', 'Floors']

/** 6 sections × 50 positions, each section with its heading and subtotal. */
function specification(): Position[] {
  const list: Position[] = []
  SPEC_GROUPS.forEach((group, g) => {
    list.push({
      ...SPEC_BLANK,
      id: `h${String(g)}`,
      type: 'heading',
      text: `${String(g + 1)}. ${group}`,
    })
    for (let i = 1; i <= 50; i += 1) {
      const contracted = ((g * 11 + i * 7) % 60) + 5
      list.push({
        ...SPEC_BLANK,
        id: `p${String(g)}-${String(i)}`,
        text: `${String(g + 1)}.${String(i)} ${group}, position ${String(i)}`,
        unit: i % 2 === 0 ? 'H87' : 'MTK',
        contracted: String(contracted),
        price: `${String(800 + ((g * 977 + i * 131) % 9000))}.${String((i * 7) % 100).padStart(2, '0')}`,
        previous: String(Math.floor((contracted * (i % 3)) / 4)),
        current: String(Math.floor(contracted / 4)),
      })
    }
    list.push({
      ...SPEC_BLANK,
      id: `s${String(g)}`,
      type: 'subtotal',
      text: `Subtotal ${String(g + 1)}. ${group}`,
    })
  })
  return list
}

/** Two quantities added (the application's), without trailing zeros. */
function plus(a: string, b: string): string {
  return unscaled(toUnits(a, 3) + toUnits(b, 3), 3).replace(/\.?0+$/, '')
}

function positionAmount(position: Position): bigint | null {
  if (position.current === null || position.price === null) return null
  return (toUnits(position.current, 3) * toUnits(position.price, 2) + 500n) / 1000n
}

function Specification({ layout }: { layout?: 'desktop' | 'phone' }) {
  const [positions, setPositions] = useState<Position[]>(specification)
  const sums = useMemo(() => {
    const result = new Map<string, bigint>()
    let running = 0n
    for (const position of positions) {
      if (position.type === 'heading') running = 0n
      else if (position.type === 'subtotal') result.set(position.id, running)
      else running += positionAmount(position) ?? 0n
    }
    return result
  }, [positions])
  const total = useMemo(
    () =>
      positions.reduce(
        (sum, position) =>
          position.type === 'subtotal' ? sum : sum + (positionAmount(position) ?? 0n),
        0n,
      ),
    [positions],
  )
  const columns = useMemo<EditableGridColumn<Position>[]>(
    () => [
      { id: 'text', header: 'Position', type: 'text', value: (p) => p.text },
      { id: 'unit', header: 'Unit', type: 'unit', width: 80, value: (p) => p.unit, units: UNITS },
      {
        id: 'contracted',
        header: 'Contracted',
        type: 'number',
        width: 100,
        value: (p) => p.contracted,
      },
      {
        id: 'price',
        header: 'Unit price',
        type: 'number',
        width: 120,
        decimals: 2,
        value: (p) => p.price,
      },
      {
        id: 'tax',
        header: 'VAT',
        type: 'taxCategory',
        width: 90,
        value: (p) => p.tax,
        categories: TAX_CATEGORIES,
      },
      {
        id: 'previous',
        header: 'Previous',
        type: 'display',
        width: 90,
        align: 'end',
        numeric: true,
        display: (p) => (p.type === 'line' ? <NumberText value={p.previous} /> : null),
      },
      {
        id: 'current',
        header: 'This period',
        type: 'number',
        width: 100,
        value: (p) => p.current,
      },
      {
        id: 'cumulative',
        header: 'Cumulative',
        type: 'display',
        width: 100,
        align: 'end',
        numeric: true,
        display: (p) =>
          p.type === 'line' ? <NumberText value={plus(p.previous, p.current ?? '0')} /> : null,
      },
      {
        id: 'amount',
        header: 'Amount this period',
        type: 'display',
        width: 150,
        align: 'end',
        numeric: true,
        display: (p) => (
          <MoneyText
            value={paras(p.type === 'subtotal' ? (sums.get(p.id) ?? 0n) : positionAmount(p))}
            currency="RSD"
          />
        ),
      },
    ],
    [sums],
  )
  return (
    <EditableGrid<Position>
      label="Specification of works"
      columns={columns}
      rows={positions}
      getRowId={(p) => p.id}
      getRowType={(p) => p.type}
      lineText={{ columnId: 'text', value: (p) => p.text }}
      addTypes={['heading', 'text']}
      totals={{ amount: { value: paras(total), currency: 'RSD' } }}
      totalsLabel="Total this period"
      {...(layout === undefined ? {} : { layout })}
      onCellChange={(rowId, columnId, value) => {
        setPositions((current) =>
          current.map((p) => (p.id === rowId ? { ...p, [columnId]: value } : p)),
        )
      }}
      onAddRow={(index, type) => {
        nextDocId += 1
        const id = `n${String(nextDocId)}`
        setPositions((current) => [
          ...current.slice(0, index),
          { ...SPEC_BLANK, id, type },
          ...current.slice(index),
        ])
      }}
      onRemoveRow={(rowId) => {
        setPositions((current) => current.filter((p) => p.id !== rowId))
      }}
    />
  )
}

/**
 * P5.18: a specification of 300 positions in six sections, edited like document lines (the same
 * keys, a unit and a tax category per position), with Previous / This period / Cumulative
 * columns from the application. A grid of 100 lines or more draws only the lines around the view
 * (and the focused line), each cell a memoised field, so it stays quick (the measured numbers are
 * in docs/p5-notes/group-D1.md); the table still tells assistive technology its full size.
 */
export const LongSpecification: Story = {
  name: 'Specification, 300 positions',
  render: () => <Specification layout="desktop" />,
  play: async ({ canvasElement }) => {
    // Cells found by their row and column: a query by accessible name would compute the names
    // of all 1,800 fields.
    const cellOf = (rowId: string) =>
      canvasElement.querySelector<HTMLInputElement>(
        `[data-row-id="${rowId}"] [data-column-id="current"] input`,
      )
    // 312 rows (6 × heading, 50 positions, subtotal), the header and the totals: the table says
    // so, while only the rows around the view are drawn.
    const table = within(canvasElement).getByRole('table', { name: 'Specification of works' })
    await expect(table).toHaveAttribute('aria-rowcount', '314')
    await expect(
      canvasElement.querySelectorAll('[data-column-id="current"] input:not([type="hidden"])')
        .length,
    ).toBeLessThan(100)
    const cell = cellOf('p0-1')
    await expect(cell).toHaveAccessibleName('This period, line 2')
    if (cell === null) return
    await userEvent.click(cell)
    await userEvent.keyboard('{Control>}a{/Control}12{Enter}')
    await expect(cellOf('p0-2')).toHaveFocus()
    await expect(cell).toHaveValue('12')
    await settle()
  },
}
