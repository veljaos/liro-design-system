import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { CandidateList, chooseCandidate, type Candidate } from './candidate-list'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

const noop = () => undefined

const CANDIDATES: Candidate[] = [
  {
    id: 'a',
    title: 'F-2026-0412',
    label: 'F-2026-0412, Panonija Agro d.o.o.',
    subtitle: 'Panonija Agro d.o.o.',
    reason: 'Exact: amount and reference',
    figure: '135.954,00 RSD',
  },
  { id: 'b', title: 'F-2026-0394', label: 'F-2026-0394' },
  { id: 'c', title: 'F-2026-0403', label: 'F-2026-0403' },
]

describe('chooseCandidate', () => {
  it('adds and removes with several, keeping the candidates’ order', () => {
    expect(chooseCandidate(CANDIDATES, ['c'], 'a', true, true)).toEqual(['a', 'c'])
    expect(chooseCandidate(CANDIDATES, ['a', 'c'], 'a', false, true)).toEqual(['c'])
    expect(chooseCandidate(CANDIDATES, ['a'], 'a', true, true)).toEqual(['a'])
  })

  it('keeps one alone without several', () => {
    expect(chooseCandidate(CANDIDATES, ['a'], 'b', true, false)).toEqual(['b'])
    expect(chooseCandidate(CANDIDATES, ['a'], 'a', false, false)).toEqual([])
  })

  it('drops ids that are no longer candidates', () => {
    expect(chooseCandidate(CANDIDATES, ['gone', 'b'], 'c', true, true)).toEqual(['b', 'c'])
  })
})

describe('CandidateList', () => {
  it('several: a named list of checkboxes with the title, subtitle, reason and figure', () => {
    const html = render(
      <CandidateList
        label="Open items to close"
        candidates={CANDIDATES}
        selected={['a']}
        onSelectedChange={noop}
      />,
    )
    expect(html).toContain('aria-label="Open items to close"')
    expect(html.match(/role="checkbox"/g)).toHaveLength(3)
    expect(html).toContain('aria-label="F-2026-0412, Panonija Agro d.o.o."')
    expect(html).toContain('Exact: amount and reference')
    expect(html).toContain('135.954,00 RSD')
    // One chosen row, the neutral selection.
    expect(html.match(/bg-surface-selected/g)).toHaveLength(1)
    expect(html).toContain('aria-checked="true"')
  })

  it('one: radios in a radio group', () => {
    const html = render(
      <CandidateList
        label="Duplicate of"
        candidates={CANDIDATES}
        selected={['b']}
        onSelectedChange={noop}
        multiple={false}
      />,
    )
    expect(html).toContain('role="radiogroup"')
    expect(html.match(/role="radio"/g)).toHaveLength(3)
    expect(html).not.toContain('role="checkbox"')
  })

  it('says so when nothing is proposed, or shows the application’s empty slot', () => {
    expect(
      render(<CandidateList label="L" candidates={[]} selected={[]} onSelectedChange={noop} />),
    ).toContain('Nothing to suggest')
    expect(
      render(
        <CandidateList
          label="L"
          candidates={[]}
          selected={[]}
          onSelectedChange={noop}
          empty={<p>NOTHING OPEN</p>}
        />,
      ),
    ).toContain('NOTHING OPEN')
  })
})
