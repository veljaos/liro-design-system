import type { Meta, StoryObj } from '@storybook/react-vite'
import { Printer } from 'lucide-react'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { ActionGroup } from '../components/actions'
import { Button } from '../components/button'
import { KeyValueList } from '../components/cards'
import { DateField } from '../components/date-field'
import { DateRangeText, DateText, MoneyText } from '../components/display-text'
import { FormFullWidth, FormGrid } from '../components/form-layout'
import type { KeyFigure } from '../components/key-figures'
import { MoneyField } from '../components/number-field'
import { SelectField } from '../components/select-field'
import { StatusBadge } from '../components/status-badge'
import { ExampleProvider, PhoneFrame, StoryProvider } from '../components/story-frames'
import { TextField } from '../components/text-field'
import { settle } from '../primitives/story-helpers'
import { AppShell } from './app-shell'
import { DetailPage, type DetailPageProps, type DetailSection } from './detail-page'
import { BRAND, COMMANDS, COMPANIES, EMPLOYEE, HR_TABS, USER } from './shell-story-data'

/** What the Core keeps while the record is edited; the stories play the Core. */
interface Values {
  phone: string
  email: string
  address: string
  position: string
}

const START: Values = {
  phone: EMPLOYEE.phone,
  email: EMPLOYEE.email,
  address: EMPLOYEE.address,
  position: EMPLOYEE.position,
}

/**
 * The employee's sections — Personal, Employment, Leave, Payroll — each with its values to read
 * and the same values as fields. Leave is kept by leave requests, so it stays read-only in edit
 * mode; Payroll only when `payrollEditable`.
 */
function employeeSections(
  values: Values,
  change: (patch: Partial<Values>) => void,
  payrollEditable = true,
): DetailSection[] {
  return [
    {
      id: 'personal',
      label: 'Personal',
      content: (
        <KeyValueList
          items={[
            {
              label: 'Date of birth',
              value: <DateText value={EMPLOYEE.birthDate} />,
              numeric: true,
            },
            { label: 'Personal ID', value: EMPLOYEE.personalId, numeric: true },
            { label: 'Phone', value: values.phone, numeric: true },
            { label: 'E-mail', value: values.email },
            { label: 'Address', value: values.address, fullWidth: true },
          ]}
        />
      ),
      edit: (
        <FormGrid>
          <DateField label="Date of birth" defaultValue={EMPLOYEE.birthDate} />
          <TextField label="Personal ID" value={EMPLOYEE.personalId} readOnly direction="ltr" />
          <TextField
            label="Phone"
            type="tel"
            value={values.phone}
            direction="ltr"
            onChange={(phone) => {
              change({ phone })
            }}
          />
          <TextField
            label="E-mail"
            type="email"
            value={values.email}
            direction="ltr"
            onChange={(email) => {
              change({ email })
            }}
          />
          <FormFullWidth>
            <TextField
              label="Address"
              value={values.address}
              onChange={(address) => {
                change({ address })
              }}
            />
          </FormFullWidth>
        </FormGrid>
      ),
    },
    {
      id: 'employment',
      label: 'Employment',
      content: (
        <KeyValueList
          items={[
            { label: 'Position', value: values.position },
            { label: 'Department', value: EMPLOYEE.department },
            { label: 'Contract', value: EMPLOYEE.contract },
            {
              label: 'Contract period',
              value: <DateRangeText from={EMPLOYEE.since} to={EMPLOYEE.contractEnd} />,
              numeric: true,
            },
            { label: 'Working hours', value: EMPLOYEE.hours },
          ]}
        />
      ),
      edit: (
        <FormGrid>
          <TextField
            label="Position"
            value={values.position}
            onChange={(position) => {
              change({ position })
            }}
          />
          <SelectField
            label="Department"
            defaultValue="finance"
            options={[
              { value: 'finance', label: 'Finance' },
              { value: 'sales', label: 'Sales' },
              { value: 'warehouse', label: 'Warehouse' },
            ]}
          />
          <SelectField
            label="Contract"
            defaultValue="fixed"
            options={[
              { value: 'fixed', label: 'Fixed term' },
              { value: 'indefinite', label: 'Indefinite' },
            ]}
          />
          <DateField label="Contract end" defaultValue={EMPLOYEE.contractEnd} />
          <TextField label="Working hours" defaultValue={EMPLOYEE.hours} />
        </FormGrid>
      ),
    },
    {
      id: 'leave',
      label: 'Leave',
      description: 'Changed through leave requests',
      content: (
        <KeyValueList
          items={[
            { label: 'Days left in 2026', value: EMPLOYEE.leaveLeft, numeric: true },
            { label: 'Days taken', value: '18', numeric: true },
            {
              label: 'Next leave',
              value: <DateRangeText from="2026-12-28" to="2026-12-31" />,
              numeric: true,
            },
            { label: 'Manager', value: EMPLOYEE.manager },
          ]}
        />
      ),
    },
    {
      id: 'payroll',
      label: 'Payroll',
      editable: payrollEditable,
      content: (
        <KeyValueList
          items={[
            {
              label: 'Gross salary',
              value: <MoneyText value={EMPLOYEE.gross} currency="RSD" />,
              numeric: true,
            },
            { label: 'Bank account', value: EMPLOYEE.account, numeric: true },
            { label: 'Tax relief', value: 'Standard' },
            { label: 'Pension fund', value: 'PIO Fund of Serbia' },
          ]}
        />
      ),
      edit: (
        <FormGrid>
          <MoneyField label="Gross salary" currency="RSD" defaultValue={EMPLOYEE.gross} />
          <TextField label="Bank account" defaultValue={EMPLOYEE.account} direction="ltr" />
        </FormGrid>
      ),
    },
  ]
}

