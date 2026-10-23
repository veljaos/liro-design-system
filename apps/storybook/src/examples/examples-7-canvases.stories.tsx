import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { createFormat, notice } from '@veljaos/ui'
import { settle } from '../../../../packages/ui/src/primitives/story-helpers'
import { ExampleApp, OnPhone } from './example-app'
import { PATIENT } from './data-H'
import { H_ROUTES } from './screens-H'
import { BAKERY, I_ROUTES, SALE_FIGURES } from './data-I'
import { K_ROUTES } from './data-K'
import { ganttReady } from '../../../../packages/ui/src/gantt/gantt-story-data'
import { AA_ROUTES } from './data-AA'

const meta = {
  title: 'Examples/F7 Canvases',
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          "F7 Special canvases, only where a list or a form cannot do: the doctor's calendar, the restaurant's floor plan with a table's tab, the POS checkout and the project timeline (Gantt).",
      },
    },
  },
  play: settle,
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

/** The page does not scroll sideways (the wide grids scroll inside their own box). */
async function noPageOverflow(canvasElement: HTMLElement) {
  const main = canvasElement.querySelector('main')
  await expect(main === null ? 0 : main.scrollWidth - main.clientWidth).toBeLessThanOrEqual(0)
}

/**
 * dr Marko Stanković's week (CalendarView), his appointments and the team meeting, seen on the
 * day of Jovana's appointment at 09:40: the week from Monday, "now" on Wednesday's column.
 */
export const HealthDoctorCalendar: Story = {
  name: 'Health, doctor’s calendar',
  render: () => <ExampleApp start={H_ROUTES.doctorCalendar} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(
      within(canvasElement).getByRole('button', {
        name: new RegExp(`${PATIENT.name}, Check-up`),
      }),
    ).toBeVisible()
    // English names, the tenant's digits, the week from Monday (P5.28 item 2); "now" marked.
    await expect(canvasElement.querySelector('[data-slot="calendar-view"] h2')).toHaveTextContent(
      '12.10.2026. – 18.10.2026.',
    )
    await expect(canvasElement).toHaveTextContent('Wednesday, October 14, 2026')
    await expect(within(canvasElement).getByRole('img', { name: 'Now, 09:40' })).toBeInTheDocument()
  },
}

export const HealthDoctorCalendarPhone: Story = {
  name: 'Health, doctor’s calendar, phone',
  render: () => <OnPhone start={H_ROUTES.doctorCalendar} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('dr Marko Stanković')
    await noPageOverflow(canvasElement)
  },
}

const SERBIAN_I = createFormat('sr-Latn-RS')

/**
 * An amount of the till as the bakery sees it ("1.907,00 RSD"), as the text matchers read the
 * page: every space (the no-break one too) as one.
 */
function tillText(value: string): string {
  return SERBIAN_I.money(value, BAKERY.currency).replace(/\s+/g, ' ')
}

