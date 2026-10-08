import { describe, expect, it } from 'vitest'
import {
  answersOnPath,
  chooseOption,
  isAnswered,
  nextQuestionId,
  nextStep,
  previousStep,
  questionPath,
  questionProgress,
  type QuestionAnswers,
  type QuestionDefinition,
} from './questionnaire-logic'

// The employment contract's questions (the example screen's, shortened): branches on the contract
// type, the place of work and probation.
const QUESTIONS: QuestionDefinition[] = [
  {
    id: 'type',
    title: 'Contract type',
    type: 'single',
    options: [
      { value: 'fixed', label: 'Fixed term', next: 'end' },
      { value: 'indefinite', label: 'Indefinite term', next: 'place' },
    ],
  },
  { id: 'end', title: 'End date', type: 'date' },
  { id: 'reason', title: 'Reason for a fixed term', type: 'text' },
  {
    id: 'place',
    title: 'Place of work',
    type: 'single',
    next: 'probation',
    options: [
      { value: 'office', label: 'Office' },
      { value: 'remote', label: 'Remote' },
      { value: 'hybrid', label: 'Hybrid', next: 'days' },
    ],
  },
  { id: 'days', title: 'Office days per week', type: 'number', next: 'probation' },
  {
    id: 'probation',
    title: 'Probation',
    type: 'single',
    options: [
      { value: 'yes', label: 'Yes', next: 'months' },
      { value: 'no', label: 'No', next: 'salary' },
    ],
  },
  { id: 'months', title: 'Probation months', type: 'number' },
  { id: 'salary', title: 'Gross salary', type: 'amount', currency: 'RSD', next: null },
  { id: 'unreachable', title: 'Never asked', type: 'text' },
]

/** A question of QUESTIONS by its id. */
function question(id: string): QuestionDefinition {
  const found = QUESTIONS.find((each) => each.id === id)
  if (found === undefined) throw new Error(`No question ${id}`)
  return found
}

const ids = (answers: QuestionAnswers) => questionPath(QUESTIONS, answers).map((q) => q.id)

describe('questionPath (branching)', () => {
  it('follows the defaults while nothing is answered', () => {
    // "type" and "probation" have no default next: the next in the list follows.
    expect(ids({})).toEqual(['type', 'end', 'reason', 'place', 'probation', 'months', 'salary'])
  })

  it('takes the branch of the chosen option, which wins over the question', () => {
    expect(ids({ type: { value: 'indefinite' } })).toEqual([
      'type',
      'place',
      'probation',
      'months',
      'salary',
    ])
    expect(ids({ type: { value: 'indefinite' }, probation: { value: 'no' } })).toEqual([
      'type',
      'place',
      'probation',
      'salary',
    ])
    expect(
      ids({
        type: { value: 'indefinite' },
        place: { value: 'hybrid' },
        probation: { value: 'yes' },
      }),
    ).toEqual(['type', 'place', 'days', 'probation', 'months', 'salary'])
  })

  it('ends at null and never reaches a question nothing leads to', () => {
    expect(ids({ type: { value: 'fixed' } })).not.toContain('unreachable')
    expect(nextQuestionId(QUESTIONS, question('salary'), undefined)).toBeNull()
  })

  it('stops at a loop or an unknown id instead of running forever', () => {
    const looping: QuestionDefinition[] = [
      { id: 'a', title: 'A', type: 'text', next: 'b' },
      { id: 'b', title: 'B', type: 'text', next: 'a' },
    ]
    expect(questionPath(looping, {}).map((q) => q.id)).toEqual(['a', 'b'])
    const broken: QuestionDefinition[] = [{ id: 'a', title: 'A', type: 'text', next: 'missing' }]
    expect(questionPath(broken, {}).map((q) => q.id)).toEqual(['a'])
  })

  it('for several choices, the first chosen option (in the options order) that names a next wins', () => {
    const multiple: QuestionDefinition[] = [
      {
        id: 'm',
        title: 'Equipment',
        type: 'multiple',
        options: [
          { value: 'laptop', label: 'Laptop' },
          { value: 'car', label: 'Car', next: 'car' },
          { value: 'phone', label: 'Phone', next: 'phone' },
        ],
        next: null,
      },
      { id: 'car', title: 'Car', type: 'text', next: null },
      { id: 'phone', title: 'Phone', type: 'text', next: null },
    ]
    const path = (value: string[]) => questionPath(multiple, { m: { value } }).map((q) => q.id)
    expect(path(['phone', 'car'])).toEqual(['m', 'car'])
    expect(path(['phone'])).toEqual(['m', 'phone'])
    expect(path(['laptop'])).toEqual(['m'])
  })
})

