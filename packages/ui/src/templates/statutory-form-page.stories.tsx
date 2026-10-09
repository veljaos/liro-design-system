import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '../components/button'
import { ARABIC, JAPANESE, LONG } from '../components/field-story-data'
import { MoneyField } from '../components/number-field'
import { StatusBadge } from '../components/status-badge'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { createFormat } from '../provider/format'
import type { StatutoryRule } from './register-logic'
import { fifth, PURCHASES_20, SALES_20, VAT_VALUES } from './register-story-data'
import {
  StatutoryFormPage,
  type StatutoryOverride,
  type StatutorySection,
} from './statutory-form-page'

const SERBIAN = createFormat('sr-Latn-RS')
/** The invoices' states in the dataset (P4.8). */
const STATES: Record<string, ReactNode> = {
  'F-2026-0412': <StatusBadge label="Sent" tone="info" />,
  'F-2026-0411': <StatusBadge label="Overdue" tone="danger" />,
  'F-2026-0409': <StatusBadge label="Paid" tone="success" />,
  'F-2026-0407': <StatusBadge label="Overdue" tone="danger" />,
  'F-2026-0404': <StatusBadge label="Paid" tone="success" />,
  'F-2026-0403': <StatusBadge label="Sent" tone="info" />,
}

const STEPS = [
  { key: 'draft', label: 'Draft' },
  { key: 'checked', label: 'Checked' },
  { key: 'submitted', label: 'Submitted' },
]

/** The rules and the Core's results for September (one fails after Ivana's override). */
function rulesFor(input: string): StatutoryRule[] {
  const failed = input !== VAT_VALUES.inputVat.computed
  return [
    { id: 'r1', text: '5.1 must equal 3.2 + 4.2', fields: ['5.1'], result: 'passed' },
    { id: 'r2', text: '5.2 must equal 3.6 + 4.6', fields: ['5.2'], result: 'passed' },
    {
      id: 'r3',
      text: '8e.6 must equal 8a.2 + 8b.2',
      fields: ['8e.6', '8a.2'],
      result: failed ? 'failed' : 'passed',
      ...(failed
        ? {
            detail: `Difference: ${SERBIAN.money(VAT_VALUES.difference, 'RSD')}`,
          }
        : {}),
    },
    { id: 'r4', text: '10.1 must equal 5.2 − 8e.6', fields: ['10.1'], result: 'passed' },
    {
      id: 'r5',
      text: '3.6 should be 20% of 3.2',
      fields: ['3.6'],
      result: 'passed',
    },
  ]
}

