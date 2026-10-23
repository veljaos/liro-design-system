import type { Meta, StoryObj } from '@storybook/react-vite'
import { GraduationCap, ListChecks, Lock, LogOut, PauseCircle, RefreshCw } from 'lucide-react'
import { useState } from 'react'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { decimal, paras, sumUnits } from '../components/amounts-story-data'
import { Banner } from '../components/alert'
import { BrandLockup } from '../components/brand-lockup'
import { Button, IconButton } from '../components/button'
import { CartPanel, type CartLine } from '../components/cart-panel'
import {
  CART_LINES,
  CART_TOTAL,
  CART_TOTALS,
  CATEGORIES,
  CURRENCY,
  PRODUCTS,
} from '../components/pos-story-data'
import { ProductGrid } from '../components/product-tile'
import { ScanField, type ScanFeedback } from '../components/scan-field'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { PosShell, type PosShellProps } from './pos-shell'

const BRAND = <BrandLockup brandName="Liro" productName="POS" compact={false} />
const ACTIONS = <IconButton family="neutral" icon={Lock} label="Lock register" />

/** The product area: a scan field above the grid. */
function Products(props: {
  feedback?: ScanFeedback | null
  onScan?: (code: string) => void
  onSelect?: (id: string) => void
}) {
  return (
    <ProductGrid
      products={PRODUCTS}
      categories={CATEGORIES}
      currency={CURRENCY}
      onSelect={props.onSelect ?? (() => undefined)}
      toolbar={
        <ScanField
          label="Barcode or PLU"
          hideLabel
          placeholder="Scan or type a barcode or PLU"
          onScan={(code) => {
            props.onScan?.(code)
          }}
          feedback={props.feedback ?? null}
        />
      }
    />
  )
}

function Cart(props: { lines?: readonly CartLine[]; total?: string | null }) {
  return (
    <CartPanel
      className="flex-1"
      lines={props.lines ?? CART_LINES}
      currency={CURRENCY}
      total={props.total === undefined ? CART_TOTAL : props.total}
      totals={props.lines === undefined ? CART_TOTALS : []}
      onQuantityChange={() => undefined}
      onRemove={() => undefined}
      onCharge={() => undefined}
      actions={<Button family="neutral" icon={PauseCircle} label="Park sale" />}
    />
  )
}

/** A till: the touch density and the bakery's amounts, the screen's whole height. */
function Till(props: Partial<PosShellProps>) {
  return (
    <StoryProvider density="touch">
      <ExampleProvider>
        <div className="h-dvh">
          <PosShell
            brand={BRAND}
            register="Kasa 2"
            cashier="Milica Jovanović"
            actions={ACTIONS}
            products={<Products />}
            cart={<Cart />}
            {...props}
          />
        </div>
      </ExampleProvider>
    </StoryProvider>
  )
}

/** The application around the shell: adds a product per press or scan and sums the lines. */
function SellingDemo({ onScan }: { onScan: (code: string) => void }) {
  const [lines, setLines] = useState<readonly CartLine[]>([])
  const [feedback, setFeedback] = useState<ScanFeedback | null>(null)
  const add = (id: string) => {
    const product = PRODUCTS.find((item) => item.id === id || item.name === id)
    if (product === undefined) {
      setFeedback({ id: Date.now(), tone: 'error', text: `Unknown code ${id}` })
      return
    }
    setFeedback({ id: Date.now(), tone: 'success', text: `${product.name} added` })
    setLines((current) => {
      const line = current.find((item) => item.id === product.id)
      const quantity = String(Number(line?.quantity ?? '0') + 1)
      const next: CartLine = {
        id: product.id,
        name: product.name,
        quantity,
        unit: 'pc',
        unitPrice: product.price,
        total: decimal(paras(product.price) * BigInt(quantity)),
        ...(product.detail === undefined ? {} : { detail: product.detail }),
      }
      return line === undefined
        ? [...current, next]
        : current.map((item) => (item.id === product.id ? next : item))
    })
  }
  const total =
    lines.length === 0 ? null : decimal(sumUnits(lines.map((line) => paras(line.total))))
  return (
    <Till
      // Widened for a busy test machine; a real scanner sends a key every few milliseconds.
      scanOptions={{ maxInterval: 1000 }}
      onScan={(code) => {
        onScan(code)
        add(code)
      }}
      products={<Products feedback={feedback} onSelect={add} onScan={add} />}
      cart={<Cart lines={lines} total={total} />}
    />
  )
}

