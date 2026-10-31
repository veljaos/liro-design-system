/*
 * An illustrative VAT return as a form grid, for the StatutoryFormPage stories and
 * the VAT return example: four parts in the manner of a PP PDV / POPDV-like form — groups of rates
 * over Base and VAT, nested numbered groups, one-column parts, cells that do not apply left out,
 * entered, computed and source cells. **Not the authority's form:** the parts, numbers, texts and
 * rules are invented to show the structure. The application's arithmetic (totals in whole paras)
 * is played here; components never add. Not part of the package: nothing in src/index.ts
 * imports this file. No classes here.
 */
import type { ReactNode } from 'react'
import { decimal, paras } from '../components/amounts-story-data'
import type { StatutoryRule } from './register-logic'
import {
  statutoryCellId,
  type SourceDocument,
  type StatutoryCell,
  type StatutoryColumn,
  type StatutoryOverride,
  type StatutoryRow,
  type StatutorySection,
} from './statutory-logic'

/** The form's language: its texts are Serbian Cyrillic on any page. */
export const VAT_FORM_LANG = 'sr-Cyrl'

/** Two rates, each a group over Base and VAT. */
export const RATE_COLUMNS: readonly StatutoryColumn[] = [
  { id: 'base20', label: 'Основица', group: 'Општа стопа 20%' },
  { id: 'vat20', label: 'ПДВ', group: 'Општа стопа 20%' },
  { id: 'base10', label: 'Основица', group: 'Посебна стопа 10%' },
  { id: 'vat10', label: 'ПДВ', group: 'Посебна стопа 10%' },
]

/** One column, for a part of single values. */
export const AMOUNT_COLUMN: readonly StatutoryColumn[] = [
  { id: 'amount', label: 'Износ / вредност' },
]

/** The documents behind the source cells, as the application lists them. */
export interface VatFormDocuments {
  /** E-invoices issued at 20%: `amount` is each one's base. */
  sales20: readonly SourceDocument[]
  /** E-invoices issued at 10%: `amount` is the base. */
  sales10: readonly SourceDocument[]
  /** Advance e-invoices at 20%: `amount` is the base. */
  advances: readonly SourceDocument[]
  /** E-invoices for supplies the buyer accounts for (reverse charge): the base. */
  reverseCharge: readonly SourceDocument[]
  /** E-invoices for exempt supplies: the amount. */
  exempt: readonly SourceDocument[]
  /** Received e-invoices at 20%: the base. */
  purchases20: readonly SourceDocument[]
}

/** The cells the user types, by cell id ("1.1.2/base20"), as the application keeps them. */
export type VatEntered = Readonly<Record<string, string | null>>

/** September's typed values (the rest empty). */
export const VAT_ENTERED: VatEntered = {
  '1.1.2/base20': '41500.00',
  '1.1.2/vat20': '8300.00',
  '1.1.3/base20': '6200.00',
  '1.1.3/vat20': '1240.00',
  '3.1.2/base20': '18450.00',
  '3.1.2/vat20': '3690.00',
}

/** August 2026 as filed, by cell id: the comparison. */
const AUGUST: Readonly<Record<string, string>> = {
  '1.1.1/base20': '468250.00',
  '1.1.1/vat20': '93650.00',
  '1.1.1/base10': '12400.00',
  '1.1.1/vat10': '1240.00',
  '1.1.2/base20': '38200.00',
  '1.1.2/vat20': '7640.00',
  '1.1.6/base20': '506450.00',
  '1.1.6/vat20': '101290.00',
  '1.1.6/base10': '12400.00',
  '1.1.6/vat10': '1240.00',
  '1.4/base20': '64000.00',
  '2.2/amount': '1800.00',
  '2.3/amount': '1800.00',
  '3.1.1/base20': '301500.00',
  '3.1.1/vat20': '60300.00',
  '3.1.4/base20': '301500.00',
  '3.1.4/vat20': '60300.00',
  '3.3/vat20': '60300.00',
  '3.3/vat10': '0.00',
  '4.1/amount': '102530.00',
  '4.2/amount': '60300.00',
  '4.3/amount': '42230.00',
}

const sum = (values: readonly (string | null | undefined)[]) =>
  decimal(values.reduce<bigint>((total, value) => total + (value == null ? 0n : paras(value)), 0n))
