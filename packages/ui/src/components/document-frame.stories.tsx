import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { DocumentFrame } from './document-frame'
import { CONTRACT_VIEWER as CONTRACT, viewer } from './document-frame-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Files/DocumentFrame',
  component: DocumentFrame,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** showing a document drawn by a viewer from another origin — the Core’s ' +
          'PDF viewer, a signing service’s preview — inside a Liro screen, safely: a sandboxed ' +
          'iframe (`allow-scripts` only, unless the application allows its own origin’s rights) ' +
          'whose messages are taken only from that frame, from `allowedOrigin` exactly, and only ' +
          'in the shape of the protocol. The toolbar (previous and next page, "Page 1 of 3", zoom ' +
          'out, the zoom level, zoom in) asks the viewer and shows what the viewer reports. A ' +
          'skeleton while it loads; an error with "Try again" when the viewer fails or does not ' +
          'answer in time. The protocol — message names, payloads, direction, origin rules and an ' +
          'example viewer — is in `docs/document-frame.md`; these stories host a small viewer ' +
          'written in the story.\n\n' +
          '**When:** a document preview in a signing page, an attachment preview, a print ' +
          'preview served by the Core.\n\n' +
          '**When not:** a document the Design System can lay out itself (DocumentPage); a link ' +
          'to download a file (AttachmentList).',
      },
    },
  },
  args: {
    title: 'Employment contract RU-2026-017',
    srcDoc: CONTRACT,
    allowedOrigin: 'null',
    onStateChange: fn(),
  },
  render: (args) => (
    <ExampleProvider>
      <div className="max-w-180">
        <DocumentFrame {...args} />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof DocumentFrame>

export default meta

type Story = StoryObj<typeof meta>

/** Waits until the viewer has reported 'ready' and the toolbar shows its page. */
async function ready(canvasElement: HTMLElement) {
  const canvas = within(canvasElement)
  await waitFor(() => expect(canvas.getByText('Page 1 of 3')).toBeVisible(), { timeout: 5000 })
  await settle()
  return canvas
}

/** The contract in the viewer: page 1 of 3 at 100%. */
export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = await ready(canvasElement)
    await expect(canvas.getByTitle('Employment contract RU-2026-017')).toHaveAttribute(
      'sandbox',
      'allow-scripts',
    )
    await expect(canvas.getByText('100%')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Previous page' })).toBeDisabled()
    await expect(args.onStateChange).toHaveBeenLastCalledWith({
      status: 'ready',
      page: 1,
      pageCount: 3,
      zoom: 100,
    })
  },
}

/** Paging and zoom from the toolbar: the toolbar shows what the viewer reports back. */
export const PagingAndZoom: Story = {
  name: 'Paging and zoom',
  play: async ({ canvasElement }) => {
    const canvas = await ready(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }))
    await expect(await canvas.findByText('Page 2 of 3')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }))
    await expect(await canvas.findByText('Page 3 of 3')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Next page' })).toBeDisabled()
    await userEvent.click(canvas.getByRole('button', { name: 'Zoom in' }))
    await expect(await canvas.findByText('125%')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Zoom out' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Zoom out' }))
    await expect(await canvas.findByText('75%')).toBeVisible()
    await settle()
  },
}

/** While the viewer loads: a page-shaped skeleton; the toolbar waits. */
export const Loading: Story = {
  args: {
    srcDoc: viewer({ title: 'Loading', lang: 'en', pages: ['<p>Never shown</p>'], silent: true }),
    timeout: 600_000,
  },
  play: async ({ canvasElement }) => {
    await settle()
    const frame = canvasElement.querySelector('[data-slot="document-frame"]')
    await expect(frame).toHaveAttribute('data-status', 'loading')
    await expect(within(canvasElement).getByText('Loading the document')).toBeInTheDocument()
    await expect(within(canvasElement).getByRole('button', { name: 'Zoom in' })).toBeDisabled()
  },
}

