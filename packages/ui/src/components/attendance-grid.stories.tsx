import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { AttendanceGrid, type AttendanceGridProps } from './attendance-grid'
import type { AttendanceChange, AttendanceValue } from './attendance-logic'
import {
  ASSESSMENTS,
  GRADEBOOK_TOTALS,
  GRADEBOOK_VALUE,
  LESSONS,
  MARK_CODES,
  OCTOBER,
  PUPILS,
  SCHOOL_CODES,
  SCHOOL_VALUE,
  schoolTotals,
  SEPTEMBER,
  SEPTEMBER_SHEET,
  TIME_CODES,
  timesheet,
  timesheetTotals,
  WORKERS,
} from './attendance-story-data'
import { SectionCard } from './cards'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/** Applies the reported changes, as the application would. */
function apply(value: AttendanceValue, changes: readonly AttendanceChange[]): AttendanceValue {
  const next: Record<string, Record<string, AttendanceChange['entry']>> = {}
  for (const [row, cells] of Object.entries(value)) next[row] = { ...cells }
  for (const change of changes) {
    next[change.row] = { ...next[change.row], [change.column]: change.entry }
  }
  return next
}

const onChange = fn()
const onValidityChange = fn()
const onCorrect = fn()
const onHandOff = fn()

/** The school's grid: the application keeps the value and counts the totals. */
function School(props: Partial<AttendanceGridProps>) {
  const [value, setValue] = useState(SCHOOL_VALUE)
  return (
    <AttendanceGrid
      label="Attendance, class 6-2, Monday 05.10.2026."
      rowsLabel="Pupil"
      rows={PUPILS}
      columns={LESSONS}
      codes={SCHOOL_CODES}
      {...schoolTotals(value)}
      {...props}
      value={value}
      onChange={(changes) => {
        setValue((current) => apply(current, changes))
        onChange(changes)
      }}
    />
  )
}

const OCTOBER_SHEET = timesheet(OCTOBER, true)

/** October's timesheet: the application keeps the value and sends the totals. */
function Timesheet(props: Partial<AttendanceGridProps>) {
  const [value, setValue] = useState(OCTOBER_SHEET.value)
  return (
    <AttendanceGrid
      label="Timesheet, October 2026"
      rowsLabel="Employee"
      mode="hours"
      rows={WORKERS}
      columns={OCTOBER}
      codes={TIME_CODES}
      defaultCode="RW"
      marks={OCTOBER_SHEET.marks}
      handOff={{
        state: 'open',
        label: 'Send to payroll',
        doneText: 'Sent to payroll',
        onHandOff,
      }}
      onValidityChange={onValidityChange}
      {...timesheetTotals(value, OCTOBER)}
      {...props}
      value={value}
      onChange={(changes) => {
        setValue((current) => apply(current, changes))
        onChange(changes)
      }}
    />
  )
}

/** September, locked after payroll; a correction is applied by the application. */
function LockedMonth(props: Partial<AttendanceGridProps>) {
  const [value, setValue] = useState<AttendanceValue>(SEPTEMBER_SHEET.value)
  const [corrections, setCorrections] = useState(SEPTEMBER_SHEET.corrections)
  return (
    <AttendanceGrid
      label="Timesheet, September 2026"
      rowsLabel="Employee"
      mode="hours"
      rows={WORKERS}
      columns={SEPTEMBER}
      codes={TIME_CODES}
      marks={SEPTEMBER_SHEET.marks}
      locked={{
        reason: 'Payroll for September 2026 has been calculated.',
        detail: 'Locked by Milica Petrović on 03.10.2026. at 14:20',
      }}
      handOff={{
        state: 'done',
        label: 'Send to payroll',
        doneText: 'Sent to payroll on 03.10.2026.',
      }}
      corrections={corrections}
      {...timesheetTotals(value, SEPTEMBER)}
      {...props}
      value={value}
      onCorrect={(request) => {
        onCorrect(request)
        setValue((current) => apply(current, [request]))
        setCorrections((current) => ({
          ...current,
          [request.row]: {
            ...current[request.row],
            [request.column]: {
              original: request.previous,
              by: 'Milica Petrović',
              at: '2026-10-06T10:05:00+02:00',
              reason: request.reason,
            },
          },
        }))
      }}
    />
  )
}

/** The arrow key that points to the next column in the grid's reading direction. */
const forwardKey = (root: HTMLElement) =>
  getComputedStyle(root.querySelector('[role="grid"]') ?? root).direction === 'rtl'
    ? 'ArrowLeft'
    : 'ArrowRight'

