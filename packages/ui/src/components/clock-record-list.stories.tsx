import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { CLOCK_RECORDS, CLOCK_SOURCES } from './attendance-story-data'
import {
  ClockRecordList,
  type ClockCorrectionRequest,
  type ClockRecord,
  type ClockRecordListProps,
} from './clock-record-list'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const onCorrect = fn()

/** The application: it keeps the original and records who corrected what, when and why. */
function Records(props: Partial<ClockRecordListProps>) {
  const [records, setRecords] = useState<readonly ClockRecord[]>(props.records ?? CLOCK_RECORDS)
  const correct = (request: ClockCorrectionRequest) => {
    onCorrect(request)
    setRecords((current) =>
      current.map((record) => {
        if (record.id !== request.id) return record
        const at = (time: string | null, day: string) =>
          time === null ? null : `${day}T${time}:00+02:00`
        return {
          ...record,
          in: at(request.in, record.date),
          out: at(request.out, record.date),
          correction: record.correction ?? {
            originalIn: record.in,
            originalOut: record.out,
            by: 'Dragan Marković',
            at: '2026-10-06T10:05:00+02:00',
            reason: request.reason,
          },
        }
      }),
    )
  }
  return (
    <ClockRecordList
      label="Clock records, Bulevar Evrope site"
      sources={CLOCK_SOURCES}
      onCorrect={correct}
      decimals={2}
      {...props}
      records={records}
    />
  )
}

const meta = {
  title: 'Components/Working time/ClockRecordList',
  component: ClockRecordList,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          '**What for:** clock-in and clock-out records from terminals or a phone, with audited ' +
          'corrections. One row per record: name, date, clock-in, clock-out, duration (from the ' +
          'application), source and place, and the correction. A clock-out after midnight says ' +
          '"next day"; a missing clock-in or clock-out is said in words ("No clock-out"), never ' +
          '0.\n\n' +
          '**Corrections are audited:** "Correct" in a row’s menu opens a Drawer with the new ' +
          'times (typed freely, read as hh:mm) and a required reason. The application keeps the ' +
          'original: a corrected time shows the new value, then the original struck through ' +
          '("was" for assistive technology), and who corrected it, when and why.\n\n' +
          '**Phones:** DataTable’s cards.\n\n' +
          '**When not:** the hours of a month by type (AttendanceGrid in the hours mode); a ' +
          'schedule of planned shifts (the shift planner).',
      },
    },
  },
  args: { label: 'Clock records', records: CLOCK_RECORDS, sources: CLOCK_SOURCES },
  render: () => (
    <ExampleProvider>
      <Records />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof ClockRecordList>

export default meta

type Story = StoryObj<typeof meta>

/** Records from the gate terminal and the phone: a night shift, a correction, missing times. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getAllByText('No clock-out')[0]).toBeVisible()
    await expect(canvas.getByText('No clock-in')).toBeVisible()
    await expect(canvas.getByText('(next day)')).toBeVisible()
    await expect(canvas.getByText(/Corrected by Dragan Marković/)).toBeVisible()
    // The original is kept, struck through, read as "was".
    const struck = canvasElement.querySelector('s')
    await expect(struck).toHaveTextContent('No clock-out')
    await expect(struck?.parentElement).toHaveTextContent('was No clock-out')
  },
}

/** The correction drawer, open from the start. */
export const CorrectionDrawer: Story = {
  name: 'Correction drawer',
  render: () => (
    <ExampleProvider>
      <Records defaultCorrecting="c3" />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const drawer = await within(canvasElement.ownerDocument.body).findByRole('dialog')
    await expect(drawer).toHaveAccessibleName('Correct the record of Stefan Nikolić, 05.10.2026.')
    await expect(within(drawer).getByRole('textbox', { name: 'Clock-in' })).toHaveValue('07:01')
    await expect(within(drawer).getByRole('textbox', { name: 'Clock-out' })).toHaveValue('')
  },
}

/** "Correct" from the row's menu: the times are checked, the reason is required. */
export const Correcting: Story = {
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    onCorrect.mockClear()
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: /Stefan Nikolić, 05\.10\.2026\./ }),
    )
    await userEvent.click(await body.findByRole('menuitem', { name: 'Correct' }))
    const drawer = await body.findByRole('dialog')
    const out = within(drawer).getByRole('textbox', { name: 'Clock-out' })
    await userEvent.type(out, '15.7')
    await userEvent.click(within(drawer).getByRole('button', { name: 'Save correction' }))
    await expect(
      within(drawer).getByText('Enter a time as hh:mm, for example 07:30.'),
    ).toBeVisible()
    await expect(within(drawer).getByText('Required')).toBeVisible()
    await userEvent.clear(out)
    await userEvent.type(out, '1530')
    await userEvent.type(
      within(drawer).getByRole('textbox', { name: /Reason for the correction/ }),
      'The phone had no signal at the end of the shift.',
    )
    await userEvent.click(within(drawer).getByRole('button', { name: 'Save correction' }))
    await expect(onCorrect).toHaveBeenCalledWith({
      id: 'c3',
      in: '07:01',
      out: '15:30',
      reason: 'The phone had no signal at the end of the shift.',
    })
    await waitFor(async () => {
      await expect(body.queryByRole('dialog')).toBeNull()
    })
  },
}