const meta = {
  title: 'Templates/PosShell',
  component: PosShell,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** the frame of a till — the whole screen, no application header or ' +
          'navigation, made for fingers (use it inside `LiroProvider density="touch"`): a strip ' +
          'with the brand, the register, the cashier, what is being sent and the application’s ' +
          'actions; the offline strip with the queue (“3 sales waiting to be sent”); the product ' +
          'area at the start and the cart at the end. Kiosk-safe: nothing scrolls the page, no ' +
          'double-tap zoom, no selection by a long press, safe areas kept. On a phone the ' +
          'products come first and the order is a compact bar at the bottom (the count and the ' +
          'total, highlighted at each change) that expands into a sheet with the cart (P5.90). A ' +
          'scanner works anywhere on the screen (`onScan`).\n\n' +
          '**When:** a point of sale, a kiosk, a self-service order screen.\n\n' +
          '**When not:** the back office of a shop (AppShell); a handheld’s warehouse work ' +
          '(PickList, StockCount).\n\n' +
          '**P5.28:** `banners` under the strip stay in view (a training mode); the queue’s ' +
          'state (`queueState` “failed”: a danger “Not sent” badge) and `queueAction`.',
      },
    },
  },
  args: { brand: BRAND, products: null, cart: null },
  render: () => <Till />,
  play: settle,
} satisfies Meta<typeof PosShell>

export default meta

type Story = StoryObj<typeof meta>

/** A landscape tablet: products and a cart of four lines. */
export const Default: Story = {
  name: 'Tablet',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('region', { name: 'Register status' })).toHaveTextContent(
      'Kasa 2',
    )
    await expect(canvas.getByRole('button', { name: /^Charge 1\.011,00/ })).toBeVisible()
  },
}

/** Sales waiting to be sent while online. */
export const Sending: Story = {
  name: 'Sending the queue',
  render: () => <Till queued={2} />,
}

/** Training: a persistent warning banner, and the cart's marker. */
export const Training: Story = {
  render: () => (
    <Till
      banners={
        <Banner
          tone="warning"
          icon={GraduationCap}
          title="Training mode"
          role="status"
          actions={<Button family="neutral" icon={LogOut} label="Leave training" />}
        >
          Nothing is reported; every receipt says it is not a fiscal receipt.
        </Banner>
      }
      cart={
        <CartPanel
          className="flex-1"
          lines={CART_LINES}
          currency={CURRENCY}
          total={CART_TOTAL}
          totals={CART_TOTALS}
          kindLabel="Training · Sale"
          marker="Training — this is not a fiscal receipt"
          onCharge={() => undefined}
        />
      }
    />
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement.querySelector('[data-slot="pos-banners"]')).toHaveTextContent(
      'Training mode',
    )
  },
}

/** Receipts the processor refused: a danger "Not sent" badge and the journal. */
export const QueueFailed: Story = {
  name: 'Queue not sent',
  render: () => (
    <Till
      queued={2}
      queuedText="2 receipts were not accepted"
      queueState="failed"
      queueAction={<Button family="neutral" icon={ListChecks} label="Show receipts" />}
    />
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('Not sent')).toBeVisible()
  },
}

/** Offline: the strip with the queue and "Try now"; selling goes on. */
export const Offline: Story = {
  render: () => (
    <Till
      offline
      queued={3}
      offlineAction={<Button family="neutral" icon={RefreshCw} label="Try now" />}
    />
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByText('3 sales waiting to be sent')).toBeVisible()
  },
}

