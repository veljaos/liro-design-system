import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { BalanceBar } from './balance-bar'
import {
  canMatch,
  matchingKeyAction,
  MATCHING_VIRTUALIZE_FROM,
  nextActive,
  toggleSelection,
} from './matching-logic'
import { MatchingView, type MatchingItem, type MatchingList } from './matching-view'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

const noop = () => undefined

function item(id: string, title = `Item ${id}`): MatchingItem {
  return { id, label: title, title, amount: '1.000,00 RSD' }
}

function list(title: string, items: MatchingItem[], selected: string[] = []): MatchingList {
  return { title, items, selected, onSelectedChange: noop }
}

describe('matchingKeyAction', () => {
  it('moves through the list without wrapping', () => {
    expect(matchingKeyAction('ArrowDown', -1, 5)).toEqual({ type: 'move', to: 0 })
    expect(matchingKeyAction('ArrowDown', 2, 5)).toEqual({ type: 'move', to: 3 })
    expect(matchingKeyAction('ArrowDown', 4, 5)).toEqual({ type: 'move', to: 4 })
    expect(matchingKeyAction('ArrowUp', 0, 5)).toEqual({ type: 'move', to: 0 })
    expect(matchingKeyAction('ArrowUp', 3, 5)).toEqual({ type: 'move', to: 2 })
    expect(matchingKeyAction('Home', 3, 5)).toEqual({ type: 'move', to: 0 })
    expect(matchingKeyAction('End', 0, 5)).toEqual({ type: 'move', to: 4 })
  })

  it('pages by ten, stopping at the ends', () => {
    expect(matchingKeyAction('PageDown', 0, 50)).toEqual({ type: 'move', to: 10 })
    expect(matchingKeyAction('PageDown', 45, 50)).toEqual({ type: 'move', to: 49 })
    expect(matchingKeyAction('PageUp', 15, 50)).toEqual({ type: 'move', to: 5 })
    expect(matchingKeyAction('PageUp', 4, 50)).toEqual({ type: 'move', to: 0 })
  })

  it('selects with Space, matches with Enter, clears with Escape', () => {
    expect(matchingKeyAction(' ', 1, 5)).toEqual({ type: 'toggle' })
    expect(matchingKeyAction(' ', -1, 5)).toBeNull()
    expect(matchingKeyAction('Enter', 1, 5)).toEqual({ type: 'match' })
    expect(matchingKeyAction('Escape', 1, 5)).toEqual({ type: 'clear' })
  })

  it('leaves other keys and modified keys to the browser', () => {
    expect(matchingKeyAction('Tab', 1, 5)).toBeNull()
    expect(matchingKeyAction('a', 1, 5)).toBeNull()
    expect(matchingKeyAction('ArrowDown', 1, 5, { ctrl: true })).toBeNull()
    expect(matchingKeyAction('Enter', 1, 5, { meta: true })).toBeNull()
    expect(matchingKeyAction('Home', 1, 5, { alt: true })).toBeNull()
  })

  it('does not move in an empty list', () => {
    expect(matchingKeyAction('ArrowDown', -1, 0)).toBeNull()
    expect(matchingKeyAction('End', -1, 0)).toBeNull()
  })
})

describe('selection', () => {
  it('adds and removes an id, keeping the order chosen', () => {
    expect(toggleSelection([], 'a')).toEqual(['a'])
    expect(toggleSelection(['b', 'a'], 'c')).toEqual(['b', 'a', 'c'])
    expect(toggleSelection(['b', 'a', 'c'], 'a')).toEqual(['b', 'c'])
  })

  it('matches only with something on each side', () => {
    expect(canMatch([], [])).toBe(false)
    expect(canMatch(['a'], [])).toBe(false)
    expect(canMatch([], ['x'])).toBe(false)
    expect(canMatch(['a'], ['x', 'y'])).toBe(true)
  })

  it('keeps the active item when the list changes', () => {
    expect(nextActive('c', 2, ['a', 'c', 'd'])).toBe(1)
    expect(nextActive('gone', 2, ['a', 'b', 'c', 'd'])).toBe(2)
    expect(nextActive('gone', 5, ['a', 'b'])).toBe(1)
    expect(nextActive(undefined, -1, ['a'])).toBe(-1)
    expect(nextActive('a', 0, [])).toBe(-1)
  })
})

