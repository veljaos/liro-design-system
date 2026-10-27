import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { AssistantComposer } from './assistant-composer'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const noop = () => undefined
const PLACEHOLDER = 'Ask about invoices, payments, VAT or people'

const meta = {
  title: 'Components/Assistant/AssistantComposer',
  component: AssistantComposer,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the box where the user asks an assistant in plain words: Enter asks, ' +
          'Shift+Enter starts a new line, the ask button sits inside the box at its end. ' +
          '`size="panel"` in AssistantPanel; `size="page"` is the "Ask" page’s large box with ' +
          'the keys written under it. It grows with the text; `busy` keeps the ask button ' +
          'waiting while an answer is written; `unavailableReason` makes the box read-only and Ask unavailable, the reason in words.\n\n**When to ' +
          'use:** asking an assistant. **When not:** a comment or message to people ' +
          '(MessageComposer, ReplyComposer); a search over records (FilterBar, CommandPalette).',
      },
    },
  },
  args: { onAsk: noop, placeholder: PLACEHOLDER },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <div className="max-w-[408px]">
          <Story />
        </div>
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof AssistantComposer>

export default meta

type Story = StoryObj<typeof meta>

/** The panel's box, empty: the ask button waits for a question. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox', { name: 'Your question' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Ask' })).toBeDisabled()
  },
}

/** A question written: the ask button is ready. */
export const WithQuestion: Story = {
  name: 'With a question',
  args: { defaultValue: 'Which invoices are overdue more than 30 days?' },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('button', { name: 'Ask' })).toBeEnabled()
  },
}

/** The "Ask" page's large box, with the keys under it. */
export const Page: Story = {
  name: 'Page size',
  args: { size: 'page' },
  decorators: [
    (Story) => (
      <div className="max-w-[42rem]">
        <Story />
      </div>
    ),
  ],
}

/** An answer is being written: the ask button waits. */
export const Busy: Story = {
  args: { busy: true, defaultValue: 'And last quarter?' },
}

/** The assistant is off: the box read-only and Ask unavailable, the reason in words. */
export const Unavailable: Story = {
  name: 'Unavailable with reason',
  args: {
    unavailableReason:
      'The assistant is turned off for Kvadrat Gradnja d.o.o. by your administrator.',
  },
}

/** A long question grows the box, then it scrolls. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    defaultValue:
      'Which invoices of Stanogradnja Plus d.o.o. and Gradska toplana Novi Sad were overdue more than thirty days at the end of any month this year, and which of them were later paid in part, with the dates of those payments and the bank statements they came on?',
  },
}

/** Phone width. */
export const Phone: Story = {
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <div className="p-4">
            <Story />
          </div>
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
}

/** Arabic: the text takes its direction from what is written. */
export const Arabic: Story = {
  args: {
    label: 'سؤالك',
    placeholder: 'اسأل عن الفواتير والمدفوعات',
    defaultValue: 'ما هي الفواتير المتأخرة؟',
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ar">
        <ExampleProvider>
          <div className="max-w-[408px]">
            <Story />
          </div>
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** Japanese. */
export const Japanese: Story = {
  args: {
    label: '質問',
    placeholder: '請求書や支払いについて質問する',
    defaultValue: '延滞している請求書はどれですか？',
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ja">
        <ExampleProvider>
          <div className="max-w-[408px]">
            <Story />
          </div>
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

function Asking() {
  const [asked, setAsked] = useState<string[]>([])
  const [text, setText] = useState('')
  return (
    <div className="flex flex-col gap-3">
      <AssistantComposer
        value={text}
        onChange={setText}
        onAsk={(question) => {
          setAsked([...asked, question])
        }}
      />
      <ul aria-label="Asked" className="m-0 ps-4 text-sm">
        {asked.map((question) => (
          <li key={question} dir="auto" className="whitespace-pre-line">
            {question}
          </li>
        ))}
      </ul>
    </div>
  )
}

/** Shift+Enter starts a new line; Enter asks and empties the box. */
export const KeysInteraction: Story = {
  name: 'Keys, interaction',
  tags: ['interaction'],
  render: () => <Asking />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const box = canvas.getByRole('textbox', { name: 'Your question' })
    await userEvent.click(box)
    await userEvent.keyboard('Overdue invoices{Shift>}{Enter}{/Shift}by customer')
    await expect(box).toHaveValue('Overdue invoices\nby customer')
    await userEvent.keyboard('{Enter}')
    await expect(box).toHaveValue('')
    await expect(
      within(canvas.getByRole('list', { name: 'Asked' })).getByRole('listitem'),
    ).toHaveTextContent('Overdue invoices by customer')
  },
}
