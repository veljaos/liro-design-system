import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { ArticlePage } from '../templates/article-page'
import { AskPage } from '../templates/ask-page'
import { ArticleList } from './article-list'
import { AssistantAnswer } from './assistant-answer'
import { AssistantComposer } from './assistant-composer'
import type { AnswerBlock } from './assistant-logic'
import { EmailPreview } from './email-preview'
import { NewsletterSignup } from './newsletter-signup'
import { ProposedAction } from './proposed-action'
import { ShareLinks } from './share-links'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

const noop = () => undefined

const BLOCKS: AnswerBlock[] = [
  { kind: 'heading', text: 'Overdue invoices' },
  { kind: 'text', text: 'Two invoices are overdue more than 30 days.' },
  {
    kind: 'table',
    caption: 'Overdue more than 30 days',
    columns: [
      { key: 'number', label: 'Invoice' },
      { key: 'days', label: 'Days overdue', numeric: true },
    ],
    rows: [
      { id: '1', cells: { number: 'F-1', days: '41' }, href: '#/f-1' },
      { id: '2', cells: { number: 'F-2', days: '35' } },
    ],
    total: { number: 'Total', days: '76' },
  },
  { kind: 'chart', chart: <div data-testid="chart">chart</div> },
  { kind: 'sources', items: [{ id: 's', label: 'Sales invoices', href: '#/sales' }] },
]

describe('AssistantAnswer', () => {
  it('is labelled as AI-generated and draws every block', () => {
    const html = render(<AssistantAnswer author="Assistant" blocks={BLOCKS} size="page" />)
    expect(html).toContain('AI-generated')
    expect(html).toContain('<h2')
    expect(html).toContain('<table')
    expect(html).toContain('<caption')
    expect(html).toContain('<tfoot')
    expect(html).toContain('href="#/f-1"')
    expect(html).toContain('data-testid="chart"')
    expect(html).toContain('Sources')
    expect(html).toContain('href="#/sales"')
  })

  it('draws a table as cards in the panel', () => {
    const html = render(<AssistantAnswer blocks={BLOCKS} />)
    expect(html).not.toContain('<table')
    expect(html).toContain('<dl')
    expect(html).toContain('Days overdue')
  })

  it('shows thinking, streaming with Stop, stopped and their business', () => {
    const thinking = render(<AssistantAnswer state="thinking" blocks={BLOCKS} />)
    expect(thinking).toContain('Thinking…')
    expect(thinking).toContain('aria-busy="true"')
    expect(thinking).not.toContain('Overdue invoices')
    const streaming = render(<AssistantAnswer state="streaming" blocks={BLOCKS} onStop={noop} />)
    expect(streaming).toContain('Writing…')
    expect(streaming).toContain('>Stop<')
    expect(streaming).toContain('Overdue invoices')
    const stopped = render(<AssistantAnswer state="stopped" blocks={BLOCKS} onRetry={noop} />)
    expect(stopped).toContain('Stopped. The answer may be incomplete.')
    expect(stopped).toContain('Try again')
    expect(stopped).not.toContain('aria-busy="true"')
  })

  it('says why there is no answer', () => {
    const error = render(
      <AssistantAnswer state="error" reason="The data could not be read." onRetry={noop} />,
    )
    expect(error).toContain('role="alert"')
    expect(error).toContain('The data could not be read.')
    const denied = render(
      <AssistantAnswer state="noAccess" reason="You do not have permission to see salaries." />,
    )
    expect(denied).toContain('You do not have permission to see salaries.')
    expect(denied).toContain('role="status"')
  })

  it('offers follow-ups and the report under a complete answer only', () => {
    const done = render(
      <AssistantAnswer blocks={BLOCKS} followUps={['And last quarter?']} onReport={noop} />,
    )
    expect(done).toContain('And last quarter?')
    expect(done).toContain('Report a wrong answer')
    const streaming = render(
      <AssistantAnswer
        state="streaming"
        blocks={BLOCKS}
        followUps={['And last quarter?']}
        onReport={noop}
      />,
    )
    expect(streaming).not.toContain('And last quarter?')
    expect(streaming).not.toContain('Report a wrong answer')
    const reported = render(<AssistantAnswer blocks={BLOCKS} onReport={noop} reported />)
    expect(reported).toContain('Thank you. Your report was sent.')
  })
})

describe('ProposedAction', () => {
  it('waits for Confirm or Dismiss', () => {
    const html = render(
      <ProposedAction
        title="Post invoice 2026-1187"
        details={[{ label: 'Amount', value: '294.000,00 RSD' }]}
        onConfirm={noop}
        onDismiss={noop}
      />,
    )
    expect(html).toContain('Proposed action')
    expect(html).toContain('Nothing is done until you confirm.')
    expect(html.indexOf('>Dismiss<')).toBeLessThan(html.indexOf('>Confirm<'))
    expect(html).toContain('294.000,00 RSD')
  })

  it('says what happened, and why it cannot be run', () => {
    const done = render(
      <ProposedAction
        title="Post"
        state="done"
        result="Posted as entry 884."
        onConfirm={noop}
        onDismiss={noop}
      />,
    )
    expect(done).toContain('Posted as entry 884.')
    expect(done).not.toContain('>Confirm<')
    const dismissed = render(
      <ProposedAction title="Post" state="dismissed" onConfirm={noop} onDismiss={noop} />,
    )
    expect(dismissed).toContain('Dismissed. Nothing was done.')
    const unavailable = render(
      <ProposedAction
        title="Post"
        unavailableReason="September is closed."
        onConfirm={noop}
        onDismiss={noop}
      />,
    )
    expect(unavailable).toContain('September is closed.')
    expect(unavailable).toMatch(/disabled=""[^>]*>.*Confirm/)
  })
})

