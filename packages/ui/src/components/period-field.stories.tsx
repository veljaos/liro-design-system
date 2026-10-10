import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { LiroProvider, useLiro } from '../provider/liro-provider'
import type { DateRange } from './date-field'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { PeriodField } from './period-field'

/** A nested provider with a fixed "today", in the story's theme, locale and direction. */
function Today({ today, children }: { today: string; children: ReactNode }) {
  const { colorScheme, locale, direction } = useLiro()
  return (
    <LiroProvider locale={locale} direction={direction} colorScheme={colorScheme} today={today}>
      {children}
    </LiroProvider>
  )
}

const meta = {
  title: 'Components/Fields/PeriodField',
  component: PeriodField,
  decorators: [
    (Story) => (
      <Today today="2026-09-28">
        <Story />
      </Today>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the period of a report or a list: a preset (today, this week, this ' +
          'month, last month, this quarter, last quarter, year to date, last year) or a custom ' +
          'range picked in the calendar. Presets follow the business year (`yearStartMonth`), ' +
          'the quarter basis (`quarterBasis`: the business year, or the calendar for periods ' +
          "such as quarterly VAT) and the provider's `today` and `weekStartsOn`. The trigger " +
          'names the period: a month, "Q1 2025/26", a business year "2025/26", or two dates; the ' +
          "business year's name comes from `format.businessYear`, the quarter's from " +
          '`messages`. A preset is shown active when the value is exactly its range. `clearable` ' +
          'offers "Clear": all periods (null). The stories fix today at 28 September 2026.\n\n' +
          '**When not:** a date in a form (DateField); two dates that are not a reporting period ' +
          '(DateRangeField).',
      },
    },
  },
  args: { label: 'Period' },
  play: settle,
} satisfies Meta<typeof PeriodField>

export default meta

type Story = StoryObj<typeof meta>

function Controlled(props: {
  initial: DateRange | null
  yearStartMonth?: number
  quarterBasis?: 'business' | 'calendar'
  clearable?: boolean
  label?: string
  defaultOpen?: boolean
}) {
  const [value, setValue] = useState(props.initial)
  return (
    <div className="flex max-w-100 flex-col gap-3">
      <PeriodField
        label={props.label ?? 'Period'}
        value={value}
        onChange={setValue}
        {...(props.yearStartMonth === undefined ? {} : { yearStartMonth: props.yearStartMonth })}
        {...(props.quarterBasis === undefined ? {} : { quarterBasis: props.quarterBasis })}
        {...(props.clearable === undefined ? {} : { clearable: props.clearable })}
        {...(props.defaultOpen === undefined ? {} : { defaultOpen: props.defaultOpen })}
      />
      <p className="m-0 text-sm text-secondary">
        Value: <code>{JSON.stringify(value)}</code>
      </p>
    </div>
  )
}

/** This month; open it to choose a preset or a custom range. */
export const Default: Story = {
  render: () => <Controlled initial={{ start: '2026-09-01', end: '2026-09-30' }} clearable />,
}

/** Open: presets on the start side ("This month" active), the range calendar beside them. */
export const Open: Story = {
  render: () => (
    <div className="min-h-110">
      <Controlled initial={{ start: '2026-09-01', end: '2026-09-30' }} clearable defaultOpen />
    </div>
  ),
  play: async () => {
    await within(document.body).findByRole('button', { name: 'This month' })
    await settle()
  },
}