const minus = (value: string, less: string) => decimal(paras(value) - paras(less))
/** The VAT at a rate of a base, exact in paras (the bases are chosen so). */
const vatAt = (base: string, divisor: bigint) => {
  const amount = paras(base)
  if (amount % divisor !== 0n) throw new Error(`${base}: VAT is not whole paras`)
  return decimal(amount / divisor)
}
const withVat = (documents: readonly SourceDocument[], divisor: bigint) =>
  documents.map((document) => ({ ...document, amount: vatAt(document.amount, divisor) }))
const total = (documents: readonly SourceDocument[]) => sum(documents.map((d) => d.amount))

/** The values the Core works out from the documents and the typed cells (the books). */
export function vatFormValues(documents: VatFormDocuments, entered: VatEntered) {
  const e = (id: string) => entered[id] ?? null
  const sales20 = total(documents.sales20)
  const sales10 = total(documents.sales10)
  const vat20 = total(withVat(documents.sales20, 5n))
  const vat10 = total(withVat(documents.sales10, 10n))
  const advances = total(documents.advances)
  const advancesVat = total(withVat(documents.advances, 5n))
  const input = total(documents.purchases20)
  const inputVat = total(withVat(documents.purchases20, 5n))
  const outputBase20 = sum([sales20, e('1.1.2/base20'), e('1.1.3/base20'), e('1.1.4/base20')])
  const outputVat20 = sum([
    vat20,
    e('1.1.2/vat20'),
    e('1.1.3/vat20'),
    e('1.1.4/vat20'),
    e('1.1.5/vat20'),
  ])
  const outputBase10 = sum([sales10, e('1.1.2/base10'), e('1.1.3/base10'), e('1.1.4/base10')])
  const outputVat10 = sum([
    vat10,
    e('1.1.2/vat10'),
    e('1.1.3/vat10'),
    e('1.1.4/vat10'),
    e('1.1.5/vat10'),
  ])
  const inputBase20 = sum([input, e('3.1.2/base20')])
  const inputVat20 = minus(sum([inputVat, e('3.1.2/vat20')]), sum([e('3.1.3/vat20')]))
  const inputBase10 = sum([e('3.1.2/base10')])
  const inputVat10 = minus(sum([e('3.1.2/vat10')]), sum([e('3.1.3/vat10')]))
  const output = sum([outputVat20, outputVat10, advancesVat])
  const deductible = sum([inputVat20, inputVat10])
  return {
    sales20,
    sales10,
    vat20,
    vat10,
    advances,
    advancesVat,
    reverseCharge: total(documents.reverseCharge),
    exempt: total(documents.exempt),
    input,
    inputVat,
    outputBase20,
    outputVat20,
    outputBase10,
    outputVat10,
    inputBase20,
    inputVat20,
    inputBase10,
    inputVat10,
    output,
    deductible,
    payable: minus(output, deductible),
  }
}

export interface VatFormOptions {
  documents: VatFormDocuments
  /** The typed cells. */
  entered: VatEntered
  /** The application's field for a typed cell; `label` names it ("1.1.2 · Општа стопа 20% · Основица"). */
  field: (cell: string, label: string) => ReactNode
  /** 3.1.1's VAT as shown: overridden when it differs from the books. */
  inputVat: string
  override?: StatutoryOverride
  /** 3.1.1's VAT editor (the way to type over the books). */
  editor?: ReactNode
  /** Where the documents open. */
  sourceNames?: { sales: string; purchases: string }
  /** 1.1.1's label (a long text in the stories). */
  label111?: string
}

const SEF_SALES = 'Електронске фактуре из СЕФ-а'
const SEF_PURCHASES = 'Примљене електронске фактуре из СЕФ-а'

