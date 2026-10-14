import type { Meta, StoryObj } from '@storybook/react-vite'
import { Ban, ChefHat, PauseCircle, Percent, Receipt, UserRound } from 'lucide-react'
import type { ReactNode } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { CartPanel } from './cart-panel'
import { AdvanceList } from './advance-list'
import { CART_LINES, CART_TOTAL, CART_TOTALS, CURRENCY } from './pos-story-data'
import { ADVANCES, TAB_LINES } from './sale-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

function Till({ children }: { children: ReactNode }) {
  return (
    <StoryProvider density="touch">
      <ExampleProvider>
        <div className="flex h-170 w-104 border border-solid border-default">{children}</div>
      </ExampleProvider>
    </StoryProvider>
  )
}

const ACTIONS = (
  <>
    <Button family="neutral" icon={PauseCircle} label="Park sale" />
    <Button family="neutral" icon={Ban} label="Void sale" />
  </>
)

const meta = {
  title: 'Components/POS/CartPanel',
  component: CartPanel,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** what is being sold at a till: the lines (name, quantity with a stepper, ' +
          'unit price, line total), the discounts and totals, and “Charge 1.011,00 RSD” last, full ' +
          'width, within the thumb’s reach. **It computes nothing:** every amount arrives from the ' +
          'application as a decimal string; a quantity change is reported, and the new totals ' +
          'settle in place (`pending`).\n\n' +
          '**When:** the cart of PosShell; a kiosk’s order.\n\n' +
          '**When not:** document lines (EditableGrid); a read-only receipt (ReceiptPreview).\n\n' +
          '**P5.28:** the sale’s kind under the title and a marker for a kind that is not a real ' +
          'sale; the application’s details (the buyer, open advances); a line’s note, its state ' +
          '(“Sent to the bar · 18:15”) and an edit button; the total’s own words (“To pay”). ' +
          'Promotions and an order discount are rows and line texts the application computes.',
      },
    },
  },
  args: {
    lines: CART_LINES,
    currency: CURRENCY,
    total: CART_TOTAL,
    totals: CART_TOTALS,
    onQuantityChange: () => undefined,
    onRemove: () => undefined,
    onCharge: () => undefined,
    actions: ACTIONS,
  },
  render: (args) => (
    <Till>
      <CartPanel {...args} className="flex-1" />
    </Till>
  ),
  play: settle,
} satisfies Meta<typeof CartPanel>

export default meta

type Story = StoryObj<typeof meta>

/** Four lines, a loyalty discount, VAT included, the main action last. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: /^Charge 1\.011,00/ })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Remove Kifla' })).toBeVisible()
    await expect(canvas.getByRole('textbox', { name: 'Quantity, Kifla' })).toHaveValue('4')
  },
}

/** A header action (the customer), and the totals being recomputed after a change. */
export const Pending: Story = {
  name: 'Totals settling',
  args: {
    pending: true,
    headerActions: <Button family="neutral" icon={UserRound} label="Customer" />,
  },
}

/** Nothing sold yet. */
export const Empty: Story = {
  args: { lines: [], total: null, totals: [] },
}

/** Charging is not possible now: the reason under the focusable button. */
export const ChargeUnavailable: Story = {
  name: 'Charge unavailable',
  args: { chargeDisabledReason: 'The shift is closed. Open a new shift to charge.' },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('button', { name: /^Charge/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  },
}

/** Read-only (a parked sale shown to a supervisor): quantities as text, no remove, no charge. */
export const ReadOnly: Story = {
  name: 'Read-only',
  render: () => (
    <Till>
      <CartPanel
        className="flex-1"
        title="Parked sale 3"
        lines={CART_LINES}
        currency={CURRENCY}
        total={CART_TOTAL}
        totals={CART_TOTALS}
      />
    </Till>
  ),
}

/** Long names, details and discounts wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    lines: [
      {
        id: 'x1',
        name: 'Integralni hleb sa semenkama suncokreta, lana, susama i bundeve iz krušne peći',
        detail: '750 g · sliced · packed in paper for the customer to take home',
        quantity: '12',
        unit: 'pc',
        unitPrice: '125000.50',
        total: '1500006.00',
        discount: 'Loyalty card 0012-3456-7890, 10% on bread every Tuesday morning before 10:00',
      },
      ...CART_LINES.slice(0, 2),
    ],
    total: '1500486.00',
    totals: [{ id: 'subtotal', label: 'Subtotal before every discount', value: '1500486.00' }],
  },
}

/** On a phone, full height. */
export const Phone: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <StoryProvider density="touch">
        <ExampleProvider>
          <div className="flex h-full">
            <CartPanel {...args} className="flex-1" />
          </div>
        </ExampleProvider>
      </StoryProvider>
    </PhoneFrame>
  ),
}

