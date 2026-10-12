import type { Meta, StoryObj } from '@storybook/react-vite'
import { SlidersHorizontal } from 'lucide-react'
import { useState } from 'react'
import { expect, fireEvent, userEvent, within } from 'storybook/test'
import { Button } from '../components/button'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { AppShell } from './app-shell'
import { Launchpad, type LaunchpadProps } from './launchpad'
import { BRAND, COMMANDS, COMPANIES, MODULES, moduleById, USER } from './shell-story-data'

/** The home screen: the shell without module tabs, the page title and the grid. */
function Home({
  phone = false,
  ...props
}: Partial<LaunchpadProps> & { phone?: boolean; action?: React.ReactNode }) {
  return (
    <AppShell
      layout={phone ? 'phone' : 'desktop'}
      brand={BRAND}
      commands={{ items: COMMANDS }}
      notifications={{ unread: 0, panel: <p className="m-0 text-sm">No notifications.</p> }}
      companies={{ items: COMPANIES, current: 'kvadrat', onSelect: () => undefined }}
      user={USER}
    >
      <div
        className={
          phone
            ? 'box-border flex w-full flex-col gap-4 p-4'
            : 'mx-auto box-border flex w-full max-w-content flex-col gap-6 p-6'
        }
      >
        <div className="flex items-center justify-between gap-4">
          <h1 className="bidi-content m-0 text-h1 text-primary">Kvadrat Gradnja d.o.o.</h1>
          {props.action}
        </div>
        <Launchpad
          label="Modules"
          modules={MODULES}
          layout={phone ? 'phone' : 'desktop'}
          {...props}
        />
      </div>
    </AppShell>
  )
}

/** Editing with state: the story keeps the order and the hidden modules, as the Core would. */
function Editing({ phone = false }: { phone?: boolean }) {
  const [editing, setEditing] = useState(true)
  const [order, setOrder] = useState(MODULES.slice(0, 7).map((module) => module.id))
  const [hidden, setHidden] = useState<string[]>(['reports', 'assets'])
  const byId = moduleById
  return (
    <Home
      phone={phone}
      editing={editing}
      modules={order.map(byId)}
      hidden={hidden.map(byId)}
      onReorder={setOrder}
      onHide={(id) => {
        setOrder(order.filter((other) => other !== id))
        setHidden([...hidden, id])
      }}
      onShow={(id) => {
        setHidden(hidden.filter((other) => other !== id))
        setOrder([...order, id])
      }}
      action={
        editing ? (
          <Button
            intent="confirm"
            label="Done"
            onClick={() => {
              setEditing(false)
            }}
          />
        ) : (
          <Button
            family="neutral"
            icon={SlidersHorizontal}
            label="Customize"
            onClick={() => {
              setEditing(true)
            }}
          />
        )
      }
    />
  )
}

const meta = {
  title: 'Templates/Launchpad',
  component: Launchpad,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** the home of the application: the modules as cards, in the user’s ' +
          'order. Each card: the module’s icon, a counter written by the application ("7 to ' +
          'approve"), the name and one line. A locked module says why ("Available in Pro") ' +
          'and does not open. Keys 1–9 open the first nine modules; the arrows move between ' +
          'cards.\n\n' +
          '**How:** `modules` in order, each with an `href`. The application switches ' +
          '`editing` on (a "Customize" button in the page header): the cards then have move ' +
          'and hide buttons and can be dragged, hidden modules are listed with "Show", and ' +
          '"Done", also the application’s, leaves it. `onReorder`, `onHide` and `onShow` report every ' +
          'change; the Core stores it.\n\n' +
          '**When not:** navigation inside a module is its tabs (AppShell `moduleTabs`), never ' +
          'a sidebar; numbers and charts belong to a dashboard (P4.6).',
      },
    },
  },
  args: { label: 'Modules', modules: MODULES },
  render: (args) => (
    <ExampleProvider>
      <Home {...args} />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof Launchpad>

export default meta

type Story = StoryObj<typeof meta>

/** Nine modules, one locked. */
export const Default: Story = {
  args: {
    action: <Button family="neutral" icon={SlidersHorizontal} label="Customize" />,
  } as Partial<LaunchpadProps>,
  play: async ({ canvasElement }) => {
    await settle()
    const grid = within(within(canvasElement).getByRole('list', { name: 'Modules' }))
    const sales = grid.getByRole('link', { name: /Sales/ })
    await expect(sales).toHaveAttribute('aria-keyshortcuts', '1')
    await expect(grid.getByRole('link', { name: /Fixed assets/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
  },
}

/** The arrow keys move between cards; down moves by a row. */
export const Keyboard: Story = {
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const grid = within(within(canvasElement).getByRole('list', { name: 'Modules' }))
    grid.getByRole('link', { name: /Sales/ }).focus()
    await userEvent.keyboard('{ArrowDown}')
    await expect(grid.getByRole('link', { name: /Accounting/ })).toHaveFocus()
    const list = within(canvasElement).getByRole('list', { name: 'Modules' })
    const forward = list.closest('[dir]')?.getAttribute('dir') !== 'rtl'
    await userEvent.keyboard(forward ? '{ArrowRight}' : '{ArrowLeft}')
    await expect(document.activeElement?.textContent).toContain('Inventory')
  },
}

/** Editing: move, hide and drag; hidden modules with "Show"; "Done" leaves. */
export const EditingMode: Story = {
  name: 'Editing',
  render: () => (
    <ExampleProvider>
      <Editing />
    </ExampleProvider>
  ),
  play: async () => {
    await settle()
  },
}

export const EditingModeInteraction: Story = {
  name: 'Editing, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Editing />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Move later: Sales' }))
    const cards = canvasElement.querySelectorAll('[data-launchpad-card]')
    await expect(cards[1]?.textContent).toContain('Sales')
    await expect(canvas.getByRole('heading', { name: 'Hidden (2)' })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Show: Reports' })).toBeVisible()
  },
}

