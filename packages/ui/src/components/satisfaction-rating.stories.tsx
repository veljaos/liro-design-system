import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { ARABIC_SCALE, JAPANESE_SCALE, LONG_SCALE, SCALE } from './help-story-data'
import { SatisfactionRating } from './satisfaction-rating'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const QUESTION = 'How satisfied are you with how we solved your request?'

const meta = {
  title: 'Components/Help/SatisfactionRating',
  component: SatisfactionRating,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** one question on a scale after something was done for the user — a ' +
          'support request resolved, an appointment held, a course finished: the steps as a ' +
          'radio group (each with the application’s words, never a face or a colour alone), ' +
          'an optional comment, Send, then the thank-you state with the answer in words. The ' +
          'question, the steps and their words are the application’s; the component reports ' +
          '`{ value, comment }`.\n\n' +
          '**When to use:** once, after the work is done, where the user sees what was done ' +
          '(a resolved ticket’s page). **When not:** a yes/no about a page (HelpfulFeedback); ' +
          'a survey of several questions (Questionnaire); choosing an option in a form ' +
          '(RadioGroupField).',
      },
    },
  },
  args: { question: QUESTION, options: SCALE, onSubmit: () => undefined },
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
} satisfies Meta<typeof SatisfactionRating>

export default meta

type Story = StoryObj<typeof meta>

/** Five steps with words, nothing chosen yet, the optional comment and Send. */
export const Default: Story = {
  args: { description: 'Your answer goes to the support team.' },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const group = canvas.getByRole('radiogroup', { name: QUESTION })
    await expect(within(group).getAllByRole('radio')).toHaveLength(5)
    await expect(within(group).getByRole('radio', { name: '5 Very satisfied' })).not.toBeChecked()
    await expect(canvas.getByRole('textbox', { name: 'Comment (optional)' })).toBeVisible()
  },
}

/** A step chosen (the neutral selection) and a comment written. */
export const Chosen: Story = {
  args: { defaultValue: '4', defaultComment: 'Ana explained it clearly; it took two days.' },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('radio', { name: '4 Satisfied' })).toBeChecked()
  },
}

/** The application is sending: the controls wait, "Sending…" beside Send. */
export const Sending: Story = {
  args: { defaultValue: '5', sending: true },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('button', { name: 'Send' })).toBeDisabled()
    await expect(canvasElement).toHaveTextContent('Sending…')
  },
}

/** Sending failed: the application's words above Send; the answer is kept. */
export const Failed: Story = {
  name: 'Error',
  args: {
    defaultValue: '2',
    error: 'Your answer could not be sent. Check the connection and try again.',
  },
}

/** Sent: the thanks and the answer in words, with the comment. */
export const Sent: Story = {
  args: { submitted: { value: '4', comment: 'Ana explained it clearly; it took two days.' } },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('Your answer: 4, Satisfied')
    await expect(canvas.queryByRole('radiogroup')).toBeNull()
  },
}

/** No rating any more: the scale and the comment read-only, Send unavailable, why in words. */
export const Unavailable: Story = {
  name: 'Unavailable with reason',
  args: {
    unavailableReason: 'The rating closed 14 days after the request was resolved.',
  },
}

/** Without the comment: only the scale and Send. */
export const WithoutComment: Story = {
  name: 'Without comment',
  args: { comment: false, question: 'How easy was it to book your appointment?' },
}

/** Long question and step words wrap inside their tiles. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    question:
      'Thinking about the whole request — from your first message to the solution, including every reply and the time you waited — how satisfied are you with the help you got from the support team?',
    options: LONG_SCALE,
    defaultValue: '5',
    commentLabel: 'What should we keep doing, or do differently next time? (optional)',
  },
}

/** Phone width: one row per step, the radio at the start. */
export const Phone: Story = {
  args: { defaultValue: '4', layout: 'phone' },
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

/** Arabic: the steps run right to left; the arrows follow. */
export const Arabic: Story = {
  args: {
    question: 'ما مدى رضاك عن حل طلبك رقم 4796؟',
    options: ARABIC_SCALE,
    defaultValue: '4',
    commentLabel: 'تعليق (اختياري)',
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ar">
        <ExampleProvider>
          <div className="max-w-xl">
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
    question: 'お問い合わせ 4796 の対応にどの程度満足されましたか？',
    options: JAPANESE_SCALE,
    defaultValue: '5',
    commentLabel: 'コメント（任意）',
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ja">
        <ExampleProvider>
          <div className="max-w-xl">
            <Story />
          </div>
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/**
 * Send without a step asks for one; a step chosen, the arrows move the choice,
 * a comment, Send — the thanks with the answer in words.
 */
export const KeyboardInteraction: Story = {
  name: 'Keyboard, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Send' }))
    await expect(canvasElement).toHaveTextContent('Choose one of the answers.')
    await userEvent.click(canvas.getByRole('radio', { name: '1 Very dissatisfied' }))
    // Down moves to the next step in both directions; Left and Right follow the page's. The
    // group moves the focus a moment after the key, so each step is awaited.
    for (const name of ['2 Dissatisfied', '3 Neither', '4 Satisfied']) {
      // Held down until the step is chosen: the group chooses on the focus the key moved.
      await userEvent.keyboard('{ArrowDown>}')
      await waitFor(() => expect(canvas.getByRole('radio', { name })).toBeChecked())
      await userEvent.keyboard('{/ArrowDown}')
    }
    await userEvent.tab()
    await userEvent.keyboard('Quick and clear.')
    await userEvent.tab()
    await userEvent.keyboard('{Enter}')
    await expect(await canvas.findByRole('status')).toHaveTextContent('Your answer: 4, Satisfied')
    await expect(canvasElement).toHaveTextContent('Quick and clear.')
  },
}
