import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, fn, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { CodeInput } from './code-input'
import { LONG } from './field-story-data'
import { PhoneFrame, StoryProvider } from './story-frames'

const meta = {
  title: 'Components/Sign-in/CodeInput',
  component: CodeInput,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** a one-time code (from an authenticator app, a text message, an e-mail) ' +
          'in separate boxes — one accessible group named by the label, each box "Character 2 ' +
          'of 6".\n\n' +
          '**Keys and paste:** a character fills its box and moves on; Backspace empties the box ' +
          'or the one before; the arrows, Home and End move. **Pasting the whole code works in ' +
          'any box**; the first box has `autocomplete="one-time-code"` and numeric codes bring ' +
          'the numeric keyboard. The code is written left to right in every language, and the ' +
          'arrows follow it. `onComplete` receives the code when every box is filled.\n\n' +
          '**When:** the second step of a sign-in, confirming an e-mail address or a phone.\n\n' +
          '**When not:** a password (PasswordField); a recovery code (one TextField: it has ' +
          'dashes and letters and is pasted whole).',
      },
    },
  },
  args: {
    label: 'Code from the authenticator app',
    onChange: fn(),
    onComplete: fn(),
  },
  render: (args) => <CodeInput {...args} />,
  play: settle,
} satisfies Meta<typeof CodeInput>

export default meta

type Story = StoryObj<typeof meta>

/** Typed: each digit moves on; the last one completes the code. */
export const Default: Story = {
  args: { description: 'The six digits change every 30 seconds.' },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('group', { name: 'Code from the authenticator app' }),
    ).toBeVisible()
    const first = canvas.getByRole('textbox', { name: 'Character 1 of 6' })
    await expect(first).toHaveAttribute('autocomplete', 'one-time-code')
    await expect(first).toHaveAttribute('inputmode', 'numeric')
    await settle()
  },
}

export const DefaultInteraction: Story = {
  name: 'Default, interaction',
  tags: ['interaction'],
  args: { description: 'The six digits change every 30 seconds.' },
  play: async ({ canvasElement, args }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('group', { name: 'Code from the authenticator app' }),
    ).toBeVisible()
    const first = canvas.getByRole('textbox', { name: 'Character 1 of 6' })
    await expect(first).toHaveAttribute('autocomplete', 'one-time-code')
    await expect(first).toHaveAttribute('inputmode', 'numeric')
    await userEvent.click(first)
    await userEvent.keyboard('48291')
    await expect(canvas.getByRole('textbox', { name: 'Character 6 of 6' })).toHaveFocus()
    // Letters are not part of a numeric code.
    await userEvent.keyboard('x')
    await expect(canvas.getByRole('textbox', { name: 'Character 6 of 6' })).toHaveValue('')
    await userEvent.keyboard('3')
    await expect(args.onComplete).toHaveBeenCalledWith('482913')
  },
}

/** The whole code pasted into the fourth box fills every box from the first. */
export const PasteAnywhere: Story = {
  name: 'Paste into any box',
  tags: ['interaction'],
  play: async ({ canvasElement, args }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('textbox', { name: 'Character 4 of 6' }))
    await userEvent.paste('482 913')
    const boxes = canvas.getAllByRole('textbox')
    await expect(boxes.map((box) => (box as HTMLInputElement).value).join('')).toBe('482913')
    await expect(args.onComplete).toHaveBeenCalledWith('482913')
  },
}

/** Backspace and the arrows move between the boxes; the code reads left to right. */
export const Keyboard: Story = {
  args: { defaultValue: '4829' },
  play: async () => {
    await settle()
  },
}

