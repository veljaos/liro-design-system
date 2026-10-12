import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { CandidateList, type Candidate, type CandidateListProps } from './candidate-list'
import { DateText, MoneyText } from './display-text'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

/** Open items a payment of Medic Lab Niš d.o.o. (50.000,00 RSD) may close, best first. */
const OPEN_ITEMS: Candidate[] = [
  {
    id: 'F-2026-0410',
    title: <span dir="ltr">F-2026-0410</span>,
    label: 'F-2026-0410, Medic Lab Niš d.o.o.',
    subtitle: (
      <>
        Invoice · Medic Lab Niš d.o.o. · due <DateText value="2026-10-25" />
      </>
    ),
    reason: 'Same customer and reference; pays part of it',
    figure: <MoneyText value="67762.75" currency="RSD" />,
  },
  {
    id: 'F-2026-0381',
    title: <span dir="ltr">F-2026-0381</span>,
    label: 'F-2026-0381, Medic Lab Niš d.o.o.',
    subtitle: (
      <>
        Invoice · Medic Lab Niš d.o.o. · due <DateText value="2026-09-25" />
      </>
    ),
    reason: 'Same customer',
    figure: <MoneyText value="19800.00" currency="RSD" />,
  },
  {
    id: 'KO-2026-0012',
    title: <span dir="ltr">KO-2026-0012</span>,
    label: 'KO-2026-0012, Medic Lab Niš d.o.o.',
    subtitle: 'Credit note · Medic Lab Niš d.o.o.',
    reason: 'Same customer',
    figure: <MoneyText value="-2400.00" currency="RSD" />,
  },
]

/** The application keeps the choice. */
function Controlled(
  props: Omit<CandidateListProps, 'selected' | 'onSelectedChange'> & {
    start?: string[]
  },
) {
  const { start = [], ...rest } = props
  const [selected, setSelected] = useState<string[]>(start)
  return <CandidateList {...rest} selected={selected} onSelectedChange={setSelected} />
}

const meta = {
  title: 'Components/Processes/CandidateList',
  component: CandidateList,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the records the application proposes for one decision, best first, ' +
          'each with the reason in words — the open items a bank payment may close, the ' +
          'existing record a new one may duplicate, the person a task may go to. Several ' +
          '(checkboxes, the default) or one (`multiple` false: radios); the chosen rows are the ' +
          'neutral selection with the start bar; the whole row chooses. The order, the reasons, ' +
          'the figure and what is preselected are the application’s; the list reports the ' +
          'chosen ids in the candidates’ order and computes nothing.\n\n' +
          '**When not:** a choice from a fixed set of options (RadioGroupField, SelectField); ' +
          'finding a record by typing (ComboboxField, LookupField); a whole catalogue ' +
          '(LookupDialog — offer it beside the list as "Search all…").',
      },
    },
  },
  args: { label: 'Open items', candidates: [], selected: [], onSelectedChange: () => undefined },
  render: () => (
    <ExampleProvider>
      <div className="max-w-xl">
        <Controlled label="Open items" candidates={OPEN_ITEMS} start={['F-2026-0410']} />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof CandidateList>

export default meta

type Story = StoryObj<typeof meta>

/** Several may be chosen: the best one preselected; choosing another adds it. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('checkbox', { name: /^F-2026-0410/ })).toBeChecked()
    await settle()
  },
}

export const DefaultInteraction: Story = {
  name: 'Default, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('checkbox', { name: /^F-2026-0410/ })).toBeChecked()
    await userEvent.click(canvas.getByText('F-2026-0381'))
    await expect(canvas.getByRole('checkbox', { name: /^F-2026-0381/ })).toBeChecked()
    canvas.getByRole('checkbox', { name: /^F-2026-0381/ }).focus()
    await userEvent.keyboard(' ')
    await expect(canvas.getByRole('checkbox', { name: /^F-2026-0381/ })).not.toBeChecked()
  },
}

/** One may be chosen: radios, the arrows move the choice. */
export const One: Story = {
  render: () => (
    <ExampleProvider>
      <div className="max-w-xl">
        <Controlled
          label="Existing customer"
          multiple={false}
          start={['F-2026-0410']}
          candidates={OPEN_ITEMS.slice(0, 2)}
        />
      </div>
    </ExampleProvider>
  ),
  play: async () => {
    await settle()
  },
}

export const OneInteraction: Story = {
  name: 'One, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <div className="max-w-xl">
        <Controlled
          label="Existing customer"
          multiple={false}
          start={['F-2026-0410']}
          candidates={OPEN_ITEMS.slice(0, 2)}
        />
      </div>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('radio', { name: /^F-2026-0381/ }))
    await expect(canvas.getByRole('radio', { name: /^F-2026-0381/ })).toBeChecked()
    await expect(canvas.getByRole('radio', { name: /^F-2026-0410/ })).not.toBeChecked()
  },
}