/** The cart's main action by its name, "Charge 1.907,00 RSD", whatever space the format writes. */
function chargeName(value: string): RegExp {
  const text = `Charge ${tillText(value)}`.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${text.replace(/ /g, '\\s')}$`)
}

/** Nothing on the screen scrolls sideways. */
async function expectNoSidewaysScroll(canvasElement: HTMLElement) {
  for (const element of canvasElement.querySelectorAll<HTMLElement>(
    '[data-slot="pos-shell"], [data-slot="pick-list"], [data-slot="stock-count"]',
  )) {
    await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth)
  }
}

/**
 * The till of Pekara Zlatni klas in Novi Sad (Kasa 1, Snežana Kovačević) on a landscape tablet,
 * in the touch density: the products by category with a scan field above them, the cart of six
 * lines with the loyalty card's 10% on the cakes (1.995,00 − 88,00 = 1.907,00 RSD, VAT included
 * per category), "Charge 1.907,00 RSD" last. No application header: the till is one task.
 */
export const PosCheckout: Story = {
  name: 'POS checkout, Pekara Zlatni klas',
  render: () => <ExampleApp start={I_ROUTES.pos} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('region', { name: 'Register status' })).toHaveTextContent(
      BAKERY.register,
    )
    await expect(canvasElement).toHaveTextContent('6 items')
    await expect(canvas.getByRole('textbox', { name: 'Quantity, Krempita' })).toHaveValue('4')
    await expect(canvasElement).toHaveTextContent(
      `Loyalty discount 10%: ${tillText(`-${SALE_FIGURES.discounts}`)}`,
    )
    await expect(canvas.getByRole('button', { name: chargeName(SALE_FIGURES.total) })).toBeVisible()
    await expect(canvas.getByRole('button', { name: /^Raženi hleb/ })).toHaveAttribute(
      'aria-disabled',
      'true',
    )
    await expectNoSidewaysScroll(canvasElement)
  },
}

/**
 * A barcode read into the scan field adds the orange juice (the till sums: 2.057,00 RSD); a
 * second kifla adds to its line; an unknown code is a problem in words.
 */
export const PosScanInteraction: Story = {
  name: 'POS checkout, scanning, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={I_ROUTES.pos} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const field = canvas.getByRole('textbox', { name: 'Barcode or PLU' })
    await userEvent.type(field, '8600417000528{Enter}')
    await expect(await canvas.findByText('Sok od pomorandže added')).toBeVisible()
    await expect(canvas.getByRole('textbox', { name: 'Quantity, Sok od pomorandže' })).toHaveValue(
      '1',
    )
    await expect(canvas.getByRole('button', { name: chargeName('2057') })).toBeVisible()
    await userEvent.type(field, '8600417000207{Enter}')
    await waitFor(async () => {
      await expect(canvas.getByRole('textbox', { name: 'Quantity, Kifla' })).toHaveValue('7')
    })
    await expect(canvas.getByRole('button', { name: chargeName('2082') })).toBeVisible()
    await userEvent.type(field, '8600999999999{Enter}')
    await expect(await canvas.findByText('Unknown code 8600999999999')).toBeVisible()
  },
}

/** Charge, the 2.000,00 banknote, Complete payment, then the receipt. */
export const PosPayInteraction: Story = {
  name: 'POS checkout, paying cash, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={I_ROUTES.pos} />,
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(
      within(canvasElement).getByRole('button', {
        name: chargeName(SALE_FIGURES.total),
      }),
    )
    const dialog = await within(document.body).findByRole('dialog', { name: 'Payment' })
    await userEvent.click(within(dialog).getByRole('button', { name: /^2\.000/ }))
    await expect(dialog).toHaveTextContent(tillText(SALE_FIGURES.change))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Complete payment' }))
    await expect(await within(dialog).findByText('Payment complete')).toBeVisible()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Show receipt' }))
    const receipt = await within(document.body).findByRole('dialog', {
      name: `Receipt ${BAKERY.receipt}`,
    })
    await expect(receipt).toHaveTextContent(tillText(SALE_FIGURES.total))
    await settle()
  },
}

/** Phone: the cart first, "Products" above it opening the products as a bottom sheet. */
export const PosPhone: Story = {
  name: 'POS checkout, phone',
  render: () => <OnPhone start={I_ROUTES.pos} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: 'Products' })).toBeVisible()
    await expect(
      canvas.getByRole('button', { name: chargeName(SALE_FIGURES.total) }),
    ).toBeInTheDocument()
    await expectNoSidewaysScroll(canvasElement)
  },
}

const SERBIAN_K = createFormat('sr-Latn-RS')

/** A table on a floor plan by its id. */
function floorItem(canvasElement: HTMLElement, id: string): HTMLElement {
  const element = canvasElement.querySelector<HTMLElement>(`[data-floor-item="${id}"]`)
  if (element === null) throw new Error(`no item ${id}`)
  return element
}

/** Nothing on the screen scrolls sideways (the plan scrolls inside its own box). */
async function expectNoPageScroll(canvasElement: HTMLElement) {
  for (const element of canvasElement.querySelectorAll<HTMLElement>(
    '[data-slot="floor-plan"], [data-slot="seating-chart"], [data-slot="pos-shell"]',
  )) {
    await expect(element.scrollWidth).toBeLessThanOrEqual(element.clientWidth)
  }
}

/**
 * Bistro Dunav at 19:40 on a Tuesday: the hall, the terrace and the bar, each table in the
 * restaurant's state — free, occupied (how many, since when), reserved (for when, how many),
 * one waiting to be cleaned. Table 7 is chosen: its party and "Move to table…".
 */
export const RestaurantService: Story = {
  name: 'Restaurant service, Bistro Dunav',
  render: () => <ExampleApp start={K_ROUTES.floorTable} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(floorItem(canvasElement, 't7')).toHaveAttribute('aria-pressed', 'true')
    await expect(floorItem(canvasElement, 't3')).toHaveAccessibleName(
      'Table 3, 20:00 · 4 guests, Reserved, 4 seats, Sala',
    )
    await expect(canvas.getByRole('heading', { name: /^Table 7/ })).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Move to table…' })).toBeVisible()
    await expectNoPageScroll(canvasElement)
  },
}

/** On a phone: the chosen table first, then the floor as a list by area. */
export const RestaurantServicePhone: Story = {
  name: 'Restaurant service, Bistro Dunav, phone',
  render: () => <OnPhone start={K_ROUTES.floorTable} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('heading', { name: 'Terasa' })).toBeInTheDocument()
    await expectNoPageScroll(canvasElement)
  },
}

const BISTRO_TAB_7 = '/restaurant/bistro-dunav/tables/t7'

/** A static story's checks on the canvas (the desktop's 1280 × 720). */
function deskPlay(
  check: (canvasElement: HTMLElement) => Promise<void>,
): NonNullable<Story['play']> {
  return async ({ canvasElement }) => {
    await settle()
    await check(canvasElement)
    // The page at rest before the accessibility check: a hover or a fade that the last step
    // started is measured at its end, not halfway (P5.31).
    await settle()
  }
}

/** The same checks on a phone, and nothing scrolls sideways. */
function phonePlay(
  check: (canvasElement: HTMLElement) => Promise<void>,
): NonNullable<Story['play']> {
  return async ({ canvasElement }) => {
    await settle()
    await check(canvasElement)
    await expectNoSidewaysScroll(canvasElement)
    await settle()
  }
}

/** Bistro Dunav's table 7: food from the kitchen, drinks from the bar, the dessert promotion. */
const RESTAURANT_TAB_CHECK = async (canvasElement: HTMLElement) => {
  await expect(canvasElement).toHaveTextContent('Sent to the kitchen · 19:01')
  await expect(canvasElement).toHaveTextContent('Dessert of the day −15%')
  await expect(canvasElement).toHaveTextContent('One without onion')
}

export const RestaurantTab: Story = {
  name: 'Restaurant tab, table 7',
  render: () => <ExampleApp start={BISTRO_TAB_7} />,
  play: deskPlay(RESTAURANT_TAB_CHECK),
}

export const RestaurantTabPhone: Story = {
  name: 'Restaurant tab, table 7, phone',
  render: () => <OnPhone start={BISTRO_TAB_7} />,
  play: phonePlay(RESTAURANT_TAB_CHECK),
}

/** Bistro Dunav: table 7's tab from the floor, a krempita added, back on the floor its total. */
export const RestaurantTabInteraction: Story = {
  name: 'Restaurant tab, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={K_ROUTES.floorTable} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Tab' }))
    await expect(await canvas.findByRole('heading', { name: 'Table 7' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: /^Krempita/ }))
    await expect(canvas.getByRole('button', { name: 'Send order (3)' })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Floor' }))
    await userEvent.click(await waitFor(() => floorItem(canvasElement, 't7')))
    await expect(await canvas.findByRole('button', { name: 'Tab' })).toBeVisible()
    await expect(canvasElement).toHaveTextContent(
      SERBIAN_K.money('9534', 'RSD').replace(/\s+/g, ' '),
    )
  },
}

/**
 * Kvadrat Gradnja's "Residential building Liman 4" on 14.10.2026 (P5.37): the figures, then the
 * plan — nine phases with their tasks and milestones, each phase's budget and what was spent
 * beside the timeline, today's marker, Floors 3–4 at risk. Every row has its Change menu.
 */
const PROJECT_TIMELINE_CHECK = async (canvasElement: HTMLElement) => {
  await ganttReady(canvasElement)
  const canvas = within(canvasElement)
  await expect(
    canvas.getByRole('heading', { level: 1, name: 'Residential building Liman 4' }),
  ).toBeVisible()
  await expect(canvasElement).toHaveTextContent('249.000.000,00')
}

export const ProjectTimeline: Story = {
  name: 'Project timeline',
  render: () => <ExampleApp start={AA_ROUTES.timeline} />,
  play: async ({ canvasElement }) => {
    await PROJECT_TIMELINE_CHECK(canvasElement)
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('rowheader', { name: /^Task: Floors 3–4, in Structure, .*At risk/ }),
    ).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Change Floors 3–4' })).toBeVisible()
    await expect(
      canvas.getByRole('img', { name: /^Now, 14\.10\.2026\. 09:40$/ }),
    ).toBeInTheDocument()
  },
}

export const ProjectTimelinePhone: Story = {
  name: 'Project timeline, phone',
  render: () => <OnPhone start={AA_ROUTES.timeline} />,
  play: async ({ canvasElement }) => {
    await PROJECT_TIMELINE_CHECK(canvasElement)
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { name: 'Structure' })).toBeVisible()
    await expect(canvas.getByText('Open this plan on a larger screen to change it.')).toBeVisible()
  },
}

/**
 * The keyboard way of a drag: Change → Move…, a new start two weeks later, Move. The application
 * applies it (Structure still ends on 27.11.) and confirms it.
 */
export const ProjectTimelineMoveInteraction: Story = {
  name: 'Project timeline, move by keyboard, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={AA_ROUTES.timeline} />,
  play: async ({ canvasElement }) => {
    await ganttReady(canvasElement)
    const canvas = within(canvasElement)
    const page = within(document.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Change Floors 3–4' }))
    await userEvent.click(await page.findByRole('menuitem', { name: 'Move…' }))
    const dialog = await page.findByRole('dialog', { name: /Move\s*Floors 3–4/ })
    const start = within(dialog).getByRole('textbox', { name: /New start/ })
    await userEvent.clear(start)
    await userEvent.type(start, '19.10.2026.')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Move' }))
    await page.findByText(/^Floors 3–4 now runs 19\.10\.2026\. – 13\.11\.2026\.$/)
    await waitFor(
      async () => {
        await expect(page.queryByRole('dialog')).toBeNull()
        await expect(
          canvas.getByRole('rowheader', {
            name: /^Task: Floors 3–4, in Structure, 19\.10\.2026\./,
          }),
        ).toBeInTheDocument()
      },
      { timeout: 5_000 },
    )
    notice.dismiss()
  },
}
