import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { notice } from '@veljaos/ui'
import { settle } from '../../../../packages/ui/src/primitives/story-helpers'
import { FEATURED } from './examples-story-data'
import { ExampleApp, OnPhone } from './example-app'
import { ROUTES } from './example-shell'
import { E_ROUTES } from './screens-E'
import { AK_ROUTES } from './data-AK'
import { AL_ROUTES } from './data-AL'
import { BR_ROUTES } from './data-BR'

const meta = {
  title: 'Examples/F5 Overview and analysis',
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          'F5 Overview and analysis (DashboardPage / ReportPage / StatutoryFormPage / Pivot): the overview dashboard, the trial balance as a report, the VAT return as an official form and the cost analysis as a pivot.',
      },
    },
  },
  play: settle,
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

/** The overview: numbers, charts and the largest open invoices (F-2026-0412 links to its page). */
export const DashboardScreen: Story = {
  name: 'Overview (dashboard)',
  render: () => <ExampleApp start={ROUTES.dashboard} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const link = canvas.getByRole('link', { name: FEATURED })
    await expect(link.closest('tr')).toHaveTextContent('Panonija Agro d.o.o.')
    await expect(link.closest('tr')).toHaveTextContent('185.954,00')
    await expect(link.closest('tr')).toHaveTextContent('135.954,00')
    // Overdue receivables: F-2026-0411 only; cancelled F-2026-0407 counts nowhere.
    const overdue = canvas.getByText('Overdue receivables').closest('[data-slot="stat-card"]')
    await expect(overdue).toHaveTextContent('58.440,00')
    await expect(overdue).toHaveTextContent('1 invoice')
    await expect(overdue).not.toHaveTextContent('152.940,00')
    await expect(canvasElement).not.toHaveTextContent('F-2026-0407')
    // F-2026-0410 owes what is left after decrease KO-2026-0009 and the payment.
    const decreased = canvas.getByRole('row', { name: /F-2026-0410/ })
    await expect(decreased).toHaveTextContent('167.762,75')
    await expect(decreased).toHaveTextContent('67.762,75')
  },
}

export const DashboardPhone: Story = {
  name: 'Overview (dashboard), phone',
  render: () => <OnPhone start={ROUTES.dashboard} />,
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
 * The VAT return for September 2026 as its form grid (an illustrative PP PDV / POPDV-like form,
 * P5.28 item 19): the rates over Base and VAT, nested numbered groups (1.2 collapsed), one-column
 * parts, absent cells blank; 1.1.1 from SEF opens the invoices (F-2026-0412 among them); typed
 * cells as fields; 3.1.1's VAT overridden by Ivana Stojanović, one failing check.
 */
export const VatReturnScreen: Story = {
  name: 'VAT return',
  render: () => <ExampleApp start={E_ROUTES.vatReturn} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('1 check failed · 3 checks passed')).toBeVisible()
    await expect(canvas.getByText('By Ivana Stojanović on 05.10.2026. 14:12')).toBeVisible()
    await expect(
      canvas.getAllByText('Difference: 64.400,00 RSD', { exact: false })[0],
    ).toBeVisible()
    await expect(canvas.getAllByRole('columnheader', { name: 'Општа стопа 20%' })).toHaveLength(2)
    await settle()
  },
}

export const VatReturnScreenInteraction: Story = {
  name: 'VAT return, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={E_ROUTES.vatReturn} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const page = within(document.body)
    await expect(canvas.getByText('1 check failed · 3 checks passed')).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', {
        name: /^510\.809,60\sRSD, sources of 1\.1\.1 · Општа стопа 20% · Основица$/,
      }),
    )
    const drawer = within(
      await page.findByRole('dialog', { name: /^Source documents 1\.1\.1 Промет/ }),
    )
    await settle()
    await expect(drawer.getByRole('link', { name: /F-2026-0412/ })).toBeVisible()
    await expect(drawer.getByText('144.920,00 RSD')).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await waitFor(async () => {
      await expect(page.queryByRole('dialog')).toBeNull()
    })
    // 4.1 = 1.1.6 + 1.2.1 and 4.3 = 4.1 − 4.2, as the Core computed them.
    await expect(canvasElement).toHaveTextContent('122.551,92')
    await expect(canvasElement).toHaveTextContent('49.904,32')
    // "Go to" focuses the failing total.
    await userEvent.click(canvas.getByRole('button', { name: 'Go to 3.1.4' }))
    await waitFor(async () => {
      await expect(document.activeElement).toHaveTextContent('72.647,60')
    })
  },
}

export const VatReturnPhone: Story = {
  name: 'VAT return, phone',
  render: () => <OnPhone start={E_ROUTES.vatReturn} />,
  play: async ({ canvasElement }) => {
    await settle()
    await noSidewaysScroll(canvasElement)
  },
}

/** Settles, checks, and on a phone checks that no page scrolls sideways. */
function ledgerPlay(
  check: (canvasElement: HTMLElement) => Promise<void>,
  phone = false,
): NonNullable<Story['play']> {
  return async ({ canvasElement }) => {
    await settle()
    await check(canvasElement)
    if (phone) {
      for (const page of canvasElement.querySelectorAll<HTMLElement>('[data-liro-phone-page]')) {
        await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
      }
    }
  }
}

