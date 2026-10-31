import { BarChart } from '../charts'
import type { AnswerBlock } from './assistant-logic'
import { DateText, MoneyText, NumberText } from './display-text'

/*
 * Story data of the assistant's components: fictitious answers of a fictitious company's
 * assistant. Not part of the package. Every figure is written by the stories' provider format.
 */

export const QUESTION_OVERDUE = 'Which invoices are overdue more than 30 days?'
export const QUESTION_REVENUE = 'How did revenue change this quarter?'

const money = (value: string) => <MoneyText value={value} currency="RSD" />

/** A table answer with links to the records, a total and the sources. */
export const OVERDUE_BLOCKS: AnswerBlock[] = [
  {
    kind: 'text',
    text: 'Three invoices are overdue more than 30 days, 512.400,00 RSD together. The oldest is 47 days late.',
  },
  {
    kind: 'table',
    caption: 'Overdue more than 30 days on 14.10.2026.',
    columns: [
      { key: 'number', label: 'Invoice' },
      { key: 'customer', label: 'Customer' },
      { key: 'due', label: 'Due', numeric: true },
      { key: 'days', label: 'Days late', numeric: true },
      { key: 'amount', label: 'Open amount', numeric: true },
    ],
    rows: [
      {
        id: 'f-0371',
        href: '#/sales/invoices/F-2026-0371',
        cells: {
          number: 'F-2026-0371',
          customer: 'Stanogradnja Plus d.o.o.',
          due: <DateText value="2026-08-28" />,
          days: <NumberText value="47" />,
          amount: money('236000.00'),
        },
      },
      {
        id: 'f-0384',
        href: '#/sales/invoices/F-2026-0384',
        cells: {
          number: 'F-2026-0384',
          customer: 'Gradska toplana Novi Sad',
          due: <DateText value="2026-09-05" />,
          days: <NumberText value="39" />,
          amount: money('184800.00'),
        },
      },
      {
        id: 'f-0390',
        href: '#/sales/invoices/F-2026-0390',
        cells: {
          number: 'F-2026-0390',
          customer: 'Stanogradnja Plus d.o.o.',
          due: <DateText value="2026-09-11" />,
          days: <NumberText value="33" />,
          amount: money('91600.00'),
        },
      },
    ],
    total: { number: 'Total', amount: money('512400.00') },
  },
  {
    kind: 'sources',
    items: [
      {
        id: 'sales',
        label: 'Sales invoices, open items',
        href: '#/sales/invoices',
        detail: 'On 14.10.2026. at 09:40',
      },
      {
        id: 'payments',
        label: 'Bank statements 188–191',
        href: '#/banking/statements',
        detail: 'Payments received up to 13.10.2026.',
      },
    ],
  },
]

export const OVERDUE_FOLLOW_UPS = [
  'Send a payment reminder to Stanogradnja Plus d.o.o.',
  'Which of these were overdue last month too?',
]

/** A chart answer: the chart is the application's, from the charts subpath. */
export function revenueBlocks(layout?: 'desktop' | 'phone'): AnswerBlock[] {
  return [
    { kind: 'heading', text: 'Revenue in the third quarter' },
    {
      kind: 'text',
      text: 'Revenue from July to September was 14.860.000,00 RSD, 12,4% more than in the same quarter last year. September was the strongest month.',
    },
    {
      kind: 'chart',
      chart: (
        <BarChart
          title="Revenue by month"
          description="Thousands of RSD, without VAT"
          categories={[
            { key: 'jul', label: 'Jul' },
            { key: 'aug', label: 'Aug' },
            { key: 'sep', label: 'Sep' },
          ]}
          series={[
            { key: 'this', label: '2026' },
            { key: 'last', label: '2025', role: 'comparison' },
          ]}
          values={{
            this: { jul: '4620', aug: '4410', sep: '5830' },
            last: { jul: '4180', aug: '4050', sep: '4990' },
          }}
          height={200}
          {...(layout === undefined ? {} : { layout })}
        />
      ),
    },
    {
      kind: 'list',
      items: [
        'Two new contracts with Gradska toplana Novi Sad started in September.',
        'August was lower because of the collective holiday on the sites.',
      ],
    },
    {
      kind: 'sources',
      items: [
        {
          id: 'ledger',
          label: 'General ledger, revenue accounts 6010–6040',
          href: '#/accounting/ledger',
        },
      ],
    },
  ]
}

