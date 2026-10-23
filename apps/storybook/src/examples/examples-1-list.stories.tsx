import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../../../../packages/ui/src/primitives/story-helpers'
import { ExampleApp, OnPhone } from './example-app'
import { ROUTES } from './example-shell'
import { E_ROUTES } from './screens-E'

const meta = {
  title: 'Examples/F1 List',
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          'F1 List (ListPage): saved views, search and filters in one card, the table, bulk actions, search all (LookupDialog), bulk edit (BulkEditDrawer) and the import entry. A list never computes: the application sorts, filters and counts.',
      },
    },
  },
  play: settle,
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

/** The invoice list: views, filters, columns, quick preview (click), the page (Enter or Open). */
export const InvoiceListScreen: Story = {
  name: 'Invoice list',
  render: () => <ExampleApp start={ROUTES.invoices} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    // Cancelled by ST-2026-0004: shown as Cancelled, never overdue, owing nothing.
    const cancelled = await canvas.findByRole('row', { name: /F-2026-0407/ })
    await expect(cancelled).toHaveTextContent('Cancelled')
    await expect(cancelled).not.toHaveTextContent(/overdue/i)
    await settle()
  },
}

export const InvoiceListScreenInteraction: Story = {
  name: 'Invoice list, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={ROUTES.invoices} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    // Cancelled by ST-2026-0004: shown as Cancelled, never overdue, owing nothing.
    const cancelled = await canvas.findByRole('row', { name: /F-2026-0407/ })
    await expect(cancelled).toHaveTextContent('Cancelled')
    await expect(cancelled).not.toHaveTextContent(/overdue/i)
    await userEvent.click(cancelled)
    await settle()
    let preview = within(document.body).getByRole('dialog', { name: 'F-2026-0407' })
    await expect(preview).toHaveTextContent(/Amount due\s*0,00\s*RSD/)
    await userEvent.keyboard('{Escape}')
    await settle()
    // Decreased by KO-2026-0009: the total after the decrease, and what is still due.
    const decreased = canvas.getByRole('row', { name: /F-2026-0410/ })
    await expect(decreased).toHaveTextContent('167.762,75')
    await expect(decreased).not.toHaveTextContent('186.420,35')
    await userEvent.click(decreased)
    await settle()
    preview = within(document.body).getByRole('dialog', { name: 'F-2026-0410' })
    await expect(preview).toHaveTextContent(/Amount due\s*67\.762,75\s*RSD/)
    await userEvent.keyboard('{Escape}')
    await settle()
  },
}

export const InvoiceListPhone: Story = {
  name: 'Invoice list, phone',
  render: () => <OnPhone start={ROUTES.invoices} />,
}

/** The first ancestor that has a box of its own (`display: contents` elements have none). */
function boxAround(element: Element | null): Element | null {
  let parent = element?.parentElement ?? null
  while (parent !== null && parent.getBoundingClientRect().width === 0)
    parent = parent.parentElement
  return parent
}

/** Nothing in the phone frame scrolls sideways (P4.9 rule 16). */
async function noSidewaysScroll(canvasElement: HTMLElement) {
  const frame = boxAround(canvasElement.querySelector('[data-slot="app-shell"]'))
  await expect(frame).not.toBeNull()
  await expect(frame?.scrollWidth ?? 0).toBeLessThanOrEqual(frame?.clientWidth ?? 0)
}

/**
 * The customer catalogue: the dataset's customers and 50,000 generated ones, virtualised
 * (only the rows in view are drawn); views Active / Inactive / All with counts; inactive
 * customers are hidden, never deleted, and marked "Inactive" after the name where the list mixes
 * both (All) — not on the Inactive view, whose tab already says it (P5.23).
 */
export const CustomersScreen: Story = {
  name: 'Customers',
  render: () => <ExampleApp start={E_ROUTES.customers} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const row = await canvas.findByRole('row', { name: /Panonija Agro d.o.o./ })
    await expect(row).toHaveTextContent('383.763,12')
    await expect(canvasElement.querySelectorAll('tbody tr[aria-rowindex]').length).toBeLessThan(60)
    await settle()
  },
}

export const CustomersScreenInteraction: Story = {
  name: 'Customers, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={E_ROUTES.customers} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const row = await canvas.findByRole('row', { name: /Panonija Agro d.o.o./ })
    await expect(row).toHaveTextContent('383.763,12')
    await expect(canvasElement.querySelectorAll('tbody tr[aria-rowindex]').length).toBeLessThan(60)
    await userEvent.click(canvas.getByRole('button', { name: /^Inactive/ }))
    const rakic = await canvas.findByRole('row', { name: /Rakić Pekara SZR/ })
    await expect(within(rakic).queryByText('Inactive')).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: /^All/ }))
    const mixed = await canvas.findByRole('row', { name: /Rakić Pekara SZR/ })
    await expect(within(mixed).getByText('Inactive')).toBeVisible()
  },
}

/**
 * A catalogue list sorts by its columns and filters by several values (P5.23): customers in Kać
 * or Niš, the largest open balance first; the application sorts (amounts exactly).
 */
