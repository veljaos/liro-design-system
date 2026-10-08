import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { DocumentCurrency } from './document-blocks'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Documents/DocumentCurrency',
  component: DocumentCurrency,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the currency block of a foreign-currency document (P5.18), in the ' +
          'header’s details: the currency, the rate ("1 EUR = 117,1825 RSD", written by the ' +
          'provider’s `format` with every decimal the application gives — never rounded) and ' +
          'the rate’s date, each a small label above its value. The lines stay in the ' +
          'document’s currency; the home-currency equivalents and the rate line with its ' +
          'source are only in the totals (`DocumentTotals` `exchange`).\n\n' +
          '**When not:** a document in the home currency (leave the slot out).',
      },
    },
  },
  args: { currency: 'EUR', homeCurrency: 'RSD', rate: '117.1825', rateDate: '2026-10-05' },
  render: (args) => (
    <ExampleProvider>
      <DocumentCurrency {...args} />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof DocumentCurrency>

export default meta

type Story = StoryObj<typeof meta>

/** EUR at the NBS middle rate of 05.10.2026. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Exchange rate1 EUR = 117,1825 RSD')
    await expect(canvasElement).toHaveTextContent('Rate date05.10.2026.')
  },
}

/** A rate with six decimals is shown with all of them. */
export const LongText: Story = {
  name: 'Long text',
  args: { currency: 'CHF', rate: '125.987654', rateDate: '2026-10-05' },
}

/** Phone width: the three values wrap. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <ExampleProvider>
          <DocumentCurrency {...args} />
        </ExampleProvider>
      </div>
    </PhoneFrame>
  ),
}

/** In a right-to-left page (the labels are the provider's messages). */
export const Arabic: Story = {
  render: (args) => (
    <StoryProvider locale="ar">
      <DocumentCurrency {...args} />
    </StoryProvider>
  ),
}

/** Japanese locale: the rate and date as Japanese formatting writes them. */
export const Japanese: Story = {
  render: (args) => (
    <StoryProvider locale="ja">
      <DocumentCurrency {...args} currency="JPY" rate="0.7812" />
    </StoryProvider>
  ),
}
