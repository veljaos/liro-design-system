import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { CodeHighlighting } from '../code'
import { settle } from '../primitives/story-helpers'
import { CodeBlock } from './code-block'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'
import { ChainOfThought, Plan, Queue, Reasoning, Sources, Subagent, Task, Trace } from './trace'
import {
  CLOSE_PLAN,
  MATCH_QUEUE,
  MATCHED_STEPS,
  MATCHING_STEPS,
  overdueReasonSteps,
  RECORD_SOURCES,
  SUBAGENT_STEPS,
} from './trace-story-data'

const THINKING =
  'The user asks which payments on statement 188 are not matched yet. I should read the statement, then compare each line with the open invoices of its payer, by reference first and by amount after.'

function Frame({ children, width = '28rem' }: { children: ReactNode; width?: string }) {
  return (
    <ExampleProvider>
      <CodeHighlighting>
        <div className="flex flex-col gap-0.5 p-4" style={{ maxWidth: width }}>
          {children}
        </div>
      </CodeHighlighting>
    </ExampleProvider>
  )
}

/** Everything closed: one calm line each. */
function Work() {
  return (
    <>
      <Reasoning status="done" duration="4 s">
        <p className="m-0">{THINKING}</p>
      </Reasoning>
      <Plan title="Close September" steps={CLOSE_PLAN} />
      <Task title="Matched bank statement 188" steps={MATCHED_STEPS} />
      <Subagent
        name="Bank matcher"
        title="Matched 38 of 42 statement lines"
        duration="42 s"
        steps={SUBAGENT_STEPS}
        result="38 matches are ready for your approval; 4 lines need you."
      />
      <Queue title="Statement lines to match" items={MATCH_QUEUE} />
      <ChainOfThought
        title="Found why invoice F-2026-0398 was rejected"
        steps={overdueReasonSteps()}
      />
      <Sources items={RECORD_SOURCES} />
    </>
  )
}

const meta = {
  title: 'Components/Assistant/Trace',
  component: Trace,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the work an assistant does, shown as calm rows — one pattern: an icon, a ' +
          'one-line title in the application’s words, an optional description and a status (done; ' +
          'running — the title shimmers, a spinner with reduced motion; not started; failed in ' +
          'words), opening into its detail or its steps. Built on it: **Reasoning** ("Thinking…" → ' +
          '"Thought for 4 s", open while thinking, closed when done unless the user toggled it), ' +
          '**ChainOfThought** (a summary that opens into steps), **Plan** ("2 of 5 done"), ' +
          '**Queue** (to do / completed), **Task** (steps as they happen), **Subagent** (a ' +
          'handed-off run with its steps, duration and result) and **Sources** ("Used 4 records", ' +
          'links through the provider’s link component, duplicates removed, external ones marked ' +
          'as opening a new tab). Each is one line until opened; changes of status are announced ' +
          'politely, once. Nothing here calls a model: the steps and words are the application’s. ' +
          'Sensitive values go in a step’s detail as a MaskedValue; tool output as a CodeBlock.\n\n' +
          '**When to use:** inside AssistantAnswer’s `work` (and so in AssistantPanel), on an ' +
          'agent’s run page. **When not:** a long job with a known count (JobProgress); a ' +
          'process’s states in order (StatusTimeline); a record’s history (HistoryList).',
      },
    },
  },
  args: { steps: MATCHING_STEPS, label: 'Steps' },
  render: () => (
    <Frame>
      <Work />
    </Frame>
  ),
  play: settle,
} satisfies Meta<typeof Trace>

export default meta

type Story = StoryObj<typeof meta>

/** The assistant's work after an answer: every pattern closed to one line. */
export const Default: Story = {
  name: 'The assistant’s work',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Thought for 4 s' })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    await expect(canvas.getByText('2 of 5 done')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Used 4 records' })).toBeVisible()
  },
}

