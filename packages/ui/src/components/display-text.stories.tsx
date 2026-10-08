import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { expect } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { LiroProvider, useLiro } from '../provider/liro-provider'
import { DateRangeText, DateText, DueDate, MoneyText, NumberText } from './display-text'
import { ARABIC, JAPANESE } from './field-story-data'

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
  title: 'Components/Display/Values',
  component: DueDate,
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
          "**DateText** — a date in the locale's form, tabular digits; `withWeekday` adds a " +
          'tooltip with the weekday and the date in words; `dimmed` for dates that matter less. ' +
          '**DateRangeText** — "from – to". **DueDate** — measured from the provider\'s `today` ' +
          '(28 September 2026 in these stories): always the date, then a short note in xs — ' +
          'overdue with the days (danger), due today or within `warningDays` (warning), settled ' +
          '(secondary); never a badge, so a due column is never a second status. **NumberText** and ' +
          "**MoneyText** — through the provider's `format`, never rounded, isolated so the " +
          'minus sign and the currency stay in place in right-to-left. Every empty value is ' +
          '"—".\n\n' +
          '**When not:** entering a value (the fields); a total that is still being computed ' +
          '(SettlingValue).',
      },
    },
  },
  play: settle,
} satisfies Meta<typeof DueDate>

export default meta

type Story = StoryObj<typeof meta>

/** Every DueDate state, measured from 28 September 2026. */
export const DueDates: Story = {
  render: () => (
    <dl className="m-0 grid max-w-150 grid-cols-[auto_1fr] items-center gap-x-6 gap-y-3 text-sm">
      <dt className="text-secondary">Paid</dt>
      <dd className="m-0">
        <DueDate value="2026-09-01" settled />
      </dd>
      <dt className="text-secondary">Due 3 days ago</dt>
      <dd className="m-0">
        <DueDate value="2026-09-25" />
      </dd>
      <dt className="text-secondary">Due today</dt>
      <dd className="m-0">
        <DueDate value="2026-09-28" />
      </dd>
      <dt className="text-secondary">Due in 2 days</dt>
      <dd className="m-0">
        <DueDate value="2026-09-30" />
      </dd>
      <dt className="text-secondary">Due later</dt>
      <dd className="m-0">
        <DueDate value="2026-11-15" />
      </dd>
      <dt className="text-secondary">No due date</dt>
      <dd className="m-0">
        <DueDate value={null} />
      </dd>
    </dl>
  ),
}

/**
 * In a narrow column the note wraps under the date; the date always stays (P4.9: the date is
 * what a due column is read for).
 */
export const DueDateNarrow: Story = {
  name: 'DueDate, narrow column',
  render: () => (
    <div className="flex w-30 flex-col gap-3 text-sm">
      <DueDate value="2026-09-25" />
      <DueDate value="2026-09-30" />
      <DueDate value="2026-09-01" settled />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(canvasElement).toHaveTextContent('09/25/2026')
    await expect(canvasElement).toHaveTextContent('3 days overdue')
    await settle()
  },
}

/** Dates, ranges, numbers and amounts; empty values as "—". */
export const Values: Story = {
  render: () => (
    <dl className="m-0 grid max-w-150 grid-cols-[auto_1fr] items-center gap-x-6 gap-y-3 text-sm">
      <dt className="text-secondary">Date</dt>
      <dd className="m-0">
        <DateText value="2026-03-01" />
      </dd>
      <dt className="text-secondary">With weekday</dt>
      <dd className="m-0">
        <DateText value="2026-03-01" withWeekday />
      </dd>
      <dt className="text-secondary">Dimmed</dt>
      <dd className="m-0">
        <DateText value="2026-03-01" dimmed />
      </dd>
      <dt className="text-secondary">Range</dt>
      <dd className="m-0">
        <DateRangeText from="2026-01-01" to="2026-03-31" />
      </dd>
      <dt className="text-secondary">Number</dt>
      <dd className="m-0">
        <NumberText value="12345678901234.567891" />
      </dd>
      <dt className="text-secondary">Number, 2 decimals</dt>
      <dd className="m-0">
        <NumberText value="1.5" decimals={2} />
      </dd>
      <dt className="text-secondary">Amount</dt>
      <dd className="m-0">
        <MoneyText value="-1234.5" currency="EUR" />
      </dd>
      <dt className="text-secondary">Empty</dt>
      <dd className="m-0">
        <MoneyText value={null} currency="EUR" />
      </dd>
    </dl>
  ),
}

/** Long values at phone width: amounts never wrap apart from their currency. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="flex w-[390px] max-w-full flex-col gap-2 text-sm">
      <MoneyText value="98765432109876.54" currency="EUR" />
      <NumberText value="12345678901234.567891" />
      <DateRangeText from="2026-01-01" to="2026-12-31" />
    </div>
  ),
}

/** Arabic sample text, right to left: the minus sign and the currency stay in place. */
export const Arabic: Story = {
  render: () => (
    <p lang="ar" dir="rtl" className="m-0 flex flex-col gap-2 text-sm">
      <span>
        {ARABIC.label}: <MoneyText value="-42" currency="EUR" />
      </span>
      <span>
        {ARABIC.description}: <DateText value="2026-03-01" />
      </span>
      <span>
        <DueDate value="2026-09-25" />
      </span>
    </p>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <p lang="ja" className="m-0 flex flex-col gap-2 text-sm">
      <span>
        {JAPANESE.label}: <MoneyText value="1234" currency="JPY" decimals={0} />
      </span>
      <span>
        {JAPANESE.description}: <DateText value="2026-03-01" />
      </span>
    </p>
  ),
}
