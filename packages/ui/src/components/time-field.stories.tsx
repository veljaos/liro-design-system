import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { TEXT_DIRECTION } from '../primitives/classes'
import { cn } from '../primitives/cn'
import { settle } from '../primitives/story-helpers'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { TimeField } from './time-field'

const meta = {
  title: 'Components/Fields/TimeField',
  component: TimeField,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a time of day, typed the quick way, as the date fields read "010326": ' +
          '"630", "0630" and "6:30" become 06:30, "1430" becomes 14:30, "6:30 pm" becomes 18:30. ' +
          'The text is read on leaving the field or on Enter and shown again as the value, so ' +
          'the user sees at once what was understood. `withSeconds`: "630" becomes 06:30:00. The ' +
          'value is "HH:MM" (or "HH:MM:SS") on a 24-hour clock; the application joins it to a ' +
          'date. Unreadable text stays, the value is null, and the field says so ' +
          '(`onValidityChange(false)`). On phones it opens the number pad.\n\n' +
          '**When not:** a start chosen from fixed slots (SelectField, SlotPicker); a length of ' +
          'time (NumberField with its unit); a date (DateField).',
      },
    },
  },
  args: { label: 'Start' },
  play: settle,
} satisfies Meta<typeof TimeField>

export default meta

type Story = StoryObj<typeof meta>

/** Type "630" and leave the field: it reads 06:30. */
export const Default: Story = {
  args: { description: 'For example 0630 or 6:30' },
  render: function Render(args) {
    const [value, setValue] = useState<string | null>('07:30')
    return (
      <div className="flex max-w-60 flex-col gap-3">
        <TimeField {...args} value={value} onChange={setValue} />
        <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
          Value: <code>{value ?? 'null'}</code>
        </p>
      </div>
    )
  },
}

/** Quick entry: each way of typing becomes the same time. */
export const QuickEntry: Story = {
  name: 'Quick entry, interaction',
  tags: ['interaction'],
  render: function Render() {
    const [start, setStart] = useState<string | null>(null)
    const [end, setEnd] = useState<string | null>(null)
    const [precise, setPrecise] = useState<string | null>(null)
    return (
      <div className="flex max-w-60 flex-col gap-4">
        <TimeField label="Start" value={start} onChange={setStart} />
        <TimeField label="End" value={end} onChange={setEnd} />
        <TimeField label="Logged at" withSeconds value={precise} onChange={setPrecise} />
        <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
          <code>{`${start ?? 'null'} – ${end ?? 'null'}, ${precise ?? 'null'}`}</code>
        </p>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const start = canvas.getByRole('textbox', { name: 'Start' })
    await userEvent.type(start, '630', { delay: 0 })
    await userEvent.tab()
    await expect(start).toHaveValue('06:30')
    const end = canvas.getByRole('textbox', { name: 'End' })
    await userEvent.type(end, '1430{Enter}', { delay: 0 })
    await expect(end).toHaveValue('14:30')
    const precise = canvas.getByRole('textbox', { name: 'Logged at' })
    await userEvent.type(precise, '630', { delay: 0 })
    await userEvent.tab()
    await expect(precise).toHaveValue('06:30:00')
    await expect(canvas.getByText('06:30 – 14:30, 06:30:00')).toBeVisible()
    await settle()
  },
}

/** Unreadable text stays for correction with the field's own message; the value is null. */
export const Unreadable: Story = {
  name: 'Unreadable, interaction',
  tags: ['interaction'],
  render: function Render() {
    const [value, setValue] = useState<string | null>('07:30')
    const [valid, setValid] = useState(true)
    return (
      <div className="flex max-w-60 flex-col gap-3">
        <TimeField label="Start" value={value} onChange={setValue} onValidityChange={setValid} />
        <p className={cn('m-0 text-sm text-secondary', TEXT_DIRECTION)}>
          Value: <code>{value ?? 'null'}</code>, valid: <code>{String(valid)}</code>
        </p>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox', { name: 'Start' })
    await userEvent.clear(input)
    await userEvent.type(input, '2575', { delay: 0 })
    await userEvent.tab()
    await expect(input).toHaveValue('2575')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(canvas.getByText('Enter a time, for example 0630 or 6:30')).toBeVisible()
    await expect(canvas.getByText('null')).toBeVisible()
    await settle()
  },
}

/** Empty, required, with seconds, the application's error, read-only next to disabled. */
export const States: Story = {
  render: () => (
    <div className="flex max-w-60 flex-col gap-6">
      <TimeField label="Start" placeholder="hh:mm" name="start" />
      <TimeField label="Clock-in" required defaultValue="06:58" />
      <TimeField label="Logged at" withSeconds defaultValue="06:30:15" />
      <TimeField label="End" defaultValue="05:00" error="The end is before the start." />
      <TimeField label="Opening (read-only)" readOnly defaultValue="08:00" />
      <TimeField
        label="Closing (disabled)"
        disabled
        disabledReason="The day is closed."
        defaultValue="20:00"
      />
    </div>
  ),
}

/** Long label, description and error at phone width. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="flex w-[390px] max-w-full flex-col gap-6 rounded-md border border-default bg-surface-raised p-4">
      <TimeField label={LONG.label} description={LONG.description} defaultValue="06:30" />
      <TimeField label={LONG.label} error={LONG.error} defaultValue="14:30" />
    </div>
  ),
}

/** Arabic sample text, right to left: the time itself stays left to right. */
export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="flex max-w-60 flex-col gap-6">
      <TimeField label={ARABIC.label} description={ARABIC.description} defaultValue="06:30" />
      <TimeField label={ARABIC.label} required error={ARABIC.error} />
      <TimeField label={ARABIC.label} readOnly defaultValue="14:30" />
      <TimeField
        label={ARABIC.label}
        disabled
        disabledReason={ARABIC.reason}
        defaultValue="14:30"
      />
    </div>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="flex max-w-60 flex-col gap-6">
      <TimeField label={JAPANESE.label} description={JAPANESE.description} defaultValue="06:30" />
      <TimeField label={JAPANESE.label} required error={JAPANESE.error} />
      <TimeField label={JAPANESE.label} readOnly defaultValue="14:30" />
      <TimeField
        label={JAPANESE.label}
        disabled
        disabledReason={JAPANESE.reason}
        defaultValue="14:30"
      />
    </div>
  ),
}