describe('AssistantComposer and AskPage', () => {
  it('names the box and keeps Ask waiting for a question', () => {
    const html = render(<AssistantComposer onAsk={noop} placeholder="Ask about your data" />)
    expect(html).toContain('Your question')
    expect(html).toContain('placeholder="Ask about your data"')
    expect(html).toContain('aria-label="Ask"')
    expect(html).toMatch(/disabled=""[^>]*aria-label="Ask"|aria-label="Ask"[^>]*disabled=""/)
  })

  it('shows the start and the answer views', () => {
    const start = render(
      <AskPage
        title="What would you like to know?"
        onAsk={noop}
        suggestions={['Which invoices are overdue?']}
        recent={['How much VAT is due?']}
      />,
    )
    expect(start).toContain('<h1')
    expect(start).toContain('Suggested questions')
    expect(start).toContain('Recent questions')
    expect(start).toContain('Enter asks, Shift+Enter starts a new line')
    const answered = render(
      <AskPage
        title="What would you like to know?"
        onAsk={noop}
        question="Which invoices are overdue?"
        answer={<p>The answer</p>}
        onNewQuestion={noop}
      />,
    )
    expect(answered).toContain('Which invoices are overdue?</h1>')
    expect(answered).toContain('New question')
    expect(answered).toContain('Ask a follow-up')
  })
})

describe('EmailPreview', () => {
  it('draws the message at a width, in a scheme, with its switches', () => {
    const html = render(
      <EmailPreview
        from="Kvadrat Gradnja d.o.o."
        to="buyer@example.com"
        subject="Invoice F-1"
        footer="Novi Sad"
        defaultWidth="phone"
        defaultScheme="dark"
        lang="sr-Latn"
      >
        <p>Body</p>
      </EmailPreview>,
    )
    expect(html).toContain('aria-label="E-mail preview"')
    expect(html).toContain('data-liro-theme="dark"')
    expect(html).toContain('max-width:360px')
    expect(html).toContain('lang="sr-Latn"')
    expect(html).toContain('Mail client')
    expect(html).toContain('Invoice F-1')
    const bare = render(
      <EmailPreview from="A" subject="S" controls={false}>
        B
      </EmailPreview>,
    )
    expect(bare).not.toContain('Mail client')
    expect(bare).toContain('max-width:600px')
  })
})

describe('reading', () => {
  it('lists articles with their byline, the first across the row', () => {
    const html = render(
      <ArticleList
        label="Latest"
        featured
        articles={[
          {
            id: 'a',
            title: 'First',
            href: '#/a',
            author: 'Jelena',
            date: '2026-10-14',
            readingTime: '6 min read',
          },
          { id: 'b', title: 'Second', href: '#/b', category: 'Guides' },
        ]}
      />,
    )
    expect(html).toContain('aria-label="Latest"')
    expect(html).toContain('col-span-full')
    expect(html).toContain('Jelena · ')
    expect(html).toContain('6 min read')
    expect(html).toContain('Guides')
    expect(render(<ArticleList label="Latest" articles={[]} />)).toContain('Nothing matches')
  })

  it('subscribes, thanks and shares', () => {
    const form = render(
      <NewsletterSignup title="News" consent="We never share it." onSubscribe={noop} />,
    )
    expect(form).toContain('E-mail address')
    expect(form).toContain('type="email"')
    expect(form).toContain('We never share it.')
    const thanks = render(<NewsletterSignup title="News" subscribed onSubscribe={noop} />)
    expect(thanks).toContain('Thank you. Check your inbox to confirm.')
    const share = render(
      <ShareLinks
        url="https://example.com/a"
        targets={[{ key: 'in', label: 'LinkedIn', href: 'https://example.com/share' }]}
      />,
    )
    expect(share).toContain('Copy link')
    expect(share).toContain('target="_blank"')
  })

  it('lays an article out for reading', () => {
    const html = render(
      <ArticlePage
        title="Why e-invoices are rejected"
        category={{ label: 'E-invoicing', href: '#/c' }}
        author={{ name: 'Jelena Stanković' }}
        date="2026-10-14"
        updated="2026-10-15"
        readingTime="6 min read"
        tags={[{ key: 't', label: 'SEF', href: '#/t' }]}
        related={<p>related</p>}
      >
        <p>Body</p>
      </ArticlePage>,
    )
    expect(html).toContain('Why e-invoices are rejected</h1>')
    expect(html).toContain('Updated ')
    expect(html).toContain('Related articles')
    expect(html).toContain('Tags')
  })
})