export const OpenInteraction: Story = {
  name: 'Open, interaction',
  tags: ['interaction'],
  render: () => (
    <div className="min-h-110">
      <Controlled initial={{ start: '2026-09-01', end: '2026-09-30' }} clearable />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(body.getByRole('button', { name: /Period/ }))
    const active = await body.findByRole('button', { name: 'This month' })
    await expect(active).toHaveAttribute('aria-pressed', 'true')
    await expect(body.getByRole('button', { name: 'Last month' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await settle()
  },
}

/** A preset applies at once; two days in the calendar apply a custom range. */
export const PresetAndRange: Story = {
  name: 'Preset, then a custom range',
  tags: ['interaction'],
  render: () => (
    <div className="min-h-110">
      <Controlled initial={null} clearable />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const document = canvasElement.ownerDocument
    const body = within(document.body)
    const canvas = within(canvasElement)
    const trigger = body.getByRole('button', { name: /Period/ })
    await userEvent.click(trigger)
    await userEvent.click(await body.findByRole('button', { name: 'Last quarter' }))
    await expect(canvas.getByText('{"start":"2026-04-01","end":"2026-06-30"}')).toBeVisible()
    await expect(trigger).toHaveTextContent('Q2 2026')
    await userEvent.click(trigger)
    const grid = await body.findByRole('grid')
    const day = (n: number) =>
      within(grid)
        .getAllByRole('button')
        .find((b) => b.textContent === String(n) && b.closest('[data-outside]') === null)
    const fifth = day(5)
    const twelfth = day(12)
    if (fifth === undefined || twelfth === undefined) throw new Error('days not found')
    await userEvent.click(twelfth)
    await userEvent.click(fifth)
    await waitFor(() => expect(body.queryByRole('grid')).toBeNull())
    await expect(canvas.getByText('{"start":"2026-04-05","end":"2026-04-12"}')).toBeVisible()
    await settle()
  },
}

/** A business year from July: "year to date" from 1 July, quarters from July, "2025/26". */
export const BusinessYearJuly: Story = {
  name: 'Business year from July',
  render: () => (
    <div className="flex flex-col gap-6">
      <Controlled
        label="Business year"
        initial={{ start: '2025-07-01', end: '2026-06-30' }}
        yearStartMonth={7}
      />
      <Controlled
        label="Quarter (business)"
        initial={{ start: '2026-07-01', end: '2026-09-30' }}
        yearStartMonth={7}
      />
      <Controlled
        label="Quarter (calendar, e.g. VAT)"
        initial={{ start: '2026-07-01', end: '2026-09-30' }}
        yearStartMonth={7}
        quarterBasis="calendar"
      />
      <Controlled
        label="Year to date"
        initial={{ start: '2026-07-01', end: '2026-09-28' }}
        yearStartMonth={7}
      />
    </div>
  ),
}

/** Empty, required, error, read-only next to disabled. */
export const States: Story = {
  render: () => (
    <div className="flex max-w-100 flex-col gap-6">
      <PeriodField label="Period" />
      <PeriodField
        label="Period"
        required
        defaultValue={{ start: '2026-01-01', end: '2026-12-31' }}
      />
      <PeriodField
        label="Period"
        defaultValue={{ start: '2026-01-01', end: '2026-12-31' }}
        error="The report covers at most one quarter."
      />
      <PeriodField
        label="Period (read-only)"
        readOnly
        defaultValue={{ start: '2026-03-01', end: '2026-03-31' }}
      />
      <PeriodField
        label="Period (disabled)"
        disabled
        disabledReason="The report is being generated."
        defaultValue={{ start: '2026-03-01', end: '2026-03-31' }}
      />
    </div>
  ),
}

/** Long label and a custom range at phone width. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="flex w-[390px] max-w-full flex-col gap-6 rounded-md border border-default bg-surface-raised p-4">
      <PeriodField
        label={LONG.label}
        description={LONG.description}
        defaultValue={{ start: '2026-01-15', end: '2026-11-20' }}
      />
      <PeriodField label={LONG.label} error={LONG.error} />
    </div>
  ),
}

/** Arabic sample text, right to left: presets on the start side (right). */
export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="flex max-w-100 flex-col gap-6">
      <PeriodField
        label={ARABIC.label}
        description={ARABIC.description}
        defaultValue={{ start: '2026-09-01', end: '2026-09-30' }}
      />
      <PeriodField label={ARABIC.label} required error={ARABIC.error} />
      <PeriodField
        label={ARABIC.label}
        readOnly
        defaultValue={{ start: '2026-09-01', end: '2026-09-30' }}
      />
      <PeriodField label={ARABIC.label} disabled disabledReason={ARABIC.reason} />
    </div>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="flex max-w-100 flex-col gap-6">
      <PeriodField
        label={JAPANESE.label}
        description={JAPANESE.description}
        defaultValue={{ start: '2026-09-01', end: '2026-09-30' }}
      />
      <PeriodField label={JAPANESE.label} required error={JAPANESE.error} />
      <PeriodField
        label={JAPANESE.label}
        readOnly
        defaultValue={{ start: '2026-09-01', end: '2026-09-30' }}
      />
      <PeriodField label={JAPANESE.label} disabled disabledReason={JAPANESE.reason} />
    </div>
  ),
}
