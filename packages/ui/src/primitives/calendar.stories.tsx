import type { Meta, StoryObj } from '@storybook/react-vite'
import { Calendar, type CalendarLabels } from './calendar'
import { internal, settle } from './story-helpers'

const meta = {
  title: 'Internal/Primitives/Calendar',
  component: Calendar,
  parameters: {
    docs: {
      description: {
        component: internal(
          'A month calendar. Month and weekday names come from the provider format, the first day of the week from weekStartsOn, the direction and the arrow keys from the provider. Change the format locale in the toolbar to see the names and the first day change. DateField, DateRangeField (P2.3).',
        ),
      },
    },
  },
  // Waits for enter animations and colour transitions before the accessibility check.
  play: settle,
} satisfies Meta<typeof Calendar>

export default meta

type Story = StoryObj<typeof meta>

const LABELS: CalendarLabels = {
  previousMonth: 'Previous month',
  nextMonth: 'Next month',
  navigation: 'Months',
}

/** A fixed month and "today", so the picture does not change with the date. */
const SEPTEMBER = new Date(2026, 8, 1)
const TODAY = new Date(2026, 8, 25)

/** One day chosen; a day before the 3rd disabled. */
export const Single: Story = {
  args: { labels: LABELS },
  render: (args) => (
    <div className="inline-block rounded-md border border-default bg-surface-raised p-4">
      <Calendar
        labels={args.labels}
        mode="single"
        defaultMonth={SEPTEMBER}
        today={TODAY}
        selected={new Date(2026, 8, 18)}
        disabled={{ before: new Date(2026, 8, 3) }}
      />
    </div>
  ),
}

/** A range of days. */
export const Range: Story = {
  args: { labels: LABELS },
  render: (args) => (
    <div className="inline-block rounded-md border border-default bg-surface-raised p-4">
      <Calendar
        labels={args.labels}
        mode="range"
        defaultMonth={SEPTEMBER}
        today={TODAY}
        selected={{ from: new Date(2026, 8, 8), to: new Date(2026, 8, 12) }}
      />
    </div>
  ),
}
