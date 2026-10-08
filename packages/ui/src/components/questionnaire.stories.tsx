import type { Meta, StoryObj } from '@storybook/react-vite'
import { FileSignature } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { CONTRACT_QUESTIONS } from './collaboration-story-data'
import { Questionnaire, type QuestionnaireProps } from './questionnaire'
import type { QuestionAnswer, QuestionDefinition } from './questionnaire-logic'
import { ExampleProvider, expectContentDirection, PhoneFrame, StoryProvider } from './story-frames'

/** A questionnaire in a card, with the submitted answers written under it (the application's part). */
function Contract(props: Partial<QuestionnaireProps> & { delay?: number }) {
  const [submitted, setSubmitted] = useState<Record<string, QuestionAnswer> | null>(null)
  const { delay, ...rest } = props
  return (
    <div className="flex max-w-160 flex-col gap-4">
      <div className="rounded-lg border border-solid border-default bg-surface-raised p-6">
        <Questionnaire
          label="Employment contract"
          questions={CONTRACT_QUESTIONS}
          submitLabel="Generate contract"
          submitIcon={FileSignature}
          onSubmit={(answers) => {
            if (delay === undefined) {
              setSubmitted(answers)
              return
            }
            return new Promise<void>((resolve) => {
              setTimeout(() => {
                setSubmitted(answers)
                resolve()
              }, delay)
            })
          }}
          {...rest}
        />
      </div>
      {submitted !== null && (
        <output className="text-xs text-secondary">
          Submitted: {Object.keys(submitted).join(', ')}
        </output>
      )}
    </div>
  )
}

const meta = {
  title: 'Components/Collaboration/Questionnaire',
  component: Questionnaire,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** questions one at a time, where the next question depends on the answer ' +
          '— guided document generation (an employment contract), the questions of an agent ' +
          '(AgentQuestion), a guided form. Questions, branches, checks and what happens with the ' +
          "answers are the application's; the component decides nothing about the content.\n\n" +
          '**Branching:** an option may name the next question, a question has a default next, ' +
          '`null` ends. **Answer types:** single and multiple choice (with "Other" and its own ' +
          'text), date, number, amount, short text. **Back** keeps every answer; answers on a ' +
          'branch no longer taken are kept (they return with the branch) but only the current ' +
          'path is submitted. **Summary:** every answer with a pencil to change it; Next then ' +
          'returns to the summary, unless the change opened new questions. **Progress:** "3 of 7 ' +
          'answered" with a bar. **Keys:** Enter goes on, the number keys choose options when not ' +
          'typing.\n\n' +
          '**When:** a guided path through a decision of more than two or three questions. ' +
          '**When not:** a form whose fields are all known in advance (FormSection, FormWizard ' +
          'for long multi-step forms); one yes/no question (ConfirmDialog).',
      },
    },
  },
  args: { questions: CONTRACT_QUESTIONS, onSubmit: () => undefined },
  render: () => (
    <ExampleProvider>
      <Contract />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof Questionnaire>

export default meta

type Story = StoryObj<typeof meta>

/** The first question: progress, the options with their number keys, Next. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('0 of 6 answered')).toBeVisible()
    await expect(canvas.getByRole('group', { name: 'What type of contract?' })).toBeVisible()
    await expect(canvas.getByRole('radio', { name: /Fixed term/ })).not.toBeChecked()
    await expect(canvas.queryByRole('button', { name: 'Back' })).toBeNull()
    await settle()
  },
}

/**
 * The whole path from the keyboard: number keys choose, Enter goes on (also from a typed date or
 * amount), "Other" moves into its text, the summary lists every answer.
 */
export const Keyboard: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.tab()
    await userEvent.keyboard('2')
    await expect(canvas.getByRole('radio', { name: /Fixed term/ })).toBeChecked()
    await expect(canvas.getByText('1 of 6 answered')).toBeVisible()
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByRole('group', { name: 'When does it end?' })).toHaveFocus()
    await userEvent.tab()
    await userEvent.keyboard('31.12.2027{Enter}')
    await expect(canvas.getByRole('group', { name: 'Why a fixed term?' })).toHaveFocus()
    await userEvent.keyboard('3')
    const reason = canvas.getByRole('textbox', { name: /Reason/ })
    await waitFor(() => expect(reason).toHaveFocus())
    await userEvent.keyboard('Seasonal work{Enter}')
    await userEvent.tab()
    await userEvent.keyboard('02.11.2026{Enter}')
    await expect(canvas.getByRole('group', { name: 'Where will the employee work?' })).toHaveFocus()
    await userEvent.keyboard('3{Enter}')
    await userEvent.tab()
    await userEvent.keyboard('3{Enter}')
    await userEvent.tab()
    await userEvent.keyboard('185000{Enter}')
    const summary = await canvas.findByRole('heading', { name: 'Check your answers' })
    await expect(summary).toHaveFocus()
    await expect(canvas.getByText('7 of 7 answered')).toBeVisible()
    await expect(canvas.getByText('Seasonal work')).toBeVisible()
    await expect(canvas.getByText('31.12.2027.')).toBeVisible()
    await expect(canvas.getByText('185.000,00 RSD')).toBeVisible()
    await settle()
  },
}