const cellAt = (root: HTMLElement, row: number, column: number) => {
  const cell = root.querySelector<HTMLElement>(`[data-pos="${String(row)}:${String(column)}"]`)
  if (cell === null) throw new Error(`No cell ${String(row)}:${String(column)}`)
  return cell
}

const meta = {
  title: 'Components/Working time/AttendanceGrid',
  component: AttendanceGrid,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '**What for:** one pattern for marking people × days (or lessons) from the keyboard: ' +
          'school attendance (present, absent, late, excused), a gradebook’s marks, a monthly ' +
          'timesheet (hours and a code per day). The codes, their keys and tones, the totals, ' +
          'marks, the lock, corrections and the hand-off are the application’s data; the grid ' +
          'shows them and reports changes (`onChange` with a list of changes). It computes ' +
          'nothing: totals come from props, hours are decimal strings read by ' +
          '`format.parseNumber`, unreadable hours stay in the cell with the field’s message, ' +
          'never 0.\n\n' +
          '**Keyboard (a WAI-ARIA grid, one cell in the tab order):** the arrows move over ' +
          'headers, cells and totals; Home and End to the row’s ends, Ctrl+Home and Ctrl+End to ' +
          'the corners; Shift with an arrow (or a press with Shift) selects a range. **Code ' +
          'mode:** a code’s key marks the cell and moves down (`advance`), or marks the whole ' +
          'selection; Delete clears; a column header’s menu "Mark everyone", a row header’s ' +
          '"Mark all" (weekends and holidays left out). **Hours mode:** a digit starts typing ' +
          'hours (Enter or F2 edits; Enter, Tab and Escape as in a spreadsheet), a code’s key ' +
          'sets the code, Ctrl+D fills the selection with its first cell’s entry, "Copy ' +
          'previous week" copies the week before the focused one for the selected rows (days of ' +
          'the same kind only). The toolbar offers every key as a button.\n\n' +
          '**Shown:** weekends and holidays shaded (surface.sunken) and named — a holiday’s mark ' +
          'and note, the weekday —, never by colour alone; the selection neutral ' +
          '(surface.selected with a border.selected line); marks (an allowance) as a small dot ' +
          'with their label in the cell’s description and tooltip; night hours as one more ' +
          'total. **Locked** (after payroll): read-only, a change only through a correction ' +
          'with a required reason; the original is kept and listed.\n\n' +
          '**Phones:** one person per screen, Previous / "3 of 12" / Next and a chooser, the ' +
          'person’s totals, the days as a list of fields.\n\n' +
          '**When not:** document lines with many fields per line (EditableGrid); a schedule of ' +
          'shifts with times and conflicts (the shift planner); a list of records (DataTable).',
      },
    },
  },
  args: {
    label: 'Attendance',
    rows: PUPILS,
    columns: LESSONS,
    codes: SCHOOL_CODES,
    value: SCHOOL_VALUE,
  },
  render: () => (
    <ExampleProvider>
      <School />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof AttendanceGrid>

export default meta

type Story = StoryObj<typeof meta>

/** Quick marking of a class: lessons 1–3 marked, 4–6 still to do. */
export const SchoolAttendance: Story = {
  name: 'School attendance (OŠ "Jovan Popović", 6-2)',
  render: () => (
    <ExampleProvider>
      <SectionCard
        title='OŠ "Jovan Popović", class 6-2'
        description="Monday 05.10.2026. · Class teacher Jelena Simić"
        headingLevel={2}
      >
        <School />
      </SectionCard>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const grid = canvas.getByRole('grid', { name: /Attendance, class 6-2/ })
    await expect(grid).toHaveAttribute('aria-rowcount', String(PUPILS.length + 3))
    // One cell in the tab order.
    await expect(grid.querySelectorAll('[tabindex="0"]')).toHaveLength(1)
    await expect(canvas.getByRole('group', { name: 'Mark the selected cells' })).toBeVisible()
  },
}

/** One key per mark: P, A, L, E mark and move down; a range marked at once; a column's menu. */
export const KeyboardMarking: Story = {
  name: 'School attendance, keyboard marking',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <School />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    onChange.mockClear()
    // Lesson 4, the first pupil.
    await userEvent.click(cellAt(canvasElement, 1, 4))
    await userEvent.keyboard('p')
    await expect(onChange).toHaveBeenLastCalledWith([
      { row: 'p1', column: 'l4', entry: { code: 'present' }, previous: null },
    ])
    await expect(cellAt(canvasElement, 2, 4)).toHaveFocus()
    await userEvent.keyboard('a')
    await expect(cellAt(canvasElement, 2, 4)).toHaveTextContent('Absent')
    await expect(cellAt(canvasElement, 3, 4)).toHaveFocus()
    // Shift+ArrowDown twice: three cells, then L marks them all and the focus stays.
    await userEvent.keyboard('{Shift>}{ArrowDown}{ArrowDown}{/Shift}')
    await expect(canvasElement).toHaveTextContent('3 cells selected')
    await userEvent.keyboard('l')
    for (const row of [3, 4, 5])
      await expect(cellAt(canvasElement, row, 4)).toHaveTextContent('Late')
    await expect(cellAt(canvasElement, 5, 4)).toHaveFocus()
    // Up to the header: its menu marks everyone.
    await userEvent.keyboard('{Control>}{Home}{/Control}')
    await expect(cellAt(canvasElement, 0, 0)).toHaveFocus()
    const forward = forwardKey(canvasElement)
    await userEvent.keyboard(`{${forward}}`.repeat(5))
    const header = cellAt(canvasElement, 0, 5)
    await expect(header).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    const menu = await within(canvasElement.ownerDocument.body).findByRole('menu')
    await userEvent.click(within(menu).getByRole('menuitem', { name: 'Mark everyone: Present' }))
    await waitFor(async () => {
      await expect(cellAt(canvasElement, PUPILS.length, 5)).toHaveTextContent('Present')
    })
  },
}

