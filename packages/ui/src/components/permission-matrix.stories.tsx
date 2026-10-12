import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import type { PermissionValue } from './admin-logic'
import { SectionCard } from './cards'
import {
  ACTIONS,
  AREAS,
  permissionApplies,
  permissionUnavailable,
  SITE_MANAGER,
} from './group-c-story-data'
import { PermissionMatrix, type PermissionMatrixProps } from './permission-matrix'
import { PhoneFrame, StoryProvider } from './story-frames'

/** The application around the matrix: it keeps the value the matrix reports. */
function Editable(props: Partial<PermissionMatrixProps>) {
  const [value, setValue] = useState<PermissionValue>(props.value ?? SITE_MANAGER)
  return (
    <PermissionMatrix
      areas={AREAS}
      actions={ACTIONS}
      label="Permissions of Site manager"
      applies={permissionApplies}
      unavailable={permissionUnavailable}
      {...props}
      value={value}
      onChange={(next, change) => {
        setValue(next)
        props.onChange?.(next, change)
      }}
    />
  )
}

const meta = {
  title: 'Components/Administration/PermissionMatrix',
  component: PermissionMatrix,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** what a role may do, areas × actions, for a company administrator: a ' +
          'table with the areas as row headers and the actions as column headers, a checkbox per ' +
          'cell ("Edit: Sales invoices"). A cell the action does not apply to shows a dash; a ' +
          'cell the Core does not let this role have keeps its checkbox, unavailable, with the ' +
          'reason as its description and tooltip. A **built-in role** is read-only: checks and ' +
          'dashes as text, never disabled checkboxes.\n\n' +
          '**Keyboard:** one checkbox is in the tab order; the arrows move from cell to cell ' +
          '(the forward arrow in the reading direction to the next column), Home and End to the ' +
          'row’s ends, Ctrl+Home and Ctrl+End to the corners, Space changes the cell.\n\n' +
          '**Phones:** each area with its actions as checkboxes, one under the other.\n\n' +
          '**Users and roles** are composed from the existing pieces: the members, roles and ' +
          'invitations are DataTables with StatusBadges (see "Examples / Users and roles"); the ' +
          'matrix is the one new piece.\n\n' +
          '**When not:** one person’s single switches (SettingsPage rows).',
      },
    },
  },
  args: {
    areas: AREAS,
    actions: ACTIONS,
    value: SITE_MANAGER,
    label: 'Permissions of Site manager',
  },
  render: () => (
    <SectionCard
      title="Site manager"
      description="Custom role · 1 member"
      headingLevel={2}
      className="max-w-200"
    >
      <Editable />
    </SectionCard>
  ),
  play: settle,
} satisfies Meta<typeof PermissionMatrix>

export default meta

type Story = StoryObj<typeof meta>

const onChange = fn()

/** A custom role: Space changes a cell; the arrows move like a grid. */
export const Default: Story = {
  render: () => (
    <SectionCard
      title="Site manager"
      description="Custom role · 1 member"
      headingLevel={2}
      className="max-w-200"
    >
      <Editable onChange={onChange} />
    </SectionCard>
  ),
  play: settle,
}

export const DefaultInteraction: Story = {
  name: 'Default, interaction',
  tags: ['interaction'],
  render: () => (
    <SectionCard
      title="Site manager"
      description="Custom role · 1 member"
      headingLevel={2}
      className="max-w-200"
    >
      <Editable onChange={onChange} />
    </SectionCard>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const forward =
      getComputedStyle(canvasElement.querySelector('table') ?? canvasElement).direction === 'rtl'
        ? '{ArrowLeft}'
        : '{ArrowRight}'
    // Only one checkbox is in the tab order.
    await userEvent.tab()
    const first = canvas.getByRole('checkbox', { name: 'View: Sales invoices' })
    await expect(first).toHaveFocus()
    await userEvent.keyboard(forward)
    const create = canvas.getByRole('checkbox', { name: 'Create: Sales invoices' })
    await expect(create).toHaveFocus()
    await userEvent.keyboard(' ')
    await expect(create).toBeChecked()
    await expect(onChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ sales: ['view', 'create'] }),
      { area: 'sales', action: 'create', allowed: true },
    )
    await userEvent.keyboard('{ArrowDown}')
    await expect(canvas.getByRole('checkbox', { name: 'Create: Supplier invoices' })).toHaveFocus()
    // Reports have only View: the arrow goes on past the dashes.
    await userEvent.keyboard('{Control>}{End}{/Control}')
    await expect(canvas.getByRole('checkbox', { name: 'Delete: Company settings' })).toHaveFocus()
    await userEvent.keyboard('{Home}')
    await expect(canvas.getByRole('checkbox', { name: 'View: Company settings' })).toHaveFocus()
  },
}

/** A cell the Core does not allow: focusable, its reason as the description; Space does nothing. */
export const Unavailable: Story = {
  name: 'Unavailable with reason',
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const cell = canvas.getByRole('checkbox', { name: 'Edit: Company settings' })
    await expect(cell).toHaveAttribute('aria-disabled', 'true')
    await expect(cell).toHaveAccessibleDescription(
      /Only the Administrator role can change company settings/,
    )
    await settle()
  },
}

