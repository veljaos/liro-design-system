import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import type { CommonQuestion } from './common-questions'
import { highlightQuestion, QUESTIONS_PAGE, questionCounts } from './common-questions-logic'
import { highlightText } from './help-logic'
import { AnswerView, QuestionsAndAnswers } from './questions-and-answers'
import { QA_CATEGORIES, QA_QUESTIONS, storyQuestions } from './questions-and-answers-story-data'

const noop = () => undefined
const href = (question: CommonQuestion) => `/questions/${question.id}`

const QUESTIONS: CommonQuestion[] = [
  {
    id: 'address',
    question: 'What do I need to change my address?',
    answer: 'Send a change request with proof of the new address.',
    steps: ['Open My details', 'Request a change'],
    documents: ['Residence certificate'],
    category: 'personal',
    action: { label: 'Report a change of address', onSelect: noop },
  },
  {
    id: 'surname',
    question: 'Đorđević is my new surname. What do I bring?',
    answer: 'The marriage certificate.',
    category: 'personal',
  },
  {
    id: 'annual',
    question: 'How do I request annual leave?',
    answer: 'Choose the dates; your manager approves them.',
    category: 'leave',
    keywords: 'godišnji odmor',
  },
]
const CATEGORIES = [
  { id: 'personal', label: 'Personal data' },
  { id: 'leave', label: 'Leave' },
  { id: 'pay', label: 'Pay' },
]

function render(node: React.ReactNode): string {
  return renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)
}

describe('highlightQuestion (P5.96 item 1)', () => {
  it('marks every typed word, ignoring case', () => {
    expect(highlightQuestion('What do I need to change my address?', 'ADDRESS need', 'en')).toEqual(
      ['What do I ', { match: 'need' }, ' to change my ', { match: 'address' }, '?'],
    )
  })

  it('marks the original letters when accents are ignored, and "dj" marks "đ"', () => {
    const parts = highlightQuestion('Đorđević is my new surname', 'djordjevic', 'en')
    expect(parts).toEqual([{ match: 'Đorđević' }, ' is my new surname'])
    expect(highlightQuestion('Godišnji odmor', 'godisnji', 'en')).toEqual([
      { match: 'Godišnji' },
      ' odmor',
    ])
  })

  it('joins overlapping matches and keeps the text whole', () => {
    const parts = highlightQuestion('annual leave', 'annual nual', 'en')
    expect(parts).toEqual([{ match: 'annual' }, ' leave'])
    expect(highlightText(parts)).toBe('annual leave')
  })

  it('leaves the text alone without a search or a match', () => {
    expect(highlightQuestion('Annual leave', '  ', 'en')).toEqual(['Annual leave'])
    expect(highlightQuestion('Annual leave', 'parking', 'en')).toEqual(['Annual leave'])
    expect(highlightQuestion('', 'leave', 'en')).toEqual([''])
  })
})

describe('questionCounts (P5.96 item 1)', () => {
  const labels = Object.fromEntries(CATEGORIES.map((each) => [each.id, each.label]))

  it('counts every question and each category, empty ones as 0', () => {
    expect(questionCounts(QUESTIONS, '', 'en', labels)).toEqual({
      all: 3,
      byCategory: { personal: 2, leave: 1, pay: 0 },
    })
  })

  it('counts what the search keeps', () => {
    expect(questionCounts(QUESTIONS, 'godisnji', 'en', labels)).toEqual({
      all: 1,
      byCategory: { personal: 0, leave: 1, pay: 0 },
    })
  })
})

describe('The story data (P5.96 item 1)', () => {
  it('has more than 300 questions, the same on every run, with unique ids', () => {
    expect(QA_QUESTIONS.length).toBe(320)
    expect(storyQuestions()).toEqual(QA_QUESTIONS)
    expect(new Set(QA_QUESTIONS.map((question) => question.id)).size).toBe(320)
    const categories = new Set(QA_CATEGORIES.map((category) => category.id))
    expect(QA_QUESTIONS.every((question) => categories.has(question.category))).toBe(true)
  })

  it('mixes the categories on the first page', () => {
    const first = new Set(QA_QUESTIONS.slice(0, QUESTIONS_PAGE).map((each) => each.category))
    expect(first.size).toBeGreaterThan(5)
  })
})