/** A gradebook: marks 1–5 by their digit keys, the average from the application. */
export const Gradebook: Story = {
  render: () => {
    function Book() {
      const [value, setValue] = useState(GRADEBOOK_VALUE)
      return (
        <AttendanceGrid
          label="Mathematics, class 6-2, first term"
          rowsLabel="Pupil"
          rows={PUPILS}
          columns={ASSESSMENTS}
          codes={MARK_CODES}
          rowTotals={GRADEBOOK_TOTALS}
          value={value}
          onChange={(changes) => {
            setValue((current) => apply(current, changes))
          }}
        />
      )
    }
    return (
      <ExampleProvider>
        <Book />
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('columnheader', { name: 'Average' })).toBeVisible()
    await expect(cellAt(canvasElement, 1, 6)).toHaveTextContent('4,00')
  },
}

/** October 2026 for the site workers: hours and codes, weekends and the holiday shaded. */
export const MonthlyTimesheet: Story = {
  name: 'Monthly timesheet (Kvadrat Gradnja, October 2026)',
  render: () => (
    <ExampleProvider>
      <Timesheet />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    // The holiday is named, not only shaded.
    await expect(
      canvas.getByRole('columnheader', { name: /20.*Holiday: Illustrative/ }),
    ).toBeVisible()
    // Night hours are one more total; the allowance mark is described.
    await expect(canvas.getByRole('columnheader', { name: 'Night hours' })).toBeVisible()
    await expect(cellAt(canvasElement, 8, 5)).toHaveTextContent('Night work allowance')
    await expect(canvas.getByRole('button', { name: 'Send to payroll' })).toBeVisible()
  },
}

/** A range selected (shown from the start): the toolbar fills it, or a key marks it. */
export const RangeSelected: Story = {
  name: 'Monthly timesheet, a range selected',
  render: () => (
    <ExampleProvider>
      <Timesheet
        defaultSelection={{
          anchor: { row: 'w2', column: '2026-10-12' },
          focus: { row: 'w4', column: '2026-10-16' },
        }}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(cellAt(canvasElement, 3, 14)).toHaveAttribute('aria-selected', 'true')
    await expect(cellAt(canvasElement, 5, 14)).toHaveAttribute('aria-selected', 'false')
    await expect(canvasElement).toHaveTextContent('15 cells selected')
    await expect(
      within(canvasElement).getByRole('button', { name: 'Fill the selection' }),
    ).toBeVisible()
  },
}

