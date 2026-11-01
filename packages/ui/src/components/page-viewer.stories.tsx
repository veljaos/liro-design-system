import type { Meta, StoryObj } from '@storybook/react-vite'
import { KeyRound, ScanSearch } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { EmptyState } from './empty-state'
import { PageViewer } from './page-viewer'
import { PAGE_SIZES } from './document-areas'
import { BLURRED_PAGES, SAMPLE_PAGES, SAMPLE_REGIONS } from './page-viewer-story-data'
import { A4_AREAS, A4_SAMPLE, samplePages } from './sample-pages-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Files/PageViewer',
  component: PageViewer,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a document’s pages as the images the application made of them — a ' +
          'scan, a photo, a rendered PDF page — with pages and zoom, and one region ' +
          'highlighted: where a recognised value was read (the region in the page’s own units, ' +
          'from the application). The page is paper: light in both themes and never mirrored.\n\n' +
          '**When to use:** beside recognised fields (RecognizedField’s "Show where it was ' +
          'read"), or wherever the application must point at a place on a page. ' +
          '**When not:** a viewer the application runs on another origin (DocumentFrame); a ' +
          'printout drawn as React (the library has none: a printed document is liro-folio’s PDF, shown ' +
          'here as its page images).',
      },
    },
  },
  args: {
    label: 'Invoice INV-1001, Northwind Supplies Ltd.',
    pages: SAMPLE_PAGES,
    regions: SAMPLE_REGIONS,
    className: 'h-[32rem]',
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <div className="max-w-xl">
          <Story />
        </div>
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof PageViewer>

export default meta

type Story = StoryObj<typeof meta>

/** The first page, the invoice's number highlighted (its name above it on a raised tag). */
export const Default: Story = {
  args: { highlight: 'number' },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Page 1 of 2')).toBeVisible()
    await expect(canvas.getByText('Highlighted: Number, page 1 of 2')).toBeInTheDocument()
    await expect(canvasElement.querySelector('[data-slot="page-viewer-highlight"]')).not.toBeNull()
    await expect(canvas.getByRole('button', { name: 'Previous page' })).toBeDisabled()
  },
}

/** A region on the second page: the viewer opens on it. The name stands above the region. */
export const SecondPage: Story = {
  name: 'Region on the second page',
  args: { highlight: 'total' },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Page 2 of 2')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Next page' })).toBeDisabled()
  },
}

/** Zoomed to 150%: the page scrolls in both directions inside the viewer. */
export const Zoomed: Story = {
  args: { highlight: 'supplier', defaultZoom: 150 },
  play: async ({ canvasElement }) => {
    await settle()
    const area = within(canvasElement).getByRole('region', {
      name: 'Invoice INV-1001, Northwind Supplies Ltd.',
    })
    await expect(area.scrollWidth).toBeGreaterThan(area.clientWidth)
  },
}

/** No region highlighted. */
export const WithoutHighlight: Story = {
  name: 'Without a highlight',
  args: {},
}

/** The pages are being made: a page-shaped skeleton; the toolbar waits. */
export const Loading: Story = {
  args: { loading: true },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Loading the document')).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Zoom in' })).toBeDisabled()
  },
}

/** The pages could not be made: the application's words and "Try again". */
export const Failed: Story = {
  name: 'Error',
  args: {
    error: 'The file is damaged and could not be opened.',
    onRetry: () => undefined,
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('button', { name: 'Try again' })).toBeVisible()
  },
}

/** A PDF locked with a password: the application's own words and action in place of the pages. */
export const Unavailable: Story = {
  name: 'Unavailable (password)',
  args: {
    pages: [],
    unavailable: (
      <EmptyState
        compact
        icon={KeyRound}
        title="This PDF is protected with a password"
        description="Ask the sender for the password, or for a copy without one."
        action={{ label: 'Enter the password…', onClick: () => undefined }}
      />
    ),
  },
}

/** An unreadable scan: the page shows, blurred; the application says so beside it. */
export const UnreadableScan: Story = {
  name: 'Unreadable scan',
  args: { pages: BLURRED_PAGES, regions: [], label: 'Photo of a receipt' },
}

/** A long region name and a long label. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    label:
      'Invoice INV-1001 of Northwind Supplies Ltd. for the timber, screws and delivery to the Harbour Road site in October',
    highlight: 'lines',
    regions: SAMPLE_REGIONS.map((region) =>
      region.id === 'lines'
        ? { ...region, label: 'Lines read from the table, three of them, quantities and prices' }
        : region,
    ),
  },
}

/** Phone width. */
export const Phone: Story = {
  args: { highlight: 'number', className: 'h-[26rem]' },
  decorators: [
    (Story) => (
      <PhoneFrame>
        <ExampleProvider>
          <div className="p-4">
            <Story />
          </div>
        </ExampleProvider>
      </PhoneFrame>
    ),
  ],
}

