import type { Meta, StoryObj } from '@storybook/react-vite'
import { BookCheck, ShieldCheck, Signature } from 'lucide-react'
import type { ReactNode } from 'react'
import { Button, CompactIconButton, IconButton } from './button'
import { FAMILY_NAMES, INTENT_NAMES, INTENTS, type Emphasis } from './intents'

const EMPHASES: readonly Emphasis[] = ['primary', 'secondary', 'menu']

/** One example action per family, as a module might declare it (fictitious labels). */
const FAMILY_EXAMPLES = {
  primary: { icon: INTENTS.save.icon, label: 'Save' },
  verify: { icon: ShieldCheck, label: 'Verify' },
  document: { icon: INTENTS.pdf.icon, label: 'PDF' },
  positive: { icon: BookCheck, label: 'Post' },
  destructive: { icon: INTENTS.delete.icon, label: 'Delete' },
  caution: { icon: INTENTS.cancel.icon, label: 'Void' },
  neutral: { icon: INTENTS.edit.icon, label: 'Edit' },
} as const

function Surface({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-default bg-surface-raised p-4">
      {children}
    </div>
  )
}

function FamilyTable({ disabled = false }: { disabled?: boolean }) {
  return (
    <table className="border-collapse">
      <caption className="pb-2 text-start text-h4">
        {disabled ? 'Disabled' : 'Families × emphasis'}
      </caption>
      <thead>
        <tr>
          <th scope="col" className="pe-4 text-start text-sm font-regular text-secondary">
            Family
          </th>
          {EMPHASES.map((emphasis) => (
            <th
              key={emphasis}
              scope="col"
              className="px-2 pb-2 text-start text-sm font-regular text-secondary"
            >
              {emphasis}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {FAMILY_NAMES.map((family) => (
          <tr key={family}>
            <th scope="row" className="pe-4 text-start text-sm font-regular text-secondary">
              {family}
            </th>
            {EMPHASES.map((emphasis) => (
              <td key={emphasis} className="p-2">
                <Button
                  family={family}
                  icon={FAMILY_EXAMPLES[family].icon}
                  label={FAMILY_EXAMPLES[family].label}
                  emphasis={emphasis}
                  disabled={disabled}
                />
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** an action. Choose an `intent` (save, delete, pdf, back, …; Appendix A.6): ' +
          'its family, emphasis, icon and whether it confirms come with it. For any other action, ' +
          'choose a `family` (primary, verify, document, positive, destructive, caution, neutral) ' +
          'and an `icon`. Never a colour: blue means confirm and red means destructive, everywhere. ' +
          '`label` is always given by the application.\n\n' +
          '**Emphasis:** primary = filled, secondary = light (neutral: default, with a border), ' +
          'menu = text only. One primary-emphasis button per screen; the main action is last in its ' +
          'group.\n\n' +
          '**When not:** navigation to another page is a link; an unavailable action shows its ' +
          'reason as text (unavailable action, P2.7); a row of actions goes into ActionGroup (P2.7). ' +
          'Use IconButton (the same 36px button, only the icon) only where the icon is ' +
          'universally understood; its label is the accessible name. CompactIconButton (28px, ' +
          'neutral and subtle) only in tight places: table row menus, close buttons.',
      },
    },
  },
  args: { intent: 'save', label: 'Save' },
} satisfies Meta<typeof Button>

export default meta

type Story = StoryObj<typeof meta>

/** The save intent: primary family, filled. */
export const Default: Story = {}

/** Every family in every emphasis. */
export const Families: Story = {
  render: () => (
    <Surface>
      <FamilyTable />
    </Surface>
  ),
}

/** Every interface intent of Appendix A.6 at its default emphasis. */
export const Intents: Story = {
  render: () => (
    <Surface>
      <ul className="m-0 grid list-none grid-cols-2 gap-3 p-0 sm:grid-cols-4">
        {INTENT_NAMES.map((intent) => (
          <li key={intent} className="flex flex-col items-start gap-1">
            <code dir="ltr" className="font-mono text-xs text-secondary">
              {intent}
            </code>
            <Button intent={intent} label={`${intent.charAt(0).toUpperCase()}${intent.slice(1)}`} />
          </li>
        ))}
      </ul>
    </Surface>
  ),
}

/** Disabled: the surface's disabled colours in every emphasis. The reason is shown by P2.7. */
export const Disabled: Story = {
  render: () => (
    <Surface>
      <FamilyTable disabled />
    </Surface>
  ),
}

/** Button and IconButton: 36px. CompactIconButton: 28px, neutral and subtle by default. */
export const Sizes: Story = {
  render: () => (
    <Surface>
      <div className="flex flex-wrap items-center gap-3">
        <Button intent="save" label="Save" />
        <Button intent="cancel" label="Cancel" />
        <IconButton intent="edit" label="Edit" />
        <IconButton icon={Signature} family="verify" label="Sign" />
        <IconButton intent="save" label="Save" emphasis="primary" disabled />
        <CompactIconButton intent="more" label="Row actions" />
        <CompactIconButton icon={Signature} label="Sign" />
        <CompactIconButton intent="delete" label="Delete" emphasis="secondary" />
      </div>
    </Surface>
  ),
}

/** CompactIconButton in its tight places: a row's actions menu and a close button. */
export const CompactPlaces: Story = {
  render: () => (
    <Surface>
      <div className="flex items-center justify-between gap-3 border-b border-subtle pb-2">
        <span>Order 2026-0142</span>
        <CompactIconButton intent="more" label="Actions for order 2026-0142" />
      </div>
      <div className="flex items-center justify-between gap-3">
        <span className="text-h4">Filters</span>
        <CompactIconButton intent="cancel" label="Close" />
      </div>
    </Surface>
  ),
}

/** A family action with its own icon, and emphasis raised or lowered. */
export const FamilyAction: Story = {
  render: () => (
    <Surface>
      <div className="flex flex-wrap items-center gap-3">
        <Button family="verify" icon={Signature} label="Sign" />
        <Button family="verify" icon={Signature} label="Sign" emphasis="primary" />
        <Button intent="delete" label="Delete" emphasis="secondary" />
        <Button intent="pdf" label="PDF" emphasis="menu" />
        <Button intent="save" label="Save" type="submit" />
      </div>
    </Surface>
  ),
}

/** Icon buttons: the label is the accessible name and the tooltip. */
export const IconButtons: Story = {
  render: () => (
    <Surface>
      <div className="flex flex-wrap items-center gap-2">
        {INTENT_NAMES.map((intent) => (
          <IconButton key={intent} intent={intent} label={intent} />
        ))}
      </div>
    </Surface>
  ),
}

/** A label never wraps; a long one stays on one line. The main action is last. */
export const LongText: Story = {
  render: () => (
    <Surface>
      <div className="flex flex-wrap items-center gap-3">
        <Button intent="cancel" label="Cancel" />
        <Button
          intent="confirm"
          label="Confirm the transfer of every selected document to the archive"
        />
      </div>
    </Surface>
  ),
}

/** At phone width, the actions of a form, main action last. */
export const PhoneWidth: Story = {
  render: () => (
    <div className="w-[390px] max-w-full">
      <Surface>
        <div className="flex flex-wrap justify-end gap-2">
          <Button intent="back" label="Back" />
          <Button intent="cancel" label="Cancel" />
          <Button intent="next" label="Next" />
        </div>
      </Surface>
    </div>
  ),
}

/** Arabic labels (sample text). Direction arrows mirror in right-to-left. */
export const Arabic: Story = {
  render: () => (
    <Surface>
      <div lang="ar" className="flex flex-wrap items-center gap-3">
        <Button intent="back" label="رجوع" />
        <Button intent="delete" label="حذف" emphasis="secondary" />
        <Button intent="save" label="حفظ" />
      </div>
    </Surface>
  ),
}

/** Japanese labels (sample text). */
export const Japanese: Story = {
  render: () => (
    <Surface>
      <div lang="ja" className="flex flex-wrap items-center gap-3">
        <Button intent="cancel" label="キャンセル" />
        <Button intent="print" label="印刷" emphasis="secondary" />
        <Button intent="save" label="保存" />
      </div>
    </Surface>
  ),
}