/**
 * Change from the summary: the place of work becomes the office, so "office days" leaves the path
 * — kept, but not submitted; Next returns to the summary.
 */
export const ChangeFromSummary: Story = {
  name: 'Change from the summary',
  render: () => (
    <ExampleProvider>
      <Contract
        defaultAnswers={{
          type: { value: 'indefinite' },
          start: { value: '2026-11-02' },
          place: { value: 'hybrid' },
          days: { value: '3' },
          salary: { value: '185000.00' },
          end: { value: '2027-12-31' },
        }}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    // Go to the summary from the start: every answer is there.
    for (let step = 0; step < 5; step += 1) {
      await userEvent.click(canvas.getByRole('button', { name: /Next|Review answers/ }))
    }
    await canvas.findByRole('heading', { name: 'Check your answers' })
    await expect(canvas.getByText('How many office days per week?')).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', { name: 'Change Where will the employee work?' }),
    )
    await userEvent.click(canvas.getByRole('radio', { name: 'Office, Novi Sad' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Review answers' }))
    await canvas.findByRole('heading', { name: 'Check your answers' })
    await expect(canvas.queryByText('How many office days per week?')).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Generate contract' }))
    await expect(canvas.getByText('Submitted: type, start, place, salary')).toBeVisible()
    await settle()
  },
}

/** Back keeps the answers: the fixed-term branch's end date returns with the branch. */
export const BackKeepsAnswers: Story = {
  name: 'Back keeps answers',
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('radio', { name: /Fixed term/ }))
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    const end = canvas.getByRole('textbox', { name: 'When does it end?' })
    await userEvent.type(end, '31.12.2027')
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Back' }))
    await userEvent.click(canvas.getByRole('radio', { name: 'Indefinite term' }))
    await expect(canvas.getByText('1 of 4 answered')).toBeVisible()
    await userEvent.click(canvas.getByRole('radio', { name: /Fixed term/ }))
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await expect(canvas.getByRole('textbox', { name: 'When does it end?' })).toHaveValue(
      '31.12.2027.',
    )
    await settle()
  },
}