/** Arabic, right to left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar" density="touch">
      <div className="flex h-150 w-104 border border-solid border-default">
        <CartPanel
          className="flex-1"
          title="السلة"
          currency="د.إ"
          total="31.50"
          totals={[{ id: 's', label: 'المجموع الفرعي', value: '31.50' }]}
          lines={[
            { id: 'a1', name: 'خبز أبيض', quantity: '2', unitPrice: '6.5', total: '13.00' },
            {
              id: 'a2',
              name: 'كرواسون بالشوكولاتة',
              quantity: '1',
              unitPrice: '18.5',
              total: '18.50',
              discount: 'خصم الولاء',
            },
          ]}
          onQuantityChange={() => undefined}
          onRemove={() => undefined}
          onCharge={() => undefined}
          chargeLabel="الدفع 31.50 د.إ"
        />
      </div>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja" density="touch">
      <div className="flex h-150 w-104 border border-solid border-default">
        <CartPanel
          className="flex-1"
          title="カート"
          currency="¥"
          total="820"
          lines={[
            { id: 'j1', name: '食パン', quantity: '1', unitPrice: '320', total: '320' },
            { id: 'j2', name: 'メロンパン', quantity: '2', unitPrice: '250', total: '500' },
          ]}
          onQuantityChange={() => undefined}
          onRemove={() => undefined}
          onCharge={() => undefined}
          chargeLabel="お会計 ¥820"
        />
      </div>
    </StoryProvider>
  ),
}

/** + reports the new quantity; the panel changes nothing until the application answers. */
export const Stepping: Story = {
  name: 'Stepping, interaction',
  tags: ['interaction'],
  args: { onQuantityChange: fn() },
  play: async ({ canvasElement, args }) => {
    await settle()
    const canvas = within(canvasElement)
    const quantity = canvas.getByRole('textbox', { name: 'Quantity, Jogurt' })
    await userEvent.click(canvas.getByRole('button', { name: 'Increase Quantity, Jogurt' }))
    await expect(args.onQuantityChange).toHaveBeenCalledWith('c3', '2')
    // The quantity and the line total are the application's: unchanged until it sends new ones.
    await expect(quantity).toHaveValue('1')
  },
}

/** Training: the kind under the title and the marker above the lines. */
export const Training: Story = {
  args: {
    kindLabel: 'Training · Sale',
    marker: 'Training — this is not a fiscal receipt',
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelector('[data-slot="cart-marker"]')).toHaveTextContent(
      'Training — this is not a fiscal receipt',
    )
  },
}

/**
 * An open tab: two lines sent to the bar, one new with a note; a 3-for-2 promotion, happy hour and
 * an order discount, all computed by the application; Send order before Bill.
 */
export const OpenTab: Story = {
  name: 'Open tab',
  args: {
    title: 'Table 3',
    lines: TAB_LINES,
    total: '990.00',
    totals: [
      { id: 'subtotal', label: 'Subtotal', value: '1100.00' },
      { id: 'order', label: 'Regular guest −10%', value: '-110.00' },
      { id: 'vat', label: 'VAT 20% included', value: '165.00' },
    ],
    onEditLine: () => undefined,
    chargeLabel: 'Bill 990,00 RSD',
    actions: (
      <>
        <Button family="neutral" icon={Percent} label="Discount" />
        <Button family="primary" icon={ChefHat} label="Send order" />
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Edit Baklava' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent('Not sent yet')
    await expect(canvasElement).toHaveTextContent('One without walnuts')
  },
}

/** A buyer's advances deducted on the final sale: the rest to pay. */
export const AdvancesDeducted: Story = {
  name: 'Advances deducted',
  args: {
    kindLabel: 'Normal · Sale',
    total: '0.00',
    totalLabel: 'To pay',
    totals: [
      { id: 'sale', label: 'Sale', value: '1011.00' },
      { id: 'advances', label: 'Advances deducted', value: '-1011.00' },
    ],
    details: (
      <AdvanceList
        advances={ADVANCES.slice(0, 1)}
        currency={CURRENCY}
        defaultSelected={['a2201']}
        onSelectionChange={() => undefined}
        chosenTotal="1011.00"
      />
    ),
    headerActions: <Button family="neutral" icon={Receipt} label="Receipt kind" />,
  },
}
