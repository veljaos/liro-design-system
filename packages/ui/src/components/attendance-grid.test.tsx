import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { AttendanceGrid } from './attendance-grid'
import { ClockRecordList } from './clock-record-list'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

const CODES = [
  { code: 'RW', label: 'Regular work', short: 'RW', key: 'r' },
  { code: 'SL', label: 'Sick leave', short: 'SL', key: 's', tone: 'warning' as const },
]
const ROWS = [
  { id: 'a', label: 'Ana Ilić', description: 'Mason' },
  { id: 'b', label: 'Marko Ristić' },
]
const COLUMNS = [
  { id: 'd1', label: '1', date: '2026-10-01' },
  { id: 'd3', label: '3', date: '2026-10-03', kind: 'weekend' as const },
  { id: 'd20', label: '20', date: '2026-10-20', kind: 'holiday' as const, note: 'A holiday' },
]

describe('AttendanceGrid', () => {
  it('renders a grid with its size, headers, entries and totals from props', () => {
    const html = render(
      <AttendanceGrid
        label="Timesheet"
        mode="hours"
        rows={ROWS}
        columns={COLUMNS}
        codes={CODES}
        value={{ a: { d1: { code: 'RW', hours: '7.5' } } }}
        onChange={() => undefined}
        rowTotals={{ totals: [{ id: 't', label: 'Total' }], values: { a: { t: '7.5' } } }}
        columnTotals={{ totals: [{ id: 'h', label: 'Hours' }], values: { h: { d1: '7.5' } } }}
        marks={{ a: { d1: [{ label: 'Allowance' }] } }}
      />,
    )
    expect(html).toContain('role="grid"')
    expect(html).toContain('aria-rowcount="4"')
    expect(html).toContain('aria-colcount="5"')
    expect(html).toContain('7.5 h, Regular work. Allowance')
    expect(html).toContain('Holiday: A holiday')
    expect(html).toContain('Weekend')
    // A missing total is a dash, never 0.
    expect(html).toMatch(/<bdi>—<\/bdi>/)
    expect(html).toContain('Mark the selected cells')
    expect(html).toContain('aria-multiselectable="true"')
  })

  it('is read-only when locked: the lock line, no marking, corrections listed', () => {
    const html = render(
      <AttendanceGrid
        label="Timesheet"
        rows={ROWS}
        columns={COLUMNS}
        codes={CODES}
        value={{ a: { d1: { code: 'SL' } } }}
        locked={{ reason: 'Payroll done.' }}
        onCorrect={() => undefined}
        corrections={{
          a: {
            d1: {
              original: { code: 'RW' },
              by: 'Milica',
              at: '2026-10-05T09:15:00+02:00',
              reason: 'Certificate',
            },
          },
        }}
        handOff={{ state: 'done', label: 'Send', doneText: 'Sent to payroll' }}
      />,
    )
    expect(html).toContain('Payroll done.')
    expect(html).toContain('aria-readonly="true"')
    expect(html).not.toContain('Mark the selected cells')
    expect(html).toContain('Correct entry')
    expect(html).toContain('Original: Regular work')
    expect(html).toContain('Sent to payroll')
  })

  it('shows one person per screen on phones', () => {
    const html = render(
      <AttendanceGrid
        label="Timesheet"
        rows={ROWS}
        columns={COLUMNS}
        codes={CODES}
        value={{}}
        onChange={() => undefined}
        layout="phone"
        defaultRow="b"
      />,
    )
    expect(html).toContain('2 of 2')
    expect(html).toContain('Marko Ristić')
    expect(html).not.toContain('role="grid"')
  })
})

describe('ClockRecordList', () => {
  it('says missing times in words and keeps the original of a correction', () => {
    const html = render(
      <ClockRecordList
        label="Clock records"
        layout="table"
        sources={[{ id: 'g', label: 'Gate' }]}
        records={[
          {
            id: 'r1',
            person: 'Ana Ilić',
            date: '2026-10-05',
            in: '2026-10-05T07:00:00+02:00',
            out: '2026-10-05T16:00:00+02:00',
            duration: '9',
            source: 'g',
            correction: {
              originalIn: '2026-10-05T07:00:00+02:00',
              originalOut: null,
              by: 'Dragan',
              at: '2026-10-06T08:00:00+02:00',
              reason: 'Forgot',
            },
          },
          {
            id: 'r2',
            person: 'Marko Ristić',
            date: '2026-10-05',
            in: '2026-10-05T22:00:00+02:00',
            out: null,
            duration: null,
            source: 'g',
          },
        ]}
      />,
    )
    expect(html).toContain('No clock-out')
    expect(html).toMatch(/was <\/span><s[^>]*>No clock-out<\/s>/)
    expect(html).toContain('Corrected by Dragan')
    expect(html).toContain('9 h')
  })
})
