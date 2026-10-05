import type { Meta, StoryObj } from '@storybook/react-vite'
import { useEffect, useState, type ComponentProps } from 'react'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import type { ComboboxOption } from './combobox-field'
import { NumberText } from './display-text'
import { EditableGrid, type EditableGridColumn } from './editable-grid'
import type { GridMessage } from './editable-grid-logic'
import { SwitchField } from './checkbox-field'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { StoryProvider } from './story-frames'

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
          'shown under their row.\n\n**When not:** a list to read (DataTable); one record ' +
          '(fields in a form, P3.5).',
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

/** A decimal string as an integer at `scale` decimals (the application's arithmetic). */
function scaled(value: string, scale: number): bigint {
  const negative = value.startsWith('-')
  const [whole = '0', fraction = ''] = value.replace('-', '').split('.')
  const digits = BigInt(whole + fraction.padEnd(scale, '0').slice(0, scale))
  return negative ? -digits : digits
}

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
    : unscaled(scaled(line.quantity, 4) * scaled(line.price, 4), 8)

const totalOf = (lines: readonly Line[]): string =>
  unscaled(
    lines.reduce((sum, line) => {
      const amount = amountOf(line)
      return amount === null ? sum : sum + scaled(amount, 8)
    }, 0n),
    8,
  )

function messagesOf(lines: readonly Line[]): Record<string, GridMessage[]> {
  const result: Record<string, GridMessage[]> = {}
  for (const line of lines) {
    const list: GridMessage[] = []
    if (line.quantity !== null && scaled(line.quantity, 4) <= 0n) {
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