/** Nothing proposed: the provider's text, or the application's `empty`. */
export const Empty: Story = {
  render: () => (
    <ExampleProvider>
      <div className="flex max-w-xl flex-col gap-6">
        <Controlled label="Open items" candidates={[]} />
        <Controlled
          label="Open items"
          candidates={[]}
          empty={<p className="m-0 text-sm text-secondary">No open item matches this payment.</p>}
        />
      </div>
    </ExampleProvider>
  ),
}

/** Long titles and reasons wrap; the figure never does. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <div className="max-w-md">
        <Controlled
          label="Open items"
          start={['a']}
          candidates={[
            {
              id: 'a',
              title: 'Građevinsko preduzeće Kvadrat Gradnja i partneri d.o.o. Novi Sad',
              label: 'A long partner',
              subtitle: 'Invoice · a partner whose name is longer than the row is wide',
              reason:
                'Same customer, reference and amount; the payer wrote the invoice number with a typo',
              figure: <MoneyText value="1284550.17" currency="RSD" />,
            },
            OPEN_ITEMS[1] ?? { id: 'b', title: 'B', label: 'B' },
          ]}
        />
      </div>
    </ExampleProvider>
  ),
}

/** Phone width: the same rows, the figure at the end. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <Controlled label="Open items" candidates={OPEN_ITEMS} start={['F-2026-0410']} />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic: the rows follow the page's direction, the control at the start. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <div className="max-w-xl">
          <Controlled
            label="البنود المفتوحة"
            start={['a']}
            candidates={[
              {
                id: 'a',
                title: <span dir="ltr">F-2026-0410</span>,
                label: 'F-2026-0410',
                subtitle: 'فاتورة · شركة النور للتجارة',
                reason: 'نفس العميل والمرجع',
                figure: <MoneyText value="67762.75" currency="RSD" />,
              },
              {
                id: 'b',
                title: <span dir="ltr">F-2026-0381</span>,
                label: 'F-2026-0381',
                subtitle: 'فاتورة · شركة النور للتجارة',
                reason: 'نفس العميل',
                figure: <MoneyText value="19800.00" currency="RSD" />,
              },
            ]}
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese reasons and partners. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <div className="max-w-xl">
          <Controlled
            label="未決済の項目"
            start={['a']}
            candidates={[
              {
                id: 'a',
                title: <span dir="ltr">F-2026-0410</span>,
                label: 'F-2026-0410',
                subtitle: '請求書 · 株式会社さくら商事',
                reason: '同じ顧客と参照番号',
                figure: <MoneyText value="67762.75" currency="RSD" />,
              },
              {
                id: 'b',
                title: <span dir="ltr">F-2026-0381</span>,
                label: 'F-2026-0381',
                subtitle: '請求書 · 株式会社さくら商事',
                reason: '同じ顧客',
                figure: <MoneyText value="19800.00" currency="RSD" />,
              },
            ]}
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  ),
}
