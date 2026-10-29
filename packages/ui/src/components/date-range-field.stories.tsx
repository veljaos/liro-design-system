import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { DateRangeField, type DateRange } from './date-field'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { LiroProvider, useLiro } from '../provider/liro-provider'

const meta = {
  title: 'Components/Fields/DateRangeField',
  component: DateRangeField,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** two dates that belong together — a period of a report, a validity, a ' +
          'stay — shown as "start – end" in one field. Each end is typed as in DateField ' +
          '("07102026", "7.10." in this year; a press anywhere in the field puts the caret in the ' +
          'first empty end), or both ' +
          'are picked in the calendar: the first day pressed is one end, the second the other, in ' +
          'either order. Either end may stay open (null). An end before the start is shown as an ' +
          'error and reported with `onValidityChange(false)`; it is never swapped silently.\n\n' +
          '**When not:** a whole month, quarter or business year (PeriodField, with presets); a ' +
          'single date (DateField).',
      },
    },
  },
  args: { label: 'Period' },
  play: settle,
} satisfies Meta<typeof DateRangeField>

export default meta

type Story = StoryObj<typeof meta>

/** Type either end, or open the calendar and press two days. */
export const Default: Story = {
  args: { description: 'Both dates are included' },
  render: function Render(args) {
    const [value, setValue] = useState<DateRange>({ start: '2026-03-01', end: '2026-03-31' })
    const [valid, setValid] = useState(true)
    return (
      <div className="flex max-w-100 flex-col gap-3">
        <DateRangeField {...args} value={value} onChange={setValue} onValidityChange={setValid} />
        <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
          Value: <code>{JSON.stringify(value)}</code>, valid: <code>{String(valid)}</code>
        </p>
      </div>
    )
  },
}

/** Two days pressed in the calendar, the later one first: the range is put in order. */
export const PickInCalendar: Story = {
  name: 'Pick in the calendar',
  render: function Render() {
    const [value, setValue] = useState<DateRange>({ start: '2026-03-01', end: null })
    return (
      <div className="flex min-h-100 max-w-100 flex-col gap-3">
        <DateRangeField label="Period" value={value} onChange={setValue} defaultOpen />
        <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
          Value: <code>{JSON.stringify(value)}</code>
        </p>
      </div>
    )
  },
  play: async () => {
    await within(document.body).findByRole('grid')
    await settle()
  },
}

