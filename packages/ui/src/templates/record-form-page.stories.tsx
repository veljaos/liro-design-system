import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { ActionGroup } from '../components/actions'
import { DateField } from '../components/date-field'
import { SelectField } from '../components/select-field'
import { TextField } from '../components/text-field'
import { FormFullWidth, FormSection } from '../components/form-layout'
import { MoneyField } from '../components/number-field'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { AppShell } from './app-shell'
import { RecordFormPage, type RecordFormPageProps } from './detail-page'
import { BRAND, COMMANDS, COMPANIES, HR_TABS, USER } from './shell-story-data'

/** A new employee's form as the Core would drive it: the values and `dirty` live here. */
function NewEmployeeForm({
  phone = false,
  startDirty = false,
  ...props
}: Partial<RecordFormPageProps> & { phone?: boolean; startDirty?: boolean }) {
  const [firstName, setFirstName] = useState(startDirty ? 'Nikola' : '')
  const [dirty, setDirty] = useState(startDirty)
  const columns = phone ? 1 : 2
  return (
    <AppShell
      layout={phone ? 'phone' : 'desktop'}
      brand={BRAND}
      breadcrumbs={[{ label: 'Employees', href: '#hr/employees' }, { label: 'New employee' }]}
      commands={{ items: COMMANDS }}
      notifications={{ unread: 0, panel: <p className="m-0 text-sm">No notifications.</p> }}
      companies={{ items: COMPANIES, current: 'kvadrat', onSelect: () => undefined }}
      user={USER}
      moduleTabs={HR_TABS}
    >
      <RecordFormPage
        layout={phone ? 'phone' : 'desktop'}
        title="New employee"
        back={{ href: '#hr/employees', label: 'Employees' }}
        dirty={dirty}
        actions={
          <ActionGroup
            actions={[
              { key: 'cancel', intent: 'cancel', label: 'Cancel' },
              {
                key: 'save',
                intent: 'save',
                label: 'Save',
                onClick: () => {
                  setDirty(false)
                },
              },
            ]}
          />
        }
        {...props}
      >
        <div className="flex flex-col gap-4">
          <FormSection title="Personal" columns={columns}>
            <TextField
              label="First name"
              required
              value={firstName}
              onChange={(value) => {
                setFirstName(value)
                setDirty(true)
              }}
            />
            <TextField label="Last name" required />
            <DateField label="Date of birth" />
            <TextField label="Phone" type="tel" placeholder="+381 6x xxx xxxx" />
            <TextField label="E-mail" type="email" />
            <FormFullWidth>
              <TextField label="Address" />
            </FormFullWidth>
          </FormSection>
          <FormSection title="Employment" columns={columns}>
            <TextField label="Position" required />
            <SelectField
              label="Department"
              options={[
                { value: 'finance', label: 'Finance' },
                { value: 'sales', label: 'Sales' },
                { value: 'production', label: 'Production' },
              ]}
            />
            <DateField label="Start date" defaultValue="2026-11-01" />
            <DateField label="Contract end" />
          </FormSection>
          <FormSection title="Payroll" columns={columns}>
            <MoneyField label="Gross salary" currency="RSD" />
            <TextField label="Bank account" direction="ltr" />
          </FormSection>
        </div>
      </RecordFormPage>
    </AppShell>
  )
}

const meta = {
  title: 'Templates/RecordFormPage',
  component: RecordFormPage,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** creating a new record with more than about ten fields or attachments, ' +
          'on its own page (it has an address, room for errors and a back button). The back ' +
          'button and the title in one row; the form’s sections stacked, no tabs and no side ' +
          'column; the actions at the top and, while those are out of view, in the bottom bar ' +
          'with "Unsaved changes". While `dirty`, the back button and closing the page ask ' +
          'first (Stay, then Leave).\n\n' +
          '**How:** `title`, `back`, `actions` (an ActionGroup: Cancel, then Save), `dirty`, the ' +
          'form as children (FormSections).\n\n' +
          '**When not:** an existing record — it is read and edited on its DetailPage (`mode` ' +
          '"edit", one Edit for the whole record); a short edit with the list still visible (a ' +
          'Drawer); one action with one outcome (a Dialog).',
      },
    },
  },
  args: { title: 'New employee', actions: null, children: null },
  render: () => (
    <ExampleProvider>
      <NewEmployeeForm />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof RecordFormPage>

export default meta

type Story = StoryObj<typeof meta>

/** A new employee: three sections. */
export const Default: Story = {}

/**
 * Unsaved changes: the back button asks first. The dialog's text and its buttons share one inset;
 * Stay, then Leave (the main action last), 8px apart.
 */
export const UnsavedChanges: Story = {
  name: 'Unsaved changes',
  render: () => (
    <ExampleProvider>
      <NewEmployeeForm startDirty />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(within(canvasElement).getByRole('link', { name: 'Back to Employees' }))
    await settle()
    const dialog = within(document.body).getByRole('alertdialog')
    const buttons = within(dialog).getAllByRole('button')
    await expect(buttons.at(-2)).toHaveAccessibleName('Stay')
    await expect(buttons.at(-1)).toHaveAccessibleName('Leave')
    await expect(within(dialog).getByRole('button', { name: 'Stay' })).toBeVisible()
  },
}

/** Phone width: one column of fields. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <NewEmployeeForm phone />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic title in a right-to-left page. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <NewEmployeeForm title="موظف جديد" back={{ href: '#e', label: 'الموظفون' }} />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese title. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <NewEmployeeForm title="新しい従業員" back={{ href: '#e', label: '従業員' }} />
      </ExampleProvider>
    </StoryProvider>
  ),
}
