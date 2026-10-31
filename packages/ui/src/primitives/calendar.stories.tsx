import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { StoryProvider } from '../components/story-frames'
import { Calendar, type CalendarLabels } from './calendar'
import { internal, settle } from './story-helpers'

const meta = {
  title: 'Internal/Primitives/Calendar',
  component: Calendar,
  parameters: {
    docs: {
      description: {
        component: internal(
          'A month calendar. Month and weekday names come from the provider format, the first day of the week from weekStartsOn, the direction and the arrow keys from the provider. Change the format locale in the toolbar to see the names and the first day change. DateField, DateRangeField.',
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

/*
 * The names and the week's first day come only from the provider's locale. An
 * English interface never shows Serbian names; a Serbian one starts its weeks on Monday.
 */

/** English (United States): English names, weeks from Sunday. */
export const EnglishUnitedStates: Story = {
  name: 'English (United States), weeks from Sunday',
  args: { labels: LABELS },
  render: (args) => (
    <StoryProvider locale="en-US">
      <div className="inline-block rounded-md border border-default bg-surface-raised p-4">
        <Calendar labels={args.labels} mode="single" defaultMonth={SEPTEMBER} today={TODAY} />
      </div>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    // The weekdays row is hidden from assistive technology (each day says its date).
    const headers = canvasElement.querySelectorAll('thead th')
    await expect(headers[0]).toHaveAttribute('aria-label', 'Sunday')
    await expect(within(canvasElement).getByText('September 2026')).toBeVisible()
  },
}

/** English for a Serbian company ("en-RS"): English names, weeks from Monday (the region's). */
export const EnglishSerbia: Story = {
  name: 'English for a Serbian company (en-RS), weeks from Monday',
  args: { labels: LABELS },
  render: (args) => (
    <StoryProvider locale="en-RS">
      <div className="inline-block rounded-md border border-default bg-surface-raised p-4">
        <Calendar labels={args.labels} mode="single" defaultMonth={SEPTEMBER} today={TODAY} />
      </div>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    // The weekdays row is hidden from assistive technology (each day says its date).
    const headers = canvasElement.querySelectorAll('thead th')
    await expect(headers[0]).toHaveAttribute('aria-label', 'Monday')
    await expect(within(canvasElement).getByText('September 2026')).toBeVisible()
  },
}

/** Serbian (Latin): Serbian names, weeks from Monday; the controls' names in Serbian too. */
export const SerbianLatin: Story = {
  name: 'Serbian (sr-Latn), weeks from Monday',
  args: {
    labels: { previousMonth: 'Prethodni mesec', nextMonth: 'Sledeći mesec', navigation: 'Meseci' },
  },
  render: (args) => (
    <StoryProvider locale="sr-Latn-RS">
      <div className="inline-block rounded-md border border-default bg-surface-raised p-4">
        <Calendar labels={args.labels} mode="single" defaultMonth={SEPTEMBER} today={TODAY} />
      </div>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    // The weekdays row is hidden from assistive technology (each day says its date).
    const headers = canvasElement.querySelectorAll('thead th')
    await expect(headers[0]).toHaveAttribute('aria-label', 'ponedeljak')
    await expect(within(canvasElement).getByText('septembar 2026')).toBeVisible()
  },
}
