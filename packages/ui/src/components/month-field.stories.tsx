import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { LiroProvider, useLiro } from '../provider/liro-provider'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { MonthField } from './month-field'

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
  title: 'Components/Fields/MonthField',
  component: MonthField,
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
          '**What for:** one month, such as an accounting period to post into or close (the ' +
          "previous Design System's AccountingPeriodSelect). A button drawn as a field opens a " +
          'grid of twelve months under a year with previous and next buttons; it opens on the ' +
          "chosen month, else on the provider's `today` (28 September 2026 in these stories). " +
          'The arrows move between months (left and right from the leading edge, up and down by ' +
          'a row) and across years; Enter chooses. The value is YYYY-MM; month names come from ' +
          '`format`.\n\n' +
          '**When not:** a reporting period with presets or a custom range (PeriodField); a day ' +
          '(DateField).',
      },
    },
  },
  args: { label: 'Accounting period' },
  play: settle,
} satisfies Meta<typeof MonthField>

export default meta

type Story = StoryObj<typeof meta>

/** A chosen month; open it to choose another. */
export const Default: Story = {
  args: { description: 'The month the entry is posted into' },
  render: function Render(args) {
    const [value, setValue] = useState<string | null>('2026-03')
    return (
      <div className="flex max-w-100 flex-col gap-3">
        <MonthField {...args} value={value} onChange={setValue} />
        <p className="m-0 text-sm text-secondary">
          Value: <code>{value ?? 'null'}</code>
        </p>
      </div>
    )
  },
}

/** Open on the chosen month (March 2026). */
export const Open: Story = {
  render: () => (
    <div className="min-h-80 max-w-100">
      <MonthField label="Accounting period" defaultValue="2026-03" />
    </div>
  ),
  play: async ({ canvasElement }) => {
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(body.getByRole('button', { name: /Accounting period/ }))
    const march = await body.findByRole('button', { name: 'March 2026' })
    await expect(march).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(march).toHaveFocus())
    await settle()
  },
}

/** Keyboard only: the arrows cross into the next year; Enter chooses; the focus returns. */
export const Keyboard: Story = {
  render: function Render() {
    const [value, setValue] = useState<string | null>('2026-11')
    return (
      <div className="flex min-h-80 max-w-100 flex-col gap-3">
        <MonthField label="Accounting period" value={value} onChange={setValue} />
        <p className="m-0 text-sm text-secondary">
          Value: <code>{value ?? 'null'}</code>
        </p>
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    const document = canvasElement.ownerDocument
    const body = within(document.body)
    const trigger = body.getByRole('button', { name: /Accounting period/ })
    trigger.focus()
    await userEvent.keyboard('{Enter}')
    const november = await body.findByRole('button', { name: 'November 2026' })
    await waitFor(() => expect(november).toHaveFocus())
    // Forward is the arrow pointing away from the leading edge: left in right-to-left.
    const rtl = getComputedStyle(november).direction === 'rtl'
    await userEvent.keyboard(rtl ? '{ArrowLeft}{ArrowLeft}' : '{ArrowRight}{ArrowRight}')
    await waitFor(() => expect(body.getByRole('button', { name: 'January 2027' })).toHaveFocus())
    await userEvent.keyboard('{Enter}')
    await waitFor(() => expect(trigger).toHaveFocus())
    await expect(within(canvasElement).getByText('2027-01')).toBeVisible()
    await settle()
  },
}

/** Empty, required, error, read-only next to disabled. */
export const States: Story = {
  render: () => (
    <div className="flex max-w-100 flex-col gap-6">
      <MonthField label="Accounting period" placeholder="Choose a month" name="period" />
      <MonthField label="Accounting period" required defaultValue="2026-09" />
      <MonthField
        label="Accounting period"
        defaultValue="2025-12"
        error="December 2025 is closed; choose an open month."
      />
      <MonthField label="Accounting period (read-only)" readOnly defaultValue="2026-09" />
      <MonthField
        label="Accounting period (disabled)"
        disabled
        disabledReason="The entry is posted."
        defaultValue="2026-09"
      />
    </div>
  ),
}

/** Long label and error at phone width. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="flex w-[390px] max-w-full flex-col gap-6 rounded-md border border-default bg-surface-raised p-4">
      <MonthField label={LONG.label} description={LONG.description} defaultValue="2026-09" />
      <MonthField label={LONG.label} error={LONG.error} defaultValue="2026-09" />
    </div>
  ),
}

/** Arabic sample text, right to left. */
export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="flex max-w-100 flex-col gap-6">
      <MonthField label={ARABIC.label} description={ARABIC.description} defaultValue="2026-09" />
      <MonthField label={ARABIC.label} required error={ARABIC.error} />
      <MonthField label={ARABIC.label} readOnly defaultValue="2026-09" />
      <MonthField
        label={ARABIC.label}
        disabled
        disabledReason={ARABIC.reason}
        defaultValue="2026-09"
      />
    </div>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="flex max-w-100 flex-col gap-6">
      <MonthField
        label={JAPANESE.label}
        description={JAPANESE.description}
        defaultValue="2026-09"
      />
      <MonthField label={JAPANESE.label} required error={JAPANESE.error} />
      <MonthField label={JAPANESE.label} readOnly defaultValue="2026-09" />
      <MonthField
        label={JAPANESE.label}
        disabled
        disabledReason={JAPANESE.reason}
        defaultValue="2026-09"
      />
    </div>
  ),
}
