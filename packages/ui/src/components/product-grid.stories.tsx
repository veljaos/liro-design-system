import type { Meta, StoryObj } from '@storybook/react-vite'
import { CakeSlice, Coffee, Croissant, Wheat } from 'lucide-react'
import type { ReactNode } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { CATEGORIES, CURRENCY, PRODUCTS } from './pos-story-data'
import { ProductGrid, ProductTile, type PosProduct } from './product-tile'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

function Till({ children }: { children: ReactNode }) {
  return (
    <StoryProvider density="touch">
      <ExampleProvider>
        <div className="max-w-200">{children}</div>
      </ExampleProvider>
    </StoryProvider>
  )
}

const ICONS: Record<string, ReactNode> = {
  bread: <Wheat className="size-10 text-secondary" />,
  pastry: <Croissant className="size-10 text-secondary" />,
  cakes: <CakeSlice className="size-10 text-secondary" />,
  drinks: <Coffee className="size-10 text-secondary" />,
}

/** The products with a picture each (here an icon standing in for the application's photo). */
const WITH_IMAGES: readonly PosProduct[] = PRODUCTS.map((product) => ({
  ...product,
  image: ICONS[product.categoryId ?? 'bread'],
}))

const meta = {
  title: 'Components/POS/ProductGrid',
  component: ProductGrid,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the products a till sells as large tiles for fingers: an optional picture, ' +
          'the name (wrapping, never cut), a detail line, the price through the provider’s format ' +
          '(a decimal string) and the stock in the application’s words with an icon. An unavailable ' +
          'product stays focusable with its reason. Categories are chips at the start (the neutral ' +
          'selection, never blue); one tile is in the tab order and the arrows move from the leading ' +
          'edge. No text selection or callout on a long press.\n\n' +
          '**When:** the product area of PosShell; a kiosk’s menu.\n\n' +
          '**When not:** a catalogue to search (LookupField, DataTable); choosing in a form ' +
          '(ComboboxField).',
      },
    },
  },
  args: {
    products: PRODUCTS,
    currency: CURRENCY,
    onSelect: () => undefined,
    categories: CATEGORIES,
  },
  render: (args) => (
    <Till>
      <ProductGrid {...args} />
    </Till>
  ),
  play: settle,
} satisfies Meta<typeof ProductGrid>

export default meta

type Story = StoryObj<typeof meta>

/** Every product under "All": stock low, the last one, and one sold out with its reason. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'All', pressed: true })).toBeVisible()
    await expect(
      canvas.getByText('Unavailable: Sold out; the next batch is at 11:00'),
    ).toBeVisible()
  },
}

/** One category chosen (a restored screen). */
export const Category: Story = {
  args: { defaultCategory: 'pastry' },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Peciva', pressed: true })).toBeVisible()
    await expect(canvas.queryByText('Krempita')).toBeNull()
  },
}

/** With the application's pictures. */
export const WithImages: Story = {
  name: 'With images',
  args: { products: WITH_IMAGES },
}

/** Without categories, a toolbar slot above. */
export const WithoutCategories: Story = {
  name: 'Without categories',
  args: {
    products: PRODUCTS.slice(0, 6),
    categories: [],
    toolbar: <p className="m-0 text-sm text-secondary">Scan a product, or press its tile.</p>,
  },
}

/** Loading: skeleton tiles. */
export const Loading: Story = {
  args: { loading: true },
}

/** A category without products. */
export const Empty: Story = {
  args: { products: [], defaultCategory: 'drinks', allLabel: 'Everything' },
}

/** Long names and words wrap; the price never breaks. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    categories: [
      { id: 'a', label: 'Slani i slatki peciva iz krušne peći' },
      { id: 'b', label: 'Torte po porudžbini' },
    ],
    products: [
      {
        id: 'l1',
        name: 'Integralni hleb sa semenkama suncokreta, lana, susama i bundeve',
        detail: '750 g · Made today at 05:30 in the bakery on Bulevar oslobođenja',
        price: '1234567.50',
        stock: { tone: 'warning', text: 'Low stock: only three loaves are left on the shelf' },
        categoryId: 'a',
      },
      {
        id: 'l2',
        name: 'Torta Reforma',
        price: '3200',
        unavailableReason: 'Ordered for a celebration; it is ready tomorrow from 08:00',
        categoryId: 'b',
      },
      ...PRODUCTS.slice(0, 4),
    ],
  },
}

/** A single tile, unavailable. */
export const Tile: Story = {
  name: 'ProductTile, unavailable',
  render: () => (
    <Till>
      <div className="grid w-80 grid-cols-2 gap-3">
        <ProductTile
          name="Kifla"
          detail="60 g"
          price="25"
          currency={CURRENCY}
          stock={{ tone: 'neutral', text: '48 left' }}
          onSelect={() => undefined}
        />
        <ProductTile
          name="Burek sa sirom"
          detail="250 g"
          price="180"
          currency={CURRENCY}
          unavailableReason="Sold out"
          onSelect={() => undefined}
        />
      </div>
    </Till>
  ),
}

/** On a phone: two columns. */
export const Phone: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <StoryProvider density="touch">
        <ExampleProvider>
          <div className="box-border h-full overflow-y-auto p-4">
            <ProductGrid {...args} />
          </div>
        </ExampleProvider>
      </StoryProvider>
    </PhoneFrame>
  ),
}

/** Arabic, right to left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar" density="touch">
      <div className="max-w-200">
        <ProductGrid
          currency="د.إ"
          onSelect={() => undefined}
          categories={[
            { id: 'b', label: 'خبز' },
            { id: 'c', label: 'حلويات' },
          ]}
          allLabel="الكل"
          products={[
            { id: 'a1', name: 'خبز أبيض', detail: '500 غ', price: '6.5', categoryId: 'b' },
            {
              id: 'a2',
              name: 'كرواسون بالشوكولاتة',
              price: '9',
              categoryId: 'c',
              stock: { tone: 'warning', text: 'بقي 3' },
            },
            {
              id: 'a3',
              name: 'كعكة',
              price: '25',
              categoryId: 'c',
              unavailableReason: 'نفدت الكمية',
            },
          ]}
        />
      </div>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja" density="touch">
      <div className="max-w-200">
        <ProductGrid
          currency="¥"
          onSelect={() => undefined}
          categories={[
            { id: 'b', label: 'パン' },
            { id: 'c', label: 'ケーキ' },
          ]}
          allLabel="すべて"
          products={[
            { id: 'j1', name: '食パン', detail: '1斤', price: '320', categoryId: 'b' },
            {
              id: 'j2',
              name: 'メロンパン',
              price: '180',
              categoryId: 'b',
              stock: { tone: 'danger', text: '残り1個' },
            },
            {
              id: 'j3',
              name: 'ショートケーキ',
              price: '450',
              categoryId: 'c',
              unavailableReason: '売り切れ',
            },
          ]}
        />
      </div>
    </StoryProvider>
  ),
}

/** The arrows move between tiles; a chip filters; an unavailable tile does nothing. */
export const Keyboard: Story = {
  name: 'Keyboard, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const first = canvas.getByRole('button', { name: /^Beli hleb/ })
    await userEvent.click(first)
    await expect(first).toHaveFocus()
    await userEvent.keyboard('{End}')
    await expect(canvas.getByRole('button', { name: /^Sok od pomorandže/ })).toHaveFocus()
    await userEvent.keyboard('{Home}')
    await expect(first).toHaveFocus()
    await userEvent.click(canvas.getByRole('button', { name: 'Kolači' }))
    await expect(canvas.queryByText('Beli hleb')).toBeNull()
  },
}