/** A new sale: the cart is empty. */
export const EmptyCart: Story = {
  name: 'Empty cart',
  render: () => <Till cart={<Cart lines={[]} total={null} />} />,
}

/** Long names wrap in the strip. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <Till
      register="Kasa 2 — prodavnica na Bulevaru oslobođenja, prizemlje"
      cashier="Milica Jovanović-Stanković, smena od 06:00 do 14:00"
      queued={12}
    />
  ),
}

/** The order bar's count and total, as the cart shows them. */
const ORDER = { count: CART_LINES.length, total: CART_TOTAL, currency: CURRENCY }

/** A phone in portrait: the products first, the order as a compact bar at the bottom. */
export const Phone: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <StoryProvider density="touch">
        <ExampleProvider>
          <div className="h-full">
            <PosShell
              layout="phone"
              brand={<BrandLockup brandName="Liro" productName="POS" compact />}
              register="Kasa 2"
              cashier="Milica Jovanović"
              offline
              queued={1}
              products={<Products />}
              cart={<Cart />}
              orderSummary={ORDER}
            />
          </div>
        </ExampleProvider>
      </StoryProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('button', { name: /^Order\s*4 items\s*1\.011,00/ }),
    ).toBeVisible()
  },
}

/** A phone with the order sheet open (a restored screen): the cart and "Charge". */
export const PhoneOrder: Story = {
  name: 'Phone width, order open',
  render: () => (
    <PhoneFrame>
      <StoryProvider density="touch">
        <ExampleProvider>
          <div className="h-full">
            <PosShell
              layout="phone"
              defaultOrderOpen
              brand={<BrandLockup brandName="Liro" productName="POS" compact />}
              register="Kasa 2"
              products={<Products />}
              cart={<Cart />}
              orderSummary={ORDER}
            />
          </div>
        </ExampleProvider>
      </StoryProvider>
    </PhoneFrame>
  ),
  play: async () => {
    await settle()
    const sheet = within(within(document.body).getByRole('dialog', { name: 'Order' }))
    await expect(sheet.getByRole('button', { name: /^Charge 1\.011,00/ })).toBeVisible()
  },
}

/** The application around a phone till: each tap adds a line, and the bar answers at once. */
function PhoneSelling() {
  const [lines, setLines] = useState<readonly CartLine[]>([])
  const add = (id: string) => {
    const product = PRODUCTS.find((item) => item.id === id)
    if (product === undefined) return
    setLines((current) => {
      const line = current.find((item) => item.id === id)
      const quantity = String(Number(line?.quantity ?? '0') + 1)
      const next: CartLine = {
        id,
        name: product.name,
        quantity,
        unit: 'pc',
        unitPrice: product.price,
        total: decimal(paras(product.price) * BigInt(quantity)),
      }
      return line === undefined
        ? [...current, next]
        : current.map((item) => (item.id === id ? next : item))
    })
  }
  const total =
    lines.length === 0 ? null : decimal(sumUnits(lines.map((line) => paras(line.total))))
  return (
    <PosShell
      layout="phone"
      brand={<BrandLockup brandName="Liro" productName="POS" compact />}
      register="Kasa 2"
      products={
        <ProductGrid
          products={PRODUCTS.map((product) => {
            const line = lines.find((item) => item.id === product.id)
            return line === undefined ? product : { ...product, inOrder: line.quantity }
          })}
          categories={CATEGORIES}
          currency={CURRENCY}
          search
          onSelect={add}
        />
      }
      cart={<Cart lines={lines} total={total} />}
      orderSummary={{ count: lines.length, total, currency: CURRENCY }}
    />
  )
}

