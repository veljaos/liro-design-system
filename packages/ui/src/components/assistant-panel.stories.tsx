import type { Meta, StoryObj } from '@storybook/react-vite'
import { Sparkles } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { AssistantAnswer } from './assistant-answer'
import { AssistantPanel, type AssistantPanelProps, type AssistantTurn } from './assistant-panel'
import {
  ARABIC_BLOCKS,
  ARABIC_QUESTION,
  JAPANESE_BLOCKS,
  JAPANESE_QUESTION,
  LONG_BLOCKS,
  OVERDUE_BLOCKS,
  OVERDUE_FOLLOW_UPS,
  QUESTION_OVERDUE,
  QUESTION_REVENUE,
  revenueBlocks,
  STREAMING_BLOCKS,
  SUGGESTIONS,
} from './assistant-story-data'
import { CodeHighlighting } from '../code'
import { IconButton } from './button'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'
import { Reasoning, Sources, Subagent, Task } from './trace'
import {
  MATCHING_STEPS,
  QUESTION_SEF,
  RECORD_SOURCES,
  SEF_BLOCKS,
  SUBAGENT_STEPS,
} from './trace-story-data'

const noop = () => undefined
const NOTE = 'Answers use only the data you may see. Check them before you act.'

const OVERDUE_TURN: AssistantTurn = {
  id: 't1',
  question: QUESTION_OVERDUE,
  answer: (
    <AssistantAnswer
      author="Liro Assistant"
      blocks={OVERDUE_BLOCKS}
      followUps={OVERDUE_FOLLOW_UPS}
      onFollowUp={noop}
      onReport={noop}
      question={QUESTION_OVERDUE}
    />
  ),
}

const STREAMING_TURN: AssistantTurn = {
  id: 't2',
  question: 'And how many of them were overdue last month too?',
  answer: (
    <AssistantAnswer
      author="Liro Assistant"
      state="streaming"
      blocks={STREAMING_BLOCKS}
      onStop={noop}
    />
  ),
}

/** A finished answer with its work (P5.93): thinking, a handed-off run and the records used. */
const SEF_TURN: AssistantTurn = {
  id: 't3',
  question: QUESTION_SEF,
  answer: (
    <AssistantAnswer
      author="Liro Assistant"
      question={QUESTION_SEF}
      blocks={SEF_BLOCKS}
      onReport={noop}
      work={
        <>
          <Reasoning status="done" duration="3 s">
            <p className="m-0">
              A rejected e-invoice has SEF’s answer in the connection log. I read it, then the
              buyer’s record.
            </p>
          </Reasoning>
          <Subagent
            name="Integration checker"
            title="Read SEF’s answer to invoice F-2026-0398"
            duration="2 s"
            steps={SUBAGENT_STEPS.slice(0, 1)}
          />
          <Sources items={RECORD_SOURCES.slice(0, 2)} />
        </>
      }
    />
  ),
}

/** The next question while it works: the task's steps as they happen. */
const WORKING_TURN: AssistantTurn = {
  id: 't4',
  question: 'Match the payments on statement 188.',
  answer: (
    <AssistantAnswer
      author="Liro Assistant"
      state="thinking"
      work={
        <>
          <Reasoning status="done" duration="2 s" />
          <Task title="Matching bank statement 188" description="31 of 42" steps={MATCHING_STEPS} />
        </>
      }
    />
  ),
}

const trigger = (
  <IconButton family="neutral" emphasis="menu" icon={Sparkles} label="Liro Assistant" />
)

