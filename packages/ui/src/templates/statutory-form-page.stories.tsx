import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState, type ReactNode } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { Button } from '../components/button'
import { ARABIC, JAPANESE, LONG } from '../components/field-story-data'
import { MoneyField } from '../components/number-field'
import { StatusBadge } from '../components/status-badge'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import {
  expectBelowShell,
  expectFirstColumnStays,
  nextFrames,
  scrollUnderShell,
  ShellPage,
} from '../components/sticky-story-helpers'
import { settle } from '../primitives/story-helpers'
import { createFormat } from '../provider/format'
import { PURCHASES_20, SALES_20 } from './register-story-data'
import {
  StatutoryFormPage,
  type SourceDocument,
  type StatutoryOverride,
  type StatutorySection,
} from './statutory-form-page'
import { statutoryCellId } from './statutory-logic'
import {
  VAT_ENTERED,
  VAT_FORM_LANG,
  vatFormRules,
  vatFormSections,
  vatFormValues,
  type VatEntered,
  type VatFormDocuments,
} from './statutory-story-data'

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

/** September's e-invoices behind the source cells. */
const DOCUMENTS: VatFormDocuments = {
  sales20: SALES_20.map((sale) => ({
    key: sale.number,
    type: `Invoice · ${sale.customer}`,
    number: sale.number,
    href: `#invoices/${sale.number}`,
    date: sale.date,
    amount: sale.base,
    status: STATES[sale.number],
  })),
  sales10: [
    {
      key: 'F-2026-0412',
      type: 'Invoice · Panonija Agro d.o.o.',
      number: 'F-2026-0412',
      href: '#invoices/F-2026-0412',
      date: '2026-09-28',
      amount: '8500.00',
      status: STATES['F-2026-0412'],
    },
  ],
  advances: [
    {
      key: 'AV-2026-0031',
      type: 'Advance invoice · Mlinpek d.o.o.',
      number: 'AV-2026-0031',
      href: '#invoices/AV-2026-0031',
      date: '2026-09-15',
      amount: '50000.00',
    },
  ],
  reverseCharge: [
    {
      key: 'F-2026-0405',
      type: 'Invoice · Vojvođanka Mlin a.d.',
      number: 'F-2026-0405',
      href: '#invoices/F-2026-0405',
      date: '2026-09-14',
      amount: '96000.00',
    },
  ],
  exempt: [
    {
      key: 'F-2026-0412',
      type: 'Invoice · Panonija Agro d.o.o.',
      number: 'F-2026-0412',
      href: '#invoices/F-2026-0412',
      date: '2026-09-28',
      amount: '2700.00',
      status: STATES['F-2026-0412'],
    },
  ],
  purchases20: PURCHASES_20.map((purchase) => ({
    key: purchase.number,
    type: `Supplier invoice · ${purchase.supplier}`,
    number: purchase.number,
    href: `#purchases/${purchase.number}`,
    date: purchase.date,
    amount: purchase.base,
  })),
}

const BOOKS = vatFormValues(DOCUMENTS, VAT_ENTERED)
/** Ivana Stojanović left UF-2026-1179 out of 3.1.1's VAT: a query about its price is open. */
const OVERRIDDEN = '4557.60'
const IVANA: StatutoryOverride = {
  computed: BOOKS.inputVat,
  by: 'Ivana Stojanović',
  at: '05.10.2026. 14:12',
}

const STEPS = [
  { key: 'draft', label: 'Draft' },
  { key: 'checked', label: 'Checked' },
  { key: 'submitted', label: 'Submitted' },
]