export const KeyboardInteraction: Story = {
  name: 'Keyboard, interaction',
  tags: ['interaction'],
  args: { defaultValue: '4829' },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const box = (n: number) => canvas.getByRole('textbox', { name: `Character ${String(n)} of 6` })
    await userEvent.click(box(5))
    // An empty box: Backspace empties the one before and moves there.
    await userEvent.keyboard('{Backspace}')
    await expect(box(4)).toHaveFocus()
    await expect(box(4)).toHaveValue('')
    await userEvent.keyboard('{ArrowLeft}')
    await expect(box(3)).toHaveFocus()
    await userEvent.keyboard('{Home}')
    await expect(box(1)).toHaveFocus()
    await userEvent.keyboard('{End}')
    await expect(box(6)).toHaveFocus()
    await userEvent.keyboard('{ArrowRight}')
    await expect(box(6)).toHaveFocus()
  },
}

/** A controlled code: the application keeps the value. */
export const Controlled: Story = {
  tags: ['interaction'],
  render: (args) => {
    function Example() {
      const [value, setValue] = useState('')
      return (
        <div className="flex flex-col gap-2">
          <CodeInput {...args} value={value} onChange={setValue} name="code" />
          <p className="m-0 text-xs text-secondary">Value: “{value}”</p>
        </div>
      )
    }
    return <Example />
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('textbox', { name: 'Character 1 of 6' }))
    await userEvent.keyboard('12')
    await expect(canvas.getByText('Value: “12”')).toBeVisible()
  },
}

/** Letters and digits: an e-mailed code, taken in upper case. */
export const Alphanumeric: Story = {
  args: {
    label: 'Code from the e-mail',
    kind: 'alphanumeric',
    length: 8,
    description: 'Sent to milica.petrovic@kvadratgradnja.rs at 10:42.',
    autoFocus: true,
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox', { name: 'Character 1 of 8' })).toHaveFocus()
    await settle()
  },
}

export const AlphanumericInteraction: Story = {
  name: 'Alphanumeric, interaction',
  tags: ['interaction'],
  args: {
    label: 'Code from the e-mail',
    kind: 'alphanumeric',
    length: 8,
    description: 'Sent to milica.petrovic@kvadratgradnja.rs at 10:42.',
    autoFocus: true,
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    await expect(canvas.getByRole('textbox', { name: 'Character 1 of 8' })).toHaveFocus()
    await userEvent.keyboard('k7q')
    await expect(canvas.getByRole('textbox', { name: 'Character 3 of 8' })).toHaveValue('Q')
  },
}

/** The Core refused the code: the error under the boxes, every box invalid. */
export const WithError: Story = {
  name: 'Error',
  args: {
    defaultValue: '482931',
    error: 'The code is wrong or has expired. Wait for a new one.',
    required: true,
  },
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const first = canvas.getByRole('textbox', { name: 'Character 1 of 6' })
    await expect(first).toHaveAttribute('aria-invalid', 'true')
    await expect(first).toHaveAccessibleDescription(/The code is wrong/)
  },
}

/** Waiting before a new attempt: the reason under the boxes. */
export const Disabled: Story = {
  name: 'Disabled with reason',
  args: {
    disabled: true,
    disabledReason: 'Too many attempts. A new code can be asked for at 11:05.',
  },
}

/** Long label and description wrap; the boxes keep their size. */
export const LongText: Story = {
  name: 'Long text',
  args: { label: LONG.label, description: LONG.description, error: LONG.error },
}

/** At phone width six boxes fit 360px with the page's padding. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: (args) => (
    <PhoneFrame>
      <div className="p-4">
        <CodeInput {...args} description="Sent to +381 64 ••• 12 34." />
      </div>
    </PhoneFrame>
  ),
}

/** Arabic: the label right to left, the code still left to right, at the page's start. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <CodeInput
        label="رمز التحقق"
        description="أدخل الرمز المكون من ستة أرقام."
        defaultValue="4829"
      />
    </StoryProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const group = within(canvasElement).getByRole('group')
    await expect(group).toHaveAttribute('dir', 'ltr')
  },
}

/** Japanese label. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <CodeInput label="確認コード" description="認証アプリに表示された6桁のコード" />
    </StoryProvider>
  ),
}