const KEY_FIGURES: readonly KeyFigure[] = [
  {
    label: 'Net salary, September 2026',
    value: <MoneyText value={EMPLOYEE.net} currency="RSD" />,
  },
  { label: 'Leave left', value: `${EMPLOYEE.leaveLeft} days` },
  { label: 'Contract ends', value: <DateText value={EMPLOYEE.contractEnd} /> },
]

interface RecordOptions {
  phone?: boolean
  startMode?: 'view' | 'edit'
  payrollEditable?: boolean
  frame?: Partial<DetailPageProps>
}

/** The employee's record as the Core drives it: the mode, the values and `dirty` live here. */
function EmployeeRecord({
  phone = false,
  startMode = 'view',
  payrollEditable = true,
  frame,
}: RecordOptions) {
  const [mode, setMode] = useState(startMode)
  const [saved, setSaved] = useState(START)
  const [values, setValues] = useState(START)
  const dirty = JSON.stringify(values) !== JSON.stringify(saved)
  const editButton = (
    <Button
      intent="edit"
      label="Edit"
      onClick={() => {
        setMode('edit')
      }}
    />
  )
  const editing = mode === 'edit'
  return (
    <AppShell
      layout={phone ? 'phone' : 'desktop'}
      brand={BRAND}
      breadcrumbs={[{ label: 'Employees', href: '#hr/employees' }, { label: EMPLOYEE.name }]}
      commands={{ items: COMMANDS }}
      notifications={{ unread: 0, panel: <p className="m-0 text-sm">No notifications.</p> }}
      companies={{ items: COMPANIES, current: 'kvadrat', onSelect: () => undefined }}
      user={USER}
      moduleTabs={HR_TABS}
      // On phones the main action stands in the shell's bottom bar, within thumb reach; while
      // editing, the page's own bar (Cancel, Save) takes that place.
      {...(phone && !editing ? { bottomBar: editButton } : {})}
    >
      <DetailPage
        title={EMPLOYEE.name}
        back={{ href: '#hr/employees', label: 'Employees' }}
        status={<StatusBadge label="Active" tone="success" />}
        subtitle={`${EMPLOYEE.position} · ${EMPLOYEE.department}`}
        keyFigures={KEY_FIGURES}
        actions={
          <>
            <Button family="document" icon={Printer} label="Print record" emphasis="secondary" />
            {!phone && editButton}
          </>
        }
        sections={employeeSections(
          values,
          (patch) => {
            setValues((current) => ({ ...current, ...patch }))
          },
          payrollEditable,
        )}
        mode={mode}
        dirty={dirty}
        editActions={
          <ActionGroup
            actions={[
              {
                key: 'cancel',
                intent: 'cancel',
                label: 'Cancel',
                onClick: () => {
                  setValues(saved)
                  setMode('view')
                },
              },
              {
                key: 'save',
                intent: 'save',
                label: 'Save',
                onClick: () => {
                  setSaved(values)
                  setMode('view')
                },
              },
            ]}
          />
        }
        layout={phone ? 'phone' : 'desktop'}
        {...frame}
      />
    </AppShell>
  )
}