/** The application around the page: typed cells, the override with who and when. */
function VatReturn({
  step = 1,
  layout,
  title = 'VAT return, September 2026',
  label111,
  checks = true,
  defaultCompare,
  defaultCollapsed,
}: {
  step?: number
  layout?: 'desktop' | 'phone'
  title?: string
  label111?: string
  checks?: boolean
  defaultCompare?: boolean
  defaultCollapsed?: readonly string[]
}) {
  const [entered, setEntered] = useState<VatEntered>(VAT_ENTERED)
  const [input, setInput] = useState(OVERRIDDEN)
  const [override, setOverride] = useState<StatutoryOverride | undefined>(IVANA)
  const [draft, setDraft] = useState<string | null>(input)
  const submitted = step === 2
  return (
    <StatutoryFormPage
      {...(layout === undefined ? {} : { layout })}
      {...(defaultCompare === undefined ? {} : { defaultCompare })}
      {...(defaultCollapsed === undefined ? {} : { defaultCollapsed })}
      title={title}
      subtitle="Kvadrat Gradnja d.o.o. · PIB 108452317 · an illustrative form: parts, numbers and texts as an example, not the authority's"
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
      lang={VAT_FORM_LANG}
      currency="RSD"
      currentLabel="September 2026"
      previousLabel="August 2026"
      sections={vatFormSections({
        documents: DOCUMENTS,
        entered,
        field: (cell, label) => (
          <MoneyField
            label={label}
            hideLabel
            currency="RSD"
            value={entered[cell] ?? null}
            onChange={(value) => {
              setEntered((current) => ({ ...current, [cell]: value }))
            }}
          />
        ),
        inputVat: input,
        ...(override === undefined ? {} : { override }),
        editor: (
          <MoneyField
            label="3.1.1 · Општа стопа 20% · ПДВ"
            hideLabel
            currency="RSD"
            value={draft}
            onChange={setDraft}
          />
        ),
        ...(label111 === undefined ? {} : { label111 }),
      })}
      {...(checks || submitted
        ? {
            rules: vatFormRules(DOCUMENTS, submitted ? BOOKS.inputVat : input, (value) =>
              SERBIAN.money(value, 'RSD'),
            ),
          }
        : {})}
      readOnly={submitted}
      onSaveOverride={() => {
        if (draft === null) return
        setInput(draft)
        setOverride(
          draft === BOOKS.inputVat
            ? undefined
            : { ...IVANA, by: 'Milica Petrović', at: '06.10.2026. 10:05' },
        )
      }}
      onUseComputed={() => {
        setInput(BOOKS.inputVat)
        setDraft(BOOKS.inputVat)
        setOverride(undefined)
      }}
    />
  )
}

/** A short form in another script (the Arabic and Japanese stories). */
function sampleForm(texts: {
  part: string
  group: string
  rate20: string
  rate10: string
  base: string
  vat: string
  amount: string
  rows: [string, string, string, string]
  part2: string
  row2: string
}): StatutorySection[] {
  const invoice: SourceDocument = {
    key: 'F-2026-0412',
    type: 'Invoice',
    number: 'F-2026-0412',
    href: '#invoices/F-2026-0412',
    date: '2026-09-28',
    amount: '144920.00',
  }
  const columns = [
    { id: 'base20', label: texts.base, group: texts.rate20 },
    { id: 'vat20', label: texts.vat, group: texts.rate20 },
    { id: 'base10', label: texts.base, group: texts.rate10 },
    { id: 'vat10', label: texts.vat, group: texts.rate10 },
  ]
  return [
    {
      key: 'p1',
      title: texts.part,
      columns,
      items: [
        {
          key: 'g1',
          number: '1.1',
          title: texts.group,
          items: [
            {
              id: '1.1.1',
              number: '1.1.1',
              label: texts.rows[0],
              cells: {
                base20: { kind: 'source', value: '144920.00', sources: [invoice] },
                vat20: { kind: 'computed', value: '28984.00', previous: '27100.00' },
                base10: { kind: 'computed', value: '8500.00' },
                vat10: { kind: 'computed', value: '850.00' },
              },
            },
            {
              id: '1.1.2',
              number: '1.1.2',
              label: texts.rows[1],
              cells: {
                base20: { kind: 'entered', value: '41500.00' },
                vat20: { kind: 'entered', value: '8300.00' },
              },
            },
            {
              id: '1.1.5',
              number: '1.1.5',
              label: texts.rows[2],
              cells: { vat20: { kind: 'entered', value: null } },
            },
            {
              id: '1.1.6',
              number: '1.1.6',
              label: texts.rows[3],
              total: true,
              cells: {
                base20: { kind: 'computed', value: '186420.00' },
                vat20: { kind: 'computed', value: '37284.00' },
                base10: { kind: 'computed', value: '8500.00' },
                vat10: { kind: 'computed', value: '850.00' },
              },
            },
          ],
        },
      ],
    },
    {
      key: 'p2',
      title: texts.part2,
      columns: [{ id: 'amount', label: texts.amount }],
      items: [
        {
          id: '2.2',
          number: '2.2',
          label: texts.row2,
          cells: { amount: { kind: 'computed', value: '2700.00' } },
        },
      ],
    },
  ]
}