describe('QuestionsAndAnswers (P5.96 item 1)', () => {
  it('links every question to its answer and shows the first page with "Show more"', () => {
    const html = render(
      <QuestionsAndAnswers
        label="Q"
        questions={QA_QUESTIONS}
        answerHref={href}
        categories={QA_CATEGORIES}
      />,
    )
    expect(html.match(/data-slot="answer-link"/g)).toHaveLength(QUESTIONS_PAGE)
    expect(html).toContain(`href="/questions/${QA_QUESTIONS[0]?.id ?? ''}"`)
    expect(html).toContain('Show more (30 of 320 shown)')
    // "All" first with its count, pressed; titles are never underlined (D36).
    expect(html).toMatch(/aria-pressed="true"[^>]*>.*?>All<.*?>320</)
    expect(html).toContain('no-underline')
    expect(html).not.toContain('hover:underline')
  })

  it('keeps a page size and drops "Show more" when everything is shown', () => {
    const html = render(
      <QuestionsAndAnswers label="Q" questions={QUESTIONS} answerHref={href} pageSize={2} />,
    )
    expect(html.match(/data-slot="answer-link"/g)).toHaveLength(2)
    expect(html).toContain('Show more (2 of 3 shown)')
    const all = render(<QuestionsAndAnswers label="Q" questions={QUESTIONS} answerHref={href} />)
    expect(all).not.toContain('Show more')
  })

  it('marks the words found and says the count', () => {
    const html = render(
      <QuestionsAndAnswers
        label="Q"
        questions={QUESTIONS}
        answerHref={href}
        defaultQuery="address"
      />,
    )
    expect(html).toContain('1 question')
    expect(html).toContain('data-slot="search-match"')
    // The link's name is the whole question, the answer its description.
    expect(html).toContain('aria-label="What do I need to change my address?"')
    expect(html).toMatch(/aria-describedby="[^"]+"/)
  })

  it('offers to ask when nothing is found, else to clear the search', () => {
    const ask = render(
      <QuestionsAndAnswers
        label="Q"
        questions={QUESTIONS}
        answerHref={href}
        defaultQuery="parking"
        askAction={{ label: 'Ask HR', onSelect: noop }}
      />,
    )
    expect(ask).toContain('No questions found')
    expect(ask).toContain('Ask HR')
    expect(ask).toContain('Try other words, or ask your question.')
    const clear = render(
      <QuestionsAndAnswers label="Q" questions={QUESTIONS} answerHref={href} defaultQuery="zzz" />,
    )
    expect(clear).toContain('Clear the search')
  })

  it('shows a category only while "All" is chosen', () => {
    const all = render(
      <QuestionsAndAnswers
        label="Q"
        questions={QUESTIONS}
        answerHref={href}
        categories={CATEGORIES}
      />,
    )
    expect(all).toContain('>Personal data</span><h2')
    const leave = render(
      <QuestionsAndAnswers
        label="Q"
        questions={QUESTIONS}
        answerHref={href}
        categories={CATEGORIES}
        defaultCategory="leave"
      />,
    )
    expect(leave.match(/data-slot="answer-link"/g)).toHaveLength(1)
    expect(leave).not.toContain('>Leave</span><h2')
  })

  it('draws skeletons while loading, and the empty state without questions', () => {
    expect(
      render(<QuestionsAndAnswers label="Q" questions={[]} answerHref={href} loading />),
    ).toContain('aria-busy="true"')
    expect(render(<QuestionsAndAnswers label="Q" questions={[]} answerHref={href} />)).toContain(
      'Nothing here yet',
    )
  })
})

describe('AnswerView (P5.96 item 1)', () => {
  it('has the question as the h1, its parts, the request and the way back', () => {
    const question = QUESTIONS[0]
    if (question === undefined) throw new Error('No question')
    const html = render(
      <AnswerView
        question={question}
        back={{ href: '/questions', label: 'Questions and answers' }}
        categories={CATEGORIES}
      />,
    )
    expect(html).toMatch(/<h1[^>]*>What do I need to change my address\?<\/h1>/)
    expect(html).toContain('Personal data')
    expect(html).toContain('>What to do</h2>')
    expect(html).toContain('>What you need</h2>')
    expect(html).toContain('Residence certificate')
    expect(html).toContain('Report a change of address')
    expect(html.match(/href="\/questions"/g)).toHaveLength(2)
    expect(html).toContain('Back to Questions and answers')
  })

  it('shows the answer alone when there is nothing more', () => {
    const question = QUESTIONS[1]
    if (question === undefined) throw new Error('No question')
    const html = render(
      <AnswerView question={question} back={{ href: '/questions', label: 'Questions' }} />,
    )
    expect(html).toContain('The marriage certificate.')
    expect(html).not.toContain('What to do')
    expect(html).not.toContain('What you need')
  })
})
