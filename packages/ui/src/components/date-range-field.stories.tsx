import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { DateRangeField, type DateRange } from './date-field'
import { ARABIC, JAPANESE, LONG } from './field-story-data'

const meta = {
  title: 'Components/Fields/DateRangeField',
  component: DateRangeField,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** two dates that belong together — a period of a report, a validity, a ' +
          'stay — shown as "start – end" in one field. Each end is typed as in DateField, or both ' +
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
        <p className="m-0 text-sm text-secondary">
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
        <p className="m-0 text-sm text-secondary">
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
        <p className="m-0 text-sm text-secondary">
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

/** Open end, the end before the start (its own error), the application's error, read-only, disabled. */
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
      <DateRangeField
        label="Contract (disabled)"
        disabled
        disabledReason="Signed contracts cannot be changed."
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
      <DateRangeField label={ARABIC.label} disabled disabledReason={ARABIC.reason} />
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
      <DateRangeField label={JAPANESE.label} disabled disabledReason={JAPANESE.reason} />
    </div>
  ),
}