/** The cells of the row with this number (its number cell's id ends with the number). */
function rowCells(canvasElement: HTMLElement, number: string): NodeListOf<HTMLElement> | [] {
  const id = `statutory-field-${number.replace(/[^a-zA-Z0-9_-]/g, '-')}`
  const numberCell = canvasElement.querySelector(`[id$="${id}"]`)
  return numberCell?.closest('tr')?.querySelectorAll('td') ?? []
}

const meta = {
  title: 'Templates/StatutoryFormPage',
  component: StatutoryFormPage,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** an official form (a VAT return, a statistical report, input-VAT ' +
          'records) as its **real grid**: parts with their own columns — a group over its ' +
          'sub-columns ("Општа стопа 20%" over "Основица" and "ПДВ"), or one column ("Износ / ' +
          'вредност") —, nested numbered groups (Part 1 → 1.1 → 1.1.1), each collapsible, long ' +
          'labels that wrap. **A cell that does not apply is absent** (blank, never 0). Three ' +
          'kinds of cells: **entered** (the application’s field), **computed** (read-only: a ' +
          'total), **from a source** (read-only; the value opens its documents, e.g. e-invoices ' +
          'from SEF). **Compare with August 2026** shows the previous period under each value; ' +
          'the columns stay. **Manual overrides** carry who and when, the computed value and ' +
          '"Use computed value"; **rule checks** from the Core stand under their rows and in a ' +
          'summary with "Go to"; the **status** draft → checked → submitted is a LifecycleBar. ' +
          'The header rows stick under the shell; a grid wider than its card scrolls sideways ' +
          'with its first column sticky. Phones: one card per row, each value labelled with its ' +
          'group and column. The form’s own texts carry `lang` (`lang="sr-Cyrl"` here).\n\n' +
          '**When:** a form the company files with an authority, from data it already has.\n\n' +
          '**When not:** a register of entries (RegisterPage); a report to read (ReportPage). ' +
          'The form, its parts, numbers, rules and texts in these stories are **illustrative**, ' +
          'not the authority’s.',
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
 * Checked, with one failing check after Ivana's override of 3.1.1's VAT: the summary, the check
 * under its rows, "Go to 3.1.4"; absent cells blank (1.1.5 VAT only, 1.3 Base only, 1.4 one cell).
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByText('1 check failed · 3 checks passed')).toBeVisible()
    await expect(canvas.getByText('Changed manually')).toBeVisible()
    await expect(canvas.getByText('By Ivana Stojanović on 05.10.2026. 14:12')).toBeVisible()
    // Two header rows: the rates over Base and VAT.
    const grid = canvas.getByRole('table', { name: /^Део 1\./ })
    await expect(
      within(grid).getAllByRole('columnheader', { name: 'Општа стопа 20%' }),
    ).toHaveLength(1)
    await expect(within(grid).getAllByRole('columnheader', { name: 'Основица' })).toHaveLength(2)
    // A cell that does not apply is absent: 1.1.5 has VAT only, 1.4 one base.
    const cells115 = [...rowCells(canvasElement, '1.1.5')]
    await expect(cells115.map((cell) => cell.dataset.cellKind)).toEqual([
      'absent',
      'entered',
      'absent',
      'entered',
    ])
    await expect(cells115[0]).toHaveTextContent(/^$/)
    const cells14 = [...rowCells(canvasElement, '1.4')]
    await expect(cells14.map((cell) => cell.dataset.cellKind)).toEqual([
      'source',
      'absent',
      'absent',
      'absent',
    ])
    await settle()
  },
}