describe('MatchingView', () => {
  it('shows two multi-select lists and the selection as aria-selected', () => {
    const html = render(
      <MatchingView
        label="Matching"
        left={list('Statement 188', [item('l1'), item('l2')], ['l2'])}
        right={list('Open invoices', [item('r1')])}
        onMatch={noop}
        layout="split"
      />,
    )
    expect(html.match(/role="listbox"/g)).toHaveLength(2)
    expect(html).toContain('aria-multiselectable="true"')
    expect(html).toContain('aria-label="Statement 188"')
    expect(html.match(/aria-selected="true"/g)).toHaveLength(1)
    // The keys are shown beside "Match" and describe each list.
    expect(html).toContain('Space')
    expect(html).toMatch(/aria-describedby="[^"]+"/)
  })

  it('explains why Match cannot be used until both sides have a selection', () => {
    const one = render(
      <MatchingView
        label="Matching"
        left={list('A', [item('l1')], ['l1'])}
        right={list('B', [item('r1')])}
        onMatch={noop}
        layout="split"
      />,
    )
    expect(one).toContain('Unavailable: Select at least one line in each list')
    const both = render(
      <MatchingView
        label="Matching"
        left={list('A', [item('l1')], ['l1'])}
        right={list('B', [item('r1')], ['r1'])}
        onMatch={noop}
        layout="split"
      />,
    )
    expect(both).not.toContain('Unavailable:')
    expect(both).toContain('>Match<')
    const reason = render(
      <MatchingView
        label="Matching"
        left={list('A', [item('l1')], ['l1'])}
        right={list('B', [item('r1')], ['r1'])}
        onMatch={noop}
        matchUnavailableReason="Statement 188 is posted"
        layout="split"
      />,
    )
    expect(reason).toContain('Unavailable: Statement 188 is posted')
  })

  it('names suggestion and match buttons, and shows the confidence in words', () => {
    const html = render(
      <MatchingView
        label="Matching"
        left={list('A', [item('l1')])}
        right={list('B', [item('r1')])}
        suggestions={[
          {
            id: 's1',
            left: [item('l1', 'Line 1')],
            right: [item('r1', 'F-2026-0411')],
            label: 'Line 1 with F-2026-0411',
            confidence: 'Exact: amount and reference',
          },
        ]}
        onAcceptSuggestion={noop}
        onDismissSuggestion={noop}
        matches={[
          {
            id: 'm1',
            left: [item('l9', 'Line 9')],
            right: [item('r9', 'F-2026-0388')],
            label: 'Line 9 with F-2026-0388',
            note: 'Matched by hand',
          },
        ]}
        onUnmatch={noop}
        layout="split"
      />,
    )
    expect(html).toContain('Suggested matches')
    expect(html).toContain('Exact: amount and reference')
    expect(html).toContain('aria-label="Match: Line 1 with F-2026-0411"')
    expect(html).toContain('aria-label="Dismiss suggestion: Line 1 with F-2026-0411"')
    expect(html).toContain('aria-label="Unmatch: Line 9 with F-2026-0388"')
    expect(html).toContain('matched with')
  })

  it('read-only: nothing to select, match or unmatch', () => {
    const html = render(
      <MatchingView
        label="Matching"
        left={list('A', [item('l1')])}
        right={list('B', [item('r1')])}
        onMatch={noop}
        matches={[{ id: 'm1', left: [item('l9')], right: [item('r9')], label: 'Line 9 with r9' }]}
        onUnmatch={noop}
        readOnly
        layout="split"
      />,
    )
    expect(html).toContain('aria-readonly="true"')
    expect(html).not.toContain('aria-multiselectable')
    expect(html).not.toContain('Unmatch')
    expect(html).not.toContain('>Match<')
  })

  it('draws only the rows in view of a long list', () => {
    const many = Array.from({ length: 5000 }, (_, index) => item(String(index)))
    expect(many.length).toBeGreaterThan(MATCHING_VIRTUALIZE_FROM)
    const html = render(
      <MatchingView
        label="Matching"
        left={list('A', many)}
        right={list('B', [item('r1')])}
        layout="split"
      />,
    )
    const options = html.match(/role="option"/g) ?? []
    expect(options.length).toBeLessThan(30)
    expect(html).toContain('aria-setsize="5000"')
  })

  it('on phones shows one list at a time, with the selected count in the switch', () => {
    const html = render(
      <MatchingView
        label="Matching"
        left={list('Statement 188', [item('l1'), item('l2')], ['l1', 'l2'])}
        right={list('Open invoices', [item('r1')])}
        onMatch={noop}
        layout="single"
      />,
    )
    expect(html.match(/role="listbox"/g)).toHaveLength(1)
    expect(html).toContain('Statement 188 · 2 selected')
    expect(html).toContain('aria-label="Show list"')
  })

  it('says when a list has nothing left, and shows skeletons while loading', () => {
    expect(
      render(<MatchingView label="M" left={list('A', [])} right={list('B', [])} layout="split" />),
    ).toContain('Nothing left to match')
    const loading = render(
      <MatchingView
        label="M"
        left={list('A', [item('l1')])}
        right={list('B', [])}
        loading
        layout="split"
      />,
    )
    expect(loading).toContain('aria-busy="true"')
    expect(loading).not.toContain('role="listbox"')
  })
})

describe('BalanceBar', () => {
  it('says the entry is balanced, in words', () => {
    const html = render(
      <BalanceBar
        debit="144720.00"
        credit="144720.00"
        difference="0.00"
        state="balanced"
        currency="RSD"
      />,
    )
    expect(html).toContain('Debit')
    expect(html).toContain('Credit')
    expect(html).toContain('Difference')
    expect(html).toMatch(/role="status"[^>]*>.*Balanced/)
    expect(html).toContain('data-state="balanced"')
  })

  it('marks a difference in words and the danger tone', () => {
    const html = render(
      <BalanceBar
        debit="146720.00"
        credit="144720.00"
        difference="2000.00"
        state="unbalanced"
        currency="RSD"
      />,
    )
    expect(html).toContain('Not balanced')
    expect(html).toMatch(/text-status-danger-fg[^>]*>.*2,000.00/)
  })

  it('never shows a difference it cannot know', () => {
    const html = render(
      <BalanceBar
        debit="84600.00"
        credit="144720.00"
        difference="-60120.00"
        state="incomplete"
        currency="RSD"
      />,
    )
    expect(html).toContain('Amounts missing')
    expect(html).not.toContain('60,120')
    expect(html).toContain('—')
  })
})
