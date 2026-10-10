import type { Meta, StoryObj } from '@storybook/react-vite'
import { useState } from 'react'
import { expect, userEvent, within } from 'storybook/test'
import { settle } from '../primitives/story-helpers'
import { DocumentNotes, type DocumentNotesProps } from './document-blocks'
import { hasNotes, type DocumentNotesValue } from './document-logic'
import { NOTE_TEMPLATES } from './document-story-data'
import { ExampleProvider, PhoneFrame, StoryProvider } from './story-frames'
import { LONG } from './field-story-data'

/** The notes as the application keeps them: the value lives here. */
function Notes(
  props: Omit<DocumentNotesProps, 'value' | 'onChange'> & { start: DocumentNotesValue },
) {
  const { start, ...rest } = props
  const [value, setValue] = useState(start)
  return <DocumentNotes {...rest} value={value} onChange={setValue} />
}

const START: DocumentNotesValue = {
  templates: ['payment', 'advances'],
  note: 'Please quote the contract number 12/2026 with the payment.',
}

const meta = {
  title: 'Components/Documents/DocumentNotes',
  component: DocumentNotes,
  parameters: {
    docs: {
      description: {
        component:
          '**What for:** the notes block of a document (P5.18), after its totals: **template ' +
          'texts** chosen from the application’s list (payment terms, warranty, the legal ' +
          'basis of an exemption) and a **free note**. In view mode the texts in order, as the ' +
          'document shows them; in edit mode the templates are chosen by name ' +
          '(MultiSelectField, their texts under it) and the note is a text area. The texts are ' +
          'the Core’s; the component adds none.\n\n' +
          '**When:** in DocumentPage’s `notes` slot (a titled block in the fixed order). A ' +
          'document without notes passes no block (`hasNotes`), so nothing is rendered.\n\n' +
          '**When not:** comments and conversations about a document (side panel, Message ' +
          'family); internal remarks never printed (a record field).',
      },
    },
  },
  args: { templates: NOTE_TEMPLATES, value: START },
  render: (args) => (
    <ExampleProvider>
      <div className="max-w-180">
        <DocumentNotes {...args} />
      </div>
    </ExampleProvider>
  ),
  play: settle,
} satisfies Meta<typeof DocumentNotes>

export default meta

type Story = StoryObj<typeof meta>

/** Read-only: two template texts and the free note, as the document shows them. */
export const Default: Story = {
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent(/^Payment within 15 days.*as invoiced\.Please/)
  },
}

/** Edit mode: choose another template, write the note. */
export const Edit: Story = {
  render: () => (
    <ExampleProvider>
      <div className="max-w-180">
        <Notes mode="edit" templates={NOTE_TEMPLATES} start={START} />
      </div>
    </ExampleProvider>
  ),
  play: async () => {
    await settle()
  },
}

export const EditInteraction: Story = {
  name: 'Edit, interaction',
  tags: ['interaction'],
  render: () => (
    <ExampleProvider>
      <div className="max-w-180">
        <Notes mode="edit" templates={NOTE_TEMPLATES} start={START} />
      </div>
    </ExampleProvider>
  ),
  play: async ({ canvasElement }) => {
    await settle()
    const canvas = within(canvasElement)
    const field = canvas.getByRole('combobox', { name: 'Standard texts' })
    await userEvent.click(field)
    await userEvent.type(field, 'Warr')
    await userEvent.click(await within(document.body).findByRole('option', { name: 'Warranty' }))
    await userEvent.keyboard('{Escape}')
    await expect(canvasElement).toHaveTextContent('Warranty on the steel structure')
    const note = canvas.getByRole('textbox', { name: 'Note' })
    await userEvent.clear(note)
    await userEvent.type(note, 'Delivery on Friday.')
    await expect(note).toHaveValue('Delivery on Friday.')
  },
}

/** Nothing chosen and no note: the application does not render the block. */
export const Empty: Story = {
  render: () => {
    const value = { templates: [], note: '' }
    return (
      <ExampleProvider>
        <p className="m-0 text-sm text-secondary">
          {hasNotes(NOTE_TEMPLATES, value) ? 'Notes block shown.' : 'No notes: no block.'}
        </p>
        <DocumentNotes templates={NOTE_TEMPLATES} value={value} />
      </ExampleProvider>
    )
  },
  play: async ({ canvasElement }) => {
    await settle()
    await expect(canvasElement).toHaveTextContent('No notes: no block.')
  },
}

/** Labels from the application instead of the defaults. */
export const OwnLabels: Story = {
  name: 'Own labels',
  render: () => (
    <ExampleProvider>
      <div className="max-w-180">
        <Notes
          mode="edit"
          templates={NOTE_TEMPLATES}
          start={START}
          templatesLabel="Texts printed on the invoice"
          noteLabel="Note to the customer"
        />
      </div>
    </ExampleProvider>
  ),
}

/** A long note keeps its line breaks and wraps. */
export const LongText: Story = {
  name: 'Long text',
  args: {
    value: {
      templates: ['payment', 'warranty', 'advances', 'retention'],
      note: `${LONG.description}\nSecond paragraph: ${LONG.value}`,
    },
  },
}

/** Phone width, edit mode. */
export const PhoneWidth: Story = {
  name: 'Phone width',
  render: () => (
    <PhoneFrame>
      <div className="p-4">
        <ExampleProvider>
          <Notes mode="edit" templates={NOTE_TEMPLATES} start={START} />
        </ExampleProvider>
      </div>
    </PhoneFrame>
  ),
}

/** Arabic texts in a right-to-left page. */
export const Arabic: Story = {
  render: () => (
    <StoryProvider locale="ar">
      <ExampleProvider>
        <DocumentNotes
          templates={[{ value: 'p', label: 'شروط الدفع', text: 'الدفع خلال 15 يومًا.' }]}
          value={{ templates: ['p'], note: 'يرجى ذكر رقم العقد عند الدفع.' }}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}

/** Japanese texts, edit mode. */
export const Japanese: Story = {
  render: () => (
    <StoryProvider locale="ja">
      <ExampleProvider>
        <Notes
          mode="edit"
          templates={[
            { value: 'p', label: '支払条件', text: '請求書発行日から15日以内にお支払いください。' },
          ]}
          start={{ templates: ['p'], note: '契約番号を記載してください。' }}
        />
      </ExampleProvider>
    </StoryProvider>
  ),
}
