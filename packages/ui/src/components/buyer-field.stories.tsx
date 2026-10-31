import type { Meta, StoryObj } from '@storybook/react-vite'
import type { ReactNode } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { BuyerField } from './buyer-field'
import { BUYER_ID_TYPES, BUYER_OPTIONAL_TYPES, STORY_BUYER } from './sale-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

function Till({ children }: { children: ReactNode }) {
  return (
    <StoryProvider density="touch">
      <ExampleProvider>
        <div className="max-w-2xl p-4">{children}</div>
      </ExampleProvider>
    </StoryProvider>
  )
}

/** Five kinds only: a plain select. */
const FEW_TYPES = BUYER_ID_TYPES.slice(0, 5)

const meta = {
  title: 'Components/POS/BuyerField',
  component: BuyerField,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the buyer of a sale that names one — the kind of their ID (the ' +
          'application’s list: a tax number, a personal number, a passport…), the ID itself ' +
          '(left to right in every language) and an optional second field with its kind (a ' +
          'business unit, a corporate card). Whether it is required, what an ID looks like and ' +
          'whether it is right are the application’s rules and checks; more than ten kinds become ' +
          'a searchable combobox.\n\n' +
          '**When:** a sale to a company, a deferred payment, a refund whose rules ask for the ' +
          'buyer, a corporate card.\n\n' +
          '**When not:** choosing a known customer from the catalogue (LookupField); a full ' +
          'customer record (a form page).',
      },
    },
  },
  args: { types: BUYER_ID_TYPES, optionalTypes: BUYER_OPTIONAL_TYPES, onChange: fn() },
  render: (args) => (
    <Till>
      <BuyerField {...args} />
    </Till>
  ),
  play: settle,
} satisfies Meta<typeof BuyerField>

export default meta

type Story = StoryObj<typeof meta>

/** Empty: fifteen kinds, so the kind is a searchable combobox. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('combobox', { name: 'ID type' })).toBeVisible()
  },
}

/** A company's tax number entered; the kind's hint under the ID. */
export const Filled: Story = {
  args: { defaultValue: STORY_BUYER },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('textbox', { name: 'Buyer ID' })).toHaveValue(
      '100000017',
    )
    await expect(canvasElement).toHaveTextContent('9 digits')
  },
}

/** Required by the application's rule, with its reason and its check. */
export const Required: Story = {
  args: {
    required: true,
    description: 'A wire transfer needs the buyer’s tax number.',
    defaultValue: { typeId: '10', id: '10000001' },
    errors: { id: 'A tax number has 9 digits; this one has 8.' },
  },
}

/** Few kinds: a plain select; the optional field with a corporate card. */
export const FewTypes: Story = {
  name: 'Few types, optional field',
  args: {
    types: FEW_TYPES,
    defaultValue: { typeId: '10', id: '100000017', optionalTypeId: '30', optional: '4821' },
  },
}

/** Read only: every part in the read-only look of every field, no hints. */
export const ReadOnly: Story = {
  name: 'Read only',
  args: { types: FEW_TYPES, readOnly: true, defaultValue: STORY_BUYER },
}

/** Long words wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    label: 'The buyer as the fiscal processor will record it on the receipt',
    description:
      'The rules of a deferred payment ask for the buyer; the application checks the number against the register before the receipt is issued.',
    types: [
      {
        value: '99',
        label: 'An identity document issued by an authority with a very long official name',
        hint: 'Exactly as written on the document, without spaces or dashes between the groups',
      },
      ...FEW_TYPES,
    ],
    defaultValue: { typeId: '99', id: 'AB-1234567-CD-89' },
  },
}

/** On a phone: stacked. */
export const Phone: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <StoryProvider density="touch">
        <ExampleProvider>
          <div className="p-4">
            <BuyerField {...args} defaultValue={STORY_BUYER} required />
          </div>
        </ExampleProvider>
      </StoryProvider>
    </PhoneFrame>
  ),
}

/** Arabic, right to left: the ID stays left to right. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar" density="touch">
      <div className="max-w-2xl p-4">
        <BuyerField
          label="المشتري"
          typeLabel="نوع الهوية"
          idLabel="رقم الهوية"
          types={[
            { value: '1', label: 'الرقم الضريبي', hint: '15 رقماً' },
            { value: '2', label: 'جواز السفر' },
          ]}
          defaultValue={{ typeId: '1', id: '300000000000003' }}
          required
        />
      </div>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja" density="touch">
      <div className="max-w-2xl p-4">
        <BuyerField
          label="購入者"
          typeLabel="番号の種類"
          idLabel="番号"
          types={[
            { value: 't', label: '登録番号', hint: 'T + 13桁' },
            { value: 'c', label: '法人番号' },
          ]}
          defaultValue={{ typeId: 't', id: 'T1234567890123' }}
        />
      </div>
    </StoryProvider>
  ),
}

/** Typing the ID reports the whole value. */
export const Typing: Story = {
  name: 'Typing, interaction',
  tags: ['interaction'],
  args: { types: FEW_TYPES, defaultValue: { typeId: '10', id: '' } },
  play: async ({ args, canvasElement }) => {
    await settle()
    await userEvent.type(within(canvasElement).getByRole('textbox', { name: 'Buyer ID' }), '1')
    await expect(args.onChange).toHaveBeenLastCalledWith({ typeId: '10', id: '1' })
  },
}