export const PickInCalendarInteraction: Story = {
  name: 'Pick in the calendar, interaction',
  tags: ['interaction'],
  render: function Render() {
    const [value, setValue] = useState<DateRange>({ start: '2026-03-01', end: null })
    return (
      <div className="flex min-h-100 max-w-100 flex-col gap-3">
        <DateRangeField label="Period" value={value} onChange={setValue} />
        <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
          Value: <code>{JSON.stringify(value)}</code>
        </p>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(body.getByRole('button', { name: 'Choose a date' }))
    const grid = await body.findByRole('grid')
    const days = within(grid).getAllByRole('button')
    const day = (n: number) =>
      days.find((button) => button.textContent === String(n) && !button.closest('[data-outside]'))
    const twentieth = day(20)
    const tenth = day(10)
    if (twentieth === undefined || tenth === undefined) throw new Error('days not found')
    await userEvent.click(twentieth)
    await userEvent.click(tenth)
    await waitFor(() => expect(body.queryByRole('grid')).toBeNull())
    await expect(
      within(canvasElement).getByText('{"start":"2026-03-10","end":"2026-03-20"}'),
    ).toBeVisible()
    await settle()
  },
}

/** A Serbian screen whose "today" is 14.10.2026., in the story's theme and direction. */
function SerbianToday({ children }: { children: ReactNode }) {
  const { colorScheme, direction } = useLiro()
  return (
    <LiroProvider
      locale="sr-Latn-RS"
      direction={direction}
      colorScheme={colorScheme}
      today="2026-10-14"
    >
      {children}
    </LiroProvider>
  )
}

/**
 * Typed, the quick way (P5.94 item 2): a press in the empty field puts the caret in the start;
 * "07102026" and "16.10." (this year) are read on Tab and written back as dates. No calendar.
 */
export const TypedInteraction: Story = {
  name: 'Typed, interaction',
  tags: ['interaction'],
  render: function Render() {
    const [value, setValue] = useState<DateRange>({ start: null, end: null })
    return (
      <SerbianToday>
        <div className="flex max-w-100 flex-col gap-3">
          <DateRangeField label="Dates" value={value} onChange={setValue} />
          <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
            Value: <code>{JSON.stringify(value)}</code>
          </p>
        </div>
      </SerbianToday>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const frame = canvasElement.querySelector<HTMLElement>('[data-slot="date-range"]')
    if (frame === null) throw new Error('no range frame')
    // A press in the middle of the empty field, beside the two short ends.
    const box = frame.getBoundingClientRect()
    await userEvent.pointer({
      keys: '[MouseLeft]',
      target: frame,
      coords: { clientX: box.left + box.width * 0.6, clientY: box.top + box.height / 2 },
    })
    const start = canvas.getByRole('textbox', { name: 'Dates Start' })
    await expect(start).toHaveFocus()
    await userEvent.keyboard('07102026')
    await userEvent.tab()
    await userEvent.keyboard('16.10.')
    await userEvent.tab()
    await expect(canvas.getByText('{"start":"2026-10-07","end":"2026-10-16"}')).toBeVisible()
    await expect(start).toHaveValue('07.10.2026.')
    await expect(canvas.getByRole('textbox', { name: 'Dates End' })).toHaveValue('16.10.2026.')
    await expect(canvas.queryByRole('grid')).toBeNull()
    await settle()
  },
}

/** Open end, the end before the start (its own error), the application's error, read only. */
export const States: Story = {
  render: () => (
    <div className="flex max-w-100 flex-col gap-6">
      <DateRangeField label="Validity" required defaultValue={{ start: '2026-01-01', end: null }} />
      <DateRangeField label="Period" defaultValue={{ start: '2026-03-31', end: '2026-03-01' }} />
      <DateRangeField
        label="Stay"
        defaultValue={{ start: '2026-07-01', end: '2026-07-20' }}
        error="The stay overlaps another booking."
      />
      <DateRangeField
        label="Contract (read-only)"
        readOnly
        defaultValue={{ start: '2026-01-01', end: '2026-12-31' }}
      />
    </div>
  ),
}

/** Long label and error at phone width: both dates still fit. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="flex w-[390px] max-w-full flex-col gap-6 rounded-md border border-default bg-surface-raised p-4">
      <DateRangeField
        label={LONG.label}
        description={LONG.description}
        defaultValue={{ start: '2026-01-01', end: '2026-12-31' }}
      />
      <DateRangeField
        label={LONG.label}
        error={LONG.error}
        defaultValue={{ start: '2026-01-01', end: '2026-12-31' }}
      />
    </div>
  ),
}

/** Arabic sample text, right to left. */
export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="flex max-w-100 flex-col gap-6">
      <DateRangeField
        label={ARABIC.label}
        description={ARABIC.description}
        defaultValue={{ start: '2026-01-01', end: '2026-03-31' }}
      />
      <DateRangeField label={ARABIC.label} required error={ARABIC.error} />
      <DateRangeField
        label={ARABIC.label}
        readOnly
        defaultValue={{ start: '2026-01-01', end: '2026-03-31' }}
      />
    </div>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="flex max-w-100 flex-col gap-6">
      <DateRangeField
        label={JAPANESE.label}
        description={JAPANESE.description}
        defaultValue={{ start: '2026-01-01', end: '2026-03-31' }}
      />
      <DateRangeField label={JAPANESE.label} required error={JAPANESE.error} />
      <DateRangeField
        label={JAPANESE.label}
        readOnly
        defaultValue={{ start: '2026-01-01', end: '2026-03-31' }}
      />
    </div>
  ),
}
