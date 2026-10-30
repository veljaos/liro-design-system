import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import type { CommonQuestion } from './common-questions'
import {
  ARABIC_CATEGORIES,
  ARABIC_QUESTIONS,
  JAPANESE_CATEGORIES,
  JAPANESE_QUESTIONS,
  QUESTIONS,
} from './common-questions-story-data'
import { EmptyState } from './empty-state'
import { AnswerView, QuestionsAndAnswers } from './questions-and-answers'
import { QA_CATEGORIES, QA_QUESTIONS } from './questions-and-answers-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const startRequest = fn()
const ask = fn()

/** The eight most asked questions first, then 320 more: 328 in all. */
const ALL: CommonQuestion[] = [...QUESTIONS, ...QA_QUESTIONS]

/** The address of a question's answer page in these stories. */
const answerHref = (question: CommonQuestion) => `#/questions/${question.id}`

/** A question for the stories' lookups that find nothing (they always find one). */
const FALLBACK: CommonQuestion = { id: 'none', question: '—', answer: '—' }

const BACK = { href: '#/questions', label: 'Questions and answers' }

/** One answer with the request that does it. */
const ADDRESS: CommonQuestion = {
  ...(QUESTIONS.find((question) => question.id === 'address') ?? FALLBACK),
  action: { label: 'Report a change of address', onSelect: startRequest },
}

const meta = {
  title: 'Components/Help/QuestionsAndAnswers',
  component: QuestionsAndAnswers,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** every question of a portal on a page of its own — an employee’s, a ' +
          'patient’s, a tenant’s, a client’s — when there are many (300 and more). One search ' +
          'field first: it filters as you type over the questions, answers, documents and ' +
          'keywords (case and accents ignored, "dj" finds "đ") and marks the words found. The ' +
          'categories as chips with their counts, "All" first. Each question is a link to its own ' +
          'answer page (`answerHref`, through the provider’s `linkComponent`); the whole row is ' +
          'the target and nothing is underlined. 30 at a time, then "Show more". Nothing found: ' +
          'the application’s `askAction` ("Ask HR") with the words typed.\n\n' +
          '`AnswerView` is that answer’s page: the question as the title with the way back, the ' +
          'answer, "What to do", "What you need" and the application’s request that does it, ' +
          'started filled in (the page’s main action).\n\n' +
          '**When to use:** a portal’s questions page, and each answer’s page. **When not:** a ' +
          'home page’s top three to five (CommonQuestions with `limit`, opened in place); long ' +
          'articles (a knowledge base: CategoryGrid and SearchResultList, searched on the ' +
          'server); a form that asks the user (Questionnaire).',
      },
    },
  },
  args: { label: 'Questions and answers', questions: ALL, answerHref, categories: QA_CATEGORIES },
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
} satisfies Meta<typeof QuestionsAndAnswers>

export default meta

type Story = StoryObj<typeof meta>

/** 328 questions: the search, the categories with their counts, the first 30 and "Show more". */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const list = canvas.getByRole('list', { name: 'Questions and answers' })
    await expect(within(list).getAllByRole('listitem')).toHaveLength(30)
    await expect(canvas.getByRole('button', { name: 'All 328' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
    await expect(canvas.getByRole('button', { name: 'Leave 34' })).toBeVisible()
    await expect(
      canvas.getByRole('link', { name: 'What do I need to change my address?' }),
    ).toHaveAttribute('href', '#/questions/address')
    await expect(canvas.getByRole('button', { name: 'Show more (30 of 328 shown)' })).toBeVisible()
  },
}

/** One category chosen: only its questions, without the category over each. */
export const CategoryChosen: Story = {
  name: 'A category chosen',
  args: { defaultCategory: 'leave' },
}

/** Searching: the count is said and the words found are marked in questions and answers. */
export const Searching: Story = {
  args: { defaultQuery: 'annual leave' },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('status')).toHaveTextContent('12 questions')
    await expect(canvasElement.querySelector('[data-slot="search-match"]')).not.toBeNull()
  },
}

/** Nothing found: the no-results state and the application's way to ask. */
export const NothingFound: Story = {
  name: 'Nothing found',
  args: {
    defaultQuery: 'parking permit',
    askAction: { label: 'Ask HR', onSelect: ask },
  },
}