/** The form's parts, filled from the documents and the typed cells. */
export function vatFormSections(options: VatFormOptions): StatutorySection[] {
  const { documents, entered } = options
  const values = vatFormValues(documents, entered)
  const names = options.sourceNames ?? { sales: SEF_SALES, purchases: SEF_PURCHASES }
  const previous = (row: string, column: string) => {
    const value = AUGUST[statutoryCellId(row, column)]
    return value === undefined ? {} : { previous: value }
  }
  const computed = (row: string, column: string, value: string | null): StatutoryCell => ({
    kind: 'computed',
    value,
    ...previous(row, column),
  })
  const source = (
    row: string,
    column: string,
    sources: readonly SourceDocument[],
    name: string,
  ): StatutoryCell => ({
    kind: 'source',
    value: total(sources),
    sources,
    sourceName: name,
    ...previous(row, column),
  })
  const typed = (row: string, column: string, group: string, label: string): StatutoryCell => {
    const id = statutoryCellId(row, column)
    return {
      kind: 'entered',
      value: entered[id] ?? null,
      field: options.field(id, `${row} · ${group} · ${label}`),
      ...previous(row, column),
    }
  }
  /** Typed cells in the given rate columns. */
  const typedIn = (row: string, columns: readonly string[]) =>
    Object.fromEntries(
      RATE_COLUMNS.filter((column) => columns.includes(column.id)).map((column) => [
        column.id,
        typed(row, column.id, column.group ?? '', column.label),
      ]),
    )
  const ALL = ['base20', 'vat20', 'base10', 'vat10']
  const row = (
    id: string,
    label: string,
    cells: StatutoryRow['cells'],
    isTotal = false,
  ): StatutoryRow => ({ id, number: id, label, cells, ...(isTotal ? { total: true } : {}) })

  return [
    {
      key: 'part1',
      title: 'Део 1. Промет добара и услуга и обрачунати ПДВ',
      columns: RATE_COLUMNS,
      items: [
        {
          key: '1.1',
          number: '1.1',
          title: 'Промет добара и услуга у Републици за који је обвезник ПДВ порески дужник',
          items: [
            row(
              '1.1.1',
              options.label111 ??
                'Промет за који је издата електронска фактура преко система електронских фактура (СЕФ), осим промета по основу авансних уплата',
              {
                base20: source('1.1.1', 'base20', documents.sales20, names.sales),
                vat20: source('1.1.1', 'vat20', withVat(documents.sales20, 5n), names.sales),
                base10: source('1.1.1', 'base10', documents.sales10, names.sales),
                vat10: source('1.1.1', 'vat10', withVat(documents.sales10, 10n), names.sales),
              },
            ),
            row(
              '1.1.2',
              'Промет за који није издата електронска фактура (промет физичким лицима евидентиран преко фискалних рачуна)',
              typedIn('1.1.2', ALL),
            ),
            row(
              '1.1.3',
              'Промет без накнаде (узорци и поклони преко прописаног износа, употреба за личне потребе)',
              typedIn('1.1.3', ALL),
            ),
            row(
              '1.1.4',
              'Повећање основице по основу накнадних задужења и измена промета из ранијих периода',
              typedIn('1.1.4', ALL),
            ),
            row(
              '1.1.5',
              'Накнадно обрачунати ПДВ (исправка ПДВ из ранијих пореских периода)',
              typedIn('1.1.5', ['vat20', 'vat10']),
            ),
            row(
              '1.1.6',
              'Укупно (1.1.1 до 1.1.5)',
              {
                base20: computed('1.1.6', 'base20', values.outputBase20),
                vat20: computed('1.1.6', 'vat20', values.outputVat20),
                base10: computed('1.1.6', 'base10', values.outputBase10),
                vat10: computed('1.1.6', 'vat10', values.outputVat10),
              },
              true,
            ),
          ],
        },
        {
          key: '1.2',
          number: '1.2',
          title: 'Авансне уплате за промет у Републици',
          items: [
            row('1.2.1', 'Примљене авансне уплате за које је издата авансна електронска фактура', {
              base20: source('1.2.1', 'base20', documents.advances, names.sales),
              vat20: source('1.2.1', 'vat20', withVat(documents.advances, 5n), names.sales),
            }),
          ],
        },
        row(
          '1.3',
          'Пренос целокупне или дела имовине, са или без накнаде, без обрачунатог ПДВ',
          typedIn('1.3', ['base20', 'base10']),
        ),
        row(
          '1.4',
          'Промет за који је прималац порески дужник (обрнуто обрачунавање, грађевинске услуге)',
          { base20: source('1.4', 'base20', documents.reverseCharge, names.sales) },
        ),
      ],
    },
    {
      key: 'part2',
      title: 'Део 2. Промет ослобођен ПДВ',
      description: 'Износи без ПДВ',
      columns: AMOUNT_COLUMN,
      items: [
        row('2.1', 'Промет ослобођен ПДВ са правом на одбитак претходног пореза (извоз добара)', {
          amount: computed('2.1', 'amount', '0.00'),
        }),
        row(
          '2.2',
          'Промет ослобођен ПДВ без права на одбитак претходног пореза (повратна амбалажа)',
          { amount: source('2.2', 'amount', documents.exempt, names.sales) },
        ),
        row(
          '2.3',
          'Укупно (2.1 + 2.2)',
          { amount: computed('2.3', 'amount', values.exempt) },
          true,
        ),
      ],
    },
    {
      key: 'part3',
      title: 'Део 3. Претходни порез',
      columns: RATE_COLUMNS,
      items: [
        {
          key: '3.1',
          number: '3.1',
          title: 'Набавке добара и услуга у Републици од обвезника ПДВ',
          items: [
            row('3.1.1', 'Набавке за које је примљена електронска фактура преко СЕФ-а', {
              base20: source('3.1.1', 'base20', documents.purchases20, names.purchases),
              vat20: {
                ...source('3.1.1', 'vat20', withVat(documents.purchases20, 5n), names.purchases),
                value: options.inputVat,
                ...(options.editor === undefined ? {} : { editor: options.editor }),
                ...(options.override === undefined ? {} : { override: options.override }),
              },
              base10: computed('3.1.1', 'base10', '0.00'),
              vat10: computed('3.1.1', 'vat10', '0.00'),
            }),
            row(
              '3.1.2',
              'Набавке за које није примљена електронска фактура (фискални рачуни)',
              typedIn('3.1.2', ALL),
            ),
            row(
              '3.1.3',
              'Смањење претходног пореза (исправка одбитка)',
              typedIn('3.1.3', ['vat20', 'vat10']),
            ),
            row(
              '3.1.4',
              'Укупно (3.1.1 + 3.1.2 − 3.1.3)',
              {
                base20: computed('3.1.4', 'base20', values.inputBase20),
                vat20: computed('3.1.4', 'vat20', values.inputVat20),
                base10: computed('3.1.4', 'base10', values.inputBase10),
                vat10: computed('3.1.4', 'vat10', values.inputVat10),
              },
              true,
            ),
          ],
        },
        row('3.2', 'ПДВ плаћен при увозу добара', {
          vat20: computed('3.2', 'vat20', '0.00'),
          vat10: computed('3.2', 'vat10', '0.00'),
        }),
        row(
          '3.3',
          'Укупан претходни порез који се може одбити (3.1.4 + 3.2)',
          {
            vat20: computed('3.3', 'vat20', values.inputVat20),
            vat10: computed('3.3', 'vat10', values.inputVat10),
          },
          true,
        ),
      ],
    },
    {
      key: 'part4',
      title: 'Део 4. Пореска обавеза',
      columns: AMOUNT_COLUMN,
      items: [
        row('4.1', 'Обрачунати ПДВ (1.1.6 + 1.2.1)', {
          amount: computed('4.1', 'amount', values.output),
        }),
        row('4.2', 'Претходни порез (3.3)', {
          amount: computed('4.2', 'amount', values.deductible),
        }),
        row(
          '4.3',
          'ПДВ за уплату (4.1 − 4.2)',
          { amount: computed('4.3', 'amount', values.payable) },
          true,
        ),
      ],
    },
  ]
}