export const DefaultInteraction: Story = {
  name: 'Default, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await expect(canvas.getByText('1 check failed · 3 checks passed')).toBeVisible()
    // "Go to" opens a collapsed part first, then focuses the cell.
    await userEvent.click(canvas.getByRole('button', { name: /^Део 3\./ }))
    await expect(canvas.queryByRole('table', { name: /^Део 3\./ })).toBeNull()
    await userEvent.click(canvas.getByRole('button', { name: 'Go to 3.1.4' }))
    await waitFor(() =>
      expect(canvasElement.ownerDocument.activeElement).toHaveTextContent('72.647,60'),
    )
    // A group collapses: its rows are not drawn.
    await userEvent.click(canvas.getByRole('button', { name: /^1\.2 / }))
    await expect(canvas.getByRole('button', { name: /^1\.2 / })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    await expect(canvas.queryByText(/^Примљене авансне уплате/)).toBeNull()
    // A source cell opens its documents.
    await userEvent.click(
      canvas.getByRole('button', { name: /sources of 1\.1\.1 · Општа стопа 20% · Основица$/ }),
    )
    const drawer = within(await body.findByRole('dialog', { name: /^1\.1\.1 / }))
    await settle()
    await expect(drawer.getAllByRole('listitem')).toHaveLength(6)
    await expect(drawer.getByRole('link', { name: /F-2026-0412/ })).toBeVisible()
    await expect(drawer.getByText('144.920,00 RSD')).toBeVisible()
    await expect(drawer.getByText('510.809,60 RSD')).toBeVisible()
    await userEvent.keyboard('{Escape}')
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    // The comparison adds August under each value; the columns stay.
    await userEvent.click(canvas.getByRole('switch', { name: 'Compare with August 2026' }))
    await expect(
      canvas.getByText('September 2026, with August 2026 under each amount'),
    ).toBeVisible()
    await expect(
      canvasElement.querySelectorAll('[data-slot="statutory-previous"]').length,
    ).toBeGreaterThan(10)
    // Typing an entered cell: the application recomputes the totals.
    const field = canvas.getByRole('textbox', { name: /^1\.1\.4 · Општа стопа 20% · Основица/ })
    await userEvent.type(field, '1000{Enter}')
    await expect(canvasElement).toHaveTextContent('559.509,60')
  },
}

/** The previous period under each value, the rate columns unchanged. */
export const Comparing: Story = {
  name: 'Compared with August',
  render: () => (
    <ExampleProvider>
      <VatReturn defaultCompare />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('switch', { name: 'Compare with August 2026' })).toBeChecked()
    await expect(
      canvasElement.querySelectorAll('[data-slot="statutory-previous"]').length,
    ).toBeGreaterThan(10)
    await expect(canvas.getAllByRole('columnheader', { name: 'ПДВ' })).toHaveLength(4)
  },
}

/** Part 3 and group 1.2 collapsed: their rows are not drawn. */
export const Collapsed: Story = {
  render: () => (
    <ExampleProvider>
      <VatReturn defaultCollapsed={['1.2', 'part3']} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('button', { name: /^Део 3\./ })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
    await expect(canvas.queryByRole('table', { name: /^Део 3\./ })).toBeNull()
    await expect(canvas.getByRole('button', { name: /^1\.2 / })).toHaveAttribute(
      'aria-expanded',
      'false',
    )
  },
}

/**
 * Changing a value: "Use computed value" goes back to the books and the check passes; the pencil
 * turns 3.1.1's VAT into a field with Cancel and Save.
 */
export const Override: Story = {
  name: 'Changing a value',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Use computed value' }))
    await expect(canvas.queryByText('Changed manually')).toBeNull()
    await expect(canvas.getByText('4 checks passed')).toBeVisible()
    await userEvent.click(
      canvas.getByRole('button', { name: 'Change 3.1.1 · Општа стопа 20% · ПДВ' }),
    )
    const field = canvas.getByRole('textbox', { name: /^3\.1\.1 · Општа стопа 20% · ПДВ/ })
    await userEvent.clear(field)
    await userEvent.type(field, '4557,60{Enter}')
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await expect(await canvas.findByText('By Milica Petrović on 06.10.2026. 10:05')).toBeVisible()
    await expect(canvas.getByText('1 check failed · 3 checks passed')).toBeVisible()
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

/** Submitted: read-only — entered values as text, no pencils, no way back; the drill-down stays. */
export const Submitted: Story = {
  render: () => (
    <ExampleProvider>
      <VatReturn step={2} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('textbox')).toBeNull()
    await expect(canvas.queryByRole('button', { name: /^Change / })).toBeNull()
    await expect(canvas.queryByRole('button', { name: 'Use computed value' })).toBeNull()
    await expect(
      canvas.getByRole('button', { name: /sources of 1\.1\.1 · Општа стопа 20% · Основица$/ }),
    ).toBeVisible()
  },
}

/** Long text wraps: the title and a row's label. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <VatReturn title={LONG.label} label111={`${LONG.description} ${LONG.error}`} />
    </ExampleProvider>
  ),
}

/**
 * A card narrower than the grid: the grid scrolls sideways in its own region, the number and
 * label column stays at the start, the header stays below the shell while the page scrolls.
 */