const meta = {
  title: 'Components/Assistant/AssistantPanel',
  component: AssistantPanel,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** an assistant beside every page: a sheet at the end of the screen ' +
          '(the whole screen on a phone), opened from the application’s button in AppShell’s ' +
          '`agent` slot. The conversation — each question on its own surface, each answer an ' +
          'AssistantAnswer — and the question box at the bottom; before the first question the ' +
          'application’s intro and suggested questions. "New conversation" and "Open as a ' +
          'page" (the application’s AskPage) in the header. Nothing calls a model: the turns ' +
          'are the application’s data.\n\n**When to use:** the assistant on any page, with the ' +
          'page still there when it closes. **When not:** a long reading of one answer ' +
          '(AskPage); an agent asking the user something (AgentQuestion); a search for a ' +
          'record (CommandPalette).',
      },
    },
  },
  args: {
    title: 'Liro Assistant',
    defaultOpen: true,
    trigger,
    turns: [OVERDUE_TURN],
    onAsk: noop,
    onNewConversation: noop,
    pageHref: '#/ask',
    note: NOTE,
    composer: { placeholder: 'Ask about your company' },
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <Story />
      </ExampleProvider>
    ),
  ],
  play: async () => {
    await within(document.body).findByRole('dialog', { name: 'Liro Assistant' })
    await settle()
  },
} satisfies Meta<typeof AssistantPanel>

export default meta

type Story = StoryObj<typeof meta>

/** Open with an answer: the question, the table as cards with links, follow-ups, the box. */
export const Default: Story = {
  play: async () => {
    const panel = await within(document.body).findByRole('dialog', { name: 'Liro Assistant' })
    await settle()
    await expect(within(panel).getByRole('log', { name: 'Conversation' })).toBeVisible()
    await expect(within(panel).getByRole('textbox', { name: 'Your question' })).toBeVisible()
    await expect(within(panel).getByRole('link', { name: 'Open as a page' })).toBeVisible()
  },
}

/**
 * With the assistant's work (P5.93): over each answer how it got there — thinking, a handed-off
 * run, the records used — one calm line each; the next answer's task shows its steps as they
 * happen. Code in an answer is a CodeBlock.
 */
export const WithWork: Story = {
  name: 'With its work',
  args: { turns: [SEF_TURN, WORKING_TURN], composer: { busy: true } },
  decorators: [
    (Story) => (
      <CodeHighlighting>
        <Story />
      </CodeHighlighting>
    ),
  ],
  play: async () => {
    const panel = await within(document.body).findByRole('dialog', { name: 'Liro Assistant' })
    await settle()
    await expect(within(panel).getByRole('button', { name: 'Thought for 3 s' })).toBeVisible()
    await expect(
      within(panel).getByRole('button', { name: 'Matching bank statement 188, In progress' }),
    ).toHaveAttribute('aria-expanded', 'true')
    await waitFor(async () => {
      await expect(panel.querySelector('[data-slot="code-block"]')).toHaveAttribute(
        'data-ready',
        'true',
      )
    })
  },
}

/** Before the first question: what it can do and the suggested questions. */
export const Empty: Story = {
  name: 'Before the first question',
  args: {
    turns: [],
    intro:
      'Ask about Kvadrat Gradnja d.o.o.’s invoices, payments, VAT and people. I answer from the data you may see and propose actions you confirm.',
    suggestions: SUGGESTIONS,
  },
  play: async () => {
    const panel = await within(document.body).findByRole('dialog', { name: 'Liro Assistant' })
    await settle()
    await expect(within(panel).getAllByRole('button', { name: /\?$|invoice$/ }).length).toBe(4)
  },
}

/** A second question being answered: the text so far and Stop; the box waits. */
export const Streaming: Story = {
  args: { turns: [OVERDUE_TURN, STREAMING_TURN], composer: { busy: true } },
}

/** The assistant is off for this company: the box disabled with the reason. */
export const Disabled: Story = {
  name: 'Disabled with reason',
  args: {
    turns: [],
    intro: 'Ask about your company’s invoices, payments, VAT and people.',
    composer: {
      disabled: true,
      disabledReason: 'The assistant is turned off for this company by your administrator.',
    },
  },
}

