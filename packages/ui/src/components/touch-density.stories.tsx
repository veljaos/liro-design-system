import type { Meta, StoryObj } from '@storybook/react-vite'
import { Copy, Pencil, Trash2 } from 'lucide-react'
import { expect, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button, CompactIconButton, IconButton } from './button'
import { CheckboxField, SwitchField } from './checkbox-field'
import { DropdownMenu } from './dropdown-menu'
import { Tabs } from './navigation'
import { SelectField } from './select-field'
import { StoryProvider } from './story-frames'
import { TextField } from './text-field'

/** The same controls in both densities. */
function Controls({ menu = false }: { menu?: boolean }) {
  return (
    <div className="flex w-80 flex-col gap-4">
      <div className="flex flex-wrap items-center gap-2">
        <Button intent="save" label="Save" />
        <IconButton intent="edit" label="Edit" />
        <CompactIconButton icon={Trash2} label="Remove line" />
        <DropdownMenu
          defaultOpen={menu}
          trigger={<IconButton intent="more" label="More" />}
          entries={[
            { label: 'Duplicate', icon: Copy, onSelect: () => undefined },
            { label: 'Rename', icon: Pencil, onSelect: () => undefined },
          ]}
        />
      </div>
      <TextField label="Customer" defaultValue="Kvadrat Gradnja" />
      <SelectField
        label="Register"
        defaultValue="2"
        options={[
          { value: '1', label: 'Kasa 1' },
          { value: '2', label: 'Kasa 2' },
        ]}
      />
      <CheckboxField label="Print the receipt" defaultChecked />
      <SwitchField label="Sound on scan" defaultChecked />
      <Tabs
        label="Views"
        items={[
          { value: 'sale', label: 'Sale', content: null },
          { value: 'returns', label: 'Returns', content: null },
        ]}
      />
    </div>
  )
}

const meta = {
  title: 'Components/POS/Touch density',
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a till, a kiosk or a handheld, used with fingers. `LiroProvider ' +
          'density="touch"` raises every target inside to at least 44px: buttons, icon buttons ' +
          '(28px ones too), fields and selects, menu items and options, tabs and toggles, and the ' +
          'rows of checkboxes, radios and switches — overlays included, since they render inside ' +
          'the provider. Nothing else changes: the same tokens, the same look. A nested provider ' +
          'keeps it (touch is never lowered inside a touch screen).\n\n' +
          '**When:** PosShell, PickList, StockCount, any screen made for fingers.\n\n' +
          '**When not:** the back office (the desktop sizes are denser on purpose).',
      },
    },
  },
  render: () => (
    <div className="flex flex-wrap items-start gap-12">
      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-h5 font-semibold text-primary">Default</h2>
        <Controls />
      </section>
      <section className="flex flex-col gap-3">
        <h2 className="m-0 text-h5 font-semibold text-primary">Touch</h2>
        <StoryProvider density="touch">
          <Controls />
        </StoryProvider>
      </section>
    </div>
  ),
  play: settle,
} satisfies Meta

export default meta

type Story = StoryObj<typeof meta>

/** The same controls, desktop and touch: every target 44px or more on the right. */
export const Default: Story = {
  name: 'Default and touch',
  play: async ({ canvasElement }) => {
    await settle()
    const buttons = within(canvasElement).getAllByRole('button', { name: 'Remove line' })
    const [desktop, touch] = buttons.map((button) => button.getBoundingClientRect())
    await expect(desktop?.height).toBe(28)
    await expect(touch?.height).toBeGreaterThanOrEqual(44)
    await expect(touch?.width).toBeGreaterThanOrEqual(44)
  },
}

/** A menu opened in touch density: 44px items. */
export const Menu: Story = {
  name: 'Touch, menu open',
  render: () => (
    <StoryProvider density="touch">
      <Controls menu />
    </StoryProvider>
  ),
  play: async () => {
    await settle()
    const item = within(document.body).getByRole('menuitem', { name: 'Duplicate' })
    await expect(item.getBoundingClientRect().height).toBeGreaterThanOrEqual(44)
  },
}

/** On a phone. */
export const Phone: Story = {
  name: 'Phone width',
  render: () => (
    <div style={{ width: 360 }}>
      <StoryProvider density="touch">
        <Controls />
      </StoryProvider>
    </div>
  ),
}

/** Arabic, right to left. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar" density="touch">
      <div className="flex w-80 flex-col gap-4">
        <Button intent="save" label="حفظ" />
        <TextField label="العميل" defaultValue="شركة النور" />
        <CheckboxField label="طباعة الإيصال" defaultChecked />
      </div>
    </StoryProvider>
  ),
}

/** Japanese. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja" density="touch">
      <div className="flex w-80 flex-col gap-4">
        <Button intent="save" label="保存" />
        <TextField label="顧客" defaultValue="株式会社さくら商事" />
        <SwitchField label="スキャン音" defaultChecked />
      </div>
    </StoryProvider>
  ),
}
