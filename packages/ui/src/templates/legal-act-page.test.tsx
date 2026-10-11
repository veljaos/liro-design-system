import type { ReactNode } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LegalArticleSummary } from '../components/legal-panels'
import { LAW, NOTES, PRACTICE } from '../components/legal-story-data'
import { LiroProvider } from '../provider/liro-provider'
import { messagesEn } from '../provider/messages.en'
import { LegalActPage } from './legal-act-page'
import { PrintLegalAct } from './print-legal-act'

function render(node: ReactNode) {
  return renderToStaticMarkup(
    <LiroProvider locale="sr-Latn" today="2026-10-11">
      {node}
    </LiroProvider>,
  )
}

const noop = () => undefined

describe('legalPanel.articleSummary (English)', () => {
  const summary = messagesEn['legalPanel.articleSummary']
  it('says once, twice and n times, and singular counts', () => {
    expect(
      summary(
        'Article 57',
        { changes: 2, decisions: 3, opinions: 1 },
        { changes: '2', decisions: '3', opinions: '1' },
      ),
    ).toBe('Article 57: changed twice, 3 court decisions, 1 opinion')
    expect(
      summary(
        'Article 12',
        { changes: 1, decisions: 1, opinions: 0 },
        { changes: '1', decisions: '1', opinions: '0' },
      ),
    ).toBe('Article 12: changed once, 1 court decision, 0 opinions')
    expect(
      summary(
        'Article 1',
        { changes: 0, decisions: 0, opinions: 2 },
        { changes: '0', decisions: '0', opinions: '2' },
      ),
    ).toBe('Article 1: not changed, 0 court decisions, 2 opinions')
    expect(
      summary(
        'Article 9',
        { changes: 4, decisions: 0, opinions: 0 },
        { changes: '4', decisions: '0', opinions: '0' },
      ),
    ).toContain('changed 4 times')
  })
})

describe('LegalArticleSummary', () => {
  it('counts the article’s changes, decisions and opinions and offers the way back', () => {
    const html = render(
      <LegalArticleSummary act={LAW} articleId="a57" practice={PRACTICE} onArticleClear={noop} />,
    )
    expect(html).toContain('Article 57: changed twice, 2 court decisions, 1 opinion')
    expect(html).toContain('Back to the whole act')
  })
})

describe('LegalActPage', () => {
  it('shows the title in the act’s language, the gazette, the version and the actions', () => {
    const html = render(
      <LegalActPage
        act={LAW}
        gazetteName="Illustrative Gazette"
        layout="desktop"
        text={<p>Text</p>}
        onCompareVersions={noop}
        onCopyCitation={noop}
        onPrint={noop}
        watching
        onWatchChange={noop}
        onBookmarkChange={noop}
      />,
    )
    expect(html).toMatch(/<h1 lang="en"[^>]*>Law on Illustrative Building Works<\/h1>/)
    expect(html).toContain('Illustrative Gazette ')
    expect(html).toContain('href="#gazette/2018/47"')
    expect(html).toContain('Version as of 11.10.2026.')
    expect(html).toContain('Partly in force')
    expect(html).toContain('Compare versions')
    expect(html).toContain('Print / PDF')
    // Watching: the action stops it; not bookmarked: the action bookmarks.
    expect(html).toContain('Stop watching')
    expect(html).toContain('>Bookmark<')
    expect(html).toContain('Hide panels')
  })

  it('names an older version by its first day', () => {
    const html = render(<LegalActPage act={{ ...LAW, versionId: 'v2' }} text={null} />)
    expect(html).toContain('Version as of 23.06.2018.')
  })

  it('narrows the panels to the selected article', () => {
    const html = render(
      <LegalActPage
        act={LAW}
        layout="desktop"
        text={null}
        practice={PRACTICE}
        notes={NOTES}
        selectedArticleId="a57"
        onArticleClear={noop}
      />,
    )
    expect(html).toContain('Article 57: changed twice, 2 court decisions, 1 opinion')
    // Only the article's notes: the bookmark on Article 57, not the note on Article 12.
    expect(html).not.toContain('Check the signatures')
  })

  it('leaves the panels out while hidden, and puts them in a sheet on phones', () => {
    const hidden = render(
      <LegalActPage
        act={LAW}
        layout="desktop"
        text={null}
        panelsHidden
        onPanelsHiddenChange={noop}
      />,
    )
    expect(hidden).not.toContain('<aside')
    expect(hidden).toContain('Show panels')
    const phone = render(<LegalActPage act={LAW} layout="phone" text={null} />)
    expect(phone).not.toContain('<aside')
    expect(phone).toContain('Details')
  })

  it('shows skeletons while loading', () => {
    const html = render(<LegalActPage act={LAW} layout="desktop" text={<p>Text</p>} loading />)
    expect(html).toContain('aria-busy="true"')
    expect(html).not.toContain('<p>Text</p>')
  })
})

describe('PrintLegalAct', () => {
  it('prints every article, the deleted one by its words, and the footnotes', () => {
    const html = render(<PrintLegalAct act={LAW} gazetteName="Illustrative Gazette" note="Note" />)
    for (const label of ['Article 1', 'Article 2', 'Article 12', 'Article 57', 'Article 63']) {
      expect(html).toContain(label)
    }
    expect(html).toContain('Deleted (No. 33/2021)')
    expect(html).toContain('Applies from 01.01.2027.')
    expect(html).toContain('Footnotes')
    expect(html).toContain('Illustrative Gazette No. 12/2016, 47/2018, 33/2021, 9/2024')
  })
})
