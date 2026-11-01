import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fireEvent, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { PAGE_SIZES, type DocumentArea, type PdfBox } from './document-areas'
import { KeyValueList } from './cards'
import { SignaturePlacer, type SignatureSigner } from './signature-placer'
import { A4_AREAS, A4_SAMPLE, samplePages } from './sample-pages-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'
import type { ViewerPage } from './page-viewer-logic'

const SIGNERS: SignatureSigner[] = [
  { id: 'ana', name: 'Ana Petrović' },
  { id: 'marko', name: 'Marko Jovanović' },
]

/** The placer with its state, and the boxes it returns under it in PDF points. */
function Placer({
  pages = A4_SAMPLE,
  areas = A4_AREAS,
  signers = SIGNERS,
  initial = {},
}: {
  pages?: readonly ViewerPage[]
  areas?: readonly DocumentArea[]
  signers?: readonly SignatureSigner[]
  initial?: Record<string, PdfBox | null>
}) {
  const [value, setValue] = useState<Record<string, PdfBox | null>>(initial)
  return (
    <div className="flex flex-col gap-4">
      <SignaturePlacer
        label="Sample document, 2 pages"
        pages={pages}
        areas={areas}
        signers={signers}
        value={value}
        onChange={(signerId, box) => {
          setValue((current) => ({ ...current, [signerId]: box }))
        }}
      />
      <section aria-label="Returned coordinates" className="font-sans">
        <h3 className="bidi-content m-0 mb-2 text-sm font-semibold text-primary">
          Returned to the application (PDF points, origin at the page’s bottom-left)
        </h3>
        <KeyValueList
          columns={1}
          items={signers.map((signer) => {
            const box = value[signer.id]
            return {
              label: signer.name,
              value:
                box === null || box === undefined
                  ? '—'
                  : `{ page: ${String(box.page)}, x: ${String(box.x)}, y: ${String(box.y)}, width: ${String(box.width)}, height: ${String(box.height)} }`,
            }
          })}
        />
      </section>
    </div>
  )
}

const meta = {
  title: 'Components/Files/SignaturePlacer',
  component: SignaturePlacer,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** choosing where each signer signs a document shown as page images ' +
          '(a PDF renderer’s output): one box per signer, labelled with the name, in the size the ' +
          'data gives (190 × 48 points by default). A press or a tap places the chosen signer’s ' +
          'box, a drag moves it, the arrow keys move it (5 points, Shift 50) — or one of the ' +
          'document’s empty signature fields is taken. A box stays on its page and never covers ' +
          'another field or signer. It reports `{ page, x, y, width, height }` in PDF points from ' +
          'the page’s bottom-left corner.\n\n' +
          '**When to use:** before a document goes out for signing, when the signatures’ places are ' +
          'chosen on screen. **When not:** the signing itself (SignerList, the Core’s signing); ' +
          'a document whose signature fields are fixed (show them in PageViewer’s `areas`).',
      },
    },
  },
  args: {
    label: 'Sample document, 2 pages',
    pages: A4_SAMPLE,
    signers: SIGNERS,
    value: {},
    onChange: () => undefined,
  },
  decorators: [
    (Story) => (
      <ExampleProvider>
        <div className="max-w-5xl">
          <Story />
        </div>
      </ExampleProvider>
    ),
  ],
  play: settle,
} satisfies Meta<typeof SignaturePlacer>

export default meta

type Story = StoryObj<typeof meta>

/** Two signers: Ana placed on page 1, Marko still to place. Under it, what the application gets. */
export const Default: Story = {
  render: () => (
    <Placer initial={{ ana: { page: 1, x: 56, y: 40, width: 190, height: 48 }, marko: null }} />
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByText('{ page: 1, x: 56, y: 40, width: 190, height: 48 }'),
    ).toBeInTheDocument()
    await expect(canvas.getByText('Not placed yet')).toBeInTheDocument()
  },
}

/**
 * Place and read back: Marko takes the buyer's empty signature field, Ana's box is placed with a
 * press on the page and moved with the arrow keys; the coordinates under the viewer follow.
 */