/** Type hours, then select the week and fill it with Ctrl+D. */
export const FillRange: Story = {
  name: 'Monthly timesheet, fill a range',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Timesheet />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    onChange.mockClear()
    // Nenad Ilić, Monday 26 October: typing a digit starts the hours, Enter commits.
    await userEvent.click(cellAt(canvasElement, 3, 26))
    await userEvent.keyboard('7,5{Enter}')
    await expect(onChange).toHaveBeenLastCalledWith([
      { row: 'w3', column: '2026-10-26', entry: { code: 'RW', hours: '7.5' }, previous: null },
    ])
    await expect(cellAt(canvasElement, 4, 26)).toHaveFocus()
    // Back up, select to Friday, fill.
    await userEvent.keyboard('{ArrowUp}')
    const forward = forwardKey(canvasElement)
    await userEvent.keyboard(`{Shift>}${`{${forward}}`.repeat(4)}{/Shift}`)
    await userEvent.keyboard('{Control>}d{/Control}')
    await waitFor(async () => {
      await expect(onChange).toHaveBeenLastCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            row: 'w3',
            column: '2026-10-30',
            entry: { code: 'RW', hours: '7.5' },
          }),
        ]),
      )
    })
    await expect(cellAt(canvasElement, 3, 30)).toHaveTextContent('7,5 h, Regular work')
  },
}

/** "Copy previous week" for the focused cell's week: the holiday is not copied onto a workday. */
export const CopyPreviousWeek: Story = {
  name: 'Monthly timesheet, copy previous week',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Timesheet />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    onChange.mockClear()
    await userEvent.click(cellAt(canvasElement, 3, 28))
    await userEvent.click(within(canvasElement).getByRole('button', { name: 'Copy previous week' }))
    const changes = onChange.mock.lastCall?.[0] as AttendanceChange[] | undefined
    await expect(changes?.map((change) => change.column)).toEqual([
      '2026-10-26',
      '2026-10-28',
      '2026-10-29',
      '2026-10-30',
    ])
    // Tuesday the 27th stays empty: the 20th was a holiday.
    await expect(cellAt(canvasElement, 3, 27)).toHaveTextContent('No entry')
  },
}

/** Unreadable hours stay in the cell with the field's message; never 0. */
export const UnreadableHours: Story = {
  name: 'Monthly timesheet, unreadable hours',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Timesheet />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    onValidityChange.mockClear()
    onChange.mockClear()
    await userEvent.click(cellAt(canvasElement, 3, 27))
    await userEvent.keyboard('8x{Enter}')
    await expect(cellAt(canvasElement, 3, 27)).toHaveTextContent('8x, Enter a number')
    await expect(onValidityChange).toHaveBeenLastCalledWith(false)
    await expect(onChange).not.toHaveBeenCalled()
    await userEvent.keyboard('{ArrowUp}{F2}{Backspace}{Enter}')
    await expect(cellAt(canvasElement, 3, 27)).toHaveTextContent('8 h, Regular work')
    await expect(onValidityChange).toHaveBeenLastCalledWith(true)
  },
}

/** September, locked after payroll: read-only; one correction with who, when and why. */
export const LockedWithCorrection: Story = {
  name: 'Locked month with a correction',
  render: () => (
    <ExampleProvider>
      <LockedMonth />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('grid')).toHaveAttribute('aria-readonly', 'true')
    await expect(canvas.getByText('Payroll for September 2026 has been calculated.')).toBeVisible()
    await expect(canvas.getByRole('heading', { name: 'Corrections' })).toBeVisible()
    // Nenad Ilić, 16 September: the correction in the cell's description.
    await expect(cellAt(canvasElement, 3, 16)).toHaveTextContent(
      /Sick leave.*Corrected by Milica Petrović.*Original: 8 h, Regular work/,
    )
    await expect(canvas.getByText('Sent to payroll on 03.10.2026.')).toBeVisible()
    await expect(canvas.queryByRole('group', { name: 'Mark the selected cells' })).toBeNull()
  },
}

/** The correction dialog, open from the start (the new entry and a required reason). */
export const CorrectionDialog: Story = {
  name: 'Locked month, correction dialog',
  render: () => (
    <ExampleProvider>
      <LockedMonth defaultCorrecting={{ row: 'w7', column: '2026-09-29' }} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const dialog = await within(canvasElement.ownerDocument.body).findByRole('dialog')
    // The weekday is the provider's format's (a Serbian tenant: "uto 29").
    await expect(dialog).toHaveAccessibleName(/^Correct Ivan Stojanović, \S+ 29$/)
    await expect(within(dialog).getByText('8 h, Regular work')).toBeVisible()
  },
}

