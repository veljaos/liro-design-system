import type { Meta, StoryObj } from '@storybook/react-vite'
import { Bot } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { useLiro } from '../provider/liro-provider'
import { AgentQuestion } from './agent-question'
import { Button } from './button'
import { at, TODAY } from './collaboration-story-data'
import { Drawer } from './dialog'
import { Popover } from './popover'
import { Questionnaire } from './questionnaire'
import type { QuestionDefinition } from './questionnaire-logic'
import { ExampleProvider, expectContentDirection, PhoneFrame, StoryProvider } from './story-frames'

const PAYMENT_DATE: QuestionDefinition[] = [
  {
    id: 'date',
    title: 'Expected payment date',
    type: 'date',
    next: null,
  },
]

/** The agent's question with a one-question questionnaire; the answer replaces it. */
function PaymentQuestion() {
  const { format } = useLiro()
  const [answer, setAnswer] = useState<string | null>(null)
  return (
    <AgentQuestion
      agent="Liro agent"
      at={at(TODAY, '08:15')}
      question="Medic Lab Niš d.o.o. paid 100.000,00 RSD of F-2026-0410. When do they expect to pay the remaining 86.420,35 RSD?"
      {...(answer === null ? {} : { answer: `Payment expected on ${format.date(answer)}` })}
    >
      <Questionnaire
        label="Answer to Liro agent"
        questions={PAYMENT_DATE}
        summary={false}
        progress={false}
        submitLabel="Answer"
        onSubmit={(answers) => {
          const value = answers.date?.value
          if (typeof value === 'string') setAnswer(value)
        }}
      />
    </AgentQuestion>
  )
}

const meta = {
  title: 'Components/Collaboration/AgentQuestion',
  component: AgentQuestion,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** an agent asking the user something it cannot decide itself: the ' +
          "agent's name with AgentMark, its question in a bubble, and the way to answer inside " +
          'it — a Questionnaire (one question without summary and progress for a short answer, ' +
          'or several), or a short form. Once answered, `answer` shows the decision in place of ' +
          'the form. The application opens it where it fits: a Popover from the agent button in ' +
          'the shell, a Drawer, or a message of a MessageThread.\n\n' +
          '**When:** the agent needs a fact or a decision from a person. **When not:** a message ' +
          "from the agent that asks nothing (MessageBubble); a confirmation of the user's own " +
          'action (ConfirmDialog).',
      },
    },
  },
  args: { agent: 'Liro agent', question: '' },
  render: () => (
    <ExampleProvider>
      <div className="max-w-140">
        <PaymentQuestion />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof AgentQuestion>

export default meta

type Story = StoryObj<typeof meta>

/** The question with a date answer; answering shows the decision in the bubble. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('group', { name: 'Question from Liro agent' })).toBeVisible()
    await settle()
  },
}

export const DefaultInteraction: Story = {
  name: 'Default, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('group', { name: 'Question from Liro agent' })).toBeVisible()
    await userEvent.type(
      canvas.getByRole('textbox', { name: 'Expected payment date' }),
      '20.10.2026{Enter}',
    )
    await expect(canvas.getByText('Payment expected on 20.10.2026.')).toBeVisible()
    await expect(canvas.queryByRole('textbox')).toBeNull()
    await settle()
  },
}

/** Opened from a button, as the shell's agent button would (a Popover). */
export const InPopover: Story = {
  name: 'In a popover',
  render: () => (
    <ExampleProvider>
      <Popover
        defaultOpen
        label="Liro agent"
        align="start"
        trigger={<Button family="neutral" icon={Bot} label="Liro agent: 1 question" />}
      >
        <div className="w-96 max-w-full">
          <PaymentQuestion />
        </div>
      </Popover>
    </ExampleProvider>
  ),
  play: async () => {
    const popover = await within(document.body).findByRole('dialog', { name: 'Liro agent' })
    await settle()
    await expect(
      within(popover).getByRole('group', { name: 'Question from Liro agent' }),
    ).toBeVisible()
  },
}

export const InPopoverInteraction: Story = {
  name: 'In a popover, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Popover
        label="Liro agent"
        align="start"
        trigger={<Button family="neutral" icon={Bot} label="Liro agent: 1 question" />}
      >
        <div className="w-96 max-w-full">
          <PaymentQuestion />
        </div>
      </Popover>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await userEvent.click(
      within(canvasElement).getByRole('button', { name: 'Liro agent: 1 question' }),
    )
    const popover = await within(document.body).findByRole('dialog', { name: 'Liro agent' })
    await settle()
    await expect(
      within(popover).getByRole('group', { name: 'Question from Liro agent' }),
    ).toBeVisible()
    await settle()
  },
}