export const PlaceAndReadBack: Story = {
  name: 'Place and read back, interaction',
  tags: ['interaction'],
  render: () => <Placer />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    // Ana: "Place on this page" puts her box at the first free spot of page 1.
    await userEvent.click(canvas.getByRole('button', { name: 'Place on this page' }))
    await waitFor(() =>
      expect(canvas.getByText('{ page: 1, x: 36, y: 36, width: 190, height: 48 }')).toBeVisible(),
    )
    const box = canvas.getByRole('button', { name: /Signature of Ana Petrović/ })
    box.focus()
    await userEvent.keyboard('{ArrowRight}{ArrowUp}')
    await waitFor(() =>
      expect(canvas.getByText('{ page: 1, x: 41, y: 41, width: 190, height: 48 }')).toBeVisible(),
    )
    // Marko takes the buyer's field on page 2.
    await userEvent.click(canvas.getByRole('radio', { name: /Marko Jovanović/ }))
    await userEvent.click(canvas.getByRole('button', { name: "Buyer's signature (page 2)" }))
    await waitFor(() =>
      expect(
        canvas.getByText('{ page: 2, x: 349.28, y: 96, width: 190, height: 48 }'),
      ).toBeVisible(),
    )
    // A press on a free place of page 2 moves Marko's box there.
    const layer = canvasElement.querySelector<HTMLElement>('[data-slot="signature-layer"]')
    if (layer === null) throw new Error('no signature layer')
    const rect = layer.getBoundingClientRect()
    await fireEvent.pointerDown(layer, {
      clientX: rect.left + rect.width * 0.5,
      clientY: rect.top + rect.height * 0.5,
      pointerId: 1,
    })
    await waitFor(() =>
      expect(canvas.getByText(/\{ page: 2, x: 202\.6\d?, y: 396\.9\d?/)).toBeVisible(),
    )
  },
}

/** A box cannot cover a field: the press on the note's field is refused and said. */
export const NoRoom: Story = {
  name: 'Refused over a field, interaction',
  tags: ['interaction'],
  render: () => <Placer />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const layer = canvasElement.querySelector<HTMLElement>('[data-slot="signature-layer"]')
    if (layer === null) throw new Error('no signature layer')
    const rect = layer.getBoundingClientRect()
    // The note's field: x 36–336, y 120–160 from the bottom of an 841.89-point page.
    await fireEvent.pointerDown(layer, {
      clientX: rect.left + (186 / 595.28) * rect.width,
      clientY: rect.top + ((841.89 - 140) / 841.89) * rect.height,
      pointerId: 1,
    })
    await waitFor(() =>
      expect(canvas.getByText(/There is no room for the signature here/)).toBeInTheDocument(),
    )
    await expect(canvas.getAllByText('Not placed yet')).toHaveLength(2)
  },
}

/** A thermal roll: one signer, the box placed at the roll's foot. */
export const ThermalRoll: Story = {
  name: 'Thermal roll',
  render: () => (
    <Placer
      pages={samplePages(1, PAGE_SIZES.thermal80)}
      areas={[]}
      signers={[{ id: 'buyer', name: 'Buyer' }]}
      initial={{ buyer: { page: 1, x: 18.39, y: 24, width: 190, height: 48 } }}
    />
  ),
}

/** Phone width: the signers above, the page under them; a tap places the box. */
export const Phone: Story = {
  render: () => (
    <PhoneFrame>
      <div className="p-4">
        <Placer initial={{ ana: { page: 1, x: 56, y: 40, width: 190, height: 48 } }} />
      </div>
    </PhoneFrame>
  ),
}

/** Arabic names, right to left: the panel follows the direction, the page stays paper. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <Placer
          signers={[
            { id: 'a', name: 'أحمد منصور' },
            { id: 'b', name: 'ليلى حداد' },
          ]}
          initial={{ a: { page: 1, x: 56, y: 40, width: 190, height: 48 } }}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese names. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <Placer
          signers={[
            { id: 'a', name: '山田 花子' },
            { id: 'b', name: '佐藤 健' },
          ]}
          initial={{ a: { page: 1, x: 56, y: 40, width: 190, height: 48 } }}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}