/** Phones: DataTable's cards. */
export const Phone: Story = {
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div style={{ height: '100%', overflow: 'auto', padding: 16, boxSizing: 'border-box' }}>
          <Records layout="cards" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getAllByText('No clock-out')[0]).toBeVisible()
  },
}

const ARABIC_RECORDS: readonly ClockRecord[] = [
  {
    id: 'a1',
    person: 'أحمد الحسن',
    personDescription: 'عامل بناء',
    date: '2026-10-05',
    in: '2026-10-05T07:00:00+02:00',
    out: null,
    duration: null,
    source: 'gate',
    place: 'موقع البناء',
  },
  {
    id: 'a2',
    person: 'فاطمة الزهراء',
    date: '2026-10-05',
    in: '2026-10-05T22:00:00+02:00',
    out: '2026-10-06T06:00:00+02:00',
    duration: '8',
    source: 'phone',
  },
]

/** Arabic text, right to left: times and numbers stay left to right. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ClockRecordList
        label="سجلات الحضور"
        records={ARABIC_RECORDS}
        sources={[
          { id: 'gate', label: 'جهاز البوابة' },
          { id: 'phone', label: 'الهاتف' },
        ]}
        onCorrect={onCorrect}
      />
    </StoryProvider>
  ),
}

/** Japanese text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ClockRecordList
        label="打刻記録"
        records={[
          {
            id: 'j1',
            person: '佐藤 花子',
            personDescription: '現場監督',
            date: '2026-10-05',
            in: '2026-10-05T08:00:00+09:00',
            out: '2026-10-05T17:00:00+09:00',
            duration: '8',
            source: 'gate',
            place: '東京都 新宿区 工事現場',
          },
        ]}
        sources={[{ id: 'gate', label: '入口端末' }]}
      />
    </StoryProvider>
  ),
}

/** No records for the period. */
export const Empty: Story = {
  render: () => (
    <ClockRecordList
      label="Clock records"
      records={[]}
      sources={CLOCK_SOURCES}
      emptyAction={{ label: 'Import records', onClick: fn() }}
    />
  ),
}

/** The first load. */
export const Loading: Story = {
  render: () => (
    <ClockRecordList label="Clock records" records={[]} sources={CLOCK_SOURCES} loading />
  ),
}

/** Long names, places and reasons wrap. */
export const LongText: Story = {
  render: () => (
    <ExampleProvider>
      <Records
        records={[
          {
            ...CLOCK_RECORDS[1],
            id: 'l1',
            person: 'Aleksandra Konstantinović-Stefanović Radosavljević',
            personDescription:
              'Site foreman for the residential and commercial building, second stage',
            place: 'Novi Sad, Bulevar Evrope 12, the north gate by the crane, terminal 2 of 3',
            correction: {
              originalIn: '2026-10-05T06:58:00+02:00',
              originalOut: null,
              by: 'Dragan Marković',
              at: '2026-10-06T07:40:00+02:00',
              reason:
                'The terminal at the north gate was out of order from 15:00 because of a power cut; the foreman confirmed the end of the shift from the site diary.',
            },
          } as ClockRecord,
        ]}
      />
    </ExampleProvider>
  ),
}
