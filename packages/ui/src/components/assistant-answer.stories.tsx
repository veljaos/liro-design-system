import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { AssistantAnswer } from './assistant-answer'
import {
  ARABIC_BLOCKS,
  ARABIC_FOLLOW_UPS,
  ARABIC_QUESTION,
  JAPANESE_BLOCKS,
  JAPANESE_FOLLOW_UPS,
  JAPANESE_QUESTION,
  LONG_BLOCKS,
  OVERDUE_BLOCKS,
  OVERDUE_FOLLOW_UPS,
  QUESTION_OVERDUE,
  QUESTION_REVENUE,
  REPORT_REASONS,
  revenueBlocks,
  STREAMING_BLOCKS,
} from './assistant-story-data'
import { CodeHighlighting } from '../code'
import { ProposedAction } from './proposed-action'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'
import { Reasoning, Sources, Task } from './trace'
import {
  MATCHED_STEPS,
  MATCHING_STEPS,
  QUESTION_SEF,
  RECORD_SOURCES,
  SEF_BLOCKS,
} from './trace-story-data'

const noop = () => undefined

const meta = {
  title: 'Components/Assistant/AssistantAnswer',
  component: AssistantAnswer,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** one answer of an assistant, drawn from the application’s data — ' +
          'nothing here calls a model. The answer is a list of blocks (headings, paragraphs, ' +
          'short lists, small tables with links to the records, a chart slot for ' +
          '`@veljaos/ui/charts`, and the sources) and a state: thinking, streaming (the text so ' +
          'far and Stop), done, stopped, error and no access (the application’s words). It is ' +
          'always labelled "AI-generated" (AgentMark) and offers "Report a wrong answer" ' +
          '(ReasonConfirmDialog). Follow-up questions and ProposedAction cards come after it.' +
          '\n\n**When to use:** inside AssistantPanel (`size="panel"`: tables as cards) or on ' +
          'an "Ask" page (`size="page"`: larger text, tables as tables; the Ask recipe). **When not:** a message ' +
          'between people (MessageBubble); an agent asking the user something (AgentQuestion); ' +
          'a notification (Toaster).',
      },
    },
  },
  args: { author: 'Liro Assistant', blocks: OVERDUE_BLOCKS },
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
} satisfies Meta<typeof AssistantAnswer>

export default meta

type Story = StoryObj<typeof meta>

/** A table answer in the panel: the rows as cards, each linked to its invoice; the sources. */
export const Default: Story = {
  args: {
    question: QUESTION_OVERDUE,
    followUps: OVERDUE_FOLLOW_UPS,
    onFollowUp: noop,
    onReport: noop,
    reportReasons: REPORT_REASONS,
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvasElement).toHaveTextContent('AI-generated')
    await expect(canvas.getByRole('link', { name: 'F-2026-0371' })).toHaveAttribute(
      'href',
      '#/sales/invoices/F-2026-0371',
    )
    await expect(canvas.getByRole('button', { name: 'Used 2 records' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: OVERDUE_FOLLOW_UPS[0] ?? '' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Report a wrong answer' })).toBeVisible()
  },
}

/** A chart answer: the chart is a slot the application fills from `@veljaos/ui/charts`. */
export const Chart: Story = {
  args: { blocks: revenueBlocks(), question: QUESTION_REVENUE, onReport: noop },
}

/** On the "Ask" page: larger text, headings in the page's outline, the table as a table. */
export const Page: Story = {
  name: 'On the Ask page',
  args: { size: 'page', followUps: OVERDUE_FOLLOW_UPS, onFollowUp: noop, onReport: noop },
  decorators: [
    (Story) => (
      <div className="max-w-[44rem]">
        <Story />
      </div>
    ),
  ],
  play: async ({ canvasElement }) => {
    await settle()
    const table = within(canvasElement).getByRole('table', {
      name: 'Overdue more than 30 days on 14.10.2026.',
    })
    await expect(within(table).getAllByRole('columnheader')).toHaveLength(5)
    await expect(table).toHaveTextContent('512.400,00')
  },
}

/** Asked; nothing written yet: "Thinking…" as a polite status, the answer busy. */
export const Thinking: Story = {
  args: { state: 'thinking' },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Thinking…')
    await expect(canvasElement.querySelector('article')).toHaveAttribute('aria-busy', 'true')
  },
}

/** Being written: the text so far, "Writing…" and Stop. No timer: the story renders the state. */
export const Streaming: Story = {
  args: { state: 'streaming', blocks: STREAMING_BLOCKS, onStop: noop },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('button', { name: 'Stop' })).toBeVisible()
  },
}

/** Stopped by the user: what was written, marked incomplete, with Try again. */
export const Stopped: Story = {
  args: { state: 'stopped', blocks: STREAMING_BLOCKS, onRetry: noop, onReport: noop },
}

/** It could not be answered: the application's words and Try again (neutral). */
export const Failed: Story = {
  name: 'Error',
  args: {
    state: 'error',
    reason: 'The sales data could not be read just now. Your question was not lost.',
    onRetry: noop,
  },
}

/** The user may not see what the answer needs: the application's words, never a failure. */
export const NoAccess: Story = {
  name: 'No access',
  args: {
    state: 'noAccess',
    reason:
      'You do not have permission to see salaries. Ask your administrator for the Payroll role.',
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('You do not have permission to see salaries.')
  },
}