const meta = {
  title: 'Templates/DetailPage',
  component: DetailPage,
  parameters: {
    screen: true,
    docs: {
      description: {
        component:
          '**What for:** one record (an employee, a customer, an item), read and edited on one ' +
          'page. The header: the back button to its list, the record’s name (its h1), the ' +
          'status, a line under it and the actions; the key figures under it; then the ' +
          'sections stacked, their values as plain text in two columns of label and value ' +
          '(KeyValueList), never disabled inputs. No tabs and no side column: history and files ' +
          'are sections too. `sectionBar` adds the sticky row of section names for a long ' +
          'record.\n\n' +
          '**Editing (SAP Fiori):** one mode for the whole record. The one "Edit" header action ' +
          '(intent edit) sets `mode` to "edit": every section shows its `edit` content — fields ' +
          'in a FormGrid, in the same order — and a section with `editable: false` stays ' +
          'read-only; the header actions go away and a bar at the bottom with Cancel and Save ' +
          '(`editActions`) stays visible while the page scrolls, on phones too; the first field ' +
          'takes the focus; while `dirty`, leaving asks first. No per-section Edit buttons.\n\n' +
          '**Tabs** only for a record whose sections serve different people at different times ' +
          'and that is longer than about eight sections (an item with its sales, purchasing and ' +
          'warehouse data): then the sections are grouped under start-aligned page Tabs, edit ' +
          'mode still covers the whole record, and a tab with an error says so. Below that, ' +
          'the section bar is enough.\n\n' +
          '**How:** `title`, `back`, `status`, `subtitle`, `actions`, `keyFigures`, `sections` ' +
          '(id, label, content, edit, editable), `mode`, `editActions`, `dirty`.\n\n' +
          '**When not:** a new record (RecordFormPage); a business document with lines ' +
          '(DocumentPage).',
      },
    },
  },
  args: { title: EMPLOYEE.name, sections: [] },
  render: () => (
    <ExampleProvider>
      <EmployeeRecord />
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof DetailPage>

export default meta

type Story = StoryObj<typeof meta>

/** An employee's record: back, key figures, four sections of values. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('heading', { level: 1, name: EMPLOYEE.name })).toBeVisible()
    await expect(canvas.getByRole('link', { name: 'Back to Employees' })).toHaveAttribute(
      'href',
      '#hr/employees',
    )
    // Values are text, never disabled inputs.
    await expect(canvas.queryAllByRole('textbox')).toHaveLength(0)
  },
}

/**
 * Edit pressed: the same sections as fields, the first one focused, Leave still read-only, the
 * bar with Cancel and Save at the bottom; a change says "Unsaved changes".
 */
export const EditMode: Story = {
  name: 'Edit mode',
  render: () => (
    <ExampleProvider>
      <EmployeeRecord startMode="edit" />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    await expect(within(canvasElement).queryByRole('button', { name: 'Edit' })).toBeNull()
  },
}

export const EditModeInteraction: Story = {
  name: 'Edit mode, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }))
    await settle()
    await expect(canvas.queryByRole('button', { name: 'Edit' })).toBeNull()
    const phone = canvas.getByRole('textbox', { name: 'Phone' })
    await userEvent.clear(phone)
    await userEvent.type(phone, '+381 64 218 4474')
    await expect(canvas.getByText('Unsaved changes')).toBeVisible()
    await expect(canvas.getByRole('button', { name: 'Save' })).toBeVisible()
    await expect(canvas.getByText('Changed through leave requests')).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: 'Cancel' }))
    await settle()
    await expect(canvas.getByText(EMPLOYEE.phone)).toBeVisible()
  },
}

/** Saving goes back to reading, with the new value. */
export const EditAndSave: Story = {
  name: 'Edit and save',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }))
    await settle()
    await waitFor(async () => {
      await expect(document.activeElement).toHaveAccessibleName('Date of birth')
    })
    const position = canvas.getByRole('textbox', { name: 'Position' })
    await userEvent.clear(position)
    await userEvent.type(position, 'Head of accounting')
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await settle()
    await expect(canvas.getByText('Head of accounting')).toBeVisible()
    await expect(canvas.queryByText('Unsaved changes')).toBeNull()
  },
}