/** In a drawer from the end, with several questions. */
export const InDrawer: Story = {
  name: 'In a drawer',
  render: () => (
    <ExampleProvider>
      <Drawer
        side="end"
        defaultOpen
        title="Questions from Liro agent"
        trigger={<Button family="neutral" icon={Bot} label="Open" />}
      >
        <AgentQuestion
          agent="Liro agent"
          at={at(TODAY, '08:40')}
          question="I prepared the reminder for F-2026-0410. How should I send it?"
        >
          <Questionnaire
            questions={[
              {
                id: 'channel',
                title: 'How should the reminder go?',
                type: 'single',
                options: [
                  { value: 'email', label: 'By e-mail to racunovodstvo@mediclab.rs' },
                  { value: 'sef', label: 'As a note in SEF' },
                  { value: 'none', label: 'Do not send it', next: null },
                ],
              },
              { id: 'when', title: 'When should it go?', type: 'date', next: null },
            ]}
            submitLabel="Send to agent"
            onSubmit={() => undefined}
          />
        </AgentQuestion>
      </Drawer>
    </ExampleProvider>
  ),
  play: async () => {
    const drawer = await within(document.body).findByRole('dialog', {
      name: 'Questions from Liro agent',
    })
    await settle()
    await expect(within(drawer).getByText('0 of 2 answered')).toBeVisible()
    await settle()
  },
}

/** Answered: the decision stays in the bubble. */
export const Answered: Story = {
  render: () => (
    <ExampleProvider>
      <div className="max-w-140">
        <AgentQuestion
          agent="Liro agent"
          at={at(TODAY, '08:15')}
          question="When does Medic Lab Niš d.o.o. expect to pay the remaining 86.420,35 RSD?"
          answer="Payment expected on 20.10.2026."
        />
      </div>
    </ExampleProvider>
  ),
}

/** On a phone: the bubble takes the width, the answer under the question. */
export const Phone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <PaymentQuestion />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    const group = within(canvasElement).getByRole('group', { name: 'Question from Liro agent' })
    await waitFor(() => expect(group.scrollWidth).toBeLessThanOrEqual(group.clientWidth))
  },
}

/** Arabic text, right to left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div className="max-w-140">
        <AgentQuestion
          agent="وكيل ليرو"
          at={at(TODAY, '08:15')}
          question="متى يتوقع العميل دفع المبلغ المتبقي؟"
          answer="في 20.10.2026"
        />
      </div>
    </StoryProvider>
  ),
}

/** Japanese text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <div className="max-w-140">
        <AgentQuestion
          agent="リロ エージェント"
          at={at(TODAY, '08:15')}
          question="残額の支払予定日はいつですか？"
          answer="2026年10月20日"
        />
      </div>
    </StoryProvider>
  ),
}

/** English in a right-to-left page. */
export const EnglishInRtl: Story = {
  name: 'English in RTL',
  render: () => (
    <StoryProvider locale="ar">
      <div className="max-w-140">
        <AgentQuestion
          agent="Liro agent"
          question="When will the customer pay the rest?"
          answer="Payment expected on 20.10.2026."
        />
      </div>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await expectContentDirection(
      within(canvasElement)
        .getByText('When will the customer pay the rest?')
        .closest('[data-slot="bubble-content"]') ?? canvasElement,
    )
  },
}