/** Enter on a locked cell asks for the correction; the reason is required. */
export const Correcting: Story = {
  name: 'Locked month, correcting',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <LockedMonth />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    onCorrect.mockClear()
    await userEvent.click(cellAt(canvasElement, 7, 29))
    await userEvent.keyboard('p')
    await expect(cellAt(canvasElement, 7, 29)).toHaveTextContent('8 h, Regular work')
    await userEvent.keyboard('{Enter}')
    const body = within(canvasElement.ownerDocument.body)
    const dialog = await body.findByRole('dialog')
    const hours = within(dialog).getByRole('textbox', { name: 'Hours' })
    await userEvent.clear(hours)
    await userEvent.type(hours, '4')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save correction' }))
    await expect(within(dialog).getByText('Required')).toBeVisible()
    await expect(onCorrect).not.toHaveBeenCalled()
    await userEvent.type(
      within(dialog).getByRole('textbox', { name: /Reason for the correction/ }),
      'Left at noon: doctor’s appointment.',
    )
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save correction' }))
    await expect(onCorrect).toHaveBeenCalledWith(
      expect.objectContaining({
        row: 'w7',
        column: '2026-09-29',
        entry: { code: 'RW', hours: '4' },
        reason: 'Left at noon: doctor’s appointment.',
      }),
    )
    await waitFor(async () => {
      await expect(cellAt(canvasElement, 7, 29)).toHaveTextContent(/4 h, Regular work.*Corrected/)
    })
  },
}

/** Phones: one employee per screen, the days as a list of fields, totals at the top. */
export const Phone: Story = {
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div style={{ height: '100%', overflow: 'auto', padding: 16, boxSizing: 'border-box' }}>
          <Timesheet layout="phone" defaultRow="w8" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Marko Pavlović' })).toBeVisible()
    await expect(canvas.getByText('8 of 8')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Next' })).toBeDisabled()
    await expect(canvas.getByText('Night hours')).toBeVisible()
  },
}

/** Phones, locked: the entries as text, a correction per day. */
export const PhoneLocked: Story = {
  name: 'Phone, locked',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div style={{ height: '100%', overflow: 'auto', padding: 16, boxSizing: 'border-box' }}>
          <LockedMonth layout="phone" defaultRow="w3" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: /^Correct entry: \S+ 1$/ })).toBeVisible()
    await expect(canvas.getAllByText(/Corrected by Milica Petrović/).length).toBeGreaterThan(0)
  },
}

/** Phones, choosing another person. */
export const PhoneInteraction: Story = {
  name: 'Phone, next person',
  tags: ['interaction'],
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div style={{ height: '100%', overflow: 'auto', padding: 16, boxSizing: 'border-box' }}>
          <Timesheet layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Previous' })).toBeDisabled()
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await expect(canvas.getByRole('heading', { name: 'Milan Jovanović' })).toBeVisible()
    await expect(canvas.getByText('2 of 8')).toBeVisible()
  },
}

const ARABIC_CODES = [
  { code: 'p', label: 'حاضر', short: 'ح', key: 'p' },
  { code: 'a', label: 'غائب', short: 'غ', key: 'a', tone: 'danger' as const },
  { code: 'l', label: 'متأخر', short: 'م', key: 'l', tone: 'warning' as const },
]
const ARABIC_ROWS = ['أحمد الحسن', 'فاطمة الزهراء', 'يوسف إبراهيم', 'مريم خالد'].map(
  (label, index) => ({ id: `r${String(index)}`, label, description: 'الصف السادس' }),
)
const SMALL_COLUMNS = ['1', '2', '3', '4', '5'].map((label) => ({ id: `c${label}`, label }))

/** Arabic text, right to left: the forward arrow points left; numbers stay left to right. */
export const Arabic: Story = {
  render: () => {
    function Grid() {
      const [value, setValue] = useState<AttendanceValue>({
        r0: { c1: { code: 'p' }, c2: { code: 'p' } },
        r1: { c1: { code: 'a' }, c2: { code: 'l' } },
      })
      return (
        <AttendanceGrid
          label="الحضور"
          rowsLabel="الطالب"
          advance="forward"
          rows={ARABIC_ROWS}
          columns={SMALL_COLUMNS}
          codes={ARABIC_CODES}
          value={value}
          rowTotals={{
            totals: [{ id: 'a', label: 'الغياب' }],
            values: { r0: { a: '0' }, r1: { a: '1' }, r2: { a: null }, r3: { a: null } },
          }}
          onChange={(changes) => {
            setValue((current) => apply(current, changes))
          }}
        />
      )
    }
    return (
      <StoryProvider locale="ar">
        <Grid />
      </StoryProvider>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('grid', { name: 'الحضور' })).toBeVisible()
  },
}