/** With a proposed action under the answer: it waits for Confirm. */
export const WithAction: Story = {
  name: 'With a proposed action',
  args: {
    blocks: [
      {
        kind: 'text',
        text: 'Invoice 2026-1187 from Beton Mix d.o.o. is recognised and matched to order NB-2026-0213.',
      },
    ],
    actions: (
      <ProposedAction
        title="Post invoice 2026-1187 from Beton Mix d.o.o."
        details={[
          { label: 'Total', value: '294.000,00 RSD', numeric: true },
          { label: 'Due', value: '11.11.2026.', numeric: true },
        ]}
        onConfirm={noop}
        onDismiss={noop}
      />
    ),
  },
}

/** Reported: the thanks in place of the button. */
export const Reported: Story = {
  args: { onReport: noop, reported: true },
}

/** Long text wraps; a long table cell wraps in its card. */
export const LongText: Story = {
  name: 'Long text',
  args: { blocks: LONG_BLOCKS, followUps: OVERDUE_FOLLOW_UPS, onFollowUp: noop },
}

/** Phone width on the Ask page: the table becomes cards, nothing scrolls sideways. */
export const Phone: Story = {
  args: { size: 'page', layout: 'phone', blocks: [...OVERDUE_BLOCKS, ...revenueBlocks('phone')] },
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

/** Arabic: the answer and its cards right to left; the amounts keep their order. */
export const Arabic: Story = {
  args: {
    author: 'المساعد',
    question: ARABIC_QUESTION,
    blocks: ARABIC_BLOCKS,
    followUps: ARABIC_FOLLOW_UPS,
    onFollowUp: noop,
    onReport: noop,
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
    author: 'アシスタント',
    question: JAPANESE_QUESTION,
    blocks: JAPANESE_BLOCKS,
    followUps: JAPANESE_FOLLOW_UPS,
    onFollowUp: noop,
    onReport: noop,
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

/** A follow-up reports its question; the application asks it. */
function FollowUps() {
  const [asked, setAsked] = useState('')
  return (
    <div className="flex flex-col gap-3">
      <AssistantAnswer
        author="Liro Assistant"
        blocks={OVERDUE_BLOCKS}
        followUps={OVERDUE_FOLLOW_UPS}
        onFollowUp={setAsked}
      />
      <output dir="auto" className="text-sm">
        {asked}
      </output>
    </div>
  )
}

/**
 * "Report a wrong answer": the dialog titled by the action with the question as its subject; a
 * reason chosen, Send report, the thanks. A follow-up reports its question.
 */
export const ReportInteraction: Story = {
  name: 'Report and follow-up, interaction',
  tags: ['interaction'],
  args: { question: QUESTION_OVERDUE, onReport: noop, reportReasons: REPORT_REASONS },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Report a wrong answer' }))
    const dialog = await within(document.body).findByRole('alertdialog')
    await expect(dialog).toHaveAccessibleName(`Report a wrong answer ${QUESTION_OVERDUE}`)
    const send = within(dialog).getByRole('button', { name: 'Send report' })
    await expect(send).toBeDisabled()
    await userEvent.click(within(dialog).getByRole('radio', { name: 'The figures are wrong' }))
    await userEvent.click(send)
    await expect(await canvas.findByRole('status')).toHaveTextContent(
      'Thank you. Your report was sent.',
    )
  },
}

export const FollowUpInteraction: Story = {
  name: 'Follow-up, interaction',
  tags: ['interaction'],
  render: () => <FollowUps />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: OVERDUE_FOLLOW_UPS[1] ?? '' }))
    await expect(canvasElement.querySelector('output')).toHaveTextContent(
      OVERDUE_FOLLOW_UPS[1] ?? '',
    )
  },
}

/**
 * With its work: how the assistant got there, above the answer — its thinking, the task
 * and the records it used — each one calm line until opened.
 */
export const WithWork: Story = {
  name: 'With its work',
  args: {
    question: QUESTION_OVERDUE,
    onReport: noop,
    work: (
      <>
        <Reasoning status="done" duration="4 s">
          <p className="m-0">
            Overdue means past the due date and not paid in full. I read the open items of every
            customer and kept those more than 30 days late.
          </p>
        </Reasoning>
        <Task title="Read 214 open invoices" steps={MATCHED_STEPS.slice(1, 2)} />
        <Sources items={RECORD_SOURCES} />
      </>
    ),
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Thought for 4 s' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Used 4 records' })).toBeVisible()
  },
}

/** Thinking with its work: the task's steps as they happen take the place of "Thinking…". */
export const ThinkingWork: Story = {
  name: 'Thinking, with its work',
  tags: ['!dev'],
  args: {
    state: 'thinking',
    work: (
      <>
        <Reasoning status="done" duration="2 s" />
        <Task title="Matching bank statement 188" description="31 of 42" steps={MATCHING_STEPS} />
      </>
    ),
  },
}

/** Code in an answer: a payload with Copy, highlighted where the application gives it. */
export const WithCode: Story = {
  name: 'With code',
  tags: ['!dev'],
  args: { question: QUESTION_SEF, blocks: SEF_BLOCKS, onReport: noop },
  decorators: [
    (Story) => (
      <CodeHighlighting>
        <Story />
      </CodeHighlighting>
    ),
  ],
  play: async ({ canvasElement }) => {
    await settle()
    await waitFor(async () => {
      await expect(canvasElement.querySelector('[data-slot="code-block"]')).toHaveAttribute(
        'data-ready',
        'true',
      )
    })
    await expect(within(canvasElement).getByRole('region', { name: 'SEF response' })).toBeVisible()
  },
}