/** The form as the Core sends it; `input` is 8a.2's value, `override` who changed it. */
function sectionsFor(
  input: string,
  override: StatutoryOverride | undefined,
  editor: ReactNode,
  label = 'Tax base, general rate (20%)',
): StatutorySection[] {
  return [
    {
      key: '2',
      title: '2. Exempt supplies without the right to deduct',
      fields: [
        {
          id: '2.1',
          number: '2.1',
          label: 'Exempt supplies (returnable deposits)',
          value: VAT_VALUES.exempt.current,
          previous: VAT_VALUES.exempt.previous,
          sources: [
            {
              key: 'f412',
              type: 'Invoice',
              number: 'F-2026-0412',
              href: '#invoices/F-2026-0412',
              date: '2026-09-28',
              amount: '2700.00',
              status: STATES['F-2026-0412'],
            },
          ],
        },
      ],
    },
    {
      key: '3',
      title: '3. Taxable supplies at the general rate',
      fields: [
        {
          id: '3.2',
          number: '3.2',
          label,
          value: VAT_VALUES.base20.current,
          previous: VAT_VALUES.base20.previous,
          sources: SALES_20.map((sale) => ({
            key: sale.number,
            type: `Invoice · ${sale.customer}`,
            number: sale.number,
            href: `#invoices/${sale.number}`,
            date: sale.date,
            amount: sale.base,
            status: STATES[sale.number],
          })),
        },
        {
          id: '3.6',
          number: '3.6',
          label: 'VAT at the general rate',
          value: VAT_VALUES.vat20.current,
          previous: VAT_VALUES.vat20.previous,
        },
      ],
    },
    {
      key: '4',
      title: '4. Taxable supplies at the special rate',
      fields: [
        {
          id: '4.2',
          number: '4.2',
          label: 'Tax base, special rate (10%)',
          value: VAT_VALUES.base10.current,
          previous: VAT_VALUES.base10.previous,
        },
        {
          id: '4.6',
          number: '4.6',
          label: 'VAT at the special rate',
          value: VAT_VALUES.vat10.current,
          previous: VAT_VALUES.vat10.previous,
        },
      ],
    },
    {
      key: '5',
      title: '5. Total supplies and VAT',
      fields: [
        {
          id: '5.1',
          number: '5.1',
          label: 'Total tax base',
          value: VAT_VALUES.totalBase.current,
          previous: VAT_VALUES.totalBase.previous,
          total: true,
        },
        {
          id: '5.2',
          number: '5.2',
          label: 'Total VAT on supplies',
          value: VAT_VALUES.totalVat.current,
          previous: VAT_VALUES.totalVat.previous,
          total: true,
        },
      ],
    },
    {
      key: '8',
      title: '8. Input tax',
      fields: [
        {
          id: '8a.1',
          number: '8a.1',
          label: 'Purchases at the general rate, tax base',
          value: VAT_VALUES.inputBase.current,
          previous: VAT_VALUES.inputBase.previous,
        },
        {
          id: '8a.2',
          number: '8a.2',
          label: 'Input tax at the general rate',
          value: input,
          previous: VAT_VALUES.inputVat.previous,
          sources: PURCHASES_20.map((purchase) => ({
            key: purchase.number,
            type: `Supplier invoice · ${purchase.supplier}`,
            number: purchase.number,
            href: `#purchases/${purchase.number}`,
            date: purchase.date,
            amount: fifth(purchase.base),
          })),
          editor,
          ...(override === undefined ? {} : { override }),
        },
        {
          id: '8e.6',
          number: '8e.6',
          label: 'Total input tax that may be deducted',
          value: VAT_VALUES.inputTotal.current,
          previous: VAT_VALUES.inputTotal.previous,
          total: true,
        },
      ],
    },
    {
      key: '10',
      title: '10. Tax liability',
      fields: [
        {
          id: '10.1',
          number: '10.1',
          label: 'VAT payable',
          value: VAT_VALUES.payable.current,
          previous: VAT_VALUES.payable.previous,
          total: true,
        },
      ],
    },
  ]
}

const IVANA: StatutoryOverride = {
  computed: VAT_VALUES.inputVat.computed,
  by: 'Ivana Stojanović',
  at: '05.10.2026. 14:12',
}

/** The application around the page: the override is kept with who and when. */
function VatReturn({
  step = 1,
  layout,
  title = 'VAT return, September 2026',
  label,
  checks = true,
}: {
  step?: number
  layout?: 'desktop' | 'phone'
  title?: string
  label?: string
  checks?: boolean
}) {
  const [input, setInput] = useState(VAT_VALUES.inputVat.current)
  const [override, setOverride] = useState<StatutoryOverride | undefined>(IVANA)
  const [draft, setDraft] = useState<string | null>(input)
  const submitted = step === 2
  return (
    <StatutoryFormPage
      {...(layout === undefined ? {} : { layout })}
      title={title}
      subtitle="Kvadrat Gradnja d.o.o. · PIB 108452317 · illustrative form, field numbers as an example"
      back={{ href: '#vat', label: 'VAT returns' }}
      status={
        <StatusBadge
          label={STEPS[step]?.label ?? ''}
          tone={submitted ? 'success' : step === 1 ? 'info' : 'neutral'}
        />
      }
      actions={
        <>
          <Button intent="print" emphasis="secondary" label="Print" />
          <Button intent="export" label="Export XML" />
          {!submitted && <Button intent="confirm" label="Submit" />}
        </>
      }
      lifecycle={{ steps: STEPS, current: step, label: 'Return status' }}
      currency="RSD"
      currentLabel="September 2026"
      previousLabel="August 2026"
      sections={sectionsFor(
        input,
        override,
        <MoneyField
          label="Input tax at the general rate"
          hideLabel
          currency="RSD"
          value={draft}
          onChange={setDraft}
        />,
        label,
      )}
      {...(checks && !submitted ? { rules: rulesFor(input) } : {})}
      {...(submitted ? { rules: rulesFor(VAT_VALUES.inputVat.computed) } : {})}
      readOnly={submitted}
      onSaveOverride={() => {
        if (draft === null) return
        setInput(draft)
        setOverride(
          draft === VAT_VALUES.inputVat.computed
            ? undefined
            : { ...IVANA, by: 'Milica Petrović', at: '06.10.2026. 10:05' },
        )
      }}
      onUseComputed={() => {
        setInput(VAT_VALUES.inputVat.computed)
        setDraft(VAT_VALUES.inputVat.computed)
        setOverride(undefined)
      }}
    />
  )
}

