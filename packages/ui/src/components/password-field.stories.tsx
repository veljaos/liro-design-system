import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { PasswordField } from './password-field'
import { PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Sign-in/PasswordField',
  component: PasswordField,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a password, with a show / hide toggle (28px, at the field’s end, named ' +
          '"Show password", pressed while the text is shown). Paste always works — a password ' +
          'manager pastes (WCAG 3.3.8) —, `autoComplete` is "current-password" to sign in or ' +
          '"new-password" when choosing one, and a note says when Caps Lock is on. The text is ' +
          'written left to right in every language.\n\n' +
          '**When:** the password step of a sign-in (after EmailFirstForm), a new password.\n\n' +
          '**When not:** a one-time code (CodeInput); an API key the user copies (TextField ' +
          'read-only with `direction="ltr"`).',
      },
    },
  },
  args: { label: 'Password' },
  render: (args) => (
    <div className="max-w-90">
      <PasswordField {...args} />
    </div>
  ),
  play: settle,
} satisfies Meta<typeof PasswordField>

export default meta

type Story = StoryObj<typeof meta>

/** Typed, shown with the toggle, hidden again; the caret stays in the field. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const field = canvas.getByLabelText('Password')
    await expect(field).toHaveAttribute('type', 'password')
    await expect(field).toHaveAttribute('autocomplete', 'current-password')
    await settle()
  },
}

export const DefaultInteraction: Story = {
  name: 'Default, interaction',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const field = canvas.getByLabelText('Password')
    await expect(field).toHaveAttribute('type', 'password')
    await expect(field).toHaveAttribute('autocomplete', 'current-password')
    await userEvent.type(field, 'Kvadrat#2026')
    const toggle = canvas.getByRole('button', { name: 'Show password' })
    await expect(toggle).toHaveAttribute('aria-pressed', 'false')
    await userEvent.click(toggle)
    await expect(field).toHaveAttribute('type', 'text')
    await expect(toggle).toHaveAttribute('aria-pressed', 'true')
    await expect(field).toHaveValue('Kvadrat#2026')
    await expect(field).toHaveFocus()
    // The keyboard reaches the toggle after the field.
    await userEvent.tab()
    await expect(toggle).toHaveFocus()
    await userEvent.keyboard('{Enter}')
    await expect(field).toHaveAttribute('type', 'password')
  },
}

/** Pasting works: nothing blocks it. */
export const Paste: Story = {
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const field = within(canvasElement).getByLabelText('Password')
    await userEvent.click(field)
    await userEvent.paste('x7!Q-pasted-by-a-password-manager')
    await expect(field).toHaveValue('x7!Q-pasted-by-a-password-manager')
  },
}

/** Caps Lock on: the note under the field, announced politely. */
export const CapsLock: Story = {
  name: 'Caps Lock on',
  tags: ['interaction'],
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const field = canvas.getByLabelText('Password')
    await userEvent.click(field)
    await userEvent.keyboard('{CapsLock}K')
    await expect(canvas.getByText('Caps Lock is on')).toBeVisible()
    await expect(field).toHaveAccessibleDescription(/Caps Lock is on/)
  },
}

/** A new password, with the rules as its description. */
export const NewPassword: Story = {
  name: 'New password',
  args: {
    label: 'New password',
    autoComplete: 'new-password',
    description: 'At least 12 characters. A sentence is easier to remember than symbols.',
    required: true,
  },
}

/** The Core refused it: the error under the field. */
export const WithError: Story = {
  name: 'Error',
  args: {
    defaultValue: 'kvadrat',
    error: 'The e-mail or the password is wrong. 2 attempts are left before a 15-minute pause.',
  },
}

/** Paused after too many attempts: the reason under the field. */
export const Disabled: Story = {
  name: 'Disabled with reason',
  args: { disabled: true, disabledReason: 'Too many attempts. Try again at 11:05.' },
}

/** Long label, description and error wrap. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    label: LONG.label,
    description: LONG.description,
    error: LONG.error,
    defaultValue: 'a-very-long-password-that-a-password-manager-made-for-this-account-2026',
  },
}

/** At phone width. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <PasswordField {...args} defaultValue="Kvadrat#2026" />
      </div>
    </PhoneFrame>
  ),
}

/** Arabic label; the toggle stands at the field's end (its left in right-to-left). */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div className="max-w-90">
        <PasswordField label="كلمة المرور" error={ARABIC.error} defaultValue="Kvadrat#2026" />
      </div>
    </StoryProvider>
  ),
}

/** Japanese label. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <div className="max-w-90">
        <PasswordField label="パスワード" description={JAPANESE.description} />
      </div>
    </StoryProvider>
  ),
}
