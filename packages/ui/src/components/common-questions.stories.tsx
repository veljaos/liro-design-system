import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { CommonQuestions, type CommonQuestion } from './common-questions'
import {
  ARABIC_CATEGORIES,
  ARABIC_QUESTIONS,
  JAPANESE_CATEGORIES,
  JAPANESE_QUESTIONS,
  QUESTION_CATEGORIES,
  QUESTIONS,
} from './common-questions-story-data'
import { EmptyState } from './empty-state'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const startRequest = fn()

/** The questions with the requests the application has for them. */
const WITH_REQUESTS: CommonQuestion[] = QUESTIONS.map((question) =>
  question.id === 'address'
    ? { ...question, action: { label: 'Report a change of address', onSelect: startRequest } }
    : question.id === 'account'
      ? { ...question, action: { label: 'Change the salary account', onSelect: startRequest } }
      : question.id === 'sick'
        ? { ...question, action: { label: 'Request sick leave', onSelect: startRequest } }
        : question,
)

const meta = {
  title: 'Components/Help/CommonQuestions',
  component: CommonQuestions,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the questions the people of a portal keep asking — an employee ("I ' +
          'changed my ID card. Do I have to tell my employer?"), a patient, a tenant, a client — ' +
          'each as a card: the situation, the short answer, and when pressed what to do, the ' +
          'documents needed and, where the application has one, the button that starts that ' +
          'request filled in ("Report a change of address"). A search over the words given and ' +
          'category chips narrow the list (the count is said); `limit` shows a home page’s top ' +
          'questions beside the application’s "All questions". Every question, answer, document ' +
          'and order is the application’s.\n\n' +
          '**When to use:** a portal’s home (three to five) and its questions page (all, with ' +
          'search and categories). **When not:** long articles to read (a knowledge base: ' +
          'CategoryGrid and SearchResultList); a form that asks the user (Questionnaire); a ' +
          'record’s own facts (KeyValueList).',
      },
    },
  },
  args: { label: 'Common questions', questions: WITH_REQUESTS },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <div className="max-w-3xl">
          <Story />
        </div>
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof CommonQuestions>

export default meta

type Story = StoryObj<typeof meta>

/** The questions page: search, categories and every question, closed. */
export const Default: Story = {
  args: { search: true, categories: QUESTION_CATEGORIES, headingLevel: 2 },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const list = canvas.getByRole('list', { name: 'Common questions' })
    await expect(within(list).getAllByRole('listitem')).toHaveLength(8)
    await expect(canvas.getByRole('button', { name: 'All' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(
      canvas.getByRole('button', { name: 'What do I need to change my address?' }),
    ).toHaveAccessibleDescription(
      'A change request with proof of the new address. HR updates it within two days.',
    )
  },
}

/** One card open: what to do, what you need, and the request that does it. */
export const Opened: Story = {
  name: 'One open',
  args: { defaultOpen: ['address'] },
}

/** A portal's home: the top three, without tools (the application links "All questions"). */
export const Home: Story = {
  name: 'Top questions',
  args: { limit: 3 },
}

/** Skeleton cards while the questions load. */
export const Loading: Story = {
  args: { loading: true, search: true },
}

/** No questions yet: the application's empty state. */
export const Empty: Story = {
  args: {
    questions: [],
    empty: (
      <EmptyState
        compact
        title="No questions yet"
        description="HR adds the questions people ask most often here."
      />
    ),
  },
}

/** A search that finds nothing: the no-results state with "Clear the search". */
export const NothingFound: Story = {
  name: 'Nothing found',
  args: { search: true, categories: QUESTION_CATEGORIES, defaultQuery: 'parking permit' },
}

/** A long question, answer, step and document wrap inside the card. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    defaultOpen: ['long'],
    questions: [
      {
        id: 'long',
        question:
          'I moved to another city in the middle of the month, changed my ID card and my bank account at the same time, and my child started school there — what do I have to report, to whom, and by when?',
        answer:
          'Report the address and the account in one change request each; the tax relief for the child stays as it is unless the child’s school certificate is asked for by HR in writing.',
        steps: [
          'Send a change request for the address with the residence certificate RS-2026-0000000000147258 (illustrative).',
          'Send a change request for the account before the 25th.',
        ],
        documents: [
          'Residence certificate issued by the police administration of the new municipality, not older than six months',
        ],
        action: { label: 'Report a change of address', onSelect: startRequest },
      },
      ...WITH_REQUESTS.slice(0, 2),
    ],
  },
}

/** Phone width: one column, the chips wrap, the cards take the page's width. */
export const Phone: Story = {
  args: { search: true, categories: QUESTION_CATEGORIES, defaultOpen: ['address'] },
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
    label: 'أسئلة شائعة',
    questions: ARABIC_QUESTIONS,
    categories: ARABIC_CATEGORIES,
    defaultOpen: ['address'],
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
    label: 'よくある質問',
    questions: JAPANESE_QUESTIONS,
    categories: JAPANESE_CATEGORIES,
    defaultOpen: ['address'],
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

/**
 * Search, a category, open a card and start its request: the count is said, the card opens in
 * place, the request is the application's.
 */
export const SearchInteraction: Story = {
  name: 'Search, open and start, interaction',
  tags: ['interaction'],
  args: { search: true, categories: QUESTION_CATEGORIES },
  render: function Render(args) {
    const [started, setStarted] = useState<string | null>(null)
    return (
      <div className="flex flex-col gap-3">
        <CommonQuestions
          {...args}
          questions={WITH_REQUESTS.map((question) =>
            question.action === undefined
              ? question
              : {
                  ...question,
                  action: {
                    label: question.action.label,
                    onSelect: () => {
                      setStarted(question.action?.label ?? '')
                    },
                  },
                },
          )}
        />
        {started !== null && (
          <p className="bidi-content m-0 text-sm text-primary">Started: {started}</p>
        )}
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search questions' }), 'adresa')
    await expect(await canvas.findByText('No questions found')).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Clear the search' }))
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search questions' }), 'address')
    await expect(canvas.getByRole('status')).toHaveTextContent('2 questions')
    await userEvent.click(canvas.getByRole('button', { name: 'Pay' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('No questions found')
    await userEvent.click(canvas.getByRole('button', { name: 'Personal data' }))
    const card = canvas.getByRole('button', { name: 'What do I need to change my address?' })
    await expect(card).toHaveAttribute('aria-expanded', 'false')
    await userEvent.click(card)
    await expect(card).toHaveAttribute('aria-expanded', 'true')
    const region = canvas.getByRole('region', { name: 'What do I need to change my address?' })
    await expect(within(region).getByText('What you need')).toBeVisible()
    await userEvent.click(
      within(region).getByRole('button', { name: 'Report a change of address' }),
    )
    await expect(canvas.getByText('Started: Report a change of address')).toBeVisible()
    await settle()
  },
}