const meta = {
  title: 'Templates/StatutoryFormPage',
  component: StatutoryFormPage,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** an official form (a VAT return, a statistical report) mirrored with its ' +
          'own section and field numbers ("3.2", "8a.1"). Values come prefilled from the books; ' +
          '**each amount with sources drills down** to its documents (a Drawer of links with ' +
          'kind, number, state and amount); **manual overrides** are marked with who and when, ' +
          'the computed value and "Use computed value"; **rule checks** from the Core stand next ' +
          'to the fields and in a summary with "Go to"; the **previous period** is a column; the ' +
          '**status** draft → checked → submitted is a LifecycleBar. Print and export are the ' +
          'application’s actions.\n\n' +
          '**When:** a form the company files with an authority, from data it already has.\n\n' +
          '**When not:** a register of entries (RegisterPage); a report to read (ReportPage). ' +
          'The form, its numbers, rules and texts in these stories are illustrative, not the ' +
          'authority’s.',
      },
    },
  },
  args: {
    title: 'VAT return, September 2026',
    sections: [],
    currency: 'RSD',
    currentLabel: 'September 2026',
  },
  render: () => (
    <ExampleProvider>
      <VatReturn />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof StatutoryFormPage>

export default meta

type Story = StoryObj<typeof meta>

/**
 * Checked, with one failing check after Ivana's override of 8a.2: the summary, the check under
 * the fields, "Go to 8e.6"; 3.2 opens its six invoices.
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await expect(canvas.getByText('1 check failed · 4 checks passed')).toBeVisible()
    await expect(canvas.getByText('Changed manually')).toBeVisible()
    await expect(canvas.getByText('By Ivana Stojanović on 05.10.2026. 14:12')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Go to 8e.6' }))
    await expect(canvasElement.ownerDocument.activeElement).toHaveTextContent('8e.6')
    await userEvent.click(canvas.getByRole('button', { name: /sources of 3\.2$/ }))
    const drawer = within(await body.findByRole('dialog', { name: /3\.2/ }))
    await settle()
    await expect(drawer.getAllByRole('listitem')).toHaveLength(6)
    await expect(drawer.getByRole('link', { name: /F-2026-0412/ })).toBeVisible()
    await expect(drawer.getByText('144.920,00 RSD')).toBeVisible()
    await expect(drawer.getByText('510.809,60 RSD')).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
  },
}

/**
 * Changing a value: the pencil turns 8a.2 into a field with Cancel and Save; "Use computed
 * value" goes back to the books, and the failing check passes.
 */
export const Override: Story = {
  name: 'Changing a value',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Use computed value' }))
    await expect(canvas.queryByText('Changed manually')).toBeNull()
    await expect(canvas.getByText('5 checks passed')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Change 8a.2' }))
    const field = canvas.getByRole('textbox', { name: /Input tax at the general rate/ })
    await userEvent.clear(field)
    await userEvent.type(field, '4557,60{Enter}')
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(await canvas.findByText('By Milica Petrović on 06.10.2026. 10:05')).toBeVisible()
    await expect(canvas.getByText('1 check failed · 4 checks passed')).toBeVisible()
  },
}

/** A draft before the checks ran: no summary yet. */
export const Draft: Story = {
  render: () => (
    <ExampleProvider>
      <VatReturn step={0} checks={false} />
    </ExampleProvider>
  ),
}

/** Submitted: read-only — no pencils, no way back; the drill-down stays. */
export const Submitted: Story = {
  render: () => (
    <ExampleProvider>
      <VatReturn step={2} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('button', { name: /^Change / })).toBeNull()
    await expect(canvas.queryByRole('button', { name: 'Use computed value' })).toBeNull()
    await expect(canvas.getByRole('button', { name: /sources of 3\.2$/ })).toBeVisible()
  },
}

/** Long text wraps: the title and a field's description. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <VatReturn title={LONG.label} label={LONG.description} />
    </ExampleProvider>
  ),
}

/** Phone width: each field a row of a flat list with both periods; nothing scrolls sideways. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="h-full overflow-y-auto">
          <VatReturn layout="phone" />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const page = canvasElement.querySelector('[data-slot="statutory-form-page"]')
    await expect(page?.scrollWidth).toBeLessThanOrEqual(page?.clientWidth ?? 0)
  },
}

/** Arabic sample text, right to left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <VatReturn title={ARABIC.label} label={ARABIC.value} />
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <VatReturn title={JAPANESE.label} label={JAPANESE.value} />
    </StoryProvider>
  ),
}
