import { renderToStaticMarkup } from 'react-dom/server'
import { BookOpen } from 'lucide-react'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { RichText } from '../rich-text/rich-text'
import { CategoryGrid } from './category-grid'
import { HelpfulFeedback } from './helpful-feedback'
import { LinkSuggestions } from './link-suggestions'
import { PageContents } from './page-contents'
import { SatisfactionRating } from './satisfaction-rating'
import { SearchResultList } from './search-result-list'
import type { SatisfactionOption } from './help-logic'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

const noop = () => undefined

const SCALE: SatisfactionOption[] = [
  { value: '1', label: 'Very dissatisfied' },
  { value: '2', label: 'Dissatisfied' },
  { value: '3', label: 'Neutral' },
  { value: '4', label: 'Satisfied' },
  { value: '5', label: 'Very satisfied' },
]

describe('SatisfactionRating', () => {
  it('is a radio group named by the question, every step with its words', () => {
    const html = render(
      <SatisfactionRating question="How did we do?" options={SCALE} onSubmit={noop} />,
    )
    expect(html).toContain('role="radiogroup"')
    expect(html.match(/role="radio"/g)).toHaveLength(5)
    expect(html).toContain('Very dissatisfied')
    expect(html).toContain('Very satisfied')
    expect(html).toContain('Comment (optional)')
    expect(html).toContain('>Send<')
    expect(html).not.toContain('bg-surface-selected')
  })

  it('marks the chosen step neutrally', () => {
    const html = render(
      <SatisfactionRating question="How did we do?" options={SCALE} value="4" onSubmit={noop} />,
    )
    expect(html.match(/bg-surface-selected/g)).toHaveLength(1)
    expect(html).toContain('aria-checked="true"')
  })

  it('leaves the comment out and, unavailable, shows the scale read-only and why', () => {
    const html = render(
      <SatisfactionRating
        question="How did we do?"
        options={SCALE}
        comment={false}
        unavailableReason="Rating closed after 14 days."
        onSubmit={noop}
      />,
    )
    expect(html).not.toContain('Comment (optional)')
    expect(html).toContain('Rating closed after 14 days.')
    expect(html).toContain('aria-readonly="true"')
    expect(html).toContain('data-readonly=""')
    expect(html).toMatch(/aria-describedby="[^"]*-reason"[^>]*disabled=""/)
  })

  it('thanks with the answer in words once sent', () => {
    const html = render(
      <SatisfactionRating
        question="How did we do?"
        options={SCALE}
        submitted={{ value: '4', comment: 'Quick answer.' }}
        onSubmit={noop}
      />,
    )
    expect(html).toContain('role="status"')
    expect(html).toContain('Thank you for your feedback.')
    expect(html).toContain('Your answer: 4, Satisfied')
    expect(html).toContain('Quick answer.')
    expect(html).not.toContain('role="radiogroup"')
  })
})

describe('HelpfulFeedback', () => {
  it('asks with two toggle buttons in words', () => {
    const html = render(<HelpfulFeedback />)
    expect(html).toContain('Was this helpful?')
    expect(html.match(/aria-pressed="false"/g)).toHaveLength(2)
    expect(html).toContain('>Yes<')
    expect(html).toContain('>No<')
  })

  it('thanks after an answer and asks what was missing after No', () => {
    const html = render(
      <HelpfulFeedback defaultAnswer="no" askWhy counts="3 of 5 found this helpful" />,
    )
    expect(html).toContain('aria-pressed="true"')
    expect(html).toContain('Thank you for telling us.')
    expect(html).toContain('What was missing?')
    expect(html).toContain('3 of 5 found this helpful')
    const sent = render(<HelpfulFeedback answer="no" askWhy commentSent />)
    expect(sent).toContain('Thank you. Your comment was sent.')
    expect(sent).not.toContain('What was missing?')
  })
})

describe('LinkSuggestions', () => {
  it('lists the suggestions as links with their summary as description', () => {
    const html = render(
      <LinkSuggestions
        title="These articles may help"
        suggestions={[
          {
            id: 'a',
            title: 'Why was my invoice rejected?',
            href: '#a',
            summary: 'Read the message.',
            meta: 'E-invoicing',
          },
        ]}
      />,
    )
    expect(html).toContain('These articles may help')
    expect(html).toContain('href="#a"')
    expect(html).toContain('aria-describedby')
    expect(html).toContain('1 suggestion')
  })

  it('draws only the status without suggestions', () => {
    const html = render(<LinkSuggestions title="These articles may help" suggestions={[]} />)
    expect(html).not.toContain('These articles may help')
    expect(html).toContain('No suggestions')
    const loading = render(<LinkSuggestions title="Help" suggestions={[]} loading />)
    expect(loading).toContain('Looking for suggestions…')
  })
})

describe('SearchResultList', () => {
  it('marks the matches and names the link by the whole title', () => {
    const html = render(
      <SearchResultList
        label="Search results"
        count={1}
        results={[
          {
            id: 'a',
            title: ['Why was my invoice ', { match: 'rejected' }, '?'],
            href: '#a',
            snippet: ['It was ', { match: 'rejected' }, ' because…'],
          },
        ]}
      />,
    )
    expect(html).toContain('1 result')
    expect(html.match(/<mark/g)).toHaveLength(2)
    expect(html).toContain('aria-label="Why was my invoice rejected?"')
  })

  it('shows no results, skeletons and the error', () => {
    expect(render(<SearchResultList label="r" results={[]} count={0} />)).toContain(
      'Nothing matches',
    )
    expect(render(<SearchResultList label="r" results={[]} loading />)).toContain(
      'aria-busy="true"',
    )
    expect(render(<SearchResultList label="r" results={[]} error onRetry={noop} />)).toContain(
      'Try again',
    )
  })
})

describe('CategoryGrid', () => {
  it('draws each category as a link card with its count', () => {
    const html = render(
      <CategoryGrid
        label="Categories"
        categories={[
          { id: 'e', title: 'E-invoicing', href: '#e', count: '5 articles', icon: BookOpen },
        ]}
      />,
    )
    expect(html).toContain('aria-label="Categories"')
    expect(html).toContain('href="#e"')
    expect(html).toContain('5 articles')
    expect(render(<CategoryGrid label="c" categories={[]} loading />)).toContain('aria-busy')
  })
})

describe('PageContents and RichText headings', () => {
  it('gives the headings the ids the contents link to', () => {
    const value = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text: 'First step' }] },
        { type: 'paragraph', content: [{ type: 'text', text: 'Text' }] },
      ],
    }
    const text = render(<RichText value={value} headingIds="kb" />)
    expect(text).toContain('id="kb-first-step"')
    expect(text).toContain('tabindex="-1"')
    const nav = render(
      <PageContents layout="desktop" entries={[{ id: 'kb-first-step', label: 'First step' }]} />,
    )
    expect(nav).toContain('aria-label="On this page"')
    expect(nav).toContain('href="#kb-first-step"')
    expect(nav).toContain('aria-current="location"')
    const phone = render(
      <PageContents layout="phone" entries={[{ id: 'kb-first-step', label: 'First step' }]} />,
    )
    expect(phone).toContain('aria-expanded="false"')
    expect(phone).not.toContain('href="#kb-first-step"')
  })
})
