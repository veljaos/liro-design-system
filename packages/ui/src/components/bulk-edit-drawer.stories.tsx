import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { BulkEditDrawer, type BulkEditField } from './bulk-edit-drawer'
import { Button } from './button'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { SelectField } from './select-field'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'
import { TextField } from './text-field'

const TERMS = [
  { value: '15', label: '15 days' },
  { value: '30', label: '30 days' },
  { value: '45', label: '45 days' },
  { value: '60', label: '60 days' },
]
const GROUPS = [
  { value: 'retail', label: 'Retail' },
  { value: 'wholesale', label: 'Wholesale' },
  { value: 'construction', label: 'Construction companies' },
]

/** The application around the drawer: it keeps the new values and applies them. */
function BulkEdit({
  open: startOpen = true,
  changing: startChanging = [],
  slow = false,
  count = 24,
  groupLabel = 'Customer group',
}: {
  open?: boolean
  changing?: string[]
  slow?: boolean
  count?: number
  groupLabel?: string
}) {
  const [open, setOpen] = useState(startOpen)
  const [changing, setChanging] = useState<string[]>(startChanging)
  const [term, setTerm] = useState('30')
  const [group, setGroup] = useState('')
  const [note, setNote] = useState('')
  const [done, setDone] = useState('')
  const fields: BulkEditField[] = [
    {
      id: 'term',
      label: 'Payment term',
      editor: (
        <SelectField
          label="Payment term"
          hideLabel
          options={TERMS}
          value={term}
          onChange={setTerm}
        />
      ),
      ...(term === '' ? {} : { valueText: TERMS.find((each) => each.value === term)?.label ?? '' }),
    },
    {
      id: 'group',
      label: groupLabel,
      editor: (
        <SelectField
          label={groupLabel}
          hideLabel
          options={GROUPS}
          value={group}
          onChange={setGroup}
          placeholder="Choose a group"
        />
      ),
      ...(group === ''
        ? {}
        : { valueText: GROUPS.find((each) => each.value === group)?.label ?? '' }),
    },
    {
      id: 'agent',
      label: 'Sales agent',
      editor: (
        <SelectField
          label="Sales agent"
          hideLabel
          options={[{ value: 'dragan', label: 'Dragan Ilić' }]}
          disabled
          disabledReason="Only an administrator changes the sales agent."
        />
      ),
    },
    {
      id: 'note',
      label: 'Note on documents',
      editor: <TextField label="Note on documents" hideLabel value={note} onChange={setNote} />,
      ...(note === '' ? {} : { valueText: note }),
    },
  ]
  return (
    <div className="flex flex-col items-start gap-3">
      <Button
        intent="edit"
        label="Edit 24 customers"
        onClick={() => {
          setOpen(true)
        }}
      />
      {done !== '' && <p className="m-0 text-sm text-secondary">{done}</p>}
      <BulkEditDrawer
        open={open}
        onOpenChange={setOpen}
        count={count}
        fields={fields}
        changing={changing}
        onChangingChange={setChanging}
        onApply={() =>
          new Promise<void>((resolve) => {
            if (slow) return
            setDone(`Changed: ${changing.join(', ')}`)
            resolve()
          })
        }
      />
    </div>
  )
}