/** The viewer reports an error (its own text): ErrorState with "Try again", which loads anew. */
export const ViewerError: Story = {
  name: 'Error from the viewer',
  args: {
    srcDoc: viewer({
      title: 'Error',
      lang: 'en',
      pages: [],
      error:
        'The file RU-2026-017.pdf was not found. It may have been replaced by a newer version.',
    }),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(await canvas.findByText(/was not found/, {}, { timeout: 5000 })).toBeVisible()
    await expect(canvas.getByText('The document could not be shown.')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Try again' }))
    // Loaded anew, it fails again (the story's viewer always does).
    await expect(await canvas.findByText(/was not found/, {}, { timeout: 5000 })).toBeVisible()
    await settle()
  },
}

/** A viewer that never answers: after `timeout`, the error. */
export const NoAnswer: Story = {
  name: 'Viewer does not answer',
  args: {
    srcDoc: viewer({ title: 'Silent', lang: 'en', pages: [], silent: true }),
    timeout: 500,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      await canvas.findByText('The document viewer did not answer.', {}, { timeout: 5000 }),
    ).toBeVisible()
    await settle()
  },
}

/**
 * Security: a frame whose messages come from another origin than `allowedOrigin` is never
 * believed — the viewer says 'ready', the toolbar does not move.
 */
export const WrongOrigin: Story = {
  name: 'Messages from another origin are ignored',
  args: { allowedOrigin: 'https://viewer.liro.rs', timeout: 600_000 },
  play: async ({ canvasElement, args }) => {
    await new Promise((resolve) => {
      window.setTimeout(resolve, 800)
    })
    await settle()
    const frame = canvasElement.querySelector('[data-slot="document-frame"]')
    await expect(frame).toHaveAttribute('data-status', 'loading')
    await expect(within(canvasElement).queryByText('Page 1 of 3')).toBeNull()
    await expect(args.onStateChange).not.toHaveBeenCalledWith(
      expect.objectContaining({ status: 'ready' }),
    )
  },
}

/** Phone width: the toolbar wraps, the frame fills the width. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="box-border p-4">
          <DocumentFrame {...args} className="h-150" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await ready(canvasElement)
    const frame = canvasElement.querySelector('[data-slot="document-frame"]')
    await expect(frame?.scrollWidth).toBeLessThanOrEqual(frame?.clientWidth ?? 0)
  },
}

/** Arabic: the host right to left (the page arrows mirrored), an Arabic document in the viewer. */
export const Arabic: Story = {
  args: {
    title: 'عقد عمل',
    srcDoc: viewer({
      title: 'عقد عمل',
      lang: 'ar',
      dir: 'rtl',
      pages: [
        '<h1>عقد عمل</h1><p>شركة النور للتجارة</p>',
        '<p>الفترة مغلقة</p>',
        '<p>هذا الحقل مطلوب</p>',
      ],
    }),
  },
  render: (args) => (
    <StoryProvider locale="ar">
      <div className="max-w-180">
        <DocumentFrame {...args} />
      </div>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(
      () =>
        expect(canvasElement.querySelector('[data-slot="document-frame"]')).toHaveAttribute(
          'data-status',
          'ready',
        ),
      { timeout: 5000 },
    )
    await settle()
  },
}

/** Japanese: a Japanese document title and content. */
export const Japanese: Story = {
  args: {
    title: '雇用契約書',
    srcDoc: viewer({
      title: '雇用契約書',
      lang: 'ja',
      pages: [
        '<h1>雇用契約書</h1><p>株式会社さくら商事</p>',
        '<p>会計期間は締め済みです</p>',
        '<p>請求書に表示される名前</p>',
      ],
    }),
  },
  render: (args) => (
    <StoryProvider locale="ja">
      <div className="max-w-180">
        <DocumentFrame {...args} />
      </div>
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await waitFor(
      () =>
        expect(canvasElement.querySelector('[data-slot="document-frame"]')).toHaveAttribute(
          'data-status',
          'ready',
        ),
      { timeout: 5000 },
    )
    await settle()
  },
}
