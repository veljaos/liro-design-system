import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { QuantityStepper } from './quantity-stepper'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

function Handheld({ children }: { children: ReactNode }) {
  return (
    <StoryProvider density="touch">
      <ExampleProvider>
        <div className="max-w-80">{children}</div>
      </ExampleProvider>
    </StoryProvider>
  )
}

const meta = {
  title: 'Components/Warehouse/QuantityStepper',
  component: QuantityStepper,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a quantity entered with fingers — − / the quantity / +, every target at ' +
          'least 44px — or typed (read by the provider’s format on leaving, on Enter or on a step). ' +
          'The value, `min`, `max` and `step` are decimal strings compared exactly, never ' +
          'JavaScript numbers. A typed value outside the limits is kept and shown as an error; − ' +
          'and + stop at the limits. ArrowUp and ArrowDown step. The unit stands after the number.' +
          '\n\n**When:** a count, a quantity picked, a cart line at a till.\n\n' +
          '**When not:** money (MoneyField: amounts are never stepped); a free number in a form ' +
          '(NumberField).',
      },
    },
  },
  args: { label: 'Quantity picked', defaultValue: '4', min: '0', unit: 'pc' },
  render: (args) => (
    <Handheld>
      <QuantityStepper {...args} />
    </Handheld>
  ),
  play: settle,
} satisfies Meta<typeof QuantityStepper>

export default meta

type Story = StoryObj<typeof meta>

/** Whole pieces from zero. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox', { name: 'Quantity picked' })).toHaveValue('4')
    await expect(canvas.getByRole('button', { name: 'Decrease Quantity picked' })).toBeEnabled()
  },
}

/** Weight in steps of half a kilogram, two decimals shown. */
export const Weight: Story = {
  args: { label: 'Weight', defaultValue: '2.5', step: '0.5', decimals: 2, unit: 'kg' },
}

/** Large, for the line in front of the worker. */
export const Large: Story = {
  args: { size: 'large', description: 'Count every piece on the shelf.' },
}

/** At its limit: + is off. */
export const AtLimit: Story = {
  name: 'At the limit',
  args: { defaultValue: '6', max: '6' },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('button', { name: 'Increase Quantity picked' }),
    ).toBeDisabled()
  },
}

/** Over the limit (typed): kept, with the error. */
export const OverLimit: Story = {
  name: 'Error',
  args: { defaultValue: '15', max: '12' },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('At most 12.')).toBeVisible()
  },
}

/** The application's own error. */
export const ApplicationError: Story = {
  name: 'Application error',
  args: { error: 'More than the order line asks for.', defaultValue: '9', required: true },
}

/** Read-only: the quantity as text. */
export const ReadOnly: Story = {
  name: 'Read-only',
  args: { readOnly: true },
}

/** Disabled, with its reason. */
export const Disabled: Story = {
  args: { disabled: true, disabledReason: 'Scan the item first.' },
}

/** Label hidden, where the row names it. */
export const LabelHidden: Story = {
  name: 'Label hidden',
  args: { hideLabel: true, label: 'Quantity, Cement CEM II 25 kg', name: 'quantity' },
}

/** Long label and description wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    label: 'Quantity of the facade mesh rolls picked from the second shelf of rack B4',
    description:
      'Count only the rolls in their original packaging; open rolls go to the returns area.',
    defaultValue: '123456',
    unit: 'rolls',
  },
}

/** On a handheld (360px). */
export const Phone: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame width={360} height={740}>
      <StoryProvider density="touch">
        <ExampleProvider>
          <div className="p-4">
            <QuantityStepper {...args} size="large" />
          </div>
        </ExampleProvider>
      </StoryProvider>
    </PhoneFrame>
  ),
}

/** Arabic, right to left: − at the start, the number left to right. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar" density="touch">
      <div className="max-w-80">
        <QuantityStepper label="الكمية" defaultValue="12" min="0" unit="قطعة" />
      </div>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja" density="touch">
      <div className="max-w-80">
        <QuantityStepper label="数量" defaultValue="3" min="1" unit="個" />
      </div>
    </StoryProvider>
  ),
}

/** + and ArrowUp step; typed text is read; the limit stops +. */
export const Stepping: Story = {
  name: 'Stepping, interaction',
  tags: ['interaction'],
  args: { max: '6', onChange: fn() },
  play: async ({ canvasElement, args }) => {
    await settle()
    const canvas = within(canvasElement)
    const input = canvas.getByRole('textbox', { name: 'Quantity picked' })
    await userEvent.click(canvas.getByRole('button', { name: 'Increase Quantity picked' }))
    await expect(input).toHaveValue('5')
    await userEvent.click(input)
    await userEvent.keyboard('{ArrowUp}')
    await expect(input).toHaveValue('6')
    await expect(args.onChange).toHaveBeenLastCalledWith('6')
    await expect(canvas.getByRole('button', { name: 'Increase Quantity picked' })).toBeDisabled()
    await userEvent.clear(input)
    await userEvent.type(input, '2{Enter}')
    await expect(args.onChange).toHaveBeenLastCalledWith('2')
  },
}