const meta = {
  title: 'Components/Catalogs/BulkEditDrawer',
  component: BulkEditDrawer,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** changing several records at once — the step after a selection on a ' +
          'catalogue list: BulkActionBar "Edit N records" → this Drawer → one ConfirmDialog with ' +
          'the count. Each field that can be set for all is a checkbox, "Leave unchanged" by ' +
          'default; ticking it shows the application’s field for the new value. "What will ' +
          'change" lists the ticked fields with their new values; Apply asks once ("Change 24 ' +
          'records?") and runs `onApply`.\n\n' +
          '**When:** the same value for many records (payment term, customer group, price ' +
          'list).\n\n' +
          '**When not:** different values per record (edit each record, or import a file: ' +
          'ImportWizard); deactivating records (a row or bulk action, never a field here); ' +
          'deleting (catalogue records are deactivated, not deleted).',
      },
    },
  },
  args: {
    open: true,
    onOpenChange: () => undefined,
    count: 24,
    fields: [],
    changing: [],
    onChangingChange: () => undefined,
    onApply: () => undefined,
  },
  render: () => (
    <ExampleProvider>
      <BulkEdit />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof BulkEditDrawer>

export default meta

type Story = StoryObj<typeof meta>

/**
 * Tick "Payment term", see it in the summary, Apply, confirm with the count: the drawer
 * closes. Every other field is left unchanged.
 */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const body = within(canvasElement.ownerDocument.body)
    const drawer = within(await body.findByRole('dialog', { name: 'Edit 24 records' }))
    await expect(drawer.getByText('Choose at least one field to change.')).toBeVisible()
    await expect(drawer.getByRole('button', { name: 'Apply to 24 records' })).toBeDisabled()
    await userEvent.click(drawer.getByRole('checkbox', { name: 'Payment term' }))
    await expect(drawer.getByRole('combobox', { name: 'Payment term' })).toBeVisible()
    const summary = within(drawer.getByRole('region', { name: 'What will change' }))
    await expect(summary.getByText('30 days')).toBeVisible()
    await userEvent.click(drawer.getByRole('button', { name: 'Apply to 24 records' }))
    const confirm = within(await body.findByRole('alertdialog', { name: 'Change 24 records?' }))
    await settle()
    await expect(confirm.getByText('Payment term: 30 days')).toBeVisible()
    await userEvent.click(confirm.getByRole('button', { name: 'Change' }))
    await waitFor(() => expect(body.queryByRole('dialog')).toBeNull())
    await expect(within(canvasElement).getByText('Changed: term')).toBeVisible()
  },
}

/**
 * Two fields ticked; the sales agent's field is disabled with the application's reason (only an
 * administrator changes it).
 */
export const SeveralFields: Story = {
  name: 'Several fields, one disabled with a reason',
  render: () => (
    <ExampleProvider>
      <BulkEdit changing={['term', 'agent', 'note']} />
    </ExampleProvider>
  ),
}

/** While the change is applied, the confirmation shows it is working and cannot be closed. */
export const Applying: Story = {
  render: () => (
    <ExampleProvider>
      <BulkEdit changing={['term']} slow />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const body = within(canvasElement.ownerDocument.body)
    const drawer = within(await body.findByRole('dialog', { name: 'Edit 24 records' }))
    await userEvent.click(drawer.getByRole('button', { name: 'Apply to 24 records' }))
    const confirm = within(await body.findByRole('alertdialog'))
    await userEvent.click(confirm.getByRole('button', { name: 'Change' }))
    await expect(confirm.getByRole('button', { name: 'Change' })).toHaveAttribute(
      'aria-busy',
      'true',
    )
    await expect(confirm.getByRole('button', { name: 'Cancel' })).toBeDisabled()
    await settle()
  },
}

/** One record: the nouns follow the count. */
export const OneRecord: Story = {
  name: 'One record',
  render: () => (
    <ExampleProvider>
      <BulkEdit count={1} changing={['term']} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const body = within(canvasElement.ownerDocument.body)
    await expect(await body.findByRole('dialog', { name: 'Edit 1 record' })).toBeVisible()
    await expect(body.getByRole('button', { name: 'Apply to 1 record' })).toBeEnabled()
  },
}

/** Long text wraps in the drawer. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <BulkEdit groupLabel={LONG.label} changing={['group']} />
    </ExampleProvider>
  ),
}

/** Phone width: the drawer takes the whole width. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <BulkEdit changing={['term']} />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic sample text, right to left: from the end side, which is the left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <BulkEdit groupLabel={ARABIC.label} changing={['group']} />
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <BulkEdit groupLabel={JAPANESE.label} changing={['group']} />
    </StoryProvider>
  ),
}