/**
 * P5.45: the trial balance on 14.10.2026 on the statutory grid: one part per class, the synthetic
 * accounts as numbered groups, Opening / Turnover / Closing over Debit / Credit; every figure
 * opens the account's card; the Core's three checks passed; "Compare with 14.10.2025.".
 */
const TRIAL_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(
    canvas.getByRole('heading', { level: 1, name: 'Trial balance, 01.01.–14.10.2026.' }),
  ).toBeVisible()
  await expect(canvas.getByText('3 checks passed', { exact: false })).toBeVisible()
  await expect(canvas.getAllByText('Customers in the country').length).toBeGreaterThan(0)
}

export const TrialBalance: Story = {
  name: 'Trial balance',
  render: () => <ExampleApp start={AL_ROUTES.trial} />,
  play: ledgerPlay(TRIAL_CHECK),
}

export const TrialBalancePhone: Story = {
  name: 'Trial balance, phone',
  render: () => <OnPhone start={AL_ROUTES.trial} />,
  play: ledgerPlay(TRIAL_CHECK, true),
}

/** A figure opens its source: the account's card, linked from the drawer. */
export const TrialBalanceDrillDown: Story = {
  name: 'Trial balance, a figure’s source, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={AL_ROUTES.trial} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(
      canvas.getByRole('button', { name: /sources of 2040 · Closing 14\.10\.2026\. · Debit$/ }),
    )
    const drawer = await within(document.body).findByRole('dialog', { name: /Source documents/ })
    await expect(within(drawer).getByRole('link', { name: /2040/ })).toHaveAttribute(
      'href',
      `#${AK_ROUTES.card('2040')}`,
    )
  },
}

/** P5.77: a screen's checks, and on a phone no sideways scroll of the page. */
function brPlay(
  check: (canvasElement: HTMLElement) => Promise<void>,
  phone = false,
): NonNullable<Story['play']> {
  return async ({ canvasElement }) => {
    await settle()
    await check(canvasElement)
    if (phone) {
      for (const page of canvasElement.querySelectorAll<HTMLElement>('[data-liro-phone-page]')) {
        await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
      }
    }
  }
}

/**
 * P5.77: Kvadrat Gradnja d.o.o.'s cost analysis — sites and their cost accounts down, July to
 * September across with the amount and the number of supplier invoices, the totals; the chooser
 * beside it (on a phone behind "Fields"); a figure opens its invoices.
 */
const BR_COSTS_CHECK = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  await expect(canvas.getByRole('heading', { level: 1, name: 'Cost analysis' })).toBeVisible()
  const grid = canvas.getByRole('treegrid', { name: 'Costs by site and month' })
  await expect(within(grid).getByRole('rowheader', { name: 'Liman 4' })).toBeVisible()
  await expect(within(grid).getByRole('columnheader', { name: 'Sep 2026' })).toBeVisible()
}

export const BrCostAnalysis: Story = {
  name: 'Cost analysis',
  render: () => <ExampleApp start={BR_ROUTES.costs} />,
  play: brPlay(BR_COSTS_CHECK),
}

export const BrCostAnalysisPhone: Story = {
  name: 'Cost analysis, phone',
  render: () => <OnPhone start={BR_ROUTES.costs} />,
  play: brPlay(BR_COSTS_CHECK, true),
}

/** A press on a figure opens its invoices; the export is reported. */
export const BrCostAnalysisOpen: Story = {
  name: 'Cost analysis, open a figure, interaction',
  tags: ['interaction', '!dev'],
  render: () => <ExampleApp start={BR_ROUTES.costs} />,
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(document.body)
    const grid = canvas.getByRole('treegrid')
    // Every site has a 5120 Material row: Liman 4's is the first.
    const row = within(grid).getAllByRole('rowheader', { name: '5120 Material' })[0]?.closest('tr')
    const first = row === null || row === undefined ? null : within(row).getAllByRole('gridcell')[0]
    if (first === undefined || first === null) throw new Error('no figure')
    await userEvent.click(first)
    const drawer = await body.findByRole('dialog', { name: /Supplier invoices\s*Liman 4/ })
    const table = within(drawer).getByRole('table', { name: 'Supplier invoices' })
    // The header row and at least one invoice.
    await expect(within(table).getAllByRole('row').length).toBeGreaterThan(1)
    await userEvent.keyboard('{Escape}')
    await waitFor(async () => {
      await expect(body.queryByRole('dialog')).toBeNull()
    })
    await userEvent.click(canvas.getByRole('button', { name: 'Export' }))
    await userEvent.click(await body.findByRole('menuitem', { name: 'Excel workbook (.xlsx)' }))
    await expect(
      await body.findByText('Cost analysis is being exported as Excel workbook (.xlsx).'),
    ).toBeVisible()
    notice.dismiss()
    await waitFor(
      async () => {
        await expect(document.querySelector('[data-sonner-toast]')).toBeNull()
      },
      { timeout: 5000 },
    )
  },
}