/** Tapping a tile: its count on the tile and the bar's count go up at once, highlighted. */
export const PhoneSellingInteraction: Story = {
  name: 'Phone width, tapping items, interaction',
  tags: ['interaction'],
  render: () => (
    <PhoneFrame>
      <StoryProvider density="touch">
        <ExampleProvider>
          <div className="h-full">
            <PhoneSelling />
          </div>
        </ExampleProvider>
      </StoryProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /^Kifla/ }))
    await userEvent.click(canvas.getByRole('button', { name: /^Kifla/ }))
    await expect(canvas.getByRole('button', { name: /^Kifla/ })).toHaveAccessibleDescription(
      /2 in the order/,
    )
    const bar = canvasElement.querySelector('[data-slot="pos-order-bar"]')
    await expect(bar).toHaveTextContent('1 item')
    await expect(bar).toHaveAttribute('data-flash', 'true')
    // The search finds products in every category.
    await userEvent.type(canvas.getByRole('searchbox', { name: 'Search products' }), 'jog')
    await expect(canvas.getByRole('button', { name: /^Jogurt/ })).toBeVisible()
    await expect(canvas.queryByRole('button', { name: /^Kifla/ })).toBeNull()
  },
}

/** Arabic, right to left: the cart at the end is on the left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar" density="touch">
      <div className="h-dvh">
        <PosShell
          brand={<BrandLockup brandName="Liro" productName="POS" compact={false} />}
          register="الصندوق 2"
          cashier="سارة أحمد"
          queued={2}
          products={
            <ProductGrid
              currency="د.إ"
              onSelect={() => undefined}
              allLabel="الكل"
              products={[
                { id: 'a1', name: 'خبز أبيض', price: '6.5' },
                { id: 'a2', name: 'كرواسون بالشوكولاتة', price: '9' },
                { id: 'a3', name: 'كعكة', price: '25', unavailableReason: 'نفدت الكمية' },
              ]}
            />
          }
          cart={
            <CartPanel
              className="flex-1"
              title="السلة"
              currency="د.إ"
              total="13.00"
              lines={[
                { id: 'a1', name: 'خبز أبيض', quantity: '2', unitPrice: '6.5', total: '13.00' },
              ]}
              onQuantityChange={() => undefined}
              onRemove={() => undefined}
              onCharge={() => undefined}
              chargeLabel="الدفع 13.00 د.إ"
            />
          }
        />
      </div>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja" density="touch">
      <div className="h-dvh">
        <PosShell
          brand={<BrandLockup brandName="Liro" productName="POS" compact={false} />}
          register="レジ2"
          cashier="佐藤 花子"
          products={
            <ProductGrid
              currency="¥"
              onSelect={() => undefined}
              allLabel="すべて"
              products={[
                { id: 'j1', name: '食パン', price: '320' },
                { id: 'j2', name: 'メロンパン', price: '180' },
              ]}
            />
          }
          cart={
            <CartPanel
              className="flex-1"
              title="カート"
              currency="¥"
              total="320"
              lines={[{ id: 'j1', name: '食パン', quantity: '1', unitPrice: '320', total: '320' }]}
              onQuantityChange={() => undefined}
              onCharge={() => undefined}
              chargeLabel="お会計 ¥320"
            />
          }
        />
      </div>
    </StoryProvider>
  ),
}

/** Pressing tiles and scanning anywhere on the screen add products; the application sums. */
export const Selling: Story = {
  name: 'Selling, interaction',
  tags: ['interaction'],
  args: { onScan: fn() },
  render: (args) => <SellingDemo onScan={args.onScan ?? (() => undefined)} />,
  play: async ({ canvasElement, args }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: /^Kifla/ }))
    await userEvent.click(canvas.getByRole('button', { name: /^Kifla/ }))
    await expect(canvas.getByRole('textbox', { name: 'Quantity, Kifla' })).toHaveValue('2')
    // A scanner's burst while a tile has the focus: read as a scan, the tile not pressed.
    await userEvent.setup({ delay: null }).keyboard('Jogurt{Enter}')
    await expect(args.onScan).toHaveBeenCalledWith('Jogurt')
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'Quantity, Jogurt' })).toHaveValue('1')
    })
    await expect(canvas.getByRole('textbox', { name: 'Quantity, Kifla' })).toHaveValue('2')
  },
}