/** Required answers, "Other" without its text, and the application's own check. */
export const Validation: Story = {
  render: () => (
    <ExampleProvider>
      <Contract
        defaultAnswers={{ type: { value: 'fixed' }, end: { value: '2026-09-30' } }}
        validate={(question, answer) =>
          question.id === 'end' && typeof answer?.value === 'string' && answer.value <= '2026-10-06'
            ? 'The end date must be after today.'
            : undefined
        }
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    // The application's check.
    await expect(canvas.getByText('The end date must be after today.')).toBeVisible()
    const end = canvas.getByRole('textbox', { name: 'When does it end?' })
    await expect(end).toHaveFocus()
    await userEvent.clear(end)
    await userEvent.type(end, '31.12.2027')
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    // Required.
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await expect(canvas.getByText('Answer this question to go on.')).toBeVisible()
    await expect(canvas.getByRole('group', { name: 'Why a fixed term?' })).toHaveAttribute(
      'aria-invalid',
      'true',
    )
    // "Other" without its text.
    await userEvent.click(canvas.getByRole('radio', { name: 'Other reason' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await expect(canvas.getByText('Write your own answer to go on.')).toBeVisible()
    await settle()
  },
}

const AGENT_QUESTION: QuestionDefinition[] = [
  {
    id: 'date',
    title: 'When will Medic Lab Niš pay the rest?',
    type: 'date',
    next: null,
  },
]

/** One question without a summary: the button submits (an agent's short question). */
export const WithoutSummary: Story = {
  name: 'Without summary',
  render: () => (
    <ExampleProvider>
      <Contract questions={AGENT_QUESTION} summary={false} submitLabel="Answer" delay={600} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('textbox'), '20.10.2026{Enter}')
    // Submitting: a spinner, the button waits.
    await expect(canvas.getByRole('button', { name: 'Answer' })).toBeDisabled()
    await expect(canvas.getByRole('status')).toBeInTheDocument()
    await waitFor(() => expect(canvas.getByText('Submitted: date')).toBeVisible())
    await settle()
  },
}

const ALL_TYPES: QuestionDefinition[] = [
  {
    id: 'equipment',
    title: 'Which equipment does the employee need?',
    description: 'Choose all that apply.',
    type: 'multiple',
    options: [
      { value: 'laptop', label: 'Laptop' },
      { value: 'phone', label: 'Company phone' },
      { value: 'car', label: 'Company car', disabled: true, description: 'Not available in 2026' },
      { value: 'other', label: 'Other equipment', other: true },
    ],
    otherLabel: 'Equipment',
  },
  {
    id: 'note',
    title: 'A note for the contract',
    type: 'text',
    required: false,
    placeholder: 'Optional',
  },
  {
    id: 'leave',
    title: 'Annual leave days',
    type: 'number',
    decimals: 0,
    fieldLabel: 'Annual leave days',
    next: null,
  },
]

/** Several choices (one unavailable), an optional text, a number; the summary shows "Not answered". */
export const AnswerTypes: Story = {
  name: 'Answer types',
  render: () => (
    <ExampleProvider>
      <Contract questions={ALL_TYPES} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('checkbox', { name: /Company car/ })).toBeDisabled()
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Laptop' }))
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Company phone' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await userEvent.type(canvas.getByRole('textbox', { name: 'Annual leave days' }), '21')
    await userEvent.click(canvas.getByRole('button', { name: 'Review answers' }))
    await expect(canvas.getByText('Laptop, Company phone')).toBeVisible()
    await expect(canvas.getByText('Not answered')).toBeVisible()
    await settle()
  },
}

const LONG_QUESTIONS: QuestionDefinition[] = [
  {
    id: 'long',
    title:
      'Where will the employee work most of the time, counting the construction sites the company runs in Vojvodina?',
    description:
      'The place of work is written into the contract and decides travel allowances; a change later needs an annex.',
    type: 'single',
    options: [
      {
        value: 'office',
        label: 'Office of Kvadrat Gradnja d.o.o., Bulevar oslobođenja 102, 21000 Novi Sad',
        description: 'Including occasional visits to the sites',
      },
      { value: 'sites', label: 'Construction sites, as assigned by the site manager every week' },
    ],
    next: null,
  },
]

/** Long questions and options in a phone frame: they wrap; nothing overflows. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <Questionnaire questions={LONG_QUESTIONS} onSubmit={() => undefined} />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    const form = canvasElement.querySelector('form')
    if (form === null) throw new Error('No form')
    await expect(form.scrollWidth).toBeLessThanOrEqual(form.clientWidth)
    await settle()
  },
}

/** Arabic questions, right to left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <Questionnaire
        onSubmit={() => undefined}
        questions={[
          {
            id: 'type',
            title: 'ما نوع العقد؟',
            type: 'single',
            options: [
              { value: 'indefinite', label: 'غير محدد المدة' },
              { value: 'fixed', label: 'محدد المدة' },
            ],
            next: null,
          },
        ]}
      />
    </StoryProvider>
  ),
}

/** Japanese questions. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <Questionnaire
        onSubmit={() => undefined}
        questions={[
          {
            id: 'type',
            title: '契約の種類は？',
            type: 'single',
            options: [
              { value: 'indefinite', label: '無期雇用' },
              { value: 'fixed', label: '有期雇用' },
            ],
            next: null,
          },
        ]}
      />
    </StoryProvider>
  ),
}

/** English in a right-to-left page: the question and options keep their word order. */
export const EnglishInRtl: Story = {
  name: 'English in RTL',
  render: () => (
    <StoryProvider locale="ar">
      <Questionnaire questions={CONTRACT_QUESTIONS} onSubmit={() => undefined} />
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expectContentDirection(canvas.getByText('What type of contract?'))
  },
}
