import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { KeyValueList } from './cards'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { SlaTimer } from './sla-timer'
import { PhoneFrame, StoryProvider } from './story-frames'

/** The application's "now" in these stories: 14 October 2026, 09:40 in Belgrade. */
const NOW = '2026-10-14T09:40:00+02:00'
const at = (time: string, day = '2026-10-14') => `${day}T${time}:00+02:00`

const meta = {
  title: 'Components/Display/SlaTimer',
  component: SlaTimer,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** where a deadline stands — a service level’s first response or ' +
          'resolution, a reply promised by a time — in words against the application’s `now` ' +
          '(never the device’s clock): "Due in 2 h 15 min", "Overdue by 40 min" in the danger ' +
          'tone with an alert icon (the words say it, never the colour alone), "Paused" while the ' +
          'clock is stopped (waiting for the customer), and once done "Met" or "Missed by 25 min". ' +
          '`warnWithin` turns the last minutes to the warning tone. `label` names the deadline ' +
          'before its words (two in one table cell); `showDue` adds the due instant under them (a ' +
          'side panel). Minutes are whole (left: rounded up; late: rounded down), written through ' +
          '`format.number`; a day or more is "1 d 3 h". The timer does not tick: the application ' +
          'passes a new `now` (once a minute).\n\n' +
          '**When to use:** any deadline counted in hours and minutes. **When not:** a due date ' +
          'counted in days (DueDate); a job’s progress (JobProgress); a time to show as a time ' +
          '(DateText, `format.time`).',
      },
    },
  },
  args: { due: at('11:55'), now: NOW },
  play: settle,
} satisfies Meta<typeof SlaTimer>

export default meta

type Story = StoryObj<typeof meta>

/** Every state, now 14.10.2026 09:40. */
export const Default: Story = {
  render: () => (
    <KeyValueList
      className="max-w-120"
      items={[
        { key: 'running', label: 'Later today', value: <SlaTimer due={at('11:55')} now={NOW} /> },
        {
          key: 'days',
          label: 'A day away',
          value: <SlaTimer due={at('13:00', '2026-10-15')} now={NOW} />,
        },
        {
          key: 'soon',
          label: 'Soon (30 min)',
          value: <SlaTimer due={at('10:05')} now={NOW} warnWithin={30} />,
        },
        { key: 'overdue', label: 'Late', value: <SlaTimer due={at('09:00')} now={NOW} /> },
        {
          key: 'paused',
          label: 'Waiting for the customer',
          value: <SlaTimer due={at('09:00')} now={NOW} paused />,
        },
        {
          key: 'met',
          label: 'Done on time',
          value: <SlaTimer due={at('09:00')} now={NOW} completedAt={at('08:31')} />,
        },
        {
          key: 'missed',
          label: 'Done late',
          value: <SlaTimer due={at('09:00')} now={NOW} completedAt={at('09:25')} />,
        },
      ]}
    />
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Due in 2 h 15 min')).toBeVisible()
    await expect(canvas.getByText('Due in 1 d 3 h')).toBeVisible()
    await expect(canvas.getByText('Due in 25 min')).toBeVisible()
    await expect(canvas.getByText('Overdue by 40 min')).toBeVisible()
    await expect(canvas.getByText('Paused')).toBeVisible()
    await expect(canvas.getByText('Met')).toBeVisible()
    await expect(canvas.getByText('Missed by 25 min')).toBeVisible()
  },
}

/** Two deadlines in one table cell, each named; the overdue one in danger, in words. */
export const InACell: Story = {
  name: 'Two in a cell',
  render: () => (
    <div className="flex flex-col gap-1">
      <SlaTimer label="First response" due={at('09:00')} now={NOW} />
      <SlaTimer label="Resolution" due={at('17:00', '2026-10-15')} now={NOW} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('First response: Overdue by 40 min')
    await expect(canvasElement).toHaveTextContent('Resolution: Due in 1 d 7 h')
  },
}

/** In a side panel: the words and the due instant under them. */
export const WithDue: Story = {
  name: 'With the due instant',
  args: { due: at('10:30'), now: NOW, showDue: true },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Due in 50 min')
    await expect(canvasElement.querySelector('[data-slot="sla-timer"]')).toHaveTextContent(
      /Due .*10:30/,
    )
  },
}

/** An instant the application could not give: "—". */
export const Unreadable: Story = {
  name: 'Empty',
  args: { due: '', now: NOW, label: 'Resolution' },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('—')
  },
}

/** A long name before the words wraps under itself. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <div className="w-72">
      <SlaTimer label={LONG.label} due={at('09:00')} now={NOW} showDue />
    </div>
  ),
}

/** On a phone. */
export const Phone: Story = {
  render: () => (
    <PhoneFrame>
      <div className="flex flex-col gap-3 p-4">
        <SlaTimer label="First response" due={at('09:00')} now={NOW} showDue />
        <SlaTimer label="Resolution" due={at('17:00', '2026-10-15')} now={NOW} showDue />
      </div>
    </PhoneFrame>
  ),
}

/** Arabic: the words keep their order, the icon on the start side. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div lang="ar" className="flex flex-col gap-2">
        <SlaTimer label={ARABIC.label} due={at('09:00')} now={NOW} showDue />
        <SlaTimer label={ARABIC.description} due={at('11:55')} now={NOW} />
      </div>
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <div lang="ja" className="flex flex-col gap-2">
        <SlaTimer label={JAPANESE.label} due={at('09:00')} now={NOW} showDue />
        <SlaTimer label={JAPANESE.description} due={at('11:55')} now={NOW} paused />
      </div>
    </StoryProvider>
  ),
}