/** Opened: the steps, a tool's output as a CodeBlock, a sensitive value masked, the links. */
export const Opened: Story = {
  render: () => (
    <Frame width="34rem">
      <ChainOfThought
        title="Found why invoice F-2026-0398 was rejected"
        steps={overdueReasonSteps().map((step) =>
          step.id === 'sef' || step.id === 'iban' ? { ...step, defaultOpen: true } : step,
        )}
        defaultOpen
      />
      <Sources items={RECORD_SOURCES} defaultOpen />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await waitFor(async () => {
      await expect(canvasElement.querySelector('[data-slot="code-block"]')).toHaveAttribute(
        'data-ready',
        'true',
      )
    })
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('region', { name: 'SEF response' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show bank account' })).toBeVisible()
    await expect(
      canvas.getByRole('link', { name: 'NBS middle exchange rate list (opens in a new tab)' }),
    ).toHaveAttribute('target', '_blank')
  },
}

/** While working: thinking, a task running with its steps open, a plan in progress. */
export const Working: Story = {
  name: 'While working',
  render: () => (
    <Frame>
      <Reasoning status="running">
        <p className="m-0">{THINKING}</p>
      </Reasoning>
      <Task title="Matching bank statement 188" description="31 of 42" steps={MATCHING_STEPS} />
      <Plan title="Close September" steps={CLOSE_PLAN} />
    </Frame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Thinking…, In progress' })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
    await expect(canvas.getByText('Check the payments without a reference')).toBeVisible()
  },
}

/** A failure in words: the step that failed, and the summary over it. */
export const Failed: Story = {
  render: () => (
    <Frame>
      <Task
        title="Could not finish matching statement 188"
        status="error"
        defaultOpen
        steps={[
          MATCHING_STEPS[0] ?? { id: 'read', title: 'Read bank statement 188' },
          {
            id: 'match',
            title: 'Could not read the open invoices: the ledger did not answer',
            status: 'error',
            detail: (
              <CodeBlock
                code={'GET /ledger/open-items?customer=all\n→ 504 Gateway Timeout after 30 s'}
                title="Request"
                size="sm"
                tone="danger"
                wrap
              />
            ),
            defaultOpen: true,
          },
          { id: 'propose', title: 'Propose the matches for your approval', status: 'pending' },
        ]}
      />
      <Subagent name="Bank matcher" title="Stopped after 12 s" status="error" duration="12 s" />
    </Frame>
  ),
}

/** The generic rows: nested steps, a link, a step with detail. */
export const Rows: Story = {
  name: 'Trace rows',
  render: (args) => (
    <Frame>
      <Trace
        {...args}
        steps={[
          ...MATCHING_STEPS.slice(0, 2),
          {
            id: 'match',
            title: 'Matched 38 payments to invoices',
            description: '38 of 42',
            defaultOpen: true,
            steps: SUBAGENT_STEPS,
          },
          ...MATCHING_STEPS.slice(3),
        ]}
      />
    </Frame>
  ),
}

/** Phone width: the rows wrap, nothing scrolls sideways. */
export const Phone: Story = {
  tags: ['!dev'],
  render: () => (
    <PhoneFrame>
      <Frame width="100%">
        <Work />
        <Sources items={RECORD_SOURCES} defaultOpen />
      </Frame>
    </PhoneFrame>
  ),
}

/** Long titles wrap under their icon; long descriptions follow them. */
export const LongText: Story = {
  name: 'Long text',
  tags: ['!dev'],
  render: () => (
    <Frame width="22rem">
      <Task
        title="Matched every payment of the September statements of all three bank accounts to the open invoices of the customers, including partly paid ones"
        description="38 of 42 lines, 4 need a decision"
        defaultOpen
        steps={[
          {
            id: 'long',
            title:
              'Read the reference 97 1234567890123456789012345678901234567890 that has no spaces',
          },
        ]}
      />
    </Frame>
  ),
}

/** Arabic: rows right to left, the chevron and arrows mirrored. */
export const Arabic: Story = {
  tags: ['!dev'],
  render: () => (
    <StoryProvider locale="ar">
      <Frame>
        <Reasoning status="done" duration="٤ ث" title="فكّر لمدة ٤ ثوانٍ" />
        <Task
          title="طابق كشف الحساب ١٨٨"
          defaultOpen
          steps={[
            { id: '1', title: 'قرأ كشف الحساب ١٨٨', description: '٤٢ سطرًا' },
            { id: '2', title: 'يطابق المدفوعات مع الفواتير', status: 'running' },
            { id: '3', title: 'اقترح المطابقات للموافقة', status: 'pending' },
          ]}
        />
        <Sources
          title="استخدم سجلين"
          defaultOpen
          items={[
            { id: 'a', label: 'الفاتورة F-2026-0412', href: '#/sales/invoices/F-2026-0412' },
            { id: 'b', label: 'سعر الصرف', href: 'https://www.nbs.rs/en/' },
          ]}
        />
      </Frame>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  tags: ['!dev'],
  render: () => (
    <StoryProvider locale="ja">
      <Frame>
        <Reasoning status="done" title="4秒間考えました" />
        <Plan
          title="9月の締め処理"
          defaultOpen
          steps={[
            { id: '1', title: '銀行明細を照合しました' },
            { id: '2', title: '減価償却を計上しています', status: 'running' },
            { id: '3', title: '試算表を作成する', status: 'pending' },
          ]}
        />
      </Frame>
    </StoryProvider>
  ),
}

/** Reasoning that finishes: it closes itself and says "Thought for 4 s" — unless toggled. */
function Finishing() {
  const [done, setDone] = useState(false)
  return (
    <Frame>
      <Reasoning status={done ? 'done' : 'running'} {...(done ? { duration: '4 s' } : {})}>
        <p className="m-0">{THINKING}</p>
      </Reasoning>
      <Task
        title={done ? 'Matched bank statement 188' : 'Matching bank statement 188'}
        steps={done ? MATCHED_STEPS : MATCHING_STEPS}
      />
      <button
        type="button"
        onClick={() => {
          setDone(true)
        }}
      >
        Finish
      </button>
    </Frame>
  )
}

export const FinishInteraction: Story = {
  name: 'Finishing, interaction',
  tags: ['interaction', '!dev'],
  render: () => <Finishing />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const thinking = canvas.getByRole('button', { name: 'Thinking…, In progress' })
    await expect(thinking).toHaveAttribute('aria-expanded', 'true')
    const task = canvas.getByRole('button', { name: 'Matching bank statement 188, In progress' })
    // The user closes the task: it stays as they left it.
    await userEvent.click(task)
    await expect(task).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(canvas.getByRole('button', { name: 'Finish' }))
    const thought = canvas.getByRole('button', { name: 'Thought for 4 s' })
    await waitFor(() => expect(thought).toHaveAttribute('aria-expanded', 'false'))
    await expect(
      canvas.getAllByRole('status').some((status) => status.textContent === 'Thought for 4 s'),
    ).toBe(true)
    await expect(
      canvas.getByRole('button', { name: 'Matched bank statement 188' }),
    ).toHaveAttribute('aria-expanded', 'false')
  },
}

/** The keyboard: Tab to a row, Enter or Space opens and closes it. */
export const KeyboardInteraction: Story = {
  name: 'Keyboard, interaction',
  tags: ['interaction', '!dev'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.tab()
    const reasoning = canvas.getByRole('button', { name: 'Thought for 4 s' })
    await expect(reasoning).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(reasoning).toHaveAttribute('aria-expanded', 'true')
    await userEvent.keyboard(' ')
    await expect(reasoning).toHaveAttribute('aria-expanded', 'false')
  },
}
