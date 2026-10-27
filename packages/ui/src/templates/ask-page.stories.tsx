import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { AssistantAnswer } from '../components/assistant-answer'
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
  RECENT,
  revenueBlocks,
  SUGGESTIONS,
} from '../components/assistant-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { AskPage } from './ask-page'

const noop = () => undefined
const TITLE = 'What would you like to know?'
const NOTE = 'Answers use only the data you may see. Check them before you act.'

const meta = {
  title: 'Templates/AskPage',
  component: AskPage,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component:
          '**What for:** an assistant’s page of its own, and nothing else on it: one large ' +
          'question box in a centred column with the suggested and the recent questions under ' +
          'it; once asked, the question as the page’s h1 and the answer as a calm, readable ' +
          'page (an AssistantAnswer with `size="page"`: headings, text, tables, charts, ' +
          'sources), then the box for a follow-up.\n\n**When to use:** the application’s ' +
          '"Ask" page, reached from AssistantPanel’s "Open as a page". **When not:** asking ' +
          'beside the page one is working on (AssistantPanel); searching records (ListPage ' +
          'with FilterBar).',
      },
    },
  },
  args: {
    title: TITLE,
    description: 'Ask about Kvadrat Gradnja d.o.o. in your own words.',
    onAsk: noop,
    suggestions: SUGGESTIONS,
    recent: RECENT,
    note: NOTE,
    composer: { placeholder: 'Ask about invoices, payments, VAT or people' },
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <div className="min-h-screen bg-surface-page">
          <Story />
        </div>
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof AskPage>

export default meta

type Story = StoryObj<typeof meta>

/** Before a question: the large centred box, suggested and recent questions. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: TITLE })).toBeVisible()
    await expect(canvas.getByRole('list', { name: 'Suggested questions' })).toBeVisible()
    await expect(canvas.getByRole('list', { name: 'Recent questions' })).toBeVisible()
  },
}

/** An answer as a readable page: heading, text, the chart, a list and the sources. */
export const Answer: Story = {
  args: {
    question: QUESTION_REVENUE,
    onNewQuestion: noop,
    answer: (
      <AssistantAnswer
        author="Liro Assistant"
        size="page"
        blocks={revenueBlocks()}
        followUps={['Which customers brought the most revenue?']}
        onFollowUp={noop}
        onReport={noop}
      />
    ),
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: QUESTION_REVENUE })).toBeVisible()
    await expect(
      canvas.getByRole('heading', { level: 2, name: 'Revenue in the third quarter' }),
    ).toBeVisible()
    await expect(canvas.getByRole('textbox', { name: 'Ask a follow-up' })).toBeVisible()
  },
}

/** A table answer on the page: a real table with its total. */
export const TableAnswer: Story = {
  name: 'Answer with a table',
  args: {
    question: QUESTION_OVERDUE,
    onNewQuestion: noop,
    answer: (
      <AssistantAnswer
        author="Liro Assistant"
        size="page"
        blocks={OVERDUE_BLOCKS}
        followUps={OVERDUE_FOLLOW_UPS}
        onFollowUp={noop}
        onReport={noop}
      />
    ),
  },
}

/** Asked; nothing written yet. */
export const Thinking: Story = {
  args: {
    question: QUESTION_OVERDUE,
    answer: <AssistantAnswer author="Liro Assistant" size="page" state="thinking" />,
    composer: { busy: true },
  },
}

/** No access: the application's words. */
export const NoAccess: Story = {
  name: 'No access',
  args: {
    question: 'What is the average salary on the sites?',
    onNewQuestion: noop,
    answer: (
      <AssistantAnswer
        author="Liro Assistant"
        size="page"
        state="noAccess"
        reason="You do not have permission to see salaries. Ask your administrator for the Payroll role."
      />
    ),
  },
}

/** The assistant is off: the box read-only, Ask unavailable with its reason. */
export const Unavailable: Story = {
  name: 'Unavailable with reason',
  args: {
    composer: {
      unavailableReason: 'The assistant is turned off for this company by your administrator.',
    },
  },
}

/** A long question and a long answer wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    question:
      'Which customers owe us the most, counting every open item including the disputed ones and the ones that were sent to SEF but not yet accepted by the buyer?',
    onNewQuestion: noop,
    answer: <AssistantAnswer author="Liro Assistant" size="page" blocks={LONG_BLOCKS} />,
  },
}

/** Phone width: the box at the top, the questions under it. */
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

/** Phone width with an answer: the table as cards, the chart for a phone. */
export const PhoneAnswer: Story = {
  name: 'Phone, answer',
  args: {
    layout: 'phone',
    question: QUESTION_OVERDUE,
    onNewQuestion: noop,
    answer: (
      <AssistantAnswer
        author="Liro Assistant"
        size="page"
        layout="phone"
        blocks={[...OVERDUE_BLOCKS, ...revenueBlocks('phone')]}
      />
    ),
  },
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

/** Arabic. */
export const Arabic: Story = {
  args: {
    title: 'ماذا تريد أن تعرف؟',
    description: 'اسأل بكلماتك.',
    question: ARABIC_QUESTION,
    onNewQuestion: noop,
    note: 'تعتمد الإجابات على البيانات المسموح لك برؤيتها.',
    answer: <AssistantAnswer author="المساعد" size="page" blocks={ARABIC_BLOCKS} />,
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
    title: '何を知りたいですか？',
    description: 'ご自分の言葉で質問してください。',
    suggestions: [JAPANESE_QUESTION],
    recent: ['先月の燃料費はいくらでしたか？'],
    note: '回答はあなたが閲覧できるデータのみに基づきます。',
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

/** Japanese with an answer. */
export const JapaneseAnswer: Story = {
  name: 'Japanese, answer',
  args: {
    title: '何を知りたいですか？',
    question: JAPANESE_QUESTION,
    onNewQuestion: noop,
    answer: <AssistantAnswer author="アシスタント" size="page" blocks={JAPANESE_BLOCKS} />,
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

function Asking() {
  const [question, setQuestion] = useState<string | null>(null)
  return (
    <AskPage
      title={TITLE}
      onAsk={setQuestion}
      suggestions={SUGGESTIONS}
      recent={RECENT}
      {...(question === null
        ? {}
        : {
            question,
            onNewQuestion: () => {
              setQuestion(null)
            },
            answer: (
              <AssistantAnswer
                author="Liro Assistant"
                size="page"
                blocks={question === QUESTION_OVERDUE ? OVERDUE_BLOCKS : revenueBlocks()}
              />
            ),
          })}
    />
  )
}

/** A suggested question opens its answer; "New question" goes back to the box. */
export const AskInteraction: Story = {
  name: 'Ask, interaction',
  tags: ['interaction'],
  render: () => <Asking />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: QUESTION_OVERDUE }))
    await expect(
      await canvas.findByRole('heading', { level: 1, name: QUESTION_OVERDUE }),
    ).toBeVisible()
    await expect(canvas.getByRole('table')).toHaveTextContent('F-2026-0371')
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Ask a follow-up' }),
      `${QUESTION_REVENUE}{Enter}`,
    )
    await expect(
      await canvas.findByRole('heading', { level: 1, name: QUESTION_REVENUE }),
    ).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'New question' }))
    await expect(canvas.getByRole('heading', { level: 1, name: TITLE })).toBeVisible()
  },
}