/** A user who may not change pay: in edit mode Payroll keeps its values as text. */
export const ReadOnlySection: Story = {
  name: 'Read-only section in edit mode',
  render: () => (
    <ExampleProvider>
      <EmployeeRecord startMode="edit" payrollEditable={false} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryByRole('textbox', { name: 'Bank account' })).toBeNull()
    await expect(canvas.getByText(EMPLOYEE.account)).toBeVisible()
  },
}

/** Leaving with unsaved changes asks first: Stay, then Leave (the main action last). */
export const UnsavedChanges: Story = {
  name: 'Unsaved changes',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Edit' }))
    await settle()
    await userEvent.type(canvas.getByRole('textbox', { name: 'Address' }), ', stan 4')
    await userEvent.click(canvas.getByRole('link', { name: 'Back to Employees' }))
    await settle()
    const dialog = within(document.body).getByRole('alertdialog')
    const buttons = within(dialog).getAllByRole('button')
    await expect(buttons.at(-2)).toHaveAccessibleName('Stay')
    await expect(buttons.at(-1)).toHaveAccessibleName('Leave')
  },
}

/** A long record with the section bar: a press scrolls to the section and marks it current. */
export const SectionBarStory: Story = {
  name: 'Section bar',
  render: () => (
    <ExampleProvider>
      <EmployeeRecord frame={{ sectionBar: true }} />
    </ExampleProvider>
  ),
  play: settle,
}

export const SectionBarStoryInteraction: Story = {
  name: 'Section bar, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <EmployeeRecord frame={{ sectionBar: true }} />
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const nav = within(within(canvasElement).getByRole('navigation', { name: 'Sections' }))
    // The smooth scroll to Payroll ends before the story scrolls back, or it would carry on
    // under the instant one and leave the page a few pixels off (seen in the visual tests).
    const scrolled = new Promise<void>((resolve) => {
      document.addEventListener(
        'scrollend',
        () => {
          resolve()
        },
        { capture: true, once: true },
      )
      setTimeout(resolve, 2000)
    })
    await userEvent.click(nav.getByRole('link', { name: 'Payroll' }))
    await expect(nav.getByRole('link', { name: 'Payroll' })).toHaveAttribute(
      'aria-current',
      'location',
    )
    await expect(document.activeElement?.id).toBe('payroll')
    await scrolled
    // Back to the first section at once (whatever element scrolls), so the picture does not
    // depend on the smooth scroll's timing.
    document.getElementById('personal')?.scrollIntoView({ behavior: 'instant', block: 'start' })
    await waitFor(async () => {
      await expect(nav.getByRole('link', { name: 'Personal' })).toHaveAttribute(
        'aria-current',
        'location',
      )
    })
  },
}

/** Without key figures: two sections. */
export const Simple: Story = {
  render: () => (
    <ExampleProvider>
      <EmployeeRecord
        frame={{ keyFigures: [], sections: employeeSections(START, () => undefined).slice(0, 2) }}
      />
    </ExampleProvider>
  ),
}

/**
 * Phone width: the figures in two columns, each label above its value, Edit in the shell's
 * bottom bar.
 */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <EmployeeRecord phone />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Phone width while editing: one column of fields, Cancel and Save in the bottom bar. */
export const PhoneEdit: Story = {
  name: 'Phone width, edit mode',
  render: () => (
    <PhoneFrame>
      <ExampleProvider>
        <EmployeeRecord phone startMode="edit" />
      </ExampleProvider>
    </PhoneFrame>
  ),
}

/** Long names and values wrap. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <ExampleProvider>
      <EmployeeRecord
        frame={{
          title: 'Aleksandra Stefanović-Radosavljević',
          subtitle: 'Head of accounting and financial reporting · Finance and controlling',
        }}
      />
    </ExampleProvider>
  ),
}

/** Arabic record names in a right-to-left page. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <DetailPage
          title="ليلى حداد"
          subtitle="محاسبة أولى · المالية"
          back={{ href: '#e', label: 'الموظفون' }}
          keyFigures={KEY_FIGURES}
          sections={employeeSections(START, () => undefined).slice(0, 1)}
          layout="desktop"
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese record names. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <DetailPage
          title="佐藤 花子"
          subtitle="主任会計士 · 経理部"
          back={{ href: '#e', label: '従業員' }}
          keyFigures={KEY_FIGURES}
          sections={employeeSections(START, () => undefined).slice(0, 1)}
          layout="desktop"
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}
