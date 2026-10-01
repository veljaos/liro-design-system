import type { Meta, StoryObj } from '@storybook/react-vite'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { Card, KeyValueList, SectionCard, type KeyValueGroup, type KeyValueItem } from './cards'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { StatusBadge } from './status-badge'

const meta = {
  title: 'Components/Display/Cards',
  component: SectionCard,
  parameters: {
    docs: {
      description: {
        component:
          '**Card** — a surface that groups related content. **SectionCard** — a titled section ' +
          'of a page: the title (h4 by default, `headingLevel` to fit the page) and an optional ' +
          'description at the start, the actions at the end, the content below (`flush` for a ' +
          'table); no icon unless `icon` is given, no line under the header. **KeyValueList** — ' +
          'the labelled values of a record. Layout "rows" (default): the label at the start, the ' +
          'value at the end, lines between rows; one to three `columns` (one on phones); ' +
          '`fullWidth` items (notes) span the columns with the label above; `groups` adds small ' +
          'titled groups. Layout "stacked": the label above the value, no lines, for short ' +
          'cards. An empty value is "—".\n\n' +
          '**When not:** a list of many records (DataTable); a form (fields in FormSection, P3.5).',
      },
    },
  },
  play: settle,
} satisfies Meta<typeof SectionCard>

export default meta

type Story = StoryObj<typeof meta>

const ITEMS: KeyValueItem[] = [
  { key: 'no', label: 'Number', value: 'F-2026-114' },
  { key: 'status', label: 'Status', value: <StatusBadge label="Sent" tone="info" /> },
  { key: 'date', label: 'Issue date', value: '28.09.2026.', numeric: true },
  { key: 'due', label: 'Due date', value: '12.10.2026.', numeric: true },
  { key: 'total', label: 'Total', value: '12.345,60 EUR', numeric: true },
  { key: 'ref', label: 'Reference', value: null },
  { key: 'note', label: 'Note', value: 'Delivered in two parts.', fullWidth: true },
]

const GROUPS: KeyValueGroup[] = [
  {
    key: 'customer',
    title: 'Customer',
    items: [
      { label: 'Name', value: 'Alfa Trade d.o.o.' },
      { label: 'Tax number', value: '101234567', numeric: true },
      { label: 'City', value: 'Novi Sad' },
      { label: 'Contact', value: 'Ana Jovanović' },
    ],
  },
  {
    key: 'payment',
    title: 'Payment',
    items: [
      { label: 'Total', value: '12.345,60 EUR', numeric: true },
      { label: 'Paid', value: '5.000,00 EUR', numeric: true },
      { label: 'Account', value: '160-0000000123456-78', numeric: true },
    ],
  },
]

/** A SectionCard with a title, a description and an action, and a KeyValueList in two columns. */
export const Default: Story = {
  render: () => (
    <SectionCard
      title="Invoice"
      description="Issued to Alfa Trade d.o.o."
      actions={<Button intent="edit" label="Edit" />}
      className="max-w-180"
    >
      <KeyValueList items={ITEMS} />
    </SectionCard>
  ),
}

/** Titled groups ("Customer", "Payment"); no line after the last row of each column. */
export const Groups: Story = {
  render: () => (
    <SectionCard title="Invoice F-2026-114" className="max-w-180">
      <KeyValueList groups={GROUPS} />
    </SectionCard>
  ),
}

/** One and three columns, and the stacked layout for a short card. */
export const ColumnsAndStacked: Story = {
  name: 'Columns and stacked layout',
  render: () => (
    <div className="flex max-w-240 flex-col gap-4">
      <SectionCard title="One column" className="max-w-100">
        <KeyValueList columns={1} items={ITEMS.slice(0, 5)} />
      </SectionCard>
      <SectionCard title="Three columns">
        <KeyValueList columns={3} items={ITEMS} />
      </SectionCard>
      <SectionCard title="Stacked" className="max-w-180">
        <KeyValueList layout="stacked" items={ITEMS} />
      </SectionCard>
      <SectionCard title="Stacked, in groups" className="max-w-180">
        <KeyValueList layout="stacked" groups={GROUPS} />
      </SectionCard>
    </div>
  ),
}

/** A plain Card, a flush body, and loading skeletons in both layouts. */
export const Variants: Story = {
  render: () => (
    <div className="flex max-w-180 flex-col gap-4">
      <Card>A plain card with its content.</Card>
      <SectionCard title="Flush body" actions={<Button intent="refresh" label="Refresh" />} flush>
        <div className="border-0 border-t border-solid border-default px-4 py-2 text-sm">
          A table reaches the edges.
        </div>
      </SectionCard>
      <SectionCard title="Loading">
        <KeyValueList loading items={ITEMS.slice(0, 4)} />
      </SectionCard>
      <SectionCard title="Loading, stacked">
        <KeyValueList loading layout="stacked" items={ITEMS.slice(0, 4)} />
      </SectionCard>
    </div>
  ),
}

/** Long text in one column at phone width: values wrap and stay at the end, labels at the start. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="w-[390px] max-w-full">
      <SectionCard
        title={LONG.label}
        description={LONG.description}
        actions={<Button intent="edit" label="Edit" />}
      >
        <KeyValueList
          columns={1}
          items={[
            { label: LONG.label, value: LONG.value },
            { label: 'IBAN', value: 'RS35260005601001611379RS35260005601001611379', numeric: true },
            { label: 'Note', value: LONG.value, fullWidth: true },
          ]}
        />
      </SectionCard>
    </div>
  ),
}

/** Arabic sample text, right to left: labels at the start (right), values at the end (left). */
export const Arabic: Story = {
  render: () => (
    <div lang="ar" dir="rtl" className="max-w-180">
      <SectionCard title={ARABIC.label} description={ARABIC.description}>
        <KeyValueList
          items={[
            { label: ARABIC.label, value: ARABIC.value },
            { label: ARABIC.options[0], value: '1,234.50', numeric: true },
            { label: ARABIC.options[1], value: null },
          ]}
        />
      </SectionCard>
    </div>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <div lang="ja" className="max-w-180">
      <SectionCard title={JAPANESE.label} description={JAPANESE.description}>
        <KeyValueList
          items={[
            { label: JAPANESE.label, value: JAPANESE.value },
            { label: JAPANESE.options[0], value: '1,234', numeric: true },
          ]}
        />
      </SectionCard>
    </div>
  ),
}