/** Japanese text. */
export const Japanese: Story = {
  render: () => {
    function Grid() {
      const [value, setValue] = useState<AttendanceValue>({
        r0: { c1: { code: 'p' }, c2: { code: 'p' } },
        r2: { c1: { code: 'l' } },
      })
      return (
        <AttendanceGrid
          label="出欠"
          rowsLabel="生徒"
          rows={['佐藤 花子', '鈴木 一郎', '高橋 美咲'].map((label, index) => ({
            id: `r${String(index)}`,
            label,
            description: '6年2組',
          }))}
          columns={SMALL_COLUMNS}
          codes={[
            { code: 'p', label: '出席', short: '出', key: 'p' },
            { code: 'a', label: '欠席', short: '欠', key: 'a', tone: 'danger' },
            { code: 'l', label: '遅刻', short: '遅', key: 'l', tone: 'warning' },
          ]}
          value={value}
          onChange={(changes) => {
            setValue((current) => apply(current, changes))
          }}
        />
      )
    }
    return (
      <StoryProvider locale="ja">
        <Grid />
      </StoryProvider>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('grid', { name: '出欠' })).toBeVisible()
  },
}

/** No people yet: the empty state. */
export const Empty: Story = {
  render: () => (
    <AttendanceGrid
      label="Attendance"
      rows={[]}
      columns={LESSONS}
      codes={SCHOOL_CODES}
      value={{}}
      empty="No pupils in this class yet"
    />
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('No pupils in this class yet')).toBeVisible()
  },
}

/** The first load. */
export const Loading: Story = {
  render: () => (
    <AttendanceGrid
      label="Attendance"
      rows={[]}
      columns={LESSONS}
      codes={SCHOOL_CODES}
      value={{}}
      loading
    />
  ),
}

/** Long names, descriptions, labels and reasons wrap; the hand-off is unavailable with its reason. */
export const LongText: Story = {
  render: () => (
    <ExampleProvider>
      <Timesheet
        rows={WORKERS.map((worker, index) =>
          index === 0
            ? {
                ...worker,
                label: 'Aleksandra Konstantinović-Stefanović Radosavljević',
                description:
                  'Site foreman for the residential and commercial building at Bulevar Evrope 12, second stage',
              }
            : worker,
        )}
        locked={{
          reason:
            'The timesheet is being checked by the accounting office before payroll; entries can be corrected only with a reason until the check is finished.',
        }}
        onCorrect={onCorrect}
        handOff={{
          state: 'open',
          label: 'Send the timesheet to payroll for calculation',
          doneText: 'Sent',
          unavailableReason:
            'Nenad Ilić has no entries for 26–30 October; every working day needs an entry before payroll.',
        }}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByText(/Unavailable: Nenad Ilić has no entries/),
    ).toBeVisible()
  },
}

const MANY = Array.from({ length: 300 }, (_, index) => ({
  id: `m${String(index)}`,
  label: `${['Ana', 'Marko', 'Jelena', 'Nikola', 'Ivana', 'Stefan'][index % 6] ?? ''} ${
    ['Petrović', 'Jovanović', 'Ilić', 'Nikolić', 'Marković'][index % 5] ?? ''
  } ${String(index + 1)}`,
}))

/** 300 people: only the rows in view are drawn; the grid still tells its whole size. */
export const ManyRows: Story = {
  render: () => (
    <AttendanceGrid
      label="Attendance, all classes"
      rows={MANY}
      columns={LESSONS}
      codes={SCHOOL_CODES}
      value={{}}
      onChange={onChange}
      virtualize
      maxHeight="480px"
    />
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const grid = within(canvasElement).getByRole('grid')
    await expect(grid).toHaveAttribute('aria-rowcount', '301')
    await expect(grid.querySelectorAll('[role="rowheader"]').length).toBeLessThan(100)
  },
}

/** Ctrl+End reaches the last person: drawn and focused. */
export const ManyRowsKeyboard: Story = {
  name: 'Many rows, keyboard',
  tags: ['interaction'],
  render: () => (
    <AttendanceGrid
      label="Attendance, all classes"
      rows={MANY}
      columns={LESSONS}
      codes={SCHOOL_CODES}
      value={{}}
      onChange={onChange}
      maxHeight="480px"
    />
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(cellAt(canvasElement, 1, 1))
    await userEvent.keyboard('{Control>}{End}{/Control}')
    await waitFor(async () => {
      await expect(cellAt(canvasElement, 300, 6)).toHaveFocus()
    })
  },
}