/** The answer so far, while it is written. */
export const STREAMING_BLOCKS: AnswerBlock[] = [
  {
    kind: 'text',
    text: 'Three invoices are overdue more than 30 days, 512.400,00 RSD together. The oldest is',
  },
]

/** A long answer: long words and a long table cell wrap. */
export const LONG_BLOCKS: AnswerBlock[] = [
  {
    kind: 'text',
    text: 'Looking at every open item of every customer, including the ones that were partly paid, the ones in dispute and the ones that were sent to the electronic invoicing system but not yet accepted, the amounts overdue more than thirty days come to 512.400,00 RSD across three invoices from two customers, and none of them has a payment promise recorded.',
  },
  {
    kind: 'table',
    caption: 'Overdue more than 30 days, by customer, with the contact who confirmed the delivery',
    columns: [
      { key: 'customer', label: 'Customer and the contact who confirmed the delivery' },
      { key: 'amount', label: 'Open amount', numeric: true },
    ],
    rows: [
      {
        id: 'a',
        cells: {
          customer:
            'Stanogradnja Plus d.o.o., Bulevar oslobođenja 112, Novi Sad — Dragana Vuković, head of procurement',
          amount: money('327600.00'),
        },
      },
      {
        id: 'b',
        cells: {
          customer: 'Gradska toplana Novi Sad — Petar Simić, technical department',
          amount: money('184800.00'),
        },
      },
    ],
  },
]

export const ARABIC_QUESTION = 'ما هي الفواتير المتأخرة أكثر من 30 يومًا؟'
export const ARABIC_BLOCKS: AnswerBlock[] = [
  { kind: 'text', text: 'هناك ثلاث فواتير متأخرة أكثر من 30 يومًا، بمجموع 512.400,00 RSD.' },
  {
    kind: 'table',
    caption: 'متأخرة أكثر من 30 يومًا',
    columns: [
      { key: 'number', label: 'الفاتورة' },
      { key: 'amount', label: 'المبلغ المفتوح', numeric: true },
    ],
    rows: [
      { id: '1', href: '#/1', cells: { number: 'F-2026-0371', amount: money('236000.00') } },
      { id: '2', href: '#/2', cells: { number: 'F-2026-0384', amount: money('184800.00') } },
    ],
  },
  {
    kind: 'sources',
    title: 'المصادر',
    items: [{ id: 's', label: 'فواتير المبيعات', href: '#/sales' }],
  },
]
export const ARABIC_FOLLOW_UPS = ['أرسل تذكيرًا بالدفع']

export const JAPANESE_QUESTION = '30日以上支払いが遅れている請求書はどれですか？'
export const JAPANESE_BLOCKS: AnswerBlock[] = [
  { kind: 'text', text: '30日以上遅れている請求書は3件で、合計は 512.400,00 RSD です。' },
  {
    kind: 'table',
    caption: '30日以上の延滞',
    columns: [
      { key: 'number', label: '請求書' },
      { key: 'amount', label: '未払い額', numeric: true },
    ],
    rows: [
      { id: '1', href: '#/1', cells: { number: 'F-2026-0371', amount: money('236000.00') } },
      { id: '2', href: '#/2', cells: { number: 'F-2026-0384', amount: money('184800.00') } },
    ],
  },
  {
    kind: 'sources',
    title: '出典',
    items: [{ id: 's', label: '売上請求書', href: '#/sales' }],
  },
]
export const JAPANESE_FOLLOW_UPS = ['支払いの督促を送る']

export const REPORT_REASONS = [
  { value: 'wrong', label: 'The figures are wrong' },
  { value: 'missing', label: 'Something is missing' },
  { value: 'question', label: 'It answers another question' },
  { value: 'other', label: 'Something else' },
]

export const SUGGESTIONS = [
  QUESTION_OVERDUE,
  QUESTION_REVENUE,
  'Post the Beton Mix invoice',
  'How much VAT is due for September?',
]

export const RECENT = [
  'Which suppliers do we pay the most?',
  'What did we spend on fuel in September?',
  'Who has not signed the work rulebook yet?',
]
