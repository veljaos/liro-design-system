import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import { snippetFromRanges } from '../templates/legal-search-logic'
import {
  asksWhy,
  currentEntry,
  highlightMatches,
  highlightText,
  ratingAnswer,
  ratingOption,
  scaleValueText,
  type Highlight,
  type SatisfactionOption,
} from './help-logic'

const SCALE: SatisfactionOption[] = [
  { value: '1', label: 'Very dissatisfied' },
  { value: '2', label: 'Dissatisfied' },
  { value: '3', label: 'Neutral' },
  { value: '4', label: 'Satisfied' },
  { value: '5', label: 'Very satisfied' },
]

describe('highlighted text', () => {
  it('reads the plain text and counts the matches', () => {
    const parts: Highlight = ['Why was my SEF invoice ', { match: 'rejected' }, '?']
    expect(highlightText(parts)).toBe('Why was my SEF invoice rejected?')
    expect(highlightMatches(parts)).toBe(1)
    expect(highlightMatches([])).toBe(0)
  })

  it('takes the parts snippetFromRanges makes', () => {
    const parts: Highlight = snippetFromRanges('rejected and rejected again', [
      [0, 8],
      [13, 21],
    ])
    expect(highlightMatches(parts)).toBe(2)
    expect(highlightText(parts)).toBe('rejected and rejected again')
  })
})

describe('the rating scale', () => {
  it('writes digits through the format and any other value as given', () => {
    const marked = createFormat('en', { number: (value) => `<${value}>` })
    expect(scaleValueText(marked, '4')).toBe('<4>')
    expect(scaleValueText(marked, '4.5')).toBe('<4.5>')
    expect(scaleValueText(createFormat('en'), '4')).toBe('4')
    expect(scaleValueText(createFormat('en'), 'A')).toBe('A')
  })

  it('finds the chosen step', () => {
    expect(ratingOption(SCALE, '4')?.label).toBe('Satisfied')
    expect(ratingOption(SCALE, null)).toBeUndefined()
    expect(ratingOption(SCALE, '9')).toBeUndefined()
  })

  it('answers only with a chosen step, the comment trimmed', () => {
    expect(ratingAnswer(SCALE, '5', '  Quick and clear.  ')).toEqual({
      value: '5',
      comment: 'Quick and clear.',
    })
    expect(ratingAnswer(SCALE, '2', '')).toEqual({ value: '2', comment: '' })
    expect(ratingAnswer(SCALE, undefined, 'A comment alone')).toBeNull()
    expect(ratingAnswer(SCALE, '7', '')).toBeNull()
  })
})

describe('"Was this helpful?"', () => {
  it('asks why only after No, when asked, until the comment is sent', () => {
    expect(asksWhy('no', true, false)).toBe(true)
    expect(asksWhy('no', true, true)).toBe(false)
    expect(asksWhy('no', false, false)).toBe(false)
    expect(asksWhy('yes', true, false)).toBe(false)
    expect(asksWhy(null, true, false)).toBe(false)
  })
})

describe('currentEntry', () => {
  it('is the last heading above the line, or the first', () => {
    expect(currentEntry([200, 600, 900], 80)).toBe(0)
    expect(currentEntry([-300, 40, 900], 80)).toBe(1)
    expect(currentEntry([-900, -400, -10], 80)).toBe(2)
    expect(currentEntry([-300, Number.POSITIVE_INFINITY], 80)).toBe(0)
    expect(currentEntry([], 80)).toBe(-1)
  })
})