export const UnavailableInteraction: Story = {
  name: 'Unavailable with reason, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const cell = canvas.getByRole('checkbox', { name: 'Edit: Company settings' })
    await expect(cell).toHaveAttribute('aria-disabled', 'true')
    await expect(cell).toHaveAccessibleDescription(
      /Only the Administrator role can change company settings/,
    )
    cell.focus()
    await userEvent.keyboard(' ')
    await expect(cell).not.toBeChecked()
  },
}

/** A built-in role: read-only, checks and dashes as text. */
export const ReadOnly: Story = {
  name: 'Read-only (built-in role)',
  render: () => (
    <SectionCard
      title="Accountant"
      description="Built-in role: duplicate it to change its permissions."
      headingLevel={2}
      className="max-w-200"
    >
      <PermissionMatrix
        areas={AREAS}
        actions={ACTIONS}
        label="Permissions of Accountant"
        applies={permissionApplies}
        readOnly
        value={{
          sales: ['view', 'create', 'edit'],
          purchasing: ['view', 'create', 'edit', 'approve'],
          partners: ['view', 'create', 'edit'],
          inventory: ['view'],
          banking: ['view', 'create', 'edit'],
          reports: ['view'],
          settings: ['view'],
        }}
      />
    </SectionCard>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.queryAllByRole('checkbox')).toHaveLength(0)
    await expect(canvasElement).toHaveTextContent('Allowed')
    await expect(canvasElement).toHaveTextContent('Not applicable')
  },
}

/** Nothing allowed yet: a new custom role. */
export const Empty: Story = {
  name: 'New role (nothing allowed)',
  render: () => (
    <SectionCard title="New role" headingLevel={2} className="max-w-200">
      <Editable value={{}} label="Permissions of the new role" />
    </SectionCard>
  ),
}

/** Long area and action names wrap; the table scrolls sideways inside its box when narrow. */
export const LongText: Story = {
  name: 'Long text',
  render: () => (
    <SectionCard title="Site manager" headingLevel={2} className="max-w-200">
      <Editable
        areas={[
          {
            id: 'sales',
            label: 'Sales invoices, advance invoices, credit and debit notes',
            description:
              'Including the documents sent to and received from the e-invoice system (SEF)',
          },
          ...AREAS.slice(1, 3),
        ]}
        actions={[
          { id: 'view', label: 'View and print' },
          { id: 'create', label: 'Create drafts' },
          { id: 'edit', label: 'Edit before sending' },
          { id: 'delete', label: 'Delete drafts' },
          { id: 'approve', label: 'Approve and send to SEF' },
        ]}
      />
    </SectionCard>
  ),
}

/** On a phone: each area with its actions one under the other. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <div className="p-4">
        <SectionCard title="Site manager" headingLevel={2}>
          <Editable layout="phone" />
        </SectionCard>
      </div>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('group', { name: /Sales invoices/ })).toBeVisible()
    const [edit] = canvas.getAllByRole('checkbox', { name: 'Edit' })
    if (edit === undefined) throw new Error('no Edit checkbox')
    await settle()
  },
}

export const PhoneWidthInteraction: Story = {
  name: 'Phone width, interaction',
  tags: ['interaction'],
  render: () => (
    <PhoneFrame>
      <div className="p-4">
        <SectionCard title="Site manager" headingLevel={2}>
          <Editable layout="phone" />
        </SectionCard>
      </div>
    </PhoneFrame>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('group', { name: /Sales invoices/ })).toBeVisible()
    const [edit] = canvas.getAllByRole('checkbox', { name: 'Edit' })
    if (edit === undefined) throw new Error('no Edit checkbox')
    await userEvent.click(edit)
    await expect(edit).toBeChecked()
  },
}

/** Arabic areas and actions; the first action column at the right. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <PermissionMatrix
        label="صلاحيات مدير الموقع"
        areas={[
          { id: 'sales', label: 'فواتير المبيعات' },
          { id: 'purchasing', label: 'فواتير الموردين' },
        ]}
        actions={[
          { id: 'view', label: 'عرض' },
          { id: 'create', label: 'إنشاء' },
          { id: 'edit', label: 'تعديل' },
        ]}
        value={{ sales: ['view'], purchasing: ['view', 'create'] }}
      />
    </StoryProvider>
  ),
}

/** Japanese areas and actions. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <PermissionMatrix
        label="現場監督の権限"
        areas={[
          { id: 'sales', label: '売上請求書' },
          { id: 'purchasing', label: '仕入請求書' },
        ]}
        actions={[
          { id: 'view', label: '表示' },
          { id: 'create', label: '作成' },
          { id: 'edit', label: '編集' },
        ]}
        value={{ sales: ['view'], purchasing: ['view', 'create'] }}
      />
    </StoryProvider>
  ),
}
