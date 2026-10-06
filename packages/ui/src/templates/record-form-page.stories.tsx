import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { ActionGroup } from '../components/actions'
import { KeyValueList } from '../components/cards'
import { DateField } from '../components/date-field'
import { SelectField } from '../components/select-field'
import { TextField } from '../components/text-field'
import { FormSection } from '../components/form-layout'
import { MoneyField } from '../components/number-field'
import { StatusBadge } from '../components/status-badge'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { settle } from '../primitives/story-helpers'
import { AppShell } from './app-shell'
import { RecordFormPage, type RecordFormPageProps } from './detail-page'
import { BRAND, COMMANDS, COMPANIES, EMPLOYEE, HR_TABS, USER } from './shell-story-data'

/** The employee form as the Core would drive it: the values and `dirty` live here. */
function EmployeeForm({
  phone = false,
  startDirty = false,
  ...props
}: Partial<RecordFormPageProps> & { phone?: boolean; startDirty?: boolean }) {
  const [phoneNumber, setPhoneNumber] = useState<string>(EMPLOYEE.phone)
  const [dirty, setDirty] = useState(startDirty)
  const change = (setter: (value: string) => void) => (value: string) => {
    setter(value)
    setDirty(true)
  }
  return (
    <AppShell
      layout={phone ? 'phone' : 'desktop'}
      brand={BRAND}
      breadcrumbs={[
        { label: 'Employees', href: '#hr/employees' },
        { label: EMPLOYEE.name, href: '#hr/employees/42' },
        { label: 'Edit' },
      ]}
      commands={{ items: COMMANDS }}
      notifications={{ unread: 0, panel: <p className="m-0 text-sm">No notifications.</p> }}
      companies={{ items: COMPANIES, current: 'kvadrat', onSelect: () => undefined }}
      user={USER}
      moduleTabs={HR_TABS}
    >
      <RecordFormPage
        layout={phone ? 'phone' : 'desktop'}
        title={EMPLOYEE.name}
        back={{ href: '#hr/employees/42', label: EMPLOYEE.name }}
        status={<StatusBadge label="Active" tone="success" />}
        subtitle={`${EMPLOYEE.position} · ${EMPLOYEE.department}`}
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
        side={
          <section className="flex flex-col gap-3 rounded-lg border border-solid border-default bg-surface-raised p-4">
            <h2 className="m-0 text-h5 text-primary">Record</h2>
            <KeyValueList
              layout="stacked"
              columns={1}
              items={[
                { label: 'Created', value: 'Milica Petrović, 01.03.2021.' },
                { label: 'Last changed', value: 'Dragan Ilić, 01.07.2026.' },
              ]}
            />
          </section>
        }
        {...props}
      >
        <div className="flex flex-col gap-4">
          <FormSection title="Personal" columns={phone ? 1 : 2}>
            <TextField label="First name" defaultValue="Jelena" required />
            <TextField label="Last name" defaultValue="Marković" required />
            <DateField label="Date of birth" defaultValue={EMPLOYEE.birthDate} />
            <TextField
              label="Phone"
              type="tel"
              value={phoneNumber}
              onChange={change(setPhoneNumber)}
            />
            <TextField label="E-mail" type="email" defaultValue={EMPLOYEE.email} />
            <TextField label="Address" defaultValue={EMPLOYEE.address} />
          </FormSection>
          <FormSection title="Employment" columns={phone ? 1 : 2}>
            <TextField label="Position" defaultValue={EMPLOYEE.position} />
            <SelectField
              label="Department"
              defaultValue="finance"
              options={[
                { value: 'finance', label: 'Finance' },
                { value: 'sales', label: 'Sales' },
                { value: 'production', label: 'Production' },
              ]}
            />
            <DateField label="Start date" defaultValue={EMPLOYEE.since} />
            <DateField label="Contract end" defaultValue={EMPLOYEE.contractEnd} />
          </FormSection>
          <FormSection title="Payroll" columns={phone ? 1 : 2}>
            <MoneyField label="Gross salary" currency="RSD" defaultValue={EMPLOYEE.gross} />
            <TextField label="Bank account" defaultValue={EMPLOYEE.account} direction="ltr" />
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
          '**What for:** creating or editing a record with more than about ten fields, tabs or ' +
          'attachments, on its own page (it has an address, room for errors and a back ' +
          'button). The back button and the title in one row; the actions at the top and, ' +
          'while those are out of view, in the bottom bar with "Unsaved changes"; the side ' +
          'column 300px from 75em. While `dirty`, the back button and closing the page ask ' +
          'first.\n\n' +
          '**How:** `title`, `back`, `actions` (an ActionGroup), `dirty`, the form as children ' +
          '(FormSections or FormTabs), `side`.\n\n' +
          '**When not:** a short edit with the list still visible (a Drawer); one action with ' +
          'one outcome (a Dialog).',
      },
    },
  },
  args: { title: EMPLOYEE.name, actions: null, children: null },
  render: () => (
    <ExampleProvider>
      <EmployeeForm />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof RecordFormPage>

export default meta

type Story = StoryObj<typeof meta>

/** Editing an employee: three sections, the side column. */
export const Default: Story = {}

/** Unsaved changes: the back button asks first. */
export const UnsavedChanges: Story = {
  name: 'Unsaved changes',
  render: () => (
    <ExampleProvider>
      <EmployeeForm startDirty />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await userEvent.click(
      within(canvasElement).getByRole('link', { name: `Back to ${EMPLOYEE.name}` }),
    )
    await settle()
    const dialog = within(document.body).getByRole('alertdialog')
    await expect(within(dialog).getByRole('button', { name: 'Stay' })).toBeVisible()
  },
}

/** Phone width: one column, the side column under the form. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <EmployeeForm phone />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Arabic title in a right-to-left page. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <EmployeeForm title="ليلى حداد" back={{ href: '#e', label: 'الموظفون' }} />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese title. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <EmployeeForm title="佐藤 花子" back={{ href: '#e', label: '従業員' }} />
      </ExampleProvider>
    </StoryProvider>
  ),
}