export const CustomersSortAndFilter: Story = {
  name: 'Customers, sort and filter',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={E_ROUTES.customers} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const city = await canvas.findByRole('combobox', { name: 'City' })
    await userEvent.click(city)
    await userEvent.type(city, 'Kać', { delay: 0 })
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await userEvent.type(city, 'Niš', { delay: 0 })
    await userEvent.keyboard('{ArrowDown}{Enter}{Escape}')
    await waitFor(async () => {
      await expect(canvas.queryByRole('row', { name: /Vojvođanka Mlin/ })).toBeNull()
    })
    await expect(canvas.getByRole('row', { name: /Panonija Agro d.o.o./ })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Open balance' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Open balance' }))
    await waitFor(async () => {
      await expect(canvas.getByRole('columnheader', { name: 'Open balance' })).toHaveAttribute(
        'aria-sort',
        'descending',
      )
    })
    await settle()
  },
}

/** Three customers selected: the bulk bar is a row of its own, 12px from the filters and the table. */
export const CustomersSelected: Story = {
  name: 'Customers, selected',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={E_ROUTES.customers} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    for (const name of ['Panonija Agro d.o.o.', 'Drina Prevoz d.o.o.', 'Medic Lab Niš d.o.o.']) {
      await userEvent.click(await canvas.findByRole('checkbox', { name: `Select ${name}` }))
    }
    await expect(await canvas.findByText('3 selected')).toBeVisible()
    await expect(canvas.getByRole('button', { name: /^Select all/ })).toBeVisible()
    await settle()
  },
}

export const CustomersPhone: Story = {
  name: 'Customers, phone',
  render: () => <OnPhone start={E_ROUTES.customers} />,
  play: async ({ canvasElement }) => {
    await settle()
    await expect(await within(canvasElement).findByText('Panonija Agro d.o.o.')).toBeVisible()
    await noSidewaysScroll(canvasElement)
  },
}

/** Bulk edit: two customers selected, "Edit 2 records", the payment term set to 30 days for both. */
export const CustomersBulkEdit: Story = {
  name: 'Customers, bulk edit',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={E_ROUTES.customers} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const page = within(document.body)
    await userEvent.click(
      await canvas.findByRole('checkbox', { name: 'Select Panonija Agro d.o.o.' }),
    )
    await userEvent.click(canvas.getByRole('checkbox', { name: 'Select Drina Prevoz d.o.o.' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Edit 2 records' }))
    const drawer = within(await page.findByRole('dialog', { name: 'Edit 2 records' }))
    await userEvent.click(drawer.getByRole('checkbox', { name: 'Payment term' }))
    await userEvent.click(drawer.getByRole('button', { name: 'Apply to 2 records' }))
    const confirm = within(await page.findByRole('alertdialog', { name: 'Change 2 records?' }))
    await userEvent.click(confirm.getByRole('button', { name: 'Change' }))
    await waitFor(async () => {
      await expect(page.queryByRole('dialog')).toBeNull()
      await expect(page.queryByRole('alertdialog')).toBeNull()
    })
    await settle()
    // Drina Prevoz's payment term was 7 days; it is now 30.
    const drina = await canvas.findByRole('row', { name: /Drina Prevoz d.o.o./ })
    await expect(within(drina).getByRole('cell', { name: '30' })).toBeVisible()
  },
}

/** Deactivating hides a customer from Active and shows it under Inactive; nothing is deleted. */
export const CustomersDeactivate: Story = {
  name: 'Customers, deactivate',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={E_ROUTES.customers} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(
      await canvas.findByRole('button', { name: 'Actions: Drina Prevoz d.o.o.' }),
    )
    await userEvent.click(
      await within(document.body).findByRole('menuitem', { name: 'Deactivate' }),
    )
    await waitFor(async () => {
      await expect(canvas.queryByRole('row', { name: /Drina Prevoz/ })).toBeNull()
    })
    await userEvent.click(canvas.getByRole('button', { name: /^Inactive/ }))
    await expect(await canvas.findByRole('row', { name: /Drina Prevoz/ })).toBeVisible()
  },
}

/**
 * "Search all…" opens the whole catalogue in the LookupDialog (the integrator wires the
 * LookupField's last entry to it): type, ArrowDown, Enter chooses — here the list then shows
 * the chosen customer (its tax number in the search).
 */
export const CustomersLookup: Story = {
  name: 'Customers, search all',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={E_ROUTES.customers} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const page = within(document.body)
    await userEvent.click(await canvas.findByRole('button', { name: 'Search all…' }))
    const dialog = within(await page.findByRole('dialog', { name: 'Customers' }))
    const search = dialog.getByRole('textbox', { name: 'Name, tax number or city' })
    await waitFor(async () => {
      await expect(search).toHaveFocus()
    })
    await userEvent.type(search, 'vojvo')
    // The application's results for "vojvo" have replaced the first page.
    await waitFor(async () => {
      await expect(dialog.queryByRole('row', { name: /Panonija Agro/ })).toBeNull()
    })
    await expect(dialog.getByRole('row', { name: /Vojvođanka Mlin a.d./ })).toBeVisible()
    await userEvent.keyboard('{ArrowDown}{Enter}')
    await waitFor(async () => {
      await expect(page.queryByRole('dialog')).toBeNull()
    })
    await settle()
    await expect(canvas.getByRole('textbox', { name: 'Name, tax number or city' })).toHaveValue(
      '100421987',
    )
    await expect(
      await canvas.findByRole('row', { name: /Vojvođanka Mlin a.d./ }),
    ).toHaveTextContent('61.204,75')
  },
}
