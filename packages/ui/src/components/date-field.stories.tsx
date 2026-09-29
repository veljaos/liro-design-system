import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { LiroProvider, useLiro } from '../provider/liro-provider'
import { DateField } from './date-field'
import { ARABIC, JAPANESE, LONG } from './field-story-data'

/** A nested provider with a fixed "today" (the tenant's date), in the story's theme and locale. */
function Today({ today, children }: { today: string; children: ReactNode }) {
  const { colorScheme, locale, direction } = useLiro()
  return (
    <LiroProvider locale={locale} direction={direction} colorScheme={colorScheme} today={today}>
      {children}
    </LiroProvider>
  )
}

const meta = {
  title: 'Components/Fields/DateField',
  component: DateField,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** one date, typed or picked. Typing is the fast way: "010326", "1.3.2026", ' +
          '"01/03/2026" or the locale\'s own form are read on leaving the field or on Enter by ' +
          "the provider's `format.parseDate`, in the locale's order of day, month and year. The " +
          'calendar opens only from the calendar button at the end of the field or with ' +
          'Alt+ArrowDown; the focus moves into it and back to the field when it closes (Escape ' +
          "closes it). It opens on the chosen month, else on the provider's `today` — the " +
          "tenant's date, not the device's. The value is YYYY-MM-DD. Unreadable text stays, the " +
          'value is null, and the field says so (`onValidityChange(false)`).\n\n' +
          '**When not:** two dates that belong together (DateRangeField); a month, quarter or ' +
          'year (PeriodField); a date and time.',
      },
    },
  },
  args: { label: 'Due date' },
  play: settle,
} satisfies Meta<typeof DateField>

export default meta

type Story = StoryObj<typeof meta>

/** Type a date in any common form and leave the field; the value is YYYY-MM-DD. */
export const Default: Story = {
  args: { description: 'Day, month and year' },
  render: function Render(args) {
    const [value, setValue] = useState<string | null>('2026-03-01')
    return (
      <div className="flex max-w-100 flex-col gap-3">
        <DateField {...args} value={value} onChange={setValue} />
        <p className="m-0 text-sm text-secondary">
          Value: <code>{value ?? 'null'}</code>
        </p>
      </div>
    )
  },
}

/** The calendar from its button: it opens on the provider's today (15 July 2031 here). */
export const Open: Story = {
  render: () => (
    <Today today="2031-07-15">
      <div className="min-h-100 max-w-100">
        <DateField label="Due date" />
      </div>
    </Today>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Choose a date' }))
    const grid = await canvas.findByRole('grid')
    await expect(grid).toHaveAccessibleName(/2031/)
    await waitFor(() =>
      expect(grid).toContainElement(canvasElement.ownerDocument.activeElement as HTMLElement),
    )
    await settle()
  },
}

/** Keyboard only: Alt+ArrowDown opens, the focus is in the calendar, Escape returns to the field. */
export const Keyboard: Story = {
  render: () => (
    <div className="max-w-100">
      <DateField label="Due date" defaultValue="2026-03-17" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const document = canvasElement.ownerDocument
    const canvas = within(document.body)
    const input = canvas.getByRole('textbox', { name: 'Due date' })
    await userEvent.click(input)
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}')
    const grid = await canvas.findByRole('grid')
    await waitFor(() => expect(grid).toContainElement(document.activeElement as HTMLElement))
    await expect(document.activeElement).toHaveAttribute('aria-label', expect.stringMatching(/17/))
    await userEvent.keyboard('{ArrowRight}{Enter}')
    await waitFor(() => expect(canvas.queryByRole('grid')).toBeNull())
    await expect(input).toHaveFocus()
    await userEvent.keyboard('{Alt>}{ArrowDown}{/Alt}')
    await canvas.findByRole('grid')
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(canvas.queryByRole('grid')).toBeNull())
    await expect(input).toHaveFocus()
    await settle()
  },
}

/** Unreadable text stays for correction; the field shows its own message; the value is null. */
export const Unreadable: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>('2026-03-01')
    const [valid, setValid] = useState(true)
    return (
      <div className="flex max-w-100 flex-col gap-3">
        <DateField label="Due date" value={value} onChange={setValue} onValidityChange={setValid} />
        <p className="m-0 text-sm text-secondary">
          Value: <code>{value ?? 'null'}</code>, valid: <code>{String(valid)}</code>
        </p>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox', { name: 'Due date' })
    await userEvent.clear(input)
    await userEvent.type(input, '31.02.2026', { delay: 0 })
    await userEvent.tab()
    await expect(input).toHaveValue('31.02.2026')
    await expect(input).toHaveAttribute('aria-invalid', 'true')
    await expect(canvas.getByText('Enter a date')).toBeVisible()
    await expect(canvas.getByText('null')).toBeVisible()
    await settle()
  },
}

/** Empty, required, the application's error, read-only next to disabled. */
export const States: Story = {
  render: () => (
    <div className="flex max-w-100 flex-col gap-6">
      <DateField label="Due date" placeholder="dd.mm.yyyy" name="due" />
      <DateField label="Issue date" required defaultValue="2026-03-01" />
      <DateField
        label="Delivery date"
        defaultValue="2026-02-01"
        error="The delivery date cannot be before the issue date."
      />
      <DateField label="Posting date (read-only)" readOnly defaultValue="2026-03-01" />
      <DateField
        label="Posting date (disabled)"
        disabled
        disabledReason="The period is closed."
        defaultValue="2026-03-01"
      />
    </div>
  ),
}

/** Long label, description and error at phone width. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="flex w-[390px] max-w-full flex-col gap-6 rounded-md border border-default bg-surface-raised p-4">
      <DateField label={LONG.label} description={LONG.description} defaultValue="2026-12-31" />
      <DateField label={LONG.label} error={LONG.error} defaultValue="2026-12-31" />
    </div>
  ),
}

/** Arabic sample text, right to left: the calendar button is at the field's end (left). */
export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="flex max-w-100 flex-col gap-6">
      <DateField label={ARABIC.label} description={ARABIC.description} defaultValue="2026-03-01" />
      <DateField label={ARABIC.label} required error={ARABIC.error} />
      <DateField label={ARABIC.label} readOnly defaultValue="2026-03-01" />
      <DateField
        label={ARABIC.label}
        disabled
        disabledReason={ARABIC.reason}
        defaultValue="2026-03-01"
      />
    </div>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="flex max-w-100 flex-col gap-6">
      <DateField
        label={JAPANESE.label}
        description={JAPANESE.description}
        defaultValue="2026-03-01"
      />
      <DateField label={JAPANESE.label} required error={JAPANESE.error} />
      <DateField label={JAPANESE.label} readOnly defaultValue="2026-03-01" />
      <DateField
        label={JAPANESE.label}
        disabled
        disabledReason={JAPANESE.reason}
        defaultValue="2026-03-01"
      />
    </div>
  ),
}
