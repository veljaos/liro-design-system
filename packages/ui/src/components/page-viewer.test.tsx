import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LiroProvider } from '../provider/liro-provider'
import { PageViewer } from './page-viewer'
import { clampPage, labelSide, regionBox, regionPage, type PageRegion } from './page-viewer-logic'

const render = (node: React.ReactNode) =>
  renderToStaticMarkup(<LiroProvider locale="en">{node}</LiroProvider>)

const A4 = { width: 595, height: 842 }
const PAGES = [
  { src: 'page-1.png', ...A4 },
  { src: 'page-2.png', ...A4, alt: 'The second page: the lines' },
]
const REGIONS: PageRegion[] = [
  { id: 'number', page: 1, x: 400, y: 60, width: 150, height: 20, label: 'Number' },
  { id: 'total', page: 2, x: 380, y: 700, width: 170, height: 24, label: 'Total' },
]

describe('regionBox', () => {
  it('gives the region in percentages of its page', () => {
    expect(regionBox({ x: 0, y: 0, width: 595, height: 421 }, A4)).toEqual({
      left: '0%',
      top: '0%',
      width: '100%',
      height: '50%',
    })
    expect(regionBox({ x: 59.5, y: 84.2, width: 119, height: 42.1 }, A4)).toEqual({
      left: '10%',
      top: '10%',
      width: '20%',
      height: '5%',
    })
  })

  it('cuts a region to its page', () => {
    expect(regionBox({ x: -20, y: 800, width: 100, height: 100 }, A4)).toEqual({
      left: '0%',
      top: '95.0119%',
      width: '13.4454%',
      height: '4.9881%',
    })
  })

  it('has no box off the page or on a page without a size', () => {
    expect(regionBox({ x: 600, y: 10, width: 10, height: 10 }, A4)).toBeNull()
    expect(regionBox({ x: 10, y: 10, width: 0, height: 10 }, A4)).toBeNull()
    expect(regionBox({ x: 10, y: 10, width: 10, height: 10 }, { width: 0, height: 842 })).toBeNull()
  })
})

describe('regionPage, clampPage and labelSide', () => {
  it('finds the page of a region', () => {
    expect(regionPage(REGIONS, 'total')).toBe(2)
    expect(regionPage(REGIONS, 'missing')).toBeNull()
    expect(regionPage(REGIONS, null)).toBeNull()
    expect(regionPage(REGIONS, undefined)).toBeNull()
  })

  it('keeps a page within the document', () => {
    expect(clampPage(0, 3)).toBe(1)
    expect(clampPage(4, 3)).toBe(3)
    expect(clampPage(2.7, 3)).toBe(2)
    expect(clampPage(2, 0)).toBe(1)
    expect(clampPage(Number.NaN, 3)).toBe(1)
  })

  it('puts the name below a region at the top of the page', () => {
    expect(labelSide({ y: 60 }, A4)).toBe('below')
    expect(labelSide({ y: 700 }, A4)).toBe('above')
  })
})

describe('PageViewer', () => {
  it('shows the highlighted region on its page, with its name', () => {
    const html = render(
      <PageViewer label="Invoice 1001" pages={PAGES} regions={REGIONS} highlight="total" />,
    )
    expect(html).toContain('src="page-2.png"')
    expect(html).toContain('alt="The second page: the lines"')
    expect(html).toContain('Page 2 of 2')
    expect(html).toContain('data-slot="page-viewer-highlight"')
    expect(html).toContain('Highlighted: Total, page 2 of 2')
    expect(html).toContain('aria-label="Invoice 1001"')
    expect(html).toContain('data-liro-theme="light"')
    expect(html).toContain('width:100%')
  })

  it('starts on the page asked for, at the zoom asked for, without a highlight there', () => {
    const html = render(
      <PageViewer
        label="Invoice 1001"
        pages={PAGES}
        regions={REGIONS}
        highlight="total"
        defaultPage={1}
        defaultZoom={150}
      />,
    )
    expect(html).toContain('src="page-1.png"')
    expect(html).toContain('alt="Page 1 of 2"')
    expect(html).toContain('width:150%')
    expect(html).toContain('150%')
    expect(html).not.toContain('data-slot="page-viewer-highlight"')
  })

  it('shows a controlled page and zoom', () => {
    const html = render(<PageViewer label="Invoice 1001" pages={PAGES} page={2} zoom={75} />)
    expect(html).toContain('src="page-2.png"')
    expect(html).toContain('width:75%')
  })

  it('waits while loading, and shows an error with Try again', () => {
    const loading = render(<PageViewer label="Invoice 1001" pages={PAGES} loading />)
    expect(loading).toContain('Loading the document')
    expect(loading).not.toContain('<img')
    const error = render(
      <PageViewer
        label="Invoice 1001"
        pages={PAGES}
        error="The file is damaged."
        onRetry={() => undefined}
      />,
    )
    expect(error).toContain('The document could not be shown.')
    expect(error).toContain('The file is damaged.')
    expect(error).toContain('Try again')
    expect(error).not.toContain('Page 1 of 2')
  })

  it('shows the application’s words in place of the pages', () => {
    const html = render(
      <PageViewer
        label="Contract"
        pages={[]}
        unavailable={<p>This file is protected with a password.</p>}
      />,
    )
    expect(html).toContain('This file is protected with a password.')
    expect(html).toContain('data-slot="page-viewer-unavailable"')
    expect(html).not.toContain('<img')
  })
})
