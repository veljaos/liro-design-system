import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { DuplicateWarning } from './duplicate-warning'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { StatusBadge } from './status-badge'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'
import { TextField } from './text-field'

const PANONIJA = {
  key: 'panonija',
  type: 'Customer',
  number: 'Panonija Agro d.o.o.',
  href: '#customers/104987265',
  status: <StatusBadge label="Active" tone="success" />,
}

const RAKIC = {
  key: 'rakic',
  type: 'Customer',
  number: 'Rakić Pekara SZR',
  href: '#customers/111296603',
  status: <StatusBadge label="Inactive" tone="neutral" />,
}

/** The record form around the warning, as the Core shows it after checking the tax number. */
function NewCustomer({ reasonRequired = false }: { reasonRequired?: boolean }) {
  const [created, setCreated] = useState('')
  return (
    <div className="flex max-w-160 flex-col gap-4">
      <TextField label="Name" defaultValue="Panonija Agro DOO" />
      <TextField label="Tax number" direction="ltr" defaultValue="104987265" />
      <DuplicateWarning
        title="A customer with this tax number exists"
        message="Tax number 104987265 belongs to Panonija Agro d.o.o."
        matches={[PANONIJA]}
        onCreateAnyway={(answer) => {
          setCreated(answer === undefined ? 'Created anyway.' : `Created anyway: ${answer.text}`)
        }}
        reasonRequired={reasonRequired}
        {...(reasonRequired
          ? {
              reasons: [
                { value: 'branch', label: 'A branch with its own address' },
                { value: 'other', label: 'Another reason' },
              ],
              reasonMessage: 'The reason is kept with the new customer.',
            }
          : {})}
      />
      {created !== '' && <p className="m-0 text-sm text-secondary">{created}</p>}
    </div>
  )
}

const meta = {
  title: 'Components/Catalogs/DuplicateWarning',
  component: DuplicateWarning,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the Core found records that look like the one being created (the same ' +
          'tax number or name) and says so before anything is saved: a warning with the reason, ' +
          'the existing records as links (kind, name or number, state) and two choices — "Open ' +
          'existing" (with one match) and "Create anyway", which can ask for a reason first ' +
          '(`reasonRequired`, a ReasonConfirmDialog).\n\n' +
          '**When:** in a record form after the Core’s check; in an import’s validation preview ' +
          'for the rows that match (ImportWizard `previewNotice`).\n\n' +
          '**When not:** an error that blocks saving (the field’s own error); the Design System ' +
          'never looks for duplicates itself.',
      },
    },
  },
  args: { matches: [PANONIJA] },
  render: () => (
    <ExampleProvider>
      <NewCustomer />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof DuplicateWarning>

export default meta

type Story = StoryObj<typeof meta>

/** One match: a link to it, "Open existing" and "Create anyway". */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const alert = within(canvas.getByRole('alert'))
    await expect(alert.getByRole('link', { name: /Panonija Agro d.o.o./ })).toHaveAttribute(
      'href',
      '#customers/104987265',
    )
    await expect(alert.getByRole('link', { name: 'Open existing' })).toBeVisible()
    await userEvent.click(alert.getByRole('button', { name: 'Create anyway' }))
    await expect(canvas.getByText('Created anyway.')).toBeVisible()
  },
}

/** The application asks why: Create anyway opens the reason dialog, Cancel focused first. */
export const WithReason: Story = {
  name: 'With a reason',
  render: () => (
    <ExampleProvider>
      <NewCustomer reasonRequired />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const body = within(canvasElement.ownerDocument.body)
    await userEvent.click(canvas.getByRole('button', { name: 'Create anyway' }))
    const dialog = within(await body.findByRole('alertdialog'))
    const confirm = dialog.getByRole('button', { name: 'Create anyway' })
    await expect(confirm).toBeDisabled()
    await userEvent.click(dialog.getByRole('radio', { name: 'A branch with its own address' }))
    await userEvent.type(dialog.getByRole('textbox', { name: 'Details' }), 'Kać warehouse')
    await userEvent.click(confirm)
    await expect(await canvas.findByText('Created anyway: Kać warehouse')).toBeVisible()
  },
}

/** Several matches (same name, one inactive): each a link; no single "Open existing". */
export const SeveralMatches: Story = {
  name: 'Several matches',
  render: () => (
    <ExampleProvider>
      <DuplicateWarning
        title="Customers with a similar name exist"
        matches={[PANONIJA, RAKIC]}
        onCreateAnyway={() => undefined}
      />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getAllByRole('listitem')).toHaveLength(2)
    await expect(canvas.queryByRole('link', { name: 'Open existing' })).toBeNull()
  },
}

/** Only informing: the application offers no way to create (the user may not). */
export const OnlyInforming: Story = {
  name: 'Without Create anyway',
  render: () => (
    <ExampleProvider>
      <DuplicateWarning matches={[PANONIJA]} />
    </ExampleProvider>
  ),
}

/** Long text wraps. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <DuplicateWarning
        title={LONG.label}
        message={LONG.description}
        matches={[{ ...PANONIJA, number: LONG.value }]}
        onCreateAnyway={() => undefined}
      />
    </ExampleProvider>
  ),
}

/** Phone width. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <div className="p-4">
          <NewCustomer />
        </div>
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic sample text, right to left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <DuplicateWarning
        title={ARABIC.label}
        message={ARABIC.description}
        matches={[{ ...PANONIJA, type: ARABIC.label, number: ARABIC.value }]}
        onCreateAnyway={() => undefined}
      />
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <DuplicateWarning
        title={JAPANESE.label}
        message={JAPANESE.description}
        matches={[{ ...PANONIJA, type: JAPANESE.label, number: JAPANESE.value }]}
        onCreateAnyway={() => undefined}
      />
    </StoryProvider>
  ),
}
