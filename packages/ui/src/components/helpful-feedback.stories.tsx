import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { HelpfulFeedback } from './helpful-feedback'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Help/HelpfulFeedback',
  component: HelpfulFeedback,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** "Was this helpful?" under a page the reader came to for help — a ' +
          'help article, an answer, a generated summary: Yes or No in words beside their icons ' +
          '(toggle buttons, the neutral selection), the thanks, and after No, if the ' +
          'application asks, what was missing. The application keeps the answer and the ' +
          'counts ("12 of 14 people found this helpful").\n\n' +
          '**When to use:** at the end of a reading page. **When not:** rating work that was ' +
          'done for the user (SatisfactionRating); a survey (Questionnaire).',
      },
    },
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <div className="max-w-xl">
          <Story />
        </div>
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof HelpfulFeedback>

export default meta

type Story = StoryObj<typeof meta>

/** The question and its two answers, with the application's counts. */
export const Default: Story = {
  args: { counts: '12 of 14 people found this helpful' },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const group = canvas.getByRole('group', { name: 'Was this helpful?' })
    await expect(within(group).getByRole('button', { name: 'Yes' })).toHaveAttribute(
      'aria-pressed',
      'false',
    )
    await expect(within(group).getByRole('button', { name: 'No' })).toBeVisible()
  },
}

/** Answered Yes: pressed, and the thanks. */
export const AnsweredYes: Story = {
  name: 'Answered yes',
  args: { defaultAnswer: 'yes' },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Yes' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(canvas.getByRole('status')).toHaveTextContent('Thank you for telling us.')
  },
}

/** Answered No: the application asks what was missing. */
export const AskWhy: Story = {
  name: 'Answered no, what was missing',
  args: { defaultAnswer: 'no', askWhy: true },
}

/** What was missing was sent. */
export const CommentSent: Story = {
  name: 'Comment sent',
  args: { answer: 'no', askWhy: true, commentSent: true },
}

/** The application's own question and thanks, long. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    question:
      'Did this article answer your question about invoices the buyer rejected, or do you still need help from the support team?',
    thanks:
      'Thank you. Your answer goes to the people who write these articles; they read every one of them each week.',
    defaultAnswer: 'yes',
    counts: '1.284 of 1.402 readers found this article helpful in the last twelve months',
  },
}

/** Phone width. */
export const Phone: Story = {
  args: { defaultAnswer: 'no', askWhy: true },
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

/** Arabic. */
export const Arabic: Story = {
  args: {
    question: 'هل كانت هذه المقالة مفيدة؟',
    thanks: 'شكرًا لإخبارنا.',
    counts: 'وجدها 12 من أصل 14 شخصًا مفيدة',
    defaultAnswer: 'yes',
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
    question: 'この記事は役に立ちましたか？',
    thanks: 'ご回答ありがとうございます。',
    counts: '14人中12人が役に立ったと回答しました',
    defaultAnswer: 'yes',
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

/** No, then what was missing, Send: the comment's thanks. */
export const NoInteraction: Story = {
  name: 'No and a comment, interaction',
  tags: ['interaction'],
  args: { askWhy: true },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'No' }))
    await expect(canvas.getByRole('button', { name: 'No' })).toHaveAttribute('aria-pressed', 'true')
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'What was missing?' }),
      'An example with a foreign buyer.',
    )
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('Thank you. Your comment was sent.')
    await expect(canvas.queryByRole('textbox')).toBeNull()
  },
}
