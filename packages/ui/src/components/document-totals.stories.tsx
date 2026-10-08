import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import {
  FINAL_DEDUCTIONS,
  FINAL_DUE,
  FINAL_RECAP,
  FINAL_ROWS,
  FOOTNOTES,
} from './document-story-data'
import { DocumentTotals } from './document-totals'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Documents/DocumentTotals',
  component: DocumentTotals,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a document’s totals under its lines, end-aligned, no card (P4.5): rows ' +
          'from the application, the final row large under a strong line. **Nothing is ' +
          'computed here** (D4): every amount arrives as a decimal string.\n\n' +
          '**Complex documents (P5.18), in this order:** the `rows` (total without VAT, VAT, ' +
          'invoice total); the **recap by tax category** (`recap`: category, base, rate, tax — ' +
          'a small table under its caption; the block is then 384px wide); the **deductions** ' +
          '(`deductions`: one row per advance, its label a link to the advance); the final row ' +
          '(**Amount due**); for a foreign-currency document the **home-currency equivalents** ' +
          'and the rate line (`exchange`: "1 EUR = 117,1825 RSD, NBS middle rate on ' +
          '05.10.2026.") — only here, the lines stay in the document’s currency; and the ' +
          '**footnotes** (`footnotes`) for exemption and reverse-charge reasons, given once, ' +
          'their markers ("E¹", "AE²") repeated in the lines’ tax column.\n\n' +
          '**When not:** a table’s column totals (DataTable `totals`); an editable grid’s ' +
          'running totals (EditableGrid `totals`).',
      },
    },
  },
  args: { label: 'Totals', rows: FINAL_ROWS, total: FINAL_DUE },
  render: (args) => (
    <ExampleProvider>
      <DocumentTotals {...args} />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof DocumentTotals>

export default meta

type Story = StoryObj<typeof meta>

/**
 * A final invoice: total, the recap by tax category, two advances deducted (links), the amount
 * due.
 */
export const Default: Story = {
  args: { recap: FINAL_RECAP, deductions: FINAL_DEDUCTIONS },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('group', { name: 'Totals' })).toBeVisible()
    const recap = canvas.getByRole('table', { name: 'Recap by tax category' })
    await expect(within(recap).getByRole('rowheader', { name: 'S 20%' })).toBeVisible()
    await expect(recap).toHaveTextContent('6.657.998,52')
    await expect(canvas.getByRole('link', { name: 'Advance A-2026-038' })).toHaveAttribute(
      'href',
      '#sales/invoices/A-2026-038',
    )
    await expect(canvasElement).toHaveTextContent('5.003.678,22')
  },
}

/** The P4.5 block: rows and the final row only. */
export const Simple: Story = {}

/**
 * An invoice in EUR with four tax categories: E and AE carry footnote markers, the reasons are
 * given once under the totals; the RSD equivalents and the rate line close the block.
 */
export const ForeignCurrency: Story = {
  name: 'Foreign currency and footnotes',
  args: {
    rows: [
      { key: 'net', label: 'Total without VAT', value: '9145.00', currency: 'EUR' },
      { key: 'vat', label: 'VAT', value: '1513.50', currency: 'EUR' },
    ],
    recap: {
      label: 'Recap by tax category',
      headers: { category: 'Category', base: 'Base', rate: 'Rate', tax: 'VAT' },
      currency: 'EUR',
      rows: [
        { key: 's20', category: 'S 20%', base: '7440.00', rate: '20', tax: '1488.00' },
        { key: 's10', category: 'S 10%', base: '255.00', rate: '10', tax: '25.50' },
        { key: 'e', category: 'E¹', base: '450.00', rate: null, tax: null },
        { key: 'ae', category: 'AE²', base: '1000.00', rate: null, tax: null },
      ],
    },
    total: { key: 'total', label: 'Invoice total', value: '10658.50', currency: 'EUR' },
    exchange: {
      currency: 'EUR',
      homeCurrency: 'RSD',
      rate: '117.1825',
      source: 'NBS middle rate on 05.10.2026.',
      rows: [
        { key: 'net', label: 'Total without VAT in RSD', value: '1071633.96', currency: 'RSD' },
        { key: 'vat', label: 'VAT in RSD', value: '177355.71', currency: 'RSD' },
        { key: 'total', label: 'Invoice total in RSD', value: '1248989.67', currency: 'RSD' },
      ],
    },
    footnotes: FOOTNOTES,
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent(
      '1 EUR = 117,1825 RSD, NBS middle rate on 05.10.2026.',
    )
    await expect(canvasElement).toHaveTextContent('¹ Exempt E')
  },
}

/** While the Core recomputes, the confirmed amounts stay; a dot shows after 300ms. */
export const Pending: Story = {
  render: (args) => {
    function Recomputing() {
      const [pending, setPending] = useState(false)
      return (
        <div className="flex flex-col gap-4">
          <div>
            <Button
              intent="refresh"
              emphasis="secondary"
              label="Recompute"
              onClick={() => {
                setPending(true)
              }}
            />
          </div>
          <DocumentTotals
            {...args}
            total={{ ...args.total, pending }}
            deductions={FINAL_DEDUCTIONS.map((row) => ({ ...row, pending }))}
          />
        </div>
      )
    }
    return (
      <ExampleProvider>
        <Recomputing />
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Recompute' }))
    // The confirmed amount stays while the new one is computed.
    await expect(canvasElement).toHaveTextContent('5.003.678,22')
  },
}

/** Long labels wrap; their amounts stay on the first line's baseline. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    recap: FINAL_RECAP,
    deductions: [
      {
        key: 'a38',
        label: 'Advance A-2026-038 of 15.07.2026., paid on 18.07.2026., deducted with its VAT',
        value: '-1200000.00',
        currency: 'RSD',
        href: '#sales/invoices/A-2026-038',
      },
    ],
  },
}

/** Phone width: the full width of the screen; the recap table fits. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  args: { recap: FINAL_RECAP, deductions: FINAL_DEDUCTIONS },
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <ExampleProvider>
          <DocumentTotals {...args} className="max-w-none" />
        </ExampleProvider>
      </div>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const block = canvasElement.querySelector('[data-slot="document-totals"]')
    await expect(block).not.toBeNull()
    if (block !== null) await expect(block.scrollWidth).toBeLessThanOrEqual(block.clientWidth)
  },
}

/** Arabic labels in a right-to-left page. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <DocumentTotals
          label="الإجماليات"
          rows={[{ key: 'net', label: 'المجموع بدون ضريبة', value: '9145.00', currency: 'EUR' }]}
          recap={{
            label: 'ملخص حسب فئة الضريبة',
            headers: { category: 'الفئة', base: 'الأساس', rate: 'النسبة', tax: 'الضريبة' },
            rows: [{ key: 's20', category: 'S 20%', base: '7440.00', rate: '20', tax: '1488.00' }],
          }}
          total={{ key: 'due', label: 'المبلغ المستحق', value: '10658.50', currency: 'EUR' }}
          footnotes={[{ key: 'e', marker: '¹', text: 'معفاة بموجب المادة 24 (مثال).' }]}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese labels. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <DocumentTotals
          label="合計"
          rows={[{ key: 'net', label: '税抜合計', value: '9145.00', currency: 'EUR' }]}
          deductions={[
            {
              key: 'a',
              label: '前受金 A-2026-038',
              value: '-1200.00',
              currency: 'EUR',
              href: '#a',
            },
          ]}
          total={{ key: 'due', label: '請求額', value: '7945.00', currency: 'EUR' }}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}
