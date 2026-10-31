import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, waitFor, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { Button } from './button'
import { ARABIC, JAPANESE, LONG } from './field-story-data'
import { SaveStatus, type SaveState } from './save-status'
import { StoryProvider } from './story-frames'
import { TextField } from './text-field'

const meta = {
  title: 'Components/Feedback/SaveStatus',
  component: SaveStatus,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the quiet, inline answer to a routine save — "Saved" beside the ' +
          "action that saved (Save, a form's bar, a settings row, a panel). `state` is the " +
          "application's: 'saving' (a small ring and \"Saving…\"), 'saved' (a check and " +
          "\"Saved\" in the success colour, until the next edit sets 'idle'), 'error' (the " +
          'application\'s words, announced at once). "Saved" is announced politely; nothing ' +
          'needs closing and nothing covers the page (toasts never block).\n\n' +
          '**When not:** an outcome somewhere else ("Payroll posted", "Request sent") — a toast ' +
          '(`notice.success`), which closes by itself; a problem with a field — its error under ' +
          'the field; a lasting state of the page — Alert or Banner.',
      },
    },
  },
  args: { state: 'saved' },
  play: settle,
} satisfies Meta<typeof SaveStatus>

export default meta

type Story = StoryObj<typeof meta>

/** After a successful save: "Saved" beside the action. */
export const Default: Story = {
  render: (args) => (
    <div className="flex flex-wrap items-center gap-3">
      <Button intent="save" label="Save" />
      <SaveStatus {...args} />
    </div>
  ),
  play: async ({ canvasElement }) => {
    await expect(within(canvasElement).getByRole('status')).toHaveTextContent('Saved')
    await settle()
  },
}

/** Every state: idle (nothing), saving, saved, and an error in the application's words. */
export const States: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-4">
      {(['idle', 'saving', 'saved'] as const).map((state) => (
        <div key={state} className="flex flex-wrap items-center gap-3">
          <Button intent="save" label="Save" />
          <SaveStatus state={state} />
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <Button intent="save" label="Save" />
        <SaveStatus state="error" error="The connection was lost. Try again." />
      </div>
    </div>
  ),
}

function SaveRow() {
  const [state, setState] = useState<SaveState>('idle')
  const [name, setName] = useState('Kvadrat Gradnja d.o.o.')
  return (
    <div className="flex max-w-sm flex-col gap-3">
      <TextField
        label="Company name"
        value={name}
        onChange={(next) => {
          setName(next)
          setState('idle')
        }}
      />
      <div className="flex flex-wrap items-center justify-end gap-3">
        <SaveStatus state={state} />
        <Button
          intent="save"
          label="Save"
          onClick={() => {
            setState('saving')
            window.setTimeout(() => {
              setState('saved')
            }, 300)
          }}
        />
      </div>
    </div>
  )
}

/** Save: "Saving…", then "Saved" beside the button; the next edit clears it. */
export const SaveThenEdit: Story = {
  name: 'Save, then edit',
  tags: ['interaction'],
  render: () => <SaveRow />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('button', { name: 'Save' }))
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent('Saved'))
    await userEvent.type(canvas.getByRole('textbox', { name: 'Company name' }), ' x')
    await waitFor(() => expect(canvas.getByRole('status')).toHaveTextContent(''))
  },
}

/** Long words at phone width: they wrap beside the action, never past the screen. */
export const LongTextPhone: Story = {
  name: 'Long text, phone width',
  render: () => (
    <div className="flex w-[390px] max-w-full flex-col gap-3">
      <div className="flex flex-wrap items-center gap-3">
        <Button intent="save" label="Save" />
        <SaveStatus state="saved" savedText={LONG.label} />
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <Button intent="save" label="Save" />
        <SaveStatus state="error" error={LONG.error} />
      </div>
    </div>
  ),
}

/** Arabic sample text, right to left: the check at the start (right). */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <div className="flex flex-col items-start gap-3">
        <SaveStatus state="saved" savedText={ARABIC.value} />
        <SaveStatus state="error" error={ARABIC.error} />
      </div>
    </StoryProvider>
  ),
}

/** Japanese sample text. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <div className="flex flex-col items-start gap-3">
        <SaveStatus state="saved" savedText={JAPANESE.value} />
        <SaveStatus state="saving" savingText={JAPANESE.description} />
      </div>
    </StoryProvider>
  ),
}
