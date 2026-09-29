import type { Meta, StoryObj } from '@storybook/react-vite'
import { Users } from 'lucide-react'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { Card, KeyValueList, SectionCard, type KeyValueItem } from './cards'
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
          'of a page: optional icon, title (h4 by default, `headingLevel` to fit the page), ' +
          'description and actions in the header, a line under it, the content below (`flush` ' +
          'for a table). **KeyValueList** — the labelled values of a record in one to four ' +
          'columns (one on phones); labels upper case only in scripts with letter case; an empty ' +
          'value is "—".\n\n' +
          '**When not:** a list of many records (the table, P3); a form (fields in FormSection, ' +
          'P3.5).',
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
  { key: 'total', label: 'Total', value: '12.345,60 EUR', numeric: true },
  { key: 'ref', label: 'Reference', value: null },
  { key: 'note', label: 'Note', value: 'Delivered in two parts.', fullWidth: true },
]

/** A SectionCard with a KeyValueList in two columns. */
export const Default: Story = {
  render: () => (
    <SectionCard
      icon={Users}
      title="Invoice"
      description="Issued to Alfa Trade d.o.o."
      actions={<Button intent="edit" label="Edit" />}
      className="max-w-180"
    >
      <KeyValueList items={ITEMS} />
    </SectionCard>
  ),
}

/** Variants: a plain Card, no divider, flush body, three columns, loading. */
export const Variants: Story = {
  render: () => (
    <div className="flex max-w-180 flex-col gap-4">
      <Card>A plain card with its content.</Card>
      <SectionCard title="Without a divider" withDivider={false}>
        <KeyValueList columns={3} items={ITEMS.slice(0, 3)} />
      </SectionCard>
      <SectionCard title="Flush body" flush>
        <div className="border-0 border-t border-solid border-default px-4 py-2 text-sm">
          A table reaches the edges.
        </div>
      </SectionCard>
      <SectionCard title="Loading">
        <KeyValueList loading items={ITEMS.slice(0, 4)} />
      </SectionCard>
    </div>
  ),
}

/** Long text at phone width: one column, long words broken. */
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
          items={[
            { label: LONG.label, value: LONG.value },
            { label: 'IBAN', value: 'RS35260005601001611379RS35260005601001611379', numeric: true },
          ]}
        />
      </SectionCard>
    </div>
  ),
}

/** Arabic sample text, right to left: labels as written, not upper case or spaced. */
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