/** Skeleton rows while the questions load. */
export const Loading: Story = {
  args: { loading: true },
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

/** A long question and answer wrap inside their row. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    categories: [],
    questions: [
      {
        id: 'long',
        question:
          'I moved to another city in the middle of the month, changed my ID card and my bank account at the same time, and my child started school there — what do I have to report, to whom, and by when?',
        answer:
          'Report the address and the account in one change request each, with RS35105008123123123173 (illustrative) as the new account; the tax relief for the child stays as it is unless HR asks for the school certificate in writing.',
      },
      ...ALL.slice(0, 2),
    ],
  },
}

/** Phone width: the chips wrap, the rows take the page's width. */
export const Phone: Story = {
  args: { defaultCategory: 'pay' },
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
    label: 'الأسئلة والأجوبة',
    questions: ARABIC_QUESTIONS,
    categories: ARABIC_CATEGORIES,
    searchLabel: 'ابحث في الأسئلة',
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
    label: '質問と回答',
    questions: JAPANESE_QUESTIONS,
    categories: JAPANESE_CATEGORIES,
    searchLabel: '質問を検索',
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

/** One answer on its own page: the question as the title, then what to do and what you need. */
export const Answer: Story = {
  name: 'An answer',
  render: () => <AnswerView question={ADDRESS} back={BACK} categories={QA_CATEGORIES} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'What do I need to change my address?' }),
    ).toBeVisible()
    await expect(canvas.getByRole('heading', { level: 2, name: 'What you need' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Report a change of address' })).toBeVisible()
    await expect(
      canvas.getAllByRole('link', { name: 'Back to Questions and answers' }),
    ).toHaveLength(2)
  },
}

/** An answer without steps, documents or a request: the answer alone. */
export const AnswerOnly: Story = {
  name: 'An answer alone',
  render: () => (
    <AnswerView
      question={QA_QUESTIONS.find((question) => question.id.endsWith('-who')) ?? ADDRESS}
      back={BACK}
      categories={QA_CATEGORIES}
    />
  ),
}

/** A long answer: every part wraps inside the card. */
export const AnswerLongText: Story = {
  name: 'An answer, long text',
  render: () => (
    <AnswerView
      back={BACK}
      categories={QA_CATEGORIES}
      question={{
        id: 'long',
        category: 'personal',
        question:
          'I moved to another city in the middle of the month, changed my ID card and my bank account at the same time — what do I have to report, to whom, and by when?',
        answer:
          'Report the address and the account in one change request each, with RS35105008123123123173 (illustrative) as the new account; HR updates both within two working days.',
        steps: [
          'Send a change request for the address with the residence certificate RS-2026-0000000000147258 (illustrative).',
          'Send a change request for the account before the 25th.',
        ],
        documents: [
          'Residence certificate issued by the police administration of the new municipality, not older than six months',
        ],
        action: { label: 'Report a change of address', onSelect: startRequest },
      }}
    />
  ),
}

/** An answer at phone width: the card takes the page's width. */
export const AnswerPhone: Story = {
  name: 'An answer, phone',
  render: () => <AnswerView question={ADDRESS} back={BACK} categories={QA_CATEGORIES} />,
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

/** An answer in Arabic. */
export const AnswerArabic: Story = {
  name: 'An answer, Arabic',
  render: () => (
    <AnswerView
      question={{
        ...(ARABIC_QUESTIONS[0] ?? FALLBACK),
        action: { label: 'أبلغ عن تغيير العنوان', onSelect: startRequest },
      }}
      back={{ href: '#/questions', label: 'الأسئلة والأجوبة' }}
      categories={ARABIC_CATEGORIES}
    />
  ),
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

/** An answer in Japanese. */
export const AnswerJapanese: Story = {
  name: 'An answer, Japanese',
  render: () => (
    <AnswerView
      question={JAPANESE_QUESTIONS[0] ?? FALLBACK}
      back={{ href: '#/questions', label: '質問と回答' }}
      categories={JAPANESE_CATEGORIES}
    />
  ),
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
 * Type a search (accents ignored: "godisnji" finds "godišnji"), choose a category, show more
 * (the focus goes to the first new question), nothing found and "Ask HR" with the words typed.
 */
export const SearchInteraction: Story = {
  name: 'Search, show more and ask, interaction',
  tags: ['interaction'],
  render: function Render(args) {
    const [asked, setAsked] = useState<string | null>(null)
    return (
      <div className="flex flex-col gap-3">
        <QuestionsAndAnswers
          {...args}
          askAction={{
            label: 'Ask HR',
            onSelect: (query) => {
              setAsked(query)
            },
          }}
        />
        {asked !== null && <p className="bidi-content m-0 text-sm text-primary">Asked: {asked}</p>}
      </div>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const search = canvas.getByRole('searchbox', { name: 'Search questions' })
    await userEvent.type(search, 'godisnji')
    await expect(canvas.getByRole('status')).toHaveTextContent('8 questions')
    await userEvent.clear(search)
    await userEvent.click(canvas.getByRole('button', { name: 'Pay 34' }))
    await expect(canvas.getByRole('status')).toHaveTextContent('34 questions')
    await userEvent.click(canvas.getByRole('button', { name: 'Show more (30 of 34 shown)' }))
    const list = canvas.getByRole('list', { name: 'Questions and answers' })
    const links = within(list).getAllByRole('link')
    await expect(links).toHaveLength(34)
    await expect(links[30]).toHaveFocus()
    await userEvent.type(search, 'parking permit')
    await expect(canvas.getByRole('status')).toHaveTextContent('No questions found')
    await userEvent.click(canvas.getByRole('button', { name: 'Ask HR' }))
    await expect(canvas.getByText('Asked: parking permit')).toBeVisible()
    await settle()
  },
}
