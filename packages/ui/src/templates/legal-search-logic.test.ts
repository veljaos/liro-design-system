import { describe, expect, it } from 'vitest'
import { gazetteNumbers, snippetFromRanges, snippetText } from './legal-search-logic'

describe('snippetFromRanges', () => {
  const text = 'The investor shall keep the site records on the site.'

  it('marks each range, in the text’s order', () => {
    expect(
      snippetFromRanges(text, [
        [28, 32],
        [4, 12],
      ]),
    ).toEqual([
      'The ',
      { match: 'investor' },
      ' shall keep the ',
      { match: 'site' },
      ' records on the site.',
    ])
  })

  it('joins overlapping and touching ranges, so nothing is marked twice', () => {
    expect(
      snippetFromRanges('site records', [
        [0, 4],
        [2, 6],
        [6, 12],
      ]),
    ).toEqual([{ match: 'site records' }])
  })

  it('clamps ranges to the text and drops empty ones', () => {
    expect(
      snippetFromRanges('records', [
        [-3, 3],
        [5, 5],
        [5, 99],
      ]),
    ).toEqual([{ match: 'rec' }, 'or', { match: 'ds' }])
    expect(snippetFromRanges('records', [])).toEqual(['records'])
    expect(snippetFromRanges('', [[0, 2]])).toEqual([])
  })

  it('keeps every character: the plain text reads back the same', () => {
    const parts = snippetFromRanges(text, [
      [4, 12],
      [48, 52],
    ])
    expect(snippetText(parts)).toBe(text)
  })
})

describe('gazetteNumbers', () => {
  it('joins the references’ labels', () => {
    expect(
      gazetteNumbers([
        { id: 'a', label: 'No. 12/2016' },
        { id: 'b', label: '47/2018' },
      ]),
    ).toBe('No. 12/2016, 47/2018')
    expect(gazetteNumbers([])).toBe('')
  })
})
