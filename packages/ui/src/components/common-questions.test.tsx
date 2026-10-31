import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { CommonQuestions, type CommonQuestion } from './common-questions'
import {
  filterQuestions,
  foldQuestionText,
  questionMatches,
  questionsFiltered,
  shownQuestions,
  toggleQuestion,
} from './common-questions-logic'
import { FileDropzone } from './file-dropzone'

const noop = () => undefined

const QUESTIONS: CommonQuestion[] = [
  {
    id: 'id-card',
    question: 'I changed my ID card. Do I have to tell my employer?',
    answer: 'Only when your address or surname changed.',
    category: 'personal',
    keywords: 'lična karta',
  },
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
    id: 'wedding',
    question: 'I got married. What changes?',
    answer: 'You have five days of paid leave; your surname may change.',
    documents: ['Marriage certificate'],
    category: 'leave',
  },
  {
    id: 'relief',
    question: 'How do I claim a tax relief for a child?',
    answer: 'Bring the birth certificate to Jelena Đorđević in HR.',
    category: 'pay',
  },
]

const LABELS = { personal: 'Personal data', leave: 'Leave', pay: 'Pay' }

describe('questionMatches and filterQuestions', () => {
  it('finds every word in the question, the answer, the documents, keywords or category', () => {
    const ids = (query: string, category: string | null = null) =>
      filterQuestions(QUESTIONS, { query, category }, 'en', LABELS).map((each) => each.id)
    expect(ids('')).toEqual(['id-card', 'address', 'wedding', 'relief'])
    expect(ids('address')).toEqual(['id-card', 'address'])
    expect(ids('marriage certificate')).toEqual(['wedding'])
    expect(ids('licna')).toEqual(['id-card'])
    expect(ids('pay')).toEqual(['relief'])
    expect(ids('address proof')).toEqual(['address'])
    expect(ids('nothing like it')).toEqual([])
  })

  it('keeps one category, and the search inside it', () => {
    const ids = (query: string, category: string | null) =>
      filterQuestions(QUESTIONS, { query, category }, 'en', LABELS).map((each) => each.id)
    expect(ids('', 'personal')).toEqual(['id-card', 'address'])
    expect(ids('address', 'leave')).toEqual([])
  })

  it('ignores case and accents; "dj" and "d" both find "đ"', () => {
    expect(foldQuestionText('Đorđević', 'sr-Latn-RS')).toBe('dordevic')
    const relief = QUESTIONS[3]
    if (relief === undefined) throw new Error('no question')
    for (const query of ['DJORDJEVIC', 'dordevic', 'Đorđević']) {
      expect(questionMatches(relief, query, 'sr-Latn-RS'), query).toBe(true)
    }
  })

  it('shows the first questions only with a limit', () => {
    expect(shownQuestions(QUESTIONS, 2).map((each) => each.id)).toEqual(['id-card', 'address'])
    expect(shownQuestions(QUESTIONS)).toHaveLength(4)
  })

  it('says the count only while a search or a category narrows the list', () => {
    expect(questionsFiltered('', null)).toBe(false)
    expect(questionsFiltered('  ', null)).toBe(false)
    expect(questionsFiltered('pay', null)).toBe(true)
    expect(questionsFiltered('', 'leave')).toBe(true)
  })

  it('opens and closes one card at a time, leaving the others', () => {
    expect(toggleQuestion(['a'], 'b')).toEqual(['a', 'b'])
    expect(toggleQuestion(['a', 'b'], 'a')).toEqual(['b'])
  })
})

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

describe('CommonQuestions markup', () => {
  it('makes a card with more a button named by its question, described by its answer', () => {
    const html = render(<CommonQuestions label="Common questions" questions={QUESTIONS} />)
    expect(html).toContain('aria-label="Common questions"')
    expect(html.match(/aria-expanded="false"/g)).toHaveLength(2)
    expect(html).toMatch(/<h3[^>]*><button/)
    // A question with only its answer is not a button.
    expect(html).toContain('I changed my ID card. Do I have to tell my employer?')
    expect(html).not.toContain('Report a change of address')
    expect(html).not.toContain('<a ')
  })

  it('opens a card on its steps, documents and action', () => {
    const html = render(
      <CommonQuestions
        label="Common questions"
        questions={QUESTIONS}
        defaultOpen={['address']}
        headingLevel={2}
      />,
    )
    expect(html).toContain('aria-expanded="true"')
    expect(html).toMatch(/<h2[^>]*><button/)
    expect(html).toContain('>What to do</p>')
    expect(html).toContain('<ol')
    expect(html).toContain('>What you need</p>')
    expect(html).toContain('Residence certificate')
    expect(html).toContain('Report a change of address')
  })

  it('shows a search, category chips with "All" pressed, and the top questions only', () => {
    const html = render(
      <CommonQuestions
        label="Common questions"
        questions={QUESTIONS}
        search
        categories={[
          { id: 'personal', label: 'Personal data' },
          { id: 'leave', label: 'Leave' },
        ]}
        limit={1}
      />,
    )
    expect(html).toContain('type="search"')
    expect(html).toContain('placeholder="Search questions"')
    expect(html).toMatch(/aria-pressed="true"[^>]*><span[^>]*>All</)
    expect(html.match(/data-slot="question-card"/g)).toHaveLength(1)
  })

  it('says how many a search finds, and offers to clear it when none', () => {
    const some = render(
      <CommonQuestions label="Q" questions={QUESTIONS} search defaultQuery="address" />,
    )
    expect(some).toContain('2 questions')
    const none = render(
      <CommonQuestions label="Q" questions={QUESTIONS} search defaultQuery="zzz" />,
    )
    expect(none).toContain('No questions found')
    expect(none).toContain('Clear the search')
  })

  it('draws skeletons while loading, and the empty state without questions', () => {
    expect(render(<CommonQuestions label="Q" questions={[]} loading />)).toContain(
      'aria-busy="true"',
    )
    expect(render(<CommonQuestions label="Q" questions={[]} />)).toContain('Nothing here yet')
  })
})

describe('FileDropzone expected documents', () => {
  it('lists each document as required, optional or attached', () => {
    const html = render(
      <FileDropzone
        label="Proof"
        onFiles={noop}
        expected={[
          { key: 'death', label: 'Death certificate', required: true },
          { key: 'other', label: 'Proof of kinship', detail: 'A birth certificate' },
          { key: 'done', label: 'Doctor’s note', required: true, attached: true },
        ]}
      />,
    )
    expect(html).toContain('>Attach</p>')
    expect(html).toContain('Death certificate')
    expect(html).toContain('>Required<')
    expect(html).toContain('>Optional<')
    expect(html).toContain('>Attached<')
    expect(html).toContain('A birth certificate')
    expect(html).toContain('text-status-success-fg')
    // "Choose files" is described by the list, and a required document marks the field.
    expect(html).toMatch(/aria-describedby="[^"]*-expected/)
    expect(html).toContain('> *<')
    const optional = render(
      <FileDropzone label="Proof" onFiles={noop} expected={[{ key: 'a', label: 'A photo' }]} />,
    )
    expect(optional).not.toContain('> *<')
  })
})
