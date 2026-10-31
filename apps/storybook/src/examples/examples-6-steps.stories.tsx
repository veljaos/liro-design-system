import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
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

/** Nothing in the phone frame scrolls sideways. */
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

/**
 * A binary file named .csv: the import says in words that it could not be read,
 * never shows the bytes, and Next waits for another file.
 */
export const CustomerImportUnreadableInteraction: Story = {
  name: 'Customer import, unreadable file, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={E_ROUTES.customerImport} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const input = canvasElement.querySelector<HTMLInputElement>('input[type="file"]')
    if (input === null) throw new Error('no file input')
    const bytes = new Uint8Array([0x50, 0x4b, 0x03, 0x04, 0x00, 0x01, 0xff, 0xfe, 0x00, 0x00])
    await userEvent.upload(input, new File([bytes], 'kupci.csv', { type: 'text/csv' }))
    await expect(await canvas.findByText(/kupci.csv could not be read/)).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Next' })).toBeDisabled()
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
 * Health: Jovana Nikolić books a check-up in Dom zdravlja Novi Sad's patient portal
 * (PortalShell) — the service and her chosen doctor, then a free time (SlotPicker), then Book.
 * The service is chosen from the clinic's 61 services in a CatalogPicker.
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
    await expect(canvas.getByRole('region', { name: 'Service' })).toHaveTextContent('Check-up')
    await expect(canvas.getByRole('button', { name: 'Choose another service…' })).toBeVisible()
  },
}

/**
 * The catalogue of services: most chosen, her recent ones, the recommended and those on
 * discount first; the levels (general practice, specialist exams, the laboratory …) below.
 */
export const HealthBookingCatalogue: Story = {
  name: 'Health, choosing a service',
  tags: ['!dev'],
  render: () => <ExampleApp start={H_ROUTES.bookChoose} />,
  play: async () => {
    await settle()
    const dialog = within(
      await within(document.body).findByRole('dialog', { name: /Choose a service/ }),
    )
    await expect(dialog.getByRole('listbox', { name: 'Your recent' })).toBeVisible()
    await expect(dialog.getByRole('button', { name: /^Laboratory.*services/ })).toBeVisible()
  },
}

export const HealthBookingCataloguePhone: Story = {
  name: 'Health, choosing a service, phone',
  tags: ['!dev'],
  render: () => <OnPhone start={H_ROUTES.bookChoose} />,
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

/** The whole booking from the keyboard and pointer, to the booked appointment. */
export const HealthBookingWalk: Story = {
  name: 'Health, booking, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={H_ROUTES.book} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    // The service from the catalogue: the laboratory has its own level; the search finds the
    // blood pressure control among the 61.
    await userEvent.click(canvas.getByRole('button', { name: 'Choose another service…' }))
    const dialog = within(
      await within(document.body).findByRole('dialog', { name: /Choose a service/ }),
    )
    // The dialog has finished coming in.
    await settle()
    await userEvent.click(dialog.getByRole('button', { name: /^Laboratory/ }))
    await expect(dialog.getByRole('button', { name: /^Blood draw/ })).toBeVisible()
    // A quiet "‹ All services" link back, no Cancel: the X closes it.
    await expect(dialog.queryByRole('button', { name: 'Cancel' })).toBeNull()
    await userEvent.click(dialog.getByRole('button', { name: 'Back to All services' }))
    await userEvent.type(dialog.getByRole('searchbox'), 'pressure')
    await userEvent.click(dialog.getByRole('option', { name: /^Blood pressure control/ }))
    await waitFor(async () => {
      await expect(within(document.body).queryByRole('dialog')).toBeNull()
    })
    await expect(canvas.getByRole('region', { name: 'Service' })).toHaveTextContent(
      'Blood pressure control',
    )
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
    await expect(
      canvas.getByRole('heading', { level: 1, name: 'Appointment booked' }),
    ).toBeVisible()
    await expect(canvasElement).toHaveTextContent('at 11:30')
  },
}