export const Narrow: Story = {
  name: 'Narrow, scrolls sideways',
  render: () => (
    <ExampleProvider>
      <div className="max-w-[44rem]">
        <VatReturn layout="desktop" />
      </div>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const region = canvas.getByRole('region', { name: /^Део 1\./ })
    await expect(region).toHaveAttribute('data-overflowing', '')
    await expect(region.scrollWidth).toBeGreaterThan(region.clientWidth)
    const first = region.querySelector('tbody th')
    await expect(first === null ? '' : getComputedStyle(first).position).toBe('sticky')
    const head = region.querySelector('thead')
    await expect(head === null ? '' : getComputedStyle(head).top).toBe('0px')
  },
}

/** Phone width: one card per row, each value labelled with its group and column. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="h-full overflow-y-auto">
          <VatReturn layout="phone" defaultCollapsed={['part3']} />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const page = canvasElement.querySelector('[data-slot="statutory-form-page"]')
    await expect(page?.scrollWidth).toBeLessThanOrEqual(page?.clientWidth ?? 0)
    await expect(canvas.getAllByText('Општа стопа 20% · Основица').length).toBeGreaterThan(3)
    await expect(canvas.queryByRole('table')).toBeNull()
  },
}

/** Arabic sample text, right to left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <StatutoryFormPage
        title={ARABIC.label}
        currency="RSD"
        currentLabel="سبتمبر 2026"
        previousLabel="أغسطس 2026"
        defaultCompare
        sections={sampleForm({
          part: 'الجزء 1. توريد السلع والخدمات',
          group: 'التوريد داخل الدولة',
          rate20: 'المعدل العام 20%',
          rate10: 'المعدل الخاص 10%',
          base: 'الأساس',
          vat: 'الضريبة',
          amount: 'المبلغ / القيمة',
          rows: [
            'توريد صدرت عنه فاتورة إلكترونية',
            'توريد بدون فاتورة إلكترونية',
            'ضريبة محتسبة لاحقاً',
            'المجموع',
          ],
          part2: 'الجزء 2. التوريد المعفى',
          row2: ARABIC.value,
        })}
      />
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <StatutoryFormPage
        title={JAPANESE.label}
        currency="RSD"
        currentLabel="2026年9月"
        sections={sampleForm({
          part: '第1部 物品及び役務の供給',
          group: '国内の供給',
          rate20: '標準税率 20%',
          rate10: '軽減税率 10%',
          base: '課税標準',
          vat: '税額',
          amount: '金額',
          rows: ['電子請求書を発行した供給', '電子請求書のない供給', '事後の税額修正', '合計'],
          part2: '第2部 免税の供給',
          row2: JAPANESE.value,
        })}
      />
    </StoryProvider>
  ),
}

/** Received invoice numbers of the long records part: UF-2026-1101 … UF-2026-1132. */
const RECORD_COUNT = 32

/**
 * An illustrative input-VAT record of 32 rows (P5.28 item 4): one per received invoice, the 20%
 * base from SEF, its VAT computed, the 10% columns typed in every fourth row.
 */
function recordsSection(
  entered: VatEntered,
  field: (cell: string, label: string) => ReactNode,
): StatutorySection {
  return {
    key: 'records',
    title: 'Део 5. Евиденција претходног пореза (илустративно)',
    description: 'Примљене фактуре у пореском периоду, по једна у реду.',
    columns: [
      { id: 'base20', label: 'Основица', group: 'Општа стопа 20%' },
      { id: 'vat20', label: 'ПДВ', group: 'Општа стопа 20%' },
      { id: 'base10', label: 'Основица', group: 'Посебна стопа 10%' },
      { id: 'vat10', label: 'ПДВ', group: 'Посебна стопа 10%' },
    ],
    items: Array.from({ length: RECORD_COUNT }, (_, index) => {
      const number = `5.${String(index + 1)}`
      const invoice = `UF-2026-${String(1101 + index)}`
      // Story data: the bases are whole hundreds, so 20% of each is a whole number.
      const base = 12000 + index * 300
      const typed = index % 4 === 3
      const cell10 = (column: string) => {
        const id = statutoryCellId(number, column)
        return {
          kind: 'entered' as const,
          value: entered[id] ?? null,
          field: field(
            id,
            `${number} · Посебна стопа 10% · ${column === 'base10' ? 'Основица' : 'ПДВ'}`,
          ),
        }
      }
      return {
        id: number,
        number,
        label: `Примљена фактура ${invoice}`,
        cells: {
          base20: {
            kind: 'source' as const,
            value: `${String(base)}.00`,
            sources: [
              {
                key: invoice,
                type: 'Received e-invoice',
                number: invoice,
                href: `#purchases/${invoice}`,
                date: '2026-09-15',
                amount: `${String(base)}.00`,
              },
            ],
          },
          vat20: { kind: 'computed' as const, value: `${String(base / 5)}.00` },
          ...(typed ? { base10: cell10('base10'), vat10: cell10('vat10') } : {}),
        },
      }
    }),
  }
}