describe('answers', () => {
  it('counts a choice, typed values and "Other" with its text as answered', () => {
    const position: QuestionDefinition = {
      id: 'position',
      title: 'Position',
      type: 'single',
      options: [
        { value: 'engineer', label: 'Site engineer' },
        { value: 'other', label: 'Other', other: true },
      ],
    }
    expect(isAnswered(position, undefined)).toBe(false)
    expect(isAnswered(position, { value: 'engineer' })).toBe(true)
    expect(isAnswered(position, { value: 'other' })).toBe(false)
    expect(isAnswered(position, { value: 'other', other: '  ' })).toBe(false)
    expect(isAnswered(position, { value: 'other', other: 'Surveyor' })).toBe(true)
    expect(isAnswered(question('end'), { value: '2027-11-01' })).toBe(true)
    expect(isAnswered(question('end'), { value: null })).toBe(false)
    expect(isAnswered(question('salary'), { value: '185000.00' })).toBe(true)
  })

  it('keeps answers of a branch no longer taken, but submits only the path', () => {
    const answers: QuestionAnswers = {
      type: { value: 'indefinite' },
      end: { value: '2027-11-01' },
      reason: { value: 'Project' },
      place: { value: 'office' },
      probation: { value: 'no' },
      salary: { value: '185000.00' },
    }
    const path = questionPath(QUESTIONS, answers)
    expect(answersOnPath(path, answers)).toEqual({
      type: { value: 'indefinite' },
      place: { value: 'office' },
      probation: { value: 'no' },
      salary: { value: '185000.00' },
    })
    // Back on the fixed-term branch, the kept answers return.
    const back = { ...answers, type: { value: 'fixed' } }
    expect(answersOnPath(questionPath(QUESTIONS, back), back)).toMatchObject({
      end: { value: '2027-11-01' },
      reason: { value: 'Project' },
    })
  })

  it('submits the "Other" text trimmed, only when "Other" is chosen', () => {
    const q: QuestionDefinition = {
      id: 'position',
      title: 'Position',
      type: 'single',
      options: [
        { value: 'engineer', label: 'Site engineer' },
        { value: 'other', label: 'Other', other: true },
      ],
      next: null,
    }
    expect(answersOnPath([q], { position: { value: 'other', other: ' Surveyor ' } })).toEqual({
      position: { value: 'other', other: 'Surveyor' },
    })
    expect(answersOnPath([q], { position: { value: 'engineer', other: 'Surveyor' } })).toEqual({
      position: { value: 'engineer' },
    })
  })

  it('chooses one option, or toggles several in the options order', () => {
    const single = question('type')
    expect(chooseOption(single, { value: 'fixed' }, 'indefinite', true)).toEqual({
      value: 'indefinite',
    })
    const multiple: QuestionDefinition = {
      id: 'm',
      title: 'M',
      type: 'multiple',
      options: [
        { value: 'a', label: 'A' },
        { value: 'b', label: 'B' },
        { value: 'c', label: 'C' },
      ],
    }
    expect(chooseOption(multiple, { value: ['c'] }, 'a', true)).toEqual({ value: ['a', 'c'] })
    expect(chooseOption(multiple, { value: ['a', 'c'] }, 'a', false)).toEqual({ value: ['c'] })
  })
})

describe('progress and moving', () => {
  const answers: QuestionAnswers = { type: { value: 'indefinite' }, place: { value: 'office' } }
  const path = questionPath(QUESTIONS, answers)

  it('counts the answered questions of the current path', () => {
    expect(questionProgress(path, answers)).toEqual({ answered: 2, total: 5 })
    expect(questionProgress(questionPath(QUESTIONS, {}), {})).toEqual({ answered: 0, total: 7 })
  })

  it('goes to the next question on the path, then to the summary', () => {
    expect(nextStep(path, answers, 'type', false)).toEqual({ kind: 'question', id: 'place' })
    expect(nextStep(path, answers, 'salary', false)).toEqual({ kind: 'summary' })
  })

  it('after a change from the summary, returns to it unless new questions need an answer', () => {
    const full: QuestionAnswers = {
      ...answers,
      probation: { value: 'no' },
      salary: { value: '185000.00' },
    }
    expect(nextStep(questionPath(QUESTIONS, full), full, 'place', true)).toEqual({
      kind: 'summary',
    })
    const hybrid = { ...full, place: { value: 'hybrid' } }
    expect(nextStep(questionPath(QUESTIONS, hybrid), hybrid, 'place', true)).toEqual({
      kind: 'question',
      id: 'days',
    })
  })

  it('goes back along the path, and from the summary to the last question', () => {
    expect(previousStep(path, { kind: 'question', id: 'place' })).toEqual({
      kind: 'question',
      id: 'type',
    })
    expect(previousStep(path, { kind: 'question', id: 'type' })).toBeNull()
    expect(previousStep(path, { kind: 'summary' })).toEqual({ kind: 'question', id: 'salary' })
  })
})
