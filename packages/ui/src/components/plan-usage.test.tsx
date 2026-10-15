import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { createFormat } from '../provider/format'
import { LiroProvider } from '../provider/liro-provider'
import { messagesEn } from '../provider/messages.en'
import { PlanComparison } from './plan-comparison'
import { choosablePlan, comparisonRows, featureCell } from './plan-logic'
import { FEATURES, PLANS, PLANS_WITH_REASON } from './plan-story-data'
import { UsageMeter } from './usage-meter'
import { meterShare, usageAmount, usageWords } from './usage-logic'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

const format = createFormat('sr-Latn-RS')

describe('featureCell', () => {
  const feature = {
    id: 'f',
    label: 'Feature',
    values: { a: true, b: false, c: null, d: '30 users', e: '' },
  }
  it('reads true as included, false, null, empty and missing as not included', () => {
    expect(featureCell(feature, 'a')).toEqual({ kind: 'included' })
    expect(featureCell(feature, 'b')).toEqual({ kind: 'excluded' })
    expect(featureCell(feature, 'c')).toEqual({ kind: 'excluded' })
    expect(featureCell(feature, 'e')).toEqual({ kind: 'excluded' })
    expect(featureCell(feature, 'missing')).toEqual({ kind: 'excluded' })
  })
  it("keeps the application's words", () => {
    expect(featureCell(feature, 'd')).toEqual({ kind: 'text', value: '30 users' })
  })
})

describe('comparisonRows', () => {
  it('puts a heading where the group changes, none for features without a group', () => {
    const rows = comparisonRows([
      { id: 'a', label: 'A', values: {} },
      { id: 'b', label: 'B', group: 'Limits', values: {} },
      { id: 'c', label: 'C', group: 'Limits', values: {} },
      { id: 'd', label: 'D', group: 'Modules', values: {} },
      { id: 'e', label: 'E', group: 'Limits', values: {} },
    ])
    expect(rows.map((row) => (row.kind === 'group' ? `#${row.label}` : row.feature.id))).toEqual([
      'a',
      '#Limits',
      'b',
      'c',
      '#Modules',
      'd',
      '#Limits',
      'e',
    ])
  })
})

describe('choosablePlan', () => {
  it('chooses existing plans without a reason only', () => {
    expect(choosablePlan(PLANS_WITH_REASON, 'business')).toBe(true)
    expect(choosablePlan(PLANS_WITH_REASON, 'start')).toBe(false)
    expect(choosablePlan(PLANS_WITH_REASON, 'gold')).toBe(false)
    expect(choosablePlan(PLANS_WITH_REASON, null)).toBe(false)
  })
})

describe('meterShare', () => {
  it('draws used over limit, at most a full bar', () => {
    expect(meterShare('24', '30')).toBeCloseTo(0.8)
    expect(meterShare('0', '30')).toBe(0)
    expect(meterShare('45', '30')).toBe(1)
    expect(meterShare('4.2', '10')).toBeCloseTo(0.42)
  })
  it('draws nothing without a limit, with a zero limit or unreadable amounts', () => {
    expect(meterShare('24', null)).toBeNull()
    expect(meterShare('24', undefined)).toBeNull()
    expect(meterShare('24', '0')).toBeNull()
    expect(meterShare('24,5', '30')).toBeNull()
    expect(meterShare('24', 'many')).toBeNull()
  })
})

describe('usage words', () => {
  it('writes the amounts through format, exactly as given', () => {
    expect(usageWords(format, messagesEn, '24', '30')).toBe('24 of 30')
    expect(usageWords(format, messagesEn, '4.25', '10', 'GB')).toBe('4,25 GB of 10 GB')
    expect(usageWords(format, messagesEn, '1284', null)).toBe('1.284 used, no limit')
  })
  it('leaves text that is not a number as the application wrote it', () => {
    expect(usageAmount(format, messagesEn, 'unlimited')).toBe('unlimited')
    expect(usageAmount(format, messagesEn, '12', '')).toBe('12')
  })
})

describe('PlanComparison', () => {
  it('is one radio group: a radio per plan, a column per plan, rows per feature', () => {
    const html = render(
      <PlanComparison label="Choose a plan" plans={PLANS} features={FEATURES} layout="desktop" />,
    )
    expect(html).toContain('role="radiogroup"')
    expect(html.match(/role="radio"/g)).toHaveLength(3)
    expect(html.match(/scope="col"/g)).toHaveLength(4)
    expect(html.match(/scope="row"/g)).toHaveLength(FEATURES.length)
    expect(html.match(/scope="colgroup"/g)).toHaveLength(3)
    expect(html).toContain('>Included<')
    expect(html).toContain('>Not included<')
    expect(html).not.toContain('bg-surface-selected')
  })

  it('marks the current plan in words and the chosen column neutrally', () => {
    const html = render(
      <PlanComparison
        label="Choose a plan"
        plans={PLANS}
        features={FEATURES}
        current="business"
        value="pro"
        layout="desktop"
      />,
    )
    expect(html).toContain('Current plan')
    // The chosen plan's header and every feature cell of its column.
    expect(html.match(/bg-surface-selected/g)).toHaveLength(FEATURES.length + 1)
    expect(html.match(/aria-checked="true"/g)).toHaveLength(1)
  })

  it('disables a plan that cannot be chosen and says why', () => {
    const html = render(
      <PlanComparison
        label="Choose a plan"
        plans={PLANS_WITH_REASON}
        features={FEATURES}
        layout="desktop"
      />,
    )
    expect(html).toContain('Start has 5 users; you have 24.')
    expect(html.match(/<button[^>]*disabled=""/g)).toHaveLength(1)
  })

  it('draws a card per plan on a phone', () => {
    const html = render(
      <PlanComparison
        label="Choose a plan"
        plans={PLANS}
        features={FEATURES}
        value="business"
        layout="phone"
      />,
    )
    expect(html).not.toContain('<table')
    expect(html.match(/data-slot="plan-card"/g)).toHaveLength(3)
    expect(html.match(/data-chosen="true"/g)).toHaveLength(1)
  })
})

describe('UsageMeter', () => {
  it('shows the words and a bar named by the label with the same words', () => {
    const html = render(<UsageMeter label="Users" used="24" limit="30" />)
    expect(html).toContain('24 of 30')
    expect(html).toContain('role="progressbar"')
    expect(html).toContain('aria-valuetext="24 of 30"')
  })
  it('has no bar without a limit, and shows the state the application gives', () => {
    const html = render(
      <UsageMeter
        label="Documents sent"
        used="412"
        state={{ label: 'Near the limit', tone: 'warning' }}
      />,
    )
    expect(html).toContain('412 used, no limit')
    expect(html).not.toContain('role="progressbar"')
    expect(html).toContain('Near the limit')
  })
  it('shows skeletons while loading', () => {
    const html = render(<UsageMeter label="Users" used="24" limit="30" loading />)
    expect(html).toContain('aria-busy="true"')
    expect(html).not.toContain('24 of 30')
  })
})