/**
 * The Core's checks and their results: one fails while 3.1.1's VAT is typed over the books
 * (`inputVat` differs from the documents' VAT), its difference in the Core's words.
 */
export function vatFormRules(
  documents: VatFormDocuments,
  inputVat: string,
  money: (value: string) => string,
): StatutoryRule[] {
  const books = total(withVat(documents.purchases20, 5n))
  const failed = inputVat !== books
  return [
    {
      id: 'r1',
      text: '1.1.6 must equal 1.1.1 + 1.1.2 + 1.1.3 + 1.1.4 + 1.1.5',
      fields: ['1.1.6'],
      result: 'passed',
    },
    { id: 'r2', text: '2.3 must equal 2.1 + 2.2', fields: ['2.3'], result: 'passed' },
    {
      id: 'r3',
      text: '3.1.4 must equal 3.1.1 + 3.1.2 − 3.1.3',
      fields: [statutoryCellId('3.1.4', 'vat20'), statutoryCellId('3.1.1', 'vat20')],
      result: failed ? 'failed' : 'passed',
      ...(failed ? { detail: `Difference: ${money(minus(books, inputVat))}` } : {}),
    },
    { id: 'r4', text: '4.3 must equal 4.1 − 4.2', fields: ['4.3'], result: 'passed' },
  ]
}
