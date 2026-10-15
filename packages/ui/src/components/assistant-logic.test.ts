import { describe, expect, it } from 'vitest'
import {
  actionOffers,
  actionSettled,
  ANSWER_STATES,
  answerBusy,
  answerSources,
  canReport,
  followUpsShown,
  questionKey,
  questionReady,
  shownBlocks,
  type AnswerBlock,
} from './assistant-logic'

const BLOCKS: AnswerBlock[] = [
  { kind: 'text', text: 'Three invoices are overdue more than 30 days.' },
  {
    kind: 'sources',
    items: [
      { id: 'a', label: 'Invoice A', href: '#/a' },
      { id: 'b', label: 'Invoice B', href: '#/b' },
    ],
  },
  {
    kind: 'sources',
    items: [
      { id: 'b', label: 'Invoice B', href: '#/b' },
      { id: 'c', label: 'Invoice C', href: '#/c' },
    ],
  },
]

describe('an answer in its states', () => {
  it('is busy while thinking or streaming', () => {
    expect(ANSWER_STATES.filter(answerBusy)).toEqual(['thinking', 'streaming'])
  })

  it('shows its blocks only once something was written', () => {
    expect(shownBlocks('thinking', BLOCKS)).toEqual([])
    expect(shownBlocks('error', BLOCKS)).toEqual([])
    expect(shownBlocks('noAccess', BLOCKS)).toEqual([])
    expect(shownBlocks('streaming', BLOCKS)).toBe(BLOCKS)
    expect(shownBlocks('stopped', BLOCKS)).toBe(BLOCKS)
    expect(shownBlocks('done', BLOCKS)).toBe(BLOCKS)
  })

  it('offers follow-ups only under a complete answer', () => {
    const questions = ['And last quarter?']
    expect(followUpsShown('done', questions)).toBe(questions)
    expect(followUpsShown('done', undefined)).toEqual([])
    for (const state of ['thinking', 'streaming', 'stopped', 'error', 'noAccess'] as const) {
      expect(followUpsShown(state, questions)).toEqual([])
    }
  })

  it('can be reported once something was answered', () => {
    expect(ANSWER_STATES.filter(canReport)).toEqual(['done', 'stopped'])
  })

  it('lists its sources once each, in the order of the blocks', () => {
    expect(answerSources(BLOCKS).map((source) => source.id)).toEqual(['a', 'b', 'c'])
    expect(answerSources([])).toEqual([])
  })
})

describe('the question box', () => {
  it('asks a question that is not only spaces', () => {
    expect(questionReady('')).toBe(false)
    expect(questionReady('  \n ')).toBe(false)
    expect(questionReady(' Which invoices? ')).toBe(true)
  })

  it('asks on Enter and breaks the line on Shift+Enter or while composing', () => {
    expect(questionKey({ key: 'Enter', shiftKey: false })).toBe('ask')
    expect(questionKey({ key: 'Enter', shiftKey: true })).toBe('newline')
    expect(questionKey({ key: 'Enter', shiftKey: false, isComposing: true })).toBe('newline')
    expect(questionKey({ key: 'a', shiftKey: false })).toBeNull()
  })
})

describe('a proposed action', () => {
  it('waits for Confirm or Dismiss until it is settled', () => {
    expect(actionOffers('proposed')).toEqual({ confirm: true, dismiss: true })
    expect(actionOffers('running')).toEqual({ confirm: true, dismiss: true })
    expect(actionOffers('failed')).toEqual({ confirm: true, dismiss: true })
    expect(actionOffers('done')).toEqual({ confirm: false, dismiss: false })
    expect(actionOffers('dismissed')).toEqual({ confirm: false, dismiss: false })
  })

  it('is settled when done or dismissed', () => {
    expect(actionSettled('done')).toBe(true)
    expect(actionSettled('dismissed')).toBe(true)
    expect(actionSettled('proposed')).toBe(false)
    expect(actionSettled('failed')).toBe(false)
  })
})