/** The records part on its own page, its typed cells kept by the application. */
function Records({ layout }: { layout: 'desktop' | 'phone' }) {
  const [entered, setEntered] = useState<VatEntered>({})
  return (
    <StatutoryFormPage
      layout={layout}
      title="Input tax records, September 2026"
      subtitle="Kvadrat Gradnja d.o.o. · an illustrative form, not the authority's"
      lang={VAT_FORM_LANG}
      currency="RSD"
      currentLabel="September 2026"
      sections={[
        recordsSection(entered, (cell, label) => (
          <MoneyField
            label={label}
            hideLabel
            currency="RSD"
            value={entered[cell] ?? null}
            onChange={(value) => {
              setEntered((current) => ({ ...current, [cell]: value }))
            }}
          />
        )),
      ]}
    />
  )
}

/** The element's top stands at or below `edge` (px, viewport), never under what is above it. */
async function expectTopAtLeast(element: Element, edge: number): Promise<void> {
  await waitFor(async () => {
    await expect(element.getBoundingClientRect().top).toBeGreaterThanOrEqual(edge - 1)
  })
}

/**
 * Thirty-two rows in a narrow card on a page under the shell (P5.28 item 4): while the page
 * scrolls, both header rows stay right below the shell; while the grid scrolls sideways, the
 * number and label column (and the corner) stay at the start; a field reached under the header
 * is scrolled clear of it.
 */
export const UnderTheShell: Story = {
  name: 'Thirty-two rows under the shell, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <ShellPage>
        <div className="max-w-[44rem]">
          <Records layout="desktop" />
        </div>
      </ShellPage>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const region = within(canvasElement).getByRole('region', { name: /^Део 5\./ })
    const table = region.querySelector('table')
    const head = region.querySelector('[data-sticky-head]')
    const corner = region.querySelector('[data-sticky-start]')
    if (table === null || head === null || corner === null) throw new Error('no grid parts')
    await expect(table.querySelectorAll('tbody tr[data-slot="statutory-row"]')).toHaveLength(
      RECORD_COUNT,
    )
    await scrollUnderShell(canvasElement, table, 400)
    await expectBelowShell(canvasElement, head)
    await expectBelowShell(canvasElement, corner)
    // A field hidden under the header is scrolled clear of it when focused.
    const field = within(table).getByRole('textbox', {
      name: /^5\.24 · Посебна стопа 10% · Основица/,
    })
    await scrollUnderShell(canvasElement, field, -8)
    field.focus()
    await nextFrames()
    await expectTopAtLeast(field, head.getBoundingClientRect().bottom)
    // The number and label stay at the start; the amounts move.
    const rowHead = table.querySelectorAll('tbody th[scope="row"]')[20]
    const amount = rowHead?.closest('tr')?.querySelector('td:last-child')
    if (rowHead === undefined || amount === null || amount === undefined) {
      throw new Error('no cells')
    }
    await expectFirstColumnStays(region, rowHead, amount, 120)
    await expectBelowShell(canvasElement, corner)
  },
}

/**
 * The same records on a phone under the shell: the page scrolls in its frame, never sideways; a
 * field reached under the shell is scrolled clear of it.
 */
export const UnderTheShellPhone: Story = {
  name: 'Thirty-two rows under the shell, phone, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <ShellPage width={390} height={720}>
        <Records layout="phone" />
      </ShellPage>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const page = canvasElement.querySelector('[data-slot="statutory-form-page"]')
    const shell = canvasElement.querySelector('[data-slot="story-shell-bar"]')
    if (page === null || shell === null) throw new Error('no page')
    await expect(page.scrollWidth).toBeLessThanOrEqual(page.clientWidth)
    await expect(canvasElement.querySelectorAll('[data-slot="statutory-row"]')).toHaveLength(
      RECORD_COUNT,
    )
    const field = within(canvasElement).getByRole('textbox', {
      name: /^5\.24 · Посебна стопа 10% · Основица/,
    })
    await scrollUnderShell(canvasElement, field, 0)
    field.focus()
    await nextFrames()
    await expectTopAtLeast(field, shell.getBoundingClientRect().bottom)
  },
}