/** Long answers and a chart: the conversation scrolls, the box stays at the bottom. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    turns: [
      {
        id: 'l1',
        question:
          'Which customers owe us the most, counting every open item including the disputed ones and the ones not yet accepted on SEF?',
        answer: <AssistantAnswer author="Liro Assistant" blocks={LONG_BLOCKS} />,
      },
      {
        id: 'l2',
        question: QUESTION_REVENUE,
        answer: <AssistantAnswer author="Liro Assistant" blocks={revenueBlocks('phone')} />,
      },
    ],
  },
}

/** On a phone the panel is the whole screen. */
export const Phone: Story = {
  args: { layout: 'phone' },
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
}

/** Arabic: the panel opens at the end, which is the left. */
export const Arabic: Story = {
  args: {
    title: 'المساعد',
    turns: [
      {
        id: 'a',
        question: ARABIC_QUESTION,
        answer: <AssistantAnswer author="المساعد" blocks={ARABIC_BLOCKS} />,
      },
    ],
    note: 'تعتمد الإجابات على البيانات المسموح لك برؤيتها.',
  },
  play: async () => {
    await within(document.body).findByRole('dialog', { name: 'المساعد' })
    await settle()
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ar">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** Japanese. */
export const Japanese: Story = {
  args: {
    title: 'アシスタント',
    turns: [
      {
        id: 'j',
        question: JAPANESE_QUESTION,
        answer: <AssistantAnswer author="アシスタント" blocks={JAPANESE_BLOCKS} />,
      },
    ],
    note: '回答はあなたが閲覧できるデータのみに基づきます。',
  },
  play: async () => {
    await within(document.body).findByRole('dialog', { name: 'アシスタント' })
    await settle()
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ja">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** The application's side: a question asked adds a turn with its (fixed) answer. */
function Conversation(props: Partial<AssistantPanelProps>) {
  const [turns, setTurns] = useState<AssistantTurn[]>([])
  const [open, setOpen] = useState(false)
  const ask = (question: string) => {
    setTurns((list) => [
      ...list,
      {
        id: String(list.length),
        question,
        answer: (
          <AssistantAnswer
            author="Liro Assistant"
            blocks={question === QUESTION_OVERDUE ? OVERDUE_BLOCKS : revenueBlocks()}
          />
        ),
      },
    ])
  }
  return (
    <AssistantPanel
      title="Liro Assistant"
      trigger={trigger}
      open={open}
      onOpenChange={setOpen}
      turns={turns}
      suggestions={SUGGESTIONS}
      onAsk={ask}
      onNewConversation={() => {
        setTurns([])
      }}
      {...props}
    />
  )
}

/**
 * The button opens the panel; a suggested question is asked and answered; a typed one too;
 * "New conversation" empties it; Escape closes it and the focus returns to the button.
 */
export const AskInteraction: Story = {
  name: 'Ask, interaction',
  tags: ['interaction'],
  render: () => <Conversation />,
  play: async ({ canvasElement }) => {
    await settle()
    const opener = within(canvasElement).getByRole('button', { name: 'Liro Assistant' })
    await userEvent.click(opener)
    const panel = await within(document.body).findByRole('dialog', { name: 'Liro Assistant' })
    await userEvent.click(within(panel).getByRole('button', { name: QUESTION_OVERDUE }))
    const log = await within(panel).findByRole('log', { name: 'Conversation' })
    await expect(log).toHaveTextContent('512.400,00')
    await userEvent.type(
      within(panel).getByRole('textbox', { name: 'Your question' }),
      `${QUESTION_REVENUE}{Enter}`,
    )
    await expect(log).toHaveTextContent('Revenue in the third quarter')
    await userEvent.click(within(panel).getByRole('button', { name: 'New conversation' }))
    await expect(within(panel).queryByRole('log')).toBeNull()
    await userEvent.keyboard('{Escape}')
    // The focus returns once the sheet has finished closing.
    await waitFor(() => expect(opener).toHaveFocus())
  },
}
