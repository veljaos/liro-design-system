import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { GazetteIssues } from '../components/gazette-issues'
import type { FilterDefinition } from '../components/filter-logic'
import { LiroProvider } from '../provider/liro-provider'
import { LegalSearchPage, type LegalSearchPageProps } from './legal-search-page'
import type { LegalSearchResult } from './legal-search-logic'

const render = (node: ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

const RESULT: LegalSearchResult = {
  id: 'law',
  type: 'Law',
  title: 'Law on Illustrative Building Works',
  href: '#/law',
  issuer: 'Illustrative Assembly',
  gazetteName: 'Illustrative Gazette',
  gazette: [
    { id: 'g1', label: 'No. 12/2016' },
    { id: 'g2', label: '47/2018' },
  ],
  status: { id: 'in-force', label: 'In force', tone: 'success' },
  snippet: ['The ', { match: 'site records' }, ' are kept daily.'],
  article: { label: 'Article 57', href: '#/law/article-57' },
}

const STATUS: FilterDefinition = {
  id: 'status',
  label: 'Status',
  type: 'select',
  options: [{ value: 'in-force', label: 'In force' }],
}

function page(props: Partial<LegalSearchPageProps>) {
  return render(
    <LegalSearchPage
      title="Legal information"
      search=""
      onSearchChange={() => undefined}
      filters={[STATUS]}
      values={{}}
      onValuesChange={() => undefined}
      results={[]}
      layout="desktop"
      {...props}
    />,
  )
}

describe('LegalSearchPage', () => {
  it('shows a result: type, issuer, status, title link, gazette, marked snippet, article', () => {
    const html = page({ results: [RESULT], count: 128, search: 'site records' })
    expect(html).toContain('128 results')
    expect(html).toContain('Illustrative Assembly')
    expect(html).toContain('>In force</span>')
    expect(html).toContain('href="#/law"')
    expect(html).toContain('Illustrative Gazette No. 12/2016, 47/2018')
    expect(html).toMatch(/<mark[^>]*>site records<\/mark>/)
    expect(html).toContain('href="#/law/article-57"')
    expect(html).toContain('Found in Article 57')
  })

  it('says "More than" when the count is not exact', () => {
    expect(page({ results: [RESULT], count: 25000, countIsExact: false })).toContain(
      'More than 10,000 results',
    )
  })

  it('offers "Clear filters" when filters hide everything, and nothing when only words do', () => {
    const filtered = page({ values: { status: 'in-force' }, search: 'x' })
    expect(filtered).toContain('Nothing matches')
    expect(filtered).toContain('Clear filters')
    const words = page({ search: 'nothing like this' })
    expect(words).toContain('Nothing matches')
    expect(words).not.toContain('Clear filters')
  })

  it('shows skeletons while the first page loads, the error with Try again when it failed', () => {
    expect(page({ loading: true })).toContain('aria-busy="true"')
    const failed = page({ error: true, onRetry: () => undefined, errorCaseId: 'C-1' })
    expect(failed).toContain('Try again')
    expect(failed).toContain('C-1')
  })

  it('pages by cursor and offers the sort', () => {
    const html = page({
      results: [RESULT],
      hasNext: true,
      sortOptions: [
        { value: 'relevance', label: 'Relevance' },
        { value: 'newest', label: 'Newest first' },
      ],
      sort: 'newest',
      onSortChange: () => undefined,
    })
    expect(html).toContain('aria-label="Next"')
    expect(html).toContain('Sort: Newest first')
  })
})

describe('GazetteIssues', () => {
  it('shows each issue with its day, its count and its acts', () => {
    const html = render(
      <GazetteIssues
        title="New in the Illustrative Gazette"
        issues={[
          {
            id: 'i9',
            label: 'No. 9/2024',
            published: '2024-02-15',
            href: '#/gazette/9-2024',
            acts: [
              {
                id: 'a',
                type: 'Law',
                title: 'Law amending the Law on Illustrative Building Works',
                href: '#/a',
                note: 'Amends Articles 12 and 57',
                status: { id: 'f', label: 'In force', tone: 'success' },
              },
            ],
          },
        ]}
        hasMore
        onLoadMore={() => undefined}
      />,
    )
    expect(html).toContain('>New in the Illustrative Gazette</h2>')
    expect(html).toMatch(/<h3[^>]*><a href="#\/gazette\/9-2024"[^>]*>No. 9\/2024<\/a><\/h3>/)
    expect(html).toContain('Published 02/15/2024')
    expect(html).toContain('1 act')
    expect(html).toContain('Amends Articles 12 and 57')
    expect(html).toContain('Show more issues')
  })

  it('is empty, loading or failed', () => {
    expect(render(<GazetteIssues title="New" issues={[]} />)).toContain('No new issues')
    expect(render(<GazetteIssues title="New" issues={[]} loading />)).toContain('aria-busy="true"')
    expect(
      render(<GazetteIssues title="New" issues={[]} error onRetry={() => undefined} />),
    ).toContain('Try again')
  })
})