/** Arabic: the toolbar mirrors, the page does not. */
export const Arabic: Story = {
  args: {
    label: 'فاتورة INV-1001',
    highlight: 'total',
    regions: SAMPLE_REGIONS.map((region) =>
      region.id === 'total' ? { ...region, label: 'المبلغ الإجمالي' } : region,
    ),
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ar">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** Japanese. */
export const Japanese: Story = {
  args: {
    label: '請求書 INV-1001',
    highlight: 'supplier',
    regions: SAMPLE_REGIONS.map((region) =>
      region.id === 'supplier' ? { ...region, label: '仕入先' } : region,
    ),
  },
  decorators: [
    (Story) => (
      <StoryProvider locale="ja">
        <ExampleProvider>
          <Story />
        </ExampleProvider>
      </StoryProvider>
    ),
  ],
}

/** The application moves the highlight: the viewer turns to the region's page. */
function Pointing() {
  const [highlight, setHighlight] = useState<string>('number')
  const [page, setPage] = useState<number | null>(null)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-2">
        <Button
          family="neutral"
          icon={ScanSearch}
          label="Show the total"
          onClick={() => {
            setHighlight('total')
          }}
        />
        <Button
          family="neutral"
          icon={ScanSearch}
          label="Show the number"
          onClick={() => {
            setHighlight('number')
          }}
        />
      </div>
      <PageViewer
        label="Invoice INV-1001, Northwind Supplies Ltd."
        pages={SAMPLE_PAGES}
        regions={SAMPLE_REGIONS}
        highlight={highlight}
        onPageChange={setPage}
        className="h-[26rem]"
      />
      <output className="bidi-isolate">
        {page === null ? '' : `Reported page ${String(page)}`}
      </output>
    </div>
  )
}

/** A new highlight turns to its page and reports it; the arrows and zoom work from the keyboard. */
export const MovingHighlight: Story = {
  name: 'Moving highlight, interaction',
  tags: ['interaction'],
  render: () => <Pointing />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Show the total' }))
    await waitFor(async () => {
      await expect(canvas.getByText('Page 2 of 2')).toBeVisible()
    })
    await expect(canvas.getByText('Reported page 2')).toBeVisible()
    await expect(canvas.getByText('Highlighted: Total, page 2 of 2')).toBeInTheDocument()
    canvas.getByRole('button', { name: 'Previous page' }).focus()
    await userEvent.keyboard('{Enter}')
    await expect(canvas.getByText('Page 1 of 2')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Zoom in' }))
    await expect(canvas.getByText(/^Zoom 125/)).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('button', { name: 'Show the number' }))
    await expect(canvas.getByText('Highlighted: Number, page 1 of 2')).toBeInTheDocument()
  },
}

/**
 * A PDF renderer's output: neutral sample pages in A4, with the areas it returned (PDF points from
 * each page's bottom-left corner) drawn as dashed frames with their kind and name, and
 * "Download PDF" in the toolbar. The second page holds the two signature fields.
 */
export const RendererAreas: Story = {
  name: 'PDF pages with areas to sign and fill',
  args: {
    label: 'Sample document, 2 pages',
    pages: A4_SAMPLE,
    regions: [],
    areas: A4_AREAS,
    defaultPage: 2,
    defaultFit: 'page',
    onDownload: () => undefined,
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Page 2 of 2')).toBeVisible()
    await expect(canvasElement.querySelectorAll('[data-slot="page-viewer-area"]')).toHaveLength(2)
    await expect(canvas.getByText("Signature: Seller's signature, page 2 of 2")).toBeInTheDocument()
    await expect(canvas.getByRole('button', { name: 'Download PDF' })).toBeVisible()
  },
}

/** An A5 page: its own size from the metadata, never A4. */
export const A5Page: Story = {
  name: 'A5 page',
  args: { label: 'Sample A5 page', pages: samplePages(1, PAGE_SIZES.a5), regions: [] },
}

/** An A4 landscape page. */
export const LandscapePage: Story = {
  name: 'A4 landscape page',
  args: {
    label: 'Sample landscape page',
    pages: samplePages(1, PAGE_SIZES.a4Landscape),
    regions: [],
  },
}

/** A thermal roll, narrow and very tall, opened whole ("Fit page" sets the zoom it opens at). */
export const ThermalRoll: Story = {
  name: 'Thermal roll, whole',
  args: {
    label: 'Sample receipt roll',
    pages: samplePages(1, PAGE_SIZES.thermal80),
    regions: [],
    defaultZoom: 25,
  },
}

/** "Fit page" shows a tall page whole; "Fit width" goes back to the full width. */
export const FitPage: Story = {
  name: 'Fit page, interaction',
  tags: ['interaction'],
  args: { label: 'Sample receipt roll', pages: samplePages(1, PAGE_SIZES.thermal80), regions: [] },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Fit page' }))
    await waitFor(() => expect(canvas.queryByText('Zoom 100%')).toBeNull())
    const page = canvasElement.querySelector<HTMLElement>('[data-slot="page-viewer-page"]')
    const area = canvasElement.querySelector<HTMLElement>('[data-slot="page-viewer-pages"]')
    await expect((page?.offsetHeight ?? 0) <= (area?.clientHeight ?? 0)).toBe(true)
    await userEvent.click(canvas.getByRole('button', { name: 'Fit width' }))
    await waitFor(() => expect(canvas.getByText('Zoom 100%')).toBeInTheDocument())
  },
}