/** The centre of an element, in the window's coordinates. */
function centreOf(element: Element) {
  const rect = element.getBoundingClientRect()
  return { clientX: rect.left + rect.width / 2, clientY: rect.top + rect.height / 2 }
}

/**
 * Dragging is live: the dragged card lifts and follows the pointer, the others slide out of the
 * way, a dashed placeholder shows where it lands — no grey ghost. The story drags Sales one place
 * later and drops it, then picks up Purchasing and holds it over the third place (the picture).
 * The move buttons stay the keyboard's way (WCAG 2.5.7).
 */
export const Dragging: Story = {
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <Editing />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const cards = () => [...canvasElement.querySelectorAll('[data-launchpad-card]')]
    const drag = async (from: number, to: number) => {
      const card = cards()[from]
      const target = cards()[to]
      if (card === undefined || target === undefined) throw new Error('no card')
      const start = centreOf(card)
      const end = centreOf(target)
      await fireEvent.pointerDown(card, { ...start, button: 0, pointerType: 'mouse' })
      await fireEvent.pointerMove(window, {
        clientX: start.clientX + 10,
        clientY: start.clientY + 6,
      })
      await fireEvent.pointerMove(window, end)
    }
    await drag(0, 1)
    await fireEvent.pointerUp(window)
    await settle()
    await expect(cards()[1]?.textContent).toContain('Sales')
    await expect(canvasElement.querySelector('[data-slot="launchpad-drop-placeholder"]')).toBeNull()
    // Hold Purchasing (now first) over the third place.
    await drag(0, 2)
    await settle()
    await expect(
      canvasElement.querySelector('[data-slot="launchpad-drop-placeholder"]'),
    ).not.toBeNull()
    await expect(canvasElement.querySelector('[data-dragging]')?.textContent).toContain(
      'Purchasing',
    )
  },
}

/** First load: skeleton cards. */
export const Loading: Story = { args: { loading: true } }

/** Long names and counters wrap inside the card. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    modules: [
      {
        ...moduleById('sales'),
        name: 'Sales and customer relationship management',
        description: 'Invoices, quotes, orders, customers, price lists and discounts',
        counter: '128 invoices to send to SEF',
      },
      ...MODULES.slice(1, 3),
    ],
  },
}

/** Phone width: one column. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <ExampleProvider>
        <Home {...args} phone />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic module names. */
export const Arabic: Story = {
  args: {
    modules: [
      {
        ...moduleById('sales'),
        name: 'المبيعات',
        description: 'الفواتير والعملاء',
        counter: '٣ للإرسال',
      },
      {
        ...moduleById('purchasing'),
        name: 'المشتريات',
        description: 'فواتير الموردين',
        counter: '٧ للموافقة',
      },
      { ...moduleById('assets'), name: 'الأصول الثابتة', locked: 'متاح في Pro' },
    ],
  },
  render: (args) => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <Home {...args} />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese module names. */
export const Japanese: Story = {
  args: {
    modules: [
      {
        ...moduleById('sales'),
        name: '販売',
        description: '請求書と顧客',
        counter: '送信待ち 3件',
      },
      {
        ...moduleById('purchasing'),
        name: '購買',
        description: '仕入先の請求書',
        counter: '承認待ち 7件',
      },
      { ...moduleById('assets'), name: '固定資産', locked: 'Pro で利用可能' },
    ],
  },
  render: (args) => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <Home {...args} />
      </ExampleProvider>
    </StoryProvider>
  ),
}
