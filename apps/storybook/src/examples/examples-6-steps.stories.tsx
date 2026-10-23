import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { createFormat } from '@veljaos/ui'
import { settle } from '../../../../packages/ui/src/primitives/story-helpers'
import { ExampleApp, OnPhone } from './example-app'
import { PAYROLL_TOTALS } from './data-F'
import { F_ROUTES } from './screens-F'
import { IMPORT_FILE } from './data-E'
import { E_ROUTES } from './screens-E'
import { H_ROUTES } from './screens-H'
import { EXAMPLE_FORMAT } from '../../../../packages/ui/src/components/story-frames'

const meta = {
  title: 'Examples/F6 Steps',
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          'F6 Steps (a wizard): the customer import, booking an appointment and the payroll run — one step at a time, Back keeps what was entered, nothing is saved before the last step.',
      },
    },
  },
  play: settle,
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

/** The first ancestor that has a box of its own (`display: contents` elements have none). */
function boxAround(element: Element | null): Element | null {
  let parent = element?.parentElement ?? null
  while (parent !== null && parent.getBoundingClientRect().width === 0)
    parent = parent.parentElement
  return parent
}

const SERBIAN = createFormat('sr-Latn-RS')

/** Payroll September 2026 at review: one warning, the totals of 46 employees, the period open. */
export const PayrollScreen: Story = {
  name: 'Payroll run',
  render: () => <ExampleApp start={F_ROUTES.payroll} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('1 warning')
    await expect(canvasElement).toHaveTextContent('Period open')
    for (const value of [
      PAYROLL_TOTALS.gross,
      PAYROLL_TOTALS.contributions,
      PAYROLL_TOTALS.tax,
      PAYROLL_TOTALS.net,
    ]) {
      await expect(canvasElement).toHaveTextContent(SERBIAN.number(value, { decimals: 2 }))
    }
  },
}

export const PayrollPhone: Story = {
  name: 'Payroll run, phone',
  render: () => <OnPhone start={F_ROUTES.payroll} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('Step 3 of 5 · Review')
    const page = canvasElement.querySelector('[data-slot="periodic-run-page"]')
    if (page === null) throw new Error('no page')
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
  },
}

/** The rerun asks for a reason, then the run goes back to Calculate. */
export const PayrollRerun: Story = {
  name: 'Payroll run, rerun',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={F_ROUTES.payroll} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Rerun' }))
    await settle()
    const dialog = within(document.body).getByRole('alertdialog')
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Corrected working hours' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Rerun' }))
    await settle()
    await expect(await canvas.findByText('0 of 46')).toBeVisible()
    await expect(canvas.getAllByText('Corrected working hours')[0]).toBeVisible()
    await expect(canvasElement.querySelector('[aria-current="step"]')).toHaveTextContent(
      'Calculate',
    )
  },
}

/** Nothing in the phone frame scrolls sideways (P4.9 rule 16). */
async function noSidewaysScroll(canvasElement: HTMLElement) {
  const frame = boxAround(canvasElement.querySelector('[data-slot="app-shell"]'))
  await expect(frame).not.toBeNull()
  await expect(frame?.scrollWidth ?? 0).toBeLessThanOrEqual(frame?.clientWidth ?? 0)
}

/**
 * Import: the file, the suggested columns, the validation preview (counts, the duplicate
 * warning for Panonija Agro d.o.o., problems in their cells), then the import with its progress.
 */
export const CustomerImportScreen: Story = {
  name: 'Customer import',
  render: () => <ExampleApp start={E_ROUTES.customerImport} />,
  play: async ({ canvasElement }) => {
    await settle()
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')
    if (input === null) throw new Error('no file input')
    await settle()
  },
}

export const CustomerImportScreenInteraction: Story = {
  name: 'Customer import, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={E_ROUTES.customerImport} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')
    if (input === null) throw new Error('no file input')
    await userEvent.upload(input, new File([IMPORT_FILE], 'kupci-stari-sistem.csv'))
    await expect(await canvas.findByText('kupci-stari-sistem.csv')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await expect(await canvas.findByText('Not imported: Napomena')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Next' }))
    await expect(await canvas.findByText('1.198 rows ready')).toBeVisible()
    await expect(canvas.getByText('3 duplicates')).toBeVisible()
    await expect(canvas.getByRole('link', { name: /Panonija Agro d.o.o./ })).toBeVisible()
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Skip rows with errors' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Import 1.198 rows' }))
    await expect(
      await canvas.findByText('1.198 customers imported', undefined, { timeout: 5000 }),
    ).toBeVisible()
    await settle()
  },
}

export const CustomerImportPhone: Story = {
  name: 'Customer import, phone',
  render: () => <OnPhone start={E_ROUTES.customerImport} />,
  play: async ({ canvasElement }) => {
    await settle()
    await noSidewaysScroll(canvasElement)
  },
}

/** The page does not scroll sideways (the wide grids scroll inside their own box). */
async function noPageOverflow(canvasElement: HTMLElement) {
  const main = canvasElement.querySelector('main')
  await expect(main === null ? 0 : main.scrollWidth - main.clientWidth).toBeLessThanOrEqual(0)
}

/**
 * Health (P5.17): Jovana Nikolić books a check-up in Dom zdravlja Novi Sad's patient portal
 * (PortalShell) — the service and her chosen doctor, then a free time (SlotPicker), then Book.
 */
export const HealthBooking: Story = {
  name: 'Health, book an appointment',
  render: () => <ExampleApp start={H_ROUTES.book} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Book an appointment' }),
    ).toBeVisible()
    await expect(canvas.getByRole('radio', { name: /Check-up/ })).toBeChecked()
  },
}

export const HealthBookingPhone: Story = {
  name: 'Health, book an appointment, phone',
  render: () => <OnPhone start={H_ROUTES.book} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).getByRole('button', { name: 'Continue' })).toBeVisible()
    await noPageOverflow(canvasElement)
  },
}

/** The whole booking from the keyboard and pointer, then on to the clinic's schedule. */
export const HealthBookingWalk: Story = {
  name: 'Health, booking, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={H_ROUTES.book} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Continue' }))
    await settle()
    // The slot's name: its time range and the day in words.
    const day = EXAMPLE_FORMAT.dateLong('2026-10-14')
    const radio = (await canvas.findAllByRole('radio')).find((each) => {
      const name = each.getAttribute('aria-label') ?? ''
      return name.startsWith('11:30') && name.includes(day)
    })
    if (radio === undefined) throw new Error('no 11:30 on 14.10.')
    await userEvent.click(radio)
    await expect(canvasElement).toHaveTextContent('at 11:30')
    await userEvent.click(canvas.getByRole('button', { name: 'Book' }))
    await settle()
    await expect(await canvas.findByText('Your appointment is booked')).toBeVisible()
    await userEvent.click(canvas.getByRole('link', { name: 'schedule of 14.10.2026' }))
    await settle()
    await expect(await canvas.findByRole('heading', { level: 1, name: 'Schedule' })).toBeVisible()
  },
}
